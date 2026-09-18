/* B-1 / B-6 — la medición del reloj y el guardia del presupuesto.
 * ---------------------------------------------------------------------------
 * Prueba las funciones puras de montar/tiempos.mjs con un trabajo inventado,
 * igual que otras baterías conducen la hoja emulada de gas.js en vez de una
 * real. Ni red ni navegador: es aritmética sobre marcas de tiempo.
 *
 * POR QUÉ IMPORTA QUE ESTO ESTÉ PROBADO. Un medidor equivocado es peor que no
 * medir: no se queda callado, contesta — y las decisiones de M1 se toman con lo
 * que conteste. La primera medición de este proyecto ya desmintió a la
 * intuición por un factor grande; si el número hubiera estado mal, el recorte
 * habría caído sobre lo que no costaba nada.
 *
 *   node pruebas/tiempos.js
 */
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Un trabajo como los que devuelve la API de Actions. Los segundos están
   elegidos para que las cuentas se puedan hacer de cabeza: 300 en total. */
const t = s => new Date(Date.parse('2026-09-18T10:00:00Z') + s * 1000).toISOString();
const trabajo = {
  name: 'montar',
  started_at: t(0),
  completed_at: t(300),
  steps: [
    { name: 'Set up job',           started_at: t(0),   completed_at: t(10),  conclusion: 'success' },
    { name: 'Bajarlas y convertirlas', started_at: t(10),  completed_at: t(190), conclusion: 'success' },
    { name: 'Todas las baterías',   started_at: t(190), completed_at: t(280), conclusion: 'success' },
    { name: 'Publicar en main',     started_at: t(280), completed_at: t(295), conclusion: 'success' },
    { name: 'Un paso que no corrió', started_at: null,  completed_at: null,  conclusion: 'skipped' },
    { name: 'Los tiempos',          started_at: t(295), completed_at: null,  status: 'in_progress' }
  ]
};
const presupuesto = { segundos: { montaje: 330, fotos: 300 }, minutosAlMes: 100 };

(async () => {
  const { analizar, tabla, duracion } = await import('../montar/tiempos.mjs');

  // ── la aritmética ──
  ok('DURACIÓN entre dos marcas', duracion(t(0), t(90)) === 90, String(duracion(t(0), t(90))));
  ok('  ...y una marca que falta no inventa un número',
     duracion(t(0), null) === 0 && duracion(null, null) === 0,
     'un paso sin terminar vale 0, no NaN ni el reloj de ahora');

  const a = analizar(trabajo, presupuesto, 'montaje');

  ok('EL TOTAL sale del trabajo, no de sumar los pasos',
     a.total === 300, String(a.total) + 's');
  /* Sumar los pasos daría 295: entre el último paso y el final del trabajo hay
     tiempo que no es de ningún paso, y es tiempo que se factura igual. */
  ok('  ...que no es lo mismo: sumar los pasos deja fuera lo que no es de nadie',
     a.pasos.reduce((s, p) => s + p.segundos, 0) < a.total,
     'y ese hueco se paga igual');

  /* LOS MINUTOS SE FACTURAN POR MINUTO EMPEZADO. Redondear hacia abajo aquí es
     contarse un presupuesto que no se tiene. */
  ok('LOS MINUTOS se redondean HACIA ARRIBA, como los factura GitHub',
     a.minutos === 5, String(a.minutos) + ' para ' + a.total + 's');
  ok('  ...y un segundo de más ya cuesta un minuto entero',
     analizar({ started_at: t(0), completed_at: t(61), steps: [] }, presupuesto, 'montaje').minutos === 2,
     '61 segundos son 2 minutos de factura');

  // ── el orden y los porcentajes ──
  ok('LA TABLA sale ordenada por lo que más tiempo se llevó',
     a.pasos[0].fase === 'Bajarlas y convertirlas',
     a.pasos.map(p => p.fase).join(' · '));
  ok('  ...con su porcentaje, que es lo que dice dónde mirar',
     Math.round(a.pasos[0].porciento) === 60, a.pasos[0].porciento.toFixed(1) + ' %');
  ok('  ...y los pasos que no corrieron no ensucian la tabla',
     !a.pasos.some(p => p.fase === 'Un paso que no corrió'),
     'un paso saltado con 0 segundos solo añade ruido');

  // ── el guardia (B-6) ──
  ok('DENTRO del presupuesto no avisa de nada', a.veredicto === 'dentro',
     a.total + 's contra ' + a.objetivo + 's');

  const pasado = analizar({ ...trabajo, completed_at: t(400) }, presupuesto, 'montaje');
  ok('POR ENCIMA del objetivo avisa, pero NO falla', pasado.veredicto === 'pasado',
     'una máquina lenta no es un fallo');

  const roto = analizar({ ...trabajo, completed_at: t(900) }, presupuesto, 'montaje');
  ok('POR ENCIMA DEL DOBLE ya es otra cosa', roto.veredicto === 'roto',
     '900s contra un objetivo de 330');
  /* UN FALLO QUE SOLO DICE «TARDÓ MUCHO» OBLIGA A ABRIR EL LOG Y BUSCAR. */
  ok('  ...y NOMBRA la fase que se lo comió',
     roto.culpable && roto.culpable.fase === 'Bajarlas y convertirlas',
     roto.culpable ? roto.culpable.fase : '(no dice)');
  ok('  ...sin echarle la culpa al andamiaje del runner',
     !/^Set up job/.test(roto.culpable.fase),
     'si `Set up job` tarda no hay nada que arreglar en este repositorio');

  /* UN FLUJO SIN OBJETIVO NO SE INVENTA UNO. Poner un presupuesto por defecto
     haría fallar corridas por un número que nadie decidió. */
  const sinObjetivo = analizar(trabajo, presupuesto, 'un-flujo-cualquiera');
  ok('UN FLUJO SIN PRESUPUESTO no se inventa uno',
     sinObjetivo.objetivo === 0 && sinObjetivo.veredicto === 'dentro',
     'fallar por un número que nadie decidió es peor que no vigilar');

  // ── el resumen que se lee ──
  const md = tabla(a, 'Los tiempos');
  ok('EL RESUMEN trae la tabla fase / segundos / %',
     /\| Fase \| Segundos \| % \|/.test(md) && /Bajarlas y convertirlas/.test(md));
  ok('  ...y los minutos de Actions consumidos',
     /5 minuto\(s\) de Actions/.test(md), (md.split('\n')[0] || ''));
  ok('  ...y el techo mensual, que es contra lo que se decide si cabe otra tienda',
     /100 minutos/.test(md));
  /* EL PASO QUE MIDE NO HA TERMINADO CUANDO MIDE. Un número que miente un poco
     y no avisa es peor que uno que falta. */
  ok('  ...y marca el paso que todavía no había terminado al medir',
     /Los tiempos \*\(sin terminar\)\*/.test(md),
     'el paso que hace la consulta no puede conocer su propia duración');

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
