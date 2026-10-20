import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCheck,
  AlertOctagon,
  Flame,
  Globe,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  fetchSecurityOverview,
  checkPhishingUrl,
  fetchCiaLedger,
  appendCiaBlock,
  simulateCiaTamper,
  simulateRansomwareBurst,
  tripRansomwareCanary,
  resetRansomwareGuard,
  SecurityOverview,
  CiaBlock
} from '../services/api';

export const SecuritySuite: React.FC = () => {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [ciaBlocks, setCiaBlocks] = useState<CiaBlock[]>([]);
  const [ciaVerification, setCiaVerification] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'phishing' | 'cia' | 'ransomware'>('phishing');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Phishing URL tester state
  const [testUrl, setTestUrl] = useState<string>('https://login.micros0ft-verify.xyz/auth');
  const [urlVerdict, setUrlVerdict] = useState<any>(null);

  const loadData = async () => {
    try {
      const [ovData, ledgerData] = await Promise.all([
        fetchSecurityOverview(),
        fetchCiaLedger()
      ]);
      setOverview(ovData);
      setCiaBlocks(ledgerData.blocks || []);
      setCiaVerification(ledgerData.verification || null);
    } catch (e) {
      console.error('Failed to load security suite data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTestUrl = async () => {
    if (!testUrl.trim()) return;
    try {
      setLoading(true);
      const res = await checkPhishingUrl(testUrl);
      setUrlVerdict(res);
    } catch (e) {
      console.error('Failed to check URL', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSealCiaBlock = async () => {
    try {
      setLoading(true);
      const res = await appendCiaBlock('SecurityOperator', 'RegistryBaselineSeal');
      setActionMessage(`Block #${res.block.index} successfully cryptographically sealed into SHA-256 hash-chain.`);
      await loadData();
    } catch (e) {
      console.error('Failed to seal CIA block', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      setLoading(true);
      const res = await simulateCiaTamper(1);
      setActionMessage('SIMULATION: Block #1 intentionally mutated without updating chain hash. Integrity check failed!');
      await loadData();
    } catch (e) {
      console.error('Failed to simulate tamper', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRansomBurst = async () => {
    try {
      setLoading(true);
      await simulateRansomwareBurst();
      setActionMessage('RANSOMWARE ALERT: 12 high-velocity registry writes intercepted! Automated host containment engaged.');
      await loadData();
    } catch (e) {
      console.error('Failed to simulate burst', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCanary = async () => {
    try {
      setLoading(true);
      await tripRansomwareCanary();
      setActionMessage('TRIPWIRE BREACH: Canary key HKLM\\Software\\WinRegHIDS\\CanaryTripwire touched by untrusted process!');
      await loadData();
    } catch (e) {
      console.error('Failed to trip canary', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRansomware = async () => {
    try {
      setLoading(true);
      await resetRansomwareGuard();
      setActionMessage('Ransomware defense guard disarmed from lockdown and restored to ARMED MONITORING.');
      await loadData();
    } catch (e) {
      console.error('Failed to reset guard', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden text-xs shadow-sm">
      {/* Top Banner Status */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight font-sans">Enterprise Threat Defense & Integrity Suite</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${
                overview?.overall_status === 'SECURE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              }`}>
                {overview?.overall_status === 'SECURE' ? 'SYSTEM SECURE' : 'THREAT CONTAINMENT ENGAGED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Anti-Phishing Credential Traps &bull; Cryptographic CIA Triad Ledger &bull; Ransomware Canary Tripwires
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => { setActiveSubTab('phishing'); setActionMessage(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'phishing' ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>Anti-Phishing & LSA</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('cia'); setActionMessage(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'cia' ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>CIA Hash Ledger</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('ransomware'); setActionMessage(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-sans flex items-center space-x-1.5 transition-colors ${
              activeSubTab === 'ransomware' ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Ransomware Canary</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-200 text-indigo-800 text-[11px] font-sans flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-800">&times;</button>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* ===================== TAB 1: ANTI-PHISHING ===================== */}
        {activeSubTab === 'phishing' && (
          <div className="space-y-4">
            {/* Posture Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Registered Credential Providers</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">{overview?.anti_phishing.credential_providers_count ?? 3} Active</div>
                <div className="text-[10px] text-emerald-700 font-sans font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>LSA RunAsPPL Guard Protected</span>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Browser Extension Injection Points</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">{overview?.anti_phishing.browser_extensions_count ?? 0} Injected</div>
                <div className="text-[10px] text-slate-500 font-sans">Chrome & Edge registry hives scanned</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Punycode & Phishing Filter</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono">ENFORCED</div>
                <div className="text-[10px] text-slate-500 font-sans">Typosquatting & Homograph decoders active</div>
              </div>
            </div>

            {/* Phishing / Punycode URL Simulator */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900 text-xs font-sans">Punycode & Typosquatting Phishing Interceptor</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">MITRE ATT&CK T1566.002</span>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                Test any URL or domain for typosquatting homographs, punycode spoofing, and fake credential harvester signatures.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="Enter URL to inspect..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono shadow-xs"
                />
                <button
                  onClick={handleTestUrl}
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Analyze URL</span>
                </button>
              </div>

              {urlVerdict && (
                <div className={`p-3 rounded-lg border ${
                  urlVerdict.is_phishing
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                } space-y-1 text-[11px] font-sans shadow-xs`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>VERDICT: {urlVerdict.threat_type}</span>
                    <span>Risk Score: {urlVerdict.risk_score} / 100</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Detection Rule: {urlVerdict.detection_rule} &bull; Target: {urlVerdict.url}
                  </div>
                  {urlVerdict.is_phishing && (
                    <div className="text-[10px] text-rose-700 font-semibold pt-1">
                      Action Taken: Host network socket interception engaged. Phishing decoy trap deployed.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Credential Hooks List */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
              <div className="font-semibold text-slate-900 text-xs flex items-center space-x-2 font-sans">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Monitored Authentication & Credential Provider Subkeys</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans font-semibold">
                      <th className="py-2 px-3">Hive</th>
                      <th className="py-2 px-3">Registry Subkey Path</th>
                      <th className="py-2 px-3">Threat Vector</th>
                      <th className="py-2 px-3">Integrity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[10px]">
                    {overview?.anti_phishing.credential_hooks.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-indigo-600">{h.hive}</td>
                        <td className="py-2 px-3 truncate max-w-md">{h.key_path}</td>
                        <td className="py-2 px-3 text-slate-500 font-sans">{h.threat_type}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-sans font-medium">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: CIA INTEGRITY LEDGER ===================== */}
        {activeSubTab === 'cia' && (
          <div className="space-y-4">
            {/* Chain Status Bar */}
            <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
              ciaVerification?.verified
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center space-x-3">
                {ciaVerification?.verified ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 font-sans">
                    {ciaVerification?.verified
                      ? 'Cryptographic Hash-Chain Ledger: 100% INTACT'
                      : 'TAMPER DETECTED: CRYPTOGRAPHIC HASH CHAIN COMPROMISED'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans">
                    {ciaVerification?.verified
                      ? `All ${ciaBlocks.length} blocks verified with parent SHA-256 hash commitments.`
                      : ciaVerification?.reason}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSealCiaBlock}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Seal Audit Block</span>
                </button>
                <button
                  onClick={handleSimulateTamper}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Simulate Malicious Tamper</span>
                </button>
              </div>
            </div>

            {/* Block Explorer */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs font-sans">Immutable Block Ledger Explorer</span>
                <span className="text-[10px] text-slate-500 font-mono">Total Blocks: {ciaBlocks.length}</span>
              </div>
              <div className="space-y-2.5">
                {ciaBlocks.map((b) => (
                  <div
                    key={b.index}
                    className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 hover:border-indigo-300 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-bold text-indigo-600">Block #{b.index} &bull; {b.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.timestamp}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center space-x-2 font-mono">
                      <span>Actor: <span className="text-slate-900 font-semibold">{b.actor}</span></span>
                      <span>&bull;</span>
                      <span className="truncate">Payload: <span className="text-slate-800">{JSON.stringify(b.data)}</span></span>
                    </div>
                    <div className="pt-1 text-[9px] font-mono space-y-0.5">
                      <div className="text-slate-400 truncate">Prev Hash: <span className="text-slate-600">{b.prev_hash}</span></div>
                      <div className="text-emerald-700 truncate font-semibold">Block Hash: {b.block_hash}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: RANSOMWARE CANARY ===================== */}
        {activeSubTab === 'ransomware' && (
          <div className="space-y-4">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Ransomware Containment State</div>
                <div className={`text-2xl font-bold font-mono ${
                  overview?.ransomware_guard.containment_active ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {overview?.ransomware_guard.guard_status}
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {overview?.ransomware_guard.containment_active ? 'Host Quarantine ACTIVE' : 'Zero Malicious Spikes'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Canary Honeypot Tripwire</div>
                <div className={`text-2xl font-bold font-mono ${
                  overview?.ransomware_guard.canary_intact ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {overview?.ransomware_guard.canary_intact ? 'INTACT & ARMED' : 'TRIPWIRE BREACHED'}
                </div>
                <div className="text-[10px] text-slate-600 truncate font-mono">
                  {overview?.ransomware_guard.canary_key}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">Mutation Burst Threshold</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {overview?.ransomware_guard.recent_burst_rate_sec ?? 0} / {overview?.ransomware_guard.threshold_limit ?? 10} /sec
                </div>
                <div className="text-[10px] text-slate-500 font-sans">Heuristic Sliding Window: 2.0s</div>
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="font-semibold text-slate-900 text-xs flex items-center space-x-2 font-sans">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Ransomware Simulation & Response Controls</span>
              </div>
              <p className="text-[11px] text-slate-600 font-sans">
                Simulate modern ransomware techniques including rapid mass registry key entropy overwrites and honey-pot canary tripwire modifications.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleSimulateRansomBurst}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-2 shadow-xs transition-colors"
                >
                  <Flame className="w-4 h-4" />
                  <span>Simulate Mass Encryption Mutation Burst</span>
                </button>
                <button
                  onClick={handleTripCanary}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-2 shadow-xs transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Trip Canary Honeypot Key</span>
                </button>
                <button
                  onClick={handleResetRansomware}
                  disabled={loading}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-sans font-semibold flex items-center space-x-2 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span>Reset Guard & Release Quarantine</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
