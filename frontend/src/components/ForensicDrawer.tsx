import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, Terminal, FileCode, CheckCircle2, Copy, Download, Save } from 'lucide-react';
import { AlertItem, updateAlertStatus } from '../services/api';

interface ForensicDrawerProps {
  alert: AlertItem | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const ForensicDrawer: React.FC<ForensicDrawerProps> = ({
  alert,
  onClose,
  onStatusUpdated
}) => {
  if (!alert) return null;

  const [currentStatus, setCurrentStatus] = useState(alert.status);
  const [notes, setNotes] = useState(alert.analyst_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      await updateAlertStatus(alert.alert_id, currentStatus, notes);
      onStatusUpdated();
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(alert, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `forensic_alert_${alert.alert_id.slice(0, 8)}.json`);
    dl.click();
  };

  return (
    <div className="w-full lg:w-[460px] h-full bg-surface-panel border-l border-border-dim flex flex-col overflow-hidden text-xs">
      
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-border-dim flex items-center justify-between bg-surface-subtle/50">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-white tracking-wide">Forensic Evidence Package</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopyJSON}
            title="Copy JSON Evidence"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-subtle"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadJSON}
            title="Download JSON Report"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-subtle"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Alert Overview Banner */}
        <div className="bg-surface-bg p-3 rounded border border-border-dim space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400">{alert.rule_id}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-red-500/15 text-red-400 border border-red-500/30">
              {alert.severity}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{alert.rule_name}</h3>
          {alert.mitre_attack && (
            <div className="text-[11px] font-mono text-blue-400">
              MITRE ATT&CK: {alert.mitre_attack}
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            {alert.rationale}
          </p>
        </div>

        {/* Triage Status Management */}
        <div className="bg-surface-bg p-3 rounded border border-border-dim space-y-2.5">
          <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
            Analyst Triage & Actions
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="flex-1 bg-surface-subtle border border-border-dim rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-border-focus font-mono text-xs"
            >
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
            </select>
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Update'}</span>
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Analyst notes, IOC indicators, or remediation steps taken..."
            rows={2}
            className="w-full bg-surface-subtle border border-border-dim rounded p-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-border-focus"
          />
        </div>

        {/* Target Registry Path & Value Diff */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FileCode className="w-3.5 h-3.5" />
            <span>Registry Mutation Delta</span>
          </div>
          <div className="bg-surface-bg p-3 rounded border border-border-dim space-y-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">TARGET PATH:</span>
              <span className="text-slate-200 select-all break-all">
                {alert.hive}\{alert.key_path}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block">VALUE NAME:</span>
                <span className="text-slate-300 font-bold">{alert.value_name || '(Default)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">TYPE:</span>
                <span className="text-slate-300">{alert.value_type || 'N/A'}</span>
              </div>
            </div>

            {/* Before vs After Payload Diff */}
            <div className="pt-2 border-t border-border-dim space-y-1.5">
              <span className="text-slate-500 block text-[10px]">PAYLOAD DELTA:</span>
              <div className="bg-surface-panel p-2 rounded border border-border-dim space-y-1">
                <div className="text-red-400 line-through break-all select-all">
                  (-) {alert.previous_data || '<None (Created)>'}
                </div>
                <div className="text-emerald-400 font-semibold break-all select-all">
                  (+) {alert.new_data || '<None (Deleted)>'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attributed Process Lineage */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Process Attribution Telemetry</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                alert.attribution_confidence === 'CONFIRMED'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : alert.attribution_confidence === 'INFERRED'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
              }`}
            >
              {alert.attribution_confidence || (alert.process_image_path ? 'INFERRED' : 'UNATTRIBUTED')}
            </span>
          </div>
          <div className="bg-surface-bg p-3 rounded border border-border-dim space-y-2 font-mono text-[11px]">
            <div className="grid grid-cols-2 gap-2 text-[10px] pb-1 border-b border-border-dim">
              <div>
                <span className="text-slate-500 block">SOURCE / EVENT ID:</span>
                <span className="text-blue-400 font-bold">{alert.source?.toUpperCase() || 'WIN32'} / {alert.source_event_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PROCESS GUID:</span>
                <span className="text-slate-300 break-all">{alert.process_guid || 'N/A (Win32)'}</span>
              </div>
            </div>

            {alert.process_image_path ? (
              <>
                <div>
                  <span className="text-slate-500 block text-[10px]">EXECUTABLE IMAGE:</span>
                  <span className="text-slate-200 font-semibold select-all break-all">
                    {alert.process_image_path}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">PROCESS ID:</span>
                    <span className="text-slate-300 font-bold">{alert.process_pid}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ACCOUNT:</span>
                    <span className="text-slate-300">{alert.process_user || 'SYSTEM'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">COMMAND LINE:</span>
                  <div className="bg-surface-panel p-1.5 rounded border border-border-dim text-slate-300 select-all break-all text-[10px]">
                    {alert.process_command_line || 'N/A'}
                  </div>
                </div>
                {alert.parent_image_path && (
                  <div className="pt-1.5 border-t border-border-dim text-[10px]">
                    <span className="text-slate-500 block">PARENT PROCESS:</span>
                    <span className="text-slate-400 break-all">
                      {alert.parent_image_path} (PID: {alert.parent_pid})
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-500 italic py-2 text-center">
                Process telemetry unattributed for this Win32 notification.
              </div>
            )}
          </div>
        </div>

        {/* Rule Matched Condition Proofs */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rule Evaluation Match Proof</span>
          </div>
          <div className="bg-surface-bg p-3 rounded border border-border-dim space-y-2 font-mono text-[10px]">
            {Array.isArray(alert.matched_conditions) && alert.matched_conditions.length > 0 ? (
              alert.matched_conditions.map((proof: any, idx: number) => (
                <div key={idx} className="p-2 bg-surface-panel rounded border border-border-dim space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">{proof.field}</span>
                    <span className="text-slate-500">{proof.operator}</span>
                  </div>
                  <div className="text-slate-400 break-all">
                    Expected: <span className="text-slate-300">{JSON.stringify(proof.expected)}</span>
                  </div>
                  <div className="text-emerald-400 break-all">
                    Actual: {proof.actual}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No detailed condition trace available.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
