import { AutoBeReplayComputer, AutoBeReplayStorage } from "@autobe/benchmark";
import { IAutoBePlaygroundReplay } from "@autobe/interface";

const HOUR = 60 * 60 * 1000;

const main = async (): Promise<void> => {
  const replay: IAutoBePlaygroundReplay | null = await AutoBeReplayStorage.get({
    vendor: "qwen/qwen3-coder-next",
    project: "bbs",
  });
  if (replay === null) return;

  const summary = AutoBeReplayComputer.summarize(replay);
  console.log(summary.elapsed / HOUR);
};
main().catch(console.error);
