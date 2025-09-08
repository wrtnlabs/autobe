import { IAgenticaController } from "@agentica/core";
import {
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
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
    scenarios.map((scenario) => async (promptCacheKey) => {
      try {
        const artifacts: IAutoBeTestScenarioArtifacts =
          await getTestScenarioArtifacts(ctx, scenario);
        const event: AutoBeTestWriteEvent = await process(ctx, {
          scenario,
          artifacts,
          progress,
          promptCacheKey,
        });
        ctx.dispatch(event);
        return {
          scenario,
          artifacts,
          event,
        };
      } catch {
        console.log(
          "failed to write test code, no function calling happened.",
          scenario.functionName,
        );
        return null;
      }
    }),
  );
  return result.filter((r) => r !== null);
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeTestScenario;
    artifacts: IAutoBeTestScenarioArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const { scenario, artifacts, progress, promptCacheKey } = props;
  const pointer: IPointer<IAutoBeTestWriteApplication.IProps | null> = {
    value: null,
  };
  const { tokenUsage } = await ctx.conversate({
    source: "testWrite",
    histories: await transformTestWriteHistories(ctx, scenario, artifacts),
    controller: createController({
      model: ctx.model,
      build: (next) => {
        next.domain = NamingConvention.snake(next.domain);
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    message: "Create e2e test functions.",
  });
  if (pointer.value === null) {
    ++progress.completed;
    throw new Error("Failed to create test code.");
  }

  pointer.value.revise.final = await completeTestCode(
    ctx,
    artifacts,
    pointer.value.revise.final,
  );
  pointer.value.draft = await completeTestCode(
    ctx,
    artifacts,
    pointer.value.draft,
  );
  return {
    type: "testWrite",
    id: v7(),
    created_at: new Date().toISOString(),
    location: `test/features/api/${pointer.value.domain}/${scenario.functionName}.ts`,
    scenario: pointer.value.scenario,
    domain: pointer.value.domain,
    draft: pointer.value.draft,
    review: pointer.value.revise?.review,
    final: pointer.value.revise?.final,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
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
