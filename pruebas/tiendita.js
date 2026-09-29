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
  { f: 'actualizar.js', env: { SIN_NAVEGADOR: '1' } },
  /* 0.22.0 · LA GUARDIA QUE DE VERDAD DECIDE si una tienda publica (bitácora
     102). La tiendita corre desde el principio lo que corre una tienda. */
  { f: 'tienda-viva.js', env: {} }
];

/* LA TIENDA VIVA MIRA LO QUE SE HORNEÓ, y en una tienda recién clonada eso
   todavía no existe: `alta` no hereda el catálogo. En la tienda de verdad esta
   batería corre DESPUÉS del horneado, así que aquí se pone lo horneado antes
   de correrla —el de la semilla, que es un horneado válido—. */
const horneado = r => {
  const a = path.join(raiz, 'publicar', r), b = path.join(copia, 'publicar', r);
  if (fs.existsSync(a) && !fs.existsSync(b)) fs.copyFileSync(a, b);
};

CORREN.forEach(({ f, env }) => {
  if (f === 'tienda-viva.js') horneado('catalogo.json');
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

/* LA MISMA DECISIÓN QUE TOMA UNA TIENDA. `publicacion.sh` es quien elige qué se
   corre antes de publicar; aquí se le pregunta con el repositorio de una tienda
   y pidiendo «todas», que es exactamente lo que le manda un montaje con
   actualización. */
let decide = '';
try {
  decide = cp.execFileSync('bash', ['publicacion.sh'], {
    cwd: path.join(copia, 'pruebas'), stdio: ['ignore', 'pipe', 'ignore'],
    env: Object.assign({}, process.env, { GITHUB_REPOSITORY: 'laboratoriodigital/tiendita',
                                          GUARDIA: 'todas', SOLO_DECIDIR: '1' })
  }).toString().trim();
} catch (e) { decide = 'no contestó'; }
ok('EN UNA TIENDA se decide la tienda viva, aunque el montaje pida «todas»',
   decide === 'tienda', decide);

/* Y CON DATOS QUE NO SON LOS DE MUESTRA. Lo que tumbó a prueba1 la última vez
   fue una aserción que daba por hecho que el comercio no tenía logo. Aquí la
   copia se hornea «como prueba1» —su logo de icono, otros colores, otro
   nombre— y la guardia tiene que seguir en verde: lo único que puede tumbarla
   es un horneado roto, no un comercio distinto. */
const idx = path.join(copia, 'publicar', 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8')
  .replace(/<link rel="icon" href="[^"]*"/, '<link rel="icon" href="https://res.cloudinary.com/x/image/upload/logo.png"')
  .replace(/<meta name="theme-color" content="[^"]*"/, '<meta name="theme-color" content="#14472B"')
  .replace(/<title>[^<]*<\/title>/, '<title>OTRO COMERCIO</title>'));
let comoPrueba1 = '', estado1 = 0;
try {
  comoPrueba1 = cp.execFileSync('node', ['tienda-viva.js'], { cwd: path.join(copia, 'pruebas'),
    stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, { GITHUB_REPOSITORY: 'laboratoriodigital/tiendita' }) }).toString();
} catch (e) { estado1 = e.status || 1; comoPrueba1 = String(e.stdout || '') + String(e.stderr || ''); }
ok('  ...y la tienda viva sigue en verde con el logo, los colores y el nombre de OTRO comercio',
   estado1 === 0, (comoPrueba1.match(/Resultado: \d+\/\d+/) || ['sin marcador'])[0] +
   (estado1 ? '\n     ' + comoPrueba1.split('\n').filter(l => l.indexOf(' FALLA') === 0).slice(0, 2).join('\n     ') : ''));

fs.rmSync(copia, { recursive: true, force: true });
console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
