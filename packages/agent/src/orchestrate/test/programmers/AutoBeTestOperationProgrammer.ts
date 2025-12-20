import {
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import path from "path";
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
    procedure: IAutoBeTestOperationProcedure;
    step: number;
  }): Promise<AutoBeTestValidateEvent<AutoBeTestOperationFunction>> {
    return AutoBeTestFunctionProgrammer.compile({
      compiler: props.compiler,
      document: props.procedure.artifacts.document,
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
