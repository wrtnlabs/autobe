import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";

export const transformImageDescribeDraftHistories =
  (): Array<IMicroAgenticaHistoryJson> => {
    return [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.IMAGE_DESCRIBE_DRAFT,
      },
    ];
  };
