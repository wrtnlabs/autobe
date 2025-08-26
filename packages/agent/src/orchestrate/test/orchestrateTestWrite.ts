import { IAgenticaController } from "@agentica/core";
import {
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { completeTestCode } from "./compile/completeTestCode";
import { getTestScenarioArtifacts } from "./compile/getTestScenarioArtifacts";
import { transformTestWriteHistories } from "./histories/transformTestWriteHistories";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteApplication } from "./structures/IAutoBeTestWriteApplication";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export async function orchestrateTestWrite<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTestScenario[],
): Promise<IAutoBeTestWriteResult[]> {
  const progress: AutoBeProgressEventBase = {
    total: scenarios.length,
    completed: 0,
  };
  const result: Array<IAutoBeTestWriteResult | null> = await executeCachedBatch(
    /**
     * Generate test code for each scenario. Maps through plans array to create
     * individual test code implementations. Each scenario is processed to
     * generate corresponding test code and progress events.
     */
    scenarios.map((scenario) => async () => {
      try {
        const artifacts: IAutoBeTestScenarioArtifacts =
          await getTestScenarioArtifacts(ctx, scenario);
        const event: AutoBeTestWriteEvent = await process({
          ctx,
          scenario,
          artifacts,
          progress,
        });
        ctx.dispatch(event);
        return {
          scenario,
          artifacts,
          event,
        };
      } catch {
        return null;
      }
    }),
  );
  return result.filter((r) => r !== null);
}

/**
 * Process function that generates test code for each individual scenario. Takes
 * the AutoBeContext and scenario information as input and uses MicroAgentica to
 * generate appropriate test code through LLM interaction.
 *
 * @param ctx - The AutoBeContext containing model, vendor and configuration
 * @param scenario - The test scenario information to generate code for
 * @param artifacts - The artifacts containing the reference files and schemas
 */
async function process<Model extends ILlmSchema.Model>(props: {
  ctx: AutoBeContext<Model>;
  scenario: AutoBeTestScenario;
  artifacts: IAutoBeTestScenarioArtifacts;
  progress: AutoBeProgressEventBase;
}): Promise<AutoBeTestWriteEvent> {
  const { ctx, scenario, artifacts, progress } = props;
  const pointer: IPointer<IAutoBeTestWriteApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testWrite",
    histories: transformTestWriteHistories(scenario, artifacts),
    controller: createController({
      model: ctx.model,
      artifacts,
      build: (next) => {
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    message: "Create e2e test functions.",
  });
  if (pointer.value === null) throw new Error("Failed to create test code.");

  const compiler: IAutoBeCompiler = await ctx.compiler();
  pointer.value.final = await compiler.typescript.beautify(pointer.value.final);
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    location: `test/features/api/${pointer.value.domain}/${scenario.functionName}.ts`,
    ...pointer.value,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  artifacts: IAutoBeTestScenarioArtifacts;
  build: (next: IAutoBeTestWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Create Test Code",
    application,
    execute: {
      write: (next) => {
        next.draft = completeTestCode(props.artifacts, next.draft);
        next.final = completeTestCode(props.artifacts, next.final);
        props.build(next);
      },
    } satisfies IAutoBeTestWriteApplication,
  };
}

const claude = typia.llm.application<IAutoBeTestWriteApplication, "claude">();
const collection = {
  chatgpt: typia.llm.application<IAutoBeTestWriteApplication, "chatgpt">(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IAutoBeTestWriteApplication, "3.0">(),
};
