import { IAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  AutoBePrisma,
} from "@autobe/interface";
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
  return prelimary
    .getKeys()
    .map((key) =>
      transformPreliminaryHistory[key]({
        all: prelimary.getAll() as IAutoBePreliminaryCollection,
        local: prelimary.getLocal() as IAutoBePreliminaryCollection,
      }),
    )
    .flat();
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
  ): IAgenticaHistoryJson.IAssistantMessage[] => {
    const oldbie: Record<string, AutoBeAnalyzeFile> = Object.fromEntries(
      props.local.analyzeFiles.map((f) => [f.filename, f]),
    );
    const newbie: AutoBeAnalyzeFile[] = props.all.analyzeFiles.filter(
      (f) => oldbie[f.filename] === undefined,
    );

    const out = (text: string): IAgenticaHistoryJson.IAssistantMessage[] => {
      const describe: IAgenticaHistoryJson.IAssistantMessage = {
        type: "assistantMessage",
        id: v7(),
        text,
        created_at: new Date().toISOString(),
      };
      return props.local.analyzeFiles.length === 0
        ? [describe]
        : [
            createFunctionCallingMessage({
              function: "analyzeFiles",
              argument: {
                filenames: props.local.analyzeFiles.map((f) => f.filename),
              },
            }),
          ];
    };
    if (newbie.length === 0)
      return out(
        createAllLoadedMessage(
          "Requirement Analysis Documents",
          "analyzeFiles",
          oldbie,
        ),
      );
    return out(StringUtil.trim`
      # Requirement Analysis Documents

      ## Already Loaded Analysis Documents

      The documents below have been previously loaded through \`analyzeFiles()\`
      calls and their full content is ALREADY AVAILABLE in your conversation history.

      **Already loaded files**:

      \`\`\`json
      ${JSON.stringify(
        Object.fromEntries(
          props.local.analyzeFiles.map((f) => [f.filename, f]),
        ),
      )}
      \`\`\`

      ## Available Requirement Analysis Documents

      Below shows documents NOT YET loaded. You can request these if needed
      for your task by calling \`analyzeFiles()\` function.

      **Available files**:

      File Name | Document Type
      ----------|---------------
      ${newbie
        .map((f) => [JSON.stringify(f.filename), f.documentType].join(" | "))
        .join("\n")}
    `);
  };

  export const prismaSchemas = (
    props: IProps<"prismaSchemas">,
  ): IAgenticaHistoryJson.IAssistantMessage[] => {
    const oldbie: Record<string, AutoBePrisma.IModel> = Object.fromEntries(
      props.local.prismaSchemas.map((s) => [s.name, s]),
    );
    const newbie: AutoBePrisma.IModel[] = props.all.prismaSchemas.filter(
      (s) => oldbie[s.name] === undefined,
    );
    const out = (text: string): IAgenticaHistoryJson.IAssistantMessage[] => {
      const describe: IAgenticaHistoryJson.IAssistantMessage = {
        type: "assistantMessage",
        id: v7(),
        text,
        created_at: new Date().toISOString(),
      };
      return props.local.prismaSchemas.length === 0
        ? [describe]
        : [
            createFunctionCallingMessage({
              function: "prismaSchemas",
              argument: {
                schemaNames: props.local.prismaSchemas.map((s) => s.name),
              },
            }),
          ];
    };
    if (newbie.length === 0)
      return out(
        createAllLoadedMessage(
          "Prisma Database Models",
          "prismaSchemas",
          oldbie,
        ),
      );
    return out(StringUtil.trim`
      # Prisma Database Models

      ## Already Loaded Prisma Models

      The models below have been previously loaded through \`prismaSchemas()\`
      calls and their full definitions are ALREADY AVAILABLE in your conversation history.

      **Already loaded models**:

      \`\`\`json
      ${JSON.stringify(oldbie)}
      \`\`\`

      ## Available Prisma Database Models

      Below shows models NOT YET loaded. You can request these if needed
      for your task by calling \`prismaSchemas()\` function.

      **Available models**:

      Schema Name | Summary
      ------------|---------
      ${newbie
        .map((s) => [s.name, getSummary(s.description)].join(" | "))
        .join("\n")}
    `);
  };

  export const interfaceOperations = (
    props: IProps<"interfaceOperations">,
  ): IAgenticaHistoryJson.IAssistantMessage[] => {
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
    const out = (text: string): IAgenticaHistoryJson.IAssistantMessage[] => {
      const describe: IAgenticaHistoryJson.IAssistantMessage = {
        type: "assistantMessage",
        id: v7(),
        text,
        created_at: new Date().toISOString(),
      };
      return props.local.interfaceOperations.length === 0
        ? [describe]
        : [
            createFunctionCallingMessage({
              function: "interfaceOperations",
              argument: {
                endpoints: props.local.interfaceOperations.map((o) => ({
                  method: o.method,
                  path: o.path,
                })),
              },
            }),
          ];
    };
    if (newbie.length === 0)
      return out(
        createAllLoadedMessage(
          "API Operations",
          "interfaceOperations",
          props.local.interfaceOperations,
        ),
      );

    return out(StringUtil.trim`
      # API Operations

      ## Already Loaded API Operations

      The operations below have been previously loaded through
      \`interfaceOperations()\` calls and their full specifications
      are ALREADY AVAILABLE in your conversation history.

      **Already loaded operations**:

      \`\`\`json
      ${JSON.stringify(props.local.interfaceOperations)}
      \`\`\`

      ## Available API Operations

      Below shows operations NOT YET loaded. You can request these if needed
      for your task by calling \`interfaceOperations()\` function.

      **Available operations**:

      Path | Method | Summary
      -----|--------|--------
      ${newbie.map((o) => [o.path, o.method, o.summary].join(" | ")).join("\n")}
    `);
  };

  export const interfaceSchemas = (
    props: IProps<"interfaceSchemas">,
  ): IAgenticaHistoryJson.IAssistantMessage[] => {
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [k, v] of Object.entries(props.all.interfaceSchemas))
      if (props.local.interfaceSchemas[k] === undefined) newbie[k] = v;

    const out = (text: string): IAgenticaHistoryJson.IAssistantMessage[] => {
      const describe: IAgenticaHistoryJson.IAssistantMessage = {
        type: "assistantMessage",
        id: v7(),
        text,
        created_at: new Date().toISOString(),
      };
      return Object.keys(props.local.interfaceSchemas).length === 0
        ? [describe]
        : [
            createFunctionCallingMessage({
              function: "interfaceSchemas",
              argument: {
                typeNames: Object.keys(props.local.interfaceSchemas),
              },
            }),
          ];
    };
    if (Object.keys(newbie).length === 0)
      return out(
        createAllLoadedMessage(
          "TypeScript Type Schemas",
          "interfaceSchemas",
          props.local.interfaceSchemas,
        ),
      );

    return out(StringUtil.trim`
      # TypeScript Type Schemas

      ## Already Loaded Type Schemas

      The schemas below have been previously loaded through \`interfaceSchemas()\`
      calls and their full definitions are ALREADY AVAILABLE in your conversation history.

      **Already loaded schemas**:

      \`\`\`json
      ${JSON.stringify(props.local.interfaceSchemas)}
      \`\`\`

      ## Available TypeScript Type Schemas

      Below shows schemas NOT YET loaded. You can request these if needed
      for your task by calling \`interfaceSchemas()\` function.

      **Available schemas**:

      Type Name | Summary
      ----------|---------
      ${Object.entries(newbie)
        .map(([k, v]) => [k, getSummary(v.description)].join(" | "))
        .join("\n")}
    `);
  };

  const createAllLoadedMessage = (
    title: string,
    functionName: AutoBePreliminaryKind,
    oldbie: object,
  ): string =>
    StringUtil.trim`
      # ${title}

      ALL data has been loaded. The complete data is ALREADY AVAILABLE in your conversation history.

      NEVER call \`${functionName}()\` again - all data is present.

      **Already loaded data**:

      \`\`\`json
      ${JSON.stringify(oldbie)}
      \`\`\`
    `;

  const createFunctionCallingMessage = <
    Function extends AutoBePreliminaryKind,
  >(props: {
    function: Function;
    argument: Parameters<IAutoBePreliminaryApplication[Function]>[0];
  }): IAgenticaHistoryJson.IAssistantMessage => ({
    type: "assistantMessage",
    id: v7(),
    text: StringUtil.trim`
      Function "${props.function}()" has been called.

      Here is the arguments.

      Note that, never call the same items again. 
      As they are loaded onto the memory, you never have to 
      request none of them again.

      \`\`\`json
      ${JSON.stringify(props.argument)}
      \`\`\`
    `,
    created_at: new Date().toISOString(),
  });

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
