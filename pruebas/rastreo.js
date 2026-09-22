/* M5 — el rastreo del pedido.
 * ---------------------------------------------------------------------------
 * El comprador ve en qué va su pedido con el enlace que viaja en su propio
 * mensaje de WhatsApp. Lo que se prueba, además de que funcione:
 *
 *   · EL ENLACE NO SE ADIVINA. Lleva un secreto de 80 bits; la hoja guarda
 *     solo su huella, así que ni con la hoja abierta se arma el enlace de otro.
 *   · UN INTENTO FALLIDO NO DICE NADA. Número inexistente, secreto malo,
 *     pedido viejo sin enlace, formato raro: la misma respuesta, byte a byte.
 *   · NI UN DATO DEL COMPRADOR. Ni nombre, ni celular, ni dirección, ni
 *     ciudad: estado, fechas y qué pidió.
 *   · EL SECRETO NO VIAJA EN UNA DIRECCIÓN hacia Google: solo por POST.
 *   · APAGADO, NO HAY ENLACE (f_rastreo = No).
 *
 *   node pruebas/rastreo.js      (la segunda parte abre un navegador)
 */
const crypto = require('crypto');
const fs = require('fs');
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const get = (g, q) => j(g.api.doGet({ parameter: q }));
const huella = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);
let seq = 0;
const op = () => 'op-rastreo-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);
const SECRETO = 'Kq7ZpR2mXv9TnB4w';

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  return g;
}
function conSesion(g) {
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  return post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
}
const poner = (g, hoja, fila, col, v) => g.hojas.get(hoja).getRange(fila, col).setValue(v);
const conf = (g, clave, v) => poner(g, 'Configuración', g.filas('Configuración').findIndex(f => String(f[0]) === clave) + 1, 2, v);
function registrar(g, pedido, seg) {
  return get(g, Object.assign({ a: 'registrar', pedido, ciudad: 'Cali', cupon: '', envio: 'zona-norte',
                                items: 'croissant:2,baguette:1', sub: '0' }, seg ? { seg } : {}));
}
const filasDe = (g, n) => g.filas('Pedidos').map((f, i) => ({ f, i: i + 1 })).filter(x => String(x.f[1]) === n);

(async () => {
  // ═══ 1. La puerta ═══
  {
    const g = tienda();
    registrar(g, 'RAS01', SECRETO);
    const fs1 = filasDe(g, 'RAS01');
    ok('EL PEDIDO GUARDA LA HUELLA del secreto, en todas sus líneas, y nunca el secreto',
       fs1.length === 2 && fs1.every(x => x.f[20] === huella(SECRETO)) &&
       JSON.stringify(g.filas('Pedidos')).indexOf(SECRETO) === -1, fs1.map(x => x.f[20]).join(','));
    const r = post(g, { a: 'seguimiento', n: 'RAS01', s: SECRETO });
    ok('CON EL ENLACE BUENO se ve el pedido: estado, pasos y qué pidió',
       r.ok && r.estado.rotulo === 'Recibido' && r.lineas.length === 2 && r.pasos[0].hecho && !r.pasos[1].hecho &&
       r.total > 0, JSON.stringify(r).slice(0, 160));
    const txt = JSON.stringify(r);
    ok('  ...y NI UN DATO del comprador: ni ciudad, ni nombre, ni celular, ni dirección',
       !/Cali|ciudad|celular|direcci|nombreCliente|correo/i.test(txt), txt.slice(0, 120));

    const fallos = [
      post(g, { a: 'seguimiento', n: 'RAS01', s: SECRETO.slice(0, -1) + 'x' }),
      post(g, { a: 'seguimiento', n: 'NOEXISTE', s: SECRETO }),
      post(g, { a: 'seguimiento', n: 'RAS01', s: 'corto' }),
      post(g, { a: 'seguimiento', n: '<script>', s: SECRETO }),
      post(g, { a: 'seguimiento' })
    ];
    registrar(g, 'VIEJO1');
    fallos.push(post(g, { a: 'seguimiento', n: 'VIEJO1', s: SECRETO }));
    ok('UN INTENTO FALLIDO NO DICE NADA: secreto malo, número que no existe, formato raro o pedido sin enlace, la MISMA respuesta',
       fallos.every(x => !x.ok && JSON.stringify(x) === JSON.stringify(fallos[0])), fallos.map(x => JSON.stringify(x).length).join(','));
    ok('  ...y el pedido sin secreto no guardó huella', filasDe(g, 'VIEJO1').every(x => !x.f[20]));
    const porGet = get(g, { a: 'seguimiento', n: 'RAS01', s: SECRETO });
    ok('EL SECRETO NO SIRVE POR GET: solo viaja en el cuerpo de un POST', !porGet.ok && !porGet.estado, JSON.stringify(porGet).slice(0, 80));
  }

  // ═══ 2. Los estados, como los lee el comprador ═══
  {
    const g = tienda();
    registrar(g, 'RAS02', SECRETO);
    const lineas = filasDe(g, 'RAS02');
    const estado = (e, guia) => lineas.forEach(x => { poner(g, 'Pedidos', x.i, 4, e); if (guia !== undefined) poner(g, 'Pedidos', x.i, 16, guia); });
    const ver = () => post(g, { a: 'seguimiento', n: 'RAS02', s: SECRETO });
    lineas.forEach(x => poner(g, 'Pedidos', x.i, 14, new Date()));
    estado('Pagado');
    let r = ver();
    ok('PAGADO: el paso de pago hecho y con su fecha', r.estado.id === 'pagado' && r.pasos[1].hecho && r.pasos[1].fecha && !r.pasos[2].hecho);
    ok('  ...y todavía sin guía', r.guia === '');
    estado('Despachado', 'Servientrega 123456');
    r = ver();
    ok('DESPACHADO: dice la guía', r.estado.rotulo === 'Despachado' && r.guia === 'Servientrega 123456' && r.pasos[2].hecho, r.guia);
    estado('Cancelado');
    r = ver();
    ok('CANCELADO: lo dice, sin pasos que parezcan avanzar', r.estado.id === 'cancelado' && r.pasos.length === 0 && /canceló/.test(r.estado.texto));
    estado('pagadito');
    r = ver();
    ok('UN ESTADO QUE LA HOJA NO ENTIENDE sale como «Recibido», no con la errata del comerciante',
       r.estado.rotulo === 'Recibido' && JSON.stringify(r).indexOf('pagadito') === -1);
  }

  // ═══ 3. Apagado ═══
  {
    const g = tienda();
    conf(g, 'f_rastreo', 'No');
    registrar(g, 'RAS03', SECRETO);
    ok('CON EL RASTREO APAGADO no se guarda huella', filasDe(g, 'RAS03').every(x => !x.f[20]));
    const r = post(g, { a: 'seguimiento', n: 'RAS03', s: SECRETO });
    ok('  ...y la página dice que esta tienda no tiene seguimiento', !r.ok && r.apagado && /no tiene seguimiento/.test(r.error));
  }

  // ═══ 4. El enlace desde el panel ═══
  {
    const g = tienda();
    const k = conSesion(g);
    registrar(g, 'RAS04', SECRETO);
    const sin = post(g, { a: 'enlace_seguimiento', op: op(), pedido: 'RAS04' });
    ok('SIN SESIÓN no se crea ningún enlace', !sin.ok && !sin.url);
    const mismo = op();
    const r1 = post(g, { a: 'enlace_seguimiento', k, op: mismo, pedido: 'RAS04' });
    const r2 = post(g, { a: 'enlace_seguimiento', k, op: mismo, pedido: 'RAS04' });
    const sitio = String(g.filas('Configuración').find(f => f[0] === 'sitio_url')[1]).replace(/\/+$/, '');
    const s1 = ((r1.url || '').match(/[?&]s=([A-Za-z0-9]+)/) || [])[1];
    ok('CON SESIÓN el panel crea un enlace a la página de seguimiento de ESTA tienda',
       r1.ok && r1.url.indexOf('/pedido.html?n=RAS04&s=') !== -1 && r1.url.indexOf(sitio.replace(/^https?:\/\//, '')) !== -1 &&
       s1 && s1.length === 16, r1.url);
    ok('  ...la misma operación dos veces es el mismo enlace', r2.url === r1.url);
    ok('  ...el nuevo funciona', post(g, { a: 'seguimiento', n: 'RAS04', s: s1 }).ok);
    ok('  ...y el que tenía el comprador deja de funcionar: hay una sola huella', !post(g, { a: 'seguimiento', n: 'RAS04', s: SECRETO }).ok);
    const reg = JSON.stringify(g.filas('Registro'));
    ok('  ...y queda en el Registro, sin el secreto', /Creó un enlace de seguimiento/.test(reg) && reg.indexOf(s1) === -1);
    const ped = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'RAS04');
    ok('EL PANEL SABE SI un pedido tiene enlace, y nada más', ped && ped.seguimiento === true && JSON.stringify(ped).indexOf(s1) === -1);
    registrar(g, 'RAS05');
    ok('  ...y cuándo no lo tiene', post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'RAS05').seguimiento === false);
  }

  // ═══ 5. De dónde sale el azar, y el cobro en línea ═══
  {
    const m = fs.readFileSync('./as.js', 'utf8');
    const cuerpo = m.slice(m.indexOf('function aleatorio('), m.indexOf('function aleatorio(') + 600);
    ok('EL MAESTRO SACA SUS NÚMEROS DE getUuid, no de Math.random', /getUuid/.test(cuerpo) && !/Math\.random\(\) \*/.test(cuerpo));
    const pag = fs.readFileSync('./index.html', 'utf8');
    const azar = pag.slice(pag.indexOf('function azar('), pag.indexOf('function azar(') + 400);
    ok('  ...y la página, de crypto.getRandomValues', /getRandomValues/.test(azar) && !/Math\.random/.test(azar));
    ok('EL PEDIDO COBRADO EN LÍNEA hereda la huella de su cobro',
       /s: huellaDeSeguimiento\(p\.seg\)/.test(m) && /seguimiento: \(c && c\.s\) \|\| ''/.test(m));
  }

  await enLaPagina();

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

async function enLaPagina() {
  const { chromium } = require('playwright');
  const { catalogoListo, selloListo, hasta } = require('./esperar.js');
  const U = 'http://localhost:' + (process.env.PUERTO || 8099);
  const hojas = async () => (await fetch(U + '/__hojas')).json();
  await fetch(U + '/__reset');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  // Un producto con HTML en el nombre: en la página de seguimiento se ve como texto.
  const h0 = await hojas();
  const fc = h0['Catálogo'].findIndex(f => f[0] === 'croissant') + 1;
  await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + fc + '&c=2&v=' + encodeURIComponent('<img src=x onerror="window.__xss=1">Croissant'));

  await p.goto(U);
  await catalogoListo(p);
  await p.evaluate(() => { agregar('pan-integral', 1); agregar('croissant', 1); abrirPanel(); });
  await selloListo(p);
  await p.fill('#fNombre', 'María Rodríguez');
  await p.fill('#fTel', '3115558899');
  await p.fill('#fCiudad', 'Bogotá');
  await p.fill('#fDir', 'Calle 100 #15-20');
  await p.check('#consiento');
  await selloListo(p);
  const r = await p.evaluate(() => ({ codigo: codigoActual,
    mensaje: decodeURIComponent((document.querySelector('#btnFinalizar').href.split('text=')[1] || '')) }));
  const enlace = (r.mensaje.match(/Sigue tu pedido: (\S+)/) || [])[1] || '';
  const secreto = (enlace.match(/[?&]s=([A-Za-z0-9]+)/) || [])[1] || '';
  ok('EL MENSAJE DE WHATSAPP lleva el enlace de seguimiento, con el número y un secreto de 16',
     enlace.indexOf('/pedido.html?n=' + r.codigo + '&s=') !== -1 && secreto.length === 16, enlace);
  await p.evaluate(() => alEnviar({ preventDefault(){} }));
  await hasta(p, () => !!document.querySelector('.enlace-seguimiento'));
  const enPantalla = await p.getAttribute('.enlace-seguimiento', 'href');
  ok('  ...y la pantalla de «pedido enviado» también lo ofrece', enPantalla === enlace, enPantalla);
  let fila = null;
  for (let i = 0; i < 40 && !fila; i++) {
    fila = ((await hojas())['Pedidos'] || []).find(f => f[1] === r.codigo && f[20]);
    if (!fila) await new Promise(res => setTimeout(res, 100));
  }
  ok('  ...y la hoja guardó su huella, no el secreto', fila && fila[20] === huella(secreto) &&
     JSON.stringify((await hojas())['Pedidos']).indexOf(secreto) === -1);

  const q = new URL(enlace);
  await p.goto(U + '/pedido.html' + q.search);
  await hasta(p, () => !document.querySelector('#pedido').hidden || !document.querySelector('#sinPedido').hidden);
  const vista = await p.evaluate(() => ({ estado: document.querySelector('#estado').textContent,
    lineas: document.querySelectorAll('#lineas tr').length, texto: document.body.innerText,
    img: document.querySelectorAll('main img').length, xss: !!window.__xss }));
  ok('LA PÁGINA DE SEGUIMIENTO muestra el estado y lo que pidió', vista.estado === 'Recibido' && vista.lineas === 3,
     vista.estado + ' · ' + vista.lineas + ' filas');
  ok('  ...sin un dato del comprador', !/María|3115558899|Calle 100|Bogotá/.test(vista.texto));
  ok('  ...y el nombre con HTML de la hoja se ve como texto', vista.img === 0 && !vista.xss && /onerror/.test(vista.texto));
  ok('  ...no se indexa', /noindex/.test(await p.getAttribute('meta[name="robots"]', 'content')));
  ok('  ...y en un celular no se desplaza de lado', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  const pet = await (await fetch(U + '/__peticiones')).json();
  ok('  ...y le preguntó al maestro por POST, sin el secreto en ninguna dirección',
     pet.some(x => x.metodo === 'POST' && x.a === 'seguimiento') &&
     !pet.some(x => x.a === 'seguimiento' && x.metodo !== 'POST') &&
     !pet.some(x => x.metodo === 'POST' && JSON.stringify(x.direccion || {}).indexOf(secreto) !== -1));

  await p.goto(U + '/pedido.html?n=' + r.codigo + '&s=' + secreto.slice(0, -1) + (secreto.endsWith('A') ? 'B' : 'A'));
  await hasta(p, () => !document.querySelector('#sinPedido').hidden);
  ok('CON UN SECRETO EQUIVOCADO dice que no lo encuentra, y ofrece escribirle a la tienda',
     /No encontramos/.test(await p.locator('#sinPedido').innerText()) && await p.locator('#escribir').isVisible());
  await p.goto(U + '/pedido.html');
  await hasta(p, () => !document.querySelector('#sinPedido').hidden);
  ok('SIN ENLACE COMPLETO pide abrir el del mensaje', /enlace completo/.test(await p.locator('#motivo').innerText()));

  // El enlace, desde el panel
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', clave);
  await p.click('#botonEntrar');
  await p.waitForSelector('#listaPedidos .fila[data-pedido="' + r.codigo + '"]');
  await p.click('#listaPedidos .fila[data-pedido="' + r.codigo + '"] button[data-accion="ver"]');
  await hasta(p, () => !document.querySelector('#pedido').hidden);
  ok('EN EL PANEL, un pedido con enlace lo dice, y crear otro pide un segundo toque',
     /ya tiene su enlace/.test(await p.locator('#seguimientoTexto').innerText()));
  await p.click('#crearEnlace');
  ok('  ...el primer toque no crea nada', await p.locator('#enlaceCaja').isHidden() &&
     /Sí, crear uno nuevo/.test(await p.locator('#crearEnlace').innerText()));
  await p.click('#crearEnlace');
  await hasta(p, () => !document.querySelector('#enlaceCaja').hidden);
  const nuevo = await p.inputValue('#enlaceUrl');
  ok('  ...el segundo sí, y lo deja listo para copiar', /\/pedido\.html\?n=/.test(nuevo) && nuevo !== enlace, nuevo);

  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
}
