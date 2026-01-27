import { AutoBeAgent } from "@autobe/agent";
import { AutoBeSystemPromptConstant } from "@autobe/agent/src/constants/AutoBeSystemPromptConstant";
import { orchestrateInterfaceSchema } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchema";
import { orchestrateInterfaceSchemaReview } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaReview";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";

import { validate_interface_operation } from "./validate_interface_operation";

export const validate_interface_schema = async (props: {
  agent: AutoBeAgent;
  project: AutoBeExampleProject;
  vendor: string;
}): Promise<Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>> => {
  const operations: AutoBeOpenApi.IOperation[] =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.operation.json",
    })) ?? (await validate_interface_operation(props));

  // Initial schema generation
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    await orchestrateInterfaceSchema(props.agent.getContext(), {
      operations,
      instruction: "Design API specs carefully considering the security.",
    });

  // Build document for review
  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      schemas,
    },
  };

  // Review schemas with all reviewers
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: Object.keys(schemas).length * REVIEWERS.length,
  };

  for (const config of REVIEWERS) {
    const reviewed = await orchestrateInterfaceSchemaReview(
      props.agent.getContext(),
      config,
      {
        instruction: "",
        document,
        schemas: document.components.schemas,
        progress: reviewProgress,
      },
    );
    Object.assign(document.components.schemas, reviewed);
  }

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.schema.json"]: JSON.stringify(document.components.schemas),
    },
  });
  return document.components.schemas;
};

const REVIEWERS = [
  {
    kind: "relation" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_RELATION_REVIEW,
  },
  {
    kind: "security" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_SECURITY_REVIEW,
  },
  {
    kind: "content" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_CONTENT_REVIEW,
  },
  {
    kind: "phantom" as const,
    systemPrompt: AutoBeSystemPromptConstant.INTERFACE_SCHEMA_PHANTOM_REVIEW,
  },
];
