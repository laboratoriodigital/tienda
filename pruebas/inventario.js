/* C-1b — el inventario por combinación, del lado del maestro.
 * ---------------------------------------------------------------------------
 * «Al vender una camiseta básica rosa talla M se descuenta esa, y no todas
 * las básicas.» Lo que se prueba, por orden de lo que cuesta romperlo:
 *
 *   · NADA CAMBIA HASTA QUE ALGUIEN LLENE UN NÚMERO. Generar las filas no
 *     agota la tienda; un producto con Variantes y sin stock escrito por
 *     combinación se vende exactamente como antes.
 *   · CADA COMBINACIÓN COMPITE POR LO SUYO. Es lo contrario de lo que C-1
 *     hacía a propósito, y por eso la aserción de C-1 se invierte aquí (en
 *     variantes.js sigue valiendo para los productos sin filas).
 *   · PAGADO DESCUENTA ESA FILA Y SOLO ESA; Cancelado la devuelve a la misma.
 *   · LO QUE YA NO CASA NO SE BORRA: lleva un stock que alguien contó.
 *
 *   node pruebas/inventario.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const get = (g, o) => j(g.api.doGet({ parameter: o }));
let seq = 0;
const op = () => 'op-inv-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);
const H = 'Inventario por variante';

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  return g;
}
const filaDe = (g, id) => g.filas('Catálogo').findIndex(f => f[0] === id) + 1;
/* Como lo haría el comerciante: escribe Variantes y la hoja avisa. */
function ponerVariantes(g, id, texto) {
  const h = g.hojas.get('Catálogo'), f = filaDe(g, id);
  const cv = g.columna('Catálogo', 'Variantes');
  h.getRange(f, cv).setValue(texto);
  g.api.alEditar({ range: { getSheet: () => h, getColumn: () => cv, getNumColumns: () => 1, getNumRows: () => 1,
                            getRow: () => f, getA1Notation: () => 'N' + f } });
}
const inv = g => (g.filas(H) || []).slice(1);
const filasDe = (g, id) => inv(g).filter(f => f[0] === id);
function ponerStock(g, id, combo, n) {
  const h = g.hojas.get(H);
  const i = (g.filas(H) || []).findIndex(f => f[0] === id && f[1] === combo) + 1;
  if (i < 1) throw new Error('no hay fila para ' + combo);
  const cs = g.columna(H, 'Stock');
  h.getRange(i, cs).setValue(n);
  g.api.alEditar({ range: { getSheet: () => h, getColumn: () => cs, getNumColumns: () => 1, getNumRows: () => 1,
                            getRow: () => i, getA1Notation: () => 'C' + i } });
}
const stockFila = (g, id, combo) => (inv(g).find(f => f[0] === id && f[1] === combo) || [])[2];
const stockCat = (g, id) => g.filas('Catálogo')[filaDe(g, id) - 1][5];
const registrar = (g, pedido, items) => get(g, { a: 'registrar', pedido, ciudad: 'Cali', cupon: '', envio: 'zona-norte', items, sub: '0' });
function estado(g, pedido, e) {
  const h = g.hojas.get('Pedidos');
  g.filas('Pedidos').forEach((f, i) => { if (f[1] === pedido) h.getRange(i + 1, 4).setValue(e); });
  g.api.trasCambiarEstado();
}
function conSesion(g) {
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  return post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
}

const RM = 'Talla: M · Color: Rosa', RS = 'Talla: S · Color: Rosa', NM = 'Talla: M · Color: Nude';

(() => {
  // ═══ 1. Las filas las escribe el maestro, vacías ═══
  const g = tienda();
  ponerVariantes(g, 'croissant', 'Talla: S|M|L ; Color: Rosa|Nude');
  ok('AL ESCRIBIR VARIANTES, el maestro genera una fila por combinación',
     filasDe(g, 'croissant').length === 6 && filasDe(g, 'croissant').some(f => f[1] === RM),
     filasDe(g, 'croissant').map(f => f[1]).join(' / '));
  ok('  ...con el stock VACÍO: el comerciante solo pone los números',
     filasDe(g, 'croissant').every(f => f[2] === ''));
  g.api.sincronizarVariantes(); g.api.sincronizarVariantes();
  ok('  ...y correrlo otra vez no agrega nada', filasDe(g, 'croissant').length === 6);

  // ═══ 2. Compatibilidad: sin números, como antes ═══
  let cat = get(g, { a: 'catalogo' }).productos.find(p => p.id === 'croissant');
  ok('SIN NINGÚN NÚMERO ESCRITO, el producto se vende como antes: su stock de Catálogo, sin skus',
     cat.stock === 40 && cat.skus === undefined, cat.stock + ' / ' + JSON.stringify(cat.skus));
  let v = get(g, { a: 'validar', envio: 'zona-norte', items: 'croissant:3:Talla=M;Color=Rosa' });
  ok('  ...y se puede pedir, contra el stock del producto', v.ok && v.items[0].cantidad === 3);

  // ═══ 3. Con números: la verdad está en la pestaña ═══
  ponerStock(g, 'croissant', RM, 1);
  ponerStock(g, 'croissant', RS, 4);
  ponerStock(g, 'croissant', NM, 2);
  cat = get(g, { a: 'catalogo' }).productos.find(p => p.id === 'croissant');
  ok('CON UN NÚMERO ESCRITO, el producto pasa a inventario por combinación: skus en el catálogo',
     Array.isArray(cat.skus) && cat.skus.length === 6 &&
     cat.skus.find(s => s.eleccion === RM).stock === 1 && cat.skus.find(s => s.eleccion === 'Talla: L · Color: Nude').stock === 0,
     JSON.stringify(cat.skus));
  ok('  ...y el stock del producto es LA SUMA', cat.stock === 7, String(cat.stock));
  ok('  ...escrita por el maestro en Catálogo › Stock, para todo lo que ya la leía', Number(stockCat(g, 'croissant')) === 7,
     String(stockCat(g, 'croissant')));

  // ═══ 4. Cada combinación compite por lo suyo ═══
  v = get(g, { a: 'validar', envio: 'zona-norte', items: 'croissant:2:Talla=M;Color=Rosa' });
  ok('PEDIR 2 ROSA M con 1 en existencia se recorta a 1 y lo dice, con la combinación',
     v.items[0].cantidad === 1 && v.avisos.some(a => /Talla: M · Color: Rosa\) solo quedan 1/.test(a)), v.avisos.join(' | '));
  v = get(g, { a: 'validar', envio: 'zona-norte', items: 'croissant:1:Talla=M;Color=Rosa,croissant:4:Talla=S;Color=Rosa,croissant:2:Talla=M;Color=Nude' });
  ok('TRES COMBINACIONES DISTINTAS ya no se quitan stock entre sí (lo contrario de C-1)',
     v.items.length === 3 && v.items.reduce((s, i) => s + i.cantidad, 0) === 7 && !v.recortado,
     v.items.map(i => i.variante + ' x' + i.cantidad).join(' · '));
  v = get(g, { a: 'validar', envio: 'zona-norte', items: 'croissant:1:Talla=L;Color=Nude' });
  ok('UNA COMBINACIÓN EN CERO no se vende aunque el producto tenga stock', !v.ok || !v.items.length, JSON.stringify(v.avisos));

  // ═══ 5. Pagado descuenta ESA fila ═══
  registrar(g, 'INV01', 'croissant:1:Talla=M;Color=Rosa,croissant:2:Talla=S;Color=Rosa');
  estado(g, 'INV01', 'Pagado');
  ok('PAGADO DESCUENTA LA COMBINACIÓN, y solo esa',
     Number(stockFila(g, 'croissant', RM)) === 0 && Number(stockFila(g, 'croissant', RS)) === 2 &&
     Number(stockFila(g, 'croissant', NM)) === 2,
     [RM, RS, NM].map(c => stockFila(g, 'croissant', c)).join(' / '));
  ok('  ...y la suma del producto baja con ella', Number(stockCat(g, 'croissant')) === 4, String(stockCat(g, 'croissant')));
  ok('  ...con la línea marcada Descontado, como siempre',
     g.filas('Pedidos').filter(f => f[1] === 'INV01').every(f => /Descontado/.test(f[12])));
  estado(g, 'INV01', 'Pagado');
  ok('  ...y marcarlo otra vez no descuenta otra vez', Number(stockFila(g, 'croissant', RS)) === 2);
  estado(g, 'INV01', 'Cancelado');
  ok('CANCELADO la devuelve A LA MISMA FILA', Number(stockFila(g, 'croissant', RM)) === 1 &&
     Number(stockFila(g, 'croissant', RS)) === 4 && Number(stockCat(g, 'croissant')) === 7);

  // ═══ 6. Una línea que no casa ═══
  registrar(g, 'INV02', 'croissant:1');                     // sin elección: página vieja
  estado(g, 'INV02', 'Pagado');
  ok('UNA LÍNEA SIN ELECCIÓN no se descuenta de ninguna parte (la suma se la comería)',
     Number(stockCat(g, 'croissant')) === 7 && !/Descontado/.test(g.filas('Pedidos').find(f => f[1] === 'INV02')[12]));
  ok('  ...y queda dicho en Errores', g.filas('Errores').some(f => /no casan con el inventario por variante/.test(f[1])));

  // ═══ 7. Cambiar las opciones no borra lo contado ═══
  ponerVariantes(g, 'croissant', 'Talla: S|M|L ; Color: Rosa');
  const nude = filasDe(g, 'croissant').filter(f => /Nude/.test(f[1]));
  ok('QUITAR UNA OPCIÓN no borra sus filas: las marca y dejan de contar',
     nude.length === 3 && nude.every(f => /Ya no está en Variantes/.test(f[4])) &&
     Number(stockCat(g, 'croissant')) === 5, nude.map(f => f[4]).join(' / ') + ' · suma ' + stockCat(g, 'croissant'));
  ponerVariantes(g, 'croissant', 'Talla: S|M|L ; Color: Rosa|Nude');
  ok('  ...y si la opción vuelve, vuelven con su número', filasDe(g, 'croissant').length === 6 &&
     !filasDe(g, 'croissant').some(f => /Ya no está/.test(f[4])) && Number(stockCat(g, 'croissant')) === 7);

  // ═══ 8. Topes ═══
  ponerVariantes(g, 'baguette', 'A: 1|2|3|4|5 ; B: 1|2|3|4|5 ; C: 1|2|3|4|5');
  ok('MÁS DE 100 COMBINACIONES no genera nada y lo dice con el número',
     filasDe(g, 'baguette').length === 0 && g.filas('Errores').some(f => /Demasiadas combinaciones/.test(f[1]) && /125/.test(f[2])));
  ok('LOS TOPES son 3 grupos y 20 opciones',
     g.api.MAX_GRUPOS_VARIANTE === 3 && g.api.MAX_OPCIONES_VARIANTE === 20 && g.api.MAX_COMBINACIONES === 100);
  /* Y LOS MISMOS en la página y en el horneado: tres programas que no se leen
     entre sí, escritos tres veces; lo que no puede pasar es que digan otra cosa. */
  {
    const fs = require('fs');
    const leer = (ruta, re) => Number(((fs.readFileSync(ruta, 'utf8').match(re)) || [])[1]);
    const sitios = ['../plantilla/index.html', '../montar/catalogo-estatico.mjs'].map(r => ({
      r, g: leer(r, /const MAX_GRUPOS_VARIANTE = (\d+)/), o: leer(r, /const MAX_OPCIONES_VARIANTE = (\d+)/) }));
    ok('  ...y la página y el horneado dicen los mismos topes',
       sitios.every(x => x.g === 3 && x.o === 20), JSON.stringify(sitios));
  }

  // ═══ 9. Una celda ilegible ═══
  const h = g.hojas.get(H);
  const iNM = (g.filas(H) || []).findIndex(f => f[0] === 'croissant' && f[1] === NM) + 1;
  h.getRange(iNM, g.columna(H, 'Stock')).setValue('dos');
  cat = get(g, { a: 'catalogo' }).productos.find(p => p.id === 'croissant');
  ok('UN NÚMERO ILEGIBLE no vale cero en silencio: esa combinación no se vende y queda anotada',
     cat.skus.find(s => s.eleccion === NM).stock === 0 && get(g, { a: 'catalogo' }).ilegibles > 0);
  h.getRange(iNM, g.columna(H, 'Stock')).setValue(2);

  // ═══ 10. El apartado del cobro en línea, por combinación ═══
  {
    const g2 = tienda();
    const poner = (clave, v2) => { const f = g2.filas('Configuración').findIndex(x => x[0] === clave) + 1;
                                    g2.hojas.get('Configuración').getRange(f, 2).setValue(v2); };
    poner('sitio_url', 'https://x.example'); poner('cobro_modo', 'Pasarela');
    g2.props.BOLD_IDENTIDAD_SANDBOX = 'a'; g2.props.BOLD_SECRETA_SANDBOX = 'b';
    ponerVariantes(g2, 'croissant', 'Talla: S|M|L ; Color: Rosa|Nude');
    ponerStock(g2, 'croissant', RM, 1); ponerStock(g2, 'croissant', NM, 1);
    const c = post(g2, { a: 'pago_crear', op: op(), items: 'croissant:1:Talla=M;Color=Rosa', envio: 'zona-norte',
      entrega: { nombre: 'Ana Pérez', tel: '3001234567', correo: 'a@b.co', ciudad: 'Cali', direccion: 'Calle 1 # 1-1' } });
    const otra = get(g2, { a: 'validar', envio: 'zona-norte', items: 'croissant:1:Talla=M;Color=Rosa' });
    const nudeOk = get(g2, { a: 'validar', envio: 'zona-norte', items: 'croissant:1:Talla=M;Color=Nude' });
    ok('PAGANDO LA ÚLTIMA ROSA M, otro comprador no la puede pedir… pero la Nude M sí',
       c.ok && !otra.ok && /pagando otra persona/.test(otra.error) && nudeOk.ok && nudeOk.items[0].cantidad === 1,
       (c.error || '') + ' | ' + otra.error);
  }

  // ═══ 11. Desde el panel ═══
  {
    const k = conSesion(g);
    const p = post(g, { a: 'productos', k }).productos.find(x => x.id === 'croissant');
    ok('EL PANEL trae las combinaciones con su número tal como está escrito, y si ya manda',
       p.porCombinacion && p.combinaciones.length === 6 && p.combinaciones.find(x => x.combinacion === RM).stock === '1',
       JSON.stringify(p.combinaciones.slice(0, 2)));
    const ver = x => p.combinaciones.find(y => y.combinacion === x).version;
    let r = post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
                      cambios: { [RM]: '5', [RS]: 'muchas' }, versiones: { [RM]: ver(RM), [RS]: ver(RS) } });
    ok('UN NÚMERO QUE NO ES NÚMERO: no se guarda NINGUNO, y dice cuál',
       !r.ok && /entero/.test(r.errores[RS]) && Number(stockFila(g, 'croissant', RM)) === 1, JSON.stringify(r.errores));
    r = post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
                  cambios: { [RM]: '5' }, versiones: { [RM]: ver(RM) } });
    ok('GUARDAR DESDE EL PANEL escribe la fila y la suma', r.ok && Number(stockFila(g, 'croissant', RM)) === 5 &&
       Number(stockCat(g, 'croissant')) === 11, r.error || '');
    ok('  ...y queda en el Registro', (g.filas('Registro') || []).slice(-1)[0][3] === 'Cambió el stock de una combinación');
    r = post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
                  cambios: { [RM]: '9' }, versiones: { [RM]: ver(RM) } });
    ok('  ...y con la huella vieja no pisa lo que cambió en la hoja', !r.ok && /Cambió en la hoja/.test(r.errores[RM]));

    /* ═══ 0.24.0 · EL PRECIO DE UNA COMBINACIÓN, desde el panel (bitácora 110) ═══ */
    const cmb = post(g, { a: 'productos', k }).productos.find(x => x.id === 'croissant').combinaciones;
    const cRM = cmb.find(c => c.combinacion === RM);
    ok('EL PANEL trae el precio de cada combinación, tal como está (vacío = el del producto)',
       cRM && cRM.precio === '' && typeof cRM.versionPrecio === 'string');
    r = post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
                  precios: { [RM]: 'caro' }, versionesPrecio: { [RM]: cRM.versionPrecio } });
    ok('  ...un precio que no es número no se guarda, y se dice junto a su combinación',
       !r.ok && /pesos/.test((r.errores || {})[RM] || ''));
    r = post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
                  precios: { [RM]: '9900' }, versionesPrecio: { [RM]: cRM.versionPrecio } });
    const filaRM = inv(g).find(f => f[0] === 'croissant' && f[1] === RM);
    ok('  ...y uno bueno va a la columna Precio de su fila', r.ok && Number(filaRM[5]) === 9900, String(filaRM && filaRM[5]));
    ok('  ...y queda en el Registro', (g.filas('Registro') || []).slice(-1)[0][3] === 'Cambió el precio de una combinación');
    const vp = get(g, { a: 'validar', envio: 'zona-norte', items: 'croissant:1:' + RM.replace(/: /g, '=').replace(/ · /g, ';') + ',croissant:1:Talla=S;Color=Rosa' });
    const precioProd = get(g, { a: 'catalogo' }).productos.find(x => x.id === 'croissant').precio;
    ok('EL MAESTRO cobra la combinación a su precio y la otra al del producto',
       vp.ok && vp.sub === 9900 + precioProd, 'sub ' + vp.sub + ' · producto ' + precioProd);
    const cat2 = get(g, { a: 'catalogo' }).productos.find(x => x.id === 'croissant');
    ok('  ...y el catálogo publica el precio de esa combinación',
       (cat2.precios || []).some(x => x.eleccion === RM && x.precio === 9900), JSON.stringify(cat2.precios));
    post(g, { a: 'guardar_combinaciones', k, op: op(), id: 'croissant',
              precios: { [RM]: '' }, versionesPrecio: { [RM]: post(g, { a: 'productos', k }).productos.find(x => x.id === 'croissant').combinaciones.find(c => c.combinacion === RM).versionPrecio } });

    // La foto pertenece a la combinación exacta y queda en esa fila.
    const fc = g.filas('Configuración').findIndex(x => x[0] === 'fotos_drive') + 1;
    g.hojas.get('Configuración').getRange(fc, 2).setValue('carpeta-de-fotos');
    g.enDrive('carpeta-de-fotos', []);
    const datos = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]).toString('base64');
    const f1 = post(g, { a: 'subir_foto', k, op: op(), id: 'croissant', tipo: 'image/jpeg', datos, combinacion: RM });
    const filaFoto = inv(g).find(f => f[0] === 'croissant' && f[1] === RM);
    ok('LA FOTO DE UNA COMBINACIÓN se nombra y se guarda en su fila', f1.ok && f1.destino === 'variante' &&
       f1.nombre === 'croissant--talla-m-color-rosa-1.jpg' && filaFoto[6] === f1.nombre, f1.nombre || f1.error);
    const f2 = post(g, { a: 'subir_foto', k, op: op(), id: 'croissant', tipo: 'image/jpeg', datos, combinacion: 'Talla: M · Color: Verde' });
    ok('  ...y una combinación que el producto no tiene no se inventa', !f2.ok && /no está en Inventario/.test(f2.error));
  }

  // ═══ 12. Compatibilidad: límite de fotos de opción antiguas ═══
  const muchas = [];
  for (let i = 1; i <= 8; i++) muchas.push('x-' + i + '.jpg');
  for (let i = 1; i <= 6; i++) muchas.push('x--color-rosa-' + i + '.jpg');
  for (let i = 1; i <= 2; i++) muchas.push('x--color-nude-' + i + '.jpg');
  const tope = g.api.fotosConTope(muchas);
  ok('LAS FOTOS LEGADAS: 6 generales y hasta 4 por opción',
     tope.filter(n => n.indexOf('--') === -1).length === 6 && tope.filter(n => /rosa/.test(n)).length === 4 &&
     tope.filter(n => /nude/.test(n)).length === 2, tope.join(' '));

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
