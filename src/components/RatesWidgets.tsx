import { useState } from 'react';
import { CURRENCIES } from '../utils';
import { Modal } from './UI';
import { useApp } from '../AppContext';

// ─── RatesStatusBar ───────────────────────────────────────────────────────────
export function RatesStatusBar({ T }: { T: any }) {
  const { ratesStatus, ratesAgeText, refreshRates } = useApp();

  const configs: Record<string, any> = {
    fresh: {
      bg: T.greenBg,
      border: T.greenBorder,
      color: T.green,
      icon: '✅',
      text: 'Tipos de cambio actualizados',
      subtext: `Actualizado ${ratesAgeText}`,
    },
    stale: {
      bg: T.amberBg,
      border: T.amberBorder,
      color: T.amber,
      icon: '⚠️',
      text: 'Usando tipos de cambio aproximados',
      subtext:
        ratesAgeText !== '—'
          ? `Última actualización: ${ratesAgeText}. No se pudo conectar con el servidor.`
          : 'No se pudo conectar con el servidor. Usando valores aproximados.',
    },
    error: {
      bg: T.redBg,
      border: T.redBorder,
      color: T.red,
      icon: '⛔',
      text: 'Error al obtener tipos de cambio',
      subtext: 'Usando valores aproximados. Pulsa Actualizar para reintentar.',
    },
    loading: {
      bg: T.pageBg,
      border: T.cardBorder,
      color: T.muted,
      icon: '⏳',
      text: 'Actualizando tipos de cambio...',
      subtext: '',
    },
  };

  const cfg = configs[ratesStatus] ?? configs.loading;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderRadius: '0.875rem',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        marginBottom: '1.25rem',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{ fontSize: '0.875rem' }}>{cfg.icon}</span>
        <div>
          <div
            style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color }}
          >
            {cfg.text}
          </div>
          {cfg.subtext && ratesStatus !== 'loading' && (
            <div
              style={{
                fontSize: '0.7rem',
                color: cfg.color,
                opacity: 0.75,
                marginTop: '0.1rem',
              }}
            >
              {cfg.subtext}
            </div>
          )}
        </div>
      </div>
      {ratesStatus !== 'loading' && (
        <button
          onClick={refreshRates}
          title="Actualizar tipos de cambio"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '0.625rem',
            border: `1px solid ${cfg.border}`,
            background: 'transparent',
            color: cfg.color,
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          🔄 Actualizar
        </button>
      )}
    </div>
  );
}

// ─── RatesTable ───────────────────────────────────────────────────────────────
export function RatesTable() {
  const { T, rates, baseCurrency, displayCurrency } = useApp();
  const [amount, setAmount] = useState('1');

  if (!rates || Object.keys(rates).length === 0) return null;

  const rateFrom = rates[baseCurrency] ?? 1;
  const rateTo = rates[displayCurrency] ?? 1;
  const convertedOne = (1 / rateFrom) * rateTo;
  const convertedAmount = (parseFloat(amount) || 0) * convertedOne;
  const fromCurrency = CURRENCIES.find((c) => c.code === baseCurrency);
  const toCurrency = CURRENCIES.find((c) => c.code === displayCurrency);
  const sameCurrency = baseCurrency === displayCurrency;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '0.875rem',
        background: T.pageBg,
        border: `1px solid ${T.cardBorder}`,
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: T.muted,
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        💱 Tipo de cambio aplicado
      </div>

      {sameCurrency ? (
        <div
          style={{ fontSize: '0.8rem', color: T.muted, fontStyle: 'italic' }}
        >
          La divisa base y de visualización son iguales. No se aplica
          conversión.
        </div>
      ) : (
        <>
          {/* Par de divisas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.875rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.title,
                }}
              >
                1 {fromCurrency?.symbol} {baseCurrency}
              </span>
            </div>
            <span style={{ fontSize: '1.25rem', color: T.muted }}>→</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}44`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.accent,
                }}
              >
                {convertedOne.toFixed(4)} {toCurrency?.symbol} {displayCurrency}
              </span>
            </div>
          </div>

          {/* Fórmula */}
          <div
            style={{
              fontSize: '0.72rem',
              color: T.muted,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              marginBottom: '1rem',
              fontFamily: 'monospace',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: T.body }}>Fórmula:</strong> importe ÷{' '}
            {rateFrom.toFixed(4)} ({baseCurrency}/EUR) × {rateTo.toFixed(4)} (
            {displayCurrency}/EUR)
          </div>

          {/* Conversor rápido */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            🧮 Conversor rápido
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flex: 1,
                minWidth: '8rem',
              }}
            >
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: `1.5px solid ${T.inputBorder}`,
                  background: T.inputBg,
                  color: T.inputText,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                {fromCurrency?.symbol} {baseCurrency}
              </span>
            </div>
            <span style={{ fontSize: '1rem', color: T.muted }}>＝</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flex: 1,
                minWidth: '8rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                background: T.accentLight,
                border: `1px solid ${T.accent}44`,
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: T.accent,
                }}
              >
                {convertedAmount.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.accent,
                  opacity: 0.75,
                }}
              >
                {toCurrency?.symbol} {displayCurrency}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FullRatesTable ───────────────────────────────────────────────────────────
export function FullRatesTable({ onClose }: { onClose: () => void }) {
  const { T, rates, baseCurrency } = useApp();
  const [search, setSearch] = useState('');

  const rateFrom = rates[baseCurrency] ?? 1;
  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      title="Tabla completa de tipos de cambio"
      subtitle={`Base: ${baseCurrency} · Datos orientativos`}
      onClose={onClose}
      T={T}
    >
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar divisa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.65rem 0.875rem',
            borderRadius: '0.75rem',
            border: `1.5px solid ${T.inputBorder}`,
            background: T.inputBg,
            color: T.inputText,
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1.5fr',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: T.tableHead,
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: T.muted,
          }}
        >
          <span>Divisa</span>
          <span style={{ textAlign: 'right' }}>Código</span>
          <span style={{ textAlign: 'right' }}>1 {baseCurrency} =</span>
        </div>

        {/* Filas */}
        {filtered.map((c, i) => {
          const rateTo = rates[c.code];
          if (!rateTo) return null;
          const convertedOne = (1 / rateFrom) * rateTo;
          return (
            <div
              key={c.code}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.625rem',
                background: i % 2 === 0 ? T.tableRow : T.tableRowAlt,
                border: `1px solid ${T.tableBorder}`,
                alignItems: 'center',
              }}
            >
              <span
                style={{ fontSize: '0.825rem', fontWeight: 600, color: T.body }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: T.muted,
                  textAlign: 'right',
                }}
              >
                {c.symbol} {c.code}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: c.code === baseCurrency ? T.accent : T.title,
                  textAlign: 'right',
                }}
              >
                {convertedOne.toFixed(4)}
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: T.muted,
              fontSize: '0.875rem',
            }}
          >
            No se encontraron divisas con ese criterio
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '0.625rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.7rem',
          color: T.muted,
          lineHeight: 1.5,
        }}
      >
        ⚠️ Los tipos mostrados son orientativos y pueden diferir de los valores
        oficiales. Fuente: Frankfurter / ExchangeRate-API.
      </div>
    </Modal>
  );
}
