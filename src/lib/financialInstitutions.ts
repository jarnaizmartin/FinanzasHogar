// ─────────────────────────────────────────────────────────────────────────────
// financialInstitutions.ts
// Catálogo de entidades financieras predefinidas (bancos, fintechs, brokers).
// Usado por el selector de entidad en AccountFormModal.
//
// Si una entidad no está en el catálogo, el usuario puede escribirla manualmente
// vía la opción "Otra entidad" del selector.
// ─────────────────────────────────────────────────────────────────────────────

export type InstitutionCategory = 'bank' | 'fintech' | 'broker' | 'other';

export type FinancialInstitution = {
  id: string;
  name: string;
  category: InstitutionCategory;
  emoji: string;
  slug?: string;       // slug en simpleicons.org
  brandColor?: string; // hex sin '#' (color oficial de marca)
  domain?: string;     // dominio web (fallback Clearbit)
};

export const FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  // Bancos tradicionales
  { id: 'bbva',       name: 'BBVA',            category: 'bank', emoji: '🏦', slug: 'bbva',      brandColor: '004481', domain: 'bbva.es' },
  { id: 'santander',  name: 'Banco Santander', category: 'bank', emoji: '🏦', slug: 'santander', brandColor: 'EC0000', domain: 'bancosantander.es' },
  { id: 'caixabank',  name: 'CaixaBank',       category: 'bank', emoji: '🏦', slug: 'caixabank', brandColor: '007EAE', domain: 'caixabank.es' },
  { id: 'sabadell',   name: 'Banco Sabadell',  category: 'bank', emoji: '🏦', domain: 'bancsabadell.com' },
  { id: 'bankinter',  name: 'Bankinter',       category: 'bank', emoji: '🏦', domain: 'bankinter.com' },
  { id: 'ing',        name: 'ING',             category: 'bank', emoji: '🏦', slug: 'ing',       brandColor: 'FF6200', domain: 'ing.es' },
  { id: 'openbank',   name: 'Openbank',        category: 'bank', emoji: '🏦', domain: 'openbank.es' },
  { id: 'unicaja',    name: 'Unicaja',         category: 'bank', emoji: '🏦', domain: 'unicajabanco.es' },
  { id: 'kutxabank',  name: 'Kutxabank',       category: 'bank', emoji: '🏦', domain: 'kutxabank.es' },
  { id: 'abanca',     name: 'Abanca',          category: 'bank', emoji: '🏦', domain: 'abanca.com' },

  // Fintechs / Neobancos
  { id: 'revolut',    name: 'Revolut',         category: 'fintech', emoji: '💳', slug: 'revolut', brandColor: '0666EB', domain: 'revolut.com' },
  { id: 'n26',        name: 'N26',             category: 'fintech', emoji: '💳', slug: 'n26',     brandColor: '24252A', domain: 'n26.com' },
  { id: 'wise',       name: 'Wise',            category: 'fintech', emoji: '💳', slug: 'wise',    brandColor: '9FE870', domain: 'wise.com' },
  { id: 'bnext',      name: 'BNext',           category: 'fintech', emoji: '💳', domain: 'bnext.com' },
  { id: 'bunq',       name: 'Bunq',            category: 'fintech', emoji: '💳', slug: 'bunq',    brandColor: '3394D7', domain: 'bunq.com' },
  { id: 'myinvestor', name: 'MyInvestor',      category: 'fintech', emoji: '💳', domain: 'myinvestor.es' },

  // Brokers / Inversión
  { id: 'trade_republic',      name: 'Trade Republic',      category: 'broker', emoji: '📈', slug: 'traderepublic',      brandColor: '1A1A1A', domain: 'traderepublic.com' },
  { id: 'interactive_brokers', name: 'Interactive Brokers', category: 'broker', emoji: '📈', slug: 'interactivebrokers', brandColor: 'D91920', domain: 'interactivebrokers.com' },
  { id: 'degiro',  name: 'DEGIRO',         category: 'broker', emoji: '📈', domain: 'degiro.es' },
  { id: 'etoro',   name: 'eToro',          category: 'broker', emoji: '📈', slug: 'etoro', brandColor: '13C636', domain: 'etoro.com' },
  { id: 'xtb',     name: 'XTB',            category: 'broker', emoji: '📈', domain: 'xtb.com' },
  { id: 'indexa',  name: 'Indexa Capital', category: 'broker', emoji: '📈', domain: 'indexacapital.com' },

  // Tarjetas / Otros
  { id: 'amex',   name: 'American Express', category: 'other', emoji: '💳', slug: 'americanexpress', brandColor: '2E77BB', domain: 'americanexpress.com' },
  { id: 'curve',  name: 'Curve',            category: 'other', emoji: '💳', domain: 'curve.com' },
  { id: 'paypal', name: 'PayPal',           category: 'other', emoji: '💰', slug: 'paypal',          brandColor: '003087', domain: 'paypal.com' },
];

// ─── Etiquetas de categoría (para agrupar en el dropdown) ──────────────────
export const CATEGORY_LABELS: Record<InstitutionCategory, string> = {
  bank: 'Bancos tradicionales',
  fintech: 'Fintechs / Neobancos',
  broker: 'Inversión / Brokers',
  other: 'Tarjetas / Otros',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Busca una entidad por su nombre exacto (case-insensitive).
 * Devuelve undefined si no está en el catálogo (= entidad personalizada).
 */
export function findInstitutionByName(
  name: string | undefined
): FinancialInstitution | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return FINANCIAL_INSTITUTIONS.find(
    (i) => i.name.toLowerCase() === normalized
  );
}

/**
 * Devuelve el emoji apropiado para una entidad (catálogo o personalizada).
 * Si es personalizada, devuelve un emoji genérico.
 */
export function getInstitutionEmoji(name: string | undefined): string {
  if (!name) return '';
  const found = findInstitutionByName(name);
  return found?.emoji ?? '🏦';
}

/**
 * Agrupa entidades por categoría para renderizar el dropdown.
 */
export function getInstitutionsByCategory(): Record<
  InstitutionCategory,
  FinancialInstitution[]
> {
  return {
    bank: FINANCIAL_INSTITUTIONS.filter((i) => i.category === 'bank'),
    fintech: FINANCIAL_INSTITUTIONS.filter((i) => i.category === 'fintech'),
    broker: FINANCIAL_INSTITUTIONS.filter((i) => i.category === 'broker'),
    other: FINANCIAL_INSTITUTIONS.filter((i) => i.category === 'other'),
  };
}

/**
 * Filtra entidades por texto de búsqueda (case-insensitive).
 */
export function searchInstitutions(query: string): FinancialInstitution[] {
  const q = query.trim().toLowerCase();
  if (!q) return FINANCIAL_INSTITUTIONS;
  return FINANCIAL_INSTITUTIONS.filter((i) => i.name.toLowerCase().includes(q));
}

/**
 * Devuelve el slug de simpleicons.org para una entidad (si tiene logo).
 */
 export function getInstitutionSlug(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return findInstitutionByName(name)?.slug;
}

/**
 * Devuelve el color oficial de marca (hex sin '#') de una entidad.
 */
 export function getInstitutionBrandColor(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return findInstitutionByName(name)?.brandColor;
}

/**
 * Devuelve el dominio web de una entidad (fallback Clearbit).
 */
 export function getInstitutionDomain(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return findInstitutionByName(name)?.domain;
}
