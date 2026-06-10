import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as supertest, type SuperTest, type Test as SupertestTest } from 'supertest';
import { AppModule } from '../../src/app.module';
import { DRIZZLE } from '../../src/db/drizzle.provider';
import type * as schema from '../../src/db/schema';
import helmet from 'helmet';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

let app: INestApplication;
let db: DrizzleDb;
let agent: SuperTest<SupertestTest>;

export async function initApp(): Promise<void> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  db = app.get<DrizzleDb>(DRIZZLE);
  agent = supertest(app.getHttpServer());
}

export async function closeApp(): Promise<void> {
  await app.close();
}

export function getAgent(): SuperTest<SupertestTest> {
  return agent;
}

export function getDb(): DrizzleDb {
  return db;
}

export async function truncateTables(): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE teams, competitions, venues, cities, countries RESTART IDENTITY CASCADE`,
  );
}

