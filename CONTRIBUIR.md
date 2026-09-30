# Cómo se trabaja aquí

GitHub Flow, sin ramas de larga vida. En la semilla, `main` está siempre
desplegable: cada push a `main` publica la tienda de la semilla en Cloudflare.
Las tiendas hijas **no** viven de `main`: viven de versiones cortadas con
`release` (abajo). Qué hay en cada carpeta: `README.md` › *Qué hay aquí*.

## El ciclo

```bash
git switch main && git pull                      # partir de lo último
git switch -c feature/frontend-buscador          # una rama por cambio

# ...trabajar...

npm test                                         # todas las baterías, en verde
git add -A
git commit -m "feature/frontend: buscador por descripción, no solo por nombre"
git push -u origin feature/frontend-buscador
```

Después: abrir el pull request, esperar la marca verde de `pruebas` y hacer
*Squash and merge*.

## Las pruebas

Viven en `pruebas/`, corren sobre los archivos reales —`pruebas/gas.js` emula
Apps Script y Sheets y carga `maestro.gs` tal cual— y necesitan sus
dependencias (Playwright y sharp) y Chromium.

| Qué | Cómo |
|---|---|
| Todas las baterías | `npm test` desde la raíz (instala `pruebas/` y corre `pruebas/todas.sh`), o `cd pruebas && ./todas.sh` |
| Solo algunas | `cd pruebas && BATERIAS="config.js logo.js" ./todas.sh` |
| En serie, para depurar | `TRABAJADORES=1 ./todas.sh` (de fábrica, cuatro a la vez) |
| Lo que corre al publicar | `cd pruebas && ./publicacion.sh`. En la semilla, todas (o las de lo publicado si `pruebas` ya pasó ese código); en una tienda, solo `tienda-viva.js` |
| La suite entera, en cualquier sitio | `SUITE_ENTERA=1 ./publicacion.sh` |
| Qué decidiría, sin correr nada | `SOLO_DECIDIR=1 ./publicacion.sh` |
| La suite como si fuera una tienda | `node tiendita.js` (copia el repositorio sin lo que una tienda no hereda) |

Si Chromium está en otra carpeta: `PLAYWRIGHT_BROWSERS_PATH=<carpeta>`. La
salida entera de cada batería queda en `pruebas/.salida/`: ahí se lee el fallo
que el marcador solo resume. Cuántas son no se escribe en ningún documento
(una batería lo vigila): se dice «todas las baterías».

Una batería nueva va en la lista de `todas.sh`, y su control negativo se ve en
rojo antes de darla por buena.

## El mensaje

    tipo/ámbito: qué cambió, en una línea

**Tipos**

| | |
|---|---|
| `feature` | Algo que antes no se podía hacer. |
| `bugfix` | Algo que no funcionaba como debía. |
| `hotfix` | Un bugfix urgente, directo a producción. |
| `refactor` | Cambia por dentro, no cambia lo que el usuario ve. |

**Ámbitos**

| | |
|---|---|
| `frontend` | `plantilla/` y `publicar/` — la tienda y el panel. |
| `backend` | `maestro.gs` — el Apps Script. |
| `bd` | La estructura de la hoja: pestañas, columnas, claves de Configuración. |

**Qué escribir.** El *qué* y el *por qué*, no el *cómo*. El diff ya dice cómo.

    bien   bugfix/backend: los pedidos repetidos entraban dos veces al confirmar rápido
    mal    bugfix/backend: arreglos varios
    mal    bugfix/backend: cambio en la línea 412 de aplicarInventario

Si el cambio toca la tienda y el maestro a la vez, casi siempre son dos ramas.
Si de verdad es uno solo, el ámbito es el que manda el cambio.

## Cortar una versión

La separación entre «lo último» y «lo que corre en las tiendas» la da la
etiqueta, no una rama paralela. Por eso no hay `develop`.

1. En la rama del cambio, sube `version` en `package.json` **y**
   `VERSION_TIENDA` en `maestro.gs` al mismo número (una batería exige que
   coincidan). Parche `1.0.1` si nada cambió para el comercio · menor `1.1.0`
   si hay algo nuevo · mayor (`2.0.0`) si una tienda vieja tiene que tocar la
   hoja o el maestro para seguir funcionando. La versión del producto no es la
   del contrato (`VERSION`, abajo): la 1.0.0 salió con el contrato en
   `2026-09-22-8`, el mismo de la 0.25.0.
2. Fusiona a `main` y espera `pruebas` en verde.
3. Actions › **release** › Run workflow.

`release` solo corre en la semilla. No repite las pruebas: le pregunta a GitHub
si la corrida de `pruebas` del push de ese commit salió verde (espera hasta
cinco minutos si todavía corre) y, si no, no corta nada. Crea la etiqueta
`vX.Y.Z` y la publicación con `index.html`, `maestro.gs`, `panel.gs` y
`publicar.tar.gz`. Si la etiqueta ya existe en ese mismo commit, no hace nada y
sale en verde; si existe en otro commit, falla: sube la versión.

Al final (0.22.3) le pregunta al maestro vivo de la semilla si es el de ese
commit y, si quedó atrás, dispara `montaje` con `maestro` y `PUBLICAR`: la
semilla también es una tienda, y su maestro no lo publica ninguna
actualización. Necesita los secretos `MAESTRO_URL` y `MAESTRO_TOKEN` de la
semilla; sin ellos lo dice y no lo comprueba.

Las tiendas se traen la etiqueta cuando la piden —la flota, su `montaje` con
`semilla`, o el botón del panel o del menú—, cada una a su ritmo. Cómo:
`docs/ACTUALIZAR-UNA-TIENDA.md`.

## Un cambio urgente en producción

```bash
git switch main && git pull
git switch -c hotfix/frontend-total-mal
# arreglar, correr pruebas
git commit -m "hotfix/frontend: el envío no se sumaba al total con cupón de porcentaje"
git push -u origin hotfix/frontend-total-mal
```

Igual pasa por pull request. La diferencia del `hotfix` es la prioridad de la
revisión, no saltarse el proceso. Y a las tiendas no llega hasta que se corta
la versión y se reparte.

## Reglas de despliegue, siempre

- **Nada al backend un viernes después de mediodía ni en fecha comercial
  alta.** Un error se nota mejor un martes en la mañana que un sábado.
- **Una versión nueva se reparte por anillos**: primero el 0, y se mira antes
  de seguir. La flota se detiene sola en la primera tienda que falla.
- **Prohibido renombrar columnas de la hoja, y una columna nueva va al final
  del encabezado del código** (`ENCABEZADO_…`, R1). Catálogo e Inventario por
  variante se leen por el nombre de su columna desde la 0.24.0 (decisión 32):
  su orden visible lo pone `ORDEN_VISIBLE_…` y la hoja se ordena sola. Una
  columna renombrada deja esa hoja leyéndose por posición, y lo anota. Las
  demás pestañas se siguen leyendo por posición.
- **Un cambio de esquema nunca en un paso**: primero la versión que acepta las
  dos formas, después la migración, y solo entonces se retira el soporte
  viejo.
- **Lo que decide si una tienda publica va en `pruebas/`, no en un flujo ni en
  el actualizador**: esos corren la versión vieja de la tienda y un arreglo en
  ellos llega una versión tarde (`docs/ACTUALIZAR-UNA-TIENDA.md`).

## Ojo con esto

- **La versión del contrato.** `VERSION` en `maestro.gs` y `SCRIPT_VERSION` en
  la página tienen que coincidir. No se copia a mano: el horneado la escribe
  desde el maestro publicado, y `version.js` comprueba que una tienda hablando
  con un maestro viejo lo diga en vez de sellar pedidos mentirosos.
- **La versión del producto.** Si el pull request toca `maestro.gs`, `panel.gs`
  o `publicar/index.html`, `pruebas` exige que suba `version` en
  `package.json`. Un cambio que solo toca `plantilla/` o `montar/` no lo exige,
  pero si tiene que llegar a las tiendas necesita versión igual.
- **Publicar el Apps Script es aparte de fusionar.** Fusionar a `main`
  despliega la página de la semilla, no su maestro: lo pone al día `release`
  (arriba), o `montaje` con `maestro` + `PUBLICAR`, o `npm run maestro` en el
  equipo. Los tres actualizan la implementación que ya existe: la URL no
  cambia. En una hija, lo publica su actualización.
- **`panel.gs`** se publica desde `tiendas` › Actions › **panel**. Al 30 de
  septiembre de 2026 no ha corrido nunca: faltan sus secretos
  `PANEL_SCRIPT_ID` y `PANEL_CLASPRC`.
- **Ningún token en una dirección** (1.0.0, ROADMAP 5.7). Lo que le hable al
  maestro con el token de montaje lo manda por POST, en el cuerpo (`alMaestro`
  en `montar/tienda.mjs` es el camino). El maestro **sigue aceptando el GET** en
  sus puertas de montaje, a propósito: volver una tienda a una versión anterior
  corre las herramientas de esa versión, que preguntan por GET, contra el
  maestro nuevo. No lo rechaza: lo anota (`TOKEN_POR_GET`, nunca el token) y el
  diagnóstico lo dice. Lo vigilan `montaje.js` (§0: ninguna herramienta pone
  `t=` en la dirección) y `sondeo.js`, cuyo maestro de mentira cuenta los
  tokens que le llegan en la dirección. Los clientes que todavía mandan un
  token por GET (el stub de la hoja y `panel.gs` hacia una Tienda Básica) están
  en `docs/FUNCIONALIDADES.md` › *Seguridad*.
- **Nada de secretos.** Llaves de pago, ID de hojas y tokens no entran al
  repositorio, ni siquiera en un comentario. Las llaves de Bold y el
  `GITHUB_TOKEN` del maestro viven solo en las propiedades del script.
