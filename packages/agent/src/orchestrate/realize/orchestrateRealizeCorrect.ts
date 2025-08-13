import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { forceRetry } from "../../utils/forceRetry";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { transformRealizeCorrectHistories } from "./histories/transformRealizeCorrectHistories";
import { IAutoBeRealizeCorrectApplication } from "./structures/IAutoBeRealizeReviewApplication";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export const orchestrateRealizeCorrect = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization | null,
  scenario: IAutoBeRealizeScenarioApplication.IProps,
  code: string,
  diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic,
  progress: IProgress,
): Promise<AutoBeRealizeCorrectEvent> =>
  forceRetry(() =>
    orchestrate(ctx, authorization, scenario, code, diagnostic, progress),
  );

async function orchestrate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization | null,
  scenario: IAutoBeRealizeScenarioApplication.IProps,
  code: string,
  diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic,
  progress: IProgress,
): Promise<AutoBeRealizeCorrectEvent> {
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: scenario.operation,
      dependencies: [],
    });

  const pointer: IPointer<IAutoBeRealizeCorrectApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "realizeCorrect",
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    histories: transformRealizeCorrectHistories({
      state: ctx.state(),
      scenario,
      artifacts,
      authorization,
      code,
      diagnostic,
    }),
    enforceFunctionCall: true,
    message: [
      `Correct the TypeScript code implementation to strictly follow these rules:`,
      `1. Ensure that the code is production-ready and follows best practices.`,
    ].join("\n"),
  });

  if (pointer.value === null)
    throw new Error("Failed to correct implementation code.");

  pointer.value.implementationCode = await replaceImportStatements(ctx)(
    artifacts,
    pointer.value.implementationCode,
    authorization?.payload.name,
  );

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    location: scenario.location,
    content: pointer.value.implementationCode,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  };
  ctx.dispatch(event);
  return event;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeRealizeCorrectApplication.IProps) => void;
}): ILlmController<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "Write code",
    application,
    execute: {
      review: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeCorrectApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeCorrectApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeRealizeCorrectApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

export interface IProgress {
  total: number;
  completed: number;
}
