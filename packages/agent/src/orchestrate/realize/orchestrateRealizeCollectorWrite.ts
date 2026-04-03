import { IAgenticaController } from "@agentica/core";
import {
  AutoBeDatabase,
  AutoBeEventSource,
  AutoBeInterfaceHistory,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
  AutoBeRealizeCollectorPlan,
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
import { transformRealizeCollectorWriteHistory } from "./histories/transformRealizeCollectorWriteHistory";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";
import { compileRealizeFiles } from "./programmers/compileRealizeFiles";
import { IAutoBeRealizeCollectorWriteApplication } from "./structures/IAutoBeRealizeCollectorWriteApplication";

export async function orchestrateRealizeCollectorWrite(
  ctx: AutoBeContext,
  props: {
    plans: AutoBeRealizeCollectorPlan[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> {
  const history: AutoBeInterfaceHistory | null = ctx.state().interface;
  if (history === null)
    throw new Error("Cannot realize collector write without interface.");

  const document: AutoBeOpenApi.IDocument = history.document;
  const getNeighbors = (
    plan: AutoBeRealizeCollectorPlan,
  ): AutoBeRealizeCollectorPlan[] => {
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
  const result: AutoBeRealizeCollectorFunction[] = await executeCachedBatch(
    ctx,
    props.plans.map(
      (x) => (promptCacheKey) =>
        forceRetry(() =>
          process(ctx, {
            document: history.document,
            progress: props.progress,
            neighbors: getNeighbors(x),
            plan: x,
            promptCacheKey,
          }),
        ),
    ),
  );
  return result;
}

// ── Main process ──

async function process(
  ctx: AutoBeContext,
  props: {
    document: AutoBeOpenApi.IDocument;
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    promptCacheKey: string;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction> {
  const models: AutoBeDatabase.IModel[] = ctx
    .state()
    .database!.result.data.files.map((f) => f.models)
    .flat();
  const dtoTypeName: string = props.plan.dtoTypeName;
  const location: string = `src/collectors/${AutoBeRealizeCollectorProgrammer.getName(dtoTypeName)}.ts`;

  const cyclinic = new AutoBeCyclinicController<"databaseSchemas">({
    state: ctx.state(),
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeCollectorWriteApplication>(),
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
            data: IAutoBeRealizeCollectorWriteApplication.IWrite;
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
        await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: props.document.components.schemas,
          code: writeData.revise.final ?? writeData.draft,
        });

      const functor: AutoBeRealizeCollectorFunction = {
        type: "collector",
        plan: props.plan,
        neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(code),
        location,
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
        await AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName,
          schemas: props.document.components.schemas,
          code: lastWrite.revise.final ?? lastWrite.draft,
        });
      const functor: AutoBeRealizeCollectorFunction = {
        type: "collector",
        plan: props.plan,
        neighbors: AutoBeRealizeCollectorProgrammer.getNeighbors(content),
        location,
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
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    cyclinic: AutoBeCyclinicController<"databaseSchemas">;
    action: IPointer<
      | { type: "write"; data: IAutoBeRealizeCollectorWriteApplication.IWrite }
      | { type: "complete" }
      | null
    >;
  },
): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> => {
    const result: IValidation<IAutoBeRealizeCollectorWriteApplication.IProps> =
      typia.validate<IAutoBeRealizeCollectorWriteApplication.IProps>(input);
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type !== "write" && req.type !== "complete")
      return preliminary.validate({
        thinking: result.data.thinking,
        request: req,
      });

    if (req.type === "write") {
      const errors: IValidation.IError[] =
        AutoBeRealizeCollectorProgrammer.validate({
          application: ctx.state().database!.result.data,
          mappings: req.mappings,
          plan: props.plan,
          neighbors: props.neighbors,
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
    typia.llm.application<IAutoBeRealizeCollectorWriteApplication>({
      validate: { process: validate },
    }),
  );
  AutoBeRealizeCollectorProgrammer.fixApplication({
    definition: application,
    application: ctx.state().database!.result.data,
    model: ctx
      .state()
      .database!.result.data.files.map((f) => f.models)
      .flat()
      .find((m) => m.name === props.plan.databaseSchemaName)!,
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
    } satisfies IAutoBeRealizeCollectorWriteApplication,
  };
}

// ── History builder ──

async function buildHistories(
  ctx: AutoBeContext,
  props: {
    plan: AutoBeRealizeCollectorPlan;
    neighbors: AutoBeRealizeCollectorPlan[];
    preliminary: AutoBeCyclinicController.IProcessContext<"databaseSchemas">["preliminary"];
    failures: AutoBeCyclinicController.IFailure[];
    writeSucceeded: boolean;
  },
) {
  const base = await transformRealizeCollectorWriteHistory(ctx, {
    plan: props.plan,
    neighbors: props.neighbors,
    preliminary: props.preliminary,
  });

  if (props.failures.length === 0 && !props.writeSucceeded) return base;

  const failureEntries = props.failures.map((f) => {
    const text =
      typeof f.diagnostics === "string"
        ? `[Iteration ${f.iteration + 1}] ${f.diagnostics}`
        : `[Write attempt ${f.iteration + 1} FAILED] TypeScript compilation errors:\n` +
          (f.diagnostics as IAutoBeTypeScriptCompileResult.IDiagnostic[])
            .map(
              (d) =>
                `  - ${d.file ?? "unknown"} ${d.category} TS${d.code}: ${d.messageText}`,
            )
            .join("\n");
    return {
      id: v7(),
      type: "systemMessage" as const,
      text,
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

const SOURCE = "realizeWrite" satisfies AutoBeEventSource;
