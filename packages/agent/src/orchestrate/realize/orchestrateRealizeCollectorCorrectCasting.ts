import {
  AutoBeProgressEventBase,
  AutoBeRealizeCollectorFunction,
} from "@autobe/interface";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateRealizeCorrectCasting } from "./internal/orchestrateRealizeCorrectCasting";
import { AutoBeRealizeCollectorProgrammer } from "./programmers/AutoBeRealizeCollectorProgrammer";

export const orchestrateRealizeCollectorCorrectCasting = (
  ctx: AutoBeContext,
  props: {
    functions: AutoBeRealizeCollectorFunction[];
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeRealizeCollectorFunction[]> =>
  orchestrateRealizeCorrectCasting(ctx, {
    programmer: {
      template: (func) =>
        AutoBeRealizeCollectorProgrammer.writeTemplate({
          plan: func.plan,
          body: ctx.state().interface!.document.components.schemas[
            func.plan.dtoTypeName
          ],
          model: ctx
            .state()
            .database!.result.data.files.map((f) => f.models)
            .flat()
            .find((m) => m.name === func.plan.databaseSchemaName)!,
          application: ctx.state().database!.result.data,
        }),
      replaceImportStatements: (next) =>
        AutoBeRealizeCollectorProgrammer.replaceImportStatements(ctx, {
          dtoTypeName: next.function.plan.dtoTypeName,
          schemas: ctx.state().interface!.document.components.schemas,
          code: next.code,
        }),
      additional: () => ({}),
      location: "src/collectors",
    },
    functions: props.functions,
    progress: props.progress,
  });
