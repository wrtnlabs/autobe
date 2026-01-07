import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestScenarioReviewEvent,
} from "@autobe/interface";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { HashMap, IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformTestScenarioReviewHistory } from "./histories/transformTestScenarioReviewHistory";
import { IAutoBeTestScenarioReviewApplication } from "./structures/IAutoBeTestScenarioReviewApplication";

/**
 * Orchestrate test scenario review for multiple scenarios in parallel.
 *
 * Reviews each test scenario individually using executeCachedBatch for optimal
 * performance. Each scenario is validated for:
 * - Authentication correctness (authorizationActor alignment)
 * - Dependency completeness (all prerequisites included)
 * - Execution order (proper sequencing)
 * - Business logic coverage
 *
 * @param ctx - AutoBe context for LLM interactions and state management
 * @param props - Review configuration
 * @param props.dict - Endpoint to operation lookup map
 * @param props.document - Complete OpenAPI document
 * @param props.scenarios - Array of test scenarios to review
 * @param props.progress - Progress tracking for batch operations
 * @param props.instruction - E2E-test-specific instructions from requirements
 * @returns Array of review events (null entries filtered out)
 */
export async function orchestrateTestScenarioReview(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    scenarios: AutoBeTestScenario[];
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<AutoBeTestScenarioReviewEvent[]> {
  const result: Array<AutoBeTestScenarioReviewEvent | null> =
    await executeCachedBatch(
      ctx,
      props.scenarios.map((scenario) => async (promptCacheKey) => {
        try {
          return await process(ctx, {
            dict: props.dict,
            document: props.document,
            scenario,
            progress: props.progress,
            instruction: props.instruction,
            promptCacheKey,
          });
        } catch {
          return null;
        }
      }),
    );
  return result.filter((r) => r !== null);
}

/**
 * Process single scenario review with LLM agent.
 *
 * Executes the review workflow:
 * 1. Provides scenario and prerequisites to review agent
 * 2. Agent analyzes for correctness issues
 * 3. Agent returns improved scenario or null
 * 4. Creates and dispatches review event
 *
 * @param ctx - AutoBe context
 * @param props - Review configuration with single scenario
 * @returns Review event or null if review failed
 */
async function process(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    scenario: AutoBeTestScenario;
    progress: AutoBeProgressEventBase;
    instruction: string;
    promptCacheKey: string;
  },
): Promise<AutoBeTestScenarioReviewEvent | null> {
  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application:
      typia.json.application<IAutoBeTestScenarioReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeTestScenario | null> = {
      value: null,
    };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        dict: props.dict,
        scenario: props.scenario,
        preliminary,
        build: (improved) => {
          pointer.value = improved;
        },
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...transformTestScenarioReviewHistory({
        state: ctx.state(),
        scenario: props.scenario,
        instruction: props.instruction,
        preliminary,
      }),
    });

    // Create event with original and improved scenarios
    const event: AutoBeTestScenarioReviewEvent = {
      type: SOURCE,
      id: v7(),
      created_at: new Date().toISOString(),
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      endpoint: props.scenario.endpoint,
      original: props.scenario,
      improved: pointer.value,
      total: props.progress.total,
      completed: ++props.progress.completed,
      step: ctx.state().interface?.step ?? 0,
    };

    ctx.dispatch(event);
    return out(result)(event);
  });
}

/**
 * Create function calling controller for test scenario review.
 *
 * Sets up the LLM application interface with validation and execution logic.
 * The controller handles:
 * - Validating review responses against TypeScript types
 * - Processing preliminary data requests (analysisFiles, interfaceOperations, interfaceSchemas)
 * - Capturing improved scenario in build callback
 *
 * @param props - Controller configuration
 * @param props.dict - Endpoint to operation lookup map
 * @param props.scenario - Original scenario being reviewed
 * @param props.preliminary - Controller for preliminary data requests
 * @param props.build - Callback to capture improved scenario
 * @returns Agentica controller instance for LLM function calling
 */
function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  scenario: AutoBeTestScenario;
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
  build: (improved: AutoBeTestScenario | null) => void;
}): IAgenticaController.IClass {
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
    const errors: IValidation.IError[] = [];

    // Validate endpoint matches original
    const complete = result.data.request;
    if (
      complete.endpoint.method !== props.scenario.endpoint.method ||
      complete.endpoint.path !== props.scenario.endpoint.path
    ) {
      errors.push({
        value: complete.endpoint,
        path: "$input.request.endpoint",
        expected: "AutoBeOpenApi.IEndpoint",
        description: `Endpoint must match the original scenario: ${props.scenario.endpoint.method} ${props.scenario.endpoint.path}`,
      });
    }

    // If improved scenario provided, validate it
    if (complete.improved !== null) {
      const improved = complete.improved;

      // Validate improved endpoint matches original
      if (
        improved.endpoint.method !== props.scenario.endpoint.method ||
        improved.endpoint.path !== props.scenario.endpoint.path
      ) {
        errors.push({
          value: improved.endpoint,
          path: "$input.request.improved.endpoint",
          expected: "AutoBeOpenApi.IEndpoint",
          description: `Improved scenario endpoint must match original: ${props.scenario.endpoint.method} ${props.scenario.endpoint.path}`,
        });
      }

      // Validate improved functionName matches original
      if (improved.functionName !== props.scenario.functionName) {
        errors.push({
          value: improved.functionName,
          path: "$input.request.improved.functionName",
          expected: "string",
          description: `Improved scenario functionName must match original: ${props.scenario.functionName}`,
        });
      }

      // Validate all dependency endpoints exist in available operations
      improved.dependencies.forEach((dep, idx) => {
        if (!props.dict.has(dep.endpoint)) {
          errors.push({
            value: dep.endpoint,
            path: `$input.request.improved.dependencies[${idx}].endpoint`,
            expected: "AutoBeOpenApi.IEndpoint",
            description: `Dependency endpoint not found in available operations: ${dep.endpoint.method} ${dep.endpoint.path}`,
          });
        }
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        data: result.data,
      };
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
      process: (next) => {
        if (next.request.type === "complete") {
          props.build(next.request.improved);
        }
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
}

const SOURCE = "testScenarioReview" satisfies AutoBeEventSource;
