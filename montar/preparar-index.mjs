/**
 * LA SEMILLA — hornear publicar/index.html desde plantilla/index.html
 * ---------------------------------------------------------------------------
 * Le pregunta al maestro cómo debe quedar el <head>, la paleta y las cinco
 * constantes, y escribe publicar/index.html DESDE CERO, a partir de
 * plantilla/index.html. Ya no parte del publicar/index.html de la corrida
 * anterior: eso era parchear un archivo que a la vez era fuente y producto,
 * y es exactamente lo que esta historia existe para dejar de hacer
 * (docs/PLAN-MVP.md, historia A-2).
 *
 *   node montar/preparar-index.mjs
 *   node montar/preparar-index.mjs --revisar    (no escribe; falla si hay diferencia)
 *
 * DOS REGLAS QUE NO SE NEGOCIAN
 * 1. O se aplica todo, o no se aplica nada. El archivo se arma entero en
 *    memoria; si un solo reemplazo no encuentra su sitio, no se escribe ni
 *    una letra. Un publicar/index.html a medias es peor que uno viejo: el
 *    viejo funciona.
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
const revisar = process.argv.includes('--revisar');

export const ESCRIBE = [PUBLICAR];

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

async function main() {
  const tienda = await laTienda();
  const datos = await alMaestro(tienda, 'bloques');
  const plantilla = await readFile(PLANTILLA, 'utf8');
  const nuevo = aplicar(plantilla, datos);

  let actual = null;
  try { actual = await readFile(PUBLICAR, 'utf8'); } catch { /* no existe: se crea */ }

  if (actual === nuevo) {
    console.log('publicar/index.html ya está al día con la hoja. Nada que hacer.');
    return;
  }

  if (revisar) {
    console.error('\npublicar/index.html NO está al día con la hoja.\n');
    console.error('Corre  npm run index  y vuelve a subir.\n');
    process.exit(1);
  }

  await writeFile(PUBLICAR, nuevo);
  console.log((actual === null ? 'publicar/index.html creado' : 'publicar/index.html actualizado') +
              ' desde plantilla/index.html y la hoja.');
  console.log('\nVersión del contrato: ' + datos.valores.SCRIPT_VERSION);
}

/* pathToFileURL y no una plantilla `file://…`: en Windows argv[1] llega como
   D:\CoWork\… y la comparación NUNCA coincide, así que el script se cargaba,
   no ejecutaba nada y salía con código 0. Un fallo silencioso que parece que
   funcionó. */
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
