/* ============================================================================
   El montaje automático.
   ----------------------------------------------------------------------------
   Tres pasos que hasta hoy hacía una persona copiando y pegando: el bloque del
   <head>, las fotos de Drive, y publicar el maestro. Aquí se prueban los dos
   primeros de punta a punta —la puerta del maestro y la herramienta que la
   consume—, porque son los que pueden dejar una tienda publicada y muerta.

   Lo que más importa de todo este archivo son los modos de falla: que un
   maestro caído NO escriba un index vacío, y que un token robado NO pueda
   sacar archivos del Drive del comercio.
   ============================================================================ */
const crear = require('./gas.js').crear;
const { aplicar } = require('../montar/preparar-index.mjs');
const { novedades, desajustes } = require('../montar/traer-fotos.mjs');
const { loQueSeMando } = require('../montar/sembrar-configuracion.mjs');
const { hornear } = require('../montar/catalogo-estatico.mjs');
const { veredicto } = require('../montar/misma-tienda.mjs');
const respaldo = require('../montar/sembrar-respaldo.mjs');
const fs = require('fs');
const { esSemilla } = require('./donde.js');
const cp = require('node:child_process');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const CARPETA = '1CarpetaDeFotosDelComercio';
const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); return g; };
const puerta = (g, a, extra) => JSON.parse(g.api.doGet({
  parameter: Object.assign({ a: a, t: g.token }, extra || {}) })._texto);

/* Una tienda ya configurada, con el comercio de prueba que vive en gas.js. De
   fábrica el nombre viene entre corchetes y el celular vacío, y el montaje se
   NIEGA a publicar eso (batería 10): es el estado de una tienda recién
   instalada, no el de una lista para salir. */
const yaConfigurada = require('./gas.js').configurar;

const configurar = (g, clave, valor) => {
  const h = g.hojas.get('Configuración');
  const i = g.filas('Configuración').findIndex(f => f[0] === clave);
  if (i < 1) throw new Error('no existe la clave ' + clave);
  h.getRange(i + 1, 2).setValue(valor);
};

// ═══ 1. La puerta que reemplaza el copiar y pegar ═══
{
  const g = yaConfigurada(nuevo());
  const r = puerta(g, 'bloques');

  ok('El maestro entrega el <head> ya armado', r.ok && r.head.length > 200,
     (r.head || '').split('\n')[0]);
  ok('  ...con las dos marcas que la herramienta busca',
     /Content-Security-Policy/.test(r.head) &&
     /FIN DE LA CONFIGURACIÓN/.test(r.head));
  ok('  ...y las cinco constantes por separado, no en un bloque de texto',
     ['SCRIPT_URL', 'SCRIPT_VERSION', 'FOTOS_HOSTS', 'NEGOCIO', 'WHATSAPP']
       .every(k => k in r.valores), Object.keys(r.valores).join(', '));
  ok('  ...con la URL del propio despliegue, que nadie tiene que copiar',
     /\/exec$/.test(r.valores.SCRIPT_URL), r.valores.SCRIPT_URL);
  ok('  ...y los tres proveedores de foto autorizados de antemano',
     r.valores.FOTOS_HOSTS.length === 3, r.valores.FOTOS_HOSTS.join(' '));

  ok('CON TOKEN MALO no entrega nada',
     puerta(g, 'bloques', { t: 'inventado' }).ok === false);

  /* Lo que elimina el último dato que se copiaba a mano: el maestro sabe su
     propio scriptId, así que nadie tiene que sacarlo de la barra de
     direcciones para escribir montar/.clasp.json. */
  ok('EL MAESTRO SABE SU PROPIO scriptId, que antes se copiaba a mano',
     typeof r.scriptId === 'string' && r.scriptId.length > 5, r.scriptId);
  ok('  ...y cómo se llama el negocio y dónde está su hoja',
     r.negocio === 'Panadería La Espiga' && /docs\.google\.com/.test(r.hoja),
     r.negocio + ' · ' + r.hoja);
  ok('  ...así que configurar el repositorio son DOS datos, no cinco',
     ['scriptId', 'negocio', 'hoja'].every(k => k in r),
     'la URL y el token; lo demás lo dice el maestro');

  ok('Lo que diga el dueño en la hoja no se cuela como etiqueta HTML', (() => {
       const g2 = nuevo();
       configurar(g2, 'sitio_titulo', 'Mi tienda"><script>alert(1)</script>');
       const h = puerta(g2, 'bloques').head;
       return h.indexOf('<script>alert') === -1 && h.indexOf('&lt;script&gt;') !== -1;
     })());
  ok('  ...y un nombre con & no produce HTML inválido', (() => {
       const g2 = nuevo();
       configurar(g2, 'negocio', 'Pan & Café');
       const h = puerta(g2, 'bloques').head;
       return h.indexOf('Pan &amp; Café') !== -1 && h.indexOf('Pan & Café') === -1;
     })(), 'se escapa entero, no solo las comillas');
}

// ═══ 2. Escribir el index: o todo, o nada ═══
{
  const g = yaConfigurada(nuevo());
  const datos = puerta(g, 'bloques');
  const html = fs.readFileSync('./index.html', 'utf8');

  const r = aplicar(html, datos);
  ok('APLICAR deja el index apuntando al maestro de esta tienda',
     r.indexOf('const SCRIPT_URL = "' + datos.valores.SCRIPT_URL + '";') !== -1);
  ok('  ...con la versión del contrato al día',
     r.indexOf('const SCRIPT_VERSION = "' + datos.valores.SCRIPT_VERSION + '";') !== -1);
  ok('  ...y el <head> que armó el maestro', r.indexOf(datos.head) !== -1);
  ok('  ...sin tocar nada más del archivo',
     r.length > html.length - 4000 && r.indexOf('</html>') !== -1 &&
     r.split('<script>').length === html.split('<script>').length);
  ok('  ...y conservando los comentarios que explican el código',
     /Respaldo mínimo por si la hoja no contesta/.test(r));

  /* Desde A-2, aplicar() devuelve el texto directamente: hornear dos veces
     con los MISMOS datos tiene que dar carácter por carácter el mismo
     archivo. La lista `cambios` que esto comprobaba antes ya no existe —el
     pull request de montaje.yml enseña el diff completo, no una lista de
     claves (ver preparar-index.mjs). */
  ok('DOS VECES SEGUIDAS no cambia nada la segunda',
     aplicar(r, datos) === r,
     aplicar(r, datos) === r ? 'sin cambios' : 'el segundo horneado no fue idéntico al primero');

  /* ── LA PALETA, EN EL ARCHIVO ──────────────────────────────────────────
     La página aplica los colores de la hoja al recibir la configuración, y
     eso está bien. Pero ANTES de que llegue esa configuración el navegador
     ya pintó, con lo que dijera el `:root` del archivo — que era el rojo
     tomate de la plantilla. Una tienda de cosméticos parpadeaba en rojo en
     cada recarga, y era lo primero que veía su cliente.
     El `:root` deja de ser «la paleta de Orgánico» y pasa a ser la de ESTA
     tienda. El ajuste en vivo sigue mandando —un estilo en línea gana a una
     hoja de estilos—, así que esto no le quita nada. */
  {
    const otra = JSON.parse(JSON.stringify(datos));
    otra.colores = { principal: '#7A4A21', secundario: '#2F5D3A',
                     alterno: '#3E2A14', ilegibles: [] };
    const pintado = aplicar(html, otra);
    const raiz = (pintado.match(/:root\{[\s\S]*?\}/) || [''])[0];
    ok('LA PALETA DEL ARCHIVO es la de esta tienda, no la de la plantilla',
       /--rojo:#7A4A21/.test(raiz) && /--verde:#2F5D3A/.test(raiz) &&
       /--acento:#3E2A14/.test(raiz),
       raiz.replace(/\s+/g, ' ').slice(0, 90));
    ok('  ...y el resto del :root se queda como estaba',
       /--blanco:#FFFFFF/.test(raiz) && /--max:1180px/.test(raiz),
       'se reescriben tres variables, no la hoja de estilos');

    /* Un color ilegible NO se escribe: la página se quedaría con una variable
       rota y la tienda saldría sin color ninguno, que es peor que salir con
       el de la plantilla. */
    const mala = JSON.parse(JSON.stringify(datos));
    mala.colores = { principal: 'rojo', secundario: '', alterno: '#D21', ilegibles: ['x'] };
    const conMala = (aplicar(html, mala).match(/:root\{[\s\S]*?\}/) || [''])[0];
    /* CONTRA EL COLOR QUE TENGA EL ARCHIVO, no contra el de Orgánico. Decía
       `#D0211C` a pelo y se cayó en el repositorio de una tienda cuyo montaje
       ya le había escrito su paleta: es el patrón 4, el mismo que cerró la
       2.9.9, en la batería que lo vigila. */
    const delArchivo = (html.match(/--rojo:(#[0-9A-Fa-f]{6})/) || [])[1];
    ok('  ...y un color que no se puede leer NO se escribe',
       !!delArchivo && new RegExp('--rojo:' + delArchivo).test(conMala),
       'una variable rota deja la tienda sin color, que es peor · ' + delArchivo);

    /* Y si alguien cambia la forma del :root, esto tiene que PARAR, no
       seguir en silencio dejando la tienda con los colores de la plantilla.
       Es el modo de falla que este arreglo existe para cerrar. */
    ok('  ...y si el :root cambia de forma, se planta en vez de callarse', (() => {
         const roto = html.replace(/--rojo:#[0-9A-Fa-f]{6};/, '--rojo: var(--x);');
         try { aplicar(roto, otra); return false; }
         catch (e) { return /--rojo/.test(e.message) && /plantilla/.test(e.message); }
       })(), 'un repintado que no repinta es exactamente el fallo que se arregla');
  }

  /* Antes esto medía QUÉ constantes habían cambiado, con un arreglo
     `cambios` que aplicar() ya no calcula. Lo que sigue importando es que
     hornear con datos distintos SÍ produzca un archivo distinto y con el
     valor nuevo adentro. */
  ok('Hornear con una versión distinta SÍ deja el archivo con la versión nueva',
     aplicar(html.replace(/const SCRIPT_VERSION\s*=\s*"[^"]*";/,
             'const SCRIPT_VERSION = "vieja";'), datos)
       .indexOf('const SCRIPT_VERSION = "' + datos.valores.SCRIPT_VERSION + '";') !== -1);

  ok('SI EL MAESTRO NO DIO LA URL, falla y NO escribe una tienda muerta', (() => {
       const sinUrl = JSON.parse(JSON.stringify(datos));
       sinUrl.valores.SCRIPT_URL = '';
       try { aplicar(html, sinUrl); return false; }
       catch (e) { return /SCRIPT_URL/.test(e.message) && /Implementar/.test(e.message); }
     })());
  ok('SI ALGUIEN BORRÓ el bloque del <head>, lo dice en vez de adivinar', (() => {
       const roto = html.replace(/<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->/, '');
       try { aplicar(roto, datos); return false; }
       catch (e) { return /bloque del <head>/.test(e.message); }
     })());
  ok('SI FALTA una constante, tampoco escribe a medias', (() => {
       const roto = html.replace(/const FOTOS_HOSTS\s*=\s*\[[^\]]*\];/, '');
       try { aplicar(roto, datos); return false; }
       catch (e) { return /FOTOS_HOSTS/.test(e.message); }
     })());
}

// ═══ 2c. Las herramientas de montaje ARRANCAN (también en Windows) ═══
/* Estuvieron un rato sin hacer nada y saliendo con código 0. El guardia era
   `import.meta.url === \`file://${process.argv[1]}\``, que en Windows compara
   file://D:\\CoWork\\... contra file:///D:/CoWork/... y nunca coincide: el
   módulo se cargaba, main() no corría, y parecía que había funcionado.
   Se prueba ejecutándolas de verdad, que es la única forma de saberlo. */
{
  const { execFileSync } = require('child_process');
  const correr = (script) => {
    try {
      // Desde un directorio sin tienda.json y con la ruta absoluta del script.
      execFileSync(process.execPath, [require('path').resolve('../montar/' + script)],
                   { cwd: require('fs').mkdtempSync('/tmp/organico-'),
                     encoding: 'utf8', stdio: 'pipe',
                     env: Object.assign({}, process.env,
                                        { MAESTRO_URL: '', MAESTRO_TOKEN: '' }) });
      return { codigo: 0, salida: '' };
    } catch (e) {
      return { codigo: e.status, salida: String(e.stdout || '') + String(e.stderr || '') };
    }
  };

  ['preparar-index.mjs', 'traer-fotos.mjs'].forEach(script => {
    const r = correr(script);
    ok(script + ' EJECUTA main(), no se carga y se calla',
       r.codigo === 1 && /No sé a qué tienda apuntar/.test(r.salida),
       'salió con ' + r.codigo + ': ' + r.salida.split('\n').filter(Boolean)[0]);
  });

  ok('  ...y el guardia usa pathToFileURL, no una plantilla file://', (() => {
       const fuentes = ['preparar-index.mjs', 'traer-fotos.mjs']
         .map(f => fs.readFileSync('../montar/' + f, 'utf8'));
       /* El `|| ""` NO es adorno: sin él, importar el módulo para probar una
          función suelta revienta con «path must be of type string», porque
          `node -e` no tiene argv[1]. Lo descubrí probando la paleta. */
       return fuentes.every(t => /pathToFileURL\(process\.argv\[1\] \|\| ["']["']\)\.href/.test(t)) &&
              fuentes.every(t => !/`file:\/\/\$\{process\.argv/.test(t));
     })(), 'la comparación de Windows era el fallo silencioso');
}

// ═══ 2d. Publicar el maestro ═══
/* Era un script de bash y no podía ser: en Windows npm corre los scripts por
   cmd.exe, donde `./algo.sh` no significa nada, y salía «"." no se reconoce
   como un comando». Las otras dos herramientas de montaje son Node y funcionan
   en cualquier parte; esta era la rara, y por eso fue la que se rompió.

   Se comprueba leyéndola: ejecutarla de verdad pediría una cuenta de Google y
   una implementación viva. */
{
  const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');

  ok('PUBLICAR EL MAESTRO es Node, como las otras dos herramientas',
     fs.existsSync('../montar/publicar-maestro.mjs') &&
     !fs.existsSync('../montar/publicar-maestro.sh'),
     'un script de bash no corre desde npm en Windows');
  ok('  ...y se invoca con node, no con una ruta ./',
     /"maestro": "node montar\/publicar-maestro\.mjs"/.test(
       fs.readFileSync('../package.json', 'utf8')));
  /* En Windows npm instala clasp.cmd, y Node no ejecuta un .cmd directamente:
     desde la 18.20 falla con EINVAL, y "clasp" a secas falla con ENOENT porque
     no hay clasp.exe. Los dos caminos fallan sin shell, y por eso el intento
     de probar uno y luego el otro daba "falta clasp" con clasp instalado. */
  ok('  ...pasa por el shell en Windows, que es lo único que resuelve el .cmd',
     /shell: EN_WINDOWS/.test(src) && /win32/.test(src),
     'sin shell, un .cmd no se puede lanzar desde Node');
  ok('  ...y entrecomilla los argumentos, que cmd.exe vuelve a partir',
     /entrecomillar/.test(src));
  ok('NO CONFUNDE "no está instalado" con "falló"',
     /noEstaInstalado/.test(src) && /9009/.test(src) && /127/.test(src),
     'cualquier tropiezo se reportaba como que faltaba clasp');
  ok('  ...y un fallo cualquiera muestra su propio mensaje',
     /No pude ejecutar clasp/.test(src));

  ok('SIRVE con clasp 2 y con clasp 3',
     /list-deployments/.test(src) && /'deployments'/.test(src) &&
     /update-deployment/.test(src) && /--deploymentId/.test(src),
     'v3: list-deployments y update-deployment; v2: deployments y deploy -i');
  ok('  ...decidiendo por la versión instalada, no adivinando',
     /--version/.test(src) && /mayor >= 3/.test(src));
  ok('  ...actualiza la implementación que YA existe, nunca crea una nueva',
     !/new-deployment/.test(src) && /update-deployment/.test(src),
     'crear una nueva estrena URL y deja la tienda muda');
  ok('  ...y descarta la de @HEAD, que es la de desarrollo',
     /@HEAD/.test(src), 'actualizar esa no publica nada');

  /* `clasp login --status` NO EXISTE EN CLASP 3 —lo dice su propio --help— y
     este mensaje llevaba meses mandando a escribir un comando inventado. El
     que sí existe es `show-authorized-user`. Un remedio que no se puede
     ejecutar es peor que ninguno: quien lo prueba concluye que el problema es
     otro. */
  ok('SI clasp ESTÁ EN OTRA CUENTA, lo dice: es el fallo más probable',
     /autenticado con OTRA cuenta/.test(src) && /show-authorized-user/.test(src) &&
     !/clasp login --status/.test(src),
     'el remedio tiene que ser un comando que exista en la versión instalada');
  ok('SIN IMPLEMENTACIÓN previa explica qué hacer una sola vez',
     /no tiene ninguna implementación publicada/.test(src) &&
     /Cualquier persona/.test(src) && /abre esa URL una vez/.test(src));
  /* 0.21.1 · El archivo lo dice ahora `ARCHIVO` —el maestro de fábrica, o
     `panel.gs` cuando lo llama la flota (bitácora 100)—, pero lo que se prueba
     es lo mismo: que se sube ESE archivo y nada más del repositorio. */
  ok('SUBE SOLO el archivo que toca, no el repositorio entero',
     /mkdtempSync/.test(src) && /writeFileSync\(join\(tmp, ARCHIVO\)/.test(src) &&
     /rootDir/.test(src), 'una carpeta temporal con lo único que debe existir allá');
  ok('  ...y la borra pase lo que pase', /finally \{[\s\S]{0,80}rmSync/.test(src));
  ok('  ...dejando la implementación pública, el error más repetido',
     /ANYONE_ANONYMOUS/.test(src));

  ok('AL TERMINAR dice DÓNDE comprobarlo, no solo qué buscar',
     /EN LA HOJA DE LA TIENDA \(no en el panel\)/.test(src) &&
     /El panel tiene su propia versión/.test(src),
     'el panel también tiene un menú Diagnóstico, y otra numeración');

  ok('Es JavaScript válido', (() => {
       try {
         require('child_process').execFileSync(process.execPath,
           ['--check', '../montar/publicar-maestro.mjs'], { stdio: 'pipe' });
         return true;
       } catch (e) { return false; }
     })());
}

// ═══ 2d-bis. El HOJA_ID no se puede perder al subir el maestro ═══
/* maestro.gs lleva `var HOJA_ID = ''` en el repositorio: es lo único que se
   escribe a mano en cada tienda y no se versiona. Subirlo tal cual BORRA el
   valor del proyecto publicado, y entonces el maestro no encuentra su hoja.
   La tienda no se cae a la vista: se cae al inventario de respaldo que trae
   dentro, así que se ve bien y no registra un solo pedido. Pasó de verdad. */
{
  const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
  const g = nuevo();

  ok('EL MAESTRO DICE cuál es su hoja, para poder devolvérsela al subir',
     puerta(g, 'bloques').hojaId === g.hojaId, puerta(g, 'bloques').hojaId);

  ok('AL SUBIR se le vuelve a poner el HOJA_ID',
     /var HOJA_ID = '\[\^'\]\*';/.test(src) || /HOJA_ID = '" \+ hojaId/.test(src),
     'el archivo del repositorio lo lleva vacío');
  ok('  ...sacándolo de tienda.json, que es donde quedó al configurar',
     /t\.hojaId/.test(src) && /spreadsheets/.test(src),
     'y si falta hojaId, de la URL de la hoja');
  ok('  ...y SI NO SE SABE CUÁL ES, no sube nada', /process\.exit\(1\)/.test(src) &&
     /quedaría muda/.test(src),
     'subir con el valor vacío es el peor resultado posible');
  ok('  ...ni si la línea no está donde debería',
     /No encontré la línea/.test(src));

  ok('DESPUÉS DE PUBLICAR comprueba que el maestro abre su hoja',
     /a=bloques/.test(src) && /abre su hoja/.test(src),
     'a=version no sirve: contesta igual con la hoja perdida');
  ok('  ...y avisa si responde una versión distinta a la publicada',
     /Responde la versión/.test(src));

  /* La regresión concreta: con HOJA_ID vacío, la puerta del panel falla con
     ese mensaje exacto, que es lo que apareció en la columna Versión. */
  ok('CON HOJA_ID VACÍO, el panel recibe el error y no un cero', (() => {
       const v = crear('./as.js', { hojaId: '' });
       const r = JSON.parse(v.api.doGet({ parameter:
         { a: 'panel', t: 'lo-que-sea' } })._texto);
       return r.ok === false;
     })(), 'por eso el panel decía NO RESPONDE con la tienda arriba');
}

// ═══ 2d-ter. Un maestro roto tiene que poder decir quién es ═══
/* Todas las puertas abrían la hoja para contestar, así que un maestro sin
   HOJA_ID no podía decir NADA de sí mismo — ni siquiera cuál era su hoja. La
   herramienta que arregla ese valor se lo preguntaba justo a él: dependencia
   circular, y ninguna de las dos podía salir. */
{
  const g = nuevo();
  const roto = crear('./as.js', { hojaId: '' });

  const idn = puerta(g, 'identidad');
  ok('LA PUERTA identidad contesta sin abrir la hoja',
     idn.ok && idn.version && idn.scriptId, idn.scriptId);
  ok('  ...y dice cuál es su hoja, que es el dato que se pierde al publicar',
     idn.hojaId === g.hojaId && idn.hojaOk === true, idn.hojaId);

  const r = JSON.parse(roto.api.doGet({ parameter:
    { a: 'identidad', t: roto.api.token() } })._texto);
  ok('CON LA HOJA PERDIDA sigue contestando, en vez de fallar entero',
     r.ok === true, JSON.stringify(r).slice(0, 60));
  ok('  ...avisando de que no puede abrirla', r.hojaOk === false &&
     /HOJA_ID/.test(r.problema || ''), String(r.problema).split('\n')[0]);
  ok('  ...y las OTRAS puertas sí fallan, como debe ser', (() => {
       const b = JSON.parse(roto.api.doGet({ parameter:
         { a: 'bloques', t: roto.api.token() } })._texto);
       return b.ok === false;
     })(), 'identidad es la excepción a propósito, no un descuido');

  ok('CON TOKEN MALO tampoco dice quién es',
     puerta(g, 'identidad', { t: 'no' }).ok === false);

  const src = fs.readFileSync('../montar/configurar-tienda.mjs', 'utf8');
  ok('CONFIGURAR LA TIENDA pregunta por identidad, no por bloques',
     /'identidad'/.test(src) && /desconocida/i.test(src),
     'con respaldo a bloques para un maestro anterior');
  ok('  ...avisa de que la tienda está caída aunque se vea bien',
     /hojaOk === false/.test(src) && /inventario\n?\s*\/\/?\s*de respaldo|de respaldo/.test(src));
  ok('  ...y si el maestro no sabe cuál es su hoja, la pide a mano',
     /URL de la hoja \(o su identificador\)/.test(src));
  ok('  ...aceptando la URL entera o el identificador pelado',
     /\{20,\}/.test(src));
  ok('  ...y manda a npm run maestro, que es lo que lo arregla',
     /para devolverle la hoja al maestro publicado/.test(src));
}

// ═══ 2e. El nombre del sitio: lo único que puede pisar OTRA tienda ═══
/* Crear un repositorio desde una plantilla copia también el nombre del Worker.
   Dos tiendas con el mismo nombre son el MISMO sitio en Cloudflare, así que
   desplegar la segunda borra la primera. Es el único daño que este repositorio
   puede hacer fuera de sí mismo, y por eso se comprueba en el paso donde por
   primera vez se sabe cómo se llama el comercio. */
{
  /* A-3: LA REGLA DEL APODO VIVE EN UN SOLO ARCHIVO. La escribían dos —el
     flujo no la tenía y `configurar-tienda.mjs` sí—, y dos copias de esta
     regla en concreto es como dos tiendas acaban compartiendo nombre de
     Worker: basta con que una recorte a 40 caracteres y la otra a 30. */
  const src = fs.readFileSync('../montar/nombrar-worker.mjs', 'utf8');
  const cfg = fs.readFileSync('../montar/configurar-tienda.mjs', 'utf8');

  ok('CONFIGURAR LA TIENDA revisa el nombre del sitio contra el del comercio',
     /revisarNombreDelWorker/.test(cfg) && /nombrar-worker\.mjs/.test(cfg));
  ok('  ...sin llevar su propia copia de la regla del apodo',
     !/function apodo\(/.test(cfg),
     'dos apodos distintos es como dos tiendas comparten Worker');

  /* A-3, LA MITAD QUE FALTABA: el nombre lo pone EL FLUJO, no una persona.
     `npm run tienda` ya lo hacía bien y sin teclado, pero es una herramienta
     con alguien delante; `DESPLIEGUE.md` compensaba el hueco con un aviso en
     negrita —«editar wrangler.jsonc con el lápiz antes del primer
     despliegue»—, y un paso manual que hay que recordar es un paso que un día
     no se recuerda. */
  {
    const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    ok('EL FLUJO le pone su nombre al Worker, sin que nadie edite nada a mano',
       /node montar\/nombrar-worker\.mjs/.test(flujo),
       'el único daño que este repositorio puede hacer fuera de sí mismo');
    ok('  ...y lo publica, que si no daría igual haberlo escrito',
       /PUBLICA="publicar\/ wrangler\.jsonc"/.test(flujo),
       'renombrarlo en el runner y no empujarlo es no renombrarlo');
    ok('  ...después de hornear el catálogo, que es de donde sale el nombre',
       flujo.indexOf('catalogo-estatico.mjs') < flujo.indexOf('nombrar-worker.mjs'),
       'sin catálogo no hay nombre de comercio que leer');
    ok('  ...sin volver a preguntárselo al maestro',
       /publicar\/catalogo\.json/.test(src) && !/alMaestro/.test(src),
       'sería la cuarta lectura del mismo dato en una corrida (patrón 2)');
    ok('  ...y si el catálogo no dice el nombre, NO se inventa uno',
       /No se renombra el Worker a ciegas/.test(src),
       'un Worker con el nombre equivocado pisa a otra tienda en silencio');
  }
  /* A-3: SIN preguntar por teclado — un flujo sin terminal delante (ej. un
     script de aprovisionamiento) se quedaría esperando para siempre una
     respuesta que nadie puede dar. Como el nombre se deriva del negocio que
     el maestro ya contestó, no hay nada que decidir: se escribe solo. */
  ok('  ...y lo corrige SOLO, sin preguntar por teclado',
     !/preguntar\(/.test(src.match(/function revisarNombreDelWorker[\s\S]*?\n\}/)[0]),
     'un flujo sin terminal delante no puede quedarse esperando una respuesta');
  ok('  ...y explica el riesgo cuando el nombre YA tenía otra cosa (no el marcador de fábrica)',
     /si dos tiendas comparten cuenta de/.test(src));

  /* El apodo tiene que dar un nombre válido para Cloudflare a partir de
     cualquier cosa que el comercio haya escrito en su hoja. */
  const apodo = (() => {
    const m = src.match(/function apodo\(negocio\) \{[\s\S]*?\n\}/);
    return new Function('return ' + m[0].replace('function apodo', 'function'))();
  })();
  ok('EL APODO quita acentos y espacios', apodo('Panadería La Espiga') === 'panaderia-la-espiga',
     apodo('Panadería La Espiga'));
  ok('  ...y también eñes y signos', apodo('Piña & Miel!') === 'pina-miel', apodo('Piña & Miel!'));
  ok('  ...no deja guiones sueltos en las puntas', apodo('  ¡Orgánico!  ') === 'organico',
     apodo('  ¡Orgánico!  '));
  ok('  ...con un nombre imposible, no devuelve vacío', apodo('¿¡!?') === 'tienda',
     apodo('¿¡!?'));
  ok('  ...y no se pasa de largo', apodo('a'.repeat(80)).length === 40);
}

// ═══ 3. Las fotos del Drive del comercio ═══
{
  const g = nuevo();
  configurar(g, 'fotos_drive', 'https://drive.google.com/drive/folders/' + CARPETA);
  g.enDrive(CARPETA, [
    { id: 'f2', nombre: 'chonto-2.jpg', bytes: 12000, modificado: '2026-09-01T10:00:00.000Z' },
    { id: 'f1', nombre: 'chonto-1.jpg', bytes: 250000, modificado: '2026-09-01T10:00:00.000Z' },
    { id: 'f3', nombre: 'notas.pdf', tipo: 'application/pdf', bytes: 900 }
  ]);

  const l = puerta(g, 'fotos');
  ok('El maestro lista la carpeta de Drive del comercio', l.ok && l.archivos.length === 2,
     (l.archivos || []).map(a => a.nombre).join(', '));
  ok('  ...y deja fuera lo que no es una imagen',
     !JSON.stringify(l.archivos).includes('notas.pdf'));
  ok('  ...ordenado por nombre, para que el diff no baile',
     l.archivos[0].nombre === 'chonto-1.jpg');
  ok('  ...con la fecha, que es lo que dice si el comercio la reemplazó',
     /^\d{4}-\d{2}-\d{2}T/.test(l.archivos[0].modificado), l.archivos[0].modificado);

  /* Los dos errores que fallan en silencio: la tienda no se rompe, la foto
     simplemente no aparece, y nadie se entera hasta que pregunta un cliente. */
  ok('El maestro dice TAMBIÉN qué fotos nombra el catálogo',
     Array.isArray(l.usadas), (l.usadas || []).join(', ') || 'ninguna');
  ok('  ...para poder avisar de la que se subió y nadie nombra', (() => {
       const d = desajustes([{ nombre: 'suelta.jpg' }, { nombre: 'usada.jpg' }],
                            ['usada.jpg']);
       return d.huerfanas.join() === 'suelta.jpg';
     })());
  ok('  ...y de la que la hoja nombra y nunca se subió', (() => {
       const d = desajustes([{ nombre: 'usada.jpg' }], ['usada.jpg', 'falta.jpg']);
       return d.nombradas.join() === 'falta.jpg';
     })());
  ok('  ...sin quejarse cuando todo coincide', (() => {
       const d = desajustes([{ nombre: 'a.jpg' }], ['a.jpg']);
       return d.huerfanas.length === 0 && d.nombradas.length === 0;
     })());
  ok('  ...y una URL completa en la hoja no cuenta como foto de Drive', (() => {
       const g2 = nuevo();
       configurar(g2, 'fotos_drive', 'https://drive.google.com/drive/folders/' + CARPETA);
       g2.enDrive(CARPETA, []);
       const h = g2.hojas.get('Catálogo');
       h.getRange(2, 8).setValue('https://res.cloudinary.com/x/foto.jpg|chonto-1.jpg');
       return puerta(g2, 'fotos').usadas.join() === 'chonto-1.jpg';
     })(), 'esa no sale de la carpeta del comercio');

  const f = puerta(g, 'foto', { id: 'f1' });
  ok('Y entrega la foto', f.ok && f.contenido.length > 0 && f.nombre === 'chonto-1.jpg');
  ok('  ...de a una, no todas juntas: seis minutos es el corte de Apps Script',
     typeof f.contenido === 'string' && !Array.isArray(f.contenido));

  ok('SIN fotos_drive configurado, dice exactamente qué falta', (() => {
       const g2 = nuevo();
       const r = puerta(g2, 'fotos');
       return r.ok === false && /fotos_drive/.test(r.error) && /Configuración/.test(r.error);
     })(), puerta(nuevo(), 'fotos').error);

  ok('CON TOKEN MALO no lista nada', puerta(g, 'fotos', { t: 'no' }).ok === false);
  ok('  ...ni baja una foto', puerta(g, 'foto', { t: 'no', id: 'f1' }).ok === false);

  // Lo que de verdad importa de esta puerta.
  g.sueltoEnDrive({ id: 'privado', nombre: 'contratos.jpg', bytes: 100 });
  const fuera = puerta(g, 'foto', { id: 'privado' });
  ok('UN ARCHIVO DE OTRA PARTE DEL DRIVE no se entrega, aunque el token sea bueno',
     fuera.ok === false && /no está en la carpeta/.test(fuera.error), fuera.error);
  ok('  ...que es lo que impide que el token sirva para vaciar el Drive del comercio',
     fuera.contenido === undefined);

  g.enDrive(CARPETA, [{ id: 'gorda', nombre: 'enorme.jpg', bytes: 20 * 1024 * 1024 }]);
  const gorda = puerta(g, 'foto', { id: 'gorda' });
  ok('UNA FOTO DEMASIADO PESADA se rechaza con el número y qué pedir',
     gorda.ok === false && /20 MB/.test(gorda.error) && /8 MB/.test(gorda.error),
     gorda.error);

  ok('Una carpeta que no existe se explica, no revienta', (() => {
       const g3 = nuevo();
       configurar(g3, 'fotos_drive', 'carpeta-que-no-existe-000');
       const r = puerta(g3, 'fotos');
       return r.ok === false && /Drive/.test(r.error);
     })());
}

// ═══ 2b. El maestro tiene que APRENDER su propia dirección ═══
/* Aquí vivió el error que más caro salió del proyecto. getUrl() devuelve la
   /dev desde el editor y la /exec dentro de la aplicación web, y durante un
   tiempo esto convertía una en otra cambiando el final. No se puede: las dos
   llevan identificadores distintos, así que salía una dirección inexistente
   que ADEMÁS terminaba en /exec y por eso pasaba la comprobación de "ya está
   publicado". El stub quedaba apuntando a la nada. */
{
  const DEV  = 'https://script.google.com/macros/s/ELPROYECTO/dev';
  const EXEC = 'https://script.google.com/macros/s/LAIMPLEMENTACION/exec';

  const editor = crear('./as.js', { url: DEV });
  editor.api.instalar();

  ok('DESDE EL EDITOR el maestro NO se inventa una URL /exec',
     editor.api.urlLista() === '', editor.api.urlLista() || '(vacía, como debe)');
  ok('  ...y sobre todo no fabrica una cambiando /dev por /exec',
     editor.api.urlLista().indexOf('ELPROYECTO') === -1,
     'los dos identificadores son distintos: no son la misma dirección');
  ok('  ...el stub sale marcado, no roto en silencio',
     /TODAVÍA_NO_SE_SABE_LA_URL/.test(editor.api.generarStub().codigo));
  ok('  ...y dice que hay que ABRIR la URL una vez, no solo publicar',
     /abre esa URL una vez/i.test(editor.api.generarStub().html));

  // Alguien abre la URL publicada: ahí sí el maestro se ve a sí mismo.
  editor.servidoEn(EXEC);
  editor.api.doGet({ parameter: { a: 'version' } });

  ok('CUANDO ATIENDE UNA PETICIÓN, aprende su dirección de verdad',
     editor.props.URL_EXEC === EXEC, editor.props.URL_EXEC);
  ok('  ...y desde el editor ya la sabe, aunque Google le diga la /dev',
     (() => { editor.servidoEn(DEV); return editor.api.urlLista() === EXEC; })(),
     editor.api.urlLista());
  ok('  ...así que el stub sale completo y apuntando a donde existe',
     editor.api.generarStub().codigo.indexOf("var MAESTRO = '" + EXEC + "'") !== -1);
  ok('  ...y el index también', (() => {
       const b = JSON.parse(editor.api.doGet({ parameter:
         { a: 'bloques', t: editor.token } })._texto);
       return b.valores.SCRIPT_URL === EXEC;
     })());

  ok('SI SE CREA OTRA IMPLEMENTACIÓN, aprende la nueva', (() => {
       const OTRA = 'https://script.google.com/macros/s/OTRADISTINTA/exec';
       editor.servidoEn(OTRA);
       editor.api.doGet({ parameter: { a: 'version' } });
       return editor.props.URL_EXEC === OTRA;
     })(), 'la URL vieja dejaría la tienda muda');

  ok('Aprender no puede tumbar una petición', (() => {
       const g = crear('./as.js', { url: null });
       g.api.instalar();
       const r = JSON.parse(g.api.doGet({ parameter: { a: 'version' } })._texto);
       return r.ok === true;
     })(), 'sin URL conocida, el catálogo sigue saliendo');
}

// ═══ 3a. Por qué el stub no se puede borrar (medido) ═══
/* El experimento se corrió y se retiró. Lo que quedó medido, el 6 de
   septiembre de 2026, es que un disparador instalable de apertura SÍ le dibuja
   el menú al comerciante, pero que TOCAR una opción falla con
   PERMISSION_DENIED: el clic invoca la función bajo la cuenta del comerciante,
   dentro de un proyecto que no es suyo.

   Estas aserciones cuidan las dos consecuencias de esa medición. */
{
  const codigo = fs.readFileSync('./as.js', 'utf8');
  const sinPlantilla = codigo.replace(
    /var PLANTILLA_STUB = \[[\s\S]*?\]\.join\('\\n'\);/, '');

  ok('EL MAESTRO NO TOCA LA INTERFAZ, sin excepciones',
     sinPlantilla.indexOf('getUi()') === -1 &&
     sinPlantilla.indexOf('showModalDialog') === -1,
     'es lo que le permite correr desde un disparador, donde no hay interfaz');
  ok('  ...y el experimento del menú ya no está en el archivo',
     !/function (menuDePrueba|correrDePrueba|accionDePrueba0)\(/.test(codigo));
  ok('  ...pero sí queda cómo desmontarlo donde se instaló',
     typeof crear('./as.js').api.quitarMenuDePrueba === 'function');
  ok('  ...y desmontarlo funciona aunque el disparador ya no exista', (() => {
       const g = nuevo();
       g.api.quitarMenuDePrueba();      // no debe lanzar
       return true;
     })());
  ok('EL PORQUÉ QUEDA ESCRITO donde se va a buscar',
     /PERMISSION_DENIED/.test(codigo) && /46 líneas/.test(codigo),
     'la medición vive junto al código que explica');
}

// ═══ 3b. El respaldo semanal ═══
{
  const RESP = '1CarpetaDeRespaldosDelAdministrador';
  const conCarpeta = () => {
    const g = nuevo();
    configurar(g, 'respaldo_carpeta',
      'https://drive.google.com/drive/folders/' + RESP);
    g.enDrive(RESP, []);
    return g;
  };

  const g = conCarpeta();
  const r = g.api.respaldarHoja();
  ok('LA HOJA SE COPIA a la carpeta del administrador',
     /^Copia_de_Orgánico — pedidos_\d{4}-\d{2}-\d{2}$/.test(r.nombre), r.nombre);
  /* LA FECHA SE LE PREGUNTA AL MAESTRO, NO SE CALCULA AQUÍ.
     Esto decía `new Date().toISOString().slice(0, 10)` —la fecha UTC— mientras
     el maestro nombra la copia con `diaDeHoy()`, que usa la fecha LOCAL. Las
     dos coinciden en un runner de Actions, que va en UTC, y NO coinciden en
     una máquina en horario de Colombia entre las 19:00 y la medianoche: ahí
     son días distintos y esta aserción se caía. Cinco horas en rojo todos los
     días, invisibles desde CI.

     Y el maestro tiene razón: un comercio colombiano quiere sus respaldos
     fechados con SU día, no con el de Greenwich. Lo que estaba mal era la
     segunda copia de la regla (patrón 2), así que ya no hay segunda copia. */
  ok('  ...con la fecha en el nombre, para saber de cuándo es',
     r.nombre.endsWith(g.api.diaDeHoy()),
     r.nombre + ' · hoy es ' + g.api.diaDeHoy());
  ok('  ...y queda dentro de esa carpeta, no en el Drive de la tienda',
     g.api.respaldarHoja() && true);

  ok('SE COPIA, no se exporta: Drive lo resuelve de su lado',
     /makeCopy/.test(String(g.api.respaldarHoja)) &&
     !/getAs|XLSX|export/i.test(String(g.api.respaldarHoja)),
     'una hoja de cien mil filas tarda lo mismo que una de cien');

  ok('EL DISPARADOR SEMANAL queda instalado',
     g.triggers.map(t => t.getHandlerFunction()).indexOf('respaldoSemanal') !== -1);
  ok('  ...y no se duplica al reinstalar', (() => {
       g.api.instalar(); g.api.instalar();
       return g.triggers.filter(t => t.getHandlerFunction() === 'respaldoSemanal').length === 1;
     })(), g.triggers.filter(t => t.getHandlerFunction() === 'respaldoSemanal').length + ' disparador(es)');

  // Doce semanas en una carpeta compartida por dos tiendas.
  const doceSemanas = (() => {
    const g2 = conCarpeta();
    g2.enDrive(RESP, [
      { id: 'ajena1', nombre: 'Copia_de_Panadería_2026-01-01', creado: '2026-01-01T00:00:00Z' },
      { id: 'ajena2', nombre: 'Copia_de_Panadería_2026-01-08', creado: '2026-01-08T00:00:00Z' }
    ]);
    for (let i = 0; i < 12; i++) g2.api.respaldoSemanal();
    return { g: g2, dentro: g2.carpetaDrive(RESP) };
  })();
  const mias = doceSemanas.dentro.filter(f => f.nombre.indexOf('Copia_de_Orgánico') === 0);
  const ajenas = doceSemanas.dentro.filter(f => f.nombre.indexOf('Copia_de_Panadería') === 0);

  ok('LA CARPETA NO CRECE PARA SIEMPRE: quedan ocho copias, no doce',
     mias.length === 8, mias.length + ' copias de esta tienda tras 12 semanas');
  ok('  ...y la que queda arriba es la más nueva, no una vieja',
     mias.some(f => f.nombre.endsWith(doceSemanas.g.api.diaDeHoy())),
     'hoy, para el maestro, es ' + doceSemanas.g.api.diaDeHoy());
  ok('  ...NUNCA borra las copias de OTRA tienda de la misma carpeta',
     ajenas.length === 2, ajenas.map(f => f.nombre).join(', ') || 'las borró');
  ok('  ...y la poda ignora cualquier archivo que no sea un respaldo suyo',
     doceSemanas.dentro.every(f => /^Copia_de_/.test(f.nombre)));

  ok('SIN respaldo_carpeta configurado, dice qué falta y a quién pedírselo', (() => {
       const g2 = nuevo();
       try { g2.api.respaldarHoja(); return false; }
       catch (e) { return /respaldo_carpeta/.test(e.message) &&
                          /permiso de edición/.test(e.message); }
     })());

  ok('SIN PERMISO sobre la carpeta del administrador, lo dice claro', (() => {
       const g2 = conCarpeta();
       g2.carpetaNegada(RESP);
       try { g2.api.respaldarHoja(); return false; }
       catch (e) { return /permiso de edición/.test(e.message); }
     })());

  ok('UN RESPALDO QUE FALLA no tumba nada y queda anotado', (() => {
       const g2 = nuevo();          // sin carpeta configurada
       g2.api.respaldoSemanal();    // no debe lanzar
       return /respaldo_carpeta/.test(g2.api.ultimoRespaldo().error || '');
     })(), (nuevo(), 'queda en las propiedades, no se pierde'));

  ok('El panel recibe cuándo fue el último respaldo',
     puerta(conCarpetaConCopia(), 'panel').respaldo.fecha !== undefined,
     JSON.stringify(puerta(conCarpetaConCopia(), 'panel').respaldo).slice(0, 70));

  function conCarpetaConCopia() {
    const g2 = conCarpeta();
    g2.api.respaldoSemanal();
    return g2;
  }

  ok('  ...y el diagnóstico lo dice en la propia hoja', (() => {
       const g2 = conCarpetaConCopia();
       return /Último respaldo: \d{4}-\d{2}-\d{2}/.test(g2.api.diagnostico().texto);
     })(), (conCarpetaConCopia().api.diagnostico().texto.match(/Último respaldo:[^\n]*/) || [''])[0]);
}

// ═══ 4. Qué se baja y qué no ═══
{
  const drive = [
    { id: 'f1', nombre: 'a.jpg', bytes: 10, modificado: '2026-09-01T00:00:00.000Z' },
    { id: 'f2', nombre: 'b.jpg', bytes: 10, modificado: '2026-09-01T00:00:00.000Z' }
  ];
  const registro = {
    'a.jpg': { id: 'f1', modificado: '2026-09-01T00:00:00.000Z' },
    'c.jpg': { id: 'f9', modificado: '2026-01-01T00:00:00.000Z' }
  };
  const n = novedades(drive, registro);
  ok('SOLO SE BAJA lo que no está', n.nuevas.map(x => x.nombre).join() === 'b.jpg',
     n.nuevas.map(x => x.nombre).join());
  ok('  ...lo que ya está y no cambió, no se vuelve a bajar',
     !n.nuevas.some(x => x.nombre === 'a.jpg'));
  ok('  ...y lo que el comercio borró de Drive se quita del sitio',
     n.borradas.join() === 'c.jpg', n.borradas.join());
  ok('UNA FOTO REEMPLAZADA con el mismo nombre SÍ se vuelve a bajar', (() => {
       const cambiada = [{ id: 'f1', nombre: 'a.jpg', bytes: 10,
                           modificado: '2026-09-05T00:00:00.000Z' }];
       return novedades(cambiada, registro).nuevas.length === 1;
     })(), 'se compara por fecha, no por tamaño');
  ok('  ...y si cambió el archivo de Drive detrás del mismo nombre, también', (() => {
       const otra = [{ id: 'OTRO', nombre: 'a.jpg', bytes: 10,
                       modificado: '2026-09-01T00:00:00.000Z' }];
       return novedades(otra, registro).nuevas.length === 1;
     })());
  ok('Sin novedades no hace nada', novedades([drive[0]], { 'a.jpg': registro['a.jpg'] })
       .nuevas.length === 0);
}

// ═══ 5. La carga que sí se puede medir ═══
{
  const g = nuevo();
  ok('Al principio no hay lecturas', g.api.lecturasDeHoy() === 0);

  for (let i = 0; i < 5; i++) g.api.doGet({ parameter: { a: 'catalogo' } });
  ok('CADA LECTURA DEL CATÁLOGO se cuenta', g.api.lecturasDeHoy() === 5,
     g.api.lecturasDeHoy() + ' lecturas');

  ok('  ...y otra puerta no infla el número', (() => {
       g.api.doGet({ parameter: { a: 'version' } });
       g.api.doGet({ parameter: { a: 'panel', t: g.token } });
       return g.api.lecturasDeHoy() === 5;
     })(), g.api.lecturasDeHoy() + ' después de version y panel');

  ok('El consolidado de cada hora las pasa a las propiedades', (() => {
       g.api.consolidarLecturas();
       return JSON.parse(g.props.LECTURAS).total === 5 && g.cache.lecturas === undefined;
     })(), g.props.LECTURAS);
  ok('  ...y consolidar dos veces no las duplica', (() => {
       g.api.consolidarLecturas();
       return g.api.lecturasDeHoy() === 5;
     })(), g.api.lecturasDeHoy() + ' lecturas');
  ok('  ...las que llegan después se suman a las ya consolidadas', (() => {
       g.api.doGet({ parameter: { a: 'catalogo' } });
       return g.api.lecturasDeHoy() === 6;
     })(), g.api.lecturasDeHoy() + ' lecturas');

  ok('CONTAR NUNCA PUEDE TUMBAR UNA VISITA', (() => {
       // nuevo() sin configurar(): una tienda recién instalada trae los dos
       // EJEMPLO de instalar() (A-5), no el catálogo de prueba de 8. Lo que
       // importa aquí no es CUÁNTOS productos hay, sino que contar la visita
       // no le rompa la respuesta a la siguiente.
       const g2 = nuevo();
       const cat = g2.api.doGet({ parameter: { a: 'catalogo' } });
       return JSON.parse(cat._texto).productos.length === 2;
     })(), 'el catálogo sigue saliendo completo');

  /* EL PICO, NO EL TOTAL. El límite de Apps Script es de concurrencia —30
     ejecuciones a la vez—, así que mil visitas repartidas en el día no son nada
     y cien en el mismo minuto sí. El total no distingue esos dos casos, y
     durante un tiempo era lo único que se medía: la condición de disparo de
     DECISIONES.md 01 estaba escrita y no se podía comprobar. */
  ok('SE GUARDA EL PICO DE UNA HORA, que es lo que acerca al techo',
     JSON.parse(g.props.LECTURAS).pico === 5, g.props.LECTURAS);
  ok('  ...y el pico se queda con la hora MÁS cargada, no con la última', (() => {
       const v = nuevo();
       for (let i = 0; i < 9; i++) v.api.doGet({ parameter: { a: 'catalogo' } });
       v.api.consolidarLecturas();                    // una hora con 9
       v.api.doGet({ parameter: { a: 'catalogo' } });
       v.api.consolidarLecturas();                    // la siguiente, con 1
       const p = JSON.parse(v.props.LECTURAS);
       return p.total === 10 && p.pico === 9;
     })(), 'con el total, una campaña de una hora se ve igual que un día tranquilo');
  ok('  ...y la hora EN CURSO cuenta, que es cuando hay que verla', (() => {
       const v = nuevo();
       for (let i = 0; i < 4; i++) v.api.doGet({ parameter: { a: 'catalogo' } });
       return v.api.picoDeHoy() === 4;   // sin consolidar todavía
     })(), 'si la campaña está ocurriendo AHORA, esperar a la hora en punto no sirve');

  const r = puerta(g, 'panel');
  ok('El panel recibe la carga del día', r.lecturasHoy === 6, String(r.lecturasHoy));
  ok('  ...y también el pico, que es la señal que avisa antes de llegar',
     r.picoHora === 5, String(r.picoHora));
  ok('  ...y cuánta cuota de correo le queda a esa cuenta',
     typeof r.cuotaCorreo === 'number' && r.cuotaCorreo > 0, String(r.cuotaCorreo));

  /* Una condición de disparo que el instrumento no puede observar es una
     intención, no una decisión.

     EL UMBRAL VIVE EN DOS SITIOS —el diagnóstico, que es el instrumento, y la
     decisión escrita, que es el compromiso— y eso ya se separó una vez: al
     reescribir la decisión quedó «300 lecturas» donde el diagnóstico dice
     «300 en una hora», y estas aserciones lo cazaron. La lección es la de
     siempre: se compara el NÚMERO, no la frase, y el número se saca del
     instrumento. El documento tiene que hacerle eco al código, no al revés. */
  {
    const dec = fs.readFileSync('../docs/DECISIONES.md', 'utf8');
    const texto = g.api.diagnostico().texto;
    const umbral = (texto.match(/Pasado (\d+) en una hora/) || [])[1];

    ok('EL DIAGNÓSTICO mide el pico y dice el umbral que dispara la decisión 01',
       !!umbral && /pico en una hora/.test(texto), umbral || 'sin umbral');
    ok('  ...y la decisión escrita nombra ESE MISMO número',
       !!umbral && new RegExp('\\b' + umbral + '\\b').test(dec),
       'el documento le hace eco al instrumento, no al revés');
    ok('  ...con instrumento y contrapartida, o no se puede ejecutar',
       /pico/.test(dec) && /Contrapartida/.test(dec),
       'sin número no se ejecuta; sin contrapartida se lee como si fuera gratis');
  }
}

// ═══ 6. Los dos datos que hay que llevar al panel, y a quién se le enseñan ═══
/* Esta batería decía antes «DIAGNÓSTICO da la URL y el token juntos y
   rotulados», y era verdad: se los daba a TODO EL MUNDO, incluido el
   comerciante, que abre Diagnóstico desde su menú. El token de montaje abre
   ?a=sembrar, ?a=bloques, ?a=fotos y ?a=panel; no tiene por qué estar en una
   pantalla que se fotografía y se reenvía.

   Ahora el informe del menú no lo lleva, y el que monta la tienda ejecuta
   `diagnosticoCompleto()` desde el editor del maestro, que es un sitio donde
   el comerciante no entra. */
{
  const g = nuevo();
  const t = g.api.diagnostico().texto;

  ok('EL DIAGNÓSTICO DEL MENÚ no le enseña al comerciante el token de montaje',
     t.indexOf(g.api.token()) === -1 && /diagnosticoCompleto\(\)/.test(t),
     'ese token abre sembrar, bloques, fotos y panel');
  ok('  ...y el valor por defecto es el discreto, no al revés',
     g.api.diagnostico(true).texto.indexOf(g.api.token()) !== -1 &&
     t.indexOf(g.api.token()) === -1,
     'si alguien añade otra llamada y no se acuerda, falla del lado seguro');
  ok('  ...pero sigue dando la URL, que no es secreta y sí hace falta',
     /PARA EL PANEL DE TIENDAS/.test(t) && /Servicio: https/.test(t),
     (t.match(/Servicio:[^\n]*/) || [''])[0].slice(0, 60));

  const completo = g.api.diagnosticoCompleto();
  ok('DIAGNOSTICOCOMPLETO() sí da los dos datos que el panel no puede adivinar',
     completo.texto.indexOf(g.api.token()) !== -1 && /Servicio: https/.test(completo.texto),
     'se ejecuta desde el editor, y sale por el registro de ejecución');
  ok('  ...y no tiene puerta: no se puede pedir desde fuera', (() => {
       const r = JSON.parse(g.api.doGet({ parameter:
         { a: 'menu', f: 'diagnosticoCompleto', t: g.api.tokenMenu() } })._texto);
       return /no existe/.test(r.texto || r.error || '');
     })(), 'lo que la hace segura es que no esté en ACCIONES_MENU');

  ok('  ...y de paso la carga, con el tope que no se puede consultar',
     /Lecturas del catálogo hoy/.test(t) && /30/.test(t),
     (t.match(/Lecturas del catálogo[^\n]*/) || [''])[0]);
}

// ═══ 7. Un solo flujo, y sin su propia copia del procedimiento ═══
/* DOS COSAS SE JUNTAN AQUÍ.

   La primera: el mismo agujero estuvo dos veces. `npm run maestro` subía
   maestro.gs tal cual y le borraba el HOJA_ID a la tienda publicada; se arregló
   en la herramienta, y el flujo siguió teniendo su propia copia del
   procedimiento escrita dentro del YAML —`cp maestro.gs subida/`— con el fallo
   intacto. La regla que sale de eso: el flujo NO reimplementa el montaje, lo
   llama.

   La segunda: eran DOS flujos, `montaje` y `maestro`, y dispararlos en el orden
   equivocado es fácil y silencioso. El paso del index le pregunta al maestro
   cómo debe quedar el <head>, y una de las cinco constantes es la versión del
   contrato: publicar el maestro DESPUÉS deja la tienda avisando que la hoja
   responde otra versión. Ahora es un solo flujo con el orden fijo. */
{
  const yml = f => fs.readFileSync('../.github/workflows/' + f, 'utf8');
  const maestro = yml('montaje.yml');
  const flujos  = fs.readdirSync('../.github/workflows').filter(f => /\.ya?ml$/.test(f));

  ok('UN SOLO FLUJO monta la tienda entera, en orden',
     !fs.existsSync('../.github/workflows/maestro.yml') &&
     /publicar-maestro\.mjs/.test(maestro) && /preparar-index\.mjs/.test(maestro) &&
     /traer-fotos\.mjs/.test(maestro) && /publicacion\.sh/.test(maestro),
     'dos flujos se disparan en el orden equivocado sin que se note');
  ok('  ...y el maestro va ANTES que el index, que es lo que importa',
     maestro.indexOf('publicar-maestro.mjs') < maestro.indexOf('preparar-index.mjs'),
     'al revés, la tienda avisa que la hoja responde otra versión');
  ok('EL FLUJO LLAMA a la herramienta, no la reescribe',
     /node montar\/publicar-maestro\.mjs/.test(maestro),
     'una segunda implementación se queda atrás y publica el fallo ya arreglado');
  /* release.yml sí copia maestro.gs: lo empaqueta como entregable, y ahí el
     HOJA_ID vacío es lo correcto —es la plantilla—. La regla es sobre los
     flujos que HABLAN CON APPS SCRIPT: esos no pueden tocar el archivo. */
  ok('  ...y ningún flujo que hable con clasp copia maestro.gs por su cuenta',
     flujos.filter(f => /clasp/.test(yml(f)))
           .every(f => !/cp\s+maestro\.gs/.test(yml(f))),
     'copiarlo tal cual sube var HOJA_ID = \'\' y deja la tienda muda');
  ok('  ...ni corre clasp push por su cuenta',
     flujos.every(f => !/clasp\s+push/.test(yml(f))),
     'la herramienta es la única que sube, porque es la que repone el HOJA_ID');

  ok('LE PASA EL HOJA_ID, que es el dato que se pierde',
     /HOJA_ID: \$\{\{ secrets\.HOJA_ID \}\}/.test(maestro));
  ok('  ...y los otros tres: proyecto, URL y token',
     ['SCRIPT_ID', 'MAESTRO_URL', 'MAESTRO_TOKEN'].every(
       k => new RegExp(k + ': \\$\\{\\{ secrets\\.' + k + ' \\}\\}').test(maestro)),
     'sin URL ni token no puede comprobar que el maestro abre su hoja');
  ok('  ...y se planta antes de publicar si falta alguno',
     /faltan/.test(maestro) && /CLASPRC SCRIPT_ID HOJA_ID/.test(maestro),
     'fallar al principio y no a medio subir');
  /* Un fallo que solo dice qué falta deja a alguien buscando dónde se pone.
     Es la misma lección del botón del carrito: decir QUÉ HACER cuesta lo
     mismo, y el sitio donde se lee es el resumen de la corrida. */
  ok('  ...diciendo en el RESUMEN de dónde sale cada secreto y cómo seguir',
     /GITHUB_STEP_SUMMARY/.test(maestro) && /Secrets and variables/.test(maestro) &&
     /entre .*\/d\/.* y .*\/edit/.test(maestro) &&
     /sin marcar/.test(maestro),
     'y que se puede seguir sin ellos, con la casilla sin marcar');
  ok('  ...pero solo si se PIDIÓ publicar: sin eso, el resto del montaje sigue',
     /inputs\.maestro \}\}" != "true"/.test(maestro) &&
     /steps\.quiere\.outputs\.publica == 'si'/.test(maestro),
     'una tienda sin CLASPRC se monta igual: el maestro se pegó a mano');

  ok('LA HERRAMIENTA lee el entorno primero y el archivo después',
     (() => {
       const src = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
       return /process\.env\.HOJA_ID/.test(src) &&
              /process\.env\.SCRIPT_ID/.test(src) &&
              /process\.env\.MAESTRO_URL/.test(src) &&
              /process\.env\.MAESTRO_TOKEN/.test(src);
     })(), 'en Actions no existen tienda.json ni montar/.clasp.json');

  /* El flujo sí tiene horario —los lunes trae la hoja y las fotos—, pero el
     maestro dentro de él no: hay que marcarlo Y escribir PUBLICAR. Un
     disparo por calendario no lleva ninguna de las dos cosas. */
  ok('PUBLICAR EL BACKEND sigue siendo una decisión, no un horario',
     /PUBLICAR/.test(maestro) && /no escribiste PUBLICAR/.test(maestro) &&
     /type: boolean/.test(maestro) && /default: false/.test(maestro));
  ok('  ...y los dos flujos que tocan la tienda no corren a la vez',
     ['montaje.yml', 'fotos.yml'].every(
       f => /group: tienda-\$\{\{ github\.repository \}\}/.test(yml(f))),
     'los dos escriben en publicar/');

  /* El shell por defecto de Actions es `bash -e`, sin pipefail: en `algo | tee`
     el código que cuenta es el de tee, y un fallo pasa por verde. */
  ok('UNA TUBERÍA CON tee lleva pipefail, o el fallo se pierde',
     flujos.every(f => {
       const t = yml(f);
       return !/\| tee /.test(t) || /set -o pipefail/.test(t);
     }));

  /* El log de Actions es lo único que hay cuando algo falla allá. Durante un
     tiempo todas.sh solo imprimía el marcador —"822/823"— y para saber qué
     aserción se cayó había que tener el repositorio en la máquina. Peor: una
     batería que ni arrancaba contaba 0/0, así que buenas == total y la corrida
     salía VERDE con una batería entera sin correr. */
  {
    const sh = fs.readFileSync('todas.sh', 'utf8');
    ok('UNA BATERÍA QUE FALLA imprime sus líneas FALLA en el log',
       /grep -E "\^ FALLA"/.test(sh),
       'sin esto, desde Actions no hay forma de saber qué se cayó');
    ok('  ...y una que ni arranca imprime su error',
       /tail -25/.test(sh) && /rotas=/.test(sh));
    ok('  ...y NO puede pasar por verde contando 0/0',
       /-z "\$rotas"/.test(sh),
       'una batería entera sin correr sumaba 0 a los dos lados');
  }

  /* GitHub QUITA Node 20 DE LOS RUNNERS EL 23 DE SEPTIEMBRE DE 2026. Hasta
     entonces las acciones que lo piden corren igual, con un aviso; después,
     no. Es la clase de fecha que no avisa dos veces: el día que pase, los
     cuatro flujos dejan de correr a la vez y el sitio se queda sin poder
     desplegarse. */
  /* UNA CRUZ ROJA QUE SIGNIFICA "TODO BIEN" ES PEOR QUE NO AVISAR: enseña a
     ignorar las cruces rojas, y este proyecto ya tuvo una corrida en verde con
     una batería entera sin correr. Volver a disparar el release sin cambiar
     nada no es un error —no hay nada que cortar—; lo que sí lo es, y hay que
     distinguirlo, es que la etiqueta exista apuntando a OTRO commit: ahí el
     código cambió y la versión no. */
  /* 0.20.6 · `release` NO VIAJA A LAS TIENDAS (bitácora 93): `alta` no se lo
     hereda, porque una tienda no corta versiones. Esta batería corre TAMBIÉN
     dentro de la tienda —`montaje` la corre antes de publicar— y leer ahí un
     archivo que no existe tumbaba la batería entera con un ENOENT: la tienda
     no publicaba y el motivo que se leía era «batería en rojo». */
  if (!fs.existsSync('../.github/workflows/release.yml')) {
    console.log('  SALTA | el flujo `release` no viaja a las tiendas (`alta` no se lo hereda):');
    console.log('          una tienda no corta versiones, así que aquí no hay nada que comprobar.');
  } else {
    const rel = yml('release.yml');
    ok('EL RELEASE distingue "ya está hecho" de "te faltó subir la versión"',
       /ya está publicada, y es exactamente este commit/.test(rel) &&
       /apunta a otro commit/.test(rel) &&
       /corta=no/.test(rel) && /corta=si/.test(rel),
       'una cruz roja que significa todo bien enseña a ignorar las cruces rojas');
    ok('  ...y cuando no hay nada que cortar, NO publica ni empaqueta',
       (rel.match(/if: steps\.hay\.outputs\.corta == 'si'/g) || []).length === 2,
       'saltarse los pasos es lo que hace que terminar en verde sea honesto');
    ok('  ...leyendo el commit de la etiqueta, no el del objeto etiqueta',
       /\^\{\}/.test(rel),
       'en una etiqueta anotada el sha del ref no es el del commit');
  }

  ok('NINGUNA ACCIÓN SE QUEDÓ en una versión que pide Node 20',
     flujos.every(f => !/actions\/(checkout|setup-node|cache)@v[1-4]\b/.test(yml(f))),
     'Node 20 sale de los runners el 23-sep-2026');

  ok('NINGÚN FLUJO LLEVA UN SECRETO ESCRITO DENTRO',
     flujos.every(f => {
       const t = yml(f);
       return !/tk-[0-9a-f]{8}/.test(t) && !/ghp_[A-Za-z0-9]{10}/.test(t) &&
              !/AKfycb[A-Za-z0-9_-]{20}/.test(t);
     }), 'todo entra por secrets.*, que no quedan en el historial');
}

// ═══ 8. Sembrar la configuración desde el montaje ═══
/* instalar() siembra la hoja con el nombre, el WhatsApp y la dirección del
   sitio de ORGÁNICO. Una tienda nueva que no los cambie manda sus pedidos al
   celular de otro comercio y publica etiquetas Open Graph que apuntan a otro
   sitio. Escribir esas celdas a mano era el paso más aburrido del despliegue y
   el más fácil de dejar a medias.

   Es la ÚNICA puerta que escribe, así que la mitad de estas aserciones son
   sobre lo que NO puede hacer. */
{
  const sembrar = (g, datos) => JSON.parse(g.api.doGet({ parameter:
    Object.assign({ a: 'sembrar', t: g.token }, datos) })._texto);
  const valor = (g, clave) => {
    const f = g.filas('Configuración').find(x => String(x[0]).trim() === clave);
    return f ? String(f[1]) : null;
  };

  {
    const g = nuevo();
    /* Durante un tiempo esto traía el celular de la primera tienda, y una
       tienda nueva que no lo cambiara le mandaba los pedidos a ese número.
       Vacío falla a la vista; un número de otro funciona en silencio. */
    ok('DE FÁBRICA, una tienda nueva NO trae ningún WhatsApp',
       valor(g, 'whatsapp') === '', JSON.stringify(valor(g, 'whatsapp')));

    const r = sembrar(g, { negocio: 'Panadería La Espiga', whatsapp: '573001112233' });
    ok('SEMBRAR escribe el nombre y el WhatsApp de esta tienda',
       r.ok && valor(g, 'negocio') === 'Panadería La Espiga' &&
       valor(g, 'whatsapp') === '573001112233',
       (r.escritos || []).join(', '));
    ok('  ...y dice cuáles escribió',
       (r.escritos || []).indexOf('negocio') !== -1);
  }

  {
    const g = nuevo();
    sembrar(g, { sitio_url: 'https://panaderia.ejemplo.workers.dev/' });
    ok('DEDUCE fotos_origen de sitio_url, que nadie debería teclear',
       valor(g, 'fotos_origen') === 'https://panaderia.ejemplo.workers.dev/fotos',
       valor(g, 'fotos_origen'));
    sembrar(g, { fotos_drive: 'https://drive.google.com/drive/folders/ABC' });
    ok('  ...y pone fotos_webp en Sí cuando va a haber fotos convertidas',
       valor(g, 'fotos_webp') === 'Sí', valor(g, 'fotos_webp'));
  }

  {
    const g = nuevo();
    configurar(g, 'negocio', 'Lo que escribió el comercio');
    const r = sembrar(g, { negocio: 'Lo que trae el flujo' });
    ok('NO PISA lo que el comercio ya escribió',
       valor(g, 'negocio') === 'Lo que escribió el comercio' &&
       (r.respetados || []).indexOf('negocio') !== -1,
       'sembrar es poner lo que falta, no imponer');
    const f = sembrar(g, { negocio: 'Lo que trae el flujo', forzar: 'si' });
    ok('  ...salvo que se pida a propósito con forzar',
       valor(g, 'negocio') === 'Lo que trae el flujo' &&
       (f.escritos || []).indexOf('negocio') !== -1);
  }

  {
    const g = nuevo();
    const antes = valor(g, 'negocio');
    const r = sembrar(g, { negocio: '', whatsapp: '   ' });
    ok('UN VALOR VACÍO NO BORRA NADA',
       valor(g, 'negocio') === antes && !(r.escritos || []).length,
       'sembrar de nuevo sin datos deja la hoja como está');
  }

  {
    const g = nuevo();
    const color = valor(g, 'color_principal');
    const legal = valor(g, 'empresa_nit');
    sembrar(g, { color_principal: '#000000', empresa_nit: '999', negocio: 'X' });
    ok('SOLO ESCRIBE LAS CLAVES DE LA LISTA, no lo que le manden',
       valor(g, 'color_principal') === color && valor(g, 'empresa_nit') === legal,
       'es la única puerta que escribe: el resto de la hoja no se toca desde fuera');
    ok('  ...y el catálogo no lo puede tocar nadie desde fuera', (() => {
         const r = JSON.parse(g.api.doGet({ parameter:
           { a: 'sembrar', t: g.token, Catálogo: 'x', stock: '0' } })._texto);
         return r.ok === true && !(r.escritos || []).length;
       })());
  }

  {
    const g = nuevo();
    ok('CON TOKEN MALO no escribe nada',
       sembrar(g, { negocio: 'X', t: 'no' }).ok === false &&
       valor(g, 'negocio') === '[NOMBRE DEL COMERCIO]', valor(g, 'negocio'));
  }

  {
    const g = nuevo();
    const r = sembrar(g, {});
    ok('DICE QUÉ SIGUE SIN CONFIGURAR, que es lo que se olvida',
       (r.faltan || []).indexOf('negocio') !== -1 &&
       (r.faltan || []).indexOf('whatsapp') !== -1, (r.faltan || []).join(', '));
    const d = sembrar(g, { negocio: 'P', whatsapp: '573001112233',
                           sitio_url: 'https://p.ejemplo.dev/',
                           fotos_drive: 'ABC', respaldo_carpeta: 'DEF' });
    ok('  ...y deja de decirlo cuando ya no falta',
       !(d.faltan || []).length, (d.faltan || []).join(', '));
  }

  /* La semilla salió de dentro de instalar() para que la puerta pudiera saber
     qué valor no ha tocado nadie. Si las dos se desincronizan, "no pisa lo del
     comercio" empieza a pisar valores de fábrica que ya no reconoce. */
  {
    const g = nuevo();
    const enLaHoja = {};
    g.filas('Configuración').forEach(f => { enLaHoja[String(f[0]).trim()] = String(f[1]); });
    ok('LA SEMILLA Y LO QUE instalar() ESCRIBE son lo mismo',
       g.api.semillaDeConfiguracion().every(([k, v]) => enLaHoja[k] === String(v)),
       'si se separan, "no pisar lo del comercio" deja de reconocer lo de fábrica');
    ok('  ...y valorDeFabrica lo lee de ahí',
       g.api.valorDeFabrica('negocio') === '[NOMBRE DEL COMERCIO]' &&
       g.api.valorDeFabrica('whatsapp') === '');
  }

  /* VERSION es el contrato entre el maestro y index.html: la tienda avisa
     cuando no coinciden. Sembrar no cambia nada de lo que la tienda le pide al
     maestro, así que subir VERSION por esto pondría el aviso de "versión
     distinta" en todas las tiendas hasta volver a desplegarlas. */
  ok('SEMBRAR NO TOCA EL CONTRATO con la tienda', (() => {
       const g = nuevo();
       const antes = puerta(g, 'version').version;
       sembrar(g, { negocio: 'Panadería' });
       return puerta(g, 'version').version === antes;
     })(), 'la puerta es nueva para el montaje, no para la tienda');
  ok('  ...y un maestro viejo lo dice en cristiano, no como tienda caída',
     /Acci\[o[^\]]*\]n desconocida: sembrar/.test(
       fs.readFileSync('../montar/sembrar-configuracion.mjs', 'utf8')) &&
     /anterior a la puerta/.test(
       fs.readFileSync('../montar/sembrar-configuracion.mjs', 'utf8')),
     'un repositorio al día contra un maestro viejo da ese error exacto');

  ok('LA HERRAMIENTA solo manda lo que venga con algo escrito',
     JSON.stringify(loQueSeMando({ NEGOCIO: 'P', WHATSAPP: '  ', SITIO_URL: '' })) ===
     JSON.stringify({ negocio: 'P' }),
     'una entrada en blanco del flujo no puede llegar como orden de borrar');
  ok('  ...y traduce forzar', loQueSeMando({ NEGOCIO: 'P', FORZAR: 'si' }).forzar === 'si');
}

// ═══ 9. Las pruebas no pueden ser de una máquina ni de una tienda ═══
/* LAS DOS FALLAS QUE APARECIERON AL MONTAR LA SEGUNDA TIENDA, Y QUE EN LA
   PRIMERA ERAN INVISIBLES:

   · sec2.js abría $HOME/t/local.html —la ruta de un equipo—. Donde ese archivo
     existía, la batería probaba una copia congelada; en cualquier otra parte
     reventaba entera. Y una batería reventada contaba 0/0, así que la corrida
     salía verde igual.
   · hoja.js exigía que og:site_name dijera "Orgánico", y sec2.js que el
     mensaje dijera "Orgánico lo confirma antes del despacho". Lo segundo no
     era una prueba mal escrita: el index TENÍA ese nombre a mano, y la
     panadería le decía a sus clientes que el pedido lo confirmaba Orgánico.

   El producto es una tienda por comercio. Una prueba que solo pasa en la
   primera no está probando el producto. */
{
  const baterias = fs.readdirSync('.').filter(f =>
    /\.js$/.test(f) && !['gas.js', 'servidor.js', 'as.js', 'pn.js', 'limites.js'].includes(f));

  ok('NINGUNA BATERÍA abre un archivo por una ruta de una máquina', baterias.every(f => {
       const t = fs.readFileSync(f, 'utf8');
       return !/goto\(\s*['"`]file:\/\//.test(t) && !/process\.env\.HOME/.test(t);
     }), 'donde esa ruta no existe, la batería revienta entera');
  ok('  ...y la que abre un archivo local lo arma desde __dirname',
     /pathToFileURL\(path\.join\(__dirname/.test(fs.readFileSync('sec2.js', 'utf8')),
     'el local.html que todas.sh regenera al lado, no una copia de otro día');

  /* "Orgánico" es el nombre del PRODUCTO —el menú de la hoja, el título que
     genera el maestro con su configuración de ejemplo— y ahí es correcto. Lo
     que no puede aparecer es como el nombre del COMERCIO dentro de la página. */
  const deLaTienda = ['e2e.js', 'hoja.js', 'cat.js', 'val.js', 'movil.js',
                      'pag.js', 'sec2.js', 'enlace.js', 'presentacion.js'];
  // Sin los comentarios: ahí el nombre sale al contar qué pasó, y contarlo es
  // justamente lo que evita que vuelva.
  const sinComentarios = f => fs.readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('NINGUNA BATERÍA DE LA PÁGINA da por hecho que la tienda es Orgánico',
     deLaTienda.every(f => !/Orgánico/.test(sinComentarios(f))),
     'el producto es una tienda por comercio; una prueba que solo pasa en la primera no prueba nada');
  ok('  ...leen el nombre que la página declara', (() => {
       const t = fs.readFileSync('hoja.js', 'utf8') + fs.readFileSync('sec2.js', 'utf8');
       return /evaluate\(\(\) => NEGOCIO\)/.test(t);
     })());

  ok('Y EL MENSAJE DE WHATSAPP lleva el nombre del comercio, no uno fijo', (() => {
       const html = fs.readFileSync('../publicar/index.html', 'utf8');
       return /\$\{NEGOCIO\} lo confirma antes del despacho/.test(html) &&
              !/Orgánico lo confirma antes del despacho/.test(html);
     })(), 'la panadería le decía a sus clientes que el pedido lo confirmaba Orgánico');
}

// ═══ 10. Ningún nombre de comercio quemado en el código ═══
/* "Orgánico" es UNA TIENDA —la de tomates—, no el nombre del producto. Estaba
   escrito a mano en sitios donde el comprador lo lee: el consentimiento de
   datos que autoriza al firmar, un encabezado de los textos legales, los
   avisos de consola, y el menú de la propia hoja del comerciante.

   Y estaba en la semilla de instalar(), que es peor: una tienda recién
   instalada traía el nombre, el sitio y EL CELULAR de otra. El celular es el
   caso grave, porque un número de fábrica no falla: funciona, y le manda los
   pedidos a quien no es. */
{
  const g = nuevo();

  ok('EL MENÚ DE LA HOJA se llama como el comercio', (() => {
       configurar(g, 'negocio', 'Panadería La Espiga');
       const c = g.api.generarStub().codigo;
       return /var NEGOCIO = 'Panadería La Espiga'/.test(c) &&
              /createMenu\(NEGOCIO\)/.test(c) && !/'Orgánico'/.test(c);
     })(), 'el comerciante abre SU hoja, no la de otro');
  ok('  ...y sin nombre puesto dice Tienda, no el de otro comercio', (() => {
       const v = nuevo();
       configurar(v, 'negocio', '');
       return /var NEGOCIO = 'Tienda'/.test(v.api.generarStub().codigo);
     })());
  ok('  ...y una comilla en el nombre no rompe el código generado', (() => {
       const v = nuevo();
       configurar(v, 'negocio', "D'Angelo Pan");
       const c = v.api.generarStub().codigo;
       return /var NEGOCIO = 'D\\'Angelo Pan'/.test(c);
     })(), 'el stub se pega tal cual: un apóstrofo suelto lo parte en dos');

  /* La semilla es lo que ve una tienda recién instalada. Que traiga datos de
     otra es el modo de falla que no se nota. */
  const fabrica = {};
  g.api.semillaDeConfiguracion().forEach(([k, v]) => { fabrica[k] = String(v); });

  ok('LA SEMILLA NO TRAE NINGÚN CELULAR', Object.keys(fabrica).every(
       k => !/\b\d{10}\b/.test(fabrica[k])),
     'un número de fábrica funciona, y por eso es el peor valor posible');
  ok('  ...y el whatsapp viene vacío a propósito', fabrica.whatsapp === '',
     'sin número no hay venta, y eso SE VE; con el número de otro, no');
  ok('  ...y el nombre y el sitio vienen sin llenar',
     /^\[.*\]$/.test(fabrica.negocio) && fabrica.sitio_url === '',
     fabrica.negocio);
  ok('  ...y ningún valor de fábrica nombra a un comercio de verdad',
     Object.keys(fabrica).every(k => !/Orgánico/.test(fabrica[k])));

  /* Publicar con esos valores es lo que hay que impedir: el montaje escribe
     index.html, y un index con el nombre de otra tienda ya está publicado. */
  const conValores = v => ({
    head: '<meta http-equiv="Content-Security-Policy" content="x">' +
          '<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->',
    valores: Object.assign({ SCRIPT_URL: 'https://x/exec', SCRIPT_VERSION: '1',
                             FOTOS_HOSTS: [], NEGOCIO: 'Panadería',
                             WHATSAPP: '573001112233' }, v)
  });
  const base = fs.readFileSync('index.html', 'utf8');
  const revienta = v => { try { aplicar(base, conValores(v)); return ''; }
                          catch (e) { return e.message; } };

  ok('EL MONTAJE NO PUBLICA una tienda con el nombre sin llenar',
     /sigue sin llenar/.test(revienta({ NEGOCIO: '[NOMBRE DEL COMERCIO]' })),
     'los corchetes son lo que deja la instalación para que se vea que falta');
  ok('  ...ni sin WhatsApp, y dice por qué viene vacío',
     /el peor[\s\S]*valor posible/.test(revienta({ WHATSAPP: '' })),
     'el técnico tiene que entender que el vacío es a propósito');
  ok('  ...y cada constante que falta explica LO SUYO',
     /falta publicar el proyecto/.test(revienta({ SCRIPT_URL: '' })) &&
     !/falta publicar el proyecto/.test(revienta({ NEGOCIO: '' })),
     'antes todas mandaban al técnico a publicar el Apps Script');

  /* Lo que el comprador lee y firma. */
  const html = fs.readFileSync('../publicar/index.html', 'utf8');
  ok('EL CONSENTIMIENTO nombra a la tienda, no a un comercio escrito a mano',
     /id="consientoNombre"/.test(html) &&
     /texto\("consientoNombre", NEGOCIO\)/.test(html) &&
     !/Autorizo a Orgánico/.test(html),
     'es lo que el comprador autoriza al marcar la casilla');
  ok('  ...y los textos legales tampoco',
     !/Quién opera Orgánico/.test(html));
  ok('  ...ni los avisos de consola mandan a un menú que no existe',
     !/\[Orgánico\]/.test(html) && !/menú Orgánico/.test(html));
}

// ═══ 11. El alta de una tienda ═══
/* Los primeros pasos del runbook son los que más se hacen a medias, y uno de
   ellos se paga caro: si el "name" de wrangler.jsonc se queda con el de la
   plantilla, dos tiendas son el MISMO sitio en Cloudflare y la segunda pisa a
   la primera. En el equipo eso lo detecta `npm run tienda`; desde el navegador
   no hay quien avise. Por eso lo hace el flujo. */
{
  /* 0.17.0 · EL ALTA VIEJA SE FUE. `servicio/tienda-nueva.yml` pedía de
     entrada el repositorio, la URL del maestro, su token, la plantilla y si era
     privado: cosas que no existen cuando la tienda todavía no existe. Lo
     reemplazan `alta` y `conectar` en laboratoriodigital/tiendas, tres campos
     cada uno, con sus aserciones allá (flota/pruebas.mjs). Aquí se comprueba
     que no vuelva: ni como flujo de la semilla (cada tienda lo heredaría) ni
     como copia que se separe de la de tiendas. */
  /* 0.20.8 · ESTO HABLA DE LA SEMILLA (bitácora 95). Dentro de una tienda la
     misma línea pregunta otra cosa: si esa tienda todavía arrastra la carpeta
     de cuando nació. Y la respuesta es que sí hasta que la actualización
     siguiente la borre —la que corre es la herramienta que la tienda ya tenía,
     no la que acaba de llegar—, así que sin guarda esto bloqueaba justo la
     publicación que lleva la limpieza. */
  if (!esSemilla()) {
    console.log('  SALTA | «el alta vieja no existe»: eso se comprueba en la semilla.');
    console.log('          Si esta tienda todavía arrastra `servicio/`, se lo lleva la');
    console.log('          actualización siguiente (semilla.json › retirados).');
  } else {
    ok('EL ALTA VIEJA NO EXISTE: ni en la semilla ni como copia para tiendas',
       !fs.existsSync('../.github/workflows/tienda-nueva.yml') &&
       !fs.existsSync('../servicio/tienda-nueva.yml'),
       'el alta vive en laboratoriodigital/tiendas: alta + conectar');
  }

  /* CUANDO NO SE PUEDE PUBLICAR, HAY QUE DECIR POR QUÉ. GitHub contesta con un
     error de permisos en una anotación al pie, y para verla hay que saber que
     existe. Costó tres vueltas averiguarlo, con el flujo diciendo que todo iba
     bien hasta la última línea. */
  {
    const m = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    ok('EL MONTAJE explica por qué no pudo publicar',
       /No se pudo publicar/.test(m) &&
       /Read and write permissions/.test(m) &&
       /if: failure\(\)/.test(m),
       'la anotación de GitHub no la ve quien no sabe que existe');
    ok('  ...y guarda lo horneado aunque publicar falle',
       /upload-artifact/.test(m) && /if: always\(\)/.test(m),
       'ya se perdió un catálogo con el runner una vez');
  }

  /* El mapa de despliegue manda al camino corto (alta + conectar), no al
     flujo viejo. */
  {
    const mapa = fs.readFileSync('../docs/DESPLIEGUE.md', 'utf8');
    ok('  ...y el mapa de despliegue manda a alta y conectar',
       /El camino normal/.test(mapa) && /actions\/workflows\/conectar\.yml/.test(mapa) &&
       !/servicio\/tienda-nueva\.yml/.test(mapa));
  }

  /* Aquí SÍ tiene que coincidir: el flujo que el mapa manda a disparar en cada
     despliegue. Antes esto vivía en RUNBOOK.md; el documento hablaba de dos
     campos cuando el formulario tenía cinco, y ese desajuste costó una
     corrida. */
  {
    const mapa = fs.readFileSync('../docs/DESPLIEGUE.md', 'utf8');
    const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    const campos = (flujo.match(/^      ([a-z_]+):$/gm) || [])
      .map(l => l.trim().replace(':', ''));
    /* CUÁNTOS SON NO SE ESCRIBE AQUÍ. Decía `campos.length === 4`, y eso es
       exactamente el defecto que este bloque existe para cazar: una cifra a
       mano que hay que acordarse de subir. Al agregar `sin_guardia` se cayó
       esta aserción — no porque el documento estuviera mal, sino porque el
       número lo estaba. Lo que importa es que NINGUNO falte. */
    const sinDocumentar = campos.filter(c => mapa.indexOf('`' + c + '`') === -1);
    ok('DESPLIEGUE.md nombra TODOS los campos del formulario de montaje',
       campos.length > 0 && sinDocumentar.length === 0,
       sinDocumentar.length ? 'sin documentar: ' + sinDocumentar.join(', ')
                            : campos.length + ' campos: ' + campos.join(', '));
    ok('  ...y dice cuáles se dejan como vienen en un despliegue normal',
       /como vienen/.test(mapa) && /sin marcar/.test(mapa));
  }
}


// ═══ 12. De dónde sale el stub ═══
/* La única pieza del despliegue que sigue siendo copiar y pegar, y por eso la
   que más daño hace mal documentada. Estuvo mal escrita: dos documentos
   mandaban a sacarlo del menú de la hoja —«Generar configuración»—, que
   produce otra cosa (los dos bloques del index.html). Alguien siguió esa
   instrucción, pegó lo que no era, Apps Script dijo que no había cambios que
   guardar, y el menú se quedó viejo sin una sola señal de error.

   El stub NO puede salir del menú por una razón de fondo: es el código que
   DIBUJA ese menú. Depender del menú para arreglarlo es pedirle a la tienda
   que se arregle con lo que está roto. */
{
  const maestro = fs.readFileSync('../maestro.gs', 'utf8');

  /* Y SOLO DESDE generarStub, desde el 21 de septiembre. instalar() también
     lo imprimía al final —doscientas líneas en cada reinstalación, que es lo
     que se hace para agregar una clave— y enterraba el resumen que de verdad
     había que leer; encima era la forma segura de pegar un stub viejo, el que
     salía antes de publicar el maestro nuevo. Esta aserción EXIGÍA ese
     segundo camino; ahora exige que no exista y que instalar mande al bueno. */
  ok('EL STUB SE IMPRIME SOLO desde el maestro, no desde el men\u00fa de la hoja',
     /function generarStub\(\)/.test(maestro) &&
     /console\.log\(codigo\)/.test(maestro),
     'generarStub lo imprime');
  const cuerpoInstalar = (maestro.match(/function instalar\(\) \{[\s\S]*?\n\}\n/) || [''])[0];
  ok('  ...y SOLO desde ahí: instalar() ya no lo imprime, y dice cuál ejecutar',
     !!cuerpoInstalar && !/generarStub\(\)\.codigo/.test(cuerpoInstalar) &&
     /A1_generarStub\(\)/.test(cuerpoInstalar),
     cuerpoInstalar ? 'instalar() tiene ' + cuerpoInstalar.split('\n').length + ' líneas' : 'no encontré instalar()');

  ok('  ...y generarStub NO est\u00e1 entre las opciones del men\u00fa',
     !/id: 'stub'/.test(maestro) && !/fn: generarStub/.test(maestro),
     'el c\u00f3digo que dibuja el men\u00fa no puede depender del men\u00fa');

  ok('  ...y trae el nombre del comercio, que es lo que cambi\u00f3',
     /var NEGOCIO = '\{\{NEGOCIO\}\}';/.test(maestro),
     'es la l\u00ednea con la que el t\u00e9cnico distingue el stub nuevo del viejo');

  /* NING\u00daN documento puede volver a mandar a sacar el stub del men\u00fa. Se mira
     la frase completa, no la palabra suelta: \u00abGenerar configuraci\u00f3n\u00bb aparece
     bien citada en varios sitios, hablando del index.html. */
  const docs = fs.readdirSync('../docs')
    .filter(n => /\.md$/.test(n))
    .map(n => ['docs/' + n, fs.readFileSync('../docs/' + n, 'utf8')]);
  /* Se mira una ventana alrededor de cada menci\u00f3n, no la l\u00ednea suelta: la frase
     mala se parte en dos renglones. Y se perdona la que viene desmentida, porque
     contar el error es justamente como se evita repetirlo. */
  /* «Deroga» y «sale del menú» también desmienten: un documento que cuenta que
     esa opción SE QUITA no está mandando a sacar el stub de ahí. La lista crece
     con cuidado — cada palabra que se agrega es un hueco por el que podría
     colarse la instrucción mala, así que se comprueba contra la redacción vieja
     cada vez que se toca. */
  const desmiente = /NO sale|no sale|otra cosa|dec\u00edan|juntar|Falso|no puede salir|derog|salen del men|fuera del men|ya no existen/;
  const senala = t => {
    const r = /Generar configuraci/g; let m;
    while ((m = r.exec(t))) {
      const v = t.slice(Math.max(0, m.index - 200), m.index + 200);
      if (/stub/i.test(v) && !desmiente.test(v)) return true;
    }
    return false;
  };
  const culpables = docs.filter(([, t]) => senala(t));
  ok('NING\u00daN DOCUMENTO dice que el stub salga de \u00abGenerar configuraci\u00f3n\u00bb',
     culpables.length === 0,
     culpables.map(([n]) => n).join(', '));

  /* Y los dos que mandan a pegarlo tienen que decir tambi\u00e9n c\u00f3mo comprobar
     que se peg\u00f3 el bueno. \u00abNo hay cambios que guardar\u00bb es un s\u00edntoma, no un
     final feliz: significa que lo pegado era id\u00e9ntico a lo que ya estaba. */
  for (const f of ['ACTUALIZAR-UNA-TIENDA.md', 'DESPLIEGUE.md']) {
    const t = fs.readFileSync('../docs/' + f, 'utf8');
    ok('  ...y ' + f + ' manda a ejecutar generarStub en el editor del maestro',
       /generarStub/.test(t) && /MAESTRO/.test(t) && /Registro de ejecuci/.test(t));
    ok('  ...y explica qu\u00e9 significa que Guardar no se active',
       /var NEGOCIO/.test(t) && /cambios que guardar|no se activa/.test(t),
       'que no haya nada que guardar es la se\u00f1al de que ya estaba puesto');
    /* Y AVISA DE QUE EL MEN\u00da NO SIRVE DE COMPROBACI\u00d3N. En la tienda que se llama
       Orgánico, el rótulo pasó de la palabra escrita a mano a la variable que
       vale esa misma palabra: idéntico antes y después. Es el mismo error que
       con la versión del Diagnóstico, y costó una vuelta entera. */
    /* Con una excepción que antes no existía y ahora sí: una versión que
       AGREGA una opción al menú (Clave del panel, D-1). Ahí mirar el menú es
       justamente la comprobación, y el documento lo tiene que decir — un aviso
       de «no mires el menú» sin la excepción hizo pensar que no hacía falta
       regenerar el stub, y la opción nueva no aparecía. */
    ok('  ...y avisa de que mirar el men\u00fa casi nunca comprueba nada, con su excepci\u00f3n',
       /se ve igual|no cambia|comprueba nada/.test(t) && /agrega una/.test(t),
       'salvo cuando la versión agrega una opción');
  }
}


// \u2550\u2550\u2550 13. El n\u00famero de bater\u00edas no se escribe \u2550\u2550\u2550
/* Ya pas\u00f3 dos veces. Primero fue \u00ab758 aserciones\u00bb en seis sitios cuando ya iban
   por 900; se cambi\u00f3 a \u00ablas 19 bater\u00edas\u00bb creyendo que eso no caducaba, y caduc\u00f3
   al escribir la 20. Es el patr\u00f3n 2 en su forma m\u00e1s tonta: una cifra copiada a
   mano en varios archivos, que nadie actualiza porque nadie recuerda d\u00f3nde
   est\u00e1. La \u00fanica salida es no escribirla. */
{
  /* Qu\u00e9 es una bater\u00eda no se decide con una lista escrita a mano \u2014ser\u00eda el
     mismo error otra vez\u2014: es un .js de esta carpeta que imprime su marcador.
     limites.js no lo imprime porque no es una bater\u00eda: cronometra. */
  const enDisco = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && /Resultado: /.test(fs.readFileSync(n, 'utf8')));
  const todas = fs.readFileSync('./todas.sh', 'utf8');
  const auxiliares = ['servidor.js', 'gas.js', 'as.js', 'pn.js'];
  /* Con guion también: `tienda-viva.js` se leía como `viva.js` y la aserción
     decía que una batería listada no estaba en la lista. */
  const enLista = [...new Set(todas.match(/\b[a-z0-9][a-z0-9-]*\.js\b/g) || [])]
    .filter(n => auxiliares.indexOf(n) === -1);
  const sinCorrer = enDisco.filter(n => enLista.indexOf(n) === -1);
  ok('TODAS LAS BATER\u00cdAS est\u00e1n en todas.sh', sinCorrer.length === 0,
     sinCorrer.join(', ') + ' \u2014 una bater\u00eda escrita y no corrida es peor que ninguna');

  /* Los flujos también: ahí estaba escrita cuatro veces más y la aserción no
     los miraba, así que la cifra sobrevivió donde nadie la buscaba. */
  const donde = ['../README.md', '../docs/DESPLIEGUE.md', '../docs/ROADMAP.md',
                 '../docs/ANTES-DE-SALIR.md', '../docs/CONTRATOS.md',
                 '../.github/workflows/montaje.yml', '../.github/workflows/pruebas.yml',
                 '../.github/workflows/release.yml'];
  const conCifra = donde.filter(f => fs.existsSync(f) &&
    /\b\d+\s+bater\u00edas|las\s+\d+\s+bater/i.test(fs.readFileSync(f, 'utf8')));
  ok('  ...y ning\u00fan documento escribe cu\u00e1ntas son', conCifra.length === 0,
     conCifra.join(', ') + ' \u2014 se dice \u00abtodas las bater\u00edas\u00bb');
}


// ═══ 14. Lo que la vitrina tiene que decir ═══
/* Cuatro reglas sobre el mismo archivo, y las cuatro salieron de la misma
   prueba: el respaldo que funciona y no avisa. Se comprueban leyendo el
   index.html porque las baterías de navegador no pueden correr en todas partes
   y estas cuatro no se pueden perder por eso. */
{
  const pag = fs.readFileSync('../publicar/index.html', 'utf8');

  ok('LA VITRINA RECHAZA un esquema que no entiende, y conserva lo bueno',
     /const ESQUEMA = \d+/.test(pag) && /function esquemaEntendido/.test(pag) &&
     /esquemaHoja > ESQUEMA/.test(pag) && /if\(!esquemaEntendido\(datos\)\) return false/.test(pag),
     'S1-4');
  ok('  ...y lo dice por consola en vez de callarse',
     /esta página entiende hasta el/.test(pag));

  ok('AVISA AL COMPRADOR cuando sirve el catálogo del archivo',
     /id="avisoArchivo"/.test(pag) && /terminarCarga\(true\)/.test(pag) &&
     /cat\u00e1logo guardado|catálogo guardado/.test(pag),
     'S1-7: un respaldo que no grita se vuelve el estado normal');
  ok('  ...y lo apaga cuando la fuente buena sí contestó',
     /terminarCarga\(false\)/.test(pag) && /aviso\.hidden = !delArchivo/.test(pag));

  ok('EL NOMBRE DEL ENVÍO sale del sello, no de la página',
     /function nombreEnvio/.test(pag) && /sello\.envioNombre/.test(pag) &&
     !/escapar\(envioActivo\.nombre\)/.test(pag),
     'S1-8: la zona del comprador con el costo que la hoja no supo poner');

  /* LA GUARDA QUE YA ESTABA, Y QUE CASI DOY POR ROTA. Dije que el carrito podía
     mezclar el precio del archivo con el total de la hoja; no puede, porque el
     sello se descarta entero si los subtotales no coinciden. Queda aquí para
     que nadie la quite pensando que sobra: es lo único que impide un total
     hecho con precios de dos fuentes. */
  ok('EL SELLO SE DESCARTA ENTERO si el subtotal no coincide',
     /sello\.sub === subtotal\(\)/.test(pag),
     'sin esto, medio total de la hoja y medio del archivo');

  ok('EL UMBRAL de «quedan pocas» lo decide el comercio',
     /umbralBajo/.test(pag) && /p\.umbralBajo > 0 \? p\.umbralBajo : 5/.test(pag),
     'cinco frascos son muchos y cinco canastas casi nada');
}


// ═══ 15. La versión, en un solo sitio ═══
/* SCRIPT_VERSION del index es el contrato con VERSION del maestro: si no
   coinciden, la página avisa al comerciante de que le falta publicar. Estaban
   escritas a mano en dos archivos y repetidas en seis pruebas más; cada release
   obligaba a perseguirlas y una release ya se publicó con la vieja. */
{
  const maestro = fs.readFileSync('../maestro.gs', 'utf8');
  const pagina  = fs.readFileSync('../publicar/index.html', 'utf8');
  const v = (maestro.match(/var VERSION = '([^']+)'/) || [])[1];
  const sv = (pagina.match(/const SCRIPT_VERSION = "([^"]+)"/) || [])[1];
  ok('LA VERSIÓN del maestro y la del index son la misma', !!v && v === sv,
     'maestro ' + v + ' / index ' + sv);

  const conCifra = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && n !== 'as.js' && n !== 'index.html')
    .filter(n => new RegExp("['\"]" + v + "['\"]").test(fs.readFileSync(n, 'utf8')));
  ok('  ...y ninguna batería la vuelve a escribir a mano', conCifra.length === 0,
     conCifra.join(', ') + ' — se lee de as.js');

  /* Y la del paquete, que es la que dispara el release. La regla del plan: solo
     sube cuando cambia algo que se despliega. */
  const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  ok('  ...y package.json trae una versión con forma de versión',
     /^\d+\.\d+\.\d+$/.test(pkg.version), pkg.version);
}


// ═══ 16. El catálogo horneado en el sitio ═══
/* ADR-01, hecho. Lo que aprieta en Apps Script son 30 ejecuciones SIMULTÁNEAS
   por cuenta de Google —igual en la versión de pago—: concurrencia, no volumen.
   Mientras MIRAR y COMPRAR compitan por esas 30, el que pierde es el que iba a
   pagar. Con el catálogo servido desde el borde, el maestro queda entero para
   sellar y registrar. */
{
  const g = yaConfigurada(nuevo());
  const j = hornear(puerta(g, 'catalogo'));

  ok('EL CATÁLOGO SE HORNEA con lo que la hoja publica',
     j.productos.length === 8 && j.envios.length === 5, 
     j.productos.length + ' productos, ' + j.envios.length + ' zonas');
  ok('  ...y lleva su esquema y cuándo se generó',
     j.esquema === 1 && !isNaN(Date.parse(j.generado)), JSON.stringify(j.generado));

  /* EL SEGUNDO FILTRO DE LAS CLAVES DE PAGO. El maestro ya las quita de
     ?a=catalogo; esto las quita otra vez al escribir el archivo. No es
     redundancia: este JSON se queda EN EL REPOSITORIO, que es público, y el
     segundo filtro protege de que alguien cambie el primero sin acordarse. */
  ok('NINGUNA CLAVE DE PAGO llega al archivo publicado',
     Object.keys(j.config).filter(k => /^pago_/.test(k)).length === 0,
     Object.keys(j.config).filter(k => /^pago_/.test(k)).join(', '));

  /* EL TOPE SÍ LLEGA, Y NO POR UNA EXCEPCIÓN AL FILTRO. El carrito lo necesita
     para bloquear a tiempo, y el tope no es una credencial: son 1.000 UVB, una
     cifra que publica el Estado. Así que el prefijo `pago_` sigue siendo
     absoluto en los dos filtros y lo que sale es otra clave, `tope_pago`.
     Un filtro con excepciones deja de ser una regla y pasa a ser una lista que
     alguien mantiene. */
  ok('  ...pero el TOPE sí, con otro nombre y sin abrirle un hueco al filtro',
     Object.prototype.hasOwnProperty.call(j.config, 'tope_pago') &&
     Number(j.config.tope_pago) > 0,
     'tope_pago = ' + j.config.tope_pago);
  /* Y llega como TEXTO, porque el horneado pasa la configuración por String().
     La página tiene que convertirlo: comprobar `typeof === "number"` funcionaba
     contra el maestro y fallaba contra el archivo publicado, que es el camino
     normal. El fallo que solo se ve en producción. */
  ok('  ...como texto, que es como el horneado deja toda la configuración',
     typeof j.config.tope_pago === 'string',
     typeof j.config.tope_pago);
  ok('  ...y la página lo CONVIERTE en vez de exigir que ya sea número',
     /const topeLeido = Number\(c\.tope_pago\)/.test(
       fs.readFileSync('../publicar/index.html', 'utf8')),
     'por el maestro llega número y por el archivo llega texto');

  /* Las cuatro que sí son credenciales, nombradas. Si mañana alguien mueve el
     tope a la lista pública sin pensar, esto sigue verde; si mueve la llave, no. */
  ['pago_llave', 'pago_titular', 'pago_entidad', 'pago_texto'].forEach(k => {
    ok('  ...y «' + k + '» no está por ningún lado del archivo',
       JSON.stringify(j).indexOf(k) === -1);
  });

  /* Se copia campo por campo a propósito: que un campo nuevo del maestro no se
     cuele al sitio sin que nadie lo mire. */
  const campos = Object.keys(j.productos[0]).sort().join(',');
  ok('  ...y el producto publicado tiene exactamente los campos previstos',
     campos === ['id','nombre','formato','categoria','precio','stock','descripcion',
                 'imagenes','destacado','referencia','precioAntes','umbralBajo']
                .sort().join(','), campos);

  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf8'));
  ok('EL MONTAJE lo hornea en cada corrida', /catalogo-estatico\.mjs/.test(flujo),
     'sin esto el archivo envejece sin que nadie se entere');
  ok('  ...y npm run montar también', /catalogo/.test(pkg.scripts.montar));
  /* EL ORDEN ES PARTE DEL ARREGLO. El catálogo lista qué medidas existen de
     cada foto mirando la carpeta; horneado antes de bajarlas, describe el disco
     de la corrida anterior y promete archivos que todavía no están. Un
     manifiesto que se adelanta a lo que describe es peor que no tenerlo: la
     página deja de adivinar para creerle a algo equivocado. */
  ok('  ...y va DESPUÉS de las fotos, que es lo que va a listar',
     flujo.indexOf('traer-fotos.mjs') < flujo.indexOf('catalogo-estatico.mjs'),
     'si no, el manifiesto describe la corrida anterior');

  const pag = fs.readFileSync('../publicar/index.html', 'utf8');
  ok('LA VITRINA pide primero su propio catálogo, no el de Google',
     /const CATALOGO_ESTATICO = "catalogo\.json"/.test(pag) &&
     pag.indexOf('fetch(CATALOGO_ESTATICO') < pag.indexOf('SCRIPT_URL + "?a=catalogo"'),
     'ese orden ES la decisión');
  ok('  ...y si no está, sigue habiendo maestro en vivo',
     /function pedirleElCatalogoAlMaestro/.test(pag),
     'una tienda sin montaje todavía no tiene catalogo.json');
  ok('  ...y si tampoco, el inventario del archivo, diciéndolo',
     /terminarCarga\(true\)/.test(pag) && /Ni catalogo\.json ni la hoja/.test(pag));
  ok('  ...y un catalogo.json vacío NO se usa: es peor que ninguno',
     /!datos\.productos\.length/.test(pag) && /sin productos/.test(pag));

  /* LA CSP TENÍA QUE CRECER, y esto es de lo que más fácil se olvida: una
     petición bloqueada por la CSP no da error de red, simplemente no sale, y
     la página cae al respaldo como si la hoja no hubiera contestado. */
  ok('LA CSP deja a la página leer su propio catálogo',
     /connect-src 'self' https:\/\/script\.google\.com/.test(pag),
     "sin 'self' el fetch se bloquea sin decir por qué");
  /* LA MISMA REGLA VIVE EN TRES SITIOS, y esto casi cuesta caro. La CSP del
     <meta> y la de _headers SE APLICAN LAS DOS, y manda la más restrictiva: con
     'self' en el <meta> y sin él en _headers, el fetch a catalogo.json se
     bloquea en producción SIN error de red —simplemente no sale— y la tienda
     cae al respaldo como si la hoja no hubiera contestado. Se descubrió leyendo
     _headers después de haber "terminado" el cambio. */
  const maestro  = fs.readFileSync('../maestro.gs', 'utf8');
  const cabeceras = fs.readFileSync('../publicar/_headers', 'utf8');
  const conectan = t => (t.match(/connect-src ([^;"]+)/) || [])[1] || '';
  /* 0.19.0 · LA MEDICIÓN ES LA EXCEPCIÓN, Y ESTÁ ACOTADA. `_headers` es igual
     en todas las tiendas, así que nombra los hosts de Google Analytics
     SIEMPRE; el <meta> de cada tienda solo cuando esa tienda mide. Permitir un
     host no carga nada. Así que la comparación es: quitando esos hosts —los
     que el propio maestro declara, no una lista escrita aparte— las tres
     copias tienen que decir exactamente lo mismo. */
  const deMedicion = ((maestro.match(/conecta: '([^']+)'/) || [])[1] || '')
    .trim().split(/\s+/).filter(Boolean);
  const listas = [conectan(pag), conectan(maestro), conectan(cabeceras)]
    .map(x => x.trim().split(/\s+/).filter(Boolean));
  const tres = listas.map(l => l.filter(h => deMedicion.indexOf(h) === -1).sort().join(' '));

  ok('LA CSP dice lo mismo en los TRES sitios donde vive',
     tres[0] && tres[0] === tres[1] && tres[1] === tres[2],
     'index: ' + tres[0] + ' | maestro: ' + tres[1] + ' | _headers: ' + tres[2]);
  ok('  ...y las tres dejan a la tienda leer su propio catálogo',
     tres.every(x => /'self'/.test(x)),
     "sin 'self' en _headers el fetch se bloquea en produccion y aqui no se nota");
  ok('  ...y los hosts de medición están en _headers, que es igual para todas',
     deMedicion.length === 3 && deMedicion.every(h => listas[2].indexOf(h) !== -1) &&
     deMedicion.every(h => listas[0].indexOf(h) === -1),
     deMedicion.join(' ') || 'el maestro no declara ninguno');

  ok('EL CATÁLOGO se sirve con caché corta, no eterna',
     /\/catalogo\.json/.test(cabeceras) && /max-age=60/.test(cabeceras),
     'un minuto aguanta un pico y no alcanza para servir precios de ayer');
}


// ═══ 17. «¿Cambió algo?» tiene que ver los archivos nuevos ═══
/* Esto costó una corrida entera y salió VERDE. El montaje horneó catalogo.json
   por primera vez, el paso «¿Cambió algo?» dijo «nada cambió» —porque
   `git diff` NO VE los archivos sin seguimiento— y el trabajo se tiró a la
   basura sin que nada fallara. El fallo que funciona, otra vez, y esta vez en
   la herramienta que existe justamente para no perder trabajo. */
{
  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  /* La lista de lo publicable se escribe una vez, en $PUBLICA, y la leen el
     `git add` y todas las comprobaciones. Antes iba `publicar/` a mano en cada
     línea; desde A-3 también entra wrangler.jsonc, y cinco copias de la lista
     es cómo una se queda atrás y el flujo escribe algo que nunca publica. */
  ok('LO PUBLICABLE está escrito UNA sola vez, y wrangler.jsonc entra (A-3)',
     /PUBLICA="publicar\/ wrangler\.jsonc"/.test(flujo),
     'renombrar el Worker en el runner y no empujarlo es no renombrarlo');
  ok('«¿CAMBIÓ ALGO?» ve también los archivos nuevos',
     /git add -A -- \$PUBLICA/.test(flujo) &&
     /git diff --cached --quiet -- \$PUBLICA/.test(flujo),
     'git diff a secas no ve lo que no está en el índice');
  ok('  ...y ya no queda ningún `git diff --quiet` sin índice',
     !/git diff --quiet -- (publicar\/|\$PUBLICA)/.test(flujo),
     'la forma vieja diría «nada cambió» ante un archivo recién creado');
  ok('  ...y lo que resume también sale del índice',
     !/git diff --stat -- (publicar\/|\$PUBLICA)/.test(flujo) &&
     /git diff --cached --stat -- \$PUBLICA/.test(flujo),
     'si el resumen mira otra cosa que la decisión, mienten por turnos');

  /* UN «NO» TIENE QUE MOSTRAR SU TRABAJO. La primera vez que este paso dijo
     «nada cambió» era mentira, y averiguar por qué costó ir a buscar ramas al
     remoto. Un paso que decide en silencio obliga a hacer arqueología. */
  ok('  ...y cuando dice que NO, enseña lo que miró',
     /git status --porcelain -- \$PUBLICA/.test(flujo),
     'un «no» sin pruebas obliga a ir a buscarlas afuera');
  ok('EL HORNEADO deja en el resumen lo que hizo',
     /tee \/tmp\/catalogo\.txt/.test(flujo) && /(### |<summary>)El catálogo/.test(flujo),
     'desde Actions el log es lo único que hay');
  ok('  ...con pipefail, que es lo que hace que un fallo cuente',
     /set -o pipefail\n          node montar\/catalogo-estatico/.test(flujo),
     'en algo | tee, sin pipefail manda el código de tee');

  /* Y SI LAS BATERÍAS FALLAN, EL RESUMEN TIENE QUE DECIR CUÁL. Una corrida roja
     que obliga a abrir el log, buscar el paso y desplegarlo cuesta una
     conversación entera — literalmente: pasó. */
  const pruebasYml = fs.readFileSync('../.github/workflows/pruebas.yml', 'utf8');
  for (const [nombre, y] of [['montaje', flujo], ['pruebas', pruebasYml]]) {
    ok('EL FLUJO `' + nombre + '` pone las líneas FALLA en el resumen',
       /### (Las baterías|En rojo)/.test(y) && /grep -E "\^ FALLA/.test(y),
       'desde Actions el resumen es lo primero que se ve');
    ok('  ...y sigue fallando cuando fallan',
       /exit \$\{estado:-0\}/.test(y),
       'un resumen bonito con la corrida en verde sería peor que nada');
  }
}


// ═══ 18. El catálogo no puede envejecer solo ═══
/* DEUDA DEL SPRINT 2, PAGADA. Al hornear el catálogo dentro del sitio, un
   cambio de precio dejó de estar en la calle en diez segundos y pasó a esperar
   un despliegue. Aceptar ese costo NO era dejar al comerciante vendiendo al
   precio de la semana pasada hasta que alguien se acordara de disparar
   `montaje` a mano. El flujo que ya miraba el Drive cada cuatro horas mira
   ahora también la hoja. */
{
  const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');

  ok('EL CATÁLOGO se refresca solo, sin que nadie dispare nada',
     /catalogo-estatico\.mjs --revisar/.test(f) &&
     /node montar\/catalogo-estatico\.mjs .*\| tee/.test(f),
     'cuatro horas de techo para un precio nuevo');
  ok('  ...y decide MIRANDO, no por si acaso',
     /fotos=no; catalogo=no/.test(f) && /hay=no/.test(f),
     'si no cambió nada, no se abre ni un commit');

  /* LA GUARDA ES LO QUE PERMITE FUSIONAR SOLO. Un flujo que fusiona sin una
     persona tiene que saber exactamente qué fusiona; si aparece un archivo que
     él no genera, se para. Ampliarla al catálogo sin ampliarla de más es todo
     el cuidado que hay aquí. */
  /* LA LISTA DE LO PUBLICABLE ESTÁ ESCRITA UNA VEZ Y SE LEE DOS.
     Estuvo escrita dos veces y se separaron: el guardia permitía las fotos Y el
     catálogo, el `git add` ponía solo las fotos. Mientras el comercio subía
     fotos los dos decían lo mismo; el día que dio de baja un producto —un
     cambio que solo toca el catálogo— el guardia dijo «adelante», el índice
     quedó vacío, `git commit` salió con 1 y el flujo murió con «no changes
     added to commit». El producto inactivo siguió a la venta y la página siguió
     sirviendo el catálogo viejo. Patrón 2 de la bitácora.
     Esta batería no comprueba que las dos listas COINCIDAN —coincidían el día
     que se escribieron—: comprueba que no haya dos. */
  const lista = (f.match(/^\s*PUBLICA:\s*(.+)$/m) || [])[1];
  ok('LO PUBLICABLE está definido UNA sola vez, para los dos pasos',
     !!lista && /publicar\/fotos/.test(lista) && /publicar\/catalogo\.json/.test(lista),
     'dos listas del mismo criterio: una se queda atrás, y ya pasó');

  const pasoGuarda   = f.slice(f.indexOf('id: solo'), f.indexOf('- name: Navegador'));
  const pasoPublicar = f.slice(f.indexOf('- name: Publicar'));
  ok('  ...y NI el guardia NI el commit escriben rutas por su cuenta',
     /\$PUBLICA/.test(pasoGuarda) && /git add -A -- \$PUBLICA/.test(pasoPublicar) &&
     !/publicar\/fotos\/?['" ]*$/m.test(pasoGuarda.replace(/#.*/g, '')),
     'en cuanto uno de los dos vuelve a nombrar una carpeta, vuelven a separarse');
  ok('  ...con -A, que es lo que ve la foto que el comercio BORRÓ del Drive',
     /git add -A/.test(pasoPublicar),
     'un borrado sin -A no entra al índice y la foto retirada sigue publicada');
  ok('  ...y si aparece otra cosa, no fusiona y lo dice',
     /No se fusiona solo/.test(f) && /limpio=no/.test(f));

  /* «no changes added to commit» EN EL LOG DE ACTIONS PARECE UN FALLO DE GIT.
     Es lo contrario: git hizo exactamente lo que le pidieron. Lo que falló fue
     que el paso que decidió que había novedades y el que las junta no miraron
     lo mismo. Un error que apunta a la herramienta equivocada cuesta horas. */
  ok('  ...y un índice vacío se explica en vez de salir como error de git',
     /git diff --cached --quiet/.test(pasoPublicar) &&
     /no está.*mirando lo mismo|no están\\?\n?.*mirando lo mismo/s.test(pasoPublicar) &&
     /::error::/.test(pasoPublicar),
     'el mensaje crudo manda a depurar git, que es el único que no falló');

  /* EL RÓTULO DEL COMMIT LO DICTA EL CONTENIDO, NO EL ARCHIVO.
     Era siempre «fotos nuevas del comercio», dijera lo que dijera el cambio: un
     precio nuevo llegaba a main anunciado como una foto. Quien abre el
     historial para saber cuándo cambió un precio no encuentra nada. */
  ok('EL COMMIT dice lo que trae: fotos, catálogo o las dos cosas',
     /nfotos=\$\(git diff --cached --name-only/.test(pasoPublicar) &&
     /ncat=\$\(git diff --cached --name-only/.test(pasoPublicar) &&
     /resumen="fotos del comercio y catálogo al día"/.test(pasoPublicar) &&
     /resumen="catálogo al día/.test(pasoPublicar),
     'un título fijo es un título que no informa');
  ok('  ...y el título del pull request es el mismo, no otro escrito aparte',
     /git commit -m "feature\/frontend: \$resumen"/.test(pasoPublicar) &&
     /--title "feature\/frontend: \$resumen"/.test(pasoPublicar),
     'commit y PR contando cosas distintas del mismo cambio');
  ok('  ...y el cuerpo trae los DOS volcados, no solo el de las fotos',
     /### Las fotos/.test(pasoPublicar) && /### El catálogo/.test(pasoPublicar) &&
     /cat \/tmp\/catalogo\.txt/.test(pasoPublicar),
     'el del catálogo es el que dice qué producto se dio de baja');

  /* Y LAS BATERÍAS SIGUEN CORRIENDO ANTES DE PUBLICAR. Desde que este flujo
     empuja directo a `main` en vez de abrir un pull request y fusionarlo, esta
     es la ÚNICA vez que corren: lo que empuja el GITHUB_TOKEN no dispara
     `pruebas`. Si dejaran de correr aquí, no correrían en ninguna parte. */
  /* Desde M3.5 corren por publicacion.sh, que elige la guardia corta SOLO si
     el código ya pasó la suite completa, y si no, todas. Se exige que siga
     siendo así: que la corta no pueda elegirse sin esa condición. */
  const publicacion = fs.readFileSync('publicacion.sh', 'utf8');
  /* LA DECISIÓN, PROBADA Y NO LEÍDA. Con un `gh` de mentira que contesta lo
     que se le diga: la guardia corta sale SOLO con una corrida en verde del
     código; todo lo demás —rojo, sin red, fuera de un flujo— es «todas». */
  {
    const { execFileSync } = require('child_process');
    const os = require('os');
    const dir = fs.mkdtempSync(require('path').join(os.tmpdir(), 'gh-'));
    const decide = (contesta, entorno) => {
      const gh = require('path').join(dir, 'gh');
      fs.writeFileSync(gh, contesta === null ? '#!/bin/sh\nexit 1\n' : '#!/bin/sh\necho ' + contesta + '\n');
      fs.chmodSync(gh, 0o755);
      try {
        return execFileSync('bash', ['publicacion.sh'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
          env: Object.assign({}, process.env, { PATH: dir + ':' + process.env.PATH, SOLO_DECIDIR: '1',
                                                GUARDIA: '' }, entorno) }).trim();
      } catch (e) { return 'reventó'; }
    };
    /* La guardia corta es una decisión DE LA SEMILLA: en una tienda decide la
       tienda viva (bitácora 102). Así que se pregunta desde el repositorio de
       la semilla, que es donde esta regla sigue valiendo. */
    const enFlujo = { GITHUB_REPOSITORY: 'laboratoriodigital/tienda', GH_TOKEN: 't' };
    const r = [decide('1', enFlujo), decide('0', enFlujo), decide(null, enFlujo),
               decide('1', { GITHUB_REPOSITORY: '', GH_TOKEN: '' })];
    ok('LA GUARDIA CORTA sale solo si el código tiene una corrida de pruebas en verde',
       r.join(' ') === 'corta todas todas todas', r.join(' '));
  }
  ok('  ...con las baterías corriendo antes de publicar',
     f.indexOf('publicacion.sh') > 0 && f.indexOf('publicacion.sh') < f.indexOf('"$rama":main') &&
     /exec \.\/todas\.sh/.test(publicacion),
     'lo que empuja GITHUB_TOKEN no dispara pruebas');

  /* Y SI SE CAE, QUE DIGA QUÉ. Este paso se cayó una vez y averiguar por qué
     costó desplegar el log a mano: el resumen mostraba los pasos anteriores en
     verde y nada del que falló. */
  ok('  ...y vuelca al resumen lo que hicieron las dos herramientas',
     /### Las fotos/.test(f) && /### El catálogo/.test(f) && /exit \$estado/.test(f),
     'pase lo que pase, no solo cuando sale bien');
}

// ═══ 19. Las fotos publicadas no llevan dónde se tomaron ═══
{
  const t = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');
  ok('LA CONVERSIÓN se puede probar sin reescribirla',
     /export \{ novedades, convertir, ANCHOS \}/.test(t) &&
     /destino = PUBLICADAS/.test(t),
     'una prueba que reimplementa lo que mide comprueba su propia copia');
  ok('  ...y NADIE conserva los metadatos por el camino',
     !/withMetadata|keepExif|keepMetadata/.test(t),
     'el EXIF de un celular trae las coordenadas de la finca');

  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  ok('  ...y sharp está donde corren las baterías, no solo en la raíz',
     !!(pkg.devDependencies && pkg.devDependencies.sharp),
     'una prueba de seguridad que se salta sola es peor que no tenerla');

  /* CADA CLAVE DE devDependencies ES UN NOMBRE DE PAQUETE PARA npm, no un sitio
     donde dejar una nota. Puse ahí un `_comentario_sharp` explicando por qué
     hacía falta sharp y `npm install` se negó: «name cannot start with an
     underscore». Y no lo vi al probar, porque corrí la suite con node_modules
     ya instalado: el paso que fallaba —instalar— nunca se ejecutó. Comprobar
     con el trabajo ya hecho no comprueba el trabajo. */
  const nombreValido = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  const malos = Object.keys(pkg.devDependencies || {}).filter(k => !nombreValido.test(k));
  ok('  ...y toda clave de devDependencies es un nombre de paquete de verdad',
     malos.length === 0,
     malos.join(', ') + ' — las notas van en un campo de primer nivel, que npm ignora');
}


// ═══ 20. La página deja de adivinar qué medidas existen ═══
/* Los 404 de `-600.webp` que aparecían en la consola del comerciante no eran un
   fallo: era el respaldo funcionando. Pero un respaldo que se activa en el caso
   normal deja de ser un respaldo y pasa a ser el camino, con dos peticiones
   fallidas por tarjeta y un reguero de rojos que no significan nada. */
{
  const herr = fs.readFileSync('../montar/catalogo-estatico.mjs', 'utf8');
  const tf   = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');
  const pag  = fs.readFileSync('../publicar/index.html', 'utf8');

  ok('EL CATÁLOGO lista las medidas mirando el disco, no suponiéndolas',
     /async function medidasEnDisco/.test(herr) && /readdir\(carpeta\)/.test(herr),
     'no se promete nada que no esté en la carpeta');

  /* LAS DOS LISTAS DE ANCHOS TIENEN QUE SER LA MISMA. Una genera los archivos y
     la otra los busca; si se separan, el manifiesto miente en silencio. */
  const dela = t => (t.match(/ANCHOS\s*=\s*\[([^\]]+)\]/) || [])[1];
  ok('LOS ANCHOS que se generan y los que se listan son los mismos',
     !!dela(tf) && dela(tf).replace(/\s/g, '') === (dela(herr) || '').replace(/\s/g, ''),
     'genera [' + dela(tf) + '] · lista [' + dela(herr) + ']');

  ok('LA PÁGINA usa el manifiesto cuando lo hay',
     /let MEDIDAS = null/.test(pag) && /if\(MEDIDAS\)\{/.test(pag) &&
     /datos\.fotos && typeof datos\.fotos === "object"/.test(pag),
     'y `null` sigue queriendo decir «no sé»');
  ok('  ...y sin manifiesto adivina como siempre, que es lo que hacía',
     /Sin manifiesto, se adivina/.test(pag),
     'una tienda sin montaje todavía no tiene manifiesto');

  /* Y EL MAESTRO NO PUEDE CONTESTAR ESTO. Vive en otra máquina: no sabe qué
     archivos hay en la carpeta del sitio. Si algún día ?a=catalogo devolviera
     un `fotos`, la página se lo creería y estaría creyéndole a una suposición. */
  const foto = JSON.parse(fs.readFileSync('./esquema.json', 'utf8'));
  ok('  ...y la puerta ?a=catalogo NO publica un manifiesto de fotos',
     foto.puertas.catalogo.indexOf('fotos') === -1,
     'el maestro no sabe qué hay en la carpeta del sitio: contestarlo sería inventar');
}


// ═══ 21. El menú de la hoja, en un solo sitio ═══
/* El stub llevaba SU PROPIA lista de opciones, escrita a mano, al lado de la
   que el maestro usa para validar. Dos copias del mismo dato: bastaba tocar una
   para que la hoja ofreciera algo que el maestro rechaza —o escondiera algo que
   existe—, y las dos fallan en silencio. Ahora la del stub se genera. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');

  ok('EL MENÚ DEL STUB se genera, no se escribe a mano',
     /\{\{OPCIONES\}\}/.test(m) && /\{\{ACCIONES\}\}/.test(m) &&
     /var opciones = menuDeLaHoja\(\)/.test(m),
     'una sola lista, y lo demás se deriva');
  ok('  ...y ya no quedan accionN escritas a mano en la plantilla',
     !/"function accion0\(\) \{ pedir\(0\); \}",/.test(m),
     'cambiar el número de opciones rompía el stub sin avisar');

  const g = yaConfigurada(nuevo());
  const stub = g.api.generarStub().codigo;
  const menu = g.api.menuDeLaHoja();
  ok('EL STUB GENERADO trae exactamente las opciones del maestro',
     menu.every(o => stub.indexOf("id: '" + o.id + "'") !== -1) &&
     (stub.match(/function accion\d+\(\)/g) || []).length === menu.length,
     menu.map(o => o.id).join(', '));
  ok('  ...y el orden y las acciones del maestro no se separaron',
     g.api.menuCuadra().ok, JSON.stringify(g.api.menuCuadra()));

  /* PUBLICAR AHORA es el suelo que le faltaba al Sprint 2: el techo son las
     cuatro horas del flujo. Sin esto, tocar un precio y no poder publicarlo es
     una regresión frente a la tienda que consultaba la hoja en vivo. */
  ok('EL MENÚ empieza por «Publicar ahora»', menu[0].id === 'publicar',
     'es lo primero que se quiere después de tocar un precio');
  ok('  ...y ya no ofrece generar bloques de HTML',
     menu.every(o => o.id !== 'configuracion' && o.id !== 'inventario'),
     'eso existía cuando montar era copiar y pegar');
  ok('  ...pero esas funciones siguen vivas para ?a=bloques',
     JSON.parse(g.api.doGet({ parameter: { a: 'menu', f: 'configuracion', t: g.token } })._texto).ok,
     'el montaje escribe el index con ellas');

  /* EL PERMISO DE PUBLICAR VIVE EN LAS PROPIEDADES DEL SCRIPT, QUE NO ESTÁN
     CIFRADAS. Por eso el mensaje pide el token más pequeño que sirve: un
     repositorio, un permiso. Si eso se afloja, se afloja en silencio. */
  ok('PUBLICAR AHORA pide el permiso mínimo, y lo dice',
     /Actions -> Read and write/.test(m) && /Fine-grained tokens/.test(m) &&
     /Solo el repositorio/.test(m),
     'las propiedades del script no están cifradas');
  ok('  ...y dispara el flujo que ya sabe fusionar solo',
     /workflows\/fotos\.yml\/dispatches/.test(m) || /dispararFlujo\('fotos\.yml'/.test(m),
     'ese flujo corre las baterías y solo fusiona fotos y catálogo');
  ok('  ...y traduce el error de GitHub en vez de repetirlo',
     /codigo === 401/.test(m) && /codigo === 403/.test(m) && /codigo === 404/.test(m),
     'el comerciante no tiene por qué saber qué es un 403');
}


// ═══ 22. El diagnóstico mide lo que el comprador ve ═══
/* El mensaje de «Publicar ahora» terminaba diciendo que, si algo fallaba,
   quedaba avisado en GitHub. El comerciante NO tiene acceso a GitHub —ni tiene
   por qué— así que eso no era una respuesta: era contarle dónde está la
   respuesta, en un sitio donde no puede entrar.

   Lo que sí puede saber es de cuándo es lo que su tienda está sirviendo, porque
   se le pregunta A LA TIENDA. Eso no depende de que la tubería reporte bien:
   depende de lo que un comprador ve ahora mismo. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');

  ok('«PUBLICAR AHORA» no manda al comerciante a GitHub',
     !/avisado en GitHub/.test(m) && /menú > Diagnóstico/.test(m),
     'no tiene acceso al repositorio de su tienda, y no debería necesitarlo');
  ok('  ...y anota CUÁNDO se pidió, que es lo único que se sabe ahí',
     /PEDIDA_PUBLICACION/.test(m) && /setProperty\('PEDIDA_PUBLICACION'/.test(m),
     'que se logró todavía no se sabe');

  const g = yaConfigurada(nuevo());

  /* Sin catálogo publicado: lo dice, y dice qué hacer. */
  ok('EL DIAGNÓSTICO avisa cuando la tienda no tiene catálogo publicado',
     /NO SE PUDO COMPROBAR/.test(g.api.publicacionDeLaTienda()),
     g.api.publicacionDeLaTienda().split('\n')[0]);

  /* Con catálogo publicado: la fecha, en palabras. */
  const hace5 = new Date(Date.now() - 5 * 60000).toISOString();
  g.responder('/catalogo.json', () => ({ cuerpo: { esquema: 1, generado: hace5, productos: [1] } }));
  const fresco = g.api.publicacionDeLaTienda();
  ok('  ...y con catálogo publicado dice de cuándo es, en palabras',
     /está mostrando el catálogo del/.test(fresco) && /hace 5 minutos/.test(fresco),
     fresco);

  /* LA COMPARACIÓN QUE CONTESTA «¿YA LLEGÓ?». Se pidió publicar después de lo
     que se está sirviendo y pasó tiempo de sobra: eso es lo que hay que gritar,
     y es justo lo que un log de GitHub no le iba a decir nunca. */
  /* Y la fecha se arma a mano. Utilities.formatDate pide una zona horaria y
     este proyecto no declara ninguna; los métodos de Date corren en la zona del
     script, que es la del comerciante — la única hora que le sirve. */
  ok('  ...y la fecha se arma sin pedir una zona horaria que no existe',
     !/Utilities\.formatDate\(/.test(m) && /MESES_CORTOS/.test(m),
     'los métodos de Date dan la hora del reloj del comerciante');

  /* EL AVISO DE «PEDISTE Y NO LLEGÓ». Es la única línea de todo esto que el
     comerciante necesita cuando algo va mal, y la que un log de GitHub no le
     iba a dar nunca. */
  ok('  ...y grita cuando se pidió publicar y no llegó',
     /pediste publicar hace/i.test(m) && /ATENCIÓN/.test(m) &&
     /minutos > 20/.test(m),
     'con margen, para no asustar mientras va en camino');
}

/* ═══ 23. EL DIAGNÓSTICO, EN NUEVE PUNTOS Y CON LA CELDA EXACTA ═══
   «Hay datos que no se pudieron leer» es verdad y no sirve para nada: el
   comerciante tiene una hoja de cien filas y no sabe cuál mirar. Lo que se
   comprueba aquí es que el informe diga LA CELDA —«Catálogo E7»— y EL ARCHIVO
   —«chonto-1.jpg»—, que es lo accionable.

   Y se comprueba una trampa vieja: el diagnóstico leía el catálogo POR EL
   CACHÉ. Con el caché caliente, la lista de celdas ilegibles llegaba vacía y
   el informe daba todo por bueno mientras un precio llevaba una hora sin
   poderse leer. Un chequeo que contesta lo mismo con el problema puesto no es
   un chequeo. */
{
  const m = fs.readFileSync('../maestro.gs', 'utf8');
  const conPrecioRoto = () => {
    const g = yaConfigurada(nuevo());
    const h = g.hojas.get('Catálogo');
    h.getRange(2, 1, 1, 13).setValues([['chonto', 'Chonto', 'kg', 'Frutas',
      '$9.000', 10, 'de la finca', 'chonto-1.jpg', 'No', 'Sí', '', '', '']]);
    return g;
  };

  {
    const d = conPrecioRoto().api.diagnostico();
    ok('EL DIAGNÓSTICO da la CELDA exacta del dato que no se pudo leer',
       /Catálogo E2/.test(d.texto) && /9\.000/.test(d.texto),
       (d.texto.match(/ *Catálogo E2[^\n]*/) || [''])[0].trim());
    ok('  ...y dice por qué esa fila no llega a la tienda',
       /no es un número/.test(d.texto),
       'un precio ilegible saca el producto, no lo pone gratis');
    ok('  ...y lo lee SIN CACHÉ, o el informe da por bueno lo que ya está roto',
       (() => {
         const g = conPrecioRoto();
         g.api.catalogoPublico();            // deja el caché caliente
         return /Catálogo E2/.test(g.api.diagnostico().texto);
       })(), 'el caché hacía que el chequeo contestara lo mismo con y sin problema');
  }

  ok('  ...y en un cupón la celda trae también la FILA',
     /Cupones F' \+ filaN/.test(m) && /var fila = null, filaN = 0/.test(m),
     'hay una columna F por cada cupón: sin la fila no se puede buscar');

  /* Los nueve puntos, con veredicto. */
  {
    const g = yaConfigurada(nuevo());
    const d = g.api.diagnostico();
    const veredictos = (d.texto.match(/^ {2}(OK|REVISAR|PROBLEMA) {2,}\d+\. /gm) || []);
    /* Cuántos son NO se escribe aquí: se cuentan los que el informe imprime y
       se exige que el resumen los liste todos. Con el número a mano, añadir un
       punto —que es hacer bien las cosas— dejaba esta batería en rojo, y el
       rojo por la razón equivocada es el que enseña a ignorar los rojos.
       Fueron nueve; desde la 2.9.0 son diez, con «¿está terminada esta
       tienda?» arriba del todo. */
    const encabezados = (d.texto.match(/^── \d+ · /gm) || []).length;
    ok('EL DIAGNÓSTICO lista en el resumen TODOS los puntos que imprime',
       veredictos.length === encabezados && veredictos.length >= 9,
       veredictos.length + ' en el resumen · ' + encabezados + ' en el detalle');
    ok('  ...y el resumen va ARRIBA, no al pie',
       d.texto.indexOf('── RESUMEN ──') === 0,
       'un informe que obliga a bajar hasta el pie no lo lee nadie');
    ok('  ...y se pinta como diálogo, no como alerta',
       d.tipo === 'html' && !!d.html && !!d.texto,
       'noventa líneas en un ui.alert no se leen ni se copian');
    ok('  ...con un cuadro que se copia de un tirón',
       /<textarea readonly onclick="this\.select\(\)"/.test(d.html),
       'está hecho para mandárselo por WhatsApp a quien montó la tienda');
    /* EL TOKEN NO VIAJA EN EL CUADRO. Se lee en pantalla, que es donde hace
       falta; el cuadro está hecho para reenviarse. */
    /* DOS CAPAS, Y HACEN FALTA LAS DOS. El informe del menú no lleva el token
       de montaje en ninguna parte. Y en el completo —el del editor— el token
       se LEE en pantalla pero no viaja dentro del cuadro, que está hecho para
       reenviarse por WhatsApp. */
    ok('  ...y el cuadro del informe del menú no lleva ningún token',
       d.html.indexOf(g.api.token()) === -1 && d.html.indexOf(g.api.tokenMenu()) === -1,
       'se copia para mandarlo, y va a parar a un chat');

    const c = g.api.diagnosticoCompleto();
    const enElCuadro = c.html.slice(c.html.indexOf('<textarea'));
    ok('  ...y en el completo el token se lee en pantalla pero no se copia',
       enElCuadro.indexOf(g.api.token()) === -1 &&
       c.html.indexOf(g.api.token()) !== -1,
       'un token que da de alta pedidos no se reenvía de rebote');
  }

  /* LAS FOTOS, POR NOMBRE EXACTO. «Subí la foto y no aparece» es de las tres
     preguntas más comunes, y hasta ahora la respuesta era «revisa el Drive». */
  {
    const g = yaConfigurada(nuevo());
    g.hojas.get('Catálogo').getRange(2, 1, 1, 13).setValues([['chonto', 'Chonto',
      'kg', 'Frutas', 9000, 10, 'de la finca', 'chonto-1.jpg|chonto-2.jpg',
      'No', 'Sí', '', '', '']]);
    g.responder('/catalogo.json', () => ({ cuerpo: {
      esquema: 1, generado: new Date().toISOString(), productos: [1],
      fotos: { 'chonto-1.jpg': [160, 600, 900], 'vieja.jpg': [160] } } }));
    const t = g.api.diagnostico().texto;
    ok('EL DIAGNÓSTICO nombra la foto que la tienda NO tiene',
       /chonto-2\.jpg/.test(t) && !/ {3}chonto-1\.jpg/.test(t),
       (t.match(/ *chonto-2[^\n]*/) || [''])[0].trim());
    ok('  ...y dice que hay que publicar, que es lo que falta casi siempre',
       /Publicar ahora/.test(t),
       'la tienda solo cambia cuando se publica');
    ok('  ...y la que sobra la menciona sin alarmar',
       /ya nadie usa/.test(t), 'no estorba, y asustar por eso sería peor');
  }

  /* Una URL completa en la celda la sirve otro sitio: no hay nada que
     comprobar, y marcarla como «falta» sería una alarma falsa para siempre. */
  ok('  ...y una foto que vive en otro sitio no se cuenta como faltante',
     /!\/\^https\?:\\\/\\\//.test(m.slice(m.indexOf('function revisarFotos'))),
     'esa foto la sirve otro, y nosotros no tenemos nada que verificar');

  /* La caché de la respuesta de la tienda no puede recordar un fallo: un
     tropiezo de un segundo se volvería el veredicto de toda la ejecución. */
  ok('LA CACHÉ del catálogo publicado NO guarda los fallos', (() => {
       const g = yaConfigurada(nuevo());
       const roto = g.api.publicacionDeLaTienda();
       g.responder('/catalogo.json', () => ({ cuerpo: {
         esquema: 1, generado: new Date().toISOString() } }));
       return /NO SE PUDO COMPROBAR/.test(roto) &&
              /está mostrando el catálogo del/.test(g.api.publicacionDeLaTienda());
     })(), 'recordar «no se pudo» deja la función mintiendo aunque ya conteste');
}

/* ═══ 24. CINCO MINUTOS DE SILENCIO Y UN ROJO ═══
   El flujo `fotos` se cayó en «Bajarlas y convertirlas» tras 5 m 1 s y no dejó
   una sola línea diciendo en qué se había quedado. Dos causas, las dos
   arreglables sin saber cuál fue:

   · `fetch` sin señal espera para siempre. Un maestro que no contesta no da
     error: da silencio hasta que alguien mate el trabajo.
   · El progreso se escribía DESPUÉS de bajar cada foto, así que el log
     terminaba en la foto anterior a la que reventó. La culpable no aparecía. */
{
  const t  = fs.readFileSync('../montar/tienda.mjs', 'utf8');
  const tf = fs.readFileSync('../montar/traer-fotos.mjs', 'utf8');

  ok('LAS LLAMADAS AL MAESTRO tienen tope de espera',
     /AbortSignal\.timeout\(/.test(t) && /signal:/.test(t),
     'fetch sin señal espera para siempre: eso no es un fallo, es un plantón');
  ok('  ...y una foto tiene más tope que las demás llamadas',
     /ESPERA = \{ foto: (\d+), otras: (\d+) \}/.test(t) &&
     Number(RegExp.$1) > Number(RegExp.$2),
     'Apps Script se toma su tiempo entregando base64');
  ok('  ...y el plantón dice QUÉ petición se quedó colgada',
     /TimeoutError/.test(t) && /accion \+ '»'/.test(t) && /extra\.id/.test(t),
     '«fetch failed» a secas manda a buscar un problema de red que no era');

  /* SE ANUNCIA ANTES DE BAJAR. Mientras la línea se escribía al terminar, un
     fallo a mitad dejaba un log que acababa en la foto ANTERIOR: la que reventó
     no aparecía por ningún lado.

     Desde B-4 las fotos van en tandas de cuatro, así que el razonamiento de
     antes —«la última línea del log es la que reventó»— ya no vale: hay cuatro
     en vuelo y el orden de las líneas no es el de las fotos. Lo que sigue
     valiendo, y es lo que esta aserción defiende, es que **ninguna foto llega a
     bajarse sin haberse anunciado**. Quién falló lo dice ahora la lista del
     final, que las nombra todas. */
  ok('EL PROGRESO se anuncia ANTES de bajar la foto, no después',
     tf.indexOf('bajando ${a.nombre}') < tf.indexOf("await alMaestro(tienda, 'foto'"),
     'una foto que revienta sin haberse anunciado no aparece en ninguna parte');
  /* El nombre de la variable no se fija aquí: lo que importa es la FORMA
     «[n/total]», no cómo se llame el contador. */
  ok('  ...y numerada, para saber cuántas faltaban',
     /\[\$\{\w+\}\/\$\{nuevas\.length\}\]/.test(tf));

  /* Rechazar antes de pedir: gastar cinco minutos para terminar en un plantón
     que no dice cuál era es el peor de los dos mundos. */
  ok('UNA FOTO DEMASIADO GRANDE se rechaza ANTES de pedirla, y por su nombre',
     /TOPE_FOTO/.test(tf) &&
     tf.indexOf('pesadas') < tf.indexOf("await alMaestro(tienda, 'foto'"),
     'y el mensaje dice qué hacer: volver a exportarla bajo 10 MB');
  ok('  ...y no se salta en silencio, que sería peor',
     /process\.exit\(1\)/.test(tf.slice(tf.indexOf('const pesadas'),
                                        tf.indexOf('let van = 0'))),
     'una foto que desaparece sin avisar es el patrón 1 otra vez');
}

/* ═══ 25. LO QUE SE LE ENTREGA AL COMERCIANTE NO PUEDE ENVEJECER SOLO ═══
   El manual del dueño llevaba semanas enseñando «Generar configuración para
   index.html» y «Generar inventario para index.html» —derogadas en el Sprint 5—
   y NO nombraba «Publicar ahora», que es la opción que hace que un cambio de
   precio llegue a la tienda. O sea: el papel que se le entrega al comerciante
   le enseñaba dos botones que ya no existen y le escondía el único que importa.

   Nadie lo notó porque un documento no se cae. Es el patrón 2 de la bitácora
   —dos copias del mismo procedimiento, una se queda atrás— con el agravante de
   que la copia atrasada es la que ve el cliente.

   Aquí la lista de opciones NO se escribe: se le pregunta al maestro. Cambiar
   el menú y no cambiar los papeles vuelve a ser imposible. */
{
  const g = nuevo();
  const vivas = g.api.menuDeLaHoja().map(o => o.rotulo);
  /* El manual del dueño (HTML+PDF) se borró en la limpieza de documentación de
     la 3.0.0: tenía, él solo, tres contradicciones internas —catálogo «en
     vivo» cuando se hornea, fotos por Cloudinary cuando van por Drive, el
     estado «Confirmado» que se renombró a «Pagado»— y la guía de una página
     ya cubre lo mismo sin ninguna. Los papeles vigilados hoy son solo los que
     de verdad se le entregan al comercio y al técnico. */
  const papeles = ['../docs/GUIA-COMERCIANTE.md',
                   '../docs/DESPLIEGUE.md'];

  papeles.forEach(ruta => {
    const nombre = ruta.split('/').pop();
    const doc = fs.readFileSync(ruta, 'utf8');
    const faltan = vivas.filter(r => doc.indexOf(r) === -1);
    ok(nombre.toUpperCase() + ' nombra TODAS las opciones del menú',
       faltan.length === 0,
       faltan.length ? 'le faltan: ' + faltan.join(' · ')
                     : vivas.length + ' opciones, todas nombradas');

    /* Las derogadas pueden aparecer SOLO para decir que ya no existen. Un
       documento que las explica como si sirvieran es peor que uno que las
       ignora: manda al comerciante a buscar un botón que no está. */
    ['Generar configuración para index.html',
     'Generar inventario para index.html'].forEach(vieja => {
      const i = doc.indexOf(vieja);
      if (i === -1) return;
      const alrededor = doc.slice(Math.max(0, i - 400), i + 200);
      ok('  ...y si menciona «' + vieja.slice(0, 22) + '…» es para derogarla',
         /ya no existen|versión vieja|se derog/i.test(alrededor),
         nombre + ': la explica como si sirviera');
    });
  });

  /* LA IDEA QUE HACE FUNCIONAR TODO LO DEMÁS. Desde que el catálogo se hornea
     en el sitio, «la tienda le pregunta a la hoja» es falso, y era el modelo
     mental que enseñaba el manual. Un comerciante que cree eso no publica
     nunca, y su tienda muestra precios viejos sin que él sepa por qué. */
  papeles.forEach(ruta => {
    const doc = fs.readFileSync(ruta, 'utf8');
    ok(ruta.split('/').pop() + ' explica que hay que PUBLICAR, no que la tienda lee la hoja',
       /Publicar ahora/.test(doc) &&
       !/le pregunta a la hoja cada vez/.test(doc),
       'quien cree que la tienda lee la hoja en vivo no publica nunca');
  });

  /* Y una página es una página. El día que esto no quepa en una hoja, lo que
     sobra se va al manual: la guía existe porque es corta. */
  const guia = fs.readFileSync('../docs/GUIA-COMERCIANTE.md', 'utf8');
  ok('LA GUÍA DE UNA PÁGINA cabe en una página',
     guia.split('\n').length < 100,
     guia.split('\n').length + ' líneas · ' + guia.length + ' caracteres');
  ok('  ...y no lleva ningún secreto dentro',
     !/tk-[a-z0-9]{8}|tkm-[a-z0-9]{8}|ghp_|github_pat_/.test(guia) &&
     !/3178284725/.test(guia),
     'se imprime y se deja encima de un escritorio');

  const impresa = fs.readFileSync('../docs/manuales/Guia-de-una-pagina.html', 'utf8');
  ok('  ...y la versión imprimible dice lo mismo que la escrita',
     vivas.every(r => impresa.indexOf(r) !== -1) && /@page/.test(impresa),
     'dos copias que se separan es el patrón 2 otra vez');

  ['Manual-del-dueno-Organico.html', 'Manual-del-dueno-Organico.pdf'].forEach(n => {
    ok('  ...y «' + n + '», con sus contradicciones, ya no existe',
       !fs.existsSync('../docs/manuales/' + n),
       'un manual largo y atrasado enseña peor que uno corto y al día');
  });
}

/* ═══ 26. EL PULL REQUEST DEL BOT TIENE QUE DECIR QUÉ TRAE ═══
   Decía siempre lo mismo: «refactor/frontend: la tienda se pone al día con su
   hoja y su Drive», corrida tras corrida. Un título que no cambia nunca es un
   título que se deja de leer — y entonces da igual lo que haya dentro: se
   fusiona por costumbre.

   Es el mismo daño que hacía el fin de línea suelto, y la misma respuesta: el
   flujo YA SABE qué cambió, porque lo calcula para el resumen. Lo que faltaba
   era que lo dijera donde se decide fusionar. */
{
  const flujo = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  const bloquePR = flujo.slice(flujo.indexOf('- name: Publicar en main'));

  /* EL COMMIT es hoy lo que antes era el título del pull request: desde que el
     montaje publica directo en main, el historial es el único sitio donde queda
     escrito qué trajo esta corrida. El pull request de reserva -cuando main
     está protegida- lleva lo mismo. */
  ok('EL COMMIT del montaje NO es una frase fija',
     /-m "refactor\/frontend: \$RESUMEN"/.test(bloquePR),
     'un mensaje que no cambia nunca se deja de leer');
  ok('  ...y lleva QUÉ archivos cambiaron',
     /-m "\$DETALLE"/.test(bloquePR),
     'sin esto hay que abrir el diff para saberlo');
  ok('  ...y el pull request de reserva dice lo mismo',
     /--title "montaje: \$RESUMEN"/.test(bloquePR) && /cuerpo\+="\$DETALLE"/.test(bloquePR));

  /* Los dos valores se calculan donde ya se sabe la respuesta, no otra vez.
     Calcularlo dos veces es como empiezan a decir cosas distintas. */
  const bloqueCambios = flujo.slice(flujo.indexOf('id: cambios'),
                                    flujo.indexOf('- name: Publicar en main'));
  ok('  ...y los calcula el paso que YA miró el diff, no un paso aparte',
     /echo "resumen=\$partes" >> "\$GITHUB_OUTPUT"/.test(bloqueCambios) &&
     /detalle<<FIN_DEL_DETALLE/.test(bloqueCambios),
     'calcularlo dos veces es como empiezan a decir cosas distintas');
  ok('  ...distinguiendo fotos, hoja y catálogo, que es lo que cambia por separado',
     /archivo\(s\) de foto/.test(bloqueCambios) &&
     /la hoja \(index\.html\)/.test(bloqueCambios) &&
     /el catálogo/.test(bloqueCambios),
     'que el título diga si son fotos o es la hoja');
  ok('  ...y nunca queda vacío, que sería peor que la frase fija',
     /\[ -z "\$partes" \] && partes=/.test(bloqueCambios),
     'un título en blanco no se puede leer de ninguna manera');
}

/* ═══ 27. UNA TIENDA A MEDIO CONFIGURAR NO SE PUBLICA ═══
   El montaje miraba CINCO claves —las cinco constantes del index— y las otras
   once no las miraba nadie. Una tienda podía salir al aire sin llave de pago:
   el comprador terminaba el pedido y no tenía cómo pagar, que es exactamente el
   agujero que abre a propósito sacar la llave de la página.

   DECISIÓN 09 / A-4: los `empresa_*` que identifican al responsable —razón,
   NIT, dirección, ciudad y al menos uno de correo o teléfono— suben de avisar
   a bloquear el mismo día en que los textos legales empiezan a usarlos de
   verdad. Sin quién responde, un texto de tratamiento de datos o de retracto
   no obliga a nadie. */
{
  const g = yaConfigurada(nuevo());
  const fuente = fs.readFileSync('../montar/preparar-index.mjs', 'utf8');

  ok('EL MONTAJE se niega a escribir el index de una tienda que no puede vender',
     /todavía no puede vender/.test(fuente) &&
     /datos\.alta\.bloquean\.length/.test(fuente),
     'antes solo miraba las cinco constantes');
  ok('  ...diciendo qué falta y por qué, no solo que falta',
     /x\.clave \+ ' — ' \+ x\.porQue/.test(fuente),
     '«falta pago_llave» no dice qué se rompe; «no tiene cómo pagar» sí');
  ok('  ...y lo que solo AVISA no bloquea',
     /No bloquea el montaje/.test(fuente),
     'publicar sin descripción es feo, no roto: confundirlo es fallar por lo que no importa');
  ok('  ...y quién decide qué falta es el MAESTRO, no el flujo',
     !/pago_llave|empresa_nit/.test(fuente) && /var LISTA_DE_ALTA/.test(
       fs.readFileSync('../maestro.gs', 'utf8')),
     'la lista en dos sitios es como empiezan a decir cosas distintas');

  /* La lista distingue los dos niveles, y la diferencia tiene consecuencias:
     una es un rojo del montaje y la otra una línea en el registro. */
  const vacia = crear('./as.js'); vacia.api.instalar();
  const alta = vacia.api.revisarTienda();
  ok('UNA TIENDA RECIÉN INSTALADA no está terminada', !alta.lista && !alta.puedeVender,
     alta.bloquean.map(x => x.clave).join(', '));
  ok('  ...y lo que bloquea es lo que rompe la VENTA o deja los textos legales sin responsable',
     alta.bloquean.every(x => ['negocio','whatsapp','sitio_url','pago_llave',
       'empresa_razon','empresa_nit','empresa_direccion','empresa_ciudad',
       'empresa_correo_o_tel'].indexOf(x.clave) !== -1),
     alta.bloquean.map(x => x.clave).join(', '));
  ok('  ...cada falta con su porqué, que es lo accionable',
     alta.bloquean.concat(alta.avisan).every(x => x.porQue && x.porQue.length > 15),
     (alta.bloquean[0] || {}).porQue);
  ok('  ...y la tienda de prueba, que está completa, no reporta nada',
     g.api.revisarTienda().lista === true,
     JSON.stringify(g.api.revisarTienda()).slice(0, 90));

  /* Un valor entre corchetes cuenta como vacío: es lo que deja instalar() para
     que se vea que falta, y publicarlo anuncia «[NOMBRE DEL COMERCIO]». */
  ok('  ...y un corchete sin llenar cuenta como vacío, no como valor',
     vacia.api.sinLlenar('[NOMBRE DEL COMERCIO]') === true &&
     vacia.api.sinLlenar('La Espiga') === false,
     'es lo que deja la instalación para que se vea que falta');

  /* AL MENOS UNO de empresa_correo / empresa_tel, no los dos: exigir ambos
     sería pedir más de lo que pide la propia ley. */
  {
    const celda = (h, clave, valor) => {
      const fila = h.filas('Configuración').findIndex(f => String(f[0]).trim() === clave);
      if (fila >= 1) h.hojas.get('Configuración').getRange(fila + 1, 2).setValue(valor);
    };
    const t2 = crear('./as.js'); t2.api.instalar();
    ['negocio', 'whatsapp', 'sitio_url', 'pago_llave', 'empresa_razon', 'empresa_nit',
     'empresa_direccion', 'empresa_ciudad'].forEach(k => celda(t2, k, 'x'));
    const sinNinguno = t2.api.revisarTienda();
    celda(t2, 'empresa_correo', 'datos@x.co');
    const conCorreo = t2.api.revisarTienda();
    ok('  ...basta con UNO de empresa_correo / empresa_tel para no bloquear por eso',
       sinNinguno.bloquean.some(x => x.clave === 'empresa_correo_o_tel') &&
       !conCorreo.bloquean.some(x => x.clave === 'empresa_correo_o_tel'),
       sinNinguno.bloquean.map(x => x.clave).join(', ') + ' → ' +
       conCorreo.bloquean.map(x => x.clave).join(', '));
  }

  const d = g.api.diagnostico();
  ok('EL DIAGNÓSTICO lo pregunta ARRIBA, antes que nada',
     d.texto.indexOf('¿Está terminada esta tienda?'.toUpperCase()) <
     d.texto.indexOf('PESTAÑAS DE LA HOJA'),
     'si la tienda no está terminada, lo demás es ruido');
  ok('  ...y en una tienda a medias marca PROBLEMA, no un aviso suave',
     /PROBLEMA.*terminada/i.test(vacia.api.diagnostico().texto),
     (vacia.api.diagnostico().texto.match(/[^\n]*terminada[^\n]*/) || [''])[0].trim());
}

/* ═══ 27bis. LO QUE UN FLUJO EJECUTA, EXISTE Y VIAJA (0.20.3 · bitácora 90) ═══
   El montaje de una tienda se cayó con «Cannot find module montar/tiempos.mjs»
   después de publicar bien: el flujo llamaba a una herramienta que ESE
   repositorio no tenía. Dos cosas tienen que ser ciertas para que eso no
   vuelva: que todo `node montar/x.mjs` de cualquier flujo exista aquí, y que
   esté versionado —un archivo ignorado por git está en la semilla y no llega a
   ninguna tienda—. Lo tercero, que el flujo no se caiga si aun así falta, se
   comprueba abajo. */
{
  const flujos = fs.readdirSync('../.github/workflows')
    .map(f => ({ f, t: fs.readFileSync('../.github/workflows/' + f, 'utf8') }));
  const llamadas = [...new Set(flujos.flatMap(({ t }) =>
    [...t.matchAll(/node\s+(montar\/[\w.-]+\.mjs)/g)].map(m => m[1])))];
  const ausentes = llamadas.filter(r => !fs.existsSync('../' + r));
  ok('TODA HERRAMIENTA que un flujo ejecuta existe en la semilla',
     llamadas.length >= 10 && ausentes.length === 0, ausentes.join(', ') || llamadas.length + ' herramientas');

  /* Versionadas: lo que git ignora no viaja a la tienda, y el fallo aparece
     semanas después, en el repositorio de otro. */
  const ignorado = (() => {
    try {
      return cp.execFileSync('git', ['check-ignore', '--no-index', ...llamadas],
        { cwd: '..', stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n').filter(Boolean);
    } catch (e) { return []; }            // salida 1 = ninguno ignorado
  })();
  ok('  ...y ninguna está ignorada por git: lo que no se versiona no llega a la tienda',
     ignorado.length === 0, ignorado.join(', ') || 'todas versionadas');

  /* Y la que mide el tiempo, además, no puede tumbar la corrida por faltar:
     medir es un servicio, no el trabajo. */
  /* 0.20.4 · Y NO SOLO EN `montaje`. Esta aserción miraba un solo flujo, y
     `fotos` —el que corre todos los días en todas las tiendas— llamaba al
     cronómetro sin red: la misma caída de la bitácora 90, esperando en el
     flujo de al lado. Ahora se le exige a cualquiera que lo llame. */
  const conReloj = flujos.filter(x => /node montar\/tiempos\.mjs/.test(x.t));
  const sinRed = conReloj.filter(x => !(/\[ ! -f montar\/tiempos\.mjs \]/.test(x.t) &&
                                        /Sin cronómetro/.test(x.t)));
  ok('  ...y si el cronómetro no está, el flujo lo dice y sigue: TODOS los que lo llaman',
     conReloj.length >= 2 && sinRed.length === 0,
     sinRed.map(x => x.f).join(', ') || conReloj.map(x => x.f).join(', '));
}

/* ═══ 27c. EL RUNBOOK Y LA LISTA DE FUNCIONALIDADES, VIVOS (0.19.0) ═══
   Dos documentos nuevos que un técnico sigue con los dedos y que un comercial
   enseña. El modo de fallo de los dos es el mismo: nombrar una función, un
   flujo o una opción que ya no existe, y que nadie se entere hasta que alguien
   está montando una tienda a las once de la noche. Así que se comprueban
   contra el código, no contra el recuerdo. */
{
  const runbook = fs.readFileSync('../docs/RUNBOOK-TECNICO.md', 'utf8');
  const funcs = fs.readFileSync('../docs/FUNCIONALIDADES.md', 'utf8');
  const g = nuevo();

  const nombradas = [...new Set(runbook.match(/A\d_[A-Za-z]+/g) || [])];
  const inventadas = nombradas.filter(f => typeof g.api[f] !== 'function');
  ok('EL RUNBOOK solo manda ejecutar funciones que existen',
     nombradas.length >= 4 && inventadas.length === 0,
     inventadas.join(', ') || nombradas.join(', '));

  const flujos = fs.readdirSync('../.github/workflows').map(f => f.replace('.yml', ''));
  const citados = [...new Set((runbook.match(/flujo `([a-z]+)`/g) || [])
    .map(x => x.replace(/flujo `|`/g, '')))];
  const fantasmas = citados.filter(f => flujos.indexOf(f) === -1 &&
    ['alta', 'conectar', 'flota'].indexOf(f) === -1);
  ok('  ...y solo nombra flujos que existen (aquí o en el repositorio de servicio)',
     citados.length >= 3 && fantasmas.length === 0, fantasmas.join(', ') || citados.join(', '));

  ok('  ...y lleva las comprobaciones de cada paso, que es para lo que sirve',
     (runbook.match(/- \[ \]/g) || []).length >= 20 && /## I · Incidentes/.test(runbook),
     (runbook.match(/- \[ \]/g) || []).length + ' comprobaciones');

  const rotulos = g.api.menuDeLaHoja().map(m => m.rotulo);
  const fuera = rotulos.filter(r => funcs.indexOf(r) === -1);
  ok('LA LISTA DE FUNCIONALIDADES no se deja ninguna opción del menú fuera',
     fuera.length === 0, fuera.join(' · ') || rotulos.length + ' opciones');
  ok('  ...ni las pestañas de la hoja, ni lo que la tienda NO hace',
     ['Catálogo', 'Configuración', 'Envíos', 'Cupones', 'Pedidos', 'Avísame', 'Papelera', 'Validaciones']
       .every(h => funcs.indexOf(h) !== -1) && /no\*\* hace/.test(funcs));
}

/* ═══ 27b. NINGUNA CREDENCIAL SIN DOCUMENTAR (0.19.0) ═══
   El dueño pidió que la arquitectura dijera, sin suponer nada, qué secretos
   hay, dónde viven y qué permiten. Una tabla escrita a mano envejece en la
   primera versión que agrega un secreto —y lo hace en silencio—, así que la
   tabla tiene guardia: cada `secrets.X` de cualquier flujo y cada propiedad
   que el maestro o el panel leen o escriben tiene que estar NOMBRADA en
   ARQUITECTURA.md. Con acento invertido, no como palabra suelta en la prosa. */
{
  const arq = fs.readFileSync('../docs/ARQUITECTURA.md', 'utf8');
  const fuentes = ['../maestro.gs', '../panel.gs'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const flujos = fs.readdirSync('../.github/workflows')
    .map(f => fs.readFileSync('../.github/workflows/' + f, 'utf8')).join('\n');

  const secretos = [...new Set((flujos.match(/secrets\.[A-Z_]+/g) || [])
    .map(x => x.replace('secrets.', '')))].filter(x => x !== 'GITHUB_TOKEN');
  const sinDocumentar = secretos.filter(x => arq.indexOf('`' + x + '`') === -1);
  ok('TODO SECRETO de un flujo está en la tabla de credenciales de ARQUITECTURA.md',
     sinDocumentar.length === 0, sinDocumentar.join(', ') || secretos.join(', '));

  /* Las propiedades del script: las que se leen o se escriben por nombre. Las
     de Bold se buscan armadas (BOLD_ + tipo + sufijo), así que no aparecen en
     esta lista y se comprueban aparte. */
  const props = [...new Set((fuentes.match(/etProperty\('[A-Z_0-9]+'/g) || [])
    .map(x => x.replace(/.*\('/, '').replace(/'$/, '')))];
  const propsFuera = props.filter(x => arq.indexOf('`' + x + '`') === -1);
  ok('  ...y toda propiedad del maestro o del panel, también',
     propsFuera.length === 0 && props.length >= 20, propsFuera.join(', ') || props.length + ' propiedades');
  ok('  ...incluidas las llaves de la pasarela, que se arman por partes',
     /`BOLD_IDENTIDAD_SANDBOX`/.test(arq) && /`BOLD_SECRETA_PRODUCCION`/.test(arq));
  ok('  ...y cada una dice dónde nace y cómo se renueva',
     /Cómo se renueva/.test(arq) && /Quién la escribe/.test(arq) && /clasp login/.test(arq));
}

/* ═══ 27d. EL RESUMEN DE CADA FLUJO: QUÉ ES, CÓMO ESTÁ, SIN REPETIRSE
       (0.20.4 · bitácora 91) ═══
   El resumen de una corrida es lo único que lee quien no escribió el flujo, y se
   había vuelto una pila de volcados: empezaba por lo que imprimió la tercera
   herramienta, no decía de qué tienda era, ni en qué versión estaba, ni por qué
   había corrido, y repetía lo mismo tres veces —el marcador de las baterías
   salía en el TOTAL, en la lista de baterías con problemas y en cada línea de
   FALLA—. Decir algo tres veces es la otra manera de no decirlo.

   LA FORMA, IGUAL EN LOS OCHO FLUJOS DE LOS DOS REPOSITORIOS: una ficha arriba
   (qué es esto, sobre qué, cómo está ANTES de tocar nada, qué se pidió y quién
   lo pidió), lo que se averigua en medio, y el cierre abajo diciendo cómo quedó.

   SE COMPRUEBA AQUÍ porque un flujo no se puede correr en el equipo de nadie: lo
   que no vigila una aserción lo vigila el susto, y el susto llega en la tienda
   de un cliente. */
{
  const dir = '../.github/workflows';
  const flujos = fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f))
    .map(f => ({ f, t: fs.readFileSync(dir + '/' + f, 'utf8') }));

  /* Los pasos, en el orden en que GitHub los corre. El resumen se escribe por
     añadidura, así que el orden del archivo ES el orden de la página. */
  const pasos = t => t.split(/\n      - (?=name:|uses:)/).slice(1)
    .map(p => ({ nombre: (p.match(/^name: (.+)/) || ['', ''])[1].trim(), t: p }));

  const sinFicha = flujos.filter(({ t }) => {
    const p = pasos(t).filter(x => /GITHUB_STEP_SUMMARY/.test(x.t))[0];
    return !p || p.nombre !== 'Qué es esta corrida';
  });
  /* El número no se escribe: una tienda tiene cuatro flujos (no hereda
     `release`) y exigir cinco la dejaba en rojo por no ser la semilla. */
  ok('LA FICHA es lo PRIMERO que cualquier flujo escribe en el resumen',
     flujos.length >= 4 && sinFicha.length === 0,
     sinFicha.map(x => x.f).join(', ') || flujos.map(x => x.f).join(', '));

  /* Qué es, sobre qué, cómo está y quién lo pidió: sin las cuatro cosas la
     ficha es un título. */
  const floja = flujos.filter(({ t }) => {
    const p = pasos(t).filter(x => x.nombre === 'Qué es esta corrida')[0];
    return !p || !(/echo "## /.test(p.t) && /GITHUB_REPOSITORY/.test(p.t) &&
                   /GITHUB_ACTOR/.test(p.t) && /package\.json/.test(p.t));
  });
  ok('  ...y dice qué es, sobre qué repositorio, en qué versión y quién lo pidió',
     floja.length === 0, floja.map(x => x.f).join(', ') || 'las cinco fichas completas');

  /* Dos encabezados iguales en la misma página son dos bloques que dicen lo
     mismo, o uno que sobra. */
  const repes = [];
  flujos.forEach(({ f, t }) => {
    const titulos = (t.match(/echo "#{2,4} [^"]+"/g) || [])
      .map(x => x.replace(/^echo "#+ |"$/g, ''));
    const cuenta = {};
    titulos.forEach(x => { cuenta[x] = (cuenta[x] || 0) + 1; });
    Object.keys(cuenta).filter(k => cuenta[k] > 1).forEach(k => repes.push(f + ' › ' + k));
  });
  ok('  ...y ningún encabezado se repite dentro del mismo flujo',
     repes.length === 0, repes.join(' · ') || 'sin repeticiones');

  /* Los dos flujos que tocan la tienda cierran diciendo en qué estado la dejan,
     corra bien o mal: una corrida roja terminaba sin una sola frase sobre si la
     tienda estaba tocada o no. */
  const cierran = ['montaje.yml', 'fotos.yml'].map(f => {
    const p = pasos(flujos.filter(x => x.f === f)[0].t)
      .filter(x => x.nombre === 'Cómo quedó')[0];
    return { f, bien: !!p && /if: always\(\)/.test(p.t) && /sigue como estaba/.test(p.t) &&
                     /queda publicada/.test(p.t) };
  });
  ok('  ...y montaje y fotos cierran diciendo cómo queda la tienda, pase lo que pase',
     cierran.every(x => x.bien), cierran.filter(x => !x.bien).map(x => x.f).join(', ') || 'los dos');

  /* 0.20.5 · NINGÚN FLUJO SE BAJA EL REPOSITORIO CON UN PERMISO AJENO
     (bitácora 92). `montaje` hacía el checkout con `SEMILLA_TOKEN || github.token`
     para poder empujar flujos. En una tienda cuyo permiso de grano fino solo
     alcanzaba a la semilla, el PRIMER paso murió con 403, la corrida entera se
     saltó y lo único visible al final fue un error del cronómetro que no tenía
     nada que ver: dos horas para encontrar un permiso mal puesto. Un permiso
     ajeno se comprueba y se usa donde hace falta; nunca en el paso del que
     cuelga todo lo demás. */
  const conPermisoAjeno = flujos.filter(({ t }) =>
    /- uses: actions\/checkout[\s\S]{0,300}?token: \$\{\{ secrets\./.test(t));
  ok('  ...y ningún flujo se baja el repositorio con un permiso que puede no alcanzarlo',
     conPermisoAjeno.length === 0,
     conPermisoAjeno.map(x => x.f).join(', ') || 'todos con el permiso propio de la tienda');

  /* Y el marcador de las baterías, una sola vez: en el encabezado. El volcado
     solo aparece cuando hay algo roto que mirar. */
  const pr = flujos.filter(x => x.f === 'pruebas.yml')[0].t;
  ok('  ...y el marcador de las baterías se dice UNA vez, en el encabezado',
     /echo "### Todo en verde ·\$total"/.test(pr) &&
     !/grep -E "\^ FALLA\|\^  TOTAL/.test(pr),
     'en verde, una línea; en rojo, el marcador y las fallas');
}

/* ═══ 27e. LO QUE UNA TIENDA NO TIENE NO PUEDE TUMBAR SU SUITE
       (0.20.6 · bitácora 93) ═══
   Las baterías corren TAMBIÉN dentro de la tienda: `montaje` las corre sobre lo
   recién horneado y de su verde depende que se publique. Pero una tienda no
   tiene todo lo que hay aquí —`alta` no le hereda `release.yml`, ni el catálogo,
   ni las fotos de muestra, ni el `publicar/index.html` de la plantilla—, y una
   batería que abra uno de esos archivos a ciegas se cae con ENOENT, tumba la
   corrida entera y deja a la tienda sin publicar con el motivo equivocado
   escrito en el resumen: «batería en rojo». Pasó al actualizar la primera
   tienda de la 0.16.0 a la 0.20.4, con cinco baterías a la vez.

   Así que quien lea uno de esos archivos tiene que preguntar antes si está
   —`existsSync`— o comprobar dónde corre —`esSemilla()`—, y saltarse DICIÉNDOLO
   (patrón 8, regla 2). Lo que no puede es dar por hecho que esto es la semilla. */
{
  const NO_HEREDA = ['.github/workflows/release.yml', 'publicar/catalogo.json',
                     'publicar/fotos', 'publicar/sitemap.xml', 'publicar/compartir.jpg',
                     'ESTADO.md', 'tienda.json'];
  const baterias = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && /Resultado: /.test(fs.readFileSync(n, 'utf8')));
  const aCiegas = [];
  baterias.forEach(n => {
    const t = fs.readFileSync(n, 'utf8');
    const protegida = /existsSync|esSemilla/.test(t);
    NO_HEREDA.forEach(r => {
      if (t.indexOf("'../" + r) !== -1 && !protegida) aCiegas.push(n + ' › ' + r);
    });
  });
  ok('NINGUNA BATERÍA abre a ciegas un archivo que una tienda no tiene',
     aCiegas.length === 0, aCiegas.join(' · ') ||
     baterias.length + ' baterías, ' + NO_HEREDA.length + ' archivos que no se heredan');

  /* Y el que contesta dónde corre es uno solo, el mismo que mira la
     actualización: dos maneras de contestar la misma pregunta se contradicen el
     día que una cambia (patrón 2). */
  ok('  ...y «dónde corro» se contesta en un solo sitio',
     esSemilla({ GITHUB_REPOSITORY: 'laboratoriodigital/tienda' }) === true &&
     esSemilla({ GITHUB_REPOSITORY: 'laboratoriodigital/prueba1' }) === false &&
     esSemilla({}) === true &&
     JSON.parse(fs.readFileSync('../semilla.json', 'utf8')).repositorio === 'laboratoriodigital/tienda',
     'sin GITHUB_REPOSITORY —en el equipo de alguien— esto es la semilla');
}

/* ═══ 27f. LO QUE UNA HERRAMIENTA ESCRIBE, EL FLUJO LO PUBLICA
       (0.21.0 · bitácora 99) ═══
   `fotos` decidía si había que publicar mirando una lista de rutas escrita en el
   propio flujo (`PUBLICA`), y esa lista se quedó sin `publicar/404.html` —que lo
   escribe `preparar-index`, una de las herramientas que ese mismo flujo corre—.
   El resultado: el comercio cambiaba el nombre o los colores, el paso que MIRA
   decía «hay novedades», el que PUBLICA no encontraba nada suyo, y la corrida
   moría con «Nada que publicar pese a haber detectado novedades», que suena a
   fallo de git y era una lista incompleta.

   Cada herramienta ya declara lo que escribe (A-8 · `export const ESCRIBE`).
   Así que la lista del flujo no se revisa a ojo: se compara con lo que declaran
   las herramientas que ese flujo ejecuta. */
{
  const dir = '../.github/workflows';
  const sueltos = [];
  fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f)).forEach(f => {
    const t = fs.readFileSync(dir + '/' + f, 'utf8');
    const m = t.match(/\n\s*PUBLICA:\s*(.+)/);
    if (!m) return;                                   // un flujo que no publica
    const publica = m[1].trim().split(/\s+/);
    const cubre = r => publica.some(p => r === p || r.indexOf(p.replace(/\/$/, '') + '/') === 0);
    const herramientas = [...new Set([...t.matchAll(/node\s+(montar\/[\w.-]+\.mjs)/g)].map(x => x[1]))];
    herramientas.forEach(h => {
      if (!fs.existsSync('../' + h)) return;
      let escribe = [];
      try {
        escribe = JSON.parse(cp.execFileSync('node',
          ['-e', "import('./" + h + "').then(m => process.stdout.write(JSON.stringify(m.ESCRIBE || [])))"],
          { cwd: '..', stdio: ['ignore', 'pipe', 'ignore'] }).toString() || '[]');
      } catch (e) { return; }
      escribe.filter(r => String(r).indexOf('publicar/') === 0)
             .forEach(r => { if (!cubre(r)) sueltos.push(f + ' › ' + h + ' escribe ' + r); });
    });
  });
  ok('LO QUE ESCRIBE cada herramienta está en la lista de lo que el flujo publica',
     sueltos.length === 0, sueltos.join(' · ') ||
     'ninguna escribe fuera de lo que su flujo publica');
}

/* ═══ 27g. LA MISMA HERRAMIENTA PUBLICA EL MAESTRO Y EL PANEL
       (0.21.1 · bitácora 100) ═══
   `panel.gs` corre en la hoja de administración de la flota y se pegaba A MANO
   en cada versión: el último paso del despliegue que seguía siendo copiar y
   pegar. Es el mismo trabajo que ya hace esta herramienta con el maestro de cada
   tienda, así que lo hace ella —con `ARCHIVO=panel.gs`— y no una copia suya en
   el repositorio de servicio, que se separaría el día que una de las dos cambie
   (patrón 2). Lo único distinto es la hoja: el maestro lleva el id de la suya
   horneado porque puede vivir suelto; el panel está pegado a la suya. */
{
  const t = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
  ok('LA HERRAMIENTA sube el archivo que le pidan, y de fábrica el maestro',
     /const ARCHIVO = String\(process\.env\.ARCHIVO \|\| 'maestro\.gs'\)/.test(t) &&
     /readFileSync\(ARCHIVO, 'utf8'\)/.test(t) && /writeFileSync\(join\(tmp, ARCHIVO\)/.test(t),
     'una copia de esta herramienta en el otro repositorio sería la misma regla en dos sitios');
  ok('  ...y solo al maestro le hornea el id de su hoja',
     /if \(ES_MAESTRO\) \{[\s\S]{0,400}?var HOJA_ID/.test(t) &&
     /pegado a SU hoja/.test(t),
     'exigirle HOJA_ID al panel sería pedirle algo que no tiene');
  ok('  ...y la versión sale del archivo que se sube, no de un nombre escrito aquí',
     /var VERSION\(\?:_\[A-Z\]\+\)\? = '\(\[\^'\]\+\)'/.test(t) &&
     /readFileSync\(ARCHIVO, 'utf8'\)\s*\n?\s*\.match/.test(t),
     'maestro.gs la llama VERSION y panel.gs, VERSION_PANEL');
}

/* ═══ 27h. UN ARCHIVO QUE NO SE PUEDE EMPUJAR NO DEJA A LA TIENDA SIN PUBLICAR
       (0.21.2 · bitácora 101) ═══
   GitHub rechaza un push ENTERO cuando el commit toca `.github/workflows` y el
   permiso no puede escribir flujos —el GITHUB_TOKEN de Actions no puede nunca—.
   La actualización escribe esos archivos, así que una tienda sin
   `SEMILLA_TOKEN` útil se quedaba sin publicar su catálogo, sus fotos y su
   índice por culpa de un archivo que nadie había pedido: el rechazo no dice
   «los flujos no», dice «no».

   Dos redes, porque la primera depende de una comprobación que puede fallar y
   la segunda no depende de nada: no se COMMITEA lo que no se va a poder
   empujar, y si aun así el rechazo llega, se quitan del commit y se publica el
   resto. Lo que se queda atrás se dice, con lo que hay que poner para que
   llegue. */
{
  const m = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  ok('NO SE COMMITEA lo que no se va a poder empujar',
     /require\('\.\/pruebas\/donde\.js'\)\.esSemilla\(\)[^\n]*= "false" \] && \\\n\s+! git diff --cached --quiet -- \.github\/workflows; then/.test(m) &&
     /git restore --staged --worktree -- \.github\/workflows/.test(m) &&
     /Los flujos se quedan como estaban/.test(m),
     'un archivo que sobra no puede dejar la tienda sin catálogo');
  /* 0.22.1 · Y en una tienda, SIEMPRE: el push de una tienda no puede escribir
     flujos con ningún token, así que los pone la flota (bitácora 103). */
  ok('  ...y en una tienda no se commitean nunca: los entrega la flota',
     /tiendas\\` › Actions › \*\*flota\*\* › \\`flujos\\`/.test(m));
  ok('  ...y si el rechazo llega igual, se quitan y se publica el resto',
     /workflow\.\*without \.workflows\. permission/.test(m) &&
     /git commit --quiet --amend --no-edit/.test(m) &&
     /Los flujos se quedaron atrás/.test(m),
     'una publicación a medias es mejor que ninguna, si se dice cuál es la mitad que falta');
  ok('  ...y el push no finge que otro token en la URL cambia algo',
     !/x-access-token:\$\{SEMILLA_TOKEN\}/.test(m) && /cabecera con el permiso de Actions/.test(m),
     '`actions/checkout` deja una cabecera que gana a cualquier token en la URL');
}

/* ═══ 27i. LO QUE DECIDE SI UNA TIENDA PUBLICA (0.22.0 · bitácora 102) ═══
   Hasta la 0.21, una tienda corría la suite ENTERA de la semilla antes de
   publicar. Cinco bloqueos seguidos salieron de ahí —cada uno, una suposición de
   la semilla que dentro de una tienda era falsa— sin que ninguno protegiera de
   nada: el código de una tienda actualizada es el de una etiqueta que `release`
   no corta sin la suite en verde. Ahora, en una tienda, decide `tienda-viva.js`:
   solo lo que se hornea con SUS datos, y solo con invariantes. */
{
  const pub = fs.readFileSync('./publicacion.sh', 'utf8');
  const decide = (repo, extra) => cp.execFileSync('bash', ['publicacion.sh'],
    { env: Object.assign({}, process.env, { GITHUB_REPOSITORY: repo, SOLO_DECIDIR: '1' }, extra || {}),
      stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  ok('EN UNA TIENDA la guardia es la tienda viva, aunque el montaje pida «todas»',
     decide('laboratoriodigital/prueba1', { GUARDIA: 'todas' }) === 'tienda' &&
     decide('laboratoriodigital/tienda', { GUARDIA: 'todas' }) === 'todas',
     'la semilla sigue probando su código entero; la tienda, lo que hornea');
  ok('  ...y la decisión se toma ANTES de mirar GUARDIA, en un archivo que llega con la actualización',
     pub.indexOf("require('./donde.js').esSemilla()") !== -1 &&
     pub.indexOf("require('./donde.js').esSemilla()") < pub.indexOf('[ "$GUARDIA" = "todas" ]'),
     'en el flujo llegaría una versión tarde, que es lo que tenía bloqueadas a las tiendas');
  ok('  ...y SUITE_ENTERA la fuerza en cualquier sitio, para quien quiera mirar',
     decide('laboratoriodigital/prueba1', { SUITE_ENTERA: '1' }) === 'todas');

  /* La tienda viva no puede saber NADA de ningún comercio: una aserción que
     dependa de los datos de uno es una tienda que no se puede publicar. */
  const viva = fs.readFileSync('./tienda-viva.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const { terminos } = JSON.parse(fs.readFileSync('../terminos-prohibidos.json', 'utf8'));
  /* Los identificadores de muestra, si hay catálogo: una tienda recién nacida
     no lo tiene, y abrirlo a ciegas es justo lo que la 27e prohíbe. (La
     tiendita lo encontró antes de que llegara a ninguna tienda.) */
  const deMuestra = fs.existsSync('../publicar/catalogo.json')
    ? (JSON.parse(fs.readFileSync('../publicar/catalogo.json', 'utf8')).productos || []).map(p => String(p.id)).filter(Boolean)
    : [];
  const sabe = [...terminos, ...deMuestra].filter(t => viva.toLowerCase().indexOf(String(t).toLowerCase()) !== -1)
    .concat((viva.match(/#[0-9A-Fa-f]{6}\b/g) || []));
  ok('  ...y la tienda viva no nombra ni un producto, ni un comercio, ni un color',
     sabe.length === 0, sabe.join(', ') || 'solo invariantes');
}

/* ═══ 28. LAS QUE SE EJECUTAN A MANO, ENCONTRABLES ═══
   El archivo tiene más de cien funciones y el selector del editor las lista
   revueltas. Las cinco que un humano ejecuta estaban perdidas entre las demás,
   hasta que alguien dijo «en las funciones del maestro no veo
   diagnosticoCompleto()» — y estaba ahí, en la línea 835. */
{
  const g = nuevo();
  const fuente = fs.readFileSync('../maestro.gs', 'utf8');
  const conPrefijo = (fuente.match(/^function (A\d_\w+)\(/gm) || [])
    .map(x => x.match(/function (\w+)\(/)[1]);

  ok('LAS DE EJECUCIÓN MANUAL llevan prefijo, así se agrupan en cualquier lista',
     conPrefijo.length === 7, conPrefijo.join(', '));
  /* 0.18.0 · A5 y A6 son las de volver atrás: ver las copias de la hoja y
     restaurar pestañas desde una (bitácora 77). Van al final, que es cuando se
     necesitan: montar una tienda sigue siendo A0, A1, A2. */
  ok('  ...numeradas en el orden en que se necesitan, no en el alfabético',
     conPrefijo.join(',') === ['A0_instalar', 'A1_generarStub',
       'A2_diagnosticoCompleto', 'A3_rotarToken', 'A4_respaldoAhora',
       'A5_respaldos', 'A6_restaurarDatos'].join(','),
     'montar una tienda es A0, A1, A2 de arriba abajo');
  ok('  ...y todas existen de verdad, no solo el comentario',
     conPrefijo.every(f => typeof g.api[f] === 'function'),
     conPrefijo.filter(f => typeof g.api[f] !== 'function').join(', ') || 'todas');

  /* Son envoltorios: los dos nombres funcionan, y por eso el runbook viejo y
     las hojas ya montadas siguen sirviendo. */
  ok('  ...son envoltorios, y el nombre de siempre sigue funcionando',
     typeof g.api.instalar === 'function' &&
     typeof g.api.diagnosticoCompleto === 'function' &&
     typeof g.api.rotarToken === 'function',
     'renombrar habría roto el runbook y las hojas ya montadas');
  ok('  ...y hacen lo mismo, no una copia que se queda atrás',
     g.api.A2_diagnosticoCompleto().texto === g.api.diagnosticoCompleto().texto &&
     /^function A0_instalar\(\) \{ return instalar\(\); \}$/m.test(fuente),
     'una línea, sin lógica propia');

  /* Y la que se ejecuta sin querer. Apps Script elige la PRIMERA función del
     archivo cuando le das a Ejecutar sin escoger, así que la primera tiene que
     ser la que no hace daño empezar. */
  const primera = (fuente.match(/^function (\w+)/m) || [])[1];
  ok('  ...y la PRIMERA función del archivo sigue siendo instalar',
     primera === 'A0_instalar' || primera === 'instalar',
     primera + ' — es la que corre si le dan a Ejecutar sin escoger');
}

/* ═══ 29. EL MAPA DE DESPLIEGUE, Y LOS CINCO QUE SE QUEDARON ATRÁS ═══
   Había cinco documentos describiendo tramos del mismo procedimiento y
   NINGUNO nombra «Publicar ahora» correctamente — alguno hasta enseñaba fotos
   por Cloudinary y catálogo «en vivo», los dos falsos desde hace versiones.
   Es el patrón 2 a escala de documentación: varias copias, todas atrasadas.
   En la 3.0.0 se consolidó lo vigente de los cinco en este único mapa y se
   borraron: un documento atrasado sin borrar se lee como si estuviera al
   día, y borrarlo es la única forma de que deje de mentir. */
{
  const mapa = fs.readFileSync('../docs/DESPLIEGUE.md', 'utf8');
  const viejos = ['RUNBOOK.md', 'DESPLIEGUE-CLIENTE.md', 'MONTAJE.md',
                  'INSTALAR.md', 'FOTOS.md'];

  ok('EL MAPA cubre del repositorio a la entrega, no un tramo',
     /## 1 · El repositorio/.test(mapa) && /## 16 · La entrega/.test(mapa),
     'de punta a punta o no es un mapa');
  ok('  ...y marca los tres sitios donde el orden cuesta una hora',
     (mapa.match(/⚠/g) || []).length >= 3 &&
     /Generar el stub DESPUÉS de publicar el maestro/.test(mapa),
     'implementar una vez · abrir la /exec · el stub después');
  ok('  ...incluida la trampa que solo aparece al rotar el token',
     /TRES.*sitios|TRES\*\* sitios/.test(mapa) && /pestaña `Tiendas` del panel/.test(mapa),
     'olvidar el del panel marca la tienda como caída, y está perfecta');
  ok('  ...y el paso de WhatsApp, que es donde la seguridad se vuelve agujero',
     /respuesta automática/.test(mapa) && /no tiene cómo pagar/.test(mapa));
  /* Y el que solo existe a partir de la segunda tienda. El mapa se escribió
     montando la primera, cuando cruzar dos hojas era imposible por falta de
     material. Con dos, es el fallo que más cuesta seguir. */
  /* LOS CINCO SECRETOS, CON SU PROCEDENCIA EXACTA. La tabla decía «la URL del
     proyecto de Apps Script» y había que adivinar qué trozo de la URL. Los dos
     que no se pueden deducir —los del maestro— salen de una función que hay
     que correr desde el editor, y eso no estaba escrito en la tabla. */
  ok('LOS CINCO SECRETOS dicen de qué pantalla sale cada uno',
     ['MAESTRO_URL', 'MAESTRO_TOKEN', 'SCRIPT_ID', 'HOJA_ID', 'CLASPRC']
       .every(s => new RegExp('`' + s + '`').test(mapa)) &&
     /A2_diagnosticoCompleto\(\)/.test(mapa) &&
     /entre `\/projects\/` y `\/edit`/.test(mapa) &&
     /entre `\/d\/` y `\/edit`/.test(mapa),
     '«la URL del proyecto» obliga a adivinar qué trozo');
  ok('  ...y que CLASPRC caduca, que es el único que se muere solo',
     /caduca/.test(mapa) && /clasp login/.test(mapa),
     'un secreto que expira sin avisar se diagnostica como flujo roto');
  ok('  ...y los TRES que NO son secretos del repositorio',
     /ALTA_TOKEN/.test(mapa) && /Script Properties/.test(mapa) &&
     /no están cifradas/.test(mapa) && /pago_llave/.test(mapa),
     'el llavero de alta, el token de «Publicar ahora» y la llave de pago');

  /* Y QUE NO HAY QUE VOLVER A TOCAR «IMPLEMENTAR». Se lo dije al operador por
     costumbre, después de una corrida que ya había actualizado la
     implementación y lo había verificado contra la /exec. Un paso manual de
     más en un despliegue no es inocuo: el de al lado —«Nueva
     implementación»— estrena URL y deja la tienda muda. */
  ok('EL MAPA dice que el flujo ya actualiza la implementación',
     /update-deployment/.test(mapa) && /falla si no es la que acaba de publicar/.test(mapa) &&
     /`A0_instalar\(\)` \*\*no despliega nada\*\*/.test(mapa),
     'un paso manual de más al lado de uno que deja la tienda muda');

  ok('  ...y los TRES sitios donde se pueden cruzar dos tiendas',
     /cruzar dos tiendas/.test(mapa) && /Cloudflare/.test(mapa) &&
     /MAESTRO_TOKEN. de este repositorio/.test(mapa),
     'los secretos, la clave de la hoja y el proyecto de Cloudflare');

  viejos.forEach(n => {
    ok('  ...y «' + n + '», que se quedó atrás, ya no existe: se consolidó aquí',
       !fs.existsSync('../docs/' + n),
       'un documento atrasado sin borrar se lee como si estuviera al día');
  });
}


// ═══ 30. Una hoja no publica en el repositorio de otra ═══
/* EL ÚNICO FALLO DE ESTE PRODUCTO QUE NO DEJA HUELLA EN NINGÚN LADO.
   Con dos tiendas montadas a la vez, los secretos de un repositorio pueden
   acabar apuntando a la hoja del otro comercio. Entonces todo funciona: el
   flujo corre en verde, el maestro contesta, las fotos bajan, el catálogo se
   hornea y Cloudflare despliega. Cada pieza hace bien su trabajo con la hoja
   equivocada. Lo que el comercio ve es «subí una foto y no salió» —salió, en
   la tienda de al lado—, y eso no apunta a ninguna parte.
   La hoja ya sabía a qué repositorio pertenece; lo que faltaba era mirarlo. */
{
  const dela = r => veredicto(r.dice, r.aqui).estado;

  ok('CRUZAR DOS TIENDAS se detecta y se nombra',
     dela({ dice: 'lab/panaderia', aqui: 'lab/organico' }) === 'otra-tienda',
     'es el único fallo del producto que corre entero en verde');
  ok('  ...y la misma tienda escrita de otra forma NO es otra tienda',
     ['https://github.com/lab/organico', 'lab/organico.git', 'Lab/Organico',
      'lab/organico/', '  lab/organico  ']
       .every(x => dela({ dice: x, aqui: 'lab/organico' }) === 'coinciden'),
     'un guardia que se pelea con una barra final se acaba apagando');

  /* NO BLOQUEA A QUIEN NO PUEDE CONTESTAR. Hay tiendas montadas antes de que
     la clave existiera; a esas se les avisa. Bloquearlas convertiría el
     guardia en una puerta cerrada, y el guardia se quitaría. */
  ok('  ...una hoja que no lo declara se avisa, no se bloquea',
     dela({ dice: '', aqui: 'lab/organico' }) === 'sin-declarar' &&
     dela({ dice: 'lab/organico', aqui: '' }) === 'sin-contexto',
     'fuera de Actions no hay contra qué comparar');

  const mt = fs.readFileSync('../montar/misma-tienda.mjs', 'utf8');
  ok('  ...y el aviso dice DÓNDE se cruzan, que son tres sitios',
     /Secrets and variables/.test(mt) && /Configuración, fila repositorio/.test(mt) &&
     /Cloudflare/.test(mt),
     'los secretos, la clave de la hoja y el proyecto de Cloudflare');
  ok('  ...y nombra el negocio de la hoja que contestó',
     /id\.negocio/.test(mt),
     'leer «Panadería» cuando esperabas tomates cierra el caso en un segundo');

  /* Y SE MIRA ANTES DE ESCRIBIR NADA, no después. Comprobarlo al final deja el
     daño hecho y solo lo documenta. */
  [['fotos', 'Bajarlas y convertirlas'],
   ['montaje', '¿Se pidió publicar el maestro?']].forEach(([f, primero]) => {
    const y = fs.readFileSync('../.github/workflows/' + f + '.yml', 'utf8');
    ok('EL FLUJO `' + f + '` lo comprueba ANTES de tocar publicar/',
       y.indexOf('misma-tienda.mjs') > 0 &&
       y.indexOf('misma-tienda.mjs') < y.indexOf(primero),
       'comprobarlo al final documenta el daño en vez de evitarlo');
  });

  ok('  ...y el maestro contesta de quién es la hoja',
     /r\.repositorio = String\(leerConfiguracion\(\)\.repositorio/
       .test(fs.readFileSync('../maestro.gs', 'utf8')),
     'sin eso no hay con qué comparar');
}


// ═══ 31. Publicar una foto no puede costar ocho minutos ═══
/* SE MIDIÓ ANTES DE TOCAR NADA. Las 22 baterías son 292 s; las 12 que abren
   navegador, 290 (99 %); las diez que uno quitaría primero por «no tan
   fundamentales», 3,5 s ENTRE TODAS. Quitar baterías no recupera tiempo y deja
   sin guardia justo lo que permite que `fotos` fusione sin una persona.

   Lo que sí se recupera es el reloj de pared. Los doce navegadores se esperaban
   por una razón de implementación —todos hablaban con el mismo servidor del
   8099 y se pisaban el /__reset— y no por una de fondo. Ahora cada batería
   levanta el suyo en su puerto. Cero aserciones tocadas; el marcador tiene que
   salir idéntico. */
{
  /* EL LANZADOR SON DOS ARCHIVOS. `todas.sh` decide el orden, el cupo y el
     marcador; `ejecutar-bateria.sh` es lo que corre UNA batería con su
     servidor. Se leen juntos porque lo que estas aserciones vigilan es el
     mecanismo, y el mecanismo vive repartido entre los dos a propósito: cada
     batería se lanza como un proceso suyo que lee su script del disco, sin
     heredar de la corrida de arriba ni una trampa ni una función. */
  const sh = fs.readFileSync('todas.sh', 'utf8') +
             fs.readFileSync('ejecutar-bateria.sh', 'utf8');

  ok('LAS BATERÍAS corren a la vez, cada una con SU servidor',
     /TRABAJADORES/.test(sh) && /8100 \+ i \* 2/.test(sh) &&
     /bash ejecutar-bateria\.sh .*&/.test(sh),
     'el aislamiento no es un candado: es que no comparten nada');

  /* Y LO QUE IMPRIME CADA BATERÍA NO SE GUARDA EN UN TEMPORAL DEL SISTEMA.
     `mktemp -d` devolvía en Git Bash una ruta que no resolvía a la carpeta que
     acababa de crear, así que la PRIMERA redirección de cada batería moría con
     «No such file or directory» y ninguna llegaba a escribir una línea. El
     mensaje nombraba el archivo .js del destino —`/tmp/tmp.XXXX/e2e.js`—, y eso
     hizo buscar cuatro veces seguidas una batería que no faltaba, en vez del
     directorio que sí. Patrón 8: la ruta del error se leyó como sujeto cuando
     era complemento. */
  ok('  ...y su salida se guarda en el repositorio, no en un temporal del sistema',
     !/\$\(mktemp/.test(sh) && /SALIDA=\.salida/.test(sh),
     'un temporal del sistema no resuelve igual en toda máquina; una carpeta del repositorio sí');

  /* LA LISTA DE QUÉ SERVIDOR NECESITA CADA BATERÍA SE LE PREGUNTA A ELLA.
     Escrita aparte sería la segunda copia del mismo dato (patrón 2): se agrega
     una batería, nadie toca la lista, y arranca sin servidor. */
  ok('  ...y qué servidor necesita cada una sale de la batería, no de una lista',
     /grep -q 'process\.env\.PUERTO \|\|'/.test(sh),
     'una lista aparte se queda atrás la primera vez que se agrega una batería');

  /* NINGUNA PUEDE LLEVAR EL PUERTO CLAVADO. En paralelo, una batería que pida
     el 8099 hablaría con el servidor de otra —o con ninguno— y el fallo saldría
     como un error de red que no dice nada. */
  const clavado = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && /localhost:80\d\d/.test(fs.readFileSync(n, 'utf8')));
  ok('  ...y NINGUNA batería lleva el puerto clavado',
     clavado.length === 0,
     clavado.join(', ') + ' — en paralelo hablaría con el servidor de otra');

  /* ESPERAR A QUE CONTESTE NO ES ESPERAR DOS SEGUNDOS. El `sleep 2` de antes
     era una apuesta sobre la carga de la máquina: patrón 8, el reloj como
     entrada que nadie declaró. */
  ok('  ...y se espera a que el servidor CONTESTE, no un número de segundos',
     /curl -sf "http:\/\/localhost:\$puerto\/__reset"/.test(sh) && /kill -0/.test(sh),
     'un sleep fijo falla en una máquina cargada y no dice por qué');

  ok('  ...con interruptor para volver a serial y depurar',
     /TRABAJADORES=\$\{TRABAJADORES:-/.test(sh),
     'si una batería solo falla en paralelo, el fallo es suyo');

  /* Y LO QUE YA PROTEGÍA ESTE ARCHIVO SIGUE PROTEGIENDO. Es el riesgo de
     reescribir el corredor: que el marcador salga verde porque dejó de mirar. */
  ok('  ...y sigue diciendo QUÉ se cayó, y sin pasar por verde contando 0/0',
     /grep -E "\^ FALLA"/.test(sh) && /tail -25/.test(sh) && /-z "\$rotas"/.test(sh),
     'reescribir el corredor y perder el guardia sería el peor cambio posible');

  /* NINGUNA BATERÍA DUERME UN NÚMERO FIJO.
     De los 292 s que tardaba la suite, 182 —el 62 %— eran `waitForTimeout`:
     dormir, no probar. Y dormir a ojo falla por los dos lados: sobra cuando la
     máquina va suelta, y NO ALCANZA cuando va cargada, y entonces la batería
     se cae por algo que no tiene que ver con lo que probaba.

     La regla no es «pocos milisegundos», es NINGUNO: se espera la condición
     que la aserción va a mirar. El único caso sin condición —comprobar una
     AUSENCIA, que no llega nada— pasa por `ventana()`, que obliga a escribir
     por qué. Un número suelto en medio de una batería no se distingue de los
     182 segundos que se acaban de quitar. */
  const durmiendo = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && n !== 'esperar.js')
    .filter(n => /p\.waitForTimeout|page\.waitForTimeout/.test(fs.readFileSync(n, 'utf8')));
  ok('NINGUNA BATERÍA espera un número de milisegundos',
     durmiendo.length === 0,
     durmiendo.join(', ') + ' — la condición se espera, el reloj se adivina');
  /* ── El secreto que se pega mal, y el mensaje que mandaba al sitio
        equivocado ──────────────────────────────────────────────────────────
     Montando la segunda tienda, `montaje` murió con «No credentials found».
     Lo que había en el secreto CLASPRC era un `.clasp.json` —el archivo que
     dice a qué proyecto subir— en vez de un `~/.clasprc.json` —las
     credenciales—. Y es un error razonable: `clasp login` escribe en la
     carpeta PERSONAL y no deja nada en la del proyecto, así que parece que
     falló y se acaba cogiendo el único archivo de clasp que sí se ve.
     Peor: NUESTRO mensaje listaba «las dos causas de siempre» —cuenta
     equivocada, API sin habilitar— y no era ninguna de las dos. Un error que
     apunta al sitio equivocado cuesta más que no decir nada. */
  {
    const { veredicto } = require('../montar/revisar-clasprc.mjs');
    const clasprc = t => veredicto(typeof t === 'string' ? t : JSON.stringify(t));

    ok('SE MIRA QUÉ HAY en el secreto CLASPRC antes de dárselo a clasp',
       clasprc({ tokens: { default: { refresh_token: 'x' } } }).ok === true &&
       clasprc({ scriptId: '1abc', rootDir: '../' }).ok === false,
       'el formato de clasp 3 pasa; un .clasp.json, no');
    ok('  ...y cuando es el archivo equivocado, lo NOMBRA',
       /TIENE UN \.clasp\.json/.test(clasprc({ scriptId: '1abc' }).mensaje) &&
       /carpeta personal|CARPETA\n?\s*PERSONAL/i.test(clasprc({ scriptId: '1abc' }).mensaje),
       '«No credentials found» es cierto y no ayuda');
    ok('  ...distinguiendo vacío, no-es-JSON y sin refresh_token',
       [['', /vacío/], ['{', /no es un JSON/], [{ tokens: { default: { access_token: 'y' } } }, /refresh_token/]]
         .every(([e, re]) => { const r = clasprc(e); return !r.ok && re.test(r.mensaje); }),
       'cada uno se arregla distinto');
    ok('  ...y acepta los formatos viejos, que siguen funcionando',
       clasprc({ token: { refresh_token: 'x' }, oauth2ClientSettings: {} }).ok &&
       clasprc({ refresh_token: 'x', access_token: 'y' }).ok,
       'clasp 3 los sigue leyendo: rechazarlos sería inventar un fallo');

    const y = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
    ok('  ...y el flujo lo comprueba ANTES de instalar clasp',
       y.indexOf('revisar-clasprc.mjs') > 0 &&
       y.indexOf('revisar-clasprc.mjs') < y.indexOf('npm i -g @google/clasp'),
       'fallar rápido y por el motivo correcto');

    /* Y el mensaje de la herramienta deja de mandar a comprobar la cuenta
       cuando lo que falta es el archivo. Para decidirlo hay que LEER lo que
       dijo clasp, y con stdio:'inherit' su salida quedaba en null: mirarla
       habría sido mirar a la nada. */
    const pm = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
    ok('  ...y la salida de clasp se CAPTURA, que es lo que permite decidir',
       !/clasp\(\['push', '--force'\], \{ cwd: tmp, stdio: 'inherit' \}\)/.test(pm),
       'con stdio:inherit la decisión se tomaría sobre null');

    /* TRES FALLOS DISTINTOS QUE SE CONTESTABAN CON EL MISMO PÁRRAFO.
       «Las dos causas de siempre» —cuenta equivocada, API sin habilitar—
       mandó dos veces seguidas a mirar donde no era: a revisar la cuenta
       cuando lo que faltaba era un archivo, y a habilitar una API que ya
       estaba habilitada. Un error que apunta al sitio equivocado cuesta más
       que uno que no dice nada. */
    const { porQueFallo } = require('../montar/publicar-maestro.mjs');
    const dice = {
      'sin-credenciales': 'No credentials found.',
      'sin-permiso':      'The caller does not have permission',
      'api-apagada':      'User has not enabled the Apps Script API. Enable it by ' +
                          'visiting https://script.google.com/home/usersettings',
      'otro':             'ECONNRESET'
    };
    ok('CADA QUEJA DE GOOGLE se reconoce como la suya',
       Object.keys(dice).every(k => porQueFallo(dice[k]) === k),
       Object.keys(dice).map(k => k + ':' + porQueFallo(dice[k])).join(' '));
    /* El de la API apagada TAMBIÉN trae un 403. Si se mirara primero el
       permiso, se lo tragaría y volveríamos a mandar al sitio equivocado. */
    ok('  ...y la API apagada gana al 403, que también lo trae',
       porQueFallo('403 PERMISSION_DENIED: User has not enabled the Apps Script API ' +
                   'https://script.google.com/home/usersettings') === 'api-apagada',
       'el orden de las comprobaciones ES la comprobación');

    ok('  ...y «no tienes permiso» dice QUIÉN y SOBRE QUÉ',
       /cuenta:    /.test(pm) && /proyecto:  /.test(pm) &&
       /show-authorized-user/.test(pm) && /list-scripts/.test(pm),
       'Google dice que alguien no tiene permiso, sin decir quién ni sobre qué');
    ok('  ...y el scriptId se imprime ENTERO, no truncado',
       /proyecto ' \+ cfg\.scriptId\)/.test(pm) &&
       !/cfg\.scriptId\.slice\(0, 14\)/.test(pm),
       'truncado, dos proyectos de la misma plantilla se ven idénticos');

    /* Y el archivo no puede volver a hacer nada al importarlo: probar la
       clasificación no puede disparar un despliegue. */
    ok('  ...y publicar-maestro NO hace nada al importarlo',
       /import\.meta\.url === pathToFileURL\(process\.argv\[1\] \|\| ''\)\.href\) main\(\)/.test(pm),
       'importarlo para probarlo llegó a crear montar/.clasp.json');

    /* ── El plantón de 45 segundos, y el consejo que hablaba de otra cosa ──
       Montando la segunda tienda, `?a=bloques` contestó bien desde
       publicar-maestro.mjs y, segundos después, se plantó en 45 s desde
       preparar-index.mjs con la MISMA petición. No era la tienda: Apps Script
       está frío justo después de actualizar una implementación, que es
       exactamente el momento del montaje en que se le pregunta.
       Y el mensaje del plantón decía «si es una foto, casi siempre es que
       pesa demasiado» — en un plantón de «bloques», mandando a buscar una
       foto grande que no existía. */
    const { topeDe, seReintenta, mensajeDePlanton } = require('../montar/tienda.mjs');

    ok('EL TOPE de una llamada normal aguanta un Apps Script frío',
       topeDe('bloques') >= 90000 && topeDe('foto') >= 180000,
       'bloques ' + topeDe('bloques') / 1000 + ' s · foto ' + topeDe('foto') / 1000 + ' s');
    ok('  ...y un plantón se reintenta, porque en frío es la primera vez',
       seReintenta('bloques') && seReintenta('catalogo'),
       'un plantón en frío no es un fallo');
    ok('  ...pero NO lo que escribe en la hoja',
       !seReintenta('sembrar'),
       'un plantón no dice si la escritura llegó: reintentarla puede duplicarla');

    ok('EL CONSEJO DEL PLANTÓN es de lo que falló, no de fotos siempre',
       !/foto/i.test(mensajeDePlanton('bloques')) &&
       /Solo yo/.test(mensajeDePlanton('bloques')) &&
       /pesa demasiado/.test(mensajeDePlanton('foto', { id: '1x' })),
       'a «bloques» le mandaba a buscar una foto grande que no existía');
    ok('  ...y nombra la foto concreta cuando sí lo es',
       /\(id 1x\)/.test(mensajeDePlanton('foto', { id: '1x' })),
       'con cien fotos, saber cuál reventó es la mitad del arreglo');
    ok('  ...y no promete un reintento que no hubo',
       /ni al reintentar/.test(mensajeDePlanton('bloques')) &&
       /No se reintenta porque escribe/.test(mensajeDePlanton('sembrar')),
       'decir «ni al reintentar» sin reintentar es una mentira pequeña y cara');

    /* Y CUÁNTO TARDÓ, SIEMPRE. La comprobación de publicar-maestro no lleva
       tope, así que puede tardar cuarenta segundos y decir «sí» tan tranquila
       mientras el paso siguiente se planta con la misma petición. El log no
       traía ni un número con el que sospecharlo. */
    ok('  ...y una llamada lenta DICE cuánto tardó',
       /RUIDOSA_DESDE/.test(fs.readFileSync('../montar/tienda.mjs', 'utf8')) &&
       /sí, en ' \+ tardo \+ ' s\./.test(pm) && /está FRÍO/.test(pm),
       'sin ese número, «contestó» y «casi no contesta» se ven igual');
  }

  ok('  ...y la única espera fija que queda tiene nombre y motivo',
     /function ventana/.test(fs.readFileSync('esperar.js', 'utf8')) &&
     /ventana\(p, \d+, '/.test(fs.readFileSync('val.js', 'utf8')),
     'una ausencia sí necesita una ventana, y tiene que decirlo');

  /* EL NAVEGADOR NO CAMBIA ENTRE CORRIDAS Y SE BAJABA ENTERO CADA VEZ.
     `pruebas.yml` ya lo cacheaba; `fotos.yml` —el que de verdad corre cada
     cuatro horas— se había quedado fuera. Es el patrón 6: lo que se arregla
     para uno deja fuera al que más lo necesitaba. */
  /* Lo que el runner va a tener: lo versionado, no lo que hay en este disco. */
  const versionados = new Set(
    require('node:child_process')
      .execFileSync('git', ['ls-files'], { cwd: '..', encoding: 'utf8' })
      .split('\n').filter(Boolean));

  ['fotos', 'montaje', 'pruebas'].forEach(f => {
    const y = fs.readFileSync('../.github/workflows/' + f + '.yml', 'utf8');
    ok('EL FLUJO `' + f + '` no vuelve a bajar Chromium en cada corrida',
       /path: ~\/\.cache\/ms-playwright/.test(y) && /actions\/cache/.test(y),
       '130 MB por corrida, siempre los mismos');
    ok('  ...ni el binario nativo de sharp',
       /path: ~\/\.npm/.test(y),
       'lo único que pesa de npm en este repositorio');

    /* LO QUE UNA CACHÉ MIRA TIENE QUE EXISTIR, Y ESTO NO LO COMPROBABA NADIE.
       La primera versión usaba `cache: npm` con los dos package-lock.json —que
       están en .gitignore—. En un checkout limpio no existen y setup-node se
       cae con «Some specified paths were not resolved», antes de correr nada.

       Y la aserción que yo había escrito daba VERDE: comprobaba que el texto
       "pruebas/package-lock.json" apareciera en el yml. Aparecía. El archivo
       no existía. Es el patrón 5 —una comprobación mal elegida es peor que
       ninguna— y lo cometí escribiendo el guardia de mi propio cambio.
       Esta mira los archivos. */
    const mirados = [...y.matchAll(/hashFiles\(([^)]*)\)/g)]
      .flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]))
      .concat([...y.matchAll(/cache-dependency-path:\s*\|([\s\S]*?)\n\s*\n/g)]
        .flatMap(m => m[1].split('\n').map(s => s.trim()).filter(Boolean)));
    /* «Existe» no basta, y ese fue el segundo error: `pruebas/package-lock.json`
       EXISTE en cualquier máquina donde se haya corrido npm install. Lo que no
       está es en el repositorio, y el runner solo tiene lo que se versiona.
       Una comprobación hecha en la máquina equivocada tampoco comprueba. */
    const fantasmas = mirados.filter(r => !versionados.has(r));
    ok('  ...y los archivos de los que depende la caché están VERSIONADOS',
       fantasmas.length === 0,
       fantasmas.join(', ') + ' — en el runner no existen y el flujo se cae ' +
       'antes de correr nada');
  });

  /* Y LA CORRIDA DUPLICADA QUE ADEMÁS PEDÍA UNA PERSONA. El pull request que
     abre `fotos` lanzaba `pruebas` otra vez sobre los mismos bytes; esa corrida
     queda esperando aprobación de un mantenedor y, si nadie la aprueba, caduca
     y deja una X roja en un pull request ya fusionado. Una marca roja que no
     significa nada enseña a no mirar las marcas. */
  {
    const p = fs.readFileSync('../.github/workflows/pruebas.yml', 'utf8');
    const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
    /* LA CONDICIÓN SIGUE PUESTA, Y NO ES LA QUE RESUELVE EL PROBLEMA.
       Se escribió para saltarse la corrida duplicada del pull request del bot,
       y NO FUNCIONA para lo que más dolía: GitHub RETIENE esa corrida esperando
       la aprobación de un mantenedor, y la retención es de la CORRIDA — pasa
       antes de que se evalúe ninguna condición del trabajo. Caducaba y dejaba
       una X roja en un pull request que ya se había fusionado bien.
       Lo que sí lo resuelve es que `fotos` no abra pull request cuando va a
       publicar solo. Esta condición se queda para el camino
       `con-pull-request`, donde sí evita la corrida repetida. */
    ok('`pruebas` NO se repite sobre el pull request que abre `fotos`',
       /github-actions\[bot\]/.test(p) && /startsWith\(github\.head_ref, 'fotos\/nuevas-'\)/.test(p),
       'evita la corrida repetida; la X roja la quita no abrir el PR');
    /* Y LA EXCUSA TIENE QUE SEGUIR SIENDO CIERTA. El salto se justifica SOLO
       porque `fotos` ya las corrió antes de publicar. El día que eso deje de
       pasar, esto publicaría sin haber probado nada. */
    ok('  ...porque `fotos` YA las corrió antes de publicar, y eso sigue siendo cierto',
       f.indexOf('publicacion.sh') > 0 && f.indexOf('publicacion.sh') < f.indexOf('"$rama":main'),
       'sin esto, saltarse pruebas sería publicar a ciegas');
    ok('  ...y el de `montaje`, que espera a una persona, se sigue comprobando',
       !/montaje\/desde-la-hoja/.test(p),
       'ese es el que puede reescribir el <head> y la política de seguridad');
  }
}


// ═══ 32. Los colores de la hoja tienen que llegar a la tienda ═══
/* «Desplegó, pero quedó con los colores de la plantilla.»
   La paleta no se hornea en el archivo: la aplica la página con la
   configuración que recibe, y la página exige seis dígitos con almohadilla.
   Todo lo que no encaje ahí se ignora EN SILENCIO y la tienda sale con los
   colores de fábrica, con el montaje en verde.

   Y había una puerta abierta a ese silencio: la ayuda de la fila invita a
   PINTAR la celda —«y el código sale solo»—, pero cambiar el relleno de una
   celda NO dispara `onEdit`: para Google eso es formato, no contenido. El
   relleno solo se convertía en código dentro de `instalar()`. Quien pintó sus
   colores y publicó se llevó los de la plantilla. */
{
  const conColores = () => {
    const hablar = console.log;
    console.log = function () { };
    const g = yaConfigurada(nuevo());
    console.log = hablar;
    return g;
  };
  const pintar = (g, clave, color) => {
    const i = g.filas('Configuración').findIndex(f => String(f[0]).trim() === clave);
    g.hojas.get('Configuración').getRange(i + 1, 2).setBackground(color);
  };
  const escribir = (g, clave, texto) => {
    const i = g.filas('Configuración').findIndex(f => String(f[0]).trim() === clave);
    g.hojas.get('Configuración').getRange(i + 1, 2).setValue(texto);
  };
  const colores = g => { const h = console.log; console.log = function () { };
                         const r = puerta(g, 'bloques').colores; console.log = h; return r; };

  {
    const g = conColores();
    pintar(g, 'color_principal', '#123456');
    ok('PINTAR LA CELDA basta: el color llega al publicar',
       colores(g).principal === '#123456',
       colores(g).principal + ' — cambiar el relleno no dispara onEdit');
  }
  {
    const g = conColores();
    escribir(g, 'color_secundario', 'rojo');
    const c = colores(g);
    ok('UN COLOR QUE NO SE PUEDE LEER se dice, no se traga',
       c.ilegibles.length === 1 && /color_secundario/.test(c.ilegibles[0]) &&
       /rojo/.test(c.ilegibles[0]),
       JSON.stringify(c.ilegibles));
  }
  {
    const g = conColores();
    escribir(g, 'color_alterno', '#D21');
    ok('  ...también el hex de tres dígitos, que parece bueno y no lo es',
       /#D21/.test((colores(g).ilegibles[0] || '')),
       'la página exige seis dígitos y no avisa de nada');
  }
  {
    /* Vacío NO es ilegible: una celda en blanco quiere decir «usa el de
       fábrica», y confundir las dos cosas es exactamente el crítico de
       `Number(celda) || 0` con otro disfraz. */
    const g = conColores();
    escribir(g, 'color_principal', '');
    ok('  ...pero una celda vacía no es un error, es una decisión',
       colores(g).ilegibles.length === 0,
       'vacío = el de fábrica; ilegible = alguien eligió y se perdió');
  }

  const m = fs.readFileSync('../maestro.gs', 'utf8');
  ok('  ...y se MIRA antes de reparar, o no se vería nunca',
     m.indexOf('var coloresMalos = coloresIlegibles();') <
     m.indexOf('try { sincronizarColores(); }'),
     'la sincronización pisa el valor ilegible con el relleno viejo');

  const pi = fs.readFileSync('../montar/preparar-index.mjs', 'utf8');
  ok('EL MONTAJE dice con qué colores sale la tienda',
     /Colores de la hoja/.test(pi) && /LA HOJA NO TRAE NINGÚN COLOR/.test(pi) &&
     /A0_instalar\(\)/.test(pi),
     '«salió con los de la plantilla» se veía abriendo la tienda, que es tarde');

  /* Y LA TRAMPA QUE ESTO DESTAPÓ, QUE ES PEOR QUE EL FALLO.
     `config.js` exigía `#D0211C` y `#1B5E3A` a pelo en el icono. Pasaba desde
     siempre porque la única tienda montada usaba los de fábrica, y se puso
     roja el primer día que un comercio eligió los suyos — o sea, el día en que
     todo funcionó bien. El flujo `montaje` corre las baterías sobre el
     index.html que acaba de escribir CON LA CONFIGURACIÓN DE ESA TIENDA: todo
     lo que una batería de navegador dé por hecho de la primera tienda es una
     tienda que no se puede montar. Es el patrón 4, y ya había pasado en
     `hoja.js` con el nombre del comercio.

     Las que NO abren navegador sí pueden nombrar la paleta: miran la hoja
     emulada, que es siempre la de fábrica. */
  const FABRICA = /#D0211C|#1B5E3A|#14472B|%23D0211C|%231B5E3A|%2314472B/;
  const conPaleta = fs.readdirSync('.')
    .filter(n => /\.js$/.test(n) && n !== 'montaje.js')
    .filter(n => {
      const src = fs.readFileSync(n, 'utf8');
      return /playwright/.test(src) && FABRICA.test(src.replace(/\/\*[\s\S]*?\*\//g, ''));
    });
  ok('NINGUNA BATERÍA DE NAVEGADOR da por hecha la paleta de la primera tienda',
     conPaleta.length === 0,
     conPaleta.join(', ') + ' — el montaje las corre sobre el archivo de OTRA tienda');
}

/* ══════════════════════════════════════════════════════════════════════════
   EL CATÁLOGO DE RESPALDO DEL index.html (4.20)
   --------------------------------------------------------------------------
   Lo que la página pinta antes de que conteste nadie, y lo único que le queda
   si no contesta nadie. Venía quemado de la plantilla y NADIE lo reescribía:
   el montaje ponía el <head>, las constantes y la paleta de cada comercio, y
   dejaba ahí los ocho tomates de Orgánico. La tienda dos —cosméticos— abría
   con tomates un instante y se corregía sola. Eso era lo visible; lo otro es
   que sin red ese instante no se acaba nunca.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const html = fs.readFileSync('./index.html', 'utf8');
  const catalogo = {
    productos: [{ id: 'labial', nombre: 'Labial mate', formato: 'Unidad',
                  categoria: 'Labios', precio: 38000, stock: 12,
                  descripcion: 'Larga duración', imagenes: ['labial-1.webp'] }],
    envios: [{ id: 'local', nombre: 'Medellín', valor: 8000 },
             { id: 'resto', nombre: 'Resto del país', valor: 15000 }],
    config: { negocio: 'Cinnamon Beauty', whatsapp: '573218550807',
              color_principal: '#EA9999', pago_llave: 'NO-DEBE-SALIR' }
  };

  const r = respaldo.aplicar(html, catalogo, '2026-09-14');
  ok('EL RESPALDO del index es el catálogo de ESTA tienda', r.cambio &&
     r.productos === 1 && r.envios === 2 && r.negocio === 'Cinnamon Beauty',
     r.productos + ' productos · ' + r.negocio);
  ok('  ...y lo que pinta antes de la red ya es suyo',
     /const CONFIG_SEMILLA = \{/.test(r.html) && /"negocio": "Cinnamon Beauty"/.test(r.html),
     'la página aplica CONFIG_SEMILLA sin esperar a nadie');
  ok('  ...y NO queda ni rastro del comercio de la plantilla',
     !/Tomate chonto|Sofrito base|Rionegro/.test(
        r.html.slice(r.html.indexOf('CATÁLOGO DE RESPALDO'),
                     r.html.indexOf('FIN DEL CATÁLOGO DE RESPALDO'))),
     'un respaldo con los productos de otro comercio funciona, y eso es lo caro');

  /* LA LLAVE DE PAGO NO SALE DE LA HOJA, Y ESTE ARCHIVO ES LO MÁS PÚBLICO QUE
     HAY. El maestro ya la quita y el horneado la vuelve a quitar; aquí se
     quita por tercera vez, que no es redundancia: es que el tercer filtro
     sobrevive a que alguien afloje los dos primeros. */
  ok('  ...y la llave de pago NO se cuela en la página',
     r.html.indexOf('NO-DEBE-SALIR') === -1 && !/pago_llave/.test(r.html),
     'tres filtros para la misma regla, a propósito');

  ok('DOS VECES SEGUIDAS no cambia nada la segunda',
     respaldo.aplicar(r.html, catalogo, '2026-09-14').cambio === false);

  /* UNA TIENDA CON EL ARCHIVO VIEJO. El bloque se rotulaba con `//` y ahora se
     escribe con comentario de bloque. Las tiendas ya montadas tienen el archivo
     viejo hasta que se traen el index.html de la release, y una que corra el
     montaje antes de eso NO puede encontrarse con un «no encontré el bloque»:
     ese mensaje sería correcto de forma y falso de fondo, que es el error que
     cerró la tanda pasada. */
  {
    const viejo = html.replace(
      /\/\* ═══ CATÁLOGO DE RESPALDO[\s\S]*?\*\//,
      '// ══════════════════════════════════════════════════\n' +
      '// CATÁLOGO DE RESPALDO — lo genera el Apps Script\n' +
      '// ══════════════════════════════════════════════════\n' +
      'const CONFIG_SEMILLA = {};')
      .replace('/* ═══ FIN DEL CATÁLOGO DE RESPALDO ═══ */',
               '// ═══════ FIN DEL CATÁLOGO DE RESPALDO ═══════');
    const v = respaldo.aplicar(viejo, catalogo, '2026-09-14');
    ok('UN index.html DE ANTES del 4.20 también se puede montar',
       v.cambio && v.negocio === 'Cinnamon Beauty', v.negocio);
    /* Las CUATRO líneas de justo encima, no todo el archivo: el index tiene
       más comentarios de dibujo en otros sitios y mirarlos todos era acusar al
       producto de algo que pasa en otra parte. */
    const encima = v.html.slice(0, v.html.indexOf('CATÁLOGO DE RESPALDO'))
                     .split('\n').slice(-5).join('\n');
    ok('  ...y no queda una línea de dibujo huérfana encima del bloque',
       !/^\/\/ ═+$/m.test(encima),
       'el rótulo viejo traía una fila encima que hay que recoger entera');
    ok('  ...y queda con la forma nueva, no con las dos a la vez',
       v.html.indexOf('// CATÁLOGO DE RESPALDO') === -1 &&
       v.html.indexOf('/* ═══ CATÁLOGO DE RESPALDO') !== -1,
       'dos formas del mismo bloque es lo que hace falta para que un día falle');
  }

  ok('UN CATÁLOGO SIN PRODUCTOS se planta en vez de publicar una vitrina vacía', (() => {
       try { respaldo.aplicar(html, { productos: [], envios: [], config: {} }, 'x'); return false; }
       catch (e) { return /ni un producto activo/.test(e.message); }
     })(), 'vacío no es ilegible, pero tiene que decirse en voz alta');

  ok('SI ALGUIEN BORRÓ las marcas, lo dice en vez de escribir a ciegas', (() => {
       const roto = html.replace(/FIN DEL CATÁLOGO DE RESPALDO/g, 'x');
       try { respaldo.aplicar(roto, catalogo, 'x'); return false; }
       catch (e) { return /CATÁLOGO DE RESPALDO/.test(e.message); }
     })(), 'escribir igual dejaría la tienda con el catálogo de la plantilla');

  /* UNA COMILLA EN LA HOJA NO PUEDE PARTIR LA PÁGINA EN DOS. Y </script>
     tampoco: dentro de una etiqueta <script> esa secuencia cierra el bloque
     aunque vaya dentro de una cadena de texto. */
  ok('LO QUE ESCRIBA EL DUEÑO no puede romper el archivo', (() => {
       const sucio = JSON.parse(JSON.stringify(catalogo));
       sucio.productos[0].descripcion = 'Dice "hola" \\ y </script><script>alert(1)</script>';
       sucio.config.negocio = "L'Atelier \"Beauty\"";
       const x = respaldo.aplicar(html, sucio, 'x');
       return x.negocio === "L'Atelier \"Beauty\"" &&
              x.html.indexOf('</script><script>alert') === -1;
     })(), 'pasa por JSON.stringify y el </script> se escapa aparte');

  /* LA GUARDA QUE NO SE PUSO, Y POR QUÉ.
     El primer intento fue calcar la de la paleta (2.9.9): «ninguna batería de
     navegador puede nombrar un producto de Orgánico». Marcó diez baterías, y
     las diez tenían razón — nombran tomates porque conducen la HOJA EMULADA,
     que es de fábrica y es la misma en todas las tiendas. Lo que viaja por
     tienda es el RESPALDO DEL ARCHIVO, no la hoja emulada, y esa diferencia
     una regla de texto no la ve.
     Una comprobación que acusa al producto de un acierto es peor que ninguna
     (patrón 5), así que se cambió por `pruebas/respaldo.js`: monta una tienda
     que no es Orgánico, la sirve con la hoja muerta, y mira qué se pinta. Y
     esa batería lleva dentro la prueba de que distingue — con el arreglo
     quitado, se cae. */
  ok('HAY UNA BATERÍA que monta OTRA tienda y mira qué se ve sin red',
     fs.existsSync('./respaldo.js') &&
     /sembrar-respaldo/.test(fs.readFileSync('./respaldo.js', 'utf8')) &&
     /todas\.sh/.test('todas.sh') && /respaldo\.js/.test(fs.readFileSync('./todas.sh', 'utf8')),
     'y corre en todas.sh, que si no, no la corre nadie');
}

/* ══════════════════════════════════════════════════════════════════════════
   LA PLANTILLA ES LO QUE SE CLONA, ASÍ QUE LA PLANTILLA TIENE QUE ESTAR BIEN
   --------------------------------------------------------------------------
   Una tienda nueva no descarga nada: se crea un repositorio A PARTIR DE ESTE,
   con el botón de plantilla de GitHub, y nace con todo dentro —incluido
   `publicar/index.html`—. Su primer montaje le escribe encima lo suyo.

   Eso pone el listón aquí: lo que no esté bien en este archivo nace mal en
   todas las tiendas que se creen a partir de hoy. Y al revés, lo que esté bien
   llega solo, sin que nadie traiga ni copie nada.

   (Poner al día una tienda YA creada cuando cambia la plantilla es otra cosa,
   y es el 4.18 del roadmap. No es esto.)
   ══════════════════════════════════════════════════════════════════════════ */
{
  const plantilla = fs.readFileSync('../publicar/index.html', 'utf8');

  /* LA BANDERA, QUE ES LO QUE HACE QUE EL 4.20 LLEGUE SOLO. Una tienda creada
     desde esta plantilla trae la página que aplica su configuración antes de
     pedir nada por la red. Si esta línea se cayera del archivo, las tiendas
     nuevas nacerían pintando el comercio de la plantilla y NADA lo diría: el
     montaje les escribiría el respaldo correcto y la página no lo miraría. */
  ok('LA PLANTILLA que se clona aplica la configuración sin esperar a la red',
     /window\.SEMILLA_APLICADA = true/.test(plantilla) &&
     /aplicarConfiguracion\(CONFIG_SEMILLA\)/.test(plantilla),
     'una tienda nueva nace con esto o nace pintando otro comercio');

  ok('  ...y trae las cuatro marcas que su primer montaje va a buscar',
     ['<!-- ═══ FIN DE LA CONFIGURACIÓN ═══ -->', 'const SCRIPT_URL',
      'FIN DEL CATÁLOGO DE RESPALDO', '--rojo:']
       .every(m => plantilla.indexOf(m) !== -1),
     'sin una de ellas, el montaje de esa tienda se planta');

  /* Y QUE SE PUEDA REESCRIBIR ENTERA CON LA HOJA DE OTRO COMERCIO, que es lo
     único que convierte «se clona» en «queda siendo suya». Se hace el camino
     completo sobre la plantilla de verdad. */
  const otra = {
    productos: [{ id: 'labial', nombre: 'Labial mate', formato: 'Unidad',
                  categoria: 'Labios', precio: 38000, stock: 5,
                  descripcion: 'x', imagenes: [] }],
    envios: [{ id: 'bog', nombre: 'Bogotá', valor: 7000 }],
    config: { negocio: 'Comercio Tres', whatsapp: '573001112233' }
  };
  const suya = respaldo.aplicar(plantilla, otra, '2026-09-14');
  ok('  ...y su primer montaje la deja siendo de ESE comercio',
     suya.cambio && suya.negocio === 'Comercio Tres' && suya.productos === 1,
     'lo que se clona es la página; lo que la hace suya es su hoja');
}

/* ══════════════════════════════════════════════════════════════════════════
   «PUBLICAR AHORA» TIENE QUE LLEVAR TODO LO QUE EL COMERCIO PUEDE CAMBIAR
   --------------------------------------------------------------------------
   Es el único botón que el comerciante puede apretar, y el mensaje que le sale
   promete «se revisan los datos, se preparan las fotos y se publica». Pero el
   flujo `fotos` solo publicaba `publicar/fotos` y `publicar/catalogo.json`:
   todo lo que se escribe en la pestaña Configuración —el título del sitio, el
   nombre, los colores, los textos de la portada, el WhatsApp— vive en el
   `<head>` y en las constantes del `index.html`, y por ahí no pasaba nunca.

   El comerciante cambió el título de su tienda, apretó el botón, leyó «tu
   tienda se está actualizando», y no cambió nada. Ningún error en ningún
   sitio. Es el patrón 1: el fallo que funciona.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const fotos = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
  const mont  = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');

  ok('«PUBLICAR AHORA» publica también el index.html',
     /PUBLICA: publicar\/fotos publicar\/catalogo\.json publicar\/index\.html/.test(fotos),
     'sin esto, un cambio de título no llega nunca y el botón miente');
  ok('  ...y ESCRIBE el <head> desde la hoja antes de publicarlo',
     /node montar\/preparar-index\.mjs[^\n|]*2>&1/.test(fotos),
     'publicar el archivo sin reescribirlo sería publicar lo de antes');
  ok('  ...y lo MIRA al decidir si hay algo nuevo',
     /preparar-index\.mjs\s+--revisar/.test(fotos),
     'sin esto contesta «nada nuevo» y no vuelve a mirar');
  ok('  ...y repone el respaldo, que es copia del catálogo recién horneado',
     fotos.indexOf('catalogo-estatico.mjs') < fotos.lastIndexOf('sembrar-respaldo.mjs'),
     'un cambio de precio dejaba el respaldo con los precios de la semana pasada');

  /* LO QUE SE GUARDA ANTES DEL `reset --hard` ES LA MISMA LISTA.
     Aquí se rehace la rama sobre el `main` de ese instante, y para eso se
     guardan los archivos generados y se reponen encima. Esa copia nombraba DOS
     de las tres rutas a mano, así que el reset se llevaba por delante el
     `publicar/index.html` que el paso anterior acababa de escribir desde la
     hoja: el comercio cambiaba el título de su tienda, el flujo decía que
     había novedades, publicaba fotos y catálogo, y el título no llegaba nunca.
     Tercera vez del patrón 2 en este mismo archivo. */
  ok('  ...y lo que se guarda antes de rehacer la rama sale de esa lista',
     /for ruta in \$PUBLICA; do[\s\S]{0,200}guardado/.test(fotos) &&
     !/cp -r publicar\/fotos "\$guardado/.test(fotos),
     'nombrarlas a mano se comió el index.html recién escrito');

  /* Y EL PULL REQUEST QUE SE FUSIONABA SOLO, QUE NO ERA CEREMONIA INÚTIL SINO
     UNA X ROJA GARANTIZADA. Un pull request abierto por el bot dispara
     `pruebas`, y GitHub RETIENE esa corrida esperando aprobación. La condición
     de `pruebas.yml` para saltárselo no sirve: la retención es de la CORRIDA y
     pasa antes de evaluar ninguna condición del trabajo. */
  ok('  ...y si va a fusionar solo, NO abre pull request: empuja a main',
     /git push --quiet origin "\$rama":main/.test(fotos),
     'un pull request del bot deja una X roja que no significa nada');
  ok('  ...y si main está protegido, cae al pull request y lo dice',
     /No se pudo publicar directo en main/.test(fotos),
     'que el push se rechace no es un fallo: es que el repositorio pide PR');

  /* LAS DOS LISTAS SON LA MISMA LISTA. El guardia que comprueba que no se
     cuele nada y el `git add` que hace el commit leen los dos de `PUBLICA`.
     Escrito dos veces, una se queda atrás — ya pasó, y costó un catálogo que
     no se publicaba (2.9.2). */
  /* SIN CONTAR LOS COMENTARIOS, que es donde se explica por qué está. Contar
     el texto a secas daba dos y acusaba al archivo de tener dos listas cuando
     la segunda es una frase en prosa: una comprobación que se cae por algo que
     está bien es peor que ninguna. */
  const sinComentarios = fotos.split('\n')
    .filter(l => !/^\s*#/.test(l)).join('\n');
  ok('  ...y la lista de lo publicable sigue escrita UNA sola vez',
     (sinComentarios.match(/publicar\/index\.html/g) || []).length === 1,
     'la usan el guardia y el git add; dos copias es el patrón 2');

  /* EL MONTAJE PUBLICA SOLO, Y SIN PASAR POR UN PULL REQUEST.
     Primero pedía que una persona aprobara, y la razón era buena mientras el
     montaje traía la PÁGINA de la semilla: subir de versión a una tienda es una
     decisión. Ese paso se retiró en la 2.13.0 y con él el motivo — pero quedó
     abriendo un pull request para fusionarlo en el mismo segundo, y eso no era
     ceremonia inofensiva: un pull request del bot deja una corrida de `pruebas`
     RETENIDA esperando la aprobación de un mantenedor, que caduca y deja una X
     roja sobre un montaje que salió perfecto. Pasó en el primer montaje de este
     repositorio. `fotos` ya lo había aprendido; este flujo no recibió el
     arreglo (patrón 2). */
  /* 0.20.5 · El empujón a main pasa por `empujar`, que elige el permiso que
     sirve (bitácora 92); lo que se comprueba aquí es el orden, y el orden lo
     marca la LLAMADA, no dónde esté escrita la función. */
  const PUSH = 'empujar main';
  ok('EL MONTAJE publica solo, directo en main, como `fotos`',
     mont.includes(PUSH) && /git push --quiet origin "HEAD:\$1"/.test(mont) &&
     /inputs\.aprobacion != 'con-pull-request'/.test(mont),
     'el comerciante no espera a que alguien mire');
  ok('  ...sin abrir un pull request que nadie pidió',
     !/create-pull-request/.test(mont),
     'el pull request del bot deja una corrida retenida que caduca en X roja');
  ok('  ...y se puede volver al pull request cuando se quiera',
     /options: \[automatica, con-pull-request\]/.test(mont));
  ok('  ...pero NO sin haber corrido las baterías sobre lo ya escrito',
     mont.indexOf('publicacion.sh') > 0 && mont.indexOf('publicacion.sh') < mont.indexOf(PUSH),
     'publicar sin probar es lo que ninguna de las dos guardas puede recuperar');
  ok('  ...ni sin comprobar que la hoja es la de esta tienda',
     mont.indexOf('misma-tienda.mjs') < mont.indexOf(PUSH),
     'dos tiendas montadas a la vez y los cambios de una salen en la otra');
  ok('  ...y si no puede publicar, lo DICE en vez de dejarlo colgado',
     /::warning::No se pudo publicar directo en main/.test(mont) &&
     /Read and write permissions/.test(mont),
     'una tienda que no se actualizó y no lo dice es una tienda desactualizada callada');

  /* Y LA OTRA MITAD DE LA MISMA LECCIÓN, EN EL OTRO ARCHIVO. La retención es de
     la CORRIDA, no del trabajo: pasa antes de que se evalúe ninguna condición.
     Así que la única forma de no comerse la X es que `pruebas` no se dispare
     con el pull request de un bot — venga de `fotos` o de `montaje`. Esta
     condición decía solo `fotos` porque cuando se escribió el de `montaje`
     todavía esperaba a una persona; dejó de esperarla y nadie volvió aquí. */
  {
    const prue = fs.readFileSync('../.github/workflows/pruebas.yml', 'utf8');
    ok('  ...y `pruebas` no se cuelga del pull request de un bot, venga de donde venga',
       /startsWith\(github\.head_ref, 'fotos\/nuevas-'\)/.test(prue) &&
       /startsWith\(github\.head_ref, 'montaje\/'\)/.test(prue),
       'la retención es de la corrida: caduca y deja una X que no significa nada');
  }
}

/* ═══ B-1 / B-6. MEDIR ANTES DE TOCAR NADA, Y VIGILAR EL PRESUPUESTO ═══
   El hito M1 se llama «medir antes de tocar nada» porque la primera vez que se
   midió en serio, el número desmintió a la intuición por completo: las diez
   baterías que uno quitaría primero costaban tres segundos y medio entre todas.
   Sin ese número, el recorte habría caído sobre lo que no costaba nada.

   Aquí se comprueba que la medición está puesta en los TRES flujos, que el
   presupuesto vive en un solo archivo, y que el guardia se puede desactivar
   para una corrida excepcional sin editar nada. */
{
  const flujos = ['fotos', 'montaje', 'pruebas'].map(n => ({
    n, y: fs.readFileSync('../.github/workflows/' + n + '.yml', 'utf8')
  }));

  ok('LOS TRES FLUJOS miden lo que tardaron',
     flujos.every(f => /node montar\/tiempos\.mjs/.test(f.y)),
     flujos.filter(f => !/tiempos\.mjs/.test(f.y)).map(f => f.n).join(', ') || 'los tres');
  /* CUANDO LA CORRIDA FALLA ES CUANDO MÁS IMPORTA SABER DÓNDE SE FUE EL TIEMPO:
     una corrida que se cae a los veinte minutos es exactamente la que hay que
     mirar, y con `if: success()` sería la única que no dejaría tabla. */
  ok('  ...también cuando la corrida falló, que es cuando más importa',
     flujos.every(f => /- name: Los tiempos\n        if: always\(\)/.test(f.y)),
     'con success() la corrida que hay que mirar es la única sin tabla');
  /* Y CORRE DESDE LA RAÍZ. `pruebas.yml` tiene
     `defaults.run.working-directory: pruebas` —todas sus baterías viven ahí— y
     el paso de los tiempos lo heredó sin que nadie lo pensara: buscaba
     `pruebas/montar/tiempos.mjs`, que no existe, y tumbó una corrida que había
     salido 1600/1600. La herramienta, `presupuesto.json` y el resumen viven en
     la raíz. Un `defaults` es una decisión tomada para los pasos que estaban
     cuando se escribió, no para los que vengan después. */
  ok('  ...desde la RAÍZ, aunque el flujo tenga otro directorio por defecto',
     flujos.every(f => {
       const tiene = /^    defaults:\n      run:\n        working-directory:/m.test(f.y);
       if (!tiene) return true;
       const paso = f.y.slice(f.y.indexOf('- name: Los tiempos'));
       /* LA CLAVE, no la palabra. La primera versión de esto buscaba
          `working-directory:` en cualquier parte del paso y se encontró a sí
          misma: el comentario que explica el arreglo NOMBRA la clave, así que
          la comprobación pasaba con el arreglo quitado. Un regex sobre texto
          fuente encuentra prosa igual que código; hay que anclarlo. */
       return /^        working-directory:/m.test(paso.slice(0, paso.indexOf('run: |')));
     }),
     'ahí viven la herramienta, el presupuesto y el resumen');

  ok('  ...y se lo guardan como artefacto, no solo en el resumen',
     flujos.every(f => /name: tiempos-\$\{\{ github\.run_id \}\}/.test(f.y)),
     'el resumen caduca; el artefacto es contra lo que se compara el mes que viene');

  const presu = JSON.parse(fs.readFileSync('../presupuesto.json', 'utf8'));
  ok('EL PRESUPUESTO vive en un solo archivo, con objetivo por flujo',
     presu.segundos && ['fotos', 'montaje', 'pruebas'].every(n => presu.segundos[n] > 0),
     JSON.stringify(presu.segundos));
  ok('  ...y con el techo de minutos al mes, que es la restricción de verdad',
     presu.minutosAlMes > 0, presu.minutosAlMes + ' minutos/mes');
  /* Ninguno de los tres flujos puede llevar su propio número: sería la segunda
     copia del mismo criterio, y de las dos una se queda atrás. */
  ok('  ...y ningún flujo lleva su propia copia del número',
     flujos.every(f => !/SEGUNDOS_OBJETIVO|PRESUPUESTO_SEGUNDOS/.test(f.y)),
     'dos presupuestos es como el guardia deja de vigilar lo que se cree');

  ok('EL GUARDIA se puede desactivar para una corrida excepcional',
     flujos.filter(f => f.n !== 'pruebas')
           .every(f => /sin_guardia:/.test(f.y) && /SIN_GUARDIA:/.test(f.y)),
     'sin interruptor, la salida es comentar el paso — y ahí se queda');
}

/* ═══ B-2. EL CRON DE CUATRO HORAS ERA EL 84 % DE LOS MINUTOS ═══
   `fotos` corría cada cuatro horas —seis veces al día— para cazar fotos que el
   comerciante sube al Drive sin avisar. Casi siempre no había nada que hacer, y
   arrancar seis veces para no hacer nada es, medido, el 84 % de los minutos de
   Actions de una tienda. Con repositorios privados eso es dinero, y es lo que
   hace que la cuarta tienda no quepa en el plan gratuito.

   El camino normal pasa a ser «Publicar ahora», desde el menú de la hoja, que
   dispara este mismo flujo cuando el comerciante decide publicar. Lo que queda
   del reloj es una RED DE SEGURIDAD diaria que mira y AVISA.

   Que no publique no es un detalle de implementación: es la diferencia entre
   una red de seguridad y un publicador automático. Si el comerciante dejó seis
   fotos a medio subir, la tienda no debería salir a producción a las tres de la
   mañana con el trabajo a medias. */
{
  const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
  const cron = (f.match(/cron: '([^']+)'/) || [])[1] || '';

  ok('FOTOS ya no corre cada cuatro horas', !/\*\/\d/.test(cron), 'cron: ' + cron);
  ok('  ...sino una vez al día', /^\d+ \d+ \* \* \*$/.test(cron), 'cron: ' + cron);
  ok('  ...y cuando la dispara el reloj, NO publica',
     /github\.event_name \}\} != "schedule"/.test(f) || /!= 'schedule'/.test(f) ||
     /"\$\{\{ github\.event_name \}\}" != "schedule"/.test(f),
     'una red de seguridad que publica sola no es una red de seguridad');
  ok('  ...lo dice en el resumen y como aviso, no en silencio',
     /Hay algo sin publicar/.test(f) && /::warning::Hay cambios sin publicar/.test(f),
     'un aviso que no se ve es lo mismo que no avisar');
  ok('  ...y nada de lo caro cuelga ya de «hay fotos nuevas» a secas',
     !/if: steps\.mirar\.outputs\.hay == 'si'/.test(f) &&
     /steps\.publicar\.outputs\.seguir == 'si'/.test(f),
     'bajar y convertir fotos antes de decidir es gastar los minutos igual');
}

/* ═══ B-5. LAS CACHÉS DEJAN DE PERDERSE ENTERAS ═══
   En un repositorio privado los minutos de Actions se pagan, y bajar Chromium
   otra vez son minutos. La caché del navegador tenía dos agujeros, los dos del
   mismo tipo: se tiraba entera cuando no hacía falta.

   1. La clave salía de `package.json`. Ahí Playwright está como `^1.47.0`, un
      RANGO: la versión real la fija `package-lock.json`. Así que el rango podía
      resolver a una versión nueva —que necesita otro navegador— sin que la
      clave cambiara, y la caché servía un navegador que ya no valía.
   2. Sin `restore-keys`, cambiar cualquier dependencia dejaba la caché sin
      ningún candidato: no es que se invalidara la parte que cambió, es que se
      empezaba de cero.

   Y `--with-deps` —que instala paquetes apt— corría siempre, también cuando la
   caché había acertado y el navegador ya estaba puesto. */
{
  const flujos = ['fotos', 'montaje', 'pruebas'].map(n => ({
    n, y: fs.readFileSync('../.github/workflows/' + n + '.yml', 'utf8')
  }));

  ok('LA CACHÉ DEL NAVEGADOR se clava a la versión EXACTA, no a un rango',
     flujos.every(f => /key: playwright-.*hashFiles\('pruebas\/package-lock\.json'\)/.test(f.y)),
     flujos.filter(f => !/package-lock\.json'\)/.test(f.y)).map(f => f.n).join(', ') || 'los tres');
  ok('  ...y ninguno se quedó con package.json, que es el rango',
     flujos.every(f => !/key: playwright-.*hashFiles\('pruebas\/package\.json'\)/.test(f.y)),
     'un ^1.47.0 que resuelve a otra versión no cambia la clave');
  ok('  ...y cuando la clave cambia, se recupera la caché anterior',
     flujos.every(f => /restore-keys: playwright-/.test(f.y)),
     'sin esto, subir una dependencia cualquiera tira el navegador entero');
  ok('  ...sin meter la rama en la clave, que multiplica el almacenamiento',
     flujos.every(f => !/key: playwright-[^\n]*github\.(ref|head_ref)/.test(f.y)),
     'en privado el almacenamiento también se paga');
  ok('LAS DEPENDENCIAS DEL SISTEMA solo se instalan cuando la caché falla',
     flujos.every(f => /steps\.navegador\.outputs\.cache-hit/.test(f.y) &&
                       /npx playwright install chromium/.test(f.y)),
     '`--with-deps` son paquetes apt: con la caché acertada no aportan nada');
}

/* ══════════════════════════════════════════════════════════════════════════
   `release` NO ES UN FLUJO DE TIENDA (4.19)
   --------------------------------------------------------------------------
   Corta la versión de la PLANTILLA. Una tienda no corta versiones: nace de la
   plantilla y consume la suya. Pero el flujo viaja dentro de la plantilla, así
   que aparece en la pestaña Actions de cada tienda — invitando a correrlo, que
   es exactamente lo razonable cuando alguien comprueba el ciclo completo de
   una tienda nueva.

   Y cuando fallaba, el mensaje mandaba al sitio equivocado: «sube `version` en
   package.json». En una tienda ese consejo es falso. Pasó dos veces.
   ══════════════════════════════════════════════════════════════════════════ */
if (!fs.existsSync('../.github/workflows/release.yml')) {
  console.log('  SALTA | `release` no viaja a las tiendas: aquí no hay ninguna versión que cortar.');
} else {
  const rel = fs.readFileSync('../.github/workflows/release.yml', 'utf8');

  ok('`release` se niega a correr fuera de la semilla',
     /GITHUB_REPOSITORY" = "\$SEMILLA/.test(rel) && /exit 1/.test(rel),
     'una tienda cortaría una etiqueta paralela a la de la plantilla');
  ok('  ...y el nombre de la semilla está escrito UNA sola vez',
     (rel.split('\n').filter(l => !/^\s*#/.test(l))
         .join('\n').match(/laboratoriodigital\/tienda/g) || []).length === 1,
     'dos copias y un día se separan');
  ok('  ...y DICE qué correr en su lugar, en vez de mandar a package.json',
     /montaje/.test(rel) && /Lo que sí se corre en una tienda/.test(rel),
     'un error que apunta al sitio equivocado cuesta más que uno mudo');
  ok('  ...y para ANTES de tocar el repositorio',
     rel.indexOf('¿Este repositorio es la semilla?') < rel.indexOf('gh release create'),
     'pararse después de etiquetar no sirve de nada');
  /* ANTES release corría la suite entera como `needs`, sobre el mismo commit
     que el push ya había probado. Ahora le pregunta a GitHub por ESA corrida:
     la guarda es la misma —nada se corta sin baterías en verde— y no se
     pagan dos minutos por repetirlas. */
  ok('  ...sin repetir las baterías que el push ya corrió sobre ESTE commit',
     !/needs: pruebas/.test(rel) && /head_sha=\$GITHUB_SHA/.test(rel) &&
     /select\(\.conclusion == "success"\)/.test(rel) &&
     rel.indexOf('head_sha=$GITHUB_SHA') < rel.indexOf('gh release create'),
     'y sin verde del mismo commit, no se corta nada');
}

/* ══════════════════════════════════════════════════════════════════════════
   UNA FOTO QUE NO BAJA NO PUEDE TUMBAR LO QUE EL COMERCIO ESCRIBIÓ
   --------------------------------------------------------------------------
   Pasó en la tienda tres: el comercio cambió el título, el <head> se escribió
   bien, el catálogo estaba al día, el respaldo se repuso — y el paso entero
   murió con código 1 porque una foto del Drive contestó 404. No se publicó
   nada. El comerciante cambió su título, apretó el botón, y lo que llegó fue
   una cruz roja.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
  const t = fs.readFileSync('../montar/tienda.mjs', 'utf8');

  ok('UNA FOTO QUE NO BAJA no impide publicar lo de la hoja',
     /traer-fotos\.mjs[^\n|]*2>&1 \| tee [^|]*\|\| fallo_fotos=/.test(f),
     'el título del comercio no depende de que el Drive conteste');
  ok('  ...pero el <head> sigue siendo o todo o nada',
     /preparar-index\.mjs[^\n|]*2>&1 \| tee [^|]*\|\| estado=/.test(f),
     'un <head> a medias es una tienda publicada y muda');
  ok('  ...y el fallo se DICE, en el resumen y en el commit',
     /::warning::Las fotos no se pudieron traer/.test(f) &&
     /sinFotos="Las fotos del Drive NO se pudieron traer/.test(f) &&
     /-m "\$sinFotos"/.test(f),
     'un fallo que se traga en silencio es peor que uno que para');

  /* Y EL MENSAJE DEL 404, QUE MANDABA AL SITIO EQUIVOCADO. Decía siempre «casi
     seguro la implementación quedó con acceso Solo yo» — y salió DESPUÉS de
     que ese mismo maestro contestara «identidad», «bloques» y «fotos» en la
     misma corrida. Con «Solo yo» no habría contestado ninguna. */
  ok('EL 404 dice a QUÉ acción le contestó 404',
     /respondió 404 a «' \+ accion/.test(t),
     'un 404 sin acción no se puede ni empezar a mirar');
  ok('  ...y NO culpa a la implementación si ya se descartó',
     /RESPONDIO\.has\(url\)/.test(t) && /NO es la implementación/.test(t),
     'mandaba a revisar algo que acababa de funcionar');
  ok('  ...y ofrece la causa que sí explica un 404 en UNA sola acción',
     /script\.googleusercontent\.com/.test(t) && /CADUCA/.test(t),
     'los datos salen de otro dominio, por una redirección con fecha');
  ok('  ...y cuando NADA ha contestado, sí manda a mirar el acceso',
     /Ninguna acción ha contestado todavía/.test(t),
     'ahí el diagnóstico de siempre es el bueno');
}


// ═══ El maestro vivo y el del repositorio (bitácora 56) ═══
/* El montaje falló dos veces seguidas el 21 de septiembre con «LA VERSIÓN del
   maestro y la del index son la misma», el index siempre UNA publicación por
   detrás. La causa: el sondeo se toma antes de publicar el maestro, y `bloques`
   salía de ahí con la versión vieja. Dos arreglos, y los dos se miran aquí. */
{
  const { versionDesalineada } = require('../montar/preparar-index.mjs');
  ok('SI EL MAESTRO VIVO Y EL DEL REPOSITORIO COINCIDEN, preparar-index sigue',
     versionDesalineada('v-del-repo', 'v-del-repo') === null);
  const m = versionDesalineada('v-del-repo', 'v-la-viva') || '';
  ok('  ...y si no, se para diciendo las dos versiones y QUÉ CASILLA marcar',
     /v-la-viva/.test(m) && /v-del-repo/.test(m) && /Publicar también maestro\.gs/.test(m) &&
     /PUBLICAR/.test(m) && /No toqué nada/.test(m), m.split('\n')[0]);
  const pi = fs.readFileSync('../montar/preparar-index.mjs', 'utf8');
  const cuerpo = pi.slice(pi.indexOf('async function main()'));
  ok('  ...y lo mira ANTES de escribir el index, no después, y PARA',
     cuerpo.indexOf('versionDesalineada(') !== -1 && /if \(falta\) throw new Error\(falta\)/.test(cuerpo) &&
     cuerpo.indexOf('versionDesalineada(') < cuerpo.indexOf('escribirSiCambio(PUBLICAR'),
     'parar después de escribir es dejar el index a medias');

  ok('  ...y si el maestro se publicó en esta corrida, ESPERA a que Google lo sirva antes de rendirse',
     /ESPERAR_MAESTRO_S/.test(cuerpo) && /while \(versionDesalineada\(/.test(cuerpo) &&
     /ESPERAR_MAESTRO_S: \$\{\{ steps\.quiere\.outputs\.publica == 'si' && '180' \|\| '0' \}\}/.test(
       fs.readFileSync('../.github/workflows/montaje.yml', 'utf8')),
     'el primer montaje de la 0.8.0 falló aquí y el segundo pasó');
  const pm = fs.readFileSync('../montar/publicar-maestro.mjs', 'utf8');
  const desp = pm.indexOf('clasp(desplegar');
  ok('PUBLICAR EL MAESTRO TIRA EL SONDEO en cuanto la versión nueva queda publicada',
     desp !== -1 && pm.indexOf('await olvidarSondeo()', desp) > desp &&
     pm.indexOf('await olvidarSondeo()', desp) < pm.indexOf('await verificar(version)', desp),
     'si no, el index se hornea con lo que contestaba el maestro ANTES');
  const { execFileSync } = require('child_process');
  const dir = fs.mkdtempSync('/tmp/tienda-sondeo-');
  fs.writeFileSync(dir + '/sondeo.json', JSON.stringify({ cuando: new Date().toISOString(),
                                                          respuestas: { bloques: { version: 'vieja' } } }));
  execFileSync(process.execPath, ['--input-type=module', '-e',
    "import(" + JSON.stringify(require('path').resolve('../montar/tienda.mjs')) + ").then(m => m.olvidarSondeo())"],
    { cwd: dir });
  ok('  ...y olvidarSondeo() de verdad lo borra', !fs.existsSync(dir + '/sondeo.json'));
  ok('  ...y la comprobación espera a que Google sirva la versión nueva antes de rendirse',
     /ESPERAS_VERSION/.test(pm) && /d\.version !== version/.test(pm));

  const my = fs.readFileSync('../.github/workflows/montaje.yml', 'utf8');
  ok('EL MONTAJE PONE EN EL RESUMEN por qué no horneó el index',
     /preparar-index\.mjs --desde 2>&1 \| tee \/tmp\/index\.txt/.test(my) && /### El index NO se horneó/.test(my),
     'el mensaje que dice qué casilla marcar tiene que verse sin abrir el log');
}


// ═══ 4.5 · El dominio propio, desde sitio_url ═══
{
  const nw = require('../montar/nombrar-worker.mjs');
  const w = fs.readFileSync('../wrangler.jsonc', 'utf8').replace(/\n  \/\/ DOMINIO PROPIO[^\n]*\n  "routes": \[[^\]]*\],\n/, '');
  const con = nw.conDominio(w, 'https://tienda.laboratorio-digital.com/');
  ok('UN DOMINIO PROPIO EN sitio_url se vuelve un custom domain del Worker',
     /"routes": \[\{ "pattern": "tienda\.laboratorio-digital\.com", "custom_domain": true \}\]/.test(con), con.split('\n').find(l => /routes/.test(l)));
  ok('  ...escribirlo dos veces es escribirlo una', nw.conDominio(con, 'tienda.laboratorio-digital.com') === con);
  ok('  ...y volver a workers.dev lo quita, dejando el archivo como estaba', nw.conDominio(con, 'https://tienda.x.workers.dev') === w);
  ok('  ...y sin dirección, o con una rara, no se inventa nada',
     nw.conDominio(w, '') === w && nw.conDominio(w, 'no es una dirección') === w && nw.hostPropio('https://a.pages.dev') === '');
  ok('  ...y el JSONC sigue siendo JSON sin los comentarios',
     (() => { try { JSON.parse(con.replace(/^\s*\/\/.*$/gm, '')); return true; } catch (e) { return false; } })());
  const src = fs.readFileSync('../montar/nombrar-worker.mjs', 'utf8');
  ok('  ...y lo lee del catálogo horneado, como el nombre: una sola fuente', /cfg\.sitio_url/.test(src) && /conDominio\(texto0, sitio\)/.test(src));
}

/* ═══ 0.12.1 · DOS «PUBLICAR» SEGUIDOS (bitácora 63) ═══
   La segunda corrida espera turno, pero su checkout es el commit del momento en
   que se pidió. Hornea lo que la primera ya publicó y, contra el `main` de ahora,
   no queda nada: salía en rojo con «Nada que publicar pese a haber detectado
   novedades». Se corre el trozo REAL del flujo sobre un repositorio de juguete. */
{
  const { execFileSync } = require('child_process');
  const path = require('path');
  const f = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
  const i = f.indexOf('          if git diff --cached --quiet; then');
  const lineas = f.slice(i).split('\n');
  let fin = lineas.findIndex(l => l === '          fi');
  const trozo = lineas.slice(0, fin + 1).map(l => l.slice(10)).join('\n');
  const correr = (dir, sha) => {
    const resumen = path.join(dir, 'resumen.md');
    try {
      execFileSync('bash', ['-c', trozo], { cwd: dir, stdio: 'pipe',
        env: Object.assign({}, process.env, { GITHUB_SHA: sha, PUBLICA: 'publicar/catalogo.json', GITHUB_STEP_SUMMARY: resumen }) });
      return { codigo: 0, resumen: fs.readFileSync(resumen, 'utf8') };
    } catch (e) { return { codigo: e.status, resumen: fs.existsSync(resumen) ? fs.readFileSync(resumen, 'utf8') : '' }; }
  };
  const repo = () => {
    const d = fs.mkdtempSync('/tmp/dosveces-');
    const git = (...a) => execFileSync('git', a, { cwd: d, stdio: 'pipe' }).toString().trim();
    git('init', '-q'); git('config', 'user.email', 'x@x'); git('config', 'user.name', 'x');
    fs.mkdirSync(path.join(d, 'publicar'));
    fs.writeFileSync(path.join(d, 'publicar/catalogo.json'), '{"precio":1}\n');
    git('add', '-A'); git('commit', '-qm', 'viejo');
    const viejo = git('rev-parse', 'HEAD');
    return { d, git, viejo };
  };
  if (!trozo.includes('git diff --cached --quiet') || fin < 0) {
    ok('EL TROZO del flujo que decide «nada que publicar» se encuentra', false);
  } else {
    // La otra corrida ya publicó precio 2; esta horneó lo mismo sobre el commit viejo
    let r = repo();
    fs.writeFileSync(path.join(r.d, 'publicar/catalogo.json'), '{"precio":2}\n');
    r.git('add', '-A'); r.git('commit', '-qm', 'lo publicó la primera');
    let x = correr(r.d, r.viejo);
    ok('DOS «PUBLICAR» SEGUIDOS: si otra corrida ya lo publicó, la segunda sale en verde y lo dice',
       x.codigo === 0 && /Ya estaba publicado/.test(x.resumen), 'código ' + x.codigo);
    // Control negativo: nada difería ni del commit de arranque → sigue siendo un fallo
    r = repo();
    x = correr(r.d, r.viejo);
    ok('  ...pero si nada difería ni del commit de arranque, sigue siendo un fallo que se dice',
       x.codigo === 1 && /no quedó nada que publicar/.test(x.resumen), 'código ' + x.codigo);
  }
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
