import { AutoBeAgent } from "@autobe/agent";
import { AutoBeSystemPromptConstant } from "@autobe/agent/src/constants/AutoBeSystemPromptConstant";
import { orchestrateInterfaceComplement } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceComplement";
import { orchestrateInterfaceSchemaReview } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaReview";
import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeJsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { missedOpenApiSchemas } from "@autobe/utils";

import { validate_interface_operation } from "./validate_interface_operation";
import { validate_interface_schema } from "./validate_interface_schema";

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

export const validate_interface_complement = async (props: {
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

  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    (await AutoBeExampleStorage.load({
      vendor: props.vendor,
      project: props.project,
      file: "interface.schema.json",
    })) ?? (await validate_interface_schema(props));

  // Build document
  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      authorizations: props.agent.getContext().state().analyze?.actors ?? [],
      schemas,
    },
  };
  const complementProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  const assign = (
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  ): void => {
    Object.assign(document.components.schemas, schemas);
    AutoBeJsonSchemaFactory.authorize(document.components.schemas);
    Object.assign(
      document.components.schemas,
      AutoBeJsonSchemaFactory.presets(
        new Set(Object.keys(document.components.schemas)),
      ),
    );
    AutoBeJsonSchemaNamingConvention.schemas(
      document.operations,
      document.components.schemas,
    );
    AutoBeJsonSchemaFactory.finalize({
      document,
      application: props.agent.getContext().state().database!.result.data,
    });
  };

  // Complement schemas
  while (missedOpenApiSchemas(document).length !== 0) {
    const oldSchemaKeys: Set<string> = new Set(
      Object.keys(document.components.schemas),
    );
    const complemented: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      await orchestrateInterfaceComplement(props.agent.getContext(), {
        instruction: "Design API specs carefully considering the security.",
        progress: complementProgress,
        document,
      });

    // Get only newly added schemas
    const newSchemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      Object.fromEntries(
        Object.keys(complemented)
          .filter((key) => !oldSchemaKeys.has(key))
          .map((key) => [key, complemented[key]]),
      );

    // Update document with complemented schemas
    assign(complemented);

    // Review newly complemented schemas
    const reviewProgress: AutoBeProgressEventBase = {
      completed: 0,
      total: Object.keys(newSchemas).length * REVIEWERS.length,
    };

    for (const config of REVIEWERS) {
      const reviewed = await orchestrateInterfaceSchemaReview(
        props.agent.getContext(),
        config,
        {
          instruction: "Design API specs carefully considering the security.",
          document,
          schemas: newSchemas,
          progress: reviewProgress,
        },
      );
      assign(reviewed);
    }
  }

  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      ["interface.complement.json"]: JSON.stringify(
        document.components.schemas,
      ),
    },
  });
  return document.components.schemas;
};
