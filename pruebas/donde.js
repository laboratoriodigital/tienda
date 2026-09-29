/* ¿ESTA COPIA ES LA SEMILLA O UNA TIENDA? (0.20.6 · bitácora 93)
 * ---------------------------------------------------------------------------
 * Las baterías no corren solo aquí: `montaje` las corre DENTRO de la tienda,
 * sobre los archivos recién horneados, y de su verde depende que se publique.
 * Y una tienda no tiene todo lo que tiene la semilla —`alta` no le hereda el
 * flujo `release`, ni el catálogo, ni las fotos de muestra— así que una
 * aserción escrita mirando este repositorio puede ser falsa allá sin que nada
 * esté mal. Cuando pasa, la tienda no publica y el motivo que se lee es
 * «batería en rojo», que no es el motivo.
 *
 * La regla, entonces: lo que dependa de SER la semilla se comprueba solo en la
 * semilla, y en una tienda se comprueba lo que allá sí es cierto —o se salta
 * DICIÉNDOLO (patrón 8, regla 2)—. Nunca en silencio.
 *
 * Cómo se sabe: lo mismo que mira `montar/actualizar-semilla.mjs`, para que no
 * haya dos maneras de contestar la misma pregunta (patrón 2). Sin
 * GITHUB_REPOSITORY —en el equipo de alguien— esto es la semilla.
 */
const fs = require('fs');
const path = require('path');

function esSemilla(env) {
  const e = env || process.env;
  const aqui = String(e.GITHUB_REPOSITORY || '').trim().toLowerCase();
  if (!aqui) return true;
  let conf = {};
  try { conf = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'semilla.json'), 'utf8')); } catch (x) { return true; }
  return aqui === String(conf.repositorio || '').trim().toLowerCase();
}

/* Para el mensaje de las que se saltan: dicen dónde están y por qué se saltan. */
function aqui(env) { return esSemilla(env) ? 'la semilla' : 'una tienda'; }

module.exports = { esSemilla, aqui };
