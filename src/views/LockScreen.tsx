import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { useSecurityContext } from '../SecurityContext';
import { isWithinTotpGrace, TOTP_GRACE_DEFAULT_MS } from '../securityUtils';

// 🔴 FIX — Eliminado import de verifyTOTP (ahora lo hace unlock internamente)

export function LockScreen() {
  const {
    security,
    unlock,
    sendCode,
    verifyCode,
    recoverWithPhrase,
    recoverWithFile,
  } = useSecurityContext();

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
  const [fileContent, setFileContent] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔴 FIX 1 — useEffect no puede ser async directamente
  // Solución: función interna async
  useEffect(() => {
    const checkGrace = async () => {
      if (
        security.authMethod === 'totp' &&
        isWithinTotpGrace(security.totpGraceMs ?? TOTP_GRACE_DEFAULT_MS)
      ) {
        await unlock('totp-grace');
      }
    };
    checkGrace();
  }, []);

  // Cuenta atrás reenvío
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  // 🔴 FIX 2 — Eliminado verifyTOTP manual. unlock() ya lo hace internamente.
  // Eliminado .then() mezclado con await. Todo limpio con async/await.
  const handleUnlock = async () => {
    if (!input.trim()) return;
    const ok = await unlock(input.trim());
    if (!ok) {
      if (security.authMethod === 'totp') {
        setError('Código de verificación incorrecto. Inténtalo de nuevo.');
      } else {
        setError('Contraseña incorrecta. Inténtalo de nuevo.');
      }
      setInput('');
    }
  };

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
    if (!ok) setError('La frase de recuperación no es correcta.');
  };

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

  const handleVerifyCode = () => {
    const result = verifyCode(codeInput.trim());
    if (result.ok) {
      setStep('new-password');
      setError(null);
    } else {
      setError(result.error ?? 'Código incorrecto.');
    }
  };

  // ── Pantalla de desbloqueo ────────────────────────────────────────────────
  if (step === 'unlock') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
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

          {error && <div style={errorStyle}>⚠️ {error}</div>}
          <button onClick={handleUnlock} style={btnPrimaryStyle}>
            🔓 Desbloquear
          </button>

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

  // ── Frase de recuperación ─────────────────────────────────────────────────
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

          {phraseInput.trim().split(/\s+/).filter(Boolean).length === 12 && (
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

  // ── Fichero de recuperación ───────────────────────────────────────────────
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
              if (!ok)
                setFileError(
                  'El fichero no es válido o no corresponde a esta app.'
                );
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

  // ── Email — enviar código ─────────────────────────────────────────────────
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

  // ── Email — verificar código ──────────────────────────────────────────────
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

  // ── Nueva contraseña tras email ───────────────────────────────────────────
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

          {/* 🔴 FIX 3 — onClick ahora es async para poder usar await unlock() */}
          <button
            onClick={async () => {
              if (newPassword !== newPassword2) {
                setError('Las contraseñas no coinciden.');
                return;
              }
              if (newPassword.length < 8) {
                setError('La contraseña debe tener al menos 8 caracteres.');
                return;
              }
              recoverWithPhrase('', newPassword);
              await unlock(newPassword);
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
