import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

/**
 * PlanetScale Postgres connection via postgres.js driver.
 * 
 * In Next.js, DATABASE_URL is loaded from .env.local automatically.
 * In scripts (seed, wipe), dotenv must be loaded BEFORE this file is imported.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. For scripts, load dotenv before importing @/db.");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export { schema };
