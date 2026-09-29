# Arquitectura y modelo de despliegue

> La migración a la arquitectura v3 —multi-tenant, GitHub Actions, panel de
> administración— terminó en la 3.0.0: es la que describe todo este archivo.
> `ADOPCION.md` y `PLAN.md`, que documentaban esa migración en marcha, se
> borraron al cerrarse. Los cambios puntuales con su condición de disparo
> siguen en `DECISIONES.md`.

Este archivo responde una sola pregunta: **qué vive dónde, de quién es la
cuenta, y por qué**. Es el que hay que leer antes de montar la tienda número
dos, y el que explica decisiones que en seis meses van a parecer arbitrarias.

---

## 1. El reparto

| Pieza | Dónde vive | De quién es la cuenta | Por qué ahí |
|---|---|---|---|
| Hoja de cálculo | Google Sheets | Una cuenta de Google **por tienda**, creada y administrada por nosotros | Es la base de datos, el CMS y el tablero. La cuenta es por tienda para que cada una gaste sus propios límites gratuitos |
| Maestro (`maestro.gs`) | Apps Script suelto | La misma cuenta de esa tienda | Fuera de la hoja: al compartirla, el cliente no lo ve |
| Stub | Apps Script dentro de la hoja | La misma | 46 líneas sin una sola regla de negocio. Existe solo porque un menú necesita un `onOpen` |
| Fotos originales | Drive | La misma | Capa 1. Pesadas, nunca se publican |
| Fotos publicadas | `publicar/fotos/` en Git | Nuestra | Capa 2. Generadas con `preparar-fotos.mjs` |
| Sitio | Cloudflare Workers | **Una sola cuenta nuestra** | 100 Workers gratis por cuenta, y los archivos estáticos no gastan cuota |
| Repositorio | GitHub | Nuestra | Uno por tienda, más el de la plantilla |
| Panel (`panel.gs`) | Sheets + Apps Script | Nuestra cuenta personal | Administra el negocio, no una tienda |

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

Y la cuarta es la que manda. La tienda está publicada "ejecutar como: yo", así
que *cada visitante que carga el catálogo* corre una ejecución bajo la cuenta
dueña del maestro. Con una cuenta por tienda, ese techo de 30 es de esa tienda
sola y no lo alcanza jamás. Con todas las tiendas colgadas de una sola cuenta
—pagada o no—, treinta visitantes simultáneos **repartidos entre todos los
clientes** empiezan a chocar entre sí, y el síntoma que ve el comprador es una
tienda que no carga, en un negocio que no tuvo nada que ver.

Hay un segundo argumento, menos técnico y más incómodo: una sola cuenta es un
solo punto de falla. Si Google la suspende —y suspende cuentas por motivos que
no siempre explica—, se caen todas las tiendas a la vez.

**Decisión:** una cuenta de Google por tienda, gratuita. Se revisa si el costo
de administrar cuentas supera el beneficio; el número donde eso pasa hay que
medirlo, no adivinarlo.

**Lo contrario en Cloudflare.** Ahí el límite que importaría —100.000 pedidos
al día— *no aplica*, porque `wrangler.jsonc` no declara `main`: no hay Worker,
solo archivos estáticos, y esos son gratis e ilimitados. Lo que sí es finito
son 100 Workers por cuenta. Repartir Cloudflare en cuentas no compraría nada y
costaría cien tableros que mirar.

---

## 4. El panel pregunta, no entra

Como cada tienda vive en su cuenta, desde el panel **no se puede abrir la hoja
de un cliente**. Compartirlas todas con una cuenta administradora
reconstruiría justo el acoplamiento que evitamos.

En vez de eso, cada maestro publica un resumen de su tienda por la puerta
`?a=panel&t=TOKEN`, y el panel lo pregunta. Lo que cruza son **cifras
agregadas** —ventas del mes, pedidos por confirmar, productos agotados,
versión del código—, nunca un pedido ni el dato de un comprador. Si mañana una
tienda se va, se borra su fila y no queda nada suyo en nuestro lado.

Las consultas van con `fetchAll`, todas a la vez. En serie, veinte tiendas a
dos segundos son cuarenta segundos de ejecución contra un corte de seis
minutos; en paralelo son dos segundos y el presupuesto diario deja de ser el
techo del negocio.

### La columna «Sin terminar»

El diagnóstico distingue dos preguntas que antes se contestaban como una sola:
¿la tienda **funciona**? y ¿la tienda **está terminada**? Al escribir el
`index.html` solo se comprobaban las cinco constantes; las otras once claves de
Configuración no las miraba nadie, y una tienda podía salir al aire sin llave
de pago —el comprador termina el pedido y no tiene cómo pagar— sin que se
notara hasta que un cliente se quejaba.

Hoy son dos niveles (el detalle de cuáles bloquean y cuáles avisan está en
`DESPLIEGUE.md` paso 8): lo que **bloquea** hace que el montaje se niegue a
escribir el index; lo que **avisa** deja la tienda vendiendo pero a medias, y
sale en el registro y en el panel sin detener nada. La fila de cada tienda en
el panel lleva una columna **Sin terminar**, junto al nombre del comercio —no
al final, porque si una tienda no puede vender el resto de su fila da igual—:
en blanco si está completa, `NO PUEDE VENDER: <clave>` si falta algo que
bloquea, o `faltan N: <claves>` si solo avisa. Por esa columna **viajan las
claves que faltan, nunca los valores**: mandar valores mandaría la llave de
pago de cada comercio a una hoja donde no pinta nada.

---

## 5. La tienda no depende de nadie en tiempo de ejecución

`index.html` es un archivo que se basta solo. Su política de seguridad no
autoriza **ningún** origen de código externo.

Eso descarta, a propósito, servir la tienda desde una librería publicada en un
registro de paquetes y cargada con `<script src>`: la caída de ese registro
apagaría todas las tiendas a la vez, y quien controle ese paquete podría
inyectar código en el carrito de todos los clientes.

Lo que sí se comparte es **en tiempo de construcción**. La plantilla publica
versiones con nombre y cada tienda las consume al desplegar, no al cargar:

```
https://github.com/laboratoriodigital/organico/releases/latest/download/index.html
```

Un release de GitHub alcanza y se descarga sin credenciales. GitHub Packages
exigiría autenticación incluso para paquetes públicos, que es fricción sin
contrapartida.

**Cómo llega un cambio a todos:** se corta una versión en la plantilla; el
repositorio de cada tienda tiene un flujo que baja la última, le vuelve a
inyectar su bloque `<head>` y su `SCRIPT_URL`, y **abre un pull request**.
Nadie se mueve hasta que una persona lo aprueba. Ninguna tienda se actualiza
sola, y actualizar veinte es aprobar veinte pull requests, no editar veinte
archivos.

---

## 6. Las fotos, en tres capas

| Capa | Qué es | Dónde |
|---|---|---|
| 1 · Archivo maestro | El original pesado, tal como lo tomó el comercio | Drive de la tienda |
| 2 · Origen servible | Las versiones que se muestran (WebP en tres tamaños + JPG de respaldo) | `publicar/fotos/`, servidas por Cloudflare |
| 3 · Transformación | Un proveedor que recorta y convierte al vuelo, si se usa | Cloudinary · ImageKit · Cloudflare Images |

En la hoja se escribe **solo el nombre**: `chonto-1.jpg|chonto-2.jpg`. La
tienda arma la URL.

Los tres proveedores de la capa 3 están **autorizados de antemano** en la
política de seguridad y en `FOTOS_HOSTS`. Cambiar de proveedor es cambiar la
celda `fotos_cdn` y nada más: no hay que regenerar el `<head>` ni republicar.
El costo es acotado y consciente: son orígenes de *imagen*, no de código.

Si la hoja pide un proveedor que no está autorizado, las fotos **no** quedan en
blanco: se sirven directo del origen y se avisa por consola con el paso exacto
para arreglarlo.

El cable entre la capa 1 y la 2 lo cierra el flujo `fotos`, que mira el Drive
del comercio cada cuatro horas y publica lo nuevo **sin pedirle aprobación a
nadie**. Es la única automatización que se fusiona sola, y la razón es una
diferencia de daño, no de comodidad: la configuración de la hoja puede
reescribir la política de seguridad y dejar la tienda caída; una foto solo
puede verse fea. Además, subir fotos es una acción del comercio, y hacerlo
esperar seis días por algo suyo no tiene defensa.

Y no se confía en esa promesa: antes de fusionar, el flujo comprueba que el
cambio no toque un solo archivo fuera de `publicar/fotos/`. Si lo toca, deja un
pull request abierto.

---

## 6b. Lo único que sigue viviendo dentro de la hoja

El stub, 46 líneas, y existe **solo para dibujar el menú**. Todo lo demás que
la hoja necesita ya lo hace el maestro desde afuera con disparadores
instalables —`alEditar`, `recalcularResumen`, `respaldoSemanal`—, que corren
con nuestra autorización y por eso sí pueden usar `UrlFetchApp` y `MailApp`.
Un disparador simple no podría: [no puede llamar a servicios que pidan
autorización](https://developers.google.com/apps-script/guides/triggers).

Queda una pregunta abierta que decidiría si el stub sobra: un disparador
instalable de apertura, creado por la cuenta de la tienda, ¿le dibuja el menú
al comerciante cuando **él** abre la hoja compartida? Lo documentado es que
[corre bajo la cuenta de quien lo creó](https://developers.google.com/apps-script/guides/triggers/installable);
lo que no dice ninguna parte es si la interfaz que pinta la ve el otro.

**Medido y cerrado el 6 de septiembre de 2026.** El resultado tiene dos
mitades y la segunda es la que manda:

1. El menú **sí aparece**. Un disparador instalable de apertura le dibuja
   interfaz a otro usuario. La documentación de Google no lo dice en ninguna
   parte, y era razonable esperar lo contrario.
2. Pero **tocar una opción falla**, con `PERMISSION_DENIED` al leer del
   almacenamiento.

El mecanismo, que es lo que vale la pena recordar: un disparador instalable
corre bajo la cuenta de quien lo creó, sí, pero eso vale para el *manejador de
apertura*. Cuando el comerciante hace clic en una opción, esa función se
invoca **bajo su cuenta, dentro de nuestro proyecto** — que no es suyo y no
puede leer.

Por eso los disparadores que nadie toca (`alEditar`, los de tiempo) funcionan
perfecto desde afuera, y un menú no. **La frontera no es la autorización: es de
quién es el proyecto donde vive la función que se ejecuta.**

Así que el stub se queda, y ahora se sabe exactamente por qué: sus opciones
llaman a funciones que viven en la hoja del comerciante —que sí es suya—, y
esas funciones piden por HTTP. El precio son 46 líneas sin una sola regla de
negocio y una autorización que el comerciante da una vez.

El experimento se retiró del maestro; solo queda `quitarMenuDePrueba()` para
desmontarlo donde se llegó a instalar. Con eso el maestro vuelve a no tocar la
interfaz nunca, que es lo que le permite correr desde un disparador.

Y hay una consecuencia que el técnico tiene que saber: como el stub llama a
`UrlFetchApp`, **el comerciante tiene que autorizarlo una vez**, con su propia
cuenta, la primera vez que usa el menú. Google le muestra la pantalla de
aplicación no verificada. Es normal, es una sola vez, y el paso 6 del
despliegue explica qué decirle.

## 6c. Lo mismo, corriendo en dos sitios

Las herramientas de `montar/` son las mismas en tu equipo y en GitHub. Lo que
cambia es de dónde salen los dos datos de la tienda y quién cierra el ciclo:

| | En tu equipo | En GitHub Actions |
|---|---|---|
| Cómo se invoca | `npm run index` | `node montar/preparar-index.mjs` |
| De dónde sale la URL y el token | `tienda.json` | Los secretos del repositorio |
| Quién hace el commit | **Tú** | El flujo |
| Quién aprueba | Tú, en el pull request | Tú, salvo en `fotos` |

Los `npm run …` son atajos de `package.json` para escribir menos. Los flujos
llaman a `node` directamente porque no ganan nada con el atajo y así se ve en
el registro qué archivo corrió.

Y la diferencia que más confunde: **lo local escribe archivos y nada más.** El
commit, el pull request y la fusión ocurren solo cuando el flujo corre en
GitHub. Correr `npm run montar` y esperar un despliegue es esperar un paso que
nadie dio.

## 6d. Credenciales: todas, dónde nacen, qué permiten y cómo se renuevan

Esta sección es normativa y exhaustiva: **si una credencial no está aquí, no
existe**. Una batería lo comprueba (`montaje.js`): cada `secrets.X` de
cualquier flujo y cada propiedad que el maestro o el panel leen o escriben
tiene que aparecer nombrada en esta tabla.

### Los secretos del repositorio de servicio (`laboratoriodigital/tiendas`)

Ese repositorio es **privado** y es el único con poder sobre los demás. Ninguno
de estos secretos se copia a una tienda.

| Secreto | Qué es | Quién lo usa | Qué permite | Dónde se crea | Cómo se renueva |
|---|---|---|---|---|---|
| `ALTA_TOKEN` | Token de GitHub de grano fino, del dueño de las tiendas, sobre **todos** sus repositorios | `alta` (crear el repositorio, subirle la semilla, permisos, fusiones) y `conectar` (escribir los secretos de la tienda y disparar su montaje) | *Administration*, *Secrets*, *Contents*, *Workflows* y *Actions* en escritura | GitHub › Settings › Developer settings › Fine-grained tokens | Vence: se crea otro con los mismos permisos y se pega en Settings › Secrets › Actions de `tiendas`. Nada más lo usa |
| `FLOTA_TOKEN` | Token de grano fino sobre los repositorios de la flota | `flota` (estado y actualizar) | *Contents*, *Pull requests*, *Workflows*, *Actions* en escritura: abrir ramas, abrir y fusionar pull requests, disparar y esperar montajes | Igual que el anterior | Igual. Si falta, `flota` solo puede mirar lo público |
| `SEMILLA_TOKEN` | Token de grano fino: la semilla en lectura, las tiendas con *Contents* y *Workflows* en escritura | Lo **copia** `alta` a cada tienda Panel; lo usan `montaje` (traer la versión nueva y poder empujar flujos) y `restaurar` (leer las etiquetas de la semilla) | Que una tienda se actualice sola, incluidos sus `.github/workflows` —que el `GITHUB_TOKEN` de Actions no puede escribir nunca— | Igual | Se renueva en `tiendas` **y** en cada tienda que ya lo tenga: `alta` solo lo copia al nacer |
| `DISPARO_TOKEN` | Token de grano fino **sobre TODOS los repositorios del dueño** (no «Only select repositories»: el alta crea tiendas nuevas y una lista fija envejece con cada una), **solo** *Actions: Read and write* | `conectar`, para sembrárselo al maestro como su `GITHUB_TOKEN` | Lo más que permite es disparar flujos de las tiendas: es el que hace que Publicar y Actualizar funcionen desde el panel del comercio | Igual | Se cambia en `tiendas` y se vuelve a sembrar corriendo `conectar` con `forzar` |
| `PANEL_URL` | No es una credencial: la URL `/exec` de la aplicación web de la hoja **Panel de tiendas** | `conectar`, para registrar la tienda en esa hoja | Escribir una fila en la pestaña Tiendas, nada más | Al implementar esa hoja como aplicación web | Cambia solo si se crea una implementación nueva |
| `PANEL_CLAVE` | La clave de escritura de esa hoja (`alta-…`) | `conectar`, en el cuerpo del POST | Que la puerta `registrar_tienda` acepte la fila | Menú de esa hoja › *Clave para el alta* (se guarda como `CLAVE_ALTA` en sus propiedades) | Se genera otra desde el mismo menú: la anterior deja de servir en el acto |

### Los secretos del repositorio de cada tienda

| Secreto | Qué es | Quién lo usa | Qué permite | Dónde se crea | Cómo se renueva |
|---|---|---|---|---|---|
| `MAESTRO_URL` | La URL `/exec` de la aplicación web del maestro de esa tienda | `montaje`, `fotos` | Hablarle al maestro | Apps Script › Implementar › Aplicación web | Solo cambia si se crea una implementación nueva. Lo escribe `conectar` |
| `MAESTRO_TOKEN` | El **token de montaje** de esa tienda (`tk-…`) | `montaje`, `fotos` | Abrir las puertas `bloques`, `sembrar`, `fotos`, `foto`, `panel`, `identidad`, `permiso`: leer la configuración, listar y bajar de la carpeta de fotos, leer cifras agregadas y escribir en la hoja lo que el alta ya sabe | Lo inventa `A0_instalar` y lo guarda en la propiedad `TOKEN` | `A3_rotarToken()` y llevarlo a **tres** sitios: este secreto, la pestaña Tiendas del panel y el `tienda.json` local |
| `HOJA_ID` | El identificador de la hoja | `montaje`, solo al publicar el maestro | Que el `maestro.gs` que se sube lleve su hoja dentro | De la URL de la hoja | No caduca |
| `SCRIPT_ID` | El identificador del proyecto de Apps Script | `montaje`, solo al publicar el maestro | Decirle a `clasp` qué proyecto actualizar | De la URL del proyecto | No caduca |
| `CLASPRC` | El contenido de `~/.clasprc.json` tras `clasp login` **con la cuenta de esa tienda** | `montaje`, solo con la casilla `maestro` y la palabra `PUBLICAR` | Publicar el Apps Script de esa cuenta y tocar su Drive. **Es la credencial más poderosa de una tienda** | `clasp login --no-localhost` con esa cuenta | Caduca: se repite `clasp login` y se pega de nuevo. Es el único paso que nadie puede automatizar hoy (roadmap 3.11) |
| `SEMILLA_TOKEN` | El mismo de arriba, copiado por `alta` | `montaje`, `restaurar` | Traer la versión nueva de la semilla, incluidos los flujos | — | Ver arriba |

### Las propiedades del script del maestro (una tienda)

Las propiedades de un proyecto de Apps Script **no están cifradas**: quien
pueda editar ese proyecto las lee en texto plano. Eso está asumido en el
diseño, y por eso ahí solo vive lo que no puede vivir en la hoja —que se
comparte con el comercio— ni en el repositorio —que puede ser público—.

| Propiedad | Qué guarda | Quién la escribe | Para qué |
|---|---|---|---|
| `TOKEN` | El token de montaje (`tk-…`) | `A0_instalar` la primera vez | El secreto del repositorio y del panel |
| `TOKEN_MENU` | El token del stub (`tk-…`, **otro**) | `A0_instalar` / `A1_generarStub` | Solo abre `?a=menu`. Está a la vista en la hoja del comercio, y por eso no abre nada más |
| `HOJA_ID` | El identificador de la hoja | `A0_instalar` (0.17.0) | Que la aplicación web funcione aunque su versión implementada sea anterior a pegar la constante (bitácora 74) |
| `URL_EXEC` | La URL `/exec` aprendida al abrirla una vez | El propio maestro | Poder decirle a la tienda y al stub dónde vive |
| `GITHUB_TOKEN` | El token que dispara flujos de esa tienda | `conectar` (puerta `permiso`), o a mano | Publicar y Actualizar desde el panel y el menú. Desde la 0.20.2, si el guardado ya no abre el repositorio de la tienda, `conectar` lo reemplaza sin pedir nada (bitácora 89) |
| `PANEL_CLAVE` | La clave del panel del comerciante, como **huella con sal** (`sal$sha256`) | El menú de la hoja › *Clave del panel*, o el propio comercio al recuperarla | Entrar al panel. La clave en claro no se guarda en ningún sitio |
| `PANEL_FIRMA` | La llave con la que se firman los testigos de sesión | El maestro, sola | Que un testigo robado de otra tienda no sirva aquí |
| `PANEL_COLABORADOR` | `{u, clave}` del colaborador (misma huella con sal) | El dueño desde el panel | El segundo usuario, con menos permisos |
| `PANEL_INTENTOS` | Los intentos fallidos de entrada, por usuario | El maestro | El límite que protege la puerta `entrar` |
| `PANEL_RECUPERACION` · `PANEL_RECUPERACION_ENVIOS` | El código de recuperación y cuántos se mandaron | El maestro | «¿Olvidaste tu clave?» sin pasar por el operador |
| `BOLD_IDENTIDAD_SANDBOX` · `BOLD_SECRETA_SANDBOX` · `BOLD_IDENTIDAD_PRODUCCION` · `BOLD_SECRETA_PRODUCCION` | Las llaves de la pasarela de pago | A mano, el operador | Cobrar en línea. **Nunca** viajan a la página: la firma se calcula en el maestro. Se aceptan los alias `BOLD_BOTON_*` y el sufijo `PRUEBAS` |
| `RESPALDO` · `RESTAURACION` | Qué pasó en la última copia y en la última restauración | El maestro | Que el panel pueda decir «último respaldo: hace 3 días» |
| `STUB_VISTO` · `STUB_CON_TOKEN_VIEJO` | Qué versión del stub está pegada en la hoja, y si todavía usa el token viejo | La puerta `menu`, en cada petición | Saber en qué hojas falta repegar el stub sin abrirlas una por una |
| `LECTURAS` · `RESCATES` · `PEDIDA_PUBLICACION` · `ULTIMA_EDICION` | Contadores y marcas de operación | El maestro | Cuota, pedidos rescatados, publicar pendiente, última edición de la hoja |

### Las propiedades del panel de tiendas

| Propiedad | Qué guarda | Quién la escribe | Para qué |
|---|---|---|---|
| `CLAVE_ALTA` | La clave que `conectar` tiene que traer para registrar una tienda | Menú › *Clave para el alta* | La puerta `registrar_tienda` de esa hoja |
| `CORREO` | A quién le llega el resumen de la flota | `instalar` (vacío) y el operador | El correo diario |
| `GITHUB_TOKEN` | Token de grano fino con *Actions: solo lectura* | El operador | Leer las ejecuciones de Actions de todas las tiendas |
| `REPO_FLOTA` | `dueño/nombre` del repositorio de servicio, si no se llama `tiendas` | El operador, opcional | Los enlaces del portal |

### Lo que NO es secreto, a propósito

Los repositorios de las tiendas son **públicos**, y eso es una decisión, no un
descuido: Actions es gratis e ilimitado en repositorios públicos, y ahí no hay
nada que ocultar —el catálogo publicado es público por definición y el maestro
que se sube lleva su `HOJA_ID`, que sin credenciales de esa cuenta no abre
nada—. La mejor forma de proteger un secreto es no tenerlo.

Con un matiz que se aprendió probando: la API de GitHub deja leer un
repositorio público **sin autenticarse**, pero da 60 peticiones por hora **por
dirección IP**, y Apps Script sale por direcciones que comparte con todos los
scripts del mundo. Ese cupo está agotado casi siempre, así que el panel usa su
token de solo lectura, que sube el cupo a 5.000 por hora.

Si algún día una tienda vive en un repositorio privado, el token tiene que ser
**de grano fino** (`github_pat_…`), limitado a esos repositorios, con permiso
de **Actions: solo lectura** y con fecha de vencimiento. Un token clásico
(`ghp_…`) con alcance `repo` da lectura **y escritura** sobre todos los
repositorios de la cuenta; el diagnóstico del panel lo señala si aparece uno.

## 6e. Tres códigos, tres numeraciones

Es la confusión más fácil de tener, así que conviene tenerla escrita:

| Código | Constante | Qué numera | Con qué compara |
|---|---|---|---|
| `maestro.gs` | `VERSION` | El contrato con la tienda | Tiene que ser **igual** a `SCRIPT_VERSION` |
| `publicar/index.html` | `SCRIPT_VERSION` | Lo que la tienda espera del maestro | Tiene que ser **igual** a `VERSION` |
| `panel.gs` | `VERSION_PANEL` | El archivo de gestión | **Con nada.** Es otro programa |

Las dos primeras se mantienen iguales solas: `npm run index` copia `VERSION`
desde el maestro. La tercera es independiente y no tiene por qué parecerse.

`npm run maestro` imprime `VERSION`, y donde eso se comprueba es en el menú
de la hoja de la tienda —que se llama como el comercio—, no en el menú
**Panel**. Los dos menús
tenían una opción llamada Diagnóstico que decía "Versión de este código", y eso
invitaba a comparar peras con manzanas. Ahora cada uno dice de qué es su
versión, y el diagnóstico del panel lista además qué versión del maestro corre
cada tienda — que es la pregunta que uno quería hacer.

Y hay una cuarta numeración que no es de código: `version` en `package.json`,
que es la del producto y la que exige el flujo de pruebas cuando un pull
request toca algo desplegable.

## 7. Lo que cuesta operar una tienda

| | |
|---|---|
| Google (cuenta, hoja, Apps Script, Drive) | $0 |
| Cloudflare (sitio, ancho de banda) | $0 |
| GitHub (repositorio, Actions, releases) | $0 |
| Dominio propio | Opcional. Un dominio nuestro alcanza para todas como subdominios |
| **Total en efectivo** | **$0/mes** |

Lo único que cuesta es tiempo de montaje, y ese es el número que hay que medir
—con cronómetro, montando una tienda de verdad— antes de ponerle precio al
servicio.

---

## 8. Idempotencia y concurrencia

Cinco mecanismos, cada uno por un bug real de producción, no por precaución
teórica:

| Mecanismo | Problema que resuelve |
|---|---|
| Número de pedido estable | Se calcula una vez por carrito y solo se reinicia cuando el carrito queda vacío. Antes se generaba en cada envío y un doble toque creaba dos pedidos |
| Deduplicación en el servidor | `registrar` ignora un número de pedido ya grabado. Tres envíos del mismo pedido dejan una sola entrada |
| `LockService` + upsert por número | `Validaciones` se escribe leyendo-y-escribiendo bajo candado. Sin él, dos validaciones simultáneas creaban dos filas con códigos distintos |
| Columna `Inventario` | Marca cada línea como *Descontado* o *Devuelto*. Hace que confirmar, anular y volver a confirmar no descuadre el stock, y que la rutina se pueda correr mil veces sin efecto |
| Congelado tras el envío | Una fila de `Validaciones` cuyo pedido ya se registró no se puede reescribir |

El inventario **no** se descuenta al enviar el pedido, a propósito: un pedido
abierto en WhatsApp no es una venta, y si descontara ahí, cualquiera podría
dejar el inventario en cero abriendo pedidos que nunca paga.

## 9. Seguridad

El modelo de amenaza parte de un hecho: **todo lo que está en el navegador es
del atacante.** El HTML se lee, el JavaScript se edita, la consola está
abierta.

| Riesgo | Mitigación |
|---|---|
| Alterar el total desde la consola | El servidor recalcula todo con los precios de la hoja. La tienda nunca es la autoridad sobre el precio. Además `Object.freeze` sobre catálogo, cupones y envíos |
| Inventar o reutilizar un cupón | Los cupones viven solo en la hoja, con vigencia, mínimo y tope de usos |
| Clonar el sitio y cambiar la llave de pago | Los datos de pago no están en la página. Se entregan por respuesta automática de WhatsApp, que además advierte al cliente que no transfiera si ve otra llave. Eso hace inútil una copia |
| Inyección de fórmulas en Sheets | `celdaSegura()` antepone un apóstrofo a todo valor que empiece por `=`, `+`, `-`, `@` o un carácter de control, y recorta a 60 caracteres |
| XSS y carga de recursos ajenos | CSP en la etiqueta `meta` y en `_headers`: `default-src 'none'`, con lista explícita para estilos, tipografías, imágenes y `connect-src`. `frame-ancestors` solo funciona en cabecera, por eso existe `_headers` |
| Payloads absurdos al backend | Tope de 30 ítems, cantidad máxima 200, total máximo 5.000.000, IDs que no estén en el catálogo se descartan, duplicados se colapsan y el `Estado` nunca lo decide quien envía |
| Datos personales | La hoja **sí** guarda nombre, celular y dirección — es tratamiento de datos personales y en Colombia lo regula la Ley 1581 de 2012, con el aviso que arman las claves `empresa_*` de Configuración. No hay CRM ni historial cruzado entre tiendas: cada hoja es de un solo comercio, con un solo editor |

> **Lo que este diseño NO puede impedir.** `wa.me` solo rellena la caja de
> texto: **el cliente puede editar el mensaje antes de enviarlo.** Por eso el
> mensaje es lo que el cliente decidió escribir, no un documento con validez.
> El código de verificación permite cruzar contra la fila de `Validaciones`,
> pero el punto de control final es el dueño revisando el total antes de
> despachar — es el paso "Antes de despachar, siempre" de `GUIA-COMERCIANTE.md`.

## 10. Límites nativos de Google

Números que no dependen de Cloudflare, Drive ni de ningún proveedor de fotos:
son cuotas del lado de Apps Script y Sheets, y las únicas que no cambian con
cada rediseño del frontend.

| Recurso | Tope | Qué significa aquí |
|---|---|---|
| Google Sheets | 10 millones de celdas | Muy por encima del tope que impone el propio script |
| Filas de `Pedidos` | 20.000 (`MAX_FILAS`) | Una fila por línea de pedido: **6.000 a 10.000 pedidos**. Al llegar, el script se niega a escribir con un mensaje claro en vez de corromper la hoja: hay que archivar y vaciar |
| Correo | 100 al día | El resumen gasta 1 |
| Disparadores | 90 minutos al día | El recálculo horario tarda segundos. Sobra |
| Ejecución | 6 minutos cada una | La más lenta —recalcular tablero con miles de filas— va muy por debajo |
| Concurrencia | 30 ejecuciones simultáneas por cuenta de Google | Ya no la consume cada visita: el catálogo se sirve estático desde Cloudflare. La consumen enviar un pedido, aplicar un cupón, abrir el menú o el panel — sucesos, no visitas |

> Con el catálogo horneado (§6) la tienda deja de golpear Apps Script en cada
> visita, así que el techo de concurrencia de arriba deja de ser el límite
> práctico del tráfico del sitio — la sirve Cloudflare — y pasa a ser el
> límite de cuántos **pedidos y validaciones a la vez** aguanta una tienda. No
> hay una medición reciente de ese número con la arquitectura de hoy: si una
> tienda concentra pedidos en picos (una promoción por WhatsApp a muchos a la
> vez), es lo primero que habría que volver a medir.

## 11. Cómo se prueba: el emulador `gas.js`

La pieza que hace que `pruebas/todas.sh` pruebe el producto y no una imitación
de él es `pruebas/gas.js`: un emulador de Google Apps Script y Sheets que
**carga `maestro.gs` tal cual** y le inyecta el entorno de Google
(`SpreadsheetApp`, `CacheService`, `LockService`, `MailApp`, `HtmlService`…).
Existe porque una versión anterior del banco de pruebas reimplementaba el
backend a mano: validaba la imitación, no el código real. El servidor de
pruebas sirve `index.html` reescribiendo `SCRIPT_URL`, de modo que el
navegador habla con el backend real, emulado pero no reescrito.

## 12. Decisiones de diseño que ya se tomaron, sin condición de disparo

Distinto de `DECISIONES.md`: esto no va a cambiar con un umbral que se cruce,
es la forma que tiene el producto hoy y por qué.

- **La hoja es la única fuente de verdad** de precios, stock, envíos, cupones,
  marca y textos. `publicar/index.html` solo guarda un respaldo —el que
  escribe `montar/sembrar-respaldo.mjs`— que evita que la tienda se caiga si
  Google no responde.
- **Fallo cerrado en cupones**: si la hoja no responde, no se aplica
  descuento. Un cupón aplicado sin validar es plata perdida.
- **Fallo abierto en catálogo**: si la hoja no responde, la tienda sirve el
  catálogo de respaldo horneado en el archivo. Una tienda vacía es peor que
  una desactualizada — es la razón de ser de la 4.20 (`BITACORA.md`).
- **Los gráficos del tablero se dibujan con bloques** (`█`) y no con
  `SPARKLINE`: las fórmulas de Sheets cambian de separador según el idioma de
  la hoja, y una fórmula escrita desde el script se rompe con solo cambiar el
  idioma. Un bloque de texto se ve igual en todas partes.
- **El correo se revisa cada hora** en vez de programar un disparador a una
  hora fija, porque la hora vive en la hoja. Se cura solo si Google se salta
  una ejecución.

Límites conocidos, aceptados y no accidentales:

- **La vista previa de un enlace de producto** es la de la tienda, no la del
  producto: los rastreadores no ejecutan JavaScript. Arreglarlo pediría una
  página por producto y un paso de build.
- **El total del mensaje de WhatsApp es editable** por el cliente antes de
  enviarlo. Mitigado con el código de verificación y el paso de revisión del
  dueño (§9).
- **El contador de usos de un cupón** se actualiza cada hora: uno de un solo
  uso conviene apagarlo a mano apenas se use.
- **El cobro en línea es opcional** (M3.5, decisión 12): de fábrica se acuerda
  por WhatsApp, y `cobro_modo: Pasarela` enciende Bold con las llaves en las
  propiedades del maestro. La premisa de costo cero no obliga a la pasarela,
  pero ya no la excluye.


---

## 13. Los dos repositorios y sus flujos

Todo el producto vive en **dos** repositorios más uno por tienda:

| Repositorio | Qué es | Visibilidad |
|---|---|---|
| `laboratoriodigital/tienda` | La **semilla** de la Tienda Panel: `maestro.gs`, `panel.gs`, `plantilla/`, `montar/`, `pruebas/`, `docs/` y los flujos | Pública |
| `laboratoriodigital/organico` | La semilla de la **Tienda Básica** (línea 3.x) | Pública |
| `laboratoriodigital/tiendas` | El repositorio de **servicio**: `flota.json`, los flujos `alta`, `conectar` y `flota`, el panel estático y los secretos con poder | **Privada** |
| Una por comercio | Nace clonando la etiqueta de su semilla; contiene `publicar/` (lo que Cloudflare sirve) y su copia de los flujos | Pública |

### Los flujos de una tienda (viajan dentro de la semilla)

| Flujo | Cuándo corre | Qué hace | Permisos que pide |
|---|---|---|---|
| `montaje` | A mano, los lunes a las 11:00 UTC, y cuando lo dispara el panel, el menú, `conectar`, `flota` o `restaurar` | En este orden: trae la versión nueva de la semilla (opcional), publica `maestro.gs` (opcional, con `PUBLICAR`), hornea el `<head>`, el catálogo, el respaldo y el SEO desde la hoja, baja las fotos, **comprueba lo horneado** —en la semilla, todas las baterías; en una tienda, `tienda-viva.js` (bitácora 102)— y publica en `main` | `contents: write`, `pull-requests: write`, `actions: read` |
| `fotos` | Una vez al día y a demanda | Mira si el comercio subió fotos nuevas al Drive; si las hay, las prepara y abre/fusiona su pull request | `contents: write`, `pull-requests: write` |
| `pruebas` | En cada `push` a `main` y en cada pull request | La suite completa. `release` la exige en verde | Ninguno especial |
| `release` | A mano, **solo en la semilla** | Corta la etiqueta `vX.Y.Z` desde `package.json`. En una tienda se planta y explica por qué | `contents: write` |
| `restaurar` | A mano | Vuelve el sitio a un commit anterior, o le pide a `montaje` una versión anterior de la semilla | `contents: write`, `actions: write` |

### Los flujos del repositorio de servicio

| Flujo | Entradas | Qué hace |
|---|---|---|
| `alta` | nombre corto, comercio, producto | Crea el repositorio de la tienda clonando la última etiqueta de su semilla, lo limpia de lo que es de otra tienda, le pone su `name` de Cloudflare, los permisos, las fusiones automáticas y `SEMILLA_TOKEN`, y escribe su fila en `flota.json` |
| `conectar` | nombre corto, URL del servicio, token | Le pregunta al maestro su hoja y su proyecto, siembra en la hoja lo que ya se sabe, escribe los cuatro secretos de la tienda, le siembra al maestro su `GITHUB_TOKEN`, registra la tienda en la hoja de administración y dispara el primer montaje |
| `flota` | `estado` \| `actualizar` (+ anillo) | Estado: pregunta a cada tienda su versión y escribe `ESTADO.md` y el panel estático. Actualizar: por anillos, dispara el montaje de las Panel y abre/fusiona pull requests en las Básicas, deteniéndose si una falla |

---

## 14. El camino de un pedido, paso a paso

1. El comprador abre la tienda. **La página no le pregunta nada a Google**: el
   catálogo viene horneado en `publicar/catalogo.json` y, si eso fallara, en el
   respaldo dentro del propio `index.html`.
2. Arma su carrito en el navegador. Los cupones **sí** se validan contra el
   maestro (`?a=validar`): un descuento sin validar es plata perdida.
3. Al enviar, la página llama a `?a=registrar` —que escribe la fila en
   `Pedidos`, descuenta inventario y devuelve el número de pedido— y abre
   WhatsApp con el mensaje.
4. Si el pedido no llega a la hoja (red del comprador), queda en su navegador
   como **pendiente** y se reenvía la próxima vez que abra la tienda: son los
   «rescatados» que el panel cuenta.
5. Con `cobro_modo: Pasarela`, antes de WhatsApp se crea el cobro en Bold desde
   el maestro (la firma se calcula allí, nunca en la página) y la unidad queda
   apartada mientras se paga.
6. El comercio ve el pedido en su panel o en su hoja, lo confirma, lo despacha
   y —si `f_rastreo` está encendido— el comprador sigue su estado en
   `pedido.html?n=…&s=…` sin que la tienda guarde un dato suyo de más.

---

## 15. La medición (0.19.0)

Una clave en la hoja, `analytics_id`, y nada más. Vacía —que es el valor de
fábrica— la tienda no carga nada de Google, no pone una sola cookie y su
política de seguridad ni siquiera nombra a `googletagmanager.com`. Con un
`G-XXXXXXXXXX` válido, el montaje hornea el fragmento oficial de GA4 dentro del
bloque de configuración del `<head>` y añade a la CSP **de esa tienda** los
tres hosts que hacen falta. Las cabeceras de Cloudflare (`publicar/_headers`)
son iguales para todas las tiendas, así que nombran esos hosts siempre:
permitir un host no carga nada, y si no los nombraran, la tienda que sí mide
mediría cero sin un solo error visible.

La página no llama a `gtag` por ahí suelto: llama a **`medir(evento, datos)`**,
que hoy se lo pasa a Google si está y se calla si no, no revienta nunca y no
mide la vista previa. Los puntos de medida puestos son `agregar_al_carrito`,
`enviar_pedido` y `pagar_en_linea`. El día que exista nuestro propio
recolector, es **una línea más dentro de esa función** —un `sendBeacon` a una
puerta nuestra— y toda la tienda queda midiendo sin tocar una pantalla.

---

## 16. Cloudflare: qué hace, y qué sería Access

Cada tienda es un **Worker con recursos estáticos**: Cloudflare está conectado
al repositorio de esa tienda, y cada empujón a `main` publica el contenido de
`publicar/`. No hay compilación ni servidor: se sirven archivos. El archivo
`publicar/_headers` es configuración de despliegue —no se sirve como archivo— y
es donde viven las cabeceras de seguridad que un `<meta>` no puede dar
(`frame-ancestors`, `X-Frame-Options`, HSTS) y la caché del catálogo.

Con dominio propio, Cloudflare puede además **transformar las fotos** en el
borde (`/cdn-cgi/image/...`), que es la opción `fotos_cdn` de la hoja; la otra
manera —tres tamaños horneados en el montaje— sigue siendo el valor de fábrica
y el respaldo (decisión 22).

El **panel de la flota** se publica desde el propio flujo `flota` › estado
cuando `tiendas` tiene `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`
(`wrangler deploy` sobre `panel/`); sin esos secretos el flujo lo dice y sigue.

**Cloudflare Access** (parte de Cloudflare Zero Trust) es lo que falta para
servir el panel de la flota en una dirección. No es lo mismo que la tienda:
Access pone una **puerta de identidad delante de una dirección**. Se explica
entero en la sección 3.7 del roadmap y en `DESPLIEGUE.md`; aquí basta la idea:
el visitante no llega a la página hasta haber demostrado quién es, y quien lo
comprueba es Cloudflare, no nuestro código.

---

## 17. Volver atrás (0.18.0)

Tres cosas se pueden perder y cada una tiene su punto de restauración: los
**datos** (las copias semanales de la hoja en el Drive del administrador, que
se restauran por pestañas desde el editor del maestro con `A5_respaldos` y
`A6_restaurarDatos`), el **sitio** (cada commit de `main` que tocó `publicar/`,
que vuelve con el flujo `restaurar` como un commit nuevo encima) y la
**versión** (las etiquetas `vX.Y.Z` de la semilla, que vuelven pidiéndole a
`montaje` esa versión). Ninguna inventa infraestructura nueva. La tabla
completa está en `DESPLIEGUE.md` › *Volver atrás*.

---

## 18. El mapa del repositorio de la semilla

| Ruta | Qué es |
|---|---|
| `maestro.gs` | El backend entero de una tienda: puertas, reglas de negocio, correo, pagos, respaldo, restauración |
| `panel.gs` | El archivo de gestión del operador (hoja aparte, nunca se comparte con un comercio) |
| `plantilla/` | `index.html`, `admin.html`, `pedido.html` y `404.html` **sin hornear**: la fuente |
| `publicar/` | Lo que Cloudflare sirve. Se hornea en el montaje; no se edita a mano |
| `montar/` | Las herramientas del horneado, cada una con su `ESCRIBE`: `preparar-index`, `catalogo-estatico`, `sembrar-respaldo`, `sembrar-seo`, `preparar-admin`, `traer-fotos`, `publicar-maestro`, `actualizar-semilla`, `volver-atras`, `revisar-*` |
| `pruebas/` | Las baterías y el emulador `gas.js`. `./pruebas/todas.sh` las corre todas |
| `docs/` | Este archivo, `CONTRATOS.md` (normativo), `DESPLIEGUE.md`, `RUNBOOK-TECNICO.md`, `FUNCIONALIDADES.md`, `PLAN-MVP.md`, `ROADMAP.md`, `DECISIONES.md`, `BITACORA.md`, `GUIA-COMERCIANTE.md` |
| `semilla.json` | Qué archivos son de la semilla (y por lo tanto se actualizan solos en cada tienda) |
| `flota.json` (en `tiendas`) | La lista de tiendas, su producto y su anillo |

---

## 19. Cómo se comprueba que esto es verdad

La suite entera —más de 2.400 aserciones— corre sobre el código real, no sobre
una copia: `as.js` es `maestro.gs` y `pn.js` es `panel.gs`, copiados en cada
corrida. El emulador `gas.js` imita solo lo que el maestro usa de Google
(Sheets, Drive, propiedades, caché, correo, UrlFetch), y las baterías de
navegador sirven el `publicar/index.html` de verdad con Playwright.

Tres reglas de la casa sostienen el conjunto, y están comprobadas por sus
propias aserciones: **R1**, las columnas y las claves se agregan al final;
**patrón 2**, una regla vive en un solo sitio (y cuando no se puede, una
aserción compara las copias, como con la CSP); y **cada guardia nace con su
control negativo**, verificado en rojo antes de darlo por bueno.
