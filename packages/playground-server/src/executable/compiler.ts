import { AutoBeCompiler } from "@autobe/compiler";
import { WorkerServer } from "tgrid";

const main = async () => {
  const compiler = new AutoBeCompiler();
  const worker = new WorkerServer();
  await worker.open(compiler);
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
