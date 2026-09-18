/* A-2 — preparar-index.mjs hornea publicar/ desde plantilla/.
 * ---------------------------------------------------------------------------
 * No necesita servidor ni navegador: prueba la función `aplicar()` de
 * montar/preparar-index.mjs directamente, con datos inventados, igual que
 * otras baterías conducen la hoja emulada de gas.js en vez de una real.
 *
 *   node pruebas/plantilla.js
 */
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

(async () => {
  const { aplicar, aplicar404 } = await import('../montar/preparar-index.mjs');
  const { svg, partirEnLineas } = await import('../montar/preparar-compartir.mjs');
  const plantilla = readFileSync(path.join(RAIZ, 'plantilla/index.html'), 'utf8');
  const plantilla404 = readFileSync(path.join(RAIZ, 'plantilla/404.html'), 'utf8');

  const inicioHead = plantilla.indexOf('<meta http-equiv="Content-Security-Policy"');
  const finHead = plantilla.indexOf('<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->') +
                  '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->'.length;
  const headFijo = plantilla.slice(inicioHead, finHead)
    .replace(/\[TÍTULO DE LA TIENDA — sin hornear\]/g, 'Panadería Ejemplo')
    .replace(/\[DESCRIPCIÓN DEL SITIO — sin hornear\]/g, 'Pan artesanal todos los días.')
    .replace(/\[NOMBRE DE LA TIENDA\]/g, 'Panadería Ejemplo')
    .replace(/\[URL DEL SITIO — sin hornear\]/g, 'https://panaderia-ejemplo.workers.dev/');

  const datosOk = {
    head: headFijo,
    valores: {
      SCRIPT_URL: 'https://script.google.com/macros/s/FAKE/exec',
      SCRIPT_VERSION: '2026-09-18-1',
      FOTOS_HOSTS: ['res.cloudinary.com'],
      NEGOCIO: 'Panadería Ejemplo',
      WHATSAPP: '573001112233'
    },
    alta: { bloquean: [], avisan: [] },
    colores: { principal: '#8B4513', secundario: '#3E2723', alterno: '#5D4037', ilegibles: [] }
  };

  // ── el camino feliz ──
  let salida;
  try {
    salida = aplicar(plantilla, datosOk);
    ok('hornea sin tirar con datos completos', true);
  } catch (e) {
    ok('hornea sin tirar con datos completos', false, e.message.split('\n')[0]);
    salida = '';
  }

  ok('el SCRIPT_URL quedó escrito',
     salida.includes('const SCRIPT_URL = "https://script.google.com/macros/s/FAKE/exec";'));
  ok('el WHATSAPP quedó escrito', salida.includes('let WHATSAPP = "573001112233";'));
  ok('la paleta quedó escrita (no el gris de la plantilla)',
     salida.includes('--rojo:#8B4513;') && !salida.includes('--rojo:#808080;'));
  ok('el head de la plantilla (con corchetes) ya no está',
     !salida.includes('[TÍTULO DE LA TIENDA — sin hornear]'));

  // ── determinismo: dos corridas con los mismos datos dan el mismo archivo ──
  const salida2 = aplicar(plantilla, datosOk);
  ok('hornear dos veces con los mismos datos da el mismo archivo', salida === salida2);

  // ── el <script> resultante es JavaScript válido ──
  const m = salida.match(/<script>([\s\S]*)<\/script>/);
  let valido = false;
  if (m) {
    try {
      writeFileSync('/tmp/plantilla-salida-js-' + process.pid + '.js', m[1]);
      require('child_process').execFileSync(
        process.execPath, ['--check', '/tmp/plantilla-salida-js-' + process.pid + '.js']);
      valido = true;
    } catch (e) { valido = false; }
  }
  ok('el <script> horneado es JavaScript válido', valido);

  // ── todo o nada: si falta una clave bloqueante, no tira ni una letra ──
  ok('con una clave bloqueante, tira en vez de escribir algo a medias',
     (() => {
       try {
         aplicar(plantilla, { ...datosOk, alta: { bloquean: [{ clave: 'whatsapp', porQue: 'x' }], avisan: [] } });
         return false;
       } catch { return true; }
     })());

  // ── sin SCRIPT_URL, tira con el mensaje que dice qué hacer ──
  ok('sin SCRIPT_URL, tira explicando qué falta',
     (() => {
       try {
         aplicar(plantilla, { ...datosOk, valores: { ...datosOk.valores, SCRIPT_URL: '' } });
         return false;
       } catch (e) { return /Implementar > Aplicación web/.test(e.message); }
     })());

  // ── un valor entre corchetes (sin llenar) tira, no lo publica tal cual ──
  ok('NEGOCIO entre corchetes (sin llenar) tira, no lo publica',
     (() => {
       try {
         aplicar(plantilla, { ...datosOk, valores: { ...datosOk.valores, NEGOCIO: '[NOMBRE DEL COMERCIO]' } });
         return false;
       } catch (e) { return /sigue sin llenar/.test(e.message); }
     })());

  // ══ A-3: publicar/404.html se hornea con el nombre del comercio ══
  const salida404 = aplicar404(plantilla404, 'Panadería Ejemplo');
  ok('404: el título lleva el nombre del comercio',
     salida404.includes('<title>Panadería Ejemplo — esa página no existe</title>'));
  ok('  ...y el marcador sin hornear ya no está',
     !salida404.includes('[NOMBRE DE LA TIENDA — sin hornear]'));
  ok('  ...hornear dos veces con el mismo nombre da el mismo archivo',
     aplicar404(plantilla404, 'Panadería Ejemplo') === salida404);
  ok('  ...un nombre con caracteres de HTML no rompe la página',
     (() => {
       const r = aplicar404(plantilla404, 'Pan & Café "El Bueno" <2>');
       return r.includes('Pan &amp; Café &quot;El Bueno&quot; &lt;2&gt;') &&
              !r.includes('<2>');
     })());
  ok('  ...si el marcador del título no está, tira en vez de adivinar',
     (() => {
       try { aplicar404(plantilla404.replace('sin hornear', 'distinto'), 'x'); return false; }
       catch (e) { return /marcador/.test(e.message); }
     })());

  // ══ A-3: publicar/compartir.jpg se arma con el nombre y el color de la tienda ══
  ok('compartir: un nombre corto sale en una sola línea',
     partirEnLineas('Pan').length === 1);
  ok('  ...uno largo se reparte en dos, por una palabra completa',
     (() => {
       const l = partirEnLineas('Distribuidora de Insumos Agropecuarios del Oriente');
       return l.length === 2 && l.join(' ').split(/\s+/).length ===
              'Distribuidora de Insumos Agropecuarios del Oriente'.split(/\s+/).length;
     })());
  ok('  ...el SVG lleva el nombre del comercio, escapado',
     svg('Pan & Café', '#8B4513').includes('Pan &amp; Café'));
  ok('  ...con el color de la hoja cuando es un color válido',
     svg('Pan', '#8B4513').includes('fill="#8B4513"'));
  ok('  ...y con el gris de la plantilla si el color no es válido, sin tirar',
     svg('Pan', 'no-es-un-color').includes('fill="#6E6E6E"'));
  ok('  ...también sin color ninguno',
     svg('Pan', undefined).includes('fill="#6E6E6E"'));
  ok('  ...el SVG resultante es XML bien formado (mismo número de <svg y </svg>)',
     (() => {
       const s = svg('Tienda "Rara" & Cía. <raíz>', '#1B5E3A');
       return (s.match(/<svg /g) || []).length === 1 && (s.match(/<\/svg>/g) || []).length === 1;
     })());

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
