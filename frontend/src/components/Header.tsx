import React from 'react';
import { Shield, Activity, RefreshCw, Cpu, Database, Terminal } from 'lucide-react';
import { SystemStatus } from '../services/api';

interface HeaderProps {
  status: SystemStatus | null;
  wsConnected: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  wsConnected,
  activeTab,
  setActiveTab,
  unresolvedCount
}) => {
  return (
    <header className="border-b border-border-dim bg-surface-panel/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        
        {/* Brand & Host Identity */}
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-wide text-white">WinReg-HIDS</span>
              <span className="text-[10px] font-mono bg-surface-subtle text-slate-400 px-1.5 py-0.5 rounded border border-border-dim">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Windows Host Registry Security Monitor</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-surface-bg p-1 rounded border border-border-dim">
          {[
            { id: 'alerts', label: 'Alert Triage', count: unresolvedCount },
            { id: 'events', label: 'Event Explorer' },
            { id: 'baseline', label: 'Baseline Diff' },
            { id: 'rules', label: 'Detection Rules' },
            { id: 'simulation', label: 'Simulation Lab' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-surface-subtle text-white border border-border-dim'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-mono px-1.5 rounded-full border border-red-500/30">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Telemetry Status Chips */}
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-surface-bg rounded border border-border-dim">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse-live' : 'bg-red-500'
              }`}
            />
            <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
              {wsConnected ? 'LIVE STREAM' : 'DISCONNECTED'}
            </span>
          </div>

          {status && (
            <div className="hidden md:flex items-center space-x-3 text-[11px]">
              {status.active_watchers !== undefined && (
                <div className="flex items-center space-x-1 text-blue-400" title="Active Win32 Registry Watchers">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{status.active_watchers} Watchers</span>
                </div>
              )}
              <div className="flex items-center space-x-1" title="Background CPU utilization">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>{status.cpu_percent}% CPU</span>
              </div>
              <div className="flex items-center space-x-1" title="Memory RSS working set">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>{status.memory_rss_mb} MB</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
