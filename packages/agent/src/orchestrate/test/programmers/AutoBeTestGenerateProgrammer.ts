import {
  AutoBeOpenApi,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";

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

  /* ----------------------------------------------------------------
    WRITERS
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
