import { AutoBeDatabase } from "@autobe/interface";
import {
  ILlmApplication,
  ILlmFunction,
  ILlmSchema,
  LlmTypeChecker,
} from "@samchon/openapi";
import { plural } from "pluralize";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeDatabaseModelProgrammer } from "../../prisma/programmers/AutoBeDatabaseModelProgrammer";

export namespace AutoBeInterfaceSchemaProgrammer {
  export interface IDatabaseSchemaMember {
    key: string;
    nullable: boolean;
  }

  export const getDatabaseSchemaName = (typeName: string): string =>
    plural(NamingConvention.snake(typeName.split(".")[0]!.substring(1)));

  export const getNeighborDatabaseSchemas = (props: {
    typeName: string;
    application: AutoBeDatabase.IApplication;
  }): AutoBeDatabase.IModel[] | undefined => {
    const expected: string = getDatabaseSchemaName(props.typeName);
    const found: AutoBeDatabase.IModel | undefined = props.application.files
      .flatMap((f) => f.models)
      .find((m) => m.name === expected);
    if (found === undefined) return;
    return AutoBeDatabaseModelProgrammer.getNeighbors({
      application: props.application,
      model: found,
    });
  };

  export const getDatabaseSchemaMembers = (props: {
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel;
  }): IDatabaseSchemaMember[] => [
    {
      key: props.model.primaryField.name,
      nullable: false,
    },
    ...props.model.foreignFields.map((f) => ({
      key: f.name,
      nullable: f.nullable,
    })),
    ...props.model.foreignFields.map((f) => ({
      key: f.relation.name,
      nullable: f.nullable,
    })),
    ...props.everyModels
      .map((m) =>
        m.foreignFields
          .filter((f) => f.relation.targetModel === props.model.name)
          .map((f) => ({
            key: f.relation.oppositeName,
            nullable: f.unique,
          })),
      )
      .flat(),
  ];

  export const fixApplication = (props: {
    application: ILlmApplication;
    everyModels: AutoBeDatabase.IModel[];
    model: AutoBeDatabase.IModel | null;
  }): void => {
    const func: ILlmFunction = props.application.functions[0];

    fixDatabaseSchema({
      $defs: func.parameters.$defs,
      parameters: func.parameters,
      model: props.model,
      everyModels: props.everyModels,
    });
    // if (props.model !== null) {
    //   fixDatabaseSchemaMember({
    //     $defs: func.parameters.$defs,
    //     parameters: func.parameters,
    //     model: props.model,
    //     everyModels: props.everyModels,
    //   });
    // }
  };

  const fixDatabaseSchema = (props: {
    $defs: Record<string, ILlmSchema>;
    parameters: ILlmSchema.IParameters;
    model: AutoBeDatabase.IModel | null;
    everyModels: AutoBeDatabase.IModel[];
  }): void => {
    LlmTypeChecker.visit({
      $defs: props.$defs,
      schema: props.parameters,
      closure: (next) => {
        if (LlmTypeChecker.isObject(next) === false) return;

        const member: ILlmSchema | undefined =
          next.properties["x-autobe-database-schema"];
        if (member === undefined || LlmTypeChecker.isAnyOf(member) === false)
          return;

        const value: ILlmSchema | undefined = member.anyOf.find((x) =>
          LlmTypeChecker.isString(x),
        );
        if (value === undefined) return;

        value.enum =
          props.model !== null
            ? [props.model.name]
            : props.everyModels.map((m) => m.name);
      },
    });
  };

  // const fixDatabaseSchemaMember = (props: {
  //   $defs: Record<string, ILlmSchema>;
  //   parameters: ILlmSchema.IParameters;
  //   model: AutoBeDatabase.IModel;
  //   everyModels: AutoBeDatabase.IModel[];
  // }): void => {
  //   LlmTypeChecker.visit({
  //     $defs: props.$defs,
  //     schema: props.parameters,
  //     closure: (next) => {
  //       if (LlmTypeChecker.isObject(next) === false) return;

  //       const member: ILlmSchema | undefined =
  //         next.properties["x-autobe-database-schema-property"];
  //       if (member === undefined || LlmTypeChecker.isAnyOf(member) === false)
  //         return;

  //       const value: ILlmSchema | undefined = member.anyOf.find((x) =>
  //         LlmTypeChecker.isString(x),
  //       );
  //       if (value === undefined) return;

  //       value.enum = getDatabaseSchemaMembers({
  //         everyModels: props.everyModels,
  //         model: props.model,
  //       }).map((m) => m.key);
  //     },
  //   });
  // };
}
