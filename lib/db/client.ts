import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Not used yet — lib/listings.ts currently reads placeholder data.
// Once a Supabase project exists, set DATABASE_URL (Settings > Database >
// Connection string, "Transaction" pooler) in .env.local and switch
// lib/listings.ts over to query `db` instead.
const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? drizzle(postgres(connectionString, { prepare: false }), { schema })
  : (null as unknown as ReturnType<typeof drizzle>);
