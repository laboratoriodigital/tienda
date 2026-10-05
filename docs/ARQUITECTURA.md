# Arquitectura y modelo de despliegue

Este archivo responde una sola pregunta: **qué vive dónde, de quién es la
cuenta, quién mueve cada pieza y por qué**. Es la referencia técnica del
sistema, incluida la automatización que monta, publica y actualiza las
tiendas. Describe el presente —vigente a la
**1.0.0 (30 de septiembre de 2026)**, la versión que cierra el MVP—; lo que pasó está en `BITACORA.md`, las
decisiones con condición de disparo en `DECISIONES.md`, y el paso a paso para
operar en `DESPLIEGUE.md` y `RUNBOOK-TECNICO.md`.

Los nombres, para no confundirlos: la **Tienda 2.0** es este repositorio
(`laboratoriodigital/tienda`, el producto «Tienda Panel») y es el único que se
administra y se vende. **Orgánico** (`laboratoriodigital/organico`, «Tienda
Básica», versiones 3.x) solo recibe correcciones hasta que sus clientes se
migren a la 2.0 (§13). La **Tienda 3.0** es un proyecto nuevo, desde cero; no
tiene nada que ver con las versiones 3.x de Orgánico.

El contrato de datos (pestañas, claves, puertas del maestro, entradas de los
flujos) es normativo y vive aparte, en `CONTRATOS.md`.

---

## 0. El sistema de un vistazo

```
 laboratoriodigital/tiendas  (privado · servicio)          laboratoriodigital/tienda  (SEMILLA · Tienda Panel)
 ────────────────────────────────────────────────          ───────────────────────────────────────────────────
 flota.json   flota/*.mjs   panel/ (estático)               maestro.gs  panel.gs  plantilla/  montar/  pruebas/
 alta · conectar · flota{estado,actualizar,flujos} · panel  semilla.json  release · pruebas  (+ los flujos de tienda)
   │  FLOTA_TOKEN     │ FLOTA_TOKEN          │ PANEL_CLASPRC          │ release: etiqueta vX.Y.Z
   │  crea, pone      │ dispara montaje,     │ clasp push             │
   │  secretos,       │ entrega flujos       ▼                        ▼
   │  dispara         │ (API contents)   Hoja «Panel de tiendas»   etiquetas vX.Y.Z ──(se clonan)──┐
   ▼                  ▼                  (panel.gs, cuenta del     (alta clona la última;          │
 ┌────────────── una TIENDA (repo privado, uno por comercio) ─────┐ operador) ─ a=panel POST ┐       │
 │ montaje · fotos · pruebas · restaurar       publicar/  ◄── hornea                        │       │
 │ semilla.json › propios ◄─────── montaje › semilla (actualizar-semilla.mjs) ─────────────────────┘
 │ compuerta: pruebas/publicacion.sh → pruebas/tienda-viva.js                             │
 │ push a main ──────────────► Cloudflare: Worker solo de recursos estáticos (publicar/)  │
 └─────▲──────────────────────────────▲───────────────────────────────────────────────────┘
       │ a=bloques|identidad|fotos…    │ dispara fotos.yml / montaje.yml
       │ (POST, MAESTRO_TOKEN en el    │ (GITHUB_TOKEN de sus propiedades = DISPARO_TOKEN)
       │  cuerpo; 1.0.0)               │
 ┌─────┴──────────────────────────────┴───────────────┐
 │ maestro.gs (Apps Script suelto, cuenta de la tienda)│ ◄── ?a=menu (GET) ── stub en la hoja del comercio
 │ web app /exec · propiedades del script · Drive       │ ◄── admin.html (panel del comerciante, POST)
 └─────────────────────────┬───────────────────────────┘ ◄── index.html (comprador: validar, registrar…)
                           ▼
                 Hoja del comercio (Google Sheets)
```

| Pieza | Qué es | Dónde se explica |
|---|---|---|
| Hoja + `maestro.gs` | Base de datos y backend de una tienda, en la cuenta de Google de esa tienda | §1–§4, §6b, `CONTRATOS.md` |
| `panel.gs` | La hoja «Panel de tiendas» del operador: cifras de toda la flota y registro de altas | §4, §6d |
| `plantilla/` → `publicar/` | La página sin hornear y la horneada por el montaje | §5, §13, §18 |
| Cloudflare | Un Worker **solo de recursos estáticos** por tienda, conectado a su repositorio | §16 |
| Repositorio semilla | `laboratoriodigital/tienda`: el código y sus etiquetas | §13, §13b |
| Repositorio de tienda | Uno por comercio: su `publicar/` y su copia de lo que es de la semilla | §13, §13b |
| Repositorio de servicio | `laboratoriodigital/tiendas`: alta, conexión, flota y los tokens con poder | §13, §13d, §13e |

---

## 1. El reparto

| Pieza | Dónde vive | De quién es la cuenta | Por qué ahí |
|---|---|---|---|
| Hoja de cálculo | Google Sheets | Una cuenta de Google **por tienda**, creada y administrada por nosotros | Es la base de datos, el CMS y el tablero. La cuenta es por tienda para que cada una gaste sus propios límites gratuitos |
| Maestro (`maestro.gs`) | Apps Script suelto, implementado como aplicación web | La misma cuenta de esa tienda | Fuera de la hoja: al compartirla, el cliente no lo ve |
| Stub | Apps Script dentro de la hoja | La misma | Un centenar de líneas que genera el maestro, sin una sola regla de negocio. Existe solo porque un menú necesita un `onOpen` (§6b) |
| Fotos originales | Drive | La misma | Capa 1. Pesadas, nunca se publican |
| Fotos publicadas | `publicar/fotos/` en Git | Nuestra | Capa 2. Las baja y convierte el montaje (`montar/traer-fotos.mjs`) |
| Sitio | Cloudflare Workers (solo recursos estáticos) | **Una sola cuenta nuestra** | Los archivos estáticos no gastan cuota |
| Repositorios | GitHub | Nuestra | Uno por tienda, la semilla y el de servicio (§13) |
| Panel de tiendas (`panel.gs`) | Sheets + Apps Script | Nuestra cuenta personal | Administra el negocio, no una tienda |

Google se **reparte** (una cuenta por tienda). Cloudflare y GitHub se
**centralizan** (una sola cuenta para todas). No es una inconsistencia: son
límites de naturaleza distinta, y la sección 3 explica por qué.

---

## 2. Quién ve qué

La cuenta de Google de cada tienda **es nuestra**: la creamos, la
administramos y guardamos su contraseña. Al comercio se le comparte la hoja a
su cuenta personal, con permiso de edición, más el enlace a la carpeta de
Drive donde sube sus fotos crudas.

De ahí sale, sin ningún truco, que el comercio:

- **ve y edita** su hoja: productos, precios, stock, cupones, envíos, pedidos;
- **ve** el stub, que no dice nada: ni un precio, ni un cupón, ni una fórmula;
- **no ve** el maestro, porque no es suyo el proyecto ni la cuenta que lo
  contiene, y porque no está unido a la hoja que sí se le compartió.

Esto tiene un costo operativo que hay que asumir con los ojos abiertos: son N
cuentas de Google con sus contraseñas, sus verificaciones en dos pasos y sus
teléfonos de recuperación. Es un activo que hay que administrar de verdad, no
un detalle. A partir de unas diez tiendas conviene un gestor de contraseñas y
un número de recuperación propio, no el del comercio.

---

## 3. Por qué una cuenta de Google por tienda

Los límites de Apps Script son **por cuenta y por día**:

| | Cuenta gratuita | Workspace pago |
|---|---|---|
| Correos por día | 100 | 1.500 |
| Tiempo de disparadores | 90 min/día | 6 h/día |
| Llamadas de red | 20.000/día | 100.000/día |
| **Ejecuciones simultáneas** | **30** | **30** |

Las tres primeras filas se compran. **La cuarta no.**

Y la cuarta es la que manda. El maestro está publicado "ejecutar como: yo", así
que cada petición a su `/exec` corre una ejecución bajo la cuenta dueña. Con
una cuenta por tienda, ese techo de 30 es de esa tienda sola. Con todas las
tiendas colgadas de una sola cuenta —pagada o no—, treinta peticiones
simultáneas **repartidas entre todos los clientes** empiezan a chocar entre sí,
y el síntoma que ve el comprador es una tienda que no responde, en un negocio
que no tuvo nada que ver. Desde que el catálogo se sirve horneado (§10) esas
ejecuciones son pedidos, validaciones y gestiones del panel, no visitas.

Hay un segundo argumento, menos técnico y más incómodo: una sola cuenta es un
solo punto de falla. Si Google la suspende —y suspende cuentas por motivos que
no siempre explica—, se caen todas las tiendas a la vez.

**Decisión:** una cuenta de Google por tienda, gratuita. Se revisa si el costo
de administrar cuentas supera el beneficio; el número donde eso pasa hay que
medirlo, no adivinarlo.

**Lo contrario en Cloudflare.** Cada tienda es un Worker **sin código**: su
`wrangler.jsonc` no declara `main`, solo `assets` (§16). Servir recursos
estáticos no gasta la cuota de peticiones de los Workers. Repartir Cloudflare
en cuentas no compraría nada y costaría cien tableros que mirar.

---

## 4. El panel pregunta, no entra

Como cada tienda vive en su cuenta, desde el Panel de tiendas **no se puede
abrir la hoja de un cliente**. Compartirlas todas con una cuenta
administradora reconstruiría justo el acoplamiento que evitamos.

En vez de eso, cada maestro publica un resumen de su tienda por la puerta
`panel` (guardia `montaje`), y el panel lo pregunta. Desde la 1.0.0 `panel.gs`
pregunta por POST, con el token de montaje en el cuerpo (`{a: 'panel', t}`),
nunca en la dirección; salvo a una **Tienda Básica** (Orgánico 3.x, función
`esBasica` según la columna Producto), cuyo maestro no atiende puertas por
POST: a esa se le sigue preguntando por GET hasta migrarla. El maestro de la
2.0 contesta también por GET, a propósito, y anota cada GET con el token
(§6d): la hoja «Panel de tiendas» publicada hoy es anterior a la 1.0.0 y
pregunta así hasta que el flujo `panel` de `tiendas` publique el `panel.gs`
de la 1.0.0. Lo que cruza son
**cifras agregadas** —ventas del mes, pedidos por confirmar, productos
agotados, versión del código—, nunca un pedido ni el dato de un comprador. Si
mañana una tienda se va, se borra su fila y no queda nada suyo en nuestro lado.

Las consultas van con `fetchAll`, todas a la vez. En serie, veinte tiendas a
dos segundos son cuarenta segundos de ejecución contra un corte de seis
minutos; en paralelo son dos segundos.

### La columna «Sin terminar»

El diagnóstico distingue dos preguntas: ¿la tienda **funciona**? y ¿la tienda
**está terminada**? Son dos niveles (el detalle de cuáles bloquean y cuáles
avisan está en `DESPLIEGUE.md` paso 8): lo que **bloquea** hace que el montaje
se niegue a escribir el index; lo que **avisa** deja la tienda vendiendo pero a
medias, y sale en el registro y en el panel sin detener nada. La fila de cada
tienda en el panel lleva una columna **Sin terminar**, junto al nombre del
comercio: en blanco si está completa, `NO PUEDE VENDER: <clave>` si falta algo
que bloquea, o `faltan N: <claves>` si solo avisa. Por esa columna **viajan
las claves que faltan, nunca los valores**.

---

## 5. La tienda no depende de nadie en tiempo de ejecución

`publicar/index.html` es un archivo que se basta solo. Su política de
seguridad (`default-src 'none'`) autoriza como código externo **solo** la
librería de pago de Bold (`checkout.bold.co`, que la página inserta únicamente
al pagar en línea) y, si la tienda los pidió en su hoja, el fragmento de GA4
(`analytics_id`) y el del píxel de Meta (`meta_pixel_id`) (§15). No hay
librerías de terceros ni código compartido cargado con
`<script src>`: la caída de un registro de paquetes no apaga ninguna tienda, y
nadie puede inyectar código en el carrito de todos los clientes desde un
paquete.

Lo que sí se comparte es **en tiempo de construcción**: cada tienda lleva en su
repositorio una copia de lo que es de la semilla, en la versión de una
etiqueta, y la hornea con su hoja. Cómo llega una versión nueva está en §13b.

---

## 6. Las fotos, en tres capas

| Capa | Qué es | Dónde |
|---|---|---|
| 1 · Archivo maestro | El original pesado, tal como lo tomó el comercio | Drive de la tienda |
| 2 · Origen servible | Las versiones que se muestran (WebP en tres tamaños + JPG de respaldo) | `publicar/fotos/`, servidas por Cloudflare |
| 3 · Transformación | Un proveedor que recorta y convierte al vuelo, si se usa | Cloudflare en el propio dominio · Cloudinary · ImageKit · Cloudflare Images |

En la hoja se escribe **solo el nombre**: `chonto-1.jpg|chonto-2.jpg`. La
tienda arma la URL. El `logo` y el `favicon` de Configuración se nombran igual y
salen de la misma carpeta (0.21.0).

En `Catálogo › Imágenes` viven las fotos generales del producto. Las fotos que
cambian con una variante viven en `Inventario por variante › Foto`, junto
a su combinación; el catálogo publicado las entrega como
`imagenesVariantes: [{ eleccion, imagenes }]`. Un campo vacío hereda las fotos
generales. El panel sube a esa fila y muestra los nombres guardados en modo de
solo lectura; la hoja conserva una sola fuente para la asociación. El respaldo
sin red y el catálogo estático conservan la misma asociación.

Los tres proveedores externos están **autorizados de antemano** en la política
de seguridad (`img-src`) y en `FOTOS_HOSTS`; Cloudflare en el propio dominio
(`/cdn-cgi/image/…`) no necesita autorización porque es el mismo origen.
Cambiar de proveedor es cambiar la celda `fotos_cdn` y publicar: no toca la
política de seguridad. Si la hoja pide un proveedor que no está autorizado, las
fotos **no** quedan en blanco: se sirven directo del origen y se avisa por
consola con el paso exacto para arreglarlo.

El cable entre la capa 1 y la 2 lo cierran dos flujos de la tienda (§13):
`montaje`, que baja las fotos en cada corrida, y `fotos`, que es lo que dispara
**Publicar ahora**. `fotos` corre además solo una vez al día, pero **solo mira
y avisa** (decisión 08: con repositorios privados, el recurso escaso son los
minutos). Lo que `fotos` puede publicar está acotado a una lista escrita en el
flujo (`PUBLICA`: `publicar/fotos`, `catalogo.json`, `index.html`, `404.html`,
`sitemap.xml`, `robots.txt`); si el horneado toca algo fuera de esa lista, no
se fusiona solo y deja un pull request.

**En la página: una foto por tarjeta, las demás cuando alguien las pide
(1.0.0).** Si un producto tiene más de una foto general, su tarjeta del
catálogo es un carril que se desliza con el dedo (*scroll-snap*), con flechas
al pasar el ratón en computador y puntos abajo (`carrilDeFotos` en
`plantilla/index.html`). El costo en la carga es el mismo que con una sola
foto: **al pintar solo se descarga la primera**; las demás llevan su dirección
en `data-src` y se piden la primera vez que alguien toca, pasa el ratón, enfoca
o desliza esa tarjeta (`despertarFotos`; `marcarFoto` mueve los puntos,
`pasarFoto` las flechas). Una portada con veinte productos de cuatro fotos
baja a lo sumo veinte fotos, no ochenta (la primera, además, con
`loading="lazy"`). La caja de una tarjeta con varias fotos deja de ser un `<button>` —un carril no cabe en un botón—: tocar la foto abre
la ficha y el botón «Ver» es el camino del teclado. Con una sola foto la
tarjeta queda como antes. Se quitó la insignia «N fotos». Lo prueba
`pruebas/fotos.js` §6b.

---

## 6b. Lo único que sigue viviendo dentro de la hoja

El stub, y existe **solo para dibujar el menú**. Todo lo demás que la hoja
necesita ya lo hace el maestro desde afuera con disparadores instalables
—`alEditar`, `recalcularResumen`, `respaldoSemanal`—, que corren con nuestra
autorización y por eso sí pueden usar `UrlFetchApp` y `MailApp`. Un
disparador simple no podría: [no puede llamar a servicios que pidan
autorización](https://developers.google.com/apps-script/guides/triggers).

¿Podría un disparador instalable de apertura, creado por la cuenta de la
tienda, dibujarle el menú al comerciante? **Medido y cerrado el 6 de
septiembre de 2026**, en dos mitades:

1. El menú **sí aparece**. Un disparador instalable de apertura le dibuja
   interfaz a otro usuario.
2. Pero **tocar una opción falla**, con `PERMISSION_DENIED` al leer del
   almacenamiento: la función del clic se invoca **bajo la cuenta del
   comerciante, dentro de nuestro proyecto** —que no es suyo y no puede leer—.

**La frontera no es la autorización: es de quién es el proyecto donde vive la
función que se ejecuta.** Por eso el stub se queda: sus opciones llaman a
funciones que viven en la hoja del comerciante y piden por HTTP al maestro
(`?a=menu`, con el token del menú, por GET: una de las dos excepciones que
quedan a la regla de no poner un token en una dirección, §6d). El experimento
se retiró; solo queda
`quitarMenuDePrueba()` para desmontarlo donde se llegó a instalar.

Consecuencia para el técnico: como el stub llama a `UrlFetchApp`, **el
comerciante tiene que autorizarlo una vez** con su cuenta, y Google le muestra
la pantalla de aplicación no verificada (`DESPLIEGUE.md` paso 12).

## 6c. Lo mismo, corriendo en dos sitios

Las herramientas de `montar/` son las mismas en tu equipo y en GitHub. Lo que
cambia es de dónde salen los datos de la tienda y quién cierra el ciclo:

| | En tu equipo | En GitHub Actions |
|---|---|---|
| Cómo se invoca | `npm run index`, `npm run montar`… (atajos de `package.json`) | `node montar/<herramienta>.mjs --desde` |
| De dónde sale la URL y el token | `tienda.json` | Los secretos del repositorio |
| Quién hace el commit | **Tú** | El flujo |
| Cómo se publica | Tú decides | Directo en `main` (de fábrica), o por pull request si se pide `con-pull-request` o `main` está protegida |

**Lo local escribe archivos y nada más.** El commit y la publicación ocurren
solo cuando el flujo corre en GitHub.

## 6d. Credenciales: todas, dónde nacen, qué permiten y cómo se renuevan

Esta sección es normativa y exhaustiva: **si una credencial no está aquí, no
existe**. Una batería lo comprueba (`montaje.js`): cada `secrets.X` de
cualquier flujo de la semilla y cada propiedad que el maestro o el panel leen o
escriben tiene que aparecer nombrada aquí. La tabla operativa —quién la pone
en cada paso del alta y qué pasa si falta— está en `DESPLIEGUE.md` ›
*Secretos, tokens y llaves*; esta dice qué permite cada una y por qué vive
donde vive.

### Reglas que no se negocian

- **Las llaves de Bold y el permiso de GitHub del maestro (`GITHUB_TOKEN`, que
  es una copia de `DISPARO_TOKEN`) viven SOLO en las propiedades del script de
  Apps Script.** Nunca en la hoja, en un repositorio, en los secretos de GitHub
  de una tienda ni en el panel.
- **Un token de GitHub, una clave, un testigo o el token de montaje viajan en
  el cuerpo de un POST, nunca en una dirección.** Una dirección queda en los
  registros de acceso de Google y en el historial del navegador; un cuerpo, no.
  `conectar` siembra el permiso por POST (`a=permiso`); el panel del
  comerciante y `entrar` son solo POST; y desde la 1.0.0 las herramientas
  mandan también el token de montaje en el cuerpo (siguiente punto).
- **Nunca se imprime un token.** `conectar` enmascara el de montaje; las
  herramientas que clonan con un token lo tapan (`***`) en sus errores.
- **El token de montaje, fuera de la dirección (1.0.0, ROADMAP 5.7, bitácora
  113).** Hasta la 0.25.0 el token de montaje (`MAESTRO_TOKEN`, `tk-…`) viajaba
  como parámetro `t` en peticiones GET a la `/exec`, y era el riesgo abierto
  del PLAN §7. Desde la 1.0.0 lo mandan en el cuerpo de un POST (JSON en texto
  plano, con `t`): `montar/tienda.mjs › alMaestro`, `montar/publicar-maestro.mjs`,
  `flota/conectar.mjs › pedir` (en `tiendas`) y `panel.gs` (`a: 'panel'`) hacia
  las tiendas de la 2.0. Del lado del maestro, las puertas de montaje
  (`panel`, `identidad`, `bloques`, `sembrar`, `fotos`, `foto`) **siguen
  aceptando GET, a propósito**: volver una tienda a una versión anterior
  (`restaurar › la-version`, o `montaje › semilla`) corre las herramientas de
  esa versión, que preguntan por GET, contra el maestro 1.0.0 que sigue vivo
  hasta que se publica el viejo; rechazar el GET rompía volver atrás. En vez de
  eso, cada GET con el token se **anota** (`doGet › anotarTokenPorGet`,
  propiedad `TOKEN_POR_GET`: acción y fecha, nunca el token) y el diagnóstico
  dice quién sigue mandándolo así: la hoja *Panel de tiendas* sin actualizar, o
  una herramienta anterior a la 1.0.0. Solo `permiso` es `soloPost` (desde la
  0.16.0). Lo vigilan `montaje.js` §0, `sondeo.js` (el maestro de mentira
  cuenta los tokens que le llegan en la dirección), `panel.js` y
  `flota/pruebas.mjs`. Quedan **dos clientes que mandan un token por GET, los
  dos a la vista**:
  - el **stub** de cada hoja manda su propio token (`TOKEN_MENU`, guardia
    `menu`) por GET en `?a=menu`. Ese token solo abre el menú y ya está a la
    vista en la hoja del comercio; cerrarlo exige repegar el stub en cada hoja;
  - `panel.gs` hacia una **Tienda Básica** (`esBasica`): el maestro de Orgánico
    no atiende puertas por POST; se cierra al migrarla a la 2.0.

  Lo que abre el token de montaje sigue acotado (ver su fila) y se rota con
  `A3_rotarToken()`.

### Qué token vive dónde

| Credencial | Vive en | Lo usa | Permisos mínimos |
|---|---|---|---|
| `ALTA_TOKEN` (retirado: el secreto se borró de `tiendas` el 29-sep-2026, decisión 34) | ya no existe; los flujos de `tiendas` todavía lo prefieren si reapareciera (`ALTA_TOKEN \|\| FLOTA_TOKEN`), respaldo que falta quitar | nadie | lo mismo que `FLOTA_TOKEN`, que ya tiene *Administration* y *Secrets*: por eso se fundieron. Falta revocar el token viejo en GitHub (dueño) |
| `FLOTA_TOKEN` | secretos de `tiendas` | `flota` (`estado`, `actualizar`, `flujos`), y desde la 0.24.0 también `alta`, `conectar` y `panel` | grano fino, todos los repositorios del dueño: *Administration*, *Contents*, *Pull requests*, *Workflows*, *Secrets*, *Actions* en escritura; *Metadata* lectura. Quedan tres tokens: este, `SEMILLA_TOKEN` y `DISPARO_TOKEN` |
| `DISPARO_TOKEN` | secretos de `tiendas` → propiedad `GITHUB_TOKEN` de cada maestro | `conectar` lo comprueba y lo siembra; el maestro dispara `fotos.yml` y `montaje.yml` | grano fino sobre **todos** los repositorios del dueño, **solo** *Actions: Read and write* |
| `SEMILLA_TOKEN` | secretos de `tiendas` → copia en los secretos de cada tienda | la tienda: `montaje` › `semilla` (clonar la semilla) y `restaurar` › `la-version` (leer sus etiquetas) | *Contents* lectura sobre la semilla. Hace falta porque la semilla es privada (decisión D1 de `PLAN-MVP.md`) |
| `MAESTRO_URL` · `MAESTRO_TOKEN` · `HOJA_ID` · `SCRIPT_ID` | secretos de cada tienda (y de la semilla, que también es una tienda) | `montaje`, `fotos`, `release` (la semilla) | — |
| `CLASPRC` | secretos de cada tienda | `montaje`, al publicar el maestro | credencial de Google de la cuenta de la tienda |
| `PANEL_SCRIPT_ID` · `PANEL_CLASPRC` | secretos de `tiendas` (**a la 1.0.0 todavía no están puestos**: pendiente del dueño) | `panel` | credencial de Google de la cuenta dueña del Panel de tiendas |
| `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` | secretos de `tiendas` | `flota` › `estado` (publica `panel/`) | *Workers Scripts: Edit*, *Account Settings: Read* |
| `PANEL_URL` · `PANEL_CLAVE` | secretos de `tiendas` | `conectar` (POST `registrar_tienda`) | no son de GitHub |
| `GITHUB_TOKEN` de Actions | cada corrida, automático | checkout, push a `main`, pull requests, `gh` dentro de la corrida | el bloque `permissions` de cada flujo (§13). **Nunca puede escribir `.github/workflows`** |

### Los secretos del repositorio de servicio (`laboratoriodigital/tiendas`)

Ese repositorio es **privado** y es el único con poder sobre los demás.

| Secreto | Qué es | Qué permite | Dónde se crea | Cómo se renueva |
|---|---|---|---|---|
| `ALTA_TOKEN` (**retirado**: secreto borrado de `tiendas` el 29-sep-2026, decisión 34) | Era el token de `alta`, `conectar` y `panel`. Lo que permitía lo hace hoy `FLOTA_TOKEN` | — | — | No se renueva. Falta revocar el token viejo en GitHub y quitar el respaldo `ALTA_TOKEN \|\|` de los flujos de `tiendas` |
| `FLOTA_TOKEN` | Token de grano fino sobre **todos** los repositorios del dueño (la tienda nueva todavía no existe al crearlo, y una tienda que no ve contesta 404 y la flota la **salta**) | Leer versiones y etiquetas (`estado`); disparar y esperar el `montaje` de cada tienda (`actualizar`); **escribir los `.github/workflows` de cada tienda por la API de contenidos** (`flujos`, y `actualizar` después de cada tienda buena, §13d). Desde la 0.24.0, también lo de `alta`, `conectar` y `panel`: crear el repositorio, clonar la semilla y empujarla, permisos de Actions, fusiones automáticas, poner secretos en la tienda, disparar su `montaje`, leer la semilla | GitHub › Settings › Developer settings › Fine-grained tokens | Vence: se crea otro con los mismos permisos y se pega en Settings › Secrets › Actions de `tiendas` |
| `SEMILLA_TOKEN` | Token de grano fino con lectura de la semilla | No lo usa `tiendas`: `alta` lo **copia** a cada tienda al nacer y `conectar` lo **refresca** cada vez que corre. Desde la 0.22.1 **no empuja flujos** (bitácora 103) | Igual | Se cambia en `tiendas` y se vuelve a correr `conectar` en cada tienda (o se pega a mano en la tienda) |
| `DISPARO_TOKEN` | Token de grano fino **sobre TODOS los repositorios del dueño** (no «Only select repositories»: el alta crea tiendas nuevas y una lista fija envejece con cada una), **solo** *Actions: Read and write* | Disparar flujos de las tiendas: es el que hace que *Publicar ahora* y *Actualizar* funcionen desde el panel y el menú del comercio | Igual | Se cambia en `tiendas` y se vuelve a correr `conectar`: el maestro reemplaza el que ya no sirve (0.20.2), o se marca `forzar_permiso` |
| `PANEL_URL` | No es una credencial: la URL `/exec` de la aplicación web de la hoja **Panel de tiendas** | Escribir una fila en la pestaña Tiendas, nada más | Al implementar esa hoja como aplicación web | Cambia solo si se crea una implementación nueva |
| `PANEL_CLAVE` | La clave de escritura de esa hoja (`alta-…`) | Que la puerta `registrar_tienda` acepte la fila | Menú de esa hoja › *Clave para el alta* (se guarda como `CLAVE_ALTA` en sus propiedades) | Se genera otra desde el mismo menú: la anterior deja de servir en el acto |
| `PANEL_SCRIPT_ID` | El id del proyecto de Apps Script del Panel de tiendas | Decirle a `clasp` qué proyecto actualizar | De la URL del editor, entre `/projects/` y `/edit` | No caduca |
| `PANEL_CLASPRC` | El contenido de `~/.clasprc.json` tras `clasp login --no-localhost` con la cuenta dueña del Panel de tiendas | Publicar `panel.gs` en ese proyecto (el flujo lo escribe en `~/.clasprc.json` antes de publicar, 0.22.3). **A la 1.0.0, este y `PANEL_SCRIPT_ID` faltan en `tiendas`**: el flujo `panel` no ha corrido nunca, y hasta su primera corrida la hoja publicada sigue preguntando por GET (el maestro lo anota: §6d, reglas) | `clasp login --no-localhost` | Caduca: se repite `clasp login` y se pega de nuevo |
| `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` | Token de Cloudflare e identificador de la cuenta | `wrangler deploy` de `panel/` desde `flota` › `estado`. Opcionales: sin ellos el flujo lo dice y sigue | Cloudflare › My Profile › API Tokens | Con vencimiento: se crea otro y se pega |

### Los secretos del repositorio de cada tienda

| Secreto | Qué es | Qué permite | Dónde se crea | Cómo se renueva |
|---|---|---|---|---|
| `MAESTRO_URL` | La URL `/exec` de la aplicación web del maestro de esa tienda | Hablarle al maestro | Apps Script › Implementar › Aplicación web | Solo cambia si se crea una implementación nueva. Lo escribe `conectar` |
| `MAESTRO_TOKEN` | El **token de montaje** de esa tienda (`tk-…`) | Abrir las puertas de guardia `montaje`: `bloques`, `sembrar`, `fotos`, `foto`, `panel`, `identidad` y `permiso`. Leer la configuración, listar y bajar de la carpeta de fotos, leer cifras agregadas y sembrar en la hoja lo que el alta ya sabe. Viaja en el cuerpo de un POST (1.0.0); el maestro acepta todavía GET en esas puertas salvo `permiso`, y anota cada GET en `TOKEN_POR_GET` (§6d) | Lo inventa `A0_instalar` y lo guarda en la propiedad `TOKEN` | `A3_rotarToken()` y llevarlo a **tres** sitios: este secreto (volviendo a correr `conectar`), la pestaña Tiendas del panel y el `tienda.json` local |
| `HOJA_ID` | El identificador de la hoja | Que el `maestro.gs` que se sube lleve su hoja dentro | Lo escribe `conectar` (se lo pregunta al maestro) | No caduca |
| `SCRIPT_ID` | El identificador del proyecto de Apps Script | Decirle a `clasp` qué proyecto actualizar | Lo escribe `conectar` | No caduca |
| `CLASPRC` | El contenido de `~/.clasprc.json` tras `clasp login` **con la cuenta de esa tienda** | Publicar el Apps Script de esa cuenta y tocar su Drive. **Es la credencial más poderosa de una tienda** | `clasp login --no-localhost` con esa cuenta | Caduca: se repite `clasp login` y se pega de nuevo. Es el único paso que nadie puede automatizar hoy (roadmap 3.11) |
| `SEMILLA_TOKEN` | La copia del de `tiendas` | Clonar la semilla privada al actualizarse y leer sus etiquetas al volver atrás | — | Ver arriba |

### Las propiedades del script del maestro (una tienda)

Las propiedades de un proyecto de Apps Script **no están cifradas**: quien
pueda editar ese proyecto las lee en texto plano. Eso está asumido en el
diseño, y por eso ahí solo vive lo que no puede vivir en la hoja —que se
comparte con el comercio— ni en un repositorio.

| Propiedad | Qué guarda | Quién la escribe | Para qué |
|---|---|---|---|
| `TOKEN` | El token de montaje (`tk-…`) | `A0_instalar` la primera vez; `A3_rotarToken` | El secreto `MAESTRO_TOKEN` y la columna Token del panel |
| `TOKEN_MENU` | El token del stub (`tk-…`, **otro**) | `A0_instalar` / `A1_generarStub` | Solo abre `?a=menu`. Está a la vista en la hoja del comercio, y por eso no abre nada más. Viaja por GET en la dirección: una de las dos excepciones abiertas a la regla de §6d |
| `HOJA_ID` | El identificador de la hoja | `A0_instalar` (0.17.0) | Que la aplicación web funcione aunque su versión implementada sea anterior a pegar la constante (bitácora 74) |
| `URL_EXEC` | La URL `/exec` aprendida al abrirla una vez | El propio maestro | Poder decirle a la tienda y al stub dónde vive |
| `GITHUB_TOKEN` | La copia de `DISPARO_TOKEN` que dispara flujos de esa tienda | `conectar` (puerta `permiso`, por POST), o a mano | *Publicar ahora* (`fotos.yml`) y *Actualizar* (`montaje.yml` con `semilla`). Se reemplaza solo si el guardado ya no puede listar los flujos del repositorio (bitácoras 89 y 97), o con `forzar` |
| `PANEL_CLAVE` | La clave del panel del comerciante, como **huella con sal** (`sal$sha256`) | El menú de la hoja › *Clave del panel*, o el propio comercio al recuperarla | Entrar al panel. La clave en claro no se guarda en ningún sitio |
| `PANEL_FIRMA` | La llave con la que se firman los testigos de sesión | El maestro, sola | Que un testigo robado de otra tienda no sirva aquí |
| `PANEL_COLABORADOR` | `{u, clave}` del colaborador (misma huella con sal) | El dueño desde el panel | El segundo usuario, con menos permisos |
| `PANEL_INTENTOS` | Los intentos fallidos de entrada, por usuario | El maestro | El límite que protege la puerta `entrar` |
| `PANEL_RECUPERACION` · `PANEL_RECUPERACION_ENVIOS` | El código de recuperación y cuántos se mandaron | El maestro | «¿Olvidaste tu clave?» sin pasar por el operador |
| `BOLD_IDENTIDAD_SANDBOX` · `BOLD_SECRETA_SANDBOX` · `BOLD_IDENTIDAD_PRODUCCION` · `BOLD_SECRETA_PRODUCCION` | Las llaves de la pasarela de pago | A mano, el operador | Cobrar en línea. **Nunca** viajan a la página: la firma se calcula en el maestro. Se aceptan los alias `BOLD_BOTON_*` y el sufijo `PRUEBAS` |
| `COBROS_ABIERTOS` | Los cobros en línea que falta cerrar | El maestro | La lista de trabajo del disparador `conciliarPagos` (`CONTRATOS.md`) |
| `RESPALDO` · `RESTAURACION` | Qué pasó en la última copia y en la última restauración | El maestro | Que el panel pueda decir «último respaldo: hace 3 días» |
| `HOJA_AL_DIA` | La `VERSION_TIENDA` con la que la hoja se ordenó por última vez (0.24.0) | `instalar()` y `ponerHojaAlDia()` | Que la revisión de cada hora ordene la hoja una sola vez por versión y ejecute migraciones de columnas |
| `TOKEN_POR_GET` | Por puerta de montaje, la fecha de la última vez que el token llegó en la dirección (GET). Nunca el token (1.0.0) | `doGet` › `anotarTokenPorGet` | Que el diagnóstico diga quién sigue mandándolo por GET: la hoja *Panel de tiendas* sin actualizar, o una herramienta anterior a la 1.0.0 al volver a una versión vieja |
| `STUB_VISTO` · `STUB_CON_TOKEN_VIEJO` | Qué versión del stub está pegada en la hoja, y si todavía usa el token viejo | La puerta `menu`, en cada petición | Saber en qué hojas falta repegar el stub sin abrirlas una por una |
| `LECTURAS` · `RESCATES` · `PEDIDA_PUBLICACION` · `ULTIMA_EDICION` | Contadores y marcas de operación | El maestro | Cuota, pedidos rescatados, publicar pendiente, última edición de la hoja |

### Las propiedades del Panel de tiendas

| Propiedad | Qué guarda | Quién la escribe | Para qué |
|---|---|---|---|
| `CLAVE_ALTA` | La clave que `conectar` tiene que traer para registrar una tienda | Menú › *Clave para el alta* | La puerta `registrar_tienda` de esa hoja |
| `CORREO` | A quién le llega el resumen de la flota | `instalar` (vacío) y el operador | El correo diario |
| `GITHUB_TOKEN` | Token de grano fino con *Actions: solo lectura* | El operador | Leer las ejecuciones de Actions de las tiendas |
| `REPO_FLOTA` | `dueño/nombre` del repositorio de servicio, si no se llama `tiendas` | El operador, opcional | Los enlaces del portal |

Este `GITHUB_TOKEN` es **otro** que el del maestro y no dispara nada. Hace
falta porque los repositorios son privados (§13), y aunque no lo fueran: sin
autenticarse, la API de GitHub da 60 peticiones por hora **por dirección IP**,
y Apps Script sale por direcciones compartidas con todos los scripts del
mundo. Tiene que ser **de grano fino** (`github_pat_…`), limitado, de solo
lectura y con vencimiento; un token clásico (`ghp_…`) con alcance `repo` da
lectura **y escritura** sobre todos los repositorios, y el diagnóstico del
panel lo señala si aparece uno.

La pestaña Tiendas del Panel guarda, por tienda, la URL `/exec` y el token de
montaje (columnas *Servicio* y *Token*): es lo que necesita para preguntar a
la puerta `panel` (por POST desde la 1.0.0). Es un token que solo abre las
puertas de montaje; ningún token de GitHub ni llave de pago pasa por esa hoja.

## 6e. Cuatro códigos, cuatro numeraciones

| Código | Constante | Qué numera | Con qué compara |
|---|---|---|---|
| `maestro.gs` | `VERSION` (fecha; hoy `2026-10-04-2`) | El contrato con la tienda | Tiene que ser **igual** a `SCRIPT_VERSION` |
| `publicar/index.html` | `SCRIPT_VERSION` | Lo que la tienda espera del maestro | Se hornea con lo que **contesta el maestro publicado**; el montaje se para si no es la `VERSION` del repositorio (bitácora 56) |
| `maestro.gs` | `VERSION_TIENDA` (`1.1.2`) | La versión del producto que corre esa tienda | Igual a `version` de `package.json` (lo exige `actualizar.js`). La puerta `actualizacion` la compara con la última etiqueta de la semilla |
| `panel.gs` | `VERSION_PANEL` (`2026-09-30-a`) | El archivo de gestión | **Con nada.** Es otro programa |

La 1.0.0 fue un ejemplo de por qué van separadas: subió el producto
(`package.json` y `VERSION_TIENDA` de `0.25.0` a `1.0.0`) sin cambiar el
contrato página↔maestro. En la 1.1.1 sí cambia ese contrato: el catálogo añade
el campo opcional `imagenesVariantes`; por eso `VERSION` y `SCRIPT_VERSION`
pasan juntos a `2026-10-04-1`.

`version` en `package.json` es la del producto: la que corta `release` como
etiqueta `vX.Y.Z` y la que exige subir el flujo `pruebas` cuando un pull
request toca `maestro.gs`, `panel.gs` o `publicar/index.html`.

`npm run maestro` imprime `VERSION`, y donde eso se comprueba es en el menú
de la hoja de la tienda —que se llama como el comercio—, no en el menú
**Panel**. El diagnóstico del Panel de tiendas lista qué versión del maestro
corre cada tienda.

## 6f. La hoja se lee por nombre, y se ordena sola (0.24.0)

Catálogo e Inventario por variante se leen por el **nombre** de su encabezado
(`mapaDeColumnas` en `maestro.gs`): el código trabaja en el orden de su
`ENCABEZADO_…` —que solo crece por el final, R1— y la hoja va en su orden
visible (`ORDEN_VISIBLE_…`). Leer, escribir una fila, agregar filas y escribir
una columna pasan por el mismo adaptador (`filasCanonicas`,
`escribirFilaCanonica`, `agregarFilasCanonicas`, `escribirColumna`,
`columnaDe`). Si falta un nombre, se lee por posición y se anota. Configuración
se lee por clave y va por secciones (filas «▸ …»). `instalar()` y la revisión de
cada hora (`ponerHojaAlDia`, una vez por `VERSION_TIENDA`) dejan la hoja en su
forma: columnas en orden (`moveColumns`), secciones, listas desde
`CLAVES_DEL_PANEL`, formato mil filas por delante, obligatorios con formato
condicional, pestañas en orden y sin «Hoja 1» vacía (decisión 32, bitácora 110).

## 7. Lo que cuesta operar una tienda

| | |
|---|---|
| Google (cuenta, hoja, Apps Script, Drive) | $0 |
| Cloudflare (sitio, ancho de banda) | $0 |
| GitHub (repositorio, releases) | $0 |
| GitHub Actions | Los repositorios son privados: los minutos salen de la cuota mensual de la cuenta, compartida por todas las tiendas, y lo que pase de ella se paga (decisión 08). Cada flujo mide su gasto (`montar/tiempos.mjs`) |
| Dominio propio | Opcional. Un dominio nuestro alcanza para todas como subdominios |

Lo que cuesta de verdad es tiempo de montaje y minutos de Actions, y esos son
los números que hay que medir antes de ponerle precio al servicio.

---

## 8. Idempotencia y concurrencia

Cinco mecanismos, cada uno por un bug real de producción:

| Mecanismo | Problema que resuelve |
|---|---|
| Número de pedido estable | Se calcula una vez por carrito y solo se reinicia cuando el carrito queda vacío. Antes se generaba en cada envío y un doble toque creaba dos pedidos |
| Deduplicación en el servidor | `registrar` ignora un número de pedido ya grabado (`duplicado: true`). Tres envíos del mismo pedido dejan una sola entrada |
| `LockService` + upsert por número | `Validaciones` se escribe leyendo-y-escribiendo bajo candado. Sin él, dos validaciones simultáneas creaban dos filas con códigos distintos |
| Columna `Inventario` | Marca cada línea como *Descontado* o *Devuelto*. Hace que confirmar, anular y volver a confirmar no descuadre el stock |
| Congelado tras el envío | Una fila de `Validaciones` cuyo pedido ya se registró no se puede reescribir |

El inventario **no** se descuenta al enviar el pedido, a propósito: un pedido
abierto en WhatsApp no es una venta. Se descuenta al marcarlo *Pagado* (a mano,
desde el panel, o solo cuando el cobro en línea se aprueba).

En los flujos, la concurrencia se resuelve por grupo: `montaje`, `fotos` y
`restaurar` de una tienda comparten el grupo `tienda-<repositorio>` —los tres
escriben en `publicar/`— y nunca corren a la vez; `alta` y `flota` comparten
`flota`.

## 9. Seguridad

El modelo de amenaza parte de un hecho: **todo lo que está en el navegador es
del atacante.**

| Riesgo | Mitigación |
|---|---|
| Alterar el total desde la consola | El servidor recalcula todo con los precios de la hoja. La tienda nunca es la autoridad sobre el precio. Además `Object.freeze` sobre catálogo, cupones y envíos |
| Inventar o reutilizar un cupón | Los cupones viven solo en la hoja, con vigencia, mínimo y tope de usos |
| Clonar el sitio y cambiar la llave de pago | Los datos de pago (`pago_*`) no salen por ninguna puerta pública. Se entregan por respuesta automática de WhatsApp, que además advierte al cliente que no transfiera si ve otra llave |
| Inyección de fórmulas en Sheets | `celdaSegura()` antepone un apóstrofo a todo valor que empiece por `=`, `+`, `-`, `@` o un carácter de control, y recorta a 60 caracteres |
| XSS y carga de recursos ajenos | CSP en la etiqueta `meta` y en `_headers`: `default-src 'none'`, con lista explícita para scripts, estilos, imágenes y `connect-src`. `frame-ancestors` solo funciona en cabecera, por eso existe `_headers`. Una aserción compara las tres copias de la política |
| Payloads absurdos al backend | Tope de 30 ítems, cantidad máxima 200, total máximo 5.000.000, IDs que no estén en el catálogo se descartan, duplicados se colapsan y el `Estado` nunca lo decide quien envía |
| Una puerta sin guardia | Cada puerta del maestro declara su guardia en una sola tabla (`PUERTAS`); una guardia mal escrita no abre (`CONTRATOS.md` §6) |
| Una credencial en los registros de Google | Las claves, los testigos, los tokens de GitHub y, desde la 1.0.0, el token de montaje viajan en el cuerpo de un POST. Las puertas del panel y `entrar` son `soloPost`; las de montaje aceptan todavía GET (volver atrás lo necesita) y lo anotan en `TOKEN_POR_GET`, que el diagnóstico muestra. Mandan un token por GET, declarados: el stub y `panel.gs` hacia una Tienda Básica (§6d) |
| Datos personales | `Pedidos` guarda la ciudad de cada pedido; nombre, celular, correo y dirección solo se guardan cuando se cobra en línea, en `Datos de entrega`, que no sale por ninguna puerta (por WhatsApp viajan en el chat). Lo regula la Ley 1581 de 2012, con el aviso que arman las claves `empresa_*`. Cada hoja es de un solo comercio |

> **Lo que este diseño NO puede impedir.** `wa.me` solo rellena la caja de
> texto: **el cliente puede editar el mensaje antes de enviarlo.** El código de
> verificación permite cruzar contra la fila de `Validaciones`, pero el punto de
> control final es el dueño revisando el total antes de despachar
> (`GUIA-COMERCIANTE.md`).

## 10. Límites nativos de Google

| Recurso | Tope | Qué significa aquí |
|---|---|---|
| Google Sheets | 10 millones de celdas | Muy por encima del tope que impone el propio script |
| Filas de `Pedidos` | 20.000 (`MAX_FILAS`) | Una fila por línea de pedido: **6.000 a 10.000 pedidos**. Al llegar, el script se niega a escribir con un mensaje claro: hay que archivar y vaciar |
| Correo | 100 al día | El resumen gasta 1 |
| Disparadores | 90 minutos al día | El recálculo horario tarda segundos |
| Ejecución | 6 minutos cada una | La más lenta —recalcular tablero con miles de filas— va muy por debajo |
| Concurrencia | 30 ejecuciones simultáneas por cuenta de Google | Ya no la consume cada visita: el catálogo se sirve estático desde Cloudflare (`publicar/catalogo.json`). La consumen enviar un pedido, validar, cobrar, abrir el menú o el panel — sucesos, no visitas |

> No hay una medición reciente de cuántos **pedidos y validaciones a la vez**
> aguanta una tienda con la arquitectura de hoy: si una tienda concentra
> pedidos en picos, es lo primero que habría que volver a medir.

## 11. Cómo se prueba: el emulador `gas.js`

La pieza que hace que `pruebas/todas.sh` pruebe el producto y no una imitación
es `pruebas/gas.js`: un emulador de Google Apps Script y Sheets que **carga
`maestro.gs` tal cual** (copiado a `as.js` en cada corrida) y le inyecta el
entorno de Google (`SpreadsheetApp`, `CacheService`, `LockService`,
`MailApp`, `HtmlService`…). El servidor de pruebas sirve `index.html`
reescribiendo `SCRIPT_URL`, de modo que el navegador habla con el backend
real, emulado pero no reescrito. Lo que se corre en cada sitio lo decide la
compuerta (§13c).

## 12. Decisiones de diseño que ya se tomaron, sin condición de disparo

- **La hoja es la única fuente de verdad** de precios, stock, envíos, cupones,
  marca y textos. `publicar/` guarda lo horneado: `catalogo.json` y, dentro de
  `index.html`, un respaldo —el que escribe `montar/sembrar-respaldo.mjs`—.
- **Fallo cerrado en cupones**: si la hoja no responde, no se aplica
  descuento.
- **Fallo abierto en catálogo**: la página lee `catalogo.json`; si no está,
  pregunta al maestro; si tampoco, pinta el respaldo horneado. Una tienda vacía
  es peor que una desactualizada.
- **Los gráficos del tablero se dibujan con bloques** (`█`) y no con
  `SPARKLINE`: las fórmulas de Sheets cambian de separador según el idioma de
  la hoja.
- **El correo se revisa cada hora** en vez de programar un disparador a una
  hora fija, porque la hora vive en la hoja.

Límites conocidos, aceptados y no accidentales:

- **El total del mensaje de WhatsApp es editable** por el cliente (§9).
- **El contador de usos de un cupón** se actualiza cada hora: uno de un solo
  uso conviene apagarlo a mano apenas se use.
- **El cobro en línea es opcional** (M3.5, decisión 12): de fábrica se acuerda
  por WhatsApp, y `cobro_modo: Pasarela` enciende Bold con las llaves en las
  propiedades del maestro.

---

## 13. Los repositorios y sus flujos

| Repositorio | Qué es | Visibilidad |
|---|---|---|
| `laboratoriodigital/tienda` | La **semilla** de la Tienda Panel: `maestro.gs`, `panel.gs`, `plantilla/`, `montar/`, `pruebas/`, `docs/`, `semilla.json` y los flujos. **También es una tienda publicada** (Laboratorio Digital), con su propio maestro y sus secretos | Privada (decisión D1 de `PLAN-MVP.md`: se hará pública cuando lo decida el dueño) |
| `laboratoriodigital/tiendas` | El repositorio de **servicio**: `flota.json`, `flota/*.mjs`, los flujos `alta`, `conectar`, `flota` y `panel`, el panel estático (`panel/`, generado) y `ESTADO.md` (generado) | Privada |
| Una por comercio | Nace de `alta` clonando la última etiqueta de su semilla (`gh repo create --private`); contiene `publicar/` (lo que Cloudflare sirve) y su copia de lo que es de la semilla | **Privada, siempre** (D1) |

La otra línea de producto, **Orgánico** («Tienda Básica»,
`laboratoriodigital/organico`, 3.x, se actualiza por pull request desde la
flota), comparte `tiendas` pero queda fuera de este documento. Desde la 1.0.0
(30-sep-2026) solo recibe correcciones, **hasta que sus clientes se migren a la
Tienda 2.0**, cliente por cliente y cuando convenga, sin sincronizar código
entre las dos líneas; esto cambia la decisión 20, que decía no migrar. Su
cliente hoy es Cinnamon Beauty. En `flota.json`, la línea `tienda` tiene a la
semilla (Laboratorio Digital) y a `prueba1` (anillo 2).

### Los flujos de una tienda (viajan dentro de la semilla)

| Flujo | Quién lo dispara | Qué hace | Permisos del `GITHUB_TOKEN` |
|---|---|---|---|
| `montaje` | El reloj (lunes 11:00 UTC); una persona desde Actions; el maestro con su `GITHUB_TOKEN` (*Actualizar*: `semilla=true`, `que=todo`); `conectar` (`que=todo`, primer montaje); `flota` › `actualizar` (`semilla=true`, `version`); `restaurar` › `la-version`; `release` en la semilla (`maestro=true`, `PUBLICAR`) | En este orden: trae la versión nueva de la semilla (opcional, §13b), publica `maestro.gs` (opcional, con `PUBLICAR`; sin pedirlo si la semilla trae uno nuevo), hornea el `<head>`, el panel del comerciante, la imagen para compartir, las fotos, el catálogo, el respaldo, el SEO y el nombre del Worker desde la hoja, **pasa la compuerta** (§13c) y publica en `main`. Si falla después de publicar un maestro nuevo, vuelve a publicar el anterior | `contents: write`, `pull-requests: write`, `actions: read` |
| `fotos` | El maestro (*Publicar ahora*, desde el menú o el panel); una persona; el reloj a diario (06:17 UTC), que **solo mira y avisa** | Mira si cambió algo (fotos del Drive, catálogo o configuración); si hay y se pidió, baja, hornea lo que está en su lista `PUBLICA`, pasa la compuerta y publica en `main` | `contents: write`, `pull-requests: write`, `actions: read` |
| `pruebas` | Cada push a `main` y cada pull request (salvo los del bot en ramas `fotos/nuevas-*` y `montaje/*`); `workflow_call` | La compuerta con `GUARDIA=todas`: en la semilla, la suite entera; en una tienda, la tienda viva (§13c). En un pull request exige subir `version` si cambió lo desplegable | Los de fábrica del repositorio |
| `release` | Una persona, **solo en la semilla** (en una tienda se planta y explica por qué; `alta` no lo hereda) | Exige una corrida de `pruebas` en verde por push para ese commit; corta la etiqueta `vX.Y.Z` de `package.json` con `index.html`, `maestro.gs`, `panel.gs` y `publicar.tar.gz`. Al final, **siempre** (0.22.3, bitácora 106): pregunta al maestro vivo de la semilla (`preparar-index.mjs --al-dia`) y, si no es el de este commit, dispara su `montaje` con `maestro=true` y `PUBLICAR` | `contents: write`, `actions: write` |
| `restaurar` | Una persona (`que`, `hasta`, `confirmar` = `RESTAURAR`) | `el-sitio`: vuelve `publicar/` a un commit anterior como un commit nuevo encima. `la-version`: le pide a `montaje` una etiqueta anterior de la semilla | `contents: write`, `actions: write` |

### Los flujos del repositorio de servicio

| Flujo | Entradas | Token | Qué hace |
|---|---|---|---|
| `alta` | `nombre`, `comercio`, `producto` | `FLOTA_TOKEN` | Crea el repositorio **privado** de la tienda clonando la última etiqueta de su semilla, lo limpia de lo que es de otra tienda (`NO_SE_HEREDA` en `flota/alta.mjs`: `release.yml`, catálogo, fotos, fichas, sitemap, imagen, `servicio`…), le pone su `name` de Cloudflare, los permisos de Actions, las fusiones automáticas y `SEMILLA_TOKEN`, y escribe su fila en `flota.json` |
| `conectar` | `nombre`, `maestro_url`, `maestro_token`, `forzar_permiso` | `FLOTA_TOKEN`, `DISPARO_TOKEN` | Le habla al maestro siempre por POST, con el token en el cuerpo (`flota/conectar.mjs › pedir`, 1.0.0): le pregunta su hoja y su proyecto (`identidad`), siembra en la hoja lo que ya se sabe (`sembrar`), comprueba `DISPARO_TOKEN` y **solo si sirve** se lo siembra al maestro (`permiso`), registra la tienda en el Panel de tiendas, escribe `MAESTRO_URL`, `MAESTRO_TOKEN`, `HOJA_ID`, `SCRIPT_ID`, refresca `SEMILLA_TOKEN` y dispara el primer `montaje` |
| `flota` | `accion` (`estado` \| `actualizar` \| `flujos`), `linea`, `anillo`, `version`, `ensayo`, `tienda`, `sin_base` | `FLOTA_TOKEN` | `estado` (también los lunes 12:23 UTC): versión de cada tienda y de su semilla, `ESTADO.md` y `panel/`. `actualizar`: por anillos (§13e). `flujos`: entrega los `.github/workflows` (§13d). De fábrica, `ensayo` = sí |
| `panel` | `version` | `FLOTA_TOKEN` para leer la semilla; `PANEL_SCRIPT_ID` y `PANEL_CLASPRC` | Clona la semilla en esa etiqueta y publica `panel.gs` con `montar/publicar-maestro.mjs` y `ARCHIVO=panel.gs`, actualizando la implementación que ya existe (la URL no cambia). A la 1.0.0 no ha corrido: faltan sus dos secretos (§6d) |

### Quién dispara qué

```
 persona ──► tiendas: alta ─────────► crea TIENDA (repo) ─ copia SEMILLA_TOKEN
 persona ──► tiendas: conectar ─────► maestro (POST): identidad, sembrar, permiso
                               └────► TIENDA: secretos + montaje (que=todo)
 persona/lunes ► tiendas: flota ─ estado ─► lee versiones · ESTADO.md · panel/ (wrangler)
                              ├─ actualizar ► TIENDA: montaje (semilla=true, version) … espera
                              │                 └─ si verde ► entregar flujos (API contents)
                              └─ flujos ────► TIENDA: PUT .github/workflows/*.yml
 persona ──► tiendas: panel ────────► clasp push panel.gs ► Panel de tiendas
 persona ──► SEMILLA: release ──────► etiqueta vX.Y.Z  (+ montaje de la semilla si su maestro quedó atrás)
 comercio ─► menú/panel ─► maestro ─(GITHUB_TOKEN)─► TIENDA: fotos (Publicar ahora)
                                                  └► TIENDA: montaje semilla=true (Actualizar)
 persona ──► TIENDA: restaurar ─ la-version ─► TIENDA: montaje (semilla, version)
 reloj ────► TIENDA: montaje (lunes 11:00 UTC) · fotos (diario 06:17 UTC, solo mira)
 push/PR ──► TIENDA o SEMILLA: pruebas
 push a main ► Cloudflare publica publicar/
```

## 13b. El modelo semilla → tienda

**Qué es de la semilla lo dice `semilla.json`** (`propios`: archivos y carpetas
—las que acaban en `/`—). Hoy: `maestro.gs`, `panel.gs`, `plantilla/`,
`montar/`, `pruebas/`, `docs/`, los flujos `montaje`, `fotos`, `pruebas` y
`restaurar`, `package.json`, `package-lock.json`, `semilla.json` y unos pocos
archivos sueltos, entre ellos `publicar/_headers` —la única pieza de
`publicar/` que es de la semilla—. Todo lo demás de `publicar/` es de la
tienda: lo hornea su montaje con su hoja.

**Cómo llega una versión.** `release` corta la etiqueta en la semilla. La tienda
se actualiza **sola**, con su propio `montaje` y la entrada `semilla`: lo pide el
dueño desde su panel o su menú, la flota por anillos, o una persona desde
Actions. `montar/actualizar-semilla.mjs` clona la semilla (con `SEMILLA_TOKEN`),
toma la etiqueta pedida o la última, y aplica archivo por archivo la regla de
las tres versiones de `montar/semilla.mjs` —la tienda hoy, la semilla nueva, y
la semilla de la versión de la que salió la tienda—: sobrescribe lo que la
tienda no tocó, respeta lo que solo cambió la tienda, y **no toca** ni lo que
cambiaron las dos ni lo distinto cuando no conoce la base; lo dice todo en el
resumen. No hace commit: lo nuevo sale junto con el horneado al final, después
de la compuerta, o no sale. Si trae un `maestro.gs` nuevo, se publica sin
pedir `PUBLICAR` y, si algo falla después, se vuelve a publicar el anterior.
La lista de propios que manda es la de la versión **nueva**.

**Lo que la semilla retira.** `retirados` en `semilla.json` (hoy `servicio` y
`.github/workflows/tienda-nueva.yml`) son rutas que la semilla quitó y que las
tiendas nacidas antes siguen cargando: la actualización las borra y lo dice
(bitácora 94). La lista es acotada: rutas relativas, sin `..`, nunca
`publicar/` ni `.git`, y ninguna puede estar todavía entre las que se entregan.

El borrado ocurre en el disco de la corrida y el paso «¿Cambió algo?» de
`montaje` lo mete en el commit: a `PUBLICA` (publicar/, wrangler.jsonc y los
propios) añade cada retirado que git todavía conoce (`git ls-files`). Hasta la
0.22.3 no lo hacía y el borrado no llegaba nunca a `main` (bitácora 106). Un
retirado dentro de `.github/workflows` no lo puede quitar la tienda —su permiso
no toca flujos—: lo quita la flota (`flota/flujos.mjs › flujosRetirados`, por la
API de contenidos con `FLOTA_TOKEN`), nunca uno que la semilla todavía entrega.
Como el `montaje.yml` que corre es el viejo (ver abajo), el arreglo empieza a
contar cuando la flota le entrega el nuevo a cada tienda.

**«Una versión tarde».** Quien se actualiza a sí mismo corre la versión
**anterior** de sí mismo (bitácoras 95 y 102). Concretamente: el YAML de
`montaje.yml` que está corriendo y el propio `actualizar-semilla.mjs` /
`semilla.mjs` son los de la versión vieja; todo lo que el flujo invoca **desde
el disco después** de actualizar —`montar/*.mjs`, `pruebas/`— ya es lo nuevo.
Por eso la lógica que decide la publicación vive en `pruebas/`
(`publicacion.sh`, `donde.js`, `tienda-viva.js`) y no en el flujo: la escribe
la actualización antes de que corra la compuerta, y una tienda con el flujo
viejo ya usa la guardia nueva en la misma corrida que la trae. Un arreglo en el
YAML, en cambio, llega cuando la flota entrega los flujos (§13d); y un arreglo
en `actualizar-semilla.mjs`, en la actualización siguiente.

**La base importa.** La tienda sabe de qué versión salió por su
`package.json` (la actualización le escribe la `version` nueva). Si la semilla
no tiene esa etiqueta, no hay base y lo distinto no se toca (`SIN_BASE`, de
fábrica `dejar`; `montaje` no expone forzarlo).

## 13c. La compuerta de publicación

Nada se publica en `main` sin pasar la compuerta sobre **los archivos ya
horneados**. La elige `pruebas/publicacion.sh`, que corren `montaje`, `fotos`
y `pruebas`:

| Dónde | Qué corre | Por qué |
|---|---|---|
| **Una tienda** (`donde.js esSemilla()` = falso: `GITHUB_REPOSITORY` ≠ `semilla.json › repositorio`) | Solo `pruebas/tienda-viva.js`, pida lo que pida `GUARDIA` | El código de una tienda es el de una etiqueta que `release` no corta sin la suite en verde. Lo que puede romperse es lo horneado con SUS datos (bitácora 102) |
| **La semilla**, con `GUARDIA=todas` (`pruebas`, y `montaje` cuando trae semilla) | Todas las baterías (`todas.sh`) | Ahí sí se prueba el código |
| **La semilla**, sin `GUARDIA` (`montaje`, `fotos`) | La guardia corta —las baterías que miran lo publicado— si GitHub confirma que el último commit de código tiene una corrida de `pruebas` en verde; si no se puede confirmar, todas | Correr la suite entera sobre código que ya pasó no prueba nada nuevo |
| En cualquier sitio, `SUITE_ENTERA=1` | Todas | Para mirar |

`tienda-viva.js` comprueba **solo invariantes** —ciertas para cualquier
comercio con cualquier hoja—: que exista lo publicado; que la página sepa a qué
maestro preguntar, espere la misma versión que el `maestro.gs` del repositorio
y su política la deje hablar con él; que el catálogo se lea, cada producto
tenga id, nombre y precio y ningún id se repita; que el respaldo se lea, lleve
los mismos productos que el catálogo y sea de la misma tienda; y que la página
abra de verdad en Chromium y pinte las tarjetas de ESA tienda sin un error de
JavaScript (sin navegador, esa parte se salta diciéndolo). Ni un nombre, ni un
color, ni un producto escritos: una aserción de `montaje.js` lo exige. Lo que
es dato del comercio pero no rompe la tienda —una foto nombrada que no subió—
se avisa y no detiene.

`pruebas/tiendita.js` reproduce en la semilla lo que pasaría dentro de una
tienda: arma una copia del repositorio **sin** lo que `alta` no hereda, con
restos de una versión vieja y con los datos de otro comercio, y corre ahí la
compuerta. Es lo que caza, antes del commit, una aserción cierta en la semilla
y falsa en una tienda (bitácora 95).

**Cuando algo falla, se dice todo de una vez (ROADMAP 5.6, «causa 4»).** Se
da por cerrada **por diseño** en la 1.0.0, sin cambiar el flujo: la guardia de
una tienda (`tienda-viva.js`, 0.22.0) es pequeña y pone **todas** sus líneas
FALLA en el resumen de la corrida; `preparar-index` lista **todas** las claves
que bloquean, con su porqué; y `misma-tienda` nombra los tres sitios donde se
pueden cruzar dos tiendas (los secretos, la clave `repositorio`, el proyecto
de Cloudflare). Lo que no hace el flujo —que cada comprobación previa corra
aunque la anterior falle— no es tarea de la 2.0: pasa a la Tienda 3.0 como
principio de diseño.

`publicacion.sh` hace además una cosa que no es probar: **en una tienda, saca
del índice cualquier cambio en `.github/workflows`** antes de publicar (§13d).
Está ahí, y no solo en el flujo, por la misma razón de «una versión tarde».

## 13d. Los flujos de una tienda los entrega la flota

Una tienda **no puede publicar sus propios `.github/workflows`**, con ningún
token (bitácora 103):

- El `GITHUB_TOKEN` de Actions no puede escribir flujos nunca, y si un commit
  los toca, GitHub rechaza el push **entero** (bitácora 101).
- Meter otro token en la URL del push no sirve: `actions/checkout` deja en
  `.git/config` una cabecera `http.https://github.com/.extraheader` con el
  `GITHUB_TOKEN`, y git la manda en cada petición a GitHub gane quien gane en
  la URL. Hasta la 0.20.5 el checkout se hacía con `SEMILLA_TOKEN` y por eso
  funcionaba sin que nadie supiera por qué; al cambiarlo (bitácora 92) todos
  los pushes pasaron a ir con el de Actions.

Así que los entrega la flota: `flota/flujos.mjs` lee los flujos que la semilla
declara propios en su `semilla.json` (en la etiqueta pedida) y los escribe en
cada tienda de la línea **por la API de contenidos** (`PUT
repos/<tienda>/contents/.github/workflows/…`), solo los que cambian, con
`FLOTA_TOKEN` (*Workflows* en escritura). Lo hace:

- **`flota` › `actualizar`**, sola, después de cada tienda cuyo `montaje` termina
  en verde —después y no antes: si el montaje falla, la tienda queda entera en
  la versión anterior, flujos incluidos—;
- **`flota` › `flujos`**, a mano: para una tienda que se actualizó desde su
  panel (esa vía no entrega flujos) o para rescatar una atascada.

Del lado de la tienda, sus flujos no van nunca en su commit: los sacan
`publicacion.sh` y el paso «¿Cambió algo?» de `montaje`, y si aun así el push
se rechaza por flujos, el paso «Publicar en main» los quita y reintenta una
vez. `release.yml` no es propio: nunca se entrega a una tienda.

## 13e. La flota por anillos

`flota.json` lista las tiendas con su `linea` y su `anillo`: **0** pruebas,
**1** primeras, **2** el resto (`alta` pone 2). Las semillas llevan
`"semilla": true` y ningún reparto las toca. `flota` › `actualizar` con
`anillo = N` toma las tiendas de esa línea con anillo ≤ N, las ordena por
anillo y, para la Tienda Panel (`modo: montaje`):

1. lee la versión de la tienda (`package.json` por la API); si ya está, sigue;
2. dispara su `montaje` con `semilla=true`, `que=todo` y la `version`, y
   **espera** a que termine (`gh run watch`);
3. si termina en rojo, **se detiene**: las siguientes no se tocan, y el
   resumen nombra las que quedaron y cómo seguir;
4. si termina en verde, le entrega los flujos (§13d) y pasa a la siguiente.

Una tienda cuyo repositorio contesta **404** (no existe, o el token no la ve)
se salta y se recuerda al final (bitácora 100); si no existe ninguna de las
pedidas, la corrida es roja. `"anillo": "fuera"` —o cualquier cosa que no sea
un número— deja una tienda en la lista y en el estado pero fuera de todo
reparto, `actualizar` y `flujos` (bitácora 105). `tienda` limita la corrida a
una sola. `ensayo` (de fábrica, sí) dice qué haría sin tocar nada.

## 14. El camino de un pedido, paso a paso

1. El comprador abre la tienda. **La página no le pregunta nada a Google**: el
   catálogo viene horneado en `publicar/catalogo.json`; si faltara, lo pide al
   maestro, y si tampoco, pinta el respaldo del propio `index.html`.
2. Arma su carrito en el navegador. El carrito se valida y se sella contra el
   maestro (`?a=validar&sellar=1`), que recalcula todo y escribe el acta en
   `Validaciones`.
3. Al enviar, la página llama a `?a=registrar` —que vuelve a validar, escribe
   las líneas en `Pedidos` en estado *Nuevo* y cierra el acta— y abre WhatsApp
   con el mensaje. El número de pedido lo fija la página; el inventario no se
   toca todavía (§8).
4. Si el pedido no llega a la hoja (red del comprador), queda en su navegador
   como **pendiente** y se reenvía la próxima vez que abra la tienda: son los
   «rescatados» que el panel cuenta.
5. Con `cobro_modo: Pasarela`, en vez de WhatsApp se crea el cobro en Bold
   desde el maestro (`pago_crear`, POST; la firma se calcula allí, nunca en la
   página) y la unidad queda apartada mientras se paga.
6. El comercio ve el pedido en su panel o en su hoja, lo confirma, lo despacha
   y —si `f_rastreo` está encendido— el comprador sigue su estado en
   `pedido.html?n=…&s=…`.

## 15. La medición (0.19.0)

Una clave en la hoja, `analytics_id`, y nada más. Vacía —el valor de fábrica—
la tienda no carga nada de Google, no pone una sola cookie y su política de
seguridad ni siquiera nombra a `googletagmanager.com`. Con un `G-XXXXXXXXXX`
válido, el montaje hornea el fragmento oficial de GA4 en el `<head>` y añade a
la CSP **de esa tienda** los hosts que hacen falta. `publicar/_headers` es
igual para todas las tiendas, así que los nombra siempre: permitir un host no
carga nada, y si no los nombrara, la tienda que sí mide mediría cero sin un
error visible.

La página no llama a `gtag` suelto: llama a **`medir(evento, datos)`**, que se
lo pasa a Google si está y se calla si no. Los puntos de medida son
`ver_producto`, `agregar_al_carrito`, `enviar_pedido`, `pagar_en_linea` y
`pago_confirmado` (este y el primero desde la 0.25.0; contrato en CONTRATOS §6).

**El píxel de Meta (0.25.0, decisión 35)** sigue el mismo camino: la clave
`meta_pixel_id`, el fragmento oficial sin su `<noscript>`, los hosts
`connect.facebook.net` y `www.facebook.com` en la CSP de esa tienda y siempre en
`_headers`, y los eventos traducidos a los estándar de Meta dentro de `medir()`
(un pedido por WhatsApp es `InitiateCheckout`; solo el pago confirmado es
`Purchase`). La política de datos de la página dice quién mide leyendo lo que
de verdad se cargó (`medidores()`). El medidor propio será un tercer destino en
esa misma función; su diseño está en la decisión 35.

## 16. Cloudflare: qué hace, y qué sería Access

Cada tienda es un **Worker solo de recursos estáticos**. Su `wrangler.jsonc`
tiene `name` (único por tienda: dos con el mismo nombre son el mismo Worker y
la segunda pisa a la primera; lo pone `alta` y lo comprueban
`montar/revisar-worker.mjs` y `montar/nombrar-worker.mjs`), `routes` con el
dominio propio (lo escribe `nombrar-worker.mjs` desde `sitio_url`), `assets`
sobre `./publicar` con `not_found_handling: 404-page`, y `preview_urls`. No
declara `main`: no hay código de Worker. Cloudflare está conectado al
repositorio de la tienda (Workers & Pages › Import a repository, el último paso
del alta) y cada push a `main` publica `publicar/`. `publicar/_headers` es
configuración de despliegue —no se sirve— y lleva las cabeceras que un `<meta>`
no puede dar (`frame-ancestors`, `X-Frame-Options`, HSTS) y la caché del
catálogo.

Con dominio propio, Cloudflare puede además **transformar las fotos** en el
borde (`/cdn-cgi/image/...`, la opción `fotos_cdn`); la otra manera —tres
tamaños horneados en el montaje— sigue siendo el valor de fábrica y el
respaldo (decisión 22).

El **panel de la flota** (`tiendas/panel/`, otro Worker solo de recursos,
`flota-panel`) lo publica `flota` › `estado` cuando `tiendas` tiene
`CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`; sin ellos lo dice y sigue.
**Cloudflare Access** es la puerta de identidad que debe ir delante de esa
dirección: la página no tiene secretos, pero sí la lista de clientes. Se
explica en `DESPLIEGUE.md` y en la sección 3.7 del roadmap.

## 17. Volver atrás (0.18.0)

Tres cosas se pueden perder y cada una tiene su punto de restauración: los
**datos** (las copias semanales de la hoja en el Drive del administrador, que
se restauran por pestañas desde el editor del maestro con `A5_respaldos` y
`A6_restaurarDatos`), el **sitio** (cada commit de `main` que tocó
`publicar/`, que vuelve con `restaurar` › `el-sitio` como un commit nuevo
encima) y la **versión** (las etiquetas `vX.Y.Z` de la semilla, que vuelven con
`restaurar` › `la-version`, pidiéndole a `montaje` esa versión exacta aunque
sea anterior). La tabla completa está en `DESPLIEGUE.md` › *Volver atrás*.

## 18. El mapa del repositorio de la semilla

| Ruta | Qué es |
|---|---|
| `maestro.gs` | El backend entero de una tienda: puertas, reglas de negocio, correo, pagos, respaldo, restauración, el stub que genera |
| `panel.gs` | El Panel de tiendas del operador (hoja aparte, nunca se comparte con un comercio) |
| `plantilla/` | `index.html`, `admin.html`, `pedido.html` y `404.html` **sin hornear**: la fuente |
| `publicar/` | Lo que Cloudflare sirve. Se hornea en el montaje; no se edita a mano (salvo `_headers`, que es de la semilla) |
| `montar/` | Las herramientas, cada una con su `ESCRIBE`. Horneado: `preparar-index`, `preparar-admin`, `preparar-compartir`, `traer-fotos`, `catalogo-estatico`, `sembrar-respaldo`, `sembrar-seo`, `nombrar-worker`. Comprobaciones: `sondear`, `misma-tienda`, `revisar-worker`, `revisar-fotos-cdn`, `revisar-clasprc`, `tiempos`. Publicar y actualizar: `publicar-maestro`, `actualizar-semilla` + `semilla`, `volver-atras`. En el equipo: `configurar-tienda`, `sembrar-configuracion`, `tienda` |
| `pruebas/` | Las baterías, el emulador `gas.js`, la compuerta (`publicacion.sh`, `donde.js`, `tienda-viva.js`) y `tiendita.js`. `./pruebas/todas.sh` las corre todas |
| `docs/` | Este archivo, `CONTRATOS.md` (normativo), `DESPLIEGUE.md`, `RUNBOOK-TECNICO.md`, `ACTUALIZAR-UNA-TIENDA.md`, `FUNCIONALIDADES.md`, `PLAN-MVP.md`, `ROADMAP.md`, `DECISIONES.md`, `BITACORA.md`, `GUIA-COMERCIANTE.md` (y su versión imprimible en `manuales/`), `PAGOS-BOLD.md`, `ANTES-DE-SALIR.md`, `TRASPASO.MD`, `CONOCIMIENTO.md` (idea sin construir), `EVALUACION-stub-automatico.md` (histórica) y `TRASLADO-3.0.md` (con qué arranca la Tienda 3.0) |
| `semilla.json` | Qué es de la semilla (`propios`) y qué retiró (`retirados`), §13b |
| `flota.json` (en `tiendas`) | La lista de tiendas, su línea y su anillo, §13e |

## 19. Cómo se comprueba que esto es verdad

La suite entera —más de 2.400 aserciones— corre sobre el código real, no sobre
una copia: `as.js` es `maestro.gs` y `pn.js` es `panel.gs`, copiados en cada
corrida. El emulador `gas.js` imita solo lo que el maestro usa de Google, y las
baterías de navegador sirven el `publicar/index.html` de verdad con Playwright.
La flota tiene las suyas, sin red ni token (`node flota/pruebas.mjs`, al
principio de cada corrida de `alta` y `flota`).

Tres reglas de la casa sostienen el conjunto, y están comprobadas por sus
propias aserciones: **R1**, las columnas y las claves se agregan al final;
**patrón 2**, una regla vive en un solo sitio (y cuando no se puede, una
aserción compara las copias, como con la CSP); y **cada guardia nace con su
control negativo**, verificado en rojo antes de darlo por bueno.

## 20. Modos de fallo conocidos

Lo que ya pasó, cómo se ve y qué lo contiene hoy. El relato está en la
bitácora.

| Síntoma | Causa | Qué lo contiene hoy | Bitácora |
|---|---|---|---|
| El montaje se para: «el maestro publicado contesta la versión …» | El repositorio trae un maestro nuevo y nadie lo publicó | `preparar-index.mjs` se para antes de escribir y dice qué casilla marcar; espera hasta 180 s si el maestro se publicó en la misma corrida. En la semilla, `release` publica su maestro si quedó atrás | 56, 57, 106 |
| `conectar`: «El maestro no abre su hoja» con el diagnóstico funcionando | La versión implementada es anterior a pegar `HOJA_ID` | `A0_instalar` guarda `HOJA_ID` en las propiedades | 74 |
| *Publicar* dice «el permiso no sirve o se venció» | `DISPARO_TOKEN` sobre «Only select repositories», vencido, o un `GITHUB_TOKEN` viejo que se respetaba | `conectar` comprueba antes de sembrar; el maestro reemplaza el guardado si no lista los flujos | 87, 89, 96, 97 |
| Todo el montaje saltado y solo se ve un error del cronómetro | El checkout colgaba de un permiso opcional (`SEMILLA_TOKEN`) que no alcanzaba | El checkout usa el permiso propio; los pasos toleran herramientas que una tienda vieja no tiene | 90, 92 |
| Una tienda no publica por una batería en rojo que no mira ningún fallo | La compuerta era la suite de la semilla, con sus suposiciones | La tienda viva (§13c) y la tiendita | 93, 95, 102 |
| Una tienda arrastra archivos que la semilla ya quitó | Actualizar solo escribía, y después el borrado no entraba en el commit | `retirados`; `montaje` indexa su borrado y la flota quita los flujos retirados (0.22.3) | 94, 106 |
| Push rechazado: «refusing to allow a GitHub App to create or update workflow» | La tienda intentó publicar flujos; la cabecera `extraheader` del checkout manda el `GITHUB_TOKEN` | Los flujos salen del commit y los entrega la flota (§13d) | 101, 103 |
| `fotos`: «Nada que publicar pese a haber detectado novedades» | La lista `PUBLICA` no cubría lo que se horneaba; y el paso que mira comparaba la plantilla con lo publicado | Una batería compara `PUBLICA` con lo que declaran las herramientas; el que mira aplica la hoja **sobre lo publicado** (`baseParaRevisar`) | 99, 104 |
| La flota se detiene en una tienda que no existe o que no importa | Una fila vieja en `flota.json` | 404 se salta; `"anillo": "fuera"` | 100, 105 |
| Una columna renombrada a mano en Catálogo | Hasta la 0.23.0 el maestro leía por posición: renombrar no rompía, pero MOVER sí | Desde la 0.24.0 se lee por nombre (`mapaDeColumnas`); si falta un nombre, por posición y anotado | 110 |
| Un commit de fotos que dice «NO se pudieron traer» sin que fallara nada | `$fallo_fotos` se leía en otro paso (otra shell) | Se pasa por `$GITHUB_ENV` como `FALLO_FOTOS` (0.24.0) | 110 |
| «El maestro respondió 404 a «identidad»» tras esperar decenas de segundos | La redirección de Apps Script a `script.googleusercontent.com` caduca cuando el script tarda (frío o recién publicado) | `alMaestro` reintenta un 404 lento, con pausa, y el mensaje distingue el 404 lento del de acceso (0.22.4) | 107 |
| Una foto `.png` publicada como `.jpg`: el producto sin foto, el logo sin transparencia | `convertir()` escribía el respaldo siempre en JPEG con extensión `.jpg` | El respaldo lleva el nombre y el formato exactos de la hoja; `novedades` vuelve a bajar lo que el registro da por hecho y no está (0.22.5) | 108 |
| En la semilla, una batería en rojo por los datos de SU hoja (el icono de la pestaña es una foto) | La batería solo sabía ver el caso de fábrica (patrón 4) | `config.js` acepta las tres formas que produce `iconoDeLaTienda`: dibujo, `fotos/<archivo>` publicado y `https://` (0.22.4) | 107 |
| `restaurar` › `el-sitio` dice «Ya estaba así» y no vuelve nunca | Comparaba el índice con el árbol, que son iguales tras el checkout | Compara contra `HEAD` (0.22.3) | 106 |
| Un maestro nuevo publicado y la corrida falla después | Google sirve el maestro nuevo con el index viejo | `montaje` vuelve a publicar el maestro del commit de partida | — (`montaje.yml`, paso 7) |
| Una hoja publica en el sitio de otra tienda | Secretos o stub cruzados entre dos tiendas | `misma-tienda.mjs` compara la clave `repositorio` de la hoja con el repositorio; el maestro rechaza un stub de otra hoja | 76 |
| Dos tiendas en el mismo Worker | El `name` de la semilla se quedó en `wrangler.jsonc` | `alta` lo pone; `revisar-worker.mjs` y `nombrar-worker.mjs` | — (A-3) |
| El token de montaje quedaba en los registros de acceso de Google (riesgo del PLAN §7, abierto hasta la 0.25.0) | Las herramientas, `conectar` y el Panel de tiendas lo mandaban como `?t=` en un GET | Desde la 1.0.0 va en el cuerpo de un POST; el maestro acepta todavía GET en las puertas de montaje (volver atrás corre herramientas viejas) pero lo anota en `TOKEN_POR_GET` y el diagnóstico lo dice; `sondeo.js` cuenta los tokens que llegan en una dirección. Mandan todavía un token por GET, a la vista: el stub y `panel.gs` hacia una Tienda Básica (§6d) | 113 |
| `test.js` en rojo de vez en cuando, sin cambio de código | El cupón lo valida el maestro por red y la batería esperaba un número fijo de cuadros | La batería espera a que el aviso deje de decir «Validando…» (1.0.0) | — |
