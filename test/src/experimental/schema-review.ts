import { CompressUtil } from "@autobe/filesystem";
import {
  AutoBeEventSnapshot,
  AutoBeInterfaceSchemaRelationReviewEvent,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const load = async (): Promise<AutoBeInterfaceSchemaRelationReviewEvent[]> => {
  const snapshots: AutoBeEventSnapshot[] = JSON.parse(
    await CompressUtil.gunzip(
      await fs.promises.readFile(
        `${TestGlobal.ROOT}/assets/histories/openai/gpt-4.1/chat.interface.snapshots.json.gz`,
      ),
    ),
  );
  return snapshots
    .map((s) => s.event)
    .filter((e) => e.type === "interfaceSchemaRelationReview");
};

const main = async (): Promise<void> => {
  const reviews: AutoBeInterfaceSchemaRelationReviewEvent[] = await load();
  for (const r of reviews) {
    // if (Object.keys(r.content).length === 0) continue;
    if (r.schemas["IWrtnEnterpriseEmployee"] === undefined) continue;
    const md: string = StringUtil.trim`
      # Interface Schema Review
      ## Review

      ${r.review}

      ## Plan

      ${r.plan}

      ## Input

      \`\`\`json
      ${JSON.stringify(r.schemas, null, 2)}
      \`\`\`

      ## Changed Schemas

      \`\`\`json
      ${JSON.stringify(r.content, null, 2)}
      \`\`\`
    `;
    console.log(md + "\n\n\n");
  }
};
main().catch(console.error);
