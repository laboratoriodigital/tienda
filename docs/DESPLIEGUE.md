# Desplegar una tienda, de punta a punta

**Este documento es el mapa.** Dice todo lo que pasa desde que no existe nada
hasta que el comercio está vendiendo, en orden, y con quién hace cada cosa.

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

---

## El camino normal (0.18.0): `alta` y `conectar`

**Así se monta una tienda hoy.** Dos flujos de tres campos cada uno en
`laboratoriodigital/tiendas` › Actions hacen todo lo que es de GitHub; lo que
queda es lo de Google, que vive en la cuenta de cada tienda y no se puede
automatizar del otro lado. Los pasos numerados de más abajo son **el detalle de
lo que hacen**: sirven para entender y para cuando algo falla.

| Orden | Quién | Qué pasa |
|---|---|---|
| **1. alta** | tú: Actions › [alta](https://github.com/laboratoriodigital/tiendas/actions/workflows/alta.yml) › *Run workflow* — nombre corto, comercio, producto | Crea el repositorio clonando la **última versión publicada** de la semilla de ese producto, sin el catálogo, las fotos ni el dominio de otra tienda; le pone su `name` de Cloudflare, los permisos de Actions, las fusiones automáticas y `SEMILLA_TOKEN`; escribe su fila en `flota.json`. En el resumen deja la lista de lo que falta, con los datos de ESA tienda *(pasos 1 y 10 parciales)* |
| **2. Google** | tú, en una cuenta nueva del comercio | Hoja › pegar `maestro.gs` › pegar `HOJA_ID` › **`A0_instalar`** › **Implementar** › abrir la URL una vez › llenar la hoja › `A2_diagnosticoCompleto` para copiar *Servicio* y *Token* *(pasos 3 a 9)* |
| **3. conectar** | tú: Actions › [conectar](https://github.com/laboratoriodigital/tiendas/actions/workflows/conectar.yml) › *Run workflow* — nombre corto, Servicio, Token | Le pregunta al maestro su hoja y su proyecto; pone `MAESTRO_URL`, `MAESTRO_TOKEN`, `HOJA_ID` y `SCRIPT_ID`; le escribe a la hoja el comercio, la dirección y el repositorio sin pisar lo que el comercio ya puso; le siembra al maestro su `GITHUB_TOKEN`; **registra la tienda en la hoja de administración**; y dispara el primer montaje *(pasos 10 y 11)* |
| **4. el stub** | tú, en el editor del maestro **de esa tienda** | `A1_generarStub` y pegar lo que imprime en Extensiones › Apps Script de la hoja *(paso 12)* |
| **5. Cloudflare** | tú, **cuando ese montaje termine en verde** | Workers & Pages › Create › Import a repository. Al final a propósito: antes publicaría lo que todavía no es esta tienda *(paso 2)* |
| **a mano, solo** | tú | `CLASPRC`: la credencial de Google de la tienda, que nadie más puede crear *(paso 10)*. Es lo único que queda sin automatizar |

Tiempo: **el alta y conectar son dos minutos de reloj cada uno**; lo que cuesta
sigue siendo Google (la cuenta, la hoja y llenarla) y las fotos.

> **Para hacerlo con los dedos, paso a paso y con las comprobaciones de cada
> uno, está `RUNBOOK-TECNICO.md`.** Este documento es el mapa: dice qué pasa y
> por qué. Aquel es la lista de clics. Y lo que el producto sabe hacer, entero
> y por categorías, está en `FUNCIONALIDADES.md`.

> **⚠ Implementa DESPUÉS de pegar `HOJA_ID` y correr `A0_instalar`** (bitácora
> 74). La aplicación web corre la versión IMPLEMENTADA, no lo que ves en el
> editor: si pegas algo después, *Implementar › Gestionar implementaciones ›
> lápiz › Versión: Nueva versión*. Desde la 0.17.0 `A0_instalar` guarda
> `HOJA_ID` en las propiedades, que son de todas las versiones, así que basta
> con ejecutarlo. Si `conectar` dice «Falta HOJA_ID» con el diagnóstico
> funcionando, es esto y lo dice.

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
- **Actualizar**: la tienda se actualiza sola desde su panel, el menú de su hoja
  o la flota (`tiendas` › flota › actualizar), por anillos.
- **Volver atrás**: el flujo `restaurar` de cada tienda, y `A5_respaldos` /
  `A6_restaurarDatos` en su maestro. Ver *Volver atrás*, más abajo.

---

## De un vistazo

Lo de arriba, paso a paso. **Los marcados con ⚙ los hace `alta` o `conectar`**;
los demás son de Google, o del navegador.

```
   TÚ                          GITHUB / CLOUDFLARE           GOOGLE
   │
   ├─ 1. repositorio ⚙ ────────► lo clona `alta` de la última versión
   ├─ 2. Cloudflare ──────────► apunta a publicar/ (AL FINAL: ver el camino normal)
   ├─ 3. cuenta + hoja ───────────────────────────────────► hoja del comercio
   ├─ 4. pegar maestro.gs ────────────────────────────────► Apps Script
   ├─ 5. IMPLEMENTAR (1 vez) ─────────────────────────────► la URL /exec
   ├─ 6. abrir esa URL una vez ───────────────────────────► el maestro se sabe
   ├─ 7. A0_instalar() ───────────────────────────────────► pestañas y avisos
   ├─ 8. llenar la hoja (16 claves)
   ├─ 9. A2_diagnosticoCompleto() ─► servicio + token
   ├─ 10. los 5 secretos ⚙ ────► los pone `conectar` (menos CLASPRC)
   ├─ 11. flujo `montaje` ⚙ ───► lo dispara `conectar`
   ├─ 12. A1_generarStub() ───────────────────────────────► pegar en la hoja
   ├─ 13. fotos al Drive ─────────────────────────────────► «Publicar ahora»
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
- El repositorio de servicio `laboratoriodigital/tiendas`, con sus secretos:
  `ALTA_TOKEN`, `FLOTA_TOKEN`, `SEMILLA_TOKEN`, `DISPARO_TOKEN` y —para que la
  hoja de administración se llene sola— `PANEL_URL` y `PANEL_CLAVE`. **Esos
  secretos no se copian a ninguna otra parte.**
- La hoja **Panel de tiendas**: una hoja de cálculo tuya con `panel.gs` pegado
  en su Apps Script, `instalar` ejecutado, implementada como aplicación web
  (Ejecutar como: yo · Acceso: cualquiera) y su menú › *Clave para el alta*.
  Es el registro del negocio y el portal.
- El dominio en Cloudflare, si las tiendas van a tener subdominio propio.
- `npm i -g @google/clasp` y `clasp login` — **con la cuenta dueña de la tienda
  que vas a montar**, no con la tuya (es lo que produce `CLASPRC`).
- Habilitar la API de Apps Script una vez por cuenta:
  `script.google.com/home/usersettings`.

---

## 1 · El repositorio de la tienda  · GitHub · ~5 min

Desde la plantilla. Nombre `organico-<comercio>`. **Pública**: Actions es
gratis e ilimitado en repositorios públicos; en privados son 2.000 minutos al
mes para toda la cuenta, repartidos entre todas las tiendas.

> ⚙ **Esto lo hace `alta`**, incluidos el `name` de Cloudflare, los permisos de
> Actions y las fusiones automáticas: lo de abajo es lo que hace, por si hay que
> revisarlo o rehacerlo a mano. El flujo viejo, `tienda-nueva.yml`, se fue en la
> 0.17.0.

Y **la casilla que se olvida siempre**: Settings → Actions → General →
Workflow permissions → *Read and write permissions*. Sin ella `montaje` y
`fotos` corren enteros, funcionan, y fallan en la última línea al empujar a
`main` — GitHub lo dice en una anotación al pie de la corrida, que solo ve
quien sabe que está ahí. Los dos flujos lo dicen también en su propio resumen,
que es lo primero que se ve.

> Hasta el 18 de septiembre de 2026 aquí decía *Allow GitHub Actions to create
> and approve pull requests*, porque `montaje` publicaba abriendo un pull
> request y fusionándolo. Ya no: publica directo en `main`, y esa casilla dejó
> de hacer falta para el camino normal. Sigue haciendo falta si se dispara el
> flujo con **Cómo publicar lo que salga → con-pull-request**, o si `main` está
> protegida y el push cae al pull request de reserva.

> ⚙ **Esto también lo hace `alta`.** Queda escrito porque es el fallo más caro
> de la línea vieja, y porque hay tiendas montadas a mano.
>
> **⚠ Editar `wrangler.jsonc` antes del primer despliegue.** En el editor web
> de GitHub (el lápiz), cambiar `"name": "organico"` por
> `"name": "organico-<comercio>"` y hacer commit directo a `main`. **Dos
> tiendas con el mismo `name` son el mismo sitio en Cloudflare, y la segunda
> pisa a la primera** — y nada avisa: las dos siguen desplegando en verde.

## 2 · Cloudflare  · ~3 min

Conectar el repositorio. Rama de producción `main`, comando de compilación
**vacío**, directorio `publicar/`. Empujar a `main` despliega.

## 3 · La cuenta de Google y la hoja  · ~10 min

**Una cuenta de Google por tienda, creada por ti.** Con tu celular como
recuperación y la contraseña en tu gestor. El comercio es **editor** de la hoja
compartida, no dueño de la cuenta.

Crear la hoja de cálculo en esa cuenta. Copiar su ID de la URL, entre `/d/` y
`/edit`.

## 4 · El maestro  · ~5 min

Apps Script → **proyecto suelto** (no unido a la hoja). Pegar `maestro.gs`
entero y poner el `HOJA_ID` arriba.

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

**No.** Cuando el maestro cambia, `montaje` con la casilla `maestro` sube el
archivo **y actualiza la implementación que ya existe** (`update-deployment`),
sobre la misma URL. Y no lo da por hecho: al terminar le pregunta a la `/exec`
qué versión responde y **falla si no es la que acaba de publicar**. Si la
corrida sale verde, el despliegue está hecho — no hay que abrir Implementar.

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

Crea las nueve pestañas, los desplegables, los disparadores y los dos tokens.
Es idempotente: se puede repetir.

> Las funciones que se ejecutan a mano llevan prefijo `A0_`…`A4_` para que
> queden juntas al principio de la lista del editor, y numeradas **en el orden
> en que se necesitan**.

## 8 · Llenar la hoja · ~12 min

`A0_instalar()` (paso 7) crea nueve pestañas, siempre las mismas: `Configuración
· Catálogo · Envíos · Cupones · Validaciones · Pedidos · Más vendidos · Tablero
· Errores`.

> **No insertar columnas en medio de ninguna pestaña.** El maestro lee por
> posición fija (`getRange(fila, columna, …)`), no por el nombre del
> encabezado: una columna metida en medio corre todas las de la derecha un
> puesto y nada avisa. Agregar columnas **al final** es seguro.

Pestaña `Configuración`. **Dieciséis claves**, y el sistema sabe cuáles faltan.

**Cuatro rompen la venta** — sin ellas el flujo `montaje` se niega a publicar:

| | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | **el comprador termina el pedido y no tiene cómo pagar** |

**Doce dejan la tienda a medias** y avisan sin bloquear: `pago_titular`,
`pago_entidad`, `repositorio`, `correo_resumen`, `respaldo_carpeta`,
`sitio_titulo`, `sitio_descripcion` y los `empresa_*`.

> **Esto cambia en la 1.0.0** (decisión 09 de `DECISIONES.md`, hito M0). Los
> datos que identifican al vendedor —`empresa_razon`, `empresa_nit`,
> `empresa_direccion`, `empresa_ciudad` y al menos uno de `empresa_correo` /
> `empresa_tel`— pasan de avisar a **bloquear**: los textos legales se arman con
> ellos, y un texto de retracto sin responsable no obliga a nadie. Mientras
> tanto, llénalos igual.

> **`repositorio` vale el doble de lo que parece.** No solo le dice a «Publicar
> ahora» a quién disparar: es lo único con lo que un flujo puede comprobar que
> la hoja que está leyendo es la de **esta** tienda. Montando dos a la vez, los
> secretos de un repositorio pueden acabar apuntando a la hoja del otro
> comercio, y entonces **no falla nada**: el flujo corre en verde, las fotos
> bajan, Cloudflare despliega, y los cambios de un comercio salen en la tienda
> del otro. Con esta clave llena, el flujo se planta antes de escribir. Sin
> ella, avisa y sigue. Escríbela como `dueño/repositorio`.

Los `empresa_*` alimentan el texto de tratamiento de datos. **La tienda pide
nombre, celular y dirección: eso es tratamiento de datos personales y en
Colombia lo regula la Ley 1581 de 2012.**

## 9 · `A2_diagnosticoCompleto()` — los dos datos del panel

Imprime **Servicio** (la URL `/exec`) y **Token** (el de montaje). Son los dos
únicos datos que el panel no puede adivinar.

> Se ejecuta desde el editor **a propósito**: el Diagnóstico que abre el
> comerciante desde su menú **no** muestra el token de montaje.

## 10 · Los cinco secretos del repositorio

*Settings → Secrets and variables → Actions → New repository secret.*

**Son cinco y solo cinco.** Cualquier otro sobra, y sobrar aquí no es inocuo:
un secreto de más es una llave que nadie va a acordarse de rotar.

| Secreto | De dónde se saca, exactamente | Pinta que tiene | Si falta |
|---|---|---|---|
| `MAESTRO_URL` | Paso 9. `A2_diagnosticoCompleto()` en el editor del maestro → línea **Servicio**. También: *Implementar → Gestionar implementaciones → URL de la aplicación web* | `https://script.google.com/macros/s/AKfycb…/exec` | `fotos` y `montaje` se saltan solos y lo dicen en el resumen |
| `MAESTRO_TOKEN` | Paso 9, línea **Token** del mismo diagnóstico | `tk-…` | igual que el anterior |
| `SCRIPT_ID` | La URL del editor del maestro: lo que va entre `/projects/` y `/edit` | 57 caracteres | solo falla `montaje` con la casilla `maestro` |
| `HOJA_ID` | La URL de la hoja del comercio: lo que va entre `/d/` y `/edit` | `1AbC…XyZ` | el maestro sube **sin hoja** y sirve un inventario de respaldo, que es el fallo que no falla |
| `CLASPRC` | El **contenido entero** de `~/.clasprc.json` — el que `clasp login` escribe en tu **carpeta personal**, no en la del proyecto | `{"tokens":{"default":{…,"refresh_token":…}}}` | solo falla `montaje` con la casilla `maestro` |

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
> es cierto y no ayuda. El flujo ahora lo mira antes y lo dice; en tu equipo,
> `node montar/revisar-clasprc.mjs`.

### Las tres advertencias que cuestan una hora cada una

**`MAESTRO_URL` y `MAESTRO_TOKEN` son los únicos que no se pueden deducir.** Los
otros tres están a la vista en una URL o en un archivo; estos dos solo los sabe
el maestro, y el Diagnóstico del **menú del comerciante ya no muestra el
token**. Hay que correr `A2_diagnosticoCompleto()` **desde el editor**.

**`CLASPRC` es el único dato del producto que no sale de una pantalla de
Google.** Hay que correr `clasp login` una vez, en algún sitio con Node — y ese
sitio no tiene por qué ser tu equipo: `clasp login --no-localhost` imprime una
dirección, la autorizas en cualquier navegador y pegas de vuelta el código. Se
hace **una vez por tienda**. Sin él la tienda se abre igual: el maestro se pega
a mano en el editor. Lo que compra es que publicarlo sea un botón.

**`CLASPRC` caduca.** Es una sesión de Google, no una llave eterna. El día que
`montaje` con `maestro` falle en «clasp push» con un error de autenticación, no
está roto el flujo: hay que repetir `clasp login` con esa cuenta y volver a
pegar el archivo. Es el único de los cinco que se muere solo.

### Los tres que NO son secretos del repositorio

| | Dónde vive | Por qué ahí |
|---|---|---|
| `ALTA_TOKEN` | **Solo** en `laboratoriodigital/tiendas` | es el único token capaz de crear repositorios. En una tienda no pinta nada, y ponerlo ahí convierte cada tienda en una llave maestra |
| `GITHUB_TOKEN` de «Publicar ahora» | Script Properties del maestro de **esa** tienda | lo lee `publicarAhora()`. **Las Script Properties no están cifradas**: de grano fino, **uno por tienda**, limitado a ese repositorio, con `Actions: Read and write` y nada más, y **con vencimiento**. Se crea en *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens* |
| La llave de pago (`pago_llave`) | La pestaña `Configuración` de la hoja, y de ahí **a ninguna parte** | el filtro `pago_*` la borra antes de que salga por cualquier puerta. No va en la página ni en el repositorio: llega al comprador por la respuesta automática de WhatsApp (paso 14) |

### Y una fila en el panel de administración  · ~2 min

El panel es **tu** hoja, la que no se comparte con ningún cliente. Sin la fila,
la tienda funciona igual — y desaparece de todo lo que te avisa: no sale en el
correo de las 7, no cuenta para «Tiendas sin responder», y su respaldo semanal
no se vigila. Una tienda que no está en el panel es una tienda que nadie mira.

Pestaña **`Tiendas`**, una fila. Es el **único sitio del panel que se llena a
mano**: todo lo demás lo escribe el script y se sobrescribe en cada
actualización.

| Columna | Qué va | De dónde sale |
|---|---|---|
| `Estado` | `En montaje` hasta la entrega, después `Activa` | — |
| `Comercio` | El nombre, igual que en la hoja | `Configuración > negocio` |
| `Contacto` · `Celular` · `Correo` | Con quién se habla en ese comercio | — |
| `Plan` · `Precio mensual` · `Día de cobro` | Lo comercial. `Cortesía` y `0` mientras no se cobre | — |
| `Alta` | La fecha de hoy | — |
| `Sitio` | La URL pública de la tienda | `Configuración > sitio_url` |
| `Servicio (URL /exec)` | La puerta del maestro | **Paso 9**, línea *Servicio* del diagnóstico |
| `Token` | El token de esa tienda | **Paso 9**, línea *Token* |
| `Cuenta Google` | El correo de la cuenta dueña de esa tienda | La que creaste en el paso 3 |
| `Repositorio` | `dueño/repositorio` | El del paso 1 |
| `Notas` | Lo que haya que recordar | — |

Después: menú del panel → **`actualizar()`**. Si la fila está bien, la tienda
aparece con sus métricas en un par de segundos. Si no responde, ahí se ve — y
es mejor verlo ahora que en el correo del lunes.

> **El token vive en TRES sitios**: los secretos del repositorio, las
> propiedades del maestro, y esta columna. Es el que se olvida al rotarlo, y el
> panel lo dice cuando pasa: la columna de estado avisa de que el token de la
> pestaña `Tiendas` se quedó con el viejo.

## 11 · El primer montaje  · Actions · ~5 min de reloj

Actions → `montaje` → Run workflow, con cuatro campos. En un despliegue nuevo,
todos como vienen salvo dos:

| Campo | En este paso | Para qué está |
|---|---|---|
| `que` | `todo` — como viene | `solo-la-hoja` o `solo-las-fotos` sirven para una corrida parcial más adelante |
| `maestro` | **marcarlo** | Publica `maestro.gs` desde aquí. Pide los tres secretos de la sección anterior |
| `confirmar` | escribir `PUBLICAR` | Solo hace falta si marcaste `maestro`: es la confirmación de que sí |
| `aprobacion` | `automatica` — sin marcar lo contrario | El flujo publica directo en `main` cuando todo sale verde. `con-pull-request` deja un pull request abierto para mirarlo antes |
| `semilla` | sin marcar | **Actualizar la tienda** (0.14.0): trae la última versión publicada de su semilla, publica el maestro si cambió, corre TODAS las baterías y publica en `main`, o vuelve atrás solo. Es lo que disparan el panel, el menú y la flota. Con `version` se pide una en particular. Para traer también los flujos hace falta el secreto `SEMILLA_TOKEN` |
| `version` | vacío | Solo con `semilla`: qué versión traer (vacío = la última) |
| `sin_guardia` | sin marcar | Se salta el guardia del presupuesto de tiempo (`presupuesto.json`). Para una corrida que se sabe que va a tardar de más — un catálogo enorme la primera vez, por ejemplo — y no se quiere que falle por eso |

Hace, en este orden:

```
publica el maestro
le escribe el <head>, las cinco constantes y la paleta de ESTA hoja
trae las fotos del Drive
hornea publicar/catalogo.json desde ESTA hoja
le escribe el catálogo de respaldo y CONFIG_SEMILLA desde ese catálogo
corre todas las baterías SOBRE LOS ARCHIVOS YA MODIFICADOS
abre el pull request
```

> **De dónde salió el `publicar/index.html` sobre el que escribe, y por qué
> nadie lo copia.** Del repositorio, que nació **a partir de la plantilla**: una
> tienda nueva se crea con el botón de plantilla de GitHub y viene con la página
> dentro. Lo que llega ahí es el archivo de Orgánico — y deja de serlo en este
> mismo paso, porque los cinco renglones de arriba lo reescriben con lo que diga
> la hoja de este comercio.
>
> De ahí la regla que no se puede olvidar: **nada de la tienda se escribe a mano
> en `publicar/index.html`.** Todo lo suyo lo pone el montaje. El día que
> alguien meta ahí un valor a mano, el siguiente montaje lo borra sin decir nada.
>
> Poner al día una tienda YA creada cuando cambia la plantilla es otro problema
> —el 4.18 del roadmap— y hoy es manual. Ver `ACTUALIZAR-UNA-TIENDA.md`.

Revisar la vista previa de Cloudflare y fusionar.

> **Alternativa: desde tu equipo, sin Actions.** `npm run tienda` escribe
> `tienda.json` y `montar/.clasp.json` preguntándole al maestro sus propios
> datos. `npm run montar` hace, en tu equipo, las mismas cuatro cosas que hace
> el flujo — `npm run index` (el `<head>` y las cinco constantes), `npm run
> catalogo` (hornea `publicar/catalogo.json`), `npm run fotos:drive` (baja y
> convierte las fotos) y `npm run respaldo` (el catálogo de respaldo, al
> final, porque lee del catálogo que acaba de hornear el paso anterior).
> `npm run maestro` publica el Apps Script. Ninguno de los cuatro hace commit:
> eso lo cierras tú con rama, `git commit`, `git push` y pull request.

> **La primera corrida después de publicar el maestro es LENTA, y es normal.**
> Apps Script queda «frío» al actualizar una implementación: la primera
> petición a la `/exec` puede tardar cuarenta segundos o más. Las herramientas
> ya lo aguantan —esperan 90 s y reintentan— y el log dice cuánto tardó cada
> llamada. Si ves `· «bloques» contestó en 38 s`, no está roto: está
> arrancando.

## 12 · ⚠ `A1_generarStub()` — y el orden importa

**En el editor del MAESTRO DE ESA TIENDA** (no en el de la hoja, y no en el de
otra tienda: bitácora 76), seleccionar la función `A1_generarStub` → Ejecutar. Genera el stub a partir del maestro que está
**PUBLICADO**, no del que está en el repositorio: hacerlo antes del paso 11
devuelve el stub viejo y parece que la versión nueva no trae nada.

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
septiembre de 2026): lo imprimía entero al final de cada reinstalación, enterraba
el resumen y era la forma segura de pegar uno viejo. Ahora dice que se ejecute
esta función, y esta es la única que lo imprime.

**Renombrar ese proyecto con el nombre del comercio.** Es el nombre que Google
le muestra al comerciante en la pantalla de permisos la primera vez que toca el
menú. Sale de `negocio` en Configuración en el momento de generar el stub: si
todavía no lo has puesto, el menú aparece como «Tienda» — vuelve a generar el
stub cuando lo pongas y pégalo otra vez.

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
catálogo, mayúsculas incluidas. Formatos: JPG, PNG, WebP.

Después, menú de la hoja → **Publicar ahora**.

> Si el flujo dice «nada nuevo» y tú acabas de subir fotos, el resumen del paso
> trae ahora **cuántas ve el maestro en la carpeta** y **cuáles nombra la hoja
> sin tenerlas**. Casi siempre es la carpeta equivocada o el nombre que no
> coincide.

## 13b · La medición, si el comercio la quiere (0.19.0)

Opcional y apagada de fábrica. En `analytics.google.com`: crear la propiedad
del comercio › Administrar › **Flujos de datos** › Web › la dirección de la
tienda. Copiar el identificador `G-XXXXXXXXXX` y pegarlo en la clave
`analytics_id` de la pestaña Configuración. **Publicar** después: el
identificador se hornea en el `<head>` durante el montaje, no se lee en vivo.

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

1. **Diagnóstico** (menú de la hoja). Punto 2: *«las 16 claves del alta están
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
| **Actualizar a la última versión** | dispara `montaje` con la semilla: trae la versión nueva, prueba todo, publica o vuelve atrás (0.14.0; repegar el stub para verla) |

> **Si explicar esto toma más de 30 minutos, el hallazgo es de diseño, no del
> comerciante. Anótalo.**

**El panel** (M3) vive en `https://<su sitio>/admin.html`. Para
dejarlo listo en la entrega: en `Configuración › panel_usuario` el nombre con el
que va a entrar, y después menú › **Clave del panel** con el comerciante al
lado — la clave se enseña una sola vez y no queda escrita en ninguna parte, así
que la apunta él. El panel tiene tres pestañas: **Productos** (editar, subir
fotos y, si hay variantes, el stock de cada combinación), **Pedidos** (ver y cambiar el estado, con el mismo efecto sobre el
inventario que en la hoja) y **Tu tienda** (textos, colores, contacto, horario,
envío gratis, pedido mínimo y cerrar la tienda; las claves técnicas no salen).
Todo lo que se cambia queda en la pestaña **Registro** de la hoja. Entrégale
la guía de una página (`docs/manuales/Guia-de-una-pagina.html`), que ya
explica el panel. Arriba, la barra de **Publicar**. Lo que
se guarda en el panel queda en la hoja al instante, pero **la tienda lo muestra
al publicar**: eso hay que decírselo, porque el panel también lo dice y la
primera vez nadie lo lee.

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

## Después: qué corre solo y qué se opera

| Cuándo | Qué |
|---|---|
| cada 4 h | flujo `fotos`: hornea el catálogo y trae fotos nuevas |
| lunes 6:00 | flujo `montaje` completo |
| cada hora | tablero e inventario |
| domingos 2:00 | respaldo de la hoja |
| a diario, el comercio | precios y stock → **Publicar ahora**; pedidos → **Pagado** |
| cuando cambie el maestro | `ACTUALIZAR-UNA-TIENDA.md` |

**Por qué `fotos` fusiona sola y `montaje` no.** `montaje` puede reescribir el
`<head>`, la política de seguridad y `SCRIPT_URL`: si la configuración de la
hoja quedó mal, la tienda se cae, y por eso hay una persona en el medio. Una
foto no puede hacer eso — lo peor que pasa es que se vea una foto fea, y se
corrige subiendo otra. El flujo `fotos` además **comprueba** que el cambio no
salga de `publicar/fotos/` antes de fusionar; si algo más cambió, no fusiona y
deja el pull request esperando.

**Por qué `maestro` no está programado y pide escribir `PUBLICAR` a mano.**
Los demás flujos dejan un pull request: nada llega al cliente sin que alguien
diga que sí. `maestro` no — cuando termina, el backend nuevo ya está
atendiendo pedidos, sin vista previa ni vuelta atrás de un clic. Y
`MAESTRO_TOKEN` solo lee configuración y fotos; `CLASPRC` es una credencial de
Google con permiso sobre el Apps Script y el Drive de esa cuenta — cuanto
menos viva guardada en un servidor, mejor.

---

## Fallos comunes

| Qué ves | Qué es | Cómo se arregla |
|---|---|---|
| La tienda carga pero sin productos, o el menú dice *contestó una página web* | La implementación quedó en «Solo yo» | Implementar → Gestionar → lápiz → Acceso: **Cualquier persona**. Comprobar con `<URL>?a=version` en incógnito |
| El menú dice *Unexpected token '<'* | Un maestro viejo, de antes de que el stub supiera explicarlo | Publica el maestro nuevo y vuelve a pegar el stub |
| El menú falla pero **la tienda funciona bien** | El stub quedó con una URL fabricada a partir de la `/dev` | Abre la `/exec` una vez en el navegador, ejecuta `A1_generarStub()` y pega el stub nuevo |
| `A1_generarStub()` imprime `TODAVÍA_NO_SE_SABE_LA_URL` | El maestro aún no ha atendido ninguna petición | Abre la `/exec` una vez en el navegador (paso 6) y vuelve a generarlo |
| `montaje` falla en «Las fotos nuevas» con *Falta fotos_drive* | La clave está vacía en la hoja | Pega el enlace de la carpeta en `Configuración > fotos_drive` |
| `montaje` falla con *no está en la carpeta* | La foto está en el Drive pero fuera de la carpeta configurada | Muévela dentro |
| `montaje` falla con *La foto pesa 20 MB* | El tope son 8 MB | Pídele al comercio una versión más liviana |
| Un producto sale con su dibujo en vez de su foto | La hoja nombra una foto que no está en el Drive | `npm run fotos:drive` (o el resumen del flujo) avisa por nombre; súbela o corrige la columna Imágenes |
| `fotos` corrió pero no fusionó | Cambió algo fuera de `publicar/fotos/` | Está bien: revisa el pull request que dejó abierto |
| El panel dice *403, se acabaron las 60 peticiones por hora* | Sin token, GitHub limita por IP y Apps Script comparte las suyas | Pon un token de grano fino con `Actions: read-only`. Sube a 5.000/hora |
| Las pruebas fallan con *La versión sigue en X* | Tocaste algo desplegable sin subir `version` en `package.json` | Súbela y vuelve a empujar |
| El panel dice **NO RESPONDE** y en Versión sale *Falta HOJA_ID* | El maestro publicado se quedó sin `HOJA_ID` — la tienda se ve bien porque cae a su catálogo de respaldo, pero no lee la hoja ni registra pedidos | Pegar el `HOJA_ID` en el editor del maestro y publicar versión nueva (o `npm run maestro` con esa cuenta) |
| El panel dice **FALLÓ** en Último respaldo | La cuenta de la tienda no tiene permiso sobre `backup_tiendas` | Paso 13 |

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
reimplementa*. `npm run maestro` hace las dos cosas de una — sube el archivo y
publica la versión nueva sobre la misma implementación, nunca una nueva.

---

## Los tres sitios donde el orden cuesta una hora

1. **Implementar una vez, actualizar siempre.** Una implementación nueva estrena
   URL y deja la tienda muda.
2. **Abrir la `/exec` una vez** antes de pedir los datos del panel.
3. **Generar el stub DESPUÉS de publicar el maestro.** Antes devuelve el viejo, y
   parece que la versión nueva no trae nada.

## Los tres sitios donde se pueden cruzar dos tiendas

Con una tienda montada esto no existe. Con dos, es el fallo más caro de seguir,
porque **corre entero en verde**:

1. Los secretos `MAESTRO_URL` y `MAESTRO_TOKEN` de este repositorio →
   *Settings > Secrets and variables > Actions*.
2. La clave `repositorio` de la pestaña `Configuración` de la hoja.
3. **A qué repositorio está conectado el proyecto de Cloudflare** que sirve el
   sitio → *Workers & Pages > el proyecto > Settings > Build*.
4. **`SCRIPT_ID` y `CLASPRC` juntos.** Al montar la segunda tienda se copian
   los secretos de la primera y este se queda con el proyecto de aquella,
   mientras las credenciales ya son de la nueva cuenta. Google contesta
   **`The caller does not have permission`**, que dice que alguien no tiene
   permiso sin decir quién ni sobre qué — y lleva a revisar la API de Apps
   Script, que casi siempre estaba bien.

Los flujos comparan 1 contra 2 y se plantan si no coinciden. El 3 no lo puede
ver nadie desde aquí: se mira a mano. El 4 lo nombra el propio flujo: imprime
la cuenta y el proyecto antes de subir, y si falla lista los proyectos que esa
cuenta **sí** ve.

> **Para comprobar el 4 en un minuto:** abre
> `https://script.google.com/d/<SCRIPT_ID>/edit` con la cuenta de **esta**
> tienda y ninguna otra —una ventana de incógnito ayuda—. Si dice que no
> tienes acceso, el secreto apunta al maestro de otra.

## La revisión de la tienda (0.20.0)

El mismo informe de siempre, ahora en tres sitios: el menú de la hoja ›
*Diagnóstico*, el panel del comercio › Tienda › **Revisión de tu tienda**, y
`A2_diagnosticoCompleto()` en el editor del maestro —el único que enseña el
token de montaje—. Desde la 0.20.0 mira además: de dónde salió el `HOJA_ID`,
qué versión del stub está pegada en la hoja, si el maestro tiene su permiso de
GitHub, si la medición está bien escrita, y cuántas copias de la hoja hay para
volver atrás.

## Volver atrás (0.18.0)

Tres cosas se pueden perder, y cada una tiene su punto de restauración y su
puerta. Ninguna inventa infraestructura: git ya guarda el sitio y las
versiones, y Drive ya guarda las copias de la hoja.

| Se perdió | Dónde está el respaldo | Cómo se vuelve |
|---|---|---|
| **Los datos** (catálogo, configuración, envíos, cupones) | las copias semanales en la carpeta de respaldos del administrador (`respaldo_carpeta`, ocho copias) | en el editor del maestro: `A5_respaldos()` las lista y `A6_restaurarDatos('ultimo', 'Catálogo')` devuelve las pestañas que se le digan |
| **El sitio** (lo que se ve publicado) | cada commit de `main` que tocó `publicar/` | Actions › **restaurar** › `el-sitio` (vacío = el anterior). Publica un commit NUEVO encima; Cloudflare republica solo |
| **La versión** (el código y el maestro) | las etiquetas `vX.Y.Z` de la semilla | Actions › **restaurar** › `la-version` (vacío = la anterior a la de esta tienda). Se lo pide a `montaje`, que publica el maestro, rehornea y corre las baterías |

Las tres reglas que lo hacen seguro: **restaurar no borra** —el sitio vuelve en
un commit encima, nunca con `push --force`, así que restaurar también se
deshace—; **no se restaura lo que pasó** —Pedidos, Pagos, Datos de entrega,
Avísame y el Registro no están en la lista, porque traer la copia del domingo
un miércoles borraría las ventas del lunes—; y **antes de tocar nada se guarda
una copia**, que es lo que hace que restaurar mal también tenga vuelta.

El flujo `restaurar` viaja dentro de la semilla: cada tienda lo tiene en su
pestaña Actions y no pide ningún secreto nuevo. Después de restaurar datos hay
que **publicar** la tienda para que el sitio muestre lo restaurado.

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

**Cómo se publica el panel que hay que proteger.** Dos caminos, y el segundo
no depende de que nadie conecte nada: (1) Cloudflare › Workers & Pages ›
Create › Import a repository › `tiendas`, directorio `panel/`; o (2) poner
`CLOUDFLARE_API_TOKEN` (plantilla *Edit Cloudflare Workers*) y
`CLOUDFLARE_ACCOUNT_ID` en los secretos de `tiendas`: desde la 0.20.0, cada
`flota` › **estado** escribe el panel y lo publica. El resumen de la corrida
dice la dirección.

**Por qué no se enciende todavía.** Porque el portal se abre desde la hoja de
administración y esa hoja ya está protegida por la cuenta de Google del
operador. Access entra cuando el portal se sirva en una dirección propia
—roadmap 3.7—, y entonces protege también el panel estático que escribe el
flujo `estado` de `tiendas`.

**Lo que Access NO hace:** no protege la tienda del comercio (esa es pública, y
tiene que serlo), no cifra nada que no estuviera ya cifrado por HTTPS, y no
sustituye a la clave del panel del comerciante, que vive en su maestro.

## Y uno que solo aparece al rotar el token

`A3_rotarToken()` cambia el token de montaje. Hay que llevarlo a **TRES** sitios:
el secreto `MAESTRO_TOKEN`, **la pestaña `Tiendas` del panel** y el `tienda.json`
local. Si se olvida el del panel, el panel marca esa tienda como caída y le vacía
las métricas — y la tienda está perfecta.

---

## Dominio propio (0.11.0 · 4.5)

La tienda de pruebas vive en **`tienda.laboratorio-digital.com`**. El dominio es
el único costo en efectivo del producto, y alcanza para todas las tiendas como
subdominios (`panaderia.laboratorio-digital.com`, …).

**Lo que hace el código.** `montar/nombrar-worker.mjs` lee `sitio_url` del
catálogo horneado y, si es un dominio propio (no `*.workers.dev`), escribe en
`wrangler.jsonc` la ruta como *custom domain*. Al desplegar, Cloudflare crea el
registro DNS y el certificado solo. La dirección de `workers.dev` sigue viva;
la canónica —SEO, Bold, rastreo, sitemap— es la de la hoja.

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
4. Correr **montaje**: el paso «El nombre del Worker» escribe la ruta, y el
   despliegue de Cloudflare la activa.
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
