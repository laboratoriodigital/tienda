/* C-3 — lo que el comprador necesita saber ANTES de pedir.
 * ---------------------------------------------------------------------------
 * Cuatro cosas que la hoja ya sabía y la página no decía:
 *
 *   · CUÁNTO LE FALTA PARA EL ENVÍO GRATIS. El umbral existía y solo se
 *     enteraba quien lo pasaba sin querer.
 *   · CUÁNDO LE RESPONDEN. `horario` se sembraba, se documentaba… y no se
 *     pintaba en ninguna parte.
 *   · QUE LA TIENDA ESTÁ CERRADA, antes de armar un carrito que no va a poder
 *     enviar. Se puede mirar; no se puede pedir.
 *   · EL PEDIDO MÍNIMO, dicho en pesos que faltan, y no como un botón muerto.
 *
 * Y la regla de la casa: el que COBRA es el maestro. Cerrada o por debajo del
 * mínimo, pago_crear no cobra aunque la página se equivoque; el registro de un
 * pedido que ya salió por WhatsApp falla abierto y se guarda igual.
 *
 *   node pruebas/comprador.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, hasta } = require('./esperar.js');

const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const hojas = async () => (await fetch(U + '/__hojas')).json();
const conf = async (clave, v) => {
  const f = ((await hojas())['Configuración'] || []).findIndex(x => String(x[0]) === clave) + 1;
  if (f < 1) throw new Error('No existe la clave ' + clave);
  await fetch(U + '/__celda?hoja=Configuraci%C3%B3n&f=' + f + '&c=2&v=' + encodeURIComponent(v));
};
const quizas = pr => pr.catch(() => {});

async function llenar(p) {
  await p.fill('#fNombre', 'María Rodríguez');
  await p.fill('#fTel', '3115558899');
  await p.fill('#fCiudad', 'Bogotá');
  await p.fill('#fDir', 'Calle 100 #15-20');
  await p.check('#consiento');
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const texto = s => p.locator(s).innerText();
  const listo = () => p.evaluate(() => document.querySelector('#btnFinalizar').getAttribute('aria-disabled') === 'false');
  const abrir = async (items) => {
    await p.goto(U);
    await catalogoListo(p);
    await p.evaluate(items => { items.forEach(([id, n]) => agregar(id, n)); abrirPanel(); }, items);
  };

  // ═══ 0. De fábrica no cambia nada ═══
  await fetch(U + '/__reset');
  await abrir([['croissant', 1]]);
  await llenar(p);
  ok('DE FÁBRICA: ni aviso de cerrada, ni horario, ni mínimo, ni «te faltan»',
     (await p.locator('#avisoCerrada').isHidden()) && (await p.locator('#pieHorario').isHidden()) &&
     !/te faltan|mínimo|Te respondemos/i.test(await texto('#panelPie')) && await listo());

  // ═══ 1. Envío gratis anunciado ═══
  await fetch(U + '/__reset');
  await conf('envio_gratis_desde', '$50.000');
  await abrir([['croissant', 1]]);
  await quizas(hasta(p, () => /envío gratis/.test(document.querySelector('#totales').textContent)));
  ok('ENVÍO GRATIS: dice cuánto falta, en pesos', /Te faltan \$43\.500 para el envío gratis/.test(await texto('#totales')),
     (await texto('#totales')).replace(/\s+/g, ' ').slice(0, 160));
  await p.evaluate(() => { agregar('croissant', 7); refrescar(); });
  await quizas(hasta(p, () => !/Te faltan/.test(document.querySelector('#totales').textContent)));
  const t = await texto('#totales');
  ok('  ...y al pasarlo, deja de decirlo y el envío sale sin costo',
     !/Te faltan/.test(t) && /Envío[^\n]*\n?\s*Sin costo/.test(t), t.replace(/\s+/g, ' ').slice(0, 160));
  /* Con la hoja diciendo lo mismo: el sello del maestro también lo regala. */
  const v = await (await fetch(U + '/exec?a=validar&items=croissant:8&envio=zona-norte')).json();
  ok('  ...con la misma regla que el maestro (el sello también lo da sin costo)', v.envio === 0 && v.total === 52000,
     v.envio + ' / ' + v.total);

  // ═══ 2. Horario ═══
  await fetch(U + '/__reset');
  await conf('horario', 'Lunes a sábado, 8am a 6pm');
  await abrir([['croissant', 1]]);
  await quizas(hasta(p, () => !document.querySelector('#pieHorario').hidden));
  ok('HORARIO: sale al pie de la tienda', (await p.locator('#pieHorario').isVisible()) &&
     /Atendemos: Lunes a sábado, 8am a 6pm/.test(await texto('#pieHorario')));
  ok('  ...y en el carrito, donde se decide pedir', /Te respondemos: Lunes a sábado/.test(await texto('#totales')));

  // ═══ 3. Pedido mínimo ═══
  await fetch(U + '/__reset');
  await conf('pedido_minimo', '20000');
  await abrir([['croissant', 1]]);
  await llenar(p);
  await quizas(hasta(p, () => !document.querySelector('#faltan').hidden));
  ok('PEDIDO MÍNIMO: el botón no se puede usar y dice cuánto falta',
     !(await listo()) && /El pedido mínimo es \$20\.000: te faltan \$13\.500/.test(await texto('#faltanTexto')),
     await texto('#faltanTexto'));
  await p.evaluate(() => { agregar('croissant', 3); refrescar(); });
  await quizas(hasta(p, () => document.querySelector('#btnFinalizar').getAttribute('aria-disabled') === 'false'));
  ok('  ...y al llegar, se puede enviar', await listo());

  // ═══ 4. Tienda cerrada ═══
  await fetch(U + '/__reset');
  await conf('tienda_abierta', 'No');
  await conf('tienda_cerrada_mensaje', 'Volvemos el lunes 6 de octubre.');
  await abrir([['croissant', 1]]);
  await llenar(p);
  await quizas(hasta(p, () => !document.querySelector('#avisoCerrada').hidden));
  ok('CERRADA: el aviso está arriba de todo, con las palabras del comercio',
     (await texto('#avisoCerrada')) === 'Volvemos el lunes 6 de octubre.');
  ok('  ...se puede mirar el catálogo', await p.locator('.tarjeta, .producto, [data-id]').count() > 0);
  ok('  ...pero el pedido no sale, y dice por qué',
     !(await listo()) && /Volvemos el lunes/.test(await texto('#faltanTexto')));

  // Del lado del maestro: cobrar no, registrar sí.
  await conf('sitio_url', U);
  await conf('cobro_modo', 'Pasarela');
  await fetch(U + '/__prop?k=BOLD_IDENTIDAD_SANDBOX&v=a'); await fetch(U + '/__prop?k=BOLD_SECRETA_SANDBOX&v=b');
  const cobro = await (await fetch(U + '/exec', { method: 'POST', body: JSON.stringify({ a: 'pago_crear',
    op: 'op-cerrada-1', items: 'croissant:1', envio: 'zona-norte', entrega: { nombre: 'Ana Pérez',
    tel: '3001234567', correo: 'a@b.co', ciudad: 'Cali', direccion: 'Calle 1 # 1-1' } }) })).json();
  ok('  ...y el maestro NO COBRA con la tienda cerrada, aunque la página se equivoque',
     !cobro.ok && cobro.cerrada && /Volvemos/.test(cobro.error), cobro.error);
  await fetch(U + '/exec?a=registrar&pedido=CERR1&ciudad=Cali&envio=zona-norte&items=croissant:1&sub=6500');
  ok('  ...pero un pedido que ya salió por WhatsApp desde una página vieja se registra igual',
     ((await hojas())['Pedidos'] || []).some(f => f[1] === 'CERR1'));

  // ═══ 5. El mínimo, del lado del maestro ═══
  await conf('tienda_abierta', 'Sí');
  await conf('pedido_minimo', '20000');
  const bajo = await (await fetch(U + '/exec', { method: 'POST', body: JSON.stringify({ a: 'pago_crear',
    op: 'op-minimo-1', items: 'croissant:1', envio: 'zona-norte', entrega: { nombre: 'Ana Pérez',
    tel: '3001234567', correo: 'a@b.co', ciudad: 'Cali', direccion: 'Calle 1 # 1-1' } }) })).json();
  ok('EL MAESTRO NO COBRA por debajo del mínimo', !bajo.ok && /mínimo es \$20\.000/.test(bajo.error), bajo.error);
  await conf('pedido_minimo', 'veinte mil');
  const ilegible = await (await fetch(U + '/exec?a=validar&items=croissant:1&envio=zona-norte')).json();
  ok('UN MÍNIMO ILEGIBLE no es «sin mínimo»: queda anotado y ese total no se cobra tal cual',
     ilegible.cobrable === false && ilegible.ilegibles.some(x => /pedido_minimo/.test(x)),
     JSON.stringify(ilegible.ilegibles));

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
