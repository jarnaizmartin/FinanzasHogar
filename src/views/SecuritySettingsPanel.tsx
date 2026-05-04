import { useState, useEffect } from 'react';
import { useSecurityContext } from '../SecurityContext';
import { useApp } from '../AppContext';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/UI';
import { Check } from 'lucide-react';
import { verifyTOTP } from '../lib/crypto';
import {
  TOTP_GRACE_OPTIONS,
  TOTP_GRACE_DEFAULT_MS,
  INACTIVITY_OPTIONS,
  saveTotpLastUnlock,
} from '../securityUtils';
import type { AuthMethod } from '../types';

export function SecuritySettingsPanel({ onClose }: { onClose: () => void }) {
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
  const [totpGraceMs, setTotpGraceMs] = useState(security.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS);

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

  const [verifyInput, setVerifyInput] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [newAuthMethod, setNewAuthMethod] = useState<AuthMethod>('password');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);

  const [newTotpSecret] = useState<string>(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => chars[b % 32]).join('');
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
        if (changeStep) { setChangeStep(null); resetChangeState(); }
        else onClose();
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveInactivity = () => {
    updateInactivity(inactivityMs);
    toast('Tiempo de inactividad actualizado', 'success');
  };

  const handleSaveGrace = () => {
    updateTotpGrace(totpGraceMs);
    toast('Frecuencia de verificación actualizada', 'success');
  };

  const handleSendEmailCode = async () => {
    if (!emailInput.trim()) { setEmailError('Introduce un email válido.'); return; }
    setEmailLoading(true);
    setEmailError(null);
    const result = await sendCode(emailInput.trim());
    setEmailLoading(false);
    if (result.ok) { setEmailStep('verifying'); setResendWait(60); }
    else setEmailError(result.error ?? 'Error al enviar el código.');
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

  const handleVerifyCurrent = async () => {
    if (!verifyInput.trim()) { setVerifyError('Introduce el código o contraseña actual.'); return; }
    if (security.authMethod === 'password') {
      const ok = await unlock(verifyInput.trim());
      if (ok) { setChangeStep('choose'); setVerifyError(null); }
      else setVerifyError('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }
    if (security.authMethod === 'totp') {
      setVerifyLoading(true);
      try {
        const ok = await verifyTOTP(security.totpSecret ?? '', verifyInput.trim());
        if (ok) { setChangeStep('choose'); setVerifyError(null); }
        else setVerifyError('Código de verificación incorrecto.');
      } catch {
        setVerifyError('Error al verificar el código.');
      } finally {
        setVerifyLoading(false);
      }
    }
  };

  const handleVerifyNewTotp = async () => {
    if (newTotpVerifying) return;
    setNewTotpVerifying(true);
    setNewTotpError(null);
    try {
      const ok = await verifyTOTP(newTotpSecret, newTotpCode);
      if (ok) setNewTotpVerified(true);
      else setNewTotpError('Código incorrecto. Comprueba que la hora del dispositivo es correcta.');
    } catch {
      setNewTotpError('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setNewTotpVerifying(false);
    }
  };

  const handleSaveMethodChange = () => {
    if (newAuthMethod === 'password') {
      if (newPassword.length < 8) { setNewPasswordError('La contraseña debe tener al menos 8 caracteres.'); return; }
      if (newPassword !== newPassword2) { setNewPasswordError('Las contraseñas no coinciden.'); return; }
    }
    setupSecurity({
      authMethod: newAuthMethod,
      password: newAuthMethod === 'password' ? newPassword : undefined,
      totpSecret: newAuthMethod === 'totp' ? newTotpSecret : undefined,
      totpGraceMs: newAuthMethod === 'totp' ? newTotpGraceMs : undefined,
      phrase: '',
      email: security.email ?? undefined,
      forcePhraseHash: security.phraseHash ?? undefined,
      forcePhraseSalt: security.phraseSalt ?? undefined,
    });
    if (newAuthMethod === 'totp') saveTotpLastUnlock();
    toast(`Método de acceso cambiado a ${newAuthMethod === 'password' ? 'contraseña' : 'verificación en dos pasos'} correctamente`, 'success');
    setChangeStep(null);
    resetChangeState();
  };

  // ── Panel de cambio de método ─────────────────────────────────────────────
  if (changeStep) {
    return (
      <Modal
        title="🔄 Cambiar método de acceso"
        subtitle={
          changeStep === 'verify' ? 'Verifica tu identidad antes de continuar'
          : changeStep === 'choose' ? 'Elige el nuevo método de autenticación'
          : changeStep === 'new-password' ? 'Configura tu nueva contraseña'
          : 'Configura tu nueva app autenticadora'
        }
        onClose={() => { setChangeStep(null); resetChangeState(); }}
        T={T}
      >
        {/* PASO 1: Verificar método actual */}
        {changeStep === 'verify' && (
          <div>
            <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: T.accentLight, border: `1px solid ${T.accent}33`, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{security.authMethod === 'totp' ? '📱' : '🔑'}</span>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: T.accent }}>
                  Método actual: {security.authMethod === 'totp' ? 'Código de verificación' : 'Contraseña'}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.1rem' }}>
                  {security.authMethod === 'totp' ? 'Introduce el código de 6 dígitos de tu app de verificación' : 'Introduce tu contraseña actual para confirmar el cambio'}
                </div>
              </div>
            </div>
            <input
              type={security.authMethod === 'password' ? 'password' : 'text'}
              placeholder={security.authMethod === 'password' ? 'Contraseña actual' : '000000'}
              value={verifyInput}
              onChange={(e) => { const val = security.authMethod === 'totp' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value; setVerifyInput(val); setVerifyError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCurrent()}
              maxLength={security.authMethod === 'totp' ? 6 : undefined}
              autoFocus
              style={{ ...inputStyle, ...(security.authMethod === 'totp' ? { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' } : {}) }}
            />
            {verifyError && <div style={errorStyle}>⚠️ {verifyError}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleVerifyCurrent} disabled={verifyLoading || !verifyInput.trim()} style={{ ...saveBtnStyle, flex: 1, opacity: verifyLoading || !verifyInput.trim() ? 0.5 : 1, cursor: verifyLoading || !verifyInput.trim() ? 'not-allowed' : 'pointer' }}>
                {verifyLoading ? '⏳ Verificando...' : '✅ Verificar identidad'}
              </button>
              <button onClick={() => { setChangeStep(null); resetChangeState(); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Elegir nuevo método */}
        {changeStep === 'choose' && (
          <div>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: T.greenBg, border: `1px solid ${T.greenBorder}`, color: T.green, fontSize: '0.775rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              ✅ Identidad verificada correctamente
            </div>
            {[
              { method: 'password' as AuthMethod, emoji: '🔑', title: 'Contraseña clásica', desc: security.authMethod === 'password' ? 'Método actual — elige otro' : 'Protege tu app con una contraseña segura' },
              { method: 'totp' as AuthMethod, emoji: '📱', title: 'Verificación en dos pasos', desc: security.authMethod === 'totp' ? 'Método actual — elige otro' : 'Google Authenticator, Authy u otra app similar' },
            ].map(({ method, emoji, title, desc }) => (
              <div
                key={method}
                onClick={() => security.authMethod !== method && setNewAuthMethod(method)}
                style={{ padding: '1.25rem', borderRadius: '1rem', border: `2px solid ${newAuthMethod === method ? T.accent : T.cardBorder}`, background: newAuthMethod === method ? T.accentLight : T.pageBg, cursor: security.authMethod === method ? 'not-allowed' : 'pointer', marginBottom: '0.75rem', opacity: security.authMethod === method ? 0.5 : 1, transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: T.title, fontSize: '0.95rem' }}>{title}</div>
                    <div style={{ fontSize: '0.775rem', color: T.muted, marginTop: '0.2rem' }}>{desc}</div>
                  </div>
                  {newAuthMethod === method && security.authMethod !== method && <Check size={18} color={T.accent} style={{ flexShrink: 0 }} />}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { if (newAuthMethod !== security.authMethod) setChangeStep(newAuthMethod === 'password' ? 'new-password' : 'new-totp'); }} disabled={newAuthMethod === security.authMethod} style={{ ...saveBtnStyle, flex: 1, opacity: newAuthMethod === security.authMethod ? 0.4 : 1, cursor: newAuthMethod === security.authMethod ? 'not-allowed' : 'pointer' }}>
                Continuar →
              </button>
              <button onClick={() => { setChangeStep(null); resetChangeState(); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* PASO 3a: Nueva contraseña */}
        {changeStep === 'new-password' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input type={showNewPassword ? 'text' : 'password'} placeholder="Nueva contraseña (mínimo 8 caracteres)" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setNewPasswordError(null); }} autoFocus style={{ ...inputStyle, marginBottom: 0, paddingRight: '3rem' }} />
              <button onClick={() => setShowNewPassword((s) => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '0.8rem' }}>
                {showNewPassword ? '��' : '👁️'}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  {[1, 2, 3, 4].map((level) => {
                    const strength = newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 4
                      : newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 3
                      : newPassword.length >= 8 ? 2 : 1;
                    const colors = ['#dc2626', '#d97706', '#16a34a', '#2563eb'];
                    return <div key={level} style={{ flex: 1, height: '0.25rem', borderRadius: '9999px', background: level <= strength ? colors[strength - 1] : T.cardBorder, transition: 'all 0.2s' }} />;
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: T.muted }}>
                  {newPassword.length < 8 ? '⚠️ Muy corta' : newPassword.length < 10 ? '✅ Aceptable' : newPassword.length >= 12 && /[^A-Za-z0-9]/.test(newPassword) ? '💪 Muy fuerte' : '✅ Buena'}
                </div>
              </div>
            )}
            <input type={showNewPassword ? 'text' : 'password'} placeholder="Repite la nueva contraseña" value={newPassword2} onChange={(e) => { setNewPassword2(e.target.value); setNewPasswordError(null); }} style={inputStyle} />
            {newPassword2.length > 0 && newPassword !== newPassword2 && <div style={{ ...errorStyle, marginTop: '-0.5rem' }}>⚠️ Las contraseñas no coinciden</div>}
            {newPasswordError && <div style={errorStyle}>⚠️ {newPasswordError}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleSaveMethodChange} disabled={newPassword.length < 8 || newPassword !== newPassword2} style={{ ...saveBtnStyle, flex: 1, background: T.green, opacity: newPassword.length < 8 || newPassword !== newPassword2 ? 0.5 : 1, cursor: newPassword.length < 8 || newPassword !== newPassword2 ? 'not-allowed' : 'pointer' }}>
                ✅ Guardar nueva contraseña
              </button>
              <button onClick={() => setChangeStep('choose')} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>
                ← Atrás
              </button>
            </div>
          </div>
        )}

        {/* PASO 3b: Nuevo TOTP */}
        {changeStep === 'new-totp' && (() => {
          const otpauthUrl = `otpauth://totp/${encodeURIComponent('FinanzasHogar')}:${encodeURIComponent('usuario')}?secret=${newTotpSecret}&issuer=${encodeURIComponent('FinanzasHogar')}&algorithm=SHA1&digits=6&period=30`;
          return (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.875rem', background: '#ffffff', borderRadius: '1rem', border: `2px solid ${T.cardBorder}`, marginBottom: '0.75rem' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpauthUrl)}`} alt="QR TOTP" width={160} height={160} style={{ display: 'block', borderRadius: '0.5rem' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: T.muted, marginBottom: '0.5rem', textAlign: 'center' }}>¿No puedes escanear el QR? Introduce el código manualmente:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', borderRadius: '0.75rem', background: T.pageBg, border: `1.5px solid ${T.cardBorder}`, width: '100%', boxSizing: 'border-box' as const }}>
                  <code style={{ flex: 1, fontSize: '0.8rem', fontFamily: 'monospace', color: T.title, letterSpacing: '0.1em', wordBreak: 'break-all' as const }}>{newTotpSecret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(newTotpSecret); setNewTotpCopied(true); setTimeout(() => setNewTotpCopied(false), 2000); }} style={{ padding: '0.3rem 0.625rem', borderRadius: '0.5rem', border: `1px solid ${T.cardBorder}`, background: newTotpCopied ? T.greenBg : T.cardBg, color: newTotpCopied ? T.green : T.muted, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    {newTotpCopied ? '✅ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              {!newTotpVerified ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.body, marginBottom: '0.5rem' }}>Introduce el código de 6 dígitos de tu app:</div>
                  <input type="text" placeholder="000000" value={newTotpCode} onChange={(e) => { setNewTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setNewTotpError(null); }} onKeyDown={(e) => e.key === 'Enter' && handleVerifyNewTotp()} maxLength={6} autoFocus style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }} />
                  {newTotpError && <div style={errorStyle}>⚠️ {newTotpError}</div>}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleVerifyNewTotp} disabled={newTotpCode.length !== 6 || newTotpVerifying} style={{ ...saveBtnStyle, flex: 1, opacity: newTotpCode.length !== 6 || newTotpVerifying ? 0.5 : 1, cursor: newTotpCode.length !== 6 || newTotpVerifying ? 'not-allowed' : 'pointer' }}>
                      {newTotpVerifying ? '⏳ Verificando...' : '✅ Verificar código'}
                    </button>
                    <button onClick={() => setChangeStep('choose')} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>← Atrás</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '1rem', borderRadius: '1rem', background: T.greenBg, border: `1.5px solid ${T.greenBorder}`, textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
                    <div style={{ fontWeight: 800, color: T.green, fontSize: '0.9rem' }}>Verificación en dos pasos configurada correctamente</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '0.875rem', background: T.pageBg, border: `1.5px solid ${T.cardBorder}`, marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>⏱️ ¿Cada cuánto pedir el código?</div>
                    <select value={newTotpGraceMs} onChange={(e) => setNewTotpGraceMs(Number(e.target.value))} style={selectStyle}>
                      {TOTP_GRACE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleSaveMethodChange} style={{ ...saveBtnStyle, flex: 1, background: T.green }}>✅ Activar TOTP como nuevo método</button>
                    <button onClick={() => setChangeStep('choose')} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>← Atrás</button>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </Modal>
    );
  }

  // ── Panel principal ───────────────────────────────────────────────────────
  return (
    <Modal
      title="⚙️ Ajustes de seguridad"
      subtitle="Personaliza cómo y cuándo se bloquea la app"
      onClose={onClose}
      T={T}
      preventClickOutside={true}
    >
      {/* Método de autenticación */}
      <div style={sectionStyle}>
        <span style={labelStyle}>🔐 Método de autenticación activo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: T.accentLight, border: `1px solid ${T.accent}33`, marginBottom: '0.875rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{security.authMethod === 'totp' ? '📱' : '🔑'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: T.accent }}>
              {security.authMethod === 'totp' ? 'Verificación en dos pasos' : 'Contraseña clásica'}
            </div>
          </div>
        </div>
        <button
          onClick={() => { resetChangeState(); setNewAuthMethod(security.authMethod === 'password' ? 'totp' : 'password'); setChangeStep('verify'); }}
          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          🔄 Cambiar método de acceso
        </button>
      </div>

      {/* Frecuencia de verificación TOTP */}
      {security.authMethod === 'totp' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>⏱️ Frecuencia de verificación</span>
          <p style={{ fontSize: '0.775rem', color: T.muted, marginBottom: '0.75rem', lineHeight: 1.5 }}>Si cierras y vuelves a abrir la app dentro de este tiempo, no te pedirá el Código de verificación.</p>
          <select value={totpGraceMs} onChange={(e) => setTotpGraceMs(Number(e.target.value))} style={selectStyle}>
            {TOTP_GRACE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div style={{ fontSize: '0.72rem', color: T.muted, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: T.cardBg, border: `1px solid ${T.cardBorder}`, marginBottom: '0.75rem' }}>
            ⚙️ Valor actual: <strong style={{ color: T.body }}>{TOTP_GRACE_OPTIONS.find((o) => o.value === security.totpGraceMs)?.label ?? 'No configurado'}</strong>
          </div>
          <button onClick={handleSaveGrace} style={saveBtnStyle}>✅ Guardar período de gracia</button>
        </div>
      )}

      {/* Bloqueo por inactividad */}
      <div style={sectionStyle}>
        <span style={labelStyle}>💤 Bloqueo por inactividad</span>
        <p style={{ fontSize: '0.775rem', color: T.muted, marginBottom: '0.75rem', lineHeight: 1.5 }}>La app se bloqueará automáticamente si no hay actividad durante este tiempo.</p>
        <select value={inactivityMs} onChange={(e) => setInactivityMs(Number(e.target.value))} style={selectStyle}>
          {INACTIVITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div style={{ fontSize: '0.72rem', color: T.muted, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: T.cardBg, border: `1px solid ${T.cardBorder}`, marginBottom: '0.75rem' }}>
          ⚙️ Valor actual: <strong style={{ color: T.body }}>{INACTIVITY_OPTIONS.find((o) => o.value === security.inactivityMs)?.label ?? 'No configurado'}</strong>
        </div>
        <button onClick={handleSaveInactivity} style={saveBtnStyle}>✅ Guardar tiempo de inactividad</button>
      </div>

      {/* Email de recuperación */}
      <div style={sectionStyle}>
        <span style={labelStyle}>📧 Email de recuperación</span>
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: security.emailVerified ? T.greenBg : T.amberBg, border: `1px solid ${security.emailVerified ? T.greenBorder : T.amberBorder}`, fontSize: '0.775rem', color: security.emailVerified ? T.green : T.amber, fontWeight: 600, marginBottom: '0.875rem' }}>
          {security.emailVerified ? `✅ Email verificado: ${security.email}` : '⚠️ No tienes email de recuperación configurado'}
        </div>

        {emailStep === 'idle' && (
          <>
            <input type="email" placeholder="tu@email.com" value={emailInput} onChange={(e) => { setEmailInput(e.target.value); setEmailError(null); }} style={inputStyle} />
            {emailError && <div style={errorStyle}>⚠️ {emailError}</div>}
            <button onClick={handleSendEmailCode} disabled={emailLoading} style={{ ...saveBtnStyle, opacity: emailLoading ? 0.7 : 1 }}>
              {emailLoading ? '⏳ Enviando...' : '📧 Enviar código de verificación'}
            </button>
          </>
        )}

        {emailStep === 'verifying' && (
          <>
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: T.greenBg, border: `1px solid ${T.greenBorder}`, color: T.green, fontSize: '0.775rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              ✅ Código enviado a <strong>{emailInput}</strong>
            </div>
            <input type="text" placeholder="000000" value={emailCode} onChange={(e) => { setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setEmailError(null); }} maxLength={6} style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }} />
            {emailError && <div style={errorStyle}>⚠️ {emailError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={handleVerifyEmailCode} disabled={emailCode.length !== 6} style={{ ...saveBtnStyle, opacity: emailCode.length !== 6 ? 0.5 : 1, cursor: emailCode.length !== 6 ? 'not-allowed' : 'pointer' }}>
                ✅ Verificar código
              </button>
              <button onClick={handleSendEmailCode} disabled={resendWait > 0 || emailLoading} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: resendWait > 0 ? 'not-allowed' : 'pointer', opacity: resendWait > 0 ? 0.5 : 1 }}>
                {resendWait > 0 ? `Reenviar en ${resendWait}s` : '🔄 Reenviar'}
              </button>
              <button onClick={() => { setEmailStep('idle'); setEmailError(null); setEmailCode(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${T.cardBorder}`, background: T.btnSecBg, color: T.btnSecText, fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
