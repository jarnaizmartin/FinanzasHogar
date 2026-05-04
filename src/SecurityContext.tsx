import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
  createContext,
} from 'react';
import type React from 'react';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  hashPhrase,
  verifyPhrase,
  verifyTOTP,
  sendEmailCode,
  verifyEmailCode,
} from './lib/crypto';
import {
  TOTP_GRACE_DEFAULT_MS,
  INACTIVITY_DEFAULT_MS,
  saveTotpLastUnlock,
  isWithinTotpGrace,
} from './securityUtils';
import type { AuthMethod } from './types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SECURITY_STORAGE_KEY = 'fh_security';
const LOCK_STATE_KEY = 'fh_lock_state';

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

// 🔴 FIX 1 — unlock ahora devuelve Promise<boolean> (necesario para TOTP async)
export type SecurityContextType = {
  security: SecurityState;
  isLocked: boolean;
  isConfigured: boolean;
  setupSecurity: (params: {
    authMethod: AuthMethod;
    password?: string;
    totpSecret?: string;
    totpGraceMs?: number;
    phrase: string;
    email?: string;
    forcePhraseHash?: string;
    forcePhraseSalt?: string;
  }) => void;
  unlock: (input: string) => Promise<boolean>;
  lock: () => void;
  sendCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (code: string) => { ok: boolean; error?: string };
  recoverWithPhrase: (phrase: string, newPassword: string) => boolean;
  validateRecoveryFile: (
    fileContent: string
  ) => { ok: boolean; error?: string };
  recoverWithFile: (fileContent: string, newPassword: string) => boolean;
  updateInactivity: (ms: number) => void;
  updateTotpGrace: (ms: number) => void;
  updateEmail: (email: string) => void;
  clearSecurity: () => void;
  generateRecoveryFile: (password: string) => string;
};

// ─── Estado por defecto ───────────────────────────────────────────────────────
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

// ─── Helpers de persistencia ──────────────────────────────────────────────────
function loadSecurityState(): SecurityState {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) return DEFAULT_SECURITY_STATE;
    return { ...DEFAULT_SECURITY_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SECURITY_STATE;
  }
}

function saveSecurityState(state: SecurityState): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn(
      '[Security] No se pudo guardar la configuración de seguridad.'
    );
  }
}

function saveLockState(state: LockState): void {
  try {
    localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(state));
  } catch {
    console.warn('[Security] No se pudo guardar el estado de bloqueo.');
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const SecurityContext = createContext<SecurityContextType | null>(null);

export function useSecurityContext(): SecurityContextType {
  const ctx = useContext(SecurityContext);
  if (!ctx)
    throw new Error(
      'useSecurityContext debe usarse dentro de <SecurityProvider>'
    );
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [security, setSecurity] = useState<SecurityState>(() =>
    loadSecurityState()
  );
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = loadSecurityState();
    if (!s.configured) return false;
    if (
      s.authMethod === 'totp' &&
      isWithinTotpGrace(s.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS)
    ) {
      return false;
    }
    return true;
  });

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

  // ── setupSecurity ─────────────────────────────────────────────────────────
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

  // 🔴 FIX 1 — unlock ahora es async y verifica TOTP correctamente
  const unlock = useCallback(
    async (input: string): Promise<boolean> => {
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
        if (!security.totpSecret) return false;
        const ok = await verifyTOTP(security.totpSecret, input);
        if (ok) {
          setIsLocked(false);
          saveLockState({ locked: false, lockedAt: null });
          saveTotpLastUnlock();
        }
        return ok;
      }

      return false;
    },
    [security]
  );

  // ── lock ──────────────────────────────────────────────────────────────────
  const lock = useCallback(() => {
    setIsLocked(true);
    saveLockState({ locked: true, lockedAt: Date.now() });
  }, []);

  // ── Email ─────────────────────────────────────────────────────────────────
  const sendCode = useCallback(
    async (email: string) => sendEmailCode(email),
    []
  );
  const verifyCode = useCallback((code: string) => verifyEmailCode(code), []);

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

  // ── Validación fichero de recuperación ───────────────────────────────────
  const validateRecoveryFile = useCallback(
    (fileContent: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(fileContent);
        if (parsed.type !== 'fh-recovery')
          return {
            ok: false,
            error: 'El fichero no es un fichero de recuperación válido.',
          };
        if (!parsed.phraseHash || !parsed.phraseSalt)
          return {
            ok: false,
            error:
              'El fichero no contiene los datos necesarios para la recuperación.',
          };
        if (
          parsed.phraseHash !== security.phraseHash ||
          parsed.phraseSalt !== security.phraseSalt
        )
          return {
            ok: false,
            error:
              'Este fichero no corresponde a la configuración de seguridad actual. Usa el fichero más reciente.',
          };
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

  // ── Ajustes ───────────────────────────────────────────────────────────────
  const updateInactivity = useCallback((ms: number) => {
    setSecurity((prev) => ({ ...prev, inactivityMs: ms }));
  }, []);

  const updateTotpGrace = useCallback((ms: number) => {
    setSecurity((prev) => ({ ...prev, totpGraceMs: ms }));
  }, []);

  const updateEmail = useCallback((email: string) => {
    setSecurity((prev) => ({ ...prev, email, emailVerified: true }));
  }, []);

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
