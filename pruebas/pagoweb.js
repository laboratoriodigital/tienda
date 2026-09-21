/* M3.5 — cobrar en línea, en el navegador.
 * ---------------------------------------------------------------------------
 * pagos.js prueba el maestro. Esta prueba que la PÁGINA no deshace nada de eso
 * por su lado:
 *
 *   · EL BOTÓN DICE LO QUE VA A PASAR. Por WhatsApp abre WhatsApp; cobrando en
 *     línea dice «Pagar $…» y no abre ningún chat.
 *   · A BOLD LE LLEGA LO QUE FIRMÓ EL MAESTRO, no lo que calculó la página.
 *   · LA DIRECCIÓN DE VUELTA NO SE CREE. Volver con «bold-tx-status=approved»
 *     no dice «pago confirmado»: lo dice el maestro, cuando Bold lo dice.
 *   · LOS DATOS DEL COMPRADOR NO SE QUEDAN EN EL NAVEGADOR.
 *
 * La librería de Bold se sirve de mentira (no hay red hacia checkout.bold.co):
 * guarda con qué se la llamó y, al «pagar», navega a la dirección de vuelta,
 * que es lo que hace la de verdad.
 *
 *   node pruebas/pagoweb.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, hasta } = require('./esperar.js');

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const hojas = async () => (await fetch(U + '/__hojas')).json();
const conf = async (clave, v) => {
  const f = ((await hojas())['Configuración'] || []).findIndex(x => String(x[0]) === clave) + 1;
  await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + f + '&c=2&v=' + encodeURIComponent(v));
};
const prop = (k, v) => fetch(U + '/__prop?k=' + k + '&v=' + encodeURIComponent(v));
const quizas = pr => pr.catch(() => {});

const BOLD_FALSO = `
  window.BoldCheckout = function (o) { this.o = o; };
  window.BoldCheckout.prototype.open = function () {
    const guardado = JSON.parse(localStorage.getItem('bold-llamadas') || '[]');
    guardado.push(this.o);
    localStorage.setItem('bold-llamadas', JSON.stringify(guardado));
    if (!window.__noVolver) setTimeout(() => {
      location.href = this.o.redirectionUrl + '&bold-order-id=' + this.o.orderId + '&bold-tx-status=approved';
    }, 50);
  };`;

async function llenar(p, conCorreo) {
  await p.fill('#fNombre', 'María Rodríguez');
  await p.fill('#fTel', '3115558899');
  if (conCorreo) await p.fill('#fCorreo', 'maria@example.com');
  await p.fill('#fCiudad', 'Bogotá');
  await p.fill('#fDir', 'Calle 100 #15-20');
  await p.check('#consiento');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('https://checkout.bold.co/**', r => r.fulfill({ contentType: 'application/javascript', body: BOLD_FALSO }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const texto = s => p.locator(s).innerText();
  const boton = () => p.evaluate(() => ({ texto: document.querySelector('#btnTexto').textContent,
    href: document.querySelector('#btnFinalizar').getAttribute('href'),
    listo: document.querySelector('#btnFinalizar').getAttribute('aria-disabled') === 'false' }));

  // ═══ 1. De fábrica, WhatsApp: nada cambia ═══
  await fetch(U + '/__reset');
  await p.goto(U);
  await catalogoListo(p);
  await p.evaluate(() => { agregar('croissant', 2); abrirPanel(); });
  await llenar(p, false);
  let bt = await boton();
  ok('DE FÁBRICA el botón sigue siendo «Enviar pedido por WhatsApp» y abre WhatsApp',
     /WhatsApp/.test(bt.texto) && /^https:\/\/wa\.me\//.test(bt.href) && bt.listo, bt.texto);
  ok('  ...y no pide correo', await p.locator('#fCorreo').count() === 0);

  // ═══ 2. Pasarela ═══
  await fetch(U + '/__reset');
  await conf('sitio_url', U);
  await conf('cobro_modo', 'Pasarela');
  await prop('BOLD_IDENTIDAD_SANDBOX', 'identidad-ui');
  await prop('BOLD_SECRETA_SANDBOX', 'secreta-ui');
  await p.goto(U);
  await catalogoListo(p);
  await hasta(p, () => COBRO === 'pasarela');
  await p.evaluate(() => { localStorage.removeItem('bold-llamadas'); agregar('croissant', 2); abrirPanel(); });
  await llenar(p, false);
  bt = await boton();
  ok('COBRANDO EN LÍNEA, sin correo el botón no está listo y dice qué falta',
     !bt.listo && /tu correo/.test(await texto('#faltanTexto')), await texto('#faltanTexto'));
  await p.fill('#fCorreo', 'maria@example.com');
  bt = await boton();
  ok('  ...con el correo, el botón dice «Pagar con PSE - Pruebas», y NO abre WhatsApp',
     bt.listo && bt.texto === 'Pagar con PSE - Pruebas' && bt.href === '#', JSON.stringify(bt));
  /* Y en producción, sin «Pruebas». Se cambia la marca que manda el maestro
     y se repinta: es lo que hace la página al leer la configuración. */
  const enProduccion = await p.evaluate(() => { const antes = COBRO_PRUEBAS; COBRO_PRUEBAS = false; revisarFormulario();
    const t = document.querySelector('#btnTexto').textContent; COBRO_PRUEBAS = antes; revisarFormulario(); return t; });
  ok('  ...y con dinero real, «Pagar con PSE»', enProduccion === 'Pagar con PSE', enProduccion);
  ok('  ...y avisa que está en pruebas', /modo de pruebas/i.test(await texto('#totales')));

  /* La página se equivoca de total a propósito: lo que le llega a Bold tiene
     que ser lo que firmó el maestro. */
  await p.evaluate(() => { const c = carrito[0]; window.__precioReal = producto(c.id).precio; });
  await p.click('#btnFinalizar');
  await quizas(p.waitForURL(/\?pago=pg/, { timeout: 15000 }));
  await quizas(hasta(p, () => cobroActivo && cobroActivo.estado === 'esperando'));
  const llamadas = await p.evaluate(() => JSON.parse(localStorage.getItem('bold-llamadas') || '[]'));
  const k = llamadas[0] || {};
  ok('PAGAR abre la pasarela UNA vez, con lo que firmó el maestro',
     llamadas.length === 1 && k.amount === '19000' && k.apiKey === 'identidad-ui' &&
     /^[0-9a-f]{64}$/.test(k.integritySignature) && k.currency === 'COP', JSON.stringify(k).slice(0, 160));
  ok('  ...sin la llave secreta en ninguna parte de la página',
     !(await p.content()).includes('secreta-ui') && JSON.stringify(llamadas).indexOf('secreta-ui') === -1);

  /* Volvió con «approved» en la dirección. Bold todavía no confirmó nada. */
  ok('AL VOLVER CON «approved» EN LA DIRECCIÓN, la página NO dice pagado: pregunta',
     /Estamos confirmando tu pago/.test(await texto('#panelCuerpo')) &&
     !/Pago confirmado/.test(await texto('#panelCuerpo')), (await texto('#panelCuerpo')).slice(0, 60));
  ok('  ...y limpia la dirección, para que recargar no repita la vuelta',
     !/pago=|bold-tx-status/.test(p.url()), p.url());
  const guardado = await p.evaluate(() => sessionStorage.getItem('cobro-en-curso') || '');
  ok('  ...y en el navegador no quedó ni el nombre ni el celular ni la dirección del comprador',
     guardado && !/María|3115558899|Calle 100|maria@/.test(guardado), guardado.slice(0, 80));
  const hs = await hojas();
  const pago = (hs['Pagos'] || [])[1] || [];
  ok('  ...y en la hoja, el cobro esperando y sin pedido todavía',
     pago[4] === 'Esperando pago' && !(hs['Pedidos'] || []).some(f => f[1] === pago[1]));

  // Bold aprueba.
  await fetch(U + '/__bold?ref=' + pago[1] + '&estado=APPROVED&total=19000');
  await fetch(U + '/__cobros');
  await quizas(p.click('text=Verificar ahora', { timeout: 5000 }));
  await quizas(hasta(p, () => /Pago confirmado/.test(document.querySelector('#panelCuerpo').textContent)));
  const cuerpo = await texto('#panelCuerpo');
  ok('CUANDO BOLD APRUEBA, la página lo dice con el número del pedido',
     /Pago confirmado/.test(cuerpo) && cuerpo.indexOf(pago[1]) !== -1, cuerpo.slice(0, 80));
  const wa = await p.getAttribute('#panelCuerpo a.btn-whatsapp', 'href').catch(() => '');
  ok('  ...con un WhatsApp OPCIONAL que dice que ya pagó, qué y cuánto',
     /Hola, acabo de pagar en línea el pedido/.test(decodeURIComponent(wa || '')) &&
     /Croissant/.test(decodeURIComponent(wa || '')), decodeURIComponent(wa || '').slice(0, 90));
  ok('  ...y el carrito se vacía: lo pagado no se vuelve a ofrecer',
     await p.evaluate(() => carrito.length === 0) && !(await p.evaluate(() => sessionStorage.getItem('cobro-en-curso'))));
  const ped = ((await hojas())['Pedidos'] || []).filter(f => f[1] === pago[1]);
  ok('  ...y el pedido está en la hoja, Pagado', ped.length === 1 && ped[0][3] === 'Pagado');

  // ═══ 3. Rechazado: el carrito se queda ═══
  /* Un producto que está en la hoja y NO en el catálogo de respaldo del
     archivo: al volver de la pasarela, la página arranca con el respaldo, y
     el carrito no puede perder lo que el respaldo todavía no conoce. */
  await fetch(U + '/__producto?id=pan-nuevo&nombre=Pan%20nuevo&precio=12500&stock=5');
  await p.goto(U);
  await catalogoListo(p);
  await hasta(p, () => !!producto('pan-nuevo'));
  await p.evaluate(() => { localStorage.removeItem('bold-llamadas'); agregar('pan-nuevo', 1); abrirPanel(); });
  await llenar(p, true);
  await p.click('#btnFinalizar');
  await quizas(p.waitForURL(/\?pago=pg/, { timeout: 15000 }));
  await quizas(hasta(p, () => cobroActivo && cobroActivo.pedido && cobroActivo.estado === 'esperando'));
  /* Se espera a que la página haya VUELTO de la pasarela: leer el número
     antes era leer el de la página que se estaba yendo. */
  const ped2 = await p.evaluate(() => cobroActivo && cobroActivo.pedido);
  await fetch(U + '/__bold?ref=' + ped2 + '&estado=REJECTED&total=12500');
  await fetch(U + '/__cobros');
  await quizas(p.click('text=Verificar ahora', { timeout: 5000 }));
  await quizas(hasta(p, () => /no fue aprobado/.test(document.querySelector('#panelCuerpo').textContent)));
  ok('RECHAZADO: lo dice, dice que no se cobró nada, y el carrito sigue ahí',
     /no fue aprobado/.test(await texto('#panelCuerpo')) && /No se cobró nada/.test(await texto('#panelCuerpo')) &&
     await p.evaluate(() => carrito.length === 1), (await texto('#panelCuerpo')).slice(0, 80));
  ok('  ...también un producto que el catálogo de respaldo no conoce',
     await p.evaluate(() => carrito.some(i => i.id === 'pan-nuevo')));
  ok('MIENTRAS SE PAGA, el carrito no se toca aunque la página no reconozca un producto',
     await p.evaluate(() => { const antes = carrito; cobroActivo = { estado: 'esperando' };
       carrito = [{ id: 'no-esta-en-ningun-catalogo', cantidad: 1 }]; sanear();
       const ok = carrito.length === 1; carrito = antes; cobroActivo = null; return ok; }));
  await quizas(p.click('text=Volver al carrito', { timeout: 5000 }));
  bt = await boton();
  ok('  ...y al volver al carrito se puede intentar otra vez', /^Pagar/.test(bt.texto));
  ok('  ...pidiendo otra vez los datos de entrega: no se guardaron en el navegador para volver de la pasarela',
     (await p.evaluate(() => { const e = document.getElementById('fNombre'); return e ? e.value : 'NO HAY CAMPO: ' + document.querySelector('#panelCuerpo').textContent.slice(0, 200); })) === '', await p.evaluate(() => { const e = document.getElementById('fNombre'); return e ? e.value : 'NO HAY CAMPO: ' + document.querySelector('#panelCuerpo').textContent.slice(0, 200); }));

  // ═══ 4. Otro está pagando la última unidad ═══
  const f = ((await hojas())['Catálogo'] || []).findIndex(x => x[0] === 'torta-chocolate') + 1;
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + f + '&c=6&v=1&num=1');
  const otro = await (await fetch(U + '/exec', { method: 'POST', body: JSON.stringify({ a: 'pago_crear', op: 'op-otro-comprador-1',
    items: 'torta-chocolate:1', envio: 'zona-norte', entrega: { nombre: 'Otro Comprador', tel: '3000000000',
    correo: 'otro@example.com', ciudad: 'Cali', direccion: 'Carrera 1 # 1-1' } }) })).json();
  await p.evaluate(() => { carrito = []; cobroActivo = null; agregar('torta-chocolate', 1); refrescar(); });
  /* Tras volver de la pasarela la página se recargó, y los datos de entrega
     no se guardaron en ninguna parte —a propósito—: se escriben otra vez. */
  await llenar(p, true);
  await quizas(p.click('#btnFinalizar', { timeout: 5000 }));
  await quizas(hasta(p, () => /otra persona/.test(document.querySelector('#totales').textContent)));
  ok('SI OTRO ESTÁ PAGANDO LA ÚLTIMA UNIDAD, se dice antes de cobrar y no se abre la pasarela',
     otro.ok && /otra persona/.test(await texto('#totales')) &&
     (await p.evaluate(() => JSON.parse(localStorage.getItem('bold-llamadas') || '[]').length)) === 1,
     (await texto('#totales')).slice(-120));

  // ═══ 5. Los textos legales dicen cómo se cobra ═══
  const terminos = await p.evaluate(() => LEGALES.terminos.cuerpo());
  ok('LOS TÉRMINOS, cobrando en línea, nombran a Bold y no dicen «no cobra»',
     /pasarela de Bold/.test(terminos) && !/no cobra ni procesa pagos/.test(terminos));

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
