import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeTest,
  AutoBeTestScenario,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { randomBackoffRetry } from "../../utils/backoffRetry";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { compileTestScenario } from "./compile/compileTestScenario";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";
import { transformTestWriteHistories } from "./transformTestWriteHistories";

export async function orchestrateTestWrite<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTestScenario[],
  life: number = 4,
): Promise<IAutoBeTestWriteResult[]> {
  const start: Date = new Date();
  let complete: number = 0;

  console.log("Number of scenarios:", scenarios.length);
  const writes: Array<IAutoBeTestWriteResult | Error> = await Promise.all(
    /**
     * Generate test code for each scenario. Maps through plans array to create
     * individual test code implementations. Each scenario is processed to
     * generate corresponding test code and progress events.
     */
    scenarios.map(async (scenario) => {
      try {
        const artifacts: IAutoBeTestScenarioArtifacts =
          await compileTestScenario(ctx, scenario);
        const result: ICreateTestCodeProps = await process(
          ctx,
          scenario,
          artifacts,
          life,
          null,
        );
        const event: AutoBeTestWriteEvent = {
          type: "testWrite",
          created_at: start.toISOString(),
          file: {
            location: `test/features/api/${result.domain}/${scenario.functionName}.ts`,
            function: result.function,
            content: await ctx.compiler.test.write({
              scenario,
              document: ctx.state().interface!.document,
              function: result.function,
            }),
            scenario,
          },
          completed: ++complete,
          total: scenarios.length,
          step: ctx.state().interface?.step ?? 0,
        };
        ctx.dispatch(event);
        return {
          artifacts,
          file: event.file,
        };
      } catch (error) {
        return error as Error;
      }
    }),
  );
  console.log(ctx.usage().test.aggregate);
  const error: Error | undefined = writes.find(
    (write) => write instanceof Error,
  ) as Error | undefined;
  if (error) throw error;
  return writes as IAutoBeTestWriteResult[];
}

/**
 * Process function that generates test code for each individual scenario. Takes
 * the AutoBeContext and scenario information as input and uses MicroAgentica to
 * generate appropriate test code through LLM interaction.
 *
 * @param ctx - The AutoBeContext containing model, vendor and configuration
 * @param scenario - The test scenario information to generate code for
 * @param artifacts - The artifacts containing the reference files and schemas
 * @returns Promise resolving to ICreateTestCodeProps containing the generated
 *   test code
 */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenario: AutoBeTestScenario,
  artifacts: IAutoBeTestScenarioArtifacts,
  life: number,
  failure: IValidation.IFailure | null,
): Promise<ICreateTestCodeProps> {
  // function calling
  const trials: IValidation.IFailure[] = [];
  const pointer: IPointer<ICreateTestCodeProps | null> = {
    value: null,
  };
  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
      executor: {
        describe: null,
      },
      systemPrompt: {
        execute: () => AutoBeSystemPromptConstant.FUNCTION_CALLING,
        validate: (events) =>
          [
            AutoBeSystemPromptConstant.TEST_VALIDATE,
            ...(events.length !== 0
              ? [
                  "",
                  AutoBeSystemPromptConstant.TEST_VALIDATE_REPEAT.replace(
                    "${{HISTORICAL_ERRORS}}",
                    JSON.stringify(events.map((e) => e.result.errors)),
                  ),
                ]
              : []),
          ].join("\n"),
      },
      retry: 4,
    },
    histories: transformTestWriteHistories({
      scenario,
      artifacts,
      failure,
    }),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
  });
  enforceToolCall(agentica);
  agentica.on("validate", (e) => {
    trials.push(e.result);
  });

  await randomBackoffRetry(() =>
    agentica.conversate("Create e2e test functions."),
  ).finally(() => {
    const tokenUsage = agentica.getTokenUsage();
    ctx.usage().record(tokenUsage, ["test"]);
  });
  if (pointer.value === null) {
    console.log(
      "failed to pass validation",
      trials.map((t) => t.errors.map((e) => e.path)),
      JSON.stringify(trials.at(-1), null, 2),
    );
    throw new Error("Failed to create test code.");
  }
  console.log(
    "Function calling success",
    JSON.stringify(
      trials.map((t) => t.errors),
      null,
      2,
    ),
  );

  // custom validation by compiler
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const errors: IValidation.IError[] | null = await ctx.compiler.test.validate({
    document,
    function: pointer.value.function,
  });
  return errors === null || life <= 0
    ? pointer.value
    : process(ctx, scenario, artifacts, --life, {
        success: false,
        data: pointer.value,
        errors,
      });
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: ICreateTestCodeProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Create Test Code",
    application,
    execute: {
      createTestCode: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};

interface IApplication {
  createTestCode(props: ICreateTestCodeProps): void;
}

interface ICreateTestCodeProps {
  /**
   * Functional domain classification for test organization.
   *
   * Determines file structure and test categorization based on API
   * functionality. Used for organizing tests into logical groups and directory
   * hierarchies.
   *
   * ### Naming Rules:
   *
   * - Lowercase English words only
   * - Singular nouns (e.g., "article", "user", "comment")
   * - Kebab-case for compound words (e.g., "user-profile", "payment-method")
   * - Match primary API resource being tested
   * - Domain Name must be named only one word.
   *
   * ### Domain Examples:
   *
   * - `article` → Article management operations
   * - `comment` → Comment-related functionality
   * - `auth` → Authentication and authorization
   * - `user` → User management operations
   * - `payment` → Payment processing
   * - `notification` → Notification system
   */
  domain: string;

  /** E2E test function implementation. */
  function: AutoBeTest.IFunction;
}
