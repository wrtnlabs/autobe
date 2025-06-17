import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import {
  AutoBeAnalyzeFileSystem,
  IAutoBeAnalyzeFileSystem,
} from "./AutoBeAnalyzeFileSystem";
import {
  AutoBEAnalyzeFileMap,
  AutoBeAnalyzePointer,
} from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeReviewer } from "./AutoBeAnalyzeReviewer";

export class AutoBeAnalyzeAgent<Model extends ILlmSchema.Model> {
  private readonly createAnalyzeAgent: () => MicroAgentica<Model>;
  private readonly fileMap: AutoBEAnalyzeFileMap = {};

  constructor(
    private readonly createReviewerAgentFn: typeof AutoBeAnalyzeReviewer,
    private readonly ctx: AutoBeContext<Model>,
    private readonly pointer: AutoBeAnalyzePointer,
    private readonly filenames: string[],
  ) {
    assertSchemaModel(ctx.model);

    const controller = createController<Model>({
      model: ctx.model,
      execute: new AutoBeAnalyzeFileSystem(this.fileMap),
      build: async (files: AutoBEAnalyzeFileMap) => {
        this.pointer.value ??= { files: {} };
        Object.assign(this.pointer.value.files, files);
      },
    });

    this.createAnalyzeAgent = (): MicroAgentica<Model> => {
      const agent = new MicroAgentica({
        controllers: [controller],
        model: ctx.model,
        vendor: ctx.vendor,
        config: {
          locale: ctx.config?.locale,
          executor: {
            describe: null,
          },
        },
        tokenUsage: ctx.usage(),
        histories: [
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: AutoBeSystemPromptConstant.ANALYZE.replace(
              "{% User Locale %}",
              ctx.config?.locale ?? "en-US",
            ),
          },
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: [
              "# Guidelines",
              "If the user specifies the exact number of pages, please follow it precisely.",
              AutoBeSystemPromptConstant.ANALYZE_GUIDELINE,
            ].join("\n"),
          },
          {
            id: v4(),
            created_at: new Date().toISOString(),
            type: "systemMessage",
            text: [
              "The following is the name of the entire file.",
              "Use it to build a table of contents.",
              this.filenames.map((filename) => `- ${filename}`),
              "",
              "However, do not touch other than the file you have to create.",
            ].join("\n"),
          },
        ],
      });
      return enforceToolCall(agent);
    };
  }

  /**
   * Conversate with planner agent
   *
   * @param content Conversation from user in this time.
   * @returns
   */
  async conversate(content: string, retry = 3): Promise<string> {
    if (retry === 0) {
      return "Abort due to excess retry count";
    }

    const response = await this.createAnalyzeAgent().conversate(content);
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

      const reviewer = this.createReviewerAgentFn(this.ctx, {
        query: content,
        files: JSON.stringify(this.fileMap),
      });

      const filenames = Object.keys(this.fileMap).join(",");
      const command = `Please proceed with the review of these files only.: ${filenames}`;
      const response = await reviewer.conversate(command);
      const review = response.find((el) => el.type === "assistantMessage");

      if (review) {
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
          retry - 1,
        );
      }

      return `COMPLETE WITHOUT REVIEW`;
    }

    return "COMPLETE";
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: AutoBeAnalyzeFileSystem;
  build: (input: AutoBEAnalyzeFileMap) => void;
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
    } satisfies IAutoBeAnalyzeFileSystem,
  };
}

const claude = typia.llm.application<
  AutoBeAnalyzeFileSystem,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    AutoBeAnalyzeFileSystem,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<AutoBeAnalyzeFileSystem, "3.0">(),
};
