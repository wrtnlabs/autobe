import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceOperationReviewEvent,
  AutoBeOpenApi,
  AutoBePrisma,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceOperationReviewHistory } from "./histories/transformInterfaceOperationReviewHistory";
import { IAutoBeInterfaceOperationReviewApplication } from "./structures/IAutoBeInterfaceOperationReviewApplication";
import { OperationValidator } from "./utils/OperationValidator";

export async function orchestrateInterfaceOperationReview<
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IOperation[]> {
  try {
    return await process(ctx, operations, progress);
  } catch {
    ++progress.completed;
    return [];
  }
}

async function process<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operations: AutoBeOpenApi.IOperation[],
  progress: AutoBeProgressEventBase,
): Promise<AutoBeOpenApi.IOperation[]> {
  const files: AutoBePrisma.IFile[] = ctx.state().prisma?.result.data.files!;
  const preliminary: AutoBePreliminaryController<
    "analyzeFiles" | "prismaSchemas"
  > = new AutoBePreliminaryController({
    functions: typia.json
      .application<IAutoBeInterfaceOperationReviewApplication>()
      .functions.map((f) => f.name),
    source: "interfaceOperationReview",
    kinds: ["analyzeFiles", "prismaSchemas"],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceOperationReviewApplication.IProps | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult<Model> = await ctx.conversate({
      source: "interfaceOperationReview",
      controller: createReviewController({
        preliminary,
        model: ctx.model,
        prismaSchemas: files,
        build: (next: IAutoBeInterfaceOperationReviewApplication.IProps) => {
          pointer.value = next;
        },
      }),
      enforceFunctionCall: false,
      ...transformInterfaceOperationReviewHistory({
        preliminary,
        operations,
      }),
    });
    if (pointer.value !== null) {
      const content: AutoBeOpenApi.IOperation[] = pointer.value.content.map(
        (op) => ({
          ...op,
          authorizationType: null,
        }),
      );
      ctx.dispatch({
        type: "interfaceOperationReview",
        id: v7(),
        operations: content,
        review: pointer.value.think.review,
        plan: pointer.value.think.plan,
        content,
        metric: result.metric,
        tokenUsage: result.tokenUsage,
        created_at: new Date().toISOString(),
        step: ctx.state().analyze?.step ?? 0,
        total: progress.total,
        completed: ++progress.completed,
      } satisfies AutoBeInterfaceOperationReviewEvent);
      return out(result)(content);
    }
    return out(result)(null);
  });
}

function createReviewController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">;
  prismaSchemas: AutoBePrisma.IFile[];
  build: (reviews: IAutoBeInterfaceOperationReviewApplication.IProps) => void;
}): IAgenticaController.IClass<Model> {
  const validate = (
    next: unknown,
  ): IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceOperationReviewApplication.IProps> =
      typia.validate<IAutoBeInterfaceOperationReviewApplication.IProps>(next);
    if (result.success === false) return result;

    const errors: IValidation.IError[] = [];
    OperationValidator.validate({
      path: "$input.content",
      operations: result.data.content,
      errors,
    });
    if (errors.length !== 0)
      return {
        success: false,
        errors,
        data: next,
      };
    return result;
  };
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ]({
    preliminary: props.preliminary,
    validate,
  }) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;

  return {
    protocol: "class",
    name: "interfaceOperationReview" satisfies AutoBeEventSource,
    application,
    execute: {
      reviewOperations: (next) => {
        props.build(next);
      },
      analyzeFiles: () => {},
      prismaSchemas: () => {},
    } satisfies IAutoBeInterfaceOperationReviewApplication,
  };
}

const collection = {
  chatgpt: (props: CustomValidateProps) =>
    typia.llm.application<
      IAutoBeInterfaceOperationReviewApplication,
      "chatgpt"
    >({
      validate: {
        reviewOperations: props.validate,
        ...props.preliminary.createValidate(),
      },
    }),
  claude: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfaceOperationReviewApplication, "claude">(
      {
        validate: {
          reviewOperations: props.validate,
          ...props.preliminary.createValidate(),
        },
      },
    ),
  gemini: (props: CustomValidateProps) =>
    typia.llm.application<IAutoBeInterfaceOperationReviewApplication, "gemini">(
      {
        validate: {
          reviewOperations: props.validate,
          ...props.preliminary.createValidate(),
        },
      },
    ),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceOperationReviewApplication.IProps>;

interface CustomValidateProps {
  validate: Validator;
  preliminary: AutoBePreliminaryController<"analyzeFiles" | "prismaSchemas">;
}
