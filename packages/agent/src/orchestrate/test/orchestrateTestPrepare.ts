import {
  AutoBeEventSource,
  AutoBeOpenApi,
  AutoBeProgressEventBase,
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
import { orchestrateTestPrepareWrite } from "./orchestrateTestPrepareWrite";
import { AutoBeTestPrepareProgrammer } from "./programmers/AutoBeTestPrepareProgrammer";
import { IAutoBeTestPrepareCorrectOverallApplication } from "./structures/IAutoBeTestPrepareCorrectOverallApplication";
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
  });
  return procedures.map((p) => p.function);
}

function createCorrectOverallController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  procedure: IAutoBeTestPrepareProcedure;
  build: (next: IAutoBeTestPrepareCorrectOverallApplication.IProps) => void;
}): ILlmController<Model, IAutoBeTestPrepareCorrectOverallApplication> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
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
    } satisfies IAutoBeTestPrepareCorrectOverallApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestPrepareCorrectOverallApplication,
      "chatgpt"
    >({
      validate: {
        rewrite: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestPrepareCorrectOverallApplication,
      "claude"
    >({
      validate: {
        rewrite: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<
      IAutoBeTestPrepareCorrectOverallApplication,
      "gemini"
    >({
      validate: {
        rewrite: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeTestPrepareCorrectOverallApplication.IProps>;
