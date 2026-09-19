/* ============================================================================
   UNA PRUEBA QUE DEPENDE DE QUÉ DÍA SE CORRE NO PRUEBA NADA.
   ----------------------------------------------------------------------------
   El 10 de septiembre de 2026, `tablero.js` amaneció en rojo sin que nadie
   hubiera tocado una línea. Llevaba una semana en verde. Y no era un fallo del
   producto: era la siembra.

   Dos trampas, las dos del mismo tipo:

   · Un pedido sembrado como «hace 40 días» con el comentario «fuera de todas
     las listas de 30 días». De las de 30 días, sí. De la comparación contra el
     MES PASADO, no: restar 40 días desde el 10 de septiembre cae en el 1 de
     agosto. Sus 200.000 se sumaban a la base de comparación. Esa batería solo
     pasaba los primeros nueve días de cada mes.

   · «Más vendidos» es una ventana RODANTE de 30 días, así que el mes pasado
     entra en ella o no según el calendario: el 1 de marzo, febrero empieza hace
     28 días. Con 4+2 unidades sembradas contra 5, el ranking se daba la vuelta
     esos dos días del año.

   Ninguna de las dos se ve leyendo el código. Las dos se ven corriéndolo otro
   día. Eso es lo que hace esto: corre la batería del tablero fingiendo ser cada
   día del año, y exige que el marcador salga igual en todos.

   POR QUÉ UN AÑO BISIESTO. 2028 tiene el 29 de febrero, y febrero es el mes que
   destapó la segunda trampa: es el único lo bastante corto para que el mes
   anterior quepa entero dentro de los 30 días.

   POR QUÉ ESTOS DÍAS Y NO LOS 366. Los que pueden cambiar de mes al restar:
   el principio —donde «hace 48 horas» ya es otro mes—, la franja del 10 al 12
   —donde caía la primera trampa— y los finales, que existen o no según el mes.
   Correr los 366 tarda cuatro veces más y no cubre un caso que estos no cubran.
   ============================================================================ */
const { execFileSync } = require('node:child_process');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const ANO = 2028;                                  // bisiesto, a propósito
const DIAS = [1, 2, 3, 10, 11, 12, 15, 27, 28, 29, 30, 31];

/* Se falsea `Date` antes de cargar la batería: `new Date()` sin argumentos
   devuelve el día que se está probando, y `new Date(a, b, c)` sigue siendo el
   de siempre. Así la batería no se entera de nada y no hay que tocarla. */
function correr(bateria, cuando, entorno) {
  const pre = 'const R = Date; const F = ' + cuando.getTime() + ';' +
    'global.Date = class extends R {' +
    '  constructor(...a) { return a.length ? new R(...a) : new R(F); }' +
    '  static now() { return F; }' +
    '};';
  try {
    const salida = execFileSync(process.execPath,
      ['-e', pre + "require('./" + bateria + "');"],
      { encoding: 'utf8', cwd: __dirname, timeout: 60000,
        env: Object.assign({}, process.env, entorno || {}) });
    const m = salida.match(/^Resultado: (\d+)\/(\d+)/m);
    if (!m) return { ok: false, detalle: 'no imprimió marcador' };
    return { ok: m[1] === m[2], detalle: m[1] + '/' + m[2],
             fallas: (salida.match(/^ FALLA \|[^\n]*/gm) || []) };
  } catch (e) {
    return { ok: false, detalle: 'reventó: ' + String(e.message).slice(0, 80) };
  }
}

/* Las que miran el calendario. `tablero.js` compara contra el mes pasado y
   lleva listas de 30 días; `correo.js` arma el resumen de la semana. Las demás
   no dependen de la fecha, y meterlas aquí multiplicaría el tiempo sin añadir
   una sola comprobación. */
const CALENDARIO = ['tablero.js', 'correo.js'];

CALENDARIO.forEach(function (bateria) {
  const malos = [];
  let corridas = 0;
  for (let m = 0; m < 12; m++) {
    DIAS.forEach(function (d) {
      const f = new Date(ANO, m, d, 14, 30);
      if (f.getMonth() !== m) return;               // 31 de febrero y demás
      corridas++;
      const r = correr(bateria, f);
      if (!r.ok) malos.push(f.toISOString().slice(0, 10) + '  ' + r.detalle +
                            (r.fallas && r.fallas.length ? '\n        ' +
                             r.fallas.slice(0, 2).join('\n        ') : ''));
    });
  }
  ok(bateria.toUpperCase() + ' da el mismo marcador cualquier día del año',
     malos.length === 0,
     malos.length ? corridas + ' días probados, ' + malos.length + ' en rojo:\n     ' +
                    malos.slice(0, 6).join('\n     ')
                  : corridas + ' días del ' + ANO + ', todos iguales');
});

/* ── NO SOLO QUÉ DÍA: TAMBIÉN A QUÉ HORA Y EN QUÉ HUSO ──────────────────────
   Lo de arriba mueve el DÍA y deja el huso quieto. Eso deja fuera una familia
   entera de fallos, y el 18 de septiembre de 2026 se cobró dos aserciones de
   `montaje.js`.

   El maestro nombra los respaldos con `diaDeHoy()`, que usa la fecha LOCAL —y
   tiene razón: un comercio colombiano quiere sus copias fechadas con SU día, no
   con el de Greenwich—. Las dos aserciones comparaban contra
   `new Date().toISOString()`, que es la fecha UTC. En un runner de Actions las
   dos coinciden siempre, porque va en UTC. En una máquina en horario de
   Colombia NO coinciden entre las 19:00 y la medianoche: son días distintos.

   Cinco horas en rojo todos los días, y ni una sola desde CI. Una prueba que
   solo falla en la máquina de quien la escribe, y nunca donde se mira, es peor
   que una que falla siempre.

   Así que aquí se corre a las horas en que el huso y UTC discrepan, con el
   huso puesto a mano: si alguien vuelve a mezclar las dos fechas, se cae aquí
   a cualquier hora del día, también en CI. */
{
  const HUSO = 'America/Bogota';          // UTC-5, el de las tiendas
  /* 23:30 y 19:05 locales ya son el día siguiente en UTC; 09:00 no. Con las
     tres, una comparación contra la fecha equivocada no tiene dónde esconderse. */
  const HORAS = [[23, 30], [19, 5], [9, 0]];
  const CON_HUSO = ['montaje.js'];

  CON_HUSO.forEach(function (bateria) {
    const malos = [];
    HORAS.forEach(function (h) {
      const f = new Date(2028, 5, 15, h[0], h[1]);
      const r = correr(bateria, f, { TZ: HUSO });
      if (!r.ok) malos.push(h[0] + ':' + ('0' + h[1]).slice(-2) + ' ' + HUSO +
                            '  ' + r.detalle +
                            (r.fallas && r.fallas.length ? '\n        ' +
                             r.fallas.slice(0, 2).join('\n        ') : ''));
    });
    ok(bateria.toUpperCase() + ' da el mismo marcador a cualquier hora, y en horario de Colombia',
       malos.length === 0,
       malos.length ? malos.length + ' de ' + HORAS.length + ' horas en rojo:\n     ' +
                      malos.join('\n     ')
                    : HORAS.length + ' horas, incluidas dos en que allá es otro día que en UTC');
  });
}

/* Y la trampa concreta, nombrada, para que no vuelva por la puerta de atrás:
   ningún pedido de la siembra puede estar fechado con un desfase en DÍAS que
   pueda aterrizar en el mes pasado. Los meses se restan con getMonth(), que no
   se equivoca; los días, no. */
{
  const fuente = require('node:fs').readFileSync(__dirname + '/tablero.js', 'utf8');
  /* Solo las LÍNEAS QUE FECHAN UN PEDIDO. Un desfase en días es legítimo para
     marcar el borde de una ventana —`hace30` lo usa— y es un error para fechar
     una fila sembrada: 40 días atrás cae en el mes pasado once días de cada
     doce. Mirar el archivo entero confundía las dos cosas y acusaba a `hace30`,
     que no había hecho nada. */
  const desfases = (fuente.match(/^linea\([^)]*\)/gm) || [])
    .concat(fuente.match(/^const \w+ = new Date\(ahora\.getTime\(\)[^;]*;/gm) || [])
    .filter(function (l) { return /linea\(/.test(l); })
    .map(function (l) { return Number((l.match(/getTime\(\) - (\d+) \* 24/) || [])[1]); })
    .filter(function (n) { return n > 27; });
  ok('LA SIEMBRA no fecha nada con un desfase en días que caiga en el mes pasado',
     desfases.length === 0,
     desfases.length ? 'hay ' + desfases.join(', ') + ' días de desfase: usa ' +
                       'new Date(año, mes - N, día)'
                     : 'los meses se restan con getMonth(), que no se equivoca');
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
