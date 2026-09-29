/* ============================================================================
   LO QUE VE EL COMPRADOR CUANDO NO CONTESTA NADIE.
   ----------------------------------------------------------------------------
   Esta batería existe por un fallo que no se veía mirando el código: el montaje
   escribía en cada index.html el <head>, las cinco constantes y la paleta de SU
   comercio — y dejaba el catálogo de respaldo del comercio de la plantilla. La
   tienda dos, de cosméticos, abría con ocho tomates un instante y se corregía
   sola cuando llegaba el catálogo. El parpadeo era lo visible. Lo caro era lo
   otro: sin red ese instante no se acaba, y esa tienda vende tomate.

   POR QUÉ ES UNA BATERÍA APARTE Y NO UNA REGLA DE ESTILO.
   El primer intento fue una guarda de texto: «ninguna batería de navegador
   puede nombrar un producto de Orgánico», calcada de la que puso la paleta en
   la 2.9.9. Marcó diez baterías, y las diez tenían razón: nombran tomates
   porque conducen la HOJA EMULADA, que es de fábrica y es igual en todas las
   tiendas. Una comprobación que acusa al producto de un acierto es peor que no
   tener ninguna (patrón 5), así que se cambió por esto: en vez de prohibir una
   palabra, se monta una tienda que no es Orgánico y se mira qué pinta.

   CÓMO. Se coge el index.html real, se le escribe el respaldo de un comercio
   inventado con la misma herramienta que usa el flujo —`sembrar-respaldo.mjs`,
   no una copia— y se sirve ese archivo con la hoja MUERTA. Lo que se pinta
   entonces tiene que ser, entero, del comercio inventado.

   La pregunta que contesta distinto con el arreglo puesto y sin él: ¿de quién
   es la tienda que se ve cuando Google no está?
   ============================================================================ */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('fs');
const respaldo = require('../montar/sembrar-respaldo.mjs');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Un comercio que no se parece en nada al de la plantilla: ni los productos, ni
   las zonas de envío, ni el nombre, ni los colores. Si algo de Orgánico
   sobrevive a esto, se ve. */
const OTRA = {
  productos: [
    { id: 'labial', nombre: 'Labial mate larga duración', formato: 'Unidad',
      categoria: 'Labios', precio: 38000, stock: 12,
      descripcion: 'Acabado mate, ocho horas.', imagenes: [] },
    { id: 'base', nombre: 'Base líquida tono 3', formato: 'Frasco 30 ml',
      categoria: 'Rostro', precio: 62000, stock: 4,
      descripcion: 'Cobertura media.', imagenes: [] },
    { id: 'brocha', nombre: 'Brocha de polvos', formato: 'Unidad',
      categoria: 'Accesorios', precio: 25000, stock: 0,
      descripcion: 'Pelo sintético.', imagenes: [] }
  ],
  envios: [
    { id: 'tienda', nombre: 'Recoger en el local', valor: 0 },
    { id: 'bogota', nombre: 'Bogotá', valor: 7000 }
  ],
  config: {
    negocio: 'Cinnamon Beauty',
    whatsapp: '573218550807',
    portada_titulo: 'Maquillaje profesional',
    pie_descripcion: 'Cosmética para todos los días',
    color_principal: '#EA9999', color_secundario: '#F1C232', color_alterno: '#7A3E3E',
    empresa_ciudad: 'Bogotá, Cundinamarca', empresa_tel: '321 855 0807'
  }
};

/* LAS PALABRAS DE ORGÁNICO QUE NO PUEDEN APARECER. No es una lista de estilo:
   es lo que estaba saliendo de verdad en la tienda de otro comercio. */
const DE_ORGANICO = /Orgánico|Tomate chonto|Tomate cherry|Sofrito|Rionegro|573008610480/;

(async () => {
  /* PUERTO 0: que lo elija el sistema. `todas.sh` reparte puertos fijos por
     índice —8100, 8102, …— y una batería que se inventara el suyo sumando uno
     se metería en el de la de al lado. Eso no falla siempre: falla cuando dos
     corren a la vez, que es justo como corren. */
  const html = fs.readFileSync('./index.html', 'utf8');

  /* ¿PUEDE EXISTIR ESTE ESCENARIO EN ESTE REPOSITORIO?
     `publicar/index.html` NO se sincroniza desde la semilla: nace de la hoja de
     cada comercio y llega por la release. Así que una tienda puede tener ya el
     código del 4.20 —flujos, `sembrar-respaldo.mjs`, esta batería— y todavía el
     index.html de antes, que no declara CONFIG_SEMILLA ni lo aplica. Escribirle
     el bloque funciona; la página no lo mira, y esto salía en rojo acusando al
     producto de algo que está bien y que solo espera un paso del despliegue.
     Pasó en Cinnamon Beauty el 14 de septiembre de 2026, en el primer push.

     Es el caso de «un escenario que no puede existir hoy se salta DICIÉNDOLO»
     (patrón 8, regla 2). Saltarlo en silencio sería lo otro: esconderlo. */
  if (html.indexOf('window.SEMILLA_APLICADA = true') === -1) {
    console.log('  SALTA | esta batería entera: el index.html de esta tienda es anterior al 4.20.');
    console.log('');
    console.log('  No declara CONFIG_SEMILLA ni lo aplica, así que lo que se pinta antes');
    console.log('  de la red todavía es el comercio de la plantilla. Esto NO es un fallo');
    console.log('  del código: `publicar/index.html` no se sincroniza, llega por la');
    console.log('  release.');
    console.log('');
    console.log('  Lo que falta, una vez por tienda:');
    console.log('    1. Bajar index.html de la última release de la semilla');
    console.log('       https://github.com/laboratoriodigital/organico/releases/latest/download/index.html');
    console.log('    2. Reemplazar publicar/index.html, commit y push');
    console.log('    3. Correr el flujo `montaje`');
    console.log('');
    console.log('  Desde ese momento esta batería corre y mide de verdad.');
    console.log('\nResultado: 0/0');
    return;
  }

  /* Se escribe con la MISMA herramienta del flujo. Una copia de la lógica aquí
     probaría la copia, no el producto (patrón 2). */
  const escrito = respaldo.aplicar(html, OTRA, '2026-09-14').html;
  /* Sin servicio: es la única forma de estar seguro de que lo que se ve es el
     respaldo del archivo y no una respuesta que llegó por detrás. Es la trampa
     que tenía cat.js: pedía «caído», que deja el catálogo vivo, y daba el
     respaldo por probado mirando una tienda con la hoja contestando. */
  const suelto = escrito.replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "";');

  const servidor = http.createServer((req, res) => {
    if (req.url.indexOf('/catalogo.json') === 0) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(suelto);
  });
  await new Promise(r => servidor.listen(0, r));
  const puerto = servidor.address().port;

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));
  await p.goto('http://localhost:' + puerto + '/');
  await p.waitForSelector('.rejilla .tarjeta');

  const visto = await p.evaluate(() => ({
    marca: document.querySelector('#marcaNombre').textContent.trim(),
    pie: document.querySelector('#pieNombre').textContent.trim(),
    portada: (document.querySelector('#portadaTitulo') || {}).textContent || '',
    flotante: (document.querySelector('#flotante') || {}).href || '',
    productos: VISIBLES.length,
    nombres: VISIBLES.map(x => x.nombre),
    envios: TARIFAS.map(e => e.id),
    rojo: getComputedStyle(document.documentElement).getPropertyValue('--rojo').trim(),
    formas: VISIBLES.map(x => x.forma)
  }));

  ok('SIN RED, la tienda que se ve es la de ESTE comercio',
     visto.marca === 'Cinnamon Beauty' && visto.pie === 'Cinnamon Beauty',
     visto.marca + ' / ' + visto.pie);
  ok('  ...con sus productos, no con los de la plantilla',
     visto.productos === OTRA.productos.length &&
     visto.nombres.join('|') === OTRA.productos.map(x => x.nombre).join('|'),
     visto.nombres.join(' · '));
  ok('  ...sus zonas de envío', visto.envios.join(',') === 'tienda,bogota', visto.envios.join(','));
  ok('  ...su WhatsApp', visto.flotante.indexOf('573218550807') !== -1, visto.flotante.slice(0, 40));
  ok('  ...su titular de portada', visto.portada === 'Maquillaje profesional', visto.portada);
  ok('  ...y su color, desde la primera pintada',
     visto.rojo.toUpperCase() === '#EA9999', visto.rojo);

  /* EL MARCADOR DEL PRODUCTO SIN FOTO. Lo calculaba el Apps Script y lo
     escribía dentro del respaldo; lo vivo lo heredaba POR ID de ahí, con
     «tomate» de reserva. Un producto que no estuviera en el respaldo —o una
     tienda que no vende tomate— se dibujaba con un tomate. Ahora lo decide la
     página a partir del formato y la categoría, en un solo sitio.

     El nombre exacto de esa forma de reserva NO es lo que hay que fijar
     aquí: `plantilla/index.html` ya la renombró de "tomate" a "redondo" -un
     cambio de higiene, sin efecto visible-, pero `publicar/index.html` -el
     archivo real que esta batería sirve, vía el arnés- es un snapshot que
     todavía no se volvió a hornear con esa plantilla (la misma razón,
     documentada en plantilla/index.html, por la que el mensaje de WhatsApp
     de esta tienda también sigue llevando el 🍅). Fijar aquí el string
     "redondo" hace fallar la prueba HOY -"tomate" es lo que de verdad hay
     en el archivo que se sirve- y la pondría a fallar de nuevo, al revés, el
     día que SÍ se hornee. Lo que de verdad hay que comprobar —y lo que no
     cambia con el nombre— es que Cinnamon Beauty usa LA MISMA forma de
     reserva para sus dos productos sin foto, y no una prestada de otro
     comercio ni distinta entre ellos. */
  ok('  ...y el dibujo del producto sin foto es el mismo para los dos, no uno de otro comercio',
     visto.formas[1] === 'frasco' && !!visto.formas[0] &&
     visto.formas[0] === visto.formas[2] && visto.formas[0] !== 'frasco',
     visto.formas.join(' · '));

  const texto = await p.locator('body').innerText();
  ok('NO QUEDA NI UNA PALABRA del comercio de la plantilla en la página',
     !DE_ORGANICO.test(texto),
     (texto.match(DE_ORGANICO) || ['ninguna'])[0]);

  /* Y LA PRUEBA DE QUE ESTA BATERÍA DISTINGUE ALGO: el MISMO archivo, con otro
     respaldo escrito, tiene que pintar al otro comercio. Si lo que sale fuera
     siempre lo mismo, esto no estaría mirando nada.

     0.20.6 · ANTES ESTO LEÍA `publicar/index.html` del repositorio, contando con
     que ahí seguía el respaldo de la plantilla —el de Orgánico— y exigiendo que
     apareciera. Eso es cierto en la semilla y FALSO en cualquier tienda, donde
     ese archivo es la tienda del comercio y no tiene ni una palabra de la
     plantilla: el control negativo se caía por tener razón, y con él la corrida
     que iba a publicar la actualización (bitácora 93). Ahora el negativo no
     depende de qué repositorio sea: se escribe un TERCER comercio y se mira
     quién sale. */
  const TERCERA = {
    productos: [
      { id: 'tornillo', nombre: 'Tornillo hexagonal 3/8', formato: 'Caja x100',
        categoria: 'Ferretería', precio: 19000, stock: 7,
        descripcion: 'Acero galvanizado.', imagenes: [] }
    ],
    envios: [{ id: 'bodega', nombre: 'Recoger en la bodega', valor: 0 }],
    config: {
      negocio: 'Ferretería El Perno', whatsapp: '573001112233',
      portada_titulo: 'Todo para el taller', pie_descripcion: 'Ferretería industrial',
      color_principal: '#2F5D50', color_secundario: '#C8A951', color_alterno: '#1B3A33',
      empresa_ciudad: 'Medellín, Antioquia', empresa_tel: '300 111 2233'
    }
  };
  const otroRespaldo = respaldo.aplicar(html, TERCERA, '2026-09-29').html
    .replace(/const SCRIPT_URL = "[^"]*";/, 'const SCRIPT_URL = "";');
  const s2 = http.createServer((req, res) => {
    if (req.url.indexOf('/catalogo.json') === 0) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(otroRespaldo);
  });
  await new Promise(r => s2.listen(0, r));
  const puerto2 = s2.address().port;
  const p2 = await ctx.newPage();
  await p2.goto('http://localhost:' + puerto2 + '/');
  await p2.waitForSelector('.rejilla .tarjeta');
  const elTercero = await p2.locator('body').innerText();
  ok('ESTA BATERÍA DISTINGUE: con OTRO respaldo escrito, la página pinta al otro',
     /Tornillo hexagonal/.test(elTercero) && /Ferretería El Perno/.test(elTercero) &&
     !/Labial mate|Brocha de polvos|Cinnamon Beauty/.test(elTercero),
     'si saliera siempre lo mismo, es que no está mirando el respaldo');

  ok('Sin errores de JavaScript', errores.length === 0, errores[0] || '');

  await b.close();
  servidor.close(); s2.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
})();
