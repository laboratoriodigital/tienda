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
> M0 a M3.** El tablero gráfico, el rastreo del pedido y la actualización
> automática de la flota **salen del MVP** y son la entrega siguiente (1.1), con
> su orden ya decidido en el `ROADMAP.md`. El producto se llama **tienda**, el
> repositorio empieza en **0.1.0** y el MVP sale como **1.0.0**.
>
> **Caduca cuando la 1.0.0 esté publicada.** Entonces: la arquitectura se
> promueve a `ARQUITECTURA.md`, las decisiones a `DECISIONES.md`, lo que se
> rompió a `BITACORA.md`, lo que quedó fuera al `ROADMAP.md`, y este archivo se
> borra.

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
| §8 | Decisiones abiertas |

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
publicar/admin.html     la gestión           ← nuevo, en el MVP
publicar/tablero.html   las métricas         ← nuevo, entrega 1.1
publicar/pedido.html    el rastreo           ← nuevo, entrega 1.1
maestro.gs              el backend           (Apps Script, uno por tienda)
la hoja de Google       la base de datos     (deja de ser la interfaz)
WhatsApp                el cierre de la venta
```

**No es**: una pasarela de pagos, un framework, una base de datos, una app
móvil, ni un sistema con historial de clientes. Esas cuatro ausencias son lo que
sostiene el $0, y siguen decididas.

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
hasta que entren en el roadmap. Decirlo es parte del diseño — un panel que
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

### 4.4 El tablero y el rastreo — **entrega 1.1, no el MVP**

Las dos páginas están diseñadas y **no se construyen todavía**:

- **`tablero.html`** — las métricas que ya calcula el maestro, en gráficas SVG
  escritas a mano, sin librerías, con una sola petición por visita y la tabla de
  datos debajo de cada gráfica.
- **`pedido.html`** — el comprador consulta su pedido con el número que ya
  viaja en su conversación de WhatsApp, sin que se guarde ni un dato suyo más.
  Antes hace falta que **el número no se pueda adivinar**.

Lo que se pierde mientras tanto, y conviene tenerlo claro: el comerciante sigue
leyendo sus métricas en la **pestaña Tablero de su hoja**, que existe y funciona
—así que la pérdida es de comodidad, no de información—; y sigue contestando a
mano «¿en qué va mi pedido?», que es trabajo suyo, no una venta rota. Por eso
los dos aguantan esperar. El detalle está en el `ROADMAP.md`, fase 2.

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
después del MVP** (`ROADMAP.md`, fase 2). Mientras tanto vale lo mismo que en la
línea vieja: **una tienda nueva se clona** y nace con lo último; **una tienda ya
montada se pone al día a mano**.

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

**El MVP son cuatro hitos, y este es el orden:**

```
M0 → M1 → M2 → M3        ← la 1.0.0
                 M4 → M5 → M6   ← la 1.1, ya en el ROADMAP
```

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

- [ ] `plantilla/index.html` es el `index.html` de hoy con **huecos** donde hay
      datos de un comercio: `<head>`, paleta, las constantes, el respaldo,
      `EMPRESA`, el pie y el flotante.
- [ ] Los huecos son marcas explícitas, no valores de ejemplo.
- [ ] Ninguna palabra de ningún comercio queda en `plantilla/`. Aserción que lo
      comprueba con una lista de términos prohibidos derivada de la hoja.
- [ ] Abrir `plantilla/index.html` en un navegador **no** enseña una tienda:
      enseña que falta hornear.

**A-2 · El horneado genera `publicar/` desde `plantilla/`**  · 5 pts · dep. A-1
- [ ] `preparar-index.mjs` genera el archivo **desde cero**, no reemplazando
      bloques dentro del publicado.
- [ ] Sigue en pie: o se escribe entero, o no se escribe nada.
- [ ] Borrar `publicar/index.html` y hornear lo reconstruye idéntico.
- [ ] Hornear con la hoja de una tienda real da el mismo resultado visible que
      hoy. Se compara antes/después a ojo y con una batería.

**A-3 · También se hornean `404.html`, `compartir.jpg`, `wrangler.jsonc`, `sitemap.xml` y `robots.txt`**  · 3 pts · dep. A-2
- [ ] Ninguno queda con datos de otro comercio.
- [ ] `wrangler.jsonc` recibe su `name` **en el flujo**, sin preguntar nada por
      teclado (hoy solo lo arregla una herramienta interactiva).
- [ ] Aserción: `name` distinto de la semilla en cualquier repositorio de tienda.

**A-4 · Los textos legales salen de la hoja**  · 5 pts
> Como comerciante, quiero que mi texto legal hable de mi negocio y no de una
> finca de tomates que no es mía.

- [ ] Datos, retracto y términos se arman con `empresa_*`, el nombre del
      comercio y una lista de excepciones al retracto que sale de la hoja.
- [ ] **Sin los datos básicos de empresa no se publica** (D10): `empresa_razon`,
      `empresa_nit`, `empresa_direccion`, `empresa_ciudad` y al menos uno de
      `empresa_correo` / `empresa_tel` suben de *avisan* a *bloquean*, y el
      flujo se niega a escribir el `index.html` como ya hace con el WhatsApp.
- [ ] El mensaje dice **qué falta y por qué bloquea**, no solo el nombre de la
      clave — igual que los cuatro bloqueos que ya existen.
- [ ] El diagnóstico y la columna «Sin terminar» del panel del operador lo
      reflejan.
- [ ] Las leyes citadas siguen siendo las correctas: Ley 1581 de 2012, y
      Estatuto del Consumidor art. 47 (retracto) y 51 (reversión).
- [ ] Batería `legal.js`: montar una panadería y comprobar que ningún texto
      nombra un tomate, una finca ni una ciudad ajena.
- **Ojo:** esto entrega la mecánica, no asesoría jurídica. Que un abogado mire
  el machote sigue pendiente y no lo cierra esta historia.

**A-5 · `instalar()` deja de sembrar una tienda de tomates**  · 3 pts
- [ ] Dos filas de ejemplo neutras, marcadas `EJEMPLO`, con `Activo = No`. Una
      zona de envío de ejemplo.
- [ ] El diagnóstico avisa mientras quede un `EJEMPLO` activo.
- [ ] Sigue siendo idempotente.
- **Ojo:** la hoja emulada de las baterías es otra cosa y no cambia. Confundir
  las dos ya costó diez baterías en rojo una vez.

**A-6 · El horneado es determinista**  · 3 pts
- [ ] Ni marcas de tiempo ni fecha del día dentro de los archivos generados; si
      hace falta trazabilidad, se escribe la **versión**, que cambia cuando algo
      cambia.
- [ ] Claves, productos y envíos en orden estable y declarado.
- [ ] Hornear dos veces sin tocar la hoja deja `git status` limpio. **También
      pasada la medianoche UTC.**
- [ ] `package-lock.json` versionado en las dos carpetas, y los flujos con
      `npm ci`: la misma foto convertida en enero da el mismo archivo.
- [ ] Batería `determinismo.js`, con el reloj falseado.

**A-7 · La autoría al pie**  · 1 pt
- [ ] *Powered by Laboratorio Digital*, enlazado a `autoria_url`, con
      `rel="noopener"`, sin cargar nada externo.
- [ ] Interruptor `f_autoria`, encendido por defecto.

**A-8 · Cada herramienta declara lo que escribe**  · 2 pts
- [ ] Cada `montar/*.mjs` exporta `ESCRIBE` con sus rutas.
- [ ] Una aserción falla si una herramienta escribe algo que no declaró.
- [ ] La lista de «qué se hornea» del flujo de actualización (M6) se deriva de
      ahí. Una sola lista, no dos.

---

**A-9 · El producto se llama «tienda», y empieza en 0.1.0**  · 1 pt
- [ ] `package.json` en `0.1.0`. El MVP saldrá como `1.0.0`.
- [ ] Ni el repositorio ni el código nombran al comercio de la línea anterior;
      donde hoy dice su nombre como marca del producto, dice **tienda**.
- [ ] `wrangler.jsonc` de la semilla no lleva el nombre de una tienda de nadie.
- [ ] Aserción: una lista de términos prohibidos —el nombre del comercio
      anterior, su ciudad, su teléfono, sus productos— que falla si alguno
      aparece en `plantilla/`, `maestro.gs`, `panel.gs` o la configuración
      sembrada.

---

### M1 · Rendimiento y cuota   · con repositorios privados, esto es dinero

**B-1 · Medir antes de tocar nada**  · 3 pts
- [ ] Cada paso del flujo registra su reloj; el resumen trae la tabla fase /
      segundos / % y **los minutos de Actions consumidos**.
- [ ] Artefacto `tiempos.json` por corrida.
- [ ] `presupuesto.json` con el objetivo de tiempo y el de minutos al mes.

**B-2 · Fuera el cron de cuatro horas**  · 2 pts
> Es el 84 % del gasto de minutos y existe para cazar fotos subidas al Drive
> sin avisar — un caso que el panel (M3) elimina.

- [ ] Publicación **a demanda** desde el panel del comerciante.
- [ ] Red de seguridad **diaria** que solo comprueba si hay cambios sin publicar
      y avisa; no publica sola.
- [ ] El panel dice cuándo se publicó por última vez y si hay algo pendiente.

**B-3 · Una sola pregunta al maestro**  · 5 pts · dep. B-1
- [ ] `montar/sondear.mjs` pide en paralelo lo que hoy se pide tres veces
      duplicado, y escribe un estado que las demás herramientas leen con
      `--desde`.
- [ ] Sin `--desde`, cada herramienta sigue funcionando sola.
- [ ] El flujo hace **cuatro** peticiones fijas en vez de siete, y se cuentan en
      una batería.
- [ ] El estado caduca a los diez minutos: nunca es una caché entre corridas.

**B-4 · Fotos en paralelo**  · 3 pts
- [ ] Descarga y conversión en tandas de cuatro; los cuatro tamaños de cada foto
      a la vez.
- [ ] **Cada error sigue nombrando su foto**; si fallan dos, se listan las dos.
- [ ] Una foto que falla no impide publicar lo demás.

**B-5 · Las cachés dejan de perderse enteras**  · 2 pts
- [ ] `restore-keys` en la caché del navegador de pruebas.
- [ ] La instalación con dependencias del sistema corre **solo** cuando la caché
      falla.
- [ ] Una sola clave de caché por versión de dependencias, no una por rama: en
      privado, el almacenamiento también se paga.

**B-6 · El guardia del presupuesto**  · 2 pts · dep. B-1
- [ ] Por encima del objetivo, avisa en grande y sigue.
- [ ] Por encima del doble, falla y nombra la fase.
- [ ] Se puede desactivar con un input para una corrida excepcional.

**B-7 · La batería que no corre, o corre o se borra**  · 1 pt
- [ ] `limites.js` levanta un navegador y no está en la lista: entra o se va.
- [ ] La aserción que vigila eso cubre también este caso.

---

### M2 · La tienda para todo producto

**C-1 · Variantes**  · 8 pts *(partir en contrato / maestro / página)*
> Como comerciante de cosmética, quiero vender un labial en tres tonos sin
> crear tres productos.

- [ ] Columna `Variantes` **al final** de `Catálogo` (regla: solo se agrega, y
      solo al final), opcional, con sintaxis corta y explicada en la hoja:
      `Talla: S|M|L ; Color: Rosa|Nude`.
- [ ] El maestro las devuelve estructuradas; lo ilegible se reporta con su celda
      y **no se adivina**.
- [ ] La página obliga a elegir antes de agregar al carrito; la elección viaja
      en el mensaje de WhatsApp y al pedido (columna `Variante`, al final).
- [ ] El catálogo de respaldo las lleva: sin red, las variantes siguen ahí.
- [ ] Interruptor `f_variantes`.
- [ ] **El stock es del producto, no de la variante** — decisión consciente, con
      su disparador para revisarla: el primer comercio que pierda una venta por
      una talla agotada.

**C-2 · SEO horneado**  · 5 pts · dep. A-2
- [ ] JSON-LD de organización y sitio en la portada; de producto con oferta,
      precio, moneda y disponibilidad en cada ficha. Escrito en el HTML, no por
      JavaScript.
- [ ] `sitemap.xml` y `robots.txt` generados en el horneado.
- [ ] `admin`, `tablero` y `pedido` con `noindex`.
- [ ] Batería que valida el JSON-LD contra el esquema y que el sitemap lista
      exactamente los productos activos.

**C-3 · Lo que el comprador necesita saber antes de comprar**  · 3 pts
- [ ] **Envío gratis anunciado**: «te faltan $12.000 para envío gratis», con el
      umbral que ya existe en la hoja.
- [ ] **Horario**: hoy `horario` es una clave muerta —se siembra, se documenta y
      nadie la pinta—. O se pinta, o se retira.
- [ ] **Tienda cerrada** y **mínimo de pedido**, los dos por interruptor.

**C-4 · Orden del catálogo**  · 2 pts
- [ ] El comerciante elige el orden por defecto desde la hoja o el panel; el
      comprador puede reordenar por precio.

---

### M3 · El panel básico del comerciante   · la mitad del trabajo del MVP

**D-1 · Entrar**  · 5 pts
> Como comerciante, quiero entrar a administrar mi tienda con un usuario y una
> clave, sin abrir una hoja de cálculo.

- [ ] Usuario en la configuración; **hash con sal de la clave en las propiedades
      del proyecto**, nunca en la hoja ni en el repositorio.
- [ ] Al entrar, el maestro devuelve un testigo firmado con vencimiento de ocho
      horas; el navegador lo manda en cada petición.
- [ ] Cinco intentos fallidos bloquean quince minutos y quedan anotados.
- [ ] Un testigo vencido o falseado se rechaza sin decir cuál de las dos cosas.
- [ ] La clave se pone la primera vez desde el menú de la hoja, no por la web.
- [ ] Batería de seguridad: sin testigo no se escribe nada; con testigo de otra
      tienda tampoco.

**D-2 · Productos**  · 8 pts *(partir: listar+editar / crear+borrar / foto)*
- [ ] Listar con búsqueda y filtro; crear, editar, activar/desactivar y borrar.
- [ ] Toda escritura bajo `LockService`, con el saneado que ya cierra la
      inyección de fórmulas, y validando el contrato antes de escribir.
- [ ] Cada escritura lleva un identificador de operación: reintentar no duplica.
- [ ] **Subir la foto desde el panel**: el maestro la guarda en la carpeta de
      Drive con el nombre que le corresponde. Quita el error más común del
      producto —el nombre de archivo que no coincide—.
- [ ] Si la subida falla por tamaño o por tiempo, lo dice y **el camino viejo
      sigue existiendo**: subirla a Drive a mano.

**D-3 · Pedidos**  · 5 pts
- [ ] Lista con estado, fecha y total; abrir uno y ver qué se pidió.
- [ ] Cambiar el estado desde el panel, con el mismo efecto sobre el inventario
      que tiene hacerlo en la hoja.
- [ ] No se muestra ni se guarda ningún dato personal que hoy no se guarde.

**D-4 · Configuración**  · 3 pts
- [ ] Las claves que toca el comerciante: textos de portada, colores, horario,
      envío gratis, contacto. Con su explicación al lado.
- [ ] Un valor ilegible se marca y **no se degrada a cero ni a apagado**.
- [ ] Las claves técnicas no aparecen aquí.

**D-5 · Publicar**  · 3 pts · dep. B-2
- [ ] Un botón. Dice si hay cambios sin publicar y cuándo fue la última vez.
- [ ] Guardar **no** publica: publicar es un gesto explícito, y cuesta minutos.
- [ ] Mientras corre, el panel enseña el estado; al terminar, el resultado.

**D-6 · Registro de cambios**  · 2 pts
- [ ] Cada escritura deja una fila en una pestaña nueva, solo de agregar:
      cuándo, qué se cambió y desde dónde.
- [ ] Es lo único que contesta «yo no borré eso» sin adivinar.

**D-7 · La guía del comerciante, rehecha para el panel**  · 2 pts
- [ ] La guía de una página pasa a explicar el panel, no la hoja.
- [ ] Sigue cabiendo en una página.

---

### Lo que sigue después del MVP

**M4 · El tablero · M5 · El rastreo del pedido · M6 · La flota que se actualiza
sola.** Están diseñados y **fuera de esta entrega** (D11). Su detalle —qué
hacen, en qué orden, y las dos condiciones que no se pueden olvidar: que el
número de pedido no se pueda adivinar antes de abrir el rastreo, y que la
publicación automática del maestro se verifique contra la tienda viva y sepa
volver atrás sola— está en `ROADMAP.md`, fase 2.

**Lo que el MVP les deja hecho**, y por eso después son baratos: el horneado
determinista y `publicar/` como producto (M0) son la mitad de M6; el testigo de
sesión y las acciones `?a=admin.*` de M3 son la puerta que M4 necesita; y el
número de pedido de M5 solo depende de una decisión, no de la infraestructura.

---

## 6 · Los tres presupuestos

Tres números, con su guardia, para que dentro de un año se pueda decir si esto
sigue cumpliendo:

| Presupuesto | Objetivo | Quién lo vigila |
|---|---|---|
| **Tiempo de publicación** | p50 ≤ 60 s, p95 ≤ 120 s, de apretar el botón a `main` movido | B-6, en cada corrida |
| **Minutos de Actions** | ≤ 120 min/mes por tienda | B-1 los suma; se revisa al agregar una tienda |
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
| **Poner al día una tienda a mano se olvida** | Una tienda montada en marzo se queda sin las correcciones de junio | Es el precio consciente de sacar M6 del MVP. Con pocas tiendas es media hora; el día que sean cinco, M6 entra |
| **La clave del panel** | Alguien entra a la tienda de un comercio | Hash con sal fuera de la hoja, testigo con vencimiento, bloqueo por intentos, y el alcance acotado a esa tienda. Sus límites están escritos, no disimulados |
| **Subir fotos desde el panel no cabe** en los límites de Apps Script | Fotos grandes que fallan o tardan | El camino viejo sigue existiendo; la historia lo exige explícitamente |
| **Los minutos** | La cuarta tienda no cabe en el plan | B-2 baja el gasto cinco veces; B-1 lo mide en cada corrida |
| **A-2 cambia sin querer lo que ve el comprador** | Una tienda se ve distinta tras un refactor «que no cambiaba nada» | Comparar el horneado nuevo contra el publicado de una tienda real, antes de fusionar |
| **Dos líneas de producto** | Una corrección se arregla en `tienda` y no en `organico` | Son dos líneas a propósito: `organico` solo recibe correcciones, y este plan no las sincroniza. Si algo hay que llevar, se lleva a mano y se anota |

---

## 8 · Decisiones

### Cerradas el 18 de septiembre de 2026

| | Decisión |
|---|---|
| **Nombre** | El producto se llama **tienda**. Este repositorio es la semilla de su segunda versión |
| **Versión** | Empieza en **0.1.0**; el MVP sale como **1.0.0**. `organico` sigue en 3.x, aparte |
| **Datos de empresa** | **Bloquean**: sin ellos no se publica (§4.2) |
| **Alcance** | El MVP son **M0 a M3**. Tablero, rastreo y flota automática son la 1.1 |
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
   antes de que él lo dé por hecho de otra manera.
3. **Cuándo se hace pública la semilla.** No bloquea nada del MVP: con las
   tiendas privadas hace falta el secreto de lectura de todos modos, y solo lo
   necesita M6.
