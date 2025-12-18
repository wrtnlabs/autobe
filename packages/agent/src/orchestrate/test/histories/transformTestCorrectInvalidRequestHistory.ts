// import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
// import { StringUtil } from "@autobe/utils";
// import { v7 } from "uuid";

// import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
// import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
// import { IAutoBeTestAuthorizeProcedure } from "../structures/IAutoBeTestAuthorizeWriteResult";
// import { IAutoBeTestGenerateProcedure } from "../structures/IAutoBeTestGenerateProcedure";
// import { IAutoBeTestOperationProcedure } from "../structures/IAutoBeTestOperationProcedure";

// export const transformTestCorrectInvalidRequestHistory = (
//   write:
//     | IAutoBeTestAuthorizeProcedure
//     | IAutoBeTestGenerateProcedure
//     | IAutoBeTestOperationProcedure,
//   diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[],
// ): IAutoBeOrchestrateHistory => {
//   const systemPrompt: string = (() => {
//     switch (write.function.type) {
//       case "operation":
//         return AutoBeSystemPromptConstant.TEST_OPERATION_CORRECT_REQUEST;
//       case "generate":
//         return AutoBeSystemPromptConstant.TEST_GENERATE_CORRECT_REQUEST;
//       case "authorize":
//         return AutoBeSystemPromptConstant.TEST_AUTHORIZE_CORRECT_REQUEST;
//       default:
//         write.function satisfies never;
//         throw new Error(
//           `Unreachable: Cannot create correct invalid request system prompt of function kind`,
//         );
//     }
//   })();
//   return {
//     histories: [
//       {
//         id: v7(),
//         created_at: new Date().toISOString(),
//         type: "systemMessage",
//         text: systemPrompt,
//       },
//       {
//         id: v7(),
//         created_at: new Date().toISOString(),
//         type: "assistantMessage",
//         text: StringUtil.trim`
//         ## TypeScript Code

//         \`\`\`typescript
//         ${write.function.content}
//         \`\`\`

//         ## Compile Errors

//         \`\`\`json
//         ${JSON.stringify(diagnostics)}
//         \`\`\`
//       `,
//       },
//     ],
//     userMessage: "Fix the compile errors in the test code please",
//   };
// };
