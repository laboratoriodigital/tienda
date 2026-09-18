/**
 * TIENDA — ¿el sitio de Cloudflare tiene nombre propio?
 * ---------------------------------------------------------------------------
 *
 *   node montar/revisar-worker.mjs
 *
 * POR QUÉ EXISTE
 * wrangler.jsonc trae de fábrica "tienda-sin-configurar" como `name` — el
 * marcador que deja la semilla para que sea imposible desplegar sin haberlo
 * visto. `npm run tienda` lo cambia solo, con el nombre del comercio que ya
 * conoce el maestro (ver montar/configurar-tienda.mjs, historia A-3). Pero
 * nada obligaba a correr `npm run tienda` antes de subir el repositorio:
 * crear uno desde la plantilla y hacer push directo se lo salta entero.
 *
 * Y el nombre del sitio es lo único de este repositorio que puede hacer daño
 * FUERA de él: dos sitios con el mismo nombre son el MISMO sitio en
 * Cloudflare para quien tenga varias tiendas en la misma cuenta — desplegar
 * uno pisaría al otro. Este archivo se planta antes de que eso pase.
 *
 * NO BLOQUEA a la propia semilla: ahí "tienda-sin-configurar" es el valor
 * correcto. Se distingue mirando en qué repositorio está corriendo esto —la
 * misma comprobación que ya hace release.yml— y, fuera de Actions, no hay con
 * qué compararlo, así que tampoco bloquea (el mismo criterio de
 * montar/misma-tienda.mjs: un guardia que no puede contestar no es guardia,
 * es una puerta cerrada).
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const WRANGLER = 'wrangler.jsonc';
const MARCADOR = 'tienda-sin-configurar';
const SEMILLA  = 'laboratoriodigital/tienda';

/* No escribe nada: solo lee wrangler.jsonc y compara nombres. */
export const ESCRIBE = [];

export function nombreEnWrangler(texto) {
  return (String(texto || '').match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || '';
}

/** repo: normalmente process.env.GITHUB_REPOSITORY (vacío fuera de Actions). */
export function veredicto(nombre, repo) {
  if (!repo) return { estado: 'sin-contexto' };
  if (repo === SEMILLA) return { estado: 'es-la-semilla' };
  if (!nombre) return { estado: 'vacio' };
  if (nombre === MARCADOR) return { estado: 'sin-configurar' };
  return { estado: 'configurado', nombre };
}

function main() {
  let texto = '';
  try { texto = readFileSync(WRANGLER, 'utf8'); }
  catch {
    console.error('\nNo encuentro ' + WRANGLER + ' en la raíz del repositorio.\n');
    process.exit(1);
  }

  const r = veredicto(nombreEnWrangler(texto), process.env.GITHUB_REPOSITORY);

  if (r.estado === 'sin-configurar' || r.estado === 'vacio') {
    console.error(
      '\nEL SITIO DE ESTE REPOSITORIO NO TIENE NOMBRE PROPIO.\n\n' +
      '  ' + WRANGLER + (r.estado === 'vacio'
        ? ' no dice cómo se llama el sitio.\n\n'
        : ' todavía dice "' + MARCADOR + '", el marcador que deja la\n  semilla.\n\n') +
      '  Dos sitios con el mismo nombre son el MISMO sitio en Cloudflare para\n' +
      '  quien tenga más de una tienda en la misma cuenta: desplegar este\n' +
      '  pisaría a cualquier otro que tampoco lo haya cambiado.\n\n' +
      '  Corre  npm run tienda  en tu equipo — lo cambia solo, con el nombre\n' +
      '  del comercio que ya conoce el maestro.\n');
    process.exit(1);
  }

  if (r.estado === 'es-la-semilla') {
    console.log('Esta es la semilla: "' + MARCADOR + '" es lo correcto aquí.');
    return;
  }
  if (r.estado === 'sin-contexto') {
    console.log('Fuera de Actions no hay con qué comparar. Nada que comprobar.');
    return;
  }
  console.log('El sitio se llama "' + r.nombre + '". Tiene nombre propio.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
