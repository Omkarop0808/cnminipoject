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
    <div className="w-full h-full bg-white flex flex-col overflow-hidden text-xs text-slate-800">
      
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span className="font-semibold text-slate-900 tracking-tight">Forensic Evidence Package</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopyJSON}
            title="Copy JSON Evidence"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadJSON}
            title="Download JSON Report"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Alert Overview Banner */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-500">{alert.rule_id}</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-full border ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {alert.severity}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{alert.rule_name}</h3>
          {alert.mitre_attack && (
            <div className="text-[11px] font-mono text-indigo-600 font-medium">
              MITRE ATT&CK: {alert.mitre_attack}
            </div>
          )}
          <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
            {alert.rationale}
          </p>
        </div>

        {/* Triage Status Management */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5 shadow-xs">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Analyst Triage & Actions
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs shadow-xs"
            >
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
            </select>
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center space-x-1.5 transition-colors shadow-xs"
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
            className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Target Registry Path & Value Diff */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 font-semibold">
            <FileCode className="w-3.5 h-3.5 text-slate-600" />
            <span>Registry Mutation Delta</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 font-mono text-[11px] shadow-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">TARGET PATH:</span>
              <div className="bg-slate-950 text-emerald-400 p-2 rounded border border-slate-800 select-all break-all mt-1">
                {alert.hive}\{alert.key_path}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div>
                <span className="text-slate-500 block">VALUE NAME:</span>
                <span className="text-slate-800 font-bold">{alert.value_name || '(Default)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">TYPE:</span>
                <span className="text-slate-700">{alert.value_type || 'N/A'}</span>
              </div>
            </div>

            {/* Before vs After Payload Diff */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <span className="text-slate-500 block text-[10px]">PAYLOAD DELTA:</span>
              <div className="bg-white p-2.5 rounded-md border border-slate-200 space-y-1 text-[11px]">
                <div className="text-rose-600 line-through break-all select-all">
                  (-) {alert.previous_data || '<None (Created)>'}
                </div>
                <div className="text-emerald-700 font-semibold break-all select-all">
                  (+) {alert.new_data || '<None (Deleted)>'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attributed Process Lineage */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider flex items-center justify-between font-semibold">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>Process Attribution Telemetry</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono font-medium ${
                alert.attribution_confidence === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : alert.attribution_confidence === 'INFERRED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {alert.attribution_confidence || (alert.process_image_path ? 'INFERRED' : 'UNATTRIBUTED')}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 font-mono text-[11px] shadow-xs">
            <div className="grid grid-cols-2 gap-2 text-[10px] pb-1 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block">SOURCE / EVENT ID:</span>
                <span className="text-indigo-600 font-bold">{alert.source?.toUpperCase() || 'WIN32'} / {alert.source_event_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PROCESS GUID:</span>
                <span className="text-slate-700 break-all">{alert.process_guid || 'N/A (Win32)'}</span>
              </div>
            </div>

            {alert.process_image_path ? (
              <>
                <div>
                  <span className="text-slate-500 block text-[10px]">EXECUTABLE IMAGE:</span>
                  <span className="text-slate-900 font-semibold select-all break-all">
                    {alert.process_image_path}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">PROCESS ID:</span>
                    <span className="text-slate-800 font-bold">{alert.process_pid}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ACCOUNT:</span>
                    <span className="text-slate-700">{alert.process_user || 'SYSTEM'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">COMMAND LINE:</span>
                  <div className="bg-slate-950 text-slate-200 p-2 rounded border border-slate-800 select-all break-all text-[10px] mt-1">
                    {alert.process_command_line || 'N/A'}
                  </div>
                </div>
                {alert.parent_image_path && (
                  <div className="pt-1.5 border-t border-slate-200 text-[10px]">
                    <span className="text-slate-500 block">PARENT PROCESS:</span>
                    <span className="text-slate-600 break-all">
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
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rule Evaluation Match Proof</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 font-mono text-[10px] shadow-xs">
            {Array.isArray(alert.matched_conditions) && alert.matched_conditions.length > 0 ? (
              alert.matched_conditions.map((proof: any, idx: number) => (
                <div key={idx} className="p-2 bg-white rounded border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-600 font-bold">{proof.field}</span>
                    <span className="text-slate-500">{proof.operator}</span>
                  </div>
                  <div className="text-slate-600 break-all">
                    Expected: <span className="text-slate-800 font-medium">{JSON.stringify(proof.expected)}</span>
                  </div>
                  <div className="text-emerald-700 font-semibold break-all">
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
