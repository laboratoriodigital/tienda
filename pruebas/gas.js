/* ============================================================================
   Emulador de Google Apps Script + Sheets.
   ----------------------------------------------------------------------------
   Carga apps-script.gs TAL CUAL y le da un Google Sheets simulado. Las pruebas
   dejan de comprobar una imitación escrita a mano y pasan a ejercitar el código
   que de verdad se pega en el editor de Google.
   ============================================================================ */
const fs = require('fs');

/* Apps Script devuelve los bytes CON SIGNO (-128..127), que es la herencia de
   Java. Emularlo importa: el código que los pasa a hexadecimal sin el
   `& 0xff` da otra cosa, y con bytes sin signo esa diferencia no se ve. */
const conSigno = buf => Array.from(buf).map(b => (b > 127 ? b - 256 : b));
const aSinSigno = bytes => Buffer.from(bytes.map(b => (b < 0 ? b + 256 : b)));
const algoritmoNode = alg => ({ MD5:'md5', SHA_1:'sha1', SHA_256:'sha256' }[alg] || 'sha256');

/* El maestro trae dos constantes que se llenan a mano al instalarlo. El
   emulador las rellena igual que lo haría el instalador, para que las pruebas
   ejerciten el archivo tal como queda desplegado. */
const HOJA_EMULADA = '1AbC-hoja-de-prueba';
const TOKEN_EMULADO = 'token-de-prueba-largo';

function crear(rutaScript, opciones) {
  opciones = opciones || {};
  const hojas = new Map();
  let cache = {};
  let triggers = [];
  let toasts = [];
  let correos = [];
  let cuotaCorreo = 100;
  let ventanas = [];
  let menu = [];
  let hayInterfaz = true;
  let idAbierto = null;
  /* Propiedades con las que nace el proyecto (0.17.0): las que ya estaban
     guardadas antes de que se evalúe el código, como pasa en Apps Script. */
  let props = Object.assign({}, (opciones && opciones.props) || {});
  let urlServicio = opciones.url === undefined ? 'https://script.google.com/macros/s/EMULADO/exec' : opciones.url;

  const celda = v => (v === undefined || v === null ? '' : v);

  /* La red, simulada. responder(patron, fn) decide qué contesta cada URL: sin
     eso no hay forma de probar una tienda caída sin apagar una de verdad. */
  let rutas = [];
  let peticionesVistas = [];
  let fetchAllRevienta = false;
  /* Drive, simulado. Solo lo que el maestro usa: listar una carpeta, abrir un
     archivo y preguntarle quién es su padre. */
  const carpetasDrive = new Map();      // idCarpeta -> [archivo]
  const sueltosDrive = new Map();       // archivos del Drive fuera de esa carpeta
  const carpetasNegadas = new Set();    // carpetas sin permiso de escritura
  const carpetasDeSoloLectura = new Set(); // se abren y se listan, pero no aceptan archivos
  let seqDrive = 0;
  const archivoDrive = (a, idCarpeta) => ({
    getId: () => a.id,
    getDateCreated: () => new Date(a.creado || a.modificado || '2026-01-01T00:00:00Z'),
    setTrashed(v) { a.papelera = !!v; return this; },
    makeCopy(nombre, carpeta) {
      if (carpeta && carpeta._negada) throw new Error('sin permiso sobre la carpeta');
      const copia = { id: 'copia-' + (++seqDrive), nombre: nombre,
                      bytes: a.bytes, creado: new Date().toISOString() };
      const destino = carpeta ? carpeta.getId() : idCarpeta;
      if (!carpetasDrive.has(destino)) carpetasDrive.set(destino, []);
      carpetasDrive.get(destino).push(copia);
      return archivoDrive(copia, destino);
    },
    getName: () => a.nombre,
    getSize: () => a.bytes === undefined ? String(a.contenido || '').length : a.bytes,
    getMimeType: () => a.tipo || 'image/jpeg',
    getLastUpdated: () => new Date(a.modificado || '2026-01-01T00:00:00Z'),
    getBlob: () => ({ getBytes: () => a.contenido || 'bytes-de-' + a.nombre }),
    getParents: () => {
      let dado = false;
      return { hasNext: () => !dado && idCarpeta !== null,
               next: () => { dado = true; return { getId: () => idCarpeta }; } };
    }
  });

  /* La petición entera llega a quien contesta —método, cabeceras—: una API
     autenticada se prueba mirando CON QUÉ se le preguntó, no solo a qué. */
  const respuestaDe = (url, op) => {
    for (const [patron, fn] of rutas) {
      if (url.indexOf(patron) !== -1) {
        const r = fn(url, op || {});
        return { getResponseCode: () => r.codigo === undefined ? 200 : r.codigo,
                 getContentText: () => typeof r.cuerpo === 'string'
                   ? r.cuerpo : JSON.stringify(r.cuerpo) };
      }
    }
    return { getResponseCode: () => 404, getContentText: () => 'no encontrado' };
  };

  /* LA LLAVE, DE VERDAD. Antes `LockService` era un objeto que decía que sí a
     todo, y con eso «toda escritura va bajo llave» era imposible de comprobar:
     una escritura sin llave y una con llave se veían igual. Ahora la llave
     sabe si está tomada, y cada escritura queda anotada con eso. */
  const llave = { tomada: false, veces: 0 };
  const escrituras = [];
  const anotarEscritura = (hoja, como) => escrituras.push({ hoja, como, conLlave: llave.tomada });

  function nuevaHoja(nombre) {
    const datos = [];   // matriz [fila][col], 0-based
    const formato = new Map();      // "fila,col" -> {fondo, color, negrita, ...}
    const formulas = new Map();     // "fila,col" -> texto de la fórmula
    const uniones = [];             // [{f, c, nf, nc}]
    const anchos = {}, altos = {};
    let ocultarCuadricula = false;
    const fmt = (f, c) => {
      const k = f + ',' + c;
      if (!formato.has(k)) formato.set(k, {});
      return formato.get(k);
    };
    const asegurar = (f, c) => {
      while (datos.length < f) datos.push([]);
      const fila = datos[f - 1];
      while (fila.length < c) fila.push('');
      return fila;
    };
    const h = {
      _nombre: nombre, _datos: datos,
      getName: () => nombre,
      getLastRow: () => datos.length,
      getLastColumn: () => datos.reduce((m, f) => Math.max(m, f.length), 0),
      setFrozenRows: (n) => { h._filasFijas = n; return h; },
      setFrozenColumns: (n) => { h._columnasFijas = n; return h; },
      setColumnWidth: (c, w) => { anchos[c] = w; return h; },
      setRowHeight: (f, a) => { altos[f] = a; return h; },
      setHiddenGridlines: (b) => { ocultarCuadricula = !!b; return h; },
      getMaxRows: () => Math.max(datos.length, 1),
      getMaxColumns: () => Math.max(1, datos.reduce((m, f) => Math.max(m, f.length), 0)),
      _formato: formato, _formulas: formulas, _uniones: uniones,
      _anchos: anchos, _altos: altos,
      get _sinCuadricula() { return ocultarCuadricula; },
      appendRow(fila) {
        anotarEscritura(nombre, 'appendRow');
        datos.push(fila.map(celda));
        return h;
      },
      deleteRows(desde, cuantas) {
        anotarEscritura(nombre, 'deleteRows');
        datos.splice(desde - 1, cuantas);
        return h;
      },
      getRange(f, c, nf, nc) {
        nf = nf || 1; nc = nc || 1;
        if (typeof f !== 'number') throw new Error('getRange: fila inválida ' + f);
        if (f < 1 || c < 1) throw new Error('getRange fuera de rango: ' + f + ',' + c);
        const r = {
          getValue() { return celda((datos[f - 1] || [])[c - 1]); },
          getValues() {
            const out = [];
            for (let i = 0; i < nf; i++) {
              const fila = datos[f - 1 + i] || [];
              const salida = [];
              for (let j = 0; j < nc; j++) salida.push(celda(fila[c - 1 + j]));
              out.push(salida);
            }
            return out;
          },
          setValues(v) {
            anotarEscritura(nombre, 'setValues');
            if (v.length !== nf) throw new Error('setValues: esperaba ' + nf + ' filas, recibió ' + v.length);
            v.forEach((fila, i) => {
              if (fila.length !== nc) throw new Error('setValues: esperaba ' + nc + ' columnas, recibió ' + fila.length);
              const destino = asegurar(f + i, c + nc - 1);
              fila.forEach((x, j) => destino[c - 1 + j] = celda(x));
            });
            return r;
          },
          setValue(x) { anotarEscritura(nombre, 'setValue'); asegurar(f, c)[c - 1] = celda(x); return r; },
          clearContent() {
            for (let i = 0; i < nf; i++) { const fila = datos[f - 1 + i];
              if (fila) for (let j = 0; j < nc; j++) fila[c - 1 + j] = ''; }
            return r;
          },
          setFormula(t) { formulas.set(f + ',' + c, String(t)); asegurar(f, c)[c - 1] = String(t); return r; },
          getFormula() { return formulas.get(f + ',' + c) || ''; },
          setFormulas(m) {
            m.forEach((fila, i) => fila.forEach((x, j) => {
              if (x === '' || x === null || x === undefined) return;
              formulas.set((f + i) + ',' + (c + j), String(x));
              asegurar(f + i, c + j + 0)[c - 1 + j] = String(x);
            }));
            return r;
          },
          merge() { uniones.push({ f, c, nf, nc }); return r; },
          cada(prop, valor) {
            for (let i = 0; i < nf; i++) for (let j = 0; j < nc; j++) fmt(f + i, c + j)[prop] = valor;
            return r;
          },
          setFontWeight(v) { return r.cada('negrita', v); },
          setNumberFormat(v) { return r.cada('formato', v); },
          setWrap(v) { return r.cada('ajustar', v); },
          setBackground(v) { return r.cada('fondo', v); },
          setFontColor(v) { return r.cada('color', v); },
          setFontSize(v) { return r.cada('tam', v); },
          setFontFamily(v) { return r.cada('fuente', v); },
          setFontStyle(v) { return r.cada('estilo', v); },
          setHorizontalAlignment(v) { return r.cada('alineado', v); },
          setVerticalAlignment(v) { return r.cada('vertical', v); },
          setBorder() { return r.cada('borde', true); },
          clear() { return r.clearContent(); },
          setDataValidation(regla) { return r.cada('validacion', regla); },
          clearDataValidations() { return r.cada('validacion', null); },
          getDataValidation() { return (formato.get(f + ',' + c) || {}).validacion || null; },
          getBackground() { return (formato.get(f + ',' + c) || {}).fondo || '#ffffff'; },
          getBackgrounds() {
            const out = [];
            for (let i = 0; i < nf; i++) { const fila = [];
              for (let j = 0; j < nc; j++) fila.push((formato.get((f + i) + ',' + (c + j)) || {}).fondo || '#ffffff');
              out.push(fila); }
            return out;
          },
          setBackgrounds(m) {
            m.forEach((fila, i) => fila.forEach((x, j) => fmt(f + i, c + j).fondo = x));
            return r;
          }
        };
        return r;
      }
    };
    return h;
  }

  const libro = {
    getName: () => 'Orgánico — pedidos',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/EMULADO',
    getSheetByName: n => hojas.get(n) || null,
    getSheets: () => Array.from(hojas.values()),
    insertSheet(n) { const h = nuevaHoja(n); hojas.set(n, h); return h; },
    toast: (m, t) => toasts.push(t + ': ' + m)
  };

  /* OTRO LIBRO, para probar lo que LEE de un archivo que no es esta hoja: una
     copia de respaldo (restaurar.js). Solo lo que el maestro usa de ella:
     abrirla por id, pedirle una pestaña y leerle el rango con datos. */
  const librosExtra = new Map();
  const otroLibro = (id, pestanas, nombre) => {
    const suyas = new Map(Object.entries(pestanas || {}));
    librosExtra.set(id, {
      getName: () => nombre || ('Copia ' + id),
      getSheetByName: n => {
        if (!suyas.has(n)) return null;
        const datos = suyas.get(n);
        return { getName: () => n,
                 getDataRange: () => ({ getValues: () => datos.map(f => f.slice()) }) };
      }
    });
    return librosExtra.get(id);
  };

  const entorno = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      openById: (id) => {
        if (!id) throw new Error('openById sin id');
        idAbierto = id;
        return librosExtra.get(id) || libro;
      },
      BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM' },
      newDataValidation: () => {
        const regla = { _lista: null, _permiteOtros: true, _ayuda: '', _menu: true };
        const b = {
          requireValueInList(lista, menu) { regla._lista = lista.slice();
                                            regla._menu = menu !== false; return b; },
          setAllowInvalid(v) { regla._permiteOtros = !!v; return b; },
          setHelpText(t) { regla._ayuda = String(t); return b; },
          build: () => regla
        };
        return b;
      },
      getUi: () => {
        // Los disparadores corren sin interfaz: allí getUi() revienta de verdad.
        if (!hayInterfaz) throw new Error('Cannot call SpreadsheetApp.getUi() from this context');
        return ({
        createMenu: () => {
          const m = { addItem: (rotulo, fn) => { menu.push([rotulo, fn]); return m; },
                      /* El menú del panel de tiendas tiene una raya: sin esto,
                         onOpen() revienta y la prueba culpa al menú. */
                      addSeparator: () => m,
                      addToUi: () => {} };
          return m;
        },
        showModalDialog: (salida, titulo) => ventanas.push({ titulo, html: salida._html }),
        alert: (t) => ventanas.push({ titulo: 'alerta', html: String(t) })
        });
      }
    },
    HtmlService: {
      createHtmlOutput: h => ({ _html: String(h),
        setWidth() { return this; }, setHeight() { return this; },
        getContent() { return this._html; } })
    },
    CacheService: { getScriptCache: () => ({
      get: k => (k in cache ? cache[k] : null),
      put: (k, v) => { cache[k] = String(v); },
      remove: k => { delete cache[k]; }
    }) },
    LockService: { getScriptLock: () => ({
      waitLock() { llave.tomada = true; llave.veces++; },
      tryLock() { llave.tomada = true; llave.veces++; return true; },
      hasLock: () => llave.tomada,
      releaseLock() { llave.tomada = false; }
    }) },
    ContentService: {
      createTextOutput: t => ({ _texto: t, setMimeType() { return this; }, getContent() { return this._texto; } }),
      MimeType: { JSON: 'application/json', TEXT: 'text/plain' }
    },
    ScriptApp: {
      getProjectTriggers: () => triggers,
      newTrigger(f) {
        const alta = () => triggers.push({ getHandlerFunction: () => f });
        const diario = { everyDays: () => ({ create: alta }) };
        const semanal = { atHour: () => ({ create: alta }), create: alta };
        return { timeBased: () => ({ everyHours: () => ({ create: alta }),
                                     everyMinutes: () => ({ create: alta }),
                                     atHour: () => diario,
                                     onWeekDay: () => semanal,
                                     everyDays: () => ({ create: alta }) }),
                 forSpreadsheet: () => ({ onEdit: () => ({ create: alta }),
                                          onOpen: () => ({ create: alta }) }) };
      },
      deleteTrigger: t => { triggers = triggers.filter(x => x !== t); },
      getScriptId: () => 'ScriptIdEmulado123456',
      getService: () => ({ getUrl: () => urlServicio }),
      WeekDay: { SUNDAY: 'SUNDAY', MONDAY: 'MONDAY' }
    },
    Utilities: {
      /* Con un arreglo de bytes se codifican LOS BYTES; con texto, su UTF-8.
         Antes cualquier cosa pasaba por String(), así que un byte[] acababa
         codificando la cadena "12,-34,56": parecía base64 y no era el
         contenido. */
      base64Encode: b => Buffer.from(Array.isArray(b) ? aSinSigno(b) : Buffer.from(String(b)))
                               .toString('base64'),
      base64EncodeWebSafe: b => Buffer.from(Array.isArray(b) ? aSinSigno(b) : Buffer.from(String(b)))
                                      .toString('base64url'),
      base64Decode: s => conSigno(Buffer.from(String(s), 'base64')),
      base64DecodeWebSafe: s => conSigno(Buffer.from(String(s), 'base64url')),

      /* HASH Y FIRMA DE VERDAD, Y NO ES UN LUJO.
         `computeDigest` devolvía los bytes del texto sin tocarlos: una función
         que se llama «hash» y es la identidad. Cualquier prueba de una clave
         guardada con eso habría pasado en verde sin comprobar NADA —y desde
         D-1 hay claves guardadas—. Se emula con el crypto de node, y con los
         bytes CON SIGNO, que es como los devuelve Apps Script: si el maestro
         se olvida del `& 0xff` al pasarlos a hexadecimal, tiene que romperse
         aquí igual que se rompería en Google. */
      computeDigest: (alg, txt) =>
        conSigno(require('crypto').createHash(algoritmoNode(alg))
                 .update(String(txt), 'utf8').digest()),
      computeHmacSha256Signature: (valor, clave) =>
        conSigno(require('crypto').createHmac('sha256', String(clave))
                 .update(String(valor), 'utf8').digest()),
      DigestAlgorithm: { MD5: 'MD5', SHA_1: 'SHA_1', SHA_256: 'SHA_256' },
      /* Doce hexadecimales SIEMPRE, como un UUID de verdad. `Math.random()`
         pasado a hexadecimal a veces da menos cifras, y entonces la sal de
         una clave salía de 31 caracteres una vez de cada sesenta: entrar.js
         fallaba de tanto en tanto por el emulador, no por el maestro. Un rojo
         intermitente es el peor rojo — enseña a volver a correr hasta el verde. */
      /* Y aleatorio ENTERO, como el de Google (M5): el maestro saca de aquí
         los números de pedido y los secretos del seguimiento. Con un prefijo
         fijo, aleatorio(8) repetía y crearCobro se quedaba buscando un número
         libre para siempre. */
      getUuid: () => require('crypto').randomUUID(),
      /* Con un arreglo de bytes, el blob son ESOS bytes y su texto es el UTF-8
         que forman. Antes pasaba por String() y `getDataAsString()` devolvía
         "104,111,108,97", que no se parece en nada a lo que devuelve Google. */
      newBlob: (contenido, tipo, nombre) => {
        const bytes = Array.isArray(contenido) ? aSinSigno(contenido) : null;
        const texto = bytes ? bytes.toString('utf8') : String(contenido);
        return { _contenido: texto, _tipo: tipo, _nombre: nombre, _bytes: bytes,
                 getName: () => nombre, getContentType: () => tipo,
                 getBytes: () => (bytes ? conSigno(bytes) : conSigno(Buffer.from(texto))),
                 getDataAsString: () => texto };
      }
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in props ? props[k] : null),
        getProperties: () => Object.assign({}, props),
        setProperty: (k, v) => { props[k] = String(v); },
        deleteProperty: k => { delete props[k]; }
      })
    },
    DriveApp: {
      getFolderById(id) {
        if (carpetasNegadas.has(id)) { const e = new Error('sin permiso'); e._negada = true; throw e; }
        if (!carpetasDrive.has(id)) throw new Error('Carpeta inexistente: ' + id);
        return {
          getId: () => id,
          getFiles() {
            const lista = carpetasDrive.get(id).filter(x => !x.papelera);
            let i = 0;
            return { hasNext: () => i < lista.length,
                     next: () => archivoDrive(lista[i++], id) };
          },
          /* D-2c · subir una foto. Guarda lo que se le da —nombre, tipo y
             bytes— para que una prueba pueda mirar qué llegó a la carpeta. */
          createFile(blob) {
            if (carpetasDeSoloLectura.has(id)) throw new Error('Access denied: DriveApp.');
            const a = { id: 'subida-' + (++seqDrive), nombre: blob.getName(),
                        tipo: blob.getContentType ? blob.getContentType() : '',
                        bytes: blob._bytes ? blob._bytes.length : String(blob._contenido || '').length,
                        _bytes: blob._bytes || null,
                        creado: new Date().toISOString(), modificado: new Date().toISOString() };
            carpetasDrive.get(id).push(a);
            return archivoDrive(a, id);
          }
        };
      },
      getFileById(id) {
        if (id === hojaId) return archivoDrive({ id: hojaId, nombre: 'Orgánico — pedidos' }, null);
        for (const [carpeta, lista] of carpetasDrive) {
          const a = lista.find(x => x.id === id);
          if (a) return archivoDrive(a, carpeta);
        }
        // Un archivo suelto del Drive, fuera de la carpeta de fotos.
        if (sueltosDrive.has(id)) return archivoDrive(sueltosDrive.get(id), null);
        throw new Error('Archivo inexistente: ' + id);
      }
    },
    UrlFetchApp: {
      fetch(url, op) { return respuestaDe(url, op); },
      fetchAll(peticiones) {
        peticionesVistas.push(peticiones.map(p => p.url));
        if (fetchAllRevienta) throw new Error('fetchAll caído');
        return peticiones.map(p => respuestaDe(p.url));
      }
    },
    MailApp: {
      getRemainingDailyQuota: () => cuotaCorreo,
      sendEmail(opciones) {
        if (cuotaCorreo < 1) throw new Error('sin cuota de correo');
        cuotaCorreo--;
        correos.push(opciones);
      }
    },
    console
  };

  /* Ejecutamos el archivo real UNA sola vez, en un solo ámbito, y sacamos de ahí
     todas sus funciones. Evaluarlo varias veces crearía ámbitos distintos y las
     variables del módulo no se compartirían: las pruebas mentirían. */
  let codigo = fs.readFileSync(rutaScript, 'utf8');
  const hojaId = opciones.hojaId === undefined ? HOJA_EMULADA : opciones.hojaId;
  codigo = codigo.replace(/var HOJA_ID = '[^']*';/, "var HOJA_ID = '" + hojaId + "';");
  const nombres = Object.keys(entorno);
  const declaradas = (codigo.match(/^function\s+([A-Za-z0-9_]+)/gm) || [])
    .map(d => d.replace(/^function\s+/, ''));
  /* Y LAS CONSTANTES DEL MÓDULO, no solo las funciones. Desde D-1 hay tablas
     que SON el contrato —qué puertas existen y quién guarda cada una— y una
     prueba que no las puede leer solo puede comprobarlas de rebote, probando
     una por una las que ya conoce; justo la puerta nueva que a alguien se le
     olvidó declarar es la que no aparecería en esa lista. */
  const constantes = (codigo.match(/^var\s+([A-Za-z0-9_]+)\s*=/gm) || [])
    .map(d => d.replace(/^var\s+/, '').replace(/\s*=$/, ''))
    .filter(v => nombres.indexOf(v) === -1 && declaradas.indexOf(v) === -1);
  const devolver = '\n; return {' +
    declaradas.concat([...new Set(constantes)]).map(f => f + ': ' + f).join(', ') + '};';
  const api = new Function(...nombres, codigo + devolver).apply({}, nombres.map(k => entorno[k]));

  return { api, libro, hojas, toasts,
           get triggers() { return triggers; },
           get cache() { return cache; },
           get correos() { return correos; },
           get ventanas() { return ventanas; },
           get menu() { return menu; },
           sinCuota() { cuotaCorreo = 0; },
           sinInterfaz() { hayInterfaz = false; },
           get idAbierto() { return idAbierto; },
           get props() { return props; },
           get llave() { return llave; },
           get escrituras() { return escrituras; },
           url: urlServicio,
           /* Para poder simular las dos caras de getUrl(): la /dev cuando se
              corre desde el editor y la /exec cuando atiende la web. */
           servidoEn(u) { urlServicio = u; },
           hojaId: hojaId,
           get token() { return props.TOKEN || null; },
           responder: (patron, fn) => rutas.push([patron, fn]),
           enDrive: (carpeta, archivos) => carpetasDrive.set(carpeta, archivos),
           otroLibro,
           sueltoEnDrive: (a) => sueltosDrive.set(a.id, a),
           carpetaNegada: (id) => carpetasNegadas.add(id),
           carpetaDeSoloLectura: (id) => carpetasDeSoloLectura.add(id),
           carpetaDrive: (id) => (carpetasDrive.get(id) || []).filter(x => !x.papelera),
           sinRed() { fetchAllRevienta = true; },
           get peticiones() { return peticionesVistas; },
           filas: n => { const h = hojas.get(n); return h ? h._datos : null; },
           /* LAS PROPIEDADES TAMBIÉN. Se quedaban vivas: una tienda con las
              hojas borradas y las propiedades intactas no es una tienda nueva,
              es una tienda a medio borrar. Eso hacía que un contador —los
              rescates, la marca del stub, la petición de publicar— se arrastrara
              de una batería a la siguiente, y una prueba que depende de la que
              corrió antes falla según el orden, que es el peor rojo que hay. */
           reiniciar() { hojas.clear(); cache = {}; triggers = []; toasts = [];
                         correos = []; cuotaCorreo = 100; ventanas = []; menu = [];
                         Object.keys(props).forEach(k => { delete props[k]; }); } };
}

/* LA TIENDA DE PRUEBA TIENE NOMBRE, Y NO ES EL DEL PRODUCTO.
   Durante mucho tiempo las baterías daban por hecho que la tienda se llamaba
   "Orgánico" —que es UN comercio, el de tomates— y comparaban contra ese
   nombre. Una prueba así solo sabe ver la primera tienda: la segunda falla y
   nadie entiende por qué. Ahora hay un comercio de prueba, distinto a
   propósito de cualquiera real, y las aserciones lo nombran desde aquí.

   Y hace falta además porque la semilla de instalar() ya no trae nada
   utilizable: el nombre viene entre corchetes y el celular vacío, para que una
   tienda sin configurar se vea sin configurar. */
/* UNA TIENDA COMPLETA, no una a medio llenar. Antes tenía ocho claves y con
   eso bastaba porque nadie preguntaba por las demás; desde que existe
   revisarTienda() —«¿está terminada esta tienda?»— una tienda de prueba a
   medias haría que las baterías midieran un caso que no queremos publicar.

   Las claves de pago son inventadas y se ven inventadas a propósito: una llave
   con pinta de real en un archivo de pruebas acaba copiada a algún sitio. */
const COMERCIO = {
  negocio:          'Panadería La Espiga',
  whatsapp:         '573001112233',
  sitio_url:        'https://la-espiga.ejemplo.workers.dev/',
  sitio_titulo:     'Panadería La Espiga — pan de masa madre',
  sitio_descripcion:'Pan de masa madre horneado cada mañana. Pide por WhatsApp.',
  portada_titulo:   'Pan que huele a pan.',
  empresa_razon:    'Panadería La Espiga S.A.S.',
  empresa_nit:      '900.000.000-0',
  empresa_correo:   'datos@la-espiga.ejemplo',
  empresa_direccion:'Calle Falsa 123',
  empresa_ciudad:   'Sincelejo, Sucre',
  empresa_tel:      '300 111 2233',
  correo_resumen:   'dueno@la-espiga.ejemplo',
  respaldo_carpeta: 'CARPETA-DE-PRUEBA',
  repositorio:      'ejemplo/la-espiga',
  pago_llave:       'LLAVE-DE-PRUEBA',
  pago_titular:     'Panadería La Espiga S.A.S.',
  pago_entidad:     'Banco de prueba',
  retracto_excepciones: 'Pan del día|Pasteles por encargo'
};

/* Ocho productos y cinco zonas de envío para la tienda de prueba: los usa casi
   toda la batería, así que viven en un solo sitio y con nombres de panadería
   -que es el negocio de COMERCIO- y no de ningún comercio real.

   instalar() deja de fábrica un catálogo mínimo A PROPÓSITO -dos EJEMPLO
   inactivos, ver la historia A-5 en docs/PLAN-MVP.md-: es lo que tiene que
   ver un comercio recién instalado, no lo que necesita una prueba. Las dos
   cosas son distintas y NO cambian juntas; confundirlas ya costó diez
   baterías en rojo una vez. */
const PRODUCTOS = [
  ['pan-masa-madre',  'Pan de masa madre',        'Unidad',     'Panes',   12000, 30,
   'Horneado cada mañana con masa madre de cinco años.',   '', 'Sí', 'Sí'],
  ['croissant',       'Croissant de mantequilla',  'Unidad',     'Panes',    6500, 40,
   'Hojaldre laminado a mano, mantequilla de verdad.',      '', 'No', 'Sí'],
  ['baguette',        'Baguette clásica',          'Unidad',     'Panes',    8000, 25,
   'Corteza crujiente, miga aireada.',                       '', 'No', 'Sí'],
  ['pan-integral',    'Pan integral',              'Unidad',     'Panes',    9000, 18,
   'Con semillas de girasol y linaza.',                      '', 'No', 'Sí'],
  ['torta-chocolate', 'Torta de chocolate',        'Porción',    'Postres',  9500, 15,
   'Con chocolate al 70%.',                                  '', 'Sí', 'Sí'],
  ['galletas-avena',  'Galletas de avena',         'Paquete x6', 'Postres', 11000, 20,
   'Con pasas y canela.',                                    '', 'No', 'Sí'],
  ['cafe-grano',      'Café en grano',             '500 g',      'Bebidas', 28000, 12,
   'Tostión media, origen Huila.',                           '', 'No', 'Sí'],
  ['empanada-pollo',  'Empanada de pollo',         'Unidad',     'Salado',   4500, 50,
   'Horneada, no frita.',                                    '', 'No', 'Sí']
];

const ENVIOS = [
  ['centro',       'Recoger en el local — Centro',    0],
  ['zona-norte',   'Domicilio zona norte',         6000],
  ['zona-sur',     'Domicilio zona sur',           6000],
  ['zona-oriente', 'Domicilio zona oriente',       8000],
  ['nacional',     'Envío nacional (transportadora)', 15000]
];

/* Reemplaza TODO el cuerpo de una hoja (sin el encabezado) por `filas`: lo que
   haya escrito instalar() —o una corrida anterior de esta misma prueba— se
   borra primero, para que el ancho de las filas nuevas no se mezcle con el de
   las viejas. */
function reemplazarFilas(h, filas) {
  const anchas = Math.max.apply(null, filas.map(function (f) { return f.length; }));
  const actuales = h.getLastRow() - 1;   // sin encabezado
  if (actuales > 0) h.getRange(2, 1, actuales, h.getLastColumn()).clearContent();
  h.getRange(2, 1, filas.length, anchas).setValues(filas);
}

/** Una tienda ya configurada, que es contra lo que se prueba casi todo. */
function configurar(g, extra) {
  const valores = Object.assign({}, COMERCIO, extra || {});
  const h = g.hojas.get('Configuración');
  const d = g.filas('Configuración');
  Object.keys(valores).forEach(function (clave) {
    const i = d.findIndex(function (f) { return String(f[0]).trim() === clave; });
    // g.filas() de este emulador SÍ incluye el encabezado (a diferencia de
    // filas() del maestro), así que la fila 1-based es i + 1 y la 0 es el rótulo.
    if (i >= 1) h.getRange(i + 1, 2).setValue(valores[clave]);
  });

  reemplazarFilas(g.hojas.get('Catálogo'), PRODUCTOS);
  reemplazarFilas(g.hojas.get('Envíos'), ENVIOS);

  return g;
}

module.exports = { crear, COMERCIO, configurar, PRODUCTOS, ENVIOS };
