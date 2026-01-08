import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashMap, HashSet, IPointer } from "tstl";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioHistory } from "./histories/transformTestScenarioHistory";
import { orchestrateTestScenarioReview } from "./orchestrateTestScenarioReview";
import { AutoBeTestScenarioProgrammer } from "./programmers/AutoBeTestScenarioProgrammer";
import { IAutoBeTestScenarioApplication } from "./structures/IAutoBeTestScenarioApplication";
import { getPrerequisites } from "./utils/getPrerequisites";

/**
 * Orchestrate test scenario generation for all API operations.
 *
 * Following the InterfacePrerequisite pattern:
 *
 * - Generate one scenario per operation in parallel
 * - Review all generated scenarios in parallel
 * - Return final scenarios array
 *
 * @param ctx - AutoBe context
 * @param instruction - E2E-test-specific instructions from requirements
 * @returns Array of reviewed test scenarios
 */
export const orchestrateTestScenario = async (
  ctx: AutoBeContext,
  instruction: string,
): Promise<AutoBeTestScenario[]> => {
  const document: AutoBeOpenApi.IDocument | undefined =
    ctx.state().interface?.document;
  if (document === undefined) {
    throw new Error(
      "Cannot write test scenarios because there are no operations.",
    );
  }

  const dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation> =
    AutoBeTestScenarioProgrammer.associate(document.operations);
  const progress: AutoBeProgressEventBase = {
    total: document.operations.length,
    completed: 0,
  };

  const matrix: AutoBeTestScenario[][] = await executeCachedBatch(
    ctx,
    document.operations.map((operation) => async (promptCacheKey) => {
      try {
        return await process(ctx, {
          dict,
          document,
          operation,
          progress,
          promptCacheKey,
          instruction,
        });
      } catch {
        ++progress.completed;
        return [];
      }
    }),
  );
  const scenarios: AutoBeTestScenario[] = matrix.flat();

  return await orchestrateTestScenarioReview(ctx, {
    dict,
    document,
    scenarios,
    progress: {
      total: scenarios.length,
      completed: 0,
    },
    instruction,
  });
};

/**
 * Process single operation scenario generation.
 *
 * Following InterfacePrerequisite pattern:
 *
 * - Preliminary.orchestrate wrapper
 * - Conversate with controller
 * - Dispatch event
 * - Return scenario
 */
async function process(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    operation: AutoBeOpenApi.IOperation;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
    instruction: string;
  },
): Promise<AutoBeTestScenario[]> {
  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];

  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeTestScenarioApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
    },
    local: {
      interfaceOperations: (() => {
        const unique: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
          AutoBeOpenApiEndpointComparator.hashCode,
          AutoBeOpenApiEndpointComparator.equals,
        );
        unique.insert({
          method: props.operation.method,
          path: props.operation.path,
        });
        for (const pr of getPrerequisites({
          document: props.document,
          endpoint: props.operation,
        }))
          unique.insert(pr.endpoint);
        return unique.toJSON().map((endpoint) => props.dict.get(endpoint));
      })(),
    },
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeTestScenario[] | null> = {
      value: null,
    };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        dict: props.dict,
        operation: props.operation,
        authorizations,
        preliminary,
        build: (scenarios) => {
          // Normalize function name to snake_case
          for (const s of scenarios)
            s.functionName = NamingConvention.snake(s.functionName);
          pointer.value ??= [];
          pointer.value.push(...scenarios);
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformTestScenarioHistory({
        state: ctx.state(),
        operation: props.operation,
        instruction: props.instruction,
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    pointer.value.splice(3);

    // Dispatch event
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      scenarios: pointer.value,
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: ctx.state().interface?.step ?? 0,
      created_at: new Date().toISOString(),
    });
    return out(result)(pointer.value);
  });
}

function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  authorizations: AutoBeInterfaceAuthorization[];
  operation: AutoBeOpenApi.IOperation;
  build: (scenarios: AutoBeTestScenario[]) => void;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
}): IAgenticaController.IClass {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;
    else if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    const errors: IValidation.IError[] = [];
    result.data.request.scenarios.forEach((scenario, i) =>
      AutoBeTestScenarioProgrammer.validate({
        errors,
        dict: props.dict,
        operation: props.operation,
        scenario,
        accessor: `$input.request.scenarios[${i}]`,
      }),
    );

    return errors.length === 0
      ? result
      : {
          success: false,
          data: result.data,
          errors,
        };
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestScenarioApplication>({
      validate: {
        process: validate,
      },
    });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") {
          // Fulfill missing authentication dependencies for each scenario
          for (const scenario of next.request.scenarios) {
            AutoBeTestScenarioProgrammer.fulfill({
              dict: props.dict,
              authorizations: props.authorizations,
              operation: props.operation,
              scenario,
            });
          }
          props.build(next.request.scenarios);
        }
      },
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const SOURCE = "testScenario" satisfies AutoBeEventSource;
