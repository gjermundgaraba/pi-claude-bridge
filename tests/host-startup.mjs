import { registerHooks } from "node:module";

import manifest from "../package.json" with { type: "json" };

const turnOnly = [...Object.keys(manifest.dependencies), "typebox"];
const loaded = new Set();

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

const { createClaudeBridgeProvider } = await import("../dist/host.mjs");

createClaudeBridgeProvider();

if (loaded.size > 0) {
  throw new Error(`the host entry loaded ${[...loaded].join(", ")} at startup`);
}
