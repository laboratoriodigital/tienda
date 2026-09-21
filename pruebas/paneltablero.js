/* M4 — el tablero, en el panel.
 * ---------------------------------------------------------------------------
 * tablero.js prueba las CUENTAS y la pestaña de la hoja. Esta prueba lo que el
 * comerciante ve en su panel, y las cuatro promesas de M4:
 *
 *   · LOS MISMOS NÚMEROS QUE LA HOJA. La página y la pestaña Tablero leen la
 *     misma función; si un día no cuadran, alguien copió la cuenta (patrón 2).
 *   · UNA PETICIÓN POR VISITA. Se cuentan en el servidor: abrir la pestaña es
 *     una; ir y volver no es otra; solo Actualizar pide de nuevo.
 *   · CADA GRÁFICA CON SU TABLA, y la tabla dice lo mismo que la gráfica.
 *   · LO QUE VIENE DE LA HOJA SE PINTA COMO TEXTO, también dentro del SVG.
 *
 * Y lo de siempre: la puerta no contesta sin sesión, no hay error de JavaScript
 * y en un celular no hay que desplazarse de lado.
 *
 *   node pruebas/paneltablero.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { hasta } = require('./esperar.js');

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const hojas = async () => (await fetch(U + '/__hojas')).json();
const celda = (hoja, f, c, v, num) => fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + c +
                                             '&v=' + encodeURIComponent(v) + (num ? '&num=1' : ''));
const post = async o => (await fetch(U + '/exec', { method: 'POST', body: JSON.stringify(o) })).json();
const pesos = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
const MALO = '<img src=x onerror="window.__xss=1">Croissant';

async function pedido(n, items, ciudad) {
  await fetch(U + '/exec?a=registrar&pedido=' + n + '&ciudad=' + encodeURIComponent(ciudad) +
              '&cupon=&envio=zona-norte&items=' + encodeURIComponent(items) + '&sub=0');
}
async function vender(n) {
  const filas = (await hojas())['Pedidos'] || [];
  for (let i = 0; i < filas.length; i++) if (String(filas[i][1]) === n) await celda('Pedidos', i + 1, 4, 'Pagado');
}
const cuantasTablero = async () => ((await (await fetch(U + '/__peticiones')).json())
  .filter(q => q.metodo === 'POST' && q.a === 'tablero')).length;

(async () => {
  await fetch(U + '/__reset');
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();

  // ═══ 1. La puerta ═══
  const sin = await post({ a: 'tablero' });
  ok('SIN SESIÓN la puerta del tablero no dice nada', !sin.ok && !('esteMes' in sin), JSON.stringify(sin).slice(0, 80));
  const k = (await post({ a: 'entrar', u: 'dona.rosa', c: clave })).testigo;

  // Una tienda con movimiento: tres pedidos, dos vendidos, en dos ciudades.
  const fc = ((await hojas())['Catálogo'] || []).findIndex(f => f[0] === 'croissant') + 1;
  await celda('Catálogo', fc, 2, MALO);
  await pedido('TAB01', 'croissant:3,baguette:1', 'Cali');
  await pedido('TAB02', 'croissant:2', 'Bogotá');
  await pedido('TAB03', 'baguette:1', 'Cali');
  await vender('TAB01'); await vender('TAB02');

  const d = await post({ a: 'tablero', k });
  ok('CON SESIÓN contesta el tablero', d.ok && d.esteMes && d.meses && d.meses.length === 6, (d.error || '') + ' ' + Object.keys(d).join(','));
  ok('  ...y cuenta lo vendido: dos pedidos de tres', d.esteMes.pedidos === 2 && d.esteMes.hechos === 3,
     JSON.stringify(d.esteMes));
  ok('  ...y el producto más vendido es el croissant, con sus 5 unidades',
     d.masVendidos[0] && d.masVendidos[0].nombre === MALO && d.masVendidos[0].unidades === 5, JSON.stringify(d.masVendidos[0]));
  const texto = JSON.stringify(d);
  ok('  ...y no lleva un solo dato de un comprador: ni nombre, ni celular, ni dirección',
     !/celular|direcci|telefono|nombreCliente|correo/i.test(Object.keys(d).join(' ')) && !/TAB0/.test(texto),
     'ni siquiera el número de pedido');

  /* LOS MISMOS NÚMEROS QUE LA HOJA. Se recalcula la pestaña y se compara cifra
     por cifra con lo que contestó la puerta. */
  await fetch(U + '/__llamar?f=recalcularTablero');
  const tab = (await hojas())['Tablero'] || [];
  const de = rot => { const f = tab.find(x => String(x[0]).trim() === rot); return f ? Number(f[1]) : NaN; };
  ok('LA PÁGINA Y LA HOJA DICEN LO MISMO: ventas, pedidos y ticket de este mes',
     de('Ventas confirmadas') === d.esteMes.ventas && de('Pedidos confirmados') === d.esteMes.pedidos &&
     de('Ticket promedio') === d.esteMes.ticket,
     'hoja ' + de('Ventas confirmadas') + '/' + de('Pedidos confirmados') + '/' + de('Ticket promedio') +
     ' · puerta ' + d.esteMes.ventas + '/' + d.esteMes.pedidos + '/' + d.esteMes.ticket);
  ok('  ...y el embudo', de('Carritos armados en la tienda') === d.esteMes.carritos &&
     de('Pedidos enviados a WhatsApp') === d.esteMes.hechos);

  // ═══ 2. La página ═══
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', clave);
  await p.click('#botonEntrar');
  await hasta(p, () => !document.querySelector('#panel').hidden && document.querySelectorAll('#lista .fila').length > 0);
  /* Las dos de arriba, las de la puerta, también están contadas: lo que se
     mira es cuántas pide la PÁGINA desde aquí. */
  const antes = await cuantasTablero();
  const pidio = async () => (await cuantasTablero()) - antes;
  ok('ABRIR EL PANEL no pide el tablero: se pide al abrir su pestaña', (await pidio()) === 0, (await pidio()) + ' peticiones');

  await p.click('#tab-tablero');
  await hasta(p, () => document.querySelectorAll('#tablero svg').length > 0);
  ok('AL ABRIR LA PESTAÑA se dibujan las gráficas', (await p.locator('#tablero svg').count()) >= 4,
     (await p.locator('#tablero svg').count()) + ' gráficas');
  ok('  ...con UNA petición', (await pidio()) === 1);

  const primera = await p.locator('#tablero .cifra .valor').first().innerText();
  ok('LA CIFRA DE VENTAS de la página es la de la hoja', primera === pesos(de('Ventas confirmadas')),
     primera + ' / ' + pesos(de('Ventas confirmadas')));

  const meses = await p.evaluate(() => ({
    barras: document.querySelectorAll('#grafica-meses svg rect').length,
    filas: [...document.querySelectorAll('#grafica-meses tbody tr')].map(tr => tr.textContent)
  }));
  ok('VENTAS MES A MES: seis barras y, debajo, su tabla con seis meses',
     meses.barras === 6 && meses.filas.length === 6, meses.barras + ' barras, ' + meses.filas.length + ' filas');
  ok('  ...y la tabla dice la cifra del mes en curso', meses.filas[5].indexOf(pesos(d.meses[5].ventas)) !== -1,
     meses.filas[5]);
  const embudo = await p.$$eval('#grafica-embudo tbody tr', t => t.map(x => x.textContent));
  ok('EL EMBUDO: tres pasos, con la tabla debajo', embudo.length === 3 && /Hicieron el pedido3/.test(embudo[1]), embudo.join(' | '));
  const vendidos = await p.$$eval('#grafica-vendidos tbody tr td:first-child', t => t.map(x => x.textContent));
  ok('LO MÁS VENDIDO lleva su tabla, con el nombre tal como está en la hoja', vendidos[0] === MALO, vendidos[0]);
  const xss = await p.evaluate(() => ({ img: document.querySelectorAll('#tablero img').length, marca: !!window.__xss,
                                          enSvg: [...document.querySelectorAll('#grafica-vendidos svg text')].some(t => /onerror/.test(t.textContent)) }));
  ok('  ...Y SE PINTA COMO TEXTO, también dentro del SVG: ni una etiqueta ejecutada',
     xss.img === 0 && !xss.marca && xss.enSvg, JSON.stringify(xss));
  ok('CADA GRÁFICA DICE en palabras lo que dibuja, para quien no la ve',
     await p.$$eval('#tablero svg', s => s.every(x => x.getAttribute('role') === 'img' && (x.getAttribute('aria-label') || '').length > 10)));
  const ancho = await p.evaluate(() => {
    const W = window.innerWidth;
    return { total: document.documentElement.scrollWidth, W,
             anchos: [...document.querySelectorAll('#panel *')].filter(e => e.getBoundingClientRect().right > W + 1)
                       .slice(0, 4).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' ' + Math.round(e.getBoundingClientRect().right)) };
  });
  ok('EN UN CELULAR no hay que desplazarse de lado', ancho.total <= ancho.W, JSON.stringify(ancho));

  await p.click('#tab-productos');
  await p.click('#tab-tablero');
  ok('IR Y VOLVER no pide otra vez: una petición por visita', (await pidio()) === 1,
     (await pidio()) + ' peticiones');
  await pedido('TAB04', 'baguette:2', 'Medellín'); await vender('TAB04');
  await p.click('#actualizarTablero');
  await p.waitForFunction(v => document.querySelector('#tablero .cifra .valor').innerText !== v, primera);
  ok('ACTUALIZAR sí pide, y trae lo nuevo', (await pidio()) === 2 &&
     (await p.locator('#tablero .cifra .valor').first().innerText()) !== primera);
  ok('  ...y dice cuándo se leyó y que no se actualiza solo',
     /leídos .*No se actualizan solos/.test(await p.locator('#consultadoTablero').innerText()));

  // ═══ 3. Una tienda recién abierta ═══
  await fetch(U + '/__reset');
  const { clave: c2 } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  await p.evaluate(() => sessionStorage.clear());
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', c2);
  await p.click('#botonEntrar');
  await hasta(p, () => !document.querySelector('#panel').hidden);
  await p.click('#tab-tablero');
  await hasta(p, () => document.querySelectorAll('#tablero .cifra').length > 0);
  const vacio = await p.locator('#tablero').innerText();
  ok('SIN VENTAS, el tablero lo dice en vez de dibujar barras vacías',
     /Todavía no hay ventas confirmadas/.test(vacio) && (await p.locator('#grafica-meses svg').count()) === 0);

  /* Salir borra lo leído: el siguiente que se siente al computador del
     mostrador no ve las ventas del anterior. */
  await p.click('#salir');
  ok('AL SALIR se borra el tablero de la página', (await p.locator('#tablero').innerHTML()) === '');

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
