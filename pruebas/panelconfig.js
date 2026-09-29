/* D-4 — la configuración desde el panel, del lado del maestro.
 * ---------------------------------------------------------------------------
 * Tres reglas, y las tres se escriben contra una forma concreta de romperlas:
 *
 *   · SOLO LAS CLAVES DEL COMERCIANTE. La dirección del sitio, el repositorio,
 *     las carpetas y los datos de pago no salen, y tampoco se pueden escribir
 *     pidiéndolas por su nombre: esa es la puerta que la lista existe para
 *     cerrar.
 *   · UN VALOR QUE NO SE ENTIENDE SE MARCA Y NO SE DEGRADA. «tal vez» en un
 *     interruptor no es «No»; «gratis siempre» en una cifra no es 0.
 *   · TODO O NADA. Si una clave no valida, no se escribe ninguna.
 *
 *   node pruebas/panelconfig.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const j = r => JSON.parse(r._texto);
const post = (g, o) => j(g.api.doPost({ postData: { contents: JSON.stringify(o) } }));
let seq = 0;
const op = () => 'op-config-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8);

function conSesion() {
  const decir = console.log; console.log = () => {};
  const g = crear('./as.js'); g.api.instalar(); configurar(g);
  console.log = decir;
  const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'panel_usuario') + 1;
  g.hojas.get('Configuración').getRange(fila, 2).setValue('dona.rosa');
  const clave = (g.api.claveDelPanel().texto.match(/Clave:\s+(\S+)/) || [])[1];
  const k = post(g, { a: 'entrar', u: 'dona.rosa', c: clave }).testigo;
  return { g, k };
}
const valor = (g, clave) => (g.filas('Configuración').find(f => String(f[0]) === clave) || [])[1];
const poner = (g, clave, v) => {
  const f = g.filas('Configuración').findIndex(x => String(x[0]) === clave) + 1;
  g.hojas.get('Configuración').getRange(f, 2).setValue(v);
};

(() => {
  // ═══ 1. Sin testigo ═══
  {
    const { g } = conSesion();
    ok('SIN TESTIGO no se ve la configuración', !post(g, { a: 'configuracion' }).ok);
    ok('  ...ni se escribe',
       !post(g, { a: 'guardar_configuracion', op: op(), cambios: { negocio: 'Otra' }, versiones: {} }).ok &&
       valor(g, 'negocio') !== 'Otra');
  }

  // ═══ 2. Qué claves salen ═══
  {
    const { g, k } = conSesion();
    const r = post(g, { a: 'configuracion', k });
    const claves = r.claves.map(c => c.clave);
    ok('LA CONFIGURACIÓN trae las claves del comerciante, con su explicación',
       r.ok && claves.indexOf('negocio') !== -1 && claves.indexOf('color_principal') !== -1 &&
       r.claves.every(c => c.ayuda && c.rotulo && c.grupo), claves.length + ' claves');
    /* DESDE LA 0.9.0 SALEN TODAS LAS QUE SE ESCRIBEN A MANO —el dueño pidió que
       el panel alcance para todo—, menos dos: la que escribe el script y la
       del usuario, que va con la clave del menú de la hoja. */
    const hoja = g.filas('Configuración').slice(1).map(f => String(f[0]));
    const FUERA = ['correo_ultimo', 'panel_usuario'];
    const faltan = hoja.filter(c => FUERA.indexOf(c) === -1 && claves.indexOf(c) === -1);
    ok('TODAS LAS CLAVES DE LA HOJA salen en el panel', faltan.length === 0, faltan.join(', '));
    const salen = FUERA.filter(t => claves.indexOf(t) !== -1);
    ok('  ...menos la que escribe el script y la del usuario', salen.length === 0, salen.join(', '));
    const SENSIBLES = ['whatsapp', 'cobro_ambiente', 'pago_llave', 'pago_titular', 'pago_entidad', 'pago_texto'];
    ok('  ...y las que deciden a dónde va la plata salen marcadas como sensibles',
       SENSIBLES.every(c => (r.claves.find(x => x.clave === c) || {}).sensible === true) &&
       r.claves.filter(x => x.sensible).length === SENSIBLES.length,
       r.claves.filter(x => x.sensible).map(x => x.clave).join(', '));
  }

  // ═══ 3. Lo ilegible se marca ═══
  {
    const { g, k } = conSesion();
    poner(g, 'f_variantes', 'tal vez');
    poner(g, 'envio_gratis_desde', 'gratis siempre');
    poner(g, 'color_principal', 'rojito');
    const r = post(g, { a: 'configuracion', k });
    const de = c => r.claves.find(x => x.clave === c);
    ok('UN INTERRUPTOR QUE DICE «tal vez» sale tal cual y marcado — no como apagado',
       de('f_variantes').valor === 'tal vez' && /Sí o No/.test(de('f_variantes').problema),
       JSON.stringify({ valor: de('f_variantes').valor, problema: de('f_variantes').problema }));
    ok('UNA CIFRA ILEGIBLE sale tal cual y marcada — no como 0',
       de('envio_gratis_desde').valor === 'gratis siempre' && !!de('envio_gratis_desde').problema);
    ok('UN COLOR ILEGIBLE, igual', de('color_principal').valor === 'rojito' && !!de('color_principal').problema);
    ok('  ...y lo que SÍ se entiende no se marca', !de('negocio').problema);
  }

  // ═══ 4. Guardar ═══
  {
    const { g, k } = conSesion();
    const r0 = post(g, { a: 'configuracion', k });
    const v = c => r0.claves.find(x => x.clave === c).version;
    const r = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { portada_titulo: 'Pan de verdad, cada mañana', color_principal: '#1b5e3a',
                 f_variantes: 'no', envio_gratis_desde: '$150.000' },
      versiones: { portada_titulo: v('portada_titulo'), color_principal: v('color_principal'),
                   f_variantes: v('f_variantes'), envio_gratis_desde: v('envio_gratis_desde') } });
    ok('GUARDAR escribe en Configuración', r.ok && valor(g, 'portada_titulo') === 'Pan de verdad, cada mañana',
       r.error || JSON.stringify(r.errores || ''));
    ok('  ...con cada valor escrito como la hoja lo entiende',
       valor(g, 'color_principal') === '#1B5E3A' && valor(g, 'f_variantes') === 'No' &&
       valor(g, 'envio_gratis_desde') === '$150.000',
       [valor(g, 'color_principal'), valor(g, 'f_variantes'), valor(g, 'envio_gratis_desde')].join(' · '));
    const fondo = g.hojas.get('Configuración').getRange(
      g.filas('Configuración').findIndex(f => f[0] === 'color_principal') + 1, 2).getBackground().toUpperCase();
    ok('  ...y el color pinta su celda, como cuando se escribe en la hoja',
       fondo === '#1B5E3A', fondo);
    ok('  ...y queda anotado que hay algo sin publicar', !!g.props.ULTIMA_EDICION);
  }

  // ═══ 5. Todo o nada, y lo que no valida ═══
  {
    const { g, k } = conSesion();
    const r0 = post(g, { a: 'configuracion', k });
    const v = c => r0.claves.find(x => x.clave === c).version;
    const antes = JSON.stringify(g.filas('Configuración'));
    const r = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { portada_titulo: 'Esto sí vale', color_principal: 'verde' },
      versiones: { portada_titulo: v('portada_titulo'), color_principal: v('color_principal') } });
    ok('SI UNA CLAVE NO VALIDA, NO SE ESCRIBE NINGUNA',
       !r.ok && JSON.stringify(g.filas('Configuración')) === antes, r.error);
    ok('  ...y dice cuál y por qué, clave por clave',
       r.errores && /#1B5E3A/.test(r.errores.color_principal) && !r.errores.portada_titulo,
       JSON.stringify(r.errores));

    const malos = [
      ['f_variantes', 'tal vez'], ['envio_gratis_desde', 'mucho'], ['whatsapp', 'mi celular'],
      ['correo_resumen', 'sin arroba'], ['orden_catalogo', 'del más bonito'], ['color_alterno', '#12345']
    ];
    const pasaron = malos.filter(([c, val]) => post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { [c]: val }, versiones: { [c]: v(c) } }).ok).map(m => m[0]);
    ok('SEIS VALORES QUE NO SIRVEN, seis rechazos', pasaron.length === 0, pasaron.join(', ') || 'todos rechazados');
  }

  // ═══ 6. Lo que no es del comerciante no se escribe, aunque se pida por su nombre ═══
  {
    const { g, k } = conSesion();
    const antes = valor(g, 'correo_ultimo');
    /* CON LA VERSIÓN BUENA, a propósito. Si se manda sin versión, lo que la
       para es el control de «cambió mientras editabas», no la lista — y esta
       aserción pasaba con la lista quitada. Así solo la lista puede pararla. */
    const r = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { correo_ultimo: '2020-01-01', panel_usuario: 'otro' },
      versiones: { correo_ultimo: g.api.versionDeValor(antes), panel_usuario: g.api.versionDeValor(valor(g, 'panel_usuario')) } });
    ok('PEDIR POR SU NOMBRE LA CLAVE QUE ESCRIBE EL SCRIPT, o la del usuario, no la escribe',
       !r.ok && valor(g, 'correo_ultimo') === antes && valor(g, 'panel_usuario') !== 'otro' &&
       /no se cambia desde el panel/.test(r.errores.correo_ultimo) && /no se cambia desde el panel/.test(r.errores.panel_usuario),
       JSON.stringify(r.errores));
  }

  // ═══ 7. Lo que cambió en la hoja mientras tanto ═══
  {
    const { g, k } = conSesion();
    const r0 = post(g, { a: 'configuracion', k });
    const vTitulo = r0.claves.find(x => x.clave === 'portada_titulo').version;
    poner(g, 'portada_titulo', 'Lo que escribió otra persona en la hoja');
    const r = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { portada_titulo: 'Lo del panel' }, versiones: { portada_titulo: vTitulo } });
    ok('SI LA CLAVE CAMBIÓ EN LA HOJA mientras se editaba, no se pisa',
       !r.ok && valor(g, 'portada_titulo') === 'Lo que escribió otra persona en la hoja' &&
       /Cambió en la hoja/.test(r.errores.portada_titulo), JSON.stringify(r.errores));
  }

  // ═══ 8. Una fórmula no se cuela ═══
  {
    const { g, k } = conSesion();
    const r0 = post(g, { a: 'configuracion', k });
    const v = r0.claves.find(x => x.clave === 'pie_descripcion').version;
    post(g, { a: 'guardar_configuracion', k, op: op(),
              cambios: { pie_descripcion: '=IMPORTRANGE("x","y")' }, versiones: { pie_descripcion: v } });
    ok('UNA FÓRMULA escrita en el panel llega como texto',
       String(valor(g, 'pie_descripcion')).charAt(0) === "'", String(valor(g, 'pie_descripcion')));
  }

  // ═══ 0.23.0 · Una clave nueva aparece sola (bitácora 109) ═══
  {
    const { g, k } = conSesion();
    const h = g.hojas.get('Configuración');
    const fila = g.filas('Configuración').findIndex(f => String(f[0]) === 'logo_tamano') + 1;
    ok('LA CLAVE logo_tamano nace con la tienda, en 80', fila > 1 && String(valor(g, 'logo_tamano')) === '80',
       String(valor(g, 'logo_tamano')));
    // Una hoja de antes de la 0.23.0: sin la clave, y con un valor propio en otra.
    if (fila > 1) h.deleteRows(fila, 1);
    poner(g, 'negocio', 'Mi Tienda Vieja');
    const r = post(g, { a: 'configuracion', k });
    const c = (r.claves || []).find(x => x.clave === 'logo_tamano');
    ok('  ...y en una hoja vieja aparece sola al abrir Ajustes, sin correr A0_instalar',
       !!c && c.grupo === 'Tu tienda' && JSON.stringify(c.opciones) === '["40","80","120"]' && String(c.valor) === '80',
       c ? JSON.stringify({ valor: c.valor, opciones: c.opciones }) : 'no salió');
    ok('  ...sin tocar lo que el comercio ya había escrito',
       valor(g, 'negocio') === 'Mi Tienda Vieja');
    const v = c ? c.version : '';
    post(g, { a: 'guardar_configuracion', k, op: op(), cambios: { logo_tamano: '120' }, versiones: { logo_tamano: v } });
    ok('  ...y se guarda como cualquier otra', String(valor(g, 'logo_tamano')) === '120', String(valor(g, 'logo_tamano')));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
