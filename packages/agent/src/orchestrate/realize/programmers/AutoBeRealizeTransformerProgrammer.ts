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
import { writeRealizeTransformerTemplate } from "./internal/writeRealizeTransformerTemplate";

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

  export interface INeighborRelation {
    dtoProperty: string;
    relationKey: string;
    transformerName: string;
    isArray: boolean;
    isNullable: boolean;
  }

  export function computeNeighborRelations(props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    neighbors: AutoBeRealizeTransformerPlan[];
    relations: Array<{
      propertyKey: string;
      targetModel: string;
      relationType: string;
      fkColumns: string;
    }>;
  }): INeighborRelation[] {
    const result: INeighborRelation[] = [];

    // Count how many DTO properties reference each neighbor type and
    // how many relations point to each target model.
    // When either is ambiguous (>1), skip — wrong mapping is worse than none.
    const dtoRefCount = new Map<string, number>();
    const relationCount = new Map<string, number>();
    const neighborSchemaCount = new Map<string, number>();
    for (const neighbor of props.neighbors) {
      const targetRef = `#/components/schemas/${neighbor.dtoTypeName}`;
      let count = 0;
      for (const [, prop] of Object.entries(props.schema.properties)) {
        if (!prop) continue;
        if (findNeighborRef({ schema: prop, targetRef })) count++;
      }
      dtoRefCount.set(neighbor.dtoTypeName, count);
      relationCount.set(
        neighbor.databaseSchemaName,
        props.relations.filter(
          (r) => r.targetModel === neighbor.databaseSchemaName,
        ).length,
      );
      neighborSchemaCount.set(
        neighbor.databaseSchemaName,
        (neighborSchemaCount.get(neighbor.databaseSchemaName) ?? 0) + 1,
      );
    }

    for (const neighbor of props.neighbors) {
      // Skip ambiguous cases: multiple DTO properties, relations, or
      // neighbors sharing the same database schema (would produce
      // duplicate select keys → silent JS overwrite)
      if ((dtoRefCount.get(neighbor.dtoTypeName) ?? 0) !== 1) continue;
      if ((relationCount.get(neighbor.databaseSchemaName) ?? 0) !== 1) continue;
      if ((neighborSchemaCount.get(neighbor.databaseSchemaName) ?? 0) !== 1)
        continue;

      const targetRef = `#/components/schemas/${neighbor.dtoTypeName}`;
      let dtoMatch: {
        property: string;
        isArray: boolean;
        isNullable: boolean;
      } | null = null;

      for (const [key, prop] of Object.entries(props.schema.properties)) {
        if (!prop) continue;
        const ref = findNeighborRef({ schema: prop, targetRef });
        if (ref) {
          dtoMatch = { property: key, ...ref };
          break;
        }
      }

      const relation = props.relations.find(
        (r) => r.targetModel === neighbor.databaseSchemaName,
      );

      if (dtoMatch && relation) {
        result.push({
          dtoProperty: dtoMatch.property,
          relationKey: relation.propertyKey,
          transformerName: getName(neighbor.dtoTypeName),
          isArray: dtoMatch.isArray,
          isNullable: dtoMatch.isNullable,
        });
      }
    }
    return result;
  }

  function findNeighborRef(props: {
    schema: AutoBeOpenApi.IJsonSchema;
    targetRef: string;
  }): { isArray: boolean; isNullable: boolean } | null {
    const { schema, targetRef } = props;
    if (
      AutoBeOpenApiTypeChecker.isReference(schema) &&
      schema.$ref === targetRef
    )
      return { isArray: false, isNullable: false };
    if (
      AutoBeOpenApiTypeChecker.isArray(schema) &&
      AutoBeOpenApiTypeChecker.isReference(schema.items) &&
      schema.items.$ref === targetRef
    )
      return { isArray: true, isNullable: false };
    if (AutoBeOpenApiTypeChecker.isOneOf(schema)) {
      const hasNull = schema.oneOf.some((s) =>
        AutoBeOpenApiTypeChecker.isNull(s),
      );
      for (const sub of schema.oneOf) {
        if (AutoBeOpenApiTypeChecker.isNull(sub)) continue;
        const inner = findNeighborRef({ schema: sub, targetRef });
        if (inner) return { ...inner, isNullable: hasNull };
      }
    }
    return null;
  }

  export const writeTemplate = writeRealizeTransformerTemplate;

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
    validateSelectTransformContract({
      plan: props.plan,
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
      validateSelectTransformContract({
        plan: props.plan,
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
      `import { ArrayUtil } from "@nestia/e2e";`,
      `import { HttpException } from "@nestjs/common";`,
      `import { Prisma } from "@prisma/sdk";`,
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

  function validateSelectTransformContract(props: {
    plan: AutoBeRealizeTransformerPlan;
    content: string;
    path: string;
    errors: IValidation.IError[];
  }): void {
    const selfName: string = getName(props.plan.dtoTypeName);
    const selectUsers: Set<string> = new Set();
    const transformUsers: Set<string> = new Set();
    const selectRegex: RegExp = /(\w+Transformer)\.select/g;
    const transformRegex: RegExp = /(\w+Transformer)\.transform/g;
    let match: RegExpExecArray | null;
    while ((match = selectRegex.exec(props.content)) !== null)
      selectUsers.add(match[1]!);
    while ((match = transformRegex.exec(props.content)) !== null)
      transformUsers.add(match[1]!);
    for (const name of transformUsers) {
      if (name === selfName) continue;
      if (selectUsers.has(name) === false)
        props.errors.push({
          path: props.path,
          expected: `${name}.select() must appear in select() when ${name}.transform() is used.`,
          value: props.content,
          description: StringUtil.trim`
            You call ${name}.transform() but never include ${name}.select()
            in your select query. The Payload type of ${name}.transform()
            is derived from ${name}.select() — without it, the data shape
            will not match and you will get "missing properties" compile
            errors. Reuse ${name}.select() in your select instead of
            writing an inline select.
          `,
        });
    }
    for (const name of selectUsers) {
      if (name === selfName) continue;
      if (transformUsers.has(name) === false)
        props.errors.push({
          path: props.path,
          expected: `${name}.transform() must be called when ${name}.select() is used.`,
          value: props.content,
          description: StringUtil.trim`
            You include ${name}.select() in your query but never call
            ${name}.transform() to convert the result. The data fetched
            via ${name}.select() is a raw Prisma payload shaped for
            ${name}.transform() — assigning it directly to a DTO field
            or transforming it inline will cause type mismatches. Call
            ${name}.transform() on the fetched data.
          `,
        });
    }
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
      if (AutoBeOpenApiTypeChecker.isArray(s)) return hasSelfRef(s.items);
      else if (AutoBeOpenApiTypeChecker.isOneOf(s))
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
