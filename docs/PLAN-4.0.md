# Plan 4.0 — De una tienda que funciona a una flota que se mantiene sola

_Escrito el 18 de septiembre de 2026, tres días después de la 3.0.0._

> **Este documento caduca.** Es el plan de una fase, como lo fue `PLAN.md` para
> la migración a la v3 — y como aquel, se borra cuando la fase cierre. Lo que
> sobreviva será: la arquitectura, promovida a `ARQUITECTURA.md`; las decisiones
> con su disparador, a `DECISIONES.md`; lo que se rompió por el camino, a
> `BITACORA.md`. Mantener este archivo vivo después de la 4.2 sería el patrón 23
> otra vez: dos documentos contando la misma arquitectura, y uno mintiendo.

---

## 0 · Qué contesta este documento

Cuatro preguntas del dueño, en el orden en que las hizo:

1. Cómo se actualiza una tienda ya montada —el `index.html`, el maestro, o
   cualquier pieza— de forma remota, automática o a demanda.
2. Cómo se evita que una tienda con algo propio se quede fuera de esas
   actualizaciones, o que las rompa para las demás.
3. Qué le falta al producto para venderse en serio, con un plan que un equipo
   pueda ejecutar sin volver a preguntar.
4. Cómo se hace todo esto más rápido, empezando por los flujos y el tiempo que
   pasa entre que el comerciante aprieta «Publicar ahora» y su cambio está en
   línea.

Y una que no preguntó pero decide las cuatro: **qué NO se hace, y por qué.**

Índice:

| | |
|---|---|
| §1 | De dónde se parte: el estado medido de la 3.0.0 |
| §2 | Los ocho hallazgos que cambian el diseño |
| §3 | Arquitectura — cómo viaja una versión a la flota |
| §4 | Arquitectura — cómo una tienda es distinta sin quedarse atrás |
| §5 | Rendimiento — el presupuesto de publicación |
| §6 | Los huecos funcionales, y cuáles son indispensables |
| §7 | El plan de ejecución: épicas, historias, criterios |
| §8 | Riesgos |
| §9 | Las cuatro decisiones que no son de código |
| §10 | Cómo se cierra este documento |

---

## 1 · De dónde se parte

Lo que la 3.0.0 ya resolvió, y que este plan da por hecho:

- **Una tienda nueva nace correcta.** Se clona la plantilla, se llena la hoja,
  se corre `montaje`, y la tienda vende. Medido: **30 minutos** (4.23).
- **El catálogo se sirve estático.** Mil visitas son cero lecturas de la hoja.
- **Nada de la tienda se escribe a mano** en `publicar/index.html`: el `<head>`,
  las constantes, la paleta y el catálogo de respaldo los escribe el montaje.
- **Hay red de seguridad**: las baterías sobre el código real, el catálogo de
  respaldo horneado, la bandeja de pedidos pendientes en el navegador del
  comprador, el diagnóstico de diez puntos, el panel multitienda.
- **El tiempo de publicación ya se atacó una vez**: 292 s → 85 s (4.12).

Lo que la 3.0.0 **no** resolvió, y es el objeto de este plan:

- Poner al día una tienda ya montada es copiar archivos a mano (4.18).
- Una tienda no puede tener nada propio sin salirse del carril.
- El maestro se publica con una persona delante, y el stub se pega a mano.
- Publicar sigue costando más de un minuto, con trabajo repetido dentro.
- Hay huecos funcionales que impiden venderle a un comercio que no venda tomate.

---

## 2 · Los ocho hallazgos que cambian el diseño

Antes de proponer nada se midió el repositorio. Ocho cosas salieron distintas de
lo que se suponía, y cada una mueve una pieza del plan.

**1. `publicar/index.html` es fuente y producto a la vez.** No hay plantilla
separada: `preparar-index.mjs` y `sembrar-respaldo.mjs` leen el archivo,
reemplazan zonas marcadas y lo reescriben en el mismo sitio. Todo el problema de
«actualizar sin pisar lo del comercio» vive en ese único archivo, y desaparece
en cuanto se parta en dos. **Es el refactor que habilita el resto del plan.**

**2. Quedan datos de Orgánico quemados donde nadie los hornea.** Líneas 418,
465-467, 546 y el bloque `EMPRESA` (574-582) del `index.html` dicen
`Rionegro, Antioquia`, `300 861 0480` y `wa.me/573008610480`. Hoy no se ven
porque `aplicarConfiguracion()` los tapa en tiempo de ejecución si la hoja trae
las claves — pero el archivo que se publica en la tienda de otro comercio los
lleva dentro, y el pie de una tienda sin `empresa_*` dice Rionegro. Lo mismo con
`publicar/404.html` («Orgánico — esa página no existe») y `compartir.jpg`, que
**ninguna herramienta regenera**.

**3. `wrangler.jsonc` solo lo arregla una herramienta interactiva.**
`configurar-tienda.mjs` pregunta `s/n` por teclado, así que **no corre en
Actions**. Por eso el `name` de Cinnamon Beauty dice `organico` (4.21). Es «lo
único de este repositorio que puede hacer daño fuera de él».

**4. `SCRIPT_VERSION` sale del maestro publicado, no del repositorio.** Traer un
`index.html` nuevo sin republicar el maestro deja la tienda avisando desajuste
de versión: no sella pedidos ni aplica cupones. **El index y el maestro no se
pueden actualizar por separado**, y eso obliga a que la sincronización sepa de
los dos carriles a la vez.

**5. El horneado no es determinista.** `catalogo.json` escribe
`generado: new Date().toISOString()`; el respaldo escribe la fecha del día, en
UTC, así que **al cruzar medianoche el archivo cambia aunque nada haya
cambiado**; las claves de `config` no se ordenan; y `package-lock.json` está en
`.gitignore`, así que la versión de `sharp`/libvips que convierte las fotos puede
cambiar entre corridas. Sin determinismo no se puede distinguir «esta tienda tocó
el archivo» de «el reloj avanzó», que es exactamente la pregunta que una
sincronización tiene que contestar.

**6. Al maestro se le pregunta tres veces lo mismo.** Por corrida del flujo
`fotos` hay **siete peticiones fijas**, y tres son duplicados exactos —`bloques`,
`fotos` y `catalogo` se piden en el paso «¿hay fotos nuevas?» y otra vez en
«bajarlas y convertirlas»—. Con el arranque en frío de Apps Script documentado en
**cuarenta segundos o más**, esos duplicados están en el camino crítico.

**7. Las fotos se bajan y se convierten estrictamente en serie**, y los cuatro
tamaños de cada foto también.

**8. Hay una batería que no corre nunca.** `limites.js` levanta un navegador y
**no está en la lista de `todas.sh`**. Una batería escrita y no corrida es peor
que ninguna: ocupa el sitio de la que sí haría falta.

Y uno que no es del código sino de la política: **las tiendas son repositorios
públicos** —es lo que hace que Actions sea gratis e ilimitado—. Así que el código
de la semilla, copiado dentro de cada tienda, **ya es público**. Mantener privada
la semilla no protege nada que no esté ya a la vista. Esto decide §3.4.

---

## 3 · Arquitectura — cómo viaja una versión a la flota

### 3.1 El principio, en una frase

> **El repositorio de una tienda no tiene fuente propia. Tiene la fuente de la
> semilla, y productos horneados desde su hoja.**

Si eso es cierto, actualizar deja de ser un problema de fusión y pasa a ser uno
de reposición: se sobrescribe la fuente y se vuelve a hornear. No hay conflicto
posible, porque no hay dos versiones del mismo texto peleando — hay una fuente y
una receta.

Hoy no es cierto por el hallazgo 1. La primera épica existe para hacerlo cierto.

### 3.2 La separación plantilla/horneado

```
ANTES                                   DESPUÉS
publicar/index.html                     plantilla/index.html      ← SEMILLA
  ├ código de la semilla                publicar/index.html       ← PRODUCTO
  ├ <head> de esta tienda                 (nace de plantilla + hoja)
  ├ colores de esta tienda              publicar/catalogo.json    ← PRODUCTO
  ├ 5 constantes de esta tienda         publicar/fotos/**         ← PRODUCTO
  ├ catálogo de respaldo de esta tienda publicar/404.html         ← PRODUCTO
  └ datos de Orgánico sin hornear       publicar/compartir.jpg    ← PRODUCTO
                                        wrangler.jsonc            ← PRODUCTO
```

Tres consecuencias, y las tres importan:

1. **`publicar/` entero pasa a ser salida de compilación.** Sigue versionado
   —Cloudflare despliega desde el repositorio— pero deja de ser algo que se
   fusione: ante cualquier duda, se rehornea y gana el horno.
2. **Los datos quemados de Orgánico desaparecen del código**, porque la
   plantilla deja de tener valores: tiene ranuras. Lo que hoy se tapa en tiempo
   de ejecución se hornea, y lo que no se pueda hornear queda **vacío y
   visible**, no relleno con los datos de otro comercio (misma regla que ya
   aplica `sembrar-respaldo.mjs`: un respaldo con los productos de otro es peor
   que no tener respaldo, porque funciona).
3. **La lista de lo que se hornea es una sola y es derivada.** Cada herramienta
   de `montar/` exporta qué escribe (`export const ESCRIBE = [...]`), el
   manifiesto se arma leyendo esas listas, y una aserción falla si una
   herramienta escribe una ruta que no declaró. Es el requisito 2 del 4.18 —
   *una sola lista, no escrita dos veces*— resuelto por construcción.

### 3.3 El paquete de versión y el manifiesto

`release.yml` ya corta etiquetas y cuelga `index.html`, `maestro.gs` y
`publicar.tar.gz`. Se le añaden dos activos:

**`semilla.tgz`** — la fuente de la semilla: `plantilla/`, `montar/`, `pruebas/`,
`.github/workflows/`, `maestro.gs`, `panel.gs`, `package.json`,
`package-lock.json`, `publicar/_headers`, `docs/`. Un solo archivo: una descarga,
no cuarenta.

**`semilla.json`** — el manifiesto. Es el contrato de la actualización:

```json
{
  "version": "4.0.0",
  "esquema": 3,
  "publicado": "2026-10-01T12:00:00Z",
  "exige": { "maestro": ">=4.0.0", "stub": ">=2.7.0" },
  "archivos": {
    "plantilla/index.html":         { "sha256": "…", "clase": "semilla" },
    "maestro.gs":                   { "sha256": "…", "clase": "maestro" },
    "montar/traer-fotos.mjs":       { "sha256": "…", "clase": "semilla" },
    ".github/workflows/fotos.yml":  { "sha256": "…", "clase": "semilla" },
    "publicar/_headers":            { "sha256": "…", "clase": "acoplado-csp" }
  },
  "hornea": ["publicar/index.html", "publicar/catalogo.json",
             "publicar/fotos/**", "publicar/404.html",
             "publicar/compartir.jpg", "wrangler.jsonc"],
  "jamas":  ["tienda.json", "montar/.clasp.json", "secretos.md",
             "originales/**", "semilla.lock"]
}
```

`clase` no es decoración: decide el carril. `semilla` se sobrescribe sin
preguntar; `maestro` se sobrescribe en el repositorio pero **publicar en Apps
Script es otro paso, con puerta** (§3.7); `acoplado-csp` avisa de que ese archivo
tiene que cuadrar con lo que genera el maestro de esa tienda (hallazgo del
acoplamiento entre `_headers` y el `<meta CSP>`).

### 3.4 El candado: `semilla.lock` y las cuatro respuestas

Cada tienda lleva versionado un `semilla.lock` con **lo que la semilla dejó la
última vez**:

```json
{
  "version": "3.2.0",
  "canal": "estable",
  "aplicado": "2026-09-30T14:02:11Z",
  "archivos": { "montar/traer-fotos.mjs": "sha256:…", "…": "…" },
  "desviado": {
    "publicar/_headers": { "desde": "3.1.0", "porque": "dominio propio en la CSP" }
  }
}
```

Con tres hashes —lo que la semilla dejó (`lock`), lo que hay hoy en la tienda
(`disco`), y lo que trae la versión nueva (`nuevo`)— hay exactamente cuatro
respuestas. Es `merge` a tres bandas sin necesidad de historia compartida:

| `lock` vs `disco` | `lock` vs `nuevo` | Qué pasó | Qué se hace |
|---|---|---|---|
| iguales | distintos | Nadie tocó el archivo aquí; la semilla lo cambió | **Sobrescribir**, en silencio |
| iguales | iguales | Nada cambió | Nada |
| distintos | iguales | La tienda lo cambió; la semilla no | **Dejarlo**, y anotarlo como desvío |
| distintos | distintos | Los dos lo cambiaron | **Conflicto real: no se toca.** Se reporta, y la tienda queda marcada `desviada` en ese archivo |

Y una quinta regla que es la que quita casi todos los conflictos: **si la ruta
está en `hornea`, no se compara nunca**. Es producto. Se sobrescribe y se
rehornea. Un archivo generado no tiene opinión.

**Nunca se fusiona automáticamente.** No hay resolución de conflictos en tres
bandas dentro de un archivo, ni `git merge -X theirs`, ni parches. O se sobrescribe
entero, o se deja entero, o se para y se avisa. Las tres son reversibles; una
fusión a medias no.

### 3.5 Cómo llega la versión a N tiendas

Tres caminos, y los tres son gratis:

| Camino | Disparo | Latencia | Para qué |
|---|---|---|---|
| **A demanda** | `workflow_dispatch` en la tienda, con `version` opcional | segundos | Una tienda, una vez. También es la vuelta atrás |
| **Empuje** | La semilla, al publicar una versión, manda `repository_dispatch` a cada tienda de su anillo | segundos | El reparto normal |
| **Red de seguridad** | `schedule` semanal en cada tienda | ≤ 7 días | Cazar la tienda que se perdió un empuje |

El empuje necesita un token que pueda disparar flujos en los repositorios de las
tiendas. Vive **solo en el repositorio de servicio** `laboratoriodigital/tiendas`,
que ya es el único con `ALTA_TOKEN` — misma política, mismo sitio, ningún llavero
nuevo en las tiendas. Es *fine-grained*, con `Contents: read` y
`Actions: read & write` sobre los repositorios de la flota, y **nada más**.

La lista de la flota vive en `servicio/flota.json`, versionada y revisable:

```json
[ { "repo": "laboratoriodigital/organico",   "anillo": 0, "canal": "pronto" },
  { "repo": "laboratoriodigital/tienda_cinnamonbeauty", "anillo": 1, "canal": "estable" },
  { "repo": "laboratoriodigital/panaderia",  "anillo": 1, "canal": "estable" } ]
```

Dos listas de tiendas —esta y la pestaña `Tiendas` del panel— es el patrón 2
esperando a ocurrir. Por eso **no se escriben dos veces**: el diagnóstico del
panel compara las dos y reporta la diferencia. Una lista manda para repartir, la
otra para operar, y una máquina las carea.

**El reparto es por anillos**, que es la forma medida de no romper tres tiendas a
la vez, y la regla que ya está escrita en `CONTRIBUIR.md` («todo cambio del
backend arranca en la tienda cero y espera una hora»):

```
anillo 0 · Orgánico            → al publicar la versión
   ↓ (espera 60 min, y solo si el anillo 0 quedó verde y la tienda contesta)
anillo 1 · 2 tiendas           → automático
   ↓ (espera 24 h)
anillo 2 · el resto            → automático
```

Si una tienda de un anillo falla, **el anillo siguiente no sale** y el resumen
dice cuál y por qué. Esto es «despliegue por anillos» del 4.25, con disparador.

### 3.6 Canales y vuelta atrás

Cada tienda declara su canal en `semilla.lock`:

- **`pronto`** — la última versión. Orgánico, que es la tienda cero y es nuestra.
- **`estable`** — la penúltima, o la última que lleve 24 h verde en el anillo 0.
  El valor por defecto de un comercio.
- **`fijo:vX.Y.Z`** — clavada. Para una tienda en medio de una campaña, o una que
  se quedó esperando una decisión.

**La vuelta atrás es el mismo camino, con otro número.** Como actualizar es
*sobrescribir y rehornear* —no fusionar—, volver a la versión anterior es correr
el mismo flujo con `version: v3.2.0`. No hay `revert` que se pueda enredar, ni
historia que reconciliar. Esa simetría es la mejor propiedad de este diseño y la
razón de preferirlo a cualquier variante con `git merge`.

### 3.7 El maestro y el stub van por otro carril

Publicar el maestro no es escribir un archivo: es cambiar el backend que está
atendiendo pedidos, sin vista previa y sin vuelta atrás de un clic. Esa decisión
ya está tomada y escrita (`DESPLIEGUE.md`, «Por qué `maestro` no está
programado»), y **este plan no la revierte**. Lo que hace es quitarle el trabajo
manual alrededor:

1. **La sincronización actualiza `maestro.gs` en el repositorio** y **no lo
   publica**. Deja la tienda marcada como «maestro por publicar» en el panel.
2. **Publicarlo sigue pidiendo casilla y `PUBLICAR` escrito**, pero se puede
   hacer para varias tiendas desde un flujo del repositorio de servicio, con la
   persona delante, en un solo gesto en vez de uno por tienda.
3. **El acoplamiento se hace explícito.** Si la versión nueva cambia el contrato
   (`esquema` distinto en el manifiesto), la sincronización **no publica el
   `index.html` nuevo hasta que el maestro esté publicado**: es el hallazgo 4, y
   sin esta regla una flota actualizada a medias deja de sellar pedidos.
4. **El stub**: el camino está evaluado y el siguiente paso es una medición de
   diez minutos, no un desarrollo. Ver `EVALUACION-stub-automatico.md` §8, y la
   épica **E6**.

### 3.8 Lo que este diseño no resuelve

- **No actualiza la hoja del comercio.** Las columnas y claves nuevas las crea
  `A0_instalar()`, que corre dentro de la cuenta del comercio. La sincronización
  puede *pedirlo* (`?a=instalar` con el token de montaje) pero sigue siendo el
  maestro publicado quien lo hace. Regla R1 del contrato: solo se agrega, y solo
  al final.
- **No arregla una tienda que se quedó sin `CLASPRC`.** Ese secreto caduca y
  renovarlo es un consentimiento humano (4.14).
- **No toca Cloudflare.** El proyecto, su rama y su nombre se configuran a mano
  una vez. El techo conocido: **100 Workers por cuenta**. A la tienda 100 hace
  falta una segunda cuenta — está lejos, pero el número conviene tenerlo escrito.

---

## 4 · Arquitectura — cómo una tienda es distinta sin quedarse atrás

El caso que plantea el dueño: la semilla sale con unas funcionalidades base y un
cliente quiere una suya. Si esa desviación vive como código propio dentro de su
repositorio, esa tienda deja de poder actualizarse — y, peor, nadie se entera
hasta la versión siguiente.

La respuesta no es un mecanismo de fusión más listo. Es **quitar casi todos los
casos en los que hace falta fusionar**, y dejar el resto declarado y visible.

### 4.1 Los cuatro niveles, en orden de preferencia

| Nivel | Qué es | Dónde vive | Coste de actualizar |
|---|---|---|---|
| **0 · Dato** | Un valor: nombre, color, texto, umbral, número de WhatsApp | Pestaña `Configuración` | Cero. Ya funciona así |
| **1 · Interruptor** | Un comportamiento que la semilla **sabe hacer**, apagado por defecto | Clave `f_*` en `Configuración` | Cero. Todas las tiendas corren el mismo código |
| **2 · Ranura** | Código propio de esa tienda, en un archivo que la semilla **nunca** toca | `tienda/extension.js`, `tienda/extension.gs` | Cero mientras el contrato de la ranura no cambie |
| **3 · Desvío declarado** | La tienda modificó un archivo de la semilla | Anotado en `semilla.lock` | Ese archivo deja de actualizarse, y se dice en cada corrida |

La regla de oro: **subir de nivel es siempre un error de diseño, no una
necesidad del cliente.** Antes de escribir una ranura, hay que haber descartado
que sea un interruptor; antes de un desvío, que sea una ranura. En la revisión
de cada solicitud de un comercio, esa pregunta se hace en voz alta.

### 4.2 Nivel 1 · Interruptores

Es el nivel que este proyecto ya practica sin llamarlo así: «ningún nombre de
comercio va escrito en el código; todos salen de la pestaña Configuración». Lo
único nuevo es extender la idea de *valores* a *comportamiento*.

Forma: claves con prefijo `f_`, booleanas o enumeradas, sembradas por
`A0_instalar()` con su valor por defecto y su explicación en la celda de al lado.

```
f_variantes          Sí / No      ¿El catálogo usa variantes (talla, color)?
f_pedido_minimo      0            Monto mínimo del pedido. 0 = sin mínimo
f_horario            Sí / No      ¿Mostrar horario y avisar si está cerrado?
f_consulta_estado    Sí / No      ¿El comprador puede consultar su pedido?
```

Tres reglas que hacen que esto no se degrade:

1. **Un interruptor se prueba en los dos estados.** Una batería que solo corra
   el valor por defecto convierte la otra mitad en código muerto que nadie
   compila. Es la misma advertencia que ya está escrita en el 4.13 para las
   columnas configurables.
2. **Ilegible no es «apagado».** Si la celda dice «quizás», eso es un valor que
   no se entiende y se reporta en el diagnóstico — no se degrada a `No`. Es la
   lección de `cifra()`: `|| 0` convierte «no se pudo leer» en «es gratis».
3. **Un interruptor que lleva un año encendido en todas las tiendas deja de ser
   interruptor**: se vuelve el comportamiento por defecto y la clave se retira
   con una versión mayor. Si no, la semilla acumula ramas que nadie apaga.

El coste: la semilla carga código que algunas tiendas no usan. Con un
`index.html` de ~100 KB y fotos de 1 MB por visita, eso son bytes, no un
problema — y a cambio **todas las tiendas corren exactamente el mismo archivo**,
que es lo que hace que una corrección llegue a todas el mismo día.

### 4.3 Nivel 2 · Ranuras de extensión

Para lo que de verdad es de un solo comercio y la semilla no debería aprender.

**En la página.** La plantilla declara ranuras con nombre y contrato:

```js
// plantilla/index.html, al final del <script>
if (window.EXTENSION) {
  EXTENSION.alPintarProducto   && ...   // recibe (producto, tarjeta), devuelve nada
  EXTENSION.antesDeEnviar      && ...   // recibe (pedido), devuelve pedido o lanza
  EXTENSION.alCalcularEnvio    && ...   // recibe (carrito, tarifa), devuelve número
}
```

`tienda/extension.js` lo carga la plantilla si existe, y es el **único** archivo
de la carpeta `tienda/` — que está en `jamas` del manifiesto: la sincronización
no la mira nunca.

**En el maestro.** `publicar-maestro.mjs` ya arma una carpeta temporal para
`clasp push`; se le añade `tienda/extension.gs` si existe. El maestro llama a
los enganches por nombre, dentro de un `try` y con política declarada:

| Enganche | Si lanza |
|---|---|
| `alRegistrarPedido(p)` | **Se ignora y se anota en `Errores`.** Un pedido no se pierde por una extensión |
| `alValidarCupon(c)` | **Falla cerrado.** Sin descuento, como cuando la hoja no contesta |
| `alCalcularTotal(t)` | **No existe.** El total es del servidor y no se extiende |

Esa tercera fila es la más importante del apartado: **hay cosas que no se
extienden nunca.** El total, el inventario, el sellado del pedido y el filtro
`pago_*` son el núcleo de confianza del producto. Una ranura ahí convertiría
cada tienda en un sistema distinto en lo único que no puede variar.

**El contrato de las ranuras se versiona.** `tienda/extension.js` declara
`EXTENSION.contrato = 3`; si el manifiesto trae `esquema: 4`, la sincronización
**no rompe nada**: aplica, deja la extensión desactivada, y lo dice con todas
las letras en el resumen y en el panel. Una extensión silenciosamente rota es
peor que una apagada a gritos.

### 4.4 Nivel 3 · Desvío declarado

Si un comercio necesita cambiar un archivo de la semilla, se puede — con una
condición: **que quede escrito**. Se anota en `semilla.lock`:

```json
"desviado": { "publicar/_headers": { "desde": "3.1.0", "porque": "dominio propio" } }
```

A partir de ahí, ese archivo y solo ese deja de recibir actualizaciones. Todo lo
demás sigue llegando. Y cada corrida de `sincronizar` repite en el resumen y en
el panel: *«esta tienda lleva 4 versiones con `publicar/_headers` desviado»*.

Tres propiedades que hacen que esto no se pudra:

- **El desvío no bloquea al resto de la flota.** Es local a la tienda y a un
  archivo.
- **El desvío tiene edad, y la edad se ve.** Es lo que convierte una excepción
  en una decisión que alguien vuelve a mirar.
- **Un desvío sin declarar se detecta igual.** El candado compara hashes; un
  archivo cambiado sin anotar sale como conflicto real, se salta, y se reporta.
  La diferencia entre declarado y no declarado no es si se detecta, sino si
  alguien ya sabía.

### 4.5 Qué impide que esto se convierta en un fork

Un límite duro y medible, revisado cada versión:

> **Ninguna tienda puede tener más de tres archivos desviados, y ninguno puede
> llevar más de dos versiones así.**

Si una tienda lo cruza, no es un caso especial: es un producto distinto, y hay
que decidir a la vista —subir lo suyo a la semilla como interruptor, convertirlo
en ranura, o cobrar lo que cuesta mantener una variante—. El número no es
sagrado; lo que importa es que exista y que el panel lo enseñe. Sin umbral, la
deriva no se nota hasta que ya no tiene arreglo.

---

## 5 · Rendimiento — el presupuesto de publicación

El dueño pidió priorizar esto, y tiene razón por una razón que no es la
impaciencia: **«Publicar ahora» es la única palanca del comerciante.** Si tarda
tres minutos, el comerciante aprieta dos veces, se va, y vuelve a mirar cuando
ya no se acuerda de qué cambió.

### 5.1 De dónde se parte, medido

Lo que ya está medido en el repositorio (4.12): la suite entera pasó de **292 s**
a **85 s** paralelizando y quitando esperas fijas, y las cachés ahorran «60-90 s
por corrida». Con eso, una publicación pasó de 6-8 minutos a poco más de uno.

Lo que se midió ahora, y todavía se puede quitar:

| Dónde se va | Cuánto | Por qué está ahí |
|---|---|---|
| Tres llamadas duplicadas al maestro | 10-30 s normal, **40-80 s en frío** | Dos pasos distintos preguntan lo mismo |
| `playwright install --with-deps` | 20-40 s | `apt-get` corre **siempre**, aunque el binario esté cacheado |
| Caché del navegador sin `restore-keys` | hasta ~90 s | Cualquier cambio de `pruebas/package.json` re-descarga ~130 MB |
| Fotos en serie | ×N fotos | Un `for…of` con `await` dentro, y los 4 tamaños también en serie |
| Baterías | ~30-40 s de reloj | Ya paralelizadas a 4 trabajadores |

### 5.2 El presupuesto

Esto es lo que convierte «hacerlo más rápido» en algo que se puede comprobar el
año que viene:

> **De «Publicar ahora» a `main` movido: p50 ≤ 60 s, p95 ≤ 120 s.**
> Más el despliegue de Cloudflare, que no es nuestro.

El presupuesto vive en `presupuesto.json`, el flujo mide cada fase y escribe la
tabla en el resumen de la corrida, y un guardia **avisa** por encima del
presupuesto y **falla** por encima del doble. Medir primero, optimizar después,
y dejar puesto el termómetro: es lo mismo que hizo el 4.12, que es el único
antecedente de este repositorio en el que una mejora de rendimiento sobrevivió.

### 5.3 Las mejoras, por ahorro ÷ riesgo

| # | Qué | Ahorro | Riesgo |
|---|---|---|---|
| 1 | **Una sola pregunta al maestro.** Un `montar/sondear.mjs` pide `bloques`, `fotos` y `catalogo` **en paralelo** y escribe `.montaje/estado.json`; las cuatro herramientas leen de ahí con `--desde` | 10-30 s; **40-80 s en frío** | Bajo. Las herramientas siguen funcionando solas si no hay archivo |
| 2 | **Fotos en paralelo**, tanda de 4, y los 4 tamaños de cada foto a la vez | Casi ×4 sobre las fotos nuevas | Memoria del runner, y el diagnóstico deja de ser lineal: cada tarea tiene que llevar su nombre al error |
| 3 | **`--with-deps` solo cuando falla la caché** (`if: cache-hit != 'true'`) | 20-40 s | Un runner sin las librerías falla con un error opaco de Chromium |
| 4 | **`restore-keys` en la caché del navegador** | hasta 90 s en el peor caso | Casi nulo: `playwright install` corrige la versión |
| 5 | **`npm ci` con `package-lock.json` versionado** | 5-15 s, y **builds reproducibles** | Ninguno técnico; es un cambio de política del repositorio |
| 6 | **Solapar la descarga del navegador con la charla con Google** | 30-60 s de reloj | Se baja Chromium aunque el horneado vaya a fallar. Paga porque fallar es raro |
| 7 | **Matriz de 2-3 shards para las baterías** | 15-25 s | `todas.sh` deja de dar un marcador único; hace falta un trabajo que agregue y un guardia que falle si algún shard falló |

Las seis primeras son mecánicas y no cambian lo que se prueba. La séptima toca
el guardia que decide si se publica, y por eso va al final y detrás de una
medición.

### 5.4 Lo que NO se va a hacer, y por qué

- **Correr solo un subconjunto de baterías según qué archivos cambiaron.** Suena
  a la mejora obvia y está medida como inútil: las baterías sin navegador
  cuestan **3,5 s entre todas** (4.12). El ahorro es ruido y el riesgo es real, porque el
  flujo `fotos` **fusiona sin persona delante**: ahí el guardia completo es lo
  único que hay entre una hoja mal llenada y la tienda en vivo.
- **`cancel-in-progress: true`.** Está en `false` a propósito: `fotos` y
  `montaje` comparten grupo y los dos escriben en `publicar/`. Cancelar a mitad
  deja `origen.json` y el catálogo desparejos, que es el peor estado posible.
- **Precalentar el Apps Script.** El arranque en frío de cuarenta segundos es de
  Google. Se puede *solapar*, no evitar.
- **Recortar el `fetch-depth: 0` de `pruebas.yml`.** Está ahí porque compara
  contra la base del PR.

---

## 6 · Los huecos funcionales, y cuáles son indispensables

Se revisó qué sabe hacer hoy el producto antes de pedir nada nuevo. **Ya existen
y no son huecos**: búsqueda, filtro por categoría, paginación de 25/50/100,
galería de hasta 6 fotos con deslizamiento táctil, enlace por producto, carrito
con tope por stock, cupones validados en la hoja, envío por zona, envío gratis
desde un monto, seis estados de pedido con inventario que se mueve solo, tablero
con embudo, correo diario, respaldo semanal, bandeja de pedidos pendientes en el
navegador y textos legales de datos, retracto y términos.

Los huecos, ordenados por lo único que importa aquí: **¿se puede cobrar sin
esto?**

### 6.1 Bloquean la venta del servicio

**H1 · Los textos legales hablan de tomates.** El derecho de retracto del
`index.html` nombra «chonto, cherry y riñón» y «recoger en la finca». Una
panadería que publique hoy está firmando, ante sus compradores, un texto legal
sobre una finca de tomates. No es un hueco: es **una afirmación falsa con firma
del comerciante**, y es el hallazgo más caro de toda la revisión. El 0.2 solo
cubre razón social y NIT; el cuerpo del texto no lo cubre nadie.

**H2 · `A0_instalar()` siembra una tienda de tomates.** Ocho productos de tomate
y cinco zonas de Rionegro y Medellín. El comerciante los borra, sí — pero si se
le olvida uno, su tienda vende tomate chonto. Es el mismo fallo del catálogo de
respaldo que arregló el 4.20, en la otra punta del proceso.

### 6.2 Cierran mercados enteros

**H3 · No hay variantes de producto.** Ni talla, ni color, ni sabor: cero
coincidencias en el código, y el contrato de `Catálogo` no tiene columna. Hoy,
un labial en tres tonos son tres filas con tres identificadores y tres fotos. Los
compradores naturales de un e-commerce de $0 —cosmética, ropa, panadería— son
justo los que lo necesitan, y una de las dos tiendas montadas es de cosmética.

### 6.3 Ponen techo al crecimiento

**H4 · El comprador no puede saber en qué va su pedido.** Hoy lo teclea una
persona por WhatsApp, y el propio roadmap tiene medido el techo: «más de ~40
pedidos al mes con confirmación manual: duele el tiempo, no la plataforma».

La salida elegante **no** es guardar el celular del comprador para avisarle —eso
está en la lista de *lo que NO haría* del roadmap, y cambiaría el perfil de
riesgo bajo la Ley 1581—. Es darle la vuelta: **que consulte él.** El número de
pedido ya viaja en su conversación de WhatsApp; con `tienda.com/?pedido=ABC123`
la página le pregunta al maestro por ese número y le enseña el estado, la fecha y
lo que pidió. **No hace falta guardar ni un dato más del que ya se guarda** —la
hoja tiene qué se pidió y su ciudad, no quién— y el comerciante deja de teclear.
Condición: que el número de pedido no se pueda adivinar (historia `H-4.1`).

**H5 · `Pedidos` y `Validaciones` solo crecen.** Tope de 20.000 filas, entre
6.000 y 10.000 pedidos, y al llegar el script se niega a escribir. No bloquea la
tienda uno; sí la décima (ya está en el roadmap como 4.6).

**H6 · Hay respaldo, no hay restauración.** `respaldoSemanal()` copia la hoja y
poda a ocho copias. No existe `restaurar` en ninguna parte. Un respaldo que nunca
se ha probado a restaurar es una copia de seguridad en el sentido decorativo.

### 6.4 Mejoran, no bloquean

| | Qué | Dónde estaba |
|---|---|---|
| **H7** | `horario` es una clave muerta: se siembra, se documenta como visible al comprador, y `aplicarConfiguracion()` nunca la pinta | No aparecía |
| **H8** | El envío gratis se calcula pero no se anuncia: el comprador no sabe que le faltan $12.000 para no pagarlo | No aparecía |
| **H9** | No hay orden del catálogo (precio, novedad): sale el de la hoja | No aparecía |
| **H10** | Tienda cerrada y mínimo de pedido | No aparecían |
| **H11** | «Avísame cuando llegue» | 2.2 |
| **H12** | SEO con JSON-LD y sitemap | 2.3 |
| **H13** | Columnas del catálogo configurables | 4.13 |
| **H14** | Probar en un celular real | 0.3 |

### 6.5 Lo que sigue en NO

Sin cambios respecto a lo ya decidido, y conviene repetirlo porque este plan roza
las cuatro: **pasarela de pagos** (comisión por transacción mientras la
transferencia funcione), **base de datos o framework** (cambiaría el $0 y el
«editar una hoja»), **Google Analytics 4** (un tercero que rastrea, y declararlo),
**guardar historial de clientes** (y por eso H4 está diseñado para no necesitarlo).

---

## 7 · El plan de ejecución

### 7.1 Cómo se lee esto

Cada historia trae: **identificador**, título, tamaño en puntos, de qué depende,
la frase de usuario, el estado de hoy, criterios de aceptación verificables,
notas técnicas con los nombres de archivo reales, qué baterías la prueban, y qué
se puede romper.

**Puntos**: 1 es media sesión; 2, una sesión; 3, una sesión larga; 5, dos o tres;
8, hay que partirla. No son horas: son tamaño relativo.

**Definición de listo** (para que una historia entre): tiene criterio de
aceptación verificable, se sabe qué contrato de datos toca y —si toca uno— cómo
conviven las dos versiones.

**Definición de terminado** (para las ocho épicas, sin excepción):

1. Aserciones nuevas en las baterías, en verde junto con las anteriores.
2. Probado en la tienda cero antes de tocar ninguna otra.
3. El documento actualizado en el mismo commit que el código.
4. Si cambia algo que el comerciante ve, `GUIA-COMERCIANTE.md` se actualiza.
5. Si cambia un contrato de datos, la versión anterior **sigue funcionando**.
6. Si el cambio toca `maestro.gs`, `panel.gs` o la plantilla, sube `version` en
   `package.json`.

### 7.2 Las épicas y su orden

| | Épica | Por qué en este sitio | Entrega |
|---|---|---|---|
| **E1** | El presupuesto de publicación (rendimiento) | No depende de nada, se nota el primer día, y hace más barata cada iteración posterior | 3.1 |
| **E2** | Lo que impide cobrar (legal + semilla sin tomate) | Barato, urgente, y no depende de arquitectura | 3.1 |
| **E3** | La plantilla y el horneado determinista | Es el refactor que habilita toda la distribución | 3.2 |
| **E4** | El paquete de versión, el manifiesto y el candado | La primitiva de la actualización | 4.0 |
| **E5** | El flujo `sincronizar` en la tienda | La actualización, vista desde una tienda | 4.0 |
| **E6** | El reparto: flota, anillos y empuje | La actualización, vista desde la flota | 4.0 |
| **E7** | Personalización sin desviación | Sin esto, la primera petición rara de un cliente rompe E4-E6 | 4.0 |
| **E8** | El carril del maestro y el stub | Lo más incierto: empieza por una medición, no por código | 4.1 |
| **E9** | Variantes y consulta de estado | Tocan el contrato de datos: se hacen con la flota ya actualizable | 4.2 |
| **E10** | Observabilidad de la flota | Crece con las demás; se cierra al final | continua |

**Orden de entrega y qué significa cada versión:**

```
3.1  E1 + E2       Publicar es rápido y ninguna tienda firma un texto ajeno
3.2  E3            publicar/ pasa a ser producto. Nada cambia para el comercio
4.0  E4+E5+E6+E7   MAYOR: la tienda aprende a actualizarse sola
4.1  E8            El maestro y el stub dejan de pedir manos
4.2  E9            Variantes. Cambia el contrato de la hoja
```

La 4.0 es **mayor** por la regla del propio repositorio: una tienda vieja tiene
que hacer algo —adoptar `semilla.lock` y el flujo nuevo— para seguir el camino.

---

### 7.3 Las historias

#### E1 · El presupuesto de publicación   · 3.1

**R-1 · Medir antes de tocar nada**  · 3 pts · sin dependencias

> Como operador, quiero ver en cada corrida cuánto tardó cada fase, para poder
> decir si una mejora mejoró y para que la siguiente no lo estropee sin que se
> note.

Hoy: no hay ninguna medición por fase. El 4.12 midió a mano, una vez, y lo que
midió ya no se puede reproducir.

Criterios de aceptación
- [ ] Cada paso del flujo `fotos` registra inicio y fin, y el resumen de la
      corrida trae una tabla: fase, segundos, % del total.
- [ ] El total se define exactamente: desde que arranca el flujo hasta que
      `main` se mueve. El despliegue de Cloudflare queda fuera, y se dice.
- [ ] Se sube un artefacto `tiempos.json` con esas cifras y la versión.
- [ ] Existe `presupuesto.json` con `{"p50": 60, "p95": 120}` y su explicación.

Notas técnicas
- `date +%s%3N` al abrir y cerrar cada paso; acumular en `$GITHUB_STEP_SUMMARY`.
- Nada de medir con `time` dentro del paso: interesa el reloj de pared del paso
  entero, cola incluida.

Baterías · `montaje.js`: el flujo declara las fases y ninguna se queda sin medir.
Riesgo · Ninguno funcional. Si la medición se vuelve ruido en el resumen, se
colapsa en una línea.

---

**R-2 · Una sola pregunta al maestro**  · 5 pts · depende de R-1

> Como comerciante, quiero que publicar no espere dos veces al mismo servidor
> lento, para que mi cambio salga antes.

Hoy: siete peticiones por corrida, tres de ellas duplicados exactos (`bloques`,
`fotos`, `catalogo`). Con el arranque en frío de Apps Script, cada duplicado
puede costar 40 s.

Criterios de aceptación
- [ ] Existe `montar/sondear.mjs` que pide las tres acciones **en paralelo** y
      escribe `.montaje/estado.json`.
- [ ] `preparar-index.mjs`, `catalogo-estatico.mjs` y `traer-fotos.mjs` aceptan
      `--desde .montaje/estado.json` y, con ese archivo, **no hacen ninguna
      petición**.
- [ ] Sin `--desde` siguen funcionando exactamente igual que hoy (la ruta local
      `npm run montar` no se rompe).
- [ ] El flujo `fotos` hace **cuatro** peticiones fijas en vez de siete
      (`identidad` + las tres del sondeo), y se comprueba contándolas.
- [ ] `.montaje/` está en `.gitignore`.

Notas técnicas
- `Promise.all` sobre las tres, con el mismo manejo de error de `tienda.mjs`.
- El estado lleva `cuando` y la corrida lo descarta si tiene más de 10 minutos:
  un archivo viejo dentro del runner sería un dato de otra corrida.
- **No convertir esto en una caché entre corridas.** `RESPONDIO` ya dice en
  `tienda.mjs` por qué no lo es; el sondeo vale dentro de una corrida y muere
  con ella.

Baterías · `montaje.js`: contar peticiones con el maestro emulado, antes y
después. `arnes`/`fotos.js` con y sin `--desde` dan el mismo archivo.
Riesgo · Si el sondeo falla, hoy fallaría un paso; ahora fallan cuatro. El
mensaje tiene que decir cuál de las tres acciones no contestó.

---

**R-3 · Fotos en paralelo, y los cuatro tamaños a la vez**  · 3 pts

> Como comerciante que subió ocho fotos, quiero que se publiquen en el tiempo de
> dos, no de ocho.

Hoy: `traer-fotos.mjs` recorre las nuevas con `for…of` y `await` dentro, y
`convertir()` hace los tres WebP y el JPEG uno detrás de otro.

Criterios de aceptación
- [ ] Descarga y conversión con tanda de **4 a la vez** (configurable por env,
      por si un runner se queda corto de memoria).
- [ ] Los cuatro tamaños de una foto se generan con `Promise.all`.
- [ ] **Cada error sigue nombrando su foto.** Si dos fallan, se listan las dos.
- [ ] Una foto que falla no impide publicar las demás (ya es así desde la
      2.14.0; que siga siéndolo).
- [ ] El total de bytes y el conteo del resumen no cambian respecto a la versión
      en serie, con el mismo Drive de entrada.

Notas técnicas · Sin dependencias nuevas: una tanda con `Promise.all` sobre
trozos de 4, o un contador. Nada de `p-limit`.
Baterías · `fotos.js`: dos fotos que fallan producen dos avisos con sus nombres.
Riesgo · El registro deja de leerse de arriba abajo. Es el precio; se paga
poniendo el nombre del archivo en cada línea.

---

**R-4 · La caché del navegador deja de fallar entera**  · 2 pts

Criterios de aceptación
- [ ] La caché de `~/.cache/ms-playwright` tiene `restore-keys`, de modo que un
      cambio en `pruebas/package.json` reutiliza la anterior en vez de bajar
      130 MB.
- [ ] `--with-deps` solo corre cuando la caché **no** acertó
      (`if: steps.cache.outputs.cache-hit != 'true'`).
- [ ] Si se quita `--with-deps` y faltara una librería del sistema, el paso lo
      dice con un mensaje propio, no con el volcado de Chromium.

Riesgo · Un runner nuevo de GitHub sin las librerías. Mitigado por el mensaje.

---

**R-5 · `package-lock.json` versionado, y `npm ci`**  · 2 pts

> Como equipo, queremos que dos instalaciones del mismo commit traigan lo mismo,
> para que una foto convertida hoy y la misma foto convertida en enero sean el
> mismo archivo.

Hoy: `package-lock.json` está en `.gitignore` en las dos carpetas. `sharp` es
`^0.35.4`: una instalación futura puede traer otra libvips y producir WebP
distintos byte a byte — que es ruido para el candado de la sincronización (§3.4).

Criterios de aceptación
- [ ] Los dos `package-lock.json` versionados, y fuera de `.gitignore`.
- [ ] Los flujos usan `npm ci`.
- [ ] `README.md`/`CONTRIBUIR.md` dicen que el lock se versiona y por qué.

Riesgo · Ninguno técnico. Es un cambio de política del repositorio (§9).

---

**R-6 · Solapar el navegador con la charla con Google**  · 3 pts · depende de R-2

Criterios de aceptación
- [ ] La restauración de la caché del navegador y su instalación ocurren
      **mientras** se habla con el maestro y se convierten las fotos, no después.
- [ ] Si el horneado falla, el flujo termina igual de rápido que hoy (no se
      queda esperando a un navegador que ya no hace falta).
- [ ] El reloj de pared del flujo baja, y `tiempos.json` lo demuestra.

Notas técnicas · Dos caminos, y se elige **midiendo**: (a) reordenar pasos y
lanzar la instalación en segundo plano dentro del mismo paso, con `wait` antes
de `todas.sh`; (b) dos trabajos, `hornear` y `probar`, con artefacto en medio —
que añade 15-25 s de arranque y subida, así que solo gana si (a) no alcanza.
Riesgo · Con (b), el artefacto tiene que llevar `publicar/` entero, fotos
incluidas. Puede ser más caro que el ahorro: por eso se mide antes.

---

**R-7 · `limites.js`: o corre, o se borra**  · 1 pt

Hoy levanta un navegador y no está en la lista de `todas.sh`: no corre nunca.

Criterios de aceptación
- [ ] O entra en la lista y corre en verde, o se borra del repositorio.
- [ ] Una aserción comprueba que **todo** `.js` de `pruebas/` que imprima un
      marcador está en la lista (ya existe: que cubra también este caso).

---

**R-8 · El guardia del presupuesto**  · 2 pts · depende de R-1

Criterios de aceptación
- [ ] Si el total supera `p50`, el resumen lo dice en grande y la corrida sigue.
- [ ] Si supera el doble de `p95`, la corrida **falla** y el mensaje nombra la
      fase que se pasó.
- [ ] El guardia se puede desactivar con un input, para una corrida excepcional.

Riesgo · Un guardia de tiempo que falle por una cola de GitHub enseñaría a
ignorar los rojos. Por eso avisa antes de fallar, y falla solo al doble.

---

**R-9 · Las baterías en dos o tres turnos**  · 5 pts · depende de R-1 · **solo si R-1 dice que paga**

Criterios de aceptación
- [ ] `todas.sh --turno i/n` reparte las baterías por duración medida, no por
      orden alfabético.
- [ ] Un trabajo final agrega los resultados y publica **un solo** marcador.
- [ ] Si un turno falla, el agregado falla.

Riesgo · El marcador único es hoy lo que hace legible el verde. Partirlo mal
convierte «todo verde» en «tres verdes que hay que sumar a mano».

---

#### E2 · Lo que impide cobrar   · 3.1

**L-1 · Los textos legales salen de la hoja, no del archivo**  · 5 pts

> Como comerciante, quiero que el texto legal de mi tienda hable de mi negocio,
> para no estar firmando ante mis clientes una política sobre una finca de
> tomates.

Hoy: los tres textos (datos, retracto, términos) están escritos en
`publicar/index.html` con el caso de Orgánico dentro: «chonto, cherry y riñón»,
«recoger en la finca».

Criterios de aceptación
- [ ] Los tres textos se arman con: los datos de `empresa_*`, el nombre del
      comercio, y **una lista de excepciones al retracto que sale de la hoja**
      (`legal_no_retracto`, sembrada con ejemplos y explicación).
- [ ] Ningún nombre de producto ni lugar de Orgánico queda en la plantilla.
- [ ] Si falta `empresa_*`, el texto **no inventa**: muestra el hueco y el
      diagnóstico lo marca (ya bloquea en `LISTA_DE_ALTA` como *avisa*; sube a
      *bloquea* solo si el dueño lo decide — §9).
- [ ] La ley citada sigue siendo la correcta: Ley 1581 de 2012 (datos) y
      Estatuto del Consumidor, art. 47 (retracto) y art. 51 (reversión).
- [ ] `GUIA-COMERCIANTE.md` explica en dos frases qué tiene que llenar.

Notas técnicas · Es la misma mecánica de `aplicarConfiguracion()`, pero el texto
pasa a ser plantilla con huecos, no prosa con datos dentro.
Baterías · Nueva `legal.js`: montar una tienda de panadería y comprobar que
ningún texto nombra un tomate, una finca ni Rionegro; y que sin `empresa_*` se
ve el hueco y no una mentira.
Riesgo · **Esto no es asesoría jurídica.** La historia entrega la mecánica; el
punto 3 de `ANTES-DE-SALIR.md` —que un abogado mire el machote— sigue abierto y
no lo cierra este plan.

---

**L-2 · La semilla de datos deja de ser de tomate**  · 3 pts

Hoy `A0_instalar()` siembra ocho productos de tomate y cinco zonas de Rionegro.

Criterios de aceptación
- [ ] Siembra **dos** filas de ejemplo, neutras y evidentemente de ejemplo
      (`EJEMPLO — bórrame`), con `Activo = No`.
- [ ] Una zona de envío de ejemplo, también `EJEMPLO`.
- [ ] El diagnóstico avisa mientras quede una fila `EJEMPLO` activa.
- [ ] `instalar()` sigue siendo idempotente: correrlo dos veces no duplica.

Riesgo · Las baterías conducen la hoja emulada, que hoy es de tomate. **Eso no
cambia**: la hoja emulada es de fábrica y es igual en todas las tiendas
(`arnes.mjs`). Lo que cambia es lo que siembra `instalar()` en una hoja de
verdad. No confundir las dos, que ya costó diez baterías en rojo una vez.

---

**L-3 · El diagnóstico ve los textos sin personalizar**  · 2 pts · depende de L-1, L-2

Criterios de aceptación
- [ ] Punto 2 del diagnóstico («¿Está terminada esta tienda?») avisa si quedan
      textos de plantilla o filas de ejemplo.
- [ ] La columna `Sin terminar` del panel lo muestra para toda la flota.

---

#### E3 · La plantilla y el horneado determinista   · 3.2

**P-1 · Nace `plantilla/index.html`**  · 5 pts

> Como equipo, queremos que el código de la tienda y los datos de un comercio
> vivan en archivos distintos, para que actualizar deje de ser fusionar.

Criterios de aceptación
- [ ] Existe `plantilla/index.html`: el `index.html` de hoy con **huecos** donde
      hoy hay datos de un comercio (`<head>`, paleta, las cinco constantes, el
      catálogo de respaldo, `EMPRESA`, el pie, el flotante).
- [ ] Los huecos son marcas explícitas, no valores de ejemplo: un horneado a
      medias tiene que verse a medias, no verse como Orgánico.
- [ ] `plantilla/index.html` **no contiene** ningún nombre, teléfono, color,
      producto ni lugar de ningún comercio. Aserción que lo comprueba.
- [ ] Abrir `plantilla/index.html` en un navegador **no** enseña una tienda:
      enseña que falta hornear.

---

**P-2 · El horneado escribe `publicar/index.html` desde la plantilla**  · 5 pts · depende de P-1

Criterios de aceptación
- [ ] `preparar-index.mjs` genera el archivo **desde cero** a partir de
      `plantilla/index.html` + lo que diga la hoja, en vez de reemplazar bloques
      dentro del archivo publicado.
- [ ] `sembrar-respaldo.mjs` sigue siendo el que escribe el respaldo, y sigue
      leyendo de `publicar/catalogo.json` (no le vuelve a preguntar al maestro).
- [ ] Sigue en pie la regla de hoy: **o se escribe entero, o no se escribe
      nada.** Si falta una clave que bloquea, no se publica y se dice.
- [ ] Borrar `publicar/index.html` y correr el montaje lo reconstruye idéntico.
- [ ] El resultado de hornear la hoja de Cinnamon Beauty es **byte a byte** el
      `publicar/index.html` que esa tienda tiene hoy, salvo los arreglos
      declarados en P-4. (Es la prueba de que el refactor no cambió el producto.)

Riesgo · Es el cambio más grande del plan. Se hace contra las tres tiendas
reales, comparando el antes y el después archivo por archivo, antes de fusionar.

---

**P-3 · También se hornean `404.html`, `compartir.jpg` y `wrangler.jsonc`**  · 3 pts · depende de P-2

Hoy los tres se heredan de Orgánico y **ninguna herramienta los regenera**;
`wrangler.jsonc` solo lo arregla una herramienta interactiva que no corre en
Actions (4.21).

Criterios de aceptación
- [ ] `publicar/404.html` sale de la plantilla con el nombre del comercio.
- [ ] `publicar/compartir.jpg` se genera con `sharp` a partir del nombre y los
      colores de la hoja (sin fuentes externas), o se toma de una clave
      `compartir_imagen` si el comercio subió la suya.
- [ ] `wrangler.jsonc` recibe `name: organico-<comercio>` **en el flujo**, sin
      preguntar nada por teclado.
- [ ] Una aserción falla si `wrangler.jsonc` dice `organico` en un repositorio
      que no es la semilla. Cierra el 4.21.

---

**P-4 · Se acaban los datos de Orgánico en el código**  · 3 pts · depende de P-1

Criterios de aceptación
- [ ] Las líneas 418, 465-467, 546 y el bloque `EMPRESA` dejan de llevar valores:
      se hornean o quedan vacías.
- [ ] La aserción de «ni una palabra del comercio de la plantilla» (hoy en
      `respaldo.js`) se extiende a **todo** `publicar/` y a `wrangler.jsonc`.
- [ ] Una tienda sin `empresa_*` muestra huecos, no «Rionegro, Antioquia».

---

**P-5 · El horneado es determinista**  · 3 pts

Criterios de aceptación
- [ ] `catalogo.json` no lleva `generado` con hora, o lo lleva derivado del
      contenido (por ejemplo, el hash) y no del reloj.
- [ ] El comentario del catálogo de respaldo no lleva la fecha del día. Si se
      quiere trazabilidad, lleva **la versión de la semilla**, que sí cambia
      cuando cambia algo.
- [ ] Las claves de `config` se ordenan en los dos archivos (hoy solo en el
      respaldo).
- [ ] Productos y envíos salen en orden estable y declarado.
- [ ] Correr `npm run montar` dos veces seguidas sin tocar la hoja deja
      `git status` limpio. **También pasada la medianoche UTC.**

---

**P-6 · Cada herramienta declara lo que escribe**  · 2 pts

Criterios de aceptación
- [ ] Cada `montar/*.mjs` exporta `ESCRIBE` con las rutas que toca.
- [ ] Una aserción compara lo declarado con lo que de verdad cambió al correr, y
      falla si una herramienta escribe algo que no declaró.
- [ ] El manifiesto (`V-1`) arma su lista `hornea` leyendo esos `ESCRIBE`. Una
      sola lista, derivada — requisito 2 del 4.18.

---

**P-7 · La batería del determinismo**  · 2 pts · depende de P-5

- [ ] Nueva `determinismo.js`: hornea dos veces con la hoja emulada y compara
      byte a byte; falsea el reloj para cruzar la medianoche y vuelve a comparar.
- [ ] Falla si alguien reintroduce una marca de tiempo.

---

**P-8 · `npm run montar` y el flujo corren el mismo orden**  · 1 pt

Hoy `package.json` corre `catalogo` **antes** que `fotos:drive`, y el flujo
después — con un comentario que explica que ese orden es el arreglo. En local,
el mapa de fotos del catálogo describe la corrida anterior.

- [ ] El orden es uno solo: `index → fotos:drive → catalogo → respaldo`.
- [ ] Una aserción compara el orden del `package.json` con el del flujo.

---

#### E4 · El paquete de versión, el manifiesto y el candado   · 4.0

**V-1 · La semilla publica su paquete y su manifiesto**  · 3 pts · depende de P-6

Criterios de aceptación
- [ ] `release.yml` cuelga `semilla.tgz` (la fuente) y `semilla.json` (el
      manifiesto de §3.3) además de lo que ya cuelga.
- [ ] El manifiesto lleva `version`, `esquema`, `exige`, `archivos` con sha256 y
      `clase`, y las listas `hornea` y `jamas`, **derivadas** de `ESCRIBE`.
- [ ] Los hashes son reproducibles: recalcularlos sobre el tarball da lo mismo.
- [ ] `release.yml` falla si un archivo del repositorio no está ni en `archivos`
      ni en `hornea` ni en `jamas`. **Nada queda sin clasificar.**

---

**V-2 · `semilla.lock`, y cómo nace en una tienda que no lo tiene**  · 3 pts

Criterios de aceptación
- [ ] Formato de §3.4, versionado en cada tienda.
- [ ] Una tienda sin `semilla.lock` (todas, hoy) puede **adoptarlo**: el flujo
      compara contra el manifiesto de la versión que la tienda dice tener y
      escribe el candado inicial, marcando como `desviado` lo que no cuadre.
- [ ] Adoptar **no cambia ni un archivo** de la tienda. Es solo escribir el
      candado. Se puede correr sin miedo.
- [ ] Si la tienda no dice qué versión tiene, se toma de `package.json`.

---

**V-3 · `montar/sincronizar.mjs`: las cuatro respuestas**  · 8 pts · depende de V-1, V-2

> Como operador, quiero que aplicar una versión nueva a una tienda decida por
> archivo y sin fusionar nunca, para que el resultado sea siempre uno de cuatro
> casos que puedo entender.

Criterios de aceptación
- [ ] Implementa la tabla de §3.4, incluida la quinta regla: lo que está en
      `hornea` no se compara, se rehornea.
- [ ] `--revisar` dice qué haría y no toca nada.
- [ ] Nunca fusiona dentro de un archivo. Sobrescribe entero, deja entero, o para.
- [ ] Un conflicto real **no aborta la sincronización**: se salta ese archivo,
      sigue con los demás, y lo reporta al final con su nombre y su causa.
- [ ] Respeta `jamas` sin excepción (`tienda.json`, `.clasp.json`, `secretos.md`,
      `originales/`, `tienda/`).
- [ ] **No toca `publicar/fotos/origen.json` jamás por copia**: se regenera. (Si
      se copiara el de la semilla, `traer-fotos.mjs` creería que las fotos del
      comercio ya no están en Drive y **las borraría**.)
- [ ] Si `exige.maestro` no se cumple con el maestro publicado de esa tienda,
      **no aplica el `index.html`** y lo dice: es el hallazgo 4.

Notas técnicas · Ocho puntos porque son cuatro caminos y cinco listas. Si se
parte: primero el comparador puro con sus pruebas, después la aplicación.
Baterías · Nueva `sincronizar.js`, con las cuatro respuestas, la quinta regla, el
caso `origen.json`, y el caso `exige.maestro`.

---

**V-4 · El manifiesto declara qué exige**  · 2 pts

- [ ] `exige.maestro` y `exige.stub` en el manifiesto, comparados contra lo que
      contesta la tienda (`?a=version`, y la versión del stub que el panel ya ve).
- [ ] Si no se cumple, el resumen dice exactamente qué hay que publicar antes.

---

**V-5 · La semilla se hace pública**  · 1 pt · **decisión del dueño (§9)**

- [ ] `laboratoriodigital/organico` público, o un secreto de organización
      *fine-grained* de solo lectura distribuido a los repositorios de la flota.
- [ ] Lo que se elija queda escrito en `DECISIONES.md` con su porqué.
- [ ] Si se hace público: repasar que no haya nada que no deba estar (ya lo
      dice el README, pero se comprueba antes, no después).

---

#### E5 · El flujo `sincronizar` en la tienda   · 4.0

**S-1 · `sincronizar.yml`, a demanda**  · 5 pts · depende de V-3

> Como operador, quiero poner al día una tienda desde su pestaña Actions, sin
> copiar archivos a mano y sin abrir un terminal.

Criterios de aceptación
- [ ] `workflow_dispatch` con tres campos: `version` (vacío = la del canal),
      `aprobacion` (`automatica` / `con-pull-request`, como los otros flujos) y
      `solo-revisar` (no escribe nada, dice qué haría).
- [ ] Baja el paquete de la versión pedida, verifica los hashes del manifiesto
      **antes** de tocar nada, y para si alguno no cuadra.
- [ ] Comprueba que lo descargado es la semilla mirando **el final** del archivo,
      no el principio: las marcas del principio las trae media descarga (lección
      del 4.18).
- [ ] Corre con la guarda de `misma-tienda.mjs`, como los demás.
- [ ] Al terminar, escribe `semilla.lock` y lo incluye en el mismo commit.

---

**S-2 · Aplicar, rehornear, probar, publicar — en ese orden y sin atajos**  · 3 pts · depende de S-1

Criterios de aceptación
- [ ] La secuencia es: aplicar → rehornear desde la hoja → **todas** las
      baterías sobre los archivos ya modificados → publicar.
- [ ] Si las baterías fallan, **no se publica nada** y la tienda sigue sirviendo
      la versión anterior. El resumen dice qué batería y qué aserción.
- [ ] Con `aprobacion: automatica` empuja a `main`; con `con-pull-request` deja
      el PR abierto. Mismo comportamiento que `fotos` y `montaje`.
- [ ] Si el rehorneado falla a mitad, el flujo **no commitea nada**: un
      `publicar/` a medias es una tienda con el `<head>` de un comercio y el
      catálogo de otro.

---

**S-3 · La prueba de humo contra la tienda viva**  · 2 pts · depende de S-2

> Como operador, quiero que después de desplegar alguien mire la tienda de
> verdad, porque las baterías prueban las piezas y no la costura (patrón 22).

- [ ] Tras el empuje, el flujo espera al despliegue y pide `sitio_url`.
- [ ] Comprueba tres cosas: contesta 200, la versión que anuncia es la nueva, y
      el catálogo que sirve tiene al menos un producto.
- [ ] Si falla, **no revierte solo**: avisa en el resumen y en el panel, y dice
      el comando exacto de la vuelta atrás (S-4). Revertir sin una persona es
      otro camino que se puede caer.

---

**S-4 · La vuelta atrás es el mismo camino con otro número**  · 2 pts

- [ ] `sincronizar` con `version: vX.Y.Z` anterior deja la tienda exactamente
      como estaba: mismo `publicar/`, mismo `semilla.lock`.
- [ ] Probado de verdad en la tienda cero, ida y vuelta, antes de cerrar la
      épica. Un camino de vuelta que nadie ha recorrido no es un camino.

---

**S-5 · El resumen que lee un humano**  · 2 pts

- [ ] El resumen de la corrida dice, en este orden: de qué versión a cuál,
      cuántos archivos se sobrescribieron, cuáles se dejaron por desvío, cuáles
      dieron conflicto, qué se rehorneó, si se publicó, y el resultado de la
      prueba de humo.
- [ ] Un conflicto se explica con la frase de §3.4 que le corresponde, no con un
      volcado de hashes.

---

#### E6 · El reparto: flota, anillos y empuje   · 4.0

**F-1 · `servicio/flota.json`**  · 2 pts
- [ ] Lista de tiendas con `repo`, `anillo` y `canal`, versionada en el
      repositorio de servicio.
- [ ] Un flujo valida el formato y que cada repositorio existe y es alcanzable.

**F-2 · El empuje**  · 3 pts · depende de F-1, S-1
- [ ] Al publicar una versión, un flujo del repositorio de servicio manda
      `repository_dispatch` a las tiendas del anillo que toque.
- [ ] El token vive **solo** ahí, es *fine-grained*, y solo puede `Contents:
      read` y `Actions: read & write` sobre los repositorios de la flota.
- [ ] `sincronizar.yml` acepta ese disparo además de `workflow_dispatch`.

**F-3 · Anillos, con espera y freno**  · 5 pts · depende de F-2
- [ ] Anillo 0 al publicar; anillo 1 a los 60 minutos; anillo 2 a las 24 horas.
- [ ] **Antes de abrir un anillo se comprueba el anterior**: todas verdes y
      contestando. Si una falló, el reparto se detiene y lo dice.
- [ ] Se puede saltar la espera a mano, y queda anotado quién lo hizo.

**F-4 · La red de seguridad**  · 1 pt
- [ ] `schedule` semanal en cada tienda que corre `sincronizar` en modo
      `solo-revisar` y avisa si está atrasada. No aplica sola: avisa.

**F-5 · El panel carea las dos listas**  · 2 pts · depende de F-1
- [ ] El diagnóstico del panel compara `flota.json` con la pestaña `Tiendas` y
      reporta las que están en una y no en la otra. Dos listas escritas a mano
      es el patrón 2; una máquina que las carea, no.

---

#### E7 · Personalización sin desviación   · 4.0

**X-1 · Los interruptores `f_*`**  · 5 pts
- [ ] Convención y lectura tipada de las claves `f_*` (§4.2), sembradas por
      `instalar()` con su valor por defecto y su explicación.
- [ ] Un valor ilegible **no** se degrada a «apagado»: se reporta.
- [ ] Llegan a la página por el mismo camino que el resto de la configuración
      (horneadas en `CONFIG_SEMILLA` y en `catalogo.json`), no por una vía nueva.
- [ ] **Cada interruptor se prueba encendido y apagado.** Aserción que falla si
      se agrega un `f_*` sin batería en los dos estados.

**X-2 · La ranura de la página**  · 3 pts · depende de P-1
- [ ] `tienda/extension.js`, opcional, cargado por la plantilla si existe.
- [ ] Los tres enganches de §4.3, documentados con su firma.
- [ ] Un error dentro de la extensión **no tumba la tienda**: se atrapa, se
      registra en consola y la página sigue.
- [ ] `tienda/` está en `jamas`: la sincronización no la mira.

**X-3 · La ranura del maestro**  · 5 pts
- [ ] `publicar-maestro.mjs` incluye `tienda/extension.gs` si existe.
- [ ] Enganches con su política de fallo declarada (tabla de §4.3).
- [ ] **No hay enganche para el total, el inventario, el sellado ni el filtro
      `pago_*`.** Aserción que falla si alguien añade uno.

**X-4 · El contrato de la extensión se versiona**  · 2 pts
- [ ] `EXTENSION.contrato` comparado con `esquema` del manifiesto.
- [ ] Si no cuadra, la extensión se desactiva y se anuncia. Nunca se ejecuta una
      extensión escrita para otro contrato.

**X-5 · El desvío declarado y su edad**  · 3 pts · depende de V-3
- [ ] `semilla.lock.desviado` con `desde` y `porque`.
- [ ] Cada corrida dice cuántas versiones lleva desviado cada archivo.
- [ ] Un desvío **sin** declarar se detecta igual y sale como conflicto.

**X-6 · El umbral de deriva**  · 2 pts · depende de X-5
- [ ] Más de tres archivos desviados, o más de dos versiones con uno, sale en el
      panel como aviso de la tienda, no como error del flujo.

---

#### E8 · El carril del maestro y el stub   · 4.1

**M-1 · La medición de diez minutos**  · 1 pt · **primero, antes de escribir código**
- [ ] Comprobar en una hoja de verdad si un `onOpen` **simple** puede leer
      `PropertiesService` / `CacheService`. Es la condición 8 de
      `EVALUACION-stub-automatico.md` y decide entre las dos formas de 4.17.
- [ ] El resultado se escribe en esa evaluación, con fecha. Sea cual sea.

**M-2 · El stub deja de repegarse**  · 5-8 pts · depende de M-1
- [ ] Si M-1 sale bien: **ranuras fijas** —el stub declara N opciones genéricas y
      los rótulos salen de lo último leído, guardado en la hoja—.
- [ ] Si M-1 sale mal: **un solo ítem de menú que abre un panel lateral**, que sí
      corre autorizado. Y entonces el panel **reemplaza** al menú, no se suma
      (condición 9 de la evaluación: dos caminos para lo mismo es el patrón 2).
- [ ] En los dos casos: cambiar el menú deja de exigir entrar a N hojas.

**M-3 · Publicar el maestro de varias tiendas, con una persona delante**  · 5 pts
- [ ] Un flujo del repositorio de servicio publica el maestro en las tiendas que
      se marquen, **manteniendo la puerta**: casilla y `PUBLICAR` escrito.
- [ ] Publica con `publicar-maestro.mjs` —versión nueva sobre la implementación
      que existe, nunca una implementación nueva— y **comprueba por el
      resultado**: pregunta `?a=bloques`, no se fía del código de respuesta.
- [ ] Va tienda por tienda y no se detiene por una que falle: informa al final.
- [ ] Si una tienda no tiene `CLASPRC` válido, lo dice y sigue con las demás.

**M-4 · El acoplamiento index↔maestro, explícito**  · 3 pts · depende de V-4
- [ ] `sincronizar` no publica un `index.html` que exija un maestro más nuevo
      que el publicado.
- [ ] El panel muestra las dos versiones juntas y marca la que va atrasada.

**M-5 · `?a=instalar` remoto**  · 3 pts
- [ ] El flujo puede pedirle al maestro que corra `instalar()` para crear
      pestañas y claves nuevas, con el token de montaje y por la puerta que ya
      existe (nada de un `doGet` nuevo ni un cuarto secreto).
- [ ] Es idempotente y no pisa lo que el comerciante escribió (ya lo es; que se
      compruebe desde fuera).

---

#### E9 · Lo que quita techo: variantes y consulta de estado   · 4.2

**N-1 · El contrato: `Variantes`, al final**  · 3 pts
- [ ] Columna nueva **al final** de `Catálogo` (regla R1), opcional.
- [ ] Sintaxis corta y explicada en la propia hoja:
      `Talla: S|M|L ; Color: Rosa|Nude`.
- [ ] Un maestro viejo con una hoja nueva **sigue funcionando**: ignora la
      columna. Un maestro nuevo con una hoja vieja, también.
- [ ] `CONTRATOS.md` actualizado en el mismo commit.

**N-2 · El maestro las entiende**  · 5 pts · depende de N-1
- [ ] `?a=catalogo` devuelve `variantes: [{nombre, opciones[]}]`.
- [ ] Lo ilegible es ilegible: `Talla S M L` sin separadores se reporta con su
      celda, no se adivina.
- [ ] Interruptor `f_variantes` (X-1) para encenderlo por tienda.

**N-3 · La página las enseña y las manda**  · 5 pts · depende de N-2
- [ ] Selector por variante en la ficha; no se puede agregar al carrito sin
      elegir.
- [ ] La elección viaja en el mensaje de WhatsApp y en el pedido.
- [ ] El catálogo de respaldo las lleva: sin red, las variantes siguen ahí.

**N-4 · El pedido las guarda**  · 3 pts · depende de N-3
- [ ] Columna `Variante` al final de `Pedidos`.
- [ ] El inventario sigue moviéndose por producto.

**N-5 · Stock por variante: no, y por qué**  · 0 pts · **decisión**
- [ ] Queda escrito en `DECISIONES.md`: el stock es del producto, no de la
      variante. **Disparador para revisarlo**: el primer comercio que pierda una
      venta por vender una talla agotada. Antes de eso, una fila por variante
      —que es lo que se hace hoy— sigue siendo la salida.

**C-1 · El comprador consulta su pedido**  · 5 pts
- [ ] `tienda.com/?pedido=ABC123` muestra estado, fecha y qué se pidió.
- [ ] `?a=estado&pedido=` devuelve **solo** eso. Ni nombre, ni celular, ni
      dirección — que además no están guardados, y así se queda.
- [ ] Interruptor `f_consulta_estado`.
- [ ] Sin red, la página lo dice; no inventa un estado.

**C-2 · El número de pedido no se puede adivinar**  · 3 pts · **antes que C-1**
- [ ] Revisar el formato actual; si es correlativo o corto, añadir sufijo
      aleatorio suficiente.
- [ ] Los pedidos viejos siguen consultándose.
- [ ] Un intento fallido no dice si el número existe.

---

#### E10 · Observabilidad de la flota   · continua

**O-1 · La versión de la semilla, por tienda**  · 3 pts · columna en el panel, con la deriva y la edad del desvío.
**O-2 · El tiempo de publicación, por tienda**  · 3 pts · p50 y p95 de los últimos `tiempos.json`, y aviso si una tienda se sale del presupuesto.
**O-3 · El correo del operador habla de la flota**  · 2 pts · una línea: tiendas al día, atrasadas, desviadas, y con el maestro por publicar.

---

### 7.4 La cartera que queda definida pero sin historia

Estas están decididas como *qué*, no como *cómo*. Se detallan cuando entren en
una versión, no antes — escribir historias para algo que no se va a hacer este
trimestre es documentación que envejece sola (patrón 23).

| | Qué | Roadmap |
|---|---|---|
| H5 | Archivado de `Pedidos` y `Validaciones` | 4.6 |
| H6 | Restauración probada, no solo respaldo | 4.25 |
| H7 | `horario`: clave muerta, o se pinta o se retira | — |
| H8 | Anunciar el envío gratis antes del sello | — |
| H9 | Orden del catálogo | — |
| H10 | Tienda cerrada y mínimo de pedido | — |
| H11 | «Avísame cuando llegue» | 2.2 |
| H12 | SEO con JSON-LD y sitemap | 2.3 |
| H13 | Columnas del catálogo configurables | 4.13 |
| H14 | Probar en un celular real | 0.3 |
| — | `clasp login` sin máquina con Node | 4.14 |
| — | Abrir la `/exec` desde un flujo | 4.15 |
| — | Campos obligatorios marcados en la hoja | 4.16 |
| — | Fundir `fotos` y `montaje` en un flujo con parámetro | 4.22 |
| — | Sembrar los secretos desde el diagnóstico | 4.24 |

**4.18 y 4.21 se cierran con este plan** (E4-E6 el primero, P-3 el segundo).
**4.22 conviene hacerlo dentro de E5**: `sincronizar`, `fotos` y `montaje` van a
compartir la secuencia aplicar-hornear-probar-publicar, y tres flujos con la
misma secuencia son tres sitios donde arreglar el mismo fallo.

### 7.5 El mapa de dependencias, en corto

```
R-1 ─→ R-2 ─→ R-6          (medir, y solo entonces optimizar)
R-5 ────────→ P-5           (el lock también da determinismo)
P-1 ─→ P-2 ─→ P-3, P-4
P-6 ─→ V-1 ─→ V-3 ─→ S-1 ─→ S-2 ─→ S-3
V-2 ──────────↗              (adoptar el candado no cambia archivos)
S-1 ─→ F-2 ─→ F-3
V-3 ─→ X-5 ─→ X-6
M-1 ─→ M-2                   (una medición decide el diseño)
N-1 ─→ N-2 ─→ N-3 ─→ N-4
C-2 ─→ C-1                   (primero que no se adivine, después consultarlo)
```

Camino crítico de la 4.0: **P-6 → V-1 → V-3 → S-1 → S-2**. Todo lo demás se
puede hacer en paralelo o después.

---

## 8 · Riesgos

| Riesgo | Cómo se ve cuando pasa | Qué lo contiene |
|---|---|---|
| **P-2 cambia sin querer lo que ve el comprador** | Una tienda se ve distinta después de un refactor que «no cambiaba nada» | Comparar byte a byte el horneado nuevo contra el `publicar/index.html` de las tres tiendas reales antes de fusionar (criterio explícito de P-2) |
| **La sincronización publica una tienda rota** | La tienda sirve un `<head>` de un comercio y un catálogo de otro | S-2: no se commitea nada si el rehorneado falla; las baterías corren sobre los archivos ya modificados |
| **Un empuje rompe la flota entera** | Tres tiendas caídas a la vez | Anillos con freno (F-3). El anillo 0 es nuestra tienda |
| **El candado se llena de falsos conflictos** | Cada corrida reporta desvíos que nadie hizo | Determinismo (P-5, P-7) y `package-lock.json` (R-5). Sin eso, el candado es ruido |
| **`origen.json` se copia de la semilla** | Las fotos del comercio se borran y se vuelven a bajar; la tienda pasa por un estado sin fotos | Criterio explícito en V-3, y una aserción |
| **El token del empuje se filtra** | Alguien dispara flujos en las tiendas | Vive solo en el repositorio de servicio, es *fine-grained*, y solo puede leer contenido y disparar flujos. Rotable sin tocar ninguna tienda |
| **Las ranuras se convierten en un fork** | Cinco tiendas con código propio y ninguna actualizable | X-6: umbral, y el panel lo enseña |
| **Se optimiza el flujo y se pierde el guardia** | Una publicación rápida que no probó nada | R-9 va al final y detrás de una medición; el subconjunto de baterías está descartado por escrito (§5.4) |
| **La 4.0 obliga a tocar tres tiendas a mano** | El plan que quitaba trabajo manual empieza con trabajo manual | V-2: adoptar el candado no cambia archivos y se puede correr sin miedo |

---

## 9 · Las cuatro decisiones que no son de código

Esto no lo decide el equipo. Cada una va a `DECISIONES.md` con su disparador y
su contrapartida en cuanto haya respuesta.

**1. ¿La semilla se hace pública?** Las tiendas ya son públicas —es lo que hace
gratis e ilimitado Actions— y llevan dentro el código de la semilla. Así que hoy
el código **ya está a la vista**, y mantener privada la semilla no protege nada:
solo obliga a repartir un token de lectura a toda la flota. Hacerla pública
simplifica E4-E6 a cero credenciales y cierra el fallo que hundió el intento de
la 2.12.0 (un 404 por versiones no públicas). Lo que se protege de verdad no es
el código: es la hoja, la operación y la relación con el comercio.
**Recomendación: pública.** Si la respuesta es no, hace falta el secreto de
organización de solo lectura, y eso es V-5.

**2. ¿Faltar los `empresa_*` bloquea la publicación, o solo avisa?** Hoy avisa.
Con L-1, un texto legal sin responsable es un texto legal sin valor. Subirlo a
*bloquea* es más honesto y más incómodo: una tienda no sale al aire sin sus
datos legales. **Recomendación: bloquea**, en la misma versión que L-1, y
diciéndolo en el manual.

**3. ¿Cuánto se le cobra a un comercio por una ranura?** El nivel 2 de §4.1 es
trabajo de desarrollo a medida con mantenimiento perpetuo. Si no tiene precio,
toda petición rara acaba en la semilla o en un desvío. No hace falta la cifra
hoy; hace falta que exista antes de la primera petición.

**4. ¿Hasta dónde llega el compromiso de actualización?** Una tienda al día es
una promesa comercial: si se cae por una versión que empujamos nosotros, es
nuestra. Conviene escribir qué se promete —«las correcciones llegan solas; las
funcionalidades nuevas, también, salvo que cambien la hoja»— antes de que un
comercio lo dé por hecho de otra manera.

---

## 10 · Cómo se cierra este documento

Cuando la 4.2 esté publicada:

1. §3 y §4 se promueven a `ARQUITECTURA.md` en presente, como diseño de hoy.
2. Las decisiones de §9, ya contestadas, viven en `DECISIONES.md`.
3. Lo que se rompió por el camino está en `BITACORA.md`, con su patrón.
4. Lo que quedó sin hacer vuelve a `ROADMAP.md`, numerado.
5. **Este archivo se borra.**

Si en ese momento alguien duda de si borrarlo, el patrón 23 ya contestó: un
documento redundante no se marca como viejo, se borra.
