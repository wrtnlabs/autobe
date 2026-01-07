import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioReviewHistory } from "./histories/transformTestScenarioReviewHistory";
import { IAutoBeTestScenarioReviewApplication } from "./structures/IAutoBeTestScenarioReviewApplication";

/**
 * Orchestrate test scenario review for a single scenario.
 *
 * Reviews and potentially improves a single test scenario by validating:
 * - Authentication correctness (authorizationActor alignment)
 * - Dependency completeness (all prerequisites included)
 * - Execution order (proper sequencing)
 * - Business logic coverage
 *
 * @param ctx - AutoBe context for LLM interactions and state management
 * @param props - Review configuration
 * @param props.preliminary - Controller for RAG-based data retrieval
 * @param props.scenario - Single test scenario to review
 * @param props.progress - Progress tracking for batch operations
 * @param props.instruction - E2E-test-specific instructions from requirements
 * @returns Improved scenario if changes needed, original scenario otherwise
 */
export const orchestrateTestScenarioReview = async (
  ctx: AutoBeContext,
  props: {
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
    >;
    scenario: AutoBeTestScenario;
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<AutoBeTestScenario> => {
  try {
    return await process(ctx, props);
  } catch {
    // On error, return original scenario unchanged
    props.progress.completed += 1;
    return props.scenario;
  }
};

/**
 * Process single scenario review with LLM agent.
 *
 * Executes the review workflow:
 * 1. Provides scenario and prerequisites to review agent
 * 2. Agent analyzes for correctness issues
 * 3. Agent returns review/plan and optionally improved scenario
 * 4. Dispatches review event with results
 *
 * @param ctx - AutoBe context
 * @param props - Review configuration with scenario
 * @returns Improved scenario or original if no improvements needed
 */
const process = (
  ctx: AutoBeContext,
  props: {
    preliminary: AutoBePreliminaryController<
      "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
    >;
    scenario: AutoBeTestScenario;
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<AutoBeTestScenario> =>
  props.preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeTestScenarioReviewApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        originalScenario: props.scenario,
        pointer,
        preliminary: props.preliminary,
      }),
      enforceFunctionCall: true,
      ...transformTestScenarioReviewHistory({
        state: ctx.state(),
        scenario: props.scenario,
        instruction: props.instruction,
        preliminary: props.preliminary,
      }),
    });

    // If no response received, return original scenario
    if (pointer.value === null) return out(result)(props.scenario);

    // Update progress
    props.progress.completed += 1;
    props.progress.total = Math.max(props.progress.total, props.progress.completed);

    // Determine the final scenario: use improved if provided, otherwise original
    const finalScenario: AutoBeTestScenario = pointer.value.scenario ?? props.scenario;

    // Dispatch review event
    ctx.dispatch({
      type: SOURCE,
      id: v7(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      total: props.progress.total,
      completed: props.progress.completed,
      scenarios: [finalScenario],
      step: ctx.state().interface?.step ?? 0,
      created_at: new Date().toISOString(),
    });

    return out(result)(finalScenario);
  });

/**
 * Create function calling controller for test scenario review.
 *
 * Sets up the LLM application interface with validation and execution logic.
 * The controller handles:
 * - Validating review responses against TypeScript types
 * - Processing preliminary data requests (analysisFiles, interfaceOperations, interfaceSchemas)
 * - Capturing final review results in pointer
 *
 * @param props - Controller configuration
 * @param props.pointer - Mutable pointer to store review result
 * @param props.originalScenario - Original scenario for reference/fallback
 * @param props.preliminary - Controller for preliminary data requests
 * @returns Agentica controller instance for LLM function calling
 */
const createController = (props: {
  pointer: IPointer<IAutoBeTestScenarioReviewApplication.IComplete | null>;
  originalScenario: AutoBeTestScenario;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
}): IAgenticaController.IClass => {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioReviewApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioReviewApplication.IProps> =
      typia.validate<IAutoBeTestScenarioReviewApplication.IProps>(next);

    // Validation failed at type level
    if (result.success === false) return result;

    // Preliminary request (getAnalysisFiles, getInterfaceOperations, getInterfaceSchemas)
    // Delegate validation to preliminary controller
    if (result.data.request.type !== "complete") {
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });
    }

    // Complete request validation
    // If scenario is provided, validate it matches the original endpoint
    if (result.data.request.scenario !== null) {
      const errors: IValidation.IError[] = [];

      const improved = result.data.request.scenario;
      const original = props.originalScenario;

      // Validate endpoint consistency
      if (
        improved.endpoint.method !== original.endpoint.method ||
        improved.endpoint.path !== original.endpoint.path
      ) {
        errors.push({
          value: improved.endpoint,
          path: "$input.request.scenario.endpoint",
          expected: "AutoBeOpenApi.IEndpoint",
          description: `Improved scenario endpoint must match original endpoint: ${original.endpoint.method} ${original.endpoint.path}`,
        });
      }

      // Validate functionName consistency
      if (improved.functionName !== original.functionName) {
        errors.push({
          value: improved.functionName,
          path: "$input.request.scenario.functionName",
          expected: "string",
          description: `Improved scenario functionName must match original: ${original.functionName}`,
        });
      }

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          data: result.data,
        };
      }
    }

    return result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestScenarioReviewApplication>({
      validate: {
        process: validate,
      },
    });

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        // Capture complete request in pointer for return value extraction
        if (input.request.type === "complete") {
          props.pointer.value = input.request;
        }
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
};

const SOURCE = "testScenarioReview" satisfies AutoBeEventSource;
