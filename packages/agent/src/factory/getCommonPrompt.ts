import { Singleton, is_node } from "tstl";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { IAutoBeConfig } from "../structures/IAutoBeConfig";

export const getCommonPrompt = (
  config?: Pick<IAutoBeConfig, "locale" | "timezone"> | undefined,
) =>
  AutoBeSystemPromptConstant.COMMON.replace(
    "${locale}",
    config?.locale ?? locale.get(),
  )
    .replace("${timezone}", config?.timezone ?? timezone.get())
    .replace("${datetime}", new Date().toISOString());

const locale = new Singleton(() =>
  is_node()
    ? // eslint-disable-next-line node/prefer-global/process
      (process.env.LANG?.split(".")[0] ?? "en-US")
    : navigator.language,
);

const timezone = new Singleton(
  () => Intl.DateTimeFormat().resolvedOptions().timeZone,
);
