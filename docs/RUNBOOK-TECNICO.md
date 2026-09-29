# Runbook del técnico de despliegue

Esta es la **lista de pasos para hacer**, en orden, con lo que hay que escribir
en cada campo y **cómo se comprueba que salió bien** antes de pasar al
siguiente, y la tabla de **incidentes**: síntoma → causa → qué hacer, con los
mensajes tal como los imprimen los flujos. No explica por qué: el porqué de
cada paso, los secretos y lo que hace cada flujo por dentro están en
`DESPLIEGUE.md`, y cada sección de aquí dice a cuál mirar.

> **Reparto de papeles entre los dos documentos, para que no se separen:**
> aquí van los clics, los valores, las comprobaciones y los incidentes; allá,
> el mapa, las advertencias y las razones. Cuando cambie el procedimiento, se
> cambian los dos en el mismo commit — una batería comprueba que este archivo
> nombra los flujos y las funciones que de verdad existen.

**Tiempo total:** entre 45 y 70 minutos por tienda, de los cuales unos 25 son
de Google y unos 15 de contenido (fotos y textos).

**Antes de empezar, ten a mano:** el nombre corto de la tienda
(`cafe-la-esquina`), el nombre del comercio como lo verá el comprador
(`Café La Esquina`), qué producto es (Tienda Panel o Tienda Básica), el celular
de WhatsApp del comercio y sus datos de empresa (razón social, NIT, dirección,
ciudad, teléfono, correo).

**Regla de la casa, para toda la sección I:** reproducir antes de diagnosticar.
El mensaje de una corrida roja está en su **resumen** (lo primero que se ve) y
el detalle en el registro del paso que falló.

---

## 0 · Requisitos, una sola vez en la vida (no por tienda)

| | Qué | Dónde se comprueba |
|---|---|---|
| 0.1 | Acceso a la organización de GitHub con permiso de administrador | github.com/laboratoriodigital |
| 0.2 | `laboratoriodigital/tiendas` con sus secretos: `ALTA_TOKEN`, `FLOTA_TOKEN`, `SEMILLA_TOKEN`, `DISPARO_TOKEN`, `PANEL_URL`, `PANEL_CLAVE` (y, opcionales, `PANEL_SCRIPT_ID`, `PANEL_CLASPRC`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) | Settings › Secrets and variables › Actions. Permisos de cada uno: `DESPLIEGUE.md` › *Secretos, tokens y llaves* |
| 0.3 | Las semillas con al menos una versión publicada (`release`) | github.com/laboratoriodigital/tienda/releases |
| 0.4 | La hoja **Panel de tiendas** instalada, implementada como aplicación web y con su *Clave para el alta* generada | Menú Panel › Diagnóstico |
| 0.5 | Cuenta de Cloudflare con el dominio, si las tiendas llevan subdominio | dash.cloudflare.com |
| 0.6 | `node --version` ≥ 22 y `npm i -g @google/clasp` en tu equipo | terminal |
| 0.7 | API de Apps Script habilitada en **cada** cuenta de Google que vayas a usar | script.google.com/home/usersettings |

Detalle y porqués: `DESPLIEGUE.md` › *Antes de la primera tienda de tu vida*.

---

## A · Crear el repositorio de la tienda  ·  flujo `alta`

1. Abre **github.com/laboratoriodigital/tiendas › Actions › alta › Run
   workflow**.
2. Llena los tres campos:
   - **nombre**: minúsculas, números y guiones, de 3 a 40 (`cafe-la-esquina`).
     Es el nombre del repositorio y del subdominio: no se puede cambiar después
     sin rehacerlo todo. (El nombre del sitio en Cloudflare lo reescribe cada
     montaje a partir de `negocio`: `DESPLIEGUE.md` › paso 1.)
   - **comercio**: como lo verá el comprador (`Café La Esquina`).
   - **producto**: `tienda` (Tienda Panel) u `organico` (Tienda Básica).
3. **Run workflow** y espera el verde.

**Comprobar antes de seguir:**

- [ ] Existe `github.com/laboratoriodigital/cafe-la-esquina` (privado) y trae
      `publicar/`, `maestro.gs` y los flujos.
- [ ] El resumen de la corrida trae la lista **«Lo que falta, en este orden»**
      con los datos de ESTA tienda. Cópiala: es tu guion para los pasos B y C.
- [ ] En `tiendas`, `flota.json` tiene una fila nueva con ese repositorio y
      `"anillo": 2`.
- [ ] Settings › Actions › General del repositorio nuevo: *Read and write
      permissions* ya marcado (lo pone el flujo).

**Si falla:** ver la sección I, grupo *alta*. Un nombre repetido o una
dirección ya usada se rechazan antes de crear nada.

---

## B · Google: la cuenta, la hoja y el maestro  ·  25 min

> ⚠ **El orden de B.6 y B.7 no es negociable** (bitácora 74): se instala y
> **después** se implementa. Si implementas antes de pegar `HOJA_ID`, la
> aplicación web corre una versión que no conoce su hoja y `conectar` falla con
> «El maestro no abre su hoja» aunque el diagnóstico funcione.

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
         «LISTO. Pestañas de la hoja: …».
7. **Implementar › Nueva implementación › Aplicación web**:
   - Descripción: `v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
   - Copia la **URL /exec**.
8. **Abre esa URL una vez en el navegador**. Tiene que contestar un JSON
   (`{"ok":true,...}`). Ese paso es el que le enseña al maestro su propia
   dirección.
9. **Llena la pestaña Configuración** de la hoja con los datos del comercio:
   `whatsapp`, `empresa_*`, `pago_*`, `sitio_titulo`, `sitio_descripcion`,
   `horario`, colores y textos de portada. `negocio`, `sitio_url` y
   `repositorio` los escribe `conectar` si están vacíos.
10. Ejecuta **`A2_diagnosticoCompleto`** en el editor del maestro y copia del
    registro: **Servicio** (la URL `/exec`) y **Token** (`tk-…`).

**Comprobar antes de seguir:**

- [ ] `A2_diagnosticoCompleto` dice que la hoja abre y no lista pestañas
      faltantes.
- [ ] La URL `/exec` abierta en una ventana de incógnito contesta JSON (si pide
      iniciar sesión, la implementación quedó en «Solo yo»: repite B.7).

---

## C · Conectar la tienda con su hoja  ·  flujo `conectar`

1. **tiendas › Actions › conectar › Run workflow**.
2. Campos:
   - **nombre**: el mismo del paso A (`cafe-la-esquina`), **el nombre corto del
     repositorio**, no el del comercio.
   - **maestro_url**: el *Servicio* del paso B.10.
   - **maestro_token**: el *Token* del paso B.10.
   - **forzar_permiso**: sin marcar (solo para reemplazar un permiso de GitHub
     que todavía sirve).
3. **Run workflow** y espera el verde.

**Qué hace** (no tienes que hacer nada de esto a mano): pregunta al maestro su
hoja y su proyecto; escribe en la hoja el comercio, la dirección y el
repositorio donde estén vacíos; comprueba `DISPARO_TOKEN` y, si sirve, se lo
siembra al maestro como `GITHUB_TOKEN`; registra la tienda en la hoja de
administración; escribe los secretos `MAESTRO_URL`, `MAESTRO_TOKEN`, `HOJA_ID`
y `SCRIPT_ID` (y refresca `SEMILLA_TOKEN`) en el repositorio de la tienda; y
dispara el primer **montaje**.

**Comprobar:**

- [ ] El resumen dice «… conectada con su hoja», «Permiso comprobado» y
      «Secretos puestos … y **primer montaje** disparado».
- [ ] En el repositorio de la tienda › Settings › Secrets: están los cuatro del
      maestro y `SEMILLA_TOKEN`.
- [ ] En la hoja, la pestaña Configuración tiene ya `repositorio` y `sitio_url`.
- [ ] En la hoja de administración, la tienda aparece en la pestaña Tiendas.
- [ ] En el repositorio de la tienda › Actions: hay un `montaje` corriendo.

**Si dice «El maestro no abre su hoja»:** la versión implementada es anterior a
pegarlo. En el editor del maestro: `A0_instalar`, luego **Implementar ›
Gestionar implementaciones › lápiz › Versión: Nueva versión › Implementar** (la
URL no cambia), y vuelve a correr `conectar`. Más casos en I, grupo *conectar*.

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
   (`fotos_drive`), con el nombre exacto de la columna Imágenes. Llegan a la
   tienda al **publicar** (menú › *Publicar ahora*, panel › Publicar, o
   Actions › `fotos` › Run workflow). La corrida diaria del flujo `fotos`
   **solo mira y avisa**: no publica.
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
9. **`CLASPRC`**: `clasp login --no-localhost` con la cuenta de esta tienda y el
   contenido entero de `~/.clasprc.json` en el repositorio › Settings ›
   Secrets › Actions › `CLASPRC`. Sin él, la tienda no podrá terminar ninguna
   actualización que traiga un `maestro.gs` nuevo.

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
- [ ] `CLASPRC` puesto (paso F.9): comprobado con un `montaje` con `maestro` y
      `PUBLICAR`, o con `node montar/revisar-clasprc.mjs`.

---

## H · La entrega al comercio

1. Comparte la hoja con la cuenta personal del comercio, con permiso de
   edición, y la carpeta de fotos.
2. Entrega: dirección de la tienda, dirección del panel (`/admin.html`),
   usuario y clave, y la `GUIA-COMERCIANTE.md`.
3. Explica las tres cosas que va a hacer todos los días: cambiar precios o
   stock, **Publicar ahora**, y atender los pedidos.
4. Anota en la hoja de administración: estado `Activa`, plan, precio mensual,
   día de cobro, contacto, cuenta Google y notas.

---

## I · Incidentes: qué hacer cuando algo se rompe

Los textos entre comillas son los que imprime el flujo o la herramienta (en el
resumen de la corrida, o en el registro del paso). Agrupados por dónde aparecen.

### La tienda, vista desde fuera

| Síntoma | Causa más probable | Qué hacer |
|---|---|---|
| La tienda muestra productos de otro comercio | El stub o los secretos son de otra tienda | Regenerar el stub desde el maestro de ESTA tienda (paso D) y revisar `MAESTRO_URL`/`MAESTRO_TOKEN`; `DESPLIEGUE.md` › *Los cuatro sitios donde se pueden cruzar dos tiendas* |
| La tienda carga pero sin productos, o el menú dice «El servicio contestó una página web» | La implementación quedó en «Solo yo» | Implementar › Gestionar implementaciones › lápiz › Acceso: **Cualquier persona**. Comprobar con `<URL>?a=version` en incógnito |
| El menú dice *Unexpected token '<'* | Un maestro viejo, de antes de que el stub supiera explicarlo | Publica el maestro nuevo y vuelve a pegar el stub |
| El menú falla pero **la tienda funciona bien** | El stub quedó con una URL fabricada a partir de la `/dev` | Abre la `/exec` una vez en el navegador, ejecuta `A1_generarStub()` y pega el stub nuevo |
| `A1_generarStub()` imprime `TODAVÍA_NO_SE_SABE_LA_URL` | El maestro aún no ha atendido ninguna petición | Abre la `/exec` una vez en el navegador (B.8) y vuelve a generarlo |
| «Falta HOJA_ID» en la tienda o el panel dice **NO RESPONDE** con *Falta HOJA_ID* | La versión implementada es anterior a pegar el ID | `A0_instalar` y publicar **Nueva versión** de la implementación (o `montaje` con `maestro`) |
| El panel dice **NO RESPONDE** o **TOKEN VIEJO**, y la tienda está bien | Token viejo en la hoja de administración (se rotó con `A3_rotarToken`) | Copiar el token nuevo con `A2_diagnosticoCompleto` a la pestaña Tiendas, o correr `conectar` otra vez |
| El panel de tiendas dice «403 — se agotaron las 60 peticiones por hora que GitHub da sin token» | Apps Script comparte IP con todo el mundo | `GITHUB_TOKEN` de grano fino con solo *Actions: read-only* en las propiedades de la hoja *Panel de tiendas* |
| Un producto sale con su dibujo en vez de su foto | La hoja nombra una foto que no está en el Drive | El resumen de `fotos`/`montaje` la nombra; súbela o corrige la columna Imágenes |
| Las fotos no cargan | `fotos_cdn` apunta a un proveedor que no transforma | Vaciar `fotos_cdn` (vuelve al archivo original) y mirar el aviso de `revisar-fotos-cdn.mjs` en el montaje |
| El panel dice **FALLÓ** en Último respaldo | La cuenta de la tienda no tiene permiso sobre `backup_tiendas` | `DESPLIEGUE.md` › paso 13 |
| La tienda se ve desactualizada | Falta publicar | *Publicar ahora* (panel o menú) y mirar Actions › `fotos` |
| Una publicación dejó la tienda peor | — | Actions › **restaurar** › `el-sitio`. ⚠ Hoy dice «Ya estaba así» sin publicar: ver el grupo *restaurar* |
| Una versión nueva rompió algo | — | Actions › **restaurar** › `la-version` |
| El comercio borró medio catálogo | — | En el maestro: `A5_respaldos()` y `A6_restaurarDatos('ultimo','Catálogo')`, y publicar |

### Publicar ahora y Actualizar (el maestro dispara un flujo)

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «El permiso de esta tienda no sirve o se venció…» (401) | El `GITHUB_TOKEN` del maestro está vencido o mal copiado | Pon el token nuevo en `DISPARO_TOKEN` de `tiendas` y corre `conectar`: desde la 0.20.2 el maestro reemplaza el que ya no sirve. Si el viejo todavía sirve y aun así quieres cambiarlo, marca **forzar_permiso** |
| «El permiso de esta tienda no alcanza a ver <repo>…» (404) | El `DISPARO_TOKEN` se hizo sobre **Only select repositories** y esta tienda es posterior; o `repositorio` en Configuración está mal | Rehaz `DISPARO_TOKEN` sobre **todos** los repositorios del dueño, solo *Actions: Read and write*, y corre `conectar` otra vez. Desde la 0.20.1 `conectar` avisa si ese token no ve la tienda |
| «El permiso existe pero no alcanza. Le falta Actions: Read and write.» (403) | Token sin el permiso de *Actions* | Igual que el anterior, con *Actions: Read and write* |
| «GitHub aceptó la petición pero no encontró la rama main.» (422) | El repositorio no tiene `main` | Revisar el repositorio de la tienda |
| El panel dice «eso lo hace una vez quien la montó» | Falta `repositorio` en Configuración o `GITHUB_TOKEN` en las propiedades | Correr `conectar` (escribe los dos) |

### alta

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «Falta el secreto `ALTA_TOKEN`» | — | Ponerlo en `tiendas` (permisos en `DESPLIEGUE.md`) |
| «ALTA_TOKEN no ve la semilla `…`» | Grano fino sin ese repositorio, dueño del token distinto del de la semilla, o vencido | Rehacer el token sobre **todos** los repositorios del dueño |
| El paso «Leer el formulario» en rojo: «El nombre va en minúsculas…», «Ya hay una tienda … en flota.json», «La dirección … ya es de otra tienda» | Entradas inválidas o repetidas | Corregir y volver a correr. Nada se creó |
| «Ya existe `…`. No toco nada.» | El repositorio existe: el nombre está usado, o un alta anterior falló después de crearlo | Otro nombre, o borrar a mano el repositorio vacío (y su fila de `flota.json`, si la tiene) |
| «La semilla no tiene ninguna versión publicada (etiqueta vX.Y.Z). Corre su **release** primero.» | — | `release` en la semilla |
| Registro de «Crear el repositorio…»: «Esta versión de la semilla llama a herramientas que no trae: …» | La etiqueta más nueva no trae un `montar/*.mjs` que sus flujos llaman. **El repositorio ya quedó creado, vacío** | Cortar una versión nueva de la semilla con esos archivos, borrar a mano el repositorio vacío y repetir el alta |
| El resumen dice «Sin SEMILLA_TOKEN aquí: la tienda se actualizará igual, pero sin traer los flujos.» | Frase anterior a la 0.22.1: los flujos ya llegan por la flota | Solo importa si la semilla es privada: sin ese token la tienda no podrá leerla al actualizarse |

### conectar

| Síntoma | Causa | Qué hacer |
|---|---|---|
| La ficha de arriba dice «no está en flota.json todavía» aunque la tienda sí está | Defecto de la ficha: busca campos que `flota.json` no usa. El paso siguiente es el que de verdad busca | Ignorarlo si el paso siguiente pasa |
| «No hay una tienda «…» en flota.json ¿Corriste **alta** con ese nombre?» | `nombre` no es el nombre corto del repositorio (se busca por `repo`) | Escribir el nombre corto (`cafe-la-esquina`) |
| «La URL no es la del servicio» / «El token no parece el de la hoja» | Se pegó otra cosa (la `/dev`, el token del menú `tkm-…`) | Copiar *Servicio* y *Token* de `A2_diagnosticoCompleto` |
| «No se conectó — El maestro no abre su hoja: falta HOJA_ID…» | La versión implementada es anterior a pegar `HOJA_ID` | `A0_instalar`, **Nueva versión** de la implementación y otra vez `conectar` |
| «El maestro dijo que no: … ¿El token es el de ESTA hoja?» | Token de otra tienda, o rotado | `A2_diagnosticoCompleto` de ESTE maestro |
| «Esta hoja dice que es de …, no de …. ¿Es la hoja de otra tienda?» | La clave `repositorio` de la hoja apunta a otro repositorio | Decidir cuál está mal: la URL/token pegados o la clave de la hoja |
| «El maestro no dijo su hoja o su proyecto: publícale una versión nueva.» | Maestro anterior a la puerta `identidad` | Pegar el `maestro.gs` de la tienda y publicar Nueva versión |
| «Ojo: `DISPARO_TOKEN` NO alcanza a ver `…`» o «…está vencido o mal copiado (GitHub contestó 401)» y «**El permiso no se sembró**» | Token de lista fija o vencido. No se siembra a propósito, para no pisar uno bueno (0.20.8) | Rehacer `DISPARO_TOKEN` sobre todos los repositorios, solo *Actions*, y correr `conectar` otra vez. Lo demás de la corrida sí quedó hecho |
| «Permiso de GitHub: este maestro no sabe recibirlo…» | Tienda Básica o maestro anterior a la 0.16.0 | Ponerlo a mano en las propiedades como `GITHUB_TOKEN` |
| «Hoja de administración: no se pudo registrar (Clave que no corresponde.)» | `PANEL_CLAVE` no es la clave vigente de la hoja | Menú del panel › *Clave para el alta*, y ponerla en `PANEL_CLAVE` |
| «Hoja de administración: no se avisó (faltan los secretos `PANEL_URL` y `PANEL_CLAVE`…)» | Opcionales no puestos | Ponerlos, o pegar la fila a mano |

### montaje (en la tienda)

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «Este repositorio no tiene la tienda configurada» | Faltan `MAESTRO_URL` y `MAESTRO_TOKEN` | Correr `conectar` |
| «EL SITIO DE ESTE REPOSITORIO NO TIENE NOMBRE PROPIO.» | `wrangler.jsonc` sin `name` o con el marcador de la semilla | `npm run tienda` en tu equipo, o poner el `name` a mano |
| «ESTA HOJA NO ES LA DE ESTE REPOSITORIO.» | Secretos o clave `repositorio` cruzados con otra tienda | El mensaje dice los tres sitios; corregir el que esté mal |
| «Marcaste publicar el maestro pero no escribiste PUBLICAR.» | — | Volver a disparar con `confirmar` = `PUBLICAR` |
| «El maestro respondió 404 a «identidad»» después de ««identidad» contestó en 41 s» | La respuesta tardó y la redirección de Google a `script.googleusercontent.com` caducó: el script estaba frío o recién publicado. **No es el acceso**: con «Solo yo» Google contesta en un segundo | Desde la 0.22.4 un 404 que llega tras más de 15 s se reintenta solo, dos veces, con pausa. Si aun así sale «Tardó N s en contestar ese 404», volver a correr en unos minutos y mirar las Ejecuciones del proyecto (bitácora 107) |
| «El maestro respondió 404 a «…»» **rápido** y «Ninguna acción ha contestado todavía» | Ahí sí: implementación con acceso «Solo yo», o `MAESTRO_URL` de otra implementación | Implementar › Gestionar implementaciones › lápiz › Quién tiene acceso: **Cualquier persona**; comprobar `MAESTRO_URL` |
| En la **semilla**, `config.js` en rojo: «La pestaña del navegador dibuja un icono propio -> fotos/…» | Batería anterior a la 0.22.4: solo sabía ver el icono dibujado, y la hoja de la semilla tiene `favicon` o `logo` | Actualizado en la 0.22.4: con foto, comprueba que el archivo esté publicado en `publicar/fotos/` (bitácora 107) |
| «No publiqué el maestro: faltan secretos» | Falta `CLASPRC`, `SCRIPT_ID` o `HOJA_ID`. **Pasa también en una actualización cuya versión trae `maestro.gs` nuevo**, y entonces la actualización no termina | `conectar` pone los dos IDs; `CLASPRC` con `clasp login --no-localhost` (F.9) |
| «EL SECRETO CLASPRC TIENE UN .clasp.json, NO LAS CREDENCIALES.» / «El secreto CLASPRC está vacío.» / «…no es un JSON válido» / «…le falta el refresh_token» | `CLASPRC` mal pegado | Pegar el contenido entero de `~/.clasprc.json` |
| «Clasp dice que NO ENCUENTRA CREDENCIALES» | Lo mismo, o sesión caducada | Repetir `clasp login` y volver a pegar |
| «Google dice: «The caller does not have permission».» | `SCRIPT_ID` de otra tienda, o proyecto creado con otra cuenta | El mensaje lista los proyectos que la cuenta sí ve |
| «Falta habilitar la API de Apps Script EN LA CUENTA que está usando clasp» | — | script.google.com/home/usersettings con ESA cuenta |
| «Este proyecto no tiene ninguna implementación publicada todavía.» | Nunca se implementó | B.7, una sola vez |
| «Subió el archivo pero no pude publicar la versión.» | Falló `update-deployment` | Implementar › Gestionar implementaciones › lápiz › Versión: Nueva |
| «EL MAESTRO PUBLICADO CONTESTA LA VERSIÓN X Y ESTE REPOSITORIO TRAE LA Y.» | El maestro vivo no es el del repositorio | Volver a disparar con `maestro` marcado y `PUBLICAR`, o pegarlo y publicar Nueva versión |
| «Esta tienda todavía no puede vender. Falta en la pestaña Configuración: …» | Falta una clave que bloquea | Llenarla y volver a correr |
| «… sigue sin llenar: la hoja dice [ … ]» | Un valor de fábrica entre corchetes | Llenarlo en Configuración |
| «El maestro devolvió CERO productos activos. No se escribe nada.» | Catálogo vacío o todo inactivo | Revisar la pestaña Catálogo |
| «Estas fotos pesan demasiado para bajarlas por el maestro» (más de 10 MB) o «La foto pesa N MB y el tope son 8 MB» | Foto demasiado grande | Pedir una versión más liviana |
| «Falta fotos_drive en la pestaña Configuración» / «Ese archivo no está en la carpeta de fotos.» | Carpeta sin configurar, o foto fuera de ella | Pegar el enlace, o mover la foto dentro |
| «Nada cambió en la hoja ni en el Drive.» | No es un fallo | El resumen enseña lo que miró |
| «### Las baterías» con líneas `FALLA` | Lo horneado con los datos de esta tienda no cumple una invariante (en una tienda corre `tienda-viva.js`) | Leer la línea `FALLA`: dice qué y con qué valor |
| El montaje termina en rojo con «Cannot find module montar/…» | Esa tienda nació de una versión anterior y no trae esa herramienta | Desde la 0.20.3 el cronómetro ya no tumba la corrida («Sin cronómetro…»). Si el que falta es otro, actualiza la tienda (`montaje` › `semilla`): la actualización le lleva `montar/` completo |
| El montaje muere en el primer paso con «403 · Write access to repository not granted» | `montaje.yml` anterior a la 0.20.5, que se bajaba el repositorio con `SEMILLA_TOKEN`, y ese token no incluye la tienda | **`flota` › `flujos`** con la última etiqueta (le entrega el `montaje.yml` nuevo). Quitar el secreto también desbloquea la corrida |
| «No se pudo publicar» con «permisos» o «protected branch» | *Workflow permissions* en solo lectura, o `main` protegida | Settings › Actions › General › *Read and write permissions*; o disparar con `con-pull-request` |
| «Va por pull request» | El push directo a `main` se rechazó (rama protegida) | Revisar y fusionar el pull request |
| «Se volvió atrás» | La actualización publicó un maestro nuevo y algo falló después | La tienda sigue como estaba; el fallo está más arriba en el resumen |

### Actualizar: los modos de fallo de la automatización (bitácora 99–105)

| Síntoma | Causa | Qué hacer |
|---|---|---|
| El push se rechaza con «refusing to allow a GitHub App to create or update workflow `.github/workflows/….yml` without `workflows` permission» | **Flujos que la tienda no puede empujar** (bitácora 101 y 103): el `GITHUB_TOKEN` de Actions no escribe `.github/workflows` nunca, y ningún token en la URL lo cambia (la cabecera de `actions/checkout` gana). Pasa en una tienda con un `montaje.yml` anterior a la 0.21.2 | **`tiendas` › `flota` › `flujos`** (línea `tienda`, `version` con `v`, `ensayo` desmarcado) y volver a correr la actualización |
| «Los flujos se quedan como estaban. La versión nueva los trae…», «LOS FLUJOS NO VAN EN ESTE COMMIT: los entrega la flota», «**Los flujos los entrega la flota**…» | Lo normal desde la 0.22.1: la tienda publica todo lo demás y deja los flujos | Nada, si la actualizó la flota (los entrega sola después). Si la actualizó el comercio o una persona desde la tienda: **`flota` › `flujos`** |
| «**El permiso `SEMILLA_TOKEN` de esta tienda no la alcanza a ella misma** (GitHub contesta `404`)…» (hasta la 0.22.2; desde la 0.22.3: «_El permiso `SEMILLA_TOKEN` no alcanza a esta tienda… No frena nada_») | **Token de grano fino que no incluye los repositorios nuevos**: se hizo sobre una lista fija (o solo la semilla) y la tienda nació después | Desde la 0.22.1 **no cambia nada**: ese permiso ya no empuja flujos. El consejo del mensaje («ampliarlo») es de la 0.20.5. Lo único que el token tiene que alcanzar es **la semilla**, si es privada |
| «No pude leer la semilla» | `SEMILLA_TOKEN` falta, venció o no incluye la semilla, y la semilla es privada | Rehacer `SEMILLA_TOKEN` en `tiendas` y correr `conectar` para esa tienda: desde la 0.21.2 lo refresca |
| «La semilla no tiene la versión vX.Y.Z. Solo se traen versiones publicadas con **release**.» | Se pidió una versión sin etiqueta | `release` primero, o pedir una que exista |
| En una tienda, las baterías en rojo por cosas que no son de ella (`release.yml`, fotos de muestra, el icono, `servicio/`), o el resumen dice «TODAS LAS BATERÍAS.» en vez de «LA TIENDA VIVA» | **La suite de la semilla corriendo en una tienda** (bitácora 102): `pruebas/publicacion.sh` anterior a la 0.22.0 | `montaje` › `semilla` a la 0.22.0 o posterior: la actualización escribe `pruebas/` antes de la guardia, así que la misma corrida ya usa la tienda viva |
| El flujo `pruebas` de una tienda en rojo cada vez que la flota le entrega flujos | `pruebas.yml` anterior a la 0.22.2 corría `todas.sh` a secas (bitácora 104) | `flota` › `flujos` con `v0.22.2` o posterior |
| `fotos` muere con «Nada que publicar pese a haber detectado novedades» | El paso que MIRA y el que PUBLICA no ven lo mismo. Dos causas conocidas: `preparar-index.mjs` anterior a la 0.22.2 comparaba contra la plantilla y veía «configuración cambiada» **siempre** (bitácora 104); `fotos.yml` anterior a la 0.21.0 no tenía `publicar/404.html` en `PUBLICA` (bitácora 99) | Actualizar la tienda (`montaje` › `semilla`) y entregarle los flujos (`flota` › `flujos`). Si pasa con las dos al día: el resumen trae la lista `PUBLICA` y «lo que quedó tocado en TODO el repositorio» — reproducirlo antes de diagnosticar |

### flota (en `tiendas`)

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «Falta el secreto `FLOTA_TOKEN`» | — | Ponerlo (permisos en `DESPLIEGUE.md`) |
| «Ninguna tienda de esta línea en esos anillos…» | `linea` se quedó en `organico` (la de fábrica), `anillo` en `1` y la tienda está en el 2, o la tienda está `"fuera"` / sin anillo | Elegir `linea` = `tienda` y el anillo de la tienda. El anillo de cada una está en `flota.json`, el portal y el panel de la flota |
| «No hay ninguna tienda «…» en esta línea y hasta ese anillo. Las que sí: …» | El campo *tienda* no encaja, o esa tienda está en un anillo mayor que el pedido (el filtro es dentro del anillo) | Basta el nombre corto (`prueba1`); subir `anillo` hasta el de esa tienda |
| «La semilla … no tiene la etiqueta …» | Versión sin `release` | `release` primero |
| «… ✗ su montaje falló (…). La tienda quedó como estaba… **Las siguientes no se tocan.**» y «Quedaron sin tocar: …» | **La flota se detiene en la primera tienda que falla** (bitácora 105), aunque sea una que nadie usa | Abrir la corrida enlazada y arreglar esa tienda. Si no importa ahora: correr otra vez con *tienda* = la que sí importa, o ponerle `"anillo": "fuera"` en `flota.json` |
| «…: no está en GitHub (404). La salto y sigo con las demás.» y al final «Ojo: … ya no está en GitHub» | El repositorio se borró, **o `FLOTA_TOKEN` no lo incluye** (grano fino sobre una lista fija: GitHub contesta 404, no 403) | Quitarla de `flota.json`, o rehacer `FLOTA_TOKEN` sobre todos los repositorios del dueño |
| «**No se actualizó ninguna tienda**: todas las de esta línea y este anillo están en esa lista.» | Todas dieron 404 | Lo mismo |
| «…: no pude leer su versión — … **Me detengo** aquí.» | Otro error de GitHub (401: token vencido; 403) | Rehacer `FLOTA_TOKEN` |
| «…: el montaje no arrancó. **Me detengo** aquí.» | En dos minutos no apareció la corrida disparada | Mirar la pestaña Actions de la tienda (flujos desactivados, `montaje.yml` ausente) |
| «⚠ sus flujos no se pudieron poner (…). Se puede repetir con **flota › flujos**.» | La tienda se actualizó; la entrega de flujos falló | `flota` › `flujos` con *tienda* = esa |
| `flujos`: «…: no se pudieron poner — la semilla … no tiene semilla.json en 0.22.2» | `version` escrita sin `v` | Escribir `v0.22.2` |
| `flujos`: «…: no se pudieron poner — … (¿`FLOTA_TOKEN` tiene *Workflows: Read and write*?)» | 403 al escribir el flujo | Dar *Workflows* y *Contents* en escritura a `FLOTA_TOKEN` |
| `flujos`: «La línea `organico` no tiene flujos que entregar…» | `linea` de fábrica | `linea` = `tienda` |
| `estado`: «El panel no se publicó: faltan `CLOUDFLARE_API_TOKEN` y/o `CLOUDFLARE_ACCOUNT_ID`…» | Opcionales | Ponerlos, o publicar `panel/` conectando el repositorio en Cloudflare |

### panel, restaurar, release, pruebas

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `panel`: «Faltan los secretos: …» | `PANEL_SCRIPT_ID` o `PANEL_CLASPRC` | Ponerlos (`DESPLIEGUE.md` › *El panel de la flota*) |
| `panel`: «Clasp dice que NO ENCUENTRA CREDENCIALES» en «Publicar panel.gs» | **Defecto conocido del flujo** (sin verificar en una corrida real): nunca escribe `PANEL_CLASPRC` en `~/.clasprc.json` | Hasta que se corrija, pegar `panel.gs` a mano en el Apps Script de la hoja y publicar Nueva versión |
| `panel` muere al clonar con `Remote branch … not found` | `version` sin `v` | Escribir `vX.Y.Z` |
| `restaurar`: «No se restauró nada» con «Escribe **RESTAURAR**…», «La versión se escribe como la etiqueta de la semilla: `v0.16.0`…», «El commit se escribe con su identificador…», «Ese commit no tocó `publicar/`…», «Esta tienda solo tiene una publicación…», «Esta tienda ya está en la versión más antigua publicada…» | Entradas | Corregir la entrada |
| `restaurar` › `la-version` con `hasta` vacío: «La semilla no tiene ninguna versión publicada.» | No pudo leer las etiquetas (semilla privada sin `SEMILLA_TOKEN` válido) | Escribir la versión en `hasta` (`v0.21.2`) |
| `restaurar` › `el-sitio` dice «Ya estaba así» y no publica, aunque el sitio sí cambió | **Defecto conocido del flujo** (reproducido): después de `git checkout <commit> -- publicar/` compara la carpeta con el índice, que ya son iguales | A mano: `git checkout <commit> -- publicar/`, commit y push a `main` |
| `release`: «No hay baterías en verde para este commit» | `pruebas` del push a `main` no está en verde | Esperar el verde y repetir |
| `release`: «vX.Y.Z ya existe, pero apunta a otro commit» | Cambió el código y no la versión | Subir `version` en `package.json` |
| `release`: «`release` no es un flujo de tienda» | Se corrió en una tienda | Nada: no tocó nada |
| `pruebas` en un pull request de la semilla: «La versión sigue en X» | Cambió `maestro.gs`, `panel.gs` o `publicar/index.html` sin subir `version` | Subirla y volver a empujar |

---

## K · Los flujos que mueven una tienda, opción por opción

Las entradas son las de los `inputs:` de cada `.yml`, con su valor de fábrica.

### `montaje` (en el repositorio de la tienda) — el que publica y actualiza

| Entrada | Valores | Qué hace |
|---|---|---|
| `que` | `todo` · `solo-la-hoja` · `solo-las-fotos` | Qué se trae antes de hornear. `todo` es lo normal |
| `maestro` | casilla | Publica también `maestro.gs` en Apps Script. **Pide `CLASPRC`, `SCRIPT_ID` y `HOJA_ID`** |
| `confirmar` | texto | Hay que escribir `PUBLICAR` si se marcó `maestro`. Sin eso, el flujo se detiene y lo dice |
| `aprobacion` | `automatica` · `con-pull-request` | Dónde cae el resultado: directo a `main`, o a un pull request (se ignora si `semilla` trajo cambios) |
| `sin_guardia` | casilla | Se salta el guardia del presupuesto de tiempo. Para una corrida excepcional |
| `semilla` | casilla | **Actualiza la tienda**: trae la versión de la semilla antes de hornear |
| `version` | `vX.Y.Z` o `X.Y.Z` | Con `semilla`, qué versión traer. Vacío = la última publicada. **Una versión anterior también vale**: es como vuelve atrás `restaurar` |

Sin marcar nada, `montaje` hornea lo que diga la hoja y publica. Con `semilla`,
además actualiza el código; si algo falla, no publica nada y el maestro vuelve
a su versión anterior. Secretos: `MAESTRO_URL`, `MAESTRO_TOKEN`; con maestro,
`CLASPRC`, `SCRIPT_ID`, `HOJA_ID`; con semilla, `SEMILLA_TOKEN` si la semilla es
privada.

### `fotos` (en el repositorio de la tienda) — «Publicar ahora»

| Entrada | Valores | Qué hace |
|---|---|---|
| `aprobacion` | `automatica` · `con-pull-request` | Igual que en `montaje`. Si cambió algo fuera de su lista, va por pull request igual |
| `sin_guardia` | casilla | Igual que en `montaje` |

El botón del menú y del panel lo dispara con las de fábrica. La corrida diaria
programada solo mira y avisa.

### `restaurar` (en el repositorio de la tienda) — el que vuelve atrás

| Entrada | Valores | Qué hace |
|---|---|---|
| `que` | `el-sitio` | Devuelve `publicar/` a un commit anterior y lo publica **como un commit nuevo encima**. ⚠ Hoy no publica: ver I |
| | `la-version` | Le pide a `montaje` que traiga una versión anterior de la semilla (código y maestro) |
| `hasta` | vacío | `el-sitio`: el commit anterior que tocó `publicar/`. `la-version`: la etiqueta anterior a la de esta tienda |
| | `a1b2c3d` | Ese commit en concreto (tiene que haber tocado `publicar/`) |
| | `v0.18.1` | Esa versión de la semilla (con `v`) |
| `confirmar` | `RESTAURAR` | Obligatorio. Sin esa palabra exacta no se toca nada |

Los **datos** de la hoja no se restauran desde aquí: eso es `A5_respaldos()` y
`A6_restaurarDatos()` en el editor del maestro.

### `flota` (en `laboratoriodigital/tiendas`) — el que mueve a todas

| Entrada | Valores | Qué hace |
|---|---|---|
| `accion` | `estado` (de fábrica) | Pregunta a cada tienda su versión, escribe `ESTADO.md` y el panel, y —si hay token de Cloudflare— lo publica. No toca ninguna tienda |
| | `actualizar` | Pone al día las tiendas de una línea, por anillos, y les entrega los flujos |
| | `flujos` | Solo entrega los `.github/workflows` de la semilla a cada tienda de la línea |
| `linea` | `organico` (de fábrica) · `tienda` | Qué producto. **Para Tienda Panel, `tienda`** |
| `anillo` | `0` · `1` (de fábrica) · `2` | Hasta dónde llega: 0 solo las de prueba, 1 las primeras tiendas, 2 todas. Va en orden y **se detiene si una falla**. No se usa en `flujos` |
| `version` | `vX.Y.Z` | Qué versión llevar. Vacío = la última publicada con `release`. En `flujos`, **con `v`** |
| `ensayo` | casilla, **marcada de fábrica** | Dice qué haría y no toca nada. Desmarcarla es lo que hace que ocurra de verdad |
| `tienda` | `dueño/repositorio`, nombre corto o nombre | Solo esa tienda. En `actualizar`, **dentro del anillo pedido** |
| `sin_base` | `dejar` · `sobrescribir` | Solo Tienda Básica: qué hacer con los archivos distintos cuando no se sabe de qué versión salió la tienda |

Una tienda con `"anillo": "fuera"` en `flota.json` —o sin anillo— no la toca ni
`actualizar` ni `flujos`.

### `alta`, `conectar` y `panel` (en `laboratoriodigital/tiendas`)

| Flujo | Entradas |
|---|---|
| `alta` | `nombre`, `comercio`, `producto` (`tienda` · `organico`) |
| `conectar` | `nombre`, `maestro_url`, `maestro_token`, `forzar_permiso` (casilla) |
| `panel` | `version` (`vX.Y.Z`, vacío = la última) |

### Ejemplo completo: actualizar `prueba1` a la última versión de la semilla

Hay tres caminos y sirven para lo mismo; se elige por dónde estés parado.

**1. Desde la flota, una sola tienda (lo que haría el operador).**

1. Corta la versión en la semilla si no existe: `tienda` › Actions › `release`
   › Run workflow (lee la versión de `package.json` y crea su etiqueta, p. ej.
   `v0.22.2`).
2. `tiendas` › Actions › `flota` › Run workflow:
   - `accion`: **actualizar**
   - `linea`: **tienda** (la de fábrica es `organico`)
   - `anillo`: **2** (el de `prueba1`; la de fábrica es `1`)
   - `version`: vacío (la última publicada)
   - `ensayo`: **marcada** la primera vez
   - `tienda`: `prueba1`
3. Lee el resumen del ensayo: dice qué dispararía y con qué versión.
4. Repite con `ensayo` **desmarcada**. La flota dispara el `montaje` de
   `prueba1` con `semilla: true`, **espera a que termine** y, si salió bien, le
   entrega los flujos.

**2. Desde la propia tienda (lo que hace el comercio).**

`prueba1` › Actions › `montaje` › Run workflow, marcando **`semilla`** y
dejando `version` vacío. O, sin salir del navegador del comercio: panel ›
Tienda › *Versión de tu tienda* › **Actualizar ahora**; o el menú de la hoja ›
*Actualizar a la última versión*. Las tres cosas disparan exactamente el mismo
flujo. **Después, `tiendas` › `flota` › `flujos`** con `tienda` = `prueba1`: por
este camino nadie le entrega los flujos.

**Qué pasa por dentro, en los dos casos:**

1. `actualizar-semilla.mjs` clona la semilla, se planta en la etiqueta pedida y
   escribe en la tienda solo los archivos que `semilla.json` declara suyos
   (menos los flujos), y borra los `retirados`.
2. Si vino un `maestro.gs` nuevo, el flujo lo publica en Apps Script con
   `CLASPRC` y **espera a que la tienda conteste esa versión**. Sin `CLASPRC`,
   se detiene aquí.
3. Se rehornea todo desde la hoja: `<head>`, catálogo, respaldo, SEO, fotos.
4. Se corre la guardia sobre los archivos ya modificados: en una tienda,
   `tienda-viva.js`.
5. Si todo está verde, un solo commit a `main` y Cloudflare publica.
6. Si algo falló, **no se publica nada** y el maestro vuelve a su versión
   anterior.

**Comprobar después:**

- [ ] `prueba1` › Actions: el montaje en verde, y el cierre dice «La tienda
      queda publicada en …».
- [ ] El portal (hoja de administración › Panel › Abrir el portal): la columna
      Versión de `prueba1` dice la nueva.
- [ ] El panel de la tienda › *Revisión de tu tienda*: todo en orden.
- [ ] Los flujos de `prueba1` son los de la versión nueva (el resumen de la
      flota dice «y sus flujos: …» o «sus flujos ya estaban al día»).
- [ ] Si algo quedó mal: `prueba1` › Actions › `restaurar` › `la-version`,
      `hasta` vacío, `confirmar` = `RESTAURAR`.

---

## J · Tareas recurrentes del operador

| Cada | Qué | Cómo |
|---|---|---|
| Día | Mirar el portal: tiendas sin responder, pedidos por confirmar, errores | Hoja de administración › Panel › Abrir el portal |
| Día | Avisos de la corrida diaria de `fotos` («Hay cambios sin publicar») | Actions de cada tienda |
| Semana | Que el respaldo de cada tienda esté al día | Columna «Último respaldo» del portal |
| Semana | `ESTADO.md` de `tiendas` (lo escribe `flota` › `estado` los lunes): tiendas detrás de su semilla | `tiendas` › `ESTADO.md` |
| Por versión | Actualizar la flota al último release | `tiendas` › Actions › flota › `actualizar` (por anillos) |
| Por versión con `panel.gs` nuevo | Publicar el panel de la flota | `tiendas` › `panel` (hoy, a mano: ver I) |
| Mes | Revisar minutos de Actions y ejecuciones de Apps Script | `ARQUITECTURA.md` § presupuestos |
| Trimestre | **Simulacro de reversión** en una tienda de prueba | `restaurar` › `la-version`, y volver |
| Cuando caduque | Renovar `ALTA_TOKEN`, `FLOTA_TOKEN`, `SEMILLA_TOKEN`, `DISPARO_TOKEN` y los `CLASPRC`. `SEMILLA_TOKEN` y `DISPARO_TOKEN` llegan a cada tienda corriendo `conectar` otra vez | `DESPLIEGUE.md` › *Secretos, tokens y llaves* |
