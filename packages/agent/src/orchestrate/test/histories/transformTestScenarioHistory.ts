import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeTestScenarioAuthorizationActor } from "../structures/IAutoBeTestScenarioAuthorizationActor";
import { getPrerequisites } from "../utils/getPrerequisites";

/**
 * Transform test scenario generation context into conversational history.
 *
 * Following the InterfacePrerequisite pattern:
 * - Provides system prompts
 * - Provides preliminary data histories
 * - Provides single target operation
 * - Provides prerequisites for the operation
 * - Provides authorization actors
 *
 * @param props - Configuration for history transformation
 * @returns Complete conversation history ready for LLM agent processing
 */
export const transformTestScenarioHistory = (props: {
  state: AutoBeState;
  operation: AutoBeOpenApi.IOperation;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
  instruction: string;
}): IAutoBeOrchestrateHistory => {
  const document: AutoBeOpenApi.IDocument = props.state.interface!.document!;
  const authorizations: AutoBeInterfaceAuthorization[] =
    props.state.interface?.authorizations ?? [];
  const authorizationActors: Map<
    string,
    IAutoBeTestScenarioAuthorizationActor
  > = new Map();

  for (const authorization of authorizations) {
    for (const op of authorization.operations) {
      if (op.authorizationType === null) continue;
      const value: IAutoBeTestScenarioAuthorizationActor = MapUtil.take(
        authorizationActors,
        authorization.name,
        () => ({
          name: authorization.name,
          join: null,
          login: null,
        }),
      );
      if (op.authorizationType === "join") value.join = op;
      else if (op.authorizationType === "login") value.login = op;
    }
  }

  // Find authorization actor for this operation
  const operationAuthorizationActors = Array.from(
    authorizationActors.values(),
  ).filter((actor) => actor.name === props.operation.authorizationActor);

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.TEST_SCENARIO,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Instructions

          The following e2e-test-specific instructions were extracted from
          the user's requirements and conversations. These instructions focus
          exclusively on test-related aspects such as test coverage priorities,
          specific edge cases to validate, business logic verification strategies,
          and critical user workflows that must be tested.

          Follow these instructions when generating test scenario.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Target Operation

          Single operation requiring test scenario generation.

          Generate ONE focused test scenario for this operation that validates
          the primary business workflow. Focus on the most critical use case.

          \`\`\`json
          ${JSON.stringify({
            operation: props.operation,
            prerequisites: getPrerequisites({
              endpoint: props.operation,
              document,
            }),
            authorizationActors: operationAuthorizationActors,
          })}
          \`\`\`

        `,
      },
    ],
    userMessage: "Design test scenario for the target operation please",
  };
};
