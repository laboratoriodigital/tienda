# Traspaso — la Tienda Panel

_Al 29 de septiembre de 2026 · semilla en la **0.24.1**. Repositorio
`laboratoriodigital/tienda`._

**Léeme primero si recibes el proyecto o abres una sesión nueva.** Aquí está el
mapa: qué hay, dónde vive cada cosa y cómo empezar. Lo demás está enlazado; no
se repite aquí.

---

## 1 · Dónde estamos, en un párrafo

Este repositorio es **la semilla de la Tienda Panel**: una tienda en línea para
comercios pequeños, con la hoja de Google como base de datos, un panel web para
el comercio y WhatsApp o Bold para cobrar. Costo de infraestructura: **$0 al
mes**. Nació el 18 de septiembre de 2026 como copia de la semilla de la línea
anterior (`organico` 3.0.0) y va por la **0.24.1**; el MVP saldrá como 1.0.0.
Está construido —M0 a M5 y el panel completo—, **se actualiza solo** desde la
0.14.0 y tiene su **flota** en `laboratoriodigital/tiendas`. Lo que falta antes
de la 1.0.0 es comprobarlo en tiendas de verdad. Dónde va cada hito:
`PLAN-MVP.md` › *Dónde estamos*.

---

## 2 · Los repositorios

| Repositorio | Qué es | Versión |
|---|---|---|
| `laboratoriodigital/tienda` | **Esta semilla** (Tienda Panel). También es una tienda: la de Laboratorio Digital, `tienda.laboratorio-digital.com` | `package.json` |
| `laboratoriodigital/tiendas` | **El servicio**: `alta` y `conectar` de tiendas nuevas, la **flota** (estado, actualizar por anillos, entregar flujos) y el flujo `panel`. Los secretos poderosos viven solo ahí | — |
| Una por comercio (hoy, `prueba1`) | Las **tiendas hijas**: nacen de una etiqueta de esta semilla y se actualizan solas | la de la etiqueta que traen |
| `laboratoriodigital/organico` | La **Tienda Básica** (solo la hoja), 3.x, con su tienda Cinnamon Beauty. Otra línea: se actualiza por pull request desde la flota. **Fuera de esta documentación** | 3.x |

Qué tiendas hay y en qué anillo: `tiendas/flota.json`. Qué versión tiene cada
una y qué contesta publicada: `tiendas/ESTADO.md` (lo escribe `flota › estado`
los lunes).

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
  dirección. Los tokens no se imprimen nunca (los flujos los tapan).
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
- **Campo nuevo, al final y opcional**: el maestro lee por posición.
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
| `EVALUACION-stub-automatico.md` | Por qué el stub se pega a mano |

Un documento redundante no se marca como viejo: **se borra** (patrón 23).

---

## 9 · Lo que queda abierto

- **La 1.0.0**: comprobar en tiendas de verdad lo construido —el cobro con
  Bold con llaves de pruebas en una tienda publicada (`PAGOS-BOLD.md`), una
  tienda con variantes vendiendo por combinación, el registro de cambios en una
  hoja real—. Qué se cerró ya, en `PLAN-MVP.md`.
- **Lo de `ANTES-DE-SALIR.md`**, por cada tienda que salga al aire.
- **El archivado de la hoja**: `Pedidos` y `Validaciones` solo crecen.
- **Decisiones abiertas**: el precio de quitar la autoría; qué se le promete al
  comercio sobre las actualizaciones; cuándo se hace pública la semilla. Van a
  `DECISIONES.md` cuando se contesten.
