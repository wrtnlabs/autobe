import {
  AutoBeDatabase,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyKeep,
  AutoBeInterfaceSchemaPropertyNullish,
  AutoBeInterfaceSchemaPropertyRevise,
  AutoBeInterfaceSchemaPropertyUpdate,
  AutoBeOpenApi,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { AutoBeJsonSchemaFactory } from "../utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";
import { AutoBeInterfaceSchemaProgrammer } from "./AutoBeInterfaceSchemaProgrammer";

export namespace AutoBeInterfaceSchemaReviewProgrammer {
  export const filterSecurity = (props: {
    document: AutoBeOpenApi.IDocument;
    typeName: string;
  }): boolean => {
    const symbols: string[] = ["IAuthorized", "IJoin", "ILogin"];
    return props.typeName.includes(".")
      ? symbols.some((s) => `.${props.typeName.endsWith(s)}`)
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
    const model: AutoBeDatabase.IModel | null =
      props.everyModels.find(
        (m) =>
          m.name ===
          (props.schema["x-autobe-database-schema"] ??
            AutoBeInterfaceSchemaProgrammer.getDatabaseSchemaName(
              props.typeName,
            )),
      ) ?? null;
    AutoBeInterfaceSchemaProgrammer.fixApplication({
      application: props.application,
      everyModels: props.everyModels,
      model,
    });

    const $defs = props.application.functions[0].parameters.$defs;
    const fix = (next: ILlmSchema | undefined): void => {
      if (next === undefined) return;
      else if (LlmTypeChecker.isObject(next) === false) return;

      const key: ILlmSchema | undefined = next.properties.key;
      if (key === undefined || LlmTypeChecker.isString(key) === false) return;
      key.enum = Object.keys(props.schema.properties);
    };
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyUpdate>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyErase>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyKeep>()]);
    fix($defs[typia.reflect.name<AutoBeInterfaceSchemaPropertyNullish>()]);
  };

  export const validate = (
    ctx: AutoBeContext,
    props: {
      typeName: string;
      schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
      revises: AutoBeInterfaceSchemaPropertyRevise[];
      path: string;
      errors: IValidation.IError[];
    },
  ): void => {
    props.revises.forEach((revise, i) => {
      if (
        revise.type !== "create" &&
        props.schema.properties[revise.key] === undefined
      )
        props.errors.push({
          path: `${props.path}.revises[${i}].key`,
          expected: Object.keys(props.schema.properties)
            .map((s) => JSON.stringify(s))
            .join(" | "),
          value: revise.key,
          description: StringUtil.trim`
          Property ${JSON.stringify(revise.key)} does not exist in schema.

          To ${revise.type} a property, it must exist in the object type.
        `,
        });
      if (revise.type === "create" || revise.type === "update")
        AutoBeJsonSchemaValidator.validateSchema({
          typeName: props.typeName,
          schema: revise.schema,
          operations: [],
          path: `${props.path}.revises[${i}].schema`,
          errors: props.errors,
          models: ctx
            .state()
            .database!.result.data.files.flatMap((f) => f.models),
        });
    });
    for (const key of Object.keys(props.schema.properties))
      if (props.revises.some((revise) => revise.key === key) === false)
        props.errors.push({
          path: `${props.path}.revises[]`,
          value: undefined,
          expected: `AutoBeInterfaceSchemaPropertyRevise (key: ${JSON.stringify(key)})`,
          description: StringUtil.trim`
            Missing revise for property ${JSON.stringify(key)}.

            You MUST provide a revise for EVERY property in the object schema.

            Use \`{ type: "keep", key: ${JSON.stringify(key)}, reason: "..." }\` 
            if no changes are needed. Otherwise, choose an appropriate revise type 
            to modify or erase the property.
          `,
        });
  };

  export const refine = (props: {
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }): AutoBeOpenApi.IJsonSchemaDescriptive.IObject => {
    const result: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = {
      ...props.schema,
      properties: {},
      required: [],
    };
    for (const revise of props.revises)
      if (revise.type === "create") {
        // create new property
        result.properties[revise.key] = AutoBeJsonSchemaFactory.fixSchema(
          revise.schema,
        );
        if (revise.required === true) result.required.push(revise.key);
      } else if (revise.type === "update") {
        // update existing property
        const newKey: string = revise.newKey ?? revise.key;
        result.properties[newKey] = AutoBeJsonSchemaFactory.fixSchema(
          revise.schema,
        );
        if (revise.required === true) result.required.push(newKey);
      } else if (revise.type === "keep") {
        // keep original property (deep clone to avoid shared references)
        result.properties[revise.key] = JSON.parse(
          JSON.stringify(props.schema.properties[revise.key]),
        );
        if (props.schema.required.includes(revise.key))
          result.required.push(revise.key);
      } else if (revise.type === "nullish") {
        // change nullable or required status only
        nullish({
          schema: result,
          property: props.schema.properties[revise.key],
          revise: revise,
        });
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
          description: cloned.description,
          "x-autobe-specification": cloned["x-autobe-specification"],
          "x-autobe-database-schema-property":
            cloned["x-autobe-database-schema-property"],
          oneOf: [
            {
              ...cloned,
              ...{
                description: undefined,
                "x-autobe-database-schema-property": undefined,
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
            description: cloned.description,
            "x-autobe-specification": cloned["x-autobe-specification"],
            "x-autobe-database-schema-property":
              cloned["x-autobe-database-schema-property"],
          };
      }
    }
    // Update description: null preserves existing, string replaces it
    if (props.revise.description !== null)
      cloned.description = props.revise.description;
    props.schema.properties[props.revise.key] = cloned;
    if (props.revise.required === true)
      props.schema.required.push(props.revise.key);
  };
}
