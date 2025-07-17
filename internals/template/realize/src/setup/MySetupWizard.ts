import cp from "child_process";

import { MyConfiguration } from "../MyConfiguration";
import { MyGlobal } from "../MyGlobal";

export namespace MySetupWizard {
  export async function schema(): Promise<void> {
    if (MyGlobal.testing === false)
      throw new Error(
        "Error on SetupWizard.schema(): unable to reset database in non-test mode.",
      );
    const execute = (type: string) => (argv: string) =>
      cp.execSync(`npx prisma migrate ${type} --schema=prisma/schema ${argv}`, {
        stdio: "ignore",
        cwd: MyConfiguration.ROOT,
      });
    execute("reset")("--force");
    execute("dev")("--name init");
  }

  export async function seed(): Promise<void> {}
}
