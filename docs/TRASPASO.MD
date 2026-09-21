# Traspaso — la semilla nueva de tienda

_18 de septiembre de 2026. Repositorio `laboratoriodigital/tienda` ·
carpeta `D:\CoWork\tienda`._

**Léeme primero si abres una sesión nueva.** Esto es todo el contexto que hace
falta para seguir. Después, en este orden: `PLAN-MVP.md` (qué hay que
construir), `ROADMAP.md` (qué viene después), `CONTRATOS.md` (lo que no se puede
romper) y `BITACORA.md` (por qué el código es raro donde es raro).

---

## 1 · Dónde estamos, en un párrafo

Este repositorio es **la semilla de la segunda versión de la tienda virtual**.
El producto se llama **tienda**. Nació como copia de la semilla de la línea
anterior en su versión 3.0.0, con sus defectos dentro.

El repositorio arranca en **0.1.0** y el MVP sale como **1.0.0**. El MVP son
**cuatro hitos, M0 a M3** — el tablero gráfico, el rastreo del pedido y la
actualización automática de la flota quedaron **fuera**, y son la entrega 1.1.

**Dónde va el trabajo (21 de septiembre de 2026):**

| Hito | Estado |
|---|---|
| **M0** · La semilla limpia y determinista | **Cerrado.** Las nueve historias, con su evidencia en `PLAN-MVP.md` |
| **M1** · Rendimiento y cuota | **Cerrado.** Las siete historias. De B-2 quedan abiertos sus dos criterios de panel, que son M3 y no deuda |
| **M2** · La tienda para todo producto | C-1 (variantes), C-2 (SEO) y C-4 (orden del catálogo) **cerradas**. Faltan **C-3** y **C-1b** — inventario y fotos por variante, agregada el 21 de septiembre (decisión 11) |
| **M3** · El panel del comerciante | D-1 (entrar) y D-2 (productos y fotos) **cerradas**: `publicar/admin.html` existe y funciona. Faltan D-3 a D-7 |

Los números de M1, que son los que deciden si cabe una tienda más:

- El flujo `fotos` pasó de **seis arranques diarios a uno**, y el diario no
  publica: mira y avisa. Era el 84 % de los minutos de una tienda.
- De **siete peticiones fijas al maestro a cuatro**, y las cuatro a la vez.
- Las fotos van en tandas de cuatro, y **una rota ya no impide publicar las
  demás** —antes, doce fotos con una corrupta publicaban cero—.
- Cada corrida deja su tabla de tiempos y un `tiempos.json`, y hay un guardia
  contra `presupuesto.json` que falla si algo tarda más del doble de lo previsto.

**Medido en producción el 19 de septiembre de 2026**, en corridas del flujo
real con la hoja real: el montaje que antes tardaba **3 min 08 s** corrió en
**46 segundos** sin cambios que publicar, y en **2 min 19 s** con el horneado
entero por delante. Los dos, holgadamente dentro del presupuesto de
`presupuesto.json`.

Por donde sigue una sesión nueva: **D-3, pedidos desde el panel**. La pantalla
ya existe —`publicar/admin.html`, horneada por `montar/preparar-admin.mjs`— y
todo lo que D-3 necesita del maestro ya tiene su patrón en D-2: puertas
declaradas en `PUERTAS` con guardia `panel` y `soloPost`, escrituras dentro de
`conOperacion` (llave + número de operación) y, cuando se edita algo que otro
puede estar tocando, la `version` de la fila. Cambiar el estado de un pedido
tiene que mover el inventario igual que hacerlo en la hoja: eso ya lo hace
`aplicarInventario`, y D-3 lo tiene que llamar, no copiar.

Después, por orden del dueño: D-4 a D-7, y **C-1b** —el stock y las fotos por
combinación—, escrita en el plan con sus decisiones tomadas y las dos que quedan
por tomar. **C-3** (envío gratis anunciado, horario, tienda cerrada, mínimo de
pedido) sigue pendiente y no depende de nada.

Un pendiente chico que no es de ninguna historia: `publicar/404.html` todavía
dice «Orgánico» y lleva sus colores. Es de la línea anterior y ninguna batería
lo mira; lo encontró quien revisaba otra cosa.

---

## 2 · Qué es el producto

Una tienda en línea para comercios pequeños colombianos, con **costo de
infraestructura de $0 al mes**. Cada comercio tiene lo suyo, separado de los
demás:

| Pieza | Qué es | De quién es la cuenta |
|---|---|---|
| `publicar/index.html` | La tienda. Una página estática, servida por Cloudflare Workers | Una sola cuenta nuestra, para todas |
| La hoja de Google | La base de datos: catálogo, configuración, pedidos, cupones, envíos | **Una cuenta de Google por tienda**, creada por el operador |
| `maestro.gs` | El backend, en un proyecto de Apps Script **suelto** (no unido a la hoja) | La misma cuenta de esa tienda |
| El stub | 46 líneas pegadas dentro de la hoja. Solo dibuja el menú | La misma |
| Las fotos | Originales en el Drive de esa cuenta; publicadas como WebP en el repositorio | La misma |
| El repositorio | Uno por tienda, creado a partir de esta plantilla. **Privado** | Nuestra |
| WhatsApp | Donde se cierra la venta y se entrega la llave de pago | Del comercio |

**Google se reparte** (una cuenta por tienda, para que cada una gaste sus
propios límites gratuitos). **Cloudflare y GitHub se centralizan.** No es una
inconsistencia: son límites de naturaleza distinta.

**Cómo funciona una venta:** el comprador arma el carrito en la página, el
servidor recalcula el total con los precios de la hoja y sella el pedido, se
abre WhatsApp con el mensaje armado, el comercio confirma y manda la llave de
pago por la respuesta automática del chat, el comprador transfiere, el comercio
marca *Pagado* en la hoja y el inventario baja solo.

**Cómo se actualiza la tienda:** el catálogo **no se lee en vivo**. Se hornea y
se publica: el comerciante aprieta un botón y un flujo de GitHub escribe el
`<head>`, baja las fotos del Drive, hornea el catálogo, escribe el catálogo de
respaldo dentro de la página, corre las baterías y empuja. Cloudflare despliega.

---

## 3 · Qué cambia en esta línea

Siete decisiones del 18 de septiembre de 2026. Están en `PLAN-MVP.md` §0 con su
razonamiento; aquí en corto:

1. **Semilla y tiendas privadas.** La semilla se hará pública cuando el dueño
   llegue al umbral que está midiendo; las tiendas, nunca. **Consecuencia que
   manda sobre todo lo demás: en privado los minutos de Actions se pagan.**
2. **El único pull request manual es el de la semilla.** En las tiendas todo
   fusiona solo — catálogo, fotos, `index.html` y maestro—, y a cambio hace
   falta verificación automática después de publicar y vuelta atrás automática.
3. **Proyecto aparte** de la línea vieja.
4. **Ni rastro del comercio anterior en el código.** Todo desde la hoja.
5. **El comerciante administra desde una página web**, no desde la hoja. La hoja
   sigue siendo la base de datos, deja de ser la interfaz. En el MVP entra el
   **panel de gestión**; el tablero gráfico y el rastreo del pedido son la 1.1.
6. **Autoría al pie**: *Powered by Laboratorio Digital*, con enlace y con
   interruptor para quitarla.
7. **MVP antes que ambición.** El plan grande existe; se recortó a lo mínimo
   vendible y el resto está en el `ROADMAP.md`.
8. **El producto se llama «tienda»**, empieza en `0.1.0` y el MVP sale como
   `1.0.0`.
9. **Sin datos básicos de empresa no se publica.** Razón social, NIT o cédula,
   dirección, ciudad y al menos un canal de contacto pasan de *avisan* a
   *bloquean*: un texto legal sin responsable no vale nada.
10. **El MVP son M0 a M3**, y lo que se sacó está en el `ROADMAP.md` con su
    orden ya decidido —tablero, rastreo, flota— y sus condiciones escritas.

---

## 4 · El estado real del código, sin adornos

Ocho hallazgos de la medición del 18 de septiembre. Los cinco primeros eran el
hito M0 y **están cerrados**; el 8 se cerró en M1 (B-7). Quedan vivos el **6**
(B-3) y el **7** (B-4). Se dejan escritos enteros porque explican por qué el
código es como es donde todavía lo es:

1. **`publicar/index.html` es fuente y producto a la vez.** No hay plantilla
   separada: las herramientas reemplazan bloques marcados dentro del archivo que
   se publica. Mientras siga así, actualizar una tienda es fusionar.
2. **Quedan datos del comercio anterior donde nadie los hornea**: el pie, el
   bloque `EMPRESA` (una ciudad y un teléfono reales), el `wa.me` del botón
   flotante, `404.html`, `compartir.jpg` y el `name` de `wrangler.jsonc`. En
   tiempo de ejecución se tapan; el archivo publicado los lleva dentro.
3. **Los textos legales hablan de tomates.** El derecho de retracto nombra tres
   variedades de tomate y «recoger en la finca». Cualquier comercio que publique
   con esta plantilla firma eso ante sus compradores. Es lo más caro de los
   ocho.
4. **`SCRIPT_VERSION` sale del maestro publicado, no del repositorio.** El
   `index.html` y el maestro no se pueden actualizar por separado: si el index
   va por delante, la tienda avisa desajuste de versión y deja de sellar
   pedidos.
5. **El horneado no es determinista**: fecha del día dentro del catálogo de
   respaldo (cambia al cruzar la medianoche UTC aunque nada cambie), marca de
   tiempo en el catálogo, claves sin ordenar, y `package-lock.json` ignorado —
   así que la versión de la librería que convierte las fotos puede cambiar sola.
6. **Al maestro se le pregunta tres veces lo mismo** por corrida. Con el
   arranque en frío de Apps Script (documentado en 40 s o más), eso está en el
   camino crítico.
7. **Las fotos se bajan y se convierten en serie**, y los cuatro tamaños de cada
   foto también.
8. **`limites.js` levanta un navegador y no está en la lista de `todas.sh`**: no
   corre nunca.

Y uno de política, que reordena el plan: **el cron de cuatro horas del flujo de
publicación se lleva el 84 % de los minutos de Actions**. Con repositorios
privados, eso hace que la cuarta tienda no quepa en el plan gratuito. El MVP lo
sustituye por publicación a demanda más una red de seguridad diaria: de ~535 a
~100 minutos al mes por tienda.

---

## 5 · Las reglas que no se vuelven a discutir

- **Ningún comercio va escrito en el código.** Todo sale de la pestaña
  `Configuración` de su hoja.
- **Nada de la tienda se escribe a mano en `publicar/`.** Todo lo suyo lo pone
  el horneado. El día que alguien meta ahí un valor a mano, el siguiente
  horneado lo borra sin decir nada.
- **La llave de pago no va en la página ni en el repositorio.** Se entrega por
  la respuesta automática de WhatsApp. Hay tres filtros distintos que la quitan,
  a propósito.
- **La tienda no guarda nombre, celular ni dirección del comprador.** Viven solo
  en la conversación de WhatsApp. La hoja guarda qué se pidió y la ciudad.
- **Nunca una implementación nueva de Apps Script.** Siempre: Gestionar
  implementaciones → lápiz → Versión: Nueva. Una implementación nueva estrena
  URL y deja la tienda muda.
- **Campo nuevo, al final y opcional.** El maestro lee por posición, no por
  nombre de encabezado: insertar una columna en medio descuadra todo en
  silencio.
- **Una cifra que no se puede leer no vale cero.** `$9.000` escrito en una celda
  no es «gratis»: es ilegible, y se reporta con su celda.
- **Fallo abierto en el catálogo, fallo cerrado en los cupones.** Si la hoja no
  contesta, la tienda sirve su catálogo de respaldo; un cupón sin validar no se
  aplica.
- **Una batería que no distingue el fallo del acierto no sirve.** Antes de dar
  por buena una comprobación, hay que verla fallar con el defecto puesto.

---

## 6 · Cómo se trabaja

```
banco de la nube            →   puente de dispositivo      →   GitHub
(/home/claude/…)                (D:\CoWork\tienda)             (lo empuja el operador)
se edita y se prueba aquí       aquí quedan los archivos       nadie más
```

1. Los cambios se hacen y se prueban en el banco de la nube.
2. **Todas las baterías en verde**: `cd pruebas && ./todas.sh`.
3. Se aplican en `D:\CoWork\tienda` por el puente.
4. **El push lo hace el operador.** Ni el banco ni el puente empujan a GitHub.

**Cuatro trampas del puente, y las cuatro se repiten en cada sesión:**

- Después de un commit en la máquina del operador quedan archivos `.git/*.lock`
  que el puente no puede borrar hasta pedir permiso de borrado.
- **`.github/` está protegido** para escritura remota: los flujos se editan con
  un script desde el intérprete del puente, no copiando archivos.
- El banco de la nube no trae el navegador que pide Playwright. Hay uno en
  `/opt/pw-browsers` y se enlaza con `PLAYWRIGHT_BROWSERS_PATH`.
- El puente se cae y vuelve solo. Si una llamada falla por «no hay dispositivo»,
  no es la máquina del operador: es el enlace, y vuelve.

**Las baterías** corren sobre el código real, no sobre una copia: `pruebas/gas.js`
emula Apps Script y Sheets y **carga `maestro.gs` tal cual**. `pruebas/arnes.mjs`
escribe un `index.html` de pruebas con el catálogo de la hoja emulada, para que
el archivo y la hoja que se prueban sean del mismo comercio.

---

## 7 · Qué documento manda para qué

| Documento | Para qué | Estado |
|---|---|---|
| **`PLAN-MVP.md`** | Qué hay que construir ahora, con historias y criterios | Nuevo, vigente |
| **`ROADMAP.md`** | Qué se construye y en qué orden, incluido lo que queda fuera del MVP | Nuevo, vigente |
| **`CONTRATOS.md`** | El contrato de datos. **Normativo**: dice qué NO se puede hacer | Heredado, vigente |
| **`ARQUITECTURA.md`** | Qué vive dónde y por qué | Heredado. **Describe la línea vieja**: hay que actualizarlo a medida que M0-M6 cambien las cosas |
| **`BITACORA.md`** | Todo lo que se rompió y la lección que dejó. 23 patrones | Heredado. Es historia y se lee como historia; no se reescribe |
| **`DESPLIEGUE.md`** | Cómo se monta una tienda, de punta a punta | Heredado. **Quedará desactualizado con el panel web**: se rehace en M3 |
| **`DECISIONES.md`** | Decisiones con su condición de disparo y su contrapartida | Heredado + dos nuevas de esta sesión |
| **`GUIA-COMERCIANTE.md`** | La página que se le imprime al comercio | Heredado. **Se rehace en M3** para explicar el panel, no la hoja |
| **`EVALUACION-stub-automatico.md`** | Por qué el stub se pega a mano, y las dos salidas posibles | Heredado, vigente |
| **`ACTUALIZAR-UNA-TIENDA.md`** | Poner al día una tienda a mano | Heredado y **vigente más tiempo del previsto**: la actualización automática (S3) salió del MVP, así que esto es el procedimiento real hasta la 1.1 |
| **`ANTES-DE-SALIR.md`** | Lo que falta mirar antes del primer comprador real | Heredado, vigente |

**Regla de esta casa, aprendida cara (patrón 23):** un documento redundante no
se marca como viejo, **se borra**. Si aparecen dos guías contando lo mismo, se
rescata lo vivo de una y se elimina.

---

## 8 · Lo primero que hay que hacer

En este orden, y sin saltarse el primero:

1. **Leer `PLAN-MVP.md` entero.** Son 40 KB y contestan casi todo lo que la
   sesión nueva va a preguntar.
2. **Confirmar el presupuesto de minutos de Actions** en Settings → Billing de
   la cuenta de GitHub. Es el único número del plan que depende de un tercero, y
   decide si el hito M1 es urgente o solo conveniente.
3. **Seguir por B-4 y después B-3**, que es lo que queda de M1. B-4 está
   acotada a `montar/traer-fotos.mjs` y se puede probar en el banco; B-3 toca el
   protocolo con el maestro y conviene hacerla con tiempo y con los tiempos de
   `tiempos.json` de varias corridas delante, que para eso se midieron.
4. **Correr las baterías antes de tocar nada**, para tener el verde de partida
   (hoy, 1519/1519):
   `cd pruebas && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers ./todas.sh`
   La salida entera de cada batería queda en `pruebas/.salida/`, que es donde se
   lee el fallo que el marcador solo resume.

---

## 9 · Decisiones

**Cerradas el 18 de septiembre de 2026.** En `DECISIONES.md`: el bloqueo por
datos de empresa (09) y el nombre y la versión (10). En `PLAN-MVP.md` §8: el
alcance —el MVP son **M0 a M3**— y el aplazamiento del tablero, el rastreo y la
flota automática a la entrega 1.1.

**Abiertas.** Ninguna bloquea el MVP:

1. **El precio de quitar la marca de autoría**, y el de una funcionalidad a
   medida. Que exista antes de la primera petición de un cliente.
2. **Qué se le promete al comerciante sobre las actualizaciones automáticas.**
   Se contesta cuando llegue S3: hasta entonces las tiendas se ponen al día a
   mano y no hay promesa que romper.
3. **Cuándo se hace pública la semilla.** Depende del umbral de consumo que el
   dueño está midiendo. No bloquea nada del MVP.

Cuando se contesten, van a `DECISIONES.md` con su disparador y su contrapartida,
y se quitan de aquí.
