// ─────────────────────────────────────────────────────────────────────────────
// InstitutionSelector.tsx
// Selector de entidad financiera con búsqueda y opción de texto libre.
// 
// Props:
//   - value: nombre actual de la entidad (string vacío = sin asignar)
//   - onChange: callback con el nuevo nombre
//   - T: theme
//
// UX:
//   - Botón que muestra la entidad seleccionada (o placeholder)
//   - Al hacer click abre un dropdown con búsqueda
//   - Resultados agrupados por categoría
//   - Opción "Otra entidad" al final → habilita input libre
//   - Cierre al hacer click fuera o pulsar Escape
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react';
import { Search, Check, X, Pencil, ChevronDown } from 'lucide-react';
import {
  FINANCIAL_INSTITUTIONS,
  CATEGORY_LABELS,
  searchInstitutions,
  findInstitutionByName,
  type InstitutionCategory,
} from '../lib/financialInstitutions';
import { InstitutionLogo } from './InstitutionLogo';

type Theme = {
  cardBg: string;
  cardBorder: string;
  cardShadowLg: string;
  pageBg: string;
  title: string;
  muted: string;
  accent: string;
  accentLight: string;
  btnSecBg: string;
};

type Props = {
  value: string;
  onChange: (newValue: string) => void;
  T: Theme;
};

export function InstitutionSelector({ value, onChange, T }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Determinar si la entidad actual está en el catálogo ──────────────────
  const isCustom = value !== '' && !findInstitutionByName(value);

  // ── Filtrado por búsqueda ────────────────────────────────────────────────
  const filtered = useMemo(() => searchInstitutions(query), [query]);

  // ── Agrupar resultados por categoría ─────────────────────────────────────
  const grouped = useMemo(() => {
    const result: Record<InstitutionCategory, typeof FINANCIAL_INSTITUTIONS> = {
      bank: [],
      fintech: [],
      broker: [],
      other: [],
    };
    filtered.forEach((inst) => result[inst.category].push(inst));
    return result;
  }, [filtered]);

  // ── Cerrar al click fuera o Escape ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    // Auto-focus en el campo de búsqueda al abrir
    setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  // ── Si la entidad actual es custom, activar modo libre al abrir ──────────
  useEffect(() => {
    if (open && isCustom) setCustomMode(true);
  }, [open, isCustom]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
    setCustomMode(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setCustomMode(false);
  };

  const handleEnableCustom = () => {
    setCustomMode(true);
    if (!isCustom) onChange('');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Botón / Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          borderRadius: '0.625rem',
          border: `1.5px solid ${open ? T.accent : T.cardBorder}`,
          background: T.cardBg,
          color: value ? T.title : T.muted,
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          transition: 'border-color 0.15s',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'left',
          }}
        >
          {value ? (
            <>
              <InstitutionLogo name={value} size={18} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
              </span>
              {isCustom && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: T.accent,
                    background: T.accentLight,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    flexShrink: 0,
                  }}
                >
                  Personalizada
                </span>
              )}
            </>
          ) : (
            <span>Selecciona una entidad (opcional)</span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              title="Quitar entidad"
              style={{
                padding: '0.15rem',
                borderRadius: '0.375rem',
                color: T.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            color={T.muted}
            style={{
              transition: 'transform 0.15s',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.375rem)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: T.cardBg,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: '0.875rem',
            boxShadow: T.cardShadowLg,
            maxHeight: '22rem',
            overflowY: 'auto',
            animation: 'fadeSlideIn 0.15s ease both',
          }}
        >
          {/* Modo libre activo: mostrar input de texto */}
          {customMode ? (
            <div style={{ padding: '0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Pencil size={12} />
                Escribe el nombre de tu entidad
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Ej: Mi banco local"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setOpen(false);
                    setCustomMode(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1.5px solid ${T.accent}`,
                  background: T.pageBg,
                  color: T.title,
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${T.cardBorder}`,
                    background: T.btnSecBg,
                    color: T.muted,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Volver al catálogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: T.accent,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div
                style={{
                  padding: '0.625rem',
                  borderBottom: `1px solid ${T.cardBorder}`,
                  position: 'sticky',
                  top: 0,
                  background: T.cardBg,
                  zIndex: 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    color={T.muted}
                    style={{
                      position: 'absolute',
                      left: '0.625rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar entidad..."
                    value={query}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setQuery(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem 0.45rem 2rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${T.cardBorder}`,
                      background: T.pageBg,
                      color: T.title,
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Resultados agrupados */}
              <div style={{ padding: '0.375rem 0' }}>
                {(['bank', 'fintech', 'broker', 'other'] as const).map((cat) => {
                  const items = grouped[cat];
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} style={{ marginBottom: '0.25rem' }}>
                      <div
                        style={{
                          padding: '0.4rem 0.875rem 0.25rem',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {CATEGORY_LABELS[cat]}
                      </div>
                      {items.map((inst) => {
                        const selected = value === inst.name;
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => handleSelect(inst.name)}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.875rem',
                              border: 'none',
                              background: selected ? T.accentLight : 'transparent',
                              color: selected ? T.accent : T.title,
                              fontSize: '0.85rem',
                              fontWeight: selected ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              textAlign: 'left',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => {
                              if (!selected)
                                e.currentTarget.style.background = T.pageBg;
                            }}
                            onMouseLeave={(e) => {
                              if (!selected)
                                e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <InstitutionLogo name={inst.name} size={18} />
                            <span style={{ flex: 1 }}>{inst.name}</span>
                            {selected && <Check size={14} color={T.accent} />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: T.muted,
                    }}
                  >
                    No se encontraron entidades para "{query}"
                  </div>
                )}
              </div>

              {/* Opción "Otra entidad" */}
              <div
                style={{
                  borderTop: `1px solid ${T.cardBorder}`,
                  padding: '0.375rem 0',
                  position: 'sticky',
                  bottom: 0,
                  background: T.cardBg,
                }}
              >
                <button
                  type="button"
                  onClick={handleEnableCustom}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.875rem',
                    border: 'none',
                    background: 'transparent',
                    color: T.accent,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Pencil size={13} />
                  Otra entidad (escribir manualmente)
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
