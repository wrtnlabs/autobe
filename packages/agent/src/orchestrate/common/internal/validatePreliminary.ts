import { AutoBeOpenApi, AutoBePreliminaryKind } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import typia, { IValidation } from "typia";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryGetAnalysisFiles } from "../structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../structures/IAutoBePreliminaryGetPrismaSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../structures/IAutoBePreliminaryGetRealizeTransformers";

export const validatePreliminary = <Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
  data: IAutoBePreliminaryRequest<Kind>,
): IValidation<IAutoBePreliminaryRequest<Kind>> => {
  const type: Exclude<
    IAutoBePreliminaryRequest<AutoBePreliminaryKind>["request"]["type"],
    `getPrevious${string}`
  > = (
    data.request.type.startsWith("getPrevious")
      ? data.request.type.replace("getPrevious", "get")
      : data.request.type
  ) as Exclude<
    IAutoBePreliminaryRequest<AutoBePreliminaryKind>["request"]["type"],
    `getPrevious${string}`
  >;
  const func = PreliminaryApplicationValidator[type];
  return func(
    controller as any,
    data as any,
    data.request.type.startsWith("getPrevious"),
  ) as any;
};

namespace PreliminaryApplicationValidator {
  export const getAnalysisFiles = (
    controller: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles"
    >,
    input: IAutoBePreliminaryRequest<"analysisFiles" | "previousAnalysisFiles">,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"analysisFiles" | "previousAnalysisFiles">
  > => {
    const accessor: "analysisFiles" | "previousAnalysisFiles" = previous
      ? "previousAnalysisFiles"
      : "analysisFiles";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      controller.getAll()[accessor].map((f) => f.filename),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal()[accessor].map((f) => f.filename),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        [accessor].filter((f) => oldbie.has(f.filename) === false)
        .map((f) => f.filename),
    );

    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${controller
        .getAll()
        [accessor].filter((f) => newbie.has(f.filename))
        .map((f) => [f.filename, f.documentType].join(" | "))
        .join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED.replace(
              "getAnalysisFiles" satisfies IAutoBePreliminaryGetAnalysisFiles["type"],
              previous
                ? ("getPreviousAnalysisFiles" satisfies IAutoBePreliminaryGetPreviousAnalysisFiles["type"])
                : ("getAnalysisFiles" satisfies IAutoBePreliminaryGetAnalysisFiles["type"]),
            )
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.fileNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.fileNames[${i}]`,
          value: key,
          expected: Array.from(newbie)
            .map((x) => JSON.stringify(x))
            .join(" | "),
          description,
        });
    });
    if (input.request.fileNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !== typia.reflect.name<IAutoBePreliminaryGetAnalysisFiles>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetAnalysisFiles["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getPrismaSchemas = (
    controller: AutoBePreliminaryController<
      "prismaSchemas" | "previousPrismaSchemas"
    >,
    input: IAutoBePreliminaryRequest<"prismaSchemas" | "previousPrismaSchemas">,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"prismaSchemas" | "previousPrismaSchemas">
  > => {
    const accessor: "prismaSchemas" | "previousPrismaSchemas" = previous
      ? "previousPrismaSchemas"
      : "prismaSchemas";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      controller.getAll()[accessor].map((s) => s.name),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal()[accessor].map((s) => s.name),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        [accessor].filter((s) => oldbie.has(s.name) === false)
        .map((s) => s.name),
    );

    const quoted: string[] = Array.from(newbie).map((x) => JSON.stringify(x));
    const description = StringUtil.trim`
      Here are the list of prisma schema models you can use.

      Please select from the below. Never assume non-existing models.

      ${quoted.map((q) => `- ${q}`).join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_EXHAUSTED.replace(
              "getPrismaSchemas" satisfies IAutoBePreliminaryGetPrismaSchemas["type"],
              previous
                ? ("getPreviousPrismaSchemas" satisfies IAutoBePreliminaryGetPreviousPrismaSchemas["type"])
                : ("getPrismaSchemas" satisfies IAutoBePreliminaryGetPrismaSchemas["type"]),
            )
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.schemaNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.schemaNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
    });
    if (input.request.schemaNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !== typia.reflect.name<IAutoBePreliminaryGetPrismaSchemas>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetPrismaSchemas["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getInterfaceOperations = (
    controller: AutoBePreliminaryController<
      "interfaceOperations" | "previousInterfaceOperations"
    >,
    input: IAutoBePreliminaryRequest<
      "interfaceOperations" | "previousInterfaceOperations"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<
      "interfaceOperations" | "previousInterfaceOperations"
    >
  > => {
    const accessor: "interfaceOperations" | "previousInterfaceOperations" =
      previous ? "previousInterfaceOperations" : "interfaceOperations";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getAll()[accessor].map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getLocal()[accessor].map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const newbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller
        .getAll()
        [accessor].map((o) => ({
          method: o.method,
          path: o.path,
        }))
        .filter((e) => oldbie.has(e) === false),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const description: string = StringUtil.trim`
      Here are the list of API endpoints you can use.

      Please select from the below. Never assume non-existing endpoints.

      Method | Path
      -------|------
      ${newbie
        .toJSON()
        .map((o) => [o.method, o.path].join(" | "))
        .join("\n")}
      
      ${
        newbie.size() === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_EXHAUSTED.replace(
              "getInterfaceOperations" satisfies IAutoBePreliminaryGetInterfaceOperations["type"],
              previous
                ? ("getPreviousInterfaceOperations" satisfies IAutoBePreliminaryGetPreviousInterfaceOperations["type"])
                : ("getInterfaceOperations" satisfies IAutoBePreliminaryGetInterfaceOperations["type"]),
            )
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.endpoints.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.endpoints[${i}]`,
          value: key,
          expected: "AutoBeOpenApi.IEndpoint",
          description,
        });
    });
    if (input.request.endpoints.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !==
              typia.reflect.name<IAutoBePreliminaryGetInterfaceOperations>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetInterfaceOperations["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getInterfaceSchemas = (
    controller: AutoBePreliminaryController<
      "interfaceSchemas" | "previousInterfaceSchemas"
    >,
    input: IAutoBePreliminaryRequest<
      "interfaceSchemas" | "previousInterfaceSchemas"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"interfaceSchemas" | "previousInterfaceSchemas">
  > => {
    const accessor: "interfaceSchemas" | "previousInterfaceSchemas" = previous
      ? "previousInterfaceSchemas"
      : "interfaceSchemas";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      Object.keys(controller.getAll()[accessor]),
    );
    const oldbie: Set<string> = new Set(
      Object.keys(controller.getLocal()[accessor]),
    );
    const newbie: Set<string> = new Set(
      Object.keys(controller.getAll()[accessor]).filter(
        (k) => oldbie.has(k) === false,
      ),
    );

    const quoted: string[] = Array.from(newbie).map((k) => JSON.stringify(k));
    const description: string = StringUtil.trim`
      Here are the list of interface schemas you can use.

      Please select from the below. Never assume non-existing schemas.

      ${quoted.map((q) => `- ${q}`).join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_EXHAUSTED.replace(
              "getInterfaceSchemas" satisfies IAutoBePreliminaryGetInterfaceSchemas["type"],
              previous
                ? ("getPreviousInterfaceSchemas" satisfies IAutoBePreliminaryGetPreviousInterfaceSchemas["type"])
                : ("getInterfaceSchemas" satisfies IAutoBePreliminaryGetInterfaceSchemas["type"]),
            )
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.typeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.typeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
    });
    if (input.request.typeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !== typia.reflect.name<IAutoBePreliminaryGetInterfaceSchemas>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetInterfaceSchemas["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getRealizeCollectors = (
    controller: AutoBePreliminaryController<"realizeCollectors">,
    input: IAutoBePreliminaryRequest<"realizeCollectors">,
    _previous: boolean,
  ): IValidation<IAutoBePreliminaryRequest<"realizeCollectors">> => {
    const all: Set<string> = new Set(
      controller.getAll().realizeCollectors.map((c) => c.plan.dtoTypeName),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().realizeCollectors.map((c) => c.plan.dtoTypeName),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .realizeCollectors.filter(
          (c) => oldbie.has(c.plan.dtoTypeName) === false,
        )
        .map((c) => c.plan.dtoTypeName),
    );

    const quoted: string[] = Array.from(newbie).map((x) => JSON.stringify(x));
    const description = StringUtil.trim`
      Here are the list of realize collector functions you can use.

      Please select from the below. Never assume non-existing collectors.

      ${quoted.map((q) => `- ${q}`).join("\n")}

      ${
        newbie.size === 0
          ? "All available collectors have already been requested."
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.dtoTypeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.dtoTypeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
    });
    if (input.request.dtoTypeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !==
              typia.reflect.name<IAutoBePreliminaryGetRealizeCollectors>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetRealizeCollectors["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getRealizeTransformers = (
    controller: AutoBePreliminaryController<"realizeTransformers">,
    input: IAutoBePreliminaryRequest<"realizeTransformers">,
    _previous: boolean,
  ): IValidation<IAutoBePreliminaryRequest<"realizeTransformers">> => {
    const all: Set<string> = new Set(
      controller.getAll().realizeTransformers.map((t) => t.plan.dtoTypeName),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().realizeTransformers.map((t) => t.plan.dtoTypeName),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .realizeTransformers.filter(
          (t) => oldbie.has(t.plan.dtoTypeName) === false,
        )
        .map((t) => t.plan.dtoTypeName),
    );

    const quoted: string[] = Array.from(newbie).map((x) => JSON.stringify(x));
    const description = StringUtil.trim`
      Here are the list of realize transformer functions you can use.

      Please select from the below. Never assume non-existing transformers.

      ${quoted.map((q) => `- ${q}`).join("\n")}

      ${
        newbie.size === 0
          ? "All available transformers have already been requested."
          : ""
      }
    `;

    const errors: IValidation.IError[] = [];
    input.request.dtoTypeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.dtoTypeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
    });
    if (input.request.dtoTypeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !==
              typia.reflect.name<IAutoBePreliminaryGetRealizeTransformers>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetRealizeTransformers["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };
}

const finalize = <T>(data: T, errors: IValidation.IError[]): IValidation<T> =>
  errors.length === 0
    ? ({
        success: true,
        data,
      } satisfies IValidation.ISuccess<T>)
    : ({
        success: false,
        data,
        errors,
      } satisfies IValidation.IFailure);

const nonExisting = <Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
  kind: Kind,
  data: IAutoBePreliminaryRequest<Kind>,
): IValidation.IFailure => ({
  success: false,
  data,
  errors: [
    {
      path: "$input.request.type",
      expected: controller
        .getKinds()
        .map((k) => JSON.stringify(k))
        .join(" | "),
      value: kind,
      description: StringUtil.trim`
        The preliminary data of type "${kind}" does not exist.

        You must choose one of below available kinds:

        ${controller
          .getKinds()
          .map((k) => `- ${k}`)
          .join("\n")}
      `,
    },
  ],
});
