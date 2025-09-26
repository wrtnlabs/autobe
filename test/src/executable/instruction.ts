import typia from "typia";

import { TestHistory } from "../internal/TestHistory";
import { TestProject } from "../structures/TestProject";

const main = async (): Promise<void> => {
  for (const project of typia.misc.literals<TestProject>()) {
    if (project !== "bbs") continue;
    try {
      const histories = await TestHistory.getHistories(project, "interface");
      for (const history of histories)
        if ("instruction" in history)
          console.log(
            project,
            history.type,
            "\n--------------------------------------------\n",
            history.instruction,
            "\n--------------------------------------------\n\n\n",
          );
    } catch {}
  }
};
main().catch((exp) => console.error(exp));
