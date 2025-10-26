import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { printErrorHints } from "../utils/printErrorHints";
import { transformRealizeWriteHistories } from "./transformRealizeWriteHistories";

export function transformRealizeCorrectHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioResult;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  code: string;
  dto: Record<string, string>;
  failures: IAutoBeRealizeFunctionFailure[];
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> {
  const histories: Array<
    IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
  > = [
    ...transformRealizeWriteHistories(props),
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
    },
    {
      id: v7(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Below is the code you made before. It's also something to review.

        \`\`\`typescript
        ${props.code}
        \`\`\`
      `,
      created_at: new Date().toISOString(),
    },
    ...props.failures.map((f) => {
      return {
        id: v7(),
        type: "assistantMessage",
        text: StringUtil.trim`
          This is a past code and an error with the code. Please refer to the annotation for the location of the error.

          ${printErrorHints(f.function.content, f.diagnostics)}
        `,
        created_at: new Date().toISOString(),
      } satisfies IAgenticaHistoryJson.IAssistantMessage;
    }),
    {
      id: v7(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
      created_at: new Date().toISOString(),
    },
  ];
  console.log("------------ REALIZE CORRECT HISTORIES ------------");
  console.log("number of failures", props.failures.length);
  console.log(
    "total length",
    histories.reduce((a, b) => a + b.text.length, 0),
  );
  console.log(
    "histories' sizes",
    histories.map((h) => [h.type, h.text.length, h.text.slice(0, 100)]),
  );
  console.log("---------------------------------------------------");
  return histories;
}
