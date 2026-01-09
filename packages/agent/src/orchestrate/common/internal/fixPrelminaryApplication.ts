import {
  AutoBeAnalyzeFile,
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmFunction,
  ILlmSchema,
  LlmTypeChecker,
} from "@samchon/openapi";
import typia from "typia";

import { AutoBeState } from "../../../context/AutoBeState";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryGetAnalysisFiles } from "../structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../structures/IAutoBePreliminaryGetRealizeTransformers";

export const fixPreliminaryApplication = <
  Kind extends AutoBePreliminaryKind,
>(props: {
  state: AutoBeState;
  preliminary: AutoBePreliminaryController<Kind>;
  application: ILlmApplication;
}): void => {
  if (
    props.preliminary.getKinds().some((k) => k.includes("previous")) === false
  )
    return;

  const func: ILlmFunction | undefined = props.application.functions.find(
    (f) => f.name === "process",
  );
  if (func === undefined) return;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return;

  const eraseKind = (kind: AutoBePreliminaryKind) => {
    props.preliminary
      .getKinds()
      .splice(props.preliminary.getKinds().indexOf(kind as any), 1);
    delete (props.preliminary.getAll() as any)[kind];
    delete (props.preliminary.getLocal() as any)[kind];
  };
  const eraseMetadata = getUnionErasure({
    $defs: func.parameters.$defs,
    request,
  });
  if (eraseMetadata === null) return;

  for (const kind of props.preliminary.getKinds().slice())
    if (kind === "previousAnalysisFiles") {
      if (props.state.previousAnalyze === null) {
        eraseMetadata("getPreviousAnalysisFiles");
        eraseKind(kind);
      }
    } else if (kind === "previousDatabaseSchemas") {
      if (props.state.previousDatabase === null) {
        eraseMetadata("getPreviousDatabaseSchemas");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceOperations") {
      if (props.state.previousInterface === null) {
        eraseMetadata("getPreviousInterfaceOperations");
        eraseKind(kind);
      }
    } else if (kind === "previousInterfaceSchemas") {
      if (props.state.previousInterface === null) {
        eraseMetadata("getPreviousInterfaceSchemas");
        eraseKind(kind);
      }
    }

  for (const kind of props.preliminary.getKinds()) {
    const accessor: Exclude<AutoBePreliminaryKind, `previous${string}`> = (
      kind.startsWith("previous")
        ? (() => {
            const value = kind.replace("previous", "");
            return value[0].toLowerCase() + value.substring(1);
          })()
        : kind
    ) as Exclude<AutoBePreliminaryKind, `previous${string}`>;
    ApplicationFixer[accessor]({
      $defs: func.parameters.$defs,
      controller: props.preliminary as any,
      previous: kind.startsWith("previous"),
    });
  }
};

const getUnionErasure = (props: {
  $defs: Record<string, ILlmSchema>;
  request: ILlmSchema;
}) => {
  if (LlmTypeChecker.isAnyOf(props.request) === false) return null;
  else if (
    props.request.anyOf.some((s) => LlmTypeChecker.isReference(s) === false)
  )
    return null;

  const children: ILlmSchema.IReference[] = props.request
    .anyOf as ILlmSchema.IReference[];
  const mapping: Record<string, string> =
    props.request["x-discriminator"]?.mapping ?? {};

  return (
    key: IAutoBePreliminaryRequest<
      Extract<AutoBePreliminaryKind, `previous${string}`>
    >["request"]["type"],
  ): void => {
    const type: string = `IAutoBePreliminary${key[0].toUpperCase()}${key.substring(1)}`;
    const index: number = children.findIndex((c) =>
      c.$ref.endsWith(`/${type}`),
    );
    if (index !== -1) children.splice(index, 1);
    delete props.$defs[key];
    delete mapping[key];
  };
};

namespace ApplicationFixer {
  export const analysisFiles = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles"
    >;
    previous: boolean;
  }): void => {
    const analysisFiles: AutoBeAnalyzeFile[] =
      props.controller.getAll()[
        props.previous ? "previousAnalysisFiles" : "analysisFiles"
      ];
    if (analysisFiles.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      props.previous
        ? typia.reflect.name<IAutoBePreliminaryGetPreviousAnalysisFiles>()
        : typia.reflect.name<IAutoBePreliminaryGetAnalysisFiles>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.fileNames,
      StringUtil.trim`
        Here is the list of analysis files available for retrieval:

        ${analysisFiles
          .slice()
          .sort((a, b) => a.filename.localeCompare(b.filename))
          .map((f) => `- ${f.filename}`)
          .join("\n")}
        `,
    );
  };

  export const databaseSchemas = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<
      "databaseSchemas" | "previousDatabaseSchemas"
    >;
    previous: boolean;
  }): void => {
    const schemas: AutoBeDatabase.IModel[] =
      props.controller.getAll()[
        props.previous ? "previousDatabaseSchemas" : "databaseSchemas"
      ];
    if (schemas.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      props.previous
        ? typia.reflect.name<IAutoBePreliminaryGetPreviousDatabaseSchemas>()
        : typia.reflect.name<IAutoBePreliminaryGetDatabaseSchemas>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.schemaNames,
      StringUtil.trim`
        Here is the list of database schemas available for retrieval:

        ${schemas
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s) => `- ${s.name}`)
          .join("\n")}
      `,
    );
  };

  export const interfaceOperations = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<
      "interfaceOperations" | "previousInterfaceOperations"
    >;
    previous: boolean;
  }): void => {
    const operations: AutoBeOpenApi.IOperation[] =
      props.controller.getAll()[
        props.previous ? "previousInterfaceOperations" : "interfaceOperations"
      ];
    if (operations.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      props.previous
        ? typia.reflect.name<IAutoBePreliminaryGetPreviousInterfaceOperations>()
        : typia.reflect.name<IAutoBePreliminaryGetInterfaceOperations>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.endpoints,
      StringUtil.trim`
        Here is the list of interface operations available for retrieval:

        path | method
        ---- | ------
        ${operations
          .slice()
          .sort(AutoBeOpenApiEndpointComparator.compare)
          .map((o) => ` ${o.path} | ${o.method}`)
          .join("\n")}
      `,
    );
  };

  export const interfaceSchemas = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<
      "interfaceSchemas" | "previousInterfaceSchemas"
    >;
    previous: boolean;
  }): void => {
    const dtoTypeNames: string[] = Object.keys(
      props.controller.getAll()[
        props.previous ? "previousInterfaceSchemas" : "interfaceSchemas"
      ] satisfies Record<string, AutoBeOpenApi.IJsonSchema>,
    );
    if (dtoTypeNames.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      props.previous
        ? typia.reflect.name<IAutoBePreliminaryGetPreviousInterfaceSchemas>()
        : typia.reflect.name<IAutoBePreliminaryGetInterfaceSchemas>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.typeNames,
      StringUtil.trim`
        Here is the list of interface schemas available for retrieval:

        ${dtoTypeNames
          .slice()
          .sort((a, b) => a.localeCompare(b))
          .map((name) => `- ${name}`)
          .join("\n")}
      `,
    );
  };

  export const realizeCollectors = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<"realizeCollectors">;
  }): void => {
    if (props.controller.getAll().realizeCollectors.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      typia.reflect.name<IAutoBePreliminaryGetRealizeCollectors>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.dtoTypeNames,
      StringUtil.trim`
        Here is the list of DTO types available for realize collectors:

        ${props.controller
          .getAll()
          .realizeCollectors.slice()
          .sort((a, b) => a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName))
          .map((x) => `- ${x.plan.dtoTypeName}`)
          .join("\n")}
      `,
    );
  };

  export const realizeTransformers = (props: {
    $defs: Record<string, ILlmSchema>;
    controller: AutoBePreliminaryController<"realizeTransformers">;
  }): void => {
    if (props.controller.getAll().realizeTransformers.length === 0) return;

    const type: ILlmSchema.IObject = props.$defs[
      typia.reflect.name<IAutoBePreliminaryGetRealizeTransformers>()
    ] as ILlmSchema.IObject;
    describe(
      type.properties.dtoTypeNames,
      StringUtil.trim`
        Here is the list of DTO types available for realize transformers:

        ${props.controller
          .getAll()
          .realizeTransformers.slice()
          .sort((a, b) => a.plan.dtoTypeName.localeCompare(b.plan.dtoTypeName))
          .map((x) => `- ${x.plan.dtoTypeName}`)
          .join("\n")}
      `,
    );
  };
}

const describe = (schema: ILlmSchema, content: string): void => {
  schema.description ??= "";
  if (schema.description.length > 0) schema.description += "\n\n";
  schema.description += content;
};
