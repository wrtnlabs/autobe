import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";

export async function orchestrateTestPrepare(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    validateProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestPrepareFunction[]> {
  const compile = async (procedure: IAutoBeTestPrepareProcedure) =>
    AutoBeTestPrepareProgrammer.compile({
      compiler: await ctx.compiler(),
      document: props.document,
      procedure,
      progress: props.validateProgress,
      step: ctx.state().analyze?.step ?? 0,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestPrepareProcedure,
  ) =>
    AutoBeTestPrepareProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      typeName: procedure.typeName,
      schemas: props.document.components.schemas,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestPrepareProcedure[] =
    await orchestrateTestPrepareWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      progress: props.writeProgress,
    });
  props.validateProgress.total += procedures.length;

  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: false,
    },
    procedures,
    progress: props.validateProgress,
  });
  return procedures.map((p) => p.function);
}
