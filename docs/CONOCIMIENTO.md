# Del error al conocimiento aplicado

**Estado:** idea conceptualizada, sin construir. Al día con la 1.0.0 (30-sep-2026).
La fase 0 está hecha; la F5 tiene su primer uso real, a mano, con el arranque de la
Tienda 3.0 (§7); las demás son propuesta. La decide el dueño.

La bitácora es el segundo cerebro del proyecto: qué se rompió, por qué, cómo se
supo y qué lo impide hoy. Este documento plantea cómo dejar de tener una por
proyecto —cada una aprendiendo sola lo que otra ya pagó— y convertir lo aprendido
en algo que se **aplique** en cada fase de un proyecto: desde la idea hasta la
operación.

---

## 1 · Lo que ya existe

| Pieza | Dónde | Qué aporta |
|---|---|---|
| Entradas numeradas, citables por número | `docs/BITACORA.md` (1–113; la 113 es la 1.0.0) | La historia, con la voz de quien se equivocó. El código y los documentos las citan: «bitácora 103» |
| Ficha de cierre por entrada | `BITACORA.md` › *Cómo escribir una entrada* | Autoría · severidad · patrones · versión · fecha, en una línea que se puede leer con una expresión regular |
| Patrones P1–P21 | `BITACORA.md` › *Lo aprendido* | La regla en una línea, las entradas que la prueban y **lo que la impide hoy** (batería, aserción o código) |
| Otras bitácoras | `organico/docs/BITACORA.md` (línea Básica) y su copia en cada tienda Básica | La misma historia hasta la separación y otra después, con su propia numeración. Desde la decisión 36 (30-sep-2026) Orgánico solo recibe correcciones hasta que sus clientes se migren: su bitácora crece poco y se hereda como está |

Lo que falta: que esas piezas se lean entre proyectos y que alguien —una
persona, un flujo o Claude— las **use** antes de equivocarse, no después.

---

## 2 · El modelo

Dos objetos, con ids que no cambian nunca (la regla que ya siguen las entradas).

**Entrada** — un hecho que pasó en un proyecto.

| Campo | Ejemplo | De dónde sale |
|---|---|---|
| `id` | `tienda/103` | proyecto + número de su bitácora |
| `titulo` | La flota entrega los flujos | la negrita inicial |
| `sintoma` | «refusing to allow a GitHub App to create or update workflow … without `workflows` permission» | el texto literal que se vio |
| `causa` · `reproduccion` · `arreglo` | … | los párrafos de la entrada |
| `prueba` · `control_negativo` | `pruebas/actualizar.js`, visto en rojo | «Lo prueban …» |
| `patrones` | `P10, P12` | la ficha |
| `severidad` · `autoria` · `version` · `fecha` | 🟠 · mío · 0.22.1 · 2026-09-28 | la ficha |
| `etiquetas` | `github-actions`, `tokens`, `auto-actualizacion` | nuevas: el vocabulario común entre proyectos |

**Patrón** — lo que se repitió, en cualquier proyecto.

| Campo | Ejemplo |
|---|---|
| `id` global | `K-12` (los `P` de cada bitácora se mapean a él: `tienda/P12 → K-12`) |
| `regla` | El permiso que se comprueba es el que se usa |
| `evidencia` | `tienda/68`, `tienda/103`, `organico/…` |
| `mecanismos` | lo que lo impide hoy, por proyecto, con su ruta |
| `fase` | en qué fase conviene aplicarlo (ver §4) |

Regla de la casa aplicada al propio sistema (P2): **el índice se deriva, nunca se
edita a mano.** La fuente es cada bitácora; todo lo demás se genera.

---

## 3 · La arquitectura propuesta

Copia deliberada de lo que ya funciona con la flota: cada repositorio es dueño de
su fuente, y un repositorio central lee, junta y publica.

```
 tienda/docs/BITACORA.md ──┐
 organico/docs/BITACORA.md ┼─► extractor (en cada repo) ─► bitacora.json
 <proyecto nuevo>/…        ┘            │
                                        ▼
                    repo `conocimiento` (Action semanal o a mano)
                    · trae cada bitacora.json por la API de contenidos
                    · une patrones (mapa P → K), detecta duplicados
                    · publica: indice.md · conocimiento.json · una página
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
   buscar por síntoma          revisar un cambio o un plan      arrancar un proyecto
   (runbook universal)         (skill de Claude)                (ficha de riesgos heredados)
```

1. **Extractor por repo** (`montar/bitacora.mjs`): lee `BITACORA.md`, saca
   entradas y ficha, y escribe `bitacora.json`. Una batería exige que toda
   entrada nueva lleve ficha y cite al menos un patrón existente o abra uno.
2. **Repo `conocimiento`**: mismo patrón que `tiendas`. Un token de solo
   lectura sobre los repos que aportan. Nada secreto entra (P13): la bitácora
   ya no lleva valores de secretos.
3. **Salidas**: un índice legible, un JSON para máquinas y una página estática
   como el panel de la flota.

---

## 4 · Cómo se aplica, fase por fase

| Fase | Pregunta que responde | Mecanismo |
|---|---|---|
| **Ideación** | ¿Qué nos va a doler, si ya sabemos qué duele? | Al describir un proyecto nuevo (piezas: Apps Script, Actions, auto-actualización, Windows…), se filtran los patrones por etiqueta y sale una **ficha de riesgos heredados**: «vas a tener un auto-actualizador → K-10: corre su versión vieja; la lógica que decide va donde la actualización la escribe antes» |
| **Conceptualización** | ¿Qué decisiones de arquitectura trae eso? | Cada patrón con `fase: diseño` propone una decisión en el formato de `DECISIONES.md`, con su evidencia: la cicatriz viene antes que la herida |
| **Diseño y revisión** | ¿Este cambio repite algo? | Una skill de Claude lee `conocimiento.json` y revisa un diff o un plan contra las reglas, citando la entrada que lo prueba («esto compara árbol con índice justo después de un checkout: `tienda/106`») |
| **Construcción** | ¿Cómo lo pruebo para que no mienta? | Plantillas de prueba por patrón: control negativo (K-5), segunda tienda con otros datos (K-4), repositorio de juguete con git de verdad (K-16) |
| **Despliegue** | ¿Qué no ha corrido nunca con sus secretos? | Lista de flujos sin corrida real en verde (K-16), del estado de Actions |
| **Operación** | ¿Ya vimos este error? | Se pega el texto del error y se busca por `sintoma`: sale la entrada, la causa y qué hacer. El runbook deja de escribirse a mano |

---

## 5 · Lo que mide

- **Recurrencia**: cuántas entradas nuevas caen en un patrón que ya tenía
  mecanismo. Si sube, el mecanismo no sirve.
- **De la herida al mecanismo**: tiempo entre la primera entrada de un patrón y
  el día en que algo lo impide en rojo.
- **Honestidad de las pruebas**: porcentaje de entradas con control negativo
  visto en rojo.
- **Costo**: corridas o versiones que costó cada patrón. Responde con datos a
  «¿por qué nos está tomando tanto tiempo?».

---

## 6 · Riesgos del propio sistema

| Riesgo | Mitigación |
|---|---|
| El formato mata la voz y nadie vuelve a escribir | La ficha es una línea al final; el cuerpo sigue siendo prosa |
| Un índice editado a mano se desalinea (P2) | Solo se genera; una batería rechaza cambios a mano |
| Se filtra algo que no debe salir del proyecto | El extractor solo publica campos declarados; P13 como batería |
| Patrones que se parecen se duplican entre proyectos | El mapa `P → K` lo decide una persona al unir; lo generado propone candidatos |

---

## 7 · Por dónde seguir

| Fase | Qué | Estado |
|---|---|---|
| **F0** | Formato común: ficha de cierre, *Lo aprendido*, *Cómo escribir una entrada* | **Hecho** (0.22.3, con P1–P20; P21 entró en la 0.24.1, bitácora 111) |
| F1 | Extractor `bitacora.mjs` + batería de formato de las entradas nuevas | Propuesta |
| F2 | La bitácora de `organico` al mismo formato; mapa `P → K` inicial | Propuesta. Con Orgánico congelado (decisión 36), basta convertirla una vez |
| F3 | Repo `conocimiento`, su Action y su página | Propuesta |
| F4 | Skill de revisión y búsqueda por síntoma | Propuesta |
| F5 | Ficha de riesgos heredados al arrancar un proyecto nuevo | **Primer uso real, a mano**: la Tienda 3.0 (abajo) |

**La Tienda 3.0 arranca heredando la bitácora.** Es un proyecto nuevo, desde
cero (decisión 36), y empieza en `docs/TRASLADO-3.0.md`: qué se lleva de la 2.0
—las entradas 1–113, los patrones P1–P21 y las decisiones— y qué no. Es el
**primer uso real de F5**, hecho a mano y sin F1–F4: la ficha de riesgos
heredados la arma una persona leyendo `BITACORA.md`, no un índice generado. Lo
que cueste hacerlo así es la medida de cuánto vale automatizarlo. Con el modelo
de §2, las entradas de la 2.0 siguen citándose por su id (`tienda/103`) aunque
la 3.0 abra su propia numeración.

Con F1–F3, este sistema y la automatización de despliegue de la flota son la
misma idea: **un repositorio central que conoce a muchos y los pone al día.** Si
algún día se vende uno como servicio, el otro viene con él.
