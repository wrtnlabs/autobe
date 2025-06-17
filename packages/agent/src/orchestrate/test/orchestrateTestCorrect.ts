import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestProgressEvent,
  AutoBeTestValidateEvent,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformTestCorrectHistories } from "./transformTestCorrectHistories";

export async function orchestrateTestCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  codes: AutoBeTestProgressEvent[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent> {
  // 1) Build map of new test files from progress events
  const testFiles = Object.fromEntries(
    codes.map(({ filename, content }) => [
      `test/features/api/${filename}`,
      content,
    ]),
  );

  // 2) Keep only files outside the test directory from current state
  const retainedFiles = Object.fromEntries(
    Object.entries(ctx.state().interface?.files ?? {}).filter(
      ([filename]) => !filename.startsWith("test/features/api"),
    ),
  );

  // 3) Merge and filter: keep .ts/.json, drop anything under "benchmark"
  const mergedFiles = { ...retainedFiles, ...testFiles };
  const files = Object.fromEntries(
    Object.entries(mergedFiles).filter(
      ([filename]) =>
        (filename.endsWith(".ts") && !filename.startsWith("test/benchmark/")) ||
        filename.endsWith(".json"),
    ),
  );

  // 4) Ask the LLM to correct the filtered file set
  const response = await step(ctx, files, life);

  // 5) Combine original + corrected files and dispatch event
  const event: AutoBeTestValidateEvent = {
    ...response,
    type: "testValidate",
    files: { ...mergedFiles, ...response.files },
  };

  return event;
}

/**
 * Modifies test code for each file and checks for compilation errors. When
 * compilation errors occur, it uses LLM to fix the code and attempts
 * recompilation. This process repeats up to the maximum retry count until
 * compilation succeeds.
 *
 * The function is a critical part of the test generation pipeline that ensures
 * all generated test files are syntactically correct and compilable.
 *
 * @param ctx AutoBe context object
 * @param files Map of files to compile (filename: content)
 * @param life Number of remaining retry attempts
 * @returns Event object containing successful compilation result and modified
 *   files
 */
async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  files: Record<string, string>,
  life: number,
): Promise<AutoBeTestValidateEvent> {
  // COMPILE TEST CODE
  const result = await ctx.compiler.typescript({
    files,
  });

  if (result.type === "success") {
    // SUCCESS
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files,
      result,
      step: ctx.state().interface?.step ?? 0,
    };
  }

  // EXCEPTION ERROR
  if (result.type === "exception") {
    ctx.dispatch({
      type: "testValidate",
      created_at: new Date().toISOString(),
      files,
      result,
      step: ctx.state().interface?.step ?? 0,
    });

    throw new Error(JSON.stringify(result.error, null, 2));
  }

  // Make the diagnostics object (e.g. { "test/features/api/article.ts": [error1, error2] })
  const diagnostics: Record<
    string,
    IAutoBeTypeScriptCompilerResult.IDiagnostic[]
  > = {};

  result.diagnostics.forEach((d) => {
    if (d.file === null) return;

    diagnostics[d.file] = diagnostics[d.file] ?? [];
    diagnostics[d.file].push(d);
  });

  if (Object.keys(diagnostics).length === 0) {
    /**
     * SUCCESS (Because typescript compiler can't success to compile the json
     * files, so result could be failure. but it's success to compile the ts
     * files.)
     */
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files,
      result: {
        ...result,
        type: "success",
      },
      step: ctx.state().interface?.step ?? 0,
    };
  }

  // Compile Failed
  ctx.dispatch({
    type: "testValidate",
    created_at: new Date().toISOString(),
    files,
    result,
    step: ctx.state().interface?.step ?? 0,
  });

  if (life <= 0)
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files,
      result,
      step: ctx.state().interface?.step ?? 0,
    };

  // VALIDATION FAILED
  const validate = await Promise.all(
    Object.entries(diagnostics).map(async ([filename, d]) => {
      const code = files[filename];
      const response = await process(ctx, d, code);

      ctx.dispatch({
        type: "testCorrect",
        created_at: new Date().toISOString(),
        files: { ...files, [filename]: response.content },
        result,
        solution: response.solution,
        think_without_compile_error: response.think_without_compile_error,
        think_again_with_compile_error: response.think_again_with_compile_error,
        step: ctx.state().interface?.step ?? 0,
      });

      // Return [filename, modified code]
      return [filename, response.content];
    }),
  );

  const newFiles = { ...files, ...Object.fromEntries(validate) };

  return step(ctx, newFiles, life - 1);
}

/**
 * Modifies the code of test files where errors occurred. This function
 * processes TypeScript compiler diagnostics and attempts to fix compilation
 * errors.
 *
 * @param ctx The AutoBeContext containing application state and configuration
 * @param diagnostics Array of TypeScript compiler diagnostics for the errors
 * @param code The source code content to be fixed
 * @returns Promise resolving to corrected test function properties
 */
async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  diagnostics: IAutoBeTypeScriptCompilerResult.IDiagnostic[],
  code: string,
): Promise<ICorrectTestFunctionProps> {
  const pointer: IPointer<ICorrectTestFunctionProps | null> = {
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
    vendor: { ...ctx.vendor },
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestCorrectHistories(apiFiles, dtoFiles),
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
      "Fix the compilation error in the provided code.",
      "",
      "## Original Code",
      "```typescript",
      code,
      "```",
      "",
      diagnostics.map((diagnostic) => {
        if (diagnostic.start === undefined || diagnostic.length === undefined)
          return "";

        return [
          "## Error Information",
          `- Position: Characters ${diagnostic.start} to ${diagnostic.start + diagnostic.length}`,
          `- Error Message: ${diagnostic.messageText}`,
          `- Problematic Code: \`${code.substring(diagnostic.start, diagnostic.start + diagnostic.length)}\``,
          "",
        ].join("\n");
      }),
      "## Instructions",
      "1. Focus on the specific error location and message",
      "2. Provide the corrected TypeScript code",
      "3. Ensure the fix resolves the compilation error",
      "",
      "Return only the fixed code without explanations.",
    ].join("\n"),
  );

  if (pointer.value === null) throw new Error("Failed to modify test code.");

  return pointer.value;
}

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: ICorrectTestFunctionProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Modify Test Code",
    application,
    execute: {
      correctTestCode: (next) => {
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
  correctTestCode(props: ICorrectTestFunctionProps): void;
}

interface ICorrectTestFunctionProps {
  /**
   * Step 1: Initial self-reflection on the source code without compiler error
   * context.
   *
   * The AI agent analyzes the previously generated test code to identify
   * potential issues, relying solely on its understanding of TypeScript syntax,
   * testing patterns, and best practices.
   *
   * This encourages the agent to develop independent debugging skills before
   * being influenced by external error messages.
   */
  think_without_compile_error: string;

  /**
   * Step 2: Re-evaluation of the code with compiler error messages as
   * additional context.
   *
   * After the initial analysis, the AI agent reviews the same code again, this
   * time incorporating the specific TypeScript compiler error messages.
   *
   * This allows the agent to correlate its initial observations with concrete
   * compilation failures and refine its understanding of what went wrong.
   */
  think_again_with_compile_error: string;

  /**
   * Step 3: Concrete action plan for fixing the identified issues.
   *
   * Based on the analysis from steps 1 and 2, the AI agent formulates a
   * specific, step-by-step solution strategy.
   *
   * This should include what changes need to be made, why those changes are
   * necessary, and how they will resolve the compilation errors while
   * maintaining the test's intended functionality.
   */
  solution: string;

  /**
   * Step 4: The corrected TypeScript test code.
   *
   * The final, properly fixed TypeScript code that should compile without
   * errors.
   *
   * This represents the implementation of the solution plan from step 3,
   * containing all necessary corrections to make the test code syntactically
   * valid and functionally correct.
   */
  content: string;
}
