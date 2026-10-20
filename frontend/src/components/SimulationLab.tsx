import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Terminal } from 'lucide-react';
import { triggerSimulation } from '../services/api';

export const SimulationLab: React.FC = () => {
  const [selectedVector, setSelectedVector] = useState('RUN_KEY_TEMP');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);

  const vectors = [
    {
      id: 'RUN_KEY_TEMP',
      name: 'Startup Run Key in User-Writable Directory',
      mitre: 'T1547.001',
      rule: 'WR-PERSIST-001',
      desc: 'Injects a harmless test value in HKCU\\...\\Run pointing to C:\\Users\\Public\\test_sim_payload.exe'
    },
    {
      id: 'IFEO_DEBUGGER',
      name: 'Image File Execution Options Debugger Hijack',
      mitre: 'T1546.012',
      rule: 'WR-PERSIST-002',
      desc: 'Creates a harmless Debugger=cmd.exe entry under HKCU\\...\\Image File Execution Options\\notepad_sim.exe'
    },
    {
      id: 'LOLBIN_STARTUP',
      name: 'Startup Key Invoking Script/LOLBin Interpreter',
      mitre: 'T1218',
      rule: 'WR-PERSIST-005',
      desc: 'Creates a startup value in HKCU\\...\\Run invoking powershell.exe with non-destructive flags'
    }
  ];

  const handleExecute = async () => {
    setRunning(true);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Initiating test vector: ${selectedVector}`,
      ...prev
    ]);

    try {
      const res = await triggerSimulation(selectedVector);
      setLastResult(res);
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Simulation completed! Status: ${res.status} | Latency: ${res.latency_ms} ms | Matched: ${res.matched_rule} | Auto-cleaned: ${res.cleaned_up}`,
        ...prev
      ]);
    } catch (e: any) {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ERROR: Simulation failed: ${e.message}`,
        ...prev
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-xs shadow-sm">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2 font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Controlled Threat Simulation & Validation Sandbox</span>
        </h2>
        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
          Execute safe, non-destructive persistence mutations to measure detection latency and rule verification.
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Vector Selection Cards */}
        <div className="space-y-3">
          <span className="font-sans text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Select Test Mutation Vector:
          </span>

          {vectors.map((vec) => (
            <div
              key={vec.id}
              onClick={() => setSelectedVector(vec.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all shadow-xs ${
                selectedVector === vec.id
                  ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs font-sans">{vec.name}</span>
                <span className="text-[10px] font-mono text-indigo-700 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 font-medium">
                  {vec.mitre}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-sans">{vec.desc}</p>
              <div className="text-[10px] font-mono text-slate-500 mt-2">
                Target Rule: <span className="text-slate-800 font-semibold">{vec.rule}</span>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              onClick={handleExecute}
              disabled={running}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm font-sans"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{running ? 'Executing & Validating...' : 'Execute Selected Test Vector'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5 font-sans">
              * Automatically removes injected test registry values within 2 seconds. Zero residual host changes.
            </p>
          </div>
        </div>

        {/* Live Execution Logs & Results */}
        <div className="flex flex-col space-y-3">
          <span className="font-sans text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Real-Time Benchmarking & Log Output:
          </span>

          {/* Last Result KPI */}
          {lastResult && (
            <div className={`p-3.5 rounded-xl border font-mono shadow-xs ${
              lastResult.detected ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  STATUS: {lastResult.status}
                </span>
                <span className="text-emerald-700 font-bold">
                  LATENCY: {lastResult.latency_ms} ms
                </span>
              </div>
              <div className="text-[11px] text-slate-700 mt-1">
                Matched Rule: <span className="font-bold text-slate-900">{lastResult.matched_rule}</span> (Expected: {lastResult.expected_rule})
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Auto-Cleanup Verified: {lastResult.cleaned_up ? 'Yes (Zero Residual Artifacts)' : 'No'}
              </div>
            </div>
          )}

          {/* Console Output */}
          <div className="flex-1 min-h-[220px] bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-y-auto space-y-1 custom-scrollbar shadow-inner">
            <div className="text-slate-500 text-[10px]">-- SIMULATION RUNNER OUTPUT STREAM --</div>
            {logs.length === 0 ? (
              <div className="text-slate-500 italic py-4">Click "Execute Selected Test Vector" to run test harness...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-slate-300 break-all select-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
