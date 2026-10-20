import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Shield,
  Activity,
  RotateCcw,
  Zap,
  Eye,
  Sliders,
  Crosshair,
  Radio,
  Terminal,
  X,
  Flame,
  AlertTriangle,
  Lock,
  Globe,
  Maximize2,
  Layers
} from 'lucide-react';
import { fetchPacketStream, simulateAttackScenario, PacketItem } from '../services/api';
import { R3FSecurityTopology } from './R3FSecurityTopology';
import { ThreeHardwareDissector } from './ThreeHardwareDissector';

interface GraphNode {
  id: string;
  name: string;
  category: 'HOST_KERNEL' | 'NETWORK_PERIMETER' | 'THREAT_ACTOR' | 'SECURITY_ENCLAVE';
  position: THREE.Vector3;
  color: number;
  size: number;
  ip: string;
  mac: string;
  description: string;
  mesh?: THREE.Mesh;
}

interface NetworkConnection {
  fromId: string;
  toId: string;
  curve: THREE.CatmullRomCurve3;
  lineMesh?: THREE.Line;
}

interface ActivePacket {
  id: string;
  data: PacketItem;
  fromId: string;
  toId: string;
  progress: number;
  speed: number;
  color: number;
  mesh?: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
}

interface ThreeSecurityGlobeProps {
  alerts?: any[];
}

export const ThreeSecurityGlobe: React.FC<ThreeSecurityGlobeProps> = ({ alerts }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine Mode Toggle (R3F vs Native Three.js WebGL)
  const [engineMode, setEngineMode] = useState<'r3f' | 'threejs'>('r3f');

  // Inspector States
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<PacketItem | null>(null);

  const handleSelectNodeById = (nodeId: string) => {
    const found = nodesRef.current.find((n) => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
      setSelectedPacket(null);
    }
  };

  // Controls & Telemetry
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [packetSpeed, setPacketSpeed] = useState<number>(1.0);
  const [activePacketsCount, setActivePacketsCount] = useState<number>(0);
  const [liveStreamRate, setLiveStreamRate] = useState<string>('60 FPS');
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // References for render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const connectionsRef = useRef<NetworkConnection[]>([]);
  const packetsRef = useRef<ActivePacket[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Define 3D Node Topology
  const initNodes = (): GraphNode[] => [
    {
      id: 'attacker',
      name: 'External Threat Actor',
      category: 'THREAT_ACTOR',
      position: new THREE.Vector3(-220, 90, -110),
      color: 0xef4444,
      size: 11,
      ip: '198.51.100.44',
      mac: '52:54:00:12:34:56',
      description: 'Adversary Command & Control / Phishing Injection Point'
    },
    {
      id: 'gateway',
      name: 'Perimeter Gateway Router',
      category: 'NETWORK_PERIMETER',
      position: new THREE.Vector3(-110, 45, -30),
      color: 0x3b82f6,
      size: 13,
      ip: '192.168.1.1',
      mac: '00:50:56:FE:10:01',
      description: 'Border edge routing & deep packet inspection boundary'
    },
    {
      id: 'firewall',
      name: 'Next-Gen Firewall / IDS',
      category: 'NETWORK_PERIMETER',
      position: new THREE.Vector3(-60, -20, 50),
      color: 0x8b5cf6,
      size: 12,
      ip: '192.168.1.254',
      mac: '00:50:56:FE:20:99',
      description: 'Stateful packet filter & network intrusion prevention'
    },
    {
      id: 'dns',
      name: 'Enterprise DNS Resolver',
      category: 'NETWORK_PERIMETER',
      position: new THREE.Vector3(-140, -80, -70),
      color: 0x06b6d4,
      size: 10,
      ip: '10.0.0.53',
      mac: '00:50:56:AA:33:53',
      description: 'DNS over HTTPS / Typosquatted homograph query inspection'
    },
    {
      id: 'client',
      name: 'Workstation Client Host',
      category: 'HOST_KERNEL',
      position: new THREE.Vector3(50, 20, 20),
      color: 0x38bdf8,
      size: 14,
      ip: '192.168.1.105',
      mac: '00:15:5D:8A:2B:11',
      description: 'Monitored Windows 11 endpoint executing WinReg-HIDS agent'
    },
    {
      id: 'hklm',
      name: 'HKLM [System & Machine Hive]',
      category: 'HOST_KERNEL',
      position: new THREE.Vector3(140, 90, 80),
      color: 0xf59e0b,
      size: 12,
      ip: '127.0.0.1 (Kernel)',
      mac: '00:00:00:00:00:00',
      description: 'Critical system persistence keys (Run, IFEO, Services)'
    },
    {
      id: 'hkcu',
      name: 'HKCU [User Profile Hive]',
      category: 'HOST_KERNEL',
      position: new THREE.Vector3(160, -60, -40),
      color: 0x14b8a6,
      size: 11,
      ip: '127.0.0.1 (Kernel)',
      mac: '00:00:00:00:00:00',
      description: 'User-space startup autoruns and shell handlers'
    },
    {
      id: 'lsa',
      name: 'LSA Credential Vault',
      category: 'SECURITY_ENCLAVE',
      position: new THREE.Vector3(120, -110, 60),
      color: 0x10b981,
      size: 13,
      ip: '127.0.0.1 (PPL)',
      mac: '00:00:00:00:00:00',
      description: 'Local Security Authority Protected Process Light (RunAsPPL)'
    },
    {
      id: 'canary',
      name: 'Ransomware Canary Tripwire',
      category: 'SECURITY_ENCLAVE',
      position: new THREE.Vector3(200, 30, -70),
      color: 0xf43f5e,
      size: 11,
      ip: '127.0.0.1 (Tripwire)',
      mac: '00:00:00:00:00:00',
      description: 'Honeypot registry key triggering automated host quarantine'
    },
    {
      id: 'defender',
      name: 'Windows Defender Shield',
      category: 'SECURITY_ENCLAVE',
      position: new THREE.Vector3(70, 130, -50),
      color: 0x22c55e,
      size: 12,
      ip: '127.0.0.1 (Policy)',
      mac: '00:00:00:00:00:00',
      description: 'AntiSpyware & TamperProtection policy enforcement'
    }
  ];

  // Spawn a visual packet along spline
  const spawnVisualPacket = (packetItem: PacketItem) => {
    if (!sceneRef.current) return;
    const fromNode = nodesRef.current.find((n) => n.id === packetItem.from_node);
    const toNode = nodesRef.current.find((n) => n.id === packetItem.to_node);
    if (!fromNode || !toNode) return;

    // Build or reuse curve
    const midPoint = new THREE.Vector3()
      .addVectors(fromNode.position, toNode.position)
      .multiplyScalar(0.5);
    midPoint.y += 35; // Curve arc upwards for high-end 3D visual feel

    const curve = new THREE.CatmullRomCurve3([
      fromNode.position,
      midPoint,
      toNode.position
    ]);

    let packetColor = 0x38bdf8;
    if (packetItem.security.threat_level === 'CRITICAL') packetColor = 0xef4444;
    else if (packetItem.security.threat_level === 'HIGH') packetColor = 0xf97316;
    else if (packetItem.security.threat_level === 'SUSPICIOUS') packetColor = 0xf59e0b;
    else packetColor = 0x10b981;

    // Glowing packet sphere
    const geom = new THREE.SphereGeometry(3.5, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: packetColor,
      wireframe: false
    });
    const packetMesh = new THREE.Mesh(geom, mat);
    packetMesh.position.copy(fromNode.position);
    sceneRef.current.add(packetMesh);

    const activePacket: ActivePacket = {
      id: packetItem.packet_id,
      data: packetItem,
      fromId: fromNode.id,
      toId: toNode.id,
      progress: 0,
      speed: 0.008 + Math.random() * 0.006,
      color: packetColor,
      mesh: packetMesh,
      curve: curve
    };

    packetsRef.current.push(activePacket);
  };

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (engineMode !== 'threejs') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth > 0 ? container.clientWidth : 900;
    const height = container.clientHeight > 0 ? container.clientHeight : 560;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0a1c);
    scene.fog = new THREE.FogExp2(0x0f0a1c, 0.0016);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 2000);
    camera.position.set(0, 180, 420);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 80;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x8b5cf6, 1.8);
    dirLight1.position.set(200, 300, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc2ef4e, 1.2);
    dirLight2.position.set(-200, -200, -200);
    scene.add(dirLight2);

    // 1. Starfield / Cyber Grid Constellation
    const particleCount = 450;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1200;
      positions[i + 1] = (Math.random() - 0.5) * 800;
      positions[i + 2] = (Math.random() - 0.5) * 1200;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x362d59,
      size: 2.2,
      transparent: true,
      opacity: 0.65
    });
    const starfield = new THREE.Points(particleGeom, particleMat);
    scene.add(starfield);

    // 2. Central Holographic Security Core
    const coreGeom = new THREE.IcosahedronGeometry(42, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      wireframe: true,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(coreMesh);

    // Outer orbital rings
    const ringGeom = new THREE.TorusGeometry(85, 0.8, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.4 });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    scene.add(ringMesh);

    // 3. Build Nodes with Distinct Geometries
    const nodes = initNodes();
    nodes.forEach((node) => {
      let nodeGeom: THREE.BufferGeometry;
      if (node.id === 'attacker') {
        nodeGeom = new THREE.IcosahedronGeometry(node.size * 1.2, 0);
      } else if (node.category === 'NETWORK_PERIMETER') {
        nodeGeom = new THREE.CylinderGeometry(node.size * 0.8, node.size * 0.8, node.size * 1.4, 6);
      } else if (node.id === 'hklm' || node.id === 'hkcu') {
        nodeGeom = new THREE.BoxGeometry(node.size * 1.3, node.size * 1.3, node.size * 1.3);
      } else if (node.category === 'SECURITY_ENCLAVE') {
        nodeGeom = new THREE.OctahedronGeometry(node.size * 1.1, 0);
      } else {
        nodeGeom = new THREE.DodecahedronGeometry(node.size, 0);
      }

      const nodeMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(nodeGeom, nodeMat);
      mesh.position.copy(node.position);
      mesh.userData = { nodeId: node.id, type: 'node' };
      scene.add(mesh);
      node.mesh = mesh;

      // Outer aura ring around alert/threat nodes
      if (node.category === 'THREAT_ACTOR' || node.id === 'canary') {
        const haloGeom = new THREE.RingGeometry(node.size + 4, node.size + 6, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: node.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.position.copy(node.position);
        scene.add(haloMesh);
      }
    });
    nodesRef.current = nodes;

    // 4. Build Static Connection Lines (Splines)
    const connectionPairs: [string, string][] = [
      ['attacker', 'gateway'],
      ['attacker', 'dns'],
      ['gateway', 'firewall'],
      ['firewall', 'client'],
      ['dns', 'client'],
      ['client', 'hklm'],
      ['client', 'hkcu'],
      ['client', 'lsa'],
      ['client', 'canary'],
      ['client', 'defender'],
      ['hklm', 'defender']
    ];

    const connections: NetworkConnection[] = [];
    connectionPairs.forEach(([fromId, toId]) => {
      const fromNode = nodes.find((n) => n.id === fromId);
      const toNode = nodes.find((n) => n.id === toId);
      if (!fromNode || !toNode) return;

      const midPoint = new THREE.Vector3()
        .addVectors(fromNode.position, toNode.position)
        .multiplyScalar(0.5);
      midPoint.y += 25;

      const curve = new THREE.CatmullRomCurve3([fromNode.position, midPoint, toNode.position]);
      const points = curve.getPoints(40);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x362d59,
        transparent: true,
        opacity: 0.55
      });
      const lineMesh = new THREE.Line(lineGeom, lineMat);
      scene.add(lineMesh);

      connections.push({ fromId, toId, curve, lineMesh });
    });
    connectionsRef.current = connections;

    // 5. Initial Seed Packets
    fetchPacketStream(6).then((res) => {
      res.packets.forEach((p) => spawnVisualPacket(p));
    }).catch(() => {});

    // 6. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);
    // Trigger immediate resize after layout paint
    requestAnimationFrame(handleResize);

    // 7. Raycaster Mouse Click Handler
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Check node hits
      const nodeMeshes = nodesRef.current.map((n) => n.mesh!).filter(Boolean);
      const nodeIntersects = raycasterRef.current.intersectObjects(nodeMeshes);

      if (nodeIntersects.length > 0) {
        const hit = nodeIntersects[0].object as THREE.Mesh;
        const matchedNode = nodesRef.current.find((n) => n.id === hit.userData.nodeId);
        if (matchedNode) {
          setSelectedNode(matchedNode);
          setSelectedPacket(null);
          return;
        }
      }

      // Check packet hits
      const packetMeshes = packetsRef.current.map((p) => p.mesh!).filter(Boolean);
      const packetIntersects = raycasterRef.current.intersectObjects(packetMeshes);
      if (packetIntersects.length > 0) {
        const hitPacket = packetsRef.current.find((p) => p.mesh === packetIntersects[0].object);
        if (hitPacket) {
          setSelectedPacket(hitPacket.data);
          setSelectedNode(null);
          return;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Animation Frame Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate scene slowly if rotation is enabled
      if (isRotating) {
        coreMesh.rotation.y += 0.008;
        coreMesh.rotation.x += 0.004;
        ringMesh.rotation.z += 0.005;
        starfield.rotation.y += 0.0004;
      }

      controls.update();

      // Update traveling packets
      const packets = packetsRef.current;
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed * packetSpeed;

        if (p.progress >= 1.0) {
          // Loop packet back
          p.progress = 0;
        }

        if (p.mesh && p.curve) {
          const point = p.curve.getPoint(p.progress);
          p.mesh.position.copy(point);
        }
      }

      setActivePacketsCount(packets.length);
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      // Dispose Three.js objects
      scene.clear();
      renderer.dispose();
    };
  }, [engineMode, isRotating, packetSpeed]);

  // Periodic Telemetry Stream Feeder
  useEffect(() => {
    const packetFeeder = setInterval(async () => {
      if (packetsRef.current.length < 16) {
        try {
          const res = await fetchPacketStream(2);
          res.packets.forEach((p) => spawnVisualPacket(p));
        } catch (e) {
          // ignore
        }
      }
    }, 4000);
    return () => clearInterval(packetFeeder);
  }, []);

  // Attack Trigger Scenarios
  const triggerScenario = async (type: string) => {
    try {
      setSimulationStatus(`Injecting ${type} packet sequence...`);
      const res = await simulateAttackScenario(type);
      res.packets.forEach((p) => spawnVisualPacket(p));
      setSimulationStatus(`Active: ${type} attack traffic flowing through 3D topology.`);
      setTimeout(() => setSimulationStatus(null), 6000);
    } catch (e) {
      console.error(e);
      setSimulationStatus('Simulation injection failed.');
    }
  };

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 180, 420);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleFocusThreatVector = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(-160, 120, 100);
      controlsRef.current.target.set(-110, 45, -30);
      controlsRef.current.update();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs font-sans select-none shadow-sm">
      {/* Top Controls Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-white/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            {engineMode === 'r3f' ? (
              <Globe className="w-4 h-4 text-indigo-600" />
            ) : (
              <Layers className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">
                {engineMode === 'r3f'
                  ? '3D Spatial Network & Attack Topology'
                  : 'Exploded 3D Host Hardware & Kernel Subsystem Dissector'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                engineMode === 'r3f'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {engineMode === 'r3f' ? 'View 1: Network & Attack Flow (R3F)' : 'View 2: Host Hardware Dissector (Three.js)'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-normal mt-0.5">
              {engineMode === 'r3f'
                ? 'Educational Sequence Tracer & Interactive 3D Packet Raycasting (Perimeter -> Host Registry)'
                : 'Interactive Multi-Tier Exploded Hardware: NIC Buffer -> NT Kernel Ring 0 -> LSASS -> Registry B-Tree'}
            </div>
          </div>
        </div>

        {/* Engine Switcher & Viewport Presets */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Mode Pill Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setEngineMode('r3f')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                engineMode === 'r3f'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>View 1: Attack Flow (R3F)</span>
            </button>
            <button
              onClick={() => setEngineMode('threejs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                engineMode === 'threejs'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>View 2: Host Hardware (Three.js)</span>
            </button>
          </div>

          {/* Perspective Presets (Only when in R3F mode) */}
          {engineMode === 'r3f' && (
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-all shadow-xs ${
                  isRotating
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRotating ? 'Orbit Active' : 'Orbit Paused'}</span>
              </button>

              <button
                onClick={handleResetCamera}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-all shadow-xs"
              >
                Reset View
              </button>
              <button
                onClick={handleFocusThreatVector}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Crosshair className="w-3.5 h-3.5 text-rose-600" />
                <span>Threat Angle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main 3D Viewport Frame */}
      <div ref={containerRef} className="flex-1 relative bg-[#0B0F19] overflow-hidden min-h-[460px]">
        {/* View 1: R3F Engine Container */}
        <div className={`w-full h-full ${engineMode === 'r3f' ? 'block' : 'hidden'}`}>
          <R3FSecurityTopology
            onSelectNode={handleSelectNodeById}
            selectedNodeId={selectedNode?.id || null}
          />
        </div>

        {/* View 2: Native Three.js WebGL Exploded Dissector Container */}
        {engineMode === 'threejs' && (
          <div className="w-full h-full block">
            <ThreeHardwareDissector />
          </div>
        )}

        {/* ======================= NODE INSPECTOR DIALOG ======================= */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-4 space-y-3 z-30 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `#${selectedNode.color.toString(16).padStart(6, '0')}` }}
                />
                <span className="font-semibold text-slate-900 text-sm tracking-tight">{selectedNode.name}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Node ID:</span>
                <span className="text-slate-900 font-mono font-semibold">{selectedNode.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="text-indigo-600 font-mono font-semibold">{selectedNode.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">IP Address:</span>
                <span className="text-slate-800 font-mono">{selectedNode.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">MAC Address:</span>
                <span className="text-slate-800 font-mono">{selectedNode.mac}</span>
              </div>
              <div className="pt-2 text-slate-600 leading-relaxed font-sans border-t border-slate-100">
                {selectedNode.description}
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Telemetry: ARMED</span>
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ======================= DEEP PACKET INSPECTION (DPI) DRAWER ======================= */}
        {selectedPacket && (
          <div className="absolute top-4 right-4 w-96 max-h-[90%] overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-4 space-y-3 z-30 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-900 text-sm tracking-tight">Deep Packet Inspection (DPI)</span>
              </div>
              <button
                onClick={() => setSelectedPacket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Packet Header Banner */}
            <div className={`p-3 rounded-lg border text-xs space-y-1 shadow-xs ${
              selectedPacket.security.threat_level === 'CRITICAL'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : selectedPacket.security.threat_level === 'HIGH'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span className="font-mono">{selectedPacket.packet_id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-white/80 border">
                  {selectedPacket.security.threat_level}
                </span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                {selectedPacket.src_name} &rarr; {selectedPacket.dst_name}
              </div>
              {selectedPacket.security.mitre_technique !== 'N/A' && (
                <div className="text-[11px] font-semibold text-rose-700">
                  MITRE ATT&CK: {selectedPacket.security.mitre_technique}
                </div>
              )}
            </div>

            {/* OSI 7-Layer Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-indigo-600 font-semibold uppercase text-[10px] tracking-wider">Layer 2: Data Link (Ethernet)</div>
                <div className="text-slate-700 font-mono text-[11px]">Src MAC: {selectedPacket.osi_layers.layer2_datalink.src_mac}</div>
                <div className="text-slate-700 font-mono text-[11px]">Dst MAC: {selectedPacket.osi_layers.layer2_datalink.dst_mac}</div>
                <div className="text-slate-500 font-mono text-[10px]">EtherType: {selectedPacket.osi_layers.layer2_datalink.ethertype}</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-indigo-600 font-semibold uppercase text-[10px] tracking-wider">Layer 3: Network (IPv4)</div>
                <div className="text-slate-700 font-mono text-[11px]">Src IP: {selectedPacket.osi_layers.layer3_network.src_ip}</div>
                <div className="text-slate-700 font-mono text-[11px]">Dst IP: {selectedPacket.osi_layers.layer3_network.dst_ip}</div>
                <div className="text-slate-500 font-mono text-[10px]">Protocol: {selectedPacket.osi_layers.layer3_network.protocol} &bull; TTL: {selectedPacket.osi_layers.layer3_network.ttl}</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-emerald-600 font-semibold uppercase text-[10px] tracking-wider">Layer 4: Transport (TCP / UDP)</div>
                <div className="text-slate-700 font-mono text-[11px]">Ports: {selectedPacket.osi_layers.layer4_transport.src_port} &rarr; {selectedPacket.osi_layers.layer4_transport.dst_port}</div>
                <div className="text-slate-500 font-mono text-[10px]">Flags: {selectedPacket.osi_layers.layer4_transport.flags} &bull; Seq: {selectedPacket.osi_layers.layer4_transport.sequence_num}</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-amber-700 font-semibold uppercase text-[10px] tracking-wider">Layer 7: Application Payload</div>
                <div className="text-slate-700 font-sans text-xs leading-relaxed">
                  {selectedPacket.osi_layers.layer7_application.payload_preview}
                </div>
              </div>
            </div>

            {/* Hex Dump View */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-500 font-medium">Wireshark Hex / ASCII Dump:</div>
              <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre leading-tight shadow-inner">
                {selectedPacket.osi_layers.layer7_application.hex_dump}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
