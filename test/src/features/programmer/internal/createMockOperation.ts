import { AutoBeOpenApi } from "@autobe/interface";

export function createMockOperation(props: {
  method: AutoBeOpenApi.IEndpoint["method"];
  path: string;
  parameters?: AutoBeOpenApi.IParameter[];
  requestBody?: { typeName: string } | null;
  responseBody?: { typeName: string } | null;
}): AutoBeOpenApi.IOperation {
  return {
    method: props.method,
    path: props.path as AutoBeOpenApi.IOperation["path"],
    specification: "test specification",
    description: "test description",
    authorizationType: null,
    authorizationActor: null,
    parameters: props.parameters ?? [],
    requestBody: props.requestBody
      ? { description: "test", typeName: props.requestBody.typeName }
      : null,
    responseBody: props.responseBody
      ? { description: "test", typeName: props.responseBody.typeName }
      : null,
    name: "test" as AutoBeOpenApi.IOperation["name"],
    prerequisites: [],
  };
}
