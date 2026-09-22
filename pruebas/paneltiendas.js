/* 0.17.0 — la hoja de administración de tiendas: las tiendas nuevas se
 * registran solas.
 * ---------------------------------------------------------------------------
 * `conectar` (repositorio de servicio) le manda a esta hoja, por su aplicación
 * web y con una clave, el servicio, el token, el repositorio, el comercio, la
 * dirección y el producto. Lo que se prueba:
 *
 *   · SIN LA CLAVE no entra nada; con una URL que no es /exec, tampoco.
 *   · UNA TIENDA NUEVA se agrega «En montaje», con su producto.
 *   · UNA QUE YA ESTÁ se actualiza (servicio, token, dirección, producto) y lo
 *     que escribió el operador —contacto, plan, precio, notas— no se toca.
 *
 *   node pruebas/paneltiendas.js
 */
const { crear } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const decir = console.log; console.log = () => {};
const g = crear('./pn.js'); g.api.instalar();
console.log = decir;
const post = o => JSON.parse(g.api.doPost({ postData: { contents: JSON.stringify(o) } })._texto || g.api.doPost({ postData: { contents: JSON.stringify(o) } }).getContent());
console.log = () => {};
const clave = g.api.claveParaElAlta();
console.log = decir;
const tienda = { a: 'registrar_tienda', clave, comercio: 'Café La Esquina', repo: 'laboratoriodigital/cafe-la-esquina',
  sitio: 'https://cafe-la-esquina.laboratorio-digital.com', producto: 'Tienda Panel',
  servicio: 'https://script.google.com/macros/s/AKfy-cafe/exec', token: 'tk-cafe1' };
const filas = () => g.filas('Tiendas');
const de = repo => filas().find(f => f[13] === repo);

ok('LA CLAVE queda en las propiedades, no en la hoja', g.props.CLAVE_ALTA === clave && JSON.stringify(filas()).indexOf(clave) === -1);
ok('SIN LA CLAVE no entra nada', !post(Object.assign({}, tienda, { clave: 'otra' })).ok && !de(tienda.repo));
ok('  ...ni un servicio que no es /exec', !post(Object.assign({}, tienda, { servicio: 'https://evil.example/exec' })).ok && !de(tienda.repo));
const r = post(tienda);
const f = de(tienda.repo) || [];
ok('UNA TIENDA NUEVA se agrega En montaje, con todo lo que trae conectar', r.ok && r.nueva && f[0] === 'En montaje' && f[1] === 'Café La Esquina' &&
   f[9] === tienda.sitio && f[10] === tienda.servicio && f[11] === 'tk-cafe1' && f[15] === 'Tienda Panel', JSON.stringify(f));
const linea = filas().findIndex(x => x[13] === tienda.repo) + 1;  // g.filas() trae el encabezado
const h = g.hojas.get('Tiendas');
h.getRange(linea, 3).setValue('Doña Rosa'); h.getRange(linea, 6).setValue('Estándar'); h.getRange(linea, 15).setValue('Paga el 5');
const r2 = post(Object.assign({}, tienda, { servicio: 'https://script.google.com/macros/s/AKfy-cafe2/exec', token: 'tk-cafe2' }));
const f2 = de(tienda.repo) || [];
ok('UNA QUE YA ESTÁ se actualiza (servicio y token), sin duplicarse', r2.ok && !r2.nueva && filas().filter(x => x[13] === tienda.repo).length === 1 &&
   f2[10].endsWith('cafe2/exec') && f2[11] === 'tk-cafe2');
ok('  ...y lo que escribió el operador no se toca', f2[2] === 'Doña Rosa' && f2[5] === 'Estándar' && f2[14] === 'Paga el 5');
ok('  ...y queda en la bitácora del panel', /conectar registró Café La Esquina/.test(JSON.stringify(g.filas('Bitácora'))));
ok('LA COLUMNA NUEVA va al final (R1)', g.api.COL_TIENDAS[g.api.COL_TIENDAS.length - 1] === 'Producto' && g.api.COL_TIENDAS[14] === 'Notas');

/* ═══ EL PORTAL (0.18.0 · bitácora 78) ═══
   «No veo por dónde se entra»: ahora se entra por el menú de esta hoja, y lo
   que se ve es una pantalla con cada tienda y sus enlaces. Lo que se vigila
   aquí es que el portal NO consulte a las tiendas al abrirse —pinta lo de la
   última actualización— y que escape lo que escribió el operador. */
console.log = () => {};
g.api.onOpen();
console.log = decir;
ok('EL PORTAL se abre desde el menú de la hoja',
   g.menu.some(x => x[0] === 'Abrir el portal' && x[1] === 'abrirPortal'),
   JSON.stringify(g.menu.map(x => x[0])));

const peticionesAntes = g.peticiones.length;
const tiendasPortal = [
  { comercio: 'Café La Esquina', estado: 'Activa', producto: 'Tienda Panel', precio: 60000,
    sitio: 'https://cafe.ejemplo/', repo: 'lab/cafe', notas: 'Paga el 5', token: 'tk', servicio: 'x' },
  { comercio: 'Cinnamon <b>', estado: 'Pausada', producto: 'Tienda Básica', precio: 0,
    sitio: '', repo: 'lab/cinnamon', notas: '' },
  { comercio: 'La que se fue', estado: 'Cancelada', producto: '', precio: 99, sitio: '', repo: '', notas: '' }
];
const metricasPortal = [['Café La Esquina', 'En línea', '0.18.0']];
const html = g.api.portalHtml(tiendasPortal, metricasPortal, { dueno: 'lab' });

ok('  ...con cada tienda viva, y sin las canceladas',
   /Café La Esquina/.test(html) && /Cinnamon/.test(html) && !/La que se fue/.test(html));
ok('  ...y lleva a las acciones de la flota y a las de cada tienda',
   /workflows\/alta\.yml/.test(html) && /workflows\/conectar\.yml/.test(html) &&
   /lab\/cafe\/actions\/workflows\/montaje\.yml/.test(html) &&
   /lab\/cafe\/actions\/workflows\/restaurar\.yml/.test(html));
ok('  ...el panel solo de la Tienda Panel: la Básica no tiene admin.html',
   /cafe\.ejemplo\/admin\.html/.test(html) && !/cinnamon.*admin\.html/i.test(html));
ok('  ...escapa lo que escribió el operador', /Cinnamon &lt;b&gt;/.test(html) && !/Cinnamon <b>/.test(html));
ok('  ...y ABRIRLO NO CONSULTA a ninguna tienda: pinta lo de la última actualización',
   g.peticiones.length === peticionesAntes);
ok('  ...y dice dónde se restauran los datos, que no es aquí',
   /A6_restaurarDatos/.test(html));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
