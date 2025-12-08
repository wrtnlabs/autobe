import {
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
}

export const complementPreliminaryCollection = (props: IProps): void => {
  // Complement interface operations with prerequisites
  if (props.kinds.includes("interfaceOperations") === true)
    complementInterfaceOperations(props);

  // Complement DTO schemas with iterative references
  if (props.kinds.includes("interfaceSchemas") === true)
    complementInterfaceSchemas(props);
};

const complementInterfaceOperations = (props: IProps) => {
  // collect endpoints and operations
  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    new HashMap(
      props.all.interfaceOperations.map(
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
    for (const pre of op.prerequisites ?? []) {
      insert(dict.get(pre.endpoint));
    }
  };
  for (const op of props.local.interfaceOperations) insert(op);

  // remake local operations
  props.local.interfaceOperations.splice(
    0,
    props.local.interfaceOperations.length,
  );
  props.local.interfaceOperations.push(
    ...Array.from(endpoints).map((ep) => dict.get(ep)),
  );

  // add DTO schemas used in operations
  if (props.kinds.includes("interfaceSchemas") === true) {
    const typeNames: Set<string> = new Set();
    for (const op of props.local.interfaceOperations) {
      if (op.requestBody !== null) typeNames.add(op.requestBody.typeName);
      if (op.responseBody !== null) typeNames.add(op.responseBody.typeName);
    }
    for (const key of typeNames)
      if (props.local.interfaceSchemas[key] === undefined)
        props.local.interfaceSchemas[key] = props.all.interfaceSchemas[key];
  }
};

const complementInterfaceSchemas = (props: IProps) => {
  // link modularizations
  if (props.kinds.includes("realizeCollectors") === true) {
    const creators: string[] = Object.keys(props.local.interfaceSchemas).filter(
      AutoBeRealizeCollectorProgrammer.filter,
    );
    for (const key of creators) {
      const found: AutoBeRealizeCollectorFunction | undefined =
        props.all.realizeCollectors.find((t) => t.plan.dtoTypeName === key);
      if (found !== undefined) props.local.realizeCollectors.push(found);
    }
  }
  if (props.kinds.includes("realizeTransformers") === true) {
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
  const unique: Set<string> = new Set(
    Object.keys(props.local.interfaceSchemas),
  );
  for (const dto of Object.values(props.local.interfaceSchemas))
    OpenApiTypeChecker.visit({
      components: {
        schemas: props.all.interfaceSchemas,
      },
      schema: dto,
      closure: (next) => {
        if (OpenApiTypeChecker.isReference(next))
          unique.add(next.$ref.split("/").pop()!);
      },
    });
  for (const key of unique)
    if (props.local.interfaceSchemas[key] === undefined)
      props.local.interfaceSchemas[key] = props.all.interfaceSchemas[key];

  // load related prisma schemas
  if (props.kinds.includes("prismaSchemas") === true) {
    const prisma: Set<string> = new Set();
    for (const [key, value] of Object.entries(props.local.interfaceSchemas)) {
      OpenApiTypeChecker.visit({
        components: {
          schemas: props.all.interfaceSchemas,
        },
        schema: value,
        closure: (next) => {
          if (OpenApiTypeChecker.isObject(next) === false) return;
          const name: string | null | undefined = (
            next as AutoBeOpenApi.IJsonSchema.IObject
          )["x-autobe-prisma-schema"];
          if (
            name !== null &&
            name !== undefined &&
            props.all.prismaSchemas.find((m) => m.name === name) !== undefined
          )
            prisma.add(name);
        },
      });
      const candidate: string = pluralize(NamingConvention.snake(key));
      if (
        props.all.prismaSchemas.find((m) => m.name === candidate) !== undefined
      )
        prisma.add(candidate);
    }
    for (const name of prisma) {
      if (props.local.prismaSchemas.find((m) => m.name === name) === undefined)
        props.local.prismaSchemas.push(
          props.all.prismaSchemas.find((m) => m.name === name)!,
        );
    }
  }
};
