import { IAgenticaController } from "@agentica/core";
import {
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { completeTestCode } from "./compile/completeTestCode";
import { transformTestCorrectHistories } from "./histories/transformTestCorrectHistories";
import { IAutoBeTestCorrectApplication } from "./structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestFunction } from "./structures/IAutoBeTestFunction";
import { IAutoBeTestFunctionFailure } from "./structures/IAutoBeTestFunctionFailure";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const orchestrateTestCorrect = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  writeResult: IAutoBeTestWriteResult[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent[]> => {
  const result: Array<AutoBeTestValidateEvent | null> =
    await executeCachedBatch(
      writeResult.map((w) => async () => {
        try {
          const event: AutoBeTestValidateEvent = await compile(ctx, {
            artifacts: w.artifacts,
            scenario: w.scenario,
            location: w.event.location,
            script: w.event.final ?? w.event.draft,
          });
          return await predicate(
            ctx,
            {
              artifacts: w.artifacts,
              scenario: w.scenario,
              location: w.event.location,
              script: w.event.final ?? w.event.draft,
            },
            [],
            event,
            life,
          );
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
};

const compile = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  func: IAutoBeTestFunction,
): Promise<AutoBeTestValidateEvent> => {
  const compiler: IAutoBeCompiler = await ctx.compiler();
  const result: IAutoBeTypeScriptCompileResult = await compiler.test.compile({
    files: {
      ...func.artifacts.dto,
      ...func.artifacts.sdk,
      [func.location]: func.script,
    },
  });
  return {
    type: "testValidate",
    id: v7(),
    file: {
      scenario: func.scenario,
      location: func.location,
      content: func.script,
    },
    result,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  };
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  content: IAutoBeTestFunction,
  failures: IAutoBeTestFunctionFailure[],
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") ctx.dispatch(event);
  return event.result.type === "failure"
    ? await correct(ctx, content, failures, event, life - 1)
    : event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  content: IAutoBeTestFunction,
  failures: IAutoBeTestFunctionFailure[],
  validate: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (validate.result.type !== "failure") return validate;
  else if (--life <= 0) return validate;

  const pointer: IPointer<IAutoBeTestCorrectApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testCorrect",
    histories: await transformTestCorrectHistories(ctx, content, [
      ...failures,
      {
        function: content,
        failure: validate.result,
      },
    ]),
    controller: createController({
      model: ctx.model,
      artifacts: content.artifacts,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: StringUtil.trim`
      Fix the AutoBeTest.IFunction data to resolve the compilation error.

      You don't need to explain me anything, but just fix it immediately
      without any hesitation, explanation, and questions.
    `,
  });
  if (pointer.value === null) throw new Error("Failed to modify test code.");

  const compiler: IAutoBeCompiler = await ctx.compiler();
  if (pointer.value.revise)
    pointer.value.revise.final = await compiler.typescript.beautify(
      pointer.value.revise.final,
    );
  else
    pointer.value.draft = await compiler.typescript.beautify(
      pointer.value.draft,
    );

  ctx.dispatch({
    type: "testCorrect",
    id: v7(),
    created_at: new Date().toISOString(),
    file: validate.file,
    result: validate.result,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    think: pointer.value.think,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final,
  });
  const newContent: IAutoBeTestFunction = {
    ...content,
    script: pointer.value.revise?.final ?? pointer.value.draft,
  };
  const newValidate: AutoBeTestValidateEvent = await compile(ctx, newContent);
  return predicate(
    ctx,
    newContent,
    [
      ...failures,
      {
        function: content,
        failure: validate.result,
      },
    ],
    newValidate,
    life,
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  artifacts: IAutoBeTestScenarioArtifacts;
  build: (next: IAutoBeTestCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Modify Test Code",
    application,
    execute: {
      rewrite: (next) => {
        next.draft = completeTestCode(props.artifacts, next.draft);
        if (next.revise)
          next.revise.final = completeTestCode(
            props.artifacts,
            next.revise.final,
          );
        props.build(next);
      },
    } satisfies IAutoBeTestCorrectApplication,
  };
};

const claude = typia.llm.application<IAutoBeTestCorrectApplication, "claude">();
const collection = {
  chatgpt: typia.llm.application<IAutoBeTestCorrectApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
