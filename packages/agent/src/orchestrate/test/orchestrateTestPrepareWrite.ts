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
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeTokenUsageComponent } from "../../context/AutoBeTokenUsageComponent";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformTestPrepareWriteHistory } from "./histories/transformTestPrepareWriteHistory";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";
import { IAutoBeTestPrepareWriteApplication } from "./structures/IAutoBeTestPrepareWriteApplication";

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

// ── Main process ──

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

  // LLM write-validate-correct loop
  const functionName: string = AutoBeTestPrepareProgrammer.getFunctionName(
    props.typeName,
  );
  const location: string = `test/prepare/${functionName}.ts`;

  const cyclinic = new AutoBeCyclinicController<never>({
    application: typia.json.application<IAutoBeTestPrepareWriteApplication>(),
    source: "testWrite",
    kinds: [],
    state: ctx.state(),
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | { type: "write"; data: IAutoBeTestPrepareWriteApplication.IWrite }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: "testWrite",
        controller: createController({
          dtoTypeName: props.typeName,
          schema: props.schema,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...(await buildHistories(ctx, {
          typeName: props.typeName,
          schema: props.schema,
          document: props.document,
          instruction: props.instruction,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        })),
      });

      return { result, action: action.value };
    },
    // VALIDATE: TypeScript compilation
    async (writeData) => {
      const dummyProgress: AutoBeProgressEventBase = { completed: 0, total: 0 };
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

      return { success: diagnostics.length === 0, diagnostics };
    },
    // FINALIZE: dispatch event and return procedure
    async (lastWrite, result) => {
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
      if (result !== null)
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
    },
  );
}

// ── Controller factory ──

function createController(props: {
  dtoTypeName: string;
  schema: AutoBeOpenApi.IJsonSchema.IObject;
  cyclinic: AutoBeCyclinicController<never>;
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

  const application = props.cyclinic.fixCompleteAvailability(
    typia.llm.application<IAutoBeTestPrepareWriteApplication>({
      validate: { process: validate },
    }),
  );

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

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    typeName: string;
    schema: AutoBeOpenApi.IJsonSchema.IObject;
    document: AutoBeOpenApi.IDocument;
    instruction: string;
    failures: AutoBeCyclinicController.IFailure[];
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

  const failureEntries = props.failures.map((f) => {
    const diagnostics =
      f.diagnostics as IAutoBeTypeScriptCompileResult.IDiagnostic[];
    return {
      id: v7(),
      type: "systemMessage" as const,
      text:
        `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
        diagnostics
          .map(
            (d) =>
              `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
          )
          .join("\n"),
      created_at: new Date().toISOString(),
    };
  });

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
