import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(databaseUrl, { ssl: 'require' });

  try {
    console.log('Altering teams table to add is_national_team...');
    await sql`ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "is_national_team" boolean DEFAULT false;`;
    console.log('Teams table successfully updated!');
  } catch (error) {
    console.error('Failed to run query:', error);
  } finally {
    await sql.end();
  }
}

run();
