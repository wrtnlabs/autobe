import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestAuthorizeWrite } from "./orchestrateTestAuthorizeWrite";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";

export async function orchestrateTestAuthorize<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
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
    },
    instruction: props.instruction,
    procedures,
    progress: props.correctProgress,
  });
  return procedures.map((p) => p.function);
}
