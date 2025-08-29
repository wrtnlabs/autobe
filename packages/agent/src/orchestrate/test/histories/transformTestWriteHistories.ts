import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeTestScenario } from "@autobe/interface";
import { StringUtil, transformOpenApiDocument } from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  ILlmSchema,
  OpenApi,
} from "@samchon/openapi";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { getTestExternalDeclarations } from "../compile/getTestExternalDeclarations";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export async function transformTestWriteHistories<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
): Promise<
  Array<
    IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
  >
> {
  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_WRITE.replace(
        "{{AutoBeTestScenario}}",
        JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "llama">()),
      ),
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        Here is the list of input material composition.

        Make e2e test functions based on the following information.

        ## Function Name

        The e2e test function name must be ${JSON.stringify(scenario.functionName)}.

        ## Scenario Plan

        Here is the scenario plan what you have to implement.

        \`\`\`json
        ${JSON.stringify(scenario)}
        \`\`\`

        ## DTO Definitions

        You can use these DTO definitions.

        Never use the DTO definitions that are not listed here.

        ${transformTestWriteHistories.structures(artifacts)}

        ## API (SDK) Functions

        You can use these API functions.

        Never use the functions that are not listed here.

        ${transformTestWriteHistories.functional(artifacts)}

        ## E2E Mockup Functions

        Just reference, and never follow this code as it is.

        \`\`\`json
        ${JSON.stringify(artifacts.e2e)}
        \`\`\`

        ## External Definitions

        \`\`\`json
        ${JSON.stringify(await getTestExternalDeclarations(ctx))}
        \`\`\`
      `,
    },
  ];
}
export namespace transformTestWriteHistories {
  export function structures(artifacts: IAutoBeTestScenarioArtifacts): string {
    return StringUtil.trim`
      ${Object.keys(artifacts.document.components.schemas)
        .map((k) => `- ${k}`)
        .join("\n")}

      \`\`\`json
      ${JSON.stringify(artifacts.dto)}
      \`\`\`
    `;
  }

  export function functional(artifacts: IAutoBeTestScenarioArtifacts): string {
    const document: OpenApi.IDocument = transformOpenApiDocument(
      artifacts.document,
    );
    const app: IHttpMigrateApplication = HttpMigration.application(document);
    return StringUtil.trim`
      Method | Path | Function Accessor
      -------|------|-------------------
      ${app.routes
        .map((r) =>
          [r.method, r.path, `api.functional.${r.accessor.join(".")}`].join(
            " | ",
          ),
        )
        .join("\n")}

      \`\`\`json
      ${JSON.stringify(artifacts.sdk)}
      \`\`\`
    `;
  }
}
