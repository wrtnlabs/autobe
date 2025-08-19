import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioArtifacts } from "../../test/structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeRealizeScenarioApplication } from "../structures/IAutoBeRealizeScenarioApplication";
import { transformRealizeWriteHistories } from "./transformRealizeWriteHistories";

export function transformRealizeCorrectHistories(props: {
  state: AutoBeState;
  scenario: IAutoBeRealizeScenarioApplication.IProps;
  artifacts: IAutoBeTestScenarioArtifacts;
  authorization: AutoBeRealizeAuthorization | null;
  code: string;
  diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic;
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> {
  return [
    ...transformRealizeWriteHistories(props),
    {
      id: v4(),
      type: "assistantMessage",
      text: [
        `Below is the code you made before. It's also something to review.`,
        "```typescript",
        props.code,
        "```",
        `The code has a compilation error:`,
        "```json",
        JSON.stringify(props.diagnostic, null, 2),
        "",
      ].join("\n"),
      created_at: new Date().toISOString(),
    },
    {
      id: v4(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
      created_at: new Date().toISOString(),
    },
  ];
}
