import {
  AgenticaAssistantMessageHistory,
  IAgenticaController,
  MicroAgentica,
  MicroAgenticaHistory,
} from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaHistory,
  IAutoBePrismaCompilerResult,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer, Singleton } from "tstl";
import typia from "typia";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../../context/IAutoBeApplicationProps";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { transformPrismaHistories } from "./transformPrismaHistories";

export const orchestratePrisma =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    { reason }: IAutoBeApplicationProps,
    retry: number = 3,
  ): Promise<AutoBePrismaHistory | AutoBeAssistantMessageHistory> => {
    // TRY FUNCTION CALLING
    const start: Date = new Date();
    const pointer: IPointer<IMakePrismaSchemaFileProps | null> = {
      value: null,
    };
    const agent: MicroAgentica<Model> = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      config: {
        ...(ctx.config ?? {}),
        executor: {
          describe: null,
        },
        systemPrompt: {
          common: () => AutoBeSystemPromptConstant.PRISMA,
        },
      },
      histories: transformPrismaHistories(ctx.state()),
      tokenUsage: ctx.usage(),
      controllers: [
        createApplication({
          model: ctx.model,
          build: (next) => {
            pointer.value = next;
          },
        }),
      ],
    });
    const histories: MicroAgenticaHistory<Model>[] = await agent.conversate(
      "Please make Prisma schema files referencing the previous requirement analysis report.",
    );

    if (pointer.value !== null) {
      // PRISMA SCHEMA FILES ARE GENERATED
      let result: IAutoBePrismaCompilerResult | null = null;
      const essential = new Singleton(() => {
        agent.on("request", (event) => {
          event.body.tool_choice = "required";
        });
      });
      for (let i: number = 0; i < retry; ++i) {
        // COMPILATION
        result = await ctx.compiler.prisma({
          files: pointer.value.files,
        });
        if (result.type !== "failure") break;
        ctx.dispatch({
          type: "prismaValidate",
          schemas: pointer.value.files,
          result,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        });

        // RETRY WITH COMPILER FEEDBACK
        essential.get();
        await agent.conversate(
          [
            "Previous generated prisma schema files are invalid.",
            "",
            "Please re-generate the prisma schema files, referencing the below compilation error message.",
            "",
            "--------------------------------------------",
            "",
            result.reason,
          ].join("\n"),
        );
      }
      if (result === null) throw new Error("Unreachable code: not generated");

      const history: AutoBePrismaHistory = {
        id: v4(),
        type: "prisma",
        reason,
        result,
        description: pointer.value.description,
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
        step: ctx.state().analyze?.step ?? 0,
      };
      ctx.histories().push(history);
      ctx.state().prisma = history;
      if (result.type === "success")
        ctx.dispatch({
          type: "prismaComplete",
          document: result.document,
          schemas: result.schemas,
          diagrams: result.diagrams,
          step: ctx.state().analyze?.step ?? 0,
          created_at: new Date().toISOString(),
        });
      return history;
    } else if (histories.at(-1)?.type === "assistantMessage") {
      // ONLY ASSISTANT MESSAGE
      const message: AutoBeAssistantMessageHistory = {
        ...(histories.at(-1) as AgenticaAssistantMessageHistory),
        id: v4(),
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
      };
      ctx.histories().push(message);
      return message;
    }
    throw new Error("Unreachable code: no function call, no assistant message");
  };

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IMakePrismaSchemaFileProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Prisma Generator",
    application,
    execute: {
      makePrismaSchemaFiles: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  /**
   * Generates comprehensive Prisma schema files based on detailed requirements
   * analysis.
   *
   * Creates multiple organized schema files following enterprise patterns
   * including proper domain separation, relationship modeling, snapshot
   * patterns, inheritance, materialized views, and comprehensive documentation.
   * The generated schemas implement best practices for scalability,
   * maintainability, and data integrity.
   *
   * @param props Properties containing the complete set of Prisma schema files
   */
  makePrismaSchemaFiles(props: IMakePrismaSchemaFileProps): void;
}

interface IMakePrismaSchemaFileProps {
  /**
   * Collection of Prisma schema files organized by domain/functionality.
   *
   * Key represents the filename (e.g., "main.prisma", "schema-01-core.prisma",
   * "schema-02-users.prisma") and value contains the complete schema content
   * including models, relationships, indexes, and comprehensive documentation.
   *
   * Files should be organized following enterprise patterns:
   *
   * - Main.prisma: Configuration, datasource, and generators
   * - Schema-XX-domain.prisma: Domain-specific entity definitions
   * - Proper cross-file relationships and dependencies
   */
  files: Record<string, string>;

  description: string;
}
