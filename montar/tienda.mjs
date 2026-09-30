/**
 * ORGÁNICO — de dónde salen la URL y el token de la tienda
 * ---------------------------------------------------------------------------
 * Lo comparten las herramientas de montaje. Busca, en este orden:
 *
 *   1. Las variables de entorno MAESTRO_URL y MAESTRO_TOKEN.
 *      Es lo que se usa en un flujo automático, con secretos del repositorio.
 *   2. El archivo tienda.json en la raíz, que NO se versiona.
 *      Es lo que se usa en tu máquina.
 *
 * El token no es un secreto fuerte —el comercio lo puede leer en su propio
 * stub— pero tampoco tiene por qué quedar en el historial de Git, así que el
 * archivo está en .gitignore y nunca se escribe desde aquí.
 */
import { readFile, rm } from 'node:fs/promises';

/* Biblioteca compartida: helpers de red y de lectura de tienda.json. No
   escribe nada por su cuenta. */
export const ESCRIBE = [];

export async function laTienda() {
  let url = process.env.MAESTRO_URL || '';
  let token = process.env.MAESTRO_TOKEN || '';

  if (!url || !token) {
    try {
      const j = JSON.parse(await readFile('tienda.json', 'utf8'));
      url = url || j.maestro || j.url || '';
      token = token || j.token || '';
    } catch { /* que hable el mensaje de abajo */ }
  }

  if (!url || !token) {
    console.error(
      '\nNo sé a qué tienda apuntar.\n\n' +
      'En tu máquina, crea tienda.json en la raíz (no se versiona):\n\n' +
      '    {\n' +
      '      "maestro": "https://script.google.com/macros/s/AAA.../exec",\n' +
      '      "token":   "tk-..."\n' +
      '    }\n\n' +
      'Los dos datos salen del menú de la hoja > Diagnóstico, bajo\n' +
      '"PARA EL PANEL DE TIENDAS".\n\n' +
      'En un flujo automático, con las variables MAESTRO_URL y MAESTRO_TOKEN.\n');
    process.exit(1);
  }

  if (!/\/exec$/.test(url)) {
    console.error('\nLa URL tiene que terminar en /exec. La /dev solo funciona ' +
                  'para el dueño del proyecto.\n\n    ' + url + '\n');
    process.exit(1);
  }

  return { url: url.replace(/\?.*$/, ''), token };
}

/* CUÁNTO SE ESPERA ANTES DE DARSE POR VENCIDO.
   `fetch` sin señal espera para siempre. El flujo `fotos` se cayó una vez tras
   5 minutos exactos en «Bajarlas y convertirlas» y no dejó ni una línea que
   dijera en qué se había quedado: cinco minutos de silencio y un rojo. Apps
   Script se toma su tiempo entregando una foto en base64, así que el tope de
   una foto es alto; el de las demás, más corto.

   PERO «CORTO» ERAN 45 SEGUNDOS Y NO ALCANZABAN EL DÍA QUE MÁS FALTA HACÍA.
   Montando la segunda tienda, `?a=bloques` contestó bien desde
   publicar-maestro.mjs y, segundos después, se plantó en 45 s desde
   preparar-index.mjs. No era la tienda: era que Apps Script está FRÍO. La
   primera llamada después de actualizar una implementación —y las primeras de
   una cuenta recién creada— tardan lo suyo, y ese es justo el momento del
   montaje en que se hacen.

   Así que el tope sube y, sobre todo, SE REINTENTA: un plantón en frío no es
   un fallo, es la primera vez. Lo que no se hace es esperar en silencio; cada
   intento dice cuánto lleva. */
const ESPERA = { foto: 180000, otras: 90000 };
const REINTENTOS = 2;

/* LO QUE NO SE REINTENTA, Y POR QUÉ.
   Un plantón no dice si la petición no llegó o si llegó y la respuesta se
   perdió. Para una LECTURA da igual: se vuelve a preguntar. Para algo que
   ESCRIBE, no: reintentar puede escribir dos veces.
   `sembrar` es la única que escribe en la hoja desde aquí. Hoy da la
   casualidad de que es idempotente —pone las mismas claves— pero apoyarse en
   esa casualidad es exactamente cómo se cuela un doble registro el día que
   deje de serlo. */
export const SIN_REINTENTO = ['sembrar'];

/* Cuando una llamada tarda de verdad, que se vea. Este número —«contestó en
   38 s»— es el que habría explicado el plantón de la segunda tienda en un
   vistazo, y no estaba en ninguna parte. */
const RUIDOSA_DESDE = 5000;

/* 0.22.4 · bitácora 107. Un 404 que llega rápido es de la implementación
   (acceso, URL); uno que llega tras esperar es casi siempre la redirección a
   script.googleusercontent.com, que caduca. Se reintenta, con pausa. */
export const LENTO_404 = Number(process.env.LENTO_404_MS || 15000);   // la variable, solo para las pruebas
export const esRedireccionCaducada = tardo => tardo >= LENTO_404;
const REINTENTOS_404 = 3;
const ESPERA_404 = Number(process.env.ESPERA_404_MS || 10000);

/* Las tres decisiones del plantón, sueltas y probables de verdad. Estaban
   metidas dentro de `alMaestro`, que necesita un servidor y noventa segundos
   para ejercitarse; así una batería puede preguntar por la política sin
   montar una tienda. La que estuvo mal fue la tercera. */
export const topeDe      = accion => accion === 'foto' ? ESPERA.foto : ESPERA.otras;
export const seReintenta = accion => SIN_REINTENTO.indexOf(accion) === -1;

export function mensajeDePlanton(accion, extra = {}) {
  return 'El maestro no contestó en ' + Math.round(topeDe(accion) / 1000) +
    ' segundos a la petición «' + accion + '»' +
    (seReintenta(accion) ? ', ni al reintentar.\n'
                         : '. No se reintenta porque escribe en la hoja.\n') +
    /* EL CONSEJO TIENE QUE SER DE LO QUE FALLÓ. Este mensaje hablaba de fotos
       que pesan demasiado SIEMPRE, dijera lo que dijera la acción: en un
       plantón de «bloques» mandaba a buscar una foto grande que no existía. */
    (accion === 'foto'
      ? 'Casi siempre es que la foto' + (extra.id ? ' (id ' + extra.id + ')' : '') +
        ' pesa demasiado para que Apps Script\nla entregue en base64: bájala ' +
        'de tamaño en el Drive y vuelve a correr.'
      : 'Con «' + accion + '» casi nunca es la red. Las dos causas:\n' +
        '  · La implementación quedó con acceso «Solo yo»: entonces la /exec\n' +
        '    devuelve la pantalla de inicio de sesión de Google y se queda ahí.\n' +
        '    Implementar > Gestionar implementaciones > lápiz > Quién tiene\n' +
        '    acceso: Cualquier persona.\n' +
        '  · O el script se quedó colgado: ábrelo y mira Ejecuciones.');
}

/* QUÉ ACCIONES HA CONTESTADO YA CADA MAESTRO EN ESTA CORRIDA. No es una caché
   —no se reutiliza ninguna respuesta— : es lo que le permite a un error decir
   «esto ya está descartado» en vez de mandar a revisar algo que funciona. */
const RESPONDIO = new Map();

/* ══ B-3 · LO QUE YA SE PREGUNTÓ EN ESTA CORRIDA NO SE VUELVE A PREGUNTAR ══
   `montar/sondear.mjs` pide de una vez, y en paralelo, las cuatro acciones que
   el flujo pide siempre, y las deja en sondeo.json. Una herramienta lanzada con
   `--desde` las lee de ahí.

   ESTO VIVE AQUÍ Y NO EN CADA HERRAMIENTA a propósito. Por `alMaestro` pasan
   TODAS las preguntas; ponerlo en cada una serían siete sitios donde acordarse,
   y el que se olvida vuelve a preguntar sin que nadie lo note. Así ninguna
   herramienta tuvo que cambiar una línea, y `--desde` no puede quedarse a
   medias.

   SIN `--desde`, NADA DE ESTO PASA. Cada herramienta sigue funcionando sola,
   que es como se usan a mano y como se prueban.

   Y NO ES UNA CACHÉ. Caduca a los diez minutos. La diferencia no es de grado:
   una caché sobrevive entre corridas, y entonces un montaje puede publicar el
   catálogo de hace una hora sin que nadie se entere. Esto vale para la corrida
   que lo escribió. Cuando está vencido se dice en voz alta y se pregunta al
   maestro — el camino lento, nunca el dato viejo. */
export const SONDEO = 'sondeo.json';
export const VIGENCIA_SONDEO = 10 * 60 * 1000;

let sondeoEnMemoria;          // se lee una vez por proceso, no una por pregunta

/* EL SONDEO SE TIRA CUANDO EL MAESTRO CAMBIA. Se toma al principio de la
   corrida, ANTES de publicar el maestro, y `bloques` trae la versión que
   contestaba entonces. Sin esto, un montaje con la casilla del maestro
   horneaba el index con la versión ANTERIOR a la que acababa de publicar: el
   index siempre una publicación por detrás, y las baterías en rojo con «LA
   VERSIÓN del maestro y la del index son la misma». Pasó dos veces seguidas el
   21 de septiembre de 2026 (bitácora 56). Lo llama publicar-maestro.mjs en
   cuanto la versión nueva queda publicada; lo que venga después pregunta. */
export async function olvidarSondeo() {
  sondeoEnMemoria = undefined;
  try { await rm(SONDEO, { force: true }); } catch { /* no estaba: nada que olvidar */ }
}

async function delSondeo(accion, extra) {
  if (!process.argv.includes('--desde')) return null;
  /* Una pregunta con parámetros —`foto` con su id— no tiene una respuesta
     guardable: son N peticiones distintas y seguirán siendo N. */
  if (extra && Object.keys(extra).length) return null;

  if (sondeoEnMemoria === undefined) sondeoEnMemoria = (async () => {
    let s;
    try { s = JSON.parse(await readFile(SONDEO, 'utf8')); }
    catch { return null; }                      // no hay sondeo: se pregunta
    const edad = Date.now() - Date.parse(s.cuando || '');
    if (!(edad >= 0 && edad < VIGENCIA_SONDEO)) {
      console.log(`  · ${SONDEO} está vencido (${Math.round(edad / 60000)} min). ` +
                  `Se le pregunta al maestro.`);
      return null;
    }
    return s;
  })();

  const s = await sondeoEnMemoria;
  if (!s || !s.respuestas) return null;
  return Object.prototype.hasOwnProperty.call(s.respuestas, accion)
    ? s.respuestas[accion] : null;
}

/** Una llamada al maestro, con los errores dichos en cristiano. */
export async function alMaestro({ url, token }, accion, extra = {}) {
  const guardada = await delSondeo(accion, extra);
  if (guardada !== null && guardada !== undefined) {
    console.log(`  · «${accion}» sale del sondeo de esta corrida, sin volver a preguntar.`);
    RESPONDIO.set(url, (RESPONDIO.get(url) || new Set()).add(accion));
    return guardada;
  }

  /* 1.0.0 · EL TOKEN VA EN EL CUERPO, NUNCA EN LA DIRECCIÓN (ROADMAP 5.7,
     bitácora 113). Una dirección queda en los registros de Google y en los de
     cualquier intermediario; el cuerpo de un POST, no. El maestro atiende las
     puertas de montaje por POST desde la 0.16.0 (`atenderPorPost`), así que
     esto funciona también contra un maestro viejo mientras se actualiza.
     Texto plano y no application/json: es lo que Apps Script recibe sin
     preguntar antes por CORS, igual que el panel. */
  const cuerpo = JSON.stringify({ a: accion, t: token, ...extra });
  const tope = topeDe(accion);
  let r, tardo = 0;
  for (let intento = 1; ; intento++) {
    const arranque = Date.now();
    try {
      r = await fetch(url, { method: 'POST', redirect: 'follow', body: cuerpo,
                             headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                             signal: AbortSignal.timeout(tope) });
      tardo = Date.now() - arranque;
      if (tardo >= RUIDOSA_DESDE) {
        console.log('  · «' + accion + '» contestó en ' + Math.round(tardo / 1000) +
                    ' s' + (intento > 1 ? ' (intento ' + intento + ')' : '') + '.');
      }
      /* 0.22.4 · UN 404 TRAS UNA ESPERA LARGA SE REINTENTA (bitácora 107).
         Apps Script entrega la respuesta desde script.googleusercontent.com
         por una redirección que caduca: si el script tarda —frío, recién
         publicado—, el 404 llega de esa redirección y no de la implementación.
         Pasó en la semilla: «identidad contestó en 41 s» y 404, y el montaje
         murió mandando a revisar un acceso que estaba bien. Una LECTURA se
         vuelve a pedir; la siguiente, con el script ya caliente, contesta. */
      if (r.status === 404 && seReintenta(accion) && esRedireccionCaducada(tardo) &&
          intento < REINTENTOS_404) {
        console.log('  · «' + accion + '» devolvió 404 tras ' + Math.round(tardo / 1000) +
                    ' s: con una respuesta lenta es la redirección de Google que caduca, ' +
                    'no el acceso. Reintento ' + (intento + 1) + ' de ' + REINTENTOS_404 + '…');
        await new Promise(listo => setTimeout(listo, ESPERA_404));
        continue;
      }
      break;
    } catch (e) {
      /* Un plantón se nombra como lo que es. «fetch failed» a secas mandaba a
         buscar un problema de red que casi nunca era el problema. */
      const planton = e.name === 'TimeoutError' || e.name === 'AbortError';
      if (planton && intento < REINTENTOS && seReintenta(accion)) {
        console.log('  · «' + accion + '» no contestó en ' + Math.round(tope / 1000) +
                    ' s. Apps Script suele estar frío justo después de publicar; ' +
                    'reintento ' + (intento + 1) + ' de ' + REINTENTOS + '…');
        continue;
      }
      if (planton) throw new Error(mensajeDePlanton(accion, extra));
      throw new Error('No pude hablar con el maestro: ' + e.message);
    }
  }
  if (r.status === 404) {
    /* EL CONSEJO TIENE QUE SER DE LO QUE FALLÓ, Y NO CONTRADECIR LO QUE YA SE
       VIO FUNCIONAR. Este mensaje decía siempre «casi seguro la implementación
       quedó con acceso Solo yo» — y en la tienda tres salió DESPUÉS de que el
       mismo maestro, en la misma corrida, hubiera contestado «identidad»,
       «bloques» y «fotos». Con acceso «Solo yo» no habría contestado ninguna.
       El técnico se fue a mirar una implementación que estaba bien.
       Así que el diagnóstico solo se ofrece cuando no está ya descartado. */
    const yaContesto = RESPONDIO.has(url);
    const lento = esRedireccionCaducada(tardo);
    throw new Error(
      'El maestro respondió 404 a «' + accion + '»' +
      (extra.id ? ' (id ' + extra.id + ')' : '') + '.\n\n' +
      (yaContesto
        ? 'NO es la implementación: este mismo maestro ya contestó bien en esta\n' +
          'corrida (' + [...RESPONDIO.get(url)].join(', ') + '). Un 404 en UNA\n' +
          'acción y no en las otras es casi siempre una de dos:\n' +
          '  · Apps Script sirve los datos desde script.googleusercontent.com,\n' +
          '    por una redirección que CADUCA. Una respuesta grande o lenta\n' +
          '    —una foto, un catálogo largo— llega a pedirla tarde y se\n' +
          '    encuentra un 404. Volver a correr suele bastar.\n' +
          '  · O lo que se pidió ya no está: una foto borrada del Drive que la\n' +
          '    hoja todavía nombra.\n\n' +
          'Mira la pestaña Errores de la hoja y las Ejecuciones del proyecto.'
        : lento
        ? 'Tardó ' + Math.round(tardo / 1000) + ' s en contestar ese 404' +
          (seReintenta(accion) ? ', también al reintentar' : '') + '. Con acceso\n' +
          '«Solo yo» Google contesta en un segundo con su pantalla de inicio de\n' +
          'sesión: un 404 tras una espera larga es la redirección de\n' +
          'script.googleusercontent.com, que CADUCA cuando el script está frío o\n' +
          'recién publicado. Vuelve a correr en unos minutos. Si se repite, mira las\n' +
          'Ejecuciones del proyecto: algo lo está haciendo lento.'
        : 'Ninguna acción ha contestado todavía en esta corrida, así que lo\n' +
          'primero a descartar es el acceso de la implementación:\n' +
          'Implementar > Gestionar implementaciones > lápiz > Quién tiene\n' +
          'acceso: Cualquier persona.'));
  }
  /* Lo que SÍ contestó, para que el mensaje de arriba pueda descartar. */
  if (!RESPONDIO.has(url)) RESPONDIO.set(url, new Set());
  RESPONDIO.get(url).add(accion);
  if (!r.ok) throw new Error('El maestro respondió ' + r.status + '.');

  const texto = await r.text();
  let d;
  try { d = JSON.parse(texto); }
  catch { throw new Error('El maestro no devolvió JSON. Primeros caracteres:\n' +
                          texto.slice(0, 200)); }
  if (!d.ok) throw new Error(d.error || 'El maestro respondió sin ok.');
  return d;
}
