# Desplegar una tienda, de punta a punta

**Este documento es el mapa.** Dice todo lo que pasa desde que no existe nada
hasta que el comercio está vendiendo, y después: publicar, actualizar, volver
atrás. En orden, con quién hace cada cosa, qué pide, qué secretos usa, qué
comprueba y cómo falla. Los clics y las comprobaciones de cada paso están en
`RUNBOOK-TECNICO.md`; los síntomas y qué hacer, en su sección *I · Incidentes*.
Lo que el producto sabe hacer, por categorías, en `FUNCIONALIDADES.md`.

> **Por qué existe, y por qué es el único.** Hasta la 3.0.0 había cuatro
> documentos más describiendo tramos de este mismo procedimiento —`RUNBOOK.md`,
> `DESPLIEGUE-CLIENTE.md`, `MONTAJE.md`, `INSTALAR.md`— y los cuatro se habían
> quedado atrás en distintos puntos: uno seguía enseñando fotos por Cloudinary
> en vez de Drive, otro decía que el catálogo se lee en vivo cuando hace tiempo
> se hornea, otro llamaba «Confirmado» a un estado que se renombró a «Pagado».
> Es el patrón 2 de la bitácora a escala de documentación: varias copias del
> mismo procedimiento, y siempre una se queda atrás sin que nadie lo note,
> porque un documento no se cae cuando miente. Se consolidó todo lo que seguía
> siendo cierto en este único archivo, y los cuatro se borraron.

**Leyenda.** ⚙ = lo hace un flujo o una herramienta, sin manos. Sin marca = lo
hace una persona. ⚠ = el orden o el dato cuesta una hora si se hace mal.

---

## Las piezas, y quién mueve cada una

Tres clases de repositorio, cada uno con sus flujos (`.github/workflows`):

| Repositorio | Flujos | Quién los dispara |
|---|---|---|
| **`laboratoriodigital/tiendas`** — el servicio (privado) | `alta`, `conectar`, `flota` (acciones `estado`, `actualizar`, `flujos`), `panel` | una persona, desde Actions. `flota` › `estado` corre además solo los lunes (`23 12 * * 1`, 7:23 en Colombia) |
| **`laboratoriodigital/tienda`** — la semilla de Tienda Panel | `release`, `pruebas` (y los de tienda, que en la semilla también corren) | `release`: una persona. `pruebas`: cada push a `main` y cada pull request |
| **una tienda** (p. ej. `laboratoriodigital/prueba1`) | `montaje`, `fotos`, `pruebas`, `restaurar` | una persona desde Actions; la flota (`montaje` con `semilla`); el maestro de la tienda con su `GITHUB_TOKEN` (`fotos` desde *Publicar ahora*, `montaje` con `semilla` desde *Actualizar*); `restaurar` (le pide `montaje`); el reloj (`montaje` los lunes `0 11 * * 1`; `fotos` a diario `17 6 * * *`, que solo mira) |

Y dos piezas de Google por tienda —la hoja del comercio y su **maestro**
(`maestro.gs`, un proyecto de Apps Script suelto, implementado como aplicación
web)—, más una del operador: la hoja **Panel de tiendas** con `panel.gs`.

La otra línea de producto, Tienda Básica (`laboratoriodigital/organico`, 3.x),
se actualiza por pull request desde la flota y queda fuera de este documento.

---

## El camino normal (0.18.0): `alta` y `conectar`

**Así se monta una tienda hoy.** Dos flujos en `laboratoriodigital/tiendas` ›
Actions hacen todo lo que es de GitHub; lo de Google vive en la cuenta de cada
tienda y no se puede automatizar del otro lado. Los pasos numerados de más
abajo son **el detalle de lo que hacen**: sirven para entender y para cuando
algo falla.

| Orden | Quién | Entradas | Qué pasa |
|---|---|---|---|
| **1. alta** ⚙ | tú: Actions › [alta](https://github.com/laboratoriodigital/tiendas/actions/workflows/alta.yml) › *Run workflow* | `nombre` (minúsculas, números y guiones, 3 a 40), `comercio`, `producto` (`tienda` = Tienda Panel · `organico` = Tienda Básica) | Crea el repositorio **privado** clonando la **última etiqueta** `vX.Y.Z` de la semilla de ese producto, sin el catálogo, las fotos, las fichas, la imagen, el `sitemap`, el dominio ni `release.yml` de otra tienda; publica `index.html`, `admin.html`, `pedido.html` y `404.html` desde `plantilla/`; le pone `"name"` en `wrangler.jsonc`, los permisos de Actions, las fusiones automáticas y `SEMILLA_TOKEN`; escribe su fila en `flota.json` (anillo 2). En el resumen deja **«Lo que falta, en este orden»** con los datos de ESA tienda *(pasos 1 y 10 parciales)* |
| **2. Google** | tú, en una cuenta nueva del comercio | — | Hoja › pegar `maestro.gs` › pegar `HOJA_ID` › **`A0_instalar`** › **Implementar** › abrir la URL una vez › llenar la hoja › `A2_diagnosticoCompleto` para copiar *Servicio* y *Token* *(pasos 3 a 9)* |
| **3. conectar** ⚙ | tú: Actions › [conectar](https://github.com/laboratoriodigital/tiendas/actions/workflows/conectar.yml) › *Run workflow* | `nombre` (el del alta), `maestro_url`, `maestro_token`; y la casilla `forzar_permiso` (de fábrica sin marcar) | Le pregunta al maestro su hoja y su proyecto; le escribe a la hoja `negocio`, `repositorio` y `sitio_url` sin pisar lo que el comercio ya puso; comprueba `DISPARO_TOKEN` y, si sirve, se lo siembra al maestro como `GITHUB_TOKEN`; **registra la tienda en la hoja de administración**; pone `MAESTRO_URL`, `MAESTRO_TOKEN`, `HOJA_ID`, `SCRIPT_ID` y refresca `SEMILLA_TOKEN`; y dispara el primer `montaje` (`que=todo`) *(pasos 10 y 11)* |
| **4. el stub** | tú, en el editor del maestro **de esa tienda** | — | `A1_generarStub` y pegar lo que imprime en Extensiones › Apps Script de la hoja *(paso 12)* |
| **5. Cloudflare** | tú, **cuando ese montaje termine en verde** | — | Workers & Pages › Create › Import a repository. Al final a propósito: antes publicaría lo que todavía no es esta tienda *(paso 2)* |
| **a mano, solo** | tú | — | `CLASPRC`: la credencial de Google de la tienda, que nadie más puede crear *(paso 10)*. Sin ella, ninguna actualización que traiga un `maestro.gs` nuevo puede terminar (ver *Actualizar*) |

> La lista que deja `alta` en su resumen pone el stub **antes** de `conectar`.
> Funciona igual, pero el stub lleva el nombre del comercio que diga la hoja
> en ese momento, y `negocio` lo escribe `conectar` si estaba vacío: generado
> antes, sale como «Tienda» y hay que regenerarlo. Por eso aquí va después.

> **⚠ Implementa DESPUÉS de pegar `HOJA_ID` y correr `A0_instalar`** (bitácora
> 74). La aplicación web corre la versión IMPLEMENTADA, no lo que ves en el
> editor: si pegas algo después, *Implementar › Gestionar implementaciones ›
> lápiz › Versión: Nueva versión*. Desde la 0.17.0 `A0_instalar` guarda
> `HOJA_ID` en las propiedades, que son de todas las versiones, así que basta
> con ejecutarlo. Si `conectar` dice «El maestro no abre su hoja» con el
> diagnóstico funcionando, es esto, y el propio mensaje lo explica.

> **⚠ El stub se genera desde el maestro DE ESA TIENDA** (bitácora 76). Uno
> generado por el maestro de otra lleva su URL y su token: el menú aparece,
> funciona, y administra la tienda de al lado. Desde la 0.18.0 el maestro lo
> rechaza, pero el que hay que pegar sigue siendo el suyo.

### Lo que queda corriendo solo, después

- **La hoja de administración** (*Panel de tiendas*) recibe la tienda sola,
  porque `tiendas` tiene `PANEL_URL` (la aplicación web de esa hoja) y
  `PANEL_CLAVE` (su menú › *Clave para el alta*).
- **El portal**: en esa hoja, menú **Panel › Abrir el portal** — cada tienda con
  sus cifras y sus enlaces (ver la tienda, su panel, su repositorio, publicar,
  volver atrás), y arriba las acciones de la flota.
- **Publicar**: *Publicar ahora* (menú de la hoja o panel del comercio) dispara
  `fotos`. Ver *Publicar*, más abajo.
- **Actualizar**: `release` en la semilla y `tiendas` › `flota` › `actualizar`,
  por anillos; o la propia tienda desde su panel, el menú de su hoja o su
  `montaje` con `semilla`. Ver *Actualizar una tienda*.
- **Volver atrás**: el flujo `restaurar` de cada tienda, y `A5_respaldos` /
  `A6_restaurarDatos` en su maestro. Ver *Volver atrás*.

---

## Secretos, tokens y llaves: dónde vive cada uno

Nombres, nunca valores. **Los tokens no se imprimen** en ningún resumen:
`conectar` enmascara el de la tienda en su primer paso y las herramientas que
clonan con un token lo tapan (`***`) en sus mensajes de error.

**En `laboratoriodigital/tiendas`** (Settings › Secrets and variables ›
Actions). Ninguno se copia a otro sitio, salvo los dos que se dice:

| Nombre | Permisos mínimos | Quién lo usa, y para qué |
|---|---|---|
| `FLOTA_TOKEN` (desde la 0.24.0, también el del alta) | De grano fino, del **mismo dueño** que las tiendas, sobre **todos** sus repositorios —una tienda que el token no ve contesta 404 y la flota la **salta**; el repositorio nuevo aún no existe al crearlo—: *Administration*, *Contents*, *Pull requests*, *Workflows*, *Secrets* y *Actions* en lectura y escritura; *Metadata* lectura | `alta`: ver la semilla, crear el repositorio, clonar la etiqueta y empujarla, permisos de Actions y fusiones, poner `SEMILLA_TOKEN`. `conectar`: poner los secretos de la tienda y disparar su `montaje`. `flota`: `estado`, `actualizar` (disparar y esperar el `montaje` de cada tienda; en la Básica, ramas y pull requests) y `flujos` (escribir y retirar `.github/workflows` en cada tienda). `panel`: leer la semilla |
| `ALTA_TOKEN` (en retiro) | El mismo que `FLOTA_TOKEN` hacía antes por separado. **Decisión 34:** se funde en `FLOTA_TOKEN`; mientras exista, `alta`, `conectar` y `panel` lo prefieren (`ALTA_TOKEN \|\| FLOTA_TOKEN`) y el resumen de `alta` dice cuál usó | Para retirarlo: dar a `FLOTA_TOKEN` *Administration* y *Secrets* en escritura, borrar el secreto `ALTA_TOKEN` de `tiendas` y revocar el token |
| `SEMILLA_TOKEN` | De grano fino: *Contents* lectura sobre la semilla. Solo hace falta si la semilla es privada *(sin verificar aquí si lo es)* | No lo usa `tiendas`: `alta` lo **copia** a cada tienda al nacer y `conectar` lo **refresca** cada vez que corre (0.21.2). Ver la tabla de la tienda |
| `DISPARO_TOKEN` | De grano fino, sobre **todos** los repositorios del dueño (no «Only select repositories»: una lista fija no incluye las tiendas que nacen después), **solo** *Actions: Read and write* | `conectar`: comprueba que ve la tienda (`GET /repos/…`) y **solo entonces** se lo siembra al maestro por POST (`a=permiso`), que lo guarda como `GITHUB_TOKEN` |
| `PANEL_URL` · `PANEL_CLAVE` | No son de GitHub: la URL `/exec` de la hoja *Panel de tiendas* y la clave de su menú › *Clave para el alta* | `conectar`: registra la tienda en esa hoja (POST `registrar_tienda`). Opcionales: sin ellos lo dice y sigue |
| `PANEL_SCRIPT_ID` · `PANEL_CLASPRC` | El id del proyecto de Apps Script de esa hoja (entre `/projects/` y `/edit`) y el contenido de `~/.clasprc.json` de `clasp login --no-localhost` con la cuenta dueña de esa hoja | `panel`: publicar `panel.gs`. Sin los dos, se niega y lo dice |
| `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` | *Account › Workers Scripts: Edit* y *Account › Account Settings: Read* (y *Zone › Workers Routes: Edit* si el panel va en dominio propio). Con vencimiento, sin filtro de IP | `flota` › `estado`: publica `panel/` con `wrangler deploy`. Opcionales: sin ellos lo dice y sigue |

**En cada tienda** (su repositorio › Settings › Secrets and variables ›
Actions):

| Nombre | Quién lo pone | Quién lo usa | Si falta |
|---|---|---|---|
| `MAESTRO_URL` · `MAESTRO_TOKEN` | ⚙ `conectar` | `montaje`, `fotos` (y `publicar-maestro.mjs` para comprobar lo publicado) | los dos flujos se saltan casi todo y lo dicen: «Faltan los secretos `MAESTRO_URL` y `MAESTRO_TOKEN`» |
| `HOJA_ID` · `SCRIPT_ID` | ⚙ `conectar` (se los pregunta al maestro) | `montaje`, solo al publicar el maestro | no publica el maestro: «No publiqué el maestro: faltan secretos» |
| `CLASPRC` | **tú**, una vez por tienda | `montaje`, al publicar el maestro | igual que el anterior |
| `SEMILLA_TOKEN` | ⚙ `alta` y `conectar` (copia del de `tiendas`) | `montaje` con `semilla` (clonar la semilla, `montar/actualizar-semilla.mjs`) y `restaurar` › `la-version` (leer sus etiquetas). `montaje` además pregunta si alcanza a la propia tienda y, si no, lo dice: desde la 0.22.1 ese aviso no cambia nada (bitácora 103) | se intenta sin credenciales: si la semilla es privada, «No pude leer la semilla» |
| `GITHUB_TOKEN` de Actions | GitHub, en cada corrida | `checkout`, el push a `main`, pull requests de reserva, preguntar por la corrida de `pruebas` (`publicacion.sh`), `restaurar` al disparar `montaje` | — Nunca puede escribir `.github/workflows` |

**En las propiedades del script** (*Script Properties*) del maestro de cada
tienda. **Las Script Properties no están cifradas**; nada de esto va en la
hoja, en el repositorio, en los secretos de GitHub de la tienda ni en el panel:

| Nombre | Quién lo pone | Para qué |
|---|---|---|
| `TOKEN` (token de montaje, `tk-…`) · `TOKEN_MENU` | ⚙ `A0_instalar` (lo inventa la primera vez); `A3_rotarToken` lo cambia | el de montaje abre las puertas de las herramientas (`bloques`, `sembrar`, `identidad`, fotos); el del menú va en el stub |
| `HOJA_ID` | ⚙ `A0_instalar` (0.17.0), desde la línea `var HOJA_ID` | que la versión implementada sepa su hoja aunque se implementara antes de pegarla |
| `GITHUB_TOKEN` | ⚙ `conectar` (desde `DISPARO_TOKEN`), o a mano | *Publicar ahora* (dispara `fotos.yml`) y *Actualizar* (dispara `montaje.yml` con `semilla`), por la API de GitHub. Se reemplaza solo si ya no sirve (0.20.2), o con `forzar_permiso` |
| `BOLD_IDENTIDAD_SANDBOX` · `BOLD_SECRETA_SANDBOX` · `BOLD_IDENTIDAD_PRODUCCION` · `BOLD_SECRETA_PRODUCCION` | **tú**, a mano | cobrar en línea con Bold (`docs/PAGOS-BOLD.md`) |

La hoja *Panel de tiendas* (`panel.gs`) tiene las suyas: `CLAVE_ALTA` (la
inventa su menú › *Clave para el alta*; su copia es `PANEL_CLAVE` en `tiendas`)
y, opcional, un `GITHUB_TOKEN` propio de grano fino con solo *Actions:
read-only*, para leer las ejecuciones sin quedarse en las 60 peticiones por
hora que GitHub da sin token.

**Por dónde viaja cada uno.** El `GITHUB_TOKEN` del maestro y la clave del
panel de administración van por **POST**, nunca en una dirección. El token de
montaje (`MAESTRO_TOKEN`), en cambio, lo mandan las herramientas de `montar/`,
`conectar.mjs` y `publicar-maestro.mjs` como parámetro `t` de peticiones GET a
la `/exec`: queda en los registros de acceso de Google. Es su diseño de hoy, no
un descuido de este documento.

---

## De un vistazo

Lo de arriba, paso a paso. **Los marcados con ⚙ los hace un flujo**; los demás
son de Google, o del navegador.

```
   TÚ                          GITHUB / CLOUDFLARE           GOOGLE
   │
   ├─ 1. repositorio ⚙ ────────► lo clona `alta` de la última etiqueta
   ├─ 2. Cloudflare ──────────► apunta a publicar/ (AL FINAL: ver el camino normal)
   ├─ 3. cuenta + hoja ───────────────────────────────────► hoja del comercio
   ├─ 4. pegar maestro.gs ────────────────────────────────► Apps Script
   ├─ 5. IMPLEMENTAR (1 vez) ─────────────────────────────► la URL /exec
   ├─ 6. abrir esa URL una vez ───────────────────────────► el maestro se sabe
   ├─ 7. A0_instalar() ───────────────────────────────────► pestañas y avisos
   ├─ 8. llenar la hoja
   ├─ 9. A2_diagnosticoCompleto() ─► servicio + token
   ├─ 10. los secretos ⚙ ───────► los pone `conectar` (menos CLASPRC)
   ├─ 11. flujo `montaje` ⚙ ───► lo dispara `conectar`
   ├─ 12. A1_generarStub() ───────────────────────────────► pegar en la hoja
   ├─ 13. fotos al Drive ─────────────────────────────────► «Publicar ahora» ⚙
   ├─ 14. WhatsApp Business: respuesta automática
   ├─ 15. las cuatro comprobaciones
   └─ 16. entrega
```

El orden **no es negociable** en tres sitios, y los tres cuestan una hora si se
invierten. Están marcados con ⚠ más abajo.

---

## Antes de la primera tienda de tu vida (no por tienda)

- Cuenta de GitHub con la organización, y las dos semillas: `tienda` (Tienda
  Panel) y `organico` (Tienda Básica). El alta clona **etiquetas**, así que cada
  semilla necesita al menos una versión publicada con `release`.
- El repositorio de servicio `laboratoriodigital/tiendas`, con los secretos de
  la tabla de arriba. Imprescindibles: `ALTA_TOKEN` y `FLOTA_TOKEN`; para que
  el panel y el menú publiquen, `DISPARO_TOKEN`; para que la hoja de
  administración se llene sola, `PANEL_URL` y `PANEL_CLAVE`.
- La hoja **Panel de tiendas**: una hoja de cálculo tuya con `panel.gs` pegado
  en su Apps Script, `instalar` ejecutado, implementada como aplicación web
  (Ejecutar como: yo · Acceso: cualquiera) y su menú › *Clave para el alta*.
  Es el registro del negocio y el portal. La primera implementación es a mano;
  las versiones siguientes las publica el flujo `panel` (ver más abajo).
- El dominio en Cloudflare, si las tiendas van a tener subdominio propio.
- `npm i -g @google/clasp` y `clasp login` — **con la cuenta dueña de la tienda
  que vas a montar**, no con la tuya (es lo que produce `CLASPRC`).
- Habilitar la API de Apps Script una vez por cuenta:
  `script.google.com/home/usersettings`.

---

## 1 · El repositorio de la tienda  · ⚙ `alta`

> ⚙ **Esto lo hace `alta`.** Lo de abajo es lo que hace, por si hay que
> revisarlo o rehacerlo a mano. El flujo viejo, `tienda-nueva.yml`, se fue en
> la 0.17.0 (su copia suelta en `Claude outputs/` es un resto histórico que
> nada usa).

**Qué pide y qué comprueba, en orden** (`alta.yml`, `flota/alta.mjs`):

1. Las pruebas de la flota, sin red (`node flota/pruebas.mjs`).
2. **El formulario** (`alta.mjs validar`): nombre válido, comercio no vacío,
   producto que exista en `flota.json`, y que ni el repositorio
   (`<dueño de la semilla>/<nombre>`) ni el sitio (`https://<nombre>.<dominio>`)
   estén ya en `flota.json`. Los errores salen en el registro de ese paso.
3. **Que `ALTA_TOKEN` ve la semilla**, y que el repositorio no existe ya. Si
   no: «ALTA_TOKEN no ve la semilla» con las tres causas, o «Ya existe … No
   toco nada».
4. **La última etiqueta** `vX.Y.Z` de la semilla (`nucleo.mjs ›
   ultimaEtiqueta`). Sin ninguna: «Corre su **release** primero».
5. **Crea el repositorio privado**, clona la etiqueta, la limpia
   (`NO_SE_HEREDA`), rehace `publicar/` desde `plantilla/`, cambia el `"name"`
   de `wrangler.jsonc` por el nombre corto y le quita las `routes` de la
   semilla, escribe un `README.md` propio, **comprueba que cada `node
   montar/x.mjs` que llaman sus flujos existe** (bitácora 90) y empuja `main`.
   ⚠ Esa comprobación va *después* de `gh repo create`: si falla, el
   repositorio queda creado y vacío (ver el runbook).
6. Permisos: *Workflow permissions* en escritura y aprobar pull requests;
   fusión *squash*, fusión automática y borrar ramas al fusionar.
7. `SEMILLA_TOKEN` en la tienda, si existe en `tiendas`.
8. La lista de lo que falta al resumen, la fila en `flota.json` (`anillo: 2`)
   y un commit en `tiendas`.

`alta` y `flota` comparten el grupo de concurrencia `flota`: no corren a la
vez.

**Privado, y lo que cuesta.** Actions es gratis e ilimitado en repositorios
públicos; en privados hay minutos al mes para toda la cuenta, repartidos entre
todas las tiendas. `alta` crea el repositorio privado.

**La casilla que se olvidaba siempre**, en las tiendas montadas a mano:
Settings → Actions → General → Workflow permissions → *Read and write
permissions*. Sin ella `montaje` y `fotos` corren enteros y fallan en la última
línea, al empujar a `main`. `alta` la marca; los dos flujos, si pasa, lo dicen
en su resumen («No se pudo publicar»).

> Hasta el 18 de septiembre de 2026 aquí decía *Allow GitHub Actions to create
> and approve pull requests*, porque `montaje` publicaba abriendo un pull
> request y fusionándolo. Ya no: publica directo en `main`, y esa casilla dejó
> de hacer falta para el camino normal. Sigue haciendo falta si se dispara el
> flujo con **Cómo publicar lo que salga → con-pull-request**, o si `main` está
> protegida y el push cae al pull request de reserva.

**⚠ El `"name"` de `wrangler.jsonc`.** Dos tiendas con el mismo `name` son el
mismo sitio en Cloudflare, y la segunda pisa a la primera — y nada avisa: las
dos siguen desplegando en verde. `alta` pone el nombre corto; después, **cada
`montaje` lo reescribe** con el nombre del comercio convertido en apodo
(`montar/nombrar-worker.mjs`: minúsculas, sin acentos, guiones, 40 caracteres
como mucho), y si cambia lo dice en el registro («antes: …»). Así que el nombre
definitivo es el de `negocio`, no el del alta, y cambiar `negocio` en la hoja
cambia el `name` en el montaje siguiente. `montar/revisar-worker.mjs` detiene
el montaje si el archivo sigue con el marcador de la semilla.

## 2 · Cloudflare  · ~3 min

Conectar el repositorio. Rama de producción `main`, comando de compilación
**vacío**, directorio `publicar/` (lo dice también `wrangler.jsonc` ›
`assets.directory`). Empujar a `main` despliega: la integración es un webhook
del repositorio, no un flujo de Actions, así que despliega también lo que
empuja el `GITHUB_TOKEN`.

## 3 · La cuenta de Google y la hoja  · ~10 min

**Una cuenta de Google por tienda, creada por ti.** Con tu celular como
recuperación y la contraseña en tu gestor. El comercio es **editor** de la hoja
compartida, no dueño de la cuenta.

Crear la hoja de cálculo en esa cuenta. Copiar su ID de la URL, entre `/d/` y
`/edit`.

## 4 · El maestro  · ~5 min

Apps Script → **proyecto suelto** (no unido a la hoja). Pegar `maestro.gs`
entero **del repositorio de esta tienda** y poner el `HOJA_ID` arriba.

## 5 · ⚠ Implementar como aplicación web — **una sola vez en la vida**

Implementar → Nueva implementación → Aplicación web.
**Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.**

> **⚠ Esta es la única vez que se crea una implementación NUEVA.** Una
> implementación nueva **estrena URL** y deja la tienda muda.

Comprueba con dos ventanas, no una:

- **En incógnito**, abrir `<URL>?a=version` → debe devolver
  `{"ok":true,"version":"..."}`. Esta detecta el fallo más común y más
  silencioso: el acceso quedado en «Solo yo». Con eso mal, la tienda igual
  carga —se cae al catálogo de respaldo que lleva dentro—, se ve perfecta y no
  registra un solo pedido.
- **En tu navegador normal**, abrir la misma URL una vez. Es el paso 6 de
  abajo: sin él el maestro no sabe su propia dirección.

### Y después, ¿hay que volver a tocar «Implementar»? Casi nunca

**No.** Cuando el maestro cambia, `montaje` con la casilla `maestro` —o con
`semilla`, si la versión trae un `maestro.gs` nuevo— sube el archivo con clasp
**y actualiza la implementación que ya existe** (`update-deployment` en clasp 3,
`deploy --deploymentId` en clasp 2), sobre la misma URL. Y no lo da por hecho:
al terminar le pregunta a la `/exec` (`?a=bloques`) qué versión responde, y el
paso siguiente (`preparar-index.mjs`) espera hasta tres minutos y
**falla si no es la que acaba de publicar**. Si la corrida sale verde, el
despliegue está hecho — no hay que abrir Implementar.

Solo se toca a mano en dos casos, y los dos se anuncian:

- El flujo imprime *«Subió el archivo pero no pude publicar la versión»*.
- La tienda no tiene `CLASPRC`/`SCRIPT_ID` y el maestro se pega a mano en el
  editor. Ahí sí: Implementar → **Gestionar** implementaciones → ✏ → Versión:
  **Nueva** (nunca «Nueva implementación»).

> `A0_instalar()` **no despliega nada**. Corre el código del editor, que puede
> ser más nuevo que el que sirve la `/exec`. Es idempotente y no hace daño
> ejecutarlo, pero no sustituye a lo de arriba ni hace falta después de cada
> montaje.

## 6 · ⚠ Abrir esa URL una vez en el navegador

El maestro **solo puede conocer su propia dirección atendiendo una petición**.
Desde el editor, Google le dice la `/dev`, que no le sirve a nadie más.

Si te saltas esto, el paso 9 dice «TODAVÍA NO SE SABE» y no entiendes por qué.

## 7 · `A0_instalar()` en el editor del maestro

Crea las pestañas, los desplegables, los disparadores (el tablero cada hora, el
respaldo los domingos a las 2:00) y los dos tokens, y guarda `HOJA_ID` en las
propiedades. Es idempotente: se puede repetir. Termina con «LISTO. Pestañas de
la hoja: …».

> Las funciones que se ejecutan a mano llevan prefijo `A0_`…`A6_` para que
> queden juntas al principio de la lista del editor, y numeradas **en el orden
> en que se necesitan**.

## 8 · Llenar la hoja · ~12 min

`A0_instalar()` crea, siempre las mismas: `Configuración · Catálogo · Envíos ·
Cupones · Validaciones · Pedidos · Más vendidos · Tablero · Errores · Pagos ·
Datos de entrega · Registro · Inventario por variante · Avísame`.

> **No insertar columnas en medio de ninguna pestaña.** El maestro lee por
> posición fija (`getRange(fila, columna, …)`), no por el nombre del
> encabezado: una columna metida en medio corre todas las de la derecha un
> puesto y nada avisa. Agregar columnas **al final** es seguro.

Pestaña `Configuración`. **La lista del alta** (`LISTA_DE_ALTA` en
`maestro.gs`) dice qué falta; el Diagnóstico y el panel la enseñan, y el
montaje la obedece: lo que **bloquea** detiene el montaje antes de escribir
(«Esta tienda todavía no puede vender. Falta en la pestaña Configuración: …»);
lo que **avisa** se imprime y sigue.

**Bloquean** — rompen la venta o dejan los textos legales sin responsable:

| | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | **el comprador termina el pedido y no tiene cómo pagar** (no bloquea si se cobra por pasarela) |
| `empresa_razon`, `empresa_nit`, `empresa_direccion`, `empresa_ciudad`, y `empresa_correo` o `empresa_tel` | el texto de tratamiento de datos queda sin responsable (decisión 09) |

**Avisan** sin bloquear: `pago_titular`, `pago_entidad`, `repositorio`,
`correo_resumen`, `sitio_titulo`, `sitio_descripcion`, `respaldo_carpeta`, y
`cobro_modo` / `cobro_ambiente` cuando la pasarela no está lista o sigue en
pruebas. Un valor entre corchetes cuenta como vacío.

> **`repositorio` vale el doble de lo que parece.** No solo le dice a «Publicar
> ahora» a quién disparar: es lo único con lo que un flujo puede comprobar que
> la hoja que está leyendo es la de **esta** tienda (`montar/misma-tienda.mjs`,
> antes de escribir nada). Montando dos a la vez, los secretos de un
> repositorio pueden acabar apuntando a la hoja del otro comercio, y entonces
> **no falla nada**: el flujo corre en verde, las fotos bajan, Cloudflare
> despliega, y los cambios de un comercio salen en la tienda del otro. Con esta
> clave llena, el flujo se planta antes de escribir. Sin ella, avisa y sigue.
> Se escribe como `dueño/repositorio`; `conectar` la llena si está vacía.

Los `empresa_*` alimentan el texto de tratamiento de datos. **La tienda pide
nombre, celular y dirección: eso es tratamiento de datos personales y en
Colombia lo regula la Ley 1581 de 2012.**

## 9 · `A2_diagnosticoCompleto()` — los dos datos de `conectar`

Imprime **Servicio** (la URL `/exec`) y **Token** (el de montaje). Son los dos
únicos datos que `conectar` no puede adivinar.

> Se ejecuta desde el editor **a propósito**: el Diagnóstico que abre el
> comerciante desde su menú **no** muestra el token de montaje.

## 10 · Los secretos del repositorio  · ⚙ `conectar`, menos uno

*Settings → Secrets and variables → Actions.* **Cinco del maestro** y uno de la
semilla. Cualquier otro sobra, y sobrar aquí no es inocuo: un secreto de más es
una llave que nadie va a acordarse de rotar.

| Secreto | Lo pone | De dónde sale, exactamente | Pinta que tiene | Si falta |
|---|---|---|---|---|
| `MAESTRO_URL` | ⚙ `conectar` | Paso 9. `A2_diagnosticoCompleto()` en el editor del maestro → línea **Servicio**. También: *Implementar → Gestionar implementaciones → URL de la aplicación web* | `https://script.google.com/macros/s/AKfycb…/exec` | `fotos` y `montaje` se saltan solos y lo dicen en el resumen |
| `MAESTRO_TOKEN` | ⚙ `conectar` | Paso 9, línea **Token** del mismo diagnóstico | `tk-…` | igual que el anterior |
| `SCRIPT_ID` | ⚙ `conectar` (se lo pregunta al maestro) | La URL del editor del maestro: lo que va entre `/projects/` y `/edit` | 57 caracteres | solo falla `montaje` cuando tiene que publicar el maestro |
| `HOJA_ID` | ⚙ `conectar` (ídem) | La URL de la hoja del comercio: lo que va entre `/d/` y `/edit` | `1AbC…XyZ` | `publicar-maestro.mjs` se niega a subir: un maestro **sin hoja** sirve un inventario de respaldo, que es el fallo que no falla |
| `CLASPRC` | **tú** | El **contenido entero** de `~/.clasprc.json` — el que `clasp login` escribe en tu **carpeta personal**, no en la del proyecto | `{"tokens":{"default":{…,"refresh_token":…}}}` | solo falla `montaje` cuando tiene que publicar el maestro — **también en una actualización que traiga uno nuevo** |
| `SEMILLA_TOKEN` | ⚙ `alta`, `conectar` | copia del de `tiendas` | — | ver la tabla de secretos |

> **⚠ `.clasp.json` y `~/.clasprc.json` son DOS archivos distintos, y es el
> error que costó una tarde en la segunda tienda.**
>
> | | Qué es | Dónde | ¿Secreto? |
> |---|---|---|---|
> | `~/.clasprc.json` | **las credenciales** | tu carpeta personal: `C:\Users\<usuario>\` | **sí: es `CLASPRC`** |
> | `.clasp.json` | a qué proyecto subir: `{ scriptId, rootDir }` | la carpeta del proyecto | **no.** En Actions ni se usa: el scriptId va en `SCRIPT_ID` |
>
> `clasp login` **no deja nada visible en la carpeta del proyecto**, así que
> parece que falló y se acaba buscando «el archivo de clasp» que sí se ve —que
> es el otro—. Pegado en el secreto, clasp contesta `No credentials found`, que
> es cierto y no ayuda. El flujo lo mira antes (`montar/revisar-clasprc.mjs`) y
> dice qué hay en su lugar; en tu equipo, `node montar/revisar-clasprc.mjs`.

### Las tres advertencias que cuestan una hora cada una

**`MAESTRO_URL` y `MAESTRO_TOKEN` son los únicos que no se pueden deducir.** Los
otros están a la vista en una URL o en un archivo; estos dos solo los sabe el
maestro, y el Diagnóstico del **menú del comerciante ya no muestra el token**.
Hay que correr `A2_diagnosticoCompleto()` **desde el editor**.

**`CLASPRC` es el único dato del producto que no sale de una pantalla de
Google.** Hay que correr `clasp login` una vez, en algún sitio con Node — y ese
sitio no tiene por qué ser tu equipo: `clasp login --no-localhost` imprime una
dirección, la autorizas en cualquier navegador y pegas de vuelta el código. Se
hace **una vez por tienda**. Sin él la tienda se abre igual y se publica igual;
lo que no puede es publicar su maestro desde Actions, y por eso **tampoco puede
terminar una actualización que traiga un `maestro.gs` nuevo**.

**`CLASPRC` caduca.** Es una sesión de Google, no una llave eterna. El día que
`montaje` falle al subir el maestro con un error de autenticación, no está roto
el flujo: hay que repetir `clasp login` con esa cuenta y volver a pegar el
archivo. Es el único de los secretos de la tienda que se muere solo.

### Los tres que NO son secretos del repositorio

| | Dónde vive | Por qué ahí |
|---|---|---|
| `FLOTA_TOKEN` (y `ALTA_TOKEN` mientras exista) | **Solo** en `laboratoriodigital/tiendas` | es el único token capaz de crear repositorios y escribir flujos. En una tienda no pinta nada, y ponerlo ahí convierte cada tienda en una llave maestra |
| `GITHUB_TOKEN` de «Publicar ahora» | Script Properties del maestro de **esa** tienda | lo leen *Publicar ahora* y *Actualizar*. **Las Script Properties no están cifradas**: es el `DISPARO_TOKEN` que siembra `conectar` —de grano fino, sobre todos los repositorios del dueño, **solo** `Actions: Read and write`, **con vencimiento**—. Se crea en *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens* |
| La llave de pago (`pago_llave`) | La pestaña `Configuración` de la hoja, y de ahí **a ninguna parte** | el filtro `pago_*` la borra antes de que salga por cualquier puerta. No va en la página ni en el repositorio: llega al comprador por la respuesta automática de WhatsApp (paso 14) |

### Y una fila en el panel de administración  · ⚙ `conectar`

El panel es **tu** hoja, la que no se comparte con ningún cliente. Sin la fila,
la tienda funciona igual — y desaparece de todo lo que te avisa: no sale en el
correo de las 7, no cuenta para «Tiendas sin responder», y su respaldo semanal
no se vigila. Una tienda que no está en el panel es una tienda que nadie mira.

⚙ **`conectar` la escribe** en la pestaña **`Tiendas`** si `tiendas` tiene
`PANEL_URL` y `PANEL_CLAVE`: `Estado` = `En montaje`, `Comercio`, `Alta`,
`Sitio`, `Servicio (URL /exec)`, `Token`, `Repositorio`, `Producto`, `Anillo` y
una nota. Si la fila ya existe, solo actualiza sitio, servicio, token, producto
y anillo. **A mano** queda lo comercial:

| Columna | Qué va |
|---|---|
| `Estado` | `En montaje` hasta la entrega, después `Activa` |
| `Contacto` · `Celular` · `Correo` | Con quién se habla en ese comercio |
| `Plan` · `Precio mensual` · `Día de cobro` | Lo comercial. `Cortesía` y `0` mientras no se cobre |
| `Cuenta Google` | El correo de la cuenta dueña de esa tienda (paso 3) |
| `Notas` | Lo que haya que recordar |

Si `conectar` dice «Hoja de administración: no se pudo registrar», la fila se
pega a mano con los mismos datos. Después: menú del panel → **`actualizar()`**.
Si la fila está bien, la tienda aparece con sus métricas en un par de segundos.

> **El token vive en TRES sitios**: los secretos del repositorio, las
> propiedades del maestro, y esta columna. Es el que se olvida al rotarlo, y el
> panel lo dice cuando pasa: la columna de estado avisa de que el token de la
> pestaña `Tiendas` se quedó con el viejo.

## 11 · El primer montaje  · ⚙ `conectar` lo dispara

`conectar` dispara `montaje` con `que=todo` y lo demás como viene. A mano:
Actions → `montaje` → Run workflow. Estos son **todos** sus campos (`inputs:`
de `montaje.yml`); en un despliegue nuevo, todos como vienen:

| Campo | De fábrica | Para qué está |
|---|---|---|
| `que` | `todo` | `solo-la-hoja` o `solo-las-fotos` para una corrida parcial |
| `maestro` | sin marcar | Publica `maestro.gs` desde aquí. Pide `CLASPRC`, `SCRIPT_ID` y `HOJA_ID` |
| `confirmar` | vacío | Escribir `PUBLICAR` si marcaste `maestro`. Sin eso el flujo **se detiene** («Marcaste publicar el maestro pero no escribiste PUBLICAR… No toqué nada») |
| `aprobacion` | `automatica` | Publica directo en `main` si todo sale verde. `con-pull-request` deja un pull request abierto para mirarlo antes (se ignora si `semilla` trajo cambios: publica directo) |
| `sin_guardia` | sin marcar | Se salta el guardia del presupuesto de tiempo (`presupuesto.json`), para una corrida que se sabe larga |
| `semilla` | sin marcar | **Actualizar la tienda** (0.14.0). Ver *Actualizar una tienda* |
| `version` | vacío | Solo con `semilla`: qué versión traer (`0.22.2` o `v0.22.2`; vacío = la última publicada). Una anterior también vale: es como vuelve atrás `restaurar` |

Hace, en este orden (el horario de los lunes corre lo mismo, sin `semilla` ni
`maestro`):

```
¿el permiso de la semilla alcanza a esta tienda?   (solo informa)
¿wrangler.jsonc tiene nombre propio?               (revisar-worker: si no, se detiene)
¿hay MAESTRO_URL y MAESTRO_TOKEN?                  (si no, lo dice y se salta lo demás)
[semilla] trae la versión nueva                    (actualizar-semilla, sin commit)
sondea el maestro una vez; ¿esta hoja es la de esta tienda?   (misma-tienda: si no, se detiene)
[maestro] publica maestro.gs y espera a que la /exec conteste esa versión
hornea publicar/index.html y 404.html desde plantilla/ con ESTA hoja  (se detiene si falta algo que bloquea)
admin.html y pedido.html; la imagen para compartir
[que≠solo-la-hoja] trae las fotos del Drive
hornea publicar/catalogo.json; comprueba las fotos por Cloudflare si se eligió
el catálogo de respaldo y el SEO dentro del index, desde ese catálogo
el nombre del Worker y la ruta del dominio, en wrangler.jsonc
¿cambió algo en publicar/ y wrangler.jsonc (y lo de la semilla)?  (si no: «Nada cambió»)
las baterías SOBRE LOS ARCHIVOS YA MODIFICADOS  (en una tienda: tienda-viva.js)
publica en main  (o pull request, si se pidió o si main está protegida)
```

> **De dónde sale el `publicar/index.html`, y por qué nadie lo edita.** De
> `plantilla/index.html`, siempre: `preparar-index.mjs` arma la página ENTERA a
> partir de la plantilla y de lo que diga la hoja de este comercio —el `<head>`,
> las cinco constantes, la paleta—, sin leer el publicado. `alta` ya deja la
> tienda con la plantilla en blanco (sin `SCRIPT_URL`) hasta este primer
> montaje. De ahí la regla: **nada de la tienda se escribe a mano en
> `publicar/index.html`.** El siguiente montaje lo borra sin decir nada.

**El paso que decide si se publica.** `pruebas/publicacion.sh` elige qué correr
(`donde.js › esSemilla()`): **en una tienda, `pruebas/tienda-viva.js`**
—invariantes sobre lo horneado con SUS datos y un humo con navegador: que la
página sepa a qué maestro preguntar y espere su misma versión, que su política
la deje hablar con él, que el catálogo se lea sin identificadores repetidos, que
el respaldo lleve los mismos productos y sea de la misma tienda, y que la página
abra y pinte sin un error de JavaScript—. En la semilla, la suite entera o la
guardia corta si el código ya pasó `pruebas`. El resumen dice cuál: «LA TIENDA
VIVA», «GUARDIA CORTA» o «TODAS LAS BATERÍAS» (bitácora 102).

**Cómo publica.** Un solo commit (`refactor/frontend: …`) empujado con el
`GITHUB_TOKEN` a `main`. Si el push se rechaza (rama protegida), rama
`montaje/desde-la-hoja-<fecha>` y pull request. En una tienda, los
`.github/workflows` **nunca** van en ese commit: se sacan del índice y se dice
(los entrega la flota; ver más abajo). Si algo falla después de publicar un
maestro traído por la semilla, se **vuelve a publicar el maestro de antes**. Lo
horneado se guarda como artefacto `publicar` (7 días) pase lo que pase, y el
cierre dice en qué quedó la tienda: «La tienda queda publicada en …», «ya
estaba al día» o «sigue como estaba».

> **Alternativa: desde tu equipo, sin Actions.** `npm run tienda` escribe
> `tienda.json` y `montar/.clasp.json` preguntándole al maestro sus propios
> datos. `npm run montar` encadena `index`, `admin`, `compartir`, `catalogo`,
> `fotos:drive` y `respaldo`; **no** hornea el SEO ni el nombre del Worker, no
> comprueba la hoja y no corre ninguna batería, así que no es lo mismo que el
> flujo. `npm run maestro` publica el Apps Script. Ninguno hace commit.

> **La primera corrida después de publicar el maestro es LENTA, y es normal.**
> Apps Script queda «frío» al actualizar una implementación: la primera
> petición a la `/exec` puede tardar cuarenta segundos o más. Las herramientas
> lo aguantan y el log dice cuánto tardó cada llamada. Si ves `· «bloques»
> contestó en 38 s`, no está roto: está arrancando.

## 12 · ⚠ `A1_generarStub()` — y el orden importa

**En el editor del MAESTRO DE ESA TIENDA** (no en el de la hoja, y no en el de
otra tienda: bitácora 76), seleccionar la función `A1_generarStub` → Ejecutar.
Genera el stub a partir del maestro que está **PUBLICADO**, no del que está en
el repositorio: hacerlo antes de publicar un maestro nuevo devuelve el stub
viejo y parece que la versión nueva no trae nada.

En el **Registro de ejecución**, copiar el bloque completo bajo
`═══ PEGA ESTO EN LA HOJA ═══` → hoja del comercio → Extensiones → Apps
Script → pegar encima de todo → guardar.

> **Mirar el menú casi nunca comprueba nada.** Sigue teniendo las mismas
> opciones antes y después de pegar, **salvo cuando la versión nueva agrega una**
> —como *Clave del panel*, que llegó con D-1—: ahí la opción aparece solo
> después de pegar, y ese es justamente el aviso de que había que regenerarlo.
> Lo que sí comprueba siempre: si el botón **Guardar no se activa** al pegar, es
> que lo pegado era idéntico a lo que ya había — no es un fallo, ya estaba al
> día. Y `var NEGOCIO = '...';` debajo de `var MAESTRO` y `var TOKEN`, en el
> editor de la hoja, es la marca de que quedó el stub nuevo.

**Cuándo hay que volver a hacer este paso, en una tienda que ya funciona:**
cuando cambia el nombre del comercio, y cuando una versión del maestro agrega
una opción al menú. **`A0_instalar()` ya no imprime el stub** (desde el 21 de
septiembre de 2026): esta es la única función que lo imprime.

**Renombrar ese proyecto con el nombre del comercio.** Es el nombre que Google
le muestra al comerciante en la pantalla de permisos la primera vez que toca el
menú. Sale de `negocio` en Configuración en el momento de generar el stub: si
todavía no está, el menú aparece como «Tienda» — vuelve a generar el stub
cuando lo esté y pégalo otra vez.

**Abrir el menú de la hoja una vez.** Ese clic es lo que deja constancia de que
la hoja ya entra con el token del menú; sin él, el panel no distingue una hoja
migrada de una que nadie ha tocado.

## 13 · Las fotos

Carpeta en el Drive de la cuenta de la tienda, **compartida con el correo
personal del comerciante como editor** — así puede subir sus propias fotos
después sin pedirte nada. Su enlace va en `Configuración > fotos_drive`.

Aparte, comparte también `backup_tiendas` con **esta cuenta de la tienda**
como editor. Sin eso el respaldo semanal de la hoja falla en silencio: se ve
el domingo siguiente en Diagnóstico → *Último respaldo*.

Las fotos van con **el nombre exacto** que lleve la columna `Imágenes` del
catálogo, mayúsculas incluidas. Formatos: JPG, PNG, WebP. Tope: 8 MB por foto
(el maestro rechaza las más pesadas; `traer-fotos.mjs` ni pide las de más de
10 MB).

Después, menú de la hoja → **Publicar ahora** ⚙ (ver *Publicar*).

## 13b · La medición, si el comercio la quiere (0.19.0)

Opcional y apagada de fábrica. En `analytics.google.com`: crear la propiedad
del comercio › Administrar › **Flujos de datos** › Web › la dirección de la
tienda. Copiar el identificador `G-XXXXXXXXXX` y pegarlo en la clave
`analytics_id` de la pestaña Configuración. **Publicar** después: el
identificador se hornea en el `<head>`, no se lee en vivo.

Tres cosas que conviene decirle al comercio:

- **Vacío es vacío**: sin esa clave la tienda no carga nada de Google y no pone
  una sola cookie. Con ella sí, y eso hay que mencionarlo en la política de
  privacidad.
- Solo sirve **GA4** (`G-…`). Un `UA-…` (apagado por Google) o un `GTM-…` (Tag
  Manager) no se hornean, y el panel dice por qué.
- La tienda ya manda tres eventos: `agregar_al_carrito`, `enviar_pedido` y
  `pagar_en_linea`. No hay que configurar nada más en Analytics.

## 14 · WhatsApp Business — la respuesta automática

**Es el único paso donde el diseño de seguridad se convierte en un agujero
funcional si se olvida.** La llave de pago no está en la página a propósito: el
comprador la recibe por el chat. Si el mensaje no está puesto, **termina el
pedido y no tiene cómo pagar**.

WhatsApp Business → Herramientas para la empresa → Mensaje de ausencia. El texto
sale de `pago_texto`, o se arma con `pago_llave`, `pago_titular` y
`pago_entidad`. Plantilla, si se escribe a mano:

    ¡Gracias por tu pedido! 🛍
    Lo estoy revisando y en un momento te confirmo disponibilidad y el
    total definitivo.

    Cuando te confirme el total, puedes transferir a:
    *Llave <LLAVE>* — <NOMBRE>

    Envíame el *comprobante* por aquí y con eso despacho.

    ⚠️ Solo confirmo datos de pago por este chat. Si ves una llave o una
    cuenta distinta en cualquier otro lado, no transfieras y escríbeme.

> La última línea no es decoración: es lo que hace inútil un sitio clonado,
> porque el cliente sabe que el pago siempre espera la confirmación por este
> chat.

## 15 · Las cuatro comprobaciones, antes de entregar

1. **Diagnóstico** (menú de la hoja). Punto 2: *«las … claves del alta están
   llenas»*. Punto 1: la versión del maestro coincide con la etiqueta.
2. **Panel**: la fila de este comercio, con **Sin terminar** en blanco y **Stub
   en la hoja** diciendo *al día*.
3. **Un pedido de punta a punta, con un teléfono que no sea el del comercio**:
   pedido → WhatsApp → respuesta automática → transferencia → **Pagado** en la
   hoja → el stock baja. Todo lo demás está probado en automático; esto prueba
   la costura.
4. **Apagar el maestro un minuto y hacer un pedido.** Lo que no puede pasar es
   que el botón no haga nada. Que el pedido no quede en la hoja es recuperable
   —la tienda lo reenvía cuando el comprador vuelve—; que el botón no responda
   es una venta perdida.

## 16 · La entrega

- La **guía de una página** impresa (`docs/manuales/Guia-de-una-pagina.html`).
  Es corta a propósito: lo que no cabe ahí, se explica de viva voz.
- Compartir la hoja con el correo del comercio **como editor**.
- Enseñarle las tres cosas del día a día: cambiar un precio → **Publicar
  ahora**; pedido nuevo → **Pagado**; algo raro → **Diagnóstico**.

El menú de su hoja tiene ocho opciones, y conviene nombrárselas todas una vez:

| | |
|---|---|
| **Publicar ahora** | manda a la tienda lo que cambió. La que más se usa |
| **Ver mi tienda** | la abre como la ve un comprador |
| **Actualizar tablero e inventario** | recalcula ya, sin esperar la hora |
| **Enviarme el resumen ahora** | manda el correo del día en el momento |
| **Clave del panel** | inventa la clave del panel y la enseña **una sola vez**. Cierra las sesiones abiertas |
| **Diagnóstico** | revisa todo y dice qué está mal y dónde |
| **Ayuda** | las preguntas de siempre, contestadas |
| **Actualizar a la última versión** | dispara `montaje` con la semilla: trae la versión nueva, prueba lo horneado, publica o vuelve atrás (0.14.0; repegar el stub para verla) |

> **Si explicar esto toma más de 30 minutos, el hallazgo es de diseño, no del
> comerciante. Anótalo.**

**El panel** (M3) vive en `https://<su sitio>/admin.html`. Para
dejarlo listo en la entrega: en `Configuración › panel_usuario` el nombre con el
que va a entrar, y después menú › **Clave del panel** con el comerciante al
lado — la clave se enseña una sola vez y no queda escrita en ninguna parte, así
que la apunta él. El panel tiene tres pestañas: **Productos** (editar, subir
fotos y, si hay variantes, el stock de cada combinación), **Pedidos** (ver y
cambiar el estado, con el mismo efecto sobre el inventario que en la hoja) y
**Tu tienda** (textos, colores, contacto, horario, envío gratis, pedido mínimo y
cerrar la tienda; las claves técnicas no salen). Todo lo que se cambia queda en
la pestaña **Registro** de la hoja. Arriba, la barra de **Publicar**. Lo que se
guarda en el panel queda en la hoja al instante, pero **la tienda lo muestra al
publicar**: eso hay que decírselo, porque el panel también lo dice y la primera
vez nadie lo lee.

Para que el botón Publicar funcione hacen falta las mismas dos cosas que para
*Publicar ahora* del menú: `Configuración › repositorio` y el `GITHUB_TOKEN` en
las propiedades del maestro. Sin ellas el panel lo dice («eso lo hace una vez
quien la montó») y manda al menú. Con ellas, además, enseña cómo va la
publicación y cómo terminó.

**Cobrar en línea (M3.5), si el comercio lo quiere.** De fábrica la tienda
vende por WhatsApp. Para cobrar con Bold: las cuatro llaves en las propiedades
del script del maestro (`BOLD_IDENTIDAD_SANDBOX`, `BOLD_SECRETA_SANDBOX`, y las
dos de `PRODUCCION`), `cobro_modo = Pasarela` y `cobro_ambiente = Pruebas` en la
hoja, publicar, y la prueba completa de `docs/PAGOS-BOLD.md`. **Solo después**
`cobro_ambiente = Producción`. Mientras falte algo, la tienda sigue vendiendo
por WhatsApp y el diagnóstico dice qué falta.

- [ ] **El domingo siguiente a la entrega:** Diagnóstico → *Último respaldo*.
      Si dice «nunca» o «falló», la cuenta de la tienda no tiene permiso sobre
      `backup_tiendas` (paso 13) o falta correr `A0_instalar()` con el maestro
      nuevo.

---

## Publicar: `fotos` («Publicar ahora»)  · ⚙

**Quién lo dispara.** El comercio, con *Publicar ahora* en el menú de la hoja
o en la barra del panel: el maestro llama a
`POST /repos/<repositorio>/actions/workflows/fotos.yml/dispatches` (rama
`main`, sin entradas) con el `GITHUB_TOKEN` de sus propiedades y la clave
`repositorio` de la hoja. También a mano desde Actions, y el reloj a diario
(`17 6 * * *`, 1:17 en Colombia).

**Entradas** (`inputs:` de `fotos.yml`): `aprobacion` (`automatica` ·
`con-pull-request`) y `sin_guardia`. El botón usa las de fábrica.

**Secretos:** `MAESTRO_URL`, `MAESTRO_TOKEN`; el `GITHUB_TOKEN` de Actions para
empujar. No usa `CLASPRC`: `fotos` nunca publica el maestro.

**Qué hace.**

1. Si faltan los secretos del maestro, lo dice y no hace nada más.
2. Sondea el maestro y comprueba que **la hoja es la de este repositorio**
   (`misma-tienda.mjs`); si no, se detiene antes de escribir.
3. **Mira** si hay algo que publicar, con tres preguntas en modo `--revisar`:
   fotos nuevas o borradas en el Drive (`traer-fotos.mjs`), catálogo distinto
   del horneado (`catalogo-estatico.mjs`) y configuración de la hoja distinta
   de la publicada (`preparar-index.mjs`). La tercera **aplica la hoja sobre lo
   PUBLICADO** (`baseParaRevisar`, 0.22.2): antes horneaba desde la plantilla y
   salía distinto siempre (bitácora 104). El resumen enseña siempre lo que vio.
4. **El reloj solo avisa**: si hay novedades y la corrida es la programada, no
   publica («Hay algo sin publicar… No se publicaron») y deja un aviso.
5. **Hornea** partiendo de la plantilla, como `montaje`: `preparar-index`
   (todo o nada), `traer-fotos` (una foto que no baja no tumba lo demás: se
   publica el resto y se dice «Las fotos no se pudieron traer»),
   `catalogo-estatico`, `sembrar-respaldo` y `sembrar-seo`.
6. **Comprueba que solo cambió lo que este flujo publica** —la lista `PUBLICA`:
   `publicar/fotos`, `catalogo.json`, `index.html`, `404.html`, `sitemap.xml`,
   `robots.txt`—. Si cambió otra cosa, no publica solo: va por pull request
   («No se fusiona solo»).
7. Corre `pruebas/publicacion.sh` —en una tienda, `tienda-viva.js`—.
8. **Publica**: la rama se rehace sobre el `main` de ese instante, cierra los
   pull requests `fotos/nuevas-*` que quedaron atrás y empuja a `main`
   (`feature/frontend: …`). Si el push se rechaza, pull request.
   - Si otra corrida ya publicó lo mismo: «Ya estaba publicado» (no es fallo).
   - Si miró novedades y al hornear no quedó nada: **«Nada que publicar pese a
     haber detectado novedades»**, con la lista `PUBLICA` y el estado del
     repositorio (ver el runbook).

`fotos` y `montaje` comparten el grupo de concurrencia `tienda-<repositorio>`:
nunca escriben `publicar/` a la vez.

---

## Actualizar una tienda  · ⚙

**La regla.** Solo se reparten **versiones publicadas con `release`** (etiquetas
`vX.Y.Z` de la semilla); lo que haya en `main` no llega a ninguna tienda. Y
**cada tienda se actualiza sola**, con su propio `montaje` y la entrada
`semilla`; la flota solo la dispara, en orden, y le entrega los flujos.

Aquí va el paso a paso del operador: qué flujo, qué entradas, qué secretos.
Qué cambia dentro de la tienda, qué no se toca, la compuerta y por qué un
arreglo del actualizador llega una versión tarde: `ACTUALIZAR-UNA-TIENDA.md`.

### 1 · Cortar la versión en la semilla — `release`

Una persona: `laboratoriodigital/tienda` › Actions › `release` › Run workflow.
Sin entradas. Lee la versión de `package.json`; **exige una corrida de
`pruebas` por push en verde sobre ese mismo commit** (espera hasta cinco
minutos); si la etiqueta ya existe en ese commit, dice que no hay nada que
cortar; si existe en otro, falla («Sube `version` en `package.json`»). Crea la
etiqueta y la publicación con `index.html`, `maestro.gs`, `panel.gs` y
`publicar.tar.gz`. En una tienda, `release` se niega («`release` no es un flujo
de tienda»). `pruebas` en la semilla exige además subir `version` cuando cambia
`maestro.gs`, `panel.gs` o `publicar/index.html`.

### 2 · Repartirla — `tiendas` › `flota` › `actualizar`

Una persona: `tiendas` › Actions › `flota` › Run workflow. **Entradas**
(`inputs:` de `flota.yml`), con sus valores de fábrica:

| Entrada | De fábrica | Qué hace |
|---|---|---|
| `accion` | `estado` | `estado` · `actualizar` · `flujos` |
| `linea` | **`organico`** | la línea (clave de `flota.json › lineas`). Para Tienda Panel hay que elegir **`tienda`** |
| `anillo` | `'1'` | hasta qué anillo: `0`, `1` o `2`. El filtro es «anillo ≤ N» |
| `version` | vacío | la etiqueta; vacío = la última. Con o sin `v` en `actualizar`; **con `v`** en `flujos` |
| `ensayo` | **marcada** | dice qué haría y no toca nada. Hay que desmarcarla para que ocurra |
| `tienda` | vacío | solo esa tienda: `dueño/repositorio`, el nombre corto o el `nombre` de `flota.json`. En `actualizar` se busca **dentro del anillo pedido** |
| `sin_base` | `dejar` | solo Tienda Básica |

**Secreto:** `FLOTA_TOKEN`. Qué hace (`flota/actualizar.mjs`, modo `montaje`):

1. Corre las pruebas de la flota sin red, y se niega sin `FLOTA_TOKEN`.
2. Elige las tiendas: de esa línea, que no sean semilla, **con anillo numérico**
   (`"fuera"` o sin anillo no entran) y con anillo ≤ el pedido; y, si se dio,
   solo la pedida. Clona la semilla y comprueba que la etiqueta existe.
3. Las recorre **en orden de anillo**. Por cada una: lee su `package.json`
   (si GitHub contesta 404, la **salta** y lo anota al final: «no existe o este
   permiso no la incluye»); si ya está en esa versión o más, sigue; si no,
   dispara su `montaje` con `semilla=true`, `que=todo` y `version`, espera
   hasta dos minutos a que arranque y **mira la corrida hasta que termina**.
4. **Si el montaje falla, se detiene**: «✗ su montaje falló… **Las siguientes
   no se tocan.**», nombra las que quedaron sin tocar y los dos caminos para
   seguir (ver el runbook). Si ninguna de las pedidas existe, termina en rojo.
5. **Si termina bien, le entrega los flujos** (`flota/flujos.mjs`) en esa
   misma etiqueta. Después y no antes: si el montaje falla, la tienda se queda
   entera en la versión de antes, flujos incluidos.

### 3 · Lo que hace la tienda — `montaje` con `semilla`

Lo mismo lo disparan la flota, el comercio (panel › *Versión de tu tienda* ›
*Actualizar ahora*, o menú › *Actualizar a la última versión*: el maestro manda
`semilla=true` y `que=todo`, sin versión) y una persona desde la pestaña Actions
de la tienda.

1. `montar/actualizar-semilla.mjs` clona la semilla (`semilla.json ›
   repositorio`, con `SEMILLA_TOKEN` si lo hay), se planta en la etiqueta y
   escribe en la tienda **solo lo que `semilla.json › propios` declara de la
   semilla**, con la tabla de tres versiones (tienda, semilla nueva, semilla de
   la que salió la tienda): lo que la tienda no tocó se sobrescribe, lo que
   cambió solo la tienda se respeta, lo que cambiaron las dos no se toca y se
   dice, y lo que no se puede saber (sin etiqueta base) no se toca. **Borra**
   lo que la versión nueva lista en `retirados` (nunca `publicar/` ni `.git`).
   **No escribe `.github/workflows`**: los lista como pendientes, porque los
   entrega la flota. Actualiza `version` en `package.json`. No hace commit.
2. Si vino un `maestro.gs` nuevo, lo publica **sin pedir `PUBLICAR`** —quien
   pidió actualizar ya lo pidió—, pero con los mismos tres secretos: **sin
   `CLASPRC`, `SCRIPT_ID` o `HOJA_ID`, la actualización se detiene ahí** y la
   tienda queda como estaba.
3. Rehornea todo desde la hoja, como un montaje normal.
4. Corre la guardia: `pruebas/publicacion.sh`, que **ya es la de la versión
   nueva** porque la escribió el paso 1 → en una tienda, `tienda-viva.js`.
5. Si todo está verde, un solo commit a `main` (directo: con una actualización
   que trae cambios no se abre pull request, salvo que `main` esté protegida) y
   Cloudflare publica.
6. Si algo falla después de publicar el maestro nuevo, **vuelve a publicar el de
   antes** («Se volvió atrás»). No queda nada nuevo en `main`.

> **El auto-actualizador corre su versión VIEJA.** El `montaje.yml` y las
> herramientas que ejecuta la corrida son los de la tienda ANTES de
> actualizarse (bitácora 95): un arreglo en ellos llega una versión tarde. Por
> eso lo que decide si se publica vive en `pruebas/` —que la actualización
> escribe antes de correr la guardia— y los flujos los entrega la flota.

### Los flujos de una tienda los entrega la flota  · ⚙ (0.22.1)

Una tienda **no puede escribir sus propios `.github/workflows`**: su push va
con el `GITHUB_TOKEN` de Actions, que no puede nunca, y meter otro token en la
URL no sirve —`actions/checkout` deja en `.git/config` una cabecera
`extraheader` con ese permiso que git manda en cada push, gane quien gane en la
URL— (bitácora 103). Así que:

- La tienda los saca de su commit: el paso «¿Cambió algo?» de `montaje` y
  `publicacion.sh`, y lo dicen («Los flujos se quedan como estaban» / «LOS
  FLUJOS NO VAN EN ESTE COMMIT»).
- `flota/flujos.mjs` los copia con `FLOTA_TOKEN` por la API de contenidos
  (`PUT /repos/<tienda>/contents/.github/workflows/<archivo>`): lee
  `semilla.json` de la semilla **en esa etiqueta**, toma de `propios` los que
  están en `.github/workflows/`, y escribe solo los que cambian (con su `sha`),
  un commit `ci/flujos: …` por archivo.
- Lo hace sola `flota › actualizar` tras cada tienda que se actualiza bien, y a
  mano **`flota` › `flujos`** (`linea`, `version` con `v`, `ensayo`, `tienda`;
  no mira el anillo, pero sí salta las `"fuera"`). Es también el rescate de una
  tienda que se quedó con flujos viejos. En una línea `pull-request` no hay
  nada que entregar y lo dice.
- Esos commits los empuja un token personal, así que **sí disparan** `pruebas`
  en la tienda: desde la 0.22.2 `pruebas.yml` decide con `publicacion.sh`, y en
  una tienda corre `tienda-viva.js`, no la suite de la semilla (bitácora 104).

### El formato de `flota.json`, lo que importa aquí

La referencia está en el `README.md` de `tiendas`. Lo que decide el reparto:
`lineas.<clave>.modo` (`montaje` = Tienda Panel, se actualiza sola;
`pull-request` = Tienda Básica), `lineas.<clave>.semilla`, y en cada tienda
`repo`, `linea`, `semilla: true` (la semilla misma, nunca se actualiza) y
`anillo`: `0`, `1`, `2`… o **`"fuera"`** —cualquier cosa que no sea un
número—, que la deja en la lista y en el estado pero fuera de `actualizar` y de
`flujos` (bitácora 105). `alta` pone `2` a las nuevas.

---

## El panel de la flota: publicar `panel.gs`  · ⚙ flujo `panel` de `tiendas`

`panel.gs` vive en la semilla y corre en la hoja *Panel de tiendas*. Se publica
con **la misma herramienta** que el maestro de cada tienda, no con una copia
(bitácora 100): `tiendas` › Actions › `panel` › Run workflow.

- **Entradas:** `version` (la etiqueta **con `v`**; vacío = la última, con la
  misma regla `ultimaEtiqueta` que el alta y la flota).
- **Secretos:** `PANEL_SCRIPT_ID`, `PANEL_CLASPRC`; para leer la semilla,
  `ALTA_TOKEN`, o `FLOTA_TOKEN`, o el `GITHUB_TOKEN` de la corrida.
- **Qué hace:** si falta alguno de los dos secretos, «Faltan los secretos» y
  no toca nada; clona la semilla en esa etiqueta, comprueba que traiga
  `panel.gs` y `montar/publicar-maestro.mjs`, instala clasp 3 y corre
  `publicar-maestro.mjs` con `ARCHIVO=panel.gs` y `SCRIPT_ID` = el del panel.
  Sube el archivo tal cual (el panel abre su hoja con `getActive()`, no lleva
  id horneado), actualiza la implementación que ya existe y termina con «El
  panel queda en `vX.Y.Z`» o «El panel sigue como estaba».
- **La primera implementación** de esa aplicación web se crea a mano, una vez;
  sin ella: «Este proyecto no tiene ninguna implementación publicada todavía».

> **⚠ Defecto conocido, a hoy (sin verificar en una corrida real).** El paso
> «Publicar panel.gs» le pasa `PANEL_CLASPRC` a la herramienta como variable
> `CLASPRC`, pero ningún paso lo escribe en `~/.clasprc.json`, que es lo único
> que lee clasp 3 (o la ruta de `--auth` / `clasp_config_auth`). `montaje` sí
> lo escribe en su paso «clasp y la sesión de Google de esta tienda». Lo
> esperable es que `clasp push` conteste que no encuentra credenciales. Mientras
> no se corrija el flujo, `panel.gs` se sigue pegando a mano.

---

## Volver atrás (0.18.0)

Tres cosas se pueden perder, y cada una tiene su punto de restauración y su
puerta. Ninguna inventa infraestructura: git ya guarda el sitio y las
versiones, y Drive ya guarda las copias de la hoja.

| Se perdió | Dónde está el respaldo | Cómo se vuelve |
|---|---|---|
| **Los datos** (catálogo, configuración, envíos, cupones) | las copias semanales en la carpeta de respaldos del administrador (`respaldo_carpeta`, ocho copias) | en el editor del maestro: `A5_respaldos()` las lista y `A6_restaurarDatos('ultimo', 'Catálogo')` devuelve las pestañas que se le digan |
| **El sitio** (lo que se ve publicado) | cada commit de `main` que tocó `publicar/` | Actions › **restaurar** › `el-sitio` (vacío = el anterior). Publica un commit NUEVO encima; Cloudflare republica solo. ⚠ Ver el defecto de abajo |
| **La versión** (el código y el maestro) | las etiquetas `vX.Y.Z` de la semilla | Actions › **restaurar** › `la-version` (vacío = la anterior a la de esta tienda). Se lo pide a `montaje` con `semilla=true` y esa `version`, que publica el maestro, rehornea y corre la guardia |

**`restaurar` por dentro** (`restaurar.yml`, `montar/volver-atras.mjs`).
Entradas: `que` (`el-sitio` · `la-version`), `hasta` (vacío, un commit
`a1b2c3d` o una etiqueta `v0.18.1`) y `confirmar`, que tiene que ser
exactamente `RESTAURAR`. Todo error de entrada sale como «No se restauró
nada». Para `la-version` sin `hasta`, lee las etiquetas de la semilla con
`SEMILLA_TOKEN` (o el `GITHUB_TOKEN`, si la semilla es pública) y elige la
anterior a la de `package.json`; si no puede leerlas dice «La semilla no tiene
ninguna versión publicada», y entonces se escribe la versión a mano. No pide
ningún secreto nuevo; `la-version` necesita los mismos que una actualización
(`CLASPRC` si esa versión trae otro `maestro.gs`).

> **⚠ Defecto conocido de `el-sitio`, a hoy.** `volver-atras.mjs` hace `git
> checkout <commit> -- publicar/`, que cambia el índice Y la carpeta; el paso
> siguiente pregunta `git diff --quiet -- publicar/`, que compara la carpeta
> con el índice, y los encuentra iguales. Resultado: **dice «Ya estaba así» y
> no publica nada**, aunque el sitio sí sea distinto (reproducido con un
> repositorio de juguete). Mientras no se corrija el flujo, el sitio se vuelve
> atrás a mano: `git checkout <commit> -- publicar/`, commit y push a `main`.

Las tres reglas que lo hacen seguro: **restaurar no borra** —el sitio vuelve en
un commit encima, nunca con `push --force`, así que restaurar también se
deshace—; **no se restaura lo que pasó** —Pedidos, Pagos, Datos de entrega,
Avísame y el Registro no están en la lista, porque traer la copia del domingo
un miércoles borraría las ventas del lunes—; y **antes de tocar nada se guarda
una copia**, que es lo que hace que restaurar mal también tenga vuelta.

El flujo `restaurar` viaja dentro de la semilla: cada tienda lo tiene en su
pestaña Actions. Después de restaurar datos hay que **publicar** la tienda para
que el sitio muestre lo restaurado.

---

## Después: qué corre solo y qué se opera

| Cuándo | Qué |
|---|---|
| a diario, 6:17 UTC (1:17 en Colombia) | flujo `fotos`: **mira** si quedó algo sin publicar y avisa. No publica |
| lunes 11:00 UTC (6:00 en Colombia) | flujo `montaje` completo, sin `semilla` ni `maestro`: publica directo en `main` si algo cambió |
| lunes 12:23 UTC (7:23 en Colombia) | `tiendas` › `flota` › `estado`: escribe `ESTADO.md` y `panel/index.html` (y lo publica si hay token de Cloudflare) |
| cada hora | tablero e inventario (disparador del maestro) |
| domingos 2:00 | respaldo de la hoja (disparador del maestro) |
| a diario, el comercio | precios y stock → **Publicar ahora**; pedidos → **Pagado** |
| cuando hay versión nueva | `release` en la semilla → `flota` › `actualizar`, por anillos |
| cuando cambia `panel.gs` | `tiendas` › `panel` (ver el defecto de arriba) |

**Por qué los dos flujos publican solos.** `montaje` y `fotos` publican directo
en `main` cuando todo sale verde: la guardia ya corrió sobre esos mismos bytes,
y un pull request abierto por el bot solo añadía una corrida de `pruebas`
retenida esperando aprobación. Lo que los separa es el **alcance**: `fotos`
comprueba que no cambió nada fuera de su lista `PUBLICA` y, si cambió, deja un
pull request; `montaje` publica `publicar/` y `wrangler.jsonc` (y, con
`semilla`, lo que `semilla.json` declara). Quien quiera mirar antes pide
`aprobacion = con-pull-request`.

**Por qué el maestro no se publica por horario y pide escribir `PUBLICAR`.**
Cuando termina, el backend nuevo ya está atendiendo pedidos, sin vista previa ni
vuelta atrás de un clic. Y `MAESTRO_TOKEN` solo lee configuración y fotos;
`CLASPRC` es una credencial de Google con permiso sobre el Apps Script y el
Drive de esa cuenta — cuanto menos viva guardada en un servidor, mejor. La
única excepción es la actualización con `semilla`, donde pedir actualizar ya es
pedirlo.

**Qué pasa cuando algo falla:** síntomas, causas y qué hacer, con los mensajes
tal como los imprimen los flujos, en `RUNBOOK-TECNICO.md` › *I · Incidentes*.

## Cuándo hay que reimplementar y cuándo no

Todo sale de una regla: **los disparadores corren el código guardado; la
aplicación web sirve el código implementado.**

| Lo que cambiaste | Pegar y guardar | `A0_instalar()` | Nueva **versión** de la implementación |
|---|---|---|---|
| Cualquier cosa del maestro | ✅ siempre | | |
| Pestañas, claves de Configuración, formatos, disparadores | ✅ | ✅ | |
| Algo que la tienda pide por `/exec` (catálogo, validar, registrar) | ✅ | | ✅ |
| Algo que use el **menú** de la hoja o el **panel** (`?a=panel`) | ✅ | | ✅ |

En la práctica, casi siempre toca reimplementar: hasta el menú de la hoja pasa
por `/exec`. La regla corta: *si algo fuera del editor lo va a usar,
reimplementa*. `npm run maestro` —y `montaje` con `maestro`— hace las dos cosas
de una: sube el archivo y publica la versión nueva sobre la misma
implementación, nunca una nueva.

---

## Los tres sitios donde el orden cuesta una hora

1. **Implementar una vez, actualizar siempre.** Una implementación nueva estrena
   URL y deja la tienda muda.
2. **Abrir la `/exec` una vez** antes de pedir los datos de `conectar`.
3. **Generar el stub DESPUÉS de publicar el maestro.** Antes devuelve el viejo, y
   parece que la versión nueva no trae nada.

## Los cuatro sitios donde se pueden cruzar dos tiendas

Con una tienda montada esto no existe. Con dos, es el fallo más caro de seguir,
porque **corre entero en verde**:

1. Los secretos `MAESTRO_URL` y `MAESTRO_TOKEN` de este repositorio →
   *Settings > Secrets and variables > Actions*.
2. La clave `repositorio` de la pestaña `Configuración` de la hoja.
3. **A qué repositorio está conectado el proyecto de Cloudflare** que sirve el
   sitio → *Workers & Pages > el proyecto > Settings > Build*.
4. **`SCRIPT_ID` y `CLASPRC` juntos.** Al montar la segunda tienda a mano se
   copian los secretos de la primera y este se queda con el proyecto de aquella,
   mientras las credenciales ya son de la nueva cuenta. Google contesta
   **`The caller does not have permission`**, que dice que alguien no tiene
   permiso sin decir quién ni sobre qué — y lleva a revisar la API de Apps
   Script, que casi siempre estaba bien.

Los flujos comparan 1 contra 2 (`misma-tienda.mjs`) y se plantan si no
coinciden; `conectar` hace lo mismo antes de escribir nada («Esta hoja dice que
es de …»). El 3 no lo puede ver nadie desde aquí: se mira a mano. El 4 lo nombra
`publicar-maestro.mjs`: imprime la cuenta y el proyecto y, si falla, lista los
proyectos que esa cuenta **sí** ve. Con `conectar`, `SCRIPT_ID` sale del propio
maestro y este cruce es mucho más raro.

> **Para comprobar el 4 en un minuto:** abre
> `https://script.google.com/d/<SCRIPT_ID>/edit` con la cuenta de **esta**
> tienda y ninguna otra —una ventana de incógnito ayuda—. Si dice que no
> tienes acceso, el secreto apunta al maestro de otra.

## La revisión de la tienda (0.20.0)

El mismo informe de siempre, en tres sitios: el menú de la hoja ›
*Diagnóstico*, el panel del comercio › Tienda › **Revisión de tu tienda**, y
`A2_diagnosticoCompleto()` en el editor del maestro —el único que enseña el
token de montaje—. Desde la 0.20.0 mira además: de dónde salió el `HOJA_ID`,
qué versión del stub está pegada en la hoja, si el maestro tiene su permiso de
GitHub, si la medición está bien escrita, y cuántas copias de la hoja hay para
volver atrás.

## Cloudflare Access: qué es y cuándo se enciende

El panel de la flota y el portal enseñan la lista de clientes, sus ventas y sus
direcciones. Mientras se abran desde la hoja de administración, quien puede
abrir la hoja es quien los ve, y no hay nada que proteger. El día que esa misma
pantalla se sirva en una dirección —`flota.laboratorio-digital.com`—, hace
falta una puerta, y esa puerta es **Cloudflare Access**.

**Qué es.** Access es la parte de Cloudflare Zero Trust que pone una
comprobación de identidad **delante** de una dirección. No es una contraseña en
la página ni código nuestro: la petición ni siquiera llega al Worker hasta que
Cloudflare ha comprobado quién entra.

**Cómo funciona, por dentro.**

1. Alguien abre la dirección protegida. Cloudflare ve que hay una aplicación de
   Access sobre ese dominio y **no deja pasar la petición**.
2. Le enseña una pantalla de entrada con los métodos que hayas permitido:
   código de un solo uso al correo, Google, GitHub, Microsoft, y otros.
3. La persona se identifica. Cloudflare comprueba su identidad contra la
   **política** que escribiste: por ejemplo, «solo estos tres correos», o «solo
   los correos que terminan en @laboratorio-digital.com».
4. Si pasa, Cloudflare emite una **cookie de sesión firmada** para ese dominio
   (dura lo que tú digas: una hora, un día, un mes) y **a partir de ahí sí**
   manda la petición al Worker, con una cabecera que dice quién es.
5. Si no pasa, la petición muere en el borde de Cloudflare: el Worker nunca se
   entera y la página nunca existe para esa persona.

**Qué hay que hacer, una vez.** En el panel de Cloudflare: Zero Trust › Access
› Applications › **Add an application** › *Self-hosted*; el dominio y la ruta
que se protege; un método de entrada (el más simple es **One-time PIN**: un
código al correo, sin cuentas nuevas); y una política *Allow* con la lista de
correos. Nada de eso toca el repositorio ni el código.

**Qué cuesta.** Nada en el uso que le vamos a dar: el plan gratuito de Zero
Trust cubre hasta 50 usuarios. Lo que cuesta es acordarse de quitar a alguien
de la lista el día que se va.

**El token de Cloudflare, acotado.** `wrangler deploy` de una página estática
necesita exactamente dos permisos de cuenta: *Workers Scripts: Edit* y *Account
Settings: Read* —y *Workers Routes: Edit* de zona solo si el panel va en un
dominio propio—. KV, R2, Pages, Containers, CI, Observability, Tail y CF Agents
no hacen falta. El **filtro por IP se deja abierto**: los runners de GitHub
cambian de dirección en cada corrida, así que acotarlo rompería el flujo el día
menos pensado; lo que sí conviene es ponerle **vencimiento** al token y anotarlo
donde se anotan los demás.

**Cómo se publica el panel que hay que proteger.** Dos caminos, y el segundo
no depende de que nadie conecte nada: (1) Cloudflare › Workers & Pages ›
Create › Import a repository › `tiendas` (su `wrangler.jsonc` publica
`panel/` con el nombre `flota-panel`); o (2) poner `CLOUDFLARE_API_TOKEN`
(plantilla *Edit Cloudflare Workers*) y `CLOUDFLARE_ACCOUNT_ID` en los secretos
de `tiendas`: cada `flota` › **estado** escribe el panel y lo publica con
`wrangler@4 deploy`. El resumen de la corrida dice la dirección.

**Por qué no se enciende todavía.** Porque el portal se abre desde la hoja de
administración y esa hoja ya está protegida por la cuenta de Google del
operador. Access entra cuando el portal se sirva en una dirección propia
—roadmap 3.7—, y entonces protege también el panel estático que escribe
`flota` › `estado`.

**Lo que Access NO hace:** no protege la tienda del comercio (esa es pública, y
tiene que serlo), no cifra nada que no estuviera ya cifrado por HTTPS, y no
sustituye a la clave del panel del comerciante, que vive en su maestro.

## Y uno que solo aparece al rotar el token

`A3_rotarToken()` cambia el token de montaje. Hay que llevarlo a **TRES** sitios:
el secreto `MAESTRO_TOKEN` (o correr `conectar` otra vez con el nuevo), **la
pestaña `Tiendas` del panel** y el `tienda.json` local. Si se olvida el del
panel, el panel marca esa tienda como caída y le vacía las métricas — y la
tienda está perfecta.

---

## Dominio propio (0.11.0 · 4.5)

La tienda de pruebas vive en **`tienda.laboratorio-digital.com`**. El dominio es
el único costo en efectivo del producto, y alcanza para todas las tiendas como
subdominios (`panaderia.laboratorio-digital.com`, …). `alta` propone
`https://<nombre>.<dominio>` (clave `dominio` de `flota.json`) y `conectar` lo
escribe en `sitio_url` si estaba vacío.

**Lo que hace el código.** `montar/nombrar-worker.mjs` lee `sitio_url` del
catálogo horneado y, si es un dominio propio (no `*.workers.dev` ni
`*.pages.dev`), escribe en `wrangler.jsonc` la ruta como *custom domain*. Al
desplegar, Cloudflare crea el registro DNS y el certificado solo. La dirección
de `workers.dev` sigue viva; la canónica —SEO, Bold, rastreo, sitemap— es la de
la hoja.

**Lo que hay que hacer una vez por tienda:**

1. **La zona `laboratorio-digital.com` tiene que estar en la MISMA cuenta de
   Cloudflare que el Worker** (Cloudflare › Add a site, y cambiar los servidores
   de nombres en el registrador). Si el DNS está en otro proveedor, el custom
   domain no se puede crear y el despliegue lo dice.
2. **No crear a mano un registro DNS** para el subdominio: el custom domain lo
   crea solo, y uno previo lo bloquea («already has externally managed DNS
   records»). Si ya lo creaste, bórralo antes del primer despliegue.
3. En el panel › Tienda › Avanzado › **Dirección de la tienda**:
   `https://tienda.laboratorio-digital.com` (o en la hoja, `sitio_url`).
4. Correr **montaje**: el paso «El nombre del Worker, desde la hoja» escribe la
   ruta, y el despliegue de Cloudflare la activa.
5. Comprobar: `https://tienda.laboratorio-digital.com` abre la tienda,
   `/admin.html` el panel, y el enlace de un pedido nuevo (rastreo) ya usa el
   dominio.

### Las fotos con dominio propio: dos maneras, las dos valen (decisión 22)

| | **Ninguna** (la de siempre, de fábrica) | **Cloudflare, en tu propio dominio** |
|---|---|---|
| Cómo | El montaje hace tres tamaños en WebP (160, 600, 900) y el sitio los sirve | Cloudflare hace el tamaño y el formato justos (AVIF/WebP) al pedirlos, en su borde |
| Costo | $0 y sin límites | 5.000 fotos distintas al mes gratis; después se cobra por cada mil |
| Se activa | nada que hacer | Cloudflare › la zona › **Images › Transformations › Enable for zone**, y en el panel › Avanzado › Transformación de fotos |
| Si falla | — | la página vuelve sola al original: se ve igual, sin el ahorro |

**La recomendación** es seguir con la de siempre mientras la tienda tenga pocas
fotos, y pasar a Cloudflare cuando el peso de la página importe (catálogos
grandes, muchas visitas desde celular). Los tres tamaños se siguen haciendo
igual con Cloudflare elegido: son el respaldo. Desde la 0.16.0 el **montaje y
Publicar comprueban** que la zona de verdad transforma, y si no, lo dicen en el
resumen con dónde activarlo (`montar/revisar-fotos-cdn.mjs`).
