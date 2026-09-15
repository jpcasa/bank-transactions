import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../app.js";
import { createDb } from "../db/client.js";
import { packageRoot } from "../paths.js";

// postgres.js connects lazily; this db is never queried.
const db = createDb("postgres://unused:unused@127.0.0.1:1/unused");
const res = await createApp(db).request("/openapi.json");
const out = join(packageRoot(), "openapi.json");
writeFileSync(out, JSON.stringify(await res.json(), null, 2) + "\n");
await db.close();
console.log(`Wrote ${out}`);
