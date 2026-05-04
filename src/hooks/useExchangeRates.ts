import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRates } from '../types';

const RATES_CACHE_KEY = 'fh_exchange_rates';
const RATES_TTL_MS = 24 * 60 * 60 * 1000;

const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  CAD: 1.46,
  AUD: 1.64,
  CHF: 0.94,
  JPY: 162,
  CNY: 7.8,
  MXN: 18.5,
  COP: 4400,
  ARS: 980,
  CLP: 980,
  BRL: 5.4,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.25,
  HUF: 390,
  CZK: 25.2,
  RON: 4.97,
  TRY: 34.5,
  INR: 90,
  KRW: 1430,
  SGD: 1.45,
  HKD: 8.4,
  NZD: 1.78,
  ZAR: 20.1,
  AED: 3.97,
};

function loadCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ExchangeRates;
  } catch {
    return null;
  }
}

function saveCachedRates(data: ExchangeRates): void {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[ExchangeRates] No se pudo guardar la caché.');
  }
}

function ageLabel(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}

export function useExchangeRates() {
  const [data, setData] = useState<ExchangeRates>(() => {
    const cached = loadCachedRates();
    if (cached) {
      const age = Date.now() - cached.timestamp;
      return { ...cached, status: age < RATES_TTL_MS ? 'fresh' : 'stale' };
    }
    return { rates: {}, base: 'EUR', timestamp: 0, status: 'loading' };
  });

  // ✅ FIX 8 — Refs para evitar stale closure y fetches concurrentes
  const isFetchingRef = useRef(false);
  const statusRef = useRef(data.status);
  statusRef.current = data.status;

  // ✅ FIX 8 — Sin dependencias: lee el estado via ref, nunca queda obsoleto
  const fetchRates = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    if (!force && statusRef.current === 'fresh') return;

    isFetchingRef.current = true;
    setData((prev) => ({ ...prev, status: 'loading' }));

    // ✅ BONUS — Eliminado corsproxy.io (servicio de terceros no confiable)
    const URLS = [
      'https://api.frankfurter.app/latest?base=EUR',
      'https://api.exchangerate-api.com/v4/latest/EUR',
    ];

    for (const url of URLS) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        const newData: ExchangeRates = {
          rates: { ...(json.rates ?? {}), EUR: 1 },
          base: 'EUR',
          timestamp: Date.now(),
          status: 'fresh',
        };
        setData(newData);
        saveCachedRates(newData);
        isFetchingRef.current = false;
        return;
      } catch (err) {
        console.warn(`[ExchangeRates] Error con ${url}:`, err);
      }
    }

    console.warn('[ExchangeRates] API no disponible, usando fallback.');
    setData({
      rates: FALLBACK_RATES,
      base: 'EUR',
      timestamp: Date.now(),
      status: 'stale',
    });
    isFetchingRef.current = false;
  }, []); // ✅ Sin dependencias — nunca genera stale closure

  // ✅ FIX 8 — useEffect solo al montar
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates: data.rates,
    status: data.status,
    timestamp: data.timestamp,
    ageText: data.timestamp > 0 ? ageLabel(data.timestamp) : '—',
    isOutdated: data.status === 'stale' || data.status === 'error',
    refresh: () => fetchRates(true),
  };
}
