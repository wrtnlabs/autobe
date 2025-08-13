import {
  AutoBeRealizeAuthorization,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { forceRetry } from "../../utils/forceRetry";
import { getTestScenarioArtifacts } from "../test/compile/getTestScenarioArtifacts";
import { IAutoBeTestScenarioArtifacts } from "../test/structures/IAutoBeTestScenarioArtifacts";
import { transformRealizeWriteHistories } from "./histories/transformRealizeWriteHistories";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";
import { IAutoBeRealizeWriteApplication } from "./structures/IAutoBeRealizeWriteApplication";
import { replaceImportStatements } from "./utils/replaceImportStatements";

export const orchestrateRealizeWrite = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization | null,
  scenario: IAutoBeRealizeScenarioApplication.IProps,
  progress: IProgress,
): Promise<AutoBeRealizeWriteEvent> =>
  forceRetry(() => orhcestrate(ctx, authorization, scenario, progress));

async function orhcestrate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorization: AutoBeRealizeAuthorization | null,
  scenario: IAutoBeRealizeScenarioApplication.IProps,
  progress: IProgress,
): Promise<AutoBeRealizeWriteEvent> {
  const artifacts: IAutoBeTestScenarioArtifacts =
    await getTestScenarioArtifacts(ctx, {
      endpoint: scenario.operation,
      dependencies: [],
    });
  const pointer: IPointer<IAutoBeRealizeWriteApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "realizeWrite",
    histories: transformRealizeWriteHistories({
      state: ctx.state(),
      scenario,
      artifacts,
      authorization,
    }),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: [
      `Write complete, production-ready TypeScript code that strictly follows these rules:`,
      "",
      `1. Do **not** use the native \`Date\` type anywhere.`,
      `2. All date or datetime values must be written as \`string & tags.Format<'date-time'>\`.`,
      `3. UUIDs must be generated using \`v4()\` and typed as \`string & tags.Format<'uuid'>\`.`,
      `4. Do not use \`as\` for type assertions — resolve types properly.`,
      `5. All functions must be fully typed with clear parameter and return types.`,
      `6. Do not skip validations or default values where necessary.`,
      `7. Follow functional, immutable, and consistent code structure.`,
      "",
      `Use \`@nestia/e2e\` test structure if relevant.`,
    ].join("\n"),
  });
  if (pointer.value === null) throw new Error("Failed to write code.");

  pointer.value.implementationCode = await replaceImportStatements(ctx)(
    artifacts,
    pointer.value.implementationCode,
  );

  const event: AutoBeRealizeWriteEvent = {
    type: "realizeWrite",
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
  build: (next: IAutoBeRealizeWriteApplication.IProps) => void;
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
      coding: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeRealizeWriteApplication,
  };
}

const claude = typia.llm.application<
  IAutoBeRealizeWriteApplication,
  "claude"
>();
const collection = {
  chatgpt: typia.llm.application<IAutoBeRealizeWriteApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

export interface IProgress {
  total: number;
  completed: number;
}
