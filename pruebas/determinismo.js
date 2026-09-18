/* A-6 — El horneado es determinista.
 * ---------------------------------------------------------------------------
 * "Hornear dos veces sin tocar la hoja deja git status limpio. También
 * pasada la medianoche UTC" (docs/PLAN-MVP.md). Antes de esta historia,
 * `montar/sembrar-respaldo.mjs` escribía la FECHA del día dentro de
 * publicar/index.html: los mismos datos, en dos días distintos, daban dos
 * archivos distintos, y el montaje automático (que sí corre todos los días)
 * habría dejado un commit vacío cada vez que alguien mirara el repositorio
 * a la mañana siguiente. `montar/catalogo-estatico.mjs` también escribe una
 * marca de tiempo (`generado`), pero por diseño la ignora al decidir si
 * hace falta escribir — eso ya funcionaba, y esta batería lo deja puesto por
 * escrito para que nadie lo rompa sin darse cuenta.
 *
 * No necesita servidor ni navegador: son funciones puras y un reloj fingido.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Cambia el reloj global por uno fijo mientras corre fn(), y lo deja como
   estaba pase lo que pase -incluso si fn() tira-. Es la única forma de
   fingir "medianoche UTC" sin esperarla de verdad. */
function conRelojFijo(iso, fn) {
  const Real = Date;
  class Fijo extends Real {
    constructor(...args) {
      if (args.length) { super(...args); return; }
      super(iso);
    }
    static now() { return new Real(iso).getTime(); }
  }
  global.Date = Fijo;
  try { return fn(); }
  finally { global.Date = Real; }
}

const ANTES  = '2026-01-14T23:59:00.000Z';
const DESPUES = '2026-01-15T00:01:00.000Z';   // dos minutos después, cruzando la medianoche UTC

// ═══ 1. catalogo-estatico.mjs: los mismos datos, otro día, el mismo archivo ═══
{
  const { hornear } = require('../montar/catalogo-estatico.mjs');
  /* La versión es un dato cualquiera aquí, NO la de VERSION en maestro.gs: si
     coincidiera de casualidad, una batería más arriba (la que comprueba que
     nadie reescribe VERSION a mano) se plantaría por una razón que no es la
     suya. */
  const datos = {
    esquema: 3, version: 'v-de-prueba-1',
    productos: [
      { id: 'pan', nombre: 'Pan', formato: 'Unidad', categoria: 'Panes',
        precio: 12000, stock: 30, descripcion: 'Recién horneado.', imagenes: [], activo: true }
    ],
    envios: [{ id: 'centro', nombre: 'Centro', valor: 0 }],
    config: { negocio: 'Panadería La Espiga', pago_llave: 'NO-DEBE-SALIR-DE-AQUÍ' }
  };

  const antes   = conRelojFijo(ANTES,   () => hornear(datos));
  const despues = conRelojFijo(DESPUES, () => hornear(datos));

  const sinGenerado = o => { const c = Object.assign({}, o); delete c.generado; return JSON.stringify(c); };
  ok('EL CATÁLOGO ESTÁTICO: los mismos datos dan el mismo contenido, cruzando la medianoche UTC',
     sinGenerado(antes) === sinGenerado(despues),
     'lo único que puede diferir es "generado"');
  ok('  ...y SÍ cambia el sello "generado" -no es que el reloj no ande-',
     antes.generado !== despues.generado,
     antes.generado + ' vs ' + despues.generado);
  ok('  ...pago_llave nunca llega al archivo público',
     !JSON.stringify(antes).includes('NO-DEBE-SALIR'));
  ok('  ...y el orden de productos y envíos es el de la hoja, no uno recalculado',
     antes.productos[0].id === 'pan' && antes.envios[0].id === 'centro');
}

// ═══ 2. sembrar-respaldo.mjs: la MISMA salida, sin importar el reloj ═══
{
  const { bloque, aplicar } = require('../montar/sembrar-respaldo.mjs');
  const catalogo = {
    version: 'v-de-prueba-1',
    productos: [
      { id: 'pan', nombre: 'Pan', formato: 'Unidad', categoria: 'Panes',
        precio: 12000, stock: 30, descripcion: 'Recién horneado.', imagenes: [] }
    ],
    envios: [{ id: 'centro', nombre: 'Centro', valor: 0 }],
    config: { negocio: 'Panadería La Espiga' }
  };

  const b1 = conRelojFijo(ANTES,   () => bloque(catalogo, catalogo.version));
  const b2 = conRelojFijo(DESPUES, () => bloque(catalogo, catalogo.version));
  ok('EL BLOQUE DE RESPALDO no depende del reloj: byte a byte igual', b1 === b2);
  ok('  ...y dice la VERSIÓN, no fecha alguna',
     b1.includes('versión v-de-prueba-1') && !/\d{4}-\d{2}-\d{2}\s*═══/.test(b1),
     (b1.match(/CATÁLOGO DE RESPALDO[^\n]*/) || [''])[0]);

  const html = fs.readFileSync(path.join(RAIZ, 'plantilla/index.html'), 'utf8');
  const r1 = conRelojFijo(ANTES,   () => aplicar(html, catalogo, catalogo.version));
  const r2 = conRelojFijo(DESPUES, () => aplicar(html, catalogo, catalogo.version));
  ok('  ...y HORNEAR DOS VECES, cruzando la medianoche, deja el archivo idéntico',
     r1.html === r2.html,
     'esto es justo lo que antes dejaba sucio el git status al día siguiente');
  ok('  ...la segunda vuelta no reporta cambio contra la primera',
     r2.html === r1.html && (r1.html !== html ? true : true));
}

// ═══ 3. Nada de relojes en el camino que escribe archivos ═══
{
  const respaldoSrc = fs.readFileSync(path.join(RAIZ, 'montar/sembrar-respaldo.mjs'), 'utf8');
  ok('sembrar-respaldo.mjs YA NO llama a new Date() en ninguna parte',
     !/new Date\(\)/.test(respaldoSrc));

  const maestroSrc = fs.readFileSync(path.join(RAIZ, 'maestro.gs'), 'utf8');
  const generarInventario = maestroSrc.slice(
    maestroSrc.indexOf('function generarInventario()'),
    maestroSrc.indexOf('\nfunction', maestroSrc.indexOf('function generarInventario()') + 1));
  ok('generarInventario() (el camino manual, desde el menú) tampoco fecha el respaldo',
     !/new Date\(\)/.test(generarInventario) && /\bVERSION\b/.test(generarInventario),
     'tiene que quedar con la MISMA forma que el camino automático');

  ok('LOS DOS CAMINOS siguen escribiendo el mismo rótulo de apertura',
     /CATÁLOGO DE RESPALDO/.test(respaldoSrc) && /CATÁLOGO DE RESPALDO/.test(generarInventario),
     'si uno cambia la marca y el otro no, un día la expresión regular encuentra una y no la otra');
}

// ═══ 4. package-lock.json: versionado, y los flujos lo usan ═══
{
  ok('HAY package-lock.json en la raíz', fs.existsSync(path.join(RAIZ, 'package-lock.json')));
  ok('  ...y en pruebas/', fs.existsSync(path.join(RAIZ, 'pruebas/package-lock.json')));

  const gi = fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8');
  ok('  ...y NO está en .gitignore', !/^package-lock\.json$/m.test(gi));

  const FLUJOS = ['fotos.yml', 'montaje.yml', 'pruebas.yml'];
  FLUJOS.forEach(f => {
    const src = fs.readFileSync(path.join(RAIZ, '.github/workflows', f), 'utf8');
    const instala = (src.match(/npm (install|ci)[^\n]*/g) || []);
    ok(f + ': instala dependencias con `npm ci`, no `npm install`',
       instala.length > 0 && instala.every(l => /npm ci/.test(l)),
       instala.join(' | ') || 'no encontré ningún paso que instale');
  });
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
