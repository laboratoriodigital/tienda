/* ============================================================================
   ¿El sitio de Cloudflare tiene nombre propio? (montar/revisar-worker.mjs)
   ----------------------------------------------------------------------------
   Historia A-3 (docs/PLAN-MVP.md): "Aserción: name distinto de la semilla en
   cualquier repositorio de tienda." Esto prueba la función pura veredicto(),
   sin tocar el sistema de archivos ni variables de entorno reales.
   ============================================================================ */
const { veredicto, nombreEnWrangler } = require('../montar/revisar-worker.mjs');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

ok('nombreEnWrangler lee el name entre comillas',
   nombreEnWrangler('{\n  "name": "la-espiga",\n  "compatibility_date": "x"\n}') === 'la-espiga');
ok('  ...y no revienta si no hay ninguno', nombreEnWrangler('{}') === '');
ok('  ...ni si el texto no es JSON de verdad', nombreEnWrangler('esto no es json') === '');

ok('FUERA DE ACTIONS no hay con qué comparar, y no bloquea',
   veredicto('tienda-sin-configurar', '').estado === 'sin-contexto');
ok('  ...tampoco si el repo llega undefined',
   veredicto('tienda-sin-configurar', undefined).estado === 'sin-contexto');

ok('LA PROPIA SEMILLA puede seguir diciendo el marcador',
   veredicto('tienda-sin-configurar', 'laboratoriodigital/tienda').estado === 'es-la-semilla');
ok('  ...aunque alguien le haya puesto otro nombre por error, sigue sin bloquear',
   veredicto('cualquier-cosa', 'laboratoriodigital/tienda').estado === 'es-la-semilla');

ok('UNA TIENDA REAL con el marcador de fábrica SÍ bloquea',
   veredicto('tienda-sin-configurar', 'cliente/su-tienda').estado === 'sin-configurar');
ok('  ...y si no hay name en absoluto, también',
   veredicto('', 'cliente/su-tienda').estado === 'vacio');
ok('  ...pero con un nombre propio, no bloquea',
   veredicto('la-espiga', 'cliente/su-tienda').estado === 'configurado');
ok('  ...y lo dice, para que el mensaje pueda confirmarlo',
   veredicto('la-espiga', 'cliente/su-tienda').nombre === 'la-espiga');

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
