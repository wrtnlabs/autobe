import cp from "child_process";
import { sleep_for } from "tstl";

import { MyConfiguration } from "../src/MyConfiguration";
import { MyGlobal } from "../src/MyGlobal";
import { TestAutomation } from "./TestAutomation";

const wait = async (): Promise<void> => {
  while (true)
    try {
      await fetch(`http://localhost:${MyConfiguration.API_PORT()}/dsafdsafsd`);
      return;
    } catch (exp) {
      await sleep_for(100);
    }
};

const main = async (): Promise<void> => {
  MyGlobal.testing = true;
  await TestAutomation.execute({
    open: async () => {
      const backend: cp.ChildProcess = cp.fork(
        `${MyConfiguration.ROOT}/dist/server.js`,
        {
          cwd: `${MyConfiguration.ROOT}/dist`,
        },
      );
      await wait();
      return backend;
    },
    close: async (backend) => {
      backend.kill();
    },
  });
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
