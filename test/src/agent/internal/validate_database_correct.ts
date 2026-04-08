import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseCorrect } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseCorrect";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { validate_database_component } from "./validate_database_component";
import { validate_database_schema } from "./validate_database_schema";

export const validate_database_correct = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<void> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_database_component(props));
  const writeEvents: AutoBeDatabaseSchemaEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.schema.json",
    })) ?? (await validate_database_schema(props));

  const application: AutoBeDatabase.IApplication = {
    files: components.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: writeEvents
        .filter((we) => we.namespace === comp.namespace)
        .map((we) => we.definition.model),
    })),
  };

  const result: IAutoBeDatabaseValidation = await orchestrateDatabaseCorrect(
    props.agent.getContext(),
    application,
  );
  TestValidator.equals("success", true, result.success);
};
