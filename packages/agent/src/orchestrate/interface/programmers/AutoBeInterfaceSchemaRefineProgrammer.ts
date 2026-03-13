import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyDepict,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRefine,
  AutoBeInterfaceSchemaPropertyUpdate,
  AutoBeOpenApi,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";

import { AutoBeJsonSchemaFactory } from "../utils/AutoBeJsonSchemaFactory";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaPropertyReviseProgrammer } from "./AutoBeInterfaceSchemaPropertyReviseProgrammer";

export namespace AutoBeInterfaceSchemaRefineProgrammer {
  export const fixApplication = (props: {
    application: ILlmApplication;
    typeName: string;
    everyModels: AutoBeDatabase.IModel[];
    schema: AutoBeOpenApi.IJsonSchema.IObject;
  }): void => {
    AutoBeInterfaceSchemaProgrammer.fixApplication({
      application: props.application,
      everyModels: props.everyModels,
    });

    const $defs = props.application.functions[0].parameters.$defs;
    const fix = (next: ILlmSchema | undefined): void => {
      if (next === undefined) return;
      else if (LlmTypeChecker.isObject(next) === false) return;

      const key: ILlmSchema | undefined = next.properties.key;
      if (key === undefined || LlmTypeChecker.isString(key) === false) return;
      key.enum = Object.keys(props.schema.properties);
    };
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyDepict>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyUpdate>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyErase>()]);
  };

  export const validate = (props: {
    // common
    path: string;
    errors: IValidation.IError[];
    everyModels: AutoBeDatabase.IModel[];
    // schema
    typeName: string;
    databaseSchema: string | null;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    // refines
    excludes: AutoBeInterfaceSchemaPropertyExclude[];
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }): void => {
    // validate database schema existence
    if (
      props.databaseSchema !== null &&
      props.everyModels.find((m) => m.name === props.databaseSchema) ===
        undefined
    )
      props.errors.push({
        path: `${props.path}.databaseSchema`,
        expected: props.everyModels
          .map((m) => JSON.stringify(m.name))
          .join(" | "),
        value: props.databaseSchema,
        description: StringUtil.trim`
          You've referenced a non-existing database schema name
          ${JSON.stringify(props.databaseSchema)} in "databaseSchema" 
          property. Make sure that the referenced database schema name 
          exists in your database schema files.

          Never assume non-existing models. This is not recommendation,
          but an instruction you must follow. Never repeat the same
          value again. You have to choose one of below:

          **Option 1: Reference an existing database schema**
          ${props.everyModels.map((m) => `- ${m.name}`).join("\n")}

          **Option 2: Set to null (for DTOs with no database reference)**
          If this DTO represents pure computed/statistical data or logic-only
          structures that have no direct relationship to any database table,
          set "databaseSchema" to null. In this case, all properties in the
          object type must also have 
          "AutoBeInterfaceSchemaPropertyRefine.databaseSchemaProperty" 
          (except "AutoBeInterfaceSchemaPropertyErase" type) set to null.
        `,
      });

    // validate refines detaily
    AutoBeInterfaceSchemaPropertyReviseProgrammer.validate({
      // config
      path: props.path,
      errors: props.errors,
      unionTypeName: typia.reflect.name<AutoBeInterfaceSchemaPropertyRefine>(),
      noModelDescription: StringUtil.trim`
        You have defined "databaseSchemaProperty" property referencing 
        a database schema property, but its parent schema (object type) 
        does not reference any database schema.

        To reference a database schema property, you have to configure
        "IAutoBeInterfaceSchemaRefineApplication.IComplete.databaseSchema"
        property with a valid database schema name.

        If not, set this "databaseSchemaProperty" property to null value
        at the next time, and then depict what this property is for
        in the "specification" property.

        Note that, this is not a recommendation, 
        but an instruction you must obey.
      `,
      // database
      everyModels: props.everyModels,
      model:
        props.databaseSchema !== null
          ? (props.everyModels.find((m) => m.name === props.databaseSchema) ??
            null)
          : null,
      // interface
      typeName: props.typeName,
      schema: props.schema,
      revises: props.revises,
      excludes: props.excludes,
    });
  };

  export const execute = (props: {
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    databaseSchema: string | null;
    specification: string;
    description: string;
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => {
    const result: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = {
      ...props.schema,
      "x-autobe-database-schema": props.databaseSchema,
      "x-autobe-specification": props.specification,
      description: props.description,
      properties: {},
      required: [],
    };
    const setRequired = (key: string): void => {
      if (result.required.includes(key) === false) result.required.push(key);
    };

    for (const refine of props.revises)
      if (refine.type === "depict") {
        // Add documentation to existing property
        result.properties[refine.key] = {
          ...(props.schema.properties[
            refine.key
          ] as AutoBeOpenApi.IJsonSchemaProperty),
          description: refine.description,
          "x-autobe-database-schema-property": refine.databaseSchemaProperty,
          "x-autobe-specification": refine.specification,
        };
        if (props.schema.required.includes(refine.key)) setRequired(refine.key);
      } else if (refine.type === "create") {
        // Create new property with documentation
        result.properties[refine.key] = {
          ...AutoBeJsonSchemaFactory.fixSchema(refine.schema),
          description: refine.description,
          "x-autobe-specification": refine.specification,
          "x-autobe-database-schema-property": refine.databaseSchemaProperty,
        };
        if (refine.required) setRequired(refine.key);
      } else if (refine.type === "update") {
        // Update existing property type and documentation
        const newKey: string = refine.newKey ?? refine.key;
        result.properties[newKey] = {
          ...AutoBeJsonSchemaFactory.fixSchema(refine.schema),
          description: refine.description,
          "x-autobe-specification": refine.specification,
          "x-autobe-database-schema-property": refine.databaseSchemaProperty,
        };
        if (refine.required) setRequired(newKey);
      } else if (refine.type === "erase") continue;
      else refine satisfies never;
    return result;
  };
}
