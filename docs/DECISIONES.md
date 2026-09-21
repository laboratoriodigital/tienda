# Decisiones de arquitectura

Cada una con lo que casi siempre falta en un documento así: **la condición que
la dispara** y **lo que se pierde al aplicarla**. Una decisión sin condición de
disparo no se puede ejecutar —nadie sabe cuándo— y una sin contrapartida se lee
como si fuera gratis, y entonces se aplica antes de tiempo.

El porqué del diseño de hoy está en `ARQUITECTURA.md`. Esto es lo que va a
cambiar, y cuándo.

---

## 01 · El catálogo se sirve en vivo hoy, y estático cuando el tráfico lo pida

**Estado:** EJECUTADA en el Sprint 2 · **Escrita:** 6 de septiembre de 2026 ·
**Revisada:** 8 de septiembre de 2026 · **Actualizada:** 16 de septiembre de
2026

> **Actualización.** Esta decisión ya se ejecutó: el catálogo se sirve
> **estático** desde Cloudflare, horneado por `montar/catalogo-estatico.mjs` y
> `montar/sembrar-respaldo.mjs`, y se actualiza con el botón **Publicar
> ahora** de la hoja o solo cada 4 horas (flujo `fotos`) — no en cada visita.
> Lo que sigue abajo describe el razonamiento que llevó ahí y por qué no hizo
> falta esperar al umbral de tráfico; para el comportamiento de hoy, ver
> `ARQUITECTURA.md` §6 y §10, y `GUIA-COMERCIANTE.md`.

### Qué hace hoy

La página pide el catálogo al maestro en cada visita, y por eso el comerciante
cambia un precio en su hoja y está en la calle a los diez segundos. Si el
maestro no contesta, la página cae al **inventario de respaldo horneado dentro
del `index.html`**: se ve completa, con precios de la última publicación. Degrada,
no se cae.

### El límite real, que no es el que parece

Lo que aprieta en Apps Script **no es una cuota diaria de peticiones**: son
**30 ejecuciones simultáneas por cuenta de Google**, y ese número es idéntico en
la versión de pago. Es un límite de *concurrencia*, no de *volumen*, y la
diferencia cambia qué se optimiza:

| | Cuota diaria | Concurrencia (lo real) |
|---|---|---|
| Mil visitas repartidas en el día | te mata | no es nada |
| Cien visitas en el mismo minuto | no es nada | **es el problema** |

Por eso la métrica que importa es el **pico**, no el total. Una campaña de
WhatsApp a mil personas concentra las visitas en diez minutos: esa es la hora en
que se prueba esto, no un martes cualquiera.

### La decisión

El catálogo **sigue en vivo** mientras el pico esté lejos del techo. Cuando se
acerque, se congela: se publica como archivo estático junto a la página y Apps
Script se queda solo con validar y registrar el pedido, que es una petición por
compra y no una por visita.

### Por qué ya no hay que esperar al disparador

Se escribió con una condición porque congelar el catálogo le quitaba al
comerciante el precio en vivo, y eso no valía la pena hasta acercarse al techo.
**La arquitectura v3 elimina esa contrapartida**: añade **Publicar ahora** en el
menú de la hoja y publicación **al agotarse** un producto, que cubren los dos
momentos en que el desfase importa. Sin la contrapartida, no hay razón para
esperar — y hay una razón para no hacerlo, que es el objetivo de carga en móvil:
**con una llamada de 1 a 3 segundos al catálogo, menos de 1,5 s es imposible.**

El disparador se conserva como umbral de vigilancia: si el pico horario pasara
de **300 lecturas** antes de la migración, deja de ser una mejora y pasa a ser
un incidente.

### Condición de disparo (ya no aplica: se ejecuta en el Sprint 2)

> **Prerrequisito para poder medirlo.** El maestro cuenta lecturas y las
> consolida cada hora (`consolidarLecturas`), pero **solo guarda el total del
> día y el de ayer**. Para que esta condición sea observable hay que guardar
> también el mayor incremento horario del día. Es un campo más en la misma
> propiedad. Sin eso, la condición está escrita y no se puede comprobar.

### Contrapartida

**Se pierde el precio en vivo, que es parte del producto.** Con el catálogo
congelado, cambiar un precio deja de ser escribir en una celda: pasa a necesitar
una publicación. A un tendero eso le importa más que ahorrar un segundo de
carga, así que este cambio **empeora la experiencia del comerciante** para
mejorar la del visitante. No es gratis, y por eso tiene condición.

Mitigación cuando llegue el momento: el flujo de fotos ya sabe bajar, probar y
fusionar solo cada cuatro horas, y el menú de la hoja ya genera el bloque de
inventario. Republicar el catálogo por ese mismo camino deja el retraso en horas,
no en días, y es más ensamblaje que desarrollo.

---

## 02 · La telemetría diaria se empuja; el diagnóstico se sigue consultando

**Estado:** ADOPTADA, con la consulta bajo demanda conservada ·
**Escrita:** 6 de septiembre de 2026 · **Revisada:** 8 de septiembre de 2026

### Qué hace hoy

El panel llama a cada tienda con `UrlFetchApp.fetchAll` y trae su resumen. Para
poder hacerlo, **guarda la URL y el token de todas las tiendas**: es el único
archivo del producto con esa propiedad, y nunca se comparte con un cliente.

### El argumento de cuota no se sostiene, y conviene decirlo

Con 100 tiendas refrescando cada hora son **2.400 llamadas al día contra un tope
de 20.000**. El consumo crece linealmente con el número de tiendas, sí, pero la
constante es tan pequeña que la cuota no se toca hasta miles de tiendas.
Defender el cambio con ese número invita a que alguien haga la cuenta y descarte
la idea entera, cuando la idea es buena por otra razón.

### La razón que sí lo sostiene

**La dirección del secreto.** Con consulta, el panel es un llavero: todas las
llaves de todas las tiendas en un archivo. Con empuje, cada tienda solo conoce
la URL del maestro y **el maestro no guarda credencial de nadie**. El daño de que
se filtre el panel deja de crecer con el número de clientes.

### La decisión

**Las dos, y por función.**

- **Empuje** para el resumen diario: cada tienda manda una vez al día un
  agregado —ventas, pedidos por confirmar, agotados, versión, fecha del último
  respaldo—. Es lo rutinario, y es lo que vacía el llavero.
- **Consulta** para el diagnóstico bajo demanda: «Actualizar todas las tiendas»
  se queda. Es cuando de verdad hace falta el dato de este segundo, y ahí N vale
  1, no 100.

### Condición de disparo

Cuando el panel tenga **más de 10 tiendas**, o antes si alguien que no sea el
dueño necesita abrirlo. Con dos o tres tiendas el llavero cabe en la cabeza; a
partir de diez, deja de caber.

### Contrapartida

Tres cosas, y la primera es la seria:

1. **Invierte quién le escribe a quién.** Hoy nada de afuera escribe en el
   panel. Con empuje, el maestro publica un endpoint que **acepta escrituras**, y
   sin un secreto por tienda cualquiera puede llenar la hoja de filas falsas.
   Es superficie de ataque nueva donde hoy no hay ninguna.
2. **Una tienda caída deja de ser evidente.** Con consulta te enteras al
   instante: así se detectó la tienda que se veía perfecta y no registraba un
   solo pedido. Con empuje, una tienda muerta simplemente deja de escribir, y la
   ausencia se parece demasiado a «el disparador todavía no corrió». Hace falta
   una regla de vejez: sin resumen en 36 horas, se marca caída.
3. **El panel muestra lo de ayer.** Aceptable para el resumen; por eso la
   consulta bajo demanda no se retira.

---

## 03 · El cascarón en la hoja se queda. Está medido, no supuesto

**Estado:** cerrada, con evidencia · **Medida:** 6 de septiembre de 2026

### Qué se quería

Que el comerciante **no pueda leer la lógica de negocio**. Un editor de la hoja
puede abrir Extensiones → Apps Script y ver todo el código adjunto, y el negocio
está en ese código.

La solución ideal sería **cero código en la hoja**: el menú lo pintaría un
disparador instalable creado desde el proyecto independiente del operador, que
corre bajo *su* autorización. El comerciante no vería absolutamente nada.

### Qué se midió

**No funciona, y el motivo importa.** El disparador instalable **sí dibuja** el
menú en la hoja de otra persona. Pero al hacer clic en una opción, la función
falla con `PERMISSION_DENIED`: la invocación ocurre bajo la cuenta del
comerciante dentro de un proyecto que no es suyo.

**La frontera es la PROPIEDAD del proyecto, no la autorización.** Ese es el
hallazgo, y es lo que hace que ninguna variante de la idea funcione.

### La decisión

Se queda el **cascarón**: unas cuarenta líneas dentro de la hoja que solo
dibujan el menú y le preguntan al maestro qué mostrar. Sin precios, sin cupones,
sin inventario, sin ninguna regla. El comerciante ve el cascarón, no el negocio.

### Contrapartida, y lo que hay que cerrar

El cascarón **lleva el token de la tienda escrito en claro**, y el comerciante
lo puede leer en el editor de su hoja. Hoy ese token puede leer la
configuración, listar la carpeta de fotos, bajar archivos de esa carpeta y
sembrar claves de `Configuración` — todo son datos que el comerciante ya posee,
así que la exposición es baja. Pero es el **mismo** token que usan el panel y
los flujos de montaje, y eso sí es un hueco.

**Se cierra separando el token del cascarón**, con alcance únicamente a la
puerta del menú, del token de montaje. Está en el Sprint 5.

### Y una consecuencia operativa que cuesta caro olvidar

El cascarón **hay que regenerarlo y volver a pegarlo** cuando cambia el nombre
del comercio o el menú. No se actualiza solo, porque vive en la hoja del
cliente. Está en `ACTUALIZAR-UNA-TIENDA.md`.

---

## 04 · El pedido que no se registra se guarda en el navegador del comprador

### Qué hace hoy

El número del pedido lo genera la página. El mensaje de WhatsApp sale siempre.
El registro en la hoja es una petición aparte, con dos reintentos.

Si el maestro no contesta y se agotan los reintentos, el comprador se va con su
código y su mensaje, y **en la hoja no hay fila**. El comercio ve el chat y no
ve el pedido: o lo escribe a mano, o se le pierde.

### El límite real, y por qué no se puede resolver en el momento

**Cuando el registro falla, lo que falla es justamente el sitio donde habría que
anotarlo.** No hay servidor propio; el único que podría llevar la cuenta es el
maestro, y el maestro es el que está caído.

Y desde la hoja tampoco se distingue después: un pedido con acta en
`Validaciones` y sin fila en `Pedidos` es tanto un registro que no llegó como un
carrito que se abandonó — y los abandonados son la mayoría.

El único sitio que sabe que el comprador **pulsó enviar** y que el registro
**falló** es su propio navegador.

### La decisión

El pedido que no se pudo registrar se guarda en `localStorage` del comprador y
se reenvía la próxima vez que la tienda se abra y el maestro conteste. El
reenvío lleva los minutos que pasaron; el maestro los cuenta.

**Qué se guarda, y por qué no rompe la regla de no almacenar datos del
comprador.** Exactamente lo que ya viajaba en el registro: código, productos,
envío, cupón, subtotal y ciudad. **No** el nombre, el celular ni la dirección —
esos nunca fueron en el registro, van por WhatsApp—. Y vive en el dispositivo
del propio comprador, para que no se pierda **su** pedido. Caduca a los siete
días y guarda cinco como mucho.

### La condición de disparo, y con qué se observa

El instrumento es el contador de rescates: sale en el Diagnóstico con el peor
tiempo, y en el panel en la columna **Rescatados**.

- **Minutos sueltos** son tropiezos de red. Normales, no se hace nada.
- **Más de una hora**, o varias tiendas a la vez, quiere decir que el maestro
  estuvo caído un buen rato. Ahí la pregunta ya no es el rescate: es por qué se
  cayó.
- **Si los rescates suben de forma sostenida**, el techo de concurrencia de Apps
  Script empieza a estorbar y aplica la decisión 01.

### La contrapartida

**Esto no rescata todos los pedidos perdidos, y no puede.** Si el comprador no
vuelve a abrir la tienda, su pedido no se recupera nunca y no aparece en ningún
contador. Lo que se mide es **el subconjunto recuperable**, y el número real de
pedidos perdidos es mayor que el que sale. Conviene no leerlo como si fuera el
total.

Además: en una ventana de incógnito o con el almacenamiento bloqueado no hay
bandeja, y `localStorage` en esos casos **no devuelve vacío, lanza**. Por eso
cada lectura y cada escritura va entre `try/catch`: una tienda que revienta al
abrirse por querer recordar un pedido de la semana pasada es peor que una
tienda que se olvida.

---

## 05 · La personalización de una tienda es dato, interruptor o ranura — nunca un archivo suyo

**Estado:** PROPUESTA · pendiente de aprobar el plan del MVP · **Escrita:** 18 de
septiembre de 2026

### Qué hace hoy

Nada, porque todavía no ha pasado. Ninguna de las tres tiendas tiene código
propio. La primera vez que un comercio pida algo que las demás no tienen, la
salida natural —tocarle su `index.html` o su `maestro.gs`— deja esa tienda fuera
de toda actualización futura, y nadie se entera hasta la versión siguiente.

### El límite real, que no es el que parece

El límite no es cuánto cuesta escribir la funcionalidad: es **cuántos archivos
distintos acaban existiendo del mismo código**. Dos tiendas con el mismo
`index.html` son un producto; cinco con cinco variantes son cinco productos con
un solo mantenedor, que es el modo en que un proyecto así se muere.

### La decisión

Cuatro niveles, y subir de nivel es un error de diseño, no una necesidad del
cliente: **dato** (una clave de `Configuración`), **interruptor** (`f_*`: la
semilla sabe hacerlo, apagado por defecto), **ranura** (código propio en
`tienda/extension.js` o `.gs`, con contrato versionado), y **desvío declarado**
(anotado en `semilla.lock`, ese archivo deja de actualizarse y se dice en cada
corrida). El mecanismo está en `PLAN-MVP.md` §4.9 y `ROADMAP.md` fase 3.2.

Y una frontera que no se cruza: **el total, el inventario, el sellado del pedido
y el filtro `pago_*` no se extienden.** Son el núcleo de confianza.

### Condición de disparo

Se aplica desde la primera petición de un comercio que no sea un valor. Y se
revisa cuando una tienda pase de **tres archivos desviados** o de **dos versiones
con uno**: eso ya no es una excepción, es un producto distinto, y hay que
decidirlo a la vista.

### Contrapartida

La semilla carga código que algunas tiendas no usan, y cada interruptor hay que
probarlo encendido y apagado — el doble de baterías por funcionalidad opcional.
Se paga para que todas las tiendas corran exactamente el mismo archivo.

---

## 06 · Las versiones se aplican sobrescribiendo y rehorneando, nunca fusionando

**Estado:** PROPUESTA · pendiente de aprobar el plan del MVP · **Escrita:** 18 de
septiembre de 2026

### Qué hace hoy

Poner al día una tienda es copiar archivos a mano. El primer intento de
automatizarlo (2.12.0) se retiró en la 2.13.0, y el primer intento de hacerlo con
git dejó un `rebase` a medias con un conflicto en `publicar/catalogo.json` — **un
archivo generado**, que es el peor sitio posible para un conflicto.

### El límite real

Fusionar exige que dos textos del mismo archivo tengan una historia común. Una
tienda y la semilla no la tienen: tienen una fuente y una receta. Cualquier
mecanismo basado en `merge` acaba pidiéndole a una persona que resuelva a mano un
conflicto dentro de un archivo que una máquina puede regenerar entero.

### La decisión

Un archivo es **fuente de la semilla** o es **producto horneado**, nunca las dos
cosas — de ahí el refactor de `plantilla/` (E3). La fuente se sobrescribe; el
producto se rehornea. La comparación a tres hashes (`semilla.lock`, disco,
versión nueva) tiene exactamente cuatro respuestas, y ninguna es «fusionar»:
sobrescribir, no hacer nada, dejarlo por desvío, o parar y avisar.
Detalle en `PLAN-MVP.md` §4.7.

Su mejor propiedad es la simetría: **volver atrás es el mismo camino con otro
número de versión.**

### Condición de disparo

Con la quinta tienda en operación, según lo ya decidido en 4.18. El diseño se
adelanta porque la 3.1 y la 3.2 lo preparan sin comprometerlo.

### Contrapartida

Se pierde la posibilidad de conservar un cambio local dentro de un archivo de la
semilla: o se sube a la semilla, o se convierte en ranura, o ese archivo deja de
recibir actualizaciones. No hay término medio, y es a propósito: el término medio
es exactamente donde viven los conflictos que nadie resuelve.

---

## 07 · En una tienda no hay pull request: fusiona sola, y se verifica sola

**Estado:** PROPUESTA · pendiente de aprobar el plan del MVP · **Escrita:** 18
de septiembre de 2026 · **Sustituye** la decisión anterior de publicar el
maestro con una persona delante

### Qué hace hoy

`fotos` fusiona solo; `montaje` abre un pull request que alguien aprueba; y
publicar el maestro exige marcar una casilla y escribir `PUBLICAR`, porque
cuando termina el backend nuevo ya está atendiendo pedidos, sin vista previa y
sin vuelta atrás de un clic.

### El límite real

La puerta humana no está donde se decide, está donde se reparte. Con tres
tiendas eso son tres aprobaciones por versión; con veinte, sesenta — y una
persona aprobando sesenta veces lo mismo no está revisando, está firmando. Una
puerta que se cruza sin mirar es peor que no tener puerta, porque da la
sensación de haber mirado.

### La decisión

**El único pull request manual es el de la semilla**, que es donde se decide qué
se construye. En las tiendas todo fusiona solo: catálogo, fotos, `index.html` y
maestro. Lo que sustituye a la persona no es la confianza, son tres
comprobaciones: las baterías corren sobre los archivos ya modificados **antes**
de publicar; después se verifica contra la tienda viva —qué versión contesta y
si abre su hoja—; y si eso falla, **se vuelve atrás solo**. Y el reparto es por
anillos: una versión mala se para en la primera tienda.

### Condición de disparo

**La mitad que entra en el MVP:** publicar lo que el comerciante cambió en su
hoja fusiona solo. Eso ya funciona así y se conserva.

**La mitad que espera a la 1.1:** que la tienda reciba sola una versión nueva de
la semilla —con su verificación y su vuelta atrás— es el punto **S3** del
roadmap. Se aplazó el 18 de septiembre con el resto del alcance: en esta línea
todavía no hay ninguna tienda montada, así que no hay nada que poner al día.
**Se construye cuando haya tiendas vivas que se queden atrás**, y el MVP le deja
hecha la mitad.

Y una condición de reversión, que es la que hace honesta la decisión: **si una
vuelta atrás automática falla alguna vez**, la publicación del maestro regresa a
tener una persona delante hasta saber por qué.

### Contrapartida

Se pierde el par de ojos que miraba el diff antes de que llegara al comercio. A
cambio, el que había no estaba mirando de verdad, y ahora hay tres
comprobaciones que no se cansan.

---

## 08 · Con repositorios privados, el recurso escaso son los minutos

**Estado:** PROPUESTA · pendiente de aprobar el plan del MVP · **Escrita:** 18
de septiembre de 2026

### Qué hace hoy

El flujo de publicación corre **cada cuatro horas** en cada tienda, para cazar
fotos que el comerciante subió al Drive sin avisar. En repositorios públicos eso
es gratis e ilimitado.

### El límite real, que no es el que parece

El límite no es el tiempo de una corrida: es **la suma de los minutos de toda la
cuenta al mes**, que en privado se paga. Medido: el cron de cuatro horas es el
**84 %** del gasto, ~450 de ~535 minutos al mes por tienda. Con eso, la cuarta
tienda no cabe en el plan gratuito — y el producto se vende por tienda.

### La decisión

Publicación **a demanda** —el botón del comerciante, ahora en su panel— y una
**red de seguridad diaria** que solo mira si hay algo sin publicar y avisa. De
~535 a ~100 minutos al mes por tienda: de cuatro tiendas a unas veinte dentro
del mismo plan. Y el flujo mide y publica su gasto en cada corrida, con un
guardia que avisa antes de pasarse.

### Condición de disparo

Inmediata, con el hito M1 del MVP. **Y se revisa el día que la semilla se haga
pública**: si las tiendas siguieran privadas —que es la decisión de hoy—, esto
no cambia; el cron solo volvería a ser gratis si las tiendas lo fueran.

### Contrapartida

Una foto subida al Drive a mano puede tardar hasta un día en salir, en vez de
cuatro horas. Es aceptable **porque el panel del comerciante elimina ese
camino**: la foto se sube desde el panel, y el panel sabe que hay algo sin
publicar. Si el panel se retrasara, esta decisión se retrasa con él.

---

## 09 · Sin los datos básicos de la empresa, la tienda no se publica

**Estado:** DECIDIDA el 18 de septiembre de 2026 · entra con el hito M0

### Qué hace hoy

Cuatro claves bloquean la publicación —el nombre del negocio, el WhatsApp, la
dirección del sitio y la llave de pago—. Las doce restantes **avisan y dejan
seguir**, y entre ellas están los `empresa_*`: razón social, NIT, dirección,
ciudad, correo y teléfono. Así que hoy una tienda puede salir al aire con sus
textos legales sin responsable.

### El límite real, que no es el que parece

No es que quede feo: es que **un texto de tratamiento de datos o de derecho de
retracto sin quién responde no obliga a nadie**. El Estatuto del Consumidor pide
identificar al vendedor en comercio electrónico, y el comerciante está firmando
ante sus compradores un documento que dice cosas que nadie sostiene. Y a
diferencia de una foto que falta, esto **no se nota nunca** hasta que hay una
reclamación.

### La decisión

Suben a bloquear: `empresa_razon`, `empresa_nit`, `empresa_direccion`,
`empresa_ciudad`, y **al menos uno** de `empresa_correo` / `empresa_tel`. Un
valor entre corchetes cuenta como vacío. El mensaje dice qué falta **y por qué
bloquea**, como los cuatro que ya existen.

### Condición de disparo

Inmediata, con M0 — en el mismo cambio que arma los textos legales desde la
hoja. Antes de eso, bloquear no tendría sentido: el texto no usaba esas claves.

### Contrapartida

**No se puede publicar una tienda de demostración con datos inventados**, y
montar una tienda pasa a exigir que el comercio traiga sus papeles el primer
día, no «la semana que viene». Es incómodo a propósito: es la clase de trámite
que, si no bloquea, no se hace nunca. Para enseñar el producto está la tienda de
pruebas del operador, con los datos del operador.

---

## 10 · El producto se llama «tienda», y esta línea empieza en 0.1.0

**Estado:** DECIDIDA el 18 de septiembre de 2026

### Qué hace hoy

El código nombra al primer comercio como si fuera el producto, y el repositorio
arrastra el `3.0.0` de la línea anterior, que sirve a tres tiendas con otro
código.

### El límite real

Un producto que se llama como su primer cliente lo arrastra a todas partes: al
manual, a la factura, a los textos legales y a la conversación de venta con el
segundo cliente. Y dos líneas con la misma numeración hacen que dentro de seis
meses nadie pueda decir qué versión corre dónde.

### La decisión

El producto se llama **tienda**. Este repositorio es **la semilla de su segunda
versión**: empieza en **0.1.0** y el MVP sale como **1.0.0**. `organico` sigue en
3.x, aparte, y **no se sincroniza** con esta línea.

### Condición de disparo

Con M0, historia A-9. Incluye una aserción con la lista de términos del comercio
anterior, para que no vuelvan a entrar por descuido.

### Contrapartida

Se pierde la continuidad de la numeración con la línea que está en producción, y
durante un tiempo habrá que decir «la 3.0.0 de la vieja» y «la 0.x de la nueva».
Es más barato que lo contrario.

---

## 11 · El stock baja a la variante

**Estado:** DECIDIDA el 21 de septiembre de 2026, por el dueño del producto.
**Reemplaza** lo que C-1 dejó decidido —«el stock es del producto»— y se hace
en C-1b.

### Qué hace hoy

Un producto con variantes tiene **un solo número** de existencias. Una camiseta
básica en tres colores y tres tallas son nueve cosas distintas en la bodega y un
número en la hoja. Las dos líneas de un pedido —rosa M y verde S— compiten por
ese número, y marcar el pedido como Pagado lo descuenta entero.

### El límite real

No es la cuenta, es lo que la tienda **promete**. Con el stock en el producto,
vender la última rosa M deja la tienda ofreciendo rosas M que no existen —el
comprador paga, y el comercio le escribe para decirle que no hay—. O al revés:
cuando el número llega a cero, la camiseta entera sale agotada aunque queden
ocho verdes. Las dos cosas son ventas perdidas, y la primera además es un
cliente molesto.

C-1 lo sabía y lo dejó escrito con su disparador: **el primer comercio que
pierda una venta por una talla agotada**. El 21 de septiembre el dueño del
producto lo activó con este mismo ejemplo.

### La decisión

La unidad de inventario pasa a ser **la combinación** (el SKU): producto +
una opción de cada grupo. Vive en una pestaña nueva, `Inventario por variante`,
cuyas filas **genera el maestro** a partir de la celda `Variantes` —el
comerciante solo escribe los números—. `Catálogo › Stock` pasa a ser la suma,
escrita por el maestro. Las fotos también pueden ir por combinación.

Un producto sin filas en la pestaña nueva sigue exactamente como hoy.

### Condición de disparo

Cumplida. Se ejecuta como la historia C-1b, **después de D-2**.

### Contrapartida

Una pestaña más en la hoja, y una más que entender: el comerciante que vende
labiales en tres tonos y no quiere contar cada tono ahora tiene una pestaña
llena de filas que no le importan. Por eso la generación es por producto y la
compatibilidad es total: quien no quiera contar por variante no llena nada, y
su tienda funciona como antes. Y la suma en `Catálogo › Stock` es una segunda
copia del dato —el patrón 2—, aceptada a sabiendas porque la escribe una sola
mano y porque todo lo que ya lee esa columna sigue funcionando sin tocarlo.

---

## 12 · El proveedor de pagos, y el criterio que manda

**Estado:** ABIERTA desde el 21 de septiembre de 2026. La abre la entrada de
M3.5 al MVP. Bloquea E-3; no bloquea E-1.

### Qué hace hoy

No se cobra en línea. El pedido sale por WhatsApp, el comerciante confirma el
pago a mano (transferencia, llave, efectivo) y marca el pedido como Pagado, que
es lo que descuenta el inventario.

### El límite real

No es la comisión, aunque sea lo primero que se compara. Es **cómo se entera el
maestro de que un pago se hizo**. Los proveedores avisan con un POST a una
dirección nuestra y lo firman —muchos en una cabecera HTTP—. El maestro es un
Apps Script: su `doPost` **no ve las cabeceras**, así que no puede comprobar esa
firma, y contesta los POST con una redirección que algunos no siguen. Un aviso
que no se puede verificar no puede marcar nada como pagado: sería la puerta para
que cualquiera «pague» con un POST inventado.

### La decisión

Se elige el proveedor con este criterio por encima de los demás: **que su API
permita consultar una transacción por su referencia**, desde el servidor. Con
eso el aviso es solo un timbre y la confirmación se le pregunta al proveedor
(E-4). Entre los que lo cumplan, se comparan comisión, costo fijo y días hasta
el desembolso, con números de la tienda real y no de la documentación.
Candidatos a evaluar: Wompi, ePayco, Mercado Pago, PayU.

Y el pago es **en la página del proveedor** (redirección): los datos de la
tarjeta nunca pasan por la tienda ni por el maestro.

### Condición de disparo

Antes de empezar E-3. E-1 —apartar la unidad— se construye sin esperar esta
decisión, y va primero a propósito.

### Contrapartida

Consultar al proveedor cuesta ejecuciones de Apps Script, y el presupuesto de
§6 del plan dice «ninguna mientras nadie mire». Por eso el disparador que
pregunta por los pagos pendientes corre **solo mientras haya reservas
pendientes**: con cero, no corre. Y queda descartado de entrada cualquier
proveedor que solo confirme por aviso firmado en cabecera, aunque sea el más
barato.

---

## Cómo se escribe una decisión aquí

Cinco partes, y las dos últimas son las que la hacen ejecutable:

1. **Qué hace hoy** — el punto de partida, sin adornos.
2. **El límite o la fuerza real** — con el número, y nombrando el límite
   correcto. Nombrar el equivocado hace que se optimice lo que no era.
3. **La decisión** — qué se hace.
4. **La condición de disparo** — el número o el evento que la activa, y con qué
   instrumento se observa. Si no se puede medir hoy, decirlo.
5. **La contrapartida** — qué se pierde. Si no hay ninguna, probablemente la
   decisión no se entendió.
