/* ═══════════════════════════════════════════════════════════════════════════
   ¿CLOUDFLARE DE VERDAD TRANSFORMA LAS FOTOS? (0.16.0 · decisión 22)
   ---------------------------------------------------------------------------
   Con dominio propio, fotos_cdn puede ser «Cloudflare, en tu propio dominio»:
   cada foto se pide como /cdn-cgi/image/…/fotos/<nombre> y Cloudflare entrega
   el tamaño y el formato justos. Pero eso solo funciona si alguien ACTIVÓ las
   transformaciones en la zona (Images › Transformations › Enable). Si no, las
   fotos vuelven al original —la página tiene su respaldo— y nadie se entera
   de que no está pasando lo que se eligió.

   Esto lo pregunta de verdad, con una foto del catálogo recién horneado, y lo
   dice en el resumen del montaje. Nunca tumba la corrida: avisar es un
   servicio. Con la opción de siempre (fotos en tres tamaños), no hace nada.

     node montar/revisar-fotos-cdn.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/* Solo lee: no escribe ningún archivo (A-8). */
export const ESCRIBE = [];

export const DE_CLOUDFLARE = /\/cdn-cgi\/image\//;

/* La misma cuenta que urlFoto() de la página, para la miniatura. */
export function urlDePrueba(config, foto) {
  const cdn = String((config || {}).fotos_cdn || '').trim();
  const origen = String((config || {}).fotos_origen || '').replace(/\/+$/, '');
  return cdn.replace(/\{origen\}/g, origen).replace(/\{ruta\}/g, String(foto).replace(/^\/+/, '')).replace(/\{ancho\}/g, '160');
}

export function unaFoto(catalogo) {
  for (const p of (catalogo && catalogo.productos) || []) {
    const n = ((p && p.imagenes) || []).find(x => x && !/^https?:\/\//i.test(x));
    if (n) return n;
  }
  return '';
}

/* Qué decir. `r` es { status, tipo } de la respuesta, o { error }. */
export function veredicto(config, r) {
  if (!DE_CLOUDFLARE.test(String((config || {}).fotos_cdn || ''))) {
    return { nivel: 'nada', texto: 'Fotos: las sirve tu sitio en tres tamaños ya hechos. Nada que revisar.' };
  }
  if (r && !r.error && r.status === 200 && /^image\//.test(r.tipo || '')) {
    return { nivel: 'bien', texto: 'Fotos: Cloudflare las transforma (tamaño y formato justos para cada pantalla).' };
  }
  return { nivel: 'aviso', texto:
    'Fotos: elegiste Cloudflare, pero la zona no está transformando (' + (r && r.error ? r.error : 'contestó ' + (r && r.status) +
    (r && r.tipo ? ' ' + r.tipo : '')) + '). Las fotos se ven igual —vuelven al original—, pero sin el ahorro. ' +
    'Actívalo en Cloudflare › tu dominio › Images › Transformations › Enable for zone, o vuelve a «Ninguna» en el panel.' };
}

async function principal() {
  let cat = null;
  try { cat = JSON.parse(readFileSync('publicar/catalogo.json', 'utf8')); } catch { }
  const config = (cat && cat.config) || {};
  let r = null;
  if (DE_CLOUDFLARE.test(String(config.fotos_cdn || ''))) {
    const foto = unaFoto(cat);
    if (!foto) r = { error: 'no hay ninguna foto en el catálogo para probar' };
    else {
      const c = new AbortController();
      const reloj = setTimeout(() => c.abort(), 15000);
      try {
        const res = await fetch(urlDePrueba(config, foto), { signal: c.signal, redirect: 'follow' });
        r = { status: res.status, tipo: res.headers.get('content-type') || '' };
      } catch (e) { r = { error: 'no contestó' }; } finally { clearTimeout(reloj); }
    }
  }
  const v = veredicto(config, r);
  console.log((v.nivel === 'aviso' ? '::warning::' : '') + v.texto);
  if (process.env.GITHUB_STEP_SUMMARY && v.nivel !== 'nada') appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Las fotos\n\n' + v.texto + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { console.log('::warning::No se pudo revisar las fotos: ' + e.message); });
}
