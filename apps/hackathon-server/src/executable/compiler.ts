import { AutoBeCompiler } from "@autobe/compiler";
import { IAutoBeCompilerListener } from "@autobe/interface";
import { WorkerServer } from "tgrid";

const main = async () => {
  const worker = new WorkerServer();
  const compiler = new AutoBeCompiler(
    worker.getDriver<IAutoBeCompilerListener>(),
  );
  await worker.open(compiler);
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
