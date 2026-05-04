import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// ✅ FIX 9 — Extraído de AppProvider para ser compartido por todos los sub-contextos
export function useLocalStorage<T>(
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return fallback;
      return JSON.parse(stored) as T;
    } catch {
      console.warn(`[useLocalStorage] Error leyendo "${key}", usando fallback.`);
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
