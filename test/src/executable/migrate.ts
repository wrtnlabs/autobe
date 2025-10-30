import { CompressUtil } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeEventSnapshot } from "@autobe/interface";
import { AutoBeInterfaceSchemaReviewEvent } from "@autobe/interface/src/events/AutoBeInterfaceSchemaReviewEvent";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const fixInterfaceSnapshots = async (location: string): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(location)),
  );
  const allEvents: AutoBeEvent[] = snapshots.map((s) => s.event);
  const securities: AutoBeInterfaceSchemaReviewEvent[] = allEvents.filter(
    (e): e is AutoBeInterfaceSchemaReviewEvent =>
      (e as any).type === "interfaceSchemaSecurityReview",
  );
  const relations: AutoBeInterfaceSchemaReviewEvent[] = allEvents.filter(
    (e): e is AutoBeInterfaceSchemaReviewEvent =>
      (e as any).type === "interfaceSchemaRelationReview",
  );
  const contents: AutoBeInterfaceSchemaReviewEvent[] = allEvents.filter(
    (e): e is AutoBeInterfaceSchemaReviewEvent =>
      (e as any).type === "interfaceSchemaContentReview",
  );

  const total: number = securities.length + relations.length + contents.length;
  for (const e of securities) {
    e.type = "interfaceSchemaReview";
    e.kind = "security";
    e.total = total;
  }
  for (const event of relations) {
    event.type = "interfaceSchemaReview";
    event.kind = "relation";
    event.total = total;
    event.completed += securities.length;
  }
  for (const event of contents) {
    event.type = "interfaceSchemaReview";
    event.kind = "content";
    event.total = total;
    event.completed += securities.length + relations.length;
  }
  await fs.promises.writeFile(
    location,
    await CompressUtil.gzip(JSON.stringify(snapshots)),
  );
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory()) await iterate(next);
    else if (file.endsWith("interface.snapshots.json.gz"))
      await fixInterfaceSnapshots(next);
  }
};
const main = async (): Promise<void> => {
  await iterate(TestGlobal.ROOT + "/assets/histories");
};
main().catch(console.error);
