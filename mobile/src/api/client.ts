import { API_BASE_URL } from '../config';
import type {
  Activity,
  CheckInInput,
  LoginResponse,
  MyDayResponse,
  Store,
  UploadResponse,
  User,
  Wallet,
  Withdrawal,
  WithdrawalInput,
} from '../types';

/** Error thrown for non-2xx responses, carrying the server's `error` message. */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;

/** Set (or clear) the bearer token used for subsequent requests. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Pre-built body (e.g. FormData). When set, `body` is ignored. */
  rawBody?: BodyInit;
  /** Skip attaching the Authorization header (used for login). */
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, rawBody, skipAuth } = opts;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!skipAuth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload: BodyInit | undefined;
  if (rawBody !== undefined) {
    // multipart/form-data: let fetch set the Content-Type + boundary.
    payload = rawBody;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });
  } catch (e) {
    // Network / DNS / connection refused.
    const msg = e instanceof Error ? e.message : 'Network request failed';
    throw new ApiError(0, `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (${msg})`);
  }

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
    const errObj = (data ?? {}) as { error?: string; details?: unknown };
    const message = errObj.error ?? `เกิดข้อผิดพลาด (HTTP ${res.status})`;
    throw new ApiError(res.status, message, errObj.details);
  }

  return data as T;
}

// ---- Auth ----

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export async function getMe(): Promise<User> {
  const res = await request<{ user: User }>('/auth/me');
  return res.user;
}

// ---- Activities ----

export async function clockIn(lat: number, lng: number): Promise<Activity> {
  const res = await request<{ activity: Activity }>('/activities/clock-in', {
    method: 'POST',
    body: { lat, lng },
  });
  return res.activity;
}

export async function clockOut(lat: number, lng: number): Promise<Activity> {
  const res = await request<{ activity: Activity }>('/activities/clock-out', {
    method: 'POST',
    body: { lat, lng },
  });
  return res.activity;
}

export async function checkIn(input: CheckInInput): Promise<Activity> {
  const res = await request<{ activity: Activity }>('/activities/check-in', {
    method: 'POST',
    body: input,
  });
  return res.activity;
}

export function getMyDay(date?: string): Promise<MyDayResponse> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return request<MyDayResponse>(`/activities/me/day${qs}`);
}

// ---- Stores ----

export async function getStores(params?: {
  brand?: string;
  partnerStatus?: string;
  q?: string;
}): Promise<Store[]> {
  const search = new URLSearchParams();
  if (params?.brand) search.set('brand', params.brand);
  if (params?.partnerStatus) search.set('partnerStatus', params.partnerStatus);
  if (params?.q) search.set('q', params.q);
  const qs = search.toString();
  const res = await request<{ stores: Store[] }>(`/stores${qs ? `?${qs}` : ''}`);
  return res.stores;
}

// ---- Uploads ----

/**
 * Upload a store-front photo (multipart/form-data, field name `photo`).
 * `uri` is a local file URI from expo-image-picker.
 */
export async function uploadPhoto(
  uri: string,
  fileName?: string,
  mimeType?: string,
): Promise<UploadResponse> {
  const name = fileName ?? uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const type = mimeType ?? guessMimeType(name);

  const form = new FormData();
  // React Native FormData accepts this { uri, name, type } shape for file parts.
  form.append('photo', {
    uri,
    name,
    type,
  } as unknown as Blob);

  return request<UploadResponse>('/uploads', {
    method: 'POST',
    rawBody: form,
  });
}

// ---- Wallet & Withdrawals ----

/** Rider's wallet: balances, commission/bank settings and recent ledger entries. */
export function getWallet(): Promise<Wallet> {
  return request<Wallet>('/wallet');
}

/** Request a commission withdrawal. Throws ApiError(400) if amount > available. */
export async function requestWithdrawal(body: WithdrawalInput): Promise<Withdrawal> {
  const res = await request<{ withdrawal: Withdrawal }>('/wallet/withdrawals', {
    method: 'POST',
    body,
  });
  return res.withdrawal;
}

/** List my withdrawals, most recent first. */
export async function getMyWithdrawals(): Promise<Withdrawal[]> {
  const res = await request<{ withdrawals: Withdrawal[] }>('/wallet/withdrawals');
  return res.withdrawals;
}

function guessMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}
