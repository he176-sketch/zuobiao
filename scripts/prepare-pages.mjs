import { cp, mkdir, readdir, rm } from "node:fs/promises";
const output = new URL("../.wrangler/pages-dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(new URL("_worker.js/app/", output), { recursive: true });
const source = new URL("../dist/server/", import.meta.url);
async function copyModules(from, to) {
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), from);
    const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), to);
    if (entry.isDirectory()) { await mkdir(target, { recursive: true }); await copyModules(child, target); }
    else if (/\.(?:js|mjs)$/.test(entry.name)) await cp(child, target);
  }
}
await copyModules(source, new URL("_worker.js/app/", output));
await cp(new URL("../deploy/pages/_worker.js", import.meta.url), new URL("_worker.js/index.js", output));
await cp(new URL("../deploy/pages/handler.mjs", import.meta.url), new URL("_worker.js/handler.mjs", output));
await cp(new URL("../deploy/pages/_routes.json", import.meta.url), new URL("_routes.json", output));
for (const name of ["_next", "knowledge", "favicon.svg", "_headers"]) {
  await cp(new URL(`../dist/client/${name}`, import.meta.url), new URL(name, output), { recursive: true });
}
console.log("Prepared standalone Pages application, static resources and API modules.");
