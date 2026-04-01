import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceAuthorization,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestScenario,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator } from "@autobe/utils";
import { NamingConvention } from "@typia/utils";
import { HashMap, HashSet, IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { buildAnalysisContextSections } from "../../utils/RAGRetrieval";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { getEmbedder } from "../../utils/getEmbedder";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { convertToSectionEntries } from "../common/internal/convertToSectionEntries";
import { IAnalysisSectionEntry } from "../common/structures/IAnalysisSectionEntry";
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
      } catch (error) {
        console.log(operation, error);
        --progress.total;
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
 * - CyclinicController wrapper
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
  const allSections: IAnalysisSectionEntry[] = convertToSectionEntries(
    ctx.state().analyze?.files ?? [],
  );
  const pathSegments = props.operation.path
    .split("/")
    .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
  const queryText: string = [
    "test",
    "scenario",
    props.operation.method,
    ...pathSegments,
  ].join(" ");

  const ragSections: IAnalysisSectionEntry[] =
    await buildAnalysisContextSections(
      getEmbedder(),
      allSections,
      queryText,
      "TOPK",
      { log: false, logPrefix: "testScenario" },
    );

  const authorizations: AutoBeInterfaceAuthorization[] =
    ctx.state().interface?.authorizations ?? [];

  const cyclinic = new AutoBeCyclinicController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  >({
    application: typia.json.application<IAutoBeTestScenarioApplication>(),
    source: SOURCE,
    kinds: ["analysisSections", "interfaceOperations", "interfaceSchemas"],
    state: ctx.state(),
    all: {
      interfaceOperations: props.document.operations,
    },
    local: {
      analysisSections: ragSections,
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

  return cyclinic.orchestrate<
    IAutoBeTestScenarioApplication.IWrite,
    AutoBeTestScenario[]
  >(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeTestScenarioApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result: AutoBeContext.IResult = await ctx.conversate({
        source: SOURCE,
        controller: createController({
          dict: props.dict,
          operation: props.operation,
          authorizations,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...transformTestScenarioHistory({
          state: ctx.state(),
          operation: props.operation,
          instruction: props.instruction,
          preliminary: context.preliminary,
        }),
      });
      return { result, action: action.value };
    },
    // VALIDATE: run business logic validation
    async (writeData) => {
      const errors: IValidation.IError[] = [];
      writeData.scenarios.forEach((scenario, i) =>
        AutoBeTestScenarioProgrammer.validate({
          errors,
          dict: props.dict,
          operation: props.operation,
          scenario,
          accessor: `$input.request.scenarios[${i}]`,
        }),
      );
      if (errors.length !== 0) return { success: false, diagnostics: errors };
      return { success: true };
    },
    // FINALIZE: build result, dispatch event, return
    async (lastWrite, result) => {
      // Normalize function names to snake_case and fulfill auth dependencies
      for (const s of lastWrite.scenarios) {
        s.functionName = NamingConvention.snake(s.functionName);
        AutoBeTestScenarioProgrammer.fulfill({
          dict: props.dict,
          authorizations,
          operation: props.operation,
          scenario: s,
        });
      }
      const scenarios = lastWrite.scenarios.slice(0, 3);

      if (result !== null)
        ctx.dispatch({
          type: SOURCE,
          id: v7(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          scenarios,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          total: props.progress.total,
          completed: ++props.progress.completed,
          step: ctx.state().interface?.step ?? 0,
          created_at: new Date().toISOString(),
        });
      return scenarios;
    },
  );
}

function createController(props: {
  dict: HashMap<AutoBeOpenApi.IEndpoint, AutoBeOpenApi.IOperation>;
  authorizations: AutoBeInterfaceAuthorization[];
  operation: AutoBeOpenApi.IOperation;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeTestScenarioApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
  cyclinic: AutoBeCyclinicController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  >;
}): IAgenticaController.IClass {
  const preliminary: AutoBePreliminaryController<
    "analysisSections" | "interfaceOperations" | "interfaceSchemas"
  > = props.cyclinic.getPreliminary();

  const validate = (
    next: unknown,
  ): IValidation<IAutoBeTestScenarioApplication.IProps> => {
    const result: IValidation<IAutoBeTestScenarioApplication.IProps> =
      typia.validate<IAutoBeTestScenarioApplication.IProps>(next);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeTestScenarioApplication>({
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
    } satisfies IAutoBeTestScenarioApplication,
  };
}

const SOURCE = "testScenario" satisfies AutoBeEventSource;
