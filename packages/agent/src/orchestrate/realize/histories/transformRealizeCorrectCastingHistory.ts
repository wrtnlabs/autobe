import { AutoBeRealizeFunction } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { transformPreviousAndLatestCorrectHistory } from "../../common/histories/transformPreviousAndLatestCorrectHistory";
import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

export const transformRealizeCorrectCastingHistory = <
  RealizeFunction extends AutoBeRealizeFunction,
>(props: {
  template: string;
  function: RealizeFunction;
  failures: IAutoBeRealizeFunctionFailure<RealizeFunction>[];
}): IAutoBeOrchestrateHistory => {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.COMMON_CORRECT_CASTING,
      },
      ...transformPreviousAndLatestCorrectHistory(
        props.failures.map((f) => ({
          script: f.function.content,
          diagnostics: f.diagnostics,
        })),
      ),
    ],
    userMessage: StringUtil.trim`
      Fix the TypeScript casting problems to resolve the compilation error.

      Most casting errors are caused by type mismatches between Date types and
      string & tags.Format<'date-time'>. To fix these:
      - Use ONLY the pre-provided toISOStringSafe() function to convert Date to string
      - Do NOT use .toISOString() method directly (use toISOStringSafe instead)
      - Never use Date type directly in declarations or return values

      You don't need to explain me anything, but just fix or give it up
      immediately without any hesitation, explanation, and questions.

      The instruction to write at first was as follows, and the code you received is the code you wrote according to this instruction.
      When modifying, modify the entire code, but not the import statement.

      Below is template code you wrote:

      ${props.template}

      Current code is as follows:

      \`\`\`typescript
      ${props.function.content}
      \`\`\`

      Also, never use typia.assert and typia.assertGuard like functions
      to the Prisma types. Your mission is to fix the casting problem of
      primitive types like string or number. Prisma type is not your scope.

      If you take a mistake that casting the Prisma type with the typia.assert
      function, it would be fallen into the infinite compilation due to extremely
      complicated Prisma type. Note that, the typia.assert function is allowed
      only in the individual property level string or literal type.

      I repeat that, never assert the Prisma type. It's not your mission.
    `,
  };
};
