import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, GitCompare, CheckCircle2 } from 'lucide-react';
import { fetchBaselineDiff, takeBaselineSnapshot, BaselineDiffResponse } from '../services/api';

export const BaselineDiff: React.FC = () => {
  const [diffData, setDiffData] = useState<BaselineDiffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  const loadDiff = async () => {
    setLoading(true);
    try {
      const data = await fetchBaselineDiff();
      setDiffData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiff();
  }, []);

  const handleTakeSnapshot = async () => {
    setSnapshotting(true);
    try {
      await takeBaselineSnapshot(snapshotLabel || 'Manual Operator Snapshot');
      setSnapshotLabel('');
      await loadDiff();
    } catch (e) {
      alert('Failed to take baseline snapshot');
    } finally {
      setSnapshotting(false);
    }
  };

  const allItems = diffData
    ? [...diffData.added, ...diffData.modified, ...diffData.deleted]
    : [];

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-xs font-sans shadow-xs">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <GitCompare className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Registry Baseline Drift Inspector
            </h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Snapshot ID: {diffData?.snapshot_id || 'None'}
            </p>
          </div>
        </div>

        {/* Snapshot trigger */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            placeholder="Snapshot label..."
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono transition-colors"
          />
          <button
            onClick={handleTakeSnapshot}
            disabled={snapshotting}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{snapshotting ? 'Scanning...' : 'Take Baseline'}</span>
          </button>
          <button
            onClick={loadDiff}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
            title="Refresh Diff"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {diffData && (
        <div className="grid grid-cols-3 gap-3 p-3.5 border-b border-slate-200 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Added Mutations</span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
              +{diffData.summary.added_count}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Modified Values</span>
            <span className="text-xl font-bold font-mono text-amber-600 mt-1 block">
              *{diffData.summary.modified_count}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Deleted Values</span>
            <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
              -{diffData.summary.deleted_count}
            </span>
          </div>
        </div>
      )}

      {/* Diff Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <span className="text-xs">Computing live registry differential against baseline snapshot...</span>
          </div>
        ) : allItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Baseline in Full Sync</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Live registry matches the baseline snapshot with zero drift detected across all monitored locations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-28">STATUS</th>
                <th className="py-2.5 px-3 w-24">HIVE</th>
                <th className="py-2.5 px-3">KEY PATH & VALUE</th>
                <th className="py-2.5 px-3">BASELINE DATA</th>
                <th className="py-2.5 px-3">CURRENT LIVE DATA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {allItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        item.status === 'ADDED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'MODIFIED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{item.hive}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="text-slate-900 font-mono font-medium line-clamp-1">{item.key_path}</div>
                    <div className="text-slate-500 text-[10px] font-mono mt-0.5">Value: {item.value_name}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 break-all max-w-[200px]">
                    {item.baseline_data || '<None>'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-700 font-medium break-all max-w-[200px]">
                    {item.current_data || '<Deleted>'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
