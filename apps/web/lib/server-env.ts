import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const ROOT_ENV_PATH = ".env";
const WORKSPACE_PACKAGE_PATH = "apps/web/package.json";
const ROOT_PACKAGE_PATH = "package.json";
const MAX_PARENT_DEPTH = 3;

let envLoaded = false;

function isMonorepoRoot(directoryPath: string): boolean {
  return (
    fs.existsSync(path.join(directoryPath, ROOT_PACKAGE_PATH)) &&
    fs.existsSync(path.join(directoryPath, WORKSPACE_PACKAGE_PATH))
  );
}

function resolveEnvRoot(startDirectoryPath: string): string {
  let currentDirectoryPath = startDirectoryPath;

  for (let depth = 0; depth <= MAX_PARENT_DEPTH; depth += 1) {
    if (isMonorepoRoot(currentDirectoryPath)) {
      return currentDirectoryPath;
    }

    currentDirectoryPath = path.resolve(currentDirectoryPath, "..");
  }

  return startDirectoryPath;
}

export function ensureServerEnv(): void {
  if (envLoaded) {
    return;
  }

  const envRootPath = resolveEnvRoot(process.cwd());
  const envFilePath = path.join(envRootPath, ROOT_ENV_PATH);

  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath, override: true });
  }

  envLoaded = true;
}
