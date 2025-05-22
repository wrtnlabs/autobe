import { IAgenticaVendor, MicroAgentica } from "@agentica/core";
import fs from "fs";
import path from "path";
import typia from "typia";

import { Planning } from "./Planning";

export const Planner = (vendor: IAgenticaVendor, planning: Planning) => {
  const files = planning.allFiles();

  // All links specified in the markdown are drawn in advance and provided to LLM.
  const markdownFiles = Array.from(
    new Set(
      Object.values(files).flatMap((content) => {
        const fileExtensions = ["md"];

        const regex = /\[[^\]]*\]\(([^)]+)\)/g;

        const fileLinks = [...content.matchAll(regex)]
          .map((match) => match[1])
          .filter((link) => {
            const ext = link.split(".").pop()?.toLowerCase();
            return ext && fileExtensions.includes(ext);
          });

        return fileLinks;
      }),
    ),
  );

  return new MicroAgentica({
    controllers: [
      {
        protocol: "class",
        application: typia.llm.application<Planning, "chatgpt">(),
        execute: planning,
        name: "Planning Functions",
      },
    ],
    model: "chatgpt",
    vendor: {
      api: vendor.api,
      model: "gpt-4.1",
    },
    config: {
      systemPrompt: {
        common: () => {
          return [
            `You are the best planner.`,
            ``,
            `These are all the links that are currently referenced in the markdown. Please make sure to refer to them and don't forget to create the corresponding files.`,
            `<Linked Files>`,
            markdownFiles.map((filename) => `- ${filename}`),
            `</Linked Files>`,
            "All links shall be included in the table of contents of the first chapter.",
            "If a new link is added later, the table of contents needs to be modified.",
            `Like revision_history, you should not write fakes for content that does not exist yet. If written, it is only allowed if there is a user's request directly.`,
            ``,
            `Please converse with the user based on the following guidelines and example templates.`,
            `You have to make a plan for the success of the user, and it has to be written in great detail to make the business successful.`,
            `Your performance is measured by your customer's success.`,
            `You should listen to the reviewer and not make any requests to the reviewer.`,
            "If the reviewer asks for changes, revise the entire document from top to bottom,",
            "incorporating both the existing content and the requested changes. Do not add only the new parts—integrate them into a full rewrite of the document.",
            "For example, if you are asked to modify or expand 'internal_bulletin_board_service_plan.md',",
            "do not create a document such as 'internal_bulletin_board_service_plan_expanded.md'.",
            "only update 'internal_bulletin_board_service_plan.md' file.",
            `<Guideline>`,
            fs.promises.readFile(path.join(__dirname, "guideline.txt")), // Guidelines
            `</Guideline>`,
            ``,
            `<Docuemtation Style>`,
            `As with example documents, it is better to divide the documents into several pieces.`,
            `If the amount user want is 30,000 characters, you'll have to write 10 tables of contents, and 1,000 characters per page.`,
            `For readability, even if the user requests it, a file should not exceed 1,000 characters. (The amount of text is measured in String(content).length)`,
            ``,
            `The first page must be the page that made up the table of contents, and you may need to modify the table of contents at the request of the reviewer.`,
            `Take advantage of the markdown link functionality OR write step by step (use overwrite function).`,
            `Take advantage of Mermaid.`,
            `For example, rather than writing a long markdown document, create a markdown document that makes up the table of contents.`,
            "You can also draw a gantt chart for the development period.",
            "",
            `And hang the link in the document in advance, and create other files that correspond to the link.`,
            `Even if it's not the first page, divide the documents if it's readable to write them separately.`,
            `Hyperlink features allow you to create more colorful documents.`,
            `Also, please put numbers in the front of the document as much as possible so that the files can be arranged well.`,
            "It is recommended to write a longer document (more than 1,000 letters).",
            "",
            "Please make the file appropriate for user's language.",
            "Documents and descriptions should be tailored to the language of the user.",
            `</Docuemtation Style>`,
            ``,
            "Please refer to the document below. The document below has a total of 1,500 characters and should be longer.",
            "<Example>",
            fs.promises.readFile(path.join(__dirname, "example.txt")), // Examples,
            "</Example>",
            "",
            "If you don't have anything more to ask for, call the 'abort' function instead of answering. Never answer the text.",
            "Similarly, if the reviewer says there is nothing more to modify and it is perfect, call the function 'abort'.",
            "'abort' is one of the tool lists that you have been given.",
            "If the reviewer says the document is complete, but it appears they are referring to only one out of several documents, then it is not yet the right time to abort.",
            "",
            "Write a long document, but keep your answer short.",
          ].join("\n");
        },
      },
    },
  });
};
