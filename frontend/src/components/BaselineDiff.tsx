import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-surface-panel border border-border-dim rounded-lg overflow-hidden text-xs">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-border-dim bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-blue-400" />
            <span>Registry Baseline Drift Inspector</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Snapshot ID: {diffData?.snapshot_id || 'None'}
          </p>
        </div>

        {/* Snapshot trigger */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            placeholder="Snapshot label..."
            className="px-2.5 py-1 text-xs bg-surface-bg border border-border-dim rounded text-white placeholder-slate-500 focus:outline-none focus:border-border-focus"
          />
          <button
            onClick={handleTakeSnapshot}
            disabled={snapshotting}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{snapshotting ? 'Scanning...' : 'Take Baseline'}</span>
          </button>
          <button
            onClick={loadDiff}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-subtle border border-border-dim"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {diffData && (
        <div className="grid grid-cols-3 gap-3 p-3.5 border-b border-border-dim bg-surface-bg/50">
          <div className="p-2.5 bg-surface-panel rounded border border-border-dim">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Added Mutations</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              +{diffData.summary.added_count}
            </span>
          </div>
          <div className="p-2.5 bg-surface-panel rounded border border-border-dim">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Modified Values</span>
            <span className="text-base font-bold font-mono text-amber-400">
              *{diffData.summary.modified_count}
            </span>
          </div>
          <div className="p-2.5 bg-surface-panel rounded border border-border-dim">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Deleted Values</span>
            <span className="text-base font-bold font-mono text-red-400">
              -{diffData.summary.deleted_count}
            </span>
          </div>
        </div>
      )}

      {/* Diff Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Computing live registry differential against baseline snapshot...</span>
          </div>
        ) : allItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-slate-300">Baseline in Full Sync</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Live registry matches the baseline snapshot with zero drift detected across all monitored locations.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-dim bg-surface-subtle/50 text-[11px] font-mono text-slate-400">
                <th className="py-2 px-3 w-24">STATUS</th>
                <th className="py-2 px-3 w-20">HIVE</th>
                <th className="py-2 px-3">KEY PATH & VALUE</th>
                <th className="py-2 px-3">BASELINE DATA</th>
                <th className="py-2 px-3">CURRENT LIVE DATA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim font-mono text-[11px]">
              {allItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle/70">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        item.status === 'ADDED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : item.status === 'MODIFIED'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{item.hive}</td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-200 line-clamp-1">{item.key_path}</div>
                    <div className="text-slate-500 text-[10px]">Value: {item.value_name}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 break-all max-w-[200px]">
                    {item.baseline_data || '<None>'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 break-all max-w-[200px]">
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
