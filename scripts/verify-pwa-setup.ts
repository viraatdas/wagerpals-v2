import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

console.log('🔍 Verifying PWA and Push Notification Setup...\n');

let hasErrors = false;

// Check 1: VAPID Keys
console.log('1️⃣  Checking VAPID Keys...');
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey) {
  console.error('   ❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
  hasErrors = true;
} else if (!publicKey.startsWith('B')) {
  console.error('   ❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY format looks incorrect');
  hasErrors = true;
} else {
  console.log('   ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY is set');
}

if (!privateKey) {
  console.error('   ❌ VAPID_PRIVATE_KEY is not set');
  hasErrors = true;
} else {
  console.log('   ✅ VAPID_PRIVATE_KEY is set');
}

if (!subject) {
  console.error('   ❌ VAPID_SUBJECT is not set');
  hasErrors = true;
} else if (!subject.includes('mailto:')) {
  console.error('   ❌ VAPID_SUBJECT should start with "mailto:"');
  hasErrors = true;
} else {
  console.log('   ✅ VAPID_SUBJECT is set');
}

// Check 2: Required Files
console.log('\n2️⃣  Checking Required Files...');
const requiredFiles = [
  'public/manifest.json',
  'public/service-worker.js',
  'public/icons/icon-192x192.svg',
  'public/icons/icon-512x512.svg',
  'components/PushNotificationPrompt.tsx',
  'components/InstallPrompt.tsx',
  'components/ServiceWorkerRegistration.tsx',
  'lib/push.ts',
  'app/api/push/subscribe/route.ts',
  'app/api/push/send/route.ts',
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.error(`   ❌ ${file} is missing`);
    hasErrors = true;
  }
});

// Check 3: Database Connection
console.log('\n3️⃣  Checking Database Connection...');
const dbUrl = process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('   ❌ POSTGRES_URL is not set');
  hasErrors = true;
} else {
  console.log('   ✅ POSTGRES_URL is set');
}

// Check 4: Package Dependencies
console.log('\n4️⃣  Checking Dependencies...');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);

if (packageJson.dependencies['web-push']) {
  console.log('   ✅ web-push package installed');
} else {
  console.error('   ❌ web-push package not installed');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Setup has errors! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Your PWA setup is ready!');
  console.log('\nNext steps:');
  console.log('1. Test locally: npm run dev');
  console.log('2. Add environment variables to Vercel');
  console.log('3. Git push and deploy');
  console.log('4. Test on mobile devices');
  console.log('\nSee VERCEL_DEPLOYMENT.md for detailed instructions.');
  process.exit(0);
}

