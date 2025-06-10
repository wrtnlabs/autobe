import { AutoBeAgent, orchestrate } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeUserMessageHistory } from "@autobe/interface";
import OpenAI from "openai";
import typia from "typia";
import { v4 } from "uuid";

import { TestGlobal } from "../../TestGlobal";

export const test_analyze_example = async () => {
  if (TestGlobal.env.CHATGPT_API_KEY === undefined) return false;
  const agent = new AutoBeAgent({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: TestGlobal.env.CHATGPT_API_KEY }),
      model: "gpt-4.1",
    },
    compiler: new AutoBeCompiler(),
  });

  const response = await orchestrate.analyze({
    ...agent.getContext(),
    histories: () => [
      {
        id: v4(),
        type: "userMessage",
        contents: [
          {
            type: "text",
            text: "Hello, I wanna make an BBS Article program.",
          },
        ],
        created_at: new Date().toISOString(),
      } satisfies AutoBeUserMessageHistory,
    ],
  })({
    reason: "The user requested the preparation of the plan.",
    userPlanningRequirements: `\`\`\`md
### **Internal Bulletin Board Requirements Specification**

| **Category** | **Requirements** |
| --- | --- |
| **1. User Authentication & Authorization** | • Only login with company email + password allowed • Initial password issued: **1234** • Password change **mandatory on first login** • No access to any posts or comments before login |
| **2. Bulletin Board Structure** | • Board types: **Announcements**, **Free Board**, **Popular Board** • **Popular Board**: posts with likes ≥ 10 are automatically promoted |
| **3. Posts & Comments Features** | • Create, edit, delete posts (by author + admin) • Support comments and **one-level nested replies** • Both posts and comments can receive **likes** (once per user) |
| **4. UI / UX** | • **Left navigation bar**: list of boards + new post button • **Top right corner**: login/logout and password change menu |
| **5. Other Constraints** | • Deleted posts and comments are permanently removed (hard delete) • Server-side handling to prevent duplicate likes during simultaneous requests |
\`\`\`
    `,
  });

  typia.assertGuard<"analyze">(response.type);
  typia.assertEquals(response.files);

  if (JSON.stringify(response.files) === "{}") {
    throw new Error("Analyze cannot generate files.");
  }

  return response;
};
