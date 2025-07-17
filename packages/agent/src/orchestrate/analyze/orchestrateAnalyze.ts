import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import { v4 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { AutoBeAnalyzePointer } from "./AutoBeAnalyzePointer";
import { orchestrateAnalyzeComposer } from "./orchestrateAnalyzeComposer";
import { IComposeInput } from "./structures/IAutoBeAnalyzeComposerApplication";
import { writeDocumentUntilReviewPassed } from "./writeDocumentUntilReviewPassed";

/** @todo Kakasoo */
export const orchestrateAnalyze =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
    const step: number = ctx.state().analyze?.step ?? 0;
    const created_at: string = new Date().toISOString();
    ctx.dispatch({
      type: "analyzeStart",
      reason: props.reason,
      step,
      created_at,
    });

    const pointer: IPointer<IComposeInput | null> = { value: null };
    const agentica = orchestrateAnalyzeComposer(ctx, pointer);
    const determined = await agentica
      .conversate(
        [
          `Design a complete list of documents and user roles for this project.`,
          `Define user roles that can authenticate via API and create appropriate documentation files.`,
          `You must respect the number of documents specified by the user.`,
        ].join("\n"),
      )
      .finally(() => {
        const tokenUsage = agentica.getTokenUsage();
        ctx.usage().record(tokenUsage, ["analyze"]);
      });
    if (pointer.value === null) {
      return {
        id: v4(),
        text: "Failed to analyze your request. please request again.",
        type: "assistantMessage",
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    const { files: tableOfContents, prefix, roles } = pointer.value;

    if (tableOfContents.length === 0) {
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
      tableOfContents.map(async ({ filename }) => {
        const pointer: AutoBeAnalyzePointer = { value: { files: {} } };
        await writeDocumentUntilReviewPassed(
          ctx,
          pointer,
          tableOfContents,
          filename,
          roles,
          3,
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
        reason: props.reason,
        prefix,
        roles: roles,
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
