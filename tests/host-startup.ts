import { registerHooks } from "node:module";

import manifest from "../package.json" with { type: "json" };

const turnOnly = [...Object.keys(manifest.dependencies), "typebox"];
const loaded = new Set<string>();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      turnOnly.some(
        (name) => specifier === name || specifier.startsWith(`${name}/`)
      )
    ) {
      loaded.add(specifier);
    }

    return nextResolve(specifier, context);
  },
});

await import(new URL("../dist/host.mjs", import.meta.url).href);

if (loaded.size > 0) {
  throw new Error(`the host entry loaded ${[...loaded].join(", ")} at startup`);
}
