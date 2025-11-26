import {
  AutoBeOpenApi,
  AutoBeProcessAggregate,
  AutoBeTestWriteAuthorizationFunction,
  AutoBeTestWriteGenerationFunction,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";
import {
  AutoBeProcessAggregateFactory,
  transformOpenApiDocument,
} from "@autobe/utils";
import {
  HttpMigration,
  IHttpMigrateApplication,
  IHttpMigrateRoute,
  ILlmSchema,
  OpenApi,
} from "@samchon/openapi";
import { HashMap } from "tstl";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";

export const orchestrateTestGeneration = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    preparedFunctions: AutoBeTestWritePrepareFunction[];
    authorizationFunctions: AutoBeTestWriteAuthorizationFunction[];
  },
): Promise<AutoBeTestWriteGenerationFunction[]> => {
  const generationFunctions: AutoBeTestWriteGenerationFunction[] = [];
  const operations: AutoBeOpenApi.IOperation[] = props.document.operations;

  // Convert to standard OpenAPI document and create migration app
  const openApiDoc: OpenApi.IDocument = transformOpenApiDocument(
    props.document,
  );
  const app: IHttpMigrateApplication = HttpMigration.application(openApiDoc);

  // Create a HashMap of routes by method and path for quick lookup
  const routeMap: HashMap<AutoBeOpenApi.IEndpoint, IHttpMigrateRoute> =
    new HashMap<AutoBeOpenApi.IEndpoint, IHttpMigrateRoute>();
  app.routes.forEach((route) => {
    if (route.method === "head") return;
    const endpoint: AutoBeOpenApi.IEndpoint = {
      method: route.method,
      path: route.path,
    };
    routeMap.set(endpoint, route);
  });

  for (const prepareFunction of props.preparedFunctions) {
    // Find matching operation based on prepare function
    const resourceName = prepareFunction.functionName.replace(
      "prepare_random_",
      "",
    );

    // Find create operation for this resource
    const operation = operations.find(
      (op) =>
        op.method === "post" &&
        op.path.includes(`/${resourceName}`) &&
        op.requestBody?.typeName?.includes("ICreate") &&
        op.responseBody?.typeName,
    );

    if (!operation || !operation.responseBody?.typeName) continue;

    // Find the corresponding route to get SDK accessor
    const endpoint: AutoBeOpenApi.IEndpoint = {
      method: operation.method,
      path: operation.path,
    };
    const route = routeMap.get(endpoint);

    if (!route) continue;

    const functionName = `generate_random_${resourceName}`;

    // Generate the function content
    const content = generateFunctionContent({
      operation,
      prepareFunctionName: prepareFunction.functionName,
      actor: operation.authorizationActor,
      responseTypeName: operation.responseBody.typeName,
      sdkAccessor: route.accessor,
    });

    const location = `test/features/utils/generation/${resourceName}/${functionName}.ts`;

    const generationFunction: AutoBeTestWriteGenerationFunction = {
      kind: "generation",
      endpoint: operation,
      actor: operation.authorizationActor,
      location,
      functionName,
      content,
    };

    generationFunctions.push(generationFunction);

    const aggregate: AutoBeProcessAggregate =
      AutoBeProcessAggregateFactory.createAggregate();

    ctx.dispatch({
      type: "testWrite",
      id: v7(),
      function: generationFunction,
      step: ctx.state().test?.step ?? 0,
      total: props.preparedFunctions.length,
      completed: generationFunctions.length,
      created_at: new Date().toISOString(),
      ...aggregate,
    });
  }

  return generationFunctions;
};

const generateFunctionContent = (props: {
  operation: AutoBeOpenApi.IOperation;
  prepareFunctionName: string;
  actor: string | null;
  responseTypeName: string;
  sdkAccessor: string[];
}): string => {
  const imports: string[] = [
    `import api from "@ORGANIZATION/PROJECT-api";`,
    `import { ${props.responseTypeName.split(".")[0]} } from "@ORGANIZATION/PROJECT-api/lib/structures/${props.responseTypeName.split(".")[0]}";`,
  ];

  if (props.actor) {
    imports.push(
      `import { authorize_${props.actor}_login } from "../authorize";`,
    );
  }

  imports.push(`import { ${props.prepareFunctionName} } from "../prepare";`);

  const resourceType = props.responseTypeName.split(".")[0];
  const createType = `${resourceType}.ICreate`;

  const functionBody = `
${imports.join("\n")}

export const ${props.prepareFunctionName.replace("prepare", "generate")} = async (
    props: {
        connection: api.IConnection,
        input?: Partial<${createType}>
    }
): Promise<${props.responseTypeName}> => {
    ${props.actor ? `await authorize_${props.actor}_login(props.connection);\n` : ""}
    const prepared = ${props.prepareFunctionName}({
        connection: props.connection,
        input: props.input,
    });
    
    const result: ${props.responseTypeName} = await api.functional.${props.sdkAccessor.join(".")}(
        props.connection,
        prepared
    );
    
    return result;
};`;

  return functionBody.trim();
};
