/**
 * TIENDA — hornear publicar/compartir.jpg desde el nombre del comercio
 * ---------------------------------------------------------------------------
 * La imagen que enseña WhatsApp, Facebook y quien sea cuando alguien comparte
 * el enlace de la tienda. generarConfiguracion() en maestro.gs apunta el
 * og:image SIEMPRE a /compartir.jpg (una ruta fija, igual para cualquier
 * tienda), así que sin este paso cada tienda nueva compartiría la imagen del
 * comercio de la línea anterior — justo lo que esta historia existe para
 * dejar de hacer (docs/PLAN-MVP.md, historia A-3).
 *
 *   node montar/preparar-compartir.mjs
 *   node montar/preparar-compartir.mjs --revisar   (no escribe; falla si hay diferencia)
 *
 * Arma un SVG de 1200×630 con el nombre del comercio y su color principal, y
 * lo convierte a JPEG con sharp — la misma librería que ya usa
 * montar/traer-fotos.mjs, así que montar/preparar-compartir.mjs no añade una
 * dependencia nueva al montaje.
 *
 * TODO O NADA, a su manera: si el color de la hoja no es un color válido, se
 * usa el gris de la plantilla en vez de fallar — una imagen de compartir sin
 * el color exacto sigue sirviendo; una tienda que no publica porque una celda
 * de color vino mal escrita, no.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { laTienda, alMaestro } from './tienda.mjs';

const PUBLICAR = 'publicar/compartir.jpg';
const revisar = process.argv.includes('--revisar');

export const ESCRIBE = [PUBLICAR];

const GRIS = '#6E6E6E';
const ANCHO = 1200;
const ALTO = 630;

function escaparXml(t) {
  return String(t).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]);
}

/* Un nombre de comercio no tiene tamaño fijo: "Pan" y "Distribuidora de
   Insumos Agropecuarios del Oriente" tienen que caber los dos. Esto no corre
   en un navegador, así que no hay manera de MEDIR el texto de verdad: se
   reparte en dos líneas por la palabra más cercana a la mitad, y se encoge la
   letra según cuánto texto haya. No es tipografía perfecta — es que ningún
   nombre real quede cortado ni salga del lienzo. */
export function partirEnLineas(nombre) {
  const t = String(nombre || 'Tu tienda').trim() || 'Tu tienda';
  if (t.length <= 18 || !/\s/.test(t)) return [t];

  const palabras = t.split(/\s+/);
  let mejorCorte = 0, distancia = Infinity, acumulado = 0;
  for (let i = 0; i < palabras.length - 1; i++) {
    acumulado += palabras[i].length + 1;
    const d = Math.abs(acumulado - t.length / 2);
    if (d < distancia) { distancia = d; mejorCorte = i + 1; }
  }
  return [palabras.slice(0, mejorCorte).join(' '), palabras.slice(mejorCorte).join(' ')];
}

function tamanoDeLetra(lineas) {
  const masLarga = Math.max(...lineas.map(l => l.length));
  if (masLarga > 22) return 52;
  if (masLarga > 14) return 66;
  return 84;
}

/* Arma el SVG entero en memoria — lo que se convierte a JPEG después es esto,
   nunca un archivo previo: no hay "compartir.jpg de la corrida anterior" que
   parchear. */
export function svg(negocio, colorPrincipal) {
  const color = /^#[0-9A-Fa-f]{6}$/.test(String(colorPrincipal || '')) ? colorPrincipal : GRIS;
  const lineas = partirEnLineas(negocio).map(escaparXml);
  const tamano = tamanoDeLetra(lineas);
  const alturaLinea = tamano * 1.15;
  const yInicial = ALTO / 2 - ((lineas.length - 1) * alturaLinea) / 2 + tamano * 0.32;
  const tspans = lineas.map((l, i) =>
    `<tspan x="90" y="${(yInicial + i * alturaLinea).toFixed(1)}">${l}</tspan>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
  <rect width="${ANCHO}" height="${ALTO}" fill="${color}"/>
  <circle cx="${ANCHO - 120}" cy="${ALTO - 70}" r="260" fill="#ffffff" opacity="0.08"/>
  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="700" fill="#ffffff" opacity="0.85">Tienda en línea</text>
  <text font-family="Arial, Helvetica, sans-serif" font-size="${tamano}"
        font-weight="800" fill="#ffffff">${tspans}</text>
  <text x="90" y="${ALTO - 70}" font-family="Arial, Helvetica, sans-serif" font-size="30"
        font-weight="600" fill="#ffffff" opacity="0.85">Pide por WhatsApp.</text>
</svg>`;
}

async function main() {
  const tienda = await laTienda();
  const datos = await alMaestro(tienda, 'bloques');
  if (!datos.valores || !datos.valores.NEGOCIO) {
    throw new Error('El maestro no me dio el nombre del comercio: sin eso no ' +
                     'puedo armar ' + PUBLICAR + '.');
  }

  let sharp;
  try { ({ default: sharp } = await import('sharp')); }
  catch {
    console.error('Falta sharp. Instálalo en esta carpeta:\n\n    npm i sharp\n');
    process.exit(1);
  }

  const marcado = svg(datos.valores.NEGOCIO, datos.colores && datos.colores.principal);
  const jpg = await sharp(Buffer.from(marcado)).jpeg({ quality: 88 }).toBuffer();

  let actual = null;
  try { actual = await readFile(PUBLICAR); } catch { /* no existe: se crea */ }

  if (actual && Buffer.compare(actual, jpg) === 0) {
    console.log(PUBLICAR + ' ya está al día. Nada que hacer.');
    return;
  }

  if (revisar) {
    console.error('\n' + PUBLICAR + ' NO está al día con la hoja.\n');
    console.error('Corre  npm run compartir  y vuelve a subir.\n');
    process.exit(1);
  }

  await writeFile(PUBLICAR, jpg);
  console.log((actual === null ? PUBLICAR + ' creado' : PUBLICAR + ' actualizado') +
              '  (' + datos.valores.NEGOCIO + ')');
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch(e => { console.error('\n' + e.message + '\n'); process.exit(1); });
}
