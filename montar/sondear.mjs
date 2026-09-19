/**
 * B-3 — UNA SOLA PREGUNTA AL MAESTRO
 * ---------------------------------------------------------------------------
 *   node montar/sondear.mjs
 *
 * POR QUÉ EXISTE.
 * En una corrida del flujo `fotos` se le preguntaba al maestro SIETE veces, y
 * tres de esas siete eran la misma pregunta repetida:
 *
 *     identidad   ← misma-tienda
 *     bloques     ← preparar-index --revisar
 *     fotos       ← traer-fotos --revisar
 *     catalogo    ← catalogo-estatico --revisar
 *     bloques     ← preparar-index          (otra vez)
 *     fotos       ← traer-fotos             (otra vez)
 *     catalogo    ← catalogo-estatico       (otra vez)
 *
 * La pasada de `--revisar` mira si hay algo que hacer; la de publicar lo hace.
 * Cada una preguntaba por su cuenta, y ninguna sabía que la otra ya tenía la
 * respuesta.
 *
 * Y no es una molestia estética: **Apps Script arranca en frío**. La primera
 * llamada después de actualizar una implementación tarda 40 segundos o más,
 * documentados, y siete llamadas en serie son siete oportunidades de pagarlo.
 * Está en el camino crítico de publicar una foto.
 *
 * QUÉ HACE ESTO. Pregunta las cuatro cosas **a la vez** —una espera en vez de
 * cuatro— y deja las respuestas en `sondeo.json`. Las herramientas que se
 * lancen con `--desde` las leen de ahí en vez de volver a preguntar.
 *
 * DÓNDE VIVE LA LÓGICA, Y POR QUÉ NO AQUÍ. La lectura del sondeo está dentro
 * de `alMaestro` (montar/tienda.mjs), que es por donde pasan TODAS las
 * preguntas. Ponerla en cada herramienta serían siete sitios donde acordarse,
 * y el que se olvida vuelve a preguntar sin que nadie lo note. Así, ninguna
 * herramienta tuvo que cambiar ni una línea.
 *
 * NO ES UNA CACHÉ. Caduca a los diez minutos, y esa es la diferencia entera:
 * una caché sobrevive entre corridas y entonces un montaje puede publicar el
 * catálogo de hace una hora sin que nadie se entere. Esto vale para la corrida
 * que lo escribió y para nada más. Pasados los diez minutos, las herramientas
 * vuelven a preguntar al maestro y lo dicen en voz alta.
 */
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro, SONDEO, VIGENCIA_SONDEO } from './tienda.mjs';

export const ESCRIBE = [SONDEO];

/* Las cuatro que el flujo pide SIEMPRE y que no llevan parámetros. `foto` no
   está y no puede estar: lleva un id distinto cada vez, así que no hay una
   respuesta que guardar — son N peticiones y seguirán siendo N. */
export const ACCIONES = ['identidad', 'bloques', 'fotos', 'catalogo'];

export async function sondear(tienda, acciones = ACCIONES) {
  /* EN PARALELO, QUE ES TODO EL PUNTO. Cuatro en serie contra un Apps Script
     frío son cuatro arranques; cuatro a la vez es uno. Y `allSettled` y no
     `all`: que una falle no puede impedir que las otras tres queden guardadas,
     porque entonces la herramienta que sí tenía su respuesta volvería a
     preguntar por nada. */
  const r = await Promise.allSettled(acciones.map(a => alMaestro(tienda, a)));

  const respuestas = {};
  const fallos = [];
  r.forEach((x, i) => {
    if (x.status === 'fulfilled') respuestas[acciones[i]] = x.value;
    else fallos.push({ accion: acciones[i],
                       porque: String((x.reason && x.reason.message) || x.reason).split('\n')[0] });
  });
  return { respuestas, fallos };
}

async function principal() {
  const tienda = await laTienda();
  const arranque = Date.now();
  const { respuestas, fallos } = await sondear(tienda);
  const seg = ((Date.now() - arranque) / 1000).toFixed(1);

  const hechas = Object.keys(respuestas);
  await writeFile(SONDEO, JSON.stringify({
    cuando: new Date().toISOString(),
    vigencia_ms: VIGENCIA_SONDEO,
    respuestas
  }, null, 1) + '\n');

  console.log(`Sondeo: ${hechas.length}/${ACCIONES.length} respuestas en ${seg}s, ` +
              `a la vez y no una detrás de otra.`);
  console.log('  ' + hechas.join(', ') + (hechas.length ? '' : '(ninguna)'));

  if (fallos.length) {
    /* NO SE FALLA AQUÍ. Lo que no se pudo sondear lo va a pedir su herramienta
       cuando le toque, y entonces fallará ahí, que es donde el mensaje puede
       decir qué se estaba haciendo. Tumbar la corrida desde el sondeo sería
       cambiar un error con contexto por uno sin él. */
    console.log(`\n${fallos.length} no contestó(aron); se preguntarán una por una:`);
    fallos.forEach(f => console.log(`  · ${f.accion.padEnd(12)} ${f.porque}`));
  }
  console.log(`\nCaduca en ${VIGENCIA_SONDEO / 60000} minutos. No es una caché ` +
              `entre corridas: es el estado de ESTA.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  principal().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
