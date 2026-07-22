// Runs the given command with DATABASE_URL overridden to TEST_DATABASE_URL -
// a plain `cross-env DATABASE_URL=$TEST_DATABASE_URL` doesn't work
// cross-platform (no shell variable expansion), so this does it in Node.
import { spawnSync } from 'node:child_process';

const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  console.error(
    'TEST_DATABASE_URL nie je nastavený. Potrebuje samostatnú PostgreSQL databázu pre e2e testy ' +
      '(napr. druhý bezplatný Supabase projekt) - nepoužívajte tú istú DB ako dev/produkcia.',
  );
  process.exit(1);
}

const [cmd, ...args] = process.argv.slice(2);
const result = spawnSync(cmd, args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: testDbUrl },
});
process.exit(result.status ?? 1);
