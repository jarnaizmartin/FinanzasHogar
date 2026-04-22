// ============================================================
// PANEL DE ADMINISTRADOR — Finance Hub Beta
// ============================================================

import React, { useState } from 'react';
import { generateLicenseCode, checkAdminPassword, getNewExpiryDate, formatExpiryDate } from './licenseManager';
import { Shield, Key, Copy, CheckCircle, Lock, RefreshCw } from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────

interface GeneratedCode {
  deviceId: string;
  code: string;
  createdAt: string;
  label: string;
  email: string;
  expiryDate: number;
  expiryDateFormatted: string;
}


// ── Panel principal ──────────────────────────────────────────

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // ── Login de administrador ─────────────────────────────────

  const handleLogin = () => {
    if (checkAdminPassword(adminPassword)) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Clave de administrador incorrecta');
      setAdminPassword('');
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin
      password={adminPassword}
      onChange={setAdminPassword}
      onLogin={handleLogin}
      error={authError}
    />;
  }

  return <AdminDashboard />;
}

// ── Pantalla de login ────────────────────────────────────────

function AdminLogin({
  password,
  onChange,
  onLogin,
  error,
}: {
  password: string;
  onChange: (v: string) => void;
  onLogin: () => void;
  error: string;
}) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">

        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Shield size={36} className="text-blue-600" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Panel de Administrador
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Finance Hub Beta — Acceso restringido
        </p>

        {/* Input clave */}
        <input
          type="password"
          value={password}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          placeholder="Clave de administrador"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-3 flex items-center justify-center gap-1">
            <Lock size={14} />
            {error}
          </p>
        )}

        {/* Botón */}
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Acceder
        </button>
      </div>
    </div>
  );
}

// ── Dashboard del administrador ──────────────────────────────

function AdminDashboard() {
  const [deviceId, setDeviceId] = useState('');
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [emailDuplicateConfirmed, setEmailDuplicateConfirmed] = useState(false);
  const [history, setHistory] = useState<GeneratedCode[]>(() => {
    const stored = localStorage.getItem('fh_admin_codes');
    return stored ? JSON.parse(stored) : [];
  });

  // ── Generar código ─────────────────────────────────────────

  const handleGenerate = async () => {
    if (!deviceId.trim() || !label.trim() || !email.trim()) return;

    // ── Comprobación de email duplicado ──────────────────────────
    const emailAlreadyExists = history.some(
      (entry) => entry.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailAlreadyExists && !emailDuplicateConfirmed) {
      setShowEmailWarning(true);
      return;
    }

    // ── Generar código ────────────────────────────────────────────
    setIsGenerating(true);
    setShowEmailWarning(false);
    setEmailDuplicateConfirmed(false);
    const expiry = getNewExpiryDate();
    const code = await generateLicenseCode(deviceId.trim(), expiry);
    setGeneratedCode(code);

    const newEntry: GeneratedCode = {
      deviceId: deviceId.trim(),
      code,
      label: label.trim(),
      email: email.trim(),
      expiryDate: expiry,
      expiryDateFormatted: formatExpiryDate(expiry),
      createdAt: new Date().toLocaleString('es-ES'),
    };

    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem('fh_admin_codes', JSON.stringify(updated));
    setIsGenerating(false);
  };


  // ── Copiar al portapapeles ─────────────────────────────────

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Limpiar historial ──────────────────────────────────────

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('fh_admin_codes');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-full p-2">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Panel de Administrador</h1>
            <p className="text-gray-400 text-sm">Generador de códigos de licencia</p>
          </div>
        </div>

        {/* Generador */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Key size={18} className="text-blue-600" />
            Generar nuevo código
          </h2>

          {/* Label del beta tester */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Nombre del beta tester
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Juan García"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email del beta tester */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Email del beta tester
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ej: juan@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>


          {/* Device ID */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">
              Device ID del beta tester
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="Pega aquí el Device ID que te envíe el usuario"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              El beta tester lo encuentra en: Ajustes → Información → Device ID
            </p>
          </div>

          {/* Warning email duplicado */}
          {showEmailWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2 mb-3">
                <Shield size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    ⚠️ Este email ya tiene una licencia generada
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    El email <strong>{email}</strong> ya aparece en el historial.
                    Podría ser un intento de licencia duplicada. ¿Continuar igualmente?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEmailDuplicateConfirmed(true);
                    handleGenerate();
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  Sí, generar igualmente
                </button>
                <button
                  onClick={() => setShowEmailWarning(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}



          {/* Botón generar */}
          <button
            onClick={handleGenerate}
            disabled={!deviceId.trim() || !label.trim() || !email.trim() || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isGenerating ? 'Generando...' : 'Generar código'}
          </button>

          {/* Código generado */}
          {generatedCode && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Código generado:</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-lg font-bold text-blue-700 tracking-widest">
                  {generatedCode}
                </code>
                <button
                  onClick={() => handleCopy(generatedCode)}
                  className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Códigos generados</h2>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
              >
                <RefreshCw size={14} />
                Limpiar historial
              </button>
            </div>

            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{entry.label}</p>
                    <p className="text-gray-500 text-xs">{entry.email}</p>
                    <code className="text-blue-700 font-mono text-sm font-bold">
                      {entry.code}
                    </code>
                    <p className="text-gray-400 text-xs mt-1">Caduca: {entry.expiryDateFormatted}</p>
                    <p className="text-gray-400 text-xs">{entry.createdAt}</p>
                  </div>

                  <button
                    onClick={() => handleCopy(entry.code)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
