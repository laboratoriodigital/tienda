# Bitácora de fallos

Todo lo que se rompió, quién lo rompió, por qué pasó y cómo se arregló. Está
para dos cosas: que un fallo no vuelva por el mismo camino, y que quien llegue
después vea que las decisiones raras del código tienen una cicatriz detrás.

**Severidad** = qué tan caro sale, no qué tan difícil fue arreglarlo.

| | |
|---|---|
| 🔴 **Crítico** | Se pierde una venta, se filtra un secreto, o la tienda queda viva y muda. **Casi todos fueron silenciosos** |
| 🟠 **Grave** | Bloquea el trabajo o el despliegue, pero se ve |
| 🟡 **Medio** | Cuesta tiempo, confunde, o deja una prueba mintiendo |
| ⚪ **Menor** | Cosmético, redacción, números desactualizados |

---

## 🔴 Críticos

**El maestro publicado se quedaba sin su hoja.** `maestro.gs` lleva
`var HOJA_ID = ''` en el repositorio porque es distinto en cada tienda. Subirlo
tal cual **borraba el valor del proyecto publicado**, y entonces la tienda caía
al inventario de respaldo que trae dentro: se veía perfecta y no registraba un
solo pedido. Lo delató el panel con un `NO RESPONDE` sobre una tienda que estaba
arriba. → Se repone antes de subir, se niega a subir sin él, y al terminar
pregunta `?a=bloques` para comprobar que abre su hoja. *(mío)*

**Y el mismo agujero seguía intacto en el flujo de Actions.** `maestro.yml`
tenía su propia copia del procedimiento escrita dentro del YAML —`cp maestro.gs
subida/`— con el fallo que ya se había arreglado en la herramienta. Nadie lo
había disparado todavía. → El flujo **llama** a la herramienta en vez de
reescribirla, y una batería impide que se vuelva a escribir dentro. *(mío)*

**La llave de pago estaba en el repositorio**, en cuatro sitios de
`CONTEXTO.md`. → Marcadores en el documento, el valor real en `secretos.md`
—que no se versiona— y la llave se entrega solo por la respuesta automática de
WhatsApp. *(compartido)*

**Un token de GitHub clásico y el token de una tienda salieron en pantallazos.**
→ Revocado y reemplazado por uno de grano fino con permiso de solo lectura
sobre Actions. El de la tienda es rotable y de alcance acotado. *(tuyo, resuelto
en el momento)*

**Toda tienda le decía a su comprador que el pedido lo confirmaba otro
comercio.** El mensaje de WhatsApp y el **consentimiento de datos** —lo que el
cliente marca antes de comprar— llevaban el nombre escrito a mano en el archivo
en vez de `${NEGOCIO}`. La panadería nombraba a la tienda de tomates. → Los dos
salen ahora del nombre de la tienda, y hay aserciones que lo impiden. *(mío)*

**La configuración de fábrica traía el celular de la primera tienda.** Una
tienda nueva que no lo cambiara le mandaba los pedidos a ese teléfono. **Un
número de fábrica no falla: funciona**, y por eso es el peor valor posible. →
El celular viene vacío y el nombre y el sitio entre corchetes; el montaje se
niega a escribir la página si siguen sin llenar. *(mío)*

**El botón de WhatsApp se apagaba sin decir por qué.** En un teléfono los datos
de entrega quedan más abajo del pliegue: el cliente llena el carrito, ve el
total, toca el botón y no pasa nada. Venta perdida, y silenciosa. → Un aviso en
el pie fijo que nombra qué falta, y tocarlo —o tocar el botón apagado— lleva al
campo vacío. *(mío; lo viste tú con clientes reales)*

**Una batería de pruebas que reventaba contaba 0/0**, así que sumaba lo mismo a
los dos lados del marcador y **la corrida podía salir verde con una batería
entera sin correr**. → `todas.sh` marca como rota cualquiera que no arranque, e
imprime su error. *(mío)*

**Una batería abría un archivo por la ruta de una máquina** (`$HOME/t/…`). Donde
ese archivo existía, probaba una copia congelada de la tienda; donde no,
reventaba entera. Junto con el punto anterior, es lo que tapó durante semanas el
fallo del nombre del comercio. → Se abre el archivo que las pruebas regeneran al
lado, en cada corrida, desde la página de verdad. *(mío)*

**Otra copia congelada, antes:** `pruebas/local.html` llevaba días sin
regenerarse y dos baterías estaban verdes contra una tienda que ya no existía
—con URLs de Netlify y cupones en el archivo—. → Se regenera en cada corrida.
De las cuatro aserciones que fallaron al descongelarla, **se corrigieron las
aserciones, no el código**, con la razón escrita en cada una. *(mío)*

---

## 🔴 Críticos (sigue)

**«¿Cambió algo?» no veía los archivos nuevos, y tiró un despliegue a la basura
en verde.** El montaje horneó `catalogo.json` por primera vez y el paso que
decide si abrir el pull request dijo **«Nada cambió en la hoja ni en el Drive»**,
porque `git diff` **no ve los archivos sin seguimiento**. La corrida terminó en
verde, el archivo se perdió con el runner, y la tienda siguió pidiéndole el
catálogo a Google como si nada. Se descubrió mirando por qué no había rama
`montaje/desde-la-hoja` en el remoto. → `git add -A -- publicar/` primero y la
comparación contra el índice, con aserciones que prohíben volver a la forma
vieja. *(mío)*

> El fallo que funciona, otra vez — y esta vez **en la herramienta que existe
> justamente para no perder trabajo**. Un paso llamado «¿Cambió algo?» que
> contesta que no cuando apareció un archivo nuevo no está roto a medias: está
> contestando otra pregunta.

**El acta se congela antes de que llegue el último sello.** El mensaje de
WhatsApp salió con el envío correcto y `Validaciones` lo guardó en 0. El sello
espera 400 ms; `registrar` sale de inmediato al pulsar el botón, revalida por su
cuenta y marca el pedido como registrado; cuando llega el sello nuevo, el
escritor del acta lo descarta porque «ya está registrado». **Reproducido en el
emulador con los números exactos del pedido `M4467`.** El dinero queda bien
—`Pedidos` cobra el total correcto— pero el acta, que es la prueba de cuánto
valía el pedido cuando se envió y el detector de discrepancias, queda mintiendo.
La protección del congelamiento es correcta; lo que está mal es **cuándo** se
activa. → **S1-13**: que `registrarPedido()` escriba el acta con su propia
revalidación, que es la autorizada, y solo después marque el registro. *(mío)*

> Lo encontró una pregunta del terreno que yo llevaba tres vueltas contestando
> con conjeturas. El código no se resistía: bastó con correrlo.

**`Number(celda) || 0` convierte «no se pudo leer» en «es gratis».** El maestro
lee así el precio, el stock, el valor del envío, el mínimo del cupón y sus usos
máximos. Si el comerciante escribe `$9.000` o `9,000` —lo más natural del mundo
en una hoja de cálculo— `Number()` da `NaN` y `|| 0` lo vuelve cero: producto
gratis, envío gratis, cupón sin mínimo, y cupón sin tope (porque `0` usos
máximos significa **sin tope**). Las cuatro consecuencias empujan contra el
comerciante y **ninguna falla**. Apareció tirando del hilo de un envío en 0 en
el pedido `M4467`. → Sale como **S1-10**: distinguir *vacío* de *ilegible*, y
que lo ilegible grite por los tres canales que ya existen. *(mío, latente desde
el principio)*

**El guardia dejaba pasar el catálogo y el `git add` no lo recogía: seis días
vendiendo un producto dado de baja.** El flujo `fotos` publica dos cosas —las
fotos y el catálogo horneado— y esa lista estaba escrita **dos veces**: el paso
que comprueba que no se cuele nada más permitía `publicar/fotos/` *y*
`publicar/catalogo.json`; el paso que hace el commit hacía `git add
publicar/fotos/` a secas. Mientras el comercio solo subió fotos, las dos listas
decían lo mismo. El día que dio de baja un producto —un cambio que **solo** toca
el catálogo— el guardia dijo «adelante», el índice quedó vacío, `git commit`
salió con código 1 y la corrida murió con `no changes added to commit`.

Un solo defecto, tres síntomas que parecían tres problemas: el producto inactivo
seguía a la venta, la página seguía sirviendo el catálogo de la semana pasada, y
las fotos `pan-1`/`pan-2` —que sí estaban descargadas y commiteadas— no se veían,
porque **lo que nombra a una foto es el catálogo**, y el catálogo no llegaba.
Las ventas seguían bien, y eso fue lo que retrasó el diagnóstico: el pedido pasa
por el maestro en vivo, no por el archivo horneado. → Una sola lista, `PUBLICA`,
en el `env` del job, leída por los dos pasos; `git add -A` para que un borrado en
el Drive también entre; y un índice vacío se explica en vez de salir como un
error de git. *(mío)*

> El error que se veía en Actions era `no changes added to commit`, que manda a
> depurar git — el único de los tres que había hecho exactamente su trabajo.
> Patrón 2, y el más caro hasta ahora: no falló nada que el comerciante pudiera
> ver, salvo lo único que él mira, que es su tienda.

---

## 🟠 Graves

**El repositorio semilla nunca pasó por su propio runbook.** El montaje falló
tres veces seguidas al abrir el pull request, con todo lo demás en verde. La
causa estaba **escrita desde hacía semanas** en `RUNBOOK.md`, bloque B:

> Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to
> create and approve pull requests* ✔
> Sin esa casilla, `montaje` corre entero, funciona, y falla en la última línea
> al abrir el pull request.

Predicción exacta del síntoma. Pero ese bloque es el de **crear una tienda
nueva**, y `organico` es el primero: existía antes que el runbook, así que nunca
se le aplicó. GitHub lo dice en una anotación al pie —*«GitHub Actions is not
permitted to create or approve pull requests»*— que solo ve quien sabe que
existe. → Casilla marcada, y el flujo lo explica ahora en su propio resumen
cuando pasa. *(mío)*

> **Es el patrón 4 al revés.** Una prueba que solo sabe ver la primera tienda no
> prueba el producto; un runbook que solo sabe ver las tiendas nuevas **no cubre
> la primera** — que es justamente donde se prueba todo. La lista de la tienda
> cero hay que correrla contra la tienda cero.


**El maestro se inventaba su propia dirección.** Convertía la URL `/dev` en
`/exec` reemplazando texto, y **los dos identificadores son distintos**: el stub
quedaba apuntando a una URL que no existe y Google devolvía una página de error
en vez de datos. → El maestro aprende su dirección real la primera vez que
alguien abre la URL publicada, y la recuerda.
**Mi primer diagnóstico fue equivocado** —dije que la implementación había
quedado privada— y lo corregiste probando desde el celular con datos. *(mío)*

**Dependencia circular.** La herramienta que arregla el `HOJA_ID` se lo
preguntaba al maestro, pero todas las puertas abrían la hoja para contestar: un
maestro sin hoja no podía decir ni cuál era su hoja. → Una puerta `identidad`
que contesta sin abrirla. *(mío)*

**Publicar el maestro no corría en Windows.** Era un script de bash, y npm los
ejecuta por `cmd.exe`: `"." no se reconoce como un comando`. Era la única
herramienta que no estaba en Node, y fue la que se rompió. → Reescrita en Node.
*(mío)*

**«Falta clasp» con clasp instalado.** En Windows npm instala `clasp.cmd`, y
Node desde la 18.20 no lo lanza sin shell; `clasp` pelado tampoco existe. Los
dos caminos fallan. Y peor: yo trataba **cualquier** fallo como "no está
instalado", así que reinstalarlo no podía ayudar. → Se pasa por el shell, y "no
está instalado" se distingue de "falló". *(mío)*

**Dos herramientas se cargaban, no ejecutaban nada, y salían con código 0.** La
comparación `import.meta.url === \`file://${process.argv[1]}\`` nunca coincide en
Windows, donde la ruta llega como `D:\CoWork\…`. Un fallo silencioso que parece
éxito. Lo delató un pantallazo tuyo sin salida. → `pathToFileURL`, y una prueba
que las ejecuta como subprocesos. *(mío)*

**Una URL pegada en un formulario tumbaba el alta entera**
(`unsupported protocol scheme`): la API pide `dueño/repositorio` y la barra de
direcciones da una URL. → Se normaliza antes de tocar la API. **Pedirle rigor a
quien llena el formulario es la solución que no funciona.** *(mío)*

**El panel se comía la primera tienda.** `filas()` ya excluía el encabezado y le
añadí un `.slice(1)` encima. Con una sola tienda registrada, se las comía todas.
→ Quitado, y la prueba usa una sola tienda a propósito. *(mío)*

**clasp 3 renombró sus comandos** (`deployments` → `list-deployments`). → Se
detecta la versión instalada y se usan los de esa. *(del terreno)*

**Falta una casilla y el montaje falla en la última línea.** Sin *Allow GitHub
Actions to create and approve pull requests*, el flujo corre entero, funciona, y
muere al abrir el pull request. → Está en el runbook, y el alta la marca sola.
*(del terreno)*

**El documento mandaba a sacar el stub de donde no sale.** `ACTUALIZAR-UNA-TIENDA.md` y `SPRINT-0.md` decían «Menú de la hoja → *Generar configuración* → copiar el stub». Esa opción produce los dos bloques del `index.html`, que es otra cosa. Seguiste la instrucción, pegaste lo que no era, y Apps Script contestó **«no hay cambios que guardar»**: el menú se quedó viejo sin una sola señal de error. → Los dos documentos mandan ahora a ejecutar `generarStub` en el editor del **maestro**, dicen cómo se reconoce el stub bueno (`var NEGOCIO = '…';`) y qué significa que no haya cambios que guardar. Una aserción recorre `/docs` y falla si algún documento vuelve a juntar «stub» con «Generar configuración». *(mío)*

> El fondo del error: el stub es el código que **dibuja** ese menú. Mandar a arreglarlo desde el menú es pedirle a la tienda que se repare con lo que está roto.

**Y la comprobación que di era la misma trampa de siempre.** Dije «recarga la hoja: el menú se llama como el comercio». En la tienda que **se llama Orgánico** eso es idéntico antes y después: el rótulo pasó de la palabra escrita a mano a una variable que vale esa misma palabra, y las cinco opciones no se tocaron. Buscaste opciones nuevas que son del **Sprint 5** y todavía no existen. → Los dos documentos avisan de que el menú no cambia, y dan la única señal que sirve: `var NEGOCIO` en el editor de la hoja. Es el **segundo** caso de comprobación que da el mismo resultado antes y después —el primero fue la versión del Diagnóstico— y por eso pasa a los patrones. *(mío)*

---

## 🟡 Medios

**Una nota dentro de `devDependencies`.** Puse `"_comentario_sharp": "…"` para
explicar por qué hacía falta sharp en las pruebas, y `npm install` se negó:
*«name cannot start with an underscore»*. Cada clave de ahí es un **nombre de
paquete** para npm, no un sitio donde dejar una nota. El flujo `pruebas` quedó
rojo en el primer paso. → La nota se movió a un campo de primer nivel, que npm
ignora, y hay una aserción que valida el nombre de cada clave. *(mío)*

> **Lo que importa no es el error, es por qué no lo vi.** Corrí la suite entera
> antes de empujar y salió 1049/1049 — con `node_modules` ya instalado. El paso
> que fallaba, **instalar**, nunca se ejecutó. Comprobar con el trabajo ya hecho
> no comprueba el trabajo. Desde entonces, un cambio en `package.json` se prueba
> borrando `node_modules` primero.


**Dos menús «Diagnóstico», los dos diciendo «Versión de este código».**
Comparaste la del panel con la del maestro y parecía que el despliegue había
fallado. → «Versión del MAESTRO de esta tienda» y «Versión del PANEL». *(mío)*

**`todas.sh` solo imprimía el marcador.** Desde Actions el log es lo único que
hay, y `822/823` no dice qué se cayó. → Imprime las líneas `FALLA` debajo.
*(mío)*

**Cinco baterías daban por hecho que la tienda se llamaba «Orgánico».** Una
prueba así solo sabe ver la primera tienda: la segunda falla y nadie entiende
por qué. → Un comercio de prueba con nombre propio, y una aserción que prohíbe
la marca. *(mío)*

**Una tubería `| tee` sin `pipefail` se tragaba el fallo**: el shell por defecto
de Actions es `bash -e`, sin pipefail, así que manda el código de `tee`. Estaba
en dos flujos. *(mío)*

**El runbook hablaba de dos campos y el formulario tenía cinco**, dos de ellos
pidiendo datos que en ese punto del despliegue todavía no existen. → Una tabla
con todos, y una aserción que compara las dos listas. *(mío)*

**Una función `pesos()` duplicada** en el maestro; ganaba la última por
hoisting. Latente, nunca se manifestó. *(mío)*

**Un experimento a medias.** El menú de prueba del stub nombraba funciones que
nunca escribí, así que hacer clic no podía funcionar **nunca**. → Retirado una
vez medido lo que había que medir. *(mío)*

---

## ⚪ Menores

- **«758 aserciones» escrito a mano en seis sitios**, cuando ya iban por 900.
  → Se dijo «las 19 baterías», que tampoco duró: al llegar la 20 hubo que
    corregir seis archivos. Ahora se dice «todas las baterías», y una aserción
    impide volver a escribir el número.
- **`panel.gs` aparecía dos veces** en la tabla del README.
- **Un emoji al principio del mensaje** rompía la caja de escritura de WhatsApp.
  → Al final. *(del terreno)*

---

## Afirmaciones mías que resultaron falsas

Van aparte porque no son fallos de código: son cosas que dije con seguridad y
eran mentira. Todas las rectificaste tú.

1. **«Actions no puede correr las automatizaciones porque haría falta un
   llavero de todas las tiendas».** Falso: con un repositorio por tienda, los
   secretos son por repositorio y no hay llavero común.
2. **«El 403 de GitHub sin token es ocasional».** Falso: el cubo de 60 peticiones
   por hora es **por IP**, y Apps Script comparte IPs, así que está
   esencialmente siempre agotado.
3. **Escribí en la documentación una conclusión «medida» sobre el stub** a
   partir de tu primer reporte, y era incorrecta. Rectificaste —«sí funcionó el
   sin stub desde el maestro, salieron los dos menús»— y corregí el documento.
4. **«Menú de la hoja → Generar configuración → copiar el stub».** Falso, y lo
   dije dos veces: en la conversación y en dos documentos. El stub solo lo
   imprime `generarStub` —y `instalar()` al final— en el editor del maestro.
   Lo descubriste al pegar y no encontrar cambios que guardar.
5. **«El montaje falló porque se corrió sin la casilla del maestro»** (entrada
   50). Probablemente falso: con la casilla marcada fallaba igual, porque el
   index se horneaba con lo que el sondeo había preguntado antes de publicar
   el maestro. Lo dije sin mirar el orden de los pasos. Ver la entrada 56.

---

## Cambios de rumbo

No son errores. Son decisiones que se revirtieron con información nueva, y
conviene que quede por qué.

| De | A | Por qué |
|---|---|---|
| La configuración en la hoja | Un formulario de Actions con seis campos | Parecía menos trabajo manual |
| **De vuelta a la hoja** | | Un formulario era más frágil que una hoja de cálculo, que es lo que este producto ya sabe hacer bien |
| Dos flujos: `montaje` y `maestro` | Uno solo, con el orden fijo | Dispararlos en el orden equivocado es fácil y silencioso: publicar el maestro después de escribir la página deja la tienda avisando que la hoja responde otra versión |
| El alta dentro de la plantilla | Un repositorio de servicio | Pedir el nombre de un repositorio nuevo desde dentro del que ya es el nuevo no tiene sentido, y el token que crea repositorios no puede vivir en algo de lo que se sacan copias |
| El alta, aparcada | | Cada vuelta cuesta crear un repositorio de verdad para descubrir que un campo se llenó distinto. Con dos tiendas, a mano cuesta menos |
| «Orgánico» como nombre del producto | Orgánico es **un comercio** | Ningún nombre de comercio puede estar escrito en el código, ni siquiera en el menú de la hoja |
| Montar la tienda dos ya | Estabilizar la semilla primero | Montar contra una semilla que todavía se mueve es probar dos cosas a la vez sin saber cuál falló |
| Reiniciar en 1.0.0 | Saltar a 2.0.0 | Una versión menor que la anterior rompe el orden, y la regla del proyecto pedía mayor: una tienda vieja tiene que tocar la hoja y el maestro |

---

## Lo que el terreno enseñó, y no fue culpa de nadie

- **Los disparadores instalables no salvan al stub.** Desde el motor standalone
  se puede dibujar el menú en la hoja de otro, pero al hacer clic falla con
  `PERMISSION_DENIED`: la frontera es la **propiedad del proyecto**, no la
  autorización. Se midió, y el stub se queda.
- **Las 30 ejecuciones simultáneas de Apps Script no suben pagando.** Es el
  límite que decidió que cada tienda tenga su propia cuenta de Google.
- **Un pull request abierto con el `GITHUB_TOKEN` no dispara otros flujos.** Por
  eso las pruebas corren dentro del flujo que abre el PR y no después.
- **Las dos URLs de un web app, `/dev` y `/exec`, llevan identificadores
  distintos.** No se puede deducir una de la otra.

---

## Los ocho patrones que se repitieron

Si hay algo que llevarse de todo lo anterior, es esto.

**1 · El fallo que funciona es el caro.** Los diez críticos tienen algo en
común: **ninguno falló**. El maestro sin hoja servía un inventario de respaldo;
el celular de fábrica entregaba los pedidos a alguien; la batería rota sumaba
0/0 y daba verde; el archivo congelado pasaba las pruebas. Todo lo que "cae a un
respaldo" tiene que gritar, o el respaldo se convierte en el estado normal.

**2 · Dos implementaciones del mismo procedimiento: una siempre se queda
atrás.** El flujo con su copia del montaje, el número de aserciones escrito a
mano, el runbook contra el formulario, la lista de lo que falta contra la
condición del botón. La regla que salió: **una sola fuente, y lo demás se
deriva de ella.**

**3 · Windows.** Tres de los cuatro fallos de herramientas eran específicos de
Windows, y **ninguna prueba corriendo en Linux podía verlos**. Sigue sin
resolverse: correr las baterías también en Windows está ofrecido y no aceptado.

**4 · Una prueba que solo sabe ver la primera tienda no prueba el producto.**
El producto es una tienda por comercio. Cinco baterías comparaban contra el
nombre de la primera; se descubrió montando la segunda, que es tarde.

**6 · Lo que solo cubre a los que vienen después, deja fuera al primero.** La
prueba que solo conocía la primera tienda no veía la segunda; el runbook que
solo describe tiendas nuevas no cubre la primera. Es el mismo hueco por los dos
lados: **lo que se escribe para "los demás" se olvida de quien ya estaba**, y
quien ya estaba es donde se prueba todo.

**5 · Una comprobación mal elegida es peor que ninguna.** Tres veces, y las
tres las propuse yo.

Las dos primeras **daban lo mismo antes y después**: «mira que el Diagnóstico
diga la versión» —cuando `VERSION` no había cambiado a propósito— y «recarga la
hoja: el menú se llama como el comercio» —en la tienda que se llama como el
comercio—. El técnico quedó buscando una diferencia que no podía existir.

La tercera fue más disimulada, porque **sí produjo una diferencia**: «bloquea
`script.google.com` en DevTools y mira si la tienda sigue vendiendo». La tienda
cargó el inventario en segundos y parecía la prueba superada. No lo era: Apps
Script contesta **302** y redirige a `script.googleusercontent.com`, otro
dominio, que no estaba bloqueado. El catálogo nunca dejó de llegar. La prueba
midió una tienda con el maestro **vivo** y la dio por muerta.

La regla, en dos partes:

1. Antes de dar una comprobación, preguntarse **qué respondería con el cambio
   sin aplicar**. Si es lo mismo, no es una comprobación.
2. Y cuando sí distingue, preguntarse **qué está distinguiendo de verdad**. Una
   diferencia observable no es prueba de la hipótesis: es prueba de que algo
   cambió.

> El dato técnico, que vale por sí solo: **la puerta `/exec` de una aplicación
> web de Apps Script responde 302 hacia `script.googleusercontent.com/macros/echo`,
> y los datos salen de ahí.** Cualquier lista —de bloqueo, de permisos, una CSP—
> que nombre solo `script.google.com` está incompleta. Este proyecto ya lo sabía
> donde importaba: la CSP del `<head>` nombra los dos en `connect-src`. Lo que
> faltaba era saberlo también al escribir una prueba.

---

**7 · Una caché convierte un chequeo en un recuerdo.** Dos veces en la misma
tarde, y las dos en el diagnóstico.

El informe llamaba a `catalogoPublico()`, que **cachea un minuto**. Con la caché
caliente, la lista de celdas ilegibles llegaba vacía: el informe daba todo por
bueno **mientras un precio llevaba una hora sin poderse leer**. Es el patrón 5
otra vez —una comprobación que contesta lo mismo con el problema puesto— pero
por un camino que no se ve leyendo la función: se ve leyendo lo que la función
llama.

La segunda fue mía y recién escrita: la caché de la respuesta de la tienda
guardaba **también los fallos**, y eso convertía un tropiezo de un segundo en el
veredicto de toda la ejecución. La cazó una aserción vieja, no una relectura.

La regla: **un instrumento no lee por la caché.** Lo que mide el estado actual
—un diagnóstico, una validación, una comprobación— lee la fuente. Y una caché
guarda respuestas, no fracasos: recordar «no se pudo» deja la función mintiendo
aunque el mundo ya conteste.

---

**8 · El reloj es una entrada que nadie declara.** El 10 de septiembre de 2026,
`tablero.js` amaneció en rojo sin que nadie hubiera tocado una línea. Llevaba
una semana en verde.

No era el producto: era la siembra. Un pedido fechado *«hace 40 días»*, con el
comentario *«fuera de todas las listas de 30 días»*. De las de 30 días, sí. De
la comparación contra el **mes pasado**, no: restar 40 días desde el día 10 cae
en el día 1 del mes anterior, que está dentro del tramo comparable. Sus 200.000
se sumaban a la base y seis aserciones se caían.

Esa batería **solo pasaba los primeros nueve días de cada mes**, y llevaba así
desde que se escribió. Nunca lo supimos porque todo el trabajo cayó entre el 4 y
el 9.

Al buscarle las vueltas aparecieron tres más, todas del mismo tipo: el ranking
de más vendidos se daba la vuelta el 1 y el 2 de marzo, porque febrero cabe
entero dentro de los 30 días; el correo del día 1 no encontraba un «día anterior
dentro del mes»; y un pedido fechado «ayer» el día 1 es del mes pasado, así que
la aserción que exigía que NO saliera en el CSV mensual **acusaba al producto de
un acierto**.

Y una trampa mía, recién puesta al arreglarlo: la primera corrección leía las
fechas del propio CSV. Eso no prueba qué filas salen, prueba **cómo se
serializa una fecha** — y la serialización cambiaba de mes a mes. Sustituí un
fallo de calendario por otro.

Tres reglas:

1. **Los meses se restan con `getMonth()`, no con días.** `new Date(a, m - 2, 15)`
   está fuera del mes pasado por construcción; `ahora - 40 días` está fuera
   *casi siempre*, que en una prueba es lo mismo que estar dentro.
2. **Si un escenario no puede existir ese día, se salta diciéndolo** — el día 1
   no hay un día anterior dentro del mes. Eso es distinto de saltárselo porque
   estorba: lo primero se anota, lo segundo se esconde.
3. **Una aserción no mide un formato si lo que quiere medir es una regla.** Se
   pregunta a la siembra qué filas deberían salir, y se comprueban esas.

Y una batería nueva, `calendario.js`, que corre las que miran el calendario
**fingiendo ser cada día de un año bisiesto** y exige el mismo marcador en
todos. Ninguna de las cuatro trampas se veía leyendo el código. Las cuatro se
veían corriéndolo otro día.

---

**9 · Dos cosas que hay que actualizar, y solo una tiene dueño.** El 14 de
septiembre de 2026, montando la tienda dos, todo estaba al día y la tienda
seguía abriendo con tomates.

El código se sincroniza de la semilla al repositorio de cada tienda.
`publicar/index.html` **no**, y con razón: no es código, es el archivo publicado
de ese comercio. Pero eso dejaba una actualización partida en dos, con la mitad
automatizada y la otra mitad en una línea de la guía —«traer el archivo nuevo al
repositorio de la tienda»— que alguien tenía que leer y hacer.

Lo que hace caro este fallo es que **no se ve**: la tienda quedó con los flujos,
la herramienta y las baterías de una versión, y la página de la anterior. Nada
está roto, nada avisa, el marcador sale verde. El síntoma aparece a tres pasos
de la causa, en el navegador de un comprador.

La regla: **si actualizar algo son dos cosas, la segunda se olvida.** No se
arregla escribiéndola mejor en el documento — se arregla haciendo que sea una
sola. Ahora el montaje se trae la página de la última versión de la semilla
antes de escribir encima lo de esa tienda, y el paso manual desapareció.

Y el corolario que conviene tener a mano al diseñar: **se puede reemplazar
entero lo que se genera entero.** Ese archivo se podía tirar y volver a traer
porque no queda en él un solo valor escrito a mano — el `<head>`, las
constantes, la paleta y el respaldo los escribe el montaje desde la hoja. El día
que alguien meta ahí un valor a mano, esta automatización se rompe en silencio.

---

**10 · Una comprobación que solo mira el principio del archivo no ve que el
archivo está cortado.** Recién escrita, y en el sitio donde más dolía.

El paso que trae la página de la semilla comprueba, antes de escribirla encima,
que lo descargado sea de verdad la plantilla: cuatro marcas que los pasos
siguientes van a buscar. Las cuatro viven en el primer tercio del archivo.
**Media descarga las traía todas**, pesaba sesenta mil bytes y pasaba la
revisión entera — justo el caso que esa revisión existe para atrapar.

Se vio porque la aserción que la probaba partía el archivo por la mitad y
esperaba un fallo que no llegó. Es el patrón 5 otra vez, y esta vez lo cazó una
prueba escrita el mismo día.

La regla: **para saber si algo llegó entero, hay que mirar el final.** La seña
que faltaba era `</html>`, que solo está si la descarga terminó. Vale para
cualquier cosa que se transfiera: el principio de un archivo no dice nada sobre
su tamaño.

---

**11 · Dos números que coinciden esconden dos pruebas que no prueban nada.**
Al escribir el catálogo de respaldo por tienda (4.20), dos baterías se pusieron
rojas. Las dos llevaban meses en verde. Ninguna de las dos había medido jamás lo
que decía su título.

- `cat.js` probaba el catálogo de respaldo poniendo el servidor en modo
  `caido`. `caido` tumba el registro y la validación, y **deja el catálogo
  vivo**: la sección medía una tienda con la hoja contestando con normalidad y
  la daba por muerta. El modo que hacía falta era `muerto`.
- `pag.js` esperaba a `pintado()`, que vuelve en cuanto la página dibuja algo —
  y lo primero que dibuja es el respaldo del archivo, antes de que llegue la
  hoja. Medía la paginación del archivo, no la de la hoja.

**Las dos pasaban por la misma razón: el respaldo del archivo tenía justo los
mismos ocho productos que la hoja emulada.** Esperar de más o de menos daba el
mismo número, y un modo o el otro daban el mismo número. Contestaban lo mismo
con el arreglo puesto y sin él.

El día en que el respaldo dejó de ser el de Orgánico, los dos números se
separaron y las dos hablaron.

La regla, que es una vuelta de tuerca del patrón 5: **cuando dos fuentes de un
dato tienen el mismo valor, ninguna prueba puede decir de cuál vino.** Si la
siembra y el archivo dicen lo mismo, hay que hacer que digan cosas distintas
antes de creerse una sola aserción.

---

**12 · Una guarda que acusa al producto de un acierto.** Al cerrar el 4.20 el
primer impulso fue calcar la guarda de la paleta (2.9.9): «ninguna batería de
navegador puede nombrar un producto de Orgánico». Marcó **diez** baterías.

Las diez tenían razón. Nombran tomates porque conducen la **hoja emulada**, que
es de fábrica y es idéntica en todas las tiendas. Lo que viaja por tienda es el
respaldo del archivo, no la hoja emulada — y esa diferencia una regla de texto
no la puede ver.

Se cambió por una batería, `respaldo.js`, que **monta una tienda que no es
Orgánico**, la sirve con la hoja muerta y mira qué se pinta. Lleva dentro su
propia prueba de que distingue: con el arreglo quitado, se cae.

La regla: **una guarda que produce falsos positivos se desactiva sola** — la
gente aprende a saltársela, y el día que acierta nadie la mira. Antes de poner
una regla de texto, hay que preguntarse si lo que quiere prohibir se puede
nombrar sin tocar lo que está bien. Cuando no se puede, no es una regla: es una
prueba, y hay que escribirla.

---

**13 · Un rojo que pide arreglar algo que no está roto.** El primer push del
4.20 al repositorio de la tienda salió rojo: `respaldo.js` 4/10 y `config.js`
con dos caídas, todas diciendo «Orgánico».

El código estaba bien. Lo que pasaba es que ese repositorio tenía el
`index.html` de antes —ver el 9— y las baterías estaban exigiendo algo que allí
**todavía no podía ser cierto**. El rojo mandaba a buscar un fallo inexistente:
el mismo error que cerró la tanda anterior, ahora del lado de las pruebas.

La regla ya estaba escrita en el patrón 8 y hubo que aplicarla en otro sitio:
**un escenario que hoy no puede existir se salta DICIÉNDOLO.** Las dos baterías
lo detectan y lo dicen, con los pasos que faltan.

Y la media vuelta que hacía falta para que eso no se convierta en lo otro:
`todas.sh` imprime los saltos **aunque el marcador salga verde**. Un salto que
solo existe dentro del archivo de salida que nadie abre es un salto escondido, y
de ahí a una batería que no corre desde hace tres meses hay un paso.

---

**14 · El banco de pruebas era dos comercios a la vez.** El 14 de septiembre de
2026, el primer montaje de la tienda dos con la versión nueva reventó tres
baterías, y ninguna de las tres hablaba de lo que le pasaba.

- `val.js` murió con «Cannot read properties of undefined (reading 'stock')».
  Hacía `agregar('chonto')` **a propósito antes de que llegara el catálogo** —la
  sección mira la pantalla mientras la hoja tarda—, y lo que hay en ese momento
  es el catálogo de respaldo DEL ARCHIVO. En el archivo de una tienda de
  cosméticos no existe ningún `chonto`.
- `config.js` leía «Orgánico» sin red en el repositorio de otro comercio.
- `montaje.js` exigía `#D0211C` en una tienda cuya paleta ya era la suya — el
  patrón 4 dentro de la batería que vigila el patrón 4.

La causa era una sola: desde que el montaje escribe el catálogo de respaldo, el
`index.html` del repositorio es **de un comercio** y la hoja emulada de `gas.js`
es **de otro**. El banco estaba probando una tienda que no existe, y los
síntomas caían a tres pasos de ahí.

La regla: **el archivo y los datos que se prueban juntos tienen que ser del
mismo comercio.** El arreglo no fue borrar el respaldo del arnés —eso dejaría
sin probar justo el camino nuevo— sino reescribirlo con el catálogo de la hoja
emulada, con la misma herramienta que usa el flujo. Una línea en `todas.sh`, y
las tres baterías volvieron a medir lo que dice su título.

Y el corolario para el diseño: **cuando una entrada que era constante se vuelve
variable, hay que buscar quién la daba por constante.** El respaldo llevaba
siendo el mismo en todos los repositorios desde que existía. El día que dejó de
serlo, salieron diez baterías que se apoyaban en eso sin saberlo.

---

**15 · Declarar no es aplicar.** La primera comprobación de «¿esta tienda ya
tiene la página del 4.20?» miraba `typeof CONFIG_SEMILLA`.

Daba verde en los dos casos. Un archivo **anterior** al 4.20 acaba declarando
`CONFIG_SEMILLA` igual —se la escribe el montaje, que sí está al día— y no la
aplica nunca, porque la línea que la aplica no está en él. La constante existía;
la página seguía pintando el comercio de la plantilla.

La regla: **se comprueba el efecto, no la presencia.** La página pone ahora una
bandera después de aplicar la configuración, y esa bandera solo existe si el
trabajo se hizo. Es el patrón 5 en su forma más barata de cometer: mirar si algo
está escrito en vez de mirar si algo pasó.

---

**16 · Resolver el problema de la etapa siguiente cuesta el doble.** El 14 de
septiembre de 2026 se automatizó que cada tienda se trajera la página de la
última versión de la semilla. El código estaba bien y las baterías lo probaban.
Falló en el primer montaje real con un 404, y se retiró al día siguiente.

El 404 —las versiones de la semilla no son públicas— era el síntoma barato. El
caro fue otro: **el problema que eso resolvía no existe todavía.** Hoy una
tienda nueva se crea *a partir de la plantilla* y nace con la página dentro, así
que lo que esté bien en la semilla llega solo. Actualizar una tienda **ya
creada** es un problema real, pero llega cuando haya tiendas viejas — y hasta
entonces, aquel paso solo añadía un camino más que se podía caer, dentro del
flujo del que depende cada despliegue.

Lo que lo hizo fácil de cometer es que la petición sonaba igual: «que no haya
pasos manuales». La había, y era cierta — pero en la **entrega de una tienda
nueva**, no en la actualización de las que ya existen. Dos problemas parecidos,
uno urgente y otro no, y la solución del segundo se coló en el camino del
primero.

La regla: **antes de automatizar algo, preguntar cuántas veces va a pasar este
mes.** Si la respuesta es cero, lo que se está construyendo no es una mejora:
es una superficie de fallo con un plazo de caducidad. Anotarlo en la hoja de
ruta es más barato, y ahí no se cae.

Y la mitad que sí se quedó, porque valía por sí sola: **lo que se genera entero
se puede reemplazar entero**, y para saber si algo llegó completo hay que mirar
el final —las marcas del principio las trae media descarga—. Las dos están
escritas en el 4.18 para el día que toque.

---

**17 · El único botón que el comerciante puede apretar no llevaba lo que él
cambia.** El 15 de septiembre de 2026, recién montada la tienda tres, el
operador cambió el título del sitio en la hoja y apretó **Publicar ahora**. Salió
el mensaje de siempre —«tu tienda se está actualizando… se revisan los datos»—
y no cambió nada. Ningún error, en ninguna parte.

«Publicar ahora» dispara el flujo `fotos`, y lo que ese flujo publica está
acotado a propósito: `publicar/fotos` y `publicar/catalogo.json`. Es la lista
que lo deja fusionar sin una persona en medio. Pero **todo lo que se escribe en
la pestaña Configuración** —el título del sitio, el nombre del comercio, los
colores, los textos de la portada, el WhatsApp— no vive en ninguna de esas dos
rutas: vive en el `<head>` y en las constantes del `index.html`, que solo
escribía `montaje`.

Así que el comerciante tenía un botón que le prometía «se revisan los datos» y
que, para la mitad de los datos, no hacía nada. El patrón 1 otra vez, y en el
peor sitio: en la única palanca de la persona que no puede entrar a GitHub.

La regla: **lo que el producto le ofrece cambiar a alguien, tiene que llegar
por el camino que esa persona puede recorrer.** No basta con que exista un
flujo que lo haga; tiene que estar en el que ella dispara. Ahora `fotos`
escribe el `<head>`, mira la Configuración al decidir si hay novedades, y repone
el respaldo — y la lista de lo publicable sigue siendo una sola.

Y el segundo hallazgo de la misma tarde: el `montaje` abría un pull request y
esperaba a que alguien lo aprobara. Esa exigencia tenía sentido mientras el
montaje traía la PÁGINA de la semilla —subir de versión a una tienda es una
decisión—, y ese paso se había retirado el día anterior. Quedó la ceremonia sin
el motivo. **Una guarda cuyo motivo desapareció no se queda «por si acaso»: se
quita, o se convierte en un trámite que la gente aprende a saltarse.**

---

**18 · La tercera vez que la misma lista estaba escrita dos veces, en el mismo
archivo.** El 15 de septiembre de 2026, montada la tienda tres, el operador
cambió el título del sitio, apretó «Publicar ahora», el flujo dijo que había
novedades, publicó las fotos y el catálogo — y el título no llegó.

El día anterior se había ampliado `PUBLICA` para que este flujo publicara
también `publicar/index.html`, que es donde vive el título. Y publicaba. Lo que
pasaba estaba unas líneas antes: para rehacer la rama sobre el `main` de ese
instante, el flujo guarda los archivos generados, hace `git reset --hard` y los
repone. Esa copia **nombraba dos de las tres rutas a mano**:

```
cp -r publicar/fotos      "$guardado/publicar/"
cp publicar/catalogo.json "$guardado/publicar/"
```

El `reset --hard` se llevaba por delante el `index.html` que el paso anterior
acababa de escribir desde la hoja. Todo lo demás funcionaba: el paso que decide
si hay novedades lo miraba, el `git add` lo incluía, las baterías corrían sobre
él. Solo que para entonces ya era el de antes.

Es el **patrón 2 por tercera vez en este mismo archivo**, y las tres veces con
la misma forma: alguien amplía la lista de arriba y no ve la copia de más abajo.
La cura tampoco cambia: guardar y reponer recorriendo `$PUBLICA`.

La regla, afinada: **cuando un archivo ya tuvo dos veces el mismo fallo, la
tercera no se arregla con cuidado.** Se busca a mano toda ruta escrita en ese
archivo que debería salir de la lista, y se quita. Ahora hay una aserción por
cada uno de los tres sitios.

---

**19 · Una condición de trabajo no puede saltarse una corrida que está
retenida.** El mismo día, en el mismo pull request.

`pruebas.yml` lleva desde el Sprint 5 una condición para no repetirse sobre el
pull request que abre `fotos`, escrita precisamente porque *«esa corrida queda
esperando la aprobación de un mantenedor, caduca, y deja una X roja en un pull
request que ya se fusionó bien»*. La condición está bien escrita y la rama
coincide.

Y no sirve. GitHub **retiene la corrida entera** esperando aprobación, y eso
pasa antes de que se evalúe ninguna condición de ningún trabajo. El `if:` nunca
llega a ejecutarse. Llevábamos semanas creyendo que ese caso estaba cubierto
porque la condición existía, sin haber comprobado nunca que hiciera algo — el
patrón 5 aplicado a una condición en vez de a una aserción.

Lo que sí lo resuelve es no abrir el pull request: cuando el flujo va a publicar
solo, empuja directo a `main`. Las baterías ya corrieron enteras sobre esos
mismos bytes, así que el pull request no añadía una sola comprobación; solo
añadía una corrida retenida y una marca roja que no significaba nada.

La regla: **una guarda que nunca ha visto el caso que dice cubrir no está
comprobada, está redactada.** Vale para un `if:` de un flujo igual que para una
aserción. Si no se puede provocar el caso, al menos hay que dejar escrito que
no se ha visto nunca.

---

**20 · Un paso que hace cuatro cosas falla entero por la que menos importa.**
El 15 de septiembre de 2026, la tienda tres. El comercio cambió el título de su
tienda y apretó «Publicar ahora». El flujo hizo su trabajo: escribió el `<head>`
con el título nuevo, comprobó que el catálogo estaba al día, repuso el catálogo
de respaldo. Y murió con código 1, sin publicar nada, porque **una foto del
Drive contestó 404**.

El paso agrupaba cuatro herramientas bajo un mismo `estado=$?`, así que
cualquiera de las cuatro tumbaba las otras tres. Visto desde el comerciante:
cambió su título, apretó el botón, y lo que llegó fue una cruz roja.

La regla: **no todo lo que falla en un paso vale lo mismo.** Un `<head>` a
medias es una tienda publicada y muda — eso sí para. Una foto que no baja no
invalida lo que el comercio escribió en su hoja: se publica lo demás y **se dice
en grande**, en el resumen y en el commit. Un fallo que se traga en silencio es
peor que uno que para; uno que para por lo que no importa, también.

---

**21 · Un diagnóstico que contradice lo que acaba de pasar delante.** El mismo
404, mismo día.

El mensaje decía, siempre: *«El maestro respondió 404. Casi siempre es que la
implementación quedó con acceso Solo yo»*. Y salió **después** de que ese mismo
maestro, en esa misma corrida, hubiera contestado `identidad`, `bloques` y
`fotos`. Con acceso «Solo yo» no habría contestado ninguna de las tres.

El operador se fue a revisar una implementación que estaba perfectamente bien.
Es la tercera vez en dos días que un error apunta al sitio equivocado, y esta
tiene un agravante: **el propio registro, dos líneas más arriba, desmentía el
consejo.**

La regla: **un mensaje de error puede mirar lo que ya pasó en esta corrida, y
debe.** Ahora se recuerda qué acciones contestó cada maestro, y el 404 dice a
cuál le contestó, descarta explícitamente lo que ya está descartado, y ofrece la
causa que sí explica un 404 en una sola acción: Apps Script sirve los datos
desde `script.googleusercontent.com` por una redirección que caduca. Cuando no
ha contestado nada todavía, el consejo de siempre vuelve a ser el bueno.

Dicho corto: **si el programa tiene delante la prueba de que su consejo es
falso, no tiene excusa para darlo.**

---

**22 · Lo que ninguna batería podía probar.** El 15 de septiembre de 2026 se
hizo, por primera vez, un pedido completo con un teléfono que no era el del
comercio: pedido → WhatsApp → respuesta automática → transferencia → *Pagado* en
la hoja → el stock baja. Salió bien.

No hay nada que arreglar aquí, y por eso mismo vale anotarlo. **1372 aserciones
prueban las piezas; esta prueba probó la costura.** Y la costura es donde vive
todo lo que este proyecto ha aprendido a temer: el paso que funciona pero llega
al sitio equivocado, el que se salta en silencio, el que contesta lo mismo con
el fallo puesto y sin él.

La regla, que cierra la lista y no contradice ninguna de las anteriores: **una
suite verde es una hipótesis, no un hecho.** Dice que cada pieza hace lo que
alguien escribió que hiciera. No dice que el comprador pueda pagar. Eso solo lo
dice un comprador pagando, y hay que ir a buscarlo — una vez, a propósito, antes
de que lo haga uno de verdad.

---

**23 · Un documento no lanza una excepción cuando miente.** El 16 de septiembre
de 2026, al revisar toda la documentación para el cierre de la 3.0.0, aparecieron
cinco guías de despliegue distintas — `RUNBOOK.md`, `DESPLIEGUE-CLIENTE.md`,
`MONTAJE.md`, `INSTALAR.md`, `FOTOS.md` — y dos manuales largos para el
comerciante, cada uno contando una versión distinta de la misma tienda. Tres
enseñaban a subir fotos a Cloudinary cuando llevan meses yendo a Drive. Tres
decían que el catálogo «se lee en vivo, cambias la celda y en un minuto está en
línea» cuando se hornea desde el Sprint 2 y necesita **Publicar ahora**. Uno
llamaba «Confirmado» a un estado que se renombró a «Pagado» hace varias
versiones. Un ADR de `DECISIONES.md` describía el catálogo en vivo como el
presente y lo estático como una condición futura, cuando la migración ya había
pasado. Ninguno de estos siete documentos daba un error al abrirlo. Todos se
veían terminados, con capturas, con tablas, con el mismo tono seguro que un
documento correcto.

Ya se había visto esta forma exacta de fallo — RUNBOOK.md enseñando un menú
derogado (patrón 2, primera vez), el manual del dueño con el mismo error
(patrón 2, tercera). Lo que este día enseñó es la escala: no era un documento
atrasado, era **la mayoría de los documentos que explican cómo se usa el
producto**, acumulados sin que nadie los borrara cuando quedaron cubiertos por
uno mejor. Cada aviso de "esto está atrasado, ver DESPLIEGUE.md" que se le fue
agregando encima era honesto y no arreglaba nada: el documento seguía ahí,
segundos de una búsqueda, dispuesto a que alguien lo leyera primero.

La regla: **un documento redundante no se marca como atrasado, se borra.** Un
aviso en la cabecera es una curita sobre una fuente que sigue mintiendo debajo;
borrar es la única corrección que no se puede volver a saltar por accidente.
Antes de borrar, se rescata lo que seguía siendo cierto y no vivía en ningún
otro lado —una advertencia sobre `wrangler.jsonc`, una tabla de fallos comunes,
una decisión de diseño deliberada— y se le da una sola casa nueva. El objetivo
declarado no es "mantener las guías al día": es que **cada procedimiento tenga
un solo documento que lo cuente**, porque un documento que no puede fallar en
rojo solo se corrige si deja de tener con quién competir.

---

**24 · La primera corrida de verdad, y lo que solo ella podía enseñar.** El 18
de septiembre de 2026, `npm test` se corrió por primera vez con un Chromium de
verdad —no la lectura de código, no el cálculo a mano contra el emulador: el
navegador real, el mismo motor que corre en `montar.yml`— sobre las diez
baterías que la sesión anterior había reescrito para dejar de nombrar el
catálogo de Orgánico. Tres cosas se cayeron, y ninguna se había visto antes
porque nada, hasta ese momento, las había ejercitado de verdad:

Un typo en `e2e.js` —`=== 24` donde debía decir `=== 18`— sobrevivió a la
lectura porque *leer* una aserción y *ejecutarla* no es lo mismo: la primera
solo pregunta si el texto tiene sentido, la segunda pregunta si es cierto. Un
cálculo mal hecho en `val.js` —el total esperado era el subtotal con descuento
y sin envío, no el total— sobrevivió por la misma razón. Y `servidor.js`
tenía un bug de verdad, no de la sesión anterior: `/__reiniciar` limpiaba la
hoja emulada pero nunca volvía a llamar `configurar()`, así que cada sección de
`e2e.js` arrancaba sobre una tienda de fábrica —sin nombre, sin cupones, sin
tarifas— y el pedido se perdía en silencio. Nueve baterías más lo usan sin
darse cuenta cada vez que `todas.sh` arranca el servidor por primera vez, que
sí llama `configurar()`; solo `e2e.js`, reiniciando a mitad de su propia
corrida, podía tropezar con la ausencia.

`respaldo.js` enseñó algo más incómodo: dos de sus propias aserciones —una
escrita esta misma semana— estaban comprobando el archivo equivocado.
`plantilla/index.html` ya había cambiado «tomate» por «redondo», y esta
bitácora ya lo daba por corregido en todas partes. Pero lo que de verdad sirve
`arnes.mjs` a las baterías es `publicar/index.html` —el snapshot de Orgánico,
sin rehornear— y ESE archivo seguía diciendo «tomate». Revisar el código fuente
correcto y comprobar el archivo servido incorrecto puede dar el mismo
diagnóstico por casualidad, o el contrario por la misma casualidad; esta vez
dio el contrario, y solo abrir la página de verdad lo mostró. El canario
«ESTA BATERÍA DISTINGUE» —el que existe justamente para probar que la
comprobación de arriba prueba algo— había dejado de distinguir por una razón
parecida: su control negativo leía el mismo `index.html` que `arnes.mjs` ya
había sobrescrito con el respaldo de la hoja emulada, así que para cuando
llegaba ahí ya no quedaba nada de Orgánico que detectar. El control negativo
que sí sigue siendo negativo es `publicar/index.html` directo del
repositorio, el único archivo de la corrida al que nada le escribe un
respaldo antes de que esta batería lo lea.

La regla, que ya estaba en el ítem 22 y que esto vuelve a confirmar desde el
otro lado: **una suite verde en la lectura es una hipótesis sobre una
hipótesis.** No alcanza con que el código parezca correcto ni con que el
cálculo a mano cuadre: hay una clase de error —el typo que el ojo salta, la
función que dejó de llamar a la que la completaba, el control negativo que
dejó de ser negativo— que solo se ve corriendo la cosa de verdad, con las
piezas de verdad, de punta a punta. 1350 de 1364 aserciones en rojo o verde
sobre un Chromium real; lo que falta son cuatro baterías con deuda ya
documentada antes de esta sesión —`pedidos.js`, `correo.js`, `tablero.js`,
`calendario.js`, con su propio catálogo simulado atado al de Orgánico— y una
sola aserción de `montaje.js` que aparca el alta a propósito.

De paso, `todas.sh` seguía cortándose en Windows/Git Bash con «No such file or
directory», y aquí se dio por diagnosticado: una trampa EXIT que los subshells
heredaban mal. **Ese diagnóstico era falso**, y costaron otras tres
correcciones —cada una con su explicación convincente— antes de leer el mensaje
por lo que decía. El ítem 25 lo cuenta.


---

**25 · El error decía el nombre del archivo equivocado, y lo dijo cuatro
veces.** El 18 de septiembre de 2026, `npm test` llevaba cuatro intentos sin
terminar solo en la máquina del operador —Windows, Git Bash—. Cada intento
falló distinto, y cada uno dio pie a una explicación que se sostenía:

```
./todas.sh: line 132: /tmp/tmp.L7uZM86XYp/e2e.js: No such file or directory
./todas.sh: line 140: /tmp/tmp.aQSIdscTwZ/movil.js: No such file or directory
environment: line 18: /tmp/tmp.aQSIdscTwZ/e2e.js: No such file or directory
ejecutar-bateria.sh: line 65: /tmp/tmp.PSNAF4aXSX/e2e.js: No such file or directory
```

Se leyó cuatro veces como «no encuentra la batería `e2e.js`», y de ahí salieron
cuatro arreglos sobre la herencia entre subshells: una guardia por PID, después
`trap - EXIT` al entrar a la función, después las funciones exportadas con
`export -f`, después cada batería en su propio archivo. Cada uno cambió el
número de línea del mensaje, ninguno lo quitó — que era exactamente la pista.

Lo que decía el mensaje es otra cosa. Esas líneas son siempre las dos que
redirigen la salida de la batería: `> "$SALIDA/$f"` y `>> "$SALIDA/$f"`. Bash
monta las redirecciones ANTES de ejecutar el comando, y cuando no puede abrir
el destino lo reporta con la ruta del DESTINO. No faltaba `e2e.js`: faltaba el
directorio `/tmp/tmp.XXXX` donde había que escribirlo. En Git Bash el `/tmp` de
la shell y el que usa `mktemp.exe` no son forzosamente la misma carpeta de
Windows, así que `mktemp -d` creaba un directorio, imprimía una ruta de estilo
Unix, y esa ruta no resolvía al mismo sitio. Ninguna batería llegaba a arrancar
node, y como ninguna escribía una línea, el marcador salía vacío.

El cuelgue de cinco minutos era una segunda avería, tapada por la primera: el
portero del cupo de trabajadores preguntaba `$(jobs -rp | wc -l)`, y la tabla
de trabajos que ve un `$( )` es la de su propio subshell. En Git Bash seguía
enseñando corriendo a los dos trabajos ya muertos, la condición no bajaba
nunca, `wait -n` volvía en el acto porque no quedaba a quién esperar, y el
bucle giraba en vacío quemando un núcleo hasta que alguien apretaba Ctrl+C.

El arreglo no es ingenioso y por eso funciona: la salida se guarda en
`pruebas/.salida/`, una carpeta del repositorio que resuelve igual en toda
máquina —y que además queda, así que la salida entera de la batería que falló
se puede abrir después, en vez de borrarse sola—; el cupo se lleva anotando
PIDs y esperando al más viejo con `wait <pid>`; y no hay trampa EXIT que
heredar, porque lo que deje vivo una corrida cortada lo barre la siguiente por
los PID que dejó anotados.

La regla: **cuando un error nombra una ruta, la pregunta es qué se estaba
haciendo CON esa ruta** —abrirla para leer, para escribir, ejecutarla— y no qué
archivo del proyecto se llama parecido. El nombre de un archivo dentro de un
mensaje no lo convierte en el sujeto de la frase. Y el corolario, que es el
patrón 6 otra vez y duele más: **cuatro arreglos distintos que fallan igual no
son cuatro hipótesis descartadas, son una hipótesis equivocada probada cuatro
veces.** Cuando el segundo intento falla con la misma forma que el primero, lo
que hay que volver a leer es el mensaje, no el código.

Y en la misma corrida, la otra mitad del rojo: `pedidos.js`, `correo.js` y
`tablero.js` colgaban de un catálogo que ya no existía. La historia A-5 cambió
lo que siembra `instalar()` —dos filas de EJEMPLO inactivas, que es lo que
debe ver un comercio recién instalado— y esas tres baterías llevaban años
tomando prestado ese catálogo para probar inventario, agotados y más vendidos.
El propio plan lo había advertido por escrito: «la hoja emulada de las baterías
es otra cosa y no cambia; confundir las dos ya costó diez baterías en rojo una
vez». Volvió a costar cuatro. Ahora cada una pide su tienda con `configurar()`
y siembra a mano las existencias flojas que necesita mirar, en la prueba que
las mira — no en la semilla, que es de otro dueño.

---

**26 · Una X roja que no significaba nada, y la frase que la mantuvo viva.** El
18 de septiembre de 2026 corrió el primer `montaje` de este repositorio. Hizo
todo bien: leyó la hoja, bajó las fotos, horneó el catálogo, corrió las 29
baterías sobre los archivos ya escritos, abrió el pull request #1 y lo fusionó.
Y dejó una X roja: la corrida de `pruebas` disparada por ese pull request quedó
**retenida esperando la aprobación de un mantenedor**, nadie la aprobó —el flujo
ya había seguido— y caducó con «This workflow run required approval but was not
approved before it expired».

El daño no es la X: es lo que enseña. Una marca roja sobre un trabajo que salió
perfecto entrena a no mirar las marcas rojas, y la siguiente sí va a importar.

Lo desconcertante es que **esta lección ya estaba aprendida y escrita**, con
todas sus letras, dentro de este mismo repositorio. `fotos.yml` la lleva en un
comentario de dieciséis líneas: «abrir uno y fusionarlo en el mismo segundo no
era ceremonia inútil: era una X roja garantizada […] la retención es de la
CORRIDA: pasa antes de que se evalúe ninguna condición del trabajo». `fotos`
dejó de abrir pull request y empezó a empujar directo a `main`. `montaje` nunca
recibió el arreglo.

Y hay un tercer archivo en la historia, que es lo que la vuelve un caso de
manual. `pruebas.yml` se salta el pull request de `fotos` por esta razón
exacta, y a continuación explica por qué el de `montaje` sí se sigue
comprobando: «ese pull request espera a una persona». Era verdad cuando se
escribió. Dejó de serlo cuando `montaje` empezó a fusionar solo, y nadie volvió
a esa frase. Así que el comentario que describía la excepción **se convirtió en
la causa**: mientras dijera eso, la condición no cubría a `montaje`, y mientras
no lo cubriera, la X estaba garantizada.

Tres archivos, una sola regla, y solo uno al día: es el patrón 2 otra vez, pero
con una vuelta de tuerca que conviene anotar aparte. Aquí la copia atrasada no
era un dato duplicado —una lista, una versión, un menú—: era **una
justificación**. Un comentario que explica por qué algo es una excepción tiene
la misma obligación de estar al día que el código, y falla peor, porque una
justificación obsoleta no se ve obsoleta: se lee como una decisión pensada y
frena a quien iba a corregirlo.

El arreglo es el que el plan ya pedía por escrito (`PLAN-MVP.md` §4.7: «se
hornea, se prueba y se empuja a main sin que nadie apruebe nada»): `montaje`
publica directo en `main`, no abre pull request ninguno salvo que se le pida a
mano —la casilla del formulario ya existía y no servía para nada—, y `pruebas`
se salta los pull requests del bot vengan de `fotos` o de `montaje`. Las guardas
que sí protegen no se tocaron: solo se indexa `publicar/`, la identidad de la
hoja se comprueba antes, y ninguna batería puede estar en rojo para llegar a
publicar.

La regla: **cuando se retira el motivo de una excepción, hay que ir a buscar
dónde está escrita esa excepción.** El código que la implementaba se corrigió
—`montaje` dejó de esperar a una persona— y el comentario que la razonaba
sobrevivió en otro archivo, sosteniendo el comportamiento viejo. Un `grep` del
motivo, no del mecanismo, es lo que lo habría encontrado.

---

**27 · Medir antes de decidir, con una batería que llevaba meses sin correr.**
El 18 de septiembre de 2026, al empezar el hito M1, había que resolver una
historia binaria: `limites.js` levanta un navegador, mide cinco tamaños de
catálogo y **no estaba en la lista de `todas.sh`**, así que no corría nunca. La
historia decía «o entra o se va», y la intuición decía que se va: M1 existe para
recortar minutos de Actions, y una batería con navegador es lo caro.

La intuición estaba equivocada por un factor grande. Medida, la corrida entera
cuesta **menos de tres segundos**: reutiliza un solo navegador para los cinco
tamaños y la página pinta rápido en todos. El número que sostenía la intuición
—«las doce baterías con navegador son el 99 % de la suite»— es cierto y no
aplicaba: lo caro de esas doce no es abrir el navegador, es todo lo que hacen
después.

Así que entra, y entrando resultó valer más de lo que parecía. La afirmación que
justifica tenerla es una que ninguna otra batería podía hacer: **a la primera
pantalla llegan 25 tarjetas tanto con 50 productos como con 1000.** Todas las
demás prueban con ocho productos, así que el día que alguien rompa la
paginación, ninguna se entera — y la tienda de un comercio con catálogo grande
le pide mil tarjetas de golpe al teléfono de su cliente.

Lo que NO se afirma también es una decisión: los milisegundos se imprimen y no
se comprueban. Una aserción sobre tiempos se cae sola un martes por la tarde en
un runner cargado, y una comprobación que falla por algo que está bien enseña a
ignorarla — que es el mismo daño del ítem 26, la marca roja que no significa
nada. El reloj es una entrada que nadie declaró (patrón 8): sirve para informar,
no para decidir.

La regla: **una historia binaria —«o entra o se va»— se contesta midiendo, no
razonando por categoría.** «Es una batería con navegador, luego es cara» es un
razonamiento sobre la clase, y la clase tenía dentro un caso que costaba tres
segundos. El hito entero se llama «medir antes de tocar nada»; la primera cosa
que midió fue una decisión propia.

Y de paso, la otra mitad de M1 que sí salió de un número: el cron de `fotos`
corría **cada cuatro horas** —seis arranques diarios, medidos como el 84 % de
los minutos de una tienda— para cazar fotos subidas al Drive sin avisar. Ahora
corre una vez al día y **no publica**: mira, avisa y se retira. Que no publique
no es un detalle de implementación, es lo que separa una red de seguridad de un
publicador automático: si el comerciante dejó seis fotos a medio subir, su
tienda no debería salir a producción a las tres de la mañana con el trabajo a
medias.

---

**28 · Las dos guardas que cazaron a quien las escribió.** El mismo día, al
montar la medición de tiempos del hito M1, dos aserciones del propio
repositorio se pusieron en rojo contra el cambio que las estaba estrenando. Las
dos tenían razón, y por motivos distintos que conviene separar.

La primera fue `escribe.js`, la batería de A-8 —«cada herramienta declara lo que
escribe»—. La herramienta nueva declaraba escribir `tiempos.json`, y además
abría `process.env.GITHUB_STEP_SUMMARY` para pegar ahí su tabla. Parecía
inofensivo: es el archivo que el runner ofrece justo para eso. Pero **una ruta
que sale del entorno no se puede declarar**, y una herramienta que escribe donde
su declaración no llega es exactamente el agujero que A-8 existe para tapar. El
arreglo dejó el diseño mejor de lo que estaba: la herramienta escribe un
`tiempos.md` que sí declara, y el flujo lo concatena — que es, además, como
funcionan todos los demás pasos de estos flujos desde siempre. La guarda no
señaló un descuido: señaló que había dos formas de hacer lo mismo y se estaba
usando la peor.

La segunda fue más incómoda. Una aserción comprobaba que `DESPLIEGUE.md`
documenta todos los campos del formulario de `montaje`, y lo hacía así:
`campos.length === 4 && campos.every(...)`. Al añadir el campo `sin_guardia` se
cayó — **y el documento estaba bien**. Lo que estaba mal era el `4`: una cifra
escrita a mano dentro de la comprobación que existe precisamente para cazar
cifras escritas a mano. El comentario encima de esa línea lleva meses contando
que el runbook hablaba de dos campos cuando el formulario tenía cinco.

La regla: **una guarda contra un número a mano no puede llevar un número a
mano.** Y la general, que es la que vale para las dos: una aserción que se cae
contra un cambio legítimo no siempre está defendiendo algo — a veces está
pidiendo que la arreglen a ella. Distinguir los dos casos es el trabajo, y la
respuesta está en qué se rompió: si lo que falla es el criterio, se corrige el
código; si lo que falla es la forma de medirlo, se corrige la aserción. Darlas
por buenas siempre y darlas por molestas siempre son el mismo error con distinto
signo.

---

**29 · La prueba que solo fallaba donde nadie la miraba.** El 18 de septiembre
de 2026, midiendo cuántas baterías conviene correr a la vez, la suite se puso en
rojo a las 19:02 hora de Colombia. Dos aserciones de `montaje.js`, sobre el
nombre de los respaldos de la hoja. A las 18:00 estaban verdes. No se había
tocado una línea.

El maestro nombra cada copia con `diaDeHoy()`, que arma la fecha con
`getFullYear/getMonth/getDate` — la fecha **local**. Las dos aserciones
comparaban contra `new Date().toISOString().slice(0, 10)` — la fecha **UTC**.
Colombia va cinco horas por detrás, así que desde las 19:00 hasta la medianoche
las dos fechas son días distintos, y la comparación se caía.

Lo importante no es el error: es **dónde no se veía**. Los runners de GitHub van
en UTC, donde las dos fechas coinciden siempre. Así que esto era verde en CI las
veinticuatro horas del día, todos los días, y rojo cinco horas diarias en la
máquina de cualquiera que trabaje desde Colombia — que es donde está el equipo.
Una prueba que solo falla donde nadie la mira es peor que una que falla siempre:
la que falla siempre se arregla el primer día.

Y el maestro tenía razón. Un comercio colombiano quiere sus respaldos fechados
con SU día, no con el de Greenwich. Lo que sobraba era la segunda copia de la
regla dentro de la prueba (patrón 2), así que se quitó: las aserciones le
preguntan la fecha al maestro con `g.api.diaDeHoy()` en vez de recalcularla.

`calendario.js` existía justamente para esta familia de fallos —«una prueba que
depende de qué día se corre no prueba nada»— y no lo cazó, porque movía el DÍA
y dejaba el HUSO quieto. Ahora corre `montaje.js` a tres horas distintas con
`TZ=America/Bogota`, dos de ellas en la franja en que allá ya es otro día que en
UTC. Con el defecto puesto se cae en dos de las tres; sin él, en ninguna — que
es la condición para dar una comprobación por buena en esta casa.

La regla: **una prueba que depende del reloj no depende solo de la fecha.**
Depende de la fecha, de la hora y del huso, y las tres tienen que moverse en la
prueba que dice cubrir el reloj. Y el corolario, que es el que duele: cuando una
comprobación es verde en CI y roja en una máquina de verdad, la sospecha por
defecto no es «la máquina está rara» — es que CI está mirando un solo punto de
un espacio con más dimensiones.

De paso, la medición que destapó todo esto. `todas.sh` decía «un trabajador por
núcleo, hasta cuatro», razonando que cada trabajador es un Chromium y más
competirían por CPU. Medido en una máquina de DOS núcleos: 151 s con uno, 94 s
con dos, **73 s con cuatro**, 71 s con seis. Con el doble de trabajadores que de
núcleos el reloj sigue bajando, porque estas baterías no gastan CPU: **esperan**
—a que arranque su servidor, a que cargue la página, a que se cumpla un
`waitFor`—. Atarlos a los núcleos era contar el recurso equivocado. Ahora son
cuatro por defecto, que es donde está la rodilla.

---

**30 · Lo que se repite no se nota; lo que se repite en otro archivo, menos.** El
18 de septiembre de 2026, cerrando el hito M1, se contaron las peticiones que el
flujo `fotos` le hace al maestro en una corrida. Salieron **siete**, y tres eran
la misma pregunta hecha dos veces: `bloques`, `fotos` y `catalogo`.

Nadie las duplicó a propósito ni por descuido. El flujo tiene dos pasadas —una
de `--revisar`, que mira si hay algo que hacer, y otra de publicar, que lo hace—
y cada herramienta pregunta lo suyo cuando le toca. Cada una, por separado, está
bien escrita. La duplicación no vive dentro de ninguna: vive en el hecho de que
se llaman dos veces, y eso no se ve leyendo ninguno de los archivos.

Y costaba caro por una razón que tampoco está escrita en ellos: **Apps Script
arranca en frío**. La primera llamada después de actualizar una implementación
tarda cuarenta segundos o más, documentados, y siete llamadas en serie son siete
oportunidades de pagarlo — en el camino crítico de publicar una foto, que es la
queja con la que empezó todo este hito.

El arreglo tiene dos decisiones que vale la pena separar de la mecánica.

La primera: **dónde vive la lectura del sondeo**. La tentación era darle a cada
herramienta un `--desde` propio. Serían siete sitios donde acordarse, y la que
se olvidara seguiría preguntando sin que nadie lo notara, porque funcionaría
igual. Se puso dentro de `alMaestro`, por donde pasan TODAS las preguntas. Ni
una sola herramienta cambió una línea, y no hay forma de que el mecanismo quede
a medias.

La segunda: **caduca a los diez minutos**, y eso es lo que lo separa de una
caché. Una caché sobrevive entre corridas, y entonces un montaje puede publicar
el catálogo de hace una hora sin que nadie se entere — un modo de fallo que este
proyecto lleva persiguiendo desde el primer día, porque no rompe nada: funciona,
y miente. Vencido, se dice en voz alta y se pregunta al maestro. El camino
lento, nunca el dato viejo.

Se cuenta de verdad. `sondeo.js` levanta un maestro de mentira que anota qué le
piden y corre las herramientas contra él, con `--desde` y sin. Una aserción
sobre el texto del archivo habría dicho que la llamada está escrita; solo quien
la recibe sabe si se hizo.

La regla: **una redundancia entre dos llamadas no se ve en el código de
ninguna de las dos.** Se ve contando lo que sale por el cable. Y la forma barata
de contarlo es la misma de siempre: poner al otro lado algo que lleve la cuenta,
en vez de leer más atentamente.

Un apunte de método, del mismo día: la primera versión de esa batería se plantó
entera. El maestro de mentira vivía en el proceso de la batería y los hijos se
lanzaban con `execFileSync` — que bloquea el bucle de eventos, así que el
servidor no podía contestar y todos esperaban el tope de noventa segundos. Un
servidor y una espera síncrona no caben en el mismo bucle. El síntoma —«se
cuelga»— no se parecía en nada a la causa, otra vez.

---

**31 · La tienda era invisible para quien no ejecuta JavaScript.** El 19 de
septiembre de 2026, empezando el hito M2, se miró qué ve Google al entrar a una
de estas tiendas. La respuesta: **nada**. Ni un producto, ni un precio, ni el
nombre del comercio en un sitio donde un rastreador lo busque.

No era un defecto: era una consecuencia que nadie había puesto en palabras. La
tienda pinta su catálogo desde JavaScript —fue la decisión correcta, y sigue
siéndolo— y los rastreadores no ejecutan JavaScript, o lo ejecutan tarde y a
regañadientes. Así que la página que se indexaba era la plantilla vacía. El
comerciante paga un dominio, publica su catálogo, y no sale en ninguna búsqueda.

Y es el modo de fallo que este proyecto lleva persiguiendo desde el primer día,
en su forma más pura: **no rompe nada**. La tienda se ve perfecta, el pedido
llega, el inventario baja. Simplemente no existe para quien la busca, y eso no
da error nunca.

La respuesta es la que ya había tomado el proyecto dos veces —para el catálogo y
para el respaldo—: **se hornea**. `montar/sembrar-seo.mjs` escribe en el HTML el
JSON-LD del comercio, del sitio y de cada producto con su oferta, y genera el
`sitemap.xml` y el `robots.txt`. Sale de `publicar/catalogo.json`, que se horneó
unos segundos antes, y no de otra pregunta al maestro: la tercera vez que se
toma esa decisión por la misma razón.

Dos detalles que valen más que la mecánica.

**Lo que está entre corchetes no existe.** La hoja siembra `[DIRECCIÓN]` y
`[RAZÓN SOCIAL]` como forma de decir «esto todavía no lo tengo», y la tienda ya
los esconde al pintar. Publicárselos a Google habría sido peor que omitirlos: un
dato de contacto falso en datos estructurados acaba en una ficha de empresa
equivocada, y eso lo arregla el comerciante por teléfono con Google, no nosotros
con un commit. La regla de esconder ya existía en un sitio; ahora existe en los
dos, y una batería lo comprueba con una dirección sin llenar a propósito.

**Sin fecha del día.** El `sitemap.xml` no lleva `<lastmod>`. Tenerlo es lo
natural y habría roto el determinismo de A-6: cada horneado parecería un cambio
y publicaría por nada — justo el gasto que M1 acababa de recortar. Dos hitos
seguidos tirando en direcciones opuestas sobre el mismo archivo, y el único
motivo por el que se vio es que A-6 dejó una aserción puesta.

La regla: **una decisión de arquitectura correcta puede tener una consecuencia
que nadie eligió.** Pintar desde JavaScript fue lo correcto y trajo gratis, sin
que nadie lo decidiera, que la tienda fuera invisible. Esas consecuencias no
aparecen en ninguna prueba, porque no son fallos de nada: hay que ir a
buscarlas preguntando qué ve cada uno de los que miran —el comprador, el
comerciante, y el que no ejecuta JavaScript.

---

**32 · Las dos direcciones del fallo no son la misma, y hay que elegir cuál para
cada dato.** El 19 de septiembre de 2026 se empezó C-1, las variantes: un labial
en tres tonos sin crear tres productos. La parte interesante no fue la sintaxis
ni el parseo — fue darse cuenta de que el mismo cambio necesita las DOS reglas de
fallo de esta casa, en sitios distintos y a propósito.

**El catálogo falla abierto.** Una celda `Variantes` que no se entiende NO saca
el producto de la tienda: lo deja a la venta sin variantes y reporta la celda.
Porque vender un labial sin tono deja un pedido que el comerciante resuelve con
un mensaje, y no venderlo es una venta perdida y callada.

**El pedido falla cerrado.** Una elección que el comercio no ofrece TUMBA LA
LÍNEA. Porque guardarla sería dejar un pedido que nadie puede despachar, y
adivinar cuál tono quiso decir es peor todavía.

Las dos son la misma regla vieja —«fallo abierto en el catálogo, fallo cerrado
en los cupones»— aplicada a un dato nuevo, y el trabajo fue decidir de qué lado
cae cada mitad. La batería las fija juntas, una al lado de la otra, con una
aserción que comprueba que un PRECIO ilegible sigue tumbando el producto: sin
esa aserción de contraste, alguien podría «unificar el criterio» algún día y
romper una de las dos sin notarlo.

Y una consecuencia que no estaba en el plan y salió sola al escribir la prueba.
La clave que evita líneas duplicadas en un pedido era el id del producto. Con
variantes eso significa que **dos tonos del mismo labial se convertían en uno**:
el comprador pedía Rosa y Nude, y recibía Rosa. La clave pasó a ser producto +
variante — y eso, a su vez, obligó a llevar la cuenta del stock por producto,
porque las dos líneas compiten por las mismas existencias (el stock es del
producto, no de la variante: decisión consciente de C-1, con su disparador
escrito para revisarla). Tres cambios encadenados que nadie había listado,
descubiertos por escribir la aserción antes de darla por buena.

La regla: **una decisión de diseño no se aplica a un dato nuevo copiándola,
sino preguntándole al dato cuál de sus mitades va de cada lado.** «Fallo abierto»
no es una propiedad del proyecto: es una propiedad de cada campo, y el mismo
cambio puede necesitar las dos.

Y el apunte de método: `esquema.js` cazó dos cosas el mismo día. Que la clave
nueva de `Configuración` se había metido EN MEDIO —R1 dice «solo se agrega, y
solo al final»— y que las columnas nuevas no estaban en `CONTRATOS.md`. El
contrato escrito y el contrato que corre son dos copias del mismo procedimiento,
y esa batería es la cuerda que los ata: sin ella, el documento se habría quedado
atrás ese mismo día.

---

**33 · El separador que nadie declaró, y la función escrita tres veces.** Ese
mismo 19 de septiembre se cerró C-1 por la página, y las dos cosas que costaron
no eran el selector.

**La primera: la línea del pedido ya tenía dueño.** El carrito le manda a la
hoja una cadena `id:cantidad`, separadas por comas. Meter la elección ahí
significa un tercer campo —`id:cantidad:Talla=M;Color=Rosa`— y con él **cinco
caracteres pasan a ser estructura**: `,` `:` `;` `=` y el `|` que ya venía de la
hoja. Un comercio que llame a una talla `40,5` —que es exactamente como se
numeran los zapatos en media Europa— parte la línea en dos y el pedido llega
diciendo otra cosa, sin error, sin aviso y sin nada que mirar.

No hay forma de adivinar qué quiso decir, así que se aplica la regla de la casa:
**el grupo entero se cae, el producto sigue a la venta sin esa elección, y queda
dicho en la consola.** Fallo abierto, como el resto del catálogo. Lo que no se
podía hacer era pintar un selector cuya respuesta no cabe en el sobre.

El apunte general: **un formato de texto sin escapes no tiene «un separador»,
tiene tantos como campos le vayas añadiendo**, y cada uno le prohíbe un carácter
a un dato que escribe una persona que no sabe que existe. Se documentó en
`CONTRATOS.md` al lado del campo, no en el código, porque a quien le va a pasar
es al comerciante.

**La segunda: `i.id + ":" + i.cantidad` estaba escrito a mano en tres sitios**
—la firma del pedido, la validación y el registro—. Patrón 2 de siempre, pero en
su forma más cara: bastaba olvidar uno para **sellar un pedido y registrar otro**
—la hoja confirmando el precio de «dos labiales» y el comercio recibiendo dos
tonos que nadie validó—. Pasaron a ser una sola función. Mientras el formato fue
`id:cantidad` las tres copias podían convivir años sin divergir; el día que el
formato creció, las tres tenían que cambiar a la vez o el fallo era invisible.
**Una duplicación inofensiva es solo una duplicación que todavía no ha tenido
motivo para divergir.**

Y el método, otra vez: la batería nueva se corrió con cuatro defectos puestos a
propósito —sin obligar a elegir, con la clave solo por id, sin la elección en la
línea, y con el stock contado por línea— antes de darla por buena. Los cuatro
salieron rojos. El primero enseñó algo de rebote: con la obligación quitada, la
batería no fallaba, **se colgaba treinta segundos** esperando un selector que el
propio defecto había cerrado. Una prueba que se cuelga en vez de contar lo que
falló es media prueba, así que cada tramo abre la ficha por su cuenta en lugar
de dar por hecho que sigue abierta.


---

**34 · Un control que ordena y no ordena.** C-4 parecía la historia más pequeña
del hito —dos puntos, una línea en el plan— y trajo la decisión más fácil de
equivocar, precisamente porque la respuesta cómoda suena a respeto.

El catálogo ponía los destacados delante. Al agregar «ordenar por precio», el
primer impulso —y lo que hace casi cualquier tienda— es **conservar** el
destacado arriba: es una decisión del comerciante, ¿por qué la iba a pisar un
selector? La respuesta es que **el comprador no puede saber que la está
pisando**. Ve «Precio: de menor a mayor», ve arriba un producto de $28.000, y la
única conclusión disponible es que ese es el más barato que hay. No hay marca,
no hay asterisco, no hay forma de enterarse. Un control que promete un orden y
entrega otro no es una concesión al comerciante: es una mentira, y encima una
que solo perjudica al que compra.

Así que destacar quedó definido como **una posición dentro del orden del
comercio, no una chincheta que gana siempre**. Cuando el comprador pide un
orden, la lista es ese orden y nada más. La insignia «Destacado» sigue ahí —eso
es información, no posición— y el comercio sigue mandando en la ENTRADA, que es
donde su decisión vale.

Y el cambio que nadie había pedido. Para que «Como en la hoja» fuera una opción
de verdad, `VISIBLES` tuvo que dejar de guardarse ya reordenado con los
destacados delante: guardarlo así **borraba para siempre el dato «en qué orden
lo escribió el comercio»**. Una lista ordenada al guardar parece un ahorro —se
ordena una vez en lugar de en cada pintado— y lo que hace es perder información
que todavía no sabías que ibas a necesitar. El orden se aplica ahora al pintar.

Eso destapó una aserción vieja de `hoja.js` que preguntaba «¿van los destacados
primero?» **mirando la lista interna**. Pasó en verde durante meses porque hasta
ese día la lista interna y la pantalla decían lo mismo; el día que dejaron de
decirlo, la aserción se cayó — y estaba bien que se cayera, porque lo que quería
saber era lo que ve el comprador y llevaba todo ese tiempo preguntándoselo a
otro. **Una prueba que mira el estado interno está midiendo la implementación,
no el comportamiento, y solo se nota cuando la implementación cambia.** Ahora
mira la rejilla, y cuenta las insignias contra la hoja y no contra la pantalla,
para que las dos líneas no digan lo mismo.

Lo pequeño que también costó: ordenar por nombre con `a.nombre < b.nombre`
manda «Ñame» detrás de «Zanahoria», porque compara números de carácter y la Ñ
vive después de la Z. En un catálogo colombiano eso se ve el primer día.
`localeCompare(b, "es")` y una aserción que lo fija con ese mismo producto.


---

**35 · El emulador decía que sí a cualquier cosa, y llevaba meses haciéndolo.**
D-1 empezó con una función de una línea en `pruebas/gas.js`:

```js
computeDigest: (alg, txt) => Array.from(Buffer.from(String(txt)))
```

Eso es la **identidad** con nombre de hash: devuelve los bytes del texto sin
tocarlos. Llevaba ahí desde que el emulador existe y nunca importó, porque nada
del maestro usaba `computeDigest`. El día que algo lo usara —guardar una clave—
cualquier aserción del tipo «la clave no se puede leer dentro de la huella»
habría pasado en verde sobre una huella que era la clave en claro.

No es un fallo del código: es un fallo del **instrumento**, y esos no los caza
ninguna prueba porque son el aparato con el que se mide. La regla que deja:
**un emulador puede mentir en lo que todavía nadie usa, y el día que alguien lo
use la mentira llega intacta y disfrazada de verde.** Antes de apoyar una
decisión nueva en una pieza del emulador, se mira si esa pieza está de verdad
implementada. Ahora `computeDigest` y `computeHmacSha256Signature` son el crypto
de node — y devuelven los bytes CON SIGNO, que es como los devuelve Apps Script,
para que olvidarse del `& 0xff` al pasarlos a hexadecimal se rompa aquí igual
que se rompería en Google.

Y dos decisiones de la historia que tienen poco que ver con criptografía:

**Los errores que no se distinguen.** «Usuario o clave que no corresponden» es
una sola frase para las dos cosas, y «Sesión no válida» una sola para «caducó»,
«esa firma no es mía» y «ese testigo es de otra tienda». No es discreción: dos
mensajes distintos convierten el formulario en un **buscador de usuarios** —se
prueban nombres hasta que cambia la frase— y al que entró bien no le sirven de
nada, porque haga lo que haga tiene que volver a entrar. La aserción está
escrita comparando los dos textos con `===`, para que separarlos algún día
«para ayudar al usuario» salga en rojo.

**Y el contador cuenta los intentos de usuarios que no existen.** Contar solo
los del usuario bueno es lo natural y es justo lo contrario de lo que hace
falta: el contador se vuelve el detector — se prueban nombres y el que bloquea,
existe.

**36 · Once puertas, once guardias escritas a mano.** El maestro despachaba con
una escalera de `if`, y cada función comprobaba su token por dentro. Funciona
perfectamente hasta que alguien agrega la doce y se le olvida la suya — y ese
olvido **no se ve**, porque una puerta sin guardia se comporta exactamente igual
que una puerta que funciona. No falla, no avisa, no sale en ningún log: contesta.

Ahora cada puerta declara a quién deja pasar en una tabla, la guardia se aplica
en un solo sitio, y `esquema.js` fotografía la lista de puertas: una nueva
obliga a un `--congelar`, que es un acto deliberado que aparece en el diff para
que alguien lo mire. Se quitaron seis comprobaciones duplicadas.

El detalle que parece paranoia y no lo es: una guardia con un nombre que no
existe **no deja pasar**. La alternativa —seguir de largo si no se reconoce la
guardia— significa que una errata en un nombre abre la puerta de par en par, y
que la forma de fallar del sistema de permisos sea «permitir». Un permiso que
falla abierto no es un permiso.

Y el rojo que enseñó algo de rebote: agregar la séptima opción al menú rompió
una aserción que exigía que el stub de la hoja cupiera en 70 líneas. El stub no
estaba engordando — una opción cuesta exactamente una línea de la lista. Un tope
fijo convierte cada opción nueva en un rojo que no significa nada, y **un rojo
que no significa nada enseña a subir el número sin mirar**. El tope pasó a ser
«64 más una por opción», que es lo que de verdad se quería vigilar: el stub
creciendo por cualquier otra razón.


---

**37 · La clave iba en la dirección, y lo escribí yo en D-1.** `?a=entrar`
aceptaba el usuario y la clave por GET: `…/exec?a=entrar&u=dona.rosa&c=…`. Toda
la historia D-1 estaba construida alrededor de que la clave no quede escrita en
ninguna parte —ni en la hoja, ni en el repositorio, ni en una celda—, y la
propia puerta de entrada la dejaba en el historial del navegador del mostrador
y en los registros de Google. El comentario de esa misma sección advertía del
token de montaje «viajando en la barra de direcciones»; nadie lo leyó contra la
puerta nueva, empezando por quien lo escribió. *(mío)*

Se vio al diseñar D-2, al decidir cómo mandar el testigo en cada petición: la
respuesta obvia para el testigo —POST, en el cuerpo— era la misma que hacía
falta para la clave. Ahora `entrar` y todas las puertas del panel son **solo
por POST**, declarado en la tabla de puertas (`soloPost`), y por GET contestan
que no sin hacer nada — ni siquiera cuentan como intento fallido, porque si
contaran, cualquiera bloquearía la tienda con cinco visitas a una dirección.
`admin.js` no lo comprueba leyendo el código de la página: revisa **cada
petición que llegó al servidor**, incluida la dirección de los POST, y exige
que en ninguna esté la clave ni el testigo.

**38 · Lo que se leyó, no lo que hay.** El error que más se paga de un panel no
es de seguridad: es escribir la fila entera. El formulario se abre con 40 en
Stock; mientras está abierto se paga un pedido y queda en 37; el comerciante
corrige una tilde y guarda. La fila vuelve a decir 40. Nadie tocó el stock,
nadie vio nada raro, y la tienda ofrece tres croissants que no existen.

En la hoja eso no pasaba porque quien escribe ve lo que pisa. En el panel no lo
ve. Así que cada producto viaja con la huella de su fila tal como se leyó, y
guardar la exige: si la fila cambió entre medias, **no se escribe** y se dice.
Es la aserción central de `productos.js`, y la de `admin.js` la repite desde el
navegador cambiando la celda por detrás mientras el formulario está abierto.

La consecuencia que salió al hacer la foto: subirla cambia la fila (la celda
Imágenes), así que el formulario que la subió queda viejo por su propia mano. Si
la página no toma la versión nueva, el siguiente Guardar dice «este producto
cambió mientras lo editabas» — y lo cambió el comerciante, hace dos segundos.
**Un control de concurrencia se dispara también contra uno mismo**, y cada
escritura que hace la página tiene que devolver la versión con la que queda.

**39 · Tres aserciones que pasaban con el defecto puesto.** D-2 se escribió con
la regla de siempre —cada guardia se verifica ROJA con su defecto antes de
darla por buena— y la regla cazó tres, todas del mismo tipo:

- «La llave se suelta también cuando la operación falla» pasaba sin el
  `finally`. La falla que usaba era un rechazo educado (un precio ilegible),
  que vuelve por el camino normal y suelta la llave igual. La que importa es
  una **excepción** a mitad de escritura —cuota agotada, hoja protegida—. Ahora
  la prueba hace reventar la escritura.
- «Reintentar no duplica» pasaba con un número de operación NUEVO en cada
  reintento, porque el maestro rechaza el código repetido. No duplica, cierto;
  pero el comerciante lee «ya hay un producto con ese código» sobre el que
  acaba de crear. Lo que el mismo número compra es que el reintento **termine
  bien**, y eso es lo que se exige ahora.
- «Dice cómo subir la foto a mano» pasaba quitando la mitad del mensaje, porque
  la otra mitad seguía nombrando Drive y el archivo. Un defecto demasiado
  tímido no prueba la aserción; se rehízo quitándolo entero.

La lección es la misma que la del emulador en la entrada 35, un nivel más
arriba: **una aserción que pasa con el defecto está midiendo otro fallo**, y la
única forma de saberlo es poner el defecto. Y de paso, `admin.js` cazó un error
de verdad en la página: al guardar, el aviso «Guardado: … se verá al publicar»
se pintaba y se borraba en el mismo instante, porque recargar la lista limpiaba
los avisos. El comerciante nunca habría leído que tenía que publicar. *(mío)*

Del mismo tipo que la entrada 35, en el emulador: `LockService` era un objeto
que decía que sí a todo. Con eso «toda escritura va bajo llave» era imposible
de comprobar — una escritura con llave y una sin ella se veían igual. Ahora la
llave sabe si está tomada, y cada escritura del emulador queda anotada con eso.


---

**40 · El riesgo que ya existía, y que un botón de pago vuelve caro.** El 21 de
septiembre el dueño agregó al MVP cobrar en línea (M3.5) y, al mismo tiempo,
nombró un riesgo que la tienda tiene **hoy**: dos compradores pueden pedir la
última unidad a la vez. La hoja valida el stock al armar el pedido pero no lo
aparta — el inventario solo baja cuando el comerciante marca Pagado —. Mientras
el pago lo confirma una persona, eso se resuelve con un mensaje de disculpa y
nadie pierde plata. **Con un botón de pago, los dos pagan**, y a uno hay que
devolverle el dinero.

Por eso la primera historia de M3.5 no es el proveedor sino **apartar la
unidad** (E-1), y va antes. Un riesgo que hoy es barato no se deja para cuando
sea caro solo porque hoy nadie lo haya pagado.

Y la segunda lección vino de preguntarle al propio sistema qué puede hacer
antes de elegir proveedor: el maestro es un Apps Script, y su `doPost` **no ve
las cabeceras HTTP**. La mayoría de los avisos de pago van firmados en una
cabecera. Un aviso que no se puede verificar no puede marcar nada como pagado,
así que el aviso es solo un timbre y la verdad se le pregunta a la API del
proveedor. Eso se volvió el criterio que decide el proveedor (decisión 12), por
encima de la comisión. **Una restricción de la plataforma se lee antes de
comparar precios**, o se elige el más barato de los que no sirven.

Y de paso, por pedido del dueño: `instalar()` ya no imprime el código de la hoja
al final. Eran doscientas líneas en cada reinstalación —que es lo que se hace
para agregar una clave—, enterraban el resumen que había que leer y eran la
forma segura de pegar un stub viejo. Una aserción de `montaje.js` **exigía**
ese segundo camino; ahora exige que no exista. Y dos documentos decían que
«mirar el menú no comprueba nada» sin la excepción que D-1 acababa de crear: una
versión que agrega una opción al menú. Esa frase, leída al pie de la letra, es
la que hizo que la opción *Clave del panel* no apareciera hasta regenerar el
stub.

**41 · La tercera copia de la regla de venta, y el cupón que nunca se agotaba.**
D-3 hace que el panel cambie el estado de un pedido «con el mismo efecto que en
la hoja». Para probarlo había que mirar TODO lo que la hoja hace al cambiar un
estado, y ahí estaba: `recalcularResumen` decidía qué es una venta con
`indexOf('confirmado')`, una regla anterior a la lista de estados. «Pagado» —el
estado que el comerciante usa de verdad— no contaba en *Más vendidos* ni en los
usos de un cupón. **Un cupón con tope de 50 usos no se agotaba nunca.** Nadie lo
había visto porque el síntoma es la ausencia de algo. Es el patrón 2 otra vez:
`esVenta` ya existía y ya lo usaban el inventario y el tablero; esta era la
tercera copia de la regla, escrita antes que las otras dos y nunca migrada.
Arreglado con `esVenta`, y el panel y `alEditar` llaman ahora a la misma
función (`trasCambiarEstado`) en vez de a dos listas de pasos. La prueba
(`panelpedidos.js`) gasta un cupón de un uso con un pedido *Pagado* y se
verificó en rojo con la regla vieja puesta.

**42 · Una constante que nacía con huecos.** `HOJAS_QUE_SE_PUBLICAN` se declaró
como `[H_CATALOGO, H_CONFIG, H_ENVIOS]` arriba del archivo, antes de que esas
tres existieran. En Apps Script el archivo se ejecuta de arriba abajo: la lista
nació `[undefined, undefined, undefined]` y «editar el Catálogo a mano» nunca
habría marcado cambios sin publicar. Pasó las pruebas del panel —que guardan
por el panel— y lo cazó la de la hoja. Ahora es una función. Y como el hueco es
de una clase entera y no de esa línea, `esquema.js` tiene una aserción nueva:
**ninguna constante del maestro nace con `undefined` dentro**. Se comprobó en
rojo devolviendo la lista a su forma vieja.

**43 · La prueba que fallaba una de cada sesenta.** `entrar.js` se caía de vez
en cuando, y no era el código de entrar: el `getUuid` del emulador a veces daba
menos de 32 cifras hexadecimales (un número pequeño sin ceros a la izquierda) y
el testigo no pasaba su propia validación de forma. Arreglado en el emulador;
80 corridas seguidas limpias. Un rojo intermitente que se ignora enseña a
ignorar rojos: se persigue hasta la causa aunque la causa esté en la prueba.

**44 · Esperas que colgaban la corrida en vez de fallar.** Al verificar en rojo
la interfaz de D-3/D-4 —quitando el segundo toque de «Cancelar», o el error
junto al campo— la batería no decía FALLA: se quedaba colgada hasta que la
mataba el tope, sin una línea que leer. Las esperas nuevas de `admin.js` ya no
revientan la corrida: si se agota, la aserción siguiente es la que falla y dice
por qué. Un defecto tiene que producir un rojo legible, o no sirve de control.
Queda escrito un hueco: el test de navegador solo ve la barra de publicar en el
estado «no está configurado» (el servidor de pruebas no tiene GitHub); los otros
estados los cubre `panelpublicar.js` del lado del maestro, no la página.

**45 · La llave que se soltaba sola.** Cobrar en línea tiene que escribir tres
cosas juntas —el libro de pagos, los datos de entrega y el acta de
Validaciones— bajo la llave de Apps Script, para que dos compradores no aparten
la misma unidad. El acta la escribía `sellar()`, que **toma la llave y la suelta
al terminar**. La llave de Apps Script no se anida: pedirla otra vez la da, y
soltarla la suelta para todos. Así que el acta, escrita primero, dejaba el libro
de pagos y los datos de entrega escritos SIN llave. Lo cazó el emulador desde
que la llave sabe si está tomada (D-2): `pagos.js` exige que cada escritura del
cobro vaya `conLlave`. Arreglado partiendo `sellar()` en dos —la llave, y
`escribirActa()` para quien ya la tiene—. Verificado en rojo volviendo a
`sellar()`. Es el tipo de fallo que en producción no se ve nunca, hasta el día
en que dos personas pagan la misma torta en el mismo segundo.

**46 · Los datos del comprador que se colaban por la puerta de atrás.** La
página guarda el cobro en `sessionStorage` para sobrevivir a la ida y vuelta de
la pasarela. La regla era no guardar nada del comprador —la misma de la bandeja
de salida— y el objeto que se guardaba lo cumplía… salvo por `checkout`, que es
lo que se le pasa a Bold y lleva dentro nombre, correo, celular y dirección. Lo
vio una traza de depuración, no una prueba. Ahora se guarda sin esos dos campos
—Bold los tiene como opcionales— y `pagoweb.js` busca el nombre, el celular, el
correo y la dirección en lo guardado. Verificado en rojo. La lección es la de
siempre con los objetos anidados: «no guardo X» se comprueba buscando X en lo
guardado, no leyendo el código que arma lo guardado.

**47 · El carrito que se perdía al volver de pagar.** Al volver de la pasarela
la página se recarga y arranca con el catálogo de RESPALDO, el que va horneado
en el archivo. El carrito guardado se filtraba contra ese catálogo, y un
producto dado de alta en la hoja después del último horneado no está ahí: el
carrito volvía vacío y el comprador que había sido rechazado no tenía qué
reintentar. Ahora el carrito vuelve tal cual y **no se sanea mientras hay un
cobro en pantalla** (es el pedido que el maestro ya firmó); se sanea al volver
al carrito, ya con el catálogo bueno. `pagoweb.js` lo prueba con un producto
que solo existe en la hoja.

**48 · Una prueba que miraba la pantalla que se estaba yendo.** La batería de
navegador leía el número del cobro justo después de pulsar «Pagar» — pero la
pasarela de mentira navega a la vuelta cincuenta milisegundos después, y a
veces el número era el de la página que se iba. El síntoma era un carrito
vacío, y parecía el fallo 47; no lo era. Se espera la vuelta, no el reloj. Y en
el camino: el servidor de pruebas escribía toda celda como texto, y el maestro
—con razón— no lee «1» escrito como texto como un número (una cifra que no se
puede leer no vale nada). Una hoja de verdad guarda un 1 tecleado como número;
`/__celda?num=1` hace lo mismo.

**49 · Lo que la otra línea hizo con sus Actions, y lo que ya teníamos.** El
dueño pidió comparar. De sus siete medidas, cinco ya estaban aquí desde M1, dos
no: `release` repetía la suite entera sobre el commit que el push ya había
probado, y `fotos`/`montaje` corrían las 45 baterías para publicar datos. Se
tomaron las dos, con una diferencia: allá la guardia corta se usa siempre; aquí
**solo si GitHub confirma que el último commit de código pasó la suite**. Si el
código entró en rojo, o no se puede preguntar, corren todas. Una guardia que se
salta pruebas tiene que saber por qué se las puede saltar — si no, es un atajo.
Medido en la misma máquina: 47 s la corta, 102 s la entera.

**50 · El montaje que se negó a publicar, y tenía razón.** Después de subir los
pagos, el dueño corrió `montaje` y falló con cinco baterías en rojo. Una sola
causa: la tienda se hornea con la versión que CONTESTA el maestro publicado, y
el publicado seguía siendo el viejo —se había corrido sin la casilla del
maestro—. Con versiones distintas la página desconfía del maestro y no da por
verificado ningún total: por eso cayeron `e2e`, `movil`, `enlace` y `pagoweb`,
todas por lo mismo. La guardia corta (13 baterías, recién estrenada) hizo lo
que tenía que hacer: frenar la publicación antes de subirla. La lección no es
de código, es de lectura: **cinco rojos con la misma causa se leen desde el que
nombra la causa** (`LA VERSIÓN del maestro y la del index`), no desde el
primero de la lista.

**51 · Un `try/catch` que se tragaba la prueba.** El registro de cambios (D-6)
anota de qué producto era la celda editada a mano leyendo la columna A con
`getValue()`. El emulador de la hoja no tenía `getValue()` —solo
`getValues()`—, y como anotar nunca puede tumbar una edición, la llamada va
dentro de un `try/catch`: el registro salía sin el nombre del producto y nada
fallaba. Lo cazó la aserción que pide el `baguette` en «Dónde». Un `catch` que
protege al comerciante también protege al defecto de la prueba; por eso la
aserción mira el contenido de la fila y no solo que exista.

**52 · Una promesa escrita en un comentario.** El horneado decía, junto a sus
topes de variantes: «están escritos tres veces… lo que no se puede es que digan
números distintos, y eso lo comprueba variantes.js». `variantes.js` no lo
comprobaba. Al bajar los topes para C-1b (de 4 y 24 a 3 y 20) había que
cambiarlos en tres sitios, y nada habría avisado si se olvidaba uno. Ahora
`inventario.js` lee los tres. **Un comentario que dice «esto lo comprueba X» se
verifica abriendo X.**

**53 · La tarjeta que hablaba de la última combinación mirada.** Con inventario
por combinación, la tarjeta de un producto decía «Últimas 2 unidades» —las de
la nude M que el comprador acababa de mirar en la ficha— en vez del total. La
causa era el orden: agregar desde la ficha repintaba las tarjetas CON LA FICHA
ABIERTA, y el stock se calculaba con su elección. Ahora se cierra la ficha y
después se agrega, y la elección de la ficha solo vale mientras está abierta.
Al verificar en rojo, quitar esa segunda guarda ya no pone roja la batería: la
primera la tapa. Queda como defensa en profundidad, y dicho aquí para que nadie
crea que la cubre una prueba.

**54 · La compatibilidad que decidió el diseño.** El plan decía que las filas
del inventario por combinación las genera el maestro «con el stock vacío», y
también que un producto con Variantes y sin filas «se comporta como hoy». Las
dos juntas tenían un hueco: en cuanto el maestro generara las filas, el
producto tendría filas… vacías, y la suma sería cero. **Generar las filas
habría agotado la tienda.** La regla que las hace compatibles: el producto pasa
a venderse por combinación solo cuando UNA de sus filas tiene un número.
`inventario.js` lo prueba en rojo quitando esa condición.

**55 · La página 404 de otro comercio.** `publicar/404.html` seguía con el
título y los colores de Orgánico. Se hornea desde la plantilla en cada
montaje, pero ninguna batería miraba el archivo del repositorio. Ahora
`marca.js` lo revisa como a la plantilla y al maestro.

**56 · El index, siempre una publicación por detrás.** El montaje volvió a
fallar igual que en la 50 —`LA VERSIÓN del maestro y la del index`, maestro
2026-09-21-2 contra index 2026-09-21-1— y esta vez la explicación de la 50 no
alcanzaba. Mirando el flujo en orden: el **sondeo** (B-3, M1) pregunta
`bloques` al principio de la corrida, **antes** de publicar el maestro, y
preparar-index lo lee de ahí con `--desde`. Con la casilla del maestro marcada,
el index se horneaba con la versión que contestaba el maestro ANTES de
publicarse: siempre una por detrás, y las baterías en rojo aunque todo se
hubiera hecho bien. Lo metí yo con el sondeo y ninguna prueba cruzaba
«sondeo» con «publicar el maestro». Tres arreglos: `publicar-maestro.mjs` tira
el sondeo en cuanto la versión nueva queda publicada (`olvidarSondeo()`), su
comprobación espera hasta un minuto a que Google sirva la versión nueva, y
`preparar-index` **se niega a hornear** si el maestro vivo no es el del
repositorio, con un mensaje que dice qué casilla marcar, en el resumen de la
corrida. `montaje.js` prueba los tres, en rojo quitando cada uno. **Una caché
de diez minutos también es una caché**: lo que cambia dentro de la corrida la
invalida. *(mío)*

**57 · La hoja decía Pasarela y la tienda cobraba por WhatsApp.** Con la 0.8.0
publicada, `cobro_modo` en Pasarela y la tienda seguía mandando al WhatsApp.
La causa, confirmada por el dueño: las llaves de Bold no habían quedado
guardadas en las propiedades del script. El maestro hacía lo correcto —sin
llaves no se ofrece un botón que va a fallar— y lo decía en el Diagnóstico y
junto al campo en «Tu tienda»… donde nadie estaba mirando. Tres cambios: el
panel lo dice **arriba, en rojo, en las dos pantallas**, con el nombre exacto
de la llave que falta; las llaves se buscan también con el alias de la línea
anterior (`BOLD_BOTON_*`), sin mirar mayúsculas ni espacios en el nombre, y con
`_PRUEBAS` además de `_SANDBOX`; y `PAGOS-BOLD.md` dice que hay que pulsar
«Guardar propiedades del script». Del mismo día: el primer montaje de la 0.8.0
volvió a fallar y el segundo, un minuto después, pasó. Lo más probable es
Google tardando en servir la versión recién publicada; `preparar-index` ahora
espera hasta tres minutos **solo si el maestro se publicó en esa misma
corrida**. Sin haber visto el log no lo doy por seguro: si vuelve a pasar, el
resumen de la corrida ya trae el mensaje entero. **Un aviso que existe pero se
lee en otra pestaña no es un aviso.** *(el mensaje, mío)*

**58 · Dos funciones con el mismo nombre, y ganó la última.** Para los cupones
(0.9.0) escribí una `fechaIso` que devuelve el día (AAAA-MM-DD). Ya había una
`fechaIso` que devuelve la fecha con hora, y la usan los pedidos del panel. En
Apps Script dos `function` con el mismo nombre no dan error: gana la última,
en silencio. Los pedidos del panel quedaron con la fecha sin hora («hace 5
horas» pasó a contar desde la medianoche UTC) y ninguna batería lo vio, porque
ninguna miraba la hora. Lo encontré al escribir M5. La nueva se llama `diaIso`,
y `esquema.js` ahora falla si una función del maestro se declara dos veces —en
rojo con el defecto puesto—. Quedó publicada una versión (la 0.9.0) con el
fallo: se arregla sola al publicar esta. *(mío)*

**59 · El emulador que repetía los números al azar.** `Utilities.getUuid()` del
emulador devolvía un UUID con los primeros 24 caracteres fijos. Mientras nadie
lo usaba para azar no importaba; cuando el maestro pasó a sacar de ahí el
número de pedido (M5), `crearCobro` se quedó buscando un número libre para
siempre y `pagos.js` y `pagoweb.js` se colgaron. El emulador ahora da un UUID
aleatorio de verdad, como Google. **Un doble de prueba que simplifica una
propiedad que el código real sí promete termina mintiendo el día que alguien
depende de ella.**
