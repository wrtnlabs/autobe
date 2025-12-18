import {
  AutoBeOpenApi,
  AutoBeTestAuthorizeFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { IAutoBeTestArtifacts } from "../structures/IAutoBeTestArtifacts";
import { IAutoBeTestAuthorizeProcedure } from "../structures/IAutoBeTestAuthorizeWriteResult";
import { AutoBeTestFunctionProgrammer } from "./AutoBeTestFunctionProgrammer";

export namespace AutoBeTestAuthorizeProgrammer {
  /* ----------------------------------------------------------------
    GETTERS
  ---------------------------------------------------------------- */
  export function size(document: AutoBeOpenApi.IDocument): number {
    return document.operations.filter((op) => op.authorizationType !== null)
      .length;
  }

  export function getFunctionName(props: {
    actor: string;
    operation: AutoBeOpenApi.IOperation;
  }): string {
    if (props.operation.authorizationType === null)
      throw new Error("Operation is not an authorization operation.");
    const elements: string[] = [
      "authorize",
      props.actor,
      props.operation.authorizationType,
    ];
    return elements.map(NamingConvention.snake).join("_");
  }

  /* ----------------------------------------------------------------
    WRITERS
  ---------------------------------------------------------------- */
  export function writeTemplate(props: {
    actor: string;
    operation: AutoBeOpenApi.IOperation;
  }): string {
    if (props.operation.requestBody === null)
      throw new Error("Authorization operation needs request body.");
    else if (props.operation.responseBody === null)
      throw new Error("Authorization operation needs response body.");

    const functionName: string = getFunctionName(props);
    const accessor: string[] = props.operation.accessor!;
    const questionToken: string =
      props.operation.authorizationType !== "refresh" ? "?" : "";

    return StringUtil.trim`
      export async function ${functionName}(
        connection: api.IConnection,
        props: {
          body${questionToken}: ${props.operation.requestBody.typeName}
        },
      ): Promise<${props.operation.responseBody.typeName}> {
        return await api.functional.${accessor.join(".")}(
          connection,
          { ... }
        );
      }
    `;
  }

  /* ----------------------------------------------------------------
    COMPILERS
  ---------------------------------------------------------------- */
  export function compile(props: {
    compiler: IAutoBeCompiler;
    procedure: IAutoBeTestAuthorizeProcedure;
    step: number;
  }): Promise<AutoBeTestValidateEvent<AutoBeTestAuthorizeFunction>> {
    return AutoBeTestFunctionProgrammer.compile({
      compiler: props.compiler,
      document: props.procedure.artifacts.document,
      function: props.procedure.function,
      files: {
        [props.procedure.function.location]: props.procedure.function.content,
      },
      step: props.step,
    });
  }

  export async function replaceImportStatements(props: {
    compiler: IAutoBeCompiler;
    artifacts: IAutoBeTestArtifacts;
    content: string;
  }): Promise<string> {
    let code: string = await props.compiler.typescript.beautify(props.content);
    code = code
      .split("\r\n")
      .join("\n")
      .split("\n")
      .filter((str) => str.trim().startsWith("import") === false)
      .join("\n");
    const imports: string[] =
      AutoBeTestFunctionProgrammer.writeImportStatements(
        props.artifacts.document.components.schemas,
      );
    code = [...imports, code].join("\n");
    return await props.compiler.typescript.beautify(code);
  }
}
