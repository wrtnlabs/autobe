import {
  AutoBeOpenApi,
  AutoBeTestAuthorizeFunction,
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { validateEmptyCode } from "../../../utils/validateEmptyCode";
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

  export function getFunctionName(operation: AutoBeOpenApi.IOperation): string {
    if (
      operation.authorizationActor === null ||
      operation.authorizationType === null
    )
      throw new Error("Operation is not an authorization operation.");
    const elements: string[] = [
      "authorize",
      operation.authorizationActor,
      operation.authorizationType,
    ];
    return elements.map(NamingConvention.snake).join("_");
  }

  /* ----------------------------------------------------------------
    WRITERS
  ---------------------------------------------------------------- */
  export function writeTemplate(props: {
    operation: AutoBeOpenApi.IOperation;
    schema: AutoBeOpenApi.IJsonSchema;
  }): string {
    if (props.operation.requestBody === null)
      throw new Error("Authorization operation needs request body.");
    else if (props.operation.responseBody === null)
      throw new Error("Authorization operation needs response body.");

    const functionName: string = getFunctionName(props.operation);
    const accessor: string[] = props.operation.accessor!;

    if (props.operation.authorizationActor !== "join")
      return StringUtil.trim`
        export async function ${functionName}(
          connection: api.IConnection,
          props: {
            body: ${props.operation.requestBody.typeName}
          },
        ): Promise<${props.operation.responseBody.typeName}> {
          return await api.functional.${accessor.join(".")}(
            connection,
            { ... },
          );
        }
      `;
    else if (AutoBeOpenApiTypeChecker.isObject(props.schema) === false)
      return StringUtil.trim`
        export async function ${functionName}(
          connection: api.IConnection,
          props: {
            body?: ${props.operation.requestBody.typeName}
          },
        ): Promise<${props.operation.responseBody.typeName}> {
          const joinInput = {
            ...{{YOUR_PROPERTIES_HERE}}
          } satisfies ${props.operation.requestBody.typeName};
          return await api.functional.${accessor.join(".")}(
            connection,
            {
              body: joinInput,
            },
          );
        }
      `;
    return StringUtil.trim`
      export async function ${functionName}(
        connection: api.IConnection,
        props: {
          body?: ${props.operation.requestBody.typeName}
        },
      ): Promise<${props.operation.responseBody.typeName}> {
        const joinInput = {
${Object.keys(props.schema.properties).map(
  (k) => `    ${Escaper.variable(k) ? k : `[${JSON.stringify(k)}]`}: ...,`,
)}
        } satisfies ${props.operation.requestBody.typeName};
        return await api.functional.${accessor.join(".")}(
          connection,
          {
            body: joinInput,
          },
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
    let code: string = await props.compiler.typescript.removeImportStatements(
      props.content,
    );
    const imports: string[] =
      AutoBeTestFunctionProgrammer.writeImportStatements(
        props.artifacts.document.components.schemas,
      );
    code = [...imports, code].join("\n");
    return await props.compiler.typescript.beautify(code);
  }

  /* ----------------------------------------------------------------
      VALIDATE
    ---------------------------------------------------------------- */
  export function validate(props: {
    procedure: IAutoBeTestAuthorizeProcedure;
    draft: string;
    revise: {
      final: string | null;
    };
  }): IValidation.IError[] {
    return validateEmptyCode({
      path: "$input",
      asynchronous: true,
      name: props.procedure.function.name,
      draft: props.draft,
      revise: props.revise,
    });
  }
}
