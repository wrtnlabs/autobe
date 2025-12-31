import { AutoBeAgent } from "@autobe/agent";
import { orchestratePrismaCorrect } from "@autobe/agent/src/orchestrate/prisma/orchestratePrismaCorrect";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeDatabase,
  AutoBeDatabaseReviewEvent,
  AutoBeDatabaseSchemaEvent,
  AutoBeExampleProject,
  IAutoBeDatabaseValidation,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { validate_prisma_review } from "./validate_prisma_review";
import { validate_prisma_schema } from "./validate_prisma_schema";

export const validate_prisma_correct = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<void> => {
  const writeEvents: AutoBeDatabaseSchemaEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.schema.json",
    })) ?? (await validate_prisma_schema(props));
  const reviewEvents: AutoBeDatabaseReviewEvent[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "prisma.review.json",
    })) ?? (await validate_prisma_review(props));

  const application: AutoBeDatabase.IApplication = {
    files: writeEvents.map((e) => e.file),
  };
  for (const review of reviewEvents) {
    const file: AutoBeDatabase.IFile | undefined = application.files.find(
      (f) => f.filename === review.filename,
    );
    if (file === undefined) continue;
    for (const modification of review.modifications) {
      const index: number = file.models.findIndex(
        (m) => m.name === modification.name,
      );
      if (index === -1) file.models.push(modification);
      else file.models[index] = modification;
    }
  }

  const result: IAutoBeDatabaseValidation = await orchestratePrismaCorrect(
    props.agent.getContext(),
    application,
  );
  TestValidator.equals("success", true, result.success);
};
