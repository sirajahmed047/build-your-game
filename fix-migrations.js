const fs = require('fs');
const path = require('path');

// Fix dollar quoting in migration files
const migrationDir = 'supabase/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  const filePath = path.join(migrationDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix single dollar signs to double dollar signs for function bodies
  content = content.replace(/AS \$\n/g, 'AS $$\n');
  content = content.replace(/\nEND;\n\$ LANGUAGE/g, '\nEND;\n$$ LANGUAGE');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All migration files fixed!');