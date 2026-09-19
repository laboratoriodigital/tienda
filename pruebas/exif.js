/* ============================================================================
   LAS FOTOS PUBLICADAS NO PUEDEN LLEVAR DÓNDE SE TOMARON.
   ----------------------------------------------------------------------------
   El comerciante sube al Drive la foto que le sacó con el celular. Esa foto
   trae EXIF, y el EXIF de un celular trae coordenadas GPS: la finca, la casa,
   el taller. Publicarla tal cual es publicar la dirección de alguien que no
   sabe que la está publicando, y nadie se entera nunca — no rompe nada, no da
   error, simplemente está ahí para quien la descargue.

   sharp descarta los metadatos por defecto, así que esto YA funcionaba. Lo que
   faltaba era la prueba: una propiedad de seguridad que depende del valor por
   defecto de una librería es una propiedad prestada. El día que alguien agregue
   un `.withMetadata()` para conservar la orientación —que es una razón
   razonable— se lleva el GPS de paso, y sin esta batería nadie lo vería.

   SE PRUEBA LA CONVERSIÓN DE VERDAD. `convertir()` se importa de
   montar/traer-fotos.mjs; no hay aquí ninguna copia de la tubería. Una prueba
   que reimplementa lo que mide comprueba su propia copia.
   ============================================================================ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { convertir, ANCHOS } = require('../montar/traer-fotos.mjs');

const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

/* Una foto como la que sale de un celular: con marca, modelo, copyright y unas
   coordenadas que apuntan a Rionegro. */
async function fotoConGps() {
  const plana = await sharp({ create: { width: 1400, height: 1000, channels: 3,
                                        background: { r: 200, g: 30, b: 30 } } })
    .jpeg().toBuffer();
  return sharp(plana).withExif({
    IFD0: { Make: 'MarcaDelCelular', Model: 'ModeloSecreto', Copyright: 'Alguien' },
    GPS: { GPSLatitudeRef: 'N', GPSLatitude: '6/1 9/1 0/1',
           GPSLongitudeRef: 'W', GPSLongitude: '75/1 22/1 0/1' }
  }).jpeg().toBuffer();
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fotos-'));
  const entrada = path.join(tmp, 'origen.jpg');
  fs.writeFileSync(entrada, await fotoConGps());

  /* Primero, que la prueba sirva: si la foto de entrada NO trae EXIF, todo lo
     de abajo pasaría sin comprobar nada. Es la lección de las comprobaciones
     que dan lo mismo antes y después. */
  const antes = await sharp(entrada).metadata();
  const crudoAntes = fs.readFileSync(entrada).toString('latin1');
  ok('LA FOTO DE ENTRADA sí trae EXIF, o esta batería no probaría nada',
     !!antes.exif && /ModeloSecreto/.test(crudoAntes),
     antes.exif ? antes.exif.length + ' bytes de EXIF' : 'sin EXIF');

  const salida = path.join(tmp, 'publicadas');
  fs.mkdirSync(salida, { recursive: true });
  await convertir(sharp, entrada, 'origen.jpg', salida);

  const generadas = fs.readdirSync(salida).sort();
  ok('LA CONVERSIÓN saca las tres medidas más el respaldo',
     generadas.length === ANCHOS.length + 1, generadas.join(', '));

  for (const f of generadas) {
    const buf = fs.readFileSync(path.join(salida, f));
    const meta = await sharp(buf).metadata();
    const crudo = buf.toString('latin1');

    ok('`' + f + '` sale SIN EXIF', !meta.exif,
       meta.exif ? meta.exif.length + ' bytes' : '');
    ok('  ...y sin rastro de las coordenadas en los bytes',
       !/GPSLatitude|GPSLongitude/.test(crudo) && !/\x00GPS\x00/.test(crudo));
    ok('  ...ni del modelo del celular', !/ModeloSecreto|MarcaDelCelular/.test(crudo));
    ok('  ...ni perfil de color pegado de más', !meta.icc);
  }

  /* Y el original NO se publica. Vive en originales/, que está en .gitignore
     justamente para esto: es el único archivo que conserva el EXIF. */
  const ignore = fs.readFileSync('../.gitignore', 'utf8');
  ok('EL ORIGINAL no se versiona: es el único que conserva el EXIF',
     /^originales\/$/m.test(ignore), 'originales/ en .gitignore');

  const flujoFotos = fs.readFileSync('../.github/workflows/fotos.yml', 'utf8');
  ok('  ...y el flujo de fotos tampoco lo sube',
     !/add-paths:[\s\S]{0,80}originales/.test(flujoFotos));

  /* ── El manifiesto de medidas ──────────────────────────────────────────
     La página adivinaba qué derivadas existen y se comía un 404 por tarjeta
     cuando no. Ahora el montaje mira la carpeta y lo escribe. Se prueba contra
     las fotos DE VERDAD del repositorio, no contra un directorio inventado:
     un manifiesto que no cuadra con el disco es peor que no tenerlo. */
  const { medidasEnDisco, ANCHOS: ANCHOS_CAT } =
    await import('../montar/catalogo-estatico.mjs');

  const mapa = await medidasEnDisco([
    { id: 'real',    imagenes: ['chonto-1.jpg', 'chonto-2.jpg'] },
    { id: 'ajeno',   imagenes: ['https://res.cloudinary.com/x/foto.jpg'] },
    { id: 'sinfoto', imagenes: ['no-existe.jpg'] }
  ], '../publicar/fotos');

  ok('EL MANIFIESTO lista las medidas que SÍ están en la carpeta',
     JSON.stringify(mapa['chonto-1.jpg']) === JSON.stringify(ANCHOS_CAT),
     JSON.stringify(mapa['chonto-1.jpg']));
  ok('  ...y no promete la que no está', !mapa['no-existe.jpg'],
     'prometer un archivo que no existe es el 404 de siempre, con más pasos');
  ok('  ...ni derivadas de una foto que sirve otro',
     !mapa['https://res.cloudinary.com/x/foto.jpg'],
     'una URL completa en la hoja se sirve tal cual');
  ok('  ...y las medidas del manifiesto son las que se generan',
     JSON.stringify(ANCHOS_CAT) === JSON.stringify(ANCHOS),
     'genera ' + JSON.stringify(ANCHOS) + ' · lista ' + JSON.stringify(ANCHOS_CAT));

  /* ═══ B-4 · LAS FOTOS, EN TANDAS Y SIN QUE UNA SE LLEVE A LAS DEMÁS ═══
     Se prueba `enTandas` directamente, que es donde vive la regla, y no a
     través de main(): probarlo ahí exigiría un maestro falso y un Drive falso,
     y lo que hay que comprobar no tiene nada que ver ni con uno ni con otro. */
  {
    const { enTandas } = await import('../montar/traer-fotos.mjs');

    let vivos = 0, pico = 0;
    const hechos = [];
    const fallos = await enTandas([1, 2, 3, 4, 5, 6, 7], 4, async n => {
      vivos++; pico = Math.max(pico, vivos);
      await new Promise(r => setTimeout(r, 5));
      vivos--;
      if (n === 3 || n === 6) throw new Error('esta foto vino rota (' + n + ')');
      hechos.push(n);
    });

    /* LO QUE MÁS IMPORTA: una foto rota no se lleva por delante a las demás.
       Antes, doce fotos con una corrupta publicaban CERO. */
    ok('B-4 · UNA QUE FALLA no impide las demás',
       hechos.length === 5 && !hechos.includes(3) && !hechos.includes(6),
       'hechas ' + hechos.join(',') + ' de 7');
    /* Y SI FALLAN DOS, SE LISTAN LAS DOS. Un «hubo un problema con las fotos»
       obliga a leer el log entero, y en Actions el log viene cortado. */
    ok('  ...y las que fallan se devuelven TODAS, cada una con lo suyo',
       fallos.length === 2 &&
       fallos.map(f => f.item).join(',') === '3,6' &&
       fallos.every(f => /vino rota/.test(String(f.error.message))),
       fallos.map(f => f.item + ':' + f.error.message).join(' · '));
    ok('  ...sin relanzar la primera, que es lo que tumbaba la corrida entera',
       Array.isArray(fallos), 'enTandas devuelve los fallos, no los lanza');

    ok('B-4 · NUNCA corren más de una tanda a la vez',
       pico === 4, 'pico de ' + pico + ' con tandas de 4');
    ok('  ...y con menos elementos que la tanda, no se inventa concurrencia',
       (await (async () => { let v = 0, p = 0;
          await enTandas([1, 2], 4, async () => { v++; p = Math.max(p, v);
            await new Promise(r => setTimeout(r, 5)); v--; });
          return p; })()) === 2,
       'dos elementos y tanda de cuatro: dos a la vez, no cuatro');

    /* LOS CUATRO TAMAÑOS DE UNA FOTO, A LA VEZ, Y EN ORDEN. Promise.all
       conserva el orden del arreglo: si alguien lo cambiara por un bucle de
       carreras, `pesos` saldría desordenado y el log dejaría de ser comparable
       entre corridas. */
    const fuente = fs.readFileSync(__dirname + '/../montar/traer-fotos.mjs', 'utf8');
    ok('B-4 · LOS CUATRO TAMAÑOS de cada foto se generan a la vez',
       /await Promise\.all\(\[\.\.\.derivadas, respaldo\]\)/.test(fuente) &&
       !/for \(const ancho of ANCHOS\)/.test(fuente),
       'eran cuatro lecturas del mismo archivo que no compartían nada');
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (T.some(x => x.startsWith(' FALLA'))) process.exitCode = 1;
})();
