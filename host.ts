import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Provider } from "@earendil-works/pi-ai";

import { recordStream } from "./child.js";
import { hostProvider } from "./provider.js";

/** The claude-bridge provider for pi-ai hosts outside pi's session; see docs/behavior.md, "Other hosts". */
export const createClaudeBridgeProvider = (): Provider =>
  hostProvider(recordStream(query));
