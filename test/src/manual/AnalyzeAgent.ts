import { config } from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import * as readline from "readline";

import { AnalyzeAgent } from "../../../packages/agent/src/analyze/AnalyzeAgent";

config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

// 문장을 입력받는 부분
const askQuestion = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function createAgent() {
  const foldername = new Date().getTime().toString();
  await fs.promises.mkdir(`${__dirname}/${foldername}`);

  return AnalyzeAgent(
    {
      api: new OpenAI({
        apiKey: process.env.OPENAI_KEY,
      }),
      model: "gpt-4.1",
    },
    {
      folder: `${__dirname}/${foldername}`,
    },
  );
}

async function main() {
  const agent = await createAgent();
  let input = "";
  while (true) {
    input = await askQuestion(
      "문장을 입력하세요 (줄바꿈은 Shift+Enter로 가능, 종료하려면 Ctrl+C): ",
    );
    const inputBuffer = input + "\n"; // 줄바꿈과 함께 입력 내용 누적

    // 현재까지 입력한 내용 출력
    console.log(`User: ${inputBuffer}`);

    // LLM 답변
    const responses = await agent.conversate(inputBuffer);

    for (const response of responses) {
      const text =
        response.type === "text"
          ? response.text
          : response.type === "describe"
            ? response.text
            : null;

      if (text) {
        console.log(`Agent: ${text}`);
      }
    }
  }
}

main().catch(() => process.exit(-1));
