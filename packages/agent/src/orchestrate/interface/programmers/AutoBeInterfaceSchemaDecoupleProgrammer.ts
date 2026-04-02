import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeInterfaceSchemaDecoupleEdge,
  AutoBeInterfaceSchemaDecoupleRemoval,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";

export namespace AutoBeInterfaceSchemaDecoupleProgrammer {
  /**
   * Detect cross-type circular references in the schema graph.
   *
   * Builds a directed graph of `$ref` relationships between types,
   * then finds strongly connected components (SCCs) using Tarjan's
   * algorithm. Self-references (A → A) are excluded — they represent
   * legitimate tree structures.
   */
  export const detectCycles = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): AutoBeInterfaceSchemaDecoupleCycle[] => {
    const graph: Map<string, AutoBeInterfaceSchemaDecoupleEdge[]> =
      buildGraph(schemas);
    const sccs: string[][] = findSCCs(graph);

    return sccs.map((scc) => {
      const sccSet = new Set(scc);
      const edges: AutoBeInterfaceSchemaDecoupleEdge[] = [];
      for (const type of scc)
        for (const edge of graph.get(type) ?? [])
          if (sccSet.has(edge.targetType)) edges.push(edge);
      return { types: scc, edges };
    });
  };

  /**
   * Fix LLM application schema by enumerating valid removal targets.
   *
   * Sets `typeName` enum to cycle source types and `propertyName` enum
   * to all valid cycle edge property names.
   */
  export const fixApplication = (props: {
    application: ILlmApplication;
    cycles: AutoBeInterfaceSchemaDecoupleCycle[];
  }): void => {
    const $defs = props.application.functions[0]?.parameters.$defs;
    if ($defs === undefined) return;

    const removal: ILlmSchema | undefined =
      $defs[typia.reflect.name<AutoBeInterfaceSchemaDecoupleRemoval>()];
    if (removal === undefined || LlmTypeChecker.isObject(removal) === false)
      return;

    const typeName: ILlmSchema | undefined = removal.properties.typeName;
    if (typeName !== undefined && LlmTypeChecker.isString(typeName))
      typeName.enum = [
        ...new Set(
          props.cycles.flatMap((c) => c.edges.map((e) => e.sourceType)),
        ),
      ];

    const propertyName: ILlmSchema | undefined =
      removal.properties.propertyName;
    if (propertyName !== undefined && LlmTypeChecker.isString(propertyName))
      propertyName.enum = [
        ...new Set(
          props.cycles.flatMap((c) => c.edges.map((e) => e.propertyName)),
        ),
      ];
  };

  /**
   * Execute property removals on schemas to break circular references.
   */
  export const execute = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
    removals: AutoBeInterfaceSchemaDecoupleRemoval[],
  ): void => {
    for (const removal of removals) {
      const schema = schemas[removal.typeName];
      if (!schema || !AutoBeOpenApiTypeChecker.isObject(schema)) continue;

      // Remove the property
      delete schema.properties[removal.propertyName];
      if (schema.required)
        schema.required = schema.required.filter(
          (r) => r !== removal.propertyName,
        );

      // Update description and specification to stay consistent
      schema.description = removal.updatedDescription;
      if (removal.updatedSpecification)
        schema["x-autobe-specification"] = removal.updatedSpecification;
    }
  };

  /**
   * Validate that the LLM's removal decisions are correct.
   *
   * Checks:
   * 1. Each removal references a valid typeName + propertyName
   * 2. Each removal corresponds to an actual cycle edge
   * 3. Every cycle has at least one of its edges removed
   */
  export const validate = (props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    cycles: AutoBeInterfaceSchemaDecoupleCycle[];
    removals: AutoBeInterfaceSchemaDecoupleRemoval[];
    errors: IValidation.IError[];
    path: string;
  }): void => {
    for (let i = 0; i < props.removals.length; i++) {
      const removal = props.removals[i]!;
      const schema = props.schemas[removal.typeName];

      if (!schema) {
        props.errors.push({
          path: `${props.path}.removals[${i}].typeName`,
          expected: `one of the existing schema type names`,
          value: removal.typeName,
        });
        continue;
      }
      if (!AutoBeOpenApiTypeChecker.isObject(schema)) {
        props.errors.push({
          path: `${props.path}.removals[${i}].typeName`,
          expected: "an object schema type name",
          value: removal.typeName,
        });
        continue;
      }
      if (!(removal.propertyName in schema.properties)) {
        const validProps = Object.keys(schema.properties).join(", ");
        props.errors.push({
          path: `${props.path}.removals[${i}].propertyName`,
          expected: `one of [${validProps}]`,
          value: removal.propertyName,
        });
        continue;
      }

      // Check the removal corresponds to an actual cycle edge
      const isEdge = props.cycles.some((cycle) =>
        cycle.edges.some(
          (edge) =>
            edge.sourceType === removal.typeName &&
            edge.propertyName === removal.propertyName,
        ),
      );
      if (!isEdge)
        props.errors.push({
          path: `${props.path}.removals[${i}]`,
          expected:
            "a removal that matches a cycle edge (sourceType.propertyName)",
          value: `${removal.typeName}.${removal.propertyName}`,
        });
    }

    // Verify every cycle has at least one edge removed
    for (let i = 0; i < props.cycles.length; i++) {
      const cycle = props.cycles[i]!;
      const hasCut = cycle.edges.some((edge) =>
        props.removals.some(
          (r) =>
            r.typeName === edge.sourceType &&
            r.propertyName === edge.propertyName,
        ),
      );
      if (!hasCut)
        props.errors.push({
          path: `${props.path}.removals`,
          expected: `at least one removal for cycle [${cycle.types.join(" → ")}]`,
          value: props.removals,
        });
    }
  };

  // ---------------------------------------------------------------
  // INTERNAL: Graph Construction
  // ---------------------------------------------------------------

  const buildGraph = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): Map<string, AutoBeInterfaceSchemaDecoupleEdge[]> => {
    const graph = new Map<string, AutoBeInterfaceSchemaDecoupleEdge[]>();

    for (const [typeName, schema] of Object.entries(schemas)) {
      if (!AutoBeOpenApiTypeChecker.isObject(schema)) continue;

      const edges: AutoBeInterfaceSchemaDecoupleEdge[] = [];
      for (const [propName, propSchema] of Object.entries(schema.properties))
        collectRefs(propSchema, typeName, propName, edges);

      // Exclude self-references — legitimate tree patterns
      const crossTypeEdges = edges.filter((e) => e.targetType !== typeName);
      if (crossTypeEdges.length > 0) graph.set(typeName, crossTypeEdges);
    }

    return graph;
  };

  /**
   * Recursively collect $ref targets from a property schema.
   * Handles direct references, arrays of references, and nullable references.
   */
  const collectRefs = (
    schema: AutoBeOpenApi.IJsonSchema,
    sourceType: string,
    propertyName: string,
    edges: AutoBeInterfaceSchemaDecoupleEdge[],
  ): void => {
    if (AutoBeOpenApiTypeChecker.isReference(schema)) {
      const targetType = schema.$ref.split("/").pop()!;
      if (targetType !== sourceType)
        edges.push({ sourceType, propertyName, targetType });
    } else if (AutoBeOpenApiTypeChecker.isArray(schema)) {
      collectRefs(schema.items, sourceType, propertyName, edges);
    } else if (AutoBeOpenApiTypeChecker.isOneOf(schema)) {
      for (const sub of schema.oneOf)
        collectRefs(sub, sourceType, propertyName, edges);
    }
  };

  // ---------------------------------------------------------------
  // INTERNAL: Tarjan's SCC Algorithm
  // ---------------------------------------------------------------

  const findSCCs = (
    graph: Map<string, AutoBeInterfaceSchemaDecoupleEdge[]>,
  ): string[][] => {
    // Collect all nodes reachable in the graph
    const allNodes = new Set<string>();
    for (const [node, edges] of graph) {
      allNodes.add(node);
      for (const edge of edges) allNodes.add(edge.targetType);
    }

    let index = 0;
    const stack: string[] = [];
    const onStack = new Set<string>();
    const indices = new Map<string, number>();
    const lowlinks = new Map<string, number>();
    const sccs: string[][] = [];

    const strongconnect = (v: string): void => {
      indices.set(v, index);
      lowlinks.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      for (const edge of graph.get(v) ?? []) {
        const w = edge.targetType;
        if (!indices.has(w)) {
          strongconnect(w);
          lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
        } else if (onStack.has(w)) {
          lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
        }
      }

      if (lowlinks.get(v) === indices.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        sccs.push(scc);
      }
    };

    for (const node of allNodes)
      if (!indices.has(node)) strongconnect(node);

    // Only return SCCs with 2+ nodes (actual cross-type cycles)
    return sccs.filter((scc) => scc.length > 1);
  };
}
