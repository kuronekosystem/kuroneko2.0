const fs = require('node:fs');
const path = require('node:path');

const expectedBaseHref = '<base href="/kuroneko2.0/">';
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');

function findOutputDirectory() {
  const preferred = [
    path.join(distRoot, 'kuroneko2.0', 'browser'),
    path.join(distRoot, 'kuroneko2.0')
  ];

  for (const candidate of preferred) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return findDirectoryWithIndex(distRoot);
}

function findDirectoryWithIndex(directory) {
  if (!fs.existsSync(directory)) return null;

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  if (entries.some(entry => entry.isFile() && entry.name === 'index.html')) {
    return directory;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const found = findDirectoryWithIndex(path.join(directory, entry.name));
    if (found) return found;
  }

  return null;
}

const outputDirectory = findOutputDirectory();

if (!outputDirectory) {
  throw new Error('[gh-pages] No se encontro index.html dentro de dist/. Ejecuta el build primero.');
}

const indexPath = path.join(outputDirectory, 'index.html');
const fallbackPath = path.join(outputDirectory, '404.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

if (!indexHtml.includes(expectedBaseHref)) {
  throw new Error(`[gh-pages] index.html no contiene ${expectedBaseHref}`);
}

fs.copyFileSync(indexPath, fallbackPath);

console.log(`[gh-pages] Copiado index.html -> 404.html en ${path.relative(projectRoot, outputDirectory)}`);
