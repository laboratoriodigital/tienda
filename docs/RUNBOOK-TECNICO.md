# Runbook del técnico de despliegue

Esta es la **lista de pasos para hacer**, en orden, con lo que hay que escribir
en cada campo y **cómo se comprueba que salió bien** antes de pasar al
siguiente. No explica por qué: el porqué de cada paso está en `DESPLIEGUE.md`,
y cada sección de aquí dice a cuál mirar.

> **Reparto de papeles entre los dos documentos, para que no se separen:**
> aquí van los clics, los valores y las comprobaciones; allá, el mapa, las
> advertencias y las razones. Cuando cambie el procedimiento, se cambian los
> dos en el mismo commit — una batería comprueba que este archivo nombra los
> flujos y las funciones que de verdad existen.

**Tiempo total:** entre 45 y 70 minutos por tienda, de los cuales unos 25 son
de Google y unos 15 de contenido (fotos y textos). Los flujos tardan 2 minutos
cada uno.

**Antes de empezar, ten a mano:** el nombre corto de la tienda
(`cafe-la-esquina`), el nombre del comercio como lo verá el comprador
(`Café La Esquina`), qué producto es (Tienda Panel o Tienda Básica), el celular
de WhatsApp del comercio y sus datos de empresa (razón social, NIT, dirección,
ciudad, teléfono, correo).

---

## 0 · Requisitos, una sola vez en la vida (no por tienda)

| | Qué | Dónde se comprueba |
|---|---|---|
| 0.1 | Acceso a la organización de GitHub con permiso de administrador | github.com/laboratoriodigital |
| 0.2 | `laboratoriodigital/tiendas` con sus secretos: `ALTA_TOKEN`, `FLOTA_TOKEN`, `SEMILLA_TOKEN`, `DISPARO_TOKEN`, `PANEL_URL`, `PANEL_CLAVE` | Settings › Secrets and variables › Actions |
| 0.3 | Las semillas con al menos una versión publicada (`release`) | github.com/laboratoriodigital/tienda/releases |
| 0.4 | La hoja **Panel de tiendas** instalada, implementada como aplicación web y con su *Clave para el alta* generada | Menú Panel › Diagnóstico |
| 0.5 | Cuenta de Cloudflare con el dominio, si las tiendas llevan subdominio | dash.cloudflare.com |
| 0.6 | `node --version` ≥ 22 y `npm i -g @google/clasp` en tu equipo | terminal |
| 0.7 | API de Apps Script habilitada en **cada** cuenta de Google que vayas a usar | script.google.com/home/usersettings |

Detalle y porqués: `DESPLIEGUE.md` › *Antes de la primera tienda de tu vida*.

---

## A · Crear el repositorio de la tienda  ·  2 min  ·  flujo `alta`

1. Abre **github.com/laboratoriodigital/tiendas › Actions › alta › Run
   workflow**.
2. Llena los tres campos:
   - **nombre**: minúsculas, números y guiones, de 3 a 40 (`cafe-la-esquina`).
     Es a la vez el nombre del repositorio, el del sitio en Cloudflare y el
     subdominio: no se puede cambiar después sin rehacerlo todo.
   - **comercio**: como lo verá el comprador (`Café La Esquina`).
   - **producto**: `tienda` (Tienda Panel) u `organico` (Tienda Básica).
3. **Run workflow** y espera el verde (~90 s).

**Comprobar antes de seguir:**

- [ ] Existe `github.com/laboratoriodigital/cafe-la-esquina` y trae
      `publicar/`, `maestro.gs` y los flujos.
- [ ] El resumen de la corrida trae la lista **«Lo que falta, en este orden»**
      con los datos de ESTA tienda. Cópiala: es tu guion para los pasos B y C.
- [ ] En `tiendas`, `flota.json` tiene una fila nueva con ese repositorio.
- [ ] Settings › Actions › General del repositorio nuevo: *Read and write
      permissions* ya marcado (lo pone el flujo).

**Si falla:** el resumen dice cuál de las tres entradas está mal. Un nombre
repetido o una dirección ya usada se rechazan antes de crear nada.

---

## B · Google: la cuenta, la hoja y el maestro  ·  25 min

> ⚠ **El orden de B.5 y B.6 no es negociable** (bitácora 74): se instala y
> **después** se implementa. Si implementas antes de pegar `HOJA_ID`, la
> aplicación web corre una versión que no conoce su hoja y `conectar` falla con
> «Falta HOJA_ID» aunque el diagnóstico funcione.

1. **Cuenta de Google nueva para esta tienda** (nunca la tuya ni la del
   comercio): `tienda.cafelaesquina@gmail.com`, con tu celular de recuperación
   y verificación en dos pasos. Guarda la contraseña en el gestor.
2. **Hoja nueva** en Drive de esa cuenta, llamada como el comercio. Copia su
   identificador: es lo que va entre `/d/` y `/edit` en la URL.
3. **Proyecto de Apps Script**: script.google.com › Nuevo proyecto. Nómbralo
   como el comercio. Borra el `Código.gs` de ejemplo.
4. Pega **todo** `maestro.gs` del repositorio de esta tienda (GitHub › el
   archivo › botón *Copy raw file*).
5. En la línea `var HOJA_ID = '';` pega el identificador del paso B.2. Guarda
   (Ctrl+S).
6. Ejecuta **`A0_instalar`** (selector de funciones › A0_instalar › Ejecutar) y
   **autoriza** cuando Google lo pida (Configuración avanzada › Ir al proyecto).
   - [ ] La hoja tiene ahora todas sus pestañas y el registro de ejecución dice
         «LISTO».
7. **Implementar › Nueva implementación › Aplicación web**:
   - Descripción: `v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
   - Copia la **URL /exec**.
8. **Abre esa URL una vez en el navegador**. Tiene que contestar un JSON
   (`{"ok":true,...}`). Ese paso es el que le enseña al maestro su propia
   dirección.
9. **Llena la pestaña Configuración** de la hoja con los datos del comercio:
   `negocio`, `whatsapp`, `empresa_*`, `sitio_titulo`, `sitio_descripcion`,
   `horario`, colores y textos de portada. Deja `sitio_url` y `repositorio`
   vacíos: los escribe `conectar`.
10. Ejecuta **`A2_diagnosticoCompleto`** en el editor del maestro y copia del
    registro: **Servicio** (la URL `/exec`) y **Token** (`tk-…`).

**Comprobar antes de seguir:**

- [ ] `A2_diagnosticoCompleto` dice que la hoja abre y no lista pestañas
      faltantes.
- [ ] La URL `/exec` abierta en una ventana de incógnito contesta JSON (si pide
      iniciar sesión, la implementación quedó en «Solo yo»: repite B.7).

---

## C · Conectar la tienda con su hoja  ·  2 min  ·  flujo `conectar`

1. **tiendas › Actions › conectar › Run workflow**.
2. Campos:
   - **nombre**: el mismo del paso A (`cafe-la-esquina`).
   - **maestro_url**: el *Servicio* del paso B.10.
   - **maestro_token**: el *Token* del paso B.10.
3. **Run workflow** y espera el verde.

**Qué hace** (no tienes que hacer nada de esto a mano): pregunta al maestro su
hoja y su proyecto; escribe los secretos `MAESTRO_URL`, `MAESTRO_TOKEN`,
`HOJA_ID` y `SCRIPT_ID` en el repositorio de la tienda; escribe en la hoja el
comercio, la dirección y el repositorio; le siembra al maestro su
`GITHUB_TOKEN`; registra la tienda en la hoja de administración; y dispara el
primer **montaje**.

**Comprobar:**

- [ ] El resumen dice «conectada con su hoja» y lista lo que escribió.
- [ ] En el repositorio de la tienda › Settings › Secrets: están los cuatro.
- [ ] En la hoja, la pestaña Configuración tiene ya `repositorio` y `sitio_url`.
- [ ] En la hoja de administración, la tienda aparece en la pestaña Tiendas.
- [ ] En el repositorio de la tienda › Actions: hay un `montaje` corriendo.

**Si dice «Falta HOJA_ID»:** la versión implementada es anterior a pegarlo. En
el editor del maestro: `A0_instalar`, luego **Implementar › Gestionar
implementaciones › lápiz › Versión: Nueva versión › Implementar** (la URL no
cambia), y vuelve a correr `conectar`.

---

## D · El stub en la hoja  ·  3 min

> ⚠ **Desde el maestro DE ESTA TIENDA** (bitácora 76). Un stub generado por el
> maestro de otra lleva su URL y su token: el menú aparece, funciona y
> administra la tienda de al lado.

1. En el editor del maestro de esta tienda, ejecuta **`A1_generarStub`**.
2. Copia el bloque completo que imprime (o usa el botón *Copiar el stub*).
3. En la **hoja** del comercio: Extensiones › Apps Script › borra lo que haya ›
   pega › guarda.
4. Recarga la hoja y **abre el menú una vez**.

**Comprobar:**

- [ ] El menú de la hoja se llama como el comercio y tiene ocho opciones.
- [ ] En el editor de la hoja, debajo de `var MAESTRO` y `var TOKEN`, aparece
      `var NEGOCIO = '…';` con el nombre del comercio.
- [ ] Menú › *Diagnóstico* contesta sin error.

---

## E · Cloudflare  ·  3 min  ·  **solo cuando el montaje del paso C esté verde**

1. dash.cloudflare.com › **Workers & Pages › Create › Import a repository**.
2. Elige el repositorio de la tienda. Rama de producción: `main`. Comando de
   compilación: **vacío**. Directorio de salida: `publicar/`.
3. Deploy.
4. Si la tienda lleva subdominio propio, el montaje ya escribió la ruta en
   `wrangler.jsonc` desde `sitio_url`: comprueba en Settings › Domains &
   Routes que aparezca `cafe-la-esquina.laboratorio-digital.com`.

**Comprobar:**

- [ ] La dirección abre la tienda con el catálogo del comercio (no el de otra).
- [ ] `https://…/catalogo.json` responde y trae sus productos.
- [ ] En el celular, la tienda se ve bien y el botón de WhatsApp abre el chat
      del comercio.

---

## F · Contenido y puesta a punto  ·  15-30 min

1. **Fotos**: el comercio sube las fotos crudas a su carpeta de Drive
   (`fotos_drive`). El flujo `fotos` las baja y prepara una vez al día; para no
   esperar, dispáralo a mano o usa *Publicar ahora* desde el panel.
2. **Catálogo**: llena la pestaña Catálogo (ID, Nombre, Formato, Categoría,
   Precio, Stock, Descripción, Imágenes, Destacado, Activo, Referencia, Precio
   antes, Umbral bajo, Variantes).
3. **Envíos y cupones**: sus pestañas, o el panel.
4. **Clave del panel**: menú de la hoja › *Clave del panel*, y entrégasela al
   comercio junto con `panel_usuario`.
5. **Medición** (opcional, 0.19.0): si el comercio quiere Google Analytics,
   crea el flujo de datos web en analytics.google.com y pega el `G-XXXXXXXXXX`
   en la clave `analytics_id` de la pestaña Configuración. **Publica** después
   para que tome efecto, y avísalo en la política de privacidad.
6. **Respaldo**: pega en `respaldo_carpeta` el enlace de la carpeta de Drive
   del administrador, y dale permiso de edición a la cuenta de esta tienda.
7. **WhatsApp Business**: respuesta automática con los datos de pago.
8. **Publicar ahora** desde el panel o el menú.

---

## G · Las comprobaciones antes de entregar

- [ ] Pedido de prueba de punta a punta: agregar, cupón, envío, enviar por
      WhatsApp, y que la fila aparezca en la pestaña Pedidos con su número.
- [ ] El total del mensaje coincide con el de la página y dice que lo verificó
      la hoja.
- [ ] Con `cobro_modo: Pasarela`: un cobro de prueba en ambiente de pruebas,
      y después cambiar a Producción con sus llaves.
- [ ] La tienda abre en menos de 2 segundos en 4G (el catálogo es un archivo).
- [ ] `A2_diagnosticoCompleto` sin pendientes, y la columna «Sin terminar» del
      portal vacía para esta tienda.
- [ ] La hoja de administración muestra sus cifras tras *Actualizar todas las
      tiendas*.
- [ ] El respaldo semanal corrió al menos una vez (`A4_respaldoAhora`).
- [ ] `CLASPRC` puesto si esta tienda va a publicar su maestro desde Actions.

---

## H · La entrega al comercio

1. Comparte la hoja con la cuenta personal del comercio, con permiso de
   edición, y la carpeta de fotos.
2. Entrega: dirección de la tienda, dirección del panel (`/admin.html`),
   usuario y clave, y la `GUIA-COMERCIANTE.md`.
3. Explica las tres cosas que va a hacer todos los días: cambiar precios o
   stock, **Publicar ahora**, y atender los pedidos.
4. Anota en la hoja de administración: plan, precio mensual, día de cobro,
   contacto y notas.

---

## I · Incidentes: qué hacer cuando algo se rompe

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| La tienda muestra productos de otro comercio | El stub o los secretos son de otra tienda | Regenerar el stub desde el maestro de ESTA tienda (paso D) y revisar `MAESTRO_URL`/`MAESTRO_TOKEN` |
| «Falta HOJA_ID» en `conectar` o en la tienda | La versión implementada es anterior | `A0_instalar` y publicar **Nueva versión** de la implementación |
| El menú de la hoja no responde | La implementación quedó en «Solo yo» | Implementar › Gestionar implementaciones › lápiz › Cualquier persona |
| El panel dice que la tienda no responde, y la tienda está bien | Token viejo en la hoja de administración | Copiar el token nuevo con `A2_diagnosticoCompleto` a la pestaña Tiendas |
| La tienda se ve desactualizada | Falta publicar | *Publicar ahora* (panel o menú) y mirar Actions |
| Una publicación dejó la tienda peor | — | Actions › **restaurar** › `el-sitio` (vuelve al commit anterior) |
| Una versión nueva rompió algo | — | Actions › **restaurar** › `la-version` |
| El comercio borró medio catálogo | — | En el maestro: `A5_respaldos()` y `A6_restaurarDatos('ultimo','Catálogo')`, y publicar |
| Las fotos no cargan | `fotos_cdn` apunta a un proveedor que no transforma | Vaciar `fotos_cdn` (vuelve al archivo original) y mirar el aviso del montaje |
| El montaje falla al publicar en `main` | Permisos de Actions | Settings › Actions › General › *Read and write permissions* |
| El montaje termina en rojo con «Cannot find module montar/…» | Esa tienda nació de una versión anterior y no trae esa herramienta | Desde la 0.20.3 el cronómetro ya no tumba la corrida. Si el que falta es otro, actualiza la tienda (montaje › **semilla**, o el panel › *Versión de tu tienda*): la actualización le lleva `montar/` completo |
| El montaje muere en el primer paso con «403 · Write access to repository not granted» | El `SEMILLA_TOKEN` de esa tienda no la incluye a ella (token de grano fino acotado a la semilla) | Amplía ese token: *Repository access* con esa tienda, *Contents* y *Workflows* en **Read and write**. Desde la 0.20.5 el montaje ya no se baja el repositorio con ese permiso: comprueba si alcanza, lo dice en el resumen y sigue sin los flujos. Quitar el secreto también desbloquea la corrida |
| El montaje no publica el maestro | Falta `CLASPRC`, `SCRIPT_ID` o `HOJA_ID` | El resumen dice cuál; `clasp login --no-localhost` con la cuenta de la tienda |
| «El permiso no sirve o se venció» (401) al Publicar o Actualizar | El `GITHUB_TOKEN` del maestro está vencido o mal copiado | Pon el token nuevo en `DISPARO_TOKEN` y corre `conectar`: desde la 0.20.2 el maestro comprueba el guardado y, si ya no sirve, lo reemplaza solo. Si el viejo todavía sirve y aun así quieres cambiarlo, marca **forzar_permiso** |
| «No encuentro el repositorio X, o el permiso no lo incluye» al Publicar o Actualizar desde el panel | El `DISPARO_TOKEN` que el maestro tiene como `GITHUB_TOKEN` se hizo sobre **Only select repositories** y esa tienda es posterior | Rehaz `DISPARO_TOKEN` sobre **todos** los repositorios del dueño, solo *Actions: Read and write*, cámbialo en `tiendas` y corre `conectar` otra vez. Desde la 0.20.1 `conectar` avisa en su resumen si ese token no ve la tienda |
| `flota` › actualizar dice «Ninguna tienda de esta línea en esos anillos» | El campo *solo esta tienda* no encajó, o la línea/anillo no son los de esa tienda | Desde la 0.20.1 basta el nombre corto (`prueba1`) y el resumen lista las tiendas de esa línea con su anillo. Comprueba también la línea: una Tienda Panel no se actualiza con `organico` |

---

## K · Los tres flujos que mueven una tienda, opción por opción

### `montaje` (en el repositorio de la tienda) — el que publica

| Entrada | Valores | Qué hace |
|---|---|---|
| `que` | `todo` · `solo-la-hoja` · `solo-las-fotos` | Qué se trae antes de hornear. `todo` es lo normal: la hoja y las fotos |
| `maestro` | casilla | Publica también `maestro.gs` en Apps Script. **Pide `CLASPRC`, `SCRIPT_ID` y `HOJA_ID`** |
| `confirmar` | texto | Hay que escribir `PUBLICAR` para que la casilla anterior valga. Sin eso, el paso se salta y lo dice |
| `aprobacion` | `automatica` · `con-pull-request` | Dónde cae el resultado: directo a `main`, o a un pull request para revisarlo |
| `sin_guardia` | casilla | Se salta el guardia del presupuesto de tiempo. Para una corrida excepcional, no para todos los días |
| `semilla` | casilla | **Actualiza la tienda**: trae la versión de la semilla antes de hornear |
| `version` | `vX.Y.Z` | Con `semilla`, qué versión traer. Vacío = la última publicada. **Una versión anterior también vale**: es como se vuelve atrás |

Sin marcar nada, `montaje` hornea lo que diga la hoja y publica. Con `semilla`
marcado, además actualiza el código; si algo falla en las baterías, no publica
nada y el maestro vuelve a su versión anterior.

### `restaurar` (en el repositorio de la tienda) — el que vuelve atrás

| Entrada | Valores | Qué hace |
|---|---|---|
| `que` | `el-sitio` | Devuelve `publicar/` a un commit anterior y lo publica **como un commit nuevo encima**. Cloudflare republica solo |
| | `la-version` | Le pide a `montaje` que traiga una versión anterior de la semilla (código y maestro) |
| `hasta` | vacío | `el-sitio`: el commit anterior que tocó `publicar/`. `la-version`: la etiqueta anterior a la de esta tienda |
| | `a1b2c3d` | Ese commit en concreto (tiene que haber tocado `publicar/`) |
| | `v0.18.1` | Esa versión de la semilla |
| `confirmar` | `RESTAURAR` | Obligatorio. Sin esa palabra exacta no se toca nada |

Los **datos** de la hoja no se restauran desde aquí: eso es `A5_respaldos()` y
`A6_restaurarDatos()` en el editor del maestro.

### `flota` (en `laboratoriodigital/tiendas`) — el que mueve a todas

| Entrada | Valores | Qué hace |
|---|---|---|
| `accion` | `estado` | Pregunta a cada tienda su versión, escribe `ESTADO.md` y el panel, y —si hay token de Cloudflare— lo publica. No toca ninguna tienda |
| | `actualizar` | Pone al día las tiendas de una línea, por anillos |
| `linea` | `tienda` · `organico` | Qué producto se actualiza. Una corrida, una línea |
| `anillo` | `0` · `1` · `2` | Hasta dónde llega: 0 solo las de prueba, 1 las primeras tiendas, 2 todas. Va en orden y **se detiene si una falla**. El anillo de cada tienda se decide en `flota.json` y se ve en el portal y en el panel de la flota |
| `version` | `vX.Y.Z` | Qué versión llevar. Vacío = la última publicada con `release` |
| `ensayo` | casilla, **marcada de fábrica** | Dice qué haría y no toca nada. Desmarcarla es lo que hace que ocurra de verdad |
| `tienda` | `dueño/repositorio` | Solo esa tienda, ignorando el anillo |
| `sin_base` | `dejar` · `sobrescribir` | Qué hacer con los archivos distintos cuando no se sabe de qué versión salió la tienda. `dejar` de fábrica |

### Ejemplo completo: actualizar `prueba1` a la última versión de la semilla

Hay tres caminos y sirven para lo mismo; se elige por dónde estés parado.

**1. Desde la flota, una sola tienda (lo que haría el operador).**

1. Corta la versión en la semilla si no existe: `tienda` › Actions › `release`
   › Run workflow (lee la versión de `package.json`; crea la etiqueta `v0.20.0`).
2. `tiendas` › Actions › `flota` › Run workflow:
   - `accion`: **actualizar**
   - `linea`: **tienda**
   - `anillo`: **2**
   - `version`: vacío (la última publicada)
   - `ensayo`: **marcada** la primera vez
   - `tienda`: `laboratoriodigital/prueba1`
3. Lee el resumen del ensayo: dice qué dispararía y con qué versión.
4. Repite con `ensayo` **desmarcada**. La flota dispara el `montaje` de
   `prueba1` con `semilla: true` y **espera a que termine**.

**2. Desde la propia tienda (lo que hace el comercio).**

`prueba1` › Actions › `montaje` › Run workflow, marcando **`semilla`** y
dejando `version` vacío. O, sin salir del navegador del comercio: panel ›
Tienda › *Versión de tu tienda* › **Actualizar ahora**; o el menú de la hoja ›
*Actualizar a la última versión*. Las tres cosas disparan exactamente el mismo
flujo.

**Qué pasa por dentro, en los dos casos** (~10-20 minutos):

1. `actualizar-semilla.mjs` clona la semilla, se planta en la etiqueta pedida y
   escribe en la tienda solo los archivos que `semilla.json` declara suyos.
2. Si vino un `maestro.gs` nuevo, el flujo lo publica en Apps Script con
   `CLASPRC` y **espera a que la tienda conteste esa versión**.
3. Se rehornea todo desde la hoja: `<head>`, catálogo, respaldo, SEO, fotos.
4. Se corre la suite **completa** sobre los archivos ya modificados.
5. Si todo está verde, un solo commit a `main` y Cloudflare publica.
6. Si algo falló, **no se publica nada** y el maestro vuelve a su versión
   anterior.

**Comprobar después:**

- [ ] `prueba1` › Actions: el montaje en verde.
- [ ] El portal (hoja de administración › Panel › Abrir el portal): la columna
      Versión de `prueba1` dice la nueva.
- [ ] El panel de la tienda › *Revisión de tu tienda*: todo en orden.
- [ ] Si algo quedó mal: `prueba1` › Actions › `restaurar` › `la-version`,
      `hasta` vacío, `confirmar` = `RESTAURAR`.

---

## J · Tareas recurrentes del operador

| Cada | Qué | Cómo |
|---|---|---|
| Día | Mirar el portal: tiendas sin responder, pedidos por confirmar, errores | Hoja de administración › Panel › Abrir el portal |
| Semana | Que el respaldo de cada tienda esté al día | Columna «Último respaldo» del portal |
| Semana | Actualizar la flota al último release | `tiendas` › Actions › flota › `actualizar` (por anillos) |
| Mes | Revisar minutos de Actions y ejecuciones de Apps Script | `ARQUITECTURA.md` § presupuestos |
| Trimestre | **Simulacro de reversión** en una tienda de prueba | `restaurar` › `la-version`, y volver |
| Cuando caduque | Renovar `ALTA_TOKEN`, `FLOTA_TOKEN`, `SEMILLA_TOKEN`, `DISPARO_TOKEN` y los `CLASPRC` | `ARQUITECTURA.md` § 6d dice dónde nace cada uno |
