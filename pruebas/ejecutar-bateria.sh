#!/bin/bash
# Corre UNA batería: le levanta el/los servidor(es) que declare necesitar y
# guarda su salida en $SALIDA/$f. Todo lo que antes vivía en dos funciones de
# todas.sh (`arrancar`, `ejecutar`), exportadas con `export -f` para que cada
# trabajo de fondo las tuviera disponibles.
#
# POR QUÉ ESTO ES UN ARCHIVO Y NO UNA FUNCIÓN EXPORTADA. Dos intentos
# anteriores intentaron aislar cada batería controlando qué hereda un
# subshell de la shell de arriba —una guardia por PID, después `trap - EXIT`
# al entrar a la función—, y los dos se rompieron en Git Bash (Windows): la
# corrida se cortaba con «No such file or directory» antes incluso de que
# node arrancara. `export -f` fue el tercer intento —cada batería en su
# propio `bash -c`, sin trampa que heredar porque un `exec` la resetea
# siempre— y en Git Bash rompió de una forma nueva: «environment: line N:
# .../archivo.js: No such file or directory», que es la firma de que ALGO en
# esa máquina no reconstruye bien una función pasada por variable de entorno
# (`BASH_FUNC_nombre%%`) — un mecanismo que ya tiene historia de tratamiento
# distinto entre builds de bash, justamente por Shellshock.
#
# Esto no depende de nada de eso. Es un archivo real en el disco; un
# `bash ejecutar-bateria.sh arg1 arg2 arg3` arranca un proceso nuevo que LEE
# ese archivo — no una trampa heredada, no una función reconstruida desde una
# variable de entorno. No hay mecanismo que adivinar: es la forma más básica
# de correr un script que existe, y por eso es la más portable.
set -u
f="$1"; i="$2"; SALIDA="$3"
puerto=$((8100 + i * 2))
viejo=$((8101 + i * 2))
pids=""

# Levanta un servidor y ESPERA A QUE CONTESTE, que no es lo mismo que esperar
# dos segundos. El `sleep 2` de antes era una apuesta: en una máquina cargada
# se quedaba corto y la batería fallaba con un ECONNREFUSED que no significaba
# nada. Aquí se pregunta hasta que responde, con un tope.
arrancar() {   # arrancar <puerto> <viejo|nuevo>  → deja el PID en $PID_SERVIDOR
  local puerto=$1 modo=$2 j=0
  if [ "$modo" = viejo ]; then
    VERSION_VIEJA=1 PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  else
    PUERTO=$puerto node servidor.js > /dev/null 2>&1 < /dev/null &
  fi
  PID_SERVIDOR=$!
  while [ $j -lt 300 ]; do
    curl -sf "http://localhost:$puerto/__reset" > /dev/null 2>&1 && return 0
    kill -0 "$PID_SERVIDOR" 2>/dev/null || return 1   # se murió al arrancar
    sleep 0.1; j=$((j + 1))
  done
  return 1
}

# QUÉ SERVIDORES NECESITA ESTA BATERÍA, PREGUNTÁNDOSELO A ELLA. Una lista
# aparte sería la segunda copia del mismo dato, y ya sabemos cómo acaba eso
# (patrón 2): se agrega una batería, nadie toca la lista, y arranca sin
# servidor.
if grep -q 'process.env.PUERTO ||' "$f"; then
  arrancar "$puerto" nuevo || { echo "ERROR: no arrancó el servidor del puerto $puerto" > "$SALIDA/$f"; exit 0; }
  pids="$pids $PID_SERVIDOR"
  [ "$f" = "pag.js" ] && curl -s "http://localhost:$puerto/__muchos" > /dev/null
fi
if grep -q 'process.env.PUERTO_VIEJO ||' "$f"; then
  arrancar "$viejo" viejo || { echo "ERROR: no arrancó el servidor del puerto $viejo" > "$SALIDA/$f"; exit 0; }
  pids="$pids $PID_SERVIDOR"
fi

PUERTO=$puerto PUERTO_VIEJO=$viejo timeout 240 node "$f" > "$SALIDA/$f" 2>&1
estado=$?
[ $estado -ne 0 ] && echo "(salió con código $estado)" >> "$SALIDA/$f"

# Se apagan aquí y no al final: doce emuladores vivos a la vez son memoria
# que no hace falta, y en un runner de Actions la memoria sí se acaba.
for pid in $pids; do kill "$pid" 2>/dev/null; done
