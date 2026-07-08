/**
 * Seed script: Tạo test user trong Firestore `users` collection.
 *
 * Usage:
 *   npx tsx scripts/create-test-user.ts
 *   npx tsx scripts/create-test-user.ts <email> <password> <name>
 *
 * Examples:
 *   npx tsx scripts/create-test-user.ts
 *   npx tsx scripts/create-test-user.ts test@example.com mypass123 "Test User"
 *
 * Alternatively, use the API route:
 *   POST /api/seed/create-test-user
 *   (see src/app/api/seed/create-test-user/route.ts)
 */
import { loadEnvConfig } from '@next/env';
import { createUser } from '../src/lib/users';

loadEnvConfig(process.cwd());

async function main() {
  const email = process.argv[2] ?? 'admin@claudecode.ai';
  const password = process.argv[3] ?? '123456789';
  const name = process.argv[4] ?? 'Admin User';

  console.log(`Creating user: ${email}`);
  const user = await createUser({ email, name, password });
  console.log(`✅ User created successfully!`);
  console.log(`   UID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Login with: ${email} / ${password}`);
}

main().catch((err) => {
  console.error('❌ Failed to create user:', err.message);
  process.exit(1);
});
