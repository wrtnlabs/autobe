import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeAnalyzeHistory, AutoBeHistory } from "@autobe/interface";

const main = async () => {
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "qwen/qwen3.5-122b-a10b",
    phase: "analyze",
    project: "todo",
  });
  const analyze: AutoBeAnalyzeHistory | undefined = histories.find(
    (h) => h.type === "analyze",
  );
  if (analyze === undefined) throw new Error("Analyze history not found");
};
main().catch(console.error);
