import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

import { useApp } from './AppContext';
import { useToast } from './contexts/ToastContext';

// ─── Tipos locales ────────────────────────────────────────────────────────────
import type {
  BankColumnKey,
  BankFormat,
  CategoryRule,
  ImportRowStatus,
  ImportRow,
  RealExpense,
} from './types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'MXN', symbol: '$' },
  { code: 'COP', symbol: '$' },
  { code: 'ARS', symbol: '$' },
  { code: 'CLP', symbol: '$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'NOK', symbol: 'kr' },
  { code: 'DKK', symbol: 'kr' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'HUF', symbol: 'Ft' },
  { code: 'CZK', symbol: 'Kč' },
  { code: 'RON', symbol: 'lei' },
  { code: 'TRY', symbol: '₺' },
  { code: 'INR', symbol: '₹' },
  { code: 'KRW', symbol: '₩' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'NZD', symbol: 'NZ$' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'AED', symbol: 'د.إ' },
];

const BANK_COLUMN_OPTIONS: { key: BankColumnKey; label: string }[] = [
  { key: 'date', label: 'Fecha apunte' },
  { key: 'valueDate', label: 'Fecha valor' },
  { key: 'description', label: 'Descripción' },
  { key: 'amount', label: 'Importe (+ / -)' },
  { key: 'amountIn', label: 'Importe entrada' },
  { key: 'amountOut', label: 'Importe salida' },
  { key: 'balance', label: 'Saldo (ignorar)' },
  { key: 'currency', label: 'Divisa' },
  { key: 'ignore', label: '— Ignorar —' },
];

const PREDEFINED_BANK_FORMATS: BankFormat[] = [
  {
    id: 'santander',
    name: 'Santander',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 4,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'ignore', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'bbva',
    name: 'BBVA',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'valueDate', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'ing',
    name: 'ING',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'ignore', 'ignore', 'description', 'amount'],
    negativeIsExpense: true,
  },
  {
    id: 'caixabank',
    name: 'CaixaBank',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 2,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'description', 'amount', 'ignore'],
    negativeIsExpense: true,
  },
  {
    id: 'revolut',
    name: 'Revolut',
    isCustom: false,
    separator: ',',
    decimal: '.',
    encoding: 'utf-8',
    skipRows: 1,
    dateFormat: 'yyyy-mm-dd',
    amountMode: 'single',
    columns: [
      'ignore',
      'ignore',
      'date',
      'valueDate',
      'description',
      'amount',
      'ignore',
      'currency',
      'ignore',
      'ignore',
    ],
    negativeIsExpense: true,
    note: 'En Revolut: ve a Perfil → Extractos → exportar como CSV.',
  },
  {
    id: 'bankinter',
    name: 'Bankinter',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 5,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['valueDate', 'date', 'description', 'amount', 'currency'],
    negativeIsExpense: true,
    note: 'Bankinter descarga en .xlsx. Ábrelo en Excel y guárdalo como CSV (separador ;) antes de importar.',
  },
  // ── Tarjetas de crédito ──────────────────────────────────────────────────
  {
    id: 'bankinter_card',
    name: 'Bankinter — Tarjeta Visa/Mastercard',
    isCustom: false,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 6,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'description', 'amount'],
    negativeIsExpense: true,
    note: 'Descarga el detalle de movimientos de la tarjeta desde Bankinter → Tarjetas → Movimientos. Si llega en .xlsx, ábrelo en Excel y guárdalo como CSV (separador ;).',
  },
];

const DEFAULT_CATEGORY_RULES_KEYWORDS: Record<string, string[]> = {
  Alimentación: [
    'mercadona',
    'lidl',
    'carrefour',
    'alcampo',
    'dia ',
    'aldi',
    'eroski',
    'hipercor',
    'consum',
    'supermercado',
  ],
  'Restaurantes / Bares': [
    'restaurante',
    'cafeteria',
    'bar ',
    'mcdonalds',
    'burger',
    'kfc',
    'telepizza',
    'just eat',
    'glovo',
    'uber eats',
  ],
  Transporte: [
    'renfe',
    'metro',
    'bus ',
    'cabify',
    'uber',
    'gasolina',
    'repsol',
    'bp ',
    'cepsa',
    'parking',
    'autopista',
    'peaje',
  ],
  'Salud / Farmacia': [
    'farmacia',
    'doctor',
    'clinica',
    'hospital',
    'medico',
    'dentista',
    'optica',
    'sanitas',
    'adeslas',
  ],
  'Suscripciones digitales': [
    'netflix',
    'spotify',
    'amazon prime',
    'hbo',
    'disney',
    'apple',
    'google',
    'microsoft',
    'adobe',
  ],
  'Vivienda / Alquiler': [
    'alquiler',
    'comunidad',
    'ibi ',
    'hipoteca',
    'seguro hogar',
  ],
  Seguros: [
    'seguro',
    'axa',
    'mapfre',
    'mutua',
    'generali',
    'zurich',
    'allianz',
  ],
  Educación: [
    'universidad',
    'colegio',
    'academia',
    'curso',
    'udemy',
    'coursera',
    'libreria',
  ],
  'Ocio / Entretenimiento': [
    'cinema',
    'cine',
    'teatro',
    'concierto',
    'steam',
    'playstation',
    'xbox',
    'entradas',
  ],
  'Ropa / Moda': [
    'zara',
    'mango',
    'h&m',
    'primark',
    'pull',
    'bershka',
    'stradivarius',
  ],
  'Viajes / Vacaciones': [
    'ryanair',
    'vueling',
    'iberia',
    'booking',
    'airbnb',
    'hotel',
    'expedia',
  ],
  Salario: ['nomina', 'nómina', 'salario', 'sueldo', 'haberes'],
};

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().split('T')[0];

// ─── Helpers de parseo ────────────────────────────────────────────────────────
function parseDate(raw: string, fmt: BankFormat['dateFormat']): string {
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return '';
  try {
    if (fmt === 'dd/mm/yyyy' || fmt === 'dd-mm-yyyy') {
      const sep = s.includes('/') ? '/' : '-';
      const [d, m, y] = s.split(sep);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (fmt === 'dd/mm/yy') {
      const [d, m, y] = s.split('/');
      return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (fmt === 'yyyy-mm-dd') return s.slice(0, 10);
  } catch {}
  return s;
}

function parseAmount(raw: string, decimalSep: ',' | '.'): number {
  if (!raw) return 0;
  let s = raw.trim().replace(/\s/g, '').replace(/[€$£]/g, '');
  if (decimalSep === ',') {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseBankCSV(raw: string, format: BankFormat) {
  const errors: string[] = [];
  const rows: (Omit<
    ImportRow,
    | 'id'
    | 'status'
    | 'duplicateOf'
    | 'categoryId'
    | 'accountId'
    | 'currency'
    | 'notes'
  > & { detectedCurrency?: string })[] = [];

  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Patrones de filas a descartar (resúmenes, totales, subtotales que aparecen
  // al final de muchos extractos: "Total Crédito;;-309,00", "TOTAL;...", etc.)
  const SKIP_ROW_PATTERNS =
    /^(total|subtotal|saldo\s+(final|inicial)|resumen)/i;

  const dataLines = lines.slice(format.skipRows).filter((l) => {
    const trimmed = l.trim();
    if (trimmed.length === 0) return false;
    if (SKIP_ROW_PATTERNS.test(trimmed)) return false;
    return true;
  });

  dataLines.forEach((line, idx) => {
    try {
      const cols = splitCSVLine(line, format.separator);
      if (cols.length < 2) return;

      const get = (key: BankColumnKey): string => {
        const i = format.columns.indexOf(key);
        return i >= 0 ? (cols[i] ?? '').trim() : '';
      };

      const rawDate = get('date') || get('valueDate');
      const rawValDate = get('valueDate') || get('date');
      const rawDesc = get('description');

      let amount = 0;
      if (format.amountMode === 'single') {
        amount = parseAmount(get('amount'), format.decimal);
      } else {
        const amtIn = parseAmount(get('amountIn'), format.decimal);
        const amtOut = parseAmount(get('amountOut'), format.decimal);
        amount = amtIn > 0 ? amtIn : -amtOut;
      }

      if (!rawDate && !rawDesc && amount === 0) return;

      const entryDate = parseDate(rawDate, format.dateFormat) || today();
      const valueDate = parseDate(rawValDate, format.dateFormat) || entryDate;
      const description = rawDesc || `Movimiento ${idx + 1}`;
      const type: 'income' | 'expense' = format.negativeIsExpense
        ? amount >= 0
          ? 'income'
          : 'expense'
        : amount < 0
        ? 'income'
        : 'expense';
      const absAmount = Math.abs(amount);

      if (absAmount === 0) return;

      rows.push({
        entryDate,
        valueDate,
        description,
        amount: absAmount,
        type,
        detectedCurrency: get('currency') || '',
      });
    } catch (e) {
      errors.push(`Línea ${idx + format.skipRows + 1}: ${String(e)}`);
    }
  });

  return { rows, errors };
}

function autoCategorizRow(
  description: string,
  type: 'income' | 'expense',
  categories: any[],
  categoryRules: CategoryRule[]
): string {
  const desc = description.toLowerCase();
  for (const rule of categoryRules) {
    const cat = categories.find((c) => c.id === rule.categoryId);
    if (!cat || cat.type !== type) continue;
    if (rule.keywords.some((kw) => desc.includes(kw.toLowerCase())))
      return rule.categoryId;
  }
  for (const [catName, keywords] of Object.entries(
    DEFAULT_CATEGORY_RULES_KEYWORDS
  )) {
    const cat = categories.find((c) => c.name === catName && c.type === type);
    if (!cat) continue;
    if (keywords.some((kw) => desc.includes(kw.toLowerCase()))) return cat.id;
  }
  return '';
}

function findDuplicate(
  row: { amount: number; valueDate: string; type: 'income' | 'expense' },
  existingExpenses: RealExpense[]
): string | undefined {
  const rowDate = new Date(row.valueDate);
  const match = existingExpenses.find((e) => {
    if (e.type !== row.type) return false;
    if (Math.abs(e.amount - row.amount) > 0.01) return false;
    const eDate = new Date(e.valueDate);
    const diffMs = Math.abs(eDate.getTime() - rowDate.getTime());
    return diffMs / (1000 * 60 * 60 * 24) <= 2;
  });
  return match?.id;
}

function fmtDateDMY(dateStr: string, dateFormat: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return '—';
  switch (dateFormat) {
    case 'mm/dd/yyyy':
      return `${m}/${d}/${y}`;
    case 'yyyy-mm-dd':
      return `${y}-${m}-${d}`;
    case 'dd-mm-yyyy':
      return `${d}-${m}-${y}`;
    default:
      return `${d}/${m}/${y}`;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function BankImportModal({
  onClose,
  defaultAccountId,
}: {
  onClose: () => void;
  defaultAccountId?: string;
}) {
  const {
    T,
    accounts,
    categories,
    realExpenses,
    setRealExpenses,
    baseCurrency,
    bankFormats,
    setBankFormats,
    categoryRules,
    setCategoryRules,
    dateFormat,
  } = useApp();

  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const allFormats: BankFormat[] = [...PREDEFINED_BANK_FORMATS, ...bankFormats];
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    PREDEFINED_BANK_FORMATS[0].id
  );

  const handleSelectFormat = (id: string) => {
    setSelectedFormatId(id);
    setOverrideSkipRows(null);
    setRawCSV('');
  };

  const [showCustomForm, setShowCustomForm] = useState(false);
  const emptyCustomFormat: BankFormat = {
    id: '',
    name: '',
    isCustom: true,
    separator: ';',
    decimal: ',',
    encoding: 'latin1',
    skipRows: 1,
    dateFormat: 'dd/mm/yyyy',
    amountMode: 'single',
    columns: ['date', 'description', 'amount'],
    negativeIsExpense: true,
  };
  const [customForm, setCustomForm] = useState<BankFormat>(emptyCustomFormat);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [confirmDeleteFormat, setConfirmDeleteFormat] = useState<string | null>(
    null
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [rawCSV, setRawCSV] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(
    defaultAccountId ?? accounts[0]?.id ?? ''
  );
  const [overrideSkipRows, setOverrideSkipRows] = useState<number | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [manuallyCategorized, setManuallyCategorized] = useState<Set<string>>(
    new Set()
  );
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [ruleForm, setRuleForm] = useState<{
    categoryId: string;
    keywords: string;
  }>({
    categoryId: '',
    keywords: '',
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Cuando categoryRules cambia, React ejecuta este efecto YA con el valor nuevo.
  // A diferencia de vigilar showRulesEditor, aquí categoryRules nunca es un closure obsoleto.
  // Re-categoriza al cambiar reglas O al cerrar el modal de reglas
  const reApplyRules = (rows: ImportRow[]) =>
    rows.map((row) => {
      if (manuallyCategorized.has(row.id)) return row; // respeta cambios manuales
      const catId = autoCategorizRow(
        row.description,
        row.type,
        categories,
        categoryRules
      );
      return { ...row, categoryId: catId };
    });

  useEffect(() => {
    if (importRows.length === 0) return;
    setImportRows((prev) => reApplyRules(prev));
  }, [categoryRules]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showRulesEditor) return; // solo al cerrar
    if (importRows.length === 0) return;
    setImportRows((prev) => reApplyRules(prev));
  }, [showRulesEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg,
    color: T.inputText,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '0.75rem',
  };
  const selStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const btnPrimary: React.CSSProperties = {
    padding: '0.65rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: T.accent,
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
  };
  const btnSec: React.CSSProperties = {
    padding: '0.65rem 1.25rem',
    borderRadius: '0.75rem',
    border: `1.5px solid ${T.cardBorder}`,
    background: T.btnSecBg,
    color: T.btnSecText,
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
  };

  const BANK_FRIENDLY_NOTES: Record<string, string> = {
    santander:
      'Descarga el extracto desde Banca Online → Mis Cuentas → Exportar',
    bbva: 'Descarga el extracto desde BBVA.es → Cuentas → Descargar movimientos',
    ing: 'Descarga el extracto desde tu Cuenta Nómina → Ver todos los movimientos → Exportar',
    caixabank:
      'Descarga el extracto desde CaixaBankNow → Mis cuentas → Exportar',
    revolut: 'En la app Revolut: Perfil → Extractos → Exportar como CSV',
    bankinter:
      'En Bankinter: Mis cuentas → Exportar movimientos (guarda como CSV)',
    bankinter_card:
      'En Bankinter: Tarjetas → Movimientos → Exportar (si descarga en .xlsx, guárdalo como CSV con separador ;)',
  };

  const generatePreview = () => {
    const format = allFormats.find((f) => f.id === selectedFormatId);
    if (!format || !rawCSV) return;
    const effectiveFormat =
      overrideSkipRows !== null
        ? { ...format, skipRows: overrideSkipRows }
        : format;
    const { rows, errors } = parseBankCSV(rawCSV, effectiveFormat);
    setParseErrors(errors);
    const account = accounts.find((a) => a.id === selectedAccountId);
    const currency = account?.currency ?? baseCurrency;
    const importRowsList: ImportRow[] = rows.map((r) => {
      const catId = autoCategorizRow(
        r.description,
        r.type,
        categories,
        categoryRules
      );
      const dupId = findDuplicate(r, realExpenses);
      const rowCurrency =
        r.detectedCurrency &&
        CURRENCIES.find((c) => c.code === r.detectedCurrency!.toUpperCase())
          ? r.detectedCurrency.toUpperCase()
          : currency;
      return {
        id: uid(),
        entryDate: r.entryDate,
        valueDate: r.valueDate,
        description: r.description,
        amount: r.amount,
        type: r.type,
        categoryId: catId,
        accountId: selectedAccountId,
        currency: rowCurrency,
        status: dupId ? 'duplicate' : 'new',
        duplicateOf: dupId,
        notes: '',
      };
    });
    setImportRows(importRowsList);
    setManuallyCategorized(new Set());
    setStep(3);
  };

  const confirmImport = () => {
    const toImport = importRows.filter((r) => r.status === 'new');
    const newExpenses: RealExpense[] = toImport.map((r) => ({
      id: uid(),
      entryDate: r.entryDate,
      valueDate: r.valueDate,
      description: r.description,
      categoryId: r.categoryId,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      accountId: r.accountId,
      notes: r.notes,
    }));
    setRealExpenses((prev) => [...prev, ...newExpenses]);
    toast(
      `${newExpenses.length} movimiento${
        newExpenses.length !== 1 ? 's' : ''
      } importado${newExpenses.length !== 1 ? 's' : ''} correctamente`,
      'success'
    );
    onClose();
  };

  const newCount = importRows.filter((r) => r.status === 'new').length;
  const dupCount = importRows.filter((r) => r.status === 'duplicate').length;
  const discardedCount = importRows.filter(
    (r) => r.status === 'discarded'
  ).length;

  const saveCustomFormat = () => {
    if (!customForm.name.trim()) return;
    const id = editingCustomId ?? uid();
    const saved: BankFormat = { ...customForm, id, isCustom: true };
    if (editingCustomId) {
      setBankFormats((prev) =>
        prev.map((f) => (f.id === editingCustomId ? saved : f))
      );
      toast('Formato actualizado', 'success');
    } else {
      setBankFormats((prev) => [...prev, saved]);
      toast('Formato guardado', 'success');
    }
    handleSelectFormat(id);
    setShowCustomForm(false);
    setEditingCustomId(null);
    setCustomForm(emptyCustomFormat);
  };

  const saveRule = () => {
    if (!ruleForm.categoryId || !ruleForm.keywords.trim()) return;
    const keywords = ruleForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (editingRule) {
      setCategoryRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? { ...r, categoryId: ruleForm.categoryId, keywords }
            : r
        )
      );
    } else {
      setCategoryRules((prev) => [
        ...prev,
        { id: uid(), categoryId: ruleForm.categoryId, keywords },
      ]);
    }
    setEditingRule(null);
    setRuleForm({ categoryId: '', keywords: '' });
    toast('Regla guardada', 'success');
  };

  const selectedFormat = allFormats.find((f) => f.id === selectedFormatId);
  const stepTitles = [
    {
      title: '📥 Cargar extracto del banco',
      sub: 'Paso 1 de 3 — Elige tu banco',
    },
    {
      title: '📂 Sube el fichero del extracto',
      sub: 'Paso 2 de 3 — Selecciona el archivo descargado',
    },
    {
      title: '✅ Revisa y confirma',
      sub: `Paso 3 de 3 — ${newCount} nuevos · ${dupCount} posibles duplicados`,
    },
  ];
  const currentStepInfo = stepTitles[step - 1];

  return (
    <>
      {createPortal(
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.cardBg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: '1.5rem',
              boxShadow: T.cardShadowLg,
              width: '100%',
              maxWidth: '36rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'fadeSlideIn 0.2s ease both',
            }}
          >
            {/* Cabecera */}
            <div
              style={{
                padding: '1.25rem 1.5rem 1rem',
                borderBottom: `1px solid ${T.cardBorder}`,
                position: 'sticky',
                top: 0,
                background: T.cardBg,
                zIndex: 1,
                borderRadius: '1.5rem 1.5rem 0 0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.375rem',
                  marginBottom: '0.875rem',
                }}
              >
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      height: '0.25rem',
                      borderRadius: '9999px',
                      background: s <= step ? T.accent : T.cardBorder,
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: T.title,
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {currentStepInfo.title}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: T.muted,
                      margin: '0.2rem 0 0',
                    }}
                  >
                    {currentStepInfo.sub}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    background: T.btnSecBg,
                    color: T.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
              {/* PASO 1 */}
              {step === 1 && !showCustomForm && !showRulesEditor && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '0.875rem',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}33`,
                      fontSize: '0.825rem',
                      color: T.accent,
                      lineHeight: 1.6,
                    }}
                  >
                    💡 <strong>¿Cómo funciona?</strong>
                    <br />
                    Primero descarga el extracto de movimientos desde la web o
                    app de tu banco, luego súbelo aquí.
                  </div>

                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Selecciona tu banco
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {allFormats.map((f) => {
                      const isSelected = selectedFormatId === f.id;
                      const friendlyNote =
                        BANK_FRIENDLY_NOTES[f.id] ??
                        (f.isCustom ? 'Formato personalizado' : null);
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFormat(f.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.875rem 1rem',
                            borderRadius: '0.875rem',
                            cursor: 'pointer',
                            border: `2px solid ${
                              isSelected ? T.accent : T.cardBorder
                            }`,
                            background: isSelected ? T.accentLight : T.pageBg,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.875rem',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                              {f.isCustom ? '⚙️' : '🏦'}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.925rem',
                                  fontWeight: 700,
                                  color: T.title,
                                }}
                              >
                                {f.name}
                              </div>
                              {friendlyNote && (
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    color: T.muted,
                                    marginTop: '0.15rem',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {friendlyNote}
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.375rem',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {f.isCustom && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomForm(f);
                                    setEditingCustomId(f.id);
                                    setShowCustomForm(true);
                                  }}
                                  style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    border: `1px solid ${T.cardBorder}`,
                                    background: T.btnSecBg,
                                    color: T.btnSecText,
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteFormat(f.id);
                                  }}
                                  style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    border: `1px solid ${T.redBorder}`,
                                    background: T.redBg,
                                    color: T.red,
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            {isSelected && <Check size={18} color={T.accent} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '0.875rem',
                      background: T.pageBg,
                      border: `1px solid ${T.cardBorder}`,
                      fontSize: '0.8rem',
                      color: T.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    ¿No ves tu banco?{' '}
                    <button
                      onClick={() => {
                        setCustomForm(emptyCustomFormat);
                        setEditingCustomId(null);
                        setShowCustomForm(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: T.accent,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                      }}
                    >
                      Configura un formato propio →
                    </button>
                  </div>

                  {confirmDeleteFormat && (
                    <div
                      style={{
                        padding: '0.875rem 1rem',
                        borderRadius: '0.875rem',
                        background: T.redBg,
                        border: `1px solid ${T.redBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: T.red,
                          marginBottom: '0.625rem',
                        }}
                      >
                        ¿Eliminar este formato?
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setBankFormats((prev) =>
                              prev.filter((f) => f.id !== confirmDeleteFormat)
                            );
                            if (selectedFormatId === confirmDeleteFormat)
                              setSelectedFormatId(
                                PREDEFINED_BANK_FORMATS[0].id
                              );
                            setConfirmDeleteFormat(null);
                            toast('Formato eliminado', 'success');
                          }}
                          style={{
                            ...btnPrimary,
                            background: T.red,
                            fontSize: '0.8rem',
                            padding: '0.5rem 1rem',
                          }}
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteFormat(null)}
                          style={{
                            ...btnSec,
                            fontSize: '0.8rem',
                            padding: '0.5rem 1rem',
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.625rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <button
                      onClick={() => setStep(2)}
                      style={{ ...btnPrimary, flex: 1 }}
                    >
                      Continuar con {selectedFormat?.name} →
                    </button>
                  </div>
                </div>
              )}

              {/* EDITOR FORMATO PERSONALIZADO */}
              {step === 1 && showCustomForm && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      color: T.title,
                    }}
                  >
                    {editingCustomId
                      ? '✏️ Editar formato'
                      : '➕ Nuevo formato bancario'}
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Nombre del banco
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="Ej: Mi Banco"
                      value={customForm.name}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Separador
                      </label>
                      <select
                        style={selStyle}
                        value={customForm.separator}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            separator: e.target.value as any,
                          }))
                        }
                      >
                        <option value=";">Punto y coma ( ; )</option>
                        <option value=",">Coma ( , )</option>
                        <option value={'\t'}>Tabulador</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Decimal
                      </label>
                      <select
                        style={selStyle}
                        value={customForm.decimal}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            decimal: e.target.value as any,
                          }))
                        }
                      >
                        <option value=",">Coma ( , )</option>
                        <option value=".">Punto ( . )</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Formato fecha
                      </label>
                      <select
                        style={selStyle}
                        value={customForm.dateFormat}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            dateFormat: e.target.value as any,
                          }))
                        }
                      >
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        <option value="dd/mm/yy">DD/MM/YY</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Filas de cabecera
                      </label>
                      <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        max={20}
                        value={customForm.skipRows}
                        onChange={(e) =>
                          setCustomForm((f) => ({
                            ...f,
                            skipRows: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Modo importe
                    </label>
                    <select
                      style={selStyle}
                      value={customForm.amountMode}
                      onChange={(e) =>
                        setCustomForm((f) => ({
                          ...f,
                          amountMode: e.target.value as any,
                        }))
                      }
                    >
                      <option value="single">Una columna con + / -</option>
                      <option value="split">
                        Dos columnas (entrada / salida)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Columnas
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem',
                      }}
                    >
                      {customForm.columns.map((col, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: T.muted,
                              minWidth: '3rem',
                            }}
                          >
                            Col {i + 1}
                          </span>
                          <select
                            value={col}
                            onChange={(e) =>
                              setCustomForm((f) => {
                                const cols = [...f.columns];
                                cols[i] = e.target.value as BankColumnKey;
                                return { ...f, columns: cols };
                              })
                            }
                            style={{ ...selStyle, marginBottom: 0, flex: 1 }}
                          >
                            {BANK_COLUMN_OPTIONS.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              setCustomForm((f) => ({
                                ...f,
                                columns: f.columns.filter((_, j) => j !== i),
                              }))
                            }
                            style={{
                              padding: '0.4rem 0.5rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${T.redBorder}`,
                              background: T.redBg,
                              color: T.red,
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setCustomForm((f) => ({
                            ...f,
                            columns: [...f.columns, 'ignore'],
                          }))
                        }
                        style={{
                          ...btnSec,
                          fontSize: '0.8rem',
                          padding: '0.4rem 0.75rem',
                          alignSelf: 'flex-start',
                        }}
                      >
                        + Añadir columna
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button
                      onClick={saveCustomFormat}
                      disabled={!customForm.name.trim()}
                      style={{
                        ...btnPrimary,
                        flex: 1,
                        opacity: customForm.name.trim() ? 1 : 0.5,
                      }}
                    >
                      ✅ Guardar formato
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomForm(false);
                        setEditingCustomId(null);
                        setCustomForm(emptyCustomFormat);
                      }}
                      style={btnSec}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2 */}
              {step === 2 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                      padding: '0.875rem 1rem',
                      borderRadius: '0.875rem',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}33`,
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🏦</span>
                    <div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 800,
                          color: T.accent,
                        }}
                      >
                        {selectedFormat?.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: T.muted,
                          marginTop: '0.1rem',
                        }}
                      >
                        {BANK_FRIENDLY_NOTES[selectedFormatId] ??
                          'Descarga el extracto en formato CSV desde tu banco'}
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        marginLeft: 'auto',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: `1px solid ${T.accent}44`,
                        background: 'transparent',
                        color: T.accent,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cambiar
                    </button>
                  </div>

                  {selectedFormat?.note && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.875rem',
                        background: T.amberBg,
                        border: `1px solid ${T.amberBorder}`,
                        fontSize: '0.775rem',
                        color: T.amber,
                        lineHeight: 1.5,
                        display: 'flex',
                        gap: '0.625rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>💡</span>
                      <span>{selectedFormat.note}</span>
                    </div>
                  )}

<div>
                    <label
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      ¿En qué cuenta quieres cargar los movimientos?
                    </label>
                    <select
                      style={selStyle}
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map((a) => {
                        const isCard = a.accountType === 'credit_card';
                        return (
                          <option key={a.id} value={a.id}>
                            {isCard ? '💳' : '🏦'} {a.name} (
                            {a.currency ?? baseCurrency})
                          </option>
                        );
                      })}
                    </select>

                    {/* Banner informativo cuando la cuenta destino es una tarjeta */}
                    {(() => {
                      const acc = accounts.find(
                        (a) => a.id === selectedAccountId
                      );
                      if (acc?.accountType !== 'credit_card') return null;
                      return (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.625rem 0.875rem',
                            borderRadius: '0.75rem',
                            background: T.accentLight,
                            border: `1px solid ${T.accent}33`,
                            fontSize: '0.75rem',
                            color: T.accent,
                            lineHeight: 1.5,
                          }}
                        >
                          💳 <strong>Tarjeta de crédito seleccionada.</strong>{' '}
                          Los gastos aumentarán la deuda de la tarjeta y los
                          pagos/abonos la reducirán.
                        </div>
                      );
                    })()}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setRawCSV((ev.target?.result as string) ?? '');
                      reader.readAsText(
                        file,
                        selectedFormat?.encoding === 'latin1'
                          ? 'ISO-8859-1'
                          : 'UTF-8'
                      );
                      e.target.value = '';
                    }}
                  />

                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      padding: '2rem 1.5rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: `2px dashed ${rawCSV ? T.accent : T.cardBorder}`,
                      background: rawCSV ? T.accentLight : T.pageBg,
                      color: rawCSV ? T.accent : T.muted,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>
                      {rawCSV ? '✅' : '📂'}
                    </span>
                    {rawCSV
                      ? 'Fichero cargado — pulsa para cambiar'
                      : 'Pulsa aquí para seleccionar el fichero del extracto'}
                    {!rawCSV && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          color: T.muted,
                        }}
                      >
                        Formatos aceptados: .csv · .txt
                      </span>
                    )}
                  </button>

                  {rawCSV && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.625rem',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '0.75rem',
                          background: T.accentLight,
                          border: `1px solid ${T.accent}33`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.775rem',
                            color: T.accent,
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          ⚙️ Filas de cabecera a saltar
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            onClick={() =>
                              setOverrideSkipRows((s) =>
                                Math.max(
                                  0,
                                  (s ?? selectedFormat?.skipRows ?? 0) - 1
                                )
                              )
                            }
                            style={{
                              padding: '0.25rem 0.625rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${T.cardBorder}`,
                              background: T.btnSecBg,
                              color: T.btnSecText,
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: T.accent,
                              minWidth: '1.5rem',
                              textAlign: 'center',
                            }}
                          >
                            {overrideSkipRows ?? selectedFormat?.skipRows ?? 0}
                          </span>
                          <button
                            onClick={() =>
                              setOverrideSkipRows(
                                (s) => (s ?? selectedFormat?.skipRows ?? 0) + 1
                              )
                            }
                            style={{
                              padding: '0.25rem 0.625rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${T.cardBorder}`,
                              background: T.btnSecBg,
                              color: T.btnSecText,
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          borderRadius: '0.75rem',
                          border: `1px solid ${T.cardBorder}`,
                          overflow: 'hidden',
                          fontSize: '0.68rem',
                          fontFamily: 'monospace',
                          maxHeight: '12rem',
                          overflowY: 'auto',
                        }}
                      >
                        {rawCSV
                          .split('\n')
                          .slice(0, 30)
                          .filter((l) => l.trim())
                          .map((line, i) => {
                            const skip =
                              overrideSkipRows ?? selectedFormat?.skipRows ?? 0;
                            const isHeader = i < skip;
                            const isFirstData = i === skip;
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '0.3rem 0.625rem',
                                  background: isFirstData
                                    ? T.greenBg
                                    : isHeader
                                    ? T.pageBg
                                    : T.cardBg,
                                  borderBottom: `1px solid ${T.cardBorder}`,
                                  color: isHeader ? T.muted : T.body,
                                  borderLeft: isFirstData
                                    ? `3px solid ${T.green}`
                                    : '3px solid transparent',
                                  display: 'flex',
                                  gap: '0.5rem',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    color: isFirstData ? T.green : T.muted,
                                    minWidth: '1.5rem',
                                    fontWeight: isFirstData ? 700 : 400,
                                    fontSize: '0.65rem',
                                  }}
                                >
                                  {isFirstData ? '▶' : i + 1}
                                </span>
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                  }}
                                >
                                  {line.length > 90
                                    ? line.slice(0, 90) + '...'
                                    : line}
                                </span>
                                {isFirstData && (
                                  <span
                                    style={{
                                      fontSize: '0.6rem',
                                      background: T.green,
                                      color: '#fff',
                                      padding: '0.1rem 0.375rem',
                                      borderRadius: '9999px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    INICIO
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {parseErrors.length > 0 && (
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        background: T.amberBg,
                        border: `1px solid ${T.amberBorder}`,
                        fontSize: '0.775rem',
                        color: T.amber,
                      }}
                    >
                      ⚠️ {parseErrors.length} línea
                      {parseErrors.length !== 1 ? 's' : ''} con errores (se
                      ignorarán)
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button
                      onClick={generatePreview}
                      disabled={!rawCSV || !selectedAccountId}
                      style={{
                        ...btnPrimary,
                        flex: 1,
                        opacity: !rawCSV || !selectedAccountId ? 0.5 : 1,
                        cursor:
                          !rawCSV || !selectedAccountId
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      Vista previa →
                    </button>
                    <button onClick={() => setStep(1)} style={btnSec}>
                      ← Atrás
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3 */}
              {step === 3 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                    }}
                  >
                    {[
                      {
                        label: 'Nuevos',
                        value: newCount,
                        color: T.green,
                        bg: T.greenBg,
                        border: T.greenBorder,
                      },
                      {
                        label: 'Duplicados',
                        value: dupCount,
                        color: T.amber,
                        bg: T.amberBg,
                        border: T.amberBorder,
                      },
                      {
                        label: 'Descartados',
                        value: discardedCount,
                        color: T.muted,
                        bg: T.pageBg,
                        border: T.cardBorder,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: '0.5rem 0.625rem',
                          borderRadius: '0.75rem',
                          background: item.bg,
                          border: `1px solid ${item.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            color: item.color,
                            lineHeight: 1,
                          }}
                        >
                          {item.value}
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: item.color,
                            textTransform: 'uppercase' as const,
                            lineHeight: 1.2,
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Banner de reglas automáticas — siempre visible en paso 3 */}
                  <div
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '0.875rem',
                      background: T.pageBg,
                      border: `1px solid ${T.cardBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.875rem',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.775rem',
                        color: T.muted,
                        lineHeight: 1.5,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: T.body }}>
                        ⚙️ Reglas de auto-categorización
                      </span>
                      <br />
                      {importRows.filter(
                        (r) => r.status === 'new' && !r.categoryId
                      ).length > 0 ? (
                        <span style={{ color: T.amber }}>
                          ⚠️{' '}
                          <strong>
                            {
                              importRows.filter(
                                (r) => r.status === 'new' && !r.categoryId
                              ).length
                            }{' '}
                            movimientos
                          </strong>{' '}
                          sin categoría. Crea reglas para automatizarlo la
                          próxima vez.
                        </span>
                      ) : (
                        <span>
                          ✅ Todos los movimientos han sido categorizados
                          automáticamente.
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowRulesEditor(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        border: `1.5px solid ${T.accent}44`,
                        background: T.accentLight,
                        color: T.accent,
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      ⚙️ Gestionar reglas
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: '22rem',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}
                  >
                    {importRows.map((row) => {
                      const dupRow = row.duplicateOf
                        ? realExpenses.find((e) => e.id === row.duplicateOf)
                        : null;
                      const statusColors = {
                        new: {
                          bg: T.greenBg,
                          border: T.greenBorder,
                          color: T.green,
                        },
                        duplicate: {
                          bg: T.amberBg,
                          border: T.amberBorder,
                          color: T.amber,
                        },
                        discarded: {
                          bg: T.pageBg,
                          border: T.cardBorder,
                          color: T.muted,
                        },
                      };
                      const sc = statusColors[row.status];
                      return (
                        <div
                          key={row.id}
                          style={{
                            padding: '0.75rem 0.875rem',
                            borderRadius: '0.75rem',
                            background: sc.bg,
                            border: `1.5px solid ${sc.border}`,
                            opacity: row.status === 'discarded' ? 0.5 : 1,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                            }}
                          >
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                              {row.type === 'income' ? '📈' : '📉'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.825rem',
                                  fontWeight: 700,
                                  color: T.title,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {row.description}
                              </div>
                              <div
                                style={{ fontSize: '0.68rem', color: T.muted }}
                              >
                                {fmtDateDMY(row.valueDate, dateFormat)}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: row.type === 'income' ? T.green : T.red,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {row.type === 'income' ? '+' : '-'}
                              {row.amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              {row.currency}
                            </div>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                background: sc.color,
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {row.status === 'new'
                                ? 'NUEVO'
                                : row.status === 'duplicate'
                                ? 'DUPLICADO'
                                : 'DESCARTADO'}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.375rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: T.muted,
                                flexShrink: 0,
                              }}
                            >
                              Categoría:
                            </span>
                            <select
                              value={row.categoryId}
                              onChange={(e) => {
                                setManuallyCategorized(
                                  (prev) => new Set([...prev, row.id])
                                );
                                setImportRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, categoryId: e.target.value }
                                      : r
                                  )
                                );
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '0.5rem',
                                border: `1px solid ${T.cardBorder}`,
                                background: T.inputBg,
                                color: T.inputText,
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="">— Sin categoría —</option>
                              {categories
                                .filter((c) => c.type === row.type)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                            {row.status !== 'discarded' && (
                              <button
                                onClick={() =>
                                  setImportRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? { ...r, status: 'discarded' }
                                        : r
                                    )
                                  )
                                }
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.5rem',
                                  border: `1px solid ${T.cardBorder}`,
                                  background: T.btnSecBg,
                                  color: T.muted,
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️ Descartar
                              </button>
                            )}
                            {row.status === 'discarded' && (
                              <button
                                onClick={() =>
                                  setImportRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? {
                                            ...r,
                                            status: row.duplicateOf
                                              ? 'duplicate'
                                              : 'new',
                                          }
                                        : r
                                    )
                                  )
                                }
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.5rem',
                                  border: `1px solid ${T.greenBorder}`,
                                  background: T.greenBg,
                                  color: T.green,
                                  cursor: 'pointer',
                                }}
                              >
                                ↩️ Restaurar
                              </button>
                            )}
                            {row.status === 'duplicate' && (
                              <button
                                onClick={() =>
                                  setImportRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? { ...r, status: 'new' }
                                        : r
                                    )
                                  )
                                }
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.5rem',
                                  border: `1px solid ${T.accent}44`,
                                  background: T.accentLight,
                                  color: T.accent,
                                  cursor: 'pointer',
                                }}
                              >
                                ✅ Importar igualmente
                              </button>
                            )}
                          </div>
                          {row.status === 'duplicate' && dupRow && (
                            <div
                              style={{
                                marginTop: '0.375rem',
                                padding: '0.375rem 0.625rem',
                                borderRadius: '0.5rem',
                                background: T.amberBg,
                                border: `1px solid ${T.amberBorder}`,
                                fontSize: '0.68rem',
                                color: T.amber,
                              }}
                            >
                              ⚠️ Posible duplicado:{' '}
                              <strong>{dupRow.description}</strong> ·{' '}
                              {fmtDateDMY(dupRow.valueDate, dateFormat)} ·{' '}
                              {dupRow.amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              {dupRow.currency}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {importRows.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: T.muted,
                          fontSize: '0.875rem',
                        }}
                      >
                        No se encontraron movimientos válidos. Comprueba el
                        banco seleccionado.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button
                      onClick={confirmImport}
                      disabled={newCount === 0}
                      style={{
                        ...btnPrimary,
                        flex: 1,
                        background: T.green,
                        opacity: newCount === 0 ? 0.5 : 1,
                        cursor: newCount === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ✅ Cargar {newCount} movimiento{newCount !== 1 ? 's' : ''}
                    </button>
                    <button onClick={() => setStep(2)} style={btnSec}>
                      ← Atrás
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {showRulesEditor &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
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
                maxWidth: '36rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'fadeSlideIn 0.2s ease both',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.5rem 0.75rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'sticky',
                  top: 0,
                  background: T.cardBg,
                  zIndex: 1,
                  borderRadius: '1.5rem 1.5rem 0 0',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: T.title,
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    ⚙️ Reglas de auto-categorización
                  </h2>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: T.muted,
                      marginTop: '0.25rem',
                      lineHeight: 1.5,
                      margin: '0.25rem 0 0',
                    }}
                  >
                    Cuando la descripción de un movimiento contenga estas
                    palabras, se asignará la categoría automáticamente al
                    importar.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRulesEditor(false);
                    setEditingRule(null);
                    setRuleForm({ categoryId: '', keywords: '' });
                  }}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    background: T.btnSecBg,
                    color: T.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div
                style={{
                  padding: '1rem 1.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {categoryRules.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}
                  >
                    {categoryRules.map((rule) => {
                      const cat = categories.find(
                        (c) => c.id === rule.categoryId
                      );
                      return (
                        <div
                          key={rule.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.875rem',
                            background: T.pageBg,
                            border: `1px solid ${T.cardBorder}`,
                          }}
                        >
                          <span
                            style={{
                              width: '0.625rem',
                              height: '0.625rem',
                              borderRadius: '50%',
                              background: cat?.color ?? T.cardBorder,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: T.title,
                              }}
                            >
                              {cat?.name ?? 'Sin categoría'}
                            </div>
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: T.muted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {rule.keywords.join(', ')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => {
                                setEditingRule(rule);
                                setRuleForm({
                                  categoryId: rule.categoryId,
                                  keywords: rule.keywords.join(', '),
                                });
                              }}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '0.5rem',
                                border: `1px solid ${T.cardBorder}`,
                                background: T.btnSecBg,
                                color: T.btnSecText,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                setCategoryRules((prev) =>
                                  prev.filter((r) => r.id !== rule.id)
                                );
                                toast('Regla eliminada', 'success');
                              }}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '0.5rem',
                                border: `1px solid ${T.redBorder}`,
                                background: T.redBg,
                                color: T.red,
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 2rem',
                      color: T.muted,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '3rem',
                        marginBottom: '0.75rem',
                        opacity: 0.3,
                      }}
                    >
                      ⚙️
                    </div>
                    <p
                      style={{
                        fontWeight: 700,
                        color: T.title,
                        marginBottom: '0.25rem',
                        fontSize: '1rem',
                      }}
                    >
                      Aún no tienes reglas
                    </p>
                    <p style={{ fontSize: '0.825rem' }}>
                      Añade una regla para automatizar la categorización al
                      importar extractos.
                    </p>
                  </div>
                )}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    background: editingRule ? T.accentLight : T.pageBg,
                    border: `1.5px solid ${
                      editingRule ? T.accent : T.cardBorder
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: editingRule ? T.accent : T.muted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {editingRule ? '✏️ Editando regla' : '➕ Nueva regla'}
                  </div>
                  <label
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: T.muted,
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Categoría
                  </label>
                  <select
                    style={selStyle}
                    value={ruleForm.categoryId}
                    onChange={(e) =>
                      setRuleForm((r) => ({ ...r, categoryId: e.target.value }))
                    }
                  >
                    <option value="">— Selecciona una categoría —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type === 'income' ? 'Ingreso' : 'Gasto'})
                      </option>
                    ))}
                  </select>
                  <label
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: T.muted,
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Palabras clave (separadas por comas)
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="Ej: mercadona, lidl, supermercado"
                    value={ruleForm.keywords}
                    onChange={(e) =>
                      setRuleForm((r) => ({ ...r, keywords: e.target.value }))
                    }
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={saveRule}
                      disabled={
                        !ruleForm.categoryId || !ruleForm.keywords.trim()
                      }
                      style={{
                        ...btnPrimary,
                        flex: 1,
                        opacity:
                          !ruleForm.categoryId || !ruleForm.keywords.trim()
                            ? 0.5
                            : 1,
                      }}
                    >
                      ✅ {editingRule ? 'Actualizar' : 'Guardar'} regla
                    </button>
                    {editingRule && (
                      <button
                        onClick={() => {
                          setEditingRule(null);
                          setRuleForm({ categoryId: '', keywords: '' });
                        }}
                        style={btnSec}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
