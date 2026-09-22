/* 0.14.0 — la tienda se actualiza sola, cuando el dueño lo pide.
 * ---------------------------------------------------------------------------
 * «Actualizar la tienda» (panel o menú de la hoja) dispara `montaje` con
 * `semilla: true`: trae la última versión publicada de la semilla, publica el
 * maestro si cambió, rehornea, corre TODAS las baterías y solo entonces
 * publica todo junto. Si algo falla después de publicar el maestro, vuelve
 * atrás solo. Lo que se prueba:
 *
 *   · EL MAESTRO sabe su versión (la del package.json) y pregunta la última a
 *     GitHub; si no puede saberla, lo dice en vez de decir «estás al día».
 *   · SOLO EL DUEÑO actualiza, y lo que se dispara es montaje con la semilla.
 *   · LA SEMILLA SOBRE LA TIENDA, de punta a punta con repositorios de
 *     juguete: lo que la tienda no tocó se trae, lo que cambiaron las dos no se
 *     toca, publicar/ no se toca, y las salidas dicen si hay maestro nuevo.
 *   · EL FLUJO: la semilla antes de las dependencias, el maestro sin PUBLICAR
 *     si lo trae la semilla, todas las baterías, y la vuelta atrás.
 *
 *   node pruebas/actualizar.js      (la última parte abre un navegador)
 */
const { crear, configurar } = require('./gas.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-actualizar-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);
const maestro = fs.readFileSync('../maestro.gs', 'utf8');
const semilla = JSON.parse(fs.readFileSync('../semilla.json', 'utf8'));
const paquete = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');

function tienda() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const poner = (c, v) => g.hojas.get('Configuración').getRange(g.filas('Configuración').findIndex(f => String(f[0]) === c) + 1, 2).setValue(v);
  poner('panel_usuario', 'dona.rosa');
  poner('repositorio', 'laboratorio/mitienda');
  g.props.GITHUB_TOKEN = 'github_pat_de_prueba';
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  const disparos = [];
  return { g, k, clave, disparos };
}
function red(t, o) {
  o = o || {};
  t.g.responder('/tags', () => o.tagsCaidos ? { codigo: 404, cuerpo: 'no' } : { cuerpo: (o.tags || ['v0.13.0', 'v0.15.0', 'v0.9.9', 'raro']).map(n => ({ name: n })) });
  t.g.responder('/dispatches', (url, op) => { t.disparos.push({ url, cuerpo: JSON.parse(op.payload || '{}') }); return { codigo: 204, cuerpo: '' }; });
  t.g.responder('/runs?', () => ({ cuerpo: { workflow_runs: [] } }));
}

(async () => {
  // ═══ Una sola fuente para la versión y la semilla ═══
  ok('LA VERSIÓN DEL MAESTRO es la del package.json', (maestro.match(/var VERSION_TIENDA = '([^']+)'/) || [])[1] === paquete.version,
     (maestro.match(/var VERSION_TIENDA = '([^']+)'/) || [])[1] + ' / ' + paquete.version);
  ok('  ...y su semilla es la de semilla.json', (maestro.match(/var SEMILLA_REPO = '([^']+)'/) || [])[1] === semilla.repositorio);
  ok('SEMILLA.JSON no se adueña de lo que es de cada tienda', !semilla.propios.some(p =>
     p === 'publicar/' || p.startsWith('publicar/') || p === 'wrangler.jsonc' || p === 'README.md' || p === '.github/workflows/release.yml' || p === '.github/'));
  const faltan = semilla.propios.filter(p => !fs.existsSync(path.join('..', p)));
  ok('  ...y todo lo que nombra existe', faltan.length === 0, faltan.join(', '));
  ok('  ...y se nombra a sí mismo: le llega a la tienda con cada versión', semilla.propios.includes('semilla.json'));

  // ═══ El maestro ═══
  {
    const t = tienda(); red(t);
    const a = post(t.g, { a: 'actualizacion', k: t.k });
    ok('EL PANEL SABE la versión de la tienda y la última de la semilla (la mayor, no la última de la lista)',
       a.ok && a.version === paquete.version && a.ultima === '0.15.0' && a.hayNueva === true, JSON.stringify(a).slice(0, 120));
    const r = post(t.g, { a: 'actualizar', k: t.k, op: op() });
    const d = t.disparos[0] || {};
    ok('ACTUALIZAR dispara montaje con la semilla, en main', r.ok && /\/workflows\/montaje\.yml\/dispatches$/.test(d.url || '') &&
       d.cuerpo.ref === 'main' && d.cuerpo.inputs && d.cuerpo.inputs.semilla === 'true', JSON.stringify(d));
    ok('  ...y queda en el Registro', t.g.filas('Registro').some(f => /Pidió actualizar la tienda/.test(String(f[3]))));
    const n0 = t.disparos.length;
    post(t.g, { a: 'publicar', k: t.k, op: op() });
    ok('  ...y Publicar sigue disparando fotos, no montaje', /\/fotos\.yml\/dispatches$/.test((t.disparos[n0] || {}).url || ''));
  }
  {
    const t = tienda(); red(t, { tagsCaidos: true });
    const a = post(t.g, { a: 'actualizacion', k: t.k });
    ok('SI NO SE PUEDE SABER la última, se dice «no lo sé», no «estás al día»', a.ok && a.hayNueva === null && /404/.test(a.porQue));
  }
  {
    const t = tienda(); red(t, { tags: ['v' + paquete.version] });
    ok('AL DÍA: hayNueva es false', post(t.g, { a: 'actualizacion', k: t.k }).hayNueva === false);
    const n0 = t.disparos.length;
    const m = t.g.api.actualizarLaTiendaDesdeElMenu();
    ok('EL MENÚ DE LA HOJA, al día, lo dice y no dispara nada', /ya está en la última/.test(m.texto) && t.disparos.length === n0, m.texto);
  }
  {
    const t = tienda(); red(t);
    const m = t.g.api.actualizarLaTiendaDesdeElMenu();
    ok('  ...y con una versión nueva, la pide y explica qué pasa', /ACTUALIZANDO TU TIENDA A LA 0\.15\.0/.test(m.texto) &&
       t.disparos.some(d => /montaje\.yml/.test(d.url)), m.texto.split('\n')[0]);
    ok('  ...y la opción está al final del menú (lo que había no cambia de lugar)',
       /var ORDEN_MENU = \[[^\]]*'ayuda', 'version'\]/.test(maestro));
  }
  {
    const t = tienda(); red(t);
    const c = post(t.g, { a: 'colaborador', k: t.k, op: op(), accion: 'crear', usuario: 'ana', c: (() => {
      // la clave del dueño: se vuelve a generar para tenerla
      const nueva = (t.g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
      t.k = post(t.g, { a: 'entrar', u: 'dona.rosa', c: nueva }).testigo; return nueva; })() });
    const kc = post(t.g, { a: 'entrar', u: 'ana', c: c.clave }).testigo;
    const n0 = t.disparos.length;
    ok('EL COLABORADOR no ve ni pide actualizaciones', !post(t.g, { a: 'actualizacion', k: kc }).ok &&
       !post(t.g, { a: 'actualizar', k: kc, op: op() }).ok && t.disparos.length === n0);
  }

  // ═══ La semilla sobre la tienda, de punta a punta ═══
  {
    const origen = fs.mkdtempSync(path.join(os.tmpdir(), 'semilla-origen-'));
    const g = (cwd, ...a) => execFileSync('git', a, { cwd, stdio: 'pipe' }).toString().trim();
    const escribir = (d, archivos) => { for (const [r, c] of Object.entries(archivos)) { fs.mkdirSync(path.dirname(path.join(d, r)), { recursive: true }); fs.writeFileSync(path.join(d, r), c); } };
    const conf = { repositorio: 'lab/semilla', propios: ['maestro.gs', 'montar/', 'package.json', 'semilla.json', '.github/workflows/montaje.yml'] };
    const s = path.join(origen, 'lab', 'semilla');
    fs.mkdirSync(s, { recursive: true });
    g(s, 'init', '-q', '-b', 'main'); g(s, 'config', 'user.email', 'x@x'); g(s, 'config', 'user.name', 'x');
    escribir(s, { 'maestro.gs': 'm1', 'montar/seo.mjs': 'seo 1', 'package.json': '{"name":"t","version":"1.0.0"}',
                  'semilla.json': JSON.stringify(conf), '.github/workflows/montaje.yml': 'flujo 1', 'publicar/index.html': 'de la semilla' });
    g(s, 'add', '-A'); g(s, 'commit', '-qm', '1'); g(s, 'tag', 'v1.0.0');
    escribir(s, { 'maestro.gs': 'm2', 'montar/seo.mjs': 'seo 2', 'montar/nuevo.mjs': 'nuevo', 'package.json': '{"name":"t","version":"2.0.0"}',
                  '.github/workflows/montaje.yml': 'flujo 2' });
    g(s, 'add', '-A'); g(s, 'commit', '-qm', '2'); g(s, 'tag', 'v2.0.0');
    escribir(s, { 'maestro.gs': 'm3 sin publicar' }); g(s, 'commit', '-qam', '3');

    const tiendaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semilla-tienda-'));
    escribir(tiendaDir, { 'maestro.gs': 'm1', 'montar/seo.mjs': 'seo 1 arreglado aquí', 'package.json': '{"name":"mi-tienda","version":"1.0.0"}',
                          'semilla.json': JSON.stringify(conf), '.github/workflows/montaje.yml': 'flujo 1', 'publicar/index.html': 'MI TIENDA' });
    const correr = (dir, env) => {
      const salidas = path.join(dir, '..', path.basename(dir) + '.salidas');
      fs.writeFileSync(salidas, '');
      let log = '';
      try {
        log = execFileSync(process.execPath, [path.resolve('../montar/actualizar-semilla.mjs')], { cwd: dir, stdio: 'pipe',
          env: Object.assign({}, process.env, { SEMILLA_ORIGEN: origen, GITHUB_OUTPUT: salidas, GITHUB_STEP_SUMMARY: '', GITHUB_REPOSITORY: 'lab/mitienda' }, env || {}) }).toString();
      } catch (e) { log = 'FALLÓ ' + String(e.stdout || '') + String(e.stderr || e.message); }
      const o = {}; fs.readFileSync(salidas, 'utf8').split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); });
      return { log, o };
    };
    const leer = r => fs.existsSync(path.join(tiendaDir, r)) ? fs.readFileSync(path.join(tiendaDir, r), 'utf8') : null;
    const r = correr(tiendaDir);
    ok('DE PUNTA A PUNTA: trae la última PUBLICADA (v2.0.0), no lo que hay en main', leer('maestro.gs') === 'm2' && r.o.hasta === 'v2.0.0', r.log.split('\n')[0]);
    ok('  ...y lo dice en las salidas: hay cambio y hay maestro nuevo', r.o.cambio === 'si' && r.o.maestro === 'si' && r.o.desde === '1.0.0');
    ok('  ...lo nuevo llega, y los flujos también (con permiso)', leer('montar/nuevo.mjs') === 'nuevo' && leer('.github/workflows/montaje.yml') === 'flujo 2');
    ok('  ...el arreglo propio que la semilla también cambió NO se pisa, y se dice arriba',
       leer('montar/seo.mjs') === 'seo 1 arreglado aquí' && /No se tocaron[^\n]*\n\n- `montar\/seo\.mjs`/.test(r.log), r.log.slice(0, 200));
    ok('  ...publicar/ no se toca', leer('publicar/index.html') === 'MI TIENDA');
    ok('  ...y la versión de la tienda pasa a la 2.0.0 sin perder su nombre', JSON.parse(leer('package.json')).version === '2.0.0' &&
       JSON.parse(leer('package.json')).name === 'mi-tienda');
    const otra = correr(tiendaDir);
    ok('YA AL DÍA: nada que traer, y las salidas lo dicen', otra.o.cambio === 'no' && otra.o.maestro === 'no' && /Nada que traer/.test(otra.log));
    const esSemilla = correr(tiendaDir, { GITHUB_REPOSITORY: 'lab/semilla' });
    ok('EN LA SEMILLA MISMA no se trae nada', esSemilla.o.cambio === 'no' && /ES la semilla/.test(esSemilla.log));
    const pedida = correr(tiendaDir, { VERSION: '9.9.9' });
    ok('UNA VERSIÓN QUE NO EXISTE no se inventa: falla y lo dice', /FALLÓ/.test(pedida.log) && /no tiene la versión v9\.9\.9/.test(pedida.log));
    const { aplicar } = await import(path.resolve('../montar/semilla.mjs'));
    const t2 = fs.mkdtempSync(path.join(os.tmpdir(), 'semilla-t2-'));
    escribir(t2, { '.github/workflows/montaje.yml': 'flujo 1', 'maestro.gs': 'm1' });
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'semilla-b-')); escribir(base, { '.github/workflows/montaje.yml': 'flujo 1', 'maestro.gs': 'm1' });
    const nueva = fs.mkdtempSync(path.join(os.tmpdir(), 'semilla-n-')); escribir(nueva, { '.github/workflows/montaje.yml': 'flujo 2', 'maestro.gs': 'm2' });
    const inf = aplicar({ tiendaDir: t2, nuevaDir: nueva, baseDir: base, propios: conf.propios, excluir: ['.github/workflows/'] });
    ok('SIN PERMISO PARA FLUJOS, se trae lo demás y los flujos quedan pendientes, dichos',
       fs.readFileSync(path.join(t2, 'maestro.gs'), 'utf8') === 'm2' && fs.readFileSync(path.join(t2, '.github/workflows/montaje.yml'), 'utf8') === 'flujo 1' &&
       inf.pendientes.includes('.github/workflows/montaje.yml'));
  }

  // ═══ El flujo ═══
  const pasos = [...flujo.matchAll(/- name: (.+)/g)].map(m => m[1].trim());
  const i = n => pasos.findIndex(p => p.startsWith(n));
  ok('MONTAJE: la entrada `semilla` existe, apagada de fábrica', /semilla:\n\s+description: [^\n]+\n\s+type: boolean\n\s+default: false/.test(flujo));
  ok('  ...la semilla va ANTES de las dependencias y del maestro', i('La versión nueva de la semilla') !== -1 &&
     i('La versión nueva de la semilla') < i('Dependencias') && i('Dependencias') < i('Publicar maestro.gs'));
  ok('  ...un maestro nuevo de la semilla se publica sin PUBLICAR', /steps\.semilla\.outputs\.maestro \}\}" = "si"/.test(flujo));
  ok('  ...lo que se publica suma lo que dice semilla.json (una sola lista)', /require\('\.\/semilla\.json'\)\.propios/.test(flujo));
  ok('  ...corren TODAS las baterías', /GUARDIA: \$\{\{ steps\.semilla\.outputs\.cambio == 'si' && 'todas'/.test(flujo) &&
     execFileSync('bash', ['publicacion.sh'], { env: Object.assign({}, process.env, { GUARDIA: 'todas', SOLO_DECIDIR: '1', GITHUB_REPOSITORY: 'x/y', GH_TOKEN: 'z' }) }).toString().trim() === 'todas');
  ok('  ...siempre directo a main (automático)', /AUTO: \$\{\{ inputs\.aprobacion != 'con-pull-request' \|\| steps\.semilla\.outputs\.cambio == 'si' \}\}/.test(flujo));
  ok('  ...y si algo falla después de publicar el maestro, vuelve al de antes', i('Volver atrás el maestro') > i('Publicar en main') &&
     /if: failure\(\) && steps\.publicado\.outcome == 'success' && steps\.semilla\.outputs\.maestro == 'si'/.test(flujo) &&
     /git show "\$\{\{ github\.sha \}\}:maestro\.gs" > maestro\.gs/.test(flujo));
  ok('  ...y con SEMILLA_TOKEN puede empujar flujos', /token: \$\{\{ secrets\.SEMILLA_TOKEN \|\| github\.token \}\}/.test(flujo));

  await enLaPagina();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

async function enLaPagina() {
  const { chromium } = require('playwright');
  const { hasta } = require('./esperar.js');
  const U = 'http://localhost:' + (process.env.PUERTO || 8099);
  await fetch(U + '/__reset');
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(U + '/admin.html');
  await hasta(p, () => !document.querySelector('#entrar').hidden);
  await p.fill('#usuario', 'dona.rosa'); await p.fill('#clave', clave);
  await p.click('#botonEntrar');
  await hasta(p, () => !document.querySelector('#panel').hidden);
  await p.evaluate(() => mostrarVista('tienda'));
  await p.waitForFunction(() => /versión/.test(document.querySelector('#estadoVersion').textContent), null, { timeout: 20000 }).catch(() => {});
  ok('EN EL PANEL, el dueño ve la versión de su tienda', await p.locator('#seccionVersion').isVisible() &&
     new RegExp('versión ' + JSON.parse(fs.readFileSync('../package.json', 'utf8')).version.replace(/\./g, '\\.')).test(await p.locator('#estadoVersion').textContent()),
     JSON.stringify([await p.locator('#estadoVersion').textContent(), await p.locator('#seccionVersion').isVisible()]));
  ok('  ...y sin permiso para GitHub, no ofrece un botón que no va a funcionar', await p.locator('#actualizarTienda').isHidden());
  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
}
