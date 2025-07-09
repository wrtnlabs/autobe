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

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export const transformTestWriteHistories = (
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => [
  {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "systemMessage",
    text: AutoBeSystemPromptConstant.TEST_WRITE.replace(
      "${{AutoBeTestScenario}}",
      JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "llama">()),
    ),
  },
  transformArtifact(scenario, artifacts),
];

const transformArtifact = (
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
):
  | IAgenticaHistoryJson.IAssistantMessage
  | IAgenticaHistoryJson.ISystemMessage => {
  const document: OpenApi.IDocument = transformOpenApiDocument(
    artifacts.document,
  );
  const app: IHttpMigrateApplication = HttpMigration.application(document);
  return {
    id: v4(),
    created_at: new Date().toISOString(),
    type: "assistantMessage",
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

        ${Object.keys(artifacts.document.components.schemas)
          .map((k) => `- ${k}`)
          .join("\n")}

        \`\`\`json
        ${JSON.stringify(artifacts.dto)}
        \`\`\`

        ## API (SDK) Functions

        You can use these API functions.

        ${app.routes.map((r) => `- api.functional.${r.accessor.join(".")}`).join("\n")}

        And here is the declaration files of the API functions.
        
        \`\`\`json
        ${JSON.stringify(artifacts.sdk)}
        \`\`\`

        ## E2E Mockup Functions

        Just reference, and never follow this code as it is.

        \`\`\`json
        ${JSON.stringify(artifacts.e2e)}
        \`\`\`
      `,
  };
};
