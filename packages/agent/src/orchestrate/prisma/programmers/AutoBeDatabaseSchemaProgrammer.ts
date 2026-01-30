import { AutoBeDatabase } from "@autobe/interface";
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
    models: AutoBeDatabase.IModel[];
  }): void => {
    for (const m of props.models) AutoBeDatabaseModelProgrammer.emend(m);
    // for (let i: number = props.models.length - 1; i >= 0; i--) {
    //   const name: string = props.models[i]!.name;
    //   if (props.otherTables.includes(name) === true) props.models.splice(i, 1);
    // }

    const prefix: string = `${singular(props.targetTable)}_`;
    props.models.forEach((model, i) => {
      if (
        model.name !== props.targetTable &&
        model.name.startsWith(prefix) === false
      )
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: `"${props.targetTable}" | \`${prefix}\${string}\``,
          value: model.name,
          description: StringUtil.trim`
            Model name "${model.name}" violates the child table naming
            convention for target table "${props.targetTable}".

            Every model must be either the target table itself
            ("${props.targetTable}") or a 1NF child table whose name
            starts with the singular prefix "${prefix}"
            (e.g., "${prefix}items", "${prefix}details").

            Fix: Rename "${model.name}" to "${props.targetTable}" or
            to a name starting with "${prefix}".
          `,
        });
    });
    if (props.models.find((m) => m.name === props.targetTable) === undefined)
      props.errors.push({
        path: props.path,
        expected: `A model named "${props.targetTable}"`,
        value: props.models,
        description: StringUtil.trim`
          The target table "${props.targetTable}" is missing from the
          models array.

          Your assignment is to design "${props.targetTable}". Child
          tables (prefixed with "${prefix}") are optional for 1NF
          decomposition, but the target table itself is mandatory — it
          is the primary deliverable.

          Fix: Add a model named exactly "${props.targetTable}" to the
          models array.
        `,
      });
  };
}
