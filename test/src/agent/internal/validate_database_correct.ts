import { AutoBeAgent } from "@autobe/agent";
import { orchestrateDatabaseCorrect } from "@autobe/agent/src/orchestrate/database/orchestrateDatabaseCorrect";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseComponent,
  AutoBeDatabaseSchemaEvent,
  AutoBeDatabaseSchemaReviewEvent,
  AutoBeExampleProject,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { validate_database_component } from "./validate_database_component";
import { validate_database_schema_review } from "./validate_database_review";
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
  const reviewEvents: AutoBeDatabaseSchemaReviewEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.review.json",
    })) ?? (await validate_database_schema_review(props));

  const application: AutoBeDatabase.IApplication = {
    files: components.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: writeEvents
        .filter((we) => we.namespace === comp.namespace)
        .map((we) => we.definition.model),
    })),
  };
  for (const review of reviewEvents) {
    if (review.content === null) continue;
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.namespace === review.namespace,
    );
    if (file === undefined) continue;
    else if (review.content === null) continue;
    const index: number = file.models.findIndex(
      (m) => m.name === review.content!.model.name,
    );
    if (index !== -1) file.models[index] = review.content!.model;
    else file.models.push(review.content!.model);
  }

  const result: IAutoBeDatabaseValidation = await orchestrateDatabaseCorrect(
    props.agent.getContext(),
    application,
  );
  TestValidator.equals("success", true, result.success);
};
