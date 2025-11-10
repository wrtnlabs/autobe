import { IAgenticaHistoryJson } from "@agentica/core";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "../structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export const transformPreliminaryHistories = <
  Key extends keyof IAutoBePreliminaryApplication,
>(
  prelimary: AutoBePreliminaryController<Key>,
): IAgenticaHistoryJson.IAssistantMessage[] =>
  prelimary.keys.map((key) =>
    (Transformer as any)[key]({
      all: prelimary.all[key],
      local: prelimary.local[key],
    }),
  );

namespace Transformer {
  export interface IProps<Key extends keyof IAutoBePreliminaryApplication> {
    all: Pick<IAutoBePreliminaryCollection, Key>;
    local: Pick<IAutoBePreliminaryCollection, Key>;
  }

  export const analyzeFile = (
    props: IProps<"analyzeFiles">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const text: string = StringUtil.trim`
      ## Requirement Analysis Report

      ### List of Analysis Files

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

      ### Currently Selected ㅁnalysis Files

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
