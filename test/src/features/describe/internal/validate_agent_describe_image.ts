import { describeImages } from "@autobe/agent/src/describe/describeImages";
import { FileSystemIterator } from "@autobe/filesystem";
import { AutoBeEvent, AutoBeUserConversateContent } from "@autobe/interface";
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
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }
    events.push(event);
  };

  agent.on("describeStart", enroll);
  agent.on("describeImageDraft", enroll);
  agent.on("describeImageDraftGroup", enroll);
  agent.on("describeImageDraftIntegration", enroll);
  agent.on("describeImageDocument", enroll);
  agent.on("describeComplete", enroll);
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
  const imageContents: AutoBeUserConversateContent[] = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(assetsPath, fileName);
      const extension = fileName.split(".").pop() ?? "unknown";
      const base64Data = `data:image/${extension};base64,${await fs.promises.readFile(filePath, "base64")}`;

      return {
        type: "image",
        data: base64Data,
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
