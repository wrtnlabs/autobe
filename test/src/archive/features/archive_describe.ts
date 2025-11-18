import { AutoBeAgent, AutoBeTokenUsage } from "@autobe/agent";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEventOfSerializable,
  AutoBeEventSnapshot,
  AutoBeExampleProject,
  AutoBeHistory,
  AutoBeUserConversateContent,
  AutoBeUserMessageContent,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";
import { ArchiveLogger } from "../utils/ArchiveLogger";

export const archive_describe = async (props: {
  factory: TestFactory;
  project: AutoBeExampleProject;
  vendor: string;
}) => {
  if (TestGlobal.env.OPENAI_API_KEY === undefined) return false;

  // PREPARE ASSETS
  const userMessage: AutoBeUserConversateContent[] =
    await AutoBeExampleStorage.getUserMessage({
      project: props.project,
      phase: "analyze",
    });
  if (userMessage.some((m) => m.type === "image") === false)
    throw new Error("User message must contain image.");

  const start: Date = new Date();
  const agent: AutoBeAgent<ILlmSchema.Model> = props.factory.createAgent([]);
  const snapshots: AutoBeEventSnapshot[] = [];
  const listen = (event: AutoBeEventOfSerializable) => {
    if (TestGlobal.archive) ArchiveLogger.event(start, event);
    snapshots.push({
      event,
      tokenUsage: agent.getTokenUsage().toJSON(),
    });
  };
  for (const type of typia.misc.literals<AutoBeEventOfSerializable.Type>())
    agent.on(type, listen);

  // GENERATE REPORT
  const zero: AutoBeTokenUsage = new AutoBeTokenUsage(
    props.factory.getTokenUsage().toJSON(),
  );
  const go = async (
    c: string | AutoBeUserConversateContent | AutoBeUserConversateContent[],
  ): Promise<AutoBeHistory[]> => agent.conversate(c);

  let histories: AutoBeHistory[] = await go(userMessage);
  console.log("------------ Archive Describe Histories ------------");
  console.log(JSON.stringify(histories, null, 2));
  const userHistory: AutoBeUserMessageContent | undefined = histories
    .find((h) => h.type === "userMessage")
    ?.contents.find((c) => c.type === "image");
  if (userHistory === undefined)
    throw new Error("User history must contain image.");

  try {
    await FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${AutoBeExampleStorage.slugModel(props.vendor, false)}/${props.project}/describe`,
      files: {
        "description.md": userHistory.description,
      },
    });
  } catch {}
  await AutoBeExampleStorage.save({
    vendor: props.vendor,
    project: props.project,
    files: {
      [`describe.histories.json`]: JSON.stringify(agent.getHistories()),
      [`describe.snapshots.json`]: JSON.stringify(
        snapshots.map((s) => ({
          event: s.event,
          tokenUsage: new AutoBeTokenUsage(s.tokenUsage)
            .decrement(zero)
            .toJSON(),
        })),
      ),
    },
  });
};
