import { AutoBeDatabaseComponent } from "@autobe/interface";

export const removeDuplicatedTable = (
  components: AutoBeDatabaseComponent[],
): AutoBeDatabaseComponent[] => {
  const tableSet: Set<string> = new Set(
    components.flatMap((c) => c.tables.map((t) => t.name)),
  );
  const sorted: AutoBeDatabaseComponent[] = [...components].sort((a, b) => {
    return a.tables.length - b.tables.length;
  });
  return sorted.map((c) => ({
    ...c,
    tables: c.tables.filter((t) => {
      if (tableSet.has(t.name) === false) return false;
      tableSet.delete(t.name);
      return true;
    }),
  }));
};
