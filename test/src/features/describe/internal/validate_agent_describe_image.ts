import { describeImages } from "@autobe/agent/src/describe/image/describeImages";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeUserMessageImageContent } from "@autobe/interface";
import fs from "fs";
import path from "path";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_describe } from "./prepare_agent_describe";

export const validate_agent_describe_image = async (props: {
  factory: TestFactory;
  vendor: string;
}) => {
  if (
    TestGlobal.env.OPENAI_API_KEY === undefined ||
    TestGlobal.env.OPENROUTER_API_KEY === undefined
  )
    return false;

  const { agent } = prepare_agent_describe(props);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    console.log(JSON.stringify(event, null, 2));
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }

    events.push(event);
  };

  agent.on("describeStart", (e) => {
    enroll(e);
  });
  agent.on("describeImageDraft", (e) => {
    FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/draft`,
      files: {
        [`logs/${e.id}.json`]: e.draft,
      },
      overwrite: true,
    });
    enroll(e);
  });
  agent.on("describeImageDraftGroup", (e) => {
    FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/group`,
      files: {
        [`logs/${e.id}.json`]: JSON.stringify(e.groups),
      },
      overwrite: true,
    });
    enroll(e);
  });
  agent.on("describeImageDraftIntegration", (e) => {
    FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/integration`,
      files: {
        "logs/draft-integration.json": e.integration,
      },
      overwrite: true,
    });
    enroll(e);
  });
  agent.on("describeImageDocument", (e) => {
    FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/document`,
      files: {
        "logs/document.json": e.document,
      },
      overwrite: true,
    });
    enroll(e);
  });
  agent.on("describeComplete", (e) => {
    FileSystemIterator.save({
      root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/complete`,
      files: {
        "logs/complete.json": e.document,
      },
      overwrite: true,
    });
    enroll(e);
  });
  agent.on("realizeStart", enroll);
  agent.on("realizeWrite", enroll);
  agent.on("realizeCorrect", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);
  agent.on("realizeAuthorizationStart", enroll);
  agent.on("realizeAuthorizationWrite", enroll);
  agent.on("realizeAuthorizationValidate", enroll);
  agent.on("realizeAuthorizationCorrect", enroll);
  agent.on("realizeAuthorizationComplete", enroll);

  const assetsPath = path.join(TestGlobal.ROOT, "../assets/describe");
  const files = await fs.promises.readdir(assetsPath);
  const imageContents: AutoBeUserMessageImageContent[] = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(assetsPath, fileName);
      const extension = fileName.split(".").pop() ?? "unknown";
      const base64Data = `data:image/${extension};base64,${await fs.promises.readFile(filePath, "base64")}`;

      return {
        type: "image",
        image: {
          type: "base64",
          data: base64Data,
        },
      };
    }),
  );

  const histories = await describeImages(agent.getContext(), {
    content: [
      ...imageContents,
      {
        type: "text",
        text: "Convert the images into a planning document.",
      },
    ],
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/logs`,
    files: {
      "events.json": JSON.stringify(events),
      "histories.json": JSON.stringify(histories),
    },
  });
  typia.assert(histories);
};
