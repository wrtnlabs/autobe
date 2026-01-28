import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { plural } from "pluralize";
import { IValidation } from "typia";

export namespace AutoBeDatabaseAuthorizationProgrammer {
  /** Validate authorization tables for an actor. */
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    actor: AutoBeAnalyzeActor;
    prefix: string | null;
    tables: AutoBeDatabaseComponentTableDesign[];
  }): void => {
    const actorLower: string = props.actor.name.toLowerCase();
    const prefix: string = props.prefix ? `${props.prefix}_` : "";
    const expectedTable: string = `${prefix}${plural(actorLower)}`;
    const tableNames: string[] = props.tables.map((t) => t.name.toLowerCase());

    // Validation: all tables must contain actor name
    props.tables.forEach((table, i) => {
      if (table.name.toLowerCase().includes(actorLower) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `table name containing "${actorLower}"`,
          value: table.name,
          description: StringUtil.trim`
            Table "${table.name}" does not contain actor name "${actorLower}".

            Fix: Add "${actorLower}" to the table name, or remove this table
            if it is unrelated to "${props.actor.name}" actor.
          `,
        });
    });

    // Validation: actor table must exist
    if (tableNames.includes(expectedTable) === false)
      props.errors.push({
        path: props.path,
        expected: `table named "${expectedTable}"`,
        value: tableNames,
        description: StringUtil.trim`
          Missing required actor table "${expectedTable}".

          Fix: Add table "${expectedTable}", or rename the table that
          serves as the main "${props.actor.name}" actor entity.
        `,
      });

    // Validation: session table must exist
    const expectedSessionTable: string = `${prefix}${actorLower}_sessions`;
    if (tableNames.includes(expectedSessionTable) === false)
      props.errors.push({
        path: props.path,
        expected: `table named "${expectedSessionTable}"`,
        value: tableNames,
        description: StringUtil.trim`
          Missing required session table "${expectedSessionTable}".

          Fix: Add table "${expectedSessionTable}" for authentication
          session management of "${props.actor.name}" actor.
        `,
      });
  };
}
