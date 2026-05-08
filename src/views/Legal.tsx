import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../AppContext';

// ─── Contenido legal ─────────────────────────────────────────────────────────
export const LEGAL_DOCS = {
  aviso: {
    title: 'Aviso Legal',
    emoji: '⚖️',
    content: [
      {
        heading: '1. Identificación del responsable',
        text: 'FinanzasHogar es un proyecto personal de software desarrollado con fines educativos y de uso personal. No constituye una empresa, entidad mercantil ni servicio comercial. No existe un CIF, domicilio social ni representante legal formal asociado a esta aplicación.',
      },
      {
        heading: '2. Naturaleza de la aplicación',
        text: 'FinanzasHogar es una aplicación web de gestión de finanzas personales que funciona íntegramente en el navegador del usuario. No dispone de servidores propios, bases de datos remotas ni infraestructura en la nube. Toda la información introducida por el usuario se almacena exclusivamente en el almacenamiento local (localStorage) de su propio dispositivo.',
      },
      {
        heading: '3. Carácter orientativo de la información',
        text: 'Las proyecciones, previsiones, tipos de cambio y cálculos que muestra la aplicación tienen un carácter meramente orientativo y no constituyen asesoramiento financiero, fiscal, legal ni de inversión. El responsable del proyecto no garantiza la exactitud, integridad ni idoneidad de la información para ningún propósito concreto.',
      },
      {
        heading: '4. Limitación de responsabilidad',
        text: 'El uso de FinanzasHogar es bajo la exclusiva responsabilidad del usuario. El responsable del proyecto no será liable por ningún daño directo, indirecto, incidental o consecuente derivado del uso o la imposibilidad de uso de la aplicación, incluyendo la pérdida de datos almacenados en el dispositivo del usuario.',
      },
      {
        heading: '5. Propiedad intelectual',
        text: 'El código fuente, diseño y contenidos de FinanzasHogar son propiedad del autor del proyecto. Queda prohibida su reproducción, distribución o modificación sin autorización expresa, salvo en los términos previstos por la licencia aplicable al proyecto.',
      },
      {
        heading: '6. Marcas y logotipos de entidades financieras',
        text: 'FinanzasHogar puede mostrar nombres y logotipos de entidades bancarias y financieras (bancos, neobancos, brokers, etc.) con el único propósito de que el usuario pueda identificar visualmente sus propias cuentas dentro de la aplicación. Estas marcas y logotipos son propiedad exclusiva de sus respectivos titulares y se utilizan al amparo del uso nominativo o referencial reconocido por la normativa europea de marcas. FinanzasHogar NO está afiliada, asociada, autorizada, patrocinada ni respaldada por ninguna de las entidades financieras mencionadas, ni mantiene relación comercial alguna con ellas. El usuario es libre de no asignar ninguna entidad a sus cuentas si así lo prefiere. Si eres titular de una marca y consideras que su uso en esta aplicación no es adecuado, ponte en contacto con el autor del proyecto para su retirada.',
      },
      {
        heading: '7. Legislación aplicable',
        text: 'Este aviso legal se rige por la legislación española y europea vigente. Para cualquier controversia derivada del uso de la aplicación, las partes se someten a los juzgados y tribunales del domicilio del usuario, en la medida en que la ley aplicable así lo permita.',
      },
    ],
  },
  privacidad: {
    title: 'Política de Privacidad',
    emoji: '🔒',
    content: [
      {
        heading: '1. Responsable del tratamiento',
        text: 'FinanzasHogar es un proyecto personal sin entidad jurídica constituida. A efectos del Reglamento General de Protección de Datos (RGPD) de la Unión Europea, el responsable del tratamiento es el propio autor del proyecto, en calidad de persona física.',
      },
      {
        heading: '2. Qué datos se tratan y dónde se almacenan',
        text: 'FinanzasHogar NO recopila, transmite ni almacena ningún dato personal en servidores externos. Todos los datos que el usuario introduce en la aplicación (cuentas, saldos, categorías, proyecciones, movimientos) se guardan exclusivamente en el almacenamiento local (localStorage) del navegador del propio dispositivo del usuario. El autor del proyecto no tiene acceso en ningún momento a estos datos.',
      },
      {
        heading: '3. Finalidad del tratamiento',
        text: 'Los datos introducidos por el usuario se utilizan exclusivamente para proporcionar la funcionalidad de la aplicación: cálculo de saldos, proyecciones financieras, previsiones y estadísticas. No se utilizan para ninguna otra finalidad, incluyendo publicidad, análisis de mercado o comunicación con terceros.',
      },
      {
        heading: '4. Base legal del tratamiento',
        text: 'La base legal para el tratamiento de los datos es el consentimiento explícito del usuario, otorgado en el momento de aceptar estos términos durante el proceso de configuración inicial de la aplicación. El usuario puede retirar su consentimiento en cualquier momento eliminando los datos almacenados a través de las opciones de la propia aplicación o limpiando el almacenamiento local de su navegador.',
      },
      {
        heading: '5. Transferencias internacionales de datos',
        text: 'No se realizan transferencias internacionales de datos, ya que ningún dato abandona el dispositivo del usuario.',
      },
      {
        heading: '6. Derechos del usuario',
        text: 'En virtud del RGPD, el usuario tiene derecho de acceso, rectificación, supresión, limitación, portabilidad y oposición al tratamiento de sus datos. Dado que todos los datos están almacenados exclusivamente en el dispositivo del usuario, el ejercicio de estos derechos se realiza directamente desde la propia aplicación o mediante la limpieza del almacenamiento local del navegador.',
      },
      {
        heading: '7. Seguridad de los datos',
        text: 'Los datos almacenados en localStorage están sujetos a las medidas de seguridad implementadas por el propio navegador del usuario. Se recomienda encarecidamente utilizar la función de copias de seguridad de la aplicación y mantener el dispositivo protegido con contraseña.',
      },
      {
        heading: '8. Conservación de los datos',
        text: 'Los datos se conservan en el dispositivo del usuario indefinidamente hasta que este decida eliminarlos, ya sea mediante la función de reset de la aplicación o limpiando el almacenamiento local del navegador.',
      },
    ],
  },
  terminos: {
    title: 'Términos y Condiciones',
    emoji: '📋',
    content: [
      {
        heading: '1. Aceptación de los términos',
        text: 'El uso de FinanzasHogar implica la aceptación plena y sin reservas de los presentes términos y condiciones. Si no estás de acuerdo con alguno de ellos, debes abstenerte de utilizar la aplicación.',
      },
      {
        heading: '2. Descripción del servicio',
        text: 'FinanzasHogar es una aplicación web gratuita de gestión de finanzas personales que funciona íntegramente en el navegador del usuario, sin necesidad de registro ni conexión permanente a Internet.',
      },
      {
        heading: '3. Uso permitido',
        text: 'La aplicación está destinada exclusivamente al uso personal y no comercial. El usuario se compromete a utilizar la aplicación de forma lícita, respetando la legislación vigente y los derechos de terceros.',
      },
      {
        heading: '4. Ausencia de asesoramiento financiero',
        text: 'FinanzasHogar no proporciona asesoramiento financiero, de inversión, fiscal ni legal. Toda la información mostrada por la aplicación tiene carácter meramente orientativo.',
      },
      {
        heading: '5. Disponibilidad del servicio',
        text: 'Al ser una aplicación que funciona en el navegador del usuario, la disponibilidad depende del propio dispositivo y navegador. El autor del proyecto no garantiza la disponibilidad ininterrumpida.',
      },
      {
        heading: '6. Responsabilidad sobre los datos',
        text: 'El usuario es el único responsable de los datos que introduce en la aplicación y de mantener copias de seguridad de los mismos.',
      },
      {
        heading: '7. Modificaciones',
        text: 'El autor del proyecto se reserva el derecho de modificar estos términos y condiciones en cualquier momento. El uso continuado de la aplicación implica la aceptación de las modificaciones.',
      },
      {
        heading: '8. Legislación aplicable y jurisdicción',
        text: 'Los presentes términos se rigen por la legislación española y el Reglamento General de Protección de Datos de la Unión Europea.',
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies y Almacenamiento Local',
    emoji: '🍪',
    content: [
      {
        heading: '1. ¿Usa FinanzasHogar cookies?',
        text: 'FinanzasHogar NO utiliza cookies de ningún tipo — ni propias ni de terceros. No hay cookies de seguimiento, analíticas, publicitarias ni de sesión.',
      },
      {
        heading: '2. Qué es localStorage y cómo lo usa la aplicación',
        text: 'En lugar de cookies, FinanzasHogar utiliza localStorage, una tecnología estándar de los navegadores web que permite almacenar datos directamente en el dispositivo del usuario.',
      },
      {
        heading: '3. Datos almacenados en localStorage',
        text: 'FinanzasHogar almacena en localStorage: configuración de cuentas y saldos, categorías, proyecciones financieras, movimientos reales, preferencias de visualización e historial de copias de seguridad internas.',
      },
      {
        heading: '4. Claves de almacenamiento utilizadas',
        text: 'La aplicación utiliza las siguientes claves: fh_accounts, fh_categories, fh_projections, fh_real_expenses, fh_dark, fh_currency, fh_base_currency, fh_onboarded, fh_backup_history, fh_exchange_rates y fh_legal_accepted.',
      },
      {
        heading: '5. Cómo eliminar los datos almacenados',
        text: 'El usuario puede eliminar todos los datos usando la función "Resetear aplicación" de la app, o limpiando el almacenamiento local desde la configuración de privacidad del navegador.',
      },
      {
        heading: '6. Servicios de terceros',
        text: 'FinanzasHogar realiza consultas a APIs externas para obtener tipos de cambio (Frankfurter API y ExchangeRate-API). Estas consultas no incluyen ningún dato personal del usuario.',
      },
    ],
  },
};

// ─── LegalModal ───────────────────────────────────────────────────────────────
export function LegalModal({
  docKey,
  onClose,
}: {
  docKey: keyof typeof LEGAL_DOCS;
  onClose: () => void;
}) {
  const { T } = useApp();
  const doc = LEGAL_DOCS[docKey];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: '4.5rem',
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
          maxWidth: '44rem',
          maxHeight: 'calc(100vh - 5.5rem)',
          overflowY: 'auto',
          animation: 'fadeSlideIn 0.2s ease both',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${T.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: T.cardBg,
            zIndex: 1,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <span style={{ fontSize: '1.5rem' }}>{doc.emoji}</span>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: T.title,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {doc.title}
            </h2>
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

        {/* Contenido */}
        <div style={{ padding: '1.5rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: T.amberBg,
              border: `1px solid ${T.amberBorder}`,
              fontSize: '0.775rem',
              color: T.amber,
              fontWeight: 600,
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            ⚠️ Última actualización: {new Date().getFullYear()} · Proyecto
            personal sin entidad jurídica · Ámbito de aplicación: Unión Europea
            (RGPD)
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {doc.content.map((section, i) => (
              <div key={i}>
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: T.title,
                    margin: '0 0 0.5rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {section.heading}
                </h3>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: T.body,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.875rem',
                border: `1.5px solid ${T.cardBorder}`,
                background: T.btnSecBg,
                color: T.btnSecText,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LegalFooter ──────────────────────────────────────────────────────────────
export function LegalFooter() {
  const { T } = useApp();
  const [openDoc, setOpenDoc] = useState<keyof typeof LEGAL_DOCS | null>(null);

  const links = [
    { key: 'aviso', label: 'Aviso Legal', emoji: '⚖️' },
    { key: 'privacidad', label: 'Privacidad', emoji: '🔒' },
    { key: 'terminos', label: 'Términos y Condiciones', emoji: '📋' },
    { key: 'cookies', label: 'Cookies y Almacenamiento', emoji: '🍪' },
  ] as const;

  return (
    <>
      <footer
        style={{
          borderTop: `1px solid ${T.cardBorder}`,
          background: T.headerBg,
          padding: '1.25rem 2rem',
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
          >
            <span
              style={{
                fontSize: '0.775rem',
                color: T.headerMuted,
                fontWeight: 600,
              }}
            >
              FinanzasHogar · Proyecto personal · {new Date().getFullYear()}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexWrap: 'wrap',
            }}
          >
            {links.map((link, i) => (
              <span
                key={link.key}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <button
                  onClick={() => setOpenDoc(link.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: T.headerMuted,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {link.emoji} {link.label}
                </button>
                {i < links.length - 1 && (
                  <span
                    style={{
                      color: T.headerMuted,
                      opacity: 0.3,
                      fontSize: '0.75rem',
                    }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>

          <div
            style={{ fontSize: '0.68rem', color: T.headerMuted, opacity: 0.6 }}
          >
            🔒 Datos almacenados solo en tu dispositivo · RGPD compliant
          </div>
        </div>
      </footer>

      {openDoc && (
        <LegalModal docKey={openDoc} onClose={() => setOpenDoc(null)} />
      )}
    </>
  );
}
