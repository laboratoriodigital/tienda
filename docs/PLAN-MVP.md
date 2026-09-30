# Plan del MVP — la semilla nueva

_18 de septiembre de 2026. Repositorio `laboratoriodigital/tienda`._

> **Qué es este documento.** El plan de la primera versión de una semilla nueva,
> hecha a partir de la de Orgánico (`laboratoriodigital/organico`, 3.0.0) pero
> con otro objetivo: **una tienda que sirve para cualquier producto, que el
> comerciante administra desde una página web y no desde la hoja, y que se
> actualiza sola.**
>
> Sustituye a `PLAN-4.0.md`, que era el plan de evolución de la línea vieja.
> Aquel diseñaba la arquitectura completa; este recorta esa arquitectura a **lo
> mínimo que se puede construir con recursos limitados** y manda el resto al
> `ROADMAP.md`.
>
> **El alcance quedó cerrado el 18 de septiembre de 2026: el MVP son los hitos
> M0 a M3** — y el 21 de septiembre el dueño le sumó **M3.5 · Cobrar en línea**
> (PSE o botón de pago), **M4 · El tablero** y **M5 · El rastreo del pedido**.
> La actualización automática de la flota (M6) **sale del MVP** y es la entrega
> siguiente (1.1), con su orden ya decidido en el `ROADMAP.md`. El producto se llama **tienda**, el
> repositorio empieza en **0.1.0** y el MVP sale como **1.0.0**.
>
> **Caduca cuando la 1.0.0 esté publicada.** Entonces: la arquitectura se
> promueve a `ARQUITECTURA.md`, las decisiones a `DECISIONES.md`, lo que se
> rompió a `BITACORA.md`, lo que quedó fuera al `ROADMAP.md`, y este archivo se
> borra.

## Dónde estamos · 29 de septiembre de 2026 · 0.24.0

- **La semilla va en la 0.24.0** (`package.json` y `VERSION_TIENDA`). Los
  hitos del MVP están cerrados —M0 a M5, con M3.5 y M3 bis (tabla al principio
  de §5)—; la etiqueta 1.0.0 todavía no se ha cortado.
- **La flota que se actualiza sola (M6) también está hecha**, aunque salió del
  MVP: v1 en la 0.13.0, automática en la 0.14.0 (`montaje` con la entrada
  `semilla`). Desde la 0.22.0 lo que decide si una tienda publica es
  `pruebas/tienda-viva.js`, elegida por `pruebas/publicacion.sh`; desde la
  0.22.1 los flujos de cada tienda los entrega la flota (`tiendas`); desde la
  0.22.3 la semilla, que también es una tienda, pone al día su propio maestro
  al cortar una versión.
- **prueba1** (anillo 2), la tienda de prueba de esta línea, está actualizada
  y publicada en verde, con su logo y los flujos entregados por la flota
  (bitácoras 104 y 105).
- **`prueba-panel` ya no está en la flota**: se sacó de `flota.json` porque no
  aportaba nada (ver *Flota · Una tienda puede estar fuera del reparto*, en
  §5, tras la 0.22.2).

**Lo pendiente, en este orden:**

1. Poner en `tiendas` los secretos `PANEL_SCRIPT_ID` y `PANEL_CLASPRC`, y
   correr por primera vez su flujo `panel` (publica `panel.gs`, 0.21.1; desde
   la 0.22.3 escribe `~/.clasprc.json`, que antes nunca escribía).
2. **Causa 4** de la revisión (bitácora 102): que el montaje diga TODO lo que
   falla en una corrida, no solo lo primero.
3. Publicar el sitio principal (ED1).
4. **Riesgo conocido:** `MAESTRO_TOKEN` todavía viaja como `t=` en la
   dirección de peticiones GET del montaje al maestro (`?a=bloques&t=…`, por
   ejemplo), contra la regla de que los tokens solo van por POST.

El último está en §7 (riesgos) y en el `ROADMAP.md` (5.7). El de los flujos
retirados que nadie podía borrar se cerró en la 0.22.3 (la flota los quita).

| | |
|---|---|
| §0 | Las decisiones que dieron origen a este plan |
| §1 | Qué es este proyecto, y qué no |
| §2 | Lo que se hereda medido, y los hallazgos que cambian el diseño |
| §3 | **La restricción que manda: repositorios privados y los minutos de Actions** |
| §4 | Arquitectura del MVP |
| §5 | El MVP, hito por hito |
| §6 | Los tres presupuestos |
| §7 | Riesgos |
| §8 | Decisiones |

---

## 0 · Las decisiones que dieron origen a este plan

Tomadas el 18 de septiembre de 2026, y todas cambian algo de lo que estaba
escrito antes:

**D1 · La semilla y las tiendas son privadas.** Se hará pública la semilla
cuando el ritmo de consumo llegue al umbral que el dueño está midiendo; las
tiendas **siguen privadas siempre**. Esto invierte la recomendación de
`PLAN-4.0.md` §9 y tiene una consecuencia que no es obvia y que reordena todo el
plan: **en repositorios privados los minutos de GitHub Actions se pagan** (§3).

**D2 · El único pull request manual es el de la semilla.** En las tiendas, todo
fusiona solo: publicar el catálogo, las fotos, el `index.html` y el maestro. La
puerta humana se queda donde se decide qué se construye —la semilla—, no donde
se reparte lo ya decidido. Esto **sustituye** la decisión anterior de publicar el
maestro con una persona delante, y obliga a algo que antes no hacía falta:
**verificación automática después de publicar, y vuelta atrás automática si
falla** (§4.7).

**D3 · Proyecto aparte.** `laboratoriodigital/tienda` (carpeta
`D:\CoWork\tienda`) es la semilla nueva. `organico` queda como está, con sus
tres tiendas en producción sobre la 3.0.0. **No se sincronizan entre sí**: son
dos líneas, y la vieja solo recibe correcciones.

**D4 · Nada de Orgánico en el código.** Ni un nombre, ni un producto, ni un
lugar, ni un teléfono, ni en los textos legales, ni en lo que siembra
`instalar()`. **Todo sale de la hoja de configuración.** Es la regla que la
línea vieja tenía escrita y no cumplía del todo (§2, hallazgo 2).

**D5 · El comerciante administra desde una página web, no desde la hoja.** La
hoja sigue siendo la base de datos; deja de ser la interfaz. En el MVP entra
**el panel de gestión**; el tablero gráfico y el rastreo del pedido son la
entrega siguiente (D11).

**D6 · La autoría va en la tienda.** Al pie: *Powered by Laboratorio Digital*,
con enlace.

**D8 · El producto se llama «tienda».** Nombre genérico a propósito: el
anterior era el de un comercio, y un producto que se llama como su primer
cliente arrastra ese cliente a todas partes. Este repositorio es **la semilla de
la segunda versión de la tienda virtual**.

**D9 · Se empieza en 0.1.0 y el MVP sale como 1.0.0.** Dos líneas, dos
numeraciones: `organico` sigue en 3.x sirviendo a sus tres tiendas, y esta
empieza de cero. Compartir numeración entre código que ya no se comparte es la
forma más barata de confundir un informe dentro de seis meses.

**D10 · Sin datos básicos de empresa no se publica.** Los `empresa_*` dejan de
avisar y pasan a **bloquear**, igual que hoy bloquean el WhatsApp o la llave de
pago. La razón no es formal: el Estatuto del Consumidor exige identificar al
vendedor, y un texto legal sin responsable **no vale nada** — publicar sin ellos
es publicar una tienda que dice cosas que nadie firma. Cuáles exactamente, en
§4.2.

**D11 · El MVP son M0 a M3.** Con los recursos de hoy, seis hitos no se
entregan. Se construyen los cuatro que hacen el producto vendible —la semilla
limpia, el rendimiento, la tienda para todo producto y el panel básico— y los
tres restantes quedan en el roadmap como entrega siguiente. **Lo que se saca se
dice, con su consecuencia** (§4.9).

**D7 · El MVP manda sobre la ambición.** `PLAN-4.0.md` describía diez épicas y
unas cincuenta historias. Con los recursos de hoy eso no se entrega: este plan
se queda con lo mínimo que hace al producto vendible y **deja por escrito qué se
sacó y dónde quedó**.

---

## 1 · Qué es este proyecto, y qué no

**Es** una plantilla de tienda en línea a **$0/mes de infraestructura** para
comercios pequeños colombianos:

```
publicar/index.html     la tienda            (estático, Cloudflare Workers)
publicar/admin.html     la gestión           ← nuevo: el panel (M3) y su pestaña Tablero (M4)
publicar/pedido.html    el rastreo           ← nuevo (M5)
maestro.gs              el backend           (Apps Script, uno por tienda)
la hoja de Google       la base de datos     (deja de ser la interfaz)
WhatsApp                el cierre de la venta
```

**No es**: una pasarela de pagos (cobra con la de Bold, M3.5), un framework,
una base de datos, una app móvil, ni un sistema con historial de clientes. Esas
ausencias son lo que sostiene el $0, y siguen decididas.

**Para quién**: cualquier comercio con catálogo — cosmética, panadería, ropa,
ferretería, cafés de especialidad. La línea vieja sabía vender tomate; esta
tiene que no saber nada de antemano.

---

## 2 · Lo que se hereda medido, y los hallazgos

Se hereda funcionando: catálogo estático (mil visitas = cero lecturas de la
hoja), catálogo de respaldo horneado dentro de la página, bandeja de pedidos
pendientes en el navegador del comprador, seis estados de pedido con inventario
que se mueve solo, cupones validados en el servidor, envío por zona, tablero con
embudo, correo diario, respaldo semanal, diagnóstico de diez puntos, panel
multitienda, y una suite de baterías sobre el código real.

Y se heredan ocho hallazgos de la medición del 18 de septiembre. Los cinco que
mandan aquí:

1. **`publicar/index.html` es fuente y producto a la vez.** No hay plantilla
   separada: las herramientas reemplazan bloques marcados dentro del archivo
   publicado. Mientras siga así, actualizar una tienda es fusionar, y fusionar
   es donde aparecen los conflictos.
2. **Quedan datos de Orgánico donde nadie los hornea**: el pie, el bloque
   `EMPRESA` (`Rionegro, Antioquia`, `300 861 0480`), el `wa.me` del flotante,
   `404.html`, `compartir.jpg` y el `name` de `wrangler.jsonc`. Hoy se tapan en
   tiempo de ejecución; el archivo que se publica los lleva dentro.
3. **Los textos legales hablan de tomates.** El derecho de retracto nombra
   «chonto, cherry y riñón» y «recoger en la finca». Cualquier comercio que
   publique con esta plantilla firma eso ante sus compradores. **Es el hallazgo
   más caro de los ocho.**
4. **`SCRIPT_VERSION` sale del maestro publicado, no del repositorio.** El
   `index.html` y el maestro no se pueden actualizar por separado: si el index
   va por delante, la tienda avisa desajuste de versión y deja de sellar
   pedidos.
5. **El horneado no es determinista** (fecha del día en el respaldo, marca de
   tiempo en el catálogo, claves sin ordenar, `package-lock.json` ignorado). Sin
   determinismo, «este archivo cambió» y «el reloj avanzó» son indistinguibles.

Y tres del rendimiento, que con D1 pasan a ser de dinero y no de paciencia:
**tres llamadas duplicadas al maestro por corrida**, **fotos descargadas y
convertidas en serie**, y **la caché del navegador de pruebas que se pierde
entera** ante cualquier cambio de dependencias.

---

## 3 · La restricción que manda: los minutos de Actions

Esto es lo que más cambia con D1, y conviene mirarlo antes de decidir nada más.

**En repositorios públicos, Actions es gratis e ilimitado. En privados, no.** El
plan Free incluye del orden de **2.000 minutos al mes para toda la cuenta**
—no por repositorio— y los planes de pago suben esa cifra. *(Conviene
confirmarlo en Settings → Billing antes de fijar el presupuesto: es el único
número de este plan que depende de la facturación de un tercero.)*

Lo que cuesta hoy el reparto actual, con una corrida estimada en 2,5 minutos de
reloj:

| Qué | Corridas/mes por tienda | Minutos/mes por tienda |
|---|---|---|
| `fotos` cada 4 h | 180 | **450** |
| `montaje` semanal | 4 | 10 |
| «Publicar ahora» a demanda | ~20 | 50 |
| `pruebas` en cada empuje | ~10 | 25 |
| **Total** | | **~535** |

Con eso, **tres tiendas se comen 1.600 minutos al mes y la cuarta no cabe.** Y
el 84 % de ese gasto es el cron de cuatro horas, que existe para cazar fotos que
el comerciante subió al Drive sin avisar — un caso que el panel de gestión
(§4.3) hace desaparecer, porque a partir de ahí la foto se sube desde el panel y
el panel sabe cuándo hay algo sin publicar.

**Decisión del MVP:** se quita el cron de cuatro horas. Queda **publicación a
demanda** (el botón del comerciante, ahora en su panel) y **una red de seguridad
diaria** que solo mira si hay cambios sin publicar y avisa. El mismo cuadro:

| Qué | Corridas/mes | Minutos/mes |
|---|---|---|
| Red de seguridad diaria (solo mira) | 30 | 15 |
| Publicación a demanda | ~25 | 60 |
| `pruebas` | ~10 | 25 |
| **Total** | | **~100** |

**De 535 a ~100 minutos por tienda al mes.** Eso convierte «cuatro tiendas» en
«veinte tiendas» dentro del mismo plan, y hace que el trabajo de rendimiento
(§5, hito M1) se pague en dinero además de en paciencia. Es la razón de que el
rendimiento vaya primero en el orden de entrega.

Tres cosas más que cambian por ser privados:

- **Una tienda no puede leer la semilla sin credencial.** Hace falta un secreto
  de organización *fine-grained*, `Contents: read` **solo sobre la semilla**,
  puesto una vez y distribuido a los repositorios de la flota. Es lo que hundió
  el intento de la 2.12.0 (un 404 por versiones no públicas), y ahora está
  previsto.
- **El día que la semilla se haga pública, ese secreto se retira** y nada más
  cambia. El diseño no depende de cuál de las dos cosas sea cierta.
- **Los artefactos y las cachés de Actions también consumen almacenamiento** en
  privado. Las cachés del navegador de pruebas son las grandes; conviene una
  sola clave por versión de dependencias y no una por rama.

---

## 4 · Arquitectura del MVP

### 4.1 Las piezas, y qué manda sobre cada una

| Pieza | Quién la escribe | Dónde vive |
|---|---|---|
| `plantilla/*.html` | La semilla | Repositorio, igual en todas las tiendas |
| `publicar/*` | **El horneado**, desde la hoja | Repositorio, distinto en cada tienda, **nunca a mano** |
| `maestro.gs` | La semilla | Apps Script de cada tienda |
| La hoja | El comerciante, **a través del panel** | Cuenta de Google de esa tienda |
| Las fotos | El comerciante, **a través del panel** | Drive de esa tienda |
| Los secretos | El operador | Secretos del repositorio y propiedades del script |

La regla que lo sostiene todo, y que en la línea vieja se cumplía a medias:
**ningún archivo es a la vez fuente y producto.** `plantilla/` se edita;
`publicar/` se genera. Ante cualquier duda sobre `publicar/`, se rehornea.

### 4.2 La semilla sin marca

Todo lo que hoy identifica a un comercio sale de la pestaña `Configuración`:
nombre, colores, textos, datos de empresa, horario, llave de pago, y **los
textos legales**, que dejan de ser prosa con un caso dentro y pasan a ser
plantilla con huecos. Lo que no se pueda llenar **se ve vacío**, no relleno con
los datos de otro: un respaldo con los productos de otro comercio es peor que no
tener respaldo, porque funciona.

`A0_instalar()` siembra **dos filas de ejemplo marcadas como ejemplo y
desactivadas**, no ocho productos de tomate.

**Y hay datos sin los cuales no se publica** (D10). Hasta ahora bloqueaban
cuatro claves —el nombre del negocio, el WhatsApp, la dirección del sitio y la
llave de pago—; desde la 1.0.0 bloquean también los datos que identifican al
vendedor, porque el Estatuto del Consumidor obliga a mostrarlos y porque los
textos legales se arman con ellos:

| Clave | Por qué bloquea |
|---|---|
| `empresa_razon` | Sin responsable, el texto de datos y el de retracto no obligan a nadie |
| `empresa_nit` | NIT o cédula: es lo que identifica al vendedor |
| `empresa_direccion` y `empresa_ciudad` | Dónde reclama un comprador |
| `empresa_correo` **o** `empresa_tel` | Al menos un canal formal, además del WhatsApp |

Un valor entre corchetes cuenta como vacío — es lo que deja `A0_instalar()`
para que se vea que falta. **Contrapartida, dicha en voz alta:** no se puede
publicar una tienda de demostración con datos inventados. Para enseñar el
producto está la tienda de pruebas del operador, con los datos del operador.

### 4.3 El panel del comerciante — `publicar/admin.html`

Es la pieza nueva más grande, y la que convierte el producto en algo que se
puede vender sin enseñar a usar una hoja de cálculo.

**Qué hace en el MVP** (y solo esto):

| Bloque | Qué puede hacer el comerciante |
|---|---|
| **Productos** | Ver, buscar, crear, editar, activar/desactivar, borrar. **Subir la foto desde el panel** |
| **Pedidos** | Ver la lista, abrir uno, cambiar el estado. Es el trabajo diario |
| **Configuración** | Las claves que él toca: textos de portada, colores, horario, envío gratis, datos de contacto |
| **Publicar** | Un botón. Dice si hay cambios sin publicar y cuándo se publicó por última vez |

**Lo que el panel no cubre todavía sigue estando en la hoja.** El panel no es una
jaula: cupones, zonas de envío y las claves técnicas se siguen editando ahí
hasta que entren en el roadmap. *(Entraron en la 0.9.0, M3 bis: hoy el panel
alcanza para toda la configuración salvo `correo_ultimo` y `panel_usuario`.)* Decirlo es parte del diseño — un panel que
esconde lo que no sabe hacer deja al comerciante sin salida.

**Cómo funciona, en tres líneas.** Es una página estática más, servida por el
mismo Worker, sin servidor propio y sin infraestructura nueva. Habla con el
maestro de su tienda por acciones nuevas `?a=admin.*`. Toda escritura pasa por
`LockService`, por `celdaSegura()` —que ya cierra la inyección de fórmulas— y
por la validación del contrato de datos.

**La autenticación, y sus límites, dichos en voz alta.** Usuario y clave. La
clave **no se guarda**: se guarda su hash con sal en las propiedades del
proyecto de Apps Script, nunca en la hoja ni en el repositorio. Al entrar, el
maestro devuelve un testigo firmado con vencimiento de ocho horas, que el
navegador guarda y manda en cada petición. Cinco intentos fallidos bloquean
quince minutos y quedan anotados.

Esto es **autenticación sencilla a propósito**: no hay segundo factor, no hay
usuarios múltiples, no hay permisos por rol. Su modelo de amenaza es «que un
desconocido no entre», no «resistir a alguien que va a por este comercio». Lo
que protege está acotado a una tienda: su hoja y su Drive. Cuando el producto
justifique más, el roadmap tiene el camino.

**Y la regla que lo mantiene barato:** guardar en la hoja **no publica**. El
panel guarda al instante y marca «hay cambios sin publicar»; publicar es un
botón que corre el flujo **una vez**. Publicar en cada guardado, con
repositorios privados, sería pagar minutos por cada tecla.

### 4.4 El tablero y el rastreo — **los dos entraron al MVP (M4 y M5)**

> **El 21 de septiembre de 2026 el tablero entró al MVP como M4**, y no como
> página aparte sino como **pestaña del panel** (decisión 13). El resto de lo
> diseñado se cumple igual: SVG escrito a mano, una petición por visita, la
> tabla debajo de cada gráfica. El detalle está en §5, M4.

Las dos piezas, como se diseñaron:

- **El tablero** — las métricas que ya calcula el maestro, en gráficas SVG
  escritas a mano, sin librerías, con una sola petición por visita y la tabla de
  datos debajo de cada gráfica. *Hecho en M4, dentro de `admin.html`.*
- **`pedido.html`** — el comprador consulta su pedido con el número que ya
  viaja en su conversación de WhatsApp, sin que se guarde ni un dato suyo más.
  Antes hace falta que **el número no se pueda adivinar**. *Hecho en M5
  (0.10.0), con un secreto aparte en el enlace (decisión 15).*

Lo que se perdía mientras no estaban —ya no aplica—: el comerciante leía sus
métricas en la **pestaña Tablero de su hoja**, que sigue existiendo —así que la
pérdida era de comodidad, no de información—; y contestaba a mano «¿en qué va
mi pedido?», que es trabajo suyo, no una venta rota. Por eso los dos aguantaban
esperar. El detalle está en el `ROADMAP.md`, entrega 1.1 (S1 y S2).

*(No hay §4.5. Se conserva la numeración porque el código y otros documentos
citan §4.7 y §4.9.)*

### 4.6 SEO horneado

Como el catálogo se hornea, el SEO también:

- **JSON-LD** en la portada (`Organization`, `WebSite`) y por producto
  (`Product` con `Offer`, precio, moneda y disponibilidad), escrito en el HTML
  —no por JavaScript—, porque los rastreadores no ejecutan JavaScript.
- **`sitemap.xml`** generado en cada horneado: la portada y una entrada por
  producto activo. **`robots.txt`** apuntándolo.
- `admin.html` va con `noindex` — y las páginas de la entrega 1.1 también,
  cuando lleguen.

### 4.7 Fusión automática: qué entra en el MVP y qué no

La decisión D2 —en una tienda no hay pull request— tiene dos mitades, y **solo
una entra en el MVP**:

**Entra: publicar fusiona solo.** Lo que el comerciante cambia en su hoja y
manda con el botón se hornea, se prueba y se empuja a `main` sin que nadie
apruebe nada. Eso ya funciona así en la línea vieja y aquí se conserva, con el
cambio de cadencia del hito M1: a demanda, no cada cuatro horas.

**No entra: que la tienda se actualice sola desde la semilla.** Sobrescribir el
código de la semilla, rehornear, publicar el maestro, verificar contra la tienda
viva y volver atrás solo si falla — todo eso está diseñado y **se construye
después del MVP** (`ROADMAP.md`, S3 de la entrega 1.1 —decía «fase 2»—). Mientras tanto vale lo mismo que en la
línea vieja: **una tienda nueva se clona** y nace con lo último; **una tienda ya
montada se pone al día a mano**.

> **Hoy (0.22.3) ya entra.** Se construyó después del MVP: desde la 0.14.0 una
> tienda se actualiza sola con su `montaje` (entrada `semilla`), vuelve atrás
> el maestro si algo falla, y la flota la dispara por anillos. Cómo decide
> publicar y quién le entrega los flujos está en las secciones 0.22.0 y 0.22.1
> de §5, y el procedimiento en `ACTUALIZAR-UNA-TIENDA.md`.

Y es la decisión correcta por la misma razón que ya se aprendió una vez: con
cero tiendas en esta línea, automatizar la actualización es construir maquinaria
para un problema que todavía no existe. El día que existan cinco, la cuenta se
da la vuelta — y el diseño ya está escrito para ese día.

**Lo que sí hay que dejar listo en el MVP**, porque es lo que lo hace posible
después y cuesta casi nada hacerlo desde el principio: que `publicar/` sea
producto y no fuente (M0), que el horneado sea determinista (M0), y que cada
herramienta declare qué escribe (M0). Sin esas tres, la actualización automática
no se puede construir sin rehacer medio repositorio.

### 4.8 La autoría

Al pie de la tienda, discreto: **Powered by Laboratorio Digital**, con enlace.
El texto es fijo; el enlace sale de la hoja (`autoria_url`) por si cambia el
dominio. Lleva `rel="noopener"` y no carga nada de fuera.

Y un interruptor, `f_autoria`, encendido por defecto: **quitar la marca es algo
que un cliente puede pedir**, y entonces es una decisión comercial con precio,
no un cambio de código.

### 4.9 Lo que NO entra en el MVP

Está todo en el `ROADMAP.md` con su número. Lo que más duele dejar fuera, y por
qué se puede:

| Fuera | Por qué aguanta |
|---|---|
| **El tablero gráfico** | Las métricas ya existen en la pestaña Tablero de la hoja. Se pierde comodidad, no información |
| **El rastreo del pedido** | El comerciante sigue contestando a mano. Es trabajo suyo, no una venta rota |
| **La actualización automática de la flota** | Con cero tiendas en esta línea, es maquinaria para un problema que no existe. Una tienda nueva se clona y nace al día |
| Ranuras de extensión y desvíos declarados | Ninguna tienda ha divergido. Construir la maquinaria antes del primer caso es superficie de fallo sin uso |
| Cupones y zonas de envío en el panel | Se tocan una vez al montar. Siguen en la hoja |
| Gestión de usuarios y permisos | Un comercio, una clave |
| Archivado de `Pedidos` y `Validaciones` | El tope son 20.000 filas: entre 6.000 y 10.000 pedidos. No aprieta en la tienda uno |
| El stub que no se repega y el menú por datos | Con el panel web, el menú de la hoja deja de ser el camino principal. Baja de prioridad solo |
| «Avísame cuando llegue» | Es venta perdida, no venta rota |
| Restauración probada del respaldo | Duele el día que duele. Va primero en el roadmap |

**Lo que de esta tabla se hizo después**, al 29 de septiembre de 2026: el
tablero (M4, 0.8.0), el rastreo (M5, 0.10.0), cupones y zonas en el panel
(0.9.0), un colaborador además del dueño (0.13.0), «Avísame cuando llegue»
(0.11.0), la actualización automática (0.14.0) y la restauración (0.18.0).
Siguen fuera las ranuras de extensión, el archivado de pestañas y el stub que
no se repega; su estado, en el `ROADMAP.md`.

---

## 5 · El MVP, hito por hito

**Cómo se lee una historia.** Identificador, tamaño en puntos (1 = media
sesión, 2 = una, 3 = una larga, 5 = dos o tres, 8 = hay que partirla), la frase
de usuario, criterios de aceptación verificables, y qué la prueba.

**Definición de terminado, para todas, sin excepción:**

1. Aserciones nuevas en las baterías, en verde junto con las anteriores.
2. Probado en la tienda de pruebas antes de tocar ninguna otra.
3. El documento actualizado en el mismo commit que el código.
4. Si cambia algo que el comerciante ve, la guía del comerciante se actualiza.
5. Si cambia un contrato de datos, la versión anterior sigue funcionando.
6. Si toca `maestro.gs`, `panel.gs` o `plantilla/`, sube `version`.

**Estado de los hitos, al 29 de septiembre de 2026:**

| Hito | Estado | Versión |
|---|---|---|
| M0 · La semilla limpia | Cerrado el 18-sep | — |
| M1 · Rendimiento y cuota | Cerrado entero el 21-sep | — |
| M2 · La tienda para todo producto | Cerrado; C-1b (stock por combinación) el 21-sep | 0.7.0 |
| M3 · El panel básico | Cerrado el 21-sep | — |
| M3.5 · Cobrar en línea | Cerrado (queda comparar comisiones, E-2) | 0.6.0 |
| M4 · El tablero | Cerrado el 21-sep | 0.8.0 |
| M3 bis · El panel alcanza para todo | Cerrado el 21-sep | 0.9.0 |
| M5 · El rastreo del pedido | Cerrado el 21-sep | 0.10.0 |
| M6 · La flota se actualiza sola | Hecho fuera del MVP (S3 del `ROADMAP.md`) | 0.13.0 y 0.14.0 |

Lo que vino después, versión por versión, está en las secciones 0.11.0 a
0.24.0 de más abajo; lo pendiente, en *Dónde estamos*, al principio.

**El MVP son siete hitos —M3 bis reabrió M3—, y este fue el orden:**

```
M0 → M1 → M2 → M3 → M3.5 → M4 → M5   ← la 1.0.0
                                  M6   ← era la 1.1; hecho en la 0.14.0
```

> **M3.5 · Cobrar en línea entró al MVP el 21 de septiembre de 2026**, por
> decisión del dueño: un integrador de pagos con PSE o botón de pago. Se numera
> 3.5 y no 4 para no renumerar la 1.1, que ya está escrita con M4 a M6 en el
> `ROADMAP.md` y en varias decisiones.
>
> **M4 · El tablero entró al MVP el mismo día**, también por decisión del
> dueño. Era el primero de la 1.1 y el más barato: las cuentas ya existían
> (`calcularMetricas`) y la puerta con sesión la dejó M3. Conserva su número.

**M0 primero, y no es negociable**: hasta que `publicar/` sea producto y no
fuente, todo lo demás se construye sobre arena — y los datos del comercio
anterior siguen viajando dentro de cada tienda que se cree.

**M1 segundo por dinero, no por gusto**: con repositorios privados, el reparto
de hoy no deja pasar de tres tiendas (§3).

**M2 antes que M3** porque es lo que hace que el producto se pueda enseñar a un
comercio que no vende tomate, y porque el panel de M3 administra lo que M2
define — construirlo al revés obliga a tocar el panel dos veces.

**M3 es la mitad del trabajo del MVP.** Si el tiempo aprieta, lo que se recorta
es el alcance del panel —no se aplaza el hito—: el orden dentro de M3 es
entrar, productos, pedidos, publicar, y lo demás cede antes que eso.

---

### M0 · La semilla limpia y determinista   · fundación

**A-1 · Nace `plantilla/`**  · 5 pts
> Como equipo, queremos que el código y los datos de un comercio vivan en
> archivos distintos, para que actualizar deje de ser fusionar.

- [x] `plantilla/index.html` es el `index.html` de hoy con **huecos** donde hay
      datos de un comercio: `<head>`, paleta, las constantes, el respaldo,
      `EMPRESA`, el pie y el flotante.
- [x] Los huecos son marcas explícitas, no valores de ejemplo.
- [x] Ninguna palabra de ningún comercio queda en `plantilla/`. Aserción que lo
      comprueba con una lista de términos prohibidos derivada de la hoja.
- [x] Abrir `plantilla/index.html` en un navegador **no** enseña una tienda:
      enseña que falta hornear.

**A-2 · El horneado genera `publicar/` desde `plantilla/`**  · 5 pts · dep. A-1
- [x] `preparar-index.mjs` genera el archivo **desde cero**, no reemplazando
      bloques dentro del publicado.
- [x] Sigue en pie: o se escribe entero, o no se escribe nada.
- [x] Borrar `publicar/index.html` y hornear lo reconstruye idéntico.
- [x] Hornear con la hoja de una tienda real da el mismo resultado visible que
      hoy. Se compara antes/después a ojo y con una batería.

**A-3 · También se hornean `404.html`, `compartir.jpg` y `wrangler.jsonc`**  · 3 pts · dep. A-2
> `sitemap.xml` y `robots.txt` los nombraba antes este título, y los pide con
> sus criterios la historia **C-2 (M2, SEO horneado)**. Un entregable en dos
> hitos es el patrón 2 dentro del plan: se queda en C-2, que es quien lo
> describe entero.
- [x] Ninguno queda con datos de otro comercio.
- [x] `wrangler.jsonc` recibe su `name` **en el flujo**, sin preguntar nada por
      teclado (hoy solo lo arregla una herramienta interactiva).
- [x] Aserción: `name` distinto de la semilla en cualquier repositorio de tienda.

**A-4 · Los textos legales salen de la hoja**  · 5 pts
> Como comerciante, quiero que mi texto legal hable de mi negocio y no de una
> finca de tomates que no es mía.

- [x] Datos, retracto y términos se arman con `empresa_*`, el nombre del
      comercio y una lista de excepciones al retracto que sale de la hoja.
- [x] **Sin los datos básicos de empresa no se publica** (D10): `empresa_razon`,
      `empresa_nit`, `empresa_direccion`, `empresa_ciudad` y al menos uno de
      `empresa_correo` / `empresa_tel` suben de *avisan* a *bloquean*, y el
      flujo se niega a escribir el `index.html` como ya hace con el WhatsApp.
- [x] El mensaje dice **qué falta y por qué bloquea**, no solo el nombre de la
      clave — igual que los cuatro bloqueos que ya existen.
- [x] El diagnóstico y la columna «Sin terminar» del panel del operador lo
      reflejan.
- [x] Las leyes citadas siguen siendo las correctas: Ley 1581 de 2012, y
      Estatuto del Consumidor art. 47 (retracto) y 51 (reversión).
- [x] Batería `legal.js`: montar una panadería y comprobar que ningún texto
      nombra un tomate, una finca ni una ciudad ajena.
- **Ojo:** esto entrega la mecánica, no asesoría jurídica. Que un abogado mire
  el machote sigue pendiente y no lo cierra esta historia.

**A-5 · `instalar()` deja de sembrar una tienda de tomates**  · 3 pts
- [x] Dos filas de ejemplo neutras, marcadas `EJEMPLO`, con `Activo = No`. Una
      zona de envío de ejemplo.
- [x] El diagnóstico avisa mientras quede un `EJEMPLO` activo.
- [x] Sigue siendo idempotente.
- **Ojo:** la hoja emulada de las baterías es otra cosa y no cambia. Confundir
  las dos ya costó diez baterías en rojo una vez.

**A-6 · El horneado es determinista**  · 3 pts
- [x] Ni marcas de tiempo ni fecha del día dentro de los archivos generados; si
      hace falta trazabilidad, se escribe la **versión**, que cambia cuando algo
      cambia.
- [x] Claves, productos y envíos en orden estable y declarado.
- [x] Hornear dos veces sin tocar la hoja deja `git status` limpio. **También
      pasada la medianoche UTC.**
- [x] `package-lock.json` versionado en las dos carpetas, y los flujos con
      `npm ci`: la misma foto convertida en enero da el mismo archivo.
- [x] Batería `determinismo.js`, con el reloj falseado.

**A-7 · La autoría al pie**  · 1 pt
- [x] *Powered by Laboratorio Digital*, enlazado a `autoria_url`, con
      `rel="noopener"`, sin cargar nada externo.
- [x] Interruptor `f_autoria`, encendido por defecto.

**A-8 · Cada herramienta declara lo que escribe**  · 2 pts
- [x] Cada `montar/*.mjs` exporta `ESCRIBE` con sus rutas.
- [x] Una aserción falla si una herramienta escribe algo que no declaró.
- [x] La lista de «qué se hornea» del flujo de actualización (M6) se deriva de
      ahí. Una sola lista, no dos.

---

**A-9 · El producto se llama «tienda», y empieza en 0.1.0**  · 1 pt
- [x] `package.json` en `0.1.0`. El MVP saldrá como `1.0.0`.
- [x] Ni el repositorio ni el código nombran al comercio de la línea anterior;
      donde hoy dice su nombre como marca del producto, dice **tienda**.
- [x] `wrangler.jsonc` de la semilla no lleva el nombre de una tienda de nadie.
- [x] Aserción: una lista de términos prohibidos —el nombre del comercio
      anterior, su ciudad, su teléfono, sus productos— que falla si alguno
      aparece en `plantilla/`, `maestro.gs`, `panel.gs` o la configuración
      sembrada.

---

**M0 CERRADO — 18 de septiembre de 2026.** Las nueve historias, con su
evidencia en baterías que corren en cada empujón:

| Historia | Dónde se comprueba |
|---|---|
| A-1 `plantilla/` sin marca | `marca.js` contra `terminos-prohibidos.json`; los huecos son marcadores `[… — sin hornear]`, no valores de ejemplo |
| A-2 el horneado genera `publicar/` | `plantilla.js` — `aplicar()` parte de `plantilla/index.html` y **nunca lee `publicar/`**, que es una garantía más fuerte que borrar y rehornear |
| A-3 404, compartir y wrangler | `montaje.js`; el nombre del Worker lo pone el flujo con `montar/nombrar-worker.mjs`, sin teclado |
| A-4 textos legales desde la hoja | `legal.js` — monta una panadería y comprueba que ningún texto nombra un tomate ni una finca |
| A-5 `instalar()` sin tomates | dos filas `EJEMPLO` inactivas; el diagnóstico avisa mientras quede alguna activa |
| A-6 horneado determinista | `determinismo.js` con el reloj falseado; `catalogo-estatico.mjs` no reescribe el archivo cuando lo único que cambia es el sello `generado` |
| A-7 autoría al pie | `f_autoria` encendido por defecto, enlace desde `autoria_url` |
| A-8 cada herramienta declara | `escribe.js` — falla si una herramienta escribe algo que no declaró |
| A-9 el producto se llama «tienda» | `package.json` en `0.1.0`, `wrangler.jsonc` en `tienda-sin-configurar`, `marca.js` |

**Lo que NO cierra M0 y sigue abierto a propósito:** que un abogado mire el
machote legal (nota de A-4), y el `sitemap.xml` / `robots.txt` de C-2.

### M1 · Rendimiento y cuota   · con repositorios privados, esto es dinero

**B-1 · Medir antes de tocar nada**  · 3 pts
- [x] Cada paso del flujo registra su reloj; el resumen trae la tabla fase /
      segundos / % y **los minutos de Actions consumidos**. *(No hubo que
      instrumentar un solo paso: GitHub ya los cronometra todos y lo publica en
      su API. Treinta relojes a mano serían treinta sitios donde olvidarse de
      uno — y el que se olvida es el que se come el tiempo.)*
- [x] Artefacto `tiempos.json` por corrida. *(Y `if: always()`: la corrida que
      falla es justo la que hay que mirar.)*
- [x] `presupuesto.json` con el objetivo de tiempo y el de minutos al mes.
      *(En los tres flujos, con la aserción de que ninguno lleva su propia
      copia del número.)*

**B-2 · Fuera el cron de cuatro horas**  · 2 pts
> Es el 84 % del gasto de minutos y existe para cazar fotos subidas al Drive
> sin avisar — un caso que el panel (M3) elimina.

- [x] Publicación **a demanda** desde el panel del comerciante. *(Cerrado
      con D-5, el 21 de septiembre: el botón Publicar del panel dispara el
      mismo flujo que el menú.)*
- [x] Red de seguridad **diaria** que solo comprueba si hay cambios sin publicar
      y avisa; no publica sola. *(El cron de `fotos` pasa de `17 */4 * * *` a
      `17 6 * * *`, y cuando lo dispara el reloj mira, avisa y se retira sin
      bajar una sola foto. Guarda en `montaje.js`.)*
- [x] El panel dice cuándo se publicó por última vez y si hay algo pendiente.
      *(D-5: se le pregunta a la tienda, no a la hoja, y si no contesta dice
      que no sabe.)*

**B-3 · Una sola pregunta al maestro**  · 5 pts · dep. B-1
- [x] `montar/sondear.mjs` pide en paralelo lo que hoy se pide tres veces
      duplicado, y escribe un estado que las demás herramientas leen con
      `--desde`. *(La lectura vive dentro de `alMaestro`, por donde pasan TODAS
      las preguntas: así ninguna herramienta tuvo que cambiar una línea, y
      `--desde` no puede quedarse a medias en una de ellas.)*
- [x] Sin `--desde`, cada herramienta sigue funcionando sola. *(Es como se usan
      a mano y como las prueban las baterías.)*
- [x] El flujo hace **cuatro** peticiones fijas en vez de siete, y se cuentan en
      una batería. *(`sondeo.js` las cuenta de verdad: levanta un maestro de
      mentira y mira qué le llega. Una aserción sobre el texto del archivo diría
      que la llamada está escrita, no que no se hizo.)*
- [x] El estado caduca a los diez minutos: nunca es una caché entre corridas.
      *(Vencido, se dice en voz alta y se pregunta al maestro: el camino lento,
      nunca el dato viejo.)*

**B-4 · Fotos en paralelo**  · 3 pts
- [x] Descarga y conversión en tandas de cuatro; los cuatro tamaños de cada foto
      a la vez. *(Los cuatro tamaños eran cuatro lecturas del mismo archivo que
      no compartían nada y se esperaban igual.)*
- [x] **Cada error sigue nombrando su foto**; si fallan dos, se listan las dos.
      *(Al final, todas juntas: en Actions el log viene cortado y «hubo un
      problema con las fotos» obliga a leerlo entero.)*
- [x] Una foto que falla no impide publicar lo demás. *(Era el fallo grave:
      doce fotos con una corrupta publicaban CERO. La regla vive en
      `enTandas()`, exportada para poder probarla sin Drive ni maestro, y las
      que fallan quedan FUERA del registro para que la próxima corrida las
      reintente.)*

**B-5 · Las cachés dejan de perderse enteras**  · 2 pts
- [x] `restore-keys` en la caché del navegador de pruebas. *(En los tres
      flujos.)*
- [x] La instalación con dependencias del sistema corre **solo** cuando la caché
      falla. *(`--with-deps` son paquetes apt; con la caché acertada no
      aportan.)*
- [x] Una sola clave de caché por versión de dependencias, no una por rama: en
      privado, el almacenamiento también se paga. *(Y la clave pasa a salir de
      `package-lock.json`: con `package.json` el rango `^1.47.0` podía resolver
      a otra versión sin cambiar la clave, y la caché servía un navegador que
      ya no valía.)*

**B-6 · El guardia del presupuesto**  · 2 pts · dep. B-1
- [x] Por encima del objetivo, avisa en grande y sigue. *(Una máquina lenta no
      es un fallo.)*
- [x] Por encima del doble, falla y nombra la fase. *(Un fallo que solo dice
      «tardó mucho» obliga a abrir el log y buscar.)*
- [x] Se puede desactivar con un input para una corrida excepcional.
      *(`sin_guardia`. Sin interruptor, la salida es comentar el paso — y ahí
      se queda.)*

**B-7 · La batería que no corre, o corre o se borra**  · 1 pt
- [x] `limites.js` levanta un navegador y no está en la lista: entra o se va.
      *(**Entra.** Medido antes de decidir: la corrida entera cuesta menos de
      tres segundos, porque reutiliza un navegador. No había razón de coste
      para dejarla fuera; solo se había quedado fuera.)*
- [x] La aserción que vigila eso cubre también este caso. *(Se quitó de las dos
      listas de exclusión escritas a mano. Y al entrar se le pusieron
      aserciones deterministas —bytes del catálogo y tarjetas en la primera
      pantalla—; los milisegundos se imprimen pero no se afirman, que el reloj
      de una máquina cargada es una entrada que nadie declaró.)*

---

**M1 CERRADO — 18 de septiembre de 2026.** Las siete historias, y lo que midió
cada una:

| Historia | Qué cambió, medido |
|---|---|
| B-1 · Medir antes de tocar nada | Los tres flujos dejan tabla fase/segundos/% y los minutos gastados. No se instrumentó un solo paso: GitHub ya los cronometra |
| B-2 · Fuera el cron de cuatro horas | De seis arranques diarios a uno, y el diario **no publica**: mira y avisa. Era el 84 % de los minutos |
| B-3 · Una sola pregunta al maestro | De **siete** peticiones fijas a **cuatro**, y las cuatro a la vez. Contra un Apps Script frío —40 s documentados— eso es el camino crítico de publicar una foto |
| B-4 · Fotos en paralelo | Tandas de cuatro, y los cuatro tamaños de cada foto a la vez. Y una foto rota dejó de publicar CERO fotos |
| B-5 · Las cachés no se pierden enteras | La clave sale del lock y no de un rango; `restore-keys`; `--with-deps` solo cuando la caché falla |
| B-6 · El guardia del presupuesto | Avisa por encima del objetivo, falla por encima del doble y nombra la fase |
| B-7 · La batería que no corría | `limites.js` entra. Medido antes de decidir: cuesta menos de tres segundos |

**Y una medición que no estaba en el plan:** `todas.sh` repartía «un trabajador
por núcleo». Medido en dos núcleos —151 s con uno, 94 s con dos, **73 s con
cuatro**— resultó que estas baterías no gastan CPU, esperan. Son cuatro fijos.

**Revisado contra la línea anterior (21 de septiembre).** La otra línea del
producto hizo su propio plan de rendimiento de Actions. De sus siete medidas,
cinco ya estaban aquí (cuatro trabajadores fijos en un solo runner, no repetir
`pruebas` sobre los pull request del bot, caché de npm y del navegador con la
clave del lock y `restore-keys`, `--with-deps` solo cuando la caché falla, y
las lecturas al maestro a la vez). Dos no, y se tomaron: **`release` ya no
repite la suite** —pregunta por la corrida verde del mismo commit—, y **`fotos` y
`montaje` corren una guardia corta** sobre lo publicado (13 baterías, 47 s
frente a 102 s de la suite en la misma máquina). La guardia lleva una condición
que allá no tiene: solo se usa si el último commit de CÓDIGO tiene `pruebas` en
verde; si no se puede confirmar, corren todas (`pruebas/publicacion.sh`).

**M1 queda cerrado entero** (21 de septiembre): los dos criterios de B-2 que
hablaban del panel los cerró D-5.

### M2 · La tienda para todo producto

**C-1 · Variantes**  · 8 pts *(partir en contrato / maestro / página)*
> Como comerciante de cosmética, quiero vender un labial en tres tonos sin
> crear tres productos.

> **Cerrada.** Las tres partes —contrato, maestro y página— están hechas y
> probadas por separado: `variantes.js` cubre la hoja y el maestro, `varpag.js`
> la página. Las dos baterías se verificaron ROJAS con el defecto puesto antes
> de darlas por buenas.

- [x] Columna `Variantes` **al final** de `Catálogo` (regla: solo se agrega, y
      solo al final), opcional, con sintaxis corta y explicada en la hoja:
      `Talla: S|M|L ; Color: Rosa|Nude`. *(Tope de cuatro grupos y veinticuatro
      opciones. Documentada en `CONTRATOS.md`, que es lo que `esquema.js` exige:
      el contrato escrito y el que corre son dos copias del mismo procedimiento
      y están atadas.)*
- [x] El maestro las devuelve estructuradas; lo ilegible se reporta con su celda
      y **no se adivina**. *(Y **el catálogo falla abierto**: una celda que no se
      entiende deja el producto a la venta sin variantes, porque perder la venta
      callando es peor. El precio es lo contrario y por eso ese sí tumba el
      producto — la batería fija esa diferencia a propósito.)*
- [x] La página obliga a elegir antes de agregar al carrito; la elección viaja
      en el mensaje de WhatsApp y al pedido (columna `Variante`, al final).
      *(La ficha pinta un selector por grupo, la tarjeta dice «Elegir» en vez de
      agregar a ciegas, y sin elegir no se agrega: se NOMBRA lo que falta, que
      es lo único que el maestro no puede hacer —él acepta el pedido sin
      elección y avisa, porque rechazarlo pierde una venta que el comerciante
      resuelve con un mensaje; exigirla mientras el comprador mira la pantalla
      es trabajo de la página—. La línea del pedido pasa a ser
      `id:cantidad:Grupo=Opción;Grupo=Opción`, la arma UNA sola función —antes
      el `id:cantidad` estaba escrito a mano en tres sitios, patrón 2 en su
      forma más cara: sellar un pedido y registrar otro— y una opción con
      `, : ; = |` tumba su grupo, porque rompería esa línea en silencio.)*
- [x] El catálogo de respaldo las lleva: sin red, las variantes siguen ahí.
      *(Los campos del respaldo se listan uno a uno a propósito, así que uno
      nuevo hay que nombrarlo o se queda fuera en silencio.)*
- [x] Interruptor `f_variantes`. *(Lo lee `aplicarConfiguracion`, con la misma
      regla que `f_autoria`: apagado solo con un «No» explícito, encendido
      incluso antes de que conteste el maestro. En «No» la página vuelve a ser
      exactamente la de antes, línea del pedido incluida.)*
- [x] **El stock es del producto, no de la variante** — decisión consciente, con
      su disparador para revisarla: el primer comercio que pierda una venta por
      una talla agotada. *(Con su consecuencia resuelta: dos tonos del mismo
      labial son dos líneas que compiten por las mismas existencias. Con la
      clave puesta solo en el id, la segunda se perdía en silencio.)*
      **→ Revisada el 21 de septiembre: el disparador se cumplió y el stock baja
      a la variante. Es C-1b, justo debajo, y la decisión 11 de `DECISIONES.md`.**

**C-1b · Inventario y fotos por variante (SKU)**  · 8 pts · ✅ 21-sep-2026
> Como comerciante de ropa, quiero que al vender una camiseta básica **rosa
> talla M** se descuente esa y no todas las básicas, y que el comprador vea la
> foto del color que está eligiendo.

- [x] **Una pestaña nueva, `Inventario por variante`**: `ID producto` ·
      `Combinación` · `Stock` · `Código` · `Nota`. *(Sin columna Imágenes: la
      decisión de las fotos —«el nombre es el dato»— la hizo innecesaria.)*
- [x] **Los topes**: 3 grupos, 20 opciones, 100 combinaciones, en los tres
      sitios. *(Y ahora sí hay una aserción que compara los tres: el
      comentario de C-1 decía que `variantes.js` lo comprobaba, y no lo hacía.)*
- [x] **Las filas las escribe el maestro**, con el stock vacío; las que dejan
      de casar se marcan en `Nota` y no se borran. Si la opción vuelve, vuelven
      con su número.
- [x] **La verdad del stock está en esa pestaña** y `Catálogo › Stock` es la
      suma escrita por el maestro. *(Con una condición que el plan no decía y
      que hace posible la compatibilidad: el producto pasa a venderse por
      combinación solo cuando UNA fila tiene un número. Generar las filas no
      agota la tienda.)*
- [x] **El pedido se valida por combinación.** *(La aserción de C-1 no se
      borró: sigue valiendo para los productos sin filas, y `inventario.js`
      prueba la invertida.)*
- [x] **Pagado descuenta la combinación, y solo esa**; Cancelado la devuelve a
      la misma. *(Una línea que no casa —sin elección, o una combinación
      renombrada— NO se descuenta del producto: la suma se lo comería. Se
      anota en Errores.)*
- [x] **La página**: opción sin existencias marcada y deshabilitada, «Últimas
      N» de la combinación, «Agotado» en la tarjeta solo si se acabaron todas.
- [x] **Las fotos por opción, y el nombre es el dato**:
      `camiseta-basica--color-rosa-1.jpg`. El panel pregunta «¿de qué opción es
      la foto?» y el maestro la nombra.
- [x] **Lo que ve el comprador**: al elegir Rosa, las fotos de Rosa; sin
      fotos propias, las generales. 6 generales y 4 por opción.
- [x] **Contrato**: `skus: [{ eleccion, stock }]`, al final y solo si manda.
      Horneado en `catalogo.json` y en el respaldo. *(Sin `imagenes` por sku:
      las fotos se leen del nombre.)*
- [x] **Compatibilidad**: con `Variantes` y sin números, exactamente como hoy.
- [x] **Fuera de esta historia**: precio por variante. Sigue fuera.
- [x] **Con D-2**: el stock de cada combinación se edita desde el panel
      (`guardar_combinaciones`, todo o nada, con huella por fila). Mientras
      manda la combinación, el Stock del producto se bloquea: es una suma.
      *(Y el cobro en línea aparta por combinación: pagar la última rosa M no
      bloquea la nude M.)*

**C-2 · SEO horneado**  · 5 pts · dep. A-2
- [x] JSON-LD de organización y sitio en la portada; de producto con oferta,
      precio, moneda y disponibilidad en cada ficha. Escrito en el HTML, no por
      JavaScript. *(Lo hornea `montar/sembrar-seo.mjs` desde
      `publicar/catalogo.json`, no de otra pregunta al maestro. Y lo que el
      comerciante no ha llenado —lo que la hoja siembra entre corchetes— NO se
      publica: un dato de contacto falso en los datos estructurados acaba en una
      ficha de empresa equivocada.)*
- [x] `sitemap.xml` y `robots.txt` generados en el horneado. *(Sin `<lastmod>`,
      que rompería el determinismo de A-6. Con su `Content-Type` declarado en
      `_headers`: un sitemap servido como texto plano lo ignoran algunos
      rastreadores sin decir nada.)*
- [x] `admin`, `tablero` y `pedido` con `noindex`. *(En `robots.txt` desde ya,
      con el nombre que tendrán. Las tres páginas son M3 y la 1.1; la aserción
      que exige `noindex` mira TODA página de `publicar/` que no sea la tienda,
      así que las está esperando — y hoy ya vigila el `404.html`.)*
- [x] Batería que valida el JSON-LD contra el esquema y que el sitemap lista
      exactamente los productos activos. *(`seo.js`, con una floristería
      inventada. Comprueba la forma que importa —tipos, oferta completa, enlace
      por ficha, agotado indexado como agotado— y que el sitemap publicado
      cuadre con el catálogo publicado. **No** valida contra el vocabulario
      formal de schema.org: eso pediría una dependencia nueva, y lo que rompe en
      la práctica es la forma, no el vocabulario.)*

**C-3 · Lo que el comprador necesita saber antes de comprar**  · 3 pts · ✅ 21-sep-2026
- [x] **Envío gratis anunciado**: «te faltan $12.000 para el envío gratis», con
      el umbral de la hoja y la misma regla de lectura que el maestro
      (`cifraDeTexto`: separador de miles sí, decimales no).
- [x] **Horario**: se pinta. Al pie de la tienda y en el carrito, «Te
      respondemos: …».
- [x] **Tienda cerrada** (`tienda_abierta`, `tienda_cerrada_mensaje`) y
      **mínimo de pedido** (`pedido_minimo`). *(Cerrada: aviso arriba de
      todo, se puede mirar, no se puede pedir. Mínimo: el botón dice cuánto
      falta. Y quien COBRA es el maestro: cerrada o por debajo del mínimo,
      `pago_crear` no cobra aunque la página se equivoque; un pedido que ya
      salió por WhatsApp desde una página vieja se registra igual. Un mínimo
      ilegible no es «sin mínimo»: se anota y ese total no se cobra en línea.)*

**C-4 · Orden del catálogo**  · 2 pts
- [x] El comerciante elige el orden por defecto desde la hoja o el panel; el
      comprador puede reordenar por precio. *(`orden_catalogo` en la hoja, con
      cinco valores y el de fábrica igual a lo que la tienda ya hacía —
      «Destacados primero»—, así que un comercio que no toque nada no ve ningún
      cambio. Desde el panel será M3: la clave ya está y la leerá el mismo
      formulario que las demás.)*
- [x] **Cuando el comprador pide un orden, la lista es ese orden y nada más: el
      destacado deja de flotar.** *(No es un detalle de implementación: un
      «precio, de menor a mayor» que empieza por el producto de $28.000 porque
      alguien lo destacó es un control que miente, y quien compra no tiene cómo
      saberlo — cree que ese es el más barato. Destacar es una posición dentro
      del orden del comercio, no una chincheta que gana siempre. Su aserción
      está escrita a propósito como la central de la batería.)*
- [x] `VISIBLES` guarda el orden de la hoja y el orden se aplica al pintar.
      *(Antes se guardaba ya reordenado con los destacados delante, lo que
      borraba para siempre el dato «en qué orden lo escribió el comercio» — y
      eso es justo una de las cinco opciones. Arrastró una aserción de
      `hoja.js`, que preguntaba por la lista interna cuando lo que quería saber
      era lo que ve el comprador; ahora mira la rejilla.)*
- [x] Un valor que no es ninguno de los cinco **no deja la tienda sin vitrina**:
      cae al de fábrica y lo dice en la consola con la lista de los buenos.
      *(Fallo abierto en el catálogo, como siempre.)*
- [x] Batería `orden.js` (21 aserciones), verificada ROJA con cinco defectos
      puestos: el destacado flotando siempre, los nombres comparados sin las
      reglas del español, la hoja pisándole el orden al comprador, el cambio de
      orden sin volver a la página 1, y el valor ilegible tragado en silencio.

---

### M3 · El panel básico del comerciante   · la mitad del trabajo del MVP

**D-1 · Entrar**  · 5 pts
> Como comerciante, quiero entrar a administrar mi tienda con un usuario y una
> clave, sin abrir una hoja de cálculo.

> **Cerrada.** El maestro con D-1 (`entrar.js`, verificada ROJA con siete
> defectos) y la pantalla con D-2: `admin.html` pide usuario y clave, guarda el
> testigo en la pestaña y vuelve al formulario —diciendo por qué— en cuanto la
> sesión se cae. Con D-2 `entrar` y todas las puertas del panel pasaron a ser
> **solo por POST**: por GET la clave iba en la dirección.

- [x] Usuario en la configuración; **hash con sal de la clave en las propiedades
      del proyecto**, nunca en la hoja ni en el repositorio. *(`panel_usuario`
      en la hoja porque es un nombre y el comerciante tiene que poder verlo;
      `PANEL_CLAVE` = `sal$huella` en las propiedades. Y está escrito hasta
      dónde llega eso: quien pueda abrir el proyecto lee las propiedades y ya
      tiene la hoja entera — la huella protege de que la clave acabe en una
      captura o en un correo de soporte, que es por donde se pierden.)*
- [x] Al entrar, el maestro devuelve un testigo firmado con vencimiento de ocho
      horas; el navegador lo manda en cada petición (`?k=`). *(`usuario | vence
      | hojaId | trozo de la huella`, firmado con una firma propia de esta
      tienda.)*
- [x] Cinco intentos fallidos bloquean quince minutos y quedan anotados.
      *(Y cuentan **aunque el usuario no exista**: contar solo los del usuario
      bueno convierte el contador en un detector de usuarios. Se anotan sin
      agrupar, al revés que los errores normales: aquí lo repetido es el dato.)*
- [x] Un testigo vencido o falseado se rechaza sin decir cuál de las dos cosas.
      *(Una sola frase para los dos casos, y la misma para el que viene de otra
      tienda.)*
- [x] La clave se pone la primera vez desde el menú de la hoja, no por la web.
      *(Y **la inventa el maestro** en vez de pedirla: desde una opción de menú
      no hay forma de escribirla sin que viaje por la red, y una clave elegida
      es el nombre del negocio con un 1 detrás. Se enseña una vez, no se puede
      volver a ver, y volver a usar la opción cierra las sesiones abiertas.)*
- [x] Batería de seguridad: sin testigo no se escribe nada; con testigo de otra
      tienda tampoco. *(Y esa segunda **sigue parando aunque las dos tiendas
      acabaran compartiendo la firma**, que es el escenario de los secretos
      cruzados de `DESPLIEGUE.md` — el fallo más caro de este proyecto, porque
      corre entero en verde. Sin el `hojaId` dentro del testigo, quitarlo no
      rompería nada.)*
- [x] **Cada puerta declara a quién deja pasar** (`PUERTAS`), y la guardia se
      aplica en un solo sitio. *(Antes eran once `if` y once comprobaciones
      escritas a mano dentro de cada función: el día que alguien agrega la doce
      y se le olvida la suya, esa puerta se comporta exactamente igual que una
      que funciona. Ahora `esquema.js` fotografía la lista, así que una puerta
      nueva obliga a un `--congelar`, que es un acto deliberado que alguien
      mira; y una guardia mal escrita **no abre**.)*

**D-2 · Productos**  · 8 pts *(partir: listar+editar / crear+borrar / foto)*
> **Cerrada**, las tres partes. El maestro con `productos.js` (52 aserciones) y
> la pantalla con `admin.js` (39), las dos verificadas ROJAS con sus defectos
> puestos —once en el maestro, siete en la página— antes de darlas por buenas.

- [x] Listar con búsqueda y filtro; crear, editar, activar/desactivar y borrar.
      *(`publicar/admin.html`, horneado desde `plantilla/admin.html` por
      `montar/preparar-admin.mjs` con la dirección del maestro sacada del
      `index.html` recién horneado y de ningún otro sitio: la tienda y su panel
      tienen que hablarle al mismo maestro. La lista trae también los
      desactivados, y **las cifras llegan como están escritas**: si la hoja dice
      «doce mil», el formulario enseña «doce mil» en rojo, no un 0 que se
      guardaría sin mirar. **Borrar no borra**: la fila entera va a una pestaña
      `Papelera`, con fecha, y se recupera copiándola de vuelta.)*
- [x] Toda escritura bajo `LockService`, con el saneado que ya cierra la
      inyección de fórmulas, y validando el contrato antes de escribir.
      *(Y **contra lo que se leyó**: cada producto viaja con la huella de su fila
      y guardar la exige. Sin eso, corregir una tilde en un formulario abierto
      hace diez minutos devolvía el stock de hace diez minutos y resucitaba lo
      que se vendió entre medias. Al escribir se **falla cerrado**, al revés que
      al leer: lo que no valida no entra, y el error lo dice en palabras del
      comerciante. Una coma dentro de una variante se rechaza aquí, que es el
      único sitio donde se puede avisar antes de que la tienda la tumbe.)*
- [x] Cada escritura lleva un identificador de operación: reintentar no duplica.
      *(El número nace al ABRIR el formulario, no al pulsar Guardar, así que el
      reintento es el mismo gesto. Y no basta con «no duplica»: con un número
      nuevo tampoco duplicaría —el maestro rechaza el código repetido—, pero
      el comerciante leería «ya hay un producto con ese código» sobre el que
      acaba de crear. `admin.js` lo prueba perdiendo la respuesta DESPUÉS de
      que el maestro guardó, que es el caso real del celular sin señal.)*
- [x] **Subir la foto desde el panel**: el maestro la guarda en la carpeta de
      Drive con el nombre que le corresponde. Quita el error más común del
      producto —el nombre de archivo que no coincide—. *(`<código>-<n>.<ext>`,
      con el primer número libre en la celda Y en la carpeta, para no pisar una
      subida a mano. La página la achica antes de mandarla —1600 px, JPEG—, y
      toma la versión nueva de la fila al terminar: si no, el siguiente Guardar
      diría «cambió mientras lo editabas» por la foto que el propio comerciante
      acaba de subir.)*
- [x] Si la subida falla por tamaño o por tiempo, lo dice y **el camino viejo
      sigue existiendo**: subirla a Drive a mano. *(El mensaje dice **el nombre
      exacto** que tiene que llevar el archivo. Y si Drive no deja escribir, la
      celda no se toca: la hoja no puede decir que hay una foto que no existe.)*

**D-3 · Pedidos**  · 5 pts · ✅ 21-sep-2026
- [x] Lista con estado, fecha y total; abrir uno y ver qué se pidió.
      *(Filtro por estado con su cuenta, y uno más: **Revisar**, para los
      pedidos cuyo estado la hoja no entiende. Un «pagadito» escrito a mano no
      se muestra como «Nuevo»: sale tal cual, sin poder elegirse, y el
      comerciante elige el bueno.)*
- [x] Cambiar el estado desde el panel, con el mismo efecto sobre el inventario
      que tiene hacerlo en la hoja. *(No «el mismo efecto» por copia: el panel
      y el `alEditar` de la hoja llaman a la MISMA función,
      `trasCambiarEstado`. Y la página **lo dice antes de guardar**: «al guardar
      se descuentan 2 × Croissant», «al guardar VUELVEN al inventario…». Lo que
      devuelve stock o cancela pide un segundo toque. Al escribir la prueba
      apareció una **tercera copia** de la regla de venta en `recalcularResumen`
      —`indexOf('confirmado')`—: un pedido «Pagado» no contaba en Más vendidos
      ni gastaba los usos de un cupón con tope. Arreglada con `esVenta`.)*
- [x] No se muestra ni se guarda ningún dato personal que hoy no se guarde.
      *(La respuesta sale de una lista cerrada de campos; `panelpedidos.js` lo
      comprueba contra la lista, no contra lo que hoy haya en la hoja.)*

**D-4 · Configuración**  · 3 pts · ✅ 21-sep-2026
- [x] Las claves que toca el comerciante: textos de portada, colores, horario,
      envío gratis, contacto. Con su explicación al lado. *(Pestaña «Tu
      tienda», agrupada. La lista es `CLAVES_DEL_PANEL` en el maestro.)*
- [x] Un valor ilegible se marca y **no se degrada a cero ni a apagado**.
      *(«tal vez» en un interruptor sale como «tal vez — no se entiende»,
      elegido; y al guardar otra cosa, esa clave **no se toca** porque nadie la
      cambió. Guardar es todo o nada, con el error junto a cada campo.)*
- [x] Las claves técnicas no aparecen aquí. *(Y no se pueden escribir
      pidiéndolas por su nombre, **aunque la petición traiga su versión
      buena**: la primera versión de la prueba mandaba la versión mal y pasaba
      con la lista quitada, porque lo que la paraba era el control de
      concurrencia.)*

**D-5 · Publicar**  · 3 pts · dep. B-2 · ✅ 21-sep-2026
- [x] Un botón. Dice si hay cambios sin publicar y cuándo fue la última vez.
      *(«La última vez» se le pregunta a la **tienda** —el `generado` de su
      `catalogo.json`—, no a la hoja. «Cambios sin publicar» = una edición que
      cambia la vitrina después de eso; pagar un pedido no cuenta, o el aviso
      estaría encendido todo el día. Si la tienda no contesta, dice **que no
      sabe**, nunca «al día».)*
- [x] Guardar **no** publica: publicar es un gesto explícito, y cuesta minutos.
      *(La barra lo dice en todos sus estados. El botón y el menú de la hoja
      disparan por la misma función; un doble toque es un solo disparo.)*
- [x] Mientras corre, el panel enseña el estado; al terminar, el resultado.
      *(Pregunta cada 8 s por la última ejecución de `fotos.yml`, con enlace al
      detalle. Si terminó mal, dice que la tienda sigue como estaba.)*

**D-6 · Registro de cambios**  · 2 pts · ✅ 21-sep-2026
- [x] Cada escritura deja una fila en la pestaña `Registro`: cuándo, desde
      dónde (Panel, Hoja, Bold), quién, qué, dónde, antes y después. *(Desde el
      panel se escribe en `conOperacion`, el único sitio por donde pasan todas
      las escrituras, bajo la misma llave; lo rechazado y lo repetido no se
      anotan. Desde la hoja, `alEditar` con el valor viejo y el nuevo. Un pago
      aprobado en línea también.)*
- [x] Es lo único que contesta «yo no borré eso» sin adivinar. *(Con un límite
      dicho: Apps Script no deja cerrar una pestaña a su dueño. Va protegida
      con aviso, y editarla a mano queda escrito en ella misma.)*

**D-7 · La guía del comerciante, rehecha para el panel**  · 2 pts · ✅ 21-sep-2026
- [x] La guía de una página pasa a explicar el panel, no la hoja.
      *(`GUIA-COMERCIANTE.md` y la imprimible. Y se corrigió una frase falsa
      desde B-2: «sola se pone al día cada cuatro horas».)*
- [x] Sigue cabiendo en una página. *(Menos de 100 líneas, y nombra todas
      las opciones del menú: `montaje.js` lo exige.)*

---

### M3.5 · Cobrar en línea   · entró al MVP el 21 de septiembre de 2026

> **El riesgo que lo abre, y que ya existe hoy.** Dos compradores pueden pedir
> la última unidad a la vez. La hoja valida el stock al armar el pedido
> (`?a=validar`), pero **no lo aparta**: el inventario solo baja cuando el
> comerciante marca el pedido como Pagado. Hoy eso se resuelve a mano —el
> comerciante confirma uno y le escribe al otro que ya no hay—, y es incómodo
> pero nadie pierde plata. **Con un botón de pago deja de resolverse a mano:**
> los dos pagan, y a uno hay que devolverle el dinero. Por eso la primera
> historia de este hito es apartar la unidad, y va **antes** que el proveedor.

**E-1 · Apartar la unidad mientras se paga**  · 5 pts · ✅ 21-sep-2026
- [x] Al empezar a pagar, el maestro **aparta** las unidades por un tiempo
      corto (15 minutos), bajo llave. Lo disponible es el stock menos lo
      apartado que no ha vencido, y es lo que usan la validación y el botón de
      pagar. *(No en una pestaña sino en una propiedad, `COBROS_ABIERTOS`: la
      validación la lee con cada cambio del carrito, y leer una propiedad
      cuesta mucho menos que leer una hoja. El libro para las personas es la
      pestaña `Pagos`.)*
- [x] Al segundo comprador se le dice **antes de pagar**: «la última unidad la
      está pagando otra persona; vuelve en unos minutos». Nunca después.
      *(Y no se le cobra un carrito recortado: si el maestro tuvo que quitar
      algo, `pago_crear` no firma y la página lo dice.)*
- [x] La reserva se vuelve venta cuando el pago se confirma, o vence sola.
      Sin disparador que la limpie: lo vencido se ignora al leer.
- [x] Funciona por combinación cuando exista C-1b. *(El apartado va por id de
      producto porque el stock hoy es del producto; cuando C-1b baje el stock a
      la combinación, la clave del apartado baja con él.)* *Nota: hecho con
      C-1b (0.7.0); el apartado guarda id, cantidad y variante.*
- [x] Batería con dos compradores a la vez sobre la última unidad. *(`pagos.js`
      §6 y `pagoweb.js` §4.)*

**E-2 · Elegir el proveedor**  · 2 pts · ✅ Bold (decisión 12, cerrada)
- [x] PSE y tarjeta, con **pago en la página del proveedor**: Bold, Botón de
      pagos. Los datos de la tarjeta nunca pasan por la tienda.
- [x] **El criterio que decide**: Bold deja consultar una transacción por su
      referencia (`GET /v2/payment-voucher/<referencia>`). Y ya estaba
      validado con una compra completa de pruebas en la línea anterior.
- [ ] Comparar comisión y días de desembolso con números de la tienda real.
      *(Queda para cuando haya una tienda cobrando: el adaptador es uno solo,
      y cambiar de proveedor no toca carrito, pedidos ni inventario.)*

**E-3 · Cobrar**  · 5 pts · ✅ 21-sep-2026
- [x] El botón lleva al pago con **la referencia del pedido y el total que
      calculó el maestro**, nunca el de la página. La firma la calcula el
      maestro con la llave secreta, que vive en las propiedades del proyecto.
- [x] Al volver del pago, la tienda le pregunta al maestro cómo quedó, y lo
      dice. *(Sin creerle a la dirección de vuelta: `pagoweb.js` vuelve con
      `bold-tx-status=approved` y exige que la página NO diga «pagado».)*
- [x] Interruptor por tienda: `cobro_modo` en la hoja. Sin proveedor
      configurado, el pedido sigue por WhatsApp como hoy. *(Y con la pasarela
      pedida pero sin llaves, también: la tienda no se queda muda.)*

**E-4 · Confirmar el pago sin creerle al aviso**  · 5 pts · ✅ 21-sep-2026
- [x] `doPost` no ve las cabeceras, así que no se usa el aviso de Bold: **la
      verdad se le pregunta a su API**, por la referencia.
- [x] Se pregunta al volver el comprador (con freno: una consulta cada 20 s
      por cobro, aunque la página insista) y con un disparador cada 5 minutos
      **solo mientras haya cobros abiertos** —se crea con el primero y se borra
      solo—. La revisión de cada hora también concilia, de red.
- [x] Aprobado y con el monto calculado → el pedido entra a `Pedidos` ya
      Pagado, y el inventario se mueve por `trasCambiarEstado`, llamado, no
      copiado. Idempotente: preguntar otra vez no duplica pedido, descuento
      ni correo.
- [x] Un monto distinto **no** se da por pagado: `Revisar monto`, con los dos
      números en Errores.

**E-5 · Lo que sale mal**  · 3 pts · ✅ 21-sep-2026
- [x] Aprobado con la reserva vencida y la unidad ya vendida: **«Pagado sin
      existencias»**, con correo al comercio: conseguir o devolver.
- [x] PSE pendiente: la reserva se sostiene de a 15 minutos mientras Bold diga
      pendiente, hasta las 24 horas en que Bold deja consultar; al tope,
      `Vencido` y, si Bold seguía «en curso», aviso en Errores.
- [x] Rechazado o abandonado: la reserva se libera y la página lo dice, con el
      carrito intacto.

*(Todo el detalle operativo —llaves, prueba de sandbox, qué se portó de la
línea anterior y qué se hizo distinto— en `docs/PAGOS-BOLD.md`.)*

### M4 · El tablero   · entró al MVP el 21 de septiembre de 2026

> **Por qué entra, y por qué es barato.** El comerciante ya tenía sus números
> en la pestaña Tablero de la hoja, pero M3 le quitó la hoja como interfaz: lo
> que no esté en el panel, para él no existe. Las cuentas ya estaban hechas y
> probadas (`calcularMetricas`, `tablero.js`), y la sesión del panel ya existía.
> Lo que faltaba era una puerta de solo lectura y el dibujo.

**T-1 · La puerta del tablero**  · 2 pts · ✅ 21-sep-2026
*Como comerciante, quiero ver mis números en el panel sin abrir la hoja.*
- [x] Puerta `tablero`, con sesión y solo por POST, **al final** de `PUERTAS`
      (R1). Congelada en `esquema.json`.
- [x] Sale de `calcularMetricas()` y de ningún otro sitio: la pestaña Tablero,
      el correo del día y esta puerta leen la misma función. Las variaciones
      también llegan hechas, con la `variacion()` de la hoja.
- [x] **Ni un dato de un comprador**: pedidos contados, productos por nombre,
      ciudades por cuántos pedidos. Ni el número de pedido viaja.
- [x] Listas con tope (20) y el total aparte: «y 7 más».

**T-2 · Las gráficas, en el panel**  · 3 pts · ✅ 21-sep-2026
*Como comerciante, quiero entender de un vistazo cómo va el mes.*
- [x] Pestaña **Tablero** en `admin.html`: cuatro cifras (ventas, pedidos,
      ticket, cierre) contra el mes pasado **a la misma altura**; ventas mes a
      mes (seis meses); embudo carrito → pedido → venta; lo más vendido;
      dónde compran; para atender hoy; inventario.
- [x] **SVG escrito a mano, sin librerías.** Cada gráfica con `role="img"`,
      su resumen en palabras, y **su tabla debajo** con las mismas cifras.
- [x] Lo que viene de la hoja entra por `escapar()`, **también dentro del SVG**
      —un `<img>` dentro de un `<svg>` pintado con innerHTML se ejecuta—.
- [x] Sin ventas, lo dice en vez de dibujar barras vacías.
- [x] En un celular de 390 px no hay que desplazarse de lado.

**T-3 · Una petición por visita**  · 1 pt · ✅ 21-sep-2026
- [x] Se pide al abrir la pestaña, no al entrar al panel. Ir y volver no
      vuelve a pedir; **Actualizar** sí. Nada se refresca solo ni se programa:
      cada lectura es una ejecución de Apps Script (§6).
- [x] Salir borra lo leído: el siguiente en el computador del mostrador no ve
      las ventas del anterior.

**Lo prueba** `pruebas/paneltablero.js` (24 aserciones), con sus controles
negativos verificados en rojo: la puerta sin guarda, una cuenta copiada que se
desvía un peso, la página que vuelve a pedir en cada visita y el nombre sin
escapar dentro del SVG.

**Qué no hace, a propósito:** no dibuja tendencias diarias ni compara años —la
hoja no guarda visitas, y con cientos de pedidos al mes una serie diaria es
ruido—; no exporta; no se ve sin sesión.

### M3 bis · El panel alcanza para todo   · pedido por el dueño el 21 de septiembre de 2026 · 0.9.0

> Después de probar el panel y el cobro en la tienda de pruebas, el dueño pidió
> tres cosas: que todo lo que se escribe a mano en la hoja se pueda hacer desde
> el panel, que el panel sean **dos pantallas** y no cuatro pestañas, y que la
> hoja siga funcionando igual como respaldo. Son historias de M3 que vuelven a
> abrirse, por eso llevan la D.

**D-8 · Dos pantallas: Ventas y Tienda**  · 2 pts · ✅ 21-sep-2026
- [x] **Ventas**: las cuatro cifras del mes y lo que hay que atender hoy,
      arriba; los pedidos; las gráficas debajo. Se entra por aquí.
- [x] **Tienda**: los productos arriba; debajo, los ajustes en secciones
      plegables, Zonas de envío y Cupones. Releer no cierra la sección abierta.
- [x] El tablero sigue siendo una petición por visita a Ventas; los productos
      se piden al abrir Tienda, no al entrar.

**D-9 · Toda la configuración desde el panel**  · 3 pts · ✅ 21-sep-2026
- [x] Salen las 48 claves que se escriben a mano. Quedan fuera dos, a
      propósito: `correo_ultimo` (la escribe el script) y `panel_usuario` (va
      con la clave, que solo da el menú de la hoja).
- [x] **Lo que decide a dónde va la plata pide la clave otra vez**: WhatsApp,
      `cobro_ambiente` y los cuatro `pago_*` (decisión 14). Sin ella no se
      escribe nada; una clave mala cuenta como intento fallido de entrar; la
      clave no queda en ninguna pestaña ni en la página.
- [x] Las **llaves de Bold no** están en el panel: siguen en las propiedades
      del script.
- [x] **La transformación de fotos se elige de una lista** (0.10.0, pedido del
      dueño): Ninguna, o Cloudflare en el propio dominio —desactivada en
      `*.workers.dev`, donde no existe—. Lo que ya estaba escrito queda como
      «Personalizada». Los proveedores del mercado (Cloudinary, ImageKit) se
      agregan a la lista cuando haya una tienda con cuenta.
- [x] La sección «El cobro» dice cómo se está cobrando de verdad, y arriba de
      las dos pantallas sale un aviso rojo si la hoja pide Pasarela y la tienda
      sigue por WhatsApp, con el porqué (bitácora 57).

**D-10 · Zonas de envío y cupones desde el panel**  · 3 pts · ✅ 21-sep-2026
*(era el 2.1 del `ROADMAP.md`)*
- [x] Una fila a la vez, con huella y número de operación, como un producto.
- [x] El código de una zona no cambia después de creada: viaja en los pedidos.
- [x] «Usos confirmados» es del script: editar un cupón no lo toca, y una venta
      con el cupón no invalida la edición. Un cupón usado no se borra: se
      desactiva.
- [x] Una zona marca «cambios sin publicar» (se hornea); un cupón funciona al
      guardarlo.

**E-6 · El botón de pago dice PSE**  · ½ pt · ✅ 21-sep-2026
- [x] «Pagar con PSE» con dinero real y «Pagar con PSE - Pruebas» en el
      ambiente de pruebas, como lo pidió el dueño.

**Lo prueba** `pruebas/panelajustes.js` (36 aserciones), más `admin.js`,
`panelconfig.js` y `paneltablero.js` al día. Controles negativos verificados en
rojo: sin la guarda de la clave, sin el alias de las llaves, un cupón que pisa
los usos, una zona que cambia de código.

### M5 · El rastreo del pedido   · entró al MVP el 21 de septiembre de 2026 · 0.10.0

> **El plan, antes de construir.** El `ROADMAP.md` (S2) ponía una condición
> previa y no negociable: **el número de pedido no se puede poder adivinar**.
> El número son cinco caracteres (≈33 millones), se dice en voz alta y sale en
> las guías: no alcanza. En vez de alargarlo —el comerciante y el comprador lo
> leen y lo dictan—, el enlace lleva **aparte** un secreto de 16 caracteres
> (80 bits) del que la hoja guarda solo la huella (decisión 15). Cinco
> historias, en este orden: primero lo que no se puede adivinar, después la
> puerta, después la página, y al final los dos caminos por donde llega el
> enlace.

**R-1 · Lo que no se adivina**  · 2 pts · ✅ 21-sep-2026
- [x] El número del pedido y el secreto salen de `crypto.getRandomValues` en
      la página y de `Utilities.getUuid` en el maestro; ya no de `Math.random`.
- [x] Columna nueva **`Seguimiento`** en Pedidos, al final (R1): la huella
      SHA-256 del secreto, en todas las líneas. Nunca el secreto.

**R-2 · La puerta `seguimiento`**  · 2 pts · ✅ 21-sep-2026
- [x] Pública y **solo por POST**: el secreto no queda en una dirección.
- [x] Contesta estado en palabras del comprador, pasos con fecha, guía (si se
      despachó), qué pidió y el total. **Nada del comprador, ni la ciudad.**
- [x] **Un intento fallido no dice nada**: número que no existe, secreto malo,
      formato raro o pedido sin enlace dan la misma respuesta, byte a byte.
- [x] Interruptor `f_rastreo` (Sí de fábrica; vacío también es Sí).

**R-3 · La página `pedido.html`**  · 2 pts · ✅ 21-sep-2026
- [x] Horneada por `preparar-admin.mjs` con la misma dirección del maestro
      que el index. `noindex`, `no-referrer`, fuera del sitemap. Una petición,
      nada guardado en el navegador, lo de la hoja pintado como texto.
- [x] Sin enlace completo o con uno malo: lo dice y ofrece WhatsApp.

**R-4 · El enlace llega solo**  · 1 pt · ✅ 21-sep-2026
- [x] **WhatsApp:** «Sigue tu pedido: …» en el mensaje, en todas sus versiones
      (también la recortada), y en la pantalla de «pedido enviado».
- [x] **Pasarela:** el secreto viaja con `pago_crear`, el pedido aprobado
      hereda la huella, y la pantalla de «pago confirmado» trae el enlace.

**R-5 · El enlace desde el panel**  · 1 pt · ✅ 21-sep-2026
- [x] En el detalle del pedido: «Crear enlace de seguimiento» (o uno nuevo, con
      segundo toque, porque el anterior deja de servir), Copiar y Mandarlo por
      WhatsApp. Sirve para los pedidos de antes de M5.

**Lo prueba** `pruebas/rastreo.js` (39 aserciones) y, de paso, `esquema.js`
—que ahora también se niega a que una función del maestro se declare dos
veces (bitácora 58)—. Controles en rojo: sin comparar la huella, y guardando
el secreto en vez de su huella.

**Qué no hace, a propósito:** no manda avisos al comprador cuando cambia el
estado (eso pediría su celular o su correo, y la hoja no los guarda); no
permite buscar por número sin el secreto.

### 0.11.0 · Cuatro del ROADMAP, pedidas por el dueño el 21 de septiembre de 2026

> No son hitos del MVP: son historias del `ROADMAP.md` que el dueño adelantó,
> más un arreglo de lo que más se nota lento. Se numeran como en el ROADMAP.

**2.3 · Recuperar la clave sin el operador**  · 2 pts · ✅
- [x] «¿Olvidaste tu clave?» en la entrada del panel manda un código de 8
      cifras **al correo de la tienda** (`correo_resumen`, o `empresa_correo`),
      con el usuario dentro. No se pregunta el usuario: no se puede averiguar
      si existe.
- [x] 15 minutos, cinco intentos por código, cada intento malo cuenta en el
      bloqueo de la entrada, tres códigos por hora. Del código solo la huella.
- [x] Con el código, una clave nueva (la misma que da el menú), una vez; las
      sesiones abiertas se cierran. Queda en el Registro y en Errores.

**4.1 · «Avísame cuando llegue»**  · 2 pts · ✅ (decisión 16)
- [x] En lo agotado —tarjeta y ficha—, el botón abre WhatsApp con el pedido de
      aviso, y la pestaña nueva **Avísame** cuenta cuántos esperan, sin nadie
      dentro. Solo cuenta lo agotado; una vez por producto y visita.
- [x] Cuando vuelve a haber: Ventas › **Te están esperando** y el correo del
      día (que sale aunque no haya otra cosa). «Ya les avisé» borra la cuenta.
- [x] `f_avisame` (Sí de fábrica).

**4.4 · Columnas del catálogo**  · 1 pt · ✅
- [x] `catalogo_columnas`: 3 (de fábrica), 4 o 5 en pantalla ancha; el celular
      no cambia. Con 5 la página se ensancha a 1.400 px; con 4 la paginación va
      de 24 en 24. Lo que no se entiende se lee como 3. La foto de la tarjeta
      sigue pidiéndose a 600 px: con más columnas es más chica en pantalla, y
      las medidas horneadas son 160/600/900.

**4.5 · Dominio propio**  · 1 pt · ✅ (decisión 17)
- [x] `nombrar-worker.mjs` escribe en `wrangler.jsonc` el *custom domain* que
      sale de `sitio_url` —de fábrica, `tienda.laboratorio-digital.com`— y lo
      quita si la hoja vuelve a `workers.dev`. Pasos en `DESPLIEGUE.md`.
- [x] Con dominio propio, la transformación de fotos de Cloudflare se puede
      elegir en el panel.

**El indicador de carga al entrar**  · ½ pt · ✅ (pedido del dueño)
- [x] El botón gira y dice «Entrando…»; a los cuatro segundos explica que la
      tienda se está despertando; al volver con la sesión guardada se ve
      «Abriendo tu panel…» y no una pantalla en blanco.

**Lo prueban** `recuperar.js` (27) y `avisame.js` (24), más `montaje.js` (el
dominio). Controles en rojo: sin el tope de códigos, sin el tope por código
—que el bloqueo general tapaba, bitácora 60—, y contando lo que no está
agotado.

### 0.12.0 · Lo que encontró la prueba real, y lo que se sentía lento

**R-6 · El rastreo de un pago en línea no depende del navegador**  · 1 pt · ✅
- [x] El secreto lo pone el maestro (número + firma de la tienda); llega por
      `pago_crear`, por `pago_estado` al aprobarse y en el correo al comprador.
      La pantalla de «pago confirmado» y el WhatsApp opcional lo traen aunque
      el comprador vuelva de Bold en otra pestaña (bitácora 61).
- [x] El Registro dice quién aprobó: «Pasarela Bold · transacción».
- [x] En la pantalla de pago: «si el botón de tu banco no abre, paga por PSE o
      prueba con otro navegador» (Brave bloqueó el de Bancolombia).

**D-11 · El panel que no hace esperar**  · 2 pts · ✅
- [x] Filtros y buscador de pedidos al instante, sin red; ninguna respuesta
      vieja pisa a una nueva; la lista no se vacía mientras carga (bitácora 62).
- [x] Los ajustes se repintan solo si cambiaron, y dicen «Cargando…» la
      primera vez; el tablero dice «Leyendo tus números…».
- [x] Recuperar la clave dice «Actualizando tu clave en el sistema…» mientras
      tanto.

### 0.12.1 · Publicar dos veces seguidas

**P-1 · Una segunda publicación sin nada nuevo no es un fallo**  · 0,5 pt · ✅
- [x] Si otra corrida ya publicó lo mismo, `fotos` dice «Ya estaba publicado»
      y sale en verde; el fallo de verdad (los pasos no ven lo mismo) sigue en
      rojo (bitácora 63).

### 0.13.0 · Una segunda persona, ver antes de publicar, y la flota

**2.2 · El colaborador**  · 2 pts · ✅
- [x] El dueño da y quita el acceso desde su panel, con su clave otra vez; la
      clave se ve una vez y no pasa por la caché (decisión 18, bitácora 64).
- [x] El colaborador lleva la tienda entera y en ajustes solo la vitrina y el
      modo de cobro; el maestro filtra y rechaza lo demás.
- [x] Sus sesiones son suyas; lo que hace queda a su nombre en el Registro.

**2.5 · Vista previa**  · 1 pt · ✅
- [x] «Vista previa» junto a Publicar abre la tienda con `?vista`: lo guardado
      en la hoja, un cartel, sin pedidos y sin tocar la hoja (bitácora 65).

**S3 · La flota, versión 1**  · 3 pts · ✅ (en `laboratoriodigital/tiendas`)
- [x] `flota.json`: dos líneas (`tienda`, `organico`), anillos; conectadas
      Laboratorio Digital, Orgánico y Cinnamon Beauty.
- [x] `estado` escribe ESTADO.md; `actualizar` abre un pull request por
      tienda, en ensayo de fábrica, comparando contra tres versiones
      (decisión 19, bitácora 66).

### 0.14.0 · Dos productos, la tienda que se actualiza sola, y el alta

**P-2 · Dos productos**  · ✅ (decisión 20)
- [x] Tienda Básica (`organico`) y Tienda Panel (`tienda`): líneas separadas en
      `flota.json`, cada una con su semilla y su modo.

**S3 v2 · Actualizar sin manos**  · 3 pts · ✅ (decisión 21, bitácora 68)
- [x] `semilla.json` + `montar/semilla.mjs` + `montar/actualizar-semilla.mjs`.
- [x] `montaje` con `semilla: true`: trae, publica el maestro, rehornea, corre
      todas las baterías y publica en main; vuelve atrás el maestro si falla.
- [x] Panel › Tienda › *Versión de tu tienda* y menú › *Actualizar a la última
      versión* (solo el dueño).
- [x] La flota dispara el montaje por anillos y espera; la Básica, por pull
      request que se fusiona solo tras sus pruebas (salvo `publicar/index.html`).

**3.3 · El alta**  · 2 pts · ✅ diseñado y probado sin red (bitácora 69)
- [x] `tiendas` › alta › `crear` y `conectar`; falta su primera corrida real.

### 0.15.0 · El alta que pide lo mínimo, y un aspecto más sobrio

**3.3 · El alta, segunda versión**  · 2 pts · ✅ (bitácora 70)
- [x] `alta`: tres campos; clona la última etiqueta de la semilla y la limpia
      de lo que es de otra tienda; comprueba el token antes y lo dice.
- [x] `conectar`: tres campos; saca la hoja y el proyecto del maestro, siembra
      comercio, dirección y repositorio, pone los secretos y monta.
- [x] El maestro acepta `repositorio` al sembrar.

**D-12 · El aspecto**  · 1 pt · ✅ (bitácora 71)
- [x] El panel del comercio: tinta, aire, bordes suaves, foco visible.
- [x] El panel de la flota (`tiendas/panel/index.html`), con el mismo lenguaje.

### 0.16.0 · Los secretos se siembran solos, y las fotos con dominio propio

**3.4 · Sembrar los secretos**  · 1 pt · ✅ (bitácora 72)
- [x] Puerta `permiso` en el maestro; `conectar` pone su `GITHUB_TOKEN` con
      `DISPARO_TOKEN`. A mano queda solo `CLASPRC`.
- [x] El Diagnóstico y la lista del alta dicen dónde está `conectar`.

**F-1 · Las fotos con dominio propio**  · 1 pt · ✅ (decisión 22, bitácora 73)
- [x] Las dos maneras, la de siempre de fábrica; el panel dice qué da cada una.
- [x] Montaje y Publicar comprueban que Cloudflare de verdad transforma.

### 0.17.0 · HOJA_ID en la versión implementada, y la hoja de administración

**C-1 · «Falta HOJA_ID» al conectar**  · 1 pt · ✅ (bitácora 74)
- [x] `A0_instalar` guarda `HOJA_ID` en las propiedades; el maestro las lee si
      la constante llega vacía. El mensaje y `conectar` dicen cómo salir.

**3.7b · La hoja de administración de tiendas**  · 1 pt · ✅ (bitácora 75)
- [x] Puerta `registrar_tienda` con clave propia; `conectar` registra la tienda
      (`PANEL_URL` + `PANEL_CLAVE`) sin tocar lo del operador.
- [x] Columna *Producto* al final; el aspecto de los paneles.
- [x] Fuera `tienda-nueva.yml`, el alta con los campos viejos.

### 0.18.0 · El stub de otra tienda, volver atrás y el portal

**C-2 · El stub de la tienda equivocada**  · 1 pt · ✅ (bitácora 76)
- [x] El stub manda el ID de su hoja; el maestro rechaza el de otra y dice qué hacer.

**R-1 · Volver atrás**  · 2 pt · ✅ (bitácora 77)
- [x] Datos: `A5_respaldos` y `A6_restaurarDatos` (pestañas sueltas, copia previa,
      y Pedidos/Pagos/Registro fuera de la lista a propósito).
- [x] Sitio y versión: flujo `restaurar` en cada tienda, sin secretos nuevos.
- [x] Pedir una versión exacta permite bajar (`actualizar-semilla.mjs`).

**3.7b · El portal de administración**  · 1 pt · ✅ (bitácora 78)
- [x] Menú de la hoja › Abrir el portal: cada tienda con sus cifras y sus enlaces.
- [x] Abrirlo no consulta a ninguna tienda.

### 0.18.1 · Los enlaces del portal y la documentación al día

**C-3 · Los botones del portal**  · 1 pt · ✅ (bitácora 79)
- [x] El repositorio se normaliza al leer la hoja; lo que no es `dueño/nombre`
      no genera enlace. `REPO_FLOTA` para una flota con otro nombre.

**D-13 · El mapa de despliegue y el roadmap, al día**  · 1 pt · ✅ (bitácora 80)
- [x] `DESPLIEGUE.md` abre con el camino normal (`alta` → Google → `conectar` →
      stub → Cloudflare) y marca con ⚙ lo que hace un flujo.
- [x] Roadmap: 3.3 y 5.1 hechos, 3.12 sin número repetido, fase 3 en orden.

### 0.19.0 · Medición, y la documentación que faltaba

**M-1 · Google Analytics, opcional y horneado**  · 1 pt · ✅ (decisión 23, bitácora 81)
- [x] `analytics_id` en la hoja; vacío = la tienda no carga nada de Google.
- [x] La CSP de esa tienda crece solo cuando mide; `_headers` los nombra siempre.
- [x] Una sola costura, `medir()`, con tres puntos de medida puestos.

**D-14 · Runbook, funcionalidades y radiografía**  · 2 pt · ✅ (bitácora 82)
- [x] `RUNBOOK-TECNICO.md`: paso a paso con comprobaciones, incidentes y tareas
      recurrentes.
- [x] `FUNCIONALIDADES.md`: todo lo que hace el producto, por categoría.
- [x] `ARQUITECTURA.md`: credenciales completas (dónde nacen, qué permiten,
      cómo se renuevan), flujos, camino de un pedido, medición, Cloudflare.
- [x] Guardias que impiden que los tres envejezcan en silencio.

### 0.20.0 · Salir al aire: acabado, revisión y la flota publicada

**A-1 · El acabado de la tienda**  · 2 pt · ✅ (bitácora 84)
- [x] Fuera la tipografía de Google: tres peticiones menos y ninguna espera.
- [x] Capa de acabado al final de la hoja de estilos, sin tocar un id ni una clase.
- [x] La CSP deja de permitir tipografías de fuera, en sus tres copias.

**D-15 · La revisión, en el panel**  · 1 pt · ✅ (bitácora 85)
- [x] Puerta `diagnostico` (panel, solo el dueño, solo POST) y *Revisión de tu
      tienda* en el panel, con el resumen por puntos.
- [x] El informe mira lo nuevo: HOJA_ID, stub pegado, permiso de GitHub,
      medición y si se puede volver atrás.

**3.7c · La dirección y el panel de la flota**  · 1 pt · ✅ (bitácora 83 y 86)
- [x] El portal enseña la dirección que dice la tienda; `actualizar` la copia a
      la fila.
- [x] `flota` › estado publica el panel en Cloudflare si hay token.

### 0.20.1 · Los mensajes que mandaban a mirar donde no era

**C-4 · Actualizar una sola tienda**  · 1 pt · ✅ (bitácora 87)
- [x] *Solo esta tienda* acepta el nombre corto; si no existe, lo dice con la
      lista de las que sí y su anillo.
- [x] El 404 de GitHub se explica: un token sobre «Only select repositories» no
      incluye las tiendas nuevas. `conectar` lo comprueba antes de sembrarlo.

**3.7d · El anillo en el portal**  · 1 pt · ✅ (bitácora 88)
- [x] `conectar` manda el anillo; columna al final (R1) y chip en el portal.

### 0.20.2 · El permiso que se cura solo

**C-5 · Rotar `DISPARO_TOKEN`**  · 1 pt · ✅ (bitácora 89)
- [x] El maestro comprueba el permiso guardado contra GitHub antes de
      respetarlo; si ya no sirve, lo reemplaza el que llega con `conectar`.
- [x] Casilla `forzar_permiso` en `conectar` para cambiarlo aunque sirva.
- [x] El mensaje de 401 dice el camino completo.

### 0.20.3 · Un flujo no llama a lo que la tienda no tiene

**C-6 · El cronómetro**  · 1 pt · ✅ (bitácora 90)
- [x] El montaje avisa y sigue si falta `montar/tiempos.mjs`.
- [x] Batería: toda herramienta que un flujo ejecuta existe y está versionada.
- [x] El alta se planta si el repositorio nuevo no trae lo que sus flujos llaman.

### 0.20.4 · El resumen dice qué es, y una prueba no depende del calendario

**C-7 · El día del mes**  · 1 pt · ✅ (bitácora 91)
- [x] Los cobros se siembran relativos a hoy: la aserción vale cualquier día.
- [x] `panel.js` entra en `calendario.js`: diez días de dos meses, con el 1, el
      28 y los de mes largo.

**C-8 · La ficha de la corrida**  · 2 pt · ✅ (bitácora 91)
- [x] Los ocho flujos abren con **«Qué es esta corrida»**: qué es, sobre qué, cómo
      está antes de tocar nada, qué se pidió y quién lo pidió.
- [x] `montaje` y `fotos` cierran con **«Cómo quedó»**, con `always()`: en qué
      estado queda la tienda, corra bien o mal.
- [x] Nada se dice dos veces: el marcador de las baterías, una vez; los volcados
      de cada herramienta, plegados.
- [x] `fotos` y `pruebas` también toleran que falte el cronómetro (hueco de la
      0.20.3).
- [x] Baterías en los dos repositorios, cada una sobre sus propios flujos.

### 0.20.5 · Un permiso opcional no puede estar en el camino crítico

**C-9 · El checkout de la tienda**  · 1 pt · ✅ (bitácora 92)
- [x] `montaje` se baja el repositorio con el permiso propio de la tienda.
- [x] Pregunta si `SEMILLA_TOKEN` alcanza a ESTA tienda antes de contar con él, y
      si no, dice qué ampliar en vez de morir con un 403.
- [x] El empujón usa el de la semilla cuando sirve y el propio cuando no: los
      flujos se quedan atrás, la tienda se publica igual.
- [x] La herramienta solo escribe flujos que después se puedan empujar (`FLUJOS`).

### 0.20.6 · La suite corre en dos sitios, y lo sabe

**C-10 · Baterías que también son de la tienda**  · 2 pt · ✅ (bitácora 93)
- [x] Lo que depende de ser la semilla se salta en una tienda, DICIÉNDOLO.
- [x] El manifiesto de fotos se comprueba contra la carpeta, no contra una lista.
- [x] El control negativo del respaldo no depende del repositorio.
- [x] `publicar/_headers` viaja con la semilla: la única excepción en `publicar/`.
- [x] Aserción nueva: ninguna batería abre a ciegas un archivo que una tienda no tiene.

### 0.20.7 · Lo que la semilla retira, se retira

**C-11 · Actualizar también quita**  · 1 pt · ✅ (bitácora 94)
- [x] `semilla.json` declara `retirados`; la actualización los borra en la tienda.
- [x] Acotado: nada de `publicar/`, `.git`, rutas absolutas ni `..`; lo rechazado se nombra.
- [x] Retirar cuenta como cambio: si no, la tienda lo arrastra otra vez.
- [x] La semilla no retira nada que todavía entregue.

### 0.20.8 · La tiendita: probar como tienda, aquí

**C-12 · Quien vigila la regla de la bitácora 93**  · 1 pt · ✅ (bitácora 95)
- [x] `pruebas/tiendita.js`: copia del repositorio sin lo que `alta` no hereda, con
      un resto de una versión vieja dentro, y las baterías de archivos corridas ahí.
- [x] Las dos aserciones que hablaban de la semilla, guardadas (`esSemilla()`).
- [x] Escrito: el que se actualiza a sí mismo ejecuta la versión anterior de sí
      mismo, así que lo retirado se limpia una versión más tarde.

### 0.21.0 · El logo del comercio (y dos permisos bien preguntados)

**M7 · El logo**  · 2 pt · ✅ (bitácora 98)
- [x] `logo` se nombra como una foto del catálogo: el archivo de la carpeta de Drive
      o una dirección completa; lo resuelve `urlFoto()`.
- [x] Solo la barra, reemplazando al signo; el nombre sigue escrito (alt vacío).
- [x] El mismo archivo sirve de icono de la pestaña si no hay `favicon`.
- [x] Cuenta como foto usada: el montaje avisa por nombre si falta, y si no llega
      vuelve el signo en vez de un icono roto.
- [x] Batería propia: `pruebas/logo.js`.

**C-13 · Dos comprobaciones que preguntaban mal**  · 1 pt · ✅ (bitácora 97 y 99)
- [x] El maestro juzga su permiso preguntando por los **flujos**, no por el repositorio.
- [x] `fotos` publica todo lo que declaran las herramientas que corre (`ESCRIBE`),
      con una batería que compara las dos listas.

### 0.21.1 · El panel se publica solo

**3.11b · `panel.gs` sin copiar y pegar**  · 1 pt · ✅ (bitácora 100)
- [x] `publicar-maestro.mjs` sube el archivo que le digan (`ARCHIVO`).
- [x] Flujo `panel` en `tiendas`: clona la semilla y la llama con `panel.gs`.
      Secretos nuevos: `PANEL_SCRIPT_ID` y `PANEL_CLASPRC`.
- [x] Una tienda que ya no existe en GitHub no detiene a la flota: se salta y se
      dice cuál quitar de `flota.json`.

### 0.21.2 · Lo que no se puede empujar no bloquea la publicación

**C-14 · El push que se rechazaba entero**  · 1 pt · ✅ (bitácora 101)
- [x] Los flujos salen del commit cuando no hay permiso para escribirlos.
- [x] Y si el rechazo llega igual, se quitan y se publica el resto.
- [x] El resumen dice qué se quedó atrás y con qué llega.

### 0.22.0 · Lo que decide si una tienda publica

**C-15 · La tienda viva**  · 3 pt · ✅ (bitácora 102)
- [x] En una tienda, la guardia es `tienda-viva.js`: invariantes sobre lo horneado
      con SUS datos, y la página abierta en un navegador. Ni un dato escrito.
- [x] La decisión vive en `publicacion.sh`, que llega con la actualización: una
      tienda con el flujo viejo ya usa la guardia nueva.
- [x] La tiendita corre esa guardia también con los datos de otro comercio.
- [x] De 2–5 minutos de Actions por publicación a segundos.

**Pendiente de la revisión (bitácora 102)**
- [ ] Causa 3: unificar los permisos de GitHub en los menos posibles, con una sola
      comprobación de alcance al principio de cada flujo. *(Sin huecos conocidos
      desde la bitácora 102; la 0.22.1 quitó `SEMILLA_TOKEN` del camino de los
      flujos. Queda la unificación, sin fecha.)*
- [ ] Causa 4: que `montaje` diga TODO lo que falla en una corrida, no lo primero.
      *(Sigue pendiente al 29-sep: ver Dónde estamos.)*

### 0.22.1 · Los flujos de las tiendas son de la flota

**C-16 · Entregar flujos**  · 2 pt · ✅ (bitácora 103)
- [x] `flota/flujos.mjs`: copia los `.github/workflows` de la semilla a cada tienda,
      solo los que cambian. `flota › flujos` a mano; `actualizar`, sola.
- [x] Una tienda no mete nunca sus flujos en su commit (`publicacion.sh` y el flujo).
- [x] El push de la tienda va con su permiso, sin token en la URL.
- [x] `SEMILLA_TOKEN` por tienda ya no hace falta para los flujos (causa 3, en parte).

### 0.22.2 · El que mira y el que publica ven lo mismo

**C-17 · «Publicar ahora»**  · 1 pt · ✅ (bitácora 104)
- [x] `preparar-index --revisar` aplica la hoja sobre lo publicado, no sobre la plantilla.
- [x] `pruebas` decide con `publicacion.sh`: en una tienda, la tienda viva.

### Flota · Una tienda puede estar fuera del reparto

Sin versión de semilla: es de `tiendas`. `"anillo": "fuera"` en `flota.json` deja
una tienda en la lista y en el estado, fuera de `actualizar` y `flujos`.
`prueba-panel` (0.15.0, abandonada) quedó fuera: era la primera del anillo 2 y
su montaje fallido dejaba sin versión a prueba1. Al detenerse, la flota dice
cómo seguir. Bitácora 105.
*Después se sacó de `flota.json`: no aportaba nada, y el dueño borra su
repositorio (decisión 29). `"anillo": "fuera"` sigue sirviendo para la
próxima.*

### 0.22.3 · La semilla también es una tienda

**C-18 · El maestro de la semilla, al día**  · 1 pt · ✅ (decisión 30, bitácora 106)
- [x] `release` pregunta al maestro vivo de la semilla
      (`preparar-index.mjs --al-dia`) y, si quedó atrás, dispara su `montaje`
      con la casilla del maestro y `PUBLICAR`. Antes, «Publicar ahora» en la
      semilla moría con «el maestro publicado contesta la versión
      2026-09-22-7 y este repositorio trae la 2026-09-22-8».
- [x] `restaurar` › `el-sitio` publica de verdad: comparaba el árbol con el
      índice, que tras traer `publicar/` son iguales; ahora compara con `HEAD`.
      Y comparte grupo de concurrencia con `montaje` y `fotos`.
- [x] `tiendas` › `panel` escribe `~/.clasprc.json` desde `PANEL_CLASPRC`:
      no lo hacía nunca, y no se notó porque nunca había corrido con los
      secretos puestos.
- [x] `montaje` mete en el commit el borrado de los `retirados`: se borraban
      en disco y no entraban.
- [x] La flota quita de cada tienda los flujos que la semilla retiró
      (`flota/flujos.mjs › flujosRetirados`): la tienda no puede.
- [x] Mensajes que mentían (patrón 2): el permiso de `SEMILLA_TOKEN` en
      `montaje`, las cabeceras de `release` y `fotos`, dónde sacar el token en
      `conectar`/`alta`, y «Confirmado» → «Pagado» en la ayuda de la hoja.
- [x] `prueba-panel` fuera de `flota.json` (ver la sección de arriba).

### 0.22.4 · La semilla con su propio logo, y un 404 que no era el acceso

**C-19 · Lo que salió al correr la 0.22.3 en la semilla**  · 1 pt · ✅ (bitácora 107)
- [x] `config.js` sabe ver el icono de la pestaña cuando es una foto de la
      tienda (`fotos/<archivo>`, publicado) o una dirección, además del
      dibujado. En rojo en la semilla desde que su hoja tuvo logo.
- [x] `alMaestro` (`montar/tienda.mjs`) reintenta un 404 que llega tras más
      de 15 s —la redirección de Google que caduca—, y el mensaje ya no manda a
      revisar el acceso cuando el 404 fue lento.

### 0.22.5 · Las fotos PNG, y un logo que se lee

**C-20 · Lo que se vio en prueba1 y en la semilla**  · 1 pt · ✅ (bitácora 108)
- [x] `traer-fotos.mjs › convertir` publica el respaldo con el nombre y el
      formato exactos de la hoja: `logo.png` sale `logo.png` (con su
      transparencia), no `logo.jpg`. Antes, toda foto que no fuera `.jpg` daba
      404 en la tienda.
- [x] `novedades` vuelve a bajar lo que el registro da por publicado y no está
      en `publicar/fotos/`: las tiendas ya afectadas se curan solas en su
      siguiente montaje o *Publicar ahora*.
- [x] El logo de la barra: 40 px de alto (34 en el celular), ancho libre hasta
      un tope, y entero (sin el recorte cuadrado de las derivadas webp).
- [ ] `test.js` («Mínimo no alcanzado muestra aviso») falla a veces con toda
      la suite en paralelo y pasa sola: una espera que depende de la carga.

### 0.23.0 · El tamaño del logo lo elige la hoja

**C-21 · `logo_tamano`, y claves nuevas sin `A0_instalar`**  · 1 pt · ✅ (decisión 31, bitácora 109)
- [x] `logo_tamano` en Configuración y en el panel (*Tu tienda*): 40, 80 (de
      fábrica) o 120 px de alto; en el celular 34, 52 o 68. La barra crece con
      el logo. Lo puede cambiar el colaborador.
- [x] Al abrir Ajustes, el panel agrega las claves que le falten a la hoja
      (valor de fábrica, al final, sin tocar nada escrito): ninguna opción nueva
      vuelve a pedir `A0_instalar` en cada tienda.

### 0.24.0 · Una hoja que se lee, y el precio por variante

**C-22**  · 3 pts · ✅ (decisiones 32–34, bitácora 110)
- [x] Catálogo e Inventario por variante se leen por el NOMBRE de su columna;
      su orden visible es libre (`ORDEN_VISIBLE_…`). Si una columna no se
      encuentra, se lee por posición, como antes, y se dice.
- [x] Hoja ordenada: columnas lógicas, Configuración por secciones, listas en
      todo lo que tiene opciones, formato y listas mil filas por delante,
      obligatorios en rojo, pestañas en orden y con color, sin «Hoja 1».
- [x] Las tiendas existentes se ponen al día solas en la revisión de cada hora,
      una vez por versión (`ponerHojaAlDia`).
- [x] Precio por combinación (`Inventario por variante › Precio`): lo cobra el
      maestro, lo publica el catálogo, lo muestra la página y lo edita el panel.
- [x] Actions: cancelación en `pruebas`, Chromium sin ventana, topes de tiempo;
      arreglados el falso «NO se pudieron traer las fotos» y la ficha de `release`.
- [x] Permisos: `ALTA_TOKEN` se funde en `FLOTA_TOKEN` (compatible hacia atrás).

### 0.24.1 · Ordenar Configuración sin perder un valor

**C-23**  · 1 pt · ✅ (bitácora 111)
- [x] `ordenarConfiguracion` ya no borra antes de escribir: quita las listas de
      las filas que mueve, escribe de una vez y, si falla, deja lo de antes;
      luego `presentarConfiguracion` pone cada lista en la fila de SU clave.
- [x] `migrarEstados` escribe solo las celdas que cambian (un estado ilegible
      reescrito tal cual también lo rechaza la lista de Estado).
- [x] `restaurarDatos` quita las listas antes de escribir la copia, vuelve a lo
      de antes si falla y siempre las repone al final.
- [x] El emulador rechaza, como Google, lo que el CÓDIGO escribe fuera de una
      lista que rechaza (`pruebas/gas.js`).
- [x] `ALTA_TOKEN` retirado de `tiendas` por el dueño (29-sep); `FLOTA_TOKEN`
      con Administration y Secrets.

### 0.25.0 · El píxel de Meta, y los eventos son nuestros

**C-24**  · 2 pts · ✅ (decisión 35, bitácora 112)
- [x] `meta_pixel_id` en *Medición y anuncios* (con `analytics_id`): vacío =
      nada de Meta; un número hornea el fragmento oficial y abre la CSP de esa
      tienda; lo demás no se hornea y el panel dice por qué. Diagnóstico.
- [x] `medir()` reparte a GA4 y a Meta: cinco eventos propios sin datos
      personales (`ver_producto` y `pago_confirmado` nuevos); en Meta,
      `ViewContent`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`,
      `Purchase` con `eventID`.
- [x] La política de datos dice quién mide, leído de lo que cargó la página;
      ya no promete «no guarda nada en tu navegador» cuando hay cookies.
- [x] Diseño del medidor propio (puerta `/m`, Analytics Engine, tablero) en la
      decisión 35 y el ROADMAP 3.13.
- [ ] Riesgo abierto: consentimiento antes de cargar GA4/Meta, si un abogado lo
      confirma para Colombia.

---

### Lo que sigue después del MVP

**M6 · La flota que se actualiza sola.** Diseñada y **fuera de esta entrega**
(D11). *(M4 · El tablero y M5 · El rastreo entraron al MVP el 21 de
septiembre.)* Su detalle —y la condición que no se puede olvidar: que la
publicación automática del maestro se verifique contra la tienda viva y sepa
volver atrás sola— está en `ROADMAP.md`. *(Hecha después, fuera del MVP: v1
en la 0.13.0 y automática en la 0.14.0, con vuelta atrás del maestro si algo
falla —S3 del `ROADMAP.md`—. Desde la 0.22.0 lo que decide si publica es
`tienda-viva.js`.)*

**Lo que el MVP les deja hecho**, y por eso después son baratos: el horneado
determinista y `publicar/` como producto (M0) son la mitad de M6; el testigo de
sesión y las acciones del panel de M3 fueron la puerta que M4 necesitaba —y por
eso M4 cupo en el MVP—; y el
número de pedido de M5 solo depende de una decisión, no de la infraestructura.

---

## 6 · Los tres presupuestos

Tres números, con su guardia, para que dentro de un año se pueda decir si esto
sigue cumpliendo:

| Presupuesto | Objetivo | Quién lo vigila |
|---|---|---|
| **Tiempo de publicación** | Por corrida entera: `fotos` 300 s, `montaje` 330 s, `pruebas` 180 s (`presupuesto.json`). *El plan apuntaba a p50 ≤ 60 s y p95 ≤ 120 s de botón a `main`* | B-6 (`montar/tiempos.mjs`), en cada corrida: avisa por encima, falla por encima del doble; `sin_guardia` lo apaga una vez |
| **Minutos de Actions** | ≤ 100 min/mes por tienda (`presupuesto.json › minutosAlMes`; el plan decía 120) | B-1 los mide y el resumen de cada corrida recuerda el techo; ninguna corrida sabe cuántos van en el mes, así que se revisa al agregar una tienda |
| **Ejecuciones de Apps Script** | Ninguna mientras nadie mire. Visitas a la tienda: **cero** | El catálogo horneado. El panel gasta una por acción, y solo cuando el comerciante lo abre |

El tercero es el que más se olvida y el que sostiene el $0: **una visita a la
tienda no debe costar una ejecución.** Cada vez que alguien proponga algo «en
vivo», ese es el número que hay que mirar.

---

## 7 · Riesgos

| Riesgo | Cómo se ve | Qué lo contiene |
|---|---|---|
| **El panel se come el proyecto** | Tres meses construyendo un administrador y la tienda sin mejorar | M3 llega después de M0-M2, y su alcance está cerrado por escrito (§4.3) |
| **Publicar deja la tienda rota** | La tienda sirve el `<head>` de un comercio y el catálogo de otro | Nada se empuja si las baterías no están verdes, y el horneado es o entero o nada |
| **Poner al día una tienda a mano se olvida** | Una tienda montada en marzo se queda sin las correcciones de junio | *Contenido desde la 0.14.0:* la tienda se actualiza sola (`montaje` con `semilla`) y la flota la dispara por anillos. Lo que queda: una tienda con `"anillo": "fuera"` no recibe nada, y el estado la sigue mostrando atrás |
| **El token de montaje en la dirección** | `MAESTRO_TOKEN` va como `t=` en peticiones GET del montaje al maestro (`montar/tienda.mjs › alMaestro`), y una URL acaba en registros | Riesgo conocido, sin arreglar (`ROADMAP.md` 5.7): la regla es que los tokens viajan solo por POST. El token solo abre las puertas de montaje de esa tienda |
| **Un flujo retirado se queda en la tienda** | `semilla.json › retirados` nombra `.github/workflows/tienda-nueva.yml`, y el permiso de la tienda no toca `.github/workflows` | *Cerrado en la 0.22.3:* la flota lo quita (`flota/flujos.mjs › flujosRetirados`) |
| **La clave del panel** | Alguien entra a la tienda de un comercio | Hash con sal fuera de la hoja, testigo con vencimiento, bloqueo por intentos, y el alcance acotado a esa tienda. Sus límites están escritos, no disimulados |
| **Subir fotos desde el panel no cabe** en los límites de Apps Script | Fotos grandes que fallan o tardan | El camino viejo sigue existiendo; la historia lo exige explícitamente |
| **Los minutos** | La cuarta tienda no cabe en el plan | B-2 baja el gasto cinco veces; B-1 lo mide en cada corrida |
| **A-2 cambia sin querer lo que ve el comprador** | Una tienda se ve distinta tras un refactor «que no cambiaba nada» | Comparar el horneado nuevo contra el publicado de una tienda real, antes de fusionar |
| **Dos compradores y la última unidad** | Hoy: dos pedidos por WhatsApp de la misma unidad, y el comerciante le escribe a uno que ya no hay. Con pago en línea: los dos pagan y a uno hay que devolverle la plata | E-1 aparta la unidad **antes** de que empiece el pago, y va antes que el proveedor. Hasta M3.5, se resuelve a mano como siempre |
| **Confirmar un pago desde Apps Script** | Un aviso de pago falso marca un pedido como pagado; o uno verdadero no llega nunca | `doPost` no ve cabeceras, así que el aviso no se cree: se consulta al proveedor por la referencia (E-4). Ese es el criterio que decide el proveedor (E-2) |
| **Dos líneas de producto** | Una corrección se arregla en `tienda` y no en `organico` | Son dos líneas a propósito: `organico` solo recibe correcciones, y este plan no las sincroniza. Si algo hay que llevar, se lleva a mano y se anota |

---

## 8 · Decisiones

### Cerradas el 18 de septiembre de 2026

| | Decisión |
|---|---|
| **Nombre** | El producto se llama **tienda**. Este repositorio es la semilla de su segunda versión |
| **Versión** | Empieza en **0.1.0**; el MVP sale como **1.0.0**. `organico` sigue en 3.x, aparte |
| **Datos de empresa** | **Bloquean**: sin ellos no se publica (§4.2) |
| **Alcance** | El MVP son **M0 a M3**. Tablero, rastreo y flota automática son la 1.1. *(Ampliado el 21 de septiembre: entran **M3.5 · Cobrar en línea**, **M4 · El tablero** y **M5 · El rastreo**.)* |
| **Repositorios** | Semilla y tiendas privadas. La semilla se hará pública cuando el consumo llegue al umbral que el dueño está midiendo; las tiendas, nunca |
| **Fusión** | El único pull request manual es el de la semilla |

Las cuatro primeras están también en `DECISIONES.md`, con su contrapartida.

### Abiertas

1. **El precio de quitar la marca de autoría** (`f_autoria`), y el de una
   funcionalidad a medida. No hace falta la cifra hoy; hace falta que exista
   antes de la primera petición de un cliente.
2. **Qué se le promete al comerciante sobre las actualizaciones.** Se puede
   contestar cuando llegue M6: hasta entonces las tiendas se ponen al día a mano
   y no hay promesa que romper. El día que la flota se actualice sola, si una
   versión nuestra tumba su tienda **es nuestra** — y eso conviene escribirlo
   antes de que él lo dé por hecho de otra manera. *Al 29 de septiembre M6 ya
   llegó (0.14.0) y la promesa sigue sin escribirse.*
3. **Cuándo se hace pública la semilla.** No bloquea nada del MVP: con las
   tiendas privadas hace falta el secreto de lectura de todos modos, y solo lo
   necesita M6. *(Sigue abierta. Hoy ese secreto es `SEMILLA_TOKEN`, que la
   tienda usa para leer la semilla al actualizarse.)*
4. ~~**El proveedor de pagos**~~ — cerrada el 21 de septiembre: **Bold**
   (decisión 12).
