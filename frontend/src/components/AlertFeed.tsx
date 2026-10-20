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
        return 'bg-rose-100 text-rose-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'HIGH':
        return 'bg-amber-100 text-amber-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'MEDIUM':
        return 'bg-indigo-100 text-indigo-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'LOW':
        return 'bg-sky-100 text-sky-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      default:
        return 'bg-slate-200 text-slate-900 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-indigo-100 text-indigo-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'INVESTIGATING':
        return 'bg-amber-100 text-amber-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-950 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      case 'FALSE_POSITIVE':
        return 'bg-slate-200 text-slate-800 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
      default:
        return 'bg-slate-200 text-slate-800 border border-slate-900 shadow-[1px_1px_0px_#0F172A] font-bold';
    }
  };

  const getAttributionBadge = (conf?: string) => {
    switch (conf) {
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-950 border border-slate-900 font-bold';
      case 'INFERRED':
        return 'bg-amber-100 text-amber-950 border border-slate-900 font-bold';
      default:
        return 'bg-slate-200 text-slate-800 border border-slate-900 font-bold';
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
    <div className="flex flex-col h-full bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0F172A]">
      
      {/* Severity KPI Summary Cards */}
      <div className="p-3.5 bg-slate-100 border-b-2 border-slate-900 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        {[
          { label: 'CRITICAL', count: counts.critical, bg: 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-slate-900', countColor: 'text-rose-950', active: 'ring-3 ring-rose-600' },
          { label: 'HIGH', count: counts.high, bg: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-slate-900', countColor: 'text-amber-950', active: 'ring-3 ring-amber-600' },
          { label: 'MEDIUM', count: counts.medium, bg: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border-2 border-slate-900', countColor: 'text-indigo-950', active: 'ring-3 ring-indigo-600' },
          { label: 'LOW', count: counts.low, bg: 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-2 border-slate-900', countColor: 'text-sky-950', active: 'ring-3 ring-sky-600' },
          { label: 'ALL ALERTS', count: counts.total, bg: 'bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900', countColor: 'text-white', active: 'ring-3 ring-slate-400' }
        ].map((item) => {
          const isFilterActive = item.label === 'ALL ALERTS' ? severityFilter === '' : severityFilter === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setSeverityFilter(item.label === 'ALL ALERTS' || severityFilter === item.label ? '' : item.label)}
              className={`p-3 rounded-xl transition-all text-left flex flex-col justify-between shadow-[3px_3px_0px_#0F172A] hover:shadow-[4px_4px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 ${item.bg} ${
                isFilterActive ? item.active : ''
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider font-sans">{item.label}</div>
              <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${item.countColor}`}>{item.count}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Header Bar */}
      <div className="p-3 border-b-2 border-slate-900 bg-white flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search key path, binary, rule ID, or command line..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border-2 border-slate-900 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white font-mono shadow-[2px_2px_0px_#0F172A]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-slate-50 border-2 border-slate-900 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none font-sans shadow-[2px_2px_0px_#0F172A]"
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
            className="text-xs bg-slate-50 border-2 border-slate-900 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none font-sans shadow-[2px_2px_0px_#0F172A]"
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900">No Security Alerts Detected</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto font-medium">
              All monitored Windows Registry locations match expected configuration. Use the Simulation Lab to execute test mutations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-[11px] font-sans font-extrabold text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-24">SEVERITY</th>
                <th className="py-3 px-3.5 w-28">TIMESTAMP</th>
                <th className="py-3 px-3.5">RULE & TECHNIQUE</th>
                <th className="py-3 px-3.5">TARGET REGISTRY KEY</th>
                <th className="py-3 px-3.5 w-48">ATTRIBUTED PROCESS</th>
                <th className="py-3 px-3.5 w-28">STATUS</th>
                <th className="py-3 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {alerts.map((alert) => {
                const isSelected = selectedAlertId === alert.alert_id;
                const timeStr = alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : '--:--:--';
                const isHklm = alert.hive === 'HKLM';
                return (
                  <tr
                    key={alert.alert_id}
                    onClick={() => onSelectAlert(alert)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Severity */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shadow-2xs ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                      {timeStr}
                    </td>

                    {/* Rule & MITRE */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900 line-clamp-1">{alert.rule_name}</div>
                      {alert.mitre_attack && (
                        <div className="text-[10px] font-mono text-indigo-700 mt-0.5 font-medium inline-block px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200">
                          {alert.mitre_attack}
                        </div>
                      )}
                    </td>

                    {/* Target Registry Key */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-slate-800 line-clamp-1 text-[11px]">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${isHklm ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-sky-100 text-sky-800 border-sky-300'}`}>
                          {alert.hive}
                        </span>
                        <span className="truncate">{alert.key_path}</span>
                      </div>
                      {alert.value_name && (
                        <div className="font-mono text-slate-500 text-[10px] line-clamp-1 mt-0.5">
                          Value: <span className="text-slate-700 font-medium">{alert.value_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Process Attribution */}
                    <td className="py-2.5 px-3.5 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border font-medium ${getAttributionBadge(alert.attribution_confidence)}`}>
                          {alert.attribution_confidence || (alert.process_image_path ? 'INFERRED' : 'UNATTRIBUTED')}
                        </span>
                        {alert.process_image_path ? (
                          <div>
                            <span className="text-slate-800 font-medium">
                              {alert.process_image_path.split('\\').pop()}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-1">
                              (PID {alert.process_pid})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Unattributed</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>

                    {/* Caret */}
                    <td className="py-2.5 px-2 text-slate-400">
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
