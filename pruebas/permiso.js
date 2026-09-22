/* 0.16.0 · 3.4 — sembrar el permiso de GitHub desde el alta.
 * ---------------------------------------------------------------------------
 * `conectar` (repositorio de servicio) le pone al maestro el GITHUB_TOKEN con
 * el que Publicar y Actualizar disparan los flujos. Era el último paso a mano
 * del alta, además de CLASPRC. Lo que se prueba: solo con el token de montaje
 * y por POST, solo algo con forma de token de GitHub, no pisa uno puesto
 * (salvo forzar), y el Diagnóstico dice dónde está `conectar`.
 *
 *   node pruebas/permiso.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const decir = console.log; console.log = () => {};
const g = crear('./as.js'); g.api.instalar(); configurar(g);
console.log = decir;
const tk = 'github_pat_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4';

ok('SIN EL TOKEN DE MONTAJE no se pone nada', !post(g, { a: 'permiso', tk }).ok && !g.props.GITHUB_TOKEN);
ok('  ...ni por GET: el permiso no viaja en una dirección', !j(g.api.doGet({ parameter: { a: 'permiso', t: g.token, tk } })).ok && !g.props.GITHUB_TOKEN);
ok('  ...ni algo que no sea un token de GitHub', !post(g, { a: 'permiso', t: g.token, tk: 'hola' }).ok && !g.props.GITHUB_TOKEN);
const r = post(g, { a: 'permiso', t: g.token, tk });
ok('CON EL TOKEN DE MONTAJE queda puesto, y no se repite en la respuesta', r.ok && r.puesto && g.props.GITHUB_TOKEN === tk && JSON.stringify(r).indexOf(tk) === -1);
ok('  ...y queda anotado', JSON.stringify(g.filas('Errores') || []).indexOf('Permiso de GitHub puesto') !== -1);
const otro = 'github_pat_' + 'Z9y8X7w6V5u4T3s2R1q0P9o8N7m6';
const r2 = post(g, { a: 'permiso', t: g.token, tk: otro });
ok('UNO YA PUESTO no se pisa (puede ser uno más acotado)', r2.ok && !r2.puesto && r2.yaEstaba && g.props.GITHUB_TOKEN === tk);
ok('  ...salvo que se pida forzar', post(g, { a: 'permiso', t: g.token, tk: otro, forzar: 'si' }).puesto && g.props.GITHUB_TOKEN === otro);
console.log = () => {};
const d = JSON.stringify(g.api.diagnostico(false));
console.log = decir;
ok('EL DIAGNÓSTICO dice dónde está conectar', /github\.com\/laboratoriodigital\/tiendas\/actions\/workflows\/conectar\.yml/.test(d));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
