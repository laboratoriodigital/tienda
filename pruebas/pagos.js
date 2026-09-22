/* M3.5 — cobrar en línea con Bold, del lado del maestro.
 * ---------------------------------------------------------------------------
 * Bold es de mentira, pero contesta lo que contesta el de verdad
 * (GET /v2/payment-voucher/<referencia> → payment_status). Lo que se prueba
 * son las formas de perder plata o de venderle a dos la misma unidad:
 *
 *   · COBRAR UN TOTAL QUE NO CALCULÓ EL MAESTRO. La firma se recalcula aquí,
 *     con la fórmula de Bold, y tiene que coincidir con la del maestro.
 *   · LA MISMA UNIDAD A DOS COMPRADORES. El primero aparta; el segundo se
 *     entera ANTES de pagar; si el primero no paga, el segundo puede.
 *   · CREERLE A QUIEN NO SE DEBE. Nada queda pagado sin que Bold lo diga, y
 *     un monto distinto no es una venta.
 *   · CONTAR DOS VECES. Preguntar otra vez no crea otro pedido, no descuenta
 *     otra vez, no manda otro correo.
 *   · QUEDARSE SIN VENDER. Una pasarela a medio configurar deja la tienda en
 *     WhatsApp, no muda.
 *
 *   node pruebas/pagos.js
 */
const crypto = require('crypto');
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const get = (g, o) => j(g.api.doGet({ parameter: o }));
let seq = 0;
const op = () => 'op-pago-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

const IDENTIDAD = 'identidad-de-pruebas-123';
const SECRETA = 'secreta-de-pruebas-456';
const ENTREGA = { nombre: 'Ana Pérez', tel: '300 123 4567', correo: 'ana@example.com',
                  ciudad: 'Bogotá', direccion: 'Calle 1 # 2-3', notas: 'Portería' };

function tienda(o) {
  o = o || {};
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const poner = (clave, v) => {
    const f = g.filas('Configuración').findIndex(x => String(x[0]) === clave) + 1;
    g.hojas.get('Configuración').getRange(f, 2).setValue(v);
  };
  poner('sitio_url', 'https://mitienda.example');
  poner('correo_resumen', 'dueña@example.com');
  if (o.modo !== undefined) poner('cobro_modo', o.modo);
  if (o.ambiente !== undefined) poner('cobro_ambiente', o.ambiente);
  if (o.llaves !== false) {
    g.props.BOLD_IDENTIDAD_SANDBOX = IDENTIDAD;
    g.props.BOLD_SECRETA_SANDBOX = SECRETA;
  }
  /* Bold, de mentira: contesta por referencia lo que diga `bold`. */
  const bold = { estados: {}, consultas: [], caido: false };
  g.responder('payments.api.bold.co/v2/payment-voucher/', (url, op) => {
    const ref = decodeURIComponent(url.split('/payment-voucher/')[1]);
    bold.consultas.push({ ref, auth: (op.headers || {}).Authorization });
    if (bold.caido) return { codigo: 500, cuerpo: 'caído' };
    const e = bold.estados[ref];
    if (!e) return { codigo: 404, cuerpo: { payment_status: 'NO_TRANSACTION_FOUND' } };
    return { cuerpo: Object.assign({ transaction_id: 'TX-' + ref, payment_method: 'PSE' }, e) };
  });
  return { g, bold, poner };
}

const stock = (g, id) => Number(g.filas('Catálogo').find(f => f[0] === id)[5]);
const ponerStock = (g, id, n) => {
  const f = g.filas('Catálogo').findIndex(x => x[0] === id) + 1;
  g.hojas.get('Catálogo').getRange(f, 6).setValue(n);
};
const cobros = g => JSON.parse(g.props.COBROS_ABIERTOS || '{}');
const vencerApartado = (g, pedido, cuanto) => {
  const m = cobros(g);
  if (!m[pedido]) return;                      // ya se cerró: la aserción que sigue lo dirá
  m[pedido].h = Date.now() - 1000;
  if (cuanto === 'todo') m[pedido].c = Date.now() - 1000;
  g.props.COBROS_ABIERTOS = JSON.stringify(m);
};
const sinEspera = (g, pedido) => {             // que la próxima pregunta vaya a Bold
  const m = cobros(g); if (m[pedido]) { m[pedido].u = 0; g.props.COBROS_ABIERTOS = JSON.stringify(m); }
};
const pagos = g => (g.filas('Pagos') || []).slice(1);          // sin el encabezado
const pedidosDe = (g, codigo) => (g.filas('Pedidos') || []).filter(f => String(f[1]) === codigo);
const crearCobro = (g, extra) => post(g, Object.assign({ a: 'pago_crear', op: op(), items: 'croissant:2',
  envio: 'zona-norte', cupon: '', sub: '13000', entrega: ENTREGA }, extra || {}));
const conciliador = g => g.triggers.filter(t => t.getHandlerFunction() === 'conciliarPagos').length;

(() => {
  // ═══ 1. De fábrica: WhatsApp, como siempre ═══
  {
    const { g } = tienda({ llaves: false });
    const cfg = get(g, { a: 'catalogo' }).config;
    ok('DE FÁBRICA la tienda vende por WhatsApp', cfg.cobro === 'whatsapp', cfg.cobro);
    const r = crearCobro(g);
    ok('  ...y pedir un cobro contesta «sigue por WhatsApp», sin apartar nada',
       !r.ok && r.cobro === 'whatsapp' && !pagos(g).length && !g.props.COBROS_ABIERTOS, r.error);
  }

  // ═══ 2. Pasarela pedida pero no lista: NO se queda muda ═══
  {
    const { g, poner } = tienda({ modo: 'Pasarela', llaves: false });
    poner('pago_llave', '');
    const cfg = get(g, { a: 'catalogo' }).config;
    ok('PASARELA SIN LLAVES DE BOLD publica WhatsApp: la tienda no pierde ventas', cfg.cobro === 'whatsapp');
    const alta = g.api.revisarTienda();
    ok('  ...y el diagnóstico dice por qué',
       alta.avisan.some(x => x.clave === 'cobro_modo'), JSON.stringify(alta.avisan.map(x => x.clave)));
    ok('  ...y la llave Bre-B sigue haciendo falta, porque se sigue cobrando por WhatsApp',
       alta.bloquean.some(x => x.clave === 'pago_llave'));

    const { g: g2 } = tienda({ modo: 'tal vez', llaves: true });
    ok('UN MODO QUE NO SE ENTIENDE no se adivina: WhatsApp', get(g2, { a: 'catalogo' }).config.cobro === 'whatsapp');
    const { g: g3 } = tienda({ modo: 'Pasarela', ambiente: 'mañana', llaves: true });
    ok('  ...y un AMBIENTE que no se entiende tampoco — confundir pruebas con producción es cobrar sin saberlo',
       get(g3, { a: 'catalogo' }).config.cobro === 'whatsapp');
  }

  // ═══ 3. Pasarela lista ═══
  {
    const { g } = tienda({ modo: 'Pasarela' });
    const cat = get(g, { a: 'catalogo' });
    ok('CON LAS LLAVES la tienda publica «pasarela», y que está en pruebas',
       cat.config.cobro === 'pasarela' && cat.config.cobro_pruebas === 'Sí');
    const texto = JSON.stringify(cat);
    ok('  ...y ninguna llave sale por el catálogo', texto.indexOf(SECRETA) === -1 && texto.indexOf(IDENTIDAD) === -1);
    ok('  ...y el diagnóstico avisa que está en PRUEBAS',
       g.api.revisarTienda().avisan.some(x => x.clave === 'cobro_ambiente'));
    ok('  ...y ya no exige la llave Bre-B', !g.api.revisarTienda().bloquean.some(x => x.clave === 'pago_llave'));
    ok('CREAR UN COBRO NO SE PUEDE POR GET: lleva datos personales',
       !get(g, { a: 'pago_crear', items: 'croissant:1' }).ok && !pagos(g).length);
  }

  // ═══ 4. Crear el cobro ═══
  {
    const { g } = tienda({ modo: 'Pasarela' });
    const antes = g.escrituras.length;
    const r = crearCobro(g, { sub: '1' });                     // la página «dice» $1
    const k = r.checkout || {};
    ok('PAGAR prepara un cobro', r.ok && /^[A-Z0-9]{8}$/.test(r.pedido) && /^pg[0-9a-f]{32}$/.test(r.token),
       r.error || '');
    ok('  ...por el total que calculó el MAESTRO, no el de la página',
       r.total === 19000 && k.amount === '19000', r.total + ' / ' + k.amount);
    const firma = crypto.createHash('sha256').update(r.pedido + '19000' + 'COP' + SECRETA).digest('hex');
    ok('  ...firmado con la fórmula de Bold (referencia + monto + moneda + secreta)',
       k.integritySignature === firma && k.orderId === r.pedido && k.currency === 'COP' && k.apiKey === IDENTIDAD);
    ok('  ...sin la llave secreta en la respuesta', JSON.stringify(r).indexOf(SECRETA) === -1);
    ok('  ...y Bold devuelve al comprador A ESTA TIENDA, con el token del cobro',
       k.redirectionUrl === 'https://mitienda.example/?pago=' + r.token, k.redirectionUrl);
    const fila = pagos(g)[0] || [];
    ok('EL LIBRO DE PAGOS tiene el cobro esperando', pagos(g).length === 1 && fila[1] === r.pedido &&
       fila[4] === 'Esperando pago' && fila[3] === 'Pruebas' && Number(fila[8]) === 19000, fila.slice(0, 9).join(' | '));
    const ent = (g.filas('Datos de entrega') || [])[1] || [];
    ok('  ...los datos de entrega, en su pestaña y con el mismo número',
       ent[1] === r.pedido && ent[2] === 'Ana Pérez' && ent[6] === 'Calle 1 # 2-3');
    const acta = (g.filas('Validaciones') || []).find(f => f[1] === r.pedido) || [];
    ok('  ...y el acta, con el mismo número y la discrepancia de la página',
       /\$1 y la hoja calcula/.test(String(acta[5])), String(acta[5]));
    ok('  ...y todavía NO hay pedido: sin pago no hay venta', !pedidosDe(g, r.pedido).length);
    const nuevas = g.escrituras.slice(antes).filter(e => ['Pagos', 'Datos de entrega', 'Validaciones'].indexOf(e.hoja) !== -1);
    ok('  ...todo escrito bajo llave — también el acta, que antes soltaba la llave al terminar',
       nuevas.length >= 3 && nuevas.every(e => e.conLlave), nuevas.map(e => e.hoja + ':' + e.conLlave).join(' '));
    ok('  ...y se programó la revisión de pagos cada pocos minutos', conciliador(g) === 1);

    const mismo = op();
    const a = crearCobro(g, { op: mismo }), b = crearCobro(g, { op: mismo });
    ok('UN DOBLE TOQUE es el mismo cobro: una fila, un apartado', a.pedido === b.pedido && b.repetida &&
       pagos(g).length === 2 && Object.keys(cobros(g)).length === 2);
  }

  // ═══ 5. Lo que no se cobra ═══
  {
    const { g } = tienda({ modo: 'Pasarela' });
    let r = crearCobro(g, { entrega: Object.assign({}, ENTREGA, { correo: 'sin-arroba' }) });
    ok('SIN CORREO no se cobra —ahí llega la confirmación—, y no se aparta nada',
       !r.ok && /correo/.test(r.error) && !g.props.COBROS_ABIERTOS, r.error);
    r = crearCobro(g, { envio: 'no-existe' });
    ok('UN ENVÍO QUE NO SE RECONOCE no se cobra en línea: se manda a WhatsApp',
       !r.ok && r.cobro === 'whatsapp' && !g.props.COBROS_ABIERTOS, r.error);
    r = crearCobro(g, { items: 'croissant:999' });
    ok('MÁS DE LO QUE HAY no se cobra recortado a escondidas: se dice',
       !r.ok && r.recortado && /solo quedan/.test(r.error), r.error);
  }

  // ═══ 6. E-1 · La última unidad, dos compradores ═══
  {
    const { g } = tienda({ modo: 'Pasarela' });
    ponerStock(g, 'croissant', 2);
    const a = crearCobro(g, { items: 'croissant:2' });
    const v = get(g, { a: 'validar', items: 'croissant:1', envio: 'zona-norte' });
    ok('EL SEGUNDO COMPRADOR se entera ANTES de pagar, y sabe que es porque otro está pagando',
       a.ok && !v.ok && /est[áa] pagando otra persona/.test(v.error) && (v.avisos || []).length === 1,
       v.error);
    const b = crearCobro(g, { items: 'croissant:1' });
    ok('  ...y no puede apartar la misma unidad', !b.ok && b.recortado);
    vencerApartado(g, a.pedido);
    const c = crearCobro(g, { items: 'croissant:1' });
    ok('  ...y si el primero no paga a tiempo, el apartado vence y el segundo puede', c.ok, c.error || '');
    ok('  ...sin que nadie limpie nada: lo vencido se ignora al leer', ponerStock && Object.keys(cobros(g)).length === 2);
  }

  // ═══ 7. Aprobado ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const s0 = stock(g, 'croissant');
    const r = crearCobro(g);
    let e = get(g, { a: 'pago_estado', token: r.token });
    ok('RECIÉN CREADO, Bold todavía no sabe nada y eso NO es un rechazo', e.ok && e.estado === 'esperando', e.estado);
    ok('  ...y la pregunta a Bold lleva la llave de identidad, por la referencia',
       bold.consultas.length === 1 && bold.consultas[0].ref === r.pedido &&
       bold.consultas[0].auth === 'x-api-key ' + IDENTIDAD, JSON.stringify(bold.consultas[0]));
    get(g, { a: 'pago_estado', token: r.token });
    ok('  ...y preguntar otra vez enseguida NO vuelve a molestar a Bold', bold.consultas.length === 1);

    bold.estados[r.pedido] = { payment_status: 'APPROVED', total: 19000 };
    sinEspera(g, r.pedido);
    e = get(g, { a: 'pago_estado', token: r.token });
    const lineas = pedidosDe(g, r.pedido);
    ok('APROBADO: el pedido entra a Pedidos ya Pagado', e.estado === 'pagado' && lineas.length === 1 &&
       lineas[0][3] === 'Pagado', e.estado + ' · ' + lineas.length);
    ok('  ...con la fecha de pago, el proveedor y la transacción',
       lineas[0][13] instanceof Date && lineas[0][17] === 'Bold (pruebas)' && lineas[0][18] === r.pedido &&
       lineas[0][19] === 'TX-' + r.pedido, lineas[0].slice(13).join(' | '));
    ok('  ...y el inventario baja lo que se vendió, por el mismo camino que marcar Pagado a mano',
       stock(g, 'croissant') === s0 - 2 && /Descontado/.test(lineas[0][12]), s0 + ' → ' + stock(g, 'croissant'));
    ok('  ...y el apartado se suelta: no se cuenta dos veces lo que ya salió del stock',
       !g.props.COBROS_ABIERTOS);
    const correos = g.correos.filter(c => /pedido/.test(c.subject));
    ok('  ...con un correo al comprador y otro al comercio',
       correos.length === 2 && correos.some(c => c.to === 'ana@example.com') &&
       correos.some(c => /dueña@example\.com/.test(c.to) && /Calle 1 # 2-3/.test(c.htmlBody)),
       correos.map(c => c.to + ' «' + c.subject + '»').join(' / '));
    ok('  ...y en pruebas los dos lo DICEN en el asunto', correos.every(c => /PRUEBA/.test(c.subject)));

    for (let i = 0; i < 3; i++) { sinEspera(g, r.pedido); get(g, { a: 'pago_estado', token: r.token }); }
    g.api.conciliarPagos();
    ok('PREGUNTAR OTRA VEZ no crea otro pedido, no descuenta otra vez, no manda otro correo',
       pedidosDe(g, r.pedido).length === 1 && stock(g, 'croissant') === s0 - 2 &&
       g.correos.filter(c => /pedido/.test(c.subject)).length === 2);
    ok('  ...y sin cobros abiertos, la revisión cada pocos minutos se borra sola', conciliador(g) === 0);
    const p = post(g, { a: 'pedidos', k: (() => { const f = g.filas('Configuración').findIndex(x => x[0] === 'panel_usuario') + 1;
      g.hojas.get('Configuración').getRange(f, 2).setValue('dona'); const cl = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
      return post(g, { a: 'entrar', u: 'dona', c: cl }).testigo; })() }).pedidos.find(x => x.pedido === r.pedido);
    ok('EL PANEL muestra con qué se cobró', p && p.pago === 'Bold (pruebas)' && p.transaccion === 'TX-' + r.pedido);
  }

  // ═══ 8. E-4 · Un monto distinto no es una venta ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const r = crearCobro(g);
    bold.estados[r.pedido] = { payment_status: 'APPROVED', total: 1000 };
    const e = get(g, { a: 'pago_estado', token: r.token });
    ok('APROBADO POR OTRO MONTO no se da por pagado: queda para el comerciante',
       e.estado === 'revisar' && !pedidosDe(g, r.pedido).length && pagos(g)[0][4] === 'Revisar monto', e.estado);
    ok('  ...con los dos números en Errores',
       g.filas('Errores').some(f => /monto distinto/.test(f[1]) && /1\.000/.test(f[2]) && /19\.000/.test(f[2])));
  }

  // ═══ 9. Rechazado ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    ponerStock(g, 'croissant', 2);
    const r = crearCobro(g);
    bold.estados[r.pedido] = { payment_status: 'REJECTED', total: 19000 };
    const e = get(g, { a: 'pago_estado', token: r.token });
    const v = get(g, { a: 'validar', items: 'croissant:2', envio: 'zona-norte' });
    ok('RECHAZADO: no hay pedido y las unidades vuelven a estar disponibles al instante',
       e.estado === 'rechazado' && !pedidosDe(g, r.pedido).length && v.items.length === 1 && v.items[0].cantidad === 2);
  }

  // ═══ 10. E-5 · PSE pendiente, y lo que vence ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const r = crearCobro(g);
    vencerApartado(g, r.pedido);
    bold.estados[r.pedido] = { payment_status: 'PENDING', total: 19000 };
    g.api.conciliarPagos();
    ok('PSE PENDIENTE: el apartado se sostiene mientras el banco diga que está en curso',
       Number(cobros(g)[r.pedido].h) > Date.now() + 10 * 60000);

    const { g: g2 } = tienda({ modo: 'Pasarela' });
    const r2 = crearCobro(g2);
    vencerApartado(g2, r2.pedido);
    g2.api.conciliarPagos();
    ok('SIN PAGO Y CON EL APARTADO VENCIDO se sigue preguntando —el comprador puede estar pagando tarde—',
       !!cobros(g2)[r2.pedido] && get(g2, { a: 'pago_estado', token: r2.token }).estado === 'esperando');
    vencerApartado(g2, r2.pedido, 'todo');
    sinEspera(g2, r2.pedido);
    const e2 = get(g2, { a: 'pago_estado', token: r2.token });
    ok('  ...hasta el plazo en que Bold deja consultar: ahí se da por vencido y se cierra',
       e2.estado === 'vencido' && !g2.props.COBROS_ABIERTOS, e2.estado);
  }

  // ═══ 11. E-5 · Aprobado tarde y sin existencias ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    ponerStock(g, 'croissant', 2);
    const r = crearCobro(g);
    vencerApartado(g, r.pedido);
    ponerStock(g, 'croissant', 0);                 // mientras tanto se vendió por otro lado
    bold.estados[r.pedido] = { payment_status: 'APPROVED', total: 19000 };
    const e = get(g, { a: 'pago_estado', token: r.token });
    ok('APROBADO TARDE Y SIN UNIDADES: la plata ya entró, así que el pedido se registra',
       e.estado === 'pagado' && pedidosDe(g, r.pedido).length === 1);
    ok('  ...pero el libro lo dice con nombre propio', pagos(g)[0][4] === 'Pagado sin existencias', pagos(g)[0][4]);
    ok('  ...y el comercio recibe el aviso de que tiene que conseguir o devolver',
       g.correos.some(c => /SIN EXISTENCIAS/.test(c.subject) && /devuelve el dinero/.test(c.htmlBody)) &&
       g.filas('Errores').some(f => /sin existencias/.test(f[1])));
  }

  // ═══ 12. Lo que falla alrededor ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const r = crearCobro(g);
    bold.caido = true;
    const e = get(g, { a: 'pago_estado', token: r.token });
    ok('BOLD CAÍDO: el cobro sigue esperando, nada se inventa, y queda anotado por qué',
       e.ok && e.estado === 'esperando' && /500/.test(pagos(g)[0][20]), String(pagos(g)[0][20]));

    const { g: g2, bold: b2 } = tienda({ modo: 'Pasarela' });
    const r2 = crearCobro(g2);
    g2.sinCuota();
    b2.estados[r2.pedido] = { payment_status: 'APPROVED', total: 19000 };
    get(g2, { a: 'pago_estado', token: r2.token });
    ok('SIN CUOTA DE CORREO la venta se registra igual y los correos quedan pendientes',
       pedidosDe(g2, r2.pedido).length === 1 && !!cobros(g2)[r2.pedido] && !g2.correos.length);
    ok('  ...sin volver a preguntarle a Bold ni volver a descontar', (() => {
      const antes = b2.consultas.length; sinEspera(g2, r2.pedido); g2.api.conciliarPagos();
      return b2.consultas.length === antes && pedidosDe(g2, r2.pedido).length === 1;
    })());

    ok('UN TOKEN INVENTADO no encuentra nada', !get(g, { a: 'pago_estado', token: 'pg' + '0'.repeat(32) }).ok &&
       !get(g, { a: 'pago_estado', token: '<script>' }).ok);
    const pub = JSON.stringify(get(g, { a: 'pago_estado', token: r.token }));
    ok('  ...y el estado de un pago no dice nada del comprador', pub.indexOf('Ana') === -1 && pub.indexOf('Calle') === -1);
  }

  // ═══ 13. Producción usa SUS llaves ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela', ambiente: 'Producción', llaves: false });
    ok('EN PRODUCCIÓN, las llaves de pruebas no sirven', get(g, { a: 'catalogo' }).config.cobro === 'whatsapp');
    g.props.BOLD_IDENTIDAD_PRODUCCION = 'id-real'; g.props.BOLD_SECRETA_PRODUCCION = 'sec-real';
    const r = crearCobro(g);
    get(g, { a: 'pago_estado', token: r.token });
    ok('  ...y con las suyas cobra, sin decir «pruebas» y consultando con la identidad real',
       r.ok && !r.pruebas && r.checkout.apiKey === 'id-real' &&
       r.checkout.integritySignature === crypto.createHash('sha256').update(r.pedido + '19000COPsec-real').digest('hex') &&
       bold.consultas[0].auth === 'x-api-key id-real');
  }

  // ═══ 14. La red de seguridad de cada hora ═══
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const r = crearCobro(g);
    bold.estados[r.pedido] = { payment_status: 'APPROVED', total: 19000 };
    g.api.revisionHoraria();
    ok('LA REVISIÓN DE CADA HORA también concilia, por si el disparador de minutos no existe',
       pedidosDe(g, r.pedido).length === 1);
    ok('  ...y es la que instala instalar(), no la vieja',
       g.triggers.some(t => t.getHandlerFunction() === 'revisionHoraria') &&
       !g.triggers.some(t => t.getHandlerFunction() === 'recalcularResumen'));
  }

  // ═══ 0.12.0 · El rastreo de un pedido cobrado en línea ═══
  /* En la 0.10.0 el secreto nacía en el navegador y se perdía si Bold devolvía
     al comprador a otra pestaña u otro navegador (lo que pasó en la prueba del
     dueño: Brave falló y siguió en Chrome). Ahora lo pone el maestro. */
  {
    const { g, bold } = tienda({ modo: 'Pasarela' });
    const r = crearCobro(g);
    ok('EL COBRO TRAE EL SECRETO DEL RASTREO, puesto por el maestro', r.ok && /^[A-Za-z0-9]{16}$/.test(r.seguimiento || ''), r.seguimiento);
    bold.estados[r.pedido] = { payment_status: 'APPROVED', total: 19000 };
    sinEspera(g, r.pedido);
    const e = get(g, { a: 'pago_estado', token: r.token });
    ok('  ...y pago_estado lo devuelve al aprobarse, sin depender del navegador', e.estado === 'pagado' && e.seguimiento === r.seguimiento);
    const s = post(g, { a: 'seguimiento', n: r.pedido, s: e.seguimiento });
    ok('  ...y ese enlace abre el pedido pagado', s.ok && s.estado.id === 'pagado' && s.pagoEnLinea, JSON.stringify(s).slice(0, 80));
    const alComprador = g.correos.find(c => c.to === ENTREGA.correo) || {};
    ok('  ...y va también en el correo al comprador',
       (alComprador.htmlBody || '').replace(/&amp;/g, '&').indexOf('/pedido.html?n=' + r.pedido + '&s=' + r.seguimiento) !== -1);
    const reg = (g.filas('Registro') || []).find(f => f[3] === 'Pago en línea aprobado') || [];
    ok('EL REGISTRO DICE QUIÉN: la pasarela, con la transacción', /Pasarela Bold · TX-/.test(String(reg[2])), String(reg[2]));
    const otro = crearCobro(g);
    ok('  ...y cada pedido tiene el suyo', otro.seguimiento && otro.seguimiento !== r.seguimiento);
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
