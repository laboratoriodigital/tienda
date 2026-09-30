/* B-3 — una sola pregunta al maestro.
 * ---------------------------------------------------------------------------
 * Cuenta PETICIONES DE VERDAD. Levanta un maestro de mentira que lleva la
 * cuenta de lo que le preguntan, y corre las herramientas contra él en procesos
 * aparte —uno con `--desde` y otro sin— para comprobar qué se pregunta y qué no.
 *
 * Por qué así y no leyendo el código: lo que hay que comprobar es cuántas veces
 * sale una petición, y eso solo lo sabe quien las recibe. Una aserción sobre el
 * texto del archivo diría que la llamada está escrita, no que no se hizo.
 *
 *   node pruebas/sondeo.js
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const correr = require('util').promisify(execFile);

const RAIZ = path.join(__dirname, '..');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Un maestro de mentira: contesta cualquier acción y anota cuál le pidieron. */
let pedidas = [];
/* 1.0.0 · Y anota si alguien le puso el token en la DIRECCIÓN: desde la 1.0.0
   va en el cuerpo de un POST (ROADMAP 5.7). */
let tokenEnDireccion = 0, porPost = 0;
const servidor = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.searchParams.has('t')) tokenEnDireccion++;
  let cuerpo = '';
  req.on('data', c => { cuerpo += c; });
  req.on('end', () => {
    let d = {};
    try { d = JSON.parse(cuerpo || '{}'); } catch { d = {}; }
    if (req.method === 'POST') porPost++;
    const a = d.a || u.searchParams.get('a');
    pedidas.push(a);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, accion: a, marca: 'del-maestro' }));
  });
});

/* Corre un trozo de código en un proceso aparte, con o sin `--desde`, desde una
   carpeta temporal: así `sondeo.json` nace y muere ahí y ninguna corrida se
   lleva por delante la de al lado.

   ASÍNCRONO A PROPÓSITO, y costó entenderlo: con `execFileSync` el proceso de
   arriba se queda bloqueado, y el maestro de mentira vive EN ESE proceso — así
   que no podía contestar a los hijos y todos se plantaban en el tope de 90
   segundos. Un servidor y una espera síncrona en el mismo bucle de eventos no
   pueden convivir. */
async function enOtroProceso(codigo, conDesde, dir) {
  const args = ['-e', codigo];
  if (conDesde) args.push('--', '--desde');
  const { stdout } = await correr(process.execPath, args, {
    encoding: 'utf8', cwd: dir, timeout: 60000,
    env: Object.assign({}, process.env, {
      MAESTRO_URL: URL_BASE, MAESTRO_TOKEN: 'tk-de-prueba'
    })
  });
  return stdout;
}

const TIENDA = path.join(RAIZ, 'montar', 'tienda.mjs').replace(/\\/g, '/');
const pedir = acciones => `
  import('${TIENDA}').then(async m => {
    const t = { url: process.env.MAESTRO_URL, token: process.env.MAESTRO_TOKEN };
    for (const a of ${JSON.stringify(acciones)}) {
      const r = await m.alMaestro(t, a.accion, a.extra || {});
      console.log('RESPUESTA', a.accion, JSON.stringify(r));
    }
  }).catch(e => { console.error(e.message); process.exit(1); });`;

let URL_BASE = '';

(async () => {
  await new Promise(r => servidor.listen(0, r));
  URL_BASE = 'http://localhost:' + servidor.address().port + '/exec';

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sondeo-'));
  const archivo = path.join(dir, 'sondeo.json');
  const sondeoCon = (respuestas, cuando) => fs.writeFileSync(archivo, JSON.stringify({
    cuando: (cuando || new Date()).toISOString(), respuestas
  }));

  // ── 1. Sin --desde, cada herramienta pregunta lo suyo ──
  pedidas = [];
  sondeoCon({ bloques: { ok: true, marca: 'del-sondeo' },
              catalogo: { ok: true, marca: 'del-sondeo' } });
  await enOtroProceso(pedir([{ accion: 'bloques' }, { accion: 'catalogo' }]), false, dir);
  ok('SIN --desde cada herramienta sigue funcionando sola',
     pedidas.join(',') === 'bloques,catalogo',
     pedidas.length + ' peticiones: ' + pedidas.join(', '));
  /* Y ES LA CONDICIÓN QUE HACE QUE ESTO NO SEA UN RIESGO: a mano, y en las
     baterías, las herramientas se usan sueltas y no hay sondeo ninguno. */

  // ── 2. Con --desde, lo ya sondeado no se vuelve a preguntar ──
  pedidas = [];
  const salida = await enOtroProceso(pedir([{ accion: 'bloques' }, { accion: 'catalogo' }]), true, dir);
  ok('CON --desde no se le pregunta al maestro lo que ya está sondeado',
     pedidas.length === 0, pedidas.length + ' peticiones: ' + (pedidas.join(', ') || 'ninguna'));
  ok('  ...y lo que devuelve es la respuesta del sondeo, no una inventada',
     /del-sondeo/.test(salida) && !/del-maestro/.test(salida),
     (salida.match(/RESPUESTA[^\n]*/) || [''])[0]);
  ok('  ...y lo dice, en vez de ahorrarse la petición en silencio',
     /sale del sondeo de esta corrida/.test(salida),
     'un ahorro invisible es indistinguible de una pregunta que se perdió');

  // ── 3. Lo que NO está sondeado se pregunta igual ──
  pedidas = [];
  await enOtroProceso(pedir([{ accion: 'bloques' }, { accion: 'identidad' }]), true, dir);
  ok('LO QUE NO ESTÁ en el sondeo se pregunta igual',
     pedidas.join(',') === 'identidad', pedidas.join(', ') || 'ninguna');

  // ── 4. Una pregunta con parámetros nunca sale del sondeo ──
  pedidas = [];
  sondeoCon({ foto: { ok: true, marca: 'del-sondeo' } });
  await enOtroProceso(pedir([{ accion: 'foto', extra: { id: 'f1' } },
                             { accion: 'foto', extra: { id: 'f2' } }]), true, dir);
  /* Dos fotos distintas no tienen UNA respuesta: son dos peticiones y lo
     seguirán siendo. Servirlas del sondeo daría la misma foto dos veces. */
  ok('UNA PREGUNTA CON PARÁMETROS nunca sale del sondeo',
     pedidas.join(',') === 'foto,foto',
     pedidas.length + ' peticiones para dos fotos distintas');

  // ── 5. Caduca a los diez minutos: no es una caché entre corridas ──
  pedidas = [];
  sondeoCon({ bloques: { ok: true, marca: 'del-sondeo' } },
            new Date(Date.now() - 11 * 60 * 1000));
  const vencido = await enOtroProceso(pedir([{ accion: 'bloques' }]), true, dir);
  ok('EL SONDEO CADUCA: a los once minutos ya no vale',
     pedidas.join(',') === 'bloques', pedidas.join(', ') || 'no preguntó');
  ok('  ...y lo dice, en vez de servir un dato viejo callando',
     /vencido/.test(vencido),
     'una caché entre corridas publicaría el catálogo de hace una hora');
  ok('  ...y contesta lo del maestro, no lo del archivo vencido',
     /del-maestro/.test(vencido) && !/del-sondeo/.test(vencido));

  // ── 6. El sondeo pregunta las cuatro A LA VEZ ──
  pedidas = [];
  fs.rmSync(archivo, { force: true });
  const s = (await correr(process.execPath, [path.join(RAIZ, 'montar', 'sondear.mjs')], {
    encoding: 'utf8', cwd: dir, timeout: 60000,
    env: Object.assign({}, process.env,
      { MAESTRO_URL: URL_BASE, MAESTRO_TOKEN: 'tk-de-prueba' })
  })).stdout;
  const guardado = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  ok('EL SONDEO pide las cuatro acciones fijas del flujo',
     pedidas.slice().sort().join(',') === 'bloques,catalogo,fotos,identidad',
     pedidas.join(', '));
  ok('  ...y las deja las cuatro guardadas',
     Object.keys(guardado.respuestas).sort().join(',') === 'bloques,catalogo,fotos,identidad',
     Object.keys(guardado.respuestas).join(', '));
  ok('  ...con la hora, que es lo que le pone fecha de caducidad',
     !Number.isNaN(Date.parse(guardado.cuando)), String(guardado.cuando));
  /* A LA VEZ, QUE ES TODO EL PUNTO. Apps Script arranca en frío y la primera
     llamada tarda 40 s o más: cuatro en serie son cuatro oportunidades de
     pagarlo, cuatro en paralelo son una. */
  ok('  ...preguntando A LA VEZ y no una detrás de otra',
     /Promise\.allSettled\(acciones\.map/.test(
       fs.readFileSync(path.join(RAIZ, 'montar', 'sondear.mjs'), 'utf8')),
     'cuatro esperas en serie contra un Apps Script frío son cuatro arranques');
  ok('  ...y si una no contesta, las otras tres quedan guardadas igual',
     /allSettled/.test(fs.readFileSync(path.join(RAIZ, 'montar', 'sondear.mjs'), 'utf8')) &&
     /no contest/.test(s) === false,
     'con Promise.all, una que falla tira las tres buenas');

  // ── 7. Y el flujo lo usa: cuatro fijas en vez de siete ──
  {
    const fotos = fs.readFileSync(path.join(RAIZ, '.github/workflows/fotos.yml'), 'utf8');
    ok('EL FLUJO `fotos` sondea UNA vez, antes de las dos pasadas',
       /node montar\/sondear\.mjs/.test(fotos),
       'la pasada de --revisar y la de publicar preguntaban lo mismo dos veces');
    /* Cada herramienta del flujo tiene que llevar --desde: la que se quede sin
       él vuelve a preguntar y nadie lo nota, porque funciona igual. */
    const conDesde = (fotos.match(/node montar\/(traer-fotos|catalogo-estatico|preparar-index|misma-tienda)\.mjs[^\n|]*/g) || []);
    const sinDesde = conDesde.filter(l => !/--desde/.test(l));
    ok('  ...y TODAS las herramientas del flujo lo leen',
       sinDesde.length === 0,
       sinDesde.length ? 'sin --desde: ' + sinDesde.map(l => l.trim()).join(' · ')
                       : conDesde.length + ' invocaciones, todas con --desde');
  }

  servidor.close();
  fs.rmSync(dir, { recursive: true, force: true });
  ok('NINGÚN TOKEN EN UNA DIRECCIÓN: las herramientas le hablan al maestro por POST',
     tokenEnDireccion === 0 && porPost > 0, tokenEnDireccion + ' con el token en la dirección · ' + porPost + ' por POST');
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
