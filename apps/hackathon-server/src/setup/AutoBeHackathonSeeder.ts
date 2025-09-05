import { v4 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";

export namespace AutoBeHackathonSeeder {
  export const seed = async () => {
    await AutoBeHackathonGlobal.prisma.autobe_hackathons.create({
      data: {
        id: v4(),
        code: "20250913",
        name: "AutoBe Hackathon 2025-09-13",
        created_at: new Date(),
        opened_at: new Date("2025-09-13T00:00:00.000+09:00"),
        closed_at: new Date("2025-09-15T00:00:00.000-07:00"),
      },
    });
  };
}
