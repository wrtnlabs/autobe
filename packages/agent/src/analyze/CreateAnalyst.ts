// import { IAgenticaVendor, MicroAgentica } from "@agentica/core";
// import typia from "typia";

// import { AnalyzeAgent } from "../analyze/AnalyzeAgent";
// import { IAutoBeApplicationProps } from "../context/IAutoBeApplicationProps";

// /**
//  * Function for create analyze agent.
//  *
//  * @param input.execute Executives for function calling of analyze agent
//  * @param input.api OpenAI
//  * @param input.userPlanningRequirements Planning Requirements
//  * @returns
//  */
// export const createAnalyst = (input: {
//   execute: AnalyzeAgent;
//   api: IAgenticaVendor["api"];
//   userPlanningRequirements: Required<IAutoBeApplicationProps>["userPlanningRequirements"];
// }) => {
//   return new MicroAgentica({
//     controllers: [
//       {
//         name: "Analyze Agent For Planning",
//         protocol: "class",
//         application: typia.llm.application<AnalyzeAgent, "chatgpt">(),
//         execute: input.execute,
//       },
//     ],
//     model: "chatgpt",
//     vendor: {
//       api: input.api,
//       model: "gpt-4.1",
//     },
//     histories: [
//       {
//         text: input.userPlanningRequirements,
//         type: "assistantMessage",
//       },
//     ],
//   });
// };
