#!/bin/bash
# Corre UNA batería: le levanta el/los servidor(es) que declare necesitar y
# guarda su salida en $SALIDA/$f.txt.
#
# Es un archivo y no una función exportada porque cada batería se lanza como un
# proceso suyo —`bash ejecutar-bateria.sh …`— y así no hereda nada de la corrida
# de arriba: ni trampas, ni funciones reconstruidas desde el entorno. Leer un
# archivo del disco y correrlo es lo más básico que hace un intérprete de
# comandos, y por eso es lo que se comporta igual en todas partes.
set -u
f="$1"; i="$2"; SALIDA="$3"
puerto=$((8100 + i * 2))
viejo=$((8101 + i * 2))
registro="$SALIDA/$f.txt"
anotados="$SALIDA/pids-$i"
pids=""

# Levanta un servidor y ESPERA A QUE CONTESTE, que no es lo mismo que esperar
# dos segundos. El `sleep 2` de antes era una apuesta: en una máquina cargada se
# quedaba corto y la batería fallaba con un ECONNREFUSED que no significaba
# nada. Aquí se pregunta hasta que responde, con un tope.
#
# El PID se anota en un archivo además de en la variable: si esta corrida se
# corta con Ctrl+C nadie llega a la línea que los apaga, y la corrida siguiente
# necesita poder matarlos sin `pkill` —que en Git Bash no existe—.
arrancar() {   # arrancar <puerto> <viejo|nuevo>  → deja el PID en $PID_SERVIDOR
  local puerto=$1 modo=$2 j=0
  if [ "$modo" = viejo ]; then
    VERSION_VIEJA=1 PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  else
    PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  fi
  PID_SERVIDOR=$!
  echo "$PID_SERVIDOR" >> "$anotados"
  while [ $j -lt 300 ]; do
    curl -sf "http://localhost:$puerto/__reset" > /dev/null 2>&1 && return 0
    kill -0 "$PID_SERVIDOR" 2>/dev/null || return 1   # se murió al arrancar
    sleep 0.1; j=$((j + 1))
  done
  return 1
}

# QUÉ SERVIDORES NECESITA ESTA BATERÍA, PREGUNTÁNDOSELO A ELLA. Una lista aparte
# sería la segunda copia del mismo dato, y ya sabemos cómo acaba eso (patrón 2):
# se agrega una batería, nadie toca la lista, y arranca sin servidor.
if grep -q 'process.env.PUERTO ||' "$f"; then
  arrancar "$puerto" nuevo || { echo "ERROR: no arrancó el servidor del puerto $puerto" > "$registro"; exit 0; }
  pids="$pids $PID_SERVIDOR"
  [ "$f" = "pag.js" ] && curl -s "http://localhost:$puerto/__muchos" > /dev/null
fi
if grep -q 'process.env.PUERTO_VIEJO ||' "$f"; then
  arrancar "$viejo" viejo || { echo "ERROR: no arrancó el servidor del puerto $viejo" > "$registro"; exit 0; }
  pids="$pids $PID_SERVIDOR"
fi

PUERTO=$puerto PUERTO_VIEJO=$viejo timeout 240 node "$f" > "$registro" 2>&1
estado=$?
[ $estado -ne 0 ] && echo "(salió con código $estado)" >> "$registro"

# Se apagan aquí y no al final: doce emuladores vivos a la vez son memoria que
# no hace falta, y en un runner de Actions la memoria sí se acaba.
for pid in $pids; do kill "$pid" 2>/dev/null; done
rm -f "$anotados"
exit 0
