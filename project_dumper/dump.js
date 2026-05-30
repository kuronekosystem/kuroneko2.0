const fs = require('fs');
const path = require('path');

// Archivos específicos que queremos de la raíz (según tu imagen)
const rootAllowedFiles = [
  'angular.json',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'README.md',
  '.gitignore'
];

// Carpetas que ignoramos por completo
const excludedDirs = ['node_modules', '.git', 'project_dumper', '.vscode', '.angular', 'dist'];

// Referencia absoluta a la raíz del proyecto (un nivel arriba de este script)
const projectRoot = path.resolve(__dirname, '..');

/**
 * Determina si un archivo o carpeta debe ser procesado
 */
function shouldInclude(fullPath, isDirectory) {
  const relativePath = path.relative(projectRoot, fullPath);
  const fileName = path.basename(fullPath);

  // 1. Evitar carpetas pesadas o irrelevantes
  if (excludedDirs.some(dir => relativePath === dir || relativePath.startsWith(dir + path.sep))) {
    return false;
  }

  // 2. Lógica para la RAÍZ del proyecto
  if (path.dirname(fullPath) === projectRoot) {
    if (isDirectory) {
      // Solo entramos a carpetas clave
      return ['src', 'public'].includes(fileName);
    }
    // Solo archivos de configuración permitidos
    return rootAllowedFiles.includes(fileName);
  }

  // 3. Si ya estamos dentro de src o public, incluimos todo
  return relativePath.startsWith('src') || relativePath.startsWith('public');
}

function generateTree(dir, prefix = '') {
  const entries = fs.readdirSync(dir).filter(e => {
    const fullPath = path.join(dir, e);
    return shouldInclude(fullPath, fs.statSync(fullPath).isDirectory());
  });

  let tree = '';
  entries.forEach((entry, index) => {
    const fullPath = path.join(dir, entry);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    const isLast = index === entries.length - 1;
    const connector = isLast ? '┗' : '┣';
    const subPrefix = prefix + (isLast ? '   ' : '┃ ');

    tree += `${prefix}${connector} ${isDirectory ? '📂' : '📜'}${entry}\n`;

    if (isDirectory) {
      tree += generateTree(fullPath, subPrefix);
    }
  });
  return tree;
}

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir).filter(e => {
    const fullPath = path.join(dir, e);
    return shouldInclude(fullPath, fs.statSync(fullPath).isDirectory());
  });

  entries.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      // Evitar archivos binarios comunes en assets
      const ext = path.extname(fullPath).toLowerCase();
      const forbiddenExts = ['.png', '.jpg', '.jpeg', '.ico', '.pdf', '.woff', '.woff2'];

      if (!forbiddenExts.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const relPath = path.relative(projectRoot, fullPath);
          fileList.push(`## File: ${relPath}\n\n\`\`\`${ext.slice(1) || 'text'}\n${content}\n\`\`\`\n`);
        } catch (e) {
          // Si falla la lectura (ej. archivo muy grande), se ignora
        }
      }
    }
  });
  return fileList;
}

// --- Ejecución ---
console.log('🔍 Escaneando KURONEKOENGINE...');

const tree = generateTree(projectRoot);
const contents = walk(projectRoot).join('\n');
const finalMarkdown = `# 📁 KURONEKOENGINE Structure\n\n\`\`\`\n${tree}\`\`\`\n\n# 📄 Source Code\n\n${contents}`;

// Guardamos el resultado dentro de la misma carpeta del script
const outputPath = path.join(__dirname, 'project_dump.md');
fs.writeFileSync(outputPath, finalMarkdown);

console.log(`✅ ¡Hecho! El archivo se generó en: ${outputPath}`);
