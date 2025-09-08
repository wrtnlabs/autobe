import cp from "child_process";

import { AutoBeHackathonParticipantSeeder } from "./AutoBeHackathonParticipantSeeder";
import { AutoBeHackathonSeeder } from "./AutoBeHackathonSeeder";
import { AutoBeHackathonSessionSeeder } from "./AutoBeHackathonSessionSeeder";

export namespace AutoBeHackathonSetupWizard {
  export const seed = async (): Promise<void> => {
    const hackathon = await AutoBeHackathonSeeder.seed();
    const participants = await AutoBeHackathonParticipantSeeder.seed(hackathon);
    await AutoBeHackathonSessionSeeder.seed({ hackathon, participants });
  };

  export const schema = (): void => {
    const execute = (type: string) => (argv: string) =>
      cp.execSync(`npx prisma migrate ${type} --schema=prisma/schema ${argv}`, {
        stdio: "inherit",
      });
    execute("reset")("--force");
    execute("dev")("--name init");
  };
}
