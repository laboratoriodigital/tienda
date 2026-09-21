/* C-1b — el inventario por combinación, en la página.
 * ---------------------------------------------------------------------------
 * inventario.js prueba el maestro. Esta prueba lo que ve el comprador:
 *
 *   · LO QUE NO HAY NO SE PUEDE ELEGIR. En la ficha, una opción sin
 *     existencias —dado lo que ya eligió— sale marcada y deshabilitada.
 *   · «ÚLTIMAS N» HABLA DE LA COMBINACIÓN, no del producto.
 *   · CADA COMBINACIÓN COMPITE POR LO SUYO también en el carrito.
 *   · LA TARJETA DICE AGOTADO SOLO CUANDO SE ACABARON TODAS.
 *   · AL ELEGIR ROSA SE VEN LAS FOTOS DE ROSA; sin fotos propias, las generales.
 *
 *   node pruebas/combinaciones.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, hasta } = require('./esperar.js');

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const hojas = async () => (await fetch(U + '/__hojas')).json();
const H = encodeURIComponent('Inventario por variante');
const quizas = pr => pr.catch(() => {});

async function celdaCat(id, col, v, num) {
  const f = ((await hojas())['Catálogo'] || []).findIndex(x => x[0] === id) + 1;
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + f + '&c=' + col + '&v=' + encodeURIComponent(v) +
              (num ? '&num=1' : '') + '&disparar=1');
}
async function stockCombo(id, combo, n) {
  const f = ((await hojas())['Inventario por variante'] || []).findIndex(x => x[0] === id && x[1] === combo) + 1;
  if (f < 1) throw new Error('sin fila ' + combo);
  await fetch(U + '/__celda?hoja=' + H + '&f=' + f + '&c=3&v=' + n + '&num=1&disparar=1');
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const texto = s => p.locator(s).innerText();

  await fetch(U + '/__reset');
  await celdaCat('croissant', 14, 'Talla: S|M|L ; Color: Rosa|Nude');
  await celdaCat('croissant', 8, 'croissant-1.jpg|croissant--color-rosa-1.jpg|croissant--color-rosa-2.jpg');
  ok('AL ESCRIBIR VARIANTES EN LA HOJA aparecen sus seis filas en el inventario',
     ((await hojas())['Inventario por variante'] || []).filter(f => f[0] === 'croissant').length === 6);
  await stockCombo('croissant', 'Talla: M · Color: Rosa', 1);
  await stockCombo('croissant', 'Talla: M · Color: Nude', 2);
  await stockCombo('croissant', 'Talla: S · Color: Rosa', 3);

  await p.goto(U);
  await catalogoListo(p);
  await quizas(hasta(p, () => { const x = producto('croissant'); return !!(x && x.skus); }));
  ok('LA PÁGINA RECIBE el stock por combinación', await p.evaluate(() => !!producto('croissant').skus));

  // ── La ficha ──
  await p.evaluate(() => abrirFicha('croissant'));
  const general = await p.getAttribute('#galeriaPrincipal img', 'src');
  ok('SIN ELEGIR, la ficha enseña la foto general', /croissant-1/.test(general) && !/color-rosa/.test(general), general);
  await p.selectOption('#var1', 'Rosa');
  const rosa = await p.getAttribute('#galeriaPrincipal img', 'src');
  ok('AL ELEGIR ROSA, la galería pasa a las fotos de Rosa', /color-rosa-1/.test(rosa), rosa);
  const opcionL = await p.evaluate(() => { const o = [...document.querySelector('#var0').options].find(x => x.value === 'L');
                                          return { d: o.disabled, t: o.textContent }; });
  ok('  ...y con Rosa elegida, la talla L —sin existencias en rosa— sale marcada y no se puede elegir',
     opcionL.d && /agotado/.test(opcionL.t), JSON.stringify(opcionL));
  await p.selectOption('#var0', 'M');
  ok('«ÚLTIMAS N» habla de la combinación: rosa M tiene 1',
     /Últimas 1 unidades/.test(await texto('.ficha-texto .disponible')), await texto('.ficha-texto .disponible'));
  await p.click('.ficha-agregar .btn-solido');
  await p.evaluate(() => abrirFicha('croissant'));
  await p.selectOption('#var1', 'Rosa'); await p.selectOption('#var0', 'M');
  ok('CON LA ÚNICA ROSA M EN EL CARRITO, no se puede agregar otra',
     /Todo en tu carrito/.test(await texto('.ficha-texto .disponible')) &&
     await p.locator('.ficha-agregar .btn-solido').isDisabled());
  await p.selectOption('#var1', 'Nude');
  ok('  ...pero la nude M sí: cada combinación compite por lo suyo',
     /Últimas 2 unidades/.test(await texto('.ficha-texto .disponible')) &&
     !(await p.locator('.ficha-agregar .btn-solido').isDisabled()), await texto('.ficha-texto .disponible'));
  const nudeFoto = await p.getAttribute('#galeriaPrincipal img', 'src');
  ok('  ...y Nude, que no tiene fotos propias, enseña las generales', /croissant-1/.test(nudeFoto), nudeFoto);
  await p.click('.ficha-agregar .btn-solido');
  const lineas = await p.evaluate(() => carrito.map(i => i.id + ' ' + textoVariante(producto(i.id), i.variante) + ' x' + i.cantidad));
  ok('EL CARRITO lleva las dos combinaciones', lineas.length === 2, lineas.join(' · '));

  // ── En el carrito, el + respeta la combinación ──
  await p.evaluate(() => abrirPanel());
  const mas = await p.evaluate(() => [...document.querySelectorAll('.linea-item')].map(l => ({
    t: l.querySelector('.formato').textContent, lleno: l.querySelector('.cantidad button:last-child').disabled })));
  ok('EN EL CARRITO, la rosa M no deja sumar y la nude M sí',
     mas.some(x => /Rosa/.test(x.t) && x.lleno) && mas.some(x => /Nude/.test(x.t) && !x.lleno), JSON.stringify(mas));

  // ── La tarjeta: agotado solo si se acabaron todas ──
  const tarjeta = async () => p.evaluate(() => {
    const t = [...document.querySelectorAll('#rejilla .tarjeta, #rejilla article')].find(x => /Croissant/.test(x.textContent));
    return t ? t.textContent.replace(/\s+/g, ' ') : '';
  });
  await p.evaluate(() => cerrarTodo());
  ok('LA TARJETA no dice Agotado mientras quede alguna combinación', !/Agotado/.test(await tarjeta()), (await tarjeta()).slice(0, 80));
  /* Y habla del PRODUCTO, no de la última combinación que se miró en la ficha:
     6 en total, 2 en el carrito. */
  ok('  ...y con la ficha cerrada, la tarjeta cuenta el producto entero, no la última combinación mirada',
     /Últimas 4 unidades|Disponible/.test(await tarjeta()) && !/Últimas 2/.test(await tarjeta()), (await tarjeta()).slice(0, 80));
  for (const c of ['Talla: M · Color: Rosa', 'Talla: M · Color: Nude', 'Talla: S · Color: Rosa']) await stockCombo('croissant', c, 0);
  await p.evaluate(() => { carrito = []; });
  await p.goto(U);
  await catalogoListo(p);
  await quizas(hasta(p, () => producto('croissant') && producto('croissant').stock === 0));
  ok('  ...y sí, cuando se acabaron todas', /Agotado/.test(await tarjeta()), (await tarjeta()).slice(0, 80));

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
