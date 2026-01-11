import { AutoBeExampleStorage } from "@autobe/benchmark";

const main = async (): Promise<void> => {
  const snapshots = await AutoBeExampleStorage.getSnapshots({
    vendor: "qwen/qwen3-next-80b-a3b-instruct",
    project: "todo",
    phase: "database",
  });
  console.log(
    snapshots.length,
    snapshots.at(0)?.tokenUsage.aggregate.total,
    snapshots.at(-1)?.tokenUsage.aggregate.total,
  );
};
main().catch(console.error);
