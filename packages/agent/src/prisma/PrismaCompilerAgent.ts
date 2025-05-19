import { MicroAgentica } from "@agentica/core";
import { MultipleSchemas, formatSchema } from "@prisma/internals";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import typia from "typia";

import { IPrismaFileInput } from "../../utils/IPrisma";
import { AutoBeContext } from "../context/AutoBeContext";
import { PrismaStructuredOutput } from "../tools/PrismaStructuredOutput";
import { PRISMA_COMPILER_PROMPT } from "./prompts/prismaCompilerPrompt";

export class PrismaCompilerAgent {
  private agent: MicroAgentica<"chatgpt">;
  private ctx: AutoBeContext<"chatgpt">;

  constructor(ctx: AutoBeContext<"chatgpt">) {
    this.ctx = ctx;

    this.agent = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      controllers: [
        {
          protocol: "class",
          name: "Prisma Structured Output Tool",
          application: typia.llm.application<
            Pick<PrismaStructuredOutput, "parseSchemaToFiles">,
            "chatgpt"
          >(),
          execute: new PrismaStructuredOutput(),
        },
      ],
      config: {
        systemPrompt: {
          common: () => {
            return PRISMA_COMPILER_PROMPT;
          },
        },
        locale: "en-US",
      },
    });
  }

  /**
   * Check the compiler Error of the Prisma Schema.
   * This method returns the Prisma Schema.
   * Input format Example is following:
   *
   * {
   *   files: {
   *     "schema.prisma": "Prisma Schema",
   *     "user.prisma": "Prisma Schema",
   *     "product.prisma": "Prisma Schema",
   *   }
   * }
   *
   * @param input.schema Prisma Schema
   * @returns Prisma Schema
   */
  async checkCompiler(input: IPrismaFileInput): Promise<IPrismaFileInput> {
    const formatted: MultipleSchemas = await formatSchema({
      schemas: Object.entries(input.files),
    });

    console.log(chalk.blueBright("PrismaCompiler - formatted"));
    console.log(chalk.blueBright(JSON.stringify(formatted, null, 2)));

    const files: Record<string, string> = {};

    formatted.forEach((schema) => {
      files[schema[0]] = schema[1];
    });

    files["schema.prisma"] = (await this.prismaInit()).files["schema.prisma"];

    const compiler = this.ctx.compiler;

    const compiled = await compiler.prisma({
      files,
    });

    for (const file of Object.keys(files)) {
      console.log(chalk.blueBright(file));
      console.log(chalk.blueBright(files[file]));
    }

    switch (compiled.type) {
      case "success": {
        console.log(chalk.blueBright("PrismaCompiler - success"));
        return { files };
      }

      case "error": {
        console.log(chalk.blueBright("PrismaCompiler - compiler error"));
        console.log(chalk.blueBright(JSON.stringify(compiled.error, null, 2)));
        throw new Error(JSON.stringify(compiled.error));
      }

      case "failure": {
        console.log(chalk.blueBright("PrismaCompiler - compiler failure"));
        console.log(chalk.blueBright(compiled.reason));

        const res = await this.agent.conversate(
          [
            `Prisma Schema: ${JSON.stringify(formatted)}`,
            `Compiler Error: ${compiled.reason}`,
            "Solve the error and return the all Prisma Schema.",
          ].join("\n"),
        );

        const answer = res.at(-1);
        console.log(chalk.blueBright("PrismaCompiler - answer"));
        console.log(chalk.blueBright(JSON.stringify(answer, null, 2)));

        for (let i = 0; i < 3; i++) {
          const structuredOutput = await this.checkCompilerStructuredOutput(
            (answer as any).text,
          );

          if (Object.keys(structuredOutput.files).length > 0) {
            return await this.checkCompiler(structuredOutput);
          }
        }
      }
      default: {
        console.log(
          chalk.redBright("PrismaCompiler - unknown compiler result"),
        );
        throw new Error("unknown compiler result");
      }
    }
  }

  async checkCompilerStructuredOutput(
    input: string,
  ): Promise<IPrismaFileInput> {
    const parsedResponse = await this.agent.conversate(
      [
        input,
        "Please Parse this schema to files.",
        'Execute the "parseSchemaToFiles" tool.',
      ].join("\n"),
    );

    const parsedAnswer = parsedResponse.at(-1);

    console.log(chalk.blueBright("PrismaCompiler - parseSchemaToFiles answer"));
    console.log(chalk.blueBright(JSON.stringify(parsedResponse, null, 2)));

    if (parsedAnswer?.type === "describe") {
      const executes = parsedAnswer.executes.at(-1);
      if (
        executes?.operation.protocol === "class" &&
        executes?.operation.function.name === "parseSchemaToFiles"
      ) {
        const value = executes.value as { files: Record<string, string> };
        console.log(
          chalk.blueBright("PrismaCompiler - parseSchemaToFiles value"),
        );
        console.log(chalk.blueBright(JSON.stringify(value, null, 2)));
        return this.checkCompiler(value);
      }
    } else {
      try {
        console.log(
          chalk.blueBright("PrismaCompiler - parseSchemaToFiles try"),
        );

        console.log(chalk.blueBright((parsedAnswer as any)?.text));

        const value = JSON.parse((parsedAnswer as any)?.text);

        const validValue = typia.assert<IPrismaFileInput>(value);

        return { files: validValue.files };
      } catch (error) {
        console.log(
          chalk.redBright("PrismaCompiler - parseSchemaToFiles error"),
        );
        console.log(chalk.redBright(error));
        return { files: {} };
      }
    }

    console.log(chalk.redBright("PrismaCompiler - error"));
    return { files: {} };
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

  // /**
  //  * Check the compiler Error of the Prisma Schema.
  //  * This method returns the Prisma Schema.
  //  * Input format Example is following:
  //  *
  //  * {
  //  *   files: {
  //  *     "schema.prisma": "Prisma Schema",
  //  *     "user.prisma": "Prisma Schema",
  //  *     "product.prisma": "Prisma Schema",
  //  *   }
  //  * }
  //  *
  //  * @param input.schema Prisma Schema
  //  * @returns Prisma Schema
  //  */
  // async checkCompiler(input: IPrismaFileInput): Promise<IPrismaFileInput> {
  //   const formatted: MultipleSchemas = await formatSchema({
  //     schemas: Object.entries(input.files),
  //   });
  //   console.log(chalk.blueBright("PrismaCompiler - formatted"));
  //   console.log(chalk.blueBright(JSON.stringify(formatted, null, 2)));

  //   const files: Record<string, string> = {};

  //   formatted.forEach((schema) => {
  //     files[schema[0]] = schema[1];
  //   });

  //   const compiler = this.ctx.compiler;

  //   const compiled = await compiler.prisma({
  //     files: files,
  //   });

  //   for (const file of Object.keys(files)) {
  //     console.log(chalk.blueBright(file));
  //     console.log(chalk.blueBright(files[file]));
  //   }

  //   switch (compiled.type) {
  //     case "success": {
  //       console.log(chalk.blueBright("PrismaCompiler - success"));
  //       return { files };
  //     }

  //     case "error": {
  //       console.log(chalk.blueBright("PrismaCompiler - compiler error"));
  //       console.log(chalk.blueBright(compiled.error));
  //       throw new Error(compiled.error as string);
  //     }
  //     case "failure": {
  //       console.log(chalk.blueBright("PrismaCompiler - compiler failure"));
  //       console.log(chalk.blueBright(compiled.reason));

  //       const res = await this.agent.conversate(
  //         [
  //           `Prisma Schema: ${JSON.stringify(formatted)}`,
  //           `Compiler Error: ${compiled.reason}`,
  //           "Solve the error and return the all Prisma Schema.",
  //         ].join("\n"),
  //       );

  //       const answer = res.at(-1);
  //       console.log(chalk.blueBright("PrismaCompiler - answer"));
  //       console.log(chalk.blueBright(JSON.stringify(answer, null, 2)));

  //       for (let i = 0; i < 3; i++) {
  //         const structuredOutput = await this.checkCompilerStructuredOutput(
  //           (answer as any).text,
  //         );

  //         if (Object.keys(structuredOutput.files).length > 0) {
  //           return await this.checkCompiler(structuredOutput);
  //         }
  //       }
  //     }
  //     default: {
  //       console.log(
  //         chalk.redBright("PrismaCompiler - unknown compiler result"),
  //       );
  //       throw new Error("unknown compiler result");
  //     }
  //   }
  // }

  // private async checkCompilerStructuredOutput(
  //   input: string,
  // ): Promise<IPrismaFileInput> {
  //   const parsedResponse = await this.agent.conversate(
  //     [input, "You must execute the parseSchemaToFiles tool."].join("\n"),
  //   );

  //   const parsedAnswer = parsedResponse.at(-1);

  //   console.log(chalk.blueBright("PrismaCompiler - parseSchemaToFiles answer"));
  //   console.log(chalk.blueBright(JSON.stringify(parsedResponse, null, 2)));

  //   if (parsedAnswer?.type === "describe") {
  //     const executes = parsedAnswer.executes.at(-1);
  //     if (
  //       executes?.operation.protocol === "class" &&
  //       executes?.operation.function.name === "parseSchemaToFiles"
  //     ) {
  //       const value = executes.value as { files: Record<string, string> };
  //       console.log(
  //         chalk.blueBright("PrismaCompiler - parseSchemaToFiles value"),
  //       );
  //       console.log(chalk.blueBright(JSON.stringify(value, null, 2)));
  //       return this.checkCompiler(value);
  //     }
  //   } else {
  //     try {
  //       console.log(
  //         chalk.blueBright("PrismaCompiler - parseSchemaToFiles try"),
  //       );
  //       const value = JSON.parse(input);
  //       return value;
  //     } catch (error) {
  //       console.log(
  //         chalk.redBright("PrismaCompiler - parseSchemaToFiles error"),
  //       );
  //       console.log(chalk.redBright(error));
  //       return { files: {} };
  //     }
  //   }

  //   return { files: {} };
  // }
}
