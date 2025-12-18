import {
  AutoBeOpenApi,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { IAutoBeTestGenerateProcedure } from "../structures/IAutoBeTestGenerateProcedure";
import { AutoBeTestFunctionProgrammer } from "./AutoBeTestFunctionProgrammer";
import { AutoBeTestPrepareProgrammer } from "./AutoBeTestPrepareProgrammer";

export namespace AutoBeTestGenerateProgrammer {
  /* ----------------------------------------------------------------
    GETTERS
  ---------------------------------------------------------------- */
  export function is(
    document: AutoBeOpenApi.IDocument,
    operation: AutoBeOpenApi.IOperation,
  ): boolean {
    if (operation.requestBody === null) return false;
    const schema: AutoBeOpenApi.IJsonSchema | undefined =
      document.components.schemas[operation.requestBody.typeName];
    if (schema === undefined) return false;
    return AutoBeTestPrepareProgrammer.is(
      operation.requestBody.typeName,
      schema,
    );
  }

  export function size(document: AutoBeOpenApi.IDocument): number {
    return document.operations.filter((operation) =>
      AutoBeTestGenerateProgrammer.is(document, operation),
    ).length;
  }

  export function getFunctionName(operation: AutoBeOpenApi.IOperation): string {
    const accessor: string[] = operation.accessor!.map(NamingConvention.snake);
    return `generate_random_${accessor.join("_")}`;
  }

  /* ----------------------------------------------------------------
    WRITERS
  ---------------------------------------------------------------- */
  export function writeTemplateCode(props: {
    operation: AutoBeOpenApi.IOperation;
    prepare: AutoBeTestPrepareFunction;
  }): string {
    const functionName: string = getFunctionName(props.operation);
    const input: string = props.operation.requestBody?.typeName ?? "unknown";
    const output: string = props.operation.responseBody?.typeName ?? "void";
    return StringUtil.trim`
      export async function ${functionName}(
        connection: api.IConnection,
        props: {
          body?: DeepPartial<${input}> | undefined;
${writeParameterDeclarations(props.operation)}
        }
      ): Promise<${output}> {
        const prepared: ${input} = ${props.prepare.name}(
          props.body
        );
        return await api.functional.${props.operation.accessor!.join(".")}(
          connection,
          {
            body,
${writeParameterArguments(props.operation)}
        );
      }
    `;
  }

  function writeParameterDeclarations(
    operation: AutoBeOpenApi.IOperation,
  ): string {
    if (operation.parameters.length === 0) return "";
    return StringUtil.trim`
      params: {
${operation.parameters.map((p) => `  ${p.name}: ${p.schema.type};`).join("\n")}
      }
    `
      .split("\n")
      .filter((line) => line.length !== 0)
      .map((line) => `    ${line.trim()}`)
      .join("\n");
  }

  function writeParameterArguments(
    operation: AutoBeOpenApi.IOperation,
  ): string {
    if (operation.parameters.length === 0) return "";
    return operation.parameters
      .map((p) => `    ${p.name}: props.params.${p.name},`)
      .join("\n");
  }

  /* ----------------------------------------------------------------
    COMPILERS
  ---------------------------------------------------------------- */
  export function compile(props: {
    compiler: IAutoBeCompiler;
    procedure: IAutoBeTestGenerateProcedure;
    step: number;
  }): Promise<AutoBeTestValidateEvent<AutoBeTestGenerateFunction>> {
    return AutoBeTestFunctionProgrammer.compile({
      compiler: props.compiler,
      document: props.procedure.artifacts.document,
      function: props.procedure.function,
      files: {
        [props.procedure.function.location]: props.procedure.function.content,
        [props.procedure.prepare.location]: props.procedure.prepare.content,
      },
      step: props.step,
    });
  }

  export async function replaceImportStatements(props: {
    compiler: IAutoBeCompiler;
    artifacts: IAutoBeTestArtifacts;
    prepare: AutoBeTestPrepareFunction;
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
      `import { ${props.prepare.name} } from "${props.prepare.location}";`,
    ];
    code = [...imports, code].join("\n");
    return await props.compiler.typescript.beautify(code);
  }
}
