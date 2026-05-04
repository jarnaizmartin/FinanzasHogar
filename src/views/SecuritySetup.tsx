import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useSecurityContext } from '../SecurityContext';
import {
  generateRecoveryPhrase,
  normalizePhrase,
  verifyTOTP,
} from '../lib/crypto';
import CryptoJS from 'crypto-js';

// Importamos las constantes que necesitamos
import {
  TOTP_GRACE_DEFAULT_MS,
  TOTP_GRACE_OPTIONS,
  saveTotpLastUnlock,
} from '../securityUtils';

import type { AuthMethod } from '../types';

export function SecuritySetup({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { setupSecurity, sendCode, verifyCode, generateRecoveryFile } =
    useSecurityContext();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;

  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phrase] = useState(() => generateRecoveryPhrase());
  const [phraseConfirm, setPhraseConfirm] = useState('');
  const [phraseCopied, setPhraseCopied] = useState(false);

  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  const [fileDownloaded, setFileDownloaded] = useState(false);
  const [pendingPhraseHash, setPendingPhraseHash] = useState<string | null>(
    null
  );
  const [pendingPhraseSalt, setPendingPhraseSalt] = useState<string | null>(
    null
  );

  const [totpSecret] = useState<string>(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => chars[b % 32])
      .join('');
  });

  const [totpCode, setTotpCode] = useState('');
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpCopied, setTotpCopied] = useState(false);
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpGraceMs, setTotpGraceMs] = useState(TOTP_GRACE_DEFAULT_MS);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  // ── Estilos ──────────────────────────────────────────────────────────────
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

  // ── Validaciones ──────────────────────────────────────────────────────────
  const canContinueStep2 = () => {
    if (authMethod === 'password') {
      if (password.length < 8) return false;
      if (password !== password2) return false;
    }
    if (authMethod === 'totp') {
      if (!totpVerified) return false;
    }
    return true;
  };

  const canContinueStep4 = () => {
    const typed = normalizePhrase(phraseConfirm);
    const original = normalizePhrase(phrase);
    return typed === original;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      setTotpError('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setTotpVerifying(false);
    }
  };

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
      totpSecret: authMethod === 'totp' ? totpSecret : undefined,
      totpGraceMs: authMethod === 'totp' ? totpGraceMs : undefined,
      phrase,
      email: emailVerified ? email : undefined,
      forcePhraseHash: pendingPhraseHash ?? undefined,
      forcePhraseSalt: pendingPhraseSalt ?? undefined,
    });
    if (authMethod === 'totp') {
      saveTotpLastUnlock();
    }
    onComplete();
  };

  // ── Steps ─────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔐</div>
      <h2 style={titleStyle}>Configura la seguridad</h2>
      <p style={subtitleStyle}>
        Elige cómo quieres proteger el acceso a tu app. Podrás cambiarlo
        después.
      </p>

      {[
        {
          method: 'password' as AuthMethod,
          emoji: '🔑',
          title: 'Contraseña clásica',
          desc: 'Crea una contraseña segura para proteger tu app',
        },
        {
          method: 'totp' as AuthMethod,
          emoji: '📱',
          title: 'Verificación en dos pasos',
          desc: 'Usa Google Authenticator, Authy u otra app similar. Más seguro que una contraseña.',
        },
      ].map(({ method, emoji, title, desc }) => (
        <div
          key={method}
          onClick={() => setAuthMethod(method)}
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            border: `2px solid ${
              authMethod === method ? '#2563eb' : '#e2e8f0'
            }`,
            background: authMethod === method ? '#eff6ff' : '#f8fafc',
            cursor: 'pointer',
            marginBottom: '0.75rem',
            transition: 'all 0.15s',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: '0.95rem',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: '0.775rem',
                  color: '#64748b',
                  marginTop: '0.2rem',
                }}
              >
                {desc}
              </div>
            </div>
            {authMethod === method && (
              <Check
                size={18}
                color="#2563eb"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              />
            )}
          </div>
        </div>
      ))}

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
        </p>

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

  const renderStep3 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
      <h2 style={titleStyle}>Tu frase de recuperación</h2>
      <p style={subtitleStyle}>
        Estas 12 palabras son la <strong>única forma</strong> de recuperar tu
        cuenta si olvidas tu contraseña. Guárdalas en un lugar seguro.
      </p>

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
            style={{ ...inputStyle, opacity: emailSent ? 0.6 : 1 }}
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
            style={{ height: '1px', background: '#e2e8f0', margin: '1rem 0' }}
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

  const renderStep6 = () => (
    <div style={bodyStyle}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</div>
      <h2 style={titleStyle}>¡Todo listo!</h2>
      <p style={subtitleStyle}>
        Un último paso: descarga tu fichero de recuperación como copia de
        seguridad adicional.
      </p>

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
            textTransform: 'uppercase' as const,
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

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
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
              textTransform: 'uppercase' as const,
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
