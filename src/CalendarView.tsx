import { useState, useMemo, useRef } from 'react';
import { useCoachMark, CoachMark } from './components/CoachMark';
import { CalendarRange } from 'lucide-react';
import { useApp } from './AppContext';
import { Card, PrintButton, PrintHeader, PrintFooter } from './components/UI';
import { calcForecast } from './AppProvider';
import { convertAmount, fmt, monthKey, FREQUENCIES } from './utils';

// ─── AnnualCalendarView ───────────────────────────────────────────────────────
function AnnualCalendarView({
  annualData,
  annualYear,
  T,
  onSelectMonth,
  onChangeYear,
  baseCurrency,
  rates,
  coachRef,
}: {
  annualData: any[];
  annualYear: number;
  T: any;
  onSelectMonth: (monthIdx: number) => void;
  onChangeYear: (delta: number) => void;
  baseCurrency: string;
  rates: Record<string, number>;
  coachRef?: React.RefObject<HTMLDivElement>;
})
 {

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* ── Navegación del año ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => onChangeYear(-1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.body,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: T.title }}>
          {annualYear}
        </span>
        <button
          onClick={() => onChangeYear(1)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            border: `1px solid ${T.cardBorder}`,
            background: T.cardBg,
            color: T.body,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          ›
        </button>
      </div>

      {/* ── Leyenda ── */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          color: T.muted,
        }}
      >
        {[
          { color: T.green, label: 'Balance positivo' },
          { color: T.red, label: 'Balance negativo' },
          { color: T.amber, label: 'Balance ajustado' },
          { color: T.cardBorder, label: 'Sin datos' },
        ].map((item) => (
          <span
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.2rem',
                background: item.color,
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* ── Grid de 12 meses ── */}
      <div
        ref={coachRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        {annualData.map((m) => {
          const isCurrentMonth = m.isCurrent;
          const borderColor = isCurrentMonth ? T.accent : T.cardBorder;
          return (
            <div
              key={m.monthIdx}
              onClick={() => onSelectMonth(m.monthIdx)}
              style={{
                borderRadius: '1rem',
                background: T.cardBg,
                border: `2px solid ${borderColor}`,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isCurrentMonth
                  ? `0 0 0 2px ${T.accent}33`
                  : T.cardShadow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = T.cardShadowLg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isCurrentMonth
                  ? `0 0 0 2px ${T.accent}33`
                  : T.cardShadow;
              }}
            >
              <div style={{ height: '0.3rem', background: m.indicatorColor }} />
              <div style={{ padding: '0.875rem 1rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isCurrentMonth ? 800 : 700,
                    color: isCurrentMonth ? T.accent : T.title,
                    marginBottom: '0.625rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {m.label}
                  {isCurrentMonth && (
                    <span
                      style={{
                        marginLeft: '0.375rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: T.accent,
                        color: '#fff',
                        verticalAlign: 'middle',
                      }}
                    >
                      HOY
                    </span>
                  )}
                </div>

                {m.hasRealMovements ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Ingresos</span>
                      <span style={{ color: T.green, fontWeight: 700 }}>
                        +
                        {m.realIncome.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Gastos</span>
                      <span style={{ color: T.red, fontWeight: 700 }}>
                        -
                        {m.realExpense.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                        paddingTop: '0.25rem',
                        borderTop: `1px solid ${T.cardBorder}`,
                        marginTop: '0.1rem',
                      }}
                    >
                      <span style={{ color: T.muted }}>Neto</span>
                      <span style={{ color: m.indicatorColor }}>
                        {m.realNet >= 0 ? '+' : ''}
                        {m.realNet.toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                ) : m.isPast ? (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      fontStyle: 'italic',
                    }}
                  >
                    Sin movimientos
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: T.muted }}>
                      Proyectado:
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: m.netBalance >= 0 ? T.green : T.red,
                      }}
                    >
                      {m.netBalance >= 0 ? '+' : ''}
                      {m.netBalance.toLocaleString('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                )}

                {(m.expiringGoals.length > 0 || m.hasAlert) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {m.expiringGoals.length > 0 && (
                      <span
                        title={`${m.expiringGoals.length} objetivo${
                          m.expiringGoals.length !== 1 ? 's' : ''
                        } que vence${
                          m.expiringGoals.length !== 1 ? 'n' : ''
                        } este mes`}
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.amberBg,
                          color: T.amber,
                          border: `1px solid ${T.amberBorder}`,
                          fontWeight: 700,
                        }}
                      >
                        🎯 {m.expiringGoals.length}
                      </span>
                    )}
                    {m.hasAlert && !m.isPast && (
                      <span
                        title="Balance proyectado negativo"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.375rem',
                          borderRadius: '9999px',
                          background: T.redBg,
                          color: T.red,
                          border: `1px solid ${T.redBorder}`,
                          fontWeight: 700,
                        }}
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Nota ── */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.75rem',
          color: T.muted,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        💡 Haz clic en cualquier mes para ver su detalle en la vista mensual
      </div>
    </div>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
export function CalendarView() {
  const {
    T,
    displayCurrency,
    baseCurrency,
    rates,
    accounts,
    categories,
    projections,
    realExpenses,
    goals,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarView, setCalendarView] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  // ── Coach mark mensual ─────────────────────────────────────────────────────
  const coachRef = useRef<HTMLElement>(null);
  const { seen: coachSeen, markSeen: coachMarkSeen } = useCoachMark('calendar');

  // ── Coach mark anual ───────────────────────────────────────────────────────
  const annualCoachRef = useRef<HTMLDivElement>(null);
  const { seen: annualCoachSeen, markSeen: annualCoachMarkSeen } = useCoachMark('calendar_annual');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Date(year, month).toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getProjectionsForDay = (day: number) => {
    return projections.filter((p) => {
      const start = new Date(p.startDate + 'T00:00:00');
      const end = p.endDate ? new Date(p.endDate + 'T23:59:59') : null;
      const payDay = start.getDate();
      if (payDay !== day) return false;
      if (start > new Date(year, month + 1, 0)) return false;
      if (end && end < new Date(year, month, day)) return false;
      const freq = FREQUENCIES.find((f) => f.value === p.frequency);
      if (!freq) return false;
      const diffMonths =
        (year - start.getFullYear()) * 12 + (month - start.getMonth());
      if (diffMonths < 0) return false;
      if (diffMonths % freq.months !== 0) return false;
      return true;
    });
  };

  const getRealsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    return realExpenses.filter((e) => {
      if (e.valueDate !== dateStr) return false;
      const acc = accounts.find((a) => a.id === e.accountId);
      if (!acc) return false;
      if (e.valueDate <= acc.date) return false;
      return true;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const todayDate = new Date();
  const isToday = (day: number) =>
    day === todayDate.getDate() &&
    month === todayDate.getMonth() &&
    year === todayDate.getFullYear();

  const selectedProjections =
    selectedDay !== null ? getProjectionsForDay(selectedDay) : [];
  const selectedReals = selectedDay !== null ? getRealsForDay(selectedDay) : [];

  const totalIncomeProj = selectedProjections
    .filter((p) => p.type === 'income')
    .reduce((s, p) => s + p.amount, 0);
  const totalExpenseProj = selectedProjections
    .filter((p) => p.type === 'expense')
    .reduce((s, p) => s + p.amount, 0);

  const totalIncomeReal = selectedReals
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );
  const totalExpenseReal = selectedReals
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const allDayProjections = Array.from({ length: daysInMonth }, (_, i) =>
    getProjectionsForDay(i + 1)
  ).flat();

  const monthIncomeProj = allDayProjections
    .filter((p) => p.type === 'income')
    .reduce((s, p) => s + p.amount, 0);
  const monthExpenseProj = allDayProjections
    .filter((p) => p.type === 'expense')
    .reduce((s, p) => s + p.amount, 0);

  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthReals = realExpenses.filter((e) => {
    if (e.valueDate.slice(0, 7) !== currentMonthStr) return false;
    const acc = accounts.find((a) => a.id === e.accountId);
    if (!acc) return false;
    return e.valueDate > acc.date;
  });

  const monthIncomeReal = monthReals
    .filter((e) => e.type === 'income')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );
  const monthExpenseReal = monthReals
    .filter((e) => e.type === 'expense')
    .reduce(
      (s, e) => s + convertAmount(e.amount, e.currency, displayCurrency, rates),
      0
    );

  const annualYear = currentDate.getFullYear();

  const annualData = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthDate = new Date(annualYear, monthIdx, 1);
      const mk = monthKey(monthDate);

      const monthForecast = calcForecast(
        projections,
        accounts,
        'all',
        rates,
        baseCurrency,
        realExpenses
      ).find((m) => m.key === mk);

      const netBalance = monthForecast?.net ?? 0;

      const monthReals = realExpenses.filter((e) => {
        if (e.valueDate.slice(0, 7) !== mk) return false;
        const acc = accounts.find((a) => a.id === e.accountId);
        if (!acc) return false;
        return e.valueDate > acc.date;
      });

      const hasRealMovements = monthReals.length > 0;
      const realIncome = monthReals
        .filter((e) => e.type === 'income')
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );
      const realExpense = monthReals
        .filter((e) => e.type === 'expense')
        .reduce(
          (s, e) =>
            s + convertAmount(e.amount, e.currency, baseCurrency, rates),
          0
        );

      const expiringGoals = goals.filter((g) => {
        if (!g.deadline) return false;
        return g.deadline.slice(0, 7) === mk;
      });

      const hasAlert = netBalance < 0;
      const isPast = mk < monthKey(new Date());
      const isCurrent = mk === monthKey(new Date());

      let indicatorColor: string;
      if (isPast || isCurrent) {
        const realNet = realIncome - realExpense;
        if (!hasRealMovements) {
          indicatorColor = T.cardBorder;
        } else if (realNet > 0) {
          indicatorColor = T.green;
        } else if (realNet < -50) {
          indicatorColor = T.red;
        } else {
          indicatorColor = T.amber;
        }
      } else {
        if (netBalance > 0) {
          indicatorColor = T.green;
        } else if (netBalance < -50) {
          indicatorColor = T.red;
        } else {
          indicatorColor = T.amber;
        }
      }

      return {
        monthIdx,
        monthDate,
        mk,
        label: monthDate.toLocaleDateString('es-ES', { month: 'long' }),
        netBalance,
        realIncome,
        realExpense,
        realNet: realIncome - realExpense,
        hasRealMovements,
        expiringGoals,
        hasAlert,
        indicatorColor,
        isPast,
        isCurrent,
      };
    });
  }, [
    annualYear,
    accounts,
    projections,
    realExpenses,
    goals,
    rates,
    baseCurrency,
  ]);

  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const selectedMonthName = new Date(year, month).toLocaleString('es-ES', {
    month: 'long',
  });

  const printSubtitle =
    calendarView === 'monthly'
      ? `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} · Vista mensual`
      : `Año ${annualYear} · Vista anual`;

  return (
    <div
      className="fh-print-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* ── Cabecera documento (solo impresión) ── */}
      <PrintHeader
        title="Calendario Financiero"
        subtitle={printSubtitle}
      />

      {/* ── Cabecera ── */}
      <div
        className="fh-no-print"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.muted,
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}
          >
            Vista mensual
          </div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: T.title,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Calendario
          </h2>
          <p
            style={{ fontSize: '0.9rem', color: T.muted, marginTop: '0.4rem' }}
          >
            Proyecciones y movimientos reales por día
          </p>
        </div>

        {/* Toggle vista mensual / anual */}
        <div
          className="fh-no-print"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <PrintButton
            T={T}
            documentTitle="Calendario_Financiero"
            sectionTitle="Calendario Financiero"
            subtitle={printSubtitle}
          />
          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              padding: '0.25rem',
              borderRadius: '0.75rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            {(
              [
                ['monthly', '📅 Mensual'],
                ['annual', '📆 Anual'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: calendarView === v ? T.accent : 'transparent',
                  color: calendarView === v ? '#ffffff' : T.muted,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div
          className="fh-no-print"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <button
            onClick={prevMonth}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
              color: T.body,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            ‹
          </button>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: T.title,
              textTransform: 'capitalize',
              minWidth: '12rem',
              textAlign: 'center',
            }}
          >
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.75rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.cardBg,
              color: T.body,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {calendarView === 'annual' && (
        <>
          <AnnualCalendarView
            annualData={annualData}
            annualYear={annualYear}
            T={T}
            onSelectMonth={(monthIdx) => {
              setCurrentDate(new Date(annualYear, monthIdx, 1));
              setCalendarView('monthly');
              setSelectedDay(null);
            }}
            onChangeYear={(delta) => {
              setCurrentDate(new Date(annualYear + delta, 0, 1));
            }}
            baseCurrency={baseCurrency}
            rates={rates}
            coachRef={annualCoachRef}
          />
          {!annualCoachSeen && (
            <CoachMark
              targetRef={annualCoachRef}
              title="Tu año completo de un vistazo"
              description="Verde = balance positivo · Rojo = balance negativo · Ámbar = ajustado. Haz clic en cualquier mes para ver su detalle. Los meses pasados muestran datos reales, los futuros proyecciones."
              ctaLabel="¡Entendido! →"
              onDismiss={annualCoachMarkSeen}
              accentColor="#0891b2"
            />
          )}
        </>
      )}

      {calendarView === 'monthly' && (
        <>
          {/* ── Resumen del mes ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            {/* Ingresos */}
            <div
              style={{
                borderRadius: '1rem',
                background: T.greenBg,
                border: `1px solid ${T.greenBorder}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: T.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Ingresos del mes
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderTop: `1px solid ${T.greenBorder}`,
                }}
              >
                <div
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRight: `1px solid ${T.greenBorder}`,
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.green,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Proyectado
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.green,
                    }}
                  >
                    {fmt(monthIncomeProj, displayCurrency, baseCurrency, rates)}
                  </div>
                </div>
                <div style={{ padding: '0.625rem 1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.green,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Real
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: T.green,
                    }}
                  >
                    {fmt(
                      monthIncomeReal,
                      displayCurrency,
                      displayCurrency,
                      rates
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gastos */}
            <div
              style={{
                borderRadius: '1rem',
                background: T.redBg,
                border: `1px solid ${T.redBorder}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: T.red,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Gastos del mes
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderTop: `1px solid ${T.redBorder}`,
                }}
              >
                <div
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRight: `1px solid ${T.redBorder}`,
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.red,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Proyectado
                  </div>
                  <div
                    style={{ fontSize: '1rem', fontWeight: 800, color: T.red }}
                  >
                    {fmt(
                      monthExpenseProj,
                      displayCurrency,
                      baseCurrency,
                      rates
                    )}
                  </div>
                </div>
                <div style={{ padding: '0.625rem 1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: T.red,
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Real
                  </div>
                  <div
                    style={{ fontSize: '1rem', fontWeight: 800, color: T.red }}
                  >
                    {fmt(
                      monthExpenseReal,
                      displayCurrency,
                      displayCurrency,
                      rates
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance neto */}
            {(() => {
              const netProj = monthIncomeProj - monthExpenseProj;
              const netReal = monthIncomeReal - monthExpenseReal;
              const color = netReal >= 0 ? T.green : T.red;
              const bg = netReal >= 0 ? T.greenBg : T.redBg;
              const border = netReal >= 0 ? T.greenBorder : T.redBorder;
              return (
                <div
                  style={{
                    borderRadius: '1rem',
                    background: bg,
                    border: `1px solid ${border}`,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.06em',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Balance neto
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      borderTop: `1px solid ${border}`,
                    }}
                  >
                    <div
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRight: `1px solid ${border}`,
                        opacity: 0.7,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color,
                          textTransform: 'uppercase' as const,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Proyectado
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color }}>
                        {netProj >= 0 ? '+' : ''}
                        {fmt(netProj, displayCurrency, baseCurrency, rates)}
                      </div>
                    </div>
                    <div style={{ padding: '0.625rem 1.25rem' }}>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color,
                          textTransform: 'uppercase' as const,
                          marginBottom: '0.2rem',
                        }}
                      >
                        Real
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color }}>
                        {netReal >= 0 ? '+' : ''}
                        {fmt(netReal, displayCurrency, displayCurrency, rates)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Calendario + Panel lateral ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 22rem',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Calendario */}
            <Card T={T} ref={coachRef}>
              <div style={{ padding: '1.25rem' }}>
                {/* Días de la semana */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.25rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.25rem',
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Celdas */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.25rem',
                  }}
                >
                  {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const dayProjs = getProjectionsForDay(day);
                      const dayReals = getRealsForDay(day);
                      const hasIncomeProj = dayProjs.some(
                        (p) => p.type === 'income'
                      );
                      const hasExpenseProj = dayProjs.some(
                        (p) => p.type === 'expense'
                      );
                      const hasIncomeReal = dayReals.some(
                        (e) => e.type === 'income'
                      );
                      const hasExpenseReal = dayReals.some(
                        (e) => e.type === 'expense'
                      );
                      const isSelected = selectedDay === day;
                      const isTodayDay = isToday(day);
                      const hasAnything =
                        dayProjs.length > 0 || dayReals.length > 0;

                      return (
                        <div
                          key={day}
                          onClick={() =>
                            hasAnything &&
                            setSelectedDay(isSelected ? null : day)
                          }
                          style={{
                            borderRadius: '0.625rem',
                            padding: '0.4rem 0.25rem',
                            minHeight: '4rem',
                            cursor: hasAnything ? 'pointer' : 'default',
                            background: isSelected
                              ? T.accentLight
                              : isTodayDay
                              ? T.accentLight
                              : T.pageBg,
                            border: isSelected
                              ? `2px solid ${T.accent}`
                              : isTodayDay
                              ? `2px solid ${T.accent}44`
                              : `1px solid ${T.cardBorder}`,
                            transition: 'all 0.15s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: isTodayDay ? 800 : 600,
                              color:
                                isSelected || isTodayDay ? T.accent : T.title,
                            }}
                          >
                            {day}
                          </span>

                          {hasAnything && (
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.15rem',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                              }}
                            >
                              {hasIncomeReal && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: T.green,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Ingreso real"
                                />
                              )}
                              {hasExpenseReal && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: T.red,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Gasto real"
                                />
                              )}
                              {hasIncomeProj && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: `1.5px solid ${T.green}`,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Proyección ingreso"
                                />
                              )}
                              {hasExpenseProj && (
                                <span
                                  style={{
                                    width: '0.45rem',
                                    height: '0.45rem',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: `1.5px solid ${T.red}`,
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                  title="Proyección gasto"
                                />
                              )}
                            </div>
                          )}

                          {hasAnything && (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.1rem',
                                width: '100%',
                              }}
                            >
                              {hasIncomeReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textAlign: 'center',
                                    background: T.greenBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                  }}
                                >
                                  +
                                  {fmt(
                                    dayReals
                                      .filter((e) => e.type === 'income')
                                      .reduce(
                                        (s, e) =>
                                          s +
                                          convertAmount(
                                            e.amount,
                                            e.currency,
                                            displayCurrency,
                                            rates
                                          ),
                                        0
                                      ),
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasExpenseReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textAlign: 'center',
                                    background: T.redBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                  }}
                                >
                                  -
                                  {fmt(
                                    dayReals
                                      .filter((e) => e.type === 'expense')
                                      .reduce(
                                        (s, e) =>
                                          s +
                                          convertAmount(
                                            e.amount,
                                            e.currency,
                                            displayCurrency,
                                            rates
                                          ),
                                        0
                                      ),
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasIncomeProj && !hasIncomeReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 600,
                                    color: T.green,
                                    textAlign: 'center',
                                    background: T.greenBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                    opacity: 0.6,
                                  }}
                                >
                                  +
                                  {fmt(
                                    dayProjs
                                      .filter((p) => p.type === 'income')
                                      .reduce((s, p) => s + p.amount, 0),
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                              {hasExpenseProj && !hasExpenseReal && (
                                <div
                                  style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 600,
                                    color: T.red,
                                    textAlign: 'center',
                                    background: T.redBg,
                                    borderRadius: '0.2rem',
                                    padding: '0.1rem',
                                    opacity: 0.6,
                                  }}
                                >
                                  -
                                  {fmt(
                                    dayProjs
                                      .filter((p) => p.type === 'expense')
                                      .reduce((s, p) => s + p.amount, 0),
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Leyenda */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${T.cardBorder}`,
                    fontSize: '0.72rem',
                    color: T.muted,
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { bg: T.green, border: undefined, label: 'Ingreso real' },
                    { bg: T.red, border: undefined, label: 'Gasto real' },
                    {
                      bg: 'transparent',
                      border: `1.5px solid ${T.green}`,
                      label: 'Proyección ingreso',
                    },
                    {
                      bg: 'transparent',
                      border: `1.5px solid ${T.red}`,
                      label: 'Proyección gasto',
                    },
                  ].map((item) => (
                    <span
                      key={item.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <span
                        style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '50%',
                          background: item.bg,
                          border: item.border,
                          display: 'inline-block',
                        }}
                      />
                      {item.label}
                    </span>
                  ))}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '0.2rem',
                        background: T.accentLight,
                        border: `1px solid ${T.accent}`,
                        display: 'inline-block',
                      }}
                    />
                    Hoy / Seleccionado
                  </span>
                </div>
              </div>
            </Card>

            {/* ── Panel lateral ── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {selectedDay !== null ? (
                <>
                  {/* Cabecera día seleccionado */}
                  <div
                    style={{
                      padding: '0.875rem 1.125rem',
                      borderRadius: '0.875rem',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}33`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Día seleccionado
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: T.accent,
                        letterSpacing: '-0.03em',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedDay} de {selectedMonthName}
                    </div>
                  </div>

                  {/* Movimientos reales */}
                  {selectedReals.length > 0 && (
                    <Card T={T}>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: T.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.625rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              background: T.accent,
                              display: 'inline-block',
                            }}
                          />
                          Movimientos reales
                        </div>

                        {(totalIncomeReal > 0 || totalExpenseReal > 0) && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {totalIncomeReal > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.greenBg,
                                  border: `1px solid ${T.greenBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Ingresos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.green,
                                  }}
                                >
                                  {fmt(
                                    totalIncomeReal,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                            {totalExpenseReal > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.redBg,
                                  border: `1px solid ${T.redBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Gastos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.red,
                                  }}
                                >
                                  {fmt(
                                    totalExpenseReal,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                          }}
                        >
                          {selectedReals.map((e) => {
                            const cat = categories.find(
                              (c) => c.id === e.categoryId
                            );
                            const acc = accounts.find(
                              (a) => a.id === e.accountId
                            );
                            const amountConverted = convertAmount(
                              e.amount,
                              e.currency,
                              displayCurrency,
                              rates
                            );
                            return (
                              <div
                                key={e.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.625rem',
                                  padding: '0.625rem 0.75rem',
                                  borderRadius: '0.625rem',
                                  background: T.pageBg,
                                  border: `1px solid ${T.cardBorder}`,
                                }}
                              >
                                <div
                                  style={{
                                    width: '0.2rem',
                                    alignSelf: 'stretch',
                                    borderRadius: '9999px',
                                    background: cat?.color || T.cardBorder,
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: T.title,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {e.description}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      color: T.muted,
                                    }}
                                  >
                                    {cat?.name ?? '—'} · {acc?.name ?? '—'}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color:
                                      e.type === 'income' ? T.green : T.red,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {e.type === 'income' ? '+' : '-'}
                                  {fmt(
                                    amountConverted,
                                    displayCurrency,
                                    displayCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Proyecciones */}
                  {selectedProjections.length > 0 && (
                    <Card T={T}>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: T.muted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '0.625rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          <span
                            style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              background: 'transparent',
                              border: `1.5px solid ${T.muted}`,
                              display: 'inline-block',
                            }}
                          />
                          Proyecciones
                        </div>

                        {(totalIncomeProj > 0 || totalExpenseProj > 0) && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {totalIncomeProj > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.greenBg,
                                  border: `1px solid ${T.greenBorder}`,
                                  opacity: 0.7,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.green,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Ingresos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.green,
                                  }}
                                >
                                  {fmt(
                                    totalIncomeProj,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                            {totalExpenseProj > 0 && (
                              <div
                                style={{
                                  padding: '0.5rem 0.625rem',
                                  borderRadius: '0.625rem',
                                  background: T.redBg,
                                  border: `1px solid ${T.redBorder}`,
                                  opacity: 0.7,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: T.red,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Gastos
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color: T.red,
                                  }}
                                >
                                  {fmt(
                                    totalExpenseProj,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                          }}
                        >
                          {selectedProjections.map((p) => {
                            const cat = categories.find(
                              (c) => c.id === p.categoryId
                            );
                            const acc = accounts.find(
                              (a) => a.id === p.accountId
                            );
                            return (
                              <div
                                key={p.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.625rem',
                                  padding: '0.625rem 0.75rem',
                                  borderRadius: '0.625rem',
                                  background: T.pageBg,
                                  border: `1px solid ${T.cardBorder}`,
                                  opacity: 0.85,
                                }}
                              >
                                <div
                                  style={{
                                    width: '0.2rem',
                                    alignSelf: 'stretch',
                                    borderRadius: '9999px',
                                    background: cat?.color || T.cardBorder,
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: T.title,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      color: T.muted,
                                    }}
                                  >
                                    {cat?.name ?? '—'} · {acc?.name ?? '—'}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 800,
                                    color:
                                      p.type === 'income' ? T.green : T.red,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {p.type === 'income' ? '+' : '-'}
                                  {fmt(
                                    p.amount,
                                    displayCurrency,
                                    baseCurrency,
                                    rates
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  {selectedReals.length === 0 &&
                    selectedProjections.length === 0 && (
                      <Card T={T}>
                        <div
                          style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: T.muted,
                            fontSize: '0.875rem',
                          }}
                        >
                          No hay movimientos para este día
                        </div>
                      </Card>
                    )}
                </>
              ) : (
                <Card T={T}>
                  <div
                    style={{
                      padding: '2rem 1.25rem',
                      textAlign: 'center',
                      color: T.muted,
                    }}
                  >
                    <CalendarRange
                      size={36}
                      color={T.muted}
                      style={{ margin: '0 auto 0.75rem', opacity: 0.3 }}
                    />
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: T.title,
                        marginBottom: '0.25rem',
                      }}
                    >
                      Selecciona un día
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      Haz clic en cualquier día para ver sus movimientos reales
                      y proyecciones
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
      {/* ── Coach mark — primera visita ── */}
      {!coachSeen && (
        <CoachMark
          targetRef={coachRef}
          title="Tu mes de un vistazo"
          description="● movimiento real · ○ proyectado. Haz clic en cualquier día para ver el detalle. Cambia a vista anual para ver los 12 meses."
          ctaLabel="¡Entendido! →"
          onDismiss={coachMarkSeen}
          accentColor="#0891b2"
        />
        )}

      {/* ── Footer documento (solo impresión) ── */}
      <PrintFooter section="Calendario Financiero" />
      </div>
      );
    }
    