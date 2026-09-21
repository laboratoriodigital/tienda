/* D-1 — entrar al panel.
 * ---------------------------------------------------------------------------
 * Esta batería es de las que tienen que fallar en rojo el día que alguien
 * «simplifique» algo, así que casi todas sus aserciones están escritas contra
 * una forma concreta de equivocarse, no contra la funcionalidad:
 *
 *   · Sin clave puesta NO SE ENTRA, y se contesta lo mismo que ante una clave
 *     mala. Un «esta tienda todavía no tiene clave» le dice a cualquiera que
 *     hay una puerta sin cerradura.
 *   · Vencido y falseado dan EL MISMO error. Distinguirlos le ahorra el trabajo
 *     a quien está probando testigos y no le sirve de nada a quien entró bien.
 *   · Un testigo de OTRA TIENDA no vale aquí. El fallo más caro de este
 *     proyecto —dos tiendas con los secretos cruzados— corre entero en verde;
 *     esta es una de las pocas cosas que lo pararían.
 *   · Cambiar la clave cierra las sesiones abiertas. Quien cambia una clave es
 *     porque cree que la vieja se sabe.
 *   · Y la lista de puertas: toda puerta declara a quién deja pasar, o la
 *     batería se cae. Una puerta sin guardia se comporta igual que una que
 *     funciona, y eso no se ve mirando.
 *
 *   node pruebas/entrar.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* `instalar()` imprime el stub entero por pantalla, y aquí eso son doscientas
   líneas por tienda emulada. Se calla solo mientras se monta. */
const nuevo = (hojaId) => {
  const decir = console.log;
  console.log = () => {};
  const g = crear('./as.js', hojaId ? { hojaId } : undefined);
  g.api.instalar(); configurar(g);
  console.log = decir;
  return g;
};
const j = r => JSON.parse(r._texto);
/* Por POST, como lo llama el panel: desde D-2 `entrar` y las puertas del
   panel se niegan a contestar por GET. */
const puerta = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
const porGet = (g, o) => j(g.api.doGet({ parameter: o }));

/* Deja la tienda lista para entrar y devuelve la clave, que es la única vez
   que se puede ver — igual que le pasa al comerciante. */
function conPanel(g, usuario) {
  const h = g.hojas.get('Configuración');
  const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'panel_usuario') + 1;
  h.getRange(fila, 2).setValue(usuario || 'dona.rosa');
  const salida = g.api.claveDelPanel();
  const clave = (String(salida.texto).match(/Clave:\s+(\S+)/) || [])[1];
  return clave;
}

(() => {
  // ═══ 1. El hash, que tiene que ser un hash ═══
  {
    const g = nuevo();
    /* EL EMULADOR HACÍA DE `computeDigest` LA IDENTIDAD, y con eso cualquier
       prueba de una clave guardada habría dado verde sin comprobar nada. Se
       fija aquí: dos sales distintas, dos huellas distintas; la misma clave y
       la misma sal, la misma huella. */
    const a = g.api.huellaDeClave('abrete-sesamo', 'sal-uno');
    const b = g.api.huellaDeClave('abrete-sesamo', 'sal-dos');
    const c = g.api.huellaDeClave('abrete-sesamo', 'sal-uno');
    ok('LA HUELLA ES UN HASH DE VERDAD: 64 hexadecimales', /^[0-9a-f]{64}$/.test(a), a.slice(0, 24));
    ok('  ...la misma sal y la misma clave dan la misma huella', a === c);
    ok('  ...y la sal cambia el resultado, que es para lo que está',
       a !== b, a.slice(0, 12) + ' vs ' + b.slice(0, 12));
    ok('  ...y la clave NO se puede leer dentro de la huella',
       a.indexOf('abrete') === -1 &&
       Buffer.from(a, 'hex').toString('latin1').indexOf('abrete') === -1);
  }

  // ═══ 2. Dónde vive cada mitad ═══
  {
    const g = nuevo();
    conPanel(g, 'dona.rosa');
    const config = JSON.stringify(g.filas('Configuración'));
    ok('EL USUARIO SÍ VA EN LA HOJA: es un nombre, no un secreto',
       /panel_usuario/.test(config) && /dona\.rosa/.test(config));
    ok('LA CLAVE NO ESTÁ EN NINGUNA CELDA de ninguna pestaña',
       [...g.hojas.keys()].every(n => !/PANEL_CLAVE/.test(JSON.stringify(g.filas(n)))));
    ok('  ...y en las propiedades solo está su huella con sal',
       /^[0-9a-f]{32}\$[0-9a-f]{64}$/.test(g.props.PANEL_CLAVE), String(g.props.PANEL_CLAVE).slice(0, 40));
    ok('  ...la clave de fábrica no existe: sin poner, no hay nada guardado',
       !crear('./as.js').props.PANEL_CLAVE);
  }

  // ═══ 3. Entrar ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    const r = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave });
    ok('CON USUARIO Y CLAVE se entra y sale un testigo', r.ok && !!r.testigo, r.error || r.testigo.slice(0, 30));
    ok('  ...con dos partes: lo firmado y la firma', String(r.testigo).split('.').length === 2);
    ok('  ...y el testigo NO lleva la clave dentro',
       r.testigo.indexOf(clave) === -1 &&
       Buffer.from(r.testigo.split('.')[0], 'base64').toString('utf8').indexOf(clave) === -1,
       Buffer.from(r.testigo.split('.')[0], 'base64').toString('utf8'));

    const s = puerta(g, { a: 'sesion', k: r.testigo });
    ok('  ...y sirve para decir quién soy y hasta cuándo',
       s.ok && s.usuario === 'dona.rosa' && new Date(s.vence) > new Date(),
       JSON.stringify(s));

    const horas = (new Date(s.vence) - Date.now()) / 3600000;
    ok('LAS OCHO HORAS son ocho horas', horas > 7.9 && horas < 8.1, horas.toFixed(2) + ' h');

    ok('EL USUARIO no distingue mayúsculas: nadie recuerda cómo lo escribió',
       puerta(g, { a: 'entrar', u: 'Doña.Rosa'.replace('ñ', 'n').toUpperCase(), c: clave }).ok);
    ok('  ...pero LA CLAVE sí las distingue',
       !puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave.toLowerCase() }).ok);
  }

  // ═══ 4. Lo que NO deja entrar ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    const malo = puerta(g, { a: 'entrar', u: 'dona.rosa', c: 'la-que-no-es' });
    const nadie = puerta(g, { a: 'entrar', u: 'el-que-no-existe', c: clave });
    ok('CLAVE MALA no entra', !malo.ok, malo.error);
    ok('USUARIO QUE NO EXISTE tampoco', !nadie.ok, nadie.error);
    /* Dos mensajes distintos convierten el formulario en un buscador de
       usuarios: se prueban nombres hasta que cambia la frase. */
    ok('  ...y las dos cosas contestan EXACTAMENTE lo mismo',
       malo.error === nadie.error, malo.error + ' / ' + nadie.error);
  }

  // ═══ 5. Sin clave puesta, el panel no existe ═══
  {
    const g = nuevo();
    const h = g.hojas.get('Configuración');
    const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'panel_usuario') + 1;
    h.getRange(fila, 2).setValue('dona.rosa');          // usuario sí, clave no
    const r = puerta(g, { a: 'entrar', u: 'dona.rosa', c: '' });
    const r2 = puerta(g, { a: 'entrar', u: 'dona.rosa', c: 'cualquier-cosa' });
    ok('SIN CLAVE PUESTA no se entra ni con la clave vacía', !r.ok, r.error);
    ok('  ...ni con cualquier otra', !r2.ok, r2.error);
    ok('  ...y no se cuenta que esta tienda todavía no tiene cerradura',
       !/no tiene|sin clave|todav/i.test(r.error), r.error);
  }

  // ═══ 6. Sin usuario en la hoja, la clave ni se pone ═══
  {
    const g = nuevo();
    const salida = g.api.claveDelPanel();
    ok('SIN USUARIO EN LA HOJA el menú no inventa uno: explica qué hacer',
       /panel_usuario/.test(salida.texto) && !g.props.PANEL_CLAVE,
       String(salida.texto).slice(0, 60));
  }

  // ═══ 7. El testigo: vencido, falseado, de otra tienda ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    const bueno = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;

    const falseado = bueno.slice(0, -1) + (bueno.slice(-1) === 'a' ? 'b' : 'a');
    const inventado = Buffer.from('dona.rosa|' + (Date.now() + 1e9) + '|HojaEmulada|xxxxxxxx')
                            .toString('base64url') + '.' + 'ff'.repeat(32);
    /* Vencido de verdad: se arma con el reloj corrido, no se espera ocho horas. */
    const antes = Date.now;
    Date.now = () => antes() - 9 * 3600 * 1000;
    const viejo = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
    Date.now = antes;

    const rF = puerta(g, { a: 'sesion', k: falseado });
    const rI = puerta(g, { a: 'sesion', k: inventado });
    const rV = puerta(g, { a: 'sesion', k: viejo });
    ok('UN TESTIGO RETOCADO no vale', !rF.ok, rF.error);
    ok('UN TESTIGO INVENTADO sin la firma de esta tienda tampoco', !rI.ok, rI.error);
    ok('UN TESTIGO VENCIDO tampoco', !rV.ok, rV.error);
    /* «Caducó» y «esa firma no es mía» son dos pistas muy distintas para quien
       está probando, y la misma noticia para quien entró bien. */
    ok('  ...y los tres dicen LO MISMO: no se cuenta cuál de las dos cosas falló',
       rF.error === rV.error && rV.error === rI.error, rF.error + ' / ' + rV.error);
    ok('  ...ni un testigo vacío, ni uno sin punto, ni uno con dos',
       !puerta(g, { a: 'sesion' }).ok &&
       !puerta(g, { a: 'sesion', k: 'sinpunto' }).ok &&
       !puerta(g, { a: 'sesion', k: 'a.b.c' }).ok);
  }

  // ═══ 8. El testigo de OTRA tienda ═══
  {
    /* Dos tiendas de verdad: hojas distintas, que es lo que las distingue. */
    const a = nuevo(), b = nuevo('otra-hoja-de-otro-comercio');
    const claveA = conPanel(a, 'dona.rosa');
    conPanel(b, 'dona.rosa');
    const deA = puerta(a, { a: 'entrar', u: 'dona.rosa', c: claveA }).testigo;
    ok('EL TESTIGO DE OTRA TIENDA no abre esta',
       puerta(a, { a: 'sesion', k: deA }).ok && !puerta(b, { a: 'sesion', k: deA }).ok,
       'vale en la suya y no en la otra');

    /* Y AUNQUE LAS DOS COMPARTIERAN FIRMA. Es el escenario de DESPLIEGUE.md
       —dos tiendas montadas copiando los secretos de la primera— y ahí la firma
       sola no distingue nada: lo que lo para es que el testigo diga de qué hoja
       es. Sin esta aserción, quitar ese campo no rompería nada. */
    b.props.PANEL_FIRMA = a.props.PANEL_FIRMA;
    b.props.PANEL_CLAVE = a.props.PANEL_CLAVE;
    ok('  ...ni siquiera si las dos tiendas acabaran con la misma firma',
       !puerta(b, { a: 'sesion', k: deA }).ok, JSON.stringify(puerta(b, { a: 'sesion', k: deA })));
  }

  // ═══ 9. Cambiar la clave cierra lo que había ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    const testigo = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
    ok('La sesión está abierta', puerta(g, { a: 'sesion', k: testigo }).ok);
    const nueva = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
    ok('CAMBIAR LA CLAVE cierra las sesiones abiertas',
       !puerta(g, { a: 'sesion', k: testigo }).ok,
       JSON.stringify(puerta(g, { a: 'sesion', k: testigo })));
    ok('  ...y la clave vieja ya no entra, la nueva sí',
       !puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave }).ok &&
       puerta(g, { a: 'entrar', u: 'dona.rosa', c: nueva }).ok);
  }

  // ═══ 10. Cinco intentos, quince minutos, y queda anotado ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    for (let i = 0; i < 5; i++) puerta(g, { a: 'entrar', u: 'dona.rosa', c: 'no' });
    const bloqueado = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave });
    ok('CINCO INTENTOS FALLIDOS bloquean — Y BLOQUEAN TAMBIÉN LA CLAVE BUENA',
       !bloqueado.ok, bloqueado.error);
    ok('  ...y dice cuánto falta, que es lo único que hace falta saber',
       /minuto/.test(bloqueado.error) && /1[0-5]/.test(bloqueado.error), bloqueado.error);

    const errores = g.filas('Errores').map(f => String(f[1]));
    ok('  ...y QUEDA ANOTADO en la hoja, que es donde lo ve el comerciante',
       errores.some(t => /intentos fallidos/i.test(t)), errores.slice(-1)[0]);

    /* Contar solo los fallos del usuario bueno convierte el contador en un
       detector de usuarios: se prueban nombres y el que bloquea, existe. */
    const g2 = nuevo();
    conPanel(g2, 'dona.rosa');
    for (let i = 0; i < 5; i++) puerta(g2, { a: 'entrar', u: 'inventado' + i, c: 'no' });
    ok('  ...y los intentos cuentan AUNQUE EL USUARIO NO EXISTA',
       !puerta(g2, { a: 'entrar', u: 'dona.rosa', c: 'no' }).ok &&
       /Demasiados/.test(puerta(g2, { a: 'entrar', u: 'dona.rosa', c: 'no' }).error),
       puerta(g2, { a: 'entrar', u: 'dona.rosa', c: 'no' }).error);

    /* Y el bloqueo se levanta solo: quince minutos, no para siempre. */
    const antes = Date.now;
    Date.now = () => antes() + 16 * 60 * 1000;
    const despues = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave });
    Date.now = antes;
    ok('  ...y a los quince minutos se puede volver a intentar', despues.ok, despues.error);
  }

  // ═══ 11. La lista de puertas ═══
  {
    const g = nuevo();
    const guardas = {};
    Object.keys(g.api.PUERTAS).forEach(k => guardas[k] = g.api.PUERTAS[k].guarda);

    /* LA LISTA BLANCA, ESCRITA AQUÍ A MANO Y A PROPÓSITO. Es la segunda copia
       de un dato —y este proyecto las persigue—, pero esta se quiere: si
       alguien marca `publica` una puerta nueva, tiene que venir hasta esta
       línea y escribirlo, y eso es exactamente la revisión que hace falta. */
    /* M3.5: pago_crear y pago_estado. Las abre el comprador, que no tiene
       credenciales; lo que las protege es el número de operación, el token
       opaco y que nada se da por pagado sin preguntarle a Bold. */
    const PUBLICAS = ['version', 'catalogo', 'validar', 'registrar', 'entrar', 'pago_crear', 'pago_estado'];
    const publicas = Object.keys(guardas).filter(k => guardas[k] === 'publica');
    ok('SOLO ESTAS PUERTAS son públicas, y están escritas una por una',
       publicas.sort().join(',') === PUBLICAS.sort().join(','),
       publicas.join(', '));

    const VALIDAS = ['publica', 'montaje', 'menu', 'panel'];
    ok('  ...y TODA puerta declara a quién deja pasar',
       Object.keys(guardas).every(k => VALIDAS.indexOf(guardas[k]) !== -1),
       Object.keys(guardas).map(k => k + ':' + guardas[k]).join(' '));

    /* Una guardia mal escrita NO puede abrir: lo contrario es que una errata
       en un nombre deje la puerta de par en par y nadie lo note. */
    g.api.PUERTAS.inventada = { guarda: 'la-que-sea', fn: function () { return { ok: true }; } };
    ok('  ...y una guardia que no existe NO deja pasar',
       !puerta(g, { a: 'inventada' }).ok, JSON.stringify(puerta(g, { a: 'inventada' })));
    delete g.api.PUERTAS.inventada;

    // Sin credenciales, las de montaje y las del panel se plantan.
    const cerradas = Object.keys(guardas).filter(k => guardas[k] === 'montaje' || guardas[k] === 'panel');
    const abiertas = cerradas.filter(k => puerta(g, { a: k }).ok);
    ok('SIN CREDENCIALES no contesta ninguna puerta cerrada', abiertas.length === 0,
       abiertas.join(', '));
    /* Y no se escribe nada: `sembrar` es la que reescribe la configuración. */
    const antes = JSON.stringify(g.filas('Configuración'));
    puerta(g, { a: 'sembrar', negocio: 'Tienda Secuestrada' });
    ok('  ...y en particular SIN TESTIGO NO SE ESCRIBE NADA',
       JSON.stringify(g.filas('Configuración')) === antes, 'la configuración quedó igual');
  }

  // ═══ 11 bis. La clave y el testigo no viajan en la dirección ═══
  {
    const g = nuevo();
    const clave = conPanel(g, 'dona.rosa');
    const r = porGet(g, { a: 'entrar', u: 'dona.rosa', c: clave });
    ok('ENTRAR POR GET NO FUNCIONA, ni con la clave buena: la clave iría en la dirección',
       !r.ok && !r.testigo && /POST/.test(r.error), r.error);
    const testigo = puerta(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
    const s = porGet(g, { a: 'sesion', k: testigo });
    ok('  ...y el testigo tampoco se acepta por GET',
       !s.ok && !s.usuario, s.error);
    const soloPost = Object.keys(g.api.PUERTAS)
      .filter(k => g.api.PUERTAS[k].guarda === 'panel' || k === 'entrar');
    const porGetSi = soloPost.filter(k => !g.api.PUERTAS[k].soloPost);
    ok('  ...y TODA puerta del panel es solo por POST',
       porGetSi.length === 0, porGetSi.join(', ') || soloPost.join(', '));
    /* Un GET que se niega no puede contar como intento fallido: si contara,
       cualquiera bloquearía la tienda con cinco visitas a una dirección. */
    ok('  ...y rechazar por GET no gasta intentos',
       g.props.PANEL_INTENTOS === undefined || /^0\|/.test(g.props.PANEL_INTENTOS),
       String(g.props.PANEL_INTENTOS));
  }

  // ═══ 12. El menú ═══
  {
    const g = nuevo();
    const ids = g.api.menuDeLaHoja().map(o => o.id);
    ok('«Clave del panel» está en el menú de la hoja', ids.indexOf('clave') !== -1, ids.join(' · '));
    ok('  ...y el menú cuadra con las acciones', g.api.menuCuadra().ok,
       JSON.stringify(g.api.menuCuadra()));
    ok('  ...y NO hay ninguna puerta para poner la clave por la web',
       Object.keys(g.api.PUERTAS).every(k => !/clave/i.test(k)),
       Object.keys(g.api.PUERTAS).join(' '));

    const clave = conPanel(g, 'dona.rosa');
    ok('LA CLAVE QUE INVENTA no tiene caracteres que se confundan al copiarla',
       /^[A-HJ-NP-Za-km-z2-9-]+$/.test(clave) && clave.replace(/-/g, '').length === 16, clave);
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
