const API_BASE = 'http://127.0.0.1:8000/api/v1';

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
