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
  }): void => {
    const func: ILlmFunction = props.application.functions[0];
    fixDatabaseSchema({
      $defs: func.parameters.$defs,
      parameters: func.parameters,
      everyModels: props.everyModels,
    });
  };

  const fixDatabaseSchema = (props: {
    $defs: Record<string, ILlmSchema>;
    parameters: ILlmSchema.IParameters;
    everyModels: AutoBeDatabase.IModel[];
  }): void => {
    LlmTypeChecker.visit({
      $defs: props.$defs,
      schema: props.parameters,
      closure: (next) => {
        if (LlmTypeChecker.isObject(next) === false) return;

        const member: ILlmSchema | undefined = next.properties.databaseSchema;
        if (member === undefined || LlmTypeChecker.isAnyOf(member) === false)
          return;

        const value: ILlmSchema | undefined = member.anyOf.find((x) =>
          LlmTypeChecker.isString(x),
        );
        if (value === undefined) return;
      },
    });
  };
}
