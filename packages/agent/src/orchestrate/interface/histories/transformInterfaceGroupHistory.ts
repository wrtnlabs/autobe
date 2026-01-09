import { AutoBeDatabase } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../../context/AutoBeState";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";
import { transformInterfaceCommonHistory } from "./transformInterfaceCommonHistory";

export const transformInterfaceGroupHistory = (props: {
  state: AutoBeState;
  instruction: string;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
    | "previousInterfaceOperations"
  >;
}): IAutoBeOrchestrateHistory => {
  const common = transformInterfaceCommonHistory(props.state);
  if (common !== null)
    return {
      histories: common,
      userMessage: "Please wait for prerequisites to complete",
    };
  const app: AutoBeDatabase.IApplication | undefined =
    props.state.database?.result.data;
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.INTERFACE_GROUP,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Here is the database grouping information you can reference.

          However, database groups are your **STARTING POINT**, not your **STRICT BOUNDARY**:

          - **Use database groups as your BASELINE**: Most API groups should align with database 
                                                      groups (1:1 mapping)
          - **API ≠ Database**: APIs serve different purposes than normalized database schemas
            • APIs organize by **USER WORKFLOWS** (how users interact)
            • Databases organize by **DATA NORMALIZATION** (how data is stored)
          - **When to DIVERGE from database groups**:
            • Cross-schema operations: Analytics/dashboards aggregating multiple database groups
            • Workflow-based APIs: Checkout spanning Carts + Orders + Payments
            • Pure computation: APIs that don't touch database at all
            • External integrations: Webhooks, third-party API gateways
          - **CRITICAL**: Don't create 1-2 mega-groups ignoring database organization. 
                          Start with database groups, then add API-specific groups as needed.

          Belonged Namespace | Table Name | Stance | Summary
          -------------------|------------|--------|-----------
          ${app?.files
            .map((file) => file.models.map((model) => [file, model] as const))
            .flat()
            .map(([file, model]) =>
              [
                file.namespace,
                model.name,
                model.stance,
                StringUtil.summary(model.description),
              ].join(" | "),
            )
            .join("\n")}
        `,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## API Design Instructions

          The following API-specific instructions were extracted from
          the user's requirements. These focus on API interface design aspects
          such as endpoint patterns, request/response formats, DTO schemas,
          and operation specifications.

          Follow these instructions when organizing API endpoints.
          Carefully distinguish between:
          - Suggestions or recommendations (consider these as guidance)
          - Direct specifications or explicit commands (these must be followed exactly)

          When instructions contain direct specifications or explicit design decisions,
          follow them precisely even if you believe you have better alternatives.

          ${props.instruction}
        `,
      },
    ],
    userMessage: "Design API endpoint groups please",
  };
};
