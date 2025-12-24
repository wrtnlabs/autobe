import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestAuthorizeWrite } from "./orchestrateTestAuthorizeWrite";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";
import { IAutoBeTestCorrectOverallApplication } from "./structures/IAutoBeTestCorrectOverallApplication";

export async function orchestrateTestAuthorize(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestAuthorizeFunction[]> {
  const compile = async (procedure: IAutoBeTestAuthorizeProcedure) =>
    AutoBeTestAuthorizeProgrammer.compile({
      compiler: await ctx.compiler(),
      procedure,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestAuthorizeProcedure,
  ) =>
    AutoBeTestAuthorizeProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestAuthorizeProcedure[] =
    await orchestrateTestAuthorizeWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      progress: props.writeProgress,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
    },
    procedures,
    progress: props.correctProgress,
  });
  // procedures = await orchestrateTestCorrectRequest(ctx, {
  //   programmer: {
  //     compile,
  //     replaceImportStatements,
  //   },
  //   instruction: props.instruction,
  //   procedures,
  //   progress: props.correctProgress,
  // });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      controller: (next) => createCorrectOverallController(next),
    },
    instruction: props.instruction,
    progress: props.correctProgress,
    procedures,
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController(props: {
  procedure: IAutoBeTestAuthorizeProcedure;
  build: (next: IAutoBeTestCorrectOverallApplication.IProps) => void;
}): ILlmController<IAutoBeTestCorrectOverallApplication> {
  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestCorrectOverallApplication.IProps> =
      typia.validate<IAutoBeTestCorrectOverallApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = AutoBeTestAuthorizeProgrammer.validate(
      {
        procedure: props.procedure,
        draft: result.data.draft,
        revise: result.data.revise,
      },
    );
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestCorrectOverallApplication>({
      validate: {
        rewrite: validate,
      },
    });
  return {
    protocol: "class",
    name: "testCorrect" satisfies AutoBeEventSource,
    application,
    execute: {
      rewrite: (v) => {
        props.build(v);
      },
    } satisfies IAutoBeTestCorrectOverallApplication,
  };
}

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectOverallApplication.IProps>;
