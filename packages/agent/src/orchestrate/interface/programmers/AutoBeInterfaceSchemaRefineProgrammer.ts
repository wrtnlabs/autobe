import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyDepict,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyRefine,
  AutoBeInterfaceSchemaPropertyUpdate,
  AutoBeOpenApi,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { AutoBeJsonSchemaFactory } from "../utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";

export namespace AutoBeInterfaceSchemaRefineProgrammer {
  export const fixApplication = (props: {
    application: ILlmApplication;
    typeName: string;
    everyModels: AutoBeDatabase.IModel[];
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
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

  export const validate = (
    ctx: AutoBeContext,
    props: {
      typeName: string;
      schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
      refines: AutoBeInterfaceSchemaPropertyRefine[];
      path: string;
      errors: IValidation.IError[];
    },
  ): void => {
    props.refines.forEach((refine, i) => {
      if (
        refine.type !== "create" &&
        props.schema.properties[refine.key] === undefined
      )
        props.errors.push({
          path: `${props.path}.refines[${i}].key`,
          expected: Object.keys(props.schema.properties)
            .map((s) => JSON.stringify(s))
            .join(" | "),
          value: refine.key,
          description: StringUtil.trim`
          Property ${JSON.stringify(refine.key)} does not exist in schema.

          To ${refine.type} a property, it must exist in the object type.
        `,
        });
      if (refine.type === "create" || refine.type === "update")
        AutoBeJsonSchemaValidator.validateSchema({
          typeName: props.typeName,
          schema: refine.schema,
          operations: [],
          path: `${props.path}.refines[${i}].schema`,
          errors: props.errors,
          models: ctx
            .state()
            .database!.result.data.files.flatMap((f) => f.models),
        });
    });
  };

  export const refine = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    databaseSchema: string | null;
    specification: string;
    description: string;
    refines: AutoBeInterfaceSchemaPropertyRefine[];
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

    for (const refine of props.refines)
      if (refine.type === "depict") {
        // Add documentation to existing property
        result.properties[refine.key] = {
          ...props.schema.properties[refine.key],
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
