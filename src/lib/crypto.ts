import CryptoJS from 'crypto-js';

// ─── Wordlist para frase de 12 palabras ──────────────────────────────────────
export const WORDLIST = [
  'ábaco',
  'abdomen',
  'abeja',
  'abierto',
  'abogado',
  'abono',
  'aborto',
  'abrazo',
  'abrir',
  'abuelo',
  'acabar',
  'academia',
  'acceso',
  'acción',
  'aceite',
  'acelga',
  'acento',
  'aceptar',
  'ácido',
  'aclarar',
  'acné',
  'acoger',
  'acoso',
  'activo',
  'acto',
  'actriz',
  'actuar',
  'acudir',
  'acuerdo',
  'acusar',
  'adicto',
  'admitir',
  'adoptar',
  'adorno',
  'adquirir',
  'adulto',
  'aéreo',
  'afectar',
  'afición',
  'agencia',
  'agitar',
  'agonía',
  'agosto',
  'agotar',
  'agregar',
  'agrio',
  'agua',
  'agudo',
  'águila',
  'aguja',
  'ahogo',
  'ahorro',
  'aire',
  'aísla',
  'ajedrez',
  'ajeno',
  'ajuste',
  'alacrán',
  'alambre',
  'alarma',
  'alba',
  'álbum',
  'alcalde',
  'aldea',
  'alerta',
  'aleta',
  'alfiler',
  'alga',
  'algodón',
  'alivio',
  'alma',
  'almeja',
  'almíbar',
  'altar',
  'alteza',
  'altivo',
  'alto',
  'altura',
  'alumno',
  'alzar',
  'amable',
  'amante',
  'amapola',
  'amargo',
  'ambos',
  'ámbito',
  'ameno',
  'amigo',
  'amistad',
  'amor',
  'amparo',
  'amplio',
  'ancho',
  'anciano',
  'ancla',
  'ángel',
  'ángulo',
  'anillo',
  'ánimo',
  'anís',
  'antena',
  'antiguo',
  'antojo',
  'anual',
  'anzuelo',
  'añadir',
  'apagar',
  'aparato',
  'apetito',
  'apio',
  'aplicar',
  'apodo',
  'aporte',
  'apoyar',
  'aprender',
  'aptitud',
  'árbol',
  'arbusto',
  'ardilla',
  'arduo',
  'área',
  'árido',
  'arma',
  'arpa',
  'arrozal',
  'arte',
  'artista',
  'asco',
  'asegurar',
  'aseo',
  'asesor',
  'asiento',
  'asilo',
  'asistir',
  'asno',
  'aspecto',
  'áspero',
  'astilla',
  'astro',
  'astuto',
  'asumir',
  'asunto',
  'atacar',
  'atento',
  'ateo',
  'ático',
  'atleta',
  'átomo',
  'atraer',
  'atroz',
  'atún',
  'audaz',
  'auge',
  'aula',
  'ausente',
  'autor',
  'avance',
  'avaro',
  'ave',
  'avellana',
  'avena',
  'avión',
  'aviso',
  'ayer',
  'ayuda',
  'azafrán',
  'azote',
  'azúcar',
  'azufre',
  'azul',
  'baba',
  'bagaje',
  'baile',
  'bajar',
  'balanza',
  'balcón',
  'balde',
  'bambú',
  'banco',
  'banda',
  'bañar',
  'barco',
  'barro',
  'báscula',
  'bastón',
  'batalla',
  'batería',
  'batir',
  'beber',
  'béisbol',
  'belleza',
  'besar',
  'bello',
  'biblioteca',
  'bien',
  'bígaro',
  'billar',
  'bisonte',
  'blasón',
  'blindar',
  'bloque',
  'bocina',
  'bola',
  'boleto',
  'bolsa',
  'bomba',
  'bondad',
  'bonito',
  'borrar',
  'bosque',
  'bote',
  'botín',
  'bóveda',
  'bravo',
  'brecha',
  'brillo',
  'brinco',
  'brisa',
  'broca',
  'broma',
  'bronce',
  'brújula',
  'brusco',
  'bruto',
  'bucle',
  'bueno',
  'buey',
  'búfalo',
  'búho',
  'bulto',
  'buque',
  'burro',
  'buscar',
  'butaca',
  'buzón',
  'caballo',
  'cabina',
  'cacao',
  'cadena',
  'caída',
  'caimán',
  'caja',
  'cajón',
  'cálculo',
  'caldo',
  'calidad',
  'calle',
  'calma',
  'calor',
  'calvo',
  'cama',
  'cambio',
  'camello',
  'camino',
  'campo',
  'cáncer',
  'candil',
  'caña',
  'cañón',
  'caoba',
  'caos',
  'capaz',
  'capitán',
  'capote',
  'captar',
  'capucha',
  'cara',
  'carbón',
  'cárcel',
  'cargar',
  'caries',
  'carne',
  'carpeta',
  'carro',
  'carta',
  'caspa',
  'caudal',
  'causar',
  'caverna',
  'cazar',
  'cebra',
  'ceder',
  'cedro',
  'celda',
  'célebre',
  'celoso',
  'célula',
  'cenar',
  'cenicero',
  'centro',
  'cerca',
  'cerdo',
  'cerebro',
  'certeza',
  'césped',
  'cetro',
  'ciclo',
  'ciego',
  'cierto',
  'cifra',
  'cigarro',
  'cima',
  'cinco',
  'cine',
  'cinta',
  'ciprés',
  'circo',
  'ciruela',
  'cisne',
  'ciudad',
  'claro',
  'clavo',
  'cliente',
  'clima',
  'clínica',
  'cobre',
  'cocer',
  'código',
  'codo',
  'cofre',
  'coger',
  'cohete',
  'cojín',
  'colegio',
  'colgar',
  'colina',
  'collar',
  'colmo',
  'columna',
  'combate',
  'comer',
  'cómodo',
  'compra',
  'conde',
  'conejo',
  'conga',
  'conocer',
  'consejo',
  'contar',
  'copa',
  'copia',
  'corazón',
  'corbata',
  'corcho',
  'cordón',
  'corona',
  'correr',
  'corteza',
  'cosmos',
  'costa',
  'precio',
  'crear',
  'crecer',
  'creído',
  'crimen',
  'cripta',
  'crisis',
  'cristal',
  'criterio',
  'cromo',
  'crónica',
  'cruce',
  'cuadro',
  'cuarto',
  'cuatro',
  'cubeta',
  'cubierta',
  'cúbico',
  'cúpula',
  'cuerdo',
  'cuerpo',
  'cuidar',
  'culpa',
  'culto',
  'cumbre',
];

// ─── Helpers de cifrado ───────────────────────────────────────────────────────
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// 🔴 FIX 3 — Iteraciones aumentadas de 10.000 a 100.000 (OWASP mínimo 2024)
export function hashPassword(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100_000,
  }).toString();
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  return hashPassword(password, salt) === hash;
}

// ─── Helpers de frase de recuperación ────────────────────────────────────────
export function generateRecoveryPhrase(): string {
  const array = new Uint32Array(12);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((n) => WORDLIST[n % WORDLIST.length])
    .join(' ');
}

export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashPhrase(phrase: string, salt: string): string {
  return hashPassword(normalizePhrase(phrase), salt);
}

export function verifyPhrase(
  phrase: string,
  hash: string,
  salt: string
): boolean {
  return hashPhrase(normalizePhrase(phrase), salt) === hash;
}

// ─── Helpers TOTP ─────────────────────────────────────────────────────────────
export function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0,
    value = 0,
    index = 0;
  const output = new Uint8Array(Math.floor((clean.length * 5) / 8));
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

export async function hotp(
  secret: Uint8Array,
  counter: number
): Promise<string> {
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, counterBytes);
  const arr = new Uint8Array(sig);
  const offset = arr[19] & 0x0f;
  const code =
    (((arr[offset] & 0x7f) << 24) |
      ((arr[offset + 1] & 0xff) << 16) |
      ((arr[offset + 2] & 0xff) << 8) |
      (arr[offset + 3] & 0xff)) %
    1000000;
  return code.toString().padStart(6, '0');
}

export async function verifyTOTP(
  secret: string,
  token: string
): Promise<boolean> {
  const secretBytes = base32ToBytes(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    const expected = await hotp(secretBytes, counter + delta);
    if (expected === token.trim()) return true;
  }
  return false;
}

// ─── Helpers de email ─────────────────────────────────────────────────────────
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_MAX_RESENDS = 3;
const EMAIL_SESSION_KEY = 'fh_email_code_session';

// 🔴 FIX 2 — Sesión de email en sessionStorage (persiste entre recargas de página)
type EmailCodeSession = {
  code: string;
  expiresAt: number;
  email: string;
  resends: number;
};

function getEmailSession(): EmailCodeSession | null {
  try {
    const raw = sessionStorage.getItem(EMAIL_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as EmailCodeSession;
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(EMAIL_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setEmailSession(session: EmailCodeSession | null): void {
  try {
    if (session === null) {
      sessionStorage.removeItem(EMAIL_SESSION_KEY);
    } else {
      sessionStorage.setItem(EMAIL_SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    console.warn('[Email] No se pudo guardar la sesión de código.');
  }
}

export function generateEmailCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendEmailCode(
  toEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const session = getEmailSession();

  if (
    session &&
    session.email === toEmail &&
    session.resends >= EMAIL_MAX_RESENDS
  ) {
    return { ok: false, error: 'Has alcanzado el límite de reenvíos.' };
  }

  const code = generateEmailCode();
  setEmailSession({
    code,
    expiresAt: Date.now() + EMAIL_CODE_TTL_MS,
    email: toEmail,
    resends: (session?.email === toEmail ? session.resends : 0) + 1,
  });

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: '10837e48-e398-49d2-bf7d-7bd8d37cc5da',
        subject: '🔐 Código de recuperación — FinanzasHogar',
        from_name: 'FinanzasHogar App',
        message: `CÓDIGO DE RECUPERACIÓN DE SEGURIDAD\n\nEmail registrado: ${toEmail}\nCódigo de verificación: ${code}\n\nEste código caduca en 10 minutos.\n\nSi no reconoces esta solicitud, ignora este mensaje.`,
      }),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { ok: true };
    } else {
      console.error('[Web3Forms]', data);
      return { ok: false, error: 'No se pudo enviar el email. Inténtalo de nuevo.' };
    }
  } catch (err) {
    console.error('[Web3Forms]', err);
    return { ok: false, error: 'No se pudo enviar el email. Inténtalo de nuevo.' };
  }
}

export function verifyEmailCode(inputCode: string): {
  ok: boolean;
  error?: string;
} {
  const session = getEmailSession();
  if (!session) return { ok: false, error: 'No hay ningún código activo.' };
  if (Date.now() > session.expiresAt) {
    setEmailSession(null);
    return { ok: false, error: 'El código ha caducado. Solicita uno nuevo.' };
  }
  if (inputCode.trim() !== session.code) {
    return { ok: false, error: 'Código incorrecto. Inténtalo de nuevo.' };
  }
  setEmailSession(null);
  return { ok: true };
}
