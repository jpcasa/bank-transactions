import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createApp } from "./app.js";
import { createDb } from "./db/client.js";
import { migrationsFolder } from "./paths.js";
import { seed } from "./seed/seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const port = Number(process.env.PORT ?? 8787);

const db = createDb(databaseUrl);
await migrate(db, { migrationsFolder: migrationsFolder() });
if (process.env.SEED !== "false") await seed(db);

serve({ fetch: createApp(db).fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port} (docs at /docs)`);
});
