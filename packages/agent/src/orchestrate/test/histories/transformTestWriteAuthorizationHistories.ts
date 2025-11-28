import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil, transformOpenApiDocument } from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
} from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestScenarioArtifacts } from "../structures/IAutoBeTestScenarioArtifacts";

export function transformTestWriteAuthorizationHistories(props: {
  operation: AutoBeOpenApi.IOperation;
  artifacts: IAutoBeTestScenarioArtifacts;
}): IAutoBeOrchestrateHistory {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.TEST_WRITE_AUTHORIZATION,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Operation Details
          
          Method: ${props.operation.method.toUpperCase()}
          Path: ${props.operation.path}
          Authorization Type: ${props.operation.authorizationType}
          Actor: ${props.operation.authorizationActor}
          
          ## DTO Definitions
          
          You can use these DTO definitions:
          
          ${transformTestWriteAuthorizationHistories.structures(props.artifacts)}
          
          ## API (SDK) Functions
          
          You can use these API functions:
          
          ${transformTestWriteAuthorizationHistories.functional(props.artifacts)}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Generate an authorization utility function for ${props.operation.authorizationActor} ${props.operation.authorizationType}.
      The function should handle the authentication flow and update the connection appropriately.
    `,
  };
}

export namespace transformTestWriteAuthorizationHistories {
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
