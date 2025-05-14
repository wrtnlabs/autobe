import { IAgenticaVendor, MicroAgentica } from "@agentica/core";
import typia from "typia";

import { createReviewer } from "./CreateReviewer";
import { Planner } from "./Planner";
import { Planning } from "./Planning";

class Orchestration {
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
      console.log("request review\n\n\n", lastMessage.text, "\n\n\n");
      const aborted =
        lastMessage.type === "describe" &&
        lastMessage.executes.some((el) => {
          if (
            el.protocol === "class" &&
            el.operation.function.name === "abort"
          ) {
            return true;
          }
        });

      if (aborted === true) {
        return lastMessage.text;
      }

      const currentFiles = await this.planning.allFiles();
      const reviewer = this.reviewer(this.vender, {
        query: input.query,
        currentFiles,
      });
      const reviewed = await reviewer.conversate(lastMessage.text);

      if (reviewed[0]?.type === "text") {
        const review = reviewed[0].text;
        console.log("review completed\n\n\n", review, "\n\n\n");
        return this.conversate({
          query: JSON.stringify({
            user_query: input.query,
            message: `THIS IS ANSWER OF REVIEW AGENT. FOLLOW THIS INSTRUCTIONS. AND DON\'T REQUEST ANYTHING.`,
            review,
          }),
        });
      }
    }

    return "COMPLETE";
  }
}

export const AnalyzeAgent = (
  vendor: IAgenticaVendor,
  store: {
    folder: string;
  },
) => {
  const planning = new Planning(store.folder);
  const analyzeAgent = Planner(vendor, planning);
  const innerAgent = new Orchestration(
    vendor,
    analyzeAgent,
    planning,
    createReviewer,
  );

  return new MicroAgentica({
    controllers: [
      {
        name: "Analyze Agent For Planning",
        protocol: "class",
        application: typia.llm.application<Orchestration, "chatgpt">(),
        execute: innerAgent,
      },
    ],
    model: "chatgpt",
    vendor: vendor,
  });
};
