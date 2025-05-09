import { Agentica, IAgenticaVendor, MicroAgentica } from "@agentica/core";
import fs from "fs";
import path from "path";
import typia from "typia";

class Planning {
  constructor(private readonly rootFolder: string) {}

  /**
   * Generate markdown file.
   * if there is already created file, overwrite it.
   *
   * @param input.reason Describe briefly why you made this document, and if you have any plans for the next one.
   * @param input.filename filename to generate or overwrite.
   * @param input.markdown markdown file content.
   */
  async writeFile(input: {
    reason: string;
    filename: `${string}.md`;
    markdown: string;
  }): Promise<void> {
    const filename = `${this.rootFolder}/${input.filename}`;
    return fs.promises.writeFile(filename, input.markdown);
  }

  /**
   * read markdown file content.
   *
   * @param input.filename filename to read.
   */
  async readFile(input: { filename: `${string}.md` }): Promise<string> {
    const filename = `${this.rootFolder}/${input.filename}`;
    return fs.promises.readFile(filename, { encoding: "utf-8" });
  }

  /**
   * If you decide that you no longer need any reviews,
   * or if the reviewer refuses to do so, call abort.
   * This is a function to end document creation and review, and to respond to users.
   */
  abort(input: { answer: string }): "OK" {
    return "OK";
  }

  /**
   * @hidden
   */
  async allFiles(): Promise<{ path: string; content: string }[]> {
    const result: { path: string; content: string }[] = [];

    const readRecursive = async (dir: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await readRecursive(fullPath);
        } else if (entry.isFile()) {
          const content = await fs.promises.readFile(fullPath, "utf-8");
          result.push({ path: fullPath, content });
        }
      }
    };

    await readRecursive(this.rootFolder);
    return result;
  }
}

export const Planner = (vendor: IAgenticaVendor, planning: Planning) =>
  new Agentica({
    controllers: [
      {
        protocol: "class",
        application: typia.llm.application<Planning, "chatgpt">(),
        execute: planning,
        name: "Planning Functions",
      },
    ],
    model: "chatgpt",
    vendor: vendor,
    config: {
      systemPrompt: {
        common: () => {
          return [
            `You are the best planner.`,
            `Please converse with the user based on the following guidelines and example templates.`,
            `You have to make a plan for the success of the user, and it has to be written in great detail to make the business successful.`,
            `Your performance is measured by your customer's success.`,
            `You should listen to the reviewer and not make any requests to the reviewer.`,
            `<Guideline>`,
            fs.promises.readFile(path.join(__dirname, "guideline.txt")), // Guidelines
            `</Guideline>`,
            ``,
            `<Docuemtation Style>`,
            `As with example documents, it is better to divide the documents into several pieces.`,
            `If the amount user want is 30,000 characters, you'll have to write 10 tables of contents, and 3,000 characters per page.`,
            `For readability, even if the user requests it, a file should not exceed 3,000 characters.`,
            ``,
            `The first page must be the page that made up the table of contents, and you may need to modify the table of contents at the request of the reviewer.`,
            `Take advantage of the markdown link functionality OR write step by step (use overwrite function).`,
            `Take advantage of Mermaid.`,
            `For example, rather than writing a long markdown document, create a markdown document that makes up the table of contents.`,
            `And hang the link in the document in advance, and create other files that correspond to the link.`,
            `Even if it's not the first page, divide the documents if it's readable to write them separately.`,
            `Hyperlink features allow you to create more colorful documents.`,
            `Also, please put numbers in the front of the document as much as possible so that the files can be arranged well.`,
            "It is recommended to write a longer document (more than 3,000 letters).",
            "",
            "Please make the file appropriate for user's language.",
            `</Docuemtation Style>`,
            ``,
            "<Example>",
            fs.promises.readFile(path.join(__dirname, "example.txt")), // Examples,
            "</Example>",
            "",
            "If you don't have anything more to ask for, call the abort function instead of answering. Never answer the text.",
          ].join("\n");
        },
      },
    },
  });

export const createReviewer = (
  vendor: IAgenticaVendor,
  input: { query: string; currentFiles: { path: string; content: string }[] },
) => {
  return new MicroAgentica({
    model: "chatgpt",
    vendor,
    controllers: [],
    config: {
      systemPrompt: {
        common: () => {
          return [
            "You are an excellent requirements analyst & reviwer agent.",
            "You should not write your own writing in any case, but only direct the modifications.",
            "Also, reviewers are independent beings, and should never be instructed.",
            "Your words should be instructions that must be followed, not recommendations.",
            "",
            `user said, "${input.query}"`,
            "",
            "If there are any changes that need to be made, please provide detailed instructions.",
            "Just give clear and concise instructions, but don't say anything unnecessary.",
            "",
            "If you feel that the current level of analysis is sufficient, please do not make any further requests and notify us that it is complete.",
            "",
            "It is recommended to ask the planner to write a longer document (more than 3,000 letters) until it gives sufficient utility value.",
            "",
            "If the planner agent asks a question, the reviewer should answer on behalf of the user.",
            "Please do not ask any questions.",
            "Just give orders.",
            "",
            "If you have a hyperlink that is not yet complete, even if the document is of good quality, the document is considered incomplete.",
            "You should also ask for the rest of the document to be created.",
            "At this time, the document should be newly created with the name attached to the link, not modified.",
            "<CurrentFiles>",
            JSON.stringify(
              input.currentFiles.map((el) => {
                return {
                  ...el,
                  content_length: el.content,
                };
              }),
              null,
              2,
            ),
            "</CurrentFiles>",
          ].join("\n");
        },
      },
    },
  });
};

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

export const testAgent = (
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
