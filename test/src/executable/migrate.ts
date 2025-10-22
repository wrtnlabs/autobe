import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  AutoBeOpenApi,
} from "@autobe/interface";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const fixDocument = (document: AutoBeOpenApi.IDocument): void => {
  if ("authorization" in document.components) {
    document.components.authorizations = document.components
      .authorization as any;
    delete document.components.authorization;
  }
  for (const authorization of document.components.authorizations)
    if ("role" in authorization) {
      authorization.name = authorization.role as any;
      delete authorization.role;
    }
  for (const operation of document.operations)
    if ("authorizationRole" in operation) {
      operation.authorizationActor = operation.authorizationRole as any;
      delete operation.authorizationRole;
    }
};

const fixSnapshots = async (location: string): Promise<void> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(location)),
  );
  for (const { event } of snapshots) {
    if (
      (event.type === "analyzeScenario" || event.type === "analyzeComplete") &&
      "roles" in event
    ) {
      event.actors = event.roles as any;
      delete event.roles;
    } else if (event.type === "interfaceComplete") fixDocument(event.document);
    else if (
      event.type === "realizeAuthorizationWrite" ||
      event.type === "realizeAuthorizationCorrect" ||
      event.type === "realizeAuthorizationValidate"
    ) {
      if ("role" in event.authorization) {
        event.authorization.actor = event.authorization.role as any;
        delete event.authorization.role;
      }
    }
  }
  await fs.promises.writeFile(
    location,
    await CompressUtil.gzip(JSON.stringify(snapshots)),
  );
};

const fixHistories = async (location: string): Promise<void> => {
  const histories: AutoBeHistory[] = JSON.parse(
    await CompressUtil.gunzip(await fs.promises.readFile(location)),
  );
  for (const history of histories) {
    if (history.type === "interface") fixDocument(history.document);
    else if (history.type === "realize")
      for (const authorization of history.authorizations)
        if ("role" in authorization) {
          authorization.actor = authorization.role as any;
          delete authorization.role;
        }
  }
  await fs.promises.writeFile(
    location,
    await CompressUtil.gzip(JSON.stringify(histories)),
  );
};

const iterate = async (location: string): Promise<void> => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const next: string = `${location}/${file}`;
    const stat: fs.Stats = await fs.promises.stat(next);
    if (stat.isDirectory()) await iterate(next);
    else if (file.endsWith(".snapshots.json.gz")) await fixSnapshots(next);
    else if (file.endsWith(".json.gz")) await fixHistories(next);
  }
};
const main = async (): Promise<void> => {
  await iterate(TestGlobal.ROOT + "/assets/histories");
};
main().catch(console.error);
