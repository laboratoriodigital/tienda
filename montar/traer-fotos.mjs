/**
 * ORGÁNICO — traer las fotos del Drive del comercio y dejarlas publicables
 * ---------------------------------------------------------------------------
 * Cierra el único tramo de las tres capas que hasta hoy hacía una persona:
 * copiar de Drive a originales/ y correr la conversión.
 *
 *   node montar/traer-fotos.mjs
 *   node montar/traer-fotos.mjs --revisar    (no escribe; dice si hay novedades)
 *
 * El comercio sube su foto a su carpeta de Drive con el nombre que va en la
 * hoja —chonto-1.jpg— y no hace nada más.
 *
 * QUÉ SE VERSIONA Y POR QUÉ
 * publicar/fotos/origen.json guarda, por cada foto, de qué archivo de Drive
 * salió y de qué fecha. Ese archivo SÍ va al repositorio: es lo que permite
 * saber qué cambió sin tener que bajar todo otra vez, y es lo que hace que
 * esto funcione igual en tu máquina que en un flujo automático, donde
 * originales/ no existe.
 */
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const ORIGINALES = 'originales';
const PUBLICADAS = join('publicar', 'fotos');
const REGISTRO   = join(PUBLICADAS, 'origen.json');
const ANCHOS  = [160, 600, 900];
const CALIDAD = 82;
const revisar = process.argv.includes('--revisar');

/* 'originales/' es cache local de las fotos que trae de Drive (gitignored);
   'publicar/fotos/' es donde deja las versiones convertidas -incluye
   REGISTRO, que vive adentro-. */
export const ESCRIBE = ['originales/', 'publicar/fotos/'];

const kb = n => Math.round(n / 1024) + ' KB';

async function leerRegistro() {
  try { return JSON.parse(await readFile(REGISTRO, 'utf8')); }
  catch { return {}; }
}

/* Qué hay que bajar: lo que no está, y lo que en Drive es más nuevo que la
   última vez que se convirtió. Comparar por fecha y no por tamaño porque el
   comercio puede reemplazar una foto por otra que pese casi igual. */
/* 0.22.5 · Y LO QUE EL REGISTRO DA POR PUBLICADO PERO NO ESTÁ (bitácora 108).
   Hasta la 0.22.4 el respaldo de una foto `.png` salía como `.jpg`: el registro
   la daba por hecha y la tienda pedía un archivo que no existía. Con `existe`,
   la siguiente corrida lo nota sola y la vuelve a bajar; sirve igual para una
   foto que alguien borró a mano del repositorio. */
function novedades(archivos, registro, existe = () => true) {
  const nuevas = archivos.filter(a => {
    const r = registro[a.nombre];
    return !r || r.id !== a.id || r.modificado !== a.modificado || !existe(a.nombre);
  });
  const enDrive = new Set(archivos.map(a => a.nombre));
  const borradas = Object.keys(registro).filter(n => !enDrive.has(n));
  return { nuevas, borradas };
}

/* `destino` existe para que una batería pueda convertir en una carpeta
   temporal y mirar lo que salió. Sin eso habría que reescribir esta función en
   la prueba, y una copia de la conversión es exactamente lo que NO se puede
   tener: la prueba diría que las fotos salen sin EXIF y estaría comprobando su
   propia copia, no la que se publica. */
async function convertir(sharp, ruta, nombre, destino = PUBLICADAS) {
  const raiz = basename(nombre, extname(nombre));
  const meta = await sharp(ruta).rotate().metadata();

  /* B-4 · LOS CUATRO TAMAÑOS, A LA VEZ. Iban uno detrás de otro, y no se
     esperaban por ninguna razón: son cuatro lecturas del MISMO archivo de
     entrada que escriben cuatro archivos distintos. No comparten nada, así que
     no hay orden que respetar.

     Promise.all conserva el orden del arreglo, así que `pesos` sigue saliendo
     en el orden de ANCHOS y el log se lee igual que siempre. */
  const derivadas = ANCHOS.map(ancho => {
    // No agrandamos: una foto de 400 px no mejora estirada a 900.
    const w = Math.min(ancho, meta.width || ancho);
    return sharp(ruta).rotate()
      .resize(w, w, { fit: 'cover', position: 'attention' })
      .webp({ quality: CALIDAD })
      .toFile(join(destino, `${raiz}-${ancho}.webp`))
      .then(info => ({ ancho, size: info.size }));
  });

  /* El respaldo con el nombre lógico, que es el que va en la hoja: EXACTO, con
     su extensión, y en su formato. 0.22.5 · bitácora 108: salía siempre como
     `${raiz}.jpg`, así que `logo.png` se publicaba como `logo.jpg` —sin su
     transparencia— y la tienda, que pide lo que dice la hoja, recibía un 404:
     el producto sin foto, el icono de la pestaña roto. */
  const respaldo = enSuFormato(sharp(ruta).rotate()
    .resize(Math.min(900, meta.width || 900), null, { withoutEnlargement: true }), nombre)
    .toFile(join(destino, basename(nombre)));

  const hechas = await Promise.all([...derivadas, respaldo]);
  const pesos = hechas.slice(0, ANCHOS.length).map(d => `${d.ancho}:${kb(d.size)}`);
  const salida = hechas.reduce((s, d) => s + d.size, 0);

  return { pesos, salida };
}

/* El formato del respaldo sale de la extensión del nombre lógico. PNG conserva
   la transparencia, que en un logo es casi siempre lo que hay alrededor. */
export function enSuFormato(img, nombre) {
  const ext = extname(nombre).toLowerCase();
  if (ext === '.png')  return img.png({ compressionLevel: 9, adaptiveFiltering: true });
  if (ext === '.webp') return img.webp({ quality: CALIDAD });
  if (ext === '.avif') return img.avif({ quality: CALIDAD });
  return img.jpeg({ quality: CALIDAD, mozjpeg: true });
}

/* B-4 · LA REGLA DE LAS TANDAS, EN UN SOLO SITIO Y COMPROBABLE.
   ----------------------------------------------------------------------------
   Corre `hacer` sobre `items` en tandas de `tanda`, y devuelve los que fallaron
   en vez de relanzar el primero.

   Las dos promesas que hace son las dos que importan y las dos se pueden
   comprobar sin red ni Drive, que es por lo que esto es una función exportada y
   no cuatro líneas dentro de main(): **nunca corren más de `tanda` a la vez**, y
   **uno que falla no impide los demás**.

   Lo segundo no es un detalle. Antes, una foto corrupta en el Drive reventaba la
   corrida entera: el comerciante subía doce, una venía mal, y no se publicaba
   NINGUNA. El daño no era la foto rota — era que las once buenas se quedaban
   fuera de la tienda, y sin abrir el log no había forma de saber por qué. */
export async function enTandas(items, tanda, hacer) {
  const fallos = [];
  for (let i = 0; i < items.length; i += tanda) {
    const lote = items.slice(i, i + tanda);
    const r = await Promise.allSettled(lote.map(hacer));
    r.forEach((x, j) => {
      if (x.status === 'rejected') fallos.push({ item: lote[j], error: x.reason });
    });
  }
  return fallos;
}

async function borrarGeneradas(nombre) {
  const raiz = basename(nombre, extname(nombre));
  const todos = await readdir(PUBLICADAS).catch(() => []);
  for (const f of todos) {
    if (f === basename(REGISTRO)) continue;
    if (basename(f, extname(f)).replace(/-\d+$/, '') === raiz) {
      await unlink(join(PUBLICADAS, f)).catch(() => {});
    }
  }
}

/* Los dos errores que comete siempre el comercio, y que fallan en silencio:
   subir una foto que ningún producto nombra, y nombrar en la hoja una que
   nunca subió. La tienda no se rompe en ninguno de los dos casos —la foto
   simplemente no aparece—, y por eso nadie se entera hasta que un cliente
   pregunta. Se avisa aquí, que es donde se puede hacer algo. */
export function desajustes(archivos, usadas) {
  const enDrive = new Set(archivos.map(a => a.nombre));
  return {
    huerfanas: archivos.map(a => a.nombre).filter(n => !usadas.includes(n)),
    nombradas: usadas.filter(n => !enDrive.has(n))
  };
}

async function main() {
  const tienda = await laTienda();
  const { archivos, usadas = [] } = await alMaestro(tienda, 'fotos');
  const registro = await leerRegistro();
  const { nuevas, borradas } = novedades(archivos, registro,
                                        n => existsSync(join(PUBLICADAS, basename(n))));

  console.log(`${archivos.length} foto(s) en el Drive del comercio.`);

  const { huerfanas, nombradas } = desajustes(archivos, usadas);
  if (nombradas.length) {
    console.log('\n  ⚠ La hoja nombra fotos que NO están en el Drive.');
    console.log('    Esos productos van a salir con su dibujo en vez de su foto:');
    nombradas.forEach(n => console.log('      · ' + n));
  }
  if (huerfanas.length) {
    console.log('\n  ⚠ En el Drive hay fotos que ningún producto nombra.');
    console.log('    Se publican igual, pero no las va a ver nadie. Revisa que el');
    console.log('    nombre coincida con la columna Imágenes:');
    huerfanas.forEach(n => console.log('      · ' + n));
  }
  if (nombradas.length || huerfanas.length) console.log('');

  if (!nuevas.length && !borradas.length) {
    /* «Todo al día» y «no encontré tu carpeta» se veían IGUAL, y son cosas
       distintas: la primera es que no hay nada que hacer y la segunda es que
       el comercio subió dos fotos y no llegaron. Ahora la respuesta trae
       consigo lo que miró. */
    console.log('Todo al día. Nada que bajar.');
    console.log('  · ' + archivos.length + ' foto(s) en la carpeta de Drive del comercio');
    console.log('  · ' + Object.keys(registro).length + ' ya publicadas y sin cambios');
    if (!archivos.length) {
      console.log('');
      console.log('  ⚠ LA CARPETA DE DRIVE ESTÁ VACÍA para el maestro.');
      console.log('    Si acabas de subir fotos ahí, revisa que sea la carpeta que');
      console.log('    dice Configuración > fotos_drive, y que estén compartidas con');
      console.log('    la cuenta de la tienda. Formatos que se aceptan: JPG, PNG y WebP.');
    }
    return;
  }

  if (revisar) {
    console.error('\nHay fotos sin publicar.\n');
    nuevas.forEach(a => console.error('  + ' + a.nombre));
    borradas.forEach(n => console.error('  - ' + n + ' (ya no está en Drive)'));
    console.error('\nCorre  npm run fotos:drive  y vuelve a subir.\n');
    process.exit(1);
  }

  let sharp;
  try { ({ default: sharp } = await import('sharp')); }
  catch {
    console.error('Falta sharp. Instálalo en esta carpeta:\n\n    npm i sharp\n');
    process.exit(1);
  }

  await mkdir(ORIGINALES, { recursive: true });
  await mkdir(PUBLICADAS, { recursive: true });

  for (const nombre of borradas) {
    await borrarGeneradas(nombre);
    delete registro[nombre];
    console.log(`  - ${nombre}  (borrada de Drive, se quita del sitio)`);
  }

  /* UNA FOTO DEMASIADO GRANDE SE RECHAZA ANTES DE PEDIRLA, y por su nombre.
     El maestro la entrega en base64 dentro de un JSON, que la infla un tercio,
     y Apps Script tiene su propio techo. Pedirla igual gasta minutos para
     terminar en un plantón que no dice cuál era. Diez megas es de sobra para
     una foto de producto: las que se publican acaban pesando kilobytes. */
  const TOPE_FOTO = 10 * 1024 * 1024;
  const pesadas = nuevas.filter(a => a.bytes > TOPE_FOTO);
  if (pesadas.length) {
    console.error('\nEstas fotos pesan demasiado para bajarlas por el maestro:');
    pesadas.forEach(a => console.error(`  · ${a.nombre}  ${kb(a.bytes)}`));
    console.error('\nEn el Drive, vuelve a exportarlas por debajo de 10 MB. Una foto ' +
                  'de producto\nno necesita más: las que se publican acaban pesando ' +
                  'kilobytes.\n');
    process.exit(1);
  }

  /* SE ANUNCIA ANTES, NO SOLO DESPUÉS. Mientras la línea se escribía al
     terminar, un fallo a mitad dejaba un log que acababa en la foto ANTERIOR:
     la que reventó no aparecía por ninguna parte. Ahora la última línea del
     log es siempre la que se estaba bajando. */
  /* B-4 · EN TANDAS DE CUATRO. Iban de una en una, y cada una es sobre todo
     ESPERA: la petición al maestro por el contenido en base64 domina el reloj y
     no gasta nada mientras viaja. Cuatro a la vez es donde está la rodilla —más
     es pedirle a Apps Script cuatro ejecuciones simultáneas más por nada, y
     sharp empieza a competir consigo mismo por los núcleos del runner.

     No es un `Promise.all` sobre las veinte: una tanda entera termina antes de
     empezar la siguiente, así que nunca hay más de cuatro descargas vivas ni
     más de cuatro originales a medio escribir. */
  const TANDA = 4;
  const fallidas = [];
  let van = 0;

  async function unaFoto(a) {
    const mia = ++van;
    console.log(`  · [${mia}/${nuevas.length}] bajando ${a.nombre}  (${kb(a.bytes)})`);
    try {
      const foto = await alMaestro(tienda, 'foto', { id: a.id });
      const ruta = join(ORIGINALES, a.nombre);
      await writeFile(ruta, Buffer.from(foto.contenido, 'base64'));

      const { pesos, salida } = await convertir(sharp, ruta, a.nombre);
      /* El `.jpg` que dejaban las versiones anteriores para una foto que no lo
         es: se quita, salvo que otra foto de la hoja se llame justo así. */
      const viejo = basename(a.nombre, extname(a.nombre)) + '.jpg';
      if (viejo !== a.nombre && !registro[viejo] && !archivos.some(x => x.nombre === viejo)) {
        await unlink(join(PUBLICADAS, viejo)).catch(() => {});
      }
      registro[a.nombre] = { id: a.id, modificado: a.modificado, bytes: a.bytes };
      console.log(`  + ${a.nombre.padEnd(26)} ${kb(a.bytes).padStart(8)}  ->  ${pesos.join('  ')}` +
                  `   (${kb(salida)})`);
    } catch (e) {
      console.log(`  ✗ ${a.nombre.padEnd(26)} NO se pudo traer`);
      throw e;                       // lo recoge enTandas, que lleva la cuenta
    }
  }

  /* El orden de las líneas ya no es el orden de las fotos, y por eso el fallo
     no puede depender de «la última línea del log es la que reventó», como
     dependía antes. Cada fallo dice su nombre, y al final se listan todos. */
  const fallos = await enTandas(nuevas, TANDA, unaFoto);
  fallos.forEach(f => fallidas.push({
    nombre: f.item.nombre,
    porque: String((f.error && f.error.message) || f.error).split('\n')[0]
  }));

  // Ordenado por nombre para que el diff del repositorio sea legible y no
  // cambie de orden cada vez que Drive devuelve las cosas en otro orden.
  const ordenado = {};
  Object.keys(registro).sort().forEach(k => { ordenado[k] = registro[k]; });
  await writeFile(REGISTRO, JSON.stringify(ordenado, null, 2) + '\n');

  const buenas = nuevas.length - fallidas.length;
  console.log(`\n${buenas} bajada(s), ${borradas.length} quitada(s).`);

  /* SI FALLAN DOS, SE LISTAN LAS DOS. Un mensaje que dice «hubo un problema con
     las fotos» obliga a leer el log entero para saber cuál; y si el log está
     cortado —que es lo normal en Actions— no se sabe nunca. */
  if (fallidas.length) {
    console.log(`\n${fallidas.length} foto(s) NO se pudieron traer. Las demás sí se publican:`);
    fallidas.forEach(f => console.log(`  ✗ ${f.nombre.padEnd(26)} ${f.porque}`));
    console.log('\nNinguna quedó anotada en el registro, así que la próxima corrida\n' +
                'las vuelve a intentar. Si una insiste, mira que exista en el Drive y\n' +
                'que la cuenta de la tienda pueda leerla.');
    console.log('::warning::' + fallidas.length + ' foto(s) no se pudieron traer: ' +
                fallidas.map(f => f.nombre).join(', '));
  }

  if (buenas) {
    console.log('En la hoja, la columna Imágenes se escribe con el nombre tal cual: ' +
                nuevas[0].nombre);
  }
}

/* pathToFileURL y no una plantilla `file://…`: en Windows argv[1] llega como
   D:\CoWork\… y la comparación NUNCA coincide, así que el script se cargaba,
   no ejecutaba nada y salía con código 0. Un fallo silencioso que parece que
   funcionó. */
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}

export { novedades, convertir, ANCHOS };
