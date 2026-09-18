#!/bin/bash
# Corre todas las baterías contra los archivos REALES del repositorio.
#
# as.js, pn.js e index.html son copias que se regeneran aquí en cada corrida:
# así es imposible probar una versión distinta de la que se despliega.
#
# CUANDO ALGO FALLA, ESTO TIENE QUE DECIR QUÉ. Durante un tiempo solo imprimía
# el marcador —"822/823"— y para saber qué aserción se había caído había que
# tener el repositorio en la máquina y correr la batería a mano. Desde un flujo
# de Actions eso no se puede: el log es lo único que hay. Ahora una batería que
# no salga perfecta imprime debajo sus líneas FALLA, y una que ni siquiera
# arranque imprime su error.
#
# ── POR QUÉ CORREN A LA VEZ ─────────────────────────────────────────────────
# Publicar una foto tardaba entre seis y ocho minutos y la queja era legítima.
# Medido: la suite entera es 292 s, de los cuales 290 —el 99 %— son las 12 que
# abren navegador. Las otras diez, las que uno quitaría primero por «no tan
# fundamentales», cuestan TRES SEGUNDOS Y MEDIO entre todas. Quitar baterías no
# recupera nada y deja sin guardia justo lo que permite que el flujo `fotos`
# fusione sin una persona en medio.
#
# Lo que sí se recupera es el reloj de pared: doce navegadores esperando uno
# detrás de otro no se esperan por ninguna razón de fondo. Se esperaban por una
# razón de implementación: TODAS hablaban con el mismo servidor en el 8099 y se
# pisaban el `/__reset` la una a la otra.
#
# Ahora cada batería levanta SU servidor en SU puerto, con su propio emulador de
# la hoja. El aislamiento es real —no es un candado, es que no comparten nada—,
# no se tocó una sola aserción, y el marcador tiene que salir idéntico.
#
# TRABAJADORES=1 lo vuelve serial. Es el interruptor para depurar: si una
# batería solo falla en paralelo, el fallo es de la batería —guarda estado
# fuera de su proceso— y hay que arreglarlo ahí, no bajar los trabajadores.
cd "$(dirname "$0")"

cp ../maestro.gs            as.js
cp ../panel.gs              pn.js
cp ../publicar/index.html   index.html

# ── EL ARNÉS ES UNA SOLA TIENDA ─────────────────────────────────────────────
# Desde el 4.20 `publicar/index.html` lleva dentro el catálogo y la
# configuración de SU comercio: es lo que la página pinta antes de que conteste
# nadie. Y las baterías conducen la hoja EMULADA de gas.js, que es otra tienda.
# Dejar las dos puestas es probar un comercio que no existe, y los síntomas no
# se parecen a la causa: `val.js` reventaba con «Cannot read properties of
# undefined» al agregar un producto que no está en el archivo de esa tienda,
# `config.js` leía el nombre del comercio equivocado sin red, y `fotos.js`
# exigía que las fotos salgan del propio sitio mientras la semilla decía que
# salen de la dirección de producción de otro.
#
# No se BORRA el respaldo —eso dejaría sin probar justo el camino que el 4.20
# existe para arreglar—: se reemplaza por el de la hoja emulada, con la misma
# herramienta que usa el flujo. El arnés queda siendo una tienda coherente y da
# igual de qué comercio sea el repositorio.
#
# Quien prueba que ese camino funciona para un comercio CUALQUIERA es
# respaldo.js, que se escribe su propio archivo con una tienda inventada.
node arnes.mjs || { echo "ERROR: no se pudo armar el arnés"; exit 1; }

# local.html es el MISMO index, con el servicio vacío: así sec2.js comprueba
# que una tienda sin Apps Script configurado no manda nada a ninguna parte.
# Se regenera aquí porque durante días fue una copia congelada del index y dos
# baterías estuvieron dando verde sobre una tienda que ya no existía.
sed 's|const SCRIPT_URL = "[^"]*";|const SCRIPT_URL = "";|' index.html > local.html

pkill -f servidor.js 2>/dev/null; sleep 0.5

# De más lenta a más rápida. No es cosmético: con trabajadores fijos, empezar
# por la más larga es lo que evita terminar esperando a una sola. e2e.js dura
# 81 s y marca el suelo de toda la corrida.
BATERIAS="e2e.js movil.js enlace.js val.js fotos.js pag.js test.js config.js \
          cat.js version.js hoja.js sec2.js exif.js montaje.js panel.js \
          pedidos.js correo.js presentacion.js menu.js tablero.js esquema.js \
          calendario.js respaldo.js marca.js plantilla.js worker.js legal.js \
          determinismo.js escribe.js"

# Por defecto, uno por núcleo hasta cuatro. Más no ayuda: cada trabajador es un
# Chromium, y a partir de ahí compiten por CPU y el reloj deja de bajar.
nucleos=$(nproc 2>/dev/null || echo 2)
TRABAJADORES=${TRABAJADORES:-$(( nucleos > 4 ? 4 : nucleos ))}

SALIDA=$(mktemp -d)
# NINGÚN trabajo de fondo puede compartir nada de la shell de arriba con
# ella misma —esa fue la idea, tres veces, y las tres fallaron en Git Bash
# (MSYS):
#   1. Una guardia por PID ($BASHPID = $$) en la trampa EXIT: no alcanzó,
#      porque depende de que $BASHPID distinga de verdad a la shell de
#      arriba de sus subshells, algo que ahí no se pudo confirmar.
#   2. `trap - EXIT` al entrar a la función que corre cada batería: tampoco
#      alcanzó —se siguió viendo el mismo corte, con «No such file or
#      directory» incluso antes de que node arrancara—.
#   3. Las funciones exportadas con `export -f` y cada batería en su propio
#      `bash -c`: rompió de una forma nueva todavía, «environment: line N:
#      archivo.js: No such file or directory» — la firma de que algo en esa
#      máquina no reconstruye bien una función pasada por variable de
#      entorno (`BASH_FUNC_nombre%%`, el mecanismo que quedó marcado desde
#      Shellshock y que distintos builds de bash tratan distinto).
#
# Las tres veces el arreglo dependía de que la shell de abajo heredara ALGO
# de la de arriba —una trampa, una función— y se comportara con eso como se
# supone. Esta vez no hereda nada de nada: `ejecutar-bateria.sh` es un
# ARCHIVO aparte en el disco, y cada batería lo corre con
# `bash ejecutar-bateria.sh <lo que necesite>`. Leer un archivo y correrlo es
# lo más básico que hace un intérprete de comandos; no hay mecanismo de
# herencia que adivinar porque no hay nada que heredar.
trap 'pkill -f servidor.js 2>/dev/null; rm -rf "$SALIDA"' EXIT

indice=0
for f in $BATERIAS; do
  indice=$((indice + 1))
  while [ "$(jobs -rp | wc -l)" -ge "$TRABAJADORES" ]; do wait -n; done
  bash ejecutar-bateria.sh "$f" "$indice" "$SALIDA" &
done
wait

# ── El marcador, en el orden de siempre para que el log sea comparable ──
total=0; buenas=0; rotas=""
for f in $BATERIAS; do
  salida=$(cat "$SALIDA/$f" 2>/dev/null)
  linea=$(echo "$salida" | grep -E "^Resultado" | tail -1)
  printf "  %-16s %s\n" "$f" "${linea:-ERROR}"
  n=$(echo "$linea" | sed -n 's/.*: \([0-9]*\)\/\([0-9]*\).*/\1/p')
  d=$(echo "$linea" | sed -n 's/.*: \([0-9]*\)\/\([0-9]*\).*/\2/p')
  buenas=$((buenas + ${n:-0})); total=$((total + ${d:-0}))

  # UN SALTO QUE NO SE VE ES UN SALTO ESCONDIDO. Una batería puede saltarse un
  # escenario que hoy no puede existir —un index.html anterior al 4.20, por
  # ejemplo— y eso está bien SI SE DICE. Como el marcador sale verde, la línea
  # se imprime aquí a mano: si no, el salto solo existiría dentro del archivo de
  # salida que nadie abre.
  echo "$salida" | grep -E "^  SALTA" | sed 's/^/    /'

  # Lo que faltaba: decir QUÉ se cayó, aquí y ahora.
  if [ -z "$linea" ]; then
    rotas="$rotas$f"$'\n'
    echo "$salida" | tail -25 | sed 's/^/      /'
  elif [ "${n:-0}" != "${d:-0}" ]; then
    rotas="$rotas$f"$'\n'
    echo "$salida" | grep -E "^ FALLA" | sed 's/^/    /'
  fi
done

pkill -f servidor.js 2>/dev/null
echo
echo "  TOTAL: $buenas/$total"
if [ -n "$rotas" ]; then
  echo
  echo "  Baterías con problemas:"
  echo "$rotas" | sed '/^$/d;s/^/    · /'
fi
[ "$buenas" = "$total" ] && [ -z "$rotas" ] || exit 1
