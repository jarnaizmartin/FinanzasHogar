// src/securityUtils.ts

export const TOTP_GRACE_DEFAULT_MS = 30 * 60 * 1000;

export const TOTP_GRACE_OPTIONS = [
  { label: 'Pedir siempre el código', value: 0 },
  { label: '5 minutos', value: 5 * 60 * 1000 },
  { label: '30 minutos', value: 30 * 60 * 1000 },
  { label: '1 hora', value: 60 * 60 * 1000 },
  { label: '4 horas', value: 4 * 60 * 60 * 1000 },
  { label: 'No volver a pedir', value: 99 * 24 * 60 * 60 * 1000 },
];

export const INACTIVITY_DEFAULT_MS = 15 * 60 * 1000;

export const INACTIVITY_OPTIONS = [
  { label: '5 minutos', value: 5 * 60 * 1000 },
  { label: '15 minutos', value: 15 * 60 * 1000 },
  { label: '30 minutos', value: 30 * 60 * 1000 },
  { label: '1 hora', value: 60 * 60 * 1000 },
  { label: 'Nunca', value: 0 },
];

export function saveTotpLastUnlock(): void {
  try {
    localStorage.setItem('fh_totp_last_unlock', String(Date.now()));
  } catch {}
}

export function loadTotpLastUnlock(): number {
  try {
    return parseInt(localStorage.getItem('fh_totp_last_unlock') ?? '0', 10);
  } catch {
    return 0;
  }
}

export function isWithinTotpGrace(graceMs: number): boolean {
  if (graceMs === 0) return false;
  const lastUnlock = loadTotpLastUnlock();
  if (!lastUnlock) return false;
  return Date.now() - lastUnlock < graceMs;
}
