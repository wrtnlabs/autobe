import {
  AutoBeDatabase,
  AutoBeOpenApi,
  AutoBePreliminaryKind,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import pluralize from "pluralize";
import { HashMap, HashSet, Pair } from "tstl";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeRealizeCollectorProgrammer } from "../../realize/programmers/AutoBeRealizeCollectorProgrammer";
import { AutoBeRealizeTransformerProgrammer } from "../../realize/programmers/AutoBeRealizeTransformerProgrammer";
import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

interface IProps {
  kinds: AutoBePreliminaryKind[];
  all: IAutoBePreliminaryCollection;
  local: IAutoBePreliminaryCollection;
  prerequisite: boolean;
}
interface INextProps extends IProps {
  previous: boolean;
}

export const complementPreliminaryCollection = (props: IProps): void => {
  // Realize modularizations
  if (props.kinds.includes("realizeCollectors") === true)
    complementRealizeCollectors(props);
  if (props.kinds.includes("realizeTransformers") === true)
    complementRealizeTransformers(props);

  // Complement interface operations with prerequisites
  if (props.kinds.includes("interfaceOperations") === true)
    complementInterfaceOperations({
      ...props,
      previous: false,
    });
  if (props.kinds.includes("previousInterfaceOperations") === true)
    complementInterfaceOperations({
      ...props,
      previous: true,
    });

  // Complement DTO schemas with iterative references
  if (props.kinds.includes("interfaceSchemas") === true)
    complementInterfaceSchemas({
      ...props,
      previous: false,
    });
  if (props.kinds.includes("previousInterfaceSchemas") === true)
    complementInterfaceSchemas({
      ...props,
      previous: true,
    });
};

const complementRealizeCollectors = (props: IProps): void =>
  complementRealizeModularizations(props, props.local.realizeCollectors);

const complementRealizeTransformers = (props: IProps): void =>
  complementRealizeModularizations(props, props.local.realizeTransformers);

const complementRealizeModularizations = (
  props: IProps,
  metadata:
    | AutoBeRealizeCollectorFunction[]
    | AutoBeRealizeTransformerFunction[],
): void => {
  for (const { plan } of metadata) {
    if (props.kinds.includes("databaseSchemas")) {
      const model: AutoBeDatabase.IModel | undefined =
        props.all.databaseSchemas.find(
          (m) => m.name === plan.databaseSchemaName,
        );
      if (
        model !== undefined &&
        props.local.databaseSchemas.find((m) => m.name === model.name) ===
          undefined
      )
        props.local.databaseSchemas.push(model);
    }
    if (props.kinds.includes("interfaceSchemas")) {
      const type: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
        props.all.interfaceSchemas[plan.dtoTypeName];
      if (type !== undefined)
        props.local.interfaceSchemas[plan.dtoTypeName] ??= type;
    }
  }
};

const complementInterfaceOperations = (props: INextProps) => {
  // collect endpoints and operations
  const kind: "interfaceOperations" | "previousInterfaceOperations" =
    props.previous ? "previousInterfaceOperations" : "interfaceOperations";
  const schemaKind: "interfaceSchemas" | "previousInterfaceSchemas" =
    props.previous ? "previousInterfaceSchemas" : "interfaceSchemas";
  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      props.all[kind].map(
        (op) => new Pair({ method: op.method, path: op.path }, op),
      ),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
  const endpoints: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  );
  const insert = (op: AutoBeOpenApi.IOperation) => {
    if (endpoints.has(op) === true) return;
    endpoints.insert({
      method: op.method,
      path: op.path,
    });
    if (props.prerequisite === true)
      for (const pre of op.prerequisites ?? []) insert(dict.get(pre.endpoint));
  };
  for (const op of props.local[kind]) insert(op);

  // remake local operations
  props.local[kind].splice(0, props.local[kind].length);
  props.local[kind].push(...Array.from(endpoints).map((ep) => dict.get(ep)));

  // add DTO schemas used in operations
  if (props.kinds.includes(schemaKind) === true) {
    const typeNames: Set<string> = new Set();
    for (const op of props.local[kind]) {
      if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
      if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
    }
    for (const key of typeNames)
      if (
        props.local[schemaKind][key] === undefined &&
        props.all[schemaKind][key] !== undefined
      )
        props.local[schemaKind][key] = props.all[schemaKind][key];
  }
};

const complementInterfaceSchemas = (props: INextProps) => {
  // link modularizations
  if (
    props.previous === false &&
    props.kinds.includes("realizeCollectors") === true
  ) {
    const creators: string[] = Object.keys(props.local.interfaceSchemas).filter(
      AutoBeRealizeCollectorProgrammer.filter,
    );
    for (const key of creators) {
      const found: AutoBeRealizeCollectorFunction | undefined =
        props.all.realizeCollectors.find((t) => t.plan.dtoTypeName === key);
      if (found !== undefined) props.local.realizeCollectors.push(found);
    }
  }
  if (
    props.previous === false &&
    props.kinds.includes("realizeTransformers") === true
  ) {
    const unique: Set<string> = new Set();
    for (const key of Object.keys(props.local.interfaceSchemas)) {
      if (key.startsWith("IPage") && key.startsWith("IPage.") === false)
        unique.add(key.replace("IPage", ""));
      else if (key.endsWith(".IAuthorized"))
        unique.add(key.replace(".IAuthorized", ""));
      else if (
        AutoBeRealizeTransformerProgrammer.filter({
          schemas: props.all.interfaceSchemas,
          key,
        }) === true
      )
        unique.add(key);
    }
    for (const key of unique) {
      const found: AutoBeRealizeTransformerFunction | undefined =
        props.all.realizeTransformers.find((t) => t.plan.dtoTypeName === key);
      if (found !== undefined) props.local.realizeTransformers.push(found);
    }
  }

  // link dependencies
  const kind: "interfaceSchemas" | "previousInterfaceSchemas" = props.previous
    ? "previousInterfaceSchemas"
    : "interfaceSchemas";
  const prismaKind: "databaseSchemas" | "previousDatabaseSchemas" =
    props.previous ? "previousDatabaseSchemas" : "databaseSchemas";
  const unique: Set<string> = new Set(Object.keys(props.local[kind]));
  for (const dto of Object.values(props.local[kind]))
    OpenApiTypeChecker.visit({
      components: {
        schemas: props.all[kind],
      },
      schema: dto,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          unique.add(next.$ref.split("/").pop()!);
      },
    });
  for (const key of unique)
    if (
      props.local[kind][key] === undefined &&
      props.all[kind][key] !== undefined
    )
      props.local[kind][key] = props.all[kind][key];

  // load related database schemas
  if (props.kinds.includes(prismaKind) === true) {
    const prisma: Set<string> = new Set();
    for (const [key, value] of Object.entries(props.local[kind])) {
      OpenApiTypeChecker.visit({
        components: {
          schemas: props.all[kind],
        },
        schema: value,
        closure: (next) => {
          if (OpenApiTypeChecker.isObject(next) === false) return;
          const name: string | null | undefined = (
            next as AutoBeOpenApi.IJsonSchema.IObject
          )["x-autobe-database-schema"];
          if (
            name !== null &&
            name !== undefined &&
            props.all[prismaKind].find((m) => m.name === name) !== undefined
          )
            prisma.add(name);
        },
      });
      const candidate: string = pluralize(NamingConvention.snake(key));
      if (props.all[prismaKind].find((m) => m.name === candidate) !== undefined)
        prisma.add(candidate);
    }
    for (const name of prisma) {
      if (props.local[prismaKind].find((m) => m.name === name) === undefined)
        props.local[prismaKind].push(
          props.all[prismaKind].find((m) => m.name === name)!,
        );
    }
  }
};
