import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

export namespace AutoBeTestAuthorizeProgrammer {
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
}
