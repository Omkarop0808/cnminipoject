import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Terminal, Eye, X, Filter } from 'lucide-react';
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MODIFY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INFERRED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-xs font-sans shadow-xs">
      
      {/* Search and Filters Header */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search key path, value name, or executable..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono transition-colors"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
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
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
          >
            <option value="">All Sources</option>
            <option value="WIN32_NOTIFY">WIN32_NOTIFY</option>
            <option value="SYSMON">SYSMON</option>
            <option value="BASELINE_SCAN">BASELINE_SCAN</option>
          </select>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
            title="Refresh Events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main Table View */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No Raw Telemetry Events Found</p>
            <p className="text-xs text-slate-500 mt-1">Events captured by the Win32 watcher or Sysmon stream will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-28">TIMESTAMP</th>
                <th className="py-2.5 px-3 w-28">SOURCE</th>
                <th className="py-2.5 px-3 w-24">OP</th>
                <th className="py-2.5 px-3">REGISTRY TARGET</th>
                <th className="py-2.5 px-3 w-48">ATTRIBUTED PROCESS</th>
                <th className="py-2.5 px-3 w-28">ATTRIBUTION</th>
                <th className="py-2.5 px-2 w-12 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => {
                const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '--:--:--';
                return (
                  <tr
                    key={ev.event_id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{timeStr}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
                        {ev.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-semibold font-mono uppercase px-2 py-0.5 rounded border ${getOperationBadge(ev.operation)}`}>
                        {ev.operation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-900 font-mono font-medium text-[11px] truncate max-w-md">
                        {ev.hive}\{ev.key_path}
                      </div>
                      {ev.value_name && (
                        <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                          Value: {ev.value_name}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                      {ev.process_image_path ? (
                        <div className="font-mono">
                          <span className="text-slate-900 font-medium">
                            {ev.process_image_path.split('\\').pop()}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1">
                            (PID {ev.process_pid})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unattributed</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded border ${getConfidenceBadge(ev.attribution_confidence)}`}>
                        {ev.attribution_confidence || 'UNATTRIBUTED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
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
      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing {events.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total} events
        </div>
        <div className="flex items-center space-x-2 font-medium">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2 font-sans">
                <div className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-900 text-sm">Event Forensic Detail ({selectedEvent.event_id.slice(0, 8)})</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-sans">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div><span className="text-slate-500 font-medium">Source:</span> <span className="text-slate-900 font-mono font-semibold">{selectedEvent.source}</span></div>
                <div><span className="text-slate-500 font-medium">Operation:</span> <span className="text-slate-900 font-mono font-semibold">{selectedEvent.operation}</span></div>
                <div><span className="text-slate-500 font-medium">Hive:</span> <span className="text-slate-900 font-mono font-semibold">{selectedEvent.hive}</span></div>
                <div><span className="text-slate-500 font-medium">Confidence:</span> <span className="text-indigo-600 font-mono font-semibold">{selectedEvent.attribution_confidence}</span></div>
                <div className="col-span-2 truncate"><span className="text-slate-500 font-medium">Key Path:</span> <span className="text-slate-900 font-mono">{selectedEvent.key_path}</span></div>
                {selectedEvent.value_name && (
                  <div className="col-span-2"><span className="text-slate-500 font-medium">Value Name:</span> <span className="text-slate-900 font-mono">{selectedEvent.value_name}</span></div>
                )}
                {selectedEvent.source_event_id && (
                  <div><span className="text-slate-500 font-medium">Source Event ID:</span> <span className="text-slate-900 font-mono">{selectedEvent.source_event_id}</span></div>
                )}
              </div>

              {/* Data Diff */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
                <span className="text-slate-700 block font-semibold font-sans">Value Data Transformation:</span>
                <div className="space-y-1 text-[11px]">
                  <div className="p-2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="text-slate-500 mr-2">Previous Data:</span>
                    {selectedEvent.previous_data ?? <span className="italic text-slate-400">(null)</span>}
                  </div>
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="text-slate-500 mr-2">New Data:</span>
                    {selectedEvent.new_data ?? <span className="italic text-slate-400">(null)</span>}
                  </div>
                </div>
              </div>

              {/* Process Lineage */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
                <span className="text-slate-700 block font-semibold font-sans">Attributed Execution Lineage:</span>
                <div><span className="text-slate-500">Process ID:</span> <span className="text-slate-900 font-semibold">{selectedEvent.process_pid ?? 'N/A'}</span></div>
                {selectedEvent.process_guid && (
                  <div><span className="text-slate-500">Process GUID:</span> <span className="text-indigo-600">{selectedEvent.process_guid}</span></div>
                )}
                <div><span className="text-slate-500">Image Path:</span> <span className="text-slate-800">{selectedEvent.process_image_path ?? 'N/A'}</span></div>
                {selectedEvent.process_command_line && (
                  <div><span className="text-slate-500">Command Line:</span> <span className="text-slate-800 break-all">{selectedEvent.process_command_line}</span></div>
                )}
                {selectedEvent.parent_pid && (
                  <div><span className="text-slate-500">Parent PID:</span> <span className="text-slate-900">{selectedEvent.parent_pid}</span></div>
                )}
                {selectedEvent.parent_image_path && (
                  <div><span className="text-slate-500">Parent Image:</span> <span className="text-slate-800">{selectedEvent.parent_image_path}</span></div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-xs"
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
