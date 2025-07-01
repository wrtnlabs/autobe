import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestFile,
  AutoBeTestScenario,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompilerResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { randomBackoffRetry } from "../../utils/backoffRetry";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { compileTestScenario } from "./compileTestScenario";
import { filterTestFileName } from "./filterTestFileName";
import { IAutoBeTestScenarioArtifacts } from "./structures/IAutoBeTestScenarioArtifacts";
import { transformTestCorrectHistories } from "./transformTestCorrectHistories";

export async function orchestrateTestCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  codes: AutoBeTestWriteEvent[],
  scenarios: AutoBeTestScenario[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent> {
  const files: AutoBeTestFile[] = codes.map(
    ({ filename, content }, index): AutoBeTestFile => {
      const scenario: AutoBeTestScenario = scenarios[index];
      return { location: filename, content, scenario };
    },
  );

  // 1) Build map of new test files from progress events
  const testFiles: Record<string, string> = Object.fromEntries(
    codes.map((c) => [c.filename, c.content]),
  );

  // 2) Keep only files outside the test directory from current state
  const retainedFiles: Record<string, string> = Object.fromEntries(
    Object.entries(ctx.state().interface?.files ?? {}).filter(([key]) =>
      filterTestFileName(key),
    ),
  );

  // 3) Merge and filter: keep .ts/.json, drop anything under "benchmark"
  const external = async (
    location: string,
  ): Promise<Record<string, string>> => {
    const content: string | undefined =
      await ctx.compiler.typescript.getExternal(location);
    if (content === undefined) throw new Error(`File not found: ${location}`);
    return { [location]: content };
  };
  const mergedFiles: Record<string, string> = {
    ...retainedFiles,
    ...testFiles,
    ...(await external("node_modules/@nestia/e2e/lib/TestValidator.d.ts")),
    ...(await external("node_modules/@nestia/fetcher/lib/IConnection.d.ts")),
  };

  // 4) Ask the LLM to correct the filtered file set
  const response: AutoBeTestValidateEvent = await step(
    ctx,
    mergedFiles,
    files,
    life,
  );

  // 5) Combine original + corrected files and dispatch event
  const event: AutoBeTestValidateEvent = {
    ...response,
    type: "testValidate",
    files: [
      ...Object.entries(mergedFiles).map(
        ([filename, content]): AutoBeTestFile => {
          return {
            location: filename,
            content,
          };
        },
      ),
      ...response.files,
    ],
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
 * @param entireFiles Map of all files to compile (filename: content)
 * @param testFiles Map of files to compile (filename: content)
 * @param life Number of remaining retry attempts
 * @returns Event object containing successful compilation result and modified
 *   files
 */
async function step<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  entireFiles: Record<string, string>,
  testFiles: AutoBeTestFile[],
  life: number,
): Promise<AutoBeTestValidateEvent> {
  // COMPILE TEST CODE
  const files = {
    ...entireFiles,
    ...testFiles
      .map((el) => ({ [el.location]: el.content }))
      .reduce((acc, cur) => Object.assign(acc, cur), {}),
  };

  const result: IAutoBeTypeScriptCompilerResult =
    await ctx.compiler.typescript.compile({
      files: files,
    });

  if (result.type === "success") {
    // SUCCESS
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files: testFiles,
      result,
      step: ctx.state().interface?.step ?? 0,
    };
  }

  // EXCEPTION ERROR
  if (result.type === "exception") {
    ctx.dispatch({
      type: "testValidate",
      created_at: new Date().toISOString(),
      files: testFiles,
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
    if (!d.file.startsWith("test/features/api/")) return;

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
      files: testFiles,
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
    files: testFiles,
    result,
    step: ctx.state().interface?.step ?? 0,
  });

  if (life <= 0)
    return {
      type: "testValidate",
      created_at: new Date().toISOString(),
      files: testFiles,
      result,
      step: ctx.state().interface?.step ?? 0,
    };

  // VALIDATION FAILED
  const validatedFiles: AutoBeTestFile[] = await Promise.all(
    Object.entries(diagnostics).map(
      async ([filename, d]): Promise<AutoBeTestFile> => {
        const file = testFiles.find((f) => f.location === filename);
        const scenario = file?.scenario!;

        const filtered: IAutoBeTypeScriptCompilerResult.IDiagnostic[] = [];
        for (const diagnostic of d) {
          if (await replaceExpectAndActual(ctx, diagnostic, files, file)) {
            filtered.push(diagnostic);
          }
        }

        if (filtered.length === 0 && typeof file?.content === "string") {
          return {
            location: filename,
            content: file.content,
            scenario: scenario,
          };
        }

        const response: ICorrectTestFunctionProps = await process(
          ctx,
          filtered,
          file?.content!,
          scenario,
        );
        ctx.dispatch({
          type: "testCorrect",
          created_at: new Date().toISOString(),
          files: { ...testFiles, [filename]: response.content },
          result,
          solution: response.solution,
          think_without_compile_error: response.think_without_compile_error,
          think_again_with_compile_error:
            response.think_again_with_compile_error,
          step: ctx.state().interface?.step ?? 0,
        });

        return {
          location: filename,
          content: response.content,
          scenario: scenario,
        };
      },
    ),
  );

  return step(
    ctx,
    Object.entries(entireFiles)
      .map(([filename, content]) => {
        const overwritten = validatedFiles.find(
          (el) => el.location === filename,
        );
        return overwritten
          ? { [overwritten.location]: overwritten.content }
          : {
              [filename]: content,
            };
      })
      .reduce((acc, cur) => Object.assign(acc, cur), {}),
    testFiles.map((f) => {
      const validated = validatedFiles.find((v) => v.location === f.location);
      return validated ? validated : f;
    }),
    life - 1,
  );
}

async function replaceExpectAndActual<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  initialDiagnostic: IAutoBeTypeScriptCompilerResult.IDiagnostic,
  files: Record<string, string>,
  file?: AutoBeTestFile,
): Promise<boolean> {
  const isAssignabilityError =
    /Argument of type '([^']+)' is not assignable to parameter of type '([^']+)'/.test(
      initialDiagnostic.messageText,
    );

  if (file?.content && isAssignabilityError) {
    const targetStr = "TestValidator.equals";
    const lines = transformLines(file?.content);

    const start = initialDiagnostic.start;
    if (typeof start === "number") {
      const errorLine = lines.find((line) => line.end > start);
      if (errorLine?.text.includes(targetStr)) {
        function swapTestValidatorArgsMultiline(code: string): string {
          return code.replace(
            /TestValidator\.equals\((['"`][\s\S]*?['"`])\)\s*\(([\s\S]*?)\)\s*\(([\s\S]*?)\)/g,
            (_, title, a, b) =>
              `TestValidator.equals(${title})(${b.trim()})(${a.trim()})`,
          );
        }

        errorLine.text = swapTestValidatorArgsMultiline(errorLine.text);
        const contentAfterupdate = lines.map((el) => el.text).join("\n");

        const compiled = await ctx.compiler.typescript.compile({
          files: {
            ...files,
            [file.location]: contentAfterupdate,
          },
        });
        if (compiled.type === "failure") {
          if (
            compiled.diagnostics.some(
              (d) =>
                d.file === file.location && d.start === initialDiagnostic.start,
            )
          ) {
            return true;
          }
        }

        file.content = contentAfterupdate;
        return false;
      }
    }
  }

  return true;
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
  scenario: AutoBeTestScenario,
): Promise<ICorrectTestFunctionProps> {
  const pointer: IPointer<ICorrectTestFunctionProps | null> = {
    value: null,
  };
  const artifacts: IAutoBeTestScenarioArtifacts = await compileTestScenario(
    ctx,
    scenario,
  );

  const lines = transformLines(code);

  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: { ...ctx.vendor },
    config: {
      ...(ctx.config ?? {}),
    },
    histories: transformTestCorrectHistories(
      code,
      artifacts,
      diagnostics.map((diagnostic) =>
        diagnostic.start === undefined || diagnostic.length === undefined
          ? ""
          : formatDiagnostic(code, lines, diagnostic),
      ),
    ),
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

  await randomBackoffRetry(async () => {
    await agentica.conversate(
      [
        "# Instructions",
        "1. Focus on the specific error location and message",
        "2. Provide the corrected TypeScript code",
        "3. Ensure the fix resolves the compilation error",
        "",
        "Return only the fixed code without explanations.",
      ].join("\n"),
    );
  });
  if (pointer.value === null) throw new Error("Failed to modify test code.");

  const typeReferences: string[] = Array.from(
    new Set(
      Object.keys(artifacts.document.components.schemas).map(
        (key) => key.split(".")[0]!,
      ),
    ),
  );

  pointer.value.content = pointer.value.content
    .replace(/^[ \t]*import\b[\s\S]*?;[ \t]*$/gm, "")
    .trim();
  pointer.value.content = [
    `import { TestValidator } from "@nestia/e2e";`,
    `import typia, { tags } from "typia";`,
    "",
    `import api from "@ORGANIZATION/PROJECT-api";`,
    ...typeReferences.map(
      (ref) =>
        `import type { ${ref} } from "@ORGANIZATION/PROJECT-api/lib/structures/${ref}";`,
    ),
    "",
    pointer.value.content,
  ].join("\n");

  pointer.value.content = pointer.value.content.replaceAll(
    'string & Format<"uuid">',
    'string & tags.Format<"uuid">',
  );

  return pointer.value;
}

function transformLines(code: string) {
  return code.split("\n").map((line, num, arr) => {
    const start = arr
      .slice(0, num)
      .map((el) => el.length + 1)
      .reduce((acc, cur) => acc + cur, 0);
    return {
      line: num + 1,
      text: line,
      start: start,
      end: start + line.length + 1, // exclusive
    };
  });
}

function formatDiagnostic(
  code: string,
  lines: {
    line: number; // line number
    text: string;
    start: number;
    end: number; // exclusive
  }[],
  diagnostic: IAutoBeTypeScriptCompilerResult.IDiagnostic,
): string {
  const { start, length, messageText } = diagnostic;
  const message = messageText;
  if (typeof start === "number" && typeof length === "number") {
    const end = start + length;
    const problematicCode = code.substring(start, end);
    const errorLine = lines.find((line) => line.end > start) ?? null;
    const lineText = errorLine?.text ?? "";

    const hints = getHints(message, lineText);

    function createAdjustedArray(n: number): number[] {
      let start = n - 2;

      // 시작 값이 음수라면, 0부터 시작해서 5개의 숫자 생성
      if (start < 0) {
        start = 0;
      }

      return Array.from({ length: 5 }, (_, i) => start + i);
    }

    const errorLines = createAdjustedArray(errorLine?.line ?? 0);

    const context = errorLines
      .map((num) => {
        if (num === errorLine?.line) {
          if (lines[num - 1]) {
            return `${lines[num - 1]?.text} // <- ERROR LINE (line:${num})`;
          }
        }
        if (lines[num - 1]) {
          return lines[num - 1]?.text;
        }

        return null;
      })
      .filter((el) => el !== null);

    return [
      "## Error Information",
      `- Position: Characters ${start} to ${end}`,
      `- Error Message: ${message}`,
      `- Error Lines: \n${
        context.length
          ? [
              "\t```ts", //
              ...context.map((el) => `\t${el}`),
              "\t```",
            ].join("\n")
          : "(none)"
      }`,
      `- Problematic Code: ${problematicCode.length > 0 ? `\`${problematicCode}\`` : "(none)"}`,
      ...hints.map((hint) => `- Hint: ${hint}`),
    ].join("\n");
  }
  return ["## Error Information", `- Error Message: ${message}`].join("\n");
}

function getHints(message: string, lineText: string): string[] {
  const isTestValidator = lineText.includes("TestValidator");
  const isTypia =
    message === "Cannot find name 'Format'. Did you mean 'FormData'?";
  const isJest = message === "Cannot find name 'expect'.";
  const isCurrying =
    isTestValidator && message === "Expected 1 arguments, but got 2";
  const isAssignability =
    /Argument of type '([^']+)' is not assignable to parameter of type '([^']+)'/.test(
      message,
    );

  const hints: string[] = [];

  if (isTypia) {
    hints.push(
      "If you want to use typia tags, use `tags.Format` instead of `Format`.",
    );
  }

  if (isJest) {
    hints.push(
      'Detected invalid `expect` usage. Use `TestValidator.equals("description")(expected)(actual)`.',
    );
  }

  if (isCurrying) {
    hints.push(
      "`TestValidator.equals` is a curried function and must be called in **three steps**: `title → expected → actual`.",
    );
  } else if (isTestValidator) {
    hints.push(
      "The second argument `expected` must be assignable from the type of `actual`. Consider swapping the order if you get a type error.",
    );
  }

  if (isAssignability && isTestValidator) {
    const match = lineText
      .trim()
      .match(/TestValidator\.equals\("([^"]+)"\)\(([^)]+)\)\(([^)]+)\)/);
    if (match) {
      const [, title, expected, actual] = match;
      if (actual.includes(expected)) {
        hints.push(
          `You can try rearranging the order like this: TestValidator.equals("${title}")(${actual})(${expected})`,
        );
      }
    }
  }

  return hints;
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
