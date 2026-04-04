import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeInterfaceSchemaDecoupleEvent,
  AutoBeInterfaceSchemaDecoupleRemoval,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { IPointer, Singleton } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformInterfaceSchemaDecoupleHistory } from "./histories/transformInterfaceSchemaDecoupleHistory";
import { AutoBeInterfaceSchemaDecoupleProgrammer } from "./programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import { IAutoBeInterfaceSchemaDecoupleApplication } from "./structures/IAutoBeInterfaceSchemaDecoupleApplication";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

/**
 * Detect and resolve cross-type circular references in schemas.
 *
 * Uses a while loop with parallel processing per round:
 *
 * - Each round: detect remaining cycles → process ALL in parallel (one LLM call
 *   per cycle) → re-detect → repeat until no cycles remain.
 *
 * WHY parallel within a round: Tarjan's SCCs are mathematically disjoint. Two
 * detected SCCs share no nodes, so fixing SCC-A never creates or destroys edges
 * in SCC-B. Parallel execution is safe.
 *
 * WHY while loop across rounds: a large SCC (3+ nodes with multiple independent
 * internal cycles) may not be fully resolved in one pass — validate only
 * requires "at least one edge removed" per SCC. After that partial fix, the SCC
 * may split into smaller cycles that re-detect in the next round. Convergence
 * is guaranteed: each round removes ≥1 edge, so the total cycle-edge count
 * decreases monotonically to zero.
 *
 * Mutates `props.schemas` in-place. Dispatches one event per cycle.
 */
export const orchestrateInterfaceSchemaDecouple = async (
  ctx: AutoBeContext,
  props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    operations: AutoBeOpenApi.IOperation[];
  },
): Promise<void> => {
  const progress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  while (true) {
    const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
      AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(props.schemas);
    if (cycles.length === 0) break;

    progress.total += cycles.length;
    await executeCachedBatch(
      ctx,
      cycles.map((c) => async (promptCacheKey) => {
        const counter = new Singleton(() => ++progress.completed);
        try {
          return await process(ctx, {
            schemas: props.schemas,
            operations: props.operations,
            cycle: c,
            progress,
            counter,
            promptCacheKey,
          });
        } catch (error) {
          counter.get();
          throw error;
        }
      }),
    );
  }
};

async function process(
  ctx: AutoBeContext,
  props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    operations: AutoBeOpenApi.IOperation[];
    cycle: AutoBeInterfaceSchemaDecoupleCycle;
    progress: AutoBeProgressEventBase;
    counter: Singleton<number>;
    promptCacheKey: string;
  },
): Promise<void> {
  const pointer: IPointer<IAutoBeInterfaceSchemaDecoupleApplication.IProps | null> =
    { value: null };

  const result: AutoBeContext.IResult = await ctx.conversate({
    source: SOURCE,
    controller: createController({
      schemas: props.schemas,
      cycle: props.cycle,
      pointer,
    }),
    enforceFunctionCall: true,
    promptCacheKey: props.promptCacheKey,
    ...transformInterfaceSchemaDecoupleHistory({
      schemas: props.schemas,
      operations: props.operations,
      cycle: props.cycle,
    }),
  });

  if (pointer.value === null)
    throw new Error(
      "interfaceSchemaDecouple: agent failed to produce a result",
    );

  // Apply removal decision to the schema
  const removal: AutoBeInterfaceSchemaDecoupleRemoval =
    pointer.value.final ?? pointer.value.draft;
  AutoBeInterfaceSchemaDecoupleProgrammer.execute({
    schemas: props.schemas,
    removal,
  });

  // Emit per-cycle event
  ctx.dispatch({
    type: SOURCE,
    id: v7(),
    cycle: props.cycle,
    removal,
    analysis: pointer.value.review,
    metric: result.metric,
    tokenUsage: result.tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    total: props.progress.total,
    completed: props.counter.get(),
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemaDecoupleEvent);
}

function createController(props: {
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  cycle: AutoBeInterfaceSchemaDecoupleCycle;
  pointer: IPointer<IAutoBeInterfaceSchemaDecoupleApplication.IProps | null>;
}): IAgenticaController.IClass {
  const validate: Validator = (next) => {
    const result =
      typia.validate<IAutoBeInterfaceSchemaDecoupleApplication.IProps>(next);
    if (result.success === false) {
      fulfillJsonSchemaErrorMessages(result.errors);
      return result;
    }

    const errors: IValidation.IError[] = [];
    AutoBeInterfaceSchemaDecoupleProgrammer.validate({
      schemas: props.schemas,
      cycle: props.cycle,
      removal: result.data.final ?? result.data.draft,
      errors,
      path: "$input",
    });

    return errors.length
      ? { success: false, errors, data: result.data }
      : result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeInterfaceSchemaDecoupleApplication>({
      validate: {
        process: validate,
      },
    });
  AutoBeInterfaceSchemaDecoupleProgrammer.fixApplication({
    application,
    cycle: props.cycle,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        props.pointer.value = input;
      },
    } satisfies IAutoBeInterfaceSchemaDecoupleApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaDecoupleApplication.IProps>;

const SOURCE = "interfaceSchemaDecouple" satisfies AutoBeEventSource;
