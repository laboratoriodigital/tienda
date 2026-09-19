/* A-8 — Cada herramienta declara lo que escribe.
 * ---------------------------------------------------------------------------
 * "Una aserción falla si una herramienta escribe algo que no declaró"
 * (docs/PLAN-MVP.md). No es un lint de estilo: `ESCRIBE` es lo que un futuro
 * flujo de actualización (M6) va a usar para saber qué archivos tocó el
 * horneado de una tienda. Si un `montar/*.mjs` escribe un archivo que
 * ESCRIBE no menciona, esa herramienta queda invisible para esa cuenta.
 *
 * CÓMO SE COMPRUEBA EL HECHO, NO EL TEXTO. No se corren los flujos de
 * verdad -piden una hoja real, fotos reales, clasp real-, así que esto lee
 * cada archivo como texto y sigue el mismo rastro que seguiría una persona:
 * qué constante declara cada ruta, en qué llamada a writeFile/writeFileSync/
 * .toFile se usa y -cuando el objetivo es un parámetro y no una constante,
 * como en preparar-index.mjs- con qué se llamó esa función en cada sitio.
 * Es un resolutor chico, no un compilador: cubre `const X = 'literal'`,
 * `const X = join(A, B)` y el reenvío de un parámetro a través de una
 * llamada -con su valor por defecto si no se lo pasan-, que es exactamente
 * lo que hay en estos doce archivos hoy. Si mañana alguien escribe con una
 * forma que esto no reconoce, la ruta queda "sin resolver" y la prueba
 * FALLA -no aprueba en silencio-: mejor un rojo que revisar a mano que un
 * verde que no vio nada.
 *
 * Un caso queda fuera a propósito: publicar-maestro.mjs escribe dentro de
 * una carpeta temporal del sistema (mkdtempSync + os.tmpdir()) para armar lo
 * que clasp sube — no es un archivo del repositorio, así que ESCRIBE no
 * tiene que mencionarlo, y esta prueba lo reconoce y lo deja pasar.
 *
 * No necesita servidor ni navegador.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const MONTAR = path.join(RAIZ, 'montar');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const ARCHIVOS = fs.readdirSync(MONTAR).filter(f => f.endsWith('.mjs')).sort();

/* ── El resolutor ─────────────────────────────────────────────────────── */

const FUERA_DEL_REPO = /\btmpdir\(\)|\bmkdtempSync\(/;

/* Todas las declaraciones `const NOMBRE = ALGO;` de una línea, en cualquier
   parte del archivo -top-level o dentro de una función-. Deliberadamente
   simple: una sola línea, sin desestructurar. Cubre todo lo que hay hoy. */
function constantes(src) {
  const mapa = new Map();
  /* `export const X = ...` cuenta igual que `const X = ...`: es la única
     diferencia entre una constante interna y la propia declaración de
     ESCRIBE, que siempre se exporta. */
  const re = /(?:^|\n)[ \t]*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+);/g;
  let m;
  while ((m = re.exec(src))) mapa.set(m[1], m[2].trim());
  return mapa;
}

/* function NOMBRE(p1, p2 = defecto, ...) { -> NOMBRE: [{nombre, defecto}] */
function funciones(src) {
  const mapa = new Map();
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(src))) {
    const params = m[2].split(',').map(s => s.trim()).filter(Boolean).map(p => {
      const conDefecto = p.match(/^([A-Za-z_$][\w$]*)\s*=\s*(.+)$/);
      return conDefecto
        ? { nombre: conDefecto[1], defecto: conDefecto[2].trim() }
        : { nombre: p, defecto: null };
    });
    mapa.set(m[1], params);
  }
  return mapa;
}

/* Para cada función conocida, cada llamada NOMBRE(a1, a2, ...) en el resto
   del archivo: p_i -> Set(a1_texto | defecto si no lo pasaron). Puede haber
   más de una llamada, y entonces el parámetro vale varias cosas posibles. */
function llamadas(src, fns) {
  const porParametro = new Map();
  fns.forEach((params, nombre) => {
    const re = new RegExp('(?<!function )\\b' + nombre + '\\(([^)]*)\\)', 'g');
    let m;
    while ((m = re.exec(src))) {
      const args = m[1].split(',').map(s => s.trim()).filter(Boolean);
      params.forEach((p, i) => {
        if (!porParametro.has(p.nombre)) porParametro.set(p.nombre, new Set());
        if (args[i] !== undefined) porParametro.get(p.nombre).add(args[i]);
        else if (p.defecto) porParametro.get(p.nombre).add(p.defecto);
      });
    }
  });
  return porParametro;
}

/* Resuelve una expresión a una lista de posibles resultados:
   { valor, dinamico, exento }.
   - dinamico: una parte no se pudo resolver (por ejemplo `a.nombre` en un
     bucle), así que `valor` es un PREFIJO, no la ruta completa.
   - exento: la expresión pasa por una carpeta temporal del sistema, y no es
     un archivo del repositorio -no le corresponde estar en ESCRIBE-. */
function resolver(expr, ctx, vistos = new Set()) {
  expr = expr.trim();

  const literal = expr.match(/^(['"])(.*)\1$/);
  if (literal) return [{ valor: literal[2], dinamico: false, exento: false }];

  const llamadaJoin = expr.match(/^join\((.*)\)$/s);
  if (llamadaJoin) {
    const partes = llamadaJoin[1].split(',').map(s => s.trim()).filter(Boolean);
    let opciones = [{ valor: '', dinamico: false, exento: false }];
    partes.forEach(parte => {
      const resPart = resolver(parte, ctx, vistos);
      const siguientes = [];
      opciones.forEach(op => resPart.forEach(rp => siguientes.push({
        valor: op.valor ? op.valor + '/' + rp.valor : rp.valor,
        dinamico: op.dinamico || rp.dinamico,
        exento: op.exento || rp.exento
      })));
      opciones = siguientes;
    });
    return opciones;
  }

  if (FUERA_DEL_REPO.test(expr)) return [{ valor: expr, dinamico: true, exento: true }];

  const nombre = expr.match(/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/);
  if (nombre) {
    if (vistos.has(expr)) return [{ valor: expr, dinamico: true, exento: false }];  // ciclo: rendirse
    const vistos2 = new Set(vistos); vistos2.add(expr);

    if (ctx.constantes.has(expr)) return resolver(ctx.constantes.get(expr), ctx, vistos2);
    if (ctx.parametros.has(expr)) {
      const salidas = [];
      ctx.parametros.get(expr).forEach(argExpr => resolver(argExpr, ctx, vistos2).forEach(r => salidas.push(r)));
      return salidas.length ? salidas : [{ valor: expr, dinamico: true, exento: false }];
    }
    // Ni constante conocida ni parámetro con llamadas conocidas -por ejemplo
    // `a.nombre`, un campo de un dato que llega en tiempo de ejecución-.
    return [{ valor: expr, dinamico: true, exento: false }];
  }

  return [{ valor: expr, dinamico: true, exento: false }];   // cualquier otra forma: opaca
}

/* ¿La ruta resuelta está cubierta por lo declarado en ESCRIBE (ya resuelto)?
   - Una entrada SIN barra final es una IGUALDAD exacta.
   - Una entrada CON barra final es una carpeta: alcanza con que la
     resuelta empiece por ella. */
function cubierta(resuelta, escribeResuelto) {
  if (resuelta.exento) return true;
  return escribeResuelto.some(e => {
    if (e.endsWith('/')) return (resuelta.valor + '/').startsWith(e);
    return !resuelta.dinamico && resuelta.valor === e;
  });
}

// ═══ Cada montar/*.mjs, uno por uno ═══
ARCHIVOS.forEach(nombre => {
  const src = fs.readFileSync(path.join(MONTAR, nombre), 'utf8');

  const tieneEscribe = /export const ESCRIBE\s*=/.test(src);
  ok(nombre + ': exporta ESCRIBE', tieneEscribe);
  if (!tieneEscribe) return;

  const ctx = { constantes: constantes(src) };
  ctx.parametros = llamadas(src, funciones(src));

  /* LAS CONSTANTES QUE VIENEN DE OTRO MÓDULO TAMBIÉN CUENTAN.
     Este guardia solo sabía leer las constantes declaradas en el propio
     archivo, y eso era un punto ciego en las dos direcciones: una herramienta
     que declara `ESCRIBE = [RUTA]` con RUTA importada salía acusada de escribir
     algo sin declarar (falso positivo), y —peor— una que ESCRIBE en una ruta
     importada se le colaba sin resolver.

     Sigue siendo lectura estática: se busca de qué módulo viene el nombre y se
     lee esa constante allí. Un módulo que no esté en montar/ no se persigue. */
  (src.match(/^import\s*\{([^}]+)\}\s*from\s*'\.\/([\w.-]+)'/gm) || []).forEach(linea => {
    const m = linea.match(/^import\s*\{([^}]+)\}\s*from\s*'\.\/([\w.-]+)'/);
    let vecino;
    try { vecino = constantes(fs.readFileSync(path.join(MONTAR, m[2]), 'utf8')); }
    catch { return; }
    m[1].split(',').map(s => s.trim().split(/\s+as\s+/)).forEach(([suyo, mio]) => {
      const local = mio || suyo;
      if (!ctx.constantes.has(local) && vecino.has(suyo)) {
        ctx.constantes.set(local, vecino.get(suyo));
      }
    });
  });

  const declarado = ctx.constantes.get('ESCRIBE') || '';
  const items = (declarado.match(/^\[(.*)\]$/s) || [, ''])[1]
    .split(',').map(s => s.trim()).filter(Boolean);

  const escribeResuelto = [];
  items.forEach(it => resolver(it, ctx).forEach(r => { if (!r.dinamico) escribeResuelto.push(r.valor); }));

  const llamadasEscritura = [
    /* `Sync` es opcional COMO PALABRA, no como su última letra: sin el grupo,
       "writeFileSync?" solo hacía optativa la "c" final y nunca reconocía
       un llano `writeFile(`, que es lo que usan la mayoría de estos archivos
       (node:fs/promises). Ese agujero dejaba la prueba en verde sin haber
       mirado nada -un verde que no vio, no un verde que revisó-. */
    ...src.matchAll(/\bwriteFile(?:Sync)?\(\s*([^,()]+(?:\([^)]*\))?)\s*,/g),
    ...src.matchAll(/\.toFile\(\s*([^,()]+(?:\([^)]*\))?)\s*\)/g)
  ].map(m => m[1].trim());

  const sinCubrir = [];
  llamadasEscritura.forEach(expr => {
    resolver(expr, ctx).forEach(r => {
      if (!cubierta(r, escribeResuelto)) sinCubrir.push(expr + ' -> ' + r.valor + (r.dinamico ? '…' : ''));
    });
  });

  ok('  ...y no escribe nada que ESCRIBE no cubra',
     llamadasEscritura.length === 0 || sinCubrir.length === 0,
     sinCubrir.join('; ') || (llamadasEscritura.length ? '(todo cubierto)' : '(no escribe nada)'));
});

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
