import { AutoBeExampleStorage } from "@autobe/benchmark";

const main = async (): Promise<void> => {
  const histories = await AutoBeExampleStorage.getHistories({
    vendor: "anthropic/claude-sonnet-4.5",
    project: "todo",
    phase: "test",
  });
  const test = histories.find((h) => h.type === "test");
  console.log(test?.compiled);
};
main().catch(console.error);
