import {
  AutoBeTestAuthorizationWriteFunction,
  AutoBeTestGenerationWriteFunction,
  AutoBeTestScenario,
} from "@autobe/interface";
import { StringUtil, transformOpenApiDocument } from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  ILlmSchema,
  OpenApi,
} from "@samchon/openapi";
import { Singleton } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { getTestExternalDeclarations } from "../compile/getTestExternalDeclarations";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export async function transformTestOperationWriteHistory<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    scenario: AutoBeTestScenario;
    artifacts: IAutoBeTestScenarioArtifacts;
    authorizationFunctions: AutoBeTestAuthorizationWriteFunction[];
    generationFunctions: AutoBeTestGenerationWriteFunction[];
  },
): Promise<IAutoBeOrchestrateHistory> {
  const functions: (
    | AutoBeTestAuthorizationWriteFunction
    | AutoBeTestGenerationWriteFunction
  )[] = [...props.authorizationFunctions, ...props.generationFunctions];
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: systemPrompt.get(),
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here is the list of input material composition.

          Make e2e test functions based on the following information.

          ## Instructions

          The following e2e-test-specific instructions were extracted from
          the user's requirements and conversations. These instructions focus
          exclusively on test-related aspects such as test data generation strategies,
          assertion patterns, error handling approaches, and specific validation logic
          that should be implemented in the test code.

          Follow these instructions when implementing the e2e test function.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Function Name

          The e2e test function name must be ${JSON.stringify(props.scenario.functionName)}.

          ## Scenario Plan

          Here is the scenario plan what you have to implement.

          \`\`\`json
          ${JSON.stringify(props.scenario)}
          \`\`\`

          ## DTO Definitions

          You can use these DTO definitions.

          Never use the DTO definitions that are not listed here.

          ${transformTestOperationWriteHistory.structures(props.artifacts)}

          ## API (SDK) Functions

          You can use these API functions.

          Never use the functions that are not listed here.

          ${transformTestOperationWriteHistory.functional(props.artifacts, functions)}

          ## E2E Mockup Functions

          Just reference, and never follow this code as it is.

          \`\`\`json
          ${JSON.stringify(props.artifacts.e2e)}
          \`\`\`

          ## Available Utility Functions

          ${
            functions.length > 0
              ? StringUtil.trim`
          🚨 **CRITICAL: UTILITY FUNCTIONS HAVE ABSOLUTE PRIORITY OVER SDK FUNCTIONS** 🚨

          When calling an API endpoint, you MUST:
          1. **FIRST**: Check if a utility function exists for that endpoint (match by METHOD + PATH)
          2. **SECOND**: Only if NO utility function exists, use SDK function (\`api.functional.*\`)

          **ABSOLUTE RULE**: If a utility function is provided for an endpoint below, you **MUST** use that utility function.
          Using \`api.functional.*\` directly for an endpoint that has a utility function is **FORBIDDEN**.

          ### Authorization Functions
          Use these to authenticate users. After calling, \`connection.headers.Authorization\` is automatically updated.

          | Function Name | Endpoint | Actor |
          |---------------|----------|-------|
          ${props.authorizationFunctions
            .map(
              (f) =>
                `| \`${f.functionName}\` | \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\` | ${f.actor} |`,
            )
            .join("\n")}

          ${props.authorizationFunctions
            .map(
              (f) => StringUtil.trim`
          #### ${f.functionName}
          - **Endpoint**: \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\`
          - **Actor**: ${f.actor}
          - **Auth Type**: ${f.authType}
          - **Usage**: \`await ${f.functionName}({ connection, input: { ... } })\`
          - ⚠️ **Do NOT use \`api.functional.*\` for \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\`** - use this function instead

          \`\`\`typescript
          ${f.content}
          \`\`\`
          `,
            )
            .join("\n\n")}

          ### Generation Functions
          Use these to create test resources. They handle data preparation and API calls internally.

          | Function Name | Endpoint |
          |---------------|----------|
          ${props.generationFunctions
            .map(
              (f) =>
                `| \`${f.functionName}\` | \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\` |`,
            )
            .join("\n")}

          ${props.generationFunctions
            .map(
              (f) => StringUtil.trim`
          #### ${f.functionName}
          - **Endpoint**: \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\`
          - **Usage**: \`await ${f.functionName}({ connection, input: { ... } })\`
          - ⚠️ **Do NOT use \`api.functional.*\` for \`${f.endpoint.method.toUpperCase()} ${f.endpoint.path}\`** - use this function instead

          \`\`\`typescript
          ${f.content}
          \`\`\`
          `,
            )
            .join("\n\n")}
          `
              : StringUtil.trim`
          No utility functions are available for this test scenario.
          You will need to handle authentication and data creation directly using the API SDK functions.
          `
          }

          ## External Definitions

          Here is the external declaration files (d.ts) you can reference.

          \`\`\`json
          ${JSON.stringify(await getTestExternalDeclarations(ctx))}
          \`\`\`

          ## Template Code

          Here is the template e2e test code what you must follow.

          You're only allowed to modify the "<SCENARIO DESCRIPTION HERE>" and
          code inside the function block marked as "// <E2E TEST CODE HERE>".
          Change the template code by writing your scenario description to the
          comment, and filling your implementation logic into the function.

          Note that, you don't need to add any "import" statement more than
          this template code. Everything you need is already imported, so
          make your implementation code in the import scope.

          \`\`\`typescript
          ${props.artifacts.template}
          \`\`\`
        `,
      },
    ],
    userMessage: `Write e2e test function ${props.scenario.functionName} please`,
  };
}
export namespace transformTestOperationWriteHistory {
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

  export function functional(
    artifacts: IAutoBeTestScenarioArtifacts,
    excludeFunctions: (
      | AutoBeTestAuthorizationWriteFunction
      | AutoBeTestGenerationWriteFunction
    )[],
  ): string {
    const document: OpenApi.IDocument = transformOpenApiDocument(
      artifacts.document,
    );
    const app: IHttpMigrateApplication = HttpMigration.application(document);

    const excludeEndpoints = new Set(
      excludeFunctions.map(
        (f) => `${f.endpoint.method.toLowerCase()}:${f.endpoint.path}`,
      ),
    );

    const filteredRoutes = app.routes.filter(
      (r) => !excludeEndpoints.has(`${r.method.toLowerCase()}:${r.path}`),
    );

    return StringUtil.trim`
      Method | Path | Function Accessor
      -------|------|-------------------
      ${filteredRoutes
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

const systemPrompt = new Singleton(() =>
  AutoBeSystemPromptConstant.TEST_OPERATION_WRITE.replace(
    "{{AutoBeTestScenario}}",
    JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "claude">()),
  ),
);
