# Tienda en línea para negocios pequeños

Una página estática, una hoja de cálculo que hace de base de datos, un panel web
para administrarla y WhatsApp para cerrar la venta. Costo de infraestructura:
**$0/mes**.

Este repositorio es la **semilla**: cada comercio se monta en un repositorio
propio creado a partir de esta, con su propia cuenta de Google, para que tenga
sus propios límites gratuitos. **Ningún nombre de comercio va escrito en el
código**: todos salen de la pestaña `Configuración` de su hoja.

> **Estado: en construcción · `0.10.0`.** Esta es **la semilla de la segunda
> versión** del producto, que se llama **tienda**. Nace de la semilla de la
> línea anterior (`laboratoriodigital/organico`, 3.0.0). Los hitos del MVP
> —M0 a M3, M3.5 (cobrar en línea con Bold, o seguir por WhatsApp) y M4 (el
> tablero en el panel) y M5 (el comprador sigue su pedido con un enlace)— están
> construidos, y desde la 0.9.0 el panel, en dos pantallas, alcanza para todo lo
> que se hacía en la hoja; falta probarlos en una tienda de verdad antes de la 1.0.0
> (`docs/TRASPASO.MD`). El detalle, historia por historia, en `docs/PLAN-MVP.md`.
>
> El MVP —que saldrá como **1.0.0**— son seis hitos: la semilla limpia y
> determinista, el rendimiento, la tienda para todo producto, el panel básico
> del comerciante, cobrar en línea y el tablero. Lo que hay que construir está en **`docs/PLAN-MVP.md`**; el
> contexto completo para empezar, en **`docs/TRASPASO.MD`**.

## Qué hay aquí

| | |
|---|---|
| `publicar/` | **Lo que se despliega.** La tienda, el panel de gestión con su tablero, y `pedido.html`, donde el comprador sigue su pedido. Es la raíz del sitio en Cloudflare |
| `plantilla/` | *(desde el hito M0)* El código de la semilla. `publicar/` se genera a partir de aquí más la hoja de cada comercio |
| `maestro.gs` | El backend completo. Va en un proyecto Apps Script **independiente**, uno por comercio |
| `panel.gs` | El archivo de gestión del operador: todas las tiendas en un tablero. Va en su propia hoja, que no se comparte con ningún cliente |
| `montar/` | Las herramientas del horneado: escribir el `<head>`, bajar las fotos de Drive, hornear el catálogo, sembrar el respaldo y publicar el maestro |
| `.github/workflows/` | Los mismos pasos, corriendo desde GitHub Actions |
| `pruebas/` | Baterías sobre el código real, no sobre una copia. `./pruebas/todas.sh` |
| `docs/` | `PLAN-MVP.md`: qué se construye ahora. `ROADMAP.md`: qué viene después. **`CONTRATOS.md`: el contrato de datos, normativo.** `TRASPASO.MD`: el contexto completo. `ARQUITECTURA.md`, `DECISIONES.md`, `BITACORA.md`, `DESPLIEGUE.md` y la guía del comerciante |
| `servicio/` | El alta de una tienda. **No corre aquí** |
| `originales/` | Fotos pesadas. **No se versiona**: viven en el Drive del comercio |

## Cómo se pone a andar una tienda

El mapa de punta a punta está en **`docs/DESPLIEGUE.md`**. El esqueleto:

1. Repositorio nuevo a partir de esta plantilla —**privado**—, y conectarlo a
   Cloudflare.
2. Cuenta de Google y hoja nuevas para ese comercio.
3. Apps Script → proyecto nuevo → pegar `maestro.gs` → poner el id de la hoja.
4. Implementar como aplicación web. **Una sola vez en la vida de la tienda:**
   después se actualiza esa misma.
5. Ejecutar `A0_instalar()` y pegar en la hoja el código que imprime.
6. Llenar la configuración y montar, con el flujo de Actions.
7. Entregar al comercio el enlace de su tienda y la clave de su panel.

> Ese procedimiento cambia con el hito M3: a partir de ahí el comerciante
> administra su tienda desde `publicar/admin.html` y la hoja deja de ser la
> interfaz.

## Cómo trabajamos

GitHub Flow: `main` siempre desplegable, una rama por cambio, pull request
corto, `./pruebas/todas.sh` en verde antes de abrirlo. El detalle —tipos de
rama, mensaje de commit, cómo cortar una versión— en `CONTRIBUIR.md`.

**El único pull request manual es el de esta semilla.** En los repositorios de
las tiendas, las fusiones son automáticas: publicar lo que el comerciante cambió
en su hoja no espera a nadie, y las baterías son la puerta. *Repartir una versión
nueva de la semilla a una tienda ya montada sigue siendo manual hasta la 1.1
(ver `docs/ROADMAP.md`, S3).*

## Lo que no se versiona

La llave de pago, los identificadores de hoja, los tokens y la clave del panel
**no van en el repositorio**. La llave se entrega por la respuesta automática de
WhatsApp Business; los tokens los inventa el maestro y los guarda en las
propiedades de su proyecto; la clave del panel se guarda solo como hash con sal,
también en las propiedades del proyecto.
