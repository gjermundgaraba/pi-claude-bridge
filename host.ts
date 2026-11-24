import type { Provider } from "@earendil-works/pi-ai";

import { lazyProvider } from "./catalog-provider.js";

/** The claude-bridge provider for pi-ai hosts outside pi's session; see docs/behavior.md, "Other hosts". */
export const createClaudeBridgeProvider = (): Provider =>
  lazyProvider(async () => {
    const [{ query }, { recordStream }, { hostTurns }] = await Promise.all([
      import("@anthropic-ai/claude-agent-sdk"),
      import("./child.js"),
      import("./provider.js"),
    ]);

    return hostTurns(recordStream(query));
  });
