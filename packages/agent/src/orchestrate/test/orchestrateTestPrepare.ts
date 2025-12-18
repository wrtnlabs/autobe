import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";

export async function orchestrateTestPrepare<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestPrepareFunction[]> {
  let procedures: IAutoBeTestPrepareProcedure[] =
    await orchestrateTestPrepareWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {},
    procedures,
  });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {},
    procedures,
    instruction: props.instruction,
  });
  return procedures.map((p) => p.function);
}
