/* ═══════════════════════════════════════════════════════════════════════════
   VOLVER ATRÁS: EL SITIO Y LA VERSIÓN (0.18.0 · flujo `restaurar`)
   ---------------------------------------------------------------------------
   Lo que se decide, sin red. Lo corre `.github/workflows/restaurar.yml`.

   EL MODELO, ENTERO, EN TRES PUNTOS DE RESTAURACIÓN QUE YA EXISTÍAN:

     los datos   las copias semanales de la hoja en el Drive del administrador.
                 Se vuelve desde el editor del maestro: A5_respaldos() para
                 verlas y A6_restaurarDatos() para volver a una.
     el sitio    cada commit de `main` que tocó `publicar/`. Se vuelve con
                 `restaurar` › **el-sitio**: trae esa carpeta de ese commit y
                 la publica como un commit NUEVO (no se reescribe la historia).
     la versión  cada etiqueta `vX.Y.Z` de la semilla. Se vuelve con
                 `restaurar` › **la-version**, que le pide a `montaje` la
                 versión de antes: baja el código, publica ese maestro,
                 rehornea desde la hoja y corre las baterías. Si algo de eso
                 falla, no publica nada — igual que al actualizar.

   NADA DE ESTO INVENTA INFRAESTRUCTURA. No hay un almacén de respaldos nuevo,
   ni un formato propio: git ya guarda el sitio y las versiones, y Drive ya
   guarda las copias. Lo que faltaba era la manera de volver sin manos.

   Y VOLVER ATRÁS NO BORRA. Restaurar el sitio es un commit más encima, no un
   `push --force`: lo que se restauró también se puede deshacer, y la historia
   sigue contando lo que pasó de verdad.

     node montar/volver-atras.mjs sitio      (DIR: el repositorio)
     node montar/volver-atras.mjs version    (con SEMILLA_TOKEN, si es privada)
   ═══════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const ESCRIBE = ['publicar/ (al volver el sitio)'];

/* Lo que pide el formulario, comprobado antes de tocar nada. La palabra no es
   decoración: `restaurar` publica encima de una tienda que está vendiendo. */
export function loQueSePide({ que, hasta, confirmar }) {
  const errores = [];
  const q = String(que || '').trim();
  if (['el-sitio', 'la-version'].indexOf(q) === -1) {
    errores.push('Elige qué restaurar: `el-sitio` (la carpeta publicar/ de un commit) o `la-version` (una versión de la semilla).');
  }
  if (String(confirmar || '').trim() !== 'RESTAURAR') {
    errores.push('Escribe **RESTAURAR** en el campo de confirmación: esto publica encima de una tienda que está vendiendo.');
  }
  const h = String(hasta || '').trim();
  if (q === 'la-version' && h && !/^v\d+\.\d+\.\d+$/.test(h)) {
    errores.push('La versión se escribe como la etiqueta de la semilla: `v0.16.0`. Vacío = la anterior a la de esta tienda.');
  }
  if (q === 'el-sitio' && h && !/^[0-9a-f]{7,40}$/i.test(h)) {
    errores.push('El commit se escribe con su identificador (`a1b2c3d`). Vacío = el anterior que tocó `publicar/`.');
  }
  return { errores, que: q, hasta: h };
}

/* A QUÉ COMMIT SE VUELVE. `git log --format=%H %ci %s -- publicar/` da los que
   tocaron el sitio, del más nuevo al más viejo: el primero es lo que está
   publicado AHORA, así que «el anterior» es el segundo. Si no hay segundo, es
   que la tienda solo se publicó una vez y no hay a dónde volver. */
export function elCommitAnterior(salidaDeGitLog, pedido) {
  const commits = String(salidaDeGitLog || '').split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => { const [sha, ...resto] = l.split(' '); return { sha, que: resto.join(' ') }; });
  if (pedido) {
    const uno = commits.filter(c => c.sha.indexOf(pedido.toLowerCase()) === 0)[0];
    if (uno) return { commit: uno, ahora: commits[0] || null };
    return { error: 'Ese commit no tocó `publicar/` en esta tienda. Los que sí: ' +
                    commits.slice(0, 5).map(c => '`' + c.sha.slice(0, 7) + '`').join(', ') + '.' };
  }
  if (commits.length < 2) {
    return { error: 'Esta tienda solo tiene una publicación: no hay ningún sitio anterior al que volver.' };
  }
  return { commit: commits[1], ahora: commits[0] };
}

/* A QUÉ VERSIÓN SE VUELVE. Las etiquetas son de la SEMILLA —la tienda no corta
   versiones—, y la de esta tienda está en su package.json. «La anterior» es la
   que va justo antes de esa, no la penúltima publicada: si la tienda se quedó
   dos versiones atrás, volver a la penúltima sería ADELANTARLA. */
export function laVersionAnterior(etiquetas, actual) {
  const n = t => String(t).replace(/^v/, '').split('.').map(Number);
  const menos = (a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
  const vs = (etiquetas || []).map(String).filter(t => /^v\d+\.\d+\.\d+$/.test(t))
    .map(t => ({ t, n: n(t) })).sort((a, b) => menos(b.n, a.n));
  if (!vs.length) return { error: 'La semilla no tiene ninguna versión publicada.' };
  const mia = n(actual || '0.0.0');
  const anterior = vs.filter(v => menos(v.n, mia) < 0)[0];
  if (!anterior) return { error: 'Esta tienda ya está en la versión más antigua publicada (' + actual + ').' };
  return { version: anterior.t };
}

/* Lo que se lee en el resumen de la corrida. Un restaurar sin explicación es
   un susto: alguien ve un commit nuevo en una tienda que nadie tocó. */
export function informe({ que, desde, hasta, comercio, nota }) {
  if (que === 'el-sitio') {
    return [`### El sitio de ${comercio || 'la tienda'} volvió atrás`, '',
            `- Estaba en \`${(desde || '').slice(0, 7)}\` y ahora publica lo de \`${(hasta || '').slice(0, 7)}\`.`,
            '- Es un commit NUEVO encima, no una historia reescrita: esto también se puede deshacer.',
            '- Cloudflare vuelve a publicar solo, en un minuto.', '',
            nota || ''].join('\n').trim();
  }
  return [`### ${comercio || 'La tienda'} vuelve a la versión ${hasta}`, '',
          `- Estaba en \`${desde}\`. Se le pidió a **montaje** que traiga \`${hasta}\` de la semilla.`,
          '- Ese flujo publica el maestro, rehornea desde la hoja y corre las baterías: si algo falla, no publica nada.',
          '- Los DATOS de la hoja no se tocan: para eso está A6_restaurarDatos en el maestro.', '',
          nota || ''].join('\n').trim();
}

const git = (...a) => execFileSync('git', a, { cwd: process.env.DIR || process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const decir = t => { console.log(t); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + '\n'); };
const salida = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, k + '=' + v + '\n'); };

function main() {
  const pedido = loQueSePide({ que: process.env.QUE, hasta: process.env.HASTA, confirmar: process.env.CONFIRMAR });
  if (pedido.errores.length) { decir('### No se restauró nada\n\n- ' + pedido.errores.join('\n- ')); process.exit(1); }
  const comercio = (() => { try { return JSON.parse(readFileSync('package.json', 'utf8')).name || ''; } catch (e) { return ''; } })();

  if (pedido.que === 'el-sitio') {
    const r = elCommitAnterior(git('log', '--format=%H %ci %s', '--', 'publicar/'), pedido.hasta);
    if (r.error) { decir('### No se restauró nada\n\n' + r.error); process.exit(1); }
    git('checkout', r.commit.sha, '--', 'publicar/');
    salida('commit', r.commit.sha);
    salida('desde', (r.ahora && r.ahora.sha) || '');
    decir(informe({ que: 'el-sitio', desde: (r.ahora && r.ahora.sha) || '', hasta: r.commit.sha, comercio,
                    nota: '_De ese commit: ' + r.commit.que + '_' }));
    return;
  }

  const actual = (() => { try { return 'v' + JSON.parse(readFileSync('package.json', 'utf8')).version; } catch (e) { return ''; } })();
  let version = pedido.hasta;
  if (!version) {
    const etiquetas = String(process.env.ETIQUETAS || '').split(/\s+/).filter(Boolean);
    const r = laVersionAnterior(etiquetas, actual);
    if (r.error) { decir('### No se restauró nada\n\n' + r.error); process.exit(1); }
    version = r.version;
  }
  salida('version', version);
  salida('desde', actual);
  decir(informe({ que: 'la-version', desde: actual, hasta: version, comercio }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
