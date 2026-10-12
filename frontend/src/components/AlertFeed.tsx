import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { AlertItem } from '../services/api';

interface AlertFeedProps {
  alerts: AlertItem[];
  selectedAlertId: string | null;
  onSelectAlert: (alert: AlertItem) => void;
  severityFilter: string;
  setSeverityFilter: (sev: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  selectedAlertId,
  onSelectAlert,
  severityFilter,
  setSeverityFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'INVESTIGATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FALSE_POSITIVE':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getAttributionBadge = (conf?: string) => {
    switch (conf) {
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INFERRED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const counts = {
    critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
    high: alerts.filter((a) => a.severity === 'HIGH').length,
    medium: alerts.filter((a) => a.severity === 'MEDIUM').length,
    low: alerts.filter((a) => a.severity === 'LOW').length,
    total: alerts.length
  };

  return (
    <div className="flex flex-col h-full bg-surface-panel border border-border-dim rounded-lg overflow-hidden">
      
      {/* Severity KPI Summary Cards */}
      <div className="p-3 bg-surface-bg border-b border-border-dim grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {[
          { label: 'CRITICAL', count: counts.critical, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
          { label: 'HIGH', count: counts.high, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
          { label: 'MEDIUM', count: counts.medium, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
          { label: 'LOW', count: counts.low, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
          { label: 'ALL ALERTS', count: counts.total, color: 'text-slate-300 border-border-dim bg-surface-panel' }
        ].map((item) => {
          const isFilterActive = item.label === 'ALL ALERTS' ? severityFilter === '' : severityFilter === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setSeverityFilter(item.label === 'ALL ALERTS' || severityFilter === item.label ? '' : item.label)}
              className={`p-2 rounded border transition-all text-left flex items-center justify-between ${item.color} ${
                isFilterActive ? 'ring-1 ring-white/30 shadow-sm' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="text-[10px] font-mono opacity-80">{item.label}</div>
                <div className="text-base font-bold font-mono">{item.count}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Header Bar */}
      <div className="p-3 border-b border-border-dim bg-surface-panel/50 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search key path, binary, rule ID, or command line..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-bg border border-border-dim rounded text-white placeholder-slate-500 focus:outline-none focus:border-border-focus font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-surface-bg border border-border-dim rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-border-focus"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-surface-bg border border-border-dim rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-border-focus"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>

      </div>

      {/* Alert Feed Table */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-slate-300">No Security Alerts Detected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All monitored Windows Registry locations match expected configuration. Use the Simulation Lab to execute test mutations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-dim bg-surface-subtle/50 text-[11px] font-mono text-slate-400">
                <th className="py-2 px-3 w-20">SEVERITY</th>
                <th className="py-2 px-3 w-28">TIMESTAMP</th>
                <th className="py-2 px-3">RULE & TECHNIQUE</th>
                <th className="py-2 px-3">TARGET REGISTRY KEY</th>
                <th className="py-2 px-3 w-40">ATTRIBUTED PROCESS</th>
                <th className="py-2 px-3 w-24">STATUS</th>
                <th className="py-2 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {alerts.map((alert) => {
                const isSelected = selectedAlertId === alert.alert_id;
                const timeStr = alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : '--:--:--';
                return (
                  <tr
                    key={alert.alert_id}
                    onClick={() => onSelectAlert(alert)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                        : 'hover:bg-surface-subtle/70'
                    }`}
                  >
                    {/* Severity */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {timeStr}
                    </td>

                    {/* Rule & MITRE */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200 line-clamp-1">{alert.rule_name}</div>
                      {alert.mitre_attack && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {alert.mitre_attack}
                        </div>
                      )}
                    </td>

                    {/* Target Registry Key */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-300 line-clamp-1 text-[11px]">
                        {alert.hive}\{alert.key_path}
                      </div>
                      {alert.value_name && (
                        <div className="font-mono text-slate-500 text-[10px] line-clamp-1">
                          Value: {alert.value_name}
                        </div>
                      )}
                    </td>

                    {/* Process Attribution */}
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${getAttributionBadge(alert.attribution_confidence)}`}>
                          {alert.attribution_confidence || (alert.process_image_path ? 'INFERRED' : 'UNATTRIBUTED')}
                        </span>
                        {alert.process_image_path ? (
                          <div>
                            <span className="text-slate-300 font-medium">
                              {alert.process_image_path.split('\\').pop()}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1">
                              (PID {alert.process_pid})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">Unattributed</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>

                    {/* Caret */}
                    <td className="py-2.5 px-2 text-slate-500">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
