import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Cpu,
  Layers,
  Radio,
  Shield,
  Zap,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  Terminal,
  Lock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Eye,
  Info
} from 'lucide-react'

export interface DissectorComponent {
  id: string
  tier: 1 | 2 | 3 | 4
  name: string
  tierName: string
  ring: 'Ring 0 (Kernel)' | 'Ring 3 (User)' | 'Hardware L1/L2' | 'Virtual Memory Storage'
  memoryOffset: string
  driverHook: string
  status: 'VERIFIED_CLEAN' | 'HOOK_ARMED' | 'MONITORED' | 'ISOLATED'
  description: string
  technicalDetails: string
  mitreDefense: string
  color: number
  position: THREE.Vector3
  mesh?: THREE.Mesh | THREE.Group
}

interface ThreeHardwareDissectorProps {
  onSelectComponent?: (comp: DissectorComponent | null) => void
}

export const ThreeHardwareDissector: React.FC<ThreeHardwareDissectorProps> = ({
  onSelectComponent
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Dissector Controls State
  const [spreadMode, setSpreadMode] = useState<'exploded' | 'compact'>('exploded')
  const [activeTierFilter, setActiveTierFilter] = useState<number | null>(null)
  const [selectedComp, setSelectedComp] = useState<DissectorComponent | null>(null)
  const [isScanActive, setIsScanActive] = useState<boolean>(true)
  const [scanStatus, setScanStatus] = useState<string>('INTEGRITY_SCAN_NOMINAL')
  const [fpsCounter, setFpsCounter] = useState<string>('60 FPS')

  // References for Three.js engine
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const componentsRef = useRef<DissectorComponent[]>([])
  const tierPlatesRef = useRef<THREE.Mesh[]>([])
  const laserPlaneRef = useRef<THREE.Mesh | null>(null)
  const animFrameIdRef = useRef<number>(0)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null)

  // Dissector Components Specification
  const initComponents = (): DissectorComponent[] => [
    // Tier 1: Hardware NIC & Buffer
    {
      id: 'nic_controller',
      tier: 1,
      name: 'PCIe GbE NIC Controller',
      tierName: 'Tier 1: Physical Network Interface (NIC)',
      ring: 'Hardware L1/L2',
      memoryOffset: '0xF7000000 - 0xF701FFFF (MMIO)',
      driverHook: 'NDIS 6.85 / e1d68x64.sys',
      status: 'VERIFIED_CLEAN',
      description: 'Physical network interface controller receiving raw Ethernet frames over RJ45.',
      technicalDetails: 'Performs hardware checksum offload, DMA packet ring transfer, and PHY frame synchronization.',
      mitreDefense: 'Mitigates physical tapping & raw MAC spoofing at OSI Layer 2.',
      color: 0x06b6d4,
      position: new THREE.Vector3(-35, 70, -15)
    },
    {
      id: 'nic_rx_buffer',
      tier: 1,
      name: 'RX/TX Packet Ring Buffer',
      tierName: 'Tier 1: Physical Network Interface (NIC)',
      ring: 'Hardware L1/L2',
      memoryOffset: '0x0000000100000000 (Non-Paged Pool)',
      driverHook: 'PacketDirect Provider Interface',
      status: 'MONITORED',
      description: 'Direct Memory Access (DMA) circular buffer queue storing in-flight network packets.',
      technicalDetails: 'Capacity: 1024 descriptors. Zero-copy ring buffer with hardware overflow containment.',
      mitreDefense: 'Detects network burst flooding and buffer exhaustion Denial-of-Service.',
      color: 0x38bdf8,
      position: new THREE.Vector3(25, 70, 20)
    },

    // Tier 2: Kernel Ring 0 & Hooks
    {
      id: 'kernel_cpu_core',
      tier: 2,
      name: 'x86_64 CPU Execution Die',
      tierName: 'Tier 2: Windows NT Kernel Core (Ring 0)',
      ring: 'Ring 0 (Kernel)',
      memoryOffset: 'Model Specific Registers (MSR 0xC0000082)',
      driverHook: 'Hardware VMX / Secure Kernel Hypervisor',
      status: 'VERIFIED_CLEAN',
      description: 'Primary processor core enforcing hardware Ring 0 / Ring 3 privilege isolation.',
      technicalDetails: 'CR0.WP write-protect flag locked. MSR SYSCALL vector pointing directly to KiSystemCall64.',
      mitreDefense: 'Enforces kernel memory protection against rootkits attempting CR0 modification.',
      color: 0x10b981,
      position: new THREE.Vector3(-40, 24, 0)
    },
    {
      id: 'advapi32_hook',
      tier: 2,
      name: 'Advapi32 / NtSetValueKey Filter Hook',
      tierName: 'Tier 2: Windows NT Kernel Core (Ring 0)',
      ring: 'Ring 0 (Kernel)',
      memoryOffset: '0x7FFF0042A100 - 0x7FFF0042A8F0',
      driverHook: 'WinReg-HIDS RegNotifyChange Driver Filter',
      status: 'HOOK_ARMED',
      description: 'Active kernel filter intercepting Win32 registry mutation syscalls in real time.',
      technicalDetails: 'Hooks NtSetValueKey, NtCreateKey, and RegDeleteValue. Latency: 0.18ms per inspection.',
      mitreDefense: 'Blocks MITRE ATT&CK T1547.001 (Persistence) and T1562.001 (Defense Evasion).',
      color: 0xe11d48,
      position: new THREE.Vector3(20, 24, -20)
    },
    {
      id: 'ssdt_dispatcher',
      tier: 2,
      name: 'SSDT System Service Dispatcher',
      tierName: 'Tier 2: Windows NT Kernel Core (Ring 0)',
      ring: 'Ring 0 (Kernel)',
      memoryOffset: 'ntoskrnl.exe!KeServiceDescriptorTable',
      driverHook: 'Kernel Patch Protection (PatchGuard)',
      status: 'VERIFIED_CLEAN',
      description: 'System Service Descriptor Table routing user-space API requests into kernel functions.',
      technicalDetails: '462 system call service entries. Continuous integrity validation with SHA-256 hash.',
      mitreDefense: 'Prevents rogue driver rootkits from hooking internal kernel syscall pointers.',
      color: 0x34d399,
      position: new THREE.Vector3(0, 24, 25)
    },

    // Tier 3: Subsystems & Protected Processes
    {
      id: 'lsass_vault',
      tier: 3,
      name: 'LSASS Protected Process (RunAsPPL)',
      tierName: 'Tier 3: Protected Subsystems & Ring 3 Services',
      ring: 'Ring 3 (User)',
      memoryOffset: 'PID 672 (Protected Process Light)',
      driverHook: 'Credential Guard Virtualization Based Security',
      status: 'VERIFIED_CLEAN',
      description: 'Local Security Authority Subsystem Service managing user tokens, Kerberos, and NTLM credentials.',
      technicalDetails: 'Configured with RunAsPPL=1. Debug privilege stripped; ReadProcessMemory blocked for non-PPL callers.',
      mitreDefense: 'Blocks MITRE ATT&CK T1003.001 (OS Credential Dumping: LSASS Memory via Mimikatz).',
      color: 0x8b5cf6,
      position: new THREE.Vector3(-30, -22, -15)
    },
    {
      id: 'winreg_daemon',
      tier: 3,
      name: 'WinReg-HIDS Detection Daemon',
      tierName: 'Tier 3: Protected Subsystems & Ring 3 Services',
      ring: 'Ring 3 (User)',
      memoryOffset: 'PID 1840 (FastAPI Telemetry Hub)',
      driverHook: 'Advapi32 Event Pipe Consumer',
      status: 'VERIFIED_CLEAN',
      description: 'Real-time telemetry correlator, MITRE classifier, and WebSocket broadcast daemon.',
      technicalDetails: 'Processes 2000 events/sec with SQLite WAL journaling and Zero-Knowledge blockchain hashing.',
      mitreDefense: 'Correlates multi-stage attacks across network, process, and registry dimensions.',
      color: 0x6366f1,
      position: new THREE.Vector3(30, -22, 10)
    },

    // Tier 4: Windows Registry Virtual Memory & Storage
    {
      id: 'regf_header',
      tier: 4,
      name: 'Registry Base Block (regf Header)',
      tierName: 'Tier 4: Windows Registry Hive Memory & B-Tree Storage',
      ring: 'Virtual Memory Storage',
      memoryOffset: 'Offset 0x00000000 (Primary Hive File)',
      driverHook: 'Kernel Registry Virtual Allocator',
      status: 'VERIFIED_CLEAN',
      description: 'Physical header block of the Windows Registry hive containing format version and root cell pointer.',
      technicalDetails: 'Magic signature "regf". Sequence numbers validated to detect unexpected power cuts or dirty writes.',
      mitreDefense: 'Guarantees structural hive integrity against offline disk tampering.',
      color: 0xf59e0b,
      position: new THREE.Vector3(-40, -68, -20)
    },
    {
      id: 'btree_cells',
      tier: 4,
      name: 'Hive B-Tree Cell Index (nk/vk)',
      tierName: 'Tier 4: Windows Registry Hive Memory & B-Tree Storage',
      ring: 'Virtual Memory Storage',
      memoryOffset: 'Virtual Bin Allocation (hbin blocks)',
      driverHook: 'Kernel Configuration Manager',
      status: 'VERIFIED_CLEAN',
      description: 'B-Tree index holding named registry keys (nk) and corresponding binary/string values (vk).',
      technicalDetails: 'Organized into 4KB hbin memory pages with forward hash indexing for rapid lookup.',
      mitreDefense: 'Prevents silent hidden subkey creation used by sophisticated rootkits.',
      color: 0xd97706,
      position: new THREE.Vector3(0, -68, 15)
    },
    {
      id: 'canary_trap_cell',
      tier: 4,
      name: 'Honeypot Canary Key (T1486 Trap)',
      tierName: 'Tier 4: Windows Registry Hive Memory & B-Tree Storage',
      ring: 'Virtual Memory Storage',
      memoryOffset: 'HKLM\\SOFTWARE\\WinRegHIDS\\Canary',
      driverHook: 'High-Velocity Burst Detector Filter',
      status: 'HOOK_ARMED',
      description: 'Honeypot bait key disguised as administrative configuration to detect automated ransomware encryption.',
      technicalDetails: 'Velocity threshold: > 10 writes/sec triggers instant host isolation and snapshot lock.',
      mitreDefense: 'Neutralizes MITRE ATT&CK T1486 (Data Encrypted for Impact / Ransomware).',
      color: 0xf43f5e,
      position: new THREE.Vector3(40, -68, -10)
    },
    {
      id: 'cia_sha256_ledger',
      tier: 4,
      name: 'CIA Triad Cryptographic Anchor',
      tierName: 'Tier 4: Windows Registry Hive Memory & B-Tree Storage',
      ring: 'Virtual Memory Storage',
      memoryOffset: 'Forward-Linked Hash Chain (Block 3)',
      driverHook: 'Cryptographic Integrity Engine',
      status: 'VERIFIED_CLEAN',
      description: 'Tamper-evident SHA-256 hash block chain anchoring every registry mutation in an immutable ledger.',
      technicalDetails: 'PrevHash -> CurrentBlockHash verification. Any manual hex edit breaks the chain immediately.',
      mitreDefense: 'Guarantees Non-Repudiation and Integrity audit trails for court and compliance forensics.',
      color: 0x10b981,
      position: new THREE.Vector3(25, -68, 35)
    }
  ]

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current

    const width = container.clientWidth || 800
    const height = container.clientHeight || 500

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0f1d)
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0022)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      width / height,
      1,
      1200
    )
    camera.position.set(0, 75, 230)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 60
    controls.maxDistance = 450
    controls.maxPolarAngle = Math.PI / 2 + 0.15
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5)
    keyLight.position.set(120, 160, 100)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xa855f7, 2.0)
    rimLight.position.set(-140, -40, -100)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0x34d399, 1.2)
    fillLight.position.set(0, 120, -120)
    scene.add(fillLight)

    // Floor Cyber Grid
    const gridHelper = new THREE.GridHelper(360, 36, 0x1e293b, 0x0f172a)
    gridHelper.position.y = -100
    scene.add(gridHelper)

    // 4 Stack Tier Base Plates (Holographic Architectural Slabs)
    const tierConfigs = [
      { tier: 1, baseName: 'TIER 1: PHYSICAL NIC & OSI L2 BUFFER', color: 0x06b6d4, baseY: 70, w: 140, d: 90 },
      { tier: 2, baseName: 'TIER 2: WINDOWS KERNEL RING 0 & HOOKS', color: 0x10b981, baseY: 24, w: 150, d: 100 },
      { tier: 3, baseName: 'TIER 3: PROTECTED SUBSYSTEMS & USER RING 3', color: 0x8b5cf6, baseY: -22, w: 150, d: 100 },
      { tier: 4, baseName: 'TIER 4: REGISTRY B-TREE & CIA LEDGER', color: 0xf59e0b, baseY: -68, w: 160, d: 110 }
    ]

    tierPlatesRef.current = []
    tierConfigs.forEach((cfg) => {
      // Semi-transparent PCB Glass Slab
      const slabGeom = new THREE.BoxGeometry(cfg.w, 3, cfg.d)
      const slabMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.12,
        roughness: 0.2,
        metalness: 0.7,
        transparent: true,
        opacity: 0.45,
        wireframe: false
      })
      const slab = new THREE.Mesh(slabGeom, slabMat)
      slab.position.y = cfg.baseY
      slab.userData = { isTierPlate: true, tier: cfg.tier, baseY: cfg.baseY }
      scene.add(slab)
      tierPlatesRef.current.push(slab)

      // Cyber wireframe perimeter edge
      const edgeGeom = new THREE.EdgesGeometry(slabGeom)
      const edgeMat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.85 })
      const edges = new THREE.LineSegments(edgeGeom, edgeMat)
      slab.add(edges)

      // Vertical bus pillar connectors linking tiers
      const pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 200, 8)
      const pillarMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35 })
      if (cfg.tier === 1) {
        ;[-cfg.w / 2 + 5, cfg.w / 2 - 5].forEach((px) => {
          ;[-cfg.d / 2 + 5, cfg.d / 2 - 5].forEach((pz) => {
            const pillar = new THREE.Mesh(pillarGeom, pillarMat)
            pillar.position.set(px, 0, pz)
            scene.add(pillar)
          })
        })
      }
    })

    // Components Creation
    const comps = initComponents()
    componentsRef.current = comps

    comps.forEach((comp) => {
      const compGroup = new THREE.Group()
      compGroup.position.copy(comp.position)

      let geom: THREE.BufferGeometry
      if (comp.id === 'kernel_cpu_core') {
        geom = new THREE.BoxGeometry(18, 5, 18)
      } else if (comp.id === 'lsass_vault') {
        geom = new THREE.OctahedronGeometry(9, 0)
      } else if (comp.id === 'cia_sha256_ledger') {
        geom = new THREE.DodecahedronGeometry(8, 0)
      } else if (comp.id === 'canary_trap_cell') {
        geom = new THREE.TetrahedronGeometry(9, 0)
      } else {
        geom = new THREE.CylinderGeometry(6, 6, 8, 16)
      }

      const mat = new THREE.MeshStandardMaterial({
        color: comp.color,
        emissive: comp.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.8
      })

      const mesh = new THREE.Mesh(geom, mat)
      mesh.userData = { isDissectorComp: true, compId: comp.id, originalColor: comp.color }
      compGroup.add(mesh)

      // Wireframe edge glow
      const edgesGeom = new THREE.EdgesGeometry(geom)
      const edgesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
      const edges = new THREE.LineSegments(edgesGeom, edgesMat)
      compGroup.add(edges)

      // Pulsing outer orbit ring
      const ringGeom = new THREE.RingGeometry(10, 11, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: comp.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      })
      const ring = new THREE.Mesh(ringGeom, ringMat)
      ring.rotation.x = Math.PI / 2
      compGroup.add(ring)

      comp.mesh = compGroup as unknown as THREE.Mesh
      compGroup.userData = { compId: comp.id }
      scene.add(compGroup)
    })

    // Animated Laser Scanning Plane
    const laserGeom = new THREE.PlaneGeometry(180, 130)
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    })
    const laserMesh = new THREE.Mesh(laserGeom, laserMat)
    laserMesh.rotation.x = Math.PI / 2
    laserMesh.position.y = 0
    scene.add(laserMesh)
    laserPlaneRef.current = laserMesh

    // Laser border bright line
    const laserBorderGeom = new THREE.EdgesGeometry(laserGeom)
    const laserBorderMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.9 })
    const laserBorder = new THREE.LineSegments(laserBorderGeom, laserBorderMat)
    laserMesh.add(laserBorder)

    // Raycast Interaction (Click & Hover)
    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      let hitCompMesh: THREE.Mesh | null = null
      for (const hit of intersects) {
        if (hit.object.userData && hit.object.userData.isDissectorComp) {
          hitCompMesh = hit.object as THREE.Mesh
          break
        }
      }

      if (hitCompMesh !== hoveredMeshRef.current) {
        if (hoveredMeshRef.current) {
          const original = hoveredMeshRef.current.userData.originalColor
          ;(hoveredMeshRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(original)
          ;(hoveredMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35
        }
        if (hitCompMesh) {
          ;(hitCompMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff)
          ;(hitCompMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9
          canvas.style.cursor = 'pointer'
        } else {
          canvas.style.cursor = 'grab'
        }
        hoveredMeshRef.current = hitCompMesh
      }
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      for (const hit of intersects) {
        if (hit.object.userData && hit.object.userData.isDissectorComp) {
          const compId = hit.object.userData.compId
          const found = componentsRef.current.find((c) => c.id === compId)
          if (found) {
            setSelectedComp(found)
            onSelectComponent?.(found)
            return
          }
        }
      }
    }

    canvas.addEventListener('mousemove', handlePointerMove)
    canvas.addEventListener('click', handleClick)

    // Render Loop
    let laserY = 80
    let laserDir = -1
    let lastTime = performance.now()
    let frameCount = 0

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate)

      // FPS Calculation
      frameCount++
      if (time - lastTime >= 1000) {
        setFpsCounter(`${frameCount} FPS`)
        frameCount = 0
        lastTime = time
      }

      // Laser Scanner Animation
      if (isScanActive && laserPlaneRef.current) {
        laserY += laserDir * 0.45
        if (laserY < -85) {
          laserY = -85
          laserDir = 1
        } else if (laserY > 85) {
          laserY = 85
          laserDir = -1
        }
        laserPlaneRef.current.position.y = laserY
      }

      // Rotate Component Sub-meshes slowly
      componentsRef.current.forEach((comp) => {
        if (comp.mesh) {
          comp.mesh.rotation.y += 0.008
        }
      })

      controls.update()
      renderer.render(scene, camera)
    }

    animFrameIdRef.current = requestAnimationFrame(animate)

    // Resize Handler with ResizeObserver support
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth || 800
      const h = container.clientHeight || 500
      if (w > 0 && h > 0) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animFrameIdRef.current)
      ro.disconnect()
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handlePointerMove)
      canvas.removeEventListener('click', handleClick)
      renderer.dispose()
    }
  }, [])

  // Animate Spread Explosion / Compact
  useEffect(() => {
    const spreadMultiplier = spreadMode === 'exploded' ? 1.0 : 0.28

    tierPlatesRef.current.forEach((plate) => {
      const targetY = plate.userData.baseY * spreadMultiplier
      plate.position.y = targetY
    })

    componentsRef.current.forEach((comp) => {
      if (comp.mesh) {
        comp.mesh.position.y = comp.position.y * spreadMultiplier
      }
    })
  }, [spreadMode])

  // Filter Active Tier
  useEffect(() => {
    tierPlatesRef.current.forEach((plate) => {
      if (activeTierFilter === null) {
        plate.visible = true
      } else {
        plate.visible = plate.userData.tier === activeTierFilter
      }
    })

    componentsRef.current.forEach((comp) => {
      if (comp.mesh) {
        if (activeTierFilter === null) {
          comp.mesh.visible = true
        } else {
          comp.mesh.visible = comp.tier === activeTierFilter
        }
      }
    })
  }, [activeTierFilter])

  return (
    <div ref={containerRef} className="w-full h-full relative select-none bg-[#0A0F1D] overflow-hidden">
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Dissector Header & Controls */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2.5 pointer-events-auto z-20 text-xs font-sans">
        
        {/* Left: Explode / Compact & Scan Toggle */}
        <div className="flex items-center gap-2">
          {/* Exploded Architecture Toggle */}
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border-2 border-slate-700/80 shadow-[2px_2px_0px_#0F172A]">
            <button
              onClick={() => setSpreadMode('exploded')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                spreadMode === 'exploded'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Exploded Stack</span>
            </button>
            <button
              onClick={() => setSpreadMode('compact')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                spreadMode === 'compact'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Assembled Chassis</span>
            </button>
          </div>

          {/* Laser Scanner Control */}
          <button
            onClick={() => setIsScanActive(!isScanActive)}
            className={`px-3 py-1.5 rounded-xl border-2 border-slate-700/80 backdrop-blur-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#0F172A] ${
              isScanActive
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60'
                : 'bg-slate-900/90 text-slate-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isScanActive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isScanActive ? 'Laser Scan Active' : 'Scan Paused'}</span>
          </button>
        </div>

        {/* Right: Tier Isolation Quick Filters */}
        <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border-2 border-slate-700/80 shadow-[2px_2px_0px_#0F172A]">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">Isolate:</span>
          {[
            { id: null, label: 'All Tiers' },
            { id: 1, label: 'T1: NIC' },
            { id: 2, label: 'T2: Kernel' },
            { id: 3, label: 'T3: Subsystems' },
            { id: 4, label: 'T4: B-Tree' }
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveTierFilter(t.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeTierFilter === t.id
                  ? 'bg-slate-800 text-white border border-slate-600 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Bottom Left: Dissector Telemetry & Architecture Guide */}
      <div className="absolute bottom-3 left-3 p-3.5 bg-slate-900/95 backdrop-blur-md border-2 border-slate-800 rounded-xl space-y-1.5 text-xs shadow-2xl z-20 font-sans max-w-sm">
        <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>3D Hardware & Kernel Subsystem Dissector</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Exploded vertical stack demonstrating physical NIC packet ingress down into Ring 0 kernel hooks and Windows Registry B-Tree storage.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px] font-mono">
          <div className="text-slate-400">
            Framerate: <span className="text-emerald-400 font-bold">{fpsCounter}</span>
          </div>
          <div className="text-slate-400">
            Hardware Tiers: <span className="text-indigo-300 font-bold">4 Layers Monitored</span>
          </div>
        </div>
        <div className="text-indigo-400 font-semibold text-[10px] pt-0.5">
          Click any chip, hook sensor, or B-tree cell to inspect internal memory offsets.
        </div>
      </div>

      {/* Interactive Component Inspection Modal */}
      {selectedComp && (
        <div className="absolute top-16 right-4 w-96 bg-white/98 backdrop-blur-2xl border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_#0F172A] p-4.5 space-y-3 z-30 font-sans text-xs">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-4 h-4 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#0F172A]"
                style={{ backgroundColor: `#${selectedComp.color.toString(16).padStart(6, '0')}` }}
              />
              <span className="font-black text-slate-900 text-sm tracking-tight">{selectedComp.name}</span>
            </div>
            <button
              onClick={() => setSelectedComp(null)}
              className="p-1 rounded-lg border border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tier & Ring Metadata */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 space-y-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedComp.tierName}</div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="font-bold text-slate-900">Privilege Ring:</span>
              <span className="text-indigo-700 font-bold">{selectedComp.ring}</span>
            </div>
          </div>

          {/* Technical Offsets */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Memory / MSR:</span>
              <span className="text-slate-900 font-bold text-[11px] truncate max-w-[200px]">{selectedComp.memoryOffset}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Driver Hook:</span>
              <span className="text-emerald-700 font-bold text-[11px] truncate max-w-[200px]">{selectedComp.driverHook}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 text-slate-700 leading-relaxed text-xs">
            <div className="font-bold text-slate-900 text-[11px]">Operational Architecture:</div>
            <p className="text-slate-600">{selectedComp.description}</p>
          </div>

          {/* Deep Technical Specs */}
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1 text-xs">
            <div className="text-indigo-900 font-bold text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-700" />
              <span>Kernel & Hardware Mechanics</span>
            </div>
            <p className="text-indigo-950 text-[11px] leading-relaxed font-sans">
              {selectedComp.technicalDetails}
            </p>
          </div>

          {/* MITRE Defense Correlation */}
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
            <div className="font-bold text-[11px] text-rose-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-700" />
              <span>Security Posture & MITRE ATT&CK Defense</span>
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              {selectedComp.mitreDefense}
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>State: {selectedComp.status}</span>
            </span>
            <button
              onClick={() => setSelectedComp(null)}
              className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
