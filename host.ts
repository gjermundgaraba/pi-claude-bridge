import { query } from "@anthropic-ai/claude-agent-sdk";
import { registerSessionResourceCleanup } from "@earendil-works/pi-ai";
import type { Provider } from "@earendil-works/pi-ai";

import { recordStream } from "./child.js";
import type { QueryFunction } from "./child.js";
import { bridgeProvider } from "./provider.js";
import { Sessions } from "./sessions.js";

/**
 * The claude-bridge provider for a host that runs pi-ai models without pi's coding agent,
 * such as a pi-durable Harness: register it with `Models.setProvider()`. Each pi session id
 * the host passes runs on its own Claude Code session in the process's working directory,
 * and ends when pi-ai's `cleanupSessionResources()` names it. Without pi's session file a
 * new process rebuilds each Claude Code session from the history it is sent.
 */
export const createClaudeBridgeProvider = (
  runQuery: QueryFunction = recordStream(query)
): Provider => {
  const sessions = new Sessions(runQuery, () => undefined);

  registerSessionResourceCleanup((sessionId) => {
    if (sessionId === undefined) {
      sessions.endAll();
    } else {
      sessions.end(sessionId);
    }
  });

  return bridgeProvider({ sessions, piTools: () => [] });
};
