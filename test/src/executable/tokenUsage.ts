import { AutoBeExampleStorage } from "@autobe/benchmark";

const main = async (): Promise<void> => {
  const snapshots = await AutoBeExampleStorage.getSnapshots({
    vendor: "qwen/qwen3-next-80b-a3b-instruct",
    project: "shopping",
    phase: "analyze",
  });
  console.log(
    snapshots.at(0)?.tokenUsage.analyze,
    snapshots.at(-1)?.tokenUsage.analyze,
  );
};
main().catch(console.error);
