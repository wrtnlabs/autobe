import {
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { ILlmSchema, IValidation, OpenApiTypeChecker } from "@samchon/openapi";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { AutoBeRealizeCollectorProgrammer } from "./AutoBeRealizeCollectorProgrammer";

export namespace AutoBeRealizeTransformerProgrammer {
  export function filter(props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    key: string;
  }): boolean {
    const schema: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
      props.schemas[props.key];
    if (schema === undefined) return false;
    return (
      AutoBeOpenApiTypeChecker.isObject(schema) &&
      Object.keys(schema.properties).length !== 0 &&
      (schema.additionalProperties ?? false) === false &&
      props.key !== "IAuthorizationToken" &&
      props.key !== "IEntity" &&
      props.key.startsWith("IPage") === false &&
      props.key.endsWith(".IRequest") === false &&
      props.key.endsWith(".ICreate") === false &&
      props.key.endsWith(".IUpdate") === false &&
      props.key.endsWith(".IAuthorized") === false &&
      props.key.endsWith(".IJoin") === false &&
      props.key.endsWith(".ILogin") === false &&
      props.key.endsWith(".IRefresh") === false
    );
  }

  export function getName(dtoTypeName: string): string {
    return (
      dtoTypeName
        .split(".")
        .map((s) => (s.startsWith("I") ? s.substring(1) : s))
        .join("At") + "Transformer"
    );
  }

  export function getNeighbors(code: string): string[] {
    const unique: Set<string> = new Set();
    const regex: RegExp = /(\w+Transformer)\.(select|transform)/g;
    while (true) {
      const match: RegExpExecArray | null = regex.exec(code);
      if (match === null) break;
      unique.add(match[1]!);
    }
    return Array.from(unique);
  }

  export function getSelectMappingMetadata(props: {
    application: AutoBePrisma.IApplication;
    model: AutoBePrisma.IModel;
  }): AutoBeRealizeTransformerSelectMapping.Metadata[] {
    return AutoBeRealizeCollectorProgrammer.getMappingMetadata(props);
  }

  export function getTransformMappingMetadata(props: {
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeTransformerPlan;
  }): AutoBeRealizeTransformerTransformMapping.Metadata[] {
    const schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = props.document
      .components.schemas[
      props.plan.dtoTypeName
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    return Object.keys(schema.properties).map((key) => ({
      property: key,
    }));
  }

  export function writeTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  }): string {
    return StringUtil.trim`
      export namespace ${getName(props.plan.dtoTypeName)} {
        export type Payload = Prisma.${props.plan.prismaSchemaName}GetPayload<ReturnType<typeof select>>;

        export function select() {
          return {
            ...
          } satisfies Prisma.${props.plan.prismaSchemaName}FindManyArgs;
        }

        export async function transform(input: Payload): Promise<${props.plan.dtoTypeName}> {
          return {
${Object.keys(props.schema.properties)
  .map((k) => `  ${k}: ...,`)
  .join("\n")}
          };
        }
      }
    `;
  }

  export function writeStructures<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    dtoTypeName: string,
  ): Promise<Record<string, string>> {
    return AutoBeRealizeCollectorProgrammer.writeStructures(ctx, dtoTypeName);
  }

  export async function replaceImportStatements<Model extends ILlmSchema.Model>(
    ctx: AutoBeContext<Model>,
    props: {
      dtoTypeName: string;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
    },
  ): Promise<string> {
    const compiler: IAutoBeCompiler = await ctx.compiler();
    let code: string = props.code;
    code = await compiler.typescript.beautify(code);
    code = code
      .split("\r\n")
      .join("\n")
      .split("\n")
      .filter((str) => str.trim().startsWith("import") === false)
      .join("\n");

    const imports: string[] = writeImportStatements(props);
    code = [
      ...imports,
      "",
      ...getNeighbors(code).map((trs) => `import { ${trs} } from "./${trs}";`),
      "",
      code,
    ].join("\n");
    return await compiler.typescript.beautify(code);
  }

  export function validate(props: {
    application: AutoBePrisma.IApplication;
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    transformMappings: AutoBeRealizeTransformerTransformMapping[];
    selectMappings: AutoBeRealizeTransformerSelectMapping[];
    draft: string;
    revise: {
      review: string;
      final: string | null;
    };
  }): IValidation.IError[] {
    const errors: IValidation.IError[] = [];
    validateTransformMappings({
      document: props.document,
      errors,
      plan: props.plan,
      transformMappings: props.transformMappings,
    });
    validateSelectMappings({
      application: props.application,
      errors,
      plan: props.plan,
      selectMappings: props.selectMappings,
    });
    validateEmptyCode({
      plan: props.plan,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateNeighbors({
      neighbors: props.neighbors,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    if (props.revise.final !== null) {
      validateEmptyCode({
        plan: props.plan,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
      validateNeighbors({
        neighbors: props.neighbors,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }

  function validateSelectMappings(props: {
    application: AutoBePrisma.IApplication;
    errors: IValidation.IError[];
    plan: AutoBeRealizeTransformerPlan;
    selectMappings: AutoBeRealizeTransformerSelectMapping[];
  }): void {
    const model: AutoBePrisma.IModel = props.application.files
      .map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.prismaSchemaName)!;
    const required: AutoBeRealizeTransformerSelectMapping.Metadata[] =
      getSelectMappingMetadata({
        application: props.application,
        model,
      });
    props.selectMappings.forEach((m, i) => {
      const metadata:
        | AutoBeRealizeTransformerSelectMapping.Metadata
        | undefined = required.find((r) => r.member === m.member);
      if (metadata === undefined)
        props.errors.push({
          path: `$input.request.selectmappings[${i}].member`,
          value: m.member,
          expected: required
            .map((r) => `AutoBeRealizeMapping<"${r}">`)
            .join(" | "),
          description: StringUtil.trim`
            '${m.member}' is not a valid Prisma member.
  
            Please provide mapping only for existing Prisma members:
  
            ${required.map((r) => `- ${r}`).join("\n")}
          `,
        });
      else {
        if (metadata.kind !== m.kind)
          props.errors.push({
            path: `$input.request.selectmappings[${i}].kind`,
            value: m.kind,
            expected: `"${metadata.kind}"`,
            description: StringUtil.trim`
              The mapping kind for Prisma member '${m.member}' is invalid.
  
              Expected kind is '${metadata.kind}', but received kind is '${m.kind}'.
            `,
          });
        if (metadata.nullable !== m.nullable)
          props.errors.push({
            path: `$input.request.selectmappings[${i}].nullable`,
            value: m.nullable,
            expected: `${metadata.nullable}`,
            description: StringUtil.trim`
              The mapping nullable for Prisma member '${m.member}' is invalid.
  
              Expected nullable is '${metadata.nullable}', but received nullable is '${m.nullable}'.
            `,
          });
      }
    });
    for (const r of required) {
      if (props.selectMappings.some((m) => m.member === r.member)) continue;
      props.errors.push({
        path: "$input.request.selectmappings[]",
        value: undefined,
        expected: StringUtil.trim`{
          member: "${r.member}";
          kind: "${r.kind}";
          how: string;
        }`,
        description: StringUtil.trim`
          You missed mapping for required Prisma member '${r.member}'.

          Make sure to provide mapping for all required members.
        `,
      });
    }
  }

  function validateTransformMappings(props: {
    document: AutoBeOpenApi.IDocument;
    errors: IValidation.IError[];
    plan: AutoBeRealizeTransformerPlan;
    transformMappings: AutoBeRealizeTransformerTransformMapping[];
  }): void {
    const schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = props.document
      .components.schemas[
      props.plan.dtoTypeName
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    props.transformMappings.forEach((m, i) => {
      if (schema.properties[m.property] !== undefined) return;
      props.errors.push({
        path: `$input.request.transformMappings[${i}]`,
        value: m,
        expected: StringUtil.trim`{
            property: ${Object.keys(schema.properties)
              .map((key) => `${JSON.stringify(key)}`)
              .join(" | ")};
            how: string;
          }`,
        description: StringUtil.trim`
          The mapping for the property '${m.property}' does not exist in DTO '${props.plan.dtoTypeName}'.

          Please provide mapping only for existing properties:

          ${Object.keys(schema.properties)
            .map((key) => `- ${key}`)
            .join("\n")}
        `,
      });
    });
    for (const key of Object.keys(schema.properties)) {
      if (props.transformMappings.some((m) => m.property === key)) continue;
      props.errors.push({
        path: `$input.request.transformMappings[]`,
        value: undefined,
        expected: StringUtil.trim`{
            property: "${key}";
            how: string;
          }`,
        description: StringUtil.trim`
          You missed the mapping for the property '${key}' of DTO '${props.plan.dtoTypeName}'.

          Make sure to provide mapping for all properties.
        `,
      });
    }
  }

  function writeImportStatements(props: {
    dtoTypeName: string;
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }): string[] {
    const typeReferences: Set<string> = new Set();
    const visit = (key: string) =>
      OpenApiTypeChecker.visit({
        schema: {
          $ref: `#/components/schemas/${key}`,
        },
        components: { schemas: props.schemas },
        closure: (next) => {
          if (OpenApiTypeChecker.isReference(next))
            typeReferences.add(next.$ref.split("/").pop()!.split(".")[0]!);
        },
      });
    visit(props.dtoTypeName);

    const imports: string[] = [
      `import { Prisma } from "@prisma/sdk";`,
      `import { ArrayUtil } from "@nestia/e2e";`,
      "",
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
      "",
      `import { toISOStringSafe } from "../utils/toISOStringSafe";`,
    ];
    return imports;
  }

  function validateEmptyCode(props: {
    plan: AutoBeRealizeTransformerPlan;
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const name: string = getName(props.plan.dtoTypeName);
    if (props.content.includes(`export namespace ${name}`) === false)
      props.errors.push({
        path: props.path,
        expected: `Namespace '${name}' to be present in the code.`,
        value: props.content,
        description: `The generated code does not contain the expected namespace '${name}'.`,
      });
  }

  function validateNeighbors(props: {
    neighbors: AutoBeRealizeTransformerPlan[];
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const neighborNames: string[] = getNeighbors(props.content);
    for (const x of neighborNames)
      if (props.neighbors.some((y) => getName(y.dtoTypeName) === x) === false)
        props.errors.push({
          path: props.path,
          expected: `Use existing transformer.`,
          value: props.content,
          description: StringUtil.trim`
            You've imported and utilized ${x}, but it does not exist.

            Use one of them below, or change to another code:

            ${props.neighbors
              .map((y) => `- ${getName(y.dtoTypeName)}`)
              .join("\n")}
          `,
        });
  }
}
