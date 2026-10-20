const API_BASE = '/api/v1';

export interface AlertItem {
  alert_id: string;
  event_id: string;
  source_event_id?: string;
  rule_id: string;
  rule_name: string;
  severity: string;
  mitre_attack?: string;
  rationale: string;
  matched_conditions: any;
  status: string;
  analyst_notes?: string;
  created_at: string;
  hive: string;
  key_path: string;
  value_name?: string;
  value_type?: string;
  previous_data?: string;
  new_data?: string;
  operation: string;
  process_pid?: number;
  process_guid?: string;
  process_image_path?: string;
  process_command_line?: string;
  process_user?: string;
  parent_pid?: number;
  parent_image_path?: string;
  parent_command_line?: string;
  is_attributed: number;
  attribution_confidence?: 'CONFIRMED' | 'INFERRED' | 'UNATTRIBUTED';
  source: string;
}

export interface EventItem {
  event_id: string;
  source_event_id?: string;
  timestamp: string;
  source: string;
  hive: string;
  key_path: string;
  value_name?: string;
  value_type?: string;
  previous_data?: string;
  new_data?: string;
  operation: string;
  process_pid?: number;
  process_guid?: string;
  process_image_path?: string;
  process_command_line?: string;
  process_user?: string;
  parent_pid?: number;
  parent_image_path?: string;
  parent_command_line?: string;
  is_attributed: number;
  attribution_confidence?: 'CONFIRMED' | 'INFERRED' | 'UNATTRIBUTED';
  created_at: string;
}

export interface SystemStatus {
  status: string;
  service: string;
  version: string;
  cpu_percent: number;
  memory_rss_mb: number;
  db_path: string;
  threads_count: number;
  active_watchers?: number;
}

export interface RuleItem {
  rule_id: string;
  name: string;
  severity: string;
  mitre_attack?: string;
  description: string;
  rationale: string;
  conditions: any;
  suppression?: any;
}

export interface BaselineDiffResponse {
  snapshot_id: string;
  added: Array<{
    status: string;
    hive: string;
    key_path: string;
    value_name: string;
    baseline_data: string | null;
    current_data: string | null;
  }>;
  modified: Array<{
    status: string;
    hive: string;
    key_path: string;
    value_name: string;
    baseline_data: string | null;
    current_data: string | null;
  }>;
  deleted: Array<{
    status: string;
    hive: string;
    key_path: string;
    value_name: string;
    baseline_data: string | null;
    current_data: string | null;
  }>;
  summary: {
    added_count: number;
    modified_count: number;
    deleted_count: number;
  };
}

export async function fetchAlerts(params: {
  page?: number;
  limit?: number;
  severity?: string;
  status?: string;
  search?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.severity) query.set('severity', params.severity);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  return res.json();
}

export async function fetchAlertDetail(alertId: string): Promise<AlertItem> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`);
  if (!res.ok) throw new Error(`Failed to fetch alert: ${res.statusText}`);
  return res.json();
}

export async function updateAlertStatus(alertId: string, status: string, analystNotes?: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, analyst_notes: analystNotes })
  });
  if (!res.ok) throw new Error(`Failed to update alert: ${res.statusText}`);
  return res.json();
}

export async function fetchEvents(params: {
  limit?: number;
  offset?: number;
  key_path?: string;
  operation?: string;
  source?: string;
  search?: string;
} = {}): Promise<{ items: EventItem[]; total: number; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.key_path) query.set('key_path', params.key_path);
  if (params.operation) query.set('operation', params.operation);
  if (params.source) query.set('source', params.source);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/events?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
  return res.json();
}

export async function fetchRules() {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error(`Failed to fetch rules: ${res.statusText}`);
  return res.json();
}

export async function reloadRules() {
  const res = await fetch(`${API_BASE}/rules/reload`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reload rules: ${res.statusText}`);
  return res.json();
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error(`Failed to fetch system status: ${res.statusText}`);
  return res.json();
}

export async function takeBaselineSnapshot(label: string = 'Manual Snapshot') {
  const res = await fetch(`${API_BASE}/baseline/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  });
  if (!res.ok) throw new Error(`Failed to take snapshot: ${res.statusText}`);
  return res.json();
}

export async function fetchBaselineDiff(snapshotId?: string): Promise<BaselineDiffResponse> {
  const query = snapshotId ? `?snapshot_id=${snapshotId}` : '';
  const res = await fetch(`${API_BASE}/baseline/diff${query}`);
  if (!res.ok) throw new Error(`Failed to fetch baseline diff: ${res.statusText}`);
  return res.json();
}

export async function triggerSimulation(testVector: string = 'RUN_KEY_TEMP') {
  const res = await fetch(`${API_BASE}/test/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_vector: testVector, auto_cleanup: true })
  });
  if (!res.ok) throw new Error(`Failed to run simulation: ${res.statusText}`);
  return res.json();
}

// ------------------- Security Suite & Network Packet Interfaces -------------------

export interface OsiLayers {
  layer2_datalink: {
    src_mac: string;
    dst_mac: string;
    ethertype: string;
  };
  layer3_network: {
    src_ip: string;
    dst_ip: string;
    ttl: number;
    protocol: string;
  };
  layer4_transport: {
    src_port: number;
    dst_port: number;
    flags: string;
    sequence_num: number;
    window_size: number;
  };
  layer7_application: {
    protocol: string;
    payload_length_bytes: number;
    payload_preview: string;
    hex_dump: string;
  };
}

export interface PacketItem {
  packet_id: string;
  timestamp: string;
  from_node: string;
  to_node: string;
  src_name: string;
  dst_name: string;
  osi_layers: OsiLayers;
  security: {
    threat_level: 'BENIGN' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
    mitre_technique: string;
    threat_description: string;
    dpi_inspected: boolean;
  };
}

export interface CiaBlock {
  index: number;
  timestamp: string;
  actor: string;
  action: string;
  data: any;
  prev_hash: string;
  block_hash: string;
}

export interface SecurityOverview {
  overall_status: 'SECURE' | 'THREAT_DETECTED';
  anti_phishing: {
    credential_providers_count: number;
    browser_extensions_count: number;
    credential_hooks: Array<{
      hive: string;
      key_path: string;
      threat_type: string;
      severity: string;
      description: string;
    }>;
    extension_hooks: Array<any>;
    status: string;
    active_protection: {
      anti_punycode_filter: boolean;
      lsa_protection_mode: string;
      credential_guard: string;
    };
  };
  cia_integrity: {
    verified: boolean;
    total_blocks: number;
    status: string;
    breached_index?: number;
    reason?: string;
  };
  ransomware_guard: {
    guard_status: string;
    canary_intact: boolean;
    canary_key: string;
    recent_burst_rate_sec: number;
    threshold_limit: number;
    containment_active: boolean;
    heuristic_engine: string;
  };
  telemetry: {
    total_ledger_blocks: number;
    packets_inspected_today: number;
  };
}

export async function fetchSecurityOverview(): Promise<SecurityOverview> {
  const res = await fetch(`${API_BASE}/security/status`);
  if (!res.ok) throw new Error(`Failed to fetch security overview: ${res.statusText}`);
  return res.json();
}

export async function checkPhishingUrl(url: string) {
  const res = await fetch(`${API_BASE}/security/anti-phishing/check-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) throw new Error(`Failed to check URL: ${res.statusText}`);
  return res.json();
}

export async function fetchCiaLedger(): Promise<{ blocks: CiaBlock[]; verification: any }> {
  const res = await fetch(`${API_BASE}/security/integrity-ledger`);
  if (!res.ok) throw new Error(`Failed to fetch CIA ledger: ${res.statusText}`);
  return res.json();
}

export async function appendCiaBlock(actor: string = 'SecurityAdmin', action: string = 'ConfigSeal') {
  const res = await fetch(`${API_BASE}/security/integrity-block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, action, data: { sealed_at: new Date().toISOString() } })
  });
  if (!res.ok) throw new Error(`Failed to seal CIA block: ${res.statusText}`);
  return res.json();
}

export async function simulateCiaTamper(blockIndex: number = 1) {
  const res = await fetch(`${API_BASE}/security/integrity-tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block_index: blockIndex })
  });
  if (!res.ok) throw new Error(`Failed to simulate CIA tamper: ${res.statusText}`);
  return res.json();
}

export async function simulateRansomwareBurst() {
  const res = await fetch(`${API_BASE}/security/ransomware/simulate-burst`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to simulate ransomware burst: ${res.statusText}`);
  return res.json();
}

export async function tripRansomwareCanary() {
  const res = await fetch(`${API_BASE}/security/ransomware/trip-canary`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trip ransomware canary: ${res.statusText}`);
  return res.json();
}

export async function resetRansomwareGuard() {
  const res = await fetch(`${API_BASE}/security/ransomware/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reset ransomware guard: ${res.statusText}`);
  return res.json();
}

export async function fetchPacketStream(count: number = 8): Promise<{ packets: PacketItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/security/packets/stream?count=${count}`);
  if (!res.ok) throw new Error(`Failed to fetch packet stream: ${res.statusText}`);
  return res.json();
}

export async function simulateAttackScenario(attackType: string): Promise<{ attack_type: string; packets_generated: number; packets: PacketItem[] }> {
  const res = await fetch(`${API_BASE}/security/packets/simulate-attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attack_type: attackType })
  });
  if (!res.ok) throw new Error(`Failed to simulate attack scenario: ${res.statusText}`);
  return res.json();
}

