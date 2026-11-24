import { createProvider, lazyApi } from "@earendil-works/pi-ai";
import type {
  ApiKeyAuth,
  Provider,
  ProviderStreams,
} from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";

import { catalogModels } from "./models.js";
import { PROVIDER_ID } from "./session/convert.js";

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

/** The claude-bridge provider: its catalog and sign-in, with `api` for its turns. */
export const catalogProvider = (api: ProviderStreams): Provider =>
  createProvider({
    id: PROVIDER_ID,
    auth: {
      apiKey: bridgeAuth,
      ...(claudeAccountAuth === undefined ? {} : { oauth: claudeAccountAuth }),
    },
    models: catalogModels(),
    api,
  });

/** The provider whose turns `load` answers. `load` runs when the first turn starts, and again
 *  on the next turn only if it failed. */
export const lazyProvider = (
  load: () => Promise<ProviderStreams>
): Provider => {
  let loading: Promise<ProviderStreams> | undefined;

  return catalogProvider(
    lazyApi(async () => {
      loading ??= load().catch((error: unknown) => {
        loading = undefined;

        throw error;
      });

      return await loading;
    })
  );
};
