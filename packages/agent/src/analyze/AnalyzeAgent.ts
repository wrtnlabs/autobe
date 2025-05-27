import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../context/AutoBeContext";
import { assertSchemaModel } from "../context/assertSchemaModel";
import { createReviewerAgent } from "./CreateReviewerAgent";
import { IPlanning, Planning } from "./Planning";

type Filename = string;
type FileContent = string;

export class AnalyzeAgent<Model extends ILlmSchema.Model> {
  private readonly createInnerAgent: () => MicroAgentica<Model>;
  private readonly fileMap: Record<Filename, FileContent> = {};

  constructor(
    private readonly createReviewerAgentFn: typeof createReviewerAgent,
    private readonly ctx: AutoBeContext<Model>,
    private readonly pointer: IPointer<{
      files: Record<Filename, FileContent>;
    } | null>,
  ) {
    assertSchemaModel(ctx.model);

    const controller = createController<Model>({
      model: ctx.model,
      execute: new Planning(this.fileMap),
      build: async (files: Record<Filename, FileContent>) => {
        this.pointer.value = { files };
      },
    });

    this.createInnerAgent = (): MicroAgentica<Model> => {
      const agent = new MicroAgentica({
        controllers: [controller],
        model: ctx.model,
        vendor: ctx.vendor,
        config: {
          systemPrompt: {
            common: () => {
              return AutoBeSystemPromptConstant.ANALYZE.replace(
                "{% Guidelines %}",
                AutoBeSystemPromptConstant.ANALYZE_GUIDELINE,
              )
                .replace(
                  "{% Example Documentation %}",
                  AutoBeSystemPromptConstant.ANALYZE_EXAMPLE,
                )
                .replace("{% User Locale %}", ctx.config?.locale ?? "en-US");
            },
            describe: () => {
              return "Answer only 'completion' or 'failure'.";
            },
          },
        },
        tokenUsage: ctx.usage(),
        histories: [],
      });

      return agent;
    };
  }

  /**
   * Conversate with planner agent
   *
   * @param content Conversation from user in this time.
   * @returns
   */
  async conversate(content: string): Promise<string> {
    const response = await this.createInnerAgent().conversate(content);
    const lastMessage = response[response.length - 1]!;

    if ("text" in lastMessage) {
      this.ctx.dispatch({
        type: "analyzeWriteDocument",
        files: this.fileMap,
        created_at: new Date().toISOString(),
        step: this.ctx.state().analyze?.step ?? 0,
      });

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

      const reviewer = this.createReviewerAgentFn(this.ctx, {
        query: content,
        currentFiles,
      });

      const [review] = await reviewer.conversate(lastMessage.text);

      if (review) {
        if (review.type === "assistantMessage") {
          this.ctx.dispatch({
            type: "analyzeReview",
            review: review.text,
            created_at: new Date().toISOString(),
            step: this.ctx.state().analyze?.step ?? 0,
          });

          return this.conversate(
            JSON.stringify({
              user_query: content,
              message: `THIS IS ANSWER OF REVIEW AGENT. FOLLOW THIS INSTRUCTIONS. AND DON\'T REQUEST ANYTHING.`,
              review: review.text,
            }),
          );
        }
      }

      return `If the document is not 1,000 characters, please fill it out in more abundance, and if it exceeds 1,000 characters, please fill out the next document. If you don't have the next document, you can exit now.`;
    }

    return "COMPLETE";
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: Planning;
  build: (input: Record<Filename, FileContent>) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Planning",
    application,
    // execute: props.execute,
    execute: {
      removeFile: (input) => {
        const response = props.execute.removeFile(input);
        props.build(props.execute.allFiles());
        return response;
      },
      abort: (input) => {
        const response = props.execute.abort(input);
        props.build(props.execute.allFiles());
        return response;
      },
      createOrUpdateFiles: (input) => {
        const response = props.execute.createOrUpdateFiles(input);
        props.build(props.execute.allFiles());
        return response;
      },
    } satisfies IPlanning,
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
