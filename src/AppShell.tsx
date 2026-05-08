import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Wallet,
  Tag,
  TrendingUp,
  CalendarRange,
  Trash2,
  X,
  AlertTriangle,
  ChevronDown,
  Settings,
  Moon,
  Sun,
  Shield,
  Receipt,
  BarChart2,
  LineChart as LineChartIcon,
  Target,
  FileText,
  ArrowLeftRight,
  Archive,
  HelpCircle,
} from 'lucide-react';
import { CURRENCIES } from './utils';
import { Modal, ConfirmModal, Field, Sel } from './components/UI';
import { useApp } from './AppContext';
import { useSecurityContext } from './SecurityContext';
import { useToast } from './contexts/ToastContext';
import { BackupPanel } from './BackupPanel';
import { Reports } from './Reports';
import { CalendarView } from './CalendarView';
import { Forecast } from './views/Forecast';
import { TrendsView } from './views/TrendsView';
import { AlertsPanel } from './views/AlertsPanel';
import { Categories } from './views/Categories';
import { Goals } from './views/Goals';
import { Accounts } from './views/Accounts';
import { Projections } from './views/Projections';
import { RealExpenses } from './views/RealExpenses';
import { Transfers } from './views/Transfers';
import { Dashboard } from './views/Dashboard';
import { TrialBanner } from './LicenseScreens';
import { WelcomeTour } from './WelcomeTour';
import { HelpCenter } from './HelpCenter';
import { Onboarding } from './views/Onboarding';
import { SecuritySetup } from './views/SecuritySetup';
import { LockScreen } from './views/LockScreen';
import { SecuritySettingsPanel } from './views/SecuritySettingsPanel';
import { LegalFooter } from './views/Legal';
import { BackupReminderBanner } from './components/BackupReminderBanner';
import { ExitModal } from './components/ExitModal';
import { RatesBanner } from './components/RatesBanner';
import { RatesStatusBar, RatesTable, FullRatesTable } from './components/RatesWidgets';
import { CoachMarksTour, isTourDone, resetTour } from './components/CoachMarksTour';


// ─── Constantes ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'accounts', label: 'Cuentas', icon: Wallet },
  { id: 'real', label: 'Movimientos', icon: Receipt },
  { id: 'transfers', label: 'Transferencias', icon: ArrowLeftRight },
  { id: 'projections', label: 'Proyecciones', icon: BarChart2 },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'calendar', label: 'Calendario', icon: CalendarRange },
  { id: 'forecast', label: 'Previsión', icon: LineChartIcon },
  { id: 'trends', label: 'Tendencias', icon: TrendingUp },
  { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
  { id: 'reports', label: 'Informes', icon: FileText },
];

const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/AAAA', example: '25/12/2024' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/AAAA', example: '12/25/2024' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-DD', example: '2024-12-25' },
];

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell() {
  const {
    T,
    dark,
    setDark,
    baseCurrency,
    setBaseCurrency,
    displayCurrency,
    setDisplayCurrency,
    dateFormat,
    setDateFormat,
    showCurrency,
    setShowCurrency,
    ratesOutdated,
    ratesStatus,   // ✅ FIX 16
    ratesAgeText,  // ✅ FIX 16
    refreshRates,  // ✅ FIX 16
    tab,
    setTab,
    accounts,
    categories,
    projections,
    forecastAll,
    forecastByAccount,
    accountWarnings,
    stats,
    onboarded,
    setOnboarded,
    setAccounts,
    setCategories,
    setProjections,
    resetApp,
    tourCompleted,
    setTourCompleted,
    tourIsFirstTime,
    setTourIsFirstTime,
    realExpenses,
    setRealExpenses,
    goals,
    computedAlerts,
    setCategoryRules,
    showRecurringWarnings,
    setShowRecurringWarnings,
    recurringDuplicateWarnings,
    setRecurringDuplicateWarnings,
    createBackup,
    downloadBackup,
    backupHistory,
    setBackupHistory,
    setGoals,
    setBankFormats,
  } = useApp();

  const { isLocked, isConfigured, lock, clearSecurity } = useSecurityContext();
  const toast = useToast();

  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSelections, setResetSelections] = useState({
    realExpenses: false,
    projections: false,
    accounts: false,
    categories: false,
    goals: false,
    categoryRules: false,
    bankFormats: false,
  });
  const [resetDownloadBackup, setResetDownloadBackup] = useState(false);
  const [showFullRates, setShowFullRates] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openHelpSection, setOpenHelpSection] = useState('home');
  const [helpNavigatedAway, setHelpNavigatedAway] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTour, setShowTour]           = useState(false);
  const [pendingBaseCurrency, setPendingBaseCurrency] = useState<string | null>(null);
    const pendingFullReset = useRef(false);

  useEffect(() => {
    if (onboarded && !isConfigured) {
      const shouldOpen = localStorage.getItem('fh_open_security');
      if (shouldOpen === 'true') {
        localStorage.removeItem('fh_open_security');
        setShowSecuritySetup(true);
      }
    }
  }, [onboarded, isConfigured]);

  // ℹ️ El onboarding ya no abre la guía automáticamente.
  // SetupProgress en el Dashboard guía al usuario paso a paso.

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!onboarded || accounts.length === 0) return;
      const lastDownload = backupHistory[0]?.timestamp ?? 0;
      const daysSince =
        lastDownload > 0
          ? Math.floor((Date.now() - lastDownload) / (1000 * 60 * 60 * 24))
          : 999;
      if (daysSince >= 7) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [onboarded, accounts.length, backupHistory]);

    // ── CoachMarksTour — mostrar una vez tras el primer acceso ──
    useEffect(() => {
      if (!onboarded) return;
      if (isTourDone()) return;
      const t = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(t);
    }, [onboarded]);
  
  useEffect(() => {
    if (!showReset && pendingFullReset.current) {
      pendingFullReset.current = false;
      // Ciclo de vida principal
      localStorage.removeItem('fh_tour_completed');
      localStorage.removeItem('fh_tour_first_time');
      localStorage.removeItem('fh_onboarded');
      // SetupProgress — guía de primeros pasos
      localStorage.removeItem('fh_setup_dismissed');
      localStorage.removeItem('fh_setup_celebrated');
      localStorage.removeItem('fh_setup_first_seen');
      // Sesión y backup automático
      localStorage.removeItem('fh_first_session_done');
      localStorage.removeItem('fh_auto_backup_done');
      localStorage.removeItem('fh_last_auto_backup_session');
      localStorage.removeItem('fh_backup_reminder_dismissed');
      localStorage.removeItem('fh_onboarded_at'); 
      localStorage.removeItem('fh_setup_highlight'); 
      localStorage.removeItem('fh_gs_visited');
      resetTour();
      setOnboarded(false);
      setTourCompleted(false);
      setTourIsFirstTime(true); 
      clearSecurity();
    }
  }, [showReset]);

  const handleSelectiveReset = () => {
    const entry = createBackup('Copia previa al borrado selectivo');
    if (resetDownloadBackup) downloadBackup(entry);
    if (resetSelections.realExpenses) setRealExpenses([]);
    if (resetSelections.projections) setProjections([]);
    if (resetSelections.accounts) {
      setAccounts([]);
      if (!resetSelections.realExpenses) setRealExpenses([]);
      if (!resetSelections.projections) setProjections([]);
      if (!resetSelections.goals)
        setGoals((prev: any[]) => prev.filter((g) => g.mode === 'manual'));
    }
    if (resetSelections.categories) setCategories([]);
    if (resetSelections.goals) setGoals([]);
    if (resetSelections.categoryRules) setCategoryRules([]);
    if (resetSelections.bankFormats) setBankFormats([]);

    const fullReset = Object.values(resetSelections).every(Boolean);
    if (fullReset) pendingFullReset.current = true;

    setResetDownloadBackup(false);
    setResetSelections({
      realExpenses: false,
      projections: false,
      accounts: false,
      categories: false,
      goals: false,
      categoryRules: false,
      bankFormats: false,
    });
    setShowReset(false);
  };

  const handleOnboardingFinish = ({
    accounts,
    categories,
    projections,
    realExpenses,
    categoryRules,
    baseCurrency: selectedBase,
    dateFormat: selectedDateFmt,
  }: any) => {
    setAccounts(accounts);
    setCategories(categories);
    setProjections(projections);
    if (realExpenses) setRealExpenses(realExpenses);
    if (categoryRules) setCategoryRules(categoryRules);
    if (selectedBase) {
      setBaseCurrency(selectedBase);
      setDisplayCurrency(selectedBase);
    }
    if (selectedDateFmt) setDateFormat(selectedDateFmt);
    setOnboarded(true);
  };

  // ── Pantallas especiales ───────────────────────────────────────────────────
  if (!tourCompleted) {
    return (
      <WelcomeTour
        isFirstTime={tourIsFirstTime}
        onComplete={() => {
          setTourCompleted(true);
          setTourIsFirstTime(false);
        }}
      />
    );
  }
  if (!onboarded) return <Onboarding onFinish={handleOnboardingFinish} />;
  if (showSecuritySetup)
    return (
      <SecuritySetup
        onComplete={() => {
          setShowSecuritySetup(false);
          localStorage.setItem('fh_setup_highlight', 'true');
          setTab('dashboard');
        }}
        onCancel={() => setShowSecuritySetup(false)}
      />
    );
  if (isLocked && isConfigured) return <LockScreen />;

  // ── App normal ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: T.pageBg,
        fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: T.headerBg,
          borderBottom: `1px solid ${T.headerBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0 0.75rem',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                }}
              >
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: T.headerText,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  FinanzasHogar
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: T.headerText,
                    marginTop: '0.2rem',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                  }}
                >
                  BANCA PERSONAL
                </div>
              </div>
            </div>

            {/* Botones cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isConfigured ? (
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    data-coachmark="cm-security"
                    onClick={() => setShowSecuritySettings(true)}
                    aria-label="Ajustes de seguridad"
                    title="Ajustes de seguridad"
                    className="fh-btn"
                    style={{ background: 'rgba(59,130,246,0.2)' }}
                  >
                    <Settings size={16} color="#3b82f6" />
                  </button>
                  <button
                    onClick={lock}
                    aria-label="Bloquear aplicación"
                    title="Bloquear aplicación"
                    className="fh-btn"
                    style={{ background: 'rgba(34,197,94,0.2)' }}
                  >
                    <Shield size={16} color="#22c55e" />
                  </button>
                </div>
              ) : (
                <button
                data-coachmark="cm-security"
                onClick={() => setShowSecuritySetup(true)}
                  aria-label="Configurar seguridad"
                  title="Configurar seguridad"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(251,191,36,0.5)',
                    background: 'rgba(251,191,36,0.15)',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Shield size={14} color="#fbbf24" /> Activar seguridad
                </button>
              )}
              <button
                data-coachmark="cm-backup"
                onClick={() => setShowBackup(true)}
                aria-label="Copias de seguridad"
                title="Copias de seguridad"
                className="fh-btn"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              >
                <Archive size={16} color="#8b5cf6" />
              </button>
              <button
                data-coachmark="cm-reset"
                onClick={() => setShowReset(true)}
                aria-label="Resetear aplicación"
                title="Resetear aplicación"
                className="fh-btn"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
              <button
                data-coachmark="cm-darkmode"
                onClick={() => setDark(!dark)}
                aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
                className="fh-btn"
                style={{ background: dark ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)' }}
              >
                {dark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
              </button>
              <button
                data-coachmark="cm-categories"
                onClick={() => setTab('categories')}
                aria-label="Categorías"
                title="Gestionar categorías"
                className="fh-btn"
                style={{
                  background: tab === 'categories'
                    ? 'rgba(20,184,166,0.4)'
                    : 'rgba(20,184,166,0.2)',
                }}
              >
                <Tag size={16} color="#14b8a6" />
              </button>
              <button
                data-coachmark="cm-help"
                onClick={() => { setOpenHelpSection('home'); setShowHelp(true); }}
                aria-label="Centro de ayuda"
                title="Centro de ayuda"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(168,85,247,0.2)',
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={16} color="#a855f7" />
              </button>
              <button
                data-coachmark="cm-exit"
                onClick={() => setShowExitModal(true)}
                aria-label="Salir de la aplicación"
                title="Salir de la aplicación"
                className="fh-btn"
                style={{ background: 'rgba(100,116,139,0.2)' }}
              >
                <X size={16} color="#64748b" />
              </button>
              <button
                data-coachmark="cm-currency"
                onClick={() => setShowCurrency(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.875rem',
                  borderRadius: '0.625rem',
                  border: `1px solid ${ratesOutdated ? T.amber + '66' : T.headerBorder}`,
                  background: ratesOutdated ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.05)',
                  color: T.headerText,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeftRight size={14} color={ratesOutdated ? T.amber : T.headerMuted} />
                <span style={{ color: T.headerMuted, fontSize: '0.72rem' }}>{baseCurrency}</span>
                <span style={{ color: T.headerMuted, opacity: 0.4 }}>→</span>
                <span style={{ color: T.headerText }}>{displayCurrency}</span>
                {ratesOutdated && (
                  <span
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: T.amber,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                )}
                <ChevronDown size={14} color={T.headerMuted} />
              </button>
            </div>
          </div>

          {/* Navegación */}
          <nav
            style={{
              display: 'flex',
              marginTop: '0.25rem',
              overflowX: 'hidden',
              gap: '0',
            }}
          >
            {TABS.map((tab_) => {
              const Icon = tab_.icon;
              const active = tab === tab_.id;
              const REQUIRES_ACCOUNT = ['real', 'transfers', 'projections', 'goals'];
              const isBlocked = REQUIRES_ACCOUNT.includes(tab_.id) && accounts.length === 0;
              return (
                <button
                  key={tab_.id}
                  onClick={() => {
                    if (isBlocked) {
                      toast(`Crea primero una cuenta para acceder a "${tab_.label}"`, 'warning');
                      return;
                    }
                    setTab(tab_.id);
                  }}
                  title={isBlocked ? 'Necesitas crear una cuenta primero' : tab_.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.75rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: active ? 700 : 500,
                    color: isBlocked
                      ? 'rgba(148,163,184,0.55)'
                      : active
                      ? T.navActive
                      : T.navInactive,
                    border: 'none',
                    background: 'transparent',
                    cursor: isBlocked ? 'not-allowed' : 'pointer',
                    borderBottom: active ? `2px solid ${T.navActive}` : '2px solid transparent',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} style={{ opacity: isBlocked ? 0.5 : 1 }} />
                  {tab_.label}
                  {isBlocked && (
                    <span
                      style={{
                        fontSize: '0.55rem',
                        background: 'rgba(148,163,184,0.2)',
                        border: '1px solid rgba(148,163,184,0.3)',
                        borderRadius: '9999px',
                        padding: '0.05rem 0.35rem',
                        color: 'rgba(148,163,184,0.7)',
                        fontWeight: 700,
                      }}
                    >
                      🔒
                    </span>
                  )}
                  {!isBlocked && tab_.id === 'accounts' && accounts.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                      }}
                    >
                      {accounts.length}
                    </span>
                  )}
                  {!isBlocked && tab_.id === 'projections' && projections.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                      }}
                    >
                      {projections.length}
                    </span>
                  )}
                  {!isBlocked && tab_.id === 'real' && realExpenses.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                      }}
                    >
                      {realExpenses.length}
                    </span>
                  )}
                  {!isBlocked && tab_.id === 'goals' && goals.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: active ? '#ffffff' : '#bbf7d0',
                        color: active ? T.navActive : '#15803d',
                      }}
                    >
                      {goals.length}
                    </span>
                  )}
                  {!isBlocked && tab_.id === 'alerts' && computedAlerts.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '9999px',
                        background: computedAlerts.some((a) => a.severity === 'critical')
                          ? '#dc2626'
                          : computedAlerts.some((a) => a.severity === 'warning')
                          ? '#d97706'
                          : '#16a34a',
                        color: '#ffffff',
                        animation: computedAlerts.some((a) => a.severity === 'critical')
                          ? 'warnPulse 2s ease-in-out infinite'
                          : 'none',
                      }}
                    >
                      {computedAlerts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2.5rem 2rem',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          transition: 'padding-right 0.3s ease',
          paddingRight:
            showHelp && helpNavigatedAway && window.innerWidth >= 768
              ? '36rem'
              : '2rem',
          paddingBottom:
            showHelp && helpNavigatedAway && window.innerWidth < 768
              ? '48vh'
              : undefined,
        }}
      >
        <TrialBanner />
        <BackupReminderBanner onOpenBackup={() => setShowBackup(true)} />

        {/* ✅ FIX 16 — Banner de tipos de cambio desactualizados */}
        <RatesBanner
          ratesStatus={ratesStatus}
          ratesAgeText={ratesAgeText}
          onRefresh={refreshRates}
          T={T}
        />

        <div key={tab} style={{ animation: 'fadeSlideIn 0.25s ease both' }}>
          {tab === 'accounts'    && <Accounts />}
          {tab === 'projections' && <Projections />}
          {tab === 'calendar'    && <CalendarView />}
          {tab === 'dashboard'   && <Dashboard />}
          {tab === 'forecast'    && <Forecast />}
          {tab === 'categories'  && <Categories />}
          {tab === 'real'        && <RealExpenses />}
          {tab === 'transfers'   && <Transfers />}
          {tab === 'goals'       && <Goals />}
          {tab === 'alerts'      && <AlertsPanel />}
          {tab === 'trends'      && <TrendsView />}
          {tab === 'reports'     && <Reports />}
        </div>
      </main>

      {/* ── Modales ── */}
      {showCurrency && (
        <Modal
          title="Configuración de divisas"
          subtitle="Define tu divisa base y cómo visualizas los importes"
          onClose={() => setShowCurrency(false)}
          T={T}
        >
          <RatesStatusBar T={T} />
          <Field label="💾 Divisa base">
            <Sel
              T={T}
              value={baseCurrency}
              onChange={(e: any) => {
                const next = e.target.value;
                if (accounts.length > 0 && next !== baseCurrency)
                  setPendingBaseCurrency(next);
                else setBaseCurrency(next);
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={`base-${c.code}`} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </Sel>
            <p style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.5rem', lineHeight: 1.5 }}>
              Moneda en la que introduces tus datos. Cámbiala solo si empiezas desde cero.
            </p>
          </Field>
          <div style={{ height: '1px', background: T.cardBorder, margin: '0.25rem 0 1.25rem' }} />
          <Field label="👁️ Divisa de visualización">
            <Sel
              T={T}
              value={displayCurrency}
              onChange={(e: any) => setDisplayCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={`display-${c.code}`} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </Sel>
            <p style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.5rem', lineHeight: 1.5 }}>
              Todos los importes se mostrarán convertidos a esta moneda.
            </p>
          </Field>
          <div style={{ height: '1px', background: T.cardBorder, margin: '0.25rem 0 1.25rem' }} />
          <Field label="📅 Formato de fecha">
            <Sel
              T={T}
              value={dateFormat}
              onChange={(e: any) => setDateFormat(e.target.value)}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label} — ej: {f.example}
                </option>
              ))}
            </Sel>
            <p style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.5rem', lineHeight: 1.5 }}>
              Elige cómo se muestran las fechas en toda la aplicación.
            </p>
          </Field>
          <button
            onClick={() => setShowFullRates(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.65rem',
              borderRadius: '0.75rem',
              border: `1.5px solid ${T.cardBorder}`,
              background: T.btnSecBg,
              color: T.btnSecText,
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '0.75rem',
            }}
          >
            📊 Ver tabla completa de tipos de cambio
          </button>
          <RatesTable />
          {pendingBaseCurrency && (
            <ConfirmModal
              T={T}
              danger={false}
              title="¿Cambiar divisa base?"
              message={`Vas a cambiar la divisa base de ${baseCurrency} a ${pendingBaseCurrency}. Esto afectará a cómo se interpretan los saldos de tus cuentas existentes. ¿Continuar?`}
              onConfirm={() => { setBaseCurrency(pendingBaseCurrency); setPendingBaseCurrency(null); }}
              onCancel={() => setPendingBaseCurrency(null)}
            />
          )}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background: T.pageBg,
              border: `1px solid ${T.cardBorder}`,
              fontSize: '0.72rem',
              color: T.muted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: T.body }}>⚠️ Aviso importante</strong>
            <br />
            Los tipos de cambio se obtienen de <strong>Frankfurter API</strong>{' '}
            y <strong>ExchangeRate-API</strong>. Las conversiones son{' '}
            <strong>meramente orientativas</strong>.
          </div>
        </Modal>
      )}

      {showFullRates && <FullRatesTable onClose={() => setShowFullRates(false)} />}
      {showBackup && <BackupPanel onClose={() => setShowBackup(false)} />}
      {showSecuritySettings && (
        <SecuritySettingsPanel onClose={() => setShowSecuritySettings(false)} />
      )}

      {/* ── Modal duplicados recurrentes ── */}
      {showRecurringWarnings && recurringDuplicateWarnings.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: T.cardBg,
              border: `1px solid ${T.amberBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '28rem',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: T.amberBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                fontSize: '1.5rem',
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: T.title, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Posibles duplicados detectados
            </h3>
            <p style={{ fontSize: '0.825rem', color: T.muted, lineHeight: 1.6, margin: '0 0 1rem' }}>
              Los siguientes cargos recurrentes no se han aplicado porque ya
              existe un movimiento similar este mes:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {recurringDuplicateWarnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    background: T.amberBg,
                    border: `1px solid ${T.amberBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: T.title }}>
                      🔄 {w.projectionName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: T.amber, marginTop: '0.1rem' }}>
                      {w.monthKey}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 800, color: T.amber, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {w.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    {w.currency}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.875rem',
                background: T.pageBg,
                border: `1px solid ${T.cardBorder}`,
                fontSize: '0.775rem',
                color: T.muted,
                lineHeight: 1.5,
                marginBottom: '1.25rem',
              }}
            >
              💡 Si crees que es un error, revisa tus proyecciones de este mes y
              elimina el posible duplicado manualmente antes de que el sistema
              vuelva a intentarlo el próximo mes.
            </div>
            <button
              onClick={() => { setShowRecurringWarnings(false); setRecurringDuplicateWarnings([]); }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                border: 'none',
                background: T.amber,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de reset ── */}
      {showReset &&
        (() => {
          const allSelected = Object.values(resetSelections).every(Boolean);
          const anySelected = Object.values(resetSelections).some(Boolean);
          const toggleAll = (checked: boolean) =>
            setResetSelections({
              realExpenses: checked,
              projections: checked,
              accounts: checked,
              categories: checked,
              goals: checked,
              categoryRules: checked,
              bankFormats: checked,
            });
          const ITEMS = [
            { key: 'accounts',      label: '🏦 Cuentas bancarias' },
            { key: 'realExpenses',  label: '🧾 Gastos reales' },
            { key: 'projections',   label: '📈 Proyecciones' },
            { key: 'categories',    label: '🏷️ Categorías' },
            { key: 'goals',         label: '🎯 Objetivos de ahorro' },
            { key: 'categoryRules', label: '📋 Reglas de categorización' },
            { key: 'bankFormats',   label: '⚙️ Formatos bancarios personalizados' },
          ];
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  background: T.cardBg,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: '1.5rem',
                  boxShadow: T.cardShadowLg,
                  width: '100%',
                  maxWidth: '30rem',
                  padding: '1.75rem',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: T.redBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Trash2 size={16} color={T.red} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: T.title, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
                  Borrado selectivo de datos
                </h3>
                <p style={{ fontSize: '0.825rem', color: T.muted, lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                  Elige qué datos quieres eliminar. Esta acción{' '}
                  <strong>no se puede deshacer</strong>, pero siempre puedes
                  restaurar desde una copia de seguridad.
                </p>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.875rem',
                    background: allSelected ? T.redBg : T.pageBg,
                    border: `1.5px solid ${allSelected ? T.redBorder : T.cardBorder}`,
                    cursor: 'pointer',
                    marginBottom: '0.625rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: T.red, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: allSelected ? T.red : T.title }}>
                    Seleccionar todo
                  </span>
                </label>
                <div style={{ height: '1px', background: T.cardBorder, margin: '0.625rem 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
                  {ITEMS.map((item) => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 1rem',
                        borderRadius: '0.75rem',
                        background: (resetSelections as any)[item.key] ? T.redBg : T.pageBg,
                        border: `1px solid ${(resetSelections as any)[item.key] ? T.redBorder : T.cardBorder}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={(resetSelections as any)[item.key]}
                        onChange={(e) =>
                          setResetSelections((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                        style={{ width: '1rem', height: '1rem', accentColor: T.red, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: (resetSelections as any)[item.key] ? T.red : T.body }}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.875rem',
                    background: T.accentLight,
                    border: `1px solid ${T.accent}33`,
                    cursor: 'pointer',
                    marginBottom: '1.25rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={resetDownloadBackup}
                    onChange={(e) => setResetDownloadBackup(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: T.accent, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: T.accent, lineHeight: 1.4 }}>
                    💾 Descargar copia de seguridad antes de borrar
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleSelectiveReset}
                    disabled={!anySelected}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: anySelected ? 'pointer' : 'not-allowed',
                      background: anySelected ? T.red : T.cardBorder,
                      color: anySelected ? '#fff' : T.muted,
                      opacity: anySelected ? 1 : 0.6,
                    }}
                  >
                    🗑️ Borrar seleccionado
                  </button>
                  <button
                    onClick={() => {
                      setShowReset(false);
                      setResetSelections({ realExpenses: false, projections: false, accounts: false, categories: false, goals: false, categoryRules: false, bankFormats: false });
                      setResetDownloadBackup(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.7rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${T.btnSecBorder}`,
                      background: T.btnSecBg,
                      color: T.btnSecText,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {showHelp && (
        <HelpCenter
          T={T}
          onClose={() => { setShowHelp(false); setHelpNavigatedAway(false); }}
          onRestartTour={() => { setTourCompleted(false); setTourIsFirstTime(false); }}
          onNavigate={(t: string) => { setTab(t); setShowHelp(false); }}
          onNavigateKeepOpen={(t: string) => { setTab(t); setHelpNavigatedAway(true); }}
          onOpenSecurity={() => { setShowHelp(false); setShowSecuritySetup(true); }}
          onOpenBackup={() => { setShowHelp(false); setShowBackup(true); }}
          onRestartCoachTour={() => { resetTour(); setShowHelp(false); setTimeout(() => setShowTour(true), 400); }}
          initialSection={openHelpSection}
        />
      )}

      {showExitModal && (
        <ExitModal
          T={T}
          backupHistory={backupHistory}
          createBackup={createBackup}
          downloadBackup={downloadBackup}
          onClose={() => setShowExitModal(false)}
        />
      )}
      {showTour && (
        <CoachMarksTour onComplete={() => setShowTour(false)} />
      )}
      <LegalFooter />
    </div>
  );
}
