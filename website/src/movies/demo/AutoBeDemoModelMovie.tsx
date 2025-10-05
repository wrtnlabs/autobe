"use client";

import { AutoBeDemoStorage } from "@/src/data/AutoBeDemoStorage";
import { IAutoBePlaygroundReplay } from "@autobe/interface";

import AutoBeDemoProjectMovie from "./AutoBeDemoProjectMovie";

export default function AutoBeDemoModelMovie(
  props: AutoBeReplayModelMovie.IProps,
) {
  const replayList: IAutoBePlaygroundReplay.ISummary[] | null =
    AutoBeDemoStorage.getModelProjects(props.model);

  if (replayList === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg">No projects available for this model</p>
      </div>
    );
  }

  return (
    <div
      className="gap-6 grid grid-cols-1 lg:grid-cols-2"
      style={{
        maxWidth: "920px",
        margin: "0 auto",
      }}
    >
      {replayList.map((replay, index) => (
        <AutoBeDemoProjectMovie
          key={index}
          model={props.model}
          project={replay.project}
        />
      ))}
    </div>
  );
}
export namespace AutoBeReplayModelMovie {
  export interface IProps {
    model: string;
  }
}
