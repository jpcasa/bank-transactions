import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Package root (apps/api), resolvable from both src/ and dist/. */
export function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("package root not found");
    dir = parent;
  }
  return dir;
}

export const migrationsFolder = () => join(packageRoot(), "drizzle");
export const seedCsvPath = () => process.env.SEED_CSV_PATH ?? join(packageRoot(), "data", "transactions.csv");
