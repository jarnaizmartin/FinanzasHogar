import { ArrowLeft, Pencil, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { useApp } from '../AppContext';
import {
  estimateLoanInterest,
  calcLoanProgress,
  getLoanTypeLabel,
  getLoanTypeIcon,
} from '../lib/loanUtils';
import { Card, SecondaryBtn } from './UI';
import { InstitutionLogo } from './InstitutionLogo';
import { AmortizationHistory } from './AmortizationHistory';
import type { Account } from '../types';

interface Props {
  loan: Account;
  onBack: () => void;
  onEdit: (loan: Account) => void;
  onDelete: (id: string) => void;
  onAmortize: (id: string) => void;
  onUndoAmortization?: (amortizationId: string) => void;
}

/**
 * Vista detalle de un préstamo (Fase 2.1.4 — drill-down).
 * Header verde + KPIs + gráfica de evolución + histórico de amortizaciones.
 */
 export function LoanDetailView({ loan, onBack, onEdit, onDelete, onAmortize, onUndoAmortization }: Props) {
  const { T, fmtAccount, baseCurrency, realBalanceMap, setRealAccountFilter, setRealReturnTo, setTab, accounts } = useApp();

  const currency = loan.currency ?? baseCurrency;
  const loanInfo = realBalanceMap[loan.id];
  const currentDebt = loanInfo?.loanDebt ?? loan.balance;
  const initialDebt = loanInfo?.loanInitialDebt ?? loan.balance;
  const appliedCount = loanInfo?.appliedCount ?? 0;
  const interestEstimate = estimateLoanInterest(loan, currentDebt);
  const progress = calcLoanProgress(loan, appliedCount);
  const loanIcon = getLoanTypeIcon(loan.loanType);
  const loanLabel = getLoanTypeLabel(loan.loanType);
  const isPaidOff = currentDebt <= 0;
  const payerAcc = loan.paymentAccountId
    ? accounts.find((a) => a.id === loan.paymentAccountId)
    : null;

  const amortizations = loan.amortizations ?? [];
  const totalAmortized = amortizations.reduce((s, a) => s + a.amount, 0);
  const totalFees = amortizations.reduce((s, a) => s + a.fee, 0);
  const totalInterestSaved = amortizations.reduce(
    (s, a) => s + (a.interestSavedEstimate ?? 0),
    0
  );

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* ── Botón volver ── */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.85rem',
          borderRadius: '0.65rem',
          border: `1px solid ${T.cardBorder}`,
          background: T.cardBg,
          color: T.muted,
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={14} /> Volver a Cuentas
      </button>

      {/* ── Header tipo préstamo ── */}
      <Card T={T} style={{ overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div
          style={{
            background:
              'linear-gradient(135deg, #14532d 0%, #166534 60%, #14532d 100%)',
            padding: '1.5rem 1.75rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-2rem',
              right: '-2rem',
              width: '8rem',
              height: '8rem',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: '2rem' }}>{loanIcon}</span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {loan.institution && (
                    <>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#86efac',
                        }}
                      >
                        <InstitutionLogo
                          name={loan.institution}
                          size={14}
                          color="86efac"
                        />
                        {loan.institution}
                      </span>
                      <span style={{ color: '#64748b', fontWeight: 400 }}>
                        —
                      </span>
                    </>
                  )}
                  <span>{loan.name}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: '#86efac',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '0.25rem',
                  }}
                >
                  {loanLabel} · {currency}
                  {loan.interestType &&
                    ` · ${
                      loan.interestType === 'fixed'
                        ? 'Tipo fijo'
                        : 'Tipo variable'
                    }`}
                  {loan.interestRate ? ` · ${loan.interestRate}%` : ''}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => onEdit(loan)}
                title="Editar"
                style={iconBtnStyle}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(loan.id)}
                title="Eliminar"
                style={{ ...iconBtnStyle, color: '#f87171' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Capital pendiente destacado */}
          <div style={{ textAlign: 'right', marginTop: '1.25rem' }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#86efac',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.3rem',
              }}
            >
              Capital pendiente
            </div>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: isPaidOff ? '#4ade80' : '#fef3c7',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {fmtAccount(currentDebt, currency)}
            </div>
            {!isPaidOff && initialDebt !== currentDebt && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#86efac',
                  marginTop: '0.4rem',
                }}
              >
                Inicial: {fmtAccount(initialDebt, currency)} · Pagado:{' '}
                {fmtAccount(initialDebt - currentDebt, currency)} (
                {Math.round(progress.paidPct)}%)
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          {!isPaidOff && (
            <button
              onClick={() => onAmortize(loan.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.1rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: T.green,
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              💸 Nueva amortización
            </button>
          )}
          <SecondaryBtn
            onClick={() => {
              setRealAccountFilter(loan.id);
              setRealReturnTo({ label: `Detalle de ${loan.name}`, tab: 'accounts', loanId: loan.id });
              setTab('real');
            }}
            T={T}
          >
            <Receipt size={14} /> Ver movimientos
          </SecondaryBtn>
        </div>
      </Card>

      {/* ── KPIs ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <KpiCard
          T={T}
          label="Cuota mensual"
          value={
            loan.monthlyPayment != null
              ? fmtAccount(loan.monthlyPayment, currency)
              : '—'
          }
          color={T.title}
        />
        <KpiCard
          T={T}
          label="Cuotas restantes"
          value={
            progress.monthsToFinish != null
              ? String(progress.monthsToFinish)
              : '—'
          }
          color={T.title}
          sub={
            progress.estimatedEndDate
              ? `hasta ~${progress.estimatedEndDate}`
              : undefined
          }
        />
        <KpiCard
          T={T}
          label="Total amortizado"
          value={fmtAccount(totalAmortized, currency)}
          color={T.green}
          sub={`${amortizations.length} ${
            amortizations.length === 1 ? 'amortización' : 'amortizaciones'
          }`}
        />
        <KpiCard
          T={T}
          label="Ahorro estimado"
          value={fmtAccount(totalInterestSaved, currency)}
          color={T.green}
          sub={
            totalFees > 0
              ? `(comisiones: ${fmtAccount(totalFees, currency)})`
              : 'en intereses'
          }
        />
      </div>

      {/* ── Estimación intereses ── */}
      {interestEstimate.hasEnoughData && !isPaidOff && (
        <Card
          T={T}
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            background: T.accentLight,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <div
            style={{ fontSize: '0.78rem', color: T.accent, lineHeight: 1.6 }}
          >
            💡 De tu cuota de{' '}
            <strong>{fmtAccount(loan.monthlyPayment ?? 0, currency)}</strong>:
            <div
              style={{
                marginTop: '0.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <span>
                ↘ Capital:{' '}
                <strong>
                  {fmtAccount(interestEstimate.monthlyPrincipal, currency)}
                </strong>
              </span>
              <span>
                ↗ Intereses:{' '}
                <strong>
                  {fmtAccount(interestEstimate.monthlyInterest, currency)}
                </strong>
              </span>
            </div>
            {payerAcc && (
              <div
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.85,
                  marginTop: '0.5rem',
                }}
              >
                🏦 Se cobra desde <strong>{payerAcc.name}</strong>
                {loan.paymentDay && ` el día ${loan.paymentDay} de cada mes`}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Gráfica de evolución ── */}
      {amortizations.length > 0 && (
        <Card
          T={T}
          style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: T.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <TrendingDown size={13} /> Evolución del capital pendiente
          </div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: T.title,
              marginBottom: '1rem',
            }}
          >
            Impacto acumulado de tus amortizaciones
          </div>
          <DebtEvolutionChart
            loan={loan}
            initialDebt={initialDebt}
            currentDebt={currentDebt}
            T={T}
            currency={currency}
            fmt={fmtAccount}
          />
        </Card>
      )}

      {/* ── Histórico (siempre expandido) ── */}
      {amortizations.length > 0 ? (
        <AmortizationHistory loan={loan} alwaysExpanded onUndo={onUndoAmortization} />
        ) : (
        <Card T={T} style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: T.title,
              marginBottom: '0.3rem',
            }}
          >
            Sin amortizaciones todavía
          </div>
          <div style={{ fontSize: '0.78rem', color: T.muted }}>
            Cuando apliques una amortización parcial aparecerá aquí su detalle.
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  padding: '0.4rem',
  borderRadius: '0.5rem',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

function KpiCard({
  T,
  label,
  value,
  color,
  sub,
}: {
  T: any;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: '0.95rem 1.1rem',
        borderRadius: '0.875rem',
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
      }}
    >
      <div
        style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: T.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{ fontSize: '0.65rem', color: T.muted, marginTop: '0.2rem' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Gráfica SVG: evolución del capital pendiente ─────────────────────────────
// Línea que parte del capital inicial y baja en cada amortización (saltos
// verticales). Visualiza el impacto de las amortizaciones, no el calendario.

interface ChartProps {
  loan: Account;
  initialDebt: number;
  currentDebt: number;
  T: any;
  currency: string;
  fmt: (n: number, c: string) => string;
}

function DebtEvolutionChart({
  loan,
  initialDebt,
  currentDebt,
  T,
  currency,
  fmt,
}: ChartProps) {
  const width = 700;
  const height = 180;
  const padX = 50;
  const padY = 25;

  const amortizations = [...(loan.amortizations ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Puntos: inicial → tras cada amortización → actual
  let runningDebt = initialDebt;
  const points: Array<{
    idx: number;
    date: string;
    debt: number;
    isAmort: boolean;
    amount?: number;
  }> = [{ idx: 0, date: loan.date, debt: initialDebt, isAmort: false }];
  amortizations.forEach((a, i) => {
    runningDebt = Math.max(0, runningDebt - a.amount);
    points.push({
      idx: i + 1,
      date: a.date,
      debt: runningDebt,
      isAmort: true,
      amount: a.amount,
    });
  });
  // Punto final con la deuda real actual (puede diferir si hubo cuotas ordinarias entre medias)
  if (Math.abs(currentDebt - runningDebt) > 0.01) {
    points.push({
      idx: points.length,
      date: 'hoy',
      debt: currentDebt,
      isAmort: false,
    });
  }

  const maxDebt = Math.max(initialDebt, 1);
  const xScale = (i: number) =>
    padX + (i / Math.max(points.length - 1, 1)) * (width - padX * 2);
  const yScale = (d: number) => padY + (1 - d / maxDebt) * (height - padY * 2);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.debt)}`)
    .join(' ');
  const areaD = `${pathD} L ${xScale(points.length - 1)} ${
    height - padY
  } L ${xScale(0)} ${height - padY} Z`;

  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {/* Cuadrícula */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={width - padX}
            y1={padY + p * (height - padY * 2)}
            y2={padY + p * (height - padY * 2)}
            stroke={T.cardBorder}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ))}

        {/* Etiquetas Y */}
        <text
          x={padX - 6}
          y={yScale(maxDebt) + 4}
          fontSize="9"
          fill={T.muted}
          textAnchor="end"
        >
          {fmt(maxDebt, currency)}
        </text>
        <text
          x={padX - 6}
          y={yScale(0) + 4}
          fontSize="9"
          fill={T.muted}
          textAnchor="end"
        >
          0
        </text>

        {/* Área */}
        <path d={areaD} fill={T.green + '22'} />

        {/* Línea */}
        <path
          d={pathD}
          fill="none"
          stroke={T.green}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos de amortización */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(p.debt)}
              r={p.isAmort ? 5 : 4}
              fill={p.isAmort ? T.green : i === 0 ? '#94a3b8' : T.accent}
              stroke="#fff"
              strokeWidth="2"
            >
              <title>
                {p.isAmort
                  ? `Amortización ${p.date}: −${fmt(
                      p.amount ?? 0,
                      currency
                    )} → ${fmt(p.debt, currency)}`
                  : i === 0
                  ? `Inicial: ${fmt(p.debt, currency)}`
                  : `Actual: ${fmt(p.debt, currency)}`}
              </title>
            </circle>
          </g>
        ))}
      </svg>

      {/* Leyenda */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          fontSize: '0.65rem',
          color: T.muted,
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span
            style={{
              width: '0.6rem',
              height: '0.6rem',
              borderRadius: '50%',
              background: '#94a3b8',
              display: 'inline-block',
            }}
          />{' '}
          Inicial
          <span
            style={{
              width: '0.6rem',
              height: '0.6rem',
              borderRadius: '50%',
              background: T.green,
              display: 'inline-block',
              marginLeft: '0.6rem',
            }}
          />{' '}
          Amortización
          <span
            style={{
              width: '0.6rem',
              height: '0.6rem',
              borderRadius: '50%',
              background: T.accent,
              display: 'inline-block',
              marginLeft: '0.6rem',
            }}
          />{' '}
          Actual
        </span>
        <span>Pasa el ratón sobre cada punto para ver el detalle</span>
      </div>
    </div>
  );
}
