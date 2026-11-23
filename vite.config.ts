import path from "node:path";

import { config } from "@clanker-stuff/oxlint-config";
import ultraciteFmt from "ultracite/oxfmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...ultraciteFmt,
    ignorePatterns: [...(ultraciteFmt.ignorePatterns ?? []), "AGENTS.md"],
  },
  lint: config({
    assertFunctions: ["expectPrefix", "inspect", "open"],
    overrides: [
      {
        files: ["query/prompt-stream.ts", "tests/helpers.ts"],
        rules: { "no-unmodified-loop-condition": "off" },
      },
      {
        files: [
          "tests/agent-session.integration.test.ts",
          "tests/provider.test.ts",
        ],
        rules: { "unicorn/prefer-single-call": "off" },
      },
      {
        files: ["tests/query/prompt-stream.test.ts"],
        plugins: ["vitest"],
        rules: { "vitest/valid-expect": "off" },
      },
      {
        files: ["tests/support/tui.ts"],
        rules: { "typescript/no-unsafe-type-assertion": "off" },
      },
      {
        files: [
          "content.ts",
          "json.ts",
          "log.ts",
          "machine/conversation.ts",
          "mcp-server.ts",
          "session/convert.ts",
          "session/rebuild.ts",
          "tests/machine/conversation.test.ts",
          "tests/provider.test.ts",
          "tests/query/prompt-stream.test.ts",
          "tests/session/convert.test.ts",
          "tests/session/messages.ts",
          "tests/support/tui.ts",
        ],
        rules: { "anti-slop/no-runtime-typeof": "off" },
      },
      {
        excludeFiles: ["tests/**"],
        files: ["**/*.{ts,mts,cts,js,mjs,cjs}"],
        rules: { "no-console": ["error", { allow: ["error", "warn"] }] },
      },
    ],
  }),
  test: {
    environment: "node",
    exclude: ["**/node_modules/**"],
    projects: [
      {
        test: {
          exclude: ["**/*.integration.test.ts", "**/*.smoke.test.ts"],
          include: ["**/*.test.ts"],
          name: "unit",
        },
      },
      {
        test: {
          include: ["**/*.integration.test.ts"],
          name: "integration",
        },
      },
      {
        test: {
          fileParallelism: false,
          hookTimeout: 120_000,
          include: ["**/*.smoke.test.ts"],
          name: "smoke",
          testTimeout: 120_000,
        },
      },
    ],
    restoreMocks: true,
    setupFiles: [path.resolve(import.meta.dirname, "tests/support/setup.ts")],
    testTimeout: 10_000,
  },
});
