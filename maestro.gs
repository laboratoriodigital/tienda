/**
 * TIENDA — PROYECTO MAESTRO
 * ---------------------------------------------------------------------------
 * Este archivo NO va dentro de la hoja del cliente. Va en un proyecto de Apps
 * Script INDEPENDIENTE (script.google.com > Proyecto nuevo), en tu cuenta.
 *
 * POR QUÉ FUERA
 * Un script pegado dentro de la hoja se lee entero desde Extensiones > Apps
 * Script. Al compartirle la hoja al cliente le estás entregando el sistema.
 * Fuera, el cliente ve sus datos y no ve una línea de código.
 *
 * QUÉ QUEDA DENTRO DE LA HOJA
 * Un stub de 45 líneas sin una sola regla de negocio: dibuja el menú y
 * reenvía cada opción aquí. Existe porque un menú dibujado desde un disparador
 * instalable corre bajo TU cuenta y no le aparece al cliente; lo único que un
 * menú necesita del lado de la hoja es un onOpen simple.
 *
 * Ese stub NO es un archivo que se mantenga aparte: lo escribe generarStub(),
 * ya con la URL y el token dentro. Así no se puede desincronizar del maestro.
 *
 * LAS TRES PUERTAS
 *   ?a=catalogo|validar|registrar|version   la tienda
 *   ?a=menu&f=...&t=...                     el stub de la hoja
 *   disparadores instalables                inventario al confirmar, hora
 *
 * UN MAESTRO POR CLIENTE
 * Cada tienda tiene su copia de este proyecto, con su HOJA_ID y su TOKEN.
 * Así las cuotas de Google (30 ejecuciones simultáneas, 90 min/día de
 * disparadores, 100 correos) son de esa tienda y una tienda muy activa no
 * afecta a las demás.
 *
 * PUESTA EN MARCHA — lo único que se escribe a mano es HOJA_ID
 * 1. Crea la hoja del cliente y copia su ID (lo que va entre /d/ y /edit).
 * 2. script.google.com > Proyecto nuevo. Pega este archivo.
 * 3. Pega ese ID abajo, en HOJA_ID. Es el único hueco.
 * 4. Ejecuta instalar(). Autoriza cuando Google lo pida.
 * 5. Implementar > Nueva implementación > Aplicación web.
 *      Ejecutar como: Yo    ·    Acceso: cualquier persona
 * 6. Ejecuta generarStub() y pega lo que imprima en la hoja
 *    (Extensiones > Apps Script). Ya trae la URL y el token dentro.
 * 7. Menú de la hoja > Generar configuración para index.html: el bloque también
 *    sale con la URL puesta.
 *
 * El token no se escribe: lo inventa instalar() y lo guarda en las propiedades
 * del proyecto. La URL tampoco: el maestro la sabe de sí mismo.
 *
 * Cada cambio de código: Implementar > Gestionar implementaciones > lápiz >
 * Versión: Nueva. Si no, la URL sigue sirviendo la versión vieja.
 * ---------------------------------------------------------------------------
 */

/* ══════════════════════════════════════════════════════════════════════════
   LO ÚNICO QUE CAMBIA DE UN CLIENTE A OTRO
   ══════════════════════════════════════════════════════════════════════════ */

// El ID de la hoja de cálculo del cliente. Va en la URL de la hoja, entre
// /d/ y /edit.  https://docs.google.com/spreadsheets/d/AQUÍ_VA/edit
var HOJA_ID = '';
/* 0.17.0 · SI LA CONSTANTE LLEGA VACÍA, LA QUE GUARDÓ A0_instalar. La
   aplicación web corre la VERSIÓN IMPLEMENTADA, no lo que hay en el editor: si
   el ID se pegó después de implementar, el editor lo tiene y el diagnóstico
   sale bien, pero la tienda —y `conectar`— contestan «Falta HOJA_ID» (bitácora
   74). Las propiedades del script son de TODAS las versiones: A0_instalar,
   que se corre con el ID puesto, lo deja allí, y desde entonces pegar el ID no
   obliga a volver a implementar. */
var HOJA_ID_DE_PROPIEDAD = false;
if (!HOJA_ID) {
  try { HOJA_ID = String(PropertiesService.getScriptProperties().getProperty('HOJA_ID') || ''); } catch (e) { }
  /* 0.20.0 · El diagnóstico lo dice: funciona, pero solo desde la 0.17.0, y la
     versión IMPLEMENTADA puede ser anterior. */
  HOJA_ID_DE_PROPIEDAD = !!HOJA_ID;
}

/* ══════════════════════════════════════════════════════════════════════════
   LAS QUE SE EJECUTAN A MANO, JUNTAS Y EN ORDEN
   --------------------------------------------------------------------------
   Este archivo tiene más de cien funciones y el selector del editor las lista
   todas revueltas. Las cinco que un humano ejecuta de verdad estaban perdidas
   entre `cifraDeTexto` y `pintarColoresDesdeValor`, y encontrarlas era ir
   leyendo hasta dar con la que sonaba bien. Alguien lo dijo con todas las
   letras: «en las funciones del maestro no veo diagnosticoCompleto()».

   El prefijo `A1_`, `A2_`… hace dos cosas a la vez: las junta al principio de
   cualquier lista ordenada, y las numera EN EL ORDEN EN QUE SE NECESITAN, que
   es más útil que el alfabético. Montar una tienda es A0, A1, A2 de arriba
   abajo; lo demás son incidentes.

   Son envoltorios de una línea a propósito. Renombrar las funciones de verdad
   habría obligado a perseguirlas por el runbook, las baterías y tres años de
   comentarios, y a que quien tenga una hoja vieja se encuentre con que lo que
   sabía ya no existe. Los dos nombres funcionan.
   ══════════════════════════════════════════════════════════════════════════ */

/** A0 · Crear las pestañas y los disparadores. Lo primero, y una sola vez. */
function A0_instalar() { return instalar(); }

/** A1 · El código para pegar en la hoja del comercio. Después de publicar. */
function A1_generarStub() { return generarStub(); }

/** A2 · El informe completo: incluye el token de montaje, que el del menú no. */
function A2_diagnosticoCompleto() { return diagnosticoCompleto(); }

/** A3 · Jubilar el token de montaje. Lee lo que imprime: son TRES sitios. */
function A3_rotarToken() { return rotarToken(); }

/** A4 · Guardar una copia de la hoja ahora, sin esperar al domingo. */
function A4_respaldoAhora() { return respaldoSemanal(); }

/* A5 y A6 · las copias que hay y cómo volver a una: ver «VOLVER ATRÁS». */

/* El token NO se escribe: lo inventa instalar() la primera vez y lo guarda en
   las propiedades del proyecto. Un paso manual menos, y uno donde además era
   fácil equivocarse: bastaba un espacio de más al copiarlo para que el menú
   dejara de funcionar sin decir por qué.

   ESTE ES EL TOKEN DE MONTAJE, y abre todas las puertas: `bloques`, `sembrar`,
   `fotos`, `foto`, `panel`, `identidad`. Vive en los secretos del repositorio y
   en el tienda.json del que monta. NO va en el stub. */
function token() {
  var props = PropertiesService.getScriptProperties();
  var t = props.getProperty('TOKEN');
  if (!t) {
    t = 'tk-' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN', t);
  }
  return t;
}

/* ==========================================================================
   Y ESTE ES EL DEL MENÚ, QUE ES OTRO A PROPÓSITO.
   --------------------------------------------------------------------------
   Durante mucho tiempo fue uno solo, con este argumento escrito aquí mismo:
   «no es un secreto fuerte —el cliente puede leerlo en su stub— y no pretende
   serlo». La primera mitad era cierta y la segunda no se sostenía: el mismo
   token que el comerciante lee en el editor de su hoja era el que abría
   `?a=sembrar` —reescribir su configuración desde fuera—, `?a=bloques`,
   `?a=fotos` y `?a=panel`. Y un token que se lee en pantalla se pega en un
   chat, en una captura, en un correo de soporte. No hace falta mala fe: hace
   falta que esté a la vista.

   El del menú abre UNA puerta: `?a=menu`. Es lo único que el stub necesita.

   `tkm-` y no `tk-` para que se distingan de un vistazo cuando aparezcan
   sueltos —en una captura, en un log— y nadie tenga que adivinar cuál es cuál.
   ========================================================================== */
function tokenMenu() {
  var props = PropertiesService.getScriptProperties();
  var t = props.getProperty('TOKEN_MENU');
  if (!t) {
    t = 'tkm-' + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN_MENU', t);
  }
  return t;
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTRAR AL PANEL (D-1)
   --------------------------------------------------------------------------
   Los dos tokens de arriba son de MONTAJE: los tiene quien despliega y los
   tiene el stub de la hoja. No sirven para que entre el comerciante, y meterlo
   por ahí habría sido lo cómodo: un token fijo, sin caducidad, que no se puede
   revocar sin romper el despliegue, viajando en la barra de direcciones de un
   navegador que se queda abierto en el mostrador.

   Así que el panel tiene lo suyo, y con las dos mitades separadas:

   EL USUARIO va en la hoja (`panel_usuario`). No es un secreto: es un nombre,
   y el comerciante tiene que poder verlo y cambiarlo sin llamar a nadie.

   LA CLAVE NO VA EN LA HOJA NUNCA. Va su huella con sal, en las propiedades
   del proyecto. La hoja se comparte —con el contador, con el sobrino que
   ayuda, con quien pida ayuda por WhatsApp—; las propiedades del script no se
   comparten al compartir la hoja, y eso es toda la diferencia.

   Y HAY QUE DECIR HASTA DÓNDE LLEGA ESTO, porque una seguridad que se cree más
   fuerte de lo que es hace tomar malas decisiones: quien pueda abrir el
   proyecto de Apps Script puede leer las propiedades, y quien pueda hacer eso
   ya tiene la hoja entera. La huella con sal NO protege de ese; protege de que
   la clave aparezca en una captura, en un correo de soporte o en un
   repositorio, que es por donde se pierden las claves de verdad. Y contra
   adivinarla, lo que protege es el límite de intentos de más abajo, no el
   número de vueltas del hash.
   ══════════════════════════════════════════════════════════════════════════ */

/* Vueltas del hash. El número está puesto por criterio y NO medido en Apps
   Script —desde aquí no se puede—, así que se declara como lo que es: si
   entrar se siente lento en una tienda de verdad, se baja, y no se debilita
   nada que el límite de intentos no cubra ya. */
var VUELTAS_CLAVE = 4000;
var HORAS_TESTIGO = 8;
var INTENTOS_ANTES_DE_BLOQUEAR = 5;
var MINUTOS_BLOQUEADO = 15;

function propiedades() { return PropertiesService.getScriptProperties(); }

/* Bytes -> hexadecimal. El `& 0xff` NO es adorno: Apps Script devuelve los
   bytes con signo, herencia de Java, y sin esa máscara la mitad de ellos salen
   como '-4d'. La huella seguiría siendo estable, así que nada fallaría a la
   vista; simplemente estaríamos guardando otra cosa. */
function enHex(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] & 0xff;
    s += (b < 16 ? '0' : '') + b.toString(16);
  }
  return s;
}

function huellaDeClave(clave, sal) {
  var h = enHex(Utilities.computeHmacSha256Signature(String(clave), String(sal)));
  for (var i = 1; i < VUELTAS_CLAVE; i++) {
    h = enHex(Utilities.computeHmacSha256Signature(h, String(sal)));
  }
  return h;
}

/* La firma de los testigos. Es de ESTA tienda y solo de esta: por eso un
   testigo de otra no vale aquí aunque todo lo demás cuadre. */
function firmaDelPanel() {
  var p = propiedades();
  var f = p.getProperty('PANEL_FIRMA');
  if (!f) {
    f = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    p.setProperty('PANEL_FIRMA', f);
  }
  return f;
}

/* Se guarda `sal$huella`. Sin clave puesta, el panel está CERRADO: no hay
   usuario de fábrica, no hay clave de fábrica y no se entra. Fallo cerrado,
   que es la otra mitad de la regla de la casa — en el catálogo se falla
   abierto para no perder una venta; aquí se falla cerrado porque lo que está
   del otro lado es el inventario y los pedidos. */
function claveDelPanelGuardada() {
  return String(propiedades().getProperty('PANEL_CLAVE') || '');
}

function guardarClaveDelPanel(clave) {
  var sal = Utilities.getUuid().replace(/-/g, '');
  propiedades().setProperty('PANEL_CLAVE', sal + '$' + huellaDeClave(clave, sal));
  /* CAMBIAR LA CLAVE CIERRA LAS SESIONES ABIERTAS. El testigo lleva dentro un
     trozo de la huella, así que los que había dejan de valer solos, sin una
     lista de sesiones que mantener. Si alguien cambia la clave es porque cree
     que la vieja se sabe: dejar viva la sesión de ese alguien sería justo lo
     contrario de lo que pidió. */
  return true;
}

function claveDelPanelCorrecta(clave) {
  return claveCorrectaContra(claveDelPanelGuardada(), clave);
}

function claveCorrectaContra(guardada, clave) {
  guardada = String(guardada || '');
  var i = guardada.indexOf('$');
  if (i === -1) return false;                       // sin clave puesta, no se entra
  return huellaDeClave(clave, guardada.slice(0, i)) === guardada.slice(i + 1);
}

/* ── El testigo ─────────────────────────────────────────────────────────────
   `usuario|vence|hojaId|trozoDeLaHuella` firmado con la firma de esta tienda.
   Los cuatro campos están ahí por algo distinto:

   · `vence`  — para que una sesión olvidada en el mostrador no dure para
                siempre.
   · `hojaId` — PARA QUE UN TESTIGO DE OTRA TIENDA NO VALGA AQUÍ. La firma ya
                lo impediría, pero el fallo más caro de este proyecto está
                escrito en DESPLIEGUE.md y es exactamente ese: dos tiendas con
                los secretos cruzados, corriendo enteras en verde. Si algún día
                dos proyectos acaban compartiendo firma por un copiar y pegar,
                esto lo sigue parando y además lo dice.
   · trozo de la huella — para que cambiar la clave cierre lo que había.       */

function armarTestigo(usuario, rol) {
  var vence = Date.now() + HORAS_TESTIGO * 3600 * 1000;
  var cuerpo = [String(usuario), String(vence), String(HOJA_ID), trozoDelRol(rol)].join('|');
  /* Web-safe: el testigo viaja en la barra de direcciones, y un '+' de base64
     normal se convierte en un espacio por el camino. Es el tipo de fallo que
     aparece en una de cada sesenta sesiones y nadie sabe reproducir. */
  var carga = Utilities.base64EncodeWebSafe(cuerpo);
  return carga + '.' + enHex(Utilities.computeHmacSha256Signature(carga, firmaDelPanel()));
}

/* UNA SOLA RESPUESTA PARA TODO LO QUE FALLA, y es a propósito: «caducó» y
   «esa firma no es mía» son dos cosas muy distintas para quien está probando
   testigos, y ninguna de las dos es asunto suyo. Quien entró de verdad y se le
   pasaron las ocho horas ve lo mismo que quien no entró nunca: vuelve a entrar
   y ya está. */
var TESTIGO_MALO = 'Sesión no válida. Entra de nuevo.';

function leerTestigo(testigo) {
  var t = String(testigo || '');
  var punto = t.indexOf('.');
  if (punto === -1) return null;
  var carga = t.slice(0, punto), firma = t.slice(punto + 1);
  if (!carga || !firma) return null;
  if (enHex(Utilities.computeHmacSha256Signature(carga, firmaDelPanel())) !== firma) return null;

  var partes = '';
  try { partes = Utilities.newBlob(Utilities.base64DecodeWebSafe(carga)).getDataAsString(); }
  catch (e) { return null; }
  var c = String(partes).split('|');
  if (c.length !== 4) return null;
  if (c[2] !== String(HOJA_ID)) return null;                 // testigo de otra tienda
  /* 2.2 · DE QUIÉN ES LA SESIÓN lo dice el cuarto campo: el del colaborador
     empieza por «~». Así un testigo del colaborador no se puede presentar como
     del dueño —el trozo sale de otra huella— y quitarle el acceso, o darle una
     clave nueva, cierra sus sesiones sin tocar las del dueño. */
  var rol = c[3].charAt(0) === '~' ? 'colaborador' : 'dueño';
  if (rol === 'colaborador') {
    var col = colaboradorGuardado();
    if (!col.u || !col.clave || c[0] !== col.u) return null;   // sin colaborador, o es otro
  }
  if (c[3] !== trozoDelRol(rol)) return null;                // la clave cambió
  if (!(Number(c[1]) > Date.now())) return null;             // venció
  return { usuario: c[0], vence: Number(c[1]), rol: rol };
}

/* ══════════════════════════════════════════════════════════════════════════
   2.2 · MÁS DE UNA PERSONA: EL COLABORADOR (0.13.0)
   --------------------------------------------------------------------------
   El dueño pidió una segunda entrada con MENOS permisos: que lleve la tienda
   entera —productos, pedidos, fotos, envíos, cupones, publicar— y en los
   ajustes solo lo que se ve en la vitrina (textos, colores, portada) y si se
   cobra por WhatsApp o por pasarela. Nada de a dónde llega la plata o los
   pedidos, los datos legales, los correos, el ambiente del cobro ni lo técnico.

   · LO DA EL DUEÑO, DESDE SU PANEL, con su clave otra vez. No hay que tocar la
     hoja ni volver a pegar el stub. Se guarda en las propiedades del script —el
     usuario y la huella de la clave, nunca la clave—.
   · LA CLAVE LA INVENTA EL MAESTRO y se ve una vez, como la del dueño.
   · SE QUITA con un botón, y sus sesiones mueren en ese momento.
   · LO QUE HACE QUEDA A SU NOMBRE en el Registro, como lo del dueño.
   · LO QUE NO PUEDE, NO LE LLEGA: el maestro filtra las claves de ajustes que
     le enseña y rechaza las demás al guardar. Esconderlo en la página no sería
     un permiso: sería un adorno.
   ══════════════════════════════════════════════════════════════════════════ */
var CLAVES_DEL_COLABORADOR = [
  'horario', 'tienda_abierta', 'tienda_cerrada_mensaje', 'logo', 'favicon',
  'portada_titulo', 'portada_texto', 'portada_puntos', 'catalogo_columnas',
  'pie_descripcion', 'como_compras',
  'color_principal', 'color_secundario', 'color_alterno',
  'sitio_titulo', 'sitio_descripcion',
  'envio_gratis_desde', 'pedido_minimo', 'orden_catalogo', 'f_variantes', 'f_rastreo', 'f_avisame',
  'cobro_modo'
];
var SOLO_DUENO = 'Esto lo hace solo el dueño de la tienda.';
var USUARIO_VALIDO = /^[a-z0-9][a-z0-9._-]{2,29}$/i;

function colaboradorGuardado() {
  try {
    var c = JSON.parse(String(propiedades().getProperty('PANEL_COLABORADOR') || '{}'));
    return { u: String(c.u || ''), clave: String(c.clave || '') };
  } catch (e) { return { u: '', clave: '' }; }
}

function trozoDelRol(rol) {
  return rol === 'colaborador' ? '~' + colaboradorGuardado().clave.slice(-8)
                               : claveDelPanelGuardada().slice(-8);
}

function esColaborador(p) { return !!(p && p._sesion && p._sesion.rol === 'colaborador'); }

/* Dar, cambiar o quitar el acceso. Solo el dueño (la puerta lo exige) y con su
   clave otra vez: con una sesión robada, crear un colaborador sería dejarse
   una llave de repuesto. LA CLAVE NUEVA NO PASA POR LA CACHÉ de operaciones:
   se añade a la respuesta después, para que no quede seis horas guardada en
   ningún sitio. Un reintento de la misma operación contesta sin ella. */
function atenderColaborador(p) {
  var claveNueva = '';
  var r = conOperacion(p, function () {
    var rechazo = claveOtraVez(p);
    if (rechazo) return rechazo;
    var antes = colaboradorGuardado();
    if (p.accion === 'quitar') {
      if (!antes.u) return { ok: true, usuario: '', activo: false };
      propiedades().deleteProperty('PANEL_COLABORADOR');
      anotarSeguridad('Panel: se quitó el acceso del colaborador.', 'usuario: ' + antes.u + '. Sus sesiones se cerraron.');
      return { ok: true, usuario: '', activo: false,
               _registro: [{ que: 'Quitó el acceso del colaborador', donde: 'Panel · colaborador', antes: antes.u, despues: '' }] };
    }
    if (p.accion !== 'crear') return { ok: false, error: 'No sé qué hacer con el colaborador.' };
    var u = String(p.usuario || '').trim();
    if (!USUARIO_VALIDO.test(u)) {
      return { ok: false, error: 'El usuario va de 3 a 30 letras o números, sin espacios (puede llevar . _ -).' };
    }
    var dueno = String(leerConfiguracion().panel_usuario || '').trim();
    if (u.toLowerCase() === dueno.toLowerCase()) return { ok: false, error: 'Ese es tu usuario: elige otro para el colaborador.' };
    claveNueva = claveInventada();
    var sal = Utilities.getUuid().replace(/-/g, '');
    propiedades().setProperty('PANEL_COLABORADOR', JSON.stringify({ u: u, clave: sal + '$' + huellaDeClave(claveNueva, sal) }));
    anotarSeguridad('Panel: clave nueva del colaborador.', 'usuario: ' + u + '. Sus sesiones anteriores se cerraron.');
    return { ok: true, usuario: u, activo: true,
             _registro: [{ que: antes.u ? 'Dio una clave nueva al colaborador' : 'Dio acceso a un colaborador',
                           donde: 'Panel · colaborador', antes: antes.u, despues: u }] };
  });
  if (r && r.ok && !r.repetida && claveNueva) r.clave = claveNueva;
  return r;
}

/* ── El límite de intentos ──────────────────────────────────────────────────
   Esto es lo que de verdad para a quien está adivinando, y por eso cuenta los
   fallos AUNQUE EL USUARIO NO EXISTA: contar solo los del usuario bueno
   convierte el contador en un detector de usuarios. */
function estadoDeIntentos() {
  var crudo = String(propiedades().getProperty('PANEL_INTENTOS') || '0|0').split('|');
  return { fallos: Number(crudo[0]) || 0, hasta: Number(crudo[1]) || 0 };
}

function anotarIntentoFallido(usuario) {
  var e = estadoDeIntentos();
  var fallos = e.fallos + 1;
  var hasta = 0;
  if (fallos >= INTENTOS_ANTES_DE_BLOQUEAR) {
    hasta = Date.now() + MINUTOS_BLOQUEADO * 60 * 1000;
    fallos = 0;
    anotarSeguridad('Panel: ' + INTENTOS_ANTES_DE_BLOQUEAR + ' intentos fallidos seguidos. ' +
                    'Bloqueado ' + MINUTOS_BLOQUEADO + ' minutos.',
                    'último usuario probado: ' + String(usuario));
  }
  propiedades().setProperty('PANEL_INTENTOS', fallos + '|' + hasta);
}

function limpiarIntentos() { propiedades().setProperty('PANEL_INTENTOS', '0|0'); }

/* SE ANOTA SIN AGRUPAR, a diferencia de anotarError(). Ese junta los repetidos
   durante una hora para que un fallo en bucle no llene la hoja; aquí lo
   repetido es justamente el dato —cuántas veces y cuándo— y agruparlo sería
   borrar lo único que se quería ver. */
function anotarSeguridad(motivo, detalle) {
  try {
    var h = hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
    if (h.getLastRow() > 500) return;
    h.appendRow([new Date(), celdaSegura(motivo, 200), celdaSegura(detalle, 200)]);
  } catch (x) { /* avisar nunca puede tumbar la respuesta */ }
}

/* ── Las dos puertas ───────────────────────────────────────────────────────*/

function atenderEntrar(p) {
  var bloqueo = estadoDeIntentos();
  if (bloqueo.hasta > Date.now()) {
    var faltan = Math.ceil((bloqueo.hasta - Date.now()) / 60000);
    return { ok: false, error: 'Demasiados intentos. Prueba de nuevo en ' + faltan +
             (faltan === 1 ? ' minuto.' : ' minutos.') };
  }

  var usuario = String(leerConfiguracion().panel_usuario || '').trim();
  var pedido  = String(p.u || '').trim();
  var clave   = String(p.c || '');

  /* SIN USUARIO O SIN CLAVE PUESTA, EL PANEL NO EXISTE. Y se contesta lo
     mismo que ante una clave equivocada: decir «esta tienda todavía no tiene
     clave» es contarle a cualquiera que hay una puerta sin cerradura. */
  var bien = !!usuario && !!claveDelPanelGuardada() &&
             pedido.toLowerCase() === usuario.toLowerCase() &&
             claveDelPanelCorrecta(clave);

  /* 2.2 · Si no es el dueño, puede ser el colaborador. Misma respuesta y
     mismo contador si no es ninguno de los dos. */
  var rol = 'dueño';
  if (!bien) {
    var col = colaboradorGuardado();
    if (col.u && col.clave && pedido.toLowerCase() === col.u.toLowerCase() && claveCorrectaContra(col.clave, clave)) {
      bien = true; rol = 'colaborador'; usuario = col.u;
    }
  }

  if (!bien) {
    anotarIntentoFallido(pedido);
    return { ok: false, error: 'Usuario o clave que no corresponden.' };
  }

  limpiarIntentos();
  var testigo = armarTestigo(usuario, rol);
  return { ok: true, testigo: testigo, usuario: usuario,
           vence: new Date(Date.now() + HORAS_TESTIGO * 3600 * 1000).toISOString(), rol: rol };
}

/* Quién soy y hasta cuándo. La página la usa para saber si pintar el panel o
   el formulario de entrada, sin tener que interpretar por su cuenta un testigo
   que no puede verificar. */
function atenderSesion(p) {
  var s = leerTestigo(p.k);
  if (!s) return { ok: false, error: TESTIGO_MALO };
  return { ok: true, usuario: s.usuario, vence: new Date(s.vence).toISOString(), rol: s.rol };
}

/* LA CLAVE SE PONE DESDE EL MENÚ DE LA HOJA Y NO POR LA WEB, y esta función es
   ese menú. Dos decisiones que parecen detalles:

   LA INVENTA EL MAESTRO en vez de pedirla. Desde una opción de menú no hay
   forma de escribir una clave sin que viaje por la red hasta aquí, y una clave
   que el comerciante elige es «la tienda» o el nombre del negocio con un 1
   detrás: lo que hay al otro lado es su inventario. Se genera fuerte, se
   enseña UNA vez y no se puede volver a ver — se vuelve a generar, que además
   es lo que hay que hacer cuando una clave se pierde.

   Y NO SE GUARDA EN NINGUNA CELDA. Sale en la pantalla del menú, que es lo
   único que no queda escrito en ningún sitio. */
function claveDelPanel() {
  var usuario = String(leerConfiguracion().panel_usuario || '').trim();
  if (!usuario) {
    return { tipo: 'aviso', texto:
      'Antes de poner la clave hace falta el usuario.\n\n' +
      'Ve a la pestaña Configuración, busca la fila panel_usuario y escribe con ' +
      'qué nombre quieres entrar al panel. Después vuelve a esta opción.' };
  }

  var nueva = claveInventada();
  guardarClaveDelPanel(nueva);
  limpiarIntentos();
  anotarSeguridad('Panel: clave nueva puesta desde el menú.',
                  'usuario: ' + usuario + '. Las sesiones abiertas se cerraron.');

  return { tipo: 'aviso', texto:
    'CLAVE NUEVA DEL PANEL\n\n' +
    'Usuario:  ' + usuario + '\n' +
    'Clave:    ' + nueva + '\n\n' +
    'Apúntala ahora: esta es la única vez que se puede ver. No queda escrita en ' +
    'ninguna celda de la hoja ni en ningún archivo — de la clave solo se guarda ' +
    'una huella, que no se puede deshacer.\n\n' +
    'Si la pierdes, vuelve a esta opción y se genera otra.\n\n' +
    'Las sesiones que estuvieran abiertas acaban de cerrarse.' };
}

/* Sin ambigüedades a la vista: ni 0/O, ni 1/l/I. Una clave que se apunta a mano
   y se teclea en un celular no puede tener caracteres que se confundan. */
function claveInventada() {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var crudo = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  var s = '';
  for (var i = 0; i < 16; i++) {
    s += abc.charAt(parseInt(crudo.charAt(i * 2) + crudo.charAt(i * 2 + 1), 16) % abc.length);
  }
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12);
}

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCTOS DESDE EL PANEL (D-2)
   --------------------------------------------------------------------------
   La hoja sigue siendo la base de datos: el panel no guarda nada en otra
   parte. Lo que cambia es QUIÉN escribe en ella, y eso trae tres obligaciones
   que la hoja no tenía, porque en la hoja el que escribe ve lo que pisa:

   1. BAJO LLAVE. Dos pestañas del panel abiertas, o el panel y el disparador
      del inventario a la vez, escribiendo la misma fila: sin llave gana el
      último y el otro no se entera.

   2. CONTRA LO QUE SE LEYÓ, NO CONTRA LO QUE HAY. El formulario se abre a las
      10:00 con 5 en Stock; a las 10:04 se paga un pedido y queda en 4; a las
      10:05 el comerciante corrige una tilde en la descripción y guarda. Si se
      escribe la fila entera, vuelve a poner 5: acaba de resucitar una unidad
      que ya se vendió, y nadie tocó el stock. Por eso cada producto viaja con
      su `version` —una huella de la fila tal como se leyó— y guardar la exige:
      si la fila cambió entre medias, NO SE ESCRIBE y se dice qué cambió.

   3. CON NÚMERO DE OPERACIÓN. El celular del mostrador pierde la señal justo
      después de «Guardar»; la página no sabe si llegó y lo reintenta. Crear dos
      veces el mismo producto, o borrar dos veces, no puede depender de la
      suerte de la red.

   Y una regla de fondo que es la contraria de la del catálogo: al LEER, una
   celda que no se entiende falla abierto (el producto sigue a la venta); al
   ESCRIBIR desde el panel se falla CERRADO. Lo que no valida no entra en la
   hoja, y se dice por qué, en palabras del comerciante. Escribir basura en la
   hoja para que después la lectura «falle abierto» sería fabricar el problema.
   ══════════════════════════════════════════════════════════════════════════ */

var ID_PRODUCTO = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
var H_PAPELERA = 'Papelera';
var HORAS_OPERACION = 6;

/* La huella de una fila tal como está. Dieciséis hexadecimales bastan: no es
   para seguridad, es para notar que alguien tocó la fila entre medias. */
function versionDeFila(fila) {
  var ancho = ENCABEZADO_CATALOGO.length;
  var trozo = [];
  for (var i = 0; i < ancho; i++) trozo.push(String(fila[i] === undefined ? '' : fila[i]));
  return enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                       JSON.stringify(trozo))).slice(0, 16);
}

function filasDelCatalogo() {
  var h = elLibro().getSheetByName(H_CATALOGO);
  if (!h || h.getLastRow() < 2) return { h: h, filas: [] };
  var ancho = Math.max(h.getLastColumn(), ENCABEZADO_CATALOGO.length);
  return { h: h, filas: h.getRange(2, 1, h.getLastRow() - 1, ancho).getValues() };
}

function filaDelProducto(filasCat, id) {
  for (var i = 0; i < filasCat.length; i++) {
    if (String(filasCat[i][0]).trim() === id) return i;
  }
  return -1;
}

/* ── Lo que ve el panel ─────────────────────────────────────────────────────
   Las cifras viajan COMO ESTÁN ESCRITAS, no convertidas. Si la hoja dice
   «doce mil» en Precio, el formulario tiene que enseñar «doce mil» marcado
   en rojo, no un 0 que el comerciante guardaría sin mirar. Una cifra que no se
   puede leer no vale cero, tampoco en el panel. */
function atenderProductos() {
  var cat = filasDelCatalogo();
  var categorias = {};
  var inv = leerInventarioVariante();
  var productos = cat.filas.map(function (f, i) {
    var id = String(f[0]).trim();
    if (!id) return null;
    var texto = function (k) { return String(f[k] === undefined || f[k] === null ? '' : f[k]); };
    var problemas = [];
    CELDAS_ILEGIBLES = [];
    if (cifraDeTexto(f[4], 'Precio') === null || !texto(4).trim()) problemas.push('Precio');
    if (cifraDeTexto(f[5], 'Stock') === null) problemas.push('Stock');
    if (texto(11).trim() && cifraDeTexto(f[11], 'Precio antes') === null) problemas.push('Precio antes');
    if (texto(12).trim() && cifraDeTexto(f[12], 'Umbral bajo') === null) problemas.push('Umbral bajo');
    var cat_ = texto(3).trim() || 'Otros';
    categorias[cat_] = true;
    return {
      id: id, nombre: texto(1), formato: texto(2), categoria: texto(3),
      precio: texto(4), stock: texto(5), descripcion: texto(6), imagenes: texto(7),
      destacado: esSi(f[8]), activo: esSi(f[9]), referencia: texto(10),
      precioAntes: texto(11), umbralBajo: texto(12), variantes: texto(13),
      version: versionDeFila(f), problemas: problemas,
      /* C-1b: sus filas del inventario por combinación, con el número tal
         como está escrito (vacío = todavía no se llenó) y su huella. */
      combinaciones: (inv[id] || []).map(function (x) {
        return { combinacion: x.texto,
                 stock: String(x.crudo === null || x.crudo === undefined ? '' : x.crudo),
                 version: versionDeValor(x.crudo), noCasa: !combinacionValida(f[13], x.clave) };
      }),
      porCombinacion: !!skusDe(variantesDeCelda(f[13], ''), inv[id], '')
    };
  }).filter(function (p) { return p; });
  CELDAS_ILEGIBLES = [];
  return { ok: true, productos: productos, categorias: Object.keys(categorias).sort() };
}

/* ── Validar ANTES de escribir ──────────────────────────────────────────────
   Devuelve { error } o { fila } con las catorce celdas ya saneadas. Los
   mensajes están escritos para quien los va a leer: el comerciante, no el
   técnico. */
function filaDesdeElPanel(d) {
  var t = function (v) { return String(v === undefined || v === null ? '' : v).trim(); };

  /* No se pasa a minúsculas aquí: el código que se guarda tiene que ser el que
     el comerciante vio escrito. La página lo normaliza mientras se escribe, a
     la vista; el maestro solo comprueba. */
  var id = t(d.id);
  if (!ID_PRODUCTO.test(id)) {
    return { error: 'El código del producto va en minúsculas y sin espacios ni tildes: ' +
             'letras, números y guiones (ej: camiseta-basica).' };
  }
  var nombre = t(d.nombre);
  if (!nombre) return { error: 'Falta el nombre del producto.' };
  if (nombre.length > 120) return { error: 'El nombre es demasiado largo (máximo 120 letras).' };

  CELDAS_ILEGIBLES = [];
  if (!t(d.precio)) return { error: 'Falta el precio.' };
  var precio = cifraDeTexto(t(d.precio), 'Precio');
  if (precio === null || precio <= 0) {
    return { error: 'El precio tiene que ser un número mayor que cero, sin decimales (ej: 45000).' };
  }
  var stock = cifraDeTexto(t(d.stock), 'Stock');
  if (!t(d.stock) || stock === null) {
    return { error: 'El stock tiene que ser un número entero, 0 o más (ej: 12).' };
  }
  var antes = '';
  if (t(d.precioAntes)) {
    var a = cifraDeTexto(t(d.precioAntes), 'Precio antes');
    if (a === null || a <= precio) {
      return { error: 'El «precio antes» tiene que ser mayor que el precio de hoy, o quedar vacío. ' +
               'Si es igual o menor, la tienda no lo mostraría y parecería un error.' };
    }
    antes = a;
  }
  var umbral = '';
  if (t(d.umbralBajo)) {
    var u = cifraDeTexto(t(d.umbralBajo), 'Umbral bajo');
    if (u === null) return { error: '«Pocas unidades desde» tiene que ser un número entero, o quedar vacío.' };
    umbral = u;
  }

  var imagenes = (Array.isArray(d.imagenes) ? d.imagenes : t(d.imagenes).split('|'))
    .map(function (x) { return t(x); }).filter(function (x) { return x; });
  if (imagenes.length > 6) return { error: 'Son máximo seis fotos por producto.' };
  if (imagenes.some(function (x) { return x.length > 300; })) {
    return { error: 'El nombre de una de las fotos es demasiado largo.' };
  }

  /* LAS VARIANTES SE COMPRUEBAN AQUÍ CON LA MISMA LECTURA QUE USA LA TIENDA, y
     además con lo que la tienda NO puede arreglar después: una coma o un signo
     igual dentro de una opción no caben en la línea del pedido, así que la
     página tumbaría ese grupo en silencio (C-1c). Desde la hoja no hay forma de
     avisar antes; desde el panel sí, y es el único sitio donde se puede. */
  var variantes = t(d.variantes);
  if (variantes) {
    CELDAS_ILEGIBLES = [];
    var grupos = variantesDeCelda(variantes, 'Variantes');
    if (CELDAS_ILEGIBLES.length || !grupos.length) {
      CELDAS_ILEGIBLES = [];
      return { error: 'Las variantes no se entienden. Se escriben así: ' +
               'Talla: S|M|L ; Color: Rosa|Nude' };
    }
    var mala = null;
    grupos.forEach(function (g) {
      g.opciones.concat([g.nombre]).forEach(function (o) { if (/[,=]/.test(o)) mala = o; });
    });
    if (mala !== null) {
      return { error: '«' + mala + '» lleva una coma o un signo igual, y eso no cabe en el ' +
               'pedido. Escríbelo de otra forma (ej: 40.5 en vez de 40,5).' };
    }
  }
  CELDAS_ILEGIBLES = [];

  return { fila: [
    id,
    celdaSegura(nombre, 120),
    celdaSegura(d.formato, 60),
    celdaSegura(d.categoria, 60),
    precio,
    stock,
    celdaSegura(d.descripcion, 2000),
    celdaSegura(imagenes.join('|'), 1900),
    (d.destacado === true || esSi(d.destacado)) ? 'Sí' : 'No',
    /* Un producto nuevo nace ACTIVO si no se dice otra cosa: quien lo crea
       desde el panel quiere venderlo. */
    (d.activo === undefined || d.activo === true || esSi(d.activo)) ? 'Sí' : 'No',
    celdaSegura(d.referencia, 60),
    antes,
    umbral,
    celdaSegura(variantes, 500)
  ] };
}

/* ── La operación: una vez, aunque llegue dos ──────────────────────────────
   Se recuerda la respuesta de cada operación seis horas. Si el mismo número
   vuelve —la página reintentó porque no supo si llegó—, se contesta lo mismo
   que la primera vez y no se hace nada.

   Y DICHO SIN ADORNO: la caché de Apps Script puede olvidar antes de las seis
   horas. Si olvida, un «crear» repetido contesta «ya existe ese código» y un
   «guardar» repetido contesta «el producto cambió mientras lo editabas». Las
   dos respuestas son incómodas y ninguna duplica nada: lo que garantiza que no
   se duplica es la validación de abajo; la caché solo hace que la respuesta
   sea amable. */
var OPERACION_VALIDA = /^[A-Za-z0-9_-]{8,64}$/;

/* `publica`: la escritura cambia algo que la tienda publicada enseña
   (productos, fotos, configuración). Entonces se anota la hora, y el panel
   puede decir «tienes cambios sin publicar» (D-5). Cambiar el estado de un
   pedido no la anota: no cambia la vitrina. */
function conOperacion(p, hacer, publica) {
  var op = String(p.op || '');
  if (!OPERACION_VALIDA.test(op)) return { ok: false, error: 'Falta el número de operación.' };
  var cache = CacheService.getScriptCache();
  var vista = cache.get('op:' + op);
  if (vista) { var r0 = JSON.parse(vista); r0.repetida = true; return r0; }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    vista = cache.get('op:' + op);                      // pudo entrar mientras esperábamos
    if (vista) { var r1 = JSON.parse(vista); r1.repetida = true; return r1; }
    var r = hacer();
    /* D-6 · LO QUE SE HIZO QUEDA ESCRITO. Cada escritura del panel trae su
       propia descripción (`_registro`), y aquí —el único sitio por donde pasan
       todas— se anota con quién y cuándo. Sale de la respuesta antes de
       guardarla: es para la hoja, no para la página. */
    var registro = r && r._registro;
    if (r) delete r._registro;
    if (r && r.ok) {
      if (registro) {
        var quien = leerTestigo(p.k);
        anotarCambios('Panel', quien ? quien.usuario + (quien.rol === 'colaborador' ? ' (colaborador)' : '') : '', registro);
      }
      cache.put('op:' + op, JSON.stringify(r), HORAS_OPERACION * 3600);
      cache.remove('catalogo');                          // que la tienda en vivo lo vea ya
      if (publica) marcarEdicion();
    }
    return r;
  } finally {
    lock.releaseLock();
  }
}

/* Una sola frase para «la fila cambió desde que la miraste». No dice qué
   cambió porque el maestro solo guarda la huella de lo que se leyó, no lo que
   se leyó; la página sí lo tiene, y al volver a abrir el producto lo ve. */
var CAMBIO_ENTRE_MEDIAS = 'Este producto cambió mientras lo editabas —puede ser un ' +
  'pedido pagado o alguien más en la hoja—. Vuelve a abrirlo para ver cómo está ' +
  'ahora y haz tu cambio encima.';

function atenderGuardarProducto(p) {
  return conOperacion(p, function () {
    var d = p.producto || {};
    var nuevo = p.nuevo === true;
    var armado = filaDesdeElPanel(d);
    if (armado.error) return { ok: false, error: armado.error };

    var cat = filasDelCatalogo();
    var i = filaDelProducto(cat.filas, armado.fila[0]);

    if (nuevo) {
      if (i !== -1) return { ok: false, error: 'Ya hay un producto con el código «' +
                             armado.fila[0] + '». Elige otro.' };
      var h = cat.h || hoja(H_CATALOGO, ENCABEZADO_CATALOGO);
      h.appendRow(armado.fila);
      if (String(armado.fila[13] || '')) sincronizarVariantes();
      return { ok: true, id: armado.fila[0], version: versionDeFila(armado.fila), creado: true,
               _registro: [{ que: 'Creó el producto', donde: 'Catálogo · ' + armado.fila[0], antes: '',
                             despues: resumenDeFila(armado.fila) }] };
    }

    /* El código no se cambia. Lo usan los pedidos que ya existen, los nombres
       de las fotos y los enlaces que el comerciante compartió por WhatsApp:
       cambiarlo en silencio los rompe todos a la vez. */
    if (i === -1) return { ok: false, error: 'Ese producto ya no existe en la hoja.' };
    if (String(p.version || '') !== versionDeFila(cat.filas[i])) {
      return { ok: false, cambiado: true, error: CAMBIO_ENTRE_MEDIAS };
    }
    var dif = diferenciaDeFilas(cat.filas[i], armado.fila);
    cat.h.getRange(i + 2, 1, 1, ENCABEZADO_CATALOGO.length).setValues([armado.fila]);
    /* C-1b: si cambiaron las variantes, las filas del inventario se ponen al
       día en la misma operación; y la suma pisa un Stock escrito a mano. */
    sincronizarVariantes();
    armado.fila[COL_STOCK - 1] = cat.h.getRange(i + 2, COL_STOCK).getValues()[0][0];
    return { ok: true, id: armado.fila[0], version: versionDeFila(armado.fila),
             _registro: dif.antes.length ? [{ que: 'Editó el producto', donde: 'Catálogo · ' + armado.fila[0],
                                               antes: dif.antes.join(' · '), despues: dif.despues.join(' · ') }] : null };
  }, true);
}

/* Activar y desactivar tocan UNA celda, y por eso no piden versión: el valor
   final es el que se pidió, lo haya cambiado quien lo haya cambiado. */
function atenderActivarProducto(p) {
  return conOperacion(p, function () {
    var id = String(p.id || '').trim();
    var cat = filasDelCatalogo();
    var i = filaDelProducto(cat.filas, id);
    if (i === -1) return { ok: false, error: 'Ese producto ya no existe en la hoja.' };
    var activo = p.activo === true;
    var antes = String(cat.filas[i][9]);
    cat.h.getRange(i + 2, 10).setValue(activo ? 'Sí' : 'No');
    cat.filas[i][9] = activo ? 'Sí' : 'No';
    return { ok: true, id: id, activo: activo, version: versionDeFila(cat.filas[i]),
             _registro: [{ que: activo ? 'Activó el producto' : 'Desactivó el producto', donde: 'Catálogo · ' + id,
                           antes: 'Activo: ' + antes, despues: 'Activo: ' + (activo ? 'Sí' : 'No') }] };
  }, true);
}

/* BORRAR NO BORRA: MUEVE A LA PAPELERA. La fila entera va a una pestaña de
   solo agregar, con la fecha, y de ahí se recupera copiándola de vuelta. Un
   borrado que no se puede deshacer es un botón que el comerciante aprende a no
   tocar, y entonces la tienda se llena de productos desactivados «por si
   acaso». Pide versión, como guardar: no se borra algo que cambió desde que se
   miró. */
function atenderBorrarProducto(p) {
  return conOperacion(p, function () {
    var id = String(p.id || '').trim();
    var cat = filasDelCatalogo();
    var i = filaDelProducto(cat.filas, id);
    if (i === -1) return { ok: false, error: 'Ese producto ya no existe en la hoja.' };
    if (String(p.version || '') !== versionDeFila(cat.filas[i])) {
      return { ok: false, cambiado: true, error: CAMBIO_ENTRE_MEDIAS };
    }
    var papelera = hoja(H_PAPELERA, ENCABEZADO_CATALOGO.concat(['Borrado el', 'Desde']));
    papelera.appendRow(cat.filas[i].slice(0, ENCABEZADO_CATALOGO.length)
                       .concat([new Date(), 'Panel']));
    cat.h.deleteRows(i + 2, 1);
    return { ok: true, id: id, borrado: true,
             _registro: [{ que: 'Borró el producto (fue a la Papelera)', donde: 'Catálogo · ' + id,
                           antes: resumenDeFila(cat.filas[i]), despues: '' }] };
  }, true);
}

/* ══════════════════════════════════════════════════════════════════════════
   SUBIR UNA FOTO DESDE EL PANEL (D-2c)
   --------------------------------------------------------------------------
   El error más común de un producto nuevo es este: la foto está en el Drive
   como «IMG_4471.jpg» y en la hoja dice «camiseta-basica-1.jpg». Las dos cosas
   están bien hechas, y la tienda sale sin foto, sin un aviso en ninguna parte.

   Desde el panel ese error NO PUEDE PASAR, porque el nombre no lo escribe
   nadie: lo pone el maestro —`<código>-<n>.<ext>`, con el primer número libre—,
   guarda el archivo en la carpeta de fotos con ese nombre y lo agrega a la
   celda Imágenes, las dos cosas en la misma operación y bajo la misma llave.

   Y SI FALLA, EL CAMINO VIEJO SIGUE EXISTIENDO, y el mensaje lo dice con el
   nombre exacto que tiene que llevar el archivo. Una foto que no sube por
   tamaño o porque la carpeta no deja escribir no puede dejar al comerciante
   sin saber qué hacer: sube a mano, con ESE nombre, y funciona igual que antes.

   La foto NO sale en la tienda al subirla: sale cuando se publica, porque es
   el montaje el que la baja del Drive, la convierte y la sirve. Se dice.
   ══════════════════════════════════════════════════════════════════════════ */

var TIPOS_DE_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
/* El tope va sobre el texto base64, que pesa un tercio más que la foto. La
   página achica antes de mandar —a 1600 px de lado, en JPEG—, así que una
   foto normal de celular llega en unos cientos de KB; esto es para la que no. */
var MAX_FOTO_BASE64 = 7000000;

function nombreLibreParaFoto(id, ext, enCelda, enCarpeta) {
  var usados = {};
  enCelda.concat(enCarpeta).forEach(function (n) {
    var m = String(n).match(/^(.+)-(\d+)\.[a-z0-9]+$/i);
    if (m && m[1] === id) usados[Number(m[2])] = true;
  });
  var n = 1;
  while (usados[n]) n++;
  return id + '-' + n + '.' + ext;
}

function atenderSubirFoto(p) {
  var id = String(p.id || '').trim();
  var tipo = String(p.tipo || '').toLowerCase();
  var ext = TIPOS_DE_FOTO[tipo];
  var datos = String(p.datos || '');
  var comoAntes = function (nombre) {
    return ' Mientras tanto, el camino de siempre funciona: sube la foto a tu carpeta ' +
           'de fotos en Drive con el nombre «' + nombre + '» y escribe ese nombre en ' +
           'Fotos, separado de los demás con |.';
  };

  if (!ext) return { ok: false, error: 'Esa foto no es JPG, PNG ni WEBP.' };
  if (!datos) return { ok: false, error: 'No llegó ninguna foto.' };
  if (datos.length > MAX_FOTO_BASE64) {
    return { ok: false, error: 'La foto pesa demasiado para subirla desde aquí.' +
             comoAntes(id + '-1.' + ext) };
  }

  return conOperacion(p, function () {
    var cat = filasDelCatalogo();
    var i = filaDelProducto(cat.filas, id);
    if (i === -1) return { ok: false, error: 'Ese producto ya no existe en la hoja.' };

    var enCelda = String(cat.filas[i][7] || '').split('|')
      .map(function (x) { return x.trim(); }).filter(function (x) { return x; });
    /* C-1b · ¿DE QUÉ OPCIÓN ES ESTA FOTO? Si se dice («Color=Rosa»), el
       nombre la lleva: <código>--color-rosa-<n>. Una opción que el producto
       no tiene no se inventa. Tope: 6 generales y 4 por opción. */
    var base = id, deOpcion = '';
    if (String(p.opcion || '').trim()) {
      var par = String(p.opcion).split('=');
      var grupos = variantesDeCelda(cat.filas[i][13], '');
      var g0 = grupos.filter(function (g) { return llano(g.nombre) === llano(par[0]); })[0];
      var o0 = g0 && g0.opciones.filter(function (o) { return llano(o) === llano(par[1] || ''); })[0];
      if (!o0) return { ok: false, error: 'Este producto no tiene la opción «' + String(p.opcion).slice(0, 40) + '».' };
      base = id + '--' + trozoDeOpcion(g0.nombre, o0);
      deOpcion = g0.nombre + ': ' + o0;
    }
    var deEsa = enCelda.filter(function (n) { return deOpcion ? n.indexOf(base + '-') === 0 : n.indexOf('--') === -1; });
    if (!deOpcion && deEsa.length >= 6) return { ok: false, error: 'Este producto ya tiene seis fotos generales, que es el máximo. Quita una antes de subir otra.' };
    if (deOpcion && deEsa.length >= 4) return { ok: false, error: 'Esa opción ya tiene cuatro fotos, que es el máximo. Quita una antes de subir otra.' };

    var carpeta, enCarpeta = [];
    try {
      carpeta = carpetaDeFotos();
      var it = carpeta.getFiles();
      while (it.hasNext()) enCarpeta.push(it.next().getName());
    } catch (e) {
      return { ok: false, error: 'No se pudo abrir tu carpeta de fotos: ' + e.message +
               comoAntes(nombreLibreParaFoto(base, ext, enCelda, [])) };
    }

    var nombre = nombreLibreParaFoto(base, ext, enCelda, enCarpeta);
    var bytes;
    try { bytes = Utilities.base64Decode(datos); }
    catch (e) { return { ok: false, error: 'La foto llegó dañada. Vuelve a intentarlo.' }; }

    try {
      carpeta.createFile(Utilities.newBlob(bytes, tipo, nombre));
    } catch (e) {
      anotarSeguridad('Panel: no se pudo guardar una foto en Drive.', nombre + ' · ' + e.message);
      return { ok: false, error: 'Tu carpeta de Drive no dejó guardar la foto (' + e.message + ').' +
               comoAntes(nombre) };
    }

    /* El archivo ya está en Drive: ahora la celda. Si esto fallara, la foto
       quedaría en la carpeta sin estar en la hoja — que es exactamente el
       estado del camino viejo a medias, y se arregla escribiendo el nombre. */
    enCelda.push(nombre);
    cat.h.getRange(i + 2, 8).setValue(celdaSegura(enCelda.join('|'), 1900));
    cat.filas[i][7] = enCelda.join('|');
    return { ok: true, id: id, nombre: nombre, imagenes: enCelda.join('|'),
             version: versionDeFila(cat.filas[i]),
             _registro: [{ que: 'Subió una foto' + (deOpcion ? ' de ' + deOpcion : ''), donde: 'Catálogo · ' + id, antes: '', despues: nombre }] };
  }, true);
}

/* ══════════════════════════════════════════════════════════════════════════
   PEDIDOS DESDE EL PANEL (D-3)
   --------------------------------------------------------------------------
   Un pedido en la hoja son varias filas —una por línea— con el mismo número.
   El panel lo junta y lo trata como UNA cosa: se ve entero y cambia de estado
   entero.

   CAMBIAR EL ESTADO TIENE EL MISMO EFECTO QUE EN LA HOJA porque llama a lo
   mismo: trasCambiarEstado(), que es lo que corre el disparador cuando alguien
   escribe en la columna Estado. No hay una segunda implementación del
   inventario en el panel, y no puede haberla: sería la cuarta copia de la
   regla «¿esto ya se vendió?», y la tercera acaba de aparecer rota (ver
   recalcularResumen).

   NINGÚN DATO PERSONAL NUEVO. La hoja guarda, de quien compra, la ciudad. El
   nombre, el celular y la dirección viajan por WhatsApp y no se guardan en
   ningún sitio — y el panel no los inventa: devuelve las columnas que hay, y
   la batería comprueba la lista de campos una por una.
   ══════════════════════════════════════════════════════════════════════════ */

var MAX_PEDIDOS_PANEL = 200;

function lineasDePedidos() {
  var h = elLibro().getSheetByName(H_PEDIDOS);
  if (!h || h.getLastRow() < 2) return { h: h, filas: [] };
  var ancho = Math.max(h.getLastColumn(), ENCABEZADO_PEDIDOS.length);
  return { h: h, filas: h.getRange(2, 1, h.getLastRow() - 1, ancho).getValues() };
}

function fechaIso(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  return String(v === null || v === undefined ? '' : v);
}

/* La huella de un pedido: lo que el panel puede cambiar o lo que cambia solo
   —estado, inventario, fechas, guía— en cada línea. Si alguien lo tocó en la
   hoja mientras el panel lo tenía abierto, cambiar el estado encima se niega. */
function versionDePedido(filasDelPedido) {
  var trozo = filasDelPedido.map(function (f) {
    return [String(f[3]), String(f[12] || ''), fechaIso(f[13]), fechaIso(f[14]), String(f[15] || '')];
  });
  return enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                       JSON.stringify(trozo))).slice(0, 16);
}

function indicesDelPedido(filas, codigo) {
  var r = [];
  filas.forEach(function (f, i) { if (String(f[1]).trim() === codigo) r.push(i); });
  return r;
}

/* Un pedido tal como lo ve el panel. ESTA LISTA DE CAMPOS ES EL CONTRATO, y la
   comprueba panelpedidos.js: un campo nuevo aquí es un dato más que sale de la
   hoja, y eso se decide, no se cuela. */
function pedidoParaElPanel(filas, indices) {
  var primera = filas[indices[0]];
  var e = estadoDe(primera[3]);
  var distintos = {};
  indices.forEach(function (i) { distintos[llano(filas[i][3])] = String(filas[i][3]); });
  var mezclado = Object.keys(distintos).length > 1;
  var problema = !e && llano(primera[3])
    ? 'El estado «' + String(primera[3]).slice(0, 30) + '» no se reconoce: en la hoja hay una errata.'
    : mezclado
      ? 'Las líneas de este pedido tienen estados distintos (' +
        Object.keys(distintos).map(function (k) { return distintos[k]; }).join(', ') + ').'
      : '';
  return {
    pedido: String(primera[1]).trim(),
    fecha: fechaIso(primera[0]),
    estado: e ? e.rotulo : String(primera[3]),
    estadoId: e && !mezclado ? e.id : '',
    problema: problema,
    total: Number(primera[11]) || 0,
    ciudad: String(primera[4] || ''),
    cupon: String(primera[5] || ''),
    validacion: String(primera[2] || ''),
    fechaPago: fechaIso(primera[13]),
    fechaDespacho: fechaIso(primera[14]),
    guia: String(primera[15] || ''),
    /* M3.5: con qué se cobró, si se cobró en línea. Vacío en los de WhatsApp. */
    pago: String(primera[17] || ''),
    transaccion: String(primera[19] || ''),
    lineas: indices.map(function (i) {
      var f = filas[i];
      return { producto: String(f[6] || ''), id: String(f[7] || ''), variante: String(f[16] || ''),
               cantidad: Number(f[8]) || 0, precio: Number(f[9]) || 0,
               subtotal: Number(f[10]) || 0, inventario: String(f[12] || '') };
    }),
    version: versionDePedido(indices.map(function (i) { return filas[i]; })),
    /* M5: si el pedido tiene enlace de seguimiento (solo se sabe SI; el
       enlace no se puede reconstruir desde la hoja). */
    seguimiento: !!String(primera[20] || '').trim()
  };
}

function atenderPedidos(p) {
  var datos = lineasDePedidos();
  var orden = [], vistos = {};
  datos.filas.forEach(function (f) {
    var codigo = String(f[1]).trim();
    if (!codigo || vistos[codigo]) return;
    vistos[codigo] = true;
    orden.push(codigo);
  });

  var todos = orden.map(function (c) {
    return pedidoParaElPanel(datos.filas, indicesDelPedido(datos.filas, c));
  });
  var conteo = {};
  todos.forEach(function (x) { var k = x.estadoId || 'revisar'; conteo[k] = (conteo[k] || 0) + 1; });

  var estado = String(p.estado || '');
  var q = llano(p.q || '');
  var lista = todos.filter(function (x) {
    return (!estado || (estado === 'revisar' ? !x.estadoId : x.estadoId === estado)) &&
           (!q || llano(x.pedido).indexOf(q) !== -1);
  });
  /* Lo más nuevo arriba. La hoja se escribe en orden de llegada, pero el
     comerciante la puede ordenar a mano: se ordena por la fecha, no por la
     posición. */
  lista.sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0; });

  return { ok: true, pedidos: lista.slice(0, MAX_PEDIDOS_PANEL), cuantos: lista.length,
           conteo: conteo,
           estados: ESTADOS.map(function (e) { return { id: e.id, rotulo: e.rotulo, vendido: !!e.vendido }; }) };
}

var PEDIDO_CAMBIO = 'Este pedido cambió mientras lo mirabas —alguien lo tocó en la hoja—. ' +
                    'Vuelve a abrirlo para ver cómo está ahora.';

function atenderEstadoPedido(p) {
  return conOperacion(p, function () {
    var codigo = String(p.pedido || '').trim();
    var nuevo = null;
    ESTADOS.forEach(function (e) { if (e.id === p.estado) nuevo = e; });
    if (!nuevo) return { ok: false, error: 'Ese estado no existe.' };

    var datos = lineasDePedidos();
    var indices = indicesDelPedido(datos.filas, codigo);
    if (!indices.length) return { ok: false, error: 'Ese pedido ya no está en la hoja.' };
    if (String(p.version || '') !== versionDePedido(indices.map(function (i) { return datos.filas[i]; }))) {
      return { ok: false, cambiado: true, error: PEDIDO_CAMBIO };
    }

    var ahora = new Date();
    var estadoAntes = String(datos.filas[indices[0]][COL_ESTADO - 1]);
    indices.forEach(function (i) {
      var fila = i + 2, f = datos.filas[i];
      datos.h.getRange(fila, COL_ESTADO).setValue(nuevo.rotulo);
      /* Las fechas se ponen UNA vez: la primera vez que el pedido llega a ese
         estado. Volver a marcar Pagado no cambia cuándo se pagó. */
      if (nuevo.id === 'pagado' && !f[13]) datos.h.getRange(fila, 14).setValue(ahora);
      if (nuevo.id === 'despachado' && !f[14]) datos.h.getRange(fila, 15).setValue(ahora);
      if (nuevo.id === 'despachado' && p.guia !== undefined && String(p.guia).trim()) {
        datos.h.getRange(fila, 16).setValue(celdaSegura(p.guia, 60));
      }
    });

    var movidos = trasCambiarEstado();
    var despues = lineasDePedidos();
    return { ok: true, movidos: movidos,
             pedido: pedidoParaElPanel(despues.filas, indicesDelPedido(despues.filas, codigo)),
             _registro: [{ que: 'Cambió el estado del pedido', donde: 'Pedidos · #' + codigo, antes: estadoAntes,
                           despues: nuevo.rotulo + (nuevo.id === 'despachado' && p.guia ? ' · guía ' + p.guia : '') +
                                    (movidos ? ' · inventario ajustado' : '') }] };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   LA CONFIGURACIÓN DESDE EL PANEL (D-4)
   --------------------------------------------------------------------------
   SOLO LAS CLAVES DEL COMERCIANTE, en una lista escrita aquí y no deducida.
   Las técnicas —la dirección del sitio, el repositorio, las carpetas de Drive,
   las del correo, los datos de pago— no aparecen: no porque sean secretas para
   quien entró, sino porque cambiarlas desde un celular rompe la tienda de
   formas que el comerciante no puede ver ni arreglar. Una clave nueva en la
   hoja NO aparece aquí sola: hay que agregarla a esta lista, y eso es una
   decisión.

   UN VALOR QUE NO SE ENTIENDE SE MARCA Y NO SE DEGRADA. Si `f_variantes` dice
   «tal vez», el panel no pinta una casilla sin marcar —que sería «No»—: pinta
   «tal vez» en rojo y pide elegir. Guardar el formulario sin mirar no puede
   apagar nada que nadie apagó.
   ══════════════════════════════════════════════════════════════════════════ */

var CLAVES_DEL_PANEL = [
  { clave: 'negocio',              grupo: 'Tu tienda',  tipo: 'texto',  rotulo: 'Nombre del comercio' },
  /* SENSIBLE: a ese número llegan los pedidos y, por WhatsApp, las
     instrucciones de pago. Cambiarlo pide la clave otra vez (ver abajo). */
  { clave: 'whatsapp',             grupo: 'Tu tienda',  tipo: 'celular', rotulo: 'WhatsApp para pedidos', sensible: true },
  { clave: 'horario',              grupo: 'Tu tienda',  tipo: 'texto',  rotulo: 'Horario de atención' },
  { clave: 'portada_titulo',       grupo: 'La portada', tipo: 'texto',  rotulo: 'Título de la portada' },
  { clave: 'portada_texto',        grupo: 'La portada', tipo: 'largo',  rotulo: 'Texto de la portada' },
  { clave: 'portada_puntos',       grupo: 'La portada', tipo: 'largo',  rotulo: 'Puntos de la portada (separados por |)' },
  { clave: 'color_principal',      grupo: 'Los colores', tipo: 'color', rotulo: 'Color principal' },
  { clave: 'color_secundario',     grupo: 'Los colores', tipo: 'color', rotulo: 'Color secundario' },
  { clave: 'color_alterno',        grupo: 'Los colores', tipo: 'color', rotulo: 'Color alterno' },
  { clave: 'pie_descripcion',      grupo: 'Los textos', tipo: 'largo',  rotulo: 'Descripción al pie' },
  { clave: 'como_compras',         grupo: 'Los textos', tipo: 'largo',  rotulo: 'Cómo comprar (pasos separados por |)' },
  { clave: 'envio_gratis_desde',   grupo: 'La venta',   tipo: 'cifra',  rotulo: 'Envío gratis desde (vacío = nunca)' },
  { clave: 'orden_catalogo',       grupo: 'La venta',   tipo: 'opcion', rotulo: 'Orden del catálogo',
    opciones: ['Destacados primero', 'Como en la hoja', 'Precio: de menor a mayor',
               'Precio: de mayor a menor', 'Nombre: de la A a la Z'] },
  { clave: 'f_variantes',          grupo: 'La venta',   tipo: 'sino',   rotulo: 'Pedir elegir variantes' },
  { clave: 'retracto_excepciones', grupo: 'La venta',   tipo: 'largo',  rotulo: 'Productos sin derecho de retracto (separados por |)' },
  { clave: 'empresa_razon',        grupo: 'Datos legales', tipo: 'texto',  rotulo: 'Razón social' },
  { clave: 'empresa_nit',          grupo: 'Datos legales', tipo: 'texto',  rotulo: 'NIT' },
  { clave: 'empresa_direccion',    grupo: 'Datos legales', tipo: 'texto',  rotulo: 'Dirección' },
  { clave: 'empresa_ciudad',       grupo: 'Datos legales', tipo: 'texto',  rotulo: 'Ciudad' },
  { clave: 'empresa_tel',          grupo: 'Datos legales', tipo: 'texto',  rotulo: 'Teléfono' },
  { clave: 'empresa_correo',       grupo: 'Datos legales', tipo: 'correo', rotulo: 'Correo' },
  { clave: 'correo_resumen',       grupo: 'El correo del día', tipo: 'correo', rotulo: 'A qué correo llega el resumen' },
  { clave: 'cobro_modo',           grupo: 'El cobro',   tipo: 'opcion', rotulo: 'Cómo se cierra la venta',
    opciones: ['WhatsApp', 'Pasarela'] },
  { clave: 'pedido_minimo',        grupo: 'La venta',   tipo: 'cifra',  rotulo: 'Pedido mínimo (vacío = sin mínimo)' },
  { clave: 'tienda_abierta',       grupo: 'Tu tienda',  tipo: 'sino',   rotulo: 'La tienda recibe pedidos' },
  { clave: 'tienda_cerrada_mensaje', grupo: 'Tu tienda', tipo: 'largo', rotulo: 'Mensaje cuando está cerrada' },

  /* ── DESDE EL 21 DE SEPTIEMBRE (0.9.0): TODO LO DEMÁS QUE SE ESCRIBE A MANO ──
     El dueño lo pidió así: que el panel alcance para todo y la hoja quede de
     respaldo. Dos quedan fuera, y es a propósito: `correo_ultimo` lo escribe el
     script, y `panel_usuario` va con la clave, que solo da el menú de la hoja
     —cambiar el usuario desde dentro de la sesión dejaría una clave sin dueño—.

     EL AMBIENTE DEL COBRO Y LOS DATOS DE PAGO SON SENSIBLES: con una sesión
     robada, cambiar la cuenta a la que se transfiere o pasar a Producción es
     llevarse la plata. Por eso piden la clave otra vez, cada vez (`sensible`).
     Las LLAVES de Bold no están aquí ni van a estar: viven en las propiedades
     del script, donde solo llega quien edita el proyecto. */
  { clave: 'logo',                 grupo: 'Tu tienda',  tipo: 'imagen', rotulo: 'Logo: el archivo de tu carpeta de fotos (logo.png) o una dirección completa. Vacío = el signo con tus colores' },
  { clave: 'favicon',              grupo: 'Tu tienda',  tipo: 'imagen', rotulo: 'Ícono de la pestaña (cuadrado). Vacío = se usa tu logo; si tampoco hay, un marcador con tus colores' },
  { clave: 'cobro_ambiente',       grupo: 'El cobro',   tipo: 'opcion', rotulo: 'Pasarela: ¿pruebas o dinero real?',
    opciones: ['Pruebas', 'Producción'], sensible: true },
  { clave: 'pago_llave',           grupo: 'El cobro',   tipo: 'texto',  rotulo: 'Transferencia: llave Bre-B o número de cuenta', sensible: true },
  { clave: 'pago_titular',         grupo: 'El cobro',   tipo: 'texto',  rotulo: 'Transferencia: a nombre de quién', sensible: true },
  { clave: 'pago_entidad',         grupo: 'El cobro',   tipo: 'texto',  rotulo: 'Transferencia: banco o billetera', sensible: true },
  { clave: 'pago_texto',           grupo: 'El cobro',   tipo: 'largo',  rotulo: 'Transferencia: el mensaje de pago (vacío = se arma solo)', sensible: true },
  { clave: 'pago_tope',            grupo: 'El cobro',   tipo: 'cifra',  rotulo: 'Transferencia: tope por pago (Bre-B)' },
  { clave: 'legal_actualizado',    grupo: 'Datos legales', tipo: 'texto', rotulo: 'Fecha al pie de los textos legales' },
  { clave: 'sitio_titulo',         grupo: 'Google y WhatsApp', tipo: 'texto', rotulo: 'Título en el buscador y al compartir' },
  { clave: 'sitio_descripcion',    grupo: 'Google y WhatsApp', tipo: 'largo', rotulo: 'Descripción en el buscador y al compartir' },
  { clave: 'correo_hora',          grupo: 'El correo del día', tipo: 'hora', rotulo: 'A qué hora sale (0 a 23)' },
  { clave: 'correo_siempre',       grupo: 'El correo del día', tipo: 'sino', rotulo: 'Llega todos los días (No = solo si hay algo)' },
  { clave: 'sitio_url',            grupo: 'Avanzado',   tipo: 'texto',  rotulo: 'Dirección de la tienda' },
  { clave: 'repositorio',          grupo: 'Avanzado',   tipo: 'texto',  rotulo: 'Repositorio (dueño/nombre)' },
  { clave: 'fotos_drive',          grupo: 'Avanzado',   tipo: 'texto',  rotulo: 'Carpeta de Drive con las fotos crudas' },
  { clave: 'fotos_origen',         grupo: 'Avanzado',   tipo: 'texto',  rotulo: 'Dónde se sirven las fotos' },
  { clave: 'fotos_cdn',            grupo: 'Avanzado',   tipo: 'lista',  rotulo: 'Transformación de fotos' },
  { clave: 'fotos_webp',           grupo: 'Avanzado',   tipo: 'sino',   rotulo: 'Fotos en varios tamaños (webp)' },
  { clave: 'respaldo_carpeta',     grupo: 'Avanzado',   tipo: 'texto',  rotulo: 'Carpeta del respaldo semanal' },
  { clave: 'f_autoria',            grupo: 'Avanzado',   tipo: 'sino',   rotulo: 'Mostrar la autoría al pie' },
  { clave: 'autoria_url',          grupo: 'Avanzado',   tipo: 'url',    rotulo: 'A dónde enlaza la autoría' },
  /* M5 */
  { clave: 'f_rastreo',            grupo: 'La venta',   tipo: 'sino',   rotulo: 'Enlace para que el comprador siga su pedido' },
  /* 0.11.0 */
  { clave: 'f_avisame',            grupo: 'La venta',   tipo: 'sino',   rotulo: '«Avísame cuando llegue» en lo agotado' },
  { clave: 'catalogo_columnas',    grupo: 'La portada', tipo: 'opcion', rotulo: 'Productos por fila en computador',
    opciones: ['3', '4', '5'] },
  /* 0.19.0 · AL FINAL (R1). La medición. Vacío = la tienda no carga NADA de
     Google y no pone una sola cookie: es el valor de fábrica y es el que hace
     que una tienda sin política de cookies siga siendo legal. */
  { clave: 'analytics_id',         grupo: 'Google y WhatsApp', tipo: 'medicion',
    rotulo: 'Google Analytics 4 (G-…)' }
];

/* EL ORDEN EN QUE SE ENSEÑAN LOS GRUPOS. La lista de arriba solo crece al
   final (así se lee la historia de qué entró cuándo); el orden de pantalla es
   otra cosa y vive aquí. */
var GRUPOS_DEL_PANEL = ['Tu tienda', 'La venta', 'El cobro', 'La portada', 'Los textos', 'Los colores',
                        'Google y WhatsApp', 'Datos legales', 'El correo del día', 'Avanzado'];

/* ¿Se entiende este valor? Devuelve null si sí, o el motivo. Vacío siempre se
   entiende: toda clave puede estar vacía (CONTRATOS §5). */
function problemaDeValor(def, valor) {
  var v = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!v) return null;
  if (def.tipo === 'color' && !/^#[0-9a-f]{6}$/i.test(v)) return 'Un color se escribe así: #1B5E3A';
  if (def.tipo === 'cifra') {
    CELDAS_ILEGIBLES = [];
    var n = cifraDeTexto(v, def.clave);
    CELDAS_ILEGIBLES = [];
    if (n === null) return 'Tiene que ser un número (ej: 150000), o quedar vacío.';
  }
  if (def.tipo === 'sino' && ['si', 'sí', 'no'].indexOf(llano(v)) === -1) return 'Tiene que decir Sí o No.';
  if (def.tipo === 'opcion' && def.opciones.map(llano).indexOf(llano(v)) === -1) {
    return 'Tiene que ser una de estas: ' + def.opciones.join(' · ');
  }
  if (def.tipo === 'celular' && !/^\+?[\d\s-]{10,16}$/.test(v)) return 'Un celular con indicativo: 573001234567';
  if (def.tipo === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Eso no parece un correo.';
  if (def.tipo === 'url' && !/^https:\/\/\S+$/.test(v)) return 'Una dirección completa, que empiece por https://';
  /* 0.21.0 · Una imagen de la tienda se nombra como en el catálogo: el archivo
     de la carpeta de fotos, o una dirección completa. Una ruta con carpetas no:
     lo que se publica es esa carpeta y nada más. */
  if (def.tipo === 'imagen' && !/^https:\/\/\S+$/.test(v) &&
      !/^[^\/\\]+\.(jpe?g|png|webp|avif)$/i.test(v)) {
    return 'El archivo de tu carpeta de fotos (logo.png), o una dirección completa que empiece por https://';
  }
  if (def.tipo === 'hora' && !(/^\d{1,2}$/.test(v) && Number(v) <= 23)) return 'Una hora de 0 a 23.';
  /* 0.19.0 · El identificador de GA4, y no el de otra cosa. `UA-…` es Universal
     Analytics, que Google apagó; `GTM-…` es Tag Manager, que carga lo que
     alguien haya configurado allá y no cabe en esta política de seguridad. Un
     valor que no es G- no se hornea: la tienda se publica sin medición, y el
     panel dice por qué en vez de dejar una página muda. */
  if (def.tipo === 'medicion' && !ANALITICA_VALIDA.test(v)) {
    return 'El identificador de Google Analytics 4 se ve así: G-ABCD123456 ' +
           '(Analytics › Administrar › Flujos de datos › Web). Vacío = sin medición.';
  }
  return null;
}

/* ── LAS LISTAS QUE DEPENDEN DE LA TIENDA ────────────────────────────────────
   `fotos_cdn` se escribía a mano: una plantilla de URL con {ancho} y {ruta}
   que nadie sabe escribir. El dueño pidió elegirla de una lista con lo que ya
   sabemos hacer, y agregar después los proveedores del mercado. Cada opción
   guarda en la hoja la MISMA plantilla que antes se escribía a mano: la página
   que la lee no cambia, y la hoja sigue sirviendo sin el panel.

   Lo que ya está en la hoja y no es de la lista se conserva como
   «Personalizada»: el panel no la toca mientras nadie elija otra. */
function opcionesDeLista(clave, cfg) {
  if (clave !== 'fotos_cdn') return [];
  cfg = cfg || leerConfiguracion();
  var sitio = String(cfg.sitio_url || '').trim();
  var host = hostDe(/^https?:\/\//i.test(sitio) ? sitio : 'https://' + sitio);
  /* 0.16.0 · LAS DOS SIRVEN, y se dice qué da cada una (decisión 22). */
  var r = [{ valor: '', rotulo: 'Ninguna: tu sitio sirve las fotos en tres tamaños ya hechos (sin límites, la de siempre)' }];
  if (host) {
    /* Transformaciones de Cloudflare: mismo dominio, así que no toca la política
       de seguridad. Pero NO existe en *.workers.dev ni *.pages.dev: ahí se ofrece
       desactivada, con el porqué, en vez de dejar elegir algo que deja la tienda
       sin fotos. */
    var propio = !/\.(workers|pages)\.dev$/.test(host);
    r.push({ valor: 'https://' + host + '/cdn-cgi/image/format=auto,quality=82,width={ancho},fit=cover/fotos/{ruta}',
             rotulo: 'Cloudflare, en tu propio dominio: el tamaño y el formato justos para cada pantalla' +
                     (propio ? ' (5.000 fotos distintas al mes gratis; hay que activarlo en la zona)' : ' (necesita un dominio propio: hoy es ' + host + ')'),
             desactivada: !propio });
  }
  return r;
}

function problemaDeLista(def, valor, cfg) {
  var v = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!v || def.tipo !== 'lista') return null;
  var ops = opcionesDeLista(def.clave, cfg);
  if (ops.some(function (o) { return o.valor === v; })) return null;
  return /^https:\/\/\S*\{ruta\}/.test(v) ? null :
    'No es una plantilla que la tienda sepa usar: tiene que empezar por https:// y llevar {ruta}. Elige una de la lista.';
}

/* «Pasarela» se entiende, pero puede no estar lista. Eso también es un
   problema que se dice junto al campo: el comerciante eligió cobrar en línea y
   la tienda sigue por WhatsApp, y tiene que saber por qué. */
function problemaDelCobro(def, valor) {
  if (def.clave !== 'cobro_modo' || llano(valor) !== 'pasarela') return null;
  return cobroVigente().problema || null;
}

/* La clave del panel, pedida otra vez para un cambio sensible. Devuelve null
   si está bien, o la respuesta de rechazo. Usa el mismo contador de intentos
   que la entrada: si no, este sería el sitio donde probar claves sin freno. */
var PIDE_CLAVE = 'Para cambiar esto escribe tu clave del panel otra vez.';
function claveOtraVez(p) {
  var bloqueo = estadoDeIntentos();
  if (bloqueo.hasta > Date.now()) {
    return { ok: false, necesitaClave: true, error: 'Demasiados intentos. Prueba de nuevo en ' +
             Math.ceil((bloqueo.hasta - Date.now()) / 60000) + ' minuto(s).' };
  }
  var clave = String(p.c || '');
  if (!clave) return { ok: false, necesitaClave: true, error: PIDE_CLAVE };
  if (!claveDelPanelCorrecta(clave)) {
    var s0 = leerTestigo(p.k);
    anotarIntentoFallido(s0 ? s0.usuario : '');
    return { ok: false, necesitaClave: true, error: 'Esa no es tu clave. No se guardó nada.' };
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   ENVÍOS Y CUPONES DESDE EL PANEL (0.9.0)
   --------------------------------------------------------------------------
   Una fila a la vez, como los productos: con su huella para no pisar lo que
   cambió en la hoja entre medias, y con su número de operación. La hoja
   sigue siendo la fuente y se puede seguir editando a mano.

   EL CÓDIGO DE UNA ZONA NO SE CAMBIA después de creada: viaja en los
   carritos abiertos y en los pedidos, y renombrarla sería dejarlos apuntando a
   nada. Se cambia el nombre y el valor; para otro código, zona nueva.

   «USOS CONFIRMADOS» NO SE ESCRIBE NUNCA desde aquí: lo cuenta el script a
   partir de las ventas. Tampoco entra en la huella, para que una venta con
   el cupón no invalide la edición de sus notas. Un cupón que ya se usó no se
   borra —es historia de ventas—: se desactiva.
   ══════════════════════════════════════════════════════════════════════════ */
/* El DÍA de una fecha, AAAA-MM-DD, para lo que se edita como día (el
   vencimiento de un cupón). Se llamó fechaIso durante una versión y pisó en
   silencio a la de arriba —en Apps Script gana la última declaración—: los
   pedidos del panel perdieron la hora (bitácora 58). */
function diaIso(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    return v.getFullYear() + '-' + dd(v.getMonth() + 1) + '-' + dd(v.getDate());
  }
  return String(v === null || v === undefined ? '' : v).trim();
}
function texto0(v) { return String(v === null || v === undefined ? '' : v).trim(); }

function filasDe(nombre, ancho) {
  var h = elLibro().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return { h: h, filas: [] };
  return { h: h, filas: h.getRange(2, 1, h.getLastRow() - 1, ancho).getValues() };
}

var CODIGO_ENVIO = /^[a-z0-9][a-z0-9-]{0,39}$/;
var CODIGO_CUPON = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;
var TIPOS_CUPON = ['porcentaje', 'fijo', 'envio'];

function versionDeEnvio(f) { return versionDeFila([texto0(f[0]), texto0(f[1]), texto0(f[2])]); }
function versionDeCupon(f) {
  return versionDeFila([texto0(f[0]), texto0(f[1]), texto0(f[2]), texto0(f[3]), diaIso(f[4]),
                        texto0(f[5]), texto0(f[7]), texto0(f[8])]);
}

function enviosParaElPanel() {
  return filasDe(H_ENVIOS, 3).filas.filter(function (f) { return texto0(f[0]); }).map(function (f) {
    var n = cifraDeTexto(f[2], 'Envíos');
    return { id: texto0(f[0]), nombre: texto0(f[1]), valor: texto0(f[2]), version: versionDeEnvio(f),
             problema: n === null ? 'El valor no se entiende: esta zona no se ofrece hasta que sea un número.' : '' };
  });
}

function cuponesParaElPanel() {
  return filasDe(H_CUPONES, 9).filas.filter(function (f) { return texto0(f[0]); }).map(function (f) {
    return { codigo: texto0(f[0]), tipo: texto0(f[1]).toLowerCase(), valor: texto0(f[2]), minimo: texto0(f[3]),
             vence: diaIso(f[4]), usosMaximos: texto0(f[5]), usados: Number(f[6]) || 0,
             activo: esSi(f[7]) ? 'Sí' : 'No', notas: texto0(f[8]), version: versionDeCupon(f) };
  });
}

/* Un número del panel: vacío vale `vacio`; si no se entiende, null. */
function cifraDelPanel(v, vacio) {
  var t = texto0(v);
  if (!t) return vacio;
  CELDAS_ILEGIBLES = [];
  var n = cifraDeTexto(t, 'panel');
  CELDAS_ILEGIBLES = [];
  return n === null || n < 0 ? null : n;
}

function atenderGuardarEnvio(p) {
  return conOperacion(p, function () {
    var t = filasDe(H_ENVIOS, 3);
    var original = texto0(p.original);
    var i = -1;
    t.filas.forEach(function (f, k) { if (texto0(f[0]) === original && original) i = k; });
    if (original) {
      if (i === -1) return { ok: false, error: 'Esa zona ya no está en la hoja. Vuelve a abrir la lista.' };
      if (String(p.version || '') !== versionDeEnvio(t.filas[i])) {
        return { ok: false, error: 'Esa zona cambió en la hoja mientras la editabas. Vuelve a abrir la lista.' };
      }
    }
    var antes = i === -1 ? '' : texto0(t.filas[i][1]) + ' · $' + texto0(t.filas[i][2]);
    if (p.borrar === true) {
      if (i === -1) return { ok: false, error: 'No hay nada que borrar.' };
      t.h.deleteRows(i + 2, 1);
      return { ok: true, borrado: original,
               _registro: [{ que: 'Borró la zona de envío', donde: 'Envíos · ' + original, antes: antes, despues: '' }] };
    }
    var d = p.envio || {};
    var id = original || texto0(d.id).toLowerCase();
    var nombre = celdaSegura(d.nombre, 80);
    var valor = cifraDelPanel(d.valor, null);
    var errores = {};
    if (!CODIGO_ENVIO.test(id)) errores.id = 'El código va en minúsculas, sin espacios ni tildes: zona-norte';
    else if (!original && t.filas.some(function (f) { return texto0(f[0]) === id; })) errores.id = 'Ya hay una zona con ese código.';
    if (!nombre) errores.nombre = 'Ponle un nombre: es lo que ve el comprador.';
    if (valor === null) errores.valor = 'Un número (0 si no cuesta), sin puntos ni signo.';
    if (Object.keys(errores).length) return { ok: false, errores: errores, error: 'No se guardó: hay datos por corregir.' };
    var h = t.h || hoja(H_ENVIOS, ['ID', 'Nombre', 'Valor']);
    if (i === -1) h.appendRow([id, nombre, valor]);
    else h.getRange(i + 2, 1, 1, 3).setValues([[id, nombre, valor]]);
    return { ok: true, id: id, version: versionDeEnvio([id, nombre, valor]),
             _registro: [{ que: i === -1 ? 'Creó la zona de envío' : 'Editó la zona de envío', donde: 'Envíos · ' + id,
                           antes: antes, despues: nombre + ' · $' + valor }] };
  }, true);
}

function atenderGuardarCupon(p) {
  return conOperacion(p, function () {
    var t = filasDe(H_CUPONES, 9);
    var original = texto0(p.original).toUpperCase();
    var i = -1;
    t.filas.forEach(function (f, k) { if (original && texto0(f[0]).toUpperCase() === original) i = k; });
    if (original) {
      if (i === -1) return { ok: false, error: 'Ese cupón ya no está en la hoja. Vuelve a abrir la lista.' };
      if (String(p.version || '') !== versionDeCupon(t.filas[i])) {
        return { ok: false, error: 'Ese cupón cambió en la hoja mientras lo editabas. Vuelve a abrir la lista.' };
      }
    }
    var resumen = function (f) {
      return [texto0(f[1]), texto0(f[2]), 'mínimo ' + (texto0(f[3]) || '0'), diaIso(f[4]) ? 'vence ' + diaIso(f[4]) : '',
              esSi(f[7]) ? 'activo' : 'inactivo'].filter(function (x) { return x; }).join(' · ');
    };
    var antes = i === -1 ? '' : resumen(t.filas[i]);
    if (p.borrar === true) {
      if (i === -1) return { ok: false, error: 'No hay nada que borrar.' };
      if ((Number(t.filas[i][6]) || 0) > 0) {
        return { ok: false, error: 'Este cupón ya se usó en ventas: no se borra, se desactiva. Así queda la historia.' };
      }
      t.h.deleteRows(i + 2, 1);
      return { ok: true, borrado: original,
               _registro: [{ que: 'Borró el cupón', donde: 'Cupones · ' + original, antes: antes, despues: '' }] };
    }
    var d = p.cupon || {};
    var codigo = original || texto0(d.codigo).toUpperCase();
    var tipo = texto0(d.tipo).toLowerCase();
    var valor = cifraDelPanel(d.valor, tipo === 'envio' ? 0 : null);
    var minimo = cifraDelPanel(d.minimo, 0);
    var maximos = cifraDelPanel(d.usosMaximos, 0);
    var vence = texto0(d.vence);
    var activo = llano(d.activo) === 'no' ? 'No' : 'Sí';
    var notas = celdaSegura(d.notas, 200);
    var errores = {};
    if (!CODIGO_CUPON.test(codigo)) errores.codigo = 'De 3 a 30 letras o números, sin espacios: BIENVENIDA10';
    else if (!original && t.filas.some(function (f) { return texto0(f[0]).toUpperCase() === codigo; })) errores.codigo = 'Ya hay un cupón con ese código.';
    if (TIPOS_CUPON.indexOf(tipo) === -1) errores.tipo = 'Elige: porcentaje, fijo o envío gratis.';
    if (valor === null || (tipo === 'porcentaje' && (valor <= 0 || valor > 100)) || (tipo === 'fijo' && valor <= 0)) {
      errores.valor = tipo === 'porcentaje' ? 'Un porcentaje de 1 a 100.' : 'Cuánto descuenta, en pesos.';
    }
    if (minimo === null) errores.minimo = 'Un número, o vacío para sin mínimo.';
    if (maximos === null || Math.floor(maximos) !== maximos) errores.usosMaximos = 'Un número entero; 0 = sin tope.';
    if (vence && (!/^\d{4}-\d{2}-\d{2}$/.test(vence) || isNaN(new Date(vence + 'T12:00:00').getTime()))) {
      errores.vence = 'Una fecha como 2026-12-31, o vacío para que no venza.';
    }
    if (Object.keys(errores).length) return { ok: false, errores: errores, error: 'No se guardó: hay datos por corregir.' };
    var h = t.h || hoja(H_CUPONES, ['Código', 'Tipo', 'Valor', 'Mínimo', 'Vence', 'Usos máximos', 'Usos confirmados', 'Activo', 'Notas']);
    var nueva = [codigo, tipo, valor, minimo, vence, maximos];
    var fila;
    if (i === -1) {
      fila = nueva.concat([0, activo, notas]);
      h.appendRow(fila);
    } else {
      /* Dos escrituras y no una: la columna G (usos confirmados) queda en medio
         y es del script. */
      h.getRange(i + 2, 1, 1, 6).setValues([nueva]);
      h.getRange(i + 2, 8, 1, 2).setValues([[activo, notas]]);
      fila = nueva.concat([t.filas[i][6], activo, notas]);
    }
    return { ok: true, codigo: codigo, version: versionDeCupon(fila),
             _registro: [{ que: i === -1 ? 'Creó el cupón' : 'Editó el cupón', donde: 'Cupones · ' + codigo,
                           antes: antes, despues: resumen(fila) }] };
  });
}

function filasDeConfiguracion() {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h || h.getLastRow() < 2) return { h: h, filas: [] };
  return { h: h, filas: h.getRange(2, 1, h.getLastRow() - 1, 3).getValues() };
}

function versionDeValor(v) {
  return enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
                                       String(v === undefined || v === null ? '' : v))).slice(0, 12);
}

function atenderConfiguracion(p) {
  var colab = esColaborador(p);
  var cfg = filasDeConfiguracion();
  var fila = {};
  cfg.filas.forEach(function (f, i) { fila[String(f[0]).trim()] = i; });
  var orden = function (d) { var i = GRUPOS_DEL_PANEL.indexOf(d.grupo); return i === -1 ? 99 : i; };
  var vista = leerConfiguracion();
  var claves = CLAVES_DEL_PANEL.filter(function (d) { return fila[d.clave] !== undefined &&
                                         (!colab || CLAVES_DEL_COLABORADOR.indexOf(d.clave) !== -1); })
    .map(function (d, i) { return { d: d, i: i }; })
    .sort(function (x, y) { return orden(x.d) - orden(y.d) || x.i - y.i; })
    .map(function (x) {
      var d = x.d;
      var f = cfg.filas[fila[d.clave]];
      var valor = String(f[1] === null || f[1] === undefined ? '' : f[1]);
      return { clave: d.clave, grupo: d.grupo, tipo: d.tipo, rotulo: d.rotulo,
               opciones: d.tipo === 'lista' ? opcionesDeLista(d.clave, vista) : (d.opciones || null),
               ayuda: String(f[2] || ''),
               valor: valor, problema: problemaDeValor(d, valor) || problemaDeLista(d, valor, vista) ||
                                       problemaDelCobro(d, valor),
               version: versionDeValor(valor), sensible: !!d.sensible };
    });
  /* AL FINAL, Y NO EN MEDIO (R1). Lo que el panel necesita para su segunda
     pantalla: cómo se está cobrando de verdad, y las dos pestañas que antes
     solo se editaban en la hoja. */
  var col = colaboradorGuardado();
  return { ok: true, claves: claves, cobro: estadoDelCobro(), envios: enviosParaElPanel(),
           cupones: cuponesParaElPanel(),
           /* 0.13.0 · 2.2 · al final (R1): quién pregunta, y al dueño, su colaborador. */
           rol: colab ? 'colaborador' : 'dueño',
           colaborador: colab ? null : { usuario: col.u, activo: !!(col.u && col.clave) } };
}

/* Lo que se pidió en la hoja y lo que la tienda está haciendo, con el porqué.
   Sin las llaves, sin nada que no sea una frase para el comerciante. */
function estadoDelCobro() {
  var v = cobroVigente();
  return { pedido: v.pedido, modo: v.modo, ambiente: v.ambiente, problema: v.problema || '' };
}

/* Todo o nada: si una clave no valida, no se escribe ninguna. Guardar media
   configuración deja la tienda en un estado que nadie pidió. */
function atenderGuardarConfiguracion(p) {
  return conOperacion(p, function () {
    var cambios = p.cambios || {};
    var versiones = p.versiones || {};
    var defs = {};
    CLAVES_DEL_PANEL.forEach(function (d) { defs[d.clave] = d; });

    var cfg = filasDeConfiguracion();
    var fila = {};
    cfg.filas.forEach(function (f, i) { fila[String(f[0]).trim()] = i; });

    /* LO SENSIBLE PIDE LA CLAVE OTRA VEZ. Solo si de verdad cambia: mandar el
       mismo número de siempre no es tocarlo. Una clave mala cuenta como un
       intento fallido de entrar, con el mismo bloqueo. */
    var tocaSensible = Object.keys(cambios).some(function (k) {
      var d = defs[k];
      if (!d || !d.sensible || fila[k] === undefined) return false;
      var actual = String(cfg.filas[fila[k]][1] === null || cfg.filas[fila[k]][1] === undefined ? '' : cfg.filas[fila[k]][1]).trim();
      return String(cambios[k] === null || cambios[k] === undefined ? '' : cambios[k]).trim() !== actual;
    });
    /* El colaborador no llega a lo sensible (abajo se rechaza): no se le pide
       una clave que no es la suya. */
    if (tocaSensible && !esColaborador(p)) {
      var rechazo = claveOtraVez(p);
      if (rechazo) return rechazo;
    }

    var errores = {}, aEscribir = [];
    Object.keys(cambios).forEach(function (k) {
      var d = defs[k];
      /* Una clave que no está en la lista no se toca, aunque exista en la
         hoja: es exactamente la puerta que esta lista existe para cerrar. */
      if (!d || fila[k] === undefined) { errores[k] = 'Esa clave no se cambia desde el panel.'; return; }
      if (esColaborador(p) && CLAVES_DEL_COLABORADOR.indexOf(k) === -1) { errores[k] = SOLO_DUENO; return; }
      var actual = cfg.filas[fila[k]][1];
      if (String(versiones[k] || '') !== versionDeValor(actual)) {
        errores[k] = 'Cambió en la hoja mientras la editabas. Vuelve a abrir la configuración.';
        return;
      }
      var valor = String(cambios[k] === null || cambios[k] === undefined ? '' : cambios[k]).trim();
      var mal = problemaDeValor(d, valor);
      /* Una lista acepta sus opciones —las activas— o dejar lo que ya había. */
      if (!mal && d.tipo === 'lista' && valor !== String(actual === null || actual === undefined ? '' : actual).trim() &&
          !opcionesDeLista(k).some(function (o) { return o.valor === valor && !o.desactivada; })) {
        mal = 'Elige una de la lista.';
      }
      if (mal) { errores[k] = mal; return; }
      if (d.tipo === 'sino' && valor) valor = llano(valor) === 'no' ? 'No' : 'Sí';
      if (d.tipo === 'color') valor = valor.toUpperCase();
      aEscribir.push({ fila: fila[k] + 2, clave: k, antes: String(actual === null || actual === undefined ? '' : actual),
                       valor: d.tipo === 'color' || d.tipo === 'cifra' ? valor : celdaSegura(valor, 2000) });
    });
    if (Object.keys(errores).length) {
      return { ok: false, errores: errores, error: 'No se guardó nada: hay ' +
               Object.keys(errores).length + ' valor(es) por corregir.' };
    }
    aEscribir.forEach(function (w) { cfg.h.getRange(w.fila, 2).setValue(w.valor); });
    /* Un color escrito aquí tiene que pintar su celda en la hoja, igual que
       cuando se escribe allá: el relleno y el valor no pueden decir dos cosas. */
    try { pintarColoresDesdeValor(); } catch (e) { }
    cacheFuera();
    return { ok: true, guardadas: aEscribir.length,
             _registro: aEscribir.map(function (w) {
               return { que: 'Cambió la configuración', donde: 'Configuración · ' + w.clave, antes: w.antes, despues: w.valor };
             }) };
  }, true);
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLICAR DESDE EL PANEL (D-5)
   --------------------------------------------------------------------------
   Guardar no publica: la tienda sirve un catálogo horneado, y hornearlo es un
   flujo de GitHub que tarda minutos. Publicar es un gesto aparte, explícito, y
   el panel dice tres cosas que el menú de la hoja nunca pudo decir:

     · si hay algo sin publicar —lo último que se guardó es posterior a lo que
       la tienda está sirviendo—,
     · cuándo fue la última publicación, preguntándoselo a la tienda y no a la
       hoja (la hoja siempre está al día por definición),
     · y mientras corre, cómo va; al terminar, cómo terminó.

   Disparar es LA MISMA FUNCIÓN que usa «Publicar ahora» del menú; el menú solo
   la envuelve en un texto.
   ══════════════════════════════════════════════════════════════════════════ */

/* UNA FUNCIÓN Y NO UNA LISTA, y no por estilo. Este bloque está ARRIBA en el
   archivo, antes de donde se declaran H_CATALOGO y compañía, y en Apps Script
   una `var` existe desde el principio pero vale `undefined` hasta que se llega
   a su línea. Escrita como lista, valía [undefined, undefined, undefined]: los
   cambios hechos en la hoja nunca contaban como «sin publicar», sin un error
   en ninguna parte. Lo cazó panelpublicar.js. */
function hojasQueSePublican() { return [H_CATALOGO, H_CONFIG, H_ENVIOS, H_INVENTARIO_VARIANTE]; }

function marcarEdicion() {
  try { propiedades().setProperty('ULTIMA_EDICION', new Date().toISOString()); } catch (e) { }
}

function repositorioYPermiso() {
  var repo = String(leerConfiguracion().repositorio || '').trim()
               .replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '')
               .replace(/\/+$/, '');
  var tk = '';
  try { tk = String(propiedades().getProperty('GITHUB_TOKEN') || '').trim(); } catch (e) { }
  return { repo: repo, repoOk: !!repo && /^[\w.-]+\/[\w.-]+$/.test(repo), tk: tk };
}

function cabecerasGitHub(tk) {
  return { Authorization: 'Bearer ' + tk, Accept: 'application/vnd.github+json',
           'X-GitHub-Api-Version': '2022-11-28' };
}

/* Dispara el flujo `fotos`. Devuelve { ok, codigo, porQue }. */
function dispararPublicacion() {
  var d = dispararFlujo('fotos.yml', null, 'Publicar ahora');
  if (d.ok) { try { propiedades().setProperty('PEDIDA_PUBLICACION', new Date().toISOString()); } catch (e) { } }
  return d;
}

/* UN SOLO DISPARO A GITHUB para todo lo que el comercio pide desde la hoja o el
   panel: publicar (`fotos`) y, desde la 0.14.0, actualizar la tienda
   (`montaje` con la semilla). El mismo permiso —GITHUB_TOKEN, Actions: Read
   and write sobre el repositorio de la tienda— sirve para los dos. */
function dispararFlujo(archivo, entradas, quien) {
  var g = repositorioYPermiso();
  if (!g.repoOk) return { ok: false, falta: 'repositorio', repo: g.repo };
  if (!g.tk) return { ok: false, falta: 'permiso', repo: g.repo };
  var res;
  var cuerpo = { ref: 'main' };
  if (entradas) cuerpo.inputs = entradas;
  try {
    res = UrlFetchApp.fetch(
      'https://api.github.com/repos/' + g.repo + '/actions/workflows/' + archivo + '/dispatches',
      { method: 'post', contentType: 'application/json', headers: cabecerasGitHub(g.tk),
        payload: JSON.stringify(cuerpo), muteHttpExceptions: true });
  } catch (e) {
    anotarError(quien + ' no pudo hablar con GitHub', e.message);
    return { ok: false, porQue: 'No pude hablar con GitHub: ' + e.message };
  }
  var codigo = res.getResponseCode();
  if (codigo === 204) return { ok: true, codigo: 204 };
  /* 0.20.1 · EL 404 DE GITHUB MIENTE A PROPÓSITO (bitácora 87). Cuando un
     token de grano fino no alcanza a ver un repositorio, GitHub contesta 404 y
     no 403: no confirma que exista. El mensaje decía «no encuentro el
     repositorio, o el permiso no lo incluye» y mandaba a revisar el nombre,
     que casi siempre está bien. La causa de verdad es otra, y tiene nombre: el
     token se creó sobre «Only select repositories» ANTES de que esta tienda
     existiera, así que no la incluye — el alta crea repositorios nuevos, y un
     token de lista fija envejece con cada tienda. */
  var porQue =
    codigo === 401 ? 'El permiso de esta tienda no sirve o se venció. Haz uno nuevo ' +
                     '(de grano fino, sobre TODOS los repositorios del dueño, solo Actions: ' +
                     'Read and write), cámbialo en el secreto `DISPARO_TOKEN` de `tiendas` y ' +
                     'vuelve a correr `conectar`: desde la 0.20.2 el vencido se reemplaza solo.' :
    codigo === 403 ? 'El permiso existe pero no alcanza. Le falta Actions: Read and write.' :
    codigo === 404 ? 'El permiso de esta tienda no alcanza a ver ' + g.repo + '. ' +
                     'Casi siempre es que el token se hizo sobre «Only select repositories» ' +
                     'y esta tienda es posterior: hazlo sobre TODOS los repositorios del ' +
                     'dueño (solo Actions: Read and write) y vuelve a correr `conectar`. ' +
                     'Si el repositorio de verdad no existe o se renombró, corrígelo en ' +
                     'Configuración › repositorio.' :
    codigo === 422 ? 'GitHub aceptó la petición pero no encontró la rama main.' :
                     'GitHub contestó ' + codigo + '.';
  anotarError(quien + ' falló con ' + codigo, String(res.getContentText()).slice(0, 200));
  return { ok: false, codigo: codigo, porQue: porQue };
}

/* La última corrida del flujo, tal como la ve GitHub. Sin repositorio o sin
   permiso no hay nada que preguntar, y se dice. */
function ultimaCorrida(archivo) {
  var g = repositorioYPermiso();
  if (!g.repoOk || !g.tk) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.github.com/repos/' + g.repo +
      '/actions/workflows/' + (archivo || 'fotos.yml') + '/runs?per_page=1&event=workflow_dispatch',
      { headers: cabecerasGitHub(g.tk), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { error: 'GitHub contestó ' + res.getResponseCode() };
    var r = (JSON.parse(res.getContentText()).workflow_runs || [])[0];
    if (!r) return { ninguna: true };
    return { estado: r.status, resultado: r.conclusion || '', desde: r.created_at || '',
             hasta: r.updated_at || '', enlace: r.html_url || '' };
  } catch (e) { return { error: e.message }; }
}

function atenderPublicacion() {
  var pub = catalogoPublicado();
  var servido = pub.ok ? String(pub.datos.generado || '') : '';
  var edicion = String(propiedades().getProperty('ULTIMA_EDICION') || '');
  var pedida = String(propiedades().getProperty('PEDIDA_PUBLICACION') || '');
  var g = repositorioYPermiso();
  return {
    ok: true,
    servido: servido,
    /* Solo se puede afirmar que hay cambios si se sabe qué está sirviendo la
       tienda. Sin eso, el panel dice que no lo sabe — no que no los hay. */
    pendientes: servido && edicion ? Date.parse(edicion) > Date.parse(servido) : null,
    ultimaEdicion: edicion,
    pedida: pedida,
    corrida: ultimaCorrida(),
    puede: g.repoOk && !!g.tk,
    falta: !g.repoOk ? 'repositorio' : !g.tk ? 'permiso' : ''
  };
}

/* Con número de operación, como toda escritura: un doble toque en el botón,
   o un reintento sin señal, dispara UNA publicación. Dos corridas del mismo
   flujo a la vez no se pisan —el flujo tiene su propia cola—, pero cuestan el
   doble de minutos. */
function atenderPublicar(p) {
  var r = conOperacion(p, function () {
    var d = dispararPublicacion();
    if (d.ok) return { ok: true, pedida: new Date().toISOString(),
                       _registro: [{ que: 'Pidió publicar la tienda', donde: 'Tienda', antes: '', despues: '' }] };
    if (d.falta === 'repositorio') return { ok: false, error: 'Todavía no está dicho dónde vive la tienda (Configuración › repositorio). Eso lo hace quien la montó.' };
    if (d.falta === 'permiso') return { ok: false, error: 'Falta el permiso para publicar (GITHUB_TOKEN). Eso lo pone una vez quien montó la tienda.' };
    return { ok: false, error: 'No se pudo publicar. ' + d.porQue };
  });
  return r;
}

/* ══════════════════════════════════════════════════════════════════════════
   0.14.0 · LA TIENDA SE ACTUALIZA SOLA, CUANDO EL DUEÑO LO PIDE
   --------------------------------------------------------------------------
   «Actualizar la tienda» (panel y menú de la hoja) dispara el flujo `montaje`
   de ESTA tienda con `semilla: true`: trae la última versión publicada de su
   semilla, publica el maestro, rehornea desde la hoja, corre TODAS las
   baterías y solo entonces publica en main. Si algo falla después de publicar
   el maestro, lo vuelve atrás solo. Lo mismo que hace la flota desde el
   repositorio de servicio, pedido desde aquí.

   Qué versión es esta tienda: VERSION_TIENDA, que una batería obliga a ser la
   del package.json. Cuál es la última: las etiquetas de la semilla en GitHub,
   con el mismo permiso; si el permiso no alcanza al repositorio de la semilla,
   se dice «no lo sé», no «estás al día».
   ══════════════════════════════════════════════════════════════════════════ */
var VERSION_TIENDA = '0.22.1';
var SEMILLA_REPO = 'laboratoriodigital/tienda';

function versionMayor(a, b) {
  var x = String(a || '').replace(/^v/, '').split('.').map(Number);
  var y = String(b || '').replace(/^v/, '').split('.').map(Number);
  if (x.length !== 3 || y.length !== 3 || x.concat(y).some(isNaN)) return null;
  for (var i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

function ultimaDeLaSemilla() {
  var g = repositorioYPermiso();
  if (!g.tk) return { error: 'sin permiso' };
  if (g.repo === SEMILLA_REPO) return { esSemilla: true };
  try {
    var res = UrlFetchApp.fetch('https://api.github.com/repos/' + SEMILLA_REPO + '/tags?per_page=100',
      { headers: cabecerasGitHub(g.tk), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { error: 'GitHub contestó ' + res.getResponseCode() };
    var mejor = '';
    (JSON.parse(res.getContentText()) || []).forEach(function (t) {
      var n = String(t && t.name || '');
      if (!/^v\d+\.\d+\.\d+$/.test(n)) return;
      if (!mejor || versionMayor(n, mejor)) mejor = n;
    });
    return { ultima: mejor.replace(/^v/, '') };
  } catch (e) { return { error: e.message }; }
}

function atenderActualizacion() {
  var g = repositorioYPermiso();
  var u = ultimaDeLaSemilla();
  return { ok: true, version: VERSION_TIENDA, semilla: SEMILLA_REPO,
           ultima: u.ultima || '', esSemilla: !!u.esSemilla,
           hayNueva: u.ultima ? versionMayor(u.ultima, VERSION_TIENDA) : null,
           porQue: u.error || '',
           corrida: ultimaCorrida('montaje.yml'),
           puede: g.repoOk && !!g.tk, falta: !g.repoOk ? 'repositorio' : !g.tk ? 'permiso' : '' };
}

/* 0.16.0 · 3.4 · SEMBRAR EL PERMISO DE GITHUB DESDE FUERA.
   Publicar y Actualizar desde el panel o el menú necesitan GITHUB_TOKEN en las
   propiedades del script, y era el último paso a mano del alta (después de
   CLASPRC, que es de Google y no se puede). `conectar` lo trae desde el
   repositorio de servicio. NO PISA uno que ya esté puesto —puede ser uno más
   acotado que alguien hizo a propósito— salvo que se pida `forzar`. Solo se
   acepta algo con forma de token de GitHub, y del token solo se dice si quedó. */
/* 0.20.2 · UN PERMISO MUERTO NO SE RESPETA (bitácora 89). «No pisa uno ya
   puesto» era la regla correcta para no quitarle a una tienda un token bueno
   que alguien puso a mano. Pero el día que se rota `DISPARO_TOKEN` —porque
   venció, o porque el anterior no alcanzaba a las tiendas nuevas— volver a
   correr `conectar` no servía de nada: la tienda se quedaba con el viejo y
   seguía contestando «el permiso no sirve o se venció», que es exactamente el
   síntoma que se estaba intentando curar.

   Ahora, antes de respetarlo, se COMPRUEBA: se le pregunta a GitHub con el
   token que ya está. Si contesta, se respeta; si no —401, 403, 404 o ni
   siquiera contesta—, el que llega lo reemplaza. Un token que no abre la
   puerta no es un token que haya que cuidar.

   0.21.0 · Y SE PREGUNTA POR LA PUERTA QUE HAY QUE ABRIR (bitácora 97). La
   pregunta era `GET /repos/{tienda}`, que solo demuestra *Metadata: read*: un
   token que ve el repositorio y no puede disparar nada pasaba la prueba, se
   respetaba, y el comercio seguía viendo «el permiso no sirve o se venció» cada
   vez que tocaba Publicar —con `conectar` diciendo que no hacía falta tocar
   nada—. Lo que este token tiene que poder hacer es disparar flujos, así que se
   pregunta por los FLUJOS: eso ya exige *Actions*, que es el permiso del que
   depende el botón. Sigue sin probar la escritura —solo dispararlo la prueba,
   y disparar por probar no es gratis—, pero descarta el caso que nos costó una
   tarde. */
function permisoGuardadoSirve() {
  var g = repositorioYPermiso();
  if (!g.tk) return false;
  if (!g.repoOk) return true;   /* sin repositorio escrito no se puede juzgar: no se toca */
  try {
    var res = UrlFetchApp.fetch('https://api.github.com/repos/' + g.repo + '/actions/workflows',
      { method: 'get', headers: cabecerasGitHub(g.tk), muteHttpExceptions: true });
    return res.getResponseCode() === 200;
  } catch (e) { return false; }
}

function atenderPermiso(p) {
  var tk = String(p.tk || '').trim();
  if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(tk)) return { ok: false, error: 'Eso no parece un token de GitHub.' };
  var props = propiedades();
  var habia = String(props.getProperty('GITHUB_TOKEN') || '');
  var forzado = String(p.forzar || '') === 'si';
  if (habia && habia === tk) return { ok: true, puesto: false, yaEstaba: true, mismo: true };
  var servia = habia ? permisoGuardadoSirve() : false;
  if (habia && servia && !forzado) return { ok: true, puesto: false, yaEstaba: true, servia: true };
  props.setProperty('GITHUB_TOKEN', tk);
  anotarSeguridad('Permiso de GitHub puesto desde el alta (conectar).',
    !habia ? 'no había ninguno' : (forzado ? 'se forzó el reemplazo' : 'el anterior ya no servía'));
  return { ok: true, puesto: true, yaEstaba: !!habia, servia: servia, reemplazado: !!habia };
}

function dispararActualizacion() {
  return dispararFlujo('montaje.yml', { semilla: 'true', que: 'todo' }, 'Actualizar la tienda');
}

function atenderActualizar(p) {
  return conOperacion(p, function () {
    var d = dispararActualizacion();
    if (d.ok) return { ok: true, pedida: new Date().toISOString(),
                       _registro: [{ que: 'Pidió actualizar la tienda a la última versión', donde: 'Tienda',
                                     antes: VERSION_TIENDA, despues: '' }] };
    if (d.falta === 'repositorio') return { ok: false, error: 'Todavía no está dicho dónde vive la tienda (Configuración › repositorio).' };
    if (d.falta === 'permiso') return { ok: false, error: 'Falta el permiso (GITHUB_TOKEN). Eso lo pone una vez quien montó la tienda.' };
    return { ok: false, error: 'No se pudo pedir la actualización. ' + d.porQue };
  });
}

var VERSION = '2026-09-22-8';

/* Antes esto era getActiveSpreadsheet(): el script vivía dentro de la hoja.
   Ahora abre la del cliente por su ID, y esa es toda la diferencia. */
function elLibro() {
  if (!HOJA_ID) {
    throw new Error(
      'Falta HOJA_ID. Ábrela en Google Sheets, copia lo que va entre /d/ y ' +
      '/edit en la URL, pégalo arriba en la constante HOJA_ID y ejecuta A0_instalar. ' +
      'Si ya estaba pegado: la versión IMPLEMENTADA es anterior; Implementar › ' +
      'Gestionar implementaciones › lápiz › Versión: Nueva versión.');
  }
  return SpreadsheetApp.openById(HOJA_ID);
}

var H_TABLERO      = 'Tablero';
var H_CONFIG       = 'Configuración';
var H_CATALOGO     = 'Catálogo';
var H_ENVIOS       = 'Envíos';
var H_CUPONES      = 'Cupones';
var H_VALIDACIONES = 'Validaciones';
var H_PEDIDOS      = 'Pedidos';
var H_RESUMEN      = 'Más vendidos';
var H_ERRORES      = 'Errores';

/* Las columnas del catálogo. Para AGREGAR UN PRODUCTO NUEVO basta con llenar
   una fila aquí: no hay que tocar index.html. Las fotos van todas en la misma
   celda, separadas por una barra vertical:

     https://res.cloudinary.com/tu-cuenta/image/upload/v1/producto-1.jpg|https://res.cloudinary.com/tu-cuenta/image/upload/v1/producto-2.jpg

   Pega la URL tal como te la da Cloudinary. La tienda le inyecta sola las
   transformaciones (f_auto,q_auto para que pesen menos, c_fill,ar_1:1 para
   que queden cuadradas y w_ para pedir el tamaño justo de cada lugar). */
/* Las tres últimas se agregaron después, al final y opcionales (R1 y R3 del
   contrato): Referencia es el código interno del comercio —el que usa en su
   inventario o con su proveedor—, Precio antes es el tachado de una promoción,
   y Umbral bajo es a partir de cuántas unidades avisar «quedan pocas». Vacías
   no cambian nada, que es la condición para poder agregarlas sin migrar N
   hojas el mismo día. */
var ENCABEZADO_CATALOGO = ['ID', 'Nombre', 'Formato', 'Categoría', 'Precio', 'Stock',
                           'Descripción', 'Imágenes', 'Destacado', 'Activo',
                           'Referencia', 'Precio antes', 'Umbral bajo',
                           /* C-1: al final y opcional, como manda R1 del
                              contrato. El maestro lee por POSICIÓN, así que una
                              columna en medio descuadra todo en silencio. */
                           'Variantes'];

/* La última columna, Inventario, la escribe el script solo. Dice si el stock de
   esa línea ya se descontó del catálogo. Existe para que confirmar un pedido dos
   veces, o deshacer el cambio, no descuadre el inventario. No la edites a mano. */
/* Las tres últimas las llena el comerciante a mano, después de la venta: cuándo
   le pagaron, cuándo despachó y con qué guía. Hoy eso vive en su cabeza o en el
   chat. Van al final y vacías no molestan a nadie. */
var ENCABEZADO_PEDIDOS = ['Fecha', 'Pedido', 'Validación', 'Estado', 'Ciudad', 'Cupón',
                          'Producto', 'ID', 'Cantidad', 'Precio unitario',
                          'Subtotal línea', 'Total del pedido', 'Inventario',
                          'Fecha de pago', 'Fecha de despacho', 'Guía',
                          /* C-1: qué eligió el comprador. Al final, opcional, y
                             vacía en los pedidos sin variantes. */
                          'Variante',
                          /* M3.5: los pedidos que se cobraron en línea. Al
                             final, opcionales, y vacías en los de WhatsApp. */
                          'Proveedor de pago', 'Referencia de pago', 'Transacción de pago',
                          /* M5: la huella del enlace de seguimiento. La HUELLA,
                             no el enlace: con esta columna a la vista nadie
                             puede armar el enlace de otro. Vacía en los pedidos
                             de antes de M5 y con el rastreo apagado. */
                          'Seguimiento'];

/* La columna Pedido de Validaciones es el MISMO número que el de Pedidos. Un
   solo identificador para todo: el que llega en el mensaje de WhatsApp. */
/* La última columna, Avisos, guarda lo que el maestro le dijo al comprador
   —envío no reconocido, stock justo, una celda que no se pudo leer—. Sin ella
   el acta no distingue «eligió una zona de envío sin costo» de «la hoja no reconoció el
   envío y avisó»: las dos dejan el envío en 0. Un acta que no guarda las
   advertencias no es un acta, es un recibo. Va al final: R1 del contrato. */
var ENCABEZADO_VALIDACIONES = ['Fecha', 'Pedido', 'Cupón', 'Subtotal según la hoja',
                               'Subtotal según la página', 'Discrepancia', 'Descuento',
                               'Envío', 'Total según la hoja', 'Detalle', 'Avisos'];
var COL_ESTADO     = 4;    // columna D de Pedidos
var COL_INVENTARIO = 13;   // columna M de Pedidos
var COL_STOCK      = 6;    // columna F de Catálogo

var MAX_CUERPO   = 4000;
var MAX_ITEMS    = 30;
var MAX_TEXTO    = 60;
/* Lo que escribe el maestro en el acta —discrepancias y avisos— no cabe en 60. */
var MAX_ACTA     = 400;
var MAX_CANTIDAD = 200;
var MAX_TOTAL    = 5000000;
var MAX_FILAS    = 20000;

/* ==========================================================================
   EMPIEZA POR AQUÍ
   --------------------------------------------------------------------------
   instalar() va de primera A PROPÓSITO. El desplegable de funciones de Apps
   Script elige sola la PRIMERA función del archivo, así que al darle Ejecutar
   corre esa y no otra. Si estuviera más abajo, correrías la que quedó de
   primera, que se completa sin errores y sin hacer nada visible.

   ESTE COMENTARIO DEJÓ DE SER VERDAD Y NADIE SE ENTERÓ. Decía «esta función va
   arriba del todo» y hacía tiempo que la primera del archivo era `token()`.
   Sin daño —ejecutarla no hace nada malo— pero era una propiedad de seguridad
   escrita y no comprobada, que es como se pierden. Ahora la primera es
   `A0_instalar`, que llama aquí, y hay una aserción que lo vigila.

   Ejecútala UNA VEZ después de pegar el archivo.
   Si algo no cuadra después, ejecuta A2_diagnostico().
   ========================================================================== */

function instalar() {
  var libro = elLibro();
  if (!libro) {
    throw new Error(
      'Este script NO está unido a ninguna hoja de cálculo: se creó como ' +
      'proyecto suelto. Abre tu hoja de Google, entra por Extensiones > Apps ' +
      'Script y pega el código ALLÍ. Ese proyecto sí queda unido a la hoja.');
  }
  console.log('Instalando en la hoja: ' + libro.getName());
  /* 0.17.0 · el ID queda también en las propiedades (ver arriba, HOJA_ID). */
  try { propiedades().setProperty('HOJA_ID', String(HOJA_ID)); } catch (e) { }
  var cat = hoja(H_CATALOGO, ENCABEZADO_CATALOGO);
  asegurarColumnas(H_CATALOGO, ENCABEZADO_CATALOGO);   // hojas viejas: agrega lo que falte
  if (cat.getLastRow() < 2) {
    /* Dos filas de EJEMPLO, no un catálogo de otro comercio. Activo = No: se
       ven en la hoja para que el comerciante entienda el formato, pero no en
       la tienda hasta que él las active o —mejor— las reemplace por las
       suyas. diagnostico() avisa mientras quede alguna EJEMPLO activa. */
    cat.getRange(2, 1, 2, 10).setValues([
      ['ejemplo1','Producto de ejemplo — edítalo o bórralo','Unidad','Ejemplos',19900,10,
       'Así se ve una ficha completa: nombre, formato, categoría, precio, stock y esta descripción. Cámbiala por tu primer producto, o bórrala.','','No','No'],
      ['ejemplo2','Segundo producto de ejemplo — edítalo o bórralo','Unidad','Ejemplos',29900,5,
       'Un segundo ejemplo, para ver cómo se ve el catálogo con más de un producto. Cámbiala por tu segundo producto, o bórrala.','','No','No']
    ]);
    cat.setColumnWidth(7, 380);   // Descripción
    cat.setColumnWidth(8, 380);   // Imágenes
    cat.getRange(2, 7, 2, 2).setWrap(true);
  }

  var cfg = hoja(H_CONFIG, ['Clave', 'Valor', 'Qué es']);
  // La semilla vive FUERA del if: la usan las dos ramas, la instalación nueva
  // para llenar la hoja y la existente para agregarle las claves que le falten.
  var semilla = semillaDeConfiguracion();
  if (cfg.getLastRow() < 2) {
    cfg.getRange(2, 1, semilla.length, 3).setValues(semilla);
    cfg.setColumnWidth(2, 420); cfg.setColumnWidth(3, 380);
    cfg.getRange(2, 2, semilla.length, 2).setWrap(true);
  } else {
    // Hoja que ya existía: le agregamos las claves nuevas SIN tocar sus valores.
    // Sin esto, quien instaló antes nunca vería una opción nueva.
    var nuevas = agregarClavesQueFaltan(cfg, semilla);
    if (nuevas) console.log('Claves de configuración agregadas: ' + nuevas.join(', '));
  }

  var env = hoja(H_ENVIOS, ['ID', 'Nombre', 'Valor']);
  if (env.getLastRow() < 2) {
    // Una zona de EJEMPLO, con Valor 0 (recogida sin costo) para que se vea
    // el caso especial: la tienda no pide dirección cuando el envío es $0.
    env.getRange(2, 1, 1, 3).setValues([
      ['ejemplo', 'Recoger sin costo — ejemplo, edítalo o bórralo', 0]
    ]);
  }

  var cup = hoja(H_CUPONES, ['Código', 'Tipo', 'Valor', 'Mínimo', 'Vence',
                             'Usos máximos', 'Usos confirmados', 'Activo', 'Notas']);
  if (cup.getLastRow() < 2) {
    cup.getRange(2, 1, 3, 9).setValues([
      ['BIENVENIDA10', 'porcentaje', 10,   50000, '2026-12-31', 0, 0, 'Sí', 'General. 0 usos máximos = sin tope.'],
      ['PRIMERA5000', 'fijo',       5000, 40000, '2026-12-31', 0, 0, 'Sí', 'Primera compra.'],
      ['ENVIOGRATIS', 'envio',      0,   120000, '2026-10-31', 0, 0, 'Sí', 'Envío sin costo.']
    ]);
  }

  hoja(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
  // Si la hoja venía de la versión anterior, corregimos el encabezado.
  elLibro().getSheetByName(H_VALIDACIONES)
    .getRange(1, 1, 1, ENCABEZADO_VALIDACIONES.length)
    .setValues([ENCABEZADO_VALIDACIONES]).setFontWeight('bold');
  hoja(H_PEDIDOS, ENCABEZADO_PEDIDOS);
  asegurarColumnas(H_PEDIDOS, ENCABEZADO_PEDIDOS);   // hojas viejas: agrega lo que falte
  hoja(H_RESUMEN, ['Producto', 'ID', 'Unidades vendidas', 'Ingresos', 'Pedidos en que aparece']);
  hoja(H_TABLERO, ['Indicador', 'Valor', 'Comparación']);
  hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
  /* M3.5. Existen siempre, aunque la tienda venda por WhatsApp: pasar a
     Pasarela no puede exigir volver a instalar. */
  hoja(H_PAGOS, ENCABEZADO_PAGOS);
  asegurarColumnas(H_PAGOS, ENCABEZADO_PAGOS);
  hoja(H_ENTREGAS, ENCABEZADO_ENTREGAS);
  /* D-6. Se crea y se protege con aviso aquí, que es cuando alguien mira. */
  hoja(H_REGISTRO, ENCABEZADO_REGISTRO);
  protegerRegistro();
  /* C-1b. La pestaña existe siempre, y se llenan las filas de lo que ya tenga
     Variantes. Con el stock vacío: nada cambia hasta que alguien lo llene. */
  hoja(H_INVENTARIO_VARIANTE, ENCABEZADO_INVENTARIO_VARIANTE);
  /* 0.11.0 · 4.1. Cuántos esperan cada producto agotado. Sin datos de nadie. */
  hoja(H_AVISAME, ENCABEZADO_AVISAME);
  var sync = sincronizarVariantes();
  if (sync.nuevas) console.log('Inventario por variante: ' + sync.nuevas + ' combinación(es) nuevas, con el stock vacío para que lo llenes.');

  var cuantas = Object.keys(leerConfiguracion()).length;
  console.log('Configuración: ' + cuantas + ' claves.');

  presentarHojas();
  console.log('Hojas con formato, listas desplegables y colores sincronizados.');

  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'recalcularResumen' || f === 'revisionHoraria' || f === 'alEditar') ScriptApp.deleteTrigger(t);
  });
  /* Cada hora: el resumen, y antes los pagos en línea que sigan abiertos —la
     red de seguridad del disparador de cinco minutos—. */
  ScriptApp.newTrigger('revisionHoraria').timeBased().everyHours(1).create();
  // forSpreadsheet(ID) y no forSpreadsheet(objeto): este proyecto no está unido
  // a la hoja, la alcanza por su identificador.
  ScriptApp.newTrigger('alEditar').forSpreadsheet(HOJA_ID).onEdit().create();

  /* El respaldo va de madrugada y un solo día: es una copia entera de la hoja
     y no tiene por qué competir con el tráfico del comercio. */
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'respaldoSemanal') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('respaldoSemanal')
    .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();

  /* LOS DOS TOKENS SE CREAN AQUÍ, aunque nadie los pida todavía.
     Los dos se inventan solos la primera vez que alguien los llama, y eso
     bastaba cuando había uno. Con dos, dejarlo a la casualidad significa que
     el de montaje no existe hasta que llegue la primera petición del flujo —y
     el que monta la tienda necesita leerlo ANTES, para ponerlo en el secreto
     del repositorio. Materializarlos aquí quita esa carrera. */
  token();
  tokenMenu();

  /* LOS ESTADOS VIEJOS SE MIGRAN AQUÍ, y se dice cuántos. Instalar es el único
     momento en que se sabe que alguien está mirando el registro de ejecución.
     Es idempotente: la segunda vez no encuentra nada que cambiar. */
  var migrados = migrarEstados();
  if (migrados) {
    console.log('Estados migrados al vocabulario nuevo: ' + migrados + ' celda(s).');
    console.log('  Por confirmar → Nuevo · Confirmado → Pagado · Anulado → Cancelado');
  }

  // El toast sale en la hoja, no en el editor. Esto sí se ve en el
  // Registro de ejecución, que es donde estás mirando en este momento.
  console.log('LISTO. Pestañas de la hoja: ' +
    libro.getSheets().map(function (h) { return h.getName(); }).join(', '));
  console.log('Productos cargados: ' +
    Math.max(0, libro.getSheetByName(H_CATALOGO).getLastRow() - 1));
  /* EL CÓDIGO DE LA HOJA YA NO SE IMPRIME AQUÍ. Salía entero, doscientas
     líneas, cada vez que se instalaba —también al reinstalar para agregar una
     clave nueva, que es lo más común—, y enterraba el resumen de arriba, que
     es lo que de verdad hay que leer. Además era la forma segura de pegar un
     stub viejo: el que salía antes de publicar el maestro nuevo. Tiene su
     propia función y su propio momento (DESPLIEGUE, paso 12). */
  var url = urlLista();
  console.log('');
  if (url) {
    console.log('El menú de la hoja: si cambió (opciones nuevas, otro nombre del comercio), ' +
                'ejecuta A1_generarStub() y pega lo que imprima en la hoja.');
  } else {
    console.log('Siguiente paso: Implementar > Nueva implementación > Aplicación web.');
    console.log('Después ejecuta A1_generarStub() y pega lo que imprima en la hoja.');
  }
}

/* ==========================================================================
   GENERADOR DEL BLOQUE DE CONFIGURACIÓN
   --------------------------------------------------------------------------
   Ejecuta esto y copia del Registro de ejecución el bloque que imprime, pegándolo
   en index.html entre las marcas CONFIGURACIÓN DE ESTA TIENDA. Es lo único que
   hay que tocar del archivo para montar una tienda nueva.

   Existe porque el título, la descripción y las etiquetas Open Graph tienen que
   ser HTML estático: WhatsApp y Google leen la página sin ejecutar JavaScript,
   así que esas no se pueden sacar de la hoja en caliente.
   ========================================================================== */
/* UNA DIRECCIÓN SIN https:// NO ES UNA DIRECCIÓN, ES UNA RUTA RELATIVA.
   El comerciante escribe en la hoja `mitienda.workers.dev`, que es lo natural,
   y así salía tal cual al <link rel="canonical">, al og:url y al og:image. Un
   navegador resuelve `href="mitienda.workers.dev/"` contra la página actual:
   el canónico apunta a mitienda.workers.dev/mitienda.workers.dev/, que no
   existe, y la imagen de la tarjeta al compartir no carga nunca.

   No rompe nada visible —la tienda se ve igual, el pedido llega igual— y por
   eso llevaba publicado sin que nadie lo notara. Se corrige aquí, que es el
   único sitio donde se arma el <head>, y así lo reciben las tres de una vez. */
function conEsquema(u) {
  var s = String(u || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
}

/* 0.19.0 · MEDIR, DE LA MANERA MÁS SENCILLA QUE HAY (decisión 23).
   ---------------------------------------------------------------------------
   Una clave en la hoja —`analytics_id`— y el fragmento oficial de Google
   horneado en el <head>. Ni etiquetas de terceros, ni gestor de etiquetas, ni
   un archivo más que cargar: la tienda pide un script a Google y nada más.

   VACÍO ES EL VALOR DE FÁBRICA, y significa exactamente nada: sin script, sin
   cookies, sin conexiones a Google, y la política de seguridad de esa tienda
   ni siquiera nombra a googletagmanager.com. Una tienda que no mide no tiene
   que explicar que mide.

   Y LA COSTURA PARA EL MEDIDOR PROPIO: la página no llama a `gtag` por ahí
   suelto. Llama a `medir(evento, datos)`, que hoy se lo pasa a Google si está
   y se calla si no. El día que tengamos nuestro propio recolector, se le suma
   una línea a ESA función y los puntos de medida ya están puestos. */
var ANALITICA_VALIDA = /^G-[A-Z0-9]{4,20}$/i;

function idDeAnalitica(c) {
  var v = String((c || {}).analytics_id || '').trim();
  return ANALITICA_VALIDA.test(v) ? v.toUpperCase() : '';
}

/* Los hosts que hacen falta para GA4, y solo cuando se mide:
     www.googletagmanager.com   el script (script-src) y su pixel (img-src)
     *.google-analytics.com     donde se manda la medida (connect-src, img-src)
     *.analytics.google.com     la señal de Google Signals, si se enciende allá */
function cspDeAnalitica(id) {
  if (!id) return { script: '', conecta: '', imagen: '' };
  return { script: ' https://www.googletagmanager.com',
           conecta: ' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com',
           imagen: ' https://*.google-analytics.com https://www.googletagmanager.com' };
}

/* El fragmento oficial, escrito una sola vez. `anonymize_ip` no existe en GA4
   —las IP se anonimizan siempre—, así que no se escribe: una opción que no
   hace nada es una promesa que nadie puede comprobar. */
function bloqueDeAnalitica(id) {
  if (!id) return [];
  return [
    '<!-- Medición: Google Analytics 4. La enciende la clave analytics_id de la hoja. -->',
    '<script async src="https://www.googletagmanager.com/gtag/js?id=' + id + '"></script>',
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}' +
      "gtag('js',new Date());gtag('config','" + id + "');</script>"
  ];
}

function generarConfiguracion() {
  var c = leerConfiguracion();
  var url = conEsquema(c.sitio_url).replace(/\/+$/, '') + '/';
  /* Todo lo que sale de la hoja va escapado entero, no solo las comillas: un
     nombre con & producía HTML inválido, y un < abría la puerta a que el texto
     del dueño se leyera como etiqueta. El icono NO pasa por aquí: es un SVG
     que tiene que llegar tal cual. */
  var v = function (k, alterna) { return escaparHtml(c[k] || alterna || ''); };
  var icono = iconoDeLaTienda(c);

  var hosts = hostsDeFotos(c, url);
  /* checkout.bold.co: la librería de la pasarela (M3.5). Va SIEMPRE, también
     en una tienda que vende por WhatsApp: la política se hornea en el archivo
     y cambiar de modo en la hoja no puede exigir volver a hornearla — con la
     pasarela encendida y la política vieja, el botón de pagar no abriría nada
     y el navegador ni siquiera lo diría en la página. */
  var medicion = idDeAnalitica(c);
  var cspMed = cspDeAnalitica(medicion);
  var csp = "default-src 'none'; script-src 'unsafe-inline' https://checkout.bold.co" + cspMed.script + '; ' +
            /* 0.20.0 · Ya no se carga tipografía de fuera (bitácora 84): la
               página usa la pila del sistema. Un permiso que sobra es una
               puerta abierta sin nadie detrás. */
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:" + (hosts.length ? ' https://' + hosts.join(' https://') : '') + cspMed.imagen + '; ' +
            /* 'self' hace falta desde que la vitrina lee su propio catalogo.json. Sin
               él la petición se bloquea sin decir por qué: la CSP no lanza un error de
               red, simplemente no deja salir, y la página cae al respaldo como si la
               hoja no hubiera contestado. */
            "connect-src 'self' https://script.google.com https://script.googleusercontent.com" + cspMed.conecta + '; ' +
            "form-action 'none'; base-uri 'none'";

  var bloque = [
    '<meta http-equiv="Content-Security-Policy" content="' + csp + '">',
    '<!-- ═══ CONFIGURACIÓN DE ESTA TIENDA ═══',
    '     Generado por generarConfiguracion() en el Apps Script.',
    '     No lo edites a mano: cambia la pestaña Configuración y vuelve a generarlo. -->',
    '<title>' + v('sitio_titulo', 'Tienda') + '</title>',
    '<meta name="description" content="' + v('sitio_descripcion') + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + v('negocio') + '">',
    '<meta property="og:locale" content="es_CO">',
    '<meta property="og:title" content="' + v('sitio_titulo') + '">',
    '<meta property="og:description" content="' + v('sitio_descripcion') + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + url + 'compartir.jpg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + v('sitio_titulo') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="canonical" href="' + url + '">',
    '<meta name="theme-color" content="' + (c.color_principal || '#D0211C') + '">',
    '<link rel="icon" href="' + icono + '">',
    '<link rel="apple-touch-icon" href="' + icono + '">'
  ].concat(bloqueDeAnalitica(medicion)).concat([
    '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->'
  ]).join('\n');

  var js = [
    'const SCRIPT_URL     = "' + (urlLista() || 'PEGA_AQUÍ_LA_URL_QUE_TERMINA_EN_/exec') + '";',
    'const SCRIPT_VERSION = "' + VERSION + '";',
    'const FOTOS_HOSTS    = [' +
      hosts.map(function (h) { return '"' + h + '"'; }).join(', ') + '];',
    'let   NEGOCIO        = "' + (c.negocio || 'Tienda') + '";      // respaldo, la hoja manda',
    'let   WHATSAPP       = "' + (c.whatsapp || '') + '";  // respaldo, la hoja manda'
  ].join('\n');

  // Para quien lo ejecute desde el editor de Apps Script.
  console.log('═══ PEGA ESTO EN EL <head> DE index.html ═══\n');
  console.log(bloque);
  console.log('\n\n═══ Y ESTO EN EL BLOQUE DE CONFIGURACIÓN DEL <script> ═══\n');
  console.log(js);
  console.log('\n\nLa URL /exec la pegas tú: es lo único que el script no puede saber.');

  return { tipo: 'html', titulo: 'Configuración para index.html',
           html: ventanaConfiguracion(bloque, js), bloque: bloque, js: js,
           /* Sueltos y sin envolver, para que el montaje pueda reemplazar
              constante por constante en vez de tragarse un bloque entero. */
           valores: {
             SCRIPT_URL:     urlLista(),
             SCRIPT_VERSION: VERSION,
             FOTOS_HOSTS:    hosts,
             NEGOCIO:        String(c.negocio || 'Tienda'),
             WHATSAPP:       String(c.whatsapp || '')
           } };
}

/* Apps Script no tiene el constructor URL del navegador, así que el host se
   saca a mano. Es la clase de detalle que solo se descubre en producción. */
function hostDe(u) {
  var m = String(u || '').replace(/\{[a-z]+\}/g, 'x').match(/^https?:\/\/([^\/?#]+)/i);
  return m ? m[1].toLowerCase() : '';
}

/* Los proveedores de transformación que la política permite SIEMPRE, esté o no
   configurado alguno hoy. Van de antemano para que cambiar de proveedor sea
   cambiar la celda fotos_cdn y nada más: sin volver a generar la configuración,
   sin volver a pegar el <head>, sin republicar. El costo es acotado: son
   orígenes de imagen, no de código, y siguen sin poder ejecutar nada. */
var PROVEEDORES_FOTO = ['res.cloudinary.com', 'ik.imagekit.io', 'imagedelivery.net'];

/* Qué hosts de imagen tiene que permitir la política de seguridad.
   Sale de la hoja: el origen servible y el proveedor de transformación. Si el
   origen es el propio sitio no hace falta listarlo —'self' ya lo cubre—, así
   que la política solo crece cuando de verdad entra un tercero. */
function hostsDeFotos(c, urlSitio) {
  var lista = PROVEEDORES_FOTO.slice(), sitio = hostDe(urlSitio);
  var meter = function (u) {
    var host = hostDe(u);
    if (!host || host === sitio) return;                 // 'self' ya lo permite
    if (lista.indexOf(host) === -1) lista.push(host);
  };
  meter(c.fotos_origen);
  meter(c.fotos_cdn);
  meter(c.logo);
  meter(c.favicon);
  return lista;
}

/* El ícono de la pestaña del navegador.
   Va dibujado dentro del propio HTML (un SVG en la dirección del enlace), no
   como archivo aparte: así no hay que subir ni publicar nada más, pesa 400
   bytes y se ve nítido en cualquier pantalla. Toma los colores de la marca de
   la hoja, así que cada tienda tiene el suyo. Si el dueño prefiere su propio
   ícono, pone la URL en la clave favicon y esa manda. */
function iconoDeLaTienda(c) {
  /* 0.21.0 · EL MISMO ARCHIVO SIRVE DE ICONO (bitácora 98). Quien sube su logo
     casi nunca tiene aparte un cuadrado de 512 para la pestaña, y pedirle dos
     archivos para lo mismo es pedirle que uno de los dos se quede viejo. Si hay
     `favicon`, manda; si no, se usa el logo; si tampoco, el marcador dibujado.
     Un nombre de archivo se sirve de la carpeta de fotos de la propia tienda:
     una ruta relativa vale en un <link rel="icon"> y no mete un host más en la
     política de seguridad. */
  var propio = String(c.favicon || '').trim() || String(c.logo || '').trim();
  if (propio) return /^https?:\/\//i.test(propio) ? propio : 'fotos/' + propio.replace(/^\/+/, '');
  var rojo  = c.color_principal  || '#D0211C';
  var verde = c.color_secundario || '#1B5E3A';
  var svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>" +
    "<circle cx='32' cy='40' r='23' fill='" + rojo + "'/>" +
    "<path d='M32 17V7' stroke='" + verde + "' stroke-width='5.5' stroke-linecap='round'/>" +
    "<path d='M32 18c-5-6-13-5-16-2 3 4 9 6 14 4 5 3 11 2 15-3-3-3-10-4-13 1z' fill='" + verde + "'/>" +
    "</svg>";
  return 'data:image/svg+xml,' + svg
    .replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, '%22');
}

function ventanaConfiguracion(bloque, js) {
  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var titulo = 'margin:22px 0 4px;font:600 13px/1.4 Arial,sans-serif;color:#111';
  var nota = 'margin:0 0 8px;font:400 12px/1.5 Arial,sans-serif;color:#666';
  var boton = 'margin-top:6px;padding:7px 14px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    '<p style="' + nota + ';margin-top:0">Esto se pega en <b>index.html</b>. Son dos bloques.</p>' +

    '<p style="' + titulo + '">1. En el &lt;head&gt;</p>' +
    '<p style="' + nota + '">Reemplaza todo lo que hay entre las marcas ' +
    '<code>CONFIGURACIÓN DE ESTA TIENDA</code> y <code>FIN DE LA CONFIGURACIÓN</code>, marcas incluidas.</p>' +
    '<textarea id="a" rows="12" style="' + caja + '" readonly>' + escaparHtml(bloque) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar(\'a\', this)">Copiar el bloque del head</button>' +

    '<p style="' + titulo + '">2. En el bloque de configuración del &lt;script&gt;</p>' +
    '<p style="' + nota + '">Reemplaza esas líneas. ' + (urlLista()
      ? 'Ya llevan la URL de tu servicio: no hay nada que rellenar.'
      : '<b style="color:#B3261E">Falta publicar el proyecto</b> (Implementar &gt; Nueva ' +
        'implementación &gt; Aplicación web), y por eso la URL sale en blanco. ' +
        'Publica y vuelve a generar.') + '</p>' +
    '<textarea id="b" rows="5" style="' + caja + '" readonly>' + escaparHtml(js) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar(\'b\', this)">Copiar el bloque del script</button>' +

    '<p style="' + nota + ';margin-top:22px">Después de pegarlos, vuelve a publicar el sitio. ' +
    'Los precios, el catálogo y los textos NO necesitan esto: esos ya salen de la hoja en caliente. ' +
    'Este bloque es solo para el título y la vista previa al compartir, que tienen que ser HTML fijo ' +
    'porque WhatsApp y Google no ejecutan JavaScript.</p>' +

    '<script>function copiar(id, b){var t=document.getElementById(id);' +
    't.select();t.setSelectionRange(0,999999);' +
    'try{document.execCommand("copy");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent=b.dataset.o||"Copiar";},1800);}catch(e){}}' +
    'document.querySelectorAll("button").forEach(function(b){b.dataset.o=b.textContent;});<\/script>' +
    '</div>';

  return html;
}

/* ==========================================================================
   Si algo no funciona, ejecuta esto y lee el Registro de ejecución.
   ========================================================================== */
/* MailApp.getRemainingDailyQuota() cobra una llamada y puede fallar si el
   permiso de correo todavía no está dado. Nunca debe tumbar el panel. */
function cuotaDeCorreo() {
  try { return MailApp.getRemainingDailyQuota(); } catch (e) { return -1; }
}

/* ==========================================================================
   EL DIAGNÓSTICO, EN NUEVE PUNTOS.
   --------------------------------------------------------------------------
   Antes era una lista de líneas sueltas: verdadera toda, pero sin decir cuál
   de ellas era el problema. Quien la leía tenía que saber ya qué buscar, y
   quien la leía es justamente el que no lo sabe.

   Ahora son nueve puntos numerados, cada uno con un veredicto —OK, REVISAR o
   PROBLEMA— y, cuando hay algo que arreglar, LA CELDA O EL ARCHIVO EXACTO.
   «Hay datos que no se pudieron leer» no se puede accionar; «Catálogo E7 dice
   $9.000» se arregla en diez segundos.

   Sale por partida doble a propósito:
   · `html` es lo que ve el comerciante: los nueve veredictos arriba, el
     detalle debajo y un cuadro que se copia de un tirón.
   · `texto` es el mismo informe en llano. Lo consume `?a=diagnostico` y las
     baterías, y es lo que se pega en un chat.

   Lo que NO va en el cuadro copiable es el token. El cuadro está hecho para
   mandárselo a quien montó la tienda por WhatsApp, y un token que da de alta
   pedidos no debería viajar por ahí de rebote. Para el panel se lee arriba,
   en pantalla, que es donde hace falta.
   ========================================================================== */
/* SEGURO POR DEFECTO: sin argumento, NO enseña el token de montaje.
   El menú llama a esta función sin argumentos —ejecutarAccion() la invoca como
   `fn()`— así que lo que ve el comerciante es la versión sin secretos. El que
   monta la tienda ejecuta `diagnosticoCompleto()` desde el editor del maestro,
   que es un sitio donde el comerciante no entra.

   El valor por defecto es el discreto y no al revés a propósito: si mañana
   alguien añade otra forma de llamar a esto y no se acuerda de este párrafo,
   el fallo es que el operador tenga que ejecutar una función más, no que el
   token de montaje aparezca en la pantalla de un cliente. */
function diagnostico(mostrarSecretos) {
  var linea = [];
  var decir = function (t) { linea.push(t); console.log(t); };
  var puntos = [];                       // {n, titulo, estado}
  var actual = null;
  var punto = function (titulo) {
    actual = { n: puntos.length + 1, titulo: titulo, estado: 'OK' };
    puntos.push(actual);
    decir('');
    decir('── ' + actual.n + ' · ' + titulo.toUpperCase() + ' ──');
  };
  /* Un punto solo empeora, nunca mejora: si una línea ya dijo PROBLEMA, otra
     que diga REVISAR no lo devuelve a la vida. */
  var marcar = function (estado) {
    if (estado === 'PROBLEMA' || actual.estado === 'OK') actual.estado = estado;
  };

  /* La respuesta de la tienda se cachea POR EJECUCIÓN, y un diagnóstico es
     justo cuando no se quiere una respuesta vieja: se descarta al empezar. */
  CATALOGO_PUBLICADO = null;

  var libro;
  try { libro = elLibro(); } catch (e) {
    decir('PROBLEMA: ' + e.message);
    return { tipo: 'aviso', texto: linea.join('\n') };
  }

  // ── 1 ────────────────────────────────────────────────────────────────────
  punto('Versión de este maestro');
  decir('Versión del MAESTRO de esta tienda: ' + VERSION + '   (esquema ' + ESQUEMA + ')');
  decir('Si la tienda dice que la versión no coincide, es que falta hacer');
  decir('Implementar > Gestionar implementaciones > lápiz > Versión: Nueva.');
  decir('Hoja: ' + libro.getName());
  decir('URL:  ' + libro.getUrl());
  /* 0.20.0 · DE DÓNDE SALIÓ LA HOJA. Si la constante llegó vacía y el ID vino
     de las propiedades, esta versión funciona pero la IMPLEMENTADA puede ser
     anterior a la 0.17.0 y no saber hacerlo (bitácora 74). Decirlo aquí es lo
     que evita el «Falta HOJA_ID» de `conectar` con el diagnóstico en verde. */
  if (HOJA_ID_DE_PROPIEDAD) {
    marcar('REVISAR');
    decir('');
    decir('La constante HOJA_ID está VACÍA: el ID se leyó de las propiedades.');
    decir('Funciona, pero solo desde la 0.17.0. Si la tienda o `conectar` dicen');
    decir('«Falta HOJA_ID», publica una versión nueva: Implementar > Gestionar');
    decir('implementaciones > lápiz > Versión: Nueva versión.');
  }

  // ── 2 ────────────────────────────────────────────────────────────────────
  /* VA AQUÍ ARRIBA A PROPÓSITO. Si la tienda no está terminada, todo lo demás
     es ruido: da igual que las nueve pestañas estén bien si el comprador no
     tiene cómo pagar. */
  punto('¿Está terminada esta tienda?');
  var alta = revisarTienda();
  if (alta.bloquean.length) {
    marcar('PROBLEMA');
    /* No empieza por «FALTA» a propósito: esa palabra al principio de línea es
       la que usa el informe para las pestañas que no existen, y una batería la
       busca así. Dos cosas distintas no pueden abrir igual. */
    decir('Sin esto la tienda NO PUEDE VENDER:');
    alta.bloquean.forEach(function (x) {
      decir('   ' + x.clave + ' — ' + x.porQue);
    });
  }
  if (alta.avisan.length) {
    marcar('REVISAR');
    decir(alta.bloquean.length ? '' : 'La tienda vende, pero queda a medias:');
    if (alta.bloquean.length) decir('Y además, sin romper la venta:');
    alta.avisan.forEach(function (x) {
      decir('   ' + x.clave + ' — ' + x.porQue);
    });
  }
  if (alta.lista) {
    decir('OK   las ' + LISTA_DE_ALTA.length + ' claves del alta están llenas.');
  } else {
    decir('');
    decir('Todas se llenan en la pestaña Configuración.');
  }

  // ── 3 ────────────────────────────────────────────────────────────────────
  /* Los dos datos que hay que llevar al panel de tiendas. Van juntos y con
     rótulo porque es lo que más se busca y lo que más se copia mal. */
  punto('Para el panel de tiendas');
  decir('── PARA EL PANEL DE TIENDAS ──');
  var servicio = urlLista();
  if (!servicio) marcar('REVISAR');
  decir('Servicio: ' + (servicio ||
    'TODAVÍA NO SE SABE.\n' +
    '          Publica el proyecto (Implementar > Aplicación web) y luego ABRE\n' +
    '          esa URL una vez en el navegador. El maestro solo puede conocer\n' +
    '          su propia dirección atendiendo una petición: desde el editor,\n' +
    '          Google le dice la /dev, que no sirve para nadie más.'));
  decir(mostrarSecretos
    ? 'Token:    ' + token()
    : 'Token:    no se muestra aquí. Ejecuta diagnosticoCompleto() en el\n' +
      '          editor del maestro: este informe se puede copiar y reenviar.');
  /* 0.16.0 · Los mismos dos datos son los del flujo `conectar`: se dice dónde. */
  decir('Conectar: ' + urlDeConectar() + '\n' +
        '          (Run workflow: el nombre corto de la tienda, Servicio y Token)');

  /* LA MIGRACIÓN DE LOS DOS TOKENS, MEDIDA Y NO SUPUESTA. No se puede mirar el
     stub de la hoja desde aquí, pero sí se puede saber con qué token entró la
     última vez, porque atenderMenu() lo anota. Es la misma idea del punto 8:
     se mide lo que pasa, no lo que debería pasar. */
  var tv = Date.parse(marcaDelTokenViejo() || '');
  if (tv) {
    marcar('REVISAR');
    decir('');
    decir('El stub de esta hoja todavía usa el TOKEN DE MONTAJE (' + haceCuanto(tv) + ').');
    decir('Ese token abre todas las puertas y no debería estar en la hoja.');
    decir('Ejecuta generarStub() en el editor del maestro y pega el código nuevo:');
    decir('el de ahora lleva un token que solo sirve para el menú.');
  } else {
    decir('OK   el stub usa el token del menú, que solo abre el menú.');
  }

  /* 0.20.0 · ¿QUÉ VERSIÓN DEL STUB ESTÁ PEGADA? No se puede leer el código de
     la hoja desde aquí, pero el stub dice de qué versión es en cada petición y
     `atenderMenu` lo anota. Un stub viejo no se queja: ofrece un menú que ya
     no existe hasta que alguien toca una opción. */
  var stubHoja = stubVisto();
  if (!stubHoja) {
    marcar('REVISAR');
    decir('');
    decir('Nadie ha abierto todavía el menú de esta hoja: no sé qué stub tiene.');
    decir('Ejecuta A1_generarStub, pégalo en la hoja y abre el menú una vez.');
  } else if (stubHoja !== VERSION) {
    marcar('REVISAR');
    decir('');
    decir('El stub pegado en la hoja es de la versión ' + stubHoja + ' y este');
    decir('maestro es ' + VERSION + '. Ejecuta A1_generarStub y pega el nuevo:');
    decir('si esta versión agregó una opción al menú, la hoja todavía no la tiene.');
  } else {
    decir('OK   el stub pegado en la hoja es de esta misma versión.');
  }

  /* 0.20.0 · EL PERMISO DE GITHUB. Sin él, Publicar y Actualizar desde el
     panel y desde el menú no hacen nada: el maestro no puede disparar el
     flujo. Lo siembra `conectar` (0.16.0); una tienda anterior no lo tiene. */
  if (tokenDeGitHub()) {
    decir('OK   el maestro tiene su permiso de GitHub: Publicar y Actualizar funcionan.');
  } else {
    marcar('REVISAR');
    decir('');
    decir('Sin PERMISO DE GITHUB: Publicar ahora y Actualizar desde el panel o el');
    decir('menú no van a disparar nada. Corre `conectar` otra vez (lo siembra solo)');
    decir('o pega un token en las propiedades del script como GITHUB_TOKEN.');
  }

  // ── 3 ────────────────────────────────────────────────────────────────────
  punto('Pestañas de la hoja');
  var faltan = 0;
  [H_CONFIG, H_CATALOGO, H_ENVIOS, H_CUPONES, H_VALIDACIONES, H_PEDIDOS, H_RESUMEN, H_TABLERO, H_ERRORES]
    .forEach(function (nombre) {
      var h = libro.getSheetByName(nombre);
      if (!h) { faltan++; decir('FALTA la pestaña: ' + nombre); }
      else decir('OK   ' + nombre + '   (' + Math.max(0, h.getLastRow() - 1) + ' filas)');
    });
  if (faltan) { marcar('PROBLEMA'); decir('Ejecuta instalar() para crear las que faltan.'); }

  // ── 4 ────────────────────────────────────────────────────────────────────
  punto('Tareas automáticas');
  var funciones = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  /* Desde M3.5 el disparador de cada hora es revisionHoraria (concilia los
     pagos en línea y después recalcula). Una tienda que todavía no corrió
     instalar() tiene el viejo, que sigue sirviendo para el resumen. */
  var cadaHora = funciones.indexOf('revisionHoraria') !== -1 || funciones.indexOf('recalcularResumen') !== -1;
  if (!cadaHora) marcar('PROBLEMA');
  decir(cadaHora
    ? 'OK   resumen programado cada hora'
    : 'FALTA el disparador del resumen. Ejecuta instalar().');
  if (funciones.indexOf('alEditar') === -1) marcar('PROBLEMA');
  decir(funciones.indexOf('alEditar') !== -1
    ? 'OK   inventario se mueve al cambiar el Estado'
    : 'FALTA el disparador de edición. Ejecuta instalar().');

  // ── 5 ────────────────────────────────────────────────────────────────────
  /* SIN CACHÉ, A PROPÓSITO. Ver revisarDatos(): leer por el caché hacía que
     el informe diera todo por bueno mientras un precio llevaba una hora sin
     poderse leer. */
  punto('Datos que la hoja no pudo leer');
  var datos = revisarDatos();

  /* LAS CELDAS DE ESTADO QUE NO SE ENTIENDEN, por su fila. Un pedido con el
     Estado mal escrito se queda quieto: ni descuenta ni devuelve inventario, y
     sin esto nadie se enteraría hasta cuadrar el stock a fin de mes. */
  aplicarInventario();
  if (ESTADOS_ILEGIBLES.length) {
    marcar('REVISAR');
    decir('Hay ' + ESTADOS_ILEGIBLES.length + ' pedido(s) con un Estado que no reconozco.');
    decir('Esas líneas no mueven inventario, ni para un lado ni para el otro.');
    decir('Elige el estado de la lista desplegable de la columna Estado:');
    ESTADOS_ILEGIBLES.forEach(function (c) { decir('   ' + c); });
    decir('   Los válidos son: ' + ESTADOS_PEDIDO.join(' · '));
    decir('');
  }

  if (datos.ilegibles.length) {
    marcar('PROBLEMA');
    decir('Hay ' + datos.ilegibles.length + ' celda(s) con algo que no es un número.');
    decir('Una cifra que no se puede leer NO vale cero: el producto sale de la');
    decir('tienda en vez de salir gratis. Corrige la celda y publica de nuevo.');
    datos.ilegibles.forEach(function (c) { decir('   ' + c); });
  } else {
    decir('OK   todas las cifras de Catálogo, Envíos, Cupones y Configuración');
    decir('     se leen como números.');
  }

  // ── 6 ────────────────────────────────────────────────────────────────────
  punto('Qué sale en el catálogo');
  var cat = catalogoPublico();
  decir('Lo que ve la tienda: ' + cat.productos.length + ' productos y ' +
              cat.envios.length + ' tarifas de envío.');
  if (!cat.productos.length) {
    marcar('PROBLEMA');
    decir('Vacío. Revisa que la pestaña Catálogo tenga filas con ID, Nombre y Activo = Sí.');
  }
  /* LOS EJEMPLOS QUE DEJA instalar() SON PARA MIRAR, NO PARA VENDER.
     Si alguno sigue Activo = Sí, la tienda los muestra tal cual: con el ID
     "ejemplo1" y el precio de mentira. Avisa aquí, no solo en la hoja, para
     que se note ANTES de compartir el enlace. */
  /* activo=true, no basta con el ID: catalogoPublico() devuelve TAMBIÉN los
     inactivos (la tienda los filtra ella misma al pintar), así que sin este
     filtro el aviso saldría en cualquier instalación nueva, antes de que el
     comerciante haya podido ver ni un producto. */
  var ejemplos = cat.productos.filter(function (p) { return p.activo && /^ejemplo/i.test(p.id); });
  if (ejemplos.length) {
    marcar('REVISAR');
    decir('');
    decir('Hay ' + ejemplos.length + ' producto(s) de EJEMPLO activos y visibles en la tienda:');
    ejemplos.forEach(function (p) { decir('   ' + p.id + ' — ' + p.nombre); });
    decir('Son los que deja instalar() para mostrar cómo se ve una ficha. Bórralos');
    decir('o cámbiales el ID y el nombre antes de compartir el enlace.');
  }
  if (datos.caidos.length) {
    marcar('REVISAR');
    decir('Estas filas no llegan a la tienda, y por qué:');
    datos.caidos.forEach(function (c) { decir('   ' + c); });
  }

  // ── 7 ────────────────────────────────────────────────────────────────────
  punto('Fotos');
  var fotos = revisarFotos();
  if (!fotos.comprobable) {
    marcar('REVISAR');
    decir(fotos.porQue === 'sinUrl'
      ? 'No sé la dirección de la tienda (Configuración > sitio_url), así que'
      : 'No pude leer el catálogo publicado (' + fotos.porQue + '), así que');
    decir('no puedo comprobar qué fotos tiene la tienda de verdad.');
  } else if (fotos.faltan.length) {
    marcar('REVISAR');
    decir('La hoja pide ' + fotos.pedidas + ' foto(s). Estas la tienda NO las tiene:');
    fotos.faltan.forEach(function (f) { decir('   ' + f); });
    decir('Si acabas de subirlas al Drive, usa «Publicar ahora» y vuelve a mirar:');
    decir('la tienda solo cambia cuando se publica.');
  } else {
    decir('OK   las ' + fotos.pedidas + ' fotos que pide la hoja están en la tienda.');
  }
  if (fotos.comprobable && fotos.sobran.length) {
    decir('(Hay ' + fotos.sobran.length + ' foto(s) publicadas que ya nadie usa. No estorban.)');
  }

  // ── 8 ────────────────────────────────────────────────────────────────────
  /* ══ QUÉ ESTÁ MOSTRANDO LA TIENDA, QUE NO ES LO MISMO QUE QUÉ DICE LA HOJA ══
     Desde que el catálogo se hornea dentro del sitio, la hoja y la tienda pueden
     decir cosas distintas durante un rato. El comerciante no tiene acceso a
     GitHub —ni tiene por qué— así que contarle que «quedó avisado en el flujo»
     no le sirve de nada.
     Lo que sí le sirve es el resultado observable: se le pregunta A LA TIENDA
     de cuándo es lo que está sirviendo. Eso no depende de que la tubería
     reporte bien; depende de lo que un comprador ve ahora mismo. */
  punto('Qué está mostrando tu tienda');
  var pub = publicacionDeLaTienda();
  if (/NO SE PUDO COMPROBAR|ATENCIÓN|no sé la dirección/.test(pub)) marcar('REVISAR');
  decir(pub);

  // ── 9 ────────────────────────────────────────────────────────────────────
  punto('Carga, respaldo y últimos errores');
  decir('Lecturas del catálogo hoy: ' + lecturasDeHoy() +
        '   ·   pico en una hora: ' + picoDeHoy());
  decir('   El tope de Google es de CONCURRENCIA —30 ejecuciones a la vez— y no');
  decir('   se puede consultar. Por eso lo que se mira es el pico y no el total.');
  decir('   Pasado 300 en una hora, tres días distintos: ver DECISIONES.md 01.');
  var r = ultimoRespaldo();
  if (r.error) marcar('REVISAR');
  decir('Último respaldo: ' + (r.error ? 'FALLÓ — ' + r.error
        : (r.fecha ? r.fecha.slice(0, 10) + '  ' + r.archivo
                   : 'todavía ninguno (sale los domingos de madrugada)')));

  /* LOS PEDIDOS QUE SE RESCATARON. Cada uno estuvo perdido un rato: el comercio
     veía el chat de WhatsApp y no veía la fila. Que al final llegara no borra
     eso, y si el comprador no hubiera vuelto a abrir la tienda no habría
     llegado nunca. */
  var res = rescates();
  if (res.n) {
    marcar('REVISAR');
    decir('');
    decir('Pedidos que llegaron TARDE: ' + res.n +
          '   ·   el que más tardó: ' + haceCuantoDura(res.peor));
    decir('   Son pedidos que salieron por WhatsApp y no llegaron a la hoja en su');
    decir('   momento: la tienda los recuperó cuando el comprador volvió a abrirla.');
    decir(res.peor > 60
      ? '   Más de una hora quiere decir que esta tienda estuvo caída un buen rato.'
      : '   Minutos sueltos son tropiezos de red, y son normales.');
    decir('   El último, ' + haceCuanto(Date.parse(res.ultimo)) + '.');
  }

  var he = libro.getSheetByName(H_ERRORES);
  if (he && he.getLastRow() > 1) {
    var desde = Math.max(2, he.getLastRow() - 4);
    decir('--- últimos errores ---');
    he.getRange(desde, 1, he.getLastRow() - desde + 1, 3).getValues().forEach(function (f) {
      decir('  ' + f[0] + '  ' + f[1]);
    });
  } else {
    decir('Sin errores registrados.');
  }

  // ── 10 ───────────────────────────────────────────────────────────────────
  /* 0.20.0 · LO QUE LA 0.19 TRAJO, Y LO QUE HACE FALTA EL DÍA MALO. Dos cosas
     que no se ven hasta que se necesitan: si la tienda mide, y si de verdad se
     puede volver atrás. Un respaldo que nadie comprobó es una copia
     decorativa (bitácora 77). */
  punto('Medición y vuelta atrás');
  var cfgDiag = leerConfiguracion();
  var idMed = idDeAnalitica(cfgDiag);
  var crudoMed = String(cfgDiag.analytics_id || '').trim();
  if (idMed) {
    decir('Medición: Google Analytics 4 encendido (' + idMed + ').');
    decir('   Se hornea al publicar: si acabas de ponerlo, publica para que tome efecto.');
    decir('   Recuerda decirlo en la política de privacidad de la tienda.');
  } else if (crudoMed) {
    marcar('REVISAR');
    decir('Medición: «' + crudoMed + '» NO es un identificador de GA4 y no se hornea.');
    decir('   Tiene que verse así: G-ABCD123456 (Analytics > Administrar >');
    decir('   Flujos de datos > Web). Un UA- o un GTM- no sirven.');
  } else {
    decir('Medición: apagada. La tienda no carga nada de Google ni pone cookies.');
  }

  decir('');
  var carpeta = idDeCarpeta(cfgDiag.respaldo_carpeta);
  if (!carpeta) {
    marcar('REVISAR');
    decir('Volver atrás: NO SE PUEDE. Falta respaldo_carpeta en Configuración,');
    decir('   así que esta hoja no tiene ninguna copia de la que volver.');
  } else {
    var copias = [];
    try { copias = listarRespaldos(); } catch (e) { copias = []; }
    if (!copias.length) {
      marcar('REVISAR');
      decir('Volver atrás: la carpeta está puesta pero todavía no hay ninguna copia.');
      decir('   Ejecuta A4_respaldoAhora una vez y comprueba que aparece.');
    } else {
      decir('Volver atrás: ' + copias.length + ' copia(s) de esta hoja. La más nueva, ' +
            copias[0].cuando.toISOString().slice(0, 10) + '.');
      decir('   Los DATOS: A5_respaldos() para verlas, A6_restaurarDatos(«ultimo», «Catálogo»)');
      decir('   para volver. Solo ' + pestanasRestaurables().join(', ') + '.');
    }
    var ur = ultimaRestauracion();
    if (ur.fecha) decir('   Última restauración: ' + ur.fecha.slice(0, 10) + ' — ' +
                        (ur.pestanas || []).join(', ') + ' desde ' + ur.desde + '.');
  }
  decir('   El SITIO y la VERSIÓN: Actions > restaurar, en el repositorio de esta tienda.');

  /* ── El veredicto, arriba del todo ────────────────────────────────────────
     Se calcula al final porque hasta el final no se sabe, pero se LEE primero:
     el resumen va al principio del informe. Un informe que obliga a bajar
     hasta el pie para saber si hay que preocuparse no lo lee nadie. */
  var malos = puntos.filter(function (p) { return p.estado !== 'OK'; });
  var cabecera = ['── RESUMEN ──'];
  puntos.forEach(function (p) {
    cabecera.push('  ' + (p.estado === 'OK' ? 'OK      ' : p.estado === 'REVISAR' ? 'REVISAR ' : 'PROBLEMA') +
                  '  ' + p.n + '. ' + p.titulo);
  });
  cabecera.push(malos.length
    ? '  → ' + malos.length + ' punto(s) para revisar. El detalle está abajo.'
    : '  → Todo en orden.');
  cabecera.push('');
  var texto = cabecera.join('\n') + linea.join('\n');

  /* El cuadro copiable lleva TODO menos el token. `texto` sí lo lleva, porque
     lo consume el panel y `?a=diagnostico`, que ya viajan autenticados; el
     cuadro está hecho para reenviarse por WhatsApp, y ahí no. */
  var tk = mostrarSecretos ? token() : '';
  var copiable = tk ? texto.split(tk).join('(el token está en pantalla, punto 2)') : texto;

  return { tipo: 'html', titulo: 'Diagnóstico', texto: texto,
           html: diagnosticoEnHtml(puntos, copiable, servicio, tk) };
}

/* 0.20.0 · EL MISMO INFORME, DESDE EL PANEL. El comerciante ya no necesita
   abrir la hoja ni llamarnos para saber qué le falta: lo lee en su panel. Va
   sin secretos —`diagnostico(false)`— y devuelve además el resumen por puntos,
   que es lo que el panel pinta arriba para que se vea de un vistazo. */
function atenderDiagnostico() {
  var d = diagnostico(false);
  return { ok: true, texto: String(d.texto || ''), resumen: resumenDelDiagnostico(d.texto) };
}

/* El resumen que ya calcula el informe, en datos: el panel no debería tener
   que leer texto para pintar tres colores. */
function resumenDelDiagnostico(texto) {
  var puntos = [];
  String(texto || '').split('\n').some(function (l) {
    var m = l.match(/^\s{2}(OK|REVISAR|PROBLEMA)\s+(\d+)\.\s+(.+)$/);
    if (m) puntos.push({ estado: m[1], n: Number(m[2]), titulo: m[3].trim() });
    return /^\s*→/.test(l) && puntos.length > 0;
  });
  return puntos;
}

/* El diagnóstico CON los secretos, para el que monta la tienda. Se ejecuta
   desde el editor del maestro —Ejecutar > diagnosticoCompleto— y lo que
   imprime sale por el registro de ejecución, no por la pantalla del cliente.
   No está en ACCIONES_MENU ni tiene puerta en doGet: no se puede llamar
   desde fuera, que es justamente lo que la hace segura. */
/* Dónde está el flujo `conectar`: en el repositorio de servicio del mismo
   dueño que la semilla. */
function urlDeConectar() {
  return 'https://github.com/' + SEMILLA_REPO.split('/')[0] + '/tiendas/actions/workflows/conectar.yml';
}

function diagnosticoCompleto() {
  return diagnostico(true);
}

/* ==========================================================================
   JUBILAR EL TOKEN DE MONTAJE QUE ESTUVO A LA VISTA.
   --------------------------------------------------------------------------
   Pegar el stub nuevo hace que la hoja deje de USAR el token de montaje, pero
   no lo invalida: quien lo haya copiado antes lo sigue teniendo. Cerrar el
   agujero de verdad es cambiarlo, y eso obliga a tocar dos sitios fuera de
   aquí —el secreto MAESTRO_TOKEN del repositorio y el tienda.json de quien
   monta—, así que no puede pasar solo ni por sorpresa.

   SE NIEGA MIENTRAS ALGUNA HOJA SIGA ENTRANDO CON EL VIEJO. Rotarlo antes de
   pegar el stub nuevo deja el menú del comerciante muerto sin decirle por qué,
   y «se me apagó el menú» es exactamente el incidente que este sprint quería
   evitar. El margen de una hora es para no confiar en un reloj: si la última
   entrada con el token viejo fue hace un rato largo, la migración se dio.

   No está en el menú ni tiene puerta en doGet. Se ejecuta desde el editor.
   ========================================================================== */
function rotarToken() {
  var props = PropertiesService.getScriptProperties();
  var viejo = '';
  try { viejo = props.getProperty('STUB_CON_TOKEN_VIEJO') || ''; } catch (e) { }
  var tv = Date.parse(viejo || '');
  var margen = 60 * 60 * 1000;

  if (tv && Date.now() - tv < margen) {
    var m = 'TODAVÍA NO.\n\n' +
      'Esta hoja entró al menú con el token de montaje ' + haceCuanto(tv) + ',\n' +
      'así que su stub sigue siendo el viejo. Si rotas ahora, el menú del\n' +
      'comerciante deja de funcionar y él no va a saber por qué.\n\n' +
      'Primero: generarStub() aquí, pegar el código en la hoja, abrir el menú\n' +
      'una vez para comprobar. Después vuelve a ejecutar rotarToken().';
    console.log(m);
    return m;
  }

  var nuevo = 'tk-' + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('TOKEN', nuevo);
  props.deleteProperty('STUB_CON_TOKEN_VIEJO');

  /* TRES SITIOS, Y ESTA LISTA DECÍA DOS. Se me olvidó el panel, y el panel es
     el que más ruido hace al fallar: no da un 401 que alguien lea, marca la
     tienda como «NO RESPONDE» y le vacía la fila de métricas. Quien lo mira
     concluye que la tienda se cayó, no que el token es viejo — y sale a buscar
     un problema que no existe.

     Una lista incompleta de pasos es peor que ninguna: la primera se sigue
     entera y se confía en ella. */
  var salida = 'TOKEN DE MONTAJE NUEVO:\n\n    ' + nuevo + '\n\n' +
    'El anterior ya no vale. Falta cambiarlo en TRES sitios, y hasta que lo\n' +
    'hagas los flujos van a fallar y el panel va a decir que esta tienda no\n' +
    'responde —que no es verdad: es que le estás hablando con el token viejo—:\n\n' +
    '  1. El secreto MAESTRO_TOKEN del repositorio de esta tienda.\n' +
    '  2. LA PESTAÑA Tiendas DEL PANEL, columna Token, la fila de este comercio.\n' +
    '  3. El tienda.json de quien monta, si lo usa en su máquina.\n\n' +
    'El token del menú NO cambió: el stub que está pegado sigue sirviendo.';
  console.log(salida);
  return salida;
}

/* El mismo informe, para leerlo. El cuadro de abajo es un textarea y no un
   <pre> por una razón práctica: dentro de un diálogo de Sheets, seleccionar
   texto de un <pre> con el ratón es un suplicio, y este cuadro existe para
   copiarse entero de un clic. */
function diagnosticoEnHtml(puntos, texto, servicio, tk) {
  var color = { 'OK': '#1B5E3A', 'REVISAR': '#8A6100', 'PROBLEMA': '#B3261E' };
  var fondo = { 'OK': '#E8F3EC', 'REVISAR': '#FFF4DB', 'PROBLEMA': '#FCE8E6' };
  var items = puntos.map(function (p) {
    return '<li style="margin:0 0 5px;font:400 13px/1.45 Arial,sans-serif;color:#111">' +
      '<span style="display:inline-block;min-width:74px;text-align:center;' +
      'border-radius:3px;padding:1px 6px;margin-right:8px;' +
      'font:700 11px Arial,sans-serif;color:' + color[p.estado] + ';' +
      'background:' + fondo[p.estado] + '">' + p.estado + '</span>' +
      escaparHtml(p.n + '. ' + p.titulo) + '</li>';
  }).join('');
  var malos = puntos.filter(function (p) { return p.estado !== 'OK'; }).length;

  return '<div style="font-family:Arial,sans-serif;padding:6px 10px 18px">' +
    '<p style="font:700 14px Arial,sans-serif;color:' +
      (malos ? '#B3261E' : '#1B5E3A') + ';margin:0 0 10px">' +
      (malos ? malos + ' punto(s) para revisar' : 'Todo en orden') + '</p>' +
    '<ol style="list-style:none;padding:0;margin:0 0 14px">' + items + '</ol>' +
    /* Los dos datos del panel, en pantalla y no en el cuadro: aquí se leen y
       se copian a mano, que es lo que hace falta una sola vez al montar. */
    '<div style="border:1px solid #E0E0E0;border-radius:4px;padding:8px 10px;' +
      'margin:0 0 12px;background:#FFF">' +
      '<p style="font:700 11px Arial,sans-serif;color:#666;margin:0 0 4px;' +
        'letter-spacing:.04em">PARA EL PANEL DE TIENDAS</p>' +
      '<p style="font:400 11px/1.5 Consolas,monospace;color:#111;margin:0;' +
        'word-break:break-all">Servicio: ' + escaparHtml(servicio || '(todavía no se sabe)') +
        '<br>Token: ' + (tk ? escaparHtml(tk)
          : '<span style="font-family:Arial,sans-serif;color:#666">se lee con ' +
            '<b>diagnosticoCompleto()</b> en el editor del maestro</span>') +
        '<br><span style="font-family:Arial,sans-serif;color:#666">Para conectarla: </span>' +
        escaparHtml(urlDeConectar()) +
        '</p></div>' +
    '<p style="font:400 12px/1.5 Arial,sans-serif;color:#666;margin:0 0 4px">' +
      'Si necesitas ayuda, copia este cuadro y mándalo por WhatsApp a quien te ' +
      'montó la tienda. Trae todo lo que hace falta para entender qué pasa.</p>' +
    '<textarea readonly onclick="this.select()" ' +
      'style="width:100%;height:330px;box-sizing:border-box;padding:8px;' +
      'font:400 11px/1.45 Consolas,monospace;color:#111;border:1px solid #CCC;' +
      'border-radius:4px;background:#FAFAFA">' + escaparHtml(texto) + '</textarea>' +
    '</div>';
}

/* ==========================================================================
   Cierra la inyección de fórmulas de Sheets.
   Una celda que empiece por = + - @ (o por un carácter de control) se ejecuta
   al abrir la hoja. El apóstrofe la obliga a quedarse como texto.
   ========================================================================== */
/* El tope por defecto —MAX_TEXTO— es para lo que escribe el comprador: un
   nombre, una nota. Los textos que escribe el maestro —una discrepancia, un
   aviso— son más largos por naturaleza y cortarlos a 60 los deja sin decir
   nada: «El envío que elegiste ya no está disponible; te confirmamos ». Por eso
   el tope se puede subir. Lo que NO cambia es la limpieza: sigue siendo texto
   que puede traer trozos de lo que puso el comprador. */
function celdaSegura(valor, tope) {
  var maximo = tope || MAX_TEXTO;
  var t = String(valor === null || valor === undefined ? '' : valor);
  t = t.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
  if (t.length > maximo) t = t.slice(0, maximo);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

/* ============================================================================
   UNA CIFRA QUE NO SE PUEDE LEER NO VALE CERO.
   ----------------------------------------------------------------------------
   Durante mucho tiempo todas las cifras del comerciante se leyeron así:

       precio: Number(f[4]) || 0

   Y `|| 0` convierte «no se pudo leer» en «es gratis», que no se parecen en
   nada. Escribir `$9.000` o `9,000` en una celda es lo más natural del mundo
   para quien lleva su negocio en una hoja de cálculo, y lo que pasaba después
   no avisaba a nadie: el producto salía gratis, el envío salía gratis, el cupón
   se aplicaba sin mínimo, y un cupón limitado pasaba a ilimitado porque 0 usos
   máximos significa SIN TOPE.

   La prueba no es Number(): `Number('9.000')` no es NaN, es 9. La prueba es el
   TIPO. getValues() devuelve un número cuando la celda es numérica y un texto
   cuando no; si vuelve texto y no está vacía, alguien escribió algo que la hoja
   no reconoció como número, y aquí NO se adivina qué quiso decir.

   Vacío sí es 0: una celda en blanco es una decisión. Ilegible no.
   ============================================================================ */
var CELDAS_ILEGIBLES = [];

function cifra(valor, donde) {
  if (valor === '' || valor === null || valor === undefined) return 0;
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  if (CELDAS_ILEGIBLES.length < 20) {
    CELDAS_ILEGIBLES.push(donde + ' dice "' + String(valor).slice(0, 24) + '"');
  }
  return null;                       // null es «no se sabe», que no es cero
}

/* LAS VARIANTES DE UN PRODUCTO, LEÍDAS DE SU CELDA (C-1).
   ----------------------------------------------------------------------------
   Sintaxis corta, para escribirse en una celda sin aprender nada:

       Talla: S|M|L ; Color: Rosa|Nude

   Grupos separados por `;`, el nombre antes de `:`, y las opciones con `|` — el
   mismo separador que ya usa la columna Imágenes, para no inventar una segunda
   convención en la misma hoja.

   EL CATÁLOGO FALLA ABIERTO, y aquí eso importa. Una celda que no se entiende NO
   saca el producto de la tienda: lo deja sin variantes y reporta la celda. Es la
   regla de la casa —«fallo abierto en el catálogo, fallo cerrado en los
   cupones»— y el cálculo es claro: vender un labial sin tono deja un pedido que
   el comerciante resuelve con un mensaje, y no venderlo es una venta perdida y
   callada. El PRECIO es lo contrario y por eso ese sí tumba el producto: ahí el
   error se paga en plata.

   Y NO SE ADIVINA. No se intenta partir `S M L` por espacios ni tratar el `;`
   como `|`: cada intento de adivinar es una forma de que el comprador elija algo
   que el comerciante no quiso ofrecer. */
/* C-1b bajó los topes de C-1 (4 grupos, 24 opciones) a los que decidió el
   dueño el 21 de septiembre: con inventario por combinación, 4 grupos de 24
   son 331.776 filas. Escritos en tres sitios —aquí, la página y el horneado—
   y variantes.js comprueba que digan lo mismo. */
var MAX_GRUPOS_VARIANTE = 3;
var MAX_OPCIONES_VARIANTE = 20;
var MAX_COMBINACIONES = 100;

function variantesDeCelda(valor, donde) {
  var t = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!t) return [];

  var quejas = [];
  var grupos = [];
  t.split(';').forEach(function (trozo) {
    var s = String(trozo).trim();
    if (!s) return;
    var i = s.indexOf(':');
    if (i === -1) { quejas.push(s); return; }
    var nombre = s.slice(0, i).trim();
    var opciones = s.slice(i + 1).split('|').map(function (o) {
      return String(o).trim();
    }).filter(function (o) { return o; });
    /* Un nombre sin opciones no es un grupo: es media frase. Y unas opciones
       sin nombre no se pueden pintar: el selector no tendría rótulo. */
    if (!nombre || !opciones.length) { quejas.push(s); return; }
    if (opciones.length > MAX_OPCIONES_VARIANTE) {
      quejas.push(nombre + ' tiene ' + opciones.length + ' opciones');
      opciones = opciones.slice(0, MAX_OPCIONES_VARIANTE);
    }
    grupos.push({ nombre: nombre, opciones: opciones });
  });

  if (grupos.length > MAX_GRUPOS_VARIANTE) {
    quejas.push('son ' + grupos.length + ' grupos y el tope es ' + MAX_GRUPOS_VARIANTE);
    grupos = grupos.slice(0, MAX_GRUPOS_VARIANTE);
  }

  if (quejas.length && CELDAS_ILEGIBLES.length < 20) {
    CELDAS_ILEGIBLES.push(donde + ': ' + quejas[0].slice(0, 40) +
      '. Se escribe así -> Talla: S|M|L ; Color: Rosa|Nude');
  }
  return grupos;
}

/* QUÉ ELIGIÓ EL COMPRADOR, COMPROBADO CONTRA LA HOJA (C-1).
   ----------------------------------------------------------------------------
   Llega en la misma línea del pedido:  id:cantidad:Talla=M;Color=Rosa
   y se devuelve normalizado —«Talla: M · Color: Rosa»— para escribirlo tal cual
   en la columna Variante y en el mensaje de WhatsApp.

   SE COMPRUEBA, no se cree. Confiar en la elección que manda la página es lo
   mismo que confiar en el precio que manda la página, y eso es exactamente lo
   que este maestro no hace desde el primer día. Una opción que este comercio no
   ofrece TUMBA LA LÍNEA: guardarla sería dejar un pedido que nadie puede
   despachar, y adivinar cuál quiso decir es peor todavía.

   Lo que sí falla abierto es la ELECCIÓN QUE FALTA. Un producto con variantes
   cuyo pedido llega sin ninguna viene de una página vieja en caché o de alguien
   toqueteando la dirección; la venta se acepta y se avisa, porque el comerciante
   resuelve eso con un mensaje y rechazarla es perder la venta callando. Que la
   elección sea obligatoria es trabajo de la página. */
function variantePedida(crudo, grupos, avisos, nombre) {
  var ofrecidos = grupos || [];
  var texto = String(crudo === null || crudo === undefined ? '' : crudo).trim();

  if (!ofrecidos.length) return '';              // el producto no tiene variantes
  if (!texto) {
    avisos.push('Falta elegir en ' + nombre + '. Confírmalo por WhatsApp.');
    return '';
  }

  var pedido = {};
  texto.split(';').forEach(function (par) {
    var i = String(par).indexOf('=');
    if (i === -1) return;
    pedido[String(par).slice(0, i).trim().toLowerCase()] = String(par).slice(i + 1).trim();
  });

  var partes = [];
  for (var g = 0; g < ofrecidos.length; g++) {
    var grupo = ofrecidos[g];
    var elegida = pedido[grupo.nombre.toLowerCase()];
    if (elegida === undefined || elegida === '') {
      avisos.push('Falta elegir ' + grupo.nombre + ' en ' + nombre + '.');
      continue;
    }
    /* Se compara sin distinguir mayúsculas y se guarda LA DE LA HOJA: así la
       columna Variante dice siempre lo mismo que el catálogo, escriba como
       escriba la página. */
    var buena = null;
    for (var o = 0; o < grupo.opciones.length; o++) {
      if (grupo.opciones[o].toLowerCase() === elegida.toLowerCase()) buena = grupo.opciones[o];
    }
    if (buena === null) return null;             // eligió algo que no se ofrece
    partes.push(grupo.nombre + ': ' + buena);
  }
  return partes.join(' \u00b7 ');
}

/* La pestaña Configuración es un almacén de TEXTO: leerConfiguracion() convierte
   todo a String a propósito, porque casi todo lo que hay ahí son textos. Así que
   para sus pocas cifras la prueba del tipo no sirve y hace falta una lectura
   propia — tolerante con cómo escribe la gente los pesos («$20.000», «20.000»,
   «20,000», «20000») y estricta con lo que no es un número. Sigue sin adivinar:
   lo que no encaja en el patrón es ilegible, no cero. */
function cifraDeTexto(valor, donde) {
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  var t = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!t) return 0;
  var limpio = t.replace(/[$\s]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '');
  if (!/^\d+$/.test(limpio)) {
    if (CELDAS_ILEGIBLES.length < 20) {
      CELDAS_ILEGIBLES.push(donde + ' dice "' + t.slice(0, 24) + '"');
    }
    return null;
  }
  return Number(limpio);
}

function numeroSeguro(valor, tope) {
  var n = Number(valor);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), tope);
}

/* Agrega a Configuración las claves de la semilla que todavía no estén, con su
   valor por defecto y su explicación. Las que ya existen no se tocan nunca. */
function agregarClavesQueFaltan(h, semilla) {
  var tiene = {};
  filas(H_CONFIG).forEach(function (f) { tiene[String(f[0]).trim()] = true; });
  var faltan = semilla.filter(function (f) { return !tiene[f[0]]; });
  if (!faltan.length) return null;
  var desde = h.getLastRow() + 1;
  h.getRange(desde, 1, faltan.length, 3).setValues(faltan);
  h.getRange(desde, 2, faltan.length, 2).setWrap(true);
  return faltan.map(function (f) { return f[0]; });
}

function hoja(nombre, encabezados) {
  var libro = elLibro();
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.appendRow(encabezados);
    h.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

/* Agrega al final las columnas del encabezado que le falten a una hoja que ya
   existía. Sin esto, quien ya tenía la hoja creada nunca vería la columna nueva. */
function asegurarColumnas(nombre, encabezados) {
  var h = elLibro().getSheetByName(nombre);
  if (!h) return;
  var actuales = h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).getValues()[0];
  for (var i = actuales.length; i < encabezados.length; i++) {
    h.getRange(1, i + 1).setValue(encabezados[i]).setFontWeight('bold');
  }
}

function filas(nombre) {
  var h = elLibro().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()).getValues();
}

function esSi(v) {
  var t = String(v).trim().toLowerCase();
  return t === 'sí' || t === 'si' || t === 'true' || t === 'x' || t === '1';
}

/* ESQUEMA es la forma de los datos; VERSION es la del código. Se separan porque
   cambian por razones distintas y a ritmos distintos: se puede publicar un
   maestro nuevo diez veces sin mover una columna, y ese es el caso normal.

   La vitrina compara ESQUEMA con el que ella conoce. Si el que llega es MAYOR,
   no entiende lo que le están dando y se queda con lo último bueno —diciéndolo
   por consola—, en vez de pintar una tienda a medias. Sube solo cuando cambia
   lo que las puertas publican, y siguiendo R1: agregando al final. */
var ESQUEMA = 1;

/* LA PUERTA ?a=catalogo NO PIDE TOKEN, y no puede pedirlo: la abre cualquier
   comprador al entrar a la tienda. Así que todo lo que salga por ahí es
   público, y hay que decidir a propósito qué sale.

   Las claves de pago no salen. La llave Bre-B en un archivo estático es una
   invitación a copiarla en una tienda falsa con el mismo aspecto; el comprador
   la recibe por la respuesta automática de WhatsApp, después de que el comercio
   confirma, que es donde hay una persona detrás. Es la misma razón por la que
   nunca estuvo en el repositorio.

   Se filtra por prefijo y no por lista: una clave `pago_algo` que alguien
   agregue mañana queda protegida sin que nadie se acuerde de venir aquí.

   EL TOPE SÍ TIENE QUE LLEGAR, Y NO POR UNA EXCEPCIÓN. El carrito necesita
   saber el tope por transferencia para bloquear a tiempo: enterarse al abrir
   WhatsApp, con el pedido ya armado, es enterarse tarde. Y el tope no es una
   credencial —son 1.000 UVB, una cifra que publica el Estado—.

   La primera versión de esto abría una excepción al prefijo. Mala idea: el
   filtro `pago_` está DOS VECES a propósito —aquí y al hornear el archivo
   estático— justamente para que un descuido en uno no baste, y una excepción
   hay que acordarse de repetirla en los dos. Un filtro con excepciones deja de
   ser una regla y pasa a ser una lista que alguien mantiene.

   Así que el prefijo sigue siendo absoluto y el tope SALE CON OTRO NOMBRE:
   `tope_pago`, que es como lo llama el plan. La clave de la hoja no se toca
   —se llama `pago_tope` desde la 2.4.0 y renombrarla rompería todas las
   tiendas, R2 del contrato— y lo que se publica es un campo nuevo, que es una
   adición y no un cambio. */
function configPublica(cfg) {
  var limpia = {};
  Object.keys(cfg).forEach(function (k) {
    if (k.indexOf('pago_') === 0) return;
    limpia[k] = cfg[k];
  });
  /* El tope, ya leído como número. La página no tiene por qué saber que en la
     hoja se puede escribir «$12.110.000». */
  var tope = cifraDeTexto(cfg.pago_tope, 'Configuración > pago_tope');
  limpia.tope_pago = tope === null ? 0 : tope;
  /* M3.5 · CÓMO SE CIERRA LA VENTA, YA DECIDIDO. No lo que pide la hoja
     (cobro_modo) sino lo que la tienda PUEDE hacer: pedir Pasarela sin las
     llaves de Bold publica «whatsapp», y la página no enseña un botón de
     pagar que no va a funcionar. Las llaves no salen: solo el resultado. */
  var cobro = cobroVigente(cfg);
  limpia.cobro = cobro.modo;
  limpia.cobro_pruebas = cobro.modo === 'pasarela' && cobro.ambiente !== 'produccion' ? 'Sí' : '';
  return limpia;
}

function conVersion(r) {
  r.version = VERSION;
  r.esquema = ESQUEMA;
  /* Cuándo se generó esto. Sirve para lo que hoy no se puede contestar: si una
     tienda está sirviendo datos de hace un rato o de hace una semana. */
  r.generado = new Date().toISOString();
  return r;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   VALIDACIÓN  —  GET ?a=validar&items=abc:2,def:1&cupon=X&envio=zona1
                      &total=<lo que calculó la página>&sellar=1
   ========================================================================== */
/* ══════════════════════════════════════════════════════════════════════════
   LAS PUERTAS, Y QUIÉN GUARDA CADA UNA (D-1)
   --------------------------------------------------------------------------
   Antes esto era una escalera de `if` y la guardia estaba dentro de cada
   función: once puertas y once comprobaciones, cada una escrita a mano. Eso
   funciona hasta que alguien agrega la doce y se le olvida la suya — y ese
   olvido no se ve en ninguna parte, porque una puerta sin guardia se comporta
   exactamente como una puerta que funciona.

   Aquí cada puerta DECLARA a quién deja pasar, y la guardia se aplica en un
   solo sitio. Así la pregunta «¿qué se puede hacer sin credenciales?» tiene una
   respuesta que se lee de un vistazo, y una batería puede exigir que toda
   puerta nueva conteste esa pregunta antes de existir.

   Las cuatro guardias:
     publica  — cualquiera. Es la tienda: el catálogo y el pedido del comprador.
     montaje  — el token de despliegue. Lo tienen los flujos y quien monta.
     menu     — el token del stub. La comprueba `atenderMenu`, que además tiene
                que distinguir el token viejo del nuevo para la migración; por
                eso es la única que se guarda a sí misma, y está escrito aquí
                para que no parezca un olvido.
     panel    — el testigo del comerciante (?k=). Ocho horas, de esta tienda.
   ══════════════════════════════════════════════════════════════════════════ */
var PUERTAS = {
  version:   { guarda: 'publica', fn: function ()  { return { ok: true, version: VERSION }; } },
  catalogo:  { guarda: 'publica', fn: function ()  { contarLectura();
                                                     return conVersion(catalogoPublico()); } },
  validar:   { guarda: 'publica', fn: function (p) { return conVersion(validarPedido(p)); } },
  registrar: { guarda: 'publica', fn: function (p) { return conVersion(registrarPedido(p)); } },
  /* Pública porque es la que ENTREGA las credenciales: no se puede pedir el
     testigo para pedir el testigo. Lo que la protege es el límite de intentos.
     Y SOLO POR POST: por GET la clave viajaría en la dirección, y la dirección
     se queda en el historial del navegador y en los registros de Google. */
  entrar:    { guarda: 'publica', soloPost: true, fn: atenderEntrar },

  menu:      { guarda: 'menu',    fn: atenderMenu },

  panel:     { guarda: 'montaje', fn: atenderPanel },
  identidad: { guarda: 'montaje', fn: atenderIdentidad },
  bloques:   { guarda: 'montaje', fn: atenderBloques },
  sembrar:   { guarda: 'montaje', fn: atenderSembrar },
  fotos:     { guarda: 'montaje', fn: atenderFotos },
  foto:      { guarda: 'montaje', fn: atenderFoto },

  /* LAS DEL PANEL, TODAS SOLO POR POST. El testigo en una dirección es un
     testigo en el historial del navegador del mostrador, y ocho horas es mucho
     tiempo para que eso quede a la vista. */
  sesion:            { guarda: 'panel', soloPost: true, fn: atenderSesion },
  productos:         { guarda: 'panel', soloPost: true, fn: atenderProductos },
  guardar_producto:  { guarda: 'panel', soloPost: true, fn: atenderGuardarProducto },
  activar_producto:  { guarda: 'panel', soloPost: true, fn: atenderActivarProducto },
  borrar_producto:   { guarda: 'panel', soloPost: true, fn: atenderBorrarProducto },
  /* La única con un tope propio: una foto no cabe en los 20.000 del resto. El
     doble del de la foto, para que una que se pasa un poco reciba el mensaje
     amable de atenderSubirFoto —con el nombre para subirla a mano— y no el
     seco de aquí, que queda solo para lo absurdo. */
  subir_foto:        { guarda: 'panel', soloPost: true, tope: MAX_FOTO_BASE64 * 2, fn: atenderSubirFoto },
  pedidos:               { guarda: 'panel', soloPost: true, fn: atenderPedidos },
  estado_pedido:         { guarda: 'panel', soloPost: true, fn: atenderEstadoPedido },
  configuracion:         { guarda: 'panel', soloPost: true, fn: atenderConfiguracion },
  guardar_configuracion: { guarda: 'panel', soloPost: true, fn: atenderGuardarConfiguracion },
  publicacion:           { guarda: 'panel', soloPost: true, fn: atenderPublicacion },
  publicar:              { guarda: 'panel', soloPost: true, fn: atenderPublicar },

  /* M3.5 · Cobrar en línea. Crear el cobro SOLO POR POST: lleva el nombre, el
     celular y la dirección del comprador. Consultar va por las dos: solo lleva
     un token opaco, que además es el que Bold trae en la dirección de vuelta. */
  pago_crear:  { guarda: 'publica', soloPost: true, fn: function (p) { return conVersion(atenderPagoCrear(p)); } },
  pago_estado: { guarda: 'publica', fn: function (p) { return conVersion(atenderPagoEstado(p)); } },
  /* C-1b · el stock de cada combinación, desde el panel. */
  guardar_combinaciones: { guarda: 'panel', soloPost: true, fn: atenderGuardarCombinaciones },
  /* M4 · el tablero del panel. Solo lectura, y aun así con sesión: son las
     ventas del comercio. */
  tablero:               { guarda: 'panel', soloPost: true, fn: atenderTablero },
  /* 0.9.0 · el panel alcanza para todo: las zonas de envío y los cupones. */
  guardar_envio:         { guarda: 'panel', soloPost: true, fn: atenderGuardarEnvio },
  guardar_cupon:         { guarda: 'panel', soloPost: true, fn: atenderGuardarCupon },
  /* M5 · el rastreo. Pública y SOLO POR POST: el secreto viaja en el cuerpo,
     no en una dirección que queda en los registros de Google. */
  seguimiento:           { guarda: 'publica', soloPost: true, fn: atenderSeguimiento },
  enlace_seguimiento:    { guarda: 'panel', soloPost: true, fn: atenderEnlaceSeguimiento },
  /* 0.11.0 · 2.3 · recuperar la clave sin el operador. Públicas y SOLO POR
     POST: la primera manda un código al correo de la tienda, la segunda lo
     cambia por una clave nueva. */
  recuperar_pedir:       { guarda: 'publica', soloPost: true, fn: atenderRecuperarPedir },
  recuperar_confirmar:   { guarda: 'publica', soloPost: true, fn: atenderRecuperarConfirmar },
  /* 0.11.0 · 4.1 · «Avísame cuando llegue». Contar es público —el comprador
     no tiene sesión—; dar por avisado es del comerciante. */
  avisame:               { guarda: 'publica', fn: function (p) { return atenderAvisame(p); } },
  avisame_hecho:         { guarda: 'panel', soloPost: true, fn: atenderAvisameHecho },
  /* 0.13.0 · 2.2 · el colaborador: lo da y lo quita solo el dueño. */
  colaborador:           { guarda: 'panel', soloPost: true, soloDueno: true, fn: atenderColaborador },
  /* 0.14.0 · actualizar la tienda a la última versión de su semilla. Solo el
     dueño: publica el maestro y cambia el código de la tienda. */
  actualizacion:         { guarda: 'panel', soloPost: true, soloDueno: true, fn: atenderActualizacion },
  actualizar:            { guarda: 'panel', soloPost: true, soloDueno: true, fn: atenderActualizar },
  /* 0.16.0 · 3.4 · el permiso de GitHub lo siembra `conectar` (repositorio de
     servicio), con el token de montaje y solo por POST: viaja en el cuerpo. */
  permiso:               { guarda: 'montaje', soloPost: true, fn: atenderPermiso },
  /* 0.20.0 · El diagnóstico desde el panel. Solo el dueño y solo por POST: el
     informe dice qué le falta a la tienda, qué versión corre y qué está
     mostrando —y el colaborador no administra el montaje—. Nunca lleva el
     token de montaje: eso solo lo imprime `A2_diagnosticoCompleto` en el
     editor, que no se puede llamar desde fuera. */
  diagnostico:           { guarda: 'panel', soloPost: true, soloDueno: true, fn: atenderDiagnostico }
};

/* Cuánto puede pesar lo que se le manda al panel. El registro de pedidos
   viejo tiene su propio tope, más chico, porque viene de cualquiera. */
var MAX_CUERPO_PANEL = 20000;

/* Devuelve el error si no pasa, o null si pasa. */
function guardiaDe(puerta, p) {
  if (puerta.guarda === 'publica' || puerta.guarda === 'menu') return null;
  if (puerta.guarda === 'montaje') {
    return String(p.t || '') === token()
      ? null : { ok: false, error: 'Token que no corresponde a esta tienda.' };
  }
  if (puerta.guarda === 'panel') {
    var s = leerTestigo(p.k);
    if (!s) return { ok: false, error: TESTIGO_MALO };
    if (puerta.soloDueno && s.rol !== 'dueño') return { ok: false, error: SOLO_DUENO };
    /* La sesión ya leída viaja con la petición: quien atiende sabe de quién es
       sin volver a leer el testigo. Se PISA siempre, así que lo que mande la
       página con ese nombre no cuenta. */
    p._sesion = s;
    return null;
  }
  /* Una guardia que no existe NO deja pasar. Es la única respuesta sensata:
     lo contrario es que una errata en el nombre abra la puerta de par en par. */
  return { ok: false, error: 'Puerta mal declarada.' };
}

function doGet(e) {
  try {
    recordarMiUrl();
    var p = (e && e.parameter) ? e.parameter : {};
    if (!p.a) return ContentService.createTextOutput('Servicio activo. Versión ' + VERSION);
    var puerta = PUERTAS[p.a];
    if (!puerta) return json({ ok: false, error: 'Acción desconocida: ' + p.a, version: VERSION });
    if (puerta.soloPost) {
      return json({ ok: false, error: 'Esta puerta se usa por POST: ni la clave ni el ' +
                                      'testigo viajan en la dirección.' });
    }
    var no = guardiaDe(puerta, p);
    if (no) return json(no);
    return json(puerta.fn(p));
  } catch (err) {
    registrarError(err, null);
    return json({ ok: false, error: 'No pudimos validar en este momento.' });
  }
}

/* EL PANEL POR POST. El cuerpo es un JSON en texto plano —así el navegador no
   pregunta antes por CORS— con `a` diciendo qué puerta, y los mismos nombres
   de parámetros que por GET. Pasa por la MISMA tabla y la MISMA guardia: una
   sola lista de puertas, dos maneras de llamar a la puerta. */
function atenderPorPost(cuerpo, largo) {
  var puerta = PUERTAS[cuerpo.a];
  if (!puerta) return { ok: false, error: 'Acción desconocida: ' + cuerpo.a, version: VERSION };
  if (largo > (puerta.tope || MAX_CUERPO_PANEL)) return { ok: false, error: 'Lo enviado es demasiado grande.' };
  var no = guardiaDe(puerta, cuerpo);
  if (no) return no;
  /* Pasada la guardia, un fallo se cuenta con su motivo: quien está del otro
     lado es el comerciante, que entró con su clave, y «No pudimos validar en
     este momento» no le dice qué hacer. Antes de la guardia, nada: ahí puede
     haber cualquiera. */
  try {
    return puerta.fn(cuerpo);
  } catch (err) {
    registrarError('panel ' + cuerpo.a + ': ' + err.message, null);
    return { ok: false, error: 'No se pudo completar: ' + err.message };
  }
}

/* El stub que va dentro de la hoja del cliente, con dos huecos que el maestro
   rellena solo. Vive aquí y no en un archivo aparte por una razón práctica:
   así el menú del stub y el del maestro no se pueden desincronizar, porque
   salen del mismo sitio. */
var PLANTILLA_STUB = [
"/**",
" * CÓDIGO DE LA HOJA",
" * ---------------------------------------------------------------------------",
" * Lo genera el maestro. No se edita: si hace falta cambiarlo, se vuelve a",
" * generar y se pega encima.",
" *",
" * Aquí no hay reglas del negocio: ni precios, ni cupones, ni inventario. Solo",
" * dibuja el menú y le pregunta al maestro qué mostrar. Existe porque un menú",
" * necesita un onOpen que corra bajo la cuenta de quien abre la hoja, y eso es",
" * lo único que no se puede hacer desde afuera.",
" * ---------------------------------------------------------------------------",
" */",
"var MAESTRO = '{{MAESTRO}}';",
"var TOKEN   = '{{TOKEN}}';",
"/* El menú de la hoja se llama como el comercio. Sale de la pestaña",
"   Configuración cuando se genera este código, no del navegador: onOpen",
"   tiene que ser instantáneo. Si el comercio se cambia el nombre, hay que",
"   volver a generar el stub y pegarlo. */",
"var NEGOCIO = '{{NEGOCIO}}';",
"/* Va en cada petición: así el panel sabe qué hojas tienen el código al día",
"   sin que nadie tenga que abrirlas una por una. */",
"var STUB = '{{VERSION}}';",
"",
"/* Esta lista NO se escribe a mano: la genera el maestro a partir de la suya al",
"   producir este código. Escrita dos veces, una se queda atrás y la hoja acaba",
"   ofreciendo una opción que el maestro rechaza, o escondiendo una que existe. */",
"{{OPCIONES}}",
"",
"/* El menú se escribe aquí y no se le pide al maestro a propósito: onOpen tiene",
"   que ser instantáneo. Una petición de red al abrir la hoja se siente como una",
"   hoja lenta, y si el maestro estuviera caído no habría menú. */",
"function onOpen() {",
"  var menu = SpreadsheetApp.getUi().createMenu(NEGOCIO);",
"  OPCIONES.forEach(function (o, i) { menu.addItem(o.rotulo, 'accion' + i); });",
"  menu.addToUi();",
"}",
"",
"/* Una función por opción, porque addItem() pide el NOMBRE de una función y no",
"   acepta un cierre. También se generan. */",
"{{ACCIONES}}",
"",
"function porQueFalla(codigo) {",
"  return 'El servicio contestó una página web (' + codigo + ') en vez de datos.\\n\\n' +",
"    'Casi siempre es que la implementación quedó con acceso \"Solo yo\".\\n\\n' +",
"    'En el proyecto del maestro:\\n' +",
"    'Implementar > Gestionar implementaciones > lápiz >\\n' +",
"    'Quién tiene acceso: Cualquier persona > Implementar.\\n\\n' +",
"    'Para comprobarlo, abre esto en una ventana de incógnito:\\n' +",
"    MAESTRO + '?a=version';",
"}",
"",
"function pedir(i) {",
"  var ui = SpreadsheetApp.getUi();",
"  var libro = SpreadsheetApp.getActiveSpreadsheet();",
"  libro.toast('Un momento…', NEGOCIO, 30);",
"",
"  var r;",
"  try {",
"    var url = MAESTRO + '?a=menu&f=' + encodeURIComponent(OPCIONES[i].id) +",
"              '&t=' + encodeURIComponent(TOKEN) + '&s=' + encodeURIComponent(STUB) +",
"              '&h=' + encodeURIComponent(libro.getId());",
"    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });",
"    var cuerpo = res.getContentText().replace(/^\\s+/, '');",
"    /* Google devuelve una PÁGINA WEB, no datos, cuando la implementación no",
"       es pública. Sin esto el dueño ve un error de JavaScript sin sentido. */",
"    if (cuerpo.charAt(0) !== '{') throw new Error(porQueFalla(res.getResponseCode()));",
"    r = JSON.parse(cuerpo);",
"  } catch (e) {",
"    libro.toast('', NEGOCIO, 1);",
"    ui.alert('No se pudo hablar con el servicio.\\n\\n' + e.message);",
"    return;",
"  }",
"",
"  libro.toast('', NEGOCIO, 1);",
"  if (!r || !r.ok) { ui.alert(String((r && r.error) || 'No hubo respuesta.')); return; }",
"",
"  if (r.tipo === 'html') {",
"    ui.showModalDialog(",
"      HtmlService.createHtmlOutput(r.html).setWidth(760).setHeight(600),",
"      r.titulo || NEGOCIO);",
"  } else {",
"    ui.alert(String(r.texto || 'Listo.'));",
"  }",
"}"
].join('\n');

/* La URL de este propio despliegue. Es lo que permite que el maestro escriba
   el stub y el bloque de index.html ya completos, en vez de dejar huecos
   "PEGA_AQUÍ" que alguien tiene que rellenar sin equivocarse.

   AQUÍ HUBO UN ERROR CARO Y VALE LA PENA DEJARLO ESCRITO.
   getUrl() devuelve la /dev cuando se ejecuta desde el editor y la /exec
   cuando se ejecuta dentro de la aplicación web publicada. Durante un tiempo
   esto convertía una en otra cambiando el final: u.replace(/\/dev$/, '/exec').

   No funciona. Las dos URL llevan identificadores DISTINTOS —la /dev va con
   el del proyecto y la /exec con el de la implementación—, así que ese cambio
   fabrica una dirección que no existe. Y como terminaba en /exec, pasaba la
   comprobación de "ya está publicado" y se colaba al stub y al index. El
   síntoma era una página web de error en vez de datos, que es lo último que
   uno relaciona con esto.

   La solución no adivina: el maestro APRENDE su propia dirección. Cuando la
   aplicación web atiende una petición, se está ejecutando como aplicación
   web, y ahí getUrl() sí devuelve la /exec buena. Se guarda y se reutiliza.
   Basta con abrir la URL una vez —cosa que la lista de despliegue ya manda
   hacer para comprobar el acceso— para que quede aprendida. */
function miUrl() {
  try { return ScriptApp.getService().getUrl() || ''; }
  catch (e) { return ''; }
}

function recordarMiUrl() {
  try {
    var u = miUrl();
    if (!/\/exec$/.test(u)) return;                  // desde el editor: es la /dev
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty('URL_EXEC') !== u) props.setProperty('URL_EXEC', u);
  } catch (e) { /* aprender nunca puede tumbar una petición */ }
}

function urlLista() {
  var u = miUrl();
  if (/\/exec$/.test(u)) return u;                   // dentro de la aplicación web
  try {
    return PropertiesService.getScriptProperties().getProperty('URL_EXEC') || '';
  } catch (e) { return ''; }
}

/* El stub, ya completo. Se copia y se pega: no queda nada por llenar. */
function generarStub() {
  var url = urlLista();
  /* EL DEL MENÚ, NO EL DE MONTAJE. Ver tokenMenu(): lo que se pega en la hoja
     lo lee el comerciante en su editor, y de ahí sale a una captura o a un
     chat. Este solo abre ?a=menu. */
  var t = tokenMenu();
  var falta = !url;

  /* El nombre del comercio, para el menú. Si la hoja no se puede abrir o
     todavía no tiene nombre, el menú dice "Tienda": un rótulo neutro es
     preferible a quemar el nombre de otro comercio en la hoja de este. */
  var comoSeLlama = 'Tienda';
  try {
    var puesto = String(leerConfiguracion().negocio || '').trim();
    if (puesto) comoSeLlama = puesto;
  } catch (e) { }

  /* El menú del stub sale de la MISMA lista que valida el maestro. Antes eran
     dos copias escritas a mano —la de aquí y la de ACCIONES_MENU— y bastaba con
     tocar una para que la hoja ofreciera algo que el maestro rechaza. */
  var opciones = menuDeLaHoja();
  var anchoRotulo = 0;
  opciones.forEach(function (o) { anchoRotulo = Math.max(anchoRotulo, o.rotulo.length); });
  var lineasOpciones = ['var OPCIONES = ['].concat(opciones.map(function (o, i) {
    var relleno = new Array(anchoRotulo - o.rotulo.length + 1).join(' ');
    return "  { rotulo: '" + o.rotulo.replace(/'/g, "\\'") + "'," + relleno +
           " id: '" + o.id + "' }" + (i < opciones.length - 1 ? ',' : '');
  })).concat(['];']).join('\n');
  var lineasAcciones = opciones.map(function (o, i) {
    return 'function accion' + i + '() { pedir(' + i + '); }';
  }).join('\n');

  var codigo = PLANTILLA_STUB
    .replace('{{MAESTRO}}', url || 'TODAVÍA_NO_SE_SABE_LA_URL')
    .replace('{{TOKEN}}', t)
    .replace('{{VERSION}}', VERSION)
    .replace('{{NEGOCIO}}', comoSeLlama.replace(/'/g, "\\'"))
    .replace('{{OPCIONES}}', lineasOpciones)
    .replace('{{ACCIONES}}', lineasAcciones);

  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var nota = 'margin:0 0 10px;font:400 12px/1.55 Arial,sans-serif;color:#666';
  var boton = 'margin-top:8px;padding:8px 15px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    (falta
      ? '<p style="' + nota + ';color:#B3261E"><b>Todavía no sé mi propia dirección.</b> ' +
        'Publica el proyecto (Implementar &gt; Aplicación web · Ejecutar como: Yo · ' +
        'Acceso: cualquier persona) y luego <b>abre esa URL una vez en el navegador</b>. ' +
        'Desde el editor Google solo me dice la dirección /dev, que no le sirve a nadie ' +
        'más. Después vuelve a generar el stub y saldrá completo.</p>'
      : '<p style="' + nota + ';color:#111;font-size:13px">Ya lleva la URL y el token. ' +
        '<b>No hay nada que llenar.</b></p>') +
    '<p style="' + nota + '">En la hoja del cliente: <b>Extensiones &gt; Apps Script</b>, ' +
    'borra lo que haya, pega esto y guarda. Recarga la hoja y aparece el menú.</p>' +
    '<textarea id="a" rows="20" style="' + caja + '" readonly>' + escaparHtml(codigo) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar()">Copiar el stub</button>' +
    '<script>function copiar(){var t=document.getElementById("a");t.select();' +
    't.setSelectionRange(0,999999);try{document.execCommand("copy");' +
    'var b=document.querySelector("button");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent="Copiar el stub";},1800);}catch(e){}}<\/script>' +
    '</div>';

  console.log(codigo);
  return { tipo: 'html', titulo: 'Código para pegar en la hoja', html: html, codigo: codigo };
}

/* La puerta del stub. Sin token no se abre, y solo deja pasar las acciones
   que estén en la lista blanca. */
/* ============================================================================
   LA PUERTA DEL PANEL
   ----------------------------------------------------------------------------
   Un tablero central que vigila muchas tiendas no puede entrar a la hoja de
   cada una: son cuentas de Google distintas, y compartir cada hoja con una
   cuenta administradora sería justo el acoplamiento que evitamos.

   En vez de eso, cada maestro publica un resumen de SU tienda por esta puerta
   y el panel lo pregunta. La tienda sigue siendo dueña de sus datos; lo único
   que sale son cifras agregadas, nunca un pedido ni un dato de un cliente.

   Va detrás del mismo token que el menú, por la misma razón: no es un secreto
   fuerte, es lo que impide que un tercero que adivine la URL se lleve las
   cifras de ventas de un negocio ajeno.
   ============================================================================ */
/* ============================================================================
   POR QUÉ 46 LÍNEAS SIGUEN VIVIENDO DENTRO DE LA HOJA
   ----------------------------------------------------------------------------
   Medido el 6 de septiembre de 2026, no supuesto.

   Todo lo que la hoja necesita lo hace este proyecto desde afuera, con
   disparadores instalables —alEditar, recalcularResumen, respaldoSemanal—, que
   corren con NUESTRA autorización y por eso sí pueden usar UrlFetchApp,
   MailApp y DriveApp. Quedaba una duda razonable: si un disparador instalable
   de apertura podía dibujarle el menú al comerciante, el stub sobraba.

   Se montó el experimento y dio esto:

     1. El menú SÍ le aparece al comerciante. Un disparador instalable de
        apertura le dibuja interfaz a otro usuario. La documentación de Google
        no lo dice en ninguna parte.
     2. Pero TOCAR una opción falla, con PERMISSION_DENIED.

   El mecanismo, que es lo que vale la pena recordar: un disparador instalable
   corre bajo nuestra cuenta, sí, pero eso vale para el manejador de apertura.
   Cuando el comerciante hace clic en una opción, esa función se invoca bajo
   SU cuenta, dentro de ESTE proyecto — que no es suyo y no puede leer. De ahí
   el error de permisos.

   Por eso los disparadores que nadie toca (alEditar, los de tiempo) funcionan
   perfecto desde aquí, y un menú no. La frontera no es la autorización: es de
   quién es el proyecto donde vive la función que se ejecuta.

   Conclusión: el stub se queda. Sus opciones llaman a funciones que viven en
   la hoja del comerciante —que sí es suya—, y esas funciones piden por HTTP.
   El precio son 46 líneas sin una sola regla de negocio y una autorización que
   el comerciante da una vez.

   Se conserva quitarMenuDePrueba() para desmontar el experimento en cualquier
   tienda donde se haya llegado a instalar.
   ============================================================================ */
function quitarMenuDePrueba() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'menuDePrueba') { ScriptApp.deleteTrigger(t); n++; }
  });
  console.log(n ? 'Quitado. Recarga la hoja.' : 'No había ninguno.');
}

/* ============================================================================
   EL RESPALDO SEMANAL
   ----------------------------------------------------------------------------
   La hoja ES la base de datos. El historial de versiones de Google salva de un
   borrado accidental, pero no de perder la cuenta, y como cada tienda vive en
   una cuenta distinta, perder una cuenta es perder una tienda entera.

   Se copia con makeCopy y no exportando el archivo. La diferencia no es de
   estilo: makeCopy lo resuelve Drive de su lado, sin pasar un solo byte por el
   script, así que tarda lo mismo con una hoja de cien filas que con una de cien
   mil y no gasta el presupuesto de ejecución. Exportar a XLSX obligaría a
   descargar y volver a subir el archivo entero cada semana.

   La copia la crea la cuenta de la tienda dentro de una carpeta del
   administrador, así que el administrador tiene que haberle dado permiso de
   edición sobre esa carpeta. Es un permiso sobre UNA carpeta de respaldos: no
   le abre nada más de su Drive.
   ============================================================================ */
var RESPALDOS_QUE_SE_GUARDAN = 8;      // dos meses de copias semanales

function respaldoSemanal() {
  try {
    var r = respaldarHoja();
    registrarRespaldo({ fecha: new Date().toISOString(), archivo: r.nombre,
                        borradas: r.borradas });
  } catch (err) {
    registrarRespaldo({ fecha: new Date().toISOString(), error: err.message });
    registrarError('respaldo: ' + err.message, null);
  }
}

function respaldarHoja() {
  var c = leerConfiguracion();
  var id = idDeCarpeta(c.respaldo_carpeta);
  if (!id) throw new Error(
    'Falta respaldo_carpeta en la pestaña Configuración: pega ahí el enlace de ' +
    'la carpeta de respaldos del administrador, y pídele que le dé permiso de ' +
    'edición a esta cuenta.');

  var destino;
  try { destino = DriveApp.getFolderById(id); }
  catch (e) { throw new Error(
    'No pude abrir la carpeta de respaldos. Casi siempre es que esta cuenta ' +
    'no tiene permiso de edición sobre ella. (' + id + ')'); }

  var libro = elLibro();
  var prefijo = 'Copia_de_' + libro.getName().replace(/[\/\\]/g, '-') + '_';
  var nombre = prefijo + diaDeHoy();

  var copia;
  try { copia = DriveApp.getFileById(HOJA_ID).makeCopy(nombre, destino); }
  catch (e) { throw new Error('No pude crear la copia: ' + e.message); }

  return { nombre: copia.getName(), id: copia.getId(),
           borradas: podarRespaldos(destino, prefijo, copia.getId()) };
}

/* Sin esto la carpeta del administrador crece para siempre. Se borran SOLO las
   copias de esta tienda —las demás llevan otro prefijo— y nunca la recién
   hecha, para que un reloj mal puesto no deje a la tienda sin ninguna. */
function podarRespaldos(destino, prefijo, idNueva) {
  var mias = [];
  var it = destino.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(prefijo) !== 0) continue;
    if (f.getId() === idNueva) continue;
    mias.push({ f: f, cuando: f.getDateCreated().getTime() });
  }
  mias.sort(function (a, b) { return b.cuando - a.cuando; });

  var borradas = 0;
  mias.slice(RESPALDOS_QUE_SE_GUARDAN - 1).forEach(function (x) {
    try { x.f.setTrashed(true); borradas++; } catch (e) { /* que siga */ }
  });
  return borradas;
}

function registrarRespaldo(dato) {
  PropertiesService.getScriptProperties().setProperty('RESPALDO', JSON.stringify(dato));
}

function ultimoRespaldo() {
  try { return JSON.parse(
    PropertiesService.getScriptProperties().getProperty('RESPALDO') || '{}'); }
  catch (e) { return {}; }
}

/* ============================================================================
   VOLVER ATRÁS: LOS DATOS (0.18.0 · bitácora 77)
   ----------------------------------------------------------------------------
   Había copias y no había vuelta: ocho copias semanales en el Drive del
   administrador, y para usarlas tocaba abrir la copia, mirar, y pegar celdas a
   mano en la hoja viva. Eso a las once de la noche, con la tienda vendiendo,
   es cuando se pisa lo que no era.

   EL MODELO ENTERO CABE EN TRES FRASES, una por cosa que se puede perder:
     · los datos  →  las copias de la hoja (esto).
     · el código  →  las etiquetas vX.Y.Z de la semilla: `restaurar` › versión.
     · el sitio   →  los commits de main: `restaurar` › sitio.
   Ninguna inventa infraestructura nueva: los tres puntos de restauración ya
   existían, lo que faltaba era la manera de volver a ellos sin manos.

   LO QUE NO SE RESTAURA, Y POR QUÉ. Pedidos, Pagos, Datos de entrega, Avísame,
   Registro, Errores: son lo que PASÓ, no lo que se configuró. Traer el Pedidos
   del domingo un miércoles borra los pedidos del lunes y el martes —clientes
   reales esperando— para arreglar un catálogo. Restaurar esas pestañas es peor
   que el problema que vino a arreglar, así que aquí no se puede.

   Y ANTES DE TOCAR NADA, UNA COPIA. La restauración es en sí misma una
   operación destructiva: si se restaura la pestaña equivocada, lo que se acaba
   de perder es el trabajo de esta semana. La copia de seguridad previa hace
   que ese error tenga vuelta, y cuesta un segundo (makeCopy la resuelve Drive).
   ============================================================================ */
/* UNA FUNCIÓN Y NO UNA CONSTANTE: los nombres de las pestañas se declaran más
   abajo en el archivo, y un `var` de aquí arriba se quedaría con la mitad en
   `undefined` —la lista decía «Catálogo, Configuración, Envíos, Cupones, » y
   la pestaña que faltaba era justo la de variantes—. Esto se evalúa cuando se
   llama, que es cuando todo existe. */
function pestanasRestaurables() {
  return [H_CATALOGO, H_CONFIG, H_ENVIOS, H_CUPONES, H_INVENTARIO_VARIANTE];
}

/** A5 · Las copias que hay, la más nueva primero. Lee lo que imprime. */
function A5_respaldos() {
  var l = listarRespaldos();
  if (!l.length) {
    console.log('No hay ninguna copia todavía. Ejecuta A4_respaldoAhora().');
    return l;
  }
  console.log('Copias de esta hoja (la más nueva primero):\n');
  l.forEach(function (x, i) {
    console.log((i + 1) + '. ' + x.nombre + '   ' + x.cuando.toISOString().slice(0, 10) + '   ' + x.id);
  });
  console.log('\nPara volver a una: A6_restaurarDatos(\'ultimo\', \'' +
              pestanasRestaurables().slice(0, 2).join(',') + '\')');
  console.log('Se puede restaurar: ' + pestanasRestaurables().join(', ') + '.');
  return l;
}

/** A6 · Volver una o varias pestañas a como estaban en una copia. */
function A6_restaurarDatos(copia, pestanas) { return restaurarDatos(copia, pestanas); }

/* Las copias de ESTA hoja que hay en la carpeta de respaldos. El prefijo es el
   mismo que pone respaldarHoja(): las de otras tiendas llevan otro. */
function listarRespaldos() {
  var c = leerConfiguracion();
  var id = idDeCarpeta(c.respaldo_carpeta);
  if (!id) throw new Error(
    'Falta respaldo_carpeta en la pestaña Configuración: sin carpeta de ' +
    'respaldos no hay copias que restaurar.');
  var destino;
  try { destino = DriveApp.getFolderById(id); }
  catch (e) { throw new Error('No pude abrir la carpeta de respaldos (' + id + ').'); }

  var prefijo = 'Copia_de_' + elLibro().getName().replace(/[\/\\]/g, '-') + '_';
  var lista = [];
  var it = destino.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(prefijo) !== 0) continue;
    lista.push({ nombre: f.getName(), id: f.getId(), cuando: f.getDateCreated() });
  }
  lista.sort(function (a, b) { return b.cuando.getTime() - a.cuando.getTime(); });
  return lista;
}

/* Qué copia es «esa». Acepta el número de A5_respaldos, el nombre, el ID, o
   nada / «ultimo» para la más reciente: quien restaura a las once de la noche
   no debería tener que acertar con un ID de 44 caracteres. */
function laCopia(copia, lista) {
  var t = String(copia === undefined || copia === null ? '' : copia).trim();
  if (!lista.length) throw new Error(
    'No hay ninguna copia de esta hoja en la carpeta de respaldos.');
  if (!t || /^(ultim|últim)/i.test(t)) return lista[0];
  if (/^[0-9]+$/.test(t)) {
    var n = parseInt(t, 10);
    if (n >= 1 && n <= lista.length) return lista[n - 1];
    throw new Error('Solo hay ' + lista.length + ' copias: pide entre 1 y ' + lista.length + '.');
  }
  var uno = lista.filter(function (x) { return x.id === t || x.nombre === t; })[0];
  if (!uno) throw new Error(
    'No encuentro esa copia entre las de esta hoja. Ejecuta A5_respaldos() para verlas.');
  return uno;
}

/* Qué pestañas. Se piden por su nombre, separadas por comas: una lista vacía
   NO significa «todas» —restaurar todo por un dedo resbalado es justo lo que
   esto tiene que hacer imposible—. */
function lasPestanas(pestanas) {
  var pedidas = String(pestanas || '').split(',').map(function (x) { return x.trim(); })
                  .filter(function (x) { return x; });
  if (!pedidas.length) throw new Error(
    'Dime qué pestañas restaurar, separadas por comas. Se puede: ' +
    pestanasRestaurables().join(', ') + '.');
  var fuera = pedidas.filter(function (x) { return pestanasRestaurables().indexOf(x) === -1; });
  if (fuera.length) throw new Error(
    'No se puede restaurar ' + fuera.join(', ') + '. Solo: ' + pestanasRestaurables().join(', ') +
    '. Pedidos, Pagos, Datos de entrega, Avísame y el Registro son lo que pasó, ' +
    'no lo que se configuró: traerlos de una copia borra las ventas de esta semana.');
  return pedidas;
}

function restaurarDatos(copia, pestanas) {
  var pedidas = lasPestanas(pestanas);
  var elegida = laCopia(copia, listarRespaldos());

  var origen;
  try { origen = SpreadsheetApp.openById(elegida.id); }
  catch (e) { throw new Error('No pude abrir la copia ' + elegida.nombre + ': ' + e.message); }

  /* ¿ES UNA COPIA DE ESTA TIENDA? El prefijo del nombre ya lo dice, pero el
     nombre se puede cambiar a mano. El comercio de su Configuración no. */
  var mio = String(leerConfiguracion().negocio || '').trim();
  var suyo = '';
  try {
    var hc = origen.getSheetByName(H_CONFIG);
    if (hc) {
      hc.getDataRange().getValues().forEach(function (f) {
        if (String(f[0]).trim() === 'negocio') suyo = String(f[1] || '').trim();
      });
    }
  } catch (e) { }
  if (mio && suyo && mio !== suyo) throw new Error(
    'Esa copia es de «' + suyo + '» y esta hoja es de «' + mio + '». No restauro ' +
    'datos de otra tienda.');

  /* Una copia ANTES: restaurar también se puede hacer mal. */
  var seguridad = respaldarHoja();

  var libro = elLibro();
  var hechas = [], anotaciones = [];
  pedidas.forEach(function (nombre) {
    var de = origen.getSheetByName(nombre);
    if (!de) throw new Error('La copia ' + elegida.nombre + ' no tiene la pestaña ' + nombre + '.');
    var a = libro.getSheetByName(nombre);
    if (!a) throw new Error('Esta hoja no tiene la pestaña ' + nombre + '.');
    var datos = de.getDataRange().getValues();
    var ancho = 0;
    datos.forEach(function (f) { ancho = Math.max(ancho, f.length); });
    if (!datos.length || !ancho) throw new Error('La pestaña ' + nombre + ' de la copia está vacía.');
    var filasAntes = a.getLastRow();
    /* SOLO EL CONTENIDO, no clear(): el formato, los anchos y las validaciones
       de la pestaña viva son de la versión de hoy, no de la copia. Lo que se
       restaura son los DATOS. */
    if (filasAntes) a.getRange(1, 1, filasAntes, Math.max(1, a.getLastColumn())).clearContent();
    a.getRange(1, 1, datos.length, ancho).setValues(datos.map(function (f) {
      var g = f.slice(0, ancho);
      while (g.length < ancho) g.push('');
      return g;
    }));
    hechas.push({ pestana: nombre, filas: datos.length - 1, antes: Math.max(0, filasAntes - 1) });
    anotaciones.push({ que: 'Restaurado desde una copia', donde: nombre,
                       antes: Math.max(0, filasAntes - 1) + ' filas',
                       despues: (datos.length - 1) + ' filas (' + elegida.nombre + ')' });
  });

  var dato = { fecha: new Date().toISOString(), desde: elegida.nombre,
               pestanas: hechas.map(function (x) { return x.pestana; }),
               seguridad: seguridad.nombre };
  try { PropertiesService.getScriptProperties().setProperty('RESTAURACION', JSON.stringify(dato)); } catch (e) { }
  try { anotarCambios('restaurar', 'A6_restaurarDatos', anotaciones); } catch (e) { }
  try { cacheFuera(); } catch (e) { }

  console.log('Restaurado desde ' + elegida.nombre + ': ' +
              hechas.map(function (x) { return x.pestana + ' (' + x.filas + ' filas)'; }).join(', ') +
              '.\nAntes de tocar nada se guardó ' + seguridad.nombre + '.' +
              '\nAhora publica la tienda para que el sitio muestre lo restaurado.');
  return { ok: true, desde: elegida.nombre, seguridad: seguridad.nombre, pestanas: hechas };
}

function ultimaRestauracion() {
  try { return JSON.parse(
    PropertiesService.getScriptProperties().getProperty('RESTAURACION') || '{}'); }
  catch (e) { return {}; }
}

/* ============================================================================
   CUÁNTO SE USA ESTA TIENDA
   ----------------------------------------------------------------------------
   El límite que de verdad puede doler no se compra: son 30 ejecuciones
   simultáneas por cuenta de Google, y no sube con Workspace. Google tampoco
   lo expone: no hay forma de preguntar "cuántas van". Lo que sí se puede
   medir es la carga que lo empuja, que es cuántas veces se leyó el catálogo.

   Se cuenta en la caché, que es barata, y una vez por hora el disparador que
   ya existe lo pasa a una propiedad del proyecto. Contar directo en las
   propiedades sería una escritura por visitante; contar solo en la caché se
   perdería cada seis horas.

   El conteo se queda corto cuando dos visitantes caen en el mismo instante:
   es una señal de carga, no una auditoría, y así hay que leerla.
   ============================================================================ */
function contarLectura() {
  try {
    var c = CacheService.getScriptCache();
    var n = Number(c.get('lecturas') || 0) + 1;
    c.put('lecturas', String(n), 21600);
  } catch (e) { /* contar nunca puede tumbar una visita */ }
}

function consolidarLecturas() {
  var c = CacheService.getScriptCache();
  var nuevas = Number(c.get('lecturas') || 0);
  if (!nuevas) return;
  c.remove('lecturas');

  var props = PropertiesService.getScriptProperties();
  var hoy = diaDeHoy();
  var guardado = {};
  try { guardado = JSON.parse(props.getProperty('LECTURAS') || '{}'); } catch (e) {}
  if (guardado.dia !== hoy) {
    guardado = { dia: hoy, total: 0, pico: 0, ayer: guardado.total || 0 };
  }
  guardado.total = (guardado.total || 0) + nuevas;
  /* EL PICO, NO EL TOTAL, ES LO QUE ACERCA AL TECHO. El límite de Apps Script
     es de CONCURRENCIA —30 ejecuciones a la vez—, no de volumen: mil visitas
     repartidas en el día no son nada y cien en el mismo minuto sí. Esto corre
     una vez por hora, así que `nuevas` es exactamente lo que entró en la última
     hora, y el mayor de esos números es la señal que hay que mirar.
     Es la condición de disparo de DECISIONES.md 01, que sin esto no se podía
     observar. */
  guardado.pico = Math.max(guardado.pico || 0, nuevas);
  props.setProperty('LECTURAS', JSON.stringify(guardado));
}

function diaDeHoy() {
  var d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) +
         '-' + ('0' + d.getDate()).slice(-2);
}

/* El mayor número de lecturas que entró en una sola hora, hoy. La hora en
   curso todavía no está consolidada, así que se cuenta aparte: si la campaña
   está ocurriendo AHORA, es justo cuando hay que verlo. */
function picoDeHoy() {
  var g = {};
  try { g = JSON.parse(PropertiesService.getScriptProperties()
    .getProperty('LECTURAS') || '{}'); } catch (e) {}
  var enCurso = 0;
  try { enCurso = Number(CacheService.getScriptCache().get('lecturas') || 0); } catch (e) {}
  var consolidado = (g.dia === diaDeHoy() ? (g.pico || 0) : 0);
  return Math.max(consolidado, enCurso);
}

function lecturasDeHoy() {
  var props = PropertiesService.getScriptProperties();
  var g = {};
  try { g = JSON.parse(props.getProperty('LECTURAS') || '{}'); } catch (e) {}
  var sinConsolidar = 0;
  try { sinConsolidar = Number(CacheService.getScriptCache().get('lecturas') || 0); } catch (e) {}
  return (g.dia === diaDeHoy() ? (g.total || 0) : 0) + sinConsolidar;
}

/* ============================================================================
   LA PUERTA DEL MONTAJE
   ----------------------------------------------------------------------------
   Lo mismo que muestra "Generar configuración para index.html", pero en JSON y
   sin envolver en HTML, para que el montaje lo aplique sin que nadie copie ni
   pegue. El menú sigue existiendo: es la salida manual cuando algo falla.
   ============================================================================ */
/* ScriptApp.getScriptId() no existe en runtimes viejos, y una tienda que no lo
   tenga no debe quedarse sin poder montar: se devuelve vacío y quien lo use
   pide el dato a mano. */
function idDeEsteProyecto() {
  try { return ScriptApp.getScriptId ? ScriptApp.getScriptId() : ''; }
  catch (e) { return ''; }
}

/* QUIÉN SOY, SIN TOCAR LA HOJA.
   Todas las demás puertas abren la hoja para contestar, así que un maestro que
   se quedó sin HOJA_ID no puede decir NADA de sí mismo — ni siquiera cuál era
   su hoja. Eso dejaba una dependencia circular: la herramienta que arregla el
   valor se lo preguntaba al maestro que lo perdió.

   Esta puerta contesta con lo que vive en el propio archivo y en las
   propiedades del proyecto, que no necesitan la hoja. Lo que sí la necesita va
   aparte y con su propio aviso, para que se pueda diagnosticar en vez de
   fallar entero. */
function atenderIdentidad(p) {
  var r = { ok: true, version: VERSION, scriptId: idDeEsteProyecto(),
            hojaId: HOJA_ID, url: urlLista(), hojaOk: false };
  try {
    r.hoja = elLibro().getUrl();
    r.negocio = String(leerConfiguracion().negocio || '');
    r.hojaOk = true;

    /* AL FINAL, QUE ES DONDE VAN LOS CAMPOS NUEVOS (R1).
       QUÉ REPOSITORIO DICE ESTA HOJA QUE ES EL SUYO. Hasta ahora esta clave
       solo la miraba «Publicar ahora» para saber a quién disparar; el camino
       de vuelta no existía, y por eso un flujo no tenía forma de saber que
       estaba publicando la hoja de OTRO comercio en este repositorio.
       Pasó: dos tiendas montadas a la vez, y los cambios de una aparecieron
       en el sitio de la otra. El síntoma —«subí una foto y salió allá»— no
       apunta a ninguna parte, porque todas las piezas funcionan: cada una
       está haciendo bien su trabajo con la hoja equivocada.
       Con esto, el flujo compara contra su propio GITHUB_REPOSITORY y se
       planta antes de escribir nada. Vacío no bloquea: hay tiendas montadas
       antes de que esta clave existiera. */
    r.repositorio = String(leerConfiguracion().repositorio || '').trim();
  } catch (e) {
    r.problema = e.message;
  }
  return r;
}

function atenderBloques(p) {
  try {
    /* PINTAR LA CELDA TIENE QUE BASTAR, Y NO BASTABA.
       La ayuda de la fila dice «PINTA la celda de al lado con el color que
       quieras y el código sale solo». Sale solo, sí — pero solo lo sacaba
       `instalar()`, porque cambiar el RELLENO de una celda no dispara
       `onEdit`: para Google eso es formato, no contenido. Así que quien pintó
       los colores y publicó se llevó los de la plantilla, sin un aviso en
       ninguna parte.
       Aquí es donde los colores se van a usar de verdad, así que aquí se leen
       los rellenos. Es una escritura en una puerta de lectura, y es a
       propósito: esta puerta solo la abre el montaje con el token, una vez por
       despliegue, y es el último momento en que se puede arreglar. Si falla,
       no se lleva por delante la publicación. */
    /* PRIMERO SE MIRA LO QUE ESCRIBIÓ, Y DESPUÉS SE REPARA.
       Al revés no se ve nada: la sincronización pisa un valor ilegible con el
       relleno que hubiera antes —repara, que está bien— y entonces «#D21» o
       «rojo» desaparecen sin que nadie se entere de que alguien eligió un
       color y no le llegó. Se anota antes, se arregla después. */
    var coloresMalos = coloresIlegibles();
    try { sincronizarColores(); } catch (e) { }

    var r = generarConfiguracion();
    var c = leerConfiguracion();
    return { ok: true, version: VERSION, head: r.bloque, valores: r.valores,
             /* Para que el montaje escriba solo sus propios archivos de
                configuración. El scriptId es el dato que hasta ahora había que
                sacar a mano de la barra de direcciones; el maestro se lo sabe. */
             scriptId: idDeEsteProyecto(),
             negocio: String(c.negocio || ''),
             hoja: elLibro().getUrl(),
             /* El único valor que se escribe a mano en este archivo, y por eso
                el único que se pierde al volver a subirlo desde el repositorio.
                Sale por aquí para que el montaje pueda devolverlo en su sitio. */
             hojaId: HOJA_ID,

             /* AL FINAL, QUE ES DONDE VAN LOS CAMPOS NUEVOS (R1). Lo he puesto
                en medio tres veces y las tres lo ha cazado la batería de
                esquema; el sitio correcto no se me queda, el guardián sí.

                Lo que le falta a esta tienda para estar terminada. El montaje lo
                usa para negarse a escribir el index de una tienda que no puede
                vender: hasta ahora miraba cinco claves y las otras once no las
                miraba nadie. */
             alta: revisarTienda(c),

             /* Y AL FINAL DEL TODO (R1), LOS COLORES QUE VA A USAR LA TIENDA.
                No para que el montaje los aplique —eso lo hace la página, con
                la configuración que ya recibe— sino para que los DIGA. «Se
                publicó con los colores de la plantilla» era invisible hasta
                abrir la tienda y mirarla; ahora sale en el log del montaje,
                junto con los que no se pudieron leer. */
             colores: {
               principal:  String(c.color_principal  || ''),
               secundario: String(c.color_secundario || ''),
               alterno:    String(c.color_alterno    || ''),
               ilegibles:  coloresMalos
             } };
  } catch (err) {
    registrarError('bloques: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

/* ============================================================================
   SEMBRAR LA CONFIGURACIÓN DESDE EL MONTAJE
   ----------------------------------------------------------------------------
   La única puerta que ESCRIBE. Todas las demás leen, y eso era una propiedad
   del diseño que vale la pena no perder por descuido, así que aquí está lo que
   la acota:

   · Solo estas seis claves. Ni el catálogo, ni los precios, ni los pedidos, ni
     los datos legales, ni nada que no esté en SEMBRABLES.
   · Un valor vacío no borra nada. Sembrar es poner lo que falta, no vaciar.
   · No pisa lo que el comercio escribió. Solo escribe donde la celda está
     vacía o donde sigue el valor de fábrica. Para lo demás hay que pedirlo a
     propósito con forzar=si, y aun así queda dicho en la respuesta qué se
     cambió.

   POR QUÉ HACE FALTA. instalar() deja el nombre y el sitio entre corchetes y
   el WhatsApp vacío, a propósito: una tienda sin configurar tiene que verse sin
   configurar, no funcionar mandándole los pedidos a otro. Llenar esas celdas a
   mano era el paso más aburrido del despliegue y el más fácil de dejar a
   medias. Ahora lo hace el flujo de montaje con lo que el técnico escribió una
   sola vez al dispararlo.
   ========================================================================== */
var SEMBRABLES = ['negocio', 'whatsapp', 'sitio_url', 'fotos_origen',
                  'fotos_drive', 'respaldo_carpeta', 'correo_resumen',
                  'fotos_webp',
                  /* 0.15.0 · al final: el alta (`conectar`, en el repositorio
                     de servicio) ya sabe de qué repositorio es la tienda.
                     Sin esto, Publicar y Actualizar desde el panel esperaban a
                     que alguien lo escribiera a mano. */
                  'repositorio'];

function escribirConfiguracion(cambios) {
  var h = elLibro().getSheetByName(H_CONFIG);
  // filas() ya salta el encabezado, así que la fila i de aquí es la i+2 de la
  // hoja. Una clave que no exista en la pestaña no se crea: instalar() es
  // quien crea claves, y esta puerta solo rellena las que ya están.
  var datos = filas(H_CONFIG);
  var escritas = [];
  for (var i = 0; i < datos.length; i++) {
    var clave = String(datos[i][0]).trim();
    if (!cambios.hasOwnProperty(clave)) continue;
    h.getRange(i + 2, 2).setValue(cambios[clave]);
    escritas.push(clave);
  }
  return escritas;
}

function atenderSembrar(p) {
  try {
    var c = leerConfiguracion();
    var forzar = String(p.forzar || '') === 'si';
    var pedido = {};

    SEMBRABLES.forEach(function (k) {
      var v = String(p[k] === undefined || p[k] === null ? '' : p[k]).trim();
      if (v) pedido[k] = v;
    });

    /* Las dos que se deducen y nadie debería tener que escribir: las fotos
       servibles viven en la carpeta /fotos del propio sitio, y si el montaje
       las va a convertir es porque van a existir en varios tamaños. */
    if (pedido.sitio_url && !pedido.fotos_origen) {
      pedido.fotos_origen = pedido.sitio_url.replace(/\/+$/, '') + '/fotos';
    }
    if (pedido.fotos_drive && !pedido.fotos_webp) pedido.fotos_webp = 'Sí';

    var cambios = {}, escritos = [], iguales = [], respetados = [];
    Object.keys(pedido).forEach(function (k) {
      var actual = String(c[k] === undefined ? '' : c[k]).trim();
      if (actual === pedido[k]) { iguales.push(k); return; }
      var sinTocar = !actual || actual === String(valorDeFabrica(k)).trim();
      if (!sinTocar && !forzar) { respetados.push(k); return; }
      cambios[k] = pedido[k];
    });

    if (Object.keys(cambios).length) escritos = escribirConfiguracion(cambios);

    var faltan = SEMBRABLES.filter(function (k) {
      if (k === 'fotos_webp' || k === 'correo_resumen' || k === 'repositorio') return false;
      var v = String(c[k] === undefined ? '' : c[k]).trim();
      if (cambios[k]) return false;
      return !v || v === String(valorDeFabrica(k)).trim();
    });

    return { ok: true, version: VERSION, escritos: escritos, iguales: iguales,
             respetados: respetados, faltan: faltan };
  } catch (err) {
    registrarError('sembrar: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

/* ============================================================================
   LAS FOTOS CRUDAS DEL COMERCIO
   ----------------------------------------------------------------------------
   Capa 1 -> capa 2. El comercio sube sus fotos a una carpeta de Drive y no
   hace nada más: no instala, no convierte, no sabe qué es un repositorio.

   Se listan por una puerta y se bajan de a una por otra. De a una a propósito:
   Apps Script corta cada ejecución a los seis minutos y una respuesta tiene
   techo de tamaño, así que veinte fotos en una sola respuesta es exactamente
   la forma de que falle el día que el comercio suba fotos grandes.
   ============================================================================ */
var FOTOS_ACEPTADAS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'];

function carpetaDeFotos() {
  var c = leerConfiguracion();
  var id = idDeCarpeta(c.fotos_drive);
  if (!id) throw new Error(
    'Falta fotos_drive en la pestaña Configuración: pega ahí el enlace de la ' +
    'carpeta de Drive donde el comercio sube sus fotos.');
  try { return DriveApp.getFolderById(id); }
  catch (e) { throw new Error(
    'No pude abrir esa carpeta de Drive. Revisa que el identificador sea el ' +
    'de una carpeta y que esta cuenta tenga acceso. (' + id + ')'); }
}

/* Sirve tanto el identificador pelado como el enlace completo que copia
   cualquiera desde la barra del navegador. */
function idDeCarpeta(v) {
  var t = String(v || '').trim();
  if (!t) return '';
  var m = t.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  m = t.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(t) ? t : '';
}

function atenderFotos(p) {
  try {
    var it = carpetaDeFotos().getFiles();
    var lista = [];
    while (it.hasNext()) {
      var f = it.next();
      if (FOTOS_ACEPTADAS.indexOf(f.getMimeType()) === -1) continue;
      lista.push({ id: f.getId(), nombre: f.getName(), bytes: f.getSize(),
                   modificado: f.getLastUpdated().toISOString() });
    }
    lista.sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });
    /* Los nombres que el catálogo de verdad usa. Con esto el montaje puede
       avisar de los dos errores que comete siempre el comercio: subir una foto
       que ningún producto nombra, y nombrar en la hoja una foto que nunca
       subió. Los dos fallan en silencio: la tienda no se rompe, la foto
       simplemente no aparece. */
    return { ok: true, version: VERSION, archivos: lista,
             usadas: fotosQueUsaElCatalogo() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fotosQueUsaElCatalogo() {
  var vistas = {}, salida = [];
  filas(H_CATALOGO).forEach(function (f) {
    if (!String(f[0]).trim()) return;
    String(f[7] || '').split('|').forEach(function (n) {
      var limpio = n.trim();
      // Una URL completa no sale de la carpeta de Drive: no aplica.
      if (!limpio || /^https?:\/\//i.test(limpio) || vistas[limpio]) return;
      vistas[limpio] = true;
      salida.push(limpio);
    });
  });
  /* 0.21.0 · EL LOGO Y EL ICONO TAMBIÉN SALEN DE ESA CARPETA (bitácora 98).
     Sin esto el montaje los cuenta como «fotos que ningún producto nombra» —un
     aviso falso en cada corrida— y, peor, no avisa cuando el comercio escribe
     mal el nombre: la tienda se publica sin logo y nadie lo dice. */
  var c = leerConfiguracion();
  [c.logo, c.favicon].forEach(function (n) {
    var limpio = String(n || '').trim();
    if (!limpio || /^https?:\/\//i.test(limpio) || vistas[limpio]) return;
    vistas[limpio] = true;
    salida.push(limpio);
  });
  return salida.sort();
}

var FOTO_MAXIMA = 8 * 1024 * 1024;

function atenderFoto(p) {
  try {
    var f = DriveApp.getFileById(String(p.id || ''));
    /* Que el archivo esté en LA carpeta configurada, no en cualquier parte del
       Drive. Sin esto, quien tenga el token podría pedir cualquier archivo al
       que esta cuenta tenga acceso, con solo adivinar su identificador. */
    if (!estaEnLaCarpeta(f)) {
      return { ok: false, error: 'Ese archivo no está en la carpeta de fotos.' };
    }
    if (FOTOS_ACEPTADAS.indexOf(f.getMimeType()) === -1) {
      return { ok: false, error: 'Eso no es una imagen: ' + f.getMimeType() };
    }
    if (f.getSize() > FOTO_MAXIMA) {
      return { ok: false, error: 'La foto pesa ' + Math.round(f.getSize() / 1048576) +
        ' MB y el tope son 8 MB. Pídele al comercio una versión más liviana.' };
    }
    return { ok: true, nombre: f.getName(), tipo: f.getMimeType(),
             bytes: f.getSize(),
             contenido: Utilities.base64Encode(f.getBlob().getBytes()) };
  } catch (err) {
    return { ok: false, error: 'No pude leer esa foto: ' + err.message };
  }
}

function estaEnLaCarpeta(archivo) {
  var buscada = carpetaDeFotos().getId();
  var padres = archivo.getParents();
  while (padres.hasNext()) {
    if (padres.next().getId() === buscada) return true;
  }
  return false;
}

function atenderPanel(p) {
  try { return resumenParaPanel(); }
  catch (err) {
    registrarError('panel: ' + err.message, null);
    return { ok: false, error: err.message };
  }
}

function resumenParaPanel() {
  var m = calcularMetricas();
  var c = m.cfg || {};
  var catalogo = filas(H_CATALOGO).filter(function (f) { return String(f[0]).trim(); });
  var publicados = catalogo.filter(function (f) { return esSi(f[9]); }).length;

  return {
    ok: true,
    version: VERSION,
    negocio: String(c.negocio || ''),
    sitio: String(c.sitio_url || ''),
    whatsapp: String(c.whatsapp || ''),
    correo: String(c.correo_resumen || ''),
    hoja: m.url,

    productos: catalogo.length,
    publicados: publicados,
    agotados: m.agotados,
    pocos: m.pocos,

    // Del mes en curso, y el mismo tramo del mes pasado: comparar un mes a
    // medias contra uno completo no dice nada.
    ventasMes: m.A.ventas,
    ventasMesAnterior: m.Bhasta.ventas,
    pedidosMes: m.A.confirmados,
    ticket: m.A.ticket,
    tasaCierre: m.A.tasaCierre,

    // Lo que empuja el techo de 30 ejecuciones simultáneas. El techo no se
    // puede consultar; esto sí, y es la señal que avisa antes de llegar.
    lecturasHoy: lecturasDeHoy(),
    picoHora: picoDeHoy(),
    cuotaCorreo: cuotaDeCorreo(),
    respaldo: ultimoRespaldo(),

    ventasAyer: m.ayer.ventas,
    pedidosAyer: m.ayer.enviados,
    porConfirmar: m.porConfirmar,
    atrasados: m.viejos,
    errores: m.errores,

    // Para el gráfico del panel, sin nombres de producto ni de cliente.
    meses: m.meses.map(function (x) { return [x.etiqueta, x.ventas]; }),
    consultado: new Date().toISOString(),

    /* AL FINAL, Y NO EN MEDIO. Es la regla R1 del contrato, y la escribí mal
       otra vez: puse estos dos campos antes de `meses` y la batería de esquema
       lo cazó, igual que cazó la clave `repositorio` hace unos días. Dos veces
       el mismo error en la misma semana dice que la regla no basta con saberla.

       SI A ESTA HOJA LE FALTA REPEGAR EL STUB, y desde cuándo. Son las dos
       únicas cosas del panel que no se pueden deducir mirando la tienda: viven
       dentro del proyecto de la hoja y solo el maestro las ve.

       `stub` es la versión que declara el código pegado en la hoja; «antiguo»
       quiere decir que ni siquiera la declara, y `''` que nadie ha abierto el
       menú desde que se instaló este maestro. `tokenViejo` es la marca que deja
       una hoja cuando entra con el token de montaje: mientras exista, esa
       tienda no ha terminado la migración y rotarToken() se niega a correr. */
    stub: estadoDelStub(),
    tokenViejo: marcaDelTokenViejo(),

    /* Los pedidos que estuvieron perdidos y se recuperaron. En el panel importa
       más que en la hoja: un comercio ve el suyo, el operador ve si es una
       tienda o son todas —y si son todas, el problema no es de ninguna. */
    rescates: rescates(),

    /* QUÉ LE FALTA A ESTA TIENDA PARA ESTAR TERMINADA. Van las CLAVES, no los
       valores: el panel necesita saber qué falta, no qué dice. Mandar los
       valores sería mandar la llave de pago de cada comercio a una hoja donde
       no pinta nada. */
    alta: (function () {
      var a = revisarTienda();
      return { bloquean: a.bloquean.map(function (x) { return x.clave; }),
               avisan:   a.avisan.map(function (x) { return x.clave; }) };
    })()
  };
}

/* ==========================================================================
   M4 · EL TABLERO EN EL PANEL
   --------------------------------------------------------------------------
   Los mismos números de la pestaña Tablero de la hoja, para dibujarlos en el
   panel. SALEN DE calcularMetricas() Y DE NINGÚN OTRO SITIO: la pestaña, el
   correo del día y esta puerta leen la misma función, y paneltablero.js
   comprueba que la página y la hoja dicen la misma cifra. Si un día no cuadran,
   alguien copió la cuenta en vez de llamarla (patrón 2).

   Lo que NO lleva, a propósito: ni un nombre, ni un celular, ni una dirección.
   Los pedidos van contados; los productos, por su nombre; las ciudades, por
   cuántos pedidos. Es lo mismo que ya muestra la pestaña de la hoja.

   UNA PETICIÓN POR VISITA. La página la pide al abrir la pestaña Tablero y no
   la repite sola: ni refresco cada tanto ni nada programado. Cada lectura es
   una ejecución de Apps Script, y un tablero abierto en el mostrador todo el
   día no puede costar una ejecución por minuto. Para ver cifras nuevas está el
   botón Actualizar.

   Las variaciones van hechas desde aquí con variacion(), la misma que pinta la
   hoja: la página no recalcula porcentajes por su cuenta.
   ========================================================================== */
var MAX_LISTA_TABLERO = 20;

function atenderTablero() {
  try { return tableroParaElPanel(); }
  catch (err) {
    registrarError('tablero: ' + err.message, null);
    return { ok: false, error: 'No se pudo leer el tablero: ' + err.message };
  }
}

function tableroParaElPanel() {
  var m = calcularMetricas();
  var A = m.A, H = m.Bhasta;
  var mes = function (x) {
    return { ventas: x.ventas, pedidos: x.confirmados, hechos: x.enviados, carritos: x.carritos,
             ticket: x.ticket, tasaPedido: x.tasaEnvio, tasaCierre: x.tasaCierre };
  };
  var corta = function (l) { return l.slice(0, MAX_LISTA_TABLERO); };
  return {
    ok: true,
    consultado: m.ahora.toISOString(),
    dia: m.diaDelMes,
    esteMes: mes(A),
    aEstaAltura: mes(H),
    mesAnterior: mes(m.B),
    variacion: {
      ventas:  variacion(A.ventas, H.ventas).texto,
      pedidos: variacion(A.confirmados, H.confirmados).texto,
      ticket:  variacion(A.ticket, H.ticket).texto
    },
    meses: m.meses.map(function (x) {
      return { etiqueta: x.etiqueta, ventas: x.ventas, pedidos: x.pedidos, actual: !!x.actual };
    }),
    porConfirmar: m.porConfirmar,
    atrasados: m.viejos,
    errores: m.errores,
    agotados: corta(m.listaAgotados),
    cuantosAgotados: m.agotados,
    pocos: corta(m.listaPocos),
    cuantosPocos: m.pocos,
    sinVender: corta(m.sinVender),
    cuantosSinVender: m.sinVender.length,
    masVendidos: m.masVendidos.map(function (x) { return { nombre: x[0], unidades: x[1], ingresos: x[2] }; }),
    porCiudad: m.porCiudad.map(function (x) { return { ciudad: x[0], pedidos: x[1] }; }),
    /* AL FINAL (R1). La pantalla de Ventas avisa arriba si la hoja pide
       Pasarela y la tienda sigue por WhatsApp, y por qué. */
    cobro: estadoDelCobro(),
    /* 0.11.0 · 4.1: cuántos esperan cada agotado, y si ya hay. */
    avisame: m.avisame
  };
}

/* Las dos lecturas de arriba, en funciones propias porque las usa también el
   diagnóstico y tenerlas dos veces es cómo empiezan a decir cosas distintas. */
function estadoDelStub() {
  try { return PropertiesService.getScriptProperties()
                 .getProperty('STUB_VISTO') || ''; } catch (e) { return ''; }
}

/* 0.20.0 · QUÉ VERSIÓN DEL STUB ESTÁ PEGADA EN LA HOJA, medido y no supuesto:
   lo anota `atenderMenu` en cada petición. Vacío = nadie ha abierto el menú. */
function stubVisto() {
  try { return String(PropertiesService.getScriptProperties().getProperty('STUB_VISTO') || '').trim(); }
  catch (e) { return ''; }
}

/* 0.20.0 · ¿Tiene el maestro su permiso de GitHub? Sin él, Publicar y
   Actualizar desde el panel o el menú no disparan nada. */
function tokenDeGitHub() {
  try { return !!String(PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN') || '').trim(); }
  catch (e) { return false; }
}

function marcaDelTokenViejo() {
  try { return PropertiesService.getScriptProperties()
                 .getProperty('STUB_CON_TOKEN_VIEJO') || ''; } catch (e) { return ''; }
}

/* CONVIVENCIA, Y POR CUÁNTO TIEMPO.
   El stub que ya está pegado en cada hoja lleva el token de montaje: si esta
   puerta dejara de aceptarlo de golpe, el menú de todas las tiendas montadas
   se apagaría el día del despliegue. Así que acepta los dos —el del menú, que
   es el bueno, y el de montaje, que es el que hay que jubilar— y DEJA CONSTANCIA
   cada vez que llega el viejo.

   Esa constancia es lo que hace que la migración se pueda terminar: el
   diagnóstico la lee y dice que a esa hoja le falta pegar el stub nuevo, y
   `rotarToken()` se niega a correr mientras alguna tienda siga usándolo. Sin
   medirlo, «acepta los dos» se queda para siempre, que es como una convivencia
   temporal se vuelve la arquitectura. */
function atenderMenu(p) {
  /* DE QUÉ VERSIÓN ES EL STUB QUE ESTÁ PEGADO EN LA HOJA, medido y no supuesto.
     Desde aquí no se puede leer el código de la hoja, pero el stub dice de qué
     versión es en cada petición. Un stub anterior a la 2.7.1 no manda nada, y
     esa ausencia también es un dato: se anota como «antiguo».

     Esto es lo que permite que el panel conteste «¿en qué tiendas falta
     repegar el stub?» sin abrirlas una por una — que con ocho tiendas es la
     diferencia entre saberlo y acordarse. */
  try {
    PropertiesService.getScriptProperties()
      .setProperty('STUB_VISTO', String(p.s || 'antiguo').slice(0, 20));
  } catch (e) { }

  var t = String(p.t || '');
  if (t && t === token() && t !== tokenMenu()) {
    try {
      PropertiesService.getScriptProperties()
        .setProperty('STUB_CON_TOKEN_VIEJO', new Date().toISOString());
    } catch (e) { }
  } else if (t !== tokenMenu()) {
    return { ok: false, error:
      'Este stub no corresponde a esta tienda. Vuelve a generarlo: ejecuta ' +
      'generarStub() en el maestro y pega el código que imprime.' };
  }
  /* 0.18.0 · ¿ES ESTA HOJA? El stub manda el ID de la hoja donde está pegado.
     Un stub generado desde el maestro de OTRA tienda lleva su URL y su token,
     así que el menú aparece y funciona… sobre la hoja de esa otra tienda: se
     publicaría su catálogo y se verían sus pedidos. Pasó (bitácora 76). El
     token no alcanza para verlo, porque es el token correcto — del maestro
     equivocado. El ID de la hoja sí. Un stub anterior a la 0.18.0 no manda
     `h`: eso no se rechaza, para no dejar tiendas sin menú al actualizar. */
  var suHoja = String(p.h || '');
  if (suHoja && HOJA_ID && suHoja !== String(HOJA_ID)) {
    return { ok: false, error:
      'Este código es de OTRA tienda: apunta a un maestro que administra otra ' +
      'hoja. Genera el stub desde el maestro de ESTA hoja (A1_generarStub) y ' +
      'pega lo que imprime.' };
  }
  if (!p.f) return { ok: true, menu: menuDeLaHoja() };
  try {
    var r = ejecutarAccion(p.f);
    r.ok = true;
    return r;
  } catch (err) {
    registrarError('menú ' + p.f + ': ' + err.message, null);
    return { ok: false, error: 'Falló "' + p.f + '": ' + err.message };
  }
}

/* Columnas de la hoja Catálogo:
   0 ID · 1 Nombre · 2 Formato · 3 Categoría · 4 Precio · 5 Stock
   6 Descripción · 7 Imágenes (separadas por |) · 8 Destacado · 9 Activo   */
/* ==========================================================================
   CONFIGURACIÓN DE LA TIENDA
   --------------------------------------------------------------------------
   Todo lo que cambia de un negocio a otro y PUEDE cambiar en caliente vive en
   la pestaña Configuración: nombre, textos de portada, colores, datos legales.
   La tienda lo pide junto con el catálogo, así que no cuesta ni una petición
   más.

   Lo único que NO puede vivir aquí es el <title>, la descripción y las
   etiquetas Open Graph: los rastreadores de WhatsApp, Facebook y Google no
   ejecutan JavaScript, así que esas tienen que ser HTML estático. Para eso
   está generarConfiguracion(), que imprime ese bloque listo para pegar.
   ========================================================================== */
/* ============================================================================
   LOS VALORES DE FÁBRICA DE LA PESTAÑA CONFIGURACIÓN
   ----------------------------------------------------------------------------
   Estaban dentro de instalar(), que era el único que los usaba. Salieron aquí
   porque ahora hay un segundo interesado: la puerta que siembra la
   configuración desde el montaje necesita saber qué valor NO ha tocado nadie.

   Y lo que hay aquí dentro no es inocente. Durante un tiempo esta semilla
   trajo el nombre, el celular y la dirección del sitio de la PRIMERA tienda, y
   cualquier tienda nueva que no los cambiara le mandaba los pedidos a ese
   celular. Ahora lo que va aquí son corchetes y celdas vacías: una tienda sin
   configurar se ve sin configurar. El celular, en particular, se queda vacío;
   un número de fábrica es el peor valor posible porque funciona.
   ========================================================================== */
function semillaDeConfiguracion() {
  return [
      ['negocio',           '[NOMBRE DEL COMERCIO]', 'El nombre que se ve en toda la tienda, y también el del menú de esta hoja'],
      ['whatsapp',          '', '57 + el celular, sin + ni espacios. VACÍO A PROPÓSITO: un número de fábrica manda los pedidos al teléfono de otro'],
      ['logo',              '', 'Tu logo. El nombre del archivo en tu carpeta de fotos de Drive (ej: logo.png), o una dirección completa https://… Vacío = el signo dibujado con los colores de tu marca. Sale en la barra de arriba, al lado del nombre'],
      ['portada_titulo',    '[EL TITULAR DE TU PORTADA]', 'El titular grande de la portada'],
      ['portada_texto',     '[Dos líneas contando qué vendes y qué te hace distinto.]', 'El párrafo debajo del titular'],
      ['portada_puntos',    'Producto de la semana|Entregas a todo el país|Pides y confirmas por WhatsApp', 'Las leyendas del banner, separadas por |'],
      ['color_principal',   '#D0211C', 'Portada, precios y acentos fuertes. PINTA la celda de al lado con el color que quieras y el código sale solo'],
      ['color_secundario',  '#1B5E3A', 'WhatsApp, "Disponible" y el tablero. También se puede pintar la celda'],
      ['color_alterno',     '#14472B', 'El tercer color: la etiqueta de "Destacado" y los detalles. También se puede pintar la celda'],
      ['pie_descripcion',   '[Una línea con qué vendes y desde dónde.]', 'El texto del pie'],
      ['como_compras',      'Armas tu carrito aquí|Confirmas por WhatsApp|Pagas como acordemos por el chat|Recibes en 24 a 72 horas', 'Los pasos del pie, separados por |'],
      ['empresa_razon',     '[RAZÓN SOCIAL]', 'Para los textos legales. Entre corchetes = todavía no lo tengo, y no se muestra'],
      ['empresa_nit',       '[NIT O CÉDULA]', 'Igual: entre corchetes se omite'],
      ['empresa_correo',    '[CORREO DE CONTACTO]', 'Correo para temas de datos personales'],
      ['empresa_direccion', '[DIRECCIÓN]', 'Dirección física'],
      ['empresa_ciudad',    '[CIUDAD]', 'Municipio y departamento'],
      ['empresa_tel',       '[TELÉFONO]', 'El celular como se muestra, con espacios'],
      ['legal_actualizado', '[FECHA]', 'Fecha al pie de los textos legales'],
      ['sitio_url',         '', 'La dirección de ESTA tienda en Cloudflare. Vacío a propósito: es distinta en cada una'],
      ['sitio_titulo',      '[TÍTULO PARA GOOGLE Y WHATSAPP]', 'Lo que se ve en el buscador y en el enlace que se comparte'],
      ['sitio_descripcion', '[Dos líneas para el buscador y para el enlace que se comparte.]', 'Lo mismo, en párrafo'],
      ['correo_resumen',    '', 'A QUIÉN le llega el resumen diario. Escribe aquí tu correo. Varios, separados por coma. Vacío = no se manda nada'],
      ['correo_hora',       '7', 'A qué hora sale, de 0 a 23. Sale en la primera revisión de esa hora en adelante'],
      ['correo_siempre',    'No', 'No = solo llega cuando hay algo que atender o hubo ventas. Sí = llega todos los días'],
      ['correo_ultimo',     '', 'Lo escribe el script: la fecha del último resumen que salió. No lo edites'],
      ['fotos_origen',      '', 'DÓNDE están las fotos servibles. Normalmente la carpeta /fotos de tu propio sitio: https://tutienda.workers.dev/fotos . Vacío = se usa la dirección del sitio + /fotos'],
      ['fotos_cdn',         '', 'CÓMO se transforman. Vacío = se sirven tal cual. Cloudflare (mismo dominio, no toca la política de seguridad): https://TUDOMINIO/cdn-cgi/image/format=auto,quality=82,width={ancho},fit=cover/fotos/{ruta} — ImageKit: https://ik.imagekit.io/tucuenta/{ruta}?tr=w-{ancho},q-auto,f-auto'],
      ['respaldo_carpeta',  '', 'La carpeta de Drive del administrador donde cae la copia semanal de esta hoja. Pega el enlace de la carpeta. Vacío = no se respalda nada'],
      ['fotos_drive',       '', 'La carpeta de Drive donde el comercio sube sus fotos CRUDAS. Pega el enlace de la carpeta o solo su identificador. Vacío = el montaje no baja fotos'],
      ['fotos_webp',        'No', 'Sí = las fotos se prepararon con preparar-fotos.mjs y existen en varios tamaños (producto-1-600.webp). Recupera el formato moderno cuando NO hay proveedor de transformación. Si no se generaron, la tienda vuelve sola al archivo original'],
      ['favicon',           '', 'El iconito de la pestaña del navegador (cuadrado). Vacío = se usa tu logo; si tampoco hay, se dibuja un marcador redondo con los colores de tu marca. Se nombra igual que el logo: el archivo de tu carpeta de fotos, o una dirección completa'],

      /* EL PAGO. Estas claves NO viajan a la página: el comprador recibe los
         datos de pago por la respuesta automática de WhatsApp, después de que
         el comercio confirma. Poner una llave de cobro en un archivo público es
         invitar a que la copien en una tienda falsa. Viven aquí para que el
         comercio las tenga en un solo sitio y las pegue donde toca. */
      ['pago_llave',        '', 'Tu llave Bre-B o el número de la cuenta. NO se publica en la página: va en la respuesta automática de WhatsApp'],
      ['pago_titular',      '', 'A nombre de quién está la cuenta, como lo verá el comprador al transferir'],
      ['pago_entidad',      '', 'Banco o billetera: Bancolombia, Nequi, Daviplata…'],
      ['pago_texto',        '', 'El mensaje de pago que le mandas al comprador. Vacío = se arma con las tres claves de arriba'],
      /* El tope de Bre-B se reindexa cada diciembre —1.000 UVB, y la UVB la fija
         el Ministerio de Hacienda por resolución—, así que no puede vivir en el
         código: sería una cifra que caduca sola cada año. */
      ['pago_tope',         '12110000', 'Tope por transferencia Bre-B: 1.000 UVB. En 2026 la UVB vale $12.110. SE REINDEXA CADA DICIEMBRE. El banco del comprador puede tener un tope menor'],

      ['envio_gratis_desde','', 'Desde qué monto el envío va sin costo. Vacío = nunca'],
      ['horario',           '', 'Cuándo atiendes, en una línea: «Lunes a sábado, 8am a 6pm». Se muestra al comprador para que sepa cuándo le responden'],

      /* AL FINAL, y no donde quedaba bonito. La puse junto a envio_gratis_desde
         porque agrupaba mejor, y la batería del esquema se plantó: «CAMBIÓ lo
         que ya existía». Tenía razón — escribirConfiguracion() ubica la fila por
         POSICIÓN para no pisar lo que el comerciante puso, así que meter una
         clave en medio le corre todos los valores de ahí para abajo. R1 del
         contrato no es una preferencia de estilo. */
      ['repositorio',       '', 'Dónde vive el sitio, como dueño/repositorio. Ej.: tuempresa/tutienda. Lo usa «Publicar ahora»'],

      /* AL FINAL (R1), igual que repositorio. La autoría: un pie discreto
         "Powered by Laboratorio Digital" enlazado a autoria_url. f_autoria
         apagado es una decisión comercial —un cliente puede pedir que se
         quite la marca— así que vive en Configuración, no en el código. */
      ['f_autoria',         'Sí', 'Si dice Sí, la tienda muestra "Powered by Laboratorio Digital" al pie, enlazado a autoria_url. Sí = encendido, que es lo normal'],
      ['autoria_url',       '', 'A dónde enlaza el pie de autoría. Vacío = se muestra el texto sin enlace'],

      /* AL FINAL (R1), otra vez. Los productos que no admiten cambio de
         opinión por ser perecederos (art. 47, Ley 1480), en las palabras del
         propio comercio: separados por "|". Vacío = ningún producto queda
         excluido, y el texto de retracto ni siquiera menciona la excepción —
         no se puede inventar QUÉ es perecedero por él (historia A-4). */
      ['retracto_excepciones', '', 'Productos que NO admiten cambio de opinión por ser perecederos (art. 47, Ley 1480), separados por |. Vacío = ninguno queda excluido'],
      ['f_variantes',      'Sí', 'Si dice Sí, los productos con la columna Variantes piden elegir antes de agregar al carrito (ej: Talla: S|M|L ; Color: Rosa|Nude). No = se ignoran y el producto se vende sin elección'],

      /* AL FINAL (R1). En qué orden ve el catálogo quien entra. El valor de
         fábrica es lo que la tienda ya hacía, así que un comercio que vuelva a
         correr instalar() no ve ningún cambio. Y esto decide SOLO la entrada:
         el comprador reordena por precio desde la tienda (C-4). */
      ['orden_catalogo',   'Destacados primero', 'En qué orden ve el catálogo quien entra. Valores: Destacados primero · Como en la hoja · Precio: de menor a mayor · Precio: de mayor a menor · Nombre: de la A a la Z. El comprador puede reordenar por precio desde la tienda'],

      /* AL FINAL (R1). El usuario del panel, y SOLO el usuario: la clave no
         está aquí ni puede estarlo — la hoja se comparte y las propiedades del
         proyecto no—. Vacío = el panel está cerrado, que es como nace toda
         tienda: no hay usuario de fábrica ni clave de fábrica. */
      ['panel_usuario',    '', 'Con qué nombre entras al panel de tu tienda. Escríbelo aquí y después usa el menú > "Clave del panel" para que te dé una clave. Vacío = nadie puede entrar'],

      /* AL FINAL (R1). M3.5: cómo se cierra la venta. De fábrica, como
         siempre: por WhatsApp. Las LLAVES de Bold no van aquí —la hoja se
         comparte—: van en las propiedades del script (docs/PAGOS-BOLD.md). */
      ['cobro_modo',       'WhatsApp', 'Cómo se cierra la venta. WhatsApp = como siempre: el pedido sale por chat y el pago se acuerda allí. Pasarela = el comprador paga en línea con Bold (PSE, tarjeta, Nequi…). Pasarela necesita las llaves de Bold en las propiedades del script; sin ellas la tienda sigue por WhatsApp'],
      ['cobro_ambiente',   'Pruebas', 'Pruebas = el ambiente de pruebas de Bold: no se mueve dinero de verdad. Producción = cobros reales. Pasa a Producción solo después de la prueba completa de docs/PAGOS-BOLD.md'],

      /* AL FINAL (R1). C-3: cerrar la tienda sin apagarla, y el mínimo. De
         fábrica, abierta y sin mínimo: lo que ya hacía. */
      ['tienda_abierta',   'Sí', 'No = la tienda se puede mirar pero no recibe pedidos (vacaciones, inventario). Arriba de todo sale el mensaje de abajo'],
      ['tienda_cerrada_mensaje', '', 'Lo que ve el comprador cuando la tienda está cerrada. Ej.: «Volvemos el lunes 6 de octubre». Vacío = un mensaje genérico'],
      ['pedido_minimo',    '', 'El pedido mínimo, en pesos, sobre el valor de los productos (sin el envío). Vacío = sin mínimo'],

      /* AL FINAL (R1). M5: el comprador sigue su pedido con el enlace que va en
         su mensaje de WhatsApp. Encendido de fábrica: no guarda nada suyo. */
      ['f_rastreo',        'Sí', 'Sí = cada pedido lleva un enlace para que el comprador vea en qué va (estado, fecha y qué pidió; nada de sus datos). No = sin enlace'],

      /* AL FINAL (R1). 0.11.0: dos del ROADMAP (4.1 y 4.4). */
      ['f_avisame',        'Sí', 'Sí = en lo agotado sale «Avísame cuando llegue»: el comprador te escribe por WhatsApp y la pestaña Avísame cuenta cuántos esperan cada producto. No se guarda ningún dato suyo. No = sin el botón'],
      ['catalogo_columnas', '3', 'Cuántos productos por fila en una pantalla ancha (computador): 3, 4 o 5. En el celular siempre son 1 o 2'],

      /* AL FINAL (R1). La medición, apagada de fábrica: una tienda que no mide
         no carga nada de Google, no pone cookies y no necesita banner. */
      ['analytics_id',      '', 'Google Analytics 4: el identificador G-XXXXXXXXXX de tu flujo de datos web (analytics.google.com › Administrar › Flujos de datos › Web). Vacío = la tienda NO carga nada de Google y no pone cookies de medición. Al ponerlo, la tienda mide visitas, agregar al carrito, pedidos enviados y pagos: hay que publicar para que tome efecto, y hay que avisarlo en la política de privacidad']
  ];
}

function valorDeFabrica(clave) {
  var f = semillaDeConfiguracion();
  for (var i = 0; i < f.length; i++) if (f[i][0] === clave) return String(f[i][1]);
  return '';
}

function leerConfiguracion() {
  var mapa = {};
  filas(H_CONFIG).forEach(function (f) {
    var clave = String(f[0]).trim();
    if (clave) mapa[clave] = String(f[1] === undefined || f[1] === null ? '' : f[1]);
  });
  return mapa;
}

function leerCatalogo() {
  var mapa = {};
  filas(H_CATALOGO).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id || !esSi(f[9])) return;
    var fila = i + 2;                                  // filas() ya saltó el encabezado
    var precio = cifra(f[4], 'Catálogo E' + fila + ' (Precio de ' + id + ')');
    var stock  = cifra(f[5], 'Catálogo F' + fila + ' (Stock de ' + id + ')');
    var antes  = cifra(f[11], 'Catálogo L' + fila + ' (Precio antes de ' + id + ')');
    var umbral = cifra(f[12], 'Catálogo M' + fila + ' (Umbral bajo de ' + id + ')');
    /* Un precio ilegible NO es un producto gratis: es un producto que no se
       puede vender hasta que alguien arregle la celda. Se cae del catálogo,
       igual que si estuviera marcado como no activo. */
    if (precio === null) return;
    mapa[id] = { id: id, nombre: String(f[1]), precio: precio,
                 stock: stock === null ? 0 : Math.max(0, stock),
                 referencia: String(f[10] || '').trim(),
                 /* Un precio tachado solo tiene sentido si es MAYOR que el de
                    hoy. Si no, es un error de captura y se ignora: mostrar un
                    «antes» más barato es peor que no mostrar nada. */
                 precioAntes: (antes && antes > precio) ? antes : 0,
                 umbralBajo: (umbral && umbral > 0) ? Math.floor(umbral) : 0,
                 /* Las mismas variantes que ve el comprador, para poder
                    comprobar que lo que eligió es algo que este comercio
                    ofrece de verdad. Una elección que no está en la hoja no se
                    guarda: sería un pedido que nadie puede despachar. */
                 variantes: variantesDeCelda(f[13],
                   'Catálogo N' + fila + ' (Variantes de ' + id + ')') };
  });
  /* C-1b. Si el producto lleva su inventario por combinación, el stock que
     manda es ese: cada combinación el suyo, y el del producto la suma. */
  var inv = leerInventarioVariante();
  Object.keys(mapa).forEach(function (id) {
    var s = skusDe(mapa[id].variantes, inv[id], 'Inventario por variante (' + id + ')');
    if (!s) return;
    mapa[id].skus = s.porClave;
    mapa[id].stock = s.suma;
  });
  return mapa;
}

function leerEnvios() {
  var mapa = {};
  filas(H_ENVIOS).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id) return;
    var valor = cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + id + ')');
    mapa[id] = { id: id, nombre: String(f[1]), valor: valor, ilegible: valor === null };
  });
  return mapa;
}

/** Busca el cupón y decide si aplica. Devuelve siempre un texto para el cliente. */
function revisarCupon(codigo, subtotal) {
  if (!codigo) return { ok: false, codigo: '', texto: '' };

  /* El NÚMERO de fila se guarda junto con la fila. Sin él, una cifra ilegible
     en un cupón se reportaba como «Cupones F», y en la hoja hay una columna F
     por cada cupón: quien la busca tiene que revisarlas todas. Con fila y
     columna, el comerciante abre la celda exacta. */
  var fila = null, filaN = 0;
  filas(H_CUPONES).forEach(function (f, i) {
    if (String(f[0]).trim().toUpperCase() === codigo) { fila = f; filaN = i + 2; }
  });
  // Código | Tipo | Valor | Mínimo | Vence | Usos máximos | Usos confirmados | Activo
  if (!fila || !esSi(fila[7]))
    return { ok: false, codigo: codigo, texto: 'Ese código no existe o ya no está activo.' };

  var vence = fila[4] ? new Date(fila[4]) : null;
  if (vence && !isNaN(vence.getTime())) {
    vence.setHours(23, 59, 59);
    if (vence < new Date())
      return { ok: false, codigo: codigo, texto: 'Este cupón ya venció.' };
  }

  /* Una cifra ilegible en un cupón se resuelve NO aplicándolo. Al revés
     —aplicarlo con 0— el cupón se vuelve más generoso de lo que su dueño quiso:
     sin mínimo, y sin tope de usos, porque 0 usos máximos significa SIN TOPE. */
  var maximos = cifra(fila[5], 'Cupones F' + filaN + ' (Usos máximos de ' + codigo + ')');
  var usados  = cifra(fila[6], 'Cupones G' + filaN + ' (Usos confirmados de ' + codigo + ')');
  var minimo  = cifra(fila[3], 'Cupones D' + filaN + ' (Mínimo de ' + codigo + ')');
  var valor   = cifra(fila[2], 'Cupones C' + filaN + ' (Valor de ' + codigo + ')');
  if (maximos === null || usados === null || minimo === null || valor === null)
    return { ok: false, codigo: codigo,
             texto: 'Este cupón tiene un dato que no pudimos leer. Te confirmamos por WhatsApp.' };

  if (maximos > 0 && usados >= maximos)
    return { ok: false, codigo: codigo, texto: 'Este cupón ya se agotó.' };

  if (subtotal < minimo)
    return { ok: false, codigo: codigo,
             texto: 'Aplica desde ' + pesos(minimo) + '. Te faltan ' + pesos(minimo - subtotal) + '.' };

  var tipo  = String(fila[1]).trim().toLowerCase();
  var texto = tipo === 'envio'
    ? 'Cupón aplicado: envío sin costo.'
    : 'Cupón aplicado: ' + (tipo === 'porcentaje' ? valor + '% de descuento' : pesos(valor) + ' menos') + '.';

  return { ok: true, codigo: codigo, tipo: tipo, valor: valor, texto: texto };
}

function validarPedido(p) {
  CELDAS_ILEGIBLES = [];               // se llena mientras se leen las hojas
  var catalogo = leerCatalogo();
  var envios   = leerEnvios();
  var avisos   = [];

  // --- líneas del pedido, con los precios de la hoja ---
  var crudo = String(p.items || '').slice(0, 600).split(',');
  if (crudo.length > MAX_ITEMS) return { ok: false, error: 'Demasiadas líneas.' };

  var vistos = {}, usado = {}, items = [], sub = 0;
  /* M3.5 · LO APARTADO NO SE OFRECE. Mientras alguien paga en la pasarela, sus
     unidades están apartadas: lo disponible es el stock menos eso. Sin pagos
     en curso esto es un mapa vacío y no cambia nada.

     `recortado` dice si el pedido que sale NO es el que se pidió —una línea
     que se cae o una cantidad que baja—. Para mandar un WhatsApp da igual, el
     aviso lo explica; para COBRAR no: no se cobra un carrito distinto del que
     el comprador vio. */
  var apartado = unidadesApartadas();
  var recortado = false;
  crudo.forEach(function (par) {
    var t = par.split(':');
    var id = String(t[0] || '').trim();
    if (!id) return;
    var prod = catalogo[id];
    if (!prod) { recortado = true; return; }

    /* C-1 · La elección viaja en la misma línea y se comprueba contra la hoja.
       null = pidió algo que este comercio no ofrece: la línea se cae. */
    var elegido = variantePedida(t[2], prod.variantes, avisos, prod.nombre);
    if (elegido === null) { recortado = true; return; }

    /* LA CLAVE ES PRODUCTO + VARIANTE. Dos tonos del mismo labial son dos
       líneas, no una: con la clave puesta solo en el id, la segunda se perdía
       en silencio y el comprador recibía la mitad de lo que pidió. */
    var clave = id + '\u0000' + elegido;
    if (vistos[clave]) return;
    vistos[clave] = true;

    var cant = numeroSeguro(t[1], MAX_CANTIDAD);
    if (cant < 1) return;

    /* EL STOCK ES DEL PRODUCTO, NO DE LA VARIANTE (decisión de C-1), así que
       las líneas del mismo producto compiten por las mismas existencias. Sin
       llevar la cuenta, dos tonos de tres unidades cada uno pasaban con un
       stock de cuatro. */
    /* C-1b · CON INVENTARIO POR COMBINACIÓN, cada combinación compite por
       SUS unidades: dos tallas distintas ya no se quitan stock entre sí. Es lo
       contrario de lo que C-1 hacía a propósito, y solo cambia para los
       productos que tienen filas en la pestaña; los demás siguen igual. */
    var porCombo = prod.skus && elegido;
    var llaveStock = porCombo ? id + '\u0000' + llano(elegido) : id;
    var stockDeLinea = porCombo ? (prod.skus[llano(elegido)] || 0) : prod.stock;
    var yaPedido = usado[llaveStock] || 0;
    var libre = Math.max(0, stockDeLinea - (apartado[llaveStock] || 0));
    if (cant + yaPedido > libre) {
      /* Al segundo comprador se le dice ANTES de pagar, y se le dice por qué:
         «no hay» y «lo está pagando otra persona» piden cosas distintas —la
         segunda, volver en unos minutos—. */
      if (cant + yaPedido <= stockDeLinea) {
        avisos.push(libre > 0
          ? 'De ' + prod.nombre + ' quedan ' + libre + ' libres: las demás las está pagando otra persona en este momento.'
          : 'Las últimas unidades de ' + prod.nombre + ' las está pagando otra persona en este momento. Vuelve en unos minutos: si no se pagan, se liberan.');
      } else {
        avisos.push('De ' + prod.nombre + (porCombo ? ' (' + elegido + ')' : '') + ' solo quedan ' + libre + '.');
      }
      cant = Math.max(0, libre - yaPedido);
      recortado = true;
    }
    if (cant >= 1) usado[llaveStock] = yaPedido + cant;
    if (cant < 1) return;
    items.push({ id: id, nombre: prod.nombre, cantidad: cant, precio: prod.precio,
                 variante: elegido });
    sub += cant * prod.precio;
  });
  /* Sin líneas, el motivo es lo único que sirve: «no hay productos válidos»
     a secas le escondía al segundo comprador que la última unidad la estaba
     pagando otra persona, que es justo lo que E-1 le quiere decir. */
  if (!items.length) {
    return { ok: false, recortado: recortado, avisos: avisos,
             error: avisos.length ? avisos.join(' ') : 'No hay productos válidos en el pedido.' };
  }

  // --- envío ---
  /* El id distingue mayúsculas —'MEDELLIN' no es 'medellin'— y eso es una
     trampa fácil de pisar cuando alguien edita la hoja Envíos a mano. Se busca
     primero exacto y después sin distinguir, y si hace falta el segundo intento
     se avisa: funcionar no es lo mismo que estar bien escrito. */
  var idEnvio = String(p.envio || '').trim();
  var env = envios[idEnvio];
  if (!env && idEnvio) {
    var claves = Object.keys(envios);
    for (var k = 0; k < claves.length; k++) {
      if (claves[k].toLowerCase() === idEnvio.toLowerCase()) {
        env = envios[claves[k]];
        /* Al comprador no le sirve saber esto: para él funcionó. Al comerciante
           sí, porque su hoja tiene el ID escrito distinto que su tienda y el día
           que alguien quite este rescate, deja de funcionar. */
        anotarError('Un ID de envío no coincide en mayúsculas',
                    'La tienda pidió "' + idEnvio + '" y la hoja Envíos dice "' +
                    claves[k] + '". Funciona por ahora, pero conviene igualarlos.');
        break;
      }
    }
  }
  if (!env) {
    /* Pasa si la hoja Envíos cambió y el cliente tiene la página vieja abierta,
       o si no llegó ningún envío. El segundo caso callaba: `if (idEnvio)` solo
       avisaba cuando el id existía pero no se reconocía, así que «no llegó
       ningún envío» —el caso peor— era el único que pasaba en silencio. */
    env = { id: '', nombre: 'Por confirmar', valor: 0 };
    avisos.push(idEnvio
      ? 'El envío que elegiste ya no está disponible; te confirmamos el costo por WhatsApp.'
      : 'No recibimos la zona de envío; te confirmamos el costo por WhatsApp.');
  }
  var envioDudoso = !env.id || !!env.ilegible;
  if (env.ilegible) {
    avisos.push('El costo de envío de ' + env.nombre +
                ' no se pudo leer en la hoja; te lo confirmamos por WhatsApp.');
    env = { id: env.id, nombre: env.nombre, valor: 0 };
  }
  var valorEnvio = env.valor;

  /* Envío gratis por monto. La decide la hoja, no la página: si la página
     pudiera decidirlo, bastaría con abrir la consola para regalarse el envío.
     Va después del envío y antes del cupón porque un cupón de envío gratis
     sobre un envío ya gratis no tiene nada que descontar. */
  var desde = cifraDeTexto(leerConfiguracion().envio_gratis_desde,
                           'Configuración · envio_gratis_desde');
  if (desde !== null && desde > 0 && sub >= desde && valorEnvio > 0) {
    valorEnvio = 0;
    avisos.push('Tu compra pasa de ' + pesos(desde) + ': el envío va sin costo.');
  }

  // --- cupón ---
  var cupon = revisarCupon(String(p.cupon || '').trim().toUpperCase(), sub);
  var descuento = 0;
  if (cupon.ok) {
    if (cupon.tipo === 'porcentaje') descuento = Math.round(sub * cupon.valor / 100);
    if (cupon.tipo === 'fijo')       descuento = Math.min(cupon.valor, sub);
    if (cupon.tipo === 'envio')      valorEnvio = 0;
  }

  var total = Math.max(0, sub - descuento + valorEnvio);

  /* C-3 · CERRADA Y MÍNIMO. Se dicen como avisos —la página los muestra— y
     salen como banderas para quien cobra. NO tumban la validación: un pedido
     que ya salió por WhatsApp desde una página vieja se registra igual (el
     registro falla abierto); lo que se niega es COBRAR (pago_crear). Una
     cifra ilegible en pedido_minimo no es «sin mínimo»: queda anotada como
     cualquier celda ilegible y el pedido no se puede cobrar tal cual. */
  var cfgVenta = leerConfiguracion();
  var cerrada = llano(cfgVenta.tienda_abierta) === 'no';
  if (cerrada) avisos.push(sinLlenar(cfgVenta.tienda_cerrada_mensaje)
    ? 'La tienda está cerrada en este momento.' : String(cfgVenta.tienda_cerrada_mensaje));
  var minimo = cifraDeTexto(cfgVenta.pedido_minimo, 'Configuración · pedido_minimo');
  var faltaMinimo = minimo !== null && minimo > 0 && sub < minimo ? minimo - sub : 0;
  if (faltaMinimo) avisos.push('El pedido mínimo es ' + pesos(minimo) + ': te faltan ' + pesos(faltaMinimo) + '.');

  /* Que una celda no se pueda leer no puede quedarse solo en el registro: el
     comprador ve un total y el comerciante no se entera de nada. Sale por los
     dos lados —un aviso arriba, una fila en Errores— y de ahí al acta. */
  if (CELDAS_ILEGIBLES.length) {
    avisos.push('Hay ' + CELDAS_ILEGIBLES.length +
                (CELDAS_ILEGIBLES.length === 1 ? ' dato' : ' datos') +
                ' de la tienda sin leer; confirmamos el total por WhatsApp.');
    anotarError('Celdas que no se pudieron leer como número',
                CELDAS_ILEGIBLES.join(' · '));
  }

  var respuesta = {
    ok: true, sub: sub, descuento: descuento, envio: valorEnvio, total: total,
    cerrada: cerrada, faltaMinimo: faltaMinimo,
    envioNombre: env.nombre, cupon: cupon, avisos: avisos, items: items,
    ilegibles: CELDAS_ILEGIBLES.slice(0),
    /* La tarifa de la zona antes del envío gratis: decide si hay que pedir
       dirección, que es otra pregunta que cuánto se cobra. */
    envioTarifa: Number(env.valor) || 0,
    /* ¿Se puede COBRAR este total tal cual? No, si algún número salió de una
       celda que no se pudo leer o si el envío no se reconoció: por WhatsApp
       eso se confirma después; en la pasarela el cobro ya se habría hecho. */
    recortado: recortado,
    cobrable: !CELDAS_ILEGIBLES.length && !envioDudoso
  };

  if (String(p.sellar) === '1') {
    respuesta.ref = sellar(p, items, respuesta);
  }
  return respuesta;
}

/** Escribe la fila de Validaciones y devuelve la referencia.
 *  Si el mismo pedido ya se selló hace poco, reutiliza la referencia en vez de
 *  llenar la hoja de filas repetidas mientras el cliente juega con el carrito. */
/* UNA fila por pedido, que se va actualizando.
   Antes se agregaba una fila por cada estado del carrito, así que agregar tres
   unidades de a una dejaba tres filas, cada una con su código. Y cuando dos
   peticiones idénticas llegaban a la vez —cosa normal con los reintentos de
   móvil— ambas se creían la primera y escribían dos filas distintas.

   Ahora la referencia ES el número del pedido, que lo fija la tienda y no
   cambia, y buscamos esa fila antes de escribir. El candado serializa el
   buscar-y-escribir, que es lo que las carreras rompían. */
function sellar(p, items, r, autorizada) {
  var codigo = celdaSegura(p.pedido).slice(0, 12) || aleatorio(5);

  /* Comparamos SUBTOTALES, no totales. El subtotal es lo único que calculan los
     dos lados con los mismos insumos (precio por cantidad); el descuento y el
     envío los pone solo la hoja. Si no coinciden, o el cliente tocó los precios
     desde la consola, o la hoja Catálogo se desincronizó de index.html. */
  var subPagina = numeroSeguro(p.sub, MAX_TOTAL);

  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (e) { return codigo; }
  try {
    escribirActa(codigo, subPagina, items, r, autorizada);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
  return codigo;
}

/* EL ACTA, SIN TOMAR LA LLAVE. La llave de Apps Script no se anida: quien la
   pide otra vez la recibe, y quien la suelta la suelta para TODOS. Así que
   cobrar en línea —que ya trabaja bajo llave— no puede llamar a sellar(): al
   terminar el acta soltaría la llave del cobro a medio escribir. Esta es la
   misma escritura, para quien ya la tiene tomada. */
function escribirActa(codigo, subPagina, items, r, autorizada) {
  var h = hoja(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
  asegurarColumnas(H_VALIDACIONES, ENCABEZADO_VALIDACIONES);
  var ultima = h.getLastRow();
  var encontrada = 0;
  if (ultima >= 2) {
    var desde = Math.max(2, ultima - 300);
    var codigos = h.getRange(desde, 2, ultima - desde + 1, 1).getValues();
    for (var i = codigos.length - 1; i >= 0; i--) {
      if (String(codigos[i][0]).trim() === codigo) { encontrada = desde + i; break; }
    }
  }

  /* El registro no manda `sub` en las páginas anteriores a esta versión, y
     poner 0 borraría el subtotal que la validación sí había guardado. R3 del
     contrato: un campo nuevo es opcional, y lo viejo tiene que seguir
     funcionando. Así que si no viene, se conserva el que ya estaba. */
  if (!subPagina && encontrada) {
    subPagina = numeroSeguro(h.getRange(encontrada, 5, 1, 1).getValues()[0][0], MAX_TOTAL);
  }

  var discrepancia = (subPagina && subPagina !== r.sub)
    ? celdaSegura('La página dijo ' + pesos(subPagina) +
                  ' y la hoja calcula ' + pesos(r.sub), MAX_ACTA)
    : '';

  var fila = [new Date(), codigo, celdaSegura(r.cupon.ok ? r.cupon.codigo : ''),
              r.sub, subPagina, discrepancia, r.descuento, r.envio, r.total,
              celdaSegura(items.map(function (i) { return i.id + ' x' + i.cantidad; }).join(' · '), MAX_ACTA),
              celdaSegura((r.avisos || []).join(' · '), MAX_ACTA)];

  if (encontrada) {
    /* Si el pedido YA se registró, su validación queda congelada: es la prueba
       de cuánto valía cuando se envió y nadie debe poder reescribirla después.
       Como el número lo elige la tienda, sin esto alguien que adivinara un
       número en curso podría pisar la fila de otro cliente. Después de enviado,
       ya no.

       OJO CON EL MOMENTO, QUE AQUÍ HUBO UN ERROR Y VALE LA PENA DEJARLO ESCRITO.
       El sello sale con 400 ms de espera y el registro sale al instante. Si el
       cliente cambiaba la zona de envío y pulsaba enseguida, el registro
       marcaba el pedido y el sello nuevo —el bueno— llegaba después y se
       descartaba aquí: el acta se quedaba con la zona anterior. El mensaje y la
       hoja Pedidos decían $17.900 y el acta decía $8.900.
       La protección era correcta; congelaba antes de tiempo. Ahora el acta la
       escribe registrarPedido() con SU propia revalidación —la autorizada, la
       que produjo el total guardado—, y esa escritura pasa con `autorizada`.
       Lo que sigue cerrado es lo que la protección quería cerrar: cualquier
       ?a=validar de fuera sobre un pedido ya enviado. */
    if (!autorizada && yaRegistrado(codigo)) return;
    h.getRange(encontrada, 1, 1, fila.length).setValues([fila]);
  } else if (ultima <= MAX_FILAS) {
    h.appendRow(fila);
  }
}

/* ==========================================================================
   REGISTRO DEL PEDIDO  —  GET ?a=registrar
   --------------------------------------------------------------------------
   Antes esto iba por POST con navigator.sendBeacon y la hoja Pedidos se
   quedaba vacía. Apps Script responde a los POST con una redirección, y el
   navegador convierte esa redirección en GET: la petición llegaba, pero como
   GET sin parámetros, así que no escribía nada y tampoco daba error.

   Por GET no pasa: es el mismo camino que ya usan el catálogo y la validación,
   que sí funcionan. Los precios los pone la hoja, no lo que mande la tienda.
   ========================================================================== */
/* ==========================================================================
   M5 · EL RASTREO DEL PEDIDO
   --------------------------------------------------------------------------
   El comprador ve en qué va su pedido —estado, fechas, qué pidió— con el
   enlace que viaja en su propio mensaje de WhatsApp. No se guarda ni se pide
   un dato suyo más: la hoja sigue sin saber quién compró.

   EL NÚMERO SOLO NO ALCANZA. El número de pedido son cinco caracteres (unos 33
   millones de combinaciones) y se lee en voz alta, se escribe en una guía, se
   ve en una captura. Por eso el enlace lleva además un SECRETO de 16 caracteres
   (80 bits) que nace en el navegador del comprador —o en el maestro, si lo pide
   el comerciante desde el panel— y del que la hoja guarda solo la HUELLA
   (SHA-256). Con la hoja abierta no se puede armar el enlace de nadie.

   UN INTENTO FALLIDO NO DICE NADA. Número que no existe, secreto equivocado,
   pedido viejo sin seguimiento, formato raro: la misma respuesta, palabra por
   palabra. Así el rastreo no sirve para averiguar qué números existen.
   ========================================================================== */
var SECRETO_SEGUIMIENTO = /^[A-Za-z0-9]{16,40}$/;
var NO_HAY_SEGUIMIENTO = 'No encontramos un pedido con ese enlace. Revisa que esté completo, ' +
                         'o escríbele a la tienda por WhatsApp.';

function rastreoEncendido(cfg) {
  /* Vacío es Sí: una hoja de antes de M5 no tiene la clave hasta que corre
     instalar(), y el rastreo no guarda nada del comprador. */
  return llano((cfg || leerConfiguracion()).f_rastreo) !== 'no';
}

function huellaDeSeguimiento(secreto) {
  var s = String(secreto || '');
  if (!SECRETO_SEGUIMIENTO.test(s) || !rastreoEncendido()) return '';
  return enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)).slice(0, 32);
}

function tiendaParaElComprador(cfg) {
  return { negocio: String(cfg.negocio || ''), whatsapp: String(cfg.whatsapp || '').replace(/\D/g, ''),
           color: String(cfg.color_principal || '') };
}

/* Lo que el comprador lee, en sus palabras y no en las del comerciante: un
   estado que la hoja no entiende sale como «Recibido», no como la errata. */
var ESTADOS_PUBLICOS = {
  nuevo:          { rotulo: 'Recibido', texto: 'La tienda recibió tu pedido y te confirma por WhatsApp.' },
  pendiente_pago: { rotulo: 'Esperando el pago', texto: 'La tienda está esperando tu pago para preparar el pedido.' },
  pagado:         { rotulo: 'Pagado', texto: 'Tu pago está confirmado: están preparando tu pedido.' },
  despachado:     { rotulo: 'Despachado', texto: 'Tu pedido va en camino.' },
  entregado:      { rotulo: 'Entregado', texto: 'Tu pedido fue entregado. ¡Gracias por tu compra!' },
  cancelado:      { rotulo: 'Cancelado', texto: 'Este pedido se canceló. Si no sabes por qué, escríbele a la tienda.' }
};

/* 0.12.0 · EL SECRETO DE UN PEDIDO COBRADO EN LÍNEA LO PONE EL MAESTRO.
   En la 0.10.0 nacía en el navegador y se guardaba en sessionStorage para
   mostrarlo al volver de Bold. Pero Bold puede devolver al comprador en otra
   pestaña, o en otro navegador —la prueba del dueño: Brave falló, siguió en
   Chrome—, y ahí no había secreto: ni enlace en la pantalla, ni en el mensaje.
   Ahora sale del número del pedido firmado con la firma de ESTA tienda: el
   maestro lo puede volver a calcular cuando quiera, y lo entrega solo a quien
   tiene el token del cobro (pago_estado) o por correo al comprador. */
function secretoDelCobro(codigo) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var hex = enHex(Utilities.computeHmacSha256Signature('rastreo|' + String(codigo), firmaDelPanel()));
  var s = '';
  for (var i = 0; i < 16; i++) s += abc.charAt(parseInt(hex.substr(i * 2, 2), 16) % abc.length);
  return s;
}
function enlaceDeRastreoHtml(cfg, codigo) {
  if (!rastreoEncendido(cfg)) return '';
  var sitio = String(cfg.sitio_url || '').trim().replace(/\/+$/, '');
  if (!sitio) return '';
  if (!/^https?:\/\//i.test(sitio)) sitio = 'https://' + sitio;
  var url = sitio + '/pedido.html?n=' + encodeURIComponent(codigo) + '&s=' + secretoDelCobro(codigo);
  return '<p><a href="' + escaparHtml(url) + '">Ver en qué va tu pedido</a></p>';
}

function atenderSeguimiento(p) {
  var cfg = leerConfiguracion();
  var fallo = { ok: false, error: NO_HAY_SEGUIMIENTO, tienda: tiendaParaElComprador(cfg) };
  if (!rastreoEncendido(cfg)) {
    return { ok: false, apagado: true, tienda: fallo.tienda,
             error: 'Esta tienda no tiene seguimiento en línea. Pregunta por tu pedido por WhatsApp.' };
  }
  var n = String(p.n || '').trim().toUpperCase();
  var s = String(p.s || '').trim();
  if (!/^[A-Z0-9]{4,12}$/.test(n) || !SECRETO_SEGUIMIENTO.test(s)) return fallo;
  var h = enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)).slice(0, 32);
  var todas = lineasDePedidos().filas;
  var suyas = todas.filter(function (f) { return String(f[1]).trim().toUpperCase() === n; });
  if (!suyas.length || String(suyas[0][20] || '').trim() !== h) return fallo;

  var primera = suyas[0];
  var e = estadoDe(primera[3]);
  var id = e ? e.id : 'nuevo';
  var publico = ESTADOS_PUBLICOS[id] || ESTADOS_PUBLICOS.nuevo;
  var orden = ['nuevo', 'pagado', 'despachado', 'entregado'];
  var alto = id === 'pendiente_pago' ? 0 : orden.indexOf(id);
  var pasos = [
    { id: 'nuevo', rotulo: 'Recibido', fecha: fechaIso(primera[0]) },
    { id: 'pagado', rotulo: 'Pagado', fecha: fechaIso(primera[13]) },
    { id: 'despachado', rotulo: 'Despachado', fecha: fechaIso(primera[14]) },
    { id: 'entregado', rotulo: 'Entregado', fecha: '' }
  ].map(function (x, i) { x.hecho = id !== 'cancelado' && i <= alto; return x; });
  return {
    ok: true,
    tienda: fallo.tienda,
    pedido: String(primera[1]).trim(),
    estado: { id: id, rotulo: publico.rotulo, texto: publico.texto },
    pasos: id === 'cancelado' ? [] : pasos,
    guia: id === 'despachado' || id === 'entregado' ? String(primera[15] || '') : '',
    pagoEnLinea: !!String(primera[17] || ''),
    total: Number(primera[11]) || 0,
    lineas: suyas.map(function (f) {
      return { nombre: String(f[6] || ''), variante: String(f[16] || ''), cantidad: Number(f[8]) || 0,
               subtotal: Number(f[10]) || 0 };
    })
  };
}

/* El comerciante pide un enlace desde el panel: para un pedido de antes de M5,
   o para mandárselo a quien lo perdió. Es un secreto NUEVO —del viejo solo hay
   huella—, así que el enlace anterior deja de funcionar, y el panel lo dice. */
function atenderEnlaceSeguimiento(p) {
  return conOperacion(p, function () {
    var cfg = leerConfiguracion();
    if (!rastreoEncendido(cfg)) return { ok: false, error: 'El seguimiento está apagado (f_rastreo = No).' };
    var sitio = String(cfg.sitio_url || '').trim().replace(/\/+$/, '');
    if (!sitio) return { ok: false, error: 'Falta sitio_url: sin la dirección de la tienda no hay enlace que armar.' };
    if (!/^https?:\/\//i.test(sitio)) sitio = 'https://' + sitio;
    var codigo = String(p.pedido || '').trim();
    var datos = lineasDePedidos();
    var indices = indicesDelPedido(datos.filas, codigo);
    if (!indices.length) return { ok: false, error: 'Ese pedido no está en la hoja.' };
    var secreto = aleatorio(16);
    var h = enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secreto)).slice(0, 32);
    indices.forEach(function (i) { datos.h.getRange(i + 2, 21).setValue(h); });
    return { ok: true, pedido: codigo,
             url: sitio + '/pedido.html?n=' + encodeURIComponent(codigo) + '&s=' + secreto,
             _registro: [{ que: 'Creó un enlace de seguimiento', donde: 'Pedidos · #' + codigo,
                           antes: String(datos.filas[indices[0]][20] || '') ? 'tenía otro (dejó de servir)' : '',
                           despues: 'enlace nuevo' }] };
  });
}

function registrarPedido(p) {
  var codigo = celdaSegura(p.pedido).slice(0, 12);
  if (!codigo) return { ok: false, error: 'Pedido sin número' };
  if (yaRegistrado(codigo)) return { ok: true, duplicado: true };

  var r = validarPedido({ items: p.items, cupon: p.cupon, envio: p.envio });
  if (!r.ok || !r.items.length) return { ok: false, error: 'Pedido sin líneas válidas' };

  guardarPedido({
    pedido: codigo,
    ref: codigo,
    estado: 'Nuevo',
    seguimiento: huellaDeSeguimiento(p.seg),
    ciudad: celdaSegura(p.ciudad),
    cupon: celdaSegura(r.cupon.ok ? r.cupon.codigo : ''),
    total: r.total,
    items: r.items.map(function (i) {
      /* `variante` viaja hasta aquí o no llega a la hoja: este map es el punto
         donde la línea validada se convierte en fila, y lo que no se nombre se
         pierde sin que nada falle. */
      return { id: i.id, nombre: celdaSegura(i.nombre), cantidad: i.cantidad,
               precio: i.precio, variante: i.variante || '' };
    })
  });

  /* El acta la escribe ESTA validación, que es la misma que acaba de producir
     la fila de Pedidos. Antes la escribía el sello, que podía llegar después de
     este registro y encontrarse la puerta cerrada. Una sola fuente para los dos
     renglones; lo demás se deriva. Y va ANTES de marcar: marcar es lo que cierra
     la puerta. */
  sellar({ pedido: codigo, sub: p.sub }, r.items, r, true);
  marcarRegistrado(codigo);
  anotarRescate(p.tarde);
  return { ok: true, lineas: r.items.length };
}

/* ==========================================================================
   LOS PEDIDOS QUE LLEGARON TARDE, CONTADOS.
   --------------------------------------------------------------------------
   La página guarda en el navegador del comprador el pedido que no pudo
   registrar, y lo reenvía la próxima vez que la tienda abra y este maestro
   conteste. Cada uno de esos reenvíos trae `tarde`: los minutos que pasaron.

   Cada rescate es un pedido que ESTUVO PERDIDO. Que llegue no borra eso: quiere
   decir que hubo un rato en que el comercio veía el chat de WhatsApp y no veía
   la fila, y que si el comprador no hubiera vuelto a abrir la tienda, no
   habría llegado nunca. Por eso se cuenta.

   Y por eso se guarda también EL PEOR: rescatar a los tres minutos es un
   tropiezo de red; rescatar a los dos días es que la tienda estuvo caída y
   nadie se enteró. El número solo no distingue esas dos cosas.

   Va en las propiedades del script y no en una pestaña: es un contador, no un
   dato del comercio, y una pestaña más es una pestaña más que explicarle.
   ========================================================================== */
function anotarRescate(tarde) {
  var minutos = Math.floor(Number(tarde) || 0);
  if (!(minutos > 0)) return;                     // un registro normal no cuenta
  try {
    var props = PropertiesService.getScriptProperties();
    var antes = JSON.parse(props.getProperty('RESCATES') || '{}');
    props.setProperty('RESCATES', JSON.stringify({
      n: (Number(antes.n) || 0) + 1,
      peor: Math.max(Number(antes.peor) || 0, minutos),
      ultimo: new Date().toISOString()
    }));
  } catch (e) { /* que no se lleve por delante el pedido, que es lo que importa */ }
}

function rescates() {
  try {
    var d = JSON.parse(PropertiesService.getScriptProperties()
                         .getProperty('RESCATES') || '{}');
    return { n: Number(d.n) || 0, peor: Number(d.peor) || 0,
             ultimo: String(d.ultimo || '') };
  } catch (e) { return { n: 0, peor: 0, ultimo: '' }; }
}

function aleatorio(n) {
  /* M5 · DE UNA FUENTE QUE NO SE ADIVINA. Math.random() no es para esto: el
     número del pedido y el secreto del seguimiento salen de aquí. getUuid() sí
     es aleatorio de verdad (UUID v4); se toman sus bytes. */
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', hex = '';
  while (s.length < n) {
    if (hex.length < 2) hex = Utilities.getUuid().replace(/-/g, '');
    s += abc.charAt(parseInt(hex.slice(0, 2), 16) % 32);
    hex = hex.slice(2);
  }
  return s;
}

/* ==========================================================================
   REGISTRO  —  POST desde navigator.sendBeacon
   ========================================================================== */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('POST vacío');

    /* ¿Es el panel? Un cuerpo con `a` es una puerta; el registro de pedidos
       viejo no trae `a` y sigue por su camino de siempre. Se mira antes del
       tope del registro porque el panel tiene el suyo. */
    var cuerpo = null;
    try { cuerpo = JSON.parse(e.postData.contents); } catch (x) { cuerpo = null; }
    if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.a === 'string') {
      recordarMiUrl();
      return json(atenderPorPost(cuerpo, e.postData.contents.length));
    }

    if (e.postData.contents.length > MAX_CUERPO) throw new Error('Cuerpo demasiado grande');

    var pedido = validarRegistro(JSON.parse(e.postData.contents));
    if (!pedido) throw new Error('Pedido sin líneas válidas');
    if (yaRegistrado(pedido.pedido)) return json({ ok: true, duplicado: true });
    guardarPedido(pedido);
    marcarRegistrado(pedido.pedido);
    return json({ ok: true });
  } catch (err) {
    registrarError(err, e);
    return json({ ok: false });     // sin detalles para quien esté sondeando
  }
}

/* ==========================================================================
   CATÁLOGO PÚBLICO  —  GET ?a=catalogo
   --------------------------------------------------------------------------
   Lo que la tienda pide al abrir para pintar precios, stock y tarifas reales.
   Así hay UNA sola lista de precios: esta. index.html solo aporta los nombres,
   las descripciones y las fotos, que son contenido y casi nunca cambian.

   Ojo: esto solo actualiza productos que YA existen en index.html. Un producto
   nuevo en la hoja no aparece solo en la tienda, porque le faltan descripción y
   fotos. Para agregar productos hay que tocar index.html.

   Va en caché un minuto para no leer la hoja en cada visita.
   ========================================================================== */
function catalogoPublico() {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('catalogo');
  if (guardado) return JSON.parse(guardado);

  /* MISMAS REGLAS QUE leerCatalogo(), Y NO ES CASUALIDAD. Esta lista es la que
     ve el comprador y aquella es con la que se valida el pedido. Si una usa
     `Number(...) || 0` y la otra no, un producto con el precio mal escrito se
     muestra a $0 y desaparece al validar: el peor de los dos mundos. Un precio
     ilegible saca el producto de las DOS. */
  CELDAS_ILEGIBLES = [];
  var productos = filas(H_CATALOGO).map(function (f, i) {
    var fila = i + 2;
    var id = String(f[0]).trim();
    var precio = cifra(f[4], 'Catálogo E' + fila + ' (Precio de ' + (id || fila) + ')');
    var stock  = cifra(f[5], 'Catálogo F' + fila + ' (Stock de ' + (id || fila) + ')');
    var antes  = cifra(f[11], 'Catálogo L' + fila + ' (Precio antes de ' + (id || fila) + ')');
    var umbral = cifra(f[12], 'Catálogo M' + fila + ' (Umbral bajo de ' + (id || fila) + ')');
    return {
      id:          id,
      nombre:      String(f[1] || '').trim(),
      formato:     String(f[2] || '').trim(),
      categoria:   String(f[3] || '').trim() || 'Otros',
      precio:      precio,
      stock:       stock === null ? 0 : Math.max(0, stock),
      descripcion: String(f[6] || '').trim(),
      // Todas las fotos del producto van en UNA celda, separadas por |
      imagenes:    fotosConTope(String(f[7] || '').split('|')
                     .map(function (u) { return u.trim(); })
                     .filter(function (u) { return u; })),
      destacado:   esSi(f[8]),
      activo:      esSi(f[9]),
      referencia:  String(f[10] || '').trim(),
      precioAntes: (antes && precio !== null && antes > precio) ? antes : 0,
      umbralBajo:  (umbral && umbral > 0) ? Math.floor(umbral) : 0,
      variantes:   variantesDeCelda(f[13],
                     'Catálogo N' + fila + ' (Variantes de ' + (id || fila) + ')')
    };
  }).filter(function (p) { return p.id && p.nombre && p.precio !== null; });

  /* C-1b. Mismas reglas que leerCatalogo, otra vez a propósito: el stock que
     ve el comprador y el que valida el pedido son el mismo. `skus` va al final
     y solo si el producto lleva inventario por combinación. */
  var inv = leerInventarioVariante();
  productos.forEach(function (p) {
    var s = skusDe(p.variantes, inv[p.id], 'Inventario por variante (' + p.id + ')');
    if (!s) return;
    p.stock = s.suma;
    p.skus = s.lista;
  });

  var envios = filas(H_ENVIOS).map(function (f, i) {
    var id = String(f[0]).trim();
    var valor = cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + (id || (i + 2)) + ')');
    /* Aquí el envío ilegible SÍ se muestra, con 0 y su nombre: quitarlo de la
       lista dejaría al comprador sin poder elegir su zona. El sello lo corrige
       y lo dice; esta lista es solo para escoger. */
    return { id: id, nombre: String(f[1]), valor: valor === null ? 0 : valor };
  }).filter(function (e) { return e.id; });

  if (CELDAS_ILEGIBLES.length) {
    anotarError('Celdas que no se pudieron leer como número',
                CELDAS_ILEGIBLES.join(' · '));
  }

  var r = { ok: true, productos: productos, envios: envios,
            config: configPublica(leerConfiguracion()),
            ilegibles: CELDAS_ILEGIBLES.length };
  // Solo cacheamos si hay algo. Guardar un catálogo vacío haría que, después de
  // ejecutar instalar(), la tienda siguiera viéndose vacía otro minuto entero.
  if (productos.length) cache.put('catalogo', JSON.stringify(r), 60);
  return r;
}

/** Convierte el POST de registro en algo con la forma que esperamos, o null. */
function validarRegistro(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.items)) return null;
  if (!d.items.length || d.items.length > MAX_ITEMS) return null;

  var catalogo = leerCatalogo();
  var vistos = {}, items = [];
  for (var i = 0; i < d.items.length; i++) {
    var it = d.items[i];
    if (!it || typeof it !== 'object') continue;
    var id = String(it.id || '');
    if (!catalogo[id] || vistos[id]) continue;     // el catálogo es la lista blanca
    vistos[id] = true;
    var cant = numeroSeguro(it.cantidad, MAX_CANTIDAD);
    if (cant < 1) continue;
    items.push({ id: id, nombre: celdaSegura(catalogo[id].nombre), cantidad: cant,
                 precio: numeroSeguro(it.precio, MAX_TOTAL) });
  }
  if (!items.length) return null;

  return {
    pedido: celdaSegura(d.pedido).slice(0, 12),
    ref:    celdaSegura(d.ref).slice(0, 12),
    estado: 'Nuevo',                // lo pone el script, no quien envía
    ciudad: celdaSegura(d.ciudad),
    cupon:  celdaSegura(d.cupon).slice(0, 20),
    total:  numeroSeguro(d.total, MAX_TOTAL),
    items:  items
  };
}

/* Segunda línea de defensa contra pedidos repetidos. La primera está en la
   tienda, que ya no genera un código nuevo por cada toque del botón. Esta cubre
   lo que la tienda no puede: que el navegador reenvíe el mismo aviso, o que el
   cliente vuelva atrás y toque otra vez.

   Miramos la caché y, por si acaso, las últimas filas de la hoja: la caché es
   rápida pero se puede vaciar. */
function yaRegistrado(codigo) {
  if (!codigo) return false;
  if (CacheService.getScriptCache().get('pedido:' + codigo)) return true;

  var h = elLibro().getSheetByName(H_PEDIDOS);
  if (!h || h.getLastRow() < 2) return false;
  var desde = Math.max(2, h.getLastRow() - 60);
  var recientes = h.getRange(desde, 2, h.getLastRow() - desde + 1, 1).getValues();
  for (var i = 0; i < recientes.length; i++) {
    if (String(recientes[i][0]).trim() === codigo) return true;
  }
  return false;
}

/* Se marca DESPUÉS de guardar, no antes. Si se marcara antes y el guardado
   fallara, el reintento se descartaría como duplicado y el pedido se perdería
   para siempre sin que nadie se enterara. */
function marcarRegistrado(codigo) {
  CacheService.getScriptCache().put('pedido:' + codigo, '1', 21600);   // seis horas
}

function guardarPedido(d) {
  var h = hoja(H_PEDIDOS, ENCABEZADO_PEDIDOS);
  if (h.getLastRow() > MAX_FILAS)
    throw new Error('La hoja llegó a ' + MAX_FILAS + ' filas. Archívala y vacíala.');

  var ahora = new Date();
  /* Las cuatro del medio —Inventario, Fecha de pago, Fecha de despacho, Guía—
     van vacías a propósito: las llena después el script o el comerciante. Y la
     fila llega hasta Variante porque escribir por POSICIÓN obliga a nombrar
     todas las de en medio; saltárselas correría la elección cuatro columnas a
     la izquierda y la dejaría en «Inventario». */
  /* Un pedido cobrado en línea llega YA pagado: trae su fecha de pago y con
     qué se cobró. Los de WhatsApp siguen igual, con esas celdas vacías. */
  var pago = d.pago || null;
  var f = d.items.map(function (i) {
    var fila = [ahora, d.pedido, d.ref, d.estado, d.ciudad, d.cupon, i.nombre, i.id,
                i.cantidad, i.precio, i.cantidad * i.precio, d.total,
                '', pago ? ahora : '', '', '', celdaSegura(i.variante || '')];
    /* Las tres del pago van siempre —vacías en WhatsApp— porque detrás viene
       Seguimiento, y escribir por posición obliga a nombrar las de en medio. */
    fila.push(pago ? celdaSegura(pago.proveedor) : '', pago ? celdaSegura(pago.referencia) : '',
              pago ? celdaSegura(pago.transaccion, 80) : '');
    fila.push(d.seguimiento || '');
    return fila;
  });
  h.getRange(h.getLastRow() + 1, 1, f.length, f[0].length).setValues(f);
}

/* ==========================================================================
   TABLERO
   --------------------------------------------------------------------------
   Las filas de Pedidos y Validaciones son datos; esto son respuestas. Un
   número solo no dice nada, así que cada uno va contra el mes anterior.

   Lo más valioso está en el embudo: sabemos cuántos carritos se armaron
   (Validaciones), cuántos llegaron a WhatsApp (Pedidos) y cuántos cerraste
   (Estado = Confirmado). Casi nadie que vende por WhatsApp conoce esos dos
   porcentajes, y a nosotros nos salen gratis de datos que ya guardamos.

   Se recalcula con el resumen: cada hora, al cambiar un Estado, y desde el
   menú de la hoja.
   ========================================================================== */
function recalcularTablero() {
  var m = calcularMetricas();
  pintarTablero(m);
  return m.filas;
}

/* Las cuentas viven aquí y en un solo sitio. El Tablero las pinta y el correo
   diario las manda: si algún día no cuadran entre sí, es que alguien duplicó
   esta función en vez de llamarla. */
function calcularMetricas() {
  var libro = elLibro();
  var ahora = new Date();
  var mesActual   = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var hace30 = new Date(ahora.getTime() - 30 * 24 * 3600 * 1000);
  var hace24 = new Date(ahora.getTime() - 24 * 3600 * 1000);
  var inicioHoy  = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var inicioAyer = new Date(inicioHoy.getTime() - 24 * 3600 * 1000);

  var fechaDe = function (v) {
    if (v instanceof Date) return v;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  var enMes = function (f, ref) {
    return f && f.getFullYear() === ref.getFullYear() && f.getMonth() === ref.getMonth();
  };
  /* «¿Ya se vendió?» se le pregunta a esVenta() y no se vuelve a escribir aquí.
     Esta función era una copia de la que usa el inventario, con la misma frase
     —indexOf('confirmado')— y bastaba tocar una para que el tablero y el stock
     empezaran a contar cosas distintas. Patrón 2 de la bitácora. */
  var confirmado = esVenta;

  // ---- Pedidos agrupados por número: el total se repite en cada línea ----
  var pedidos = {}, lineas = [];
  filas(H_PEDIDOS).forEach(function (f) {
    var codigo = String(f[1]).trim();
    if (!codigo) return;
    var fecha = fechaDe(f[0]);
    if (!pedidos[codigo]) {
      pedidos[codigo] = { fecha: fecha, estado: String(f[3]),
                          total: Number(f[11]) || 0, ciudad: String(f[4]).trim() };
    }
    lineas.push({ codigo: codigo, fecha: fecha, estado: String(f[3]), id: String(f[7]).trim(),
                  nombre: String(f[6]), cantidad: Number(f[8]) || 0, subtotal: Number(f[10]) || 0 });
  });

  var carritos = filas(H_VALIDACIONES).map(function (f) { return fechaDe(f[0]); });

  // ---- Métricas de un mes ----
  // hastaDia recorta el mes a sus primeros N días. Sirve para comparar este
  // mes, que va a la mitad, contra el mismo tramo del mes pasado: comparar
  // 4 días contra 30 no dice nada y siempre pinta mal.
  function delMes(ref, hastaDia) {
    var m = { ventas: 0, confirmados: 0, enviados: 0, carritos: 0 };
    var cabe = function (f) {
      return enMes(f, ref) && (!hastaDia || f.getDate() <= hastaDia);
    };
    Object.keys(pedidos).forEach(function (c) {
      var p = pedidos[c];
      if (!p.fecha || !cabe(p.fecha)) return;
      m.enviados++;
      if (confirmado(p.estado)) { m.confirmados++; m.ventas += p.total; }
    });
    carritos.forEach(function (f) { if (f && cabe(f)) m.carritos++; });
    m.ticket = m.confirmados ? Math.round(m.ventas / m.confirmados) : 0;
    m.tasaEnvio = m.carritos ? m.enviados / m.carritos : 0;
    m.tasaCierre = m.enviados ? m.confirmados / m.enviados : 0;
    return m;
  }
  var A = delMes(mesActual), B = delMes(mesAnterior);
  var Bhasta = delMes(mesAnterior, ahora.getDate());   // el mes pasado a esta misma altura

  // ---- Pendientes: el conteo y TAMBIÉN cuáles, que es lo accionable ----
  var porConfirmar = 0, viejos = 0, pendientes = [];
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (confirmado(p.estado) || esCancelado(p.estado)) return;
    porConfirmar++;
    var horas = p.fecha ? Math.floor((ahora - p.fecha) / 3600000) : 0;
    if (p.fecha && p.fecha < hace24) viejos++;
    pendientes.push({ codigo: c, fecha: p.fecha, ciudad: p.ciudad,
                      total: p.total, horas: horas });
  });
  pendientes.sort(function (a, b) { return b.horas - a.horas; });

  // ---- Ayer: lo que llegó y lo que se cerró ----
  var ayer = { enviados: 0, confirmados: 0, ventas: 0 };
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (!p.fecha || p.fecha < inicioAyer || p.fecha >= inicioHoy) return;
    ayer.enviados++;
    if (confirmado(p.estado)) { ayer.confirmados++; ayer.ventas += p.total; }
  });
  var he = libro.getSheetByName(H_ERRORES);
  var errores = he ? Math.max(0, he.getLastRow() - 1) : 0;

  // ---- Inventario ----
  var catalogo = filas(H_CATALOGO).filter(function (f) { return String(f[0]).trim() && esSi(f[9]); });
  var agotados = 0, pocos = 0, listaAgotados = [], listaPocos = [];
  catalogo.forEach(function (f) {
    var st = Number(f[5]) || 0;
    if (st === 0) { agotados++; listaAgotados.push(String(f[1])); }
    else if (st <= 5) { pocos++; listaPocos.push(String(f[1]) + ' (' + st + ')'); }
  });

  // ---- Movimiento de los últimos 30 días, solo ventas confirmadas ----
  var unidades = {}, ingresos = {}, ciudades = {}, pedidosCiudad = {};
  lineas.forEach(function (l) {
    if (!confirmado(l.estado) || !l.fecha || l.fecha < hace30) return;
    unidades[l.id] = (unidades[l.id] || 0) + l.cantidad;
    ingresos[l.id] = (ingresos[l.id] || 0) + l.subtotal;
  });
  Object.keys(pedidos).forEach(function (c) {
    var p = pedidos[c];
    if (!confirmado(p.estado) || !p.fecha || p.fecha < hace30) return;
    var ciudad = p.ciudad || 'Sin ciudad';
    if (!pedidosCiudad[ciudad]) pedidosCiudad[ciudad] = {};
    pedidosCiudad[ciudad][c] = true;
  });
  Object.keys(pedidosCiudad).forEach(function (c) {
    ciudades[c] = Object.keys(pedidosCiudad[c]).length;
  });

  var nombreDe = {};
  catalogo.forEach(function (f) { nombreDe[String(f[0]).trim()] = String(f[1]); });

  var masVendidos = Object.keys(unidades).map(function (id) {
    return [nombreDe[id] || id, unidades[id], ingresos[id]];
  }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

  var sinVender = catalogo.filter(function (f) {
    return !unidades[String(f[0]).trim()];
  }).map(function (f) { return String(f[1]); });

  var porCiudad = Object.keys(ciudades).map(function (c) { return [c, ciudades[c]]; })
    .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

  // ---- Serie de 6 meses, para el gráfico de barras ----
  var MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var meses = [];
  for (var k = 5; k >= 0; k--) {
    var ref = new Date(ahora.getFullYear(), ahora.getMonth() - k, 1);
    var m = delMes(ref);
    meses.push({ etiqueta: MES_CORTO[ref.getMonth()] + ' ' + String(ref.getFullYear()).slice(2),
                 ventas: m.ventas, pedidos: m.confirmados, actual: k === 0 });
  }

  return {
    ahora: ahora, A: A, B: B, Bhasta: Bhasta, diaDelMes: ahora.getDate(),
    ayer: ayer, meses: meses,
    porConfirmar: porConfirmar, viejos: viejos, pendientes: pendientes,
    errores: errores, agotados: agotados, pocos: pocos,
    listaAgotados: listaAgotados, listaPocos: listaPocos,
    sinVender: sinVender, masVendidos: masVendidos, porCiudad: porCiudad,
    avisame: listaDeAvisame(),
    cfg: leerConfiguracion(), url: libro.getUrl(), filas: 0
  };
}

/* ==========================================================================
   El tablero pintado.
   --------------------------------------------------------------------------
   Los gráficos van dibujados con bloques (█) y no con SPARKLINE a propósito:
   las fórmulas de Google cambian de separador según el idioma de la hoja
   (coma en inglés, punto y coma en español), así que una fórmula escrita
   desde el script se rompe en cuanto la hoja está en otro idioma. Un bloque
   de texto se ve igual en todas partes, sobrevive a copiar la hoja y no
   depende de nada.
   ========================================================================== */
var ANCHO_BARRA = 22;

function barra(valor, tope) {
  valor = Number(valor) || 0;
  tope = Number(tope) || 0;
  if (tope <= 0 || valor <= 0) return '';
  var n = Math.round(valor / tope * ANCHO_BARRA);
  if (n < 1) n = 1;
  var t = '';
  for (var i = 0; i < n; i++) t += '█';
  return t;
}

/* La variación, con su flecha y su color.
   Se compara SIEMPRE contra el mismo tramo del mes pasado (los primeros N
   días), no contra el mes pasado completo: si hoy es 4, comparar 4 días
   contra 30 siempre pinta mal y no dice nada. */
function variacion(hoy, antes) {
  hoy = Number(hoy) || 0; antes = Number(antes) || 0;
  if (!antes) {
    return { texto: hoy ? 'a esta altura el mes pasado no había nada' : '',
             color: hoy ? '#1B5E3A' : null };
  }
  var pct = Math.round((hoy - antes) / antes * 100);
  if (pct === 0) return { texto: 'igual', color: null };
  return { texto: (pct > 0 ? '▲ ' : '▼ ') + Math.abs(pct) + '%',
           color: pct > 0 ? '#1B5E3A' : '#B3261E' };
}

function pintarTablero(m) {
  var A = m.A, B = m.B, cfg = m.cfg;
  var VERDE  = cfg.color_secundario || '#1B5E3A';
  var ROJO   = cfg.color_principal  || '#D0211C';
  var TINTA  = '#1A1A1A', TENUE = '#707070', ALERTA = '#B3261E';
  var BANDA  = '#F1F1EF', LINEA = '#E4E4E1';

  var filas = [], estilo = [];
  var poner = function (a, b, c, d, e) {
    filas.push([a === undefined ? '' : a, b === undefined ? '' : b,
                c === undefined ? '' : c, d === undefined ? '' : d]);
    estilo.push(e || {});
    return filas.length + 0;   // número de fila dentro del bloque (1-based)
  };
  var seccion = function (titulo, b, c, d) {
    poner('', '', '', '', { alto: 10 });
    poner(titulo, b, c, d, { banda: true });
  };

  // ───────── Encabezado ─────────
  poner((cfg.negocio || 'Tienda').toUpperCase() + '  ·  TABLERO', '', '',
        'Actualizado ' + fechaCorta(m.ahora), { titulo: true });

  // ───────── Ventas del mes ─────────
  // La columna de comparación muestra el mes pasado HASTA EL MISMO DÍA, que es
  // contra lo que se calcula la variación. Poner ahí el mes completo y al lado
  // un porcentaje calculado contra otra cosa es la forma más fácil de que un
  // tablero mienta sin querer.
  var H = m.Bhasta, dias = m.diaDelMes;
  var tramo = 'Mes pasado a día ' + dias;
  seccion('VENTAS DE ESTE MES', 'Este mes', tramo, 'Variación');
  var vv = variacion(A.ventas, H.ventas);
  poner('Ventas confirmadas', A.ventas, H.ventas, vv.texto,
        { dinero: [2, 3], grande: true, notaColor: vv.color });
  var vp = variacion(A.confirmados, H.confirmados);
  poner('Pedidos confirmados', A.confirmados, H.confirmados, vp.texto, { notaColor: vp.color });
  var vt = variacion(A.ticket, H.ticket);
  poner('Ticket promedio', A.ticket, H.ticket, vt.texto, { dinero: [2, 3], notaColor: vt.color });
  poner('Mes anterior completo', B.ventas, B.confirmados ? B.confirmados + ' ventas' : '', '',
        { dinero: [2], tenue: true });

  // ───────── Gráfico: ventas mes a mes ─────────
  seccion('VENTAS MES A MES', 'Ventas', '', 'Pedidos');
  var topeMes = 0;
  m.meses.forEach(function (x) { if (x.ventas > topeMes) topeMes = x.ventas; });
  m.meses.forEach(function (x) {
    poner(x.etiqueta, x.ventas, barra(x.ventas, topeMes), x.pedidos || '',
          { dinero: [2], barra: 3, color: x.actual ? ROJO : VERDE,
            negrita: x.actual, numero: [4] });
  });
  if (!topeMes) poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });

  // ───────── Embudo ─────────
  seccion('EMBUDO DE ESTE MES', 'Cantidad', '', 'De cada paso al siguiente');
  var tope = Math.max(A.carritos, A.enviados, A.confirmados);
  poner('Carritos armados en la tienda', A.carritos, barra(A.carritos, tope), '',
        { barra: 3, color: VERDE });
  poner('Pedidos enviados a WhatsApp', A.enviados, barra(A.enviados, tope),
        A.carritos ? Math.round(A.tasaEnvio * 100) + '% de los carritos' : '',
        { barra: 3, color: VERDE });
  poner('Ventas confirmadas', A.confirmados, barra(A.confirmados, tope),
        A.enviados ? Math.round(A.tasaCierre * 100) + '% de los enviados' : '',
        { barra: 3, color: VERDE });
  poner('', '', '', 'Si cae el primero, revisa precio o envío. Si cae el segundo, WhatsApp.',
        { tenue: true });

  // ───────── Para atender hoy ─────────
  seccion('PARA ATENDER HOY', 'Cantidad', '', '');
  poner('Pedidos por confirmar', m.porConfirmar, '', '',
        { grande: m.porConfirmar > 0, color: m.porConfirmar > 0 ? TINTA : TENUE });
  poner('   de más de 24 horas', m.viejos, '',
        m.viejos ? 'Escríbeles hoy: cada hora que pasa se enfría la venta' : '',
        { color: m.viejos ? ALERTA : TENUE, notaColor: m.viejos ? ALERTA : null,
          negrita: m.viejos > 0 });
  poner('Errores registrados', m.errores, '',
        m.errores ? 'Mira la pestaña Errores' : '',
        { color: m.errores ? ALERTA : TENUE, notaColor: m.errores ? ALERTA : null });

  // ───────── Inventario ─────────
  seccion('INVENTARIO', 'Cantidad', '', 'Cuáles');
  poner('Productos agotados', m.agotados, '',
        m.listaAgotados.slice(0, 4).join(', ') +
        (m.listaAgotados.length > 4 ? ' y ' + (m.listaAgotados.length - 4) + ' más' : ''),
        { color: m.agotados ? ALERTA : TENUE, notaColor: m.agotados ? ALERTA : null });
  poner('Con 5 unidades o menos', m.pocos, '',
        m.listaPocos.slice(0, 4).join(', ') +
        (m.listaPocos.length > 4 ? ' y ' + (m.listaPocos.length - 4) + ' más' : ''),
        { color: m.pocos ? TINTA : TENUE });
  poner('Sin vender en 30 días', m.sinVender.length, '',
        m.sinVender.slice(0, 4).join(', ') +
        (m.sinVender.length > 4 ? ' y ' + (m.sinVender.length - 4) + ' más' : ''),
        { color: TINTA });

  // ───────── Lo que más se vende ─────────
  seccion('LO QUE MÁS SE VENDE', 'Unidades', '', 'Ingresos (30 días)');
  if (m.masVendidos.length) {
    var topeU = m.masVendidos[0][1];
    m.masVendidos.forEach(function (x) {
      poner(x[0], x[1], barra(x[1], topeU), x[2], { barra: 3, color: ROJO, dinero: [4] });
    });
  } else {
    poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });
  }

  // ───────── Dónde compran ─────────
  seccion('DÓNDE COMPRAN', 'Pedidos', '', '');
  if (m.porCiudad.length) {
    var topeC = m.porCiudad[0][1];
    m.porCiudad.forEach(function (x) {
      poner(x[0], x[1], barra(x[1], topeC), '', { barra: 3, color: VERDE });
    });
  } else {
    poner('Todavía no hay ventas confirmadas', '', '', '', { tenue: true });
  }

  poner('', '', '', '', { alto: 10 });
  poner('Esta pestaña la escribe el script solo: lo que anotes aquí se pierde en el próximo recálculo.',
        '', '', '', { tenue: true });

  // ───────── Volcado a la hoja ─────────
  var h = hoja(H_TABLERO, ['Tablero', '', '', '']);
  var maxFilas = Math.max(h.getMaxRows(), filas.length + 1);
  h.getRange(1, 1, maxFilas, 4).clearContent();
  h.getRange(1, 1, filas.length, 4).setValues(filas);

  h.setHiddenGridlines(true);
  h.setColumnWidth(1, 260); h.setColumnWidth(2, 120);
  h.setColumnWidth(3, 230); h.setColumnWidth(4, 330);

  var todo = h.getRange(1, 1, filas.length, 4);
  todo.setFontFamily('Inter').setFontSize(10).setFontColor(TINTA)
      .setBackground('#FFFFFF').setVerticalAlignment('middle').setWrap(false);
  h.getRange(1, 2, filas.length, 1).setHorizontalAlignment('right');

  estilo.forEach(function (e, i) {
    var f = i + 1;
    if (e.alto) h.setRowHeight(f, e.alto);
    if (e.titulo) {
      h.getRange(f, 1, 1, 3).merge();
      h.getRange(f, 1, 1, 4).setBackground(VERDE).setFontColor('#FFFFFF');
      h.getRange(f, 1).setFontSize(14).setFontWeight('bold');
      h.getRange(f, 4).setFontSize(9).setHorizontalAlignment('right');
      h.setRowHeight(f, 40);
      return;
    }
    if (e.banda) {
      h.getRange(f, 1, 1, 4).setBackground(BANDA).setFontWeight('bold')
       .setFontSize(9).setFontColor(TENUE);
      h.getRange(f, 1).setFontColor(TINTA).setFontSize(10);
      h.getRange(f, 2, 1, 3).setHorizontalAlignment('right');
      h.getRange(f, 4).setHorizontalAlignment('left');
      h.setRowHeight(f, 26);
      return;
    }
    if (e.tenue) h.getRange(f, 1, 1, 4).setFontColor(TENUE).setFontStyle('italic');
    if (e.grande) h.getRange(f, 2).setFontSize(14).setFontWeight('bold');
    if (e.negrita) h.getRange(f, 1).setFontWeight('bold');
    if (e.color) h.getRange(f, 2).setFontColor(e.color);
    if (e.notaColor) h.getRange(f, 4).setFontColor(e.notaColor);
    if (e.barra) h.getRange(f, e.barra).setFontColor(e.color || VERDE)
                  .setFontFamily('Roboto Mono').setFontSize(9);
    (e.dinero || []).forEach(function (c) { h.getRange(f, c).setNumberFormat('"$"#,##0'); });
    (e.numero || []).forEach(function (c) { h.getRange(f, c).setNumberFormat('#,##0'); });
    h.getRange(f, 1, 1, 4).setBorder(false, false, true, false, false, false,
                                     LINEA, null);
  });

  m.filas = filas.length;
  return filas.length;
}

function fechaCorta(d) {
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() +
         '  ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* ==========================================================================
   CATÁLOGO DE RESPALDO PARA index.html
   --------------------------------------------------------------------------
   La tienda le pregunta el catálogo a la hoja cada vez que carga. Si Google no
   contesta —mantenimiento, cuota, un mal día— sirve el catálogo que trae el
   propio archivo. Ese respaldo hay que refrescarlo de vez en cuando, y a mano
   es un trabajo horrible.

   Esto lo escribe solo, con los precios y el stock de HOY, en el formato exacto
   que espera index.html. Se copia y se pega entre las marcas. Nada más.
   ========================================================================== */
function generarInventario() {
  var productos = filas(H_CATALOGO).filter(function (f) {
    return String(f[0]).trim() && esSi(f[9]);
  });
  var envios = filas(H_ENVIOS).filter(function (f) { return String(f[0]).trim(); });

  var txt = function (v) {
    return '"' + String(v === undefined || v === null ? '' : v)
      .replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/[\r\n]+/g, ' ').trim() + '"';
  };

  /* LA MISMA FORMA QUE ESCRIBE EL MONTAJE, marca por marca y constante por
     constante. Este es el camino de a mano y aquel el automático, pero los dos
     dejan el mismo bloque en el mismo sitio: dos formas del mismo bloque es lo
     que hace falta para que un día la expresión regular del montaje encuentre
     una y no la otra y se plante sin motivo (patrón 2). */
  var cfg = configPublica(leerConfiguracion());
  var claves = Object.keys(cfg).sort();

  var lineas = [];
  /* LA VERSIÓN, NO LA FECHA (historia A-6): el mismo cambio que
     montar/sembrar-respaldo.mjs, y por la misma razón -un archivo horneado
     dos veces sin tocar la hoja tiene que salir igual, y una fecha cambia
     sola con solo dejar pasar la medianoche-. */
  lineas.push('/* ═══ CATÁLOGO DE RESPALDO — versión ' + VERSION + ' ═══');
  lineas.push('   Lo que la página pinta ANTES de que conteste nadie, y lo único que le');
  lineas.push('   queda si no contesta nadie. Normalmente lo escribe el flujo montaje;');
  lineas.push('   esto queda para una tienda que todavía no puede correrlo. La opción');
  lineas.push('   del menú que lo generaba se derogó en el Sprint 5. */');
  lineas.push('const CONFIG_SEMILLA = {');
  lineas.push(claves.map(function (k) {
    return '  ' + txt(k) + ': ' + txt(cfg[k]);
  }).join(',\n'));
  lineas.push('};');
  lineas.push('');
  lineas.push('const ENVIOS = [');
  lineas.push(envios.map(function (f) {
    return '  { id:' + txt(f[0]) + ', nombre:' + txt(f[1]) +
           ', valor:' + (Number(f[2]) || 0) + ' }';
  }).join(',\n'));
  lineas.push('];');
  lineas.push('');
  lineas.push('const PRODUCTOS = [');
  lineas.push(productos.map(function (f) {
    var fotos = String(f[7] || '').split('|')
      .map(function (u) { return u.trim(); })
      .filter(function (u) { return u; });
    if (!fotos.length) fotos = [''];
    return '  { id:' + txt(f[0]) + ', nombre:' + txt(f[1]) +
           ', formato:' + txt(f[2]) + ', categoria:' + txt(f[3]) + ',\n' +
           '    precio:' + (Number(f[4]) || 0) + ', stock:' + (Number(f[5]) || 0) + ',\n' +
           '    imagenes:[' + fotos.map(txt).join(', ') + '],\n' +
           '    descripcion:' + txt(f[6]) + ' }';
  }).join(',\n\n'));
  lineas.push('];');
  lineas.push('/* ═══ FIN DEL CATÁLOGO DE RESPALDO ═══ */');

  var bloque = lineas.join('\n');
  console.log(bloque);
  return { tipo: 'html', titulo: 'Catálogo de respaldo para index.html',
           html: ventanaInventario(bloque, productos.length, envios.length),
           bloque: bloque };
}

/* El dibujo que se usa mientras un producto no tenga fotos. Sale del formato,
   que es donde ya está la pista: "Frasco 300 g", "Botella 500 ml". */
/* formaDe() vivía aquí. Qué dibujo se usa cuando un producto no tiene foto
   es una decisión de la página, y la página ya la toma para lo que llega en
   vivo. Tenerla también aquí eran dos implementaciones del mismo criterio
   con el respaldo heredando la de este lado por id — y un producto que no
   estuviera en el respaldo se dibujaba con el marcador por defecto. */

function ventanaInventario(bloque, cuantos, envios) {
  var caja = 'width:100%;box-sizing:border-box;font:12px/1.5 Menlo,Consolas,monospace;' +
             'border:1px solid #D8D8D8;border-radius:6px;padding:10px;background:#FAFAFA;' +
             'resize:vertical;white-space:pre;overflow-x:auto';
  var nota = 'margin:0 0 10px;font:400 12px/1.55 Arial,sans-serif;color:#666';
  var boton = 'margin-top:8px;padding:8px 15px;border:1px solid #111;background:#111;color:#FFF;' +
              'border-radius:6px;font:600 12px Arial,sans-serif;cursor:pointer';

  var html =
    '<div style="font-family:Arial,sans-serif;padding:4px 6px 18px">' +
    '<p style="' + nota + ';color:#111;font-size:13px"><b>' + cuantos + ' productos</b> y <b>' +
      envios + ' zonas de envío</b>, con los precios y el stock de hoy.</p>' +
    '<p style="' + nota + '">Pega esto en <b>index.html</b> reemplazando todo lo que hay entre ' +
    '<code>CATÁLOGO DE RESPALDO</code> y <code>FIN DEL CATÁLOGO DE RESPALDO</code>, marcas incluidas. ' +
    'Después vuelve a publicar el sitio.</p>' +
    '<textarea id="a" rows="18" style="' + caja + '" readonly>' + escaparHtml(bloque) + '</textarea>' +
    '<button style="' + boton + '" onclick="copiar()">Copiar el catálogo de respaldo</button>' +
    '<p style="' + nota + ';margin-top:20px"><b>Esto no es obligatorio.</b> La tienda funciona sin ' +
    'volver a generarlo: los precios y el stock reales salen de la hoja en caliente. Este bloque es ' +
    'el paracaídas para el día en que Google no responda, y conviene refrescarlo cuando cambien ' +
    'precios o entren productos nuevos.</p>' +
    '<script>function copiar(){var t=document.getElementById("a");t.select();' +
    't.setSelectionRange(0,999999);try{document.execCommand("copy");' +
    'var b=document.querySelector("button");b.textContent="Copiado";' +
    'setTimeout(function(){b.textContent="Copiar el catálogo de respaldo";},1800);}catch(e){}}<\/script>' +
    '</div>';

  return html;
}

/* ==========================================================================
   PRESENTACIÓN DE LAS HOJAS
   --------------------------------------------------------------------------
   La hoja es el panel de control del dueño, no un volcado de datos. Esto le
   pone encabezado de color, anchos, formatos de moneda y fecha, y listas
   desplegables en todo campo donde una errata rompe algo: un "confirmado" con
   minúscula o un "Si" sin tilde y el inventario deja de moverse.

   Es idempotente: se puede ejecutar mil veces. Corre al instalar y desde el
   menú de la hoja > Actualizar tablero e inventario.
   ========================================================================== */
var TINTA_HOJA = '#1A1A1A';
var LINEA_HOJA = '#D9D9D6';

/* ==========================================================================
   ¿ESTÁ ESTA TIENDA TERMINADA?
   --------------------------------------------------------------------------
   El diagnóstico contesta «¿está funcionando?». Esta es otra pregunta —«¿está
   terminada?»— y hasta ahora no la contestaba nadie. Se comprobaban cinco
   claves al escribir el index, y solo esas cinco: una tienda podía salir al
   aire sin llave de pago, sin datos legales y sin correo de resumen, y nada lo
   decía. El que monta se acordaba, o no.

   Con una tienda eso se lleva en la cabeza. Con ocho, no — y esa es justamente
   la condición para poder añadir la siguiente: que lo que falta se pueda MIRAR
   en vez de recordarlo.

   DOS NIVELES, Y LA DIFERENCIA IMPORTA. Lo que BLOQUEA es lo que rompe la venta:
   sin celular el pedido no llega a ninguna parte, sin llave de pago el comprador
   termina el pedido y no tiene cómo pagar —que es el agujero que abre a
   propósito sacar la llave de la página—. Lo que AVISA deja la tienda vendiendo
   pero a medias, y merece salir de la lista antes de cobrarle a nadie.

   Un valor entre corchetes cuenta como vacío: es lo que deja instalar() para
   que se vea que falta, y publicar así anuncia la tienda como
   «[NOMBRE DEL COMERCIO]».
   ========================================================================== */
var LISTA_DE_ALTA = [
  { clave: 'negocio',           bloquea: true,
    porQue: 'sin nombre, la tienda se anuncia con un corchete' },
  { clave: 'whatsapp',          bloquea: true,
    porQue: 'sin celular el pedido no llega a ninguna parte' },
  { clave: 'sitio_url',         bloquea: true,
    porQue: 'sin dirección no funcionan «Ver mi tienda» ni la comprobación de publicación' },
  /* Solo cuando la venta se cierra por WhatsApp: cobrando en línea, el
     comprador paga en la pasarela y la llave Bre-B no hace falta. */
  { clave: 'pago_llave',        bloquea: true,
    evaluar: function (c) { return sinLlenar(c.pago_llave) && cobroVigente(c).modo !== 'pasarela'; },
    porQue: 'el comprador termina el pedido y no tiene cómo pagar' },

  /* DECISIÓN 09 (docs/DECISIONES.md): sin quién responde, un texto de
     tratamiento de datos o de retracto no obliga a nadie. Suben a bloquear el
     mismo día en que los textos legales empiezan a usar estas claves de
     verdad (historia A-4) — antes de eso, bloquear no tenía sentido. */
  { clave: 'empresa_razon',     bloquea: true,
    porQue: 'el texto de tratamiento de datos queda sin responsable' },
  { clave: 'empresa_nit',       bloquea: true,
    porQue: 'la Ley 1581 pide identificar al responsable del tratamiento' },
  { clave: 'empresa_direccion', bloquea: true,
    porQue: 'el aviso de privacidad queda incompleto' },
  { clave: 'empresa_ciudad',    bloquea: true,
    porQue: 'el aviso de privacidad no dice dónde se ejercen los derechos' },
  /* AL MENOS UNO de los dos, no los dos: exigir ambos sería pedir más de lo
     que pide la propia ley. La clave que se reporta no es una columna de la
     hoja: es el par completo, para que el mensaje no mienta sobre qué falta. */
  { clave: 'empresa_correo_o_tel', bloquea: true,
    evaluar: function (c) { return sinLlenar(c.empresa_correo) && sinLlenar(c.empresa_tel); },
    porQue: 'no hay ningún modo de contactar al responsable de los datos personales: falta empresa_correo y también empresa_tel' },

  { clave: 'pago_titular',      porQue: 'el comprador no sabe a nombre de quién transfiere' },
  { clave: 'pago_entidad',      porQue: 'ni a qué banco o billetera' },
  { clave: 'repositorio',       porQue: '«Publicar ahora» no puede disparar nada' },
  { clave: 'correo_resumen',    porQue: 'no llega el resumen diario del negocio' },
  { clave: 'sitio_titulo',      porQue: 'el enlace se comparte sin decir qué es' },
  { clave: 'sitio_descripcion', porQue: 'el texto que se ve debajo del enlace compartido queda en blanco' },
  { clave: 'respaldo_carpeta',  porQue: 'no se guarda copia semanal de la hoja' },

  /* M3.5. Ninguna de las dos bloquea, a propósito: la primera deja la tienda
     vendiendo por WhatsApp, y la segunda es justamente el estado en que se
     prueba la pasarela en la tienda publicada —bloquear impediría probarla—.
     Pero las dos tienen que verse, y la segunda antes de abrir al público: en
     pruebas, una tarjeta de prueba «paga» y descuenta inventario. */
  { clave: 'cobro_modo',
    evaluar: function (c) { return !!cobroVigente(c).problema; },
    porQue: 'se pidió cobrar en línea y la pasarela no está lista: la tienda sigue por WhatsApp' },
  { clave: 'cobro_ambiente',
    evaluar: function (c) { var v = cobroVigente(c); return v.modo === 'pasarela' && v.ambiente !== 'produccion'; },
    porQue: 'la pasarela está en PRUEBAS: nadie paga de verdad y una tarjeta de prueba descuenta inventario' }
];

function sinLlenar(valor) {
  var t = String(valor === null || valor === undefined ? '' : valor).trim();
  return !t || /^\[.*\]$/.test(t);
}

function revisarTienda(cfg) {
  var c = cfg || leerConfiguracion();
  var bloquean = [], avisan = [];
  LISTA_DE_ALTA.forEach(function (x) {
    /* La mayoría se miran por su propia clave; alguna —«al menos uno de
       correo o teléfono»— no es una sola celda, y trae su propio evaluar(c)
       en vez de sinLlenar(c[x.clave]). */
    var falta = x.evaluar ? x.evaluar(c) : sinLlenar(c[x.clave]);
    if (!falta) return;
    (x.bloquea ? bloquean : avisan).push({ clave: x.clave, porQue: x.porQue });
  });
  return { lista: !bloquean.length && !avisan.length,
           puedeVender: !bloquean.length,
           bloquean: bloquean, avisan: avisan };
}

/* ==========================================================================
   EL CICLO DE VIDA DE UN PEDIDO, EN UN SOLO SITIO.
   --------------------------------------------------------------------------
   Eran tres estados —Por confirmar, Confirmado, Anulado— y describían mal lo
   que pasa de verdad: entre «me llegó» y «lo pagó» hay una espera que el
   comercio vive todos los días, y entre «lo pagó» y «lo recibió» hay dos pasos
   más. Un pedido pagado y sin despachar y uno ya entregado no son lo mismo, y
   con tres estados se veían iguales.

   LA REGLA QUE MANDA: el inventario se descuenta al pasar a PAGADO, y solo
   ahí. No al llegar el pedido —un carrito abierto en WhatsApp no es una venta,
   y reservar stock por eso vacía el catálogo con pedidos que nunca se pagan— y
   no antes. Despachado y entregado vienen DESPUÉS de pagado, así que siguen
   contando como vendido: si no, despachar un pedido le devolvería el stock.

   CONVIVENCIA. Cada estado nuevo sabe a qué viejo reemplaza, así que una hoja
   que todavía diga «Confirmado» se sigue leyendo bien. `migrarEstados()` la
   pone al día, y solo entonces se retiran los viejos. El backend acepta los
   dos mientras tanto — que es lo que evita que una tienda se quede muda el día
   del despliegue.

   Y ESTO ES LA ÚNICA FUENTE. Antes la pregunta «¿esto ya se vendió?» estaba
   escrita dos veces —una en las métricas y otra en el inventario— con la misma
   frase copiada, `indexOf('confirmado')`. Dos copias de la misma regla es el
   patrón 2 de la bitácora: basta tocar una para que el tablero y el stock
   empiecen a contar cosas distintas.
   ========================================================================== */
var ESTADOS = [
  { id: 'nuevo',          rotulo: 'Nuevo',             viejo: 'Por confirmar' },
  { id: 'pendiente_pago', rotulo: 'Pendiente de pago', viejo: '' },
  { id: 'pagado',         rotulo: 'Pagado',            viejo: 'Confirmado', vendido: true },
  { id: 'despachado',     rotulo: 'Despachado',        viejo: '', vendido: true },
  { id: 'entregado',      rotulo: 'Entregado',         viejo: '', vendido: true },
  { id: 'cancelado',      rotulo: 'Cancelado',         viejo: 'Anulado' }
];

var ESTADOS_PEDIDO = ESTADOS.map(function (e) { return e.rotulo; });

/* Compara sin tildes, sin mayúsculas y sin espacios de más, porque una celda
   escrita a mano trae de todo. Lo que NO hace es adivinar por trozos: buscar
   «confirmado» dentro del texto es lo que hacía que «Confirmado el pago»
   contara como venta y «pendiente de confirmado» también. */
function llano(t) {
  return String(t === null || t === undefined ? '' : t)
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
    .replace(/\s+/g, ' ').trim();
}

/* El estado que corresponde a lo que diga la celda, o null si no se reconoce.
   NULL NO ES «NO VENDIDO»: es «no se sabe», y quien lo reciba tiene que
   tratarlo como tal. Ver aplicarInventario(). */
function estadoDe(texto) {
  var t = llano(texto);
  if (!t) return null;
  for (var i = 0; i < ESTADOS.length; i++) {
    var e = ESTADOS[i];
    if (t === llano(e.id) || t === llano(e.rotulo) ||
        (e.viejo && t === llano(e.viejo))) return e;
  }
  return null;
}

/** ¿Esta línea ya es una venta? Es la única definición que hay. */
function esVenta(texto) {
  var e = estadoDe(texto);
  return !!(e && e.vendido);
}

/** ¿Y esta se canceló? Un pedido cancelado no espera nada de nadie. */
function esCancelado(texto) {
  var e = estadoDe(texto);
  return !!e && e.id === 'cancelado';
}

/* Las celdas de Estado que no se pudieron leer. Se llena al mover el
   inventario y la vacía el diagnóstico, igual que CELDAS_ILEGIBLES. */
var ESTADOS_ILEGIBLES = [];

/* ==========================================================================
   MIGRAR LOS ESTADOS VIEJOS, UNA VEZ Y SIN PERDER NADA.
   --------------------------------------------------------------------------
   El backend acepta los viejos, así que esto no es urgente ni arriesgado: es
   lo que permite que la lista desplegable pase a ofrecer solo los nuevos sin
   dejar media hoja con un triángulo de advertencia.

   Solo toca las celdas cuyo texto es EXACTAMENTE un estado viejo conocido.
   Una celda con otra cosa se queda como está y la denuncia el diagnóstico: si
   esto «arreglara» lo que no entiende, sería justo lo que no se le puede
   pedir a una migración.
   ========================================================================== */
function migrarEstados() {
  var hp = elLibro().getSheetByName(H_PEDIDOS);
  if (!hp || hp.getLastRow() < 2) return 0;

  var rango = hp.getRange(2, COL_ESTADO, hp.getLastRow() - 1, 1);
  var celdas = rango.getValues();
  var cambios = 0;

  var nuevos = celdas.map(function (f) {
    var t = llano(f[0]);
    if (!t) return f;
    for (var i = 0; i < ESTADOS.length; i++) {
      var e = ESTADOS[i];
      if (e.viejo && t === llano(e.viejo)) { cambios++; return [e.rotulo]; }
    }
    return f;
  });

  if (cambios) rango.setValues(nuevos);
  return cambios;
}
var SI_NO          = ['Sí', 'No'];
var TIPOS_CUPON    = ['porcentaje', 'fijo', 'envio'];

function lista(opciones, permitirOtros, ayuda) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(opciones, true)
    .setAllowInvalid(!!permitirOtros)
    .setHelpText(ayuda || ('Elige de la lista: ' + opciones.join(', ')))
    .build();
}

function presentarHojas() {
  var libro = elLibro();
  var cfg = leerConfiguracion();
  var VERDE = cfg.color_secundario || '#1B5E3A';

  var encabezar = function (h, anchos) {
    var cols = Math.max(h.getLastColumn(), (anchos || []).length, 1);
    h.getRange(1, 1, 1, cols)
     .setBackground(VERDE).setFontColor('#FFFFFF').setFontWeight('bold')
     .setFontSize(10).setVerticalAlignment('middle').setWrap(true);
    h.setRowHeight(1, 34);
    h.setFrozenRows(1);
    (anchos || []).forEach(function (a, i) { if (a) h.setColumnWidth(i + 1, a); });
    var filas = Math.max(h.getLastRow() - 1, 1);
    h.getRange(2, 1, filas, cols)
     .setFontSize(10).setFontColor(TINTA_HOJA).setVerticalAlignment('middle');
    return { cols: cols, filas: filas };
  };

  // ---- Configuración ----
  var cfgH = libro.getSheetByName(H_CONFIG);
  if (cfgH) {
    encabezar(cfgH, [220, 430, 400]);
    var n = Math.max(cfgH.getLastRow() - 1, 1);
    cfgH.getRange(2, 1, n, 1).setFontWeight('bold').setFontFamily('Roboto Mono').setFontSize(9);
    cfgH.getRange(2, 2, n, 2).setWrap(true);
    cfgH.getRange(2, 3, n, 1).setFontColor('#777777').setFontSize(9);
    validarPorClave(cfgH, 'correo_siempre', lista(SI_NO, false));
    validarPorClave(cfgH, 'fotos_webp', lista(SI_NO, false));
    validarPorClave(cfgH, 'cobro_modo', lista(COBRO_MODOS, false));
    validarPorClave(cfgH, 'cobro_ambiente', lista(COBRO_AMBIENTES, false));
    validarPorClave(cfgH, 'tienda_abierta', lista(SI_NO, false));
    sincronizarColores();
  }

  // ---- Catálogo ----
  var cat = libro.getSheetByName(H_CATALOGO);
  if (cat) {
    var c = encabezar(cat, [110, 230, 130, 120, 100, 80, 380, 320, 100, 90, 120, 110, 100]);
    cat.getRange(2, 5, c.filas, 1).setNumberFormat('"$"#,##0');
    cat.getRange(2, 6, c.filas, 1).setNumberFormat('#,##0').setHorizontalAlignment('center');
    cat.getRange(2, 1, c.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
    cat.getRange(2, 7, c.filas, 2).setWrap(true).setFontSize(9);
    cat.getRange(2, 9, c.filas, 2).setHorizontalAlignment('center');
    cat.getRange(2, 4, c.filas, 1).setDataValidation(lista(categoriasDelCatalogo(), true,
      'Elige una categoría o escribe una nueva'));
    cat.getRange(2, 9, c.filas, 2).setDataValidation(lista(SI_NO, false));
  }

  // ---- Envíos ----
  var env = libro.getSheetByName(H_ENVIOS);
  if (env) {
    var e = encabezar(env, [140, 320, 120]);
    env.getRange(2, 1, e.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
    env.getRange(2, 3, e.filas, 1).setNumberFormat('"$"#,##0');
  }

  // ---- Cupones ----
  var cup = libro.getSheetByName(H_CUPONES);
  if (cup) {
    var u = encabezar(cup, [140, 110, 100, 110, 110, 110, 130, 90, 260]);
    cup.getRange(2, 1, u.filas, 1).setFontFamily('Roboto Mono').setFontWeight('bold');
    cup.getRange(2, 3, u.filas, 2).setNumberFormat('#,##0');
    cup.getRange(2, 5, u.filas, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
    cup.getRange(2, 6, u.filas, 2).setHorizontalAlignment('center');
    cup.getRange(2, 8, u.filas, 1).setHorizontalAlignment('center');
    cup.getRange(2, 9, u.filas, 1).setWrap(true).setFontSize(9).setFontColor('#777777');
    cup.getRange(2, 2, u.filas, 1).setDataValidation(lista(TIPOS_CUPON, false,
      'porcentaje = % de descuento · fijo = pesos · envio = envío gratis'));
    cup.getRange(2, 8, u.filas, 1).setDataValidation(lista(SI_NO, false));
    cup.getRange(2, 7, u.filas, 1).setFontColor('#777777');   // lo lleva el script
  }

  // ---- Pedidos: la lista del Estado es la más importante de todas ----
  var ped = libro.getSheetByName(H_PEDIDOS);
  if (ped) {
    var p = encabezar(ped, [140, 90, 90, 130, 130, 110, 220, 100, 80, 110, 110, 120, 110, 110, 120, 130]);
    ped.setFrozenColumns(2);
    ped.getRange(2, 1, p.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    ped.getRange(2, 2, p.filas, 2).setFontFamily('Roboto Mono').setHorizontalAlignment('center');
    ped.getRange(2, 9, p.filas, 1).setHorizontalAlignment('center');
    ped.getRange(2, 10, p.filas, 3).setNumberFormat('"$"#,##0');
    ped.getRange(2, 13, p.filas, 1).setHorizontalAlignment('center')
       .setFontSize(9).setFontColor('#777777');
    ped.getRange(2, COL_ESTADO, Math.max(p.filas, 500), 1)
       .setDataValidation(lista(ESTADOS_PEDIDO, false,
         'PAGADO descuenta el inventario, y solo Pagado. Despachado y Entregado ' +
         'vienen después, así que lo mantienen descontado. Cancelado lo devuelve.'))
       .setHorizontalAlignment('center').setFontWeight('bold');
  }

  // ---- Validaciones ----
  var val = libro.getSheetByName(H_VALIDACIONES);
  if (val) {
    var v2 = encabezar(val, [140, 90, 120, 130, 130, 110, 110, 100, 120, 320, 380]);
    val.getRange(2, 1, v2.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    val.getRange(2, 2, v2.filas, 1).setFontFamily('Roboto Mono').setHorizontalAlignment('center');
    val.getRange(2, 4, v2.filas, 6).setNumberFormat('"$"#,##0');
    val.getRange(2, 10, v2.filas, 1).setFontSize(9).setFontColor('#777777');
  }

  // ---- Más vendidos ----
  var res = libro.getSheetByName(H_RESUMEN);
  if (res) {
    var r2 = encabezar(res, [260, 110, 140, 140, 170]);
    res.getRange(2, 3, r2.filas, 1).setNumberFormat('#,##0').setHorizontalAlignment('center');
    res.getRange(2, 4, r2.filas, 1).setNumberFormat('"$"#,##0');
    res.getRange(2, 5, r2.filas, 1).setHorizontalAlignment('center');
    res.getRange(2, 2, r2.filas, 1).setFontFamily('Roboto Mono').setFontSize(9);
  }

  // ---- Errores ----
  var err = libro.getSheetByName(H_ERRORES);
  if (err) {
    var e2 = encabezar(err, [150, 320, 460]);
    err.getRange(2, 1, e2.filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    err.getRange(2, 2, e2.filas, 2).setWrap(true).setFontSize(9);
    err.getRange(2, 2, e2.filas, 1).setFontColor('#B3261E');
  }
  return true;
}

function categoriasDelCatalogo() {
  var vistas = {}, salida = [];
  filas(H_CATALOGO).forEach(function (f) {
    var c = String(f[3]).trim();
    if (c && !vistas[c]) { vistas[c] = true; salida.push(c); }
  });
  return salida.length ? salida : ['General'];
}

function validarPorClave(h, clave, regla) {
  var datos = filas(H_CONFIG);
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === clave) {
      h.getRange(i + 2, 2).setDataValidation(regla);
      return;
    }
  }
}

/* ==========================================================================
   LOS COLORES SE PUEDEN PINTAR
   --------------------------------------------------------------------------
   Pedirle un código hexadecimal a alguien que no programa es pedirle que
   adivine. Aquí el dueño PINTA la celda del valor con el balde de pintura de
   Google, y el código sale solo.

   Funciona en las dos direcciones:
   - Escribió un código -> alEditar() pinta la celda con ese color.
   - Pintó la celda     -> esto lee el relleno y escribe el código.

   Cuál gana: si el relleno no coincide con el valor escrito, es que acaba de
   pintar, y manda el relleno. Como al escribir se pinta en el acto, las dos
   cosas nunca se pelean.
   ========================================================================== */
var CLAVES_COLOR = ['color_principal', 'color_secundario', 'color_alterno'];

function esColor(t) { return /^#[0-9a-fA-F]{6}$/.test(String(t).trim()); }

function normalizarColor(t) { return String(t).trim().toUpperCase(); }

/* VACÍO ES UNA DECISIÓN; ILEGIBLE NO. Es la misma regla que `cifra()` aplica a
   los números, que costó un crítico entero: una celda en blanco quiere decir
   «usa el de fábrica», pero «rojo», «#D21» o «D0211C» sin almohadilla quieren
   decir que alguien eligió un color y la página lo está tirando a la basura.
   La página exige seis dígitos con almohadilla y, si no, se queda con el suyo
   SIN DECIR NADA. Eso es lo que se acaba aquí. */
function coloresIlegibles() {
  var c = leerConfiguracion();
  var malos = [];
  CLAVES_COLOR.forEach(function (k) {
    var t = String(c[k] === null || c[k] === undefined ? '' : c[k]).trim();
    if (!t) return;
    if (!esColor(t)) malos.push(k + ' dice "' + t.slice(0, 24) + '"');
  });
  return malos;
}

function sincronizarColores() {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return 0;
  var datos = filas(H_CONFIG);
  var cambios = 0;
  for (var i = 0; i < datos.length; i++) {
    var clave = String(datos[i][0]).trim();
    if (CLAVES_COLOR.indexOf(clave) === -1) continue;
    var celda = h.getRange(i + 2, 2);
    var valor = normalizarColor(datos[i][1]);
    var relleno = normalizarColor(celda.getBackground());
    var blanco = relleno === '#FFFFFF' || relleno === '' || relleno === '#000000';

    if (!blanco && esColor(relleno) && relleno !== valor) {
      celda.setValue(relleno);            // pintó la celda: manda el relleno
      valor = relleno;
      cambios++;
    }
    if (esColor(valor)) {
      celda.setBackground(valor)          // y siempre queda pintada del color que dice
          .setFontColor(contraste(valor))
          .setFontFamily('Roboto Mono').setFontWeight('bold')
          .setHorizontalAlignment('center');
    }
  }
  if (cambios) cacheFuera();
  return cambios;
}

/* Al revés que sincronizarColores: aquí manda lo ESCRITO.
   Se llama desde alEditar, o sea justo después de que el dueño teclea un
   código. Si en vez de esto corriera la sincronización completa, el relleno
   viejo pisaría el valor recién escrito. */
function pintarColoresDesdeValor() {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return 0;
  var pintadas = 0;
  filas(H_CONFIG).forEach(function (f, i) {
    if (CLAVES_COLOR.indexOf(String(f[0]).trim()) === -1) return;
    var valor = normalizarColor(f[1]);
    if (!esColor(valor)) return;
    h.getRange(i + 2, 2).setBackground(valor).setFontColor(contraste(valor))
     .setFontFamily('Roboto Mono').setFontWeight('bold').setHorizontalAlignment('center');
    pintadas++;
  });
  return pintadas;
}

/* Texto blanco o negro según qué se lea mejor sobre ese fondo. */
function contraste(hex) {
  var r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1A1A1A' : '#FFFFFF';
}

function cacheFuera() {
  try { CacheService.getScriptCache().remove('catalogo'); } catch (e) {}
}

/* ==========================================================================
   CORREO DIARIO
   --------------------------------------------------------------------------
   Todo se maneja desde la pestaña Configuración. Escribes tu correo en
   correo_resumen, y el resumen empieza a llegar. No hay que tocar el código
   ni volver a publicar nada.

       correo_resumen    tu@correo.com, otro@correo.com
       correo_hora       7          (de 0 a 23)
       correo_siempre    No         (No = solo cuando hay algo que atender)
       correo_ultimo     lo escribe el script; no se edita

   Por qué se revisa cada hora en vez de programar un disparador a las 7:
   la hora vive en la hoja. Si fuera un disparador, cambiarla obligaría a
   volver al editor. Así, cambias el número y mañana llega a esa hora. De
   paso se cura solo: si Google se saltó la revisión de las 7, la de las 8
   lo manda igual.

   Gasta 1 de los 100 correos diarios que regala Apps Script.
   ========================================================================== */
function revisarCorreo() {
  try {
    var c = leerConfiguracion();
    if (!listaDeCorreos(c.correo_resumen).length) return 'sin destinatarios';

    var ahora = new Date();
    var hora = Math.floor(Number(c.correo_hora));
    if (!isFinite(hora)) hora = 7;
    hora = Math.min(23, Math.max(0, hora));
    if (ahora.getHours() < hora) return 'todavía no es la hora';

    var hoy = diaClave(ahora);
    if (String(c.correo_ultimo).trim() === hoy) return 'ya salió hoy';

    var salida = enviarResumen(false);
    anotarUltimoCorreo(hoy);      // aunque no hubiera nada: no insistir cada hora
    return salida;
  } catch (e) {
    registrarError('correo diario: ' + e.message, null);
    return 'error';
  }
}

/* Desde el menú. Manda aunque no sea la hora y aunque no haya nada, para que
   puedas comprobar que llega antes de confiarle el negocio. */
function enviarResumenAhora() {
  var c = leerConfiguracion();
  var para = listaDeCorreos(c.correo_resumen);
  if (!para.length) {
    return { tipo: 'aviso', texto:
      'Todavía no hay a quién mandárselo. Escribe tu correo en la fila ' +
      'correo_resumen de la pestaña Configuración.' };
  }
  var salida = enviarResumen(true);
  return { tipo: 'aviso', texto: salida === 'enviado'
    ? 'Resumen enviado a ' + para.join(', ')
    : 'No salió. Motivo: ' + salida };
}

function listaDeCorreos(texto) {
  return String(texto || '').split(/[,;\s]+/)
    .map(function (x) { return x.trim(); })
    .filter(function (x) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x); })
    .slice(0, 10);
}

function diaClave(d) {
  var m = d.getMonth() + 1, dia = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dia < 10 ? '0' : '') + dia;
}

function anotarUltimoCorreo(valor) {
  var h = elLibro().getSheetByName(H_CONFIG);
  if (!h) return;
  var datos = filas(H_CONFIG);
  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === 'correo_ultimo') {
      h.getRange(i + 2, 2).setValue(valor);
      return;
    }
  }
  h.appendRow(['correo_ultimo', valor, 'Lo escribe el script: la fecha del último resumen que salió. No lo edites']);
}

function enviarResumen(forzado) {
  var c = leerConfiguracion();
  var para = listaDeCorreos(c.correo_resumen);
  if (!para.length) return 'sin destinatarios';

  var m = calcularMetricas();
  var hayAlgo = m.porConfirmar > 0 || m.errores > 0 || m.agotados > 0 ||
                m.pocos > 0 || m.ayer.enviados > 0 || m.ayer.ventas > 0 ||
                (m.avisame || []).some(function (a) { return a.hayStock; });
  if (!hayAlgo && !forzado && !esSi(c.correo_siempre)) return 'nada que contar';

  if (typeof MailApp !== 'undefined' && MailApp.getRemainingDailyQuota &&
      MailApp.getRemainingDailyQuota() < 1) {
    registrarError('correo diario: se acabó la cuota de correos de hoy', null);
    return 'sin cuota';
  }

  var adjuntos = exportarMesAnterior(c, m);
  var negocio = m.cfg.negocio || 'Tienda';

  MailApp.sendEmail({
    to: para.join(','),
    subject: asuntoResumen(negocio, m),
    htmlBody: cuerpoResumen(negocio, m),
    name: negocio,
    attachments: adjuntos
  });
  return 'enviado';
}

/* El asunto tiene que servir SIN abrir el correo. Primero lo que hay que
   hacer, después la plata. */
function asuntoResumen(negocio, m) {
  var accion;
  if (m.viejos > 0)            accion = varios(m.viejos, 'pedido espera', 'pedidos esperan') + ' hace más de un día';
  else if (m.porConfirmar > 0) accion = varios(m.porConfirmar, 'pedido por confirmar', 'pedidos por confirmar');
  else if (m.errores > 0)      accion = varios(m.errores, 'error en la hoja', 'errores en la hoja');
  else if (m.agotados > 0)     accion = varios(m.agotados, 'producto agotado', 'productos agotados');
  else                         accion = 'al día';
  var plata = m.ayer.ventas > 0 ? pesos(m.ayer.ventas) + ' ayer' : 'sin ventas ayer';
  return negocio + ' · ' + accion + ' · ' + plata;
}

function varios(n, uno, muchos) { return n + ' ' + (n === 1 ? uno : muchos); }

function pesos(n) {
  var t = String(Math.round(Number(n) || 0));
  var salida = '';
  for (var i = 0; i < t.length; i++) {
    if (i > 0 && (t.length - i) % 3 === 0) salida += '.';
    salida += t.charAt(i);
  }
  return '$' + salida;
}

function escaparHtml(t) {
  return String(t).replace(/[&<>"]/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
  });
}

function cuerpoResumen(negocio, m) {
  var A = m.A, B = m.B, ayer = m.ayer;
  var gris = '#6B6B6B', linea = '#E6E6E6', rojo = '#B3261E';
  var caja = 'margin:0 0 22px;padding:0';
  var titulo = 'margin:0 0 8px;font:600 11px/1.2 -apple-system,Segoe UI,Roboto,sans-serif;' +
               'letter-spacing:.09em;text-transform:uppercase;color:' + gris;
  var grande = 'margin:0;font:700 26px/1.15 -apple-system,Segoe UI,Roboto,sans-serif;color:#111';
  var normal = 'margin:6px 0 0;font:400 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#333';
  var chico  = 'margin:4px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:' + gris;

  var h = [];
  h.push('<div style="max-width:600px;margin:0 auto;padding:26px 22px;' +
         'font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FFF">');
  h.push('<p style="' + chico + ';margin:0 0 20px">' + escaparHtml(negocio) + ' · ' +
         escaparHtml(fechaLarga(m.ahora)) + '</p>');

  // ── 1. Lo accionable primero ──
  if (m.pendientes.length) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Para hacer hoy</p>');
    h.push('<p style="' + grande + '">' + m.porConfirmar +
           (m.porConfirmar === 1 ? ' pedido por confirmar' : ' pedidos por confirmar') + '</p>');
    if (m.viejos > 0)
      h.push('<p style="' + normal + ';color:' + rojo + '"><strong>' + m.viejos +
             (m.viejos === 1 ? ' lleva' : ' llevan') + ' más de 24 horas esperando.</strong></p>');
    h.push('<table style="width:100%;border-collapse:collapse;margin-top:12px;' +
           'font:400 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif">');
    m.pendientes.slice(0, 10).forEach(function (p) {
      var viejo = p.horas >= 24;
      h.push('<tr>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';color:#111"><strong>' +
          escaparHtml(p.codigo) + '</strong></td>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';color:' + gris + '">' +
          escaparHtml(p.ciudad || '—') + '</td>' +
        '<td style="padding:7px 0;border-top:1px solid ' + linea + ';text-align:right;color:#111">' +
          pesos(p.total) + '</td>' +
        '<td style="padding:7px 0 7px 14px;border-top:1px solid ' + linea + ';text-align:right;' +
          'white-space:nowrap;color:' + (viejo ? rojo : gris) + '">' + hacerRato(p.horas) + '</td>' +
        '</tr>');
    });
    h.push('</table>');
    if (m.pendientes.length > 10)
      h.push('<p style="' + chico + '">y ' + (m.pendientes.length - 10) + ' más en la hoja.</p>');
    h.push('</div>');
  } else {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Para hacer hoy</p>');
    h.push('<p style="' + grande + '">Nada pendiente</p>');
    h.push('<p style="' + chico + '">Todos los pedidos están confirmados o anulados.</p>');
    h.push('</div>');
  }

  // ── 2. Ayer ──
  h.push('<div style="' + caja + '">');
  h.push('<p style="' + titulo + '">Ayer</p>');
  h.push('<p style="' + grande + '">' + pesos(ayer.ventas) + '</p>');
  h.push('<p style="' + normal + '">' + ayer.confirmados +
         (ayer.confirmados === 1 ? ' pedido confirmado' : ' pedidos confirmados') +
         ' · llegaron ' + ayer.enviados + '</p>');
  h.push('</div>');

  // ── 3. El mes ──
  h.push('<div style="' + caja + '">');
  h.push('<p style="' + titulo + '">Este mes</p>');
  h.push('<p style="' + grande + '">' + pesos(A.ventas) + '</p>');
  h.push('<p style="' + normal + '">' + A.confirmados +
         (A.confirmados === 1 ? ' venta' : ' ventas') + ' · ticket promedio ' + pesos(A.ticket) + '</p>');
  h.push('<p style="' + chico + '">' + (B.confirmados
      ? 'Mes anterior completo: ' + pesos(B.ventas) + ' en ' + varios(B.confirmados, 'venta', 'ventas') + '.'
      : 'El mes pasado no hubo ventas confirmadas.') + '</p>');
  h.push('</div>');

  // ── 4. El embudo, en una línea ──
  if (A.carritos > 0) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Embudo del mes</p>');
    h.push('<p style="' + normal + ';margin-top:0">De <strong>' + A.carritos +
           '</strong> carritos armados, <strong>' + A.enviados + '</strong> llegaron a WhatsApp (' +
           Math.round(A.tasaEnvio * 100) + '%) y <strong>' + A.confirmados +
           '</strong> se cerraron (' + Math.round(A.tasaCierre * 100) + '%).</p>');
    h.push('<p style="' + chico + '">Si cae el primero, revisa precios o envío. Si cae el segundo, la conversación de WhatsApp.</p>');
    h.push('</div>');
  }

  // ── 5. Inventario, solo si hay algo ──
  if (m.agotados || m.pocos) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Inventario</p>');
    if (m.agotados)
      h.push('<p style="' + normal + ';color:' + rojo + '"><strong>Agotados:</strong> ' +
             escaparHtml(m.listaAgotados.join(', ')) + '</p>');
    if (m.pocos)
      h.push('<p style="' + normal + '"><strong>Quedan pocas:</strong> ' +
             escaparHtml(m.listaPocos.join(', ')) + '</p>');
    h.push('</div>');
  }

  // ── 5 bis. «Avísame cuando llegue» (4.1): lo que ya llegó y alguien espera ──
  var yaLlego = (m.avisame || []).filter(function (a) { return a.hayStock; });
  if (yaLlego.length) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Te están esperando</p>');
    yaLlego.forEach(function (a) {
      h.push('<p style="' + normal + '"><strong>' + escaparHtml(a.nombre) + '</strong> ya tiene existencias y ' +
             varios(a.personas, 'persona pidió', 'personas pidieron') + ' que le avisaras.</p>');
    });
    h.push('<p style="' + chico + '">Búscalas en tu WhatsApp con la palabra «avísame». Cuando les escribas, márcalo en el panel (Ventas › Te están esperando).</p>');
    h.push('</div>');
  }

  // ── 6. Errores ──
  if (m.errores) {
    h.push('<div style="' + caja + '">');
    h.push('<p style="' + titulo + '">Errores</p>');
    h.push('<p style="' + normal + ';color:' + rojo + '">' +
           varios(m.errores, 'fila', 'filas') + ' en la pestaña Errores: ' +
           'alguien mandó algo que la hoja no entendió.</p>');
    h.push('</div>');
  }

  h.push('<p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ' + linea + '">' +
         '<a href="' + escaparHtml(m.url) + '" style="font:600 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;' +
         'color:#111">Abrir la hoja →</a></p>');
  h.push('<p style="' + chico + ';margin-top:14px">Este resumen sale de la pestaña Configuración. ' +
         'Para cambiar la hora o dejar de recibirlo, edita correo_hora o borra correo_resumen.</p>');
  h.push('</div>');
  return h.join('');
}

function hacerRato(horas) {
  if (horas < 1) return 'recién';
  if (horas < 24) return 'hace ' + horas + ' h';
  var d = Math.floor(horas / 24);
  return 'hace ' + d + (d === 1 ? ' día' : ' días');
}

function fechaLarga(d) {
  var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()];
}

/* El primer correo de cada mes lleva adjunto el mes anterior en CSV. Es el
   respaldo que reemplazó al respaldo automático: el historial de versiones de
   Sheets cubre el accidente, esto cubre perder la cuenta de Google. */
function exportarMesAnterior(c, m) {
  try {
    var ahora = m.ahora;
    var mesAhora = ahora.getFullYear() + '-' + (ahora.getMonth() + 1);
    var ultimo = String(c.correo_ultimo || '').trim();
    if (ultimo) {
      var partes = ultimo.split('-');
      if (partes.length === 3 && (partes[0] + '-' + Number(partes[1])) === mesAhora) return [];
    }
    var ref = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    var lineas = [ENCABEZADO_PEDIDOS.join(',')];
    filas(H_PEDIDOS).forEach(function (f) {
      var fecha = f[0] instanceof Date ? f[0] : new Date(f[0]);
      if (isNaN(fecha.getTime())) return;
      if (fecha.getFullYear() !== ref.getFullYear() || fecha.getMonth() !== ref.getMonth()) return;
      lineas.push(f.slice(0, ENCABEZADO_PEDIDOS.length).map(function (x) {
        var t = x instanceof Date ? diaClave(x) : String(x === undefined || x === null ? '' : x);
        return '"' + t.replace(/"/g, '""') + '"';
      }).join(','));
    });
    if (lineas.length < 2) return [];
    var mm = ref.getMonth() + 1;
    var nombre = 'pedidos-' + ref.getFullYear() + '-' + (mm < 10 ? '0' : '') + mm + '.csv';
    // El BOM hace que Excel abra bien los acentos.
    return [Utilities.newBlob('﻿' + lineas.join('\n'), 'text/csv', nombre)];
  } catch (e) {
    registrarError('export mensual: ' + e.message, null);
    return [];
  }
}

/* ==========================================================================
   INVENTARIO  —  se mueve cuando TÚ cambias el Estado del pedido
   --------------------------------------------------------------------------
   Marcas un pedido como "Confirmado" y el stock del catálogo baja. Si te
   arrepientes y lo cambias a "Anulado" o lo devuelves a "Por confirmar", el
   stock vuelve a subir.

   La columna Inventario de cada línea es la que hace esto seguro: dice si esa
   línea ya se descontó. Por eso puedes confirmar, deshacer y volver a
   confirmar sin que el inventario se descuadre, y por eso da igual cuántas
   veces se ejecute esto.

   No es automático desde la tienda a propósito: un pedido que se abrió en
   WhatsApp no es una venta. La venta la confirmas tú.
   ========================================================================== */
function aplicarInventario() {
  var libro = elLibro();
  var hp = libro.getSheetByName(H_PEDIDOS);
  var hc = libro.getSheetByName(H_CATALOGO);
  if (!hp || !hc || hp.getLastRow() < 2 || hc.getLastRow() < 2) return 0;

  var anchoP = Math.max(hp.getLastColumn(), COL_INVENTARIO);
  var pedidos = hp.getRange(2, 1, hp.getLastRow() - 1, anchoP).getValues();
  var cat = hc.getRange(2, 1, hc.getLastRow() - 1, 10).getValues();

  var filaDe = {};
  cat.forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (id) filaDe[id] = i;
  });

  var cambios = 0;
  ESTADOS_ILEGIBLES = [];
  /* C-1b: los productos con inventario por combinación descuentan en SU fila
     de la pestaña, no en Catálogo; después se reescribe la suma. */
  var combos = contextoCombinaciones();
  var sinFila = [];
  var marcas = pedidos.map(function (f, indice) {
    var estado = estadoDe(f[COL_ESTADO - 1]);
    var descontado = String(f[COL_INVENTARIO - 1]).toLowerCase().indexOf('descontado') !== -1;
    var id   = String(f[7]).trim();
    var cant = Number(f[8]) || 0;
    var i    = filaDe[id];

    if (i === undefined || cant < 1) return [f[COL_INVENTARIO - 1] || ''];

    /* UN ESTADO QUE NO SE RECONOCE NO ES «NO VENDIDO»: ES UNA ERRATA.
       Antes, cualquier cosa que no dijera «confirmado» devolvía el stock al
       catálogo. Así, escribir mal una celda de una venta ya pagada resucitaba
       inventario que estaba vendido, en silencio, y el catálogo pasaba a
       ofrecer unidades que no existen.

       Ahora no se toca nada y se anota. Quedarse quieto es reversible; devolver
       stock que ya se vendió, no. El diagnóstico lo saca por su nombre. */
    if (!estado) {
      /* Una celda VACÍA no es una errata: es una fila a medio escribir, y en
         una hoja de cálculo eso pasa todo el rato. No se denuncia. */
      if (llano(f[COL_ESTADO - 1]) && ESTADOS_ILEGIBLES.length < 20) {
        ESTADOS_ILEGIBLES.push('Pedidos D' + (indice + 2) + ' dice "' +
          String(f[COL_ESTADO - 1]).slice(0, 24) + '"');
      }
      return [f[COL_INVENTARIO - 1] || ''];
    }

    var confirmado = !!estado.vendido;

    if (combos.skus[id] && ((confirmado && !descontado) || (!confirmado && descontado))) {
      var m = moverCombinacion(combos, id, String(f[16] || ''), cant, confirmado);
      if (m === 'Descontado' || m === 'Devuelto') { cambios++; return [m]; }
      /* Una línea que no casa con ninguna fila (la combinación se renombró, o
         el pedido llegó sin elección) NO se descuenta del producto: con
         inventario por combinación el producto es una suma, y descontar ahí
         se lo comería la siguiente suma. Se deja sin marcar y se dice. */
      if (sinFila.length < 20) sinFila.push('Pedidos M' + (indice + 2) + ' (' + id + (f[16] ? ' · ' + f[16] : ' sin elección') + ')');
      return [f[COL_INVENTARIO - 1] || ''];
    }

    if (confirmado && !descontado) {
      cat[i][COL_STOCK - 1] = Math.max(0, (Number(cat[i][COL_STOCK - 1]) || 0) - cant);
      cambios++;
      return ['Descontado'];
    }
    if (!confirmado && descontado) {
      cat[i][COL_STOCK - 1] = (Number(cat[i][COL_STOCK - 1]) || 0) + cant;
      cambios++;
      return ['Devuelto'];
    }
    return [f[COL_INVENTARIO - 1] || ''];
  });

  if (sinFila.length) {
    anotarError('Líneas vendidas que no casan con el inventario por variante',
                sinFila.join(' · ') + '. No se descontaron: revisa la columna Variante o la pestaña ' + H_INVENTARIO_VARIANTE + '.');
  }
  if (cambios) {
    hp.getRange(2, COL_INVENTARIO, marcas.length, 1).setValues(marcas);
    hc.getRange(2, COL_STOCK, cat.length, 1).setValues(cat.map(function (f) {
      return [f[COL_STOCK - 1]];
    }));
    if (combos.cambioInv) {
      combos.hi.getRange(2, 1, combos.inv.length, ENCABEZADO_INVENTARIO_VARIANTE.length).setValues(combos.inv);
      escribirSumas();
    }
    // Que la tienda vea el stock nuevo de una vez y no dentro de un minuto.
    CacheService.getScriptCache().remove('catalogo');
  }
  return cambios;
}

/* Disparador de edición. Solo reacciona a la columna Estado de la hoja Pedidos:
   cualquier otra edición se ignora para no gastar cuota en balde. */
/* Un menú en la hoja, para no tener que entrar al editor de Apps Script cada vez
   que quieras rehacer las cuentas a mano. */
/* ══════════════════════════════════════════════════════════════════════════
   EL MENÚ DE LA HOJA
   --------------------------------------------------------------------------
   Aquí no hay interfaz: este proyecto no vive dentro de la hoja y no puede
   dibujar nada. Lo que hay es un catálogo de acciones que devuelven QUÉ
   mostrar, y stub.gs —treinta líneas dentro de la hoja— las pide por HTTPS y
   las muestra.

   La lista blanca no es decorativa: es lo único que separa "el menú puede
   pedir cinco cosas" de "cualquiera con la URL ejecuta cualquier función de
   este proyecto".
   ══════════════════════════════════════════════════════════════════════════ */
var ACCIONES_MENU = {
  publicar:      { rotulo: 'Publicar ahora',                        fn: publicarAhora },
  ver:           { rotulo: 'Ver mi tienda',                         fn: verMiTienda },
  actualizar:    { rotulo: 'Actualizar tablero e inventario',       fn: actualizarTodo },
  resumen:       { rotulo: 'Enviarme el resumen ahora',             fn: enviarResumenAhora },
  clave:         { rotulo: 'Clave del panel',                        fn: claveDelPanel },
  diagnostico:   { rotulo: 'Diagnóstico',                           fn: diagnostico },
  ayuda:         { rotulo: 'Ayuda',                                 fn: ayuda },
  /* 0.14.0 · al final (R1 del menú: lo que ya estaba no cambia de lugar). */
  version:       { rotulo: 'Actualizar a la última versión', fn: actualizarLaTiendaDesdeElMenu },
  /* FUERA DEL MENÚ, PERO VIVAS. `generarConfiguracion` la sigue usando la
     puerta ?a=bloques, que es como el montaje escribe el index.html. Se
     quitaron del menú porque existían cuando montar la tienda era copiar y
     pegar a mano: hoy eso lo hace un flujo, y ofrecerle al comerciante que
     genere bloques de HTML es ofrecerle un trabajo que ya no es suyo. */
  configuracion: { rotulo: 'Generar configuración para index.html', fn: generarConfiguracion,
                   fuera: true },
  inventario:    { rotulo: 'Generar inventario para index.html',    fn: generarInventario,
                   fuera: true }
};

/* PUBLICAR AHORA VA PRIMERO Y NO ES CASUALIDAD. Desde que el catálogo se hornea
   dentro del sitio, un cambio de precio espera un despliegue: el flujo de cada
   cuatro horas es el techo y este botón es el suelo. Es lo primero que un
   comerciante quiere después de tocar un precio. */
var ORDEN_MENU = ['publicar', 'ver', 'actualizar', 'resumen', 'clave', 'diagnostico', 'ayuda', 'version'];
/* generarStub NO está en el menú de la hoja: se ejecuta desde el maestro, que
   es donde estás cuando montas la tienda. Ponerlo en la hoja sería ofrecerle al
   cliente que se regenere a sí mismo. */

function menuDeLaHoja() {
  return ORDEN_MENU.map(function (k) {
    return { id: k, rotulo: ACCIONES_MENU[k].rotulo };
  });
}

/* Que `ORDEN_MENU` y las acciones no se separen. Una opción en el orden que no
   existe deja la hoja pidiendo algo que no está; una acción viva fuera del
   orden es una función a la que solo se llega adivinando su id. Las dos son
   silenciosas, así que se comprueban aquí y en las baterías. */
function menuCuadra() {
  var faltan = ORDEN_MENU.filter(function (k) { return !ACCIONES_MENU[k]; });
  var sueltas = Object.keys(ACCIONES_MENU).filter(function (k) {
    return !ACCIONES_MENU[k].fuera && ORDEN_MENU.indexOf(k) === -1;
  });
  return { faltan: faltan, sueltas: sueltas, ok: !faltan.length && !sueltas.length };
}

function ejecutarAccion(id) {
  var accion = ACCIONES_MENU[id];
  if (!accion) return { tipo: 'aviso', texto: 'Esa opción del menú no existe.' };
  var salida = accion.fn();
  if (salida && salida.tipo) return salida;
  return { tipo: 'aviso', texto: String(salida === undefined ? 'Listo.' : salida) };
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLICAR AHORA
   --------------------------------------------------------------------------
   Desde que el catálogo se hornea dentro del sitio, tocar un precio en la hoja
   ya no lo pone en la calle: hay que publicar. El flujo de cada cuatro horas es
   el techo; esto es el suelo, y es lo primero que quiere quien acaba de
   corregir un precio.

   NO PUBLICA ESTE CÓDIGO. Dispara el flujo `fotos` del repositorio de la
   tienda, que es el único que ya sabe fusionar solo: hornea el catálogo, baja
   lo que haya nuevo en el Drive, corre TODAS las baterías, y solo fusiona si lo
   único que cambió son las fotos y el catálogo. Si cambió cualquier otra cosa,
   deja un pull request para una persona. Todo eso ya estaba probado: aquí solo
   se aprieta el botón.

   EL TOKEN, Y POR QUÉ ESTE Y NO OTRO. Va en las propiedades del script —
   Configuración del proyecto > Propiedades del script — con el nombre
   GITHUB_TOKEN, y tiene que ser fine-grained, de ESTE repositorio y con un solo
   permiso: Actions: Read and write. Con eso alcanza para disparar un flujo y
   para nada más: no puede escribir código, ni leer otros repositorios, ni tocar
   secretos. Las propiedades del script NO están cifradas, así que el permiso
   más pequeño posible no es una formalidad: es lo único que hay.
   ══════════════════════════════════════════════════════════════════════════ */
/* De cuándo es el catálogo que la tienda está sirviendo. Se le pregunta al
   sitio, no a la hoja: la hoja siempre está al día por definición y por eso no
   contesta nada útil. */
/* Lo que la tienda PUBLICADA está sirviendo ahora mismo. Se pide una sola vez
   por ejecución: el diagnóstico lo mira dos veces —la fecha y las fotos— y dos
   peticiones a la misma URL con un segundo de diferencia no dicen nada nuevo,
   pero sí gastan el cupo de UrlFetch. */
var CATALOGO_PUBLICADO = null;

function catalogoPublicado() {
  if (CATALOGO_PUBLICADO) return CATALOGO_PUBLICADO;
  var url = String(leerConfiguracion().sitio_url || '').trim().replace(/\/+$/, '');
  if (!url) return { ok: false, sinUrl: true, error: 'no sé la dirección' };
  try {
    var res = UrlFetchApp.fetch(url + '/catalogo.json',
                                { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) throw new Error('contestó ' + res.getResponseCode());
    return (CATALOGO_PUBLICADO = { ok: true, datos: JSON.parse(res.getContentText()) });
  } catch (e) {
    /* UN FALLO NO SE GUARDA. La caché existe para no pedir dos veces lo mismo
       cuando ya se sabe la respuesta; recordar «no se pudo» convierte un
       tropiezo de un segundo en el veredicto de toda la ejecución, y deja a la
       función mintiendo aunque la tienda ya conteste. Costo de no guardarlo:
       una segunda petición, y solo cuando ya algo iba mal. */
    return { ok: false, error: e.message };
  }
}

function publicacionDeLaTienda() {
  var pub = catalogoPublicado();
  if (pub.sinUrl) return 'Tu tienda: no sé la dirección (Configuración > sitio_url).';

  var pedida = '';
  try { pedida = PropertiesService.getScriptProperties()
                   .getProperty('PEDIDA_PUBLICACION') || ''; } catch (e) { }

  if (!pub.ok) {
    return 'Tu tienda está mostrando: NO SE PUDO COMPROBAR (' + pub.error + ').\n' +
           '   Si la tienda abre bien en el navegador, es que todavía no ha\n' +
           '   corrido una publicación. Usa «Publicar ahora».';
  }
  var d = pub.datos;

  var t = Date.parse(d.generado || '');
  if (!t) return 'Tu tienda está mostrando un catálogo sin fecha. Publica de nuevo.';

  var linea = 'Tu tienda está mostrando el catálogo del ' + haceCuanto(t) + '.';

  /* La comparación que de verdad contesta «¿ya llegó?»: se pidió publicar
     DESPUÉS de lo que se está sirviendo, y ya pasó tiempo de sobra. */
  var p = Date.parse(pedida || '');
  if (p && p > t) {
    var minutos = Math.round((Date.now() - p) / 60000);
    linea += minutos > 20
      ? '\n   ATENCIÓN: pediste publicar hace ' + minutos + ' minutos y todavía no' +
        '\n   ha llegado. Vuelve a intentarlo; si sigue igual, avisa a quien te' +
        '\n   montó la tienda.'
      : '\n   Pediste publicar hace ' + minutos + ' minuto(s): todavía va en camino.';
  }
  return linea;
}

/* ==========================================================================
   LOS DATOS QUE LA HOJA NO PUDO LEER, CON FILA Y COLUMNA EXACTAS.
   --------------------------------------------------------------------------
   `cifra()` ya venía anotando la celda —«Catálogo E7 (Precio de un producto)»—
   pero solo la anotaba quien estuviera leyendo en ese momento, y el
   diagnóstico leía el catálogo POR EL CACHÉ: con el caché caliente
   CELDAS_ILEGIBLES quedaba vacío y el informe decía que todo estaba bien
   mientras un producto llevaba una hora sin salir en la tienda.

   Esto lee las tres hojas a mano, sin caché, y devuelve la lista completa.
   También devuelve los productos que se CAEN del catálogo y por qué, que es
   la pregunta que el comerciante hace de verdad: «¿por qué no aparece?».
   ========================================================================== */
function revisarDatos() {
  var antes = CELDAS_ILEGIBLES;
  CELDAS_ILEGIBLES = [];
  var caidos = [];

  filas(H_CATALOGO).forEach(function (f, i) {
    var n = i + 2;
    var id = String(f[0]).trim();
    var nombre = String(f[1] || '').trim();
    var precio = cifra(f[4], 'Catálogo E' + n + ' (Precio de ' + (id || 'fila ' + n) + ')');
    cifra(f[5],  'Catálogo F' + n + ' (Stock de ' + (id || 'fila ' + n) + ')');
    cifra(f[11], 'Catálogo L' + n + ' (Precio antes de ' + (id || 'fila ' + n) + ')');
    cifra(f[12], 'Catálogo M' + n + ' (Umbral bajo de ' + (id || 'fila ' + n) + ')');
    /* Una fila del todo vacía no es un error: es el final de la hoja. */
    if (!id && !nombre && f[4] === '' ) return;
    if (!id)          caidos.push('Catálogo A' + n + ': sin ID');
    else if (!nombre) caidos.push('Catálogo B' + n + ': ' + id + ' no tiene Nombre');
    else if (precio === null) caidos.push('Catálogo E' + n + ': el precio de ' + id + ' no es un número');
  });

  filas(H_ENVIOS).forEach(function (f, i) {
    cifra(f[2], 'Envíos C' + (i + 2) + ' (Valor de ' + (String(f[0]).trim() || 'fila ' + (i + 2)) + ')');
  });

  filas(H_CUPONES).forEach(function (f, i) {
    var n = i + 2;
    var c = String(f[0]).trim().toUpperCase() || 'fila ' + n;
    cifra(f[2], 'Cupones C' + n + ' (Valor de ' + c + ')');
    cifra(f[3], 'Cupones D' + n + ' (Mínimo de ' + c + ')');
    cifra(f[5], 'Cupones F' + n + ' (Usos máximos de ' + c + ')');
    cifra(f[6], 'Cupones G' + n + ' (Usos confirmados de ' + c + ')');
  });

  var cfg = leerConfiguracion();
  /* `pago_tope`, no `tope_pago`: la clave se llama así en la hoja desde la
     2.4.0 y renombrarla rompería todas las tiendas (R2 del contrato). Estuvo
     escrita mal aquí, y como la comprobación se salta las claves que no
     existen, el tope de pago llevaba tiempo sin revisarse — en silencio, que
     es como no revisar nada. */
  ['envio_gratis_desde', 'pago_tope'].forEach(function (clave) {
    if (cfg[clave] !== undefined) cifraDeTexto(cfg[clave], 'Configuración > ' + clave);
  });

  var ilegibles = CELDAS_ILEGIBLES;
  CELDAS_ILEGIBLES = antes;
  return { ilegibles: ilegibles, caidos: caidos };
}

/* ==========================================================================
   LAS FOTOS QUE NO CUADRAN, POR NOMBRE EXACTO.
   --------------------------------------------------------------------------
   «Subí la foto y no aparece» es de las tres cosas que más se preguntan, y
   hasta ahora la única respuesta era «revisa el Drive». La tienda publicada
   dice en catalogo.json QUÉ FOTOS TIENE de verdad (`fotos`: nombre → anchos
   disponibles). Comparar eso con lo que la hoja pide da el nombre exacto del
   archivo que falta, que es con lo que el comerciante puede ir a buscar.

   Una URL completa en la celda no se cuenta: esa foto la sirve otro sitio y
   nosotros no tenemos nada que verificar.
   ========================================================================== */
function revisarFotos() {
  var pide = {};
  filas(H_CATALOGO).forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id || !esSi(f[9])) return;                    // solo lo que está Activo
    String(f[7] || '').split('|').forEach(function (u) {
      var t = u.trim();
      if (t && !/^https?:\/\//i.test(t)) pide[t] = (pide[t] || id);
    });
  });

  var pub = catalogoPublicado();
  if (!pub.ok) return { comprobable: false, porQue: pub.sinUrl ? 'sinUrl' : pub.error };

  var tiene = pub.datos.fotos || {};
  var faltan = [], sobran = [];
  Object.keys(pide).forEach(function (n) {
    if (!tiene[n]) faltan.push(n + '  (' + pide[n] + ')');
  });
  Object.keys(tiene).forEach(function (n) { if (!pide[n]) sobran.push(n); });
  return { comprobable: true, pedidas: Object.keys(pide).length,
           faltan: faltan, sobran: sobran };
}

/* «hace 20 minutos» se entiende; una marca ISO no.

   La fecha se arma a mano y no con Utilities.formatDate: eso pide una zona
   horaria, y el proyecto no declara ninguna. Los métodos de Date corren en la
   zona del script, que es la del comerciante, así que dan la hora que él ve en
   su reloj — que es la única que le sirve. */
var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* «hace 5 minutos» habla de un instante; esto habla de una DURACIÓN, que es
   otra cosa. Decir «el que más tardó: hace 2 días» sería mentira. */
function haceCuantoDura(minutos) {
  var m = Math.max(0, Math.floor(Number(minutos) || 0));
  if (m < 60) return m + ' minuto' + (m === 1 ? '' : 's');
  var h = Math.round(m / 60);
  if (h < 48) return h + ' hora' + (h === 1 ? '' : 's');
  return Math.round(h / 24) + ' días';
}

function haceCuanto(t) {
  var f = new Date(t);
  var h = f.getHours();
  var ampm = h < 12 ? 'a.m.' : 'p.m.';
  var h12 = h % 12 || 12;
  var mm = ('0' + f.getMinutes()).slice(-2);
  var cuando = f.getDate() + ' ' + MESES_CORTOS[f.getMonth()] + ', ' +
               h12 + ':' + mm + ' ' + ampm;

  var min = Math.round((Date.now() - t) / 60000);
  if (min < 2)     return cuando + ' (hace un momento)';
  if (min < 60)    return cuando + ' (hace ' + min + ' minutos)';
  if (min < 60 * 24) return cuando + ' (hace ' + Math.round(min / 60) + ' horas)';
  return cuando + ' (hace ' + Math.round(min / (60 * 24)) + ' días)';
}

function actualizarLaTiendaDesdeElMenu() {
  var a = atenderActualizacion();
  if (a.esSemilla) return { tipo: 'aviso', texto: 'Esta es la semilla: ya es la última versión.' };
  if (a.hayNueva === false) return { tipo: 'aviso', texto:
    'Tu tienda ya está en la última versión (' + a.version + ').' };
  var d = dispararActualizacion();
  if (!d.ok) return { tipo: 'aviso', texto: 'No se pudo pedir la actualización.\n\n' +
    (d.falta === 'repositorio' ? 'Falta la fila «repositorio» en Configuración.' :
     d.falta === 'permiso' ? 'Falta el permiso GITHUB_TOKEN (lo pone quien montó la tienda).' : d.porQue) };
  anotarCambios('Menú', '', [{ que: 'Pidió actualizar la tienda a la última versión', donde: 'Tienda', antes: a.version, despues: a.ultima || '' }]);
  return { tipo: 'aviso', texto:
    'ACTUALIZANDO TU TIENDA' + (a.ultima ? ' A LA ' + a.ultima : '') + '\n\n' +
    'Tarda entre 10 y 20 minutos. Tu tienda sigue vendiendo mientras tanto.\n\n' +
    'Se trae la versión nueva, se prueban TODAS las baterías y solo entonces se ' +
    'publica. Si algo falla, tu tienda queda como estaba.' };
}

function publicarAhora() {
  /* EL DISPARO ES EL MISMO QUE EL DEL PANEL (dispararPublicacion); aquí solo se
     cuenta en palabras del menú. Antes esta función hacía la petición a GitHub
     ella misma, y con D-5 habría habido dos: la segunda copia es la que se
     queda atrás el día que GitHub cambie algo. */
  var d = dispararPublicacion();
  if (d.falta === 'repositorio') {
    return { tipo: 'aviso', texto:
      'Todavía no sé dónde vive tu tienda.\n\n' +
      'En la pestaña Configuración, en la fila «repositorio», escribe:\n' +
      '    dueño/repositorio\n\n' +
      'Por ejemplo: tuempresa/tutienda\n\n' +
      (d.repo ? 'Ahora dice: ' + d.repo : '') };
  }
  if (d.falta === 'permiso') {
    return { tipo: 'aviso', texto:
      'Falta el permiso para publicar.\n\n' +
      'Es una sola vez, y lo hace quien montó la tienda:\n\n' +
      '1. En GitHub: Settings > Developer settings >\n' +
      '   Personal access tokens > Fine-grained tokens\n' +
      '2. Solo el repositorio ' + d.repo + '\n' +
      '3. Un solo permiso: Actions -> Read and write\n' +
      '4. En este proyecto: Configuración del proyecto >\n' +
      '   Propiedades del script > GITHUB_TOKEN' };
  }
  if (d.ok) {
    return { tipo: 'aviso', texto:
      'Listo. Tu tienda se está actualizando.\n\n' +
      'Tarda unos minutos: se revisan los datos, se preparan las fotos y se\n' +
      'publica. No hace falta que esperes aquí.\n\n' +
      'Para saber si ya llegó, abre el menú > Diagnóstico dentro de un rato:\n' +
      'ahí dice de cuándo es lo que tu tienda está mostrando.\n\n' +
      'Si algo no cuadra, no se publica nada y tu tienda se queda como está.' };
  }
  if (!d.codigo) return { tipo: 'aviso', texto: d.porQue };
  return { tipo: 'aviso', texto: 'No se pudo publicar.\n\n' + d.porQue +
    '\n\nQueda anotado en la pestaña Errores.' };
}

function verMiTienda() {
  var url = String(leerConfiguracion().sitio_url || '').trim();
  if (!url) {
    return { tipo: 'aviso', texto:
      'Todavía no sé la dirección de tu tienda.\n\n' +
      'Está en la pestaña Configuración, fila «sitio_url».' };
  }
  /* Un enlace, no una redirección: desde un diálogo de Sheets no se puede
     abrir una pestaña sin que el navegador lo bloquee. Que se pueda copiar y
     que se pueda clicar es lo que hay, y alcanza. */
  return { tipo: 'html', titulo: 'Tu tienda', html:
    '<div style="font-family:Arial,sans-serif;padding:6px 8px">' +
    '<p style="font:400 13px/1.6 Arial,sans-serif;color:#111">Esta es tu tienda, ' +
    'tal como la ve un comprador:</p>' +
    '<p><a href="' + escaparHtml(url) + '" target="_blank" rel="noopener" ' +
    'style="font:600 15px Arial,sans-serif;color:#1B5E3A">' + escaparHtml(url) + '</a></p>' +
    '<p style="font:400 12px/1.55 Arial,sans-serif;color:#666">Si acabas de cambiar ' +
    'algo y no lo ves, usa <b>Publicar ahora</b> y espera unos minutos.</p></div>' };
}

/* La ayuda contesta las tres cosas que se preguntan de verdad, en el orden en
   que se preguntan. No es un manual: un manual dentro de un diálogo no lo lee
   nadie. Lo largo vive en la guía de una página. */
function ayuda() {
  var c = leerConfiguracion();
  var url = String(c.sitio_url || '').trim();
  var linea = function (t) { return '<p style="font:400 13px/1.6 Arial,sans-serif;color:#111;margin:0 0 6px">' + t + '</p>'; };
  var titulo = function (t) { return '<h3 style="font:700 13px Arial,sans-serif;color:#111;margin:16px 0 4px">' + t + '</h3>'; };
  return { tipo: 'html', titulo: 'Ayuda', html:
    '<div style="font-family:Arial,sans-serif;padding:4px 8px 18px">' +
    titulo('Cambié un precio y la tienda no lo muestra') +
    linea('Usa <b>Publicar ahora</b>. La tienda guarda una copia de tu catálogo para ' +
          'cargar rápido, y esa copia se rehace al publicar. Sola se rehace cada cuatro horas.') +
    titulo('Subí una foto al Drive y no aparece') +
    linea('Lo mismo: <b>Publicar ahora</b>. Y comprueba que el nombre del archivo sea ' +
          'idéntico al de la columna <b>Imágenes</b> del catálogo, con mayúsculas y todo.') +
    titulo('Llegó un pedido y quiero confirmarlo') +
    linea('En la pestaña <b>Pedidos</b>, cambia <b>Estado</b> a <b>Confirmado</b>. Eso ' +
          'descuenta el inventario. No hay que hacer nada más.') +
    titulo('Algo no funciona y no sé qué es') +
    linea('Abre <b>Diagnóstico</b>: revisa la tienda entera y dice qué está mal y dónde, ' +
          'con la fila y la columna exactas.') +
    (url ? linea('Tu tienda: <a href="' + escaparHtml(url) + '" target="_blank" rel="noopener">' +
                 escaparHtml(url) + '</a>') : '') +
    '</div>' };
}

function actualizarTodo() {
  sincronizarVariantes();
  var movidos = aplicarInventario();
  recalcularResumen();
  presentarHojas();
  return { tipo: 'aviso', texto: movidos
    ? movidos + ' línea(s) de inventario ajustadas.'
    : 'Todo al día: inventario, tablero y formato.' };
}

/* LO QUE PASA CUANDO CAMBIA EL ESTADO DE UN PEDIDO, en un solo sitio. Lo usan
   la hoja (alEditar) y el panel (D-3). «Con el mismo efecto que en la hoja» no
   se cumple copiando estas dos líneas: se cumple llamándolas. */
function trasCambiarEstado() {
  var movidos = aplicarInventario();
  recalcularResumen();
  return movidos;
}

function alEditar(e) {
  try {
    if (!e || !e.range) return;
    var h = e.range.getSheet();

    /* D-6 · Lo que se edita a mano también queda escrito. */
    anotarEdicionDeHoja(e);

    /* D-5 · LO QUE SE PUBLICA CAMBIÓ. Se anota la hora para que el panel pueda
       decir «tienes cambios sin publicar» también cuando el cambio se hizo en
       la hoja y no en el panel. */
    if (hojasQueSePublican().indexOf(h.getName()) !== -1) marcarEdicion();

    // Escribió un color a mano: se pinta la celda en el acto, para que el
    // relleno y el valor nunca queden diciendo cosas distintas.
    if (h.getName() === H_CONFIG) { pintarColoresDesdeValor(); cacheFuera(); return; }

    /* C-1b · Cambió Variantes en Catálogo, o un número del inventario por
       combinación: se generan las filas que falten y se reescribe la suma. */
    if (h.getName() === H_INVENTARIO_VARIANTE ||
        (h.getName() === H_CATALOGO && e.range.getColumn() <= 14 &&
         e.range.getColumn() + e.range.getNumColumns() - 1 >= 14)) {
      sincronizarVariantes();
      return;
    }

    if (h.getName() !== H_PEDIDOS) return;

    var desde = e.range.getColumn();
    var hasta = desde + e.range.getNumColumns() - 1;
    if (COL_ESTADO < desde || COL_ESTADO > hasta) return;   // no tocaron Estado

    trasCambiarEstado();
  } catch (err) {
    registrarError(err, null);
  }
}

/* ==========================================================================
   RESUMEN Y CONTEO DE CUPONES  —  disparador horario, no en cada pedido
   ========================================================================== */
function recalcularResumen() {
  var datos = filas(H_PEDIDOS);
  var acum = {}, usosCupon = {}, pedidosCupon = {};

  datos.forEach(function (f) {
    /* «¿YA SE VENDIÓ?» SE LE PREGUNTA A esVenta(), y esta línea es la razón de
       que haga falta decirlo otra vez. Aquí sobrevivía la tercera copia de la
       regla —`indexOf('confirmado')`— después de que el comentario de
       esVenta() declarara unificadas las otras dos. Desde que los estados se
       migraron a «Pagado», esta copia no contaba NADA: Más vendidos quedaba
       vacía y los usos de cada cupón en cero, así que un cupón con tope de
       usos no se agotaba nunca. Lo cazó D-3, al pedir que cambiar el estado
       desde el panel tenga «el mismo efecto que en la hoja». */
    if (!esVenta(f[3])) return;                                            // Estado
    var id = f[7];
    if (!id) return;
    if (!acum[id]) acum[id] = { nombre: f[6], unidades: 0, ingresos: 0, pedidos: {} };
    acum[id].unidades += Number(f[8]) || 0;
    acum[id].ingresos += Number(f[10]) || 0;
    acum[id].pedidos[f[1]] = true;

    var cup = String(f[5]).trim().toUpperCase();
    if (cup) {
      if (!pedidosCupon[cup]) pedidosCupon[cup] = {};
      pedidosCupon[cup][f[1]] = true;                 // un pedido cuenta una vez
    }
  });

  Object.keys(pedidosCupon).forEach(function (c) {
    usosCupon[c] = Object.keys(pedidosCupon[c]).length;
  });

  var lista = Object.keys(acum).map(function (id) {
    var a = acum[id];
    return [a.nombre, id, a.unidades, a.ingresos, Object.keys(a.pedidos).length];
  }).sort(function (a, b) { return b[2] - a[2]; });

  var h = hoja(H_RESUMEN, ['Producto', 'ID', 'Unidades vendidas', 'Ingresos',
                           'Pedidos en que aparece']);
  if (h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 5).clearContent();
  if (lista.length) h.getRange(2, 1, lista.length, 5).setValues(lista);
  h.getRange(2, 4, Math.max(lista.length, 1), 1).setNumberFormat('"$"#,##0');

  recalcularTablero();

  // El correo se revisa aquí para no gastar un disparador aparte. Va en try
  // propio: si el correo falla, el inventario y el tablero no se caen con él.
  try { revisarCorreo(); } catch (e) { registrarError('correo: ' + e.message, null); }
  try { consolidarLecturas(); } catch (e) { registrarError('lecturas: ' + e.message, null); }

  // "Usos confirmados" de cada cupón: solo ventas que TÚ marcaste Confirmado.
  var hc = elLibro().getSheetByName(H_CUPONES);
  if (hc && hc.getLastRow() > 1) {
    var cup = hc.getRange(2, 1, hc.getLastRow() - 1, 8).getValues();
    var conteo = cup.map(function (f) {
      return [usosCupon[String(f[0]).trim().toUpperCase()] || 0];
    });
    hc.getRange(2, 7, conteo.length, 1).setValues(conteo);
  }
}

/* Lo mismo que registrarError, pero para lo que no es una excepción: algo que
   salió mal en los datos y que el comerciante tiene que ver. Se anota una vez
   por hora y por motivo — si una celda está mal, lo estará en cada pedido, y
   una hoja Errores con doscientas filas iguales no la lee nadie. */
function anotarError(motivo, detalle) {
  try {
    var llave = 'err:' + String(motivo).slice(0, 40);
    var c = CacheService.getScriptCache();
    if (c.get(llave)) return;
    c.put(llave, '1', 3600);
    var h = hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
    if (h.getLastRow() > 500) return;
    h.appendRow([new Date(), celdaSegura(motivo, MAX_ACTA), celdaSegura(detalle, 200)]);
  } catch (x) { /* avisar nunca puede tumbar un pedido */ }
}

function registrarError(err, e) {
  try {
    var h = hoja(H_ERRORES, ['Fecha', 'Error', 'Primeros 200 caracteres recibidos']);
    if (h.getLastRow() > 500) return;
    var crudo = (e && e.postData && e.postData.contents) ? e.postData.contents : '(sin cuerpo)';
    h.appendRow([new Date(), celdaSegura(String(err)), celdaSegura(crudo.slice(0, 200))]);
  } catch (x) {
    // Si ni siquiera podemos escribir el error (por ejemplo, porque el script
    // no está unido a una hoja), no tumbamos la respuesta por eso.
    console.log('No se pudo registrar el error: ' + err);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   M3.5 · COBRAR EN LÍNEA (Bold, Botón de pagos)
   --------------------------------------------------------------------------
   La tienda cierra la venta de una de dos maneras, y la elige la hoja
   (Configuración › cobro_modo): por WhatsApp, como siempre, o cobrando en
   línea. Cobrar en línea es el mismo carrito con otro final:

     1. La página manda el carrito y los datos de entrega a `pago_crear`. El
        maestro vuelve a calcular TODO —precios, cupón, envío, stock— y no
        acepta un total de la página.
     2. APARTA las unidades (E-1): mientras dura el apartado, lo que otro
        comprador ve disponible es el stock menos eso.
     3. Firma el cobro —SHA-256 de pedido + monto + moneda + llave secreta,
        la fórmula de Bold— y le devuelve a la página solo lo público: la llave
        de identidad y la firma. La secreta no sale de las propiedades.
     4. La página abre la pasarela de Bold con eso. El comprador paga allí:
        la tarjeta y el banco nunca pasan por la tienda ni por el maestro.
     5. Al volver, la página pregunta a `pago_estado`, y el maestro le
        pregunta a Bold por la referencia (E-4). NUNCA se cree el estado que
        trae la dirección de vuelta: esa la puede escribir cualquiera.
     6. Aprobado y con el monto que calculó el maestro → el pedido entra a
        Pedidos ya Pagado, y lo que pasa después es lo MISMO que cuando el
        comerciante marca Pagado a mano (trasCambiarEstado, llamado, no
        copiado). Correo al comprador y al comercio.
     7. Si el comprador no vuelve, un disparador cada cinco minutos pregunta
        por los cobros abiertos —y se borra solo cuando no queda ninguno—.

   POR QUÉ NO EL AVISO (WEBHOOK) DE BOLD. `doPost` de Apps Script no ve las
   cabeceras HTTP, y Bold firma su aviso en una cabecera. Un aviso que no se
   puede verificar no puede marcar nada como pagado. La verdad se le pregunta
   a la API de Bold, que es autenticada. (Decisión 12.)

   LO QUE ESTO PORTA Y LO QUE NO. La integración con Bold se probó primero en
   la línea anterior del producto, con una compra completa en el ambiente de
   pruebas, y de ahí sale
   la forma de hablarle a Bold: la librería, la firma, la consulta y sus
   estados. Lo que cambia aquí es el alrededor, porque esta tienda tiene sus
   propias reglas escritas en el plan (M3.5): el apartado dura minutos y no un
   día, se sostiene mientras el banco diga «pendiente», los cobros abiertos
   viven en un solo sitio, la llave no se anida, y si la pasarela no está
   lista la tienda NO se queda sin vender: sigue por WhatsApp.
   ══════════════════════════════════════════════════════════════════════════ */
var H_PAGOS    = 'Pagos';
var H_ENTREGAS = 'Datos de entrega';

/* El libro de los cobros. Una fila por intento de pago, que se va poniendo al
   día. NO sale por ninguna puerta: lleva lo que se cobró y a quién. */
var ENCABEZADO_PAGOS = ['Fecha', 'Pedido', 'Proveedor', 'Ambiente', 'Estado', 'Estado en Bold',
                        'Transacción', 'Medio de pago', 'Total', 'Líneas', 'Cupón', 'Envío',
                        'Subtotal', 'Descuento', 'Valor envío', 'Apartado hasta', 'Token',
                        'Última consulta', 'Comprador avisado', 'Comercio avisado', 'Nota'];

/* Por WhatsApp los datos de entrega viajan en el chat y la hoja no los
   guarda. Cobrando en línea no hay chat antes del pago: el comercio necesita
   saber a dónde despachar, y esta es la única pestaña que lo guarda. Tampoco
   sale por ninguna puerta. */
var ENCABEZADO_ENTREGAS = ['Fecha', 'Pedido', 'Nombre', 'Celular', 'Correo', 'Ciudad',
                           'Dirección', 'Notas'];

var COBRO_MODOS     = ['WhatsApp', 'Pasarela'];
var COBRO_AMBIENTES = ['Pruebas', 'Producción'];

/* E-1: el apartado dura esto, y se estira de a esto mismo mientras Bold diga
   que el pago está en curso (PSE puede tardar). El tope son las 24 horas en
   que Bold deja consultar una transacción: pasado eso ya no hay a quién
   preguntar, y el cobro se da por vencido y se le avisa al comercio. */
var MINUTOS_APARTADO   = 15;
var HORAS_CONSULTABLE  = 24;
/* Una consulta a Bold por cobro cada tanto, no una por cada vez que la página
   pregunte: la página pregunta con paciencia, pero la paciencia de un
   navegador no es una garantía. */
var SEGUNDOS_ENTRE_CONSULTAS = 20;
/* Una tienda pequeña no tiene cuarenta pagos abiertos a la vez. Si los tiene,
   algo está mal —o alguien está apartando el catálogo a propósito—, y lo
   sensato es no apartar más. */
var MAX_COBROS_ABIERTOS = 40;
var BOLD_MINIMO = 1000;                // Bold no cobra menos de $1.000
var BOLD_CONSULTA = 'https://payments.api.bold.co/v2/payment-voucher/';
var PROPIEDAD_COBROS = 'COBROS_ABIERTOS';

/* ── Qué modo manda de verdad ─────────────────────────────────────────────
   Lo que PIDE la hoja y lo que la tienda PUEDE hacer no siempre coinciden.
   Pedir «Pasarela» sin las llaves de Bold, o con una dirección de tienda
   vacía, no deja la tienda sin vender: sigue por WhatsApp, y el problema se
   dice (en el panel, en el diagnóstico). Y un valor que no se entiende no se
   adivina — tampoco el ambiente: confundir pruebas con producción es cobrar
   de mentira o de verdad sin saberlo. */
function cobroVigente(cfg) {
  cfg = cfg || leerConfiguracion();
  var pedido = llano(cfg.cobro_modo);
  var ambiente = llano(cfg.cobro_ambiente);
  var r = { modo: 'whatsapp', pedido: 'whatsapp', ambiente: 'pruebas', problema: '' };
  if (!pedido || pedido === 'whatsapp') return r;
  if (pedido !== 'pasarela') {
    r.problema = 'cobro_modo dice «' + String(cfg.cobro_modo).slice(0, 30) +
                 '»: tiene que ser WhatsApp o Pasarela. Mientras tanto se vende por WhatsApp.';
    return r;
  }
  r.pedido = 'pasarela';
  if (ambiente === 'produccion') r.ambiente = 'produccion';
  else if (ambiente && ambiente !== 'pruebas') {
    r.problema = 'cobro_ambiente dice «' + String(cfg.cobro_ambiente).slice(0, 30) +
                 '»: tiene que ser Pruebas o Producción. Mientras tanto se vende por WhatsApp.';
    return r;
  }
  var ll = llavesBold(r.ambiente);
  if (!ll.identidad || !ll.secreta) {
    r.problema = (ll.faltan.length === 1 ? 'Falta la llave ' : 'Faltan las llaves ') + ll.faltan.join(' y ') +
                 ' (Bold, ' + (r.ambiente === 'produccion' ? 'producción' : 'pruebas') +
                 ') en Apps Script › Configuración del proyecto › Propiedades del script.' +
                 ' Mientras tanto se vende por WhatsApp.';
    return r;
  }
  if (sinLlenar(cfg.sitio_url)) {
    r.problema = 'Falta sitio_url: Bold necesita saber a dónde devolver al comprador. ' +
                 'Mientras tanto se vende por WhatsApp.';
    return r;
  }
  r.modo = 'pasarela';
  return r;
}

/* Los mismos nombres que en la línea anterior, a propósito: dos tiendas del mismo
   titular de Bold comparten llaves, y copiarlas no debería exigir traducir.

   Y SE ACEPTAN LOS DOS NOMBRES QUE USA ESA LÍNEA: `BOLD_IDENTIDAD_*` y su alias
   `BOLD_BOTON_IDENTIDAD_*`. Una tienda que copió las propiedades de la otra
   con el alias quedaba vendiendo por WhatsApp con la hoja diciendo Pasarela,
   y nada lo decía en la página (bitácora 57). Por lo mismo se busca sin
   mirar mayúsculas ni espacios al final: en el editor de propiedades de Apps
   Script un espacio al final del nombre no se ve. */
function llavesBold(ambiente) {
  var sufijo = ambiente === 'produccion' ? 'PRODUCCION' : 'SANDBOX';
  var todas = {};
  try { todas = PropertiesService.getScriptProperties().getProperties() || {}; } catch (e) { todas = {}; }
  var limpias = {};
  Object.keys(todas).forEach(function (k) {
    var v = String(todas[k] === null || todas[k] === undefined ? '' : todas[k]).trim();
    if (v) limpias[String(k).trim().toUpperCase()] = v;
  });
  /* «Pruebas» es como lo dice la hoja; SANDBOX, como lo dice Bold. Alguien
     que escribe BOLD_IDENTIDAD_PRUEBAS no está equivocado. */
  var sufijos = sufijo === 'SANDBOX' ? ['SANDBOX', 'PRUEBAS'] : ['PRODUCCION'];
  var leer = function (tipo) {
    for (var i = 0; i < sufijos.length; i++) {
      var v = limpias['BOLD_' + tipo + '_' + sufijos[i]] || limpias['BOLD_BOTON_' + tipo + '_' + sufijos[i]];
      if (v) return v;
    }
    return '';
  };
  var r = { identidad: leer('IDENTIDAD'), secreta: leer('SECRETA'),
            nombres: ['BOLD_IDENTIDAD_' + sufijo, 'BOLD_SECRETA_' + sufijo] };
  /* Qué falta, con nombre propio: «faltan las llaves» cuando falta UNA manda a
     revisar las dos. */
  r.faltan = r.nombres.filter(function (n, i) { return !(i === 0 ? r.identidad : r.secreta); });
  return r;
}

/* ── Los cobros abiertos, en un solo sitio ────────────────────────────────
   Un mapa en las propiedades: pedido → { l: líneas [[id, cantidad]],
   h: apartado hasta, c: consultable hasta, t: token, u: última consulta,
   a: 1 si quedan correos por mandar }. Es lo que leen la validación (qué está
   apartado), el disparador (qué hay que preguntar) y la página (por su token).

   La pestaña Pagos es el LIBRO, para las personas; esto es la lista de
   trabajo. No son dos copias de lo mismo: el libro guarda todo lo que pasó, y
   la lista solo lo que falta cerrar — y se vacía sola. Leer una propiedad es
   mucho más barato que leer una pestaña, y la validación corre con cada
   cambio del carrito. */
function leerCobros() {
  try {
    var t = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_COBROS);
    var m = t ? JSON.parse(t) : {};
    return (m && typeof m === 'object') ? m : {};
  } catch (e) { return {}; }
}

function guardarCobros(m) {
  var props = PropertiesService.getScriptProperties();
  if (!Object.keys(m).length) props.deleteProperty(PROPIEDAD_COBROS);
  else props.setProperty(PROPIEDAD_COBROS, JSON.stringify(m));
}

/* Lo apartado que NO ha vencido, por producto. Lo vencido se ignora al leer:
   no hace falta un disparador que lo limpie para que deje de contar. */
function unidadesApartadas() {
  return unidadesApartadasDe(leerCobros());
}

/* ── Los datos de entrega ───────────────────────────────────────────────── */
function entregaDelPago(e, conDireccion) {
  e = e || {};
  var d = {
    nombre:    celdaSegura(e.nombre, 60),
    tel:       String(e.tel || '').replace(/\D/g, '').slice(-12),
    correo:    celdaSegura(e.correo, 120).toLowerCase(),
    ciudad:    celdaSegura(e.ciudad, 40),
    direccion: celdaSegura(e.direccion, 120),
    notas:     celdaSegura(e.notas, 300)
  };
  var falta = [];
  if (d.nombre.length < 3) falta.push('tu nombre');
  if (d.tel.length < 7) falta.push('tu celular');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) falta.push('un correo válido');
  if (d.ciudad.length < 2) falta.push('tu ciudad');
  if (conDireccion && d.direccion.length < 5) falta.push('la dirección');
  if (falta.length) d.error = 'Para pagar falta ' + falta.join(', ') + '.';
  return d;
}

function sha256Hex(texto) {
  return enHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto)));
}

function sitioBase() {
  return conEsquema(leerConfiguracion().sitio_url).replace(/[#?].*$/, '').replace(/\/+$/, '') + '/';
}

function tokenDeCobro() {
  return 'pg' + Utilities.getUuid().replace(/-/g, '');
}

/* ── pago_crear ───────────────────────────────────────────────────────────
   Pública (la llama el comprador) y SOLO POR POST: lleva datos personales, y
   una dirección se queda en el historial y en los registros de Google.
   Con número de operación: el doble toque de «Pagar», o el reintento de un
   celular sin señal, contesta el MISMO cobro en vez de apartar dos veces. */
function atenderPagoCrear(p) {
  try {
    return conOperacion(p, function () { return crearCobro(p); });
  } catch (err) {
    /* Pública: el motivo va al registro, no al comprador. */
    registrarError('pago_crear: ' + (err && err.message ? err.message : err), null);
    return { ok: false, error: 'No pudimos preparar el pago. Intenta de nuevo en un momento.' };
  }
}

function crearCobro(p) {
  var cfg = leerConfiguracion();
  var cobro = cobroVigente(cfg);
  /* La página puede estar vieja —la tienda pasó a WhatsApp y el archivo
     publicado todavía no—. No es un error del comprador: se le dice que siga
     por WhatsApp, y la página lo hace. */
  if (cobro.modo !== 'pasarela') {
    return { ok: false, cobro: 'whatsapp',
             error: 'Esta tienda está recibiendo los pedidos por WhatsApp.' };
  }

  var abiertos = leerCobros();
  if (Object.keys(abiertos).length >= MAX_COBROS_ABIERTOS) {
    anotarError('Demasiados cobros abiertos a la vez',
                Object.keys(abiertos).length + ' pagos en curso; no se apartan más hasta que se cierren.');
    return { ok: false, error: 'Hay muchos pagos en curso en este momento. Intenta en unos minutos.' };
  }

  var r = validarPedido({ items: p.items, cupon: p.cupon, envio: p.envio });
  if (!r.ok) return { ok: false, recortado: !!r.recortado, avisos: r.avisos || [],
                      error: r.error || 'No hay productos válidos en el pedido.' };
  /* No se cobra un carrito distinto del que el comprador vio. */
  if (r.recortado) {
    return { ok: false, recortado: true, avisos: r.avisos,
             error: (r.avisos || []).join(' ') || 'Tu pedido cambió: revísalo antes de pagar.' };
  }
  if (r.cerrada) return { ok: false, cerrada: true, avisos: r.avisos, error: (r.avisos || []).join(' ') };
  if (r.faltaMinimo) return { ok: false, avisos: r.avisos, error: (r.avisos || []).join(' ') };
  if (!r.cobrable) {
    return { ok: false, cobro: 'whatsapp', avisos: r.avisos,
             error: 'Este pedido no se puede cobrar en línea ahora mismo: ' + (r.avisos || []).join(' ') +
                    ' Envíalo por WhatsApp y te confirmamos el total.' };
  }
  if (r.total < BOLD_MINIMO) return { ok: false, error: 'El pago en línea es desde ' + pesos(BOLD_MINIMO) + '.' };
  if (r.total > MAX_TOTAL) return { ok: false, error: 'El total pasa del máximo para pagar en línea.' };

  var d = entregaDelPago(p.entrega, r.envioTarifa > 0);
  if (d.error) return { ok: false, error: d.error };

  var codigo;
  do { codigo = aleatorio(8); } while (abiertos[codigo] || yaRegistrado(codigo));
  var token = tokenDeCobro();
  var ll = llavesBold(cobro.ambiente);
  var monto = String(Math.round(r.total));
  var ahora = Date.now();

  /* El apartado primero: si algo de lo que sigue falla, conOperacion no
     guarda la respuesta y el apartado se queda sin cobro que lo use — y vence
     solo en quince minutos. Al revés, un cobro sin apartado podría vender
     dos veces la misma unidad, que es justo lo que E-1 existe para impedir. */
  abiertos[codigo] = { l: r.items.map(function (i) { return [i.id, i.cantidad, i.variante || '']; }),
                       h: ahora + MINUTOS_APARTADO * 60000,
                       c: ahora + HORAS_CONSULTABLE * 3600000, t: token, u: 0,
                       /* M5: la huella del enlace de seguimiento, para el pedido que
                          nace cuando Bold apruebe. Solo la huella. */
                       s: rastreoEncendido() ? huellaDeSeguimiento(secretoDelCobro(codigo)) : '' };
  guardarCobros(abiertos);

  var lineas = r.items.map(function (i) {
    return { id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, variante: i.variante || '' };
  });
  /* El acta, con el mismo número: Validaciones, Pagos y Pedidos dicen el
     mismo código. PRIMERO el acta y con escribirActa, no con sellar(): sellar
     toma la llave y al terminar la SUELTA, y todo lo que viniera después —el
     libro de pagos, los datos de entrega— quedaría escrito sin llave. */
  escribirActa(codigo, numeroSeguro(p.sub, MAX_TOTAL), r.items, r, true);
  var hp = hoja(H_PAGOS, ENCABEZADO_PAGOS);
  hp.appendRow([new Date(ahora), codigo, 'Bold', cobro.ambiente === 'produccion' ? 'Producción' : 'Pruebas',
                'Esperando pago', '', '', '', r.total, JSON.stringify(lineas),
                celdaSegura(r.cupon.ok ? r.cupon.codigo : ''), celdaSegura(r.envioNombre),
                r.sub, r.descuento, r.envio, new Date(abiertos[codigo].h), token, '', '', '', '']);
  hoja(H_ENTREGAS, ENCABEZADO_ENTREGAS).appendRow(
    [new Date(ahora), codigo, d.nombre, d.tel, d.correo, d.ciudad, d.direccion, d.notas]);
  asegurarConciliador();

  var base = sitioBase();
  var checkout = {
    orderId: codigo, currency: 'COP', amount: monto, apiKey: ll.identidad,
    integritySignature: sha256Hex(codigo + monto + 'COP' + ll.secreta),
    description: ('Pedido ' + codigo + ' · ' + (cfg.negocio || 'Tienda')).slice(0, 100),
    redirectionUrl: base + '?pago=' + token,
    originUrl: base + '?pago=' + token + '&abandono=1',
    customerData: { email: d.correo, fullName: d.nombre, phone: d.tel, dialCode: '+57' }
  };
  if (d.direccion) checkout.billingAddress = { address: d.direccion, city: d.ciudad, country: 'CO' };
  return { ok: true, pedido: codigo, token: token, total: r.total, moneda: 'COP',
           pruebas: cobro.ambiente !== 'produccion', checkout: checkout,
           /* AL FINAL (R1). 0.12.0: el secreto del rastreo lo pone el maestro. */
           seguimiento: rastreoEncendido() ? secretoDelCobro(codigo) : '' };
}

/* ── pago_estado ──────────────────────────────────────────────────────────
   Pública, por el token opaco que la página recibió al crear el cobro (y que
   Bold le devuelve en la dirección). No dice nada del comprador: pedido,
   estado y total. */
function atenderPagoEstado(p) {
  var token = String(p.token || '').trim();
  if (!/^pg[0-9a-f]{32}$/.test(token)) return { ok: false, error: 'Pago no encontrado.' };
  try {
    var abiertos = leerCobros();
    var codigo = null;
    Object.keys(abiertos).forEach(function (k) { if (abiertos[k].t === token) codigo = k; });
    if (codigo) revisarCobro(codigo, false);
    var f = filaDelCobro(token);
    if (!f) return { ok: false, error: 'Pago no encontrado.' };
    var estado = estadoPublico(f.datos[4]);
    return { ok: true, pedido: String(f.datos[1]), estado: estado,
             total: Number(f.datos[8]) || 0, transaccion: String(f.datos[6] || ''),
             /* AL FINAL (R1). 0.12.0: el enlace de rastreo, a quien tiene el token
                del cobro —el que Bold devolvió a su navegador—. */
             seguimiento: (estado === 'pagado' || estado === 'revisar') && rastreoEncendido()
               ? secretoDelCobro(String(f.datos[1])) : '' };
  } catch (err) {
    registrarError('pago_estado: ' + (err && err.message ? err.message : err), null);
    return { ok: false, error: 'No pudimos consultar el pago. Intenta en un momento.' };
  }
}

/* Lo que la página necesita saber, sin los matices del libro. */
function estadoPublico(texto) {
  var t = llano(texto);
  if (t === 'pagado' || t === 'pagado sin existencias') return 'pagado';
  if (t === 'rechazado') return 'rechazado';
  if (t === 'vencido') return 'vencido';
  if (t === 'revisar monto') return 'revisar';
  return 'esperando';
}

function filaDelCobro(token) {
  var h = elLibro().getSheetByName(H_PAGOS);
  if (!h || h.getLastRow() < 2) return null;
  var desde = Math.max(2, h.getLastRow() - 500);
  var datos = h.getRange(desde, 1, h.getLastRow() - desde + 1, ENCABEZADO_PAGOS.length).getValues();
  for (var i = datos.length - 1; i >= 0; i--) {
    if (String(datos[i][16]).trim() === token) return { h: h, fila: desde + i, datos: datos[i] };
  }
  return null;
}

/* ── Preguntarle a Bold ───────────────────────────────────────────────────
   GET /v2/payment-voucher/<referencia>, con la llave de identidad. Justo
   después de pagar puede contestar NO_TRANSACTION_FOUND durante unos minutos:
   eso NO es un rechazo, es que todavía no lo sabe. */
function consultarBold(codigo, ambiente) {
  var ll = llavesBold(ambiente);
  if (!ll.identidad) throw new Error('Faltan las llaves de Bold de ' + ambiente + '.');
  var res = UrlFetchApp.fetch(BOLD_CONSULTA + encodeURIComponent(codigo), {
    method: 'get', muteHttpExceptions: true,
    headers: { Authorization: 'x-api-key ' + ll.identidad, Accept: 'application/json' }
  });
  var codigoHttp = res.getResponseCode();
  var dato;
  try { dato = JSON.parse(res.getContentText() || '{}'); } catch (e) { dato = null; }
  /* 404 con cuerpo es la forma en que Bold dice «no encontré nada todavía». */
  if (codigoHttp === 404) return { estado: 'NO_TRANSACTION_FOUND' };
  if (codigoHttp < 200 || codigoHttp >= 300 || !dato) {
    throw new Error('Bold contestó ' + codigoHttp + ' al consultar ' + codigo + '.');
  }
  var d = dato.payload || dato;
  return { estado: String(d.payment_status || 'NO_TRANSACTION_FOUND').toUpperCase(),
           total: d.total === undefined || d.total === null || d.total === '' ? null : Number(d.total),
           transaccion: celdaSegura(d.transaction_id || '', 80),
           medio: celdaSegura(d.payment_method || '', 40) };
}

/* ── Revisar un cobro abierto ─────────────────────────────────────────────
   La pregunta a Bold va FUERA de la llave (puede tardar segundos) y lo que se
   hace con la respuesta va DENTRO, releyendo la lista: entre medias otro
   camino —el disparador, la página— puede haberlo cerrado ya. */
function revisarCobro(codigo, forzar) {
  var abiertos = leerCobros();
  var c = abiertos[codigo];
  if (!c) return null;
  var ahora = Date.now();
  if (!forzar && ahora - (Number(c.u) || 0) < SEGUNDOS_ENTRE_CONSULTAS * 1000) return null;
  var f = filaDelCobro(c.t);
  if (!f) {                                  // un cobro sin fila no se puede cerrar: se suelta
    delete abiertos[codigo]; guardarCobros(abiertos); return null;
  }
  var ambiente = llano(f.datos[3]) === 'produccion' ? 'produccion' : 'pruebas';

  var bold = null, fallo = '';
  if (c.a && estadoPublico(f.datos[4]) === 'pagado') bold = { estado: 'YA_PAGADO' };
  else {
    try { bold = consultarBold(codigo, ambiente); }
    catch (err) { fallo = String(err && err.message ? err.message : err); }
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    abiertos = leerCobros();
    c = abiertos[codigo];
    if (!c) return null;
    f = filaDelCobro(c.t);
    ahora = Date.now();
    c.u = ahora;
    var h = f.h, fila = f.fila;
    h.getRange(fila, 18).setValue(new Date(ahora));                    // Última consulta
    if (fallo) {
      h.getRange(fila, 21).setValue(celdaSegura(fallo, 200));
      if (ahora > c.c) cerrarCobro(abiertos, codigo, f, 'Vencido', 'Bold no contestó y pasó el plazo para consultarlo.');
      guardarCobros(abiertos);
      return null;
    }
    if (bold.estado === 'YA_PAGADO') {
      avisarPago(codigo, f, abiertos);
      guardarCobros(abiertos);
      return 'pagado';
    }
    h.getRange(fila, 6).setValue(bold.estado);                          // Estado en Bold
    if (bold.transaccion) h.getRange(fila, 7).setValue(bold.transaccion);
    if (bold.medio) h.getRange(fila, 8).setValue(bold.medio);

    if (bold.estado === 'APPROVED') {
      /* E-4 · UN MONTO DISTINTO NO SE DA POR PAGADO. La firma ata el monto al
         pedido, así que esto no debería pasar; si pasa, alguien tocó algo, y
         decidir qué hacer es del comerciante, con los dos números delante. */
      if (bold.total !== null && bold.total !== Number(f.datos[8])) {
        cerrarCobro(abiertos, codigo, f, 'Revisar monto',
                    'Bold aprobó ' + pesos(bold.total) + ' y el pedido vale ' + pesos(f.datos[8]) + '.');
        anotarError('Un pago aprobado con un monto distinto',
                    'Pedido ' + codigo + ': Bold aprobó ' + pesos(bold.total) + ' y el maestro calculó ' +
                    pesos(f.datos[8]) + '. No se registró como venta: revísalo en Pagos.');
        guardarCobros(abiertos);
        return 'revisar';
      }
      confirmarCobro(codigo, f, bold, abiertos);
      guardarCobros(abiertos);
      return 'pagado';
    }
    if (bold.estado === 'REJECTED' || bold.estado === 'FAILED' || bold.estado === 'VOIDED') {
      cerrarCobro(abiertos, codigo, f, 'Rechazado', '');
      guardarCobros(abiertos);
      return 'rechazado';
    }
    if (bold.estado === 'PENDING' || bold.estado === 'PROCESSING') {
      /* E-5 · PSE PENDIENTE: el apartado se sostiene mientras el banco diga
         que está en curso, de a quince minutos, hasta el tope. */
      c.h = Math.min(c.c, Math.max(Number(c.h) || 0, ahora + MINUTOS_APARTADO * 60000));
      h.getRange(fila, 16).setValue(new Date(c.h));
    }
    if (ahora > c.c) {
      cerrarCobro(abiertos, codigo, f, 'Vencido', bold.estado === 'NO_TRANSACTION_FOUND' ? '' :
                  'Bold seguía diciendo ' + bold.estado + ' al pasar el plazo: revísalo en el panel de Bold.');
      if (bold.estado !== 'NO_TRANSACTION_FOUND') {
        anotarError('Un pago quedó en curso más de ' + HORAS_CONSULTABLE + ' horas',
                    'Pedido ' + codigo + ': Bold dice ' + bold.estado + '. Revísalo en el panel de Bold.');
      }
    }
    guardarCobros(abiertos);
    return 'esperando';
  } finally {
    lock.releaseLock();
  }
}

function cerrarCobro(abiertos, codigo, f, estado, nota) {
  f.h.getRange(f.fila, 5).setValue(estado);
  if (nota) f.h.getRange(f.fila, 21).setValue(celdaSegura(nota, 200));
  delete abiertos[codigo];
}

/* ── Aprobado: la venta ───────────────────────────────────────────────────
   Bajo la llave de revisarCobro. Idempotente por el número del pedido: si ya
   está en Pedidos, no se escribe otra vez ni se descuenta otra vez. */
function confirmarCobro(codigo, f, bold, abiertos) {
  var c = abiertos[codigo];
  var datos = f.datos;
  var lineas;
  try { lineas = JSON.parse(String(datos[9] || '[]')); } catch (e) { lineas = []; }

  var sinExistencias = [];
  if (!yaRegistrado(codigo)) {
    /* E-5 · APROBADO CON EL APARTADO VENCIDO. Si el apartado ya no cubre, se
       mira si las unidades siguen ahí —sin contar lo que otros tienen
       apartado—. Si no están, la plata YA entró: el pedido se registra igual,
       y el comercio recibe el aviso de que tiene que devolver o conseguir. */
    if (!(Number(c.h) > Date.now())) {
      delete abiertos[codigo];
      var apartado = unidadesApartadasDe(abiertos);
      var stock = stockPorId();
      var pedido = {};
      lineas.forEach(function (i) { pedido[i.id] = (pedido[i.id] || 0) + (Number(i.cantidad) || 0); });
      Object.keys(pedido).forEach(function (id) {
        var libre = (stock[id] || 0) - (apartado[id] || 0);
        if (libre < pedido[id]) sinExistencias.push(pedido[id] + ' × ' + id + ' (quedaban ' + Math.max(0, libre) + ')');
      });
      abiertos[codigo] = c;
    }
    var entrega = entregaDelCobro(codigo);
    guardarPedido({
      pedido: codigo, ref: codigo, estado: 'Pagado', seguimiento: (c && c.s) || '',
      ciudad: entrega ? celdaSegura(entrega[5]) : '',
      cupon: celdaSegura(datos[10]), total: Number(datos[8]) || 0,
      items: lineas.map(function (i) {
        return { id: i.id, nombre: celdaSegura(i.nombre), cantidad: Number(i.cantidad) || 0,
                 precio: Number(i.precio) || 0, variante: i.variante || '' };
      }),
      pago: { proveedor: 'Bold' + (llano(datos[3]) === 'produccion' ? '' : ' (pruebas)'),
              referencia: codigo, transaccion: bold.transaccion || '' }
    });
    marcarRegistrado(codigo);
    /* El apartado se suelta en el MISMO momento en que el inventario baja: si
       quedaran los dos, esas unidades contarían dos veces como no disponibles
       —nunca de más, que es el lado seguro, pero sí de menos—. */
    c.h = 0;
    trasCambiarEstado();
  }
  f.h.getRange(f.fila, 5).setValue(sinExistencias.length ? 'Pagado sin existencias' : 'Pagado');
  /* «Quién» no puede quedar vacío (0.12.0): lo hizo la pasarela, con la
     transacción que da Bold. El comprador no se nombra: no se guarda. */
  anotarCambios('Bold', 'Pasarela Bold' + (bold.transaccion ? ' · ' + bold.transaccion : ''),
                [{ que: 'Pago en línea aprobado', donde: 'Pedidos · #' + codigo,
    antes: '', despues: pesos(datos[8]) + (bold.transaccion ? ' · transacción ' + bold.transaccion : '') +
                        (sinExistencias.length ? ' · SIN EXISTENCIAS' : '') }]);
  if (sinExistencias.length) {
    f.h.getRange(f.fila, 21).setValue(celdaSegura('Sin existencias: ' + sinExistencias.join(', '), 200));
    anotarError('Pago aprobado sin existencias',
                'Pedido ' + codigo + ': ' + sinExistencias.join(', ') +
                '. El pago ya entró: hay que conseguir las unidades o devolver el dinero.');
  }
  c.a = 1;                                  // los correos, a continuación
  avisarPago(codigo, filaDelCobro(c.t) || f, abiertos, sinExistencias);
}

function unidadesApartadasDe(m) {
  var ahora = Date.now(), r = {};
  Object.keys(m).forEach(function (k) {
    if (!(Number(m[k].h) > ahora)) return;
    (m[k].l || []).forEach(function (x) {
      var n = Number(x[1]) || 0, id = String(x[0]);
      r[id] = (r[id] || 0) + n;
      /* C-1b: también por combinación, con la misma llave que validarPedido. */
      if (x[2]) { var c = id + '\u0000' + llano(x[2]); r[c] = (r[c] || 0) + n; }
    });
  });
  return r;
}

function stockPorId() {
  var r = {};
  filasDelCatalogo().filas.forEach(function (f) {
    var id = String(f[0]).trim();
    if (id) r[id] = Number(f[COL_STOCK - 1]) || 0;
  });
  return r;
}

function entregaDelCobro(codigo) {
  var datos = filas(H_ENTREGAS);
  for (var i = datos.length - 1; i >= 0; i--) if (String(datos[i][1]) === codigo) return datos[i];
  return null;
}

/* ── Los correos ──────────────────────────────────────────────────────────
   Uno al comprador y uno al comercio. Cada uno se marca al salir, así que
   volver a pasar por aquí —el disparador, la página que vuelve a preguntar—
   no los repite. Si no hay cuota, el cobro se queda abierto con `a` puesto y
   se reintenta en la siguiente vuelta. */
function avisarPago(codigo, f, abiertos, sinExistencias) {
  var datos = f.datos, entrega = entregaDelCobro(codigo);
  var cfg = leerConfiguracion();
  var negocio = sinLlenar(cfg.negocio) ? 'Tu tienda' : cfg.negocio;
  var pruebas = llano(datos[3]) !== 'produccion';
  var lineas;
  try { lineas = JSON.parse(String(datos[9] || '[]')); } catch (e) { lineas = []; }
  var detalle = '<ul>' + lineas.map(function (i) {
    return '<li>' + escaparHtml(String(i.cantidad)) + ' × ' + escaparHtml(i.nombre) +
           (i.variante ? ' · ' + escaparHtml(i.variante) : '') + ' — ' + escaparHtml(pesos(i.cantidad * i.precio)) + '</li>';
  }).join('') + '</ul>';
  var total = '<p>Total pagado: <strong>' + escaparHtml(pesos(datos[8])) + '</strong></p>';
  var pendiente = false;

  if (!datos[18] && entrega && entrega[4]) {
    if (cuotaDeCorreo() < 1) pendiente = true;
    else {
      try {
        MailApp.sendEmail({ to: String(entrega[4]), name: negocio,
          subject: (pruebas ? '[PRUEBA] ' : '') + negocio + ' · pago confirmado · pedido ' + codigo,
          htmlBody: '<p>Hola ' + escaparHtml(entrega[2]) + ', recibimos tu pago.</p>' +
                    '<p>Pedido <strong>' + escaparHtml(codigo) + '</strong></p>' + detalle + total +
                    '<p>' + escaparHtml(negocio) + ' te contacta para coordinar la entrega.</p>' +
                    enlaceDeRastreoHtml(cfg, codigo) });
        f.h.getRange(f.fila, 19).setValue('Sí');
      } catch (e1) {
        f.h.getRange(f.fila, 21).setValue(celdaSegura('Correo al comprador: ' + e1.message, 200));
      }
    }
  }
  if (!datos[19]) {
    var para = listaDeCorreos((cfg.correo_resumen || '') + ',' +
                              (sinLlenar(cfg.empresa_correo) ? '' : cfg.empresa_correo));
    if (para.length) {
      if (cuotaDeCorreo() < 1) pendiente = true;
      else {
        try {
          MailApp.sendEmail({ to: para.join(','), name: negocio,
            subject: (pruebas ? '[PRUEBA — no despachar] ' : '') +
                     (sinExistencias && sinExistencias.length ? 'Pago SIN EXISTENCIAS · ' : 'Pago recibido · ') +
                     'pedido ' + codigo + ' · ' + pesos(datos[8]),
            htmlBody: (sinExistencias && sinExistencias.length
                        ? '<p><strong>El pago entró pero no alcanzan las unidades: ' +
                          escaparHtml(sinExistencias.join(', ')) +
                          '. Consíguelas o devuelve el dinero desde el panel de Bold.</strong></p>' : '') +
                      '<p>Pedido <strong>' + escaparHtml(codigo) + '</strong> · Bold' +
                      (datos[6] ? ' · transacción ' + escaparHtml(datos[6]) : '') + '</p>' + detalle + total +
                      (entrega ? '<p>Entregar a <strong>' + escaparHtml(entrega[2]) + '</strong> · ' +
                                 escaparHtml(entrega[3]) + ' · ' + escaparHtml(entrega[4]) + '<br>' +
                                 escaparHtml(entrega[6] || 'Recoge en tienda') + ', ' + escaparHtml(entrega[5]) +
                                 (entrega[7] ? '<br>Notas: ' + escaparHtml(entrega[7]) : '') + '</p>' : '') });
          f.h.getRange(f.fila, 20).setValue('Sí');
        } catch (e2) {
          f.h.getRange(f.fila, 21).setValue(celdaSegura('Correo al comercio: ' + e2.message, 200));
        }
      }
    }
  }
  if (pendiente) abiertos[codigo].a = 1;
  else delete abiertos[codigo];
}

/* ── El disparador, solo mientras haga falta ──────────────────────────────
   Una tienda que vende por WhatsApp, o que no tiene pagos en curso, no gasta
   una sola ejecución en esto (§6, el presupuesto de ejecuciones). */
function conciliarPagos() {
  var abiertos = leerCobros();
  var codigos = Object.keys(abiertos);
  if (!codigos.length) { quitarConciliador(); return 0; }
  var n = 0;
  codigos.slice(0, 20).forEach(function (codigo) {
    try { revisarCobro(codigo, true); n++; }
    catch (err) { registrarError('conciliarPagos ' + codigo + ': ' + err.message, null); }
  });
  if (!Object.keys(leerCobros()).length) quitarConciliador();
  return n;
}

function asegurarConciliador() {
  try {
    var ya = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === 'conciliarPagos';
    });
    if (!ya) ScriptApp.newTrigger('conciliarPagos').timeBased().everyMinutes(5).create();
  } catch (err) {
    /* Si no se puede crear, la revisión de cada hora también concilia: tarda
       más, pero no se pierde ningún pago. */
    anotarError('No se pudo programar la revisión de pagos', String(err && err.message || err));
  }
}

function quitarConciliador() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'conciliarPagos') ScriptApp.deleteTrigger(t);
  });
}

/* La revisión de cada hora. Antes el disparador llamaba directo a
   recalcularResumen; ahora primero concilia, por si el disparador de cinco
   minutos no se pudo crear. NO va dentro de recalcularResumen: esa la llama
   también el panel, bajo su llave, y conciliar toma la suya. */
function revisionHoraria() {
  try { if (Object.keys(leerCobros()).length) conciliarPagos(); }
  catch (err) { registrarError('revisionHoraria: ' + err.message, null); }
  recalcularResumen();
}

/* ══════════════════════════════════════════════════════════════════════════
   D-6 · EL REGISTRO DE CAMBIOS
   --------------------------------------------------------------------------
   Una pestaña que solo crece: cuándo, desde dónde (el panel, la hoja, Bold),
   quién, qué se hizo, dónde, y cómo estaba antes y cómo quedó. Es lo único
   que contesta «yo no borré eso» sin adivinar.

   Lo que NO puede hacer, dicho: Apps Script no deja cerrar una pestaña a su
   propio dueño. La pestaña va protegida con aviso —quien la edita a mano ve
   una advertencia—, y editarla también queda escrito aquí mismo. No es una
   bóveda; es un testigo que deja huella si alguien lo toca.

   Anotar NUNCA tumba lo que se está anotando: si la pestaña no se puede
   escribir, el cambio del comerciante ya se hizo, y eso es lo que importa.
   ══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   0.11.0 · 2.3 · RECUPERAR LA CLAVE SIN EL OPERADOR
   --------------------------------------------------------------------------
   Hasta ahora la clave solo salía del menú de la hoja. Un comerciante que la
   pierde y no sabe abrir su hoja quedaba esperando a quien le montó la tienda.

   EL CAMINO: desde la pantalla de entrada, «¿Olvidaste tu clave?» manda un
   código de 8 cifras AL CORREO DE LA TIENDA —correo_resumen, o empresa_correo
   si no hay— con el usuario del panel dentro. Con el código, el maestro inventa
   una clave nueva (la misma que daría el menú) y la muestra UNA vez. Cambiar
   la clave cierra las sesiones abiertas, como siempre.

   LO QUE NO SE PUEDE HACER con esto:
   · Mandar el código a otra parte: el destino es el de la hoja, no uno que se
     escriba en la página.
   · Adivinarlo: 8 cifras, vale 15 minutos, cinco intentos por código, y cada
     intento malo cuenta en el mismo contador que bloquea la entrada.
   · Llenar el buzón del dueño ni gastar la cuota de correos: como mucho tres
     códigos por hora.
   · Saber si un usuario existe: no se pregunta el usuario.
   Del código se guarda solo la huella.
   ══════════════════════════════════════════════════════════════════════════ */
var MINUTOS_CODIGO = 15, CODIGOS_POR_HORA = 3, INTENTOS_POR_CODIGO = 5;

function correoDeLaTienda(cfg) {
  var lista = listaDeCorreos(cfg.correo_resumen);
  if (!lista.length) lista = listaDeCorreos(cfg.empresa_correo);
  return lista[0] || '';
}
function tapado(correo) {
  var m = String(correo).match(/^(.)(.*)(.)@(.+)$/);
  return m ? m[1] + m[2].replace(/./g, '•') + m[3] + '@' + m[4] : '';
}
function huellaDeCodigo(codigo) {
  return enHex(Utilities.computeHmacSha256Signature(String(codigo), firmaDelPanel()));
}
function leerRecuperacion() {
  try { return JSON.parse(propiedades().getProperty('PANEL_RECUPERACION') || 'null'); } catch (e) { return null; }
}

function atenderRecuperarPedir() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var cfg = leerConfiguracion();
    var usuario = String(cfg.panel_usuario || '').trim();
    var correo = correoDeLaTienda(cfg);
    if (!usuario || !claveDelPanelGuardada()) {
      return { ok: false, error: 'Este panel todavía no tiene usuario y clave. Quien montó la tienda los pone desde el menú de la hoja.' };
    }
    if (!correo) {
      return { ok: false, error: 'La tienda no tiene un correo donde mandar el código (correo_resumen o empresa_correo). ' +
                                 'Pide la clave nueva desde el menú de la hoja: Clave del panel.' };
    }
    var ahora = Date.now();
    var envios = [];
    try { envios = JSON.parse(propiedades().getProperty('PANEL_RECUPERACION_ENVIOS') || '[]'); } catch (e) { envios = []; }
    envios = envios.filter(function (t) { return ahora - Number(t) < 3600000; });
    if (envios.length >= CODIGOS_POR_HORA) {
      return { ok: false, error: 'Ya mandamos ' + CODIGOS_POR_HORA + ' códigos en la última hora. Revisa el correo ' +
                                 tapado(correo) + ' (también el spam) o vuelve a intentar en un rato.' };
    }
    var cifras = '';
    while (cifras.length < 8) cifras += String(parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 8), 16) % 100000000);
    var codigo = cifras.slice(-8);
    while (codigo.length < 8) codigo = '0' + codigo;
    propiedades().setProperty('PANEL_RECUPERACION', JSON.stringify({
      h: huellaDeCodigo(codigo), hasta: ahora + MINUTOS_CODIGO * 60000, intentos: 0 }));
    envios.push(ahora);
    propiedades().setProperty('PANEL_RECUPERACION_ENVIOS', JSON.stringify(envios));
    var negocio = String(cfg.negocio || 'tu tienda');
    MailApp.sendEmail({ to: correo, name: negocio,
      subject: negocio + ' · código para una clave nueva del panel',
      htmlBody: '<p>Alguien pidió una clave nueva para el panel de <strong>' + escaparHtml(negocio) + '</strong>.</p>' +
                '<p style="font-size:22px;letter-spacing:3px"><strong>' + codigo + '</strong></p>' +
                '<p>Vale ' + MINUTOS_CODIGO + ' minutos. Tu usuario del panel es <strong>' + escaparHtml(usuario) + '</strong>.</p>' +
                '<p>Si no fuiste tú, no hagas nada: tu clave sigue siendo la misma mientras nadie use este código.</p>' });
    anotarSeguridad('Panel: pidieron un código para recuperar la clave.', 'enviado a ' + tapado(correo));
    return { ok: true, correo: tapado(correo), minutos: MINUTOS_CODIGO };
  } finally { lock.releaseLock(); }
}

var CODIGO_MALO = 'Ese código no sirve o ya venció. Revisa el correo o pide otro.';
function atenderRecuperarConfirmar(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var bloqueo = estadoDeIntentos();
    if (bloqueo.hasta > Date.now()) {
      return { ok: false, error: 'Demasiados intentos. Prueba de nuevo en ' +
               Math.ceil((bloqueo.hasta - Date.now()) / 60000) + ' minuto(s).' };
    }
    var codigo = String(p.codigo || '').replace(/\D/g, '');
    var r = leerRecuperacion();
    var vale = r && Number(r.hasta) > Date.now() && codigo.length === 8 && huellaDeCodigo(codigo) === r.h;
    if (!vale) {
      anotarIntentoFallido('(recuperación)');
      if (r) {
        r.intentos = (Number(r.intentos) || 0) + 1;
        if (r.intentos >= INTENTOS_POR_CODIGO || !(Number(r.hasta) > Date.now())) propiedades().deleteProperty('PANEL_RECUPERACION');
        else propiedades().setProperty('PANEL_RECUPERACION', JSON.stringify(r));
      }
      return { ok: false, error: CODIGO_MALO };
    }
    propiedades().deleteProperty('PANEL_RECUPERACION');
    var cfg = leerConfiguracion();
    var usuario = String(cfg.panel_usuario || '').trim();
    var nueva = claveInventada();
    guardarClaveDelPanel(nueva);
    limpiarIntentos();
    anotarSeguridad('Panel: clave nueva por recuperación con código.', 'usuario: ' + usuario + '. Las sesiones abiertas se cerraron.');
    anotarCambios('Panel', usuario, [{ que: 'Recuperó la clave del panel con un código del correo', donde: 'Panel',
                                       antes: '', despues: 'clave nueva (no se escribe)' }]);
    return { ok: true, usuario: usuario, clave: nueva };
  } finally { lock.releaseLock(); }
}

/* ══════════════════════════════════════════════════════════════════════════
   0.11.0 · 4.1 · «AVÍSAME CUANDO LLEGUE»
   --------------------------------------------------------------------------
   Lo agotado pierde la venta dos veces: hoy, y el día que vuelve y nadie se
   entera. La forma obvia —pedir el correo o el celular y avisar solos— es
   justo lo que esta tienda no hace: guardar datos de los compradores cambia el
   perfil de riesgo y las obligaciones de la Ley 1581 (ROADMAP, «Lo que NO se
   hace todavía»). Decisión 16.

   LA QUE SÍ: el botón abre WhatsApp con «avísame cuando llegue X» —la
   conversación queda en el celular del comerciante, que es donde ya viven
   todos sus clientes— y la hoja cuenta, SIN NADIE DENTRO, cuántos esperan cada
   producto. Cuando el producto vuelve a tener existencias, el panel y el
   correo del día lo dicen: «3 personas te están esperando; búscalas con
   "avísame"». El comerciante escribe, y lo marca como avisado.
   ══════════════════════════════════════════════════════════════════════════ */
var H_AVISAME = 'Avísame';
var ENCABEZADO_AVISAME = ['ID', 'Producto', 'Personas esperando', 'Desde', 'Último pedido de aviso'];

function avisameEncendido(cfg) { return llano((cfg || leerConfiguracion()).f_avisame) !== 'no'; }

function atenderAvisame(p) {
  var cfg = leerConfiguracion();
  if (!avisameEncendido(cfg)) return { ok: false, error: 'apagado' };
  var id = String(p.id || '').trim();
  var cat = leerCatalogo();
  var prod = cat[id];
  /* Solo lo agotado: un botón que cuenta cualquier cosa se llena de ruido. */
  if (!prod || !(Number(prod.stock) === 0)) return { ok: false, error: 'Ese producto no está agotado.' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var h = hoja(H_AVISAME, ENCABEZADO_AVISAME);
    var filasA = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, 5).getValues() : [];
    var i = -1;
    filasA.forEach(function (f, k) { if (String(f[0]).trim() === id) i = k; });
    var ahora = new Date();
    if (i === -1) {
      h.appendRow([id, celdaSegura(prod.nombre, 120), 1, ahora, ahora]);
      return { ok: true, personas: 1 };
    }
    var n = (Number(filasA[i][2]) || 0) + 1;
    h.getRange(i + 2, 3, 1, 3).setValues([[n, filasA[i][3] || ahora, ahora]]);
    return { ok: true, personas: n };
  } finally { lock.releaseLock(); }
}

function listaDeAvisame() {
  var libro = elLibro();
  var h = libro.getSheetByName(H_AVISAME);
  if (!h || h.getLastRow() < 2) return [];
  var cat = {};
  try { cat = leerCatalogo(); } catch (e) { cat = {}; }
  return h.getRange(2, 1, h.getLastRow() - 1, 5).getValues()
    .filter(function (f) { return String(f[0]).trim() && (Number(f[2]) || 0) > 0; })
    .map(function (f) {
      var id = String(f[0]).trim(), prod = cat[id];
      return { id: id, nombre: prod ? String(prod.nombre) : String(f[1] || id), personas: Number(f[2]) || 0,
               desde: fechaIso(f[3]), hayStock: !!prod && Number(prod.stock) > 0 };
    })
    .sort(function (a, b) { return (b.hayStock - a.hayStock) || (b.personas - a.personas); });
}

function atenderAvisameHecho(p) {
  return conOperacion(p, function () {
    var id = String(p.id || '').trim();
    var h = elLibro().getSheetByName(H_AVISAME);
    if (!h || h.getLastRow() < 2) return { ok: false, error: 'No hay nadie esperando ese producto.' };
    var filasA = h.getRange(2, 1, h.getLastRow() - 1, 5).getValues();
    var i = -1;
    filasA.forEach(function (f, k) { if (String(f[0]).trim() === id) i = k; });
    if (i === -1) return { ok: false, error: 'No hay nadie esperando ese producto.' };
    var n = Number(filasA[i][2]) || 0;
    h.deleteRows(i + 2, 1);
    return { ok: true, id: id,
             _registro: [{ que: 'Avisó que llegó el producto', donde: 'Avísame · ' + id,
                           antes: varios(n, 'persona esperando', 'personas esperando'), despues: 'avisadas' }] };
  });
}

var H_REGISTRO = 'Registro';
var ENCABEZADO_REGISTRO = ['Fecha', 'Desde', 'Quién', 'Qué se hizo', 'Dónde', 'Antes', 'Después'];
/* Una hoja de cálculo no es una base de datos. Pasado esto, se deja de anotar
   y se avisa una vez en Errores: hay que archivar la pestaña. */
var MAX_FILAS_REGISTRO = 20000;

function anotarCambios(desde, quien, filasNuevas) {
  try {
    var lista = (filasNuevas || []).filter(function (x) { return x; });
    if (!lista.length) return 0;
    var h = hoja(H_REGISTRO, ENCABEZADO_REGISTRO);
    if (h.getLastRow() + lista.length > MAX_FILAS_REGISTRO) {
      anotarError('El Registro está lleno', 'Tiene ' + h.getLastRow() + ' filas. Cópialo a otro archivo y vacíalo para que siga anotando.');
      return 0;
    }
    var ahora = new Date();
    var valores = lista.map(function (x) {
      return [ahora, celdaSegura(desde, 20), celdaSegura(quien || '', 80), celdaSegura(x.que, 120),
              celdaSegura(x.donde, 120), celdaSegura(x.antes, 500), celdaSegura(x.despues, 500)];
    });
    h.getRange(h.getLastRow() + 1, 1, valores.length, ENCABEZADO_REGISTRO.length).setValues(valores);
    return valores.length;
  } catch (err) {
    try { registrarError('Registro: ' + err.message, null); } catch (x) {}
    return 0;
  }
}

/* Las pestañas cuyas ediciones a mano importan. Los resultados que escribe el
   propio script (Más vendidos, Tablero, Validaciones) no: esos se recalculan. */
function hojasQueSeRegistran() {
  return [H_CATALOGO, H_CONFIG, H_ENVIOS, H_CUPONES, H_PEDIDOS, H_REGISTRO, 'Pagos', 'Datos de entrega',
          H_INVENTARIO_VARIANTE];
}

function anotarEdicionDeHoja(e) {
  try {
    var h = e.range.getSheet(), nombre = h.getName();
    if (hojasQueSeRegistran().indexOf(nombre) === -1) return;
    var a1 = typeof e.range.getA1Notation === 'function' ? e.range.getA1Notation() : '';
    var varias = typeof e.range.getNumRows === 'function' &&
                 (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1);
    /* De qué fila se trata, en palabras: el producto, la clave, el pedido. */
    var fila = typeof e.range.getRow === 'function' ? e.range.getRow() : 0;
    var cual = '';
    if (fila > 1 && nombre !== H_REGISTRO) {
      try { cual = String(h.getRange(fila, nombre === H_PEDIDOS ? 2 : 1).getValue() || ''); } catch (x) {}
    }
    var quien = '';
    try { quien = e.user && e.user.getEmail ? e.user.getEmail() : ''; } catch (x) {}
    anotarCambios('Hoja', quien, [{
      que: nombre === H_REGISTRO ? 'EDITÓ EL REGISTRO A MANO'
         : varias ? 'Editó varias celdas' : 'Editó una celda',
      donde: nombre + (a1 ? ' ' + a1 : '') + (cual ? ' · ' + (nombre === H_PEDIDOS ? '#' : '') + cual : ''),
      antes: varias ? '' : (e.oldValue === undefined ? '' : String(e.oldValue)),
      despues: varias ? '(varias celdas)' : (e.value === undefined ? '' : String(e.value))
    }]);
  } catch (err) { /* anotar nunca tumba la edición */ }
}

/* Lo que se ve de un producto en una línea, para Antes / Después. */
function resumenDeFila(f) {
  return [String(f[1] || ''), f[4] !== '' && f[4] !== undefined ? '$' + f[4] : '',
          'Stock ' + (f[5] === '' || f[5] === undefined ? '—' : f[5]),
          esSi(f[9]) ? 'activo' : 'inactivo'].filter(function (x) { return x; }).join(' · ');
}

function diferenciaDeFilas(antes, despues) {
  var r = { antes: [], despues: [] };
  ENCABEZADO_CATALOGO.forEach(function (col, i) {
    var a = String(antes[i] === undefined || antes[i] === null ? '' : antes[i]);
    var d = String(despues[i] === undefined || despues[i] === null ? '' : despues[i]);
    if (a === d) return;
    r.antes.push(col + ': ' + (a || '(vacío)'));
    r.despues.push(col + ': ' + (d || '(vacío)'));
  });
  return r;
}

function protegerRegistro() {
  try {
    var h = hoja(H_REGISTRO, ENCABEZADO_REGISTRO);
    var ya = h.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (ya && ya.length) return;
    h.protect().setDescription('Registro de cambios: solo lo escribe el script')
     .setWarningOnly(true);
  } catch (err) { /* sin permiso para proteger: la pestaña sirve igual */ }
}

/* ══════════════════════════════════════════════════════════════════════════
   C-1b · EL INVENTARIO POR COMBINACIÓN
   --------------------------------------------------------------------------
   Con el stock en el producto, vender la última camiseta rosa M dejaba la
   tienda ofreciendo rosas M que no existen —o marcaba agotada la camiseta
   entera cuando solo se acabó un color—. La pestaña `Inventario por variante`
   lleva una fila por combinación:

       ID producto · Combinación              · Stock · Código · Nota
       camiseta    · Talla: M · Color: Rosa   ·   3   · CB-MR  ·

   LAS FILAS LAS ESCRIBE EL MAESTRO. Al llenar `Variantes` en Catálogo,
   `sincronizarVariantes()` agrega una fila por combinación con el stock VACÍO;
   el comerciante solo pone los números. Escribir la combinación a mano seis
   veces es la forma segura de que una no case. Las filas que dejan de casar
   (se cambió una talla) NO se borran: llevan un stock que alguien contó. Se
   marcan en Nota y dejan de contar.

   COMPATIBILIDAD, QUE ES LA REGLA QUE MANDA. Un producto pasa a inventario por
   combinación solo cuando AL MENOS UNA de sus filas tiene un número en Stock.
   Mientras todas estén vacías —acaban de generarse, nadie las llenó— el
   producto se vende exactamente como antes, con el stock de Catálogo. Nadie
   tiene que migrar nada el día que esto se publica, y generar las filas no
   agota la tienda.

   Y una vez activo, `Catálogo › Stock` pasa a ser LA SUMA, escrita por el
   maestro: una sola mano la escribe, así que no se separa de sus partes, y
   todo lo que ya leía Stock —el tablero, «pocas unidades», los agotados, el
   correo— sigue funcionando sin tocarlo.
   ══════════════════════════════════════════════════════════════════════════ */
var H_INVENTARIO_VARIANTE = 'Inventario por variante';
var ENCABEZADO_INVENTARIO_VARIANTE = ['ID producto', 'Combinación', 'Stock', 'Código', 'Nota'];
var NOTA_NO_CASA = 'Ya no está en Variantes: no cuenta';

/* Todas las combinaciones de los grupos, en el orden del catálogo y con el
   mismo texto que escribe variantePedida(): «Talla: M · Color: Rosa». */
function combinacionesDe(grupos) {
  var r = [[]];
  (grupos || []).forEach(function (g) {
    var nuevo = [];
    r.forEach(function (pref) {
      g.opciones.forEach(function (o) { nuevo.push(pref.concat([g.nombre + ': ' + o])); });
    });
    r = nuevo;
  });
  if (!(grupos || []).length) return [];
  return r.map(function (partes) { return partes.join(' · '); });
}

function cuantasCombinaciones(grupos) {
  return (grupos || []).reduce(function (n, g) { return n * g.opciones.length; }, (grupos || []).length ? 1 : 0);
}

/* id → { filas: [{clave, texto, stock (número|null|''), fila}] } */
function leerInventarioVariante() {
  var r = {};
  var h = elLibro().getSheetByName(H_INVENTARIO_VARIANTE);
  if (!h || h.getLastRow() < 2) return r;
  h.getRange(2, 1, h.getLastRow() - 1, ENCABEZADO_INVENTARIO_VARIANTE.length).getValues()
   .forEach(function (f, i) {
     var id = String(f[0]).trim(), texto = String(f[1]).trim();
     if (!id || !texto) return;
     if (!r[id]) r[id] = [];
     r[id].push({ clave: llano(texto), texto: texto, crudo: f[2], fila: i + 2 });
   });
  return r;
}

/* Las existencias por combinación de UN producto, o null si no lleva
   inventario por combinación (sin variantes, sin filas, o todas vacías).
   Una celda ilegible no vale cero ni se inventa: esa combinación no se
   vende —cuenta 0— y queda anotada, como cualquier cifra de la hoja. */
function skusDe(grupos, filasInv, donde) {
  if (!grupos || !grupos.length || !filasInv || !filasInv.length) return null;
  if (cuantasCombinaciones(grupos) > MAX_COMBINACIONES) return null;
  var validas = {};
  combinacionesDe(grupos).forEach(function (t) { validas[llano(t)] = t; });
  var alguna = filasInv.some(function (x) {
    return validas[x.clave] !== undefined && String(x.crudo === null || x.crudo === undefined ? '' : x.crudo).trim() !== '';
  });
  if (!alguna) return null;
  var porClave = {}, lista = [], suma = 0;
  Object.keys(validas).forEach(function (k) { porClave[k] = 0; });
  filasInv.forEach(function (x) {
    if (validas[x.clave] === undefined) return;
    var n = cifra(x.crudo, donde + ' fila ' + x.fila);
    porClave[x.clave] = n === null ? 0 : Math.max(0, Math.floor(n));
  });
  Object.keys(validas).forEach(function (k) {
    lista.push({ eleccion: validas[k], stock: porClave[k] });
    suma += porClave[k];
  });
  return { porClave: porClave, lista: lista, suma: suma };
}

/* ── Escribir las filas que faltan, marcar las que ya no casan, y la suma ──
   Idempotente: correrlo dos veces no agrega nada la segunda. Se llama al
   instalar, al editar Variantes o esta pestaña, al guardar un producto desde
   el panel y desde «Actualizar tablero e inventario». */
function sincronizarVariantes() {
  var libro = elLibro();
  var hc = libro.getSheetByName(H_CATALOGO);
  if (!hc || hc.getLastRow() < 2) return { nuevas: 0, marcadas: 0 };
  var cat = hc.getRange(2, 1, hc.getLastRow() - 1, ENCABEZADO_CATALOGO.length).getValues();
  var hi = hoja(H_INVENTARIO_VARIANTE, ENCABEZADO_INVENTARIO_VARIANTE);
  var inv = leerInventarioVariante();
  var nuevas = [], marcadas = 0, grandes = [];
  var validasPorId = {};

  cat.forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (!id) return;
    var grupos = variantesDeCelda(f[13], 'Catálogo N' + (i + 2));
    if (!grupos.length) return;
    var n = cuantasCombinaciones(grupos);
    if (n > MAX_COMBINACIONES) { grandes.push(id + ' (' + n + ')'); return; }
    var ya = {};
    (inv[id] || []).forEach(function (x) { ya[x.clave] = true; });
    validasPorId[id] = {};
    combinacionesDe(grupos).forEach(function (t) {
      validasPorId[id][llano(t)] = true;
      if (!ya[llano(t)]) nuevas.push([id, t, '', '', '']);
    });
  });
  if (grandes.length) {
    anotarError('Demasiadas combinaciones para el inventario por variante',
                grandes.join(', ') + ': el tope es ' + MAX_COMBINACIONES + '. No se generaron filas; esos productos siguen con el stock de Catálogo.');
  }

  /* Las que ya no casan se marcan (y las que vuelven a casar se desmarcan). */
  var notas = [], cambiaNota = false;
  Object.keys(inv).forEach(function (id) {
    inv[id].forEach(function (x) {
      var casa = validasPorId[id] && validasPorId[id][x.clave];
      notas.push({ fila: x.fila, casa: !!casa });
    });
  });
  if (notas.length) {
    var col = hi.getRange(2, 5, hi.getLastRow() - 1, 1).getValues();
    notas.forEach(function (x) {
      var actual = String(col[x.fila - 2][0] || '');
      if (!x.casa && actual !== NOTA_NO_CASA) { col[x.fila - 2][0] = NOTA_NO_CASA; marcadas++; cambiaNota = true; }
      if (x.casa && actual === NOTA_NO_CASA) { col[x.fila - 2][0] = ''; cambiaNota = true; }
    });
    if (cambiaNota) hi.getRange(2, 5, col.length, 1).setValues(col);
  }
  if (nuevas.length) hi.getRange(hi.getLastRow() + 1, 1, nuevas.length, ENCABEZADO_INVENTARIO_VARIANTE.length).setValues(nuevas);

  escribirSumas();
  CacheService.getScriptCache().remove('catalogo');
  return { nuevas: nuevas.length, marcadas: marcadas };
}

/* Catálogo › Stock = la suma de sus combinaciones, para los productos que
   llevan inventario por combinación. Solo se escribe lo que cambió. */
function escribirSumas() {
  var hc = elLibro().getSheetByName(H_CATALOGO);
  if (!hc || hc.getLastRow() < 2) return 0;
  var cat = hc.getRange(2, 1, hc.getLastRow() - 1, ENCABEZADO_CATALOGO.length).getValues();
  var inv = leerInventarioVariante();
  var col = cat.map(function (f) { return [f[COL_STOCK - 1]]; });
  var cambios = 0;
  var guardadas = CELDAS_ILEGIBLES; CELDAS_ILEGIBLES = [];
  cat.forEach(function (f, i) {
    var id = String(f[0]).trim();
    var s = skusDe(variantesDeCelda(f[13], ''), inv[id], '');
    if (!s) return;
    if (Number(col[i][0]) !== s.suma || col[i][0] === '') { col[i][0] = s.suma; cambios++; }
  });
  CELDAS_ILEGIBLES = guardadas;
  if (cambios) hc.getRange(2, COL_STOCK, col.length, 1).setValues(col);
  return cambios;
}

/* ── Pagado descuenta LA COMBINACIÓN, y solo esa ─────────────────────────
   Lo llama aplicarInventario() para las líneas de productos con inventario
   por combinación. Devuelve la marca para la columna Inventario, o null si la
   línea no es de ese tipo (y entonces sigue el camino de siempre). */
function moverCombinacion(ctx, id, variante, cant, vender) {
  var prod = ctx.skus[id];
  if (!prod) return null;
  var clave = llano(variante);
  var fila = ctx.filaInv[id + '\u0000' + clave];
  if (!variante || !fila) return 'sin-fila';
  var i = fila - 2;
  var actual = cifra(ctx.inv[i][2], '');
  if (actual === null) return 'ilegible';
  ctx.inv[i][2] = vender ? Math.max(0, (actual || 0) - cant) : (actual || 0) + cant;
  ctx.cambioInv = true;
  return vender ? 'Descontado' : 'Devuelto';
}

function contextoCombinaciones() {
  var libro = elLibro();
  var hi = libro.getSheetByName(H_INVENTARIO_VARIANTE);
  var ctx = { skus: {}, filaInv: {}, inv: [], hi: hi, cambioInv: false };
  if (!hi || hi.getLastRow() < 2) return ctx;
  ctx.inv = hi.getRange(2, 1, hi.getLastRow() - 1, ENCABEZADO_INVENTARIO_VARIANTE.length).getValues();
  var guardadas = CELDAS_ILEGIBLES; CELDAS_ILEGIBLES = [];
  var cat = leerCatalogo();
  CELDAS_ILEGIBLES = guardadas;
  Object.keys(cat).forEach(function (id) { if (cat[id].skus) ctx.skus[id] = true; });
  ctx.inv.forEach(function (f, i) {
    var id = String(f[0]).trim();
    if (ctx.skus[id]) ctx.filaInv[id + '\u0000' + llano(f[1])] = i + 2;
  });
  return ctx;
}

/* ── Las fotos: 6 generales y 4 por opción, y EL NOMBRE ES EL DATO ──────
   Una foto del color rosa se llama `camiseta-basica--color-rosa-1.jpg`:
   código, doble guion, grupo, opción y número. De qué opción es una foto se
   lee de su nombre, así que no hay tabla que mantener. */
function fotosConTope(lista) {
  var generales = [], porOpcion = {}, salida = [];
  lista.forEach(function (n) {
    var m = String(n).match(/--([a-z0-9]+(?:-[a-z0-9]+)*?)-(\d+)\.[a-z0-9]+$/i);
    if (!m) { if (generales.length < 6) { generales.push(n); salida.push(n); } return; }
    var clave = m[1].toLowerCase();
    porOpcion[clave] = (porOpcion[clave] || 0) + 1;
    if (porOpcion[clave] <= 4) salida.push(n);
  });
  return salida;
}

/* El trozo de nombre de una opción: «Color» + «Rosa claro» → color-rosa-claro */
function trozoDeOpcion(grupo, opcion) {
  var limpio = function (t) {
    return llano(t).replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };
  return limpio(grupo) + '-' + limpio(opcion);
}

function combinacionValida(celdaVariantes, clave) {
  return combinacionesDe(variantesDeCelda(celdaVariantes, '')).some(function (t) { return llano(t) === clave; });
}

/* ── Editar el stock de cada combinación desde el panel ─────────────────
   Pide op, id, cambios {combinación: número} y versiones {combinación:
   huella}. Todo o nada, como la configuración: si un número no se entiende o
   una fila cambió en la hoja entre medias, no se escribe ninguno. Vacío es
   válido —«todavía no lo cuento»—; un número que no es número, no. */
function atenderGuardarCombinaciones(p) {
  return conOperacion(p, function () {
    var id = String(p.id || '').trim();
    var cambios = p.cambios || {}, versiones = p.versiones || {};
    var guardadas = CELDAS_ILEGIBLES; CELDAS_ILEGIBLES = [];
    var inv = leerInventarioVariante();
    CELDAS_ILEGIBLES = guardadas;
    var filasDe = {};
    (inv[id] || []).forEach(function (x) { filasDe[x.clave] = x; });
    var errores = {}, aEscribir = [];
    Object.keys(cambios).forEach(function (combo) {
      var x = filasDe[llano(combo)];
      if (!x) { errores[combo] = 'Esa combinación no está en el inventario de este producto.'; return; }
      if (String(versiones[combo] || '') !== versionDeValor(x.crudo)) {
        errores[combo] = 'Cambió en la hoja mientras la editabas. Vuelve a abrir el producto.'; return;
      }
      var v = String(cambios[combo] === null || cambios[combo] === undefined ? '' : cambios[combo]).trim();
      if (v !== '' && !/^\d{1,6}$/.test(v)) { errores[combo] = 'Tiene que ser un número entero, o quedar vacío.'; return; }
      aEscribir.push({ fila: x.fila, combo: x.texto, antes: String(x.crudo === null || x.crudo === undefined ? '' : x.crudo),
                       valor: v === '' ? '' : Number(v) });
    });
    if (Object.keys(errores).length) {
      return { ok: false, errores: errores, error: 'No se guardó nada: hay ' + Object.keys(errores).length + ' valor(es) por corregir.' };
    }
    var hi = hoja(H_INVENTARIO_VARIANTE, ENCABEZADO_INVENTARIO_VARIANTE);
    aEscribir.forEach(function (w) { hi.getRange(w.fila, 3).setValue(w.valor); });
    escribirSumas();
    CacheService.getScriptCache().remove('catalogo');
    return { ok: true, guardadas: aEscribir.length,
             _registro: aEscribir.filter(function (w) { return String(w.valor) !== w.antes; }).map(function (w) {
               return { que: 'Cambió el stock de una combinación', donde: H_INVENTARIO_VARIANTE + ' · ' + id + ' · ' + w.combo,
                        antes: w.antes, despues: String(w.valor) };
             }) };
  }, true);
}
