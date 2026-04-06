import { AutoBeOpenApi, AutoBeRealizeTransformerPlan } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";

import { AutoBeRealizeTransformerProgrammer } from "../AutoBeRealizeTransformerProgrammer";

export function writeRealizeTransformerTemplate(props: {
  plan: AutoBeRealizeTransformerPlan;
  schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  schemas: Record<string, AutoBeOpenApi.IJsonSchema>;
  neighbors?: AutoBeRealizeTransformerPlan[];
  relations?: Array<{
    propertyKey: string;
    targetModel: string;
    relationType: string;
    fkColumns: string;
  }>;
}): string {
  const relations = AutoBeRealizeTransformerProgrammer.getRecursiveRelations({
    schemas: props.schemas,
    typeName: props.plan.dtoTypeName,
  });
  if (relations.parent !== null || relations.children !== null)
    return writeRecursiveTemplate({
      plan: props.plan,
      schema: props.schema,
      parentProperty: relations.parent,
      childrenProperty: relations.children,
    });

  const neighborRelations =
    props.neighbors && props.relations
      ? AutoBeRealizeTransformerProgrammer.computeNeighborRelations({
          schema: props.schema,
          neighbors: props.neighbors,
          relations: props.relations,
        })
      : [];

  return writeNormalTemplate({
    plan: props.plan,
    schema: props.schema,
    neighborRelations,
  });
}

function isScalarProperty(schema: AutoBeOpenApi.IJsonSchema): boolean {
  if (AutoBeOpenApiTypeChecker.isString(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isNumber(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isInteger(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isBoolean(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isConstant(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isNull(schema)) return true;
  if (AutoBeOpenApiTypeChecker.isOneOf(schema))
    return schema.oneOf.every((s) => isScalarProperty(s));
  return false;
}

function buildSelectEntries(props: {
  schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  skipKeys: Set<string>;
  neighborRelations: AutoBeRealizeTransformerProgrammer.INeighborRelation[];
}): { entries: string[]; hasUnresolved: boolean } {
  const entries: string[] = [];
  let hasUnresolved = false;

  for (const k of Object.keys(props.schema.properties)) {
    if (props.skipKeys.has(k)) continue;
    const nr = props.neighborRelations.find((n) => n.dtoProperty === k);
    if (nr) {
      entries.push(`${nr.relationKey}: ${nr.transformerName}.select(),`);
    } else if (isScalarProperty(props.schema.properties[k]!)) {
      entries.push(`${k}: true,`);
    } else {
      hasUnresolved = true;
    }
  }

  return { entries, hasUnresolved };
}

function formatSelectBody(entries: string[], hasUnresolved: boolean): string {
  return [...entries, ...(hasUnresolved ? ["..."] : [])].join("\n            ");
}

function writeNormalTemplate(props: {
  plan: AutoBeRealizeTransformerPlan;
  schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  neighborRelations: AutoBeRealizeTransformerProgrammer.INeighborRelation[];
}): string {
  const name: string = AutoBeRealizeTransformerProgrammer.getName(
    props.plan.dtoTypeName,
  );
  const dto: string = props.plan.dtoTypeName;
  const table: string = props.plan.databaseSchemaName;

  const transformBody: string = Object.keys(props.schema.properties)
    .map((k) => {
      const nr = props.neighborRelations.find((n) => n.dtoProperty === k);
      if (!nr) {
        const hint = AutoBeOpenApiTypeChecker.getTypeName(
          props.schema.properties[k]!,
        );
        return `  ${k}: {${hint}},`;
      }
      if (nr.isArray) {
        const call = `await ArrayUtil.asyncMap(input.${nr.relationKey}, ${nr.transformerName}.transform)`;
        if (nr.isNullable)
          return `  ${k}: input.${nr.relationKey} ? ${call} : null,`;
        return `  ${k}: ${call},`;
      }
      if (nr.isNullable)
        return `  ${k}: input.${nr.relationKey} ? await ${nr.transformerName}.transform(input.${nr.relationKey}) : null,`;
      return `  ${k}: await ${nr.transformerName}.transform(input.${nr.relationKey}),`;
    })
    .join("\n");

  const { entries, hasUnresolved } = buildSelectEntries({
    schema: props.schema,
    skipKeys: new Set(),
    neighborRelations: props.neighborRelations,
  });
  const selectBody = formatSelectBody(entries, hasUnresolved);

  return StringUtil.trim`
    export namespace ${name} {
      export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            ${selectBody}
          },
        } satisfies Prisma.${table}FindManyArgs;
      }

      export async function transform(input: Payload): Promise<${dto}> {
        return {
${transformBody}
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
  const name: string = AutoBeRealizeTransformerProgrammer.getName(
    props.plan.dtoTypeName,
  );
  const dto: string = props.plan.dtoTypeName;
  const table: string = props.plan.databaseSchemaName;
  const pp: string = props.parentProperty;
  const fk: string = `${pp}_id`;
  const transformBody: string = Object.keys(props.schema.properties)
    .map((k) =>
      k === pp
        ? `  ${k}: input.${fk} ? await cache.get(input.${fk}) : null,`
        : `  ${k}: {${AutoBeOpenApiTypeChecker.getTypeName(props.schema.properties[k]!)}},`,
    )
    .join("\n");

  const { entries, hasUnresolved } = buildSelectEntries({
    schema: props.schema,
    skipKeys: new Set([pp]),
    neighborRelations: [],
  });
  const selectBody = formatSelectBody(
    [
      ...entries,
      `${fk}: true,`,
      `${pp}: undefined, // DO NOT select recursive relation`,
    ],
    hasUnresolved,
  );

  return StringUtil.trim`
    export namespace ${name} {
      export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            ${selectBody}
          },
        } satisfies Prisma.${table}FindManyArgs;
      }

      export async function transform(
        input: Payload,
        cache: VariadicSingleton<Promise<${dto}>, [string]> = createParentCache(),
      ): Promise<${dto}> {
        return {
${transformBody}
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
  const name: string = AutoBeRealizeTransformerProgrammer.getName(
    props.plan.dtoTypeName,
  );
  const dto: string = props.plan.dtoTypeName;
  const table: string = props.plan.databaseSchemaName;
  const cp: string = props.childrenProperty;
  const transformBody: string = Object.keys(props.schema.properties)
    .map((k) =>
      k === cp
        ? `  ${k}: await cache.get(input.id),`
        : `  ${k}: {${AutoBeOpenApiTypeChecker.getTypeName(props.schema.properties[k]!)}},`,
    )
    .join("\n");

  const { entries, hasUnresolved } = buildSelectEntries({
    schema: props.schema,
    skipKeys: new Set([cp]),
    neighborRelations: [],
  });
  const selectBody = formatSelectBody(
    [...entries, `${cp}: undefined, // DO NOT select recursive relation`],
    hasUnresolved,
  );

  return StringUtil.trim`
    export namespace ${name} {
      export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            ${selectBody}
          },
        } satisfies Prisma.${table}FindManyArgs;
      }

      export async function transform(
        input: Payload,
        cache: VariadicSingleton<Promise<${dto}[]>, [string]> = createChildrenCache(),
      ): Promise<${dto}> {
        return {
${transformBody}
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
  const name: string = AutoBeRealizeTransformerProgrammer.getName(
    props.plan.dtoTypeName,
  );
  const dto: string = props.plan.dtoTypeName;
  const table: string = props.plan.databaseSchemaName;
  const pp: string = props.parentProperty;
  const cp: string = props.childrenProperty;
  const fk: string = `${pp}_id`;
  const transformBody: string = Object.keys(props.schema.properties)
    .map((k) => {
      if (k === pp)
        return `  ${k}: input.${fk} ? await parentCache.get(input.${fk}) : null,`;
      if (k === cp) return `  ${k}: await childrenCache.get(input.id),`;
      return `  ${k}: {${AutoBeOpenApiTypeChecker.getTypeName(props.schema.properties[k]!)}},`;
    })
    .join("\n");

  const { entries, hasUnresolved } = buildSelectEntries({
    schema: props.schema,
    skipKeys: new Set([pp, cp]),
    neighborRelations: [],
  });
  const selectBody = formatSelectBody(
    [
      ...entries,
      `${fk}: true,`,
      `${pp}: undefined, // DO NOT select recursive relation`,
      `${cp}: undefined, // DO NOT select recursive relation`,
    ],
    hasUnresolved,
  );

  return StringUtil.trim`
    export namespace ${name} {
      export type Payload = Prisma.${table}GetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            ${selectBody}
          },
        } satisfies Prisma.${table}FindManyArgs;
      }

      export async function transform(
        input: Payload,
        parentCache: VariadicSingleton<Promise<${dto}>, [string]> = createParentCache(),
        childrenCache: VariadicSingleton<Promise<${dto}[]>, [string]> = createChildrenCache(),
      ): Promise<${dto}> {
        return {
${transformBody}
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
