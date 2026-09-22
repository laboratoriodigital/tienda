/* 0.16.0 · decisión 22 — las fotos por Cloudflare, comprobadas.
 * ---------------------------------------------------------------------------
 * Con dominio propio hay dos maneras de servir las fotos y las dos quedan:
 * tres tamaños hechos en el montaje (la de siempre, sin límites) o Cloudflare
 * transformando en el borde. La segunda solo funciona si la zona lo tiene
 * activado, y si no, la página vuelve al original sin que nadie se entere.
 * montar/revisar-fotos-cdn.mjs lo pregunta en cada montaje y publicación.
 *
 *   node pruebas/fotoscdn.js      (sin red)
 */
const fs = require('fs');
const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));

(async () => {
  const m = await import('../montar/revisar-fotos-cdn.mjs');
  const cf = { fotos_cdn: 'https://tienda.laboratorio-digital.com/cdn-cgi/image/format=auto,quality=82,width={ancho},fit=cover/fotos/{ruta}',
               fotos_origen: 'https://tienda.laboratorio-digital.com/fotos' };
  ok('LA URL DE PRUEBA es la misma que pide la página, para la miniatura',
     m.urlDePrueba(cf, 'pan-1.jpg') === 'https://tienda.laboratorio-digital.com/cdn-cgi/image/format=auto,quality=82,width=160,fit=cover/fotos/pan-1.jpg');
  ok('  ...con la primera foto que no sea una URL completa', m.unaFoto({ productos: [{ imagenes: ['https://x/y.jpg'] }, { imagenes: ['b.jpg'] }] }) === 'b.jpg');
  ok('SIN CLOUDFLARE, nada que revisar (la opción de siempre sigue siendo la de fábrica)', m.veredicto({ fotos_cdn: '' }, null).nivel === 'nada');
  ok('CON CLOUDFLARE activado, lo dice', m.veredicto(cf, { status: 200, tipo: 'image/avif' }).nivel === 'bien');
  const v = m.veredicto(cf, { status: 404, tipo: 'text/html' });
  ok('  ...y sin activar en la zona, avisa DÓNDE se activa y cuál es la otra salida',
     v.nivel === 'aviso' && /Images › Transformations/.test(v.texto) && /Ninguna/.test(v.texto), v.texto);
  ok('  ...y si no contesta, también avisa', m.veredicto(cf, { error: 'no contestó' }).nivel === 'aviso');
  const flujos = ['montaje.yml', 'fotos.yml'].map(f => fs.readFileSync('../.github/workflows/' + f, 'utf8'));
  ok('MONTAJE Y PUBLICAR lo revisan, sin tumbar la corrida', flujos.every(f => /node montar\/revisar-fotos-cdn\.mjs/.test(f)) &&
     !/process\.exit\(1\)/.test(fs.readFileSync('../montar/revisar-fotos-cdn.mjs', 'utf8')));
  const maestro = fs.readFileSync('../maestro.gs', 'utf8');
  ok('EL PANEL dice qué da cada opción', /tres tamaños ya hechos \(sin límites/.test(maestro) && /5\.000 fotos distintas al mes gratis/.test(maestro));
  console.log(T.join('\n'));
  console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
  process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
