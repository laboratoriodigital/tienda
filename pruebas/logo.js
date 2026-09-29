/* 0.21.0 — el logo del comercio: la barra, la pestaña y la carpeta de Drive.
 * ---------------------------------------------------------------------------
 * Lo que decidió el dueño, y por qué se prueba cada cosa:
 *
 *   · SOLO LA BARRA. El logo reemplaza al signo dibujado, al lado del nombre.
 *     Ni la portada ni el pie: lo que importa más que la estética es que la
 *     página siga siendo una sola petición y no se mueva al cargar.
 *   · EL MISMO ARCHIVO SIRVE DE ICONO de la pestaña. Pedir dos archivos para lo
 *     mismo es pedir que uno de los dos se quede viejo.
 *   · EL NOMBRE SIGUE ESCRITO. El logo va con alt vacío —es decorativo— porque
 *     lo que nombra la tienda está al lado en texto: es lo que leen Google y un
 *     lector de pantalla, y no se cambia por una imagen.
 *
 * Y lo que se nombra es un ARCHIVO DE LA MISMA CARPETA DE DRIVE donde el
 * comercio ya tiene sus fotos, igual que en la columna Imágenes del catálogo.
 * Antes solo se aceptaba una URL de Cloudinary: el comercio que subía su logo
 * al Drive no tenía manera de usarlo.
 *
 *   node pruebas/logo.js
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

/* ── La hoja ────────────────────────────────────────────────────────────── */
const filas = g.filas('Configuración');
const dice = k => (filas.filter(f => String(f[0]).trim() === k)[0] || [])[2] || '';
ok('LAS DOS CLAVES existen en la hoja de fábrica, vacías',
   ['logo', 'favicon'].every(k => filas.some(f => String(f[0]).trim() === k && !String(f[1] || '').trim())));
ok('  ...y explican que es el archivo de la carpeta de fotos, no solo una URL',
   /carpeta de fotos/i.test(dice('logo')) && /logo\.png/i.test(dice('logo')) &&
   /se usa tu logo/i.test(dice('favicon')),
   dice('logo').slice(0, 60));

/* ── Lo que el panel deja escribir ──────────────────────────────────────── */
const def = k => g.api.CLAVES_DEL_PANEL.filter(d => d.clave === k)[0];
const mal = (k, v) => g.api.problemaDeValor(def(k), v);
ok('EL PANEL acepta el nombre del archivo y la dirección completa',
   mal('logo', 'logo.png') === null && mal('logo', 'mi-marca.WEBP') === null &&
   mal('logo', 'https://res.cloudinary.com/x/logo.png') === null && mal('logo', '') === null);
ok('  ...y rechaza lo que no se puede servir, diciendo las dos formas buenas',
   /logo\.png/.test(String(mal('logo', 'carpeta/logo.png'))) &&
   mal('logo', 'logo.txt') !== null && mal('logo', 'http://inseguro/logo.png') !== null,
   String(mal('logo', 'carpeta/logo.png')).slice(0, 70));
ok('  ...y el icono se valida igual que el logo', def('favicon').tipo === def('logo').tipo);

/* ── El icono de la pestaña ─────────────────────────────────────────────── */
const icono = c => g.api.iconoDeLaTienda(c);
ok('SIN NADA, el icono es el marcador dibujado con los colores de la marca',
   /^data:image\/svg\+xml,/.test(icono({ color_principal: '#D0211C' })));
ok('CON LOGO y sin icono propio, el icono ES el logo (lo decidió el dueño)',
   icono({ logo: 'logo.png' }) === 'fotos/logo.png' &&
   icono({ logo: 'https://res.cloudinary.com/x/l.png' }) === 'https://res.cloudinary.com/x/l.png');
ok('  ...y si hay icono propio, ese manda',
   icono({ logo: 'logo.png', favicon: 'icono.png' }) === 'fotos/icono.png');

/* ── El <head> horneado ─────────────────────────────────────────────────── */
const sinLogo = head();
config('logo', 'logo.png');
const conLogo = head();
ok('PONER EL LOGO CAMBIA lo que se hornea: la tienda tiene algo que publicar',
   conLogo !== sinLogo && /fotos\/logo\.png/.test(conLogo),
   'si no cambiara nada, el montaje diría «hay novedades» y no publicaría ninguna');
/* La política ya nombra a los tres proveedores conocidos venga o no venga un
   logo: lo que se mira aquí es si el logo AÑADE un host. Uno de la propia
   tienda no puede añadir ninguno —'self' ya lo cubre—; uno de fuera tiene que
   añadirse, o el navegador lo bloquea sin decir nada en la página. */
const hosts = t => (t.match(/img-src[^;]*/) || [''])[0];
ok('  ...y un logo de la propia tienda no mete un host más en la política',
   hosts(conLogo) === hosts(sinLogo) && !/midominio\.com/.test(conLogo),
   hosts(conLogo).slice(0, 90));
config('logo', 'https://midominio.com/logo.png');
const conAjeno = head();
ok('  ...y uno de fuera sí se declara, o el navegador lo bloquearía en silencio',
   /img-src[^;]*midominio\.com/.test(conAjeno) && hosts(conAjeno) !== hosts(sinLogo),
   hosts(conAjeno).slice(0, 90));
config('logo', 'logo.png');

/* ── La carpeta de Drive ────────────────────────────────────────────────── */
const usadas = g.api.fotosQueUsaElCatalogo();
ok('EL LOGO CUENTA como foto usada: no sale en «fotos que nadie usa»',
   usadas.indexOf('logo.png') !== -1, usadas.join(', '));
const { desajustes } = require('../montar/traer-fotos.mjs');
const d = desajustes([{ nombre: 'chonto-1.jpg' }], usadas);
ok('  ...y si el comercio escribe mal el nombre, el montaje lo dice por nombre',
   d.nombradas.indexOf('logo.png') !== -1,
   'una tienda publicada sin logo y sin un aviso es una tienda que nadie arregla');

/* ── La página ──────────────────────────────────────────────────────────── */
const pagina = fs.readFileSync('../plantilla/index.html', 'utf8');
const publicada = fs.readFileSync('../publicar/index.html', 'utf8');
[['plantilla', pagina], ['publicada', publicada]].forEach(([cual, t]) => {
  ok('LA PÁGINA (' + cual + ') resuelve el logo como una foto más: por nombre o por URL',
     /* 0.22.5: "entera" (sin el recorte cuadrado de las derivadas). La
        publicada se pone al día en el siguiente montaje: las dos valen. */
     (cual === 'plantilla' ? /const fuente = logo \? urlFoto\(logo, "entera"\) : "";/
                           : /const fuente = logo \? urlFoto\(logo, "(entera|miniatura)"\) : "";/).test(t) &&
     !/res\.cloudinary\.com\//.test(t.split('const logo = v("logo")')[1].slice(0, 400)),
     'antes solo se aceptaba Cloudinary');
  ok('  ...reemplaza al SIGNO y deja el nombre escrito (' + cual + ')',
     /signo\.replaceWith\(img\)/.test(t) && /img\.alt = "";/.test(t) &&
     /texto\("marcaNombre", NEGOCIO\)/.test(t),
     'el nombre en texto es lo que leen Google y un lector de pantalla');
  ok('  ...y si la imagen no llega, vuelve el signo (' + cual + ')',
     /img\.onerror = function\(\)\{ try\{ img\.replaceWith\(signo\); \}catch\(e\)\{\} \};/.test(t),
     'un icono roto se ve peor que ninguno');
});
ok('  ...y el tamaño lo fija la hoja de estilo, así que la barra no se mueve',
   /\.marca img\{height:\d+px;width:auto;max-width:\d+px/.test(pagina));
/* 0.22.5 · bitácora 108: a 22 px no se entendía. */
const alto = +((pagina.match(/\.marca img\{height:(\d+)px/) || [])[1] || 0);
const barra = +((pagina.match(/\.barra-int\{[^}]*height:(\d+)px/) || [])[1] || 0);
ok('  ...a un tamaño que se lee (al menos 36 px de alto) y que cabe en la barra',
   alto >= 36 && barra > 0 && alto <= barra - 12, 'logo ' + alto + ' px · barra ' + barra + ' px');
ok('  ...y sin el recorte cuadrado de las derivadas: un logo alargado se ve entero',
   /FOTOS\.webp && uso !== "entera" \? conTamano/.test(pagina));

/* ── Sin red ────────────────────────────────────────────────────────────── */
const respaldo = require('../montar/sembrar-respaldo.mjs');
const escrito = respaldo.aplicar(pagina, {
  productos: [{ id: 'p1', nombre: 'Uno', formato: 'Unidad', categoria: 'C', precio: 1000, stock: 3, descripcion: '', imagenes: [] }],
  envios: [{ id: 'local', nombre: 'Recoger', valor: 0 }],
  config: { negocio: 'X', logo: 'logo.png' } }, '2026-09-29').html;
ok('EL RESPALDO lleva el logo: sin red, la tienda se sigue viendo con su marca',
   /"logo": "logo\.png"/.test(escrito));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
