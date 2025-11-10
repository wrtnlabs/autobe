import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import typia, { IValidation } from "typia";

import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";

export namespace PreliminaryApplicationValidator {
  export const getRequirementAnalyses = (props: {
    files: AutoBeAnalyzeFile[];
  }) => {
    const dict: Set<string> = new Set(props.files.map((f) => f.filename));
    const quoted: string[] = props.files.map((f) => JSON.stringify(f.filename));
    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${props.files
        .map((f) => [f.filename, f.documentType].join(" | "))
        .join("\n")}
    `;

    return (
      input: unknown,
    ): IValidation<IAutoBePreliminaryApplication.IRequirementAnalysesProps> => {
      const result: IValidation<IAutoBePreliminaryApplication.IRequirementAnalysesProps> =
        typia.validate<IAutoBePreliminaryApplication.IRequirementAnalysesProps>(
          input,
        );
      if (result.success === false) return result;

      const errors: IValidation.IError[] = [];
      result.data.filenames.forEach((key, i) => {
        if (dict.has(key) === true) return;
        errors.push({
          path: `$input.filenames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
      });
      return finalize(result, errors);
    };
  };

  export const gerPrismaSchemas = (props: {
    schemas: AutoBePrisma.IModel[];
  }) => {
    const dict: Set<string> = new Set(props.schemas.map((s) => s.name));
    const quoted: string[] = props.schemas.map((s) => JSON.stringify(s.name));
    const description = StringUtil.trim`
      Here are the list of prisma schema models you can use.

      Please select from the below. Never assume non-existing models.

      ${quoted.map((q) => `- ${q}`).join("\n")}
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
      result.data.schemas.forEach((key, i) => {
        if (dict.has(key) === true) return;
        errors.push({
          path: `$input.schemas[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
      });
      return finalize(result, errors);
    };
  };

  export const getInterfaceOperations = (props: {
    operations: AutoBeOpenApi.IOperation[];
  }) => {
    const dict: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.operations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
    );
    const description: string = StringUtil.trim`
      Here are the list of API endpoints you can use.

      Please select from the below. Never assume non-existing endpoints.\

      Method | Path 
      -------|------
      ${props.operations.map((o) => [o.method, o.path].join(" | ")).join("\n")}
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
        if (dict.has(key) === true) return;
        errors.push({
          path: `$input.endpoints[${i}]`,
          value: key,
          expected: "AutoBeOpenApi.IEndpoint",
          description,
        });
      });
      return finalize(result, errors);
    };
  };

  export const getInterfaceSchemas = (props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }) => {
    const quoted: string[] = Object.keys(props.schemas).map((k) =>
      JSON.stringify(k),
    );
    const description: string = StringUtil.trim`
      Here are the list of interface schemas you can use.

      Please select from the below. Never assume non-existing schemas.

      ${quoted.map((q) => `- ${q}`).join("\n")}
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
        if (props.schemas[key] !== undefined) return;
        errors.push({
          path: `$input.typeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description,
        });
      });
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
