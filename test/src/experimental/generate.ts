import { AutoBeAgent } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeCompiler } from "@autobe/compiler";
import fs from "fs";
import OpenAI from "openai";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const histories = await AutoBeExampleStorage.getHistories({
    vendor: "openai/gpt-5.1",
    project: "shopping",
    phase: "interface",
  });
  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: "********" }),
      model: "openai/gpt-5.1",
    },
    compiler: () =>
      new AutoBeCompiler({
        realize: {
          test: {
            onOperation: async () => {},
            onReset: async () => {},
          },
        },
      }),
    histories,
  });
  const files = await agent.getFiles();
  await fs.promises.writeFile(
    `${TestGlobal.ROOT}/IShoppingMallOrder.log`,
    files["src/api/structures/IShoppingMallOrder.ts"],
    "utf8",
  );
};
main().catch(console.error);
