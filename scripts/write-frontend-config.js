const fs = require('node:fs');
const path = require('node:path');

const apiUrl = process.env.ARTIFY_API_URL || '';
const outputPath = path.join(
  __dirname,
  '..',
  'frontend',
  'assets',
  'js',
  'config.js'
);

const contenido = `// Configuración generada para despliegue.
window.ARTIFY_API_URL = ${JSON.stringify(apiUrl)};
`;

fs.writeFileSync(outputPath, contenido, 'utf8');
console.log(`Configuración frontend generada en ${outputPath}`);
