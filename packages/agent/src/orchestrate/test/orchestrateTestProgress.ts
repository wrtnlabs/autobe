import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeTestScenarioEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";
import {
  ILlmApplication,
  ILlmSchema,
  OpenApiTypeChecker,
} from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformTestProgressHistories } from "./transformTestProgressHistories";

export async function orchestrateTestProgress<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTestScenarioEvent.IScenario[],
): Promise<AutoBeTestWriteEvent[]> {
  const start: Date = new Date();
  let complete: number = 0;

  const events: AutoBeTestWriteEvent[] = await Promise.all(
    /**
     * Generate test code for each scenario. Maps through plans array to create
     * individual test code implementations. Each scenario is processed to
     * generate corresponding test code and progress events.
     */
    scenarios.map(async (scenario) => {
      const code: ICreateTestCodeProps = await process(ctx, scenario);
      const event: AutoBeTestWriteEvent = {
        type: "testWrite",
        created_at: start.toISOString(),
        filename: `${code.domain}/${scenario.functionName}.ts`,
        content: code.content,
        completed: ++complete,
        total: scenarios.length,
        step: ctx.state().interface?.step ?? 0,
      };
      ctx.dispatch(event);
      return event;
    }),
  );

  return events;
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
  scenario: AutoBeTestScenarioEvent.IScenario,
): Promise<ICreateTestCodeProps> {
  const pointer: IPointer<ICreateTestCodeProps | null> = {
    value: null,
  };
  const document: AutoBeOpenApi.IDocument = filterDocument(
    scenario,
    ctx.state().interface!.document,
  );
  const files: [string, string][] = Object.entries(
    await ctx.compiler.interface.compile(document),
  );
  const filter = (prefix: string) =>
    Object.fromEntries(files.filter(([key]) => key.startsWith(prefix)));

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestProgressHistories({
      scenario: scenario,
      dto: filter("src/api/structures"),
      sdk: filter("src/api/functional"),
      e2e: filter("test/features"),
    }),
    controllers: [
      createApplication({
        model: ctx.model,
        build: (next) => {
          pointer.value = next;
        },
      }),
    ],
    tokenUsage: ctx.usage(),
  });
  enforceToolCall(agentica);

  await agentica.conversate("Create e2e test functions.");
  if (pointer.value === null) throw new Error("Failed to create test code.");
  return pointer.value;
}

export function filterDocument(
  scenario: AutoBeTestScenarioEvent.IScenario,
  document: AutoBeOpenApi.IDocument,
): AutoBeOpenApi.IDocument {
  const operations: AutoBeOpenApi.IOperation[] = document.operations.filter(
    (op) => {
      if (
        scenario.endpoint.method === op.method &&
        scenario.endpoint.path === op.path
      ) {
        return true;
      } else if (
        scenario.dependencies.some(
          (dp) =>
            dp.endpoint.method === op.method && dp.endpoint.path === op.path,
        )
      ) {
        return true;
      }
    },
  );
  const components: AutoBeOpenApi.IComponents = {
    schemas: {},
  };
  const visit = (typeName: string) => {
    OpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${typeName}` },
      closure: (s) => {
        if (OpenApiTypeChecker.isReference(s)) {
          const key: string = s.$ref.split("/").pop()!;
          components.schemas[key] = document.components.schemas[key];
        }
      },
    });
  };
  for (const op of operations) {
    if (op.requestBody) visit(op.requestBody.typeName);
    if (op.responseBody) visit(op.responseBody.typeName);
  }
  return {
    operations,
    components,
  };
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
   * Strategic approach for test implementation.
   *
   * Define the high-level strategy and logical flow for testing the given
   * scenario. Focus on test methodology, data preparation, and assertion
   * strategy.
   *
   * ### Critical Requirements
   *
   * - Must follow the Test Generation Guildelines.
   * - Must Planning the test code Never occur the typescript compile error.
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
   * - Plan error handling and exception plans
   * - Define cleanup and teardown procedures
   * - Identify dependencies and prerequisites
   *
   * ### Example Plan:
   *
   *     Test Strategy: Article Creation Validation
   *     1. Prepare valid article data with required fields
   *     2. Execute POST request to create article
   *     3. Validate response structure and data integrity
   *     4. Test error plans (missing fields, invalid data)
   *     5. Verify database state changes
   *     6. Reconsider the scenario if it doesn't follow the Test Generation
   *        Guildelines.
   */
  scenario: string;

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
