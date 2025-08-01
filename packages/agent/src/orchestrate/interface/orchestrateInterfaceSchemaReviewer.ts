import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { IAgenticaHistoryJson } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { IAutoBeInterfaceSchemaReviewerApplication } from "./structures/IAutoBeInterfaceSchemaReviewerApplication";

export type IOrchestrateInterfaceSchemaReviewerResult =
  | {
      type: "reject";
      value: string;
    }
  | {
      type: "accept";
    };

export const orchestrateInterfaceSchemaReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>,
  operations: AutoBeOpenApi.IOperation[],
): Promise<IOrchestrateInterfaceSchemaReviewerResult> => {
  const fnCalled: IPointer<IOrchestrateInterfaceSchemaReviewerResult> = {
    value: {
      type: "reject",
      value: "Schema reviewer is not working because of unknown reason.",
    },
  };

  const controller = createController({
    model: ctx.model,
    setResult: (result: IOrchestrateInterfaceSchemaReviewerResult) => {
      fnCalled.value = result;
    },
  });
  
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [controller],
    config: {
      ...ctx.config,
      executor: {
        describe: null,
      },
    },
    histories: [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "assistantMessage",
        text: [
          "Please review the following schema components for security, correctness, and quality.",
          "",
          "## Schemas to Review",
          "",
          JSON.stringify(schemas, null, 2),
          "",
          "## Related Operations Context",
          "",
          JSON.stringify(operations.map(op => ({
            path: op.path,
            method: op.method,
            requestBodyType: op.requestBody?.typeName || null,
            responseBodyType: op.responseBody?.typeName || null,
          })), null, 2),
          "",
          "## Review Criteria",
          "",
          "Please evaluate the schemas based on:",
          "",
          "1. **Security Audit**:",
          "   - Are there sensitive fields (password, secret, token) in response types?",
          "   - Should passwords only appear in request bodies for login/registration?",
          "   - Are there any other security information that should not be exposed?",
          "   - Check for proper separation of request vs response schemas",
          "",
          "2. **Schema Structure and Quality**:",
          "   - Are property types appropriate and well-defined?",
          "   - Do schemas follow established naming conventions?",
          "   - Are property descriptions comprehensive and detailed?",
          "   - Do they reference Prisma schema comments appropriately?",
          "",
          "3. **Completeness and Consistency**:",
          "   - Are all necessary properties included?",
          "   - Are schemas consistent with their intended usage?",
          "   - Do they align with business requirements?",
          "",
          "4. **Documentation Quality**:",
          "   - Are descriptions organized into multiple paragraphs where appropriate?",
          "   - Do they explain the purpose and constraints clearly?",
          "",
          "Use the `reviewSchemas` function to provide your analysis.",
        ].join("\n"),
      },
    ] as Array<IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage>,
  });
  
  enforceToolCall(agent);

  const command = `Please proceed with the review of these schema components.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage();
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  return fnCalled.value;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IOrchestrateInterfaceSchemaReviewerResult) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  
  return {
    protocol: "class",
    name: "SchemaReviewer",
    application,
    execute: {
      reviewSchemas: async (input) => {
        if (input.decision === "accept") {
          props.setResult({
            type: "accept",
          });
        } else {
          props.setResult({
            type: "reject",
            value: input.reasoning,
          });
        }
      },
    } satisfies IAutoBeInterfaceSchemaReviewerApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceSchemaReviewerApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceSchemaReviewerApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};