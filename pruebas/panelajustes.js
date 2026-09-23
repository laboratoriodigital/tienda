/* 0.9.0 — el panel alcanza para todo: la configuración entera, envíos y cupones.
 * ---------------------------------------------------------------------------
 * El dueño pidió que todo lo que se escribe a mano en la hoja se pueda hacer
 * desde el panel, en dos pantallas, y que la hoja siga sirviendo igual. Lo que
 * se prueba aquí, además de que se guarde:
 *
 *   · LO QUE DECIDE A DÓNDE VA LA PLATA PIDE LA CLAVE OTRA VEZ. Con una sesión
 *     robada, cambiar la cuenta de las transferencias o el WhatsApp de los
 *     pedidos es llevarse las ventas. Sin la clave no se escribe nada, una
 *     clave mala cuenta como intento fallido, y la clave no queda en ninguna
 *     parte: ni en el registro ni en la página.
 *   · UNA ZONA NO CAMBIA DE CÓDIGO: viaja en los pedidos.
 *   · «USOS CONFIRMADOS» ES DEL SCRIPT. Editar un cupón no lo toca, y una venta
 *     con el cupón no invalida la edición de sus notas.
 *   · UN CUPÓN USADO NO SE BORRA: se desactiva.
 *   · LO QUE SE GUARDA AQUÍ ES LO QUE LA TIENDA USA: el cupón creado en el
 *     panel descuenta en la validación de verdad.
 *
 *   node pruebas/panelajustes.js      (la segunda parte abre un navegador)
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-ajustes-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function conSesion() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k, clave };
}
const valor = (g, c) => String((g.filas('Configuración').find(f => String(f[0]) === c) || [])[1]);
const cfgDe = (g, k, c) => post(g, { a: 'configuracion', k }).claves.find(x => x.clave === c);

(async () => {
  /* ═══ 0. LA REVISIÓN DESDE EL PANEL (0.20.0 · bitácora 85) ═══
     El mismo diagnóstico de la hoja, para el comerciante que nunca abre la
     hoja. Lo que se vigila: que sea del DUEÑO, que no se escape el token de
     montaje —el informe se reenvía por WhatsApp— y que el resumen venga en
     datos y no obligue al panel a leer texto. */
  {
    const { g, k } = conSesion();
    const decir = console.log; console.log = () => {};
    const r = post(g, { a: 'diagnostico', k });
    console.log = decir;
    ok('LA REVISIÓN se pide desde el panel y trae el informe entero',
       r.ok && /RESUMEN/.test(r.texto) && r.texto.length > 400, String(r.texto || '').slice(0, 40));
    ok('  ...con el resumen en datos: estado, número y título por punto',
       Array.isArray(r.resumen) && r.resumen.length >= 8 &&
       r.resumen.every(x => /^(OK|REVISAR|PROBLEMA)$/.test(x.estado) && x.n > 0 && x.titulo),
       JSON.stringify((r.resumen || [])[0]));
    ok('  ...y SIN el token de montaje, que el informe se reenvía por WhatsApp',
       r.texto.indexOf(g.api.token()) === -1);
    ok('  ...mira lo que las últimas versiones enseñaron: stub, permiso, medición y respaldo',
       /stub/i.test(r.texto) && /PERMISO DE GITHUB|permiso de GitHub/.test(r.texto) &&
       /Medición/.test(r.texto) && /Volver atrás/.test(r.texto));

    /* El colaborador administra la tienda; el montaje y sus secretos, no. */
    console.log = () => {};
    g.api.propiedades().setProperty('PANEL_COLABORADOR',
      JSON.stringify({ u: 'ayudante', clave: 'x$y' }));
    const sinSesion = post(g, { a: 'diagnostico' });
    console.log = decir;
    ok('  ...y sin sesión no contesta nada',
       !sinSesion.ok && /[Ss]esión/.test(String(sinSesion.error)), String(sinSesion.error));
    const puerta = g.api.PUERTAS.diagnostico;
    ok('  ...la puerta es del panel, solo del dueño y solo por POST',
       puerta && puerta.guarda === 'panel' && puerta.soloDueno === true && puerta.soloPost === true);

    const admin = require('fs').readFileSync('../plantilla/admin.html', 'utf8');
    ok('  ...y el panel la ofrece: «Revisión de tu tienda», a demanda',
       /id="revisarTienda"/.test(admin) && /llamar\("diagnostico"\)/.test(admin) &&
       /Revisión de tu tienda/.test(admin));
  }

  // ═══ 1. Lo sensible pide la clave ═══
  {
    const { g, k, clave } = conSesion();
    const w = cfgDe(g, k, 'pago_llave');
    const guardar = extra => post(g, Object.assign({ a: 'guardar_configuracion', k, op: op(),
      cambios: { pago_llave: '3001234567', portada_titulo: 'Otro título' },
      versiones: { pago_llave: w.version, portada_titulo: cfgDe(g, k, 'portada_titulo').version } }, extra));
    const antes = valor(g, 'pago_llave'), tituloAntes = valor(g, 'portada_titulo');

    const r1 = guardar({});
    ok('CAMBIAR LA CUENTA DE LAS TRANSFERENCIAS SIN LA CLAVE no escribe nada, ni lo que venía al lado',
       !r1.ok && r1.necesitaClave && valor(g, 'pago_llave') === antes && valor(g, 'portada_titulo') === tituloAntes,
       r1.error);
    const intentos0 = String(g.props.PANEL_INTENTOS || '0|0');
    const r2 = guardar({ c: 'la-que-no-es' });
    ok('  ...con una clave mala tampoco, y cuenta como un intento fallido de entrar',
       !r2.ok && r2.necesitaClave && valor(g, 'pago_llave') === antes &&
       String(g.props.PANEL_INTENTOS || '').split('|')[0] === String(Number(intentos0.split('|')[0]) + 1),
       intentos0 + ' → ' + g.props.PANEL_INTENTOS);
    const r3 = guardar({ c: clave });
    ok('  ...y con la clave buena se guarda', r3.ok && valor(g, 'pago_llave') === '3001234567' &&
       valor(g, 'portada_titulo') === 'Otro título', JSON.stringify(r3));
    const todo = JSON.stringify(g.filas('Registro')) + JSON.stringify(g.filas('Errores') || []);
    ok('  ...y la clave no queda escrita en ninguna pestaña', todo.indexOf(clave) === -1);

    const titulo = cfgDe(g, k, 'portada_titulo');
    const w2 = cfgDe(g, k, 'whatsapp');
    const r4 = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { whatsapp: w2.valor, portada_titulo: 'Sin clave' },
      versiones: { whatsapp: w2.version, portada_titulo: titulo.version } });
    ok('MANDAR EL MISMO WHATSAPP DE SIEMPRE no pide la clave: no es cambiarlo', r4.ok && valor(g, 'portada_titulo') === 'Sin clave',
       JSON.stringify(r4));
    const amb = cfgDe(g, k, 'cobro_ambiente');
    const r5 = post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { cobro_ambiente: 'Producción' },
                         versiones: { cobro_ambiente: amb.version } });
    ok('PASAR LA PASARELA A DINERO REAL también la pide', !r5.ok && r5.necesitaClave && /Pruebas/.test(valor(g, 'cobro_ambiente')));
  }

  // ═══ 2. Envíos ═══
  {
    const { g, k } = conSesion();
    const envios = () => g.filas('Envíos').slice(1);
    const n0 = envios().length;
    const mismo = op();
    const crear1 = () => post(g, { a: 'guardar_envio', k, op: mismo, envio: { id: 'zona-veredas', nombre: 'Zona veredas', valor: '8.000' } });
    const r1 = crear1(); crear1();
    ok('CREAR UNA ZONA la agrega a la hoja, una sola vez aunque se repita la operación',
       r1.ok && envios().length === n0 + 1 && envios().some(f => f[0] === 'zona-veredas' && Number(f[2]) === 8000),
       JSON.stringify(envios().slice(-1)));
    const r2 = post(g, { a: 'guardar_envio', k, op: op(), envio: { id: 'zona-veredas', nombre: 'Otra', valor: '1' } });
    ok('  ...y otra con el mismo código no', !r2.ok && /Ya hay/.test(r2.errores.id));
    const r3 = post(g, { a: 'guardar_envio', k, op: op(), envio: { id: 'Zona Norte!', nombre: '', valor: 'gratis' } });
    ok('  ...ni una con el código, el nombre o el valor mal, y cada error va a su campo',
       !r3.ok && r3.errores.id && r3.errores.nombre && r3.errores.valor, JSON.stringify(r3.errores));

    let lista = post(g, { a: 'configuracion', k }).envios;
    const sur = lista.find(e => e.id === 'zona-veredas');
    const r4 = post(g, { a: 'guardar_envio', k, op: op(), original: 'zona-veredas', version: sur.version,
                         envio: { id: 'zona-cambiada', nombre: 'Zona veredas y centro', valor: '9000' } });
    ok('EDITAR UNA ZONA cambia nombre y valor, y NO el código: viaja en los pedidos',
       r4.ok && envios().some(f => f[0] === 'zona-veredas' && f[1] === 'Zona veredas y centro' && Number(f[2]) === 9000) &&
       !envios().some(f => f[0] === 'zona-cambiada'));
    const r5 = post(g, { a: 'guardar_envio', k, op: op(), original: 'zona-veredas', version: sur.version,
                         envio: { nombre: 'Pisando', valor: '1' } });
    ok('  ...y con la versión vieja no pisa lo que cambió entre medias', !r5.ok && /cambió/.test(r5.error) &&
       envios().some(f => f[0] === 'zona-veredas' && f[1] === 'Zona veredas y centro'));
    lista = post(g, { a: 'configuracion', k }).envios;
    const r6 = post(g, { a: 'guardar_envio', k, op: op(), original: 'zona-veredas', borrar: true,
                         version: (lista.find(e => e.id === 'zona-veredas') || {}).version });
    ok('BORRAR UNA ZONA la quita de la hoja', r6.ok && !envios().some(f => f[0] === 'zona-veredas'));
    const reg = g.filas('Registro').slice(1).map(f => f[3] + ' ' + f[4]).join(' | ');
    ok('  ...y todo quedó en el Registro', /Creó la zona de envío Envíos · zona-veredas/.test(reg) &&
       /Editó la zona de envío/.test(reg) && /Borró la zona de envío/.test(reg), reg.slice(0, 160));
    ok('  ...y deja la tienda con cambios por publicar: las zonas se hornean', !!g.props.ULTIMA_EDICION);
  }

  // ═══ 3. Cupones ═══
  {
    const { g, k } = conSesion();
    const cupon = c => g.filas('Cupones').slice(1).find(f => String(f[0]) === c);
    const r1 = post(g, { a: 'guardar_cupon', k, op: op(), cupon: { codigo: 'verano25', tipo: 'porcentaje', valor: '25',
      minimo: '30000', vence: '2026-12-31', usosMaximos: '', activo: 'Sí', notas: 'Temporada' } });
    ok('CREAR UN CUPÓN lo escribe en mayúsculas, con sus usos en cero', r1.ok && cupon('VERANO25') &&
       cupon('VERANO25')[1] === 'porcentaje' && Number(cupon('VERANO25')[6]) === 0, JSON.stringify(cupon('VERANO25')));
    const aplica = g.api.revisarCupon('VERANO25', 100000);
    ok('  ...Y LA TIENDA LO USA: descuenta en la validación de verdad', aplica.ok && aplica.valor === 25, JSON.stringify(aplica));
    const r2 = post(g, { a: 'guardar_cupon', k, op: op(), cupon: { codigo: 'MAL', tipo: 'porcentaje', valor: '150',
      minimo: 'x', vence: '31/12/2026', usosMaximos: '1.5', activo: 'Sí' } });
    ok('  ...y uno con el porcentaje, el mínimo, la fecha o los usos mal no entra',
       !r2.ok && r2.errores.valor && r2.errores.minimo && r2.errores.vence && r2.errores.usosMaximos && !cupon('MAL'),
       JSON.stringify(r2.errores));

    const lista = post(g, { a: 'configuracion', k }).cupones;
    const v = lista.find(c => c.codigo === 'VERANO25');
    /* Entre que se leyó y se guarda, una venta con el cupón: el script sube
       «Usos confirmados». Eso no es un cambio de lo que se edita. */
    const fila = g.filas('Cupones').findIndex(f => String(f[0]) === 'VERANO25') + 1;
    g.hojas.get('Cupones').getRange(fila, 7).setValue(3);
    const r3 = post(g, { a: 'guardar_cupon', k, op: op(), original: 'VERANO25', version: v.version,
      cupon: { tipo: 'porcentaje', valor: '20', minimo: '30000', vence: '2026-12-31', usosMaximos: '100', activo: 'No', notas: 'Fin' } });
    ok('EDITAR UN CUPÓN mientras se vendía con él: se guarda, y los usos que contó el script quedan intactos',
       r3.ok && Number(cupon('VERANO25')[2]) === 20 && cupon('VERANO25')[7] === 'No' && Number(cupon('VERANO25')[6]) === 3,
       JSON.stringify(r3) + ' ' + JSON.stringify(cupon('VERANO25')));
    ok('  ...y desactivado, la tienda ya no lo acepta', !g.api.revisarCupon('VERANO25', 100000).ok);
    const v2 = post(g, { a: 'configuracion', k }).cupones.find(c => c.codigo === 'VERANO25');
    const r4 = post(g, { a: 'guardar_cupon', k, op: op(), original: 'VERANO25', version: v2.version, borrar: true });
    ok('UN CUPÓN QUE YA SE USÓ no se borra: se desactiva', !r4.ok && /desactiva/.test(r4.error) && !!cupon('VERANO25'));
    const p5 = post(g, { a: 'configuracion', k }).cupones.find(c => c.codigo === 'PRIMERA5000');
    const r5 = post(g, { a: 'guardar_cupon', k, op: op(), original: 'PRIMERA5000', version: p5.version, borrar: true });
    ok('  ...y uno sin usar sí', r5.ok && !cupon('PRIMERA5000'));
    const r6 = post(g, { a: 'guardar_cupon', op: op(), cupon: { codigo: 'SINSESION', tipo: 'fijo', valor: '1000' } });
    ok('SIN SESIÓN no se crea nada', !r6.ok && !cupon('SINSESION'));
  }

  // ═══ 3b. La transformación de fotos, de una lista ═══
  {
    const { g, k } = conSesion();
    const poner = (c, v) => g.hojas.get('Configuración').getRange(g.filas('Configuración').findIndex(f => String(f[0]) === c) + 1, 2).setValue(v);
    poner('sitio_url', 'https://tienda.workers.dev'.replace('tienda.workers.dev', 'mitienda.laboratoriodigital-la.workers.dev'));
    poner('fotos_cdn', '');
    let c = cfgDe(g, k, 'fotos_cdn');
    const cf = (c.opciones || []).find(o => /Cloudflare/.test(o.rotulo)) || {};
    ok('LA TRANSFORMACIÓN DE FOTOS se elige de una lista: Ninguna y Cloudflare',
       c.tipo === 'lista' && c.opciones[0].valor === '' && /cdn-cgi\/image/.test(cf.valor || ''), JSON.stringify(c.opciones));
    ok('  ...y en un *.workers.dev, Cloudflare sale desactivada y dice por qué',
       cf.desactivada === true && /dominio propio/.test(cf.rotulo), cf.rotulo);
    const r0 = post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { fotos_cdn: cf.valor }, versiones: { fotos_cdn: c.version } });
    ok('  ...y no se puede guardar a la fuerza', !r0.ok && /lista/.test((r0.errores || {}).fotos_cdn || ''), JSON.stringify(r0.errores));
    poner('sitio_url', 'https://www.mitienda.com');
    c = cfgDe(g, k, 'fotos_cdn');
    const cf2 = c.opciones.find(o => /Cloudflare/.test(o.rotulo));
    const r1 = post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { fotos_cdn: cf2.valor }, versiones: { fotos_cdn: c.version } });
    ok('CON DOMINIO PROPIO se elige Cloudflare, y en la hoja queda la plantilla de siempre',
       r1.ok && valor(g, 'fotos_cdn') === 'https://www.mitienda.com/cdn-cgi/image/format=auto,quality=82,width={ancho},fit=cover/fotos/{ruta}',
       valor(g, 'fotos_cdn'));
    c = cfgDe(g, k, 'fotos_cdn');
    const r2 = post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { fotos_cdn: 'https://otro.com/{ruta}' }, versiones: { fotos_cdn: c.version } });
    ok('  ...y una plantilla inventada desde el panel no entra', !r2.ok && valor(g, 'fotos_cdn') !== 'https://otro.com/{ruta}');
    poner('fotos_cdn', 'https://ik.imagekit.io/mitienda/{ruta}?tr=w-{ancho}');
    c = cfgDe(g, k, 'fotos_cdn');
    ok('LO QUE YA HABÍA EN LA HOJA y no es de la lista se respeta: no se marca como error', !c.problema, c.problema);
    const t = cfgDe(g, k, 'portada_titulo');
    const r3 = post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { portada_titulo: 'Con ImageKit', fotos_cdn: c.valor },
                         versiones: { portada_titulo: t.version, fotos_cdn: c.version } });
    ok('  ...y guardar otra cosa no lo toca', r3.ok && /imagekit/.test(valor(g, 'fotos_cdn')));
  }

  // ═══ 4. En la página ═══
  await enLaPagina();

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

async function enLaPagina() {
  const { chromium } = require('playwright');
  const { hasta } = require('./esperar.js');
  const U = 'http://localhost:' + (process.env.PUERTO || 8099);
  const hojas = async () => (await fetch(U + '/__hojas')).json();
  const conf = async c => String((((await hojas())['Configuración'] || []).find(f => String(f[0]) === c) || [])[1]);

  await fetch(U + '/__reset');
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', clave);
  await p.click('#botonEntrar');
  await hasta(p, () => !document.querySelector('#panel').hidden);

  ok('EL PANEL TIENE DOS PANTALLAS: Ventas y Tienda', (await p.locator('.pestanas [role="tab"]').allInnerTexts()).join('|') === 'Ventas|Tienda',
     (await p.locator('.pestanas [role="tab"]').allInnerTexts()).join('|'));
  await p.click('#tab-tienda');
  await hasta(p, () => document.querySelectorAll('#lista .fila').length > 0 && document.querySelectorAll('#camposTienda details').length > 0);
  const secciones = await p.$$eval('#camposTienda details', d => d.map(x => ({ g: x.dataset.grupo, abierta: x.open })));
  ok('TIENDA: los productos arriba y los ajustes debajo, en secciones plegadas',
     await p.evaluate(() => document.querySelector('#lista').getBoundingClientRect().top <
                            document.querySelector('#formTienda').getBoundingClientRect().top) &&
     secciones.length >= 8 && secciones.every(x => !x.abierta), secciones.map(x => x.g).join(', '));

  // Un cambio sensible, desde la página
  await p.evaluate(() => { document.querySelector('#camposTienda details[data-grupo="El cobro"]').open = true; });
  ok('  ...sin cambios sensibles no se pide la clave', await p.locator('#claveConfirmar').isHidden());
  await p.fill('#t-pago_titular', 'Otra Persona');
  ok('CAMBIAR A NOMBRE DE QUIÉN SE TRANSFIERE hace aparecer el campo de la clave, antes de guardar',
     await p.locator('#claveConfirmar').isVisible());
  await p.click('#guardarTienda');
  ok('  ...y sin escribirla no se manda nada', /Escribe tu clave/.test(await p.locator('#avisoTienda').innerText()) &&
     (await conf('pago_titular')) !== 'Otra Persona');
  await p.fill('#t-clave', clave);
  await p.click('#guardarTienda');
  await hasta(p, () => /Guardado/.test(document.querySelector('#avisoTienda').textContent));
  ok('  ...con la clave se guarda', (await conf('pago_titular')) === 'Otra Persona');
  ok('  ...y la clave no se queda escrita en la página', (await p.inputValue('#t-clave')) === '');
  const pet = await (await fetch(U + '/__peticiones')).json();
  ok('  ...ni viajó en ninguna dirección', !pet.some(q => JSON.stringify(q.metodo === 'POST' ? q.direccion : q).indexOf(clave) !== -1));

  // Una zona nueva
  await p.click('#seccionEnvios summary');
  await p.click('#nuevoEnvio');
  const nueva = p.locator('#listaEnvios .fila-ajuste').last();
  await nueva.locator('[data-campo="id"]').fill('recogida-local');
  await nueva.locator('[data-campo="nombre"]').fill('Recoger en el local');
  await nueva.locator('[data-campo="valor"]').fill('0');
  await nueva.locator('button[data-accion="guardar"]').click();
  await hasta(p, () => /Zona guardada/.test(document.querySelector('#avisoEnvios').textContent));
  ok('UNA ZONA NUEVA desde la página queda en la hoja', ((await hojas())['Envíos'] || []).some(f => f[0] === 'recogida-local'));

  // Desactivar un cupón
  await p.click('#seccionCupones summary');
  const cup = p.locator('#listaCupones .fila-ajuste[data-original="BIENVENIDA10"]');
  await cup.locator('summary').click();
  await cup.locator('[data-campo="activo"]').selectOption('No');
  await cup.locator('button[data-accion="guardar"]').click();
  await hasta(p, () => /Cupón guardado/.test(document.querySelector('#avisoCupones').textContent));
  const fc = ((await hojas())['Cupones'] || []).find(f => f[0] === 'BIENVENIDA10');
  ok('DESACTIVAR UN CUPÓN desde la página', fc && fc[7] === 'No', JSON.stringify(fc));
  ok('  ...y la lista lo dice sin abrirlo', /BIENVENIDA10 · 10% · inactivo/.test(await p.locator('#listaCupones').innerText()));

  const cup2 = p.locator('#listaCupones .fila-ajuste[data-original="PRIMERA5000"]');
  await cup2.locator('summary').click();
  await cup2.locator('button[data-accion="borrar"]').click();
  ok('BORRAR UN CUPÓN pide un segundo toque', !!((await hojas())['Cupones'] || []).find(f => f[0] === 'PRIMERA5000') &&
     /Seguro/.test(await cup2.locator('button[data-accion="borrar"]').innerText()));

  ok('EN UN CELULAR la pantalla Tienda no se desplaza de lado',
     await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  ok('Ningún error de JavaScript en la página', errs.length === 0, errs.join(' | '));
  await b.close();
}
