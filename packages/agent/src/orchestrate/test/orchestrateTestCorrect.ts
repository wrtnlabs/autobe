import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { forceRetry } from "../../utils/forceRetry";
import { completeTestCode } from "./compile/completeTestCode";
import { IAutoBeTestCorrectApplication } from "./structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";
import { transformTestCorrectHistories } from "./transformTestCorrectHistories";

export const orchestrateTestCorrect = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  results: IAutoBeTestWriteResult[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent[]> =>
  Promise.all(
    results.map((written) =>
      forceRetry(async () => {
        const event: AutoBeTestValidateEvent = await compile(ctx, written);
        return predicate(ctx, written, event, life);
      }),
    ),
  );

const compile = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  result: IAutoBeTestWriteResult,
): Promise<AutoBeTestValidateEvent> => {
  const compiled: IAutoBeTypeScriptCompileResult =
    await ctx.compiler.test.compile({
      files: {
        ...result.artifacts.dto,
        ...result.artifacts.sdk,
        [result.event.location]: result.event.final,
      },
    });
  return {
    type: "testValidate",
    file: {
      scenario: result.scenario,
      location: result.event.location,
      content: result.event.final,
    },
    result: compiled,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  };
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  ctx.dispatch(event);
  return event.result.type === "failure"
    ? correct(ctx, written, event, life - 1)
    : event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  result: IAutoBeTestWriteResult,
  validate: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (validate.result.type !== "failure") return validate;
  else if (--life <= 0) return validate;

  const pointer: IPointer<IAutoBeTestCorrectApplication.IProps | null> = {
    value: null,
  };
  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
      retry: 4,
    },
    histories: transformTestCorrectHistories(result, validate.result),
    controllers: [
      createApplication({
        model: ctx.model,
        artifacts: result.artifacts,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica
    .conversate(
      "Fix the `AutoBeTest.IFunction` data to resolve the compilation error.",
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["test"]);
    });
  if (pointer.value === null) throw new Error("Failed to modify test code.");

  ctx.dispatch({
    type: "testCorrect",
    created_at: new Date().toISOString(),
    file: validate.file,
    result: validate.result,
    step: ctx.state().analyze?.step ?? 0,
    ...pointer.value,
  });
  validate = await compile(ctx, result);
  return predicate(ctx, result, validate, life);
};

const createApplication = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  artifacts: IAutoBeTestScenarioArtifacts;
  build: (next: IAutoBeTestCorrectApplication.IProps) => void;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Modify Test Code",
    application,
    execute: {
      rewrite: (next) => {
        next.draft = completeTestCode(props.artifacts, next.draft);
        next.final = completeTestCode(props.artifacts, next.final);
        props.build(next);
      },
    } satisfies IAutoBeTestCorrectApplication,
  };
};

const claude = typia.llm.application<
  IAutoBeTestCorrectApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeTestCorrectApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
