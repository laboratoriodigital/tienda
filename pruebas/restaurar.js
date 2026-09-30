/* 0.18.0 — volver atrás: los datos (bitácora 77).
 * ---------------------------------------------------------------------------
 * Había ocho copias semanales en el Drive y ninguna manera de volver a una sin
 * pegar celdas a mano. A5_respaldos las lista; A6_restaurarDatos devuelve una
 * o varias pestañas a como estaban. Lo que esta batería vigila no es que
 * funcione —eso es una línea—, sino lo que tiene que ser IMPOSIBLE:
 *
 *   · restaurar Pedidos (y Pagos, y Avísame): traer el domingo un miércoles
 *     borra las ventas del lunes y el martes para arreglar un catálogo;
 *   · restaurar sin decir qué: una lista vacía no es «todas»;
 *   · restaurar de la copia de OTRA tienda;
 *   · restaurar sin dejar antes una copia de lo que se está pisando.
 *
 *   node pruebas/restaurar.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const decir = console.log;
console.log = () => {};
const g = crear('./as.js');
g.enDrive('CARPETA-DE-PRUEBA', []);
g.api.instalar(); configurar(g);
console.log = decir;

const CARPETA = 'CARPETA-DE-PRUEBA';
const error = f => { try { f(); return ''; } catch (e) { return e.message; } };
const filas = n => g.filas(n) || [];

// Una copia de la semana pasada: el catálogo con dos productos, y el comercio es el mismo.
const COPIA = {
  'Catálogo': [filas('Catálogo')[0] || ['id'], ['pan-viejo', 'Pan de ayer'], ['bollo', 'Bollo']],
  'Configuración': [['clave', 'valor'], ['negocio', 'Panadería La Espiga'], ['whatsapp', '573001112233']],
  'Pedidos': [['codigo'], ['P-1']]
};
console.log = () => {};
g.enDrive(CARPETA, [{ id: 'copia-vieja', nombre: 'Copia_de_Orgánico — pedidos_2026-09-14', creado: '2026-09-14T10:00:00Z' }]);
g.otroLibro('copia-vieja', COPIA, 'Copia_de_Orgánico — pedidos_2026-09-14');
console.log = decir;

const lista = g.api.listarRespaldos();
ok('LAS COPIAS DE ESTA HOJA se listan, la más nueva primero',
   lista.length === 1 && lista[0].id === 'copia-vieja', JSON.stringify(lista.map(x => x.nombre)));

ok('NO SE PUEDE RESTAURAR Pedidos, ni Pagos, ni el Registro',
   /Pedidos/.test(error(() => g.api.restaurarDatos('ultimo', 'Pedidos'))) &&
   /no lo que se configuró/.test(error(() => g.api.restaurarDatos('ultimo', 'Pagos'))),
   error(() => g.api.restaurarDatos('ultimo', 'Pedidos')).slice(0, 80));
ok('  ...ni sin decir qué pestañas: una lista vacía NO es «todas»',
   /Dime qué pestañas/.test(error(() => g.api.restaurarDatos('ultimo', ''))) &&
   filas('Catálogo').length > 3);
ok('  ...y la lista de lo que sí se puede incluye las variantes (no se quedó a medias)',
   g.api.pestanasRestaurables().length === 5 && g.api.pestanasRestaurables().every(x => x && x.trim()),
   g.api.pestanasRestaurables().join(', '));

const antes = filas('Catálogo').filter(f => String(f[0] || '').trim()).length;
console.log = () => {};
const r = g.api.restaurarDatos('ultimo', 'Catálogo');
console.log = decir;
const ahora = filas('Catálogo').filter(f => String(f[0] || '').trim());
ok('RESTAURAR UNA PESTAÑA la deja como estaba en la copia', r.ok && ahora.length === 3 &&
   ahora[1][0] === 'pan-viejo' && antes !== ahora.length, antes + ' filas → ' + ahora.length);
ok('  ...y ANTES guarda una copia de lo que se está pisando',
   !!r.seguridad && g.carpetaDrive(CARPETA).some(x => x.id !== 'copia-vieja'),
   JSON.stringify(g.carpetaDrive(CARPETA).map(x => x.nombre)));
ok('  ...y lo que no se pidió no se toca: Pedidos sigue siendo el de hoy',
   filas('Pedidos').length !== 2 || (filas('Pedidos')[1] || [])[0] !== 'P-1');
ok('  ...y queda anotado en el Registro y en las propiedades',
   /Restaurado desde una copia/.test(JSON.stringify(filas('Registro'))) &&
   g.api.ultimaRestauracion().desde === lista[0].nombre);

// La copia de OTRA tienda: el nombre se puede cambiar a mano; el comercio no.
console.log = () => {};
g.enDrive(CARPETA, [{ id: 'copia-ajena', nombre: 'Copia_de_Orgánico — pedidos_2026-09-07', creado: '2026-09-07T10:00:00Z' }]);
g.otroLibro('copia-ajena', { 'Catálogo': [['id'], ['ajeno', 'De otra tienda']],
                             'Configuración': [['clave', 'valor'], ['negocio', 'Cinnamon Beauty']] });
console.log = decir;
const ajena = error(() => g.api.restaurarDatos('ultimo', 'Catálogo'));
ok('UNA COPIA DE OTRA TIENDA no entra, aunque el nombre encaje',
   /Cinnamon Beauty/.test(ajena) && !/ajeno/.test(JSON.stringify(filas('Catálogo'))), ajena.slice(0, 90));

ok('SE PIDE POR NÚMERO, por nombre o por id, y «ultimo» es la más nueva',
   /Solo hay 1 copias/.test(error(() => g.api.restaurarDatos('7', 'Catálogo'))) &&
   /No encuentro esa copia/.test(error(() => g.api.restaurarDatos('la-de-mayo', 'Catálogo'))));

/* ═══ Lo que decide el flujo `restaurar`: el sitio y la versión ═══ */
// 0.24.1 · Una copia de ANTES de las secciones (bitácora 111): las claves en otro
// orden, así que cada valor cae en una fila cuya lista es de otra clave. Google
// rechaza el valor aunque lo escriba el script; restaurar no puede reventar a
// medias ni dejar Configuración vacía, y las listas tienen que volver a su clave.
{
  const g2 = crear('./as.js');
  g2.enDrive('CARPETA-DE-PRUEBA', []);
  console.log = () => {};
  g2.api.instalar(); configurar(g2);
  const vivas = g2.filas('Configuración').slice(1).filter(f => f[0] && !String(f[0]).startsWith('▸'));
  const copia = [['Clave', 'Valor', 'Qué es']].concat(vivas.slice().reverse().map(f => {
    const v = f[0] === 'cobro_modo' ? 'Pasarela' : f[0] === 'cobro_ambiente' ? 'Producción' : f[1];
    return [f[0], v, f[2]];
  }));
  g2.enDrive('CARPETA-DE-PRUEBA', [{ id: 'copia-023', nombre: 'Copia_de_Orgánico — pedidos_2026-09-21', creado: '2026-09-21T10:00:00Z' }]);
  g2.otroLibro('copia-023', { 'Configuración': copia }, 'Copia_de_Orgánico — pedidos_2026-09-21');
  let fallo = '';
  try { g2.api.restaurarDatos('ultimo', 'Configuración'); } catch (e) { fallo = e.message; }
  console.log = decir;
  const cfg = g2.api.leerConfiguracion();
  ok('RESTAURAR UNA CONFIGURACIÓN de otro orden no revienta con «Elige de la lista»', !fallo, fallo);
  ok('  ...y cada clave queda con el valor de la copia',
     cfg.cobro_modo === 'Pasarela' && cfg.cobro_ambiente === 'Producción' &&
     vivas.every(f => f[0] === 'cobro_modo' || f[0] === 'cobro_ambiente' || String(cfg[f[0]] ?? '') === String(f[1] ?? '') || f[0] === 'color_principal' || f[0] === 'color_secundario' || f[0] === 'color_alterno'),
     [cfg.cobro_modo, cfg.cobro_ambiente].join(' · '));
  const filaN = k => g2.filas('Configuración').findIndex(f => f[0] === k) + 1;
  const val = k => (((g2.hojas.get('Configuración')._formato.get(filaN(k) + ',2') || {}).validacion) || {})._lista || [];
  ok('  ...y las listas vuelven a la fila de SU clave, y las secciones también',
     val('cobro_modo').join() === 'WhatsApp,Pasarela' && val('negocio').length === 0 &&
     g2.filas('Configuración').some(f => String(f[0]).startsWith('▸')),
     [val('cobro_modo').join('/'), val('negocio').join('/')].join(' · '));
}

(async () => {
  const fs = require('fs');
  const v = await import('../montar/volver-atras.mjs');

  const sinPalabra = v.loQueSePide({ que: 'el-sitio', hasta: '', confirmar: '' });
  ok('SIN ESCRIBIR «RESTAURAR» no se restaura nada',
     sinPalabra.errores.length === 1 && /RESTAURAR/.test(sinPalabra.errores[0]));
  ok('  ...ni con un commit o una versión que no tienen esa forma',
     v.loQueSePide({ que: 'la-version', hasta: '0.16', confirmar: 'RESTAURAR' }).errores.length === 1 &&
     v.loQueSePide({ que: 'el-sitio', hasta: 'https://github.com/x/y', confirmar: 'RESTAURAR' }).errores.length === 1 &&
     v.loQueSePide({ que: 'el-sitio', hasta: 'a1b2c3d', confirmar: 'RESTAURAR' }).errores.length === 0);

  const log = ['ddd4444 2026-09-22 refactor/frontend: el catálogo',
               'ccc3333 2026-09-21 refactor/frontend: fotos nuevas',
               'bbb2222 2026-09-20 refactor/frontend: el primer montaje'].join('\n');
  const anterior = v.elCommitAnterior(log, '');
  ok('EL SITIO VUELVE al commit anterior que tocó publicar/, no al commit anterior a secas',
     anterior.commit.sha === 'ccc3333' && anterior.ahora.sha === 'ddd4444');
  ok('  ...o al que se pida, si de verdad publicó',
     v.elCommitAnterior(log, 'bbb2222').commit.sha === 'bbb2222' &&
     /no tocó/.test(v.elCommitAnterior(log, 'aaa0000').error));
  ok('  ...y con una sola publicación lo dice en vez de inventarse una',
     /no hay ningún sitio anterior/.test(v.elCommitAnterior('ddd4444 2026-09-22 el primer montaje', '').error));

  const etiquetas = ['v0.18.0', 'v0.17.0', 'v0.16.0', 'v0.14.0', 'sin-v'];
  ok('LA VERSIÓN VUELVE a la anterior a la de ESTA tienda, no a la penúltima publicada',
     v.laVersionAnterior(etiquetas, 'v0.17.0').version === 'v0.16.0' &&
     v.laVersionAnterior(etiquetas, 'v0.16.0').version === 'v0.14.0',
     JSON.stringify(v.laVersionAnterior(etiquetas, 'v0.16.0')));
  ok('  ...y en la más antigua lo dice, en vez de dejar a la tienda sin código',
     /más antigua/.test(v.laVersionAnterior(['v0.14.0'], 'v0.14.0').error));

  ok('EL RESUMEN dice que la historia no se reescribe, y que los datos son otra cosa',
     /también se puede deshacer/.test(v.informe({ que: 'el-sitio', desde: 'ddd4444', hasta: 'ccc3333' })) &&
     /A6_restaurarDatos/.test(v.informe({ que: 'la-version', desde: 'v0.17.0', hasta: 'v0.16.0' })));

  const flujo = fs.readFileSync('../.github/workflows/restaurar.yml', 'utf8');
  ok('EL FLUJO `restaurar` viaja a cada tienda y no pide secretos nuevos',
     /"\.github\/workflows\/restaurar\.yml"/.test(fs.readFileSync('../semilla.json', 'utf8')) &&
     !/secrets\.(?!SEMILLA_TOKEN)[A-Z_]+/.test(flujo.replace(/github\.token/g, '')));
  ok('  ...y no reescribe la historia: publica un commit encima',
     /git commit/.test(flujo) && !/--force/.test(flujo) && !/push --force/.test(flujo));
  ok('  ...y para la versión no se inventa el procedimiento: se lo pide a montaje',
     /gh workflow run montaje\.yml/.test(flujo) && /semilla=true/.test(flujo));

  /* bitácora 106: con git DE VERDAD, lo que hace volver-atras.mjs y la
     pregunta que hace el flujo. Comparar el árbol con el índice daba «Ya estaba
     así» siempre, porque `git checkout <commit> -- publicar/` deja los dos
     iguales. */
  {
    const { execFileSync } = require('child_process');
    const os = require('os'), path = require('path');
    const cond = (flujo.match(/if (git diff --quiet[^;]*-- publicar\/);/) || [])[1] || '';
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'restaurar-'));
    const git = (...a) => execFileSync('git', a, { cwd: d, stdio: 'pipe' }).toString().trim();
    git('init', '-q'); git('config', 'user.email', 'x@x'); git('config', 'user.name', 'x');
    fs.mkdirSync(path.join(d, 'publicar'));
    fs.writeFileSync(path.join(d, 'publicar/index.html'), 'antes\n');
    git('add', '-A'); git('commit', '-qm', 'antes'); const viejo = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(d, 'publicar/index.html'), 'despues\n');
    git('add', '-A'); git('commit', '-qm', 'despues');
    const igual = () => { try { execFileSync('bash', ['-c', cond], { cwd: d, stdio: 'pipe' }); return true; } catch { return false; } };
    const sinCambios = igual();
    git('checkout', viejo, '--', 'publicar/');
    const trasVolver = igual();
    ok('EL SITIO DE ANTES se publica de verdad: tras traer publicar/ del commit viejo, el flujo ve que difiere de lo publicado',
       !!cond && sinCambios === true && trasVolver === false,
       'condición «' + cond + '» · sin cambios: ' + sinCambios + ' · tras volver: ' + trasVolver);
    ok('  ...y corre en el mismo grupo que montaje y fotos: los tres escriben publicar/ en main',
       /group: tienda-\$\{\{ github\.repository \}\}/.test(flujo));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
