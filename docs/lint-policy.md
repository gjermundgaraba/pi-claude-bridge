# Lint policy

Oxlint runs [`@clanker-stuff/oxlint-config`](https://github.com/gjermundgaraba/clanker-stuff/tree/main/packages/oxlint-config), the maintainer's shared preset of Ultracite and `@effect/tsgo` with its exceptions. Fix the code rather than add an exception, and do not add inline `oxlint-disable` comments. The file-scoped overrides in `vite.config.ts`, and why each stays:

- **`no-unmodified-loop-condition` off for the prompt stream and the test helpers.** The loop condition reads `done` and `failure`, which `end()` and `fail()` set while the loop awaits.
- **`unicorn/prefer-single-call` off for the AgentSession integration test and the provider test.** Their fakes' `push` takes one message by contract, as the SDK query's does; the rule reads them as `Array#push`.
- **`vitest/valid-expect` off for the prompt-stream test.** A rejection assertion is attached before the action that rejects and awaited after it, which the rule cannot express: awaiting it at once hangs, and a bare promise rejects unhandled.
- **`typescript/no-unsafe-type-assertion` off for the TUI test harness.** Pi exports `KeybindingsManager` only as a type, so `createKeybindings` casts a double that implements the keyboard contract components consume.
- **`anti-slop/no-runtime-typeof` off for the listed files.** There `typeof` either tells apart the members of a declared union (Pi's `string | Content[]`, `JsonValue`), where nothing is left to parse, or is the hand-written decoder at the boundary (JSON, logs, Claude Code's stream and transcripts).
- **`no-console` limited to `error` and `warn` outside tests.** Stricter than the presets: stdout is Pi's JSON and RPC transport, so extension code must not write to it.
