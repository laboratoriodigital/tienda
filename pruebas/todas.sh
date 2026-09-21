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
cp ../publicar/admin.html   admin.html

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

# ── DÓNDE SE GUARDA LO QUE IMPRIME CADA BATERÍA ─────────────────────────────
# Aquí, en el repositorio, y no en un directorio temporal del sistema. Esto es
# lo que costó cuatro intentos de arreglo, porque el mensaje de error decía
# exactamente qué pasaba y se leyó como si dijera otra cosa:
#
#   ejecutar-bateria.sh: line 65: /tmp/tmp.PSNAF4aXSX/e2e.js: No such file...
#
# Eso NO es «no encuentro la batería e2e.js». Es bash diciendo que no puede
# abrir EL ARCHIVO AL QUE ESTÁ REDIRIGIENDO —`> "$SALIDA/$f"`— porque el
# directorio que devolvió `mktemp -d` no existe donde dice existir. En Git Bash
# el `/tmp` de la shell y el que usa `mktemp.exe` no son forzosamente la misma
# carpeta de Windows: mktemp crea el directorio, imprime una ruta de estilo
# Unix, y esa ruta no resuelve al mismo sitio. Como bash monta las
# redirecciones ANTES de ejecutar, node no llegaba a arrancar nunca y ninguna
# batería escribía una sola línea.
#
# Las cuatro corridas que fallaron en Windows dieron el mismo error en las dos
# líneas que redirigen a $SALIDA —132 y 134, luego 140 y 142, luego
# «environment» 18 y 20, luego 65 y 67—: cambiaba el número porque el código se
# movía de sitio, no la causa. Se persiguió la herencia de trampas entre
# subshells cuatro veces seguidas; la trampa nunca tuvo nada que ver.
#
# La regla: cuando un error nombra una ruta, la pregunta es qué se estaba
# haciendo CON esa ruta —abrirla para leer, para escribir, ejecutarla— y no qué
# archivo del proyecto se llama parecido.
#
# Un directorio del repositorio no tiene ese problema en ningún sistema, y de
# paso queda: terminada la corrida se puede abrir `.salida/tablero.js.txt` y
# leer entera la salida de la batería que falló, que antes se borraba sola.
SALIDA=.salida

# Servidores vivos de una corrida anterior —de una que se cortó con Ctrl+C,
# típicamente—. Se matan por PID, anotado por la corrida que los levantó:
# `pkill` no viene en Git Bash, así que preguntarle al sistema por nombre de
# proceso no es portable. Si igual sobrevive alguno no rompe nada: cada batería
# empieza pidiendo `/__reset`, que deja la hoja como recién instalada.
for anotados in "$SALIDA"/pids-*; do
  [ -f "$anotados" ] || continue
  while read -r pid; do kill "$pid" 2>/dev/null; done < "$anotados"
done
rm -rf "$SALIDA"; mkdir -p "$SALIDA" || { echo "ERROR: no se pudo crear $SALIDA"; exit 1; }

# De más lenta a más rápida. No es cosmético: con trabajadores fijos, empezar
# por la más larga es lo que evita terminar esperando a una sola. e2e.js dura
# 81 s y marca el suelo de toda la corrida.
# Una selección puede venir de fuera —la guardia de publicacion.sh—; sin
# ella, son todas. El corredor es uno solo: puertos, cupo y salida no se copian.
BATERIAS=${BATERIAS:-"e2e.js movil.js enlace.js val.js fotos.js pag.js test.js config.js \
          cat.js version.js hoja.js sec2.js exif.js montaje.js panel.js \
          pedidos.js correo.js presentacion.js menu.js tablero.js esquema.js \
          calendario.js respaldo.js marca.js plantilla.js worker.js legal.js \
          determinismo.js escribe.js limites.js tiempos.js sondeo.js seo.js variantes.js \
          varpag.js orden.js entrar.js productos.js admin.js \
          panelpedidos.js panelconfig.js panelpublicar.js pagos.js pagoweb.js"}

# ── CUATRO, Y NO UNO POR NÚCLEO ─────────────────────────────────────────────
# Esto decía «uno por núcleo hasta cuatro», con el razonamiento de que cada
# trabajador es un Chromium y a partir de ahí compiten por CPU. Suena bien y es
# falso. Medido en una máquina de DOS núcleos, la suite entera:
#
#     1 trabajador  → 151 s
#     2             →  94 s
#     4             →  73 s      ← 22 % menos que con 2, en media máquina
#     6             →  71 s
#
# Con el doble de trabajadores que de núcleos, el reloj sigue bajando. La razón
# es que estas baterías no gastan CPU: ESPERAN. Esperan a que arranque su
# servidor, a que la página cargue, a que un `waitFor` se cumpla. Un trabajador
# parado esperando no le quita nada a los otros, y atarlos a los núcleos es
# contar el recurso equivocado.
#
# La rodilla está en 4: de 4 a 6 se ganan dos segundos, y cada trabajador de más
# es un Chromium más en memoria, que en un runner de Actions sí se acaba.
#
# TRABAJADORES sigue siendo el interruptor: =1 lo vuelve serial para depurar.
TRABAJADORES=${TRABAJADORES:-4}

# ── EL CUPO DE TRABAJADORES, CONTANDO PIDs Y NADA MÁS ───────────────────────
# El portero de antes era `while [ "$(jobs -rp | wc -l)" -ge "$TRABAJADORES" ];
# do wait -n; done`, y esa fue la segunda mitad del fallo de Windows: la tabla
# de trabajos que ve un `$(...)` es la de su propio subshell, y en Git Bash
# seguía enseñando corriendo a los dos trabajos que ya habían muerto. La
# condición no bajaba nunca de dos, `wait -n` volvía en el acto porque no
# quedaba a quién esperar, y el bucle giraba en vacío para siempre. Eso es el
# «no termina solo, toca Ctrl+C» — cinco minutos quemando un núcleo sin lanzar
# la tercera batería.
#
# Aquí no hay tabla de trabajos: se anota el PID de cada batería y, cuando el
# cupo está lleno, se espera al más viejo con `wait <pid>`, que es lo único que
# hay que saber sobre esperar a un proceso y funciona igual en todas partes.
# Tampoco hay trampa EXIT: lo que dejara viva una corrida cortada lo barre por
# PID la siguiente, arriba.
echo "  $(echo $BATERIAS | wc -w) baterías, $TRABAJADORES a la vez. Cada una avisa al terminar."
echo

enVuelo=""; enCola=0; indice=0
for f in $BATERIAS; do
  indice=$((indice + 1))
  bash ejecutar-bateria.sh "$f" "$indice" "$SALIDA" &
  enVuelo="$enVuelo $!"; enCola=$((enCola + 1))

  if [ "$enCola" -ge "$TRABAJADORES" ]; then
    set -- $enVuelo
    wait "$1" 2>/dev/null
    shift
    enVuelo="$*"; enCola=$((enCola - 1))
  fi
done
for pid in $enVuelo; do wait "$pid" 2>/dev/null; done

# ── El marcador, en el orden de siempre para que el log sea comparable ──
echo
total=0; buenas=0; rotas=""
for f in $BATERIAS; do
  salida=$(cat "$SALIDA/$f.txt" 2>/dev/null)
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

echo
echo "  TOTAL: $buenas/$total"
echo "  (la salida entera de cada batería queda en pruebas/$SALIDA/)"
if [ -n "$rotas" ]; then
  echo
  echo "  Baterías con problemas:"
  echo "$rotas" | sed '/^$/d;s/^/    · /'
fi
[ "$buenas" = "$total" ] && [ -z "$rotas" ] || exit 1
