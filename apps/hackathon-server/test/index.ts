import { AutoBeHackathonBackend } from "../src/AutoBeHackathonBackend";
import { TestAutomation } from "./TestAutomation";

TestAutomation.execute({
  open: async () => {
    const backend: AutoBeHackathonBackend = new AutoBeHackathonBackend();
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
