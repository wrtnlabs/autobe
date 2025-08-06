import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestValidateEvent,
  IAutoBeCompiler,
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
import { transformTestCorrectHistories } from "./histories/transformTestCorrectHistories";
import { IAutoBeTestCorrectApplication } from "./structures/IAutoBeTestCorrectApplication";
import { IAutoBeTestFunction } from "./structures/IAutoBeTestFunction";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export const orchestrateTestCorrect = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  writeResult: IAutoBeTestWriteResult[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent[]> => {
  const result: Array<AutoBeTestValidateEvent | null> = await Promise.all(
    writeResult.map(async (w) => {
      try {
        return await forceRetry(async () => {
          const event: AutoBeTestValidateEvent = await compile(ctx, {
            artifacts: w.artifacts,
            scenario: w.scenario,
            location: w.event.location,
            script: w.event.final,
          });
          return predicate(
            ctx,
            {
              artifacts: w.artifacts,
              scenario: w.scenario,
              location: w.event.location,
              script: w.event.final,
            },
            event,
            life,
          );
        });
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
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> => {
  if (event.result.type === "failure") ctx.dispatch(event);
  return event.result.type === "failure"
    ? correct(ctx, content, event, life - 1)
    : event;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  content: IAutoBeTestFunction,
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
    histories: transformTestCorrectHistories(content, validate.result),
    controllers: [
      createApplication({
        model: ctx.model,
        artifacts: content.artifacts,
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
      const tokenUsage = agentica.getTokenUsage().aggregate;
      ctx.usage().record(tokenUsage, ["test"]);
    });
  if (pointer.value === null) throw new Error("Failed to modify test code.");

  const compiler: IAutoBeCompiler = await ctx.compiler();
  pointer.value.final = await compiler.typescript.beautify(pointer.value.final);

  ctx.dispatch({
    type: "testCorrect",
    created_at: new Date().toISOString(),
    file: validate.file,
    result: validate.result,
    step: ctx.state().analyze?.step ?? 0,
    ...pointer.value,
  });
  const newContent: IAutoBeTestFunction = {
    ...content,
    script: pointer.value.final,
  };
  const newValidate: AutoBeTestValidateEvent = await compile(ctx, newContent);
  return predicate(ctx, newContent, newValidate, life);
};

const createApplication = <Model extends ILlmSchema.Model>(props: {
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
