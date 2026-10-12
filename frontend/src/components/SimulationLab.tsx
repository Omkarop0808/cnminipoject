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
    <div className="flex flex-col h-full bg-surface-panel border border-border-dim rounded-lg overflow-hidden text-xs">
      
      {/* Header Bar */}
      <div className="p-3.5 border-b border-border-dim bg-surface-subtle/50">
        <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Controlled Threat Simulation & Validation Sandbox</span>
        </h2>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          Execute safe, non-destructive persistence mutations to measure detection latency and rule verification.
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto">
        
        {/* Vector Selection Cards */}
        <div className="space-y-3">
          <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
            Select Test Mutation Vector:
          </span>

          {vectors.map((vec) => (
            <div
              key={vec.id}
              onClick={() => setSelectedVector(vec.id)}
              className={`p-3 rounded border cursor-pointer transition-colors ${
                selectedVector === vec.id
                  ? 'bg-blue-600/10 border-blue-500'
                  : 'bg-surface-bg border-border-dim hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">{vec.name}</span>
                <span className="text-[10px] font-mono text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  {vec.mitre}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{vec.desc}</p>
              <div className="text-[10px] font-mono text-slate-500 mt-2">
                Target Rule: <span className="text-slate-300">{vec.rule}</span>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              onClick={handleExecute}
              disabled={running}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold rounded flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{running ? 'Executing & Validating...' : 'Execute Selected Test Vector'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              * Automatically removes injected test registry values within 2 seconds. Zero residual host changes.
            </p>
          </div>
        </div>

        {/* Live Execution Logs & Results */}
        <div className="flex flex-col space-y-3">
          <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider block">
            Real-Time Benchmarking & Log Output:
          </span>

          {/* Last Result KPI */}
          {lastResult && (
            <div className={`p-3 rounded border font-mono ${
              lastResult.detected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  STATUS: {lastResult.status}
                </span>
                <span className="text-emerald-400 font-bold">
                  LATENCY: {lastResult.latency_ms} ms
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Matched Rule: <span className="text-white font-bold">{lastResult.matched_rule}</span> (Expected: {lastResult.expected_rule})
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Auto-Cleanup Verified: {lastResult.cleaned_up ? 'Yes (Zero Residual Artifacts)' : 'No'}
              </div>
            </div>
          )}

          {/* Console Output */}
          <div className="flex-1 min-h-[220px] bg-surface-bg p-3 rounded border border-border-dim font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
            <div className="text-slate-500 text-[10px]">-- SIMULATION RUNNER OUTPUT STREAM --</div>
            {logs.length === 0 ? (
              <div className="text-slate-600 italic py-4">Click "Execute Selected Test Vector" to run test harness...</div>
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
