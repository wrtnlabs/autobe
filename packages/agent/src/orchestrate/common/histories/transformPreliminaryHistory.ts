import {
  IAgenticaHistoryJson,
  IMicroAgenticaHistoryJson,
} from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  // AutoBePreliminaryKind,
  AutoBePrisma,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import { v7 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export const transformPreliminaryHistory = <Kind extends AutoBePreliminaryKind>(
  preliminary: AutoBePreliminaryController<Kind>,
): IMicroAgenticaHistoryJson[] => [
  ...preliminary
    .getKinds()
    .map((key): IMicroAgenticaHistoryJson[] =>
      Transformer[key]({
        source: preliminary.getSource(),
        all: preliminary.getAll() as IAutoBePreliminaryCollection,
        local: preliminary.getLocal() as IAutoBePreliminaryCollection,
      }),
    )
    .flat(),
];

namespace Transformer {
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    all: Pick<IAutoBePreliminaryCollection, Kind>;
    local: Pick<IAutoBePreliminaryCollection, Kind>;
  }

  export const analysisFiles = (
    props: IProps<"analysisFiles">,
  ): IMicroAgenticaHistoryJson[] => {
    const oldbie: Record<string, AutoBeAnalyzeFile> = Object.fromEntries(
      props.local.analysisFiles.map((f) => [f.filename, f]),
    );
    const newbie: AutoBeAnalyzeFile[] = props.all.analysisFiles.filter(
      (f) => oldbie[f.filename] === undefined,
    );

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_LOADED,
        content: oldbie,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE,
      available: newbie.map((f) => `- ${f.filename}`).join("\n"),
      loaded: props.local.analysisFiles
        .map((f) => `- ${f.filename}`)
        .join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED
          : "",
    });
    return props.local.analysisFiles.length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "analysisFiles",
            arguments: {
              request: {
                type: "getAnalysisFiles",
                fileNames: props.local.analysisFiles.map((f) => f.filename),
              },
            },
          }),
          assistant,
          system,
        ];
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

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_LOADED,
        content: oldbie,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA,
      available: newbie.map((s) => `- ${s.name}`).join("\n"),
      loaded: props.local.prismaSchemas.map((s) => `- ${s.name}`).join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_EXHAUSTED
          : "",
    });
    return props.local.prismaSchemas.length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "prismaSchemas",
            arguments: {
              request: {
                type: "getPrismaSchemas",
                schemaNames: props.local.prismaSchemas.map((s) => s.name),
              },
            },
          }),
          assistant,
          system,
        ];
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

    const tableRow = (o: AutoBeOpenApi.IEndpoint): string =>
      `${o.method} | ${o.path}`;
    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt:
          AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_LOADED,
        content: props.local.interfaceOperations,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION,
      available: newbie.map(tableRow).join("\n"),
      loaded: oldbie.toJSON().map(tableRow).join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_EXHAUSTED
          : "",
    });
    return props.local.interfaceOperations.length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "interfaceOperations",
            arguments: {
              request: {
                type: "getInterfaceOperations",
                endpoints: oldbie.toJSON(),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  export const interfaceSchemas = (
    props: IProps<"interfaceSchemas">,
  ): IMicroAgenticaHistoryJson[] => {
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [k, v] of Object.entries(props.all.interfaceSchemas))
      if (props.local.interfaceSchemas[k] === undefined) newbie[k] = v;

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_LOADED,
        content: props.local.interfaceSchemas,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA,
      available: Object.keys(newbie)
        .map((k) => `- ${k}`)
        .join("\n"),
      loaded: Object.keys(props.local.interfaceSchemas)
        .map((k) => `- ${k}`)
        .join("\n"),
      exhausted:
        Object.keys(newbie).length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_EXHAUSTED
          : "",
    });
    return Object.keys(props.local.interfaceSchemas).length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "interfaceSchemas",
            arguments: {
              request: {
                type: "getInterfaceSchemas",
                typeNames: Object.keys(props.local.interfaceSchemas),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  // experimenting between assistantMessage and execute types
  const createFunctionCallingMessage = <
    Kind extends AutoBePreliminaryKind,
  >(props: {
    controller: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    kind: Kind;
    arguments: IAutoBePreliminaryRequest<Kind>;
  }):
    | IAgenticaHistoryJson.IAssistantMessage
    | IAgenticaHistoryJson.IExecute => ({
    type: "execute",
    id: v7(),
    operation: {
      protocol: "class",
      controller: props.controller,
      function: "process",
      name: "process",
    },
    arguments: props.arguments as any,
    value: undefined,
    success: true,
    created_at: new Date().toISOString(),
    // type: "assistantMessage",
    // id: v7(),
    // text: StringUtil.trim`
    //   # Function Calling History

    //   Function "${props.function}()" has been called.

    //   Here is the arguments.

    //   Note that, never call the same items again.
    //   As they are loaded onto the memory, you never have to
    //   request none of them again.

    //   \`\`\`json
    //   ${JSON.stringify(props.argument)}
    //   \`\`\`
    // `,
    // created_at: new Date().toISOString(),
  });

  const createAssistantMessage = (props: {
    prompt: string;
    content: object;
  }): IAgenticaHistoryJson.IAssistantMessage => ({
    id: v7(),
    type: "assistantMessage",
    text: props.prompt.replaceAll(
      "{{CONTENT}}",
      StringUtil.trim`
        \`\`\`json
        ${JSON.stringify(props.content)}
        \`\`\`
      `,
    ),
    created_at: new Date().toISOString(),
  });

  const createSystemMessage = (props: {
    prompt: string;
    available: string;
    loaded: string;
    exhausted: string;
  }): IAgenticaHistoryJson.ISystemMessage => ({
    id: v7(),
    type: "systemMessage",
    text: props.prompt
      .replaceAll("{{AVAILABLE}}", props.available)
      .replaceAll("{{LOADED}}", props.loaded)
      .replaceAll("{{EXHAUSTED}}", props.exhausted),
    created_at: new Date().toISOString(),
  });
}
