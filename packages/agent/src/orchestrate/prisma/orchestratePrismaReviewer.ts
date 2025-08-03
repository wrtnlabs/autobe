import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBePrisma } from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { enforceToolCall } from "../../utils/enforceToolCall";
import { transformPrismaReviewerHistories } from "./transformPrismaReviewerHistories";

export type IPrismaReviewerResult =
  | {
      type: "reject";
      value: string;
    }
  | {
      type: "accept";
    };

export const orchestratePrismaReviewer = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  input: {
    /** The Prisma application structure being reviewed */
    application: AutoBePrisma.IApplication;
  },
): Promise<IPrismaReviewerResult> => {
  const fnCalled: IPointer<IPrismaReviewerResult> = {
    value: {
      type: "reject",
      value: "reviewer is not working because of unknown reason.",
    },
  };

  const controller = createController({
    model: ctx.model,
    setResult: (result: IPrismaReviewerResult) => {
      fnCalled.value = result;
    },
  });
  const agent = new MicroAgentica({
    model: ctx.model,
    vendor: ctx.vendor,
    controllers: [controller],
    config: {
      ...ctx.config,
      executor: {
        describe: null,
      },
    },
    histories: [...transformPrismaReviewerHistories(input)],
  });
  enforceToolCall(agent);

  const command = `proceed with the review of this database schema design.` as const;
  await agent.conversate(command).finally(() => {
    const tokenUsage = agent.getTokenUsage();
    ctx.usage().record(tokenUsage, ["prisma"]);
  });

  return fnCalled.value;
};

interface IAutoBePrismaReviewerSystem {
  /**
   * If there are any issues with the database design that need to be addressed,
   * you can call this function. This function is to reject the database schema
   * for revision with your detailed feedback and suggestions for improvement.
   */
  reject(input: {
    /**
     * The reason why you reject the database design and the detailed suggestions
     * for improvement. You can provide comprehensive feedback about schema design,
     * relationships, constraints, performance considerations, and business alignment.
     */
    reason: string;
  }): "OK" | Promise<"OK">;

  /**
   * If you determine that the database design meets all quality standards and
   * requirements, call accept. This function finalizes the database schema
   * review and allows the system to proceed to the next development phase.
   */
  accept(): "OK" | Promise<"OK">;
}

function createController<Model extends ILlmSchema.Model>(props: {
  model: Model;
  setResult: (result: IPrismaReviewerResult) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Reviewer",
    application,
    execute: {
      accept: async () => {
        props.setResult({
          type: "accept",
        });
        return "OK" as const;
      },
      reject: async (input) => {
        props.setResult({
          type: "reject",
          value: input.reason,
        });
        return "OK" as const;
      },
    } satisfies IAutoBePrismaReviewerSystem,
  };
}

const claude = typia.llm.application<
  IAutoBePrismaReviewerSystem,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBePrismaReviewerSystem,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
};
