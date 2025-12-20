import {
  AutoBeOpenApi,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import {
  AutoBeOpenApiEndpointComparator,
  AutoBeOpenApiTypeChecker,
  StringUtil,
} from "@autobe/utils";
import path from "path";
import { HashSet } from "tstl";
import { IValidation } from "typia";

import { validateEmptyCode } from "../../../utils/validateEmptyCode";
import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { IAutoBeTestOperationProcedure } from "../structures/IAutoBeTestOperationProcedure";
import { AutoBeTestFunctionProgrammer } from "./AutoBeTestFunctionProgrammer";

export namespace AutoBeTestOperationProgrammer {
  /* ----------------------------------------------------------------
    WRITERS
  ---------------------------------------------------------------- */
  export function writeTemplateCode(scenario: AutoBeTestScenario): string {
    return StringUtil.trim`
      export async function ${scenario.functionName}(
        connection: api.IConnection,
      ): Promise<void> {
        ...
      }
    `;
  }

  /* ----------------------------------------------------------------
    COMPILERS
  ---------------------------------------------------------------- */
  export function compile(props: {
    compiler: IAutoBeCompiler;
    document: AutoBeOpenApi.IDocument;
    procedure: IAutoBeTestOperationProcedure;
    step: number;
  }): Promise<AutoBeTestValidateEvent<AutoBeTestOperationFunction>> {
    const endpoints: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      props.procedure.artifacts.document.operations.map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    for (const authorize of props.procedure.authorizes)
      endpoints.insert(authorize.endpoint);

    const operations: AutoBeOpenApi.IOperation[] = endpoints
      .toJSON()
      .map((endpoint) =>
        props.document.operations.find(
          (o) => o.method === endpoint.method && o.path === endpoint.path,
        ),
      )
      .filter((o) => o !== undefined);
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {};
    const visit = (value: AutoBeOpenApi.IJsonSchema) => {
      if (AutoBeOpenApiTypeChecker.isReference(value)) {
        const key: string = value.$ref.split("/").pop()!;
        schemas[key] = props.document.components.schemas[key];
      }
    };
    for (const op of operations) {
      if (op.requestBody) visit({ $ref: op.requestBody.typeName });
      if (op.responseBody) visit({ $ref: op.responseBody.typeName });
    }

    return AutoBeTestFunctionProgrammer.compile({
      compiler: props.compiler,
      document: {
        ...props.document,
        operations,
        components: {
          authorizations: props.document.components.authorizations,
          schemas,
        },
      },
      function: props.procedure.function,
      files: {
        ...Object.fromEntries(
          [
            ...props.procedure.authorizes,
            ...props.procedure.prepares,
            ...props.procedure.generates,
          ].map((f) => [f.location, f.content]),
        ),
        [props.procedure.function.location]: props.procedure.function.content,
      },
      step: props.step,
    });
  }

  export async function replaceImportStatements(props: {
    compiler: IAutoBeCompiler;
    artifacts: IAutoBeTestArtifacts;
    prepares: AutoBeTestPrepareFunction[];
    generates: AutoBeTestGenerateFunction[];
    authorizes: AutoBeTestAuthorizeFunction[];
    location: string;
    content: string;
  }): Promise<string> {
    let code: string = await props.compiler.typescript.beautify(props.content);
    code = code
      .split("\r\n")
      .join("\n")
      .split("\n")
      .filter((str) => str.trim().startsWith("import") === false)
      .join("\n");

    const imports: string[] = [
      ...AutoBeTestFunctionProgrammer.writeImportStatements(
        props.artifacts.document.components.schemas,
      ),
      ...[...props.prepares, ...props.generates, ...props.authorizes].map(
        (f) =>
          `import { ${f.name} } from "${path
            .relative(
              path.dirname(props.location),
              f.location.replace(".ts", ""),
            )
            .replaceAll(path.sep, "/")}";`,
      ),
    ];
    code = [...imports, code].join("\n");
    return await props.compiler.typescript.beautify(code);
  }

  /* ----------------------------------------------------------------
    VALIDATE
  ---------------------------------------------------------------- */
  export function validate(props: {
    procedure: IAutoBeTestOperationProcedure;
    draft: string;
    revise: {
      final: string | null;
    };
  }): IValidation.IError[] {
    return validateEmptyCode({
      path: "$input",
      functionName: props.procedure.function.name,
      draft: props.draft,
      revise: props.revise,
    });
  }
}
