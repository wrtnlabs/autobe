import {
  AutoBeEventSnapshot,
  AutoBeHackathonModel,
  AutoBeHistory,
  AutoBePhase,
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { MapUtil, RandomGenerator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";
import { v7 } from "uuid";

import { CompressUtil } from "../../../../packages/filesystem/src/CompressUtil";
import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { AutoBeHackathonSessionEventProvider } from "../providers/sessions/AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "../providers/sessions/AutoBeHackathonSessionHistoryProvider";
import { AutoBeHackathonSessionProvider } from "../providers/sessions/AutoBeHackathonSessionProvider";
import { IEntity } from "../structures/IEntity";

export namespace AutoBeHackathonSessionSeeder {
  export const seed = async (props: {
    hackathon: IAutoBeHackathon;
    participants: IAutoBeHackathonParticipant[];
  }): Promise<void> => {
    for (const asset of await getAssets()) {
      const participant: IAutoBeHackathonParticipant = RandomGenerator.pick(
        props.participants,
      );
      const session: IAutoBeHackathonSession.ISummary =
        await AutoBeHackathonSessionProvider.create({
          hackathon: props.hackathon,
          participant,
          body: {
            model: asset.model,
            timezone: "Asia/Seoul",
            title: `${asset.model}`,
          },
        });
      const connection: IEntity =
        await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_connections.create(
          {
            data: {
              id: v7(),
              autobe_hackathon_session_id: session.id,
              created_at: new Date(),
              disconnected_at: null,
            },
          },
        );
      for (const history of asset.histories)
        await AutoBeHackathonSessionHistoryProvider.create({
          session,
          history,
          connection,
        });
      for (const snapshot of asset.snapshots)
        await AutoBeHackathonSessionEventProvider.create({
          session,
          snapshot,
          connection,
        });
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.update(
        {
          where: { autobe_hackathon_session_id: session.id },
          data: {
            phase: asset.phase,
            enabled: true,
            token_usage: JSON.stringify(asset.snapshots.at(-1)!.tokenUsage),
          },
        },
      );
    }
  };
}

const getAssets = async (): Promise<IAsset[]> => {
  const assets: IAsset[] = [];
  const root: string = `${AutoBeHackathonConfiguration.ROOT}/../../test/assets/histories`;
  for (const model of typia.misc.literals<AutoBeHackathonModel>()) {
    if (fs.existsSync(`${root}/${model}`) === false) continue;
    const gzFiles: string[] = (
      await fs.promises.readdir(`${root}/${model}`)
    ).filter((s) => s.endsWith(".json.gz"));

    interface IGroup {
      project: string;
      histories: string[];
      snapshots: string[];
    }
    const groupDict: Map<string, IGroup> = new Map();
    for (const file of gzFiles) {
      const elements: string[] = file.split(".");
      const project: string = elements[0];
      const tail: string = elements[2];
      const group: IGroup = MapUtil.take(groupDict, project, () => ({
        project,
        histories: [],
        snapshots: [],
      }));
      if (tail === "json") group.histories.push(file);
      else if (tail === "snapshots") group.snapshots.push(file);
    }
    for (const group of groupDict.values()) {
      group.histories.sort((a, b) =>
        compare(a.split(".")[1] as AutoBePhase, b.split(".")[1] as AutoBePhase),
      );
      group.snapshots.sort((a, b) =>
        compare(a.split(".")[1] as AutoBePhase, b.split(".")[1] as AutoBePhase),
      );
      assets.push({
        model,
        project: group.project,
        phase: group.histories.at(-1)!.split(".")[1] as AutoBePhase,
        histories: JSON.parse(
          await CompressUtil.gunzip(
            await fs.promises.readFile(
              `${root}/${model}/${group.histories.at(-1)!}`,
            ),
          ),
        ),
        snapshots: (
          await Promise.all(
            group.snapshots.map(async (file) =>
              JSON.parse(
                await CompressUtil.gunzip(
                  await fs.promises.readFile(`${root}/${model}/${file}`),
                ),
              ),
            ),
          )
        ).flat(),
      });
    }
  }
  return assets;
};

interface IAsset {
  model: AutoBeHackathonModel;
  project: string;
  phase: AutoBePhase;
  histories: AutoBeHistory[];
  snapshots: AutoBeEventSnapshot[];
}

const sequence = [
  "analyze",
  "prisma",
  "interface",
  "test",
  "realize",
] as const satisfies AutoBePhase[];
const compare = (a: AutoBePhase, b: AutoBePhase): number =>
  sequence.indexOf(a) - sequence.indexOf(b);
