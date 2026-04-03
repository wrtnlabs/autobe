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
   * Builds a directed graph of `$ref` relationships between types, then finds
   * strongly connected components (SCCs) using Tarjan's algorithm.
   * Self-references (A → A) are excluded — they represent legitimate tree
   * structures.
   */
  export const detectCycles = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>,
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
   * Fix LLM application schema by injecting valid edge pairs into the removal
   * object's description.
   *
   * Listing valid `typeName.propertyName` pairs on the removal object guides
   * the LLM to choose a correct cycle edge without the independent- enum
   * problem (where `typeName` and `propertyName` enums are checked separately,
   * allowing invalid cross-combinations).
   */
  export const fixApplication = (props: {
    application: ILlmApplication;
    cycle: AutoBeInterfaceSchemaDecoupleCycle;
  }): void => {
    const $defs = props.application.functions[0]?.parameters.$defs;
    if ($defs === undefined) return;

    const removal: ILlmSchema | undefined =
      $defs[typia.reflect.name<AutoBeInterfaceSchemaDecoupleRemoval>()];
    if (removal === undefined || LlmTypeChecker.isObject(removal) === false)
      return;

    const pairs = props.cycle.edges
      .map((e) => `${e.sourceType}.${e.propertyName}`)
      .join(", ");
    removal.description = `Valid edges for this cycle (typeName.propertyName): ${pairs}`;
  };

  /**
   * Execute one property removal and apply inline documentation updates.
   *
   * Step 1: Delete the named property from its schema. Step 2: Apply
   * description/specification updates from the removal if provided (non-null
   * fields on the removal object itself).
   */
  export const execute = (props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    removal: AutoBeInterfaceSchemaDecoupleRemoval;
  }): void => {
    const schema: AutoBeOpenApi.IJsonSchemaDescriptive | undefined =
      props.schemas[props.removal.typeName];
    if (
      schema === undefined ||
      AutoBeOpenApiTypeChecker.isObject(schema) === false
    )
      return;

    delete schema.properties[props.removal.propertyName];
    if (schema.required)
      schema.required = schema.required.filter(
        (r) => r !== props.removal.propertyName,
      );

    if (props.removal.description !== null)
      schema.description = props.removal.description;
    if (props.removal.specification !== null)
      schema["x-autobe-specification"] = props.removal.specification;
  };

  /**
   * Validate that the LLM's removal decision is correct.
   *
   * Checks:
   *
   * 1. The removal references a valid typeName + propertyName
   * 2. The removal corresponds to an actual edge in this cycle
   */
  export const validate = (props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    cycle: AutoBeInterfaceSchemaDecoupleCycle;
    removal: AutoBeInterfaceSchemaDecoupleRemoval;
    errors: IValidation.IError[];
    path: string;
  }): void => {
    const { removal } = props;
    const schema = props.schemas[removal.typeName];

    if (!schema) {
      props.errors.push({
        path: `${props.path}.removal.typeName`,
        expected: `one of the existing schema type names`,
        value: removal.typeName,
      });
      return;
    }
    if (!AutoBeOpenApiTypeChecker.isObject(schema)) {
      props.errors.push({
        path: `${props.path}.removal.typeName`,
        expected: "an object schema type name",
        value: removal.typeName,
      });
      return;
    }
    if (!(removal.propertyName in schema.properties)) {
      const validProps = Object.keys(schema.properties).join(", ");
      props.errors.push({
        path: `${props.path}.removal.propertyName`,
        expected: `one of [${validProps}]`,
        value: removal.propertyName,
      });
      return;
    }

    // Check the removal corresponds to an actual edge in this cycle
    const isEdge = props.cycle.edges.some(
      (edge) =>
        edge.sourceType === removal.typeName &&
        edge.propertyName === removal.propertyName,
    );
    if (!isEdge)
      props.errors.push({
        path: `${props.path}.removal`,
        expected:
          "a removal that matches a cycle edge (sourceType.propertyName)",
        value: `${removal.typeName}.${removal.propertyName}`,
      });
  };

  // ---------------------------------------------------------------
  // INTERNAL: Graph Construction
  // ---------------------------------------------------------------

  const buildGraph = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchema>,
  ): Map<string, AutoBeInterfaceSchemaDecoupleEdge[]> => {
    const graph = new Map<string, AutoBeInterfaceSchemaDecoupleEdge[]>();

    for (const [typeName, schema] of Object.entries(schemas)) {
      if (!AutoBeOpenApiTypeChecker.isObject(schema)) continue;

      const edges: AutoBeInterfaceSchemaDecoupleEdge[] = [];
      for (const [propName, propSchema] of Object.entries(schema.properties))
        collectRefs(propSchema, typeName, propName, edges);

      // collectRefs already excludes self-references
      if (edges.length > 0) graph.set(typeName, edges);
    }

    return graph;
  };

  /**
   * Recursively collect $ref targets from a property schema. Handles direct
   * references, arrays of references, and nullable references.
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

    for (const node of allNodes) if (!indices.has(node)) strongconnect(node);

    // Only return SCCs with 2+ nodes (actual cross-type cycles)
    return sccs.filter((scc) => scc.length > 1);
  };
}
