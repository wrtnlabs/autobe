import { IAgenticaController } from "@agentica/core";
import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import {
  AutoBeFunctionCallingMetricFactory,
  AutoBeOpenApiTypeChecker,
} from "@autobe/utils";
import { LlmTypeChecker } from "@typia/utils";
import { IPointer } from "tstl";
import typia, { ILlmApplication, ILlmSchema, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsageComponent } from "../../context/AutoBeTokenUsageComponent";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { transformTestPrepareWriteHistory } from "./histories/transformTestPrepareWriteHistory";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";
import { IAutoBeTestPrepareWriteApplication } from "./structures/IAutoBeTestPrepareWriteApplication";

const MAX_WRITE_ATTEMPTS = 3;

/**
 * Orchestrates the generation of test data preparation functions.
 *
 * Uses a write-validate-correct loop to ensure TypeScript compilation
 * correctness. Non-property types are generated directly without LLM.
 */
export const orchestrateTestPrepareWrite = async (
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
  },
): Promise<IAutoBeTestPrepareProcedure[]> => {
  interface ICreateType {
    key: string;
    value: AutoBeOpenApi.IJsonSchema.IObject;
  }
  const createTypes: ICreateType[] = [];
  for (const [key, value] of Object.entries(props.document.components.schemas))
    if (
      key.endsWith(".ICreate") &&
      AutoBeOpenApiTypeChecker.isObject(value) === true
    )
      createTypes.push({
        key,
        value,
      });

  const result: Array<IAutoBeTestPrepareProcedure | null> =
    await executeCachedBatch(
      ctx,
      createTypes.map((entry) => async (promptCacheKey) => {
        try {
          return await forceRetry(() =>
            process(ctx, {
              document: props.document,
              typeName: entry.key,
              schema: entry.value,
              instruction: props.instruction,
              promptCacheKey,
              progress: props.progress,
            }),
          );
        } catch {
          return null;
        }
      }),
    );

  return result.filter((r) => r !== null);
};

// ── Types ──

interface IWriteFailure {
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
  iteration: number;
}

// ── Main loop ──

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
    instruction: string;
  },
): Promise<IAutoBeTestPrepareProcedure> {
  // Non-property types — direct code generation without LLM
  if (
    !!props.schema.additionalProperties === false &&
    Object.keys(props.schema.properties).length === 0
  ) {
    const functionName: string = AutoBeTestPrepareProgrammer.getFunctionName(
      props.typeName,
    );
    const content: string =
      await AutoBeTestPrepareProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        typeName: props.typeName,
        schemas: props.document.components.schemas,
        content: AutoBeTestPrepareProgrammer.writeNonPropertyCode({
          typeName: props.typeName,
          schema: props.schema,
        }),
      });
    const func: AutoBeTestPrepareFunction = {
      type: "prepare",
      location: `test/prepare/${functionName}.ts`,
      content,
      typeName: props.typeName,
      name: functionName,
    };
    ctx.dispatch({
      id: v7(),
      type: "testWrite",
      function: func,
      completed: ++props.progress.completed,
      total: props.progress.total,
      step: ctx.state().interface?.step ?? 0,
      tokenUsage: new AutoBeTokenUsageComponent(),
      metric: AutoBeFunctionCallingMetricFactory.create(),
      created_at: new Date().toISOString(),
    } satisfies AutoBeTestWriteEvent<AutoBeTestPrepareFunction>);
    return {
      type: "prepare",
      typeName: props.typeName,
      schema: props.schema,
      function: func,
    };
  }

  // Write-validate-correct loop
  const functionName: string = AutoBeTestPrepareProgrammer.getFunctionName(
    props.typeName,
  );
  const location: string = `test/prepare/${functionName}.ts`;
  let lastWrite: IAutoBeTestPrepareWriteApplication.IWrite | null = null;
  let writeSucceeded = false;
  const failures: IWriteFailure[] = [];
  const maxIterations = MAX_WRITE_ATTEMPTS * 3;
  const dummyProgress: AutoBeProgressEventBase = { completed: 0, total: 0 };

  for (let i = 0; i < maxIterations; i++) {
    const action: IPointer<
      | { type: "write"; data: IAutoBeTestPrepareWriteApplication.IWrite }
      | { type: "complete" }
      | null
    > = { value: null };

    const result: AutoBeContext.IResult = await ctx.conversate({
      source: "testWrite",
      controller: createController({
        dtoTypeName: props.typeName,
        schema: props.schema,
        writeSucceeded,
        action,
      }),
      enforceFunctionCall: true,
      promptCacheKey: props.promptCacheKey,
      ...(await buildHistories(ctx, {
        typeName: props.typeName,
        schema: props.schema,
        document: props.document,
        instruction: props.instruction,
        failures,
        writeSucceeded,
      })),
    });

    // No action — shouldn't happen, skip
    if (action.value === null) continue;

    // WRITE — compile and validate
    if (action.value.type === "write") {
      const writeData = action.value.data;
      const code: string =
        await AutoBeTestPrepareProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          typeName: props.typeName,
          schemas: props.document.components.schemas,
          content: writeData.revise.final ?? writeData.draft,
        });

      const func: AutoBeTestPrepareFunction = {
        type: "prepare",
        location,
        content: code,
        typeName: props.typeName,
        name: functionName,
      };
      const procedure: IAutoBeTestPrepareProcedure = {
        type: "prepare",
        typeName: props.typeName,
        schema: props.schema,
        function: func,
      };

      const compileEvent: AutoBeTestValidateEvent<AutoBeTestPrepareFunction> =
        await AutoBeTestPrepareProgrammer.compile({
          compiler: await ctx.compiler(),
          document: props.document,
          procedure,
          progress: dummyProgress,
          step: ctx.state().analyze?.step ?? 0,
        });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileEvent.result.type === "failure"
          ? compileEvent.result.diagnostics.filter(
              (d) => d.file === func.location,
            )
          : [];

      if (diagnostics.length === 0) {
        lastWrite = writeData;
        writeSucceeded = true;
      } else {
        failures.push({ diagnostics, iteration: i });
        if (failures.length >= MAX_WRITE_ATTEMPTS) {
          throw new Error(
            `testPrepareWrite: ${props.typeName} exhausted ${MAX_WRITE_ATTEMPTS} write attempts`,
          );
        }
      }
      continue;
    }

    // COMPLETE — finalize
    if (action.value.type === "complete" && lastWrite !== null) {
      const code: string =
        await AutoBeTestPrepareProgrammer.replaceImportStatements({
          compiler: await ctx.compiler(),
          typeName: props.typeName,
          schemas: props.document.components.schemas,
          content: lastWrite.revise.final ?? lastWrite.draft,
        });
      const func: AutoBeTestPrepareFunction = {
        type: "prepare",
        location,
        content: code,
        typeName: props.typeName,
        name: functionName,
      };
      ctx.dispatch({
        id: v7(),
        type: "testWrite",
        function: func,
        completed: ++props.progress.completed,
        total: props.progress.total,
        step: ctx.state().interface?.step ?? 0,
        tokenUsage: result.tokenUsage,
        metric: result.metric,
        created_at: new Date().toISOString(),
      } satisfies AutoBeTestWriteEvent<AutoBeTestPrepareFunction>);
      return {
        type: "prepare",
        typeName: props.typeName,
        schema: props.schema,
        function: func,
      };
    }
  }

  // Exhausted iterations — use last successful write if available
  if (lastWrite !== null) {
    const code: string =
      await AutoBeTestPrepareProgrammer.replaceImportStatements({
        compiler: await ctx.compiler(),
        typeName: props.typeName,
        schemas: props.document.components.schemas,
        content: lastWrite.revise.final ?? lastWrite.draft,
      });
    return {
      type: "prepare",
      typeName: props.typeName,
      schema: props.schema,
      function: {
        type: "prepare",
        location,
        content: code,
        typeName: props.typeName,
        name: functionName,
      },
    };
  }
  throw new Error(
    `testPrepareWrite: ${props.typeName} exhausted all iterations`,
  );
}

// ── Controller factory ──

function createController(props: {
  dtoTypeName: string;
  schema: AutoBeOpenApi.IJsonSchema.IObject;
  writeSucceeded: boolean;
  action: IPointer<
    | { type: "write"; data: IAutoBeTestPrepareWriteApplication.IWrite }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestPrepareWriteApplication.IProps> => {
    const result: IValidation<IAutoBeTestPrepareWriteApplication.IProps> =
      typia.validate<IAutoBeTestPrepareWriteApplication.IProps>(input);
    if (result.success === false) return result;

    const req = result.data.request;
    if (req.type === "write") {
      const errors: IValidation.IError[] = AutoBeTestPrepareProgrammer.validate(
        {
          typeName: props.dtoTypeName,
          schema: props.schema,
          mappings: req.mappings,
          draft: req.draft,
          revise: req.revise,
        },
      );
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }
    return result;
  };

  let application: ILlmApplication =
    typia.llm.application<IAutoBeTestPrepareWriteApplication>({
      validate: {
        process: validate,
      },
    });
  application = fixCompleteAvailability(application, props.writeSucceeded);

  return {
    protocol: "class",
    name: "testPrepareWrite",
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeTestPrepareWriteApplication,
  };
}

// ── Schema manipulation ──

/** Removes IComplete from the request union when no write has succeeded. */
function fixCompleteAvailability(
  application: ILlmApplication,
  writeSucceeded: boolean,
): ILlmApplication {
  if (writeSucceeded) return application;

  const func = application.functions.find((f) => f.name === "process");
  if (func === undefined) return application;

  const request: ILlmSchema | undefined = func.parameters.properties.request;
  if (request === undefined) return application;
  if (LlmTypeChecker.isAnyOf(request) === false) return application;

  // biome-ignore lint: type narrowing insufficient after isAnyOf guard
  const anyOfSchema = request as ILlmSchema.IAnyOf;
  const children = anyOfSchema.anyOf as ILlmSchema.IReference[];
  // biome-ignore lint: x-discriminator is a runtime extension property
  const mapping: Record<string, string> =
    (anyOfSchema as unknown as Record<string, unknown>)["x-discriminator"] !=
    null
      ? ((
          (anyOfSchema as unknown as Record<string, unknown>)[
            "x-discriminator"
          ] as Record<string, Record<string, string>>
        ).mapping ?? {})
      : {};

  const completeIdx = children.findIndex(
    (c) => c.$ref.endsWith("/IComplete") || c.$ref.endsWith(".IComplete"),
  );
  if (completeIdx !== -1) children.splice(completeIdx, 1);
  delete mapping["complete"];

  return application;
}

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    document: AutoBeOpenApi.IDocument;
    instruction: string;
    failures: IWriteFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformTestPrepareWriteHistory(ctx, {
    typeName: props.typeName,
    schema: props.schema,
    document: props.document,
    instruction: props.instruction,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => ({
    id: v7(),
    type: "systemMessage" as const,
    text:
      `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
      f.diagnostics
        .map(
          (d) =>
            `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
        )
        .join("\n"),
    created_at: new Date().toISOString(),
  }));

  const successEntries = props.writeSucceeded
    ? [
        {
          id: v7(),
          type: "systemMessage" as const,
          text:
            "Your last write attempt passed TypeScript compilation successfully. " +
            "You may now call complete(confirm: true) to finalize.",
          created_at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    ...base,
    histories: [...base.histories, ...failureEntries, ...successEntries],
  };
}
