import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { transformTestOperationWriteHistory } from "./transformTestOperationWriteHistory";

export async function transformTestAuthorizeWriteHistory<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    operation: AutoBeOpenApi.IOperation;
    artifacts: IAutoBeTestArtifacts;
  },
): Promise<IAutoBeOrchestrateHistory> {
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.TEST_AUTHORIZE_WRITE,
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
          
          ${await transformTestOperationWriteHistory.structures(ctx, props.artifacts)}
          
          ## API (SDK) Functions
          
          You can use these API functions:
          
          ${transformTestOperationWriteHistory.functional(props.artifacts, [])}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Generate an authorization utility function for ${props.operation.authorizationActor} ${props.operation.authorizationType}.
      The function should handle the authentication flow.
    `,
  };
}
