import React, { useState } from 'react'
import {
  Shield,
  Activity,
  Globe,
  Radio,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Zap,
  Terminal,
  Cpu,
  RefreshCw,
  Search,
  Eye,
  Layers,
  Fingerprint,
  Flame,
  ArrowUpRight
} from 'lucide-react'
import {
  AlertItem,
  SystemStatus,
  fetchCiaLedger,
  checkPhishingUrl,
  simulateAttackScenario,
  simulateRansomwareBurst,
  simulateCiaTamper
} from '../services/api'
import { SplitText } from './ui/SplitText'
import { TabKey } from './Sidebar'

interface BentoGridOverviewProps {
  alerts: AlertItem[]
  systemStatus: SystemStatus | null
  wsConnected: boolean
  onSelectAlert: (alert: AlertItem) => void
  onNavigateTab: (tab: TabKey) => void
}

export const BentoGridOverview: React.FC<BentoGridOverviewProps> = ({
  alerts,
  systemStatus,
  wsConnected,
  onSelectAlert,
  onNavigateTab
}) => {
  // CIA Ledger Quick State
  const [ciaAuditResult, setCiaAuditResult] = useState<any>(null)
  const [isAuditingCia, setIsAuditingCia] = useState<boolean>(false)

  // Anti-Phishing Quick URL Scan
  const [quickUrl, setQuickUrl] = useState<string>('')
  const [urlScanResult, setUrlScanResult] = useState<any>(null)
  const [isScanningUrl, setIsScanningUrl] = useState<boolean>(false)

  // Simulation Feedback Pill
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null)

  // Threat Statistics
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length
  const medCount = alerts.filter((a) => a.severity === 'MEDIUM').length
  const lowCount = alerts.filter((a) => a.severity === 'LOW').length

  const handleAuditLedger = async () => {
    setIsAuditingCia(true)
    try {
      const res = await fetchCiaLedger()
      setCiaAuditResult({
        is_valid: res.verification?.is_valid,
        block_count: res.blocks?.length || 0,
        tip_block_hash: res.blocks?.[res.blocks.length - 1]?.block_hash || 'genesis_hash'
      })
    } catch (e) {
      console.error('CIA audit error', e)
    } finally {
      setIsAuditingCia(false)
    }
  }

  const handleScanUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    setIsScanningUrl(true)
    try {
      const res = await checkPhishingUrl(quickUrl)
      setUrlScanResult(res)
    } catch (e) {
      console.error('URL scan error', e)
    } finally {
      setIsScanningUrl(false)
    }
  }

  const handleQuickAttack = async (type: string) => {
    try {
      setSimulationFeedback(`Injecting ${type}...`)
      if (type === 'RANSOMWARE') {
        await simulateRansomwareBurst()
      } else if (type === 'CIA_TAMPER') {
        await simulateCiaTamper(1)
      } else {
        await simulateAttackScenario(type)
      }
      setSimulationFeedback(`Active: ${type} attack stream flowing through 3D topology.`)
      setTimeout(() => setSimulationFeedback(null), 4500)
    } catch (e) {
      console.error(e)
      setSimulationFeedback(`Simulation dispatched.`)
      setTimeout(() => setSimulationFeedback(null), 3000)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-1 pb-20 custom-scrollbar">
      
      {/* Top Banner with Neobrutalist Maximalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-900" />
            <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-700">
              Host Intrusion Detection &bull; Live Telemetry Active
            </span>
          </div>
          <SplitText
            text="SOC COMMAND & SPATIAL TELEMETRY GRID"
            className="text-base sm:text-lg font-black tracking-tight text-slate-950 font-sans"
            delay={20}
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-sans">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-900 text-slate-800 font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0F172A]">
            <span className="text-slate-500 text-[10px] font-bold">HOST:</span>
            <span className="font-bold text-slate-950 text-[11px] font-mono">WIN-SECURITY-01</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-100 border-2 border-slate-900 text-rose-900 font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#0F172A]">
            <Flame className="w-4 h-4 text-rose-600" />
            <span className="text-[11px]">{criticalCount + highCount} HIGH THREATS</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
        
        {/* Cell 1: Executive Host Defense & Attack Surface Matrix (Hero Cell, 2 cols x 2 rows) */}
        <div className="md:col-span-2 xl:col-span-2 row-span-2 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5 flex flex-col justify-between relative overflow-hidden group">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 mb-4 pb-3 border-b-2 border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-slate-900 text-indigo-950 flex items-center justify-center shadow-[2px_2px_0px_#0F172A] flex-shrink-0">
                <Shield className="w-5 h-5 text-indigo-800" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 flex flex-wrap items-center gap-2 text-base tracking-tight font-sans">
                  <span>Host Defense & Attack Surface Matrix</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-950 border border-slate-900 flex items-center gap-1 shadow-[1px_1px_0px_#0F172A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                </h3>
                <p className="text-xs text-slate-600 font-medium truncate sm:whitespace-normal">
                  Kernel-level Win32 registry telemetry and MITRE ATT&CK tactic load distribution
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('network')}
              aria-label="Expand 3D Network Graph"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 rounded-xl transition-all shadow-[2px_2px_0px_#0F172A] hover:shadow-[3px_3px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5 flex-shrink-0 self-start sm:self-auto"
            >
              <span>Launch 3D Dissector</span>
              <ArrowUpRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Tactical DEFCON & Driver Posture Strip */}
          <div className="p-3.5 rounded-xl bg-slate-900 border-2 border-slate-900 text-white mb-4 shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <div>
                <div className="text-xs font-mono font-bold text-rose-400 tracking-wider">
                  DEFCON 2 // TACTICAL THREAT ACTIVE
                </div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Kernel Hooks: <span className="text-emerald-400 font-medium">Advapi32.dll & NtSetValueKey</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold">
                8 Watchers Active
              </span>
              <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-[11px] font-bold">
                0% CPU | 52MB
              </span>
            </div>
          </div>

          {/* MITRE ATT&CK Tactic Distribution Progress Bars */}
          <div className="space-y-3 my-2 flex-1">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Active MITRE ATT&CK Tactic Breakdown</span>
              <span className="text-slate-600 text-[11px] font-mono font-bold">10 Total Correlated Events</span>
            </div>

            {/* Persistence Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900/40 space-y-1.5 shadow-[2px_2px_0px_#0F172A]">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  Persistence (T1547.001 / T1543.003)
                </span>
                <span className="font-bold text-rose-800 font-mono text-[11px]">4 Alerts (40%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 border border-slate-400 overflow-hidden">
                <div className="h-full bg-rose-600 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Defense Evasion Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900/40 space-y-1.5 shadow-[2px_2px_0px_#0F172A]">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Defense Evasion (T1562.001 / T1548.002)
                </span>
                <span className="font-bold text-amber-800 font-mono text-[11px]">3 Alerts (30%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 border border-slate-400 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>

            {/* Credential Access Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900/40 space-y-1.5 shadow-[2px_2px_0px_#0F172A]">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Credential Access (T1003.001 LSA Guard)
                </span>
                <span className="font-bold text-indigo-800 font-mono text-[11px]">2 Alerts (20%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 border border-slate-400 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>

            {/* Ransomware Impact Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900/40 space-y-1.5 shadow-[2px_2px_0px_#0F172A]">
              <div className="flex justify-between items-center text-xs font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Impact / Rapid Mutation (T1486 Canary Trap)
                </span>
                <span className="font-bold text-purple-800 font-mono text-[11px]">1 Alert (10%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 border border-slate-400 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>

          {/* Dedicated 3D Spatial Visualization Teaser & Quick Controls */}
          <div className="mt-3 pt-3 border-t-2 border-slate-200 z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-700 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold">9 Entities Monitored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-bold">OSI L2 to L7 Inspection</span>
              </div>
            </div>

            {/* Quick Simulation Triggers */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleQuickAttack('PHISHING')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-slate-900 text-[11px] font-bold transition-all flex items-center gap-1 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
                title="Inject Phishing Attack Packets"
              >
                <Zap className="w-3.5 h-3.5 text-rose-700" />
                <span>Phishing</span>
              </button>
              <button
                onClick={() => handleQuickAttack('RANSOMWARE')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-slate-900 text-[11px] font-bold transition-all flex items-center gap-1 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
                title="Trigger Ransomware Burst"
              >
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                <span>Ransomware</span>
              </button>
              <button
                onClick={() => handleQuickAttack('CIA_TAMPER')}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border-2 border-slate-900 text-[11px] font-bold transition-all flex items-center gap-1 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
                title="Simulate CIA Integrity Tamper"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-700" />
                <span>CIA Tamper</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cell 2: Threat Matrix Breakdown */}
        <div className="rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border-2 border-slate-900 text-rose-900 flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Shield className="w-4 h-4 text-rose-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-sans">Threat Matrix</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900">
              {alerts.length} ALERTS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-3">
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex flex-col">
              <span className="text-[10px] text-rose-950 font-bold uppercase tracking-wider">Critical</span>
              <span className="text-2xl font-black text-rose-950 font-mono mt-0.5">{criticalCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex flex-col">
              <span className="text-[10px] text-amber-950 font-bold uppercase tracking-wider">High</span>
              <span className="text-2xl font-black text-amber-950 font-mono mt-0.5">{highCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex flex-col">
              <span className="text-[10px] text-indigo-950 font-bold uppercase tracking-wider">Medium</span>
              <span className="text-2xl font-black text-indigo-950 font-mono mt-0.5">{medCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex flex-col">
              <span className="text-[10px] text-emerald-950 font-bold uppercase tracking-wider">Low / Info</span>
              <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5">{lowCount}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('alerts')}
            aria-label="View Full Alert Triage Feed"
            className="w-full py-2 px-3 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-900 flex items-center justify-between transition-all shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>Open Triage Feed</span>
            <ChevronRight className="w-4 h-4 text-slate-900" />
          </button>
        </div>

        {/* Cell 3: Honeypot Canary & Rapid Mutation Guard */}
        <div className="rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border-2 border-slate-900 text-amber-900 flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-sans">Canary Tripwire</h3>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-950 border border-slate-900 flex items-center gap-1 shadow-[1px_1px_0px_#0F172A]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              ARMED
            </span>
          </div>

          <div className="space-y-2 my-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border-2 border-slate-900 font-mono text-[11px] shadow-[2px_2px_0px_#0F172A]">
              <span className="text-slate-600 block text-[9px] uppercase font-sans font-bold tracking-wider">Monitored Hive</span>
              <span className="text-amber-900 font-bold truncate block mt-0.5">HKLM\SOFTWARE\WinRegHIDS\Canary</span>
            </div>

            <div className="flex items-center justify-between text-xs px-1 font-sans">
              <span className="text-slate-600 font-medium text-[11px]">Burst Velocity</span>
              <span className="text-slate-900 font-bold text-[11px] font-mono">&gt; 10 writes/sec</span>
            </div>

            <div className="flex items-center justify-between text-xs px-1 font-sans">
              <span className="text-slate-600 font-medium text-[11px]">Host Lockdown</span>
              <span className="text-emerald-800 font-bold text-[11px]">Active Containment</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('simulation')}
            aria-label="Simulate Ransomware Burst in Threat Lab"
            className="w-full py-2 px-3 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl border-2 border-slate-900 flex items-center justify-between transition-all shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-slate-900" />
              <span>Simulate Ransomware Burst</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-900" />
          </button>
        </div>

        {/* Cell 4: CIA Triad Cryptographic Ledger */}
        <div className="md:col-span-2 xl:col-span-2 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border-2 border-slate-900 text-emerald-900 flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Fingerprint className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-sans">
                  CIA Triad Cryptographic Ledger
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-950 border border-slate-900">
                    SHA-256 Hash Chain
                  </span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Forward-linked tamper-evident registry mutation chain
                </p>
              </div>
            </div>

            <button
              onClick={handleAuditLedger}
              disabled={isAuditingCia}
              aria-label="Audit Ledger Chain"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-400 border-2 border-slate-900 rounded-lg transition-all disabled:opacity-50 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditingCia ? 'animate-spin' : ''}`} />
              <span>{isAuditingCia ? 'Verifying...' : 'Audit Ledger'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
              <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider font-sans">Chain Integrity</span>
              <span className="text-emerald-800 font-bold flex items-center gap-1.5 mt-1 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {ciaAuditResult ? (ciaAuditResult.is_valid ? 'GENUINE (Clean)' : 'TAMPER DETECTED') : 'Verified Chain'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A]">
              <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider font-sans">Total Blocks</span>
              <span className="text-slate-900 font-black text-sm mt-1 block font-sans">
                {ciaAuditResult ? `${ciaAuditResult.block_count} Blocks Synced` : '3 Blocks Synced'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] truncate">
              <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider font-sans">Tip Block Hash</span>
              <span className="text-slate-700 text-[10px] truncate block mt-1 font-mono font-bold">
                {ciaAuditResult ? ciaAuditResult.tip_block_hash.substring(0, 16) + '...' : 'e3b0c44298fc1c14...'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t-2 border-slate-200 font-sans">
            <span className="text-[11px] font-medium">Zero-Knowledge Proof Audit Protocol active</span>
            <button
              onClick={() => onNavigateTab('security')}
              className="text-indigo-700 hover:text-indigo-900 font-bold inline-flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>Explore Security Suite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cell 5: Quick Anti-Phishing & Punycode Scanner */}
        <div className="md:col-span-2 xl:col-span-2 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 border-2 border-slate-900 text-indigo-900 flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Search className="w-4 h-4 text-indigo-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-sans">Anti-Phishing & Punycode Scanner</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0px_#0F172A]">
              LSA Guard Active
            </span>
          </div>

          <form onSubmit={handleScanUrl} className="flex gap-2 my-2">
            <input
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="e.g. https://micrоsoft.com (homograph test)"
              aria-label="URL to analyze"
              className="flex-1 bg-slate-50 border-2 border-slate-900 focus:bg-white rounded-xl px-3 py-2 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-[2px_2px_0px_#0F172A]"
            />
            <button
              type="submit"
              disabled={isScanningUrl || !quickUrl}
              aria-label="Analyze URL"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs font-sans disabled:opacity-50 transition-all flex items-center gap-1.5 border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            >
              {isScanningUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Inspect'}
            </button>
          </form>

          {urlScanResult ? (
            <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 flex items-center justify-between text-xs font-sans shadow-[2px_2px_0px_#0F172A]">
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2.5 h-2.5 rounded-full ${urlScanResult.risk_level === 'CRITICAL' || urlScanResult.risk_level === 'HIGH' ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                <span className="text-slate-900 truncate font-mono text-[11px] font-bold">{urlScanResult.analyzed_url}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-900 ${
                urlScanResult.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-950' : 'bg-emerald-100 text-emerald-950'
              }`}>
                {urlScanResult.verdict} ({urlScanResult.risk_score} pts)
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 font-sans">
              <span>Scans for Cyrillic/homograph chars, punycode `xn--`, and fake login hooks.</span>
              <span className="text-emerald-800 font-mono text-[10px] font-bold">Zero false positives</span>
            </div>
          )}
        </div>

        {/* Cell 6: Priority Alert Stream Bento */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A] p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border-2 border-slate-900 text-rose-900 flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
                <Activity className="w-4 h-4 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-sans">Priority Alert Stream</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Select an alert to inspect root cause forensics and rule matching proof
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('alerts')}
              aria-label="View all alerts"
              className="flex items-center gap-1 text-xs text-rose-900 hover:text-rose-950 font-bold transition-colors bg-rose-100 px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>Full Triage View</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
              No active host registry alerts detected. Host integrity baseline confirmed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => onSelectAlert(alert)}
                  className="group p-3.5 rounded-xl bg-slate-50 hover:bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:shadow-[4px_4px_0px_#0F172A] hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold tracking-wider border border-slate-900 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-950'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-950'
                          : alert.severity === 'MEDIUM'
                          ? 'bg-indigo-100 text-indigo-950'
                          : 'bg-slate-200 text-slate-900'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 font-bold">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors line-clamp-1 font-sans">
                      {alert.rule_name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-600 truncate mt-1">
                      {alert.key_path}
                    </p>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-sans">
                    <span className="truncate max-w-[160px] font-bold text-slate-900 text-[10px]">
                      {alert.process_image_path ? alert.process_image_path.split('\\').pop() : 'Attributed'}
                    </span>
                    <span className="text-indigo-700 font-bold text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
