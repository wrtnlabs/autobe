import { AutoBeProcessAggregateFactory } from "@autobe/agent/src/factory/AutoBeProcessAggregateFactory";
import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeAggregateEventBase,
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBePhase,
  AutoBeProcessAggregateCollection,
} from "@autobe/interface";
import fs from "fs";
import path from "path";
import typia from "typia";

import { TestGlobal } from "../TestGlobal";

const fixSnapshot = async (file: string): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(file)),
  );
  for (const { event } of snapshots)
    if (typia.is<Pick<AutoBeAggregateEventBase, "tokenUsage">>(event)) {
      event.metric ??= AutoBeProcessAggregateFactory.createAggregate().metric;
      event.metric.attempt ??= (event.metric as any).total;
      delete (event.metric as any).total;
    }
  await fs.promises.writeFile(
    file,
    await CompressUtil.gzip(JSON.stringify(snapshots)),
  );
};

const fixHistory = async (props: {
  directory: string;
  project: string;
  file: string;
  phase: AutoBePhase;
}): Promise<void> => {
  const histories: AutoBeHistory[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(props.file)),
  );
  for (const history of histories) {
    if (
      history.type !== "analyze" &&
      history.type !== "prisma" &&
      history.type !== "interface" &&
      history.type !== "test" &&
      history.type !== "realize"
    )
      continue;
    history.aggregates = await getSnapshotAggregates({
      directory: props.directory,
      project: props.project,
      phase: history.type,
    });
  }
  await fs.promises.writeFile(
    props.file,
    await CompressUtil.gzip(JSON.stringify(histories, null, 2)),
  );
};

const getSnapshotAggregates = async (props: {
  directory: string;
  phase: AutoBePhase;
  project: string;
}): Promise<AutoBeProcessAggregateCollection> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${props.directory}/${props.project}.${props.phase}.snapshots.json.gz`,
      ),
    ),
  );
  const collection: AutoBeProcessAggregateCollection =
    AutoBeProcessAggregateFactory.createCollection();
  for (const event of snapshots.map((s) => s.event))
    if (typia.is<AutoBeAggregateEventBase>(event))
      AutoBeProcessAggregateFactory.emplaceEvent(collection, event);
  return collection;
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory()) await iterate(next);
    else if (file.endsWith(".snapshots.json.gz")) await fixSnapshot(next);
  }
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    for (const phase of typia.misc.literals<AutoBePhase>())
      if (file.endsWith(`${phase}.json.gz`))
        await fixHistory({
          directory: path.dirname(next),
          file: path.resolve(next),
          project: file.split(".")[0],
          phase,
        });
  }
};
const main = async (): Promise<void> => {
  await iterate(TestGlobal.ROOT + "/assets/histories");
};
main().catch(console.error);
