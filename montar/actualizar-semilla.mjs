/* ═══════════════════════════════════════════════════════════════════════════
   TRAER LA VERSIÓN NUEVA DE LA SEMILLA (0.14.0)
   ---------------------------------------------------------------------------
   Lo corre el flujo `montaje` cuando se le pide `semilla: true` —desde el
   panel, el menú de la hoja o la flota—. Deja los archivos de la semilla
   escritos en la carpeta de la tienda y NO hace commit: el mismo montaje
   publica el maestro, rehornea desde la hoja, corre TODAS las baterías y solo
   entonces publica todo junto en main. Si algo falla, no se publica nada.

     node montar/actualizar-semilla.mjs

   Lee semilla.json (qué es de la semilla y dónde vive). Variables:
     SEMILLA_TOKEN   para leer la semilla si es privada y para poder traer los
                     flujos (.github/workflows). Sin él, se intenta sin
                     credenciales y los flujos quedan pendientes.
     VERSION         la versión a traer (vacío = la última etiqueta vX.Y.Z).
     SIN_BASE        'sobrescribir' para pisar lo distinto cuando no se sabe
                     de qué versión salió la tienda (de fábrica, no se toca).
   Escribe en GITHUB_OUTPUT: cambio (si/no), maestro (si/no), desde, hasta.
   ═══════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { aplicar, ultimaEtiqueta, comparar, version, informeEnTexto } from './semilla.mjs';

/* Lo que escribe: los archivos que semilla.json declara de la semilla (A-8). */
export const ESCRIBE = ['semilla.json › propios'];

const TOKEN = process.env.SEMILLA_TOKEN || '';
const ORIGEN = process.env.SEMILLA_ORIGEN || '';          // solo las pruebas: repositorios en disco
const decir = t => { console.log(t); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + '\n'); };
const salida = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, k + '=' + v + '\n'); };
const tapar = e => String(e && (e.stderr || e.message) || e).split(TOKEN || '\u0000').join('***');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

function url(repo) {
  if (ORIGEN) return join(ORIGEN, repo);
  return TOKEN ? `https://x-access-token:${TOKEN}@github.com/${repo}.git` : `https://github.com/${repo}.git`;
}

/* Las salidas se escriben UNA vez, al final: una clave repetida en
   GITHUB_OUTPUT es una apuesta sobre cuál gana. */
export function principal(dir = process.cwd()) {
  const r = trabajar(dir);
  salida('cambio', r.cambia ? 'si' : 'no');
  salida('maestro', r.cambia && (r.escritos || []).includes('maestro.gs') ? 'si' : 'no');
  salida('desde', r.desde || ''); salida('hasta', r.hasta || '');
  return r;
}

function trabajar(dir) {
  const conf = JSON.parse(readFileSync(join(dir, 'semilla.json'), 'utf8'));
  const aqui = String(process.env.GITHUB_REPOSITORY || '').toLowerCase();
  if (aqui && aqui === String(conf.repositorio).toLowerCase()) {
    decir('### La semilla\n\nEste repositorio ES la semilla: no hay versión nueva que traer.');
    return { cambia: false, esSemilla: true };
  }
  const desde = (() => { try { return String(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version || ''); } catch { return ''; } })();

  const trabajo = mkdtempSync(join(tmpdir(), 'semilla-'));
  const semilla = join(trabajo, 'semilla');
  try {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', url(conf.repositorio), semilla], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    decir('### No pude leer la semilla\n\n`' + conf.repositorio + '`: ' + tapar(e).split('\n')[0] +
          '\n\nSi la semilla es privada, esta tienda necesita el secreto `SEMILLA_TOKEN` (docs/ACTUALIZAR-UNA-TIENDA.md).');
    throw new Error('sin acceso a la semilla');
  }
  const etiquetas = git(semilla, 'tag', '-l', 'v*').split('\n').filter(Boolean);
  const pedida = String(process.env.VERSION || '').trim().replace(/^v/, '');
  const hasta = pedida ? 'v' + pedida : ultimaEtiqueta(etiquetas);
  if (!hasta || !etiquetas.includes(hasta)) {
    decir(`### La semilla no tiene la versión ${hasta || '(ninguna)'}\n\nSolo se traen versiones publicadas con **release**.`);
    throw new Error('sin esa versión');
  }
  /* 0.18.0 · VOLVER ATRÁS ES PEDIR UNA VERSIÓN EXACTA. Sin versión pedida,
     «la última» nunca es anterior a la de la tienda y esto es lo de siempre:
     no hay nada que traer. Con una versión escrita —que es lo que hace el
     flujo `restaurar`— sí se trae, aunque sea anterior: pedir una versión
     exacta es decir A CUÁL, y negarse ahí dejaría una tienda rota sin más
     salida que editarle los archivos a mano. */
  if (version(desde) && comparar(desde, hasta) >= 0) {
    if (!pedida || comparar(desde, hasta) === 0) {
      decir(`### La semilla\n\nEsta tienda ya está en la ${desde}, la ${pedida ? 'pedida' : 'última publicada'} es ${hasta}. Nada que traer.`);
      return { cambia: false, desde, hasta };
    }
    decir(`### Volver atrás\n\nEsta tienda está en la ${desde} y se pidió la ${hasta}, que es ANTERIOR. Se trae: una versión escrita a mano es decir a cuál.`);
  }
  const nuevaDir = join(trabajo, 'nueva');
  git(semilla, 'worktree', 'add', '--quiet', '--detach', nuevaDir, hasta);
  let baseDir = null;
  const base = desde ? 'v' + desde.replace(/^v/, '') : '';
  if (base && etiquetas.includes(base)) {
    baseDir = join(trabajo, 'base');
    git(semilla, 'worktree', 'add', '--quiet', '--detach', baseDir, base);
  }
  /* Lo que es de la semilla lo dice la versión NUEVA: una versión puede traer
     un archivo propio más. */
  const nuevaConf = existsSync(join(nuevaDir, 'semilla.json'))
    ? JSON.parse(readFileSync(join(nuevaDir, 'semilla.json'), 'utf8')) : conf;
  const informe = aplicar({
    tiendaDir: dir, nuevaDir, baseDir, propios: nuevaConf.propios, version: hasta,
    sinBase: process.env.SIN_BASE === 'sobrescribir' ? 'sobrescribir' : 'dejar',
    /* Empujar un flujo necesita un permiso que el GITHUB_TOKEN de Actions no
       tiene nunca. Sin SEMILLA_TOKEN, los flujos se quedan como están. */
    excluir: TOKEN || ORIGEN ? [] : ['.github/workflows/']
  });
  decir(informeEnTexto({ desde, hasta, informe }));
  return Object.assign({ desde, hasta }, informe);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { principal(); } catch (e) { console.error(tapar(e)); process.exit(1); }
}
