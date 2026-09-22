/* 0.17.0 — «Falta HOJA_ID» con el ID pegado (bitácora 74).
 * ---------------------------------------------------------------------------
 * La aplicación web corre la versión IMPLEMENTADA. Si el ID se pegó después de
 * implementar, el editor lo tiene —y el diagnóstico sale bien— pero la tienda
 * y `conectar` contestan «Falta HOJA_ID». Desde la 0.17.0, A0_instalar deja el
 * ID en las propiedades del script, que son de todas las versiones, y el
 * maestro lo lee de ahí si la constante llega vacía.
 *
 *   node pruebas/hojaid.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const decir = console.log;
console.log = () => {};
const g = crear('./as.js'); g.api.instalar(); configurar(g);
console.log = decir;
ok('A0_INSTALAR deja el ID de la hoja en las propiedades del script', g.props.HOJA_ID === g.api.HOJA_ID && !!g.props.HOJA_ID, g.props.HOJA_ID);

// La versión implementada, sin el ID en la constante, pero con la propiedad ya guardada
const v = crear('./as.js', { hojaId: '', props: { HOJA_ID: g.props.HOJA_ID } });
ok('UNA VERSIÓN SIN EL ID en la constante lo toma de la propiedad', v.api.HOJA_ID === g.props.HOJA_ID);
const id = JSON.parse(v.api.doGet({ parameter: { a: 'identidad', t: v.api.token() } })._texto);
ok('  ...y `identidad` abre su hoja (lo que pregunta conectar)', id.ok && id.hojaOk && id.hojaId === g.props.HOJA_ID, JSON.stringify(id).slice(0, 120));

const nada = crear('./as.js', { hojaId: '' });
let msg = '';
try { nada.api.elLibro(); } catch (e) { msg = e.message; }
ok('SIN NINGUNO DE LOS DOS, el error dice las dos salidas: A0_instalar, o implementar una versión nueva',
   /A0_instalar/.test(msg) && /Nueva versión/.test(msg), msg);
const constante = crear('./as.js', { props: { HOJA_ID: 'otra-hoja' } });
ok('LA CONSTANTE, si está, manda sobre la propiedad', constante.api.HOJA_ID !== 'otra-hoja');

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
