// ============================================================
// LICENSE SCREENS — Finance Hub Beta
// ============================================================

import React, { useState } from 'react';
import { useLicense } from './LicenseContext';
import { Shield, Clock, Lock, Key, CheckCircle, AlertTriangle } from 'lucide-react';

// ── 1. BANNER DE TRIAL ───────────────────────────────────────
// Se muestra en la parte superior cuando el trial está activo

export function TrialBanner() {
  const { isTrial, isGraceTrial, daysRemaining, isActivated } = useLicense();
  const [showActivation, setShowActivation] = useState(false);

  if ((!isTrial && !isGraceTrial) || isActivated) return null;

  const isUrgent = isGraceTrial || daysRemaining <= 5;

  return (
    <>
      <div
        className={`w-full px-4 py-2 flex items-center justify-between text-sm font-medium ${
          isUrgent
            ? 'bg-red-500 text-white'
            : 'bg-amber-400 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {isGraceTrial ? <AlertTriangle size={16} /> : <Clock size={16} />}
          {isGraceTrial
            ? daysRemaining === 0
              ? 'Tu licencia ha caducado · Último día de gracia'
              : `Tu licencia ha caducado · ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} de gracia restante${daysRemaining !== 1 ? 's' : ''}`
            : daysRemaining === 0
              ? 'Tu período de prueba termina hoy'
              : `Período de prueba: ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`}
        </div>
        <button
          onClick={() => setShowActivation(true)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            isUrgent
              ? 'bg-white text-red-500 hover:bg-red-50'
              : 'bg-amber-900 text-amber-100 hover:bg-amber-800'
          }`}
        >
          {isGraceTrial ? 'Renovar licencia' : 'Activar licencia'}
        </button>

      </div>

      {showActivation && (
        <ActivationModal onClose={() => setShowActivation(false)} />
      )}
    </>
  );
}

// ── 2. PANTALLA DE EXPIRACIÓN ────────────────────────────────
// Bloquea la app cuando el trial ha expirado

export function ExpiredScreen({ onActivate }: { onActivate: () => void }) {
  const { isGraceTrial } = useLicense();
  const [contactStatus, setContactStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const handleContact = async () => {
    setContactStatus('loading');
    try {
      const { default: emailjs } = await import('@emailjs/browser');
      const deviceId = localStorage.getItem('fh_device_id') ?? 'No disponible';
      await emailjs.send(
        'service_2n3xw16',
        'template_85h265d',
        {
          to_email: 'jarnaiz.martin@gmail.com',
          code: `SOLICITUD DE LICENCIA\n\nDevice ID: ${deviceId}`,
        },
        'ibuKBzaykTwjkn95o'
      );
      setContactStatus('success');
    } catch (err) {
      console.error('[EmailJS]', err);
      setContactStatus('error');
    }
  };

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

        {/* Qué pierde */}
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

        {/* Botón activar licencia */}
        <button
          onClick={onActivate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Key size={18} />
          Introducir código de licencia
        </button>

        {/* Botón contactar — con estados */}
        {contactStatus === 'idle' && (
          <button
            onClick={handleContact}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-6 rounded-xl transition-colors block text-center"
          >
            Contactar para obtener una licencia
          </button>
        )}

        {contactStatus === 'loading' && (
          <div className="w-full bg-gray-100 text-gray-400 font-medium py-3 px-6 rounded-xl text-center">
            ⏳ Enviando solicitud...
          </div>
        )}

        {contactStatus === 'success' && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 font-medium py-3 px-6 rounded-xl text-center flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            ¡Solicitud enviada! El administrador se pondrá en contacto contigo.
          </div>
        )}

        {contactStatus === 'error' && (
          <div className="flex flex-col gap-2">
            <div className="w-full bg-red-50 border border-red-200 text-red-600 font-medium py-3 px-6 rounded-xl text-center">
              ⚠️ Error al enviar. Inténtalo de nuevo.
            </div>
            <button
              onClick={() => setContactStatus('idle')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-6 rounded-xl transition-colors text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


// ── 3. MODAL DE ACTIVACIÓN ───────────────────────────────────
// Se abre desde el banner o desde la pantalla de expiración

export function ActivationModal({ onClose }: { onClose: () => void }) {
  const { activate } = useLicense();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleActivate = async () => {
    if (!code.trim()) return;
    setStatus('loading');
  
    // Extraemos la fecha de caducidad del código del Admin
    const storedCodes = localStorage.getItem('fh_admin_codes');
    const codes = storedCodes ? JSON.parse(storedCodes) : [];
    const match = codes.find((c: any) => 
      c.code.trim().toUpperCase() === code.trim().toUpperCase()
    );
  
    if (!match) {
      setStatus('error');
      setMessage('Código de licencia no válido.');
      return;
    }
  
    const result = await activate(code, match.expiryDate);
  
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
            <Shield size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Activar licencia</h3>
            <p className="text-gray-500 text-sm">Introduce tu código de licencia</p>
          </div>
        </div>

        {/* Input del código */}
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
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
            {status === 'success'
              ? <CheckCircle size={16} />
              : <AlertTriangle size={16} />}
            {message}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-xl transition-colors"
            disabled={status === 'loading'}
          >
            Cancelar
          </button>
          <button
            onClick={handleActivate}
            disabled={!code.trim() || status === 'loading' || status === 'success'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Validando...' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  );
}
