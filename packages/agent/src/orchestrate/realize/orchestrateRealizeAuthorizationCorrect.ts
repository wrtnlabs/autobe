import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeRealizeAuthorization,
  AutoBeRealizeAuthorizationCorrect,
  IAutoBeCompiler,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { IPointer } from "tstl";
import typia, { ILlmApplication, IValidation } from "typia";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeCyclinicController } from "../common/AutoBeCyclinicController";
import { transformRealizeAuthorizationCorrectHistory } from "./histories/transformRealizeAuthorizationCorrectHistory";
import { IAutoBeRealizeAuthorizationCorrectApplication } from "./structures/IAutoBeRealizeAuthorizationCorrectApplication";
import { AuthorizationFileSystem } from "./utils/AuthorizationFileSystem";
import { AutoBeRealizeAuthorizationReplaceImport } from "./utils/AutoBeRealizeAuthorizationReplaceImport";

export async function orchestrateRealizeAuthorizationCorrect(
  ctx: AutoBeContext,
  props: {
    authorization: AutoBeRealizeAuthorization;
    template: Record<string, string>;
    prismaClient: Record<string, string>;
  },
): Promise<AutoBeRealizeAuthorization> {
  const compiler: IAutoBeCompiler = await ctx.compiler();

  const compiled: IAutoBeTypeScriptCompileResult = await compileAuthorization(
    compiler,
    props.authorization,
    props,
  );

  ctx.dispatch({
    type: "realizeAuthorizationValidate",
    id: v7(),
    created_at: new Date().toISOString(),
    authorization: props.authorization,
    result: compiled,
    step: ctx.state().test?.step ?? 0,
  });

  if (compiled.type === "success" || compiled.type === "exception") {
    return props.authorization;
  }

  // Track mutable state across iterations
  let currentDiagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[] =
    compiled.diagnostics;
  let lastCorrect: AutoBeRealizeAuthorization | null = null;
  let previousWrite: IAutoBeRealizeAuthorizationCorrectApplication.IWrite | null =
    null;

  const cyclinic = new AutoBeCyclinicController<"databaseSchemas">({
    source: SOURCE,
    application:
      typia.json.application<IAutoBeRealizeAuthorizationCorrectApplication>(),
    kinds: ["databaseSchemas"],
    state: ctx.state(),
    maxIterations: AutoBeConfigConstant.COMPILER_RETRY,
  });

  try {
    return await cyclinic.orchestrate(
      ctx,
      // PROCESS: LLM conversation → action
      async (context) => {
        const action: IPointer<
          | {
              type: "write";
              data: IAutoBeRealizeAuthorizationCorrectApplication.IWrite;
            }
          | { type: "complete" }
          | null
        > = { value: null };

        const result: AutoBeContext.IResult = await ctx.conversate({
          source: SOURCE,
          controller: createController({ cyclinic, action }),
          enforceFunctionCall: true,
          ...transformRealizeAuthorizationCorrectHistory({
            authorization: props.authorization,
            template: props.template,
            diagnostics: currentDiagnostics,
            preliminary: context.preliminary,
            previousWrite,
          }),
        });

        return { result, action: action.value };
      },
      // VALIDATE: compile the submitted write and track diagnostics
      async (writeData) => {
        previousWrite = writeData;
        const correct = await buildCorrect(compiler, writeData, props);
        const compileResult = await compileAuthorization(
          compiler,
          correct,
          props,
        );

        ctx.dispatch({
          type: "realizeAuthorizationValidate",
          id: v7(),
          created_at: new Date().toISOString(),
          authorization: correct,
          result: compileResult,
          step: ctx.state().test?.step ?? 0,
        });

        if (compileResult.type === "success") {
          lastCorrect = correct;
          return { success: true };
        }
        if (compileResult.type === "failure") {
          currentDiagnostics = compileResult.diagnostics;
          return { success: false, diagnostics: compileResult.diagnostics };
        }
        // exception — treat as failure without updating diagnostics
        return { success: false };
      },
      // FINALIZE: dispatch event and return corrected authorization
      async (lastWrite, result) => {
        const authorization: AutoBeRealizeAuthorization =
          lastCorrect ?? (await buildCorrect(compiler, lastWrite, props));
        if (result !== null)
          ctx.dispatch({
            type: "realizeAuthorizationCorrect",
            id: v7(),
            created_at: new Date().toISOString(),
            authorization: authorization as AutoBeRealizeAuthorizationCorrect,
            result: compiled as IAutoBeTypeScriptCompileResult.IFailure,
            acquisition: cyclinic.getPreliminary().getAcquisition(),
            metric: result.metric,
            tokenUsage: result.tokenUsage,
            step: ctx.state().test?.step ?? 0,
          });
        return authorization;
      },
    );
  } catch {
    return props.authorization;
  }
}

// ── Helpers ──

async function buildCorrect(
  compiler: IAutoBeCompiler,
  write: IAutoBeRealizeAuthorizationCorrectApplication.IWrite,
  props: {
    authorization: AutoBeRealizeAuthorization;
    template: Record<string, string>;
    prismaClient: Record<string, string>;
  },
): Promise<AutoBeRealizeAuthorization> {
  return {
    actor: props.authorization.actor,
    decorator: {
      ...write.decorator,
      location: AuthorizationFileSystem.decoratorPath(write.decorator.name),
    },
    provider: {
      ...write.provider,
      location: AuthorizationFileSystem.providerPath(write.provider.name),
    },
    payload: {
      name: write.payload.name,
      location: AuthorizationFileSystem.payloadPath(write.payload.name),
      content: await compiler.typescript.beautify(write.payload.content),
    },
  };
}

async function compileAuthorization(
  compiler: IAutoBeCompiler,
  authorization: AutoBeRealizeAuthorization,
  props: {
    template: Record<string, string>;
    prismaClient: Record<string, string>;
  },
): Promise<IAutoBeTypeScriptCompileResult> {
  const providerContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceProviderImport(
      authorization.actor.name,
      authorization.provider.content,
    ),
  );
  const decoratorContent: string = await compiler.typescript.beautify(
    AutoBeRealizeAuthorizationReplaceImport.replaceDecoratorImport(
      authorization.actor.name,
      authorization.decorator.content,
    ),
  );
  const files: Record<string, string> = {
    ...props.template,
    ...props.prismaClient,
    [AuthorizationFileSystem.decoratorPath(authorization.decorator.name)]:
      decoratorContent,
    [AuthorizationFileSystem.providerPath(authorization.provider.name)]:
      providerContent,
    [AuthorizationFileSystem.payloadPath(authorization.payload.name)]:
      authorization.payload.content,
  };
  return compiler.typescript.compile({ files });
}

// ── Controller factory ──

function createController(props: {
  cyclinic: AutoBeCyclinicController<"databaseSchemas">;
  action: IPointer<
    | {
        type: "write";
        data: IAutoBeRealizeAuthorizationCorrectApplication.IWrite;
      }
    | { type: "complete" }
    | null
  >;
}): IAgenticaController.IClass {
  const preliminary = props.cyclinic.getPreliminary();
  const validate: Validator = (input) => {
    const result =
      typia.validate<IAutoBeRealizeAuthorizationCorrectApplication.IProps>(
        input,
      );
    if (result.success === false) return result;
    const req = result.data.request;
    if (req.type === "write" || req.type === "complete") return result;
    return preliminary.validate({
      thinking: result.data.thinking,
      request: req,
    });
  };

  const application: ILlmApplication = props.cyclinic.fixCompleteAvailability(
    preliminary.fixApplication(
      typia.llm.application<IAutoBeRealizeAuthorizationCorrectApplication>({
        validate: { process: validate },
      }),
    ),
  );

  return {
    protocol: "class",
    name: SOURCE satisfies AutoBeEventSource,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "write")
          props.action.value = { type: "write", data: input.request };
        else if (input.request.type === "complete")
          props.action.value = { type: "complete" };
      },
    } satisfies IAutoBeRealizeAuthorizationCorrectApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeRealizeAuthorizationCorrectApplication.IProps>;

const SOURCE = "realizeAuthorizationCorrect" satisfies AutoBeEventSource;
