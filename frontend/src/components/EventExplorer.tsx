import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Terminal, Eye, X, Copy } from 'lucide-react';
import { fetchEvents, EventItem } from '../services/api';

export const EventExplorer: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [operationFilter, setOperationFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const data = await fetchEvents({
        limit,
        offset,
        operation: operationFilter || undefined,
        source: sourceFilter || undefined,
        search: searchQuery || undefined
      });
      setEvents(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, operationFilter, sourceFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getOperationBadge = (op: string) => {
    switch (op.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'MODIFY':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'INFERRED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-panel border border-border-dim rounded-lg overflow-hidden text-xs">
      
      {/* Search and Filters Header */}
      <div className="p-3 border-b border-border-dim bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search key path, value, process image, or command line..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-bg border border-border-dim rounded text-white placeholder-slate-500 focus:outline-none focus:border-border-focus font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={operationFilter}
            onChange={(e) => {
              setOperationFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-surface-bg border border-border-dim rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-border-focus font-mono"
          >
            <option value="">All Operations</option>
            <option value="CREATE">CREATE</option>
            <option value="MODIFY">MODIFY</option>
            <option value="DELETE">DELETE</option>
            <option value="RENAME">RENAME</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-surface-bg border border-border-dim rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-border-focus font-mono"
          >
            <option value="">All Sources</option>
            <option value="WIN32_NOTIFY">WIN32_NOTIFY</option>
            <option value="SYSMON">SYSMON</option>
            <option value="BASELINE_SCAN">BASELINE_SCAN</option>
          </select>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-subtle border border-border-dim"
            title="Refresh Events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No Raw Telemetry Events Found</p>
            <p className="text-xs text-slate-500 mt-1">Events captured by the Win32 watcher or Sysmon stream will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-dim bg-surface-bg/70 text-[11px] font-mono text-slate-400">
                <th className="py-2 px-3 w-28">TIMESTAMP</th>
                <th className="py-2 px-3 w-24">SOURCE</th>
                <th className="py-2 px-3 w-20">OP</th>
                <th className="py-2 px-3">REGISTRY TARGET</th>
                <th className="py-2 px-3 w-44">ATTRIBUTED PROCESS</th>
                <th className="py-2 px-3 w-28">ATTRIBUTION</th>
                <th className="py-2 px-2 w-10 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim font-mono">
              {events.map((ev) => {
                const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '--:--:--';
                return (
                  <tr
                    key={ev.event_id}
                    className="hover:bg-surface-subtle/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{timeStr}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {ev.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getOperationBadge(ev.operation)}`}>
                        {ev.operation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200 text-[11px] truncate max-w-md">
                        {ev.hive}\{ev.key_path}
                      </div>
                      {ev.value_name && (
                        <div className="text-[10px] text-slate-500 truncate">
                          Value: {ev.value_name}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                      {ev.process_image_path ? (
                        <div>
                          <span className="text-slate-300 font-medium">
                            {ev.process_image_path.split('\\').pop()}
                          </span>
                          <span className="text-slate-500 text-[10px] ml-1">
                            (PID {ev.process_pid})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[10px]">Unattributed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getConfidenceBadge(ev.attribution_confidence)}`}>
                        {ev.attribution_confidence || 'UNATTRIBUTED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-subtle"
                        title="View Event Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="p-2.5 border-t border-border-dim bg-surface-subtle/50 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>
          Showing {events.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total} events
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded bg-surface-bg border border-border-dim hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded bg-surface-bg border border-border-dim hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-panel border border-border-dim rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="p-3.5 border-b border-border-dim flex items-center justify-between bg-surface-subtle/50">
              <div className="flex items-center space-x-2 font-mono">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white">Event Forensic Detail ({selectedEvent.event_id.slice(0, 8)})</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-2 bg-surface-bg p-2.5 rounded border border-border-dim text-[11px]">
                <div><span className="text-slate-500">Source:</span> <span className="text-white">{selectedEvent.source}</span></div>
                <div><span className="text-slate-500">Operation:</span> <span className="text-white">{selectedEvent.operation}</span></div>
                <div><span className="text-slate-500">Hive:</span> <span className="text-white">{selectedEvent.hive}</span></div>
                <div><span className="text-slate-500">Confidence:</span> <span className="text-white">{selectedEvent.attribution_confidence}</span></div>
                <div className="col-span-2 truncate"><span className="text-slate-500">Key Path:</span> <span className="text-slate-200">{selectedEvent.key_path}</span></div>
                {selectedEvent.value_name && (
                  <div className="col-span-2"><span className="text-slate-500">Value Name:</span> <span className="text-slate-200">{selectedEvent.value_name}</span></div>
                )}
                {selectedEvent.source_event_id && (
                  <div><span className="text-slate-500">Source Event ID:</span> <span className="text-white">{selectedEvent.source_event_id}</span></div>
                )}
              </div>

              {/* Data Diff */}
              <div className="bg-surface-bg p-2.5 rounded border border-border-dim space-y-1.5 text-[11px]">
                <span className="text-slate-400 block font-semibold">Value Data Transformation:</span>
                <div className="space-y-1">
                  <div className="p-1.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                    <span className="text-slate-500 mr-2">Previous Data:</span>
                    {selectedEvent.previous_data ?? <span className="italic text-slate-500">(null)</span>}
                  </div>
                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="text-slate-500 mr-2">New Data:</span>
                    {selectedEvent.new_data ?? <span className="italic text-slate-500">(null)</span>}
                  </div>
                </div>
              </div>

              {/* Process Lineage */}
              <div className="bg-surface-bg p-2.5 rounded border border-border-dim space-y-1 text-[11px]">
                <span className="text-slate-400 block font-semibold">Attributed Execution Lineage:</span>
                <div><span className="text-slate-500">Process ID:</span> <span className="text-white">{selectedEvent.process_pid ?? 'N/A'}</span></div>
                {selectedEvent.process_guid && (
                  <div><span className="text-slate-500">Process GUID:</span> <span className="text-blue-400">{selectedEvent.process_guid}</span></div>
                )}
                <div><span className="text-slate-500">Image Path:</span> <span className="text-slate-200">{selectedEvent.process_image_path ?? 'N/A'}</span></div>
                {selectedEvent.process_command_line && (
                  <div><span className="text-slate-500">Command Line:</span> <span className="text-slate-200 break-all">{selectedEvent.process_command_line}</span></div>
                )}
                {selectedEvent.parent_pid && (
                  <div><span className="text-slate-500">Parent PID:</span> <span className="text-white">{selectedEvent.parent_pid}</span></div>
                )}
                {selectedEvent.parent_image_path && (
                  <div><span className="text-slate-500">Parent Image:</span> <span className="text-slate-200">{selectedEvent.parent_image_path}</span></div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-border-dim bg-surface-subtle/50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1 bg-surface-bg border border-border-dim rounded text-white hover:bg-surface-subtle"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
