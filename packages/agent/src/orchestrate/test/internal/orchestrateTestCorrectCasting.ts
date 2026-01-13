import {
  AutoBeProgressEventBase,
  AutoBeTestCorrectEvent,
  AutoBeTestValidateEvent,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../../context/AutoBeContext";
import { executeCachedBatch } from "../../../utils/executeCachedBatch";
import { validateEmptyCode } from "../../../utils/validateEmptyCode";
import { orchestrateCommonCorrectCasting } from "../../common/orchestrateCommonCorrectCasting";
import { IAutoBeTestProcedure } from "../structures/IAutoBeTestProcedure";

interface IProgrammer<Procedure extends IAutoBeTestProcedure> {
  replaceImportStatements(procedure: Procedure): Promise<string>;
  compile(
    props: Procedure,
  ): Promise<AutoBeTestValidateEvent<Procedure["function"]>>;
  asynchronous: boolean;
}

export const orchestrateTestCorrectCasting = async <
  Procedure extends IAutoBeTestProcedure,
>(
  ctx: AutoBeContext,
  props: {
    programmer: IProgrammer<Procedure>;
    procedures: Procedure[];
    progress: AutoBeProgressEventBase;
  },
): Promise<Procedure[]> => {
  const result: Array<Procedure | null> = await executeCachedBatch(
    ctx,
    props.procedures.map((procedure) => async () => {
      try {
        const event: AutoBeTestValidateEvent<Procedure["function"]> =
          await orchestrateCommonCorrectCasting<
            AutoBeTestValidateEvent<Procedure["function"]>,
            AutoBeTestCorrectEvent
          >(
            ctx,
            {
              source: "testCorrect",
              compile: (content) =>
                props.programmer.compile({
                  ...procedure,
                  function: {
                    ...procedure.function,
                    content,
                  },
                }),
              correct: async (next) =>
                ({
                  type: "testCorrect",
                  kind: "casting",
                  id: v7(),
                  created_at: new Date().toISOString(),
                  function: {
                    ...procedure.function,
                    content: await props.programmer.replaceImportStatements({
                      ...procedure,
                      function: {
                        ...procedure.function,
                        content: next.final ?? next.draft,
                      },
                    }),
                  },
                  result: next.failure,
                  tokenUsage: next.tokenUsage,
                  metric: next.metric,
                  step: ctx.state().analyze?.step ?? 0,
                }) satisfies AutoBeTestCorrectEvent,
              script: (event) => event.function.content,
              validateEmptyCode: (next) =>
                validateEmptyCode({
                  name: procedure.function.name,
                  path: next.path,
                  asynchronous: props.programmer.asynchronous,
                  draft: next.draft,
                  revise: next.revise,
                }),
              location: procedure.function.location,
            },
            procedure.function.content,
          );
        return {
          ...procedure,
          function: event.function,
        };
      } catch {
        return procedure;
      }
    }),
  );
  return result.filter((r) => r !== null);
};
