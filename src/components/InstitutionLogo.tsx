// ─────────────────────────────────────────────────────────────────────────────
// InstitutionLogo.tsx
// Muestra el logo de una entidad financiera con cadena de fallbacks:
//   1. Simple Icons (SVG monocolor con brand color) — si existe slug
//   2. Clearbit Logo API (logo a color por dominio) — si existe domain
//   3. Emoji genérico
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  getInstitutionSlug,
  getInstitutionEmoji,
  getInstitutionBrandColor,
  getInstitutionDomain,
} from '../lib/financialInstitutions';

type Props = {
  name: string | undefined;
  size?: number;
  /** Hex sin '#' para forzar color en el SVG monocolor (solo aplica a Simple Icons). */
  color?: string;
};

type Source = 'simpleicons' | 'clearbit' | 'emoji';

export function InstitutionLogo({ name, size = 16, color }: Props) {
  const slug = getInstitutionSlug(name);
  const emoji = getInstitutionEmoji(name);
  const brandColor = getInstitutionBrandColor(name);
  const domain = getInstitutionDomain(name);

  // Fuente inicial: la mejor disponible
  const initialSource: Source = slug
    ? 'simpleicons'
    : domain
    ? 'clearbit'
    : 'emoji';
  const [source, setSource] = useState<Source>(initialSource);

  // Re-evaluar si cambia la entidad
  useEffect(() => {
    setSource(slug ? 'simpleicons' : domain ? 'clearbit' : 'emoji');
  }, [name, slug, domain]);

  // Manejo de error: degradar al siguiente fallback
  const handleError = () => {
    if (source === 'simpleicons' && domain) {
      setSource('clearbit');
    } else {
      setSource('emoji');
    }
  };

  // Render emoji
  if (source === 'emoji') {
    return (
      <span
        style={{
          fontSize: size,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {emoji}
      </span>
    );
  }

  // Render Simple Icons
  if (source === 'simpleicons' && slug) {
    const finalColor = color ?? brandColor;
    const cleanColor = finalColor ? finalColor.replace('#', '') : undefined;
    const url = cleanColor
      ? `https://cdn.simpleicons.org/${slug}/${cleanColor}`
      : `https://cdn.simpleicons.org/${slug}`;
    return (
      <img
        src={url}
        alt={name ?? ''}
        width={size}
        height={size}
        onError={handleError}
        style={{
          display: 'inline-block',
          objectFit: 'contain',
          verticalAlign: 'middle',
        }}
      />
    );
  }

  // Render Clearbit (logo por dominio, a color natural)
  if (source === 'clearbit' && domain) {
    return (
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name ?? ''}
        width={size}
        height={size}
        onError={handleError}
        style={{
          display: 'inline-block',
          objectFit: 'contain',
          verticalAlign: 'middle',
          borderRadius: '0.2rem',
        }}
      />
    );
  }

  // Fallback final defensivo
  return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>;
}
