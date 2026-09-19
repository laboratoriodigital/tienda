/* C-1 — variantes: el contrato y el maestro.
 * ---------------------------------------------------------------------------
 * Un labial en tres tonos sin crear tres productos. Lo que se prueba aquí es la
 * mitad que vive en la hoja y en el maestro; la página —que obliga a elegir
 * antes de agregar— es la otra mitad y tiene su propia batería.
 *
 * LAS DOS DIRECCIONES DEL FALLO, QUE NO SON LA MISMA.
 * El catálogo falla ABIERTO y el pedido falla CERRADO, y esta batería existe
 * sobre todo para fijar esa diferencia: una celda de variantes que no se
 * entiende deja el producto a la venta sin variantes (perder la venta sería
 * peor), pero una elección que el comercio no ofrece TUMBA LA LÍNEA (guardarla
 * sería dejar un pedido que nadie puede despachar).
 *
 *   node pruebas/variantes.js
 */
const { crear, configurar } = require('./gas.js');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

const nuevo = () => { const g = crear('./as.js'); g.api.instalar(); configurar(g); return g; };
const j = r => JSON.parse(r._texto);

/* Escribe la celda Variantes (columna N) del producto que ocupa la fila `fila`. */
const ponerVariantes = (g, fila, texto) =>
  g.hojas.get('Catálogo').getRange(fila, 14).setValue(texto);

const puerta = (g, o) => j(g.api.doGet({ parameter: Object.assign({ t: g.token }, o) }));

(() => {
  // ═══ 1. La lectura de la celda ═══
  const g0 = nuevo();
  const V = (texto) => g0.api.variantesDeCelda(texto, 'Catálogo N2');

  ok('LA SINTAXIS CORTA se lee: grupos con ; y opciones con |',
     JSON.stringify(V('Talla: S|M|L ; Color: Rosa|Nude')) ===
     JSON.stringify([{ nombre: 'Talla', opciones: ['S', 'M', 'L'] },
                     { nombre: 'Color', opciones: ['Rosa', 'Nude'] }]),
     JSON.stringify(V('Talla: S|M|L ; Color: Rosa|Nude')));
  ok('  ...con los espacios de más, que es como escribe la gente',
     JSON.stringify(V('  Talla :  S | M  ;  ')) ===
     JSON.stringify([{ nombre: 'Talla', opciones: ['S', 'M'] }]),
     JSON.stringify(V('  Talla :  S | M  ;  ')));
  ok('UNA CELDA VACÍA no son variantes, y no es un error',
     V('').length === 0 && V('   ').length === 0);

  /* NO SE ADIVINA. Partir `S M L` por espacios, o tratar el ; como |, es
     ofrecerle al comprador algo que el comerciante no quiso ofrecer. */
  ok('LO QUE NO SE ENTIENDE no se adivina: se queda sin variantes',
     V('sin dos puntos').length === 0 && V('Talla:').length === 0,
     'ni se parte por espacios ni se inventa un grupo');

  // ═══ 2. El catálogo falla ABIERTO ═══
  {
    const g = nuevo();
    ponerVariantes(g, 2, 'esto no es una sintaxis');
    const c = puerta(g, { a: 'catalogo' });
    const p = c.productos.find(x => x.id === 'pan-masa-madre');
    /* `catalogo` devuelve CUÁNTAS celdas ilegibles hay; el detalle con su celda
       viene por `validar`, que es donde el comerciante lo necesita. */
    const detalle = puerta(g, { a: 'validar', items: 'pan-masa-madre:1',
                                envio: 'centro', sub: '1' }).ilegibles || [];

    ok('UNA CELDA ILEGIBLE deja el producto A LA VENTA, sin variantes',
       !!p && p.variantes.length === 0,
       p ? 'sigue en el catálogo con ' + p.variantes.length + ' variantes'
         : 'DESAPARECIÓ del catálogo');
    ok('  ...y el catálogo cuenta la celda ilegible, en vez de callarla',
       Number(c.ilegibles) > 0, 'ilegibles=' + c.ilegibles);
    ok('  ...y el detalle nombra la celda exacta, con su columna y su fila',
       detalle.some(x => /Catálogo N2/.test(x)), JSON.stringify(detalle));
    /* Y ENSEÑA LA SINTAXIS EN EL AVISO: el comerciante que la escribió mal
       necesita saber cómo se escribe bien, no solo que está mal. */
    ok('  ...y el aviso enseña cómo se escribe',
       detalle.some(x => /Talla: S\|M\|L/.test(x)), detalle[0] || '(sin avisos)');
  }

  /* EL PRECIO ES LO CONTRARIO, y esta aserción existe para que la diferencia
     esté fijada: un precio ilegible SÍ tumba el producto, porque ahí el error
     se paga en plata. */
  {
    const g = nuevo();
    g.hojas.get('Catálogo').getRange(2, 5).setValue('$12.000');   // precio como texto
    const c = puerta(g, { a: 'catalogo' });
    ok('UN PRECIO ILEGIBLE sí tumba el producto: las dos reglas son distintas',
       !c.productos.some(x => x.id === 'pan-masa-madre'),
       'el catálogo falla abierto en las variantes y cerrado en el precio');
  }

  // ═══ 3. El maestro las devuelve estructuradas ═══
  {
    const g = nuevo();
    ponerVariantes(g, 2, 'Talla: S|M|L ; Color: Rosa|Nude');
    const p = puerta(g, { a: 'catalogo' }).productos.find(x => x.id === 'pan-masa-madre');
    ok('EL MAESTRO devuelve las variantes ESTRUCTURADAS, no el texto crudo',
       Array.isArray(p.variantes) && p.variantes[0].nombre === 'Talla' &&
       Array.isArray(p.variantes[0].opciones),
       JSON.stringify(p.variantes));
  }

  // ═══ 4. El pedido falla CERRADO ═══
  {
    const g = nuevo();
    ponerVariantes(g, 2, 'Talla: S|M|L');
    const reg = (items) => puerta(g, { a: 'registrar', pedido: 'V' + Math.random().toString(36).slice(2, 7).toUpperCase(),
                                       ciudad: 'Cali', cupon: '', envio: 'centro', items });
    const lineas = () => g.filas('Pedidos').slice(1);

    reg('pan-masa-madre:1:Talla=M');
    const conVariante = lineas().slice(-1)[0];
    ok('LA ELECCIÓN SE GUARDA en la columna Variante, al final',
       String(conVariante[16]) === 'Talla: M', String(conVariante[16]));
    /* SE GUARDA LA DE LA HOJA, no la que mandó la página: así la columna dice
       siempre lo mismo que el catálogo, escriba como escriba el navegador. */
    const antes = lineas().length;
    reg('pan-masa-madre:1:Talla=m');
    ok('  ...con el texto del CATÁLOGO, no con el que mandó la página',
       String(lineas().slice(-1)[0][16]) === 'Talla: M',
       String(lineas().slice(-1)[0][16]) + ' (se pidió "m" en minúscula)');
    ok('  ...y las demás columnas no se corrieron',
       String(conVariante[7]) === 'pan-masa-madre' && Number(conVariante[8]) === 1,
       'ID en su sitio y cantidad en el suyo');

    const hubo = lineas().length;
    const r = reg('pan-masa-madre:1:Talla=XXL');
    ok('UNA OPCIÓN QUE EL COMERCIO NO OFRECE tumba la línea',
       lineas().length === hubo && r.ok === false,
       'guardarla sería un pedido que nadie puede despachar');

    /* LA ELECCIÓN QUE FALTA, en cambio, falla abierto: viene de una página
       vieja en caché, y rechazar la venta callando es peor que aceptarla con
       un aviso que el comerciante resuelve por WhatsApp. */
    const v = puerta(g, { a: 'validar', items: 'pan-masa-madre:1', envio: 'centro', sub: '1' });
    ok('UNA ELECCIÓN QUE FALTA no pierde la venta: avisa',
       v.items.length === 1 && (v.avisos || []).some(a => /Falta elegir/.test(a)),
       (v.avisos || []).join(' | ') || '(sin avisos)');
  }

  // ═══ 5. Dos tonos del mismo producto son DOS líneas ═══
  {
    const g = nuevo();
    ponerVariantes(g, 2, 'Color: Rosa|Nude');
    const v = puerta(g, { a: 'validar', envio: 'centro', sub: '1',
                          items: 'pan-masa-madre:2:Color=Rosa,pan-masa-madre:3:Color=Nude' });
    ok('DOS VARIANTES del mismo producto son DOS líneas, no una',
       v.items.length === 2,
       v.items.map(i => i.id + ' ' + i.variante + ' x' + i.cantidad).join(' · '));
    ok('  ...y la misma variante dos veces sigue siendo una sola',
       puerta(g, { a: 'validar', envio: 'centro', sub: '1',
                   items: 'pan-masa-madre:2:Color=Rosa,pan-masa-madre:3:Color=Rosa' }).items.length === 1);

    /* EL STOCK ES DEL PRODUCTO, NO DE LA VARIANTE (decisión de C-1). Así que
       las dos líneas compiten por las mismas existencias: sin llevar la cuenta,
       dos tonos de veinte unidades pasaban con un stock de treinta. */
    const g2 = nuevo();
    ponerVariantes(g2, 2, 'Color: Rosa|Nude');
    g2.hojas.get('Catálogo').getRange(2, 6).setValue(4);          // stock = 4
    const w = puerta(g2, { a: 'validar', envio: 'centro', sub: '1',
                           items: 'pan-masa-madre:3:Color=Rosa,pan-masa-madre:3:Color=Nude' });
    ok('EL STOCK ES DEL PRODUCTO: las dos líneas compiten por las mismas unidades',
       w.items.reduce((s, i) => s + i.cantidad, 0) === 4,
       w.items.map(i => i.variante + ' x' + i.cantidad).join(' · ') + ' con stock 4');
    ok('  ...y lo dice, en vez de recortar en silencio',
       (w.avisos || []).some(a => /solo quedan 4/.test(a)),
       (w.avisos || []).join(' | ') || '(sin avisos)');
  }

  // ═══ 6. El respaldo las lleva: sin red, las variantes siguen ahí ═══
  {
    const r = require('child_process').execFileSync(process.execPath, ['-e', `
      import('../montar/sembrar-respaldo.mjs').then(m => {
        const cat = { version:'x', envios:[], config:{negocio:'X'}, productos:[{
          id:'labial', nombre:'Labial', formato:'Unidad', categoria:'Cara',
          precio:30000, stock:5, imagenes:[], descripcion:'d',
          variantes:[{ nombre:'Tono', opciones:['Rosa','Nude'] }] }] };
        const P = new Function(m.bloque(cat,'x') + '; return PRODUCTOS;')();
        console.log(JSON.stringify(P[0].variantes || null));
      });`], { encoding: 'utf8', cwd: __dirname });
    /* SIN RED, LA TIENDA PINTA DESDE EL RESPALDO. Si las variantes no fueran
       ahí, el día que Google no conteste el comprador vería el labial sin poder
       elegir el tono — y agregaría al carrito una elección que nadie hizo. */
    ok('EL RESPALDO lleva las variantes: sin red, siguen ahí',
       /"nombre":"Tono"/.test(r) && /"Rosa","Nude"/.test(r), r.trim());
  }

  // ═══ 6. El interruptor y el contrato ═══
  {
    const g = nuevo();
    const cfg = g.filas('Configuración');
    ok('EL INTERRUPTOR f_variantes existe y viene encendido',
       (cfg.find(f => f[0] === 'f_variantes') || [])[1] === 'Sí',
       JSON.stringify((cfg.find(f => f[0] === 'f_variantes') || []).slice(0, 2)));

    const cat = g.filas('Catálogo')[0].map(String);
    const ped = g.filas('Pedidos')[0].map(String);
    /* R1 DEL CONTRATO: solo se agrega, y solo AL FINAL. El maestro lee por
       posición, así que una columna en medio descuadra todo en silencio. */
    ok('LA COLUMNA Variantes va AL FINAL de Catálogo',
       cat[cat.length - 1] === 'Variantes', cat.slice(-3).join(' | '));
    ok('LA COLUMNA Variante va AL FINAL de Pedidos',
       ped[ped.length - 1] === 'Variante', ped.slice(-3).join(' | '));
  }

  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})();
