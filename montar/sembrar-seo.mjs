/**
 * C-2 — EL SEO SE HORNEA, COMO EL CATÁLOGO
 * ---------------------------------------------------------------------------
 *   node montar/sembrar-seo.mjs
 *   node montar/sembrar-seo.mjs --revisar   (no escribe; falla si cambió)
 *
 * POR QUÉ EXISTE, Y POR QUÉ HORNEADO.
 * Los rastreadores **no ejecutan JavaScript**, o lo ejecutan tarde y a
 * regañadientes. Esta tienda pinta su catálogo desde JavaScript, así que para
 * Google la página es, literalmente, una plantilla vacía: no hay productos, no
 * hay precios, no hay nada que indexar. El comercio paga un dominio y no sale
 * en ninguna búsqueda.
 *
 * La respuesta es la misma que ya tomó este proyecto para el catálogo y para el
 * respaldo: **se hornea**. Lo que Google tiene que leer va escrito en el HTML,
 * no puesto por la página al arrancar.
 *
 * DE DÓNDE SALEN LOS DATOS, Y POR QUÉ DE AHÍ.
 * De `publicar/catalogo.json`, que `catalogo-estatico.mjs` acaba de hornear en
 * este mismo flujo. NO se le vuelve a preguntar al maestro: sería la segunda
 * lectura del mismo dato y, de las dos, una se queda atrás (patrón 2). Es la
 * misma decisión de `sembrar-respaldo.mjs` y de `nombrar-worker.mjs`.
 *
 * LO QUE ESTÁ ENTRE CORCHETES NO EXISTE. La hoja siembra `[DIRECCIÓN]`,
 * `[RAZÓN SOCIAL]` y demás como forma de decir «esto todavía no lo tengo», y la
 * tienda ya los esconde al pintar. Publicárselos a Google sería peor que
 * omitirlos: un dato de contacto falso en los datos estructurados es lo que
 * acaba en una ficha de empresa equivocada, y eso lo arregla el comerciante por
 * teléfono con Google, no nosotros con un commit.
 *
 * SIN FECHAS. El `sitemap.xml` no lleva `<lastmod>` a propósito: el horneado es
 * determinista (A-6), y una fecha del día dentro de un archivo generado hace
 * que cada corrida parezca un cambio y publique por nada.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const INDEX    = 'publicar/index.html';
const CATALOGO = 'publicar/catalogo.json';
const SITEMAP  = 'publicar/sitemap.xml';
const ROBOTS   = 'publicar/robots.txt';
const revisar  = process.argv.includes('--revisar');

export const ESCRIBE = [INDEX, SITEMAP, ROBOTS];

/* Las páginas que NO se indexan, con el nombre que tendrán cuando existan. El
   panel es M3 y el tablero y el rastreo son la 1.1; ponerlas aquí desde ya
   cuesta tres líneas y evita el día en que se publique un panel de gestión
   indexable — que no se descubre hasta que alguien lo encuentra buscando. */
export const SIN_INDEXAR = ['admin.html', 'tablero.html', 'pedido.html'];

const MARCA_INICIO = '<!-- ═══ DATOS ESTRUCTURADOS ═══';
const MARCA_FIN    = '<!-- ═══ FIN DE LOS DATOS ESTRUCTURADOS ═══ -->';

/* Un valor de la hoja que el comerciante todavía no llenó. La hoja los siembra
   entre corchetes y la tienda ya los esconde; aquí se hace lo mismo. */
export const puesto = v => {
  const s = String(v === undefined || v === null ? '' : v).trim();
  return s && !/^\[.*\]$/.test(s) ? s : '';
};

/* UNA DIRECCIÓN SIN https:// NO ES UNA DIRECCIÓN. El comerciante escribe
   `mitienda.workers.dev` en la hoja, que es lo natural, y un <loc> sin esquema
   no es una URL absoluta: el sitemap entero queda inválido, y sin decirlo.

   El maestro también lo normaliza, desde hoy, al armar el <head> (conEsquema).
   Que esté en los dos sitios es deliberado y no es el patrón 2: una tienda ya
   montada NO recibe el maestro nuevo hasta que alguien la ponga al día a mano
   —la actualización automática de la flota salió del MVP—, así que el maestro
   arregla las que se actualicen y esto arregla a todas hoy. Hay una aserción
   que comprueba que los dos normalizan igual. */
export const conEsquema = u => {
  const s = String(u || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
};

const base = config => {
  const u = conEsquema(puesto(config.sitio_url));
  return u ? u.replace(/\/*$/, '/') : '';
};

/* Dentro de un <script>, la secuencia `</script` cierra el bloque aunque vaya
   dentro de una cadena JSON. Y `<` escapado como < sigue siendo el mismo
   texto para cualquier lector de JSON, así que no se pierde nada. */
export const enScript = obj => JSON.stringify(obj, null, 1).replace(/</g, '\\u003c');

const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Los datos estructurados de esta tienda, como objeto. */
export function datos(catalogo) {
  const config = (catalogo && catalogo.config) || {};
  const productos = Array.isArray(catalogo && catalogo.productos) ? catalogo.productos : [];
  const url = base(config);
  const negocio = puesto(config.negocio);
  const moneda = puesto(config.moneda) || 'COP';   // tiendas colombianas
  const yo = url + '#comercio';

  const direccion = {};
  if (puesto(config.empresa_direccion)) direccion.streetAddress = puesto(config.empresa_direccion);
  if (puesto(config.empresa_ciudad))    direccion.addressLocality = puesto(config.empresa_ciudad);

  const comercio = { '@type': 'Organization', '@id': yo };
  if (negocio) comercio.name = negocio;
  if (url) comercio.url = url;
  if (url) comercio.logo = url + 'compartir.jpg';
  if (puesto(config.empresa_tel))    comercio.telephone = puesto(config.empresa_tel);
  if (puesto(config.empresa_correo)) comercio.email = puesto(config.empresa_correo);
  if (Object.keys(direccion).length) {
    comercio.address = Object.assign({ '@type': 'PostalAddress', addressCountry: 'CO' }, direccion);
  }

  const sitio = { '@type': 'WebSite' };
  if (url) sitio.url = url;
  if (puesto(config.sitio_titulo) || negocio) sitio.name = puesto(config.sitio_titulo) || negocio;
  if (puesto(config.sitio_descripcion)) sitio.description = puesto(config.sitio_descripcion);
  if (url) sitio.publisher = { '@id': yo };

  const fichas = productos.map(p => {
    const ficha = { '@type': 'Product', sku: String(p.id || ''), name: String(p.nombre || '') };
    if (puesto(p.descripcion)) ficha.description = puesto(p.descripcion);
    if (puesto(p.categoria)) ficha.category = puesto(p.categoria);

    /* La foto se da con su dirección absoluta: una relativa dentro de datos
       estructurados la resuelve cada rastreador a su manera, y algunos no la
       resuelven. */
    const foto = (Array.isArray(p.imagenes) ? p.imagenes : [])
      .map(n => String(n || '').trim()).filter(Boolean)[0];
    if (foto && url) {
      ficha.image = /^https?:\/\//i.test(foto) ? foto : url + 'fotos/' + foto;
    }

    const oferta = {
      '@type': 'Offer',
      price: String(Number(p.precio) || 0),
      priceCurrency: moneda,
      /* Stock 0 es «agotado», no «no existe»: la ficha se indexa igual y el
         comprador que llega por Google ve que existe y volverá. */
      availability: Number(p.stock) > 0
        ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    };
    if (url) { oferta.url = url + '?p=' + encodeURIComponent(String(p.id || '')); }
    if (url) oferta.seller = { '@id': yo };
    ficha.offers = oferta;
    return ficha;
  });

  return { '@context': 'https://schema.org', '@graph': [comercio, sitio, ...fichas] };
}

/** El bloque tal cual va dentro del <head>. */
export function bloque(catalogo) {
  return MARCA_INICIO + '\n' +
    '     Los hornea montar/sembrar-seo.mjs desde publicar/catalogo.json.\n' +
    '     No se editan a mano: el siguiente horneado los reescribe. -->\n' +
    '<script type="application/ld+json">\n' + enScript(datos(catalogo)) + '\n</script>\n' +
    MARCA_FIN;
}

export function sitemap(catalogo) {
  const config = (catalogo && catalogo.config) || {};
  const url = base(config);
  if (!url) return '';
  const productos = Array.isArray(catalogo && catalogo.productos) ? catalogo.productos : [];
  const enlaces = [url].concat(productos.map(p =>
    url + '?p=' + encodeURIComponent(String(p.id || ''))));
  /* Sin <lastmod> a propósito: ver la cabecera de este archivo. */
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    enlaces.map(u => '  <url><loc>' + xml(u) + '</loc></url>').join('\n') +
    '\n</urlset>\n';
}

export function robots(catalogo) {
  const url = base(((catalogo && catalogo.config) || {}));
  return 'User-agent: *\n' +
    'Allow: /\n' +
    SIN_INDEXAR.map(p => 'Disallow: /' + p).join('\n') + '\n' +
    (url ? '\nSitemap: ' + url + 'sitemap.xml\n' : '');
}

/** Mete (o reemplaza) el bloque en el HTML. O entero, o nada. */
export function aplicar(html, catalogo) {
  const nuevo = bloque(catalogo);
  const i = html.indexOf(MARCA_INICIO);
  let salida;
  if (i === -1) {
    /* Sin marca, se cuelga del cierre del <head>: una tienda horneada con una
       plantilla anterior a C-2 tiene que poder recibir esto sin que nadie
       edite su archivo a mano. */
    const cierre = html.indexOf('</head>');
    if (cierre === -1) throw new Error('El index.html no tiene </head>. No escribo nada.');
    salida = html.slice(0, cierre) + nuevo + '\n' + html.slice(cierre);
  } else {
    const j = html.indexOf(MARCA_FIN, i);
    if (j === -1) throw new Error(
      'El index.html abre los datos estructurados y no los cierra. No escribo nada.');
    salida = html.slice(0, i) + nuevo + html.slice(j + MARCA_FIN.length);
  }

  /* SE COMPRUEBA ANTES DE ESCRIBIR. Un JSON-LD roto no rompe la tienda —el
     navegador ignora el bloque— y por eso nadie se entera: simplemente se deja
     de salir en Google, meses. */
  const dentro = salida.slice(salida.indexOf(MARCA_INICIO));
  const crudo = dentro.slice(dentro.indexOf('<script type="application/ld+json">') +
                             '<script type="application/ld+json">'.length,
                             dentro.indexOf('</script>'));
  let comprobado;
  try { comprobado = JSON.parse(crudo.replace(/\\u003c/g, '<')); }
  catch (e) { throw new Error('El JSON-LD que acabo de armar no es JSON válido: ' +
                              e.message + '\nNo escribo nada.'); }
  if (!comprobado['@graph'] || comprobado['@graph'].length < 2) {
    throw new Error('El JSON-LD no declara ni el comercio ni el sitio. No escribo nada.');
  }

  return { html: salida, cambio: salida !== html,
           fichas: comprobado['@graph'].filter(n => n['@type'] === 'Product').length };
}

async function main() {
  let catalogo;
  try { catalogo = JSON.parse(await readFile(CATALOGO, 'utf8')); }
  catch (e) {
    throw new Error(
      'No pude leer ' + CATALOGO + ': ' + e.message + '\n\n' +
      'Este paso va DESPUÉS de hornear el catálogo: los datos estructurados\n' +
      'salen de ahí, no de otra pregunta al maestro.');
  }

  if (!base(catalogo.config || {})) {
    throw new Error(
      'La hoja no dice la dirección de la tienda (sitio_url), y sin ella los\n' +
      'datos estructurados y el sitemap no pueden decir de qué sitio hablan.\n' +
      'Escríbela en la pestaña Configuración. No escribo nada.');
  }

  const html = await readFile(INDEX, 'utf8');
  const r = aplicar(html, catalogo);
  const mapa = sitemap(catalogo);
  const rob = robots(catalogo);

  const igualMapa = await readFile(SITEMAP, 'utf8').then(t => t === mapa).catch(() => false);
  const igualRob  = await readFile(ROBOTS, 'utf8').then(t => t === rob).catch(() => false);

  if (!r.cambio && igualMapa && igualRob) {
    console.log('El SEO horneado ya es el de esta tienda. Nada que cambiar.');
    return;
  }
  if (revisar) {
    console.error('\nEl SEO horneado NO está al día con el catálogo publicado.\n');
    console.error('  Corre  node montar/sembrar-seo.mjs  y vuelve a subir.\n');
    process.exit(1);
  }

  await writeFile(INDEX, r.html);
  await writeFile(SITEMAP, mapa);
  await writeFile(ROBOTS, rob);

  console.log('SEO horneado desde ' + CATALOGO + ':');
  console.log('  · JSON-LD con el comercio, el sitio y ' + r.fichas + ' producto(s)');
  console.log('  · sitemap.xml con ' + (r.fichas + 1) + ' direcciones (la portada y cada ficha)');
  console.log('  · robots.txt apuntando al sitemap, y sin indexar ' + SIN_INDEXAR.join(', '));
  console.log('\nEscrito en el HTML, que es lo único que lee un rastreador.');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
