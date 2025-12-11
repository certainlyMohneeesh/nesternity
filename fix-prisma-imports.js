#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'src', 'generated');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove .js extensions from relative imports
  const newContent = content
    .replace(/from ['"]\.\/([^'"]+)\.js['"]/g, (match, p1) => {
      modified = true;
      return `from './${p1}'`;
    })
    .replace(/from ['"]\.\.\/([^'"]+)\.js['"]/g, (match, p1) => {
      modified = true;
      return `from '../${p1}'`;
    })
    .replace(/import ['"]\.\/([^'"]+)\.js['"]/g, (match, p1) => {
      modified = true;
      return `import './${p1}'`;
    })
    .replace(/export \* as \$Enums from ['"]\.\/enums\.js['"]/g, () => {
      modified = true;
      return "export * as $Enums from './enums'";
    })
    .replace(/export \* from ['"]\.\/enums\.js['"]/g, () => {
      modified = true;
      return "export * from './enums'";
    });
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed imports in: ${path.relative(__dirname, filePath)}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      fixImports(fullPath);
    }
  }
}

if (fs.existsSync(generatedDir)) {
  console.log('🔧 Fixing Prisma imports for Turbopack compatibility...');
  processDirectory(generatedDir);
  console.log('✅ All Prisma imports fixed!');
} else {
  console.log('❌ Generated directory not found');
  process.exit(1);
}
