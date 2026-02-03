import { AutoBeAgent } from "@autobe/agent";
import { AutoBeSystemPromptConstant } from "@autobe/agent/src/constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "@autobe/agent/src/context/AutoBeContext";
import { orchestrateInterfaceSchemaCasting } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaCasting";
import { orchestrateInterfaceSchemaComplement } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaComplement";
import { orchestrateInterfaceSchemaRefine } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaRefine";
import { orchestrateInterfaceSchemaReview } from "@autobe/agent/src/orchestrate/interface/orchestrateInterfaceSchemaReview";
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
  const ctx: AutoBeContext = props.agent.getContext();
  const document: AutoBeOpenApi.IDocument = {
    operations,
    components: {
      authorizations: ctx.state().analyze?.actors ?? [],
      schemas,
    },
  };
  const complementProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const castingProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const refineProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };
  const reviewProgress: AutoBeProgressEventBase = {
    completed: 0,
    total: 0,
  };

  // Complement schemas
  const failures: Map<string, number> = new Map();
  while (missedOpenApiSchemas(document).length !== 0) {
    const complemented: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      {};
    const assign = (
      schemas: Record<
        string,
        AutoBeOpenApi.IJsonSchema | AutoBeOpenApi.IJsonSchemaDescriptive
      >,
    ) => {
      Object.assign(complemented, schemas);
      Object.assign(document.components.schemas, schemas);
    };

    // complement
    assign(
      await orchestrateInterfaceSchemaComplement(ctx, {
        instruction: "Design API specs carefully considering the security.",
        progress: complementProgress,
        document,
        failures,
      }),
    );
    if (Object.keys(complemented).length === 0) continue;

    // casting
    assign(
      await orchestrateInterfaceSchemaCasting(ctx, {
        document,
        schemas: complemented,
        progress: castingProgress,
        instruction: "",
      }),
    );

    // refining
    assign(
      await orchestrateInterfaceSchemaRefine(ctx, {
        instruction: "",
        progress: refineProgress,
        document,
        schemas: complemented,
      }),
    );

    // Review newly complemented schemas
    reviewProgress.total += Object.keys(complemented).length * REVIEWERS.length;
    for (const config of REVIEWERS) {
      const reviewed = await orchestrateInterfaceSchemaReview(ctx, config, {
        instruction: "Design API specs carefully considering the security.",
        document,
        schemas: complemented,
        progress: reviewProgress,
      });
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
