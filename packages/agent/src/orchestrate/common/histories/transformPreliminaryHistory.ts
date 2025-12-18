import {
  IAgenticaHistoryJson,
  IMicroAgenticaHistoryJson,
} from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
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
import { AutoBeState } from "../../../context/AutoBeState";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export const transformPreliminaryHistory = <Kind extends AutoBePreliminaryKind>(
  preliminary: AutoBePreliminaryController<Kind>,
): IMicroAgenticaHistoryJson[] => [
  ...preliminary
    .getKinds()
    .map((key): IMicroAgenticaHistoryJson[] => {
      const newKey: string = key.startsWith("previous")
        ? key.replace("previous", "")
        : key;
      const type: Exclude<AutoBePreliminaryKind, `previous${string}`> = (newKey
        .slice(0, 1)
        .toLowerCase() + newKey.slice(1)) as Exclude<
        AutoBePreliminaryKind,
        `previous${string}`
      >;
      return PreliminaryTransformer[type]({
        source: preliminary.getSource(),
        state: preliminary.getState(),
        all: preliminary.getAll() as IAutoBePreliminaryCollection,
        local: preliminary.getLocal() as IAutoBePreliminaryCollection,
        config: preliminary.getConfig() as any,
        previous: key.startsWith("previous"),
      });
    })
    .flat(),
];

namespace PreliminaryTransformer {
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    state: AutoBeState;
    all: Pick<IAutoBePreliminaryCollection, Kind>;
    local: Pick<IAutoBePreliminaryCollection, Kind>;
    config: AutoBePreliminaryController.IConfig<Kind>;
    previous: boolean;
  }

  export const analysisFiles = (
    props: IProps<"analysisFiles" | "previousAnalysisFiles">,
  ): IMicroAgenticaHistoryJson[] => {
    const kind: "analysisFiles" | "previousAnalysisFiles" = props.previous
      ? "previousAnalysisFiles"
      : "analysisFiles";
    const oldbie: Record<string, AutoBeAnalyzeFile> = Object.fromEntries(
      props.local[kind].map((f) => [f.filename, f]),
    );
    const newbie: AutoBeAnalyzeFile[] = props.all[kind].filter(
      (f) => oldbie[f.filename] === undefined,
    );

    const analyze: AutoBeAnalyzeHistory | null = props.previous
      ? props.state.previousAnalyze
      : props.state.analyze;
    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt:
          AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_LOADED.replace(
            "{{PREFIX}}",
            analyze?.prefix ?? "",
          ).replace(
            "{{ACTORS}}",
            analyze?.actors ? toJsonBlock(analyze.actors) : "",
          ),
        previous: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_PREVIOUS,
        content: toJsonBlock(oldbie),
        replace: props.previous
          ? { from: "getAnalysisFiles", to: "getPreviousAnalysisFiles" }
          : null,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE,
      previous: AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_PREVIOUS,
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
      loaded: props.local[kind].map((f) => `- ${f.filename}`).join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED
          : "",
      replace: props.previous
        ? {
            from: "getAnalysisFiles",
            to: "getPreviousAnalysisFiles",
          }
        : null,
    });
    return props.local[kind].length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind,
            arguments: {
              thinking: "analysis files for detailed requirements' analyses",
              request: {
                type: props.previous
                  ? "getPreviousAnalysisFiles"
                  : "getAnalysisFiles",
                fileNames: props.local[kind].map((f) => f.filename),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  export const prismaSchemas = (
    props: IProps<"prismaSchemas" | "previousPrismaSchemas">,
  ): IMicroAgenticaHistoryJson[] => {
    const kind: "prismaSchemas" | "previousPrismaSchemas" = props.previous
      ? "previousPrismaSchemas"
      : "prismaSchemas";
    const oldbie: Record<string, AutoBePrisma.IModel> = Object.fromEntries(
      props.local[kind].map((s) => [s.name, s]),
    );
    const newbie: AutoBePrisma.IModel[] = props.all[kind].filter(
      (s) => oldbie[s.name] === undefined,
    );

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_LOADED,
        previous: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_PREVIOUS,
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
        replace: props.previous
          ? {
              from: "getPrismaSchemas",
              to: "getPreviousPrismaSchemas",
            }
          : null,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA,
      previous: AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_PREVIOUS,
      available: StringUtil.trim`
        Name | Stance | Summary
        -----|--------|---------
        ${newbie
          .map((m) =>
            [m.name, m.stance, StringUtil.summary(m.description)].join(" | "),
          )
          .join("\n")}
      `,
      loaded: props.local[kind].map((s) => `- ${s.name}`).join("\n"),
      exhausted:
        newbie.length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_EXHAUSTED
          : "",
      replace: props.previous
        ? {
            from: "getPrismaSchemas",
            to: "getPreviousPrismaSchemas",
          }
        : null,
    });
    return props.local[kind].length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind,
            arguments: {
              thinking: "prisma schemas for DB schema information",
              request: {
                type: props.previous
                  ? "getPreviousPrismaSchemas"
                  : "getPrismaSchemas",
                schemaNames: props.local[kind].map((s) => s.name),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  export const interfaceOperations = (
    props: IProps<"interfaceOperations" | "previousInterfaceOperations">,
  ): IMicroAgenticaHistoryJson[] => {
    const kind: "interfaceOperations" | "previousInterfaceOperations" =
      props.previous ? "previousInterfaceOperations" : "interfaceOperations";
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.local[kind].map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const newbie: AutoBeOpenApi.IOperation[] = props.all[kind].filter(
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
        previous:
          AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_PREVIOUS,
        content: toJsonBlock(props.local[kind]),
        replace: props.previous
          ? {
              from: "getInterfaceOperations",
              to: "getPreviousInterfaceOperations",
            }
          : null,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION,
      previous:
        AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_PREVIOUS,
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
      replace: props.previous
        ? {
            from: "getInterfaceOperations",
            to: "getPreviousInterfaceOperations",
          }
        : null,
    });
    return props.local[kind].length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind,
            arguments: {
              thinking:
                "interface operations for detailed endpoint information",
              request: {
                type: props.previous
                  ? "getPreviousInterfaceOperations"
                  : "getInterfaceOperations",
                endpoints: oldbie.toJSON(),
              },
            },
          }),
          assistant,
          system,
        ];
  };

  export const interfaceSchemas = (
    props: IProps<"interfaceSchemas" | "previousInterfaceSchemas">,
  ): IMicroAgenticaHistoryJson[] => {
    const kind: "interfaceSchemas" | "previousInterfaceSchemas" = props.previous
      ? "previousInterfaceSchemas"
      : "interfaceSchemas";
    const newbie: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    for (const [k, v] of Object.entries(props.all[kind]))
      if (props.local[kind][k] === undefined) newbie[k] = v;

    const assistant: IAgenticaHistoryJson.IAssistantMessage =
      createAssistantMessage({
        prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_LOADED,
        previous:
          AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_PREVIOUS,
        content: toJsonBlock(props.local[kind]),
        replace: props.previous
          ? {
              from: "getInterfaceSchemas",
              to: "getPreviousInterfaceSchemas",
            }
          : null,
      });
    const system: IAgenticaHistoryJson.ISystemMessage = createSystemMessage({
      prompt: AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA,
      previous:
        AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_PREVIOUS,
      available: StringUtil.trim`
        Name | Summary
        -----|---------
        ${Object.entries(newbie)
          .map(([name, schema]) =>
            [name, StringUtil.summary(schema.description)].join(" | "),
          )
          .join("\n")}
      `,
      loaded: Object.keys(props.local[kind])
        .map((k) => `- ${k}`)
        .join("\n"),
      exhausted:
        Object.keys(newbie).length === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_EXHAUSTED
          : "",
      replace: props.previous
        ? {
            from: "getInterfaceSchemas",
            to: "getPreviousInterfaceSchemas",
          }
        : null,
    });
    return Object.keys(props.local[kind]).length === 0
      ? [assistant, system]
      : [
          createFunctionCallingMessage({
            controller: props.source,
            kind,
            arguments: {
              thinking: "interface schemas for detailed schema information",
              request: {
                type: props.previous
                  ? "getPreviousInterfaceSchemas"
                  : "getInterfaceSchemas",
                typeNames: Object.keys(props.local[kind]),
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
        replace: null,
        previous: null,
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
      replace: null,
      previous: null,
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
        replace: null,
        previous: null,
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
      replace: null,
      previous: null,
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

interface IPromptReplace {
  from: Exclude<
    IAutoBePreliminaryRequest<any>["request"]["type"],
    `getPrevious${string}`
  >;
  to: Extract<
    IAutoBePreliminaryRequest<any>["request"]["type"],
    `getPrevious${string}`
  >;
}

const createAssistantMessage = (props: {
  prompt: string;
  content: string;
  replace: IPromptReplace | null;
  previous: string | null;
}): IAgenticaHistoryJson.IAssistantMessage => {
  let text = props.prompt
    .replaceAll("{{CONTENT}}", props.content)
    .replaceAll(
      "{{PREVIOUS}}",
      props.replace !== null && props.previous !== null ? props.previous : "",
    );
  if (props.replace !== null)
    text = text.replaceAll(props.replace.from, props.replace.to);
  return {
    id: v7(),
    type: "assistantMessage",
    text,
    created_at: new Date().toISOString(),
  };
};

const createSystemMessage = (props: {
  prompt: string;
  available: string;
  loaded: string;
  exhausted: string;
  replace: IPromptReplace | null;
  previous: string | null;
}): IAgenticaHistoryJson.ISystemMessage => {
  let text = props.prompt
    .replaceAll("{{AVAILABLE}}", props.available)
    .replaceAll("{{LOADED}}", props.loaded)
    .replaceAll("{{EXHAUSTED}}", props.exhausted)
    .replaceAll(
      "{{PREVIOUS}}",
      props.replace !== null && props.previous !== null ? props.previous : "",
    );
  if (props.replace !== null)
    text = text.replaceAll(props.replace.from, props.replace.to);
  return {
    id: v7(),
    type: "systemMessage",
    text,
    created_at: new Date().toISOString(),
  };
};

const toJsonBlock = (obj: any): string =>
  StringUtil.trim`
      \`\`\`json
      ${JSON.stringify(obj)}
      \`\`\`
    `;

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
