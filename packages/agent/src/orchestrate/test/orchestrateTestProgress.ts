import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeTest, AutoBeTestProgressEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { HashMap, HashSet, IPointer, hash } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { divideArray } from "../../utils/divideArray";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformTestProgressHistories } from "./transformTestProgressHistories";

export async function orchestrateTestProgress<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTest.Scenario[],
  capacity: number = 3,
): Promise<AutoBeTestProgressEvent[]> {
  const matrix: AutoBeTest.Scenario[][] = divideArray({
    array: scenarios,
    capacity,
  });

  let complete: number = 0;

  const events: AutoBeTestProgressEvent[] = await Promise.all(
    /**
     * Generate test code for each scenario. Maps through scenarios array to
     * create individual test code implementations. Each scenario is processed
     * to generate corresponding test code and progress events.
     */
    matrix.map(async (s) => {
      const codes: ITestCode[] = await divideAndConquer(ctx, s, 3);

      complete += codes.length;

      const event: AutoBeTestProgressEvent = {
        type: "testProgress",
        created_at: new Date().toISOString(),
        files: codes.reduce(
          (acc, code) => {
            acc[`${code.domain}/${code.functionName}.ts`] = code.content;
            return acc;
          },
          {} as Record<string, string>,
        ),
        completed: complete,
        total: scenarios.length,
        step: ctx.state().interface?.step ?? 0,
      };

      ctx.dispatch(event);

      return event;
    }),
  );

  return events;
}

async function divideAndConquer<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTest.Scenario[],
  retry: number,
): Promise<ITestCode[]> {
  const remained: HashSet<AutoBeTest.Scenario> = new HashSet(
    scenarios,
    (x) => hash(x.functionName),
    (x, y) => x.functionName === y.functionName,
  );
  const codes: HashMap<AutoBeTest.Scenario["functionName"], ITestCode> =
    new HashMap();

  for (let i: number = 0; i < retry; ++i) {
    if (remained.empty() === true || codes.size() >= scenarios.length) break;
    const newbie: ITestCode[] = await process(ctx, Array.from(remained));
    for (const item of newbie) {
      codes.set(item.functionName, item);
      remained.erase({
        scenario: "",
        functionName: item.functionName,
      });
    }
  }

  return Array.from(codes.toJSON()).map((it) => it.second);
}

/**
 * Process function that generates test code for each individual scenario. Takes
 * the AutoBeContext and scenario information as input and uses MicroAgentica to
 * generate appropriate test code through LLM interaction.
 *
 * @param ctx - The AutoBeContext containing model, vendor and configuration
 * @param scenario - The test scenario information to generate code for
 * @returns Promise resolving to ICreateTestCodeProps containing the generated
 *   test code
 */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTest.Scenario[],
): Promise<ITestCode[]> {
  const pointer: IPointer<ITestCode[] | null> = {
    value: null,
  };

  const apiFiles = Object.entries(ctx.state().interface?.files ?? {})
    .filter(([filename]) => {
      return filename.startsWith("src/api/");
    })
    .reduce<Record<string, string>>((acc, [filename, content]) => {
      return Object.assign(acc, { [filename]: content });
    }, {});

  const dtoFiles = Object.entries(ctx.state().interface?.files ?? {})
    .filter(([filename]) => {
      return filename.startsWith("src/api/structures/");
    })
    .reduce<Record<string, string>>((acc, [filename, content]) => {
      return Object.assign(acc, { [filename]: content });
    }, {});

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestProgressHistories(apiFiles, dtoFiles),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value ??= [];
          pointer.value.push(...next.codes);
        },
      }),
    ],
  });
  enforceToolCall(agentica);

  await agentica.conversate(
    [
      `You must create exactly ${scenarios.length} test codes for the following scenarios:`,
      "",
      "```json",
      JSON.stringify(scenarios, null, 2),
      "```",
      "",
      "Requirements:",
      `- Generate exactly ${scenarios.length} test codes`,
      "- Each scenario maps to one test code",
      "- All test codes must be included in the 'codes' array",
      "- Do not skip any scenarios",
      "",
      "Scenarios breakdown:",
      ...scenarios.map(
        (scenario, index) => `${index + 1}. ${scenario.functionName}`,
      ),
    ].join("\n"),
  );
  if (pointer.value === null) throw new Error("Failed to create test code.");

  return pointer.value;
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
  {
    reference: true;
  }
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
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  createTestCode(props: ICreateTestCodeProps): void;
}
interface ICreateTestCodeProps {
  /**
   * Create Test codes for each scenarios. Generate multiple test codes based on
   * the given scenarios.
   */
  codes: ITestCode[];
}

interface ITestCode {
  /** Test function name. */
  functionName: string;
  /**
   * Strategic approach for test implementation.
   *
   * Define the high-level strategy and logical flow for testing the given
   * scenario. Focus on test methodology, data preparation, and assertion
   * strategy.
   *
   * ### Critical Requirements
   *
   * - Must follow the Test Generation Guidelines.
   * - Must plan the test codes to never occur TypeScript compile errors.
   *
   * ### Planning Elements:
   *
   * #### Test Methodology
   *
   * - Identify test scenario type (CRUD operation, authentication flow,
   *   validation test)
   * - Define test data requirements and preparation strategy
   * - Plan positive/negative test cases and edge cases
   * - Design assertion logic and validation points
   *
   * #### Execution Strategy
   *
   * - Outline step-by-step test execution flow
   * - Plan error handling and exception scenarios
   * - Define cleanup and teardown procedures
   * - Identify dependencies and prerequisites
   *
   * ### Example Plan:
   *
   *     Test Strategy: Article Creation Validation
   *     1. Prepare valid article data with required fields
   *     2. Execute POST request to create article
   *     3. Validate response structure and data integrity
   *     4. Test error scenarios (missing fields, invalid data)
   *     5. Verify database state changes
   *     6. Reconsider the plan if it doesn't follow the Test Generation
   *        Guidelines.
   */
  plan: string;

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

  /**
   * Complete TypeScript E2E test implementation.
   *
   * Generate fully functional, compilation-error-free test code following
   *
   * @nestia/e2e framework conventions and TypeScript best practices.
   *
   * ### Technical Implementation Requirements:
   *
   * #### Import Declarations
   * ```typescript
   * import api from "@ORGANIZATION/PROJECT-api";
   * import { ITargetType } from "@ORGANIZATION/PROJECT-api/lib/structures/[path]";
   * import { TestValidator } from "@nestia/e2e";
   * import typia from "typia";
   * ```
   * - Must use exact `@ORGANIZATION/PROJECT-api` module path
   * - Include `@ORGANIZATION` prefix in all API-related imports
   * - Import specific DTO types from correct structure paths
   *
   * #### Code Quality Standards
   * - Zero TypeScript compilation errors (mandatory)
   * - Explicit type annotations for all variables
   * - Proper async/await patterns throughout
   * - Comprehensive error handling
   * - Clean, readable code structure
   * - Consistent formatting and naming conventions
   *
   * ### Critical Error Prevention
   * - Verify all import paths are correct and accessible
   * - Ensure type compatibility between variables and assignments
   * - Include all required object properties and methods
   * - Validate API function signatures and parameter types
   * - Confirm proper generic type usage
   * - Test async function declarations and Promise handling
   */
  content: string;
}
