import {
  IAgenticaHistoryJson,
  IMicroAgenticaHistoryJson,
} from "@agentica/core";
import {
  AutoBeEventSource,
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
>(preliminary: AutoBePreliminaryController<Key>): IMicroAgenticaHistoryJson[] {
  return preliminary
    .getKeys()
    .map((key): IMicroAgenticaHistoryJson[] =>
      transformPreliminaryHistory[key]({
        source: preliminary.getSource(),
        all: preliminary.getAll() as IAutoBePreliminaryCollection,
        local: preliminary.getLocal() as IAutoBePreliminaryCollection,
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
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    all: Pick<IAutoBePreliminaryCollection, Key>;
    local: Pick<IAutoBePreliminaryCollection, Key>;
  }

  export const analyzeFiles = (
    props: IProps<"analyzeFiles">,
  ): IMicroAgenticaHistoryJson[] => {
    const oldbie: Record<string, AutoBeAnalyzeFile> = Object.fromEntries(
      props.local.analyzeFiles.map((f) => [f.filename, f]),
    );
    const newbie: AutoBeAnalyzeFile[] = props.all.analyzeFiles.filter(
      (f) => oldbie[f.filename] === undefined,
    );
    const out = (text: string): IMicroAgenticaHistoryJson[] => {
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
              controller: props.source,
              function: "analyzeFiles",
              argument: {
                filenames: props.local.analyzeFiles.map((f) => f.filename),
              },
            }),
            describe,
          ];
    };
    const available: string =
      newbie.length === 0
        ? StringUtil.trim`
            You have taken every analysis documents. 
            
            Every analysis documents are loaded onth the memory, 
            so never call \`analyzeFiles()\` function again.
          `
        : StringUtil.trim`
            Below shows documents NOT YET loaded. 
          
            You can request these if needed for your task by calling \`analyzeFiles()\` function.

            By the way, when requesting, never call the same files
            (that are listed in the below sections) again as they are 
            already loaded onto the memory.

            **Available files**:

            File Name | Document Type
            ----------|---------------
            ${newbie
              .map((f) =>
                [JSON.stringify(f.filename), f.documentType].join(" | "),
              )
              .join("\n")}
          `;
    return out(StringUtil.trim`
      # Requirement Analysis Documents

      ## Available Requirement Analysis Documents

      ${available}

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

      ## Never Call Again

      Repeat that, they are still stored in memory.

      Never call \`analyzeFiles()\` again about the below files.

      ${props.local.analyzeFiles.map((f) => `- ${f.filename}`).join("\n")}
    `);
  };

  export const prismaSchemas = (
    props: IProps<"prismaSchemas">,
  ): IMicroAgenticaHistoryJson[] => {
    const oldbie: Record<string, AutoBePrisma.IModel> = Object.fromEntries(
      props.local.prismaSchemas.map((s) => [s.name, s]),
    );
    const newbie: AutoBePrisma.IModel[] = props.all.prismaSchemas.filter(
      (s) => oldbie[s.name] === undefined,
    );
    const out = (text: string): IMicroAgenticaHistoryJson[] => {
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
              controller: props.source,
              function: "prismaSchemas",
              argument: {
                schemaNames: props.local.prismaSchemas.map((s) => s.name),
              },
            }),
            describe,
          ];
    };
    const available: string =
      newbie.length === 0
        ? StringUtil.trim`
        You have taken every Prisma models.

        Every Prisma models are loaded onto the memory,
        so never call \`prismaSchemas()\` function again.
      `
        : StringUtil.trim`
        Below shows models NOT YET loaded.

        You can request these if needed for your task by calling \`prismaSchemas()\` function.

        By the way, when requesting, never call the same models
        (that are listed in the below sections) again as they are
        already loaded onto the memory.

        **Available models**:

        Schema Name | Summary
        ------------|---------
        ${newbie
          .map((s) => [s.name, getSummary(s.description)].join(" | "))
          .join("\n")}
      `;
    return out(StringUtil.trim`
      # Prisma Database Models

      ## Available Prisma Database Models

      ${available}

      ## Already Loaded Prisma Models

      The models below have been previously loaded through \`prismaSchemas()\`
      calls and their full definitions are ALREADY AVAILABLE in your conversation history.

      **Already loaded models**:

      \`\`\`json
      ${JSON.stringify(oldbie)}
      \`\`\`

      ## Never Call Again

      Repeat that, they are still stored in memory.

      Never call \`prismaSchemas()\` again about the below models.

      ${props.local.prismaSchemas.map((s) => `- ${s.name}`).join("\n")}
    `);
  };

  export const interfaceOperations = (
    props: IProps<"interfaceOperations">,
  ): IMicroAgenticaHistoryJson[] => {
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
    const out = (text: string): IMicroAgenticaHistoryJson[] => {
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
              controller: props.source,
              function: "interfaceOperations",
              argument: {
                endpoints: props.local.interfaceOperations.map((o) => ({
                  method: o.method,
                  path: o.path,
                })),
              },
            }),
            describe,
          ];
    };
    const available: string =
      newbie.length === 0
        ? StringUtil.trim`
        You have taken every API operations.

        Every API operations are loaded onto the memory,
        so never call \`interfaceOperations()\` function again.
      `
        : StringUtil.trim`
        Below shows operations NOT YET loaded.

        You can request these if needed for your task by calling \`interfaceOperations()\` function.

        By the way, when requesting, never call the same operations
        (that are listed in the below sections) again as they are
        already loaded onto the memory.

        **Available operations**:

        Path | Method | Summary
        -----|--------|--------
        ${newbie.map((o) => [o.path, o.method, o.summary].join(" | ")).join("\n")}
      `;
    return out(StringUtil.trim`
      # API Operations

      ## Available API Operations

      ${available}

      ## Already Loaded API Operations

      The operations below have been previously loaded through
      \`interfaceOperations()\` calls and their full specifications
      are ALREADY AVAILABLE in your conversation history.

      **Already loaded operations**:

      \`\`\`json
      ${JSON.stringify(props.local.interfaceOperations)}
      \`\`\`

      ## Never Call Again

      Repeat that, they are still stored in memory.

      Never call \`interfaceOperations()\` again about the below operations.

      ${props.local.interfaceOperations.map((o) => `- ${o.method.toUpperCase()} ${o.path}`).join("\n")}
    `);
  };

  export const interfaceSchemas = (
    props: IProps<"interfaceSchemas">,
  ): IMicroAgenticaHistoryJson[] => {
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [k, v] of Object.entries(props.all.interfaceSchemas))
      if (props.local.interfaceSchemas[k] === undefined) newbie[k] = v;

    const out = (text: string): IMicroAgenticaHistoryJson[] => {
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
              controller: props.source,
              function: "interfaceSchemas",
              argument: {
                typeNames: Object.keys(props.local.interfaceSchemas),
              },
            }),
            describe,
          ];
    };
    const available: string =
      Object.keys(newbie).length === 0
        ? StringUtil.trim`
        You have taken every TypeScript type schemas.

        Every TypeScript type schemas are loaded onto the memory,
        so never call \`interfaceSchemas()\` function again.
      `
        : StringUtil.trim`
        Below shows schemas NOT YET loaded.

        You can request these if needed for your task by calling \`interfaceSchemas()\` function.

        By the way, when requesting, never call the same schemas
        (that are listed in the below sections) again as they are
        already loaded onto the memory.

        **Available schemas**:

        Type Name | Summary
        ----------|---------
        ${Object.entries(newbie)
          .map(([k, v]) => [k, getSummary(v.description)].join(" | "))
          .join("\n")}
      `;
    return out(StringUtil.trim`
      # TypeScript Type Schemas

      ## Available TypeScript Type Schemas

      ${available}

      ## Already Loaded Type Schemas

      The schemas below have been previously loaded through \`interfaceSchemas()\`
      calls and their full definitions are ALREADY AVAILABLE in your conversation history.

      **Already loaded schemas**:

      \`\`\`json
      ${JSON.stringify(props.local.interfaceSchemas)}
      \`\`\`

      ## Never Call Again

      Repeat that, they are still stored in memory.

      Never call \`interfaceSchemas()\` again about the below schemas.

      ${Object.keys(props.local.interfaceSchemas)
        .map((k) => `- ${k}`)
        .join("\n")}
    `);
  };

  const createFunctionCallingMessage = <
    Function extends AutoBePreliminaryKind,
  >(props: {
    controller: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    function: Function;
    argument: Parameters<IAutoBePreliminaryApplication[Function]>[0];
  }): IMicroAgenticaHistoryJson => ({
    // type: "execute",
    // id: v7(),
    // operation: {
    //   protocol: "class",
    //   controller: props.controller,
    //   function: props.function,
    //   name: props.function,
    // },
    // arguments: props.argument as any,
    // value: undefined,
    // success: true,
    // created_at: new Date().toISOString(),
    type: "assistantMessage",
    id: v7(),
    text: StringUtil.trim`
      # Function Calling History

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
