# Hoja de ruta — la semilla de tienda

_Repositorio `laboratoriodigital/tienda`. Empezada el 18 de septiembre de 2026._

Qué se construye y en qué orden. **El plan detallado del MVP —con sus historias
y criterios— vive en `PLAN-MVP.md`**; aquí está el mapa completo, para que se
vea qué queda fuera del MVP y cuándo entra.

Este proyecto nace de la semilla de la línea anterior (`laboratoriodigital/organico`,
3.0.0, tres tiendas en producción) y **se lleva el código, no el comercio**: ni
un nombre, ni un producto, ni un lugar de aquel comercio queda aquí. Todo sale
de la hoja de configuración de cada tienda.

**Estados:** `[MVP]` va en la 1.0.0 · `[1.1]` es la entrega siguiente, ya
decidida · `[PENSADO]` está diseñado, sin fecha · `[MEDIDO]` tiene número ·
`[NO]` está descartado con su razón.

**El producto se llama «tienda».** Este repositorio es la semilla de su segunda
versión: empieza en `0.1.0` y el MVP sale como `1.0.0`.

---

## Fase 1 · El MVP   ·  1.0.0   ·  `PLAN-MVP.md`

**Cuatro hitos**, decidido el 18 de septiembre de 2026. Los dos primeros no son
negociables; el tercero es lo que hace que el producto se pueda enseñar a
cualquier comercio; el cuarto es la mitad del trabajo.

| | Hito | Qué deja funcionando |
|---|---|---|
| M0 | La semilla limpia y determinista | `plantilla/` aparte de `publicar/`; ni un dato de un comercio ajeno; textos legales desde la hoja y **datos de empresa que bloquean**; horneado reproducible; el producto se llama «tienda» y arranca en 0.1.0 |
| M1 | Rendimiento y cuota | Publicación a demanda, sin el cron de cuatro horas; una sola pregunta al maestro; fotos en paralelo; presupuesto con guardia. **De ~535 a ~100 minutos de Actions al mes por tienda** |
| M2 | La tienda para todo producto | Variantes; SEO horneado con JSON-LD y sitemap; envío gratis anunciado; horario; mínimo de pedido; orden del catálogo |
| M3 | El panel básico del comerciante | Productos, pedidos, configuración y publicar, desde una página web con usuario y clave. La hoja deja de ser la interfaz |
| M3.5 | Cobrar en línea *(entró el 21-sep)* | `cobro_modo` en la hoja: WhatsApp, o la pasarela de Bold con la unidad apartada mientras se paga (decisión 12) |
| M4 | El tablero *(entró el 21-sep)* | La pestaña Tablero del panel: los números de la hoja en gráficas SVG, con su tabla debajo y una petición por visita (decisión 13) |

Lo que **no** entra, y su consecuencia, está escrito en `PLAN-MVP.md` §4.9.


## La entrega 1.1 · lo que sale del MVP y entra justo después

Tres cosas diseñadas y aplazadas el 18 de septiembre. **No se vuelven a
discutir: se construyen en este orden**, y lo que sigue guarda las decisiones
que ya se tomaron, para no volver a tomarlas.

**S1 · El tablero gráfico**   [MVP · M4, hecho el 21 de septiembre de 2026]
*Entró al MVP como M4, y como pestaña del panel en vez de página aparte
(decisión 13). Lo demás, como estaba escrito aquí.*
~~`publicar/tablero.html`~~ la pestaña Tablero de `admin.html`: ventas, ticket, tasa de cierre, embudo, más vendidos y
agotados, en gráficas. **Una sola petición por visita** —ni refresco solo, ni
nada programado—, **SVG escrito a mano sin librerías** —más barato que una
dependencia, cabe en la política de seguridad y carga en un móvil—, y **cada
gráfica con su tabla debajo**, para que se pueda leer sin ver la gráfica. Entra
por el mismo testigo de sesión que el panel.
*Aguanta esperar porque la pestaña Tablero de la hoja ya da los mismos números:
se pierde comodidad, no información.*

**S2 · El rastreo del pedido**   [1.1]
`publicar/pedido.html?n=…`: el comprador consulta estado, fecha y qué pidió, con
el número que ya viaja en su conversación de WhatsApp. **No guarda ni pide un
dato más**: la hoja sigue sin saber quién compró, y así se queda.
**Condición previa, y es una historia aparte: el número de pedido no se puede
poder adivinar.** Si es correlativo o corto, se le añade sufijo aleatorio antes
de abrir la página, y un intento fallido no dice si el número existe.
*Aguanta esperar porque el comerciante sigue contestando a mano, que es trabajo
suyo y no una venta rota.*

**S3 · La flota que se actualiza sola**   [1.1]
Que una tienda ya montada reciba una versión nueva sin manos. La secuencia,
decidida: **sobrescribir** lo de la semilla —nunca fusionar—, **rehornear** desde
su hoja, correr **todas** las baterías, y solo entonces empujar; publicar el
maestro **verificando contra la tienda viva** —qué versión contesta y si abre su
hoja, no el código de respuesta— y **volver atrás solo** si esa comprobación
falla; y repartir **por anillos**, con la tienda de pruebas primero.
Necesita, además, un secreto de organización de solo lectura sobre la semilla
mientras sea privada, y un manifiesto por versión con las huellas de cada
archivo.
*Aguanta esperar porque en esta línea todavía no hay tiendas: una nueva se clona
y nace al día. El día que haya cinco, la cuenta se da la vuelta — y el MVP ya
deja hecha la mitad, con el horneado determinista y `publicar/` como producto.*


## Fase 2 · El panel crece   ·  después del MVP

**2.1 Cupones y zonas de envío en el panel**   [SIGUIENTE]
En el MVP se siguen editando en la hoja porque se tocan una vez al montar. En
cuanto haya un comercio que cambie cupones cada semana, esto sube.

**2.2 Más de una persona administrando**   [PENSADO]
Hoy es un comercio, una clave. Un segundo usuario pide roles, y roles piden un
registro de quién hizo qué — que el MVP ya deja puesto con el registro de
cambios.

**2.3 Recuperar la clave sin el operador**   [PENSADO]
En el MVP la clave se pone desde el menú de la hoja y se rehace por ahí. Un
comercio que pierda la clave y no sepa abrir su hoja necesita otro camino.

**2.4 Fotos: recortar y ordenar desde el panel**   [PENSADO]
Subirla ya está en el MVP. Elegir cuál es la primera, recortarla y reordenar la
galería, no.

**2.5 Vista previa antes de publicar**   [PENSADO]
Ver cómo queda la tienda con los cambios sin publicar. Es lo que hoy da el
despliegue de vista previa a quien sabe mirarlo en GitHub — el comerciante no.

---

## Fase 3 · La flota madura

Lo básico —que una tienda se actualice sola— es **S3**, en la 1.1. Esta fase es
lo que viene después, cuando la flota ya se mueve y empieza a tener casos
particulares.


**3.1 Interruptores por tienda**   [MVP parcial]
`f_*` en la configuración: la semilla sabe hacer algo y cada tienda lo enciende.
El MVP los usa para lo que ya trae (autoría, variantes, rastreo, horario); la
fase 3 es la disciplina alrededor: que cada interruptor se pruebe encendido y
apagado, y que uno encendido en todas durante un año deje de ser interruptor.

**3.2 Ranuras de extensión y desvíos declarados**   [PENSADO · diseño completo guardado]
Para el día en que una tienda necesite código propio. El diseño está: una ranura
con contrato versionado que la semilla nunca toca, y un desvío declarado que
deja de recibir actualizaciones **solo en ese archivo** y lo dice en cada
corrida, con su edad. **No se construye hasta que exista el primer caso real**:
maquinaria sin uso es superficie de fallo.

**3.3 Alta de una tienda desde un formulario**   [APARCADO · escrito, sin usar]
Crear el repositorio, ponerle su nombre, habilitar lo que hay que habilitar y
cargar sus secretos. El flujo existe en este repositorio —`servicio/tienda-nueva.yml`—
y está APARCADO a propósito: nunca se ha corrido de punta a punta, así que el
camino documentado en `DESPLIEGUE.md` es el manual, que sí se ha corrido. Se
retoma cuando montar una tienda a mano cueste más que mantener el flujo.

**3.4 Sembrar los secretos desde el diagnóstico**   [MEDIDO]
La mitad del tiempo de montaje se va copiando secretos de una pantalla a otra, y
cuatro de los cinco los sabe el maestro. Medido en la línea vieja: bajaría un
despliegue de 30 a unos 18 minutos.

**3.5 El stub que no se repega**   [PENSADO · evaluado dos veces]
El código pegado en la hoja que dibuja el menú. Con el panel web, el menú de la
hoja deja de ser el camino principal, así que esto **baja de prioridad solo**.
La evaluación completa —con las dos formas posibles y la medición de diez
minutos que decide cuál— está en `EVALUACION-stub-automatico.md`.

---

## Fase 4 · Vender más

**4.1 «Avísame cuando llegue»**   [PENSADO]
Lo agotado pierde la venta dos veces: hoy, y el día que vuelve y nadie se entera.

**4.2 Reseñas o valoraciones**   [PENSADO]
Sube la conversión y trae moderación, datos de terceros y una política que
escribir. No antes de tener diez comercios pidiéndolo.

**4.3 Stock por variante**   [PENSADO]
El MVP deja el stock en el producto, a propósito. **Disparador para revisarlo:**
el primer comercio que pierda una venta por vender una talla agotada.

**4.4 Columnas del catálogo configurables**   [PENSADO]
De tres a cinco en pantalla ancha. Arrastra el ancho de foto que se pide y la
paginación; está analizado y no es una línea de CSS.

**4.5 Dominio propio**   [PENSADO]
El único costo en efectivo del producto. Un dominio nuestro alcanza para todas
como subdominios.

---

## Fase 5 · Operación

**5.1 Restauración probada**   [SIGUIENTE]
Hay respaldo semanal; no hay restauración. Un respaldo que nunca se restauró es
una copia de seguridad decorativa. Va primero de esta fase.

**5.2 Archivado de las pestañas que solo crecen**   [PENSADO]
`Pedidos` y `Validaciones` topan en 20.000 filas — entre 6.000 y 10.000 pedidos.
No aprieta en la tienda uno; sí en la décima.

**5.3 Renovar la credencial de publicación sin un equipo**   [PENSADO]
Es la única credencial del producto que caduca y que no sale de una pantalla de
Google. Autorizar es un consentimiento humano y eso no se automatiza; lo que se
puede quitar es la máquina.

**5.4 Salida de un cliente**   [PENSADO]
Qué se borra, qué se le entrega y en qué formato, el día que un comercio se va.
Es tan parte del producto como el alta.

**5.5 Simulacro de reversión trimestral**   [PENSADO]
Volver una tienda a la versión anterior, a propósito, con calendario. El camino
existe desde el MVP (M6); lo que falta es haberlo recorrido sin urgencia.

---

## El techo: hasta dónde aguanta este diseño

Números que no son nuestros y conviene tener escritos:

    Apps Script · ejecución                   6 minutos
    Apps Script · disparadores al día         90 minutos
    Apps Script · ejecuciones simultáneas     30 por cuenta
    Apps Script · correos al día              100
    Sheets · celdas                           10 millones
    Pedidos · filas                           20.000 (tope propio)
    Cloudflare · Workers por cuenta           100
    GitHub Actions · repositorios privados    minutos de pago (ver §3 del plan)

Qué significan aquí:

- **Las visitas no cuestan nada.** El catálogo se sirve estático: mil visitantes
  en un minuto son cero ejecuciones de Apps Script. Ese es el número que hay que
  defender cada vez que alguien proponga algo «en vivo».
- **Lo que consume ejecuciones** es comprar, aplicar un cupón, abrir el panel o
  el tablero. Sucesos, no visitas.
- **Lo que consume dinero**, mientras los repositorios sean privados, son los
  minutos de Actions. Por eso la publicación es a demanda y no cada cuatro
  horas.
- **A la tienda 100** hace falta una segunda cuenta de Cloudflare. Está lejos;
  el número conviene tenerlo escrito desde ahora.

Traducción práctica: este diseño aguanta cómodo un comercio con **cientos de
pedidos al mes**. Antes de eso no hay nada que pagar.

---

## Lo que NO se hace todavía, y por qué

**Pasarela de pagos.** No cobran mensualidad pero sí comisión por transacción.
Mientras cobrar por transferencia funcione, es pagar por un motor de pago que no
se usa. El día que perder ventas por «no puedo transferir ahora» cueste más que
la comisión, ahí sí.

**Base de datos o framework.** Cambiarían el costo de $0 a algo, y el
mantenimiento de «editar una hoja» a «desplegar código».

**Analítica de terceros.** La hoja da el ranking, el ticket y la tasa de cierre,
y el tablero los dibuja. Un tercero agregaría el embudo de navegación a cambio
de rastrear a los visitantes y de declararlo en la política de datos.

**App móvil.** La tienda ya abre en un segundo en un navegador.

**Guardar historial de clientes.** Sería útil para la recompra, pero la tienda a
propósito **no guarda nombre, celular ni dirección**: viven solo en la
conversación de WhatsApp. Guardarlos cambia el perfil de riesgo y las
obligaciones de la Ley 1581. El rastreo del pedido (M5) está diseñado justamente
para no necesitarlo. Si algún día se hace, que sea una decisión consciente con
su política actualizada, y no un efecto secundario de otra cosa.
