import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { HashMap } from "tstl";

export const getPrerequisites = (props: {
  document: AutoBeOpenApi.IDocument;
  endpoint: AutoBeOpenApi.IEndpoint;
}): AutoBeOpenApi.IPrerequisite[] => {
  const visited: Set<string> = new Set<string>();
  const result: HashMap<
    AutoBeOpenApi.IEndpoint,
    AutoBeOpenApi.IPrerequisite[]
  > = new HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IPrerequisite[]>(
    AutoBeOpenApiEndpointComparator.hashCode,
    AutoBeOpenApiEndpointComparator.equals,
  );

  const traverse = (endpoint: AutoBeOpenApi.IEndpoint): void => {
    const key = `${endpoint.method}:${endpoint.path}`;

    // prevent circular structure: skip visited endpoint
    if (visited.has(key)) return;
    visited.add(key);

    const operation: AutoBeOpenApi.IOperation | undefined =
      props.document.operations.find(
        (op) => op.method === endpoint.method && op.path === endpoint.path,
      );

    if (operation === undefined) return;

    // add current operation's prerequisites
    for (const prerequisite of operation.prerequisites) {
      // check if already in result to avoid duplicates
      const exists: boolean = result.has(prerequisite.endpoint);

      if (!exists) {
        result.set(prerequisite.endpoint, [prerequisite]);
      }

      // recursively traverse prerequisite's prerequisites
      traverse(prerequisite.endpoint);
    }
  };

  traverse(props.endpoint);
  return result
    .toJSON()
    .map((it) => it.second)
    .flat();
};
