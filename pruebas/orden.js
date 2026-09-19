/* C-4 — el orden del catálogo.
 * ---------------------------------------------------------------------------
 * Son DOS decisiones, no una, y casi todo lo que hay aquí existe para que no se
 * vuelvan a confundir:
 *
 *   EL COMERCIO decide en qué orden ENTRA el comprador (`orden_catalogo`, en la
 *   hoja). De fábrica, «Destacados primero», que es lo que la tienda ya hacía.
 *
 *   EL COMPRADOR decide cómo quiere VERLO mientras mira. Y cuando lo pide, la
 *   lista es ese orden y nada más: EL DESTACADO DEJA DE FLOTAR. Un «precio: de
 *   menor a mayor» que igual empieza por el producto de $28.000 porque alguien
 *   lo marcó destacado es un control que miente, y el comprador no tiene cómo
 *   saberlo: cree que ese es el más barato. Esa es la aserción central de esta
 *   batería, y es la que se rompía sola al implementarlo «respetando» el
 *   destacado.
 *
 *   node pruebas/orden.js
 */
const { chromium } = require('playwright');
const U = 'http://localhost:' + (process.env.PUERTO || 8099);
const { catalogoListo, pintado, hasta } = require('./esperar.js');

const T = []; const ok = (n,c,d) => T.push((c?'  OK  ':' FALLA')+' | '+n+(d?'  -> '+d:''));

const celda = (hoja, f, c, v) =>
  fetch(U + '/__celda?hoja=' + encodeURIComponent(hoja) + '&f=' + f + '&c=' + c +
        '&v=' + encodeURIComponent(v)).then(r => r.json());

/* La fila de una clave de Configuración, preguntándosela a la hoja. Escribir el
   número aquí sería la segunda copia de un dato que se mueve cada vez que se
   agrega una clave al final. */
async function filaDeClave(clave) {
  const h = await (await fetch(U + '/__hojas')).json();
  return h['Configuración'].findIndex(f => String(f[0]) === clave) + 1;
}
const ponerOrden = async v => celda('Configuración', await filaDeClave('orden_catalogo'), 2, v);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:390,height:844} });
  const errs = [], avisosConsola = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'warning') avisosConsola.push(m.text()); });

  /* Los ids en pantalla, en el orden en que están pintados. Se leen del enlace
     de la ficha y no de los nombres: es el dato que identifica al producto. */
  const enPantalla = () => p.evaluate(() =>
    Array.from(document.querySelectorAll('#rejilla .tarjeta .tarjeta-img'))
         .map(b => (b.getAttribute('onclick').match(/'([^']+)'/) || [])[1]));
  const opciones = () => p.evaluate(() =>
    Array.from(document.querySelectorAll('#orden option')).map(o => o.value + '=' + o.textContent));
  const elegirOrden = async id => { await p.selectOption('#orden', id); await pintado(p); };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. De fábrica: lo que la tienda ya hacía
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await p.goto(U); await catalogoListo(p);

  ok('DE FÁBRICA, los destacados primero — la tienda de antes de C-4',
     (await enPantalla()).slice(0, 2).join(',') === 'pan-masa-madre,torta-chocolate',
     (await enPantalla()).slice(0, 3).join(', '));
  ok('  ...y detrás, el orden de la hoja sin tocar',
     (await enPantalla()).slice(2).join(',') ===
     'croissant,baguette,pan-integral,galletas-avena,cafe-grano,empanada-pollo',
     (await enPantalla()).slice(2).join(', '));

  ok('EL SELECTOR ofrece «Recomendado» y los tres del comprador',
     (await opciones()).length === 4 &&
     (await opciones())[0] === 'destacados=Recomendado',
     (await opciones()).join(' | '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Lo que pide el comprador se cumple LITERALMENTE
  // ═══════════════════════════════════════════════════════════════════════════
  await elegirOrden('precio-asc');
  const barato = await enPantalla();
  ok('POR PRECIO, DE MENOR A MAYOR: el primero es el más barato de verdad',
     barato[0] === 'empanada-pollo' && barato[barato.length - 1] === 'cafe-grano',
     barato.join(', '));
  ok('  ...Y EL DESTACADO DEJA DE FLOTAR — si no, el control miente',
     barato.indexOf('pan-masa-madre') > barato.indexOf('croissant'),
     'pan-masa-madre (destacado, $12.000) en la posición ' + barato.indexOf('pan-masa-madre'));

  await elegirOrden('precio-desc');
  ok('POR PRECIO, DE MAYOR A MENOR: el mismo orden al revés',
     (await enPantalla()).join(',') === barato.slice().reverse().join(','),
     (await enPantalla()).slice(0, 3).join(', '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Por nombre, con las reglas del español
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__producto?id=name&nombre=' + encodeURIComponent('Ñame asado') +
              '&categoria=Salado&precio=7000&stock=5');
  await fetch(U + '/__producto?id=zanahoria&nombre=Zanahoria&categoria=Salado&precio=3000&stock=5');
  await p.goto(U); await catalogoListo(p);
  await elegirOrden('nombre');
  const porNombre = await enPantalla();
  /* La Ñ va entre la N y la O, no detrás de la Z. Comparar los caracteres a
     secas —que es lo que hace `a.nombre < b.nombre`— la manda al final, y en un
     catálogo colombiano eso se ve enseguida. */
  ok('POR NOMBRE, la Ñ va entre la N y la O, no detrás de la Z',
     porNombre.indexOf('name') < porNombre.indexOf('zanahoria') &&
     porNombre.indexOf('name') > porNombre.indexOf('galletas-avena'),
     porNombre.join(', '));
  const nombres = await p.evaluate(() =>
    Array.from(document.querySelectorAll('#rejilla .tarjeta h3')).map(h => h.textContent));
  ok('  ...y la lista entera queda alfabética',
     nombres.every((n, i) => i === 0 || nombres[i - 1].localeCompare(n, 'es') <= 0),
     nombres.join(' · '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Dos al mismo precio conservan el orden de la hoja
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await fetch(U + '/__producto?id=igual-a&nombre=Mismo%20precio%20A&precio=5000&stock=5');
  await fetch(U + '/__producto?id=igual-b&nombre=Mismo%20precio%20B&precio=5000&stock=5');
  await p.goto(U); await catalogoListo(p);
  await elegirOrden('precio-asc');
  const empate = await enPantalla();
  /* Un orden inestable es un orden que cambia solo entre dos repintados: el
     comprador vuelve de la ficha y el catálogo se le ha barajado. */
  ok('DOS AL MISMO PRECIO salen en el orden de la hoja, no barajados',
     empate.indexOf('igual-a') < empate.indexOf('igual-b'),
     empate.slice(0, 4).join(', '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Cambiar el orden vuelve a la página 1
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__muchos?n=60');
  await p.goto(U); await catalogoListo(p);
  await p.locator('.paginas .btn').last().click(); await pintado(p);
  ok('Estamos en la página 2', /Página 2/.test(await p.locator('.paginacion .donde').innerText()),
     await p.locator('.paginacion .donde').innerText());
  await elegirOrden('precio-desc');
  ok('CAMBIAR EL ORDEN vuelve a la página 1, como filtrar y buscar',
     /Página 1/.test(await p.locator('.paginacion .donde').innerText()),
     await p.locator('.paginacion .donde').innerText());

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. El orden que eligió el comercio
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await ponerOrden('Precio: de menor a mayor');
  await p.goto(U); await catalogoListo(p);
  ok('EL COMERCIO MANDA EN LA ENTRADA: se entra por el orden que escribió',
     (await enPantalla())[0] === 'empanada-pollo', (await enPantalla()).slice(0, 3).join(', '));
  ok('  ...y el selector NO repite esa opción con otro nombre',
     (await opciones()).length === 3 &&
     (await opciones()).every(o => o.indexOf('Recomendado') === -1) &&
     (await p.locator('#orden').inputValue()) === 'precio-asc',
     (await opciones()).join(' | '));

  await fetch(U + '/__reset');
  await ponerOrden('como en la hoja');
  await p.goto(U); await catalogoListo(p);
  ok('«Como en la hoja» se lee sin distinguir mayúsculas ni tildes',
     (await enPantalla())[0] === 'pan-masa-madre' &&
     (await enPantalla())[1] === 'croissant',
     (await enPantalla()).slice(0, 3).join(', '));
  ok('  ...y ahí el destacado NO va primero, porque no es lo que se pidió',
     (await enPantalla()).indexOf('torta-chocolate') === 4,
     'torta-chocolate en la posición ' + (await enPantalla()).indexOf('torta-chocolate'));

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Un valor que no se entiende NO deja la tienda sin vitrina
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await ponerOrden('del más bonito al más feo');
  await p.goto(U); await catalogoListo(p);
  ok('UN ORDEN QUE NO EXISTE cae al de fábrica: el catálogo falla ABIERTO',
     (await enPantalla()).length === 8 && (await enPantalla())[0] === 'pan-masa-madre',
     (await enPantalla()).slice(0, 3).join(', '));
  ok('  ...y la consola dice qué se escribió Y CUÁLES SON los valores buenos',
     avisosConsola.some(t => /orden/.test(t) && /bonito/.test(t) &&
                             /Precio: de menor a mayor/.test(t)),
     (avisosConsola.filter(t => /orden/.test(t))[0] || '(ninguno)').slice(0, 140));

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Lo que eligió el comprador no se lo pisa la hoja
  // ═══════════════════════════════════════════════════════════════════════════
  await fetch(U + '/__reset');
  await p.goto(U); await catalogoListo(p);
  await elegirOrden('precio-asc');
  await p.evaluate(() => pedirleElCatalogoAlMaestro());
  await hasta(p, () => catalogoResuelto === true);
  await pintado(p);
  ok('EL CATÁLOGO QUE VUELVE A LLEGAR no le deshace el orden al comprador',
     (await p.locator('#orden').inputValue()) === 'precio-asc' &&
     (await enPantalla())[0] === 'empanada-pollo',
     (await enPantalla()).slice(0, 2).join(', '));

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. El orden convive con el filtro y con la búsqueda
  // ═══════════════════════════════════════════════════════════════════════════
  await p.locator('#filtros .chip').filter({ hasText:'Panes' }).first().click(); await pintado(p);
  const panes = await enPantalla();
  ok('FILTRAR Y ORDENAR a la vez: solo esa categoría, y en ese orden',
     panes.join(',') === 'croissant,baguette,pan-integral,pan-masa-madre', panes.join(', '));
  /* Sin filtro y buscando. «pan» encuentra los cuatro de la categoría Panes
     —la categoría también se busca— y la emPANada, porque la búsqueda es por
     trozo de texto. Los cinco salen por precio, que es lo que se está mirando. */
  await p.locator('#filtros .chip').first().click(); await pintado(p);
  await p.fill('#buscar', 'pan'); await pintado(p);
  ok('  ...y buscando, igual',
     (await enPantalla()).join(',') ===
     'empanada-pollo,croissant,baguette,pan-integral,pan-masa-madre',
     (await enPantalla()).join(', '));

  ok('Ningún error de JavaScript en toda la corrida', errs.length === 0, errs.join(' | '));

  await b.close();
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
