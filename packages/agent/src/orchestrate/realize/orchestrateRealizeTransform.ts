import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeRealizeWriteEvent,
} from "@autobe/interface";
import { AutoBeRealizeTransformEvent } from "@autobe/interface/src/events/AutoBeRealizeTransformEvent";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";

export const orchestrateRealizeTransform = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: {
    document: AutoBeOpenApi.IDocument;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeRealizeTransformEvent> => {
  const preliminary: AutoBePreliminaryController<"prismaSchemas"> =
    new AutoBePreliminaryController({
      source: SOURCE,
      application: typia.json.application<AutoBeRealizeTransformEvent>(),
      kinds: ["prismaSchemas"],
      state: ctx.state(),
    });
  return await preliminary.orchestrate(ctx, async (out) => {
    const result: AutoBeContext.IResult<Model> = ctx.conversate({
      source: SOURCE,
    });
    return out(result)(null);
  });
};

const SOURCE = "realizeTransform" satisfies AutoBeEventSource;
