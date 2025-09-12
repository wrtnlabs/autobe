import { AutoBeHistory, AutoBeUserMessageTextContent } from "@autobe/interface";
import OpenAI from "openai";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import { Semaphore } from "tstl";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";
import { IScenario } from "./scenarios/types";

export interface ClientAgent {
  context: {
    scenario: IScenario;
    semaphore: Semaphore;
  };
  conversate: (
    dialogs: ChatCompletionMessageParam[],
  ) => Promise<
    FinishEvaluateMessageType | OpenAI.Chat.Completions.ChatCompletionMessage
  >;
}
export const getClientAgent = (
  scenario: IScenario,
  semaphore: Semaphore,
): ClientAgent => {
  const llm = TestGlobal.getVendorConfig().api;
  const baseHistories = [
    {
      role: "system",
      content: getGeneralPrompt(scenario),
    },
  ] satisfies ChatCompletionMessageParam[];

  const conversate = async (dialogs: ChatCompletionMessageParam[]) => {
    await semaphore.acquire();
    try {
      const ask = async (
        dialogs: ChatCompletionMessageParam[],
        depth: number = 0,
      ) => {
        const response = await llm.chat.completions.create({
          model: "gpt-4.1",
          messages: [...baseHistories, ...dialogs],
          tools: getToolsPrompt(),
        });
        const chosen = response.choices[0];
        const maybeFinishEvaluation = (() => {
          try {
            const toolCalls = chosen.message.tool_calls;
            if (toolCalls === undefined) {
              return {
                status: "message",
                message: chosen.message,
              } as const;
            }

            if (toolCalls[0].type === "custom") {
              // From GPT-5, custom tool is supported, but is currently unnecessary for our logic.
              throw new Error("not yet supported.");
            }

            const toolCall = JSON.parse(
              toolCalls[0].function.arguments ?? "{}",
            );
            const validated =
              typia.validate<FinishEvaluateMessageType>(toolCall);

            if (validated.success === true) {
              return {
                status: "success",
                data: validated.data,
              } as const;
            }

            if (validated.success === false && depth < 5) {
              return {
                status: "retry",
                toolCallId: toolCalls[0].id,
                validated,
              } as const;
            }
          } catch {}
          return {
            status: "message",
            message: chosen.message,
          } as const;
        })();

        switch (maybeFinishEvaluation.status) {
          case "success":
            return maybeFinishEvaluation.data;
          case "retry":
            return ask(
              [
                ...dialogs,
                chosen.message,
                {
                  role: "tool",
                  content: JSON.stringify(
                    maybeFinishEvaluation.validated.errors,
                  ),
                  tool_call_id: maybeFinishEvaluation.toolCallId,
                },
              ],
              depth + 1,
            );
          case "message":
            return maybeFinishEvaluation.message;
        }
      };

      return ask(dialogs);
    } finally {
      semaphore.release().catch(() => {});
    }
  };

  return {
    context: {
      scenario,
      semaphore,
    },
    conversate,
  };
};

const getGeneralPrompt = (scenario: IScenario) => `
# System Prompt

You are an intelligent agent managing interactions with a backend program creation agent. Your role is to oversee the creation process, ensure all workflow steps are completed **strictly in sequence**, and evaluate the resulting program against provided criteria. **You must not design database schemas, write code, or perform tasks reserved for the backend agent.** Your responsibility is to delegate tasks, verify outputs, and ensure no steps are omitted.

## Workflow
The backend program creation agent must execute these steps **in sequence, all mandatory**:
1. **Requirements Analysis**: Analyze user requirements to define clear objectives and functionalities.
2. **Prisma-Based Database Schema Creation**: Create a Prisma schema based on the analyzed requirements to define the database structure.
3. **Code Interface Creation**: Write the code interface (e.g., API endpoints, business logic) using the schema. **This step is mandatory and must not be skipped.**

**Note**: All steps are interdependent and must be completed in order. No step can be omitted.

## Responsibilities
- Delegate each step to the backend agent and ensure they are executed in sequence: requirements analysis, then schema creation, then code interface creation.
- Verify each step’s output aligns with user requirements, requesting revisions if needed.
- Explicitly confirm the code interface creation step is completed. If omitted, instruct the backend agent to address it immediately.
- Conduct a checkpoint before concluding the workflow to verify all three steps are completed in order. Address any omissions promptly.
- Do not perform backend agent tasks (e.g., schema design or coding).

## Evaluation Process
After all steps are completed, evaluate the program against the provided criteria (see **Evaluation Criteria** below). Use these criteria to assess correctness and completeness, then call the \`finish_evaluation\` tool to submit results.

<evaluation_criteria>
${scenario.criteria.join("\n")}
</evaluation_criteria>

## Instructions
- Communicate clearly with the backend agent to ensure sequential, complete execution of all steps.
- Verify outputs at each step, ensuring the code interface creation step is included.
- Confirm all steps are executed in order before evaluation. Address any missing or out-of-sequence steps immediately.
- Review the program against the provided criteria and document results.
- Call \`finish_evaluation\` to submit evaluation results, detailing how the program meets or deviates from the criteria.
- Adhere strictly to user requirements and criteria. Request clarification if needed.
- Provide concise, accurate responses without unnecessary detail.

## Tool Usage
After evaluation, call \`finish_evaluation\` to submit results, including the criteria and program assessment.`;

const getToolsPrompt = () =>
  [
    {
      type: "function",
      function: {
        name: "finish_evaluation",
        description: "Finish the evaluation of the program.",
        parameters: {
          type: "object",
          properties: {
            reasoning: {
              type: "string",
              description: "The reasoning process of the evaluation.",
            },
            evaluations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  criteria: {
                    type: "string",
                    description: "The criteria to be evaluated.",
                  },
                  evaluation: {
                    type: "boolean",
                    description:
                      "Whether the criteria is met (`true` or `false`). if you want to evaluate with negative, please set `false`.",
                  },
                },
                required: ["criteria", "evaluation"],
              },
            },
          },
          required: ["reasoning", "evaluations"],
        },
      },
    },
  ] as ChatCompletionTool[];

export interface FinishEvaluateMessageType {
  /**
   * The reason why you evaluate the agent's performance
   *
   * @title reasoning
   */
  reasoning: string;
  /**
   * The evaluations of the agent's performance
   *
   * @title evaluations
   */
  evaluations: {
    /**
     * The criteria to be evaluated
     *
     * @title criteria
     */
    criteria: string;
    /**
     * The evaluation of the criteria (`true` or `false`)
     *
     * @title evaluation
     */
    evaluation: boolean;
  }[];
}

export function transformAutobeHistoriesForClient(
  history: AutoBeHistory,
): ChatCompletionMessageParam[] {
  switch (history.type) {
    case "userMessage":
      return history.contents.map((content) => ({
        role: "assistant",
        content: (content as AutoBeUserMessageTextContent).text,
      }));
    case "assistantMessage":
      return [{ role: "user", content: history.text }];
    case "analyze":
      return [
        {
          role: "user",
          content: `${history.reason}
${Object.entries(history.files)
  .map(([key, value]) => `- ${key}:\n\`\`\`${value}\`\`\``)
  .join("\n\n")}`,
        },
      ];
    case "prisma":
      return [
        {
          role: "user",
          content: `[prisma - ${history.compiled.type}]
reason: ${history.reason}
        ${Object.entries(history.schemas)
          .map(([key, value]) => `- ${key}:\n\`\`\`${value}\`\`\``)
          .join("\n\n")}

errors:
${history.result.success === true ? "" : history.result.errors.map((error) => `- ${error.message}`).join("\n")}
${history.compiled.type === "failure" ? history.compiled.reason : ""}
${history.compiled.type === "failure" ? "please retry to request generate prisma schema." : ""}

schema:
${Object.entries(history.schemas)
  .map(([key, value]) => `- ${key}:\n\`\`\`${value}\`\`\``)
  .join("\n\n")}
          `,
        },
      ];
    case "interface":
      return [
        {
          role: "user",
          content: JSON.stringify(history.document),
        },
      ];
    default:
      return [];
  }
}
