import {
  AutoBeAssistantMessageHistory,
  AutoBePrismaHistory,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { v4 } from "uuid";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";
import { PrismaAgent } from "../prisma/PrismaAgent";

/** @todo Michael */
export const orchestratePrisma =
  <Model extends ILlmSchema.Model>(ctx: AutoBeContext<Model>) =>
  async (
    props: IAutoBeApplicationProps,
  ): Promise<AutoBeAssistantMessageHistory | AutoBePrismaHistory> => {
    ctx;
    props;

    const prismaAgent = new PrismaAgent(ctx as any);

    const specification = Object.values(ctx.state().analyze?.files ?? {}).join(
      "\n",
    );

    const startedAt = new Date().toISOString();

    const response = await prismaAgent.conversate(specification);

    console.log(chalk.white(JSON.stringify(response, null, 2)));

    if ("files" in response) {
      console.log("Generated Prisma Schema Files");

      const files: Record<string, string> = response.files;
      for (const file of Object.keys(files)) {
        console.log(chalk.cyanBright(file));
        console.log(chalk.cyanBright(JSON.stringify(files[file], null, 2)));

        await fs.promises.writeFile(
          path.join(`${__dirname}/../../../../examples/prisma/test/${file}`),
          files[file],
        );
      }
    }

    const completedAt = new Date().toISOString();

    const answer: AutoBeAssistantMessageHistory = {
      id: v4(),
      type: "assistantMessage",
      started_at: startedAt,
      completed_at: completedAt,
      text: (response as any).text ?? "",
    };

    // const answer2: AutoBePrismaHistory = {
    //   id: v4(),
    //   completed_at: completedAt,
    //   started_at: startedAt,
    //   type: "prisma",
    //   result: {
    //     type: "",
    //   },
    //   reason: "",
    //   description: "",
    //   step: 0,
    // };

    return answer;
  };
