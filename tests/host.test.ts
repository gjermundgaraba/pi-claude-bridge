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

import { lazyProvider } from "../catalog-provider.js";
import type { QueryFunction } from "../child.js";
import { hostTurns } from "../provider.js";
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

const refuse = (): never => {
  throw new Error("no such model");
};

const hostModels = async (
  load = async (run: QueryFunction) => hostTurns(run)
) => {
  const fake = fakeQueryFunction();
  let loads = 0;
  const credentials = new InMemoryCredentialStore();

  await credentials.modify("claude-bridge", async () => ({
    type: "oauth",
    access: ACCESS,
    refresh: "refresh-token",
    expires: Date.now() + 3_600_000,
  }));

  const models = createModels({ credentials });

  models.setProvider(
    lazyProvider(async () => {
      loads += 1;

      return await load(fake.run);
    })
  );

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

  return { ask, query, loads: () => loads };
};

describe("the host provider", () => {
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
  });

  it("loads the turn code once, when the first turn starts", async () => {
    const { ask, query, loads } = await hostModels();

    expect(loads()).toBe(0);

    ask("first");
    ask("second");
    await query(1);

    expect(loads()).toBe(1);
  });

  it("fails the turn when the turn code cannot load", async () => {
    const { ask } = await hostModels(async () => {
      throw new Error("Cannot find package '@anthropic-ai/claude-agent-sdk'");
    });

    const message = await ask("pi-session").result();

    expect(message.stopReason).toBe("error");
    expect(message.errorMessage).toContain("claude-agent-sdk");
  });

  it("loads the turn code again after a failed load", async () => {
    let failing = true;

    const { ask, query, loads } = await hostModels(async (run) => {
      if (failing) {
        failing = false;

        throw new Error("EMFILE: too many open files");
      }

      return hostTurns(run);
    });

    const failed = await ask("first").result();

    expect(failed.stopReason).toBe("error");

    ask("second");
    await query(0);

    expect(loads()).toBe(2);
  });

  it("keeps the loaded turn code when a turn throws", async () => {
    const { ask, loads } = await hostModels(async () => ({
      stream: refuse,
      streamSimple: refuse,
    }));

    const first = await ask("first").result();
    const second = await ask("second").result();

    expect(first.errorMessage).toBe("no such model");
    expect(second.errorMessage).toBe("no such model");
    expect(loads()).toBe(1);
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
