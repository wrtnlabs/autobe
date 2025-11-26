import {
  AutoBeOpenApi,
  AutoBeProcessAggregate,
  AutoBeProgressEventBase,
  AutoBeTestWriteEvent,
  AutoBeTestWritePrepareFunction,
} from "@autobe/interface";
import { AutoBeProcessAggregateFactory, StringUtil } from "@autobe/utils";
import { ILlmSchema, OpenApi } from "@samchon/openapi";
import { HashMap, HashSet } from "tstl";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";

export const orchestrateTestPrepare = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestWritePrepareFunction[]> => {
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined)
    throw new Error(
      "Unreachable: Cannot prepare test utilities without interface document.",
    );

  const operations: AutoBeOpenApi.IOperation[] = document.operations;
  const results: AutoBeTestWritePrepareFunction[] = [];
  const progress: AutoBeProgressEventBase = {
    total: 0, // Will be updated after filtering
    completed: 0,
  };

  // Collect all ICreate DTOs from operations using requestBody.typeName
  const createSchemas: HashMap<string, AutoBeOpenApi.IEndpoint> = new HashMap<
    string,
    AutoBeOpenApi.IEndpoint
  >();
  const processedTypes: HashSet<string> = new HashSet<string>();

  for (const op of operations) {
    if (
      op.method === "post" &&
      op.requestBody !== null &&
      op.requestBody.typeName &&
      (op.requestBody.typeName.includes(".ICreate") ||
        op.requestBody.typeName.endsWith("ICreate"))
    ) {
      const typeName: string = op.requestBody.typeName;
      if (processedTypes.has(typeName) === false) {
        processedTypes.insert(typeName);
        createSchemas.set(typeName, {
          method: op.method,
          path: op.path,
        });
      }
    }
  }

  progress.total = createSchemas.size();

  // Generate prepare function for each unique ICreate DTO
  for (const entry of createSchemas.toJSON()) {
    const dtoTypeName = entry.first;
    const endpoint = entry.second;
    const prepareFunc: AutoBeTestWritePrepareFunction | null =
      generatePrepareFunction({
        dtoTypeName,
        endpoint,
        schemas: document.components.schemas,
      });

    if (prepareFunc !== null) {
      results.push(prepareFunc);

      // Dispatch event
      const aggregate: AutoBeProcessAggregate =
        AutoBeProcessAggregateFactory.createAggregate();

      ctx.dispatch({
        type: "testWrite",
        id: v7(),
        created_at: new Date().toISOString(),
        function: prepareFunc,
        step: ctx.state().interface?.step ?? 0,
        completed: ++progress.completed,
        total: progress.total,
        ...aggregate,
      } satisfies AutoBeTestWriteEvent);
    }
  }

  return results;
};

const generatePrepareFunction = (props: {
  dtoTypeName: string;
  endpoint: AutoBeOpenApi.IEndpoint;
  schemas: Record<string, OpenApi.IJsonSchema>;
}): AutoBeTestWritePrepareFunction | null => {
  const { dtoTypeName, endpoint, schemas } = props;
  const schema: OpenApi.IJsonSchema | undefined = schemas[dtoTypeName];

  if (schema === undefined || !("properties" in schema)) return null;

  const functionName: string = composeFunctionName(dtoTypeName);
  const content: string = composePrepareFunctionContent({
    functionName,
    dtoTypeName,
    schema,
    schemas,
  });

  return {
    kind: "prepare",
    endpoint,
    dtoTypeName,
    location: `test/features/utils/prepare/${functionName}.ts`,
    functionName,
    content,
  };
};

const composeFunctionName = (typeName: string): string => {
  const base: string =
    typeName
      .replace(/^I/, "")
      .replace(/\.ICreate$/, "")
      .replace(/ICreate$/, "")
      .split(".")
      .pop() ?? typeName;

  return `prepare_random_${NamingConvention.snake(base)}`;
};

const composePrepareFunctionContent = (props: {
  functionName: string;
  dtoTypeName: string;
  schema: OpenApi.IJsonSchema.IObject;
  schemas: Record<string, OpenApi.IJsonSchema>;
}): string => {
  const { functionName, dtoTypeName, schema, schemas } = props;
  const properties: string[] = [];

  // Generate property assignments
  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    const isRequired: boolean = schema.required?.includes(key) ?? false;

    if (isRequired) {
      const value: string = generatePropertyValue({
        key,
        schema: propertySchema,
        schemas,
      });
      properties.push(`    ${key}: ${value},`);
    }
  }

  // Generate optional properties with lower probability
  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    const isRequired: boolean = schema.required?.includes(key) ?? false;

    if (!isRequired) {
      const value: string = generatePropertyValue({
        key,
        schema: propertySchema,
        schemas,
      });
      properties.push(
        `    ...(Math.random() > 0.5 ? { ${key}: ${value} } : {}),`,
      );
    }
  }

  // Extract namespace from dtoTypeName (e.g., "IUser.ICreate" -> "IUser")
  const namespaceMatch = dtoTypeName.match(/^([^.]+)\./);
  const importName = namespaceMatch
    ? namespaceMatch[1]
    : dtoTypeName.replace(/\.ICreate$/, "");

  return StringUtil.trim`
    import { ArrayUtil, RandomGenerator } from "@nestia/e2e";
    import { randint } from "tstl";
    
    import { ${importName} } from "@ORGANIZATION/PROJECT-api/lib/structures/${importName}";

    export const ${functionName} = (
      input?: Partial<${dtoTypeName}>,
    ): ${dtoTypeName} => ({
    ${properties.join("\n")}
      ...(input ?? {}),
    });
  `;
};

const generatePropertyValue = (props: {
  key: string;
  schema: OpenApi.IJsonSchema;
  schemas: Record<string, OpenApi.IJsonSchema>;
}): string => {
  const { schema, schemas } = props;

  // Handle $ref types
  if ("$ref" in schema) {
    const refType: string = schema.$ref.split("/").pop() ?? "";
    const refSchema: OpenApi.IJsonSchema | undefined = schemas[refType];

    if (refSchema) {
      // Handle nested ICreate types
      if (refType.includes(".ICreate") || refType.endsWith("ICreate")) {
        const prepareFunc: string = composeFunctionName(refType);
        return `${prepareFunc}()`;
      }
      // Handle enum types
      const enumSchema = refSchema;
      if ("enum" in enumSchema && Array.isArray(enumSchema.enum)) {
        return generateEnumValue(enumSchema.enum);
      }
    }
    return "{}"; // Fallback for complex types
  }

  // Handle enum directly
  const enumSchema = schema;
  if ("enum" in enumSchema && Array.isArray(enumSchema.enum)) {
    return generateEnumValue(enumSchema.enum);
  }

  // Handle primitive types
  if ("type" in schema) {
    switch (schema.type) {
      case "string":
        return generateStringValue(schema);
      case "number":
        return generateNumberValue(schema);
      case "integer":
        return generateIntegerValue(schema);
      case "boolean":
        return "Math.random() < 0.5";
      case "array":
        return generateArrayValue(
          schema as OpenApi.IJsonSchema.IArray,
          schemas,
        );
      case "object":
        return "{}";
      case "null":
        return "null";
      default:
        return "undefined";
    }
  }

  return "null";
};

const generateStringValue = (schema: OpenApi.IJsonSchema.IString): string => {
  // Handle format-specific strings
  if (schema.format === "email") {
    return `RandomGenerator.name().toLowerCase().replace(/ /g, ".") + "@" + RandomGenerator.pick(["gmail.com", "example.com", "test.com"])`;
  }
  if (schema.format === "date-time") {
    return "new Date().toISOString()";
  }
  if (schema.format === "date") {
    return "new Date().toISOString().split('T')[0]";
  }
  if (schema.format === "uuid") {
    return "RandomGenerator.alphaNumeric(32)";
  }
  if (
    schema.format === "uri" ||
    schema.format === "iri" ||
    schema.format === "url"
  ) {
    return `"https://" + RandomGenerator.alphabets(randint(5, 10)) + ".com"`;
  }

  // Default string generation
  return "RandomGenerator.paragraph()";
};

const generateNumberValue = (schema: OpenApi.IJsonSchema.INumber): string => {
  const min: number = schema.minimum ?? 0;
  const max: number = schema.maximum ?? 100;

  // For decimal numbers, use Math.random()
  return `${min} + Math.random() * ${max - min}`;
};

const generateIntegerValue = (schema: OpenApi.IJsonSchema.IInteger): string => {
  const min: number = schema.minimum ?? 0;
  const max: number = schema.maximum ?? 100;

  // Use randint for integers
  return `randint(${min}, ${max})`;
};

const generateArrayValue = (
  schema: OpenApi.IJsonSchema.IArray,
  schemas: Record<string, OpenApi.IJsonSchema>,
): string => {
  const minItems: number = schema.minItems ?? 0;
  const maxItems: number = schema.maxItems ?? 5;

  if (!schema.items) return "[]";

  const itemValue: string = generatePropertyValue({
    key: "item",
    schema: schema.items,
    schemas,
  });

  // Use ArrayUtil.repeat with randint for count
  if (minItems === maxItems) {
    return `ArrayUtil.repeat(${minItems}, () => ${itemValue})`;
  }
  return `ArrayUtil.repeat(randint(${minItems}, ${maxItems}), () => ${itemValue})`;
};

const generateEnumValue = (enumValues: any[]): string => {
  const values: string = enumValues.map((v) => JSON.stringify(v)).join(", ");
  return `RandomGenerator.pick([${values}])`;
};
