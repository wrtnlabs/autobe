import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyCreate,
  AutoBeInterfaceSchemaPropertyDepict,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyKeep,
  AutoBeInterfaceSchemaPropertyNullish,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaPropertyUpdate,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";

import { AutoBeJsonSchemaFactory } from "../utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";
import { AutoBeInterfaceSchemaPropertyReviseProgrammer } from "./AutoBeInterfaceSchemaPropertyReviseProgrammer";

export namespace AutoBeInterfaceSchemaReviewProgrammer {
  export const filter = (
    key: string,
    value: AutoBeOpenApi.IJsonSchema,
  ): boolean =>
    AutoBeJsonSchemaValidator.isPreset(key) === false &&
    AutoBeOpenApiTypeChecker.isObject(value);

  export const filterSecurity = (props: {
    document: AutoBeOpenApi.IDocument;
    typeName: string;
  }): boolean => {
    const symbols: string[] = ["IAuthorized", "IJoin", "ILogin"];
    return props.typeName.includes(".")
      ? symbols.some((s) => props.typeName.endsWith(`.${s}`))
      : symbols.some(
          (s) =>
            props.document.components.schemas[`${props.typeName}.${s}`] !==
            undefined,
        );
  };

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

    const model: AutoBeDatabase.IModel | undefined =
      props.schema["x-autobe-database-schema"] !== undefined
        ? props.everyModels.find(
            (m) => m.name === props.schema["x-autobe-database-schema"],
          )
        : undefined;

    const $defs = props.application.functions[0].parameters.$defs;
    const fix = (
      next: ILlmSchema | undefined,
      fixKey: boolean = true,
    ): void => {
      if (next === undefined) return;
      else if (LlmTypeChecker.isObject(next) === false) return;

      if (fixKey === true) {
        const key: ILlmSchema | undefined = next.properties.key;
        if (key === undefined || LlmTypeChecker.isString(key) === false) return;
        key.enum = Object.keys(props.schema.properties);
      }
      if (model !== undefined) {
        const key: ILlmSchema | undefined =
          next.properties.databaseSchemaProperty;
        if (key === undefined || LlmTypeChecker.isString(key) === false) return;
        key.enum = AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaProperties({
          everyModels: props.everyModels,
          model,
        }).map((p) => p.key);
      }
    };
    fix(
      $defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyCreate>()],
      false,
    );
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyErase>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyNullish>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyDepict>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyUpdate>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyKeep>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyExclude>()]);
  };

  export const validate = (props: {
    // common
    path: string;
    errors: IValidation.IError[];
    everyModels: AutoBeDatabase.IModel[];
    // special
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    excludes: AutoBeInterfaceSchemaPropertyExclude[];
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): void => {
    // validate revises detaily
    AutoBeInterfaceSchemaPropertyReviseProgrammer.validate({
      // config
      path: props.path,
      errors: props.errors,
      unionTypeName: typia.reflect.name<AutoBeInterfaceSchemaPropertyRevise>(),
      noModelDescription: StringUtil.trim`
        You have defined "databaseSchemaProperty" property referencing
        a database schema property, but its parent schema (object type)
        does not reference any database schema.

        To make it correct, you have to change the "databaseSchemaProperty"
        to be \`null\` at the next time, and then depict what this property 
        is for in the "specification" property.

        Note that, this is not a recommendation, but an instruction 
        you must obey. I repeat that, change the value to be \`null\`.
      `,
      // database
      everyModels: props.everyModels,
      model: props.schema["x-autobe-database-schema"]
        ? (props.everyModels.find(
            (m) => m.name === props.schema["x-autobe-database-schema"],
          ) ?? null)
        : null,
      // interface
      typeName: props.typeName,
      schema: props.schema,
      excludes: props.excludes,
      revises: props.revises,
    });
  };

  export const execute = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => {
    const result: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = {
      ...props.schema,
      properties: {},
      required: [],
    };
    const setRequired = (key: string): void => {
      if (result.required.includes(key) === false) result.required.push(key);
    };

    for (const revise of props.revises)
      if (revise.type === "create") {
        // create new property
        result.properties[revise.key] = {
          ...AutoBeJsonSchemaFactory.fixSchema(revise.schema),
          description: revise.description,
          "x-autobe-specification": revise.specification,
          "x-autobe-database-schema-property": revise.databaseSchemaProperty,
        };
        if (revise.required) setRequired(revise.key);
      } else if (revise.type === "update") {
        // update existing property
        const newKey: string = revise.newKey ?? revise.key;
        result.properties[newKey] = {
          ...AutoBeJsonSchemaFactory.fixSchema(revise.schema),
          description: revise.description,
          "x-autobe-specification": revise.specification,
          "x-autobe-database-schema-property": revise.databaseSchemaProperty,
        };
        if (revise.required === true) setRequired(newKey);
      } else if (revise.type === "keep") {
        // keep original property with updated databaseSchemaProperty
        result.properties[revise.key] = {
          ...JSON.parse(JSON.stringify(props.schema.properties[revise.key])),
          "x-autobe-database-schema-property": revise.databaseSchemaProperty,
        };
        if (props.schema.required.includes(revise.key)) setRequired(revise.key);
      } else if (revise.type === "nullish") {
        // change nullable or required status only
        nullish({
          schema: result,
          property: props.schema.properties[revise.key],
          revise: revise,
        });
      } else if (revise.type === "depict") {
        result.properties[revise.key] = {
          ...props.schema.properties[revise.key],
          description: revise.description,
          "x-autobe-database-schema-property": revise.databaseSchemaProperty,
          "x-autobe-specification": revise.specification,
        };
        if (props.schema.required.includes(revise.key)) setRequired(revise.key);
      } else if (revise.type === "erase") continue;
      else revise satisfies never;
    return result;
  };

  const nullish = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    property: AutoBeOpenApi.IJsonSchemaProperty;
    revise: AutoBeInterfaceSchemaPropertyNullish;
  }): void => {
    let cloned: AutoBeOpenApi.IJsonSchemaProperty = JSON.parse(
      JSON.stringify(props.property),
    );
    if (props.revise.nullable === true) {
      if (AutoBeOpenApiTypeChecker.isOneOf(cloned)) {
        if (
          cloned.oneOf.some((item) => AutoBeOpenApiTypeChecker.isNull(item)) ===
          false
        )
          cloned.oneOf.push({ type: "null" });
      } else if (AutoBeOpenApiTypeChecker.isNull(cloned) === false)
        cloned = {
          "x-autobe-database-schema-property":
            cloned["x-autobe-database-schema-property"],
          "x-autobe-specification": cloned["x-autobe-specification"],
          description: cloned.description,
          oneOf: [
            {
              ...cloned,
              ...{
                "x-autobe-specification": undefined,
                "x-autobe-database-schema-property": undefined,
                description: undefined,
              },
            },
            { type: "null" },
          ],
        };
    } else if (props.revise.nullable === false) {
      if (AutoBeOpenApiTypeChecker.isOneOf(cloned)) {
        cloned.oneOf = cloned.oneOf.filter(
          (value) => AutoBeOpenApiTypeChecker.isNull(value) === false,
        );
        if (cloned.oneOf.length === 1)
          cloned = {
            ...cloned.oneOf[0],
            "x-autobe-specification": cloned["x-autobe-specification"],
            "x-autobe-database-schema-property":
              cloned["x-autobe-database-schema-property"],
            description: cloned.description,
          };
      }
    }
    // Update databaseSchemaProperty
    cloned["x-autobe-database-schema-property"] =
      props.revise.databaseSchemaProperty;
    // Update description: null preserves existing, string replaces it
    if (props.revise.description !== null)
      cloned.description = props.revise.description;
    if (props.revise.specification !== null)
      cloned["x-autobe-specification"] = props.revise.specification;

    // do assign
    props.schema.properties[props.revise.key] = cloned;
    if (props.revise.required === true)
      props.schema.required.push(props.revise.key);
  };
}
