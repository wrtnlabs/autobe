import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeRealizeAuthorization,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
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
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
}): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> {
  const hint: string = printErrorHints(props.code, props.diagnostics);
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
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.REALIZE_CORRECT,
      created_at: new Date().toISOString(),
    },
    {
      id: v7(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Original Code

        Here is the previous code you have to review and fix.

        \`\`\`typescript
        ${props.code}
        \`\`\`

        ## Compilation Errors

        Here are the compilation errors found in the code above.

        \`\`\`json
        ${JSON.stringify(props.diagnostics)}
        \`\`\`

        ## Error Annotated Code

        Here is the error annotated code.

        Please refer to the annotation for the location of the error.

        By the way, note that, this code is only for reference purpose.
        Never fix code from this error annotated code. You must fix
        the original code above.

        ${hint}
      `,
      created_at: new Date().toISOString(),
    },
  ];
  const overflow = histories.find((h) => h.text.length > 1_000_000);
  if (overflow) {
    const filename: string = v7();
    fs.writeFileSync(`${filename}.text.log`, overflow.text, "utf8");
    fs.writeFileSync(`${filename}.script.log`, props.code, "utf8");
    fs.writeFileSync(`${filename}.hints.log`, hint, "utf8");
    fs.writeFileSync(
      `${filename}.failures.log`,
      JSON.stringify(props.diagnostics, null, 2),
      "utf8",
    );
  }
  return histories;
}
