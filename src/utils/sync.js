import { buildBackupPayload } from './backup';
import { getStorage, setStorage } from './storage';

export const SYNC_SETTINGS_KEY = 'accounting_sync_settings';
export const DEFAULT_SYNC_ENDPOINT = 'https://accounting-sync-worker.lyijian86.workers.dev';

export const DEFAULT_SYNC_SETTINGS = {
  syncEnabled: false,
  syncEndpoint: DEFAULT_SYNC_ENDPOINT,
  syncPassword: '',
  lastSyncAt: '',
  lastKnownRevision: '',
};

function normalizeEndpoint(endpoint) {
  return (endpoint || '').trim().replace(/\/+$/, '');
}

function buildHeaders(password) {
  return {
    'Content-Type': 'application/json',
    'X-Sync-Password': password,
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : '同步请求失败。';
    const error = new Error(message);
    error.code = data?.code || 'SYNC_ERROR';
    error.details = data;
    throw error;
  }
  return data;
}

export function getSyncSettings() {
  const stored = getStorage(SYNC_SETTINGS_KEY, DEFAULT_SYNC_SETTINGS);
  return {
    ...DEFAULT_SYNC_SETTINGS,
    ...(stored && typeof stored === 'object' ? stored : {}),
  };
}

export function saveSyncSettings(settings) {
  const next = {
    ...DEFAULT_SYNC_SETTINGS,
    ...settings,
    syncEndpoint: normalizeEndpoint(settings.syncEndpoint) || DEFAULT_SYNC_ENDPOINT,
  };
  setStorage(SYNC_SETTINGS_KEY, next);
  return next;
}

export async function fetchSyncStatus({ endpoint, password }) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/sync/status`, {
    method: 'GET',
    headers: buildHeaders(password),
  });
  return parseResponse(response);
}

export async function pushSyncSnapshot({ endpoint, password, payload, baseRevision, force = false }) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/sync/push`, {
    method: 'POST',
    headers: buildHeaders(password),
    body: JSON.stringify({
      payload,
      baseRevision,
      force,
    }),
  });
  return parseResponse(response);
}

export async function pullSyncSnapshot({ endpoint, password }) {
  const response = await fetch(`${normalizeEndpoint(endpoint)}/api/sync/pull`, {
    method: 'GET',
    headers: buildHeaders(password),
  });
  return parseResponse(response);
}

export function buildSyncPayload(snapshot) {
  return buildBackupPayload(snapshot);
}
