import cp from "child_process";

import { AutoBePlaygroundConfiguration } from "../AutoBePlaygroundConfiguration";
import { AutoBePlaygroundGlobal } from "../AutoBePlaygroundGlobal";

export namespace AutoBePlaygroundSetupWizard {
  export async function schema(): Promise<void> {
    if (AutoBePlaygroundGlobal.testing === false)
      throw new Error(
        "Error on SetupWizard.schema(): unable to reset database in non-test mode.",
      );
    const execute = (type: string) => (argv: string) =>
      cp.execSync(`prisma migrate ${type} --schema=prisma/schema ${argv}`, {
        cwd: AutoBePlaygroundConfiguration.ROOT,
        stdio: ["pipe", process.stdout, process.stderr],
      });
    execute("reset")("--force");
    execute("dev")("--name init");
  }

  export async function seed(): Promise<void> {}
}
