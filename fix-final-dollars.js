const fs = require('fs');
const path = require('path');

// Fix remaining single dollar signs
const migrationDir = 'supabase/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  const filePath = path.join(migrationDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix remaining single dollar signs
  content = content.replace(/\$ LANGUAGE/g, '$$ LANGUAGE');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All remaining dollar signs fixed!');