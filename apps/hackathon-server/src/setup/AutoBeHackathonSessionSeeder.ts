import {
  AutoBeHackathonModel,
  IAutoBeHackathon,
  IAutoBeHackathonSession,
  IAutobeHackathonParticipant,
} from "@autobe/hackathon-api";
import { AutoBeEventSnapshot, AutoBeHistory } from "@autobe/interface";
import { MapUtil, RandomGenerator } from "@nestia/e2e";
import fs from "fs";
import typia from "typia";
import { v7 } from "uuid";

import { CompressUtil } from "../../../../packages/filesystem/src/CompressUtil";
import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { AutoBeHackathonSessionEventProvider } from "../providers/AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "../providers/AutoBeHackathonSessionHistoryProvider";
import { AutoBeHackathonSessionProvider } from "../providers/AutoBeHackathonSessionProvider";
import { IEntity } from "../structures/IEntity";

export namespace AutoBeHackathonSessionSeeder {
  export const seed = async (props: {
    hackathon: IAutoBeHackathon;
    participants: IAutobeHackathonParticipant[];
  }): Promise<void> => {
    for (const asset of await getAssets()) {
      const participant: IAutobeHackathonParticipant = RandomGenerator.pick(
        props.participants,
      );
      const session: IAutoBeHackathonSession.ISummary =
        await AutoBeHackathonSessionProvider.create({
          hackathon: props.hackathon,
          participant,
          body: {
            model: asset.model,
            timezone: "Asia/Seoul",
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
            state: asset.state,
            enabled: true,
            token_usage: asset.snapshots.at(-1)!.tokenUsage as any,
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
      histories: string[];
      snapshots: string[];
    }
    const groupDict: Map<string, IGroup> = new Map();
    for (const file of gzFiles) {
      const elements: string[] = file.split(".");
      const project: string = elements[0];
      const tail: string = elements[2];
      const group: IGroup = MapUtil.take(groupDict, project, () => ({
        histories: [],
        snapshots: [],
      }));
      if (tail === "json") group.histories.push(file);
      else if (tail === "snapshots") group.snapshots.push(file);
    }
    for (const group of groupDict.values()) {
      group.histories.sort((a, b) =>
        compare(a.split(".")[1] as State, b.split(".")[1] as State),
      );
      group.snapshots.sort((a, b) =>
        compare(a.split(".")[1] as State, b.split(".")[1] as State),
      );
      assets.push({
        model,
        state: group.histories.at(-1)!.split(".")[1] as State,
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
  state: "analyze" | "prisma" | "interface" | "test" | "realize";
  histories: AutoBeHistory[];
  snapshots: AutoBeEventSnapshot[];
}
type State = IAsset["state"];

const sequence = ["analyze", "prisma", "interface", "test", "realize"] as const;
const compare = (a: State, b: State): number =>
  sequence.indexOf(a) - sequence.indexOf(b);
