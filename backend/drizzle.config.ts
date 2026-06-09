import * as dotenv from 'dotenv';
import { resolve } from 'path';
import type { Config } from 'drizzle-kit';

dotenv.config({ path: resolve(__dirname, '.env') });

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] as string,
  },
} satisfies Config;
