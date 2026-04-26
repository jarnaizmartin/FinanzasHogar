// ============================================================
// SISTEMA DE LICENCIAS — Finance Hub Beta
// ============================================================

const LICENSE_KEY = 'fh_license_state';
const ADMIN_PASSWORD = '$FinanzasHogar291118';
const LICENSE_PREFIX = 'FH';
const TRIAL_DAYS_DEFAULT = 15;
const LICENSE_DURATION_MONTHS = 6;

// ── Tipos ────────────────────────────────────────────────────

export type LicenseMode =
  | 'trial'
  | 'activated'
  | 'grace_trial'
  | 'expired';

export interface LicenseState {
  mode: LicenseMode;
  trialStartDate: number;
  trialDays: number;
  licenseCode: string | null;
  activatedAt: number | null;
  activatedExpiryDate: number | null;
  graceTrialStartDate: number | null;
  deviceId: string;
}

// ── Identificador único del dispositivo ──────────────────────

function getDeviceId(): string {
  const stored = localStorage.getItem('fh_device_id');
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem('fh_device_id', newId);
  return newId;
}

// ── Inicializar estado ───────────────────────────────────────

export function initLicense(trialDays: number = TRIAL_DAYS_DEFAULT): LicenseState {
  const stored = localStorage.getItem(LICENSE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const state: LicenseState = {
    mode: 'trial',
    trialStartDate: Date.now(),
    trialDays,
    licenseCode: null,
    activatedAt: null,
    activatedExpiryDate: null,
    graceTrialStartDate: null,
    deviceId: getDeviceId(),
  };
  saveLicense(state);
  return state;
}

// ── Guardar estado ───────────────────────────────────────────

function saveLicense(state: LicenseState): void {
  localStorage.setItem(LICENSE_KEY, JSON.stringify(state));
}

// ── Calcular días restantes ──────────────────────────────────

export function getTrialDaysRemaining(state: LicenseState): number {
  if (state.mode === 'grace_trial' && state.graceTrialStartDate) {
    const elapsed = Date.now() - state.graceTrialStartDate;
    const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, state.trialDays - elapsedDays);
  }
  if (state.mode === 'trial') {
    const elapsed = Date.now() - state.trialStartDate;
    const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, state.trialDays - elapsedDays);
  }
  return 0;
}

export function getLicenseDaysRemaining(state: LicenseState): number {
  if (state.mode !== 'activated' || !state.activatedExpiryDate) return 0;
  const remaining = state.activatedExpiryDate - Date.now();
  return Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)));
}

// ── Comprobar y actualizar caducidades ───────────────────────

export function checkAndUpdateExpiry(state: LicenseState): LicenseState {
  if (state.mode === 'trial') {
    const remaining = getTrialDaysRemaining(state);
    if (remaining === 0) {
      const updated: LicenseState = { ...state, mode: 'expired' };
      saveLicense(updated);
      return updated;
    }
  }
  if (state.mode === 'activated' && state.activatedExpiryDate) {
    if (Date.now() > state.activatedExpiryDate) {
      const updated: LicenseState = {
        ...state,
        mode: 'grace_trial',
        graceTrialStartDate: Date.now(),
      };
      saveLicense(updated);
      return updated;
    }
  }
  if (state.mode === 'grace_trial') {
    const remaining = getTrialDaysRemaining(state);
    if (remaining === 0) {
      const updated: LicenseState = { ...state, mode: 'expired' };
      saveLicense(updated);
      return updated;
    }
  }
  return state;
}

// ── Generar hash ─────────────────────────────────────────────

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── Codificar expiryDate en Base36 (6 caracteres) ────────────
// Convierte el timestamp a Base36 para incluirlo en el código

function encodeExpiry(expiryDate: number): string {
  // Reducimos precisión a minutos para acortar el string
  const minutes = Math.floor(expiryDate / 60000);
  return minutes.toString(36).toUpperCase().padStart(6, '0');
}

function decodeExpiry(encoded: string): number {
  const minutes = parseInt(encoded, 36);
  return minutes * 60000;
}

// ── Calcular fecha de caducidad ──────────────────────────────

function calculateExpiryDate(): number {
  const date = new Date();
  date.setMonth(date.getMonth() + LICENSE_DURATION_MONTHS);
  // Truncamos a minutos para que encodeExpiry/decodeExpiry sean exactos
  return Math.floor(date.getTime() / 60000) * 60000;
}

// ── Generar código de licencia ───────────────────────────────
// Formato: FH-XXXX-XXXX-EEEEEE
// XXXX-XXXX = 8 chars del hash (deviceId + expiryDate + password)
// EEEEEE    = expiryDate codificada en Base36

export async function generateLicenseCode(
  deviceId: string,
  expiryDate: number
): Promise<string> {
  const raw = `${LICENSE_PREFIX}-${deviceId}-${expiryDate}-${ADMIN_PASSWORD}`;
  const hash = await generateHash(raw);
  const encodedExpiry = encodeExpiry(expiryDate);
  const parts = [
    LICENSE_PREFIX,
    hash.substring(0, 4),
    hash.substring(4, 8),
    encodedExpiry,
  ];
  return parts.join('-');
}

// ── Validar y activar licencia ───────────────────────────────
// El expiryDate se extrae del propio código — no necesita localStorage

export async function validateAndActivate(
  code: string,
  state: LicenseState,
): Promise<{ success: boolean; message: string; newState?: LicenseState }> {
  const parts = code.trim().toUpperCase().split('-');

  // Formato esperado: FH-XXXX-XXXX-EEEEEE (4 partes)
  if (parts.length !== 4 || parts[0] !== LICENSE_PREFIX) {
    return { success: false, message: 'Formato de código incorrecto.' };
  }

  // Extraemos y decodificamos la fecha de caducidad del propio código
  const encodedExpiry = parts[3];
  const expiryDate = decodeExpiry(encodedExpiry);

  // Verificamos que la licencia no haya caducado
  if (Date.now() > expiryDate) {
    return { success: false, message: 'Este código de licencia ha caducado.' };
  }

  // Regeneramos el código esperado con el deviceId del usuario
  const expected = await generateLicenseCode(state.deviceId, expiryDate);

  if (code.trim().toUpperCase() !== expected) {
    return { success: false, message: 'Código de licencia no válido.' };
  }

  const newState: LicenseState = {
    ...state,
    mode: 'activated',
    licenseCode: code,
    activatedAt: Date.now(),
    activatedExpiryDate: expiryDate,
    graceTrialStartDate: null,
  };
  saveLicense(newState);
  return {
    success: true,
    message: '¡Licencia activada correctamente!',
    newState,
  };
}

// ── Verificar clave de administrador ─────────────────────────

export function checkAdminPassword(input: string): boolean {
  return input === ADMIN_PASSWORD;
}

// ── Helpers para el AdminPanel ────────────────────────────────

export function getNewExpiryDate(): number {
  return calculateExpiryDate();
}

export function formatExpiryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
