import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseDeduplicationEvent,
  AutoBeDatabaseDeduplicationGroup,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { Pair } from "tstl";
import { IValidation } from "typia";

export namespace AutoBeDatabaseDeduplicationProgrammer {
  /** Validate duplicate groups reported by the agent. */
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    target: AutoBeDatabaseComponent;
    otherComponents: Pick<AutoBeDatabaseComponent, "namespace" | "tables">[];
    duplicateGroups: AutoBeDatabaseDeduplicationGroup[];
  }): void => {
    // Combine target + otherComponents for validation
    const allComponents: Pick<
      AutoBeDatabaseComponent,
      "namespace" | "tables"
    >[] = [props.target, ...props.otherComponents];

    props.duplicateGroups.forEach((group, i) => {
      // Each group must have at least 2 tables
      if (group.tables.length < 2)
        props.errors.push({
          path: `${props.path}[${i}].tables`,
          expected: "at least 2 tables per group",
          value: group.tables.length,
          description: StringUtil.trim`
            Duplicate group must contain at least 2 tables to be meaningful.

            Fix: Add more tables to this group, or remove the group entirely
            if there are no actual duplicates.
          `,
        });

      // Each table must exist in actual components
      group.tables.forEach((table, j) => {
        const component:
          | Pick<AutoBeDatabaseComponent, "namespace" | "tables">
          | undefined = allComponents.find(
          (c) => c.namespace === table.namespace,
        );
        if (component === undefined)
          props.errors.push({
            path: `${props.path}[${i}].tables[${j}].namespace`,
            expected: "existing component namespace",
            value: table.namespace,
            description: StringUtil.trim`
              Component namespace "${table.namespace}" does not exist.

              Fix: Use one of the existing component namespaces:
              - ${allComponents.map((c) => c.namespace).join(", ")}
            `,
          });
        else if (component.tables.some((t) => t.name === table.name) === false)
          props.errors.push({
            path: `${props.path}[${i}].tables[${j}].name`,
            expected: `existing table in "${table.namespace}" component`,
            value: table.name,
            description: StringUtil.trim`
              Table "${table.name}" does not exist in component "${table.namespace}".

              Fix: Use one of the existing tables:
              - ${component.tables.map((t) => t.name).join(", ")}
            `,
          });
      });

      // Each group must include at least 1 table from target component
      const hasTargetTable = group.tables.some(
        (t) => t.namespace === props.target.namespace,
      );
      if (!hasTargetTable)
        props.errors.push({
          path: `${props.path}[${i}].tables`,
          expected: `at least 1 table from target component "${props.target.namespace}"`,
          value: group.tables.map((t) => t.namespace),
          description: StringUtil.trim`
            This agent is responsible for finding duplicates in component
            "${props.target.namespace}", but this group contains no tables
            from that component.

            Fix: Include at least one table from "${props.target.namespace}"
            in this duplicate group.
          `,
        });
    });
  };
  /**
   * Resolve semantic duplicate groups by deterministically keeping the table
   * from the component with the fewest total tables.
   */
  export const resolve = (
    components: AutoBeDatabaseComponent[],
    events: AutoBeDatabaseDeduplicationEvent[],
  ): AutoBeDatabaseComponent[] => {
    console.log("\n");
    console.log(
      "╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     AutoBeDatabaseDeduplicationProgrammer.resolve() START    ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝",
    );
    console.log(`[Resolve] Input components: ${components.length}`);
    console.log(`[Resolve] Input events: ${events.length}`);

    // 1. Collect all duplicate groups from events
    const duplicatedGroups: AutoBeDatabaseDeduplicationGroup[] = events.flatMap(
      (e) => e.duplicateGroups,
    );

    console.log(
      `[Resolve] Total duplicate groups collected: ${duplicatedGroups.length}`,
    );
    events.forEach((event, i) => {
      console.log(
        `[Resolve]   Event[${i}] from "${event.namespace}": ${event.duplicateGroups.length} groups`,
      );
    });

    if (duplicatedGroups.length === 0) {
      console.log(
        "[Resolve] No duplicate groups found. Returning original components.",
      );
      console.log(
        "╔══════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║     AutoBeDatabaseDeduplicationProgrammer.resolve() END      ║",
      );
      console.log(
        "╚══════════════════════════════════════════════════════════════╝\n",
      );
      return components;
    }

    // 2. Merge overlapping groups into clusters using Union-Find
    const clusters: AutoBeDatabaseDeduplicationGroup.ITable[][] =
      mergeGroups(duplicatedGroups);

    // 3. Remove duplicates, keeping table from smallest component
    const result = removeDuplicates(components, clusters);

    console.log("\n[Resolve] Summary:");
    console.log(
      `[Resolve]   Input tables: ${components.reduce((sum, c) => sum + c.tables.length, 0)}`,
    );
    console.log(
      `[Resolve]   Output tables: ${result.reduce((sum, c) => sum + c.tables.length, 0)}`,
    );
    console.log(
      `[Resolve]   Removed tables: ${components.reduce((sum, c) => sum + c.tables.length, 0) - result.reduce((sum, c) => sum + c.tables.length, 0)}`,
    );
    console.log(
      "╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     AutoBeDatabaseDeduplicationProgrammer.resolve() END      ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n",
    );

    return result;
  };

  /**
   * Merge overlapping duplicate groups into clusters using Union-Find.
   *
   * If group1 = [A, B] and group2 = [B, C], they merge into one cluster [A, B,
   * C].
   *
   * @returns Array of clusters, where each cluster is a set of duplicate
   *   tables.
   */
  const mergeGroups = (
    groups: AutoBeDatabaseDeduplicationGroup[],
  ): AutoBeDatabaseDeduplicationGroup.ITable[][] => {
    console.log("\n========== [Union-Find] mergeGroups START ==========");
    console.log(`[Union-Find] Input groups count: ${groups.length}`);
    groups.forEach((group, i) => {
      console.log(
        `[Union-Find] Group[${i}]: ${group.tables.map((t) => `${t.namespace}::${t.name}`).join(" = ")}`,
      );
      console.log(`[Union-Find]   Reason: ${group.reason}`);
    });

    // Build table key → index mapping
    const tableKeys: string[] = [];
    const tableKeyToIndex: Map<string, number> = new Map<string, number>();

    const getOrCreateIndex = (namespace: string, name: string): number => {
      const key: string = `${namespace}::${name}`;
      let index: number | undefined = tableKeyToIndex.get(key);
      if (index === undefined) {
        index = tableKeys.length;
        tableKeys.push(key);
        tableKeyToIndex.set(key, index);
        console.log(`[Union-Find] Register table: ${key} → index ${index}`);
      }
      return index;
    };

    // Register all tables
    for (const group of groups) {
      for (const table of group.tables) {
        getOrCreateIndex(table.namespace, table.name);
      }
    }

    console.log(`\n[Union-Find] Total unique tables: ${tableKeys.length}`);
    console.log(`[Union-Find] Table keys: [${tableKeys.join(", ")}]`);

    // Union-Find: each table starts as its own parent
    const parent: number[] = tableKeys.map((_, i) => i);
    const rank: number[] = tableKeys.map(() => 0);

    const find = (x: number): number => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]]; // path compression
        x = parent[x];
      }
      return x;
    };

    const union = (a: number, b: number): void => {
      const rootA: number = find(a);
      const rootB: number = find(b);
      if (rootA === rootB) {
        console.log(
          `[Union-Find] Union(${tableKeys[a]}, ${tableKeys[b]}): Already in same set (root=${tableKeys[rootA]})`,
        );
        return;
      }

      // Union by rank: attach smaller tree under larger tree
      if (rank[rootA] < rank[rootB]) {
        parent[rootA] = rootB;
        console.log(
          `[Union-Find] Union(${tableKeys[a]}, ${tableKeys[b]}): Merged ${tableKeys[rootA]} → ${tableKeys[rootB]} (rank)`,
        );
      } else if (rank[rootA] > rank[rootB]) {
        parent[rootB] = rootA;
        console.log(
          `[Union-Find] Union(${tableKeys[a]}, ${tableKeys[b]}): Merged ${tableKeys[rootB]} → ${tableKeys[rootA]} (rank)`,
        );
      } else {
        parent[rootB] = rootA;
        rank[rootA]++;
        console.log(
          `[Union-Find] Union(${tableKeys[a]}, ${tableKeys[b]}): Merged ${tableKeys[rootB]} → ${tableKeys[rootA]} (tie, rank++)`,
        );
      }
    };

    // Union all tables within each group
    console.log("\n[Union-Find] Processing union operations...");
    for (const group of groups) {
      if (group.tables.length < 2) continue;
      const firstIndex: number = getOrCreateIndex(
        group.tables[0].namespace,
        group.tables[0].name,
      );
      for (let i = 1; i < group.tables.length; i++) {
        const idx: number = getOrCreateIndex(
          group.tables[i].namespace,
          group.tables[i].name,
        );
        union(firstIndex, idx);
      }
    }

    // Log parent array state
    console.log("\n[Union-Find] Final parent array:");
    tableKeys.forEach((key, i) => {
      const root = find(i);
      console.log(
        `[Union-Find]   ${key} (idx=${i}) → root=${tableKeys[root]} (idx=${root})`,
      );
    });

    // Group tables by their root → clusters
    const clusterMap = new Map<
      number,
      AutoBeDatabaseDeduplicationGroup.ITable[]
    >();
    for (const [key, index] of tableKeyToIndex) {
      const root: number = find(index);
      let cluster = clusterMap.get(root);
      if (cluster === undefined) {
        cluster = [];
        clusterMap.set(root, cluster);
      }
      const [namespace, name] = key.split("::");
      cluster.push({ namespace: namespace!, name: name! });
    }

    const result = [...clusterMap.values()];

    // Log final clusters
    console.log("\n[Union-Find] Final clusters:");
    result.forEach((cluster, i) => {
      console.log(
        `[Union-Find]   Cluster[${i}]: ${cluster.map((t) => `${t.namespace}::${t.name}`).join(", ")}`,
      );
    });
    console.log("========== [Union-Find] mergeGroups END ==========\n");

    return result;
  };

  /**
   * Remove duplicate tables from components, keeping one per cluster.
   *
   * Rule: Keep the table from the component with fewest total tables.
   * Tie-break: Keep the table from the component that appears first.
   *
   * Algorithm (similar to removeDuplicatedTable):
   *
   * 1. Build tableKey → clusterId mapping
   * 2. Sort components by table count (ascending)
   * 3. Traverse and keep first table encountered per cluster
   * 4. Restore original order
   */
  const removeDuplicates = (
    components: AutoBeDatabaseComponent[],
    clusters: AutoBeDatabaseDeduplicationGroup.ITable[][],
  ): AutoBeDatabaseComponent[] => {
    console.log("\n========== [Dedup] removeDuplicates START ==========");
    console.log(`[Dedup] Input components: ${components.length}`);
    components.forEach((c) => {
      console.log(
        `[Dedup]   ${c.namespace}: [${c.tables.map((t) => t.name).join(", ")}] (${c.tables.length} tables)`,
      );
    });
    console.log(`[Dedup] Input clusters: ${clusters.length}`);

    // Build tableKey → clusterId mapping
    const tableToCluster: Map<string, number> = new Map<string, number>();
    clusters.forEach((cluster, clusterId) => {
      for (const table of cluster) {
        tableToCluster.set(`${table.namespace}::${table.name}`, clusterId);
      }
    });

    console.log("\n[Dedup] Table to Cluster mapping:");
    for (const [key, clusterId] of tableToCluster) {
      console.log(`[Dedup]   ${key} → Cluster[${clusterId}]`);
    }

    // Track which clusters already have a kept table
    const clusterSet: Set<number> = new Set<number>();
    const keptTables: Map<number, string> = new Map<number, string>(); // For logging

    // Sort by table count (smallest first), keep original index
    const sorted: Pair<AutoBeDatabaseComponent, number>[] = components
      .map((c, i) => new Pair(c, i))
      .sort((a, b) => a.first.tables.length - b.first.tables.length);

    console.log("\n[Dedup] Processing order (sorted by table count):");
    sorted.forEach((p, i) => {
      console.log(
        `[Dedup]   ${i + 1}. ${p.first.namespace} (${p.first.tables.length} tables)`,
      );
    });

    // Filter tables: keep first encountered per cluster
    console.log("\n[Dedup] Processing tables...");
    const processed: Pair<AutoBeDatabaseComponent, number>[] = sorted.map(
      (p) =>
        new Pair(
          {
            ...p.first,
            tables: p.first.tables.filter((t) => {
              const key: string = `${p.first.namespace}::${t.name}`;
              const clusterId: number | undefined = tableToCluster.get(key);

              // Not in any cluster → keep
              if (clusterId === undefined) {
                console.log(`[Dedup]   KEEP ${key}: Not in any cluster`);
                return true;
              }

              // First in cluster → keep and mark
              if (!clusterSet.has(clusterId)) {
                clusterSet.add(clusterId);
                keptTables.set(clusterId, key);
                console.log(
                  `[Dedup]   KEEP ${key}: First in Cluster[${clusterId}]`,
                );
                return true;
              }

              // Already have one from this cluster → remove
              console.log(
                `[Dedup]   REMOVE ${key}: Cluster[${clusterId}] already has ${keptTables.get(clusterId)}`,
              );
              return false;
            }),
          },
          p.second,
        ),
    );

    // Restore original order and filter empty components
    const result = processed
      .sort((a, b) => a.second - b.second)
      .map((p) => p.first)
      .filter((c) => c.tables.length > 0);

    console.log("\n[Dedup] Final result:");
    result.forEach((c) => {
      console.log(
        `[Dedup]   ${c.namespace}: [${c.tables.map((t) => t.name).join(", ")}] (${c.tables.length} tables)`,
      );
    });
    console.log("========== [Dedup] removeDuplicates END ==========\n");

    return result;
  };
}
