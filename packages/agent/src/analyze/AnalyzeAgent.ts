import { IAgenticaVendor } from "@agentica/core";
import chalk from "chalk";

import { createReviewer } from "./CreateReviewer";
import { Planner } from "./Planner";
import { Planning } from "./Planning";

export class Orchestration {
  constructor(
    private readonly vender: IAgenticaVendor,
    private readonly planner: ReturnType<typeof Planner>,
    private readonly planning: Planning,
    private readonly reviewer: typeof createReviewer,
  ) {}
  /**
   * conversate with planner agent
   *
   * @param input.query conversation from user in this time.
   * @returns
   */
  async conversate(input: { query: string }): Promise<string> {
    const response = await this.planner.conversate(input.query);
    const lastMessage = response[response.length - 1]!;

    if ("text" in lastMessage) {
      console.log(
        chalk.blackBright(
          JSON.stringify(
            Object.entries(this.planning.allFiles()).map(
              ([filename, content]) => {
                return {
                  filename,
                  content,
                  content_length: content.length,
                };
              },
            ),
            null,
            2,
          ),
        ) + "\n\n\n",
      );

      console.log(chalk.green(lastMessage.text) + "\n\n\n");
      const aborted =
        lastMessage.type === "describe" &&
        lastMessage.executes.some((el) => {
          if (
            el.protocol === "class" &&
            el.operation.function.name === "abort"
          ) {
            el.arguments;
            return true;
          }
        });

      if (aborted === true) {
        return lastMessage.text;
      }

      const currentFiles = this.planning.allFiles();
      const reviewer = this.reviewer(
        {
          api: this.vender.api,
          model: "gpt-4.1",
        },
        {
          query: input.query,
          currentFiles,
        },
      );
      const [review, ...rest] = await reviewer.conversate(lastMessage.text);
      console.log("review: ", review.type, rest.length);

      if (review) {
        if (review.type === "assistantMessage") {
          console.log(chalk.red(review.text) + "\n\n\n");
          return this.conversate({
            query: JSON.stringify({
              user_query: input.query,
              message: `THIS IS ANSWER OF REVIEW AGENT. FOLLOW THIS INSTRUCTIONS. AND DON\'T REQUEST ANYTHING.`,
              review: review.text,
            }),
          });
        }
      }
    }

    return "COMPLETE";
  }
}
