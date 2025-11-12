import { AutoBeOpenApi, AutoBePreliminaryKind } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { OpenApiTypeChecker } from "@samchon/openapi";
import { HashMap, HashSet, Pair } from "tstl";

import { IAutoBePreliminaryCollection } from "../structures/IAutoBePreliminaryCollection";

export const complementPreliminaryCollection = (props: {
  kinds: AutoBePreliminaryKind[];
  all: IAutoBePreliminaryCollection;
  local: IAutoBePreliminaryCollection;
}): void => {
  //----
  // Complement interface operations with prerequisites
  //----
  if (props.kinds.includes("interfaceOperations") === true) {
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
    props.local.interfaceOperations.splice(
      0,
      props.local.interfaceOperations.length,
    );
    props.local.interfaceOperations.push(
      ...Array.from(endpoints).map((ep) => dict.get(ep)),
    );

    // Add DTO schemas used in operations
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
  }

  //----
  // Complement DTO schemas with iterative references
  //----
  if (props.kinds.includes("interfaceSchemas") === true) {
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

    if (props.kinds.includes("prismaSchemas") === true) {
      const prisma: Set<string> = new Set();
      for (const dto of Object.values(props.local.interfaceSchemas))
        OpenApiTypeChecker.visit({
          components: {
            schemas: props.all.interfaceSchemas,
          },
          schema: dto,
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
      for (const name of prisma)
        if (
          props.local.prismaSchemas.find((m) => m.name === name) === undefined
        )
          props.local.prismaSchemas.push(
            props.all.prismaSchemas.find((m) => m.name === name)!,
          );
    }
  }
};
