import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyRevise,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";

export namespace AutoBeInterfaceSchemaPropertyReviseProgrammer {
  export const validate = (props: {
    path: string;
    errors: IValidation.IError[];
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
    revise: AutoBeInterfaceSchemaPropertyRevise;
    noModelDescription: string;
  }): void => {
    if (!("databaseSchemaProperty" in props.revise)) return;

    const value: string | null = props.revise.databaseSchemaProperty;
    if (value === null) return;

    if (props.model === null)
      props.errors.push({
        path: `${props.path}.databaseSchemaProperty`,
        expected: "null",
        value,
        description: props.noModelDescription,
      });
    else {
      const databaseProperties: AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember[] =
        AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
          everyModels: [props.model],
          model: props.model,
        });
      const found:
        | AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember
        | undefined = databaseProperties.find((p) => p.key === value);
      if (found === undefined)
        props.errors.push({
          path: `${props.path}.databaseSchemaProperty`,
          expected: databaseProperties
            .map((p) => JSON.stringify(p.key))
            .join(" | "),
          value,
          description: StringUtil.trim`
            You have defined "databaseSchemaProperty" property with value
            ${JSON.stringify(value)} that does not match any property (column or relation)
            in the database schema "${props.model.name}".

            Available properties in "${props.model.name}" are:
            ${databaseProperties.map((dp) => `- ${dp.key}`).join("\n")}

            Choose one of the following actions:
            1. If you made a typo and a similar property exists above, correct it
            2. If this property is computed (not from DB), set the value to null
            3. If no similar property exists above, delete this property entirely
              from the schema - the property itself should not exist

            The database schema is the source of truth. If the column you expected
            does not exist, the property design is incorrect. Do not insist on
            non-existent columns or keep trying different names hoping one works.

            Note that, this is not a recommendation, but an instruction you must follow.
          `,
        });
    }
  };
}
