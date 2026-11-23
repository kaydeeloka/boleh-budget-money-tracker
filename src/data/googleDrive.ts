import { STORAGE_KEYS, storage } from './storage';

export const DRIVE_FILE_NAME = 'saku-data.json';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export type DriveSnapshot = Record<string, string>;

const SNAPSHOT_KEYS = Object.values(STORAGE_KEYS);

export async function readSnapshot(): Promise<DriveSnapshot> {
  const values = await Promise.all(SNAPSHOT_KEYS.map(key => storage.get(key)));
  return Object.fromEntries(SNAPSHOT_KEYS.map((key, index) => [key, values[index] ?? '']));
}

export async function writeSnapshot(snapshot: DriveSnapshot) {
  await Promise.all(Object.entries(snapshot).map(([key, value]) => storage.set(key, value)));
}

async function driveRequest(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Google Drive request failed (${response.status})`);
  return response;
}

async function findBackup(token: string): Promise<{ id: string } | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const response = await driveRequest(token, `${DRIVE_API}/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime)`);
  const data = await response.json() as { files?: { id: string }[] };
  return data.files?.[0] ?? null;
}

export async function uploadSnapshot(token: string) {
  const snapshot = await readSnapshot();
  const existing = await findBackup(token);
  const body = JSON.stringify(snapshot);

  if (existing) {
    await driveRequest(token, `${DRIVE_UPLOAD_API}/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return;
  }

  const boundary = `saku-${Date.now()}`;
  const metadata = JSON.stringify({ name: DRIVE_FILE_NAME, mimeType: 'application/json' });
  const multipart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    body,
    `--${boundary}--`,
  ].join('\r\n');
  await driveRequest(token, `${DRIVE_UPLOAD_API}/files?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
}

export async function downloadSnapshot(token: string): Promise<DriveSnapshot | null> {
  const existing = await findBackup(token);
  if (!existing) return null;
  const response = await driveRequest(token, `${DRIVE_API}/files/${existing.id}?alt=media`);
  const snapshot = await response.json() as unknown;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('The Google Drive backup has an invalid format');
  }
  return snapshot as DriveSnapshot;
}

