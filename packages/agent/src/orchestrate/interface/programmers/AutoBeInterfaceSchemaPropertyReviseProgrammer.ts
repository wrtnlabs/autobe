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
  }): void => {
    if (!("databaseSchemaProperty" in props.revise)) return;

    const value: string | null = props.revise.databaseSchemaProperty;
    if (props.model === null) {
      if (value !== null)
        props.errors.push({
          path: `${props.path}.databaseSchemaProperty`,
          expected: "null",
          value,
          description: StringUtil.trim`@todo`,
        });
    } else {
      const properties: AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember[] =
        AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
          everyModels: [props.model],
          model: props.model,
        });
      const found:
        | AutoBeInterfaceSchemaProgrammer.IDatabaseSchemaMember
        | undefined = properties.find((p) => p.key === value);
      if (found === undefined)
        props.errors.push({
          path: `${props.path}.databaseSchemaProperty`,
          expected: properties.map((p) => JSON.stringify(p.key)).join(" | "),
          value,
          description: StringUtil.trim`@todo`,
        });
    }
  };
}
