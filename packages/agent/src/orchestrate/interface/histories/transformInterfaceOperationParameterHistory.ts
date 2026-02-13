import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

export const transformInterfaceOperationParameterHistory = (props: {
  typeName: string;
  operations: AutoBeOpenApi.IOperation[];
}): string => {
  const operations: AutoBeOpenApi.IOperation[] = props.operations.filter(
    (op) => op.requestBody?.typeName === props.typeName,
  );
  if (operations.length === 0) return "";

  const actors: Set<string> = new Set(
    operations.map((op) => op.authorizationActor).filter((s) => s !== null),
  );
  return [writeActor(Array.from(actors)), writeOperations(operations)]
    .filter((s) => s !== null)
    .join("\n\n");
};

function writeActor(actors: string[]): string | null {
  if (actors.length === 0) return null;
  return StringUtil.trim`
    ### Authorization Actors

    These following actors and their sessions are coming from 
    the JWT authorization token, so you don't need to define them 
    in the request body schema.

    ${actors.map((a) => `- ${a}`).join("\n")}
  `;
}

function writeOperations(
  operations: AutoBeOpenApi.IOperation[],
): string | null {
  operations = operations.filter((op) => op.parameters.length !== 0);
  if (operations.length === 0) return null;
  return StringUtil.trim`
    ### Path Parameters

    These following path parameters are defined for the operations,
    so you don't need to define them in the request body schema.

    ${operations
      .map((op) => [
        `- ${op.method.toUpperCase()} ${op.path}`,
        ...op.parameters.map((p) => `  - \`${p.name}\``),
      ])
      .flat()
      .join("\n")}
  `;
}
