import { IAgenticaController } from "@agentica/core";
import {
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../utils/validateEmptyCode";
import { completeTestCode } from "./compile/completeTestCode";
import { getTestScenarioArtifacts } from "./compile/getTestScenarioArtifacts";
import { transformTestWriteHistories } from "./histories/transformTestWriteHistories";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteApplication } from "./structures/IAutoBeTestWriteApplication";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";

export async function orchestrateTestWrite<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    scenarios: AutoBeTestScenario[];
  },
): Promise<IAutoBeTestWriteResult[]> {
  const progress: AutoBeProgressEventBase = {
    total: props.scenarios.length,
    completed: 0,
  };
  const result: Array<IAutoBeTestWriteResult | null> = await executeCachedBatch(
    /**
     * Generate test code for each scenario. Maps through plans array to create
     * individual test code implementations. Each scenario is processed to
     * generate corresponding test code and progress events.
     */
    props.scenarios.map((scenario) => async (promptCacheKey) => {
      try {
        const artifacts: IAutoBeTestScenarioArtifacts =
          await getTestScenarioArtifacts(ctx, scenario);
        const event: AutoBeTestWriteEvent = await process(ctx, {
          scenario,
          artifacts,
          progress,
          promptCacheKey,
          instruction: props.instruction,
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

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    scenario: AutoBeTestScenario;
    artifacts: IAutoBeTestScenarioArtifacts;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestWriteEvent> {
  const { scenario, artifacts, progress, promptCacheKey } = props;
  const pointer: IPointer<IAutoBeTestWriteApplication.IProps | null> = {
    value: null,
  };
  const { metric, tokenUsage } = await ctx.conversate({
    source: "testWrite",
    controller: createController({
      model: ctx.model,
      functionName: props.scenario.functionName,
      build: (next) => {
        next.domain = NamingConvention.snake(next.domain);
        pointer.value = next;
      },
    }),
    enforceFunctionCall: true,
    promptCacheKey,
    ...await transformTestWriteHistories(ctx, {
      scenario,
      artifacts,
      instruction: props.instruction,
    }),
  });
  if (pointer.value === null) {
    ++progress.completed;
    throw new Error("Failed to create test code.");
  }

  if (pointer.value.revise.final)
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
    final: pointer.value.revise?.final ?? undefined,
    metric,
    tokenUsage,
    completed: ++progress.completed,
    total: progress.total,
    step: ctx.state().interface?.step ?? 0,
  } satisfies AutoBeTestWriteEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  functionName: string;
  build: (next: IAutoBeTestWriteApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestWriteApplication.IProps> =
      typia.validate<IAutoBeTestWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = validateEmptyCode({
      functionName: props.functionName,
      draft: result.data.draft,
      revise: result.data.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
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

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteApplication, "chatgpt">({
      validate: {
        write: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteApplication, "claude">({
      validate: {
        write: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestWriteApplication, "gemini">({
      validate: {
        write: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestWriteApplication.IProps>;
