import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/db";
import { sql } from "drizzle-orm";

async function test() {
  try {
    const result = await db.execute(sql`SELECT current_user, current_database()`);
    console.log("✅ DB connected:", result);
    
    // Try the exact query that fails
    const users = await db.execute(sql`SELECT count(*) FROM users`);
    console.log("✅ Users table:", users);
  } catch (e: any) {
    console.error("❌", e.message);
    console.error("Cause:", e.cause?.message);
  }
  process.exit(0);
}

test();
