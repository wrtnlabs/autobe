import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { v4 } from "uuid";

import { AutoBeSystemPromptConstant } from "../../constants/AutoBeSystemPromptConstant";
import { AutoBeState } from "../../context/AutoBeState";

export const transformTestScenarioHistories = (
  state: AutoBeState,
  endponits: AutoBeOpenApi.IEndpoint[],
  files: Record<string, string>,
): Array<
  IAgenticaHistoryJson.IAssistantMessage | IAgenticaHistoryJson.ISystemMessage
> => {
  if (state.analyze === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Requirement analysis is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the requirement analysis.",
        ].join(" "),
      },
    ];
  else if (state.prisma === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.analyze.step !== state.prisma.step)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.prisma.compiled.type !== "success")
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Prisma DB schema generation has not been updated",
          "for the latest requirement analysis.",
          "Don't call the any tool function,",
          "but say to re-process the Prisma DB schema generation.",
        ].join(" "),
      },
    ];
  else if (state.interface === null)
    return [
      {
        id: v4(),
        created_at: new Date().toISOString(),
        type: "systemMessage",
        text: [
          "Interface generation is not yet completed.",
          "Don't call the any tool function,",
          "but say to process the interface generation.",
        ].join(" "),
      },
    ];

  return [
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Result of Analyze Agent",
        "- The following document contains the user requirements that were extracted through conversations with the user by the Analyze Agent.",
        "- The database schema was designed based on these requirements, so you may refer to this document when writing test code or reviewing the schema.",
        "",
        `## User Request`,
        "",
        `- ${state.analyze.reason}`,
        "",
        `## Requirement Analysis Report`,
        "",
        "```json",
        JSON.stringify(state.analyze.files),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Result of Prisma Agent",
        "- Given the following database schema and entity-relationship diagram, write appropriate test code to validate the constraints and relationships defined in the schema. For example, if there is a unique column, include a test that ensures its uniqueness.",
        "- The test code should strictly adhere to the schema and relationships—no violations of constraints should occur.",
        "- Use the information from the schema and diagram to design meaningful and accurate test cases.",
        "",
        "## Prisma DB Schema",
        "```json",
        JSON.stringify(state.prisma.schemas),
        "```",
        "",
        "## Entity Relationship Diagrams",
        "```json",
        JSON.stringify(state.prisma.compiled.diagrams),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "# Result of Interfaced Agent",
        "- OpenAPI document generation is ready.",
        "",
        "Call the provided tool function to generate the user scenarios",
        "referencing below OpenAPI document.",
        "",
        `## OpenAPI Document`,
        "```json",
        JSON.stringify(state.interface.document),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: AutoBeSystemPromptConstant.TEST,
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        `This is a description of different APIs.`,
        `Different APIs may have to be called to create one.`,
        `Check which functions have been developed.`,
        "```json",
        JSON.stringify(endponits, null, 2),
        "```",
      ].join("\n"),
    },
    {
      id: v4(),
      created_at: new Date().toISOString(),
      type: "systemMessage",
      text: [
        "Below is basically the generated test code,",
        "which is a test to verify that the API is simply called and successful.",
        "Since there is already an automatically generated API,",
        "when a user requests to create a test scenario, two or more APIs must be combined,",
        "but a test in which the currently given endpoint is the main must be created.",
        '"Input Test Files" should be selected from the list of files here.',
        "```json",
        JSON.stringify(files, null, 2),
        "```",
      ].join("\n"),
    },
  ];
};
