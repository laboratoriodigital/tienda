# Traspaso — la Tienda 2.0 (Tienda Panel)

_Al 30 de septiembre de 2026 · semilla en la **1.0.0**. Repositorio
`laboratoriodigital/tienda`._

**Léeme primero si vas a OPERAR la Tienda 2.0 o abres una sesión nueva sobre
ella.** Aquí está el mapa: qué hay, dónde vive cada cosa y cómo empezar. Lo
demás está enlazado; no se repite aquí.

> **¿Vas a arrancar la Tienda 3.0?** Este no es tu documento. La 3.0 es un
> proyecto nuevo, desde cero, y empieza en **[`TRASLADO-3.0.md`](TRASLADO-3.0.md)**:
> qué hereda de esta (la bitácora, las decisiones, los patrones) y qué no.
> «3.0» es el nombre de ese proyecto; no tiene que ver con las versiones 3.x
> de Orgánico.

---

## 1 · Dónde estamos, en un párrafo

Este repositorio es **la Tienda 2.0** —el producto *Tienda Panel*— y su
semilla: una tienda en línea para comercios pequeños, con la hoja de Google
como base de datos, un panel web para el comercio y WhatsApp o Bold para
cobrar. Costo de infraestructura: **$0 al mes**. Es **el caballo de batalla:
el único producto que se administra y se vende**. Nació el 18 de septiembre de
2026 como copia de la semilla de la línea anterior (`organico` 3.0.0) y el 30
de septiembre cerró su MVP con la **1.0.0**: M0 a M5 y el panel completo,
**se actualiza sola** desde la 0.14.0 y tiene su **flota** en
`laboratoriodigital/tiendas`. Lo que la 1.0.0 trajo y cerró está en la
bitácora 113; lo que queda abierto, en §9, y es casi todo del dueño o de
fuera de este repositorio.

---

## 2 · Los repositorios

| Repositorio | Qué es | Versión |
|---|---|---|
| `laboratoriodigital/tienda` | **Esta semilla** (Tienda Panel). También es una tienda: la de Laboratorio Digital, `tienda.laboratorio-digital.com` | `package.json` |
| `laboratoriodigital/tiendas` | **El servicio**: `alta` y `conectar` de tiendas nuevas, la **flota** (estado, actualizar por anillos, entregar flujos) y el flujo `panel`. Los secretos poderosos viven solo ahí | — |
| Una por comercio (hoy, `prueba1`, anillo 2) | Las **tiendas hijas**: nacen de una etiqueta de esta semilla y se actualizan solas | la de la etiqueta que traen |
| `laboratoriodigital/organico` | **Orgánico**, la **Tienda Básica** (solo la hoja), 3.x, con su cliente Cinnamon Beauty. Otra línea: se actualiza por pull request desde la flota. Queda **como está, solo con correcciones, hasta que sus clientes se migren a la Tienda 2.0** (abajo). **Fuera de esta documentación** | 3.x |

Qué tiendas hay y en qué anillo: `tiendas/flota.json`. De esta línea hay dos:
la semilla (Laboratorio Digital, `tienda.laboratorio-digital.com`) y `prueba1`;
`prueba-panel` salió de la flota. Qué versión tiene cada una y qué contesta
publicada: `tiendas/ESTADO.md` (lo escribe `flota › estado` los lunes).

**Orgánico se migra, cliente por cliente.** Hasta el 30 de septiembre de 2026 la
decisión 20 decía que las tiendas 3.x no se pasaban a esta línea. Cambió
(decisión 36, que revoca la 20): la 2.0 es el único producto, así que cada
cliente de la Básica se migra a ella cuando convenga —hoy, Cinnamon Beauty—.
No se sincroniza código entre las dos semillas: se monta una tienda 2.0 nueva
para ese comercio (`RUNBOOK-TECNICO.md`) y se le pasan sus datos.

Todos son **privados**. Consecuencia que manda sobre muchas decisiones: los
minutos de Actions se pagan (`presupuesto.json`).

---

## 3 · Qué es cada pieza, y de quién es la cuenta

| Pieza | Qué es | Cuenta |
|---|---|---|
| `publicar/` | La tienda: `index.html`, `admin.html` (el panel), `pedido.html`, el catálogo horneado y las fotos. Cloudflare Workers la sirve | Una de Cloudflare, nuestra, para todas |
| La hoja de Google | La base de datos: catálogo, configuración, pedidos, cupones, envíos | **Una cuenta de Google por tienda** |
| `maestro.gs` | El backend, en un proyecto de Apps Script suelto (no unido a la hoja) | La misma de la tienda |
| El stub | Unas líneas pegadas en la hoja: solo dibujan el menú. Lo genera `A1_generarStub()` | La misma |
| Las fotos | Originales en el Drive de esa cuenta; publicadas en `publicar/fotos` | La misma |
| `panel.gs` | La hoja *Panel de tiendas*: el operador ve todas las tiendas y sus cifras | La del operador |
| El repositorio | Uno por tienda | GitHub, nuestra |

Google se reparte (cada tienda gasta sus propios límites); Cloudflare y GitHub
se centralizan.

**Cómo funciona una venta:** el comprador arma el carrito, el maestro recalcula
el total con los precios de la hoja y sella el pedido, se abre WhatsApp con el
mensaje armado (o se paga con Bold), el comercio marca **Pagado** y el
inventario baja solo.

**El catálogo no se lee en vivo:** se hornea. «Publicar ahora» (panel o menú)
dispara el flujo `fotos`, que aplica la hoja, baja las fotos, hornea, corre la
compuerta y publica en `main`; Cloudflare despliega.

---

## 4 · Dónde está cada cosa, en esta semilla

| Ruta | Qué hay |
|---|---|
| `maestro.gs` | El backend. `VERSION` (la del contrato con la página) y `VERSION_TIENDA` (= `package.json`) |
| `panel.gs` | La hoja de administración. Se publica con Actions › **panel** en `tiendas` |
| `plantilla/` | El código de la página: `index.html`, `admin.html`, `pedido.html`, `404.html`. `publicar/` se hornea de aquí más la hoja |
| `publicar/` | Lo que se despliega. En una tienda, lo escribe el horneado; a mano no se toca |
| `montar/` | Las herramientas: hornear (`preparar-index`, `catalogo-estatico`, `traer-fotos`, `sembrar-*`), publicar el maestro (`publicar-maestro`), actualizarse (`actualizar-semilla`, `semilla`), volver atrás (`volver-atras`) |
| `pruebas/` | Las baterías. `todas.sh` las corre todas; `publicacion.sh` decide qué corre al publicar; `tienda-viva.js` es la compuerta de una tienda |
| `.github/workflows/` | `montaje`, `fotos`, `pruebas`, `restaurar` (van a las tiendas) y `release` (solo la semilla) |
| `semilla.json` | Qué archivos son de la semilla (`propios`) y cuáles retiró (`retirados`) |
| `presupuesto.json` | El presupuesto de tiempo y de minutos de Actions, que vigilan los flujos |
| `docs/` | Ver §8 |

---

## 5 · Cómo se mueve una versión

`package.json` sube → push a `main` → `pruebas` en verde → Actions ›
**release** corta `vX.Y.Z` (y pone al día el maestro de la propia semilla) →
cada tienda la pide: `flota › actualizar`, su `montaje` con `semilla`, o el
botón del panel o del menú. La tienda se trae los archivos, publica su maestro,
rehornea, pasa la compuerta de la tienda viva y publica; si algo falla, queda
como estaba. Sus **flujos** los entrega la flota.

El detalle, con el porqué de cada paso: **`ACTUALIZAR-UNA-TIENDA.md`**. Cortar
una versión: **`CONTRIBUIR.md`**.

---

## 6 · Las credenciales, y la regla que no se negocia

- Las **llaves de Bold** y el **`GITHUB_TOKEN`** del maestro viven **solo** en
  las propiedades del script de Apps Script. Nunca en la hoja, el repositorio,
  los secretos de GitHub de la tienda ni el panel.
- La clave y la sesión del panel viajan **solo por POST**, nunca en la
  dirección. Desde la 1.0.0 el token de montaje también va en el cuerpo:
  `montar/`, el flujo `conectar` y `panel.gs` (hacia las tiendas de la 2.0) lo
  mandan por POST. El maestro **sigue aceptando el GET** en esas puertas, a
  propósito —volver a una versión anterior corre herramientas que preguntan
  por GET—, pero lo anota (`TOKEN_POR_GET`, sin el token) y el diagnóstico
  dice quién lo manda. Siguen mandando un token por GET el stub (su token de
  menú) y `panel.gs` hacia una Tienda Básica (`FUNCIONALIDADES.md` ›
  *Seguridad*). Los tokens no se imprimen nunca (los flujos los tapan).
- **Tres tokens de GitHub** (decisión 34): `FLOTA_TOKEN` en `tiendas` (con
  *Administration* y *Secrets*, porque hace también el alta y `conectar`),
  `SEMILLA_TOKEN` en cada tienda y `DISPARO_TOKEN` en las propiedades del
  maestro. `ALTA_TOKEN` se retiró: el secreto se borró de `tiendas` el 29 de
  septiembre de 2026.
- Cada secreto, dónde vive y quién lo pone: `ARQUITECTURA.md` (tabla de
  credenciales) y `DESPLIEGUE.md` › *Secretos, tokens y llaves*.

---

## 7 · Cómo empezar

1. **Leer, en este orden:** este archivo; `PLAN-MVP.md` › *Dónde estamos*;
   `ARQUITECTURA.md`; `CONTRATOS.md` (lo que no se puede romper); las últimas
   entradas de `BITACORA.md` (por qué el código es raro donde es raro).
2. **Correr las baterías antes de tocar nada**, para tener el verde de partida:

   ```
   cd pruebas && npm install && ./todas.sh
   ```

   (o `npm test` desde la raíz). Necesita Chromium de Playwright; si ya está en
   otra carpeta, `PLAYWRIGHT_BROWSERS_PATH=<carpeta>`. La salida entera de cada
   batería queda en `pruebas/.salida/`. Cómo se trabaja y se corta una versión:
   `CONTRIBUIR.md`.
3. **Mirar la flota:** `tiendas/ESTADO.md`, o Actions › **flota** › `estado`.
4. **Montar una tienda:** `RUNBOOK-TECNICO.md` (el paso a paso) y
   `DESPLIEGUE.md` (el mapa y el porqué).

**Las reglas de la casa**, aprendidas caras:

- **Reproducir antes de diagnosticar.** Una causa que no se reprodujo no es la
  causa (bitácoras 99 y 104).
- **Patrón 2:** lo que no se actualiza en el mismo movimiento que el código
  miente después. Vale para la documentación.
- **Un control negativo se ve en rojo** antes de dar por buena una batería.
- **Nada que dependa de ser la semilla decide si una tienda publica**
  (bitácora 102).
- **Un arreglo en el flujo o en el actualizador llega una versión tarde**: la
  lógica que tiene que valer ya va en `pruebas/` (ver
  `ACTUALIZAR-UNA-TIENDA.md`).
- **Ningún comercio va escrito en el código**; todo sale de su pestaña
  `Configuración`.
- **Campo nuevo, al final del encabezado del código y opcional.** Catálogo e
  Inventario por variante se leen por el nombre de su columna (0.24.0,
  decisión 32); las demás pestañas, por posición.
- **Nunca una implementación nueva de Apps Script**: estrena URL y deja la
  tienda muda.

---

## 8 · Qué documento manda para qué

| Documento | Para qué |
|---|---|
| `PLAN-MVP.md` | Qué se construye, hito por hito, y dónde estamos |
| `ROADMAP.md` | Qué viene después del MVP |
| `ARQUITECTURA.md` | Qué vive dónde y por qué; credenciales |
| `CONTRATOS.md` | El contrato de datos. **Normativo** |
| `DECISIONES.md` | Decisiones con su condición de disparo |
| `BITACORA.md` | Lo que se rompió y su lección. Historia: no se reescribe |
| `DESPLIEGUE.md` | El mapa del despliegue, de punta a punta |
| `RUNBOOK-TECNICO.md` | El paso a paso del técnico, e incidentes |
| `ACTUALIZAR-UNA-TIENDA.md` | Llevar una tienda a la versión nueva |
| `ANTES-DE-SALIR.md` | Lo que se mira antes del primer comprador real |
| `FUNCIONALIDADES.md` | Todo lo que hace el producto |
| `GUIA-COMERCIANTE.md` | La página que se le entrega al comercio (y `manuales/Guia-de-una-pagina.html`, imprimible) |
| `PAGOS-BOLD.md` | Cobrar en línea con Bold, y cómo probarlo |
| `EVALUACION-stub-automatico.md` | Historia: por qué el stub se pega a mano. La decisión vigente está en `DECISIONES.md` › 03 y `ROADMAP.md` › 3.5 |
| `CONOCIMIENTO.md` | Cómo se hereda lo aprendido entre proyectos (la bitácora como segundo cerebro) |
| `TRASLADO-3.0.md` | **No es de operación**: el arranque de la Tienda 3.0 |

Un documento redundante no se marca como viejo: **se borra** (P18 en
`BITACORA.md` › *Lo aprendido*). La historia que explica una decisión no es
redundante: se marca como historia y se queda.

---

## 9 · Lo que queda abierto

Después de la 1.0.0 lo que queda es casi todo del dueño, de otro proyecto o
de una decisión; el código pendiente de este repositorio es menor (al final).

- **Los secretos `PANEL_SCRIPT_ID` y `PANEL_CLASPRC` en `tiendas`**, y la
  primera corrida de su flujo `panel`. Hasta entonces la hoja *Panel de
  tiendas* publicada es anterior a la 1.0.0 y pregunta por GET: cada maestro la
  atiende y lo anota, y su diagnóstico lo dice.
- **Revocar en GitHub el token viejo de `ALTA_TOKEN`** (el secreto ya se
  borró) y quitar el respaldo `ALTA_TOKEN ||` que aún tienen los flujos de
  `tiendas`.
- **Migrar a los clientes de Orgánico** a la 2.0, uno por uno, cuando
  convenga (§2, decisión 36).
- **Riesgo legal abierto:** la tienda no pide consentimiento de cookies antes
  de cargar GA4 o el píxel de Meta (decisión 35). No se construye sin la
  confirmación de un abogado.
- **E-2:** comparar las comisiones de Bold con números reales.
- **Decisiones abiertas** (`PLAN-MVP.md` §8): el precio de quitar la autoría;
  qué se le promete al comercio sobre las actualizaciones; cuándo se hace
  pública la semilla. Van a `DECISIONES.md` cuando se contesten.
- **Menores:** las derivadas webp se generan aunque `fotos_webp=No`; el SEO no
  da el rango de precios cuando varían por combinación; `flota › flujos` hace
  un commit por entrega; el stub sigue mandando su token por GET (cerrarlo
  exige repegarlo en cada hoja).
- **Lo de `ANTES-DE-SALIR.md`**, por cada tienda que salga al aire.
- **El archivado de la hoja**: `Pedidos` y `Validaciones` solo crecen.
- **Fuera de este proyecto:** el sitio principal (ED1).
