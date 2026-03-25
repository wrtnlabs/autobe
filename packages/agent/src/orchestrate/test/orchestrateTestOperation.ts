import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestAuthorizeFunction,
  AutoBeTestGenerateFunction,
  AutoBeTestOperationFunction,
  AutoBeTestPrepareFunction,
  AutoBeTestScenario,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestOperationWrite } from "./orchestrateTestOperationWrite";
import { AutoBeTestOperationProgrammer } from "./programmers/AutoBeTestOperationProgrammer";
import { IAutoBeTestOperationProcedure } from "./structures/IAutoBeTestOperationProcedure";

export async function orchestrateTestOperation(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    scenarios: AutoBeTestScenario[];
    authorizes: AutoBeTestAuthorizeFunction[];
    prepares: AutoBeTestPrepareFunction[];
    generates: AutoBeTestGenerateFunction[];
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestOperationFunction[]> {
  const compile = async (procedure: IAutoBeTestOperationProcedure) =>
    AutoBeTestOperationProgrammer.compile({
      compiler: await ctx.compiler(),
      document: props.document,
      procedure,
      progress: props.validateProgress,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestOperationProcedure,
  ) =>
    AutoBeTestOperationProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      prepares: procedure.prepares,
      generates: procedure.generates,
      authorizes: procedure.authorizes,
      location: procedure.function.location,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestOperationProcedure[] =
    await orchestrateTestOperationWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      scenarios: props.scenarios,
      authorizes: props.authorizes,
      prepares: props.prepares,
      generates: props.generates,
      progress: props.writeProgress,
    });
  props.validateProgress.total += procedures.length;

  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: true,
    },
    procedures,
    progress: props.writeProgress,
  });
  return procedures.map((p) => p.function);
}
