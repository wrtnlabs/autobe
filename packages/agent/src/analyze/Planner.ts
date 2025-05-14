import { Agentica, IAgenticaVendor } from "@agentica/core";
import fs from "fs";
import path from "path";
import typia from "typia";

import { Planning } from "./Planning";

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
