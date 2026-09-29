/* ═══════════════════════════════════════════════════════════════════════════
   LA TIENDA VIVA: lo único que decide si UNA TIENDA publica (0.22.0 · bit. 102)
   ---------------------------------------------------------------------------
   POR QUÉ EXISTE. Hasta la 0.21, antes de publicar, cada tienda corría la suite
   ENTERA de la semilla: ~2.480 aserciones escritas para probar el código de la
   semilla con los datos de muestra de la semilla, en el repositorio de la
   semilla. Dentro de una tienda, cada una de esas suposiciones —que existe
   `release.yml`, que están las fotos de muestra, que el respaldo es el de la
   plantilla, que no hay carpetas viejas, que el comercio no tiene logo— era una
   forma de bloquear la publicación de un comercio cuyo único «error» era ser
   otro comercio. Pasó cinco veces seguidas (bitácoras 90, 93, 94, 95 y 102), y
   cada una costó una vuelta entera por producción.

   Y no protegía de nada: el código que una tienda corre después de actualizarse
   es EXACTAMENTE el de una etiqueta de la semilla, y `release` no corta una
   etiqueta sin la suite completa en verde. Volver a probar ese código dentro de
   la tienda no añadía información; solo añadía maneras de fallar —y minutos de
   Actions, que se acabaron—.

   LO QUE SÍ PUEDE ROMPERSE EN UNA TIENDA es lo que se hornea con SUS datos. Así
   que esto comprueba eso, sobre los archivos reales de `publicar/`, y SOLO con
   invariantes: cosas que son ciertas para cualquier comercio con cualquier hoja,
   y falsas únicamente cuando el horneado salió mal. Ni un nombre, ni un color,
   ni un producto escritos aquí: una aserción que dependa de los datos de un
   comercio es una tienda que no se puede publicar.

     node pruebas/tienda-viva.js
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const http = require('http');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const P = path.join(__dirname, '..', 'publicar');
const leer = r => { try { return fs.readFileSync(path.join(P, r), 'utf8'); } catch (e) { return null; } };

(async () => {
  const index = leer('index.html'), cat = leer('catalogo.json'), noEsta = leer('404.html');
  ok('LO PUBLICADO existe: la página, el catálogo y la de «no existe»',
     !!index && !!cat && !!noEsta, [!index && 'index.html', !cat && 'catalogo.json', !noEsta && '404.html'].filter(Boolean).join(', '));
  if (!index || !cat) { fin(); return; }

  /* ── La página, horneada contra el maestro de ESTA tienda ─────────────── */
  const url = (index.match(/const SCRIPT_URL = "([^"]*)";/) || [])[1] || '';
  ok('LA PÁGINA sabe a qué maestro preguntar',
     /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url), url || '(vacío)');
  const enPagina = (index.match(/const SCRIPT_VERSION = "([^"]*)";/) || [])[1] || '';
  const delMaestro = (fs.readFileSync(path.join(__dirname, '..', 'maestro.gs'), 'utf8')
                      .match(/^var VERSION = '([^']+)';/m) || [])[1] || '';
  ok('  ...y espera la MISMA versión de maestro que hay en este repositorio',
     !!enPagina && enPagina === delMaestro, 'página ' + (enPagina || '?') + ' · maestro ' + (delMaestro || '?'));
  const csp = (index.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  ok('  ...y su política de seguridad la deja hablar con él, y con nadie más de la cuenta',
     /default-src 'none'/.test(csp) && /connect-src[^;]*https:\/\/script\.google\.com/.test(csp),
     csp.slice(0, 80) || '(sin política)');

  /* ── El catálogo horneado ─────────────────────────────────────────────── */
  let c = null;
  try { c = JSON.parse(cat); } catch (e) {}
  const productos = (c && Array.isArray(c.productos)) ? c.productos : null;
  ok('EL CATÁLOGO se lee', !!productos, c ? '' : 'catalogo.json no es JSON');
  if (!productos) { fin(); return; }
  const ids = productos.map(p => String(p.id || ''));
  const malos = productos.filter(p => !String(p.id || '').trim() || !String(p.nombre || '').trim() ||
                                      !(Number(p.precio) >= 0));
  ok('  ...y cada producto tiene identificador, nombre y precio',
     malos.length === 0, malos.slice(0, 3).map(p => p.id || '(sin id)').join(', ') || productos.length + ' productos');
  ok('  ...y ningún identificador se repite',
     new Set(ids).size === ids.length, 'un id repetido abre la ficha equivocada');

  /* ── El respaldo: lo que la página pinta si Google no contesta ──────────── */
  let respaldo = null;
  try {
    const i = index.indexOf('const CONFIG_SEMILLA = {');
    const f = index.indexOf('const PRODUCTOS = [', i);
    const fin_ = index.indexOf('];', f);
    respaldo = Function(index.slice(i, fin_ + 2) + '\n; return { p: PRODUCTOS, e: ENVIOS, c: CONFIG_SEMILLA };')();
  } catch (e) {}
  ok('EL RESPALDO se lee', !!respaldo, respaldo ? '' : 'el bloque del respaldo no se puede evaluar');
  if (respaldo) {
    const enRespaldo = respaldo.p.map(p => String(p.id)).sort().join(',');
    ok('  ...y lleva los MISMOS productos que el catálogo: salen de la misma corrida',
       enRespaldo === [...ids].sort().join(','),
       respaldo.p.length + ' en el respaldo · ' + ids.length + ' en el catálogo');
    ok('  ...y es de la misma tienda que el catálogo',
       String((respaldo.c || {}).negocio || '') === String(((c.config || {}).negocio) || ''),
       'respaldo «' + (respaldo.c || {}).negocio + '» · catálogo «' + (c.config || {}).negocio + '»');
  }

  /* ── Lo que el comercio tiene que saber, pero no bloquea ──────────────── */
  const enDisco = new Set(fs.existsSync(path.join(P, 'fotos')) ? fs.readdirSync(path.join(P, 'fotos')) : []);
  const faltan = [];
  productos.forEach(p => (p.imagenes || []).forEach(n => {
    const nombre = String(n || '').trim();
    if (nombre && !/^https?:\/\//i.test(nombre) && !enDisco.has(nombre)) faltan.push(nombre);
  }));
  if (faltan.length) {
    console.log('  AVISO | ' + faltan.length + ' foto(s) que la hoja nombra no están publicadas: ' +
                faltan.slice(0, 5).join(', ') + (faltan.length > 5 ? '…' : ''));
    console.log('          Esos productos salen con su dibujo. No detiene la publicación: es dato del comercio.');
  }

  /* ── Y la página, abierta de verdad ────────────────────────────────────── */
  let chromium = null;
  try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!chromium) {
    console.log('  SALTA | la prueba en el navegador: aquí no hay navegador instalado.');
    fin(); return;
  }
  const tipos = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp',
                  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
  /* Sin servicio: lo que se prueba es lo HORNEADO. Con el maestro vivo, la
     página mostraría lo que contesta Google, que no es lo que se va a publicar. */
  const pagina = index.replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "";');
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split('?')[0]);
    if (ruta === '/' || ruta === '/index.html') { res.writeHead(200, { 'Content-Type': tipos['.html'] }); return res.end(pagina); }
    const archivo = path.join(P, path.normalize(ruta).replace(/^([/\\])+/, ''));
    if (archivo.indexOf(P) !== 0 || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(archivo).pipe(res);
  });
  await new Promise(r => srv.listen(0, r));
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errores = [];
  pg.on('pageerror', e => errores.push(e.message));
  await pg.goto('http://localhost:' + srv.address().port + '/');
  const hay = productos.length > 0;
  if (hay) await pg.waitForSelector('.rejilla .tarjeta', { timeout: 15000 }).catch(() => {});
  const vistos = await pg.$$eval('.rejilla .tarjeta h3', hs => hs.map(h => h.textContent.trim()));
  const nombres = new Set(productos.map(p => String(p.nombre).trim()));
  ok('LA PÁGINA ABRE y pinta el catálogo de ESTA tienda',
     !hay || (vistos.length > 0 && vistos.every(n => nombres.has(n))),
     vistos.length + ' tarjeta(s)' + (vistos.filter(n => !nombres.has(n)).length ? ' · ajenas: ' + vistos.filter(n => !nombres.has(n)).slice(0, 2).join(', ') : ''));
  ok('  ...sin un solo error de JavaScript', errores.length === 0, errores[0] || '');
  await b.close(); srv.close();
  fin();
})().catch(e => { console.error(e); process.exit(1); });

function fin() {
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
}
