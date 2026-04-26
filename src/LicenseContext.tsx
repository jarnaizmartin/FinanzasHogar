// ============================================================
// LICENSE CONTEXT — Finance Hub Beta
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LicenseState } from './licenseManager';
import {
  initLicense,
  checkAndUpdateExpiry,
  getTrialDaysRemaining,
  validateAndActivate,
} from './licenseManager';

// ── Tipos del contexto ───────────────────────────────────────

interface LicenseContextType {
  license: LicenseState;
  daysRemaining: number;
  isActivated: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isGraceTrial: boolean;
  isReadOnly: boolean;
  activate: (code: string) => Promise<{ success: boolean; message: string }>;
  refreshLicense: () => void;
}

// ── Creación del contexto ────────────────────────────────────

const LicenseContext = createContext<LicenseContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [license, setLicense] = useState<LicenseState>(() => {
    const initial = initLicense();
    return checkAndUpdateExpiry(initial);
  });

  // Comprueba expiración cada vez que la app se enfoca
  useEffect(() => {
    const handleFocus = () => {
      setLicense(prev => checkAndUpdateExpiry(prev));
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Comprueba expiración cada hora automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setLicense(prev => checkAndUpdateExpiry(prev));
    }, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  // ── Valores derivados ──────────────────────────────────────

  const daysRemaining = getTrialDaysRemaining(license);
  const isActivated = license.mode === 'activated';
  const isTrial = license.mode === 'trial';
  const isExpired = license.mode === 'expired';
  const isGraceTrial = license.mode === 'grace_trial';
  const isReadOnly = isExpired; // Solo lectura cuando expira

  // ── Activar licencia ───────────────────────────────────────

  const activate = async (code: string) => {
    const result = await validateAndActivate(code, license);
  
    if (result.success && result.newState) {
      setLicense(result.newState);
    }
    return { success: result.success, message: result.message };
  }; 

  // ── Refrescar manualmente ──────────────────────────────────

  const refreshLicense = () => {
    setLicense(prev => checkAndUpdateExpiry(prev));
  };

  return (
    <LicenseContext.Provider
    value={{
      license,
      daysRemaining,
      isActivated,
      isTrial,
      isExpired,
      isGraceTrial,
      isReadOnly,
      activate,
      refreshLicense,
    }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

export function useLicense(): LicenseContextType {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense debe usarse dentro de LicenseProvider');
  }
  return context;
}
