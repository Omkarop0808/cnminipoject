import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-amber-50/70 text-amber-700 border-amber-200/70';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-xs font-sans shadow-xs">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Deterministic Threat Detection Rules
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Active Rules: {rules.length} loaded from config/detection_rules.yaml
            </p>
          </div>
        </div>

        <button
          onClick={handleReload}
          disabled={reloading}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium flex items-center space-x-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          <span>{reloading ? 'Reloading...' : 'Hot Reload Rules'}</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <span className="text-xs">Loading detection rules...</span>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.rule_id}
              className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {rule.rule_id}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{rule.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {rule.mitre_attack && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      MITRE {rule.mitre_attack}
                    </span>
                  )}
                  <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(rule.severity)}`}>
                    {rule.severity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {rule.description}
              </p>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block mb-0.5">Rationale:</span>
                <span className="text-slate-600">{rule.rationale}</span>
              </div>

              {/* Conditions Code view */}
              <div className="pt-1">
                <details className="text-xs font-mono">
                  <summary className="text-indigo-600 hover:text-indigo-800 cursor-pointer select-none text-[11px] font-medium">
                    View Condition Logic (YAML AST)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 text-[10px] overflow-x-auto shadow-inner leading-relaxed">
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
