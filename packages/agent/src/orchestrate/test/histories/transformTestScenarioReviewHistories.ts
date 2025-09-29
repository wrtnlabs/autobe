import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeTestScenarioApplication } from "../structures/IAutoBeTestScenarioApplication";
import { getReferenceIds } from "../utils/getReferenceIds";

export function transformTestScenarioReviewHistories(props: {
  state: AutoBeState;
  instruction: string;
  groups: IAutoBeTestScenarioApplication.IScenarioGroup[];
}): Array<
  IAgenticaHistoryJson.ISystemMessage | IAgenticaHistoryJson.IAssistantMessage
> {
  interface IRelationship {
    endpoint: AutoBeOpenApi.IEndpoint;
    ids: string[];
  }

  const document: AutoBeOpenApi.IDocument | undefined =
    props.state.interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot review test scenarios because there are no operations.",
    );
  }

  const relationships: IRelationship[] = document.operations
    .map((o) => ({
      endpoint: {
        method: o.method,
        path: o.path,
      },
      ids: getReferenceIds({
        document,
        operation: o,
      }),
    }))
    .filter((v) => v.ids.length !== 0);

  return [
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST_SCENARIO_REVIEW,
    },
    {
      id: v7(),
      created_at: new Date().toISOString(),
      type: "assistantMessage",
      text: StringUtil.trim`
        ## Instructions

        The following e2e-test-specific instructions were extracted by AI from
        the user's requirements and conversations. These instructions focus
        exclusively on test-related aspects such as test coverage priorities,
        specific edge cases to validate, business logic verification strategies,
        and critical user workflows that must be tested.
        
        Apply these instructions when reviewing test scenarios to ensure the
        tests align with the user's testing requirements and expectations.
        If any instructions are not relevant to the target API operations,
        you may ignore them.

        ${props.instruction}

        ## Available API Operations for Reference

        Below are all available API operations and interface schemas for validation purposes.
        Match each operation with its corresponding schema.

        \`\`\`json
        ${JSON.stringify({
          operations: document.operations,
        })}
        \`\`\`

        ## Test Scenario Groups

        Please review the following test scenario groups:

        \`\`\`json
        ${JSON.stringify(
          props.groups.map((g) => {
            return {
              ...g,
              scenarios: g.scenarios.map((s) => {
                const requiredId: string[] = [];

                s.dependencies.forEach((dep) => {
                  document.operations.forEach((op) => {
                    if (
                      g.endpoint.method === op.method &&
                      g.endpoint.path === op.path
                    ) {
                      requiredId.push(
                        ...getReferenceIds({ document, operation: op }),
                      );
                    }

                    if (
                      op.method === dep.endpoint.method &&
                      op.path === dep.endpoint.path
                    ) {
                      requiredId.push(
                        ...getReferenceIds({ document, operation: op }),
                      );
                    }
                  });
                });

                return {
                  ...s,
                  requiredIds:
                    requiredId.length > 0
                      ? Array.from(new Set(requiredId))
                      : [],
                };
              }),
            };
          }),
        )}
        \`\`\`

        ## Candidate Dependencies
    
        List of candidate dependencies extracted from path parameters and request bodies.

        Apply dependency resolution to the target endpoint from "Included in Test Plan" and to dependencies found recursively from it.
        For each required ID, locate the operation that creates the resource. Include the creator only if that operation exists in the provided operations list. Do not assume or invent operations. If no creator exists, treat the ID as an external or pre-existing input.

        Dependency resolution steps:
        1. Starting from the target endpoint, collect required IDs.
        2. For each ID, search for a creator operation (typically POST).
        3. If found, add it to the dependency chain in execution order and repeat for its own required IDs.
        4. Stop when no further creators exist or are needed.

        For each some_entity_id pattern, use the same approach: include a creator only when it is present in the operations list.
    
        Endpoint | Required IDs (MUST be created by other APIs)
        ---------|---------------------------------------------------
        ${relationships
          .map((r) =>
            [
              `\`${r.endpoint.method} ${r.endpoint.path}\``,
              r.ids.map((id) => `\`${id}\``).join(", "),
            ].join(" | "),
          )
          .join("\n")}

        Example: If an endpoint requires \`articleId\` and \`POST /articles\` exists, include it in dependencies
      `,
    },
  ];
}
