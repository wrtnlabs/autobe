import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeTransformerFunction,
  AutoBeRealizeTransformerPlan,
  AutoBeRealizeWriteEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";
import { IPointer } from "tstl";
import typia, { IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformRealizeTransformerWriteHistory } from "./histories/transformRealizeTransformerWriteHistory";
import { AutoBeRealizeTransformerProgrammer } from "./programmers/AutoBeRealizeTransformerProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeTransformerWriteApplication } from "./structures/IAutoBeRealizeTransformerWriteApplication";

export async function orchestrateRealizeTransformerWrite(
  ctx: AutoBeContext,
  props: {
    plans: AutoBeRealizeTransformerPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize transformer write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeTransformerPlan,
  ): AutoBeRealizeTransformerPlan[] => {
    const visited: Set<string> = new Set();
    AutoBeOpenApiTypeChecker.visit({
      components: document.components,
      schema: { $ref: `#/components/schemas/${plan.dtoTypeName}` },
      closure: (next) => {
        if (AutoBeOpenApiTypeChecker.isReference(next)) {
          const key: string = next.$ref.split("/").pop()!;
          visited.add(key);
        }
      },
    });
    return props.plans.filter(
      (p) => p.dtoTypeName !== plan.dtoTypeName && visited.has(p.dtoTypeName),
    );
  };

  props.progress.total += props.plans.length;
  return await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            progress: props.progress,
            neighbors: getNeighbors(x),
            plan: x,
            promptCacheKey,
          }),
        ),
    ),
  );
}

// ── Main process ──

async function process(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeTransformerFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const document: AutoBeOpenApi.IDocument = ctx.state().interface!.document;
  const dtoTypeName: string = props.plan.dtoTypeName;

  const cyclinic = new AutoBeCyclinicController<"databaseSchemas">({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeTransformerWriteApplication>(),
    kinds: ["databaseSchemas"],
    local: {
      databaseSchemas: models.filter(
        (m) => m.name === props.plan.databaseSchemaName,
      ),
    },
  });

  return await cyclinic.orchestrate(
    ctx,
    // PROCESS: LLM conversation → action
    async (context) => {
      const action: IPointer<
        | {
            type: "write";
            data: IAutoBeRealizeTransformerWriteApplication.IWrite;
          }
        | { type: "complete" }
        | null
      > = { value: null };

      const result = await ctx.conversate({
        source: SOURCE,
        controller: createController(ctx, {
          plan: props.plan,
          neighbors: props.neighbors,
          cyclinic,
          action,
        }),
        enforceFunctionCall: true,
        promptCacheKey: props.promptCacheKey,
        ...(await buildHistories(ctx, {
          plan: props.plan,
          neighbors: props.neighbors,
          preliminary: context.preliminary,
          failures: context.failures,
          writeSucceeded: context.writeSucceeded,
        })),
      });

      return { result, action: action.value };
    },
    // VALIDATE: TypeScript compilation
    async (writeData) => {
      const code: string =
        await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: document.components.schemas,
          code: writeData.revise.final ?? writeData.draft,
        });

      const functor: AutoBeRealizeTransformerFunction = {
        type: "transformer",
        plan: props.plan,
        neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(code),
        location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(dtoTypeName)}.ts`,
        content: code,
      };

      const compileResult = await compileRealizeFiles(ctx, {
        functions: [functor],
        additional: {},
        progress: () => props.progress,
      });

      const diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
        compileResult.result.type === "failure"
          ? compileResult.result.diagnostics.filter(
              (d) => d.file === functor.location,
            )
          : [];

      return { success: diagnostics.length === 0, diagnostics };
    },
    // FINALIZE: dispatch event and return functor
    async (lastWrite, result) => {
      const content: string =
        await AutoBeRealizeTransformerProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: document.components.schemas,
          code: lastWrite.revise.final ?? lastWrite.draft,
        });
      const functor: AutoBeRealizeTransformerFunction = {
        type: "transformer",
        plan: props.plan,
        neighbors: AutoBeRealizeTransformerProgrammer.getNeighbors(content),
        location: `src/transformers/${AutoBeRealizeTransformerProgrammer.getName(dtoTypeName)}.ts`,
        content,
      };
      if (result !== null)
        ctx.dispatch({
          id: v7(),
          type: "realizeWrite",
          function: functor,
          acquisition: cyclinic.getPreliminary().getAcquisition(),
          metric: result.metric,
          tokenUsage: result.tokenUsage,
          completed: ++props.progress.completed,
          total: props.progress.total,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        } satisfies AutoBeRealizeWriteEvent);
      return functor;
    },
  );
}

// ── Controller factory ──

function createController(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    cyclinic: AutoBeCyclinicController<"databaseSchemas">;
    action: IPointer<
      | {
          type: "write";
          data: IAutoBeRealizeTransformerWriteApplication.IWrite;
        }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeRealizeTransformerWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeTransformerWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    if (req.type === "write") {
      const errors: IValidation.IError[] =
        AutoBeRealizeTransformerProgrammer.validate({
          application: ctx.state().database!.result.data,
          document: ctx.state().interface!.document,
          plan: props.plan,
          neighbors: props.neighbors,
          transformMappings: req.transformMappings,
          selectMappings: req.selectMappings,
          draft: req.draft,
          revise: req.revise,
        });
      return errors.length
        ? { success: false, errors, data: result.data }
        : result;
    }
    return result;
  };

  let application = preliminary.fixApplication(
    typia.llm.application<IAutoBeRealizeTransformerWriteApplication>({
      validate: { process: validate },
    }),
  );
  AutoBeRealizeTransformerProgrammer.fixApplication({
    definition: application,
    application: ctx.state().database!.result.data,
    document: ctx.state().interface!.document,
    plan: props.plan,
  });
  application = props.cyclinic.fixCompleteAvailability(application);

  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeRealizeTransformerWriteApplication,
  };
}

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeTransformerPlan;
    neighbors: AutoBeRealizeTransformerPlan[];
    preliminary: AutoBeCyclinicController.IProcessContext<"databaseSchemas">["preliminary"];
    failures: AutoBeCyclinicController.IFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformRealizeTransformerWriteHistory(ctx, {
    plan: props.plan,
    neighbors: props.neighbors,
    preliminary: props.preliminary,
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

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeTransformerWriteApplication.IProps>;

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
