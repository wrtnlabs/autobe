import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { plural } from "pluralize";
import { IValidation } from "typia";

export namespace AutoBeDatabaseComponentReviewProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    revises: AutoBeDatabaseComponentTableRevise[];
    component: AutoBeDatabaseComponent;
  }): void => {
    // pluralize table names in revises
    for (const revise of props.revises)
      if (revise.type === "create" || revise.type === "erase")
        revise.table = plural(revise.table);
      else if (revise.type === "update") {
        revise.original = plural(revise.original);
        revise.updated = plural(revise.updated);
      } else revise satisfies never;

    // validate existence
    const predicateExistence = (next: {
      path: string;
      value: string;
    }): void => {
      if (props.component.tables.some((t) => t.name === next.value) === true)
        return;
      props.errors.push({
        path: next.path,
        expected: props.component.tables
          .map((t) => t.name)
          .map((s) => JSON.stringify(s))
          .join(" | "),
        value: next.value,
        description: StringUtil.trim`
          Table "${next.value}" does not exist in the component.

          Fix: Ensure that the table name is correct and exists within the
          component's defined tables.

          Here is the list of valid table names:
          ${props.component.tables.map((t) => `- ${t.name}`).join("\n")}
        `,
      });
    };
    props.revises.forEach((revise, i) => {
      if (revise.type === "update")
        predicateExistence({
          path: `${props.path}[${i}].original`,
          value: revise.original,
        });
      else if (revise.type === "erase")
        predicateExistence({
          path: `${props.path}[${i}].table`,
          value: revise.table,
        });
      else if (revise.type !== "create") revise satisfies never;
    });

    // validate prefix
    if (props.prefix === null) return;

    const prefix: string = props.prefix + "_";
    const predicatePrefix = (next: { path: string; value: string }): void => {
      if (next.value.startsWith(prefix) === true) return;
      props.errors.push({
        path: next.path,
        expected: `${prefix}${next.value} | \`${prefix}\${string}\``,
        value: next.value,
        description: StringUtil.trim`
          Table "${next.value}" does not start with required prefix "${prefix}".

          Fix: Rename the table to "${prefix}${next.value}" or use appropriate
          prefix that matches the configured naming convention.
        `,
      });
    };

    props.revises.forEach((revise, i) => {
      if (revise.type === "create")
        predicatePrefix({
          path: `${props.path}[${i}].table`,
          value: revise.table,
        });
      else if (revise.type === "update")
        predicatePrefix({
          path: `${props.path}[${i}].updated`,
          value: revise.updated,
        });
      else if (revise.type !== "erase") revise satisfies never;
    });
  };

  export const execute = (props: {
    component: AutoBeDatabaseComponent;
    revises: AutoBeDatabaseComponentTableRevise[];
  }): AutoBeDatabaseComponentTableDesign[] => {
    const map: Map<string, AutoBeDatabaseComponentTableDesign> = new Map(
      props.component.tables.map((t) => [t.name, t]),
    );
    for (const revise of props.revises)
      if (revise.type === "create")
        map.set(revise.table, {
          name: revise.table,
          description: revise.description,
        });
      else if (revise.type === "update") {
        map.delete(revise.original);
        map.set(revise.updated, {
          name: revise.updated,
          description: revise.description,
        });
      } else if (revise.type === "erase") map.delete(revise.table);
      else revise satisfies never;
    return Array.from(map.values());
  };
}
