import { AutoBeDatabaseComponent } from "@autobe/interface";
import { Pair } from "tstl";

export const removeDuplicatedTable = (
  components: AutoBeDatabaseComponent[],
): AutoBeDatabaseComponent[] => {
  const tableSet: Set<string> = new Set(
    components.flatMap((c) => c.tables.map((t) => t.name)),
  );
  const sorted: Pair<AutoBeDatabaseComponent, number>[] = components
    .map((c, i) => new Pair(c, i))
    .sort((a, b) => a.first.tables.length - b.first.tables.length);
  return sorted
    .map(
      (p) =>
        new Pair(
          {
            ...p.first,
            tables: p.first.tables.filter((t) => {
              if (tableSet.has(t.name) === false) return false;
              tableSet.delete(t.name);
              return true;
            }),
          },
          p.second,
        ),
    )
    .sort((a, b) => a.second - b.second)
    .map((p) => p.first)
    .filter((c) => c.tables.length !== 0);
};
