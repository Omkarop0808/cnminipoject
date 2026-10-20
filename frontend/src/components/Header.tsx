import React from 'react'
import {
  Shield,
  Activity,
  Cpu,
  Database,
  Menu,
  Terminal,
  Search,
  Bell,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { SystemStatus } from '../services/api'
import { TabKey } from './Sidebar'

interface HeaderProps {
  status: SystemStatus | null
  wsConnected: boolean
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  unresolvedCount: number
  onToggleSidebar?: () => void
  onRefreshData?: () => void
}

const tabTitles: Record<TabKey, { section: string; title: string }> = {
  bento: { section: 'Command Center', title: 'Unified Bento Overview' },
  alerts: { section: 'Command Center', title: 'Real-Time Alert Triage' },
  network: { section: 'Command Center', title: '3D Spatial Threat Topology (R3F)' },
  security: { section: 'Host Defense & Integrity', title: 'Enterprise Security Suite' },
  events: { section: 'Host Defense & Integrity', title: 'Event Explorer' },
  baseline: { section: 'Host Defense & Integrity', title: 'Baseline Snapshot Diff' },
  rules: { section: 'Rules & Simulation', title: 'Detection Signatures & Heuristics' },
  simulation: { section: 'Rules & Simulation', title: 'Threat Simulation Lab' }
}

export const Header: React.FC<HeaderProps> = ({
  status,
  wsConnected,
  activeTab,
  onSelectTab,
  unresolvedCount,
  onToggleSidebar,
  onRefreshData
}) => {
  const currentMeta = tabTitles[activeTab] || { section: 'Console', title: 'Dashboard' }

  return (
    <header className="border-b-2 border-slate-900 bg-white sticky top-0 z-30 h-14 flex items-center select-none shadow-[0px_2px_0px_#0F172A]">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Active Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle navigation sidebar"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 md:hidden transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-sans text-slate-500">
              <span className="font-medium text-slate-500">{currentMeta.section}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-medium">{currentMeta.title}</span>
            </div>
            <h1 className="text-sm font-semibold text-slate-900 truncate tracking-tight font-sans">
              {currentMeta.title}
            </h1>
          </div>
        </div>

        {/* Right: SOC Status Chips & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Unresolved Alert Counter Button */}
          {unresolvedCount > 0 && (
            <button
              onClick={() => onSelectTab('alerts')}
              aria-label={`View ${unresolvedCount} active alerts`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 text-rose-950 text-xs font-sans font-extrabold transition-all shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Bell className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>{unresolvedCount} Active Alerts</span>
            </button>
          )}

          {/* WebSocket Telemetry Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border-2 border-slate-900 text-xs font-sans shadow-[2px_2px_0px_#0F172A]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={wsConnected ? 'text-slate-900 font-bold text-[11px]' : 'text-rose-700 font-bold text-[11px]'}>
              {wsConnected ? 'LIVE STREAM' : 'OFFLINE'}
            </span>
          </div>

          {/* System Performance Chips */}
          {status && (
            <div className="hidden lg:flex items-center gap-3 text-xs font-sans text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
              {status.active_watchers !== undefined && (
                <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]" title="Active Win32 Registry Watchers">
                  <Activity className="w-3 h-3 text-indigo-600" />
                  <span>{status.active_watchers} Watchers</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px]" title="CPU utilization">
                <Cpu className="w-3 h-3 text-slate-400" />
                <span>{status.cpu_percent}% CPU</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" title="Memory RSS working set">
                <Database className="w-3 h-3 text-slate-400" />
                <span>{status.memory_rss_mb} MB</span>
              </div>
            </div>
          )}

          {/* Manual Refresh */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              aria-label="Refresh telemetry data"
              title="Refresh telemetry data"
              className="p-1.5 text-slate-900 hover:bg-slate-100 rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
