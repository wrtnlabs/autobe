import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeTransformerSelectMapping,
  AutoBeRealizeTransformerTransformMapping,
  IAutoBeCompiler,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { LlmTypeChecker, OpenApiTypeChecker } from "@typia/utils";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";

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

  export function getRelationMappingTable(props: {
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
  }): Array<{
    propertyKey: string;
    targetModel: string;
    relationType: string;
    fkColumns: string;
  }> {
    const result: Array<{
      propertyKey: string;
      targetModel: string;
      relationType: string;
      fkColumns: string;
    }> = [];

    // belongsTo relations (forward FK on this model)
    for (const f of props.model.foreignFields) {
      result.push({
        propertyKey: f.relation.name,
        targetModel: f.relation.targetModel,
        relationType: "belongsTo",
        fkColumns: f.name,
      });
    }

    // hasMany/hasOne relations (FK on the other model pointing to this model)
    for (const file of props.application.files) {
      for (const om of file.models) {
        for (const fk of om.foreignFields) {
          if (fk.relation.targetModel === props.model.name) {
            result.push({
              propertyKey: fk.relation.oppositeName,
              targetModel: om.name,
              relationType: fk.unique ? "hasOne" : "hasMany",
              fkColumns: fk.name,
            });
          }
        }
      }
    }

    return result;
  }

  export function formatRelationMappingTable(props: {
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
  }): string {
    const relations = getRelationMappingTable(props);
    if (relations.length === 0) return "(no relations)";
    return [
      "| propertyKey | Target Model | Relation Type | FK Column(s) |",
      "|---|---|---|---|",
      ...relations.map(
        (r) =>
          `| ${r.propertyKey} | ${r.targetModel} | ${r.relationType} | ${r.fkColumns} |`,
      ),
    ].join("\n");
  }

  export function getSelectMappingMetadata(props: {
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
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
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
  }): string {
    const relations = getRecursiveRelations({
      schemas: props.schemas,
      typeName: props.plan.dtoTypeName,
    });
    return relations.parent !== null || relations.children !== null
      ? writeRecursiveTemplate({
          ...props,
          parentProperty: relations.parent,
          childrenProperty: relations.children,
        })
      : writeNormalTemplate(props);
  }

  function writeNormalTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  }): string {
    const name: string = getName(props.plan.dtoTypeName);
    const dto: string = props.plan.dtoTypeName;
    const table: string = props.plan.databaseSchemaName;
    const properties: string = Object.keys(props.schema.properties)
      .map((k) => `  ${k}: ...,`)
      .join("\n");
    return StringUtil.trim`
      export namespace ${name} {
        export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            ...
          } satisfies Prisma.${table}FindManyArgs;
        }

        export async function transform(input: Payload): Promise<${dto}> {
          return {
${properties}
          };
        }
      }
    `;
  }

  function writeRecursiveTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    parentProperty: string | null;
    childrenProperty: string | null;
  }): string {
    const { parentProperty: pp, childrenProperty: cp } = props;
    if (pp !== null && cp !== null)
      return writeBothRecursiveTemplate({
        ...props,
        parentProperty: pp,
        childrenProperty: cp,
      });
    if (pp !== null)
      return writeParentOnlyRecursiveTemplate({ ...props, parentProperty: pp });
    return writeChildrenOnlyRecursiveTemplate({
      ...props,
      childrenProperty: cp!,
    });
  }

  function writeParentOnlyRecursiveTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    parentProperty: string;
  }): string {
    const name: string = getName(props.plan.dtoTypeName);
    const dto: string = props.plan.dtoTypeName;
    const table: string = props.plan.databaseSchemaName;
    const pp: string = props.parentProperty;
    const fk: string = `${pp}_id`;
    const properties: string = Object.keys(props.schema.properties)
      .map((k) =>
        k === pp
          ? `  ${k}: input.${fk} ? await cache.get(input.${fk}) : null,`
          : `  ${k}: ...,`,
      )
      .join("\n");
    return StringUtil.trim`
      export namespace ${name} {
        export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              ...
              ${fk}: true,
              ${pp}: undefined, // DO NOT select recursive relation
            },
          } satisfies Prisma.${table}FindManyArgs;
        }

        export async function transform(
          input: Payload,
          cache: VariadicSingleton<Promise<${dto}>, [string]> = createParentCache(),
        ): Promise<${dto}> {
          return {
${properties}
          };
        }

        export async function transformAll(
          inputs: Payload[],
        ): Promise<${dto}[]> {
          const cache = createParentCache();
          return await ArrayUtil.asyncMap(inputs, (x) => transform(x, cache));
        }

        function createParentCache() {
          const cache = new VariadicSingleton(
            async (id: string): Promise<${dto}> => {
              const record =
                await MyGlobal.prisma.${table}.findFirstOrThrow({
                  ...select(),
                  where: { id },
                });
              return transform(record, cache);
            },
          );
          return cache;
        }
      }
    `;
  }

  function writeChildrenOnlyRecursiveTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    childrenProperty: string;
  }): string {
    const name: string = getName(props.plan.dtoTypeName);
    const dto: string = props.plan.dtoTypeName;
    const table: string = props.plan.databaseSchemaName;
    const cp: string = props.childrenProperty;
    const properties: string = Object.keys(props.schema.properties)
      .map((k) =>
        k === cp ? `  ${k}: await cache.get(input.id),` : `  ${k}: ...,`,
      )
      .join("\n");
    return StringUtil.trim`
      export namespace ${name} {
        export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              ...
              id: true, // required for children cache key
              ${cp}: undefined, // DO NOT select recursive relation
            },
          } satisfies Prisma.${table}FindManyArgs;
        }

        export async function transform(
          input: Payload,
          cache: VariadicSingleton<Promise<${dto}[]>, [string]> = createChildrenCache(),
        ): Promise<${dto}> {
          return {
${properties}
          };
        }

        export async function transformAll(
          inputs: Payload[],
        ): Promise<${dto}[]> {
          const cache = createChildrenCache();
          return await ArrayUtil.asyncMap(inputs, (x) => transform(x, cache));
        }

        function createChildrenCache() {
          const cache = new VariadicSingleton(
            async (parentId: string): Promise<${dto}[]> => {
              const records =
                await MyGlobal.prisma.${table}.findMany({
                  ...select(),
                  where: { parent_id: parentId }, // Adjust FK column based on actual schema
                });
              return await ArrayUtil.asyncMap(records, (r) => transform(r, cache));
            },
          );
          return cache;
        }
      }
    `;
  }

  function writeBothRecursiveTemplate(props: {
    plan: AutoBeRealizeTransformerPlan;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    parentProperty: string;
    childrenProperty: string;
  }): string {
    const name: string = getName(props.plan.dtoTypeName);
    const dto: string = props.plan.dtoTypeName;
    const table: string = props.plan.databaseSchemaName;
    const pp: string = props.parentProperty;
    const cp: string = props.childrenProperty;
    const fk: string = `${pp}_id`;
    const properties: string = Object.keys(props.schema.properties)
      .map((k) => {
        if (k === pp)
          return `  ${k}: input.${fk} ? await parentCache.get(input.${fk}) : null,`;
        if (k === cp) return `  ${k}: await childrenCache.get(input.id),`;
        return `  ${k}: ...,`;
      })
      .join("\n");
    return StringUtil.trim`
      export namespace ${name} {
        export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              ...
              id: true, // required for children cache key
              ${fk}: true,
              ${pp}: undefined, // DO NOT select recursive relation
              ${cp}: undefined, // DO NOT select recursive relation
            },
          } satisfies Prisma.${table}FindManyArgs;
        }

        export async function transform(
          input: Payload,
          parentCache: VariadicSingleton<Promise<${dto}>, [string]> = createParentCache(),
          childrenCache: VariadicSingleton<Promise<${dto}[]>, [string]> = createChildrenCache(),
        ): Promise<${dto}> {
          return {
${properties}
          };
        }

        export async function transformAll(
          inputs: Payload[],
        ): Promise<${dto}[]> {
          // Create mutually-referencing caches so the entire tree shares
          // one deduplication scope across both parent and children lookups.
          // Use definite assignment assertions (!) so TypeScript does not
          // flag the cross-references as "used before assigned" — the async
          // callbacks only execute after both variables are fully initialized.
          let parentCache!: VariadicSingleton<Promise<${dto}>, [string]>;
          let childrenCache!: VariadicSingleton<Promise<${dto}[]>, [string]>;
          parentCache = new VariadicSingleton(
            async (id: string): Promise<${dto}> => {
              const record =
                await MyGlobal.prisma.${table}.findFirstOrThrow({
                  ...select(),
                  where: { id },
                });
              return transform(record, parentCache, childrenCache);
            },
          );
          childrenCache = new VariadicSingleton(
            async (parentId: string): Promise<${dto}[]> => {
              const records =
                await MyGlobal.prisma.${table}.findMany({
                  ...select(),
                  where: { ${fk}: parentId },
                });
              return await ArrayUtil.asyncMap(records, (r) =>
                transform(r, parentCache, childrenCache),
              );
            },
          );
          return await ArrayUtil.asyncMap(inputs, (x) =>
            transform(x, parentCache, childrenCache),
          );
        }

        function createParentCache() {
          const cache = new VariadicSingleton(
            async (id: string): Promise<${dto}> => {
              const record =
                await MyGlobal.prisma.${table}.findFirstOrThrow({
                  ...select(),
                  where: { id },
                });
              return transform(record, cache);
            },
          );
          return cache;
        }

        function createChildrenCache() {
          const cache = new VariadicSingleton(
            async (parentId: string): Promise<${dto}[]> => {
              const records =
                await MyGlobal.prisma.${table}.findMany({
                  ...select(),
                  where: { ${fk}: parentId },
                });
              // createParentCache() is called once per batch so all siblings
              // in the same children list share one parent-deduplication scope.
              const parentCache = createParentCache();
              return await ArrayUtil.asyncMap(records, (r) =>
                transform(r, parentCache, cache),
              );
            },
          );
          return cache;
        }
      }
    `;
  }

  export function writeStructures(
    ctx: AutoBeContext,
    dtoTypeName: string,
  ): Promise<Record<string, string>> {
    return AutoBeRealizeCollectorProgrammer.writeStructures(ctx, dtoTypeName);
  }

  export async function replaceImportStatements(
    ctx: AutoBeContext,
    props: {
      dtoTypeName: string;
      schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
      code: string;
    },
  ): Promise<string> {
    const compiler: IAutoBeCompiler = await ctx.compiler();
    let code: string = await compiler.typescript.removeImportStatements(
      props.code,
    );
    const imports: string[] = writeImportStatements(props);
    const selfName: string = getName(props.dtoTypeName);
    code = [
      ...imports,
      "",
      ...getNeighbors(code)
        .filter((trs) => trs !== selfName)
        .map((trs) => `import { ${trs} } from "./${trs}";`),
      "",
      code,
    ].join("\n");
    return await compiler.typescript.beautify(code);
  }

  export function validate(props: {
    application: AutoBeDatabase.IApplication;
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
    // mapping plans
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

    // validate draft
    validateEmptyCode({
      plan: props.plan,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateNeighbors({
      plan: props.plan,
      neighbors: props.neighbors,
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });
    validateSelectReturnType({
      content: props.draft,
      path: "$input.request.draft",
      errors,
    });

    // validate final
    if (props.revise.final !== null) {
      validateEmptyCode({
        plan: props.plan,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
      validateNeighbors({
        plan: props.plan,
        neighbors: props.neighbors,
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
      validateSelectReturnType({
        content: props.revise.final,
        path: "$input.request.revise.final",
        errors,
      });
    }
    return errors;
  }

  function validateSelectMappings(props: {
    application: AutoBeDatabase.IApplication;
    errors: IValidation.IError[];
    plan: AutoBeRealizeTransformerPlan;
    selectMappings: AutoBeRealizeTransformerSelectMapping[];
  }): void {
    const model: AutoBeDatabase.IModel = props.application.files
      .map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.databaseSchemaName)!;
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
          path: `$input.request.selectMappings[${i}].member`,
          value: m.member,
          expected: required.map((s) => JSON.stringify(s)).join(" | "),
          description: StringUtil.trim`
            '${m.member}' is not a valid Prisma member.
  
            Please provide mapping only for existing Prisma members:
  
            ${required.map((r) => `- ${r.member}`).join("\n")}
          `,
        });
      else {
        if (metadata.kind !== m.kind)
          props.errors.push({
            path: `$input.request.selectMappings[${i}].kind`,
            value: m.kind,
            expected: `"${metadata.kind}"`,
            description: StringUtil.trim`
              The mapping kind for Prisma member '${m.member}' is invalid.
  
              Expected kind is '${metadata.kind}', but received kind is '${m.kind}'.
            `,
          });
        if (metadata.nullable !== m.nullable)
          props.errors.push({
            path: `$input.request.selectMappings[${i}].nullable`,
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
        path: "$input.request.selectMappings[]",
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
        path: `$input.request.transformMappings[${i}].property`,
        value: m.property,
        expected: Object.keys(schema.properties)
          .map((key) => JSON.stringify(key))
          .join(" | "),
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
      `import { VariadicSingleton } from "tstl";`,
      `import typia, { tags } from "typia";`,
      "",
      `import { IEntity } from "@ORGANIZATION/PROJECT-api/lib/structures/IEntity";`,
      ...Array.from(typeReferences).map(
        (ref) =>
          `import { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
      ),
      "",
      'import { MyGlobal } from "../MyGlobal";',
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

  function validateSelectReturnType(props: {
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    if (/function\s+select\s*\(\s*\)\s*:/.test(props.content))
      props.errors.push({
        path: props.path,
        expected:
          "select() must use inferred return type (no explicit annotation).",
        value: props.content,
        description: StringUtil.trim`
          select() has an explicit return type annotation. This widens the
          literal type and destroys Prisma GetPayload inference, causing
          cascading type errors. Remove the return type — use satisfies
          on the return value instead.
        `,
      });
  }

  function validateNeighbors(props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const selfName: string = getName(props.plan.dtoTypeName);
    const neighborNames: string[] = getNeighbors(props.content);
    for (const x of neighborNames)
      if (
        x !== selfName &&
        props.neighbors.some((y) => getName(y.dtoTypeName) === x) === false
      )
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

  export function getRecursiveRelations(props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
    typeName: string;
  }): { parent: string | null; children: string | null } {
    const schema: AutoBeOpenApi.IJsonSchema | undefined =
      props.schemas[props.typeName];
    if (schema === undefined || !AutoBeOpenApiTypeChecker.isObject(schema))
      return { parent: null, children: null };

    const selfRef: string = `#/components/schemas/${props.typeName}`;
    const hasSelfRef = (s: AutoBeOpenApi.IJsonSchema): boolean => {
      if (AutoBeOpenApiTypeChecker.isReference(s)) return s.$ref === selfRef;
      if (AutoBeOpenApiTypeChecker.isOneOf(s))
        return s.oneOf.some((sub) => hasSelfRef(sub));
      return false;
    };
    const hasSelfRefArray = (s: AutoBeOpenApi.IJsonSchema): boolean => {
      const a = s as any;
      if (a.type === "array" && a.items != null) return hasSelfRef(a.items);
      if (AutoBeOpenApiTypeChecker.isOneOf(s))
        return s.oneOf.some((sub) => hasSelfRefArray(sub));
      return false;
    };

    let parent: string | null = null;
    let children: string | null = null;
    for (const [key, value] of Object.entries(schema.properties)) {
      if (!value) continue;
      if (hasSelfRef(value)) parent = key;
      else if (hasSelfRefArray(value)) children = key;
    }
    return { parent, children };
  }

  export function getRecursiveProperty(props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
    typeName: string;
  }): string | null {
    const { parent, children } = getRecursiveRelations(props);
    return parent ?? children;
  }

  export const fixApplication = (props: {
    definition: ILlmApplication;
    application: AutoBeDatabase.IApplication;
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeTransformerPlan;
  }): void => {
    const $defs: Record<string, ILlmSchema> =
      props.definition.functions[0].parameters.$defs;

    // transform
    (() => {
      const transform: ILlmSchema | undefined =
        $defs[typia.reflect.name<AutoBeRealizeTransformerTransformMapping>()];
      if (
        transform === undefined ||
        LlmTypeChecker.isObject(transform) === false
      )
        throw new Error(
          `AutoBeRealizeTransformerTransformMapping type is not defined in the function calling schema.`,
        );
      const property: ILlmSchema | undefined = transform.properties.property;
      if (property === undefined || LlmTypeChecker.isString(property) === false)
        throw new Error(
          `AutoBeRealizeTransformerTransformMapping.property is not defined as string type.`,
        );
      property.enum = getTransformMappingMetadata(props).map((m) => m.property);
    })();

    // select
    (() => {
      const select: ILlmSchema | undefined =
        $defs[typia.reflect.name<AutoBeRealizeTransformerSelectMapping>()];
      if (select === undefined || LlmTypeChecker.isObject(select) === false)
        throw new Error(
          `AutoBeRealizeTransformerSelectMapping type is not defined in the function calling schema.`,
        );

      const member: ILlmSchema | undefined = select.properties.member;
      if (member === undefined || LlmTypeChecker.isString(member) === false)
        throw new Error(
          `AutoBeRealizeTransformerSelectMapping.member is not defined as string type.`,
        );

      member.enum = getSelectMappingMetadata({
        application: props.application,
        model: props.application.files
          .map((f) => f.models)
          .flat()
          .find((m) => m.name === props.plan.databaseSchemaName)!,
      }).map((m) => m.member);
    })();
  };
}
