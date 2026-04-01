import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
  AutoBeTestScenarioReviewEvent,
} from "@autobe/interface";
import { HashMap, IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
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
        --props.progress.total;
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

  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  >({
    application: typia.json.application<IAutoBeTestScenarioReviewApplication>(),
    source: SOURCE,
    kinds: ["analysisSections", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
  });

  return cyclinic.orchestrate<
    IAutoBeTestScenarioReviewApplication.IWrite,
    AutoBeTestScenario | "erase"
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeTestScenarioReviewApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          dict: props.dict,
          operation: props.operation,
          scenario: props.scenario,
          authorizations,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformTestScenarioReviewHistory({
          state: ctx.state(),
          scenario: props.scenario,
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      if (
        writeData.content === null ||
        writeData.content === "erase"
      )
        return { success: true };

      const errors: IValidation.IError[] = [];
      AutoBeTestScenarioProgrammer.validate({
        errors,
        dict: props.dict,
        operation: props.operation,
        scenario: writeData.content,
        accessor: "$input.request.content",
      });
      if (errors.length > 0)
        return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Fulfill missing auth dependencies if content is a scenario
      let improved: AutoBeTestScenario | "erase" | null = lastWrite.content;
      if (improved !== null && improved !== "erase") {
        AutoBeTestScenarioProgrammer.fulfill({
          dict: props.dict,
          authorizations,
          operation: props.operation,
          scenario: improved,
        });
      }

      // Create event
      const event: AutoBeTestScenarioReviewEvent = {
        type: SOURCE,
        id: v7(),
        created_at: new Date().toISOString(),
        metric: result?.metric ?? {
          attempt: 0,
          success: 0,
          consent: 0,
          validationFailure: 0,
          invalidJson: 0,
        },
        tokenUsage: result?.tokenUsage ?? {
          total: 0,
          input: { total: 0, cached: 0 },
          output: {
            total: 0,
            reasoning: 0,
            accepted_prediction: 0,
            rejected_prediction: 0,
          },
        },
        endpoint: props.scenario.endpoint,
        original: props.scenario,
        improved,
        acquisition: cyclinic.getPreliminary().getAcquisition(),
        total: props.progress.total,
        completed: ++props.progress.completed,
        step: ctx.state().interface?.step ?? 0,
      };

      if (result !== null) ctx.dispatch(event);
      return improved ?? props.scenario;
    },
  );
}

/**
 * Create function calling controller for test scenario review.
 *
 * Sets up the LLM application interface with validation and execution logic.
 * The controller handles:
 *
 * - Validating review responses against TypeScript types
 * - Processing preliminary data requests (analysisSections, interfaceOperations,
 *   interfaceSchemas)
 * - Capturing improved scenario in action pointer
 *
 * @param props - Controller configuration
 * @returns Agentica controller instance for LLM function calling
 */
function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  scenario: AutoBeTestScenario;
  operation: AutoBeOpenApi.IOperation;
  authorizations: AutoBeInterfaceAuthorization[];
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  >;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeTestScenarioReviewApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioReviewApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioReviewApplication.IProps> =
      typia.validate<IAutoBeTestScenarioReviewApplication.IProps>(next);

    // Validation failed at type level
    if (result.success === false) return result;

    const req = result.data.request;
    // write/complete: pass through
    if (req.type === "write" || req.type === "complete") return result;

    // Preliminary request: delegate to preliminary controller
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeTestScenarioReviewApplication>({
        validate: {
          process: validate,
        },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (next) => {
        if (next.request.type === "write")
          props.action.value = { type: "write", data: next.request };
        else if (next.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeTestScenarioReviewApplication,
  };
}

const SOURCE = "testScenarioReview" satisfies AutoBeEventSource;
