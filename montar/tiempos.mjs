/**
 * B-1 / B-6 — CUÁNTO TARDÓ ESTA CORRIDA, Y SI ESO CABE EN EL PRESUPUESTO
 * ---------------------------------------------------------------------------
 *   node montar/tiempos.mjs            (dentro de un flujo de Actions)
 *
 * POR QUÉ EXISTE.
 * «Publicar una foto tarda entre seis y ocho minutos» era una queja legítima y
 * nadie sabía de dónde salían esos minutos. La primera vez que se midió en
 * serio, la respuesta desmintió a la intuición por completo: las diez baterías
 * que uno quitaría primero costaban tres segundos y medio ENTRE TODAS. Sin el
 * número, el recorte habría caído sobre lo que no costaba nada y habría dejado
 * la tienda sin guardias.
 *
 * Así que el hito M1 empieza por medir, y esto es lo que mide. No hay que tocar
 * un solo paso de los flujos para instrumentarlo: **GitHub ya cronometra cada
 * paso** y lo publica en su API. Pedírselo es una llamada; escribir `date +%s`
 * en treinta pasos serían treinta sitios donde olvidarse de uno, y el que se
 * olvida es justo el que se come el reloj (patrón 2).
 *
 * LO QUE NO PUEDE MEDIR, Y LO DICE. El paso que hace esta consulta todavía no
 * ha terminado cuando la hace, así que su propia duración sale incompleta. Se
 * marca en la tabla en vez de disimularlo: un número que miente un poco y no
 * avisa es peor que uno que falta.
 *
 * EL GUARDIA (B-6). Por encima del objetivo, avisa y sigue: una máquina lenta
 * no es un fallo. Por encima del DOBLE, falla y NOMBRA LA FASE que se lo comió
 * — a esas alturas no es lentitud, es algo que se rompió, y un fallo que solo
 * dice «tardó mucho» obliga a abrir el log y buscar. Se desactiva con
 * SIN_GUARDIA=1 para una corrida excepcional.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const PRESUPUESTO = 'presupuesto.json';
const SALIDA = 'tiempos.json';
const RESUMEN = 'tiempos.md';

/* A-8: cada herramienta declara lo que escribe. Los dos son artefactos de la
   corrida, no del repositorio: no se versionan.

   Y el resumen se escribe en un ARCHIVO que el flujo concatena, en vez de
   abrir $GITHUB_STEP_SUMMARY desde aquí. Dos razones: escribir en una ruta que
   sale del entorno es justo lo que A-8 no puede declarar —lo cazó escribe.js—,
   y es como lo hacen todos los demás pasos de estos flujos: la herramienta
   imprime, el flujo redirige. Los avisos ::warning:: y ::error:: SÍ van por la
   salida estándar: una anotación dentro de un archivo no es una anotación. */
export const ESCRIBE = [SALIDA, RESUMEN];

/* Los pasos que no son trabajo del flujo sino andamiaje suyo. Se miden igual
   —aparecen en la tabla— pero no se les puede echar la culpa de un exceso: si
   `Set up job` tarda, no hay nada que arreglar en este repositorio. */
const ANDAMIAJE = /^(Set up job|Complete job|Post |Checkout|Set up runner)/i;

/** Segundos entre dos marcas ISO, o 0 si falta alguna. */
export function duracion(a, b) {
  const t0 = Date.parse(a || ''), t1 = Date.parse(b || '');
  return Number.isFinite(t0) && Number.isFinite(t1) ? Math.max(0, (t1 - t0) / 1000) : 0;
}

/**
 * La parte pura, para que una batería la pueda probar sin red: recibe el
 * trabajo tal como lo devuelve la API y el presupuesto, y contesta qué pasó.
 */
export function analizar(job, presupuesto, flujo) {
  const pasos = (job.steps || [])
    .filter(s => s.conclusion !== 'skipped')
    .map(s => ({
      fase: s.name,
      segundos: duracion(s.started_at, s.completed_at),
      andamiaje: ANDAMIAJE.test(s.name || '')
    }));

  const total = duracion(job.started_at, job.completed_at) ||
                pasos.reduce((s, p) => s + p.segundos, 0);

  pasos.forEach(p => { p.porciento = total ? (p.segundos * 100 / total) : 0; });
  pasos.sort((a, b) => b.segundos - a.segundos);

  /* Los minutos de Actions se facturan por minuto EMPEZADO, no por segundo:
     una corrida de 61 segundos cuesta dos. Redondear hacia abajo aquí sería
     contarse un presupuesto que no se tiene. */
  const minutos = Math.ceil(total / 60);

  const objetivo = Number((presupuesto.segundos || {})[flujo]) || 0;
  const culpable = pasos.find(p => !p.andamiaje) || pasos[0] || null;

  let veredicto = 'dentro';
  if (objetivo && total > objetivo * 2) veredicto = 'roto';
  else if (objetivo && total > objetivo) veredicto = 'pasado';

  return { flujo, total, minutos, objetivo, veredicto, culpable, pasos,
           minutosAlMes: presupuesto.minutosAlMes || 0 };
}

/** La tabla, en Markdown, para el resumen de la corrida. */
export function tabla(a, incompleto) {
  const f = n => (n >= 60 ? Math.floor(n / 60) + 'm ' + Math.round(n % 60) + 's'
                          : n.toFixed(1) + 's');
  /* Se descartan los pasos que no llegan a medio segundo —solo serían ruido—,
     PERO nunca el que sigue en marcha: ese vale 0 porque todavía no ha
     terminado, y esconderlo es justo lo contrario de decir que falta. */
  const filas = a.pasos
    .filter(p => p.segundos >= 0.5 || p.fase === incompleto)
    .map(p => `| ${p.fase}${p.fase === incompleto ? ' *(sin terminar)*' : ''} ` +
              `| ${f(p.segundos)} | ${p.porciento.toFixed(0)} % |`);

  const lineas = [
    `### Los tiempos · ${f(a.total)} · ${a.minutos} minuto(s) de Actions`,
    '',
    '| Fase | Segundos | % |',
    '|---|---:|---:|',
    ...filas,
    '',
  ];

  if (!a.objetivo) {
    lineas.push(`El presupuesto no dice nada de \`${a.flujo}\`, así que no hay contra qué comparar.`);
  } else if (a.veredicto === 'dentro') {
    lineas.push(`Dentro del presupuesto (objetivo ${f(a.objetivo)}).`);
  } else if (a.veredicto === 'pasado') {
    lineas.push(`**Por encima del objetivo** (${f(a.total)} contra ${f(a.objetivo)}). ` +
                `No falla: una máquina lenta no es un fallo. Pero si se repite, mira la tabla.`);
  } else {
    lineas.push(`**Más del doble del objetivo** (${f(a.total)} contra ${f(a.objetivo)}). ` +
                `A estas alturas no es lentitud: lo que más tiempo se llevó fue ` +
                `**${a.culpable ? a.culpable.fase : '(no se pudo decir)'}**.`);
  }
  lineas.push('', `Techo mensual por tienda: **${a.minutosAlMes} minutos**. ` +
                  `Esta corrida gastó ${a.minutos}.`);
  return lineas.join('\n');
}

async function principal() {
  const repo  = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const flujo = process.env.GITHUB_WORKFLOW || '';
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const yo    = process.env.GITHUB_JOB;

  if (!repo || !runId || !token) {
    console.log('Fuera de Actions no hay nada que medir (falta GITHUB_RUN_ID o el token).');
    return;
  }

  const r = await fetch(
    `https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`,
    { headers: { authorization: 'Bearer ' + token,
                 accept: 'application/vnd.github+json' } });
  if (!r.ok) {
    /* Esto NO tumba la corrida: medir es un servicio, no el trabajo. Un fallo
       aquí que hiciera fallar un montaje bueno sería el peor cambio posible. */
    console.log(`No se pudo pedir los tiempos (HTTP ${r.status}). La corrida sigue.`);
    return;
  }

  const { jobs = [] } = await r.json();
  /* El trabajo de ESTA corrida: por nombre cuando se puede, y si no el último
     que siga en marcha, que es este. */
  const job = jobs.find(j => j.name === yo) ||
              jobs.find(j => j.status === 'in_progress') || jobs[0];
  if (!job) { console.log('La API no devolvió ningún trabajo. La corrida sigue.'); return; }

  let presupuesto = {};
  try { presupuesto = JSON.parse(await readFile(PRESUPUESTO, 'utf8')); } catch { }

  const a = analizar(job, presupuesto, flujo.toLowerCase());
  const enCurso = (job.steps || []).find(s => s.status === 'in_progress');

  await writeFile(SALIDA, JSON.stringify({
    flujo: a.flujo, corrida: runId, total: a.total, minutos: a.minutos,
    objetivo: a.objetivo, veredicto: a.veredicto,
    pasos: a.pasos.map(p => ({ fase: p.fase, segundos: p.segundos,
                               porciento: Number(p.porciento.toFixed(1)) }))
  }, null, 1) + '\n');

  const md = tabla(a, enCurso ? enCurso.name : null);
  await writeFile(RESUMEN, md + '\n');
  console.log(md);

  if (process.env.SIN_GUARDIA === '1') {
    console.log('\nEl guardia del presupuesto está desactivado para esta corrida.');
    return;
  }
  if (a.veredicto === 'pasado') {
    console.log(`::warning::Por encima del presupuesto: ${Math.round(a.total)}s contra ${a.objetivo}s.`);
  } else if (a.veredicto === 'roto') {
    console.log(`::error::Más del DOBLE del presupuesto: ${Math.round(a.total)}s contra ` +
                `${a.objetivo}s. La fase que más se llevó: ${a.culpable ? a.culpable.fase : '?'}.`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  principal().catch(e => { console.log('No se pudieron medir los tiempos: ' + e.message); });
}
