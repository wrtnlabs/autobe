import { AutoBeOpenApi, AutoBePreliminaryKind } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import typia, { IValidation } from "typia";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryApplication } from "../structures/IAutoBePreliminaryApplication";

type Validator<Key extends keyof IAutoBePreliminaryApplication> = {
  [P in Key]: (
    input: unknown,
  ) => IValidation<Parameters<IAutoBePreliminaryApplication[P]>[0]>;
};

export function createPreliminaryValidate<Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
): Validator<Kind> {
  const result: Validator<Kind> = {} as any;
  for (const kind of controller.getKinds())
    result[kind] = PreliminaryApplicationValidator[kind](controller as any);
  return result;
}

namespace PreliminaryApplicationValidator {
  export const analyzeFiles = (
    controller: AutoBePreliminaryController<"analyzeFiles">,
  ) => {
    const all: Set<string> = new Set(
      controller.getAll().analyzeFiles.map((f) => f.filename),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().analyzeFiles.map((f) => f.filename),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .analyzeFiles.filter((f) => oldbie.has(f.filename) === false)
        .map((f) => f.filename),
    );

    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${controller
        .getAll()
        .analyzeFiles.filter((f) => newbie.has(f.filename))
        .map((f) => [f.filename, f.documentType].join(" | "))
        .join("\n")}

      ${
        newbie.size === 0
          ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED
          : ""
      }
    `;
    return (
      input: unknown,
    ): IValidation<IAutoBePreliminaryApplication.IAnalysisFilesProps> => {
      const result: IValidation<IAutoBePreliminaryApplication.IAnalysisFilesProps> =
        typia.validate<IAutoBePreliminaryApplication.IAnalysisFilesProps>(
          input,
        );
      if (result.success === false) return result;

      const errors: IValidation.IError[] = [];
      result.data.fileNames.forEach((key, i) => {
        if (all.has(key) === false)
          errors.push({
            path: `$input.fileNames[${i}]`,
            value: key,
            expected: Array.from(newbie)
              .map((x) => JSON.stringify(x))
              .join(" | "),
            description,
          });
      });
      controller.setEmpty(
        "analyzeFiles",
        result.data.fileNames.length === 0 ||
          result.data.fileNames.every((k) => oldbie.has(k)),
      );
      return finalize(result, errors);
    };
  };

  export const prismaSchemas = (
    controller: AutoBePreliminaryController<"prismaSchemas">,
  ) => {
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
    return (
      input: unknown,
    ): IValidation<IAutoBePreliminaryApplication.IPrismaSchemasProps> => {
      const result: IValidation<IAutoBePreliminaryApplication.IPrismaSchemasProps> =
        typia.validate<IAutoBePreliminaryApplication.IPrismaSchemasProps>(
          input,
        );
      if (result.success === false) return result;

      const errors: IValidation.IError[] = [];
      result.data.schemaNames.forEach((key, i) => {
        if (all.has(key) === false)
          errors.push({
            path: `$input.schemaNames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description,
          });
      });
      controller.setEmpty(
        "prismaSchemas",
        result.data.schemaNames.length === 0 ||
          result.data.schemaNames.every((k) => oldbie.has(k)),
      );
      return finalize(result, errors);
    };
  };

  export const interfaceOperations = (
    controller: AutoBePreliminaryController<"interfaceOperations">,
  ) => {
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
    return (
      input: unknown,
    ): IValidation<IAutoBePreliminaryApplication.IInterfaceOperationsProps> => {
      const result: IValidation<IAutoBePreliminaryApplication.IInterfaceOperationsProps> =
        typia.validate<IAutoBePreliminaryApplication.IInterfaceOperationsProps>(
          input,
        );
      if (result.success === false) return result;

      const errors: IValidation.IError[] = [];
      result.data.endpoints.forEach((key, i) => {
        if (all.has(key) === false)
          errors.push({
            path: `$input.endpoints[${i}]`,
            value: key,
            expected: "AutoBeOpenApi.IEndpoint",
            description,
          });
      });
      controller.setEmpty(
        "interfaceOperations",
        result.data.endpoints.length === 0 ||
          result.data.endpoints.every((k) => oldbie.has(k)),
      );
      return finalize(result, errors);
    };
  };

  export const interfaceSchemas = (
    controller: AutoBePreliminaryController<"interfaceSchemas">,
  ) => {
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
    return (
      input: unknown,
    ): IValidation<IAutoBePreliminaryApplication.IInterfaceSchemasProps> => {
      const result: IValidation<IAutoBePreliminaryApplication.IInterfaceSchemasProps> =
        typia.validate<IAutoBePreliminaryApplication.IInterfaceSchemasProps>(
          input,
        );
      if (result.success === false) return result;

      const errors: IValidation.IError[] = [];
      result.data.typeNames.forEach((key, i) => {
        if (all.has(key) === false)
          errors.push({
            path: `$input.typeNames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description,
          });
      });
      controller.setEmpty(
        "interfaceSchemas",
        result.data.typeNames.length === 0 ||
          result.data.typeNames.every((k) => oldbie.has(k)),
      );
      return finalize(result, errors);
    };
  };
}

const finalize = <T>(
  result: IValidation.ISuccess<T>,
  errors: IValidation.IError[],
): IValidation<T> =>
  errors.length === 0
    ? result
    : ({
        success: false,
        data: result.data,
        errors,
      } satisfies IValidation.IFailure);
