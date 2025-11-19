import { AutoBeExampleStorage, AutoBeReplayComputer } from "@autobe/benchmark";
import {
  AutoBeAggregateEventBase,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBePhase,
  AutoBeProcessAggregateCollection,
  IAutoBePlaygroundReplay,
} from "@autobe/interface";
import { AutoBeProcessAggregateFactory } from "@autobe/utils";
import typia from "typia";

const PHASES = ["analyze", "prisma", "interface", "test", "realize"] as const;

const main = async (): Promise<void> => {
  for (const vendor of await AutoBeExampleStorage.getVendorModels())
    for (const project of typia.misc.literals<AutoBeExampleProject>()) {
      for (const phase of PHASES.slice().reverse()) {
        if (
          (await AutoBeExampleStorage.has({
            vendor,
            project,
            phase,
          })) === false
        )
          continue;
        try {
          const getSnapshots = (phase: AutoBePhase) =>
            AutoBeExampleStorage.getSnapshots({
              vendor,
              project,
              phase,
            });
          const histories: AutoBeHistory[] =
            await AutoBeExampleStorage.getHistories({
              vendor,
              project,
              phase,
            });
          const replay: IAutoBePlaygroundReplay = {
            vendor,
            project,
            histories,
            analyze: null,
            prisma: null,
            interface: null,
            test: null,
            realize: null,
          };
          const index: number = PHASES.indexOf(phase);
          for (let i: number = 0; i <= index; ++i)
            replay[PHASES[i]] = await getSnapshots(PHASES[i]);

          const summary: IAutoBePlaygroundReplay.ISummary =
            AutoBeReplayComputer.summarize(replay);
          if (phase !== "realize") {
            try {
              const aggregates: AutoBeProcessAggregateCollection =
                AutoBeProcessAggregateFactory.createCollection();
              const snapshots: AutoBeEventSnapshot[] = await getSnapshots(
                PHASES[index + 1],
              );
              for (const { event } of snapshots) {
                if (typia.is<AutoBeAggregateEventBase>(event) === false)
                  continue;
                AutoBeProcessAggregateFactory.emplaceEvent(aggregates, event);
              }
              summary[PHASES[index + 1]] = {
                aggregates,
                success: false,
                elapsed: 0,
                commodity: {},
              };
            } catch {}
          }
          await AutoBeExampleStorage.save({
            vendor,
            project,
            files: {
              ["summary.json"]: JSON.stringify(summary),
            },
          });
        } finally {
          break;
        }
      }
    }
};
main().catch(console.error);
