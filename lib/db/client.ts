import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// lib/listings.ts queries this directly — DATABASE_URL (Settings > Database
// > Connection string, "Transaction" pooler, in .env) is required, not
// optional, for the site to serve any listings.
const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? drizzle(postgres(connectionString, { prepare: false }), { schema })
  : (null as unknown as ReturnType<typeof drizzle>);
