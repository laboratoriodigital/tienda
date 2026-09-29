/* Comprueba que la tienda es genérica: cambiando SOLO la pestaña Configuración
   de la hoja, la misma index.html se convierte en otro negocio. */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo, pintado } = require('./esperar.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const cfg = async (clave, valor) => {
  const H = await (await fetch(U + '/__hojas')).json();
  const fila = H['Configuración'].findIndex(f => f[0] === clave);
  if (fila < 1) throw new Error('no existe la clave ' + clave);
  await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + (fila + 1) + '&c=2&v=' + encodeURIComponent(valor));
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errores = [];
  p.on('pageerror', e => errores.push(e.message));

  await fetch(U + '/__reset');

  // ═══ 1. Con la configuración de fábrica ═══
  await p.goto(U); await catalogoListo(p);
  /* Contra el comercio de prueba, no contra una marca escrita aquí: lo que
     se comprueba es que el valor viene DE LA HOJA, y eso vale para
     cualquier tienda. */
  const { COMERCIO } = require('./gas.js');
  ok('La hoja trae configuración',
     (await p.evaluate(() => NEGOCIO)) === COMERCIO.negocio,
     await p.evaluate(() => NEGOCIO));
  ok('El titular sale de la hoja',
     (await p.locator('#portadaTitulo').innerText()) === COMERCIO.portada_titulo);

  const icono = await p.evaluate(() => {
    const l = document.querySelector('link[rel="icon"]');
    return l ? decodeURIComponent(l.getAttribute('href')) : '';
  });
  /* LOS COLORES DE LA MARCA, NO LOS DE ORGÁNICO.
     Esta aserción exigía `#D0211C` y `#1B5E3A` a pelo. Pasaba desde siempre
     porque la única tienda montada usaba los colores de fábrica — y se puso
     roja el primer día que un comercio eligió los suyos, que es justo el día
     en que TODO funcionó bien. El flujo `montaje` corre las baterías sobre el
     index.html que acaba de escribir CON LA CONFIGURACIÓN DE ESA TIENDA, así
     que cualquier cosa quemada aquí es una tienda que no se puede montar.
     Es el patrón 4 de la bitácora: una prueba que solo sabe ver la primera
     tienda no prueba el producto.

     Lo que sí vale en cualquier tienda: el icono y el `theme-color` salen los
     dos de `color_principal`, así que TIENEN QUE COINCIDIR. Eso comprueba que
     el color de la hoja llegó al archivo, sea el que sea. */
  const tema = await p.evaluate(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    return m ? m.getAttribute('content') : '';
  });
  /* 0.22.4 · EL ICONO PUEDE SER UNA FOTO DE LA TIENDA (bitácora 107). Desde la
     0.21.0 `favicon` —o, si falta, `logo`— manda sobre el marcador dibujado:
     un nombre de archivo sale como `fotos/<nombre>` y una dirección, tal cual.
     Esto solo sabía ver el dibujado, y se puso rojo en la semilla el día que
     su hoja tuvo logo: el patrón 4, otra vez en la batería que lo cuenta. */
  const esFoto = /^fotos\/[^/?#]+\.(png|jpe?g|webp|gif|svg|ico)$/i.test(icono);
  const esDireccion = /^https:\/\/[^\s"'<>]+$/i.test(icono);
  if (esFoto || esDireccion) {
    const fsx = require('fs'), px = require('path');
    ok('La pestaña del navegador lleva el icono propio de ESTA tienda',
       esDireccion || fsx.existsSync(px.join(__dirname, '..', 'publicar', icono)),
       icono + (esFoto ? ' (tiene que estar publicado en publicar/fotos/)' : ''));
    ok('  ...y el color de la barra del navegador es un color de verdad',
       /^#[0-9A-Fa-f]{6}$/.test(tema), 'theme-color ' + (tema || '(ninguno)'));
  } else {
    ok('La pestaña del navegador dibuja un icono propio',
       /^data:image\/svg\+xml,<svg/.test(icono) && /circle/.test(icono),
       icono.slice(0, 46));
    ok('  ...dibujado dentro del propio archivo, sin pedir nada al servidor',
       icono.indexOf('http') === -1 || icono.indexOf('http') > 30,
       'no hay petición extra');
    const delIcono = (icono.match(/fill='(#[0-9A-Fa-f]{6})'/) || [])[1] || '';
    ok('  ...con los colores de ESTA tienda, no con los de la primera',
       /^#[0-9A-Fa-f]{6}$/.test(tema) && delIcono.toUpperCase() === tema.toUpperCase(),
       'icono ' + (delIcono || '(ninguno)') + ' · theme-color ' + (tema || '(ninguno)'));
    ok('  ...y el segundo color también es un color de verdad',
       /stroke='(#[0-9A-Fa-f]{6})'/.test(icono),
       'si no es un hex de seis dígitos, la página lo tira sin avisar');
  }
  ok('  ...y también para la pantalla de inicio del celular',
     await p.evaluate(() => !!document.querySelector('link[rel="apple-touch-icon"]')));

  // ═══ 2. Cambiamos el negocio ENTERO desde la hoja ═══
  await cfg('negocio', 'Panadería La Espiga');
  await cfg('whatsapp', '573001112233');
  await cfg('portada_titulo', 'Pan de verdad, todos los días.');
  await cfg('portada_texto', 'Masa madre y horno de leña. Amasamos de madrugada.');
  await cfg('portada_puntos', 'Horneado hoy|Domicilio en la ciudad|Pides por WhatsApp');
  await cfg('color_principal', '#7A4A21');
  await cfg('color_secundario', '#2F5D3A');
  await cfg('pie_descripcion', 'Panadería artesanal. Envigado, Antioquia.');
  await cfg('como_compras', 'Escoges tu pan|Confirmas por WhatsApp|Pagas contra entrega');
  await cfg('empresa_ciudad', 'Envigado, Antioquia');
  await cfg('empresa_tel', '300 111 2233');
  await cfg('empresa_razon', 'La Espiga S.A.S.');
  await cfg('empresa_nit', '901.234.567-8');
  await cfg('empresa_correo', 'datos@laespiga.co');

  await p.goto(U); await catalogoListo(p);

  ok('CAMBIA EL NOMBRE en la barra', (await p.locator('#marcaNombre').innerText()) === 'Panadería La Espiga',
     await p.locator('#marcaNombre').innerText());
  ok('  ...y en el pie', (await p.locator('#pieNombre').innerText()) === 'Panadería La Espiga');
  ok('CAMBIA EL TITULAR', (await p.locator('#portadaTitulo').innerText()) === 'Pan de verdad, todos los días.',
     await p.locator('#portadaTitulo').innerText());
  ok('  ...y el párrafo', /masa madre/i.test(await p.locator('#portadaTexto').innerText()));

  const puntos = await p.evaluate(() => [...document.querySelectorAll('#portadaDatos span')].map(s => s.textContent.trim()));
  ok('CAMBIAN las tres leyendas del banner',
     puntos.length === 3 && puntos[0] === 'Horneado hoy' && puntos[2] === 'Pides por WhatsApp',
     puntos.join(' · '));

  const pasos = await p.evaluate(() => [...document.querySelectorAll('#comoCompras li')].map(s => s.textContent.trim()));
  ok('CAMBIA "Cómo compras"', pasos.length === 3 && pasos[2] === 'Pagas contra entrega', pasos.join(' · '));

  const colores = await p.evaluate(() => ({
    rojo: getComputedStyle(document.documentElement).getPropertyValue('--rojo').trim(),
    verde: getComputedStyle(document.documentElement).getPropertyValue('--verde').trim(),
    portada: getComputedStyle(document.querySelector('.portada')).backgroundColor
  }));
  ok('CAMBIAN LOS COLORES de marca', colores.rojo === '#7A4A21' && colores.verde === '#2F5D3A',
     colores.rojo + ' / ' + colores.verde);
  ok('  ...y la portada se repinta de verdad', colores.portada === 'rgb(122, 74, 33)', colores.portada);

  ok('CAMBIA el WhatsApp del botón flotante',
     (await p.locator('#flotante').getAttribute('href')).includes('573001112233'),
     (await p.locator('#flotante').getAttribute('href')).slice(0, 40));

  // ═══ 3. Los datos legales también salen de la hoja ═══
  await p.evaluate(() => abrirLegal('terminos'));
  await pintado(p);
  const legal = await p.locator('#legalCaja').innerText();
  ok('LOS TEXTOS LEGALES usan los datos de la hoja',
     legal.includes('La Espiga S.A.S.') && legal.includes('901.234.567-8'),
     (legal.match(/Quien vende es [^.]*/) || [''])[0]);
  ok('  ...y el correo de contacto', legal.includes('datos@laespiga.co'));
  ok('  ...y la ciudad', legal.includes('Envigado, Antioquia'));
  await p.evaluate(() => cerrarLegal());

  // ═══ 4. El pedido usa el WhatsApp nuevo ═══
  await p.evaluate(() => { agregar('croissant', 2); abrirPanel(); });
  await selloListo(p);
  await p.fill('#fNombre', 'Ana Ruiz'); await p.fill('#fTel', '3001234567');
  await p.fill('#fCiudad', 'Envigado'); await p.fill('#fDir', 'Calle 1');
  await p.check('#consiento'); await selloListo(p);
  const enlace = await p.evaluate(() => document.querySelector('#btnFinalizar').href);
  ok('EL PEDIDO va al WhatsApp nuevo', enlace.includes('wa.me/573001112233'), enlace.slice(0, 45));
  ok('  ...y el mensaje lleva el nombre nuevo',
     decodeURIComponent(enlace.split('text=')[1]).includes('Panadería La Espiga'));

  // ═══ 5. Sin hoja, el respaldo del archivo sostiene la tienda ═══
  await fetch(U + '/__modo?m=muerto');   // ni siquiera responde el catálogo
  await p.goto(U); await catalogoListo(p);
  /* EL RESPALDO ES EL DE ESTA TIENDA, Y ESO ES LO QUE SE COMPRUEBA.
     Decía 'Orgánico' y 8 productos a pelo, y pasaba porque el montaje escribía
     el <head>, las constantes y la paleta de cada comercio pero NO el catálogo
     de respaldo: ese se quedaba con el de la plantilla en todas las tiendas.
     Desde el 4.20 lo escribe `sembrar-respaldo.mjs`, así que lo que hay que
     exigir no es un nombre —eso vuelve a ser el patrón 4— sino que el archivo
     esté de acuerdo consigo mismo. */
  /* `typeof` y no la variable a pelo: una tienda con el index.html de antes del
     4.20 no declara CONFIG_SEMILLA, y leerla revienta la evaluación entera con
     un ReferenceError que no se parece en nada a lo que pasa. El index.html no
     se sincroniza desde la semilla —llega por la release—, así que ese archivo
     viejo es un estado normal, no un error. */
  const delArchivo = await p.evaluate(() => {
    const semilla = (typeof CONFIG_SEMILLA === 'object' && CONFIG_SEMILLA) || {};
    return {
      negocio: (semilla.negocio || NEGOCIO || '').trim(),
      whatsapp: String(semilla.whatsapp || WHATSAPP || '').replace(/[^0-9]/g, ''),
      productos: PRODUCTOS.length
    };
  });
  /* LO QUE SE PUEDE EXIGIR DEPENDE DE QUÉ index.html TENGA ESTA TIENDA.
     `publicar/index.html` no se sincroniza desde la semilla: llega por la
     release. Una tienda puede tener el código del 4.20 y todavía el archivo de
     antes, que no aplica CONFIG_SEMILLA — y entonces, sin red, el marcado
     todavía dice lo de la plantilla. Eso no es un fallo del código: es el paso
     del despliegue que falta. Se dice, y se exige lo que sí puede ser cierto
     hoy: que la tienda no se rompa y sirva su catálogo. */
  const conSemilla = await p.evaluate(() => window.SEMILLA_APLICADA === true);

  ok('Sin hoja usa el respaldo y no se rompe',
     (await p.evaluate(() => VISIBLES.length)) === delArchivo.productos &&
     (await p.locator('.rejilla .tarjeta').count()) > 0,
     delArchivo.productos + ' productos, ' +
     (await p.locator('.rejilla .tarjeta').count()) + ' tarjetas en la página');

  if (conSemilla) {
    ok('  ...y lo que se lee es el nombre de ESTE comercio',
       (await p.locator('#marcaNombre').innerText()) === delArchivo.negocio,
       await p.locator('#marcaNombre').innerText());
    ok('  ...y el WhatsApp de respaldo sigue siendo válido',
       delArchivo.whatsapp.length >= 10 &&
       (await p.locator('#flotante').getAttribute('href')).includes(delArchivo.whatsapp),
       delArchivo.whatsapp);
  } else {
    console.log('  SALTA | el nombre y el WhatsApp sin red: este index.html es ' +
                'anterior al 4.20.\n          Falta traerlo de la release de la semilla y ' +
                'correr el flujo montaje.');
  }
  /* LA PARTE NUEVA, que es la que este arreglo existe para sostener: sin red,
     la tienda tiene que hablar de SU comercio. Un respaldo que funciona pero
     vende lo de otro es el patrón 1 — el fallo que funciona. */
  /* Que el respaldo hable de ESTE comercio y no del de la plantilla se prueba
     entero en `respaldo.js`, que se escribe un archivo de otra tienda y lo
     sirve con la hoja muerta. Aquí sobraría: el arnés corre sin semilla a
     propósito —ver todas.sh— porque su index.html y su hoja emulada son de
     comercios distintos. */
  await fetch(U + '/__modo?m=ok');

  /* ═══ 0.23.0 · EL ALTO DEL LOGO, DESDE LA HOJA (bitácora 109) ═══
     Medido en el navegador, no leído en el CSS: 40, 80 o 120 en computador,
     más chico en el celular, y la barra lo contiene. Un index publicado antes
     de la 0.23.0 no lo sabe hacer: ahí se salta y se dice, hasta el montaje. */
  const pagina = await (await fetch(U)).text();
  if (!/v\("logo_tamano"\)/.test(pagina)) {
    console.log('  SALTA | el alto del logo: este index.html es anterior a la 0.23.0.\n' +
                '          Llega con el siguiente montaje.');
  } else {
    const medir = async () => p.evaluate(() => {
      const m = document.querySelector('.marca');
      let i = m.querySelector('img[data-prueba]');
      if (!i) { i = document.createElement('img'); i.dataset.prueba = '1';
        i.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'/%3E"; m.prepend(i); }
      return { img: Math.round(i.getBoundingClientRect().height),
               barra: Math.round(document.querySelector('.barra-int').getBoundingClientRect().height),
               dato: document.documentElement.dataset.logo };
    });
    const medidas = {};
    for (const [ancho, t] of [[1280, '40'], [1280, '80'], [1280, '120'], [1280, 'grande'], [375, '80'], [375, '120']]) {
      await p.setViewportSize({ width: ancho, height: 812 });
      await cfg('logo_tamano', t);
      await p.goto(U); await catalogoListo(p);
      medidas[ancho + ':' + t] = await medir();
    }
    const d = medidas;
    ok('EL ALTO DEL LOGO sale de la hoja: 40, 80 o 120 en computador',
       d['1280:40'].img === 40 && d['1280:80'].img === 80 && d['1280:120'].img === 120,
       [40, 80, 120].map(x => x + '→' + d['1280:' + x].img).join(' · '));
    ok('  ...y la barra lo contiene, con aire',
       ['40', '80', '120'].every(x => d['1280:' + x].barra >= d['1280:' + x].img + 12),
       ['40', '80', '120'].map(x => 'barra ' + d['1280:' + x].barra).join(' · '));
    ok('  ...y lo que no es 40, 80 ni 120 se lee como 80', d['1280:grande'].img === 80, 'grande→' + d['1280:grande'].img);
    ok('  ...y en el celular baja: 80→52, 120→68',
       d['375:80'].img === 52 && d['375:120'].img === 68, d['375:80'].img + ' · ' + d['375:120'].img);
    await cfg('logo_tamano', '80');
    await p.setViewportSize({ width: 375, height: 812 });
  }

  ok('Sin errores de JavaScript', errores.length === 0, errores[0] || '');
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close(); process.exit(0);
})();
