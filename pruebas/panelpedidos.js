/* D-3 — pedidos desde el panel, del lado del maestro.
 * ---------------------------------------------------------------------------
 * «Cambiar el estado desde el panel, con el mismo efecto sobre el inventario
 * que tiene hacerlo en la hoja.» Esta batería se toma esa frase al pie de la
 * letra, y por eso empieza por la hoja: al escribirla apareció que EN LA HOJA
 * el efecto estaba roto. Marcar «Pagado» —el vocabulario de hoy— no contaba en
 * Más vendidos ni en los usos de los cupones, porque ahí sobrevivía la regla
 * vieja `indexOf('confirmado')`. Un cupón con tope de un uso no se agotaba
 * nunca. La sección 1 lo fija, y se verificó ROJA con la regla vieja puesta.
 *
 *   node pruebas/panelpedidos.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const nuevo = () => {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  return g;
};
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-pedidos-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function conSesion() {
  const g = nuevo();
  const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(fila, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k };
}

/* Un pedido como lo registra la tienda: por la puerta pública, sin atajos. */
const registrar = (g, codigo, items, cupon) => j(g.api.doGet({ parameter: {
  a: 'registrar', pedido: codigo, ciudad: 'Bogotá', cupon: cupon || '', envio: 'zona-norte',
  items: items.map(([id, n]) => id + ':' + n).join(','), sub: '0' } }));

const stock = (g, id) => Number(g.filas('Catálogo').find(f => String(f[0]) === id)[5]);
const lineas = (g, codigo) => g.filas('Pedidos').filter(f => String(f[1]) === codigo);

(() => {
  // ═══ 1. En la hoja: «Pagado» tiene que contar ═══
  {
    const g = nuevo();
    // Un cupón con UN solo uso.
    g.hojas.get('Cupones').appendRow(['UNAVEZ', 'porcentaje', 10, 0, '2099-12-31', 1, 0, 'Sí', 'prueba']);
    const filaCupon = g.filas('Cupones').findIndex(f => f[0] === 'UNAVEZ') + 1;
    registrar(g, 'CUP01', [['croissant', 2]], 'UNAVEZ');
    const fila = g.filas('Pedidos').findIndex(f => f[1] === 'CUP01') + 1;
    g.hojas.get('Pedidos').getRange(fila, 4).setValue('Pagado');
    g.api.alEditar({ range: { getSheet: () => g.hojas.get('Pedidos'), getColumn: () => 4, getNumColumns: () => 1 } });

    ok('EN LA HOJA, «Pagado» cuenta en Más vendidos',
       g.filas('Más vendidos').some(f => f[1] === 'croissant' && f[2] === 2),
       JSON.stringify(g.filas('Más vendidos').slice(1)));
    ok('  ...Y EN LOS USOS DEL CUPÓN: con la regla vieja quedaba en 0 y no se agotaba nunca',
       Number(g.filas('Cupones')[filaCupon - 1][6]) === 1,
       'usos confirmados: ' + g.filas('Cupones')[filaCupon - 1][6]);
    const otro = j(g.api.doGet({ parameter: { a: 'validar', items: 'croissant:1', cupon: 'UNAVEZ', envio: 'zona-norte' } }));
    ok('  ...y por eso el segundo comprador ya no puede usarlo',
       otro.cupon && otro.cupon.ok === false && /agotó/.test(otro.cupon.texto),
       JSON.stringify(otro.cupon));
  }

  // ═══ 2. Sin testigo, nada ═══
  {
    const g = nuevo();
    registrar(g, 'SIN01', [['croissant', 1]]);
    const antes = JSON.stringify(g.filas('Pedidos'));
    ok('SIN TESTIGO no se ven los pedidos', !post(g, { a: 'pedidos' }).ok);
    ok('  ...ni se cambia su estado',
       !post(g, { a: 'estado_pedido', op: op(), pedido: 'SIN01', estado: 'pagado', version: 'x' }).ok &&
       JSON.stringify(g.filas('Pedidos')) === antes);
  }

  // ═══ 3. La lista ═══
  {
    const { g, k } = conSesion();
    registrar(g, 'AAA01', [['croissant', 2], ['baguette', 1]]);
    registrar(g, 'BBB02', [['pan-integral', 3]]);
    const r = post(g, { a: 'pedidos', k });
    const aaa = r.pedidos.find(x => x.pedido === 'AAA01');
    ok('UN PEDIDO DE DOS LÍNEAS es UN pedido en el panel, con sus dos líneas',
       r.ok && r.cuantos === 2 && aaa && aaa.lineas.length === 2, r.error || r.cuantos + ' pedidos');
    ok('  ...con su estado, su total y su fecha',
       aaa.estado === 'Nuevo' && aaa.estadoId === 'nuevo' && aaa.total > 0 && /^\d{4}-/.test(aaa.fecha),
       JSON.stringify({ estado: aaa.estado, total: aaa.total, fecha: aaa.fecha }));
    ok('  ...y lo más nuevo primero', r.pedidos[0].fecha >= r.pedidos[r.pedidos.length - 1].fecha);
    ok('  ...y cuántos hay de cada estado, para los filtros', r.conteo.nuevo === 2, JSON.stringify(r.conteo));

    /* LA LISTA DE CAMPOS ES EL CONTRATO. La hoja no guarda nombre, celular ni
       dirección de quien compra —van por WhatsApp—, y el panel no puede
       empezar a sacarlos de ninguna parte. Si mañana aparece un campo nuevo,
       esta aserción se cae y alguien tiene que decidirlo. */
    const CAMPOS = ['cantidad', 'ciudad', 'cupon', 'estado', 'estadoId', 'fecha', 'fechaDespacho',
                    'fechaPago', 'guia', 'id', 'inventario', 'lineas', 'pedido', 'precio', 'problema',
                    'producto', 'subtotal', 'total', 'validacion', 'variante', 'version'];
    const vistos = new Set();
    r.pedidos.forEach(x => { Object.keys(x).forEach(c => vistos.add(c));
                             x.lineas.forEach(l => Object.keys(l).forEach(c => vistos.add(c))); });
    const sobran = [...vistos].filter(c => CAMPOS.indexOf(c) === -1);
    ok('NINGÚN DATO PERSONAL NUEVO: solo salen las columnas que la hoja ya guarda',
       sobran.length === 0, sobran.join(', ') || [...vistos].sort().join(' '));

    ok('FILTRAR por estado', post(g, { a: 'pedidos', k, estado: 'pagado' }).cuantos === 0);
    ok('BUSCAR por número', post(g, { a: 'pedidos', k, q: 'bbb' }).pedidos.map(x => x.pedido).join() === 'BBB02');
  }

  // ═══ 4. Cambiar el estado: el mismo efecto que en la hoja ═══
  {
    const { g, k } = conSesion();
    registrar(g, 'PAG01', [['pan-integral', 6], ['croissant', 1]]);
    const antes = { integral: stock(g, 'pan-integral'), croissant: stock(g, 'croissant') };
    const ped = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'PAG01');

    const r = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'PAG01', estado: 'pagado', version: ped.version });
    ok('PAGADO DESDE EL PANEL descuenta el inventario, igual que en la hoja',
       r.ok && stock(g, 'pan-integral') === antes.integral - 6 && stock(g, 'croissant') === antes.croissant - 1,
       r.error || ('pan-integral ' + antes.integral + ' → ' + stock(g, 'pan-integral')));
    ok('  ...en TODAS las líneas del pedido, que dicen Descontado',
       lineas(g, 'PAG01').every(f => f[3] === 'Pagado' && f[12] === 'Descontado'),
       JSON.stringify(lineas(g, 'PAG01').map(f => [f[3], f[12]])));
    ok('  ...y cuenta en Más vendidos', g.filas('Más vendidos').some(f => f[1] === 'pan-integral'));
    ok('  ...y anota cuándo se pagó', lineas(g, 'PAG01').every(f => f[13] instanceof Date));
    ok('  ...y contesta con el pedido como quedó, versión nueva incluida',
       r.pedido && r.pedido.estadoId === 'pagado' && r.pedido.version !== ped.version);

    /* Repetir no descuenta dos veces: aplicarInventario ya lo sabía, y la
       operación además contesta lo mismo sin hacer nada. Y la fecha de pago
       se pone una vez: se le pone a mano una fecha vieja y se vuelve a marcar
       Pagado; si la función la pisara, se vería. */
    const filaPag = g.filas('Pedidos').findIndex(f => f[1] === 'PAG01') + 1;
    const vieja = new Date('2026-01-15T10:00:00Z');
    g.hojas.get('Pedidos').getRange(filaPag, 14).setValue(vieja);
    const releido = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'PAG01');
    const otra = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'PAG01', estado: 'pagado', version: releido.version });
    ok('MARCAR PAGADO OTRA VEZ no descuenta dos veces',
       otra.ok && stock(g, 'pan-integral') === antes.integral - 6, otra.error || '');
    ok('  ...ni cambia cuándo se pagó',
       g.filas('Pedidos')[filaPag - 1][13].getTime() === vieja.getTime(),
       String(g.filas('Pedidos')[filaPag - 1][13]));

    const desp = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'PAG01', estado: 'despachado',
                           version: otra.pedido.version, guia: 'Servientrega 1234567' });
    ok('DESPACHADO guarda la guía y la fecha, y NO toca el inventario (ya estaba descontado)',
       desp.ok && lineas(g, 'PAG01').every(f => f[15] === 'Servientrega 1234567' && f[14] instanceof Date) &&
       stock(g, 'pan-integral') === antes.integral - 6);

    const canc = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'PAG01', estado: 'cancelado', version: desp.pedido.version });
    ok('CANCELAR un pedido pagado DEVUELVE el inventario, igual que en la hoja',
       canc.ok && stock(g, 'pan-integral') === antes.integral && stock(g, 'croissant') === antes.croissant &&
       lineas(g, 'PAG01').every(f => f[12] === 'Devuelto'),
       'pan-integral ' + stock(g, 'pan-integral'));
  }

  // ═══ 5. Lo que cambió mientras se miraba ═══
  {
    const { g, k } = conSesion();
    registrar(g, 'VER01', [['croissant', 1]]);
    const ped = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'VER01');
    // Mientras el panel lo tenía abierto, alguien lo marcó Cancelado en la hoja.
    const fila = g.filas('Pedidos').findIndex(f => f[1] === 'VER01') + 1;
    g.hojas.get('Pedidos').getRange(fila, 4).setValue('Cancelado');
    const r = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'VER01', estado: 'pagado', version: ped.version });
    ok('SI ALGUIEN LO CAMBIÓ EN LA HOJA mientras el panel lo tenía abierto, no se pisa',
       !r.ok && r.cambiado && lineas(g, 'VER01')[0][3] === 'Cancelado', r.error);
  }

  // ═══ 6. Un estado que la hoja no entiende ═══
  {
    const { g, k } = conSesion();
    registrar(g, 'ERR01', [['croissant', 1]]);
    const fila = g.filas('Pedidos').findIndex(f => f[1] === 'ERR01') + 1;
    g.hojas.get('Pedidos').getRange(fila, 4).setValue('pagadito');
    const ped = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'ERR01');
    ok('UN ESTADO CON ERRATA se enseña tal cual y marcado, no como «Nuevo»',
       ped.estado === 'pagadito' && ped.estadoId === '' && /no se reconoce/.test(ped.problema), ped.problema);
    ok('  ...y cuenta aparte, en «revisar»', post(g, { a: 'pedidos', k }).conteo.revisar === 1);
    const r = post(g, { a: 'estado_pedido', k, op: op(), pedido: 'ERR01', estado: 'pagado', version: ped.version });
    ok('  ...y desde el panel se arregla eligiendo el estado bueno',
       r.ok && lineas(g, 'ERR01')[0][3] === 'Pagado' && lineas(g, 'ERR01')[0][12] === 'Descontado');
  }

  // ═══ 7. Lo que no existe ═══
  {
    const { g, k } = conSesion();
    registrar(g, 'NOX01', [['croissant', 1]]);
    const ped = post(g, { a: 'pedidos', k }).pedidos[0];
    ok('UN ESTADO QUE NO EXISTE no se escribe',
       !post(g, { a: 'estado_pedido', k, op: op(), pedido: 'NOX01', estado: 'regalado', version: ped.version }).ok &&
       lineas(g, 'NOX01')[0][3] === 'Nuevo');
    ok('  ...ni un pedido que no existe',
       !post(g, { a: 'estado_pedido', k, op: op(), pedido: 'ZZZ99', estado: 'pagado', version: ped.version }).ok);
    ok('  ...y todo lo escrito, con la llave tomada',
       g.escrituras.filter(e => e.hoja === 'Pedidos' && e.como === 'setValue').every(e => e.conLlave));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
