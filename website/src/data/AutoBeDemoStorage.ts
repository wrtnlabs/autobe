import { IAutoBePlaygroundReplay } from "@autobe/interface";

import data from "./replays.json";

export namespace AutoBeDemoStorage {
  export const getModels = () => Object.keys(data);

  export const getModelProjects = (
    model: string,
  ): IAutoBePlaygroundReplay.ISummary[] | null =>
    (data as IAutoBePlaygroundReplay.Collection)[model] ?? null;

  export const getProject = (props: {
    model: string;
    project: string;
  }): IAutoBePlaygroundReplay.ISummary | null => {
    const projects: IAutoBePlaygroundReplay.ISummary[] | null =
      getModelProjects(props.model);
    return projects?.find((next) => next.project === props.project) ?? null;
  };
}
