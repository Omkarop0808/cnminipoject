import React, { useState, useEffect } from 'react'
import { Sidebar, TabKey } from './components/Sidebar'
import { Header } from './components/Header'
import { BentoGridOverview } from './components/BentoGridOverview'
import { AlertFeed } from './components/AlertFeed'
import { ForensicDrawer } from './components/ForensicDrawer'
import { ThreeSecurityGlobe } from './components/ThreeSecurityGlobe'
import { SecuritySuite } from './components/SecuritySuite'
import { EventExplorer } from './components/EventExplorer'
import { BaselineDiff } from './components/BaselineDiff'
import { RuleManager } from './components/RuleManager'
import { SimulationLab } from './components/SimulationLab'
import { fetchAlerts, fetchSystemStatus, AlertItem, SystemStatus } from './services/api'
import { wsClient } from './services/websocket'
import { Terminal, ChevronUp, ChevronDown, X } from 'lucide-react'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('bento')
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  // Filters for alert feed
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Live telemetry stream buffer
  const [rawEvents, setRawEvents] = useState<any[]>([])
  const [showRawStream, setShowRawStream] = useState<boolean>(false)

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts({
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery
      })
      setAlerts(data.items || [])
    } catch (e) {
      console.error('Failed to load alerts', e)
    }
  }

  const loadStatus = async () => {
    try {
      const status = await fetchSystemStatus()
      setSystemStatus(status)
    } catch (e) {
      // Backend may be starting
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [severityFilter, statusFilter, searchQuery])

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 4000)
    return () => clearInterval(interval)
  }, [])

  // WebSocket Subscription
  useEffect(() => {
    const unsubscribe = wsClient.subscribe((msg: any) => {
      setWsConnected(true)
      if (msg.type === 'NEW_ALERT') {
        const newAlert = { ...msg.alert, ...msg.event }
        setAlerts((prev) => [newAlert, ...prev])
      } else if (msg.type === 'NEW_EVENT') {
        setRawEvents((prev) => [msg.event, ...prev.slice(0, 49)])
      }
    })

    const statusCheck = setInterval(() => {
      setWsConnected(wsClient.isConnected())
    }, 2000)

    return () => {
      unsubscribe()
      clearInterval(statusCheck)
    }
  }, [])

  const unresolvedCount = alerts.filter(
    (a) => a.status === 'NEW' || a.status === 'INVESTIGATING'
  ).length

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F5F9] bg-saas-grid text-slate-900 font-sans">
      
      {/* Desktop Navigation Sidebar */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab)
            if (tab !== 'alerts') setSelectedAlert(null)
          }}
          alertCount={unresolvedCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isConnected={wsConnected}
        />
      </div>

      {/* Mobile Drawer Navigation Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full z-10 shadow-2xl">
            <Sidebar
              currentTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab)
                setIsMobileSidebarOpen(false)
                if (tab !== 'alerts') setSelectedAlert(null)
              }}
              alertCount={unresolvedCount}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              isConnected={wsConnected}
            />
          </div>
        </div>
      )}

      {/* Central Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* SOC Top Bar */}
        <Header
          status={systemStatus}
          wsConnected={wsConnected}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedCount={unresolvedCount}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onRefreshData={() => {
            loadAlerts()
            loadStatus()
          }}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 overflow-hidden flex flex-col relative">
          
          <div className="flex-1 min-w-0 flex overflow-hidden gap-4 relative">
            
            {/* View Switching */}
            <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
              {activeTab === 'bento' && (
                <BentoGridOverview
                  alerts={alerts}
                  systemStatus={systemStatus}
                  wsConnected={wsConnected}
                  onSelectAlert={(alert) => {
                    setSelectedAlert(alert)
                    setActiveTab('alerts')
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertFeed
                  alerts={alerts}
                  selectedAlertId={selectedAlert?.alert_id || null}
                  onSelectAlert={(alert) => setSelectedAlert(alert)}
                  severityFilter={severityFilter}
                  setSeverityFilter={setSeverityFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}

              {activeTab === 'network' && <ThreeSecurityGlobe alerts={alerts} />}
              {activeTab === 'security' && <SecuritySuite />}
              {activeTab === 'events' && <EventExplorer />}
              {activeTab === 'baseline' && <BaselineDiff />}
              {activeTab === 'rules' && <RuleManager />}
              {activeTab === 'simulation' && <SimulationLab />}
            </div>

            {/* Forensic Detail Slide-Over (Overlay on <2xl, Docked on 2xl+) */}
            {selectedAlert && (
              <>
                {/* Backdrop on screens < 2xl */}
                <div
                  onClick={() => setSelectedAlert(null)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 2xl:hidden"
                />

                <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] 2xl:relative 2xl:inset-auto 2xl:w-[460px] 2xl:shrink-0 h-full bg-white border-l border-slate-200 shadow-2xl 2xl:shadow-none flex flex-col">
                  <ForensicDrawer
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    onStatusUpdated={() => loadAlerts()}
                  />
                </div>
              </>
            )}

          </div>

        </main>

        {/* Collapsible Kernel Telemetry Footer */}
        <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-md text-xs font-mono flex-shrink-0 z-20">
          <div
            onClick={() => setShowRawStream(!showRawStream)}
            className="w-full px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
          >
            <div className="flex items-center gap-2.5 text-[11px] text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">
                Live Kernel Registry Telemetry Stream
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({rawEvents.length} events buffered)
              </span>
            </div>
            <div className="text-slate-500 hover:text-slate-900 transition-colors">
              {showRawStream ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {showRawStream && (
            <div className="w-full px-4 py-2.5 max-h-40 overflow-y-auto space-y-1 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-300 custom-scrollbar font-mono">
              {rawEvents.length === 0 ? (
                <div className="text-slate-500 italic py-1">
                  Listening on WebSocket ws://127.0.0.1:8000/ws/telemetry. No events captured in this session yet...
                </div>
              ) : (
                rawEvents.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-3 whitespace-nowrap hover:bg-white/[0.06] py-0.5 px-1.5 rounded transition-colors">
                    <span className="text-slate-500">{ev.timestamp?.slice(11, 19) || '12:00:00'}</span>
                    <span className="text-indigo-400 font-semibold">{ev.source || 'WIN32'}</span>
                    <span className="text-amber-400 font-medium">{ev.operation || 'SET_VALUE'}</span>
                    <span className="text-slate-200 truncate">
                      {ev.hive}\{ev.key_path}
                    </span>
                    {ev.value_name && <span className="text-slate-400">[{ev.value_name}]</span>}
                    {ev.new_data && (
                      <span className="text-emerald-400 max-w-xs truncate font-mono">
                        &rarr; {ev.new_data}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </footer>

      </div>

    </div>
  )
}
