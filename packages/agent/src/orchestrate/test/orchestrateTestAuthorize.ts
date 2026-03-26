import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestAuthorizeWrite } from "./orchestrateTestAuthorizeWrite";
import { AutoBeTestAuthorizeProgrammer } from "./programmers/AutoBeTestAuthorizeProgrammer";
import { IAutoBeTestAuthorizeProcedure } from "./structures/IAutoBeTestAuthorizeWriteResult";

export async function orchestrateTestAuthorize(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestAuthorizeFunction[]> {
  const compile = async (procedure: IAutoBeTestAuthorizeProcedure) =>
    AutoBeTestAuthorizeProgrammer.compile({
      compiler: await ctx.compiler(),
      procedure,
      progress: props.validateProgress,
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
      asynchronous: true,
    },
    procedures,
    progress: props.validateProgress,
  });
  return procedures.map((p) => p.function);
}
