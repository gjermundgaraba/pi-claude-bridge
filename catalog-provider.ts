import {
  createAssistantMessageEventStream,
  createProvider,
} from "@earendil-works/pi-ai";
import type {
  Api,
  ApiKeyAuth,
  AssistantMessageEventStream,
  Model,
  Provider,
  SimpleStreamOptions,
  StreamFunction,
  TranscriptContext,
} from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";

import { errorMessage } from "./log.js";
import { catalogModels } from "./models.js";
import { PROVIDER_ID } from "./session/convert.js";
import { Turn } from "./translate.js";

type Answer = StreamFunction<Api, SimpleStreamOptions>;

/** Answers one turn into a stream the caller already returned. */
export type AnswerInto = (
  model: Model<Api>,
  transcript: TranscriptContext,
  options: SimpleStreamOptions | undefined,
  stream: AssistantMessageEventStream
) => void;

const bridgeAuth: ApiKeyAuth = {
  name: "Claude Code",
  resolve: async ({ credential }) =>
    credential?.key !== undefined && credential.key !== ""
      ? { auth: { apiKey: credential.key }, source: "stored credential" }
      : { auth: {}, source: "Claude Code" },
};

const claudeAccountAuth = builtinProviders().find(
  (provider) => provider.id === "anthropic"
)?.auth.oauth;

/** The claude-bridge provider: its catalog and sign-in, with `answer` for its turns. */
export const catalogProvider = (answer: Answer): Provider =>
  createProvider({
    id: PROVIDER_ID,
    auth: {
      apiKey: bridgeAuth,
      ...(claudeAccountAuth === undefined ? {} : { oauth: claudeAccountAuth }),
    },
    models: catalogModels(),
    api: { stream: answer, streamSimple: answer },
  });

/** The provider whose turns `load` answers, loaded when the first turn starts. A failed load
 *  fails that turn, and the next turn loads again. */
export const lazyProvider = (load: () => Promise<AnswerInto>): Provider => {
  let loading: Promise<AnswerInto> | undefined;

  return catalogProvider((model, transcript, options) => {
    const stream = createAssistantMessageEventStream();

    void (async () => {
      try {
        loading ??= load();
        (await loading)(model, transcript, options, stream);
      } catch (error) {
        loading = undefined;
        new Turn(model, stream, new Set()).fail(errorMessage(error));
      }
    })();

    return stream;
  });
};
