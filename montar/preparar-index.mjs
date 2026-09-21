/**
 * LA SEMILLA — hornear publicar/index.html y publicar/404.html desde plantilla/
 * ---------------------------------------------------------------------------
 * Le pregunta al maestro cómo debe quedar el <head>, la paleta y las cinco
 * constantes, y escribe publicar/index.html DESDE CERO, a partir de
 * plantilla/index.html. Ya no parte del publicar/index.html de la corrida
 * anterior: eso era parchear un archivo que a la vez era fuente y producto,
 * y es exactamente lo que esta historia existe para dejar de hacer
 * (docs/PLAN-MVP.md, historia A-2).
 *
 * Desde A-3 también hornea publicar/404.html desde plantilla/404.html, con el
 * mismo NEGOCIO que ya viene en la misma respuesta del maestro: pedirlo dos
 * veces sería la segunda lectura del mismo dato, y de las dos, una se queda
 * atrás (patrón 2 de BITACORA.md).
 *
 *   node montar/preparar-index.mjs
 *   node montar/preparar-index.mjs --revisar    (no escribe; falla si hay diferencia)
 *
 * DOS REGLAS QUE NO SE NEGOCIAN
 * 1. O se aplica todo, o no se aplica nada. Cada archivo se arma entero en
 *    memoria; si un solo reemplazo no encuentra su sitio, no se escribe ni
 *    una letra de ESE archivo. Un publicar/index.html a medias es peor que
 *    uno viejo: el viejo funciona.
 * 2. Si el maestro no contesta, esto FALLA en vez de escribir algo vacío. Una
 *    tienda publicada con SCRIPT_URL en blanco es una tienda muerta.
 *
 * QUÉ NO HORNEA TODAVÍA ESTE ARCHIVO
 * plantilla/index.html también trae huecos en la marca de la barra, la
 * portada, el pie, el flotante y EMPRESA — A-1 los dejó ahí para que abrir la
 * plantilla sin hornear no enseñe una tienda. Hoy esos huecos los llena la
 * página SOLA, en el navegador, apenas le llega la configuración — igual que
 * ya pasaba en la línea anterior, que nunca los horneaba. Bakearlos aquí
 * también, para que la primera pintada ya sea la correcta y no un corchete,
 * pide que la puerta `bloques` del maestro devuelva más que head/valores —
 * eso es un cambio de contrato, no de esta historia.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const PLANTILLA = 'plantilla/index.html';
const PUBLICAR  = 'publicar/index.html';
const PLANTILLA_404 = 'plantilla/404.html';
const PUBLICAR_404  = 'publicar/404.html';
const revisar = process.argv.includes('--revisar');

export const ESCRIBE = [PUBLICAR, PUBLICAR_404];

/* Cada constante se reemplaza por su nombre, no por su posición ni dentro de un
   bloque: así el archivo conserva sus comentarios y el orden que tenga. */
const CONSTANTES = [
  { clave: 'SCRIPT_URL',     busca: /const SCRIPT_URL\s*=\s*"[^"]*";/,
    pon: v => `const SCRIPT_URL = "${v}";` },
  { clave: 'SCRIPT_VERSION', busca: /const SCRIPT_VERSION\s*=\s*"[^"]*";/,
    pon: v => `const SCRIPT_VERSION = "${v}";` },
  { clave: 'FOTOS_HOSTS',    busca: /const FOTOS_HOSTS\s*=\s*\[[^\]]*\];/,
    pon: v => `const FOTOS_HOSTS = [${v.map(h => `"${h}"`).join(', ')}];` },
  { clave: 'NEGOCIO',        busca: /let\s+NEGOCIO\s*=\s*"[^"]*";/,
    pon: v => `let NEGOCIO  = "${v}";` },
  { clave: 'WHATSAPP',       busca: /let\s+WHATSAPP\s*=\s*"[^"]*";/,
    pon: v => `let WHATSAPP = "${v}";` }
];

/* El <head> generado empieza en la política de seguridad y termina en su
   propia marca de cierre. Las dos marcas las escribe el maestro, así que el
   contrato está en un solo lado. */
const HEAD = /<meta http-equiv="Content-Security-Policy"[\s\S]*?<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->/;

/* El marcador que deja plantilla/404.html en su <title>, para el mismo comercio
   que ya escribió NEGOCIO en el <script> de index.html. Escapado como HTML, no
   como cadena de JS: aquí es texto de la página, no un literal dentro de una
   etiqueta <script>. */
const MARCADOR_404 = '[NOMBRE DE LA TIENDA — sin hornear]';

function escaparHtml(t) {
  return String(t).replace(/[&<>"]/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}

/* Cada constante que falta, falta por su propia razón, y decir la de
   SCRIPT_URL para todas mandaba al técnico al sitio equivocado. */
function faltaEso(clave) {
  if (clave === 'SCRIPT_URL') {
    return 'El maestro no me dio SCRIPT_URL: falta publicar el proyecto.\n' +
           'Implementar > Aplicación web, y después abrir esa URL una vez.';
  }
  if (clave === 'WHATSAPP') {
    return 'La hoja no tiene whatsapp, y sin eso no hay venta: el botón de la\n' +
           'tienda no lleva a ninguna parte.\n\n' +
           'Viene vacío de fábrica A PROPÓSITO. Un número de fábrica es el peor\n' +
           'valor posible, porque funciona: la tienda queda mandándole los\n' +
           'pedidos al teléfono de otro y nadie se entera.\n\n' +
           'Ponlo en la pestaña Configuración, o pásalo al flujo montaje.';
  }
  if (clave === 'NEGOCIO') {
    return 'La hoja no tiene negocio, y ese nombre va en la portada, en el pie,\n' +
           'en el consentimiento de datos y en el menú de la propia hoja.';
  }
  return 'El maestro no me dio ' + clave + '.';
}

/* Arma publicar/index.html ENTERO a partir de plantilla/index.html: no toca
   ningún publicar/index.html anterior, ni para leerlo ni para parchearlo.
   Tira si algo no cuadra — la función no escribe nada, solo devuelve texto;
   quien la llama decide si lo escribe. */
export function aplicar(plantillaHtml, datos) {
  let salida = plantillaHtml;

  if (!HEAD.test(salida)) {
    throw new Error(
      'No encontré el bloque del <head> en ' + PLANTILLA + '. Tiene que ir ' +
      'desde la etiqueta Content-Security-Policy hasta el comentario ' +
      '"FIN DE LA CONFIGURACIÓN". Si lo borraste, no lo arma esta herramienta ' +
      'sola: revisa plantilla/index.html a mano.');
  }

  /* ══ UNA TIENDA A MEDIO CONFIGURAR NO SE PUBLICA ══
     Quién decide qué falta es el maestro, no este archivo: la lista vive en un
     solo sitio (LISTA_DE_ALTA, en maestro.gs) y aquí solo se obedece. Y lo que
     AVISA no bloquea — publicar una tienda sin descripción es feo, no roto. */
  if (datos.alta && datos.alta.bloquean && datos.alta.bloquean.length) {
    throw new Error(
      'Esta tienda todavía no puede vender. Falta en la pestaña Configuración:\n\n' +
      datos.alta.bloquean.map(x => '  · ' + x.clave + ' — ' + x.porQue).join('\n') +
      '\n\nLlénalas y vuelve a correr el montaje.');
  }
  if (datos.alta && datos.alta.avisan && datos.alta.avisan.length) {
    console.log('\n  ⚠ La tienda vende, pero queda a medias. Sin llenar:');
    datos.alta.avisan.forEach(x => console.log('      · ' + x.clave + ' — ' + x.porQue));
    console.log('    No bloquea el montaje. Conviene cerrarlo antes de cobrarle a nadie.\n');
  }

  /* CON QUÉ COLORES SALE LA TIENDA, DICHO EN VOZ ALTA.
     La paleta no se hornea del todo en el archivo —cambiar un color no
     necesita un despliegue—, pero el :root SÍ se escribe aquí: es lo que el
     navegador pinta ANTES de que llegue la configuración por red. Dejarlo
     con el gris de la plantilla sin avisar es el mismo parpadeo que ya se
     corrigió una vez para "el rojo tomate". */
  if (datos.colores) {
    const cl = datos.colores;
    const puestos = ['principal', 'secundario', 'alterno'].filter(k => cl[k]);
    if (puestos.length) {
      console.log('  Colores de la hoja: ' +
                  puestos.map(k => k + ' ' + cl[k]).join(' · '));
    } else {
      console.log('\n  ⚠ LA HOJA NO TRAE NINGÚN COLOR, así que la tienda sale con');
      console.log('    los de la plantilla (gris). Si los pusiste PINTANDO las celdas');
      console.log('    de Configuración, corre A0_instalar() en el editor del maestro');
      console.log('    para que el relleno se convierta en código, y vuelve.\n');
    }
    if (cl.ilegibles && cl.ilegibles.length) {
      console.log('\n  ⚠ HAY COLORES QUE NO SE PUEDEN LEER, y la página los ignora');
      console.log('    en silencio: se queda con el suyo. Tienen que ser seis');
      console.log('    dígitos con almohadilla, así: #D0211C');
      cl.ilegibles.forEach(x => console.log('      · ' + x));
      console.log('');
    }

    const paleta = { '--rojo': cl.principal, '--verde': cl.secundario, '--acento': cl.alterno };
    for (const [variable, color] of Object.entries(paleta)) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(String(color || ''))) continue;
      const busca = new RegExp('(\\n\\s*' + variable + ':)#[0-9A-Fa-f]{6}(;)');
      if (!busca.test(salida)) {
        throw new Error(
          'No encontré ' + variable + ' en el :root de ' + PLANTILLA + '.\n' +
          'La paleta de la tienda se escribe ahí, y si la declaración cambió de\n' +
          'forma esto dejaría la tienda con los colores grises de la plantilla sin\n' +
          'que nadie se entere. Prefiero parar.');
      }
      salida = salida.replace(busca, '$1' + color.toUpperCase() + '$2');
    }
  }

  salida = salida.replace(HEAD, () => datos.head);

  for (const c of CONSTANTES) {
    const valor = datos.valores[c.clave];
    if (valor === undefined || valor === null || valor === '') {
      throw new Error(faltaEso(c.clave));
    }
    /* Lo que instalar() deja entre corchetes es lo que nadie ha llenado
       todavía. Publicar así deja una tienda anunciándose como
       "[NOMBRE DEL COMERCIO]", que al menos se ve; lo que NO puede pasar es
       que se publique con los datos de OTRA tienda, y por eso la plantilla
       trae corchetes y no un valor que funcione. */
    if (typeof valor === 'string' && /^\[.*\]$/.test(valor.trim())) {
      throw new Error(
        c.clave + ' sigue sin llenar: la hoja dice ' + valor + '.\n\n' +
        'Ese es el valor que deja la instalación para que se vea que falta.\n' +
        'Llénalo en la pestaña Configuración, o pásalo al flujo montaje.');
    }
    if (!c.busca.test(salida)) {
      throw new Error('No encontré la constante ' + c.clave + ' en ' + PLANTILLA + '.');
    }
    salida = salida.replace(c.busca, () => c.pon(valor));
  }

  return salida;
}

/* Arma publicar/404.html ENTERO a partir de plantilla/404.html. Solo hornea el
   nombre del comercio en el <title> — es la única palabra de esa página que
   viene de un comercio en particular; el resto (el ícono, el mensaje) es igual
   para cualquier tienda a propósito, así que no hace falta plantilla por color
   ni por texto. */
export function aplicar404(plantilla404Html, negocio) {
  const buscado = '<title>' + MARCADOR_404 + ' — esa página no existe</title>';
  if (!plantilla404Html.includes(buscado)) {
    throw new Error(
      'No encontré el título con su marcador en ' + PLANTILLA_404 + '.\n' +
      'Tiene que decir exactamente:\n\n  ' + buscado);
  }
  const puesto = '<title>' + escaparHtml(negocio) + ' — esa página no existe</title>';
  return plantilla404Html.replace(buscado, puesto);
}

async function escribirSiCambio(ruta, nuevo, etiqueta) {
  let actual = null;
  try { actual = await readFile(ruta, 'utf8'); } catch { /* no existe: se crea */ }

  if (actual === nuevo) {
    console.log(etiqueta + ' ya está al día. Nada que hacer.');
    return false;
  }

  if (revisar) {
    console.error('\n' + etiqueta + ' NO está al día con la hoja.\n');
    return true;   // hay diferencia: quien llama decide cómo fallar
  }

  await writeFile(ruta, nuevo);
  console.log((actual === null ? etiqueta + ' creado' : etiqueta + ' actualizado') +
              ' desde su plantilla y la hoja.');
  return false;
}

/* ── EL MAESTRO VIVO Y EL DEL REPOSITORIO TIENEN QUE SER EL MISMO ──────────
   SCRIPT_VERSION se hornea con lo que CONTESTA el maestro publicado, y las
   baterías exigen que sea la VERSION de maestro.gs. Si el repositorio trae un
   maestro nuevo y nadie lo publicó, seguir es escribir un index que las
   baterías tumban diez minutos después con «LA VERSIÓN del maestro y la del
   index son la misma», un mensaje que dice QUÉ pasó pero no QUÉ HACER.

   Pasó dos veces seguidas el 21 de septiembre de 2026 (bitácora 56): el
   repositorio subió de versión y el montaje se disparó sin la casilla del
   maestro. Aquí se para antes de escribir nada, y dice qué casilla marcar.

   Devuelve el mensaje, o null si coinciden. Si la versión del repositorio no
   se puede leer no se inventa un fallo: las baterías siguen mirando. */
export function versionDesalineada(delRepositorio, laViva) {
  if (!delRepositorio || delRepositorio === laViva) return null;
  return [
    'EL MAESTRO PUBLICADO CONTESTA LA VERSIÓN ' + (laViva || '(ninguna)') +
      ' Y ESTE REPOSITORIO TRAE LA ' + delRepositorio + '.',
    '',
    'El index se hornea con la versión que contesta el maestro vivo, y las baterías',
    'exigen la del repositorio: seguir era escribir un index que no pasa.',
    '',
    'Qué hacer: vuelve a disparar «montaje» con la casilla',
    '«¿Publicar también maestro.gs?» MARCADA y PUBLICAR escrito abajo.',
    'O pega maestro.gs en el editor de Apps Script, publica una versión nueva de',
    'la implementación, y vuelve a dispararlo sin la casilla.',
    '',
    'No toqué nada.'
  ].join('\n');
}

async function versionDelRepositorio() {
  try {
    return ((await readFile('maestro.gs', 'utf8')).match(/var VERSION = '([^']+)'/) || [])[1] || '';
  } catch { return ''; }
}

async function main() {
  const tienda = await laTienda();
  let datos = await alMaestro(tienda, 'bloques');

  if (!revisar) {
    const delRepo = await versionDelRepositorio();
    /* RECIÉN PUBLICADO, GOOGLE PUEDE TARDAR EN SERVIRLO. El flujo lo avisa con
       ESPERAR_MAESTRO_S cuando publicó el maestro en esta misma corrida: se
       vuelve a preguntar cada quince segundos hasta ese tope antes de rendirse.
       Sin la variable no se espera: si nadie publicó, esperar no arregla nada.
       (Bitácora 57: el primer montaje de la 0.8.0 falló justo aquí y el
       segundo, un minuto después, pasó.) */
    const tope = Date.now() + (Number(process.env.ESPERAR_MAESTRO_S) || 0) * 1000;
    while (versionDesalineada(delRepo, datos.valores.SCRIPT_VERSION) && Date.now() < tope) {
      console.log('  · El maestro todavía contesta ' + datos.valores.SCRIPT_VERSION +
                  '; espero a que Google sirva la ' + delRepo + '…');
      await new Promise(listo => setTimeout(listo, 15000));
      datos = await alMaestro(tienda, 'bloques');
    }
    const falta = versionDesalineada(delRepo, datos.valores.SCRIPT_VERSION);
    if (falta) throw new Error(falta);
  }

  const plantilla = await readFile(PLANTILLA, 'utf8');
  const nuevo = aplicar(plantilla, datos);

  const plantilla404 = await readFile(PLANTILLA_404, 'utf8');
  const nuevo404 = aplicar404(plantilla404, datos.valores.NEGOCIO);

  const difiereIndex = await escribirSiCambio(PUBLICAR, nuevo, PUBLICAR);
  const difiere404   = await escribirSiCambio(PUBLICAR_404, nuevo404, PUBLICAR_404);

  if (revisar && (difiereIndex || difiere404)) {
    console.error('Corre  npm run index  y vuelve a subir.\n');
    process.exit(1);
  }

  if (!revisar) {
    console.log('\nVersión del contrato: ' + datos.valores.SCRIPT_VERSION);
  }
}

/* pathToFileURL y no una plantilla `file://…`: en Windows argv[1] llega como
   D:\CoWork\… y la comparación NUNCA coincide, así que el script se cargaba,
   no ejecutaba nada y salía con código 0. Un fallo silencioso que parece que
   funcionó. */
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
