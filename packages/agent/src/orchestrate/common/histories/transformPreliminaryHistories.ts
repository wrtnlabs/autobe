import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "../structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function transformPreliminaryHistories<
  Key extends keyof IAutoBePreliminaryApplication,
>(
  prelimary: AutoBePreliminaryController<Key>,
): IAgenticaHistoryJson.IAssistantMessage[] {
  return prelimary.getKeys().map((key) =>
    transformPreliminaryHistories[key]({
      all: prelimary.getAll() as IAutoBePreliminaryCollection,
      local: prelimary.getLocal() as IAutoBePreliminaryCollection,
    }),
  );
}

/**
 * Export for type testing
 *
 * @internal
 */
export namespace transformPreliminaryHistories {
  export interface IProps<Key extends keyof IAutoBePreliminaryApplication> {
    all: Pick<IAutoBePreliminaryCollection, Key>;
    local: Pick<IAutoBePreliminaryCollection, Key>;
  }

  export const analyzeFiles = (
    props: IProps<"analyzeFiles">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const text: string = StringUtil.trim`
      ## Requirement Analysis Report

      ### List of Analysis Files

      The complete list of available analysis documents. Checkmarks (✅) indicate which ones are currently loaded into your context.

      No | FileName | Document Type | Selected
      ---|----------|---------------|----------
      ${props.all.analyzeFiles
        .map((f, i) =>
          [
            i + 1,
            JSON.stringify(f.filename),
            f.documentType,
            props.local.analyzeFiles.find((l) => l.filename === f.filename)
              ? "✅"
              : "❌",
          ].join(" | "),
        )
        .join("\n")}

      ### Currently Selected Analysis Files

      The full content of documents currently loaded into your context. Need additional documents? Call \`analyzeFiles()\` with their filenames.

      \`\`\`json
      ${JSON.stringify(props.local.analyzeFiles)}
      \`\`\`
    `;
    return {
      type: "assistantMessage",
      id: v7(),
      text,
      created_at: new Date().toISOString(),
    };
  };

  export const prismaSchemas = (
    props: IProps<"prismaSchemas">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const text: string = StringUtil.trim`
      ## Prisma DB Schema

      ### List of Prisma Schemas

      The complete list of available Prisma models.
      
      Checkmarks (✅) indicate which ones are currently loaded into your context.

      No | Schema Name | Summary | Selected
      ---|--------------|---------|----------
      ${props.all.prismaSchemas
        .map((s, i) =>
          [
            i + 1,
            JSON.stringify(s.name),
            s.description.split("\n")[0] || "",
            props.local.prismaSchemas.find((l) => l.name === s.name)
              ? "✅"
              : "❌",
          ].join(" | "),
        )
        .join("\n")}

      ### Currently Selected Prisma Schemas

      The full schema definitions of models currently loaded into your context.
      
      Need additional models? Call \`prismaSchemas()\` with their schema names.

      \`\`\`json
      ${JSON.stringify(props.local.prismaSchemas)}
      \`\`\`
    `;
    return {
      type: "assistantMessage",
      id: v7(),
      text,
      created_at: new Date().toISOString(),
    };
  };

  export const interfaceOperations = (
    props: IProps<"interfaceOperations">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const text: string = StringUtil.trim`
      ## OpenAPI Operations

      ### List of OpenAPI Operations

      The complete list of available API operations. 
      
      Checkmarks (✅) indicate which ones are currently loaded into your context.

      No | Path | Method | Summary | Selected
      ---|------|--------|---------|----------
      ${props.all.interfaceOperations
        .map((o, i) =>
          [
            i + 1,
            o.path,
            o.method,
            o.summary,
            props.local.interfaceOperations.find(
              (l) => l.path === o.path && l.method === o.method,
            )
              ? "✅"
              : "❌",
          ].join(" | "),
        )
        .join("\n")}

      ### Currently Selected OpenAPI Operations

      The full specifications of operations currently loaded into your context. 
      
      Need additional operations? Call \`interfaceOperations()\` with their endpoints (method + path).

      \`\`\`json
      ${JSON.stringify(props.local.interfaceOperations)}
      \`\`\`
    `;
    return {
      type: "assistantMessage",
      id: v7(),
      text,
      created_at: new Date().toISOString(),
    };
  };

  export const interfaceSchemas = (
    props: IProps<"interfaceSchemas">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const text: string = StringUtil.trim`
      ## OpenAPI Schemas

      ### List of OpenAPI Schemas

      The complete list of available schema types. 
      
      Checkmarks (✅) indicate which ones are currently loaded into your context.

      No | Schema Name | Summary | Selected
      ---|-------------|---------|----------
      ${Object.entries(props.all.interfaceSchemas)
        .map(([k, v], i) =>
          [
            i + 1,
            k,
            v.description.split("\n")[0] || "",
            props.local.interfaceSchemas[k] ? "✅" : "❌",
          ].join(" | "),
        )
        .join("\n")}

      ### Currently Selected OpenAPI Schemas

      The full JSON Schema definitions of types currently loaded into your context.
      
      Need additional types? Call \`interfaceSchemas()\` with their type names.

      \`\`\`json
      ${JSON.stringify(props.local.interfaceSchemas)}
      \`\`\`
    `;
    return {
      type: "assistantMessage",
      id: v7(),
      text,
      created_at: new Date().toISOString(),
    };
  };
}
