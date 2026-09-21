/* A-4 — Los textos legales salen de la hoja.
 * ---------------------------------------------------------------------------
 * "Montar una panadería y comprobar que ningún texto nombra un tomate, una
 * finca ni una ciudad ajena" (docs/PLAN-MVP.md).
 *
 * LEGALES vive en plantilla/index.html como código de navegador —cierres
 * puros sobre NEGOCIO/EMPRESA/EXCEPCIONES_RETRACTO/TARIFAS, sin tocar el
 * DOM salvo por $("#...")— así que no hace falta un navegador para probarlo:
 * se extrae el texto fuente y se evalúa con `new Function`, el mismo truco
 * que ya usan presentacion.js y menu.js para el bloque que hornea el
 * catálogo de respaldo. Nada de esto reemplaza a pruebas/config.js (que sí
 * abre un navegador y comprueba que la caja legal se ve en pantalla); esto
 * prueba el TEXTO, para cualquier combinación de datos, sin pagar el costo
 * de un navegador por cada una.
 *
 * No necesita servidor ni navegador: es una lectura de archivos y una
 * evaluación en memoria.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const { terminos } = JSON.parse(
  fs.readFileSync(path.join(RAIZ, 'terminos-prohibidos.json'), 'utf8'));

const html = fs.readFileSync(path.join(RAIZ, 'plantilla/index.html'), 'utf8');

/* ── Se extraen las piezas puras de plantilla/index.html, en orden ──
   No se copia el archivo entero: entre `escapar` (línea ~1142) y `LEGALES`
   (línea ~2080) hay cientos de líneas de carrito y catálogo que sí tocan el
   DOM, y evaluarlas aquí solo para llegar a lo que hace falta sería frágil
   y lento. Se extrae cada trozo por sus propios anclas de texto. */
function extraer(desde, hastaAntesDe, etiqueta) {
  const i = html.indexOf(desde);
  if (i === -1) throw new Error('No encontré "' + desde + '" (' + etiqueta + ') en plantilla/index.html');
  const j = html.indexOf(hastaAntesDe, i);
  if (j === -1) throw new Error('No encontré el final de ' + etiqueta + ' ("' + hastaAntesDe + '")');
  return html.slice(i, j);
}

const ESCAPAR = extraer('const escapar = ', '\n', 'escapar').trim();
/* Ojo: "const falta = " sale DOS veces en el archivo -la otra es una
   variable local de queFalta(), sin relación con esto-. Se ancla a la firma
   completa de la de arriba, que es la única. */
const FALTA = extraer('const falta = v =>', '\n', 'falta').trim();
const RESPONSABLE_Y_ESCRIBIR = extraer('function responsable(){', 'const LEGALES = {', 'responsable/comoEscribirnos');
const LEGALES_SRC = extraer('const LEGALES = {', '\nfunction abrirLegal', 'LEGALES');

/* Arma los tres textos legales para una configuración dada. `tarifas` imita
   ENVIOS: solo se usa para el aviso de "recoger sin costo" de Términos. */
function armar(negocio, empresa, excepciones, tarifas, enLinea) {
  const cuerpo = [
    /* M3.5: los textos dicen cómo se cierra la venta. */
    'const cobraEnLinea = () => ' + (enLinea ? 'true' : 'false') + ';',
    'let NEGOCIO = ' + JSON.stringify(negocio) + ';',
    'let EMPRESA = ' + JSON.stringify(empresa) + ';',
    'let EXCEPCIONES_RETRACTO = ' + JSON.stringify(excepciones || []) + ';',
    'let TARIFAS = ' + JSON.stringify(tarifas || []) + ';',
    ESCAPAR,
    FALTA,
    RESPONSABLE_Y_ESCRIBIR,
    LEGALES_SRC + ';',
    'return LEGALES;'
  ].join('\n');
  const LEGALES = new Function(cuerpo)();
  return {
    datos: LEGALES.datos.cuerpo(),
    retracto: LEGALES.retracto.cuerpo(),
    terminos: LEGALES.terminos.cuerpo()
  };
}

const EMPRESA_DE_FABRICA = {
  razon: '[RAZÓN SOCIAL]', nit: '[NIT O CÉDULA]', correo: '[CORREO DE CONTACTO]',
  direccion: '[DIRECCIÓN]', ciudad: '[CIUDAD]', tel: '[TELÉFONO]',
  actualizado: '[FECHA DE ACTUALIZACIÓN]'
};

// ═══ 1. Se monta una panadería, con sus propios datos ═══
const PANADERIA = {
  negocio: 'Panadería La Espiga',
  empresa: {
    razon: 'Panadería La Espiga S.A.S.', nit: '900.000.000-0',
    correo: 'datos@la-espiga.ejemplo', direccion: 'Calle Falsa 123',
    ciudad: 'Sincelejo, Sucre', tel: '300 111 2233', actualizado: '18 de septiembre de 2026'
  },
  excepciones: ['Pan del día', 'Pasteles por encargo'],
  tarifas: [
    { id: 'centro', nombre: 'Recoger en el local — Centro', valor: 0 },
    { id: 'zona-norte', nombre: 'Domicilio zona norte', valor: 6000 }
  ]
};

{
  const t = armar(PANADERIA.negocio, PANADERIA.empresa, PANADERIA.excepciones, PANADERIA.tarifas);
  const junto = (t.datos + ' ' + t.retracto + ' ' + t.terminos).toLowerCase();

  const encontrados = terminos.filter(x => junto.includes(x.toLowerCase()));
  ok('LOS TRES TEXTOS LEGALES de una panadería no nombran al comercio anterior',
     encontrados.length === 0, encontrados.join(', '));

  ok('  ...y sí nombran a ESTE comercio: razón social',
     junto.includes('panadería la espiga s.a.s.'));
  ok('  ...el NIT', junto.includes('900.000.000-0'));
  ok('  ...la ciudad', junto.includes('sincelejo, sucre'));
  ok('  ...el correo', junto.includes('datos@la-espiga.ejemplo'));
  ok('  ...y el teléfono', junto.includes('300 111 2233'));

  ok('EL RETRACTO nombra los productos perecederos de ESTA panadería',
     t.retracto.includes('Pan del día') && t.retracto.includes('Pasteles por encargo'),
     'para que el comprador sepa cuáles no admiten cambio de opinión');
  ok('  ...y no una fruta o verdura inventada por la plantilla',
     !/tomate|verdura|hortaliza|fruta/i.test(t.retracto));

  ok('EL ENVÍO SIN COSTO de Términos usa la ciudad de ESTA tienda',
     t.terminos.includes('Recoger en el local — Centro, en Sincelejo, Sucre'),
     (t.terminos.match(/Puedes recoger sin costo[^<]*/) || [''])[0]);

  ok('LAS LEYES CITADAS son las correctas: 1581/2012 en el tratamiento de datos',
     /Ley 1581 de 2012/.test(t.datos));
  ok('  ...Estatuto del Consumidor y el artículo 47 (retracto) en Retracto',
     /Ley 1480 de 2011/.test(t.retracto) && /art[ií]culo 47/.test(t.retracto));
  ok('  ...y el artículo 51 (reversión del pago), también en Retracto',
     /art[ií]culo 51/.test(t.retracto));

  ok('TÉRMINOS no asume una cosecha propia ni ningún otro negocio agrícola',
     !/cosecha|cultivo|siembra/i.test(t.terminos));
}

// ═══ 2. Sin excepciones al retracto, el texto ni las menciona ═══
{
  const t = armar(PANADERIA.negocio, PANADERIA.empresa, [], PANADERIA.tarifas);
  ok('SIN retracto_excepciones, Retracto no inventa qué es perecedero',
     !/Cuándo no aplica/.test(t.retracto) && !/no admite/.test(t.retracto),
     'vacío = ningún producto queda excluido, y el texto no lo menciona');
}

// ═══ 2b. Cobrando en línea, los textos dicen lo que de verdad pasa ═══
{
  const w = armar(PANADERIA.negocio, PANADERIA.empresa, [], PANADERIA.tarifas, false);
  const t = armar(PANADERIA.negocio, PANADERIA.empresa, [], PANADERIA.tarifas, true);
  ok('POR WHATSAPP, Términos sigue diciendo que la página no cobra',
     /no cobra ni procesa pagos/.test(w.terminos) && !/Bold/.test(w.terminos + w.datos));
  ok('COBRANDO EN LÍNEA, ya no dice «no cobra» —sería falso— y nombra a Bold',
     !/no cobra ni procesa pagos/.test(t.terminos) && /pasarela de Bold/.test(t.terminos) &&
     /<strong>Bold<\/strong>/.test(t.datos));
  ok('  ...y el tratamiento de datos cuenta que ahora se guardan (el correo, la hoja de pedidos)',
     /Correo electrónico/.test(t.datos) && /hoja de pedidos/.test(t.datos) &&
     !/no tiene servidor ni base de datos/.test(t.datos));
  ok('  ...y ya no promete que el registro va «sin tu nombre, celular ni dirección»',
     !/sin tu nombre/.test(t.datos) && /sin tu nombre/.test(w.datos));
}

// ═══ 3. Sin datos de empresa (la hoja recién instalada), el texto no inventa ═══
{
  const t = armar('[NOMBRE DEL COMERCIO]', EMPRESA_DE_FABRICA, [], []);
  ok('SIN empresa_razon, «quién responde» cae al nombre del negocio, no a un dato inventado',
     !t.datos.includes('[RAZÓN SOCIAL]') && !t.datos.includes('[NIT O CÉDULA]'),
     'un corchete en la página pública es peor que omitir el dato');
  ok('  ...y sin empresa_correo, se ofrece igual un modo de escribir (WhatsApp)',
     !t.datos.includes('[CORREO DE CONTACTO]'));
  /* Esto es justamente lo que la decisión 09 vuelve imposible de PUBLICAR
     -maestro.gs se niega a escribir el index si estas claves faltan-, pero el
     texto en sí, si alguien lo mira en el editor antes de llenar la hoja,
     tampoco puede mostrar un corchete de otro comercio. */
}

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
