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
import { IAutoBePreliminaryGetPrismaSchemas } from "../structures/IAutoBePreliminaryGetPrismaSchemas";

export const validatePreliminary = <Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
  data: IAutoBePreliminaryRequest<Kind>,
): IValidation<IAutoBePreliminaryRequest<Kind>> => {
  const func = PreliminaryApplicationValidator[data.request.type];
  return func(controller as any, data as any) as any;
};

namespace PreliminaryApplicationValidator {
  export const getAnalysisFiles = (
    controller: AutoBePreliminaryController<"analysisFiles">,
    input: IAutoBePreliminaryRequest<"analysisFiles">,
  ): IValidation<IAutoBePreliminaryRequest<"analysisFiles">> => {
    const all: Set<string> = new Set(
      controller.getAll().analysisFiles.map((f) => f.filename),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().analysisFiles.map((f) => f.filename),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .analysisFiles.filter((f) => oldbie.has(f.filename) === false)
        .map((f) => f.filename),
    );

    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${controller
        .getAll()
        .analysisFiles.filter((f) => newbie.has(f.filename))
        .map((f) => [f.filename, f.documentType].join(" | "))
        .join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED
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
    controller: AutoBePreliminaryController<"prismaSchemas">,
    input: IAutoBePreliminaryRequest<"prismaSchemas">,
  ): IValidation<IAutoBePreliminaryRequest<"prismaSchemas">> => {
    const all: Set<string> = new Set(
      controller.getAll().prismaSchemas.map((s) => s.name),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().prismaSchemas.map((s) => s.name),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .prismaSchemas.filter((s) => oldbie.has(s.name) === false)
        .map((s) => s.name),
    );

    const quoted: string[] = Array.from(newbie).map((x) => JSON.stringify(x));
    const description = StringUtil.trim`
      Here are the list of prisma schema models you can use.

      Please select from the below. Never assume non-existing models.

      ${quoted.map((q) => `- ${q}`).join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_PRISMA_SCHEMA_EXHAUSTED
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
    controller: AutoBePreliminaryController<"interfaceOperations">,
    input: IAutoBePreliminaryRequest<"interfaceOperations">,
  ): IValidation<IAutoBePreliminaryRequest<"interfaceOperations">> => {
    const all: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getAll().interfaceOperations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getLocal().interfaceOperations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const newbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller
        .getAll()
        .interfaceOperations.map((o) => ({
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
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_EXHAUSTED
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
    controller: AutoBePreliminaryController<"interfaceSchemas">,
    input: IAutoBePreliminaryRequest<"interfaceSchemas">,
  ): IValidation<IAutoBePreliminaryRequest<"interfaceSchemas">> => {
    const all: Set<string> = new Set(
      Object.keys(controller.getAll().interfaceSchemas),
    );
    const oldbie: Set<string> = new Set(
      Object.keys(controller.getLocal().interfaceSchemas),
    );
    const newbie: Set<string> = new Set(
      Object.keys(controller.getAll().interfaceSchemas).filter(
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
          ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_EXHAUSTED
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
