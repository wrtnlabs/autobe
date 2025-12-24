import { IAgenticaController } from "@agentica/core";
import {
  AutoBeEventSource,
  AutoBeInterfaceGroupEvent,
  AutoBePrismaHistory,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, IValidation } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryController } from "../common/AutoBePreliminaryController";
import { transformInterfaceGroupHistory } from "./histories/transformInterfaceGroupHistory";
import { IAutoBeInterfaceGroupApplication } from "./structures/IAutoBeInterfaceGroupApplication";

export async function orchestrateInterfaceGroup(
  ctx: AutoBeContext,
  props: {
    instruction: string;
  },
): Promise<AutoBeInterfaceGroupEvent> {
  const start: Date = new Date();
  const prisma: AutoBePrismaHistory | null = ctx.state().prisma;
  const preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  > = new AutoBePreliminaryController({
    application: typia.json.application<IAutoBeInterfaceGroupApplication>(),
    source: SOURCE,
    kinds: [
      "analysisFiles",
      "prismaSchemas",
      "previousAnalysisFiles",
      "previousPrismaSchemas",
      "previousInterfaceOperations",
    ],
    state: ctx.state(),
  });
  return await preliminary.orchestrate(ctx, async (out) => {
    const pointer: IPointer<IAutoBeInterfaceGroupApplication.IComplete | null> =
      {
        value: null,
      };
    const result: AutoBeContext.IResult = await ctx.conversate({
      source: SOURCE,
      controller: createController({
        pointer,
        preliminary,
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
        preliminary,
      }),
    });
    if (pointer.value === null) return out(result)(null);

    const event: AutoBeInterfaceGroupEvent = {
      type: SOURCE,
      id: v7(),
      created_at: start.toISOString(),
      groups: pointer.value.groups,
      metric: result.metric,
      tokenUsage: result.tokenUsage,
      step: ctx.state().analyze?.step ?? 0,
    };
    return out(result)(event);
  });
}

function createController(props: {
  pointer: IPointer<IAutoBeInterfaceGroupApplication.IComplete | null>;
  preliminary: AutoBePreliminaryController<
    | "analysisFiles"
    | "prismaSchemas"
    | "previousAnalysisFiles"
    | "previousPrismaSchemas"
    | "previousInterfaceOperations"
  >;
  prismaSchemas: Set<string>;
}): IAgenticaController.IClass {
  const validate = (
    input: unknown,
  ): IValidation<IAutoBeInterfaceGroupApplication.IProps> => {
    const result: IValidation<IAutoBeInterfaceGroupApplication.IProps> =
      typia.validate<IAutoBeInterfaceGroupApplication.IProps>(input);
    if (result.success === false) return result;

    // Preliminary request validation
    if (result.data.request.type !== "complete")
      return props.preliminary.validate({
        thinking: result.data.thinking,
        request: result.data.request,
      });

    // Complete request validation - check prismaSchemas
    const errors: IValidation.IError[] = [];
    result.data.request.groups.forEach((group, i) => {
      group.prismaSchemas.forEach((key, j) => {
        if (props.prismaSchemas.has(key) === false)
          errors.push({
            expected: Array.from(props.prismaSchemas)
              .map((s) => JSON.stringify(s))
              .join(" | "),
            value: key,
            path: `request.groups[${i}].prismaSchemas[${j}]`,
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

  const application: ILlmApplication = props.preliminary.fixApplication(
    typia.llm.application<IAutoBeInterfaceGroupApplication>({
      validate: {
        process: validate,
      },
    }),
  );
  return {
    protocol: "class",
    name: SOURCE,
    application,
    execute: {
      process: (input) => {
        if (input.request.type === "complete")
          props.pointer.value = input.request;
      },
    } satisfies IAutoBeInterfaceGroupApplication,
  };
}

const SOURCE = "interfaceGroup" satisfies AutoBeEventSource;
