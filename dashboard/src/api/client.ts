// API client for the YourFin Rider backend.
// Base URL from VITE_API_URL (default http://localhost:4000/api).
// Attaches Authorization: Bearer <token> from the token store.
// Throws ApiError (carrying the server `error` message) on any non-2xx.

import { getToken } from '../auth/tokenStore';
import type {
  DateRange,
  FeedResponse,
  LeaderboardResponse,
  LoginResponse,
  MapResponse,
  MeResponse,
  Overview,
  TimeseriesResponse,
  User,
} from '../types';

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | undefined | null;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network / CORS / server-down errors never reach a Response.
    throw new ApiError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 0);
  }

  // Some endpoints may legitimately return empty bodies.
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!res.ok) {
    const errObj = data as { error?: string; details?: unknown } | undefined;
    const message = errObj?.error || `คำขอล้มเหลว (HTTP ${res.status})`;
    throw new ApiError(message, res.status, errObj?.details);
  }

  return data as T;
}

// Convert an optional range into query params.
function rangeParams(range?: DateRange): Record<string, QueryValue> | undefined {
  if (!range) return undefined;
  return { from: range.from, to: range.to };
}

// ---- Auth ----

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function getMe(): Promise<User> {
  const res = await request<MeResponse>('/auth/me');
  return res.user;
}

// ---- Dashboard ----

export function getOverview(range?: DateRange): Promise<Overview> {
  return request<Overview>('/dashboard/overview', { query: rangeParams(range) });
}

export function getLeaderboard(range?: DateRange): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>('/dashboard/leaderboard', {
    query: rangeParams(range),
  });
}

export function getTimeseries(range?: DateRange): Promise<TimeseriesResponse> {
  return request<TimeseriesResponse>('/dashboard/timeseries', {
    query: rangeParams(range),
  });
}

export function getMapPoints(range?: DateRange): Promise<MapResponse> {
  return request<MapResponse>('/dashboard/map', { query: rangeParams(range) });
}

export function getActivityFeed(
  limit = 50,
  range?: DateRange,
): Promise<FeedResponse> {
  return request<FeedResponse>('/dashboard/feed', {
    query: { limit, ...rangeParams(range) },
  });
}
