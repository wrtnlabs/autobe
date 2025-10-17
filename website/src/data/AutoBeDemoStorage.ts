import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { Singleton } from "tstl";

import json from "./benchmark.json";

export namespace AutoBeDemoStorage {
  export const data = (): IAutoBePlaygroundBenchmark[] => json as any;

  export const getModels = () => models.get();

  export const getItems = () => items.get();

  export const getModelProjects = (
    model: string,
  ): IAutoBePlaygroundReplay.ISummary[] | null => {
    const benchmark: IAutoBePlaygroundBenchmark | undefined = data().find(
      (i) => i.vendor === model,
    );
    if (benchmark === undefined) return null;
    return benchmark.replays;
  };

  export const getProject = (props: {
    model: string;
    project: string;
  }): IAutoBePlaygroundReplay.ISummary | null => {
    const projects: IAutoBePlaygroundReplay.ISummary[] | null =
      getModelProjects(props.model);
    return projects?.find((next) => next.project === props.project) ?? null;
  };
}

const items = new Singleton(() =>
  AutoBeDemoStorage.data().map((b) => ({
    label: `${b.emoji} ${b.vendor}`,
    data: b.vendor,
  })),
);
const models = new Singleton(() =>
  AutoBeDemoStorage.data().map((b) => b.vendor),
);
