# Todo lo que hace esta tienda

Inventario completo de funcionalidades de la **Tienda 2.0** (*Tienda Panel*,
`1.0.0`), por categoría y sin dejar ninguna fuera. Si algo existe en el producto, está en
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
- **Búsqueda** por nombre, descripción y categoría.
- **Categorías** como filtro, tomadas de la columna Categoría del catálogo.
- **Orden del catálogo**: el de entrada lo decide el comercio
  (`orden_catalogo`: destacados primero, como en la hoja, precio ascendente o
  descendente, alfabético) y el comprador puede reordenar por precio.
- **Paginación** que se adapta a cuántos productos por fila hay
  (`catalogo_columnas`: 3, 4 o 5 en computador; una columna en celular y dos
  en tableta).
- **Precio anterior tachado** en la tarjeta, cuando lo hay y es mayor.
- **Las fotos se pasan desde la tarjeta** (1.0.0): si un producto tiene más de
  una foto general, la tarjeta del catálogo se desliza con el dedo, con flechas
  al pasar el ratón en computador y puntos abajo. Solo la primera foto se
  descarga al pintar; las demás, la primera vez que alguien toca, pasa el ratón
  o desliza esa tarjeta. Tocar la foto abre la ficha; el botón «Ver» es el
  camino del teclado. Con una sola foto, la tarjeta es la de siempre.
- **Ficha del producto** con galería, formato y categoría, precio,
  disponibilidad, descripción, variantes y **Compartir este producto**.
- **Enlace por producto** (`?p=…`): abre la tienda con esa ficha abierta.
- **Destacados** (columna Destacado) primero, si así se configuró.
- **Agotados y umbral bajo**: lo agotado no se puede pedir y se marca; por
  debajo del umbral del producto (columna Umbral bajo) dice «Últimas N
  unidades», de la combinación elegida si el stock va por variante.
- **Variantes** (`f_variantes`): talla, color o lo que el comercio defina, con
  **stock por combinación** y elección obligatoria antes de agregar.
- **Fotos en tres tamaños** (160/600/900) servidas en WebP cuando existen
  (`fotos_webp`), o transformadas en el borde por Cloudflare u otro proveedor
  (`fotos_cdn`), o tal cual si no hay nada de eso.
- **Marca y colores** de la hoja: color principal, secundario y alterno,
  título de portada, texto, puntos de portada y descripción al pie.
- **Precio por combinación** (0.24.0): en *Inventario por variante › Precio* o
  en el panel, junto al stock; vacío = el precio del producto. La tarjeta dice
  «Desde» el más barato, la ficha cambia el precio con la elección, y el sello de
  la hoja cobra ese precio.
- **Hoja ordenada** (0.24.0): Catálogo primero y en orden lógico (se lee por
  nombre de columna), Configuración por secciones, listas desplegables en todo lo
  que tiene opciones, formato mil filas por delante, obligatorios en rojo,
  pestañas en orden y con color. Una hoja vieja la pone al día sola la revisión
  de cada hora, una vez por versión.
- **Logo del comercio** (`logo`, 0.21.0): el nombre de una foto de la carpeta
  de Drive o una dirección completa. Va en la barra en lugar del signo; el
  nombre del comercio sigue escrito. Si el archivo no llega, vuelve el signo.
  Entero —sin el recorte cuadrado de las derivadas— y en su formato: un PNG
  conserva su transparencia (0.22.5). **Tamaño del logo** (`logo_tamano`,
  0.23.0): 40, 80 (de fábrica) o 120 px de alto, desde la hoja o el panel; en
  el celular 34, 52 o 68, y la barra crece con él.
- **Icono de la pestaña**: el que ponga `favicon`; si no hay, el logo; si
  tampoco, un marcador con los colores de la marca.
- **Horario** visible, y **tienda abierta o cerrada** (`tienda_abierta`,
  `tienda_cerrada_mensaje`): cerrada se puede mirar, no pedir.
- **Vista previa** (`?vista`): la tienda con lo que todavía no se ha publicado,
  sin indexar, sin poder pedir y sin medir.
- **Responsive real**, probado con baterías de navegador en ancho de celular.
- **Sin tipografías ni recursos de terceros** (0.20.0): la tienda no pide un
  solo archivo fuera de su propio dominio para pintarse. El acabado —esquinas
  suaves, botones en píldora, sombras mínimas, cifras tabulares— no cuesta una
  petición.

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
- **Datos de entrega** mínimos: nombre, celular, ciudad, dirección y notas;
  y el correo, solo cuando se paga en línea (ahí llega la confirmación).
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

Dos pestañas, **Ventas** y **Tienda**, con usuario y clave propios de esa
tienda.

**Ventas**

- **Cómo va el mes**: ventas, pedidos, ticket promedio y comparación con el mes
  anterior.
- **Tablero con gráficas** (M4) dibujadas en SVG, cada una con su tabla debajo,
  y **una sola petición por visita**.
- **Pedidos**: lista con filtro por estado, búsqueda por número, detalle del
  pedido y **cambio de estado** (incluye fechas de pago y de despacho y la guía).
- **Enlace de seguimiento** de cada pedido, para mandárselo al comprador.

**Tienda**

- **Productos**: buscar por nombre o código, filtrar por categoría, crear,
  editar, activar/desactivar y borrar (va a la Papelera de la hoja); precio,
  precio anterior, stock, umbral, categoría, formato, referencia, descripción,
  destacado y variantes.
- **Fotos**: subirlas desde el panel al Drive de la tienda.
- **Stock por combinación** de variantes.
- **Ajustes de tu tienda**: todo lo que antes solo se cambiaba en la hoja
  salvo `correo_ultimo` y `panel_usuario`, agrupado (Tu tienda · La venta · El
  cobro · La portada · Los textos · Los colores · Google y WhatsApp ·
  Medición y anuncios · Datos legales · El correo del día · Avanzado), con validación por campo y aviso de
  qué está mal. El WhatsApp, el ambiente del cobro y los datos de
  transferencia piden la clave otra vez. Entre ellos, **el logo y el icono**
  (Tu tienda).
- **Zonas de envío** y **cupones**, con alta, edición y baja.
- **Otra persona en el panel** (2.2): el dueño crea un **colaborador** con
  menos permisos —productos, fotos, pedidos, envíos, cupones y publicar; en
  ajustes, solo la vitrina (textos, colores, portada, logo) y el modo de cobro;
  nada del WhatsApp, los datos de pago, los datos legales, los correos, el
  ambiente del cobro ni lo técnico—. El maestro lo filtra, no la página.
- **Publicar ahora**: dispara el flujo `fotos` de la tienda, que pone en la
  calle lo que está en la hoja. El panel dice si hay cambios sin publicar y
  cuándo se publicó por última vez.
- **Vista previa** antes de publicar (2.5).
- **Versión de tu tienda** (solo el dueño): dice en qué versión está y, con
  **Actualizar ahora**, trae la última publicada de la semilla (dispara el
  `montaje` de la tienda con `semilla`).
- **Recuperar la clave** (2.3) con un código al correo de la tienda, sin pasar
  por el operador.
- **Revisión de tu tienda** (0.20.0): el diagnóstico completo desde el panel,
  con el resumen por puntos —qué falta para vender, qué está publicado, las
  fotos, la copia de seguridad, la medición y si se puede volver atrás—.
- **Límite de intentos** de entrada y sesión de ocho horas.

## 5. La hoja del comercio · Comercio

- **Pestañas**: Catálogo, Configuración, Envíos, Cupones, Pedidos, Pagos, Datos
  de entrega, Inventario por variante, Avísame, Validaciones, Más vendidos,
  Tablero, Registro, Errores y Papelera.
- **Menú propio** con el nombre del comercio y ocho opciones:
  *Publicar ahora* · *Ver mi tienda* · *Actualizar tablero e inventario* ·
  *Enviarme el resumen ahora* · *Clave del panel* · *Diagnóstico* · *Ayuda* ·
  *Actualizar a la última versión* (la misma actualización que el panel).
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
  `<head>`, catálogo, respaldo, SEO, fotos, la guardia y publicación en
  `main`. La guardia la elige `pruebas/publicacion.sh`: en una tienda,
  `tienda-viva.js` (invariantes sobre lo horneado con SUS datos y la página
  abierta en un navegador, 0.22.0); en la semilla, la suite entera.
- **Publicación desde el panel o el menú** de la hoja, sin tocar GitHub
  (flujo `fotos`). Lo que mira si hay novedades aplica la hoja sobre lo
  publicado; lo que publica parte de la plantilla (0.22.2).
- **Actualización sola** de la tienda a una versión publicada de la semilla,
  con vuelta atrás del maestro si algo falla; `semilla.json` dice qué archivos
  son de la semilla (`propios`) y qué se borra en la tienda (`retirados`).
- **La semilla pone al día su propio maestro** (0.22.3): al cortar una versión,
  `release` pregunta al maestro vivo y, si quedó atrás, dispara el `montaje`
  de la semilla con la casilla del maestro y `PUBLICAR`.
- **Flota** (`tiendas`): estado de todas las tiendas y actualización por
  anillos, que se detiene si una falla; `"anillo": "fuera"` saca una tienda
  del reparto y la que da 404 se salta. **Los flujos de cada tienda los entrega
  la flota** (`flota › actualizar` tras cada tienda buena, `flota › flujos` a
  mano, 0.22.1), y desde la 0.22.3 también quita los que la semilla retiró.
- **`panel.gs` se publica con un flujo** (`tiendas › panel`, 0.21.1), con los
  secretos `PANEL_SCRIPT_ID` y `PANEL_CLASPRC`. Todavía no ha corrido con ellos
  puestos: la hoja publicada es anterior a la 1.0.0 y consulta por GET (el
  maestro la atiende y lo anota). El `panel.gs` de la 1.0.0 pregunta por POST a
  las tiendas de la 2.0 y por GET a las **Tienda Básica** (columna *Producto*),
  cuyo maestro no atiende puertas por POST.
- **Alta de una tienda** en un flujo de tres campos, y **conectar** en otros
  tres.
- **Portal de administración** (`panel.gs`, la hoja *Panel de tiendas*): todas
  las tiendas con sus cifras y sus enlaces, desde su menú › *Abrir el portal*,
  que no consulta a ninguna tienda. El mismo menú actualiza las cifras de
  todas, manda el resumen, lista los cobros del mes y trae las ejecuciones de
  GitHub.
- **Registro automático** de cada tienda nueva en esa hoja.
- **Respaldo semanal** de la hoja a una carpeta de Drive del administrador, con
  ocho copias y poda automática.
- **Restauración** por pestañas desde el maestro (`A5_respaldos`,
  `A6_restaurarDatos`), con copia previa.
- **Volver atrás** del sitio o de la versión con el flujo `restaurar`
  (`el-sitio` trae `publicar/` de un commit anterior como un commit nuevo;
  `la-version` se lo pide a `montaje`). `el-sitio` publica de verdad desde la
  0.22.3: antes decía «Ya estaba así» siempre. Volver a una versión anterior
  a la 1.0.0 funciona sin pasos a mano: el maestro sigue atendiendo por GET a
  las herramientas viejas.
- **Diagnóstico** en la hoja y en el maestro: qué falta para que la tienda esté
  terminada, qué versión corre, y los datos para conectar.
- **Comprobación de las fotos con dominio propio** (decisión 22): el montaje
  dice si Cloudflare de verdad las está transformando.
- **Presupuesto de tiempo vigilado** en `fotos`, `montaje` y `pruebas`
  (`presupuesto.json`, `montar/tiempos.mjs`): avisa por encima del objetivo y falla por encima del
  doble. El techo de minutos de Actions al mes se recuerda en cada resumen,
  pero ninguna corrida lo comprueba.

## 7. SEO y compartir · Comprador y buscadores

- **`<head>` horneado** con título, descripción, canónica y Open Graph
  completo, porque los rastreadores no ejecutan JavaScript.
- **Imagen para compartir** (`compartir.jpg`) generada con la marca del
  comercio.
- **`sitemap.xml` y `robots.txt`** horneados en cada publicación.
- **JSON-LD** de la tienda y sus productos.
- **Tipos y caché correctos** para el catálogo, el sitemap y el robots.

## 8. Medición · Comercio (0.19.0 · Meta desde la 0.25.0)

- **Google Analytics 4 opcional**: la clave `analytics_id` en la hoja y nada
  más. Vacía —de fábrica— la tienda no carga nada de Google ni pone cookies.
- **Píxel de Meta opcional** (Facebook e Instagram): la clave `meta_pixel_id`,
  solo el número. Mismas reglas: vacía, nada de Meta. Con él, los anuncios
  miden ventas y pueden volver a mostrarle el producto a quien lo miró.
- **Eventos ya puestos**: `ver_producto`, `agregar_al_carrito`,
  `enviar_pedido`, `pagar_en_linea` y `pago_confirmado`, sin datos personales
  (CONTRATOS §6). En Meta: `ViewContent`, `AddToCart`, `InitiateCheckout`,
  `AddPaymentInfo` y `Purchase` (solo el pago confirmado).
- **La política de datos lo dice sola** cuando la página mide, y con quién.
- **Una sola costura**: la función `medir()` de la página. El medidor propio
  que viene después es un destino más dentro de ella (decisión 35).
- **No mide la vista previa** y no rompe una venta si algo falla.

## 9. Seguridad · Todos

- **Dos tokens distintos** por tienda: el del menú (a la vista en la hoja, solo
  abre el menú) y el de montaje (en los secretos, abre las puertas de servicio).
- **Puertas con guardia declarada**: pública, menú, montaje o panel. Las del
  panel van **solo por POST**, para que el testigo no quede en el historial.
- **Clave del panel como huella con sal**, nunca en claro, nunca en la hoja.
- **Testigo de sesión firmado** por tienda, de ocho horas.
- **Límite de intentos** y de tamaño de cuerpo en cada puerta.
- **Política de seguridad de contenido** en tres copias comparadas por una
  aserción, cabeceras de Cloudflare (HSTS, `frame-ancestors`, `nosniff`,
  `Permissions-Policy`) y ni un solo dato de negocio en la hoja del cliente.
- **Números de pedido no adivinables** y consulta que no revela si existen.
- **Sin datos del comprador** más allá del pedido: por WhatsApp la hoja no
  guarda su nombre ni su celular (del pedido, solo la ciudad); cobrando en línea, sus datos de entrega quedan en la
  pestaña *Datos de entrega*, que no sale por ninguna puerta. Ni perfilado, ni
  terceros, salvo Google Analytics o el píxel de Meta si el comercio los pone.
- **Ningún token de montaje en una dirección** (1.0.0, ROADMAP 5.7): las
  herramientas de `montar/`, el flujo `conectar` de `tiendas` y `panel.gs`
  (hacia las tiendas de la 2.0) le hablan al maestro por POST, con el token en
  el cuerpo.
  - **El maestro sigue aceptando el GET** en las puertas de montaje, a
    propósito: volver a una versión anterior corre las herramientas de esa
    versión, que preguntan por GET, contra el maestro nuevo. No lo rechaza:
    lo **anota** (propiedad `TOKEN_POR_GET`: la puerta y la fecha, nunca el
    token) y el **Diagnóstico** dice quién sigue mandándolo así —la hoja
    *Panel de tiendas* sin actualizar, o una herramienta anterior a la 1.0.0—.
  - Clientes que todavía mandan un token por GET: el **stub** de cada hoja
    (su propio token de menú, guardia `menu`; cerrarlo exige volver a pegar el
    stub en cada hoja) y `panel.gs` cuando consulta una **Tienda Básica**
    (hasta migrarla a la 2.0).

## 10. Lo que se prueba solo · Operador

- **Baterías sobre el código real**, incluidas las de navegador con
  Playwright. Cuántas son no se escribe (`CONTRIBUIR.md` › *Las pruebas*).
- **Guardias con control negativo**: cada regla nueva se verifica en rojo antes
  de darla por buena.
- **Esquema congelado** de la hoja y de las puertas: un cambio en las columnas
  o en las claves obliga a pasar por `--congelar`, y eso se ve en el diff.
- **Determinismo del horneado**: el mismo origen produce el mismo archivo.
- **Presupuesto de tiempo** con guardia en cada corrida.
- **La tiendita** (`pruebas/tiendita.js`): prueba el repositorio como si fuera
  una tienda, con la guardia de publicación y los datos de otro comercio.

---

## Lo que esta tienda **no** hace (y dónde está escrito)

- No tiene **pasarela propia**: cobra por WhatsApp o con Bold (decisión 12).
- No guarda **datos del comprador** para marketing, ni hoy ni con analítica
  propia (decisión 16).
- No tiene **página por producto** para la vista previa del enlace: los
  rastreadores verían la tienda, no el producto (`ARQUITECTURA.md`).
- No **restaura pedidos** desde una copia: se restauran catálogo,
  configuración, envíos, cupones e inventario por variante (bitácora 77).
- No pide **consentimiento de cookies** antes de cargar Google Analytics o el
  píxel de Meta: es un riesgo legal abierto y no se construye sin la
  confirmación de un abogado (decisión 35).
- No hace **facturación electrónica**, ni integra transportadoras, ni tiene
  multi-idioma o multi-moneda: no está en el MVP ni en el roadmap todavía.
