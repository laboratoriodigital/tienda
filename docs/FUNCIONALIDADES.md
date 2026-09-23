# Todo lo que hace esta tienda

Inventario completo de funcionalidades de la **Tienda Panel** (`0.19.0`), por
categoría y sin dejar ninguna fuera. Si algo existe en el producto, está en
esta lista; si no está aquí, no existe todavía —y entonces vive en
`ROADMAP.md`—.

Cómo leer las marcas:

- **Comprador**: lo ve quien entra a la tienda.
- **Comercio**: lo usa el dueño del negocio (panel web o su hoja).
- **Operador**: lo usamos nosotros (hoja de administración, GitHub, Cloudflare).
- `clave_en_la_hoja` — la clave de la pestaña Configuración que lo enciende o lo
  apaga. Las claves y sus valores están, normativos, en `CONTRATOS.md`.

---

## 1. El catálogo y la vitrina · Comprador

- **Catálogo horneado**: la tienda abre sin preguntarle nada a Google. Lo que
  se ve sale de `publicar/catalogo.json`, publicado en cada montaje.
- **Catálogo de respaldo dentro del archivo**: si hasta eso fallara, la página
  pinta el último catálogo conocido en lugar de una tienda vacía.
- **Búsqueda** por nombre, formato, categoría y referencia.
- **Categorías** como filtro, tomadas de la columna Categoría del catálogo.
- **Orden del catálogo**: el de entrada lo decide el comercio
  (`orden_catalogo`: destacados primero, como en la hoja, precio ascendente o
  descendente, alfabético) y el comprador puede reordenar por precio.
- **Paginación** que se adapta a cuántos productos por fila hay
  (`catalogo_columnas`: 3, 4 o 5 en computador; 1 o 2 en celular).
- **Ficha del producto** con galería, descripción, formato, referencia y
  precio anterior tachado cuando lo hay.
- **Destacados** (columna Destacado) primero, si así se configuró.
- **Agotados y umbral bajo**: lo agotado no se puede pedir y se marca; el
  umbral bajo avisa «quedan pocos» sin decir cuántos.
- **Variantes** (`f_variantes`): talla, color o lo que el comercio defina, con
  **stock por combinación** y elección obligatoria antes de agregar.
- **Fotos en tres tamaños** (160/600/900) servidas en WebP cuando existen
  (`fotos_webp`), o transformadas en el borde por Cloudflare u otro proveedor
  (`fotos_cdn`), o tal cual si no hay nada de eso.
- **Marca y colores** de la hoja: color principal, secundario y alterno,
  título de portada, texto, puntos de portada y descripción al pie.
- **Icono de la tienda**: el que ponga `favicon`, o uno dibujado con los
  colores de la marca.
- **Horario** visible, y **tienda abierta o cerrada** (`tienda_abierta`,
  `tienda_cerrada_mensaje`): cerrada se puede mirar, no pedir.
- **Vista previa** (`?vista`): la tienda con lo que todavía no se ha publicado,
  sin indexar, sin poder pedir y sin medir.
- **Responsive real**, probado con baterías de navegador en ancho de celular.

## 2. El carrito y el pedido · Comprador

- **Carrito** con cantidades, cambios y borrado, guardado en el navegador.
- **Zonas de envío** con su costo, elegidas por el comprador.
- **Envío gratis desde** un monto (`envio_gratis_desde`), anunciado: «te faltan
  $12.000 para el envío gratis».
- **Pedido mínimo** (`pedido_minimo`) sobre los productos, sin contar el envío.
- **Cupones**: porcentaje o monto fijo, con vigencia y tope de usos,
  **validados contra la hoja** (si la hoja no contesta, no hay descuento).
- **Total sellado por la hoja**: el maestro devuelve el total verificado y la
  página deja de advertir «calculado por la página».
- **Datos de entrega** mínimos: nombre, teléfono, dirección y notas.
- **Envío del pedido por WhatsApp** con el mensaje armado y el número de
  pedido incluido.
- **Registro del pedido en la hoja** antes de abrir WhatsApp, con descuento de
  inventario y código de verificación.
- **Rescate de pedidos perdidos**: si el registro no llega (red del comprador),
  queda pendiente en su navegador y se reenvía al volver a abrir la tienda.
- **Pago en línea opcional** (`cobro_modo: Pasarela`, decisión 12): pasarela de
  Bold, con la unidad apartada mientras se paga, y vuelta a la tienda con el
  estado del cobro. La firma se calcula en el maestro: las llaves nunca viajan
  a la página.
- **Pago por transferencia**: los datos (`pago_llave`, `pago_titular`,
  `pago_entidad`, `pago_texto`, tope Bre-B) se mandan por WhatsApp después de
  confirmar, nunca publicados en la página.
- **Seguimiento del pedido** (`f_rastreo`): `pedido.html?n=…&s=…`, con estado,
  fecha y qué pidió, sin guardar un dato más del comprador.
- **«Avísame cuando llegue»** (`f_avisame`): en lo agotado, abre WhatsApp y
  cuenta cuántos esperan ese producto, sin guardar datos de quien pregunta.

## 3. Lo legal · Comprador

- **Términos y condiciones**, **política de privacidad** y **derecho de
  retracto** generados desde los datos de la hoja (`empresa_*`,
  `legal_actualizado`).
- **Excepciones al retracto** por productos perecederos
  (`retracto_excepciones`, art. 47 Ley 1480), en las palabras del comercio.
- **Datos del comercio** visibles: razón social, NIT, dirección, ciudad,
  teléfono y correo.
- **Autoría al pie** (`f_autoria`, `autoria_url`), que se puede apagar.

## 4. El panel del comercio (`admin.html`) · Comercio

Dos pantallas, con usuario y clave propios de esa tienda.

**Ventas**

- **Cómo va el mes**: ventas, pedidos, ticket promedio y comparación con el mes
  anterior.
- **Tablero con gráficas** (M4) dibujadas en SVG, cada una con su tabla debajo,
  y **una sola petición por visita**.
- **Pedidos**: lista con filtro por estado, búsqueda por número, detalle del
  pedido y **cambio de estado** (incluye fechas de pago y de despacho y la guía).
- **Enlace de seguimiento** de cada pedido, para mandárselo al comprador.

**Tienda**

- **Productos**: crear, editar, activar/desactivar y borrar; precio, precio
  anterior, stock, umbral, categoría, formato, referencia, descripción,
  destacado y variantes.
- **Fotos**: subirlas desde el panel al Drive de la tienda.
- **Stock por combinación** de variantes.
- **Ajustes de tu tienda**: todo lo que antes solo se cambiaba en la hoja,
  agrupado (Tu tienda · La venta · El cobro · La portada · Los textos · Los
  colores · Google y WhatsApp · Datos legales · El correo del día · Avanzado),
  con validación por campo y aviso de qué está mal.
- **Zonas de envío** y **cupones**, con alta, edición y baja.
- **Otra persona en el panel** (2.2): el dueño crea un **colaborador** con
  menos permisos —gestiona la tienda entera, no toca repositorios, llaves, NIT,
  correos ni el ambiente de pagos, que es siempre producción—.
- **Publicar ahora**: pone en la calle lo que está en la hoja.
- **Vista previa** antes de publicar (2.5).
- **Versión de tu tienda**: dice en qué versión está y **actualiza sola** a la
  última publicada de la semilla.
- **Recuperar la clave** (2.3) con un código al correo de la tienda, sin pasar
  por el operador.
- **Límite de intentos** de entrada y sesión de ocho horas.

## 5. La hoja del comercio · Comercio

- **Pestañas**: Catálogo, Configuración, Envíos, Cupones, Pedidos, Pagos, Datos
  de entrega, Inventario por variante, Avísame, Validaciones, Más vendidos,
  Tablero, Registro, Errores y Papelera.
- **Menú propio** con el nombre del comercio y ocho opciones:
  *Publicar ahora* · *Ver mi tienda* · *Actualizar tablero e inventario* ·
  *Enviarme el resumen ahora* · *Clave del panel* · *Diagnóstico* · *Ayuda* ·
  *Actualizar a la última versión*.
- **Validaciones**: la pestaña que dice qué celda está mal y por qué.
- **Registro de cambios**: quién cambió qué y cuándo, en las pestañas que
  importan.
- **Papelera**: borrar desde el panel no borra, mueve la fila aquí.
- **Tablero en la hoja** con las mismas cifras del panel, dibujado con bloques
  para que no dependa del idioma de la hoja.
- **Resumen diario por correo** (`correo_resumen`, `correo_hora`,
  `correo_siempre`) con lo que hay que atender.
- **Avisos de error** en su propia pestaña, sin tumbar nada.

## 6. Publicación y operación · Operador

- **Montaje completo** en un solo flujo: versión de la semilla, maestro,
  `<head>`, catálogo, respaldo, SEO, fotos, **todas las baterías** y publicación
  en `main`.
- **Publicación desde el panel o el menú** de la hoja, sin tocar GitHub.
- **Actualización sola** de la tienda a una versión publicada de la semilla,
  con vuelta atrás del maestro si algo falla.
- **Flota** (`tiendas`): estado de todas las tiendas y actualización por
  anillos, que se detiene si una falla.
- **Alta de una tienda** en un flujo de tres campos, y **conectar** en otros
  tres.
- **Portal de administración**: todas las tiendas con sus cifras y sus enlaces,
  desde el menú de la hoja de administración.
- **Registro automático** de cada tienda nueva en esa hoja.
- **Respaldo semanal** de la hoja a una carpeta de Drive del administrador, con
  ocho copias y poda automática.
- **Restauración** por pestañas desde el maestro (`A5_respaldos`,
  `A6_restaurarDatos`), con copia previa.
- **Volver atrás** del sitio o de la versión con el flujo `restaurar`.
- **Diagnóstico** en la hoja y en el maestro: qué falta para que la tienda esté
  terminada, qué versión corre, y los datos para conectar.
- **Comprobación de las fotos con dominio propio** (decisión 22): el montaje
  dice si Cloudflare de verdad las está transformando.
- **Presupuestos vigilados**: tiempo de publicación, minutos de Actions y
  ejecuciones de Apps Script.

## 7. SEO y compartir · Comprador y buscadores

- **`<head>` horneado** con título, descripción, canónica y Open Graph
  completo, porque los rastreadores no ejecutan JavaScript.
- **Imagen para compartir** (`compartir.jpg`) generada con la marca del
  comercio.
- **`sitemap.xml` y `robots.txt`** horneados en cada publicación.
- **JSON-LD** de la tienda y sus productos.
- **Tipos y caché correctos** para el catálogo, el sitemap y el robots.

## 8. Medición · Comercio (0.19.0)

- **Google Analytics 4 opcional**: la clave `analytics_id` en la hoja y nada
  más. Vacía —de fábrica— la tienda no carga nada de Google ni pone cookies.
- **Eventos ya puestos**: `agregar_al_carrito`, `enviar_pedido` y
  `pagar_en_linea`.
- **Una sola costura**: la función `medir()` de la página. El medidor propio
  que viene después es una línea dentro de ella.
- **No mide la vista previa** y no rompe una venta si algo falla.

## 9. Seguridad · Todos

- **Dos tokens distintos** por tienda: el del menú (a la vista en la hoja, solo
  abre el menú) y el de montaje (en los secretos, abre las puertas de servicio).
- **Puertas con guardia declarada**: pública, menú, montaje o panel, y las del
  panel **solo por POST** para que el testigo no quede en el historial.
- **Clave del panel como huella con sal**, nunca en claro, nunca en la hoja.
- **Testigo de sesión firmado** por tienda, de ocho horas.
- **Límite de intentos** y de tamaño de cuerpo en cada puerta.
- **Política de seguridad de contenido** en tres copias comparadas por una
  aserción, cabeceras de Cloudflare (HSTS, `frame-ancestors`, `nosniff`,
  `Permissions-Policy`) y ni un solo dato de negocio en la hoja del cliente.
- **Números de pedido no adivinables** y consulta que no revela si existen.
- **Sin datos del comprador** más allá del pedido: ni analítica propia, ni
  perfilado, ni terceros.

## 10. Lo que se prueba solo · Operador

- **Más de 2.400 aserciones** sobre el código real, incluidas baterías de
  navegador con Playwright.
- **Guardias con control negativo**: cada regla nueva se verifica en rojo antes
  de darla por buena.
- **Esquema congelado** de la hoja y de las puertas: un cambio en las columnas
  o en las claves obliga a pasar por `--congelar`, y eso se ve en el diff.
- **Determinismo del horneado**: el mismo origen produce el mismo archivo.
- **Presupuesto de tiempo** con guardia en cada corrida.

---

## Lo que esta tienda **no** hace (y dónde está escrito)

- No tiene **pasarela propia**: cobra por WhatsApp o con Bold (decisión 12).
- No guarda **datos del comprador** para marketing, ni hoy ni con analítica
  propia (decisión 16).
- No tiene **página por producto** para la vista previa del enlace: los
  rastreadores verían la tienda, no el producto (`ARQUITECTURA.md`).
- No **restaura pedidos** desde una copia: se restauran catálogo,
  configuración, envíos, cupones e inventario por variante (bitácora 77).
- No hace **facturación electrónica**, ni integra transportadoras, ni tiene
  multi-idioma o multi-moneda: no está en el MVP ni en el roadmap todavía.
