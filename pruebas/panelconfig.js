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
    /* Las técnicas NO. Cambiar sitio_url desde un celular rompe la tienda de
       formas que el comerciante no ve; los datos de pago no son para pantalla. */
    const TECNICAS = ['sitio_url', 'repositorio', 'fotos_drive', 'fotos_origen', 'respaldo_carpeta',
                      'pago_llave', 'pago_titular', 'pago_tope', 'correo_ultimo', 'panel_usuario',
                      'f_autoria', 'autoria_url'];
    const salen = TECNICAS.filter(t => claves.indexOf(t) !== -1);
    ok('LAS CLAVES TÉCNICAS no aparecen', salen.length === 0, salen.join(', '));
    ok('  ...ni ningún valor de pago en toda la respuesta',
       !/pago_/.test(JSON.stringify(r)));
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
    const antes = valor(g, 'sitio_url');
    /* CON LA VERSIÓN BUENA, a propósito. Si se manda sin versión, lo que la
       para es el control de «cambió mientras editabas», no la lista — y esta
       aserción pasaba con la lista quitada. Así solo la lista puede pararla. */
    const r = post(g, { a: 'guardar_configuracion', k, op: op(),
      cambios: { sitio_url: 'https://tienda-falsa.example', repositorio: 'otro/repo' },
      versiones: { sitio_url: g.api.versionDeValor(antes), repositorio: g.api.versionDeValor(valor(g, 'repositorio')) } });
    ok('PEDIR UNA CLAVE TÉCNICA POR SU NOMBRE no la escribe, aunque traiga su versión',
       !r.ok && valor(g, 'sitio_url') === antes && valor(g, 'repositorio') !== 'otro/repo' &&
       /no se cambia desde el panel/.test(r.errores.sitio_url),
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

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
