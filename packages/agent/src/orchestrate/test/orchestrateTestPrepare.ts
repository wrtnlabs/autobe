import {
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestCorrectInvalidRequest } from "./orchestrateTestCorrectInvalidRequest";
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
): Promise<AutoBeTestValidateEvent<AutoBeTestPrepareFunction>[]> {
  const procedures: IAutoBeTestPrepareProcedure[] =
    await orchestrateTestPrepareWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
    });
  await orchestrateTestCorrectCasting(ctx, {
    programmer: {},
    procedures,
  });
  return await orchestrateTestCorrectOverall(ctx, {
    programmer: {},
    procedures,
    instruction: props.instruction,
  });
}
