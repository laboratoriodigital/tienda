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

cual=$(decidir)
# Para que una batería pueda comprobar la decisión sin correr nada.
[ -n "$SOLO_DECIDIR" ] && { echo "$cual"; exit 0; }
if [ "$cual" = "corta" ]; then
  echo "GUARDIA CORTA — $(echo $CORTA | wc -w) baterías sobre lo publicado (el código ya pasó todas)."
  export BATERIAS="$CORTA"
else
  echo "TODAS LAS BATERÍAS."
  unset BATERIAS
fi
exec ./todas.sh
