const fs = require('fs');
const path = require('path');

// Fix dollar quoting in migration files more thoroughly
const migrationDir = 'supabase/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  const filePath = path.join(migrationDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all variations of dollar quoting
  content = content.replace(/AS \$\s*\n/g, 'AS $$\n');
  content = content.replace(/AS \$\s*$/gm, 'AS $$');
  content = content.replace(/\nEND;\n\$ LANGUAGE/g, '\nEND;\n$$ LANGUAGE');
  content = content.replace(/END;\s*\$ LANGUAGE/g, 'END;\n$$ LANGUAGE');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All migration files fixed!');