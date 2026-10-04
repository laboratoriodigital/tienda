/* D-2 — el panel del comerciante, en el navegador.
 * ---------------------------------------------------------------------------
 * productos.js prueba el maestro: que lo que no valida no entra, que un
 * formulario viejo no pisa una venta, que la misma operación no duplica. Esta
 * prueba que la PÁGINA no deshace nada de eso por su lado:
 *
 *   · NI LA CLAVE NI EL TESTIGO EN UNA DIRECCIÓN. Se revisa cada petición que
 *     llegó al servidor, no el código de la página.
 *   · EL REINTENTO ES EL MISMO GESTO. Se pierde la respuesta DESPUÉS de que el
 *     maestro guardó —el caso real del celular sin señal— y se pulsa Guardar
 *     otra vez: tiene que quedar UN producto, no dos.
 *   · LO QUE VIENE DE LA HOJA SE PINTA COMO TEXTO. Una celda admite cualquier
 *     cosa, incluida una etiqueta que ejecuta código.
 *
 *   node pruebas/admin.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { pintado, hasta } = require('./esperar.js');

const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

const hojas = async () => (await fetch(U + '/__hojas')).json();
const fila = async (id) => ((await hojas())['Catálogo'] || []).find(f => String(f[0]) === id);
const celda = (hoja, f, c, v) =>
  fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + c + '&v=' + encodeURIComponent(v));
const filaNumero = async (id) => ((await hojas())['Catálogo'] || []).findIndex(f => String(f[0]) === id) + 1;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  const visible = s => p.locator(s).isVisible();
  const texto = s => p.locator(s).innerText();
  const filas = () => p.locator('#lista .fila').count();
  const entrar = async (u, c) => {
    await p.fill('#usuario', u); await p.fill('#clave', c);
    await p.click('#botonEntrar');
  };
  /* Desde la 0.9.0 se entra por Ventas: los productos están en Tienda. */
  const listo = async () => {
    await hasta(p, () => !document.querySelector('#panel').hidden);
    if (await p.locator('#pantalla-tienda').isHidden()) await p.click('#tab-tienda');
    await hasta(p, () => document.querySelectorAll('#lista .fila').length > 0);
  };
  const abrirGrupo = g => p.evaluate(g => { document.querySelector('#camposTienda details[data-grupo="' + g + '"]').open = true; }, g);

  await fetch(U + '/__reset');
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();

  // ═══ 1. Entrar ═══
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  ok('SIN SESIÓN se ve el formulario de entrada, no el panel',
     (await visible('#entrar')) && !(await visible('#panel')));
  ok('  ...y la página no se indexa',
     /noindex/.test(await p.getAttribute('meta[name="robots"]', 'content')));

  await entrar('dona.rosa', 'la-que-no-es');
  await hasta(p, () => !document.querySelector('#avisoEntrar').hidden);
  ok('UNA CLAVE MALA no entra, y lo dice', !(await visible('#panel')) &&
     /no corresponden/.test(await texto('#avisoEntrar')), await texto('#avisoEntrar'));

  await entrar('dona.rosa', clave);
  await listo();
  ok('CON LA CLAVE BUENA se ve el panel con los productos de la hoja',
     (await visible('#panel')) && (await filas()) === 8, (await filas()) + ' productos');
  ok('  ...y dice quién entró', (await texto('#usuarioActual')) === 'dona.rosa');
  ok('  ...y la clave no se queda escrita en la página', (await p.inputValue('#clave')) === '');
  ok('  ...y avisa que guardar NO publica',
     /cuando publicas/.test(await texto('.publicar')), (await texto('.publicar')).slice(0, 60));

  /* LO QUE IMPORTA NO ES QUÉ HACE LA PÁGINA, SINO QUÉ LLEGÓ AL SERVIDOR. Se
     revisan todas las peticiones: las que llegaron por GET traen su dirección
     entera, y en ninguna puede estar la clave ni el testigo. */
  const pet = await (await fetch(U + '/__peticiones')).json();
  /* Y la dirección de los POST también: un POST a «…/exec?k=…» lleva el
     testigo en la dirección igual que un GET. */
  const enDireccion = q => q.metodo === 'POST' ? (q.direccion || {}) : q;
  const conSecreto = pet.filter(q => {
    const d = enDireccion(q);
    return d.c || d.k || JSON.stringify(d).indexOf(clave) !== -1;
  });
  ok('NI LA CLAVE NI EL TESTIGO viajaron en una dirección',
     conSecreto.length === 0 && pet.some(q => q.metodo === 'POST' && q.a === 'entrar') &&
     pet.some(q => q.metodo === 'POST' && q.a === 'productos'),
     pet.map(q => (q.metodo || 'GET') + ':' + q.a).join(' '));

  const guardado = await p.evaluate(() => sessionStorage.getItem('panel-testigo'));
  const enLocal = await p.evaluate(() => JSON.stringify(localStorage));
  ok('EL TESTIGO vive en la pestaña (sessionStorage), no en localStorage',
     !!guardado && enLocal.indexOf(guardado) === -1);

  // ═══ 2. Buscar y filtrar ═══
  await p.fill('#buscar', 'pan'); await pintado(p);
  ok('BUSCAR filtra por nombre y código', (await filas()) === 3, (await filas()) + ' filas');
  await p.fill('#buscar', ''); await p.selectOption('#filtroCategoria', 'Postres'); await pintado(p);
  ok('FILTRAR por categoría', (await filas()) === 2, (await filas()) + ' filas');
  await p.selectOption('#filtroCategoria', ''); await pintado(p);

  // ═══ 3. Editar ═══
  const abrir = async (id) => {
    await p.click(`#lista .fila[data-id="${id}"] button[data-accion="editar"]`);
    await hasta(p, () => !document.querySelector('#editor').hidden);
  };
  await abrir('croissant');
  ok('EDITAR abre el formulario con lo que dice la hoja',
     (await p.inputValue('#f-nombre')) === 'Croissant de mantequilla' &&
     (await p.inputValue('#f-precio')) === '6500');
  ok('  ...y el código NO se puede cambiar', await p.locator('#f-id').evaluate(e => e.readOnly));
  await p.fill('#f-descripcion', 'Con mantequilla francesa, horneado a las seis.');
  await p.click('#guardar');
  await hasta(p, () => document.querySelector('#editor').hidden);
  ok('GUARDAR escribe en la hoja', (await fila('croissant'))[6] === 'Con mantequilla francesa, horneado a las seis.');
  ok('  ...y vuelve a la lista diciendo que falta publicar',
     /Guardado.*publicar/.test(await texto('#avisoLista')), await texto('#avisoLista'));

  // ═══ 4. Lo que el maestro rechaza se queda en el formulario ═══
  await abrir('baguette');
  await p.fill('#f-precio', 'doce mil');
  await p.click('#guardar');
  await hasta(p, () => !document.querySelector('#avisoEditor').hidden);
  ok('UN PRECIO ILEGIBLE no se guarda: el motivo sale en el formulario',
     /precio tiene que ser un número/.test(await texto('#avisoEditor')) &&
     (await fila('baguette'))[4] === 8000, await texto('#avisoEditor'));
  ok('  ...y el formulario sigue abierto con lo que escribió, para corregirlo',
     (await visible('#editor')) && (await p.inputValue('#f-precio')) === 'doce mil');
  await p.click('#cancelar');

  // ═══ 5. El formulario viejo no pisa la venta ═══
  await abrir('pan-integral');
  const n = await filaNumero('pan-integral');
  await celda('Catálogo', n, 6, 15);                         // se vendieron tres mientras tanto
  await p.fill('#f-descripcion', 'Con semillas de girasol, linaza y chía.');
  await p.click('#guardar');
  await hasta(p, () => !document.querySelector('#avisoEditor').hidden);
  ok('UN FORMULARIO VIEJO NO RESUCITA LO VENDIDO: la página lo dice y la hoja no cambia',
     /cambió mientras lo editabas/.test(await texto('#avisoEditor')) &&
     Number((await fila('pan-integral'))[5]) === 15,
     'stock en la hoja: ' + (await fila('pan-integral'))[5]);
  await p.click('#cancelar');

  // ═══ 6. Crear, y el reintento que no duplica ═══
  await p.click('#nuevo');
  await hasta(p, () => !document.querySelector('#editor').hidden);
  await p.fill('#f-nombre', 'Camiseta Básica Ñandú');
  ok('EL CÓDIGO SE ARMA SOLO desde el nombre: minúsculas, sin tildes, sin eñe',
     (await p.inputValue('#f-id')) === 'camiseta-basica-nandu', await p.inputValue('#f-id'));
  await p.fill('#f-precio', '45000');
  await p.fill('#f-stock', '12');
  await p.fill('#f-categoria', 'Ropa');

  /* EL CASO REAL: el maestro guarda y la respuesta se pierde por el camino. */
  await fetch(U + '/__perder?n=1');
  await p.click('#guardar');
  await hasta(p, () => /No sabemos si se guardó/.test(document.querySelector('#avisoEditor').textContent));
  ok('SI SE PIERDE LA RESPUESTA, la página dice que no sabe — no que falló',
     /no se va a duplicar/.test(await texto('#avisoEditor')), await texto('#avisoEditor'));
  const antesDelReintento = ((await hojas())['Catálogo']).filter(f => f[0] === 'camiseta-basica-nandu').length;
  await p.evaluate(() => { document.querySelector('#avisoEditor').hidden = true; });
  await p.click('#guardar');
  /* Se espera a CUALQUIER respuesta —se cerró el editor, o salió un aviso—,
     no solo a la buena: si el reintento fuera un gesto nuevo, el maestro
     contestaría «ya existe» y el editor se quedaría abierto, y esperar solo a
     que se cierre dejaría la batería colgada en vez de decir qué falló. */
  await hasta(p, () => document.querySelector('#editor').hidden ||
                       !document.querySelector('#avisoEditor').hidden);
  const despues = ((await hojas())['Catálogo']).filter(f => f[0] === 'camiseta-basica-nandu').length;
  ok('  ...Y REINTENTAR NO DUPLICA: el maestro ya lo tenía, y hay UNO',
     antesDelReintento === 1 && despues === 1, 'antes ' + antesDelReintento + ', después ' + despues);
  /* Esto solo no basta, y se supo poniendo el defecto: con un número de
     operación NUEVO en el reintento tampoco se duplica, porque el maestro
     rechaza el código repetido. Pero el comerciante lee «Ya hay un producto con
     ese código» sobre el producto que acaba de crear, y cree que algo salió
     mal. Lo que el mismo número compra es que el reintento TERMINE BIEN. */
  ok('  ...y el reintento termina BIEN: «Creado», no «ya existe un producto con ese código»',
     (await p.locator('#editor').isHidden()) && /Creado/.test(await texto('#avisoLista')),
     (await p.locator('#editor').isHidden()) ? await texto('#avisoLista') : await texto('#avisoEditor'));
  ok('  ...y aparece en la lista', await p.locator('#lista .fila[data-id="camiseta-basica-nandu"]').count() === 1);

  // ═══ 6 bis. Subir una foto ═══
  {
    const filaCfg = ((await hojas())['Configuración']).findIndex(f => String(f[0]) === 'fotos_drive') + 1;
    await celda('Configuración', filaCfg, 2, 'carpeta-de-fotos');
    await fetch(U + '/__carpeta?id=carpeta-de-fotos');
    if (await visible('#editor')) await p.click('#cancelar');
    await abrir('baguette');
    ok('AL EDITAR se puede subir una foto', await visible('#subirFoto'));
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await p.setInputFiles('#f-foto', { name: 'IMG_4471.PNG', mimeType: 'image/png', buffer: png });
    await hasta(p, () => /Subida|no se puede|no dejó|No sabemos/.test(
      document.querySelector('#estadoFoto').textContent + document.querySelector('#avisoEditor').textContent));
    const drive = await (await fetch(U + '/__drive?id=carpeta-de-fotos')).json();
    /* «IMG_4471.PNG» es el nombre con el que llega del celular. En el Drive
       tiene que quedar con el que le toca al producto: ese es todo el punto. */
    ok('LA FOTO LLEGA AL DRIVE con el nombre del producto, no con «IMG_4471»',
       drive.length === 1 && drive[0].nombre === 'baguette-1.jpg', JSON.stringify(drive));
    ok('  ...achicada y en JPEG, que es lo que la página manda siempre',
       drive[0] && drive[0].cabecera === 'ffd8ff' && drive[0].tipo === 'image/jpeg');
    ok('  ...y el campo Fotos del formulario ya la trae',
       /baguette-1\.jpg/.test(await p.inputValue('#f-imagenes')), await p.inputValue('#f-imagenes'));

    /* LA FOTO CAMBIÓ LA FILA. Si la página no toma la versión nueva, el
       siguiente Guardar sale con «este producto cambió mientras lo editabas»
       por culpa de la foto que el comerciante acaba de subir. */
    await p.fill('#f-formato', 'Unidad de 250 g');
    await p.click('#guardar');
    await hasta(p, () => document.querySelector('#editor').hidden ||
                         !document.querySelector('#avisoEditor').hidden);
    ok('  ...Y GUARDAR DESPUÉS DE SUBIRLA FUNCIONA: la foto no deja el formulario viejo',
       (await p.locator('#editor').isHidden()) && (await fila('baguette'))[2] === 'Unidad de 250 g' &&
       /baguette-1\.jpg/.test((await fila('baguette'))[7]),
       (await p.locator('#editor').isHidden()) ? 'guardado' : await texto('#avisoEditor'));
  }

  // Si el reintento hubiera fallado, el editor seguiría abierto: se cierra para
  // que lo que sigue mida lo suyo y no se cuelgue por este.
  if (await visible('#editor')) await p.click('#cancelar');

  // ═══ 7. Activar y desactivar ═══
  await p.click('#lista .fila[data-id="galletas-avena"] button[data-accion="activar"]');
  await hasta(p, () => /Desactivado/.test(document.querySelector('#avisoLista').textContent));
  ok('DESACTIVAR lo marca en la hoja', (await fila('galletas-avena'))[9] === 'No');
  ok('  ...y desaparece de la lista mientras no se pidan los desactivados',
     await p.locator('#lista .fila[data-id="galletas-avena"]').count() === 0);
  await p.check('#verApagados'); await pintado(p);
  ok('  ...y vuelve a aparecer, marcado, al pedirlos',
     /Desactivado/.test(await texto('#lista .fila[data-id="galletas-avena"]')));

  // ═══ 8. Borrar, en dos pasos ═══
  await abrir('cafe-grano');
  await p.click('#borrar');
  ok('BORRAR PIDE CONFIRMACIÓN y dice a dónde va', (await visible('#borrarSi')) &&
     /Papelera/.test(await texto('#borrarSi')) && !!(await fila('cafe-grano')));
  await p.click('#borrarSi');
  await hasta(p, () => document.querySelector('#editor').hidden);
  const h = await hojas();
  ok('  ...y al confirmar, sale de Catálogo y queda en la Papelera',
     !(h['Catálogo'].some(f => f[0] === 'cafe-grano')) && (h['Papelera'] || []).some(f => f[0] === 'cafe-grano'));

  // ═══ 9. Lo que viene de la hoja se pinta como texto ═══
  const nx = await filaNumero('torta-chocolate');
  await celda('Catálogo', nx, 2, '<img src=x onerror="window.__xss=1">Torta');
  await p.reload();
  await listo();
  ok('UN NOMBRE CON HTML EN LA HOJA se ve como texto y no se ejecuta',
     !(await p.evaluate(() => window.__xss)) &&
     /<img src=x/.test(await texto('#lista .fila[data-id="torta-chocolate"] h3')),
     (await texto('#lista .fila[data-id="torta-chocolate"] h3')).slice(0, 40));
  ok('RECARGAR LA PÁGINA no pide entrar otra vez: la sesión es de la pestaña',
     await visible('#panel'));

  /* Una espera que se agota NO corta la corrida: la aserción que sigue es la que
     tiene que decir FALLA y por qué. Si no, un defecto deja la batería colgada
     sin una sola línea que leer. */
  const quizas = pr => pr.catch(() => {});

  // ═══ 9b. La barra de publicar (D-5) ═══
  await quizas(hasta(p, () => /\S/.test(document.querySelector('#textoPublicar').textContent) &&
                       !/Revisando/.test(document.querySelector('#textoPublicar').textContent)));
  ok('LA BARRA DE PUBLICAR dice algo concreto, y siempre que guardar no publica',
     /cuando publicas/.test(await texto('#textoPublicar')) && /\S/.test((await texto('#textoPublicar')).split('Guardar no publica')[0]),
     (await texto('#textoPublicar')).slice(0, 80));

  // ═══ 9c. Pedidos (D-3) ═══
  const registrar = (ped, items) => fetch(U + '/exec?a=registrar&pedido=' + ped +
    '&ciudad=Bogot%C3%A1&cupon=&envio=zona-norte&sub=0&items=' + encodeURIComponent(items));
  await registrar('PANEL1', 'croissant:2');
  await registrar('PANEL2', 'croissant:1');
  const lineasDe = async ped => ((await hojas())['Pedidos'] || []).filter(f => String(f[1]) === ped);
  const stock = async id => Number((await fila(id))[5]);
  const stock0 = await stock('croissant');

  await p.click('#tab-ventas');
  await quizas(hasta(p, () => document.querySelectorAll('#listaPedidos .fila').length >= 2));
  ok('LA PESTAÑA PEDIDOS lista los pedidos de la hoja',
     await p.locator('#listaPedidos .fila[data-pedido="PANEL1"]').count() === 1 &&
     await p.locator('#listaPedidos .fila[data-pedido="PANEL2"]').count() === 1);
  ok('  ...con un filtro por estado que dice cuántos hay',
     /Nuevo · 2/.test(await texto('#chipsEstados')), await texto('#chipsEstados'));
  /* 0.12.0 · LOS FILTROS SON INSTANTÁNEOS: tocar un filtro o buscar no va a
     Google. Antes era una ida y vuelta por toque, la lista se vaciaba y una
     respuesta vieja podía pisar a la nueva. */
  const pedidasDePedidos = async () => ((await (await fetch(U + '/__peticiones')).json())
    .filter(q => q.metodo === 'POST' && q.a === 'pedidos')).length;
  const antesFiltro = await pedidasDePedidos();
  await p.click('#chipsEstados button[data-estado="pagado"]');
  const vaciaPagado = await p.evaluate(() => document.querySelectorAll('#listaPedidos .fila').length === 0 &&
                                             /No hay pedidos/.test(document.querySelector('#listaPedidos').textContent));
  await p.click('#chipsEstados button[data-estado="nuevo"]');
  const conNuevos = await p.locator('#listaPedidos .fila').count();
  await p.fill('#buscarPedido', 'PANEL2');
  await hasta(p, () => document.querySelectorAll('#listaPedidos .fila').length === 1);
  ok('LOS FILTROS Y EL BUSCADOR responden al instante, sin volver a preguntarle a la hoja',
     vaciaPagado && conNuevos === 2 && (await pedidasDePedidos()) === antesFiltro &&
     (await p.locator('#listaPedidos .fila[data-pedido="PANEL2"]').count()) === 1,
     'peticiones: ' + antesFiltro + ' → ' + (await pedidasDePedidos()));
  await p.fill('#buscarPedido', '');
  await p.click('#chipsEstados button[data-estado=""]');
  await hasta(p, () => document.querySelectorAll('#listaPedidos .fila').length >= 2);

  await p.click('#listaPedidos .fila[data-pedido="PANEL1"] button[data-accion="ver"]');
  await quizas(hasta(p, () => !document.querySelector('#pedido').hidden));
  ok('VER UN PEDIDO muestra lo que se compró', /Croissant de mantequilla/.test(await texto('#detallePedido')) &&
     /2 ×/.test(await texto('#detallePedido')));

  await p.selectOption('#p-estado', 'pagado');
  ok('ELEGIR «Pagado» DICE ANTES DE GUARDAR que se descuenta del inventario',
     /se descuentan del inventario: 2 × Croissant/.test(await texto('#p-efecto')), await texto('#p-efecto'));
  await p.click('#guardarPedido');
  await quizas(hasta(p, () => /Listo/.test(document.querySelector('#avisoPedido').textContent)));
  let lp = await lineasDe('PANEL1');
  ok('  ...y al guardar pasa en la hoja lo mismo que si se cambiara allá',
     lp[0][3] === 'Pagado' && /Descontado/.test(lp[0][12]) && (await stock('croissant')) === stock0 - 2,
     lp[0][3] + ' · ' + lp[0][12] + ' · stock ' + (await stock('croissant')));

  await p.selectOption('#p-estado', 'cancelado');
  ok('CANCELAR UN PEDIDO PAGADO avisa que el stock VUELVE',
     /VUELVEN al inventario/.test(await texto('#p-efecto')), await texto('#p-efecto'));
  await p.click('#guardarPedido');
  await quizas(hasta(p, () => !document.querySelector('#guardarPedidoSi').hidden));
  lp = await lineasDe('PANEL1');
  ok('  ...y pide un segundo toque: el primero no cambia nada',
     (await visible('#guardarPedidoSi')) && lp[0][3] === 'Pagado', lp[0][3]);
  if (await visible('#guardarPedidoSi')) await p.click('#guardarPedidoSi');
  await quizas(hasta(p, () => /Listo/.test(document.querySelector('#avisoPedido').textContent)));
  lp = await lineasDe('PANEL1');
  ok('  ...y con el segundo, se cancela y el stock vuelve',
     lp[0][3] === 'Cancelado' && /Devuelto/.test(lp[0][12]) && (await stock('croissant')) === stock0,
     lp[0][3] + ' · ' + lp[0][12]);

  /* Un estado que la hoja no entiende NO se muestra como «Nuevo». */
  const fp2 = ((await hojas())['Pedidos'] || []).findIndex(f => String(f[1]) === 'PANEL2') + 1;
  await celda('Pedidos', fp2, 4, 'pagadito');
  await p.click('#cerrarPedido');
  await quizas(hasta(p, () => /Revisar · 1/.test(document.querySelector('#chipsEstados').textContent)));
  ok('UN ESTADO QUE LA HOJA NO ENTIENDE sale en su propio filtro, «Revisar»',
     /Revisar · 1/.test(await texto('#chipsEstados')));
  await p.click('#listaPedidos .fila[data-pedido="PANEL2"] button[data-accion="ver"]');
  await quizas(hasta(p, () => !document.querySelector('#pedido').hidden));
  const primera = await p.evaluate(() => { const o = document.querySelector('#p-estado').options[0];
    return { t: o.textContent, d: o.disabled, sel: document.querySelector('#p-estado').selectedIndex }; });
  ok('  ...y al abrirlo se ve lo que dice la hoja, sin hacerse pasar por otro estado',
     /pagadito/.test(primera.t) && primera.d && primera.sel === 0, JSON.stringify(primera));
  await p.click('#cerrarPedido');

  // ═══ 9d. Tu tienda (D-4) ═══
  const conf = async clave => (((await hojas())['Configuración'] || []).find(f => String(f[0]) === clave) || [])[1];
  const fv = ((await hojas())['Configuración'] || []).findIndex(f => String(f[0]) === 'f_variantes') + 1;
  await celda('Configuración', fv, 2, 'tal vez');
  await p.click('#tab-tienda');
  /* Se espera a que llegue la lectura NUEVA —la que ya trae el «tal vez»—, no
     a que exista el campo: existía desde la visita anterior. */
  await quizas(hasta(p, () => { const x = document.querySelector('#t-f_variantes'); return x && x.value === 'tal vez'; }));
  await abrirGrupo('La portada'); await abrirGrupo('Los colores');
  const sel = await p.evaluate(() => { const s = document.querySelector('#t-f_variantes');
    return { v: s.value, t: s.options[s.selectedIndex].textContent }; });
  ok('UN INTERRUPTOR QUE EN LA HOJA DICE «tal vez» sale así, marcado — no como «No»',
     sel.v === 'tal vez' && /no se entiende/.test(sel.t), JSON.stringify(sel));

  await p.fill('#t-portada_titulo', 'Pan del panel');
  await p.click('#guardarTienda');
  await quizas(hasta(p, () => /Guardado/.test(document.querySelector('#avisoTienda').textContent)));
  ok('GUARDAR LA TIENDA escribe lo que cambió', (await conf('portada_titulo')) === 'Pan del panel');
  ok('  ...y NO toca lo que no se entendía y nadie cambió', (await conf('f_variantes')) === 'tal vez',
     await conf('f_variantes'));

  const color0 = await conf('color_principal');
  await p.fill('#t-color_principal', 'verde');
  await p.click('#guardarTienda');
  await quizas(hasta(p, () => !document.querySelector('#err-color_principal').hidden));
  ok('UN COLOR QUE NO SIRVE se explica junto al campo, y no se guarda',
     /Un color se escribe así/.test(await texto('#err-color_principal')) && (await conf('color_principal')) === color0,
     await texto('#err-color_principal'));

  await p.click('#tab-tienda');
  await listo();

  // ═══ 9e. El stock por combinación (C-1b) ═══
  {
    const fc = ((await hojas())['Catálogo'] || []).findIndex(f => f[0] === 'baguette') + 1;
    await fetch(U + '/__celda?hoja=Cat%C3%A1logo&f=' + fc + '&c=14&v=' + encodeURIComponent('Talla: S|M ; Color: Rosa') + '&disparar=1');
    await p.click('#tab-tienda');
    await p.reload(); await listo();
    await abrir('baguette');
    await quizas(hasta(p, () => !document.querySelector('#combinaciones').hidden));
    ok('UN PRODUCTO CON VARIANTES enseña una fila por combinación, vacía, y el Stock de arriba editable',
       (await p.locator('#filasCombinaciones input.stock').count()) === 2 &&
       !(await p.evaluate(() => document.querySelector('#f-stock').readOnly)));
    const combinacionesFoto = await p.evaluate(() => [...document.querySelectorAll('[data-foto-combinacion]')]
      .map(o => o.dataset.fotoCombinacion));
    ok('  ...y cada fila puede subir una foto para su combinación exacta',
       combinacionesFoto.length === 2 && combinacionesFoto.includes('Talla: S · Color: Rosa') &&
       combinacionesFoto.includes('Talla: M · Color: Rosa'), combinacionesFoto.join(' / '));
    await p.fill('#filasCombinaciones input.stock >> nth=0', 'tres');
    await p.click('#guardarCombinaciones');
    await quizas(hasta(p, () => !document.querySelector('#avisoCombinaciones').hidden));
    ok('UN NÚMERO QUE NO ES NÚMERO se explica junto a su combinación y no se guarda nada',
       /entero/.test(await p.locator('#filasCombinaciones .error-campo >> nth=0').innerText()) &&
       ((await hojas())['Inventario por variante'] || []).filter(f => f[0] === 'baguette').every(f => f[2] === ''));
    await p.fill('#filasCombinaciones input.stock >> nth=0', '3');
    await p.fill('#filasCombinaciones input.stock >> nth=1', '2');
    await p.click('#guardarCombinaciones');
    await quizas(hasta(p, () => /Guardado/.test(document.querySelector('#avisoCombinaciones').textContent)));
    const filasB = ((await hojas())['Inventario por variante'] || []).filter(f => f[0] === 'baguette');
    ok('GUARDAR escribe cada combinación en la hoja, y el stock del producto pasa a ser la suma',
       filasB.map(f => f[2]).join(',') === '3,2' && Number((await fila('baguette'))[5]) === 5 &&
       (await p.inputValue('#f-stock')) === '5', filasB.map(f => f[1] + '=' + f[2]).join(' · '));
    ok('  ...y el Stock de arriba queda bloqueado: ahora es una suma',
       await p.evaluate(() => document.querySelector('#f-stock').readOnly));
    /* 0.24.0 · EL PRECIO DE CADA COMBINACIÓN (bitácora 110). */
    ok('CADA COMBINACIÓN TIENE SU PRECIO, con el del producto de sugerencia',
       (await p.locator('#filasCombinaciones input.precio').count()) === 2 &&
       (await p.getAttribute('#filasCombinaciones input.precio >> nth=0', 'placeholder')) === (await p.inputValue('#f-precio')));
    await p.fill('#filasCombinaciones input.precio >> nth=0', '45000');
    await p.click('#guardarCombinaciones');
    let filasP = [];
    for (let i = 0; i < 40; i++) {
      filasP = ((await hojas())['Inventario por variante'] || []).filter(f => f[0] === 'baguette');
      if (filasP.length && Number(filasP[0][5]) === 45000) break;
      await new Promise(l => setTimeout(l, 150));
    }
    ok('  ...y se guarda en su fila; la otra queda vacía = el precio del producto',
       Number(filasP[0][5]) === 45000 && filasP[1][5] === '', filasP.map(f => f[1] + '=' + f[5]).join(' · '));
    await p.click('#cancelar');
  }

  // ═══ 10. La sesión que se cae ═══
  await fetch(U + '/__panel?usuario=dona.rosa');          // clave nueva: cierra las sesiones
  await p.click('#lista .fila[data-id="croissant"] button[data-accion="activar"]');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  ok('SI LA SESIÓN SE CIERRA desde la hoja, la página vuelve a pedir entrar y dice por qué',
     /sesión terminó/.test(await texto('#avisoEntrar')) &&
     !(await p.evaluate(() => sessionStorage.getItem('panel-testigo'))),
     await texto('#avisoEntrar'));
  ok('  ...y no se desactivó nada con la sesión muerta', (await fila('croissant'))[9] === 'Sí');

  // ═══ 11. Un panel sin tienda detrás ═══
  const p2 = await b.newPage();
  await p2.goto(U + '/admin.html?sinmaestro=1');
  await p2.waitForSelector('#sinHoja:not([hidden])');
  ok('UN PANEL SIN MAESTRO dice que no está conectado, en vez de un formulario que no puede funcionar',
     (await p2.isVisible('#sinHoja')) && !(await p2.isVisible('#entrar')));
  await p2.close();

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));

  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
