import { IAutoBePlaygroundBenchmarkScore } from "./IAutoBePlaygroundBenchmarkScore";
import { IAutoBePlaygroundReplay } from "./IAutoBePlaygroundReplay";

export interface IAutoBePlaygroundBenchmark {
  vendor: string;
  replays: IAutoBePlaygroundReplay.ISummary[];
  score: IAutoBePlaygroundBenchmarkScore;
  emoji: string;
}
