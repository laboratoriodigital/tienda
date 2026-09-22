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

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
