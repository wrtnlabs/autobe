import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { singular } from "pluralize";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
import { AutoBePreliminaryController } from "../../common/AutoBePreliminaryController";

interface ISimilarNameGroup {
  normalized: string;
  tables: Array<{ namespace: string; name: string }>;
}

const normalizeTableName = (
  tableName: string,
  prefix: string | null,
): string => {
  let name = tableName;

  // 1) Remove prefix (e.g., shopping_customers → customers)
  if (prefix !== null) {
    const snakePrefix = NamingConvention.snake(prefix) + "_";
    if (name.startsWith(snakePrefix)) {
      name = name.slice(snakePrefix.length);
    }
  }

  // 2) Remove leading "_" (e.g., _users → users)
  if (name.startsWith("_")) {
    name = name.slice(1);
  }

  // 3) Split by "_", convert each token to singular, sort, and join
  // e.g., bbs_user_articles → ["bbs", "user", "article"] → ["article", "bbs", "user"] → "article_bbs_user"
  // e.g., bbs_article_users → ["bbs", "article", "user"] → ["article", "bbs", "user"] → "article_bbs_user"
  const tokens = name.split("_").map((token) => singular(token));
  tokens.sort();
  return tokens.join("_");
};

const findSimilarNamedTables = (
  allComponents: AutoBeDatabaseComponent[],
  prefix: string | null,
): ISimilarNameGroup[] => {
  const map = new Map<string, Array<{ namespace: string; name: string }>>();

  for (const comp of allComponents) {
    for (const table of comp.tables) {
      const norm = normalizeTableName(table.name, prefix);
      if (!map.has(norm)) map.set(norm, []);
      map.get(norm)!.push({ namespace: comp.namespace, name: table.name });
    }
  }

  // Return only groups with 2+ tables
  return [...map.entries()]
    .filter(([_, tables]) => tables.length >= 2)
    .map(([normalized, tables]) => ({ normalized, tables }));
};

const formatSimilarNameHints = (groups: ISimilarNameGroup[]): string => {
  if (groups.length === 0) {
    return "No tables with similar normalized names found.";
  }

  const rows = groups
    .map((g) => {
      const tableList = g.tables
        .map((t) => `\`${t.namespace}.${t.name}\``)
        .join(", ");
      return `| \`${g.normalized}\` | ${tableList} |`;
    })
    .join("\n");

  return StringUtil.trim`
| Normalized Name | Tables |
|-----------------|--------|
${rows}
  `;
};

export const transformPrismaDeduplicationHistory = (props: {
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "previousAnalysisFiles" | "previousDatabaseSchemas"
  >;
  component: AutoBeDatabaseComponent;
  allComponents: AutoBeDatabaseComponent[];
  instruction: string;
  prefix: string | null;
}): IAutoBeOrchestrateHistory => {
  const similarNameGroups = findSimilarNamedTables(
    props.allComponents,
    props.prefix,
  );
  const similarNameHints = formatSimilarNameHints(similarNameGroups);

  return {
    histories: [
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: AutoBeSystemPromptConstant.DATABASE_DEDUPLICATION,
      },
      ...props.preliminary.getHistories(),
      {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: StringUtil.trim`
          ## Component to Review (Deduplication)

          ${props.prefix !== null ? `**Table Prefix**: \`${NamingConvention.snake(props.prefix)}\`` : ""}

          ### Target Component

          - **Namespace**: \`${props.component.namespace}\`
          - **Filename**: \`${props.component.filename}\`

          ### Target Component Tables

          ${JSON.stringify(props.component.tables, null, 2)}

          ### All Components Tables

          The following shows ALL tables across ALL components (including the target).
          Compare the target component's tables against tables in other components
          to identify semantic duplicates.

          ${JSON.stringify(props.allComponents, null, 2)}

          ### Naming Similarity Hints (Potential Duplicates)

          Tables with the **same normalized name** (prefix removed + each token converted to singular + sorted alphabetically) are strong duplicate candidates.

          **Example**: \`bbs_user_articles\` and \`bbs_article_users\` both normalize to \`article_bbs_user\`.

          ${similarNameHints}

          **IMPORTANT**: Tables in the same similarity group are **strong candidates** for semantic duplicates. Review these pairs carefully and group them if they serve the same purpose.

          ### User Instructions

          ${props.instruction}
        `,
      },
    ],
    userMessage: StringUtil.trim`
      Review the "${props.component.namespace}" component's tables for semantic duplicates.

      **Your task**: Compare each table in the "${props.component.namespace}" component against
      tables in ALL other components. Identify tables that serve the **same purpose**
      even if they have different names.

      1. First, fetch analysis files using \`getAnalysisFiles\` to understand the business context
      2. **Check the Naming Similarity Hints first** — tables with the same normalized name are strong duplicate candidates
      3. For each target table, compare its name AND description against every table in other components
      4. If two tables serve the same purpose → group them as duplicates
      5. Call \`process({ request: { type: "complete", review: "...", duplicateGroups: [...] } })\`

      **Rules**:
      - Each duplicate group must have at least 2 tables
      - Each group must include at least 1 table from "${props.component.namespace}"
      - Parent-child relationships are NOT duplicates
      - Snapshot/history tables are NOT duplicates of their source tables
      - If no duplicates found, return an empty duplicateGroups array
    `,
  };
};
