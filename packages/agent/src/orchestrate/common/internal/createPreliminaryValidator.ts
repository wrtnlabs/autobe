import { AutoBeOpenApi } from "@autobe/interface";
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
>(props: {
  keys: Key[];
  all: Pick<IAutoBePreliminaryCollection, Key>;
  local: Pick<IAutoBePreliminaryCollection, Key>;
}): Validator<Key> {
  const result: Validator<Key> = {} as any;
  for (const k of props.keys)
    result[k] = PreliminaryApplicationValidator[k]({
      all: props.all as IAutoBePreliminaryCollection,
      local: props.local as IAutoBePreliminaryCollection,
    });
  return result;
}

namespace PreliminaryApplicationValidator {
  export const analyzeFiles = (props: {
    all: Pick<IAutoBePreliminaryCollection, "analyzeFiles">;
    local: Pick<IAutoBePreliminaryCollection, "analyzeFiles">;
  }) => {
    const everything: Set<string> = new Set(
      props.all.analyzeFiles.map((f) => f.filename),
    );
    const oldbie: Set<string> = new Set(
      props.local.analyzeFiles.map((f) => f.filename),
    );
    const quoted: string[] = props.all.analyzeFiles
      .filter((f) => oldbie.has(f.filename) === false)
      .map((f) => JSON.stringify(f.filename));

    const description: string = StringUtil.trim`
      Here are the list of analysis requirement document files you can use.

      Please select from the below. Never type arbitrary file names.

      Filename | Document Type
      ---------|---------------
      ${props.all.analyzeFiles
        .map((f) => [f.filename, f.documentType].join(" | "))
        .join("\n")}
    `;
    const again = (key: string) =>
      `The file ${JSON.stringify(
        key,
      )} is already mounted. Please do not request it again.`;

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
        if (everything.has(key) === false)
          errors.push({
            path: `$input.filenames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description,
          });
        else if (oldbie.has(key) === true)
          errors.push({
            path: `$input.filenames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description: again(key),
          });
      });
      return finalize(result, errors);
    };
  };

  export const prismaSchemas = (props: {
    all: Pick<IAutoBePreliminaryCollection, "prismaSchemas">;
    local: Pick<IAutoBePreliminaryCollection, "prismaSchemas">;
  }) => {
    const everything: Set<string> = new Set(
      props.all.prismaSchemas.map((s) => s.name),
    );
    const oldbie: Set<string> = new Set(
      props.local.prismaSchemas.map((s) => s.name),
    );
    const quoted: string[] = props.all.prismaSchemas
      .filter((s) => oldbie.has(s.name) === false)
      .map((s) => JSON.stringify(s.name));

    const description = StringUtil.trim`
      Here are the list of prisma schema models you can use.

      Please select from the below. Never assume non-existing models.

      ${quoted.map((q) => `- ${q}`).join("\n")}
    `;
    const again = (key: string) =>
      `The prisma schema model ${JSON.stringify(
        key,
      )} is already mounted. Please do not request it again.`;

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
        if (everything.has(key) === false)
          errors.push({
            path: `$input.schemas[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description,
          });
        else if (oldbie.has(key) === true)
          errors.push({
            path: `$input.schemas[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description: again(key),
          });
      });
      return finalize(result, errors);
    };
  };

  export const interfaceOperations = (props: {
    all: Pick<IAutoBePreliminaryCollection, "interfaceOperations">;
    local: Pick<IAutoBePreliminaryCollection, "interfaceOperations">;
  }) => {
    const everything: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.all.interfaceOperations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.local.interfaceOperations.map((o) => ({
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
      ${props.all.interfaceOperations
        .map((o) => [o.method, o.path].join(" | "))
        .join("\n")}
      }
    `;
    const again = (key: AutoBeOpenApi.IEndpoint) =>
      `The endpoint (method: ${JSON.stringify(
        key.method,
      )}, path: ${JSON.stringify(
        key.path,
      )}) is already mounted. Please do not request it again.`;

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
        if (everything.has(key) === false)
          errors.push({
            path: `$input.endpoints[${i}]`,
            value: key,
            expected: "AutoBeOpenApi.IEndpoint",
            description,
          });
        else if (oldbie.has(key) === true)
          errors.push({
            path: `$input.endpoints[${i}]`,
            value: key,
            expected: "AutoBeOpenApi.IEndpoint",
            description: again(key),
          });
      });
      return finalize(result, errors);
    };
  };

  export const interfaceSchemas = (props: {
    all: Pick<IAutoBePreliminaryCollection, "interfaceSchemas">;
    local: Pick<IAutoBePreliminaryCollection, "interfaceSchemas">;
  }) => {
    const quoted: string[] = Object.keys(props.all.interfaceSchemas)
      .filter((k) => props.local.interfaceSchemas[k] === undefined)
      .map((k) => JSON.stringify(k));

    const description: string = StringUtil.trim`
      Here are the list of interface schemas you can use.

      Please select from the below. Never assume non-existing schemas.

      ${quoted.map((q) => `- ${q}`).join("\n")}
    `;
    const again = (key: string) =>
      `The interface schema ${JSON.stringify(
        key,
      )} is already mounted. Please do not request it again.`;

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
        if (props.all.interfaceSchemas[key] === undefined)
          errors.push({
            path: `$input.typeNames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description,
          });
        else if (props.local.interfaceSchemas[key] !== undefined)
          errors.push({
            path: `$input.typeNames[${i}]`,
            value: key,
            expected: quoted.join(" | "),
            description: again(key),
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
