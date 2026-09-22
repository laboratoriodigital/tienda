/* ═══════════════════════════════════════════════════════════════════════════
   LA SEMILLA SOBRE LA TIENDA · la regla, sin red ni git (0.14.0)
   ---------------------------------------------------------------------------
   Decide, archivo por archivo, qué hacer al traer una versión nueva de la
   semilla. La misma regla que usa la flota (repositorio `tiendas`, decisión 19):
   SOBRESCRIBIR lo que es de la semilla, nunca fusionar — pero mirando TRES
   versiones, porque una tienda puede haber arreglado algo por su cuenta:

     · T — el archivo de la tienda, hoy;
     · N — el de la semilla en la versión NUEVA;
     · B — el de la semilla en la versión de la que salió la tienda (BASE).

     T = N            → nada.
     T = B            → la tienda no lo tocó: se sobrescribe con N.
     T ≠ B, N = B     → solo la tienda lo cambió: se respeta.
     T ≠ B, N ≠ B     → los dos: NO SE TOCA, y se dice.
     sin B            → no se toca lo distinto (se puede forzar), y se dice.
     T no existe      → se agrega.
     N no existe      → nada: no se borra.

   La prueban pruebas/actualizar.js y, con la misma tabla, flota/pruebas.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';

/* Lo que escribe: los archivos que semilla.json declara de la semilla (A-8). */
export const ESCRIBE = ['semilla.json › propios'];

export function esPropio(ruta, propios) {
  return (propios || []).some(p => p.endsWith('/') ? ruta.startsWith(p) : ruta === p);
}

export function decidir(T, N, B, conocida) {
  const igual = (a, b) => a !== null && b !== null && Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
  if (N === null) return 'nada';
  if (T === null) return 'agregar';
  if (igual(T, N)) return 'nada';
  if (!conocida) return 'sobrescribir-sin-base';
  if (B !== null && igual(T, B)) return 'sobrescribir';
  if (B !== null && igual(N, B)) return 'conservar-propio';
  return 'desvio';
}

export function version(t) {
  const m = String(t || '').trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
export function comparar(a, b) {
  const x = version(a), y = version(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
export function ultimaEtiqueta(etiquetas) {
  return (etiquetas || []).filter(e => version(e)).sort((a, b) => comparar(b, a))[0] || '';
}

function archivosDe(raiz) {
  const salida = [];
  const andar = (d) => {
    for (const n of readdirSync(d)) {
      if (n === '.git' || n === 'node_modules') continue;
      const r = join(d, n);
      if (statSync(r).isDirectory()) andar(r);
      else salida.push(relative(raiz, r).split(sep).join('/'));
    }
  };
  andar(raiz);
  return salida.sort();
}
const leer = (raiz, ruta) => (raiz && existsSync(join(raiz, ruta))) ? readFileSync(join(raiz, ruta)) : null;

/* Aplica la versión nueva sobre la carpeta de la tienda. `excluir`: rutas que
   no se escriben aunque tocaría (los flujos, cuando no hay permiso para
   empujarlos), y se listan en `pendientes`. */
export function aplicar({ tiendaDir, nuevaDir, baseDir, propios, conserva = [], sinBase = 'dejar', version: v = '', excluir = [] }) {
  const informe = { sobrescritos: [], sinBase: [], sinBaseDejados: [], nuevos: [], propios: [], desvios: [],
                    conservados: [], pendientes: [] };
  const conocida = !!baseDir;
  for (const ruta of archivosDe(nuevaDir)) {
    if (!esPropio(ruta, propios)) continue;
    if (esPropio(ruta, conserva)) { informe.conservados.push(ruta); continue; }
    const T = leer(tiendaDir, ruta), N = leer(nuevaDir, ruta), B = leer(baseDir, ruta);
    let d = decidir(T, N, B, conocida);
    if (d === 'sobrescribir-sin-base' && sinBase !== 'sobrescribir') { informe.sinBaseDejados.push(ruta); continue; }
    if (['agregar', 'sobrescribir', 'sobrescribir-sin-base'].includes(d) && esPropio(ruta, excluir)) {
      informe.pendientes.push(ruta); continue;
    }
    const escribir = () => { mkdirSync(dirname(join(tiendaDir, ruta)), { recursive: true }); writeFileSync(join(tiendaDir, ruta), N); };
    if (d === 'agregar') { escribir(); informe.nuevos.push(ruta); }
    else if (d === 'sobrescribir') { escribir(); informe.sobrescritos.push(ruta); }
    else if (d === 'sobrescribir-sin-base') { escribir(); informe.sinBase.push(ruta); }
    else if (d === 'conservar-propio') informe.propios.push(ruta);
    else if (d === 'desvio') informe.desvios.push(ruta);
  }
  informe.escritos = [...informe.sobrescritos, ...informe.sinBase, ...informe.nuevos];
  informe.cambia = informe.escritos.length > 0;
  /* La versión de la tienda es la de la semilla que lleva, aunque su
     package.json tenga algo propio y no se haya sobrescrito entero. */
  const pj = join(tiendaDir, 'package.json');
  if (informe.cambia && v && existsSync(pj)) {
    const texto = readFileSync(pj, 'utf8');
    const nuevo = texto.replace(/("version"\s*:\s*")[^"]*(")/, '$1' + String(v).replace(/^v/, '') + '$2');
    if (nuevo !== texto) writeFileSync(pj, nuevo);
  }
  return informe;
}

/* Lo que se dice en el resumen de la corrida: primero lo que NO se hizo. */
export function informeEnTexto({ desde, hasta, informe }) {
  const l = xs => xs.map(x => '- `' + x + '`').join('\n');
  const p = [`### La semilla: ${desde || '(versión desconocida)'} → ${hasta}`, ''];
  if (informe.desvios.length) p.push('**⚠ No se tocaron: la tienda y la semilla los cambiaron los dos.** Revísalos a mano:', '', l(informe.desvios), '');
  if (informe.sinBaseDejados.length) p.push(`**⚠ No se tocaron: la semilla no tiene la etiqueta de la versión de la tienda (${desde || '?'})**, así que no se sabe si tenían un cambio propio:`, '', l(informe.sinBaseDejados), '');
  if (informe.pendientes.length) p.push('**⚠ Los flujos no se pudieron traer**: falta el secreto `SEMILLA_TOKEN` (con permiso de *Workflows*). El resto sí:', '', l(informe.pendientes), '');
  p.push(`Sobrescritos: ${informe.sobrescritos.length + informe.sinBase.length} · nuevos: ${informe.nuevos.length} · cambios propios respetados: ${informe.propios.length}`);
  return p.join('\n');
}
