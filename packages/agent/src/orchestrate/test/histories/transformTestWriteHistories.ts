import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeTestScenario } from "@autobe/interface";
import { StringUtil, transformOpenApiDocument } from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
} from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export function transformTestWriteHistories(
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
): Array<IAgenticaHistoryJson.ISystemMessage> {
  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_WRITE.replace(
        "{{AutoBeTestScenario}}",
        JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "llama">()),
      ).replaceAll("{{FUNCTION_NAME}}", scenario.functionName),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        Here is the list of input material composition.

        Make e2e test functions based on the following information.

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
