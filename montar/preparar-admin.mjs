/**
 * D-2 — EL PANEL SE HORNEA CON LA DIRECCIÓN DE SU TIENDA
 * ---------------------------------------------------------------------------
 *   node montar/preparar-admin.mjs
 *   node montar/preparar-admin.mjs --revisar   (no escribe; falla si cambió)
 *
 * `plantilla/admin.html` es igual para todas las tiendas. Lo único que la hace
 * de UNA tienda es a qué maestro le habla, y el nombre que enseña arriba.
 *
 * DE DÓNDE SALEN, Y POR QUÉ DE AHÍ. Del `publicar/index.html` que el montaje
 * acaba de hornear, y de ningún otro sitio. La tienda y su panel tienen que
 * hablarle AL MISMO maestro: si el panel sacara la dirección de otra parte
 * —un secreto del repositorio, otra pregunta a la hoja—, el día que las dos
 * fuentes no coincidan el comerciante editaría una hoja y la tienda vendería
 * de otra, y las dos pantallas se verían perfectas. Es el cruce de tiendas de
 * DESPLIEGUE.md, que corre entero en verde. Una sola fuente lo hace imposible.
 *
 * Sin dirección en el index —una tienda que nunca se montó— el panel se
 * hornea igual, vacío, y dice que todavía no está conectado. No se inventa una.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const PLANTILLA = 'plantilla/admin.html';
const INDEX     = 'publicar/index.html';
const ADMIN     = 'publicar/admin.html';
const revisar   = process.argv.includes('--revisar');

export const ESCRIBE = [ADMIN];

/* Lo que va dentro de un <script> como texto de JavaScript: JSON, y el '<'
   escapado para que un nombre de comercio con «</script>» no cierre la
   etiqueta. El nombre lo escribe una persona en una celda. */
const enScript = v => JSON.stringify(String(v)).replace(/</g, '\\u003c');
const enHtml = v => String(v).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function constanteDe(html, nombre) {
  const m = html.match(new RegExp('(?:const|let)\\s+' + nombre + '\\s*=\\s*"([^"]*)";'));
  return m ? m[1] : null;
}

export function armar(plantilla, index) {
  const url = constanteDe(index, 'SCRIPT_URL') || '';
  const negocio = constanteDe(index, 'NEGOCIO') || '';
  if (!/const SCRIPT_URL = "";/.test(plantilla) || !/let NEGOCIO = "";/.test(plantilla)) {
    throw new Error(PLANTILLA + ' no trae los huecos que este horneado llena ' +
      '(const SCRIPT_URL = ""; y let NEGOCIO = "";). Revísalo a mano.');
  }
  let html = plantilla
    .replace('const SCRIPT_URL = "";', 'const SCRIPT_URL = ' + enScript(url) + ';')
    .replace('let NEGOCIO = "";', 'let NEGOCIO = ' + enScript(negocio) + ';');
  if (negocio) html = html.replace(/<title>[^<]*<\/title>/, '<title>' + enHtml(negocio) + ' — panel</title>');
  return { html, url, negocio };
}

async function principal() {
  const [plantilla, index] = await Promise.all([readFile(PLANTILLA, 'utf8'), readFile(INDEX, 'utf8')]);
  const { html, url, negocio } = armar(plantilla, index);
  let actual = '';
  try { actual = await readFile(ADMIN, 'utf8'); } catch (e) { actual = ''; }

  if (revisar) {
    if (actual !== html) {
      console.error('publicar/admin.html no es el que sale de la plantilla y del index. ' +
                    'Corre: node montar/preparar-admin.mjs');
      process.exit(1);
    }
    console.log('publicar/admin.html está al día.');
    return;
  }
  if (actual === html) { console.log('El panel ya estaba al día.'); return; }
  await writeFile(ADMIN, html);
  console.log('Panel horneado para ' + (negocio || '(sin nombre)') + ' → ' +
              (url ? url.replace(/\/macros\/s\/(.{6}).*\/exec/, '/macros/s/$1…/exec') : 'SIN MAESTRO: dirá que no está conectado'));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { console.error(e.message); process.exit(1); });
}
