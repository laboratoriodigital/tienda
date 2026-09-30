/* D-2 — productos desde el panel, del lado del maestro.
 * ---------------------------------------------------------------------------
 * La hoja sigue siendo la base de datos. Lo que prueba esta batería es lo que
 * cambia cuando quien escribe en ella ya no la está mirando:
 *
 *   · LO QUE SE LEYÓ, NO LO QUE HAY. Guardar un formulario abierto hace diez
 *     minutos no puede resucitar la unidad que se vendió entre medias. Es la
 *     aserción central, y la que se rompe sola al escribir «la fila entera».
 *   · UNA OPERACIÓN, UNA VEZ. El celular del mostrador reintenta; crear dos
 *     veces no puede depender de la red.
 *   · BAJO LLAVE, y la llave se suelta también cuando algo sale mal.
 *   · AL ESCRIBIR SE FALLA CERRADO. Leyendo, una celda rara no saca el producto
 *     de la tienda; escribiendo desde el panel, lo que no valida no entra.
 *   · BORRAR NO PIERDE NADA: va a una Papelera de la que se recupera.
 *
 *   node pruebas/productos.js
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
const op = () => 'op-prueba-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

/* Una tienda con el panel abierto: usuario, clave, y el testigo ya en la mano. */
function conSesion() {
  const g = nuevo();
  const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(fila, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k };
}

const filaDe = (g, id) => g.filas('Catálogo').find(f => String(f[0]) === id);
/* Lo que la tienda pone a la venta: la puerta pública trae también los
   desactivados, marcados, y es la página la que los deja fuera. */
const catalogo = g => j(g.api.doGet({ parameter: { a: 'catalogo' } })).productos
  .filter(p => p.activo !== false).map(p => p.id);

const BASE = {
  id: 'camiseta-basica', nombre: 'Camiseta básica', formato: 'Unidad', categoria: 'Ropa',
  precio: '45000', stock: '12', descripcion: 'Algodón peinado.', imagenes: 'camiseta-basica-1.jpg',
  destacado: false, activo: true, referencia: 'CB-01', precioAntes: '', umbralBajo: '', variantes: ''
};

(() => {
  // ═══ 1. Sin testigo no pasa nada ═══
  {
    const g = nuevo();
    const antes = JSON.stringify(g.filas('Catálogo'));
    const intentos = [
      post(g, { a: 'productos' }),
      post(g, { a: 'guardar_producto', op: op(), nuevo: true, producto: BASE }),
      post(g, { a: 'activar_producto', op: op(), id: 'croissant', activo: false }),
      post(g, { a: 'borrar_producto', op: op(), id: 'croissant', version: 'x' })
    ];
    ok('SIN TESTIGO no contesta ninguna de las cuatro puertas de productos',
       intentos.every(r => !r.ok && !r.productos), intentos.map(r => r.error).join(' / '));
    ok('  ...y la hoja quedó exactamente igual', JSON.stringify(g.filas('Catálogo')) === antes);
    ok('  ...y por GET tampoco, ni con testigo',
       !j(g.api.doGet({ parameter: { a: 'productos', k: 'lo-que-sea' } })).ok);
  }

  // ═══ 2. Listar ═══
  {
    const { g, k } = conSesion();
    // Una celda que la hoja no sabe leer, y un producto desactivado.
    const filaCroissant = g.filas('Catálogo').findIndex(f => String(f[0]) === 'croissant') + 1;
    g.hojas.get('Catálogo').getRange(filaCroissant, g.columna('Catálogo', 'Precio')).setValue('doce mil');
    const filaBaguette = g.filas('Catálogo').findIndex(f => String(f[0]) === 'baguette') + 1;
    g.hojas.get('Catálogo').getRange(filaBaguette, g.columna('Catálogo', 'Activo')).setValue('No');

    const r = post(g, { a: 'productos', k });
    const croissant = r.productos.find(p => p.id === 'croissant');
    const baguette = r.productos.find(p => p.id === 'baguette');
    ok('LA LISTA trae todos los productos de la hoja', r.ok && r.productos.length === 8,
       r.ok ? r.productos.length + ' productos' : r.error);
    ok('  ...INCLUIDOS LOS DESACTIVADOS: el panel es donde se reactivan',
       !!baguette && baguette.activo === false);
    /* La tienda lo saca de la venta; el panel tiene que enseñar POR QUÉ. Un 0
       en el formulario se guardaría sin mirar y el producto quedaría gratis. */
    ok('UN PRECIO ILEGIBLE sale tal cual y marcado, no como 0',
       croissant.precio === 'doce mil' && croissant.problemas.indexOf('Precio') !== -1,
       JSON.stringify({ precio: croissant.precio, problemas: croissant.problemas }));
    ok('  ...y cada producto trae su versión, distinta de las demás',
       new Set(r.productos.map(p => p.version)).size === r.productos.length &&
       r.productos.every(p => /^[0-9a-f]{16}$/.test(p.version)));
    ok('  ...y las categorías para filtrar', r.categorias.indexOf('Panes') !== -1,
       r.categorias.join(', '));
  }

  // ═══ 3. Crear ═══
  {
    const { g, k } = conSesion();
    const r = post(g, { a: 'guardar_producto', k, op: op(), nuevo: true, producto: BASE });
    const f = filaDe(g, 'camiseta-basica');
    ok('CREAR escribe la fila entera en Catálogo', r.ok && !!f, r.error || '');
    ok('  ...con las cifras como números y los sí/no como la hoja los escribe',
       f && f[4] === 45000 && f[5] === 12 && f[8] === 'No' && f[9] === 'Sí',
       f && JSON.stringify(f.slice(4, 10)));
    ok('  ...y la tienda en vivo lo ve YA, sin esperar el minuto de la caché',
       catalogo(g).indexOf('camiseta-basica') !== -1);

    const otra = post(g, { a: 'guardar_producto', k, op: op(), nuevo: true,
                           producto: Object.assign({}, BASE, { nombre: 'Otra con el mismo código' }) });
    ok('UN CÓDIGO QUE YA EXISTE no se pisa: se pide otro',
       !otra.ok && /Ya hay un producto/.test(otra.error) &&
       g.filas('Catálogo').filter(f => f[0] === 'camiseta-basica').length === 1, otra.error);
  }

  // ═══ 4. Lo que no valida no entra ═══
  {
    const { g, k } = conSesion();
    const antes = JSON.stringify(g.filas('Catálogo'));
    const malos = [
      ['un código con espacios',      { id: 'camiseta basica' }],
      ['un código con mayúsculas',    { id: 'Camiseta' }],
      ['un código con tilde',         { id: 'camisón' }],
      ['sin nombre',                  { nombre: '  ' }],
      ['sin precio',                  { precio: '' }],
      ['precio cero',                 { precio: '0' }],
      ['precio en letras',            { precio: 'doce mil' }],
      ['precio con decimales',        { precio: '12,5' }],
      ['stock negativo',              { stock: '-1' }],
      ['stock en letras',             { stock: 'tres' }],
      ['stock vacío',                 { stock: '' }],
      ['precio antes menor',          { precioAntes: '40000' }],
      ['siete fotos',                 { imagenes: 'a|b|c|d|e|f|g' }],
      ['variantes ilegibles',         { variantes: 'S M L' }],
      /* La que la tienda no puede arreglar: una coma no cabe en la línea del
         pedido, y la página tumbaría el grupo en silencio (C-1c). */
      ['una talla con coma',          { variantes: 'Talla: 40,5|41' }]
    ];
    const respuestas = malos.map(([, cambio]) =>
      post(g, { a: 'guardar_producto', k, op: op(), nuevo: true,
                producto: Object.assign({}, BASE, cambio) }));
    const pasaron = malos.filter((m, i) => respuestas[i].ok).map(m => m[0]);
    ok('LO QUE NO VALIDA NO ENTRA: quince formas de equivocarse, quince rechazos',
       pasaron.length === 0, pasaron.join(', ') || malos.length + ' rechazados');
    ok('  ...y la hoja quedó exactamente igual', JSON.stringify(g.filas('Catálogo')) === antes);
    const sinMotivo = respuestas.filter(r => !r.error || r.error.length < 15);
    ok('  ...y cada rechazo dice qué hacer, en palabras del comerciante',
       sinMotivo.length === 0, respuestas[6].error);
    ok('  ...incluida la coma, que es la que la tienda no podría avisar después',
       /coma/.test(respuestas[14].error), respuestas[14].error);

    /* Y lo que SÍ vale aunque se vea distinto: así escribe la gente. */
    const r = post(g, { a: 'guardar_producto', k, op: op(), nuevo: true,
                        producto: Object.assign({}, BASE, { id: 'camiseta-roja',
                                                            precio: '$45.000', stock: '12' }) });
    ok('«$45.000» se entiende como 45000, que es como lo escribe un colombiano',
       r.ok && filaDe(g, 'camiseta-roja')[4] === 45000, r.error || '');
  }

  // ═══ 5. Una fórmula no se cuela ═══
  {
    const { g, k } = conSesion();
    post(g, { a: 'guardar_producto', k, op: op(), nuevo: true,
              producto: Object.assign({}, BASE, { nombre: '=IMPORTXML("http://x","//a")',
                                                  descripcion: '+56 buena' }) });
    const f = filaDe(g, 'camiseta-basica');
    ok('UNA FÓRMULA ESCRITA EN EL PANEL llega a la hoja como texto, no se ejecuta',
       f && String(f[1]).charAt(0) === "'" && String(f[6]).charAt(0) === "'",
       f && String(f[1]).slice(0, 20));
  }

  // ═══ 6. Editar, y lo que se leyó ═══
  {
    const { g, k } = conSesion();
    const lista = post(g, { a: 'productos', k }).productos;
    const croissant = lista.find(p => p.id === 'croissant');

    const r = post(g, { a: 'guardar_producto', k, op: op(), version: croissant.version,
                        producto: Object.assign({}, croissant, { descripcion: 'Con mantequilla francesa.' }) });
    ok('EDITAR con la versión que se leyó escribe', r.ok && filaDe(g, 'croissant')[6] === 'Con mantequilla francesa.',
       r.error || '');
    ok('  ...y devuelve la versión nueva, para seguir editando', r.version && r.version !== croissant.version);

    /* EL CASO QUE JUSTIFICA TODO ESTO. El formulario se abrió con 40 en stock;
       entre medias se pagó un pedido y quedó en 37; el comerciante corrige una
       tilde y guarda. Escribir la fila entera devolvería el 40. */
    const leido = post(g, { a: 'productos', k }).productos.find(p => p.id === 'croissant');
    const fila = g.filas('Catálogo').findIndex(f => String(f[0]) === 'croissant') + 1;
    g.hojas.get('Catálogo').getRange(fila, g.columna('Catálogo', 'Stock')).setValue(37);            // se vendieron tres
    const tarde = post(g, { a: 'guardar_producto', k, op: op(), version: leido.version,
                            producto: Object.assign({}, leido, { nombre: 'Croissant de mantequilla francesa' }) });
    ok('GUARDAR UN FORMULARIO VIEJO NO RESUCITA LO QUE SE VENDIÓ ENTRE MEDIAS',
       !tarde.ok && tarde.cambiado === true && filaDe(g, 'croissant')[5] === 37,
       'stock en la hoja: ' + filaDe(g, 'croissant')[5] + ' · ' + (tarde.error || 'se escribió'));
    ok('  ...y dice que el producto cambió, y qué hacer', /cambió mientras lo editabas/.test(tarde.error));

    const sinVersion = post(g, { a: 'guardar_producto', k, op: op(),
                                 producto: Object.assign({}, leido, { nombre: 'x' }) });
    ok('  ...y editar SIN versión tampoco escribe', !sinVersion.ok && filaDe(g, 'croissant')[1] !== 'x');

    /* El código no se cambia: lo usan los pedidos, las fotos y los enlaces. */
    const renombrar = post(g, { a: 'guardar_producto', k, op: op(), version: leido.version,
                                producto: Object.assign({}, leido, { id: 'croissant-nuevo' }) });
    ok('EL CÓDIGO NO SE CAMBIA editando: los pedidos y las fotos lo usan',
       !renombrar.ok && !filaDe(g, 'croissant-nuevo') && !!filaDe(g, 'croissant'), renombrar.error);
  }

  // ═══ 7. Una operación, una vez ═══
  {
    const { g, k } = conSesion();
    const mismo = op();
    const r1 = post(g, { a: 'guardar_producto', k, op: mismo, nuevo: true, producto: BASE });
    const r2 = post(g, { a: 'guardar_producto', k, op: mismo, nuevo: true, producto: BASE });
    ok('LA MISMA OPERACIÓN DOS VECES crea UN producto',
       g.filas('Catálogo').filter(f => f[0] === 'camiseta-basica').length === 1);
    ok('  ...y la segunda contesta lo mismo que la primera, no «ya existe»',
       r1.ok && r2.ok && r2.repetida === true, JSON.stringify(r2).slice(0, 80));

    const sinOp = post(g, { a: 'guardar_producto', k, nuevo: true,
                            producto: Object.assign({}, BASE, { id: 'sin-op' }) });
    ok('  ...y una escritura SIN número de operación no se hace',
       !sinOp.ok && !filaDe(g, 'sin-op'), sinOp.error);
  }

  // ═══ 8. Bajo llave ═══
  {
    const { g, k } = conSesion();
    const lista = post(g, { a: 'productos', k }).productos;
    const desde = g.escrituras.length;
    const vecesAntes = g.llave.veces;
    post(g, { a: 'guardar_producto', k, op: op(), nuevo: true, producto: BASE });
    const c = lista.find(p => p.id === 'croissant');
    post(g, { a: 'guardar_producto', k, op: op(), version: c.version,
              producto: Object.assign({}, c, { stock: '41' }) });
    post(g, { a: 'activar_producto', k, op: op(), id: 'baguette', activo: false });
    const b = post(g, { a: 'productos', k }).productos.find(p => p.id === 'pan-integral');
    post(g, { a: 'borrar_producto', k, op: op(), id: 'pan-integral', version: b.version });
    const hechas = g.escrituras.slice(desde).filter(e => e.hoja === 'Catálogo' || e.hoja === 'Papelera');
    ok('TODA ESCRITURA DEL PANEL en Catálogo y Papelera ocurrió CON LA LLAVE TOMADA',
       hechas.length >= 4 && hechas.every(e => e.conLlave),
       hechas.length + ' escrituras · sin llave: ' + hechas.filter(e => !e.conLlave).length);
    ok('  ...y la llave se tomó una vez por operación', g.llave.veces - vecesAntes === 4,
       (g.llave.veces - vecesAntes) + ' veces');

    /* Y SE SUELTA AUNQUE LA OPERACIÓN FALLE. Una llave que se queda tomada
       tras un error deja la tienda sin poder escribir —ni el panel ni los
       pedidos— hasta que Google la suelte sola. */
    /* Y que falle DE VERDAD, con una excepción a mitad de escritura —cuota de
       Google agotada, hoja protegida—, no con un rechazo educado: un rechazo
       vuelve por el camino normal y soltaría la llave igual con o sin
       `finally`. Esta aserción estuvo escrita así primero, y pasaba con el
       defecto puesto. */
    const hc = g.hojas.get('Catálogo');
    const appendRow = hc.appendRow;
    hc.appendRow = () => { throw new Error('Service invoked too many times'); };
    const roto = post(g, { a: 'guardar_producto', k, op: op(), nuevo: true,
                           producto: Object.assign({}, BASE, { id: 'revienta' }) });
    hc.appendRow = appendRow;
    ok('  ...y queda suelta después, TAMBIÉN cuando la escritura revienta a la mitad',
       g.llave.tomada === false, 'llave ' + (g.llave.tomada ? 'TOMADA' : 'suelta'));
    ok('  ...y al comerciante le llega el motivo, no «algo salió mal»',
       !roto.ok && /too many times/.test(roto.error), roto.error);
  }

  // ═══ 9. Activar y desactivar ═══
  {
    const { g, k } = conSesion();
    post(g, { a: 'activar_producto', k, op: op(), id: 'croissant', activo: false });
    ok('DESACTIVAR lo saca de la tienda', filaDe(g, 'croissant')[9] === 'No' &&
       catalogo(g).indexOf('croissant') === -1);
    ok('  ...y sigue en el panel, que es donde se reactiva',
       post(g, { a: 'productos', k }).productos.some(p => p.id === 'croissant' && !p.activo));
    post(g, { a: 'activar_producto', k, op: op(), id: 'croissant', activo: true });
    ok('  ...y ACTIVAR lo devuelve', catalogo(g).indexOf('croissant') !== -1);
  }

  // ═══ 10. Borrar va a la Papelera ═══
  {
    const { g, k } = conSesion();
    const c = post(g, { a: 'productos', k }).productos.find(p => p.id === 'croissant');
    const mala = post(g, { a: 'borrar_producto', k, op: op(), id: 'croissant', version: 'aaaaaaaaaaaaaaaa' });
    ok('BORRAR con una versión vieja no borra', !mala.ok && !!filaDe(g, 'croissant'), mala.error);

    const r = post(g, { a: 'borrar_producto', k, op: op(), id: 'croissant', version: c.version });
    const papelera = g.hojas.get('Papelera') ? g.filas('Papelera') : [];
    ok('BORRAR lo quita de Catálogo', r.ok && !filaDe(g, 'croissant'));
    ok('  ...y lo deja ENTERO en la Papelera, con la fecha y desde dónde',
       papelera.length === 2 && papelera[1][0] === 'croissant' && papelera[1][1] === c.nombre &&
       papelera[1][15] === 'Panel', JSON.stringify(papelera[1] || []).slice(0, 90));
    ok('  ...con las mismas columnas que Catálogo, para devolverlo copiando y pegando',
       /* 0.24.0: las dos en su orden VISIBLE (el físico), que es el que se copia y pega. */
       !!papelera[0] && JSON.stringify(papelera[0].slice(0, 14)) === JSON.stringify(g.hojas.get('Catálogo')._datos[0].slice(0, 14)) &&
       String(g.hojas.get('Papelera')._datos[1][g.hojas.get('Catálogo')._datos[0].indexOf('Precio')]) === String(c.precio));
  }

  // ═══ 11. Subir una foto (D-2c) ═══
  {
    const { g, k } = conSesion();
    const ponerConfig = (clave, valor) => {
      const f = g.filas('Configuración').findIndex(x => String(x[0]) === clave) + 1;
      g.hojas.get('Configuración').getRange(f, 2).setValue(valor);
    };
    ponerConfig('fotos_drive', 'carpeta-de-fotos');
    // Ya hay una croissant-1.jpg en el Drive, subida a mano y sin escribir en la hoja.
    g.enDrive('carpeta-de-fotos', [{ id: 'a-mano', nombre: 'croissant-1.jpg' }]);

    const bytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0xC8, 0x7F]);
    const foto = { tipo: 'image/jpeg', datos: bytes.toString('base64') };

    const r = post(g, Object.assign({ a: 'subir_foto', k, op: op(), id: 'croissant' }, foto));
    const enDrive = g.carpetaDrive('carpeta-de-fotos');
    const subida = enDrive.find(x => x.nombre === r.nombre);
    ok('SUBIR UNA FOTO la guarda en la carpeta de Drive CON EL NOMBRE QUE LE TOCA',
       r.ok && r.nombre === 'croissant-2.jpg' && !!subida, r.error || r.nombre);
    ok('  ...sin pisar la croissant-1.jpg que alguien subió a mano',
       enDrive.filter(x => x.nombre === 'croissant-1.jpg').length === 1);
    ok('  ...con los bytes intactos, que es lo que no se ve hasta que la foto sale rota',
       subida && subida._bytes && Buffer.compare(subida._bytes, bytes) === 0);
    ok('  ...Y EL NOMBRE QUEDA ESCRITO EN LA HOJA: la foto y la celda no pueden no casar',
       String(filaDe(g, 'croissant')[7]).split('|').indexOf('croissant-2.jpg') !== -1,
       String(filaDe(g, 'croissant')[7]));

    const r2 = post(g, Object.assign({ a: 'subir_foto', k, op: op(), id: 'croissant' }, foto));
    ok('  ...y la siguiente toma el número libre siguiente', r2.nombre === 'croissant-3.jpg', r2.nombre);

    const mismo = op();
    post(g, Object.assign({ a: 'subir_foto', k, op: mismo, id: 'baguette' }, foto));
    post(g, Object.assign({ a: 'subir_foto', k, op: mismo, id: 'baguette' }, foto));
    ok('LA MISMA SUBIDA DOS VECES deja UNA foto',
       g.carpetaDrive('carpeta-de-fotos').filter(x => /^baguette-/.test(x.nombre)).length === 1);

    const gif = post(g, { a: 'subir_foto', k, op: op(), id: 'croissant', tipo: 'image/gif', datos: 'R0lGOD' });
    ok('UN GIF no se sube', !gif.ok && /JPG, PNG ni WEBP/.test(gif.error), gif.error);

    const grande = post(g, { a: 'subir_foto', k, op: op(), id: 'pan-integral', tipo: 'image/jpeg',
                             datos: 'A'.repeat(7000001) });
    ok('UNA FOTO DEMASIADO GRANDE no se sube, Y DICE CÓMO SUBIRLA A MANO, con su nombre',
       !grande.ok && /pan-integral-1\.jpg/.test(grande.error) && /Drive/.test(grande.error),
       String(grande.error).slice(0, 110));

    g.carpetaDeSoloLectura('carpeta-de-fotos');
    const antes = String(filaDe(g, 'torta-chocolate')[7]);
    const negada = post(g, Object.assign({ a: 'subir_foto', k, op: op(), id: 'torta-chocolate' }, foto));
    ok('SI DRIVE NO DEJA ESCRIBIR, dice el nombre exacto para el camino de siempre',
       !negada.ok && /torta-chocolate-1\.jpg/.test(negada.error), String(negada.error).slice(0, 120));
    ok('  ...y la hoja NO dice que hay una foto que no existe',
       String(filaDe(g, 'torta-chocolate')[7]) === antes);
    ok('  ...y queda anotado para el comerciante',
       g.filas('Errores').some(f => /foto en Drive/.test(String(f[1]))));

    ok('SIN TESTIGO no se sube nada',
       !post(g, Object.assign({ a: 'subir_foto', op: op(), id: 'croissant' }, foto)).ok);
    ok('  ...y todo lo que se escribió, se escribió con la llave tomada',
       g.escrituras.filter(e => e.hoja === 'Catálogo' && e.como === 'setValue').every(e => e.conLlave));
  }

  // ═══ 12. Sin carpeta de fotos, el camino de siempre ═══
  {
    const { g, k } = conSesion();
    const r = post(g, { a: 'subir_foto', k, op: op(), id: 'croissant', tipo: 'image/png', datos: 'iVBORw0KGgo=' });
    ok('SIN CARPETA DE FOTOS configurada no se sube, y dice qué falta Y cómo hacerlo a mano',
       !r.ok && /fotos_drive/.test(r.error) && /croissant-1\.png/.test(r.error), String(r.error).slice(0, 120));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
