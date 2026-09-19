/* C-1 — variantes: la mitad que vive en la página.
 * ---------------------------------------------------------------------------
 * variantes.js prueba la hoja y el maestro: qué se lee de la celda, qué se
 * acepta del pedido, qué queda escrito. Esta prueba el otro lado, que tiene una
 * regla propia y opuesta:
 *
 *   EL MAESTRO FALLA ABIERTO ANTE LA ELECCIÓN QUE FALTA —acepta el pedido y
 *   avisa, porque rechazarlo es perder una venta que el comerciante resuelve
 *   con un mensaje—, PERO LA PÁGINA LA EXIGE. Quien puede preguntarle al
 *   comprador de qué talla la quiere es esta pantalla, y solo mientras está
 *   mirándola. Si aquí no se pide, el aviso del maestro llega cuando ya no hay
 *   a quién preguntarle.
 *
 * Y la consecuencia menos obvia, que es la que rompía cosas: DOS TONOS DEL
 * MISMO LABIAL SON DOS LÍNEAS DEL CARRITO, pero UNAS SOLAS EXISTENCIAS. El
 * carrito llevaba la cuenta por id —una línea por producto— y las dos reglas se
 * contradicen ahí mismo.
 *
 *   node pruebas/varpag.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, selloListo, pintado, hasta } = require('./esperar.js');

const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

const celda = (hoja, f, c, v) =>
  fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + c +
        '&v=' + encodeURIComponent(v)).then(r => r.json());

/* El producto de esta batería se agrega desde la hoja, con STOCK CORTO a
   propósito: tres unidades es lo que hace visible que dos tonos del mismo
   labial se reparten unas solas existencias. Va aparte de los productos de
   gas.js para no cambiarle el stock a las demás baterías. */
const ID = 'labial';
async function sembrarLabial(variantes) {
  await fetch(U + '/__producto?id=' + ID + '&nombre=' + encodeURIComponent('Labial mate') +
              '&categoria=Belleza&precio=20000&stock=3');
  const h = await (await fetch(U + '/__hojas')).json();
  const fila = h['Catálogo'].findIndex(f => String(f[0]) === ID) + 1;
  await celda('Catálogo', fila, 14, variantes);
  return fila;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:390,height:844} });
  const errs = [], avisosConsola = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'warning') avisosConsola.push(m.text()); });

  const contador = () => p.evaluate(() => Number(document.querySelector('#contador').textContent));
  const lineas   = () => p.locator('.linea-item').count();
  const items    = async () => {
    const q = await (await fetch(U + '/__peticiones')).json();
    const v = q.filter(x => x.a === 'validar').pop();
    return v ? String(v.items) : '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Con variantes: elegir es obligatorio
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  let filaLabial = await sembrarLabial('Talla: S|M|L ; Color: Rosa|Nude');
  await p.goto(U); await catalogoListo(p);

  const tarjeta = () => p.locator('.tarjeta').filter({ hasText:'Labial mate' }).first();

  /* Cada tramo abre la ficha por su cuenta en vez de dar por hecho que sigue
     abierta. No es adorno: si la obligación de elegir se rompiera, el botón de
     agregar habría cerrado la ficha, y el resto de la batería se quedaría
     esperando un selector invisible treinta segundos en lugar de decir qué
     falló. Una batería tiene que saber CONTAR lo que salió mal, no colgarse. */
  const abrirF = async () => { await p.evaluate(() => abrirFicha('labial')); await pintado(p); };
  ok('LA TARJETA NO AGREGA: dice «Elegir», porque desde la rejilla no hay dónde escoger',
     (await tarjeta().locator('.acciones .btn-solido').innerText()).trim() === 'Elegir',
     (await tarjeta().locator('.acciones .btn-solido').innerText()).trim());

  await tarjeta().locator('.acciones .btn-solido').click(); await pintado(p);
  ok('  ...y lleva a la ficha sin tocar el carrito',
     (await p.locator('#ficha').getAttribute('class')).includes('abierta') &&
     (await contador()) === 0, 'contador ' + (await contador()));

  ok('LA FICHA PINTA UN SELECTOR POR GRUPO, en el orden de la hoja',
     (await p.locator('.variantes select').count()) === 2 &&
     (await p.locator('.variantes label').first().innerText()).trim() === 'Talla',
     (await p.locator('.variantes select').count()) + ' selectores');
  ok('  ...con las opciones de la hoja y una entrada vacía delante',
     (await p.locator('#var0 option').count()) === 4 &&
     (await p.locator('#var1 option').count()) === 3 &&
     (await p.locator('#var0').inputValue()) === '',
     (await p.locator('#var0 option').count()) + ' y ' + (await p.locator('#var1 option').count()));

  // Agregar sin elegir: no agrega, Y DICE QUÉ FALTA.
  await p.locator('.ficha-agregar .btn-solido').click(); await pintado(p);
  ok('SIN ELEGIR NO AGREGA', (await contador()) === 0, 'contador ' + (await contador()));
  ok('  ...y nombra lo que falta, con el nombre que puso el comercio',
     /Falta elegir talla y color/i.test(await p.locator('#avisoVariante').innerText()),
     await p.locator('#avisoVariante').innerText());

  await abrirF();
  await p.selectOption('#var0', 'M'); await pintado(p);

  /* La ficha se repinta al cambiar de foto. Si eso borrara lo elegido, el
     comprador pierde la talla por mirar la segunda foto y nadie se lo dice. */
  await p.evaluate(() => pintarFicha()); await pintado(p);
  ok('LO ELEGIDO SOBREVIVE AL REPINTADO de la ficha',
     (await p.locator('#var0').inputValue()) === 'M', await p.locator('#var0').inputValue());

  await p.locator('.ficha-agregar .btn-solido').click(); await pintado(p);
  ok('  ...y con una elegida y otra no, nombra SOLO la que falta',
     (await contador()) === 0 &&
     /Falta elegir color/i.test(await p.locator('#avisoVariante').innerText()),
     await p.locator('#avisoVariante').innerText());

  await abrirF();
  await p.selectOption('#var0', 'M'); await p.selectOption('#var1', 'Rosa'); await pintado(p);
  await p.locator('.ficha-agregar .btn-solido').click(); await pintado(p);
  ok('CON TODO ELEGIDO SÍ AGREGA', (await contador()) === 1, 'contador ' + (await contador()));
  ok('  ...y el carrito muestra la elección, no solo el producto',
     /Talla: M · Color: Rosa/.test(await p.locator('.linea-item').first().innerText()),
     (await p.locator('.linea-item').first().innerText()).replace(/\n/g, ' | '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Dos líneas del mismo producto, unas solas existencias
  // ═══════════════════════════════════════════════════════════════════════════
  await abrirF();
  await p.selectOption('#var0', 'S'); await p.selectOption('#var1', 'Nude'); await pintado(p);
  await p.locator('.ficha-agregar .btn-solido').click(); await pintado(p);
  ok('OTRO TONO ES OTRA LÍNEA, no una unidad más de la primera',
     (await lineas()) === 2 && (await contador()) === 2,
     (await lineas()) + ' líneas, contador ' + (await contador()));

  /* El stock es del producto. Con tres labiales y dos ya en el carrito, queda
     uno: da igual en cuál de las dos líneas se pida. */
  await p.evaluate(() => cambiarCantidad('labial', 1, 0)); await pintado(p);
  ok('EL STOCK SE REPARTE ENTRE LAS LÍNEAS: 2 + 1 llega al tope de 3',
     (await contador()) === 3, 'contador ' + (await contador()));
  await p.evaluate(() => cambiarCantidad('labial', 1, 1)); await pintado(p);
  ok('  ...y la otra línea ya no puede subir, porque el stock es el mismo',
     (await contador()) === 3, 'contador ' + (await contador()));
  ok('  ...y los dos botones «+» quedan apagados',
     (await p.locator('.linea-item .cantidad button:last-child[disabled]').count()) === 2,
     (await p.locator('.linea-item .cantidad button:last-child[disabled]').count()) + ' apagados');

  await p.evaluate(() => agregar('labial', 1, { Talla:'L', Color:'Rosa' })); await pintado(p);
  ok('  ...y una tercera combinación tampoco entra sin existencias',
     (await lineas()) === 2 && (await contador()) === 3,
     (await lineas()) + ' líneas, contador ' + (await contador()));

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. La elección viaja: a la hoja y a WhatsApp
  // ═══════════════════════════════════════════════════════════════════════════
  await selloListo(p);
  const enviado = await items();
  ok('LA LÍNEA QUE VIAJA A LA HOJA lleva la elección: id:cantidad:Grupo=Opción',
     /labial:2:Talla=M;Color=Rosa/.test(enviado) &&
     /labial:1:Talla=S;Color=Nude/.test(enviado), enviado);
  ok('  ...y el maestro la acepta y sella el pedido',
     await p.evaluate(() => !!(sello && sello.ref)),
     JSON.stringify(await p.evaluate(() => sello && { ref:sello.ref, avisos:sello.avisos })));

  const mensaje = await p.evaluate(() => armarMensaje());
  ok('EL MENSAJE DE WHATSAPP dice la talla: es lo que el comercio lee para empacar',
     /Talla: M · Color: Rosa/.test(mensaje) && /Talla: S · Color: Nude/.test(mensaje),
     (mensaje.split('\n').slice(3, 9).join(' | ')));

  /* Firmar sin la elección era sellar un pedido y mandar otro: la hoja
     confirmaba el precio de «dos labiales» y el comercio recibía dos tonos. */
  ok('  ...y la firma del pedido distingue los tonos, o el sello no sirve',
     /Talla=M/.test(await p.evaluate(() => firmaPedido())),
     await p.evaluate(() => firmaPedido()));

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Quitar toca UNA línea
  // ═══════════════════════════════════════════════════════════════════════════
  await p.evaluate(() => quitar('labial', 0)); await pintado(p);
  ok('QUITAR SE LLEVA UNA LÍNEA, no todas las del producto',
     (await lineas()) === 1 &&
     /Talla: S · Color: Nude/.test(await p.locator('.linea-item').first().innerText()),
     (await lineas()) + ' líneas');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Una opción que el catálogo ya no ofrece
  // ═══════════════════════════════════════════════════════════════════════════
  await celda('Catálogo', filaLabial, 14, 'Talla: S|M ; Color: Rosa');
  await p.evaluate(() => { delArchivo = false; });
  await p.evaluate(() => pedirleElCatalogoAlMaestro());
  await hasta(p, () => (producto('labial').variantes[1].opciones.length === 1));
  await p.evaluate(() => refrescar()); await pintado(p);
  ok('LA ELECCIÓN QUE YA NO SE OFRECE TUMBA LA LÍNEA: no se corrige a ojo',
     (await lineas()) === 0 && (await contador()) === 0,
     (await lineas()) + ' líneas, contador ' + (await contador()));

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Texto que no cabe en la línea del pedido
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await sembrarLabial('Talla: 40,5|41 ; Color: Rosa|Nude');
  await p.goto(U); await catalogoListo(p);
  await p.evaluate(() => abrirFicha('labial')); await pintado(p);
  ok('UN GRUPO CON , : ; = o | SE CAE: rompería la línea del pedido en silencio',
     (await p.locator('.variantes select').count()) === 1 &&
     (await p.locator('.variantes label').first().innerText()).trim() === 'Color',
     (await p.locator('.variantes select').count()) + ' selectores');
  ok('  ...y queda dicho en la consola, no solo desaparece',
     avisosConsola.some(t => /variantes/.test(t) && /Talla/.test(t)),
     avisosConsola.join(' | ').slice(0, 120));
  ok('  ...pero el producto SIGUE A LA VENTA: fallo abierto en el catálogo',
     !(await tarjeta().locator('.acciones .btn-solido').isDisabled()));

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. El interruptor f_variantes
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await sembrarLabial('Talla: S|M|L ; Color: Rosa|Nude');
  const hojas = await (await fetch(U + '/__hojas')).json();
  const filaFlag = hojas['Configuración'].findIndex(f => String(f[0]) === 'f_variantes') + 1;
  await celda('Configuración', filaFlag, 2, 'No');
  await p.goto(U); await catalogoListo(p);

  ok('CON f_variantes EN «No» la tarjeta vuelve a agregar directo',
     (await tarjeta().locator('.acciones .btn-solido').innerText()).trim() === 'Agregar',
     (await tarjeta().locator('.acciones .btn-solido').innerText()).trim());
  await p.evaluate(() => abrirFicha('labial')); await pintado(p);
  ok('  ...y la ficha no pinta ningún selector',
     (await p.locator('.variantes select').count()) === 0);
  await p.locator('.ficha-agregar .btn-solido').click(); await pintado(p);
  ok('  ...y agregar funciona sin elegir nada', (await contador()) === 1,
     'contador ' + (await contador()));
  await selloListo(p);
  ok('  ...y la línea que viaja a la hoja vuelve a ser id:cantidad, sin tercer campo',
     /(^|,)labial:1(,|$)/.test(await items()), await items());

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Un producto sin variantes no cambia en nada
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await sembrarLabial('Talla: S|M ; Color: Rosa');
  await p.goto(U); await catalogoListo(p);
  const otra = p.locator('.tarjeta').filter({ hasText:'Pan de masa madre' }).first();
  await otra.locator('.acciones .btn-solido').click(); await pintado(p);
  ok('EL PRODUCTO SIN COLUMNA VARIANTES agrega desde la tarjeta, como siempre',
     (await contador()) === 1, 'contador ' + (await contador()));
  await p.evaluate(() => abrirFicha('pan-masa-madre')); await pintado(p);
  ok('  ...y su ficha no pinta selectores', (await p.locator('.variantes').count()) === 0);
  await selloListo(p);
  ok('  ...y su línea no lleva tercer campo',
     /pan-masa-madre:1(,|$)/.test(await items()), await items());

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));

  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
