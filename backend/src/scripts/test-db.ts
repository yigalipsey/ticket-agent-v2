import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function run() {
  console.log("DB URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
  try {
    console.log("Running select 1...");
    const res = await sql`SELECT 1`;
    console.log("Result:", res);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await sql.end();
    console.log("Closed.");
  }
}
run();
