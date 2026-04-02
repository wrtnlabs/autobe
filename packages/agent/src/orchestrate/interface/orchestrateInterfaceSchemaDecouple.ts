import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeInterfaceSchemaDecoupleEvent,
  AutoBeOpenApi,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { transformInterfaceSchemaDecoupleHistory } from "./histories/transformInterfaceSchemaDecoupleHistory";
import { AutoBeInterfaceSchemaDecoupleProgrammer } from "./programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import { IAutoBeInterfaceSchemaDecoupleApplication } from "./structures/IAutoBeInterfaceSchemaDecoupleApplication";
import { fulfillJsonSchemaErrorMessages } from "./utils/fulfillJsonSchemaErrorMessages";

/**
 * Detect and resolve cross-type circular references in schemas.
 *
 * 1. Programmatically detect cycles using Tarjan's SCC algorithm
 * 2. If no cycles, return immediately (no LLM call)
 * 3. Call LLM to decide which edges to cut
 * 4. Execute removals by deleting properties from schemas
 *
 * Mutates `props.schemas` in-place.
 */
export const orchestrateInterfaceSchemaDecouple = async (
  ctx: AutoBeContext,
  props: {
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  },
): Promise<void> => {
  // 1. Detect cycles programmatically
  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(props.schemas);

  // 2. No cycles → nothing to do
  if (cycles.length === 0) return;

  // 3. Call LLM to decide which edges to cut
  const pointer: IPointer<IAutoBeInterfaceSchemaDecoupleApplication.IComplete | null> =
    { value: null };

  const result: AutoBeContext.IResult = await ctx.conversate({
    source: SOURCE,
    controller: createController({
      schemas: props.schemas,
      cycles,
      pointer,
    }),
    enforceFunctionCall: true,
    ...transformInterfaceSchemaDecoupleHistory({
      schemas: props.schemas,
      cycles,
    }),
  });

  if (pointer.value === null)
    throw new Error(
      "interfaceSchemaDecouple: agent failed to produce a result",
    );

  // 4. Execute removals
  AutoBeInterfaceSchemaDecoupleProgrammer.execute(
    props.schemas,
    pointer.value.removals,
  );

  // 5. Emit event
  ctx.dispatch({
    type: SOURCE,
    id: v7(),
    cycles,
    removals: pointer.value.removals,
    analysis: pointer.value.analysis,
    metric: result.metric,
    tokenUsage: result.tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
    created_at: new Date().toISOString(),
  } satisfies AutoBeInterfaceSchemaDecoupleEvent);
};

function createController(props: {
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  cycles: AutoBeInterfaceSchemaDecoupleCycle[];
  pointer: IPointer<IAutoBeInterfaceSchemaDecoupleApplication.IComplete | null>;
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
      cycles: props.cycles,
      removals: result.data.request.removals,
      errors,
      path: "$input.request",
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
    cycles: props.cycles,
  });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceSchemaDecoupleApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceSchemaDecoupleApplication.IProps>;

const SOURCE = "interfaceSchemaDecouple" satisfies AutoBeEventSource;
