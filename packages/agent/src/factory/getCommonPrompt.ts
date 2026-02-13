import { Singleton, is_node } from "tstl";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";

export const getCommonPrompt = (
  config?: Pick<IAutoBeConfig, "locale" | "timezone"> | undefined,
) =>
  AutoBeSystemPromptConstant.AGENTICA_COMMON.replace(
    "${locale}",
    config?.locale ?? locale.get(),
  )
    .replace("${timezone}", config?.timezone ?? timezone.get())
    .replace("${datetime}", new Date().toISOString());

// biome-ignore-start lint: intended
const locale = new Singleton(() =>
  is_node() ? (process.env.LANG?.split(".")[0] ?? "en-US") : navigator.language,
);
// biome-ignore-end lint: intended

const timezone = new Singleton(
  () => Intl.DateTimeFormat().resolvedOptions().timeZone,
);
