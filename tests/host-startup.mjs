import { registerHooks } from "node:module";

const TURN_ONLY =
  /^(?:@anthropic-ai\/claude-agent-sdk|@modelcontextprotocol\/|typebox|xstate|cc-session-io)/u;

const loaded = new Set();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (TURN_ONLY.test(specifier)) {
      loaded.add(specifier);
    }

    return nextResolve(specifier, context);
  },
});

const { createClaudeBridgeProvider } = await import("../dist/host.mjs");
const provider = createClaudeBridgeProvider();

if (provider.getModels().length === 0 || provider.auth.oauth === undefined) {
  throw new Error("the host provider has no models or no Claude sign-in");
}

if (loaded.size > 0) {
  throw new Error(`the host entry loaded ${[...loaded].join(", ")} at startup`);
}
