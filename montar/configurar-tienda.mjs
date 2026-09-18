/**
 * TIENDA — apuntar esta copia del repositorio a una tienda
 * ---------------------------------------------------------------------------
 * Escribe los dos archivos de configuración que antes se creaban a mano:
 *
 *   tienda.json           a qué maestro le habla el montaje
 *   montar/.clasp.json    a qué proyecto de Apps Script le sube el maestro
 *
 * Ninguno de los dos se versiona: son distintos por tienda.
 *
 *   npm run tienda -- <URL /exec> <token>
 *   npm run tienda                          (los pide por teclado)
 *
 * Los dos datos salen del menú de la hoja > Diagnóstico, bajo
 * "── PARA EL PANEL DE TIENDAS ──". Son los únicos que hay que copiar: el
 * scriptId, el nombre del negocio y el enlace de la hoja se los pregunta esto
 * al maestro, que ya se los sabe.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { alMaestro } from './tienda.mjs';
import { revisarNombreDelWorker } from './nombrar-worker.mjs';

const TIENDA   = 'tienda.json';
const CLASP    = 'montar/.clasp.json';
const WRANGLER = 'wrangler.jsonc';

export const ESCRIBE = [WRANGLER, TIENDA, CLASP];

/* El nombre del Worker y su apodo viven en montar/nombrar-worker.mjs, que es
   quien lo hace también desde el flujo (historia A-3). Aquí solo se llama: dos
   copias de la misma regla de apodo es como dos tiendas acaban compartiendo
   nombre de Worker, que es justo el daño que esto evita. */

async function preguntar(pregunta) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const r = (await rl.question(pregunta)).trim();
  rl.close();
  return r;
}

async function existe(ruta) {
  try { return JSON.parse(await readFile(ruta, 'utf8')); } catch { return null; }
}

/* Un maestro anterior a 1.7.2 no manda hojaId. Se saca de la URL de la hoja,
   que sí manda desde el principio. */
function idDeLaHoja(texto) {
  const t = String(texto || '').trim();
  const m = t.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  // O el identificador pelado, que es lo que copia quien ya sabe cuál es.
  return /^[A-Za-z0-9_-]{20,}$/.test(t) ? t : '';
}

async function main() {
  let [url, token] = process.argv.slice(2).filter(a => !a.startsWith('--'));

  if (!url) {
    console.log('\nEl menú de la hoja > Diagnóstico, bajo "PARA EL PANEL DE TIENDAS".\n');
    url = await preguntar('URL del servicio (termina en /exec): ');
  }
  if (!token) token = await preguntar('Token (empieza con tk-): ');

  url = String(url).trim().replace(/\?.*$/, '');
  token = String(token).trim();

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) {
    throw new Error('Esa no parece la URL buena. Tiene que empezar con\n' +
      '  https://script.google.com/macros/s/   y terminar en /exec\n' +
      'La que termina en /dev solo funciona para el dueño del proyecto.');
  }
  if (!/^tk-/.test(token)) {
    throw new Error('El token empieza con "tk-". Lo que pegaste: ' + token.slice(0, 20));
  }

  /* Antes de escribir nada, comprobar que ese maestro contesta. Escribir dos
     archivos que apuntan a una URL muerta solo mueve el error más adelante.

     Se pregunta por la puerta `identidad`, que contesta SIN abrir la hoja. Un
     maestro que se quedó sin HOJA_ID no puede contestar por ninguna otra, y
     entonces esta herramienta —que es justo la que arregla ese valor— no podía
     ni arrancar. */
  process.stdout.write('\nHablando con el maestro… ');
  let d;
  try {
    d = await alMaestro({ url, token }, 'identidad');
  } catch (e) {
    // Un maestro anterior a 1.7.3 no conoce esa puerta.
    if (!/desconocida/i.test(e.message)) throw e;
    d = await alMaestro({ url, token }, 'bloques');
    d.hojaOk = true;
  }
  console.log('contesta.');

  if (d.hojaOk === false) {
    console.log('\n⚠ Pero NO puede abrir su hoja:');
    console.log('  ' + String(d.problema || '').split('\n')[0]);
    console.log('\n  La tienda está caída aunque se vea bien: cae al inventario');
    console.log('  de respaldo que trae dentro y no registra ningún pedido.');
    console.log('  `npm run maestro` lo arregla, con el dato que anoto ahora.\n');
  }

  if (!d.hojaId) {
    d.hojaId = idDeLaHoja(d.hoja);
  }
  if (!d.hojaId) {
    console.log('El maestro no sabe cuál es su hoja, así que hace falta a mano.');
    console.log('Es lo que va entre /d/ y /edit en la URL de la hoja.\n');
    d.hojaId = idDeLaHoja(await preguntar('URL de la hoja (o su identificador): '));
    if (!d.hojaId) throw new Error('Sin ese dato no puedo escribir tienda.json.');
  }
  console.log('');

  const antes = await existe(TIENDA);
  if (antes && antes.maestro && antes.maestro !== url) {
    const r = await preguntar(
      `Este repositorio ya apunta a otra tienda:\n  ${antes.maestro}\n` +
      '¿Lo cambio? (s/n) ');
    if (r.toLowerCase() !== 's') { console.log('No toqué nada.'); return; }
  }

  await writeFile(TIENDA, JSON.stringify({
    comercio: d.negocio || '',
    maestro: url,
    token,
    hoja: d.hoja || '',
    /* Sin esto, `npm run maestro` sube el maestro con HOJA_ID vacío y deja la
       tienda muda: el archivo del repositorio no lo lleva, porque es distinto
       en cada tienda y no se versiona. */
    hojaId: d.hojaId,
    scriptId: d.scriptId || ''
  }, null, 2) + '\n');
  console.log('  ✓ ' + TIENDA);

  await mkdir('montar', { recursive: true });
  if (d.scriptId) {
    await writeFile(CLASP, JSON.stringify(
      { scriptId: d.scriptId, rootDir: '../' }, null, 2) + '\n');
    console.log('  ✓ ' + CLASP + '   (scriptId ' + d.scriptId.slice(0, 12) + '…)');
  } else {
    console.log('  · ' + CLASP + ' NO se pudo escribir: este maestro no supo\n' +
                '    decir su propio scriptId. Créalo a mano con el id que sale\n' +
                '    en la URL del proyecto, entre /projects/ y /edit.');
  }

  revisarNombreDelWorker(d.negocio);

  console.log('\n' + (d.negocio || 'Tienda') + ' · versión ' + d.version);
  if (d.hoja) console.log(d.hoja);
  console.log('\nSiguiente:  ' + (d.hojaOk === false
    ? 'npm run maestro   ← para devolverle la hoja al maestro publicado'
    : 'npm run montar'));
}

main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
