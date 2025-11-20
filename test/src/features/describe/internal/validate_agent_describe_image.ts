import { imageDescribe } from "@autobe/agent/src/describe/imageDescribe";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeExampleProject,
  AutoBeUserConversateContent,
} from "@autobe/interface";
import fs from "fs";
import path from "path";
import typia from "typia";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { prepare_agent_describe } from "./prepare_agent_describe";

export const validate_agent_describe_image = async (props: {
  factory: TestFactory;
  vendor: string;
  project: AutoBeExampleProject;
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
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }
    events.push(event);
  };

  agent.on("imageDescribeStart", enroll);
  agent.on("imageDescribeDraft", enroll);
  agent.on("imageDescribeComplete", enroll);

  const assetsPath = path.join(
    TestGlobal.ROOT,
    `scripts/${props.project}/analyze`,
  );
  const files = await fs.promises.readdir(assetsPath);
  const imageContents: AutoBeUserConversateContent[] = await Promise.all(
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

  const histories = await imageDescribe(agent.getContext(), {
    content: [
      ...imageContents,
      {
        type: "text",
        text: "Analyze these images and describe their content.",
      },
    ],
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${props.vendor}/describe/image/logs`,
    files: {
      "events.json": JSON.stringify(events),
      "histories.json": JSON.stringify(histories),
    },
    overwrite: true,
  });
  typia.assert(histories);
};
