import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
  AutoBeTestGenerateFunction,
  AutoBeTestPrepareFunction,
} from "@autobe/interface";
import {
  ILlmApplication,
  ILlmController,
  ILlmSchema,
  IValidation,
} from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { orchestrateTestCorrectCasting } from "./internal/orchestrateTestCorrectCasting";
import { orchestrateTestCorrectOverall } from "./internal/orchestrateTestCorrectOverall";
// import { orchestrateTestCorrectRequest } from "./internal/orchestrateTestCorrectRequest";
import { orchestrateTestGenerateWrite } from "./orchestrateTestGenerateWrite";
import { AutoBeTestGenerateProgrammer } from "./programmers/AutoBeTestGenerateProgrammer";
import { IAutoBeTestCorrectOverallApplication } from "./structures/IAutoBeTestCorrectOverallApplication";
import { IAutoBeTestGenerateProcedure } from "./structures/IAutoBeTestGenerateProcedure";

export async function orchestrateTestGenerate<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
    document: AutoBeOpenApi.IDocument;
    prepares: AutoBeTestPrepareFunction[];
    writeProgress: AutoBeProgressEventBase;
    correctProgress: AutoBeProgressEventBase;
  },
): Promise<AutoBeTestGenerateFunction[]> {
  const compile = async (procedure: IAutoBeTestGenerateProcedure) =>
    AutoBeTestGenerateProgrammer.compile({
      compiler: await ctx.compiler(),
      step: ctx.state().analyze?.step ?? 0,
      procedure,
    });
  const replaceImportStatements = async (
    procedure: IAutoBeTestGenerateProcedure,
  ) =>
    AutoBeTestGenerateProgrammer.replaceImportStatements({
      compiler: await ctx.compiler(),
      artifacts: procedure.artifacts,
      prepare: procedure.prepare,
      location: procedure.function.location,
      content: procedure.function.content,
    });

  let procedures: IAutoBeTestGenerateProcedure[] =
    await orchestrateTestGenerateWrite(ctx, {
      instruction: props.instruction,
      document: props.document,
      prepares: props.prepares,
      progress: props.writeProgress,
    });
  procedures = await orchestrateTestCorrectCasting(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
    },
    procedures,
    progress: props.correctProgress,
  });
  // procedures = await orchestrateTestCorrectRequest(ctx, {
  //   programmer: {
  //     compile,
  //     replaceImportStatements,
  //   },
  //   instruction: props.instruction,
  //   progress: props.correctProgress,
  //   procedures,
  // });
  procedures = await orchestrateTestCorrectOverall(ctx, {
    programmer: {
      compile,
      replaceImportStatements,
      controller: (next) => createCorrectOverallController(next),
    },
    instruction: props.instruction,
    progress: props.correctProgress,
    procedures,
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  procedure: IAutoBeTestGenerateProcedure;
  build: (next: IAutoBeTestCorrectOverallApplication.IProps) => void;
}): ILlmController<Model, IAutoBeTestCorrectOverallApplication> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeTestCorrectOverallApplication.IProps> =
      typia.validate<IAutoBeTestCorrectOverallApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = AutoBeTestGenerateProgrammer.validate({
      procedure: props.procedure,
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

  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ](
    validate,
  ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "testCorrect" satisfies AutoBeEventSource,
    application,
    execute: {
      rewrite: (v) => {
        props.build(v);
      },
    } satisfies IAutoBeTestCorrectOverallApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectOverallApplication, "chatgpt">({
      validate: {
        rewrite: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectOverallApplication, "claude">({
      validate: {
        rewrite: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeTestCorrectOverallApplication, "gemini">({
      validate: {
        rewrite: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestCorrectOverallApplication.IProps>;
