import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
  IAutoBeCompiler,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { forceRetry } from "../../utils/forceRetry";
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
  const start: Date = new Date();
  let complete: number = 0;

  const result: Array<IAutoBeTestWriteResult | null> = await Promise.all(
    /**
     * Generate test code for each scenario. Maps through plans array to create
     * individual test code implementations. Each scenario is processed to
     * generate corresponding test code and progress events.
     */
    scenarios.map(async (scenario) => {
      try {
        const r = await forceRetry(async () => {
          const artifacts: IAutoBeTestScenarioArtifacts =
            await getTestScenarioArtifacts(ctx, scenario);
          const result: IAutoBeTestWriteApplication.IProps = await process(
            ctx,
            scenario,
            artifacts,
          );
          const event: AutoBeTestWriteEvent = {
            type: "testWrite",
            created_at: start.toISOString(),
            location: `test/features/api/${result.domain}/${scenario.functionName}.ts`,
            ...result,
            completed: ++complete,
            total: scenarios.length,
            step: ctx.state().interface?.step ?? 0,
          };
          ctx.dispatch(event);
          return {
            scenario,
            artifacts,
            event,
          };
        });
        return r;
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
 * @returns Promise resolving to IAutoBeTestWriteApplication.IProps containing
 *   the generated test code
 */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
): Promise<IAutoBeTestWriteApplication.IProps> {
  const pointer: IPointer<IAutoBeTestWriteApplication.IProps | null> = {
    value: null,
  };
  const agentica: MicroAgentica<Model> = ctx.createAgent({
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
  });
  await agentica.conversate("Create e2e test functions.").finally(() => {
    const tokenUsage = agentica.getTokenUsage().aggregate;
    ctx.usage().record(tokenUsage, ["test"]);
  });
  if (pointer.value === null) throw new Error("Failed to create test code.");

  const compiler: IAutoBeCompiler = await ctx.compiler();
  pointer.value.final = await compiler.typescript.beautify(pointer.value.final);
  return pointer.value;
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
