import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import { revertOpenApiAccessor } from "@autobe/utils";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const main = async (): Promise<void> => {
  const location = (filename: string): string =>
    `${TestGlobal.ROOT}/assets/histories/anthropic/claude-sonnet-4.5/${filename}`;
  const load = async <T>(filename: string): Promise<T> =>
    JSON.parse(
      await CompressUtil.gunzip(await fs.promises.readFile(location(filename))),
    );
  const save = async (filename: string, data: object): Promise<void> =>
    fs.promises.writeFile(
      location(filename),
      await CompressUtil.gzip(JSON.stringify(data)),
    );

  const fix = (document: AutoBeOpenApi.IDocument): void =>
    revertOpenApiAccessor(document);

  const histories: AutoBeHistory[] = await load("shopping.interface.json.gz");
  const snapshots: AutoBeEventSnapshot[] = await load(
    "shopping.interface.snapshots.json.gz",
  );

  fix(histories.find((h) => h.type === "interface")!.document);
  fix(
    snapshots.map((s) => s.event).find((e) => e.type === "interfaceComplete")!
      .document,
  );
  await save("shopping.interface.json.gz", histories);
  await save("shopping.interface.snapshots.json.gz", snapshots);
};
main().catch(console.error);
