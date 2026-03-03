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
    | "analysisSections"
    | "databaseSchemas"
    | "previousAnalysisSections"
    | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  model: AutoBeDatabase.IModel;
  otherModels: AutoBeDatabase.IModel[];
}): IAutoBeOrchestrateHistory => {
  const children: string[] = props.otherModels
    .map((m) => m.name)
    .filter((s) => s.startsWith(singular(props.model.name) + "_"));

  const potentialParents = props.otherModels.filter((m) => {
    const singularParent = singular(m.name);
    return (
      props.model.name.startsWith(singularParent + "_") &&
      props.model.name !== m.name
    );
  });

  const directParent =
    potentialParents.length > 0
      ? potentialParents.reduce((a, b) =>
          a.name.length > b.name.length ? a : b,
        )
      : null;

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
      ...(directParent !== null
        ? [
            {
              id: v7(),
              created_at: new Date().toISOString(),
              type: "assistantMessage",
              text: StringUtil.trim`
                ## Parent Table Field Reference

                Your target table "${props.model.name}" is a child of "${directParent.name}".

                **Parent table fields (DO NOT duplicate these in child table)**:

                ${directParent.plainFields.length > 0 ? `Plain fields:\n${directParent.plainFields.map((f) => `- ${f.name}: ${f.type}${f.nullable ? "?" : ""}`).join("\n")}` : ""}

                ${directParent.foreignFields.length > 0 ? `Foreign key fields:\n${directParent.foreignFields.map((f) => `- ${f.name}: ${f.type} → ${f.relation.targetModel}`).join("\n")}` : ""}

                **CRITICAL - Field Duplication Check**:
                - If any field in "${props.model.name}" duplicates or mirrors a parent field, REMOVE it
                - Child tables should only have:
                  1. Own primary key (id)
                  2. Foreign key to parent (${singular(directParent.name)}_id)
                  3. Child-specific attributes that don't exist in parent
                - Access parent data via FK join, never by duplicating fields
              `,
            } satisfies IMicroAgenticaHistoryJson,
          ]
        : []),
    ],
    userMessage: "Please review the database schema.",
  };
};
