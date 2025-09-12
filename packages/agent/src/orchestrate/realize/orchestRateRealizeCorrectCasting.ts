import {
  AutoBeProgressEventBase,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  AutoBeRealizeValidateEvent,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmController, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { transformCommonCorrectCastingHistories } from "../common/histories/transformCommonCorrectCastingHistories";
import { IAutoBeCommonCorrectCastingApplication } from "../common/structures/IAutoBeCommonCorrectCastingApplication";
import { compileRealizeFiles } from "./internal/compileRealizeFiles";

export const orchestrateRealizeCorrectCasting = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  progress: AutoBeProgressEventBase,
  life: number = ctx.retry,
): Promise<AutoBeRealizeFunction[]> => {
  const validateEvent: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    {
      authorizations,
      functions,
    },
  );

  return predicate(
    ctx,
    authorizations,
    functions,
    [],
    progress,
    validateEvent,
    life,
  );
};

const predicate = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  progress: AutoBeProgressEventBase,
  event: AutoBeRealizeValidateEvent,
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  if (event.result.type === "failure") {
    ctx.dispatch(event);

    return await correct(
      ctx,
      authorizations,
      functions,
      [
        ...failures,
        ...(event.result.type === "failure" ? event.result.diagnostics : []),
      ],
      progress,
      event,
      life - 1,
    );
  }
  return functions;
};

const correct = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  authorizations: AutoBeRealizeAuthorization[],
  functions: AutoBeRealizeFunction[],
  failures: IAutoBeTypeScriptCompileResult.IDiagnostic[],
  progress: AutoBeProgressEventBase,
  event: AutoBeRealizeValidateEvent,
  life: number,
): Promise<AutoBeRealizeFunction[]> => {
  if (event.result.type !== "failure") return functions;
  else if (life < 0) return functions;

  const pointer: IPointer<
    IAutoBeCommonCorrectCastingApplication.IProps | false | null
  > = {
    value: null,
  };

  const diagnostics = event.result.diagnostics;
  const locations: string[] = Array.from(
    new Set(
      diagnostics.map((d) => d.file).filter((f): f is string => f !== null),
    ),
  );

  progress.total += locations.length;

  const converted = await executeCachedBatch(
    locations.map((location) => async () => {
      const func = functions.find((f) => f.location === location)!;

      const { tokenUsage } = await ctx.conversate({
        source: "realizeCorrect",
        histories: transformCommonCorrectCastingHistories([
          {
            script: func.content,
            diagnostics: failures.filter((d) => d.file === location),
          },
        ]),
        controller: createController({
          model: ctx.model,
          then: (next) => {
            pointer.value = next;
          },
          reject: () => {
            pointer.value = false;
          },
        }),
        enforceFunctionCall: true,
        message: StringUtil.trim`
          Fix the TypeScript casting problems to resolve the compilation error.

          Most casting errors are caused by type mismatches between Date types and 
          string & tags.Format<'date-time'>. To fix these:
          - Use the pre-provided toISOStringSafe() function to convert Date to string
          - Or use Date object's .toISOString() method
          - Never use Date type directly in declarations or return values

          You don't need to explain me anything, but just fix or give it up 
          immediately without any hesitation, explanation, and questions.
        `,
      });
      ++progress.completed;
      if (pointer.value === null) return func;
      else if (pointer.value === false) return func;

      ctx.dispatch({
        id: v7(),
        type: "realizeCorrect",
        content: pointer.value.revise.final,
        created_at: new Date().toISOString(),
        location: func.location,
        step: ctx.state().analyze?.step ?? 0,
        tokenUsage,
        completed: progress.completed,
        total: progress.total,
      });

      return { ...func, content: pointer.value.revise.final };
    }),
  );

  const newValidate: AutoBeRealizeValidateEvent = await compileRealizeFiles(
    ctx,
    { authorizations, functions },
  );

  return await predicate(
    ctx,
    authorizations,
    converted,
    [
      ...failures,
      ...(newValidate.result.type === "failure"
        ? newValidate.result.diagnostics
        : []),
    ],
    progress,
    newValidate,
    life - 1,
  );
};

const createController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  then: (next: IAutoBeCommonCorrectCastingApplication.IProps) => void;
  reject: () => void;
}): ILlmController<Model> => {
  assertSchemaModel(props.model);
  const application = collection[
    props.model === "chatgpt" ? "chatgpt" : "claude"
  ] satisfies ILlmApplication<any> as any as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "correctInvalidRequest",
    application,
    execute: {
      rewrite: (next) => {
        props.then(next);
      },
      reject: () => {
        props.reject();
      },
    } satisfies IAutoBeCommonCorrectCastingApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "chatgpt"
  >(),
  claude: typia.llm.application<
    IAutoBeCommonCorrectCastingApplication,
    "claude"
  >(),
};
