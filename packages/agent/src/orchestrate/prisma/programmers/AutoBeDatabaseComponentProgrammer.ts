import { AutoBeDatabaseComponent } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { Pair } from "tstl";
import { IValidation } from "typia";

export namespace AutoBeDatabaseComponentProgrammer {
  export const validatePrefix = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    tableNames: string[];
  }): void => {
    if (props.prefix === null) return;

    const prefix = props.prefix + "_";
    props.tableNames.forEach((name, i) => {
      if (!name.startsWith(prefix)) {
        props.errors.push({
          path: `${props.path}[${i}]`,
          expected: `table name starting with "${prefix}"`,
          value: name,
          description: StringUtil.trim`
            Table "${name}" does not start with required prefix "${prefix}".

            Fix: Rename the table to "${prefix}${name}" or use appropriate
            prefix that matches the configured naming convention.
          `,
        });
      }
    });
  };

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
}
