import { useEffect } from 'react';

// ✅ FIX 15 — Sincronización entre pestañas del navegador.
// Sin esto, si el usuario abre la app en dos pestañas, los cambios
// en una pestaña no se reflejan en la otra y pueden sobrescribirse.
//
// Uso: llama a este hook una sola vez en AppProvider.
// Cuando localStorage cambia en otra pestaña, recarga la página
// para evitar datos inconsistentes.

const WATCHED_KEYS = [
  'fh_accounts',
  'fh_categories',
  'fh_projections',
  'fh_real_expenses',
  'fh_goals',
  'fh_bank_formats',
  'fh_category_rules',
  'fh_base_currency',
  'fh_currency',
  'fh_dark',
];

export function useLocalStorageSync() {
  useEffect(() => {
    let reloadScheduled = false;

    const handleStorage = (e: StorageEvent) => {
      // Solo reacciona a claves de la app
      if (!e.key || !WATCHED_KEYS.includes(e.key)) return;
      // Solo si el valor realmente cambió
      if (e.oldValue === e.newValue) return;
      // Evita recargas múltiples si varios cambios llegan a la vez
      if (reloadScheduled) return;

      reloadScheduled = true;
      console.info(
        `[LocalStorageSync] Cambio detectado en otra pestaña (${e.key}). Recargando...`
      );

      // Pequeño delay para agrupar cambios simultáneos
      setTimeout(() => {
        window.location.reload();
      }, 300);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
}
