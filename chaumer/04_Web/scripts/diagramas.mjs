/**
 * diagramas.mjs — dibuja los diagramas del plan a SVG, en la compilacion.
 *
 * Los documentos traen los diagramas escritos en mermaid. En vez de mandar
 * la libreria al navegador (casi un mega para dos dibujos), se renderizan
 * aqui una vez y se pegan como SVG en linea. El navegador no descarga nada.
 *
 * Se guarda cada uno por el hash de su codigo, asi que si el diagrama no
 * cambia no se vuelve a dibujar: la compilacion sigue siendo rapida.
 *
 * Los colores salen de los tokens del portal. Un diagrama con el tema por
 * defecto de mermaid se ve pegado con cola.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// En Windows, execFileSync sobre un .cmd falla con EINVAL. Se llama al
// renderizador directamente con el mismo Node que ejecuta este script.
const MMDC = path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js');

const AQUI = process.cwd();
const CONTENIDO = path.join(AQUI, 'src', 'content');
// Fuera de src/content/: el sync limpia esa carpeta en cada compilacion y
// se perderia el cache, obligando a redibujar cada vez.
const SALIDA = path.join(AQUI, '.diagramas');
const TMP = path.join(AQUI, 'node_modules', '.cache', 'mermaid');

// Tema alineado con tokens.css. Si cambian los tokens, se cambia aqui.
const TEMA = {
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: '#0F1218',
    primaryColor: '#151A23',
    primaryTextColor: '#F2F5F9',
    primaryBorderColor: '#333B4B',
    lineColor: '#8790A1',
    secondaryColor: '#1B2A45',
    tertiaryColor: '#13171F',
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
    fontSize: '15px',
    nodeBorder: '#333B4B',
    clusterBkg: '#0F1218',
    titleColor: '#F2F5F9',
    edgeLabelBackground: '#0F1218',
  },
  flowchart: { curve: 'basis', nodeSpacing: 45, rankSpacing: 55, useMaxWidth: true },
  themeCSS: `
    .edgeLabel { fill: #A8B0BF; color: #A8B0BF; }
    .edgeLabel rect { fill: #0F1218; opacity: 0.92; }
    .nodeLabel, .label { color: #F2F5F9; }
    .node rect, .node polygon, .node circle { stroke-width: 1px; }
  `,
};

/** Todos los bloques mermaid de los documentos sincronizados. */
function bloques() {
  const encontrados = [];
  const dirs = [path.join(CONTENIDO, 'plan'), path.join(CONTENIDO, 'subfases')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/\.md$/i.test(f)) continue;
      const texto = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of texto.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
        encontrados.push({ archivo: f, codigo: m[1].trim() });
      }
    }
  }
  return encontrados;
}

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/** Deja el SVG listo para pegarlo en linea: sin cabecera XML, sin ancho fijo. */
function limpiar(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
    .replace(/\swidth="[^"]*"/, ' width="100%"')
    .replace(/\sheight="[^"]*"/, '')
    .replace(/style="max-width:[^"]*"/g, 'style="max-width:100%;height:auto"');
}

fs.mkdirSync(SALIDA, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const cfg = path.join(TMP, 'tema.json');
fs.writeFileSync(cfg, JSON.stringify(TEMA), 'utf8');

const todos = bloques();
const vistos = new Set();
let dibujados = 0, reutilizados = 0;

for (const b of todos) {
  const h = hash(b.codigo);
  if (vistos.has(h)) { reutilizados++; continue; }
  vistos.add(h);

  const destino = path.join(SALIDA, h + '.svg');
  if (fs.existsSync(destino)) { reutilizados++; continue; }

  const entrada = path.join(TMP, h + '.mmd');
  const bruto = path.join(TMP, h + '.svg');
  fs.writeFileSync(entrada, b.codigo, 'utf8');

  try {
    execFileSync(process.execPath,
      [MMDC, '-i', entrada, '-o', bruto, '-c', cfg, '-b', 'transparent', '-q'],
      { stdio: 'pipe', cwd: AQUI });
    fs.writeFileSync(destino, limpiar(fs.readFileSync(bruto, 'utf8')), 'utf8');
    dibujados++;
  } catch (e) {
    // Un diagrama que no compila no debe tumbar la web: se avisa y el
    // renderizador de markdown mostrara el codigo, que es mejor que nada.
    console.log('  AVISO: no se pudo dibujar un diagrama de ' + b.archivo);
    console.log('  ' + String(e.stderr || e.message).split('\n')[0]);
  }
}

console.log('diagramas');
console.log('  bloques encontrados  ' + todos.length + ' (' + vistos.size + ' distintos)');
console.log('  dibujados ahora      ' + dibujados);
console.log('  ya estaban           ' + reutilizados);
