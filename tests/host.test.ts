import { rm } from "node:fs/promises";

import {
  cleanupSessionResources,
  InMemoryCredentialStore,
} from "@earendil-works/pi-ai";
import { createModels } from "@earendil-works/pi-ai/models";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { createClaudeBridgeProvider } from "../host.js";
import {
  assistantMessage,
  init,
  successResult,
  textBlock,
} from "./fixtures/sdk.js";
import { fakeQueryFunction } from "./helpers.js";
import { patchEnv } from "./support/env.js";
import { createTempDir } from "./support/fs.js";

const ACCESS = "sk-ant-oat01-member";

const hostModels = async () => {
  const fake = fakeQueryFunction();
  const credentials = new InMemoryCredentialStore();

  await credentials.modify("claude-bridge", async () => ({
    type: "oauth",
    access: ACCESS,
    refresh: "refresh-token",
    expires: Date.now() + 3_600_000,
  }));

  const models = createModels({ credentials });

  models.setProvider(createClaudeBridgeProvider(fake.run));

  const model = models.getModel("claude-bridge", "claude-haiku-5-5");

  if (model === undefined) {
    throw new Error("the catalog has no claude-haiku-5-5");
  }

  const ask = (sessionId: string) =>
    models.streamSimple(
      model,
      { messages: [{ role: "user", content: "hi", timestamp: 1 }] },
      { sessionId }
    );

  const query = async (index: number) =>
    await vi.waitFor(() => {
      const started = fake.queries[index];

      if (started === undefined) {
        throw new Error(`query ${index} has not started`);
      }

      return started;
    });

  return { ask, query };
};

describe("createClaudeBridgeProvider", () => {
  let configDir: string;

  let restoreEnv: () => void;

  beforeEach(async () => {
    configDir = await createTempDir("claude-bridge-config-");
    restoreEnv = patchEnv({
      CLAUDE_CONFIG_DIR: configDir,
      ANTHROPIC_API_KEY: "sk-ambient-key",
      ANTHROPIC_AUTH_TOKEN: undefined,
      CLAUDE_CODE_OAUTH_TOKEN: undefined,
    });
  });

  afterEach(async () => {
    cleanupSessionResources();
    restoreEnv();
    await rm(configDir, { recursive: true, force: true });
  });

  it("runs a turn on the stored Claude account's login, not the host's ambient key", async () => {
    const { ask, query } = await hostModels();
    const reply = ask("pi-session");
    const started = await query(0);
    const { env } = started.params.options;

    expect(env?.["CLAUDE_CODE_OAUTH_TOKEN"]).toBe(ACCESS);
    expect(env?.["ANTHROPIC_AUTH_TOKEN"]).toBeUndefined();
    expect(env?.["ANTHROPIC_API_KEY"]).toBeUndefined();

    for (const message of [
      init("cc-1"),
      assistantMessage("msg_1", [textBlock("hello")]),
      successResult("hello"),
    ]) {
      started.push(message);
    }

    started.end();

    const message = await reply.result();

    expect(message.stopReason).toBe("stop");
    expect(message.content).toStrictEqual([{ type: "text", text: "hello" }]);
  });

  it("stops a session's Claude Code query when pi-ai cleans up that session only", async () => {
    const { ask, query } = await hostModels();

    ask("ended");
    ask("kept");

    const [ended, kept] = [await query(0), await query(1)];

    cleanupSessionResources("ended");

    expect(ended.closed).toBe(true);
    expect(kept.closed).toBe(false);
  });
});
