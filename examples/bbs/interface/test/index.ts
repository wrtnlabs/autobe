import { MyBackend } from "../src/MyBackend";
import { MyGlobal } from "../src/MyGlobal";
import { TestAutomation } from "./TestAutomation";

const main = async (): Promise<void> => {
  MyGlobal.testing = true;
  await TestAutomation.execute({
    open: async () => {
      const backend: MyBackend = new MyBackend();
      await backend.open();
      return backend;
    },
    close: (backend) => backend.close(),
  });
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
