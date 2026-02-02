import {
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseSchemaDefinition,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { singular } from "pluralize";
import { IValidation } from "typia";

import { AutoBeDatabaseModelProgrammer } from "./AutoBeDatabaseModelProgrammer";

export namespace AutoBeDatabaseSchemaProgrammer {
  export const validate = (props: {
    path: string;
    errors: IValidation.IError[];
    targetTable: string;
    otherTables: string[];
    definition: AutoBeDatabaseSchemaDefinition;
  }): void => {
    // emend and fix table names
    AutoBeDatabaseModelProgrammer.emend(props.definition.model);
    for (const design of props.definition.newDesigns)
      design.name = AutoBeDatabaseModelProgrammer.fixName(design.name);

    // remove wrong named designs
    for (let i: number = props.definition.newDesigns.length - 1; i >= 0; i--) {
      const design: AutoBeDatabaseComponentTableDesign =
        props.definition.newDesigns[i]!;
      if (props.otherTables.includes(design.name) === false) {
        // to give validation feedback
        continue;
      } else if (
        design.name.startsWith(singular(props.definition.model.name))
      ) {
        // correct and intended name
        continue;
      }
      props.definition.newDesigns.splice(i, 1);
    }

    // check whether target table exists
    if (props.targetTable !== props.definition.model.name)
      props.errors.push({
        path: `${props.path}.model.name`,
        expected: `"${props.targetTable}"`,
        value: props.definition.model.name,
        description: StringUtil.trim`
          The model must be named exactly "${props.targetTable}",
          which is the target table assigned to this agent.

          Fix: Rename the model to "${props.targetTable}".
        `,
      });

    const prefix: string = `${singular(props.targetTable)}_`;
    props.definition.newDesigns.forEach((design, i) => {
      if (design.name.startsWith(prefix) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `"${props.targetTable}" | \`${prefix}\${string}\``,
          value: design.name,
          description: StringUtil.trim`
            New design "${design.name}" violates the naming convention.

            Every newDesigns entry must be a 1NF child table whose name
            starts with the singular prefix "${prefix}"
            (e.g., "${prefix}items", "${prefix}details").

            Reconsider whether "${design.name}" is truly needed, or
            rename it to start with "${prefix}" if it belongs to
            this target table.
          `,
        });
      else if (props.otherTables.includes(design.name) === true)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `A name not colliding with neighboring tables`,
          value: design.name,
          description: StringUtil.trim`
            New design "${design.name}" collides with a table that
            already exists or is assigned to another agent.

            Tables you must not collide with:
            ${props.otherTables.map((t) => `- ${t}`).join("\n")}

            Reconsider whether this new design is necessary, or
            choose a different name with the "${prefix}" prefix
            that does not overlap with any of the above tables.
          `,
        });
    });
  };
}
