# Traslado a la Tienda 3.0

_Escrito el 30 de septiembre de 2026, al cortar la **1.0.0** de la Tienda 2.0.
Es el punto de partida del proyecto nuevo: se copia a su repositorio como
`docs/ORIGEN.md` y se lee antes de escribir la primera línea._

Este documento se sostiene solo. Quien arranque la 3.0 no necesita haber vivido
la 2.0: aquí está qué es el producto, qué se demostró, qué dolió y por qué,
qué principios salen de eso y qué hay que decidir primero. Cuando hace falta el
detalle, se cita el documento de la 2.0 donde vive (`laboratoriodigital/tienda`,
carpeta `docs/`).

---

## 0 · Los nombres, para no confundirse

| Nombre | Qué es | Estado al 30-sep-2026 |
|---|---|---|
| **Tienda 2.0** | Repositorio `laboratoriodigital/tienda`, producto «Tienda Panel». Versiones `0.1.0` → **`1.0.0`** | En operación. Es el caballo de batalla y el **único producto que se vende y se gestiona** (decisión 36). Recibe correcciones y lo que pidan los clientes |
| **Orgánico** | Repositorio `laboratoriodigital/organico`, producto «Tienda Básica». Versiones **3.x** | Solo correcciones. Sus clientes (hoy Cinnamon Beauty) se migran a la 2.0 cliente por cliente |
| **Tienda 3.0** | El proyecto nuevo, desde cero: el producto definitivo y maduro | Por empezar, con este documento |
| **Laboratorio Digital (LD)** | Quien opera todo: la cuenta de Google del maestro, GitHub, Cloudflare | — |

«3.0» es el nombre del proyecto, **no** una versión de Orgánico. En el repositorio
nuevo conviene empezar las versiones en `0.1.0` otra vez y reservar la `1.0.0` para
su MVP, como hizo la 2.0 (decisión 10).

---

## 1 · El producto

**Para quién.** Comercios pequeños de Colombia —una panadería, una tienda de
belleza, un productor— que venden por WhatsApp y no tienen ni quieren un equipo
técnico. Hoy administran en una hoja de cálculo o en su cabeza.

**Qué les da.** Una tienda en su propio dominio (o un subdominio nuestro) que abre
en un segundo en el celular; un catálogo con variantes, precio y stock por
combinación, fotos y ofertas; pedidos que llegan por WhatsApp con un número, o
cobro en línea con Bold; un panel web con usuario y clave para productos,
pedidos, ajustes, cupones, envíos, tablero de ventas y un colaborador; un enlace
para que el comprador siga su pedido; textos legales colombianos (Ley 1581 y
Ley 1480) generados con sus datos; medición opcional (GA4 y píxel de Meta).

**La promesa que no se negocia.** Costo de infraestructura **$0** por tienda
—lo que se paga es tiempo nuestro—, una visita a la tienda **no cuesta ninguna
ejecución** de backend, y el comerciante nunca tiene que abrir GitHub.

**El modelo de negocio.** Laboratorio Digital monta y opera las tiendas como
servicio (alta, actualizaciones, respaldo) y cobra una mensualidad. Por eso la
automatización del despliegue —la «flota»— es parte del producto y podría ser
un producto en sí.

---

## 2 · Cómo está hecha la 2.0, en una página

```
 Comprador ──► Cloudflare (Worker solo de recursos estáticos)  ◄── push a main
                publicar/: index.html + catalogo.json horneados     │
                    │ validar / registrar / cobrar (POST)            │
                    ▼                                                │
 Comerciante ─► maestro.gs (Apps Script, web app /exec)        repo PRIVADO de la tienda
   panel web    + su Hoja de Google (la base de datos)         flujos: montaje · fotos · pruebas · restaurar
   (admin.html)   propiedades del script = los secretos         └─ copia de la semilla (semilla.json › propios)
                    │ dispara montaje/fotos (DISPARO_TOKEN)
                    ▼
 laboratoriodigital/tiendas (servicio): alta · conectar · flota{estado,actualizar,flujos} · panel
 laboratoriodigital/tienda (semilla): el código y sus etiquetas vX.Y.Z (release)
```

- **Una tienda = una hoja + un proyecto de Apps Script + un repositorio + un
  Worker.** La hoja es la base de datos; `maestro.gs` es el backend (puertas
  declaradas en `PUERTAS`, cada una con su guardia: pública, montaje, menú,
  panel); la página es estática y se **hornea** en el montaje con el catálogo
  dentro.
- **La semilla** es el código. Cada tienda tiene una copia de lo que es de la
  semilla y se actualiza sola (`montaje › semilla`) a la etiqueta que le toca;
  la **flota** (repo `tiendas`) reparte por **anillos** y entrega los flujos.
- **La compuerta de publicación** de una tienda es pequeña y solo con
  invariantes (`tienda-viva.js`): ni un dato del comercio escrito en ella.
- **~2.600 aserciones en ~65 baterías**, con un emulador de Apps Script
  (`pruebas/gas.js`) y navegador real (Playwright).
- Detalle: `ARQUITECTURA.md` (§0 el mapa, §20 los modos de fallo),
  `CONTRATOS.md` (datos y puertas), `DESPLIEGUE.md` (de cero a una tienda).

---

## 3 · Lo que se demostró y se conserva

Cada punto está probado en producción o en baterías; en la 3.0 se parte de aquí.

1. **El catálogo horneado.** La tienda lleva su catálogo dentro
   (`catalogo.json` + un respaldo en el HTML) y le pregunta al backend solo lo que
   cambia al comprar (validar precio y stock, registrar, cobrar). Las visitas
   cuestan cero. (Decisión 01; bitácora 4.20.)
2. **El horneado determinista.** Mismo dato → mismo archivo, byte a byte. Sin eso,
   «cambió algo» y «pasó el reloj» no se distinguen, y cada corrida publica.
3. **Contratos que solo crecen (R1).** Columnas, claves, eventos y puertas se
   agregan al final; nada se renombra ni cambia de significado. Desde la 0.24.0
   la hoja se lee **por nombre de columna** (`mapaDeColumnas`) y el orden visible
   es libre. En la 3.0: esquema con versión y migraciones explícitas desde el día uno.
4. **La personalización es dato, interruptor o ranura; nunca un archivo del
   comercio** (decisión 05). Todo lo de un comercio sale de su Configuración.
5. **Sin los datos de la empresa no se publica** (decisión 09): los textos legales
   se generan con ellos, y un corchete en una página pública es peor que no publicar.
6. **El panel alcanza para todo** (decisiones 14 y 18), y lo que mueve la plata
   —WhatsApp, datos de pago, ambiente del cobro— pide la clave otra vez.
7. **Cobro con Bold, con la unidad apartada antes de pagar** (decisión 12,
   `PAGOS-BOLD.md`). El aviso de pago no se cree: se consulta a Bold por la
   referencia. El pago confirmado es lo único que cuenta como compra.
8. **El rastreo con un secreto aparte** (decisión 15): el número de pedido no basta
   para ver un pedido.
9. **Medición con un contrato de eventos propio** (decisión 35, `CONTRATOS.md` §6):
   cinco eventos sin datos personales, una sola función `medir()` que traduce a
   cada destino. En Meta, un pedido por WhatsApp es `InitiateCheckout`, no
   `Purchase`. La política de datos dice quién mide leyendo lo que de verdad se cargó.
10. **La compuerta pequeña** (decisión 26): lo que decide si una tienda publica son
    invariantes sobre SUS archivos, no la suite de desarrollo.
11. **Volver atrás en tres capas** (datos, sitio, versión) con un botón cada una, y
    **probado**: una restauración sin simulacro es una copia decorativa.
12. **Fotos en tres capas** (Drive del comercio → derivadas webp → página), con
    rescate al original si una derivada falta, y el carril en la tarjeta que solo
    descarga la primera foto (1.0.0).
13. **Ningún secreto en el repositorio ni en la hoja**: los tokens viven en las
    propiedades del script; la clave del panel como huella con sal; testigo de
    sesión firmado de ocho horas; límite de intentos; todo lo que lleva una
    credencial va en el cuerpo de un POST.

---

## 4 · Lo que dolió, y la causa de fondo

La bitácora de la 2.0 tiene 113 entradas. Mirándolas juntas, casi todo el costo
vino de **siete causas**. La 3.0 se diseña para que no existan.

| # | Causa | Cómo se vio | Lo que pide la 3.0 |
|---|---|---|---|
| 1 | **Un código por tienda, desplegado N veces.** Cada tienda tiene su Apps Script, su repositorio, sus secretos, su `CLASPRC` y su stub pegado a mano | Actualizar es N publicaciones que pueden fallar distinto; credenciales que envejecen por tienda; el stub que no se puede actualizar solo (decisión 03); minutos de Actions por repositorio privado (decisión 08) | **Un solo despliegue multi-comercio.** Las tiendas son filas, no repositorios. Una versión se publica una vez |
| 2 | **El que se actualiza a sí mismo corre su versión vieja** (P10) | Arreglos que llegaban una versión tarde; y en la 1.0.0, volver atrás corre las herramientas viejas contra el backend nuevo (bitácora 113) | Que ninguna pieza se actualice a sí misma: el despliegue lo hace un sistema aparte, con la versión nueva |
| 3 | **La suite de la semilla como guardia de producción** (bitácora 102) | Cada suposición de «ser la semilla» bloqueaba a una tienda de verdad | Compuerta de producción = invariantes sobre lo desplegado, separada de la suite de desarrollo |
| 4 | **Cuatro permisos que se pisan** (P12) | Tokens con alcances cruzados, copias por tienda, un push que nunca usó el token que se creía (bitácora 103) | Un inventario de credenciales con alcance mínimo, una comprobación de alcance al principio de cada proceso, y ninguna copia por tienda |
| 5 | **Fallar rápido en producción esconde el fallo siguiente** (causa 4) | Una vuelta entera por cada fallo | Cada comprobación previa corre aunque falle la anterior, y el informe dice todo de una vez |
| 6 | **Google Sheets como base de datos** | Lectura por posición (bitácora 110), validaciones que rechazan al script (111), 20.000 filas de tope, 30 ejecuciones simultáneas por cuenta, 6 minutos por ejecución | Una base de datos de verdad para el sistema; la hoja, si se conserva, como vista o importación, no como fuente |
| 7 | **El instrumento mentía** (P17) | El emulador aceptaba lo que Google rechaza; pruebas que solo veían la primera tienda (P4) | Probar contra el servicio real o un doble que implemente de verdad la propiedad de la que se depende; siempre con un segundo comercio de otros datos |

Y lo que no es causa pero cuesta igual: **Windows** en la máquina del operador
(P3), el **reloj** como entrada que nadie declara (P8), las **cachés** que
convierten un chequeo en un recuerdo (P7), y los **fallos silenciosos** del
shell y del lenguaje (`$var` de otro paso, `|| 0`, P14).

---

## 5 · Los principios de la 3.0

Salen de los patrones P1–P21 de la bitácora («Lo aprendido»). Se escriben como
reglas de diseño, no como recuerdos.

1. **Lo que cae a un respaldo, grita** (P1). Un valor de fábrica que funciona es
   el peor valor posible (el celular de fábrica mandaba pedidos a otro).
2. **Una sola fuente; lo demás se deriva** (P2). Si hay dos copias, una aserción
   las ata.
3. **Se prueba con un comercio de prueba y con OTRO** (P4), y ninguna prueba
   nombra a un comercio real.
4. **Todo cambio de comportamiento tiene su control negativo visto en rojo** (P5).
5. **Se reproduce antes de diagnosticar** (P9).
6. **Nada se actualiza a sí mismo** (P10); lo que decide publicar no depende de
   ser la semilla (P11).
7. **El permiso que se comprueba es el que se usa**; ninguno opcional en el camino
   crítico (P12).
8. **Un secreto no viaja por donde queda escrito** (P13): ni en una URL, ni en un
   log, ni en un resumen de Actions, ni en la hoja.
9. **Un aviso llega a donde alguien mira y nombra la causa** (P15).
10. **Un flujo que nunca corrió de verdad no está probado** (P16).
11. **El doble de prueba implementa de verdad lo que el código promete** (P17).
12. **Un documento se ata a su código con una aserción** (P18); el redundante se
    borra.
13. **Un rojo que no significa nada se arregla o se quita** (P19).
14. **Se prueba desde quien mira**: el comprador, el comerciante, el rastreador (P20).
15. **Nunca borrar antes de escribir datos de un comercio** (P21).
16. **Las credenciales van en el cuerpo, y el servidor que las recibe por un camino
    viejo lo anota en vez de romper volver atrás** (bitácora 113).
17. **El costo por visita es cero**, y cada propuesta «en vivo» se mide contra eso.

---

## 6 · Lo que hay que decidir primero

Estas decisiones cambian todo lo demás. Van con opciones y con lo que la 2.0
enseña de cada una; **las toma el dueño** antes del primer hito.

**D1 · ¿Dónde viven los datos?**
- *A. Seguir con una hoja por comercio.* Pro: el comercio la entiende y es suya;
  $0. Contra: causa 6 entera, y el backend sigue siendo Apps Script por cuenta.
- *B. Una base multi-comercio en Cloudflare (D1 + Workers), con la hoja como
  exportación o importación.* Pro: un despliegue, transacciones, sin topes de
  Google; mismo proveedor que el sitio. Contra: hay que construir el panel para
  todo (la 2.0 ya lo tiene) y definir cómo se lleva el comercio sus datos.
- *C. Mixto:* base propia para pedidos, stock y sesiones; hoja para el catálogo.
  Contra: dos fuentes (P2).
- Lo que dice la 2.0: el panel ya reemplazó a la hoja como interfaz (M3); lo que la
  hoja sigue dando es propiedad y confianza del comercio.

**D2 · ¿Un despliegue o uno por comercio?** Con B, uno: las tiendas son datos y un
dominio apunta a su comercio. Con A, se repite la flota de la 2.0. La promesa de
$0 hay que re-medirla con los topes del plan gratis de Cloudflare (peticiones de
Workers por día, filas de D1) contra el número de tiendas esperado.

**D3 · ¿Repositorios privados o públicos?** Con repositorios privados, los minutos
de Actions son el recurso escaso (decisión 08). Con un solo despliegue deja de
importar casi del todo.

**D4 · El medidor propio desde el día uno** (diseño en la decisión 35: puerta en el
mismo dominio, Analytics Engine, sin cookies ni IP). Y **el consentimiento de
cookies** antes de GA4 o Meta: confirmarlo con un abogado para Colombia.

**D5 · Qué se le promete al comerciante sobre las actualizaciones** (abierta en la
2.0 desde el 18-sep): si una versión nuestra tumba su tienda, es nuestra.
Escribirlo antes de vender.

**D6 · El precio**: mensualidad, quitar la autoría (`f_autoria`), funcionalidades a
medida. Abierto en la 2.0.

---

## 7 · Los contratos que se heredan

Aunque la tecnología cambie, estos son los datos que el negocio ya conoce. La
fuente es `CONTRATOS.md` de la 2.0; aquí lo esencial.

- **Producto**: ID, Nombre, Categoría, Formato, Precio, Precio antes, Stock, Umbral
  bajo, Variantes (hasta 3 grupos, 20 opciones, 100 combinaciones), Imágenes
  (hasta 6 generales), Descripción, Destacado, Activo, Referencia.
- **Combinación** (inventario por variante): ID producto, Combinación, Precio (vacío
  = el del producto; ilegible = no se vende), Stock, Código, Nota e Imágenes
  (hasta 6; vacío hereda las generales).
- **Estados de un pedido**: Nuevo · Pendiente de pago · Pagado · Despachado ·
  Entregado · Cancelado. Solo Pagado descuenta; Despachado y Entregado lo mantienen;
  Cancelado lo devuelve.
- **Configuración**: ~56 claves en grupos (Tu tienda, La venta, El cobro, La portada,
  Los textos, Los colores, Google y WhatsApp, Medición y anuncios, Datos legales,
  El correo del día, Avanzado). Vacío siempre es un valor válido.
- **Eventos de medición**: `ver_producto`, `agregar_al_carrito`, `enviar_pedido`,
  `pagar_en_linea`, `pago_confirmado`, con `item_id`, `quantity`, `value`,
  `currency`, `transaction_id`. Nunca datos personales.
- **Lo que la puerta pública nunca publica** (`CONTRATOS.md` §9): datos de
  compradores, datos de entrega, tokens, la hoja.

Una migración de la 2.0 (y de Orgánico) a la 3.0 se apoya en estos nombres: por
eso la 2.0 lee por nombre de columna desde la 0.24.0.

---

## 8 · Cómo se trabaja (lo que funcionó en el método)

- **Definición de terminado**: aserciones nuevas en verde con las anteriores;
  probado en la tienda de pruebas antes que en ninguna otra; el documento en el
  mismo commit; la guía del comerciante al día; la versión anterior de un contrato
  sigue funcionando; la versión sube.
- **La bitácora es el segundo cerebro.** Cada fallo: qué se vio (el texto literal),
  la causa, cómo se reprodujo, el arreglo, qué lo prueba, el control negativo y una
  ficha de cierre (autoría · severidad · patrones · versión · fecha). La de la 3.0
  **empieza heredando** la de la 2.0: sus patrones P1–P21 son el punto de partida
  (`CONOCIMIENTO.md`, fase F5).
- **Las decisiones** en cinco partes: qué hace hoy, el límite real, la decisión, la
  condición de disparo y la contrapartida. Lo viejo se marca revocado, no se borra.
- **La tiendita**: montar una tienda completa con los datos de OTRO comercio antes
  de cada commit, en segundos.
- **Reparto del trabajo**: Claude hace los commits; el dueño hace el push, el
  release y la corrida de la flota, y mira el resultado en una tienda real.
- **Documentos cortos donde los lee el comerciante** (la guía cabe en una página y
  una batería lo exige) y rigurosos donde los lee el técnico.

---

## 9 · Qué hacer con las tiendas que existen

- **La 2.0 sigue viva** hasta que la 3.0 tenga su MVP y un camino de migración
  probado. Recibe correcciones y lo que pidan los clientes; nada de rediseños.
- **Orgánico** migra a la 2.0 cliente por cliente cuando convenga (decisión 36).
  Si la 3.0 llega antes, esos clientes pueden ir directo a la 3.0.
- **La migración a la 3.0** se diseña como un producto más: exportar la hoja por
  nombres de columna, importar, conservar los enlaces de rastreo y el dominio,
  y comparar la tienda nueva con la vieja antes de apuntar el dominio.

---

## 10 · Un MVP propuesto para la 3.0

Es una propuesta para discutir; el dueño la cierra después de decidir §6.

| Hito | Qué deja funcionando |
|---|---|
| **M0 · Fundación** | Repositorio, decisiones D1–D3 escritas, modelo de datos con versión y migraciones, contratos de §7, la suite con un segundo comercio desde el primer commit, bitácora heredada |
| **M1 · La tienda pública** | Catálogo estático por comercio, ficha con variantes, carrito, pedido por WhatsApp con número, textos legales generados, SEO horneado. Costo por visita: cero |
| **M2 · El panel** | Entrar, productos (fotos y variantes), pedidos y estados, ajustes, cupones, envíos, tablero, colaborador |
| **M3 · Cobrar** | Bold con apartado de unidades y confirmación consultada |
| **M4 · Alta y actualizaciones** | Alta de un comercio en minutos, sin copiar credenciales; una versión se publica una vez; volver atrás con un botón y simulacro |
| **M5 · Medición propia** | El medidor de la decisión 35, con el tablero junto a las ventas y la vista comparada de todas las tiendas |
| **M6 · Migrar** | Una tienda de la 2.0 pasa a la 3.0 sin perder pedidos, rastreos ni dominio |

---

## 11 · Dónde está cada cosa en la 2.0

| Para saber… | Leer |
|---|---|
| Qué hace el producto, por perfil | `FUNCIONALIDADES.md` |
| Cómo está construido y por qué | `ARQUITECTURA.md` |
| Los datos, las puertas y sus reglas | `CONTRATOS.md` |
| Montar una tienda de cero y operar la flota | `DESPLIEGUE.md`, `RUNBOOK-TECNICO.md`, `ACTUALIZAR-UNA-TIENDA.md` |
| Las 36 decisiones, con su contrapartida | `DECISIONES.md` |
| Los 113 fallos y los 21 patrones | `BITACORA.md`, `CONOCIMIENTO.md` |
| El MVP de la 2.0, hito por hito | `PLAN-MVP.md` (historia) y `ROADMAP.md` |
| Cobrar con Bold | `PAGOS-BOLD.md` |
| Lo que ve el comerciante | `GUIA-COMERCIANTE.md` |
| Operar la 2.0 el día a día | `TRASPASO.MD` |

**Lo que la 2.0 deja pendiente al cerrar su MVP** (no es trabajo de la 3.0, pero
conviene saberlo): los secretos y la primera corrida del flujo `panel` de
`tiendas`; revocar el token viejo de `ALTA_TOKEN`; el sitio principal ED1; el
consentimiento de cookies; comparar comisiones de Bold con números reales; y las
decisiones abiertas de §6 (D5 y D6).
