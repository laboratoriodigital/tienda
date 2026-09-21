# El contrato de datos

**Documento normativo.** Lo que está aquí no se cambia con un commit: se cambia
con una decisión, y esa decisión tiene reglas. El resto de `/docs` explica cómo
se hacen las cosas; este archivo dice qué **no** se puede hacer.

---

## 1. Por qué un contrato, y por qué tan estricto

Este producto es **una tienda por comercio**: cada uno con su hoja, su cuenta de
Google y su copia del `index.html`. Eso, que es lo que lo hace barato, es
también lo que hace que un cambio de esquema no se parezca en nada al de un
sistema con una sola base de datos.

No hay una migración que se corra una vez. Hay N hojas que se actualizan cuando
su dueño abre el editor y pega el código nuevo —cosa que puede pasar hoy, en un
mes, o nunca—. Mientras tanto conviven versiones distintas del mismo esquema, y
las dos tienen que funcionar.

Y hay algo peor: **una hoja de cálculo no tiene errores de compilación.** Si una
columna cambia de nombre, nada se rompe con estrépito. La lectura devuelve
vacío, el producto sale sin precio, el pedido sale sin ciudad. Es el patrón 1 de
la bitácora otra vez: *el fallo que funciona es el caro*.

---

## 2. Las tres reglas

**R1 · Solo se agrega, y solo al final.** Una columna nueva va después de la
última. Nunca en medio, nunca al principio.

**R2 · Está prohibido renombrar y prohibido reordenar.** Ni una columna, ni una
clave de `Configuración`, ni un campo de los que salen por las puertas del
maestro. Un nombre publicado es un nombre para siempre; si de verdad estorba, se
agrega el nuevo al final y el viejo se queda respondiendo hasta que ninguna
tienda lo lea.

**R3 · Todo campo nuevo es opcional.** El código que lo lee tiene que funcionar
cuando no está, porque durante un tiempo **no va a estar** en la mayoría de las
hojas. Un campo nuevo obligatorio es una tienda rota que todavía no lo sabe.

> **La consecuencia práctica:** un cambio de esquema nunca es un paso. Primero
> sale la versión que acepta las dos formas; después se migran las hojas; y solo
> cuando ninguna queda atrás se retira el soporte de la vieja.

---

## 3. Quién lee qué

```
   Hoja del comercio          Maestro (standalone)        Vitrina (index.html)
   ─────────────────          ────────────────────        ────────────────────
   Catálogo        ──┐
   Configuración   ──┤
   Envíos          ──┼──►  ?a=catalogo   ──────────────►  productos, envios, config
   Cupones         ──┘     ?a=validar    ◄──────────────  el carrito, a sellar
   Pedidos         ◄──     ?a=registrar  ◄──────────────  el pedido confirmado
   Validaciones    ◄──
   Más vendidos    ◄──     ?a=identidad  ──────────────►  el montaje
   Tablero         ◄──     ?a=bloques    ──────────────►  el montaje
   Errores         ◄──     ?a=panel      ──────────────►  el panel de tiendas
```

La vitrina **nunca** escribe en la hoja, y la hoja **nunca** llama a la vitrina.
Todo pasa por las puertas del maestro, y por eso son ellas —no las pestañas— el
contrato que de verdad hay que cuidar: una tienda sin actualizar sigue leyendo
los nombres viejos desde un servidor nuevo.

---

## 4. Las nueve pestañas

### `Catálogo`

Lo que el comercio vende. Es la única pestaña que el comerciante edita todos los días.


| # | Columna |
|---|---|
| 1 | `ID` |
| 2 | `Nombre` |
| 3 | `Formato` |
| 4 | `Categoría` |
| 5 | `Precio` |
| 6 | `Stock` |
| 7 | `Descripción` |
| 8 | `Imágenes` |
| 9 | `Destacado` |
| 10 | `Activo` |
| 11 | `Referencia` |
| 12 | `Precio antes` |
| 13 | `Umbral bajo` |
| 14 | `Variantes` |

**`Variantes` (C-1).** Opcional. Grupos separados por `;`, el nombre antes de
`:`, y las opciones con `|` — el mismo separador que ya usa `Imágenes`, para no
tener dos convenciones en la misma hoja:

```
Talla: S|M|L ; Color: Rosa|Nude
```

Tope: cuatro grupos y veinticuatro opciones por grupo. **El catálogo falla
abierto**: una celda que no se entiende no saca el producto de la tienda, lo deja
sin variantes y reporta la celda — vender un labial sin tono deja un pedido que
el comerciante resuelve con un mensaje, y no venderlo es una venta perdida y
callada. El precio es lo contrario y por eso ese sí tumba el producto.

Y **hoy el stock es del producto, no de la variante**: dos líneas del mismo
producto compiten por las mismas existencias. Era una decisión consciente con su
disparador escrito —el primer comercio que pierda una venta por una talla
agotada—, y **ese disparador se cumplió el 21 de septiembre**: el stock baja a
la combinación con la historia C-1b (decisión 11). Hasta que C-1b se publique,
lo que corre es lo de este párrafo.


### `Configuración`

Clave, valor y una explicación. Todo lo que distingue una tienda de otra vive aquí, no en el código.


| # | Columna |
|---|---|
| 1 | `Clave` |
| 2 | `Valor` |
| 3 | `Qué es` |


### `Envíos`

Las zonas de despacho y su costo. La página las lee para calcular el total.


| # | Columna |
|---|---|
| 1 | `ID` |
| 2 | `Nombre` |
| 3 | `Valor` |


### `Cupones`

Los descuentos. El maestro los valida; la página nunca decide un descuento sola.


| # | Columna |
|---|---|
| 1 | `Código` |
| 2 | `Tipo` |
| 3 | `Valor` |
| 4 | `Mínimo` |
| 5 | `Vence` |
| 6 | `Usos máximos` |
| 7 | `Usos confirmados` |
| 8 | `Activo` |
| 9 | `Notas` |


### `Validaciones`

El acta de cada pedido: qué sumó la página, qué sumó la hoja, en qué se diferencian y qué se le avisó al comprador.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Cupón` |
| 4 | `Subtotal según la hoja` |
| 5 | `Subtotal según la página` |
| 6 | `Discrepancia` |
| 7 | `Descuento` |
| 8 | `Envío` |
| 9 | `Total según la hoja` |
| 10 | `Detalle` |
| 11 | `Avisos` |


### `Pedidos`

Una fila por línea de pedido, no por pedido. La columna Inventario la escribe el script.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Pedido` |
| 3 | `Validación` |
| 4 | `Estado` |
| 5 | `Ciudad` |
| 6 | `Cupón` |
| 7 | `Producto` |
| 8 | `ID` |
| 9 | `Cantidad` |
| 10 | `Precio unitario` |
| 11 | `Subtotal línea` |
| 12 | `Total del pedido` |
| 13 | `Inventario` |
| 14 | `Fecha de pago` |
| 15 | `Fecha de despacho` |
| 16 | `Guía` |
| 17 | `Variante` |

**`Variante` (C-1).** Qué eligió el comprador, ya comprobado contra la hoja y
escrito con el texto del catálogo —no con el que mandó la página—: `Talla: M ·
Color: Rosa`. Vacía en los pedidos sin variantes. Una elección que el comercio no
ofrece **no se guarda**: tumba la línea, porque sería un pedido que nadie puede
despachar.

**Cómo viaja desde la página.** El parámetro `items` de `?a=validar` y
`?a=registrar` lleva una línea por producto, separadas por `,`, y cada línea es:

```
id:cantidad                                   sin variantes
id:cantidad:Grupo=Opción;Grupo=Opción         con variantes
```

De ahí sale el tercer separador y su consecuencia: **una opción que lleve `,`
`:` `;` `=` o `|` no cabe en la línea**, así que la página tumba ese grupo antes
de pintarlo y lo dice en la consola. El producto sigue a la venta sin esa
elección, que es la misma regla de fallo abierto de la columna `Variantes`. Un
comercio que necesite escribir `40,5` tiene que llamarla de otra forma.


### `Más vendidos`

Resumen que recalcula el disparador. Nadie escribe aquí a mano.


| # | Columna |
|---|---|
| 1 | `Producto` |
| 2 | `ID` |
| 3 | `Unidades vendidas` |
| 4 | `Ingresos` |
| 5 | `Pedidos en que aparece` |


### `Tablero`

Los indicadores que ve el comerciante al abrir la hoja. Se recalcula solo.


| # | Columna |
|---|---|
| 1 | `Indicador` |
| 2 | `Valor` |
| 3 | `Comparación` |


### `Errores`

Lo que llegó y no se pudo entender, y lo que se leyó mal. Existe para que un fallo deje rastro en vez de desaparecer.


| # | Columna |
|---|---|
| 1 | `Fecha` |
| 2 | `Error` |
| 3 | `Primeros 200 caracteres recibidos` |

### `Papelera` (D-2)

**No la crea `instalar()`**: nace la primera vez que se borra un producto desde
el panel. Borrar desde el panel **no borra**: mueve la fila entera aquí, con la
fecha y desde dónde, y la quita de `Catálogo`. Se recupera copiando la fila de
vuelta. Solo se agrega; nadie escribe aquí a mano.

| # | Columna |
|---|---|
| 1–14 | Las mismas catorce de `Catálogo`, en el mismo orden — para que devolver un producto sea copiar y pegar |
| 15 | `Borrado el` |
| 16 | `Desde` |

> **`Pedidos` merece una nota.** Es una fila **por línea de pedido**, no por
> pedido: cinco productos son cinco filas con el mismo número en `Pedido`. Y la
> última columna, `Inventario`, la escribe el script para saber si esa línea ya
> descontó stock. Confirmar dos veces, o deshacer, no puede descuadrar el
> inventario.

---

## 5. Las claves de `Configuración`

Son 45. Ninguna es opcional para el maestro —`instalar()` las crea todas—, pero
**todas pueden estar vacías**: una tienda a medio configurar tiene que seguir
sirviendo lo que sí sabe.

`instalar()` se puede volver a correr cuando se quiera. Agrega las claves que
falten al final y **no toca ningún valor escrito**. Por eso el orden importa
tanto como los nombres: la escritura ubica la fila por posición justamente para
no pisar lo que el comerciante puso.


| Grupo | Claves, en el orden en que están en la hoja |
|---|---|
| **La identidad del comercio** | `negocio` · `whatsapp` · `logo` · `favicon` |
| **La portada** | `portada_titulo` · `portada_texto` · `portada_puntos` |
| **Los colores** | `color_principal` · `color_secundario` · `color_alterno` |
| **Los textos** | `pie_descripcion` · `como_compras` · `legal_actualizado` · `horario` |
| **Los datos legales** | `empresa_razon` · `empresa_nit` · `empresa_correo` · `empresa_direccion` · `empresa_ciudad` · `empresa_tel` — **bloquean la publicación**: razón social, NIT, dirección, ciudad y al menos uno de correo o teléfono (decisión 09). Los arman los textos de tratamiento de datos y de retracto |
| **El sitio publicado** | `sitio_url` · `sitio_titulo` · `sitio_descripcion` |
| **El correo del resumen** | `correo_resumen` · `correo_hora` · `correo_siempre` · `correo_ultimo` |
| **Las fotos y el respaldo** | `fotos_origen` · `fotos_cdn` · `respaldo_carpeta` · `fotos_drive` · `fotos_webp` |
| **El pago — **no sale por ninguna puerta pública**** | `pago_llave` · `pago_titular` · `pago_entidad` · `pago_texto` · `pago_tope` |
| **La venta** | `envio_gratis_desde` |
| **Dónde vive el sitio** | `repositorio` — dueño/repositorio en GitHub. Lo usa «Publicar ahora». No es un secreto; el permiso sí, y ese vive en las propiedades del script |
| **La autoría** | `f_autoria` · `autoria_url` — el pie "Powered by Laboratorio Digital". `f_autoria` = No lo apaga (decisión comercial, con precio); `autoria_url` vacía muestra el texto sin enlace |
| **El retracto** | `retracto_excepciones` — productos que no admiten cambio de opinión por ser perecederos (art. 47, Ley 1480), separados por \|. Vacío = ninguno queda excluido |
| **Las variantes** | `f_variantes` — con Sí, un producto con la columna `Variantes` llena pide elegir antes de agregar al carrito. Con No se ignoran y el producto se vende sin elección |
| **El orden del catálogo** | `orden_catalogo` — en qué orden ve el catálogo quien entra. De fábrica, `Destacados primero` |
| **El panel del comerciante** | `panel_usuario` — con qué nombre entra al panel. **La clave no está aquí y no puede estarlo**: vive como huella con sal en las propiedades del proyecto. Vacío = el panel está cerrado |

**`orden_catalogo` (C-4).** Uno de estos cinco, escrito tal cual —se lee sin
distinguir mayúsculas ni tildes—:

| Valor | Qué hace |
|---|---|
| `Destacados primero` | **De fábrica.** Los marcados `Destacado` delante; detrás, el orden de la hoja |
| `Como en la hoja` | El orden en que están escritos los productos, sin más |
| `Precio: de menor a mayor` | |
| `Precio: de mayor a menor` | |
| `Nombre: de la A a la Z` | Con las reglas del español: la Ñ va entre la N y la O |

Esto decide **solo la entrada**. El comprador reordena por precio o por nombre
desde la tienda, y cuando lo hace **la lista es ese orden y nada más: el
destacado deja de flotar** — un «de menor a mayor» que empieza por el producto
más caro porque alguien lo destacó es un control que miente, y quien compra no
tiene cómo saberlo. Destacar es una posición dentro del orden del comercio, no
una chincheta que gana siempre.

Un valor que no sea ninguno de los cinco **no deja la tienda sin vitrina**: se
usa el de fábrica y se dice en la consola, con la lista de los buenos. Es la
misma regla de fallo abierto del resto del catálogo.

**`panel_usuario` (D-1).** El nombre con el que el comerciante entra a su panel.
Va en la hoja porque no es un secreto —es un nombre, y tiene que poder verlo y
cambiarlo sin llamar a nadie—. **La clave no va en la hoja nunca**: se pone
desde el menú (*Clave del panel*), que la inventa, la enseña una sola vez y
guarda solo su huella con sal en las propiedades del proyecto. La hoja se
comparte; las propiedades no se comparten al compartir la hoja, y eso es toda la
diferencia.

Hasta dónde llega eso, dicho para que nadie lo dé por más de lo que es: quien
pueda abrir el proyecto de Apps Script puede leer las propiedades, y quien pueda
hacer eso ya tiene la hoja entera. La huella protege de que la clave acabe en
una captura, en un correo de soporte o en un repositorio — que es por donde se
pierden las claves de verdad. Contra adivinarla, lo que protege es el límite de
cinco intentos y quince minutos.

Vacío = **el panel está cerrado**. No hay usuario de fábrica ni clave de
fábrica, y sin clave puesta no se entra — con la misma respuesta que ante una
clave equivocada, porque «esta tienda todavía no tiene clave» le dice a
cualquiera que hay una puerta sin cerradura.

---

## 6. Lo que sale por cada puerta

Los nombres de primer nivel de cada respuesta. **Quitar uno rompe, desde el
servidor, una tienda que nadie tocó.**

**Y cada puerta declara a quién deja pasar** (`PUERTAS`, en el maestro). La
guardia se aplica en un solo sitio, y una guardia mal escrita **no abre**: lo
contrario es que una errata deje la puerta de par en par sin que se note.

| Guardia | Quién pasa | Puertas |
|---|---|---|
| `publica` | cualquiera | `version` · `catalogo` · `validar` · `registrar` · `entrar` |
| `montaje` | el token de despliegue (`?t=`) | `panel` · `identidad` · `bloques` · `sembrar` · `fotos` · `foto` |
| `menu` | el token del stub. Se guarda a sí misma, porque además distingue el token viejo del nuevo para la migración | `menu` |
| `panel` | el testigo del comerciante (`k`), ocho horas, de esta tienda | `sesion` · `productos` · `guardar_producto` · `activar_producto` · `borrar_producto` · `subir_foto` |

`entrar` es pública porque es la que **entrega** las credenciales: no se puede
pedir el testigo para pedir el testigo. Lo que la protege es el límite de
intentos, no la guardia.

**`entrar` y todas las del panel son solo por POST** (`soloPost` en la tabla).
Por GET contestan que se usan por POST y no hacen nada — ni siquiera cuentan
como intento fallido, porque si contaran, cualquiera bloquearía la tienda con
cinco visitas a una dirección. La razón es una sola: por GET la clave y el
testigo irían en la dirección, y la dirección se queda en el historial del
navegador del mostrador y en los registros de Google.

El cuerpo del POST es un JSON en texto plano (`Content-Type: text/plain`, para
que el navegador no pregunte antes por CORS) con `a` diciendo la puerta y los
mismos nombres de parámetro que por GET. Pasa por **la misma tabla y la misma
guardia**. Un cuerpo sin `a` sigue siendo el registro de pedidos de siempre.
Tope: 20.000 caracteres para el panel, menos `subir_foto`, que tiene el suyo
(una foto no cabe en 20.000).

**Las escrituras del panel** (`guardar_producto`, `activar_producto`,
`borrar_producto`) tienen tres obligaciones que la hoja no tenía:

- **Bajo llave** (`LockService`), soltada también si la escritura revienta.
- **Con número de operación** (`op`, de 8 a 64 caracteres `A-Za-z0-9_-`). Sin
  él no se escribe. La misma operación dos veces contesta lo mismo que la
  primera y no hace nada. La caché puede olvidar antes de seis horas; si
  olvida, lo que impide duplicar es la validación, no la caché.
- **Contra lo que se leyó.** `productos` da una `version` por producto —la
  huella de la fila—; `guardar_producto` al editar y `borrar_producto` la
  exigen, y si la fila cambió entre medias **no se escribe** (`cambiado: true`).
  Es lo que impide que guardar un formulario viejo resucite la unidad que se
  vendió mientras estaba abierto. `activar_producto` no la pide: toca una sola
  celda y el valor final es el pedido.

Y al revés que el catálogo, **escribir falla cerrado**: lo que no valida no
entra en la hoja, y el error lo dice en palabras del comerciante. El código del
producto (`id`) no se cambia editando: lo usan los pedidos, las fotos y los
enlaces compartidos.


**`?a=version`** — `ok`, `version`

**`?a=catalogo`** — `ok`, `productos`, `envios`, `config`, `ilegibles`, `version`, `esquema`, `generado`

**`?a=identidad`** — `ok`, `version`, `scriptId`, `hojaId`, `url`, `hojaOk`, `hoja`, `negocio`, `repositorio`

**`?a=bloques`** — `ok`, `version`, `head`, `valores`, `scriptId`, `negocio`, `hoja`, `hojaId`, `alta`

**`?a=entrar`** — `ok`, `error` · y cuando entra: `ok`, `testigo`, `usuario`, `vence`

**`?a=sesion`** — `ok`, `error` · y con testigo bueno: `ok`, `usuario`, `vence`

**`productos`** — `ok`, `productos`, `categorias`. Cada producto: `id`, `nombre`,
`formato`, `categoria`, `precio`, `stock`, `descripcion`, `imagenes`,
`destacado`, `activo`, `referencia`, `precioAntes`, `umbralBajo`, `variantes`,
`version`, `problemas`. **Las cifras van como texto, tal como están escritas en
la hoja**, y `problemas` nombra las que no se pueden leer: si la hoja dice «doce
mil», el panel enseña «doce mil» marcado, no un 0 que se guardaría sin mirar.
Trae también los desactivados.

**`guardar_producto`** — pide `op`, `producto` y `nuevo: true` para crear, o
`version` para editar. Contesta `ok`, `id`, `version` (la nueva) y `creado` al
crear; o `ok: false`, `error` y, si la fila cambió entre medias, `cambiado`.
Una respuesta repetida trae además `repetida: true`.

**`activar_producto`** — pide `op`, `id`, `activo`. Contesta `ok`, `id`,
`activo`, `version`.

**`borrar_producto`** — pide `op`, `id`, `version`. Contesta `ok`, `id`,
`borrado`.

**`subir_foto`** — pide `op`, `id`, `tipo` (`image/jpeg`, `image/png` o
`image/webp`) y `datos` (la foto en base64, sin el prefijo `data:`). Guarda el
archivo en la carpeta de `fotos_drive` **con el nombre que le toca** —
`<id>-<n>.<ext>`, con el primer número que no esté ni en la celda ni en la
carpeta— y lo agrega a `Imágenes`, las dos cosas bajo la misma llave. Contesta
`ok`, `id`, `nombre`, `imagenes`, `version` (la nueva: la foto cambió la fila).
Si no puede, el error **dice el nombre exacto** con el que subirla a mano al
Drive, que es el camino de siempre y sigue funcionando. La foto sale en la
tienda al publicar, no al subirla.

**`?a=panel`** — `ok`, `version`, `negocio`, `sitio`, `whatsapp`, `correo`, `hoja`, `productos`, `publicados`, `agotados`, `pocos`, `ventasMes`, `ventasMesAnterior`, `pedidosMes`, `ticket`, `tasaCierre`, `lecturasHoy`, `picoHora`, `cuotaCorreo`, `respaldo`, `ventasAyer`, `pedidosAyer`, `porConfirmar`, `atrasados`, `errores`, `meses`, `consultado`, `stub`, `tokenViejo`, `rescates`, `alta`

Y dentro de `?a=catalogo`:

**cada producto** — `id`, `nombre`, `formato`, `categoria`, `precio`, `stock`, `descripcion`, `imagenes`, `destacado`, `activo`, `referencia`, `precioAntes`, `umbralBajo`

**cada envio** — `id`, `nombre`, `valor`

`config` trae las claves de la pestaña `Configuración`, con esos mismos
nombres, **menos las que empiezan por `pago_`**, que no salen nunca — ni por
esta puerta ni al hornear `catalogo.json`. Ese filtro está aplicado dos veces a
propósito y **no tiene excepciones**.

Más una clave que no viene de la hoja con ese nombre:

**`tope_pago`** — el tope por transferencia, ya leído como número, que en la
hoja se llama `pago_tope`. Sale con otro nombre justamente para no abrirle un
hueco al filtro: el tope no es una credencial —son 1.000 UVB, una cifra
pública— y el carrito lo necesita para bloquear a tiempo. Por `?a=catalogo`
llega como número y en `catalogo.json` como texto, porque el horneado pasa toda
la configuración por `String()`: **quien lo lea tiene que convertirlo.**

> **Un campo publicado que nadie consume es una promesa a medias.** `?a=validar`
> devuelve `envioNombre` —el nombre del envío **según la hoja**— y
> `publicar/index.html` no lo lee: escribe el nombre que ella tenía y el valor
> que trajo el sello. Cuando la hoja no reconoce el envío contesta `valor: 0` y
> `nombre: 'Por confirmar'` a propósito, y ese aviso se pierde. Sale como **S1-8**.
> Vale como regla: al agregar un campo, decir **quién lo lee**; si nadie, no se
> agrega.

---

## 7. Cómo se hace cumplir

No a mano. `pruebas/esquema.js` **lee el esquema vivo** —corriendo `instalar()`
en el emulador, que es el mismo código que corre en la hoja de verdad— y lo
compara contra la foto congelada en `pruebas/esquema.json`.

- Agregar al final: pasa, y la batería **anuncia** qué se agregó.
- Renombrar, mover o quitar: **falla**, con el antes y el después.
- Una pestaña que desaparece: falla.
- Y comprueba que **este documento** nombre las nueve pestañas, todas sus
  columnas y todas las claves. Si el código cambia y el documento no, no pasa.

Cuando un cambio de esquema es deliberado y cumple las reglas:

```bash
cd pruebas
node esquema.js --congelar
```

Reescribe la foto. **Es un acto deliberado**, y aparece en el diff del commit,
que es exactamente donde alguien tiene que verlo. Un esquema que se actualiza
solo no es un contrato.

---

## 8. La versión del esquema

Cada puerta publica ahora tres cosas más:

| Campo | Qué es |
|---|---|
| `version` | la versión del **código** del maestro |
| `esquema` | la versión de la **forma de los datos** |
| `generado` | cuándo se armó esa respuesta, en ISO |

**`version` y `esquema` se separan porque cambian por razones distintas y a
ritmos distintos.** Se puede publicar un maestro nuevo diez veces sin mover una
columna, y ese es el caso normal. `esquema` sube **solo** cuando cambia lo que
las puertas publican, y siempre agregando al final.

**La vitrina compara.** Si el `esquema` que llega es mayor que el que conoce, no
entiende lo que le están dando: **conserva lo último bueno y lo dice por
consola**, en vez de pintar una tienda a medias. Es el mismo principio de
siempre —preferir lo viejo que funciona a lo nuevo que no se entiende— pero
gritando, que es la parte que suele faltar.

`generado` contesta una pregunta que hasta hoy no se podía contestar: si lo que
estoy viendo es de hace un minuto o de hace una semana.

**Esquema actual: 1.**

---

## 9. Lo que la puerta pública NO publica

`?a=catalogo` **no pide token**, y no puede pedirlo: la abre cualquier comprador
al entrar a la tienda. Todo lo que salga por ahí es público, así que hay que
decidir a propósito qué sale.

**Las claves `pago_*` no salen.** Una llave Bre-B en un archivo estático es una
invitación a copiarla en una tienda falsa con el mismo aspecto. El comprador la
recibe por la respuesta automática de WhatsApp, después de que el comercio
confirma, que es donde hay una persona detrás. Es la misma razón por la que esa
llave nunca estuvo en el repositorio.

El filtro es **por prefijo, no por lista**: una clave `pago_algo` que alguien
agregue mañana queda protegida sin que nadie tenga que acordarse de volver aquí.

---

## 10. Lo que todavía no está

- Que la vitrina marque las tarjetas cuyo precio no es el del sello (**S1-9**).
- El diagnóstico a nueve puntos, con fila y columna exactas para cada dato
  ilegible. La mitad ya está hecha: los avisos **ya** nombran la celda
  (`Catálogo E2`, `Envíos C3`); falta juntarlos en una sola pantalla (Sprint 5).
- Los datos de pago llegando al comprador por la respuesta automática, y el tope
  de Bre-B comprobándose contra `pago_tope` (Sprint 6).
