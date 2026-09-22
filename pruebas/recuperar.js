/* 0.11.0 · 2.3 — recuperar la clave del panel sin el operador.
 * ---------------------------------------------------------------------------
 * Un comerciante que pierde la clave y no sabe abrir su hoja recibe un código
 * en el correo de la tienda y, con él, una clave nueva. Lo que se prueba,
 * además de que funcione:
 *
 *   · EL CÓDIGO VA AL CORREO DE LA HOJA, no a uno que se escriba en la página.
 *   · NO SE ADIVINA: 8 cifras, 15 minutos, cinco intentos por código, y cada
 *     intento malo cuenta en el mismo contador que bloquea la entrada.
 *   · NO LLENA EL BUZÓN: tres códigos por hora, como mucho.
 *   · SE USA UNA VEZ, y la clave nueva cierra las sesiones abiertas.
 *   · DEL CÓDIGO Y DE LA CLAVE solo queda la huella.
 *
 * Y en la página: el indicador de carga al entrar, que es donde más se nota
 * la espera (pedido del dueño, 0.11.0).
 *
 *   node pruebas/recuperar.js      (la segunda parte abre un navegador)
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  return { g, clave };
}
const conf = (g, c, v) => g.hojas.get('Configuración').getRange(g.filas('Configuración').findIndex(f => String(f[0]) === c) + 1, 2).setValue(v);
const codigoDe = correo => ((correo && correo.htmlBody || '').match(/>(\d{8})</) || [])[1];

(async () => {
  // ═══ 1. El camino bueno ═══
  {
    const { g, clave } = tienda();
    const k0 = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
    const correoTienda = String(g.filas('Configuración').find(f => f[0] === 'correo_resumen')[1]).split(/[,;\s]+/)[0];
    const r = post(g, { a: 'recuperar_pedir', correo: 'ladron@ejemplo.com' });
    const c = g.correos.slice(-1)[0] || {};
    ok('PEDIR UN CÓDIGO lo manda al correo DE LA HOJA, aunque la página mande otro', r.ok && c.to === correoTienda && c.to !== 'ladron@ejemplo.com', c.to);
    ok('  ...con el usuario del panel y 8 cifras', /dona\.rosa/.test(c.htmlBody) && !!codigoDe(c));
    ok('  ...y la página solo ve el correo tapado', r.correo && r.correo !== correoTienda && /•/.test(r.correo), r.correo);
    const props = JSON.stringify(g.props);
    ok('  ...y del código solo queda la huella', props.indexOf(codigoDe(c)) === -1);

    const r2 = post(g, { a: 'recuperar_confirmar', codigo: codigoDe(c) });
    ok('CON EL CÓDIGO sale una clave nueva, una vez', r2.ok && r2.clave && r2.clave !== clave && r2.usuario === 'dona.rosa');
    ok('  ...que sirve para entrar', post(g, { a: 'entrar', u: 'dona.rosa', c: r2.clave }).ok);
    ok('  ...y la vieja ya no', !post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).ok);
    ok('  ...y la sesión que estaba abierta se cerró', !post(g, { a: 'sesion', k: k0 }).ok);
    ok('  ...y el mismo código no sirve dos veces', !post(g, { a: 'recuperar_confirmar', codigo: codigoDe(c) }).ok);
    const todo = JSON.stringify(g.filas('Registro')) + JSON.stringify(g.filas('Errores') || []) + JSON.stringify(g.props);
    ok('  ...y queda anotado, sin la clave ni el código', /Recuperó la clave/.test(todo) && todo.indexOf(r2.clave) === -1 &&
       todo.indexOf(codigoDe(c)) === -1);
  }

  // ═══ 2. Lo que no se puede ═══
  {
    const { g } = tienda();
    post(g, { a: 'recuperar_pedir' });
    const bueno = codigoDe(g.correos.slice(-1)[0]);
    const malo = bueno === '00000000' ? '11111111' : '00000000';
    const i0 = Number(String(g.props.PANEL_INTENTOS || '0|0').split('|')[0]);
    const r = post(g, { a: 'recuperar_confirmar', codigo: malo });
    ok('UN CÓDIGO MALO no da clave, y cuenta como intento fallido de entrar', !r.ok && !r.clave &&
       Number(String(g.props.PANEL_INTENTOS || '').split('|')[0]) === i0 + 1);
    for (let i = 0; i < 4; i++) post(g, { a: 'recuperar_confirmar', codigo: malo });
    /* El bloqueo general de la entrada también saltaría aquí y taparía lo que se
       mira: se limpia, para que solo el tope POR CÓDIGO pueda parar al bueno. */
    g.props.PANEL_INTENTOS = '0|0';
    ok('  ...y a los cinco intentos el código se quema, aunque después llegue el bueno',
       !post(g, { a: 'recuperar_confirmar', codigo: bueno }).ok);
  }
  {
    const { g } = tienda();
    post(g, { a: 'recuperar_pedir' });
    const bueno = codigoDe(g.correos.slice(-1)[0]);
    const r0 = JSON.parse(g.props.PANEL_RECUPERACION);
    r0.hasta = Date.now() - 1000;
    g.props.PANEL_RECUPERACION = JSON.stringify(r0);
    ok('UN CÓDIGO VENCIDO no sirve', !post(g, { a: 'recuperar_confirmar', codigo: bueno }).ok);
  }
  {
    const { g } = tienda();
    const n0 = g.correos.length;
    const rs = [1, 2, 3, 4].map(() => post(g, { a: 'recuperar_pedir' }));
    ok('TRES CÓDIGOS POR HORA, no más: el cuarto no sale', rs.slice(0, 3).every(x => x.ok) && !rs[3].ok &&
       g.correos.length === n0 + 3, rs[3].error);
    ok('  ...y solo vale el último', (() => {
      const ultimo = codigoDe(g.correos.slice(-1)[0]), primero = codigoDe(g.correos[n0]);
      return primero === ultimo || !post(g, { a: 'recuperar_confirmar', codigo: primero }).ok;
    })());
  }
  {
    const { g } = tienda();
    conf(g, 'correo_resumen', ''); conf(g, 'empresa_correo', '');
    const n0 = g.correos.length;
    const r = post(g, { a: 'recuperar_pedir' });
    ok('SIN CORREO EN LA HOJA no se inventa uno: manda al menú de la hoja', !r.ok && /Clave del panel/.test(r.error) && g.correos.length === n0);
    const porGet = j(g.api.doGet({ parameter: { a: 'recuperar_pedir' } }));
    ok('  ...y las dos puertas son solo por POST', !porGet.ok);
  }

  await enLaPagina();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

async function enLaPagina() {
  const { chromium } = require('playwright');
  const { hasta } = require('./esperar.js');
  const U = 'http://localhost:' + (process.env.PUERTO || 8099);
  await fetch(U + '/__reset');
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);

  // El indicador de carga, con un maestro lento
  await fetch(U + '/__demora?ms=5500');
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', clave);
  await p.click('#botonEntrar');
  const girando = await p.evaluate(() => ({ c: document.querySelector('#botonEntrar').classList.contains('ocupado'),
    t: document.querySelector('#botonEntrar').textContent.trim(), d: document.querySelector('#botonEntrar').disabled }));
  ok('AL ENTRAR, el botón gira, dice «Entrando…» y no se puede pulsar otra vez', girando.c && /Entrando/.test(girando.t) && girando.d,
     JSON.stringify(girando));
  await hasta(p, () => !document.querySelector('#esperaEntrar').hidden);
  ok('  ...y si tarda, explica por qué', /despertando/.test(await p.locator('#esperaEntrar').innerText()));
  await hasta(p, () => !document.querySelector('#panel').hidden);
  await fetch(U + '/__demora?ms=0');
  ok('  ...y al entrar el indicador se va', !(await p.evaluate(() => document.querySelector('#botonEntrar').classList.contains('ocupado'))) &&
     await p.locator('#esperaEntrar').isHidden());

  // Recargar con la sesión guardada: no una pantalla en blanco
  await fetch(U + '/__demora?ms=2500');
  await p.reload();
  ok('AL VOLVER CON LA SESIÓN GUARDADA se ve «Abriendo tu panel…», no una pantalla en blanco',
     await p.locator('#cargandoPanel').isVisible());
  await hasta(p, () => !document.querySelector('#panel').hidden);
  await fetch(U + '/__demora?ms=0');
  ok('  ...y se va al abrirse', await p.locator('#cargandoPanel').isHidden());

  // Recuperar desde la página
  await p.click('#salir');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.click('#abrirRecuperar');
  await p.click('#pedirCodigo');
  await hasta(p, () => !document.querySelector('#cajaCodigo').hidden);
  const correos = await (await fetch(U + '/__correos')).json();
  const codigo = codigoDe(correos.slice(-1)[0]);
  ok('«¿OLVIDASTE TU CLAVE?» manda el código y lo dice, con el correo tapado',
     !!codigo && /Te mandamos el código a .*•/.test(await p.locator('#avisoRecuperar').innerText()));
  await p.fill('#codigo', codigo);
  await p.click('#usarCodigo');
  await hasta(p, () => !document.querySelector('#claveNueva').hidden);
  const nueva = await p.locator('#claveNuevaTexto').innerText();
  ok('  ...y con el código muestra la clave nueva y la deja lista para entrar',
     nueva.length > 10 && (await p.inputValue('#clave')) === nueva && (await p.inputValue('#usuario')) === 'dona.rosa');
  await p.click('#botonEntrar');
  await hasta(p, () => !document.querySelector('#panel').hidden);
  ok('  ...y entra con ella', await p.locator('#panel').isVisible());
  const pet = await (await fetch(U + '/__peticiones')).json();
  ok('  ...sin que el código ni la clave viajen en una dirección',
     !pet.some(q => JSON.stringify(q.metodo === 'POST' ? q.direccion || {} : q).match(new RegExp(codigo + '|' + nueva.replace(/-/g, '\\-')))));
  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
}
