import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import { v7 } from "uuid";

import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "../structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export function transformPreliminaryHistory<
  Key extends keyof IAutoBePreliminaryApplication,
>(
  prelimary: AutoBePreliminaryController<Key>,
): IAgenticaHistoryJson.IAssistantMessage[] {
  return prelimary.getKeys().map((key) =>
    transformPreliminaryHistory[key]({
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
export namespace transformPreliminaryHistory {
  export interface IProps<Key extends keyof IAutoBePreliminaryApplication> {
    all: Pick<IAutoBePreliminaryCollection, Key>;
    local: Pick<IAutoBePreliminaryCollection, Key>;
  }

  export const analyzeFiles = (
    props: IProps<"analyzeFiles">,
  ): IAgenticaHistoryJson.IAssistantMessage => {
    const oldbie: Record<string, AutoBeAnalyzeFile> = Object.fromEntries(
      props.local.analyzeFiles.map((f) => [f.filename, f]),
    );
    const newbie: AutoBeAnalyzeFile[] = props.all.analyzeFiles.filter(
      (f) => oldbie[f.filename] === undefined,
    );
    const text: string = StringUtil.trim`
      ## Available Requirement Analysis Documents

      Below shows unloaded analysis documents containing user requirements, 
      feature specifications, and business logic descriptions.

      To retrieve additional information needed for your task, call \`analyzeFiles()\` 
      function with the filenames from this list.

      Never request documents not listed here, especially those already loaded 
      in the section below.

      File Name | Document Type
      ----------|---------------
      ${newbie
        .map((f) => [JSON.stringify(f.filename), f.documentType].join(" | "))
        .join("\n")}

      ## Already Loaded Analysis Documents

      The documents below have been previously loaded through \`analyzeFiles()\` 
      calls and their full content is already in your context.

      Never request these documents again through \`analyzeFiles()\` function 
      under any circumstances. 

      \`\`\`json
      ${JSON.stringify(
        Object.fromEntries(
          props.local.analyzeFiles.map((f) => [f.filename, f]),
        ),
      )}
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
    const oldbie: Record<string, AutoBePrisma.IModel> = Object.fromEntries(
      props.local.prismaSchemas.map((s) => [s.name, s]),
    );
    const newbie: AutoBePrisma.IModel[] = props.all.prismaSchemas.filter(
      (s) => oldbie[s.name] === undefined,
    );
    const text: string = StringUtil.trim`
      ## Available Prisma Database Models

      Below shows unloaded Prisma models defining database structure 
      including fields, relations, indexes, and constraints.

      To retrieve additional information needed for your task, call 
      \`prismaSchemas()\` function with the schema names from this list.

      Never request schemas not listed here, especially those already loaded 
      in the section below.

      Schema Name | Summary
      ------------|---------
      ${newbie
        .map((s) => [s.name, getSummary(s.description)].join(" | "))
        .join("\n")}

      ## Already Loaded Prisma Models

      The models below have been previously loaded through \`prismaSchemas()\` 
      calls and their full definitions are already in your context.

      Never request these models again through \`prismaSchemas()\` function 
      under any circumstances. 

      \`\`\`json
      ${JSON.stringify(
        Object.fromEntries(props.local.prismaSchemas.map((s) => [s.name, s])),
      )}
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
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.local.interfaceOperations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const newbie: AutoBeOpenApi.IOperation[] =
      props.all.interfaceOperations.filter(
        (o) =>
          oldbie.has({
            method: o.method,
            path: o.path,
          }) === false,
      );
    const text: string = StringUtil.trim`
      ## Available API Operations

      Below shows unloaded API endpoints defining HTTP method, path, parameters, 
      request/response schemas, and documentation.

      To retrieve additional information needed for your task, call 
      \`interfaceOperations()\` function with the endpoints from this list.

      Never request operations not listed here, especially those already loaded 
      in the section below.

      Path | Method | Summary
      -----|--------|--------
      ${newbie.map((o) => [o.path, o.method, o.summary].join(" | ")).join("\n")}

      ## Already Loaded API Operations

      The operations below have been previously loaded through 
      \`interfaceOperations()\` calls and their full specifications 
      are already in your context.

      Never request these operations again through \`interfaceOperations()\` function 
      under any circumstances.

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
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [k, v] of Object.entries(props.all.interfaceSchemas))
      if (props.local.interfaceSchemas[k] === undefined) newbie[k] = v;
    const text: string = StringUtil.trim`
      ## Available TypeScript Type Schemas

      Below shows unloaded type definitions containing detailed JSON Schema with 
      properties, validation rules, and constraints.

      To retrieve additional information needed for your task, call 
      \`interfaceSchemas()\` function with the type names from this list.

      Never request schemas not listed here, especially those already loaded 
      in the section below.

      Type Name | Summary
      ----------|---------
      ${Object.entries(newbie)
        .map(([k, v]) => [k, getSummary(v.description)].join(" | "))
        .join("\n")}

      ## Already Loaded Type Schemas

      The schemas below have been previously loaded through \`interfaceSchemas()\` 
      calls and their full definitions are already in your context.

      Never request these schemas again through \`interfaceSchemas()\` function 
      under any circumstances.

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

  const getSummary = (description: string): string => {
    const newLineIndex: number = description.indexOf("\n");
    const dotIndex: number = description.indexOf(".");
    const index: number = Math.min(
      newLineIndex === -1 ? Infinity : newLineIndex,
      dotIndex === -1 ? Infinity : dotIndex + 1,
    );
    return index === Infinity ? "" : description.slice(0, index).trim();
  };
}
