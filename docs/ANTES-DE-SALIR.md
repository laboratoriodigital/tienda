# Antes de salir al aire

Lo que hay que mirar antes de que un comprador real ponga su dirección en la
página de **una tienda**. Primero lo que el sistema comprueba solo —para saber
dónde mirar cuando se queja—, después lo que sigue siendo tuyo. Está ordenado
por lo que más duele si sale mal, no por lo que más trabajo cuesta.

_Vigente a la 0.23.0 (29 de septiembre de 2026)._

---

## Lo que se comprueba solo

### 1 · ¿Está terminada? — `LISTA_DE_ALTA`, en `maestro.gs`

La pregunta «¿está esta tienda terminada?» no se lleva en la cabeza: la contesta
el **Diagnóstico** en su punto 2 (*«¿Está terminada esta tienda?»*), la
*Revisión de tu tienda* del panel, y la hoja *Panel de tiendas* para todas a la
vez, en la columna **Sin terminar**. Un valor entre corchetes cuenta como vacío.

- **Bloquean** —el `montaje` **se niega** a escribir el `index.html` y dice
  cuál falta y por qué—: `negocio`, `whatsapp`, `sitio_url`, `pago_llave`
  (salvo si se cobra por pasarela), y los datos del responsable de los datos
  personales: `empresa_razon`, `empresa_nit`, `empresa_direccion`,
  `empresa_ciudad` y al menos uno de `empresa_correo` o `empresa_tel`
  (decisión 09: un texto legal sin responsable no obliga a nadie).
- **Avisan** —salen en el resumen del montaje, el Diagnóstico y el panel, y
  **no** bloquean—: `pago_titular`, `pago_entidad`, `repositorio`,
  `correo_resumen`, `sitio_titulo`, `sitio_descripcion`, `respaldo_carpeta`;
  `cobro_modo` si se pidió pasarela y no está lista (la tienda sigue por
  WhatsApp), y `cobro_ambiente` si la pasarela sigue en **Pruebas**.

Cuando todo está lleno, el Diagnóstico dice «OK las N claves del alta están
llenas».

### 2 · Que se publique la tienda correcta — `montaje.yml`

Antes de hornear nada, el montaje comprueba, y se para si no:

- que existan los secretos `MAESTRO_URL` y `MAESTRO_TOKEN`;
- que el sitio de Cloudflare tenga **nombre propio** en `wrangler.jsonc`
  (`montar/revisar-worker.mjs`): dos tiendas con el mismo nombre son el mismo
  Worker y una pisa a la otra;
- que la hoja sea **la de esta tienda** (`montar/misma-tienda.mjs`, contra
  `Configuración › repositorio`);
- que el maestro vivo sea **el del repositorio** (`montar/preparar-index.mjs`):
  si no, no hornea y dice qué casilla marcar.

Si las fotos van por Cloudflare, dice en el resumen si la zona de verdad
transforma (`montar/revisar-fotos-cdn.mjs`). Avisa; no tumba la corrida.

### 3 · Que lo horneado funcione — `pruebas/tienda-viva.js`

La compuerta de toda publicación de una tienda (`montaje` y *Publicar ahora*):
la página habla con **su** maestro y en su misma versión, el catálogo y el
respaldo se leen y coinciden, y la página abre en un navegador con los productos
de esa tienda y sin errores. Si falla, no se publica nada. La lista completa, en
`ACTUALIZAR-UNA-TIENDA.md` › *La compuerta*.

### 4 · Lo que ya está resuelto por diseño

- La llave de pago no está en la página ni en el repositorio: se entrega por la
  respuesta automática de WhatsApp.
- Las llaves de Bold y el `GITHUB_TOKEN` viven **solo** en las propiedades del
  script del maestro: ni en la hoja, ni en el repositorio, ni en los secretos de
  GitHub de la tienda, ni en el panel.
- La hoja guarda **qué** se pidió, no **quién** lo pidió.
- El total lo recalcula y lo sella el maestro con los precios de la hoja.
- Si la hoja no contesta, la tienda pinta el catálogo de respaldo que lleva
  dentro: **degrada, no se cae**.

---

## Lo que sigue siendo tuyo, una vez por tienda

Nada de esto lo puede ver el sistema. Saber que `pago_llave` está llena no dice
si el mensaje sale.

- [ ] **La respuesta automática de WhatsApp**, con el texto de pago. Si falta,
      el comprador termina el pedido y **no tiene cómo pagar**: es el único
      sitio donde el diseño de seguridad se vuelve un agujero si se olvida.
      WhatsApp Business › Herramientas para la empresa › Mensaje de ausencia. El
      texto, en `DESPLIEGUE.md` › paso 14. Es de la cuenta de cada comercio: se
      mira en cada tienda, de verdad, no se da por puesto.
- [ ] **Un pedido de punta a punta con un teléfono que no sea el del
      comercio**: pedido → WhatsApp → respuesta automática → transferencia →
      **Pagado** en la hoja o el panel → el stock baja. Las baterías prueban las
      piezas; esto prueba la costura.
- [ ] **Si cobra en línea**: la prueba de `PAGOS-BOLD.md` con las llaves de
      pruebas en la tienda publicada, y después `cobro_ambiente` en
      **Producción**. En pruebas, una tarjeta de prueba «paga» y descuenta
      inventario.
- [ ] **Qué pasa si Apps Script no contesta justo al enviar el pedido.** Hay que
      provocarlo, no suponerlo: apagar la implementación un minuto y hacer un
      pedido. Lo que **no** puede pasar es que el comprador se quede sin poder
      mandar el WhatsApp.
- [ ] **Los datos legales, revisados por un abogado una vez.** Las claves
      `empresa_*` alimentan los textos de tratamiento de datos (Ley 1581 de
      2012). Los textos están escritos, pero no somos abogados: antes de
      venderle el servicio a un tercero, que alguien revise el machote y que
      quede por contrato que el responsable del tratamiento es el comercio.
- [ ] **El respaldo**: la carpeta de `respaldo_carpeta` compartida con la cuenta
      de la tienda, con permiso de editor. Sin eso no hay copia semanal
      (`A4_respaldoAhora()` en el maestro la prueba sin esperar al domingo).
- [ ] **La clave del panel**: `panel_usuario` en Configuración y menú de la
      hoja › **Clave del panel**. Se ve una sola vez: se entrega en persona.

---

## El techo real, y cómo se ve cuando se toca

**Las ejecuciones de Apps Script.** El límite que no se compra con dinero son
**30 ejecuciones simultáneas por cuenta de Google** (ver `ARQUITECTURA.md`). La
vitrina ya no gasta una por visita —lee el catálogo horneado—, pero el pedido,
el panel y el cupón sí. Con una cuenta por tienda es holgado para un comercio
pequeño. Cuando se acerca, la tienda tarda y cae al catálogo de respaldo: precios
y stock de la última publicación. La hoja *Panel de tiendas* muestra por tienda
las **Lecturas hoy**; el tope simultáneo Google no lo expone. Si el comercio va
a mandar el enlace a mil personas a la misma hora, esa es la hora en que se
prueba.

**La hoja crece y nadie la poda.** `Pedidos` y `Validaciones` solo crecen.
Google Sheets corta a los diez millones de celdas, y mucho antes la hoja se
vuelve lenta de abrir. Falta una función de archivado. No bloquea la primera
tienda; sí la décima.

**La hoja es la base de datos.** Copia semanal los domingos a las 2 de la
mañana, con `makeCopy`, y ocho copias de retención, a la carpeta de
`respaldo_carpeta`. El panel muestra la fecha del último respaldo por tienda.

---

## Operación

**Qué nos avisa si una tienda se cae.** El correo diario de la hoja *Panel de
tiendas*, a las 7. Para un comercio pequeño alcanza.

**Cómo se vuelve atrás.** Una actualización que falla no publica nada, y si ya
había publicado el maestro nuevo, vuelve a poner el de antes sola. A mano: el
flujo `restaurar` de la tienda (`el-sitio` o `la-version`) y, para los datos,
`A5_respaldos()` y `A6_restaurarDatos()` en el maestro. Detalle en
`ACTUALIZAR-UNA-TIENDA.md` › *Volver atrás*. Conviene haberlo hecho una vez
**antes** de necesitarlo.

**El dominio.** `algo.workers.dev` funciona, pero el comprador lo lee y
desconfía, y sin dominio propio no sirven las transformaciones de imagen de
Cloudflare. Un dominio nuestro alcanza para todas las tiendas como subdominios
(`DESPLIEGUE.md` › *Dominio propio*).

---

## Lo que montar una tienda todavía pide a mano

Con `alta` y `conectar` (en `tiendas`), lo que queda a mano es lo que no se
puede hacer desde fuera (el paso a paso, en `RUNBOOK-TECNICO.md`):

| Paso | Por qué a mano |
|---|---|
| La cuenta de Google, la hoja, el proyecto del maestro, `A0_instalar()` y la implementación | Google no deja crear cuentas por programa |
| Pegar el stub en la hoja | Hay que estar dentro de la hoja |
| El secreto `CLASPRC` de la tienda | Es la credencial de Google de esa cuenta |
| Conectar el repositorio en Cloudflare | Ese diálogo es del navegador; va después del primer montaje verde |
| Las fotos del comercio y la respuesta automática de WhatsApp | Son del comercio |

> *Historia.* En la línea anterior (Orgánico) esta lista cerró el 15 de
> septiembre de 2026 con la 2.15.1 corriendo idéntica en las tres tiendas y la
> prueba de punta a punta hecha en la 3.0.0. Aquel cronómetro —30 minutos por
> tienda, la mitad copiando secretos en GitHub— es lo que `conectar` vino a
> quitar.
