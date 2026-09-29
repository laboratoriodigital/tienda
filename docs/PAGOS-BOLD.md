# Cobrar en línea con Bold

> M3.5 del plan. Implementado el 21 de septiembre de 2026, a partir de la
> integración que la línea anterior del producto ya validó con una compra
> completa en el ambiente de pruebas de Bold. Documentación oficial:
> <https://developers.bold.co/pagos-en-linea/boton-de-pagos> y
> <https://developers.bold.co/pagos-en-linea/consulta-de-transacciones>.

## Dos maneras de cerrar la venta, y la elige la hoja

| `Configuración › cobro_modo` | Qué pasa al pulsar el botón del carrito |
|---|---|
| **`WhatsApp`** (de fábrica) | Como siempre: se abre WhatsApp con el pedido escrito y el pago se acuerda por el chat. |
| **`Pasarela`** | El botón dice **«Pagar con PSE»** (en pruebas, «Pagar con PSE - Pruebas»). El comprador paga en la página de Bold (PSE, tarjeta, Nequi… lo que Bold ofrezca) y vuelve a la tienda. |

**Pedir Pasarela no basta para cobrar.** Si faltan las llaves de Bold o
`sitio_url`, la tienda **sigue vendiendo por WhatsApp** —no se queda muda— y el
problema se dice en tres sitios: el diagnóstico (`A2_diagnosticoCompleto`), la
lista de alta y el panel (*El cobro › Cómo se cierra la venta*, con el aviso en rojo).

**El cambio se ve en la tienda al publicar.** La página lee el modo del catálogo
publicado. Si en el medio alguien apaga la pasarela, la página vieja pide un
cobro, el maestro contesta «esta tienda vende por WhatsApp» y la página pasa sola
a WhatsApp.

## Qué hay que poner, y dónde

**En la hoja (`Configuración`)** — lo que no es secreto:

| Clave | Valor |
|---|---|
| `cobro_modo` | `WhatsApp` o `Pasarela` (lista desplegable) |
| `cobro_ambiente` | `Pruebas` mientras se prueba; `Producción` para dinero real |
| `sitio_url` | la dirección pública de la tienda: Bold devuelve ahí al comprador |
| `correo_resumen`, `empresa_correo` | a quién le llega el aviso de cada pago |

**En el proyecto del maestro de ESA tienda** — *Configuración del proyecto ›
Propiedades del script*, las mismas donde vive `GITHUB_TOKEN`:

| Propiedad | Qué es |
|---|---|
| `BOLD_IDENTIDAD_SANDBOX` | llave de identidad del **Botón de pagos**, ambiente de pruebas |
| `BOLD_SECRETA_SANDBOX` | llave secreta, pruebas |
| `BOLD_IDENTIDAD_PRODUCCION` | llave de identidad, producción |
| `BOLD_SECRETA_PRODUCCION` | llave secreta, producción |

**Guárdalas con el botón «Guardar propiedades del script»**: si se cierra la
ventana sin guardar, no quedan, y la tienda sigue por WhatsApp. Pasó en la
primera tienda (bitácora 57). Desde la 0.9.0 el panel lo dice arriba, en rojo,
con el nombre de la llave que falta. También se aceptan los nombres de la línea
anterior (`BOLD_BOTON_IDENTIDAD_*`, `BOLD_BOTON_SECRETA_*`) y `_PRUEBAS` en vez de
`_SANDBOX`; el nombre se busca sin mirar mayúsculas ni espacios al final
(`llavesBold()`).

**El botón** dice «Pagar con PSE» con dinero real y «Pagar con PSE - Pruebas»
en el ambiente de pruebas.

**Visto en la prueba real (21-sep-2026):** en Brave el botón de Bancolombia de
la pasarela no abrió (bloqueo del navegador); en Chrome ese mismo botón falló
y el pago salió por **PSE**, también con Bancolombia. Es de Bold y del banco,
no de la tienda: la pantalla de pago ahora sugiere PSE u otro navegador si el
botón del banco no abre. El enlace de rastreo de un pago en línea lo pone el
maestro (bitácora 61), así que cambiar de navegador a mitad del pago no lo
pierde.

Son los mismos nombres que usa la línea anterior: dos tiendas del mismo titular
de Bold pueden tener los mismos cuatro valores, y copiarlos no exige traducir.
Se cargan igual en cada proyecto: compartir cuenta de Bold no es compartir
maestro ni hoja.

**Solo en las propiedades del script. Nunca en la hoja, ni en el repositorio,
ni en los secretos de GitHub (de la tienda o de `tiendas`), ni en el panel.** La
hoja se comparte; las propiedades no. Ningún flujo las lee ni las siembra:
`conectar` no las toca, y el panel no tiene campo para ellas (decisión 14). La secreta no sale del maestro por ninguna
puerta. La de identidad solo llega a la página dentro de un cobro ya preparado,
que es donde Bold la pide.

Las llaves se sacan del panel de Bold: *Integraciones › Botón de pagos*. Son las
del **Botón de pagos**, no las de la API de pagos en línea.

## Cómo funciona un cobro

1. El comprador llena el carrito y los datos de entrega —con **correo**, que en
   Pasarela es obligatorio: ahí le llega la confirmación— y pulsa «Pagar».
2. La página manda el carrito a `pago_crear`. El maestro **vuelve a calcular
   todo** —precios, cupón, envío, existencias— y no acepta un total de la
   página. Si el pedido que sale no es el que el comprador vio (otra persona
   está pagando la última unidad, no alcanza el stock, un envío que no se
   reconoce), **no cobra** y lo dice.
3. **Aparta las unidades 15 minutos** (E-1). Mientras tanto, lo que otro
   comprador ve disponible es el stock menos lo apartado, y si pide la última
   unidad se le dice **antes de pagar**: «la está pagando otra persona; vuelve
   en unos minutos».
4. Firma el cobro: SHA-256 de `pedido + monto + COP + llave secreta`, la
   fórmula de Bold. Anota el cobro en la pestaña `Pagos` y los datos de entrega
   en `Datos de entrega`, con el mismo número que en `Validaciones`.
5. La página carga `https://checkout.bold.co/library/boldPaymentButton.js` y
   abre la pasarela (`BoldCheckout`) con exactamente lo que armó el maestro
   (`crearCobro`).
6. Bold devuelve al comprador a la tienda (`?pago=<token>`). **La página no se
   cree la dirección** —trae un `bold-tx-status` que cualquiera puede
   escribir—: le pregunta al maestro, y el maestro le pregunta a Bold
   (`GET https://payments.api.bold.co/v2/payment-voucher/<pedido>`, con la
   cabecera `Authorization: x-api-key <llave de identidad>`: `consultarBold`).
7. **Aprobado y con el monto que calculó el maestro** → el pedido entra a
   `Pedidos` **ya Pagado**, con fecha de pago, proveedor y transacción. El
   inventario baja por el mismo camino que marcar Pagado a mano. Sale un correo
   al comprador y otro al comercio (con los datos de entrega). La página dice
   «Pago confirmado» y ofrece, opcional, avisar por WhatsApp.
8. Si el comprador no vuelve, un disparador cada **5 minutos** pregunta por los
   cobros abiertos. Existe **solo mientras haya alguno**: se crea con el primer
   cobro y se borra solo. La revisión de cada hora también concilia, por si el
   de cinco minutos no se pudo crear.

## Lo que sale mal, con nombre

| Qué pasa | Qué hace la tienda |
|---|---|
| Bold todavía no sabe nada (`NO_TRANSACTION_FOUND`) | Nada: sigue esperando. Bold tarda hasta unos minutos en saber de un pago. **No es un rechazo.** |
| Rechazado, fallido o anulado | `Pagos › Estado = Rechazado`, las unidades se liberan al instante, el carrito del comprador queda como estaba. |
| PSE pendiente | El apartado se sostiene de a 15 minutos **mientras Bold diga que está en curso**. |
| Nadie pagó | El apartado vence solo a los 15 minutos (se deja de contar al leer, sin limpiar nada). Se sigue preguntando hasta las 24 horas en que Bold deja consultar; ahí queda `Vencido`. |
| Aprobado por **otro monto** | **No** es una venta: `Revisar monto`, con los dos números en `Errores`. Lo decide el comerciante. |
| Aprobado **tarde y sin existencias** (se vendió por otro lado mientras tanto) | El pedido se registra —la plata ya entró—, `Pagos` dice `Pagado sin existencias` y el comercio recibe un correo: conseguir las unidades o devolver el dinero desde el panel de Bold. |
| Bold no contesta | El cobro sigue esperando; el motivo queda en `Pagos › Nota`. |
| Sin cuota de correo | La venta se registra igual; los correos salen en la siguiente vuelta, sin volver a preguntarle a Bold ni volver a descontar. |
| Total por debajo de $1.000 (`BOLD_MINIMO`) | No se abre la pasarela: «El pago en línea es desde $1.000». |
| 40 cobros abiertos a la vez (`MAX_COBROS_ABIERTOS`) | No se aparta más: «Hay muchos pagos en curso», y queda en `Errores`. |
| Doble toque en «Pagar», o reintento sin señal | Es el **mismo** cobro (número de operación): una fila, un apartado. |

## Lo que se guarda del comprador, y dónde

Por WhatsApp los datos de entrega viajan en el chat y la hoja no los guarda.
Cobrando en línea no hay chat antes del pago, así que la pestaña **`Datos de
entrega`** guarda nombre, celular, correo, ciudad, dirección y notas. Es la
**única** con datos personales; no sale por ninguna puerta, ni siquiera por el
panel (el panel dice que el pedido se cobró en línea y remite a esa pestaña).

En el navegador del comprador, mientras paga, queda en `sessionStorage` el
número del cobro, el total y el carrito — **no** su nombre, celular, correo ni
dirección. Por eso, si el pago no pasa y quiere intentarlo otra vez, los vuelve a
escribir.

Los textos legales de la tienda cambian solos con el modo: con Pasarela dicen que
se cobra en la pasarela de Bold, que el correo se guarda para confirmar el pago y
que Bold y Google ven los datos; con WhatsApp siguen diciendo lo de siempre.

## El aviso de Bold (webhook): no se usa, y por qué

Bold firma su aviso en la cabecera `x-bold-signature`, y el `doPost` de Apps
Script **no ve las cabeceras**. Un aviso que no se puede verificar no puede
marcar nada como pagado. La verdad se le pregunta a la API autenticada de Bold,
que es exactamente lo que ya hace la consulta. (Decisión 12.) Además, en el
ambiente de pruebas Bold no manda avisos ni correos.

## Probarlo, antes de cobrar de verdad

1. Llaves de **pruebas** en las propiedades, `cobro_modo = Pasarela`,
   `cobro_ambiente = Pruebas`. Publicar.
2. En la tienda: el botón dice **«Pagar con PSE - Pruebas»** y el carrito avisa
   *«Pagos en modo de pruebas»*. La pasarela muestra la etiqueta amarilla
   **Modo de pruebas**.
3. **Aprobado:** tarjeta VISA `4111111111111111` (o PSE › *BANCO QUE APRUEBA*).
   Al volver: «Estamos confirmando…» y luego «Pago confirmado». En la hoja: una
   fila en `Pagos` (`Pagado`), una en `Datos de entrega`, las líneas en
   `Pedidos` en `Pagado` **una sola vez**, el stock descontado una vez, dos
   correos con **[PRUEBA]** en el asunto.
4. **Rechazado:** tarjeta `4970110000000062` (o *BANCO QUE RECHAZA*). La tienda
   dice que no se cobró nada y el carrito sigue ahí.
5. **Recargar** la página de confirmación, o pulsar «Verificar ahora» varias
   veces: no aparece otro pedido ni otro correo.
6. **Dos compradores, la última unidad:** stock 1, uno empieza a pagar y el
   otro (en otra ventana) recibe el aviso antes de pagar.
7. **Abandono:** empezar a pagar y cerrar. A los 15 minutos la unidad vuelve a
   estar disponible; `Pagos` sigue en `Esperando pago` hasta el plazo.
8. Si en la consola del navegador aparece `boldPaymentButton.js (blocked:csp)`,
   la política de seguridad no incluye `https://checkout.bold.co`: tiene que
   estar en las TRES copias —`publicar/_headers`, el `<meta>` del `index.html`
   y la que genera el maestro—. `montaje.js` las compara.

**Solo después**: llaves de producción, `cobro_ambiente = Producción`, publicar,
y una compra real de valor bajo. Mientras la pasarela esté en Pruebas, el
diagnóstico lo recuerda: en pruebas, una tarjeta de prueba «paga» y descuenta
inventario.

## Qué se portó de la línea anterior, y qué se hizo distinto

Se portó lo que ya estaba validado contra Bold: la librería
(`boldPaymentButton.js` con `BoldCheckout`), la firma, la consulta por
referencia y sus estados, los nombres de las propiedades, la CSP y no confiar en
la dirección de vuelta. Lo que cambia es el alrededor, porque esta tienda tiene
sus propias reglas escritas en el plan (M3.5):

- **El apartado dura 15 minutos**, no un día, y se sostiene mientras Bold diga
  «en curso». Un día apartando por cada carrito abandonado vacía el catálogo.
- **Los cobros abiertos viven en una propiedad**, no en otra pestaña: la
  validación los lee con cada cambio del carrito, y leer una propiedad cuesta
  mucho menos que leer una hoja.
- **Con la pasarela a medio configurar se vende por WhatsApp**, en vez de
  enseñar un botón de pagar que no funciona.
- **El disparador existe solo mientras haya cobros abiertos** (presupuesto de
  ejecuciones, §6 del plan), en vez de correr cada 15 minutos siempre.
- **No se cobra un carrito recortado**: si el maestro tuvo que quitar algo, se
  le dice al comprador antes de abrir la pasarela.
- **La llave de Apps Script no se anida.** Cobrar trabaja bajo llave y el acta
  de `Validaciones` se escribe con `escribirActa`, no con `sellar()`, que
  soltaría la llave del cobro a medio escribir.
- **Nada del comprador guardado en su navegador**: la copia del cobro que queda
  en `sessionStorage` va sin `customerData` ni `billingAddress`. A la pasarela
  sí se le pasan nombre, correo y celular —y la dirección si hay envío— para
  que Bold no los vuelva a pedir; por eso los textos legales dicen que Bold ve
  los datos. *(Corregido el 29-sep-2026: aquí decía que tampoco iban en el
  objeto que se le pasa a Bold.)*
- Los pedidos de WhatsApp siguen existiendo tal cual; no hay un modo de
  «pedido sin pagar» mezclado con la pasarela.

## Las pruebas

- `pruebas/pagos.js` (maestro, 67 aserciones): firma, total del maestro, dos
  compradores, aprobado, rechazado, monto distinto, PSE pendiente, vencido,
  aprobado sin existencias, Bold caído, sin cuota, producción, disparadores.
- `pruebas/pagoweb.js` (navegador, 26): el botón, lo que le llega a Bold, la
  vuelta con `approved` en la dirección, nada del comprador en el navegador,
  rechazado con el carrito intacto, la última unidad, los textos legales.
- `pruebas/legal.js` (20): los textos con y sin pasarela.
