import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeInterfaceComplementEvent,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import typia from "typia";

const fix = async (props: {
  vendor: string;
  project: AutoBeExampleProject;
}): Promise<void> => {
  try {
    const snapshots: AutoBeEventSnapshot[] =
      await AutoBeExampleStorage.getSnapshots({
        vendor: props.vendor,
        project: props.project,
        phase: "interface",
      });
    const complements: AutoBeInterfaceComplementEvent[] = snapshots
      .map((s) => s.event)
      .filter(
        (e) => e.type === "interfaceComplement",
      ) as AutoBeInterfaceComplementEvent[];
    if (complements.length === 0) return;
    else if (complements[0].total !== undefined) return;

    const progress: AutoBeProgressEventBase = {
      total: complements
        .map((c) => Object.keys(c.schemas).length)
        .reduce((a, b) => a + b, 0),
      completed: 0,
    };
    complements.forEach((c) => {
      c.total = progress.total;
      c.completed += Object.keys(c.schemas).length;
      Object.assign(c, progress);
    });
    await AutoBeExampleStorage.save({
      vendor: props.vendor,
      project: props.project,
      files: {
        [`interface.snapshots.json`]: JSON.stringify(snapshots),
      },
    });
  } catch {}
};

const main = async (): Promise<void> => {
  for (const vendor of await AutoBeExampleStorage.getVendorModels())
    for (const project of typia.misc.literals<AutoBeExampleProject>())
      await fix({ vendor, project });
};
main().catch(console.error);
