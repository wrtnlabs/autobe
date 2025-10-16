import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { Singleton } from "tstl";

import data from "./replays.json";

export namespace AutoBeDemoStorage {
  export const getModels = () => vendorModels.get();

  export const getModelProjects = (
    model: string,
  ): IAutoBePlaygroundReplay.ISummary[] | null => {
    const replays = (data as IAutoBePlaygroundReplay.Collection)[model];
    if (replays === undefined) return null;
    return replays.filter((r) => PROJECTS.includes(r.project));
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

const PROJECTS = ["todo", "bbs", "reddit", "shopping"];
const vendorModels = new Singleton(() => {
  const success: string[] = [];
  const passes: string[] = [];
  const failure: string[] = [];
  for (const [key, collection] of Object.entries(
    data as IAutoBePlaygroundReplay.Collection,
  )) {
    const count: number = collection.filter(
      (r) => r.realize !== null && r.realize.success === true,
    ).length;
    if (count >= 3) success.push(key);
    else if (count !== 0) passes.push(key);
    else failure.push(key);
  }
  return [...success.sort(), ...passes.sort(), ...failure.sort()];
});
