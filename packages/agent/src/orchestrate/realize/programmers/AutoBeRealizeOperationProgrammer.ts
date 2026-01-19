import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";
import { AutoBeRealizeCollectorProgrammer } from "./AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "./AutoBeRealizeTransformerProgrammer";

export namespace AutoBeRealizeOperationProgrammer {
  export function getName(operation: AutoBeOpenApi.IOperation): string {
    return getFunctionName(operation);
  }

  export function getScenario(props: {
    authorizations: AutoBeRealizeAuthorization[];
    operation: AutoBeOpenApi.IOperation;
  }): IAutoBeRealizeScenarioResult {
    const authorization: AutoBeRealizeAuthorization | undefined =
      props.authorizations.find(
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
  }): string {
    const scenario: IAutoBeRealizeScenarioResult = getScenario({
      authorizations: props.authorizations,
      operation: props.operation,
    });
    return writeTemplateCode({
      scenario,
      operation: props.operation,
      schemas: props.schemas,
      authorization:
        props.authorizations.find(
          (a) => a.actor.name === props.operation.authorizationActor,
        ) ?? null,
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

function writeImportStatements(props: {
  operation: AutoBeOpenApi.IOperation;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
}): string[] {
  const typeReferences: Set<string> = new Set();
  const visit = (key: string) =>
    OpenApiTypeChecker.visit({
      schema: {
        $ref: `#/components/schemas/${key}`,
      },
      components: { schemas: props.schemas },
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          typeReferences.add(next.$ref.split("/").pop()!.split(".")[0]!);
      },
    });
  if (props.operation.requestBody) visit(props.operation.requestBody.typeName);
  if (props.operation.responseBody)
    visit(props.operation.responseBody.typeName);

  const imports = [
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
  return imports;
}

function writeTemplateCode(props: {
  scenario: IAutoBeRealizeScenarioResult;
  operation: AutoBeOpenApi.IOperation;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  authorization: AutoBeRealizeAuthorization | null;
}): string {
  // Collect all function parameters in order
  const functionParameters: string[] = [];

  // Add authentication parameter if needed (e.g., user: IUser, admin: IAdmin)
  if (props.authorization && props.authorization.actor.name) {
    // Debug: Log the values to check what's being used
    const authParameter = `${props.authorization.actor.name}: ${props.authorization.payload.name}`;
    functionParameters.push(authParameter);
  }

  // Add path parameters (e.g., id, postId, etc.)
  const pathParameters = props.operation.parameters.map((param) => {
    return `${param.name}: ${writeParameterType(param.schema)}`;
  });
  functionParameters.push(...pathParameters);

  // Add request body parameter if present
  if (props.operation.requestBody?.typeName) {
    const bodyParameter = `body: ${props.operation.requestBody.typeName}`;
    functionParameters.push(bodyParameter);
  }

  // Format parameters for props object
  const hasParameters = functionParameters.length > 0;

  let formattedSignature: string;
  if (hasParameters) {
    const propsFields = functionParameters
      .map((param) => `  ${param}`)
      .join(";\n");

    formattedSignature = `props: {\n${propsFields};\n}`;
  } else {
    formattedSignature = "";
  }

  // Determine return type
  const returnType = props.operation.responseBody?.typeName ?? "void";

  // Generate the complete template
  return StringUtil.trim`
    Complete the code below, disregard the import part and return only the function part.

    \`\`\`typescript
    ${writeImportStatements(props).join("\n")} 

    // DON'T CHANGE FUNCTION NAME AND PARAMETERS,
    // ONLY YOU HAVE TO WRITE THIS FUNCTION BODY, AND USE IMPORTED.
    export async function ${props.scenario.functionName}(${formattedSignature}): Promise<${returnType}> {
      ...
    }
    \`\`\`
  `;
}

function writeParameterType(
  schema: AutoBeOpenApi.IParameter["schema"],
): string {
  const elements: string[] =
    schema.type === "integer"
      ? ["number", `tags.Type<"int32">`]
      : [schema.type];
  if (schema.type === "number") {
    if (schema.minimum !== undefined)
      elements.push(`tags.Minimum<${schema.minimum}>`);
    if (schema.maximum !== undefined)
      elements.push(`tags.Maximum<${schema.maximum}>`);
    if (schema.exclusiveMinimum !== undefined)
      elements.push(`tags.ExclusiveMinimum<${schema.exclusiveMinimum}>`);
    if (schema.exclusiveMaximum !== undefined)
      elements.push(`tags.ExclusiveMaximum<${schema.exclusiveMaximum}>`);
    if (schema.multipleOf !== undefined)
      elements.push(`tags.MultipleOf<${schema.multipleOf}>`);
  } else if (schema.type === "string") {
    if (schema.format !== undefined)
      elements.push(`tags.Format<${JSON.stringify(schema.format)}>`);
    if (schema.contentMediaType !== undefined)
      elements.push(
        `tags.ContentMediaType<${JSON.stringify(schema.contentMediaType)}>`,
      );
    if (schema.pattern !== undefined)
      elements.push(`tags.Pattern<${JSON.stringify(schema.pattern)}>`);
    if (schema.minLength !== undefined)
      elements.push(`tags.MinLength<${schema.minLength}>`);
    if (schema.maxLength !== undefined)
      elements.push(`tags.MaxLength<${schema.maxLength}>`);
  }
  return elements.join(" & ");
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
