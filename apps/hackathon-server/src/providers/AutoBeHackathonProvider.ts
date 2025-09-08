import { IAutoBeHackathon } from "@autobe/hackathon-api";
import { Prisma } from "@prisma/client";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";

export namespace AutoBeHackathonProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathonsGetPayload<ReturnType<typeof select>>,
    ): IAutoBeHackathon => ({
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

  export const get = async (code: string): Promise<IAutoBeHackathon> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathons.findFirstOrThrow({
        where: {
          code,
        },
        ...json.select(),
      });
    return json.transform(record);
  };

  export const create = async (body: IAutoBeHackathon.ICreate) => {
    const record = await AutoBeHackathonGlobal.prisma.autobe_hackathons.create({
      data: {
        id: v7(),
        code: body.code,
        name: body.name,
        opened_at: new Date(body.opened_at),
        closed_at: new Date(body.closed_at),
        created_at: new Date(),
      },
      ...json.select(),
    });
    return json.transform(record);
  };
}
