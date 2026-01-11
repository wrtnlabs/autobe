import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import { ILlmApplication, ILlmController, IValidation } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareCorrectOverallApplication } from "./structures/IAutoBeTestPrepareCorrectOverallApplication";
import { IAutoBeTestPrepareProcedure } from "./structures/IAutoBeTestPrepareProcedure";

export async function orchestrateTestPrepare(
  ctx: AutoBeContext,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestPrepareFunction[]> {
  const compile = async (procedure: IAutoBeTestPrepareProcedure) =>
    AutoBeTestPrepareProgrammer.compile({
      compiler: await ctx.compiler(),
      document: props.document,
      procedure,
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
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      asynchronous: false,
    },
    procedures,
    progress: props.correctProgress,
  });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      controller: (next) => createCorrectOverallController(next),
    },
    procedures,
    instruction: props.instruction,
    progress: props.correctProgress,
    discard: false,
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController(props: {
  procedure: IAutoBeTestPrepareProcedure;
  build: (next: IAutoBeTestPrepareCorrectOverallApplication.IProps) => void;
}): ILlmController<IAutoBeTestPrepareCorrectOverallApplication> {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeTestPrepareCorrectOverallApplication.IProps> => {
    const result: IValidation<IAutoBeTestPrepareCorrectOverallApplication.IProps> =
      typia.validate<IAutoBeTestPrepareCorrectOverallApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = AutoBeTestPrepareProgrammer.validate({
      typeName: props.procedure.typeName,
      schema: props.procedure.schema,
      mappings: result.data.mappings,
      draft: result.data.draft,
      revise: result.data.revise,
    });
    return errors.length
      ? {
          success: false,
          errors,
          data: result.data,
        }
      : result;
  };

  const application: ILlmApplication =
    typia.llm.application<IAutoBeTestPrepareCorrectOverallApplication>({
      validate: {
        rewrite: validate,
      },
    });
  return {
    protocol: "class",
    name: "testCorrect" satisfies AutoBeEventSource,
    application,
    execute: {
      rewrite: (v) => {
        props.build(v);
      },
    } satisfies IAutoBeTestPrepareCorrectOverallApplication,
  };
}
