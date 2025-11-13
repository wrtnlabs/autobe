import { AutoBeInterfaceAuthorization, AutoBeOpenApi } from "@autobe/interface";
import { MapUtil, StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { IAutoBeTestScenarioAuthorizationActor } from "../structures/IAutoBeTestScenarioAuthorizationActor";
import { getPrerequisites } from "../utils/getPrerequisites";

export const transformTestScenarioHistory = (props: {
  state: AutoBeState;
  include: AutoBeOpenApi.IOperation[];
  exclude: AutoBeOpenApi.IEndpoint[];
  preliminary: AutoBePreliminaryController<"interfaceOperations">;
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

          Follow these instructions when generating test scenarios.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}

          ## Included in Test Plan

          Below are the endpoints that have been included in the test plan.
          Each endpoint shows its authentication requirements and related authentication APIs.
          When testing endpoints that require authentication, ensure you include the corresponding
          join/login operations in your test scenario to establish proper authentication context.

          \`\`\`json
          ${JSON.stringify(
            props.include.map((el) => ({
              method: el.method,
              path: el.path,
              prerequisites: getPrerequisites({
                endpoint: el,
                document,
              }),
              authorizationActors: Array.from(
                authorizationActors.values(),
              ).filter((actor) => actor.name === el.authorizationActor),
            })),
          )}
          \`\`\`

          ## Excluded from Test Plan

          These are the endpoints that have already been used in test codes generated as part of a plan group.
          These endpoints do not need to be tested again.
          However, it is allowed to reference or depend on these endpoints when writing test codes for other purposes.

          \`\`\`json
          ${JSON.stringify(props.exclude)}
          \`\`\`

        `,
      },
    ],
    userMessage: "Design test scenarios for the included endpoints please",
  };
};
