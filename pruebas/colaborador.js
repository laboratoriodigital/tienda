/* 0.13.0 · 2.2 — más de una persona en el panel: el colaborador.
 * ---------------------------------------------------------------------------
 * El dueño le da una clave a otra persona desde su panel. Esa persona lleva la
 * tienda entera —productos, pedidos, fotos, envíos, cupones, publicar— y en
 * los ajustes solo ve lo de la vitrina y si se cobra por WhatsApp o pasarela.
 * Lo que se prueba:
 *
 *   · LO DA SOLO EL DUEÑO, con su clave otra vez; el colaborador no puede
 *     darse otro ni quitarse a sí mismo.
 *   · LO QUE NO PUEDE, NO LE LLEGA: el maestro filtra los ajustes y rechaza al
 *     guardar las claves que no son suyas, aunque la página las mande.
 *   · SUS SESIONES SON SUYAS: quitarle el acceso o darle clave nueva las
 *     cierra; las del dueño siguen. Y su testigo no se hace pasar por el del
 *     dueño.
 *   · LO QUE HACE QUEDA A SU NOMBRE en el Registro.
 *   · DE LA CLAVE solo queda la huella, y no pasa por la caché de operaciones.
 *
 *   node pruebas/colaborador.js      (la segunda parte abre un navegador)
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-colab-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, clave, k };
}
const valor = (g, c) => (g.filas('Configuración').find(f => String(f[0]) === c) || [])[1];

(async () => {
  {
    const { g, clave, k } = tienda();
    const sinClave = post(g, { a: 'colaborador', k, op: op(), accion: 'crear', usuario: 'ana' });
    ok('DAR UN COLABORADOR pide la clave del dueño otra vez', !sinClave.ok && sinClave.necesitaClave && !g.props.PANEL_COLABORADOR);
    const mismo = post(g, { a: 'colaborador', k, op: op(), accion: 'crear', usuario: 'Dona.Rosa', c: clave });
    ok('  ...y no puede llamarse como el dueño', !mismo.ok && !g.props.PANEL_COLABORADOR, mismo.error);
    const raro = post(g, { a: 'colaborador', k, op: op(), accion: 'crear', usuario: 'a b', c: clave });
    ok('  ...ni llevar espacios', !raro.ok);
    const opCrear = op();
    const r = post(g, { a: 'colaborador', k, op: opCrear, accion: 'crear', usuario: 'ana', c: clave });
    ok('CON LA CLAVE, sale una clave para el colaborador', r.ok && r.usuario === 'ana' && /^\w{4}-\w{4}-\w{4}-\w{4}$/.test(r.clave || ''), JSON.stringify(r).slice(0, 80));
    const todo = JSON.stringify(g.props) + JSON.stringify(g.cache || {}) + JSON.stringify(g.filas('Registro')) + JSON.stringify(g.filas('Errores') || []);
    ok('  ...de la que solo queda la huella: ni en propiedades, ni en la caché, ni en la hoja', todo.indexOf(r.clave) === -1);
    const rep = post(g, { a: 'colaborador', k, op: opCrear, accion: 'crear', usuario: 'ana', c: clave });
    ok('  ...y un reintento de la misma operación no la vuelve a enseñar', rep.ok && rep.repetida && !rep.clave);

    const e = post(g, { a: 'entrar', u: 'ANA', c: r.clave });
    ok('EL COLABORADOR ENTRA con su usuario y su clave, y la sesión lo dice', e.ok && e.rol === 'colaborador' && e.usuario === 'ana');
    const kc = e.testigo;
    ok('  ...y la sesión sigue diciéndolo', post(g, { a: 'sesion', k: kc }).rol === 'colaborador' && post(g, { a: 'sesion', k }).rol === 'dueño');
    ok('  ...con la clave del dueño no entra como «ana», ni con la suya como el dueño',
       !post(g, { a: 'entrar', u: 'ana', c: clave }).ok && !post(g, { a: 'entrar', u: 'dona.rosa', c: r.clave }).ok);

    // Lo que ve
    const cd = post(g, { a: 'configuracion', k });
    const cc = post(g, { a: 'configuracion', k: kc });
    const claves = x => x.claves.map(c => c.clave);
    ok('EN AJUSTES ve la vitrina y el cobro, no lo demás', cc.ok && claves(cc).includes('portada_titulo') && claves(cc).includes('color_principal') &&
       claves(cc).includes('cobro_modo') && !claves(cc).some(c => /^(whatsapp|cobro_ambiente|pago_|empresa_|correo_|repositorio|sitio_url|fotos_drive|negocio)/.test(c)),
       claves(cc).join(','));
    ok('  ...el dueño lo ve todo, y además a su colaborador', claves(cd).length > claves(cc).length && cd.colaborador.usuario === 'ana' &&
       cd.colaborador.activo === true && cd.rol === 'dueño');
    ok('  ...y al colaborador no se le cuenta quién más entra', cc.colaborador === null && cc.rol === 'colaborador');

    // Lo que guarda
    const v = c => cc.claves.find(x => x.clave === c).version;
    const bien = post(g, { a: 'guardar_configuracion', k: kc, op: op(), cambios: { portada_titulo: 'Pan de la casa' }, versiones: { portada_titulo: v('portada_titulo') } });
    ok('GUARDA LO SUYO', bien.ok && valor(g, 'portada_titulo') === 'Pan de la casa');
    const wa0 = valor(g, 'whatsapp'), amb0 = valor(g, 'cobro_ambiente'), nit0 = valor(g, 'empresa_nit');
    const vd = c => cd.claves.find(x => x.clave === c).version;
    const intentos = () => String(g.props.PANEL_INTENTOS || '0|0').split('|')[0];
    const i0 = intentos();
    const malo = post(g, { a: 'guardar_configuracion', k: kc, op: op(), c: r.clave,
      cambios: { horario: 'Todo el día', whatsapp: '573000000000', cobro_ambiente: 'Producción', empresa_nit: '1' },
      versiones: { horario: v('horario'), whatsapp: vd('whatsapp'), cobro_ambiente: vd('cobro_ambiente'), empresa_nit: vd('empresa_nit') } });
    ok('  ...Y LO DEL DUEÑO NO, aunque la página lo mande: no se guarda nada', !malo.ok && malo.errores.whatsapp && malo.errores.cobro_ambiente &&
       malo.errores.empresa_nit && !malo.errores.horario && valor(g, 'whatsapp') === wa0 && valor(g, 'cobro_ambiente') === amb0 &&
       valor(g, 'empresa_nit') === nit0 && valor(g, 'horario') !== 'Todo el día', JSON.stringify(malo.errores));
    ok('  ...sin pedirle la clave del dueño ni contarlo como intento de entrar', !malo.necesitaClave &&
       intentos() === i0, i0 + ' → ' + intentos());

    // Lo que hace
    ok('LLEVA LA TIENDA: productos, pedidos, tablero', post(g, { a: 'productos', k: kc }).ok && post(g, { a: 'pedidos', k: kc }).ok &&
       post(g, { a: 'tablero', k: kc }).ok);
    ok('  ...y lo que hace queda a su nombre en el Registro', g.filas('Registro').some(f => /ana \(colaborador\)/.test(String(f[2])) && /portada_titulo/.test(String(f[4]))));
    const auto = post(g, { a: 'colaborador', k: kc, op: op(), accion: 'crear', usuario: 'pepe', c: r.clave });
    const fuera = post(g, { a: 'colaborador', k: kc, op: op(), accion: 'quitar', c: r.clave });
    ok('NO SE DA OTRO NI SE QUITA: eso es del dueño', !auto.ok && !fuera.ok && /solo el dueño/.test(auto.error) && JSON.parse(g.props.PANEL_COLABORADOR).u === 'ana');

    // El testigo no se disfraza
    const [carga, firma] = kc.split('.');
    const cuerpo = Buffer.from(carga.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString().split('|');
    ok('SU TESTIGO SE DISTINGUE del del dueño (y va firmado: cambiarlo lo invalida)', /^~/.test(cuerpo[3]) &&
       !post(g, { a: 'sesion', k: Buffer.from(['dona.rosa', cuerpo[1], cuerpo[2], cuerpo[3]].join('|')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_') + '.' + firma }).ok);

    // Clave nueva y quitar
    const r2 = post(g, { a: 'colaborador', k, op: op(), accion: 'crear', usuario: 'ana', c: clave });
    ok('CLAVE NUEVA AL COLABORADOR: la vieja y sus sesiones mueren; las del dueño no',
       r2.ok && r2.clave !== r.clave && !post(g, { a: 'sesion', k: kc }).ok && !post(g, { a: 'entrar', u: 'ana', c: r.clave }).ok &&
       post(g, { a: 'sesion', k }).ok);
    const kc2 = post(g, { a: 'entrar', u: 'ana', c: r2.clave }).testigo;
    const q = post(g, { a: 'colaborador', k, op: op(), accion: 'quitar', c: clave });
    ok('QUITARLE EL ACCESO lo deja fuera en ese momento', q.ok && !q.activo && !post(g, { a: 'sesion', k: kc2 }).ok &&
       !post(g, { a: 'entrar', u: 'ana', c: r2.clave }).ok && !g.props.PANEL_COLABORADOR);
    ok('  ...y queda en el Registro', g.filas('Registro').some(f => /Quitó el acceso del colaborador/.test(String(f[3]))));
    ok('  ...y el dueño sigue dentro', post(g, { a: 'sesion', k }).ok && post(g, { a: 'configuracion', k }).colaborador.activo === false);
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
  const entrar = async (u, c) => {
    await p.goto(U + '/admin.html');
    await hasta(p, () => !document.querySelector('#entrar').hidden);
    await p.fill('#usuario', u); await p.fill('#clave', c);
    await p.click('#botonEntrar');
    await hasta(p, () => !document.querySelector('#panel').hidden);
  };
  const aTienda = async () => {
    await p.evaluate(() => mostrarVista('tienda'));
    await hasta(p, () => document.querySelectorAll('#camposTienda details').length > 0);
  };

  await entrar('dona.rosa', clave);
  await aTienda();
  await hasta(p, () => !document.querySelector('#seccionColaborador').hidden);
  ok('EN LA PÁGINA, el dueño ve «Otra persona en el panel»', await p.locator('#seccionColaborador').isVisible());
  await p.evaluate(() => { document.querySelector('#seccionColaborador').open = true; });
  await p.fill('#c-usuario', 'ana');
  await p.fill('#c-clave', clave);
  await p.click('#darColaborador');
  await hasta(p, () => !document.querySelector('#claveColaborador').hidden);
  const claveAna = (await p.locator('#claveColaboradorTexto').innerText()).trim();
  ok('  ...le da una clave y la enseña una vez', /^\w{4}-\w{4}-\w{4}-\w{4}$/.test(claveAna) && await p.locator('#quitarColaborador').isVisible());
  ok('  ...y la clave del dueño no se queda escrita', (await p.inputValue('#c-clave')) === '');

  await p.click('#salir');
  await entrar('ana', claveAna);
  ok('EL COLABORADOR ENTRA y el panel dice que es colaborador', /ana · colaborador/.test(await p.locator('#usuarioActual').innerText()));
  await aTienda();
  const grupos = await p.evaluate(() => [...document.querySelectorAll('#camposTienda details')].map(d => d.dataset.grupo));
  const campos = await p.evaluate(() => [...document.querySelectorAll('#camposTienda [data-clave]')].map(e => e.dataset.clave));
  ok('  ...ve los ajustes de la vitrina y el cobro, y no los datos legales, los correos ni lo avanzado',
     campos.includes('portada_titulo') && campos.includes('cobro_modo') && !campos.includes('whatsapp') && !campos.includes('cobro_ambiente') &&
     !grupos.includes('Datos legales') && !grupos.includes('Avanzado') && !grupos.includes('El correo del día'), grupos.join(','));
  ok('  ...con un aviso que lo explica, y sin la sección del colaborador', await p.locator('#avisoRol').isVisible() &&
     await p.locator('#seccionColaborador').isHidden());
  ok('  ...y tiene a mano la vista previa y publicar', await p.locator('#vistaPrevia').isVisible());
  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
}
