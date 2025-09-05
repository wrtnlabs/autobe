import { IAutobeHackathon } from "@autobe/hackathon-api";
import { Prisma } from "@prisma/client";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";

export namespace AutoBeHackathonProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathonsGetPayload<ReturnType<typeof select>>,
    ): IAutobeHackathon => ({
      id: input.id,
      code: input.code,
      name: input.name,
      created_at: input.created_at.toISOString(),
      opened_at: input.opened_at.toISOString(),
      closed_at: input.closed_at.toISOString(),
    });
    export const select = () =>
      ({}) satisfies Prisma.autobe_hackathonsFindManyArgs;
  }

  export const get = async (code: string): Promise<IAutobeHackathon> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathons.findFirstOrThrow({
        where: {
          code,
        },
        ...json.select(),
      });
    return json.transform(record);
  };
}
