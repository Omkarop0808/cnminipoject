import React, { useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import {
  Shield,
  Activity,
  Zap,
  Globe,
  Radio,
  AlertTriangle,
  Lock,
  Cpu,
  Layers,
  Send,
  RotateCcw,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Terminal,
  Crosshair,
  Sparkles,
  Info,
  X
} from 'lucide-react'

export interface R3FNodeData {
  id: string
  name: string
  pos: [number, number, number]
  color: string
  accentColor: string
  category: 'threat' | 'perimeter' | 'host' | 'enclave'
  ip: string
  mac: string
  protocol: string
  activeThroughput: string
  description: string
  shape: 'icosahedron' | 'cylinder' | 'dodecahedron' | 'octahedron' | 'box'
}

export const NODES_DATA: R3FNodeData[] = [
  {
    id: 'attacker',
    name: 'External Adversary',
    pos: [-7, 3.5, -2],
    color: '#E11D48',
    accentColor: '#FDA4AF',
    category: 'threat',
    ip: '198.51.100.44',
    mac: '52:54:00:12:34:56',
    protocol: 'C2 / TCP 4444',
    activeThroughput: '184 pkt/s',
    description: 'Adversary Command & Control / Phishing Injection',
    shape: 'icosahedron'
  },
  {
    id: 'gateway',
    name: 'Border Edge Gateway',
    pos: [-3.8, 1.8, 0],
    color: '#06B6D4',
    accentColor: '#A5F3FC',
    category: 'perimeter',
    ip: '192.168.1.1',
    mac: '00:50:56:FE:10:01',
    protocol: 'BGP / OSPF L3',
    activeThroughput: '820 pkt/s',
    description: 'Stateful Border Routing & Ingress Filter',
    shape: 'cylinder'
  },
  {
    id: 'firewall',
    name: 'Next-Gen DPI Firewall',
    pos: [-1.8, -1.2, 2.2],
    color: '#A855F7',
    accentColor: '#E9D5FF',
    category: 'perimeter',
    ip: '192.168.1.254',
    mac: '00:50:56:FE:10:02',
    protocol: 'TLS 1.3 / DPI',
    activeThroughput: '640 pkt/s',
    description: 'Deep Packet Inspection & Heuristic Decryption',
    shape: 'cylinder'
  },
  {
    id: 'client',
    name: 'Workstation Host',
    pos: [1.8, 0.6, 0.6],
    color: '#38BDF8',
    accentColor: '#BAE6FD',
    category: 'host',
    ip: '192.168.1.105',
    mac: '00:0C:29:84:1E:5A',
    protocol: 'SMB 3.1.1 / RPC',
    activeThroughput: '310 pkt/s',
    description: 'Monitored Windows Host Registry Target',
    shape: 'dodecahedron'
  },
  {
    id: 'hklm',
    name: 'HKLM Machine Hive',
    pos: [4.8, 2.8, 2.2],
    color: '#F97316',
    accentColor: '#FED7AA',
    category: 'host',
    ip: 'INTERNAL\\HKLM',
    mac: 'WIN32_REG_MACHINE',
    protocol: 'Advapi32.dll',
    activeThroughput: '95 ops/s',
    description: 'System Run, IFEO Debuggers & Services',
    shape: 'box'
  },
  {
    id: 'hkcu',
    name: 'HKCU User Hive',
    pos: [5.2, -2.2, -1.2],
    color: '#F59E0B',
    accentColor: '#FDE68A',
    category: 'host',
    ip: 'INTERNAL\\HKCU',
    mac: 'WIN32_REG_USER',
    protocol: 'NtQueryKey',
    activeThroughput: '48 ops/s',
    description: 'User Startup Keys & Shell Folders',
    shape: 'box'
  },
  {
    id: 'lsa',
    name: 'LSA Credential Vault',
    pos: [3.2, -3.4, 2.4],
    color: '#10B981',
    accentColor: '#A7F3D0',
    category: 'enclave',
    ip: 'LSASS.EXE:PPL',
    mac: 'PROTECTED_ENCLAVE',
    protocol: 'Kerberos / NTLM',
    activeThroughput: '12 ops/s',
    description: 'RunAsPPL Credential Guard & Security Packages',
    shape: 'octahedron'
  },
  {
    id: 'canary',
    name: 'Honeypot Tripwire',
    pos: [6.4, 0.9, -2.4],
    color: '#E11D48',
    accentColor: '#FECDD3',
    category: 'enclave',
    ip: 'CANARY_TRIPWIRE',
    mac: 'REG_HONEYPOT_01',
    protocol: 'RegNotifyChange',
    activeThroughput: '0 burst writes',
    description: 'Honeypot Canary Key for Ransomware Trap',
    shape: 'octahedron'
  },
  {
    id: 'defender',
    name: 'Defender Core Enclave',
    pos: [2.2, 4.0, -1.6],
    color: '#C2EF4E',
    accentColor: '#E2FBC4',
    category: 'enclave',
    ip: 'MSMPSENG.EXE',
    mac: 'ELAM_DRIVER_01',
    protocol: 'WDF Filter',
    activeThroughput: '230 ev/s',
    description: 'Real-Time Antivirus Protection & Tamper Guard',
    shape: 'octahedron'
  }
]

export interface TraceStep {
  stepIndex: number
  title: string
  hopFrom: string
  hopTo: string
  layer: string
  protocol: string
  packetColor: string
  packetShape: 'diamond' | 'box' | 'sphere'
  explanation: string
  telemetryAction: string
  verdict: 'INSPECTING' | 'FORWARDED' | 'QUARANTINED' | 'CONTAINED'
}

export interface TraceScenario {
  id: string
  name: string
  mitreCode: string
  badgeColor: string
  steps: TraceStep[]
}

const EDUCATIONAL_SCENARIOS: TraceScenario[] = [
  {
    id: 'persistence_run_key',
    name: 'Startup Run Key Persistence (T1547.001)',
    mitreCode: 'MITRE ATT&CK T1547.001',
    badgeColor: 'border-[#e11d48] text-[#e11d48] bg-rose-950/40',
    steps: [
      {
        stepIndex: 1,
        title: 'Adversary Ingress Transmission',
        hopFrom: 'attacker',
        hopTo: 'gateway',
        layer: 'Layer 3: Network (IPv4)',
        protocol: 'TCP 4444 / C2 Beacon',
        packetColor: '#E11D48',
        packetShape: 'diamond',
        explanation: 'External Adversary 198.51.100.44 transmits an encoded payload targeting corporate network ingress via Border BGP Router.',
        telemetryAction: 'Ingress BGP Route evaluated against Border ACL rules.',
        verdict: 'FORWARDED'
      },
      {
        stepIndex: 2,
        title: 'Stateful Deep Packet Inspection',
        hopFrom: 'gateway',
        hopTo: 'firewall',
        layer: 'Layer 4: Transport (TCP / DPI)',
        protocol: 'TLS 1.3 Handshake',
        packetColor: '#A855F7',
        packetShape: 'box',
        explanation: 'Next-Gen Firewall inspects TCP sequence numbers and flags anomalous TLS 1.3 payload entropy without decrypting private keys.',
        telemetryAction: 'DPI heuristic sensor records session parameters & flags packet sequence.',
        verdict: 'INSPECTING'
      },
      {
        stepIndex: 3,
        title: 'Internal Host Payload Delivery',
        hopFrom: 'firewall',
        hopTo: 'client',
        layer: 'Layer 7: Application (RPC / SMB)',
        protocol: 'SMB 3.1.1 / MSRPC',
        packetColor: '#38BDF8',
        packetShape: 'box',
        explanation: 'Packet traverses internal LAN to Workstation 192.168.1.105 via RPC pipe. Registry write instruction unpacked into memory.',
        telemetryAction: 'Endpoint RPC server dispatches write request to Windows host kernel.',
        verdict: 'FORWARDED'
      },
      {
        stepIndex: 4,
        title: 'Registry Persistence Mutation',
        hopFrom: 'client',
        hopTo: 'hklm',
        layer: 'Host Kernel Telemetry (Win32)',
        protocol: 'Advapi32.dll / NtSetValueKey',
        packetColor: '#F97316',
        packetShape: 'box',
        explanation: 'Payload attempts writing "update.exe" into HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run for persistent boot execution.',
        telemetryAction: 'WinReg-HIDS RegNotifyChangeKeyValue traps registry hive write in < 5ms.',
        verdict: 'QUARANTINED'
      },
      {
        stepIndex: 5,
        title: 'Kernel Alarm & Quarantined',
        hopFrom: 'hklm',
        hopTo: 'defender',
        layer: 'Security Enclave (EDR/ELAM)',
        protocol: 'Sigma Rule Engine Filter',
        packetColor: '#C2EF4E',
        packetShape: 'sphere',
        explanation: 'WinReg-HIDS triggers CRITICAL alert! Sigma rule PERSIST_001 verifies MITRE T1547.001 match and blocks automated startup persistence.',
        telemetryAction: 'Immutable block committed to CIA Triad SHA-256 Ledger.',
        verdict: 'CONTAINED'
      }
    ]
  },
  {
    id: 'ransomware_canary',
    name: 'Ransomware Canary Tripwire Detonation',
    mitreCode: 'MITRE ATT&CK T1486',
    badgeColor: 'border-[#f97316] text-[#f97316] bg-amber-950/40',
    steps: [
      {
        stepIndex: 1,
        title: 'Malicious Dropper Execution',
        hopFrom: 'attacker',
        hopTo: 'gateway',
        layer: 'Layer 3: Network (IPv4)',
        protocol: 'HTTPS / Phishing Stager',
        packetColor: '#E11D48',
        packetShape: 'diamond',
        explanation: 'Ransomware encryptor binary staged via external phishing link passes border gateway.',
        telemetryAction: 'Payload ingress detected via suspicious domain reputation.',
        verdict: 'FORWARDED'
      },
      {
        stepIndex: 2,
        title: 'Host Lateral Movement',
        hopFrom: 'gateway',
        hopTo: 'client',
        layer: 'Layer 7: Application Payload',
        protocol: 'Win32 Process Spawn',
        packetColor: '#F97316',
        packetShape: 'box',
        explanation: 'Dropper executes on Workstation host, preparing rapid multi-threaded key wiping.',
        telemetryAction: 'Process attempts mass traversal of system and user registry hives.',
        verdict: 'FORWARDED'
      },
      {
        stepIndex: 3,
        title: 'Honeypot Canary Key Tripwire',
        hopFrom: 'client',
        hopTo: 'canary',
        layer: 'Host Defense Tripwire Trap',
        protocol: 'RegNotifyChangeKeyValue',
        packetColor: '#E11D48',
        packetShape: 'diamond',
        explanation: 'Ransomware attempts wiping HKLM\\SOFTWARE\\WinRegHIDS\\CanaryTripwire. Honeypot sensor immediately trips!',
        telemetryAction: 'Canary tripwire detects unauthenticated write burst (> 10 writes/sec).',
        verdict: 'QUARANTINED'
      },
      {
        stepIndex: 4,
        title: 'Emergency Host Lockdown',
        hopFrom: 'canary',
        hopTo: 'defender',
        layer: 'Security Enclave (Lockdown)',
        protocol: 'Active Containment Killswitch',
        packetColor: '#C2EF4E',
        packetShape: 'sphere',
        explanation: 'Instant killswitch triggered: malicious PID terminated, host locked down, encryption halted before damage occurs.',
        telemetryAction: 'Host defense lockdown engaged; zero user files impacted.',
        verdict: 'CONTAINED'
      }
    ]
  },
  {
    id: 'credential_lsa',
    name: 'LSASS Credential Access Defense (T1003.001)',
    mitreCode: 'MITRE ATT&CK T1003.001',
    badgeColor: 'border-[#a855f7] text-[#a855f7] bg-purple-950/40',
    steps: [
      {
        stepIndex: 1,
        title: 'Remote Command Shell Injection',
        hopFrom: 'attacker',
        hopTo: 'client',
        layer: 'Layer 4: Transport (TCP)',
        protocol: 'WinRM / PowerShell Remoting',
        packetColor: '#A855F7',
        packetShape: 'diamond',
        explanation: 'Adversary leverages stolen administrator credentials to open remote PowerShell session.',
        telemetryAction: 'Remote interactive logon session monitored by host auditor.',
        verdict: 'FORWARDED'
      },
      {
        stepIndex: 2,
        title: 'LSA Memory Access Attempt',
        hopFrom: 'client',
        hopTo: 'lsa',
        layer: 'Protected Process Enclave',
        protocol: 'OpenProcess / PROCESS_VM_READ',
        packetColor: '#E11D48',
        packetShape: 'diamond',
        explanation: 'Adversary executes Mimikatz memory dump against LSASS.EXE process memory to extract cleartext passwords.',
        telemetryAction: 'RunAsPPL Credential Guard blocks handle opening with ACCESS_DENIED.',
        verdict: 'QUARANTINED'
      },
      {
        stepIndex: 3,
        title: 'Security Enclave Quarantine',
        hopFrom: 'lsa',
        hopTo: 'defender',
        layer: 'Protected Enclave Logging',
        protocol: 'Kerberos / NTLM Guard',
        packetColor: '#C2EF4E',
        packetShape: 'sphere',
        explanation: 'LSA Vault preserves token hashes; event logged as MITRE T1003.001 and added to cryptographic CIA Ledger.',
        telemetryAction: 'Cryptographic proof published to CIA Triad Audit Chain.',
        verdict: 'CONTAINED'
      }
    ]
  }
]

// Animated Core Sphere with Counter-Rotating Gyroscopic Rings
function GyroscopicCore() {
  const outerRingRef = useRef<THREE.Mesh>(null!)
  const innerRingRef = useRef<THREE.Mesh>(null!)
  const centerMeshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.4
      outerRingRef.current.rotation.y += delta * 0.3
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 0.5
      innerRingRef.current.rotation.z += delta * 0.3
    }
    if (centerMeshRef.current) {
      centerMeshRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Gyro Ring (Sentry Electric Lime) */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[2.3, 0.035, 16, 64]} />
        <meshBasicMaterial color="#C2EF4E" transparent opacity={0.6} />
      </mesh>

      {/* Counter-Rotating Mid Ring (Replicate Violet) */}
      <mesh ref={innerRingRef} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.75, 0.035, 16, 64]} />
        <meshBasicMaterial color="#A855F7" transparent opacity={0.7} />
      </mesh>

      {/* Central Glassmorphic Physical Core */}
      <mesh ref={centerMeshRef}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial
          color="#312E81"
          emissive="#1E1B4B"
          emissiveIntensity={0.5}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>

      {/* Core Wireframe Crimson Beacon */}
      <mesh>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#E11D48" wireframe emissive="#E11D48" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

// 3D Topology Node with Category-Specific Geometries & Hover HUD
function TopologyNode({
  node,
  isSelected,
  isHighlightedInTrace,
  onSelect
}: {
  node: R3FNodeData
  isSelected: boolean
  isHighlightedInTrace: boolean
  onSelect: (node: R3FNodeData) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const rotSpeed = node.category === 'threat' ? 1.6 : 0.6
      meshRef.current.rotation.y += delta * rotSpeed
      meshRef.current.rotation.x += delta * (rotSpeed * 0.5)

      const targetScale = hovered || isSelected || isHighlightedInTrace ? 1.4 : 1.0
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 9)
    }
  })

  const renderGeometry = () => {
    switch (node.shape) {
      case 'icosahedron':
        return <icosahedronGeometry args={[0.58, 0]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 0.7, 6]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.58, 0]} />
      case 'box':
        return <boxGeometry args={[0.68, 0.68, 0.68]} />
      case 'octahedron':
      default:
        return <octahedronGeometry args={[0.58, 0]} />
    }
  }

  return (
    <group position={node.pos}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(node)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}

        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered || isSelected || isHighlightedInTrace ? 0.95 : 0.45}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* Permanent High-Legibility 3D Node Label Badge */}
      <Html distanceFactor={14} position={[0, -0.75, 0]} center>
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onSelect(node)
          }}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border shadow-md backdrop-blur-md select-none cursor-pointer transition-transform hover:scale-105 whitespace-nowrap ${
            isHighlightedInTrace 
              ? 'bg-slate-900 border-amber-400 text-amber-300 ring-2 ring-amber-400/30' 
              : 'bg-slate-900/90 border-slate-700/80 text-slate-100 hover:border-slate-500'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
          <span className="text-[10px] font-sans font-semibold tracking-tight" style={{ color: node.accentColor }}>
            {node.name}
          </span>
        </div>
      </Html>

      {/* Orbit Ring Indicator on Active/Selected/Trace Node */}
      {(hovered || isSelected || isHighlightedInTrace) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 0.98, 32]} />
          <meshBasicMaterial
            color={isHighlightedInTrace ? '#C2EF4E' : node.accentColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Modern High-Contrast 3D HUD Tooltip on Hover/Select */}
      {(hovered || isSelected) && (
        <Html distanceFactor={12} position={[0, 1.25, 0]} center>
          <div className="pointer-events-none p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 font-sans text-[11px] min-w-[220px] space-y-2 select-none z-50">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-semibold text-xs truncate" style={{ color: node.accentColor }}>
                {node.name}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase border"
                style={{
                  backgroundColor: `${node.color}20`,
                  color: node.accentColor,
                  borderColor: `${node.color}40`
                }}
              >
                {node.category}
              </span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">IP:</span>
                <span className="text-slate-200">{node.ip}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Protocol:</span>
                <span className="text-emerald-400 font-semibold">{node.protocol}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Throughput:</span>
                <span className="text-indigo-300 font-medium">{node.activeThroughput}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800 line-clamp-2">
              {node.description}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Single Educational Guided Packet in Trace Mode
function GuidedEducationalPacket({
  curve,
  color,
  shape,
  progress,
  label
}: {
  curve: THREE.CatmullRomCurve3
  color: string
  shape: 'diamond' | 'box' | 'sphere'
  progress: number
  label?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const point = curve.getPoint(Math.min(progress, 1.0))
      meshRef.current.position.copy(point)
      meshRef.current.rotation.x += delta * 4
      meshRef.current.rotation.y += delta * 4
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        {shape === 'box' ? (
          <boxGeometry args={[0.28, 0.28, 0.28]} />
        ) : shape === 'diamond' ? (
          <octahedronGeometry args={[0.3, 0]} />
        ) : (
          <sphereGeometry args={[0.24, 16, 16]} />
        )}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} />

        {/* Live Traveling Packet Data Payload Badge */}
        {label && (
          <Html distanceFactor={12} position={[0, 0.55, 0]} center pointerEvents="none">
            <div className="px-2 py-0.5 rounded-full bg-slate-900/95 border border-indigo-400/80 shadow-lg text-[9px] font-mono font-semibold text-indigo-200 select-none whitespace-nowrap animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span>{label}</span>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  )
}

// Continuous Autonomous Mesh Traveling Packet
function AutonomousTravelingPacket({
  curve,
  color,
  speed = 1.0,
  shape = 'sphere'
}: {
  curve: THREE.CatmullRomCurve3
  color: string
  speed?: number
  shape?: 'box' | 'sphere' | 'diamond'
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const progress = useRef(Math.random())

  useFrame((_, delta) => {
    progress.current += delta * (0.35 * speed)
    if (progress.current > 1) progress.current = 0

    const point = curve.getPoint(progress.current)
    if (meshRef.current) {
      meshRef.current.position.copy(point)
      meshRef.current.rotation.x += delta * 4
      meshRef.current.rotation.y += delta * 4
    }
  })

  return (
    <mesh ref={meshRef}>
      {shape === 'box' ? (
        <boxGeometry args={[0.18, 0.18, 0.18]} />
      ) : shape === 'diamond' ? (
        <octahedronGeometry args={[0.2, 0]} />
      ) : (
        <sphereGeometry args={[0.14, 12, 12]} />
      )}
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// 3D Spline Arc Connection
function SplineConnection({
  fromPos,
  toPos,
  color,
  packetType,
  isTraceActive,
  mode
}: {
  fromPos: [number, number, number]
  toPos: [number, number, number]
  color: string
  packetType: 'box' | 'sphere' | 'diamond'
  isTraceActive?: boolean
  mode: 'educational' | 'autonomous'
}) {
  const { curve, points } = useMemo(() => {
    const vFrom = new THREE.Vector3(...fromPos)
    const vTo = new THREE.Vector3(...toPos)
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5)
    mid.y += 0.95
    const c = new THREE.CatmullRomCurve3([vFrom, mid, vTo])
    return { curve: c, points: c.getPoints(32) }
  }, [fromPos, toPos])

  return (
    <group>
      <Line
        points={points}
        color={isTraceActive ? '#C2EF4E' : color}
        lineWidth={isTraceActive ? 3.0 : 1.4}
        transparent
        opacity={isTraceActive ? 0.9 : 0.3}
      />
      {mode === 'autonomous' && (
        <AutonomousTravelingPacket curve={curve} color={color} speed={1.2} shape={packetType} />
      )}
    </group>
  )
}

// Background Starfield Particles in Midnight Violet & Electric Lime
function CosmicParticleConstellation() {
  const particles = useMemo(() => {
    const count = 400
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35
      positions[i + 1] = (Math.random() - 0.5) * 24
      positions[i + 2] = (Math.random() - 0.5) * 35
    }
    return positions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#6A5FC1" transparent opacity={0.5} />
    </points>
  )
}

interface R3FSecurityTopologyProps {
  onSelectNode?: (nodeId: string) => void
  selectedNodeId?: string | null
}

// Camera rig that smoothly tracks and frames the active hop in educational mode
function CameraRig({
  activeStep,
  tracerMode,
  isAutoCamEnabled
}: {
  activeStep?: TraceStep
  tracerMode: string
  isAutoCamEnabled: boolean
}) {
  const targetPos = useRef(new THREE.Vector3(0, 5, 14))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state, delta) => {
    if (!isAutoCamEnabled) return

    if (tracerMode === 'educational' && activeStep) {
      const fromNode = NODES_DATA.find((n) => n.id === activeStep.hopFrom)
      const toNode = NODES_DATA.find((n) => n.id === activeStep.hopTo)
      if (fromNode && toNode) {
        const midX = (fromNode.pos[0] + toNode.pos[0]) * 0.5
        const midY = (fromNode.pos[1] + toNode.pos[1]) * 0.5
        const midZ = (fromNode.pos[2] + toNode.pos[2]) * 0.5

        targetLookAt.current.set(midX, midY, midZ)
        targetPos.current.set(midX * 0.45, midY * 0.45 + 3.8, 12.8)
      }
    } else {
      targetLookAt.current.set(0, 0, 0)
      targetPos.current.set(0, 5, 14)
    }

    state.camera.position.lerp(targetPos.current, Math.min(delta * 2.2, 0.1))
    state.camera.lookAt(targetLookAt.current)
  })

  return null
}

export const R3FSecurityTopology: React.FC<R3FSecurityTopologyProps> = ({
  onSelectNode,
  selectedNodeId
}) => {
  // Operational Modes: 'educational' (Guided Step-by-Step CN Explainer) vs 'autonomous' (Continuous Mesh)
  const [tracerMode, setTracerMode] = useState<'educational' | 'autonomous'>('educational')

  // Scenario Selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('persistence_run_key')
  const currentScenario = useMemo(
    () => EDUCATIONAL_SCENARIOS.find((s) => s.id === selectedScenarioId) || EDUCATIONAL_SCENARIOS[0],
    [selectedScenarioId]
  )

  // Step-by-Step Educational Stepper State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlayingFlow, setIsPlayingFlow] = useState<boolean>(true)
  const [traceProgress, setTraceProgress] = useState<number>(0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true)
  const [isAutoCamEnabled, setIsAutoCamEnabled] = useState<boolean>(false)

  const activeStep = currentScenario.steps[currentStepIndex] || currentScenario.steps[0]

  // Spline Curve for the currently active educational step
  const activeStepCurve = useMemo(() => {
    const fromNode = NODES_DATA.find((n) => n.id === activeStep.hopFrom)
    const toNode = NODES_DATA.find((n) => n.id === activeStep.hopTo)
    if (!fromNode || !toNode) return null

    const vFrom = new THREE.Vector3(...fromNode.pos)
    const vTo = new THREE.Vector3(...toNode.pos)
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5)
    mid.y += 0.95
    return new THREE.CatmullRomCurve3([vFrom, mid, vTo])
  }, [activeStep])

  // Stepper Animation Loop
  useEffect(() => {
    if (tracerMode !== 'educational' || !isPlayingFlow) return

    let animId: number
    let lastTime = performance.now()

    const stepLoop = (now: number) => {
      const delta = (now - lastTime) / 1000
      lastTime = now

      setTraceProgress((prev) => {
        const next = prev + delta * (0.45 * playbackSpeed)
        if (next >= 1.0) {
          // Advance to next step automatically
          setCurrentStepIndex((oldStep) => {
            const nextStep = (oldStep + 1) % currentScenario.steps.length
            return nextStep
          })
          return 0
        }
        return next
      })

      animId = requestAnimationFrame(stepLoop)
    }

    animId = requestAnimationFrame(stepLoop)
    return () => cancelAnimationFrame(animId)
  }, [tracerMode, isPlayingFlow, currentScenario, playbackSpeed])

  // Reset progress when changing steps manually
  const handleNextStep = () => {
    setCurrentStepIndex((prev) => (prev + 1) % currentScenario.steps.length)
    setTraceProgress(0)
  }

  const handlePrevStep = () => {
    setCurrentStepIndex((prev) => (prev - 1 + currentScenario.steps.length) % currentScenario.steps.length)
    setTraceProgress(0)
  }

  const handleResetTrace = () => {
    setCurrentStepIndex(0)
    setTraceProgress(0)
    setIsPlayingFlow(true)
  }

  // Base Topology Mesh Connections
  const connections: Array<{
    from: string
    to: string
    color: string
    shape: 'box' | 'sphere' | 'diamond'
  }> = [
    { from: 'attacker', to: 'gateway', color: '#E11D48', shape: 'diamond' },
    { from: 'gateway', to: 'firewall', color: '#06B6D4', shape: 'sphere' },
    { from: 'firewall', to: 'client', color: '#A855F7', shape: 'box' },
    { from: 'client', to: 'hklm', color: '#F97316', shape: 'box' },
    { from: 'client', to: 'hkcu', color: '#F59E0B', shape: 'box' },
    { from: 'client', to: 'lsa', color: '#10B981', shape: 'diamond' },
    { from: 'client', to: 'canary', color: '#E11D48', shape: 'diamond' },
    { from: 'client', to: 'defender', color: '#C2EF4E', shape: 'sphere' },
    { from: 'hklm', to: 'defender', color: '#C2EF4E', shape: 'sphere' }
  ]

  return (
    <div className="w-full h-full relative select-none bg-[#08090e] font-sans">
      <Canvas
        camera={{ position: [0, 5, 14], fov: 45 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Deep Slate Obsidian Canvas Background */}
        <color attach="background" args={['#08090e']} />

        {/* Dynamic Multi-Hue Lighting */}
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 15, 10]} intensity={2.0} color="#A855F7" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#E11D48" />
        <pointLight position={[0, 8, 0]} intensity={1.2} color="#10B981" />

        {/* Cosmic Dust Constellation */}
        <CosmicParticleConstellation />

        {/* Central Gyroscopic Core */}
        <GyroscopicCore />

        {/* Network Splines */}
        {connections.map((conn, idx) => {
          const fromNode = NODES_DATA.find((n) => n.id === conn.from)
          const toNode = NODES_DATA.find((n) => n.id === conn.to)
          if (!fromNode || !toNode) return null

          const isStepActive =
            tracerMode === 'educational' &&
            activeStep.hopFrom === conn.from &&
            activeStep.hopTo === conn.to

          return (
            <SplineConnection
              key={idx}
              fromPos={fromNode.pos}
              toPos={toNode.pos}
              color={conn.color}
              packetType={conn.shape}
              isTraceActive={isStepActive}
              mode={tracerMode}
            />
          )
        })}

        {/* Single Guided Traveling Packet in Educational Mode */}
        {tracerMode === 'educational' && activeStepCurve && (
          <GuidedEducationalPacket
            curve={activeStepCurve}
            color={activeStep.packetColor}
            shape={activeStep.packetShape}
            progress={traceProgress}
            label={activeStep.protocol}
          />
        )}

        {/* 3D Topology Nodes */}
        {NODES_DATA.map((node) => {
          const isHighlighted =
            tracerMode === 'educational' &&
            (activeStep.hopFrom === node.id || activeStep.hopTo === node.id)

          return (
            <TopologyNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isHighlightedInTrace={isHighlighted}
              onSelect={(n) => onSelectNode?.(n.id)}
            />
          )
        })}

        {/* Camera Rig with smooth glide tracking */}
        <CameraRig
          activeStep={activeStep}
          tracerMode={tracerMode}
          isAutoCamEnabled={isAutoCamEnabled}
        />

        {/* Orbit Controls with Damping */}
        <OrbitControls
          autoRotate={!selectedNodeId && tracerMode === 'autonomous'}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.06}
          minDistance={4}
          maxDistance={25}
        />
      </Canvas>

      {/* Top Controls Bar: Mode Switcher, Scenario Picker, and Playback Toolbar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-2 pointer-events-auto z-10 text-xs font-sans">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
            <button
              onClick={() => setTracerMode('educational')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
                tracerMode === 'educational'
                  ? 'bg-indigo-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Educational Tracer</span>
            </button>
            <button
              onClick={() => setTracerMode('autonomous')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
                tracerMode === 'autonomous'
                  ? 'bg-indigo-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Mesh Flow</span>
            </button>
          </div>

          {/* Scenario Selector */}
          {tracerMode === 'educational' && (
            <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/80 shadow-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Attack Lab:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => {
                  setSelectedScenarioId(e.target.value)
                  setCurrentStepIndex(0)
                  setTraceProgress(0)
                }}
                className="bg-transparent text-white font-medium text-xs py-1 focus:outline-none cursor-pointer"
              >
                {EDUCATIONAL_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-100">
                    {sc.name}
                  </option>
                ))}
              </select>
              <span className="hidden lg:inline-block text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-semibold">
                {currentScenario.mitreCode}
              </span>
            </div>
          )}
        </div>

        {/* Stepper Controls & Camera Rig Toggle */}
        {tracerMode === 'educational' && (
          <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
            <button
              onClick={handlePrevStep}
              title="Previous Hop"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlayingFlow(!isPlayingFlow)}
              title={isPlayingFlow ? 'Pause Flow' : 'Play Flow'}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              {isPlayingFlow ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlayingFlow ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleNextStep}
              title="Next Hop"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetTrace}
              title="Reset Sequence"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setPlaybackSpeed((s) => (s === 1.0 ? 2.0 : s === 2.0 ? 0.5 : 1.0))}
              title="Toggle Playback Speed"
              className="px-2 py-1 rounded-lg bg-slate-800 text-indigo-300 hover:text-white font-mono text-[11px] font-bold"
            >
              {playbackSpeed}x
            </button>

            <button
              onClick={() => setIsAutoCamEnabled(!isAutoCamEnabled)}
              title="Auto-Focus Camera on active packet hop"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                isAutoCamEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cam Follow</span>
            </button>
          </div>
        )}
      </div>

      {/* Prominent Teacher, Student & Judge Educational Walkthrough Console */}
      {tracerMode === 'educational' && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-auto z-10 flex flex-col gap-2 font-sans">
          
          {/* Main Status & Hop Selection Bar */}
          <div className="p-2.5 rounded-xl bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Hop Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Attack Flow Hops:</span>
              </span>
              {currentScenario.steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentStepIndex(idx)
                    setTraceProgress(0)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                    idx === currentStepIndex
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40 font-bold scale-105'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>Hop {idx + 1}</span>
                  <span className="hidden sm:inline font-sans font-normal opacity-80 text-[11px]">
                    : {step.title.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Expand/Collapse Details Toggle */}
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
            >
              <Info className="w-3.5 h-3.5 text-indigo-200" />
              <span>{isDetailsExpanded ? 'Hide Brief' : 'Educational Brief'}</span>
            </button>
          </div>

          {/* Expanded Educational Teardown Drawer */}
          {isDetailsExpanded && (
            <div className="p-4 rounded-xl bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-xs space-y-3">
              {/* Header Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs"
                    style={{
                      backgroundColor: `${activeStep.packetColor}30`,
                      color: activeStep.packetColor
                    }}
                  >
                    {activeStep.stepIndex}
                  </span>
                  <span className="font-bold text-white text-sm">{activeStep.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {activeStep.hopFrom} &rarr; {activeStep.hopTo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeStep.layer}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    activeStep.verdict === 'CONTAINED' || activeStep.verdict === 'QUARANTINED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    VERDICT: {activeStep.verdict}
                  </span>
                </div>
              </div>

              {/* 3-Column Educational Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Column 1: Network & Protocol Mechanics */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-indigo-400" />
                    <span>Packet & Transport Layer</span>
                  </div>
                  <div className="font-mono text-slate-200 text-xs font-semibold">
                    Protocol: {activeStep.protocol}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    Routing: {activeStep.hopFrom} &rarr; {activeStep.hopTo}
                  </div>
                </div>

                {/* Column 2: Plain English Explainer */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-amber-400" />
                    <span>Attack Stage Explanation</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-sans">
                    {activeStep.explanation}
                  </p>
                </div>

                {/* Column 3: WinReg-HIDS Detection & Defense */}
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>WinReg-HIDS Real-Time Defense</span>
                  </div>
                  <p className="text-emerald-300 text-xs leading-relaxed font-sans">
                    {activeStep.telemetryAction}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

