import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";

import { IAutoBeRealizeScenarioResult } from "../../structures/IAutoBeRealizeScenarioResult";
import { AutoBeRealizeCollectorProgrammer } from "../AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "../AutoBeRealizeTransformerProgrammer";

export function writeRealizeOperationTemplate(props: {
  scenario: IAutoBeRealizeScenarioResult;
  operation: AutoBeOpenApi.IOperation;
  imports: string[];
  authorization: AutoBeRealizeAuthorization | null;
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
      (param) => `${param.name}: ${writeParameterType(param.schema)}`,
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

  const hasParameters = functionParameters.length > 0;
  const formattedSignature: string = hasParameters
    ? `props: {\n${functionParameters.map((p) => `  ${p}`).join(";\n")};\n}`
    : "";

  const returnType = props.operation.responseBody?.typeName ?? "void";
  const body: string = writeBody({
    operation: props.operation,
    collectors: props.collectors,
    transformers: props.transformers,
  });
  const indentedBody: string = body
    .split("\n")
    .map((line) => (line.length > 0 ? `  ${line}` : line))
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
  operation: AutoBeOpenApi.IOperation;
  collectors: AutoBeRealizeCollectorFunction[];
  transformers: AutoBeRealizeTransformerFunction[];
}): string {
  const collector: AutoBeRealizeCollectorFunction | undefined =
    props.operation.requestBody?.typeName
      ? props.collectors.find(
          (c) => c.plan.dtoTypeName === props.operation.requestBody!.typeName,
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
      ? props.transformers.find((t) => t.plan.dtoTypeName === innerTypeName)
      : undefined;

  // pagination (collector 와 동시에 올 수 없음)
  if (isPageType && transformer) {
    const tName: string = AutoBeRealizeTransformerProgrammer.getName(
      transformer.plan.dtoTypeName,
    );
    const table: string = transformer.plan.databaseSchemaName;
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
        data: await ${tName}.transformAll(records),
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

  // transformer only (read single)
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

  return "...";
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
