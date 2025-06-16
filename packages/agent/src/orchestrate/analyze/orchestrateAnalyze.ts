import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { AutoBeAnalyzeAgent } from "./AutoBeAnalyzeAgent";
import { IFile } from "./AutoBeAnalyzeFileSystem";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import { AutoBeAnalyzeReviewer } from "./AutoBeAnalyzeReviewer";

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
    // const determinedOutput = Array.from(
    //   new Set(
    //     described
    //       ? described.executes
    //           .map((el) => {
    //             if (el.protocol === "class") {
    //               return el.arguments as unknown as IDeterminingInput;
    //             }
    //             return null;
    //           })
    //           .filter((el) => el !== null)
    //       : [],
    //   ),
    // );

    const determinedOutput = described?.executes.find(
      (el) => el.protocol === "class" && typia.is<IDeterminingInput>(el.value),
    )?.value as IDeterminingInput;

    const prefix = determinedOutput.prefix;
    const describedFiles = determinedOutput.files;
    if (describedFiles.length === 0) {
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.dispatch({
        type: "assistantMessage",
        text: "The current requirements are insufficient, so file generation will be suspended. It would be better to continue the conversation.",
        created_at,
      });
      return history;
    }

    const pointers = await Promise.all(
      describedFiles.map(async ({ filename, reason }) => {
        const pointer: AutoBeAnalyzePointer = { value: null };

        const agent = new AutoBeAnalyzeAgent(
          AutoBeAnalyzeReviewer,
          ctx,
          pointer,
          describedFiles.map((el) => el.filename),
        );

        await agent.conversate(
          [
            `# Instruction`,
            `The names of all the files are as follows: ${describedFiles.join(",")}`,
            "Assume that all files are in the same folder. Also, when pointing to the location of a file, go to the relative path.",
            "",
            `Among the various documents, the part you decided to take care of is as follows.: ${filename}`,
            `Only write this document named '${filename}'.`,
            "Never write other documents.",
            "",
            "# User Planning Requirements",
            "```md",
            JSON.stringify(userPlanningRequirements),
            "```",
            "The reason why this document needs to be written is as follows.",
            `- reason: ${reason}`,
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
        prefix,
        files: files,
        step,
        created_at,
        completed_at: new Date().toISOString(),
      };
      ctx.state().analyze = history;
      ctx.histories().push(history);
      ctx.dispatch({
        type: "analyzeComplete",
        prefix,
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

export interface IDeterminingInput {
  /**
   * Prefix for file names and all prisma schema files, table, interface, and
   * variable names. For example, if you were to create a bulletin board
   * service, the prefix would be bbs. At this time, the name of the document
   * would be, for example, 00_bbs_table_of_contents, and bbs would have to be
   * attached to the name of all documents. This value would then be passed to
   * other agents as well, in the form of bbs_article, bbs_article_snapshot, and
   * bbs_comments in the table name. Interfaces will likewise be used in
   * interfaces and tests because they originate from the name of prisma scheme.
   * Do not use prefixes that are related to the technology stack (e.g., ts_,
   * api_, react_) or unnatural prefixes that typically wouldn’t appear in table
   * names or domain models (e.g., zz_, my_, dev_).
   *
   * @title Prefix
   */
  prefix: string;

  /**
   * File name must be English. and it must contains the numbering and prefix.
   *
   * @title file names and reason to create.
   */
  files: Array<Pick<IFile, "filename" | "reason">>;
}

class DeterminingFiles {
  /**
   * Determining the Initial File List.
   *
   * Design a list of initial documents that you need to create for that
   * requirement. The list of documents is determined only by the name of the
   * file. If you determine from the conversation that the user's requirements
   * have not been fully gathered, you must stop the analysis and continue
   * collecting the remaining requirements. In this case, you do not need to
   * generate any files. Simply pass an empty array to `input.files`, which is
   * the input value for the `determine` tool.
   *
   * @param input Prefix and files
   * @returns
   */
  determine(input: IDeterminingInput): IDeterminingInput {
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
