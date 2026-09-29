#!/bin/bash
# LAS BATERÍAS DE UNA PUBLICACIÓN: todas, o solo las que miran lo publicado.
#
# `fotos` y `montaje` no cambian CÓDIGO: reescriben publicar/ —index.html,
# catalogo.json, fotos, fichas SEO— a partir de la hoja y del Drive. Correr
# encima la suite entera repetía, sobre el mismo código, las pruebas del
# maestro, del correo, del calendario y del panel, que ya pasaron cuando ese
# código entró a main. Es el minuto y medio que el comerciante espera después
# de pulsar «Publicar» sin que se esté probando nada nuevo.
#
# La idea viene de la línea anterior (su PLAN-RENDIMIENTO-ACTIONS). Aquí va
# con una guarda que allá no tiene: la guardia corta SOLO se usa si GitHub
# confirma que el último commit de código tiene una corrida `pruebas` en verde.
# Si no se puede confirmar —código empujado en rojo, historia corta, sin
# permiso, sin red, corriendo en una máquina de alguien— corren TODAS. Una
# prueba de menos por no poder preguntar sería publicar a ciegas; una de más
# solo cuesta minutos.
#
#   bash pruebas/publicacion.sh           (en un flujo; decide solo)
#   GUARDIA=corta bash pruebas/publicacion.sh   (forzar la corta, para mirarla)
cd "$(dirname "$0")"

# Las que tocan lo que una publicación reescribe: el index horneado y su
# configuración, el catálogo y las fotos, el enlace compartido, el respaldo,
# el SEO, las variantes en la página, el cobro en línea, el pedido de punta a
# punta, y los contratos del montaje mismo.
CORTA="e2e.js movil.js enlace.js fotos.js exif.js config.js hoja.js montaje.js \
       respaldo.js seo.js plantilla.js varpag.js pagoweb.js comprador.js combinaciones.js rastreo.js avisame.js vistaprevia.js"

decidir() {
  # 0.22.0 · EN UNA TIENDA, LA GUARDIA ES LA TIENDA VIVA (bitácora 102).
  # Va PRIMERO, antes de mirar GUARDIA, a propósito: el `montaje` de una tienda
  # pide GUARDIA=todas cada vez que se actualiza, y «todas» dentro de una
  # tienda eran ~2.480 aserciones escritas para la semilla, con sus datos de
  # muestra y su repositorio. Cada suposición de esas fue una publicación
  # bloqueada —cinco veces seguidas— sin proteger de nada: el código de una
  # tienda actualizada es el de una etiqueta que `release` no corta sin la suite
  # entera en verde. Lo que puede romperse en una tienda es lo que se hornea con
  # SUS datos, y eso es lo que mira `tienda-viva.js`.
  #
  # Y está AQUÍ, y no en el flujo, porque este archivo lo escribe la
  # actualización ANTES de que se corra: una tienda con el flujo viejo ya usa la
  # guardia nueva en la misma corrida que la trae. En el flujo llegaría una
  # versión tarde, y es justo lo que la tenía bloqueada (bitácora 95).
  #
  # SUITE_ENTERA=1 fuerza todas en cualquier sitio, para quien quiera mirar.
  if [ -z "$SUITE_ENTERA" ] && [ "$(node -p "require('./donde.js').esSemilla()" 2>/dev/null)" = "false" ]; then
    echo "tienda: el código es el de una etiqueta que ya pasó la suite; se prueba lo horneado" >&2
    echo tienda; return
  fi
  [ -n "$SUITE_ENTERA" ] && { echo todas; return; }
  [ "$GUARDIA" = "todas" ] && { echo todas; return; }
  [ "$GUARDIA" = "corta" ] && { echo corta; return; }
  [ -n "$GITHUB_REPOSITORY" ] && [ -n "$GH_TOKEN" ] || { echo "todas: no corre en un flujo de GitHub" >&2; echo todas; return; }
  # El último commit que tocó CÓDIGO: todo menos lo que escriben los propios
  # flujos de publicación. Con una historia corta puede no aparecer: entonces
  # no se sabe, y no saber es correr todas.
  local codigo
  codigo=$(git -C .. log -1 --format=%H -- . ':(exclude)publicar' ':(exclude)wrangler.jsonc' 2>/dev/null)
  [ -n "$codigo" ] || { echo "todas: no encontré el último commit de código" >&2; echo todas; return; }
  local verdes
  verdes=$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/pruebas.yml/runs?head_sha=$codigo&per_page=20" \
             --jq '[.workflow_runs[] | select(.conclusion == "success")] | length' 2>/dev/null)
  if [ "${verdes:-0}" -gt 0 ] 2>/dev/null; then
    echo "corta: el código ${codigo:0:7} ya pasó la suite completa" >&2; echo corta
  else
    echo "todas: el código ${codigo:0:7} no tiene una corrida de pruebas en verde" >&2; echo todas
  fi
}

# ── 0.22.1 · UNA TIENDA NO PUBLICA SUS PROPIOS FLUJOS (bitácora 103) ──────
# Los archivos de `.github/workflows` solo los puede escribir un permiso con
# *Workflows*. El de Actions no puede nunca, y el truco de empujar con
# `SEMILLA_TOKEN` en la URL no servía de nada: `actions/checkout` deja en
# `.git/config` una cabecera con el permiso de Actions que git manda en CADA
# push a GitHub, gane quien gane en la URL. Así que una tienda que traía flujos
# nuevos se quedaba sin publicar NADA —el push se rechaza entero— y no podía
# salir de ahí sola, porque el arreglo viajaba justo en esos flujos.
#
# Los flujos de una tienda los entrega ahora LA FLOTA (`tiendas` › flota ›
# flujos), que tiene el permiso para eso. Aquí se sacan del commit antes de
# publicar, y se dice. Está en este archivo, y no en el flujo, porque este lo
# escribe la actualización ANTES de que se corra: funciona también con el
# flujo viejo de la tienda, que es el que hay que rescatar.
if [ "$(node -p "require('./donde.js').esSemilla()" 2>/dev/null)" = "false" ] && \
   ! git -C .. diff --cached --quiet -- .github/workflows 2>/dev/null; then
  echo "LOS FLUJOS NO VAN EN ESTE COMMIT: los entrega la flota (tiendas › flota › flujos)."
  git -C .. diff --cached --name-only -- .github/workflows | sed 's/^/  · /'
  git -C .. reset --quiet -- .github/workflows
  git -C .. checkout -- .github/workflows 2>/dev/null || true
  if [ -n "$GITHUB_STEP_SUMMARY" ]; then
    {
      echo ""
      echo "**Los flujos no van en el commit de la tienda** (bitácora 103): este repositorio no"
      echo "puede escribirlos. Los entrega la flota: \`tiendas\` › Actions › **flota** › \`flujos\`."
    } >> "$GITHUB_STEP_SUMMARY"
  fi
fi

cual=$(decidir)
# Para que una batería pueda comprobar la decisión sin correr nada.
[ -n "$SOLO_DECIDIR" ] && { echo "$cual"; exit 0; }
if [ "$cual" = "tienda" ]; then
  echo "LA TIENDA VIVA — lo que se horneó con los datos de esta tienda (bitácora 102)."
  export BATERIAS="tienda-viva.js"
elif [ "$cual" = "corta" ]; then
  echo "GUARDIA CORTA — $(echo $CORTA | wc -w) baterías sobre lo publicado (el código ya pasó todas)."
  export BATERIAS="$CORTA"
else
  echo "TODAS LAS BATERÍAS."
  unset BATERIAS
fi
exec ./todas.sh
