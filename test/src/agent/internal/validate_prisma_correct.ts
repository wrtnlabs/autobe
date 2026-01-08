import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaCorrect } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaCorrect";
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

import { validate_prisma_component } from "./validate_prisma_component";
import { validate_prisma_schema_review } from "./validate_prisma_review";
import { validate_prisma_schema } from "./validate_prisma_schema";

export const validate_prisma_correct = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<void> => {
  const components: AutoBeDatabaseComponent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.component.json",
    })) ?? (await validate_prisma_component(props));
  const writeEvents: AutoBeDatabaseSchemaEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.schema.json",
    })) ?? (await validate_prisma_schema(props));
  const reviewEvents: AutoBeDatabaseSchemaReviewEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.review.json",
    })) ?? (await validate_prisma_schema_review(props));

  const application: AutoBeDatabase.IApplication = {
    files: components.map((comp) => ({
      filename: comp.filename,
      namespace: comp.namespace,
      models: writeEvents
        .filter((we) => we.namespace === comp.namespace)
        .map((we) => we.model),
    })),
  };
  for (const review of reviewEvents) {
    if (review.content === null) continue;
    const model: AutoBeDatabase.IModel = review.content;
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.namespace === review.namespace,
    );
    if (file === undefined) continue;
    const index: number = file.models.findIndex(
      (m) => m.name === review.modelName,
    );
    if (index !== -1) file.models[index] = model;
  }

  const result: IAutoBeDatabaseValidation = await orchestratePrismaCorrect(
    props.agent.getContext(),
    application,
  );
  TestValidator.equals("success", true, result.success);
};
