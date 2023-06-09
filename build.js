const fs = require('fs');
const path = require('path');
const uglify = require('uglify-js');

const toMinify = [
  'index.js',
  './utils/color.js',
  './utils/ui.js',
  './utils/validation.js',
  './utils/cryptography.js',
  './utils/serverEvents.js',
  './utils/socketEvents.js',
];

const outputDir = path.join(__dirname, 'build');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

if (!fs.existsSync( path.join(__dirname, 'build/utils'))) {
  fs.mkdirSync( path.join(__dirname, 'build/utils'));
}

toMinify.forEach((file) => {
  const inputFile = fs.readFileSync(file, 'utf8');
  const minified = uglify.minify(inputFile);

  if (file === 'index.js') {
    file = 'cryptic.js';
  }

  fs.writeFileSync(path.join(outputDir, file), minified.code);
});

