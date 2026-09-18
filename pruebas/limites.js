/* B-7 — LOS TOPES, MEDIDOS DE VERDAD Y VIGILADOS
   ----------------------------------------------------------------------------
   Este archivo existía desde hacía meses, levantaba un navegador, medía cinco
   tamaños de catálogo… y NO ESTABA en la lista de `todas.sh`. O sea: no corría
   nunca. Imprimía una tabla preciosa que nadie veía, y mientras tanto ninguna
   de las cosas que medía estaba vigilada por nadie.

   La historia B-7 lo plantea como binario —«o entra o se va»— y la medición
   decidió: la corrida entera cuesta **menos de tres segundos**, porque reutiliza
   un solo navegador y la página pinta rápido a cualquier tamaño. No había
   ninguna razón de coste para dejarla fuera; solo se había quedado fuera.

   QUÉ SE AFIRMA Y QUÉ NO. Los milisegundos se IMPRIMEN pero no se afirman: el
   reloj de una máquina cargada es una entrada que nadie declaró (patrón 8), y
   una aserción sobre tiempos se cae sola un martes por la tarde y enseña a
   ignorarla. Lo que sí se afirma es lo que no depende del reloj: cuántos bytes
   ocupa el catálogo, cuántas tarjetas llegan a la primera pantalla, y que las
   dos cosas crezcan como tienen que crecer.

   LA AFIRMACIÓN QUE MÁS VALE es la tercera. La tienda pagina: pinte 50 productos
   o 1000, a la primera pantalla llegan 25. El día que alguien rompa la
   paginación, la tienda de un comercio con catálogo grande va a intentar dibujar
   mil tarjetas en un teléfono — y eso no se ve en ninguna otra batería, porque
   todas prueban con ocho productos.
*/
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el /__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Cuántas caben en la primera pantalla. No se escribe la cifra en dos sitios:
   se mide con el catálogo más pequeño y se exige que los demás den lo mismo.
   Así, si un día se decide paginar de 30 en 30, esta batería sigue midiendo lo
   que dice medir —que el número NO crece con el catálogo— en vez de caerse por
   un cambio deliberado. */
const TOPE_KB = 400;   // 1000 productos en un móvil por datos: 400 KB es el techo

(async () => {
  const b = await chromium.launch();
  const medidas = [];

  for (const n of [50, 150, 300, 600, 1000]) {
    await fetch(U + '/__reset');
    await fetch(U + '/__muchos?n=' + n);
    const t0 = Date.now();
    const txt = await (await fetch(U + '/exec?a=catalogo')).text();
    const msCat = Date.now() - t0;
    const kb = Math.round(Buffer.byteLength(txt) / 1024);

    const p = await b.newPage({ viewport: { width: 375, height: 812 } });
    const t1 = Date.now();
    await p.goto(U, { waitUntil: 'load' });
    await p.waitForFunction(() => document.querySelectorAll('.rejilla .tarjeta').length > 0,
                            { timeout: 30000 }).catch(() => {});
    const msPintar = Date.now() - t1;
    const tarjetas = await p.locator('.rejilla .tarjeta').count();
    const heap = await p.evaluate(() =>
      (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0));
    await p.close();

    medidas.push({ n, kb, msCat, msPintar, tarjetas, heap });
    console.log(`  ${String(n).padStart(5)} productos | catálogo ${String(kb).padStart(4)} KB` +
                ` en ${String(msCat).padStart(4)} ms | tienda lista en ${String(msPintar).padStart(5)} ms` +
                ` | ${tarjetas} tarjetas en pantalla | heap ${heap} MB`);
  }
  console.log('');

  const grande = medidas[medidas.length - 1];
  const chico  = medidas[0];

  ok('LA TIENDA PINTA con cualquier tamaño de catálogo',
     medidas.every(m => m.tarjetas > 0),
     medidas.map(m => m.n + ':' + m.tarjetas).join(' · '));

  /* LO QUE LLEGA A LA PRIMERA PANTALLA NO CRECE CON EL CATÁLOGO. Es la
     afirmación que justifica esta batería: sin paginación, un comercio con
     1000 productos le pide al teléfono de su cliente mil tarjetas de golpe, y
     ninguna otra batería lo vería porque todas prueban con ocho. */
  ok('  ...y a la primera pantalla llega SIEMPRE lo mismo, pagine lo que pagine',
     medidas.every(m => m.tarjetas === chico.tarjetas),
     'con ' + chico.n + ' productos ' + chico.tarjetas + ' tarjetas; con ' +
     grande.n + ', ' + grande.tarjetas);

  ok('EL CATÁLOGO de 1000 productos sigue cabiendo en unos datos móviles',
     grande.kb < TOPE_KB, grande.kb + ' KB (tope ' + TOPE_KB + ')');

  /* CRECE COMO TIENE QUE CRECER. Un catálogo que crece más que linealmente
     -porque alguien mete dentro de cada producto algo que depende del resto-
     no se nota con ocho productos y se nota mucho con mil. Se compara el coste
     POR PRODUCTO en los dos extremos, con holgura para el encabezado fijo. */
  const porProducto = m => m.kb / m.n;
  ok('  ...y crece de forma lineal, no peor',
     porProducto(grande) <= porProducto(chico) * 1.5,
     (porProducto(chico) * 1024).toFixed(0) + ' B/producto con ' + chico.n +
     ' · ' + (porProducto(grande) * 1024).toFixed(0) + ' B/producto con ' + grande.n);

  ok('LA MEMORIA del navegador no se dispara con el catálogo grande',
     grande.heap === 0 || grande.heap < 100,
     grande.heap ? grande.heap + ' MB' : 'este navegador no publica performance.memory');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  await b.close();
  process.exit(0);
})();
