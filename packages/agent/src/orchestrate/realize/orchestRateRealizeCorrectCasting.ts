import {
  AutoBeProgressEventBase,
  AutoBeRealizeFunction,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformCommonCorrectCastingHistories } from "../common/histories/transformCommonCorrectCastingHistories";
import { IAutoBeCommonCorrectCastingApplication } from "../common/structures/IAutoBeCommonCorrectCastingApplication";

export const orchestrateRealizeCorrectCasting = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  func: AutoBeRealizeFunction,
  progress: AutoBeProgressEventBase,
): Promise<AutoBeRealizeFunction> => {
  const pointer: IPointer<
    IAutoBeCommonCorrectCastingApplication.IProps | false | null
  > = {
    value: null,
  };

  const { tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    histories: transformCommonCorrectCastingHistories([]),
    controller: createController({
      model: ctx.model,
      then: (next) => {
        pointer.value = next;
      },
      reject: () => {
        pointer.value = false;
      },
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Fix the TypeScript casting problems to resolve the compilation error.

      You don't need to explain me anything, but just fix or give it up 
      immediately without any hesitation, explanation, and questions.
  `,
  });
  if (pointer.value === null) throw new Error("Failed to correct test code.");
  else if (pointer.value === false) return func;

  ctx.dispatch({
    id: v7(),
    type: "realizeCorrect",
    content: pointer.value.revise.final,
    created_at: new Date().toISOString(),
    location: func.location,
    step: ctx.state().analyze?.step ?? 0,
    tokenUsage,
    completed: progress.completed,
    total: progress.total,
  });

  return { ...func, content: pointer.value.revise.final };
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "correctInvalidRequest",
    application,
    execute: {
      rewrite: (next) => {
        props.then(next);
      },
      reject: () => {
        props.reject();
      },
    } satisfies IAutoBeCommonCorrectCastingApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "claude"
  >(),
};
