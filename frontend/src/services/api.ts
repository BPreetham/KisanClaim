import { Claim, NotificationItem, StatsKPI, UserSession } from '../types';

const API_BASE = '/api';

export async function loginFarmer(mobile: string, otp: string = '1234', name?: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/farmer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp, name })
  });
  if (!res.ok) throw new Error('Farmer login failed');
  return res.json();
}

export async function registerFarmer(data: {
  name: string;
  mobile: string;
  state?: string;
  district?: string;
  village?: string;
}): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/farmer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Farmer registration failed');
  return res.json();
}

export async function loginInsurance(companyId: string, accessCode: string = 'claims2026'): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/insurance/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id: companyId, access_code: accessCode })
  });
  if (!res.ok) throw new Error('Insurance login failed');
  return res.json();
}

export async function fetchStats(): Promise<StatsKPI> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchClaims(params?: {
  status?: string;
  crop?: string;
  disaster?: string;
  search?: string;
}): Promise<Claim[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.crop && params.crop !== 'all') query.set('crop', params.crop);
  if (params?.disaster && params.disaster !== 'all') query.set('disaster', params.disaster);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/claims?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export async function fetchClaimById(id: string): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims/${id}`);
  if (!res.ok) throw new Error('Failed to fetch claim');
  return res.json();
}

export async function createClaim(payload: any): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create claim');
  return res.json();
}

export async function submitReviewAction(
  claimId: string,
  payload: {
    action: string;
    reviewer_id?: string;
    reviewer_name?: string;
    comments?: string;
    approved_amount?: number;
    rejection_reason?: string;
    requested_evidence?: string;
  }
): Promise<{ success: boolean; claim: Claim; notification: NotificationItem }> {
  const res = await fetch(`${API_BASE}/claims/${claimId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

export async function askCopilot(
  claimId: string,
  question: string
): Promise<{ answer: string; grounded_facts: string[]; suggested_questions: string[] }> {
  const res = await fetch(`${API_BASE}/claims/${claimId}/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim_id: claimId, question })
  });
  if (!res.ok) throw new Error('Copilot inquiry failed');
  return res.json();
}

export async function reRunAIAgents(claimId: string): Promise<{ success: boolean; ai_agents: any[] }> {
  const res = await fetch(`${API_BASE}/claims/${claimId}/run-agents`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to re-run AI agents');
  return res.json();
}

export async function fetchNotifications(farmerId = 'all'): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications?farmer_id=${farmerId}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function fetchNDVIGrid(disasterType = 'Flood'): Promise<{
  size: number;
  pre_disaster_grid: number[][];
  post_disaster_grid: number[][];
  diff_grid: number[][];
}> {
  const res = await fetch(`${API_BASE}/geospatial/ndvi-grid?disaster_type=${disasterType}`);
  if (!res.ok) throw new Error('Failed to fetch NDVI matrix');
  return res.json();
}

export function subscribeToNotifications(onMessage: (data: any) => void): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
  let ws: WebSocket | null = null;
  let interval: any = null;

  try {
    ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };
    ws.onerror = (err) => {
      console.warn('WebSocket connection error, fallback active', err);
    };

    // Heartbeat ping
    interval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping');
      }
    }, 15000);
  } catch (e) {
    console.warn('WebSocket init failed', e);
  }

  return () => {
    if (interval) clearInterval(interval);
    if (ws) ws.close();
  };
}
