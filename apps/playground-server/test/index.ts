import { AutoBePlaygroundServer } from "../src/AutoBePlaygroundServer";
import { TestAutomation } from "./TestAutomation";

TestAutomation.execute({
  open: async () => {
    const backend: AutoBePlaygroundServer = new AutoBePlaygroundServer();
    await backend.open();
    return backend;
  },
  close: async (backend) => {
    await backend.close();
  },
}).catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
