import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeCorrectEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { transformRealizeCorrectHistories } from "./histories/transformRealizeCorrectHistories";
import { IAutoBeRealizeCorrectApplication } from "./structures/IAutoBeRealizeCorrectApplication";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export async function orchestrateRealizeCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    authorization: AutoBeRealizeAuthorization | null;
    totalAuthorizations: AutoBeRealizeAuthorization[];
    scenario: IAutoBeRealizeScenarioApplication.IProps;
    code: string;
    diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCorrectEvent> {
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: props.scenario.operation,
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
      scenario: props.scenario,
      artifacts,
      authorization: props.authorization,
      code: props.code,
      diagnostic: props.diagnostic,
      totalAuthorizations: props.totalAuthorizations,
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
    props.authorization?.payload.name,
  );

  const event: AutoBeRealizeCorrectEvent = {
    type: "realizeCorrect",
    id: props.progress.id,
    location: props.scenario.location,
    content: pointer.value.implementationCode,
    tokenUsage,
    completed: ++props.progress.completed,
    total: props.progress.total,
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
