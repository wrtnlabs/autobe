import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";

import { IAutoBeRealizeScenarioResult } from "../../structures/IAutoBeRealizeScenarioResult";
import { AutoBeRealizeCollectorProgrammer } from "../AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "../AutoBeRealizeTransformerProgrammer";

interface IResolvedTransformer {
  transformer: AutoBeRealizeTransformerFunction;
  isArray: boolean;
}

export function writeRealizeOperationTemplate(props: {
  scenario: IAutoBeRealizeScenarioResult;
  operation: AutoBeOpenApi.IOperation;
  imports: string[];
  authorization: AutoBeRealizeAuthorization | null;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  collectors: AutoBeRealizeCollectorFunction[];
  transformers: AutoBeRealizeTransformerFunction[];
}): string {
  const functionParameters: string[] = [];

  if (props.authorization && props.authorization.actor.name) {
    functionParameters.push(
      `${props.authorization.actor.name}: ${props.authorization.payload.name}`,
    );
  }

  functionParameters.push(
    ...props.operation.parameters.map(
      (param: AutoBeOpenApi.IParameter): string =>
        `${param.name}: ${writeParameterType(param.schema)}`,
    ),
  );

  if (
    props.operation.requestBody?.typeName.endsWith(".ILogin") ||
    props.operation.requestBody?.typeName.endsWith(".IJoin")
  )
    functionParameters.push("ip: string");

  if (props.operation.requestBody?.typeName) {
    functionParameters.push(`body: ${props.operation.requestBody.typeName}`);
  }

  const hasParameters: boolean = functionParameters.length > 0;
  const formattedSignature: string = hasParameters
    ? `props: {\n${functionParameters.map((p: string): string => `  ${p}`).join(";\n")};\n}`
    : "";

  const returnType: string = props.operation.responseBody?.typeName ?? "void";
  const body: string = writeBody({
    method: props.operation.method,
    operation: props.operation,
    schemas: props.schemas,
    collectors: props.collectors,
    transformers: props.transformers,
  });
  const indentedBody: string = body
    .split("\n")
    .map((line: string): string => (line.length > 0 ? `  ${line}` : line))
    .join("\n");

  return StringUtil.trim`
    Complete the code below, disregard the import part and return only the function part.

    \`\`\`typescript
    ${props.imports.join("\n")}

    // DON'T CHANGE FUNCTION NAME AND PARAMETERS,
    // ONLY YOU HAVE TO WRITE THIS FUNCTION BODY, AND USE IMPORTED.
    export async function ${props.scenario.functionName}(${formattedSignature}): Promise<${returnType}> {
    ${indentedBody}
    }
    \`\`\`
  `;
}

function writeBody(props: {
  method: string;
  operation: AutoBeOpenApi.IOperation;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  collectors: AutoBeRealizeCollectorFunction[];
  transformers: AutoBeRealizeTransformerFunction[];
}): string {
  const collector: AutoBeRealizeCollectorFunction | undefined = props.operation
    .requestBody?.typeName
    ? props.collectors.find(
        (c: AutoBeRealizeCollectorFunction): boolean =>
          c.plan.dtoTypeName === props.operation.requestBody!.typeName,
      )
    : undefined;
  const responseTypeName: string | undefined =
    props.operation.responseBody?.typeName;
  const isPageType: boolean = !!responseTypeName?.startsWith("IPage");
  const innerTypeName: string | undefined = isPageType
    ? responseTypeName!.replace(/^IPage/, "")
    : responseTypeName;
  const transformer: AutoBeRealizeTransformerFunction | undefined =
    innerTypeName
      ? props.transformers.find(
          (t: AutoBeRealizeTransformerFunction): boolean =>
            t.plan.dtoTypeName === innerTypeName,
        )
      : undefined;

  // pagination (collector 와 동시에 올 수 없음)
  if (isPageType && transformer) {
    const tName: string = AutoBeRealizeTransformerProgrammer.getName(
      transformer.plan.dtoTypeName,
    );
    const table: string = transformer.plan.databaseSchemaName;
    const isRecursive: boolean =
      AutoBeRealizeTransformerProgrammer.getRecursiveProperty({
        schemas: props.schemas as Record<string, AutoBeOpenApi.IJsonSchema>,
        typeName: transformer.plan.dtoTypeName,
      }) !== null;
    const dataLine: string = isRecursive
      ? `data: await ${tName}.transformAll(records),`
      : `data: await ArrayUtil.asyncMap(records, ${tName}.transform),`;
    return StringUtil.trim`
      const records = await MyGlobal.prisma.${table}.findMany({
        ...${tName}.select(),
        ...,
      });
      return {
        pagination: {
          current: ...,
          limit: ...,
          records: ...,
          pages: ...,
        },
        ${dataLine}
      };
    `;
  }

  // collector + transformer (create and return)
  if (collector && transformer) {
    const cName: string = AutoBeRealizeCollectorProgrammer.getName(
      collector.plan.dtoTypeName,
    );
    const tName: string = AutoBeRealizeTransformerProgrammer.getName(
      transformer.plan.dtoTypeName,
    );
    const table: string = collector.plan.databaseSchemaName;
    return StringUtil.trim`
      const record = await MyGlobal.prisma.${table}.create({
        data: await ${cName}.collect({
          body: props.body,
          ...
        }),
        ...${tName}.select(),
      });
      return await ${tName}.transform(record);
    `;
  }

  // collector only (create, void return)
  if (collector) {
    const cName: string = AutoBeRealizeCollectorProgrammer.getName(
      collector.plan.dtoTypeName,
    );
    const table: string = collector.plan.databaseSchemaName;
    return StringUtil.trim`
      await MyGlobal.prisma.${table}.create({
        data: await ${cName}.collect({
          body: props.body,
          ...
        }),
      });
    `;
  }

  // update + transformer (PUT: manual update, re-fetch, transform)
  if (props.method === "put" && transformer) {
    const tName: string = AutoBeRealizeTransformerProgrammer.getName(
      transformer.plan.dtoTypeName,
    );
    const table: string = transformer.plan.databaseSchemaName;
    return StringUtil.trim`
      await MyGlobal.prisma.${table}.update({
        where: { ... },
        data: { ... },
      });
      const updated = await MyGlobal.prisma.${table}.findUniqueOrThrow({
        where: { ... },
        ...${tName}.select(),
      });
      return await ${tName}.transform(updated);
    `;
  }

  // delete (DELETE: simple delete, void return)
  if (props.method === "delete") {
    const table: string = transformer?.plan.databaseSchemaName ?? "...";
    return StringUtil.trim`
      await MyGlobal.prisma.${table}.delete({
        where: { ... },
      });
    `;
  }

  // transformer only (read single or other non-PUT/DELETE)
  if (transformer) {
    const tName: string = AutoBeRealizeTransformerProgrammer.getName(
      transformer.plan.dtoTypeName,
    );
    const table: string = transformer.plan.databaseSchemaName;
    return StringUtil.trim`
      const record = await MyGlobal.prisma.${table}.findFirstOrThrow({
        ...${tName}.select(),
        where: { ... },
      });
      return await ${tName}.transform(record);
    `;
  }

  // object response with transformer-backed properties
  if (responseTypeName) {
    const objectBody: string | null = writeObjectBody({
      responseTypeName,
      schemas: props.schemas,
      transformers: props.transformers,
    });
    if (objectBody !== null) return objectBody;
  }

  return [
    "// No matching Collector/Transformer found for this operation.",
    "// You MUST call getDatabaseSchemas first to get exact relation property names.",
    "// NEVER guess relation names from table names — always verify against the schema.",
    "...",
  ].join("\n  ");
}

function writeObjectBody(props: {
  responseTypeName: string;
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  transformers: AutoBeRealizeTransformerFunction[];
}): string | null {
  const schema: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
    props.schemas[props.responseTypeName];
  if (!schema || !AutoBeOpenApiTypeChecker.isObject(schema)) return null;

  const lines: string[] = [];
  let hasMatch: boolean = false;

  for (const [key, prop] of Object.entries(schema.properties) as Array<
    [string, AutoBeOpenApi.IJsonSchemaProperty]
  >) {
    const match: IResolvedTransformer | null = resolvePropertyTransformer({
      schema: prop,
      transformers: props.transformers,
    });
    if (match) {
      hasMatch = true;
      const tName: string = AutoBeRealizeTransformerProgrammer.getName(
        match.transformer.plan.dtoTypeName,
      );
      if (match.isArray) {
        const isRecursive: boolean =
          AutoBeRealizeTransformerProgrammer.getRecursiveProperty({
            schemas: props.schemas as Record<string, AutoBeOpenApi.IJsonSchema>,
            typeName: match.transformer.plan.dtoTypeName,
          }) !== null;
        lines.push(
          isRecursive
            ? `  ${key}: await ${tName}.transformAll(...),`
            : `  ${key}: await ArrayUtil.asyncMap(..., (r) => ${tName}.transform(r)),`,
        );
      } else {
        lines.push(`  ${key}: await ${tName}.transform(...),`);
      }
    } else {
      lines.push(`  ${key}: ...,`);
    }
  }

  if (!hasMatch) return null;

  return StringUtil.trim`
    return {
    ${lines.join("\n")}
    };
  `;
}

function resolvePropertyTransformer(props: {
  schema: AutoBeOpenApi.IJsonSchemaProperty;
  transformers: AutoBeRealizeTransformerFunction[];
}): IResolvedTransformer | null {
  // direct reference → single transform
  if (AutoBeOpenApiTypeChecker.isReference(props.schema)) {
    const typeName: string = props.schema.$ref.split("/").pop()!;
    const transformer: AutoBeRealizeTransformerFunction | undefined =
      props.transformers.find(
        (t: AutoBeRealizeTransformerFunction): boolean =>
          t.plan.dtoTypeName === typeName,
      );
    if (transformer) return { transformer, isArray: false };
  }

  // array of references → asyncMap transform
  if (AutoBeOpenApiTypeChecker.isArray(props.schema)) {
    const items: Exclude<
      AutoBeOpenApi.IJsonSchema,
      AutoBeOpenApi.IJsonSchema.IObject
    > = props.schema.items;
    if (AutoBeOpenApiTypeChecker.isReference(items)) {
      const typeName: string = items.$ref.split("/").pop()!;
      const transformer: AutoBeRealizeTransformerFunction | undefined =
        props.transformers.find(
          (t: AutoBeRealizeTransformerFunction): boolean =>
            t.plan.dtoTypeName === typeName,
        );
      if (transformer) return { transformer, isArray: true };
    }
  }

  // oneOf (nullable reference) → unwrap non-null variant
  if (AutoBeOpenApiTypeChecker.isOneOf(props.schema)) {
    for (const variant of props.schema.oneOf) {
      if (AutoBeOpenApiTypeChecker.isNull(variant)) continue;
      const result: IResolvedTransformer | null = resolvePropertyTransformer({
        schema: variant as AutoBeOpenApi.IJsonSchemaProperty,
        transformers: props.transformers,
      });
      if (result) return result;
    }
  }

  return null;
}

function writeParameterType(
  schema: AutoBeOpenApi.IParameter["schema"],
): string {
  const elements: string[] =
    schema.type === "integer"
      ? ["number", `tags.Type<"int32">`]
      : [schema.type];
  if (schema.type === "number") {
    if (schema.minimum !== undefined)
      elements.push(`tags.Minimum<${schema.minimum}>`);
    if (schema.maximum !== undefined)
      elements.push(`tags.Maximum<${schema.maximum}>`);
    if (schema.exclusiveMinimum !== undefined)
      elements.push(`tags.ExclusiveMinimum<${schema.exclusiveMinimum}>`);
    if (schema.exclusiveMaximum !== undefined)
      elements.push(`tags.ExclusiveMaximum<${schema.exclusiveMaximum}>`);
    if (schema.multipleOf !== undefined)
      elements.push(`tags.MultipleOf<${schema.multipleOf}>`);
  } else if (schema.type === "string") {
    if (schema.format !== undefined)
      elements.push(`tags.Format<${JSON.stringify(schema.format)}>`);
    if (schema.contentMediaType !== undefined)
      elements.push(
        `tags.ContentMediaType<${JSON.stringify(schema.contentMediaType)}>`,
      );
    if (schema.pattern !== undefined)
      elements.push(`tags.Pattern<${JSON.stringify(schema.pattern)}>`);
    if (schema.minLength !== undefined)
      elements.push(`tags.MinLength<${schema.minLength}>`);
    if (schema.maxLength !== undefined)
      elements.push(`tags.MaxLength<${schema.maxLength}>`);
  }
  return elements.join(" & ");
}
