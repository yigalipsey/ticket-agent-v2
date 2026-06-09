import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const DRIZZLE = "DRIZZLE" as const;

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const databaseUrl = configService.getOrThrow<string>("DATABASE_URL");
    const pool = postgres(databaseUrl, { max: 10 });

    try {
      await pool`SELECT 1`;
      console.log("Database connection established successfully.");
    } catch (error) {
      console.error("Failed to connect to the database during startup:", error);
      throw error;
    }

    return drizzle(pool, { schema });
  },
};
