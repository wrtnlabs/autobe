import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { OpenApiTypeChecker } from "@typia/utils";
import { IValidation } from "typia";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { AutoBeRealizeCollectorProgrammer } from "./AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "./AutoBeRealizeTransformerProgrammer";
import { resolvePropertyTransformer } from "./internal/resolvePropertyTransformer";
import { writeRealizeOperationTemplate } from "./internal/writeRealizeOperationTemplate";

export namespace AutoBeRealizeOperationProgrammer {
  /**
   * Check if the operation is a public auth operation (login, join, refresh).
   * These operations must be publicly accessible and should not have auth
   * decorators.
   */
  export function isPublicAuthOperation(
    operation: AutoBeOpenApi.IOperation,
  ): boolean {
    return (
      operation.authorizationType === "login" ||
      operation.authorizationType === "join" ||
      operation.authorizationType === "refresh"
    );
  }

  export function getName(operation: AutoBeOpenApi.IOperation): string {
    return getFunctionName(operation);
  }

  export function getScenario(props: {
    authorizations: AutoBeRealizeAuthorization[];
    operation: AutoBeOpenApi.IOperation;
  }): IAutoBeRealizeScenarioResult {
    // Skip authorization for public auth operations (login, join, refresh)
    const authorization: AutoBeRealizeAuthorization | undefined =
      isPublicAuthOperation(props.operation)
        ? undefined
        : props.authorizations.find(
            (el) => el.actor.name === props.operation.authorizationActor,
          );
    const functionName: string = getFunctionName(props.operation);
    return {
      operation: props.operation,
      functionName: functionName,
      location: `src/providers/${functionName}.ts`,
      decoratorEvent: authorization,
    };
  }

  export function getAdditional(props: {
    authorizations: AutoBeRealizeAuthorization[];
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
  }): Record<string, string> {
    return {
      ...Object.fromEntries(
        props.authorizations.map((a) => [
          a.payload.location,
          a.payload.content,
        ]),
      ),
      ...Object.fromEntries(
        props.collectors.map((c) => [c.location, c.content]),
      ),
      ...Object.fromEntries(
        props.transformers.map((t) => [t.location, t.content]),
      ),
    };
  }

  export async function replaceImportStatements(
    ctx: AutoBeContext,
    props: {
      operation: AutoBeOpenApi.IOperation;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
      payload?: string;
    },
  ): Promise<string> {
    let { code, payload } = props;

    // Beautify code first for consistent formatting
    const compiler: IAutoBeCompiler = await ctx.compiler();
    code = await compiler.typescript.removeImportStatements(code);

    // Build the standard imports
    const imports = writeImportStatements(props);

    // Only add decoratorType import if it exists
    if (payload) {
      imports.push(
        `import { ${payload} } from "../decorators/payload/${payload}"`,
      );
    }
    imports.push(
      ...AutoBeRealizeCollectorProgrammer.getNeighbors(code).map(
        (c) => `import { ${c} } from "../collectors/${c}"`,
      ),
      ...AutoBeRealizeTransformerProgrammer.getNeighbors(code).map(
        (c) => `import { ${c} } from "../transformers/${c}"`,
      ),
    );
    code = [...imports, "", code].join("\n");

    // Clean up formatting issues
    code =
      code
        // Remove lines with only whitespace
        .replace(/^\s+$/gm, "")
        // Replace 3+ consecutive newlines with exactly 2 newlines
        .replace(/\n{3,}/g, "\n\n")
        // Ensure proper spacing after import section
        .replace(/(import.*?;)(\s*)(\n(?!import|\s*$))/g, "$1\n\n$3")
        // Trim and ensure single trailing newline
        .trim() + "\n";

    // fix escaped codes
    code = code.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");

    // Apply final beautification
    code = await compiler.typescript.beautify(code);
    code = code.replaceAll("typia.tags.assert", "typia.assert");
    return code;
  }

  export function writeTemplate(props: {
    authorizations: AutoBeRealizeAuthorization[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    operation: AutoBeOpenApi.IOperation;
    collectors: AutoBeRealizeCollectorFunction[];
    transformers: AutoBeRealizeTransformerFunction[];
  }): string {
    const scenario: IAutoBeRealizeScenarioResult = getScenario({
      authorizations: props.authorizations,
      operation: props.operation,
    });
    // Skip authorization for public auth operations (login, join, refresh)
    const authorization: AutoBeRealizeAuthorization | null =
      isPublicAuthOperation(props.operation)
        ? null
        : (props.authorizations.find(
            (a) => a.actor.name === props.operation.authorizationActor,
          ) ?? null);
    return writeRealizeOperationTemplate({
      scenario,
      operation: props.operation,
      imports: writeImportStatements(props),
      authorization,
      schemas: props.schemas,
      collectors: props.collectors,
      transformers: props.transformers,
    });
  }

  export async function writeStructures(
    ctx: AutoBeContext,
    operation: AutoBeOpenApi.IOperation,
  ): Promise<Record<string, string>> {
    const document: AutoBeOpenApi.IDocument = filterDocument(
      operation,
      ctx.state().interface!.document,
    );
    const compiler: IAutoBeCompiler = await ctx.compiler();
    const entries: [string, string][] = Object.entries(
      await compiler.interface.write(document, []),
    );
    return Object.fromEntries(
      entries.filter(([key]) => key.startsWith("src/api/structures")),
    );
  }

  /**
   * Resolves transformers relevant to an operation, including neighbor
   * transformers for composite response types (e.g., dashboard endpoints).
   * Falls back to direct top-level match for simple response types.
   */
  export function getLocalTransformers(props: {
    operation: AutoBeOpenApi.IOperation;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    transformers: AutoBeRealizeTransformerFunction[];
  }): AutoBeRealizeTransformerFunction[] {
    const responseTypeName = props.operation.responseBody?.typeName;
    if (!responseTypeName) return [];

    const innerTypeName = responseTypeName.replace(/^IPage/, "");

    // Direct match (covers simple and paginated types)
    const direct = props.transformers.filter(
      (t) => t.plan.dtoTypeName === innerTypeName,
    );
    if (direct.length > 0) return direct;

    // Composite: resolve each property's transformer
    const schema = props.schemas[innerTypeName];
    if (!schema || !AutoBeOpenApiTypeChecker.isObject(schema)) return [];

    const results: AutoBeRealizeTransformerFunction[] = [];
    for (const value of Object.values(schema.properties ?? {})) {
      const resolved = resolvePropertyTransformer({
        schema: value as AutoBeOpenApi.IJsonSchemaProperty,
        transformers: props.transformers,
      });
      if (resolved && !results.includes(resolved.transformer))
        results.push(resolved.transformer);
    }
    return results;
  }

  export function validateEmptyCode(props: {
    functionName: string;
    draft: string;
    revise: {
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    if (props.draft.includes(props.functionName) === false)
      errors.push({
        path: "$input.request.draft",
        expected: `string (including function named '${props.functionName}')`,
        value: props.draft,
        description: description(props.functionName),
      });
    if (
      props.revise.final !== null &&
      props.revise.final.includes(props.functionName) === false
    )
      errors.push({
        path: "$input.request.revise.final",
        expected: `string (including function named '${props.functionName}')`,
        value: props.revise.final,
        description: description(props.functionName),
      });
    return errors;
  }

  /**
   * Validates that Transformer.select() and Transformer.transform() are always
   * used as a pair in operation code. Using one without the other causes type
   * mismatches: select() shapes the Prisma payload for transform(), so they
   * must appear together.
   */
  export function validateSelectTransformContract(props: {
    draft: string;
    revise: {
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    validateSelectTransformContractForCode({
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    if (props.revise.final !== null) {
      validateSelectTransformContractForCode({
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }
}

function validateSelectTransformContractForCode(props: {
  content: string;
  path: string;
  errors: IValidation.IError[];
}): void {
  const selectUsers: Set<string> = new Set();
  const transformUsers: Set<string> = new Set();
  const selectRegex: RegExp = /(\w+Transformer)\.select/g;
  const transformRegex: RegExp = /(\w+Transformer)\.transform/g;
  let match: RegExpExecArray | null;
  while ((match = selectRegex.exec(props.content)) !== null)
    selectUsers.add(match[1]!);
  while ((match = transformRegex.exec(props.content)) !== null)
    transformUsers.add(match[1]!);
  for (const name of transformUsers) {
    if (selectUsers.has(name) === false)
      props.errors.push({
        path: props.path,
        expected: `${name}.select() must appear in the query when ${name}.transform() is used.`,
        value: props.content,
        description: StringUtil.trim`
          You call ${name}.transform() but never include ${name}.select()
          in your Prisma query. The Payload type of ${name}.transform()
          is derived from ${name}.select() — without it, the data shape
          will not match and you will get type mismatch compile errors.
          Add \`...${name}.select()\` to your Prisma query's select/spread.
        `,
      });
  }
  for (const name of selectUsers) {
    if (transformUsers.has(name) === false)
      props.errors.push({
        path: props.path,
        expected: `${name}.transform() must be called when ${name}.select() is used.`,
        value: props.content,
        description: StringUtil.trim`
          You include ${name}.select() in your query but never call
          ${name}.transform() to convert the result. The data fetched
          via ${name}.select() is a raw Prisma payload shaped for
          ${name}.transform() — assigning it directly to a DTO field
          or transforming it inline will cause type mismatches. Call
          ${name}.transform() on the fetched data.
        `,
      });
  }
}

function writeImportStatements(props: {
  operation: AutoBeOpenApi.IOperation;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): string[] {
  const typeReferences: Set<string> = new Set();
  const visit = (key: string) =>
    OpenApiTypeChecker.visit({
      schema: { $ref: `#/components/schemas/${key}` },
      components: { schemas: props.schemas },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          typeReferences.add(next.$ref.split("/").pop()!.split(".")[0]!);
      },
    });
  if (props.operation.requestBody) visit(props.operation.requestBody.typeName);
  if (props.operation.responseBody)
    visit(props.operation.responseBody.typeName);

  return [
    `import { ArrayUtil } from "@nestia/e2e";`,
    'import { HttpException } from "@nestjs/common";',
    'import { Prisma } from "@prisma/sdk";',
    'import jwt from "jsonwebtoken";',
    'import typia, { tags } from "typia";',
    'import { v4 } from "uuid";',
    'import { MyGlobal } from "../MyGlobal";',
    'import { PasswordUtil } from "../utils/PasswordUtil";',
    'import { toISOStringSafe } from "../utils/toISOStringSafe"',
    "",
    `import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";`,
    ...Array.from(typeReferences).map(
      (ref) =>
        `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
  ];
}

function getFunctionName(operation: AutoBeOpenApi.IOperation): string {
  const functionName = `${operation.method}${operation.path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith("{") && segment.endsWith("}")) {
        // {userId} → UserId
        const paramName = segment.slice(1, -1);
        return paramName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
      }
      // api → Api, v1 → V1
      const words = segment.split("-");
      return words
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    })
    .join("")}`;
  return functionName;
}

const description = (func: string): string => StringUtil.trim`
  The function ${func} does not exist in the provided code snippet.

  The first reason of the non-existence is that the code snippet is empty,
  and the second reason is that AI has written different function name
  by mistake.

  Please make sure that the code snippet includes the function ${func}.
  Note that, you never have to write empty code or different function name.
`;

function filterDocument(
  operation: AutoBeOpenApi.IOperation,
  document: AutoBeOpenApi.IDocument,
): AutoBeOpenApi.IDocument {
  const components: AutoBeOpenApi.IComponents = {
    authorizations: document.components.authorizations,
    schemas: {},
  };
  const visit = (typeName: string) => {
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${typeName}` },
      closure: (s) => {
        if (OpenApiTypeChecker.isReference(s)) {
          const key: string = s.$ref.split("/").pop()!;
          components.schemas[key] = document.components.schemas[key];
        }
      },
    });
  };
  if (operation.requestBody) visit(operation.requestBody.typeName);
  if (operation.responseBody) visit(operation.responseBody.typeName);
  return {
    operations: [operation],
    components,
  };
}
