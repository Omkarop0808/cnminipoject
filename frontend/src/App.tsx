import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AlertFeed } from './components/AlertFeed';
import { ForensicDrawer } from './components/ForensicDrawer';
import { BaselineDiff } from './components/BaselineDiff';
import { RuleManager } from './components/RuleManager';
import { SimulationLab } from './components/SimulationLab';
import { EventExplorer } from './components/EventExplorer';
import { fetchAlerts, fetchSystemStatus, AlertItem, SystemStatus } from './services/api';
import { wsClient } from './services/websocket';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

export const App: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('alerts');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [showRawStream, setShowRawStream] = useState<boolean>(false);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts({
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery
      });
      setAlerts(data.items || []);
    } catch (e) {
      console.error('Failed to load alerts', e);
    }
  };

  const loadStatus = async () => {
    try {
      const status = await fetchSystemStatus();
      setSystemStatus(status);
    } catch (e) {
      // Backend may be starting
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket Subscription
  useEffect(() => {
    const unsubscribe = wsClient.subscribe((msg: any) => {
      setWsConnected(true);
      if (msg.type === 'NEW_ALERT') {
        const newAlert = { ...msg.alert, ...msg.event };
        setAlerts((prev) => [newAlert, ...prev]);
      } else if (msg.type === 'NEW_EVENT') {
        setRawEvents((prev) => [msg.event, ...prev.slice(0, 49)]);
      }
    });

    const statusCheck = setInterval(() => {
      setWsConnected(wsClient.isConnected());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(statusCheck);
    };
  }, []);

  const unresolvedCount = alerts.filter((a) => a.status === 'NEW' || a.status === 'INVESTIGATING').length;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col text-slate-200">
      
      {/* Top Application Header */}
      <Header
        status={systemStatus}
        wsConnected={wsConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unresolvedCount={unresolvedCount}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col overflow-hidden">
        
        <div className="flex-1 flex overflow-hidden gap-4">
          
          {/* Active View Container */}
          <div className="flex-1 h-[calc(100vh-160px)] flex flex-col">
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

            {activeTab === 'events' && <EventExplorer />}
            {activeTab === 'baseline' && <BaselineDiff />}
            {activeTab === 'rules' && <RuleManager />}
            {activeTab === 'simulation' && <SimulationLab />}
          </div>

          {/* Sticky Forensic Drawer (Rendered beside alert feed on desktop) */}
          {activeTab === 'alerts' && selectedAlert && (
            <ForensicDrawer
              alert={selectedAlert}
              onClose={() => setSelectedAlert(null)}
              onStatusUpdated={() => loadAlerts()}
            />
          )}

        </div>

      </main>

      {/* Collapsible Live Raw Event Telemetry Drawer at Bottom */}
      <footer className="border-t border-border-dim bg-surface-panel/90 text-xs font-mono">
        <div
          onClick={() => setShowRawStream(!showRawStream)}
          className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-surface-subtle"
        >
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Kernel Registry Telemetry Stream ({rawEvents.length} events buffered)</span>
          </div>
          <div className="text-slate-500">
            {showRawStream ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {showRawStream && (
          <div className="max-w-7xl mx-auto px-4 py-2 max-h-40 overflow-y-auto space-y-1 border-t border-border-dim bg-surface-bg text-[10px] text-slate-400">
            {rawEvents.length === 0 ? (
              <div className="text-slate-600 italic">No events captured in current session yet...</div>
            ) : (
              rawEvents.map((ev, idx) => (
                <div key={idx} className="flex items-center space-x-2 whitespace-nowrap">
                  <span className="text-slate-600">{ev.timestamp?.slice(11, 19)}</span>
                  <span className="text-blue-400 font-bold">{ev.source}</span>
                  <span className="text-amber-400">{ev.operation}</span>
                  <span className="text-slate-300">{ev.hive}\{ev.key_path}</span>
                  {ev.value_name && <span className="text-slate-500">[{ev.value_name}]</span>}
                  {ev.new_data && <span className="text-emerald-400 max-w-xs truncate">&rarr; {ev.new_data}</span>}
                </div>
              ))
            )}
          </div>
        )}
      </footer>

    </div>
  );
};
