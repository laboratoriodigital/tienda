# Decisiones de arquitectura

Cada una con lo que casi siempre falta en un documento así: **la condición que
la dispara** y **lo que se pierde al aplicarla**. Una decisión sin condición de
disparo no se puede ejecutar —nadie sabe cuándo— y una sin contrapartida se lee
como si fuera gratis, y entonces se aplica antes de tiempo.

El porqué del diseño de hoy está en `ARQUITECTURA.md`. Esto es lo que va a
cambiar, y cuándo — y lo que ya cambió.

**Cómo se lee.** Cada decisión es historia: cuenta lo que se sabía el día en
que se escribió, y no se reescribe. Lo que sí se mantiene al día es su línea
**Vigencia**, que dice si SIGUE VIGENTE, si la REEMPLAZÓ otra (y cuál), o qué
parte de ella. Una decisión nueva que deja vieja a otra se anota en las dos.

### Vigencia a hoy

Revisada contra el código de la 1.0.0 el 30 de septiembre de 2026.

| # | Decisión | Vigencia |
|---|---|---|
| 01 | Catálogo estático | VIGENTE · ejecutada |
| 02 | Telemetría por empuje | VIGENTE · sin ejecutar (condición no cumplida) |
| 03 | El cascarón en la hoja | VIGENTE; el stub es, con `panel.gs` hacia una Tienda Básica, lo último que manda un token por GET |
| 04 | Pedido no registrado, en el navegador | VIGENTE · ejecutada |
| 05 | Dato, interruptor o ranura | VIGENTE en la regla; el «desvío declarado» lo reemplazó la **19** |
| 06 | Sobrescribir y rehornear | VIGENTE la regla; el mecanismo lo reemplazaron la **19** y la **21** |
| 07 | Sin pull request en las tiendas | VIGENTE · ejecutada en parte; la compuerta es la **26** |
| 08 | Publicar a demanda, red diaria | VIGENTE · ejecutada |
| 09 | Datos de la empresa bloquean | VIGENTE · ejecutada |
| 10 | Se llama «tienda», desde 0.1.0 | VIGENTE · cumplida: la 1.0.0 salió el 30-sep |
| 11 | Stock por variante | VIGENTE · ejecutada |
| 12 | Bold | VIGENTE |
| 13 | Tablero dentro del panel | VIGENTE |
| 14 | Todo en el panel; lo de la plata pide clave | VIGENTE |
| 15 | Rastreo con secreto aparte | VIGENTE |
| 16 | «Avísame» por WhatsApp | VIGENTE |
| 17 | Dominio propio | VIGENTE |
| 18 | Un colaborador | VIGENTE |
| 19 | Tres versiones; líneas separadas | VIGENTE la regla; «una persona fusiona» lo reemplazó la **21**; la migración 3.x vuelve con la **36** |
| 20 | Dos productos | **REVOCADA** el 30-sep-2026 por la **36** |
| 21 | La tienda se actualiza sola | VIGENTE; dos partes reemplazadas por la **26** y la **27** |
| 22 | Fotos: las dos maneras | VIGENTE |
| 23 | Google Analytics y `medir()` | VIGENTE; la **35** suma Meta y fija los eventos |
| 24 | El logo en la barra | VIGENTE |
| 25 | `panel.gs` se publica por flujo | VIGENTE · sin su primera corrida (faltan los secretos) |
| 26 | La compuerta de una tienda es la tienda viva | VIGENTE |
| 27 | Los flujos de una tienda los entrega la flota | VIGENTE |
| 28 | El que mira aplica la hoja sobre lo publicado | VIGENTE |
| 29 | Una tienda puede quedar fuera del reparto | VIGENTE |
| 30 | La semilla también es una tienda | VIGENTE |
| 31 | Una clave nueva de Configuración aparece sola | VIGENTE |
| 32 | Las columnas se leen por su nombre; el orden visible es libre | VIGENTE |
| 33 | El precio por variante va por combinación, vacío = el del producto | VIGENTE |
| 34 | Tres tokens de GitHub: FLOTA, SEMILLA y DISPARO | VIGENTE · `ALTA_TOKEN` borrado de `tiendas` el 29-sep |
| 35 | El píxel de Meta y los eventos propios | VIGENTE · el medidor propio sin construir; riesgo abierto: consentimiento |
| 36 | Un solo producto: la Tienda 2.0 | VIGENTE · desde el 30-sep-2026 |
| 37 | La foto de variante pertenece a su combinación | VIGENTE · desde el 4-oct-2026 |

---

## 01 · El catálogo se sirve en vivo hoy, y estático cuando el tráfico lo pida

**Estado:** EJECUTADA en el Sprint 2 · **Escrita:** 6 de septiembre de 2026 ·
**Revisada:** 8 de septiembre de 2026 · **Actualizada:** 16 de septiembre de
2026

**Vigencia:** VIGENTE, ejecutada. El catálogo se hornea en
`publicar/catalogo.json` y el respaldo dentro del `index.html`.

> **Actualización.** Esta decisión ya se ejecutó: el catálogo se sirve
> **estático** desde Cloudflare, horneado por `montar/catalogo-estatico.mjs` y
> `montar/sembrar-respaldo.mjs`, y se actualiza con **Publicar ahora**, desde
> la hoja o desde el panel (flujo `fotos`) — no en cada visita. *(Corregido el
> 29-sep-2026: aquí decía «o solo cada 4 horas». Desde B-2 —decisión 08— el
> reloj corre una vez al día y solo avisa; no publica.)*
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

**Vigencia:** VIGENTE, sin ejecutar: la condición no se ha cumplido. El panel
sigue consultando (`panel.gs` › `consultar()`, con `fetchAll`) y ninguna tienda
empuja su resumen.

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

**Vigencia:** VIGENTE. El stub se sigue generando en el maestro
(`A1_generarStub`) y pegando a mano. El hueco del token ya se cerró: el stub
lleva su propio token (`tokenMenu()`, propiedad `TOKEN_MENU`), distinto del de
montaje. Automatizar el pegado está evaluado y sin hacer:
`EVALUACION-stub-automatico.md`. *(30-sep-2026, 1.0.0:* el stub es, con
`panel.gs` cuando consulta una Tienda Básica, lo último que manda un token en
la dirección —`?a=menu&…&t=…`, por GET—; cerrarlo exige repegar el stub en
cada hoja. ROADMAP 5.7 y 3.5.)

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

**Vigencia:** VIGENTE, ejecutada. La bandeja está en `plantilla/index.html`
(cada acceso a `localStorage` entre `try/catch`); el panel la cuenta en la
columna **Rescatados**. *(La decisión no lleva fecha en el original.)*

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

**Vigencia:** VIGENTE como regla, construida en parte. Los niveles **dato** e
**interruptor** están en uso (`f_variantes`, `f_rastreo`, `f_avisame`,
`f_autoria`). La **ranura** (`tienda/extension.js`) no se construyó: ninguna
tienda la ha pedido. El **desvío declarado** con `semilla.lock` no existe: lo
REEMPLAZÓ la comparación a tres versiones de la **19** (`montar/semilla.mjs`),
que respeta lo que solo cambió la tienda y dice lo que no toca.

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

**Vigencia:** la regla —sobrescribir y rehornear, nunca fusionar— SIGUE
VIGENTE. El mecanismo lo REEMPLAZARON la **19** y la **21**: no hay
`semilla.lock`; la base de la comparación es la etiqueta de la semilla de la
que salió la tienda, y cuando la tienda y la semilla cambiaron el mismo archivo
no se toca y se dice (no hay «parar y avisar»). Lo hace
`montar/actualizar-semilla.mjs` dentro del `montaje` de la tienda.

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

**Vigencia:** VIGENTE, ejecutada en parte. Las tiendas fusionan solas
(`montaje` › `aprobacion: automatica` de fábrica; `con-pull-request` queda
como opción). Si algo falla después de publicar un maestro traído por la
semilla, el paso «Volver atrás el maestro» publica el de antes. El reparto es
por anillos (`tiendas/flota.json`; ver la **29**). La comprobación antes de
publicar ya no son las baterías completas: es la tienda viva (**26**).
**No existe** todavía la verificación *después* de publicar contra la tienda
en producción (qué versión contesta). Publicar el maestro a mano sigue pidiendo
la casilla y `PUBLICAR`.

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

**Vigencia:** VIGENTE, ejecutada (B-2). `fotos` corre por reloj una vez al día
(`17 6 * * *`, 6:17 UTC), solo mira y avisa; publica cuando alguien lo pide
(«Publicar ahora», desde la hoja o el panel). Los minutos los mide
`montar/tiempos.mjs` contra `presupuesto.json`.

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

**Vigencia:** VIGENTE, ejecutada: `LISTA_DE_ALTA` en `maestro.gs` marca las
cinco claves `empresa_*` (con el par correo/teléfono) como `bloquea: true`.

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

**Vigencia:** VIGENTE, cumplida: la 1.0.0 se cortó el 30 de septiembre de 2026
(`package.json` y `VERSION_TIENDA`). La lista de términos vive en
`terminos-prohibidos.json`. *(Hasta el 29-sep decía: «La semilla va en la
0.22.3; la 1.0.0 no ha salido».)* Desde la **36**, esta línea es la
**Tienda 2.0**.

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

**Vigencia:** VIGENTE, ejecutada: la pestaña `Inventario por variante` existe
(`H_INVENTARIO_VARIANTE` en `maestro.gs`).

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

**Estado:** CERRADA el 21 de septiembre de 2026: **Bold, Botón de pagos**.
Abierta el mismo día con la entrada de M3.5 al MVP.

**Vigencia:** VIGENTE. El adaptador sigue siendo `crearCobro` y
`consultarBold`; el aviso de Bold sigue sin usarse. Cómo funciona hoy:
`PAGOS-BOLD.md`.

### Qué hacía

No se cobraba en línea. El pedido salía por WhatsApp, el comerciante confirmaba
el pago a mano y marcaba el pedido como Pagado, que es lo que descuenta el
inventario. **Sigue siendo el modo de fábrica** (`cobro_modo = WhatsApp`).

### El límite real

No es la comisión. Es **cómo se entera el maestro de que un pago se hizo**. Los
proveedores avisan con un POST firmado —Bold, en la cabecera
`x-bold-signature`—, y el `doPost` de Apps Script **no ve las cabeceras**. Un
aviso que no se puede verificar no puede marcar nada como pagado.

### La decisión

**Bold**, con el Botón de pagos personalizado: la página abre la pasarela de Bold
(la tarjeta y el banco nunca pasan por la tienda), y la confirmación se le
pregunta a su API por la referencia (`GET /v2/payment-voucher/<referencia>`),
que es el criterio que decidía. Dos razones más, por orden: la integración ya
estaba **validada con una compra completa de pruebas** en la línea anterior del
producto, y el dueño la pidió así. PSE, tarjeta y los demás medios los ofrece
Bold en su pasarela.

El aviso (webhook) de Bold **no se usa**. Si algún día hiciera falta, tendría que
pasar por un intermediario que conserve el cuerpo crudo y verifique la firma
antes de reenviarlo; mientras tanto, la consulta y el disparador bastan.

### Condición de disparo

Cumplida: M3.5 entra al MVP. Para cambiar de proveedor: que haya una tienda
cobrando y los números reales (comisión, días hasta el desembolso) digan que
otro sale mejor. El adaptador es uno solo —`crearCobro`, `consultarBold`— y
cambiarlo no toca carrito, pedidos, inventario ni correos.

### Contrapartida

Consultar a Bold cuesta ejecuciones y tarda: justo después de pagar, Bold puede
contestar «no sé nada» durante unos minutos. Por eso el comprador ve «estamos
confirmando» un rato, y el disparador de cada cinco minutos existe **solo
mientras haya cobros abiertos** (§6 del plan). Y cada tienda tiene que cargar sus
cuatro llaves en las propiedades del script: es un paso más de alta, a mano, que
la lista de alta vigila.

---

## 13 · El tablero, dentro del panel y no en una página aparte

**Estado:** CERRADA el 21 de septiembre de 2026, con la entrada de M4 al MVP.

**Vigencia:** VIGENTE.

### Qué hacía

El comerciante leía sus números en la pestaña Tablero de la hoja. El
`ROADMAP.md` tenía diseñado `publicar/tablero.html`: una página propia, que
entraba «por el mismo testigo de sesión que el panel».

### El límite real

El testigo vive en `sessionStorage`, que es **por pestaña del navegador** (así
se cierra la sesión al cerrarla: M3). Una página aparte abierta en otra pestaña
no lo ve y pide la clave otra vez; pasarlo en la dirección es justo lo que M3
prohíbe. Y una página más es un horneado más, una política de seguridad más y
una batería de marca más que mantener.

### La decisión

El tablero es una **pestaña del panel** (`admin.html`), con su propia puerta de
solo lectura (`tablero`). Todo lo demás que se decidió para S1 se cumple igual:
SVG escrito a mano, una petición por visita, la tabla debajo de cada gráfica, y
las cuentas en `calcularMetricas()` y en ningún otro sitio.

### Condición de disparo

Pasarlo a página propia solo si el panel empieza a pesar lo bastante como para
que abrirlo en un celular se note (hoy: 1 petición al entrar, el tablero no se
pide hasta que se abre su pestaña), o si alguien que no administra —un socio—
necesita ver los números sin poder editar: eso es la historia de roles (fase 2.2),
no un problema de página.

### Contrapartida

El tablero no tiene dirección propia: no se puede dejar como marcador ni
mandarle el enlace a alguien. Y el panel crece unas 180 líneas.

---

## 14 · El panel alcanza para todo, y lo que mueve la plata pide la clave

**Estado:** CERRADA el 21 de septiembre de 2026 (0.9.0). Deshace una parte de
D-4.

**Vigencia:** VIGENTE (`claveOtraVez()` en `maestro.gs`).

### Qué hacía

D-4 dejaba fuera del panel las claves «técnicas» —la dirección del sitio, las
carpetas, los datos de pago—: cambiarlas desde un celular podía romper la
tienda sin que el comerciante lo viera.

### El límite real

El dueño pidió que el panel alcance para todo y la hoja quede de respaldo. El
riesgo de las técnicas no desaparece, pero se maneja mejor avisando que
escondiendo. El riesgo que sí es serio es otro: **una sesión robada** que
cambia la cuenta de las transferencias, el WhatsApp de los pedidos o pasa la
pasarela a Producción se lleva las ventas.

### La decisión

Salen todas las claves que se escriben a mano, menos `correo_ultimo` (del
script) y `panel_usuario` (va con la clave). Las técnicas van en la sección
**Avanzado**, con un aviso. Las que deciden a dónde va la plata —`whatsapp`,
`cobro_ambiente`, `pago_llave`, `pago_titular`, `pago_entidad`, `pago_texto`—
**piden la clave del panel otra vez** en cada cambio, con el mismo contador de
intentos que la entrada. Las **llaves de Bold nunca** entran al panel: viven
en las propiedades del script.

### Condición de disparo

Revisar si aparece un segundo usuario (fase 2.2): con roles, lo sensible sería
del dueño y no solo «con clave».

### Contrapartida

Cambiar el WhatsApp o la cuenta pide un paso más. Y alguien puede romper la
tienda desde Avanzado; queda en el Registro y la hoja lo deshace.

---

## 15 · El rastreo: un secreto aparte, no un número más largo

**Estado:** CERRADA el 21 de septiembre de 2026, con M5.

**Vigencia:** VIGENTE.

### Qué hacía

No había rastreo. El `ROADMAP.md` pedía, antes de abrirlo, que el número de
pedido no se pudiera adivinar: «si es correlativo o corto, se le añade sufijo
aleatorio».

### El límite real

El número son cinco caracteres de 32 símbolos: unos 33 millones. No es
correlativo, pero se dicta, se escribe en una guía, sale en una captura. Y
alargarlo para que sea secreto lo vuelve imposible de dictar.

### La decisión

El número se queda como está y el enlace lleva **aparte** un secreto de 16
caracteres (80 bits), de una fuente criptográfica. El secreto nace en el
navegador del comprador —o en el maestro, si lo pide el comerciante— y la hoja
guarda **solo su huella** (SHA-256). La puerta es pública, solo por POST, y
contesta lo mismo ante cualquier fallo. No se guarda nada del comprador.

### Condición de disparo

Revisar si algún día se quieren avisos al comprador (eso sí pediría un dato
suyo, y es otra decisión, con la Ley 1581 delante).

### Contrapartida

El enlace es largo y quien lo tenga ve el pedido (sin datos personales). Si el
comprador lo pierde, el comerciante crea uno nuevo y el viejo deja de servir.

---

## 16 · «Avísame cuando llegue», por WhatsApp y sin guardar a nadie

**Estado:** CERRADA el 21 de septiembre de 2026 (0.11.0).

**Vigencia:** VIGENTE.

### Qué hacía

Lo agotado decía «Agotado» y ya. La venta se perdía dos veces: ese día, y el
día que volvía sin que nadie se enterara.

### El límite real

Avisar solos pide guardar el correo o el celular del comprador, y la tienda a
propósito no guarda datos de compradores (ROADMAP, «Lo que NO se hace
todavía»): cambia el perfil de riesgo y las obligaciones de la Ley 1581.

### La decisión

El botón abre WhatsApp con «avísame cuando vuelva a llegar X» —la conversación
queda en el celular del comerciante, donde ya están sus clientes— y la hoja
cuenta cuántos esperan cada producto, sin nadie dentro (pestaña `Avísame`).
Cuando vuelve a haber, el panel y el correo del día lo dicen, y el comerciante
les escribe y lo marca.

### Condición de disparo

Si un comercio con muchos «avísame» pierde ventas por no escribir a tiempo,
revisar el aviso automático —con su política de datos—.

### Contrapartida

Avisar es trabajo del comerciante, a mano. El conteo se puede inflar pulsando
muchas veces desde navegadores distintos: es una señal, no una lista.

---

## 17 · Dominio propio: un dominio nuestro, una tienda por subdominio

**Estado:** CERRADA el 21 de septiembre de 2026 (0.11.0). Dominio:
`laboratorio-digital.com`; la tienda de pruebas es `tienda.laboratorio-digital.com`.

**Vigencia:** VIGENTE (`dominio` en `tiendas/flota.json`).

### Qué hacía

Cada tienda vivía en `<nombre>.<cuenta>.workers.dev`.

### El límite real

`workers.dev` no se ve como una tienda, no admite las transformaciones de
imagen de Cloudflare, y es la dirección que va en el SEO, en Bold y en los
enlaces de rastreo: cambiarla después es romper enlaces.

### La decisión

Un dominio del producto y un subdominio por tienda, como *custom domain* del
Worker. La dirección sale de `sitio_url` —la misma que ya usan el SEO, Bold y
el rastreo—, y `montar/nombrar-worker.mjs` la escribe en `wrangler.jsonc`. Un
comercio que traiga su propio dominio usa el mismo camino.

### Condición de disparo

La zona tiene que estar en la misma cuenta de Cloudflare. A las 100 tiendas
hace falta otra cuenta (ROADMAP, «El techo»), y con ella otra zona o un
subdominio delegado.

### Contrapartida

Un costo en efectivo al año (el dominio), y un paso de alta más: la zona en
Cloudflare y `sitio_url` bien escrito.

---

## 18 · Una segunda persona: el colaborador, con los permisos en el maestro

**Estado:** CERRADA el 22 de septiembre de 2026 (0.13.0).

**Vigencia:** VIGENTE.

### Qué hacía

Un comercio, un usuario, una clave. Quien ayudaba en la tienda entraba con la
del dueño y veía y podía cambiar todo: la cuenta de la transferencia, el
WhatsApp de los pedidos, el ambiente del cobro.

### El límite real

El dueño pidió una segunda entrada con **menos** permisos: la tienda entera
(productos, pedidos, fotos, envíos, cupones, publicar), y de los ajustes solo
la vitrina y si se cobra por WhatsApp o pasarela. Nada de a dónde llega la
plata, datos legales, correos, ambiente ni lo técnico.

### La decisión

**Un** colaborador, no roles configurables: es lo que se pidió y cabe en una
propiedad. Lo da y lo quita el dueño **desde su panel**, con su clave otra vez
—sin tocar la hoja ni volver a pegar el stub—. La clave la inventa el maestro
y se ve una vez. **Los permisos viven en el maestro**: la lista
`CLAVES_DEL_COLABORADOR` filtra lo que se le enseña y rechaza lo demás al
guardar; la página solo pinta lo que le llega. El testigo del colaborador sale
de su propia huella, así que sus sesiones mueren solas al quitarlo.

### Condición de disparo

Si un comercio pide dos colaboradores, o permisos distintos para cada uno, se
pasa a una pestaña `Personas` con usuario, rol y huella. El testigo ya lleva
el rol: el cambio es de dónde se lee.

### Contrapartida

Una lista más que mantener: una clave nueva de Configuración no le llega al
colaborador hasta que alguien decide agregarla a `CLAVES_DEL_COLABORADOR`.

---

## 19 · La flota se actualiza contra tres versiones, y las líneas no se mezclan

**Estado:** CERRADA el 22 de septiembre de 2026 (S3, versión 1, en `laboratoriodigital/tiendas`).

**Vigencia:** la regla de las tres versiones SIGUE VIGENTE
(`montar/semilla.mjs` en la semilla; la misma tabla en la flota). «Una persona
fusiona y corre el montaje» quedó REEMPLAZADO por la **21** en la línea
`tienda`; la línea `organico` sigue en modo pull request y queda fuera de este
registro. «Pasar de la 3.x a esta es una migración de la hoja, aparte», que la
**20** había descartado, vuelve con la **36** (30-sep-2026): se hace, cliente
por cliente.

### Qué hacía

Actualizar una tienda era copiar a mano archivos de la semilla. Nadie sabía
qué versión tenía cada una sin abrir su repositorio.

### El límite real

La regla decidida —sobrescribir, nunca fusionar— se topó el primer día con
Cinnamon Beauty: había arreglado un archivo de la semilla (los ID repetidos del
SEO) antes que la semilla. Sobrescribir a ciegas era perder ese arreglo sin
que nadie lo viera. Y Orgánico y Cinnamon son de la **primera** línea (3.x):
su hoja no tiene las columnas de esta (Pagos, variantes, inventario).

### La decisión

Cada archivo se compara contra tres versiones —la de la tienda, la nueva y la
de la que salió la tienda—: se sobrescribe lo que la tienda no tocó, se
respeta lo que solo cambió la tienda, y **no se toca** lo que cambiaron las
dos, diciéndolo arriba del pull request. Solo se actualiza a etiquetas de
release. Una persona fusiona y corre el montaje. Cada línea se actualiza desde
**su** semilla; pasar de la 3.x a esta es una migración de la hoja, aparte.

### Condición de disparo

Con cinco tiendas por línea, el montaje tras fusionar pasa a dispararse desde
la flota, con vuelta atrás sola si la tienda viva no contesta la versión.

### Contrapartida

Un secreto más (`FLOTA_TOKEN`), con permiso de escribir en todas las tiendas:
vive solo en `tiendas`, de grano fino y con vencimiento.

---

## 20 · Dos productos, dos líneas que no se mezclan

**Estado:** CERRADA el 22 de septiembre de 2026 (0.14.0). Reemplaza el
«migrar las tiendas 3.x» de la decisión 19. **REVOCADA el 30 de septiembre de
2026 por la 36.**

**Vigencia:** REVOCADA por la **36** (30-sep-2026). Dos productos costaban
doble —dos semillas, dos flotas, cada arreglo dos veces— y el dueño decidió
gestionar uno solo: la Tienda 2.0. Orgánico ya no es un producto que se vende;
solo recibe correcciones hasta que sus clientes se migren. *(Antes decía:
VIGENTE. Lo de «`tienda` todavía no tiene hijas» era cierto ese día; hoy tiene
a `prueba1` en `tiendas/flota.json`.)*

### Qué hacía

Se trataba la línea 3.x (`organico`) como una versión vieja de esta, y a
Orgánico y Cinnamon Beauty como tiendas por migrar.

### El límite real

Su hoja es otra (Pagos, variantes, inventario con otras columnas): migrarlas
era trabajo sin cliente que lo pidiera. Y las dos cosas se venden distinto.

### La decisión

Dos productos. **Tienda Básica** (`laboratoriodigital/organico`): solo la hoja
de cálculo, sin panel web; las mismas funciones de venta, más rápida;
gráficas en la hoja, y extras de pago posibles. **Tienda Panel**
(`laboratoriodigital/tienda`, esta): el panel web, más fácil de manejar y más
cara, y más lenta en cada gestión porque todo pasa por Apps Script. Cada una
se actualiza desde su semilla; `tienda` todavía no tiene hijas.

### Condición de disparo

Si un comercio de la Básica pide el panel, se le da de alta una Panel y se
pasa su catálogo a mano (es una hoja nueva, no una migración).

### Contrapartida

Dos semillas que mantener, y los arreglos comunes hay que llevarlos a las dos.

---

## 21 · La tienda se actualiza sola, desde su propio montaje

**Estado:** CERRADA el 22 de septiembre de 2026 (0.14.0). Completa la 19.

**Vigencia:** VIGENTE en lo central: la tienda se actualiza sola con su
`montaje` (entrada `semilla`) y `montar/actualizar-semilla.mjs`. Dos partes
quedaron REEMPLAZADAS:

- «corre TODAS las baterías» → en una tienda la compuerta es la tienda viva
  (**26**, 0.22.0);
- «para traer los flujos, la tienda lleva `SEMILLA_TOKEN`» → los flujos los
  entrega la flota (**27**, 0.22.1). `SEMILLA_TOKEN` sigue sirviendo para leer
  la semilla privada, y la contrapartida de un token que escribe flujos en cada
  tienda ya no se paga.

### Qué hacía

La flota abría un pull request en cada tienda y una persona lo fusionaba y
corría el montaje.

### El límite real

Se pidió todo automático, y que el dueño pueda pedir la actualización desde su
panel o su menú. La flota no tiene los secretos de ninguna tienda (no puede
rehornear), y el `GITHUB_TOKEN` de Actions no puede escribir flujos.

### La decisión

La actualización vive en la tienda: su `montaje` con `semilla: true` trae la
última versión publicada (tres versiones, como la 19), publica el maestro si
cambió, rehornea, corre TODAS las baterías y publica todo junto en main; si
algo falla después de publicar el maestro, lo vuelve a publicar como estaba.
Panel, menú y flota solo lo disparan. Para traer los flujos, la tienda lleva
el secreto `SEMILLA_TOKEN`; sin él se trae todo lo demás y lo dice.

### Condición de disparo

Si una actualización necesita tocar la hoja (`A0_instalar`), el montaje no
puede: queda escrito en ACTUALIZAR-UNA-TIENDA y el panel debería avisarlo.

### Contrapartida

Un token con permiso de escribir flujos en cada tienda Panel, y corridas de
montaje más largas (todas las baterías).

---

## 22 · Fotos: las dos maneras, y la de siempre de fábrica

**Estado:** CERRADA el 22 de septiembre de 2026 (0.16.0).

**Vigencia:** VIGENTE (clave `fotos_cdn`, en Avanzado).

### Qué hacía

El montaje hace tres tamaños WebP de cada foto y el sitio los sirve. Desde la
0.9.0 el panel ofrecía Cloudflare como transformador, apagado mientras la
tienda no tuviera dominio propio.

### El límite real

Con dominio propio, Cloudflare da el tamaño y el formato justos (AVIF donde se
puede), pero cuesta pasadas las 5.000 transformaciones al mes y solo funciona
si la zona lo tiene activado; si no, la página vuelve al original en silencio.

### La decisión

Quedan las dos. De fábrica, la de siempre (sin límites, $0). Cloudflare es una
opción del panel para catálogos grandes o mucho tráfico móvil. Los tres
tamaños se siguen haciendo aunque se elija Cloudflare: son el respaldo. Montaje
y Publicar comprueban que la zona transforma y lo dicen.

### Condición de disparo

Si una tienda pasa de las 5.000 fotos distintas al mes, o si Cloudflare cambia
su cuota gratuita, se revisa cuál es la de fábrica.

### Contrapartida

Con Cloudflare elegido el montaje sigue gastando los minutos de hacer los
tamaños, aunque casi no se usen.

---

## 23 · Medir con Google Analytics, y una sola costura para el medidor propio

**Estado:** CERRADA el 22 de septiembre de 2026 (0.19.0).

**Vigencia:** VIGENTE, ampliada por la **35** (0.25.0): `medir()` ya reparte a
dos destinos —GA4 y el píxel de Meta— con cinco eventos propios, y la condición
de disparo del medidor propio y su diseño viven ahora en la 35. La regla de
fondo no cambió: vacío es lo de fábrica, y sin clave la tienda no carga nada de
fuera.

### Qué se decidió

La tienda mide con **Google Analytics 4** cuando la hoja pone `analytics_id`, y
con nada cuando no. El fragmento oficial se hornea en el `<head>` en el
montaje, junto con los tres hosts que la política de seguridad necesita; sin la
clave, la página no carga nada de Google, no pone cookies y la política ni
siquiera los nombra. Los eventos salen por **una sola función de la página**,
`medir(evento, datos)`.

### Por qué así y no de otra manera

Se consideraron tres caminos. **Tag Manager** (`GTM-…`) deja a cualquiera
inyectar scripts desde otra consola: ni cabe en esta política de seguridad ni
queremos esa puerta. **Un medidor propio desde ya** es lo que de verdad
queremos —los datos serían nuestros y del comercio— pero pide una puerta, un
almacén y un tablero, y eso es una entrega entera, no una característica.
**GA4 horneado** es una clave y quince líneas, el comercio ya sabe leerlo, y no
compromete nada: el día que exista el medidor propio, `medir()` manda a los
dos, o solo al nuestro, según lo que diga la hoja.

### Condición de disparo

Cuando exista el recolector propio (una puerta del maestro o un Worker con
almacenamiento), `medir()` suma una línea y `analytics_id` pasa a ser opcional
de verdad. También se revisa si algún comercio pide Tag Manager por exigencia
de su agencia: la respuesta preparada es que se le da el `G-…` y se le explica
por qué el contenedor no entra.

### Contrapartida

Mientras la medición sea de Google, los datos de comportamiento del comprador
son de Google, y la tienda que mide necesita decirlo en su política de
privacidad. Por eso vacío es el valor de fábrica: una tienda que no mide no
tiene nada que declarar.

---

## 24 · El logo va en la barra, sirve de icono, y el nombre se queda

**Estado:** CERRADA en la 0.21.0 (M7 · bitácora 98), por el dueño del
producto. **Vigencia:** VIGENTE.

### Qué hacía

La clave `logo` solo aceptaba una URL de Cloudinary. El comercio que subía su
logo al Drive —la misma carpeta de sus fotos— no tenía cómo usarlo.

### El límite real

No es dónde está el archivo: es cuántos sitios lo piden. Un logo en la barra,
otro en la portada, otro en el pie y un icono aparte son cuatro cosas que se
quedan viejas por separado, y cada imagen de más es una petición y una página
que se mueve al cargar.

### La decisión

`logo` se nombra como una foto del catálogo —el archivo de la carpeta o una
dirección completa— y lo resuelve `urlFoto()`. Va **solo en la barra**,
reemplazando al signo dibujado (`#marcaSigno`). El nombre del comercio sigue
escrito al lado y el logo lleva `alt` vacío: lo que nombra la tienda para Google
y para un lector de pantalla es texto. El `<h1>` de la portada no cambia. El
**mismo archivo** es el icono de la pestaña si `favicon` está vacío; sin los
dos, un marcador dibujado. Si el archivo no llega, vuelve el signo. Cuenta como
foto usada (el montaje avisa por nombre si falta) y va en el respaldo. Lo
prueba `pruebas/logo.js` (21).

### Condición de disparo

Revisar si un comercio pide el logo en la portada o en el pie.

### Contrapartida

Un logo alargado sirve mal de icono cuadrado: para eso queda la clave
`favicon`, que manda cuando existe. Y el logo no reemplaza al nombre: quien
quiera solo la imagen no puede.

---

## 25 · `panel.gs` se publica con un flujo, y con la misma herramienta que el maestro

**Estado:** CERRADA en la 0.21.1 (3.11b · bitácora 100). **Vigencia:** VIGENTE,
sin estrenar: al 30-sep-2026 el flujo `panel` todavía no ha corrido porque
faltan sus dos secretos en `tiendas` (pendiente del dueño). Desde la 1.0.0
`panel.gs` pregunta por POST, con el token en el cuerpo, a cada tienda de la
2.0 (a una Tienda Básica, por GET, hasta migrarla). Hasta esa primera corrida
la hoja publicada pregunta por GET: el maestro lo atiende y lo anota
(`TOKEN_POR_GET`), y el diagnóstico lo dice.

### Qué hacía

Cada versión, alguien abría `panel.gs`, lo copiaba y lo pegaba en el Apps
Script de la hoja de administración. Era el último copiar y pegar del
despliegue.

### El límite real

No era técnico: es el mismo trabajo que el montaje ya hace con el maestro de
cada tienda —`clasp push` y actualizar la implementación— sobre otro proyecto.
Una copia de la herramienta en `tiendas` sería la misma regla en dos sitios
(patrón 2).

### La decisión

`montar/publicar-maestro.mjs` sube el archivo que le digan (`ARCHIVO`). El
flujo `panel` de `tiendas` clona la semilla en la versión pedida (entrada
`version`; vacío = la última etiqueta) y la llama con `ARCHIVO=panel.gs`. La
única diferencia es la hoja: el maestro lleva `HOJA_ID` horneado; el panel está
pegado a su hoja y la abre con `getActive()`.

### Condición de disparo

Cada versión que cambie `panel.gs`: se corre `panel` a mano. Nada lo dispara
solo.

### Contrapartida

Dos secretos nuevos, solo en `tiendas`: `PANEL_SCRIPT_ID` y `PANEL_CLASPRC`,
que es una credencial de Google de la cuenta dueña de esa hoja. La primera
implementación de la aplicación web se sigue creando a mano, una vez.

---

## 26 · En una tienda, lo que decide si se publica es la tienda viva

**Estado:** CERRADA en la 0.22.0 (C-15 · bitácora 102). **Vigencia:** VIGENTE.
**Reemplaza** el «corre TODAS las baterías» de la **21**, y es la comprobación
previa de la **07**.

### Qué hacía

Al actualizarse, cada tienda corría la suite entera de la semilla —unas 2.480
aserciones escritas con los datos de muestra de la semilla, en el repositorio
de la semilla— contra SUS datos y SU repositorio.

### El límite real

Cada suposición de «ser la semilla» era un bloqueo esperando turno: pasó cinco
veces seguidas (bitácoras 90, 93, 94, 95 y 102). Y no protegía de nada: el
código de una tienda actualizada es el de una etiqueta que `release` no corta
sin la suite completa en verde. Lo que sí se puede romper en una tienda es lo
que se hornea con sus datos.

### La decisión

En una tienda, la compuerta es `pruebas/tienda-viva.js` (12 aserciones): solo
invariantes sobre los archivos reales de `publicar/` —la página sabe a qué
maestro preguntar y espera su misma versión, su política la deja hablar con él,
el catálogo se lee y no repite identificadores, el respaldo es del mismo
catálogo— y un humo con navegador que abre la página y pinta los productos de
esa tienda sin errores. Ni un nombre, ni un color, ni un producto escritos.

La decisión vive en `pruebas/publicacion.sh` (`donde.js` › `esSemilla()`), no
en el flujo: la actualización escribe `pruebas/` **antes** de correr la
compuerta, así que una tienda con el flujo viejo ya usa la nueva en la misma
corrida. En la semilla se sigue corriendo todo. `pruebas/tiendita.js` corre la
misma compuerta con los datos de otro comercio.

### Condición de disparo

Si una tienda publica algo roto que una invariante habría visto, la invariante
se añade a `tienda-viva.js`, no a la suite.

### Contrapartida

La tienda ya no prueba el código, solo lo horneado: confía en que la etiqueta
salió en verde. Una etiqueta cortada a mano, sin `release`, pasaría sin
probarse.

---

## 27 · Los flujos de una tienda los entrega la flota

**Estado:** CERRADA en la 0.22.1 (C-16 · bitácora 103). **Vigencia:** VIGENTE.
**Reemplaza** el «la tienda lleva `SEMILLA_TOKEN` para traer los flujos» de
la **21**.

### Qué hacía

El montaje de la tienda intentaba empujar sus `.github/workflows` con
`SEMILLA_TOKEN` metido en la URL del push.

### El límite real

Eso no funcionó nunca. `actions/checkout` deja en `.git/config` una cabecera
de autorización con el `GITHUB_TOKEN`, y git la manda en cada petición gane
quien gane en la URL. El `GITHUB_TOKEN` no puede escribir flujos, así que un
commit con flujos se rechaza entero, y como el arreglo viajaba justo en esos
flujos, la tienda no podía salir sola de ahí.

### La decisión

Una tienda no publica nunca sus flujos: los saca de su commit
`publicacion.sh` (que llega antes de correr) y el paso «¿Cambió algo?». Los
entrega `tiendas/flota/flujos.mjs` con `FLOTA_TOKEN`, por la API de contenidos
y solo los que cambian. `flota › actualizar` lo hace sola después de cada
tienda que se actualiza bien; `flota › flujos` lo hace a mano, y es también el
rescate de una tienda atascada.

### Condición de disparo

Ninguna pendiente. Se revisa si GitHub cambia lo que el `GITHUB_TOKEN` puede
escribir.

### Contrapartida

Los flujos de una tienda llegan un paso después que el resto de la versión, y
solo si los entrega la flota: una tienda actualizada desde su propio panel o
menú no los recibe hasta la próxima `flota › actualizar` o `flota › flujos`.
`FLOTA_TOKEN` concentra el permiso de escribir flujos en todas.

---

## 28 · El que mira aplica la hoja sobre lo publicado

**Estado:** CERRADA en la 0.22.2 (C-17 · bitácora 104). **Vigencia:** VIGENTE.

### Qué hacía

En `fotos` («Publicar ahora»), el paso que MIRA horneaba la configuración desde
la plantilla y la comparaba con `publicar/index.html`.

### El límite real

Lo publicado lleva además lo que escriben después `sembrar-respaldo` y
`sembrar-seo`. Así que salía distinto **siempre**, el que publica no encontraba
nada que publicar y la corrida moría con «Nada que publicar pese a haber
detectado novedades».

### La decisión

El que mira aplica la hoja **sobre lo publicado** (`baseParaRevisar` en
`montar/preparar-index.mjs`, `--revisar`): si nada cambió sale idéntico, y si
cambió algo sale distinto justo en eso. El que publica sigue partiendo de la
plantilla, que es por donde llega el código nuevo de la semilla. En la misma
versión, `pruebas.yml` también decide con `publicacion.sh`.

### Condición de disparo

Ninguna pendiente.

### Contrapartida

Mirar y publicar parten de bases distintas a propósito. Si una herramienta
nueva escribe en `index.html` después del horneado, hay que comprobar que
aplicar la hoja sobre lo publicado siga saliendo idéntico.

---

## 29 · Una tienda puede quedar fuera del reparto

**Estado:** CERRADA en `tiendas`, sin versión de semilla (bitácora 105).
**Vigencia:** VIGENTE.

### Qué hacía

La flota reparte por anillos y se detiene en la primera tienda que falla.
Desde la 0.21.1 (bitácora 100) una tienda cuyo repositorio da 404 se salta y se
dice.

### El límite real

`prueba-panel`, una tienda de prueba abandonada en la 0.15.0, volvió a
aparecer en GitHub. Su montaje falló y, como debe ser, las siguientes no se
tocaron: `prueba1` se quedó sin versión. La lista no tenía cómo decir «esta
existe y no entra en los repartos».

### La decisión

En `flota.json`, `"anillo": "fuera"` deja la tienda en la lista y en el estado,
y ni `actualizar` ni `flujos` la tocan hasta que se le devuelva un número. Al
detenerse, la flota nombra las que quedaron sin tocar y los dos caminos: «solo
esta tienda» o `"anillo": "fuera"`.

`prueba-panel` quedó primero fuera y después se **sacó de `flota.json`**: no
aportaba nada, y el dueño borra su repositorio.

### Condición de disparo

Una tienda que existe y no debe recibir versiones (abandonada, en pausa, en
pruebas propias).

### Contrapartida

Una tienda fuera se queda atrás sin ruido: el estado la sigue mostrando, pero
nadie la actualiza hasta que alguien le devuelva su anillo.

---

## 30 · La semilla también es una tienda

**Estado:** CERRADA en la 0.22.3 (bitácora 106). **Vigencia:** VIGENTE.

### Qué hacía

A una hija, su actualización le publica el maestro nuevo. La semilla cambia
por push y nadie le publicaba el suyo: su tienda viva se quedaba en el maestro
anterior hasta que «Publicar ahora» chocaba con la guarda de versión.

### El límite real

Publicar un maestro es un camino con su candado —la casilla y `PUBLICAR` en
`montaje`, `clasp`, la implementación que no estrena URL—. Un segundo camino
dentro de `release` sería otra copia de lo mismo (patrón 2).

### La decisión

`release` pregunta al maestro vivo de la semilla
(`montar/preparar-index.mjs --al-dia`, que solo lee y dice `repo`, `viva` y
`desalineado`). Si quedó atrás, **no publica él**: dispara `montaje` con
`maestro=true` y `confirmar=PUBLICAR`, lo mismo que haría una persona. Corre
también cuando no hay versión nueva que cortar, así que volver a correr
`release` pone al día una semilla atrasada. Por eso `release` pide
`actions: write`.

### Condición de disparo

Ninguna pendiente. Si faltan `MAESTRO_URL` y `MAESTRO_TOKEN` en la semilla, o
el maestro no contesta, no se comprueba y el resumen dice qué hacer a mano.

### Contrapartida

`release` puede disparar una publicación del maestro de la semilla sin que
nadie marque la casilla en ese momento: el candado de `PUBLICAR` lo pone el
flujo, no una persona. Vale solo para la semilla y solo cuando su maestro vivo
no es el del commit.

---

## 31 · Una clave nueva de Configuración aparece sola

**Estado:** CERRADA en la 0.23.0 (bitácora 109). **Vigencia:** VIGENTE.

### Qué hacía

El panel solo enseña las claves que ya están en la pestaña Configuración, y
solo `instalar()` agregaba las que faltaban. Cada opción nueva de una versión
—`logo_tamano`, la primera tras decidirlo— pedía correr `A0_instalar` en el
editor de Apps Script de cada tienda, a mano.

### El límite real

Una hoja no se migra: hay N hojas, en N cuentas. Lo único seguro es lo que ya
hace `instalar()` con una hoja vieja —agregar al final, con el valor de
fábrica, sin tocar ninguna que exista (R1)—.

### La decisión

La puerta `configuracion` del panel, al abrir Ajustes, llama a
`agregarClavesQueFaltan` con la semilla de configuración. Si no puede, enseña
las que hay, como antes. La página lee cualquier clave que falte como su valor
de fábrica, así que la tienda funciona igual aunque nadie abra el panel.

### Condición de disparo

Ninguna pendiente.

### Contrapartida

Abrir Ajustes puede escribir en la hoja (filas nuevas al final). Es la misma
escritura que `instalar()`, idempotente, y solo aparece una vez por clave.

---

## 32 · Las columnas se leen por su nombre; el orden visible es libre

**Estado:** CERRADA en la 0.24.0 (bitácora 110). **Vigencia:** VIGENTE.

**Qué hacía.** El maestro leía Catálogo por posición y R1 obligaba a agregar
columnas al final: el orden de la hoja era el de nacimiento, no el lógico.

**Decisión.** Catálogo e Inventario por variante se leen por el nombre de su
encabezado (`mapaDeColumnas`). El código conserva su ENCABEZADO (que sigue
creciendo solo por el final, R1); la hoja va en `ORDEN_VISIBLE_…`. `instalar()` y
`ponerHojaAlDia()` mueven columnas enteras. Si falta un nombre, se lee por
posición y se anota.

**Contrapartida.** Una lectura del encabezado por petición (en caché durante la
ejecución). Renombrar una columna a mano ya no descuadra nada, pero deja esa hoja
en el modo de siempre hasta que se corrija.

---

## 33 · El precio por variante va por combinación

**Estado:** CERRADA en la 0.24.0 (bitácora 110). **Vigencia:** VIGENTE.

**Decisión.** `Inventario por variante › Precio`, por combinación; vacío = el
del producto. No es un «+$» por opción: es el precio final, como lo piensa quien
vende. Independiente del inventario por combinación. Lo decide el maestro al
sellar; la página solo lo muestra. Un precio ilegible veta esa combinación.

**Contrapartida.** Un producto con muchas combinaciones y precios distintos
exige llenar cada fila; «Precio antes» sigue siendo del producto.

---

## 34 · Tres tokens de GitHub: FLOTA, SEMILLA y DISPARO

**Estado:** CERRADA en la 0.24.0 (bitácora 110). **Vigencia:** VIGENTE. Cierra
la causa 3 de la revisión de la bitácora 102. El dueño borró `ALTA_TOKEN` de
`tiendas` el 29 de septiembre de 2026 (bitácora 111) y `FLOTA_TOKEN` ya lleva
*Administration* y *Secrets*. Quedan dos restos: revocar en GitHub el token
viejo —el secreto ya no existe, el token sí— y quitar el respaldo
`ALTA_TOKEN ||` de los flujos de `tiendas` (`alta.yml`). En la semilla ya no
lo lee ningún flujo ni herramienta.

**Decisión.** `ALTA_TOKEN` se funde en `FLOTA_TOKEN` (mismo sitio, mismos
repos; el código acepta los dos mientras exista el viejo). `SEMILLA_TOKEN`
(lectura de la semilla, copiado a cada tienda) y `DISPARO_TOKEN` (solo Actions,
en las propiedades del maestro) quedan aparte: fundirlos daría a cada copia más
alcance del que necesita.

**Contrapartida y riesgo anotado.** `DISPARO_TOKEN` sobre «todos los
repositorios» alcanza también `tiendas`. El proyecto del maestro es de la cuenta
de Laboratorio Digital —el comercio solo edita la hoja—, así que no está a la
vista del comercio; si esa cuenta se compartiera, habría que acotarlo.

---

## 35 · El píxel de Meta, y un contrato de eventos para el medidor propio

**Estado:** CERRADA en la 0.25.0 (bitácora 112). **Vigencia:** VIGENTE, al
30-sep-2026 (1.0.0): el píxel y los cinco eventos están en el código
(`meta_pixel_id`, `medir()`, `medidores()`); el medidor propio sigue sin
construir (ROADMAP 3.13) y el riesgo del consentimiento sigue abierto.

**Qué hace hoy.** La tienda mide con GA4 si la hoja pone `analytics_id`
(decisión 23). Los comercios que anuncian en Facebook e Instagram no podían
medir qué ventas traen sus anuncios ni volver a mostrarle el producto a quien
lo miró: para eso Meta pide su píxel en la página.

**La decisión.** `meta_pixel_id`, con las mismas reglas que GA4: vacío de
fábrica = nada de Meta; un número válido hornea el fragmento oficial en el
`<head>` y abre la CSP **de esa tienda**; lo que no es un número (el código
pegado entero, un token, la cuenta publicitaria `act_…`) no se hornea y el
panel dice por qué. Los dos van en un grupo nuevo del panel y de la hoja:
*Medición y anuncios*.

Y lo que la hace durar: **los eventos son nuestros.** `medir()` recibe cinco
nombres propios (`ver_producto`, `agregar_al_carrito`, `enviar_pedido`,
`pagar_en_linea`, `pago_confirmado`) con datos que nunca son personales
(CONTRATOS §6), y cada destino los traduce **dentro** de `medir()`. Google los
recibe tal cual; Meta, como `ViewContent`, `AddToCart`, `InitiateCheckout`,
`AddPaymentInfo` y `Purchase`. Un pedido por WhatsApp es `InitiateCheckout` y
no `Purchase`: aún no está pagado, y contarlo como compra inflaría lo que Meta
atribuye a los anuncios. `Purchase` es solo el pago que el maestro confirmó.

**La política de datos se escribe sola.** Dice quién mide leyendo lo que de
verdad cargó la página (`medidores()`), no lo que cree la hoja. Sin medidores,
no habla de cookies.

**El medidor propio, cuando llegue** (ROADMAP 3.13), es un destino más en
`medir()` —`navigator.sendBeacon` a nuestra puerta— y hereda los cinco eventos
sin tocar una pantalla. El diseño que se prefiere hoy:

| Pieza | Propuesta | Por qué |
|---|---|---|
| Puerta | `/m` en el **mismo dominio** de la tienda, con `run_worker_first: ["/m"]` en su `wrangler.jsonc` | Mismo origen: la CSP ya lo permite (`'self'`) y los bloqueadores de anuncios no lo tratan como de terceros. Solo esa ruta ejecuta código; el resto sigue siendo recurso estático |
| Almacén | Workers Analytics Engine (un conjunto de datos por cuenta, la tienda como índice) | Hecho para esto; consulta por SQL; en el plan gratis incluye 100.000 puntos al día **para toda la cuenta**, compartidos por todas las tiendas |
| Qué se guarda | Los cinco eventos, el sitio, la ruta, el origen de la visita (solo el dominio del `referrer` y los `utm_*`), celular o computador, y un número de sesión al azar por pestaña | Sin cookies ni identificador que dure más que la pestaña: no hay que pedir permiso para reconocer a nadie |
| Qué NO se guarda | IP, nombre, celular, dirección, correo | Ley 1581: lo que no se guarda no hay que protegerlo |
| Tablero | Un resumen diario que el maestro trae a la hoja (junto a las ventas) y, para Laboratorio Digital, el panel de la flota con todas las tiendas | Las cifras viven donde el comercio ya mira, y la flota puede comparar tiendas |

**Condición de disparo del medidor propio.** Cuando haya un comercio que pida
saber de dónde vienen sus ventas sin depender de Google o Meta, o cuando la
flota pase de ~10 tiendas y el tablero comparado valga el trabajo. Antes de
construirlo: comprobar con una tienda que los 100.000 puntos diarios de la
cuenta alcanzan (≈ 5 eventos por visita → unas 20.000 visitas al día entre
todas).

**Contrapartida.** Con el píxel encendido, Meta ve el comportamiento de los
compradores de ese comercio y pone cookies. Es decisión del comercio, lo dice la
política, y vacío sigue siendo lo de fábrica. **Riesgo abierto:** la tienda no
pide consentimiento antes de cargar GA4 o Meta; si un abogado o la SIC lo
exigen para cookies de publicidad, hace falta un aviso con «Aceptar» que
retrase la carga (`fbq('consent','revoke')` hasta aceptar). No se construye sin
esa confirmación.

---

## 36 · Un solo producto: la Tienda 2.0; Orgánico se migra, y la definitiva empieza de cero

**Estado:** DECIDIDA el 30 de septiembre de 2026 por el dueño, con la 1.0.0.
**Vigencia:** VIGENTE. **Revoca** la **20** y devuelve la migración 3.x que la
**19** dejaba para aparte.

### Qué hace hoy

Hay dos líneas de producto que se administran por separado: `tienda` (la
Tienda Panel, este repositorio, con la semilla y prueba1 en su flota) y
`organico` (la Tienda Básica, 3.x, con Cinnamon Beauty como cliente). Cada una
tiene su semilla, su modo de actualizarse —montaje aquí, pull request allá—,
sus baterías y su documentación, y la flota las reparte por separado.

### La fuerza real

No es técnica: es el costo de mantener. Dos productos cuestan doble —cada
arreglo común se hace dos veces, o se hace en una y se olvida en la otra (el
riesgo *Dos líneas de producto* del `PLAN-MVP.md` §7)— y los recursos son los
de un equipo pequeño. La 20 los separó porque se venden distinto; el dueño
prefiere un solo producto bien cuidado a dos a medias.

### La decisión

- **La Tienda 2.0 —este repositorio— es el caballo de batalla**: el único
  producto que se administra, se vende y recibe funciones nuevas.
- **Orgánico queda como está, solo con correcciones**, hasta que cada cliente
  suyo (hoy Cinnamon Beauty) se migre a la 2.0. No se sincroniza código entre
  las dos líneas ni se construye nada nuevo para la Básica (ROADMAP 3.9 y 3.10
  pasan a NO; 3.8 pasa a SÍ).
- **El producto definitivo y maduro se empieza como proyecto nuevo**, la
  «Tienda 3.0», **desde cero**, con lo aprendido en `docs/TRASLADO-3.0.md` y en
  la bitácora. La 2.0 no se reescribe para convertirse en ella: queda en
  operación, con correcciones y lo que pidan sus clientes. «3.0» es el nombre
  del proyecto futuro; no tiene que ver con las versiones 3.x de Orgánico.

### Condición de disparo

Cada migración va por su cuenta: **cuando el cliente necesite algo que solo
tiene la 2.0** (el panel web, por ejemplo) **o cuando mantener Orgánico cueste
más que migrar** (una corrección que habría que hacer dos veces). Lo observa el
dueño, cliente por cliente; no hay fecha fija.

### Contrapartida

Migrar no es gratis: exige pasar la hoja de cada cliente a la de esta línea
—sus columnas y claves (`CONTRATOS.md`), que no son las mismas— y su dominio,
y darla de alta como una tienda más (`alta` + `conectar`). Y mientras dure la
convivencia, **la flota sigue teniendo dos líneas**: `organico` conserva su
modo pull request en `tiendas/flota.json` y sus correcciones se siguen
haciendo a mano.

---

## 37 · La foto de variante pertenece a su combinación

**Estado:** DECIDIDA e implementada el 4 de octubre de 2026 (1.1.1).
**Vigencia:** VIGENTE. Completa la decisión 11 sobre variantes.

### Qué hace hoy

Las fotos de una opción se reconocían por un fragmento del nombre dentro de la
galería general del producto. El panel pedía elegir una opción y el comprador
dependía de que el archivo siguiera ese patrón.

### El límite real

El nombre del archivo no identifica una combinación completa cuando el
producto tiene varios grupos; además, las fotos propias quedaban mezcladas con
la galería general y el panel no permitía corregir o quitar una asociación.

### La decisión

`Catálogo › Imágenes` guarda solo las fotos generales. Cada fila de
`Inventario por variante` tiene `Imágenes` para las fotos de esa combinación,
separadas por `|`. Vacío hereda las generales. El panel puede subir fotos,
editar la lista o dejarla vacía; cada combinación admite seis. El catálogo y el
respaldo publican la asociación exacta. Al actualizar la hoja, las fotos
antiguas reconocidas por nombre se copian a las filas que coinciden antes de
retirarlas de la galería general.

### Condición de disparo

Una foto distinta para una talla, color u otra combinación se guarda en la fila
exacta. `Revisión de tu tienda` permite comprobar que el catálogo publicado
tenga esos nombres en la carpeta de fotos.

### Contrapartida

Si una misma imagen corresponde a varias combinaciones, se repite su nombre en
cada fila; por eso conviene dejar vacía la lista cuando todas usan las fotos
generales. El límite de seis aplica por combinación.

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
