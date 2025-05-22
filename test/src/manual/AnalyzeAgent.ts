// import { orchestrateAnalyze } from "@autobe/agent/src/orchestrate/orchestrateAnalyze";
// import { config } from "dotenv";
// import fs from "fs";
// import * as readline from "readline";

// config();

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   terminal: true,
// });

// // 문장을 입력받는 부분
// const askQuestion = (prompt: string): Promise<string> => {
//   return new Promise((resolve) => {
//     rl.question(prompt, (answer) => {
//       resolve(answer);
//     });
//   });
// };

// async function createAgent() {
//   const foldername = new Date().getTime().toString();
//   await fs.promises.mkdir(`${__dirname}/${foldername}`);

//   return orchestrateAnalyze({})({ reason: "" });
// }

// async function main() {
//   const agent = await createAgent();
//   let input = "";
//   while (true) {
//     input = await askQuestion(
//       "문장을 입력하세요 (줄바꿈은 Shift+Enter로 가능, 종료하려면 Ctrl+C): ",
//     );
//     const inputBuffer = input + "\n"; // 줄바꿈과 함께 입력 내용 누적

//     // 현재까지 입력한 내용 출력
//     console.log(`User: ${inputBuffer}`);

//     // LLM 답변
//     const responses = await agent.conversate(inputBuffer);

//     for (const response of responses) {
//       const text =
//         response.type === "text"
//           ? response.text
//           : response.type === "describe"
//             ? response.text
//             : null;

//       if (text) {
//         console.log(`Agent: ${text}`);
//       }
//     }
//   }
// }

// main().catch(() => process.exit(-1));
