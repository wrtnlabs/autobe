import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeDatabase, AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { singular } from "pluralize";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

export const transformPrismaSchemaReviewHistory = (props: {
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "databaseSchemas"
    | "previousAnalysisFiles"
    | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  model: AutoBeDatabase.IModel;
  otherModels: AutoBeDatabase.IModel[];
}): IAutoBeOrchestrateHistory => {
  const children: string[] = props.otherModels
    .map((m) => m.name)
    .filter((s) => s.startsWith(singular(props.model.name) + "_"));
  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_SCHEMA,
      },
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_SCHEMA_REVIEW,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          Now, please review the target table "${props.model.name}"
          in the "${props.component.namespace}" namespace.

          Focus your review exclusively on the target table
          "${props.model.name}".

          When reviewing, ensure the model is correctly designed. If
          the table needs additional child tables for 1NF decomposition
          (repeating groups or non-atomic values), declare them as
          newDesigns entries with names starting with the
          "${singular(props.model.name)}_" prefix.

          If modifications are needed, return the corrected model
          and any newDesigns, or null if no changes are required.
        `,
      },
      ...(children.length !== 0
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage",
              text: StringUtil.trim`
                ## Child Table Collision Warning

                The following child tables are already assigned to other
                agents, so do NOT recreate them and your child table names
                must NOT collide with any of them:

                ${children.map((t) => `- ${t}`).join("\n")}
              `,
            } satisfies IMicroAgenticaHistoryJson,
          ]
        : []),
    ],
    userMessage: "Please review the database schema.",
  };
};
