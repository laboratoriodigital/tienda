/* ============================================================================
   Presentación de las hojas, listas desplegables, colores y catálogo de
   respaldo.
   ----------------------------------------------------------------------------
   Todo esto existe para que el dueño no tenga que saber nada: elige de una
   lista en vez de escribir, pinta una celda en vez de buscar un código
   hexadecimal, y copia un bloque en vez de editar código a mano. Si algo de
   esto se rompe, el cliente vuelve a depender de nosotros.
   ============================================================================ */
const { crear, configurar } = require('./gas.js');
/* La versión no se escribe a mano aquí: se saca del maestro, igual que en
   panel.js. Patrón 2 de la bitácora: dos sitios con el mismo dato y uno se
   queda atrás. */
const LA_VERSION = (require('fs').readFileSync('./as.js', 'utf8')
  .match(/var VERSION = '([^']+)'/) || [])[1];
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); return g; };
const fmt = (g, hoja, f, c) => (g.hojas.get(hoja)._formato.get(f + ',' + c) || {});
/* 0.24.0 · Catálogo se lee por NOMBRE: la columna se pide por su nombre. */
const cc = (g, n) => g.columna('Catálogo', n);
/* Ojo: g.filas() del emulador devuelve la matriz CON encabezado, así que el
   índice ya es el número de fila de la hoja. */
const filaDe = (g, clave) => g.filas('Configuración').findIndex(f => f[0] === clave) + 1;
const valorDe = (g, clave) => g.filas('Configuración')[filaDe(g, clave) - 1][1];

// ═══ 1. Encabezados: la hoja ya no se ve cruda ═══
{
  const g = nuevo();
  const hojas = ['Configuración', 'Catálogo', 'Envíos', 'Cupones',
                 'Pedidos', 'Validaciones', 'Más vendidos', 'Errores'];
  const sinFormato = hojas.filter(n => {
    const e = fmt(g, n, 1, 1);
    return !(e.fondo === '#1B5E3A' && e.color === '#FFFFFF' && e.negrita === 'bold');
  });
  ok('TODAS las hojas tienen encabezado con el color de la marca',
     sinFormato.length === 0, sinFormato.join(', ') || 'las ocho');
  ok('  ...y la primera fila queda fija al desplazar',
     hojas.every(n => g.hojas.get(n)._filasFijas === 1));
  ok('  ...con anchos de columna pensados, no los de fábrica',
     Object.keys(g.hojas.get('Catálogo')._anchos).length >= 8,
     Object.keys(g.hojas.get('Catálogo')._anchos).length + ' columnas');
  ok('En Pedidos también se fijan las dos primeras columnas',
     g.hojas.get('Pedidos')._columnasFijas === 2);
}

// ═══ 2. La plata se ve como plata, las fechas como fechas ═══
{
  const g = nuevo();
  ok('El precio del catálogo lleva formato de pesos',
     fmt(g, 'Catálogo', 2, cc(g, 'Precio')).formato === '"$"#,##0', String(fmt(g, 'Catálogo', 2, cc(g, 'Precio')).formato));
  ok('El valor del envío también', fmt(g, 'Envíos', 2, 3).formato === '"$"#,##0');
  g.hojas.get('Pedidos').appendRow([new Date(), 'A1', 'V', 'Nuevo', 'Cali', '',
                                    'x', 'chonto', 1, 8900, 8900, 8900, '']);
  g.api.presentarHojas();
  ok('La fecha de un pedido se ve como fecha y hora',
     fmt(g, 'Pedidos', 2, 1).formato === 'dd/mm/yyyy hh:mm',
     String(fmt(g, 'Pedidos', 2, 1).formato));
  ok('  ...y los tres totales, como pesos',
     fmt(g, 'Pedidos', 2, 10).formato === '"$"#,##0' &&
     fmt(g, 'Pedidos', 2, 12).formato === '"$"#,##0');
  ok('Las descripciones largas se ajustan en vez de desbordar',
     fmt(g, 'Catálogo', 2, cc(g, 'Descripción')).ajustar === true);
}

// ═══ 3. Listas desplegables: no se escribe, se elige ═══
{
  const g = nuevo();
  const val = (hoja, f, c) => fmt(g, hoja, f, c).validacion;

  const estado = val('Pedidos', 2, 4);
  /* Los estados NO se escriben aquí: se le preguntan al maestro. Escritos a
     mano, esta batería se ponía roja el día que el ciclo del pedido creciera
     —que es justo el día en que hacía falta que mirara otra cosa— y el rojo por
     la razón equivocada es el que enseña a ignorar los rojos. */
  const esperados = g.api.menuDeLaHoja && require('fs')
    .readFileSync('./as.js', 'utf8').match(/rotulo: '([^']+)',\s+viejo:/g)
    .map(x => x.match(/rotulo: '([^']+)'/)[1]);
  ok('EL ESTADO DEL PEDIDO es una lista, no texto libre',
     !!estado && estado._lista.join('|') === esperados.join('|'),
     estado ? estado._lista.join(', ') : 'sin lista');
  ok('  ...y NO deja escribir otra cosa: un "pagado" mal escrito no mueve el inventario',
     estado && estado._permiteOtros === false);
  /* Y por eso la migración de instalar() no es opcional: con la lista cerrada,
     una hoja que todavía diga «Confirmado» quedaría marcada como inválida en
     todas sus filas históricas. */
  ok('  ...así que los estados viejos hay que migrarlos, no solo tolerarlos',
     /function migrarEstados/.test(require('fs').readFileSync('./as.js', 'utf8')),
     'la lista cerrada convierte la migración en obligatoria');
  ok('  ...con la explicación al pasar el cursor',
     /descuenta el inventario/.test(estado._ayuda), estado._ayuda);
  ok('  ...puesta también en las filas vacías, para los pedidos que aún no llegan',
     !!val('Pedidos', 400, 4), 'fila 400');

  ok('Destacado y Activo del catálogo son Sí/No',
     ['Sí', 'No'].join() === (val('Catálogo', 2, cc(g, 'Destacado')) || {})._lista.join() &&
     ['Sí', 'No'].join() === (val('Catálogo', 2, cc(g, 'Activo')) || {})._lista.join());
  ok('El tipo de cupón es una lista de los tres que entiende el código',
     (val('Cupones', 2, 2) || {})._lista.join('|') === 'porcentaje|fijo|envio',
     (val('Cupones', 2, 2) || {})._lista.join(', '));
  ok('  ...y Activo del cupón también', (val('Cupones', 2, 8) || {})._lista.join() === 'Sí,No');

  // instalar() (A-5) siembra dos EJEMPLO en la categoría «Ejemplos» -no
  // «Frescos», que era del catálogo de tomates de antes de A-5-.
  const cat = val('Catálogo', 2, cc(g, 'Categoría'));
  ok('La categoría sugiere las que ya existen', !!cat && cat._lista.indexOf('Ejemplos') !== -1,
     cat ? cat._lista.join(', ') : 'sin lista');
  ok('  ...pero SÍ deja escribir una nueva: el negocio crece', cat._permiteOtros === true);

  ok('correo_siempre también es Sí/No',
     ((fmt(g, 'Configuración', filaDe(g, 'correo_siempre'), 2) || {}).validacion || {})
       ._lista.join() === 'Sí,No');
}

// ═══ 3b. 0.24.0 · La hoja ordenada (bitácora 110) ═══
{
  const g = nuevo();
  const cab = n => g.hojas.get(n)._datos[0].map(String);
  ok('EL CATÁLOGO se ve en orden lógico: lo de vender junto (precio, antes, stock, umbral, variantes)',
     cab('Catálogo').join('|') === g.api.ORDEN_VISIBLE_CATALOGO.join('|'), cab('Catálogo').join(' · '));
  ok('  ...y el inventario por variante con Precio al lado de Stock',
     cab('Inventario por variante').join('|') === 'ID producto|Combinación|Precio|Stock|Código|Nota|Foto',
     cab('Inventario por variante').join(' · '));
  const pestañas = Array.from(g.hojas.keys());
  ok('LAS PESTAÑAS van en el orden en que se usan: Catálogo primero',
     pestañas[0] === 'Catálogo' && pestañas.indexOf('Pedidos') < pestañas.indexOf('Configuración') &&
     pestañas.indexOf('Configuración') < pestañas.indexOf('Registro'), pestañas.join(' · '));
  ok('  ...y cada una con su color (lo que escribe el comercio, informes, sistema)',
     g.hojas.get('Catálogo')._colorPestana && g.hojas.get('Errores')._colorPestana &&
     g.hojas.get('Catálogo')._colorPestana !== g.hojas.get('Errores')._colorPestana);

  // La «Hoja 1» vacía se va; una con algo escrito, no.
  const g1 = crear('./as.js'); g1.libro.insertSheet('Hoja 1'); g1.api.instalar();
  ok('LA «HOJA 1» VACÍA con que nace la hoja se quita al instalar', !g1.hojas.has('Hoja 1'));
  const g1b = crear('./as.js'); g1b.libro.insertSheet('Hoja 1').appendRow(['mis notas']); g1b.api.instalar();
  ok('  ...pero si tiene algo escrito, se queda: puede ser del comercio', g1b.hojas.has('Hoja 1'));

  // Configuración por secciones
  const conf = g.hojas.get('Configuración')._datos.slice(1).map(f => String(f[0]));
  const secciones = conf.filter(k => k.indexOf('▸') === 0);
  ok('CONFIGURACIÓN va por secciones, con los mismos títulos del panel',
     secciones.length >= 8 && secciones[0] === '▸ Tu tienda', secciones.join(' · '));
  ok('  ...y ninguna sección se lee como clave', !Object.keys(g.api.leerConfiguracion()).some(k => k.indexOf('▸') === 0));
  ok('  ...y la clave queda en su sección: negocio bajo «Tu tienda», cobro_modo bajo «El cobro»',
     conf.indexOf('negocio') > conf.indexOf('▸ Tu tienda') && conf.indexOf('negocio') < conf.indexOf('▸ La venta') &&
     conf.indexOf('cobro_modo') > conf.indexOf('▸ El cobro'));
  // Una hoja vieja, sin secciones y con claves de más abajo, queda igual de legible
  const antes = JSON.stringify(g.api.leerConfiguracion());
  g.api.ordenarConfiguracion();
  ok('  ...y ordenar dos veces no cambia nada ni pierde un valor', JSON.stringify(g.api.leerConfiguracion()) === antes);

  // Listas en Configuración: todo lo sí/no y lo de opciones
  const filaC = k => g.filas('Configuración').findIndex(f => f[0] === k) + 1;
  const listaDe = k => ((fmt(g, 'Configuración', filaC(k), 2) || {}).validacion || {})._lista || [];
  ok('TODO LO QUE TIENE OPCIONES en Configuración es una lista: f_avisame, catalogo_columnas, logo_tamano, tienda_abierta',
     listaDe('f_avisame').join() === 'Sí,No' && listaDe('catalogo_columnas').join() === '3,4,5' &&
     listaDe('logo_tamano').join() === '40,80,120' && listaDe('tienda_abierta').join() === 'Sí,No',
     [listaDe('f_avisame'), listaDe('catalogo_columnas'), listaDe('logo_tamano')].map(x => x.join('/')).join(' · '));
  ok('  ...y el Formato del catálogo sugiere los de siempre y deja escribir otro',
     ((val2 => val2 && val2._lista.indexOf('Unidad') !== -1 && val2._permiteOtros)(fmt(g, 'Catálogo', 2, cc(g, 'Formato')).validacion)));

  // Lo que se escribe abajo queda dentro del formato
  ok('LO QUE SE AGREGA A MANO queda dentro del formato: la fila 900 del catálogo ya tiene lista y pesos',
     !!fmt(g, 'Catálogo', 900, cc(g, 'Activo')).validacion && fmt(g, 'Catálogo', 900, cc(g, 'Precio')).formato === '"$"#,##0');

  // Lo obligatorio se pinta
  const reglas = g.hojas.get('Catálogo')._reglas;
  const deCol = n => reglas.filter(x => x.rangos.some(rg => rg.c === cc(g, n)));
  ok('LO OBLIGATORIO SE PINTA: nombre, precio y activo de una fila con código, en rojo si faltan',
     ['Nombre', 'Precio', 'Activo'].every(n => deCol(n).length === 1 && /LEN\(TRIM\(\$A2\)\)>0/.test(deCol(n)[0].formula)),
     reglas.map(x => x.formula).join(' | '));
  ok('  ...y la fórmula mira la columna por su letra de hoy, no la de antes',
     deCol('Precio')[0] && deCol('Precio')[0].formula.indexOf('$' + String.fromCharCode(64 + cc(g, 'Precio')) + '2') !== -1,
     deCol('Precio')[0] && deCol('Precio')[0].formula);
  const rc = g.hojas.get('Configuración')._reglas;
  ok('  ...y en Configuración, las claves que bloquean la publicación',
     rc.length >= 8 && rc.some(x => x.rangos[0].f === filaC('negocio')) && rc.some(x => x.rangos[0].f === filaC('whatsapp')),
     rc.length + ' reglas');
  g.api.presentarHojas();
  ok('  ...y presentar dos veces no duplica las reglas', g.hojas.get('Catálogo')._reglas.length === reglas.length);
}

// ═══ 3c. 0.24.0 · Una hoja VIEJA se ordena sin perder nada ═══
{
  const g = crear('./as.js');
  // Como la dejaba la 0.23: el orden del código, con datos y una fórmula
  const viejo = g.api.ENCABEZADO_CATALOGO.slice();
  const h = g.libro.insertSheet('Catálogo');
  h.appendRow(viejo);
  h.appendRow(['vieja', 'Vieja', 'Unidad', 'Cosas', 5000, 7, 'desc', 'v.jpg', 'No', 'Sí', 'REF-1', 6000, 2, 'Talla: S|M']);
  h.getRange(2, 13).setFormula('=1+1');
  g.api.instalar();
  const d = g.hojas.get('Catálogo')._datos;
  const col = n => d[0].indexOf(n);
  ok('UNA HOJA VIEJA se ordena al instalar: cada dato sigue con su columna',
     d[0].join('|') === g.api.ORDEN_VISIBLE_CATALOGO.join('|') && d[1][col('Precio')] === 5000 &&
     d[1][col('Stock')] === 7 && d[1][col('Referencia')] === 'REF-1' && d[1][col('Variantes')] === 'Talla: S|M',
     d[0].join(' · '));
  ok('  ...y la fórmula viaja con su celda', g.hojas.get('Catálogo')._formulas.get('2,' + (col('Umbral bajo') + 1)) === '=1+1');
  const cat = JSON.parse(g.api.doGet({ parameter: { a: 'catalogo' } })._texto);
  ok('  ...y la tienda la lee igual que antes',
     (cat.productos || []).some(p => p.id === 'vieja' && p.precio === 5000 && p.referencia === 'REF-1'));

  // Un encabezado renombrado a mano: se lee como antes, por posición, y se dice
  const g2 = crear('./as.js');
  const h2 = g2.libro.insertSheet('Catálogo');
  const renombrado = viejo.slice(); renombrado[4] = 'Precio COP';
  h2.appendRow(renombrado);
  h2.appendRow(['otra', 'Otra', 'Unidad', 'Cosas', 8000, 3, '', '', 'No', 'Sí']);
  const cat2 = JSON.parse(g2.api.doGet({ parameter: { a: 'catalogo' } })._texto);
  ok('UNA COLUMNA RENOMBRADA no convierte un precio en otra cosa: se lee por posición, como antes',
     (cat2.productos || []).some(p => p.id === 'otra' && p.precio === 8000));
  g2.api.asegurarColumnas('Catálogo', g2.api.ENCABEZADO_CATALOGO);
  ok('  ...y no se le agrega un «Precio» vacío que le robaría la lectura',
     g2.hojas.get('Catálogo')._datos[0].filter(x => x === 'Precio').length === 0);
}

// ═══ 3d. 0.24.0 · Una tienda que ya existía se pone al día SOLA, cada hora, una vez por versión ═══
{
  const g = crear('./as.js');
  const h = g.libro.insertSheet('Catálogo');
  h.appendRow(g.api.ENCABEZADO_CATALOGO.slice(0, 10));      // una hoja de hace varias versiones
  h.appendRow(['vieja', 'Vieja', 'Unidad', 'Cosas', 5000, 7, 'desc', '', 'No', 'Sí']);
  g.libro.insertSheet('Hoja 1');
  const decir = console.log; console.log = () => {};
  g.api.revisionHoraria();
  console.log = decir;
  const d = g.hojas.get('Catálogo')._datos;
  ok('LA REVISIÓN DE CADA HORA pone la hoja al día sin A0_instalar: columnas nuevas, en su orden, y sin «Hoja 1»',
     d[0].join('|') === g.api.ORDEN_VISIBLE_CATALOGO.join('|') && d[1][d[0].indexOf('Stock')] === 7 && !g.hojas.has('Hoja 1'),
     d[0].join(' · '));
  ok('  ...y queda anotado para no repetirlo en la misma versión', g.props.HOJA_AL_DIA === (require('fs').readFileSync('./as.js', 'utf8').match(/var VERSION_TIENDA = '([^']+)'/) || [])[1]);
  const antes = g.escrituras.length;
  g.api.revisionHoraria();
  ok('  ...y la hora siguiente no vuelve a tocar la hoja', !g.escrituras.slice(antes).some(e => e.como === 'moveColumns'));
}

// ═══ 3d bis. 1.1.2 · Cambiar el nombre de la columna conserva las fotos ═══
{
  const g = crear('./as.js');
  const h = g.libro.insertSheet('Inventario por variante');
  const viejo = g.api.ENCABEZADO_INVENTARIO_VARIANTE.slice();
  viejo[6] = 'Imágenes';
  h.appendRow(viejo);
  h.appendRow(['vieja', 'Talla: S', '', '', '', '', 'vieja--talla-s-1.jpg']);
  const decir = console.log; console.log = () => {};
  g.api.ponerHojaAlDia(true);
  console.log = decir;
  const datos = h._datos;
  ok('LA ACTUALIZACIÓN RENOMBRA Imágenes A Foto en su sitio y conserva los nombres existentes',
     datos[0].includes('Foto') && !datos[0].includes('Imágenes') &&
     datos[1][datos[0].indexOf('Foto')] === 'vieja--talla-s-1.jpg',
     datos[0].join(' · ') + ' / ' + datos[1][datos[0].indexOf('Foto')]);
}

// ═══ 3e. 0.24.1 · Ordenar una Configuración VIEJA que ya tiene listas por fila (bitácora 111) ═══
{
  /* Como estaba una tienda de la 0.23: sin secciones, las claves en el orden
     en que nacieron, y con las listas de la 0.23 puestas EN SU FILA. Al meter
     las secciones, cada valor cambia de fila: «WhatsApp» caía en la fila que
     tenía Sí/No y Google lo rechazaba —y lo borrado antes ya no volvía—. */
  const g = crear('./as.js');
  const semilla = g.api.semillaDeConfiguracion();
  const h = g.libro.insertSheet('Configuración');
  h.appendRow(['Clave', 'Valor', 'Qué es']);
  semilla.forEach(f => h.appendRow([f[0], f[1], f[2]]));
  const fila = k => semilla.findIndex(f => f[0] === k) + 2;
  h.getRange(fila('cobro_modo'), 2).setValue('WhatsApp');
  h.getRange(fila('negocio'), 2).setValue('Mi Comercio');
  h.getRange(fila('sitio_url'), 2).setValue('https://mi.tienda.co');
  const lista = (ops) => g.api.lista(ops, false);
  // las listas de la 0.23, en la fila de su clave
  ['tienda_abierta', 'correo_siempre', 'fotos_webp', 'f_avisame', 'f_rastreo'].forEach(k => h.getRange(fila(k), 2).setDataValidation(lista(['Sí', 'No'])));
  h.getRange(fila('cobro_modo'), 2).setDataValidation(lista(['WhatsApp', 'Pasarela']));
  h.getRange(fila('cobro_ambiente'), 2).setDataValidation(lista(['Pruebas', 'Producción']));
  let error = '';
  const decir = console.log; console.log = () => {};
  try { g.api.instalar(); } catch (e) { error = e.message; }
  console.log = decir;
  const cfg = g.api.leerConfiguracion();
  ok('INSTALAR SOBRE UNA CONFIGURACIÓN VIEJA con listas por fila no revienta con «Elige de la lista»', !error, error);
  ok('  ...y no pierde ni un valor: cada clave sigue con lo suyo',
     cfg.cobro_modo === 'WhatsApp' && cfg.negocio === 'Mi Comercio' && cfg.sitio_url === 'https://mi.tienda.co' &&
     Object.keys(cfg).length >= semilla.length, [cfg.cobro_modo, cfg.negocio, cfg.sitio_url, Object.keys(cfg).length].join(' · '));
  const filaN = k => g.filas('Configuración').findIndex(f => f[0] === k) + 1;
  const val = k => ((fmt(g, 'Configuración', filaN(k), 2) || {}).validacion || {})._lista || [];
  ok('  ...y cada lista queda en la fila de SU clave después de ordenar',
     val('cobro_modo').join() === 'WhatsApp,Pasarela' && val('tienda_abierta').join() === 'Sí,No' &&
     val('negocio').length === 0, [val('cobro_modo'), val('tienda_abierta'), val('negocio')].map(x => x.join('/')).join(' · '));
}

// ═══ 4. Los colores se pintan, no se escriben ═══
{
  const g = nuevo();
  const h = g.hojas.get('Configuración');
  const claves = ['color_principal', 'color_secundario', 'color_alterno'];

  ok('Hay TRES colores de marca, no dos',
     claves.every(k => filaDe(g, k) > 0), claves.join(', '));
  ok('Cada celda de color se ve DEL color que dice', claves.every(k =>
       fmt(g, 'Configuración', filaDe(g, k), 2).fondo === valorDe(g, k)),
     claves.map(k => valorDe(g, k)).join(' '));
  ok('  ...con el texto en blanco o negro según se lea mejor',
     fmt(g, 'Configuración', filaDe(g, 'color_principal'), 2).color === '#FFFFFF',
     'sobre #D0211C');

  // Pintar la celda con el balde de Google
  h.getRange(filaDe(g, 'color_principal'), 2).setBackground('#F2C744');
  const cambios = g.api.sincronizarColores();
  ok('PINTAR LA CELDA escribe el código hexadecimal solo',
     valorDe(g, 'color_principal') === '#F2C744',
     String(valorDe(g, 'color_principal')));
  ok('  ...y avisa cuántos cambió', cambios === 1, String(cambios));
  ok('  ...con el texto oscuro, porque el amarillo es claro',
     fmt(g, 'Configuración', filaDe(g, 'color_principal'), 2).color === '#1A1A1A');
  ok('  ...y bota la caché, para que la tienda lo vea ya', !g.cache['catalogo']);

  // Escribir el código a mano
  h.getRange(filaDe(g, 'color_alterno'), 2).setValue('#123456');
  g.api.alEditar({ range: { getSheet: () => h, getColumn: () => 2, getNumColumns: () => 1 } });
  ok('ESCRIBIR el código pinta la celda, que es el camino contrario',
     fmt(g, 'Configuración', filaDe(g, 'color_alterno'), 2).fondo === '#123456',
     String(fmt(g, 'Configuración', filaDe(g, 'color_alterno'), 2).fondo));
  ok('  ...y lo escrito NO se pierde en el siguiente recálculo', (() => {
       g.api.sincronizarColores();
       return valorDe(g, 'color_alterno') === '#123456';
     })(), String(valorDe(g, 'color_alterno')));

  h.getRange(filaDe(g, 'color_secundario'), 2).setValue('no es un color');
  g.api.sincronizarColores();
  ok('Un valor que no es color no rompe nada', true);
}

// ═══ 5. El tercer color llega a la tienda ═══
{
  const g = nuevo();
  const c = JSON.parse(g.api.doGet({ parameter: { a: 'catalogo' } })._texto);
  ok('El catálogo le entrega los tres colores a la tienda',
     c.config.color_principal && c.config.color_secundario && c.config.color_alterno,
     [c.config.color_principal, c.config.color_secundario, c.config.color_alterno].join(' '));
}

// ═══ 6. El catálogo de respaldo se genera solo ═══
/* instalar() (A-5) deja solo dos EJEMPLO inactivos -no hay respaldo que
   generar con eso-, así que esta sección usa el catálogo de prueba de
   gas.js (ocho panes) en vez de nuevo() a secas. Son dos cosas distintas
   a propósito: ver el comentario en gas.js. */
{
  const g = configurar(nuevo());
  const b = g.api.generarInventario().bloque;

  ok('Genera el bloque con sus dos marcas',
     /CATÁLOGO DE RESPALDO/.test(b) && /FIN DEL CATÁLOGO DE RESPALDO/.test(b));
  ok('  ...y dice la VERSIÓN del maestro, no la fecha del día (A-6)',
     b.includes('versión ' + LA_VERSION) && !/\d{4}-\d{2}-\d{2}\s*═══/.test(b),
     (b.match(/CATÁLOGO DE RESPALDO[^\n]*/) || [''])[0]);
  /* LA MISMA FORMA QUE ESCRIBE EL FLUJO. Este es el camino de a mano y aquel el
     automático: si dejan el archivo distinto, un día la expresión regular del
     montaje encuentra una marca y no la otra. */
  ok('  ...y la configuración de la hoja, que es lo que se pinta antes de la red',
     /^const CONFIG_SEMILLA = \{$/m.test(b) && /"negocio":/.test(b),
     (b.match(/"negocio": "[^"]*"/) || [''])[0]);
  ok('  ...sin la llave de pago, que no va en la página',
     !/pago_llave|pago_titular|pago_entidad/.test(b));
  ok('Trae las dos listas que espera index.html',
     /^const ENVIOS = \[$/m.test(b) && /^const PRODUCTOS = \[$/m.test(b));

  // Lo importante: que sea JavaScript válido y con los datos de la hoja
  let ENVIOS = null, PRODUCTOS = null;
  try { const f = new Function(b + '\n; return {ENVIOS, PRODUCTOS};'); const r = f();
        ENVIOS = r.ENVIOS; PRODUCTOS = r.PRODUCTOS; } catch (e) { /* queda en null */ }
  ok('EL BLOQUE ES JAVASCRIPT VÁLIDO: se pega y funciona', !!PRODUCTOS && !!ENVIOS,
     PRODUCTOS ? PRODUCTOS.length + ' productos' : 'no compila');
  ok('  ...con los 8 productos activos de la hoja', PRODUCTOS && PRODUCTOS.length === 8,
     String(PRODUCTOS && PRODUCTOS.length));
  ok('  ...y las 5 zonas de envío', ENVIOS && ENVIOS.length === 5, String(ENVIOS && ENVIOS.length));
  ok('  ...con los precios y el stock de HOY',
     PRODUCTOS && PRODUCTOS[0].precio === 12000 && PRODUCTOS[0].stock === 30,
     PRODUCTOS ? PRODUCTOS[0].precio + ' / ' + PRODUCTOS[0].stock : '');
  /* EL DIBUJO DEL PRODUCTO SIN FOTO YA NO LO ESCRIBE EL MAESTRO.
     Lo calculaba aquí y lo metía dentro del respaldo; la página, para lo que
     llegaba en vivo, lo heredaba POR ID de ese respaldo con «tomate» de
     reserva. Dos sitios decidiendo lo mismo y uno mandando sobre el otro: un
     producto que no estuviera en el respaldo —o una tienda que no vende
     tomate— salía dibujado como un tomate. Ahora lo decide la página, en un
     solo sitio, desde el formato y la categoría. Se prueba allí:
     `pruebas/respaldo.js`. */
  ok('  ...y NO trae el dibujo: eso lo decide la página, en un solo sitio',
     PRODUCTOS && PRODUCTOS.every(p => p.forma === undefined),
     PRODUCTOS ? PRODUCTOS.map(p => p.forma).join(' ') || '(ninguno)' : '');

  ok('Un producto apagado NO entra al respaldo', (() => {
       const g2 = configurar(nuevo());
       g2.hojas.get('Catálogo').getRange(3, g2.columna('Catálogo', 'Activo')).setValue('No');   // croissant
       const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
       return r.length === 7 && !r.some(p => p.id === 'croissant');
     })());

  ok('Las comillas de una descripción no rompen el bloque', (() => {
       const g2 = configurar(nuevo());
       g2.hojas.get('Catálogo').getRange(2, g2.columna('Catálogo', 'Descripción'))
         .setValue('Dice "el mejor" y usa \\ barra y\nsalto de línea');
       try {
         const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
         return /el mejor/.test(r[0].descripcion) && !/\n/.test(r[0].descripcion);
       } catch (e) { return false; }
     })());

  ok('Las fotos salen separadas, no en un solo texto con barras', (() => {
       const g2 = configurar(nuevo());
       g2.hojas.get('Catálogo').getRange(2, g2.columna('Catálogo', 'Imágenes'))
         .setValue('https://res.cloudinary.com/a.jpg|https://res.cloudinary.com/b.jpg');
       const r = new Function(g2.api.generarInventario().bloque + '\n; return PRODUCTOS;')();
       return r[0].imagenes.length === 2 && r[0].imagenes[1] === 'https://res.cloudinary.com/b.jpg';
     })());

  const paquete = g.api.generarInventario();
  ok('Devuelve la ventana lista para que el stub la muestre',
     paquete.tipo === 'html' && /Catálogo de respaldo/.test(paquete.titulo), paquete.titulo);
  ok('  ...con su botón y el conteo de lo que trae',
     /<button/.test(paquete.html) && /<b>8 productos<\/b>/.test(paquete.html));
  ok('  ...y dice claramente que NO es obligatorio',
     /no es obligatorio/i.test(paquete.html));
}

// ═══ 7. Nada de esto puede romper lo que ya andaba ═══
{
  const g = nuevo();
  ok('presentarHojas() se puede ejecutar mil veces', (() => {
       try { g.api.presentarHojas(); g.api.presentarHojas(); g.api.presentarHojas(); }
       catch (e) { return false; }
       return g.filas('Catálogo').length === 3;    // encabezado + 2 EJEMPLO (A-5)
     })(), (g.filas('Catálogo').length - 1) + ' productos');
  ok('  ...y no toca ni un dato',
     g.filas('Catálogo')[1][1] === 'Producto de ejemplo — edítalo o bórralo' &&
     g.filas('Catálogo')[1][4] === 19900);
  ok('El menú la llama al actualizar', (() => {
       const g2 = nuevo();
       g2.hojas.get('Catálogo')._formato.clear();
       g2.api.actualizarTodo();
       return fmt(g2, 'Catálogo', 1, 1).fondo === '#1B5E3A';
     })());
  ok('Una hoja que no existe no la hace reventar', (() => {
       const g2 = nuevo();
       g2.hojas.delete('Errores');
       try { g2.api.presentarHojas(); return true; } catch (e) { return false; }
     })());
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
