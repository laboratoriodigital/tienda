/* 0.13.0 · 2.5 — ver la tienda antes de publicar.
 * ---------------------------------------------------------------------------
 * Guardar no publica: la tienda sirve un catálogo horneado. Hasta ahora, para
 * ver cómo quedaba un cambio había que publicarlo. La vista previa es la misma
 * tienda con ?vista: lee la hoja en vivo en vez de lo publicado, lo dice arriba,
 * y no deja pedir. Lo que se prueba:
 *
 *   · LO PUBLICADO SIGUE SIENDO LO PUBLICADO sin ?vista.
 *   · CON ?vista SE VE LO GUARDADO: la hoja, no el archivo publicado, que ni se pide.
 *   · SE DICE: el cartel arriba, y el carrito no deja enviar y explica por qué.
 *   · NO TOCA NADA: ni cuenta «avísame», ni reenvía pedidos pendientes, ni se
 *     deja indexar.
 *   · EN EL PANEL, el botón está junto a Publicar.
 *
 *   node pruebas/vistaprevia.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, hasta } = require('./esperar.js');
const T = []; const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const hojas = async () => (await fetch(U + '/__hojas')).json();
const celda = async (hoja, clave, col, v) => {
  const f = ((await hojas())[hoja] || []).findIndex(x => String(x[0]) === clave) + 1;
  if (f < 1) throw new Error('No existe ' + clave);
  await fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + col + '&v=' + encodeURIComponent(v) + (col === 6 ? '&num=1' : ''));
};

(async () => {
  await fetch(U + '/__reset');
  /* «Lo publicado»: el catálogo de hoy con otro título. Se sirve como si fuera
     el catalogo.json horneado del sitio. */
  const vivo = await (await fetch(U + '/exec?a=catalogo')).json();
  const publicado = { esquema: vivo.esquema || 1, version: vivo.version, generado: new Date().toISOString(),
                      productos: vivo.productos, envios: vivo.envios,
                      config: Object.assign({}, vivo.config, { portada_titulo: 'Lo que está publicado' }) };
  await celda('Configuración', 'portada_titulo', 2, 'Lo que guardé y no he publicado');
  await celda('Catálogo', 'galletas-avena', 6, '0');

  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const pedidosArchivo = [];
  await ctx.route('**/catalogo.json', r => { pedidosArchivo.push(r.request().url()); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publicado) }); });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.open = () => null; });

  await p.goto(U);
  await catalogoListo(p);
  ok('SIN ?vista, la tienda muestra lo publicado', /Lo que está publicado/.test(await p.locator('#portadaTitulo').innerText()) &&
     pedidosArchivo.length === 1);
  ok('  ...y no hay cartel de vista previa', await p.locator('#avisoVista').isHidden());

  pedidosArchivo.length = 0;
  const antes = ((await (await fetch(U + '/__peticiones')).json()) || []).length;
  await p.goto(U + '/?vista=1');
  await catalogoListo(p);
  await hasta(p, () => /guardé/.test(document.querySelector('#portadaTitulo').textContent)).catch(() => {});
  ok('CON ?vista, SE VE LO GUARDADO en la hoja', /Lo que guardé y no he publicado/.test(await p.locator('#portadaTitulo').innerText()),
     await p.locator('#portadaTitulo').innerText());
  ok('  ...sin pedir siquiera el archivo publicado', pedidosArchivo.length === 0);
  ok('  ...y lo dice arriba, a la vista', await p.locator('#avisoVista').isVisible() && /Vista previa/.test(await p.locator('#avisoVista').innerText()));
  ok('  ...y no se deja indexar', await p.evaluate(() => [...document.querySelectorAll('meta[name=robots]')].some(m => /noindex/.test(m.content))));

  await p.evaluate(() => { agregar('croissant', 2); abrirPanel(); });
  await p.fill('#fNombre', 'María Rodríguez'); await p.fill('#fTel', '3115558899');
  await p.fill('#fCiudad', 'Bogotá'); await p.fill('#fDir', 'Calle 100 #15-20'); await p.check('#consiento');
  await hasta(p, () => !document.querySelector('#faltan').hidden).catch(() => {});
  ok('NO SE PUEDE PEDIR en la vista previa, y el carrito dice por qué',
     await p.evaluate(() => document.querySelector('#btnFinalizar').getAttribute('aria-disabled') !== 'false') &&
     /vista previa/i.test(await p.locator('#faltanTexto').innerText()), await p.locator('#faltanTexto').innerText());
  ok('  ...pero el aviso de «tienda cerrada» no miente: la tienda está abierta', await p.locator('#avisoCerrada').isHidden());

  await p.evaluate(() => { cerrarTodo(); pedirAviso('galletas-avena'); });
  await new Promise(r => setTimeout(r, 400));
  const pet = (await (await fetch(U + '/__peticiones')).json()).slice(antes);
  ok('NO TOCA LA HOJA: «avísame» no cuenta', !pet.some(q => q.a === 'avisame') && !((await hojas())['Avísame'] || []).some(f => f[0] === 'galletas-avena'));
  ok('  ...ni se reenvían pedidos pendientes', !pet.some(q => q.a === 'registrar'));

  // En el panel
  const { clave } = await (await fetch(U + '/__panel?usuario=dona.rosa')).json();
  const pa = await ctx.newPage();
  await pa.goto(U + '/admin.html');
  await hasta(pa, () => !document.querySelector('#entrar').hidden);
  await pa.fill('#usuario', 'dona.rosa'); await pa.fill('#clave', clave);
  await pa.click('#botonEntrar');
  await hasta(pa, () => !document.querySelector('#panel').hidden);
  const enlace = await pa.evaluate(() => { const a = document.querySelector('#vistaPrevia');
    return { href: a.href, target: a.target, rel: a.rel, junto: a.closest('#barraPublicar') !== null }; });
  ok('EN EL PANEL, «Vista previa» está junto a Publicar y abre la tienda con ?vista en otra pestaña',
     /\/\?vista=1$/.test(enlace.href) && enlace.target === '_blank' && /noopener/.test(enlace.rel) && enlace.junto, JSON.stringify(enlace));
  const [nueva] = await Promise.all([ctx.waitForEvent('page'), pa.click('#vistaPrevia')]);
  await nueva.waitForLoadState();
  await catalogoListo(nueva);
  ok('  ...y lo que abre es la vista previa', await nueva.locator('#avisoVista').isVisible());

  ok('Ningún error de JavaScript', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
