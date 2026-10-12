import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, CheckCircle2, ShieldAlert, Code } from 'lucide-react';
import { fetchRules, reloadRules, RuleItem } from '../services/api';

export const RuleManager: React.FC = () => {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await fetchRules();
      setRules(data.rules || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleReload = async () => {
    setReloading(true);
    try {
      await reloadRules();
      await loadRules();
    } catch (e) {
      alert('Failed to reload rules');
    } finally {
      setReloading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-panel border border-border-dim rounded-lg overflow-hidden text-xs">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-border-dim bg-surface-subtle/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Deterministic Threat Detection Rules</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Active Rules: {rules.length} loaded from config/detection_rules.yaml
          </p>
        </div>

        <button
          onClick={handleReload}
          disabled={reloading}
          className="px-3 py-1 bg-surface-bg hover:bg-surface-subtle border border-border-dim text-white rounded font-medium flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          <span>{reloading ? 'Reloading...' : 'Hot Reload Rules'}</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Loading detection rules...</span>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.rule_id}
              className="p-3.5 bg-surface-bg rounded border border-border-dim space-y-2 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-blue-400 font-bold">{rule.rule_id}</span>
                  <span className="text-sm font-semibold text-white">{rule.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {rule.mitre_attack && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      MITRE {rule.mitre_attack}
                    </span>
                  )}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(rule.severity)}`}>
                    {rule.severity}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {rule.description}
              </p>

              <div className="pt-2 border-t border-border-dim text-[11px] text-slate-400">
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Rationale:</span>
                {rule.rationale}
              </div>

              {/* Conditions Code view */}
              <div className="pt-1">
                <details className="text-[10px] font-mono">
                  <summary className="text-slate-500 hover:text-slate-300 cursor-pointer select-none">
                    View Condition Logic (YAML AST)
                  </summary>
                  <pre className="mt-2 p-2 bg-surface-panel rounded border border-border-dim text-slate-400 overflow-x-auto">
                    {JSON.stringify(rule.conditions, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
