/* A-1 / A-9 — la semilla sin marca.
 * ---------------------------------------------------------------------------
 * Comprueba que ningún archivo de la semilla nombra al comercio de la línea
 * anterior (Orgánico): ni su nombre, ni su ciudad, ni su teléfono, ni su
 * repositorio, ni sus productos.
 *
 * La lista de términos prohibidos vive en UN SOLO sitio —
 * terminos-prohibidos.json, en la raíz del repositorio— y no aquí a mano:
 * dos listas del mismo criterio es como "chonto" terminó viviendo en tres
 * archivos distintos sin que nadie se enterara (BITACORA.md, patrón 2).
 *
 * No necesita servidor ni navegador: es una lectura de archivos.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const { terminos } = JSON.parse(
  fs.readFileSync(path.join(RAIZ, 'terminos-prohibidos.json'), 'utf8'));

/* plantilla/index.html: lo que se copia tal cual en cada tienda nueva.
   maestro.gs y panel.gs: el código que corre en la cuenta de CADA tienda,
   así que tampoco pueden nombrar al comercio anterior. */
/* Y publicar/404.html: la página que ve cualquiera que siga un enlace roto.
   Se hornea desde plantilla/404.html en cada montaje, pero el archivo del
   repositorio se quedó con el de la línea anterior hasta el 21 de septiembre
   —título y colores de Orgánico— y ninguna batería lo miraba. */
const ARCHIVOS = ['plantilla/index.html', 'maestro.gs', 'panel.gs', 'publicar/404.html'];

const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

ARCHIVOS.forEach(rel => {
  const ruta = path.join(RAIZ, rel);
  let texto;
  try {
    texto = fs.readFileSync(ruta, 'utf8');
  } catch (e) {
    ok(rel + ' existe y se puede leer', false, e.message);
    return;
  }
  const bajo = texto.toLowerCase();
  const encontrados = terminos.filter(t => bajo.includes(t.toLowerCase()));
  ok(rel + ' no nombra al comercio de la línea anterior', encontrados.length === 0,
     encontrados.join(', '));
});

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
