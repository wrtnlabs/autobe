import { MyBackend } from "../src/MyBackend";
import { MyGlobal } from "../src/MyGlobal";
import { TestAutomation } from "./helpers/TestAutomation";
import { TestAutomationStdio } from "./helpers/TestAutomationStdio";

const main = async (): Promise<void> => {
  MyGlobal.testing = true;
  await TestAutomation.execute({
    open: async () => {
      const backend: MyBackend = new MyBackend();
      await backend.open();
      return backend;
    },
    close: (backend) => backend.close(),
    options: await TestAutomationStdio.getOptions(),
    onComplete: TestAutomationStdio.onComplete,
    onReset: TestAutomationStdio.onReset(new Date()),
  });
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
