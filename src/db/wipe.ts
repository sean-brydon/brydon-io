import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

async function wipe() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("✅ Wiped");
  await sql.end();
}

wipe().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
