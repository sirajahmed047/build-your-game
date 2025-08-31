#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Interactive Story Generator Setup...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
  },
  {
    name: 'Next.js config exists',
    check: () => fs.existsSync('next.config.js'),
  },
  {
    name: 'TypeScript config exists',
    check: () => fs.existsSync('tsconfig.json'),
  },
  {
    name: 'Tailwind config exists',
    check: () => fs.existsSync('tailwind.config.ts'),
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('.env.example'),
  },
  {
    name: 'Environment local exists',
    check: () => fs.existsSync('.env.local'),
  },
  {
    name: 'Supabase client exists',
    check: () => fs.existsSync('src/lib/supabase/client.ts'),
  },
  {
    name: 'Database types exist',
    check: () => fs.existsSync('src/types/database.ts'),
  },
  {
    name: 'Story types exist',
    check: () => fs.existsSync('src/types/story.ts'),
  },
  {
    name: 'Auth provider exists',
    check: () => fs.existsSync('src/components/auth/AuthProvider.tsx'),
  },
  {
    name: 'Database migration exists',
    check: () => fs.existsSync('supabase/migrations/001_initial_schema.sql'),
  },
  {
    name: 'Edge function exists',
    check: () => fs.existsSync('supabase/functions/test-rls/index.ts'),
  },
  {
    name: 'Session utilities exist',
    check: () => fs.existsSync('src/lib/utils/session.ts'),
  },
  {
    name: 'Test page exists',
    check: () => fs.existsSync('src/app/test/page.tsx'),
  },
  {
    name: 'README exists',
    check: () => fs.existsSync('README.md'),
  },
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  const result = check();
  if (result) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 All setup checks passed!');
  console.log('\nNext steps:');
  console.log('1. Update .env.local with your actual Supabase credentials');
  console.log('2. Run the database migration in your Supabase SQL editor');
  console.log('3. Start the development server with: npm run dev');
  console.log('4. Visit http://localhost:3000/test to verify database connection');
} else {
  console.log('\n⚠️  Some setup checks failed. Please review the missing files.');
  process.exit(1);
}