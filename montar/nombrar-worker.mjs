/**
 * A-3 — EL NOMBRE DEL WORKER, PUESTO POR EL FLUJO Y SIN TECLADO
 * ---------------------------------------------------------------------------
 *   node montar/nombrar-worker.mjs
 *   node montar/nombrar-worker.mjs --revisar   (no escribe; falla si no cuadra)
 *
 * POR QUÉ EXISTE.
 * El `name` de `wrangler.jsonc` es lo ÚNICO de este repositorio que puede hacer
 * daño FUERA de él: dos tiendas con el mismo nombre son el mismo Worker en
 * Cloudflare, así que desplegar la segunda PISA la primera — y nada avisa, las
 * dos siguen desplegando en verde. Crear un repositorio desde la plantilla y no
 * acordarse de cambiarlo es exactamente el camino normal.
 *
 * Hasta hoy lo arreglaba solo `npm run tienda`, una herramienta con una persona
 * delante. `DESPLIEGUE.md` lo compensaba con un aviso en negrita —«editar
 * wrangler.jsonc antes del primer despliegue, con el lápiz del editor web»—, y
 * un paso manual que hay que recordar es un paso que un día no se recuerda.
 * Esta historia lo mueve al flujo, que es el único que corre siempre.
 *
 * DE DÓNDE SALE EL NOMBRE DEL COMERCIO, Y POR QUÉ DE AHÍ.
 * De `publicar/catalogo.json`, que `catalogo-estatico.mjs` acaba de hornear en
 * este mismo flujo, unos segundos antes. NO se le vuelve a preguntar al
 * maestro: sería la cuarta lectura del mismo dato en una corrida —justo lo que
 * el hito M1 existe para recortar— y, de dos lecturas, una se queda atrás
 * (patrón 2). Es la misma decisión que tomó `sembrar-respaldo.mjs`, por la
 * misma razón.
 *
 * LA REGLA DE SIEMPRE: o se escribe entero, o no se escribe nada. Y si el
 * catálogo no está o no dice el nombre, esto FALLA en vez de inventarse un
 * apodo: un Worker con el nombre equivocado es peor que uno sin renombrar,
 * porque el sin renombrar se nota al desplegar y el equivocado pisa a otra
 * tienda en silencio.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const WRANGLER = 'wrangler.jsonc';
const CATALOGO = 'publicar/catalogo.json';
const revisar = process.argv.includes('--revisar');

export const ESCRIBE = [WRANGLER];

/* EL APODO VIVE AQUÍ Y EN NINGÚN OTRO SITIO. Lo usan este flujo y
   `npm run tienda`; escrito dos veces, un día uno recorta a 40 caracteres y el
   otro a 30, y dos tiendas que se llamaban distinto pasan a llamarse igual —que
   es precisamente el daño que todo esto existe para evitar. */
export function apodo(negocio) {
  return String(negocio || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // fuera los acentos
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40) || 'tienda';
}

export function nombreEn(texto) {
  return (String(texto).match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || '';
}

/* SIN PREGUNTAR POR TECLADO (A-3): el nombre se deriva del negocio, así que no
   hay nada que decidir — y preguntar s/n aquí es justo lo que deja esto colgado
   para siempre en un flujo sin terminal delante. Si el sitio ya tiene su nombre
   propio, tampoco hay nada que tocar: seguiría siendo el mismo apodo. Solo se
   escribe cuando cambia. */
export function revisarNombreDelWorker(negocio) {
  let texto;
  try { texto = readFileSync(WRANGLER, 'utf8'); } catch { return ''; }
  const actual = nombreEn(texto);
  const debido = apodo(negocio);
  if (!actual || actual === debido) return '';

  writeFileSync(WRANGLER, texto.replace(/("name"\s*:\s*)"[^"]+"/, '$1"' + debido + '"'));
  console.log('  ✓ ' + WRANGLER + '  ->  ' + debido +
              (actual === 'tienda-sin-configurar' ? '' :
               '  (antes: "' + actual + '" — si dos tiendas comparten cuenta de' +
               ' Cloudflare, revisa que no haya quedado ninguna con este nombre)'));
  return debido;
}

async function principal() {
  let negocio = '';
  try {
    negocio = String(JSON.parse(await readFile(CATALOGO, 'utf8')).config?.negocio || '').trim();
  } catch {
    console.error('\nNo se pudo leer ' + CATALOGO + '. Este paso va DESPUÉS de\n' +
                  'hornear el catálogo, que es de donde sale el nombre del comercio.\n');
    process.exit(1);
  }
  if (!negocio) {
    console.error('\nEl catálogo horneado no dice cómo se llama el comercio\n' +
                  '(config.negocio está vacío). No se renombra el Worker a ciegas:\n' +
                  'un nombre inventado puede pisar la tienda de otro comercio.\n' +
                  'Escribe "negocio" en la pestaña Configuración de la hoja.\n');
    process.exit(1);
  }

  const debido = apodo(negocio);
  const actual = nombreEn(await readFile(WRANGLER, 'utf8'));

  if (revisar) {
    console.log(actual === debido
      ? `El Worker ya se llama como el comercio ("${debido}").`
      : `El Worker se llama "${actual}" y debería llamarse "${debido}".`);
    process.exitCode = actual === debido ? 0 : 1;
    return;
  }

  if (actual === debido) {
    console.log(`Nada que cambiar: el Worker ya se llama "${debido}".`);
    return;
  }

  await writeFile(WRANGLER,
    (await readFile(WRANGLER, 'utf8')).replace(/("name"\s*:\s*)"[^"]+"/, '$1"' + debido + '"'));
  console.log(`Worker renombrado: "${actual}" -> "${debido}"  (${negocio})`);
  if (actual && actual !== 'tienda-sin-configurar') {
    console.log('Si varias tiendas comparten cuenta de Cloudflare, comprueba que' +
                ' ninguna otra se haya quedado con "' + actual + '".');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  principal().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
