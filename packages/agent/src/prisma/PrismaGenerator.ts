import { MicroAgentica } from "@agentica/core";
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { IPrismaFileInput } from "../../utils/IPrisma";
import { AutoBeContext } from "../context/AutoBeContext";
import { PrismaCompilerAgent } from "./PrismaCompilerAgent";
import { PRISMA_GENERATOR_PROMPT } from "./prompts/prismaGeneratorPrompt";

export class PrismaGeneratorAgent {
  private agent: MicroAgentica<"chatgpt">;
  private compilerAgent: PrismaCompilerAgent;
  private ctx: AutoBeContext<"chatgpt">;

  constructor(ctx: AutoBeContext<"chatgpt">) {
    this.ctx = ctx;
    this.compilerAgent = new PrismaCompilerAgent(ctx);
    this.agent = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      controllers: [],
      config: {
        systemPrompt: {
          common: () => {
            return PRISMA_GENERATOR_PROMPT;
          },
        },
        locale: "en-US",
      },
    });
  }

  /**
   * Generate a Prisma schema from the given specification.
   *
   * @param input - The specification to generate the Prisma schema from.
   * @returns The generated Prisma schema.
   */
  async generatePrismaSchema(input: {
    specification: string;
  }): Promise<IPrismaFileInput> {
    const response = await this.agent.conversate(
      [
        `## Specification
        ${input.specification}`,
        "",
        "Above is the specification to generate Prisma Schema",
        "Please generate the Prisma Schema",
      ].join("\n"),
    );

    const answer = response.at(-1);

    console.log(chalk.green("PrismaGenerator - answer"));
    console.log(chalk.green(JSON.stringify(response, null, 2)));

    for (let i = 0; i < 3; i++) {
      const structuredOutput =
        await this.compilerAgent.checkCompilerStructuredOutput(
          (answer as any).text,
        );

      if (Object.keys(structuredOutput.files).length > 0) {
        const files = await this.compilerAgent.checkCompiler(structuredOutput);

        const schemaPrisma = await this.prismaInit();

        files.files["schema.prisma"] = schemaPrisma.files["schema.prisma"];

        return files;
      }
    }
    console.log(chalk.redBright("PrismaGenerator - error"));
    throw new Error(JSON.stringify(answer));
  }

  private async prismaInit(): Promise<IPrismaFileInput> {
    const prismaFile = await fs.promises.readFile(
      path.join(__dirname, "examples", "schema.prisma"),
      "utf-8",
    );

    return {
      files: {
        "schema.prisma": prismaFile,
      },
    };
  }
}
