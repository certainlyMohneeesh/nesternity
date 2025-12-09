#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'src', 'generated');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/from ['"]\.\/([^'"]+)\.js['"]/g, "from './$1'");
  content = content.replace(/import ['"]\.\/([^'"]+)\.js['"]/g, "import './$1'");
  content = content.replace(/export \* as \$Enums from ['"]\.\/enums\.js['"]/g, "export * as $Enums from './enums'");
  content = content.replace(/export \* from ['"]\.\/enums\.js['"]/g, "export * from './enums'");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed imports in: ${path.basename(filePath)}`);
}

const clientFile = path.join(generatedDir, 'client.ts');
if (fs.existsSync(clientFile)) {
  fixImports(clientFile);
  console.log('✅ Prisma client imports fixed!');
} else {
  console.log('❌ client.ts not found');
}
