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

/* 0.20.2 · UNO QUE SIRVE SE RESPETA; UNO MUERTO, NO (bitácora 89). Antes se
   respetaba siempre, y entonces rotar `DISPARO_TOKEN` no arreglaba nada: la
   tienda se quedaba con el vencido y seguía diciendo que el permiso no sirve.
   Ahora se le pregunta a GitHub por el repositorio de ESTA tienda con el token
   que ya está guardado, y se decide con la respuesta. */
/* Una sola ruta y una variable: `responder` se queda con la PRIMERA que
   encaje, así que volver a registrarla no cambia nada. */
let contestaGitHub = { codigo: 200, cuerpo: { full_name: 'x/y' } };
/* 0.21.0 · Y SE GUARDA POR QUÉ SE PREGUNTÓ (bitácora 97): la comprobación
   preguntaba `GET /repos/{tienda}`, que solo demuestra *Metadata: read*. Un
   token que ve el repositorio y no puede disparar nada pasaba la prueba, se
   respetaba, y el comercio seguía viendo «el permiso no sirve o se venció»
   cada vez que tocaba Publicar. */
let preguntado = '';
g.responder('api.github.com/repos/', (url) => { preguntado = url; return contestaGitHub; });
const r2 = post(g, { a: 'permiso', t: g.token, tk: otro });
ok('UNO QUE SIRVE no se pisa (puede ser uno más acotado)',
   r2.ok && !r2.puesto && r2.yaEstaba && r2.servia === true && g.props.GITHUB_TOKEN === tk);
ok('  ...salvo que se pida forzar', post(g, { a: 'permiso', t: g.token, tk: otro, forzar: 'si' }).puesto && g.props.GITHUB_TOKEN === otro);
ok('  ...y para juzgarlo se pregunta por los FLUJOS, que es lo que este token tiene que poder',
   /\/actions\/workflows$/.test(preguntado),
   preguntado || 'no preguntó nada');

/* Y el caso que trajo todo esto: el guardado ya no vale. */
contestaGitHub = { codigo: 401, cuerpo: { message: 'Bad credentials' } };
const nuevo = 'github_pat_' + 'Q1w2E3r4T5y6U7i8O9p0A1s2D3f4';
const r3 = post(g, { a: 'permiso', t: g.token, tk: nuevo });
ok('UNO VENCIDO se reemplaza sin forzar nada: rotar el token vuelve a servir',
   r3.ok && r3.puesto && r3.reemplazado && r3.servia === false && g.props.GITHUB_TOKEN === nuevo);
ok('  ...y el mismo token dos veces no cuenta como reemplazo',
   (() => { const r = post(g, { a: 'permiso', t: g.token, tk: nuevo });
            return r.ok && !r.puesto && r.mismo === true; })());
ok('  ...y queda anotado por qué se reemplazó',
   /ya no servía/.test(JSON.stringify(g.filas('Errores') || [])));
console.log = () => {};
const d = JSON.stringify(g.api.diagnostico(false));
console.log = decir;
ok('EL DIAGNÓSTICO dice dónde está conectar', /github\.com\/laboratoriodigital\/tiendas\/actions\/workflows\/conectar\.yml/.test(d));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
