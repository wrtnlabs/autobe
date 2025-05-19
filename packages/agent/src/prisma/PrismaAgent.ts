import { Agentica, AgenticaHistory } from "@agentica/core";
import chalk from "chalk";
import typia from "typia";

import { IPrismaFileInput } from "../../utils/IPrisma";
import { AutoBeContext } from "../context/AutoBeContext";
import { PrismaStructuredOutput } from "../tools/PrismaStructuredOutput";
import { PrismaGeneratorAgent } from "./PrismaGenerator";
import { PRISMA_PROMPT } from "./prompts/prismaPrompt";

export class PrismaAgent {
  private readonly agent: Agentica<"chatgpt">;

  constructor(ctx: AutoBeContext<"chatgpt">) {
    this.agent = new Agentica({
      model: ctx.model,
      vendor: ctx.vendor,
      controllers: [
        {
          protocol: "class",
          name: "Prisma Generator",
          application: typia.llm.application<PrismaGeneratorAgent, "chatgpt">(),
          execute: new PrismaGeneratorAgent(ctx),
        },
        {
          protocol: "class",
          name: "Prisma Structured Output Tool",
          application: typia.llm.application<
            Pick<PrismaStructuredOutput, "parseSchemaToObject">,
            "chatgpt"
          >(),
          execute: new PrismaStructuredOutput(),
        },
      ],

      config: {
        systemPrompt: {
          common: () => {
            return PRISMA_PROMPT;
          },
        },
        locale: "en-US",
      },
    });
  }

  async conversate(
    input: string,
  ): Promise<IPrismaFileInput | AgenticaHistory<"chatgpt">> {
    const response = await this.agent.conversate(input);

    const answer = response.at(-1);

    console.log(chalk.yellow(JSON.stringify(response, null, 2)));

    if (answer?.type === "describe") {
      const executes = answer.executes.at(-1);
      if (
        executes?.operation.protocol === "class" &&
        executes?.operation.function.name === "parseSchemaToObject"
      ) {
        console.log(chalk.green("parseSchemaToObject answer"));
        return executes.value as IPrismaFileInput;
      } else if (
        executes?.operation.protocol === "class" &&
        executes?.operation.function.name === "generatePrismaSchema"
      ) {
        console.log(chalk.green("generatePrismaSchema answer"));
        console.log(chalk.green(JSON.stringify(executes.value, null, 2)));

        return executes.value as IPrismaFileInput;
      }
    }

    return response.at(-1)!;
  }
}
