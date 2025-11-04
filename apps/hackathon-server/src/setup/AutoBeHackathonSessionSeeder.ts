import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHackathonModel,
  AutoBeHistory,
  AutoBePhase,
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { RandomGenerator } from "@nestia/e2e";
import typia from "typia";
import { v7 } from "uuid";

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
          enforce: true,
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
  for (const model of typia.misc.literals<AutoBeHackathonModel>())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      for (const phase of sequence) {
        try {
          const histories: AutoBeHistory[] =
            await AutoBeExampleStorage.getHistories({
              vendor: model,
              project,
              phase,
            });
          const snapshots: AutoBeEventSnapshot[] = [];
          for (const prevPhase of sequence) {
            snapshots.push(
              ...(await AutoBeExampleStorage.getSnapshots({
                vendor: model,
                project,
                phase: prevPhase,
              })),
            );
            if (phase === prevPhase) break;
          }
          assets.push({
            model,
            project,
            phase,
            histories,
            snapshots,
          });
          break;
        } catch {}
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
