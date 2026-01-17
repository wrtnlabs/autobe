import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
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
import { AutoBeTestScenarioProgrammer } from "./programmers/AutoBeTestScenarioProgrammer";
import { IAutoBeTestScenarioReviewApplication } from "./structures/IAutoBeTestScenarioReviewApplication";

/**
 * Orchestrate test scenario review for multiple scenarios in parallel.
 *
 * Reviews each test scenario individually using executeCachedBatch for optimal
 * performance. Each scenario is validated for:
 *
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
 * @returns Promise resolving to an array of reviewed test scenarios
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
): Promise<AutoBeTestScenario[]> {
  const matrix: Array<AutoBeTestScenario | "erase"> = await executeCachedBatch(
    ctx,
    props.scenarios.map((scenario) => async (promptCacheKey) => {
      try {
        return await process(ctx, {
          dict: props.dict,
          document: props.document,
          operation: props.dict.get(scenario.endpoint),
          scenario,
          progress: props.progress,
          instruction: props.instruction,
          promptCacheKey,
        });
      } catch {
        return scenario;
      }
    }),
  );
  return matrix.filter((s) => s !== "erase");
}

/**
 * Process single scenario review with LLM agent.
 *
 * Executes the review workflow:
 *
 * 1. Provides scenario and prerequisites to review agent
 * 2. Agent analyzes for correctness issues
 * 3. Agent returns an improved scenario, or the original if improvements fail
 * 4. Creates and dispatches review event
 *
 * @param ctx - AutoBe context
 * @param props - Review configuration with single scenario
 * @returns Reviewed test scenario (improved or original if review failed)
 */
async function process(
  ctx: AutoBeContext,
  props: {
    dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
    document: AutoBeOpenApi.IDocument;
    operation: AutoBeOpenApi.IOperation;
    scenario: AutoBeTestScenario;
    progress: AutoBeProgressEventBase;
    instruction: string;
    promptCacheKey: string;
  },
): Promise<AutoBeTestScenario | "erase"> {
  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];

  const preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeTestScenarioReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisFiles", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
  });

  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<AutoBeTestScenario | "erase" | null> = {
      value: null,
    };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        dict: props.dict,
        operation: props.operation,
        scenario: props.scenario,
        authorizations,
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
    return out(result)(event.improved ?? props.scenario);
  });
}

/**
 * Create function calling controller for test scenario review.
 *
 * Sets up the LLM application interface with validation and execution logic.
 * The controller handles:
 *
 * - Validating review responses against TypeScript types
 * - Processing preliminary data requests (analysisFiles, interfaceOperations,
 *   interfaceSchemas)
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
  operation: AutoBeOpenApi.IOperation;
  authorizations: AutoBeInterfaceAuthorization[];
  preliminary: AutoBePreliminaryController<
    "analysisFiles" | "interfaceOperations" | "interfaceSchemas"
  >;
  build: (improved: AutoBeTestScenario | "erase" | null) => void;
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
    } else if (
      result.data.request.content === null ||
      result.data.request.content === "erase"
    )
      return result;

    // Complete request validation
    const errors: IValidation.IError[] = [];
    AutoBeTestScenarioProgrammer.validate({
      errors,
      dict: props.dict,
      operation: props.operation,
      scenario: result.data.request.content,
      accessor: "$input.request.content",
    });
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        data: result.data,
      };
    }
    return result;
  };

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeTestScenarioReviewApplication>({
      validate: {
        process: validate,
      },
    }),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "complete") {
          // Fulfill missing authentication dependencies if content is not null
          if (
            next.request.content !== null &&
            next.request.content !== "erase"
          ) {
            AutoBeTestScenarioProgrammer.fulfill({
              dict: props.dict,
              authorizations: props.authorizations,
              operation: props.operation,
              scenario: next.request.content,
            });
          }
          props.build(next.request.content);
        }
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
}

const SOURCE = "testScenarioReview" satisfies AutoBeEventSource;
