import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import chalk from "chalk";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../context/AutoBeContext";
import { assertSchemaModel } from "../context/assertSchemaModel";
import { createReviewer } from "./CreateReviewer";
import { Planning } from "./Planning";

type Filename = string;
type FileContent = string;

export class AnalyzeAgent<Model extends ILlmSchema.Model> {
  private readonly agent: MicroAgentica<Model>;
  private readonly fileMap: Record<Filename, FileContent> = {};

  constructor(
    private readonly reviewer: typeof createReviewer,
    ctx: AutoBeContext<Model>,
  ) {
    assertSchemaModel(ctx.model);

    const controller = createController<Model>({
      model: ctx.model,
      execute: new Planning(this.fileMap),
    });
    this.agent = new MicroAgentica({
      controllers: [controller],
      model: ctx.model,
      vendor: ctx.vendor,
      config: {
        systemPrompt: {
          common: () => {
            return AutoBeSystemPromptConstant.ANALYZE.replace(
              "{% Guidelines %}",
              AutoBeSystemPromptConstant.ANALYZE_GUIDELINE,
            ).replace(
              "{% Example Documentation %}",
              AutoBeSystemPromptConstant.ANALYZE_EXAMPLE,
            );
          },
        },
      },
    });
  }

  /**
   * Conversate with planner agent
   *
   * @param content Conversation from user in this time.
   * @returns
   */
  async conversate(content: string): Promise<string> {
    const response = await this.agent.conversate(content);
    const lastMessage = response[response.length - 1]!;

    if ("text" in lastMessage) {
      console.log(
        chalk.blackBright(
          JSON.stringify(
            Object.entries(this.fileMap).map(([filename, content]) => {
              return {
                filename,
                content,
                content_length: content.length,
              };
            }),
            null,
            2,
          ),
        ) + "\n\n\n",
      );

      console.log(chalk.green(lastMessage.text) + "\n\n\n");
      const aborted =
        lastMessage.type === "describe" &&
        lastMessage.executes.some((el) => {
          if (
            el.protocol === "class" &&
            el.operation.function.name === "abort"
          ) {
            el.arguments;
            return true;
          }
        });

      if (aborted === true) {
        return lastMessage.text;
      }

      const currentFiles = this.fileMap;

      const reviewer = this.reviewer(this.agent.getVendor(), {
        query: content,
        currentFiles,
      });

      const [review, ...rest] = await reviewer.conversate(lastMessage.text);
      console.log("review: ", review.type, rest.length);

      if (review) {
        if (review.type === "assistantMessage") {
          console.log(chalk.red(review.text) + "\n\n\n");
          return this.conversate(
            JSON.stringify({
              user_query: content,
              message: `THIS IS ANSWER OF REVIEW AGENT. FOLLOW THIS INSTRUCTIONS. AND DON\'T REQUEST ANYTHING.`,
              review: review.text,
            }),
          );
        }
      }
    }

    return "COMPLETE";
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: Planning;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    execute: props.execute,
  };
}

const claude = typia.llm.application<Planning, "claude", { reference: true }>();
const collection = {
  chatgpt: typia.llm.application<Planning, "chatgpt", { reference: true }>(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<Planning, "3.0">(),
};
