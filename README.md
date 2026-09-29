# Tienda en línea para negocios pequeños

Una página estática, una hoja de cálculo que hace de base de datos, un panel web
para administrarla y WhatsApp o Bold para cobrar. Costo de infraestructura:
**$0/mes**.

Este repositorio es la **semilla de la Tienda Panel**. Cada comercio tiene un
repositorio propio que nace de una versión cortada de esta, con su propia
cuenta de Google para que gaste sus propios límites gratuitos. **Ningún nombre
de comercio va escrito en el código**: todos salen de la pestaña
`Configuración` de su hoja. La semilla también es una tienda: la de Laboratorio
Digital.

> **Estado: antes de la 1.0.0.** La versión es la de `package.json`. Los hitos
> del MVP están construidos (`docs/PLAN-MVP.md` › *Dónde estamos*); falta
> comprobarlos en tiendas de verdad. Desde la 0.14.0 cada tienda **se actualiza
> sola** cuando se le pide, y la flota vive en `laboratoriodigital/tiendas`. La
> **Tienda Básica** (solo la hoja) es otra línea, con su semilla en
> `laboratoriodigital/organico`. Para recibir el proyecto:
> **`docs/TRASPASO.MD`**.

## Qué hay aquí

| | |
|---|---|
| `maestro.gs` | El backend completo. Va en un proyecto de Apps Script **independiente**, uno por comercio |
| `panel.gs` | La hoja *Panel de tiendas* del operador: todas las tiendas en un tablero. Se publica con el flujo `panel` de `tiendas` |
| `plantilla/` | El código de la página: la tienda, el panel del comercio (`admin.html`), `pedido.html` y `404.html` |
| `publicar/` | **Lo que se despliega**, raíz del sitio en Cloudflare: `plantilla/` horneada con la hoja de cada comercio (catálogo, fotos, respaldo, SEO). En una tienda no se toca a mano |
| `montar/` | Las herramientas: hornear, bajar las fotos del Drive, publicar el maestro, actualizarse desde la semilla, volver atrás |
| `.github/workflows/` | `montaje` (hornea, actualiza y publica), `fotos` («Publicar ahora»), `pruebas`, `restaurar` y `release` (solo en la semilla) |
| `pruebas/` | Las baterías, sobre el código real. `pruebas/todas.sh`, `pruebas/publicacion.sh` y la compuerta de las tiendas, `pruebas/tienda-viva.js` |
| `semilla.json` | Qué archivos son de la semilla y viajan a las tiendas, y cuáles se retiraron |
| `presupuesto.json` | El presupuesto de tiempo y de minutos de Actions que vigilan los flujos |
| `wrangler.jsonc` | El Worker de Cloudflare de esta tienda: su nombre y su dominio |
| `docs/` | Ver abajo |
| `originales/` | Fotos pesadas. **No se versiona**: viven en el Drive del comercio |

**La documentación**, en `docs/`: `TRASPASO.MD` (el contexto para empezar),
`RUNBOOK-TECNICO.md` (montar una tienda, paso a paso), `DESPLIEGUE.md` (el mapa
de punta a punta), `ACTUALIZAR-UNA-TIENDA.md`, `ANTES-DE-SALIR.md`,
`FUNCIONALIDADES.md`, `ARQUITECTURA.md`, **`CONTRATOS.md`** (el contrato de
datos, normativo), `DECISIONES.md`, `BITACORA.md`, `PLAN-MVP.md`, `ROADMAP.md`,
`PAGOS-BOLD.md` y la guía del comerciante (`GUIA-COMERCIANTE.md`).

## Cómo se pone a andar una tienda

Desde `laboratoriodigital/tiendas`: **`alta`** crea el repositorio clonando la
última versión de esta semilla; a mano, en la cuenta de Google de la tienda, la
hoja, el maestro, `A0_instalar()`, la implementación y el stub; **`conectar`**
le pone sus secretos y dispara el primer montaje; y al final se conecta a
Cloudflare. El paso a paso, en **`docs/RUNBOOK-TECNICO.md`**; el porqué de cada
pieza, en `docs/DESPLIEGUE.md`.

## Cómo se actualiza una tienda

`release` corta una versión aquí; la tienda la pide (la flota por anillos, su
`montaje` con `semilla`, o el botón de su panel o de su menú) y se la trae,
publica su maestro, rehornea, pasa su compuerta y publica. Si algo falla,
queda como estaba. Sus flujos los entrega la flota. Todo, en
**`docs/ACTUALIZAR-UNA-TIENDA.md`**.

## Cómo trabajamos

GitHub Flow: `main` siempre desplegable, una rama por cambio, pull request
corto, `npm test` en verde antes de abrirlo. El detalle —las pruebas, el
mensaje de commit, cómo cortar una versión— en `CONTRIBUIR.md`.

**El único pull request manual es el de esta semilla.** En las tiendas todo
publica solo —lo que el comercio cambia en su hoja y las versiones nuevas—, y
la compuerta son las pruebas.

## Lo que no se versiona

La llave de pago, los identificadores de hoja, los tokens y la clave del panel
**no van en el repositorio**. La llave de pago se entrega por la respuesta
automática de WhatsApp Business. Las llaves de Bold y el `GITHUB_TOKEN` del
maestro viven solo en las propiedades del script de Apps Script; los tokens del
maestro los inventa él y los guarda ahí mismo, y la clave del panel se guarda
solo como hash con sal, también ahí. La clave y la sesión del panel viajan
solo por POST, nunca en la dirección.
