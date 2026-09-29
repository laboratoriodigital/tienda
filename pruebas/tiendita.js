/* ═══════════════════════════════════════════════════════════════════════════
   LA TIENDITA: la suite, corrida como si fuera una tienda (0.20.8 · bitácora 95)
   ---------------------------------------------------------------------------
   Estas baterías corren en DOS sitios: aquí, y dentro de cada tienda —`montaje`
   las corre sobre lo recién horneado y de su verde depende que se publique—. Y
   una tienda no es este repositorio: `alta` no le hereda el flujo `release`, ni
   las fotos de muestra, ni el catálogo; y, al revés, puede arrastrar carpetas de
   versiones viejas que aquí ya no están.

   TRES VECES SEGUIDAS una aserción cierta aquí fue falsa allá y dejó a la tienda
   sin publicar, con «batería en rojo» como único motivo escrito: un ENOENT de
   `release.yml`, una foto de muestra que no viaja, y —la tercera— una aserción
   MÍA, escrita en la tanda anterior, que preguntaba si la semilla retira algo que
   todavía entrega y dentro de la tienda preguntaba otra cosa. La regla ya estaba
   escrita (bitácora 93) y aun así se rompió sola: eso ya no es descuido, es que
   faltaba quien la vigilara.

   Esto es quien la vigila. Arma una copia de este repositorio SIN lo que una
   tienda no hereda, le mete de propina un resto de una versión vieja, y corre
   ahí las baterías que leen archivos del repositorio. Si alguna se cae, se cae
   aquí —en el equipo de quien lo escribió— y no en la tienda de un cliente.

     node pruebas/tiendita.js
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { esSemilla } = require('./donde.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Dentro de una tienda esto no tiene sentido: armaría una tienda a partir de
   una tienda. Se salta diciéndolo (patrón 8, regla 2). */
if (!esSemilla()) {
  console.log('  SALTA | la tiendita: esto arma una tienda de juguete a partir de la');
  console.log('          SEMILLA para correr ahí la suite. Aquí ya estamos en una tienda.');
  console.log('\nResultado: 0/0');
  process.exit(0);
}

/* LO QUE UNA TIENDA NO HEREDA. La lista de verdad vive en el otro repositorio
   (`laboratoriodigital/tiendas`, flota/alta.mjs › NO_SE_HEREDA) y desde aquí no
   se puede importar: son dos repositorios. Así que esta es una copia
   CONSERVADORA —si allá quitan algo más, aquí se prueba de menos, nunca de
   más— y se dice, que es lo que pide el patrón 2 cuando la copia es inevitable. */
const NO_HEREDA = ['.github/workflows/release.yml', 'publicar/catalogo.json', 'publicar/fotos',
                   'publicar/productos', 'publicar/sitemap.xml', 'publicar/compartir.jpg',
                   'ESTADO.md', 'tienda.json', 'servicio'];
/* Y lo que una tienda vieja SÍ arrastra: carpetas que la semilla retiró después
   de que ella naciera. Es lo que se encontró en la primera tienda de verdad. */
const RESTOS = { 'servicio/tienda-nueva.yml': '# el alta vieja, retirada en la 0.17.0\n' };

const raiz = path.resolve('..');
const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'tiendita-'));
const SALTAR = new Set(['node_modules', '.git', '.salida', 'originales', 'Claude outputs']);

(function copiar(desde, hasta) {
  fs.mkdirSync(hasta, { recursive: true });
  for (const e of fs.readdirSync(desde, { withFileTypes: true })) {
    if (SALTAR.has(e.name)) continue;
    const a = path.join(desde, e.name), b = path.join(hasta, e.name);
    if (e.isDirectory()) copiar(a, b);
    else if (e.isFile()) fs.copyFileSync(a, b);
  }
})(raiz, copia);

NO_HEREDA.forEach(r => fs.rmSync(path.join(copia, r), { recursive: true, force: true }));
Object.keys(RESTOS).forEach(r => {
  fs.mkdirSync(path.dirname(path.join(copia, r)), { recursive: true });
  fs.writeFileSync(path.join(copia, r), RESTOS[r]);
});
/* Las dependencias no se copian —son 66 MB y las mismas—: se enlazan. */
try { fs.symlinkSync(path.join(raiz, 'pruebas', 'node_modules'), path.join(copia, 'pruebas', 'node_modules')); } catch (e) {}
/* Una tienda es un repositorio git: hay baterías que le preguntan por su
   historia, y sin `.git` se caerían por el motivo equivocado. */
const git = (...a) => cp.execFileSync('git', a, { cwd: copia, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  git('init', '--quiet', '-b', 'main');
  git('config', 'user.email', 'tiendita@local'); git('config', 'user.name', 'tiendita');
  git('add', '-A'); git('commit', '--quiet', '-m', 'la tiendita');
} catch (e) { /* si no hay git, las que lo necesiten lo dirán ellas */ }

/* Lo que se comprueba es lo que NO HEREDA y nadie repone: el resto de la 0.16
   se mete a propósito encima, así que no cuenta. */
const fuera = NO_HEREDA.filter(r => !Object.keys(RESTOS).some(x => x === r || x.indexOf(r + '/') === 0));
ok('LA TIENDITA se arma sin lo que una tienda no hereda',
   fuera.every(r => !fs.existsSync(path.join(copia, r))) &&
   Object.keys(RESTOS).every(r => fs.existsSync(path.join(copia, r))) &&
   fs.existsSync(path.join(copia, 'maestro.gs')) && fs.existsSync(path.join(copia, 'pruebas/todas.sh')),
   fuera.length + ' rutas fuera, más ' + Object.keys(RESTOS).length + ' resto(s) de la 0.16 dentro');

/* Las que leen archivos del repositorio. Las de navegador no: necesitan sus
   servidores y lo que se está probando aquí no es la página, es el suelo. */
const CORREN = [
  { f: 'montaje.js', env: {} },
  { f: 'exif.js', env: {} },
  { f: 'medicion.js', env: {} },
  { f: 'actualizar.js', env: { SIN_NAVEGADOR: '1' } }
];

CORREN.forEach(({ f, env }) => {
  let salida = '', estado = 0;
  try {
    salida = cp.execFileSync('node', [f], {
      cwd: path.join(copia, 'pruebas'), stdio: ['ignore', 'pipe', 'pipe'],
      env: Object.assign({}, process.env, { GITHUB_REPOSITORY: 'laboratoriodigital/tiendita' }, env)
    }).toString();
  } catch (e) {
    estado = e.status || 1;
    salida = String(e.stdout || '') + String(e.stderr || e.message);
  }
  const fallas = salida.split('\n').filter(l => l.indexOf(' FALLA') === 0);
  const marcador = (salida.match(/Resultado: \d+\/\d+/g) || []).pop() || 'sin marcador';
  ok('`' + f + '` pasa también dentro de una tienda',
     estado === 0 && fallas.length === 0,
     estado === 0 && !fallas.length ? marcador
       : marcador + (fallas.length ? '\n     ' + fallas.slice(0, 3).join('\n     ')
                                   : '\n     ' + salida.trim().split('\n').slice(-4).join('\n     ')));
});

fs.rmSync(copia, { recursive: true, force: true });
console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
