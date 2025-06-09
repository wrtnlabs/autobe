import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeAnalyzeAgent } from "../../analyze/AutoBeAnalyzeAgent";
import { IFile } from "../../analyze/AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzeReviewer } from "../../analyze/AutoBeAnalyzeReviewer";
import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { assertSchemaModel } from "../../context/assertSchemaModel";

type Filename = string;
type FileContent = string;

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const userPlanningRequirements = props.userPlanningRequirements;
    if (!userPlanningRequirements) {
      throw new Error(
        `Unable to prepare a proposal because there is no user requirement`,
      );
    }

    const step = ctx.state().analyze?.step ?? 0;
    const created_at = new Date().toISOString();
    ctx.dispatch({
      type: "analyzeStart",
      reason: userPlanningRequirements,
      step,
      created_at,
    });

    const controller = createController<Model>({
      model: ctx.model,
      execute: new DeterminingFiles(),
    });

    const agentica = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      controllers: [controller],
      config: {
        locale: ctx.config?.locale,
        systemPrompt: {
          common: () => AutoBeSystemPromptConstant.ANALYZE_PLANNER,
        },
      },
      histories: [
        ...ctx
          .histories()
          .filter(
            (el) => el.type === "assistantMessage" || el.type === "userMessage",
          ),
      ],
    });

    agentica.on("request", (event) => {
      if (event.body.tools) {
        event.body.tool_choice = "required";
      }
    });

    const determined = await agentica.conversate(
      [
        "Design a complete list of documents for that document",
        "```md",
        userPlanningRequirements,
        "```",
      ].join("\n"),
    );

    const lastMessage = determined[determined.length - 1]!;
    if (lastMessage.type === "assistantMessage") {
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: lastMessage.text,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.dispatch({
        type: "assistantMessage",
        text: lastMessage.text,
        created_at,
      });
      return history;
    }

    const described = determined.find((el) => el.type === "describe");
    const filenames = Array.from(
      new Set(
        described
          ? described.executes
              .flatMap((el) => {
                if (el.protocol === "class") {
                  return (
                    el.arguments as { files: Array<Pick<IFile, "filename">> }
                  ).files;
                }
                return null;
              })
              .filter((el) => el !== null)
          : [],
      ),
    );

    const pointers = await Promise.all(
      filenames.map(async ({ filename }) => {
        const pointer: IPointer<{
          files: Record<Filename, FileContent>;
        } | null> = {
          value: null,
        };

        const agent = new AutoBeAnalyzeAgent(
          AutoBeAnalyzeReviewer,
          ctx,
          pointer,
          filenames.map((el) => el.filename),
        );

        await agent.conversate(
          [
            `The names of all the files are as follows: ${filenames.join(",")}`,
            "Assume that all files are in the same folder. Also, when pointing to the location of a file, go to the relative path.",
            "",
            `Among the various documents, the part you decided to take care of is as follows.: ${filename}`,
            `Only write this document named '${filename}'.`,
            "Never write other documents.",
            "",
            "```md",
            JSON.stringify(userPlanningRequirements),
            "```",
          ].join("\n"),
        );

        return pointer;
      }),
    );

    const files = pointers
      .map((pointer) => {
        return pointer.value?.files ?? {};
      })
      .reduce((acc, cur) => Object.assign(acc, cur));

    if (Object.keys(files).length) {
      const history: AutoBeAnalyzeHistory = {
        id: v4(),
        type: "analyze",
        reason: userPlanningRequirements,
        files: files,
        step,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.state().analyze = history;
      ctx.histories().push(history);
      ctx.dispatch({
        type: "analyzeComplete",
        files: files,
        step,
        created_at,
      });
      return history;
    }

    const history: AutoBeAssistantMessageHistory = {
      id: v4(),
      type: "assistantMessage",
      text: determined.find((el) => el.type === "assistantMessage")?.text ?? "",
      created_at,
      completed_at: new Date().toISOString(),
    };
    ctx.dispatch({
      type: "assistantMessage",
      text: determined.find((el) => el.type === "assistantMessage")?.text ?? "",
      created_at,
    });
    return history;
  };

class DeterminingFiles {
  /**
   * Determining the Initial File List
   *
   * Design a list of initial documents that you need to create for that
   * requirement. The list of documents is determined only by the name of the
   * file.
   *
   * @param input
   * @returns
   */
  determine(input: { files: Array<Pick<IFile, "filename">> }) {
    return input;
  }
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  execute: DeterminingFiles;
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
      determine: (input) => {
        return input;
      },
    } satisfies DeterminingFiles,
  };
}

const claude = typia.llm.application<
  DeterminingFiles,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    DeterminingFiles,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<DeterminingFiles, "3.0">(),
};
