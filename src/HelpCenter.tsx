// ============================================================
// HELP CENTER — FinanzasHogar
// Centro de ayuda: Manual, FAQ, Tour y Atajos
// ============================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { GettingStarted } from './GettingStarted';
import {
  X,
  BookOpen,
  HelpCircle,
  PlayCircle,
  Keyboard,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wallet,
  Receipt,
  BarChart2,
  Target,
  TrendingUp,
  Shield,
  Archive,
  AlertTriangle,
  CalendarRange,
  FileText,
  ArrowLeftRight,
  Tag,
  Settings,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type HelpSection = 'home' | 'manual' | 'faq' | 'shortcuts' | 'getting-started';

interface ManualSection {
  id: string;
  icon: any;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  content: {
    heading: string;
    text: string;
    tip?: string;
  }[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

interface FAQCategory {
  id: string;
  emoji: string;
  label: string;
  color: string;
  items: FAQItem[];
}

interface Shortcut {
  keys: string[];
  description: string;
}

// ─── Datos del Manual ─────────────────────────────────────────────────────────

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'accounts',
    icon: Wallet,
    emoji: '🏦',
    title: 'Cuentas',
    subtitle: 'Gestiona tus cuentas bancarias y efectivo',
    color: '#2563eb',
    content: [
      {
        heading: '¿Qué es una cuenta?',
        text: 'Una cuenta representa cualquier lugar donde guardas dinero: cuenta corriente, cuenta de ahorro, efectivo, inversiones, etc. Cada cuenta tiene un saldo base y una fecha asociada.',
      },
      {
        heading: 'Saldo base vs Saldo real',
        text: 'El saldo base es el importe que introduces manualmente junto con su fecha. El saldo real es el resultado de sumar al saldo base todos los movimientos reales (gastos e ingresos) registrados con fecha posterior al saldo base.',
        tip: '💡 Actualiza el saldo base periódicamente para mantener tus cuentas sincronizadas con la realidad.',
      },
      {
        heading: 'Saldo mínimo de alerta',
        text: 'Puedes configurar un saldo mínimo para cada cuenta. Si el saldo real calculado cae por debajo, recibirás una alerta automática en el panel de Alertas y en el Resumen.',
      },
      {
        heading: 'Divisa por cuenta',
        text: 'Cada cuenta puede tener su propia divisa. Los importes se convierten automáticamente a tu divisa de visualización usando tipos de cambio en tiempo real.',
      },
      {
        heading: '¿Cómo actualizar el saldo?',
        text: 'Edita la cuenta y cambia el saldo e introduce la fecha actual. La app reconocerá automáticamente todos los movimientos anteriores a esa fecha para evitar duplicidades.',
        tip: '💡 Recomendamos actualizar el saldo base mensualmente consultando tu extracto bancario real.',
      },
    ],
  },
  {
    id: 'real',
    icon: Receipt,
    emoji: '🧾',
    title: 'Gastos Reales',
    subtitle: 'Registra y analiza tus movimientos reales',
    color: '#dc2626',
    content: [
      {
        heading: '¿Qué son los gastos reales?',
        text: 'Son los movimientos reales de dinero: ingresos recibidos y gastos realizados. A diferencia de las proyecciones (que son estimaciones), los gastos reales reflejan lo que realmente ha ocurrido.',
      },
      {
        heading: 'Fecha de apunte vs Fecha de valor',
        text: 'La fecha de apunte es cuándo ocurrió el movimiento (ej: compra en tienda). La fecha de valor es cuándo se refleja en tu cuenta bancaria. Para el cálculo del saldo real, se usa la fecha de valor.',
      },
      {
        heading: 'Importar desde CSV bancario',
        text: 'Puedes importar movimientos directamente desde el fichero CSV que descarga tu banco. La app detecta duplicados automáticamente y categoriza los movimientos según palabras clave configurables.',
        tip: '💡 Configura las Reglas de categorización en el importador CSV para que la app asigne categorías automáticamente.',
      },
      {
        heading: 'Filtros avanzados',
        text: 'Usa los filtros de tipo, cuenta, categoría y fecha para analizar tus movimientos. Puedes usar períodos predefinidos (este mes, último mes, últimos 3 meses) o definir un rango personalizado.',
      },
      {
        heading: 'Movimientos recurrentes automáticos',
        text: 'Si activas "Es un cargo fijo confirmado" en una proyección, la app generará automáticamente el gasto real en la fecha configurada cada mes.',
        tip: '⚠️ Si ya existe un movimiento similar en ese mes, la app lo detectará como posible duplicado y te avisará.',
      },
    ],
  },
  {
    id: 'projections',
    icon: BarChart2,
    emoji: '📈',
    title: 'Proyecciones',
    subtitle: 'Planifica ingresos y gastos futuros',
    color: '#7c3aed',
    content: [
      {
        heading: '¿Qué es una proyección?',
        text: 'Una proyección es un ingreso o gasto esperado en el futuro. Puede ser mensual, bimensual, trimestral, semestral o anual. Las proyecciones forman la base del cálculo de previsión de saldos.',
      },
      {
        heading: 'Frecuencias disponibles',
        text: 'Puedes configurar la frecuencia: Mensual (cada mes), Bimensual (cada 2 meses), Trimestral (cada 3), Semestral (cada 6) o Anual. El día de cobro/pago corresponde al día de la fecha de inicio.',
      },
      {
        heading: 'Ajuste para el próximo mes',
        text: 'Si un mes concreto el importe será diferente al habitual (ej: una nómina con paga extra), puedes indicar el importe puntual. Al mes siguiente vuelve automáticamente al importe habitual.',
        tip: '💡 Usa el botón 💶 en cada proyección para configurar rápidamente el ajuste del próximo mes.',
      },
      {
        heading: 'Cargos fijos confirmados',
        text: 'Activa "Es un cargo fijo confirmado" para proyecciones que sabes que se cobrarán con seguridad (Netflix, alquiler, etc.). La app generará automáticamente el gasto real en la fecha configurada.',
      },
      {
        heading: '¿Cómo afectan al saldo?',
        text: 'Para meses pasados, se usan los movimientos reales. Para el mes actual, se combinan los reales con el residual proyectado por categoría. Para meses futuros, se usa únicamente la proyección.',
      },
    ],
  },
  {
    id: 'forecast',
    icon: TrendingUp,
    emoji: '🔮',
    title: 'Previsión',
    subtitle: 'Evolución proyectada de tus saldos a 12 meses',
    color: '#0891b2',
    content: [
      {
        heading: '¿Cómo funciona la previsión?',
        text: 'La previsión calcula el saldo estimado para los próximos 12 meses partiendo del saldo real actual y aplicando las proyecciones configuradas. Puedes ver el resultado por cuenta o consolidado.',
      },
      {
        heading: 'Interpretación del gráfico',
        text: 'Las barras azules indican saldo normal. Las ámbar indican que el saldo caerá por debajo del mínimo configurado. Las rojas indican saldo negativo.',
      },
      {
        heading: 'Limitaciones',
        text: 'La previsión solo incluye los movimientos que hayas proyectado. Gastos imprevistos, variaciones en ingresos o nuevas proyecciones no estarán reflejados hasta que los configures.',
        tip: '💡 Actualiza tus proyecciones regularmente para mantener la previsión lo más precisa posible.',
      },
    ],
  },
  {
    id: 'goals',
    icon: Target,
    emoji: '🎯',
    title: 'Objetivos',
    subtitle: 'Define metas de ahorro y sigue tu progreso',
    color: '#16a34a',
    content: [
      {
        heading: 'Tipos de objetivos',
        text: 'Hay dos modos: Manual (introduces tú el importe ahorrado cuando quieras) y Automático (la app suma los movimientos reales de una categoría y cuenta específicas).',
      },
      {
        heading: 'Modo automático',
        text: 'En modo automático, selecciona la categoría y cuenta que quieres monitorizar, y la fecha desde la que contar. La app sumará todos los movimientos válidos automáticamente.',
        tip: '💡 Usa el modo automático para objetivos vinculados a una categoría de ahorro específica, como "Ahorro / Inversión".',
      },
      {
        heading: 'Métricas de seguimiento',
        text: 'Para cada objetivo verás: importe ahorrado, porcentaje de progreso, importe restante, meses disponibles (si hay fecha límite) y ritmo mensual necesario para llegar a tiempo.',
      },
      {
        heading: 'Alertas de objetivos',
        text: 'La app genera alertas automáticas si un objetivo está en peligro (ritmo insuficiente), si ha vencido sin completarse o si se ha completado con éxito.',
      },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    emoji: '🔐',
    title: 'Seguridad',
    subtitle: 'Protege tus datos financieros',
    color: '#f59e0b',
    content: [
      {
        heading: 'Métodos de autenticación',
        text: 'Puedes proteger la app con contraseña clásica o con verificación en dos pasos (TOTP). El TOTP es más seguro: usa apps como Google Authenticator, Authy o Microsoft Authenticator.',
      },
      {
        heading: 'Frase de recuperación',
        text: 'Al configurar la seguridad, recibirás 12 palabras de recuperación. Guárdalas en un lugar seguro fuera del ordenador. Son la única forma de recuperar el acceso si olvidas tu contraseña.',
        tip: '⚠️ Si pierdes tu frase de recuperación y tu contraseña, no podrás acceder a la app. No hay "recuperar contraseña" automático.',
      },
      {
        heading: 'Fichero de recuperación',
        text: 'Además de la frase, puedes descargar un fichero .json de recuperación. Guárdalo en un lugar seguro (USB, nube privada). Úsalo junto con una nueva contraseña para recuperar el acceso.',
      },
      {
        heading: 'Período de gracia TOTP',
        text: 'Si usas TOTP, puedes configurar cuánto tiempo puede pasar sin pedirte el código al reabrir la app. Desde "pedir siempre" hasta "no volver a pedir".',
      },
      {
        heading: 'Bloqueo por inactividad',
        text: 'La app se bloquea automáticamente tras un período de inactividad configurable (5, 15, 30 minutos o 1 hora). Útil si compartes ordenador.',
      },
    ],
  },
  {
    id: 'backup',
    icon: Archive,
    emoji: '💾',
    title: 'Copias de Seguridad',
    subtitle: 'Protege tus datos contra pérdidas',
    color: '#8b5cf6',
    content: [
      {
        heading: 'Historial interno vs Fichero descargado',
        text: 'El historial interno (hasta 50 copias) se guarda en el navegador. El fichero descargado (.json) es una copia física en tu ordenador. Ambas son importantes, pero solo el fichero sobrevive a limpiezas del navegador.',
        tip: '⚠️ Si limpias el historial del navegador o cambias de dispositivo, el historial interno se pierde. Descarga siempre una copia física.',
      },
      {
        heading: 'Backup automático',
        text: 'La app crea automáticamente una copia en el historial interno al arrancar si han pasado más días de los configurados desde la última copia. Puedes ajustar la frecuencia (7, 14 o 30 días).',
      },
      {
        heading: 'Restaurar una copia',
        text: 'Desde el panel de copias de seguridad puedes restaurar cualquier copia del historial o importar un fichero .json descargado previamente. Antes de restaurar, la app guarda automáticamente el estado actual.',
      },
      {
        heading: 'Copia previa al borrado',
        text: 'Cuando vayas a hacer un borrado selectivo de datos, puedes marcar la opción de descargar una copia previa. Recomendado siempre.',
        tip: '💡 Recomendamos descargar una copia física al menos una vez a la semana y guardarla en un lugar seguro como Google Drive o un USB.',
      },
    ],
  },
  {
    id: 'currencies',
    icon: ArrowLeftRight,
    emoji: '💱',
    title: 'Divisas',
    subtitle: 'Gestiona múltiples monedas',
    color: '#0d9488',
    content: [
      {
        heading: 'Divisa base vs Divisa de visualización',
        text: 'La divisa base es en la que introduces tus datos (ej: EUR). La divisa de visualización es en la que se muestran los importes en pantalla (puede ser diferente si vives en un país o tienes cuentas en otra moneda).',
      },
      {
        heading: 'Divisa por cuenta',
        text: 'Cada cuenta puede tener su propia divisa. Por ejemplo, puedes tener una cuenta en EUR y otra en USD. Los totales se convierten automáticamente a la divisa de visualización.',
      },
      {
        heading: 'Actualización de tipos de cambio',
        text: 'Los tipos de cambio se obtienen de Frankfurter API y ExchangeRate-API cada 24 horas. Si no hay conexión, se usan valores aproximados. El indicador en el header muestra el estado actualización.',
        tip: '⚠️ Los tipos de cambio son orientativos. Para operaciones financieras importantes, consulta siempre el tipo oficial de tu banco.',
      },
    ],
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'general',
    emoji: '⚙️',
    label: 'General',
    color: '#2563eb',
    items: [
      {
        id: 'g1',
        question: '¿Dónde se guardan mis datos?',
        answer:
          'Todos tus datos se guardan exclusivamente en el almacenamiento local (localStorage) de tu navegador, en tu propio dispositivo. Nunca se envían a ningún servidor externo. Tus datos son completamente privados.',
        tags: ['datos', 'privacidad', 'almacenamiento'],
      },
      {
        id: 'g2',
        question: '¿Puedo usar la app sin conexión a internet?',
        answer:
          'Sí, la app funciona completamente sin conexión. La única funcionalidad que requiere internet es la actualización de tipos de cambio (para conversión de divisas). Si no hay conexión, se usan los últimos valores descargados o valores aproximados.',
        tags: ['offline', 'internet', 'conexión'],
      },
      {
        id: 'g3',
        question: '¿Qué pasa si cierro el navegador?',
        answer:
          'Tus datos se conservan en el almacenamiento local del navegador. Al volver a abrir la app, encontrarás todo exactamente como lo dejaste. Sin embargo, si limpias el historial del navegador o los datos del sitio, perderás toda la información. Por eso es fundamental descargar copias de seguridad regularmente.',
        tags: ['datos', 'navegador', 'pérdida'],
      },
      {
        id: 'g4',
        question: '¿Puedo usar la app en varios dispositivos?',
        answer:
          'Los datos no se sincronizan automáticamente entre dispositivos. Para llevar tus datos a otro dispositivo, descarga una copia de seguridad (.json) desde la app actual e impórtala en el nuevo dispositivo usando el panel de Copias de seguridad.',
        tags: ['dispositivos', 'sincronización', 'backup'],
      },
      {
        id: 'g5',
        question: '¿Cómo cambio el idioma de la app?',
        answer:
          'La app está disponible únicamente en español por el momento. No hay opción de cambiar el idioma en esta versión.',
        tags: ['idioma', 'configuración'],
      },
      {
        id: 'g6',
        question: '¿Cómo activo el modo oscuro?',
        answer:
          'Haz clic en el icono de luna 🌙 en la barra superior derecha del header. Para volver al modo claro, haz clic en el icono de sol ☀️.',
        tags: ['modo oscuro', 'tema', 'apariencia'],
      },
      {
        id: 'g7',
        question: '¿Cómo reseteo la aplicación por completo?',
        answer:
          'Haz clic en el icono de papelera 🗑️ en el header. Aparecerá un panel de borrado selectivo donde puedes elegir qué datos eliminar. Si seleccionas todos los datos (cuentas, categorías, proyecciones, etc.), la app volverá al onboarding inicial. Te recomendamos descargar una copia de seguridad antes.',
        tags: ['reset', 'borrado', 'datos'],
      },
      {
        id: 'g8',
        question:
          '¿Qué significa el indicador de tipos de cambio en el header?',
        answer:
          '✅ Verde: tipos actualizados en las últimas 24h. ⚠️ Ámbar: usando tipos aproximados (sin conexión o error). Puedes hacer clic en el botón de divisas para ver el estado detallado y forzar una actualización.',
        tags: ['divisas', 'tipos de cambio', 'indicador'],
      },
    ],
  },
  {
    id: 'accounts',
    emoji: '🏦',
    label: 'Cuentas',
    color: '#2563eb',
    items: [
      {
        id: 'a1',
        question: '¿Por qué el saldo real es diferente al saldo que introduje?',
        answer:
          'El saldo real se calcula sumando al saldo base todos los movimientos reales (gastos e ingresos) con fecha de valor posterior a la fecha del saldo base. Si has registrado movimientos desde la última actualización del saldo, el saldo real reflejará esos cambios.',
        tags: ['saldo', 'cálculo', 'real'],
      },
      {
        id: 'a2',
        question: '¿Qué pasa cuando cambio la fecha del saldo base?',
        answer:
          'Al cambiar la fecha del saldo base, la app reconoce automáticamente todos los movimientos anteriores a esa fecha (los marca como "reconocidos"). Esto evita que se contabilicen dos veces: una en el saldo base que introduces y otra como movimiento real.',
        tags: ['saldo base', 'fecha', 'reconocidos'],
      },
      {
        id: 'a3',
        question: '¿Qué significa "movimientos ignorados"?',
        answer:
          'Son movimientos reales cuya fecha de valor es anterior o igual a la fecha del saldo base. Se consideran ya incluidos en el saldo base y no se suman al cálculo del saldo real. Si hay muchos, considera actualizar tu saldo base.',
        tags: ['ignorados', 'saldo base', 'movimientos'],
      },
      {
        id: 'a4',
        question: '¿Puedo tener cuentas en diferentes monedas?',
        answer:
          'Sí. Al crear o editar una cuenta, puedes seleccionar la divisa específica de esa cuenta (EUR, USD, GBP, etc.). Los importes se convierten automáticamente a tu divisa de visualización usando tipos de cambio en tiempo real.',
        tags: ['divisas', 'monedas', 'cuentas'],
      },
      {
        id: 'a5',
        question: '¿Qué pasa si elimino una cuenta?',
        answer:
          'Al eliminar una cuenta, también se eliminan todos sus movimientos reales, proyecciones y objetivos automáticos asociados. Esta acción no se puede deshacer, pero siempre puedes restaurar desde una copia de seguridad.',
        tags: ['eliminar', 'cuenta', 'datos asociados'],
      },
    ],
  },
  {
    id: 'expenses',
    emoji: '🧾',
    label: 'Gastos Reales',
    color: '#dc2626',
    items: [
      {
        id: 'e1',
        question:
          '¿Cuál es la diferencia entre fecha de apunte y fecha de valor?',
        answer:
          'La fecha de apunte es cuando realizas la operación (ej: pagas en una tienda el día 15). La fecha de valor es cuando el dinero sale o entra realmente en tu cuenta bancaria (puede ser el 17). Para el cálculo del saldo real se usa la fecha de valor.',
        tags: ['fecha', 'apunte', 'valor', 'cálculo'],
      },
      {
        id: 'e2',
        question: '¿Cómo importo movimientos desde mi banco?',
        answer:
          'Haz clic en "🏦 Importar CSV" en la sección Gastos Reales. Selecciona el formato de tu banco (Santander, BBVA, ING, etc.), sube el fichero CSV descargado desde tu banca online, revisa la vista previa y confirma la importación.',
        tags: ['importar', 'CSV', 'banco'],
      },
      {
        id: 'e3',
        question: '¿Qué pasa si aparece "Posible duplicado" en un movimiento?',
        answer:
          'La app detecta movimientos muy similares en importe, tipo y fecha. Si crees que no es un duplicado real, haz clic en el badge "⚠️ Posible duplicado ✕" para marcarlo como revisado y que desaparezca el aviso.',
        tags: ['duplicado', 'importación', 'aviso'],
      },
      {
        id: 'e4',
        question: '¿Puedo registrar movimientos en divisas diferentes?',
        answer:
          'Sí. Al añadir un movimiento, puedes seleccionar la divisa del importe. La app lo convertirá automáticamente a tu divisa de visualización. Útil para gastos de viaje o cuentas en otra moneda.',
        tags: ['divisas', 'monedas', 'movimientos'],
      },
      {
        id: 'e5',
        question:
          '¿Cómo funciona la auto-categorización en la importación CSV?',
        answer:
          'La app busca palabras clave en la descripción del movimiento para asignar automáticamente una categoría. Puedes configurar tus propias reglas desde el botón "🏷️ Reglas de categorías" dentro del importador CSV.',
        tags: ['categorización', 'auto', 'reglas', 'CSV'],
      },
      {
        id: 'e6',
        question: '¿Qué son los movimientos recurrentes automáticos?',
        answer:
          'Si activas "Es un cargo fijo confirmado" en una proyección, la app genera automáticamente el gasto real en la fecha configurada. Si ya existe un movimiento similar ese mes, lo detecta como posible duplicado y no lo genera.',
        tags: ['recurrente', 'automático', 'proyección'],
      },
    ],
  },
  {
    id: 'projections',
    emoji: '📈',
    label: 'Proyecciones',
    color: '#7c3aed',
    items: [
      {
        id: 'p1',
        question: '¿Cuál es la diferencia entre proyecciones y gastos reales?',
        answer:
          'Las proyecciones son estimaciones de ingresos y gastos futuros que planificas. Los gastos reales son movimientos que ya han ocurrido. Las proyecciones ayudan a calcular la previsión de saldos futuros.',
        tags: ['proyecciones', 'reales', 'diferencia'],
      },
      {
        id: 'p2',
        question: '¿Cómo calcula la app el mes actual en la previsión?',
        answer:
          'Para el mes actual, la app combina los movimientos reales ya registrados con el "residual" de las proyecciones. Si tu proyección de alquiler es 900€ y ya has registrado 900€ reales en esa categoría, el residual es 0€.',
        tags: ['previsión', 'mes actual', 'residual', 'cálculo'],
      },
      {
        id: 'p3',
        question: '¿Qué es el "ajuste para el próximo mes"?',
        answer:
          'Si un mes concreto el importe de una proyección será diferente (ej: la nómina tiene paga extra), puedes indicar el importe puntual usando el botón 💶. Al mes siguiente vuelve automáticamente al importe habitual.',
        tags: ['ajuste', 'importe puntual', 'próximo mes'],
      },
      {
        id: 'p4',
        question: '¿Por qué aparece "Posible duplicado" en una proyección?',
        answer:
          'Cuando una proyección marcada como "cargo fijo" intenta generar un gasto real pero ya existe un movimiento muy similar ese mes, la app lo detecta como posible duplicado y no lo genera. Revisa tus movimientos y proyecciones para confirmar.',
        tags: ['duplicado', 'cargo fijo', 'aviso'],
      },
      {
        id: 'p5',
        question: '¿Puedo tener proyecciones sin fecha de fin?',
        answer:
          'Sí, si no indicas fecha de fin, la proyección se aplica indefinidamente hacia el futuro. Útil para gastos fijos continuos como alquiler o suscripciones.',
        tags: ['fecha fin', 'proyección', 'indefinida'],
      },
    ],
  },
  {
    id: 'goals',
    emoji: '🎯',
    label: 'Objetivos',
    color: '#16a34a',
    items: [
      {
        id: 'ob1',
        question: '¿Cuándo debería usar el modo manual vs automático?',
        answer:
          'Usa el modo manual si guardas el dinero "mentalmente" o en efectivo sin un flujo específico. Usa el automático si tienes una categoría dedicada al ahorro (ej: transferencias a una cuenta de ahorro categorizada como "Ahorro / Inversión").',
        tags: ['manual', 'automático', 'modo'],
      },
      {
        id: 'ob2',
        question: '¿Cómo actualizo el importe ahorrado en modo manual?',
        answer:
          'Desde la tarjeta del objetivo, haz clic en "✏️ Actualizar importe ahorrado". También puedes editar el objetivo directamente desde el botón de lápiz.',
        tags: ['actualizar', 'manual', 'importe'],
      },
      {
        id: 'ob3',
        question: '¿Qué significa "Ritmo actual" y "Necesitas/mes"?',
        answer:
          '"Ritmo actual" es el promedio mensual de ahorro de los últimos 3 meses (solo en modo automático). "Necesitas/mes" es el importe mensual que necesitas ahorrar para alcanzar el objetivo antes de la fecha límite.',
        tags: ['ritmo', 'velocidad', 'cálculo'],
      },
      {
        id: 'ob4',
        question: '¿Qué pasa cuando llego al 100% de un objetivo?',
        answer:
          'La app genera automáticamente una alerta positiva de "¡Objetivo completado!" y la tarjeta del objetivo se muestra en verde con el mensaje de celebración. El objetivo permanece activo hasta que lo elimines.',
        tags: ['completado', 'alerta', '100%'],
      },
    ],
  },
  {
    id: 'alerts',
    emoji: '🔔',
    label: 'Alertas',
    color: '#d97706',
    items: [
      {
        id: 'al1',
        question: '¿Qué tipos de alertas genera la app?',
        answer:
          'La app genera alertas de: saldo crítico (ya bajo el mínimo), saldo en riesgo (caerá bajo el mínimo en <3 meses), presupuesto superado (gasto real > proyección), mes con balance negativo, objetivos en peligro, vencidos o completados.',
        tags: ['tipos', 'alertas', 'categorías'],
      },
      {
        id: 'al2',
        question:
          '¿Cuál es la diferencia entre "Descartar" e "Ignorar siempre"?',
        answer:
          '"Descartar" (✕) oculta la alerta hasta la próxima sesión o hasta que los datos cambien. "Ignorar siempre" (🚫) la oculta permanentemente aunque la condición persista. Puedes restaurar las alertas ignoradas desde el botón del header de Alertas.',
        tags: ['descartar', 'ignorar', 'alertas'],
      },
      {
        id: 'al3',
        question: '¿Las alertas se actualizan en tiempo real?',
        answer:
          'Sí. Las alertas se recalculan automáticamente cada vez que cambias datos (añades un movimiento, modificas una proyección, etc.). No necesitas hacer nada para actualizarlas.',
        tags: ['tiempo real', 'actualización', 'alertas'],
      },
    ],
  },
  {
    id: 'security',
    emoji: '🔐',
    label: 'Seguridad',
    color: '#f59e0b',
    items: [
      {
        id: 's1',
        question: '¿Olvidé mi contraseña. ¿Qué hago?',
        answer:
          'Desde la pantalla de bloqueo, usa una de estas opciones: 1) "🔑 Usar frase de recuperación" (las 12 palabras que guardaste al configurar la seguridad), 2) "📄 Usar fichero de recuperación" (.json descargado previamente), 3) "📧 Recuperar por email" (si configuraste un email de recuperación).',
        tags: ['contraseña', 'recuperación', 'olvidé'],
      },
      {
        id: 's2',
        question: '¿Qué es el TOTP y qué app usar?',
        answer:
          'TOTP (Time-based One-Time Password) es un código de 6 dígitos que cambia cada 30 segundos. Usa apps como Google Authenticator, Authy, Microsoft Authenticator o cualquier app compatible con códigos TOTP/2FA.',
        tags: ['TOTP', '2FA', 'autenticador', 'verificación'],
      },
      {
        id: 's3',
        question: '¿Puedo cambiar de contraseña a TOTP (o viceversa)?',
        answer:
          'Sí. Ve a Ajustes de seguridad (icono ⚙️ en el header) y haz clic en "🔄 Cambiar método de acceso". Deberás verificar tu método actual antes de configurar el nuevo.',
        tags: ['cambiar', 'método', 'contraseña', 'TOTP'],
      },
      {
        id: 's4',
        question: '¿Qué es la frase de recuperación de 12 palabras?',
        answer:
          'Es un conjunto de 12 palabras aleatorias generadas al configurar la seguridad. Permite recuperar el acceso a la app si olvidas tu contraseña. Guárdala en papel o en un gestor de contraseñas, nunca en el ordenador.',
        tags: ['frase', '12 palabras', 'recuperación'],
      },
      {
        id: 's5',
        question: '¿Qué es el período de gracia del TOTP?',
        answer:
          'Es el tiempo que puede pasar entre sesiones sin pedirte el código TOTP. Si abres la app dentro de ese período, entra directamente. Configurable desde "Pedir siempre" hasta "No volver a pedir".',
        tags: ['gracia', 'TOTP', 'período', 'sesión'],
      },
      {
        id: 's6',
        question:
          '¿Qué pasa si pierdo mi frase de recuperación Y mi contraseña?',
        answer:
          'Si pierdes ambas, no podrás acceder a la app. No existe ningún método de recuperación adicional. Por eso es fundamental guardar la frase en un lugar seguro y descargar el fichero de recuperación.',
        tags: ['perdido', 'recuperación', 'acceso'],
      },
    ],
  },
  {
    id: 'backup',
    emoji: '💾',
    label: 'Copias de seguridad',
    color: '#8b5cf6',
    items: [
      {
        id: 'b1',
        question: '¿Con qué frecuencia debo hacer copias de seguridad?',
        answer:
          'Recomendamos hacer una copia descargada (fichero .json) al menos una vez a la semana si usas la app regularmente. Guárdala en un lugar seguro como Google Drive, Dropbox o un USB. La app también hace copias automáticas en el historial interno.',
        tags: ['frecuencia', 'backup', 'recomendación'],
      },
      {
        id: 'b2',
        question:
          '¿Cuál es la diferencia entre el historial interno y el fichero descargado?',
        answer:
          'El historial interno se guarda en el navegador (hasta 50 copias). El fichero descargado es una copia física en tu ordenador. Si limpias el navegador, cambias de dispositivo o el disco falla, pierdes el historial pero conservas los ficheros descargados.',
        tags: ['historial', 'fichero', 'diferencia'],
      },
      {
        id: 'b3',
        question: '¿Cómo restauro una copia de seguridad?',
        answer:
          'Desde el panel de copias de seguridad (icono 📦 en el header): para restaurar del historial, haz clic en "🔄 Restaurar" en la copia que quieras. Para restaurar desde un fichero .json, usa "📂 Importar copia desde fichero".',
        tags: ['restaurar', 'recuperar', 'backup'],
      },
      {
        id: 'b4',
        question: '¿Puedo restaurar una copia en un dispositivo diferente?',
        answer:
          'Sí. Descarga una copia (.json) en el dispositivo original. Abre la app en el nuevo dispositivo, ve al panel de copias de seguridad y usa "📂 Importar copia desde fichero".',
        tags: ['dispositivo', 'migrar', 'transferir'],
      },
      {
        id: 'b5',
        question: '¿La restauración borra mis datos actuales?',
        answer:
          'Sí. Al restaurar, los datos actuales son reemplazados por los de la copia. La app guarda automáticamente una copia del estado actual antes de restaurar, por si necesitas volver atrás.',
        tags: ['restaurar', 'borrar', 'reemplazar'],
      },
    ],
  },
  {
    id: 'import',
    emoji: '🏦',
    label: 'Importación bancaria',
    color: '#0891b2',
    items: [
      {
        id: 'i1',
        question: '¿Qué bancos están soportados para importar CSV?',
        answer:
          'La app incluye formatos predefinidos para: Santander, BBVA, ING, CaixaBank, Revolut y Bankinter. Si tu banco no está en la lista, puedes crear un formato personalizado indicando el separador, formato de fecha y orden de columnas.',
        tags: ['bancos', 'soportados', 'CSV', 'compatibles'],
      },
      {
        id: 'i2',
        question: '¿Cómo descargo el extracto CSV de mi banco?',
        answer:
          'Accede a tu banca online → Movimientos / Extractos → Exportar / Descargar → Selecciona formato CSV. La ubicación exacta varía por banco. Para Revolut: Perfil → Extractos → CSV. Para Bankinter: el fichero es .xlsx, ábrelo en Excel y guárdalo como CSV.',
        tags: ['descargar', 'extracto', 'CSV', 'banco'],
      },
      {
        id: 'i3',
        question:
          '¿Cómo funciona la detección de duplicados en la importación?',
        answer:
          'La app compara cada movimiento del CSV con los ya existentes en base a: mismo importe, mismo tipo (ingreso/gasto) y fecha de valor similar (±2 días). Los detectados como posibles duplicados se marcan en ámbar. Puedes importarlos igualmente si no son duplicados.',
        tags: ['duplicados', 'detección', 'importación'],
      },
      {
        id: 'i4',
        question: '¿Puedo ajustar las filas de cabecera a saltar?',
        answer:
          'Sí. En el paso 2 de la importación, puedes ajustar el número de filas de cabecera usando los botones − y +. La línea marcada en verde es donde empieza la lectura de datos.',
        tags: ['cabecera', 'filas', 'ajuste', 'CSV'],
      },
    ],
  },
];

// ─── Atajos de teclado ────────────────────────────────────────────────────────

const SHORTCUTS: { category: string; items: Shortcut[] }[] = [
  {
    category: '📋 Generales',
    items: [
      { keys: ['Esc'], description: 'Cerrar modal o panel activo' },
      { keys: ['Enter'], description: 'Confirmar acción / Desbloquear app' },
    ],
  },
  {
    category: '🔐 Seguridad',
    items: [
      {
        keys: ['Enter'],
        description: 'Desbloquear app (en pantalla de bloqueo)',
      },
    ],
  },
  {
    category: '🖨️ Impresión',
    items: [
      {
        keys: ['Ctrl', 'P'],
        description: 'Imprimir / Guardar como PDF la sección actual',
      },
    ],
  },
  {
    category: '🌐 Navegación',
    items: [
      {
        keys: ['Tab'],
        description: 'Moverse entre campos del formulario activo',
      },
      {
        keys: ['Shift', 'Tab'],
        description: 'Retroceder entre campos del formulario',
      },
    ],
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

interface HelpCenterProps {
  T: any;
  securityEnabled?: boolean;
  onClose: () => void;
  onRestartTour: () => void;
  onNavigate: (tab: string) => void;
  onNavigateKeepOpen?: (tab: string) => void;
  onOpenSecurity: () => void;
  onOpenBackup: () => void;
  onRestartCoachTour?: () => void;
}

export function HelpCenter({
  T,
  securityEnabled = false,
  onClose,
  onRestartTour,
  onNavigate,
  onNavigateKeepOpen,
  onOpenSecurity,
  onOpenBackup,
  onRestartCoachTour,
  initialSection,
}: HelpCenterProps)
 {
  const [section, setSection] = useState<HelpSection>(initialSection ?? 'home');
  const [manualSection, setManualSection] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [navigatedAway, setNavigatedAway] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (manualSection) {
          setManualSection(null);
        } else if (section !== 'home') {
          setSection('home');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [section, manualSection, onClose]);

  // Focus en buscador al abrir FAQ
  useEffect(() => {
    if (section === 'faq' && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [section]);

  // Filtrado FAQ
  const filteredFAQ = useMemo(() => {
    const q = faqSearch.toLowerCase();
    return FAQ_CATEGORIES.filter(
      (cat) => faqCategory === 'all' || cat.id === faqCategory
    )
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            !q ||
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            item.tags.some((t) => t.includes(q))
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [faqSearch, faqCategory]);

  const totalResults = filteredFAQ.reduce((s, c) => s + c.items.length, 0);

  // ── Estilos ──────────────────────────────────────────────────────────────

  const isMobile = window.innerWidth < 768;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: isMobile && navigatedAway ? 'auto' : '7.5rem',
    bottom: 0,
    right: 0,
    left: isMobile && navigatedAway ? 0 : 'auto',
    width: '100%',
    maxWidth: isMobile ? '100%' : '34rem',
    height: isMobile && navigatedAway ? '45vh' : undefined,
    background: T.cardBg,
    borderLeft: isMobile ? 'none' : `1px solid ${T.cardBorder}`,
    borderTop: `1px solid ${T.cardBorder}`,
    boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
    zIndex: 60,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.3s ease both',
    borderRadius: '1rem 0 0 0',
  };

  const headerStyle: React.CSSProperties = {
    padding: isMobile ? '1rem' : '1.25rem 1.5rem',
    borderBottom: `1px solid ${T.cardBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    background: T.headerBg,
    flexShrink: 0,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: isMobile ? '1rem' : '1.25rem 1.5rem',
    paddingBottom: isMobile ? '5rem' : '1.25rem',
  };

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderRadius: '0.875rem',
    border: `1.5px solid ${active ? T.accent : T.cardBorder}`,
    background: active ? T.accentLight : T.pageBg,
    color: active ? T.accent : T.body,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    width: '100%',
  });

  const kbdStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0.5rem',
    borderRadius: '0.375rem',
    background: T.pageBg,
    border: `1.5px solid ${T.cardBorder}`,
    fontSize: '0.72rem',
    fontWeight: 700,
    color: T.body,
    fontFamily: 'monospace',
    boxShadow: `0 2px 0 ${T.cardBorder}`,
  };

  // ── Render Home ─────────────────────────────────────────────────────────

  const renderHome = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Hero */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '1.25rem',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          Centro de Ayuda
        </div>
        <div
          style={{
            fontSize: '0.825rem',
            color: '#93c5fd',
            marginTop: '0.25rem',
            lineHeight: 1.5,
          }}
        >
          Todo lo que necesitas para sacar el máximo partido a FinanzasHogar
        </div>
      </div>

      {/* Opciones principales */}
      {/* Tour */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: `1.5px solid ${T.greenBorder}`,
          background: T.greenBg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.875rem',
              background: T.green + '22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            🎬
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: '0.95rem', fontWeight: 800, color: T.green }}
            >
              Ver el tour de bienvenida
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.2rem',
              }}
            >
              Repasa la introducción guiada de la app
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              setTimeout(onRestartTour, 100);
            }}
            style={{
              padding: '0.55rem 1.125rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: T.green,
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ▶ Iniciar
          </button>
        </div>
      </div>

            {/* Guía de iconos del header */}
            {onRestartCoachTour && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1.5px solid #a5b4fc',
            background: T.dark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.875rem',
                background: '#6366f122',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              🎯
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6366f1' }}>
                Guía de iconos del header
              </div>
              <div style={{ fontSize: '0.775rem', color: T.muted, marginTop: '0.2rem' }}>
                Repasa para qué sirve cada botón de la barra superior
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                setTimeout(onRestartCoachTour, 400);
              }}
              style={{
                padding: '0.55rem 1.125rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: '#6366f1',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ▶ Iniciar
            </button>
          </div>
        </div>
      )}

{/* Primeros pasos */}
      <button
        onClick={() => setSection('getting-started')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: '1rem',
          border: '1.5px solid #fde68a',
          background: '#fffbeb',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
          width: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = T.cardShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.875rem',
            background: '#f59e0b22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          🚀
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e' }}
          >
            Guía de primeros pasos
          </div>
          <div
            style={{
              fontSize: '0.775rem',
              color: T.muted,
              marginTop: '0.2rem',
            }}
          >
            8 pasos para dominar FinanzasHogar en ~25 minutos
          </div>
        </div>
        <ChevronRight size={16} color="#92400e" style={{ flexShrink: 0 }} />
      </button>

      {[
        {
          id: 'faq' as HelpSection,
          emoji: '💬',
          title: 'Preguntas frecuentes',
          desc: `${FAQ_CATEGORIES.reduce(
            (s, c) => s + c.items.length,
            0
          )} preguntas con buscador y categorías`,
          color: '#7c3aed',
          bg: '#f5f3ff',
          border: '#ddd6fe',
        },
        {
          id: 'manual' as HelpSection,
          emoji: '📖',
          title: 'Manual de usuario',
          desc: 'Guía completa de todas las funcionalidades',
          color: '#2563eb',
          bg: '#eff6ff',
          border: '#bfdbfe',
        },
        {
          id: 'shortcuts' as HelpSection,
          emoji: '⌨️',
          title: 'Atajos de teclado',
          desc: 'Navega y actúa más rápido con el teclado',
          color: '#0891b2',
          bg: '#ecfeff',
          border: '#a5f3fc',
        },
      ].map((opt) => (
        <button
          key={opt.id}
          onClick={() => setSection(opt.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: `1.5px solid ${opt.border}`,
            background: T.dark ? T.accentLight : opt.bg,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = T.cardShadow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.875rem',
              background: opt.color + '22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            {opt.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: '0.95rem', fontWeight: 800, color: opt.color }}
            >
              {opt.title}
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: T.muted,
                marginTop: '0.2rem',
              }}
            >
              {opt.desc}
            </div>
          </div>
          <ChevronRight size={16} color={opt.color} style={{ flexShrink: 0 }} />
        </button>
      ))}

      {/* Nota de privacidad */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.72rem',
          color: T.muted,
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        🔒 Todos tus datos se guardan solo en tu dispositivo. Nunca se envían a
        ningún servidor.
      </div>
    </div>
  );

  // ── Render Manual ───────────────────────────────────────────────────────

  const renderManual = () => {
    if (manualSection) {
      const sec = MANUAL_SECTIONS.find((s) => s.id === manualSection);
      if (!sec) return null;
      const Icon = sec.icon;
      return (
        <div>
          {/* Cabecera sección */}
          <button
            onClick={() => setManualSection(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.625rem',
              border: `1px solid ${T.cardBorder}`,
              background: T.btnSecBg,
              color: T.muted,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1.25rem',
            }}
          >
            ← Volver al manual
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '1.25rem',
              borderRadius: '1rem',
              background: sec.color + '15',
              border: `1.5px solid ${sec.color}33`,
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.875rem',
                background: sec.color + '22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              {sec.emoji}
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: sec.color,
                }}
              >
                {sec.title}
              </div>
              <div
                style={{
                  fontSize: '0.775rem',
                  color: T.muted,
                  marginTop: '0.2rem',
                }}
              >
                {sec.subtitle}
              </div>
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {sec.content.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '1.125rem',
                  borderRadius: '0.875rem',
                  background: T.pageBg,
                  border: `1px solid ${T.cardBorder}`,
                }}
              >
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: T.title,
                    marginBottom: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      background: sec.color,
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {item.heading}
                </div>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: T.body,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {item.text}
                </p>
                {item.tip && (
                  <div
                    style={{
                      marginTop: '0.875rem',
                      padding: '0.75rem 0.875rem',
                      borderRadius: '0.625rem',
                      background: item.tip.startsWith('⚠️')
                        ? T.amberBg
                        : T.accentLight,
                      border: `1px solid ${
                        item.tip.startsWith('⚠️')
                          ? T.amberBorder
                          : T.accent + '33'
                      }`,
                      fontSize: '0.775rem',
                      color: item.tip.startsWith('⚠️') ? T.amber : T.accent,
                      lineHeight: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {item.tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: T.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.875rem',
          }}
        >
          Selecciona una sección
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {MANUAL_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setManualSection(sec.id)}
                style={navBtnStyle(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = sec.color + '66';
                  e.currentTarget.style.background = sec.color + '0a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.cardBorder;
                  e.currentTarget.style.background = T.pageBg;
                }}
              >
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.625rem',
                    background: sec.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    flexShrink: 0,
                  }}
                >
                  {sec.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: T.title,
                    }}
                  >
                    {sec.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: T.muted,
                      marginTop: '0.1rem',
                    }}
                  >
                    {sec.content.length} secciones
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  color={T.muted}
                  style={{ flexShrink: 0 }}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render FAQ ─────────────────────────────────────────────────────────

  const renderFAQ = () => (
    <div>
      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search
          size={16}
          color={T.muted}
          style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar en las preguntas frecuentes..."
          value={faqSearch}
          onChange={(e) => setFaqSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0.875rem 0.75rem 2.5rem',
            borderRadius: '0.875rem',
            border: `1.5px solid ${faqSearch ? T.accent : T.inputBorder}`,
            background: T.inputBg,
            color: T.inputText,
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
        {faqSearch && (
          <button
            onClick={() => setFaqSearch('')}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.muted,
              fontSize: '0.8rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtro por categoría */}
      <div
        style={{
          display: 'flex',
          gap: '0.375rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        <button
          onClick={() => setFaqCategory('all')}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            border:
              faqCategory === 'all' ? 'none' : `1px solid ${T.cardBorder}`,
            background: faqCategory === 'all' ? T.accent : T.pageBg,
            color: faqCategory === 'all' ? '#fff' : T.muted,
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Todas
        </button>
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setFaqCategory(faqCategory === cat.id ? 'all' : cat.id)
            }
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              border:
                faqCategory === cat.id ? 'none' : `1px solid ${T.cardBorder}`,
              background: faqCategory === cat.id ? cat.color : T.pageBg,
              color: faqCategory === cat.id ? '#fff' : T.muted,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      {faqSearch && (
        <div
          style={{
            fontSize: '0.72rem',
            color: T.muted,
            marginBottom: '0.875rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: T.accentLight,
            border: `1px solid ${T.accent}33`,
          }}
        >
          🔍 {totalResults} resultado{totalResults !== 1 ? 's' : ''} para "
          {faqSearch}"
        </div>
      )}

      {/* Lista de preguntas */}
      {filteredFAQ.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: T.muted,
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <div
            style={{ fontSize: '0.875rem', fontWeight: 700, color: T.title }}
          >
            Sin resultados
          </div>
          <div style={{ fontSize: '0.775rem', marginTop: '0.25rem' }}>
            Prueba con otras palabras
          </div>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {filteredFAQ.map((cat) => (
            <div key={cat.id}>
              {/* Cabecera categoría */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.625rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${cat.color}33`,
                }}
              >
                <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: cat.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {cat.label}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: cat.color + '18',
                    color: cat.color,
                  }}
                >
                  {cat.items.length}
                </span>
              </div>

              {/* Preguntas */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                }}
              >
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: '0.875rem',
                      border: `1px solid ${
                        expandedFAQ === item.id
                          ? cat.color + '44'
                          : T.cardBorder
                      }`,
                      background:
                        expandedFAQ === item.id ? cat.color + '08' : T.pageBg,
                      overflow: 'hidden',
                      transition: 'all 0.15s',
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpandedFAQ(expandedFAQ === item.id ? null : item.id)
                      }
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: expandedFAQ === item.id ? cat.color : T.title,
                          flex: 1,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.question}
                      </span>
                      {expandedFAQ === item.id ? (
                        <ChevronDown
                          size={14}
                          color={cat.color}
                          style={{ flexShrink: 0 }}
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          color={T.muted}
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </button>
                    {expandedFAQ === item.id && (
                      <div
                        style={{
                          padding: '0 1rem 1rem',
                          animation: 'fadeSlideIn 0.15s ease both',
                        }}
                      >
                        <div
                          style={{
                            height: '1px',
                            background: cat.color + '22',
                            marginBottom: '0.875rem',
                          }}
                        />
                        <p
                          style={{
                            fontSize: '0.825rem',
                            color: T.body,
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          {item.answer}
                        </p>
                        {/* Tags */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.375rem',
                            flexWrap: 'wrap',
                            marginTop: '0.75rem',
                          }}
                        >
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={() => {
                                setFaqSearch(tag);
                                setExpandedFAQ(null);
                              }}
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: T.cardBg,
                                border: `1px solid ${T.cardBorder}`,
                                color: T.muted,
                                cursor: 'pointer',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Render Shortcuts ───────────────────────────────────────────────────

  const renderShortcuts = () => (
    <div>
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.accentLight,
          border: `1px solid ${T.accent}33`,
          fontSize: '0.775rem',
          color: T.accent,
          marginBottom: '1.5rem',
          lineHeight: 1.5,
        }}
      >
        💡 Estos atajos funcionan cuando el foco está en la aplicación (no
        dentro de un campo de texto).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {SHORTCUTS.map((group, gi) => (
          <div key={gi}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: T.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.625rem',
              }}
            >
              {group.category}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {group.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background: T.pageBg,
                    border: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <span
                    style={{ fontSize: '0.825rem', color: T.body, flex: 1 }}
                  >
                    {item.description}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      alignItems: 'center',
                    }}
                  >
                    {item.keys.map((key, ki) => (
                      <span
                        key={ki}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {ki > 0 && (
                          <span style={{ fontSize: '0.65rem', color: T.muted }}>
                            +
                          </span>
                        )}
                        <kbd style={kbdStyle}>{key}</kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nota sobre accesibilidad */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.875rem 1rem',
          borderRadius: '0.875rem',
          background: T.pageBg,
          border: `1px solid ${T.cardBorder}`,
          fontSize: '0.72rem',
          color: T.muted,
          lineHeight: 1.6,
        }}
      >
        ⌨️ La app está optimizada para navegación con teclado. Usa Tab para
        moverte entre los campos de los formularios.
      </div>
    </div>
  );

  // ── Título de sección activa ──────────────────────────────────────────

  const sectionTitles = {
    home: { title: 'Centro de Ayuda', emoji: '❓' },
    'getting-started': { title: 'Guía de primeros pasos', emoji: '🚀' },
    manual: {
      title: manualSection
        ? MANUAL_SECTIONS.find((s) => s.id === manualSection)?.title ?? 'Manual'
        : 'Manual de usuario',
      emoji: '📖',
    },
    faq: { title: 'Preguntas frecuentes', emoji: '💬' },
    shortcuts: { title: 'Atajos de teclado', emoji: '⌨️' },
  };

  const currentTitle = sectionTitles[section];

  // ── Render principal ──────────────────────────────────────────────────

  return (
    <>
      {/* Overlay */}
      {!navigatedAway && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 59,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease both',
          }}
        />
      )}

      {/* Panel */}
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {section !== 'home' && (
              <button
                onClick={() => {
                  if (manualSection) {
                    setManualSection(null);
                  } else {
                    setSection('home');
                  }
                }}
                style={{
                  padding: '0.4rem 0.625rem',
                  borderRadius: '0.5rem',
                  border: `1px solid rgba(255,255,255,0.15)`,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#93c5fd',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ←
              </button>
            )}
            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                {currentTitle.emoji} {currentTitle.title}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  marginTop: '0.1rem',
                }}
              >
                FinanzasHogar · Ayuda
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem',
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs de navegación (cuando no estamos en home) */}
        {section !== 'home' && (
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${T.cardBorder}`,
              background: T.pageBg,
              flexShrink: 0,
            }}
          >
            {(
              [
                { id: 'getting-started', emoji: '🚀', label: 'Primeros pasos' },
                { id: 'faq', emoji: '💬', label: 'FAQ' },
                { id: 'manual', emoji: '📖', label: 'Manual' },
                { id: 'shortcuts', emoji: '⌨️', label: 'Atajos' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSection(tab.id);
                  setManualSection(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: section === tab.id ? T.accent : T.muted,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom:
                    section === tab.id
                      ? `2px solid ${T.accent}`
                      : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        <div style={contentStyle}>
          {section === 'home' && renderHome()}
          {section === 'getting-started' && (
            <GettingStarted
              T={T}
              securityEnabled={securityEnabled}
              onNavigate={onNavigate}
              onNavigateKeepOpen={(tab) => {
                setNavigatedAway(true);
                onNavigateKeepOpen?.(tab);
              }}
              onOpenSecurity={onOpenSecurity}
              onOpenBackup={onOpenBackup}
              onClose={onClose}
            />
          )}
          {section === 'manual' && renderManual()}
          {section === 'faq' && renderFAQ()}
          {section === 'shortcuts' && renderShortcuts()}
        </div>
      </div>
    </>
  );
}
