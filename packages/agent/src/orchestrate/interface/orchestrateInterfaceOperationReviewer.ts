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
import { IAutoBeInterfaceOperationReviewerApplication } from "./structures/IAutoBeInterfaceOperationReviewerApplication";

export type IOrchestrateInterfaceOperationReviewerResult =
  | {
      type: "reject";
      value: string;
    }
  | {
      type: "accept";
    };

export const orchestrateInterfaceOperationReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
): Promise<IOrchestrateInterfaceOperationReviewerResult> => {
  const fnCalled: IPointer<IOrchestrateInterfaceOperationReviewerResult> = {
    value: {
      type: "reject",
      value: "Operation reviewer is not working because of unknown reason.",
    },
  };

  const controller = createController({
    model: ctx.model,
    setResult: (result: IOrchestrateInterfaceOperationReviewerResult) => {
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
          "Please review the following API operations for correctness, quality, and completeness.",
          "",
          "## Operations to Review",
          "",
          JSON.stringify(operations, null, 2),
          "",
          "## Review Criteria",
          "",
          "Please evaluate the operations based on:",
          "",
          "1. **Parameter and Return Type Correctness**:",
          "   - Are path parameters properly defined and used?",
          "   - Do request bodies have appropriate type references?",
          "   - Are response bodies correctly typed?",
          "   - Are parameter types consistent with their usage?",
          "",
          "2. **Description Quality and Completeness**:",
          "   - Are descriptions detailed and comprehensive?",
          "   - Do they reference Prisma schema comments appropriately?",
          "   - Are they organized into multiple paragraphs?",
          "   - Do they explain the operation's purpose clearly?",
          "",
          "3. **API Design Pattern Compliance**:",
          "   - Do operations follow REST principles?",
          "   - Are HTTP methods used appropriately?",
          "   - Are naming conventions consistent?",
          "   - Is the API design intuitive and logical?",
          "",
          "4. **Security Considerations**:",
          "   - Are authorization requirements properly specified?",
          "   - Are there any security concerns with the design?",
          "",
          "Use the `reviewOperations` function to provide your analysis.",
        ].join("\n"),
      },
    ] as Array<IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage>,
  });
  
  enforceToolCall(agent);

  const command = `Please proceed with the review of these API operations.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage();
    ctx.usage().record(tokenUsage, ["interface"]);
  });

  return fnCalled.value;
};

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IOrchestrateInterfaceOperationReviewerResult) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  
  return {
    protocol: "class",
    name: "OperationReviewer",
    application,
    execute: {
      reviewOperations: async (input) => {
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
    } satisfies IAutoBeInterfaceOperationReviewerApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeInterfaceOperationReviewerApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeInterfaceOperationReviewerApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};