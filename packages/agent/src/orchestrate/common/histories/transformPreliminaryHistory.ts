import {
  IAgenticaHistoryJson,
  IMicroAgenticaHistoryJson,
} from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  AutoBePrisma,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import {
  AutoBeOpenApiEndpointComparator,
  StringUtil,
  writePrismaApplication,
} from "@autobe/utils";
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
        config: preliminary.getConfig() as any,
      }),
    )
    .flat(),
];

namespace Transformer {
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    all: Pick<IAutoBePreliminaryCollection, Kind>;
    local: Pick<IAutoBePreliminaryCollection, Kind>;
    config: AutoBePreliminaryController.IConfig<Kind>;
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
        content: toJsonBlock(oldbie),
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE,
      available: StringUtil.trim`
        \`\`\`json
        ${JSON.stringify(
          newbie.map((f) => ({
            filename: f.filename,
            documentType: f.documentType,
            audience: f.audience,
            outline: f.outline,
            keyQuestions: f.keyQuestions,
          })),
        )}
        \`\`\`
      `,
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
              thinking: "analysis files for detailed requirements' analyses",
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
        content:
          props.config.prisma === "ast"
            ? StringUtil.trim`
                ## Prisma AST Data

                ${toJsonBlock(oldbie)}
              `
            : StringUtil.trim`
                ## Prisma Schema Files

                \`\`\`prisma
                ${writePrismaApplication({
                  dbms: "postgres",
                  application: {
                    files: [
                      {
                        filename: "all.prisma",
                        namespace: "All",
                        models: Object.values(oldbie),
                      },
                    ],
                  },
                })}
                \`\`\
              `,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA,
      available: StringUtil.trim`
        Name | Stance | Summary
        -----|--------|---------
        ${newbie
          .map((m) =>
            [m.name, m.stance, StringUtil.summary(m.description)].join(" | "),
          )
          .join("\n")}
      `,
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
              thinking: "prisma schemas for DB schema information",
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

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt:
          AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_LOADED,
        content: toJsonBlock(props.local.interfaceOperations),
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION,
      available: StringUtil.trim`
        Method | Path | Actor? | Authorization? | Summary
        -------|------|--------|----------------|---------
        ${newbie
          .map((o) =>
            [
              o.method,
              o.path,
              o.authorizationActor ?? "-",
              o.authorizationType ?? "-",
              StringUtil.summary(o.description),
            ].join(" | "),
          )
          .join("\n")}
      `,
      loaded: StringUtil.trim`
        Method | Path
        -------|-------
        ${oldbie
          .toJSON()
          .map((e) => [e.method, e.path].join(" | "))
          .join("\n")}
      `,
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
              thinking:
                "interface operations for detailed endpoint information",
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
        content: toJsonBlock(props.local.interfaceSchemas),
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA,
      available: StringUtil.trim`
        Name | Summary
        -----|---------
        ${Object.entries(newbie)
          .map(([name, schema]) =>
            [name, StringUtil.summary(schema.description)].join(" | "),
          )
          .join("\n")}
      `,
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
              thinking: "interface schemas for detailed schema information",
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

  export const realizeCollectors = (
    props: IProps<"realizeCollectors">,
  ): IMicroAgenticaHistoryJson[] => {
    const oldbie: Record<string, AutoBeRealizeCollectorFunction> =
      Object.fromEntries(
        props.local.realizeCollectors.map((c) => [c.plan.dtoTypeName, c]),
      );
    const newbie: AutoBeRealizeCollectorFunction[] =
      props.all.realizeCollectors.filter(
        (c) => oldbie[c.plan.dtoTypeName] === undefined,
      );

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_COLLECTOR_LOADED,
        content: toJsonBlock(oldbie),
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_COLLECTOR,
      available: StringUtil.trim`
        DTO Type Name | Prisma Table | References | Neighbor Collectors
        --------------|--------------|------------|--------------------
        ${newbie
          .map((c) =>
            [
              c.plan.dtoTypeName,
              c.plan.prismaSchemaName,
              c.plan.references.length > 0
                ? `(${c.plan.references.map((r) => r.source).join(", ")})`
                : "-",
              `(${c.neighbors.join(", ")})`,
            ].join(" | "),
          )
          .join("\n")}
      `,
      loaded: props.local.realizeCollectors
        .map((c) => `- ${c.plan.dtoTypeName}`)
        .join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_COLLECTOR_EXHAUSTED
          : "",
    });
    return props.local.realizeCollectors.length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "realizeCollectors",
            arguments: {
              thinking: "realize collectors for Create DTO transformation",
              request: {
                type: "getRealizeCollectors",
                dtoTypeNames: props.local.realizeCollectors.map(
                  (c) => c.plan.dtoTypeName,
                ),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  export const realizeTransformers = (
    props: IProps<"realizeTransformers">,
  ): IMicroAgenticaHistoryJson[] => {
    const oldbie: Record<string, AutoBeRealizeTransformerFunction> =
      Object.fromEntries(
        props.local.realizeTransformers.map((t) => [t.plan.dtoTypeName, t]),
      );
    const newbie: AutoBeRealizeTransformerFunction[] =
      props.all.realizeTransformers.filter(
        (t) => oldbie[t.plan.dtoTypeName] === undefined,
      );

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt:
          AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_TRANSFORMER_LOADED,
        content: toJsonBlock(oldbie),
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_TRANSFORMER,
      available: StringUtil.trim`
        DTO Type Name | Prisma Table | Neighbor Transformers 
        --------------|--------------|----------------------
        ${newbie
          .map((t) =>
            [
              t.plan.dtoTypeName,
              t.plan.prismaSchemaName,
              `(${t.neighbors.join(", ")})`,
            ].join(" | "),
          )
          .join("\n")}
      `,
      loaded: props.local.realizeTransformers
        .map((t) => `- ${t.plan.dtoTypeName}`)
        .join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_TRANSFORMER_EXHAUSTED
          : "",
    });
    return props.local.realizeTransformers.length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind: "realizeTransformers",
            arguments: {
              thinking: "realize transformers for response DTO construction",
              request: {
                type: "getRealizeTransformers",
                dtoTypeNames: props.local.realizeTransformers.map(
                  (t) => t.plan.dtoTypeName,
                ),
              },
            },
          }),
          assistant,
          system,
        ];
  };
}

// experimenting between assistantMessage and execute types
const createFunctionCallingMessage = <
  Kind extends AutoBePreliminaryKind,
>(props: {
  controller: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  kind: Kind;
  arguments: IAutoBePreliminaryRequest<Kind>;
}): IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.IExecute => ({
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
  content: string;
}): IAgenticaHistoryJson.IAssistantMessage => ({
  id: v7(),
  type: "assistantMessage",
  text: props.prompt.replaceAll("{{CONTENT}}", props.content),
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

const toJsonBlock = (obj: any): string =>
  StringUtil.trim`
      \`\`\`json
      ${JSON.stringify(obj)}
      \`\`\`
    `;
