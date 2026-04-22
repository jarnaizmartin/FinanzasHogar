// ============================================================
// SISTEMA DE LICENCIAS — Finance Hub Beta
// ============================================================

const LICENSE_KEY = 'fh_license_state';
const ADMIN_PASSWORD = '$FinanzasHogar291118'; // Cámbialo por uno tuyo
const LICENSE_PREFIX = 'FH';
const TRIAL_DAYS_DEFAULT = 15;                 // 👈 Días de trial (inicial y de gracia)
const LICENSE_DURATION_MONTHS = 6;             // 👈 Duración de la licencia activada

// ── Tipos ────────────────────────────────────────────────────

export type LicenseMode = 
  | 'trial'        // Trial inicial (nunca ha tenido licencia)
  | 'activated'    // Licencia activa (6 meses)
  | 'grace_trial'  // Trial de gracia (licencia caducada)
  | 'expired';     // Expirado (solo lectura)

export interface LicenseState {
  mode: LicenseMode;
  trialStartDate: number;
  trialDays: number;
  licenseCode: string | null;
  activatedAt: number | null;
  activatedExpiryDate: number | null;   // Fecha caducidad licencia (6 meses)
  graceTrialStartDate: number | null;   // Inicio del trial de gracia
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

// ── Calcular días restantes (trial inicial o de gracia) ──────

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

// ── Calcular días restantes de licencia activada ─────────────

export function getLicenseDaysRemaining(state: LicenseState): number {
  if (state.mode !== 'activated' || !state.activatedExpiryDate) return 0;
  const remaining = state.activatedExpiryDate - Date.now();
  return Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)));
}

// ── Comprobar y actualizar caducidades ───────────────────────

export function checkAndUpdateExpiry(state: LicenseState): LicenseState {

  // 1. Trial inicial caducado → Expirado (nunca tuvo licencia)
  if (state.mode === 'trial') {
    const remaining = getTrialDaysRemaining(state);
    if (remaining === 0) {
      const updated: LicenseState = { ...state, mode: 'expired' };
      saveLicense(updated);
      return updated;
    }
  }

  // 2. Licencia activada caducada → Trial de gracia
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

  // 3. Trial de gracia caducado → Expirado (solo lectura)
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

// ── Generar hash simple para validación offline ──────────────

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── Calcular fecha de caducidad (6 meses desde hoy) ─────────

function calculateExpiryDate(): number {
  const date = new Date();
  date.setMonth(date.getMonth() + LICENSE_DURATION_MONTHS);
  return date.getTime();
}

// ── Generar código de licencia (solo Admin) ──────────────────

export async function generateLicenseCode(
  deviceId: string,
  expiryDate: number
): Promise<string> {
  const raw = `${LICENSE_PREFIX}-${deviceId}-${expiryDate}-${ADMIN_PASSWORD}`;
  const hash = await generateHash(raw);
  const parts = [
    LICENSE_PREFIX,
    hash.substring(0, 4),
    hash.substring(4, 8),
    hash.substring(8, 12),
  ];
  return parts.join('-');
}

// ── Validar código de licencia ───────────────────────────────

export async function validateAndActivate(
  code: string,
  state: LicenseState,
  expiryDate: number
): Promise<{ success: boolean; message: string; newState?: LicenseState }> {
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
    newState 
  };
}

// ── Verificar clave de administrador ────────────────────────

export function checkAdminPassword(input: string): boolean {
  return input === ADMIN_PASSWORD;
}

// ── Helper: obtener fecha de caducidad para el admin panel ───

export function getNewExpiryDate(): number {
  return calculateExpiryDate();
}

// ── Helper: formatear fecha legible ─────────────────────────

export function formatExpiryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
