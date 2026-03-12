import {
  AutoBeAnalyze,
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
    actors: AutoBeAnalyze.IActor[];
    tables: AutoBeDatabaseComponentTableDesign[];
  }): void => {
    // validate common logic
    AutoBeDatabaseComponentProgrammer.validate(props);

    // Validation: all tables must contain actor name
    const prefix: string = props.prefix ? `${props.prefix}_` : "";
    const actorNames: string[] = props.actors.map(
      (actor) => prefix + NamingConvention.snake(actor.name),
    );
    props.tables.forEach((table, i) => {
      if (actorNames.some((an) => table.name.startsWith(an)) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `\`\${${actorNames.map((s) => JSON.stringify(s)).join(" | ")}}\${string}\``,
          value: table.name,
          description: StringUtil.trim`
            Table "${table.name}" does not start with none of below:

            ${actorNames.map((an) => `- "${an}"`).join("\n")}

            Fix: Add one of above to the table name, or remove this table
            if it is unrelated to some actor.
          `,
        });
    });

    for (const actor of props.actors) {
      // Validation: actor table must exist
      const name: string = NamingConvention.snake(actor.name);
      const tableNames: string[] = props.tables.map((t) => t.name);
      const expectedActorTable: string = `${prefix}${plural(name)}`;
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
            serves as the main "${actor.name}" actor entity.
          `,
        });

      // Validation: session table must exist
      const expectedSessionTable: string = `${prefix}${name}_sessions`;
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
            session management of "${actor.name}" actor.
          `,
        });
    }
  };
}
