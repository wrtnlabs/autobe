import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceGroupEvent,
  AutoBePrismaHistory,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformInterfaceGroupHistory } from "./histories/transformInterfaceGroupHistory";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroup<Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  props: {
    instruction: string;
  },
): Promise<AutoBeInterfaceGroupEvent> {
  const start: Date = new Date();
  const pointer: IPointer<IAutoBeInterfaceGroupApplication.IProps | null> = {
    value: null,
  };
  const prisma: AutoBePrismaHistory | null = ctx.state().prisma;
  const { metric, tokenUsage } = await ctx.conversate({
    source: SOURCE,
    controller: createController({
      model: ctx.model,
      build: (next) => {
        pointer.value = next;
      },
      prismaSchemas: new Set(
        prisma !== null
          ? prisma.result.data.files
              .map((f) => f.models)
              .flat()
              .map((m) => m.name)
          : [],
      ),
    }),
    enforceFunctionCall: true,
    ...transformInterfaceGroupHistory({
      state: ctx.state(),
      instruction: props.instruction,
    }),
  });
  if (pointer.value === null)
    throw new Error("Failed to generate endpoint groups."); // unreachable
  return {
    type: SOURCE,
    id: v7(),
    created_at: start.toISOString(),
    groups: pointer.value.groups,
    metric,
    tokenUsage,
    step: ctx.state().analyze?.step ?? 0,
  } satisfies AutoBeInterfaceGroupEvent;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IAutoBeInterfaceGroupApplication.IProps) => void;
  prismaSchemas: Set<string>;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const validate: Validator = (input) => {
    const result: IValidation<IAutoBeInterfaceGroupApplication.IProps> =
      typia.validate<IAutoBeInterfaceGroupApplication.IProps>(input);
    if (result.success === false) return result;
    const errors: IValidation.IError[] = [];
    result.data.groups.forEach((group, i) => {
      group.prismaSchemas.forEach((key, j) => {
        if (props.prismaSchemas.has(key) === false)
          errors.push({
            expected: Array.from(props.prismaSchemas)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            value: key,
            path: `groups[${i}].prismaSchemas[${j}]`,
            description: StringUtil.trim`
              The Prisma schema "${key}" does not exist in the current project.

              Make sure to provide only the valid Prisma schema names that are present in your project.

              Here is the list of available Prisma schemas in the project:

              ${Array.from(props.prismaSchemas)
                .map((s) => `- ${s}`)
                .join("\n")}
            `,
          });
      });
    });
    return errors.length === 0
      ? result
      : {
          success: false,
          data: result.data,
          errors,
        };
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
    name: SOURCE,
    application,
    execute: {
      makeGroups: (next) => {
        props.build(next);
      },
    } satisfies IAutoBeInterfaceGroupApplication,
  };
}

const collection = {
  chatgpt: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceGroupApplication, "chatgpt">({
      validate: {
        makeGroups: validate,
      },
    }),
  claude: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceGroupApplication, "claude">({
      validate: {
        makeGroups: validate,
      },
    }),
  gemini: (validate: Validator) =>
    typia.llm.application<IAutoBeInterfaceGroupApplication, "gemini">({
      validate: {
        makeGroups: validate,
      },
    }),
};

type Validator = (
  input: unknown,
) => IValidation<IAutoBeInterfaceGroupApplication.IProps>;

const SOURCE = "interfaceGroup" satisfies AutoBeEventSource;
