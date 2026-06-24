import { config } from "dotenv";
import path from "path";

let envLoaded = false;

export function ensureServerEnv(): void {
  if (envLoaded) return;
  envLoaded = true;

  let dir = __dirname;
  for (let i = 0; i < 3; i++) {
    dir = path.dirname(dir);
  }

  const envPath = path.resolve(dir, ".env");
  config({ path: envPath });
}
