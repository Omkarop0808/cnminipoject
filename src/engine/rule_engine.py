import os
import re
import yaml
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from .normalizer import NormalizedEvent

class RuleMatchResult(BaseModel):
    rule_id: str
    rule_name: str
    severity: str
    mitre_attack: Optional[str] = None
    rationale: str
    matched_conditions: List[Dict[str, Any]] = Field(default_factory=list)

def get_field_value(event: NormalizedEvent, field_path: str) -> Any:
    """Extracts field value from event using dot notation (e.g., 'process.image_name')."""
    parts = field_path.split(".")
    curr: Any = event
    for p in parts:
        if isinstance(curr, dict):
            curr = curr.get(p)
        elif hasattr(curr, p):
            curr = getattr(curr, p)
        else:
            return None
    return curr

class RuleEngine:
    def __init__(self, rules_file_path: Optional[str] = None):
        if rules_file_path is None:
            rules_file_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "config", "detection_rules.yaml")
            )
        self.rules_file_path = rules_file_path
        self.rules: List[Dict[str, Any]] = []
        self._compiled_regexes: Dict[str, re.Pattern] = {}
        self.load_rules()

    def load_rules(self) -> int:
        """Loads and parses detection rules from the YAML configuration."""
        if not os.path.exists(self.rules_file_path):
            self.rules = []
            return 0

        with open(self.rules_file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        raw_rules = data.get("rules", [])
        self.rules = raw_rules
        self._compiled_regexes.clear()

        # Precompile regular expressions
        for rule in self.rules:
            self._precompile_conditions(rule.get("conditions", {}))
            for supp in rule.get("suppression", []):
                self._precompile_conditions(supp)

        return len(self.rules)

    def _precompile_conditions(self, cond_tree: Dict[str, Any]):
        if not cond_tree or not isinstance(cond_tree, dict):
            return

        if "field" in cond_tree and cond_tree.get("operator") == "regex":
            val = cond_tree.get("value")
            if val and val not in self._compiled_regexes:
                try:
                    self._compiled_regexes[val] = re.compile(val, re.IGNORECASE)
                except re.error:
                    pass

        for key in ("all_of", "any_of", "none_of"):
            for child in cond_tree.get(key, []):
                self._precompile_conditions(child)

    def _eval_single_condition(self, cond: Dict[str, Any], event: NormalizedEvent) -> Tuple[bool, Optional[Dict[str, Any]]]:
        if not cond or not isinstance(cond, dict):
            return False, None

        # Handle composite conditions inside a leaf
        if "all_of" in cond or "any_of" in cond or "none_of" in cond:
            return self._eval_condition_tree(cond, event)

        field = cond.get("field")
        if not field:
            return False, None

        op = cond.get("operator", "equals").lower()
        expected = cond.get("value")

        actual = get_field_value(event, field)
        actual_str = str(actual or "")
        expected_str = str(expected or "")

        matched = False

        if op == "equals":
            matched = (actual_str == expected_str)
        elif op == "equals_ignore_case":
            matched = (actual_str.lower() == expected_str.lower())
        elif op == "not_equals":
            matched = (actual_str != expected_str)
        elif op == "not_equals_ignore_case":
            matched = (actual_str.lower() != expected_str.lower())
        elif op == "contains":
            matched = (expected_str in actual_str)
        elif op == "contains_ignore_case":
            matched = (expected_str.lower() in actual_str.lower())
        elif op == "starts_with":
            matched = actual_str.lower().startswith(expected_str.lower())
        elif op == "ends_with":
            matched = actual_str.lower().endswith(expected_str.lower())
        elif op == "in":
            if isinstance(expected, list):
                matched = any(actual_str.lower() == str(item).lower() for item in expected)
            else:
                matched = actual_str.lower() in expected_str.lower()
        elif op == "not_in":
            if isinstance(expected, list):
                matched = not any(actual_str.lower() == str(item).lower() for item in expected)
            else:
                matched = actual_str.lower() not in expected_str.lower()
        elif op == "in_writable_path":
            writable_patterns = [
                r"(?i)\\appdata\\",
                r"(?i)\\temp\\",
                r"(?i)\\users\\public\\",
                r"(?i)%appdata%",
                r"(?i)%temp%"
            ]
            matched = any(bool(re.search(pat, actual_str)) for pat in writable_patterns)
        elif op == "regex":
            pattern = self._compiled_regexes.get(expected)
            if not pattern:
                try:
                    pattern = re.compile(expected, re.IGNORECASE)
                    self._compiled_regexes[expected] = pattern
                except re.error:
                    pattern = None
            if pattern:
                matched = bool(pattern.search(actual_str))

        proof = {
            "field": field,
            "operator": op,
            "expected": expected,
            "actual": actual_str,
            "matched": matched
        }
        return matched, proof

    def _eval_condition_tree(self, tree: Dict[str, Any], event: NormalizedEvent) -> Tuple[bool, List[Dict[str, Any]]]:
        proofs: List[Dict[str, Any]] = []

        if "all_of" in tree:
            for c in tree["all_of"]:
                res, proof = self._eval_condition_tree(c, event) if any(k in c for k in ("all_of", "any_of", "none_of")) else self._eval_single_condition(c, event)
                if proof:
                    if isinstance(proof, list):
                        proofs.extend(proof)
                    else:
                        proofs.append(proof)
                if not res:
                    return False, proofs
            return True, proofs

        if "any_of" in tree:
            any_matched = False
            for c in tree["any_of"]:
                res, proof = self._eval_condition_tree(c, event) if any(k in c for k in ("all_of", "any_of", "none_of")) else self._eval_single_condition(c, event)
                if proof:
                    if isinstance(proof, list):
                        proofs.extend(proof)
                    else:
                        proofs.append(proof)
                if res:
                    any_matched = True
            return any_matched, proofs

        if "none_of" in tree:
            for c in tree["none_of"]:
                res, proof = self._eval_condition_tree(c, event) if any(k in c for k in ("all_of", "any_of", "none_of")) else self._eval_single_condition(c, event)
                if proof:
                    if isinstance(proof, list):
                        proofs.extend(proof)
                    else:
                        proofs.append(proof)
                if res:
                    return False, proofs
            return True, proofs

        # Single leaf
        res, proof = self._eval_single_condition(tree, event)
        return res, [proof] if proof else []

    def evaluate_event(self, event: NormalizedEvent) -> List[RuleMatchResult]:
        """
        Evaluates a normalized event against all active rules.
        Returns list of matched RuleMatchResult objects.
        """
        matches: List[RuleMatchResult] = []

        for rule in self.rules:
            # Check suppression
            suppressed = False
            for supp_cond in rule.get("suppression", []):
                s_res, _ = self._eval_single_condition(supp_cond, event)
                if s_res:
                    suppressed = True
                    break

            if suppressed:
                continue

            conditions = rule.get("conditions", {})
            matched, proofs = self._eval_condition_tree(conditions, event)

            if matched:
                matches.append(RuleMatchResult(
                    rule_id=rule["rule_id"],
                    rule_name=rule["name"],
                    severity=rule.get("severity", "MEDIUM"),
                    mitre_attack=rule.get("mitre_attack"),
                    rationale=rule.get("rationale", rule.get("description", "")),
                    matched_conditions=[p for p in proofs if p.get("matched")]
                ))

        return matches
