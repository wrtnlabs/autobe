import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeRealizeAuthorization } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";
import { IAutoBeRealizeScenarioApplication } from "../structures/IAutoBeRealizeScenarioApplication";
import { transformRealizeWriteHistories } from "./transformRealizeWriteHistories";

export function transformRealizeCorrectHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioApplication.IProps;
  authorization: AutoBeRealizeAuthorization | null;
  totalAuthorizations: AutoBeRealizeAuthorization[];
  code: string;
  failures: IAutoBeRealizeFunctionFailure[];
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> {
  return [
    ...transformRealizeWriteHistories(props),
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
    ...props.failures.map(
      (f) =>
        ({
          id: v7(),
          type: "assistantMessage",
          text: StringUtil.trim`

      ## Generated Typescript Code

      \`\`\`typescript
      ${f.function.content}
      \`\`\`

      ## Compile Errors

      Fix the comilation error in the provided code.

      \`\`\`typescript
      ${JSON.stringify(f.diagnostics)}
      \`\`\`
      `,
          created_at: new Date().toISOString(),
        }) satisfies IAgenticaHistoryJson.IAssistantMessage,
    ),
    {
      id: v7(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
      created_at: new Date().toISOString(),
    },
  ];
}
