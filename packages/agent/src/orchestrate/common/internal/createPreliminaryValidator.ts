import { AutoBeOpenApi, AutoBePrisma } from "@autobe/interface";
import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import typia, { IValidation } from "typia";

import { IAutoBePreliminaryApplication } from "../structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

type Validator<Key extends keyof IAutoBePreliminaryApplication> = {
  [P in Key]: (
    input: unknown,
  ) => IValidation<Parameters<IAutoBePreliminaryApplication[P]>[0]>;
};

export function createPreliminaryValidate<
  Key extends keyof IAutoBePreliminaryApplication,
>(
  keys: Key[],
  collection: Pick<IAutoBePreliminaryCollection, Key>,
): Validator<Key> {
  const result: Validator<Key> = {} as any;
  for (const k of keys)
    result[k] = PreliminaryApplicationValidator[k](
      collection as IAutoBePreliminaryCollection,
    );
  return result;
}

namespace PreliminaryApplicationValidator {
  export const analyzeFiles = (props: {
    analyzeFiles: AutoBeAnalyzeFile[];
  }) => {
    const dict: Set<string> = new Set(
      props.analyzeFiles.map((f) => f.filename),
    );
    const quoted: string[] = props.analyzeFiles.map((f) =>
      JSON.stringify(f.filename),
    );
    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${props.analyzeFiles
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

  export const prismaSchemas = (props: {
    prismaSchemas: AutoBePrisma.IModel[];
  }) => {
    const dict: Set<string> = new Set(props.prismaSchemas.map((s) => s.name));
    const quoted: string[] = props.prismaSchemas.map((s) =>
      JSON.stringify(s.name),
    );
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
      result.data.schemaNames.forEach((key, i) => {
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

  export const interfaceOperations = (props: {
    interfaceOperations: AutoBeOpenApi.IOperation[];
  }) => {
    const dict: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.interfaceOperations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const description: string = StringUtil.trim`
      Here are the list of API endpoints you can use.

      Please select from the below. Never assume non-existing endpoints.\

      Method | Path 
      -------|------
      ${props.interfaceOperations.map((o) => [o.method, o.path].join(" | ")).join("\n")}
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

  export const interfaceSchemas = (props: {
    interfaceSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }) => {
    const quoted: string[] = Object.keys(props.interfaceSchemas).map((k) =>
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
        if (props.interfaceSchemas[key] !== undefined) return;
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
