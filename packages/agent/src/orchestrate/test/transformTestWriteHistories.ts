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

import { ContextOptimizer } from "../../utils/rag";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";

export function transformTestWriteHistories(
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
): Array<IAgenticaHistoryJson.ISystemMessage> {
  // Optimize context using RAG to reduce token consumption
  const optimizedContext = ContextOptimizer.optimizeForScenario(
    scenario,
    artifacts.document,
    artifacts.sdk,
    artifacts.e2e,
    {
      maxOperations: 10, // Reduced from including all operations
      maxSchemas: 25,    // Reduced from including all schemas
      minOperationScore: 0.2,
      aggressiveMode: true
    }
  );

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: `# E2E Test Generation System Prompt (OPTIMIZED FOR TOKEN EFFICIENCY)

## 1. Role and Responsibility

You are an AI assistant responsible for generating comprehensive End-to-End (E2E) test functions for API endpoints. Your primary task is to create robust, realistic test scenarios that validate API functionality through complete user workflows, ensuring both successful operations and proper error handling.

You must generate test code that:
- Follows real-world business scenarios and user journeys
- Validates API responses and business logic thoroughly
- Handles authentication, data setup, and cleanup appropriately
- Uses proper TypeScript typing and validation
- Maintains code quality and readability standards

## 2. Context Optimization Notice

**IMPORTANT: This context has been optimized using RAG (Retrieval-Augmented Generation) to reduce token consumption.**

Optimization Statistics:
- Operations filtered: ${optimizedContext.stats.originalOperations} → ${optimizedContext.stats.filteredOperations} (${optimizedContext.stats.estimatedTokenReduction}% token reduction)
- Schemas filtered: ${optimizedContext.stats.originalSchemas} → ${optimizedContext.stats.filteredSchemas}
- Focus: Only semantically relevant context for this specific test scenario

Only the most relevant operations, schemas, and examples for your specific test scenario are included below.

## 3. Test Scenario

\`\`\`json
${JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "llama">())}
\`\`\`

This contains the complete test scenario specification that you must implement.`.replace(
        "{{AutoBeTestScenario}}",
        JSON.stringify(typia.llm.parameters<AutoBeTestScenario, "llama">()),
      ),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: StringUtil.trim`
        Here is the list of input material composition (OPTIMIZED FOR TOKEN EFFICIENCY).

        Make e2e test functions based on the following information.

        ## Scenario Plan

        Here is the scenario plan what you have to implement.

        \`\`\`json
        ${JSON.stringify(scenario)}
        \`\`\`

        ## DTO Definitions (FILTERED BY RELEVANCE)

        You can use these DTO definitions. Only the most relevant DTOs for your test scenario are included.

        Never use the DTO definitions that are not listed here.

        ${transformTestWriteHistories.optimizedStructures(optimizedContext)}

        ## API (SDK) Functions (FILTERED BY RELEVANCE)

        You can use these API functions. Only the most relevant API functions for your test scenario are included.

        Never use the functions that are not listed here.

        ${transformTestWriteHistories.optimizedFunctional(optimizedContext)}

        ## E2E Mockup Functions (FILTERED BY RELEVANCE)

        Just reference, and never follow this code as it is. Only the most relevant examples for your test scenario are included.

        \`\`\`json
        ${JSON.stringify(optimizedContext.e2eExamples || {})}
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

  // New optimized functions for RAG-filtered context
  export function optimizedStructures(optimizedContext: any): string {
    const schemaNames = Object.keys(optimizedContext.schemas);
    return StringUtil.trim`
      **FILTERED SCHEMAS (${schemaNames.length} most relevant):**
      ${schemaNames.map((k) => `- ${k}`).join("\n")}

      \`\`\`json
      ${JSON.stringify(optimizedContext.schemas)}
      \`\`\`
    `;
  }

  export function optimizedFunctional(optimizedContext: any): string {
    const operations = optimizedContext.operations;
    return StringUtil.trim`
      **FILTERED OPERATIONS (${operations.length} most relevant):**
      Method | Path | Function Accessor
      -------|------|-------------------
      ${operations
        .map((op: any) => {
          // Convert operation to accessor format
          const pathSegments = op.path
            .split('/')
            .filter((s: string) => s && !s.startsWith('{'))
            .map((s: string) => s.replace(/[^a-zA-Z0-9]/g, ''));
          const accessor = pathSegments.join('.');
          return [op.method.toUpperCase(), op.path, `api.functional.${accessor}`].join(" | ");
        })
        .join("\n")}

      \`\`\`json
      ${JSON.stringify(optimizedContext.sdkFunctions)}
      \`\`\`
    `;
  }
}
