import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeTest, AutoBeTestProgressEvent } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformTestProgressHistories } from "./transformTestProgressHistories";

export async function orchestrateTestProgress<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  scenarios: AutoBeTest.Scenario[],
): Promise<AutoBeTestProgressEvent[]> {
  const start: Date = new Date();
  let complete: number = 0;

  const events: AutoBeTestProgressEvent[] = await Promise.all(
    /**
     * Generate test code for each scenario. Maps through scenarios array to
     * create individual test code implementations. Each scenario is processed
     * to generate corresponding test code and progress events.
     */
    scenarios.map(async (scenario) => {
      const code: ICreateTestCodeProps = await process(ctx, scenario);

      const event: AutoBeTestProgressEvent = {
        type: "testProgress",
        created_at: start.toISOString(),
        filename: `${code.domain}/${scenario.functionName}.ts`,
        content: code.content,
        completed: ++complete,
        total: scenarios.length,
        step: ctx.state().interface?.step ?? 0,
      };

      console.log(`completed: ${complete}/${scenarios.length}`);

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
  scenario: AutoBeTest.Scenario,
): Promise<ICreateTestCodeProps> {
  const pointer: IPointer<ICreateTestCodeProps | null> = {
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
          pointer.value = next;
        },
      }),
    ],
  });

  agentica.on("request", async (event) => {
    if (event.body.tools) event.body.tool_choice = "required";
  });

  await agentica.conversate(
    [
      "Create test code for below scenario:",
      "",
      "```json",
      JSON.stringify(scenario, null, 2),
      "```",
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
  /** Test Code Content */
  content: string;

  /**
   * Domain of the test code.
   *
   * Related domain of the scenario.
   *
   * Domain name must be in english and lowercase.
   *
   * ### Example Domain name According to Function name(or Scenario)
   *
   * - Domain : articles
   *
   *   - Test_api_bbs_articles_patch`
   *   - Test_api_bbs_articles_getById`
   *   - Test_api_bbs_articles_post`
   *   - Test_api_bbs_articles_putById`
   *   - Test_api_bbs_articles_eraseById`
   * - Domain : comments
   *
   *   - `test_api_bbs_articles_comments_patchByArticleid`
   *   - `test_api_bbs_articles_comments_postByArticleid`
   */
  domain: string;
}
