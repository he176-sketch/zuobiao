import { cp, mkdir, rm } from "node:fs/promises";
const output = new URL("../.wrangler/pages-dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ["_worker.js", "_routes.json"]) {
  await cp(new URL(`../deploy/pages/${name}`, import.meta.url), new URL(name, output));
}
console.log("Prepared Pages gateway: two deployment files, no secrets or site records.");
