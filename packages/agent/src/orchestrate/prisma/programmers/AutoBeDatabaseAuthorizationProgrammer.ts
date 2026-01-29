import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { plural } from "pluralize";
import { IValidation } from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeDatabaseComponentProgrammer } from "./AutoBeDatabaseComponentProgrammer";

export namespace AutoBeDatabaseAuthorizationProgrammer {
  /** Validate authorization tables for an actor. */
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    actor: AutoBeAnalyzeActor;
    tables: AutoBeDatabaseComponentTableDesign[];
  }): void => {
    // validate common logic
    AutoBeDatabaseComponentProgrammer.validate(props);

    // Validation: all tables must contain actor name
    const actor: string = NamingConvention.snake(props.actor.name);
    const prefix: string = props.prefix ? `${props.prefix}_` : "";
    props.tables.forEach((table, i) => {
      if (table.name.includes(actor) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `\`${prefix}${actor}\`\${string}`,
          value: table.name,
          description: StringUtil.trim`
            Table "${table.name}" does not contain actor name "${prefix}${actor}".
            
            Fix: Add "${prefix}${actor}" to the table name, or remove this table
            if it is unrelated to "${props.actor.name}" actor.
          `,
        });
    });

    // Validation: actor table must exist
    const tableNames: string[] = props.tables.map((t) => t.name);
    const expectedActorTable: string = `${prefix}${plural(actor)}`;
    if (tableNames.includes(expectedActorTable) === false)
      props.errors.push({
        path: props.path,
        expected: StringUtil.trim`{
          name: ${JSON.stringify(expectedActorTable)};
          description: string;
        }`,
        value: undefined,
        description: StringUtil.trim`
          Missing required actor table "${expectedActorTable}".

          Fix: Add table "${expectedActorTable}", or rename the table that
          serves as the main "${props.actor.name}" actor entity.
        `,
      });

    // Validation: session table must exist
    const expectedSessionTable: string = `${prefix}${actor}_sessions`;
    if (tableNames.includes(expectedSessionTable) === false)
      props.errors.push({
        path: props.path,
        expected: StringUtil.trim`{
          name: ${JSON.stringify(expectedSessionTable)};
          description: string;
        }`,
        value: undefined,
        description: StringUtil.trim`
          Missing required session table "${expectedSessionTable}".

          Fix: Add table "${expectedSessionTable}" for authentication
          session management of "${props.actor.name}" actor.
        `,
      });
  };
}
