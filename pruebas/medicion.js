/* 0.19.0 — medir la tienda: Google Analytics 4 y la costura del medidor propio.
 * ---------------------------------------------------------------------------
 * Una clave en la hoja (`analytics_id`) y el fragmento oficial horneado en el
 * <head>. Lo que esta batería vigila no es que GA funcione —eso lo hace
 * Google—, sino las cuatro cosas que se pagan caras si se rompen:
 *
 *   · VACÍO ES VACÍO. Sin `analytics_id` la tienda no carga nada de Google, no
 *     pone cookies y su política de seguridad ni nombra a googletagmanager:
 *     una tienda que no mide no tiene que explicar que mide.
 *   · MEDIR NO PUEDE ROMPER UNA VENTA: `medir()` no revienta nunca, y en la
 *     vista previa no mide.
 *   · LA POLÍTICA Y EL SCRIPT VAN JUNTOS. Hornear el script sin abrir la CSP
 *     es medir cero sin un solo error visible (es lo que pasó con connect-src
 *     y el catálogo, bitácora: el fetch no sale y nadie se entera).
 *   · UN `UA-` O UN `GTM-` NO SON GA4, y no se hornean.
 *
 *   node pruebas/medicion.js
 */
const fs = require('fs');
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const decir = console.log;
console.log = () => {};
const g = crear('./as.js'); g.api.instalar(); configurar(g);
console.log = decir;

const config = (clave, valor) => {
  const h = g.hojas.get('Configuración');
  const filas = g.filas('Configuración');
  for (let i = 0; i < filas.length; i++) {
    if (String(filas[i][0]).trim() === clave) { h.getRange(i + 1, 2).setValue(valor); return true; }
  }
  return false;
};
const head = () => { console.log = () => {}; const r = g.api.generarConfiguracion(); console.log = decir;
                     return (r && (r.bloque || r.codigo || r.texto)) || JSON.stringify(r); };

ok('LA CLAVE existe en la hoja de fábrica, vacía y al final (R1)',
   g.filas('Configuración').some(f => String(f[0]).trim() === 'analytics_id' && !String(f[1] || '').trim()) &&
   String(g.filas('Configuración')[g.filas('Configuración').length - 1][0]).trim() === 'analytics_id');

const sinMedir = head();
ok('SIN analytics_id la tienda no carga NADA de Google',
   !/googletagmanager/.test(sinMedir) && !/gtag/.test(sinMedir) && !/google-analytics/.test(sinMedir),
   (sinMedir.match(/google[^"']*/) || ['nada'])[0]);

ok('  ...y su política de seguridad tampoco los nombra',
   !/google-analytics|googletagmanager/.test(sinMedir));

config('analytics_id', 'G-AB12CD34EF');
const midiendo = head();
ok('CON analytics_id se hornea el fragmento oficial de GA4, con ESE identificador',
   /googletagmanager\.com\/gtag\/js\?id=G-AB12CD34EF/.test(midiendo) &&
   /gtag\('config','G-AB12CD34EF'\)/.test(midiendo),
   (midiendo.match(/gtag\/js[^"]*/) || ['—'])[0]);
ok('  ...y la política de seguridad lo permite: script, conexión e imagen',
   /script-src[^;]*https:\/\/www\.googletagmanager\.com/.test(midiendo) &&
   /connect-src[^;]*https:\/\/\*\.google-analytics\.com/.test(midiendo) &&
   /connect-src[^;]*https:\/\/\*\.analytics\.google\.com/.test(midiendo) &&
   /img-src[^;]*https:\/\/\*\.google-analytics\.com/.test(midiendo),
   (midiendo.match(/content="([^"]*)"/) || ['', ''])[1].slice(0, 120));
ok('  ...y va DENTRO del bloque que el montaje reemplaza, no suelto por el archivo',
   midiendo.indexOf('googletagmanager') < midiendo.indexOf('FIN DE LA CONFIGURACIÓN'));

/* Las cabeceras de Cloudflare son iguales en TODAS las tiendas y se aplican a
   la vez que el <meta>: manda la más restrictiva. Si no nombraran a Google, la
   tienda que sí mide mediría cero sin un solo error. */
const cabeceras = fs.readFileSync('../publicar/_headers', 'utf8');
ok('LAS CABECERAS de Cloudflare permiten lo mismo, para todas las tiendas',
   /script-src[^;]*googletagmanager/.test(cabeceras) &&
   /connect-src[^;]*google-analytics/.test(cabeceras) &&
   /connect-src[^;]*analytics\.google\.com/.test(cabeceras));

config('analytics_id', 'UA-123456-1');
const viejo = head();
ok('UN «UA-» (Universal Analytics, apagado) no se hornea',
   !/googletagmanager/.test(viejo));
config('analytics_id', 'GTM-ABC123');
ok('  ...ni un «GTM-» (Tag Manager): carga lo que alguien configuró en otro sitio',
   !/googletagmanager/.test(head()));
const defAnalitica = g.api.CLAVES_DEL_PANEL.filter(d => d.clave === 'analytics_id')[0];
ok('  ...y el panel dice por qué, en vez de dejar una tienda muda',
   !!defAnalitica && /G-ABCD123456/.test(String(g.api.problemaDeValor(defAnalitica, 'GTM-ABC123'))) &&
   /G-ABCD123456/.test(String(g.api.problemaDeValor(defAnalitica, 'UA-123456-1'))) &&
   g.api.problemaDeValor(defAnalitica, 'G-AB12CD34EF') === null &&
   g.api.problemaDeValor(defAnalitica, '') === null,
   String(g.api.problemaDeValor(defAnalitica, 'GTM-ABC123')).slice(0, 70));

/* La costura: un solo sitio por donde sale la medida, para que el medidor
   propio sea una línea más y no una vuelta por todas las pantallas. */
const pagina = fs.readFileSync('../plantilla/index.html', 'utf8');
const publicada = fs.readFileSync('../publicar/index.html', 'utf8');
ok('LA PÁGINA MIDE POR UN SOLO SITIO: la función medir()',
   /function medir\(evento, datos\)/.test(pagina) &&
   (pagina.match(/\bgtag\(/g) || []).length === 1,
   (pagina.match(/\bgtag\(/g) || []).length + ' llamadas a gtag');
ok('  ...que no revienta nunca y no mide la vista previa',
   /function medir\(evento, datos\)\{\s*\n\s*if\(VISTA\) return;/.test(pagina) && /try\{[^}]*gtag/.test(pagina));
ok('  ...y están puestos los tres puntos de medida',
   /medir\("agregar_al_carrito"/.test(pagina) && /medir\("enviar_pedido"/.test(pagina) &&
   /medir\("pagar_en_linea"/.test(pagina));
ok('  ...también en la página publicada, que es la que se sirve',
   /function medir\(evento, datos\)/.test(publicada) && /medir\("enviar_pedido"/.test(publicada));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
