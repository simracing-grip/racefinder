import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// lib/listings.ts queries this directly — DATABASE_URL (Settings > Database
// > Connection string, "Transaction" pooler, in .env) is the primary source
// of listings; without it the site serves the bundled snapshot instead.
const connectionString = process.env.DATABASE_URL;

// connect_timeout: postgres-js waits 30s by default before giving up on an
// unreachable host, which would stall every cold page render that long
// before lib/listings.ts falls back to its bundled snapshot.
export const db = connectionString
  ? drizzle(postgres(connectionString, { prepare: false, connect_timeout: 8 }), { schema })
  : (null as unknown as ReturnType<typeof drizzle>);
