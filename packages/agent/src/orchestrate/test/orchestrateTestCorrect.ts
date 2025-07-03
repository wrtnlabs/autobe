import { IAgenticaController, MicroAgentica } from "@agentica/core";
import {
  AutoBeTestValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { complementTestWrite } from "./compile/complementTestWrite";
import { IAutoBeTestWriteResult } from "./structures/IAutoBeTestWriteResult";
import { transformTestCorrectHistories } from "./transformTestCorrectHistories";

export function orchestrateTestCorrect<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  results: IAutoBeTestWriteResult[],
  life: number = 4,
): Promise<AutoBeTestValidateEvent[]> {
  return Promise.all(
    results.map(async (written) => {
      const event: AutoBeTestValidateEvent = await compile(ctx, written);
      return predicate(ctx, written, event, life);
    }),
  );
}

async function correct<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> {
  if (event.result.type !== "failure") return event;
  else if (--life <= 0) return event;

  const pointer: IPointer<ICorrectTestFunctionProps | null> = {
    value: null,
  };
  const agentica = new MicroAgentica({
    model: ctx.model,
    vendor: { ...ctx.vendor },
    config: {
      ...(ctx.config ?? {}),
    },
    histories: await transformTestCorrectHistories(ctx, written, event.result),
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

  await agentica
    .conversate(
      [
        "# Instructions",
        "1. Focus on the specific error location and message",
        "2. Provide the corrected TypeScript code",
        "3. Ensure the fix resolves the compilation error",
        "",
        "Return only the fixed code without explanations.",
      ].join("\n"),
    )
    .finally(() => {
      const tokenUsage = agentica.getTokenUsage();
      ctx.usage().record(tokenUsage, ["test"]);
    });
  if (pointer.value === null) throw new Error("Failed to modify test code.");
  pointer.value.content = complementTestWrite({
    content: pointer.value.content,
    artifacts: written.artifacts,
  });

  event = await compile(ctx, {
    ...written,
    file: {
      ...written.file,
      content: pointer.value.content,
    },
  });
  return predicate(ctx, written, event, life);
}

async function predicate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
  event: AutoBeTestValidateEvent,
  life: number,
): Promise<AutoBeTestValidateEvent> {
  ctx.dispatch(event);
  return event.result.type === "failure"
    ? correct(ctx, written, event, life - 1)
    : event;
}

async function compile<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  written: IAutoBeTestWriteResult,
): Promise<AutoBeTestValidateEvent> {
  const compiled: IAutoBeTypeScriptCompileResult =
    await ctx.compiler.test.compile({
      files: {
        ...written.artifacts.dto,
        ...written.artifacts.sdk,
        [written.file.location]: written.file.content,
      },
    });
  return {
    type: "testValidate",
    file: written.file,
    result: compiled,
    created_at: new Date().toISOString(),
    step: ctx.state().analyze?.step ?? 0,
  };
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
