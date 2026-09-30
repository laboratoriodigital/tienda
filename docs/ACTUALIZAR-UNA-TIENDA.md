# Actualizar una tienda que ya está montada

_Vigente a la 1.0.0 (30 de septiembre de 2026). Tienda Panel: semilla
`laboratoriodigital/tienda`. La Tienda Básica (`organico`) se actualiza por
pull request desde la flota y no se cuenta aquí; desde la 1.0.0 solo recibe
correcciones, hasta que sus clientes se migren a esta línea._

Cada tienda tiene su propio repositorio y su propio ritmo. Una versión nueva de
la semilla **no le llega sola a nadie**: se pide. Pero pedirla es un botón, y
todo lo demás lo hace la propia tienda.

Qué versión tiene cada una: `tiendas` › [`ESTADO.md`](https://github.com/laboratoriodigital/tiendas/blob/main/ESTADO.md)
(o la columna **Versión** de la hoja *Panel de tiendas*). Cuál es la última: la
etiqueta `vX.Y.Z` más nueva de `laboratoriodigital/tienda`.

## El camino de hoy, de punta a punta

**1. Cortar la versión, en la semilla.** Subir `version` en `package.json`,
fusionar a `main`, esperar `pruebas` en verde y correr Actions › **release**.
Solo se puede traer lo que `release` cortó. Al final, `release` le pregunta al
maestro vivo de la semilla (`montar/preparar-index.mjs --al-dia`) y, si quedó
atrás, dispara el `montaje` de la semilla con `maestro` y `PUBLICAR`: la semilla
también es una tienda, y su maestro no lo publica ninguna actualización. El
detalle, en `CONTRIBUIR.md`.

**2. Pedirla.** Tres puertas, un solo mecanismo: todas disparan el flujo
**`montaje`** de la tienda con `semilla: true`.

| Quién | Dónde | Qué versión |
|---|---|---|
| El operador, para toda la línea | `tiendas` › Actions › **flota** › `actualizar` (línea `tienda`, hasta el anillo, versión, *ensayo*, «solo esta tienda») | La escrita, o la última |
| El operador, una tienda | Repositorio de la tienda › Actions › **montaje** › marcar `semilla` (y `version` si no es la última) | La escrita, o la última |
| El comercio | Panel › Tienda › *Versión de tu tienda* › **Actualizar ahora** (solo el dueño), o menú de la hoja › **Actualizar a la última versión** | La última |

Las dos del comercio necesitan `Configuración › repositorio` y el permiso
`GITHUB_TOKEN` en las propiedades del script del maestro (lo pone `conectar`).

**La flota, por anillos.** Va de menor a mayor anillo (`flota.json`: 0 pruebas,
1 primeras, 2 el resto), dispara el montaje de cada tienda, **espera a que
termine**, y **se detiene en la primera que falla**: las siguientes no se tocan
y el resumen dice cuáles quedaron y cómo seguir. Una tienda con
`"anillo": "fuera"` (o sin número) sigue en la lista y en el estado, pero ningún
reparto la toca. Una cuyo repositorio contesta 404 se salta y se sigue. Las
semillas no se actualizan nunca. De fábrica corre en **ensayo**: dice qué haría
y no toca nada.

**3. Lo que hace el montaje con `semilla`**, en este orden, y sin commit hasta
el final:

1. `montar/actualizar-semilla.mjs` clona la semilla (con `SEMILLA_TOKEN` si es
   privada), elige la etiqueta pedida o la última, y si la tienda ya está ahí
   termina diciendo «Nada que traer».
2. Escribe los archivos de la semilla sobre la tienda (abajo, *Qué cambia*) y
   pone en `package.json` la versión nueva.
3. Si la versión trae un `maestro.gs` distinto, **lo publica sin pedir
   `PUBLICAR`**: quien pidió actualizar ya lo pidió. Necesita los secretos
   `CLASPRC`, `SCRIPT_ID` y `HOJA_ID`; si falta alguno, se para y no publica
   nada. Actualiza la implementación que ya existe: la URL no cambia.
4. Rehornea desde la hoja —`<head>`, panel, imagen para compartir, fotos,
   catálogo, respaldo, SEO, nombre del Worker— con las herramientas **nuevas**.
5. Corre la compuerta (abajo) sobre lo horneado.
6. Publica **directo en `main`**, aunque se haya pedido `con-pull-request`. Si
   `main` está protegida, deja un pull request. Cloudflare despliega solo.

Tarda entre 10 y 20 minutos; el flujo tiene 50 de techo. La tienda sigue
vendiendo mientras tanto.

## Qué cambia en la tienda, y qué no

**Cambia lo que la semilla declara suyo**: la lista `propios` de
[`semilla.json`](../semilla.json) —el código, `montar/`, `pruebas/`, `docs/`,
los flujos, `package.json`, `semilla.json` mismo y `publicar/_headers`—. La
lista la dice la versión **nueva**, así que una versión puede sumar un archivo.
Archivo por archivo manda la regla de las tres versiones (`montar/semilla.mjs`):

| La tienda… | La semilla… | Qué pasa |
|---|---|---|
| no lo tocó | lo cambió | se sobrescribe |
| lo cambió | no lo cambió | se respeta |
| lo cambió | también lo cambió | **no se toca**, y el resumen lo lista |
| no lo tiene | lo trae | se agrega |
| (la semilla no tiene la etiqueta de la versión de la tienda) | | **no se toca** lo distinto, y se lista |

**Se borra lo que la semilla retiró**: la lista `retirados` de la versión nueva
(hoy, `servicio` y `.github/workflows/tienda-nueva.yml`). Solo rutas relativas
de dentro de la tienda; nunca `publicar/`, `.git` ni la raíz. El resumen dice
qué se retiró.

**No se toca:**

- **Los datos del comercio.** Catálogo, pedidos, configuración, fotos
  originales: viven en su hoja y su Drive, que son de Google. La actualización
  solo los lee para hornear.
- **`publicar/`**, salvo `publicar/_headers` (las cabeceras y la política de
  seguridad, iguales en todas). Lo demás de `publicar/` lo rehornea la misma
  corrida desde la hoja de esa tienda.
- `wrangler.jsonc` y `README.md`: son de la tienda.
- **Sus flujos** (`.github/workflows`): los entrega la flota (abajo).

## La compuerta: la tienda viva

Lo que decide si una tienda publica es **`pruebas/tienda-viva.js`**, no la suite
de la semilla. Lo elige `pruebas/publicacion.sh`: en una tienda
(`pruebas/donde.js` › `esSemilla()` falso) corre la tienda viva; en la semilla,
todas las baterías. `SUITE_ENTERA=1` fuerza todas en cualquier sitio.

El código de una tienda actualizada es el de una etiqueta que `release` no
corta sin la suite entera en verde. Lo que sí puede romperse es lo que se
hornea con **sus** datos, y eso es lo que mira, solo con invariantes:

- existen `index.html`, `catalogo.json` y `404.html`;
- la página sabe a qué maestro preguntar, espera la **misma** versión de
  maestro que hay en el repositorio, y su política de seguridad la deja
  hablarle;
- el catálogo se lee, cada producto tiene identificador, nombre y precio, y
  ningún identificador se repite;
- el respaldo se lee, lleva los mismos productos que el catálogo y es de la
  misma tienda;
- la página abre en un navegador, pinta los productos de **esa** tienda y no da
  un solo error de JavaScript.

Una foto que la hoja nombra y no está publicada **avisa y no detiene**: es dato
del comercio. Si algo falla, no se publica nada (ver *Volver atrás*).

## Los flujos los entrega la flota

Una tienda **no puede** escribir sus propios `.github/workflows`: el push de su
montaje va con el `GITHUB_TOKEN` de Actions, que no puede tocar flujos nunca, y
`actions/checkout` deja en `.git/config` una cabecera con ese permiso que gana
a cualquier otro token puesto en la URL (bitácora 103). Por eso la
actualización **nunca** mete flujos en el commit de la tienda —los saca
`publicacion.sh` y el paso «¿Cambió algo?»— y el resumen los lista como
pendientes.

Los pone la flota, con `FLOTA_TOKEN`, por la API de contenidos y solo los que
cambian (`tiendas/flota/flujos.mjs`):

- **`flota › actualizar`** los entrega sola después de cada tienda que se
  actualizó bien;
- **`flota › flujos`** los entrega a mano: para una tienda actualizada desde su
  panel o su menú, o para rescatar una que se quedó con flujos viejos.

Se entregan los flujos que `propios` nombra (`montaje`, `fotos`, `pruebas`,
`restaurar`). `release` no es de las tiendas.

## Volver atrás

- **Solo, si la actualización falla.** Nada llega a `main`. Si el maestro nuevo
  ya se había publicado, el paso «Volver atrás el maestro» vuelve a publicar el
  de antes: la tienda queda como estaba, y lo dice.
- **A una versión anterior, a mano.** Repositorio de la tienda › Actions ›
  **`restaurar`** › `la-version` (vacío = la anterior, o una `vX.Y.Z`) ›
  escribir `RESTAURAR`. Le pide a `montaje` esa versión con `semilla`: una
  versión escrita se trae aunque sea anterior. Pasa por la misma compuerta.
  Desde la 1.0.0 hacia una anterior también: las herramientas viejas preguntan
  por GET y el maestro 1.0.0, que sigue vivo hasta que se publica el viejo, las
  atiende (y lo anota; el diagnóstico lo dice).
- **El sitio de antes**: `restaurar` › `el-sitio` publica `publicar/` de un
  commit anterior como un commit nuevo (desde la 0.22.3 de verdad: antes decía
  siempre «Ya estaba así»). Comparte cola con `montaje` y `fotos`: no se pisan.
- **Los datos de la hoja**: `A5_respaldos()` y `A6_restaurarDatos()` en el
  editor del maestro. Son de Google, no de GitHub.

El detalle, en `DESPLIEGUE.md` › *Volver atrás*; el paso a paso del operador, en `RUNBOOK-TECNICO.md`.

## Por qué un arreglo del actualizador llega una versión tarde

La tienda se actualiza **con su versión vieja**. El flujo que corre es el
`montaje.yml` que la tienda ya tiene (el nuevo lo entrega la flota **después**),
y `montar/actualizar-semilla.mjs` y `montar/semilla.mjs` se ejecutan **antes**
de ser reemplazados. Un arreglo en cualquiera de esos tres solo actúa en la
actualización **siguiente**; y si la versión vieja es la que bloquea, la nueva
no llega sola (bitácora 102, causa 2).

Lo que corre **después** del paso de la semilla ya es de la versión nueva:
`pruebas/` y las herramientas de `montar/` que hornean. Por eso la lógica que
decide si se publica vive en `pruebas/publicacion.sh` y `pruebas/tienda-viva.js`,
y no en el flujo: la actualización las escribe antes de que corra la compuerta,
y una tienda con el flujo viejo ya usa la compuerta nueva en la misma corrida.
Regla para quien toca la semilla: **una decisión que tenga que valer ya, no se
escribe en el flujo ni en el actualizador.**

Si una tienda se atasca por su flujo viejo: `flota › flujos` para esa tienda, y
volver a pedir la actualización.

## Lo que sigue siendo a mano

| Cuándo | Qué | Dónde |
|---|---|---|
| La versión cambia el **menú de la hoja** | Repegar el stub: `A1_generarStub` **en el editor del MAESTRO**, ya publicado el nuevo; copiar lo que imprime el registro y pegarlo en la hoja | Ver *v2.0.0*, abajo |
| La versión agrega **una pestaña, un disparador o columnas de Pedidos, Pagos…** | `A0_instalar()`: agrega lo que falta y no pisa ningún valor escrito (R2 del contrato). Las **claves de Configuración** y las columnas de **Catálogo** e **Inventario por variante** ya no lo piden: las agrega la revisión de cada hora, una vez por versión (`ponerHojaAlDia`, 0.24.0), y las claves aparecen además al abrir Ajustes del panel (0.23.0). La sección de cada versión dice si hace falta | Editor del maestro |
| Cambió `panel.gs` | Actions › **panel** en `tiendas` (secretos `PANEL_SCRIPT_ID`, `PANEL_CLASPRC`). Mientras esos dos secretos no estén puestos (pendiente del dueño), pegarlo a mano y publicar Nueva versión | Hoja *Panel de tiendas* |
| Una tienda sin `CLASPRC` | Ponerlo, una vez: sin él no se puede publicar un maestro nuevo | Secretos de la tienda |

**Nunca una implementación nueva del maestro**: estrena URL y deja la tienda
muda. Qué pide cada versión, en las secciones de abajo.

---

## Lo que pidió a mano cada versión

Cada sección cuenta lo que pedía esa versión cuando salió. Los caminos que
nombran —pegar `panel.gs` a mano, `SEMILLA_TOKEN` para traer flujos, el pull
request de la flota— pueden haber cambiado después: lo vigente está arriba.

---

## La 1.0.0 (tienda): ningún token en una dirección, fotos que se pasan — nada a mano en la tienda

1. Actualizar como siempre (la flota, Panel › *Versión de tu tienda*, el menú,
   o `montaje` › `semilla`). Trae `maestro.gs` nuevo: hace falta `CLASPRC`.
2. Ni `A0_instalar()` ni el stub. Las herramientas que llegan en la misma
   corrida ya hablan por POST, con el token en el cuerpo; el maestro nuevo
   sigue aceptando GET en las puertas de montaje (para que volver atrás
   funcione) y anota cada uno en `TOKEN_POR_GET`, que el diagnóstico muestra.
   El stub sigue mandando su token de menú por GET: cerrarlo pediría repegarlo
   en cada hoja, y no se pide en esta versión.
3. **La hoja *Panel de tiendas*** sigue funcionando con su `panel.gs` de antes,
   que pregunta por GET: el maestro lo atiende y lo anota. Publicar el
   `panel.gs` de la 1.0.0 (flujo `panel`, o a mano) hace que pregunte por POST
   a las tiendas de la 2.0 (a una Tienda Básica, por GET, hasta migrarla).
4. Comprobarlo: en la tienda, un producto con varias fotos generales se desliza
   en su tarjeta (flechas al pasar el ratón en el computador); en Actions, el
   `montaje` en verde con «La tienda queda publicada en …».

---

## La 0.18.1 (panel de tiendas): los enlaces del portal

1. Pega el `panel.gs` nuevo en la hoja de administración y ejecuta `instalar`.
   Los botones del portal ya no dependen de cómo esté escrita la columna
   *Repositorio* (bitácora 79).
2. Si tu repositorio de flota no se llama `tiendas`, ponlo en las propiedades
   del script del panel: `REPO_FLOTA = dueño/nombre`.

---

## La 0.18.0 (tienda): volver atrás, el portal — y REPEGAR EL STUB

1. Actualizar como siempre (Panel › *Versión de tu tienda*, el menú, o `release`
   → `montaje` con el maestro). Llega también el flujo `restaurar`.
2. **Repegar el stub** en la hoja: el de antes no dice en qué hoja está pegado,
   que es lo que impide que el stub de una tienda administre otra (bitácora 76).
   En el maestro: `A1_generarStub` › copiar › Extensiones › Apps Script de la
   hoja › pegar encima › guardar.
3. En la hoja de administración (*Panel de tiendas*), pega el `panel.gs` nuevo:
   suma el menú **Panel › Abrir el portal**.
4. Nada más. Para volver atrás: `A5_respaldos()` y `A6_restaurarDatos()` en el
   maestro (los datos), y Actions › `restaurar` (el sitio o la versión).

---

## La 0.17.0 (tienda): HOJA_ID en las propiedades — una vez, a mano

1. Actualizar como siempre (Panel › *Versión de tu tienda*, el menú, o `release`
   → `montaje` con el maestro).
2. **Una sola vez**, si el maestro se implementó antes de pegar `HOJA_ID`: en el
   editor, `A0_instalar`, y *Implementar › Gestionar implementaciones › lápiz ›
   Versión: Nueva versión › Implementar* (la URL no cambia).
3. La hoja **Panel de tiendas** (la de administración, no la de la tienda):
   pega el `panel.gs` nuevo, ejecuta `instalar` (suma la columna *Producto*),
   menú › *Clave para el alta*, e impleméntala como aplicación web. La URL y la
   clave van como `PANEL_URL` y `PANEL_CLAVE` en `tiendas`.

---

## La 0.16.0 (tienda): el permiso se siembra, las fotos se comprueban — nada a mano

1. Actualizar como siempre (Panel › *Versión de tu tienda*, el menú, o `release`
   → `montaje` con el maestro).
2. Nada en la hoja. Si eliges Cloudflare para las fotos, el resumen del montaje
   dice si la zona de verdad transforma.

---

## La 0.15.0 (tienda): el aspecto del panel — nada a mano

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`
   (o, desde ahora, Panel › Tienda › *Versión de tu tienda* › Actualizar).
2. Nada en la hoja. El panel se ve más sobrio; no cambió ningún botón de lugar.

---

## La 0.14.0 (tienda): la tienda se actualiza sola — el stub, una vez

1. `git push` → `release` (deja la etiqueta **v0.14.0**: desde ahora las tiendas
   se actualizan a etiquetas) → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
2. **El stub, una vez**: en el maestro `A1_generarStub()` y pegarlo en la hoja,
   para que el menú muestre *Actualizar a la última versión*.
3. ~~La semilla, marcada como plantilla~~ — desde la 0.15.0 el alta clona la
   etiqueta y no lo necesita (bitácora 70).
4. **Opcional, `SEMILLA_TOKEN`** en cada tienda Panel (de grano fino: la semilla
   en lectura; la tienda con *Contents* y *Workflows* en escritura). Sin él la
   tienda se actualiza igual, pero sin traer los flujos. Y si lo tiene pero no la
   incluye a ella, tampoco pasa nada desde la 0.20.5: el montaje lo comprueba, lo
   dice en el resumen y trae todo menos los flujos (bitácora 92).
5. **Desde la 0.14.0, las próximas versiones llegan solas**: Panel › Tienda ›
   *Versión de tu tienda* › Actualizar, el menú de la hoja, o la flota. Si una
   versión pide `A0_instalar()`, está escrito aquí.

---

## La 0.13.0 (tienda): colaborador y vista previa — nada a mano en la hoja

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
2. Ni `instalar()` ni el stub: el colaborador se guarda en las propiedades del
   script y la vista previa no necesita nada nuevo del maestro.
3. Comprobar: en el panel, **Vista previa** abre la tienda con un cartel azul;
   en Tienda › *Otra persona en el panel*, darle una clave a alguien y entrar
   con ella en otra ventana: ve menos ajustes y dice «colaborador» arriba.
4. Las sesiones abiertas antes de esta versión siguen valiendo (el testigo del
   dueño no cambió de forma).

**Y desde ahora, la flota**: las tiendas nuevas de esta línea se ponen al día
desde `laboratoriodigital/tiendas` › Actions › **flota** › `actualizar`, que
abre un pull request en cada una. Ver su README.

---

## La 0.12.0 (tienda): arreglos de la prueba real — nada a mano en la hoja

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
2. Ni `instalar()` ni el stub.
3. Comprobarlo: un pago de prueba en línea trae «Ver en qué va tu pedido» en
   la pantalla, en el WhatsApp opcional y en el correo al comprador; en el
   panel, los filtros de pedidos responden al instante.

---

## La 0.11.0 (tienda): clave por correo, «avísame», columnas y dominio — `instalar()` una vez

1. **El dominio primero** (si la tienda va a tenerlo): la zona en la misma
   cuenta de Cloudflare y **sin** un registro DNS hecho a mano para el
   subdominio (`DESPLIEGUE.md`, «Dominio propio»). Después, en el panel ›
   Tienda › Avanzado › Dirección de la tienda: `https://tienda.laboratorio-digital.com`.
2. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
   El montaje escribe la ruta del dominio en `wrangler.jsonc` y Cloudflare la
   activa al desplegar.
3. **`A0_instalar()`**: crea la pestaña `Avísame` y agrega `f_avisame` (Sí) y
   `catalogo_columnas` (3). Sin esto funciona igual con lo de fábrica, pero la
   pestaña es la que guarda la cuenta.
4. Comprobar: en el panel, «¿Olvidaste tu clave?» manda el código al correo de
   la tienda; un producto con Stock 0 muestra «Avísame cuando llegue».

---

## La 0.10.0 (tienda): el rastreo del pedido — `instalar()` una vez

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
   El montaje hornea `publicar/pedido.html` junto al panel.
2. **`A0_instalar()`**: agrega la columna `Seguimiento` al final de Pedidos y la
   clave `f_rastreo` (Sí) al final de Configuración. Sin esto el rastreo
   funciona igual —vacío es Sí—, pero la columna es la que guarda las huellas.
3. Comprobarlo: hacer un pedido de prueba; el mensaje de WhatsApp trae «Sigue
   tu pedido: …»; abrir ese enlace muestra el pedido. En el panel, el detalle
   del pedido ofrece crear un enlace para los pedidos viejos.
4. Arregla, además, la hora de los pedidos en el panel que la 0.9.0 había
   perdido (bitácora 58).

---

## La 0.9.0 (tienda): el panel alcanza para todo — nada a mano en la hoja

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
   Si Google tarda en servir el maestro nuevo, el montaje espera hasta tres
   minutos antes de rendirse.
2. Ni `instalar()` ni el stub.
3. Comprobarlo en el panel: entra por **Ventas**; en **Tienda** están los
   ajustes, las zonas y los cupones. Cambiar el WhatsApp pide la clave.
4. Si cobra con Bold: el botón dice «Pagar con PSE - Pruebas» (o «Pagar con
   PSE» en producción). Si arriba del panel sale un aviso rojo, las llaves no
   están guardadas en las propiedades del script.

---

## La 0.8.0 (tienda): el tablero en el panel — nada a mano en la hoja

1. `git push` → `release` → `montaje` **con** la casilla `maestro` + `PUBLICAR`.
   **Desde esta versión eso funciona a la primera**: hasta la 0.7.0 el montaje
   con la casilla horneaba el index con la versión anterior y fallaba igual
   (bitácora 56). Si se dispara sin la casilla y el maestro vivo es otro, ya
   no hornea nada: se para al principio y lo dice en el resumen.
2. Ni `instalar()` ni el stub: el tablero lee lo que la hoja ya tiene.
3. Comprobarlo: entrar al panel → pestaña **Tablero** → la cifra de ventas del
   mes tiene que ser la de la pestaña Tablero de la hoja.

---

## La 0.7.0 (tienda): inventario por combinación, registro, tienda cerrada — `instalar()`

1. `git push` → `release` → `montaje` **con** `maestro` + `PUBLICAR`. Sin la
   casilla del maestro el montaje se niega —las versiones no casan— y tiene razón.
   *(Con la casilla también fallaba, hasta la 0.8.0: ver arriba.)*
2. **`A0_instalar()`**. Crea las pestañas `Inventario por variante` y
   `Registro`, genera las filas de los productos que ya tienen Variantes (con el
   stock vacío: **nada cambia** hasta que alguien ponga un número), y agrega
   `tienda_abierta`, `tienda_cerrada_mensaje` y `pedido_minimo` a
   Configuración, con valores que no cambian nada.
3. El stub no hay que repegarlo.

---

## La 0.6.0 (tienda): cobrar en línea — hay que ejecutar `instalar()`

1. `git push` → `release` → `montaje` con `maestro` + `PUBLICAR`.
2. **`A0_instalar()`** en el editor del maestro. Agrega `cobro_modo` y
   `cobro_ambiente` a Configuración (con `WhatsApp` y `Pruebas`: **no cambia
   nada** para la tienda), crea las pestañas `Pagos` y `Datos de entrega`, y
   cambia el disparador de cada hora por `revisionHoraria`. Sin `instalar()` la
   tienda sigue funcionando igual: solo no puede cobrar en línea.
3. El stub **no** hay que repegarlo: el menú no cambió.
4. Para cobrar con Bold: `docs/PAGOS-BOLD.md`.

---

## Qué es una tienda nueva y qué es una tienda que se actualiza

No son el mismo problema y conviene no mezclarlos.

**Una tienda NUEVA** la crea `tiendas` › Actions › **alta**: clona la última
versión publicada de la semilla, la limpia de lo que es de otra tienda y la
agrega a `flota.json`; después **`conectar`** le pone sus secretos y dispara su
primer `montaje`, que le escribe encima lo suyo desde la hoja. El camino entero,
en `RUNBOOK-TECNICO.md` y `DESPLIEGUE.md`. Lo que esté bien en la última
versión llega a toda tienda que nazca de ella; y lo que esté mal, también.

**Una tienda YA CREADA** no se mueve sola: se pide la actualización, como dice
*El camino de hoy*, arriba. Desde la 0.14.0 eso ya no es trabajo a mano.

> *Historia de la línea anterior.* En Orgánico se intentó de un tirón en la
> 2.12.0 y se retiró en la 2.13.0: el flujo `montaje` bajaba la página de la
> última versión publicada, y falló en el primero real porque las versiones de
> la semilla no eran públicas. En esta línea lo resuelve `SEMILLA_TOKEN`, que el
> alta copia a cada tienda para leer la semilla privada.

---

## Si trabajas en el repositorio de una tienda: `git pull --rebase`

**El repositorio se escribe solo.** `montaje`, `fotos`, `restaurar` y la flota
hacen commits desde GitHub —el `index.html` regenerado desde la hoja, el
`catalogo.json` horneado, las fotos convertidas, la versión nueva, los flujos—
y esos commits **nunca pasaron por tu máquina**. `origin/main` avanza y tu
copia local se queda atrás sin enterarse.

Entonces el `git push` siguiente falla así:

```
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not
hint: have locally.
```

No es un conflicto ni un error tuyo: es el flujo haciendo su trabajo. La
respuesta es siempre la misma:

```
git pull --rebase
```

Tus commits se vuelven a apoyar encima de lo que trajo el flujo. Casi nunca hay
conflicto, porque lo que escriben los flujos —`publicar/catalogo.json`,
`publicar/fotos/`, las constantes del `<head>`— es justo lo que no se toca a
mano.

> **La costumbre que ahorra el susto:** `git pull --rebase` **antes de empezar**
> a trabajar, no solo antes de empujar. Rebasar cuatro commits recién hechos es
> gratis; rebasar veinte, no.

---

# Historial de la línea anterior (Orgánico 2.x)

Lo que sigue es de la semilla vieja, de la que nació esta. Se deja porque
explica el stub y el orden de publicación, que no cambiaron. Sus flujos
(`maestro`, el pull request del montaje) y sus enlaces a
`laboratoriodigital/organico` son de esa línea, no de esta.

---

## Lo que cambia en la 2.6.0: **hay que volver a pegar el stub**

Es la primera vez desde la 2.3.0, y la razón se ve a simple vista: **el menú
cambió**. Ahora tiene seis opciones y empieza por **Publicar ahora**; dos de las
viejas —«Generar configuración» y «Generar inventario»— ya no existen del otro
lado.

Sin pegar el stub nuevo, la hoja sigue mostrando el menú viejo y esas dos
opciones contestan «esa opción del menú no existe».

### El orden, que aquí no es un detalle

**`generarStub` genera el stub a partir del maestro QUE ESTÁ PUBLICADO**, no del
que está en el repositorio. Generarlo antes de publicar el maestro nuevo
devuelve el stub viejo — idéntico al que ya está pegado — y parece que la
versión nueva no trae nada. No trae nada **todavía**.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request
5. **Ahora sí**: `generarStub` en el editor del maestro → pegar en la hoja
6. Volver a ejecutar **`instalar()`**, que es lo que agrega la fila
   `repositorio` a la pestaña Configuración

**La comprobación no es ambigua**: el menú tiene seis opciones y la primera es
«Publicar ahora». Si sigue teniendo cinco, falta el paso 3 o el 5.

---

## Lo que cambia en la 2.6.2: **NO hay que volver a pegar el stub**

El menú no cambió: las mismas seis opciones, en el mismo orden. Lo que cambió es
lo que contesta **Diagnóstico**, y eso vive entero en el maestro.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request

Y ya. **La comprobación**: abre Diagnóstico. Si lo primero que ves es un
`── RESUMEN ──` con nueve puntos y un cuadro para copiar, llegó. Si sigue siendo
una lista de líneas dentro de una alerta, falta el paso 3.

> Si el menú sí llegara a cambiar en una versión futura, el stub hay que volver
> a pegarlo — y en ese orden, que es el de arriba. El propio `menuCuadra()` lo
> detecta: compara el menú del stub con el del maestro.

Además, para que ese botón funcione hacen falta dos cosas, una vez por tienda:

1. `Configuración > repositorio` = `dueño/repositorio` (ej. `laboratoriodigital/organico`)
2. Propiedades del script del maestro > `GITHUB_TOKEN` = un token **fine-grained**
   de ese repositorio, con **un solo** permiso: *Actions: Read and write*

> **UN TOKEN POR TIENDA, Y DE UN SOLO REPOSITORIO.** Es tentador reutilizar el
> token que ya existe para el panel o para el alta, que alcanza a varios
> repositorios. No se hace, y la razón es la misma que sostiene todo el
> producto: este token vive en el proyecto de Apps Script **del comerciante**,
> donde él entra cuando quiere y donde las propiedades del script **no están
> cifradas**. Un token de ocho repositorios ahí dentro es el llavero común que
> esta arquitectura existe para no tener: desde la hoja de una tienda se podrían
> disparar los flujos de las otras siete.
>
> Los permisos de más tampoco son gratis. *Pull requests* y *Commit statuses* en
> solo lectura no hacen daño hoy, pero el día que alguien mire ese token para
> saber qué puede hacer, la respuesta tiene que ser corta. *Metadata: Read-only*
> es obligatorio y no se puede quitar.

> Si falta cualquiera de las dos, el botón **explica qué falta** en vez de
> fallar. Se puede desplegar sin ellas y configurarlas después.

---

## Lo que cambia en la 2.4.0, y por qué importa el orden

Esta versión lleva los sprints 1 y 2 juntos. Dos cosas que no estaban antes:

**1. `instalar()` hay que volver a ejecutarlo.** Agrega seis columnas y siete
claves, todas al final y todas opcionales. Sin eso la tienda funciona igual —esa
es la gracia de R3— pero el comerciante no ve los campos nuevos.

**2. El montaje escribe un archivo nuevo: `publicar/catalogo.json`.** Desde esta
versión la vitrina lo lee a él en vez de preguntarle a Google en cada visita. Si
una tienda no corre el montaje, **no pasa nada malo**: la página no encuentra el
archivo y le pregunta al maestro, como siempre. Pero tampoco gana nada.

> **El orden importa y no es simétrico.** Si la página sale antes que el
> maestro, la tienda sigue vendiendo pero avisa que la hoja responde otra
> versión, no aplica cupones y marca los pedidos sin validar. Si el maestro sale
> antes que la página, no pasa nada. **Ante la duda, publica el maestro
> primero.**

Trae el archivo nuevo desde la última versión publicada:

```
https://github.com/laboratoriodigital/organico/releases/latest/download/index.html
https://github.com/laboratoriodigital/organico/releases/latest/download/maestro.gs
```

---

## v2.0.0 — la primera estable

Es un salto mayor porque **una tienda ya montada tiene que hacer algo**. Si no
lo hace, no se rompe: se queda como está.

**1. El menú de la hoja pasa a llamarse como el comercio.**
Antes decía "Orgánico" en todas las tiendas, que es el nombre de un comercio de
tomates y no el del producto. Ahora sale de `negocio` en la pestaña
Configuración.

- [ ] Publicar el maestro nuevo
- [ ] **Abrir el proyecto del MAESTRO** en `script.google.com` — no la hoja
- [ ] Seleccionar la función `generarStub` y **Ejecutar**
- [ ] En el **Registro de ejecución**, copiar todo el bloque que imprime, desde
      `/**` hasta la última llave. (`instalar()` también lo imprime al final,
      bajo `═══ PEGA ESTO EN LA HOJA ═══`; `generarStub` solo es más corto)
- [ ] Hoja → Extensiones → Apps Script → **Ctrl+A y borrar** → pegar → guardar
- [ ] Recargar la hoja

> **El stub NO sale del menú de la hoja.** «Generar configuración» produce los
> dos bloques del `index.html`, que es otra cosa. El stub solo lo imprime
> `generarStub` en el editor del maestro —`instalar()` también lo imprimía al
> final hasta el 21 de septiembre de 2026, y ya no—, y por una razón: es el
> código que **dibuja** ese menú, así que no puede depender de que el menú
> funcione.

### No mires el menú para comprobarlo

**El menú no cambia.** Sigue teniendo las mismas cinco opciones, y el rótulo
pasó de la palabra `'Orgánico'` escrita a mano a la variable `NEGOCIO` — que en
la tienda que se llama Orgánico vale exactamente lo mismo. Es el mismo error de
comprobación que ya cometimos con la versión del Diagnóstico: **una prueba que
da igual antes y después no prueba nada.**

Lo que sí distingue el stub nuevo:

| Señal | Dónde | Qué significa |
|---|---|---|
| `var NEGOCIO = '…';` debajo de `var MAESTRO` y `var TOKEN` | En el editor de la **hoja** | Es el stub nuevo. Listo |
| El botón **Guardar** no se activa | Al pegar | Lo que pegaste es idéntico a lo que ya había: **ya estaba actualizado**. No es un fallo |
| `var NEGOCIO` no aparece en el registro de `generarStub` | En el editor del **maestro** | El maestro todavía tiene el código viejo. Vuelve a publicarlo |

**La excepción: cuando la versión nueva agrega una opción al menú** —como
*Clave del panel*, que llegó con D-1—. Ahí la opción aparece solo después de
pegar el stub nuevo, y mirar el menú **sí** es la comprobación. Fuera de ese
caso, el menú se ve igual antes y después, y no comprueba nada.

**2. El nombre del comercio, donde el comprador lo lee.**
El consentimiento de datos decía *"Autorizo a Orgánico a usar mis datos"* en
todas las tiendas, y un encabezado de los textos legales igual. Ahora los dos
llevan el nombre de la tienda.

- [ ] Traer el `index.html` nuevo y desplegar

**3. La configuración de fábrica ya no lleva datos de nadie.**
`instalar()` sembraba el nombre, el sitio, la ciudad, el teléfono y el celular
de la primera tienda. El celular era el caso grave: un número de fábrica no
falla, **funciona**, y le manda los pedidos a quien no es. Ahora el celular
viene vacío y el resto entre corchetes, y el montaje se niega a escribir el
index con un valor sin llenar.

Una tienda ya configurada **no nota nada**: `instalar()` nunca pisa un valor
escrito. Compruébalo de todos modos:

- [ ] Pestaña Configuración: `whatsapp` es el celular del comercio
- [ ] `negocio` y `sitio_url` no están entre corchetes

**4. Lo que no hay que hacer.**

- [ ] **Nunca** crear una implementación nueva del maestro. Estrena URL y deja
      la tienda muda. Siempre: Implementar → Gestionar implementaciones → ✏ →
      Versión: Nueva

---

## Lo que cambia en la 2.7.0: **hay que volver a pegar el stub, y después rotar**

El menú no cambió. Lo que cambió es **qué token lleva el stub**: hasta ahora
llevaba el de montaje, que abre todas las puertas, y el comerciante lo lee en el
editor de su propia hoja.

Nada se apaga el día del despliegue: `?a=menu` sigue aceptando el token viejo a
propósito. Pero la migración **no está hecha hasta el paso 6**.

1. `git push`
2. Flujo **`release`**
3. Flujo **`montaje`** marcando `maestro` y escribiendo `PUBLICAR`
4. Fusionar el pull request
5. **`generarStub()`** en el editor del maestro → pegar en la hoja → **abrir el
   menú una vez** y usar cualquier opción. Ese clic es lo que deja constancia de
   que la hoja ya entra con el token nuevo.
6. **`rotarToken()`** en el editor del maestro. Imprime el token de montaje
   nuevo. Se niega a correr si la hoja entró con el viejo hace menos de una hora
   — eso significa que el paso 5 no se hizo o no se comprobó.
7. Con el token que imprimió el paso 6:
   - cambiar el secreto **`MAESTRO_TOKEN`** del repositorio de esa tienda;
   - cambiar el `tienda.json` local, si se usa.

**Entre el 6 y el 7 los flujos `montaje` y `fotos` fallan con 401.** Es
esperado: el maestro ya cambió el token y el repositorio todavía no. No lo dejes
a medias.

**La comprobación:** abre Diagnóstico. El punto 2 tiene que decir *«el stub usa
el token del menú, que solo abre el menú»* y el token de montaje **no** debe
aparecer por ninguna parte del informe. Para leerlo, `diagnosticoCompleto()` en
el editor.

> **Y el paso que no está en la lista:** si ese token estuvo en una captura, en
> un chat o en un correo, rotarlo es lo único que sirve. Volver a pegar el stub
> no lo invalida.

---

## La 2.7.2 no añade pasos: hace visible si te saltaste alguno

Mismos pasos que la 2.7.0 —esta versión sale junto con ella—. Lo que cambia es
que **el stub ahora dice de qué versión es** en cada petición, y el panel lo
muestra en una columna nueva, **Stub en la hoja**:

| Dice | Quiere decir |
|---|---|
| *sin abrir todavía* | Nadie ha tocado el menú desde que se instaló el maestro. No es que esté mal: no se sabe |
| **ANTIGUO — repegar** | El stub pegado ni declara su versión: es anterior a esto |
| *2026-09-09-4 — atrasado* | Declara una versión, pero no la del maestro |
| **al día** | Coincide |
| *… + token viejo* | Además sigue entrando con el token de montaje: **no terminó la migración**, y `rotarToken()` se va a negar |

Con una tienda esto se recuerda. Con ocho, no — y **una hoja con el stub viejo
no se queja**: sigue dibujando un menú que ya no existe hasta que el comerciante
toca una opción y le contestan que no existe.

> Después del paso 5, **abre el menú de la hoja una vez**. Ese clic es lo que
> hace que la columna deje de decir «sin abrir todavía». Sin él, el panel no
> puede distinguir una hoja migrada de una que nadie ha tocado.


---

## La 2.8.0 cambia los estados del pedido: hay que ejecutar `instalar()`

El vocabulario de la columna **Estado** pasa de tres a seis.

| Antes | Ahora |
|---|---|
| Por confirmar | **Nuevo** |
| — | **Pendiente de pago** |
| Confirmado | **Pagado** ← *el único que descuenta inventario* |
| — | **Despachado** |
| — | **Entregado** |
| Anulado | **Cancelado** |

1. `git push` → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar
2. **`instalar()`** en el editor del maestro. Migra las celdas viejas y deja
   la lista desplegable con los seis. Dice cuántas celdas cambió.
3. El stub **no** hay que repegarlo: el menú no cambió.

**Por qué el paso 2 no es opcional.** El backend sigue entendiendo los estados
viejos —una hoja sin migrar no se rompe— pero la lista desplegable de la columna
Estado **no admite otros valores**, así que sin migrar las filas históricas
quedarían marcadas como inválidas. `migrarEstados()` reescribe los tres viejos y
nada más: una celda con cualquier otra cosa se queda como está y sale en el
Diagnóstico.

**La comprobación:** abre la lista desplegable de la columna Estado. Tiene que
ofrecer seis opciones empezando por *Nuevo*. Y en el catálogo, cambiar un pedido
a **Pagado** es lo que baja el stock; *Despachado* y *Entregado* lo mantienen
abajo, no lo devuelven.

> **Y una cosa que sí conviene mirar:** el tope por transferencia sale ahora de
> `Configuración > pago_tope`. Son 1.000 UVB —$12.110.000 en 2026— y **se
> reindexa cada diciembre**. Si esa celda está vacía o en cero, el carrito no
> bloquea nada.

---

## La 2.8.1: nada que hacer a mano

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Y ya: ni
`instalar()`, ni repegar el stub.

Lo que trae es que **un pedido que no llega a la hoja deja de perderse**: la
página lo guarda en el navegador del comprador y lo reenvía cuando la tienda
vuelve a abrirse. Ver `DECISIONES.md 04`.

**Dónde mirarlo, cuando pase:** Diagnóstico, punto 9 —*«Pedidos que llegaron
TARDE»*— y en el panel, columna **Rescatados**. Si esa columna está vacía en
todas las tiendas, no hay nada que hacer. Si aparece en una, fue la red; si
aparece en todas a la vez, el maestro estuvo caído.

> **Y una advertencia para leer el número.** Solo cuenta los pedidos que se
> pudieron recuperar. Si el comprador no vuelve a abrir la tienda, el suyo no
> aparece en ningún lado. **El número real de pedidos perdidos es mayor que el
> que sale.**

---

## La 2.9.0: **el montaje puede negarse a publicar**, y eso es nuevo

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Ni
`instalar()`, ni repegar el stub.

**Pero léelo antes de correrlo.** Desde esta versión el montaje se niega a
escribir el `index.html` si a la tienda le falta algo que **rompe la venta**:

| Clave | Sin ella |
|---|---|
| `negocio` | la tienda se anuncia con un corchete |
| `whatsapp` | el pedido no llega a ninguna parte |
| `sitio_url` | no funcionan «Ver mi tienda» ni la comprobación de publicación |
| `pago_llave` | el comprador termina el pedido y **no tiene cómo pagar** |

Si falta alguna, el flujo falla **diciendo cuál y por qué**, y se arregla
llenando la celda en `Configuración`. No es un fallo del flujo: es el flujo
haciendo lo que no se hacía.

Las otras doce claves **avisan y no bloquean** — salen en el registro del
montaje y en el panel.

**La comprobación:** abre **Diagnóstico**. El punto 2 es nuevo y se llama
*«¿Está terminada esta tienda?»*. Si dice `OK las 16 claves del alta están
llenas`, la tienda está cerrada. Y en el panel, la columna **Sin terminar** tiene
que estar en blanco.

> Y una cosa más que cambió y se nota: **el pull request del bot ya dice qué
> trae** —«montaje: 4 archivo(s) de foto · el catálogo»— en vez de la misma
> frase siempre. Si el título vuelve a repetirse corrida tras corrida, algo se
> rompió en el flujo.

---

## La 2.9.1: cuatro arreglos de cosas que se vieron en producción

Push → `release` → `montaje` con `maestro`+`PUBLICAR` → fusionar. Ni
`instalar()`, ni repegar el stub.

**1. El flujo `fotos` decidía en silencio.** Se subieron dos fotos al Drive, se
publicó, y el resumen dijo «nada nuevo» sin más. La respuesta estaba en el log
—cuántas ve el maestro en la carpeta, y cuáles nombra la hoja sin tenerlas— pero
el resumen, que es lo único que se mira, no la traía. Ahora sale **siempre**, se
haya decidido bajar algo o no.

**2. `rotarToken()` decía DOS sitios y son TRES.** Faltaba **la pestaña
`Tiendas` del panel, columna Token**. Si se olvida, el panel marca esa tienda
como **NO RESPONDE** y le vacía la fila de métricas — y la tienda está perfecta.
Ahora el panel distingue las dos cosas y dice **TOKEN VIEJO** con el arreglo.

> **Si tu panel dice que una tienda no responde y la tienda funciona, es esto.**
> Pega el token nuevo en la pestaña `Tiendas`. Lo imprime
> `A2_diagnosticoCompleto()` en el maestro de esa tienda.

**3. Las funciones de ejecución manual, juntas.** Llevan prefijo y salen al
principio de la lista del editor, numeradas en el orden en que se necesitan:

```
A0_instalar              crear pestañas y disparadores
A1_generarStub           el código para pegar en la hoja
A2_diagnosticoCompleto   el informe CON el token de montaje
A3_rotarToken            jubilar el token de montaje
A4_respaldoAhora         copia de la hoja sin esperar al domingo
```

Los nombres de siempre siguen funcionando: son envoltorios de una línea.

**4. El mapa de despliegue**, de punta a punta: `docs/DESPLIEGUE.md`.
