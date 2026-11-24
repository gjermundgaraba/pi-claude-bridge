import { registerHooks } from "node:module";

const dist = new URL("../dist/", import.meta.url).href;
const loaded = new Set<string>();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.startsWith(dist) === true &&
      !/^(?:\.|node:|@earendil-works\/pi-ai(?:\/|$))/u.test(specifier)
    ) {
      loaded.add(specifier);
    }

    return nextResolve(specifier, context);
  },
});

await import(new URL("host.mjs", dist).href);

if (loaded.size > 0) {
  throw new Error(
    `the host entry loaded ${[...loaded].join(", ")} at startup, which only pi-ai may be`
  );
}
