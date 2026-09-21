/* D-5 — publicar desde el panel, del lado del maestro.
 * ---------------------------------------------------------------------------
 * El panel dice tres cosas que el menú de la hoja nunca pudo decir: si hay algo
 * sin publicar, cuándo fue la última vez, y cómo va la publicación que está
 * corriendo. Esta batería comprueba sobre todo las dos formas de mentir que
 * tiene eso:
 *
 *   · Decir «no hay cambios» cuando no se sabe. Si la tienda no contesta, el
 *     panel no sabe qué está sirviendo, y tiene que decir que no sabe.
 *   · Contar como «cambio sin publicar» algo que no cambia la vitrina. Pagar un
 *     pedido no cambia lo que se hornea; si contara, el aviso estaría encendido
 *     siempre y nadie lo miraría.
 *
 * Y que un doble toque en el botón dispara UNA publicación, no dos.
 *
 *   node pruebas/panelpublicar.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-publicar-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function conSesion(conGitHub) {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const poner = (clave, v) => {
    const f = g.filas('Configuración').findIndex(x => String(x[0]) === clave) + 1;
    g.hojas.get('Configuración').getRange(f, 2).setValue(v);
  };
  poner('panel_usuario', 'dona.rosa');
  poner('sitio_url', 'https://mitienda.example');
  if (conGitHub) { poner('repositorio', 'laboratorio/mitienda'); g.props.GITHUB_TOKEN = 'github_pat_de_prueba'; }
  else poner('repositorio', '');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  const cuenta = { disparos: 0 };
  return { g, k, cuenta };
}

/* GitHub y el sitio, de mentira pero con las respuestas de verdad. */
function red(g, cuenta, o) {
  o = o || {};
  g.responder('/catalogo.json', () => o.sitioCaido
    ? { codigo: 503, cuerpo: 'caído' }
    : { cuerpo: { esquema: 1, generado: o.servido || '2026-09-20T08:00:00.000Z', productos: [] } });
  g.responder('/dispatches', () => { cuenta.disparos++; return { codigo: o.codigoDisparo || 204, cuerpo: '' }; });
  g.responder('/runs?', () => ({ cuerpo: { workflow_runs: o.corrida ? [o.corrida] : [] } }));
}

(() => {
  // ═══ 1. Sin testigo ═══
  {
    const { g, cuenta } = conSesion(true);
    red(g, cuenta);
    ok('SIN TESTIGO no se ve el estado de la publicación', !post(g, { a: 'publicacion' }).ok);
    ok('  ...ni se publica', !post(g, { a: 'publicar', op: op() }).ok && cuenta.disparos === 0);
  }

  // ═══ 2. Sin repositorio o sin permiso, se dice quién lo arregla ═══
  {
    const { g, k, cuenta } = conSesion(false);
    red(g, cuenta);
    const e = post(g, { a: 'publicacion', k });
    ok('SIN REPOSITORIO el panel sabe que no puede publicar, y por qué',
       e.ok && e.puede === false && e.falta === 'repositorio');
    const r = post(g, { a: 'publicar', k, op: op() });
    ok('  ...y el botón dice que eso lo hace quien montó la tienda, sin disparar nada',
       !r.ok && /quien la montó/.test(r.error) && cuenta.disparos === 0, r.error);
  }

  // ═══ 3. ¿Hay cambios sin publicar? ═══
  {
    const { g, k, cuenta } = conSesion(true);
    red(g, cuenta, { servido: '2026-09-20T08:00:00.000Z' });
    const antes = post(g, { a: 'publicacion', k });
    ok('LA ÚLTIMA PUBLICACIÓN se le pregunta a la tienda, no a la hoja',
       antes.servido === '2026-09-20T08:00:00.000Z', antes.servido);
    ok('  ...y sin nada guardado desde entonces, no se afirma que haya cambios',
       antes.pendientes !== true, String(antes.pendientes));

    // Se guarda un producto desde el panel.
    const lista = post(g, { a: 'productos', k }).productos;
    const c = lista.find(p => p.id === 'croissant');
    post(g, { a: 'guardar_producto', k, op: op(), version: c.version,
              producto: Object.assign({}, c, { descripcion: 'Nueva descripción.' }) });
    ok('GUARDAR UN PRODUCTO deja «cambios sin publicar»', post(g, { a: 'publicacion', k }).pendientes === true);

    /* Y en la hoja también: el comerciante no siempre usa el panel. */
    const g2 = conSesion(true); red(g2.g, g2.cuenta, { servido: '2026-09-20T08:00:00.000Z' });
    const hc = g2.g.hojas.get('Catálogo');
    hc.getRange(3, 5).setValue(7000);
    g2.g.api.alEditar({ range: { getSheet: () => hc, getColumn: () => 5, getNumColumns: () => 1 } });
    ok('  ...y CAMBIAR UN PRECIO EN LA HOJA, también', post(g2.g, { a: 'publicacion', k: g2.k }).pendientes === true);

    /* PAGAR UN PEDIDO NO: no cambia lo que se hornea. Si contara, el aviso
       estaría encendido todo el día y nadie lo miraría. */
    const g3 = conSesion(true); red(g3.g, g3.cuenta, { servido: '2026-09-20T08:00:00.000Z' });
    j(g3.g.api.doGet({ parameter: { a: 'registrar', pedido: 'PUB01', ciudad: 'Bogotá', cupon: '',
                                    envio: 'zona-norte', items: 'croissant:1', sub: '0' } }));
    const ped = post(g3.g, { a: 'pedidos', k: g3.k }).pedidos[0];
    post(g3.g, { a: 'estado_pedido', k: g3.k, op: op(), pedido: 'PUB01', estado: 'pagado', version: ped.version });
    ok('PAGAR UN PEDIDO no cuenta como cambio sin publicar',
       post(g3.g, { a: 'publicacion', k: g3.k }).pendientes !== true);

    /* Y una publicación posterior a la edición la da por publicada. */
    const g4 = conSesion(true);
    g4.g.props.ULTIMA_EDICION = '2026-09-20T09:00:00.000Z';
    red(g4.g, g4.cuenta, { servido: '2026-09-20T09:30:00.000Z' });
    ok('LO QUE SE HORNEÓ DESPUÉS de la última edición ya está publicado',
       post(g4.g, { a: 'publicacion', k: g4.k }).pendientes === false);
  }

  // ═══ 4. Cuando la tienda no contesta, no se sabe ═══
  {
    const { g, k, cuenta } = conSesion(true);
    g.props.ULTIMA_EDICION = new Date().toISOString();
    red(g, cuenta, { sitioCaido: true });
    const e = post(g, { a: 'publicacion', k });
    ok('SI LA TIENDA NO CONTESTA, el panel NO dice «no hay cambios»: dice que no sabe',
       e.ok && e.pendientes === null && e.servido === '', JSON.stringify({ pendientes: e.pendientes }));
  }

  // ═══ 5. Publicar ═══
  {
    const { g, k, cuenta } = conSesion(true);
    red(g, cuenta);
    const mismo = op();
    const r1 = post(g, { a: 'publicar', k, op: mismo });
    const r2 = post(g, { a: 'publicar', k, op: mismo });
    ok('PUBLICAR dispara el flujo', r1.ok && cuenta.disparos >= 1, r1.error || '');
    ok('  ...Y UN DOBLE TOQUE DISPARA UNO, no dos', cuenta.disparos === 1 && r2.ok,
       cuenta.disparos + ' disparos');
    ok('  ...y queda anotado cuándo se pidió', !!g.props.PEDIDA_PUBLICACION);

    // El menú de la hoja usa el MISMO disparo.
    const antes = cuenta.disparos;
    const menu = g.api.publicarAhora();
    ok('EL MENÚ DE LA HOJA dispara por el mismo camino, con su texto de siempre',
       cuenta.disparos === antes + 1 && /se está actualizando/.test(menu.texto));
  }

  // ═══ 6. Cuando GitHub dice que no ═══
  {
    const { g, k, cuenta } = conSesion(true);
    red(g, cuenta, { codigoDisparo: 403 });
    const r = post(g, { a: 'publicar', k, op: op() });
    ok('UN PERMISO QUE NO ALCANZA se traduce a qué le falta',
       !r.ok && /Read and write/.test(r.error), r.error);
    ok('  ...y queda anotado en Errores', g.filas('Errores').some(f => /falló con 403/.test(String(f[1]))));
  }

  // ═══ 7. Mientras corre, y al terminar ═══
  {
    const { g, k, cuenta } = conSesion(true);
    red(g, cuenta, { corrida: { status: 'in_progress', conclusion: null,
                                created_at: '2026-09-21T10:00:00Z', updated_at: '2026-09-21T10:01:00Z',
                                html_url: 'https://github.com/laboratorio/mitienda/actions/runs/1' } });
    const e = post(g, { a: 'publicacion', k });
    ok('MIENTRAS CORRE, el panel sabe que está corriendo',
       e.corrida && e.corrida.estado === 'in_progress' && /actions\/runs/.test(e.corrida.enlace),
       JSON.stringify(e.corrida));

    const { g: g2, k: k2, cuenta: c2 } = conSesion(true);
    red(g2, c2, { corrida: { status: 'completed', conclusion: 'failure', created_at: '2026-09-21T10:00:00Z',
                             updated_at: '2026-09-21T10:03:00Z', html_url: 'https://github.com/x/y/actions/runs/2' } });
    const e2 = post(g2, { a: 'publicacion', k: k2 });
    ok('  ...y AL TERMINAR, cómo terminó — también cuando terminó mal',
       e2.corrida.estado === 'completed' && e2.corrida.resultado === 'failure', JSON.stringify(e2.corrida));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
