import React from 'react'
import {
  Shield,
  Activity,
  Globe,
  Radio,
  FileText,
  GitCompare,
  Sliders,
  Terminal,
  Store,
  Lock,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Eye,
  AlertTriangle,
  Cpu
} from 'lucide-react'

export type TabKey = 
  | 'bento'
  | 'alerts'
  | 'network'
  | 'security'
  | 'events'
  | 'baseline'
  | 'rules'
  | 'simulation'

interface SidebarProps {
  currentTab: TabKey
  onSelectTab: (tab: TabKey) => void
  alertCount: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  isConnected: boolean
}

interface NavItem {
  id: TabKey
  label: string
  icon: React.ElementType
  badge?: string | number
  badgeColor?: string
  accentColor?: string
  description: string
}

interface NavGroup {
  groupName: string
  items: NavItem[]
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  alertCount,
  isCollapsed,
  onToggleCollapse,
  isConnected
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'Command Center',
      items: [
        {
          id: 'bento',
          label: 'Bento Overview',
          icon: Boxes,
          accentColor: 'text-rose-400 group-hover:text-rose-300',
          description: 'Tactical Neo-Brutalist SOC Command Grid'
        },
        {
          id: 'alerts',
          label: 'Alert Triage',
          icon: Shield,
          badge: alertCount > 0 ? alertCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold',
          accentColor: 'text-rose-400',
          description: 'Real-time Host Registry Threat Stream'
        },
        {
          id: 'network',
          label: '3D Spatial Graph',
          icon: Globe,
          badge: 'R3F + DPI',
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          accentColor: 'text-purple-400',
          description: 'Multi-geometry R3F & OSI Packet Wireframe'
        }
      ]
    },
    {
      groupName: 'Host Defense & Integrity',
      items: [
        {
          id: 'security',
          label: 'Security Suite',
          icon: Lock,
          badge: 'Active',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
          accentColor: 'text-emerald-400',
          description: 'Anti-Phishing, CIA Ledger, Ransomware Canary'
        },
        {
          id: 'events',
          label: 'Event Explorer',
          icon: FileText,
          accentColor: 'text-amber-400',
          description: 'Historical Registry Events & Raw Telemetry'
        },
        {
          id: 'baseline',
          label: 'Baseline Diff',
          icon: GitCompare,
          accentColor: 'text-cyan-400',
          description: 'Golden State vs Live Snapshot Comparison'
        }
      ]
    },
    {
      groupName: 'Rules & Simulation',
      items: [
        {
          id: 'rules',
          label: 'Detection Rules',
          icon: Sliders,
          accentColor: 'text-indigo-400',
          description: 'YAML Persistence Signatures & Heuristics'
        },
        {
          id: 'simulation',
          label: 'Threat Lab',
          icon: Terminal,
          badge: 'Live',
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
          accentColor: 'text-amber-400',
          description: 'Simulate Registry Persistence & Ransomware'
        }
      ]
    }
  ]

  return (
    <aside
      aria-label="Primary Navigation"
      className={`relative flex flex-col h-full bg-white border-r-2 border-slate-900 transition-all duration-300 ease-in-out z-40 select-none shadow-[2px_0px_0px_#0F172A] ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 border-b-2 border-slate-900 bg-white h-14">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 border-2 border-slate-900 text-indigo-900 flex-shrink-0 shadow-[2px_2px_0px_#0F172A]">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs tracking-tight text-slate-900 truncate flex items-center gap-1.5 font-sans">
                WinReg-HIDS
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                  v1.2
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-sans tracking-tight truncate">
                Host Defense Console
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-0.5">
            {!isCollapsed && (
              <h2 className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-900 uppercase font-sans">
                {group.groupName}
              </h2>
            )}

            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? `${item.label} - ${item.description}` : undefined}
                  className={`group relative flex items-center w-full rounded-xl px-2.5 py-2 text-xs font-bold transition-all duration-150 outline-none ${
                    isActive
                      ? 'bg-slate-900 text-white font-black shadow-[2px_2px_0px_#4F46E5] border-2 border-slate-900'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold border-2 border-transparent hover:border-slate-300'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-indigo-400'
                          : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate text-left">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full border border-slate-900 flex-shrink-0 shadow-[1px_1px_0px_#0F172A] ${item.badgeColor || 'bg-slate-100 text-slate-900'}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* System Status Footnote */}
      <div className="p-2.5 border-t-2 border-slate-900 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-bold text-slate-900 truncate font-sans">
                  {isConnected ? 'Telemetry Active' : 'Offline / Reconnecting'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono font-bold">
                  Port 8000 &bull; Win32
                </span>
              </div>
            </div>
            <Activity className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
              title={isConnected ? 'Telemetry Active' : 'Offline'}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
