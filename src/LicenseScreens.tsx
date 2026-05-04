// ============================================================
// LICENSE SCREENS — Finance Hub Beta
// ============================================================

import React, { useState } from 'react';
import { useLicense } from './LicenseContext';
import {
  Shield,
  Clock,
  Lock,
  Key,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

// ── 1. BANNER DE TRIAL ───────────────────────────────────────

export function TrialBanner() {
  const { isTrial, isGraceTrial, daysRemaining, isActivated } = useLicense();
  const [showRequest, setShowRequest] = useState(false);

  if ((!isTrial && !isGraceTrial) || isActivated) return null;

  const isUrgent = isGraceTrial || daysRemaining <= 5;

  return (
    <>
      <div
        className={`w-full px-4 py-2 flex items-center justify-between text-sm font-medium ${
          isUrgent ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {isGraceTrial ? <AlertTriangle size={16} /> : <Clock size={16} />}
          {isGraceTrial
            ? daysRemaining === 0
              ? 'Tu licencia ha caducado · Último día de gracia'
              : `Tu licencia ha caducado · ${daysRemaining} día${
                  daysRemaining !== 1 ? 's' : ''
                } de gracia restante${daysRemaining !== 1 ? 's' : ''}`
            : daysRemaining === 0
            ? 'Tu período de prueba termina hoy'
            : `Período de prueba: ${daysRemaining} día${
                daysRemaining !== 1 ? 's' : ''
              } restante${daysRemaining !== 1 ? 's' : ''}`}
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            isUrgent
              ? 'bg-white text-red-500 hover:bg-red-50'
              : 'bg-amber-900 text-amber-100 hover:bg-amber-800'
          }`}
        >
          Solicitar licencia
        </button>
      </div>

      {showRequest && (
        <RequestLicenseModal onClose={() => setShowRequest(false)} />
      )}
    </>
  );
}

// ── 2. PANTALLA DE EXPIRACIÓN ────────────────────────────────

export function ExpiredScreen({ onActivate }: { onActivate: () => void }) {
  const { isGraceTrial } = useLicense();
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <Lock size={40} className="text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isGraceTrial
            ? 'Tu licencia ha caducado'
            : 'Tu período de prueba ha finalizado'}
        </h2>

        {/* Descripción */}
        <p className="text-gray-500 mb-2">
          Tus datos están guardados y seguros.
        </p>
        <p className="text-gray-500 mb-6">
          {isGraceTrial
            ? 'Renueva tu licencia para seguir usando la aplicación sin limitaciones.'
            : 'Activa tu licencia para seguir usando la aplicación sin limitaciones.'}
        </p>

        {/* Qué puede hacer */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            En modo lectura puedes:
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>✅ Ver todos tus datos y movimientos</li>
            <li>✅ Consultar tus proyecciones</li>
            <li>✅ Ver tus objetivos</li>
            <li>❌ Añadir o editar movimientos</li>
            <li>❌ Crear proyecciones nuevas</li>
            <li>❌ Modificar objetivos</li>
          </ul>
        </div>

        {/* Botón principal — abre Modal 1 */}
        <button
          onClick={() => setShowRequest(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Key size={18} />
          Solicitar o activar licencia
        </button>
      </div>

      {showRequest && (
        <RequestLicenseModal onClose={() => setShowRequest(false)} />
      )}
    </div>
  );
}

// ── 3. MODAL 1 — SOLICITAR LICENCIA ─────────────────────────

function RequestLicenseModal({ onClose }: { onClose: () => void }) {
  const { license } = useLicense();
  const deviceId =
    license.deviceId ?? localStorage.getItem('fh_device_id') ?? 'No disponible';

  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [showActivation, setShowActivation] = useState(false);

  // Copiar Device ID al portapapeles
  const handleCopy = () => {
    navigator.clipboard.writeText(deviceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Enviar solicitud al administrador por email (Web3Forms) ──
  const handleSend = async () => {
    setSendStatus('loading');
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '10837e48-e398-49d2-bf7d-7bd8d37cc5da',
          subject: 'Solicitud de licencia — FinanzasHogar',
          from_name: 'FinanzasHogar App',
          message: `SOLICITUD DE LICENCIA\n\nDevice ID: ${deviceId}`,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSendStatus('success');
      } else {
        console.error('[Web3Forms]', data);
        setSendStatus('error');
      }
    } catch (err) {
      console.error('[Web3Forms]', err);
      setSendStatus('error');
    }
  };

  // Si el usuario quiere activar, mostramos Modal 2
  if (showActivation) {
    return (
      <ActivationModal
        onClose={onClose}
        onBack={() => setShowActivation(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 rounded-full p-2">
            <Shield size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              Solicitar licencia
            </h3>
            <p className="text-gray-500 text-sm">
              Envía tu Device ID al administrador para recibir tu código
            </p>
          </div>
        </div>

        {/* Explicación */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-700">
          <p className="font-semibold mb-1">ℹ️ ¿Cómo funciona?</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-600">
            <li>Copia tu Device ID o envíalo automáticamente</li>
            <li>El administrador generará tu código de licencia</li>
            <li>Cuando lo recibas, pulsa "Activar licencia"</li>
          </ol>
        </div>

        {/* Device ID */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Tu Device ID
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <code className="flex-1 text-sm font-mono text-gray-700 break-all">
              {deviceId}
            </code>
            <button
              onClick={handleCopy}
              title="Copiar al portapapeles"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-600 shrink-0"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-green-500" /> Copiado
                </>
              ) : (
                <>
                  <Copy size={13} /> Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Botón enviar solicitud */}
        <div className="mb-2">
          {sendStatus === 'idle' && (
            <button
              onClick={handleSend}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              📧 Enviar solicitud al administrador
            </button>
          )}
          {sendStatus === 'loading' && (
            <div className="w-full bg-gray-100 text-gray-400 font-medium py-3 px-6 rounded-xl text-center">
              ⏳ Enviando solicitud...
            </div>
          )}
          {sendStatus === 'success' && (
            <div className="flex flex-col gap-2">
              <div className="w-full bg-green-50 border border-green-200 text-green-700 font-medium py-3 px-6 rounded-xl text-center flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                ¡Solicitud enviada! El administrador se pondrá en contacto
                contigo.
              </div>
              <button
                onClick={() => setSendStatus('idle')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Volver a enviar
              </button>
            </div>
          )}
          {sendStatus === 'error' && (
            <div className="flex flex-col gap-2">
              <div className="w-full bg-red-50 border border-red-200 text-red-600 font-medium py-3 px-6 rounded-xl text-center">
                ⚠️ Error al enviar. Inténtalo de nuevo.
              </div>
              <button
                onClick={() => setSendStatus('idle')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-6 rounded-xl transition-colors text-sm"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">
            ¿Ya tienes un código?
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Botón activar licencia */}
        <button
          onClick={() => setShowActivation(true)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Key size={16} />
          Activar licencia
        </button>

        {/* Cancelar */}
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── 4. MODAL 2 — ACTIVAR LICENCIA ───────────────────────────

export function ActivationModal({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack?: () => void;
}) {
  const { activate } = useLicense();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleActivate = async () => {
    if (!code.trim()) return;
    setStatus('loading');
  
    // ✅ Ya no necesitamos buscar en localStorage
    // El expiryDate está codificado dentro del propio código
    const result = await activate(code);
  
    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setTimeout(() => onClose(), 2000);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 rounded-full p-2">
            <Key size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              Activar licencia
            </h3>
            <p className="text-gray-500 text-sm">
              Introduce tu código de licencia
            </p>
          </div>
        </div>

        {/* Input del código */}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="FH-XXXX-XXXX-XXXX"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          disabled={status === 'loading' || status === 'success'}
        />

        {/* Mensaje de estado */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
              status === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            {message}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl transition-colors"
              disabled={status === 'loading'}
            >
              ← Volver
            </button>
          )}
          {!onBack && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl transition-colors"
              disabled={status === 'loading'}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleActivate}
            disabled={
              !code.trim() || status === 'loading' || status === 'success'
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Validando...' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  );
}
