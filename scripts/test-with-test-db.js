const { execSync } = require("node:child_process");

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const runtimeDatabaseUrl = process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  console.error("Missing TEST_DATABASE_URL. Refusing to run tests against DATABASE_URL.");
  process.exit(1);
}

if (runtimeDatabaseUrl && runtimeDatabaseUrl === testDatabaseUrl) {
  console.error("TEST_DATABASE_URL must be different from DATABASE_URL.");
  process.exit(1);
}

let databaseName = "";
try {
  databaseName = new URL(testDatabaseUrl).pathname.replace(/^\/+/, "");
} catch {
  console.error("Invalid TEST_DATABASE_URL.");
  process.exit(1);
}

if (!/test/i.test(databaseName)) {
  console.error(`Unsafe TEST_DATABASE_URL database name: "${databaseName}". Expected a test database.`);
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testDatabaseUrl };

execSync("npx prisma db push --skip-generate", { stdio: "inherit", env });
execSync("npx vitest run", { stdio: "inherit", env });
