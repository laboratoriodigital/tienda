/* C-2 — el SEO horneado.
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO NECESITA UNA BATERÍA, Y NO UNA MIRADA.
 * Un JSON-LD roto **no rompe la tienda**. El navegador ignora el bloque, la
 * página se ve perfecta, el comerciante no nota nada — y simplemente se deja de
 * salir en Google durante meses. Es el modo de fallo que este proyecto lleva
 * persiguiendo desde el primer día: el que funciona y miente.
 *
 * SE PRUEBA CON UNA TIENDA INVENTADA. La lógica se ejercita con un catálogo de
 * mentira —una floristería—, no con el del repositorio: una prueba que solo
 * pasa con los datos del comercio de turno no está probando el producto. Del
 * `publicar/` real solo se comprueba la FORMA: que el bloque esté, que el
 * sitemap cuadre con el catálogo publicado, que los tipos estén declarados.
 *
 * No necesita servidor ni navegador: son archivos y aritmética.
 *
 *   node pruebas/seo.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const leer = r => fs.readFileSync(path.join(RAIZ, r), 'utf8');

/* Una floristería que no existe, con un dato SIN LLENAR a propósito: la hoja
   siembra los pendientes entre corchetes y la tienda ya los esconde al pintar.
   Aquí se comprueba que tampoco lleguen a los datos estructurados. */
const TIENDA = {
  version: '2026-09-19-1',
  config: {
    sitio_url: 'https://flores-de-abril.ejemplo.workers.dev',
    negocio: 'Flores de Abril',
    sitio_titulo: 'Flores de Abril — ramos de temporada',
    sitio_descripcion: 'Ramos armados el mismo día. Pide por WhatsApp.',
    empresa_ciudad: 'Manizales, Caldas',
    empresa_tel: '300 222 3344',
    empresa_correo: 'hola@flores-de-abril.ejemplo',
    empresa_direccion: '[DIRECCIÓN]',        // el comerciante no la ha llenado
    empresa_razon: '[RAZÓN SOCIAL]'
  },
  productos: [
    { id: 'ramo-girasoles', nombre: 'Ramo de girasoles', categoria: 'Ramos',
      precio: 45000, stock: 8, descripcion: 'Seis girasoles con follaje de temporada.',
      imagenes: ['girasoles-1.jpg'] },
    { id: 'ramo-rosas', nombre: 'Ramo de rosas', categoria: 'Ramos',
      precio: 62000, stock: 0, descripcion: 'Doce rosas rojas.', imagenes: [] },
    { id: 'orquidea', nombre: 'Orquídea en maceta', categoria: 'Matas',
      precio: 90000, stock: 3, descripcion: '', imagenes: ['https://cdn.ejemplo/orq.jpg'] }
  ]
};

(async () => {
  const seo = await import('../montar/sembrar-seo.mjs');
  const d = seo.datos(TIENDA);
  const grafo = d['@graph'];
  const nodo = t => grafo.find(n => n['@type'] === t);
  const fichas = grafo.filter(n => n['@type'] === 'Product');

  // ── El comercio y el sitio ──
  ok('EL COMERCIO va en los datos estructurados',
     nodo('Organization') && nodo('Organization').name === 'Flores de Abril',
     JSON.stringify(nodo('Organization') || {}).slice(0, 70));
  ok('  ...con su teléfono y su correo, que es por donde lo buscan',
     nodo('Organization').telephone === '300 222 3344' &&
     nodo('Organization').email === 'hola@flores-de-abril.ejemplo');
  ok('EL SITIO se declara, y dice de quién es',
     nodo('WebSite') && nodo('WebSite').publisher['@id'] === nodo('Organization')['@id'],
     'sin el enlace entre los dos, Google los trata como cosas distintas');

  /* LO QUE ESTÁ ENTRE CORCHETES NO EXISTE. Un dato de contacto falso en los
     datos estructurados acaba en una ficha de empresa equivocada, y eso lo
     arregla el comerciante por teléfono con Google, no nosotros con un commit. */
  const crudo = JSON.stringify(d);
  ok('LO QUE EL COMERCIANTE NO HA LLENADO no se publica',
     !/\[DIRECCIÓN\]|\[RAZÓN SOCIAL\]|\[[A-ZÁÉÍÓÚÑ ]+\]/.test(crudo),
     (crudo.match(/\[[^\]]{3,30}\]/) || ['nada entre corchetes'])[0]);
  ok('  ...pero lo que SÍ está llenado, sí',
     nodo('Organization').address.addressLocality === 'Manizales, Caldas' &&
     !('streetAddress' in nodo('Organization').address),
     'la ciudad está, la dirección no: exactamente lo que dice la hoja');

  // ── Las fichas de producto ──
  ok('CADA PRODUCTO tiene su ficha', fichas.length === TIENDA.productos.length,
     fichas.length + ' fichas para ' + TIENDA.productos.length + ' productos');
  const girasoles = fichas.find(f => f.sku === 'ramo-girasoles');
  ok('  ...con precio y moneda, que sin eso no es una oferta',
     girasoles.offers.price === '45000' && girasoles.offers.priceCurrency === 'COP',
     girasoles.offers.price + ' ' + girasoles.offers.priceCurrency);
  ok('  ...y con su enlace propio, el mismo que abre esa ficha',
     girasoles.offers.url.endsWith('/?p=ramo-girasoles'), girasoles.offers.url);
  ok('  ...y la foto en dirección absoluta',
     girasoles.image === 'https://flores-de-abril.ejemplo.workers.dev/fotos/girasoles-1.jpg',
     girasoles.image);
  ok('  ...sin tocar la que ya venía completa',
     fichas.find(f => f.sku === 'orquidea').image === 'https://cdn.ejemplo/orq.jpg');

  /* AGOTADO NO ES INEXISTENTE. La ficha se indexa igual: quien llegue por
     Google ve que el producto existe y vuelve cuando haya. */
  ok('UN PRODUCTO AGOTADO se indexa como agotado, no se esconde',
     fichas.find(f => f.sku === 'ramo-rosas').offers.availability
       === 'https://schema.org/OutOfStock',
     fichas.find(f => f.sku === 'ramo-rosas').offers.availability);
  ok('  ...y uno con existencias, como disponible',
     girasoles.offers.availability === 'https://schema.org/InStock');
  ok('  ...y una descripción vacía no se inventa',
     !('description' in fichas.find(f => f.sku === 'orquidea')));

  // ── El sitemap ──
  const mapa = seo.sitemap(TIENDA);
  const locs = (mapa.match(/<loc>([^<]*)<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, ''));
  ok('EL SITEMAP lista la portada y EXACTAMENTE los productos, ni uno más',
     locs.length === TIENDA.productos.length + 1 &&
     TIENDA.productos.every(p => locs.includes(
       'https://flores-de-abril.ejemplo.workers.dev/?p=' + p.id)),
     locs.length + ' direcciones para ' + TIENDA.productos.length + ' productos');
  /* UN SITEMAP CON FECHA DEL DÍA rompe el determinismo del horneado (A-6):
     cada corrida parecería un cambio y publicaría por nada. */
  ok('  ...sin fecha del día, que haría publicar en cada corrida',
     !/lastmod/.test(mapa), 'A-6: hornear dos veces deja git status limpio');
  ok('  ...y es XML bien formado, con su declaración y su espacio de nombres',
     /^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(mapa) &&
     /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(mapa));

  // ── robots.txt ──
  const rob = seo.robots(TIENDA);
  ok('ROBOTS.TXT dice dónde está el sitemap',
     /^Sitemap: https:\/\/flores-de-abril\.ejemplo\.workers\.dev\/sitemap\.xml$/m.test(rob),
     (rob.match(/Sitemap:.*/) || [''])[0]);
  ok('  ...y deja fuera el panel, el tablero y el rastreo del pedido',
     seo.SIN_INDEXAR.every(p => rob.includes('Disallow: /' + p)),
     seo.SIN_INDEXAR.join(', '));

  // ── Escrito en el HTML, no puesto por JavaScript ──
  {
    const plantilla = leer('plantilla/index.html');
    const publicado = leer('publicar/index.html');

    ok('LA PLANTILLA deja el hueco marcado, y vacío',
       /<!-- ═══ DATOS ESTRUCTURADOS ═══/.test(plantilla) &&
       !/application\/ld\+json/.test(plantilla),
       'sin hornear no hay datos que publicar: es una plantilla, no una tienda');
    ok('EL PUBLICADO lleva el bloque ESCRITO en el HTML',
       /<script type="application\/ld\+json">/.test(publicado),
       'un rastreador no ejecuta JavaScript: lo que no está escrito, no existe');

    /* Y NO LO PONE LA PÁGINA AL ARRANCAR. Si algún día alguien lo "arregla"
       generándolo desde JavaScript, la página se vería idéntica y Google
       volvería a no ver nada. */
    ok('  ...y NINGÚN JavaScript de la tienda lo escribe',
       !/ld\+json/.test(publicado.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')),
       'generarlo al arrancar se ve igual y Google no lo lee');

    const dentro = publicado.slice(
      publicado.indexOf('<script type="application/ld+json">') +
      '<script type="application/ld+json">'.length,
      publicado.indexOf('</script>', publicado.indexOf('application/ld+json')));
    let real = null;
    try { real = JSON.parse(dentro.replace(/\\u003c/g, '<')); } catch (e) { real = e.message; }
    ok('  ...y es JSON válido de verdad, no casi',
       real && real['@graph'], typeof real === 'string' ? real : 'lo es');

    /* EL SITEMAP PUBLICADO CUADRA CON EL CATÁLOGO PUBLICADO. Son dos archivos
       generados del mismo dato; el día que uno se hornee y el otro no, el
       sitemap manda a Google a fichas que ya no existen. */
    const cat = JSON.parse(leer('publicar/catalogo.json'));
    const pub = (leer('publicar/sitemap.xml').match(/\?p=([^<]*)/g) || [])
      .map(s => decodeURIComponent(s.slice(3)));
    ok('EL SITEMAP PUBLICADO lista exactamente los productos publicados',
       pub.length === cat.productos.length &&
       cat.productos.every(p => pub.includes(String(p.id))),
       pub.length + ' en el sitemap · ' + cat.productos.length + ' en el catálogo');
  }

  // ── Una dirección sin esquema no es una dirección ──
  {
    /* El comerciante escribe `mitienda.workers.dev` en la hoja, que es lo
       natural. Sin https:// delante, un <loc> no es una URL absoluta y el
       sitemap entero queda inválido; y un href="mitienda.workers.dev/" lo
       resuelve el navegador CONTRA LA PÁGINA ACTUAL, así que el canónico
       apuntaba a una página que no existe y la imagen de la tarjeta al
       compartir no cargaba nunca. Estuvo publicado sin que nadie lo notara,
       porque no rompe nada visible. */
    const sinEsquema = Object.assign({}, TIENDA, { config: Object.assign({},
      TIENDA.config, { sitio_url: 'flores-de-abril.ejemplo.workers.dev' }) });
    const m = seo.sitemap(sinEsquema);
    ok('UNA DIRECCIÓN SIN https:// se completa, no se publica a medias',
       (m.match(/<loc>([^<]*)<\/loc>/g) || []).every(l => /<loc>https:\/\//.test(l)),
       (m.match(/<loc>[^<]*<\/loc>/) || [''])[0]);
    ok('  ...y lo mismo en los datos estructurados',
       seo.datos(sinEsquema)['@graph'][0].url === 'https://flores-de-abril.ejemplo.workers.dev/',
       seo.datos(sinEsquema)['@graph'][0].url);
    ok('  ...sin tocar la que ya venía completa',
       seo.conEsquema('https://ya.esta/') === 'https://ya.esta/' &&
       seo.conEsquema('http://sin.tls/') === 'http://sin.tls/');

    /* LOS DOS NORMALIZADORES TIENEN QUE COINCIDIR. Están en dos sitios a
       propósito —el maestro arregla el <head> de las tiendas que se actualicen,
       esto arregla el SEO de todas hoy—, y dos copias de una regla es como
       empiezan a decir cosas distintas. */
    const delMaestro = (() => {
      const src = leer('maestro.gs').match(/function conEsquema\(u\) \{[\s\S]*?\n\}/);
      return src ? new Function('return ' + src[0].replace('function conEsquema', 'function'))() : null;
    })();
    const casos = ['mitienda.workers.dev', 'https://ya.esta/', 'http://sin.tls',
                   '', '   ', '//sin-protocolo.ejemplo', 'con.barra/al/final/'];
    ok('EL MAESTRO y el horneado normalizan la dirección IGUAL',
       !!delMaestro && casos.every(c => delMaestro(c) === seo.conEsquema(c)),
       delMaestro ? (casos.find(c => delMaestro(c) !== seo.conEsquema(c)) || 'los siete casos')
                  : 'no encontré conEsquema en maestro.gs');
  }

  // ── noindex donde toca ──
  {
    /* Cualquier página de publicar/ que no sea la tienda tiene que llevar
       noindex. Hoy solo existe el 404; el panel es M3 y el tablero la 1.1, y
       cuando aparezcan esta aserción los está esperando. */
    const dir = path.join(RAIZ, 'publicar');
    const paginas = fs.readdirSync(dir).filter(f => /\.html$/.test(f) && f !== 'index.html');
    const sinNoindex = paginas.filter(f =>
      !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    ok('NINGUNA página que no sea la tienda se indexa',
       paginas.length > 0 && sinNoindex.length === 0,
       sinNoindex.length ? 'sin noindex: ' + sinNoindex.join(', ')
                         : paginas.join(', ') + ' — todas con noindex');
  }

  // ── Determinismo (A-6) ──
  {
    const html = leer('publicar/index.html');
    const a = seo.aplicar(html, TIENDA).html;
    const b = seo.aplicar(a, TIENDA).html;
    ok('HORNEAR DOS VECES deja el archivo idéntico',
       a === b, 'si no, cada corrida publicaría por nada');
    ok('  ...y el sitemap también', seo.sitemap(TIENDA) === seo.sitemap(TIENDA));
  }

  // ── Y que esta batería distinga algo ──
  {
    /* Sin sitio_url no hay de qué sitio hablar: ni enlaces de ficha ni sitemap.
       Si esto dejara de caerse, es que arriba no se está mirando nada. */
    const sinUrl = Object.assign({}, TIENDA,
      { config: Object.assign({}, TIENDA.config, { sitio_url: '' }) });
    ok('ESTA BATERÍA DISTINGUE: sin la dirección del sitio, no hay sitemap',
       seo.sitemap(sinUrl) === '' &&
       !seo.datos(sinUrl)['@graph'].some(n => n.url),
       'si diera un sitemap igual, estaría inventándose las direcciones');
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
