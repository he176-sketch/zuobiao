import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const branch = process.argv[2];
if (!branch || !/^[a-zA-Z0-9/_-]+$/.test(branch)) throw new Error("Specify the Pages deployment branch.");
const root = fileURLToPath(new URL("../", import.meta.url));
const git = (...args) => {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error("Unable to identify source revision.");
  return result.stdout.trim();
};
const sha = git("rev-parse", "--verify", "HEAD");
const dirty = Boolean(git("status", "--porcelain"));
if (branch === "main" && dirty) throw new Error("Production deployment requires a clean, committed source.");
await import("./prepare-pages.mjs");
const stage = await mkdtemp(join(tmpdir(), "zuobiao-pages-"));
try {
  // Isolate Pages config from Vinext's generated .wrangler/deploy redirect.
  const config = JSON.parse(await readFile(new URL("../deploy/pages/wrangler.json", import.meta.url), "utf8"));
  delete config.$schema;
  config.pages_build_output_dir = "./site";
  await writeFile(join(stage, "wrangler.json"), JSON.stringify(config));
  await cp(new URL("../.wrangler/pages-dist/", import.meta.url), join(stage, "site"), { recursive: true });
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)),
    "pages", "deploy", "--no-bundle", "--project-name", config.name, "--branch", branch,
    "--commit-hash", sha, `--commit-dirty=${dirty}`,
    "--commit-message", "Run complete Zuobiao application on Pages",
  ], { cwd: stage, stdio: "inherit", timeout: 240_000,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: "<your-account-id>" },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(stage, { recursive: true, force: true });
}
