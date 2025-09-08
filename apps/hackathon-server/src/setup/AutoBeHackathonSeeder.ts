import { IAutoBeHackathon } from "@autobe/hackathon-api";

import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonProvider } from "../providers/AutoBeHackathonProvider";

export namespace AutoBeHackathonSeeder {
  export const seed = async (): Promise<IAutoBeHackathon> => {
    return await AutoBeHackathonProvider.create({
      code: AutoBeHackathonConfiguration.CODE,
      name: "AutoBe Hackathon 2025-09-12",
      opened_at: new Date("2025-09-13T00:00:00.000+09:00").toISOString(),
      closed_at: new Date("2025-09-15T00:00:00.000-07:00").toISOString(),
    });
  };
}
