const fs = require('fs');
const path = 'D:/--- Proyetos WEB ----/FRV---Catacaos---Carta-Pedidos/src/views/panel-bar.html';
let content = fs.readFileSync(path, 'utf8');

const styleRegex = /<style>([\s\S]*?)<\/style>/;
const match = content.match(styleRegex);

if (!match) {
  console.log('No se encontró CSS');
  process.exit(1);
}

const css = match[1];
const lines = css.split('\n');

let errors = [];
let inComment = false;

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  // Detectar /* comentarios no cerrados */
  if (line.includes('/*')) inComment = true;
  if (line.includes('*/')) inComment = false;
  
  // Buscar propiedades sin valor o con llaves mal formadas dentro de selectores
  if (!inComment && line.trim().length > 0) {
    // Limpiar comentarios en línea
    let cleanLine = line.replace(/\/\*.*?\*\//g, '').trim();
    
    // Si la línea termina con : pero no es parte de un selector o media query
    if (cleanLine.endsWith(':') && !cleanLine.includes('{') && !cleanLine.includes('}')) {
      errors.push(`Línea ${lineNum}: propiedad sin valor`);
    }
    
    // Si hay { pero falta el selector antes
    if (cleanLine.includes('{') && !cleanLine.includes('}')) {
      const beforeBrace = cleanLine.substring(0, cleanLine.indexOf('{')).trim();
      if (beforeBrace.length === 0 || beforeBrace === '&') {
        // Esto puede ser normal en CSS anidado (SCSS)
      }
    }
  }
});

if (errors.length > 0) {
  console.log('Errores encontrados:');
  errors.forEach(e => console.log('  ' + e));
} else {
  console.log('✓ No se encontraron errores de sintaxis CSS evidentes');
}

// Verificar que los @font-face o @import estén correctos
const hasFontFace = css.includes('@font-face');
console.log('Tiene @font-face:', hasFontFace ? 'Sí' : 'No (usando Google Fonts)');

const imports = (css.match(/@import/g) || []).length;
console.log('@import encontrados:', imports);

// Verificar media queries
const mediaQueries = (css.match(/@media/g) || []).length;
console.log('@media queries:', mediaQueries);

// Verificar si usa grid o flexbox (moderno)
const hasGrid = css.includes('display: grid') || css.includes('grid-template');
console.log('Usa CSS Grid:', hasGrid ? 'Sí' : 'No');

const hasFlex = css.includes('display: flex') || css.includes('flex:');
console.log('Usa Flexbox:', hasFlex ? 'Sí' : 'No');
