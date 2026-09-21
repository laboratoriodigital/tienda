/* D-6 — el registro de cambios.
 * ---------------------------------------------------------------------------
 * «Yo no borré eso.» Hasta ahora nadie podía contestarlo sin adivinar. La
 * pestaña Registro lo contesta: cada escritura —desde el panel, desde la hoja
 * a mano, desde Bold— deja una fila con cuándo, desde dónde, quién, qué, dónde,
 * y cómo estaba antes y cómo quedó.
 *
 * Lo que se prueba, además de que la fila exista:
 *   · LO QUE NO SE HIZO NO SE ANOTA. Un guardado que no valida, o la misma
 *     operación repetida, no deja filas: un registro con ruido no lo lee nadie.
 *   · EL «ANTES» ES EL DE VERDAD. Una edición anota solo lo que cambió, con el
 *     valor viejo al lado del nuevo.
 *   · TOCAR EL REGISTRO TAMBIÉN QUEDA ESCRITO. Apps Script no deja cerrar una
 *     pestaña a su dueño; lo que sí puede es dejar huella.
 *
 *   node pruebas/registro.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-registro-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function conSesion() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k };
}
const registro = g => (g.filas('Registro') || []).slice(1);
const ultima = g => registro(g).slice(-1)[0] || [];

/* Un evento de edición como el que manda la hoja: con A1, valor viejo y nuevo. */
function editar(g, hojaNombre, fila, col, valor, extra) {
  const h = g.hojas.get(hojaNombre);
  const viejo = h.getRange(fila, col).getValue();
  h.getRange(fila, col).setValue(valor);
  const letra = String.fromCharCode(64 + col);
  g.api.alEditar(Object.assign({
    range: { getSheet: () => h, getColumn: () => col, getNumColumns: () => 1, getNumRows: () => 1,
             getRow: () => fila, getA1Notation: () => letra + fila },
    oldValue: viejo, value: valor, user: { getEmail: () => 'dona.rosa@example.com' }
  }, extra || {}));
}

(() => {
  // ═══ 1. La pestaña existe desde instalar(), vacía ═══
  {
    const { g } = conSesion();
    ok('INSTALAR crea la pestaña Registro con sus columnas',
       (g.filas('Registro') || [])[0] && g.filas('Registro')[0].join('|') ===
       'Fecha|Desde|Quién|Qué se hizo|Dónde|Antes|Después');
  }

  // ═══ 2. Desde el panel ═══
  {
    const { g, k } = conSesion();
    const lista = post(g, { a: 'productos', k }).productos;
    const c = lista.find(p => p.id === 'croissant');
    const n0 = registro(g).length;

    post(g, { a: 'guardar_producto', k, op: op(), version: c.version,
              producto: Object.assign({}, c, { precio: '7000', stock: '38' }) });
    let r = ultima(g);
    ok('EDITAR UN PRODUCTO deja una fila: desde el panel, quién, y dónde',
       registro(g).length === n0 + 1 && r[1] === 'Panel' && r[2] === 'dona.rosa' &&
       r[3] === 'Editó el producto' && r[4] === 'Catálogo · croissant', r.slice(1, 5).join(' | '));
    ok('  ...con SOLO lo que cambió, y el antes al lado del después',
       r[5] === 'Precio: 6500 · Stock: 40' && r[6] === 'Precio: 7000 · Stock: 38', r[5] + ' → ' + r[6]);

    const n1 = registro(g).length;
    post(g, { a: 'guardar_producto', k, op: op(), version: 'vieja',
              producto: Object.assign({}, c, { precio: '1' }) });
    post(g, { a: 'guardar_producto', k, op: op(), version: c.version,
              producto: Object.assign({}, c, { precio: 'gratis' }) });
    ok('LO QUE NO SE HIZO NO SE ANOTA: ni lo rechazado, ni lo que cambió entre medias',
       registro(g).length === n1);

    const mismo = op();
    const act = post(g, { a: 'productos', k }).productos.find(p => p.id === 'galletas-avena');
    post(g, { a: 'activar_producto', k, op: mismo, id: act.id, activo: false });
    post(g, { a: 'activar_producto', k, op: mismo, id: act.id, activo: false });
    ok('LA MISMA OPERACIÓN DOS VECES deja UNA fila', registro(g).length === n1 + 1 &&
       ultima(g)[3] === 'Desactivó el producto' && ultima(g)[5] === 'Activo: Sí' && ultima(g)[6] === 'Activo: No');

    post(g, { a: 'guardar_producto', k, op: op(), nuevo: true, producto: {
      id: 'pan-de-bono', nombre: 'Pan de bono', formato: 'Unidad', categoria: 'Panes', precio: '2500',
      stock: '30', descripcion: '', imagenes: '', destacado: false, activo: true } });
    ok('CREAR deja «Creó el producto» con lo esencial', ultima(g)[3] === 'Creó el producto' &&
       /Pan de bono · \$2500 · Stock 30/.test(ultima(g)[6]), ultima(g)[6]);

    const cafe = post(g, { a: 'productos', k }).productos.find(p => p.id === 'cafe-grano');
    post(g, { a: 'borrar_producto', k, op: op(), id: 'cafe-grano', version: cafe.version });
    ok('BORRAR dice a dónde fue y qué había', /Papelera/.test(ultima(g)[3]) && /Café/.test(ultima(g)[5]),
       ultima(g)[3] + ' | ' + ultima(g)[5]);

    j(g.api.doGet({ parameter: { a: 'registrar', pedido: 'REG01', ciudad: 'Cali', cupon: '',
                                 envio: 'zona-norte', items: 'croissant:1', sub: '0' } }));
    const ped = post(g, { a: 'pedidos', k }).pedidos.find(x => x.pedido === 'REG01');
    post(g, { a: 'estado_pedido', k, op: op(), pedido: 'REG01', estado: 'pagado', version: ped.version });
    ok('CAMBIAR EL ESTADO DE UN PEDIDO dice de cuál a cuál, y si movió inventario',
       ultima(g)[4] === 'Pedidos · #REG01' && ultima(g)[5] === 'Nuevo' && /Pagado · inventario ajustado/.test(ultima(g)[6]),
       ultima(g).slice(4).join(' | '));

    const cfg = post(g, { a: 'configuracion', k }).claves;
    const v = c2 => cfg.find(x => x.clave === c2).version;
    const n2 = registro(g).length;
    post(g, { a: 'guardar_configuracion', k, op: op(),
              cambios: { portada_titulo: 'Pan de verdad', horario: 'Lunes a sábado' },
              versiones: { portada_titulo: v('portada_titulo'), horario: v('horario') } });
    const dos = registro(g).slice(n2);
    ok('LA CONFIGURACIÓN deja una fila por clave, con el valor de antes',
       dos.length === 2 && dos.some(r2 => r2[4] === 'Configuración · portada_titulo' && r2[6] === 'Pan de verdad') &&
       dos.some(r2 => r2[4] === 'Configuración · horario' && r2[5] === ''), JSON.stringify(dos.map(x => x.slice(4))));

    /* Las filas del registro (setValues); el encabezado lo pone instalar() y
       no es de ninguna operación. Seis operaciones, seis escrituras. */
    const esc = g.escrituras.filter(e => e.hoja === 'Registro' && e.como === 'setValues');
    ok('TODO lo del panel se anotó bajo la llave de la operación',
       esc.length === 6 && esc.every(e => e.conLlave), esc.map(e => e.como + ':' + e.conLlave).join(' '));
  }

  // ═══ 3. Desde la hoja, a mano ═══
  {
    const { g } = conSesion();
    const fila = g.filas('Catálogo').findIndex(f => f[0] === 'baguette') + 1;
    const precioAntes = String(g.filas('Catálogo')[fila - 1][4]);
    editar(g, 'Catálogo', fila, 5, 9900);
    const r = ultima(g);
    ok('EDITAR UNA CELDA A MANO deja fila: desde la hoja, quién, qué celda y de qué producto',
       r[1] === 'Hoja' && r[2] === 'dona.rosa@example.com' && r[4] === 'Catálogo E' + fila + ' · baguette',
       r.slice(1, 5).join(' | '));
    ok('  ...con el valor de antes y el de después', String(r[5]) === precioAntes && String(r[6]) === '9900',
       r[5] + ' → ' + r[6]);

    const n = registro(g).length;
    editar(g, 'Más vendidos', 2, 1, 'x');
    ok('LO QUE ESCRIBE EL SCRIPT (Más vendidos) no se anota: se recalcula', registro(g).length === n);

    editar(g, 'Registro', 2, 7, 'yo no fui');
    ok('Y EDITAR EL REGISTRO A MANO queda escrito en el propio registro',
       ultima(g)[3] === 'EDITÓ EL REGISTRO A MANO' && ultima(g)[6] === 'yo no fui');
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
