/* 0.11.0 · 4.1 «Avísame cuando llegue» y 4.4 columnas del catálogo.
 * ---------------------------------------------------------------------------
 * 4.1 · Lo agotado pierde la venta dos veces. El botón abre WhatsApp con el
 * pedido de aviso —la conversación es del comerciante— y la hoja cuenta,
 * SIN NADIE DENTRO, cuántos esperan cada producto. Cuando vuelve a haber, el
 * panel y el correo del día lo dicen. Lo que se prueba:
 *   · SOLO LO AGOTADO cuenta, y la pestaña Avísame no guarda un dato de nadie.
 *   · CUANDO LLEGA, SE DICE: en el panel y en el correo, que además sale.
 *   · DAR POR AVISADO es del comerciante (con sesión) y queda en el Registro.
 *   · APAGADO (f_avisame = No), no hay botón ni cuenta.
 *
 * 4.4 · catalogo_columnas: 3, 4 o 5 por fila en pantalla ancha; el celular no
 * cambia, y con 4 la paginación va de 24 en 24 para no dejar la última fila
 * con un hueco.
 *
 *   node pruebas/avisame.js      (la segunda parte abre un navegador)
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const get = (g, q) => j(g.api.doGet({ parameter: q }));
let seq = 0;
const op = () => 'op-avisame-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k };
}
const stock = (g, id, n) => g.hojas.get('Catálogo').getRange(g.filas('Catálogo').findIndex(f => f[0] === id) + 1, g.columna('Catálogo', 'Stock')).setValue(n);
const conf = (g, c, v) => g.hojas.get('Configuración').getRange(g.filas('Configuración').findIndex(f => String(f[0]) === c) + 1, 2).setValue(v);

(async () => {
  {
    const { g, k } = tienda();
    stock(g, 'galletas-avena', 0);
    const noAgotado = get(g, { a: 'avisame', id: 'croissant' });
    ok('LO QUE HAY NO SE CUENTA: «avísame» solo vale para lo agotado', !noAgotado.ok && (g.filas('Avísame') || []).length === 1);
    const r1 = get(g, { a: 'avisame', id: 'galletas-avena' });
    const r2 = get(g, { a: 'avisame', id: 'galletas-avena' });
    const fila = g.filas('Avísame')[1];
    ok('LO AGOTADO SE CUENTA: dos personas, una fila', r1.ok && r2.ok && r2.personas === 2 && g.filas('Avísame').length === 2 && fila[2] === 2);
    ok('  ...y la pestaña no guarda un dato de nadie: producto, cuántos y cuándo',
       g.filas('Avísame')[0].join('|') === 'ID|Producto|Personas esperando|Desde|Último pedido de aviso');
    let t = post(g, { a: 'tablero', k });
    ok('EL TABLERO lo dice: 2 esperan, todavía agotado', t.avisame.length === 1 && t.avisame[0].personas === 2 && !t.avisame[0].hayStock);
    stock(g, 'galletas-avena', 12);
    t = post(g, { a: 'tablero', k });
    ok('  ...y cuando vuelve a haber, lo marca', t.avisame[0].hayStock === true);

    const n0 = g.correos.length;
    g.api.enviarResumen(false);
    const correo = g.correos.slice(n0)[0] || {};
    ok('EL CORREO DEL DÍA sale y lo dice: quién llegó y cuántos esperan', !!correo.htmlBody && /Te están esperando/.test(correo.htmlBody) &&
       /Galletas de avena/.test(correo.htmlBody) && /2 personas pidieron/.test(correo.htmlBody), (correo.htmlBody || '').slice(0, 0));

    const sin = post(g, { a: 'avisame_hecho', op: op(), id: 'galletas-avena' });
    ok('DAR POR AVISADO sin sesión no se puede', !sin.ok && g.filas('Avísame').length === 2);
    const h = post(g, { a: 'avisame_hecho', k, op: op(), id: 'galletas-avena' });
    ok('  ...con sesión, se borra la cuenta', h.ok && g.filas('Avísame').length === 1);
    ok('  ...y queda en el Registro', /Avisó que llegó el producto/.test(JSON.stringify(g.filas('Registro'))));
  }
  {
    const { g } = tienda();
    conf(g, 'f_avisame', 'No');
    stock(g, 'galletas-avena', 0);
    ok('APAGADO (f_avisame = No) no se cuenta', !get(g, { a: 'avisame', id: 'galletas-avena' }).ok && g.filas('Avísame').length === 1);
  }

  await enLaPagina();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

async function enLaPagina() {
  const { chromium } = require('playwright');
  const { catalogoListo, hasta } = require('./esperar.js');
  const U = 'http://localhost:' + (process.env.PUERTO || 8099);
  const hojas = async () => (await fetch(U + '/__hojas')).json();
  const celda = async (hoja, id, col, v) => {
    const f = ((await hojas())[hoja] || []).findIndex(x => String(x[0]) === id) + 1;
    await fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + col + '&v=' + encodeURIComponent(v) + '&num=1');
  };
  const confP = async (c, v) => {
    const f = ((await hojas())['Configuración'] || []).findIndex(x => String(x[0]) === c) + 1;
    await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + f + '&c=2&v=' + encodeURIComponent(v));
  };
  await fetch(U + '/__reset');
  await celda('Catálogo', 'galletas-avena', 6, '0');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__abiertos = []; window.open = (u) => { window.__abiertos.push(u); return null; }; });
  await p.goto(U);
  await catalogoListo(p);
  await hasta(p, () => { const x = producto('galletas-avena'); return x && x.stock === 0; }).catch(() => {});
  const tarjetas = await p.evaluate(() => [...document.querySelectorAll('#rejilla .tarjeta')].map(t => ({
    n: t.querySelector('h3').textContent, b: !!t.querySelector('.avisame') })));
  ok('EN LA TIENDA, lo agotado ofrece «Avísame cuando llegue», y lo que hay no',
     tarjetas.find(x => /Galletas/.test(x.n)).b && tarjetas.filter(x => !/Galletas/.test(x.n)).every(x => !x.b), JSON.stringify(tarjetas.filter(x => x.b)));
  const t = p.locator('#rejilla .tarjeta').filter({ hasText: 'Galletas de avena' });
  await t.locator('.avisame').click();
  await t.locator('.avisame').click();
  const abiertos = await p.evaluate(() => window.__abiertos);
  ok('  ...que abre WhatsApp con el pedido de aviso', abiertos.length === 2 && /wa\.me\//.test(abiertos[0]) &&
     /av%C3%ADsame.*Galletas%20de%20avena/i.test(abiertos[0]), abiertos[0]);
  await hasta(p, () => true);
  let fila = null;
  for (let i = 0; i < 30 && !fila; i++) { fila = ((await hojas())['Avísame'] || []).find(f => f[0] === 'galletas-avena'); if (!fila) await new Promise(r => setTimeout(r, 100)); }
  ok('  ...y cuenta UNA vez por visita, aunque se pulse dos', fila && fila[2] === 1, JSON.stringify(fila));
  await p.evaluate(() => abrirFicha('galletas-avena'));
  ok('  ...también en la ficha', await p.locator('.ficha-texto .avisame').isVisible());

  // En el panel
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  await celda('Catálogo', 'galletas-avena', 6, '9');
  const pa = await b.newPage({ viewport: { width: 390, height: 844 } });
  await pa.goto(U + '/admin.html');
  await hasta(pa, () => !document.querySelector('#entrar').hidden);
  await pa.fill('#usuario', 'dona.rosa'); await pa.fill('#clave', clave);
  await pa.click('#botonEntrar');
  await hasta(pa, () => !!document.querySelector('#bloque-avisame'));
  ok('EN EL PANEL, Ventas dice quién espera lo que ya llegó', /Galletas de avena.*1 persona espera.*ya hay existencias/s.test(await pa.locator('#bloque-avisame').innerText()));
  await pa.click('#bloque-avisame button[data-avisado="galletas-avena"]');
  await hasta(pa, () => !document.querySelector('#bloque-avisame'));
  ok('  ...y «Ya les avisé» lo borra de la hoja', !((await hojas())['Avísame'] || []).some(f => f[0] === 'galletas-avena'));
  await pa.close();

  // 4.4 · las columnas
  const columnas = async (ancho) => {
    await p.setViewportSize({ width: ancho, height: 900 });
    return p.evaluate(() => getComputedStyle(document.querySelector('#rejilla')).gridTemplateColumns.split(' ').length);
  };
  await p.evaluate(() => cerrarTodo());
  ok('DE FÁBRICA, 3 por fila en computador', (await columnas(1280)) === 3);
  await confP('catalogo_columnas', '4');
  await p.goto(U); await catalogoListo(p);
  await hasta(p, () => document.documentElement.dataset.columnas === '4').catch(() => {});
  ok('CON catalogo_columnas = 4, cuatro por fila en computador', (await columnas(1280)) === 4);
  ok('  ...y la paginación de 24 en 24, para que la última fila no quede con hueco',
     await p.evaluate(() => OPCIONES_PAGINA.join(',') === '24,48,96' && porPagina === 24));
  ok('  ...y en el celular no cambia nada', (await columnas(390)) === 1);
  await confP('catalogo_columnas', '5');
  await p.goto(U); await catalogoListo(p);
  await hasta(p, () => document.documentElement.dataset.columnas === '5').catch(() => {});
  ok('CON 5, cinco en una pantalla grande y cuatro en una mediana', (await columnas(1440)) === 5 && (await columnas(1100)) === 4);
  await confP('catalogo_columnas', 'siete');
  await p.goto(U); await catalogoListo(p);
  await hasta(p, () => document.documentElement.dataset.columnas === '3').catch(() => {});
  ok('UN VALOR QUE NO SE ENTIENDE vuelve a 3, no rompe la rejilla', (await columnas(1280)) === 3);

  await confP('f_avisame', 'No');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(U); await catalogoListo(p);
  await celda('Catálogo', 'galletas-avena', 6, '0');
  await p.goto(U); await catalogoListo(p);
  await hasta(p, () => { const x = producto('galletas-avena'); return x && x.stock === 0 && AVISAME === false; }).catch(() => {});
  ok('CON f_avisame = No, no hay botón', (await p.locator('.avisame').count()) === 0);
  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
}
