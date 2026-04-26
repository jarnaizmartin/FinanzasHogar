import {
  useState,
  useMemo,
  useEffect,
  useContext,
  createContext,
  useCallback,
  useRef,
} from 'react';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import {
  LayoutDashboard,
  Wallet,
  Tag,
  TrendingUp,
  CalendarRange,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  Moon,
  Sun,
  ArrowUp,
  ArrowDown,
  Shield,
  Filter,
  Receipt,
  BarChart2,
  LineChart as LineChartIcon,
  Target,
  FileText,
  ArrowLeftRight,
  Archive,
  HelpCircle,
} from 'lucide-react';

import { AdminPanel } from './AdminPanel';
import { WelcomeTour } from './WelcomeTour';
import { HelpCenter } from './HelpCenter';
import { TrialBanner } from './LicenseScreens';
import { useLicense } from './LicenseContext';
import { ExpiredScreen, ActivationModal } from './LicenseScreens';

// ─── Credenciales EmailJS ─────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = 'service_2n3xw16';
const EMAILJS_TEMPLATE_ID = 'template_85h265d';
const EMAILJS_PUBLIC_KEY = 'ibuKBzaykTwjkn95o';

// ─── Constantes de seguridad ──────────────────────────────────────────────────
const SECURITY_STORAGE_KEY = 'fh_security';
const LOCK_STATE_KEY = 'fh_lock_state';
const TOTP_LAST_UNLOCK_KEY = 'fh_totp_last_unlock';
const INACTIVITY_DEFAULT_MS = 15 * 60 * 1000;

// Opciones de período de gracia para TOTP
const TOTP_GRACE_OPTIONS = [
  { label: 'Pedir siempre el código', value: 0 },
  { label: '5 minutos', value: 5 * 60 * 1000 },
  { label: '30 minutos', value: 30 * 60 * 1000 },
  { label: '1 hora', value: 60 * 60 * 1000 },
  { label: '4 horas', value: 4 * 60 * 60 * 1000 },
  { label: 'No volver a pedir', value: 99 * 24 * 60 * 60 * 1000 },
];
const TOTP_GRACE_DEFAULT_MS = 30 * 60 * 1000; // 30 min por defecto

const INACTIVITY_OPTIONS = [
  { label: '5 minutos', value: 5 * 60 * 1000 },
  { label: '15 minutos', value: 15 * 60 * 1000 },
  { label: '30 minutos', value: 30 * 60 * 1000 },
  { label: '1 hora', value: 60 * 60 * 1000 },
  { label: 'Nunca', value: 0 },
];

const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_MAX_RESENDS = 3;

// ─── Tipos de seguridad ───────────────────────────────────────────────────────
type AuthMethod = 'password' | 'totp';

type SecurityState = {
  configured: boolean;
  authMethod: AuthMethod;
  passwordHash: string | null;
  passwordSalt: string | null;
  email: string | null;
  emailVerified: boolean;
  phraseHash: string | null;
  phraseSalt: string | null;
  recoveryFileHash: string | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  inactivityMs: number;
  totpGraceMs: number;
};

type LockState = {
  locked: boolean;
  lockedAt: number | null;
};

// ─── Wordlist para frase de 12 palabras ───────────────────────────────────────
const WORDLIST = [
  'ábaco',
  'abdomen',
  'abeja',
  'abierto',
  'abogado',
  'abono',
  'aborto',
  'abrazo',
  'abrir',
  'abuelo',
  'acabar',
  'academia',
  'acceso',
  'acción',
  'aceite',
  'acelga',
  'acento',
  'aceptar',
  'ácido',
  'aclarar',
  'acné',
  'acoger',
  'acoso',
  'activo',
  'acto',
  'actriz',
  'actuar',
  'acudir',
  'acuerdo',
  'acusar',
  'adicto',
  'admitir',
  'adoptar',
  'adorno',
  'adquirir',
  'adulto',
  'aéreo',
  'afectar',
  'afición',
  'agencia',
  'agitar',
  'agonía',
  'agosto',
  'agotar',
  'agregar',
  'agrio',
  'agua',
  'agudo',
  'águila',
  'aguja',
  'ahogo',
  'ahorro',
  'aire',
  'aísla',
  'ajedrez',
  'ajeno',
  'ajuste',
  'alacrán',
  'alambre',
  'alarma',
  'alba',
  'álbum',
  'alcalde',
  'aldea',
  'alerta',
  'aleta',
  'alfiler',
  'alga',
  'algodón',
  'alivio',
  'alma',
  'almeja',
  'almíbar',
  'altar',
  'alteza',
  'altivo',
  'alto',
  'altura',
  'alumno',
  'alzar',
  'amable',
  'amante',
  'amapola',
  'amargo',
  'ambos',
  'ámbito',
  'ameno',
  'amigo',
  'amistad',
  'amor',
  'amparo',
  'amplio',
  'ancho',
  'anciano',
  'ancla',
  'ángel',
  'ángulo',
  'anillo',
  'ánimo',
  'anís',
  'antena',
  'antiguo',
  'antojo',
  'anual',
  'anzuelo',
  'añadir',
  'apagar',
  'aparato',
  'apetito',
  'apio',
  'aplicar',
  'apodo',
  'aporte',
  'apoyar',
  'aprender',
  'aptitud',
  'árbol',
  'arbusto',
  'ardilla',
  'arduo',
  'área',
  'árido',
  'arma',
  'arpa',
  'arrozal',
  'arte',
  'artista',
  'asco',
  'asegurar',
  'aseo',
  'asesor',
  'asiento',
  'asilo',
  'asistir',
  'asno',
  'aspecto',
  'áspero',
  'astilla',
  'astro',
  'astuto',
  'asumir',
  'asunto',
  'atacar',
  'atento',
  'ateo',
  'ático',
  'atleta',
  'átomo',
  'atraer',
  'atroz',
  'atún',
  'audaz',
  'auge',
  'aula',
  'ausente',
  'autor',
  'avance',
  'avaro',
  'ave',
  'avellana',
  'avena',
  'avión',
  'aviso',
  'ayer',
  'ayuda',
  'azafrán',
  'azote',
  'azúcar',
  'azufre',
  'azul',
  'baba',
  'bagaje',
  'baile',
  'bajar',
  'balanza',
  'balcón',
  'balde',
  'bambú',
  'banco',
  'banda',
  'bañar',
  'barco',
  'barro',
  'báscula',
  'bastón',
  'batalla',
  'batería',
  'batir',
  'beber',
  'béisbol',
  'belleza',
  'besar',
  'bello',
  'biblioteca',
  'bien',
  'bígaro',
  'billar',
  'bisonte',
  'blasón',
  'blindar',
  'bloque',
  'bocina',
  'bola',
  'boleto',
  'bolsa',
  'bomba',
  'bondad',
  'bonito',
  'borrar',
  'bosque',
  'bote',
  'botín',
  'bóveda',
  'bravo',
  'brecha',
  'brillo',
  'brinco',
  'brisa',
  'broca',
  'broma',
  'bronce',
  'brújula',
  'brusco',
  'bruto',
  'bucle',
  'bueno',
  'buey',
  'búfalo',
  'búho',
  'bulto',
  'buque',
  'burro',
  'buscar',
  'butaca',
  'buzón',
  'caballo',
  'cabina',
  'cacao',
  'cadena',
  'caída',
  'caimán',
  'caja',
  'cajón',
  'cálculo',
  'caldo',
  'calidad',
  'calle',
  'calma',
  'calor',
  'calvo',
  'cama',
  'cambio',
  'camello',
  'camino',
  'campo',
  'cáncer',
  'candil',
  'caña',
  'cañón',
  'caoba',
  'caos',
  'capaz',
  'capitán',
  'capote',
  'captar',
  'capucha',
  'cara',
  'carbón',
  'cárcel',
  'cargar',
  'caries',
  'carne',
  'carpeta',
  'carro',
  'carta',
  'caspa',
  'caudal',
  'causar',
  'caverna',
  'cazar',
  'cebra',
  'ceder',
  'cedro',
  'celda',
  'célebre',
  'celoso',
  'célula',
  'cenar',
  'cenicero',
  'centro',
  'cerca',
  'cerdo',
  'cerebro',
  'certeza',
  'césped',
  'cetro',
  'ciclo',
  'ciego',
  'cierto',
  'cifra',
  'cigarro',
  'cima',
  'cinco',
  'cine',
  'cinta',
  'ciprés',
  'circo',
  'ciruela',
  'cisne',
  'ciudad',
  'claro',
  'clavo',
  'cliente',
  'clima',
  'clínica',
  'cobre',
  'cocer',
  'código',
  'codo',
  'cofre',
  'coger',
  'cohete',
  'cojín',
  'colegio',
  'colgar',
  'colina',
  'collar',
  'colmo',
  'columna',
  'combate',
  'comer',
  'cómodo',
  'compra',
  'conde',
  'conejo',
  'conga',
  'conocer',
  'consejo',
  'contar',
  'copa',
  'copia',
  'corazón',
  'corbata',
  'corcho',
  'cordón',
  'corona',
  'correr',
  'corteza',
  'cosmos',
  'costa',
  'precio',
  'crear',
  'crecer',
  'creído',
  'crimen',
  'cripta',
  'crisis',
  'cristal',
  'criterio',
  'cromo',
  'crónica',
  'cruce',
  'cuadro',
  'cuarto',
  'cuatro',
  'cubeta',
  'cubierta',
  'cúbico',
  'cúpula',
  'cuerdo',
  'cuerpo',
  'cuidar',
  'culpa',
  'culto',
  'cumbre',
  'cúpula',
];

// ─── Helpers de cifrado ───────────────────────────────────────────────────────
// Usamos la librería crypto-js para todo el cifrado/descifrado.
// No necesitamos conocer los detalles internos — solo usamos las funciones.

import CryptoJS from 'crypto-js';

// Genera una sal aleatoria (cadena hexadecimal de 32 caracteres)
function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// Convierte una contraseña + sal en un hash seguro (PBKDF2)
// PBKDF2 = Password-Based Key Derivation Function 2
// Hace el hash muy lento a propósito para dificultar ataques de fuerza bruta
function hashPassword(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
}

// Comprueba si una contraseña coincide con un hash guardado
function verifyPassword(password: string, hash: string, salt: string): boolean {
  return hashPassword(password, salt) === hash;
}

// ─── Helpers de frase de 12 palabras ─────────────────────────────────────────

// Genera una frase aleatoria de 12 palabras del wordlist
function generateRecoveryPhrase(): string {
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((n) => WORDLIST[n % WORDLIST.length])
    .join(' ');
}

// Normaliza la frase antes de guardarla o verificarla
// (elimina espacios extra, convierte a minúsculas)
function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Guarda el hash de la frase (nunca guardamos la frase en texto plano)
function hashPhrase(phrase: string, salt: string): string {
  return hashPassword(normalizePhrase(phrase), salt);
}

// ─── Verificación TOTP manual (Web Crypto API) ────────────────────────────────
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0,
    value = 0,
    index = 0;
  const output = new Uint8Array(Math.floor((clean.length * 5) / 8));
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, counterBytes);
  const arr = new Uint8Array(sig);
  const offset = arr[19] & 0x0f;
  const code =
    (((arr[offset] & 0x7f) << 24) |
      ((arr[offset + 1] & 0xff) << 16) |
      ((arr[offset + 2] & 0xff) << 8) |
      (arr[offset + 3] & 0xff)) %
    1000000;
  return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const secretBytes = base32ToBytes(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    const expected = await hotp(secretBytes, counter + delta);
    if (expected === token.trim()) return true;
  }
  return false;
}

// Comprueba si la frase introducida coincide con la guardada
function verifyPhrase(phrase: string, hash: string, salt: string): boolean {
  return hashPhrase(normalizePhrase(phrase), salt) === hash;
}

// ─── Helpers de email ─────────────────────────────────────────────────────────

// Genera un código numérico de 6 dígitos
function generateEmailCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Estado temporal del código de email (no se persiste en localStorage)
// Lo guardamos en memoria durante la sesión
let emailCodeSession: {
  code: string;
  expiresAt: number;
  email: string;
  resends: number;
} | null = null;

// Envía el código por email usando EmailJS
async function sendEmailCode(
  toEmail: string
): Promise<{ ok: boolean; error?: string }> {
  // Comprobamos límite de reenvíos
  if (
    emailCodeSession &&
    emailCodeSession.email === toEmail &&
    emailCodeSession.resends >= EMAIL_MAX_RESENDS
  ) {
    return { ok: false, error: 'Has alcanzado el límite de reenvíos.' };
  }

  const code = generateEmailCode();
  emailCodeSession = {
    code,
    expiresAt: Date.now() + EMAIL_CODE_TTL_MS,
    email: toEmail,
    resends:
      (emailCodeSession?.email === toEmail ? emailCodeSession.resends : 0) + 1,
  };

  try {
    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { to_email: toEmail, code },
      EMAILJS_PUBLIC_KEY
    );
    return { ok: true };
  } catch (err) {
    console.error('[EmailJS]', err);
    return {
      ok: false,
      error: 'No se pudo enviar el email. Inténtalo de nuevo.',
    };
  }
}

// Verifica el código introducido por el usuario
function verifyEmailCode(inputCode: string): { ok: boolean; error?: string } {
  if (!emailCodeSession) {
    return { ok: false, error: 'No hay ningún código activo.' };
  }
  if (Date.now() > emailCodeSession.expiresAt) {
    emailCodeSession = null;
    return { ok: false, error: 'El código ha caducado. Solicita uno nuevo.' };
  }
  if (inputCode.trim() !== emailCodeSession.code) {
    return { ok: false, error: 'Código incorrecto. Inténtalo de nuevo.' };
  }
  emailCodeSession = null;
  return { ok: true };
}

// ─── SecurityContext ──────────────────────────────────────────────────────────

const DEFAULT_SECURITY_STATE: SecurityState = {
  configured: false,
  authMethod: 'password',
  passwordHash: null,
  passwordSalt: null,
  email: null,
  emailVerified: false,
  phraseHash: null,
  phraseSalt: null,
  recoveryFileHash: null,
  totpSecret: null,
  totpEnabled: false,
  inactivityMs: INACTIVITY_DEFAULT_MS,
  totpGraceMs: TOTP_GRACE_DEFAULT_MS,
};

// Carga la configuración de seguridad desde localStorage
function loadSecurityState(): SecurityState {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) return DEFAULT_SECURITY_STATE;
    return { ...DEFAULT_SECURITY_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SECURITY_STATE;
  }
}

// Guarda la configuración de seguridad en localStorage
function saveSecurityState(state: SecurityState): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn(
      '[Security] No se pudo guardar la configuración de seguridad.'
    );
  }
}

// Guarda el momento del último desbloqueo TOTP exitoso
function saveTotpLastUnlock(): void {
  try {
    localStorage.setItem(TOTP_LAST_UNLOCK_KEY, String(Date.now()));
  } catch {}
}

// Lee el timestamp del último desbloqueo TOTP
function loadTotpLastUnlock(): number {
  try {
    return parseInt(localStorage.getItem(TOTP_LAST_UNLOCK_KEY) ?? '0', 10);
  } catch {
    return 0;
  }
}

// ¿Está dentro del período de gracia?
function isWithinTotpGrace(graceMs: number): boolean {
  if (graceMs === 0) return false; // "Siempre pedir"
  const lastUnlock = loadTotpLastUnlock();
  if (!lastUnlock) return false;
  return Date.now() - lastUnlock < graceMs;
}

// Guarda el estado de bloqueo en localStorage
function saveLockState(state: LockState): void {
  try {
    localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(state));
  } catch {
    console.warn('[Security] No se pudo guardar el estado de bloqueo.');
  }
}

type SecurityContextType = {
  // Estado
  security: SecurityState;
  isLocked: boolean;
  isConfigured: boolean;

  // Configuración inicial
  setupSecurity: (params: {
    authMethod: AuthMethod;
    password?: string;
    totpSecret?: string;
    totpGraceMs?: number;
    phrase: string;
    email?: string;
  }) => void;

  // Autenticación
  unlock: (input: string) => boolean;
  lock: () => void;

  // Email
  sendCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (code: string) => { ok: boolean; error?: string };

  // Recuperación
  recoverWithPhrase: (phrase: string, newPassword: string) => boolean;
  validateRecoveryFile: (
    fileContent: string
  ) => { ok: boolean; error?: string };
  recoverWithFile: (fileContent: string, newPassword: string) => boolean;

  // Ajustes
  updateInactivity: (ms: number) => void;
  updateTotpGrace: (ms: number) => void;
  updateEmail: (email: string) => void;
  clearSecurity: () => void;

  // Fichero de recuperación
  generateRecoveryFile: (password: string) => string;
};

const SecurityContext = createContext<SecurityContextType | null>(null);

function useSecurityContext(): SecurityContextType {
  const ctx = useContext(SecurityContext);
  if (!ctx)
    throw new Error(
      'useSecurityContext debe usarse dentro de <SecurityProvider>'
    );
  return ctx;
}

function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [security, setSecurity] = useState<SecurityState>(() =>
    loadSecurityState()
  );
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = loadSecurityState();
    if (!s.configured) return false;

    // TOTP: si estamos dentro del período de gracia, no bloqueamos al arrancar
    if (
      s.authMethod === 'totp' &&
      isWithinTotpGrace(s.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS)
    ) {
      return false;
    }

    return true;
  });

  // Persiste cada vez que cambia el estado de seguridad
  useEffect(() => {
    saveSecurityState(security);
  }, [security]);

  // ── Bloqueo por inactividad ────────────────────────────────────────────────
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (!security.configured || !security.inactivityMs) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsLocked(true);
      saveLockState({ locked: true, lockedAt: Date.now() });
    }, security.inactivityMs);
  }, [security.configured, security.inactivityMs]);

  // Escucha eventos de actividad del usuario
  useEffect(() => {
    if (!security.configured || isLocked) return;

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
    ];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer)
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [security.configured, isLocked, resetInactivityTimer]);

  // ── Configuración inicial ──────────────────────────────────────────────────
  const setupSecurity = useCallback(
    ({
      authMethod,
      password,
      totpSecret,
      totpGraceMs,
      phrase,
      email,
      forcePhraseHash,
      forcePhraseSalt,
    }: {
      authMethod: AuthMethod;
      password?: string;
      totpSecret?: string;
      totpGraceMs?: number;
      phrase: string;
      email?: string;
      forcePhraseHash?: string;
      forcePhraseSalt?: string;
    }) => {
      const salt = generateSalt();
      const phraseSalt = forcePhraseSalt ?? generateSalt();

      const newState: SecurityState = {
        ...DEFAULT_SECURITY_STATE,
        configured: true,
        authMethod,
        phraseHash: forcePhraseHash ?? hashPhrase(phrase, phraseSalt),
        phraseSalt,
        email: email ?? null,
        emailVerified: false,
        inactivityMs: INACTIVITY_DEFAULT_MS,
      };

      if (authMethod === 'password' && password) {
        newState.passwordHash = hashPassword(password, salt);
        newState.passwordSalt = salt;
      }

      if (authMethod === 'totp' && totpSecret) {
        newState.totpSecret = totpSecret;
        newState.totpEnabled = true;
        newState.totpGraceMs = totpGraceMs ?? TOTP_GRACE_DEFAULT_MS;
      }

      setSecurity(newState);
      setIsLocked(false);
    },
    []
  );

  // ── Desbloqueo ────────────────────────────────────────────────────────────
  const unlock = useCallback(
    (input: string): boolean => {
      if (security.authMethod === 'password') {
        if (!security.passwordHash || !security.passwordSalt) return false;
        const ok = verifyPassword(
          input,
          security.passwordHash,
          security.passwordSalt
        );
        if (ok) {
          setIsLocked(false);
          saveLockState({ locked: false, lockedAt: null });
        }
        return ok;
      }

      if (security.authMethod === 'totp') {
        // El unlock TOTP se gestiona desde LockScreen de forma asíncrona
        setIsLocked(false);
        saveLockState({ locked: false, lockedAt: null });
        saveTotpLastUnlock();
        return true;
      }

      return false;
    },
    [security]
  );

  // ── Bloquear ──────────────────────────────────────────────────────────────
  const lock = useCallback(() => {
    setIsLocked(true);
    saveLockState({ locked: true, lockedAt: Date.now() });
  }, []);

  // ── Email ─────────────────────────────────────────────────────────────────
  const sendCode = useCallback(async (email: string) => {
    return await sendEmailCode(email);
  }, []);

  const verifyCode = useCallback((code: string) => {
    return verifyEmailCode(code);
  }, []);

  // ── Recuperación con frase ────────────────────────────────────────────────
  const recoverWithPhrase = useCallback(
    (phrase: string, newPassword: string): boolean => {
      if (!security.phraseHash || !security.phraseSalt) return false;
      const ok = verifyPhrase(phrase, security.phraseHash, security.phraseSalt);
      if (!ok) return false;

      const salt = generateSalt();
      setSecurity((prev) => ({
        ...prev,
        passwordHash: hashPassword(newPassword, salt),
        passwordSalt: salt,
        authMethod: 'password',
      }));
      setIsLocked(false);
      return true;
    },
    [security]
  );

  // ── Validación del fichero de recuperación ────────────────────────────────
  const validateRecoveryFile = useCallback(
    (fileContent: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(fileContent);

        if (parsed.type !== 'fh-recovery') {
          return {
            ok: false,
            error: 'El fichero no es un fichero de recuperación válido.',
          };
        }
        if (!parsed.phraseHash || !parsed.phraseSalt) {
          return {
            ok: false,
            error:
              'El fichero no contiene los datos necesarios para la recuperación.',
          };
        }
        if (
          parsed.phraseHash !== security.phraseHash ||
          parsed.phraseSalt !== security.phraseSalt
        ) {
          return {
            ok: false,
            error:
              'Este fichero no corresponde a la configuración de seguridad actual. Usa el fichero más reciente.',
          };
        }
        return { ok: true };
      } catch {
        return {
          ok: false,
          error:
            'No se pudo leer el fichero. Asegúrate de que es un .json válido.',
        };
      }
    },
    [security]
  );

  // ── Recuperación con fichero ──────────────────────────────────────────────
  const recoverWithFile = useCallback(
    (fileContent: string, newPassword: string): boolean => {
      try {
        const parsed = JSON.parse(fileContent);
        if (parsed.type !== 'fh-recovery') return false;

        if (!parsed.phraseHash || !parsed.phraseSalt) return false;
        if (parsed.phraseHash !== security.phraseHash) return false;
        if (parsed.phraseSalt !== security.phraseSalt) return false;

        const salt = generateSalt();
        setSecurity((prev) => ({
          ...prev,
          passwordHash: hashPassword(newPassword, salt),
          passwordSalt: salt,
          authMethod: 'password',
        }));
        setIsLocked(false);
        return true;
      } catch {
        return false;
      }
    },
    [security]
  );

  // ── Generar fichero de recuperación ──────────────────────────────────────
  const generateRecoveryFile = useCallback(
    (password: string): string => {
      const salt = generateSalt();
      const content = JSON.stringify({
        type: 'fh-recovery',
        version: '1.0',
        app: 'FinanzasHogar',
        createdAt: Date.now(),
        salt,
        phraseHash: security.phraseHash,
        phraseSalt: security.phraseSalt,
        authMethod: security.authMethod,
      });

      const fileHash = hashPassword(content, salt);
      setSecurity((prev) => ({ ...prev, recoveryFileHash: fileHash }));
      return content;
    },
    [security]
  );

  // ── Actualizar inactividad ────────────────────────────────────────────────
  const updateInactivity = useCallback((ms: number) => {
    setSecurity((prev) => ({ ...prev, inactivityMs: ms }));
  }, []);

  const updateTotpGrace = useCallback((ms: number) => {
    setSecurity((prev) => ({ ...prev, totpGraceMs: ms }));
  }, []);

  // ── Actualizar email ──────────────────────────────────────────────────────
  const updateEmail = useCallback((email: string) => {
    setSecurity((prev) => ({ ...prev, email, emailVerified: true }));
  }, []);

  // ── Limpiar seguridad (reset total) ──────────────────────────────────────
  const clearSecurity = useCallback(() => {
    localStorage.removeItem(SECURITY_STORAGE_KEY);
    localStorage.removeItem(LOCK_STATE_KEY);
    setSecurity(DEFAULT_SECURITY_STATE);
    setIsLocked(false);
  }, []);

  const value: SecurityContextType = {
    security,
    isLocked,
    isConfigured: security.configured,
    setupSecurity,
    unlock,
    lock,
    sendCode,
    verifyCode,
    recoverWithPhrase,
    validateRecoveryFile,
    recoverWithFile,
    generateRecoveryFile,
    updateInactivity,
    updateTotpGrace,
    updateEmail,
    clearSecurity,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

// ─── Constantes de divisas (ampliadas) ───────────────────────────────────────
const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'CAD', symbol: 'CA$', name: 'Dólar canadiense' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar australiano' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
  { code: 'SEK', symbol: 'kr', name: 'Corona sueca' },
  { code: 'NOK', symbol: 'kr', name: 'Corona noruega' },
  { code: 'DKK', symbol: 'kr', name: 'Corona danesa' },
  { code: 'PLN', symbol: 'zł', name: 'Esloti polaco' },
  { code: 'HUF', symbol: 'Ft', name: 'Forinto húngaro' },
  { code: 'CZK', symbol: 'Kč', name: 'Corona checa' },
  { code: 'RON', symbol: 'lei', name: 'Leu rumano' },
  { code: 'TRY', symbol: '₺', name: 'Lira turca' },
  { code: 'INR', symbol: '₹', name: 'Rupia india' },
  { code: 'KRW', symbol: '₩', name: 'Won surcoreano' },
  { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapur' },
  { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong' },
  { code: 'NZD', symbol: 'NZ$', name: 'Dólar neozelandés' },
  { code: 'ZAR', symbol: 'R', name: 'Rand sudafricano' },
  { code: 'AED', symbol: 'د.إ', name: 'Dírham de los EAU' },
];

// ─── Tipos TypeScript ─────────────────────────────────────────────────────────
type RatesStatus = 'fresh' | 'stale' | 'error' | 'loading';

type BackupEntry = {
  id: string;
  timestamp: number;
  label: string;
  accountsCount: number;
  categoriesCount: number;
  projectionsCount: number;
  realExpensesCount: number;
  goalsCount: number;
  data: {
    accounts: any[];
    categories: any[];
    projections: any[];
    realExpenses: any[];
    goals: any[];
    bankFormats: any[];
    categoryRules: any[];
    baseCurrency: string;
    displayCurrency: string;
    dark: boolean;
  };
};

type SavingsGoal = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetAmount: number;
  currency: string;
  deadline: string;
  mode: 'manual' | 'auto';
  // Modo manual
  currentAmount: number;
  // Modo automático
  categoryId: string;
  accountId: string;
  autoType: 'income' | 'expense';
  autoStartDate: string;
};

type AlertSeverity = 'critical' | 'warning' | 'positive';

type AlertType =
  | 'balance_critical'
  | 'balance_risk'
  | 'budget_exceeded'
  | 'goal_at_risk'
  | 'month_negative'
  | 'goal_overdue'
  | 'goal_completed';

type AppAlert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  actionTab?: string;
  data?: Record<string, any>;
  generatedAt: number;
};

type Projection = {
  id: string;
  name: string;
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringDay?: number;
  nextOverrideAmount?: number | null;
  lastApplied?: string;
  hasDuplicateWarning?: boolean;
  duplicateWarningMonth?: string;
};

type RealExpense = {
  id: string;
  entryDate: string; // Fecha de apunte
  valueDate: string; // Fecha de valor
  description: string; // Descripción
  categoryId: string; // Vinculada a categorías existentes
  amount: number; // Importe
  currency: string; // Divisa de la transacción
  type: 'income' | 'expense';
  accountId: string; // Cuenta asociada
  notes?: string; // Notas opcionales
  isDuplicateWarning?: boolean;
  duplicateReviewed?: boolean;
};

type BankColumnKey =
  | 'date'
  | 'valueDate'
  | 'description'
  | 'amount'
  | 'amountIn'
  | 'amountOut'
  | 'balance'
  | 'currency'
  | 'ignore';

type BankFormat = {
  id: string;
  name: string;
  isCustom: boolean;
  note?: string;
  separator: ',' | ';' | '\t';
  decimal: ',' | '.';
  encoding: 'utf-8' | 'latin1';
  skipRows: number;
  dateFormat: 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'dd-mm-yyyy' | 'dd/mm/yy';
  amountMode: 'single' | 'split';
  columns: BankColumnKey[];
  negativeIsExpense: boolean;
};

type CategoryRule = {
  id: string;
  categoryId: string;
  keywords: string[];
};

type ImportRowStatus = 'new' | 'duplicate' | 'discarded';

type ImportRow = {
  id: string;
  entryDate: string;
  valueDate: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  currency: string;
  status: ImportRowStatus;
  duplicateOf?: string;
  notes: string;
};

type ExchangeRates = {
  rates: Record<string, number>; // { USD: 1.08, GBP: 0.85, ... }
  base: string; // siempre 'EUR' (frankfurter usa EUR como base)
  timestamp: number; // Date.now() cuando se descargaron
  status: RatesStatus;
};

// ─── Caché en localStorage ────────────────────────────────────────────────────
const RATES_CACHE_KEY = 'fh_exchange_rates';
const RATES_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Tipos de cambio de fallback (aproximados, Enero 2025)
// Se usan solo si la API no responde
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  CAD: 1.46,
  AUD: 1.64,
  CHF: 0.94,
  JPY: 162,
  CNY: 7.8,
  MXN: 18.5,
  COP: 4400,
  ARS: 980,
  CLP: 980,
  BRL: 5.4,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.25,
  HUF: 390,
  CZK: 25.2,
  RON: 4.97,
  TRY: 34.5,
  INR: 90,
  KRW: 1430,
  SGD: 1.45,
  HKD: 8.4,
  NZD: 1.78,
  ZAR: 20.1,
  AED: 3.97,
};

function loadCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExchangeRates;
  } catch {
    return null;
  }
}

function saveCachedRates(data: ExchangeRates): void {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[ExchangeRates] No se pudo guardar la caché.');
  }
}

function ageLabel(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}

// ─── Hook principal de tipos de cambio ───────────────────────────────────────
function useExchangeRates() {
  const [data, setData] = useState<ExchangeRates>(() => {
    // Al montar, intentamos usar la caché
    const cached = loadCachedRates();
    if (cached) {
      const age = Date.now() - cached.timestamp;
      return {
        ...cached,
        status: age < RATES_TTL_MS ? 'fresh' : 'stale',
      };
    }
    return { rates: {}, base: 'EUR', timestamp: 0, status: 'loading' };
  });

  const fetchRates = useCallback(
    async (force = false) => {
      if (!force && data.status === 'fresh') return;
      setData((prev) => ({ ...prev, status: 'loading' }));

      // Intentamos dos URLs distintas
      const URLS = [
        'https://api.frankfurter.app/latest?base=EUR',
        'https://corsproxy.io/?https://api.frankfurter.app/latest?base=EUR',
        'https://api.exchangerate-api.com/v4/latest/EUR',
      ];

      for (const url of URLS) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue; // prueba la siguiente URL

          const json = await res.json();
          // exchangerate-api usa 'rates', frankfurter también — compatibles
          const rawRates = json.rates ?? {};
          const newData: ExchangeRates = {
            rates: { ...rawRates, EUR: 1 },
            base: 'EUR',
            timestamp: Date.now(),
            status: 'fresh',
          };

          setData(newData);
          saveCachedRates(newData);
          return; // ← éxito, salimos
        } catch (err) {
          console.warn(`[ExchangeRates] Error con ${url}:`, err);
          continue;
        }
      }

      // Si ambas URLs fallan → usamos fallback
      console.warn(
        '[ExchangeRates] API no disponible, usando tipos de fallback.'
      );
      const fallbackData: ExchangeRates = {
        rates: FALLBACK_RATES,
        base: 'EUR',
        timestamp: Date.now(),
        status: 'stale', // ← marcamos stale para avisar al usuario
      };
      setData(fallbackData);
      // No guardamos en caché para que reintente al recargar
    },
    [data.status]
  );

  // Fetch automático al montar si no hay datos frescos
  useEffect(() => {
    if (data.status === 'loading' || data.status === 'stale') {
      fetchRates();
    }
  }, []); // Solo al montar

  // Derivados útiles para la UI
  const isOutdated = data.status === 'stale' || data.status === 'error';
  const ageText = data.timestamp > 0 ? ageLabel(data.timestamp) : '—';

  return {
    rates: data.rates,
    status: data.status,
    timestamp: data.timestamp,
    ageText,
    isOutdated,
    refresh: () => fetchRates(true),
  };
}

// ─── Formatos bancarios predefinidos ─────────────────────────────────────────
const PREDEFINED_BANK_FORMATS: BankFormat[] = [
  {
    id: 'santander',
    name: 'Santander',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 4,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'ignore', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'bbva',
    name: 'BBVA',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'valueDate', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'ing',
    name: 'ING',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'ignore', 'ignore', 'description', 'amount'],
    negativeIsExpense: true,
  },
  {
    id: 'caixabank',
    name: 'CaixaBank',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 2,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'revolut',
    name: 'Revolut',
    isCustom: false,
    separator: ',',
    decimal: '.',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'yyyy-mm-dd',
    amountMode: 'single',
    columns: [
      'ignore',
      'ignore',
      'date',
      'valueDate',
      'description',
      'amount',
      'ignore',
      'currency',
      'ignore',
      'ignore',
    ],
    negativeIsExpense: true,
    note: 'En Revolut: ve a Perfil → Extractos → exportar como CSV.',
  },
  {
    id: 'bankinter',
    name: 'Bankinter',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 5,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['valueDate', 'date', 'description', 'amount', 'currency'],
    negativeIsExpense: true,
    note: 'Bankinter descarga en .xlsx. Ábrelo en Excel y guárdalo como CSV (separador ;) antes de importar.',
  },
];

// ─── Reglas de categorización por defecto ────────────────────────────────────
const DEFAULT_CATEGORY_RULES_KEYWORDS: Record<string, string[]> = {
  Alimentación: [
    'mercadona',
    'lidl',
    'carrefour',
    'alcampo',
    'dia ',
    'aldi',
    'eroski',
    'hipercor',
    'consum',
    'supermercado',
  ],
  'Restaurantes / Bares': [
    'restaurante',
    'cafeteria',
    'bar ',
    'mcdonalds',
    'burger',
    'kfc',
    'telepizza',
    'just eat',
    'glovo',
    'uber eats',
  ],
  Transporte: [
    'renfe',
    'metro',
    'bus ',
    'cabify',
    'uber',
    'gasolina',
    'repsol',
    'bp ',
    'cepsa',
    'parking',
    'autopista',
    'peaje',
  ],
  'Salud / Farmacia': [
    'farmacia',
    'doctor',
    'clinica',
    'hospital',
    'medico',
    'dentista',
    'optica',
    'sanitas',
    'adeslas',
  ],
  'Suscripciones digitales': [
    'netflix',
    'spotify',
    'amazon prime',
    'hbo',
    'disney',
    'apple',
    'google',
    'microsoft',
    'adobe',
  ],
  'Vivienda / Alquiler': [
    'alquiler',
    'comunidad',
    'ibi ',
    'hipoteca',
    'seguro hogar',
  ],
  Seguros: [
    'seguro',
    'axa',
    'mapfre',
    'mutua',
    'generali',
    'zurich',
    'allianz',
  ],
  Educación: [
    'universidad',
    'colegio',
    'academia',
    'curso',
    'udemy',
    'coursera',
    'libreria',
  ],
  'Ocio / Entretenimiento': [
    'cinema',
    'cine',
    'teatro',
    'concierto',
    'steam',
    'playstation',
    'xbox',
    'entradas',
  ],
  'Ropa / Moda': [
    'zara',
    'mango',
    'h&m',
    'primark',
    'pull',
    'bershka',
    'stradivarius',
  ],
  'Viajes / Vacaciones': [
    'ryanair',
    'vueling',
    'iberia',
    'booking',
    'airbnb',
    'hotel',
    'expedia',
  ],
  Salario: ['nomina', 'nómina', 'salario', 'sueldo', 'haberes'],
};

const BANK_COLUMN_OPTIONS: { key: BankColumnKey; label: string }[] = [
  { key: 'date', label: 'Fecha apunte' },
  { key: 'valueDate', label: 'Fecha valor' },
  { key: 'description', label: 'Descripción' },
  { key: 'amount', label: 'Importe (+ / -)' },
  { key: 'amountIn', label: 'Importe entrada' },
  { key: 'amountOut', label: 'Importe salida' },
  { key: 'balance', label: 'Saldo (ignorar)' },
  { key: 'currency', label: 'Divisa' },
  { key: 'ignore', label: '— Ignorar —' },
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual', months: 1 },
  { value: 'bimonthly', label: 'Bimensual', months: 2 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'biannual', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
];

// ─── Formatos de fecha ────────────────────────────────────────────────────────
const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '31/01/2025' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '01/31/2025' },
  { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2025-01-31' },
  { value: 'dd-mm-yyyy', label: 'DD-MM-YYYY', example: '31-01-2025' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Salario', type: 'income', color: '#16a34a' },
  { name: 'Freelance / Consultoría', type: 'income', color: '#0891b2' },
  { name: 'Alquiler recibido', type: 'income', color: '#0d9488' },
  { name: 'Inversiones / Dividendos', type: 'income', color: '#4f46e5' },
  { name: 'Pensión', type: 'income', color: '#7c3aed' },
  { name: 'Otros ingresos', type: 'income', color: '#ca8a04' },
  { name: 'Vivienda / Alquiler', type: 'expense', color: '#dc2626' },
  { name: 'Hipoteca', type: 'expense', color: '#b91c1c' },
  { name: 'Alimentación', type: 'expense', color: '#ea580c' },
  { name: 'Transporte', type: 'expense', color: '#ca8a04' },
  { name: 'Salud / Farmacia', type: 'expense', color: '#0891b2' },
  { name: 'Educación', type: 'expense', color: '#4f46e5' },
  { name: 'Ocio / Entretenimiento', type: 'expense', color: '#7c3aed' },
  { name: 'Suscripciones digitales', type: 'expense', color: '#db2777' },
  { name: 'Ropa / Moda', type: 'expense', color: '#ec4899' },
  { name: 'Restaurantes / Bares', type: 'expense', color: '#f97316' },
  { name: 'Viajes / Vacaciones', type: 'expense', color: '#06b6d4' },
  { name: 'Seguros', type: 'expense', color: '#64748b' },
  { name: 'Mascotas', type: 'expense', color: '#84cc16' },
  { name: 'Ahorro / Inversión', type: 'expense', color: '#1d4ed8' },
  { name: 'Otros gastos', type: 'expense', color: '#94a3b8' },
];
const CATEGORY_COLORS = [
  '#1d4ed8',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#0d9488',
  '#4f46e5',
];
const TABS = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'accounts', label: 'Cuentas', icon: Wallet },
  { id: 'real', label: 'Gastos Reales', icon: Receipt },
  { id: 'projections', label: 'Proyecciones', icon: BarChart2 },
  { id: 'calendar', label: 'Calendario', icon: CalendarRange },
  { id: 'forecast', label: 'Previsión', icon: LineChartIcon },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'trends', label: 'Tendencias', icon: TrendingUp },
  { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
  { id: 'reports', label: 'Informes', icon: FileText },
];

const LIGHT = {
  pageBg: '#f0f4f8',
  headerBg: '#0f172a',
  headerBorder: '#1e293b',
  headerText: '#f8fafc',
  headerMuted: '#94a3b8',
  navActive: '#3b82f6',
  navInactive: '#e2e8f0',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  cardShadowLg: '0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.08)',
  title: '#0f172a',
  body: '#334155',
  muted: '#1e293b',
  heroBg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
  heroText: '#ffffff',
  heroMuted: '#93c5fd',
  accent: '#2563eb',
  accentLight: '#eff6ff',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  amber: '#d97706',
  amberBg: '#fffbeb',
  amberBorder: '#fde68a',
  inputBg: '#f8fafc',
  inputBorder: '#cbd5e1',
  inputText: '#0f172a',
  tableHead: '#f8fafc',
  tableRow: '#ffffff',
  tableRowAlt: '#fafbfc',
  tableBorder: '#e2e8f0',
  btnSecBg: '#f1f5f9',
  btnSecText: '#334155',
  btnSecBorder: '#cbd5e1',
  errorText: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
};
const DARK = {
  pageBg: '#060610',
  headerBg: '#080812',
  headerBorder: '#12122a',
  headerText: '#f1f5f9',
  headerMuted: '#475569',
  navActive: '#60a5fa',
  navInactive: '#cbd5e1',
  cardBg: '#0d0d1f',
  cardBorder: '#1a1a35',
  cardShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
  cardShadowLg: '0 4px 6px rgba(0,0,0,0.4), 0 10px 40px rgba(0,0,0,0.5)',
  title: '#f1f5f9',
  body: '#cbd5e1',
  muted: '#e2e8f0',
  heroBg: 'linear-gradient(135deg, #050510 0%, #0a0a2e 50%, #0c1a4a 100%)',
  heroText: '#ffffff',
  heroMuted: '#60a5fa',
  accent: '#3b82f6',
  accentLight: '#0f1e40',
  green: '#22c55e',
  greenBg: '#052e16',
  greenBorder: '#14532d',
  red: '#f87171',
  redBg: '#1f0a0a',
  redBorder: '#450a0a',
  amber: '#fbbf24',
  amberBg: '#1c0f00',
  amberBorder: '#451a00',
  inputBg: '#12122a',
  inputBorder: '#1e1e40',
  inputText: '#f1f5f9',
  tableHead: '#0a0a1e',
  tableRow: '#0d0d1f',
  tableRowAlt: '#0a0a1a',
  tableBorder: '#1a1a35',
  btnSecBg: '#12122a',
  btnSecText: '#94a3b8',
  btnSecBorder: '#1e1e40',
  errorText: '#f87171',
  errorBg: '#1f0a0a',
  errorBorder: '#450a0a',
};

// ─── Toast system ─────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = uid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

function ToastContainer({ toasts }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}

function Toast({ toast }) {
  const configs = {
    success: { bg: '#16a34a', icon: '✅' },
    error: { bg: '#dc2626', icon: '⛔' },
    warning: { bg: '#d97706', icon: '⚠️' },
    info: { bg: '#2563eb', icon: 'ℹ️' },
  };
  const cfg = configs[toast.type] || configs.success;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.75rem 1.125rem',
        borderRadius: '0.875rem',
        background: cfg.bg,
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        pointerEvents: 'auto',
        animation: 'slideIn 0.25s ease',
      }}
    >
      <span>{cfg.icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();

function calcGoalProgress(
  goal: SavingsGoal,
  realExpenses: RealExpense[],
  accounts: { id: string; date: string }[],
  rates: Record<string, number>
): {
  saved: number;
  pct: number;
  remaining: number;
  completed: boolean;
  monthsLeft: number | null;
  monthlyNeeded: number | null;
  monthlyRate: number;
  estimatedDate: string | null;
  onTrack: boolean;
} {
  const now = new Date();

  let saved = 0;
  if (goal.mode === 'manual') {
    saved = goal.currentAmount;
  } else {
    saved = realExpenses.reduce((sum, e) => {
      if (e.categoryId !== goal.categoryId) return sum;
      if (e.type !== goal.autoType) return sum;
      if (e.valueDate < goal.autoStartDate) return sum;
      if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
        return sum;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc || e.valueDate <= acc.date) return sum;
      return sum + convertAmount(e.amount, e.currency, goal.currency, rates);
    }, 0);
  }

  const pct =
    goal.targetAmount > 0
      ? Math.min((saved / goal.targetAmount) * 100, 100)
      : 0;
  const remaining = Math.max(0, goal.targetAmount - saved);
  const completed = saved >= goal.targetAmount;

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
  const monthsLeft = deadlineDate
    ? Math.max(
        0,
        Math.ceil(
          (deadlineDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24 * 30.44)
        )
      )
    : null;

  const monthlyNeeded =
    monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;

  let monthlyRate = 0;
  if (goal.mode === 'auto') {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentTotal = realExpenses.reduce((sum, e) => {
      if (e.categoryId !== goal.categoryId) return sum;
      if (e.type !== goal.autoType) return sum;
      if (new Date(e.valueDate) < threeMonthsAgo) return sum;
      if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
        return sum;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc || e.valueDate <= acc.date) return sum;
      return sum + convertAmount(e.amount, e.currency, goal.currency, rates);
    }, 0);
    monthlyRate = recentTotal / 3;
  }

  let estimatedDate: string | null = null;
  if (monthlyRate > 0 && remaining > 0) {
    const monthsToGo = Math.ceil(remaining / monthlyRate);
    const est = new Date();
    est.setMonth(est.getMonth() + monthsToGo);
    estimatedDate = est.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  } else if (completed) {
    estimatedDate = 'Objetivo alcanzado';
  }

  const onTrack = monthlyNeeded !== null && monthlyRate >= monthlyNeeded;

  return {
    saved,
    pct,
    remaining,
    completed,
    monthsLeft,
    monthlyNeeded,
    monthlyRate,
    estimatedDate,
    onTrack,
  };
}

function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates || Object.keys(rates).length === 0) return amount;

  const rateFrom = rates[fromCurrency] ?? 1;
  const amountInEur = amount / rateFrom;

  const rateTo = rates[toCurrency] ?? 1;
  return amountInEur * rateTo;
}

function fmt(
  amount: number,
  toCurrency: string,
  fromCurrency: string = toCurrency,
  rates: Record<string, number> = {}
): string {
  const converted = convertAmount(amount, fromCurrency, toCurrency, rates);
  const c = CURRENCIES.find((c) => c.code === toCurrency) ?? CURRENCIES[0];

  return `${c.symbol}${Number(converted).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
const today = () => new Date().toISOString().split('T')[0];
const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
};
const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
};

function fmtDateShort(dateStr: string, dateFormat): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return '—';

  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const monthShort = months[parseInt(m, 10) - 1] ?? m;

  switch (dateFormat) {
    case 'mm/dd/yyyy':
      return `${m}/${d}/${y}`;
    case 'yyyy-mm-dd':
      return `${y}-${m}-${d}`;
    case 'dd-mm-yyyy':
      return `${d}-${m}-${y}`;
    default:
      return `${parseInt(d, 10)} ${monthShort} ${y}`;
  }
}

function fmtDateDMY(dateStr: string, dateFormat): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return '—';

  switch (dateFormat) {
    case 'mm/dd/yyyy':
      return `${m}/${d}/${y}`;
    case 'yyyy-mm-dd':
      return `${y}-${m}-${d}`;
    case 'dd-mm-yyyy':
      return `${d}-${m}-${y}`;
    default:
      return `${d}/${m}/${y}`;
  }
}

const syncEndDateDay = (startDate, endDate) => {
  if (!endDate || !startDate) return endDate;
  const s = new Date(startDate);
  const e = new Date(endDate);
  e.setDate(s.getDate());
  const maxDay = new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate();
  e.setDate(Math.min(s.getDate(), maxDay));
  return e.toISOString().split('T')[0];
};

// ─── Saldo real calculado ─────────────────────────────────────────────────────
// Toma el saldo base de la cuenta y le suma los movimientos reales
// cuya fecha de valor es POSTERIOR a la fecha del saldo base.
// Los movimientos anteriores o iguales a esa fecha ya están incluidos
// en el saldo base introducido por el usuario.
function calcRealBalance(
  account: {
    id: string;
    balance: number;
    date: string;
    currency: string;
    acknowledgedExpenseIds?: string[];
  },
  realExpenses: RealExpense[],
  rates: Record<string, number>,
  baseCurrency: string
): {
  realBalance: number;
  ignoredCount: number;
  appliedCount: number;
} {
  const accountDate = account.date;
  const acknowledged = new Set(account.acknowledgedExpenseIds ?? []);

  const accountMovements = realExpenses.filter(
    (e) => e.accountId === account.id
  );

  let delta = 0;
  let appliedCount = 0;
  let ignoredCount = 0;

  accountMovements.forEach((e) => {
    // Reconocidos → silenciados (existían antes del cambio de fecha base)
    if (acknowledged.has(e.id)) return;

    if (e.valueDate > accountDate) {
      // Posterior al saldo base → lo aplicamos
      const amountInAccountCurrency = convertAmount(
        e.amount,
        e.currency,
        account.currency ?? baseCurrency,
        rates
      );
      if (e.type === 'income') {
        delta += amountInAccountCurrency;
      } else {
        delta -= amountInAccountCurrency;
      }
      appliedCount++;
    } else {
      // Introducido DESPUÉS del cambio de fecha base → sí genera warning
      ignoredCount++;
    }
  });

  return {
    realBalance: account.balance + delta,
    ignoredCount,
    appliedCount,
  };
}

function calcForecast(
  projections,
  accounts,
  accountId = 'all',
  rates: Record<string, number> = {},
  baseCurrency = 'EUR',
  realExpenses: RealExpense[] = []
) {
  const filteredAccounts =
    accountId === 'all' ? accounts : accounts.filter((a) => a.id === accountId);
  const filteredProjections =
    accountId === 'all'
      ? projections
      : projections.filter((p) => p.accountId === accountId);

  const now = new Date();
  const currentMonthKey = monthKey(now);

  // ── Saldo inicial: usamos el saldo real calculado (base + reales aplicados) ──
  const startBalance = filteredAccounts.reduce((s, a) => {
    const { realBalance } = calcRealBalance(
      a,
      realExpenses,
      rates,
      baseCurrency
    );
    const accCurrency = a.currency ?? baseCurrency;
    return s + convertAmount(realBalance, accCurrency, baseCurrency, rates);
  }, 0);

  // ── Helper: obtiene proyecciones activas para un mes dado ──────────────────
  const getActiveProjections = (d: Date) => {
    return filteredProjections.filter((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : null;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diff =
        (d.getFullYear() - start.getFullYear()) * 12 +
        (d.getMonth() - start.getMonth());
      if (diff < 0 || (end && d > end) || diff % freq.months !== 0)
        return false;
      return true;
    });
  };

  // ── Helper: convierte importe de proyección a baseCurrency ─────────────────
  const projToBase = (p) => {
    const acc = accounts.find((a) => a.id === p.accountId);
    const accCurrency = acc?.currency ?? baseCurrency;
    return convertAmount(p.amount, accCurrency, baseCurrency, rates);
  };

  const months = [];

  for (let i = 0; i < 12; i++) {
    const d = addMonths(now, i);
    const key = monthKey(d);
    const isPast = key < currentMonthKey;
    const isCurrent = key === currentMonthKey;

    let income = 0;
    let expense = 0;

    if (isPast) {
      // ── Meses pasados: solo movimientos reales posteriores al saldo base ──
      realExpenses.forEach((e) => {
        if (e.valueDate.slice(0, 7) !== key) return;

        // Solo los de cuentas incluidas en el filtro
        const acc = filteredAccounts.find((a) => a.id === e.accountId);
        if (!acc) return;

        // Solo si es posterior al saldo base
        if (e.valueDate <= acc.date) return;

        const amount = convertAmount(e.amount, e.currency, baseCurrency, rates);
        if (e.type === 'income') income += amount;
        else expense += amount;
      });
    } else if (isCurrent) {
      // ── Mes actual: reales aplicados + proyección residual por categoría ──

      // Primero acumulamos los reales válidos del mes actual por proyección
      // Agrupamos reales por categoryId para calcular el residual
      const realByCat: Record<string, { income: number; expense: number }> = {};

      realExpenses.forEach((e) => {
        if (e.valueDate.slice(0, 7) !== key) return;
        const acc = filteredAccounts.find((a) => a.id === e.accountId);
        if (!acc) return;
        if (e.valueDate <= acc.date) return;

        if (!realByCat[e.categoryId]) {
          realByCat[e.categoryId] = { income: 0, expense: 0 };
        }
        const amount = convertAmount(e.amount, e.currency, baseCurrency, rates);
        if (e.type === 'income') {
          realByCat[e.categoryId].income += amount;
          income += amount;
        } else {
          realByCat[e.categoryId].expense += amount;
          expense += amount;
        }
      });

      // Ahora añadimos la proyección residual por categoría
      const activeProjs = getActiveProjections(d);
      activeProjs.forEach((p) => {
        const projected = projToBase(p);
        const realForCat = realByCat[p.categoryId];

        if (p.type === 'income') {
          const realIncome = realForCat?.income ?? 0;
          const residual = Math.max(0, projected - realIncome);
          income += residual;
        } else {
          const realExpense = realForCat?.expense ?? 0;
          const residual = Math.max(0, projected - realExpense);
          expense += residual;
        }
      });
    } else {
      // ── Meses futuros: proyección completa ────────────────────────────────
      const activeProjs = getActiveProjections(d);
      activeProjs.forEach((p) => {
        const converted = projToBase(p);
        if (p.type === 'income') income += converted;
        else expense += converted;
      });
    }

    months.push({
      key,
      label: monthLabel(key),
      income,
      expense,
      net: income - expense,
      isPast,
      isCurrent,
    });
  }

  let running = startBalance;

  return months.map((m, i) => {
    if (i > 0) running += m.net;
    return { ...m, runningBalance: running };
  });
}

// ─── Hook de persistencia ─────────────────────────────────────────────────────
function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : fallback;
    } catch {
      console.warn(
        `[useLocalStorage] Error leyendo "${key}", usando fallback.`
      );
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`[useLocalStorage] Error escribiendo "${key}".`);
    }
  }, [key, value]);
  return [value, setValue];
}

// ─── Contexto central de la aplicación ───────────────────────────────────────
const AppContext = createContext(null);

// Hook personalizado para consumir el contexto.
// Cualquier componente que necesite datos llama a useApp() en lugar
// de recibir props. Si se usa fuera del Provider lanza un error claro.
function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

// ── Hook de datos para tendencias ─────────────────────────────────────────
function useTrendsData(
  rangeMonths: number | 'all',
  accountFilter: string,
  accounts: any[],
  realExpenses: RealExpense[],
  categories: any[],
  rates: Record<string, number>,
  baseCurrency: string
) {
  return useMemo(() => {
    const now = new Date();
    const allMonthKeys = Array.from(
      new Set(realExpenses.map((e) => e.valueDate.slice(0, 7)))
    ).sort();

    let monthKeys: string[] = [];
    if (rangeMonths === 'all') {
      monthKeys = allMonthKeys;
    } else {
      for (let i = rangeMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthKeys.push(monthKey(d));
      }
    }

    if (monthKeys.length === 0) return null;

    const filteredAccounts =
      accountFilter === 'all'
        ? accounts
        : accounts.filter((a) => a.id === accountFilter);

    const validExpenses = realExpenses.filter((e) => {
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      if (e.valueDate <= acc.date) return false;
      if (accountFilter !== 'all' && e.accountId !== accountFilter)
        return false;
      if (!monthKeys.includes(e.valueDate.slice(0, 7))) return false;
      return true;
    });

    const monthlyData = monthKeys.map((mk) => {
      const monthExpenses = validExpenses.filter(
        (e) => e.valueDate.slice(0, 7) === mk
      );
      const income = monthExpenses
        .filter((e) => e.type === 'income')
        .reduce(
          (sum, e) =>
            sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const expenses = monthExpenses
        .filter((e) => e.type === 'expense')
        .reduce(
          (sum, e) =>
            sum + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const net = income - expenses;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      });
      return {
        monthKey: mk,
        label,
        income: parseFloat(income.toFixed(2)),
        expenses: parseFloat(expenses.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        savingsRate: parseFloat(savingsRate.toFixed(1)),
      };
    });

    const balanceData = monthKeys.map((mk) => {
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
        month: 'short',
        year: '2-digit',
      });
      const point: Record<string, any> = { monthKey: mk, label };
      filteredAccounts.forEach((acc) => {
        let balance = convertAmount(
          acc.balance,
          acc.currency ?? baseCurrency,
          baseCurrency,
          rates
        );
        realExpenses.forEach((e) => {
          if (e.accountId !== acc.id) return;
          if (e.valueDate <= acc.date) return;
          if (e.valueDate.slice(0, 7) > mk) return;
          const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
          balance += e.type === 'income' ? amt : -amt;
        });
        point[acc.id] = parseFloat(balance.toFixed(2));
        point[`${acc.id}_name`] = acc.name;
      });
      const total = filteredAccounts.reduce(
        (sum, acc) => sum + (point[acc.id] ?? 0),
        0
      );
      point['total'] = parseFloat(total.toFixed(2));
      return point;
    });

    const catTotals: Record<string, number> = {};
    validExpenses
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        const amt = convertAmount(e.amount, e.currency, baseCurrency, rates);
        catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + amt;
      });

    const categoryData = Object.entries(catTotals)
      .map(([catId, total]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          name: cat?.name ?? 'Sin categoría',
          color: cat?.color ?? '#94a3b8',
          emoji: cat?.emoji ?? '📦',
          total: parseFloat(total.toFixed(2)),
        };
      })
      .sort((a, b) => b.total - a.total);

    const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
    const totalNet = totalIncome - totalExpenses;
    const avgSavingsRate =
      monthlyData.length > 0
        ? monthlyData.reduce((s, m) => s + m.savingsRate, 0) /
          monthlyData.length
        : 0;

    const bestIncomeMonth = [...monthlyData].sort(
      (a, b) => b.income - a.income
    )[0];
    const worstExpenseMonth = [...monthlyData].sort(
      (a, b) => b.expenses - a.expenses
    )[0];
    const topCategory = categoryData[0];

    const half = Math.floor(monthlyData.length / 2);
    const firstHalfSavings =
      monthlyData.slice(0, half).reduce((s, m) => s + m.savingsRate, 0) /
      (half || 1);
    const secondHalfSavings =
      monthlyData.slice(half).reduce((s, m) => s + m.savingsRate, 0) /
      (monthlyData.length - half || 1);
    const trend: 'up' | 'down' | 'stable' =
      secondHalfSavings > firstHalfSavings + 2
        ? 'up'
        : secondHalfSavings < firstHalfSavings - 2
        ? 'down'
        : 'stable';

    return {
      monthlyData,
      balanceData,
      categoryData,
      filteredAccounts,
      stats: {
        totalIncome,
        totalExpenses,
        totalNet,
        avgSavingsRate,
        bestIncomeMonth,
        worstExpenseMonth,
        topCategory,
        trend,
        monthCount: monthKeys.length,
      },
    };
  }, [
    rangeMonths,
    accountFilter,
    accounts,
    realExpenses,
    categories,
    rates,
    baseCurrency,
  ]);
}

// ─── Motor de recurrentes ─────────────────────────────────────────────────────
function applyRecurringProjections(
  projections: Projection[],
  realExpenses: RealExpense[],
  setRealExpenses: React.Dispatch<React.SetStateAction<RealExpense[]>>,
  setProjections: React.Dispatch<React.SetStateAction<Projection[]>>,
  accounts: any[],
  baseCurrency: string
): { applied: number; duplicates: number } {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
  const currentDay = now.getDate();

  const recurringProjs = projections.filter((p) => p.isRecurring === true);

  let applied = 0;
  let duplicates = 0;
  const duplicateDetails: {
    projectionName: string;
    amount: number;
    currency: string;
    monthKey: string;
  }[] = [];

  const newExpenses: RealExpense[] = [];
  const updatedProjections = projections.map((p) => ({ ...p }));

  recurringProjs.forEach((proj) => {
    // ── 1. ¿Ya se aplicó este mes? ──────────────────────────────────────────
    if (proj.lastApplied === currentMonthKey) return;

    // ── 2. ¿Ha llegado el día de cargo? ─────────────────────────────────────
    const chargeDay = proj.recurringDay ?? new Date(proj.startDate).getDate();
    if (currentDay < chargeDay) return;

    // ── 3. ¿Esta proyección está activa este mes? ────────────────────────────
    const start = new Date(proj.startDate);
    const end = proj.endDate ? new Date(proj.endDate) : null;
    const freq = FREQUENCIES.find((f) => f.value === proj.frequency);
    if (!freq) return;
    const diffMonths =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (diffMonths < 0) return;
    if (end && now > end) return;
    if (diffMonths % freq.months !== 0) return;

    // ── 4. Detectar posible duplicado ────────────────────────────────────────
    const amount = proj.nextOverrideAmount ?? proj.amount;
    const chargeDate = `${currentMonthKey}-${String(chargeDay).padStart(
      2,
      '0'
    )}`;

    const isDuplicate = [...realExpenses, ...newExpenses].some((e) => {
      if (e.categoryId !== proj.categoryId) return false;
      if (e.accountId !== proj.accountId) return false;
      if (e.type !== proj.type) return false;
      if (Math.abs(e.amount - amount) > amount * 0.05) return false;
      if (e.valueDate.slice(0, 7) !== currentMonthKey) return false;
      return true;
    });

    if (isDuplicate) {
      duplicates++;

      // ── Marcar la PROYECCIÓN con el flag de duplicado ──
      const idx = updatedProjections.findIndex((p) => p.id === proj.id);
      if (idx !== -1) {
        updatedProjections[idx] = {
          ...updatedProjections[idx],
          hasDuplicateWarning: true,
          duplicateWarningMonth: currentMonthKey,
          lastApplied: currentMonthKey,
          nextOverrideAmount: null,
        };
      }

      // Guardamos el detalle para el warning general
      const acc = accounts.find((a) => a.id === proj.accountId);
      duplicateDetails.push({
        projectionName: proj.name,
        amount,
        currency: acc?.currency ?? baseCurrency,
        monthKey: currentMonthKey,
      });

      return;
    }

    // ── 5. Crear el gasto real ───────────────────────────────────────────────
    const acc = accounts.find((a) => a.id === proj.accountId);
    const currency = acc?.currency ?? baseCurrency;

    const newExpense: RealExpense = {
      id: uid(),
      entryDate: chargeDate,
      valueDate: chargeDate,
      description: `🔄 ${proj.name}`,
      categoryId: proj.categoryId,
      amount,
      currency,
      type: proj.type as 'income' | 'expense',
      accountId: proj.accountId,
      notes: 'Generado automáticamente por cargo recurrente',
    };

    newExpenses.push(newExpense);
    applied++;

    // ── 6. Actualizar la proyección (lastApplied + limpiar override) ─────────
    const idx = updatedProjections.findIndex((p) => p.id === proj.id);
    if (idx !== -1) {
      updatedProjections[idx] = {
        ...updatedProjections[idx],
        lastApplied: currentMonthKey,
        nextOverrideAmount: null,
      };
    }
  });

  // ── Aplicar cambios al estado ─────────────────────────────────────────────
  if (newExpenses.length > 0) {
    setRealExpenses((prev) => [...prev, ...newExpenses]);
  }
  if (applied > 0 || duplicates > 0) {
    setProjections(updatedProjections);
  }

  return { applied, duplicates, duplicateDetails };
}

// AppProvider es el componente que envuelve toda la app y provee el contexto.
// Aquí vive ahora todo el estado y los derivados que antes estaban en App.
function AppProvider({ children }) {
  const { clearSecurity } = useSecurityContext();

  // ── Estado persistido ──────────────────────────────────────────────────────
  const [onboarded, setOnboarded] = useLocalStorage('fh_onboarded', false);
  const [tourCompleted, setTourCompleted] = useLocalStorage(
    'fh_tour_completed',
    false
  );
  const [tourIsFirstTime, setTourIsFirstTime] = useLocalStorage(
    'fh_tour_first_time',
    true
  );
  const [backupHistory, setBackupHistory] = useLocalStorage<BackupEntry[]>(
    'fh_backup_history',
    []
  );
  const [backupReminderDays, setBackupReminderDays] = useLocalStorage<number>(
    'fh_backup_reminder_days',
    7 // Por defecto, recordatorio cada 7 días
  );
  const [backupReminderDismissed, setBackupReminderDismissed] =
    useLocalStorage<number>(
      'fh_backup_reminder_dismissed',
      0 // Timestamp de cuándo lo descartó por última vez
    );

  const [autoBackupDone, setAutoBackupDone] = useLocalStorage<boolean>(
    'fh_auto_backup_done',
    false
  );

  const [firstSessionDone, setFirstSessionDone] = useLocalStorage<boolean>(
    'fh_first_session_done',
    false
  );

  const [lastAutoBackupSession, setLastAutoBackupSession] =
    useLocalStorage<number>('fh_last_auto_backup_session', 0);

  const [accounts, setAccounts] = useLocalStorage('fh_accounts', []);
  const [categories, setCategories] = useLocalStorage('fh_categories', []);
  const [projections, setProjections] = useLocalStorage('fh_projections', []);
  const [realExpenses, setRealExpenses] = useLocalStorage<RealExpense[]>(
    'fh_real_expenses',
    []
  );
  const [goals, setGoals] = useLocalStorage<SavingsGoal[]>('fh_goals', []);
  const [bankFormats, setBankFormats] = useLocalStorage<BankFormat[]>(
    'fh_bank_formats',
    []
  );
  const [categoryRules, setCategoryRules] = useLocalStorage<CategoryRule[]>(
    'fh_category_rules',
    []
  );

  const [ignoredAlerts, setIgnoredAlerts] = useLocalStorage<string[]>(
    'fh_ignored_alerts',
    []
  );
  const [dark, setDark] = useLocalStorage('fh_dark', false);
  const [baseCurrency, setBaseCurrency] = useLocalStorage(
    'fh_base_currency',
    'EUR'
  );
  const [displayCurrency, setDisplayCurrency] = useLocalStorage(
    'fh_currency',
    'EUR'
  );

  const [dateFormat, setDateFormat] = useLocalStorage(
    'fh_date_format',
    'dd/mm/yyyy'
  );

  // ── Tipos de cambio ────────────────────────────────────────────────────────
  const {
    rates,
    status: ratesStatus,
    ageText: ratesAgeText,
    isOutdated: ratesOutdated,
    refresh: refreshRates,
  } = useExchangeRates();

  // ── Motor de alertas ───────────────────────────────────────────────────────
  const computedAlerts = useMemo((): AppAlert[] => {
    const alerts: AppAlert[] = [];
    const now = new Date();
    const currentMonthKey = monthKey(now);

    // ── 1. Saldo crítico — cuenta ya por debajo del mínimo ─────────────────
    accounts.forEach((acc) => {
      if (!acc.minBalance || acc.minBalance <= 0) return;
      const { realBalance } = calcRealBalance(
        acc,
        realExpenses,
        rates,
        baseCurrency
      );
      if (realBalance < acc.minBalance) {
        alerts.push({
          id: `balance_critical_${acc.id}`,
          type: 'balance_critical',
          severity: 'critical',
          title: `${acc.name} por debajo del mínimo`,
          message: `Saldo real: ${fmt(
            realBalance,
            acc.currency ?? baseCurrency,
            acc.currency ?? baseCurrency,
            rates
          )} · Mínimo configurado: ${fmt(
            acc.minBalance,
            acc.currency ?? baseCurrency,
            acc.currency ?? baseCurrency,
            rates
          )}`,
          actionLabel: 'Ver cuenta',
          actionTab: 'accounts',
          data: { accountId: acc.id },
          generatedAt: Date.now(),
        });
      }
    });

    // ── 2. Saldo en riesgo — proyección cae bajo mínimo en <3 meses ────────
    accounts.forEach((acc) => {
      if (!acc.minBalance || acc.minBalance <= 0) return;
      const { realBalance } = calcRealBalance(
        acc,
        realExpenses,
        rates,
        baseCurrency
      );
      if (realBalance < acc.minBalance) return; // ya cubierto por alerta crítica
      const fc = calcForecast(
        projections,
        accounts,
        acc.id,
        rates,
        baseCurrency,
        realExpenses
      );
      const riskMonth = fc
        .slice(0, 3)
        .find((m) => m.runningBalance < acc.minBalance);
      if (riskMonth) {
        alerts.push({
          id: `balance_risk_${acc.id}`,
          type: 'balance_risk',
          severity: 'warning',
          title: `${acc.name} caerá bajo el mínimo`,
          message: `En ${riskMonth.label} el saldo proyectado (${fmt(
            riskMonth.runningBalance,
            acc.currency ?? baseCurrency,
            acc.currency ?? baseCurrency,
            rates
          )}) caerá por debajo del mínimo (${fmt(
            acc.minBalance,
            acc.currency ?? baseCurrency,
            acc.currency ?? baseCurrency,
            rates
          )})`,
          actionLabel: 'Ver previsión',
          actionTab: 'forecast',
          data: { accountId: acc.id },
          generatedAt: Date.now(),
        });
      }
    });

    // ── 3. Presupuesto superado — gasto real > proyectado este mes ──────────
    const activeProjectionsThisMonth = projections.filter((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : null;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diff =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth());
      if (diff < 0 || (end && now > end) || diff % freq.months !== 0)
        return false;
      return p.type === 'expense';
    });

    const realByCat: Record<string, number> = {};
    realExpenses.forEach((e) => {
      if (e.valueDate.slice(0, 7) !== currentMonthKey) return;
      if (e.type !== 'expense') return;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc || e.valueDate <= acc.date) return;
      realByCat[e.categoryId] =
        (realByCat[e.categoryId] ?? 0) +
        convertAmount(e.amount, e.currency, baseCurrency, rates);
    });

    const projByCat: Record<string, number> = {};
    activeProjectionsThisMonth.forEach((p) => {
      const acc = accounts.find((a) => a.id === p.accountId);
      const accCurrency = acc?.currency ?? baseCurrency;
      projByCat[p.categoryId] =
        (projByCat[p.categoryId] ?? 0) +
        convertAmount(p.amount, accCurrency, baseCurrency, rates);
    });

    Object.entries(realByCat).forEach(([catId, realAmt]) => {
      const projAmt = projByCat[catId];
      if (!projAmt || projAmt <= 0) return;
      if (realAmt > projAmt) {
        const cat = categories.find((c) => c.id === catId);
        const overPct = Math.round(((realAmt - projAmt) / projAmt) * 100);
        alerts.push({
          id: `budget_exceeded_${catId}`,
          type: 'budget_exceeded',
          severity: 'warning',
          title: `${cat?.name ?? 'Categoría'} supera el presupuesto`,
          message: `Gasto real: ${fmt(
            realAmt,
            baseCurrency,
            baseCurrency,
            rates
          )} · Proyectado: ${fmt(
            projAmt,
            baseCurrency,
            baseCurrency,
            rates
          )} · Exceso: +${overPct}%`,
          actionLabel: 'Ver gastos reales',
          actionTab: 'real',
          data: { categoryId: catId },
          generatedAt: Date.now(),
        });
      }
    });

    // ── 3b. Proyecciones con posible duplicado detectado ────────────────────
    projections.forEach((p) => {
      if (!p.hasDuplicateWarning) return;
      if (p.duplicateWarningMonth !== currentMonthKey) return;

      const cat = categories.find((c) => c.id === p.categoryId);
      const acc = accounts.find((a) => a.id === p.accountId);
      const currency = acc?.currency ?? baseCurrency;

      alerts.push({
        id: `duplicate_projection_${p.id}_${p.duplicateWarningMonth}`,
        type: 'duplicate_projection',
        severity: 'warning',
        title: `Posible duplicado en "${p.name}"`,
        message: `La proyección "${p.name}" (${
          cat?.name ?? 'Sin categoría'
        } · ${fmt(
          p.amount,
          currency,
          currency,
          rates
        )}) intentó generar un gasto en ${
          p.duplicateWarningMonth
        } pero ya existe un movimiento similar. Por favor revisa las proyecciones y los gastos reales para confirmar.`,
        actionLabel: 'Ir a proyecciones',
        actionTab: 'projections',
        data: { projectionId: p.id },
        generatedAt: Date.now(),
      });
    });

    // ── 4. Mes con balance neto negativo proyectado ──────────────────────────
    const forecastThisMonth = calcForecast(
      projections,
      accounts,
      'all',
      rates,
      baseCurrency,
      realExpenses
    )[0];
    if (forecastThisMonth && forecastThisMonth.net < 0) {
      alerts.push({
        id: `month_negative_${currentMonthKey}`,
        type: 'month_negative',
        severity: 'warning',
        title: 'Balance mensual negativo',
        message: `Este mes los gastos superan a los ingresos en ${fmt(
          Math.abs(forecastThisMonth.net),
          baseCurrency,
          baseCurrency,
          rates
        )}. Revisa tus proyecciones.`,
        actionLabel: 'Ver proyecciones',
        actionTab: 'projections',
        generatedAt: Date.now(),
      });
    }

    // ── 5 & 6 & 7. Alertas de objetivos ─────────────────────────────────────
    goals.forEach((goal) => {
      // Calcular progreso
      let saved = 0;
      if (goal.mode === 'manual') {
        saved = goal.currentAmount;
      } else {
        saved = realExpenses.reduce((sum, e) => {
          if (e.categoryId !== goal.categoryId) return sum;
          if (e.type !== goal.autoType) return sum;
          if (e.valueDate < goal.autoStartDate) return sum;
          if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
            return sum;
          const acc = accounts.find((a) => a.id === e.accountId);
          if (!acc || e.valueDate <= acc.date) return sum;
          return (
            sum + convertAmount(e.amount, e.currency, goal.currency, rates)
          );
        }, 0);
      }

      const pct = goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - saved);
      const completed = saved >= goal.targetAmount;

      // 7. Objetivo completado ✅
      if (completed) {
        alerts.push({
          id: `goal_completed_${goal.id}`,
          type: 'goal_completed',
          severity: 'positive',
          title: `${goal.emoji} ¡Objetivo "${goal.name}" completado!`,
          message: `Has alcanzado tu meta de ${fmt(
            goal.targetAmount,
            goal.currency,
            goal.currency,
            rates
          )}. ¡Enhorabuena!`,
          actionLabel: 'Ver objetivos',
          actionTab: 'goals',
          data: { goalId: goal.id },
          generatedAt: Date.now(),
        });
        return;
      }

      // 6. Objetivo vencido ⏰
      if (goal.deadline) {
        const deadlineDate = new Date(goal.deadline);
        if (deadlineDate < now) {
          alerts.push({
            id: `goal_overdue_${goal.id}`,
            type: 'goal_overdue',
            severity: 'critical',
            title: `${goal.emoji} "${goal.name}" ha vencido`,
            message: `El plazo terminó el ${fmtDateShort(
              goal.deadline,
              dateFormat
            )} con un ${Math.round(
              pct
            )}% completado. Considera actualizar la fecha o el importe objetivo.`,
            actionLabel: 'Ver objetivo',
            actionTab: 'goals',
            data: { goalId: goal.id },
            generatedAt: Date.now(),
          });
          return;
        }

        // 5. Objetivo en peligro — ritmo insuficiente
        const deadlineMs = deadlineDate.getTime() - now.getTime();
        const monthsLeft = Math.max(
          0,
          Math.ceil(deadlineMs / (1000 * 60 * 60 * 24 * 30.44))
        );

        if (monthsLeft > 0 && goal.mode === 'auto') {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const recentTotal = realExpenses.reduce((sum, e) => {
            if (e.categoryId !== goal.categoryId) return sum;
            if (e.type !== goal.autoType) return sum;
            if (new Date(e.valueDate) < threeMonthsAgo) return sum;
            if (goal.accountId !== 'all' && e.accountId !== goal.accountId)
              return sum;
            const acc = accounts.find((a) => a.id === e.accountId);
            if (!acc || e.valueDate <= acc.date) return sum;
            return (
              sum + convertAmount(e.amount, e.currency, goal.currency, rates)
            );
          }, 0);
          const monthlyRate = recentTotal / 3;
          const monthlyNeeded = remaining / monthsLeft;

          if (monthlyRate < monthlyNeeded * 0.8) {
            alerts.push({
              id: `goal_at_risk_${goal.id}`,
              type: 'goal_at_risk',
              severity: 'warning',
              title: `${goal.emoji} "${goal.name}" en peligro`,
              message: `Ritmo actual: ${fmt(
                monthlyRate,
                goal.currency,
                goal.currency,
                rates
              )}/mes · Necesitas: ${fmt(
                monthlyNeeded,
                goal.currency,
                goal.currency,
                rates
              )}/mes para llegar a tiempo en ${monthsLeft} mes${
                monthsLeft !== 1 ? 'es' : ''
              }.`,
              actionLabel: 'Ver objetivo',
              actionTab: 'goals',
              data: { goalId: goal.id },
              generatedAt: Date.now(),
            });
          }
        }

        // Modo manual — sin ritmo calculable, avisamos si queda poco tiempo y poco progreso
        if (monthsLeft <= 2 && goal.mode === 'manual' && pct < 80) {
          alerts.push({
            id: `goal_at_risk_${goal.id}`,
            type: 'goal_at_risk',
            severity: 'warning',
            title: `${goal.emoji} "${goal.name}" — poco tiempo`,
            message: `Quedan ${monthsLeft} mes${
              monthsLeft !== 1 ? 'es' : ''
            } y llevas un ${Math.round(
              pct
            )}% completado. Actualiza el importe ahorrado si has avanzado.`,
            actionLabel: 'Actualizar progreso',
            actionTab: 'goals',
            data: { goalId: goal.id },
            generatedAt: Date.now(),
          });
        }
      }
    });

    // Filtramos las ignoradas permanentemente
    return alerts.filter((a) => !ignoredAlerts.includes(a.id));
  }, [
    accounts,
    projections,
    categories,
    realExpenses,
    goals,
    rates,
    baseCurrency,
    ignoredAlerts,
  ]);

  // ── Estado de avisos de recurrentes ──────────────────────────────────────
  const [recurringDuplicateWarnings, setRecurringDuplicateWarnings] = useState<
    {
      projectionName: string;
      amount: number;
      currency: string;
      monthKey: string;
    }[]
  >([]);
  const [showRecurringWarnings, setShowRecurringWarnings] = useState(false);

  // ── Estado de UI ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState('dashboard');
  const [showCurrency, setShowCurrency] = useState(false);
  const [realAccountFilter, setRealAccountFilter] = useState('all');

  // ── Filtros persistidos de Gastos Reales (durante la sesión) ──────────────
  const [realFilterType, setRealFilterType] = useState('all');
  const [realFilterAccount, setRealFilterAccount] = useState('all');
  const [realFilterCategory, setRealFilterCategory] = useState('all');
  const [realFilterDateMode, setRealFilterDateMode] = useState<
    'preset' | 'range'
  >('preset');
  const [realFilterPreset, setRealFilterPreset] = useState('all');
  const [realFilterDateFrom, setRealFilterDateFrom] = useState('');
  const [realFilterDateTo, setRealFilterDateTo] = useState('');

  // ── Derivados ──────────────────────────────────────────────────────────────
  const T = dark ? DARK : LIGHT;

  // Helper: convierte y formatea un importe desde la divisa de cuenta
  // a la divisa de visualización actual
  const fmtAccount = useCallback(
    (amount, accountCurrency) => {
      return fmt(amount, displayCurrency, accountCurrency, rates);
    },
    [displayCurrency, rates]
  );

  const forecastAll = useMemo(
    () =>
      calcForecast(
        projections,
        accounts,
        'all',
        rates,
        baseCurrency,
        realExpenses
      ),
    [projections, accounts, rates, baseCurrency, realExpenses]
  );

  const forecastByAccount = useMemo(() => {
    const map = {};
    accounts.forEach((acc) => {
      map[acc.id] = calcForecast(
        projections,
        accounts,
        acc.id,
        rates,
        baseCurrency,
        realExpenses
      );
    });
    return map;
  }, [projections, accounts, rates, baseCurrency, realExpenses]);

  const accountWarnings = useMemo(() => {
    const w = {};
    accounts.forEach((acc) => {
      if (!acc.minBalance || acc.minBalance <= 0) {
        w[acc.id] = false;
        return;
      }
      const fc = forecastByAccount[acc.id] || [];
      const currentlyBelow = acc.balance < acc.minBalance;
      const projectedBelow = fc.some((m) => m.runningBalance < acc.minBalance);
      w[acc.id] = currentlyBelow || projectedBelow;
    });
    return w;
  }, [accounts, forecastByAccount]);

  // Patrimonio total: suma todas las cuentas convertidas a displayCurrency
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const converted = convertAmount(
        acc.balance,
        acc.currency ?? baseCurrency, // si la cuenta no tiene divisa, usa la base
        displayCurrency,
        rates
      );
      return sum + converted;
    }, 0);
  }, [accounts, displayCurrency, baseCurrency, rates]);

  // Mapa de saldos reales calculados por cuenta
  const realBalanceMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof calcRealBalance>> = {};
    accounts.forEach((acc) => {
      map[acc.id] = calcRealBalance(acc, realExpenses, rates, baseCurrency);
    });
    return map;
  }, [accounts, realExpenses, rates, baseCurrency]);

  // Patrimonio total usando saldos reales calculados
  const totalRealBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const { realBalance } = realBalanceMap[acc.id] ?? {
        realBalance: acc.balance,
      };
      return (
        sum +
        convertAmount(
          realBalance,
          acc.currency ?? baseCurrency,
          displayCurrency,
          rates
        )
      );
    }, 0);
  }, [accounts, realBalanceMap, displayCurrency, baseCurrency, rates]);

  const stats = useMemo(
    () => ({
      totalBalance,
      totalRealBalance,
      thisMonth: forecastAll[0] || { income: 0, expense: 0, net: 0 },
      warnAccounts: accounts.filter((a) => accountWarnings[a.id]),
    }),
    [totalBalance, totalRealBalance, forecastAll, accountWarnings, accounts]
  );

  const resetApp = useCallback(() => {
    setAccounts([]);
    setCategories([]);
    setProjections([]);
    setRealExpenses([]);
    setOnboarded(false);
    setBackupHistory([]);
    setTourCompleted(false);
    setTourIsFirstTime(false);
    clearSecurity();
  }, [clearSecurity]);

  const accountsRef = useRef(accounts);
  const categoriesRef = useRef(categories);
  const projectionsRef = useRef(projections);
  const realExpensesRef = useRef(realExpenses);
  const goalsRef = useRef(goals);
  const bankFormatsRef = useRef(bankFormats);
  const categoryRulesRef = useRef(categoryRules);
  const baseCurrencyRef = useRef(baseCurrency);
  const displayCurrencyRef = useRef(displayCurrency);
  const darkRef = useRef(dark);

  accountsRef.current = accounts;
  categoriesRef.current = categories;
  projectionsRef.current = projections;
  realExpensesRef.current = realExpenses;
  goalsRef.current = goals;
  bankFormatsRef.current = bankFormats;
  categoryRulesRef.current = categoryRules;
  baseCurrencyRef.current = baseCurrency;
  displayCurrencyRef.current = displayCurrency;
  darkRef.current = dark;

  // ── Backup: crear snapshot interno ────────────────────────────────────────
  const createBackup = (label = 'Copia manual') => {
    const a = accountsRef.current;
    const c = categoriesRef.current;
    const p = projectionsRef.current;
    const r = realExpensesRef.current;
    const g = goalsRef.current;
    const bf = bankFormatsRef.current;
    const cr = categoryRulesRef.current;
    const bc = baseCurrencyRef.current;
    const dc = displayCurrencyRef.current;
    const dk = darkRef.current;

    const entry: BackupEntry = {
      id: uid(),
      timestamp: Date.now(),
      label,
      accountsCount: a.length,
      categoriesCount: c.length,
      projectionsCount: p.length,
      realExpensesCount: r.length,
      goalsCount: g.length,
      data: {
        accounts: a,
        categories: c,
        projections: p,
        realExpenses: r,
        goals: g,
        bankFormats: bf,
        categoryRules: cr,
        baseCurrency: bc,
        displayCurrency: dc,
        dark: dk,
      },
    };

    setBackupHistory((prev) => {
      const updated = [entry, ...prev];
      return updated.slice(0, 50);
    });

    return entry;
  };

  // ── Backup: descargar fichero JSON ────────────────────────────────────────
  const downloadBackup = (entry?: BackupEntry) => {
    const snapshot = entry ?? {
      id: uid(),
      timestamp: Date.now(),
      label: 'Descarga manual',
      accountsCount: accounts.length,
      categoriesCount: categories.length,
      projectionsCount: projections.length,
      realExpensesCount: realExpenses.length,
      data: {
        accounts,
        categories,
        projections,
        realExpenses,
        goals: goals ?? [],
        bankFormats,
        categoryRules,
        baseCurrency,
        displayCurrency,
        dark,
      },
    };

    const json = JSON.stringify(
      { version: '1.0', app: 'FinanzasHogar', ...snapshot },
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date(snapshot.timestamp);
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `FinanzasHogar_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Backup: restaurar desde snapshot ─────────────────────────────────────
  const restoreBackup = (entry: BackupEntry) => {
    const { data } = entry;
    setAccounts(data.accounts ?? []);
    setCategories(data.categories ?? []);
    setProjections(data.projections ?? []);
    setRealExpenses(data.realExpenses ?? []);
    setGoals(data.goals ?? []);
    setBankFormats(data.bankFormats ?? []);
    setCategoryRules(data.categoryRules ?? []);
    setBaseCurrency(data.baseCurrency ?? 'EUR');
    setDisplayCurrency(data.displayCurrency ?? 'EUR');
    setDark(data.dark ?? false);
    // Siempre marcar como onboarded para evitar pantalla en blanco
    if ((data.accounts ?? []).length > 0) {
      setOnboarded(true);
    }
  };

  // ── Backup: eliminar entrada del historial ────────────────────────────────
  const deleteBackup = (id: string) => {
    setBackupHistory((prev) => prev.filter((b) => b.id !== id));
  };

  // ── Motor de recurrentes al arrancar ──────────────────────────────────────
  const recurringMotorRan = useRef(false);

  useEffect(() => {
    if (!onboarded) return;
    if (accounts.length === 0) return;
    if (recurringMotorRan.current) return; // ← evita doble ejecución en StrictMode
    recurringMotorRan.current = true;

    // ── Limpiar flags de duplicado de meses anteriores ──
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    setProjections((prev) =>
      prev.map((p) => {
        if (
          p.hasDuplicateWarning &&
          p.duplicateWarningMonth !== currentMonthKey
        ) {
          const { hasDuplicateWarning, duplicateWarningMonth, ...rest } = p;
          return rest;
        }
        return p;
      })
    );

    // ── Limpiar nextOverrideAmount de meses anteriores ──
    // Si ya ha pasado el mes en que se configuró el ajuste puntual, lo limpiamos
    setProjections((prev) =>
      prev.map((p) => {
        if (!p.nextOverrideAmount) return p;
        // Si la proyección ya fue aplicada este mes o en un mes anterior,
        // limpiamos el override (ya cumplió su función o caducó)
        if (p.lastApplied && p.lastApplied <= currentMonthKey) {
          const { nextOverrideAmount, ...rest } = p;
          return rest;
        }
        return p;
      })
    );

    const result = applyRecurringProjections(
      projections,
      realExpenses,
      setRealExpenses,
      setProjections,
      accounts,
      baseCurrency
    );

    if (result.applied > 0) {
      console.info(
        `[Recurrentes] ${result.applied} cargo(s) aplicado(s) automáticamente`
      );
    }

    // ── Mostrar avisos de duplicados detectados ────────────────────────────
    if (result.duplicates > 0 && result.duplicateDetails) {
      setRecurringDuplicateWarnings(result.duplicateDetails);
      setShowRecurringWarnings(true);
    }
  }, [onboarded]);

  // ── Backup automático al arrancar ─────────────────────────
  useEffect(() => {
    // Solo si el usuario ya ha completado el onboarding
    if (!onboarded) return;

    // Solo si tiene datos que respaldar
    if (accounts.length === 0) return;

    // ── Si es la primera sesión con datos, solo marcamos
    // que ya pasó — sin backup ni banner ──────────────────────
    if (!firstSessionDone) {
      setFirstSessionDone(true);
      setAutoBackupDone(false);
      return;
    }

    const lastBackup = backupHistory[0]?.timestamp ?? 0;
    const daysSinceBackup =
      lastBackup > 0
        ? Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24))
        : null;

    const neverBackedUp = lastBackup === 0;
    const backupIsOld =
      daysSinceBackup !== null && daysSinceBackup >= backupReminderDays;

    // ¿Ya hemos hecho el backup automático en esta sesión?
    const alreadyDoneThisSession =
      Date.now() - lastAutoBackupSession < 1000 * 60 * 60;

    if ((neverBackedUp || backupIsOld) && !alreadyDoneThisSession) {
      const timer = setTimeout(() => {
        createBackup('Automática al arrancar');
        setLastAutoBackupSession(Date.now());
        setAutoBackupDone(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setAutoBackupDone(false);
    }
  }, [onboarded, accounts.length, firstSessionDone]);

  // ── Valor del contexto ─────────────────────────────────────────────────────
  const value = {
    // Onboarding
    onboarded,
    setOnboarded,
    resetApp,
    firstSessionDone,
    setFirstSessionDone,
    dateFormat,
    setDateFormat,

    // Tour
    tourCompleted,
    setTourCompleted,
    tourIsFirstTime,
    setTourIsFirstTime,

    // Backup
    backupHistory,
    setBackupHistory,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    backupReminderDays,
    setBackupReminderDays,
    backupReminderDismissed,
    setBackupReminderDismissed,
    autoBackupDone,
    setAutoBackupDone,

    // Tema visual
    T,
    dark,
    setDark,

    // Divisas — tres niveles
    baseCurrency,
    setBaseCurrency,
    displayCurrency,
    setDisplayCurrency,
    rates, // tipos de cambio en tiempo real
    ratesStatus, // 'fresh' | 'stale' | 'error' | 'loading'
    ratesAgeText, // "hace 2h", "hace 1 día"...
    ratesOutdated, // true si >24h o error
    refreshRates, // función para forzar actualización
    fmtAccount, // helper de formato con conversión

    // Navegación
    tab,
    setTab,
    showCurrency,
    setShowCurrency,
    realAccountFilter,
    setRealAccountFilter,

    // Filtros persistidos de Gastos Reales
    realFilterType,
    setRealFilterType,
    realFilterAccount,
    setRealFilterAccount,
    realFilterCategory,
    setRealFilterCategory,
    realFilterDateMode,
    setRealFilterDateMode,
    realFilterPreset,
    setRealFilterPreset,
    realFilterDateFrom,
    setRealFilterDateFrom,
    realFilterDateTo,
    setRealFilterDateTo,

    // Datos y sus setters
    accounts,
    setAccounts,
    categories,
    setCategories,
    projections,
    setProjections,
    realExpenses,
    setRealExpenses,
    goals,
    setGoals,
    ignoredAlerts,
    setIgnoredAlerts,
    computedAlerts,

    // Derivados calculados
    forecastAll,
    forecastByAccount,
    accountWarnings,
    realBalanceMap,
    stats,

    // Importación bancaria
    bankFormats,
    setBankFormats,
    categoryRules,
    setCategoryRules,

    // Recurrentes
    recurringDuplicateWarnings,
    setRecurringDuplicateWarnings,
    showRecurringWarnings,
    setShowRecurringWarnings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── SecuritySettingsPanel ────────────────────────────────────────────────────
function SecuritySettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    security,
    updateInactivity,
    updateTotpGrace,
    updateEmail,
    sendCode,
    verifyCode,
    setupSecurity,
    unlock,
  } = useSecurityContext();

  const { T } = useApp();
  const toast = useToast();

  // ── Estado ajustes básicos ────────────────────────────────────────────────
  const [inactivityMs, setInactivityMs] = useState(security.inactivityMs);
  const [totpGraceMs, setTotpGraceMs] = useState(
    security.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS
  );

  // ── Estado email ──────────────────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState(security.email ?? '');
  const [emailStep, setEmailStep] = useState<'idle' | 'verifying'>('idle');
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  // ── Estado cambio de método ───────────────────────────────────────────────
  const [changeStep, setChangeStep] = useState<
    null | 'verify' | 'choose' | 'new-password' | 'new-totp'
  >(null);

  // Verificación del método actual
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Nuevo método elegido
  const [newAuthMethod, setNewAuthMethod] = useState<'password' | 'totp'>(
    'password'
  );

  // Nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);

  // Nuevo TOTP
  const [newTotpSecret] = useState<string>(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => chars[b % 32])
      .join('');
  });
  const [newTotpCode, setNewTotpCode] = useState('');
  const [newTotpVerified, setNewTotpVerified] = useState(false);
  const [newTotpError, setNewTotpError] = useState<string | null>(null);
  const [newTotpVerifying, setNewTotpVerifying] = useState(false);
  const [newTotpCopied, setNewTotpCopied] = useState(false);
  const [newTotpGraceMs, setNewTotpGraceMs] = useState(TOTP_GRACE_DEFAULT_MS);

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (changeStep) {
          setChangeStep(null);
          resetChangeState();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, changeStep]);

  // ── Reset estado de cambio ────────────────────────────────────────────────
  const resetChangeState = () => {
    setVerifyInput('');
    setVerifyError(null);
    setNewPassword('');
    setNewPassword2('');
    setNewPasswordError(null);
    setNewTotpCode('');
    setNewTotpVerified(false);
    setNewTotpError(null);
    setNewTotpCopied(false);
    setNewTotpGraceMs(TOTP_GRACE_DEFAULT_MS);
  };

  // ── Handlers ajustes básicos ──────────────────────────────────────────────
  const handleSaveInactivity = () => {
    updateInactivity(inactivityMs);
    toast('Tiempo de inactividad actualizado', 'success');
  };

  const handleSaveGrace = () => {
    updateTotpGrace(totpGraceMs);
    toast('Frecuencia de verificación actualizada', 'success');
  };

  // ── Handlers email ────────────────────────────────────────────────────────
  const handleSendEmailCode = async () => {
    if (!emailInput.trim()) {
      setEmailError('Introduce un email válido.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    const result = await sendCode(emailInput.trim());
    setEmailLoading(false);
    if (result.ok) {
      setEmailStep('verifying');
      setResendWait(60);
    } else {
      setEmailError(result.error ?? 'Error al enviar el código.');
    }
  };

  const handleVerifyEmailCode = () => {
    const result = verifyCode(emailCode.trim());
    if (result.ok) {
      updateEmail(emailInput.trim());
      setEmailStep('idle');
      setEmailError(null);
      toast('Email de recuperación actualizado', 'success');
    } else {
      setEmailError(result.error ?? 'Código incorrecto.');
    }
  };

  // ── Verificar método actual ───────────────────────────────────────────────
  const handleVerifyCurrent = async () => {
    if (!verifyInput.trim()) {
      setVerifyError('Introduce el código o contraseña actual.');
      return;
    }

    if (security.authMethod === 'password') {
      const ok = unlock(verifyInput.trim());
      if (ok) {
        // unlock desbloquea la app — necesitamos volver a bloquearla
        // pero en este contexto solo verificamos, no desbloqueamos
        setChangeStep('choose');
        setVerifyError(null);
      } else {
        setVerifyError('Contraseña incorrecta. Inténtalo de nuevo.');
      }
      return;
    }

    if (security.authMethod === 'totp') {
      setVerifyLoading(true);
      try {
        const ok = await verifyTOTP(
          security.totpSecret ?? '',
          verifyInput.trim()
        );
        if (ok) {
          setChangeStep('choose');
          setVerifyError(null);
        } else {
          setVerifyError('Código de verificación incorrecto.');
        }
      } catch {
        setVerifyError('Error al verificar el código.');
      } finally {
        setVerifyLoading(false);
      }
    }
  };

  // ── Verificar nuevo TOTP ──────────────────────────────────────────────────
  const handleVerifyNewTotp = async () => {
    if (newTotpVerifying) return;
    setNewTotpVerifying(true);
    setNewTotpError(null);
    try {
      const ok = await verifyTOTP(newTotpSecret, newTotpCode);
      if (ok) {
        setNewTotpVerified(true);
      } else {
        setNewTotpError(
          'Código incorrecto. Comprueba que la hora del dispositivo es correcta.'
        );
      }
    } catch {
      setNewTotpError('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setNewTotpVerifying(false);
    }
  };

  // ── Guardar cambio de método ──────────────────────────────────────────────
  const handleSaveMethodChange = () => {
    if (newAuthMethod === 'password') {
      if (newPassword.length < 8) {
        setNewPasswordError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (newPassword !== newPassword2) {
        setNewPasswordError('Las contraseñas no coinciden.');
        return;
      }
    }

    // Preservamos la frase y el email existentes
    setupSecurity({
      authMethod: newAuthMethod,
      password: newAuthMethod === 'password' ? newPassword : undefined,
      totpSecret: newAuthMethod === 'totp' ? newTotpSecret : undefined,
      totpGraceMs: newAuthMethod === 'totp' ? newTotpGraceMs : undefined,
      phrase: '', // no cambia
      email: security.email ?? undefined,
      forcePhraseHash: security.phraseHash ?? undefined,
      forcePhraseSalt: security.phraseSalt ?? undefined,
    });

    if (newAuthMethod === 'totp') {
      saveTotpLastUnlock();
    }

    toast(
      `Método de acceso cambiado a ${
        newAuthMethod === 'password'
          ? 'contraseña'
          : 'verificación en dos pasos'
      } correctamente`,
      'success'
    );
    setChangeStep(null);
    resetChangeState();
  };

  // ── Estilos ───────────────────────────────────────────────────────────────
  const sectionStyle: React.CSSProperties = {
    padding: '1.25rem',
    borderRadius: '1rem',
    background: T.pageBg,
    border: `1px solid ${T.cardBorder}`,
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: T.muted,
    marginBottom: '0.5rem',
    display: 'block',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.inputText,
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
    marginBottom: '0.75rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.inputText,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '0.75rem',
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: '0.6rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: T.accent,
    color: '#ffffff',
    fontSize: '0.825rem',
    fontWeight: 700,
    cursor: 'pointer',
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.625rem',
    background: T.redBg,
    border: `1px solid ${T.redBorder}`,
    color: T.red,
    fontSize: '0.775rem',
    marginBottom: '0.75rem',
  };

  // ── Render panel de cambio de método ──────────────────────────────────────
  if (changeStep) {
    return (
      <Modal
        title="🔄 Cambiar método de acceso"
        subtitle={
          changeStep === 'verify'
            ? 'Verifica tu identidad antes de continuar'
            : changeStep === 'choose'
            ? 'Elige el nuevo método de autenticación'
            : changeStep === 'new-password'
            ? 'Configura tu nueva contraseña'
            : 'Configura tu nueva app autenticadora'
        }
        onClose={() => {
          setChangeStep(null);
          resetChangeState();
        }}
        T={T}
      >
        {/* ── PASO 1: Verificar método actual ── */}
        {changeStep === 'verify' && (
          <div>
            {/* Info del método actual */}
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}33`,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>
                {security.authMethod === 'totp' ? '📱' : '🔑'}
              </span>
              <div>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  Método actual:{' '}
                  {security.authMethod === 'totp'
                    ? 'Código de verificación'
                    : 'Contraseña'}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: T.muted,
                    marginTop: '0.1rem',
                  }}
                >
                  {security.authMethod === 'totp'
                    ? 'Introduce el código de 6 dígitos de tu app de verificación'
                    : 'Introduce tu contraseña actual para confirmar el cambio'}
                </div>
              </div>
            </div>

            <input
              type={security.authMethod === 'password' ? 'password' : 'text'}
              placeholder={
                security.authMethod === 'password'
                  ? 'Contraseña actual'
                  : '000000'
              }
              value={verifyInput}
              onChange={(e) => {
                const val =
                  security.authMethod === 'totp'
                    ? e.target.value.replace(/\D/g, '').slice(0, 6)
                    : e.target.value;
                setVerifyInput(val);
                setVerifyError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCurrent()}
              maxLength={security.authMethod === 'totp' ? 6 : undefined}
              autoFocus
              style={{
                ...inputStyle,
                ...(security.authMethod === 'totp'
                  ? {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '0.3em',
                    }
                  : {}),
              }}
            />

            {verifyError && <div style={errorStyle}>⚠️ {verifyError}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleVerifyCurrent}
                disabled={verifyLoading || !verifyInput.trim()}
                style={{
                  ...saveBtnStyle,
                  flex: 1,
                  opacity: verifyLoading || !verifyInput.trim() ? 0.5 : 1,
                  cursor:
                    verifyLoading || !verifyInput.trim()
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {verifyLoading ? '⏳ Verificando...' : '✅ Verificar identidad'}
              </button>
              <button
                onClick={() => {
                  setChangeStep(null);
                  resetChangeState();
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Elegir nuevo método ── */}
        {changeStep === 'choose' && (
          <div>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                color: T.green,
                fontSize: '0.775rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              ✅ Identidad verificada correctamente
            </div>

            {/* Opción contraseña */}
            <div
              onClick={() => setNewAuthMethod('password')}
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                border: `2px solid ${
                  newAuthMethod === 'password' ? T.accent : T.cardBorder
                }`,
                background:
                  newAuthMethod === 'password' ? T.accentLight : T.pageBg,
                cursor:
                  security.authMethod === 'password'
                    ? 'not-allowed'
                    : 'pointer',
                marginBottom: '0.75rem',
                opacity: security.authMethod === 'password' ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🔑</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: T.title,
                      fontSize: '0.95rem',
                    }}
                  >
                    Contraseña clásica
                  </div>
                  <div
                    style={{
                      fontSize: '0.775rem',
                      color: T.muted,
                      marginTop: '0.2rem',
                    }}
                  >
                    {security.authMethod === 'password'
                      ? 'Método actual — elige otro'
                      : 'Protege tu app con una contraseña segura'}
                  </div>
                </div>
                {newAuthMethod === 'password' &&
                  security.authMethod !== 'password' && (
                    <Check
                      size={18}
                      color={T.accent}
                      style={{ flexShrink: 0 }}
                    />
                  )}
              </div>
            </div>

            {/* Opción TOTP */}
            <div
              onClick={() => setNewAuthMethod('totp')}
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                border: `2px solid ${
                  newAuthMethod === 'totp' ? T.accent : T.cardBorder
                }`,
                background: newAuthMethod === 'totp' ? T.accentLight : T.pageBg,
                cursor:
                  security.authMethod === 'totp' ? 'not-allowed' : 'pointer',
                marginBottom: '1.5rem',
                opacity: security.authMethod === 'totp' ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📱</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: T.title,
                      fontSize: '0.95rem',
                    }}
                  >
                    Verificación en dos pasos
                  </div>
                  <div
                    style={{
                      fontSize: '0.775rem',
                      color: T.muted,
                      marginTop: '0.2rem',
                    }}
                  >
                    {security.authMethod === 'totp'
                      ? 'Método actual — elige otro'
                      : 'Google Authenticator, Authy u otra app similar'}
                  </div>
                </div>
                {newAuthMethod === 'totp' && security.authMethod !== 'totp' && (
                  <Check size={18} color={T.accent} style={{ flexShrink: 0 }} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  if (newAuthMethod === security.authMethod) return;
                  setChangeStep(
                    newAuthMethod === 'password' ? 'new-password' : 'new-totp'
                  );
                }}
                disabled={newAuthMethod === security.authMethod}
                style={{
                  ...saveBtnStyle,
                  flex: 1,
                  opacity: newAuthMethod === security.authMethod ? 0.4 : 1,
                  cursor:
                    newAuthMethod === security.authMethod
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Continuar →
              </button>
              <button
                onClick={() => {
                  setChangeStep(null);
                  resetChangeState();
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3a: Nueva contraseña ── */}
        {changeStep === 'new-password' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPasswordError(null);
                }}
                autoFocus
                style={{ ...inputStyle, marginBottom: 0, paddingRight: '3rem' }}
              />
              <button
                onClick={() => setShowNewPassword((s) => !s)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: T.muted,
                  fontSize: '0.8rem',
                }}
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Indicador de fortaleza */}
            {newPassword.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      newPassword.length >= 12 &&
                      /[A-Z]/.test(newPassword) &&
                      /[0-9]/.test(newPassword) &&
                      /[^A-Za-z0-9]/.test(newPassword)
                        ? 4
                        : newPassword.length >= 10 &&
                          /[A-Z]/.test(newPassword) &&
                          /[0-9]/.test(newPassword)
                        ? 3
                        : newPassword.length >= 8
                        ? 2
                        : 1;
                    const colors = ['#dc2626', '#d97706', '#16a34a', '#2563eb'];
                    return (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: '0.25rem',
                          borderRadius: '9999px',
                          background:
                            level <= strength
                              ? colors[strength - 1]
                              : T.cardBorder,
                          transition: 'all 0.2s',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: T.muted }}>
                  {newPassword.length < 8
                    ? '⚠️ Muy corta'
                    : newPassword.length < 10
                    ? '✅ Aceptable'
                    : newPassword.length >= 12 &&
                      /[^A-Za-z0-9]/.test(newPassword)
                    ? '💪 Muy fuerte'
                    : '✅ Buena'}
                </div>
              </div>
            )}

            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Repite la nueva contraseña"
              value={newPassword2}
              onChange={(e) => {
                setNewPassword2(e.target.value);
                setNewPasswordError(null);
              }}
              style={inputStyle}
            />

            {newPassword2.length > 0 && newPassword !== newPassword2 && (
              <div style={{ ...errorStyle, marginTop: '-0.5rem' }}>
                ⚠️ Las contraseñas no coinciden
              </div>
            )}

            {newPasswordError && (
              <div style={errorStyle}>⚠️ {newPasswordError}</div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleSaveMethodChange}
                disabled={
                  newPassword.length < 8 || newPassword !== newPassword2
                }
                style={{
                  ...saveBtnStyle,
                  flex: 1,
                  background: T.green,
                  opacity:
                    newPassword.length < 8 || newPassword !== newPassword2
                      ? 0.5
                      : 1,
                  cursor:
                    newPassword.length < 8 || newPassword !== newPassword2
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                ✅ Guardar nueva contraseña
              </button>
              <button
                onClick={() => setChangeStep('choose')}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Atrás
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3b: Nuevo TOTP ── */}
        {changeStep === 'new-totp' &&
          (() => {
            const otpauthUrl = `otpauth://totp/${encodeURIComponent(
              'FinanzasHogar'
            )}:${encodeURIComponent(
              'usuario'
            )}?secret=${newTotpSecret}&issuer=${encodeURIComponent(
              'FinanzasHogar'
            )}&algorithm=SHA1&digits=6&period=30`;
            return (
              <div>
                {/* QR */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.875rem',
                      background: '#ffffff',
                      borderRadius: '1rem',
                      border: `2px solid ${T.cardBorder}`,
                      marginBottom: '0.75rem',
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        otpauthUrl
                      )}`}
                      alt="QR TOTP"
                      width={160}
                      height={160}
                      style={{ display: 'block', borderRadius: '0.5rem' }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      marginBottom: '0.5rem',
                      textAlign: 'center',
                    }}
                  >
                    ¿No puedes escanear el QR? Introduce el código manualmente:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.75rem',
                      background: T.pageBg,
                      border: `1.5px solid ${T.cardBorder}`,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <code
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        color: T.title,
                        letterSpacing: '0.1em',
                        wordBreak: 'break-all',
                      }}
                    >
                      {newTotpSecret}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newTotpSecret);
                        setNewTotpCopied(true);
                        setTimeout(() => setNewTotpCopied(false), 2000);
                      }}
                      style={{
                        padding: '0.3rem 0.625rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: newTotpCopied ? T.greenBg : T.cardBg,
                        color: newTotpCopied ? T.green : T.muted,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {newTotpCopied ? '✅ Copiado' : '📋 Copiar'}
                    </button>
                  </div>
                </div>

                {/* Verificación */}
                {!newTotpVerified ? (
                  <>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: T.body,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Introduce el código de 6 dígitos de tu app:
                    </div>
                    <input
                      type="text"
                      placeholder="000000"
                      value={newTotpCode}
                      onChange={(e) => {
                        setNewTotpCode(
                          e.target.value.replace(/\D/g, '').slice(0, 6)
                        );
                        setNewTotpError(null);
                      }}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleVerifyNewTotp()
                      }
                      maxLength={6}
                      autoFocus
                      style={{
                        ...inputStyle,
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '0.3em',
                      }}
                    />
                    {newTotpError && (
                      <div style={errorStyle}>⚠️ {newTotpError}</div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={handleVerifyNewTotp}
                        disabled={newTotpCode.length !== 6 || newTotpVerifying}
                        style={{
                          ...saveBtnStyle,
                          flex: 1,
                          opacity:
                            newTotpCode.length !== 6 || newTotpVerifying
                              ? 0.5
                              : 1,
                          cursor:
                            newTotpCode.length !== 6 || newTotpVerifying
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        {newTotpVerifying
                          ? '⏳ Verificando...'
                          : '✅ Verificar código'}
                      </button>
                      <button
                        onClick={() => setChangeStep('choose')}
                        style={{
                          padding: '0.6rem 1.25rem',
                          borderRadius: '0.75rem',
                          border: `1.5px solid ${T.cardBorder}`,
                          background: T.btnSecBg,
                          color: T.btnSecText,
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ← Atrás
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '1rem',
                        background: T.greenBg,
                        border: `1.5px solid ${T.greenBorder}`,
                        textAlign: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}
                      >
                        ✅
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: T.green,
                          fontSize: '0.9rem',
                        }}
                      >
                        Verificación en dos pasos configurada correctamente
                      </div>
                    </div>

                    {/* Selector período de gracia */}
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.875rem',
                        background: T.pageBg,
                        border: `1.5px solid ${T.cardBorder}`,
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em',
                          marginBottom: '0.5rem',
                        }}
                      >
                        ⏱️ ¿Cada cuánto pedir el código?
                      </div>
                      <select
                        value={newTotpGraceMs}
                        onChange={(e) =>
                          setNewTotpGraceMs(Number(e.target.value))
                        }
                        style={selectStyle}
                      >
                        {TOTP_GRACE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={handleSaveMethodChange}
                        style={{
                          ...saveBtnStyle,
                          flex: 1,
                          background: T.green,
                        }}
                      >
                        ✅ Activar TOTP como nuevo método
                      </button>
                      <button
                        onClick={() => setChangeStep('choose')}
                        style={{
                          padding: '0.6rem 1.25rem',
                          borderRadius: '0.75rem',
                          border: `1.5px solid ${T.cardBorder}`,
                          background: T.btnSecBg,
                          color: T.btnSecText,
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ← Atrás
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
      </Modal>
    );
  }

  // ── Render panel principal ────────────────────────────────────────────────
  return (
    <Modal
      title="⚙️ Ajustes de seguridad"
      subtitle="Personaliza cómo y cuándo se bloquea la app"
      onClose={onClose}
      T={T}
    >
      {/* ── Método de autenticación ── */}
      <div style={sectionStyle}>
        <span style={labelStyle}>🔐 Método de autenticación activo</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: T.accentLight,
            border: `1px solid ${T.accent}33`,
            marginBottom: '0.875rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>
            {security.authMethod === 'totp' ? '📱' : '🔑'}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.accent }}
            >
              {security.authMethod === 'totp'
                ? 'Verificación en dos pasos'
                : 'Contraseña clásica'}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            resetChangeState();
            setNewAuthMethod(
              security.authMethod === 'password' ? 'totp' : 'password'
            );
            setChangeStep('verify');
          }}
          style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: '0.75rem',
            border: `1.5px solid ${T.cardBorder}`,
            background: T.btnSecBg,
            color: T.btnSecText,
            fontSize: '0.825rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          🔄 Cambiar método de acceso
        </button>
      </div>

      {/* ── Frecuencia de verificación ── */}
      {security.authMethod === 'totp' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>⏱️ Frecuencia de verificación</span>
          <p
            style={{
              fontSize: '0.775rem',
              color: T.muted,
              marginBottom: '0.75rem',
              lineHeight: 1.5,
            }}
          >
            Si cierras y vuelves a abrir la app dentro de este tiempo, no te
            pedirá el Código de verificación.
          </p>
          <select
            value={totpGraceMs}
            onChange={(e) => setTotpGraceMs(Number(e.target.value))}
            style={selectStyle}
          >
            {TOTP_GRACE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              marginBottom: '0.75rem',
            }}
          >
            ⚙️ Valor actual:{' '}
            <strong style={{ color: T.body }}>
              {TOTP_GRACE_OPTIONS.find((o) => o.value === security.totpGraceMs)
                ?.label ?? 'No configurado'}
            </strong>
          </div>
          <button onClick={handleSaveGrace} style={saveBtnStyle}>
            ✅ Guardar período de gracia
          </button>
        </div>
      )}

      {/* ── Bloqueo por inactividad ── */}
      <div style={sectionStyle}>
        <span style={labelStyle}>💤 Bloqueo por inactividad</span>
        <p
          style={{
            fontSize: '0.775rem',
            color: T.muted,
            marginBottom: '0.75rem',
            lineHeight: 1.5,
          }}
        >
          La app se bloqueará automáticamente si no hay actividad durante este
          tiempo.
        </p>
        <select
          value={inactivityMs}
          onChange={(e) => setInactivityMs(Number(e.target.value))}
          style={selectStyle}
        >
          {INACTIVITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div
          style={{
            fontSize: '0.72rem',
            color: T.muted,
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
            marginBottom: '0.75rem',
          }}
        >
          ⚙️ Valor actual:{' '}
          <strong style={{ color: T.body }}>
            {INACTIVITY_OPTIONS.find((o) => o.value === security.inactivityMs)
              ?.label ?? 'No configurado'}
          </strong>
        </div>
        <button onClick={handleSaveInactivity} style={saveBtnStyle}>
          ✅ Guardar tiempo de inactividad
        </button>
      </div>

      {/* ── Email de recuperación ── */}
      <div style={sectionStyle}>
        <span style={labelStyle}>📧 Email de recuperación</span>
        <div
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: '0.625rem',
            background: security.emailVerified ? T.greenBg : T.amberBg,
            border: `1px solid ${
              security.emailVerified ? T.greenBorder : T.amberBorder
            }`,
            fontSize: '0.775rem',
            color: security.emailVerified ? T.green : T.amber,
            fontWeight: 600,
            marginBottom: '0.875rem',
          }}
        >
          {security.emailVerified
            ? `✅ Email verificado: ${security.email}`
            : '⚠️ No tienes email de recuperación configurado'}
        </div>

        {emailStep === 'idle' && (
          <>
            <input
              type="email"
              placeholder="tu@email.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailError(null);
              }}
              style={inputStyle}
            />
            {emailError && <div style={errorStyle}>⚠️ {emailError}</div>}
            <button
              onClick={handleSendEmailCode}
              disabled={emailLoading}
              style={{ ...saveBtnStyle, opacity: emailLoading ? 0.7 : 1 }}
            >
              {emailLoading
                ? '⏳ Enviando...'
                : '📧 Enviar código de verificación'}
            </button>
          </>
        )}

        {emailStep === 'verifying' && (
          <>
            <div
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                color: T.green,
                fontSize: '0.775rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}
            >
              ✅ Código enviado a <strong>{emailInput}</strong>
            </div>
            <input
              type="text"
              placeholder="000000"
              value={emailCode}
              onChange={(e) => {
                setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setEmailError(null);
              }}
              maxLength={6}
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.3em',
              }}
            />
            {emailError && <div style={errorStyle}>⚠️ {emailError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleVerifyEmailCode}
                disabled={emailCode.length !== 6}
                style={{
                  ...saveBtnStyle,
                  opacity: emailCode.length !== 6 ? 0.5 : 1,
                  cursor: emailCode.length !== 6 ? 'not-allowed' : 'pointer',
                }}
              >
                ✅ Verificar código
              </button>
              <button
                onClick={handleSendEmailCode}
                disabled={resendWait > 0 || emailLoading}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: resendWait > 0 ? 'not-allowed' : 'pointer',
                  opacity: resendWait > 0 ? 0.5 : 1,
                }}
              >
                {resendWait > 0 ? `Reenviar en ${resendWait}s` : '🔄 Reenviar'}
              </button>
              <button
                onClick={() => {
                  setEmailStep('idle');
                  setEmailError(null);
                  setEmailCode('');
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── LockScreen ───────────────────────────────────────────────────────────────
function LockScreen() {
  const { security, unlock, sendCode, verifyCode } = useSecurityContext();
  const T = LIGHT;

  // ── Estado local ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<
    | 'unlock'
    | 'recovery'
    | 'phrase'
    | 'file'
    | 'email-send'
    | 'email-verify'
    | 'new-password'
  >('unlock');

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phraseInput, setPhraseInput] = useState('');
  const [emailInput, setEmailInput] = useState(security.email ?? '');
  const [codeInput, setCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [resendWait, setResendWait] = useState(0);
  const { recoverWithPhrase } = useSecurityContext();
  const { recoverWithFile, validateRecoveryFile } = useSecurityContext();
  const [fileContent, setFileContent] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-desbloqueo si estamos dentro del Frecuencia de verificación
  useEffect(() => {
    if (
      security.authMethod === 'totp' &&
      isWithinTotpGrace(security.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS)
    ) {
      unlock('totp-grace');
    }
  }, []);

  // Cuenta atrás para reenvío de código
  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  // ── Desbloquear ───────────────────────────────────────────────────────────
  const handleUnlock = () => {
    if (!input.trim()) return;

    if (security.authMethod === 'totp') {
      verifyTOTP(security.totpSecret ?? '', input.trim())
        .then((ok) => {
          if (ok) {
            unlock(input.trim());
          } else {
            setError('Código de verificación incorrecto. Inténtalo de nuevo.');
            setInput('');
          }
        })
        .catch(() => {
          setError('Error al verificar el Código de verificación.');
          setInput('');
        });
      return;
    }

    const ok = unlock(input.trim());
    if (!ok) {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setInput('');
    }
  };

  // ── Recuperación con frase ────────────────────────────────────────────────
  const handlePhraseVerify = () => {
    if (newPassword !== newPassword2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    const ok = recoverWithPhrase(phraseInput, newPassword);
    if (!ok) {
      setError('La frase de recuperación no es correcta.');
    }
  };

  // ── Enviar código por email ───────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!emailInput.trim()) {
      setError('Introduce tu email.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await sendCode(emailInput.trim());
    setLoading(false);
    if (result.ok) {
      setStep('email-verify');
      setResendWait(60);
    } else {
      setError(result.error ?? 'Error al enviar el código.');
    }
  };

  // ── Verificar código email ────────────────────────────────────────────────
  const handleVerifyCode = () => {
    const result = verifyCode(codeInput.trim());
    if (result.ok) {
      setStep('new-password');
      setError(null);
    } else {
      setError(result.error ?? 'Código incorrecto.');
    }
  };

  // ── Estilos base ──────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    padding: '1.5rem',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '26rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '2rem',
    padding: '2.5rem 2rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    margin: '0 0 0.5rem',
    textAlign: 'center',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: '1.75rem',
    lineHeight: 1.5,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '0.875rem',
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  };

  const btnPrimaryStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '0.875rem',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '0.75rem',
  };

  const btnSecondaryStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.875rem',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#93c5fd',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '0.5rem',
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid rgba(220,38,38,0.3)',
    color: '#fca5a5',
    fontSize: '0.825rem',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  };

  // ── Pantalla de desbloqueo principal ──────────────────────────────────────
  if (step === 'unlock') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* Icono */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}
            >
              <Shield size={28} color="#fff" />
            </div>
            <h2 style={titleStyle}>App bloqueada</h2>
            <p style={subtitleStyle}>
              {security.authMethod === 'password'
                ? 'Introduce tu contraseña para continuar'
                : 'Introduce el código de tu app de verificación'}
            </p>
          </div>

          {/* Input principal */}
          <input
            type={security.authMethod === 'password' ? 'password' : 'text'}
            placeholder={
              security.authMethod === 'password' ? 'Contraseña' : '000000'
            }
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
            style={inputStyle}
            maxLength={security.authMethod === 'totp' ? 6 : undefined}
          />

          {/* Error */}
          {error && <div style={errorStyle}>⚠️ {error}</div>}

          {/* Botón desbloquear */}
          <button onClick={handleUnlock} style={btnPrimaryStyle}>
            🔓 Desbloquear
          </button>

          {/* Opciones de recuperación */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '1rem',
              marginTop: '0.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                textAlign: 'center',
                marginBottom: '0.75rem',
              }}
            >
              ¿Problemas para acceder?
            </p>
            <button
              onClick={() => {
                setStep('phrase');
                setError(null);
              }}
              style={btnSecondaryStyle}
            >
              🔑 Usar frase de recuperación
            </button>
            <button
              onClick={() => {
                setStep('file');
                setFileError(null);
                setFileContent('');
              }}
              style={btnSecondaryStyle}
            >
              📄 Usar fichero de recuperación
            </button>
            {security.email && (
              <button
                onClick={() => {
                  setStep('email-send');
                  setError(null);
                }}
                style={btnSecondaryStyle}
              >
                📧 Recuperar por email
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Recuperación con frase de 12 palabras ─────────────────────────────────
  if (step === 'phrase') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Frase de recuperación</h2>
          <p style={subtitleStyle}>
            Introduce tus 12 palabras de recuperación separadas por espacios
          </p>

          <textarea
            placeholder="palabra1 palabra2 palabra3 ... palabra12"
            value={phraseInput}
            onChange={(e) => {
              setPhraseInput(e.target.value);
              setError(null);
            }}
            style={{
              ...inputStyle,
              height: '6rem',
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          />

          {phraseInput.trim().split(/\s+/).filter(Boolean).length > 0 && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#93c5fd',
                marginBottom: '0.75rem',
              }}
            >
              {phraseInput.trim().split(/\s+/).filter(Boolean).length} / 12
              palabras
            </div>
          )}

          {step === 'phrase' &&
            phraseInput.trim().split(/\s+/).filter(Boolean).length === 12 && (
              <>
                <input
                  type="password"
                  placeholder="Nueva contraseña (mínimo 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  value={newPassword2}
                  onChange={(e) => {
                    setNewPassword2(e.target.value);
                    setError(null);
                  }}
                  style={inputStyle}
                />
              </>
            )}

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button
            onClick={handlePhraseVerify}
            disabled={
              phraseInput.trim().split(/\s+/).filter(Boolean).length !== 12
            }
            style={{
              ...btnPrimaryStyle,
              opacity:
                phraseInput.trim().split(/\s+/).filter(Boolean).length !== 12
                  ? 0.5
                  : 1,
              cursor:
                phraseInput.trim().split(/\s+/).filter(Boolean).length !== 12
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            ✅ Recuperar acceso
          </button>
          <button
            onClick={() => {
              setStep('unlock');
              setError(null);
            }}
            style={btnSecondaryStyle}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Recuperación con fichero ──────────────────────────────────────────────
  if (step === 'file') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Fichero de recuperación</h2>
          <p style={subtitleStyle}>
            Sube el fichero .json que descargaste al configurar la seguridad
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const content = ev.target?.result as string;
                try {
                  const parsed = JSON.parse(content);

                  // ← Validación inmediata al cargar el fichero
                  if (parsed.type !== 'fh-recovery') {
                    setFileError(
                      'El fichero no es un fichero de recuperación válido.'
                    );
                    setFileContent('');
                    return;
                  }
                  if (
                    !parsed.phraseHash ||
                    !parsed.phraseSalt ||
                    parsed.phraseHash !== security.phraseHash ||
                    parsed.phraseSalt !== security.phraseSalt
                  ) {
                    setFileError(
                      'Este fichero no corresponde a la configuración de seguridad actual. Usa el fichero más reciente.'
                    );
                    setFileContent('');
                    return;
                  }

                  // ← Solo si es válido mostramos los campos de nueva contraseña
                  setFileContent(content);
                  setFileError(null);
                } catch {
                  setFileError(
                    'No se pudo leer el fichero. Asegúrate de que es un .json válido.'
                  );
                  setFileContent('');
                }
              };
              reader.onerror = () =>
                setFileError('No se pudo leer el fichero.');
              reader.readAsText(file);
              e.target.value = '';
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...btnSecondaryStyle,
              color: fileContent ? '#16a34a' : '#93c5fd',
              borderColor: fileContent
                ? 'rgba(34,197,94,0.4)'
                : 'rgba(255,255,255,0.15)',
              marginBottom: '0.75rem',
            }}
          >
            {fileContent ? '✅ Fichero cargado' : '📂 Seleccionar fichero...'}
          </button>

          {fileContent && (
            <>
              <input
                type="password"
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFileError(null);
                }}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={newPassword2}
                onChange={(e) => {
                  setNewPassword2(e.target.value);
                  setFileError(null);
                }}
                style={inputStyle}
              />
            </>
          )}

          {fileError && <div style={errorStyle}>⚠️ {fileError}</div>}

          <button
            onClick={() => {
              if (newPassword !== newPassword2) {
                setFileError('Las contraseñas no coinciden.');
                return;
              }
              if (newPassword.length < 8) {
                setFileError('La contraseña debe tener al menos 8 caracteres.');
                return;
              }
              const ok = recoverWithFile(fileContent, newPassword);
              if (!ok) {
                setFileError(
                  'El fichero no es válido o no corresponde a esta app.'
                );
              }
            }}
            disabled={!fileContent}
            style={{
              ...btnPrimaryStyle,
              opacity: !fileContent ? 0.5 : 1,
              cursor: !fileContent ? 'not-allowed' : 'pointer',
            }}
          >
            ✅ Recuperar acceso
          </button>

          <button
            onClick={() => {
              setStep('unlock');
              setFileError(null);
              setFileContent('');
            }}
            style={btnSecondaryStyle}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Recuperación por email — enviar código ────────────────────────────────
  if (step === 'email-send') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Recuperación por email</h2>
          <p style={subtitleStyle}>
            Te enviaremos un código de verificación a tu email registrado
          </p>

          <input
            type="email"
            placeholder="Tu email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value);
              setError(null);
            }}
            style={inputStyle}
          />

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button
            onClick={handleSendCode}
            disabled={loading}
            style={{ ...btnPrimaryStyle, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Enviando...' : '📧 Enviar código'}
          </button>
          <button
            onClick={() => {
              setStep('unlock');
              setError(null);
            }}
            style={btnSecondaryStyle}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Recuperación por email — verificar código ─────────────────────────────
  if (step === 'email-verify') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Introduce el código</h2>
          <p style={subtitleStyle}>
            Hemos enviado un código de 6 dígitos a<br />
            <strong style={{ color: '#ffffff' }}>{emailInput}</strong>
          </p>

          <input
            type="text"
            placeholder="000000"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            autoFocus
            maxLength={6}
            style={{
              ...inputStyle,
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: '0.3em',
            }}
          />

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button
            onClick={handleVerifyCode}
            disabled={codeInput.length !== 6}
            style={{
              ...btnPrimaryStyle,
              opacity: codeInput.length !== 6 ? 0.5 : 1,
              cursor: codeInput.length !== 6 ? 'not-allowed' : 'pointer',
            }}
          >
            ✅ Verificar código
          </button>

          <button
            onClick={handleSendCode}
            disabled={resendWait > 0 || loading}
            style={{
              ...btnSecondaryStyle,
              opacity: resendWait > 0 ? 0.5 : 1,
              cursor: resendWait > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {resendWait > 0
              ? `Reenviar en ${resendWait}s`
              : '🔄 Reenviar código'}
          </button>

          <button
            onClick={() => {
              setStep('unlock');
              setError(null);
            }}
            style={btnSecondaryStyle}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Nueva contraseña tras verificación email ──────────────────────────────
  if (step === 'new-password') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Nueva contraseña</h2>
          <p style={subtitleStyle}>
            Email verificado correctamente. Establece tu nueva contraseña.
          </p>

          <input
            type="password"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Repite la nueva contraseña"
            value={newPassword2}
            onChange={(e) => {
              setNewPassword2(e.target.value);
              setError(null);
            }}
            style={inputStyle}
          />

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button
            onClick={() => {
              if (newPassword !== newPassword2) {
                setError('Las contraseñas no coinciden.');
                return;
              }
              if (newPassword.length < 8) {
                setError('La contraseña debe tener al menos 8 caracteres.');
                return;
              }
              // Restablecemos con la nueva contraseña
              const ok = recoverWithPhrase('', newPassword);
              // Si no tiene frase, forzamos el desbloqueo directamente
              unlock(newPassword);
            }}
            style={btnPrimaryStyle}
          >
            ✅ Guardar nueva contraseña
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── SecuritySetup ────────────────────────────────────────────────────────────
function SecuritySetup({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { setupSecurity, sendCode, verifyCode, generateRecoveryFile } =
    useSecurityContext();

  // ── Pasos del asistente ───────────────────────────────────────────────────
  // 1 → Elegir método de autenticación
  // 2 → Configurar contraseña o TOTP
  // 3 → Frase de recuperación (mostrar)
  // 4 → Confirmar frase (el usuario la reescribe)
  // 5 → Email opcional
  // 6 → Fichero de recuperación + resumen final

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;

  // Método elegido
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');

  // Contraseña
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Frase de recuperación
  const [phrase] = useState(() => generateRecoveryPhrase());
  const [phraseConfirm, setPhraseConfirm] = useState('');
  const [phraseCopied, setPhraseCopied] = useState(false);

  // Email
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  // Fichero de recuperación
  const [fileDownloaded, setFileDownloaded] = useState(false);
  const [pendingPhraseHash, setPendingPhraseHash] = useState<string | null>(
    null
  );
  const [pendingPhraseSalt, setPendingPhraseSalt] = useState<string | null>(
    null
  );

  // ── TOTP ──────────────────────────────────────────────────────────────────────
  // Generamos el secreto Base32 manualmente — sin depender de Secret()
  const [totpSecret] = useState<string>(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    // 32 caracteres Base32 = 160 bits → longitud estándar aceptada por
    // Google Authenticator, Authy y Microsoft Authenticator
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => chars[b % 32])
      .join('');
  });

  // Instancia TOTP construida con el secreto Base32 ya generado
  const [totpCode, setTotpCode] = useState('');
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpCopied, setTotpCopied] = useState(false);
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpGraceMs, setTotpGraceMs] = useState(TOTP_GRACE_DEFAULT_MS);

  const handleVerifyTotp = async () => {
    if (totpVerifying) return;
    setTotpVerifying(true);
    setTotpError(null);
    try {
      const ok = await verifyTOTP(totpSecret, totpCode);
      if (ok) {
        setTotpVerified(true);
        setTotpError(null);
      } else {
        setTotpError(
          'Código incorrecto. Comprueba que la hora de tu dispositivo es correcta.'
        );
      }
    } catch (err) {
      console.error('[TOTP]', err);
      setTotpError('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setTotpVerifying(false);
    }
  };

  // Errores generales
  const [error, setError] = useState<string | null>(null);

  // Cuenta atrás reenvío
  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  // ── Estilos base ──────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    padding: '1.5rem',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '30rem',
    background: '#ffffff',
    borderRadius: '2rem',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '2rem 2.25rem 2.25rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.375rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.03em',
    margin: '0 0 0.5rem',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.6,
    margin: '0 0 1.75rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  };

  const btnPrimaryStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '0.875rem',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.5rem',
  };

  const btnSecondaryStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.875rem',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '0.825rem',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  };

  // ── Validaciones por paso ─────────────────────────────────────────────────
  const canContinueStep2 = () => {
    if (authMethod === 'password') {
      if (password.length < 8) return false;
      if (password !== password2) return false;
    }
    if (authMethod === 'totp') {
      if (!totpVerified) return false; // ← No puede continuar sin verificar
    }
    return true;
  };

  const canContinueStep4 = () => {
    const typed = normalizePhrase(phraseConfirm);
    const original = normalizePhrase(phrase);
    return typed === original;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(phrase).then(() => setPhraseCopied(true));
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setEmailError('Introduce tu email.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    const result = await sendCode(email.trim());
    setEmailLoading(false);
    if (result.ok) {
      setEmailSent(true);
      setResendWait(60);
    } else {
      setEmailError(result.error ?? 'Error al enviar el email.');
    }
  };

  const handleVerifyEmail = () => {
    const result = verifyCode(emailCode.trim());
    if (result.ok) {
      setEmailVerified(true);
      setEmailError(null);
    } else {
      setEmailError(result.error ?? 'Código incorrecto.');
    }
  };

  const handleDownloadRecoveryFile = () => {
    // ← Generamos el hash de la frase aquí mismo, con los datos que tenemos
    // en este componente, sin depender de security.phraseHash (que aún es null)
    const phraseSalt = CryptoJS.lib.WordArray.random(16).toString();
    const phraseHash = CryptoJS.PBKDF2(normalizePhrase(phrase), phraseSalt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    const content = JSON.stringify({
      type: 'fh-recovery',
      version: '1.0',
      app: 'FinanzasHogar',
      createdAt: Date.now(),
      salt: CryptoJS.lib.WordArray.random(16).toString(),
      phraseHash,
      phraseSalt,
      authMethod,
    });

    // Guardamos los hashes para usarlos también en setupSecurity
    setPendingPhraseHash(phraseHash);
    setPendingPhraseSalt(phraseSalt);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `FinanzasHogar_recovery_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFileDownloaded(true);
  };

  const handleFinish = () => {
    setupSecurity({
      authMethod,
      password: authMethod === 'password' ? password : undefined,
      totpSecret: authMethod === 'totp' ? totpSecret : undefined, // ← faltaba
      totpGraceMs: authMethod === 'totp' ? totpGraceMs : undefined,
      phrase,
      email: emailVerified ? email : undefined,
      forcePhraseHash: pendingPhraseHash ?? undefined,
      forcePhraseSalt: pendingPhraseSalt ?? undefined,
    });
    // Guardamos la gracia seleccionada
    if (authMethod === 'totp') {
      saveTotpLastUnlock(); // primer acceso ya es válido
    }
    onComplete();
  };

  // ── Renderizado por paso ──────────────────────────────────────────────────

  // PASO 1 — Elegir método de autenticación
  const renderStep1 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔐</div>
      <h2 style={titleStyle}>Configura la seguridad</h2>
      <p style={subtitleStyle}>
        Elige cómo quieres proteger el acceso a tu app. Podrás cambiarlo
        después.
      </p>

      {/* Opción contraseña */}
      <div
        onClick={() => setAuthMethod('password')}
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: `2px solid ${
            authMethod === 'password' ? '#2563eb' : '#e2e8f0'
          }`,
          background: authMethod === 'password' ? '#eff6ff' : '#f8fafc',
          cursor: 'pointer',
          marginBottom: '0.75rem',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔑</span>
          <div>
            <div
              style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}
            >
              Contraseña clásica
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: '#64748b',
                marginTop: '0.2rem',
              }}
            >
              Crea una contraseña segura para proteger tu app
            </div>
          </div>
          {authMethod === 'password' && (
            <Check
              size={18}
              color="#2563eb"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      {/* Opción TOTP */}
      <div
        onClick={() => setAuthMethod('totp')}
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: `2px solid ${authMethod === 'totp' ? '#2563eb' : '#e2e8f0'}`,
          background: authMethod === 'totp' ? '#eff6ff' : '#f8fafc',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📱</span>
          <div>
            <div
              style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}
            >
              Verificación en dos pasos
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: '#64748b',
                marginTop: '0.2rem',
              }}
            >
              Usa Google Authenticator, Authy u otra app similar. Más seguro que
              una contraseña.
            </div>
          </div>
          {authMethod === 'totp' && (
            <Check
              size={18}
              color="#2563eb"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            />
          )}
        </div>
      </div>

      <button onClick={() => setStep(2)} style={btnPrimaryStyle}>
        Continuar →
      </button>
      <button
        onClick={onCancel}
        style={{
          ...btnSecondaryStyle,
          marginTop: '0.25rem',
          color: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'transparent',
          fontSize: '0.825rem',
        }}
      >
        Saltar por ahora →
      </button>
    </div>
  );

  // PASO 2 — Configurar TOTP
  const renderStep2Totp = () => {
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(
      'FinanzasHogar'
    )}:${encodeURIComponent(
      'usuario'
    )}?secret=${totpSecret}&issuer=${encodeURIComponent(
      'FinanzasHogar'
    )}&algorithm=SHA1&digits=6&period=30`;

    return (
      <div style={bodyStyle}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📱</div>
        <h2 style={titleStyle}>Configura la verificación en dos pasos</h2>
        <p style={subtitleStyle}>
          Escanea el QR con Google Authenticator, Authy u otra app similar.
          Después introduce el código de 6 dígitos para verificar.
        </p>

        {/* QR Code — generado con API gratuita */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              padding: '0.875rem',
              background: '#ffffff',
              borderRadius: '1rem',
              border: '2px solid #e2e8f0',
              marginBottom: '0.75rem',
              display: 'inline-block',
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                otpauthUrl
              )}`}
              alt="QR TOTP"
              width={160}
              height={160}
              style={{ display: 'block', borderRadius: '0.5rem' }}
            />
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
          >
            ¿No puedes escanear el QR? Introduce el código manualmente:
          </div>

          {/* Código secreto manual */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              borderRadius: '0.75rem',
              background: '#f1f5f9',
              border: '1.5px solid #e2e8f0',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: '0.25rem',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#0f172a',
                letterSpacing: '0.1em',
                wordBreak: 'break-all',
              }}
            >
              {totpSecret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(totpSecret);
                setTotpCopied(true);
                setTimeout(() => setTotpCopied(false), 2000);
              }}
              style={{
                padding: '0.3rem 0.625rem',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                background: totpCopied ? '#f0fdf4' : '#ffffff',
                color: totpCopied ? '#16a34a' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {totpCopied ? '✅ Copiado' : '📋 Copiar'}
            </button>
          </div>
        </div>

        {/* Verificación */}
        {!totpVerified ? (
          <>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.5rem',
              }}
            >
              Introduce el código de 6 dígitos de tu app:
            </div>
            <input
              type="text"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setTotpError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVerifyTotp();
                }
              }}
              maxLength={6}
              autoFocus
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.3em',
                marginBottom: '0.75rem',
              }}
            />

            {totpError && <div style={errorStyle}>⚠️ {totpError}</div>}

            <button
              onClick={handleVerifyTotp}
              disabled={totpCode.length !== 6 || totpVerifying}
              style={{
                ...btnPrimaryStyle,
                opacity: totpCode.length !== 6 || totpVerifying ? 0.5 : 1,
                cursor:
                  totpCode.length !== 6 || totpVerifying
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {totpVerifying ? '⏳ Verificando...' : '✅ Verificar código'}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                padding: '1rem',
                borderRadius: '1rem',
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                ✅
              </div>
              <div
                style={{
                  fontWeight: 800,
                  color: '#16a34a',
                  fontSize: '0.9rem',
                }}
              >
                Verificación en dos pasos configurada correctamente
              </div>
            </div>

            {/* Selector de período de gracia */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.875rem',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem',
                }}
              >
                ⏱️ ¿Cada cuánto pedir el código?
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  margin: '0 0 0.75rem',
                  lineHeight: 1.5,
                }}
              >
                Si cierras y vuelves a abrir la app dentro de este tiempo, no te
                pedirá el código.
              </p>
              <select
                value={totpGraceMs}
                onChange={(e) => setTotpGraceMs(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.875rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box' as const,
                }}
              >
                {TOTP_GRACE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {totpVerified && (
          <button
            onClick={() => setStep(3)}
            style={{ ...btnPrimaryStyle, marginTop: '0.75rem' }}
          >
            Continuar →
          </button>
        )}

        <button
          onClick={() => setStep(1)}
          style={{ ...btnSecondaryStyle, marginTop: '0.5rem' }}
        >
          ← Atrás
        </button>
      </div>
    );
  };

  // PASO 2 — Configurar contraseña
  const renderStep2Password = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔑</div>
      <h2 style={titleStyle}>Crea tu contraseña</h2>
      <p style={subtitleStyle}>
        Mínimo 8 caracteres. Usa letras, números y símbolos para mayor
        seguridad.
      </p>

      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          style={{ ...inputStyle, marginBottom: 0, paddingRight: '3rem' }}
        />
        <button
          onClick={() => setShowPassword((s) => !s)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '0.8rem',
          }}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Indicador de fortaleza */}
      {password.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div
            style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}
          >
            {[1, 2, 3, 4].map((level) => {
              const strength =
                password.length >= 12 &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
                  ? 4
                  : password.length >= 10 &&
                    /[A-Z]/.test(password) &&
                    /[0-9]/.test(password)
                  ? 3
                  : password.length >= 8
                  ? 2
                  : 1;
              const colors = ['#dc2626', '#d97706', '#16a34a', '#2563eb'];
              return (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    height: '0.25rem',
                    borderRadius: '9999px',
                    background:
                      level <= strength ? colors[strength - 1] : '#e2e8f0',
                    transition: 'all 0.2s',
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {password.length < 8
              ? '⚠️ Muy corta'
              : password.length < 10
              ? '✅ Aceptable'
              : password.length >= 12 && /[^A-Za-z0-9]/.test(password)
              ? '💪 Muy fuerte'
              : '✅ Buena'}
          </div>
        </div>
      )}

      <input
        type={showPassword ? 'text' : 'password'}
        placeholder="Repite la contraseña"
        value={password2}
        onChange={(e) => {
          setPassword2(e.target.value);
          setError(null);
        }}
        style={inputStyle}
      />

      {password2.length > 0 && password !== password2 && (
        <div style={{ ...errorStyle, marginTop: '-0.5rem' }}>
          ⚠️ Las contraseñas no coinciden
        </div>
      )}

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      <button
        onClick={() =>
          canContinueStep2()
            ? setStep(3)
            : setError('Revisa los campos antes de continuar.')
        }
        style={{
          ...btnPrimaryStyle,
          opacity: canContinueStep2() ? 1 : 0.5,
          cursor: canContinueStep2() ? 'pointer' : 'not-allowed',
        }}
      >
        Continuar →
      </button>
      <button onClick={() => setStep(1)} style={btnSecondaryStyle}>
        ← Atrás
      </button>
    </div>
  );

  // PASO 3 — Mostrar frase de recuperación
  const renderStep3 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
      <h2 style={titleStyle}>Tu frase de recuperación</h2>
      <p style={subtitleStyle}>
        Estas 12 palabras son la <strong>única forma</strong> de recuperar tu
        cuenta si olvidas tu contraseña. Guárdalas en un lugar seguro.
      </p>

      {/* Cuadrícula de palabras */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {phrase.split(' ').map((word, i) => (
          <div
            key={i}
            style={{
              padding: '0.5rem 0.625rem',
              borderRadius: '0.625rem',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                color: '#94a3b8',
                fontWeight: 700,
                minWidth: '1rem',
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {word}
            </span>
          </div>
        ))}
      </div>

      {/* Botón copiar */}
      <button
        onClick={handleCopyPhrase}
        style={{
          ...btnSecondaryStyle,
          marginTop: 0,
          marginBottom: '0.75rem',
          color: phraseCopied ? '#16a34a' : '#475569',
          borderColor: phraseCopied ? '#bbf7d0' : '#e2e8f0',
          background: phraseCopied ? '#f0fdf4' : '#f8fafc',
        }}
      >
        {phraseCopied ? '✅ Copiado al portapapeles' : '📋 Copiar frase'}
      </button>

      {/* Aviso importante */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          fontSize: '0.775rem',
          color: '#92400e',
          lineHeight: 1.6,
          marginBottom: '1rem',
        }}
      >
        ⚠️ <strong>Importante:</strong> Nunca compartas esta frase con nadie.
        Quien la tenga puede acceder a tu app. Guárdala fuera del ordenador
        (papel, gestor de contraseñas, etc.)
      </div>

      <button onClick={() => setStep(4)} style={btnPrimaryStyle}>
        Ya la he guardado → Continuar
      </button>
      <button onClick={() => setStep(2)} style={btnSecondaryStyle}>
        ← Atrás
      </button>
    </div>
  );

  // PASO 4 — Confirmar frase
  const renderStep4 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✍️</div>
      <h2 style={titleStyle}>Confirma la frase</h2>
      <p style={subtitleStyle}>
        Escribe las 12 palabras en el mismo orden para confirmar que las has
        guardado correctamente.
      </p>

      <textarea
        placeholder="palabra1 palabra2 palabra3 ... palabra12"
        value={phraseConfirm}
        onChange={(e) => {
          setPhraseConfirm(e.target.value);
          setError(null);
        }}
        style={{
          ...inputStyle,
          height: '6rem',
          resize: 'vertical',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      />

      {/* Contador de palabras */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          {phraseConfirm.trim().split(/\s+/).filter(Boolean).length} / 12
          palabras
        </span>
        {canContinueStep4() && (
          <span
            style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}
          >
            ✅ Frase correcta
          </span>
        )}
        {phraseConfirm.length > 0 &&
          !canContinueStep4() &&
          phraseConfirm.trim().split(/\s+/).filter(Boolean).length === 12 && (
            <span
              style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}
            >
              ❌ La frase no coincide
            </span>
          )}
      </div>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      <button
        onClick={() =>
          canContinueStep4()
            ? setStep(5)
            : setError('La frase no coincide con la que generamos. Revísala.')
        }
        style={{
          ...btnPrimaryStyle,
          opacity: canContinueStep4() ? 1 : 0.5,
          cursor: canContinueStep4() ? 'pointer' : 'not-allowed',
        }}
      >
        Continuar →
      </button>
      <button onClick={() => setStep(3)} style={btnSecondaryStyle}>
        ← Ver la frase de nuevo
      </button>
    </div>
  );

  // PASO 5 — Email opcional
  const renderStep5 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📧</div>
      <h2 style={titleStyle}>Email de recuperación</h2>
      <p style={subtitleStyle}>
        Opcional pero recomendado. Te permite recuperar el acceso si olvidas tu
        contraseña y tu frase de recuperación.
      </p>

      {!emailVerified ? (
        <>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
            disabled={emailSent}
            style={{
              ...inputStyle,
              opacity: emailSent ? 0.6 : 1,
            }}
          />

          {!emailSent ? (
            <button
              onClick={handleSendEmail}
              disabled={emailLoading || !email.trim()}
              style={{
                ...btnSecondaryStyle,
                marginTop: 0,
                marginBottom: '0.75rem',
                opacity: emailLoading || !email.trim() ? 0.5 : 1,
                cursor:
                  emailLoading || !email.trim() ? 'not-allowed' : 'pointer',
                color: '#2563eb',
                borderColor: '#bfdbfe',
                background: '#eff6ff',
              }}
            >
              {emailLoading
                ? '⏳ Enviando...'
                : '📧 Enviar código de verificación'}
            </button>
          ) : (
            <>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                }}
              >
                ✅ Código enviado a <strong>{email}</strong>. Revisa tu bandeja
                de entrada.
              </div>

              <input
                type="text"
                placeholder="Código de 6 dígitos"
                value={emailCode}
                onChange={(e) => {
                  setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setEmailError(null);
                }}
                maxLength={6}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.3em',
                }}
              />

              <button
                onClick={handleVerifyEmail}
                disabled={emailCode.length !== 6}
                style={{
                  ...btnSecondaryStyle,
                  marginTop: 0,
                  marginBottom: '0.5rem',
                  opacity: emailCode.length !== 6 ? 0.5 : 1,
                  cursor: emailCode.length !== 6 ? 'not-allowed' : 'pointer',
                  color: '#2563eb',
                  borderColor: '#bfdbfe',
                  background: '#eff6ff',
                }}
              >
                ✅ Verificar código
              </button>

              <button
                onClick={handleSendEmail}
                disabled={resendWait > 0 || emailLoading}
                style={{
                  ...btnSecondaryStyle,
                  opacity: resendWait > 0 ? 0.5 : 1,
                  cursor: resendWait > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {resendWait > 0
                  ? `Reenviar en ${resendWait}s`
                  : '🔄 Reenviar código'}
              </button>
            </>
          )}

          {emailError && <div style={errorStyle}>⚠️ {emailError}</div>}

          <div
            style={{
              height: '1px',
              background: '#e2e8f0',
              margin: '1rem 0',
            }}
          />

          <button
            onClick={() => setStep(6)}
            style={{
              ...btnSecondaryStyle,
              color: '#94a3b8',
              fontSize: '0.8rem',
            }}
          >
            Saltar este paso →
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              padding: '1rem',
              borderRadius: '1rem',
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
            <div
              style={{
                fontWeight: 800,
                color: '#16a34a',
                marginBottom: '0.25rem',
              }}
            >
              Email verificado correctamente
            </div>
            <div style={{ fontSize: '0.8rem', color: '#065f46' }}>{email}</div>
          </div>
          <button onClick={() => setStep(6)} style={btnPrimaryStyle}>
            Continuar →
          </button>
        </>
      )}

      <button onClick={() => setStep(4)} style={btnSecondaryStyle}>
        ← Atrás
      </button>
    </div>
  );

  // PASO 6 — Fichero de recuperación y resumen
  const renderStep6 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</div>
      <h2 style={titleStyle}>¡Todo listo!</h2>
      <p style={subtitleStyle}>
        Un último paso: descarga tu fichero de recuperación como copia de
        seguridad adicional.
      </p>

      {/* Resumen de lo configurado */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '1rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem',
          }}
        >
          Resumen de seguridad configurada
        </div>
        {[
          {
            icon: authMethod === 'password' ? '🔑' : '📱',
            label: 'Método de acceso',
            value:
              authMethod === 'password'
                ? 'Contraseña'
                : 'Código de verificación',
            ok: true,
          },
          {
            icon: '📝',
            label: 'Frase de recuperación',
            value: '12 palabras guardadas',
            ok: true,
          },
          {
            icon: '📧',
            label: 'Email de recuperación',
            value: emailVerified ? email : 'No configurado',
            ok: emailVerified,
          },
          {
            icon: '📄',
            label: 'Fichero de recuperación',
            value: fileDownloaded ? 'Descargado' : 'Pendiente de descargar',
            ok: fileDownloaded,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  color: '#334155',
                  fontWeight: 600,
                }}
              >
                {item.value}
              </div>
            </div>
            <span style={{ fontSize: '0.9rem' }}>{item.ok ? '✅' : '⚪'}</span>
          </div>
        ))}
      </div>

      {/* Descargar fichero de recuperación */}
      {!fileDownloaded ? (
        <>
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              fontSize: '0.775rem',
              color: '#92400e',
              lineHeight: 1.6,
              marginBottom: '0.75rem',
            }}
          >
            💡 El fichero de recuperación es un respaldo adicional. Guárdalo en
            un lugar seguro (USB, nube privada, etc.)
          </div>
          <button
            onClick={handleDownloadRecoveryFile}
            style={{
              ...btnSecondaryStyle,
              marginTop: 0,
              color: '#2563eb',
              borderColor: '#bfdbfe',
              background: '#eff6ff',
            }}
          >
            ⬇️ Descargar fichero de recuperación
          </button>
        </>
      ) : (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.875rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            fontSize: '0.8rem',
            marginBottom: '0.75rem',
            fontWeight: 600,
          }}
        >
          ✅ Fichero descargado correctamente
        </div>
      )}

      <button
        onClick={handleFinish}
        style={{
          ...btnPrimaryStyle,
          background: '#16a34a',
          marginTop: '0.75rem',
        }}
      >
        ✅ Activar seguridad y entrar
      </button>
    </div>
  );

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Barra de progreso */}
        <div style={{ height: '4px', background: '#e2e8f0' }}>
          <div
            style={{
              height: '100%',
              background: '#2563eb',
              width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Indicador de paso */}
        <div
          style={{
            padding: '0.875rem 2.25rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Configuración de seguridad
          </span>
          <span
            style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}
          >
            Paso {step} de {TOTAL_STEPS}
          </span>
        </div>

        {/* Contenido del paso */}
        {step === 1 && renderStep1()}
        {step === 2 && authMethod === 'password' && renderStep2Password()}
        {step === 2 && authMethod === 'totp' && renderStep2Totp()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  T,
  danger = true,
  confirmLabel = 'Eliminar', // 👈 nuevo: texto del botón confirmar
  checkboxLabel = null, // 👈 nuevo: si se pasa, muestra el checkbox
  checkboxValue = false, // 👈 nuevo: valor del checkbox
  onCheckboxChange = null, // 👈 nuevo: callback al cambiar el checkbox
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '1.5rem',
          boxShadow: T.cardShadowLg,
          width: '100%',
          maxWidth: '26rem',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            background: danger ? T.redBg : T.amberBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <AlertTriangle size={16} color={danger ? T.red : T.amber} />
        </div>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: T.title,
            margin: '0 0 0.4rem',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.825rem',
            color: T.muted,
            lineHeight: 1.5,
            margin: '0 0 1rem',
          }}
        >
          {message}
        </p>

        {/* ── Checkbox opcional ── */}
        {checkboxLabel && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1rem',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              background: T.accentLight,
              border: `1px solid ${T.accent}33`,
            }}
          >
            <input
              type="checkbox"
              checked={checkboxValue}
              onChange={(e) => onCheckboxChange?.(e.target.checked)}
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: T.accent,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.775rem',
                fontWeight: 600,
                color: T.accent,
                lineHeight: 1.4,
              }}
            >
              {checkboxLabel}
            </span>
          </label>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              background: danger ? T.red : T.amber,
              color: '#fff',
            }}
          >
            {confirmLabel} {/* 👈 antes era hardcoded "Eliminar" */}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.7rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.btnSecBorder}`,
              background: T.btnSecBg,
              color: T.btnSecText,
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
// Los componentes de UI siguen recibiendo props de presentación (T, onClick…).
// No necesitan el contexto porque no manejan datos de negocio.
function Modal({ title, subtitle, onClose, T, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: '4.5rem', // 👈 reducido de 6rem
        paddingBottom: '1rem',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto', // 👈 scroll en el overlay
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '1.5rem',
          boxShadow: T.cardShadowLg,
          width: '100%',
          maxWidth: '34rem',
          maxHeight: 'calc(100vh - 5.5rem)',
          overflowY: 'auto',

          animation: 'fadeSlideIn 0.2s ease both',
        }}
      >
        {' '}
        <div
          style={{
            padding: '1rem 1.5rem 0.75rem', // 👈 reducido
            borderBottom: `1px solid ${T.cardBorder}`,
          }}
        >
          {' '}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: T.title,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: T.muted,
                    marginTop: '0.25rem',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                padding: '0.4rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: T.btnSecBg,
                color: T.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: '1.125rem' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748b',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          style={{
            fontSize: '0.72rem',
            color: '#dc2626',
            marginTop: '0.35rem',
            fontWeight: 600,
          }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

function Input({ T, error, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: T.inputBg,
        border: `1.5px solid ${error ? T.errorText : T.inputBorder}`,
        borderRadius: '0.75rem',
        padding: '0.65rem 0.875rem',
        fontSize: '0.875rem',
        color: T.inputText,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={(e) =>
        (e.target.style.borderColor = error ? T.errorText : T.accent)
      }
      onBlur={(e) =>
        (e.target.style.borderColor = error ? T.errorText : T.inputBorder)
      }
    />
  );
}

function Sel({ T, children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        background: T.inputBg,
        border: `1.5px solid ${T.inputBorder}`,
        borderRadius: '0.75rem',
        padding: '0.65rem 0.875rem',
        fontSize: '0.875rem',
        color: T.inputText,
        outline: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  );
}

function PrimaryBtn({ onClick, children, fullWidth, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.25rem',
        borderRadius: '0.75rem',
        border: 'none',
        background: disabled ? '#93c5fd' : '#2563eb',
        color: '#fff',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '-0.01em',
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.125rem',
        borderRadius: '0.75rem',
        border: `1.5px solid ${T.btnSecBorder}`,
        background: T.btnSecBg,
        color: T.btnSecText,
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1rem',
        borderRadius: '0.75rem',
        border: `1.5px solid ${T.redBorder}`,
        background: T.redBg,
        color: T.red,
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, T, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        padding: '0.4rem 0.6rem',
        borderRadius: '0.5rem',
        border: 'none',
        background: 'transparent',
        color: color || T.muted,
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Badge({ type, T }) {
  const inc = type === 'income';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.68rem',
        fontWeight: 700,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        background: inc ? T.greenBg : T.redBg,
        color: inc ? T.green : T.red,
        border: `1px solid ${inc ? T.greenBorder : T.redBorder}`,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {inc ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {inc ? 'INGRESO' : 'GASTO'}
    </span>
  );
}

function Card({ children, T, style: extra }) {
  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: '1.25rem',
        boxShadow: T.cardShadow,
        overflow: 'hidden',
        ...extra,
      }}
    >
      {children}
    </div>
  );
}

function WarnBanner({ warnAccounts, T }) {
  if (!warnAccounts.length) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        background: T.amberBg,
        border: `1px solid ${T.amberBorder}`,
      }}
    >
      <AlertTriangle
        size={20}
        color={T.amber}
        style={{ flexShrink: 0, marginTop: '0.1rem' }}
      />
      <div>
        <div style={{ fontWeight: 700, color: T.amber, fontSize: '0.875rem' }}>
          Alerta de saldo mínimo
        </div>
        <div
          style={{
            fontSize: '0.825rem',
            color: T.amber,
            opacity: 0.85,
            marginTop: '0.2rem',
          }}
        >
          <strong>{warnAccounts.map((a) => a.name).join(', ')}</strong> podría
          caer por debajo del saldo mínimo configurado con las proyecciones
          actuales.
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedDateFormat, setSelectedDateFormat] = useState('dd/mm/yyyy');
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [incomeName, setIncomeName] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('Salario');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Vivienda / Alquiler');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [showSecurityStep, setShowSecurityStep] = useState(false);
  const pendingFinishData = useRef(null);
  const [openLegalDoc, setOpenLegalDoc] = useState<
    keyof typeof LEGAL_DOCS | null
  >(null);

  const T = LIGHT;

  // ── Paso de seguridad post-onboarding ─────────────────────────────────────
  if (showSecurityStep) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '2rem',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}
            >
              <Shield size={28} color="#fff" />
            </div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                margin: '0 0 0.5rem',
              }}
            >
              ¿Proteger tu app?
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#93c5fd',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Acabas de introducir tus datos financieros. Te recomendamos
              protegerlos con contraseña.
            </p>
          </div>

          <button
            onClick={() => {
              onFinish(pendingFinishData.current);
              localStorage.setItem('fh_open_security', 'true');
            }}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🛡️ Activar seguridad ahora</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Recomendado
            </span>
          </button>

          <button
            onClick={() => onFinish(pendingFinishData.current)}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Saltar por ahora →
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: '#475569',
              marginTop: '1.25rem',
            }}
          >
            Siempre podrás activarla desde el header de la app.
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla de bienvenida (step 0 especial) ───────────────────────────────
  if (step === 0 && step !== 1 && step !== 2) {
    return (
      <>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '32rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '3rem 2.5rem',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div
                style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '1.25rem',
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
                }}
              >
                <Shield size={28} color="#fff" />
              </div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.04em',
                  margin: '0 0 0.75rem',
                }}
              >
                Bienvenido a FinanzasHogar
              </h1>
              <p
                style={{
                  fontSize: '1rem',
                  color: '#93c5fd',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Tu app de finanzas personales. Simple, clara y siempre bajo tu
                control.
              </p>

              {/* ── Selector de divisa ── */}
              <div style={{ marginTop: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#93c5fd',
                    marginBottom: '0.375rem',
                    textAlign: 'center',
                  }}
                >
                  ¿En qué moneda gestionas tus finanzas?
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#cbd5e1',
                    textAlign: 'center',
                    margin: '0 0 0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  Esta será tu divisa principal. Podrás cambiarla después y
                  asignar una divisa diferente a cada cuenta.
                </p>

                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    border: '2px solid #3b82f6',
                    background: 'rgba(255,255,255,0.07)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option
                      key={c.code}
                      value={c.code}
                      style={{
                        background: '#1e3a5f',
                        color: '#ffffff',
                      }}
                    >
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>

                {/* ── Confirmación divisa seleccionada ── */}
                {(() => {
                  const selected = CURRENCIES.find(
                    (c) => c.code === selectedCurrency
                  );
                  return selected ? (
                    <div
                      style={{
                        marginTop: '0.625rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: '#60a5fa',
                      }}
                    >
                      <Check size={13} color="#60a5fa" />
                      <span>{selected.name} seleccionada</span>
                    </div>
                  ) : null;
                })()}

                {/* ── Selector de formato de fecha ── */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#93c5fd',
                      marginBottom: '0.375rem',
                      textAlign: 'center',
                    }}
                  >
                    ¿Cómo prefieres ver las fechas?
                  </div>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#cbd5e1',
                      textAlign: 'center',
                      margin: '0 0 0.875rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Elige el formato que uses habitualmente en tu país.
                  </p>

                  <select
                    value={selectedDateFormat}
                    onChange={(e) => setSelectedDateFormat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.875rem',
                      border: '2px solid #3b82f6',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      paddingRight: '2.5rem',
                    }}
                  >
                    {DATE_FORMATS.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        style={{ background: '#1e3a5f', color: '#ffffff' }}
                      >
                        {f.label} — ej: {f.example}
                      </option>
                    ))}
                  </select>

                  <div
                    style={{
                      marginTop: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: '#60a5fa',
                    }}
                  >
                    <Check size={13} color="#60a5fa" />
                    <span>
                      Las fechas se mostrarán como:{' '}
                      {DATE_FORMATS.find((f) => f.value === selectedDateFormat)
                        ?.example ?? ''}
                    </span>
                  </div>
                </div>

                {(() => {
                  const selected = CURRENCIES.find(
                    (c) => c.code === selectedCurrency
                  );
                  return selected ? (
                    <div
                      style={{
                        marginTop: '0.625rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: '#60a5fa',
                      }}
                    >
                      <Check size={13} color="#60a5fa" />
                      <span>{selected.name} seleccionada</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* ── Aceptación legal ── */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                  style={{
                    width: '1.125rem',
                    height: '1.125rem',
                    marginTop: '0.1rem',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.775rem',
                    color: '#cbd5e1',
                    lineHeight: 1.6,
                  }}
                >
                  He leído y acepto el{' '}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenLegalDoc('aviso');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.775rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Aviso Legal
                  </button>
                  {', la '}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenLegalDoc('privacidad');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.775rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Política de Privacidad
                  </button>
                  {', los '}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenLegalDoc('terminos');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.775rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Términos y Condiciones
                  </button>
                  {' y la '}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenLegalDoc('cookies');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.775rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Política de Cookies
                  </button>
                  {' de FinanzasHogar.'}
                </span>
              </label>

              {!legalAccepted && (
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: '#fca5a5',
                    marginTop: '0.5rem',
                    marginLeft: '1.875rem',
                    fontWeight: 600,
                  }}
                >
                  Debes aceptar los términos para continuar.
                </p>
              )}
            </div>

            {/* ── Botón principal ── */}
            <button
              onClick={() => {
                if (!legalAccepted) return;
                const cats = DEFAULT_CATEGORIES.map((c) => ({
                  ...c,
                  id: uid(),
                }));
                localStorage.setItem('fh_open_guide', 'true');
                onFinish({
                  accounts: [],
                  categories: cats,
                  projections: [],
                  baseCurrency: selectedCurrency,
                  dateFormat: selectedDateFormat,
                });
              }}
              disabled={!legalAccepted}
              style={{
                padding: '1rem 1.5rem',
                borderRadius: '1rem',
                border: 'none',
                background: legalAccepted ? '#2563eb' : '#1e3a5f',
                color: legalAccepted ? '#ffffff' : '#64748b',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: legalAccepted ? 'pointer' : 'not-allowed',
                width: '100%',
                boxShadow: legalAccepted
                  ? '0 4px 16px rgba(37,99,235,0.4)'
                  : 'none',
                opacity: legalAccepted ? 1 : 0.5,
                transition: 'all 0.2s',
                marginBottom: '1.25rem',
              }}
            >
              🚀 Empezar con FinanzasHogar →
            </button>

            {/* ── Nota de privacidad ── */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              🔒 Tus datos se guardan solo en tu dispositivo.
              <br />
              Nunca se envían a ningún servidor.
            </p>
          </div>
        </div>

        {openLegalDoc && (
          <LegalModal
            docKey={openLegalDoc}
            onClose={() => setOpenLegalDoc(null)}
          />
        )}
      </>
    );
  }
}

// ─── Contenido legal ─────────────────────────────────────────────────────────
const LEGAL_DOCS = {
  aviso: {
    title: 'Aviso Legal',
    emoji: '⚖️',
    content: [
      {
        heading: '1. Identificación del responsable',
        text: 'FinanzasHogar es un proyecto personal de software desarrollado con fines educativos y de uso personal. No constituye una empresa, entidad mercantil ni servicio comercial. No existe un CIF, domicilio social ni representante legal formal asociado a esta aplicación.',
      },
      {
        heading: '2. Naturaleza de la aplicación',
        text: 'FinanzasHogar es una aplicación web de gestión de finanzas personales que funciona íntegramente en el navegador del usuario. No dispone de servidores propios, bases de datos remotas ni infraestructura en la nube. Toda la información introducida por el usuario se almacena exclusivamente en el almacenamiento local (localStorage) de su propio dispositivo.',
      },
      {
        heading: '3. Carácter orientativo de la información',
        text: 'Las proyecciones, previsiones, tipos de cambio y cálculos que muestra la aplicación tienen un carácter meramente orientativo y no constituyen asesoramiento financiero, fiscal, legal ni de inversión. El responsable del proyecto no garantiza la exactitud, integridad ni idoneidad de la información para ningún propósito concreto.',
      },
      {
        heading: '4. Limitación de responsabilidad',
        text: 'El uso de FinanzasHogar es bajo la exclusiva responsabilidad del usuario. El responsable del proyecto no será liable por ningún daño directo, indirecto, incidental o consecuente derivado del uso o la imposibilidad de uso de la aplicación, incluyendo la pérdida de datos almacenados en el dispositivo del usuario.',
      },
      {
        heading: '5. Propiedad intelectual',
        text: 'El código fuente, diseño y contenidos de FinanzasHogar son propiedad del autor del proyecto. Queda prohibida su reproducción, distribución o modificación sin autorización expresa, salvo en los términos previstos por la licencia aplicable al proyecto.',
      },
      {
        heading: '6. Legislación aplicable',
        text: 'Este aviso legal se rige por la legislación española y europea vigente. Para cualquier controversia derivada del uso de la aplicación, las partes se someten a los juzgados y tribunales del domicilio del usuario, en la medida en que la ley aplicable así lo permita.',
      },
    ],
  },
  privacidad: {
    title: 'Política de Privacidad',
    emoji: '🔒',
    content: [
      {
        heading: '1. Responsable del tratamiento',
        text: 'FinanzasHogar es un proyecto personal sin entidad jurídica constituida. A efectos del Reglamento General de Protección de Datos (RGPD) de la Unión Europea, el responsable del tratamiento es el propio autor del proyecto, en calidad de persona física.',
      },
      {
        heading: '2. Qué datos se tratan y dónde se almacenan',
        text: 'FinanzasHogar NO recopila, transmite ni almacena ningún dato personal en servidores externos. Todos los datos que el usuario introduce en la aplicación (cuentas, saldos, categorías, proyecciones, movimientos) se guardan exclusivamente en el almacenamiento local (localStorage) del navegador del propio dispositivo del usuario. El autor del proyecto no tiene acceso en ningún momento a estos datos.',
      },
      {
        heading: '3. Finalidad del tratamiento',
        text: 'Los datos introducidos por el usuario se utilizan exclusivamente para proporcionar la funcionalidad de la aplicación: cálculo de saldos, proyecciones financieras, previsiones y estadísticas. No se utilizan para ninguna otra finalidad, incluyendo publicidad, análisis de mercado o comunicación con terceros.',
      },
      {
        heading: '4. Base legal del tratamiento',
        text: 'La base legal para el tratamiento de los datos es el consentimiento explícito del usuario, otorgado en el momento de aceptar estos términos durante el proceso de configuración inicial de la aplicación. El usuario puede retirar su consentimiento en cualquier momento eliminando los datos almacenados a través de las opciones de la propia aplicación o limpiando el almacenamiento local de su navegador.',
      },
      {
        heading: '5. Transferencias internacionales de datos',
        text: 'No se realizan transferencias internacionales de datos, ya que ningún dato abandona el dispositivo del usuario.',
      },
      {
        heading: '6. Derechos del usuario',
        text: 'En virtud del RGPD, el usuario tiene derecho de acceso, rectificación, supresión, limitación, portabilidad y oposición al tratamiento de sus datos. Dado que todos los datos están almacenados exclusivamente en el dispositivo del usuario, el ejercicio de estos derechos se realiza directamente desde la propia aplicación o mediante la limpieza del almacenamiento local del navegador.',
      },
      {
        heading: '7. Seguridad de los datos',
        text: 'Los datos almacenados en localStorage están sujetos a las medidas de seguridad implementadas por el propio navegador del usuario. Se recomienda encarecidamente utilizar la función de copias de seguridad de la aplicación y mantener el dispositivo protegido con contraseña.',
      },
      {
        heading: '8. Conservación de los datos',
        text: 'Los datos se conservan en el dispositivo del usuario indefinidamente hasta que este decida eliminarlos, ya sea mediante la función de reset de la aplicación o limpiando el almacenamiento local del navegador.',
      },
    ],
  },
  terminos: {
    title: 'Términos y Condiciones',
    emoji: '📋',
    content: [
      {
        heading: '1. Aceptación de los términos',
        text: 'El uso de FinanzasHogar implica la aceptación plena y sin reservas de los presentes términos y condiciones. Si no estás de acuerdo con alguno de ellos, debes abstenerte de utilizar la aplicación.',
      },
      {
        heading: '2. Descripción del servicio',
        text: 'FinanzasHogar es una aplicación web gratuita de gestión de finanzas personales que funciona íntegramente en el navegador del usuario, sin necesidad de registro ni conexión permanente a Internet. La aplicación ofrece funcionalidades de seguimiento de cuentas, proyecciones de ingresos y gastos, visualización de previsiones y registro de movimientos reales.',
      },
      {
        heading: '3. Uso permitido',
        text: 'La aplicación está destinada exclusivamente al uso personal y no comercial. El usuario se compromete a utilizar la aplicación de forma lícita, respetando la legislación vigente y los derechos de terceros. Queda prohibido cualquier uso fraudulento, abusivo o contrario a la buena fe.',
      },
      {
        heading: '4. Ausencia de asesoramiento financiero',
        text: 'FinanzasHogar no proporciona asesoramiento financiero, de inversión, fiscal ni legal. Toda la información mostrada por la aplicación, incluyendo proyecciones, previsiones y tipos de cambio, tiene carácter meramente orientativo. El usuario debe contrastar cualquier decisión financiera con profesionales cualificados.',
      },
      {
        heading: '5. Disponibilidad del servicio',
        text: 'Al ser una aplicación que funciona en el navegador del usuario, la disponibilidad depende del propio dispositivo y navegador. El autor del proyecto no garantiza la disponibilidad ininterrumpida ni se hace responsable de los fallos técnicos que puedan producirse en el dispositivo del usuario.',
      },
      {
        heading: '6. Responsabilidad sobre los datos',
        text: 'El usuario es el único responsable de los datos que introduce en la aplicación y de mantener copias de seguridad de los mismos. Se recomienda encarecidamente utilizar la función de exportación de copias de seguridad de forma regular para evitar la pérdida de datos.',
      },
      {
        heading: '7. Modificaciones',
        text: 'El autor del proyecto se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán efectivas desde el momento de su publicación en la aplicación. El uso continuado de la aplicación tras la publicación de las modificaciones implica la aceptación de las mismas.',
      },
      {
        heading: '8. Legislación aplicable y jurisdicción',
        text: 'Los presentes términos se rigen por la legislación española y el Reglamento General de Protección de Datos de la Unión Europea. Para la resolución de cualquier conflicto derivado del uso de la aplicación, las partes se someten a los juzgados y tribunales del domicilio del usuario.',
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies y Almacenamiento Local',
    emoji: '🍪',
    content: [
      {
        heading: '1. ¿Usa FinanzasHogar cookies?',
        text: 'FinanzasHogar NO utiliza cookies de ningún tipo — ni propias ni de terceros. No hay cookies de seguimiento, analíticas, publicitarias ni de sesión.',
      },
      {
        heading: '2. Qué es localStorage y cómo lo usa la aplicación',
        text: 'En lugar de cookies, FinanzasHogar utiliza localStorage, una tecnología estándar de los navegadores web que permite almacenar datos directamente en el dispositivo del usuario. A diferencia de las cookies, el contenido de localStorage nunca se envía automáticamente a ningún servidor — permanece siempre en tu dispositivo.',
      },
      {
        heading: '3. Datos almacenados en localStorage',
        text: 'FinanzasHogar almacena en localStorage los siguientes datos: configuración de cuentas y saldos, categorías de ingresos y gastos, proyecciones financieras, movimientos reales registrados, preferencias de visualización (tema oscuro/claro, divisa seleccionada) e historial de copias de seguridad internas. Ninguno de estos datos incluye información de identificación personal más allá de lo que el propio usuario introduce voluntariamente.',
      },
      {
        heading: '4. Claves de almacenamiento utilizadas',
        text: 'La aplicación utiliza las siguientes claves en localStorage: fh_accounts (cuentas), fh_categories (categorías), fh_projections (proyecciones), fh_real_expenses (movimientos reales), fh_dark (preferencia de tema), fh_currency (divisa de visualización), fh_base_currency (divisa base), fh_onboarded (estado de configuración inicial), fh_backup_history (historial de copias), fh_backup_reminder_days (frecuencia de recordatorios), fh_exchange_rates (tipos de cambio en caché) y fh_legal_accepted (registro de aceptación legal).',
      },
      {
        heading: '5. Cómo eliminar los datos almacenados',
        text: 'El usuario puede eliminar todos los datos almacenados por FinanzasHogar de varias formas: usando la función "Resetear aplicación" disponible en la propia app, limpiando el almacenamiento local desde las herramientas de desarrollador del navegador, o borrando los datos del sitio desde la configuración de privacidad del navegador.',
      },
      {
        heading: '6. Servicios de terceros',
        text: 'FinanzasHogar realiza consultas a APIs externas para obtener tipos de cambio actualizados (Frankfurter API y ExchangeRate-API). Estas consultas solo transmiten la petición de datos de tipos de cambio y no incluyen ningún dato personal del usuario. Los resultados se almacenan en caché en localStorage para minimizar las consultas externas.',
      },
    ],
  },
};

// ─── LegalModal ───────────────────────────────────────────────────────────────
function LegalModal({
  docKey,
  onClose,
}: {
  docKey: keyof typeof LEGAL_DOCS;
  onClose: () => void;
}) {
  const { T } = useApp();
  const doc = LEGAL_DOCS[docKey];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: '4.5rem',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '1.5rem',
          boxShadow: T.cardShadowLg,
          width: '100%',
          maxWidth: '44rem',
          maxHeight: 'calc(100vh - 5.5rem)',
          overflowY: 'auto',
          animation: 'fadeSlideIn 0.2s ease both',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${T.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: T.cardBg,
            zIndex: 1,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <span style={{ fontSize: '1.5rem' }}>{doc.emoji}</span>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {doc.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '0.625rem',
              border: 'none',
              background: T.btnSecBg,
              color: T.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '1.5rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: T.amberBg,
              border: `1px solid ${T.amberBorder}`,
              fontSize: '0.775rem',
              color: T.amber,
              fontWeight: 600,
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            ⚠️ Última actualización: {new Date().getFullYear()} · Proyecto
            personal sin entidad jurídica · Ámbito de aplicación: Unión Europea
            (RGPD)
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {doc.content.map((section, i) => (
              <div key={i}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: T.title,
                    margin: '0 0 0.5rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {section.heading}
                </h3>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: T.body,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          {/* Botón cerrar al final */}
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.875rem',
                border: `1.5px solid ${T.cardBorder}`,
                background: T.btnSecBg,
                color: T.btnSecText,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer legal ─────────────────────────────────────────────────────────────
function LegalFooter() {
  const { T } = useApp();
  const [openDoc, setOpenDoc] = useState<keyof typeof LEGAL_DOCS | null>(null);

  const links = [
    { key: 'aviso', label: 'Aviso Legal', emoji: '⚖️' },
    { key: 'privacidad', label: 'Privacidad', emoji: '🔒' },
    { key: 'terminos', label: 'Términos y Condiciones', emoji: '📋' },
    { key: 'cookies', label: 'Cookies y Almacenamiento', emoji: '🍪' },
  ] as const;

  return (
    <>
      <footer
        style={{
          borderTop: `1px solid ${T.cardBorder}`,
          background: T.headerBg,
          padding: '1.25rem 2rem',
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Marca */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
          >
            <Shield size={14} color={T.headerMuted} />
            <span
              style={{
                fontSize: '0.775rem',
                color: T.headerMuted,
                fontWeight: 600,
              }}
            >
              FinanzasHogar · Proyecto personal · {new Date().getFullYear()}
            </span>
          </div>

          {/* Links legales */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexWrap: 'wrap',
            }}
          >
            {links.map((link, i) => (
              <span
                key={link.key}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <button
                  onClick={() => setOpenDoc(link.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: T.headerMuted,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    transition: 'color 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = '#ffffff')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.headerMuted)
                  }
                >
                  {link.emoji} {link.label}
                </button>
                {i < links.length - 1 && (
                  <span
                    style={{
                      color: T.headerMuted,
                      opacity: 0.3,
                      fontSize: '0.75rem',
                    }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* Nota RGPD */}
          <div
            style={{ fontSize: '0.68rem', color: T.headerMuted, opacity: 0.6 }}
          >
            🔒 Datos almacenados solo en tu dispositivo · RGPD compliant
          </div>
        </div>
      </footer>

      {openDoc && (
        <LegalModal docKey={openDoc} onClose={() => setOpenDoc(null)} />
      )}
    </>
  );
}

// ─── Animaciones ──────────────────────────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes warnPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.2); }
  }

  @keyframes warnGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.15); }
    50%       { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
  }

  .fh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
    flex-shrink: 0;
  }
  .fh-btn:hover {
    transform: scale(1.1);
    filter: brightness(1.15);
  }
  .fh-btn:active {
    transform: scale(0.95);
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

document.head.appendChild(styleSheet);

// ─── App ──────────────────────────────────────────────────────────────────────
// App ahora es muy simple: solo monta el Provider y la estructura visual.
// No gestiona ningún dato — eso es responsabilidad de AppProvider.
export default function App() {
  const { isExpired } = useLicense();
  const [showActivation, setShowActivation] = useState(false);

  // ── Ruta del panel de administrador ───────────────────────
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (hash === '#admin') {
    return <AdminPanel />;
  }

  // ── Pantalla de expiración ─────────────────────────────────
  if (isExpired) {
    return (
      <>
        <ExpiredScreen onActivate={() => setShowActivation(true)} />
        {showActivation && (
          <ActivationModal onClose={() => setShowActivation(false)} />
        )}
      </>
    );
  }

  return (
    <ToastProvider>
      <SecurityProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </SecurityProvider>
    </ToastProvider>
  );
}

// ─── RatesStatusBar ───────────────────────────────────────────────────────────
function RatesStatusBar({ T }) {
  const { ratesStatus, ratesAgeText, ratesOutdated, refreshRates } = useApp();

  const configs = {
    fresh: {
      bg: T.greenBg,
      border: T.greenBorder,
      color: T.green,
      icon: '✅',
      text: 'Tipos de cambio actualizados',
      subtext: `Actualizado ${ratesAgeText}`,
    },
    stale: {
      bg: T.amberBg,
      border: T.amberBorder,
      color: T.amber,
      icon: '⚠️',
      text: 'Usando tipos de cambio aproximados',
      subtext:
        ratesAgeText !== '—'
          ? `Última actualización: ${ratesAgeText}. No se pudo conectar con el servidor.`
          : 'No se pudo conectar con el servidor. Usando valores aproximados.',
    },
    error: {
      bg: T.redBg,
      border: T.redBorder,
      color: T.red,
      icon: '⛔',
      text: 'Error al obtener tipos de cambio',
      subtext: 'Usando valores aproximados. Pulsa Actualizar para reintentar.',
    },
    loading: {
      bg: T.pageBg,
      border: T.cardBorder,
      color: T.muted,
      icon: '⏳',
      text: 'Actualizando tipos de cambio...',
      subtext: '',
    },
  };

  const cfg = configs[ratesStatus] ?? configs.loading;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderRadius: '0.875rem',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        marginBottom: '1.25rem',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{ fontSize: '0.875rem' }}>{cfg.icon}</span>
        <div>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: cfg.color,
            }}
          >
            {cfg.text}
          </div>
          {cfg.subtext && ratesStatus !== 'loading' && (
            <div
              style={{
                fontSize: '0.7rem',
                color: cfg.color,
                opacity: 0.75,
                marginTop: '0.1rem',
              }}
            >
              {cfg.subtext}
            </div>
          )}
        </div>
      </div>

      {/* Botón de refresh — solo si no está cargando */}
      {ratesStatus !== 'loading' && (
        <button
          onClick={refreshRates}
          title="Actualizar tipos de cambio"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '0.625rem',
            border: `1px solid ${cfg.border}`,
            background: 'transparent',
            color: cfg.color,
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          🔄 Actualizar
        </button>
      )}
    </div>
  );
}

// ─── FullRatesTable ────────────────────────────────────────────────────────────
function FullRatesTable({ onClose }: { onClose: () => void }) {
  const { T, rates, baseCurrency } = useApp();
  const [search, setSearch] = useState('');

  const rateFrom = rates[baseCurrency] ?? 1;

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      title="Tabla completa de tipos de cambio"
      subtitle={`Base: ${baseCurrency} · Datos orientativos`}
      onClose={onClose}
      T={T}
    >
      {/* Buscador */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar divisa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.65rem 0.875rem',
            borderRadius: '0.75rem',
            border: `1.5px solid ${T.inputBorder}`,
            background: T.inputBg,
            color: T.inputText,
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tabla */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1.5fr',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: T.tableHead,
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: T.muted,
          }}
        >
          <span>Divisa</span>
          <span style={{ textAlign: 'right' }}>Código</span>
          <span style={{ textAlign: 'right' }}>1 {baseCurrency} =</span>
        </div>

        {/* Filas */}
        {filtered.map((c, i) => {
          const rateTo = rates[c.code];
          if (!rateTo) return null;
          const convertedOne = (1 / rateFrom) * rateTo;
          return (
            <div
              key={c.code}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.625rem',
                background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                border: `1px solid ${T.tableBorder}`,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: T.body,
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.muted,
                  textAlign: 'right',
                }}
              >
                {c.symbol} {c.code}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: c.code === baseCurrency ? T.accent : T.title,
                  textAlign: 'right',
                }}
              >
                {convertedOne.toFixed(4)}
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: T.muted,
              fontSize: '0.875rem',
            }}
          >
            No se encontraron divisas con ese criterio
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '0.625rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.7rem',
          color: T.muted,
          lineHeight: 1.5,
        }}
      >
        ⚠️ Los tipos mostrados son orientativos y pueden diferir de los valores
        oficiales. Fuente: Frankfurter / ExchangeRate-API.
      </div>
    </Modal>
  );
}

// ─── RatesTable ───────────────────────────────────────────────────────────────
function RatesTable() {
  const { T, rates, baseCurrency, displayCurrency } = useApp();
  const [amount, setAmount] = useState('1');

  if (!rates || Object.keys(rates).length === 0) return null;

  const rateFrom = rates[baseCurrency] ?? 1;
  const rateTo = rates[displayCurrency] ?? 1;
  const convertedOne = (1 / rateFrom) * rateTo;
  const convertedAmount = (parseFloat(amount) || 0) * convertedOne;

  const fromCurrency = CURRENCIES.find((c) => c.code === baseCurrency);
  const toCurrency = CURRENCIES.find((c) => c.code === displayCurrency);

  const sameCurrency = baseCurrency === displayCurrency;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '0.875rem',
        background: T.pageBg,
        border: `1px solid ${T.cardBorder}`,
      }}
    >
      {/* Título */}
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: T.muted,
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        💱 Tipo de cambio aplicado
      </div>

      {sameCurrency ? (
        <div
          style={{
            fontSize: '0.8rem',
            color: T.muted,
            fontStyle: 'italic',
          }}
        >
          La divisa base y de visualización son iguales. No se aplica
          conversión.
        </div>
      ) : (
        <>
          {/* Par de divisas + tasa */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.875rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                1 {fromCurrency?.symbol} {baseCurrency}
              </span>
            </div>

            <span style={{ fontSize: '1.25rem', color: T.muted }}>→</span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}44`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.accent,
                }}
              >
                {convertedOne.toFixed(4)} {toCurrency?.symbol} {displayCurrency}
              </span>
            </div>
          </div>

          {/* Fórmula */}
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              marginBottom: '1rem',
              fontFamily: 'monospace',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: T.body }}>Fórmula:</strong> importe ÷{' '}
            {rateFrom.toFixed(4)} ({baseCurrency}/EUR) × {rateTo.toFixed(4)} (
            {displayCurrency}/EUR)
          </div>

          {/* Mini conversor */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            🧮 Conversor rápido
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flex: 1,
                minWidth: '8rem',
              }}
            >
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                {fromCurrency?.symbol} {baseCurrency}
              </span>
            </div>

            <span style={{ fontSize: '1rem', color: T.muted }}>＝</span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flex: 1,
                minWidth: '8rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}44`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.accent,
                }}
              >
                {convertedAmount.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.accent,
                  opacity: 0.75,
                }}
              >
                {toCurrency?.symbol} {displayCurrency}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// AppShell contiene la estructura visual (header, nav, main).
// Lee del contexto solo lo que necesita para renderizarse.
function AppShell() {
  const {
    T,
    dark,
    setDark,
    baseCurrency,
    setBaseCurrency,
    displayCurrency,
    setDisplayCurrency,
    dateFormat,
    setDateFormat,
    showCurrency,
    setShowCurrency,
    ratesOutdated,
    tab,
    setTab,
    accounts,
    categories,
    projections,
    forecastAll,
    forecastByAccount,
    accountWarnings,
    stats,
    onboarded,
    setOnboarded,
    setAccounts,
    setCategories,
    setProjections,
    resetApp,
    tourCompleted,
    setTourCompleted,
    tourIsFirstTime,
    setTourIsFirstTime,
    realExpenses,
    setRealExpenses,
    goals,
    computedAlerts,
    setCategoryRules,
    showRecurringWarnings,
    setShowRecurringWarnings,
    recurringDuplicateWarnings,
    setRecurringDuplicateWarnings,
    createBackup,
    downloadBackup,
    setGoals,
    setBankFormats,
  } = useApp();

  // ── Seguridad ──────────────────────────────────────────────────────────────
  const { isLocked, isConfigured, lock, clearSecurity } = useSecurityContext();
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetSelections, setResetSelections] = useState({
    realExpenses: false,
    projections: false,
    accounts: false,
    categories: false,
    goals: false,
    categoryRules: false,
    bankFormats: false,
  });
  const [resetDownloadBackup, setResetDownloadBackup] = useState(false);

  const [showFullRates, setShowFullRates] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openHelpSection, setOpenHelpSection] = useState('home');
  const [helpNavigatedAway, setHelpNavigatedAway] = useState(false);

  useEffect(() => {
    if (onboarded && !isConfigured) {
      const shouldOpen = localStorage.getItem('fh_open_security');
      if (shouldOpen === 'true') {
        localStorage.removeItem('fh_open_security');
        setShowSecuritySetup(true);
      }
    }
  }, [onboarded, isConfigured]);

  useEffect(() => {
    if (onboarded) {
      const shouldOpenGuide = localStorage.getItem('fh_open_guide');
      if (shouldOpenGuide === 'true') {
        localStorage.removeItem('fh_open_guide');
        setTimeout(() => {
          setOpenHelpSection('getting-started');
          setShowHelp(true);
        }, 500);
      }
    }
  }, [onboarded]);

  const pendingFullReset = useRef(false);

  const [showBackup, setShowBackup] = useState(false);

  useEffect(() => {
    if (!showReset && pendingFullReset.current) {
      pendingFullReset.current = false;
      // Limpiamos localStorage directamente para que el reload no recupere valores antiguos
      localStorage.removeItem('fh_tour_completed');
      localStorage.removeItem('fh_tour_first_time');
      localStorage.removeItem('fh_onboarded');
      setOnboarded(false);
      setTourCompleted(false);
      setTourIsFirstTime(false);
      clearSecurity();
    }
  }, [showReset]);

  const handleSelectiveReset = () => {
    // Siempre creamos backup en el historial antes de borrar
    const entry = createBackup('Copia previa al borrado selectivo');
    // Solo descargamos si el usuario lo pidió
    if (resetDownloadBackup) {
      downloadBackup(entry);
    }

    if (resetSelections.realExpenses) setRealExpenses([]);
    if (resetSelections.projections) setProjections([]);
    if (resetSelections.accounts) {
      setAccounts([]);
      // Al borrar todas las cuentas, también limpiamos los datos asociados
      // que no hayan sido borrados ya explícitamente
      if (!resetSelections.realExpenses) setRealExpenses([]);
      if (!resetSelections.projections) setProjections([]);
      if (!resetSelections.goals)
        setGoals(
          (prev) => prev.filter((g) => g.mode === 'manual') // solo conservamos los manuales
        );
    }
    if (resetSelections.categories) setCategories([]);
    if (resetSelections.goals) setGoals([]);
    if (resetSelections.categoryRules) setCategoryRules([]);
    if (resetSelections.bankFormats) setBankFormats([]);

    const fullReset =
      resetSelections.accounts &&
      resetSelections.categories &&
      resetSelections.projections &&
      resetSelections.realExpenses &&
      resetSelections.goals &&
      resetSelections.categoryRules &&
      resetSelections.bankFormats;

    if (fullReset) {
      pendingFullReset.current = true;
    }

    setResetDownloadBackup(false);
    setResetSelections({
      realExpenses: false,
      projections: false,
      accounts: false,
      categories: false,
      goals: false,
      categoryRules: false,
      bankFormats: false,
    });
    setShowReset(false);
  };

  const [pendingBaseCurrency, setPendingBaseCurrency] = useState<string | null>(
    null
  );

  const handleOnboardingFinish = ({
    accounts,
    categories,
    projections,
    realExpenses,
    categoryRules,
    baseCurrency: selectedBase,
    dateFormat: selectedDateFmt,
  }) => {
    setAccounts(accounts);
    setCategories(categories);
    setProjections(projections);
    if (realExpenses) setRealExpenses(realExpenses);
    if (categoryRules) setCategoryRules(categoryRules);
    if (selectedBase) {
      setBaseCurrency(selectedBase);
      setDisplayCurrency(selectedBase);
    }
    if (selectedDateFmt) {
      setDateFormat(selectedDateFmt);
    }
    setOnboarded(true);
  };

  // ── Tour de bienvenida ──────────────────────────────────────────
  if (!tourCompleted) {
    return (
      <WelcomeTour
        isFirstTime={tourIsFirstTime}
        onComplete={() => {
          setTourCompleted(true);
          setTourIsFirstTime(false);
        }}
      />
    );
  }

  // ── Pantalla de onboarding ────────────────────────────────────────────────
  if (!onboarded) {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  // ── Pantalla de configuración de seguridad ────────────────────────────────
  if (showSecuritySetup) {
    return (
      <SecuritySetup
        onComplete={() => setShowSecuritySetup(false)}
        onCancel={() => setShowSecuritySetup(false)}
      />
    );
  }

  // ── Pantalla de bloqueo ───────────────────────────────────────────────────
  if (isLocked && isConfigured) {
    return <LockScreen />;
  }

  // ── App normal ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.pageBg,
        fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
      }}
    >
      <header
        style={{
          background: T.headerBg,
          borderBottom: `1px solid ${T.headerBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0 0.75rem',
            }}
          >
            {/* Logo */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                }}
              >
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: T.headerText,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  FinanzasHogar
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: T.headerText,
                    marginTop: '0.2rem',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                  }}
                >
                  BANCA PERSONAL
                </div>
              </div>
            </div>

            {/* Botones de cabecera */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              {/* ── Botón seguridad / bloqueo ── */}
              {isConfigured ? (
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {/* Ajustes de seguridad */}
                  <button
                    onClick={() => setShowSecuritySettings(true)}
                    aria-label="Ajustes de seguridad"
                    title="Ajustes de seguridad"
                    className="fh-btn"
                    style={{ background: 'rgba(59,130,246,0.2)' }}
                  >
                    <Settings size={16} color="#3b82f6" />
                  </button>

                  {/* Bloquear */}
                  <button
                    onClick={lock}
                    aria-label="Bloquear aplicación"
                    title="Bloquear aplicación"
                    className="fh-btn"
                    style={{ background: 'rgba(34,197,94,0.2)' }}
                  >
                    <Shield size={16} color="#22c55e" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSecuritySetup(true)}
                  aria-label="Configurar seguridad"
                  title="Configurar seguridad"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(251,191,36,0.5)',
                    background: 'rgba(251,191,36,0.15)',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    transition: 'transform 0.2s ease, filter 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.filter = 'brightness(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <Shield size={14} color="#fbbf24" />
                  Activar seguridad
                </button>
              )}

              {/* Backup */}
              <button
                onClick={() => setShowBackup(true)}
                aria-label="Copias de seguridad"
                title="Copias de seguridad"
                className="fh-btn"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              >
                <Archive size={16} color="#8b5cf6" />
              </button>

              {/* Reset */}
              <button
                onClick={() => setShowReset(true)}
                aria-label="Resetear aplicación"
                title="Resetear aplicación"
                className="fh-btn"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>

              {/* Modo oscuro */}
              <button
                onClick={() => setDark(!dark)}
                aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
                className="fh-btn"
                style={{
                  background: dark
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(99,102,241,0.2)',
                }}
              >
                {dark ? (
                  <Sun size={16} color="#f59e0b" />
                ) : (
                  <Moon size={16} color="#6366f1" />
                )}
              </button>

              {/* Categorías */}
              <button
                onClick={() => setTab('categories')}
                aria-label="Categorías"
                title="Gestionar categorías"
                className="fh-btn"
                style={{
                  background:
                    tab === 'categories'
                      ? 'rgba(20,184,166,0.4)'
                      : 'rgba(20,184,166,0.2)',
                }}
              >
                <Tag size={16} color="#14b8a6" />
              </button>

              {/* Ayuda */}
              <button
                onClick={() => {
                  setOpenHelpSection('home');
                  setShowHelp(true);
                }}
                aria-label="Centro de ayuda"
                title="Centro de ayuda"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(168,85,247,0.2)',
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={16} color="#a855f7" />
              </button>

              {/* Divisas */}
              <button
                onClick={() => setShowCurrency(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.875rem',
                  borderRadius: '0.625rem',
                  border: `1px solid ${
                    ratesOutdated ? T.amber + '66' : T.headerBorder
                  }`,
                  background: ratesOutdated
                    ? 'rgba(217,119,6,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  color: T.headerText,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowLeftRight
                  size={14}
                  color={ratesOutdated ? T.amber : T.headerMuted}
                />

                <span style={{ color: T.headerMuted, fontSize: '0.72rem' }}>
                  {baseCurrency}
                </span>
                <span style={{ color: T.headerMuted, opacity: 0.4 }}>→</span>
                <span style={{ color: T.headerText }}>{displayCurrency}</span>
                {ratesOutdated && (
                  <span
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: T.amber,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                )}
                <ChevronDown size={14} color={T.headerMuted} />
              </button>
            </div>
          </div>

          {/* Navegación */}
          <nav style={{ display: 'flex', marginTop: '0.25rem' }}>
            {TABS.map((tab_) => {
              const Icon = tab_.icon;
              const active = tab === tab_.id;
              return (
                <button
                  key={tab_.id}
                  onClick={() => setTab(tab_.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? T.navActive : T.navInactive,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderBottom: active
                      ? `2px solid ${T.navActive}`
                      : '2px solid transparent',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  <Icon size={14} />
                  {tab_.label}
                  {tab_.id === 'accounts' && accounts.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                        marginLeft: '0.1rem',
                      }}
                    >
                      {accounts.length}
                    </span>
                  )}
                  {tab_.id === 'categories' && categories.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                        marginLeft: '0.1rem',
                      }}
                    >
                      {categories.length}
                    </span>
                  )}
                  {tab_.id === 'projections' && projections.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                        marginLeft: '0.1rem',
                      }}
                    >
                      {projections.length}
                    </span>
                  )}
                  {tab_.id === 'real' && realExpenses.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                        marginLeft: '0.1rem',
                      }}
                    >
                      {realExpenses.length}
                    </span>
                  )}
                  {tab_.id === 'goals' && goals.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                        marginLeft: '0.1rem',
                      }}
                    >
                      {goals.length}
                    </span>
                  )}
                  {tab_.id === 'alerts' && computedAlerts.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: computedAlerts.some(
                          (a) => a.severity === 'critical'
                        )
                          ? '#dc2626'
                          : computedAlerts.some((a) => a.severity === 'warning')
                          ? '#d97706'
                          : '#16a34a',
                        color: '#ffffff',
                        marginLeft: '0.1rem',
                        animation: computedAlerts.some(
                          (a) => a.severity === 'critical'
                        )
                          ? 'warnPulse 2s ease-in-out infinite'
                          : 'none',
                      }}
                    >
                      {computedAlerts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2.5rem 2rem',
          transition: 'padding-right 0.3s ease',
          paddingRight: showHelp && helpNavigatedAway ? '36rem' : '2rem',
        }}
      >
        <TrialBanner />
        <BackupReminderBanner onOpenBackup={() => setShowBackup(true)} />

        <div key={tab} style={{ animation: 'fadeSlideIn 0.25s ease both' }}>
          {tab === 'accounts' && <Accounts />}
          {tab === 'projections' && <Projections />}
          {tab === 'calendar' && <CalendarView />}
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'forecast' && <Forecast />}
          {tab === 'categories' && <Categories />}
          {tab === 'real' && <RealExpenses />}
          {tab === 'goals' && <Goals />}
          {tab === 'alerts' && <AlertsPanel />}
          {tab === 'trends' && <TrendsView />}
          {tab === 'reports' && <Reports />}
        </div>
      </main>

      {/* ── Modales ── */}
      {showCurrency && (
        <Modal
          title="Configuración de divisas"
          subtitle="Define tu divisa base y cómo visualizas los importes"
          onClose={() => setShowCurrency(false)}
          T={T}
        >
          <RatesStatusBar T={T} />
          <Field label="💾 Divisa base">
            <Sel
              T={T}
              value={baseCurrency}
              onChange={(e) => {
                const next = e.target.value;
                if (accounts.length > 0 && next !== baseCurrency) {
                  setPendingBaseCurrency(next);
                } else {
                  setBaseCurrency(next);
                }
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={`base-${c.code}`} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </Sel>
            <p
              style={{
                fontSize: '0.72rem',
                color: T.muted,
                marginTop: '0.5rem',
                lineHeight: 1.5,
              }}
            >
              Moneda en la que introduces tus datos. Cámbiala solo si empiezas
              desde cero.
            </p>
          </Field>
          <div
            style={{
              height: '1px',
              background: T.cardBorder,
              margin: '0.25rem 0 1.25rem',
            }}
          />
          <Field label="👁️ Divisa de visualización">
            <Sel
              T={T}
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={`display-${c.code}`} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </Sel>
            <p
              style={{
                fontSize: '0.72rem',
                color: T.muted,
                marginTop: '0.5rem',
                lineHeight: 1.5,
              }}
            >
              Todos los importes se mostrarán convertidos a esta moneda.
            </p>
          </Field>
          <div
            style={{
              height: '1px',
              background: T.cardBorder,
              margin: '0.25rem 0 1.25rem',
            }}
          />
          <Field label="📅 Formato de fecha">
            <Sel
              T={T}
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label} — ej: {f.example}
                </option>
              ))}
            </Sel>
            <p
              style={{
                fontSize: '0.72rem',
                color: T.muted,
                marginTop: '0.5rem',
                lineHeight: 1.5,
              }}
            >
              Elige cómo se muestran las fechas en toda la aplicación.
            </p>
          </Field>

          <button
            onClick={() => setShowFullRates(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.65rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.btnSecBg,
              color: T.btnSecText,
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '0.75rem',
            }}
          >
            📊 Ver tabla completa de tipos de cambio
          </button>
          <RatesTable />
          {pendingBaseCurrency && (
            <ConfirmModal
              T={T}
              danger={false}
              title="¿Cambiar divisa base?"
              message={`Vas a cambiar la divisa base de ${baseCurrency} a ${pendingBaseCurrency}. Esto afectará a cómo se interpretan los saldos de tus cuentas existentes. ¿Continuar?`}
              onConfirm={() => {
                setBaseCurrency(pendingBaseCurrency);
                setPendingBaseCurrency(null);
              }}
              onCancel={() => setPendingBaseCurrency(null)}
            />
          )}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
              fontSize: '0.72rem',
              color: T.muted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: T.body }}>⚠️ Aviso importante</strong>
            <br />
            Los tipos de cambio se obtienen de <strong>
              Frankfurter API
            </strong>{' '}
            y <strong>ExchangeRate-API</strong>. Las conversiones son{' '}
            <strong>meramente orientativas</strong>.
          </div>
        </Modal>
      )}

      {showFullRates && (
        <FullRatesTable onClose={() => setShowFullRates(false)} />
      )}
      {showBackup && <BackupPanel onClose={() => setShowBackup(false)} />}

      {showSecuritySettings && (
        <SecuritySettingsPanel onClose={() => setShowSecuritySettings(false)} />
      )}

      {/* ── Modal de duplicados recurrentes ── */}
      {showRecurringWarnings && recurringDuplicateWarnings.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.amberBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '28rem',
              padding: '1.75rem',
            }}
          >
            {/* Icono */}
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: T.amberBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                fontSize: '1.5rem',
              }}
            >
              ⚠️
            </div>

            {/* Título */}
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: T.title,
                margin: '0 0 0.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Posibles duplicados detectados
            </h3>

            <p
              style={{
                fontSize: '0.825rem',
                color: T.muted,
                lineHeight: 1.6,
                margin: '0 0 1rem',
              }}
            >
              Los siguientes cargos recurrentes no se han aplicado porque ya
              existe un movimiento similar este mes:
            </p>

            {/* Lista de duplicados */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              {recurringDuplicateWarnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    background: T.amberBg,
                    border: `1px solid ${T.amberBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        color: T.title,
                      }}
                    >
                      🔄 {w.projectionName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: T.amber,
                        marginTop: '0.1rem',
                      }}
                    >
                      {w.monthKey}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.925rem',
                      fontWeight: 800,
                      color: T.amber,
                      whiteSpace: 'nowrap' as const,
                      flexShrink: 0,
                    }}
                  >
                    {w.amount.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {w.currency}
                  </div>
                </div>
              ))}
            </div>

            {/* Explicación */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
                fontSize: '0.775rem',
                color: T.muted,
                lineHeight: 1.5,
                marginBottom: '1.25rem',
              }}
            >
              💡 Si crees que es un error, revisa tus proyecciones de este mes y
              elimina el posible duplicado manualmente antes de que el sistema
              vuelva a intentarlo el próximo mes.
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => {
                setShowRecurringWarnings(false);
                setRecurringDuplicateWarnings([]);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: T.amber,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showReset &&
        (() => {
          const allSelected = Object.values(resetSelections).every(Boolean);
          const anySelected = Object.values(resetSelections).some(Boolean);

          const toggleAll = (checked) => {
            setResetSelections({
              realExpenses: checked,
              projections: checked,
              accounts: checked,
              categories: checked,
              goals: checked,
              categoryRules: checked,
              bankFormats: checked,
            });
          };

          const ITEMS = [
            { key: 'accounts', label: '🏦 Cuentas bancarias' },
            { key: 'realExpenses', label: '🧾 Gastos reales' },
            { key: 'projections', label: '📈 Proyecciones' },
            { key: 'categories', label: '🏷️ Categorías' },
            { key: 'goals', label: '🎯 Objetivos de ahorro' },
            { key: 'categoryRules', label: '📋 Reglas de categorización' },
            {
              key: 'bankFormats',
              label: '⚙️ Formatos bancarios personalizados',
            },
          ];

          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: '1.5rem',
                  boxShadow: T.cardShadowLg,
                  width: '100%',
                  maxWidth: '30rem',
                  padding: '1.75rem',
                }}
              >
                {/* Icono y título */}
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: T.redBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Trash2 size={16} color={T.red} />
                </div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: T.title,
                    margin: '0 0 0.4rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Borrado selectivo de datos
                </h3>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: T.muted,
                    lineHeight: 1.5,
                    margin: '0 0 1.25rem',
                  }}
                >
                  Elige qué datos quieres eliminar. Esta acción{' '}
                  <strong>no se puede deshacer</strong>, pero siempre puedes
                  restaurar desde una copia de seguridad.
                </p>

                {/* Checkbox "Todo" */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    background: allSelected ? T.redBg : T.pageBg,
                    border: `1.5px solid ${
                      allSelected ? T.redBorder : T.cardBorder
                    }`,
                    cursor: 'pointer',
                    marginBottom: '0.625rem',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: T.red,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      color: allSelected ? T.red : T.title,
                    }}
                  >
                    Seleccionar todo
                  </span>
                </label>

                {/* Separador */}
                <div
                  style={{
                    height: '1px',
                    background: T.cardBorder,
                    margin: '0.625rem 0',
                  }}
                />

                {/* Checkboxes individuales */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {ITEMS.map((item) => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 1rem',
                        borderRadius: '0.75rem',
                        background: resetSelections[item.key]
                          ? T.redBg
                          : T.pageBg,
                        border: `1px solid ${
                          resetSelections[item.key] ? T.redBorder : T.cardBorder
                        }`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={resetSelections[item.key]}
                        onChange={(e) =>
                          setResetSelections((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: T.red,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: resetSelections[item.key] ? T.red : T.body,
                        }}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Checkbox backup previo */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.875rem',
                    background: T.accentLight,
                    border: `1px solid ${T.accent}33`,
                    cursor: 'pointer',
                    marginBottom: '1.25rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={resetDownloadBackup}
                    onChange={(e) => setResetDownloadBackup(e.target.checked)}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: T.accent,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      color: T.accent,
                      lineHeight: 1.4,
                    }}
                  >
                    💾 Descargar copia de seguridad antes de borrar
                  </span>
                </label>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleSelectiveReset}
                    disabled={!anySelected}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: anySelected ? 'pointer' : 'not-allowed',
                      background: anySelected ? T.red : T.cardBorder,
                      color: anySelected ? '#fff' : T.muted,
                      opacity: anySelected ? 1 : 0.6,
                      transition: 'all 0.15s',
                    }}
                  >
                    🗑️ Borrar seleccionado
                  </button>
                  <button
                    onClick={() => {
                      setShowReset(false);
                      setResetSelections({
                        realExpenses: false,
                        projections: false,
                        accounts: false,
                        categories: false,
                        goals: false,
                        categoryRules: false,
                        bankFormats: false,
                      });
                      setResetDownloadBackup(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${T.btnSecBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {showHelp && (
        <HelpCenter
          T={T}
          onClose={() => {
            setShowHelp(false);
            setHelpNavigatedAway(false);
          }}
          onRestartTour={() => {
            setTourCompleted(false);
            setTourIsFirstTime(false);
          }}
          onNavigate={(tab) => {
            setTab(tab);
            setShowHelp(false);
          }}
          onNavigateKeepOpen={(tab) => {
            setTab(tab);
            setHelpNavigatedAway(true);
          }}
          onOpenSecurity={() => {
            setShowHelp(false);
            setShowSecuritySetup(true);
          }}
          onOpenBackup={() => {
            setShowHelp(false);
            setShowBackup(true);
          }}
          initialSection={openHelpSection}
        />
      )}

      <LegalFooter />
    </div>
  );
}

// ─── BackupReminderBanner ─────────────────────────────────────────────────────
function BackupReminderBanner({ onOpenBackup }: { onOpenBackup: () => void }) {
  const {
    T,
    backupHistory,
    backupReminderDays,
    setBackupReminderDays,
    backupReminderDismissed,
    setBackupReminderDismissed,
    autoBackupDone,
    setAutoBackupDone,
    downloadBackup,
  } = useApp();

  const toast = useToast();
  const [showInfo, setShowInfo] = useState(true);

  // ── Cálculos de tiempo ────────────────────────────────────────────────────
  const lastBackupTimestamp = backupHistory[0]?.timestamp ?? 0;

  const daysSinceBackup =
    lastBackupTimestamp > 0
      ? Math.floor((Date.now() - lastBackupTimestamp) / (1000 * 60 * 60 * 24))
      : null;

  const daysSinceDismissed =
    backupReminderDismissed > 0
      ? Math.floor(
          (Date.now() - backupReminderDismissed) / (1000 * 60 * 60 * 24)
        )
      : null;

  const neverBackedUp = lastBackupTimestamp === 0;
  const backupIsOld =
    daysSinceBackup !== null && daysSinceBackup >= backupReminderDays;
  const recentlyDismissed =
    daysSinceDismissed !== null && daysSinceDismissed < backupReminderDays;

  // ── ¿Qué modo mostrar? ────────────────────────────────────────────────────
  // Modo POSITIVO: se acaba de hacer backup automático → verde informativo
  // Modo ALERTA:   nunca se ha hecho backup o está desactualizado → rojo/ámbar
  // Nada:          todo correcto y sin eventos recientes → banner oculto
  const showPositive = autoBackupDone;
  const showAlert =
    !autoBackupDone && !recentlyDismissed && (neverBackedUp || backupIsOld);

  if (!showPositive && !showAlert) return null;

  // ── Colores según modo ────────────────────────────────────────────────────
  const color = showPositive ? T.amber : T.red;
  const bgColor = showPositive ? T.amberBg : T.redBg;
  const border = showPositive ? T.amberBorder : T.redBorder;

  // ── Textos según modo ─────────────────────────────────────────────────────
  const title = showPositive
    ? '✅ Copia de seguridad automática creada'
    : neverBackedUp
    ? '⚠️ Aún no tienes ninguna copia de seguridad'
    : `⚠️ Han pasado ${daysSinceBackup} días desde tu última copia`;

  const subtitle = showPositive
    ? `Hemos guardado automáticamente una copia en el historial (${
        backupHistory[0]?.accountsCount ?? 0
      } cuentas · ${backupHistory[0]?.projectionsCount ?? 0} proyecciones · ${
        backupHistory[0]?.realExpensesCount ?? 0
      } movimientos · ${backupHistory[0]?.goalsCount ?? 0} objetivos).`
    : neverBackedUp
    ? 'Si algo falla en el navegador o cambias de dispositivo, perderías todos tus datos.'
    : `El historial interno está guardado, pero te recomendamos tener también una copia en tu ordenador.`;

  const handleClose = () => {
    if (showPositive) setAutoBackupDone(false);
    else setBackupReminderDismissed(Date.now());
  };

  return (
    <div
      style={{
        margin: '0 0 1.5rem',
        borderRadius: '1rem',
        background: bgColor,
        border: `1.5px solid ${border}`,
        overflow: 'hidden',
        animation: 'fadeSlideIn 0.4s ease both',
      }}
    >
      {/* ── Fila principal ── */}
      <div
        style={{
          padding: '0.875rem 1.125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Icono */}
        <span
          style={{
            fontSize: '1.25rem',
            flexShrink: 0,
            display: 'inline-block',
            animation: !showPositive
              ? 'warnPulse 2s ease-in-out infinite'
              : 'none',
          }}
        >
          {showPositive ? '💾' : '🔴'}
        </span>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color,
              marginBottom: '0.15rem',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color,
              opacity: 0.85,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Selector de período — solo en modo alerta */}
        {!showPositive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                color,
                opacity: 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              Recordar cada:
            </span>
            <select
              value={backupReminderDays}
              onChange={(e) => setBackupReminderDays(Number(e.target.value))}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.5rem',
                border: `1px solid ${border}`,
                background: bgColor,
                color,
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={7}>7 días</option>
              <option value={14}>14 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {/* Descargar — siempre disponible */}
          {backupHistory.length > 0 && (
            <button
              onClick={() => {
                downloadBackup(backupHistory[0]);
                toast('Copia descargada en tu ordenador', 'success');
                handleClose();
              }}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: color,
                color: '#ffffff',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⬇️ Descargar ahora
            </button>
          )}

          {/* Ver historial */}
          <button
            onClick={() => {
              onOpenBackup();
              handleClose();
            }}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: `1.5px solid ${border}`,
              background: 'transparent',
              color,
              fontSize: '0.775rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            📂 Ver historial
          </button>

          {/* Cerrar */}
          <button
            onClick={handleClose}
            title="Cerrar este aviso"
            style={{
              padding: '0.5rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${border}`,
              background: 'transparent',
              color,
              fontSize: '0.8rem',
              cursor: 'pointer',
              opacity: 0.6,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Panel INFO plegable ── */}
      {showInfo && (
        <div
          style={{
            padding: '0.875rem 1.25rem 1rem',
            borderTop: `1px solid ${border}`,
            background: showPositive
              ? 'rgba(217,119,6,0.06)'
              : 'rgba(220,38,38,0.06)',
            animation: 'fadeSlideIn 0.2s ease both',
          }}
        >
          {/* Título del panel INFO */}
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color,
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                animation: 'warnPulse 2s ease-in-out infinite',
              }}
            >
              ⚠️
            </span>
            ¿Por qué es importante descargar la copia a tu ordenador?
          </div>

          {/* Lista de 4 riesgos */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '0.875rem',
            }}
          >
            {[
              {
                icon: '🧹',
                title: 'Limpieza del navegador',
                text: 'Si limpias el historial, cookies o caché del navegador, el historial de copias desaparecería para siempre.',
              },
              {
                icon: '💻',
                title: 'Cambio de dispositivo',
                text: 'Si cambias de ordenador o de navegador, los datos del historial interno NO se transfieren automáticamente.',
              },
              {
                icon: '💥',
                title: 'Fallo del dispositivo',
                text: 'Si el ordenador se estropea o el disco duro falla, perderías todo el historial junto con el resto de datos.',
              },
              {
                icon: '🔄',
                title: 'Actualización del navegador',
                text: 'En casos excepcionales, algunas actualizaciones de navegador pueden borrar el almacenamiento local.',
              },
            ].map((item) => (
              <div
                key={item.icon}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: bgColor,
                  border: `1px solid ${border}`,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      color,
                      marginBottom: '0.1rem',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color,
                      opacity: 0.8,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Consejo final */}
          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '0.75rem',
              background: color,
              color: '#ffffff',
              fontSize: '0.775rem',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Nuestra recomendación:</strong> Descarga la copia en tu
            ordenador y guárdala también en un lugar seguro como un USB, Google
            Drive o Dropbox. Así siempre tendrás un respaldo aunque falle
            cualquier cosa.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BackupPanel ──────────────────────────────────────────────────────────────
function BackupPanel({ onClose }: { onClose: () => void }) {
  const {
    T,
    backupHistory,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
  } = useApp();

  const toast = useToast();

  const [confirmRestore, setConfirmRestore] = useState<BackupEntry | null>(
    null
  );

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (confirmRestore || confirmDelete) {
      const allScrollables = document.querySelectorAll('[style*="overflow"]');
      allScrollables.forEach((el) => {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = 0;
        }
      });
    }
  }, [confirmRestore, confirmDelete]);

  const [downloadPreRestore, setDownloadPreRestore] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<BackupEntry | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBackup = () => {
    const entry = createBackup('Copia manual');
    downloadBackup(entry);
    toast('Copia de seguridad creada y descargada', 'success');
  };

  const handleCreateOnly = () => {
    createBackup('Copia manual');
    toast('Copia de seguridad guardada en el historial', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.app !== 'FinanzasHogar') {
          setImportError('El fichero no es un backup de FinanzasHogar válido.');
          setImportPreview(null);
          return;
        }
        if (!parsed.data || !parsed.data.accounts) {
          setImportError('El fichero de backup no contiene datos válidos.');
          setImportPreview(null);
          return;
        }
        const entry: BackupEntry = {
          id: parsed.id ?? uid(),
          timestamp: parsed.timestamp ?? Date.now(),
          label: parsed.label ?? 'Importado desde fichero',
          accountsCount: parsed.data.accounts?.length ?? 0,
          categoriesCount: parsed.data.categories?.length ?? 0,
          projectionsCount: parsed.data.projections?.length ?? 0,
          realExpensesCount: parsed.data.realExpenses?.length ?? 0,
          data: {
            accounts: parsed.data.accounts ?? [],
            categories: parsed.data.categories ?? [],
            projections: parsed.data.projections ?? [],
            realExpenses: parsed.data.realExpenses ?? [],
            goals: parsed.data.goals ?? [],
            bankFormats: parsed.data.bankFormats ?? [],
            categoryRules: parsed.data.categoryRules ?? [],
            baseCurrency: parsed.data.baseCurrency ?? 'EUR',
            displayCurrency: parsed.data.displayCurrency ?? 'EUR',
            dark: parsed.data.dark ?? false,
          },
        };
        setImportPreview(entry);
        setImportError(null);
      } catch {
        setImportError(
          'No se pudo leer el fichero. Asegúrate de que es un .json válido.'
        );
        setImportPreview(null);
      }
    };

    reader.onerror = () => setImportError('No se pudo leer el fichero.');
    reader.readAsText(file);

    e.target.value = '';
  };

  const fmtTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeSince = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  };

  return (
    <Modal
      title="💾 Copias de seguridad"
      subtitle="Guarda y restaura tus datos de forma segura"
      onClose={onClose}
      T={T}
    >
      {/* ── Acciones principales ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Crear + Descargar */}
        <button
          onClick={handleCreateBackup}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.accent}33`,
            background: T.accentLight,
            color: T.accent,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>💾</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.accent }}
          >
            Guardar y descargar
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Guarda en el historial y descarga un fichero en tu ordenador
          </div>
        </button>

        {/* Solo guardar en historial */}
        <button
          onClick={handleCreateOnly}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.cardBorder}`,
            background: T.pageBg,
            color: T.body,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🕐</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
          >
            Solo guardar snapshot
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Guarda una copia en el historial sin descargar ningún fichero
          </div>
        </button>

        {/* Importar fichero */}
        <button
          onClick={() => {
            setShowImport(true);
            setImportPreview(null);
            setImportError(null);
          }}
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            border: `1.5px solid ${T.greenBorder}`,
            background: T.greenBg,
            color: T.green,
            cursor: 'pointer',
            textAlign: 'left',
            gridColumn: '1 / -1',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📂</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.green }}
          >
            Importar copia desde fichero
          </div>
          <div
            style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.2rem' }}
          >
            Restaura los datos desde un fichero .json descargado anteriormente
          </div>
        </button>
      </div>

      {/* ── Sección importar desde fichero ── */}
      {showImport && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: T.body,
              marginBottom: '0.75rem',
            }}
          >
            📂 Selecciona el fichero de backup (.json)
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.inputBorder}`,
              background: T.inputBg,
              color: T.inputText,
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              marginBottom: '0.75rem',
            }}
          >
            🗂️ Elegir fichero...
          </button>

          {importError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
                fontSize: '0.775rem',
                color: T.red,
                marginBottom: '0.75rem',
              }}
            >
              ⛔ {importError}
            </div>
          )}

          {importPreview && (
            <div>
              {/* Vista previa */}
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.875rem',
                  background: T.cardBg,
                  border: `1px solid ${T.greenBorder}`,
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: T.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.625rem',
                  }}
                >
                  ✅ Fichero válido — Vista previa del contenido
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: T.muted,
                    marginBottom: '0.5rem',
                  }}
                >
                  📅 Fecha de la copia:{' '}
                  <strong style={{ color: T.body }}>
                    {fmtTimestamp(importPreview.timestamp)}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.4rem',
                  }}
                >
                  {[
                    { label: '🏦 Cuentas', value: importPreview.accountsCount },
                    {
                      label: '🏷️ Categorías',
                      value: importPreview.categoriesCount,
                    },
                    {
                      label: '📈 Proyecciones',
                      value: importPreview.projectionsCount,
                    },
                    {
                      label: '🧾 Movimientos',
                      value: importPreview.realExpensesCount,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.625rem',
                        background: T.pageBg,
                        border: `1px solid ${T.cardBorder}`,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: T.body,
                      }}
                    >
                      {item.label}:{' '}
                      <strong style={{ color: T.title }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '0.65rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: T.amberBg,
                  border: `1px solid ${T.amberBorder}`,
                  fontSize: '0.75rem',
                  color: T.amber,
                  marginBottom: '0.75rem',
                  lineHeight: 1.5,
                }}
              >
                {/* Checkbox descargar pre-restore */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    background: T.accentLight,
                    border: `1px solid ${T.accent}33`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={downloadPreRestore}
                    onChange={(e) => setDownloadPreRestore(e.target.checked)}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: T.accent,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      color: T.accent,
                      lineHeight: 1.4,
                    }}
                  >
                    💾 Descargar también la copia de seguridad previa a la
                    restauración
                  </span>
                </label>
                ⚠️ Al restaurar este backup{' '}
                <strong>se reemplazarán todos tus datos actuales</strong>. Esta
                acción no se puede deshacer. Te recomendamos hacer primero una
                copia de los datos actuales.
              </div>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => {
                    const preEntry = createBackup(
                      'Automática pre-restauración'
                    );
                    if (downloadPreRestore) {
                      downloadBackup(preEntry);
                      toast('Copia previa descargada correctamente', 'success');
                    }
                    restoreBackup(importPreview);
                    setShowImport(false);
                    setImportPreview(null);
                    setDownloadPreRestore(false);
                    toast(
                      'Datos restaurados correctamente desde fichero',
                      'success'
                    );
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: T.green,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Restaurar ahora
                </button>

                <button
                  onClick={() => {
                    setImportPreview(null);
                    setShowImport(false);
                  }}
                  style={{
                    padding: '0.7rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${T.cardBorder}`,
                    background: T.btnSecBg,
                    color: T.btnSecText,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Historial de copias ── */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Historial de copias ({backupHistory.length}/50)</span>
          {backupHistory.length > 0 && (
            <span
              style={{ fontSize: '0.68rem', color: T.muted, fontWeight: 400 }}
            >
              Última: {timeSince(backupHistory[0]?.timestamp)}
            </span>
          )}
        </div>

        {backupHistory.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              borderRadius: '1rem',
              background: T.pageBg,
              border: `1.5px dashed ${T.cardBorder}`,
              color: T.muted,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗂️</div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Aún no hay copias guardadas
            </div>
            <div style={{ fontSize: '0.775rem', marginTop: '0.25rem' }}>
              Usa los botones de arriba para crear tu primera copia
            </div>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {[...backupHistory]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.875rem',
                    background: index === 0 ? T.accentLight : T.pageBg,
                    border: `1px solid ${
                      index === 0 ? T.accent + '33' : T.cardBorder
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                  }}
                >
                  {/* Icono */}
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '0.625rem',
                      background: index === 0 ? T.accentLight : T.cardBg,
                      border: `1px solid ${
                        index === 0 ? T.accent + '44' : T.cardBorder
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {entry.label.includes('pre-restauración')
                      ? '🔄'
                      : index === 0
                      ? '💾'
                      : '🕐'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {entry.label}
                      </span>
                      {index === 0 && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: T.accent,
                            color: '#fff',
                          }}
                        >
                          MÁS RECIENTE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: T.muted }}>
                      {fmtTimestamp(entry.timestamp)} ·{' '}
                      {timeSince(entry.timestamp)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.625rem',
                        marginTop: '0.3rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {[
                        { label: `${entry.accountsCount} cuentas` },
                        { label: `${entry.projectionsCount} proyecc.` },
                        { label: `${entry.realExpensesCount} movim.` },
                        { label: `${entry.goalsCount ?? 0} objetivos` },
                      ].map((item) => (
                        <span
                          key={item.label}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: T.cardBg,
                            border: `1px solid ${T.cardBorder}`,
                            color: T.muted,
                          }}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => {
                        downloadBackup(entry);
                        toast('Copia descargada', 'success');
                      }}
                      title="Descargar este backup como fichero"
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: T.btnSecBg,
                        color: T.btnSecText,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⬇️ Descargar
                    </button>
                    <button
                      onClick={() => setConfirmRestore(entry)}
                      title="Restaurar los datos a este punto"
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.accent}44`,
                        background: T.accentLight,
                        color: T.accent,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🔄 Restaurar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(entry.id)}
                      title="Eliminar esta copia del historial"
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.redBorder}`,
                        background: T.redBg,
                        color: T.red,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Aviso informativo ── */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem 1.125rem',
          borderRadius: '1rem',
          background: T.redBg,
          border: `1.5px solid ${T.redBorder}`,
          lineHeight: 1.6,
          animation: 'warnGlow 2.5s ease-in-out infinite',
        }}
      >
        {/* Cabecera del aviso */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '0.625rem',
          }}
        >
          {/* Icono pulsante */}
          <span
            style={{
              fontSize: '1.1rem',
              display: 'inline-block',
              animation: 'warnPulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          >
            ⚠️
          </span>

          {/* Badge IMPORTANTE */}
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              background: T.red,
              color: '#ffffff',
            }}
          >
            Importante
          </span>

          <span
            style={{
              fontSize: '0.825rem',
              fontWeight: 800,
              color: T.red,
            }}
          >
            No pierdas tus datos
          </span>
        </div>

        {/* Texto del aviso */}
        <p
          style={{
            fontSize: '0.775rem',
            color: T.red,
            margin: 0,
            lineHeight: 1.65,
            opacity: 0.9,
          }}
        >
          Las copias del historial se guardan{' '}
          <strong>únicamente en este navegador</strong>. Si limpias el
          historial, cambias de navegador o cambias de dispositivo,{' '}
          <strong>podrías perderlas para siempre</strong>.
        </p>

        {/* Separador */}
        <div
          style={{
            height: '1px',
            background: T.redBorder,
            margin: '0.625rem 0',
            opacity: 0.5,
          }}
        />

        {/* Consejo de acción */}
        <p
          style={{
            fontSize: '0.775rem',
            color: T.red,
            margin: 0,
            lineHeight: 1.65,
            opacity: 0.9,
          }}
        >
          ✅ Usa siempre <strong>"Guardar y descargar"</strong> para tener una
          copia física en tu ordenador como respaldo adicional.
        </p>
      </div>

      {/* ── Modal confirmar restaurar ── */}
      {confirmRestore && (
        <ConfirmModal
          T={T}
          danger={false}
          title="¿Restaurar esta copia?"
          confirmLabel="🔄 Restaurar ahora"
          message={`Vas a restaurar la copia del ${fmtTimestamp(
            confirmRestore.timestamp
          )} (${confirmRestore.accountsCount} cuentas, ${
            confirmRestore.projectionsCount
          } proyecciones, ${
            confirmRestore.realExpensesCount
          } movimientos). Todos tus datos actuales serán reemplazados. Antes de restaurar se guardará automáticamente una copia de seguridad de tu estado actual.`}
          checkboxLabel="💾 Descargar también la copia de seguridad previa a la restauración"
          checkboxValue={downloadPreRestore}
          onCheckboxChange={setDownloadPreRestore}
          onConfirm={() => {
            const preEntry = createBackup('Automática pre-restauración');
            if (downloadPreRestore) {
              downloadBackup(preEntry);
              toast('Copia previa descargada correctamente', 'success');
            }
            restoreBackup(confirmRestore);
            setConfirmRestore(null);
            setDownloadPreRestore(false);
            toast('Datos restaurados correctamente', 'success');
            onClose();
          }}
          onCancel={() => {
            setConfirmRestore(null);
            setDownloadPreRestore(false);
          }}
        />
      )}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          danger={true}
          title="¿Eliminar esta copia?"
          message="Se eliminará esta copia del historial. Esta acción no se puede deshacer. El fichero descargado en tu ordenador (si lo guardaste) no se verá afectado."
          onConfirm={() => {
            deleteBackup(confirmDelete);
            setConfirmDelete(null);
            toast('Copia eliminada del historial', 'success');
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Modal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
// Ahora lee del contexto directamente. Sin props de datos.
function Dashboard() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    fmtAccount,
    accounts,
    projections,
    categories,
    forecastAll,
    forecastByAccount,
    accountWarnings,
    realBalanceMap,
    stats,
    dateFormat,
  } = useApp();
  const { totalBalance, totalRealBalance, thisMonth, warnAccounts } = stats;

  const topExpenses = useMemo(() => {
    const map = {};
    projections
      .filter((p) => p.type === 'expense')
      .forEach((p) => {
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        map[p.categoryId] =
          (map[p.categoryId] || 0) + (freq ? p.amount / freq.months : 0);
      });
    return Object.entries(map)
      .map(([id, val]) => ({ cat: categories.find((c) => c.id === id), val }))
      .filter((x) => x.cat)
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [projections, categories, displayCurrency, baseCurrency, rates]);

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div
        className="fh-no-print"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '-1rem',
        }}
      >
        <PrintButton T={T} />
      </div>
      <WarnBanner warnAccounts={warnAccounts} T={T} />
      <AlertsBanner />

      <div
        style={{
          borderRadius: '1.25rem',
          background: T.heroBg,
          padding: '1.5rem 2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Patrimonio principal */}
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Patrimonio total
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: T.heroText,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {fmt(totalRealBalance, displayCurrency, displayCurrency, rates)}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: T.heroMuted,
                marginTop: '0.25rem',
              }}
            >
              Saldo real · {accounts.length} cuenta
              {accounts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Separador vertical */}
          <div
            style={{
              width: '1px',
              height: '3.5rem',
              background: 'rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          />

          {/* Ingresos */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Ingresos este mes
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#4ade80',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(thisMonth.income, displayCurrency, baseCurrency, rates)}
            </div>
          </div>

          {/* Gastos */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Gastos este mes
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#f87171',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(thisMonth.expense, displayCurrency, baseCurrency, rates)}
            </div>
          </div>

          {/* Balance neto */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.heroMuted,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Balance neto
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: thisMonth.net >= 0 ? '#4ade80' : '#f87171',
                letterSpacing: '-0.02em',
              }}
            >
              {thisMonth.net >= 0 ? '+' : ''}
              {fmt(thisMonth.net, displayCurrency, baseCurrency, rates)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          Estado por cuenta
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem,1fr))',
            gap: '1rem',
          }}
        >
          {accounts.map((acc) => {
            const warn = accountWarnings[acc.id];
            const fc = forecastByAccount[acc.id] || [];
            const next = fc[0];
            return (
              <Card
                key={acc.id}
                T={T}
                style={{
                  border: `2px solid ${warn ? T.amberBorder : T.cardBorder}`,
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '0.75rem',
                          background: warn ? T.amberBg : T.accentLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Wallet size={16} color={warn ? T.amber : T.accent} />
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {acc.name}
                      </div>
                    </div>
                    {warn && <AlertTriangle size={16} color={T.amber} />}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
                        fontWeight: 800,
                        color: warn ? T.amber : T.accent,
                        letterSpacing: '-0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtAccount(
                        realBalanceMap[acc.id]?.realBalance ?? acc.balance,
                        acc.currency ?? baseCurrency
                      )}
                    </div>

                    {/* Línea base — solo si hay diferencia */}
                    {(realBalanceMap[acc.id]?.realBalance ?? acc.balance) !==
                      acc.balance && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginTop: '0.2rem',
                        }}
                      >
                        Base{' '}
                        {fmtAccount(acc.balance, acc.currency ?? baseCurrency)}{' '}
                        · al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    )}

                    {/* Fecha base — cuando no hay diferencia (ej: Efectivo sin movimientos) */}
                    {(realBalanceMap[acc.id]?.realBalance ?? acc.balance) ===
                      acc.balance && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          marginTop: '0.2rem',
                        }}
                      >
                        Base{' '}
                        {fmtAccount(acc.balance, acc.currency ?? baseCurrency)}{' '}
                        · al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    )}

                    {/* Movimientos aplicados */}
                    {realBalanceMap[acc.id]?.appliedCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.accent,
                          marginTop: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ✅ {realBalanceMap[acc.id].appliedCount} movimiento
                        {realBalanceMap[acc.id].appliedCount !== 1
                          ? 's'
                          : ''}{' '}
                        real
                        {realBalanceMap[acc.id].appliedCount !== 1
                          ? 'es'
                          : ''}{' '}
                        aplicado
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Movimientos ignorados */}
                    {realBalanceMap[acc.id]?.ignoredCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.amber,
                          marginTop: '0.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ⚠️ {realBalanceMap[acc.id].ignoredCount} movimiento
                        {realBalanceMap[acc.id].ignoredCount !== 1
                          ? 's'
                          : ''}{' '}
                        ignorado
                        {realBalanceMap[acc.id].ignoredCount !== 1
                          ? 's'
                          : ''}{' '}
                        (anteriores al saldo base)
                      </div>
                    )}
                  </div>

                  {next && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        paddingTop: '0.875rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                        marginTop: '0.5rem',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: T.muted,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Ing./mes
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: T.green,
                          }}
                        >
                          {fmtAccount(
                            next.income,
                            acc.currency ?? baseCurrency
                          )}{' '}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: T.muted,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Gas./mes
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: T.red,
                          }}
                        >
                          {fmtAccount(
                            next.expense,
                            acc.currency ?? baseCurrency
                          )}{' '}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: T.muted,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Neto/mes
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: next.net >= 0 ? T.green : T.red,
                          }}
                        >
                          {next.net >= 0 ? '+' : ''}
                          {fmtAccount(
                            next.net,
                            acc.currency ?? baseCurrency
                          )}{' '}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <RealExpensesSummary />

      <ProjectedVsReal />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',

          gap: '1.5rem',
        }}
      >
        <Card T={T}>
          <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.muted,
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              Distribución
            </div>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                letterSpacing: '-0.02em',
              }}
            >
              Gastos por categoría
            </div>
          </div>
          <div
            style={{
              padding: '0 1.75rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {topExpenses.map(({ cat, val }) => {
              const maxVal = Math.max(...topExpenses.map((x) => x.val));
              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: T.body,
                      }}
                    >
                      <span
                        style={{
                          width: '0.625rem',
                          height: '0.625rem',
                          borderRadius: '50%',
                          background: cat.color,
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        color: T.title,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmt(val, displayCurrency, baseCurrency, rates)}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          fontWeight: 400,
                        }}
                      >
                        /mes
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '0.375rem',
                      borderRadius: '9999px',
                      background: T.pageBg,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        background: cat.color,
                        width: `${(val / maxVal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {topExpenses.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: T.muted,
                  padding: '2rem',
                  fontSize: '0.875rem',
                }}
              >
                Sin proyecciones de gasto
              </div>
            )}
          </div>
        </Card>

        <Card T={T} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.muted,
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              Proyección global
            </div>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                letterSpacing: '-0.02em',
              }}
            >
              Previsión a 6 meses — Todas las cuentas
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: T.tableHead,
                    borderBottom: `1px solid ${T.tableBorder}`,
                  }}
                >
                  {['Mes', 'Ingresos', 'Gastos', 'Neto', 'Saldo est.'].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1.25rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: T.muted,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {forecastAll.slice(0, 6).map((m, i) => (
                  <tr
                    key={m.key}
                    style={{
                      background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                      borderBottom: `1px solid ${T.tableBorder}`,
                    }}
                  >
                    <td
                      style={{
                        padding: '0.75rem 1.25rem',
                        fontWeight: 700,
                        color: T.title,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.label}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: T.green,
                      }}
                    >
                      {fmt(m.income, displayCurrency, baseCurrency, rates)}{' '}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: T.red,
                      }}
                    >
                      {fmt(m.expense, displayCurrency, baseCurrency, rates)}{' '}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: m.net >= 0 ? T.green : T.red,
                      }}
                    >
                      {m.net >= 0 ? '+' : ''}
                      {fmt(m.net, displayCurrency, baseCurrency, rates)}{' '}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 800,
                        color: T.accent,
                      }}
                    >
                      {fmt(
                        m.runningBalance,
                        displayCurrency,
                        baseCurrency,
                        rates
                      )}{' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <GoalsSummary />
    </div>
  );
}

// ─── ProjectedVsReal (widget para Dashboard) ──────────────────────────────────
function ProjectedVsReal() {
  const {
    T,
    accounts,
    categories,
    projections,
    realExpenses,
    displayCurrency,
    baseCurrency,
    rates,
  } = useApp();

  const now = new Date();
  const currentMonthKey = monthKey(now);

  // ── Reales válidos del mes actual ──────────────────────────────────────────
  // Solo los posteriores al saldo base de su cuenta
  const validCurrentMonthReals = useMemo(() => {
    return realExpenses.filter((e) => {
      if (e.valueDate.slice(0, 7) !== currentMonthKey) return false;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      return e.valueDate > acc.date;
    });
  }, [realExpenses, accounts, currentMonthKey]);

  // ── Proyecciones activas este mes ──────────────────────────────────────────
  const activeProjections = useMemo(() => {
    return projections.filter((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : null;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diff =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth());
      if (diff < 0 || (end && now > end) || diff % freq.months !== 0)
        return false;
      return true;
    });
  }, [projections]);

  // ── Agrupamos por categoría ────────────────────────────────────────────────
  const rows = useMemo(() => {
    const map: Record<
      string,
      {
        categoryId: string;
        type: 'income' | 'expense';
        projected: number;
        real: number;
      }
    > = {};

    // Añadimos proyecciones
    activeProjections.forEach((p) => {
      const acc = accounts.find((a) => a.id === p.accountId);
      const accCurrency = acc?.currency ?? baseCurrency;
      const amount = convertAmount(
        p.amount,
        accCurrency,
        displayCurrency,
        rates
      );

      if (!map[p.categoryId]) {
        map[p.categoryId] = {
          categoryId: p.categoryId,
          type: p.type as 'income' | 'expense',
          projected: 0,
          real: 0,
        };
      }
      map[p.categoryId].projected += amount;
    });

    // Añadimos reales válidos del mes
    validCurrentMonthReals.forEach((e) => {
      const amount = convertAmount(
        e.amount,
        e.currency,
        displayCurrency,
        rates
      );

      if (!map[e.categoryId]) {
        // Categoría con real pero sin proyección
        map[e.categoryId] = {
          categoryId: e.categoryId,
          type: e.type as 'income' | 'expense',
          projected: 0,
          real: 0,
        };
      }
      map[e.categoryId].real += amount;
    });

    return Object.values(map).sort((a, b) => {
      // Gastos primero, luego ingresos. Dentro de cada grupo, por proyectado desc.
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return b.projected - a.projected;
    });
  }, [
    activeProjections,
    validCurrentMonthReals,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  // ── Totales ────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const projectedIncome = rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.projected, 0);
    const projectedExpense = rows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.projected, 0);
    const realIncome = rows
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + r.real, 0);
    const realExpense = rows
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.real, 0);
    return { projectedIncome, projectedExpense, realIncome, realExpense };
  }, [rows]);

  const monthName = new Date(now.getFullYear(), now.getMonth()).toLocaleString(
    'es-ES',
    {
      month: 'long',
      year: 'numeric',
    }
  );

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: '1rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.2rem',
            }}
          >
            Comparativa mensual
          </div>
          <div
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.02em',
              textTransform: 'capitalize',
            }}
          >
            Apuntes Proyectados vs Gastos Reales — {monthName}
          </div>
        </div>

        {/* Leyenda */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              fontWeight: 600,
            }}
          >
            Importes por categoría:{' '}
            <span style={{ color: T.muted, fontWeight: 400 }}>Proyectado</span>
            {' / '}
            <span style={{ color: T.accent, fontWeight: 700 }}>Real</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: T.muted, opacity: 0.8 }}>
            Barra = % real ejecutado sobre lo proyectado · color por categoría
          </div>
        </div>
      </div>

      {/* ── Totales resumen ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        {[
          {
            label: 'Ingresos proyectados',
            value: fmt(
              totals.projectedIncome,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.green,
            bg: T.greenBg,
            opacity: 0.7,
          },
          {
            label: 'Ingresos reales',
            value: fmt(
              totals.realIncome,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.green,
            bg: T.greenBg,
            opacity: 1,
          },
          {
            label: 'Gastos proyectados',
            value: fmt(
              totals.projectedExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.red,
            bg: T.redBg,
            opacity: 0.7,
          },
          {
            label: 'Gastos reales',
            value: fmt(
              totals.realExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: T.red,
            bg: T.redBg,
            opacity: 1,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '0.875rem 1rem',
              background: item.bg,
              borderRight: i < 3 ? `1px solid ${T.cardBorder}` : 'none',
              opacity: item.opacity,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.3rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filas por categoría ── */}
      <div
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Gastos */}
        {rows.filter((r) => r.type === 'expense').length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.red,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <ArrowDownCircle size={12} color={T.red} />
              Gastos por categoría
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {rows
                .filter((r) => r.type === 'expense')
                .map((row) => {
                  const cat = categories.find((c) => c.id === row.categoryId);
                  const pct =
                    row.projected > 0
                      ? Math.min((row.real / row.projected) * 100, 100)
                      : 0;
                  const overBudget =
                    row.real > row.projected && row.projected > 0;
                  const overPct =
                    row.projected > 0
                      ? Math.round(
                          ((row.real - row.projected) / row.projected) * 100
                        )
                      : null;
                  const remaining = Math.max(0, row.projected - row.real);
                  const noBudget = row.projected === 0;

                  return (
                    <div key={row.categoryId}>
                      {/* Fila superior: nombre + importes */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.625rem',
                              height: '0.625rem',
                              borderRadius: '50%',
                              background: cat?.color ?? T.cardBorder,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: T.title,
                            }}
                          >
                            {cat?.name ?? 'Sin categoría'}
                          </span>
                          {overBudget && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.redBg,
                                color: T.red,
                                border: `1px solid ${T.redBorder}`,
                              }}
                            >
                              +{overPct}% sobre presupuesto
                            </span>
                          )}
                          {!overBudget &&
                            !noBudget &&
                            row.real > 0 &&
                            row.projected > 0 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: T.pageBg,
                                  color: T.muted,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                {Math.round((row.real / row.projected) * 100)}%
                              </span>
                            )}
                          {noBudget && row.real > 0 && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.amberBg,
                                color: T.amber,
                                border: `1px solid ${T.amberBorder}`,
                              }}
                            >
                              Sin presupuesto
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            <span style={{ color: T.muted, fontWeight: 500 }}>
                              {row.projected > 0
                                ? fmt(
                                    row.projected,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )
                                : '—'}
                            </span>
                            <span style={{ color: T.muted, fontWeight: 400 }}>
                              {' '}
                              /{' '}
                            </span>
                            <span
                              style={{
                                color: cat?.color ?? T.accent,
                                fontWeight: 800,
                              }}
                            >
                              {fmt(
                                row.real,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          </span>

                          {remaining > 0 && (
                            <span
                              style={{ fontSize: '0.72rem', color: T.muted }}
                            >
                              Resta{' '}
                              {fmt(
                                remaining,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      {!noBudget && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.pageBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: overBudget
                                ? T.red
                                : cat?.color ?? T.accent,
                              width: `${pct}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      )}
                      {noBudget && row.real > 0 && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.amberBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: T.amber,
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Ingresos */}
        {rows.filter((r) => r.type === 'income').length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.green,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <ArrowUpCircle size={12} color={T.green} />
              Ingresos por categoría
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {rows
                .filter((r) => r.type === 'income')
                .map((row) => {
                  const cat = categories.find((c) => c.id === row.categoryId);
                  const pct =
                    row.projected > 0
                      ? Math.min((row.real / row.projected) * 100, 100)
                      : 0;
                  const overEarned =
                    row.real > row.projected && row.projected > 0;
                  const overPct =
                    row.projected > 0
                      ? Math.round(
                          ((row.real - row.projected) / row.projected) * 100
                        )
                      : null;
                  const pending = Math.max(0, row.projected - row.real);
                  const noBudget = row.projected === 0;

                  return (
                    <div key={row.categoryId}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.625rem',
                              height: '0.625rem',
                              borderRadius: '50%',
                              background: cat?.color ?? T.cardBorder,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: T.title,
                            }}
                          >
                            {cat?.name ?? 'Sin categoría'}
                          </span>
                          {overEarned && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.greenBg,
                                color: T.green,
                                border: `1px solid ${T.greenBorder}`,
                              }}
                            >
                              +{overPct}% sobre lo esperado
                            </span>
                          )}
                          {!overEarned &&
                            !noBudget &&
                            row.real > 0 &&
                            row.projected > 0 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: T.pageBg,
                                  color: T.muted,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                {Math.round((row.real / row.projected) * 100)}%
                              </span>
                            )}
                          {noBudget && row.real > 0 && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: T.amberBg,
                                color: T.amber,
                                border: `1px solid ${T.amberBorder}`,
                              }}
                            >
                              Sin proyección
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            <span style={{ color: T.muted, fontWeight: 500 }}>
                              {row.projected > 0
                                ? fmt(
                                    row.projected,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )
                                : '—'}
                            </span>
                            <span style={{ color: T.muted, fontWeight: 400 }}>
                              {' '}
                              /{' '}
                            </span>
                            <span
                              style={{
                                color: cat?.color ?? T.green,
                                fontWeight: 800,
                              }}
                            >
                              {fmt(
                                row.real,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          </span>

                          {pending > 0 && (
                            <span
                              style={{ fontSize: '0.72rem', color: T.muted }}
                            >
                              Pendiente{' '}
                              {fmt(
                                pending,
                                displayCurrency,
                                displayCurrency,
                                rates
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {!noBudget && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.pageBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: cat?.color ?? T.green,
                              width: `${pct}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      )}
                      {noBudget && row.real > 0 && (
                        <div
                          style={{
                            height: '0.375rem',
                            borderRadius: '9999px',
                            background: T.amberBg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              background: T.amber,
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RealExpensesSummary (widget para Dashboard) ──────────────────────────────
function RealExpensesSummary() {
  const { T, realExpenses, displayCurrency, rates, setTab } = useApp();

  const { thisMonthExpenses, currentMonthKey } = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;
    const thisMonthExpenses = realExpenses.filter((e) => {
      const key = e.entryDate.slice(0, 7);
      return key === currentMonthKey;
    });
    return { thisMonthExpenses, currentMonthKey };
  }, [realExpenses]);

  const realIncome = thisMonthExpenses
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const realExpense = thisMonthExpenses
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const realNet = realIncome - realExpense;
  const totalMovements = thisMonthExpenses.length;

  if (realExpenses.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.cardBg,
          border: `1.5px dashed ${T.cardBorder}`,
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.75rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={16} color={T.accent} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Gastos Reales
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.1rem',
              }}
            >
              Aún no tienes movimientos registrados
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('real')}
          style={{
            padding: '0.55rem 1.125rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: T.accent,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Registrar movimiento
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '1rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.625rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={14} color={T.accent} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
            >
              Gastos Reales — Este mes
            </div>
            <div style={{ fontSize: '0.72rem', color: T.muted }}>
              {totalMovements} movimiento{totalMovements !== 1 ? 's' : ''}{' '}
              registrado{totalMovements !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('real')}
          style={{
            padding: '0.45rem 0.875rem',
            borderRadius: '0.625rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.btnSecBg,
            color: T.btnSecText,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ver todos →
        </button>
      </div>

      {/* Totales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
        }}
      >
        {[
          {
            label: 'Ingresos reales',
            value: fmt(realIncome, displayCurrency, displayCurrency, rates),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Gastos reales',
            value: fmt(realExpense, displayCurrency, displayCurrency, rates),
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
          },
          {
            label: 'Balance real',
            value:
              (realNet >= 0 ? '+' : '') +
              fmt(realNet, displayCurrency, displayCurrency, rates),
            color: realNet >= 0 ? T.green : T.red,
            bg: realNet >= 0 ? T.greenBg : T.redBg,
            border: realNet >= 0 ? T.greenBorder : T.redBorder,
          },
        ].map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              background: item.bg,
              borderRight: i < 2 ? `1px solid ${item.border}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
function Accounts() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    fmtAccount,
    accounts,
    setAccounts,
    forecastByAccount,
    accountWarnings,
    realBalanceMap,
    setTab,
    setRealAccountFilter,
    realExpenses,
    setRealExpenses,
    projections,
    setProjections,
    goals,
    setGoals,
    dateFormat,
  } = useApp();

  const totalBase = accounts.reduce((s, a) => s + a.balance, 0);
  const totalReal = accounts.reduce(
    (s, a) => s + (realBalanceMap[a.id]?.realBalance ?? a.balance),
    0
  );

  const toast = useToast();

  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    name: '',
    balance: '',
    date: today(),
    minBalance: '',
    currency: baseCurrency,
  });

  const openAdd = () => {
    setForm({ name: '', balance: '', date: today(), minBalance: '' });
    setModal('add');
  };

  const openEdit = (acc) => {
    setForm({
      ...acc,
      balance: acc.balance.toFixed(2),
      minBalance: (acc.minBalance ?? 0).toFixed(2),
      currency: acc.currency ?? baseCurrency,
    });

    setModal(acc.id);
  };

  const save = () => {
    if (!form.name || form.balance === '') return;
    const entry = {
      ...form,
      balance: +form.balance,
      minBalance: +(form.minBalance || 0),
    };

    if (modal === 'add') {
      setAccounts((p) => [
        ...p,
        { ...entry, id: uid(), acknowledgedExpenseIds: [] },
      ]);
      toast('Cuenta creada correctamente', 'success');
    } else {
      const existingAccount = accounts.find((a) => a.id === modal);
      const dateChanged = existingAccount && form.date !== existingAccount.date;

      setAccounts((p) =>
        p.map((a) => {
          if (a.id !== modal) return a;

          let acknowledgedExpenseIds = a.acknowledgedExpenseIds ?? [];

          if (dateChanged) {
            // Reconocemos automáticamente todos los movimientos de esta
            // cuenta cuyo valueDate <= nueva fecha del saldo base
            const newlyAcknowledged = realExpenses
              .filter(
                (e) =>
                  e.accountId === a.id &&
                  e.valueDate <= form.date &&
                  !acknowledgedExpenseIds.includes(e.id)
              )
              .map((e) => e.id);

            acknowledgedExpenseIds = [
              ...acknowledgedExpenseIds,
              ...newlyAcknowledged,
            ];
          }

          return { ...a, ...entry, acknowledgedExpenseIds };
        })
      );

      if (dateChanged) {
        toast(
          'Cuenta actualizada. Los movimientos anteriores al nuevo saldo base han sido reconocidos automáticamente.',
          'info'
        );
      } else {
        toast('Cuenta actualizada correctamente', 'success');
      }
    }
    setModal(null);
  };

  const del = (id) => setConfirmDelete(id);

  const confirmDel = () => {
    const deletedId = confirmDelete;

    const movCount = realExpenses.filter(
      (e) => e.accountId === deletedId
    ).length;
    const projCount = projections.filter(
      (p) => p.accountId === deletedId
    ).length;
    const goalCount = goals.filter(
      (g) => g.mode === 'auto' && g.accountId === deletedId
    ).length;

    setAccounts((p) => p.filter((a) => a.id !== deletedId));
    setRealExpenses((p) => p.filter((e) => e.accountId !== deletedId));
    setProjections((p) => p.filter((p) => p.accountId !== deletedId));
    setGoals((p) =>
      p.filter((g) => !(g.mode === 'auto' && g.accountId === deletedId))
    );

    const parts = [];
    if (movCount > 0)
      parts.push(`${movCount} movimiento${movCount !== 1 ? 's' : ''}`);
    if (projCount > 0)
      parts.push(`${projCount} proyección${projCount !== 1 ? 'es' : ''}`);
    if (goalCount > 0)
      parts.push(`${goalCount} objetivo${goalCount !== 1 ? 's' : ''}`);

    const detail =
      parts.length > 0
        ? ` junto con ${parts.join(', ')} asociado${
            parts.length > 1 ? 's' : ''
          }`
        : '';

    toast(`Cuenta eliminada${detail}`, 'success');
    setConfirmDelete(null);
  };

  const accToDelete = accounts.find((a) => a.id === confirmDelete);
  return (
    <div className="fh-print-section">
      {' '}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Gestión
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Mis Cuentas
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Administra y controla tus saldos
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton T={T} />
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nueva cuenta
          </PrimaryBtn>
        </div>
      </div>
      {/* ── Resumen de patrimonio ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          {
            label: 'Patrimonio base',
            value: fmtAccount(totalBase, baseCurrency),
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Patrimonio real calculado',
            value: fmtAccount(totalReal, baseCurrency),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Cuentas activas',
            value: `${accounts.length} cuenta${
              accounts.length !== 1 ? 's' : ''
            }`,
            color: T.muted,
            bg: T.pageBg,
            border: T.cardBorder,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
      {/* ── Grid de tarjetas de cuenta ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(22rem,1fr))',
          gap: '1.25rem',
        }}
      >
        {accounts.map((acc) => {
          const warn = accountWarnings[acc.id];
          const fc = forecastByAccount[acc.id] || [];
          const next = fc[0];
          const projectedEnd = acc.balance + fc.reduce((s, m) => s + m.net, 0);
          return (
            <Card
              key={acc.id}
              T={T}
              style={{
                border: `2px solid ${warn ? T.amberBorder : T.cardBorder}`,
              }}
            >
              <div style={{ padding: '1.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                    }}
                  >
                    <div
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.875rem',
                        background: warn ? T.amberBg : T.accentLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${
                          warn ? T.amberBorder : T.cardBorder
                        }`,
                        flexShrink: 0,
                      }}
                    >
                      <Wallet size={20} color={warn ? T.amber : T.accent} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: T.title,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {acc.name}
                        </div>
                        {/* Badge de divisa de la cuenta */}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: T.accentLight,
                            color: T.accent,
                            border: `1px solid ${T.accent}33`,
                          }}
                        >
                          {acc.currency ?? baseCurrency}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: T.muted,
                          marginTop: '0.1rem',
                        }}
                      >
                        Al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    </div>
                  </div>
                  {warn && (
                    <AlertTriangle
                      size={18}
                      color={T.amber}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </div>

                <div
                  style={{
                    marginBottom: '1.25rem',
                    width: '100%',
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      color: T.muted,
                      textTransform: 'uppercase',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Saldo real calculado
                  </div>

                  <div
                    style={{
                      fontSize: 'clamp(1.375rem, 5vw, 2.25rem)',
                      fontWeight: 800,
                      color: warn ? T.amber : T.accent,
                      letterSpacing: '-0.03em',
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                    }}
                  >
                    {fmtAccount(
                      realBalanceMap[acc.id]?.realBalance ?? acc.balance,
                      acc.currency ?? baseCurrency
                    )}
                  </div>

                  {/* Saldo base y movimientos aplicados */}
                  <div
                    style={{
                      marginTop: '0.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      alignItems: 'flex-end',
                    }}
                  >
                    {(realBalanceMap[acc.id]?.realBalance ?? acc.balance) !==
                      acc.balance && (
                      <div style={{ fontSize: '0.75rem', color: T.muted }}>
                        Base:{' '}
                        {fmtAccount(acc.balance, acc.currency ?? baseCurrency)}{' '}
                        · al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    )}
                    {(realBalanceMap[acc.id]?.realBalance ?? acc.balance) ===
                      acc.balance && (
                      <div style={{ fontSize: '0.75rem', color: T.muted }}>
                        Base:{' '}
                        {fmtAccount(acc.balance, acc.currency ?? baseCurrency)}{' '}
                        · al {fmtDateDMY(acc.date, dateFormat)}
                      </div>
                    )}

                    {realBalanceMap[acc.id]?.appliedCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.accent,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ✅ {realBalanceMap[acc.id].appliedCount} movimiento
                        {realBalanceMap[acc.id].appliedCount !== 1
                          ? 's'
                          : ''}{' '}
                        real
                        {realBalanceMap[acc.id].appliedCount !== 1
                          ? 'es'
                          : ''}{' '}
                        aplicado
                        {realBalanceMap[acc.id].appliedCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {realBalanceMap[acc.id]?.ignoredCount > 0 && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.amber,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        ⚠️ {realBalanceMap[acc.id].ignoredCount} movimiento
                        {realBalanceMap[acc.id].ignoredCount !== 1
                          ? 's'
                          : ''}{' '}
                        ignorado
                        {realBalanceMap[acc.id].ignoredCount !== 1
                          ? 's'
                          : ''}{' '}
                        (anterior
                        {realBalanceMap[acc.id].ignoredCount !== 1
                          ? 'es'
                          : ''}{' '}
                        al saldo base)
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: T.muted }}>
                      Mínimo:{' '}
                      {fmtAccount(acc.minBalance, acc.currency ?? baseCurrency)}
                    </div>
                  </div>
                </div>

                {next && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: '0.875rem',
                      background: T.pageBg,
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Ingresos/mes
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: T.green,
                        }}
                      >
                        {fmtAccount(next.income, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Gastos/mes
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: T.red,
                        }}
                      >
                        {fmtAccount(next.expense, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                    <div
                      style={{
                        gridColumn: '1/-1',
                        paddingTop: '0.75rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: T.muted,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.2rem',
                        }}
                      >
                        Saldo proyectado a 12 meses
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          color:
                            projectedEnd >= acc.minBalance ? T.accent : T.amber,
                        }}
                      >
                        {fmtAccount(projectedEnd, acc.currency ?? baseCurrency)}
                      </div>
                    </div>
                  </div>
                )}

                {warn && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.75rem',
                      background: T.amberBg,
                      border: `1px solid ${T.amberBorder}`,
                      marginBottom: '1rem',
                    }}
                  >
                    <AlertTriangle size={14} color={T.amber} />
                    <span
                      style={{
                        fontSize: '0.775rem',
                        color: T.amber,
                        fontWeight: 600,
                      }}
                    >
                      El saldo proyectado caerá bajo el mínimo
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    onClick={() => {
                      setRealAccountFilter(acc.id);
                      setTab('real');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.65rem 0.875rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${T.cardBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <Receipt size={14} />
                    Movimientos
                  </button>
                  <SecondaryBtn
                    onClick={() => openEdit(acc)}
                    T={T}
                    aria-label={`Editar ${acc.name}`}
                  >
                    <Pencil size={14} />
                  </SecondaryBtn>
                  <DangerBtn
                    onClick={() => setConfirmDelete(acc.id)}
                    T={T}
                    aria-label={`Eliminar ${acc.name}`}
                  >
                    <Trash2 size={14} />
                  </DangerBtn>
                </div>
              </div>
            </Card>
          );
        })}
        {accounts.length === 0 && (
          <div
            style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '5rem 2rem',
              color: T.muted,
            }}
          >
            <Wallet
              size={48}
              color={T.muted}
              style={{ margin: '0 auto 1rem', opacity: 0.3 }}
            />
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                marginBottom: '0.5rem',
              }}
            >
              Todavía no tienes cuentas
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: T.muted,
                marginBottom: '1.5rem',
              }}
            >
              Añade tu primera cuenta para empezar a gestionar tus finanzas.
            </p>
            <PrimaryBtn onClick={openAdd}>
              <Plus size={15} />
              Crear primera cuenta
            </PrimaryBtn>
          </div>
        )}
      </div>
      {modal && (
        <Modal
          title={modal === 'add' ? 'Nueva cuenta' : 'Editar cuenta'}
          subtitle="Introduce los datos de tu cuenta"
          onClose={() => setModal(null)}
          T={T}
        >
          <Field label="Nombre de la cuenta">
            <Input
              T={T}
              placeholder="Ej: Cuenta nómina BBVA"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Saldo actual">
            <Input
              T={T}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.balance}
              onChange={(e) =>
                setForm({ ...form, balance: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>

          <Field label="Divisa de la cuenta">
            <Sel
              T={T}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </Sel>
            {/* Aviso cuando la divisa cambia respecto a la original */}
            {modal !== 'add' &&
              modal !== null &&
              form.currency !==
                (accounts.find((a) => a.id === modal)?.currency ??
                  baseCurrency) && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.625rem',
                    background: T.amberBg,
                    border: `1px solid ${T.amberBorder}`,
                    fontSize: '0.72rem',
                    color: T.amber,
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ Has cambiado la divisa de{' '}
                  <strong>
                    {accounts.find((a) => a.id === modal)?.currency ??
                      baseCurrency}
                  </strong>{' '}
                  a <strong>{form.currency}</strong>. Los valores introducidos:
                  <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem' }}>
                    <li>
                      Saldo actual:{' '}
                      <strong>
                        {form.balance} {form.currency}
                      </strong>
                    </li>
                    <li>
                      Saldo mínimo de alerta:{' '}
                      <strong>
                        {form.minBalance} {form.currency}
                      </strong>
                    </li>
                  </ul>
                  <span style={{ display: 'block', marginTop: '0.4rem' }}>
                    Actualízalos si es necesario.
                  </span>
                </div>
              )}
          </Field>

          <Field label="Fecha del saldo">
            <Input
              T={T}
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>

          <Field label="Saldo mínimo de alerta">
            <Input
              T={T}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.minBalance}
              onChange={(e) =>
                setForm({
                  ...form,
                  minBalance: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Field>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <PrimaryBtn onClick={save} fullWidth>
              <Check size={15} />
              Guardar cuenta
            </PrimaryBtn>
            <SecondaryBtn onClick={() => setModal(null)} T={T}>
              Cancelar
            </SecondaryBtn>
          </div>
        </Modal>
      )}
      {confirmDelete &&
        (() => {
          const movCount = realExpenses.filter(
            (e) => e.accountId === confirmDelete
          ).length;
          const projCount = projections.filter(
            (p) => p.accountId === confirmDelete
          ).length;
          const goalCount = goals.filter(
            (g) => g.mode === 'auto' && g.accountId === confirmDelete
          ).length;

          const parts = [];
          if (movCount > 0)
            parts.push(`${movCount} movimiento${movCount !== 1 ? 's' : ''}`);
          if (projCount > 0)
            parts.push(`${projCount} proyección${projCount !== 1 ? 'es' : ''}`);
          if (goalCount > 0)
            parts.push(`${goalCount} objetivo${goalCount !== 1 ? 's' : ''}`);

          const detail =
            parts.length > 0
              ? ` y todos sus datos asociados: ${parts.join(', ')}.`
              : '. No tiene datos asociados.';

          return (
            <ConfirmModal
              T={T}
              title="¿Eliminar cuenta?"
              message={`Vas a eliminar "${accToDelete?.name}"${detail} Esta acción no se puede deshacer, pero siempre puedes restaurar desde una copia de seguridad.`}
              onConfirm={confirmDel}
              onCancel={() => setConfirmDelete(null)}
            />
          );
        })()}
    </div>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────
function Group({ title, items, type, T, projections, openEdit, del }) {
  return (
    <Card T={T}>
      <div style={{ padding: '1.5rem 1.75rem 1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '0.25rem',
          }}
        >
          {type === 'income' ? (
            <ArrowUpCircle size={18} color={T.green} />
          ) : (
            <ArrowDownCircle size={18} color={T.red} />
          )}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: type === 'income' ? T.green : T.red,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            letterSpacing: '-0.02em',
          }}
        >
          {items.length} categorías
        </div>
      </div>
      <div
        style={{
          padding: '0 1.75rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {items.map((cat) => {
          const usedBy = projections.filter((p) => p.categoryId === cat.id);
          return (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: T.body,
                  }}
                >
                  {cat.name}
                </span>
                {usedBy.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: T.amberBg,
                      color: T.amber,
                      border: `1px solid ${T.amberBorder}`,
                    }}
                  >
                    {usedBy.length} proyección{usedBy.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <GhostBtn
                  onClick={() => openEdit(cat)}
                  T={T}
                  aria-label={`Editar ${cat.name}`}
                >
                  <Pencil size={14} />
                </GhostBtn>
                <GhostBtn
                  onClick={() => del(cat.id)}
                  T={T}
                  color={T.red}
                  aria-label={`Eliminar ${cat.name}`}
                >
                  <Trash2 size={14} />
                </GhostBtn>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              color: T.muted,
              fontSize: '0.875rem',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              Sin categorías de {type === 'income' ? 'ingreso' : 'gasto'}
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Usa el botón "Nueva categoría" para añadir una.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Categories ────────────────────────────────────────────────────────────────
function Categories() {
  const { T, categories, setCategories, projections } = useApp();
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    color: CATEGORY_COLORS[0],
  });

  const openAdd = () => {
    setForm({ name: '', type: 'expense', color: CATEGORY_COLORS[0] });
    setModal('add');
  };
  const openEdit = (cat) => {
    setForm({ ...cat });
    setModal(cat.id);
  };

  const save = () => {
    if (!form.name) return;
    if (modal === 'add') {
      setCategories((p) => [...p, { ...form, id: uid() }]);
      toast('Categoría creada correctamente', 'success');
    } else {
      setCategories((p) =>
        p.map((c) => (c.id === modal ? { ...c, ...form } : c))
      );
      toast('Categoría actualizada correctamente', 'success');
    }
    setModal(null);
  };

  const del = (id) => {
    const usedBy = projections.filter((p) => p.categoryId === id);
    if (usedBy.length > 0) {
      toast(
        `No puedes eliminar esta categoría: tiene ${usedBy.length} proyección${
          usedBy.length !== 1 ? 'es' : ''
        } asignada${usedBy.length !== 1 ? 's' : ''}.`,
        'error'
      );
      return;
    }
    setConfirmDelete({ id, usedBy: [] });
  };

  const confirmDel = () => {
    setCategories((p) => p.filter((c) => c.id !== confirmDelete.id));
    toast('Categoría eliminada', 'success');
    setConfirmDelete(null);
  };

  const catToDelete = confirmDelete
    ? categories.find((c) => c.id === confirmDelete.id)
    : null;

  return (
    <div className="fh-print-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Organización
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Categorías
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Clasifica tus ingresos y gastos
          </p>
        </div>
        <PrimaryBtn onClick={openAdd}>
          <Plus size={15} />
          Nueva categoría
        </PrimaryBtn>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
        }}
      >
        <Group
          title="Ingresos"
          items={categories.filter((c) => c.type === 'income')}
          type="income"
          T={T}
          projections={projections}
          openEdit={openEdit}
          del={del}
        />
        <Group
          title="Gastos"
          items={categories.filter((c) => c.type === 'expense')}
          type="expense"
          T={T}
          projections={projections}
          openEdit={openEdit}
          del={del}
        />
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? 'Nueva categoría' : 'Editar categoría'}
          subtitle="Define nombre, tipo y color"
          onClose={() => setModal(null)}
          T={T}
        >
          <Field label="Nombre">
            <Input
              T={T}
              placeholder="Ej: Alimentación"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Sel
              T={T}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </Sel>
          </Field>
          <Field label="Color identificativo">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
                marginTop: '0.25rem',
              }}
            >
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                    border:
                      form.color === c
                        ? `3px solid ${T.title}`
                        : '3px solid transparent',
                    background: c,
                    cursor: 'pointer',
                    transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s',
                    boxShadow:
                      form.color === c
                        ? `0 0 0 2px white,0 0 0 4px ${c}`
                        : 'none',
                  }}
                />
              ))}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <PrimaryBtn onClick={save} fullWidth>
              <Check size={15} />
              Guardar
            </PrimaryBtn>
            <SecondaryBtn onClick={() => setModal(null)} T={T}>
              Cancelar
            </SecondaryBtn>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          T={T}
          danger={true}
          title="¿Eliminar categoría?"
          message={
            <>
              <strong>
                <em>Eliminar la categoría "{catToDelete?.name}"</em>
              </strong>
              . Si continúas, la categoría se borrará y dejará de estar
              disponible. Tendrás que crearla de nuevo manualmente si quieres
              volver a usarla.
            </>
          }
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Projections ───────────────────────────────────────────────────────────────
function Projections() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    fmtAccount,
    accounts,
    categories,
    projections,
    setProjections,
  } = useApp();
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');

  const emptyForm = {
    name: '',
    accountId: accounts[0]?.id || '',
    categoryId: '',
    type: 'expense',
    amount: '',
    frequency: 'monthly',
    startDate: today(),
    endDate: '',
    isRecurring: false,
    recurringDay: new Date().getDate(),
    nextOverrideAmount: null as number | null,
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const openAdd = () => {
    setForm({ ...emptyForm, accountId: accounts[0]?.id || '' });
    setErrors({});
    setModal('add');
  };
  const openEdit = (p) => {
    setForm({
      ...p,
      amount: p.amount.toFixed(2),
      isRecurring: p.isRecurring ?? false,
      recurringDay: p.recurringDay ?? new Date(p.startDate).getDate(),
      nextOverrideAmount: p.nextOverrideAmount ?? null,
    });
    setErrors({});
    setModal(p.id);
  };

  const handleStartDateChange = (val) => {
    let newEnd = form.endDate;
    if (newEnd) newEnd = syncEndDateDay(val, newEnd);
    setForm((f) => ({
      ...f,
      startDate: val,
      endDate: newEnd,
      // Si el día recurrente aún no fue editado manualmente,
      // lo sincronizamos con el nuevo día de inicio
      recurringDay: f.isRecurring
        ? new Date(val + 'T00:00:00').getDate()
        : f.recurringDay,
    }));
    setErrors((e) => ({ ...e, endDate: undefined }));
  };

  const handleEndDateChange = (val) => {
    const err =
      val && val < form.startDate
        ? 'La fecha de fin no puede ser anterior a la de inicio'
        : undefined;
    const synced = val ? syncEndDateDay(form.startDate, val) : val;
    setForm((f) => ({ ...f, endDate: synced }));
    setErrors((e) => ({ ...e, endDate: err }));
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'El concepto es obligatorio';
    if (!form.accountId) e.accountId = 'Debes seleccionar una cuenta';
    if (!form.categoryId) e.categoryId = 'Debes seleccionar una categoría';
    if (!form.amount || +form.amount <= 0)
      e.amount = 'Introduce un importe válido';
    if (form.endDate && form.endDate < form.startDate)
      e.endDate = 'La fecha de fin no puede ser anterior a la de inicio';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    // Si la proyección ya se aplicó este mes, preservamos lastApplied
    // para evitar doble generación aunque cambiemos el día
    const existingProj =
      modal !== 'add' ? projections.find((p) => p.id === modal) : null;

    const preserveLastApplied = existingProj?.lastApplied === currentMonthKey;

    const entry = {
      ...form,
      amount: +form.amount,
      isRecurring: form.isRecurring ?? false,
      recurringDay: form.isRecurring
        ? new Date(form.startDate + 'T00:00:00').getDate()
        : undefined,

      nextOverrideAmount: form.nextOverrideAmount ?? null,

      // Si ya se aplicó este mes, no limpiamos lastApplied
      lastApplied: preserveLastApplied
        ? currentMonthKey
        : form.isRecurring
        ? form.lastApplied
        : undefined,
    };

    if (modal === 'add') {
      setProjections((p) => [...p, { ...entry, id: uid() }]);
      toast('Proyección creada correctamente', 'success');
    } else {
      setProjections((p) =>
        p.map((x) => (x.id === modal ? { ...x, ...entry } : x))
      );
      toast('Proyección actualizada correctamente', 'success');
    }
    setModal(null);
  };
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const del = (id) => setConfirmDelete(id);
  const confirmDel = () => {
    setProjections((p) => p.filter((x) => x.id !== confirmDelete));
    toast('Proyección eliminada', 'success');
    setConfirmDelete(null);
  };

  const projToDelete = projections.find((p) => p.id === confirmDelete);

  const filtered = projections
    .filter((p) => filterType === 'all' || p.type === filterType)
    .filter((p) => filterAccount === 'all' || p.accountId === filterAccount);

  const grouped = accounts
    .map((acc) => ({
      account: acc,
      items: filtered.filter((p) => p.accountId === acc.id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fh-print-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Planificación
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Proyecciones
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Ingresos y gastos recurrentes por cuenta
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton T={T} />
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nueva proyección
          </PrimaryBtn>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            ['all', 'Todas'],
            ['income', 'Ingresos'],
            ['expense', 'Gastos'],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: filterType === v ? 'none' : `1px solid ${T.cardBorder}`,
                background: filterType === v ? T.accent : T.cardBg,
                color: filterType === v ? '#fff' : T.muted,
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '0.75rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
          }}
        >
          <Filter size={14} color={T.muted} />
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              color: T.body,
              fontSize: '0.8rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {grouped.map(({ account, items }) => (
          <div key={account.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.875rem',
              }}
            >
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.5rem',
                  background: T.accentLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={14} color={T.accent} />
              </div>
              <div
                style={{ fontSize: '0.9rem', fontWeight: 800, color: T.title }}
              >
                {account.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: T.muted }}>
                {items.length} proyección{items.length !== 1 ? 'es' : ''}
              </div>
              <div
                style={{ flex: 1, height: '1px', background: T.cardBorder }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {items.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const freq = FREQUENCIES.find((f) => f.value === p.frequency);
                const mEq = freq ? p.amount / freq.months : p.amount;
                return (
                  <Card key={p.id} T={T}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        padding: '1.125rem 1.5rem',
                      }}
                    >
                      <div
                        style={{
                          width: '0.25rem',
                          alignSelf: 'stretch',
                          borderRadius: '9999px',
                          background: cat?.color || T.cardBorder,
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '0.75rem',
                          background: cat?.color + '22' || T.pageBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.type === 'income' ? (
                          <ArrowUpCircle
                            size={16}
                            color={cat?.color || T.green}
                          />
                        ) : (
                          <ArrowDownCircle
                            size={16}
                            color={cat?.color || T.red}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: T.title,
                            }}
                          >
                            {p.name}
                          </span>
                          <Badge type={p.type} T={T} />
                        </div>
                        <div style={{ fontSize: '0.775rem', color: T.muted }}>
                          {cat?.name} · {freq?.label} · Desde {p.startDate}
                          {p.endDate ? ` hasta ${p.endDate}` : ''}
                        </div>
                        {/* Badge recurrente */}
                        {p.isRecurring && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              marginTop: '0.3rem',
                              flexWrap: 'wrap' as const,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: T.accentLight,
                                color: T.accent,
                                border: `1px solid ${T.accent}33`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              🔄 Automático · día{' '}
                              {new Date(p.startDate + 'T00:00:00').getDate()}
                            </span>

                            {p.lastApplied && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  background: T.greenBg,
                                  color: T.green,
                                  border: `1px solid ${T.greenBorder}`,
                                }}
                              >
                                ✅ Aplicado: {p.lastApplied}
                              </span>
                            )}
                            {p.hasDuplicateWarning && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  background: T.redBg,
                                  color: T.red,
                                  border: `1px solid ${T.redBorder}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                ⚠️ Posible duplicado · {p.duplicateWarningMonth}
                              </span>
                            )}
                          </div>
                        )}
                        {p.nextOverrideAmount && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: T.amberBg,
                              color: T.amber,
                              border: `1px solid ${T.amberBorder}`,
                            }}
                          >
                            {(() => {
                              const acc = accounts.find(
                                (a) => a.id === p.accountId
                              );
                              const currency = acc?.currency ?? baseCurrency;
                              const symbol =
                                CURRENCIES.find((c) => c.code === currency)
                                  ?.symbol ?? '';
                              const amount = Number(
                                p.nextOverrideAmount
                              ).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                              return `⚠️ Próximo cargo: ${symbol}${amount} ${currency}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            color: p.type === 'income' ? T.green : T.red,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {(() => {
                            const acc = accounts.find(
                              (a) => a.id === p.accountId
                            );
                            return fmtAccount(
                              p.amount,
                              acc?.currency ?? baseCurrency
                            );
                          })()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: T.muted }}>
                          ≈{' '}
                          {(() => {
                            const acc = accounts.find(
                              (a) => a.id === p.accountId
                            );
                            return fmtAccount(
                              mEq,
                              acc?.currency ?? baseCurrency
                            );
                          })()}
                          /mes
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          flexShrink: 0,
                          alignItems: 'center',
                        }}
                      >
                        {/* Botón ajuste rápido próximo mes */}
                        <button
                          onClick={() => {
                            openEdit(p);
                          }}
                          title="Ajustar importe del próximo mes"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.35rem 0.625rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${
                              p.nextOverrideAmount
                                ? T.amberBorder
                                : T.cardBorder
                            }`,
                            background: p.nextOverrideAmount
                              ? T.amberBg
                              : T.pageBg,
                            color: p.nextOverrideAmount ? T.amber : T.muted,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          💶
                        </button>
                        <GhostBtn
                          onClick={() => openEdit(p)}
                          T={T}
                          aria-label={`Editar ${p.name}`}
                        >
                          <Pencil size={15} />
                        </GhostBtn>
                        <GhostBtn
                          onClick={() => del(p.id)}
                          T={T}
                          color={T.red}
                          aria-label={`Eliminar ${p.name}`}
                        >
                          <Trash2 size={15} />
                        </GhostBtn>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              color: T.muted,
            }}
          >
            <TrendingUp
              size={48}
              color={T.muted}
              style={{ margin: '0 auto 1rem', opacity: 0.2 }}
            />
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                marginBottom: '0.5rem',
              }}
            >
              {filterType === 'all' && filterAccount === 'all'
                ? 'Todavía no tienes proyecciones'
                : 'No hay proyecciones con estos filtros'}
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: T.muted,
                marginBottom: '1.5rem',
              }}
            >
              {filterType === 'all' && filterAccount === 'all'
                ? 'Añade ingresos y gastos recurrentes para ver tu previsión futura.'
                : 'Prueba a cambiar los filtros o crea una nueva proyección.'}
            </p>
            <PrimaryBtn onClick={openAdd}>
              <Plus size={15} />
              Crear primera proyección
            </PrimaryBtn>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? 'Nueva proyección' : 'Editar proyección'}
          subtitle="Define un ingreso o gasto recurrente"
          onClose={() => setModal(null)}
          T={T}
        >
          <Field label="Concepto" error={errors.name}>
            <Input
              T={T}
              error={errors.name}
              placeholder="Ej: Alquiler piso"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors((er) => ({ ...er, name: undefined }));
              }}
            />
          </Field>
          <Field label="Cuenta asociada *" error={errors.accountId}>
            <Sel
              T={T}
              value={form.accountId}
              onChange={(e) => {
                setForm({ ...form, accountId: e.target.value });
                setErrors((er) => ({ ...er, accountId: undefined }));
              }}
            >
              <option value="">— Selecciona una cuenta —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Sel>
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Tipo">
              <Sel
                T={T}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value, categoryId: '' })
                }
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </Sel>
            </Field>
            <Field label="Categoría" error={errors.categoryId}>
              <div
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <div style={{ flex: 1 }}>
                  <Sel
                    T={T}
                    value={form.categoryId}
                    onChange={(e) => {
                      setForm({ ...form, categoryId: e.target.value });
                      setErrors((er) => ({ ...er, categoryId: undefined }));
                    }}
                  >
                    <option value="">— Categoría —</option>
                    {categories
                      .filter((c) => c.type === form.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Sel>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickCategory(true)}
                  title="Crear nueva categoría"
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.75rem',
                    border: `1.5px solid ${T.accent}44`,
                    background: T.accentLight,
                    color: T.accent,
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              </div>
            </Field>

            {/* Mini-modal de nueva categoría */}
            {showQuickCategory && (
              <QuickCategoryModal
                T={T}
                defaultType={form.type as 'income' | 'expense'}
                onSave={(newCat) => {
                  setForm((f) => ({ ...f, categoryId: newCat.id }));
                  setShowQuickCategory(false);
                }}
                onClose={() => setShowQuickCategory(false)}
              />
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Importe" error={errors.amount}>
              <Input
                T={T}
                error={errors.amount}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  setErrors((er) => ({ ...er, amount: undefined }));
                }}
              />
            </Field>

            <Field label="Frecuencia">
              <Sel
                T={T}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Sel>
            </Field>
          </div>

          {/* ── Ajuste puntual del próximo mes ── */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.875rem',
              background: form.nextOverrideAmount ? T.amberBg : T.pageBg,
              border: `1.5px solid ${
                form.nextOverrideAmount ? T.amberBorder : T.cardBorder
              }`,
              marginBottom: '0.75rem',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: form.nextOverrideAmount ? T.amber : T.muted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: '0.35rem',
              }}
            >
              💶 Ajuste para el próximo mes (opcional)
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginBottom: '0.625rem',
                lineHeight: 1.5,
              }}
            >
              Si este mes el importe será diferente al habitual, indícalo aquí.
              El siguiente mes volverá automáticamente al importe habitual.
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder={`Importe habitual: ${form.amount || '0.00'}`}
              value={form.nextOverrideAmount ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  nextOverrideAmount: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                }))
              }
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${
                  form.nextOverrideAmount ? T.amberBorder : T.inputBorder
                }`,
                background: T.inputBg,
                color: T.inputText,
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
            {form.nextOverrideAmount && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  background: T.amberBg,
                  border: `1px solid ${T.amberBorder}`,
                }}
              >
                <span
                  style={{
                    fontSize: '0.775rem',
                    color: T.amber,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Próximo mes:{' '}
                  <strong>
                    {CURRENCIES.find(
                      (c) =>
                        c.code ===
                        (accounts.find((a) => a.id === form.accountId)
                          ?.currency ?? baseCurrency)
                    )?.symbol ?? ''}
                    {Number(form.nextOverrideAmount).toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {accounts.find((a) => a.id === form.accountId)?.currency ??
                      baseCurrency}
                  </strong>
                </span>
                <button
                  onClick={() =>
                    setForm((f) => ({ ...f, nextOverrideAmount: null }))
                  }
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${T.amberBorder}`,
                    background: 'transparent',
                    color: T.amber,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Quitar ajuste
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Fecha inicio">
              <Input
                T={T}
                type="date"
                value={form.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </Field>
            <Field label="Fecha fin (opcional)" error={errors.endDate}>
              <Input
                T={T}
                error={errors.endDate}
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </Field>
          </div>

          {form.startDate && (
            <div
              style={{
                fontSize: '0.75rem',
                color: T.muted,
                padding: '0.6rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
                marginBottom: '0.5rem',
              }}
            >
              📅 El día de cobro/pago será el{' '}
              <strong style={{ color: T.body }}>
                día {new Date(form.startDate + 'T00:00:00').getDate()}
              </strong>{' '}
              de cada período
              {form.isRecurring && ' (cargo automático)'}
              {form.endDate && `. Finaliza el ${form.endDate}`}.
            </div>
          )}

          {/* ── Toggle recurrente ── */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.875rem',
              background: form.isRecurring ? T.accentLight : T.pageBg,
              border: `1.5px solid ${
                form.isRecurring ? T.accent : T.cardBorder
              }`,
              marginBottom: '0.75rem',
              transition: 'all 0.2s',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.isRecurring ?? false}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isRecurring: e.target.checked,
                  }))
                }
                style={{
                  width: '1.125rem',
                  height: '1.125rem',
                  cursor: 'pointer',
                  accentColor: T.accent,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: form.isRecurring ? T.accent : T.title,
                  }}
                >
                  🔄 Es un cargo fijo confirmado
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: T.muted,
                    marginTop: '0.1rem',
                  }}
                >
                  Se generará como gasto real automáticamente al vencer
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <PrimaryBtn onClick={save} fullWidth>
              <Check size={15} />
              Guardar proyección
            </PrimaryBtn>
            <SecondaryBtn onClick={() => setModal(null)} T={T}>
              Cancelar
            </SecondaryBtn>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar proyección?"
          message={`Vas a eliminar "${projToDelete?.name}". Esta acción no se puede deshacer.`}
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Forecast ─────────────────────────────────────────────────────────────────
function Forecast() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    accounts,
    forecastAll,
    forecastByAccount,
  } = useApp();
  const [selectedAccount, setSelectedAccount] = useState('all');

  const activeForecast =
    selectedAccount === 'all'
      ? forecastAll
      : forecastByAccount[selectedAccount] || [];

  const activeAccount = accounts.find((a) => a.id === selectedAccount);
  const startBalance =
    selectedAccount === 'all'
      ? accounts.reduce((s, a) => s + a.balance, 0)
      : activeAccount?.balance || 0;

  const maxBal = useMemo(
    () => Math.max(...activeForecast.map((m) => m.runningBalance), 1),
    [activeForecast]
  );

  return (
    <div className="fh-print-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Análisis
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Previsión de saldos
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Evolución proyectada a 12 meses
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <PrintButton T={T} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <Filter size={14} color={T.muted} />
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '1rem 1.25rem',
          borderRadius: '1rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          marginBottom: '1.5rem',
        }}
      >
        <Wallet size={18} color={T.accent} />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.accent }}>
            {selectedAccount === 'all'
              ? `Todas las cuentas — ${accounts.length} cuentas`
              : activeAccount?.name}
          </div>
          <div
            style={{ fontSize: '0.75rem', color: T.muted, marginTop: '0.1rem' }}
          >
            Saldo inicial:{' '}
            <strong style={{ color: T.body }}>
              {fmt(startBalance, displayCurrency, baseCurrency, rates)}
            </strong>
            {selectedAccount !== 'all' &&
              ` · Mínimo: ${fmt(
                activeAccount?.minBalance || 0,
                displayCurrency,
                baseCurrency,
                rates
              )}`}
          </div>
        </div>
      </div>

      <Card T={T} style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: T.muted,
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}
        >
          Gráfico de evolución
        </div>
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            marginBottom: '1.5rem',
          }}
        >
          Saldo estimado mensual
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            height: '14rem',
          }}
        >
          {activeForecast.map((m, i) => {
            const pct = (m.runningBalance / maxBal) * 100;
            const isNeg = m.runningBalance < 0;
            const totalMinBalance = accounts.reduce(
              (s, a) => s + (a.minBalance || 0),
              0
            );
            const belowMin =
              selectedAccount === 'all'
                ? m.runningBalance < totalMinBalance
                : m.runningBalance < (activeAccount?.minBalance || 0);
            return (
              <div
                key={m.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <div
                  title={fmt(
                    m.runningBalance,
                    displayCurrency,
                    baseCurrency,
                    rates
                  )}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '11rem',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      fontSize: '0.55rem',
                      color: T.muted,
                      textAlign: 'center',
                      marginBottom: '0.2rem',
                      fontWeight: 700,
                    }}
                  >
                    {fmt(
                      m.runningBalance,
                      displayCurrency,
                      baseCurrency,
                      rates
                    )}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '0.375rem 0.375rem 0 0',
                      background: isNeg
                        ? T.red
                        : belowMin
                        ? T.amber
                        : i === 0
                        ? T.accent
                        : '#93c5fd',
                      height: `${Math.max(pct, 3)}%`,
                      transition: 'height 0.5s ease',
                      opacity: i === 0 ? 1 : 0.8,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: T.muted,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {m.label.slice(0, 3).toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.75rem',
            color: T.muted,
          }}
        >
          <span
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.2rem',
                background: T.accent,
                display: 'inline-block',
              }}
            />{' '}
            Normal
          </span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.2rem',
                background: T.amber,
                display: 'inline-block',
              }}
            />{' '}
            Bajo mínimo
          </span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.2rem',
                background: T.red,
                display: 'inline-block',
              }}
            />{' '}
            Negativo
          </span>
        </div>
      </Card>

      <Card T={T} style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.25rem 1.75rem 0.75rem',
            borderBottom: `1px solid ${T.tableBorder}`,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.2rem',
            }}
          >
            Detalle mensual
          </div>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
          >
            Tabla de previsión completa
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: T.tableHead,
                  borderBottom: `2px solid ${T.tableBorder}`,
                }}
              >
                {[
                  'Mes',
                  'Ingresos',
                  'Gastos',
                  'Balance neto',
                  'Saldo estimado',
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: T.muted,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeForecast.map((m, i) => {
                const totalMinBalance = accounts.reduce(
                  (s, a) => s + (a.minBalance || 0),
                  0
                );
                const belowMin =
                  selectedAccount === 'all'
                    ? m.runningBalance < totalMinBalance
                    : m.runningBalance < (activeAccount?.minBalance || 0);
                return (
                  <tr
                    key={m.key}
                    style={{
                      background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                      borderBottom: `1px solid ${T.tableBorder}`,
                    }}
                  >
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        fontWeight: 700,
                        color: T.title,
                        textTransform: 'capitalize',
                      }}
                    >
                      {m.label}
                    </td>
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: T.green,
                      }}
                    >
                      {fmt(m.income, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: T.red,
                      }}
                    >
                      {fmt(m.expense, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: m.net >= 0 ? T.green : T.red,
                      }}
                    >
                      {m.net >= 0 ? '+' : ''}
                      {fmt(m.net, displayCurrency, baseCurrency, rates)}
                    </td>
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color:
                          m.runningBalance < 0
                            ? T.red
                            : belowMin
                            ? T.amber
                            : T.accent,
                      }}
                    >
                      {fmt(
                        m.runningBalance,
                        displayCurrency,
                        baseCurrency,
                        rates
                      )}
                      {belowMin && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            display: 'block',
                            color: T.amber,
                            fontWeight: 600,
                          }}
                        >
                          ⚠ Bajo mínimo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
        }}
      >
        <AlertTriangle
          size={15}
          color={T.muted}
          style={{ flexShrink: 0, marginTop: '0.1rem' }}
        />
        <span style={{ fontSize: '0.775rem', color: T.muted, lineHeight: 1.5 }}>
          El saldo estimado parte del saldo actual de{' '}
          <strong style={{ color: T.body }}>
            {selectedAccount === 'all'
              ? 'todas las cuentas'
              : activeAccount?.name}
          </strong>{' '}
          ({fmt(startBalance, displayCurrency, baseCurrency, rates)}) y aplica
          únicamente las proyecciones asignadas. No incluye movimientos no
          proyectados.
        </span>
      </div>
    </div>
  );
}
// ─── QuickCategoryModal ───────────────────────────────────────────────────────
function QuickCategoryModal({
  T,
  defaultType,
  onSave,
  onClose,
}: {
  T: any;
  defaultType: 'income' | 'expense';
  onSave: (cat: {
    id: string;
    name: string;
    type: string;
    color: string;
  }) => void;
  onClose: () => void;
}) {
  const { categories, setCategories } = useApp();
  const toast = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    const newCat = { id: uid(), name: name.trim(), type, color };
    setCategories((prev) => [...prev, newCat]);
    toast('Categoría creada correctamente', 'success');
    onSave(newCat);
  };

  return (
    <Modal
      title="Nueva categoría"
      subtitle="Define nombre, tipo y color"
      onClose={onClose}
      T={T}
    >
      <Field label="Nombre" error={error}>
        <Input
          T={T}
          placeholder="Ej: Alimentación"
          value={name}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </Field>

      <Field label="Tipo">
        <Sel
          T={T}
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="income">Ingreso</option>
          <option value="expense">Gasto</option>
        </Sel>
      </Field>

      <Field label="Color identificativo">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.625rem',
            marginTop: '0.25rem',
          }}
        >
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '50%',
                border:
                  color === c
                    ? `3px solid ${T.title}`
                    : '3px solid transparent',
                background: c,
                cursor: 'pointer',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s',
                boxShadow:
                  color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </Field>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <PrimaryBtn onClick={handleSave} fullWidth>
          <Check size={15} />
          Guardar
        </PrimaryBtn>
        <SecondaryBtn onClick={onClose} T={T}>
          Cancelar
        </SecondaryBtn>
      </div>
    </Modal>
  );
}

// ─── RealExpenses ─────────────────────────────────────────────────────────────
function RealExpenses() {
  const {
    T,
    accounts,
    setAccounts,
    categories,
    baseCurrency,
    displayCurrency,
    rates,
    realExpenses,
    setRealExpenses,
    realFilterType,
    setRealFilterType,
    realFilterAccount,
    setRealFilterAccount,
    realFilterCategory,
    setRealFilterCategory,
    realFilterDateMode,
    setRealFilterDateMode,
    realFilterPreset,
    setRealFilterPreset,
    realFilterDateFrom,
    setRealFilterDateFrom,
    realFilterDateTo,
    setRealFilterDateTo,
    dateFormat,
  } = useApp();

  const toast = useToast();

  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { realAccountFilter, setRealAccountFilter } = useApp();

  const filterType = realFilterType;
  const setFilterType = setRealFilterType;
  const filterAccount = realFilterAccount;
  const setFilterAccount = setRealFilterAccount;
  const filterCategory = realFilterCategory;
  const setFilterCategory = setRealFilterCategory;
  const filterDateMode = realFilterDateMode;
  const setFilterDateMode = setRealFilterDateMode;
  const filterPreset = realFilterPreset;
  const setFilterPreset = setRealFilterPreset;
  const filterDateFrom = realFilterDateFrom;
  const setFilterDateFrom = setRealFilterDateFrom;
  const filterDateTo = realFilterDateTo;
  const setFilterDateTo = setRealFilterDateTo;

  const [warningModal, setWarningModal] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showQuickCategory, setShowQuickCategory] = useState(false);

  // Sincroniza si llegamos desde otra pestaña con filtro
  useEffect(() => {
    if (realAccountFilter && realAccountFilter !== 'all') {
      setFilterAccount(realAccountFilter);
      setRealAccountFilter('all'); // resetea para próximas visitas
    }
  }, []);

  const emptyForm = {
    entryDate: today(),
    valueDate: today(),
    description: '',
    categoryId: '',
    amount: '',
    currency: accounts[0]?.currency ?? baseCurrency,
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Cuando cambia la cuenta, actualizamos la divisa por defecto
  const handleAccountChange = (accountId) => {
    const acc = accounts.find((a) => a.id === accountId);
    setForm((f) => ({
      ...f,
      accountId,
      currency: acc?.currency ?? baseCurrency,
    }));
    setErrors((e) => ({ ...e, accountId: undefined }));
  };

  const openAdd = () => {
    const firstAcc = accounts[0];
    setForm({
      ...emptyForm,
      accountId: firstAcc?.id ?? '',
      currency: firstAcc?.currency ?? baseCurrency,
    });
    setErrors({});
    setModal('add');
  };

  const openEdit = (expense) => {
    setForm({ ...expense, amount: expense.amount.toFixed(2) });
    setErrors({});
    setModal(expense.id);
  };

  const validate = () => {
    const e = {};
    if (!form.description.trim())
      e.description = 'La descripción es obligatoria';
    if (!form.accountId) e.accountId = 'Debes seleccionar una cuenta';
    if (!form.categoryId) e.categoryId = 'Debes seleccionar una categoría';
    if (!form.amount || +form.amount <= 0)
      e.amount = 'Introduce un importe válido';
    if (!form.entryDate) e.entryDate = 'La fecha de apunte es obligatoria';
    if (!form.valueDate) e.valueDate = 'La fecha de valor es obligatoria';
    return e;
  };

  const save = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const entry = { ...form, amount: +form.amount };

    // Comprobamos si el valueDate es anterior o igual al saldo base de la cuenta
    const linkedAccount = accounts.find((a) => a.id === form.accountId);
    const isBeforeBase = linkedAccount && form.valueDate <= linkedAccount.date;

    if (modal === 'add') {
      setRealExpenses((p) => [...p, { ...entry, id: uid() }]);
      if (isBeforeBase) {
        setWarningModal(
          `El movimiento se ha guardado correctamente, pero su fecha de valor (${form.valueDate}) es anterior o igual a la fecha del saldo base de la cuenta "${linkedAccount.name}" (${linkedAccount.date}).\n\nEste movimiento NO se aplicará al saldo real calculado, ya que se considera incluido en el saldo base que introdujiste.`
        );
      } else {
        toast('Gasto real registrado correctamente', 'success');
      }
    } else {
      setRealExpenses((p) =>
        p.map((x) => (x.id === modal ? { ...x, ...entry } : x))
      );
      if (isBeforeBase) {
        setWarningModal(
          `El movimiento se ha actualizado correctamente, pero su fecha de valor (${form.valueDate}) es anterior o igual a la fecha del saldo base de la cuenta "${linkedAccount.name}" (${linkedAccount.date}).\n\nEste movimiento NO se aplicará al saldo real calculado, ya que se considera incluido en el saldo base que introdujiste.`
        );
      } else {
        toast('Gasto real actualizado correctamente', 'success');
      }
    }
    setModal(null);
  };

  const del = (id) => setConfirmDelete(id);
  const confirmDel = () => {
    const deletedId = confirmDelete;
    setRealExpenses((p) => p.filter((x) => x.id !== deletedId));
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        acknowledgedExpenseIds: (a.acknowledgedExpenseIds ?? []).filter(
          (id) => id !== deletedId
        ),
      }))
    );
    toast('Gasto real eliminado', 'success');
    setConfirmDelete(null);
  };

  const expenseToDelete = realExpenses.find((e) => e.id === confirmDelete);

  const dismissDuplicateWarning = (id: string) => {
    setRealExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, isDuplicateWarning: false, duplicateReviewed: true }
          : e
      )
    );
  };

  // ── Rango de fechas activo según el modo ──────────────────────────────────
  const activeDateRange = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (filterDateMode === 'range') {
      return { from: filterDateFrom || null, to: filterDateTo || null };
    }

    // Presets
    switch (filterPreset) {
      case 'this_month': {
        const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
        const to = ymd(now);
        return { from, to };
      }
      case 'last_month': {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const from = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        const to = ymd(last);
        return { from, to };
      }
      case 'last_3': {
        const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return {
          from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
          to: ymd(now),
        };
      }
      case 'last_6': {
        const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return {
          from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
          to: ymd(now),
        };
      }
      case 'this_year': {
        return { from: `${now.getFullYear()}-01-01`, to: ymd(now) };
      }
      default:
        return { from: null, to: null };
    }
  }, [filterDateMode, filterPreset, filterDateFrom, filterDateTo]);

  const filtered = realExpenses
    .filter((e) => filterType === 'all' || e.type === filterType)
    .filter((e) => filterAccount === 'all' || e.accountId === filterAccount)
    .filter((e) => filterCategory === 'all' || e.categoryId === filterCategory)
    .filter((e) => {
      if (!activeDateRange.from && !activeDateRange.to) return true;
      const d = e.valueDate;
      if (activeDateRange.from && d < activeDateRange.from) return false;
      if (activeDateRange.to && d > activeDateRange.to) return false;
      return true;
    })
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate));

  // Totales del período filtrado
  const totalIncome = filtered
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const totalExpense = filtered
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const currencySymbol = (code) =>
    CURRENCIES.find((c) => c.code === code)?.symbol ?? code;

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAccount !== 'all' ||
    filterCategory !== 'all' ||
    filterPreset !== 'all' ||
    filterDateFrom !== '' ||
    filterDateTo !== '';

  const clearAllFilters = () => {
    setFilterType('all');
    setFilterAccount('all');
    setFilterCategory('all');
    setFilterPreset('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterDateMode('preset');
  };

  return (
    <div className="fh-print-section">
      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Seguimiento
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Gastos Reales
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Registra tus movimientos reales
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton T={T} />
          <button
            onClick={() => setShowImport(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.125rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.greenBorder}`,
              background: T.greenBg,
              color: T.green,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🏦 Importar CSV
          </button>
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nuevo movimiento
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Resumen de totales ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          {
            label: 'Total ingresos',
            value: fmt(totalIncome, displayCurrency, displayCurrency, rates),
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
          {
            label: 'Total gastos',
            value: fmt(totalExpense, displayCurrency, displayCurrency, rates),
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
          },
          {
            label: 'Balance real',
            value: fmt(
              totalIncome - totalExpense,
              displayCurrency,
              displayCurrency,
              rates
            ),
            color: totalIncome - totalExpense >= 0 ? T.green : T.red,
            bg: totalIncome - totalExpense >= 0 ? T.greenBg : T.redBg,
            border:
              totalIncome - totalExpense >= 0 ? T.greenBorder : T.redBorder,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.4rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.03em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Barra de filtros compacta */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: '1rem',
            background: T.accentLight,
            border: `1px solid ${T.accent}33`,
            flexWrap: 'wrap',
          }}
        >
          {/* Icono filtro */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 0.375rem',
              color: T.muted,
              flexShrink: 0,
            }}
          >
            <Filter size={14} />
          </div>

          {/* Separador vertical */}
          <div
            style={{
              width: '1px',
              height: '1.25rem',
              background: T.cardBorder,
              flexShrink: 0,
            }}
          />

          {/* Tipo */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(
              [
                ['all', 'Todos'],
                ['income', '↑ Ingresos'],
                ['expense', '↓ Gastos'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilterType(v)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  border: 'none',
                  background: filterType === v ? T.accent : 'transparent',
                  color: filterType === v ? '#fff' : T.muted,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Separador vertical */}
          <div
            style={{
              width: '1px',
              height: '1.25rem',
              background: T.cardBorder,
              flexShrink: 0,
            }}
          />

          {/* Cuenta */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            style={{
              padding: '0.35rem 0.625rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                filterAccount !== 'all' ? T.accent : 'transparent'
              }`,
              background:
                filterAccount !== 'all' ? T.accentLight : 'transparent',
              color: filterAccount !== 'all' ? T.accent : T.muted,
              fontSize: '0.775rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Separador vertical */}
          <div
            style={{
              width: '1px',
              height: '1.25rem',
              background: T.cardBorder,
              flexShrink: 0,
            }}
          />

          {/* Categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '0.35rem 0.625rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                filterCategory !== 'all' ? T.accent : 'transparent'
              }`,
              background:
                filterCategory !== 'all' ? T.accentLight : 'transparent',
              color: filterCategory !== 'all' ? T.accent : T.muted,
              fontSize: '0.775rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Separador vertical */}
          <div
            style={{
              width: '1px',
              height: '1.25rem',
              background: T.cardBorder,
              flexShrink: 0,
            }}
          />

          {/* Fechas — toggle preset/rango */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <select
              value={filterDateMode === 'range' ? '__range__' : filterPreset}
              onChange={(e) => {
                if (e.target.value === '__range__') {
                  setFilterDateMode('range');
                } else {
                  setFilterDateMode('preset');
                  setFilterPreset(e.target.value);
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }
              }}
              style={{
                padding: '0.35rem 0.625rem',
                borderRadius: '0.5rem',
                border: `1px solid ${
                  filterPreset !== 'all' || filterDateMode === 'range'
                    ? T.accent
                    : 'transparent'
                }`,
                background:
                  filterPreset !== 'all' || filterDateMode === 'range'
                    ? T.accentLight
                    : 'transparent',
                color:
                  filterPreset !== 'all' || filterDateMode === 'range'
                    ? T.accent
                    : T.muted,
                fontSize: '0.775rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Todas las fechas</option>
              <option value="this_month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="last_3">Últimos 3 meses</option>
              <option value="last_6">Últimos 6 meses</option>
              <option value="this_year">Este año</option>
              <option value="__range__">Rango personalizado…</option>
            </select>

            {/* Inputs de rango — solo si está en modo rango */}
            {filterDateMode === 'range' && (
              <>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${T.cardBorder}`,
                    background: T.inputBg,
                    color: T.inputText,
                    fontSize: '0.72rem',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: T.muted }}>→</span>
                <input
                  type="date"
                  value={filterDateTo}
                  min={filterDateFrom}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${T.cardBorder}`,
                    background: T.inputBg,
                    color: T.inputText,
                    fontSize: '0.72rem',
                    outline: 'none',
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Barra de resultados + chips activos */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.75rem',
              background: T.accent + '22',
              border: `1px solid ${T.accent}55`,
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Chips de filtros activos */}
            <div
              style={{
                display: 'flex',
                gap: '0.375rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.accent,
                  marginRight: '0.125rem',
                }}
              >
                Filtros activos:
              </span>

              {filterType !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.cardBg,
                    border: `1px solid ${T.accent}44`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  {filterType === 'income' ? '↑ Ingresos' : '↓ Gastos'}
                  <button
                    onClick={() => setFilterType('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.accent,
                      padding: 0,
                      lineHeight: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}

              {filterAccount !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.cardBg,
                    border: `1px solid ${T.accent}44`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  🏦{' '}
                  {accounts.find((a) => a.id === filterAccount)?.name ??
                    filterAccount}
                  <button
                    onClick={() => setFilterAccount('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.accent,
                      padding: 0,
                      lineHeight: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}

              {filterCategory !== 'all' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.cardBg,
                    border: `1px solid ${T.accent}44`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  🏷️{' '}
                  {categories.find((c) => c.id === filterCategory)?.name ??
                    filterCategory}
                  <button
                    onClick={() => setFilterCategory('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.accent,
                      padding: 0,
                      lineHeight: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}

              {(filterPreset !== 'all' || filterDateMode === 'range') && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    background: T.cardBg,
                    border: `1px solid ${T.accent}44`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: T.accent,
                  }}
                >
                  📅{' '}
                  {filterDateMode === 'range'
                    ? `${filterDateFrom || '…'} → ${filterDateTo || '…'}`
                    : {
                        this_month: 'Este mes',
                        last_month: 'Mes anterior',
                        last_3: 'Últimos 3 meses',
                        last_6: 'Últimos 6 meses',
                        this_year: 'Este año',
                      }[filterPreset]}
                  <button
                    onClick={() => {
                      setFilterPreset('all');
                      setFilterDateMode('preset');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.accent,
                      padding: 0,
                      lineHeight: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            {/* Contador + limpiar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: T.accent,
                }}
              >
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${T.accent}44`,
                  background: T.cardBg,
                  color: T.accent,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Limpiar todo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lista de movimientos ── */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
      >
        {filtered.map((expense) => {
          const cat = categories.find((c) => c.id === expense.categoryId);
          const acc = accounts.find((a) => a.id === expense.accountId);
          const amountInDisplay = convertAmount(
            expense.amount,
            expense.currency,
            displayCurrency,
            rates
          );
          return (
            <Card key={expense.id} T={T}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.125rem 1.5rem',
                }}
              >
                {/* Barra de color */}
                <div
                  style={{
                    width: '0.25rem',
                    alignSelf: 'stretch',
                    borderRadius: '9999px',
                    background: cat?.color || T.cardBorder,
                    flexShrink: 0,
                  }}
                />

                {/* Icono */}
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.75rem',
                    background: (cat?.color ?? '#ccc') + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {expense.type === 'income' ? (
                    <ArrowUpCircle size={16} color={cat?.color || T.green} />
                  ) : (
                    <ArrowDownCircle size={16} color={cat?.color || T.red} />
                  )}
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: T.title,
                      }}
                    >
                      {expense.description}
                    </span>
                    <Badge type={expense.type} T={T} />
                  </div>
                  <div style={{ fontSize: '0.775rem', color: T.muted }}>
                    {cat?.name ?? '—'} · {acc?.name ?? '—'} ·{' '}
                    {fmtDateShort(expense.entryDate, dateFormat)}
                    {expense.notes?.includes('recurrente') && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          background: T.accentLight,
                          color: T.accent,
                          border: `1px solid ${T.accent}33`,
                          verticalAlign: 'middle',
                        }}
                      >
                        🔄 Recurrente
                      </span>
                    )}
                    {expense.isDuplicateWarning &&
                      !expense.duplicateReviewed && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginLeft: '0.5rem',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.5rem',
                            borderRadius: '9999px',
                            background: '#fff1f1',
                            color: '#e53e3e',
                            border: '1px solid #fed7d7',
                            verticalAlign: 'middle',
                            cursor: 'pointer',
                          }}
                          title="Haz clic para marcar como revisado"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            dismissDuplicateWarning(expense.id);
                          }}
                        >
                          ⚠️ Posible duplicado
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              lineHeight: 1,
                              opacity: 0.7,
                              marginLeft: '0.1rem',
                            }}
                          >
                            ✕
                          </span>
                        </span>
                      )}
                    {expense.notes && !expense.notes.includes('recurrente') && (
                      <span
                        style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}
                      >
                        · {expense.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Importe */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: expense.type === 'income' ? T.green : T.red,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {expense.type === 'income' ? '+' : '-'}
                    {currencySymbol(expense.currency)}
                    {expense.amount.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {expense.currency}
                  </div>
                  {expense.currency !== displayCurrency && (
                    <div style={{ fontSize: '0.75rem', color: T.muted }}>
                      ≈{' '}
                      {fmt(
                        amountInDisplay,
                        displayCurrency,
                        displayCurrency,
                        rates
                      )}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <GhostBtn onClick={() => openEdit(expense)} T={T}>
                    <Pencil size={15} />
                  </GhostBtn>
                  <GhostBtn onClick={() => del(expense.id)} T={T} color={T.red}>
                    <Trash2 size={15} />
                  </GhostBtn>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              color: T.muted,
            }}
          >
            <Receipt
              size={48}
              color={T.muted}
              style={{ margin: '0 auto 1rem', opacity: 0.2 }}
            />
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                marginBottom: '0.5rem',
              }}
            >
              {realExpenses.length === 0
                ? 'Todavía no tienes movimientos registrados'
                : 'No hay movimientos con estos filtros'}
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: T.muted,
                marginBottom: '1.5rem',
              }}
            >
              {realExpenses.length === 0
                ? 'Registra tu primer movimiento real para empezar el seguimiento.'
                : 'Prueba a cambiar los filtros.'}
            </p>
            {realExpenses.length === 0 && (
              <PrimaryBtn onClick={openAdd}>
                <Plus size={15} />
                Registrar primer movimiento
              </PrimaryBtn>
            )}
          </div>
        )}
      </div>

      {/* ── Modal de alta/edición ── */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Nuevo movimiento' : 'Editar movimiento'}
          subtitle="Registra un ingreso o gasto real"
          onClose={() => setModal(null)}
          T={T}
        >
          {/* Tipo */}
          <Field label="Tipo">
            <Sel
              T={T}
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value, categoryId: '' })
              }
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </Sel>
          </Field>

          {/* Descripción */}
          <Field label="Descripción" error={errors.description}>
            <Input
              T={T}
              error={errors.description}
              placeholder="Ej: Supermercado Mercadona"
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                setErrors((er) => ({ ...er, description: undefined }));
              }}
            />
          </Field>

          {/* Cuenta */}
          <Field label="Cuenta" error={errors.accountId}>
            <Sel
              T={T}
              value={form.accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
            >
              <option value="">— Selecciona una cuenta —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency ?? baseCurrency})
                </option>
              ))}
            </Sel>
          </Field>

          {/* Categoría */}
          <Field label="Categoría" error={errors.categoryId}>
            <div
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
              <div style={{ flex: 1 }}>
                <Sel
                  T={T}
                  value={form.categoryId}
                  onChange={(e) => {
                    setForm({ ...form, categoryId: e.target.value });
                    setErrors((er) => ({ ...er, categoryId: undefined }));
                  }}
                >
                  <option value="">— Selecciona una categoría —</option>
                  {categories
                    .filter((c) => c.type === form.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Sel>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCategory(true)}
                title="Crear nueva categoría"
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.accent}44`,
                  background: T.accentLight,
                  color: T.accent,
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>
          </Field>

          {/* Mini-modal de nueva categoría */}
          {showQuickCategory && (
            <QuickCategoryModal
              T={T}
              defaultType={form.type as 'income' | 'expense'}
              onSave={(newCat) => {
                setForm((f) => ({ ...f, categoryId: newCat.id }));
                setShowQuickCategory(false);
              }}
              onClose={() => setShowQuickCategory(false)}
            />
          )}

          {/* Importe y divisa */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Importe" error={errors.amount}>
              <Input
                T={T}
                error={errors.amount}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => {
                  setForm({ ...form, amount: e.target.value });
                  setErrors((er) => ({ ...er, amount: undefined }));
                }}
              />
            </Field>

            <Field label="Divisa">
              <Sel
                T={T}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </Sel>
            </Field>
          </div>

          {/* Info divisa */}
          {form.currency !== displayCurrency && form.amount > 0 && (
            <div
              style={{
                fontSize: '0.75rem',
                color: T.muted,
                padding: '0.6rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
                marginBottom: '0.5rem',
              }}
            >
              💱 Equivale aproximadamente a{' '}
              <strong style={{ color: T.body }}>
                {fmt(
                  convertAmount(
                    +form.amount,
                    form.currency,
                    displayCurrency,
                    rates
                  ),
                  displayCurrency,
                  displayCurrency,
                  rates
                )}
              </strong>
            </div>
          )}

          {/* Fechas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Field label="Fecha de apunte" error={errors.entryDate}>
              <Input
                T={T}
                type="date"
                value={form.entryDate}
                onChange={(e) => {
                  setForm({ ...form, entryDate: e.target.value });
                  setErrors((er) => ({ ...er, entryDate: undefined }));
                }}
              />
            </Field>
            <Field label="Fecha de valor" error={errors.valueDate}>
              <Input
                T={T}
                type="date"
                value={form.valueDate}
                onChange={(e) => {
                  setForm({ ...form, valueDate: e.target.value });
                  setErrors((er) => ({ ...er, valueDate: undefined }));
                }}
              />
            </Field>
          </div>

          {/* Notas */}
          <Field label="Notas (opcional)">
            <Input
              T={T}
              placeholder="Cualquier anotación adicional..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <PrimaryBtn onClick={save} fullWidth>
              <Check size={15} />
              Guardar movimiento
            </PrimaryBtn>
            <SecondaryBtn onClick={() => setModal(null)} T={T}>
              Cancelar
            </SecondaryBtn>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar movimiento?"
          message={`Vas a eliminar "${expenseToDelete?.description}". Esta acción no se puede deshacer.`}
          onConfirm={confirmDel}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Warning modal — movimiento fuera del rango del saldo base ── */}
      {warningModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.amberBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '28rem',
              padding: '1.75rem',
            }}
          >
            {/* Icono */}
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: T.amberBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AlertTriangle size={20} color={T.amber} />
            </div>

            {/* Título */}
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: T.title,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.02em',
              }}
            >
              ⚠️ Movimiento guardado — fuera del rango calculado
            </h3>

            {/* Mensaje */}
            <p
              style={{
                fontSize: '0.825rem',
                color: T.muted,
                lineHeight: 1.6,
                margin: '0 0 0.75rem',
                whiteSpace: 'pre-line',
              }}
            >
              {warningModal}
            </p>

            {/* Info adicional */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: T.amberBg,
                border: `1px solid ${T.amberBorder}`,
                fontSize: '0.775rem',
                color: T.amber,
                lineHeight: 1.5,
                marginBottom: '1.25rem',
              }}
            >
              💡 Si quieres que este movimiento afecte al saldo calculado, edita
              la <strong>Fecha del saldo base</strong> de la cuenta a una fecha
              anterior a la del movimiento.
            </div>

            {/* Botón */}
            <button
              onClick={() => setWarningModal(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: T.amber,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {/* ── Modal de importación bancaria ── */}
      {showImport && <BankImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ─── Goals ───────────────────────────────────────────────────────────────────
function Goals() {
  const {
    T,
    goals,
    setGoals,
    accounts,
    categories,
    realExpenses,
    displayCurrency,
    baseCurrency,
    rates,
    dateFormat,
  } = useApp();

  const toast = useToast();

  const [modal, setModal] = useState<null | 'add' | string>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const TOTAL_STEPS = 3;
  const GOAL_EMOJIS = [
    '🎯',
    '🏖️',
    '🚗',
    '🏠',
    '💍',
    '✈️',
    '📱',
    '🎓',
    '💪',
    '🐾',
    '🎸',
    '⛵',
    '🏔️',
    '🍀',
    '💎',
  ];
  const GOAL_COLORS = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#d97706',
    '#7c3aed',
    '#0891b2',
    '#db2777',
    '#ea580c',
    '#0d9488',
    '#4f46e5',
  ];

  const emptyForm: Omit<SavingsGoal, 'id'> = {
    name: '',
    emoji: '🎯',
    color: '#2563eb',
    targetAmount: 0,
    currency: baseCurrency,
    deadline: '',
    mode: 'manual',
    currentAmount: 0,
    categoryId: '',
    accountId: 'all',
    autoType: 'income',
    autoStartDate: today(),
  };

  const [form, setForm] = useState<Omit<SavingsGoal, 'id'>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validación por paso ───────────────────────────────────────────────────
  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = 'El nombre es obligatorio';
      if (!form.targetAmount || form.targetAmount <= 0)
        e.targetAmount = 'Introduce un importe válido';
    }
    if (s === 2) {
      if (form.mode === 'auto' && !form.categoryId)
        e.categoryId = 'Selecciona una categoría';
    }
    return e;
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const save = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    if (modal === 'add') {
      setGoals((prev) => [...prev, { ...form, id: uid() }]);
      toast('Objetivo creado correctamente', 'success');
    } else {
      setGoals((prev) =>
        prev.map((g) => (g.id === modal ? { ...g, ...form } : g))
      );
      toast('Objetivo actualizado correctamente', 'success');
    }
    setModal(null);
    setStep(1);
    setForm(emptyForm);
    setErrors({});
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setStep(1);
    setModal('add');
  };

  const openEdit = (goal: SavingsGoal) => {
    setForm({
      ...goal,
      targetAmount: parseFloat(goal.targetAmount.toFixed(2)),
      currentAmount: parseFloat((goal.currentAmount ?? 0).toFixed(2)),
    });
    setErrors({});
    setStep(1);
    setModal(goal.id);
  };

  const handleNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  // ── Estilos base del modal ────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: T.inputBg,
    border: `1.5px solid ${T.inputBorder}`,
    borderRadius: '0.75rem',
    padding: '0.65rem 0.875rem',
    fontSize: '0.875rem',
    color: T.inputText,
    outline: 'none',
    boxSizing: 'border-box',
  };

  // ── Render paso 1: nombre, emoji, meta, fecha ─────────────────────────────
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Emoji picker */}
      <Field label="Elige un icono">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {GOAL_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setForm((f) => ({ ...f, emoji: e }))}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.625rem',
                border: `2px solid ${
                  form.emoji === e ? T.accent : T.cardBorder
                }`,
                background: form.emoji === e ? T.accentLight : T.pageBg,
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>

      {/* Color picker */}
      <Field label="Color">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                border:
                  form.color === c
                    ? `3px solid ${T.title}`
                    : '3px solid transparent',
                background: c,
                cursor: 'pointer',
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s',
                boxShadow:
                  form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </Field>

      {/* Nombre */}
      <Field label="Nombre del objetivo" error={errors.name}>
        <Input
          T={T}
          error={errors.name}
          placeholder="Ej: Vacaciones de verano"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setErrors((er) => ({ ...er, name: undefined }));
          }}
          autoFocus
        />
      </Field>

      {/* Importe meta y divisa */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
      >
        <Field label="Importe objetivo" error={errors.targetAmount}>
          <Input
            T={T}
            error={errors.targetAmount}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.targetAmount || ''}
            onChange={(e) => {
              setForm((f) => ({
                ...f,
                targetAmount: parseFloat(e.target.value) || 0,
              }));
              setErrors((er) => ({ ...er, targetAmount: undefined }));
            }}
          />
        </Field>

        <Field label="Divisa">
          <Sel
            T={T}
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value }))
            }
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </Sel>
        </Field>
      </div>

      {/* Fecha límite */}
      <Field label="Fecha límite (opcional)">
        <Input
          T={T}
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
      </Field>

      {/* Preview del objetivo */}
      {form.name && form.targetAmount > 0 && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '1rem',
            background: T.accentLight,
            border: `1.5px solid ${form.color}33`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>{form.emoji}</span>
          <div>
            <div
              style={{ fontSize: '0.95rem', fontWeight: 800, color: T.title }}
            >
              {form.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: T.muted }}>
              Meta:{' '}
              {fmt(form.targetAmount, form.currency, form.currency, rates)}
              {form.deadline &&
                ` · Límite: ${fmtDateShort(form.deadline, dateFormat)}`}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              width: '0.75rem',
              height: '2.5rem',
              borderRadius: '9999px',
              background: form.color,
            }}
          />
        </div>
      )}
    </div>
  );

  // ── Render paso 2: modo manual vs automático ───────────────────────────────
  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Selector de modo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {/* Manual */}
        <div
          onClick={() => setForm((f) => ({ ...f, mode: 'manual' }))}
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            cursor: 'pointer',
            border: `2px solid ${
              form.mode === 'manual' ? T.accent : T.cardBorder
            }`,
            background: form.mode === 'manual' ? T.accentLight : T.pageBg,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>✍️</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
          >
            Manual
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              marginTop: '0.2rem',
              lineHeight: 1.5,
            }}
          >
            Introduces tú el importe ahorrado cuando quieras
          </div>
          {form.mode === 'manual' && (
            <Check size={14} color={T.accent} style={{ marginTop: '0.5rem' }} />
          )}
        </div>

        {/* Automático */}
        <div
          onClick={() => setForm((f) => ({ ...f, mode: 'auto' }))}
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            cursor: 'pointer',
            border: `2px solid ${
              form.mode === 'auto' ? T.accent : T.cardBorder
            }`,
            background: form.mode === 'auto' ? T.accentLight : T.pageBg,
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>⚡</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
          >
            Automático
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              marginTop: '0.2rem',
              lineHeight: 1.5,
            }}
          >
            Suma automáticamente tus movimientos reales
          </div>
          {form.mode === 'auto' && (
            <Check size={14} color={T.accent} style={{ marginTop: '0.5rem' }} />
          )}
        </div>
      </div>

      {/* Modo manual: importe actual */}
      {form.mode === 'manual' && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: T.body,
              marginBottom: '0.75rem',
            }}
          >
            ¿Cuánto llevas ahorrado hasta ahora?
          </div>
          <Input
            T={T}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.currentAmount || ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                currentAmount: parseFloat(e.target.value) || 0,
              }))
            }
          />

          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              marginTop: '0.25rem',
            }}
          >
            Puedes actualizarlo en cualquier momento editando el objetivo.
          </div>
        </div>
      )}

      {/* Modo automático: configuración */}
      {form.mode === 'auto' && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          {/* Qué tipo de movimiento sumar */}
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
              }}
            >
              Tipo de movimiento a sumar
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              {(
                [
                  ['income', '📈 Ingresos', 'Ej: transferencias de ahorro'],
                  ['expense', '📉 Gastos', 'Ej: compras de algo concreto'],
                ] as const
              ).map(([val, label, sub]) => (
                <div
                  key={val}
                  onClick={() =>
                    setForm((f) => ({ ...f, autoType: val, categoryId: '' }))
                  }
                  style={{
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    border: `1.5px solid ${
                      form.autoType === val ? T.accent : T.cardBorder
                    }`,
                    background:
                      form.autoType === val ? T.accentLight : T.cardBg,
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: T.title,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      marginTop: '0.15rem',
                    }}
                  >
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <Field label="Categoría que se sumará" error={errors.categoryId}>
            <Sel
              T={T}
              value={form.categoryId}
              onChange={(e) => {
                setForm((f) => ({ ...f, categoryId: e.target.value }));
                setErrors((er) => ({ ...er, categoryId: undefined }));
              }}
            >
              <option value="">— Selecciona una categoría —</option>
              {categories
                .filter((c) => c.type === form.autoType)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Sel>
          </Field>

          {/* Cuenta */}
          <Field label="Cuenta (opcional)">
            <Sel
              T={T}
              value={form.accountId}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountId: e.target.value }))
              }
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Sel>
          </Field>

          {/* Fecha inicio del conteo */}
          <Field label="Contar movimientos desde">
            <Input
              T={T}
              type="date"
              value={form.autoStartDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, autoStartDate: e.target.value }))
              }
            />
          </Field>

          {/* Info */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.75rem',
              background: T.accentLight,
              border: `1px solid ${T.accent}33`,
              fontSize: '0.75rem',
              color: T.accent,
              lineHeight: 1.5,
            }}
          >
            💡 La app sumará automáticamente todos los movimientos reales que
            coincidan con estos criterios y actualizará el progreso del objetivo
            en tiempo real.
          </div>
        </div>
      )}
    </div>
  );

  // ── Render paso 3: resumen ────────────────────────────────────────────────
  const renderStep3 = () => {
    const cat = categories.find((c) => c.id === form.categoryId);
    const acc = accounts.find((a) => a.id === form.accountId);
    const progress =
      form.mode === 'manual'
        ? form.targetAmount > 0
          ? (form.currentAmount / form.targetAmount) * 100
          : 0
        : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Preview visual del objetivo */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '1.25rem',
            background: T.pageBg,
            border: `2px solid ${form.color}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Barra de color lateral */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '0.375rem',
              background: form.color,
              borderRadius: '0.375rem 0 0 0.375rem',
            }}
          />

          <div style={{ marginLeft: '1rem' }}>
            {/* Cabecera */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '2rem' }}>{form.emoji}</span>
              <div>
                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: T.title,
                  }}
                >
                  {form.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: T.muted }}>
                  {form.mode === 'manual'
                    ? '✍️ Seguimiento manual'
                    : `⚡ Auto · ${cat?.name ?? '—'}`}
                </div>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: form.color + '22',
                  color: form.color,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {form.mode === 'manual' ? 'Manual' : 'Automático'}
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ marginBottom: '0.625rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: T.muted }}>
                  {fmt(
                    form.mode === 'manual' ? form.currentAmount : 0,
                    form.currency,
                    form.currency,
                    rates
                  )}{' '}
                  ahorrado
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: form.color,
                  }}
                >
                  {Math.round(Math.min(progress, 100))}%
                </span>
              </div>
              <div
                style={{
                  height: '0.625rem',
                  borderRadius: '9999px',
                  background: T.cardBorder,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '9999px',
                    background: form.color,
                    width: `${Math.min(progress, 100)}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.3rem',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: T.muted }}>
                  Inicio
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: T.title,
                  }}
                >
                  {fmt(form.targetAmount, form.currency, form.currency, rates)}
                </span>
              </div>
            </div>

            {/* Datos clave */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
              }}
            >
              {[
                {
                  label: 'Meta',
                  value: fmt(
                    form.targetAmount,
                    form.currency,
                    form.currency,
                    rates
                  ),
                },
                {
                  label: 'Fecha límite',
                  value: form.deadline
                    ? fmtDateShort(form.deadline, dateFormat)
                    : 'Sin límite',
                },
                ...(form.mode === 'auto'
                  ? [
                      { label: 'Categoría', value: cat?.name ?? '—' },
                      {
                        label: 'Cuenta',
                        value:
                          form.accountId === 'all' ? 'Todas' : acc?.name ?? '—',
                      },
                    ]
                  : []),
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.625rem',
                    background: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: T.muted,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: T.title,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            fontSize: '0.775rem',
            color: T.green,
            fontWeight: 600,
          }}
        >
          ✅ Todo listo. Pulsa "Crear objetivo" para empezar.
        </div>
      </div>
    );
  };

  // ── Componente de tarjeta de objetivo ─────────────────────────────────────
  const GoalCard = ({ goal }: { goal: SavingsGoal }) => {
    const prog = calcGoalProgress(goal, realExpenses, accounts, rates);
    const cat = categories.find((c) => c.id === goal.categoryId);
    const acc = accounts.find((a) => a.id === goal.accountId);
    const [editingAmountGoalId, setEditingAmountGoalId] = useState<
      string | null
    >(null);
    const [editingAmountValue, setEditingAmountValue] = useState('');

    return (
      <Card
        T={T}
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: prog.completed
            ? `2px solid ${T.green}`
            : `1px solid ${T.cardBorder}`,
        }}
      >
        {/* Barra de color lateral */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '0.375rem',
            background: goal.color,
          }}
        />

        <div style={{ padding: '1.5rem 1.5rem 1.5rem 1.875rem' }}>
          {/* Cabecera */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.125rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}
            >
              <span style={{ fontSize: '2rem' }}>{goal.emoji}</span>
              <div>
                <div
                  style={{ fontSize: '1rem', fontWeight: 800, color: T.title }}
                >
                  {goal.name}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: T.muted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginTop: '0.1rem',
                  }}
                >
                  {goal.mode === 'auto' ? (
                    <>
                      <span
                        style={{
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          background: T.accentLight,
                          color: T.accent,
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Auto
                      </span>
                      {cat && <span>{cat.name}</span>}
                      {goal.accountId !== 'all' && acc && (
                        <span>· {acc.name}</span>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: T.pageBg,
                        color: T.muted,
                        fontWeight: 700,
                      }}
                    >
                      ✍️ Manual
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              <GhostBtn onClick={() => openEdit(goal)} T={T}>
                <Pencil size={14} />
              </GhostBtn>
              <GhostBtn
                onClick={() => setConfirmDelete(goal.id)}
                T={T}
                color={T.red}
              >
                <Trash2 size={14} />
              </GhostBtn>
            </div>
          </div>

          {/* Progreso */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: goal.color,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {fmt(prog.saved, goal.currency, goal.currency, rates)}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: T.muted,
                    marginLeft: '0.375rem',
                  }}
                >
                  de{' '}
                  {fmt(goal.targetAmount, goal.currency, goal.currency, rates)}
                </span>
              </div>
              <div
                style={{
                  padding: '0.35rem 0.875rem',
                  borderRadius: '9999px',
                  background: prog.completed ? T.greenBg : goal.color + '15',
                  color: prog.completed ? T.green : goal.color,
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  border: `1px solid ${
                    prog.completed ? T.greenBorder : goal.color + '33'
                  }`,
                }}
              >
                {Math.round(prog.pct)}%
              </div>
            </div>

            {/* Barra de progreso */}
            <div
              style={{
                height: '0.75rem',
                borderRadius: '9999px',
                background: T.pageBg,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  background: prog.completed
                    ? T.green
                    : `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`,
                  width: `${prog.pct}%`,
                  transition: 'width 0.6s ease',
                  position: 'relative',
                }}
              >
                {prog.pct > 10 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.5rem',
                      fontWeight: 800,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Math.round(prog.pct)}%
                  </div>
                )}
              </div>
            </div>

            {prog.completed && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: T.green,
                }}
              >
                🎉 ¡Objetivo alcanzado!
              </div>
            )}
          </div>

          {/* Métricas clave */}
          {!prog.completed && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.625rem',
                marginBottom: '1rem',
              }}
            >
              {[
                {
                  label: 'Falta',
                  value: fmt(
                    prog.remaining,
                    goal.currency,
                    goal.currency,
                    rates
                  ),
                  color: T.red,
                },
                {
                  label: goal.deadline ? 'Meses restantes' : 'Ritmo necesario',
                  value: goal.deadline
                    ? prog.monthsLeft !== null
                      ? `${prog.monthsLeft} mes${
                          prog.monthsLeft !== 1 ? 'es' : ''
                        }`
                      : '—'
                    : '—',
                  color: T.muted,
                },
                {
                  label: 'Necesitas/mes',
                  value:
                    prog.monthlyNeeded !== null
                      ? fmt(
                          prog.monthlyNeeded,
                          goal.currency,
                          goal.currency,
                          rates
                        )
                      : '—',
                  color: T.amber,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.75rem',
                    background: T.pageBg,
                    border: `1px solid ${T.cardBorder}`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado del ritmo — solo modo auto con datos */}
          {goal.mode === 'auto' && prog.monthlyRate > 0 && !prog.completed && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                marginBottom: '1rem',
                background: prog.onTrack ? T.greenBg : T.amberBg,
                border: `1px solid ${
                  prog.onTrack ? T.greenBorder : T.amberBorder
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: prog.onTrack ? T.green : T.amber,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {prog.onTrack
                    ? '✅ Vas por buen camino'
                    : '⚠️ Necesitas acelerar'}
                </div>
                <div
                  style={{
                    fontSize: '0.775rem',
                    color: prog.onTrack ? T.green : T.amber,
                    marginTop: '0.1rem',
                  }}
                >
                  Ritmo actual:{' '}
                  <strong>
                    {fmt(prog.monthlyRate, goal.currency, goal.currency, rates)}
                    /mes
                  </strong>
                  {prog.monthlyNeeded !== null && (
                    <>
                      {' '}
                      · Necesitas:{' '}
                      <strong>
                        {fmt(
                          prog.monthlyNeeded,
                          goal.currency,
                          goal.currency,
                          rates
                        )}
                        /mes
                      </strong>
                    </>
                  )}
                </div>
              </div>
              {prog.estimatedDate && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: prog.onTrack ? T.green : T.amber,
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  Estimado: {prog.estimatedDate}
                </div>
              )}
            </div>
          )}

          {/* Proyección para modo manual */}
          {goal.mode === 'manual' &&
            goal.deadline &&
            prog.monthlyNeeded !== null &&
            !prog.completed && (
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem',
                  background: T.accentLight,
                  border: `1px solid ${T.accent}33`,
                  fontSize: '0.775rem',
                  color: T.accent,
                }}
              >
                💡 Para llegar a tiempo necesitas ahorrar{' '}
                <strong>
                  {fmt(prog.monthlyNeeded, goal.currency, goal.currency, rates)}
                  /mes
                </strong>
                {goal.deadline &&
                  prog.monthsLeft !== null &&
                  ` en los próximos ${prog.monthsLeft} meses`}
              </div>
            )}

          {/* Botón detalles — solo modo manual */}
          {goal.mode === 'manual' && !prog.completed && (
            <button
              onClick={() => setEditingAmountGoalId(goal.id)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${goal.color}44`,
                background: goal.color + '10',
                color: goal.color,
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              ✏️ Actualizar importe ahorrado
            </button>
          )}
        </div>
        {/* ── Modal inline actualizar importe ── */}
        {editingAmountGoalId === goal.id && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1rem',
              borderRadius: '0.875rem',
              background: T.accentLight,
              border: `1.5px solid ${T.accent}44`,
              animation: 'fadeSlideIn 0.2s ease both',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: T.accent,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
              }}
            >
              ✏️ Actualizar importe ahorrado
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: T.muted,
                marginBottom: '0.625rem',
              }}
            >
              Importe actual:{' '}
              <strong style={{ color: T.title }}>
                {fmt(goal.currentAmount, goal.currency, goal.currency, rates)}
              </strong>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              autoFocus
              placeholder={`Ej: ${goal.currentAmount || '0.00'}`}
              value={editingAmountValue}
              onChange={(e) => setEditingAmountValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const parsed = parseFloat(editingAmountValue);
                  if (isNaN(parsed) || parsed < 0) {
                    toast('Importe no válido', 'error');
                    return;
                  }
                  setGoals((prev) =>
                    prev.map((g) =>
                      g.id === goal.id ? { ...g, currentAmount: parsed } : g
                    )
                  );
                  toast('Importe actualizado correctamente', 'success');
                  setEditingAmountGoalId(null);
                  setEditingAmountValue('');
                }
                if (e.key === 'Escape') {
                  setEditingAmountGoalId(null);
                  setEditingAmountValue('');
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${T.accent}44`,
                background: T.inputBg,
                color: T.inputText,
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box' as const,
                marginBottom: '0.625rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const parsed = parseFloat(editingAmountValue);
                  if (isNaN(parsed) || parsed < 0) {
                    toast('Importe no válido', 'error');
                    return;
                  }
                  setGoals((prev) =>
                    prev.map((g) =>
                      g.id === goal.id ? { ...g, currentAmount: parsed } : g
                    )
                  );
                  toast('Importe actualizado correctamente', 'success');
                  setEditingAmountGoalId(null);
                  setEditingAmountValue('');
                }}
                disabled={!editingAmountValue.trim()}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: T.accent,
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: editingAmountValue.trim() ? 'pointer' : 'not-allowed',
                  opacity: editingAmountValue.trim() ? 1 : 0.5,
                }}
              >
                ✅ Guardar
              </button>
              <button
                onClick={() => {
                  setEditingAmountGoalId(null);
                  setEditingAmountValue('');
                }}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.75rem',
                  border: `1.5px solid ${T.cardBorder}`,
                  background: T.btnSecBg,
                  color: T.btnSecText,
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // ── Resumen global de objetivos ───────────────────────────────────────────
  const globalStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(
      (g) => calcGoalProgress(g, realExpenses, accounts, rates).completed
    ).length;
    const totalTarget = goals.reduce(
      (s, g) =>
        s + convertAmount(g.targetAmount, g.currency, displayCurrency, rates),
      0
    );
    const totalSaved = goals.reduce(
      (s, g) =>
        s +
        convertAmount(
          calcGoalProgress(g, realExpenses, accounts, rates).saved,
          g.currency,
          displayCurrency,
          rates
        ),
      0
    );
    return { total, completed, totalTarget, totalSaved };
  }, [goals, realExpenses, rates, displayCurrency]);

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div className="fh-print-section">
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Planificación
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Objetivos de ahorro
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Define metas y sigue tu progreso automáticamente
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <PrintButton T={T} />
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Nuevo objetivo
          </PrimaryBtn>
        </div>
      </div>

      {/* Resumen global — solo si hay objetivos */}
      {goals.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          {[
            {
              label: 'Objetivos activos',
              value: `${globalStats.total}`,
              color: T.accent,
              bg: T.accentLight,
              border: `${T.accent}33`,
            },
            {
              label: 'Completados',
              value: `${globalStats.completed}`,
              color: T.green,
              bg: T.greenBg,
              border: T.greenBorder,
            },
            {
              label: 'Total objetivo',
              value: fmt(
                globalStats.totalTarget,
                displayCurrency,
                displayCurrency,
                rates
              ),
              color: T.muted,
              bg: T.pageBg,
              border: T.cardBorder,
            },
            {
              label: 'Total ahorrado',
              value: fmt(
                globalStats.totalSaved,
                displayCurrency,
                displayCurrency,
                rates
              ),
              color: T.green,
              bg: T.greenBg,
              border: T.greenBorder,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                background: item.bg,
                border: `1px solid ${item.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: item.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: item.color,
                  letterSpacing: '-0.02em',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de objetivos */}
      {goals.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))',
            gap: '1.25rem',
          }}
        >
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div
          style={{ textAlign: 'center', padding: '6rem 2rem', color: T.muted }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>
            🎯
          </div>
          <p
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: T.title,
              marginBottom: '0.5rem',
            }}
          >
            Todavía no tienes objetivos de ahorro
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: T.muted,
              marginBottom: '1.5rem',
              maxWidth: '28rem',
              margin: '0 auto 1.5rem',
            }}
          >
            Define una meta, elige si quieres seguirla manualmente o de forma
            automática vinculándola a tus movimientos reales.
          </p>
          <PrimaryBtn onClick={openAdd}>
            <Plus size={15} />
            Crear primer objetivo
          </PrimaryBtn>
        </div>
      )}

      {/* Modal de creación / edición */}
      {modal && (
        <Modal
          title={modal === 'add' ? '🎯 Nuevo objetivo' : '✏️ Editar objetivo'}
          subtitle={
            step === 1
              ? 'Define tu meta'
              : step === 2
              ? 'Elige cómo registrar el ahorro'
              : 'Revisa y confirma'
          }
          onClose={() => {
            setModal(null);
            setStep(1);
            setForm(emptyForm);
            setErrors({});
          }}
          T={T}
        >
          {/* Barra de progreso del wizard */}
          <div
            style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '0.25rem',
                  borderRadius: '9999px',
                  background: i < step ? T.accent : T.cardBorder,
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Botones de navegación */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            {step > 1 && (
              <SecondaryBtn onClick={() => setStep((s) => s - 1)} T={T}>
                ← Atrás
              </SecondaryBtn>
            )}
            {step < TOTAL_STEPS ? (
              <PrimaryBtn onClick={handleNext} fullWidth>
                Continuar →
              </PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={save} fullWidth>
                <Check size={15} />
                {modal === 'add' ? 'Crear objetivo' : 'Guardar cambios'}
              </PrimaryBtn>
            )}
          </div>
        </Modal>
      )}

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <ConfirmModal
          T={T}
          title="¿Eliminar objetivo?"
          message={`Vas a eliminar "${
            goals.find((g) => g.id === confirmDelete)?.name
          }". Esta acción no se puede deshacer.`}
          onConfirm={() => {
            setGoals((prev) => prev.filter((g) => g.id !== confirmDelete));
            toast('Objetivo eliminado', 'success');
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── AlertsBanner (widget para Dashboard) ────────────────────────────────────
function AlertsBanner() {
  const { T, computedAlerts, ignoredAlerts, setIgnoredAlerts, setTab } =
    useApp();

  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);

  // Alertas activas (no descartadas en esta sesión)
  const activeAlerts = computedAlerts.filter((a) => !dismissed.includes(a.id));

  if (activeAlerts.length === 0) return null;

  const sorted = useMemo(
    () =>
      [...activeAlerts].sort((a, b) => {
        const order = { critical: 0, warning: 1, positive: 2 };
        return order[a.severity] - order[b.severity];
      }),
    [activeAlerts]
  );

  const visible = useMemo(() => sorted.slice(0, 3), [sorted]);
  const hidden = useMemo(() => sorted.slice(3), [sorted]);

  // Color del banner según la alerta más grave
  const topSeverity = sorted[0]?.severity ?? 'positive';
  const bannerConfig = {
    critical: {
      bg: T.redBg,
      border: T.redBorder,
      color: T.red,
      headerBg: T.red + '18',
      icon: '🔴',
    },
    warning: {
      bg: T.amberBg,
      border: T.amberBorder,
      color: T.amber,
      headerBg: T.amber + '18',
      icon: '🟠',
    },
    positive: {
      bg: T.greenBg,
      border: T.greenBorder,
      color: T.green,
      headerBg: T.green + '18',
      icon: '✅',
    },
  };

  const severityConfig = {
    critical: {
      color: T.red,
      bg: T.redBg,
      border: T.redBorder,
      badgeBg: T.red,
    },
    warning: {
      color: T.amber,
      bg: T.amberBg,
      border: T.amberBorder,
      badgeBg: T.amber,
    },
    positive: {
      color: T.green,
      bg: T.greenBg,
      border: T.greenBorder,
      badgeBg: T.green,
    },
  };

  const typeIcon: Record<string, string> = {
    balance_critical: '🏦',
    balance_risk: '⚠️',
    budget_exceeded: '📉',
    goal_at_risk: '🎯',
    month_negative: '💸',
    goal_overdue: '📅',
    goal_completed: '🎉',
  };

  const cfg = bannerConfig[topSeverity];

  const dismissOne = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    setDismissed(activeAlerts.map((a) => a.id));
  };

  const ignoreAlways = (id: string) => {
    setIgnoredAlerts((prev) => [...prev, id]);
    setDismissed((prev) => [...prev, id]);
  };

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        overflow: 'hidden',
        marginBottom: '0',
        animation: 'fadeSlideIn 0.3s ease both',
      }}
    >
      {/* ── Cabecera del banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          background: cfg.headerBg,
          borderBottom: expanded ? `1px solid ${cfg.border}` : 'none',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span
            style={{
              fontSize: '1rem',
              display: 'inline-block',
              animation:
                topSeverity === 'critical'
                  ? 'warnPulse 2s ease-in-out infinite'
                  : 'none',
            }}
          >
            {cfg.icon}
          </span>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: cfg.color,
              }}
            >
              {activeAlerts.length} alerta{activeAlerts.length !== 1 ? 's' : ''}{' '}
              activa{activeAlerts.length !== 1 ? 's' : ''}
            </div>
            <div
              style={{ fontSize: '0.72rem', color: cfg.color, opacity: 0.8 }}
            >
              {sorted.filter((a) => a.severity === 'critical').length > 0 && (
                <span style={{ marginRight: '0.5rem' }}>
                  🔴 {sorted.filter((a) => a.severity === 'critical').length}{' '}
                  crítica
                  {sorted.filter((a) => a.severity === 'critical').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
              {sorted.filter((a) => a.severity === 'warning').length > 0 && (
                <span style={{ marginRight: '0.5rem' }}>
                  🟠 {sorted.filter((a) => a.severity === 'warning').length}{' '}
                  advertencia
                  {sorted.filter((a) => a.severity === 'warning').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
              {sorted.filter((a) => a.severity === 'positive').length > 0 && (
                <span>
                  ✅ {sorted.filter((a) => a.severity === 'positive').length}{' '}
                  positiva
                  {sorted.filter((a) => a.severity === 'positive').length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de cabecera */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setTab('alerts')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ver todas →
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? 'Colapsar' : 'Expandir'}
            style={{
              padding: '0.4rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={dismissAll}
            title="Descartar todas hasta la próxima sesión"
            style={{
              padding: '0.4rem 0.625rem',
              borderRadius: '0.625rem',
              border: `1px solid ${cfg.border}`,
              background: 'transparent',
              color: cfg.color,
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Lista de alertas ── */}
      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeSlideIn 0.2s ease both',
          }}
        >
          {visible.map((alert, i) => {
            const aCfg = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom:
                    i < visible.length - 1 || hidden.length > 0
                      ? `1px solid ${cfg.border}`
                      : 'none',
                  background: i % 2 === 0 ? 'transparent' : aCfg.color + '06',
                }}
              >
                {/* Icono */}
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.625rem',
                    background: aCfg.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {typeIcon[alert.type] ?? cfg.icon}
                </div>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: T.title,
                      marginBottom: '0.15rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: aCfg.color,
                      lineHeight: 1.4,
                      opacity: 0.9,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {alert.message}
                  </div>
                </div>

                {/* Acciones */}
                <div
                  style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}
                >
                  {alert.actionTab && (
                    <button
                      onClick={() => setTab(alert.actionTab!)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: aCfg.color,
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {alert.actionLabel ?? 'Ver →'}
                    </button>
                  )}
                  <button
                    onClick={() => ignoreAlways(alert.id)}
                    title="No volver a mostrar"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.625rem',
                      border: `1px solid ${aCfg.border}`,
                      background: 'transparent',
                      color: aCfg.color,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    🚫
                  </button>
                  <button
                    onClick={() => dismissOne(alert.id)}
                    title="Descartar hasta la próxima sesión"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.625rem',
                      border: `1px solid ${aCfg.border}`,
                      background: 'transparent',
                      color: aCfg.color,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {/* ── Colapsadas ── */}
          {hidden.length > 0 && (
            <div
              style={{
                padding: '0.625rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: cfg.color + '08',
              }}
            >
              <span
                style={{
                  fontSize: '0.775rem',
                  color: cfg.color,
                  fontWeight: 600,
                }}
              >
                +{hidden.length} alerta{hidden.length !== 1 ? 's' : ''} más
              </span>
              <button
                onClick={() => setTab('alerts')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${cfg.border}`,
                  background: 'transparent',
                  color: cfg.color,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ver todas →
              </button>
            </div>
          )}

          {/* ── Leyenda ── */}
          <div
            style={{
              padding: '0.625rem 1.25rem',
              borderTop: `1px solid ${cfg.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: cfg.color + '06',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{ fontSize: '0.68rem', color: cfg.color, opacity: 0.75 }}
            >
              🚫 Ignorar siempre · ✕ Descartar hasta la próxima sesión
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GoalsSummary (widget para Dashboard) ────────────────────────────────────
function GoalsSummary() {
  const {
    T,
    goals,
    accounts,
    categories,
    realExpenses,
    displayCurrency,
    rates,
    setTab,
  } = useApp();

  // Sin objetivos → estado vacío con CTA
  if (goals.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.cardBg,
          border: `1.5px dashed ${T.cardBorder}`,
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.75rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
            }}
          >
            🎯
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
            >
              Objetivos de ahorro
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.1rem',
              }}
            >
              Aún no tienes objetivos definidos
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('goals')}
          style={{
            padding: '0.55rem 1.125rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: T.accent,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Crear objetivo
        </button>
      </div>
    );
  }

  // Ordenamos: primero los más próximos al deadline, luego los sin deadline
  const sortedGoals = [...goals].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Mostramos máximo 3
  const visibleGoals = sortedGoals.slice(0, 3);
  const hasMore = goals.length > 3;

  // Totales globales
  const totalTarget = goals.reduce(
    (s, g) =>
      s + convertAmount(g.targetAmount, g.currency, displayCurrency, rates),
    0
  );
  const totalSaved = goals.reduce(
    (s, g) =>
      s +
      convertAmount(
        calcGoalProgress(g, realExpenses, accounts, rates).saved,
        g.currency,
        displayCurrency,
        rates
      ),
    0
  );
  const totalPct =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completedCount = goals.filter(
    (g) => calcGoalProgress(g, realExpenses, accounts, rates).completed
  ).length;

  return (
    <div
      style={{
        borderRadius: '1rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.625rem',
              background: T.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            🎯
          </div>
          <div>
            <div
              style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
            >
              Objetivos de ahorro
            </div>
            <div style={{ fontSize: '0.72rem', color: T.muted }}>
              {goals.length} objetivo{goals.length !== 1 ? 's' : ''}
              {completedCount > 0 &&
                ` · ${completedCount} completado${
                  completedCount !== 1 ? 's' : ''
                } 🎉`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setTab('goals')}
          style={{
            padding: '0.45rem 0.875rem',
            borderRadius: '0.625rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.btnSecBg,
            color: T.btnSecText,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ver todos →
        </button>
      </div>

      {/* ── Progreso global ── */}
      <div
        style={{
          padding: '0.875rem 1.5rem',
          borderBottom: `1px solid ${T.cardBorder}`,
          background: T.pageBg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: T.muted }}>
            Total ahorrado:{' '}
            <strong style={{ color: T.green }}>
              {fmt(totalSaved, displayCurrency, displayCurrency, rates)}
            </strong>{' '}
            de{' '}
            <strong style={{ color: T.title }}>
              {fmt(totalTarget, displayCurrency, displayCurrency, rates)}
            </strong>
          </span>
          <span
            style={{ fontSize: '0.8rem', fontWeight: 800, color: T.accent }}
          >
            {Math.round(totalPct)}%
          </span>
        </div>
        <div
          style={{
            height: '0.5rem',
            borderRadius: '9999px',
            background: T.cardBorder,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '9999px',
              background: `linear-gradient(90deg, ${T.accent}cc, ${T.accent})`,
              width: `${totalPct}%`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* ── Lista de objetivos ── */}
      <div
        style={{
          padding: '0.875rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {visibleGoals.map((goal) => {
          const prog = calcGoalProgress(goal, realExpenses, accounts, rates);
          const cat = categories.find((c) => c.id === goal.categoryId);

          return (
            <div
              key={goal.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${
                  prog.completed ? T.greenBorder : T.cardBorder
                }`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Barra de color lateral */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '0.25rem',
                  background: goal.color,
                }}
              />

              {/* Emoji */}
              <span
                style={{
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  marginLeft: '0.25rem',
                }}
              >
                {goal.emoji}
              </span>

              {/* Info + barra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: T.title,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '60%',
                    }}
                  >
                    {goal.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: prog.completed ? T.green : goal.color,
                      flexShrink: 0,
                    }}
                  >
                    {prog.completed ? '🎉 ¡Listo!' : `${Math.round(prog.pct)}%`}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div
                  style={{
                    height: '0.375rem',
                    borderRadius: '9999px',
                    background: T.cardBorder,
                    overflow: 'hidden',
                    marginBottom: '0.3rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '9999px',
                      background: prog.completed ? T.green : goal.color,
                      width: `${prog.pct}%`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                {/* Importes y deadline */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: T.muted }}>
                    {fmt(prog.saved, goal.currency, goal.currency, rates)}
                    {' / '}
                    {fmt(
                      goal.targetAmount,
                      goal.currency,
                      goal.currency,
                      rates
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: T.muted,
                      flexShrink: 0,
                    }}
                  >
                    {goal.mode === 'auto' && (
                      <span
                        style={{
                          marginRight: '0.375rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.accentLight,
                          color: T.accent,
                          fontWeight: 700,
                        }}
                      >
                        ⚡ Auto
                      </span>
                    )}
                    {goal.deadline &&
                      prog.monthsLeft !== null &&
                      !prog.completed && (
                        <span
                          style={{
                            color: prog.monthsLeft <= 1 ? T.red : T.muted,
                          }}
                        >
                          {prog.monthsLeft <= 0
                            ? '⚠️ Vencido'
                            : `${prog.monthsLeft} mes${
                                prog.monthsLeft !== 1 ? 'es' : ''
                              }`}
                        </span>
                      )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botón "Ver más" si hay más de 3 */}
        {hasMore && (
          <button
            onClick={() => setTab('goals')}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.pageBg,
              color: T.muted,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver {goals.length - 3} objetivo{goals.length - 3 !== 1 ? 's' : ''}{' '}
            más →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AlertsPanel ──────────────────────────────────────────────────────────────
function AlertsPanel() {
  const { T, computedAlerts, ignoredAlerts, setIgnoredAlerts, setTab } =
    useApp();

  const [filter, setFilter] = useState<
    'all' | 'critical' | 'warning' | 'positive'
  >('all');
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [confirmIgnore, setConfirmIgnore] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toast = useToast();

  const dismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const ignoreAlways = (id: string) => {
    setIgnoredAlerts((prev) => [...prev, id]);
    setDismissed((prev) => [...prev, id]);
    setConfirmIgnore(null);
    toast('Alerta ignorada permanentemente', 'success');
  };

  const restoreAll = () => {
    setIgnoredAlerts([]);
    toast('Alertas restauradas', 'success');
  };

  // Incluimos descartadas en la pestaña (con estilo diferente)
  const allAlerts = computedAlerts;
  const filtered = allAlerts.filter((a) =>
    filter === 'all' ? true : a.severity === filter
  );

  const { criticalCount, warningCount, positiveCount } = useMemo(
    () => ({
      criticalCount: allAlerts.filter((a) => a.severity === 'critical').length,
      warningCount: allAlerts.filter((a) => a.severity === 'warning').length,
      positiveCount: allAlerts.filter((a) => a.severity === 'positive').length,
    }),
    [allAlerts]
  );

  const severityConfig = {
    critical: {
      bg: T.redBg,
      border: T.redBorder,
      color: T.red,
      icon: '🔴',
      label: 'Crítica',
      badgeBg: T.red,
    },
    warning: {
      bg: T.amberBg,
      border: T.amberBorder,
      color: T.amber,
      icon: '🟠',
      label: 'Advertencia',
      badgeBg: T.amber,
    },
    positive: {
      bg: T.greenBg,
      border: T.greenBorder,
      color: T.green,
      icon: '✅',
      label: 'Positiva',
      badgeBg: T.green,
    },
  };

  const typeIcon: Record<string, string> = {
    balance_critical: '🏦',
    balance_risk: '⚠️',
    budget_exceeded: '📉',
    goal_at_risk: '🎯',
    month_negative: '💸',
    goal_overdue: '📅',
    goal_completed: '🎉',
    duplicate_projection: '🔄',
  };

  return (
    <div className="fh-print-section">
      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Centro de notificaciones
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Alertas inteligentes
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Situaciones que requieren tu atención
          </p>
        </div>
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <PrintButton T={T} />
          {ignoredAlerts.length > 0 && (
            <button
              onClick={restoreAll}
              style={{
                padding: '0.55rem 1.125rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${T.cardBorder}`,
                background: T.btnSecBg,
                color: T.btnSecText,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Restaurar {ignoredAlerts.length} ignorada
              {ignoredAlerts.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ── Resumen de contadores ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          {
            label: 'Total alertas',
            value: allAlerts.length,
            color: T.accent,
            bg: T.accentLight,
            border: `${T.accent}33`,
          },
          {
            label: 'Críticas',
            value: criticalCount,
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
          },
          {
            label: 'Advertencias',
            value: warningCount,
            color: T.amber,
            bg: T.amberBg,
            border: T.amberBorder,
          },
          {
            label: 'Positivas',
            value: positiveCount,
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.03em',
                textAlign: 'right',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            ['all', 'Todas'],
            ['critical', '🔴 Críticas'],
            ['warning', '🟠 Advertencias'],
            ['positive', '✅ Positivas'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              padding: '0.5rem 1.125rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: filter === v ? 'none' : `1px solid ${T.cardBorder}`,
              background: filter === v ? T.accent : T.cardBg,
              color: filter === v ? '#fff' : T.muted,
              cursor: 'pointer',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Lista de alertas ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '6rem 2rem',
            borderRadius: '1.5rem',
            background: T.cardBg,
            border: `1.5px dashed ${T.cardBorder}`,
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>
            🎉
          </div>
          <p
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: T.title,
              marginBottom: '0.5rem',
            }}
          >
            {filter === 'all'
              ? '¡Todo en orden!'
              : 'Sin alertas en esta categoría'}
          </p>
          <p style={{ fontSize: '0.875rem', color: T.muted }}>
            {filter === 'all'
              ? 'No hay situaciones que requieran tu atención en este momento.'
              : 'Prueba a cambiar el filtro para ver otras alertas.'}
          </p>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          {filtered.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const isDismissed = dismissed.includes(alert.id);
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                style={{
                  borderRadius: '1.25rem',
                  background: isDismissed ? T.pageBg : cfg.bg,
                  border: `1.5px solid ${
                    isDismissed ? T.cardBorder : cfg.border
                  }`,
                  overflow: 'hidden',
                  opacity: isDismissed ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {/* ── Cabecera de la alerta ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.125rem 1.25rem',
                  }}
                >
                  {/* Icono tipo */}
                  <div
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      background: isDismissed
                        ? T.cardBorder + '33'
                        : cfg.color + '22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                    }}
                  >
                    {typeIcon[alert.type] ?? cfg.icon}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.3rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: isDismissed ? T.muted : T.title,
                        }}
                      >
                        {alert.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: isDismissed ? T.cardBorder : cfg.badgeBg,
                          color: '#ffffff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {isDismissed ? 'DESCARTADA' : cfg.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: isDismissed ? T.muted : cfg.color,
                        margin: 0,
                        lineHeight: 1.5,
                        opacity: isDismissed ? 0.7 : 1,
                      }}
                    >
                      {alert.message}
                    </p>
                  </div>

                  {/* Acciones rápidas */}
                  <div
                    style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}
                  >
                    {!isDismissed && alert.actionTab && (
                      <button
                        onClick={() => setTab(alert.actionTab!)}
                        style={{
                          padding: '0.45rem 0.875rem',
                          borderRadius: '0.625rem',
                          border: 'none',
                          background: isDismissed ? T.cardBorder : cfg.color,
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {alert.actionLabel ?? 'Ver →'}
                      </button>
                    )}
                    {!isDismissed && (
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : alert.id)
                        }
                        title="Opciones"
                        style={{
                          padding: '0.45rem 0.625rem',
                          borderRadius: '0.625rem',
                          border: `1px solid ${cfg.border}`,
                          background: 'transparent',
                          color: cfg.color,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        isDismissed
                          ? setDismissed((p) =>
                              p.filter((id) => id !== alert.id)
                            )
                          : dismiss(alert.id)
                      }
                      title={isDismissed ? 'Restaurar' : 'Descartar'}
                      style={{
                        padding: '0.45rem 0.625rem',
                        borderRadius: '0.625rem',
                        border: `1px solid ${
                          isDismissed ? T.cardBorder : cfg.border
                        }`,
                        background: 'transparent',
                        color: isDismissed ? T.muted : cfg.color,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isDismissed ? '↩' : '✕'}
                    </button>
                  </div>
                </div>

                {/* ── Panel expandido — opciones avanzadas ── */}
                {isExpanded && !isDismissed && (
                  <div
                    style={{
                      borderTop: `1px solid ${cfg.border}`,
                      padding: '0.875rem 1.25rem',
                      background: cfg.color + '08',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      animation: 'fadeSlideIn 0.15s ease both',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.775rem',
                        color: cfg.color,
                        fontWeight: 600,
                      }}
                    >
                      ¿Quieres dejar de ver esta alerta permanentemente?
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setConfirmIgnore(alert.id)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '0.625rem',
                          border: `1px solid ${cfg.border}`,
                          background: 'transparent',
                          color: cfg.color,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🚫 Ignorar siempre
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '0.625rem',
                          border: `1px solid ${T.cardBorder}`,
                          background: 'transparent',
                          color: T.muted,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Nota informativa ── */}
      {allAlerts.length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.875rem 1.125rem',
            borderRadius: '0.875rem',
            background: T.pageBg,
            border: `1px solid ${T.cardBorder}`,
            fontSize: '0.775rem',
            color: T.muted,
            lineHeight: 1.6,
          }}
        >
          💡 Las alertas se recalculan automáticamente cada vez que cambian tus
          datos. Las alertas descartadas reaparecen en la próxima sesión. Las
          ignoradas permanentemente se pueden restaurar con el botón de arriba.
        </div>
      )}

      {/* ── Modal confirmar ignorar siempre ── */}
      {confirmIgnore && (
        <ConfirmModal
          T={T}
          title="¿Ignorar esta alerta siempre?"
          message="Esta alerta no volverá a aparecer aunque la condición persista. Puedes restaurarla desde el botón de la cabecera de esta sección."
          onConfirm={() => ignoreAlways(confirmIgnore)}
          onCancel={() => setConfirmIgnore(null)}
        />
      )}
    </div>
  );
}

// ─── TrendsView ───────────────────────────────────────────────────────────────
function TrendsView() {
  const {
    T,
    accounts,
    categories,
    realExpenses,
    rates,
    baseCurrency,
    displayCurrency,
  } = useApp();

  const [rangeMonths, setRangeMonths] = useState<number | 'all'>(6);
  const [accountFilter, setAccountFilter] = useState('all');

  const data = useTrendsData(
    rangeMonths,
    accountFilter,
    accounts,
    realExpenses,
    categories,
    rates,
    baseCurrency
  );

  // Colores para las líneas de cada cuenta
  const ACCOUNT_COLORS = [
    '#3b82f6',
    '#16a34a',
    '#dc2626',
    '#d97706',
    '#7c3aed',
    '#0891b2',
    '#db2777',
    '#ea580c',
  ];

  // Formateador de importes para los ejes de Recharts
  const fmtAxis = (val: number) => {
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(0);
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          boxShadow: T.cardShadowLg,
          fontSize: '0.8rem',
        }}
      >
        <div
          style={{ fontWeight: 800, color: T.title, marginBottom: '0.5rem' }}
        >
          {label}
        </div>
        {payload.map((entry: any, i: number) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: entry.color,
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: entry.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {entry.name}:{' '}
            {entry.value?.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── Estado vacío ───────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div
        style={{ textAlign: 'center', padding: '6rem 2rem', color: T.muted }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>
          📉
        </div>
        <p
          style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: T.title,
            marginBottom: '0.5rem',
          }}
        >
          Todavía no hay datos suficientes
        </p>
        <p style={{ fontSize: '0.875rem', color: T.muted }}>
          Registra movimientos reales durante al menos un mes para ver los
          gráficos de tendencias.
        </p>
      </div>
    );
  }

  const { monthlyData, balanceData, categoryData, filteredAccounts, stats } =
    data;

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Análisis
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Análisis de tendencias
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Evolución real de tus finanzas
          </p>
        </div>

        {/* Filtros */}
        <div
          className="fh-no-print"
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <PrintButton T={T} />

          {/* Rango de meses */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <select
              value={rangeMonths}
              onChange={(e) =>
                setRangeMonths(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value="all">Todo el histórico</option>
            </select>
          </div>

          {/* Filtro cuenta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
            }}
          >
            <Filter size={14} color={T.muted} />
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: T.body,
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tarjetas de estadísticas ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          gap: '1rem',
        }}
      >
        {[
          {
            label: 'Ingresos totales',
            value: fmt(stats.totalIncome, baseCurrency, baseCurrency, rates),
            suffix: '',
            color: T.green,
            bg: T.greenBg,
            border: T.greenBorder,
            icon: '📈',
          },
          {
            label: 'Gastos totales',
            value: fmt(stats.totalExpenses, baseCurrency, baseCurrency, rates),
            suffix: '',
            color: T.red,
            bg: T.redBg,
            border: T.redBorder,
            icon: '📉',
          },
          {
            label: 'Balance neto',
            value:
              (stats.totalNet >= 0 ? '+' : '') +
              fmt(stats.totalNet, baseCurrency, baseCurrency, rates),
            suffix: '',
            color: stats.totalNet >= 0 ? T.green : T.red,
            bg: stats.totalNet >= 0 ? T.greenBg : T.redBg,
            border: stats.totalNet >= 0 ? T.greenBorder : T.redBorder,
            icon: stats.totalNet >= 0 ? '✅' : '⚠️',
          },
          {
            label: 'Tasa de ahorro media',
            value: stats.avgSavingsRate.toFixed(1),
            suffix: '%',
            color:
              stats.avgSavingsRate >= 20
                ? T.green
                : stats.avgSavingsRate >= 10
                ? T.amber
                : T.red,
            bg:
              stats.avgSavingsRate >= 20
                ? T.greenBg
                : stats.avgSavingsRate >= 10
                ? T.amberBg
                : T.redBg,
            border:
              stats.avgSavingsRate >= 20
                ? T.greenBorder
                : stats.avgSavingsRate >= 10
                ? T.amberBorder
                : T.redBorder,
            icon: '🏦',
          },
          {
            label: 'Tendencia de ahorro',
            value:
              stats.trend === 'up'
                ? 'Mejorando'
                : stats.trend === 'down'
                ? 'Empeorando'
                : 'Estable',
            suffix: '',
            color:
              stats.trend === 'up'
                ? T.green
                : stats.trend === 'down'
                ? T.red
                : T.amber,
            bg:
              stats.trend === 'up'
                ? T.greenBg
                : stats.trend === 'down'
                ? T.redBg
                : T.amberBg,
            border:
              stats.trend === 'up'
                ? T.greenBorder
                : stats.trend === 'down'
                ? T.redBorder
                : T.amberBorder,
            icon:
              stats.trend === 'up'
                ? '🚀'
                : stats.trend === 'down'
                ? '📉'
                : '➡️',
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: item.bg,
              border: `1px solid ${item.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: item.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {item.label}
              </div>
            </div>
            <div
              style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                color: item.color,
                letterSpacing: '-0.02em',
              }}
            >
              {item.value}
              {item.suffix && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginLeft: '0.25rem',
                  }}
                >
                  {item.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráfico 1: Ingresos vs Gastos por mes ── */}
      <Card T={T}>
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Comparativa mensual
          </div>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
          >
            Ingresos vs Gastos reales
          </div>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis
                tickFormatter={fmtAxis}
                tick={{ fontSize: 11, fill: T.muted }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: T.muted }} />
              <Bar
                dataKey="income"
                name="Ingresos"
                fill={T.green}
                opacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Gastos"
                fill={T.red}
                opacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Balance neto"
                stroke={T.accent}
                strokeWidth={2.5}
                dot={{ fill: T.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Gráfico 2: Tasa de ahorro mensual ── */}
      <Card T={T}>
        <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Evolución del ahorro
          </div>
          <div
            style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
          >
            Tasa de ahorro mensual
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color: T.muted,
              marginTop: '0.2rem',
            }}
          >
            La línea de referencia en el 20% marca el objetivo de ahorro
            saludable
          </div>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="savingsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: T.muted }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={20}
                stroke={T.green}
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: '20% objetivo', fill: T.green, fontSize: 11 }}
              />
              <ReferenceLine
                y={0}
                stroke={T.red}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="savingsRate"
                name="Tasa de ahorro (%)"
                stroke={T.accent}
                strokeWidth={2.5}
                fill="url(#savingsGradient)"
                dot={{ fill: T.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Gráfico 3: Evolución del saldo por cuenta ── */}
      {balanceData.length > 0 && (
        <Card T={T}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: T.muted,
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              Patrimonio
            </div>
            <div
              style={{ fontSize: '1.125rem', fontWeight: 800, color: T.title }}
            >
              Evolución del saldo real mes a mes
            </div>
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={balanceData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis
                  tickFormatter={fmtAxis}
                  tick={{ fontSize: 11, fill: T.muted }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: T.muted }} />
                {filteredAccounts.map((acc, i) => (
                  <Line
                    key={acc.id}
                    type="monotone"
                    dataKey={acc.id}
                    name={acc.name}
                    stroke={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                    strokeWidth={2}
                    dot={{
                      fill: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
                      r: 3,
                    }}
                    activeDot={{ r: 5 }}
                  />
                ))}
                {filteredAccounts.length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total consolidado"
                    stroke={T.accent}
                    strokeWidth={3}
                    strokeDasharray="6 3"
                    dot={{ fill: T.accent, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Gráfico 4: Distribución de gastos por categoría ── */}
      {categoryData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}
        >
          {/* PieChart */}
          <Card T={T}>
            <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: T.muted,
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Distribución
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                Gastos por categoría
              </div>
            </div>
            <div
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) +
                        ' ' +
                        baseCurrency,
                      'Total',
                    ]}
                    contentStyle={{
                      background: T.cardBg,
                      border: `1px solid ${T.cardBorder}`,
                      borderRadius: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Ranking de categorías */}
          <Card T={T}>
            <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: T.muted,
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Ranking
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                Top categorías de gasto
              </div>
            </div>
            <div
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {categoryData.slice(0, 6).map((cat, i) => {
                const maxVal = categoryData[0]?.total ?? 1;
                const pct = (cat.total / maxVal) * 100;
                return (
                  <div key={cat.categoryId}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: T.muted,
                            minWidth: '1rem',
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          style={{
                            width: '0.625rem',
                            height: '0.625rem',
                            borderRadius: '50%',
                            background: cat.color,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            color: T.body,
                          }}
                        >
                          {cat.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {cat.total.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '0.375rem',
                        borderRadius: '9999px',
                        background: T.pageBg,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          background: cat.color,
                          width: `${pct}%`,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Resumen destacado ── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}
          >
            Mes con más ingresos
          </div>
          <div
            style={{ fontSize: '0.925rem', fontWeight: 800, color: T.title }}
          >
            {stats.bestIncomeMonth?.label ?? '—'}
          </div>
          <div
            style={{ fontSize: '0.775rem', color: T.green, fontWeight: 600 }}
          >
            {stats.bestIncomeMonth
              ? fmt(
                  stats.bestIncomeMonth.income,
                  baseCurrency,
                  baseCurrency,
                  rates
                )
              : '—'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}
          >
            Mes con más gastos
          </div>
          <div
            style={{ fontSize: '0.925rem', fontWeight: 800, color: T.title }}
          >
            {stats.worstExpenseMonth?.label ?? '—'}
          </div>
          <div style={{ fontSize: '0.775rem', color: T.red, fontWeight: 600 }}>
            {stats.worstExpenseMonth
              ? fmt(
                  stats.worstExpenseMonth.expenses,
                  baseCurrency,
                  baseCurrency,
                  rates
                )
              : '—'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}
          >
            Categoría con más gasto
          </div>
          <div
            style={{ fontSize: '0.925rem', fontWeight: 800, color: T.title }}
          >
            {stats.topCategory?.name ?? '—'}
          </div>
          <div style={{ fontSize: '0.775rem', color: T.red, fontWeight: 600 }}>
            {stats.topCategory
              ? fmt(stats.topCategory.total, baseCurrency, baseCurrency, rates)
              : '—'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}
          >
            Meses analizados
          </div>
          <div
            style={{ fontSize: '0.925rem', fontWeight: 800, color: T.title }}
          >
            {stats.monthCount} mes{stats.monthCount !== 1 ? 'es' : ''}
          </div>
          <div
            style={{ fontSize: '0.775rem', color: T.muted, fontWeight: 600 }}
          >
            {rangeMonths === 'all'
              ? 'Todo el histórico'
              : `Últimos ${rangeMonths} meses`}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnualCalendarView({
  annualData,
  annualYear,
  T,
  onSelectMonth,
  onChangeYear,
  baseCurrency,
  rates,
}: {
  annualData: any[];
  annualYear: number;
  T: any;
  onSelectMonth: (monthIdx: number) => void;
  onChangeYear: (delta: number) => void;
  baseCurrency: string;
  rates: Record<string, number>;
}) {
  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* ── Navegación del año ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => onChangeYear(-1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.body,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: T.title }}>
          {annualYear}
        </span>
        <button
          onClick={() => onChangeYear(1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.body,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          ›
        </button>
      </div>

      {/* ── Leyenda ── */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          color: T.muted,
        }}
      >
        {[
          { color: T.green, label: 'Balance positivo' },
          { color: T.red, label: 'Balance negativo' },
          { color: T.amber, label: 'Balance ajustado' },
          { color: T.cardBorder, label: 'Sin datos' },
        ].map((item) => (
          <span
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.2rem',
                background: item.color,
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* ── Grid de 12 meses ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        {annualData.map((m) => {
          const isCurrentMonth = m.isCurrent;
          const borderColor = isCurrentMonth ? T.accent : T.cardBorder;
          return (
            <div
              key={m.monthIdx}
              onClick={() => onSelectMonth(m.monthIdx)}
              style={{
                borderRadius: '1rem',
                background: T.cardBg,
                border: `2px solid ${borderColor}`,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isCurrentMonth
                  ? `0 0 0 2px ${T.accent}33`
                  : T.cardShadow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = T.cardShadowLg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isCurrentMonth
                  ? `0 0 0 2px ${T.accent}33`
                  : T.cardShadow;
              }}
            >
              <div style={{ height: '0.3rem', background: m.indicatorColor }} />
              <div style={{ padding: '0.875rem 1rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrentMonth ? 800 : 700,
                    color: isCurrentMonth ? T.accent : T.title,
                    marginBottom: '0.625rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {m.label}
                  {isCurrentMonth && (
                    <span
                      style={{
                        marginLeft: '0.375rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: T.accent,
                        color: '#fff',
                        verticalAlign: 'middle',
                      }}
                    >
                      HOY
                    </span>
                  )}
                </div>

                {m.hasRealMovements ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Ingresos</span>
                      <span style={{ color: T.green, fontWeight: 700 }}>
                        +
                        {m.realIncome.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Gastos</span>
                      <span style={{ color: T.red, fontWeight: 700 }}>
                        -
                        {m.realExpense.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        paddingTop: '0.25rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                        marginTop: '0.1rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Neto</span>
                      <span style={{ color: m.indicatorColor }}>
                        {m.realNet >= 0 ? '+' : ''}
                        {m.realNet.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                ) : m.isPast ? (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      fontStyle: 'italic',
                    }}
                  >
                    Sin movimientos
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: T.muted }}>
                      Proyectado:
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: m.netBalance >= 0 ? T.green : T.red,
                      }}
                    >
                      {m.netBalance >= 0 ? '+' : ''}
                      {m.netBalance.toLocaleString('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                )}

                {(m.expiringGoals.length > 0 || m.hasAlert) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {m.expiringGoals.length > 0 && (
                      <span
                        title={`${m.expiringGoals.length} objetivo${
                          m.expiringGoals.length !== 1 ? 's' : ''
                        } que vence${
                          m.expiringGoals.length !== 1 ? 'n' : ''
                        } este mes`}
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.amberBg,
                          color: T.amber,
                          border: `1px solid ${T.amberBorder}`,
                          fontWeight: 700,
                        }}
                      >
                        🎯 {m.expiringGoals.length}
                      </span>
                    )}
                    {m.hasAlert && !m.isPast && (
                      <span
                        title="Balance proyectado negativo"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.redBg,
                          color: T.red,
                          border: `1px solid ${T.redBorder}`,
                          fontWeight: 700,
                        }}
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Nota ── */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.75rem',
          color: T.muted,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        💡 Haz clic en cualquier mes para ver su detalle en la vista mensual
      </div>
    </div>
  );
}

// ─── Motor de parseo CSV bancario ────────────────────────────────────────────

function parseDate(raw: string, fmt: BankFormat['dateFormat']): string {
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return '';
  try {
    if (fmt === 'dd/mm/yyyy' || fmt === 'dd-mm-yyyy') {
      const sep = s.includes('/') ? '/' : '-';
      const [d, m, y] = s.split(sep);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (fmt === 'dd/mm/yy') {
      const [d, m, y] = s.split('/');
      return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (fmt === 'yyyy-mm-dd') {
      return s.slice(0, 10);
    }
  } catch {}
  return s;
}

function parseAmount(raw: string, decimalSep: ',' | '.'): number {
  if (!raw) return 0;
  let s = raw.trim().replace(/\s/g, '');
  // Quitar símbolo de moneda
  s = s.replace(/[€$£]/g, '');
  if (decimalSep === ',') {
    // Formato europeo: 1.234,56
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // Formato anglosajón: 1,234.56
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseBankCSV(
  raw: string,
  format: BankFormat
): {
  rows: (Omit<
    ImportRow,
    | 'id'
    | 'status'
    | 'duplicateOf'
    | 'categoryId'
    | 'accountId'
    | 'currency'
    | 'notes'
  > & { detectedCurrency?: string })[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: ReturnType<typeof parseBankCSV>['rows'] = [];

  // Normalizar saltos de línea
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Saltar cabeceras
  const dataLines = lines
    .slice(format.skipRows)
    .filter((l) => l.trim().length > 0);

  dataLines.forEach((line, idx) => {
    try {
      const cols = splitCSVLine(line, format.separator);
      if (cols.length < 2) return;

      // Extraer campos según el mapeo de columnas
      const get = (key: BankColumnKey): string => {
        const i = format.columns.indexOf(key);
        return i >= 0 ? (cols[i] ?? '').trim() : '';
      };

      const rawDate = get('date') || get('valueDate');
      const rawValDate = get('valueDate') || get('date');
      const rawDesc = get('description');

      let amount = 0;
      if (format.amountMode === 'single') {
        amount = parseAmount(get('amount'), format.decimal);
      } else {
        const amtIn = parseAmount(get('amountIn'), format.decimal);
        const amtOut = parseAmount(get('amountOut'), format.decimal);
        amount = amtIn > 0 ? amtIn : -amtOut;
      }

      if (!rawDate && !rawDesc && amount === 0) return;

      const entryDate = parseDate(rawDate, format.dateFormat) || today();
      const valueDate = parseDate(rawValDate, format.dateFormat) || entryDate;
      const description = rawDesc || `Movimiento ${idx + 1}`;

      let type: 'income' | 'expense';
      if (format.negativeIsExpense) {
        type = amount >= 0 ? 'income' : 'expense';
      } else {
        type = amount < 0 ? 'income' : 'expense';
      }
      const absAmount = Math.abs(amount);

      if (absAmount === 0) return;

      const rowCurrency = get('currency') || '';
      rows.push({
        entryDate,
        valueDate,
        description,
        amount: absAmount,
        type,
        detectedCurrency: rowCurrency,
      });
    } catch (e) {
      errors.push(`Línea ${idx + format.skipRows + 1}: ${String(e)}`);
    }
  });

  return { rows, errors };
}

// ─── Auto-categorización ──────────────────────────────────────────────────────
function autoCategorizRow(
  description: string,
  type: 'income' | 'expense',
  categories: any[],
  categoryRules: CategoryRule[]
): string {
  const desc = description.toLowerCase();

  // Primero buscamos en las reglas personalizadas del usuario
  for (const rule of categoryRules) {
    const cat = categories.find((c) => c.id === rule.categoryId);
    if (!cat || cat.type !== type) continue;
    if (rule.keywords.some((kw) => desc.includes(kw.toLowerCase()))) {
      return rule.categoryId;
    }
  }

  // Luego en las reglas por defecto
  for (const [catName, keywords] of Object.entries(
    DEFAULT_CATEGORY_RULES_KEYWORDS
  )) {
    const cat = categories.find((c) => c.name === catName && c.type === type);
    if (!cat) continue;
    if (keywords.some((kw) => desc.includes(kw.toLowerCase()))) {
      return cat.id;
    }
  }

  return '';
}

// ─── Detección de duplicados ──────────────────────────────────────────────────
function findDuplicate(
  row: { amount: number; valueDate: string; type: 'income' | 'expense' },
  existingExpenses: RealExpense[]
): string | undefined {
  // Criterio: mismo importe + mismo tipo + misma fecha de valor (±1 día)
  const rowDate = new Date(row.valueDate);

  const match = existingExpenses.find((e) => {
    if (e.type !== row.type) return false;
    if (Math.abs(e.amount - row.amount) > 0.01) return false;
    const eDate = new Date(e.valueDate);
    const diffMs = Math.abs(eDate.getTime() - rowDate.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 2;
  });

  return match?.id;
}

// ─── BankImportModal ──────────────────────────────────────────────────────────
function BankImportModal({ onClose }: { onClose: () => void }) {
  const {
    T,
    accounts,
    categories,
    realExpenses,
    setRealExpenses,
    baseCurrency,
    bankFormats,
    setBankFormats,
    categoryRules,
    setCategoryRules,
    dateFormat,
  } = useApp();

  const toast = useToast();

  // ── Pasos: 1=elegir banco, 2=subir CSV, 3=vista previa ───────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Paso 1: selección de formato ─────────────────────────────────────────
  const allFormats: BankFormat[] = [...PREDEFINED_BANK_FORMATS, ...bankFormats];
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    PREDEFINED_BANK_FORMATS[0].id
  );

  const handleSelectFormat = (id: string) => {
    setSelectedFormatId(id);
    setOverrideSkipRows(null);
    setRawCSV('');
  };

  const [showCustomForm, setShowCustomForm] = useState(false);

  // Formulario formato personalizado
  const emptyCustomFormat: BankFormat = {
    id: '',
    name: '',
    isCustom: true,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'description', 'amount'],
    negativeIsExpense: true,
  };
  const [customForm, setCustomForm] = useState<BankFormat>(emptyCustomFormat);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [confirmDeleteFormat, setConfirmDeleteFormat] = useState<string | null>(
    null
  );

  // ── Paso 2: carga de fichero ──────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawCSV, setRawCSV] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? ''
  );
  const [overrideSkipRows, setOverrideSkipRows] = useState<number | null>(null);

  // ── Paso 3: vista previa ──────────────────────────────────────────────────
  const [importRows, setImportRows] = useState<ImportRow[]>([]);

  // ── Reglas de categorización ──────────────────────────────────────────────
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [ruleForm, setRuleForm] = useState<{
    categoryId: string;
    keywords: string;
  }>({
    categoryId: '',
    keywords: '',
  });

  // ── Helpers de estilo ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.inputText,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '0.75rem',
  };
  const selStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const btnPrimary: React.CSSProperties = {
    padding: '0.65rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: T.accent,
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
  };
  const btnSec: React.CSSProperties = {
    padding: '0.65rem 1.25rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.cardBorder}`,
    background: T.btnSecBg,
    color: T.btnSecText,
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
  };

  // ── Generar vista previa ──────────────────────────────────────────────────
  const generatePreview = () => {
    const format = allFormats.find((f) => f.id === selectedFormatId);
    if (!format || !rawCSV) return;

    const effectiveFormat =
      overrideSkipRows !== null
        ? { ...format, skipRows: overrideSkipRows }
        : format;

    const { rows, errors } = parseBankCSV(rawCSV, effectiveFormat);

    setParseErrors(errors);

    const account = accounts.find((a) => a.id === selectedAccountId);
    const currency = account?.currency ?? baseCurrency;

    const importRowsList: ImportRow[] = rows.map((r) => {
      const catId = autoCategorizRow(
        r.description,
        r.type,
        categories,
        categoryRules
      );
      const dupId = findDuplicate(r, realExpenses);
      const rowCurrency =
        r.detectedCurrency &&
        CURRENCIES.find((c) => c.code === r.detectedCurrency.toUpperCase())
          ? r.detectedCurrency.toUpperCase()
          : currency;
      return {
        id: uid(),
        entryDate: r.entryDate,
        valueDate: r.valueDate,
        description: r.description,
        amount: r.amount,
        type: r.type,
        categoryId: catId,
        accountId: selectedAccountId,
        currency: rowCurrency,
        status: dupId ? 'duplicate' : 'new',
        duplicateOf: dupId,
        notes: '',
      };
    });

    setImportRows(importRowsList);
    setStep(3);
  };

  // ── Confirmar importación ─────────────────────────────────────────────────
  const confirmImport = () => {
    const toImport = importRows.filter((r) => r.status === 'new');
    const newExpenses: RealExpense[] = toImport.map((r) => ({
      id: uid(),
      entryDate: r.entryDate,
      valueDate: r.valueDate,
      description: r.description,
      categoryId: r.categoryId,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      accountId: r.accountId,
      notes: r.notes,
    }));

    setRealExpenses((prev) => [...prev, ...newExpenses]);
    toast(
      `${newExpenses.length} movimiento${
        newExpenses.length !== 1 ? 's' : ''
      } importado${newExpenses.length !== 1 ? 's' : ''} correctamente`,
      'success'
    );
    onClose();
  };

  const newCount = importRows.filter((r) => r.status === 'new').length;
  const dupCount = importRows.filter((r) => r.status === 'duplicate').length;
  const discardedCount = importRows.filter(
    (r) => r.status === 'discarded'
  ).length;

  // ── Guardar formato personalizado ─────────────────────────────────────────
  const saveCustomFormat = () => {
    if (!customForm.name.trim()) return;
    const id = editingCustomId ?? uid();
    const saved: BankFormat = { ...customForm, id, isCustom: true };
    if (editingCustomId) {
      setBankFormats((prev) =>
        prev.map((f) => (f.id === editingCustomId ? saved : f))
      );
      toast('Formato actualizado', 'success');
    } else {
      setBankFormats((prev) => [...prev, saved]);
      toast('Formato guardado', 'success');
    }
    handleSelectFormat(id);
    setShowCustomForm(false);

    setEditingCustomId(null);
    setCustomForm(emptyCustomFormat);
  };

  // ── Guardar regla de categorización ──────────────────────────────────────
  const saveRule = () => {
    if (!ruleForm.categoryId || !ruleForm.keywords.trim()) return;
    const keywords = ruleForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (editingRule) {
      setCategoryRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? { ...r, categoryId: ruleForm.categoryId, keywords }
            : r
        )
      );
    } else {
      setCategoryRules((prev) => [
        ...prev,
        { id: uid(), categoryId: ruleForm.categoryId, keywords },
      ]);
    }
    setEditingRule(null);
    setRuleForm({ categoryId: '', keywords: '' });
    toast('Regla guardada', 'success');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  const selectedFormat = allFormats.find((f) => f.id === selectedFormatId);

  return (
    <Modal
      title="🏦 Importar movimientos bancarios"
      subtitle={
        step === 1
          ? 'Selecciona el formato de tu banco'
          : step === 2
          ? 'Sube el fichero CSV'
          : 'Revisa y confirma la importación'
      }
      onClose={onClose}
      T={T}
    >
      {/* ── Barra de progreso ── */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '0.25rem',
              borderRadius: '9999px',
              background: s <= step ? T.accent : T.cardBorder,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PASO 1 — Elegir banco                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 1 && !showCustomForm && !showRulesEditor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Lista de bancos predefinidos */}
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
              }}
            >
              Bancos disponibles
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {allFormats.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFormat(f.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    border: `2px solid ${
                      selectedFormatId === f.id ? T.accent : T.cardBorder
                    }`,
                    background:
                      selectedFormatId === f.id ? T.accentLight : T.pageBg,
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>
                      {f.isCustom ? '⚙️' : '🏦'}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: T.muted }}>
                        {f.isCustom
                          ? 'Formato personalizado'
                          : `Separador: "${f.separator}" · Decimales: "${f.decimal}" · Cabeceras: ${f.skipRows}`}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.375rem',
                      alignItems: 'center',
                    }}
                  >
                    {f.isCustom && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomForm(f);
                            setEditingCustomId(f.id);
                            setShowCustomForm(true);
                          }}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${T.cardBorder}`,
                            background: T.btnSecBg,
                            color: T.btnSecText,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteFormat(f.id);
                          }}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${T.redBorder}`,
                            background: T.redBg,
                            color: T.red,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {selectedFormatId === f.id && (
                      <Check size={16} color={T.accent} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmación eliminación */}
          {confirmDeleteFormat && (
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: T.red,
                  marginBottom: '0.625rem',
                }}
              >
                ¿Eliminar este formato personalizado?
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setBankFormats((prev) =>
                      prev.filter((f) => f.id !== confirmDeleteFormat)
                    );
                    if (selectedFormatId === confirmDeleteFormat)
                      setSelectedFormatId(PREDEFINED_BANK_FORMATS[0].id);
                    setConfirmDeleteFormat(null);
                    toast('Formato eliminado', 'success');
                  }}
                  style={{
                    ...btnPrimary,
                    background: T.red,
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDeleteFormat(null)}
                  style={{
                    ...btnSec,
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setCustomForm(emptyCustomFormat);
                setEditingCustomId(null);
                setShowCustomForm(true);
              }}
              style={{ ...btnSec, flex: 1 }}
            >
              ➕ Nuevo banco personalizado
            </button>
            <button
              onClick={() => setShowRulesEditor(true)}
              style={{ ...btnSec, flex: 1 }}
            >
              🏷️ Reglas de categorías
            </button>
          </div>

          <button
            onClick={() => setStep(2)}
            style={{ ...btnPrimary, width: '100%' }}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── Editor de formato personalizado ── */}
      {step === 1 && showCustomForm && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: T.title,
              marginBottom: '0.25rem',
            }}
          >
            {editingCustomId
              ? '✏️ Editar formato'
              : '➕ Nuevo formato bancario'}
          </div>

          <div>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Nombre del banco
            </label>
            <input
              style={inputStyle}
              placeholder="Ej: Mi Banco"
              value={customForm.name}
              onChange={(e) =>
                setCustomForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Separador
              </label>
              <select
                style={selStyle}
                value={customForm.separator}
                onChange={(e) =>
                  setCustomForm((f) => ({
                    ...f,
                    separator: e.target.value as any,
                  }))
                }
              >
                <option value=";">Punto y coma ( ; )</option>
                <option value=",">Coma ( , )</option>
                <option value={'\t'}>Tabulador</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Decimal
              </label>
              <select
                style={selStyle}
                value={customForm.decimal}
                onChange={(e) =>
                  setCustomForm((f) => ({
                    ...f,
                    decimal: e.target.value as any,
                  }))
                }
              >
                <option value=",">Coma ( , )</option>
                <option value=".">Punto ( . )</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Formato fecha
              </label>
              <select
                style={selStyle}
                value={customForm.dateFormat}
                onChange={(e) =>
                  setCustomForm((f) => ({
                    ...f,
                    dateFormat: e.target.value as any,
                  }))
                }
              >
                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                <option value="dd/mm/yy">DD/MM/YY</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Filas de cabecera
              </label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                max={20}
                value={customForm.skipRows}
                onChange={(e) =>
                  setCustomForm((f) => ({
                    ...f,
                    skipRows: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Modo importe
            </label>
            <select
              style={selStyle}
              value={customForm.amountMode}
              onChange={(e) =>
                setCustomForm((f) => ({
                  ...f,
                  amountMode: e.target.value as any,
                }))
              }
            >
              <option value="single">Una columna con + / -</option>
              <option value="split">Dos columnas (entrada / salida)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Orden de columnas (de izquierda a derecha)
            </label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {customForm.columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      minWidth: '3rem',
                    }}
                  >
                    Col {i + 1}
                  </span>
                  <select
                    value={col}
                    onChange={(e) =>
                      setCustomForm((f) => {
                        const cols = [...f.columns];
                        cols[i] = e.target.value as BankColumnKey;
                        return { ...f, columns: cols };
                      })
                    }
                    style={{ ...selStyle, marginBottom: 0, flex: 1 }}
                  >
                    {BANK_COLUMN_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      setCustomForm((f) => ({
                        ...f,
                        columns: f.columns.filter((_, j) => j !== i),
                      }))
                    }
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${T.redBorder}`,
                      background: T.redBg,
                      color: T.red,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setCustomForm((f) => ({
                    ...f,
                    columns: [...f.columns, 'ignore'],
                  }))
                }
                style={{
                  ...btnSec,
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  alignSelf: 'flex-start',
                }}
              >
                + Añadir columna
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              onClick={saveCustomFormat}
              disabled={!customForm.name.trim()}
              style={{
                ...btnPrimary,
                flex: 1,
                opacity: customForm.name.trim() ? 1 : 0.5,
              }}
            >
              ✅ Guardar formato
            </button>
            <button
              onClick={() => {
                setShowCustomForm(false);
                setEditingCustomId(null);
                setCustomForm(emptyCustomFormat);
              }}
              style={btnSec}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Editor de reglas de categorización ── */}
      {step === 1 && showRulesEditor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 800, color: T.title }}
          >
            🏷️ Reglas de auto-categorización
          </div>
          <div
            style={{ fontSize: '0.775rem', color: T.muted, lineHeight: 1.5 }}
          >
            Cuando la descripción de un movimiento contenga alguna de estas
            palabras, se asignará automáticamente esa categoría.
          </div>

          {/* Lista de reglas existentes */}
          {categoryRules.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {categoryRules.map((rule) => {
                const cat = categories.find((c) => c.id === rule.categoryId);
                return (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.75rem',
                      background: T.pageBg,
                      border: `1px solid ${T.cardBorder}`,
                    }}
                  >
                    <span
                      style={{
                        width: '0.625rem',
                        height: '0.625rem',
                        borderRadius: '50%',
                        background: cat?.color ?? T.cardBorder,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: T.title,
                        }}
                      >
                        {cat?.name ?? 'Sin categoría'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: T.muted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rule.keywords.join(', ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleForm({
                            categoryId: rule.categoryId,
                            keywords: rule.keywords.join(', '),
                          });
                        }}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${T.cardBorder}`,
                          background: T.btnSecBg,
                          color: T.btnSecText,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setCategoryRules((prev) =>
                            prev.filter((r) => r.id !== rule.id)
                          );
                          toast('Regla eliminada', 'success');
                        }}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${T.redBorder}`,
                          background: T.redBg,
                          color: T.red,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario nueva regla / editar */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.875rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
              }}
            >
              {editingRule ? 'Editar regla' : 'Nueva regla'}
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Categoría
              </label>
              <select
                style={selStyle}
                value={ruleForm.categoryId}
                onChange={(e) =>
                  setRuleForm((r) => ({ ...r, categoryId: e.target.value }))
                }
              >
                <option value="">— Selecciona —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'income' ? 'Ingreso' : 'Gasto'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  display: 'block',
                  marginBottom: '0.35rem',
                }}
              >
                Palabras clave (separadas por comas)
              </label>
              <input
                style={inputStyle}
                placeholder="Ej: mercadona, lidl, supermercado"
                value={ruleForm.keywords}
                onChange={(e) =>
                  setRuleForm((r) => ({ ...r, keywords: e.target.value }))
                }
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={saveRule}
                disabled={!ruleForm.categoryId || !ruleForm.keywords.trim()}
                style={{
                  ...btnPrimary,
                  opacity:
                    !ruleForm.categoryId || !ruleForm.keywords.trim() ? 0.5 : 1,
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem',
                }}
              >
                ✅ {editingRule ? 'Actualizar' : 'Guardar'} regla
              </button>
              {editingRule && (
                <button
                  onClick={() => {
                    setEditingRule(null);
                    setRuleForm({ categoryId: '', keywords: '' });
                  }}
                  style={{
                    ...btnSec,
                    fontSize: '0.8rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <button onClick={() => setShowRulesEditor(false)} style={btnSec}>
            ← Volver
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PASO 2 — Subir CSV                                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Info del banco seleccionado */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.875rem',
              background: T.accentLight,
              border: `1px solid ${T.accent}33`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🏦</span>
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: T.accent,
                }}
              >
                {selectedFormat?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: T.muted }}>
                Separador: "{selectedFormat?.separator}" · Decimales: "
                {selectedFormat?.decimal}" · Cabeceras:{' '}
                {selectedFormat?.skipRows} fila
                {selectedFormat?.skipRows !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Nota específica del banco */}
          {selectedFormat?.note && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                background: T.amberBg,
                border: `1px solid ${T.amberBorder}`,
                fontSize: '0.775rem',
                color: T.amber,
                lineHeight: 1.5,
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ flexShrink: 0 }}>💡</span>
              <span>{selectedFormat.note}</span>
            </div>
          )}

          {/* Cuenta destino */}
          <div>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '0.35rem',
              }}
            >
              Cuenta destino
            </label>
            <select
              style={selStyle}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency ?? baseCurrency})
                </option>
              ))}
            </select>
          </div>

          {/* Subir fichero */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) =>
                setRawCSV((ev.target?.result as string) ?? '');
              reader.readAsText(
                file,
                selectedFormat?.encoding === 'latin1' ? 'ISO-8859-1' : 'UTF-8'
              );
              e.target.value = '';
            }}
          />

          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              cursor: 'pointer',
              textAlign: 'center',
              border: `2px dashed ${rawCSV ? T.accent : T.cardBorder}`,
              background: rawCSV ? T.accentLight : T.pageBg,
              color: rawCSV ? T.accent : T.muted,
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            {rawCSV
              ? '✅ Fichero cargado — pulsa para cambiar'
              : '📂 Seleccionar fichero CSV'}
          </button>

          {rawCSV && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.75rem',
                  background: T.accentLight,
                  border: `1px solid ${T.accent}33`,
                }}
              >
                <span
                  style={{
                    fontSize: '0.775rem',
                    color: T.accent,
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  ⚙️ Filas de cabecera a saltar
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    onClick={() =>
                      setOverrideSkipRows((s) =>
                        Math.max(0, (s ?? selectedFormat?.skipRows ?? 0) - 1)
                      )
                    }
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${T.cardBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.accent,
                      minWidth: '1.5rem',
                      textAlign: 'center',
                    }}
                  >
                    {overrideSkipRows ?? selectedFormat?.skipRows ?? 0}
                  </span>
                  <button
                    onClick={() =>
                      setOverrideSkipRows(
                        (s) => (s ?? selectedFormat?.skipRows ?? 0) + 1
                      )
                    }
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${T.cardBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                style={{
                  borderRadius: '0.75rem',
                  border: `1px solid ${T.cardBorder}`,
                  overflow: 'hidden',
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  maxHeight: '16rem',
                  overflowY: 'auto',
                }}
              >
                {rawCSV
                  .split('\n')
                  .slice(0, 50)
                  .filter((l) => l.trim())
                  .map((line, i) => {
                    const skip =
                      overrideSkipRows ?? selectedFormat?.skipRows ?? 0;
                    const isHeader = i < skip;
                    const isFirstData = i === skip;
                    return (
                      <div
                        key={i}
                        style={{
                          padding: '0.3rem 0.625rem',
                          background: isFirstData
                            ? T.greenBg
                            : isHeader
                            ? T.pageBg
                            : T.cardBg,
                          borderBottom: `1px solid ${T.cardBorder}`,
                          color: isHeader ? T.muted : T.body,
                          borderLeft: isFirstData
                            ? `3px solid ${T.green}`
                            : '3px solid transparent',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            color: isFirstData ? T.green : T.muted,
                            minWidth: '1.5rem',
                            fontWeight: isFirstData ? 700 : 400,
                            fontSize: '0.65rem',
                          }}
                        >
                          {isFirstData ? '▶' : i + 1}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {line.length > 90 ? line.slice(0, 90) + '...' : line}
                        </span>
                        {isFirstData && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              background: T.green,
                              color: '#fff',
                              padding: '0.1rem 0.375rem',
                              borderRadius: '9999px',
                              flexShrink: 0,
                            }}
                          >
                            INICIO
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: T.amberBg,
                border: `1px solid ${T.amberBorder}`,
                fontSize: '0.775rem',
                color: T.amber,
              }}
            >
              ⚠️ {parseErrors.length} línea{parseErrors.length !== 1 ? 's' : ''}{' '}
              con errores (se ignorarán)
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              onClick={generatePreview}
              disabled={!rawCSV || !selectedAccountId}
              style={{
                ...btnPrimary,
                flex: 1,
                opacity: !rawCSV || !selectedAccountId ? 0.5 : 1,
                cursor:
                  !rawCSV || !selectedAccountId ? 'not-allowed' : 'pointer',
              }}
            >
              Vista previa →
            </button>
            <button onClick={() => setStep(1)} style={btnSec}>
              ← Atrás
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PASO 3 — Vista previa                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Resumen */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.625rem',
            }}
          >
            {[
              {
                label: 'Nuevos',
                value: newCount,
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
              },
              {
                label: 'Posibles duplicados',
                value: dupCount,
                color: T.amber,
                bg: T.amberBg,
                border: T.amberBorder,
              },
              {
                label: 'Descartados',
                value: discardedCount,
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.875rem',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: item.color,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Lista de movimientos */}
          <div
            style={{
              maxHeight: '22rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            {importRows.map((row) => {
              const cat = categories.find((c) => c.id === row.categoryId);
              const dupRow = row.duplicateOf
                ? realExpenses.find((e) => e.id === row.duplicateOf)
                : null;
              const statusColors = {
                new: { bg: T.greenBg, border: T.greenBorder, color: T.green },
                duplicate: {
                  bg: T.amberBg,
                  border: T.amberBorder,
                  color: T.amber,
                },
                discarded: {
                  bg: T.pageBg,
                  border: T.cardBorder,
                  color: T.muted,
                },
              };
              const sc = statusColors[row.status];

              return (
                <div
                  key={row.id}
                  style={{
                    padding: '0.75rem 0.875rem',
                    borderRadius: '0.75rem',
                    background: sc.bg,
                    border: `1.5px solid ${sc.border}`,
                    opacity: row.status === 'discarded' ? 0.5 : 1,
                  }}
                >
                  {/* Fila principal */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: row.status === 'duplicate' ? '0.5rem' : 0,
                    }}
                  >
                    {/* Tipo */}
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                      {row.type === 'income' ? '📈' : '📉'}
                    </span>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.title,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {row.description}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: T.muted }}>
                        {fmtDateDMY(row.valueDate, dateFormat)}
                      </div>
                    </div>

                    {/* Importe */}
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: row.type === 'income' ? T.green : T.red,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {row.type === 'income' ? '+' : '-'}
                      {row.amount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {row.currency}
                    </div>

                    {/* Estado badge */}
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: sc.color,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {row.status === 'new'
                        ? 'NUEVO'
                        : row.status === 'duplicate'
                        ? 'DUPLICADO'
                        : 'DESCARTADO'}
                    </span>
                  </div>

                  {/* Selector de categoría */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.375rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: T.muted,
                        flexShrink: 0,
                      }}
                    >
                      Categoría:
                    </span>
                    <select
                      value={row.categoryId}
                      onChange={(e) =>
                        setImportRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? { ...r, categoryId: e.target.value }
                              : r
                          )
                        )
                      }
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${T.cardBorder}`,
                        background: T.inputBg,
                        color: T.inputText,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="">— Sin categoría —</option>
                      {categories
                        .filter((c) => c.type === row.type)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>

                    {/* Acciones */}
                    {row.status !== 'discarded' && (
                      <button
                        onClick={() =>
                          setImportRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, status: 'discarded' }
                                : r
                            )
                          )
                        }
                        title="Descartar este movimiento"
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${T.cardBorder}`,
                          background: T.btnSecBg,
                          color: T.muted,
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Descartar
                      </button>
                    )}
                    {row.status === 'discarded' && (
                      <button
                        onClick={() =>
                          setImportRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? {
                                    ...r,
                                    status: row.duplicateOf
                                      ? 'duplicate'
                                      : 'new',
                                  }
                                : r
                            )
                          )
                        }
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${T.greenBorder}`,
                          background: T.greenBg,
                          color: T.green,
                          cursor: 'pointer',
                        }}
                      >
                        ↩️ Restaurar
                      </button>
                    )}
                    {row.status === 'duplicate' && (
                      <button
                        onClick={() =>
                          setImportRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, status: 'new' } : r
                            )
                          )
                        }
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${T.accent}44`,
                          background: T.accentLight,
                          color: T.accent,
                          cursor: 'pointer',
                        }}
                      >
                        ✅ Importar igualmente
                      </button>
                    )}
                  </div>

                  {/* Info duplicado */}
                  {row.status === 'duplicate' && dupRow && (
                    <div
                      style={{
                        marginTop: '0.375rem',
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.5rem',
                        background: T.amberBg,
                        border: `1px solid ${T.amberBorder}`,
                        fontSize: '0.68rem',
                        color: T.amber,
                      }}
                    >
                      ⚠️ Posible duplicado en la app:{' '}
                      <strong>{dupRow.description}</strong> ·{' '}
                      {fmtDateDMY(dupRow.valueDate, dateFormat)} ·{' '}
                      {dupRow.amount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {dupRow.currency}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {importRows.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: T.muted,
                fontSize: '0.875rem',
              }}
            >
              No se encontraron movimientos válidos en el fichero. Comprueba el
              formato seleccionado.
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              onClick={confirmImport}
              disabled={newCount === 0}
              style={{
                ...btnPrimary,
                flex: 1,
                background: T.green,
                opacity: newCount === 0 ? 0.5 : 1,
                cursor: newCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ✅ Importar {newCount} movimiento{newCount !== 1 ? 's' : ''}
            </button>
            <button onClick={() => setStep(2)} style={btnSec}>
              ← Atrás
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── PrintButton ──────────────────────────────────────────────────────────────
function PrintButton({ T }: { T: any }) {
  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'fh-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        .fh-print-section, .fh-print-section * { visibility: visible; }
        .fh-print-section { position: absolute; left: 0; top: 0; width: 100%; background: white; z-index: 9999; }
        .fh-no-print { display: none !important; }
        * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .fh-print-section > * { page-break-inside: avoid; break-inside: avoid; }
        .fh-print-section > * > * { page-break-inside: avoid; break-inside: avoid; }
        @page { margin: 1.5cm; }
      }
      body { position: relative !important; }
    `;

    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('fh-print-style');
      if (el) el.remove();
    }, 1000);
  };

  return (
    <button
      onClick={handlePrint}
      className="fh-no-print"
      title="Imprimir / Guardar como PDF"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1.25rem',
        borderRadius: '0.75rem',
        border: `1.5px solid ${T.cardBorder}`,
        background: T.btnSecBg,
        color: T.btnSecText,
        fontSize: '0.875rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      🖨️ Imprimir
    </button>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────
function Reports() {
  const {
    T,
    accounts,
    categories,
    projections,
    realExpenses,
    goals,
    baseCurrency,
    displayCurrency,
    rates,
    realBalanceMap,
    dateFormat,
  } = useApp();

  const now = new Date();

  // ── Selector de período ───────────────────────────────────────────────────
  const [reportType, setReportType] = useState<
    'movements' | 'accounts' | 'projections' | 'goals' | 'trends'
  >('movements');
  const [mode, setMode] = useState<'month' | 'range'>('month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [rangeFrom, setRangeFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [rangeTo, setRangeTo] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  // ── Claves de meses en el período ─────────────────────────────────────────
  const periodKeys = useMemo(() => {
    if (mode === 'month') {
      return [`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`];
    }
    const keys: string[] = [];
    const [fy, fm] = rangeFrom.split('-').map(Number);
    const [ty, tm] = rangeTo.split('-').map(Number);
    let y = fy,
      m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      keys.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return keys;
  }, [mode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  const periodLabel = useMemo(() => {
    if (mode === 'month') {
      return new Date(selectedYear, selectedMonth, 1).toLocaleString('es-ES', {
        month: 'long',
        year: 'numeric',
      });
    }
    if (rangeFrom === rangeTo) return rangeFrom;
    return `${rangeFrom} → ${rangeTo}`;
  }, [mode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  // ── Movimientos reales válidos del período ────────────────────────────────
  const periodReals = useMemo(() => {
    return realExpenses.filter((e) => {
      if (!periodKeys.includes(e.valueDate.slice(0, 7))) return false;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      return e.valueDate > acc.date;
    });
  }, [realExpenses, accounts, periodKeys]);

  // ── Proyecciones activas en el período ────────────────────────────────────
  const periodProjections = useMemo(() => {
    const result: Array<{ proj: any; mk: string }> = [];
    periodKeys.forEach((mk) => {
      const [y, m] = mk.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      projections.forEach((p) => {
        const start = new Date(p.startDate);
        const end = p.endDate ? new Date(p.endDate) : null;
        const freq = FREQUENCIES.find((f) => f.value === p.frequency);
        if (!freq) return;
        const diff =
          (d.getFullYear() - start.getFullYear()) * 12 +
          (d.getMonth() - start.getMonth());
        if (diff < 0 || (end && d > end) || diff % freq.months !== 0) return;
        result.push({ proj: p, mk });
      });
    });
    return result;
  }, [projections, periodKeys]);

  // ── Totales globales ──────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const realIncome = periodReals
      .filter((e) => e.type === 'income')
      .reduce(
        (s, e) =>
          s + convertAmount(e.amount, e.currency, displayCurrency, rates),
        0
      );

    const realExpense = periodReals
      .filter((e) => e.type === 'expense')
      .reduce(
        (s, e) =>
          s + convertAmount(e.amount, e.currency, displayCurrency, rates),
        0
      );

    let pIncome = 0;
    let pExpense = 0;
    periodProjections.forEach(({ proj }) => {
      const acc = accounts.find((a) => a.id === proj.accountId);
      const amt = convertAmount(
        proj.amount,
        acc?.currency ?? baseCurrency,
        displayCurrency,
        rates
      );
      if (proj.type === 'income') pIncome += amt;
      else pExpense += amt;
    });

    const realNet = realIncome - realExpense;
    const savingsRate = realIncome > 0 ? (realNet / realIncome) * 100 : 0;

    return { realIncome, realExpense, realNet, savingsRate, pIncome, pExpense };
  }, [
    periodReals,
    periodProjections,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  // ── Tabla por categoría ───────────────────────────────────────────────────
  const catRows = useMemo(() => {
    const map: Record<
      string,
      {
        catId: string;
        type: 'income' | 'expense';
        projected: number;
        real: number;
      }
    > = {};

    periodProjections.forEach(({ proj }) => {
      const acc = accounts.find((a) => a.id === proj.accountId);
      const amt = convertAmount(
        proj.amount,
        acc?.currency ?? baseCurrency,
        displayCurrency,
        rates
      );
      if (!map[proj.categoryId]) {
        map[proj.categoryId] = {
          catId: proj.categoryId,
          type: proj.type,
          projected: 0,
          real: 0,
        };
      }
      map[proj.categoryId].projected += amt;
    });

    periodReals.forEach((e) => {
      const amt = convertAmount(e.amount, e.currency, displayCurrency, rates);
      if (!map[e.categoryId]) {
        map[e.categoryId] = {
          catId: e.categoryId,
          type: e.type as any,
          projected: 0,
          real: 0,
        };
      }
      map[e.categoryId].real += amt;
    });

    return Object.values(map).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return b.real - a.real;
    });
  }, [
    periodProjections,
    periodReals,
    accounts,
    baseCurrency,
    displayCurrency,
    rates,
  ]);

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (reportType === 'projections') {
      const rows = [
        [
          'Concepto',
          'Tipo',
          'Categoría',
          'Cuenta',
          'Importe',
          'Divisa',
          'Frecuencia',
          'Equiv./mes',
          'Fecha inicio',
          'Fecha fin',
        ],
        ...projections.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId);
          const acc = accounts.find((a) => a.id === p.accountId);
          const freq = FREQUENCIES.find((f) => f.value === p.frequency);
          const monthly = freq ? p.amount / freq.months : p.amount;
          return [
            p.name,
            p.type === 'income' ? 'Ingreso' : 'Gasto',
            cat?.name ?? '—',
            acc?.name ?? '—',
            p.amount,
            acc?.currency ?? baseCurrency,
            freq?.label ?? '—',
            monthly.toFixed(2),
            p.startDate,
            p.endDate || 'Sin fin',
          ];
        }),
      ];
      const csv = rows
        .map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');
      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FinanzasHogar_proyecciones.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const rows = [
      [
        'Fecha apunte',
        'Fecha valor',
        'Descripción',
        'Tipo',
        'Categoría',
        'Cuenta',
        'Importe',
        'Divisa',
        'Notas',
      ],
      ...periodReals.map((e) => {
        const cat = categories.find((c) => c.id === e.categoryId);
        const acc = accounts.find((a) => a.id === e.accountId);
        return [
          e.entryDate,
          e.valueDate,
          e.description,
          e.type === 'income' ? 'Ingreso' : 'Gasto',
          cat?.name ?? '—',
          acc?.name ?? '—',
          e.type === 'income' ? e.amount : -e.amount,
          e.currency,
          e.notes ?? '',
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinanzasHogar_informe_${periodLabel.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Imprimir ──────────────────────────────────────────────────────────────
  const printReport = () => window.print();

  // ── Estilos ───────────────────────────────────────────────────────────────
  const sectionTitle: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: T.muted,
    textTransform: 'uppercase',
    marginBottom: '0.75rem',
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
      className="print-area"
    >
      {/* ── Estilos de impresión ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
        @media screen { .print-area { display: flex; } }
      `}</style>

      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Análisis
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Informes
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Resumen y exportación de tu actividad financiera
          </p>
        </div>

        {/* Botones de acción */}
        <div
          className="no-print"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          {(reportType === 'movements' || reportType === 'projections') && (
            <button
              onClick={exportCSV}
              disabled={reportType === 'movements' && periodReals.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.75rem',
                border: `1.5px solid ${T.greenBorder}`,
                background: T.greenBg,
                color: T.green,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor:
                  reportType === 'movements' && periodReals.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  reportType === 'movements' && periodReals.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              ⬇️ Exportar CSV
            </button>
          )}

          <button
            onClick={printReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.btnSecBg,
              color: T.btnSecText,
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {/* ── Selector de tipo de informe ── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.25rem',
        }}
      >
        {(
          [
            ['movements', '🧾 Movimientos'],
            ['accounts', '🏦 Cuentas'],
            ['projections', '📈 Proyecciones'],
            ['goals', '🎯 Objetivos'],
            ['trends', '📉 Tendencias'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setReportType(v)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: reportType === v ? 'none' : `1px solid ${T.cardBorder}`,
              background: reportType === v ? T.accent : T.cardBg,
              color: reportType === v ? '#fff' : T.muted,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Selector de período ── */}
      <div
        className="no-print"
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={sectionTitle}>Período del informe</div>

        {/* Toggle mes / rango */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(
            [
              ['month', '📅 Mes concreto'],
              ['range', '📆 Rango de meses'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: mode === v ? 'none' : `1px solid ${T.cardBorder}`,
                background: mode === v ? T.accent : T.pageBg,
                color: mode === v ? '#fff' : T.muted,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {mode === 'month' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Año */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => now.getFullYear() - 2 + i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {/* Mes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                {Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: new Date(2024, i, 1).toLocaleString('es-ES', {
                    month: 'long',
                  }),
                })).map((m) => (
                  <option
                    key={m.value}
                    value={m.value}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Desde
              </label>
              <input
                type="month"
                value={rangeFrom}
                max={rangeTo}
                onChange={(e) => setRangeFrom(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <span
              style={{
                color: T.muted,
                fontWeight: 700,
                paddingBottom: '0.5rem',
              }}
            >
              →
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                }}
              >
                Hasta
              </label>
              <input
                type="month"
                value={rangeTo}
                min={rangeFrom}
                onChange={(e) => setRangeTo(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Título del período (para impresión) ── */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: T.title,
            textTransform: 'capitalize' as const,
          }}
        >
          {reportType === 'movements' &&
            `Informe de movimientos — ${periodLabel}`}
          {reportType === 'accounts' && 'Estado de cuentas'}
          {reportType === 'projections' && 'Resumen de proyecciones'}
          {reportType === 'goals' && 'Estado de objetivos'}
          {reportType === 'trends' && 'Resumen de tendencias'}
        </div>
        <div
          style={{ fontSize: '0.8rem', color: T.muted, marginTop: '0.25rem' }}
        >
          Generado el{' '}
          {new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* ── INFORME: Movimientos ── */}
      {reportType === 'movements' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Ingresos reales',
                value: fmt(
                  totals.realIncome,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '📈',
              },
              {
                label: 'Gastos reales',
                value: fmt(
                  totals.realExpense,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.red,
                bg: T.redBg,
                border: T.redBorder,
                icon: '📉',
              },
              {
                label: 'Balance neto',
                value:
                  (totals.realNet >= 0 ? '+' : '') +
                  fmt(totals.realNet, displayCurrency, displayCurrency, rates),
                color: totals.realNet >= 0 ? T.green : T.red,
                bg: totals.realNet >= 0 ? T.greenBg : T.redBg,
                border: totals.realNet >= 0 ? T.greenBorder : T.redBorder,
                icon: totals.realNet >= 0 ? '✅' : '⚠️',
              },
              {
                label: 'Tasa de ahorro',
                value: totals.savingsRate.toFixed(1) + '%',
                color:
                  totals.savingsRate >= 20
                    ? T.green
                    : totals.savingsRate >= 0
                    ? T.amber
                    : T.red,
                bg:
                  totals.savingsRate >= 20
                    ? T.greenBg
                    : totals.savingsRate >= 0
                    ? T.amberBg
                    : T.redBg,
                border:
                  totals.savingsRate >= 20
                    ? T.greenBorder
                    : totals.savingsRate >= 0
                    ? T.amberBorder
                    : T.redBorder,
                icon: '🏦',
              },
              {
                label: 'Ingresos proyect.',
                value: fmt(
                  totals.pIncome,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '📋',
              },
              {
                label: 'Gastos proyect.',
                value: fmt(
                  totals.pExpense,
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '📋',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla por categoría */}
          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Detalle por categoría</div>
              <div style={{ fontSize: '0.8rem', color: T.muted }}>
                Comparativa entre lo proyectado y los movimientos reales del
                período
              </div>
            </div>
            {catRows.length === 0 ? (
              <div
                style={{ padding: '3rem', textAlign: 'center', color: T.muted }}
              >
                Sin datos para el período seleccionado
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderBottom: `2px solid ${T.tableBorder}`,
                      }}
                    >
                      {[
                        'Categoría',
                        'Tipo',
                        'Proyectado',
                        'Real',
                        'Diferencia',
                        '% Ejec.',
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.75rem 1.25rem',
                            textAlign: i === 0 ? 'left' : 'right',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase' as const,
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catRows.map((row, i) => {
                      const cat = categories.find((c) => c.id === row.catId);
                      const diff = row.real - row.projected;
                      const pct =
                        row.projected > 0
                          ? (row.real / row.projected) * 100
                          : null;
                      const isExpense = row.type === 'expense';
                      const overBudget =
                        isExpense && diff > 0 && row.projected > 0;
                      const diffColor = isExpense
                        ? diff > 0
                          ? T.red
                          : diff < 0
                          ? T.green
                          : T.muted
                        : diff > 0
                        ? T.green
                        : diff < 0
                        ? T.amber
                        : T.muted;
                      return (
                        <tr
                          key={row.catId}
                          style={{
                            background:
                              i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                            borderBottom: `1px solid ${T.tableBorder}`,
                          }}
                        >
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.625rem',
                              }}
                            >
                              <span
                                style={{
                                  width: '0.625rem',
                                  height: '0.625rem',
                                  borderRadius: '50%',
                                  background: cat?.color ?? T.muted,
                                  display: 'inline-block',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ fontWeight: 600, color: T.title }}>
                                {cat?.name ?? 'Sin categoría'}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: isExpense ? T.redBg : T.greenBg,
                                color: isExpense ? T.red : T.green,
                                border: `1px solid ${
                                  isExpense ? T.redBorder : T.greenBorder
                                }`,
                              }}
                            >
                              {isExpense ? 'Gasto' : 'Ingreso'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              color: T.muted,
                            }}
                          >
                            {row.projected > 0
                              ? fmt(
                                  row.projected,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: isExpense ? T.red : T.green,
                            }}
                          >
                            {fmt(
                              row.real,
                              displayCurrency,
                              displayCurrency,
                              rates
                            )}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: diffColor,
                            }}
                          >
                            {diff !== 0
                              ? (diff > 0 ? '+' : '') +
                                fmt(
                                  diff,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 1.25rem',
                              textAlign: 'right',
                            }}
                          >
                            {pct !== null ? (
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: overBudget
                                    ? T.red
                                    : pct >= 90
                                    ? T.green
                                    : T.amber,
                                }}
                              >
                                {pct.toFixed(0)}%{overBudget && ' ⚠️'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderTop: `2px solid ${T.tableBorder}`,
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          padding: '0.875rem 1.25rem',
                          fontWeight: 800,
                          color: T.title,
                          fontSize: '0.8rem',
                        }}
                      >
                        TOTAL
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1.25rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: T.muted,
                        }}
                      >
                        {fmt(
                          totals.pIncome + totals.pExpense,
                          displayCurrency,
                          displayCurrency,
                          rates
                        )}
                      </td>
                      <td
                        style={{
                          padding: '0.875rem 1.25rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: T.title,
                        }}
                      >
                        {fmt(
                          totals.realIncome + totals.realExpense,
                          displayCurrency,
                          displayCurrency,
                          rates
                        )}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Lista de movimientos */}
          {periodReals.length > 0 && (
            <div
              style={{
                borderRadius: '1rem',
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}
              >
                <div style={sectionTitle}>Movimientos reales del período</div>
                <div style={{ fontSize: '0.8rem', color: T.muted }}>
                  {periodReals.length} movimiento
                  {periodReals.length !== 1 ? 's' : ''} · ordenados por fecha de
                  valor
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.825rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: T.tableHead,
                        borderBottom: `1px solid ${T.tableBorder}`,
                      }}
                    >
                      {[
                        'Fecha valor',
                        'Descripción',
                        'Categoría',
                        'Cuenta',
                        'Importe',
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.65rem 1rem',
                            textAlign: i < 4 ? 'left' : 'right',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase' as const,
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...periodReals]
                      .sort((a, b) => b.valueDate.localeCompare(a.valueDate))
                      .map((e, i) => {
                        const cat = categories.find(
                          (c) => c.id === e.categoryId
                        );
                        const acc = accounts.find((a) => a.id === e.accountId);
                        return (
                          <tr
                            key={e.id}
                            style={{
                              background:
                                i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                              borderBottom: `1px solid ${T.tableBorder}`,
                            }}
                          >
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                color: T.muted,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {fmtDateDMY(e.valueDate, dateFormat)}
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                fontWeight: 600,
                                color: T.title,
                                maxWidth: '16rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {e.description}
                            </td>
                            <td style={{ padding: '0.625rem 1rem' }}>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                }}
                              >
                                <span
                                  style={{
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    borderRadius: '50%',
                                    background: cat?.color ?? T.muted,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ color: T.body }}>
                                  {cat?.name ?? '—'}
                                </span>
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                color: T.muted,
                              }}
                            >
                              {acc?.name ?? '—'}
                            </td>
                            <td
                              style={{
                                padding: '0.625rem 1rem',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: e.type === 'income' ? T.green : T.red,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {e.type === 'income' ? '+' : '-'}
                              {e.amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              {e.currency}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── INFORME: Cuentas ── */}
      {reportType === 'accounts' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Total cuentas',
                value: `${accounts.length}`,
                color: T.accent,
                bg: T.accentLight,
                border: `${T.accent}33`,
                icon: '🏦',
              },
              {
                label: 'Patrimonio base',
                value: fmt(
                  accounts.reduce(
                    (s, a) =>
                      s +
                      convertAmount(
                        a.balance,
                        a.currency ?? baseCurrency,
                        displayCurrency,
                        rates
                      ),
                    0
                  ),
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.muted,
                bg: T.pageBg,
                border: T.cardBorder,
                icon: '💰',
              },
              {
                label: 'Patrimonio real',
                value: fmt(
                  accounts.reduce((s, a) => {
                    const rb = realBalanceMap[a.id]?.realBalance ?? a.balance;
                    return (
                      s +
                      convertAmount(
                        rb,
                        a.currency ?? baseCurrency,
                        displayCurrency,
                        rates
                      )
                    );
                  }, 0),
                  displayCurrency,
                  displayCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '✅',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Detalle por cuenta</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: T.tableHead,
                      borderBottom: `2px solid ${T.tableBorder}`,
                    }}
                  >
                    {[
                      'Cuenta',
                      'Divisa',
                      'Fecha saldo',
                      'Saldo base',
                      'Saldo real',
                      'Mínimo',
                      'Estado',
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: T.muted,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, i) => {
                    const rb = realBalanceMap[acc.id];
                    const belowMin =
                      acc.minBalance > 0 &&
                      (rb?.realBalance ?? acc.balance) < acc.minBalance;
                    return (
                      <tr
                        key={acc.id}
                        style={{
                          background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontWeight: 700,
                            color: T.title,
                          }}
                        >
                          {acc.name}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {acc.currency ?? baseCurrency}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {fmtDateDMY(acc.date, dateFormat)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {fmt(
                            acc.balance,
                            acc.currency ?? baseCurrency,
                            acc.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 800,
                            color: belowMin ? T.red : T.green,
                          }}
                        >
                          {fmt(
                            rb?.realBalance ?? acc.balance,
                            acc.currency ?? baseCurrency,
                            acc.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {acc.minBalance > 0
                            ? fmt(
                                acc.minBalance,
                                acc.currency ?? baseCurrency,
                                acc.currency ?? baseCurrency,
                                rates
                              )
                            : '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: belowMin ? T.redBg : T.greenBg,
                              color: belowMin ? T.red : T.green,
                              border: `1px solid ${
                                belowMin ? T.redBorder : T.greenBorder
                              }`,
                            }}
                          >
                            {belowMin ? '⚠️ Bajo mínimo' : '✅ OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INFORME: Proyecciones ── */}
      {reportType === 'projections' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              {
                label: 'Total proyecciones',
                value: `${projections.length}`,
                color: T.accent,
                bg: T.accentLight,
                border: `${T.accent}33`,
                icon: '📋',
              },
              {
                label: 'Ingresos mensuales',
                value: fmt(
                  projections
                    .filter((p) => p.type === 'income')
                    .reduce((s, p) => {
                      const f = FREQUENCIES.find(
                        (f) => f.value === p.frequency
                      );
                      return s + (f ? p.amount / f.months : 0);
                    }, 0),
                  baseCurrency,
                  baseCurrency,
                  rates
                ),
                color: T.green,
                bg: T.greenBg,
                border: T.greenBorder,
                icon: '📈',
              },
              {
                label: 'Gastos mensuales',
                value: fmt(
                  projections
                    .filter((p) => p.type === 'expense')
                    .reduce((s, p) => {
                      const f = FREQUENCIES.find(
                        (f) => f.value === p.frequency
                      );
                      return s + (f ? p.amount / f.months : 0);
                    }, 0),
                  baseCurrency,
                  baseCurrency,
                  rates
                ),
                color: T.red,
                bg: T.redBg,
                border: T.redBorder,
                icon: '📉',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Listado completo de proyecciones</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: T.tableHead,
                      borderBottom: `2px solid ${T.tableBorder}`,
                    }}
                  >
                    {[
                      'Concepto',
                      'Tipo',
                      'Categoría',
                      'Cuenta',
                      'Importe',
                      'Frecuencia',
                      'Equiv./mes',
                      'Inicio',
                      'Fin',
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: T.muted,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p, i) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const acc = accounts.find((a) => a.id === p.accountId);
                    const freq = FREQUENCIES.find(
                      (f) => f.value === p.frequency
                    );
                    const monthly = freq ? p.amount / freq.months : p.amount;
                    return (
                      <tr
                        key={p.id}
                        style={{
                          background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontWeight: 700,
                            color: T.title,
                          }}
                        >
                          {p.name}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background:
                                p.type === 'expense' ? T.redBg : T.greenBg,
                              color: p.type === 'expense' ? T.red : T.green,
                              border: `1px solid ${
                                p.type === 'expense'
                                  ? T.redBorder
                                  : T.greenBorder
                              }`,
                            }}
                          >
                            {p.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.body,
                          }}
                        >
                          {cat?.name ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.body,
                          }}
                        >
                          {acc?.name ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: p.type === 'income' ? T.green : T.red,
                          }}
                        >
                          {fmt(
                            p.amount,
                            acc?.currency ?? baseCurrency,
                            acc?.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {freq?.label ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {fmt(
                            monthly,
                            acc?.currency ?? baseCurrency,
                            acc?.currency ?? baseCurrency,
                            rates
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {fmtDateDMY(p.startDate, dateFormat)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {p.endDate
                            ? fmtDateDMY(p.endDate, dateFormat)
                            : 'Sin fin'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INFORME: Objetivos ── */}
      {reportType === 'goals' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {(() => {
              const total = goals.length;
              const completed = goals.filter((g) => {
                const saved =
                  g.mode === 'manual'
                    ? g.currentAmount
                    : realExpenses
                        .filter(
                          (e) =>
                            e.categoryId === g.categoryId &&
                            e.type === g.autoType &&
                            e.valueDate >= g.autoStartDate
                        )
                        .reduce(
                          (s, e) =>
                            s +
                            convertAmount(
                              e.amount,
                              e.currency,
                              g.currency,
                              rates
                            ),
                          0
                        );
                return saved >= g.targetAmount;
              }).length;
              const totalTarget = goals.reduce(
                (s, g) =>
                  s +
                  convertAmount(
                    g.targetAmount,
                    g.currency,
                    displayCurrency,
                    rates
                  ),
                0
              );
              return [
                {
                  label: 'Total objetivos',
                  value: `${total}`,
                  color: T.accent,
                  bg: T.accentLight,
                  border: `${T.accent}33`,
                  icon: '🎯',
                },
                {
                  label: 'Completados',
                  value: `${completed} / ${total}`,
                  color: T.green,
                  bg: T.greenBg,
                  border: T.greenBorder,
                  icon: '✅',
                },
                {
                  label: 'Total objetivo',
                  value: fmt(
                    totalTarget,
                    displayCurrency,
                    displayCurrency,
                    rates
                  ),
                  color: T.muted,
                  bg: T.pageBg,
                  border: T.cardBorder,
                  icon: '💰',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: item.color,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div
            style={{
              borderRadius: '1rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={sectionTitle}>Estado de cada objetivo</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: T.tableHead,
                      borderBottom: `2px solid ${T.tableBorder}`,
                    }}
                  >
                    {[
                      'Objetivo',
                      'Modo',
                      'Ahorrado',
                      'Meta',
                      '% Progreso',
                      'Fecha límite',
                      'Estado',
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: T.muted,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g, i) => {
                    const saved =
                      g.mode === 'manual'
                        ? g.currentAmount
                        : realExpenses
                            .filter(
                              (e) =>
                                e.categoryId === g.categoryId &&
                                e.type === g.autoType &&
                                e.valueDate >= g.autoStartDate
                            )
                            .reduce(
                              (s, e) =>
                                s +
                                convertAmount(
                                  e.amount,
                                  e.currency,
                                  g.currency,
                                  rates
                                ),
                              0
                            );
                    const pct =
                      g.targetAmount > 0
                        ? Math.min((saved / g.targetAmount) * 100, 100)
                        : 0;
                    const completed = saved >= g.targetAmount;
                    const overdue =
                      g.deadline &&
                      new Date(g.deadline) < new Date() &&
                      !completed;
                    return (
                      <tr
                        key={g.id}
                        style={{
                          background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                          borderBottom: `1px solid ${T.tableBorder}`,
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: T.title }}>
                            {g.emoji} {g.name}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {g.mode === 'manual' ? '✍️ Manual' : '⚡ Auto'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            fontWeight: 700,
                            color: T.green,
                          }}
                        >
                          {fmt(saved, g.currency, g.currency, rates)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                          }}
                        >
                          {fmt(g.targetAmount, g.currency, g.currency, rates)}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.5rem',
                            }}
                          >
                            <div
                              style={{
                                width: '4rem',
                                height: '0.375rem',
                                borderRadius: '9999px',
                                background: T.pageBg,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: '9999px',
                                  background: completed ? T.green : g.color,
                                  width: `${pct}%`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontWeight: 800,
                                color: completed ? T.green : T.title,
                                fontSize: '0.8rem',
                              }}
                            >
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                            color: T.muted,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {g.deadline
                            ? fmtDateDMY(g.deadline, dateFormat)
                            : '—'}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: completed
                                ? T.greenBg
                                : overdue
                                ? T.redBg
                                : T.amberBg,
                              color: completed
                                ? T.green
                                : overdue
                                ? T.red
                                : T.amber,
                              border: `1px solid ${
                                completed
                                  ? T.greenBorder
                                  : overdue
                                  ? T.redBorder
                                  : T.amberBorder
                              }`,
                            }}
                          >
                            {completed
                              ? '✅ Completado'
                              : overdue
                              ? '⏰ Vencido'
                              : '🔄 En progreso'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INFORME: Tendencias ── */}
      {reportType === 'trends' && (
        <>
          {(() => {
            const validExp = realExpenses.filter((e) => {
              const acc = accounts.find((a) => a.id === e.accountId);
              return acc && e.valueDate > acc.date;
            });
            const totalInc = validExp
              .filter((e) => e.type === 'income')
              .reduce(
                (s, e) =>
                  s +
                  convertAmount(e.amount, e.currency, displayCurrency, rates),
                0
              );
            const totalExp = validExp
              .filter((e) => e.type === 'expense')
              .reduce(
                (s, e) =>
                  s +
                  convertAmount(e.amount, e.currency, displayCurrency, rates),
                0
              );
            const net = totalInc - totalExp;
            const savRate = totalInc > 0 ? (net / totalInc) * 100 : 0;
            const months = Array.from(
              new Set(validExp.map((e) => e.valueDate.slice(0, 7)))
            ).sort();
            return (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(12rem, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {[
                    {
                      label: 'Ingresos totales',
                      value: fmt(
                        totalInc,
                        displayCurrency,
                        displayCurrency,
                        rates
                      ),
                      color: T.green,
                      bg: T.greenBg,
                      border: T.greenBorder,
                      icon: '📈',
                    },
                    {
                      label: 'Gastos totales',
                      value: fmt(
                        totalExp,
                        displayCurrency,
                        displayCurrency,
                        rates
                      ),
                      color: T.red,
                      bg: T.redBg,
                      border: T.redBorder,
                      icon: '📉',
                    },
                    {
                      label: 'Balance neto',
                      value:
                        (net >= 0 ? '+' : '') +
                        fmt(net, displayCurrency, displayCurrency, rates),
                      color: net >= 0 ? T.green : T.red,
                      bg: net >= 0 ? T.greenBg : T.redBg,
                      border: net >= 0 ? T.greenBorder : T.redBorder,
                      icon: net >= 0 ? '✅' : '⚠️',
                    },
                    {
                      label: 'Tasa ahorro media',
                      value: savRate.toFixed(1) + '%',
                      color:
                        savRate >= 20
                          ? T.green
                          : savRate >= 0
                          ? T.amber
                          : T.red,
                      bg:
                        savRate >= 20
                          ? T.greenBg
                          : savRate >= 0
                          ? T.amberBg
                          : T.redBg,
                      border:
                        savRate >= 20
                          ? T.greenBorder
                          : savRate >= 0
                          ? T.amberBorder
                          : T.redBorder,
                      icon: '🏦',
                    },
                    {
                      label: 'Meses con datos',
                      value: `${months.length}`,
                      color: T.accent,
                      bg: T.accentLight,
                      border: `${T.accent}33`,
                      icon: '📅',
                    },
                    {
                      label: 'Movimientos',
                      value: `${validExp.length}`,
                      color: T.muted,
                      bg: T.pageBg,
                      border: T.cardBorder,
                      icon: '🧾',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '1rem',
                        background: item.bg,
                        border: `1px solid ${item.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: item.color,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 800,
                          color: item.color,
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderRadius: '1rem',
                    background: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: `1px solid ${T.cardBorder}`,
                    }}
                  >
                    <div style={sectionTitle}>Resumen mensual histórico</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.85rem',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: T.tableHead,
                            borderBottom: `2px solid ${T.tableBorder}`,
                          }}
                        >
                          {[
                            'Mes',
                            'Ingresos',
                            'Gastos',
                            'Balance',
                            'Tasa ahorro',
                          ].map((h, i) => (
                            <th
                              key={h}
                              style={{
                                padding: '0.75rem 1rem',
                                textAlign: i === 0 ? 'left' : 'right',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase' as const,
                                color: T.muted,
                                whiteSpace: 'nowrap' as const,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {months.map((mk, i) => {
                          const mExp = validExp.filter(
                            (e) => e.valueDate.slice(0, 7) === mk
                          );
                          const mInc = mExp
                            .filter((e) => e.type === 'income')
                            .reduce(
                              (s, e) =>
                                s +
                                convertAmount(
                                  e.amount,
                                  e.currency,
                                  displayCurrency,
                                  rates
                                ),
                              0
                            );
                          const mGas = mExp
                            .filter((e) => e.type === 'expense')
                            .reduce(
                              (s, e) =>
                                s +
                                convertAmount(
                                  e.amount,
                                  e.currency,
                                  displayCurrency,
                                  rates
                                ),
                              0
                            );
                          const mNet = mInc - mGas;
                          const mRate = mInc > 0 ? (mNet / mInc) * 100 : 0;
                          const [y, m] = mk.split('-').map(Number);
                          const label = new Date(y, m - 1, 1).toLocaleString(
                            'es-ES',
                            { month: 'long', year: 'numeric' }
                          );
                          return (
                            <tr
                              key={mk}
                              style={{
                                background:
                                  i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                                borderBottom: `1px solid ${T.tableBorder}`,
                              }}
                            >
                              <td
                                style={{
                                  padding: '0.75rem 1rem',
                                  fontWeight: 700,
                                  color: T.title,
                                  textTransform: 'capitalize' as const,
                                }}
                              >
                                {label}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem 1rem',
                                  textAlign: 'right',
                                  fontWeight: 700,
                                  color: T.green,
                                }}
                              >
                                {fmt(
                                  mInc,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem 1rem',
                                  textAlign: 'right',
                                  fontWeight: 700,
                                  color: T.red,
                                }}
                              >
                                {fmt(
                                  mGas,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem 1rem',
                                  textAlign: 'right',
                                  fontWeight: 800,
                                  color: mNet >= 0 ? T.green : T.red,
                                }}
                              >
                                {mNet >= 0 ? '+' : ''}
                                {fmt(
                                  mNet,
                                  displayCurrency,
                                  displayCurrency,
                                  rates
                                )}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem 1rem',
                                  textAlign: 'right',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 800,
                                    color:
                                      mRate >= 20
                                        ? T.green
                                        : mRate >= 0
                                        ? T.amber
                                        : T.red,
                                  }}
                                >
                                  {mRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ── Footer del informe ── */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: T.muted,
          paddingTop: '1rem',
          borderTop: `1px solid ${T.cardBorder}`,
        }}
      >
        Informe generado con FinanzasHogar ·{' '}
        {new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
function CalendarView() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    accounts,
    categories,
    projections,
    realExpenses,
    goals,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarView, setCalendarView] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Date(year, month).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── Proyecciones para un día ───────────────────────────────────────────────
  const getProjectionsForDay = (day) => {
    return projections.filter((p) => {
      const start = new Date(p.startDate + 'T00:00:00');
      const end = p.endDate ? new Date(p.endDate + 'T23:59:59') : null;
      const payDay = start.getDate();
      if (payDay !== day) return false;
      if (start > new Date(year, month + 1, 0)) return false;
      if (end && end < new Date(year, month, day)) return false;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diffMonths =
        (year - start.getFullYear()) * 12 + (month - start.getMonth());
      if (diffMonths < 0) return false;
      if (diffMonths % freq.months !== 0) return false;
      return true;
    });
  };

  // ── Gastos reales válidos para un día (por valueDate) ─────────────────────
  // Solo los posteriores al saldo base de su cuenta (misma lógica que calcRealBalance)
  const getRealsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    return realExpenses.filter((e) => {
      if (e.valueDate !== dateStr) return false;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      // Solo si es posterior al saldo base
      if (e.valueDate <= acc.date) return false;
      return true;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const todayDate = new Date();
  const isToday = (day) =>
    day === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  // ── Datos del día seleccionado ─────────────────────────────────────────────
  const selectedProjections =
    selectedDay !== null ? getProjectionsForDay(selectedDay) : [];
  const selectedReals = selectedDay !== null ? getRealsForDay(selectedDay) : [];

  const totalIncomeProj = selectedProjections
    .filter((p) => p.type === 'income')
    .reduce((s, p) => s + p.amount, 0);
  const totalExpenseProj = selectedProjections
    .filter((p) => p.type === 'expense')
    .reduce((s, p) => s + p.amount, 0);

  const totalIncomeReal = selectedReals
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );
  const totalExpenseReal = selectedReals
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  // ── Totales del mes — proyectados ──────────────────────────────────────────
  const allDayProjections = Array.from({ length: daysInMonth }, (_, i) =>
    getProjectionsForDay(i + 1)
  ).flat();

  const monthIncomeProj = allDayProjections
    .filter((p) => p.type === 'income')
    .reduce((s, p) => s + p.amount, 0);
  const monthExpenseProj = allDayProjections
    .filter((p) => p.type === 'expense')
    .reduce((s, p) => s + p.amount, 0);

  // ── Totales del mes — reales válidos ───────────────────────────────────────
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthReals = realExpenses.filter((e) => {
    if (e.valueDate.slice(0, 7) !== currentMonthStr) return false;
    const acc = accounts.find((a) => a.id === e.accountId);
    if (!acc) return false;
    return e.valueDate > acc.date;
  });

  const monthIncomeReal = monthReals
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );
  const monthExpenseReal = monthReals
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  // ── Datos para la vista anual ──────────────────────────────────────────────
  const annualYear = currentDate.getFullYear();

  const annualData = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthDate = new Date(annualYear, monthIdx, 1);
      const mk = monthKey(monthDate);

      // ── Balance neto proyectado del mes ──
      const monthForecast = calcForecast(
        projections,
        accounts,
        'all',
        rates,
        baseCurrency,
        realExpenses
      ).find((m) => m.key === mk);

      const netBalance = monthForecast?.net ?? 0;

      // ── Movimientos reales válidos del mes ──
      const monthReals = realExpenses.filter((e) => {
        if (e.valueDate.slice(0, 7) !== mk) return false;
        const acc = accounts.find((a) => a.id === e.accountId);
        if (!acc) return false;
        return e.valueDate > acc.date;
      });

      const hasRealMovements = monthReals.length > 0;
      const realIncome = monthReals
        .filter((e) => e.type === 'income')
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const realExpense = monthReals
        .filter((e) => e.type === 'expense')
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );

      // ── Objetivos que vencen este mes ──
      const expiringGoals = goals.filter((g) => {
        if (!g.deadline) return false;
        return g.deadline.slice(0, 7) === mk;
      });

      // ── Alertas activas que afectan a este mes ──
      // Simplificado: marcamos los meses futuros con balance negativo proyectado
      const hasAlert = netBalance < 0;

      // ── Color del indicador ──
      const isPast = mk < monthKey(new Date());
      const isCurrent = mk === monthKey(new Date());

      let indicatorColor: string;
      if (isPast || isCurrent) {
        // Para meses pasados y actual usamos el balance real
        const realNet = realIncome - realExpense;
        if (!hasRealMovements) {
          indicatorColor = T.cardBorder;
        } else if (realNet > 0) {
          indicatorColor = T.green;
        } else if (realNet < -50) {
          indicatorColor = T.red;
        } else {
          indicatorColor = T.amber;
        }
      } else {
        // Meses futuros: balance proyectado
        if (netBalance > 0) {
          indicatorColor = T.green;
        } else if (netBalance < -50) {
          indicatorColor = T.red;
        } else {
          indicatorColor = T.amber;
        }
      }

      return {
        monthIdx,
        monthDate,
        mk,
        label: monthDate.toLocaleDateString('es-ES', { month: 'long' }),
        netBalance,
        realIncome,
        realExpense,
        realNet: realIncome - realExpense,
        hasRealMovements,
        expiringGoals,
        hasAlert,
        indicatorColor,
        isPast,
        isCurrent,
      };
    });
  }, [
    annualYear,
    accounts,
    projections,
    realExpenses,
    goals,
    rates,
    baseCurrency,
  ]);

  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const selectedMonthName = new Date(year, month).toLocaleString('es-ES', {
    month: 'long',
  });

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Vista mensual
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Calendario
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Proyecciones y movimientos reales por día
          </p>
        </div>

        {/* Toggle vista mensual / anual */}
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <PrintButton T={T} />
          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              padding: '0.25rem',
              borderRadius: '0.75rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            {(
              [
                ['monthly', '📅 Mensual'],
                ['annual', '📆 Anual'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: calendarView === v ? T.accent : 'transparent',
                  color: calendarView === v ? '#ffffff' : T.muted,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={prevMonth}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
              color: T.body,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            ‹
          </button>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: T.title,
              textTransform: 'capitalize',
              minWidth: '12rem',
              textAlign: 'center',
            }}
          >
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
              color: T.body,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {calendarView === 'annual' && (
        <AnnualCalendarView
          annualData={annualData}
          annualYear={annualYear}
          T={T}
          onSelectMonth={(monthIdx) => {
            setCurrentDate(new Date(annualYear, monthIdx, 1));
            setCalendarView('monthly');
            setSelectedDay(null);
          }}
          onChangeYear={(delta) => {
            setCurrentDate(new Date(annualYear + delta, 0, 1));
          }}
          baseCurrency={baseCurrency}
          rates={rates}
        />
      )}
      {calendarView === 'monthly' && (
        <>
          {/* ── Resumen del mes — proyectado vs real ── */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            {/* Ingresos */}
            <div
              style={{
                borderRadius: '1rem',
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: T.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Ingresos del mes
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderTop: `1px solid ${T.greenBorder}`,
                }}
              >
                <div
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRight: `1px solid ${T.greenBorder}`,
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.green,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Proyectado
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.green,
                    }}
                  >
                    {fmt(monthIncomeProj, displayCurrency, baseCurrency, rates)}
                  </div>
                </div>
                <div style={{ padding: '0.625rem 1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.green,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Real
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.green,
                    }}
                  >
                    {fmt(
                      monthIncomeReal,
                      displayCurrency,
                      displayCurrency,
                      rates
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gastos */}
            <div
              style={{
                borderRadius: '1rem',
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: T.red,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Gastos del mes
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderTop: `1px solid ${T.redBorder}`,
                }}
              >
                <div
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRight: `1px solid ${T.redBorder}`,
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.red,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Proyectado
                  </div>
                  <div
                    style={{ fontSize: '1rem', fontWeight: 800, color: T.red }}
                  >
                    {fmt(
                      monthExpenseProj,
                      displayCurrency,
                      baseCurrency,
                      rates
                    )}
                  </div>
                </div>
                <div style={{ padding: '0.625rem 1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.red,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Real
                  </div>
                  <div
                    style={{ fontSize: '1rem', fontWeight: 800, color: T.red }}
                  >
                    {fmt(
                      monthExpenseReal,
                      displayCurrency,
                      displayCurrency,
                      rates
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance neto */}
            {(() => {
              const netProj = monthIncomeProj - monthExpenseProj;
              const netReal = monthIncomeReal - monthExpenseReal;
              const color = netReal >= 0 ? T.green : T.red;
              const bg = netReal >= 0 ? T.greenBg : T.redBg;
              const border = netReal >= 0 ? T.greenBorder : T.redBorder;
              return (
                <div
                  style={{
                    borderRadius: '1rem',
                    background: bg,
                    border: `1px solid ${border}`,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.06em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Balance neto
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      borderTop: `1px solid ${border}`,
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRight: `1px solid ${border}`,
                        opacity: 0.7,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color,
                          textTransform: 'uppercase' as const,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Proyectado
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color }}>
                        {netProj >= 0 ? '+' : ''}
                        {fmt(netProj, displayCurrency, baseCurrency, rates)}
                      </div>
                    </div>
                    <div style={{ padding: '0.625rem 1.25rem' }}>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color,
                          textTransform: 'uppercase' as const,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Real
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color }}>
                        {netReal >= 0 ? '+' : ''}
                        {fmt(netReal, displayCurrency, displayCurrency, rates)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Calendario + Panel lateral ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 22rem',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Calendario */}
            <Card T={T}>
              <div style={{ padding: '1.25rem' }}>
                {/* Días de la semana */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.25rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.25rem',
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Celdas */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.25rem',
                  }}
                >
                  {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const dayProjs = getProjectionsForDay(day);
                      const dayReals = getRealsForDay(day);
                      const hasIncomeProj = dayProjs.some(
                        (p) => p.type === 'income'
                      );
                      const hasExpenseProj = dayProjs.some(
                        (p) => p.type === 'expense'
                      );
                      const hasIncomeReal = dayReals.some(
                        (e) => e.type === 'income'
                      );
                      const hasExpenseReal = dayReals.some(
                        (e) => e.type === 'expense'
                      );
                      const isSelected = selectedDay === day;
                      const isTodayDay = isToday(day);
                      const hasAnything =
                        dayProjs.length > 0 || dayReals.length > 0;

                      return (
                        <div
                          key={day}
                          onClick={() =>
                            hasAnything &&
                            setSelectedDay(isSelected ? null : day)
                          }
                          style={{
                            borderRadius: '0.625rem',
                            padding: '0.4rem 0.25rem',
                            minHeight: '4rem',
                            cursor: hasAnything ? 'pointer' : 'default',
                            background: isSelected
                              ? T.accentLight
                              : isTodayDay
                              ? T.accentLight
                              : T.pageBg,
                            border: isSelected
                              ? `2px solid ${T.accent}`
                              : isTodayDay
                              ? `2px solid ${T.accent}44`
                              : `1px solid ${T.cardBorder}`,
                            transition: 'all 0.15s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          {/* Número del día */}
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: isTodayDay ? 800 : 600,
                              color:
                                isSelected || isTodayDay ? T.accent : T.title,
                            }}
                          >
                            {day}
                          </span>

                          {/* Indicadores — reales (sólidos) y proyecciones (huecos) */}
                          {hasAnything && (
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.15rem',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                              }}
                            >
                              {/* Real ingreso — círculo sólido verde */}
                              {hasIncomeReal && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: T.green,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Ingreso real"
                                />
                              )}
                              {/* Real gasto — círculo sólido rojo */}
                              {hasExpenseReal && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: T.red,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Gasto real"
                                />
                              )}
                              {/* Proyección ingreso — círculo hueco verde */}
                              {hasIncomeProj && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: `1.5px solid ${T.green}`,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Proyección ingreso"
                                />
                              )}
                              {/* Proyección gasto — círculo hueco rojo */}
                              {hasExpenseProj && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: `1.5px solid ${T.red}`,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Proyección gasto"
                                />
                              )}
                            </div>
                          )}

                          {/* Importes en miniatura */}
                          {hasAnything && (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.1rem',
                                width: '100%',
                              }}
                            >
                              {hasIncomeReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textAlign: 'center',
                                    background: T.greenBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                  }}
                                >
                                  +
                                  {fmt(
                                    dayReals
                                      .filter((e) => e.type === 'income')
                                      .reduce(
                                        (s, e) =>
                                          s +
                                          convertAmount(
                                            e.amount,
                                            e.currency,
                                            displayCurrency,
                                            rates
                                          ),
                                        0
                                      ),
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasExpenseReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textAlign: 'center',
                                    background: T.redBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                  }}
                                >
                                  -
                                  {fmt(
                                    dayReals
                                      .filter((e) => e.type === 'expense')
                                      .reduce(
                                        (s, e) =>
                                          s +
                                          convertAmount(
                                            e.amount,
                                            e.currency,
                                            displayCurrency,
                                            rates
                                          ),
                                        0
                                      ),
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasIncomeProj && !hasIncomeReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 600,
                                    color: T.green,
                                    textAlign: 'center',
                                    background: T.greenBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                    opacity: 0.6,
                                  }}
                                >
                                  +
                                  {fmt(
                                    dayProjs
                                      .filter((p) => p.type === 'income')
                                      .reduce((s, p) => s + p.amount, 0),
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasExpenseProj && !hasExpenseReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 600,
                                    color: T.red,
                                    textAlign: 'center',
                                    background: T.redBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                    opacity: 0.6,
                                  }}
                                >
                                  -
                                  {fmt(
                                    dayProjs
                                      .filter((p) => p.type === 'expense')
                                      .reduce((s, p) => s + p.amount, 0),
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Leyenda */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${T.cardBorder}`,
                    fontSize: '0.72rem',
                    color: T.muted,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '50%',
                        background: T.green,
                        display: 'inline-block',
                      }}
                    />
                    Ingreso real
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '50%',
                        background: T.red,
                        display: 'inline-block',
                      }}
                    />
                    Gasto real
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '50%',
                        background: 'transparent',
                        border: `1.5px solid ${T.green}`,
                        display: 'inline-block',
                      }}
                    />
                    Proyección ingreso
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '50%',
                        background: 'transparent',
                        border: `1.5px solid ${T.red}`,
                        display: 'inline-block',
                      }}
                    />
                    Proyección gasto
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '0.2rem',
                        background: T.accentLight,
                        border: `1px solid ${T.accent}`,
                        display: 'inline-block',
                      }}
                    />
                    Hoy / Seleccionado
                  </span>
                </div>
              </div>
            </Card>

            {/* ── Panel lateral ── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {selectedDay !== null ? (
                <>
                  {/* Cabecera día seleccionado */}
                  <div
                    style={{
                      padding: '0.875rem 1.125rem',
                      borderRadius: '0.875rem',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}33`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Día seleccionado
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: T.accent,
                        letterSpacing: '-0.03em',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedDay} de {selectedMonthName}
                    </div>
                  </div>

                  {/* ── Sección: Movimientos reales ── */}
                  {selectedReals.length > 0 && (
                    <Card T={T}>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: T.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.625rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              background: T.accent,
                              display: 'inline-block',
                            }}
                          />
                          Movimientos reales
                        </div>

                        {/* Mini totales reales */}
                        {(totalIncomeReal > 0 || totalExpenseReal > 0) && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {totalIncomeReal > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.greenBg,
                                  border: `1px solid ${T.greenBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Ingresos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.green,
                                  }}
                                >
                                  {fmt(
                                    totalIncomeReal,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                            {totalExpenseReal > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.redBg,
                                  border: `1px solid ${T.redBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Gastos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.red,
                                  }}
                                >
                                  {fmt(
                                    totalExpenseReal,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lista de reales */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                          }}
                        >
                          {selectedReals.map((e) => {
                            const cat = categories.find(
                              (c) => c.id === e.categoryId
                            );
                            const acc = accounts.find(
                              (a) => a.id === e.accountId
                            );
                            const amountConverted = convertAmount(
                              e.amount,
                              e.currency,
                              displayCurrency,
                              rates
                            );
                            return (
                              <div
                                key={e.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.625rem',
                                  padding: '0.625rem 0.75rem',
                                  borderRadius: '0.625rem',
                                  background: T.pageBg,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    width: '0.2rem',
                                    alignSelf: 'stretch',
                                    borderRadius: '9999px',
                                    background: cat?.color || T.cardBorder,
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: T.title,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {e.description}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      color: T.muted,
                                    }}
                                  >
                                    {cat?.name ?? '—'} · {acc?.name ?? '—'}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color:
                                      e.type === 'income' ? T.green : T.red,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {e.type === 'income' ? '+' : '-'}
                                  {fmt(
                                    amountConverted,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ── Sección: Proyecciones ── */}
                  {selectedProjections.length > 0 && (
                    <Card T={T}>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: T.muted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.625rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              background: 'transparent',
                              border: `1.5px solid ${T.muted}`,
                              display: 'inline-block',
                            }}
                          />
                          Proyecciones
                        </div>

                        {/* Mini totales proyectados */}
                        {(totalIncomeProj > 0 || totalExpenseProj > 0) && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {totalIncomeProj > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.greenBg,
                                  border: `1px solid ${T.greenBorder}`,
                                  opacity: 0.7,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Ingresos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.green,
                                  }}
                                >
                                  {fmt(
                                    totalIncomeProj,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                            {totalExpenseProj > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.redBg,
                                  border: `1px solid ${T.redBorder}`,
                                  opacity: 0.7,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Gastos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.red,
                                  }}
                                >
                                  {fmt(
                                    totalExpenseProj,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lista de proyecciones */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                          }}
                        >
                          {selectedProjections.map((p) => {
                            const cat = categories.find(
                              (c) => c.id === p.categoryId
                            );
                            const acc = accounts.find(
                              (a) => a.id === p.accountId
                            );
                            return (
                              <div
                                key={p.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.625rem',
                                  padding: '0.625rem 0.75rem',
                                  borderRadius: '0.625rem',
                                  background: T.pageBg,
                                  border: `1px solid ${T.cardBorder}`,
                                  opacity: 0.85,
                                }}
                              >
                                <div
                                  style={{
                                    width: '0.2rem',
                                    alignSelf: 'stretch',
                                    borderRadius: '9999px',
                                    background: cat?.color || T.cardBorder,
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: T.title,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      color: T.muted,
                                    }}
                                  >
                                    {cat?.name ?? '—'} · {acc?.name ?? '—'}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color:
                                      p.type === 'income' ? T.green : T.red,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {p.type === 'income' ? '+' : '-'}
                                  {fmt(
                                    p.amount,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Sin nada en este día */}
                  {selectedReals.length === 0 &&
                    selectedProjections.length === 0 && (
                      <Card T={T}>
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: T.muted,
                            fontSize: '0.875rem',
                          }}
                        >
                          No hay movimientos para este día
                        </div>
                      </Card>
                    )}
                </>
              ) : (
                <Card T={T}>
                  <div
                    style={{
                      padding: '2rem 1.25rem',
                      textAlign: 'center',
                      color: T.muted,
                    }}
                  >
                    <CalendarRange
                      size={36}
                      color={T.muted}
                      style={{ margin: '0 auto 0.75rem', opacity: 0.3 }}
                    />
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: T.title,
                        marginBottom: '0.25rem',
                      }}
                    >
                      Selecciona un día
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      Haz clic en cualquier día para ver sus movimientos reales
                      y proyecciones
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
