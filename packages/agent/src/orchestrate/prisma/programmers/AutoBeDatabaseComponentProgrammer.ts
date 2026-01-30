import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { plural } from "pluralize";
import { Pair } from "tstl";
import { IValidation } from "typia";

export namespace AutoBeDatabaseComponentProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    tables: AutoBeDatabaseComponentTableDesign[];
  }): void => {
    // pluralize table names in designs
    for (const design of props.tables) design.name = plural(design.name);
    if (props.prefix === null) return;

    // validate prefix
    const prefix: string = props.prefix + "_";
    props.tables.forEach((design, i) => {
      if (design.name.startsWith(prefix) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `${prefix}${design.name} | \`${prefix}\${string}\``,
          value: design.name,
          description: StringUtil.trim`
            Table "${design.name}" does not start with required prefix "${prefix}".

            Fix: Rename the table to "${prefix}${design.name}" or use appropriate
            prefix that matches the configured naming convention.
          `,
        });
    });
  };

  export const removeDuplicatedTable = (
    components: AutoBeDatabaseComponent[],
  ): AutoBeDatabaseComponent[] => {
    // 1. First, remove duplicates within each component
    const deduplicatedComponents: AutoBeDatabaseComponent[] = components.map(
      (c) => ({
        ...c,
        tables: c.tables.filter(
          (table, index, self) =>
            self.findIndex((t) => t.name === table.name) === index,
        ),
      }),
    );

    // 2. Then, remove duplicates across components
    const tableSet: Set<string> = new Set(
      deduplicatedComponents.flatMap((c) => c.tables.map((t) => t.name)),
    );
    const sorted: Pair<AutoBeDatabaseComponent, number>[] =
      deduplicatedComponents
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
