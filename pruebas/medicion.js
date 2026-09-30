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
   /* «Al final» cuando nació (0.19.0): justo detrás de la última que había.
      Lo que venga después es de versiones posteriores (0.23.0: logo_tamano),
      y también va al final: R1 se cumple igual. */
   /* 0.24.0: Configuración va por secciones y se lee por nombre; R1 queda en
      la SEMILLA de instalar() (el orden en que nacen las claves), no en la fila. */
   (() => { const c = g.api.semillaDeConfiguracion().map(f => f[0]);
            return c.indexOf('analytics_id') === c.indexOf('catalogo_columnas') + 1; })());

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


/* ═══ 0.25.0 · EL PÍXEL DE META, con las mismas cuatro reglas ═══ */
config('analytics_id', '');
const sinPixel = head();
ok('SIN meta_pixel_id la tienda no carga NADA de Meta, ni lo nombra en su política',
   !/facebook/.test(sinPixel) && !/fbq/.test(sinPixel));
ok('  ...y la clave existe en la hoja de fábrica, vacía, en «Medición y anuncios» con GA4',
   g.filas('Configuración').some(f => String(f[0]).trim() === 'meta_pixel_id' && !String(f[1] || '').trim()) &&
   g.api.CLAVES_DEL_PANEL.filter(d => /^(meta_pixel_id|analytics_id)$/.test(d.clave))
     .every(d => d.grupo === 'Medición y anuncios'));
config('meta_pixel_id', '123456789012345');
const conPixel = head();
ok('CON meta_pixel_id se hornea el fragmento oficial, con ESE número y su PageView',
   /connect\.facebook\.net\/en_US\/fbevents\.js/.test(conPixel) &&
   /fbq\('init','123456789012345'\);fbq\('track','PageView'\)/.test(conPixel));
ok('  ...sin el <noscript><img>: la tienda no funciona sin JavaScript y en <head> no es HTML válido',
   !/<noscript>/.test(conPixel));
ok('  ...y la política de seguridad lo permite: script, conexión e imagen',
   /script-src[^;]*https:\/\/connect\.facebook\.net/.test(conPixel) &&
   /connect-src[^;]*https:\/\/www\.facebook\.com/.test(conPixel) &&
   /img-src[^;]*https:\/\/www\.facebook\.com/.test(conPixel) &&
   !/googletagmanager/.test(conPixel), (conPixel.match(/script-src[^;]*/) || [''])[0]);
ok('  ...dentro del bloque que el montaje reemplaza',
   conPixel.indexOf('fbevents') !== -1 && conPixel.indexOf('fbevents') < conPixel.indexOf('FIN DE LA CONFIGURACIÓN'));
config('analytics_id', 'G-AB12CD34EF');
const losDos = head();
ok('CON LOS DOS van los dos fragmentos y los hosts de los dos en la MISMA política',
   /gtag\/js\?id=G-AB12CD34EF/.test(losDos) && /fbevents/.test(losDos) &&
   (losDos.match(/Content-Security-Policy/g) || []).length === 1 &&
   /script-src[^;]*googletagmanager[^;]*connect\.facebook\.net/.test(losDos));
ok('LAS CABECERAS de Cloudflare nombran también a Meta, para todas las tiendas',
   /script-src[^;]*connect\.facebook\.net/.test(cabeceras) &&
   /connect-src[^;]*www\.facebook\.com/.test(cabeceras) && /img-src[^;]*www\.facebook\.com/.test(cabeceras));
const defPixel = g.api.CLAVES_DEL_PANEL.filter(d => d.clave === 'meta_pixel_id')[0];
const malos = ['act_123456789', '<script>fbq("init","1")</script>', 'EAAGm0PX4ZCpsBA', '12345'];
malos.forEach(v => { config('meta_pixel_id', v); });
ok('LO QUE SE SUELE PEGAR POR ERROR no se hornea: la cuenta publicitaria, el código entero, un token',
   malos.every(v => { config('meta_pixel_id', v); return !/fbevents/.test(head()); }));
ok('  ...y el panel dice cómo se ve el bueno',
   !!defPixel && malos.every(v => /solo números/.test(String(g.api.problemaDeValor(defPixel, v)))) &&
   g.api.problemaDeValor(defPixel, '123456789012345') === null && g.api.problemaDeValor(defPixel, '') === null);

/* La página: Meta sale por el MISMO medir(), con sus eventos estándar, y un
   pedido por WhatsApp NO es una compra. Se evalúa el trozo de verdad de la
   plantilla con un gtag y un fbq de mentira que anotan lo que reciben. */
{
  const i = pagina.indexOf('const EVENTOS_META');
  const j = pagina.indexOf('function medidores(){');
  const trozo = i !== -1 && j !== -1 ? pagina.slice(i, j) : '';
  const llamadas = { g: [], m: [] };
  const correr = (vista, conMeta) => new Function('VISTA', 'gtag', 'fbq', trozo + '; return medir;')(
    vista, (...a) => llamadas.g.push(a), conMeta ? (...a) => llamadas.m.push(a) : undefined);
  const medirDePrueba = trozo ? correr(false, true) : () => {};
  medirDePrueba('ver_producto', { item_id: 'pan', value: 8900, currency: 'COP' });
  medirDePrueba('agregar_al_carrito', { item_id: 'pan', quantity: 2, value: 17800, currency: 'COP' });
  medirDePrueba('enviar_pedido', { transaction_id: 'AB12', value: 17800, currency: 'COP' });
  medirDePrueba('pago_confirmado', { transaction_id: 'AB12', value: 17800, currency: 'COP' });
  const nombres = llamadas.m.map(a => a[1]).join(',');
  ok('MEDIR() LE HABLA A META en sus eventos estándar, y un pedido por WhatsApp no es una compra',
     nombres === 'ViewContent,AddToCart,InitiateCheckout,Purchase', nombres);
  ok('  ...con los datos que entiende, sin nada personal',
     JSON.stringify(llamadas.m[1][2]) === JSON.stringify({ content_ids: ['pan'], content_type: 'product', num_items: 2, value: 17800, currency: 'COP' }),
     JSON.stringify(llamadas.m[1] && llamadas.m[1][2]));
  ok('  ...y lo que lleva pedido va con eventID, para que Meta no lo cuente dos veces',
     llamadas.m[3] && llamadas.m[3][3] && llamadas.m[3][3].eventID === 'pago_confirmado-AB12');
  ok('  ...y Google recibe lo mismo, tal cual, con nuestros nombres',
     llamadas.g.map(a => a[1]).join(',') === 'ver_producto,agregar_al_carrito,enviar_pedido,pago_confirmado');
  const antes = llamadas.m.length + llamadas.g.length;
  (trozo ? correr(true, true) : () => {})('ver_producto', { item_id: 'pan' });
  ok('  ...y en la vista previa, nada', llamadas.m.length + llamadas.g.length === antes);
  let reviento = '';
  try {
    new Function('VISTA', 'gtag', 'fbq', trozo + '; return medir;')(false, () => { throw new Error('g'); }, () => { throw new Error('m'); })
      ('enviar_pedido', { transaction_id: 'X' });
  } catch (e) { reviento = e.message; }
  ok('  ...y si Google o Meta revientan, la venta sigue', !reviento, reviento);
}
ok('LA PÁGINA LE HABLA A META POR UN SOLO SITIO',
   (pagina.match(/\bfbq\("track"/g) || []).length === 2 && pagina.indexOf('fbq("track"') > pagina.indexOf('function medir('),
   (pagina.match(/\bfbq\(/g) || []).length + ' llamadas a fbq');
ok('  ...y están los puntos nuevos: la ficha y el pago confirmado',
   /medir\("ver_producto"/.test(pagina) && /medir\("pago_confirmado"/.test(pagina));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
