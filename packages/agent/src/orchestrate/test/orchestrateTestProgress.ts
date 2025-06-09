import { MicroAgentica } from "@agentica/core";
import { AutoBeTestProgressEvent } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";

import { AutoBeContext } from "../../context/AutoBeContext";

export async function orchestrateTestProgress<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
): Promise<AutoBeTestProgressEvent> {
  const pointer: IPointer<> = {
    value: null
  }

  const agentica: MicroAgentica = new Micro
}
