import { AutoBeEventSnapshot } from "@autobe/interface";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";

export namespace AutoBeHackathonSessionEventProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_session_eventsGetPayload<
        ReturnType<typeof select>
      >,
    ): AutoBeEventSnapshot => JSON.parse(input.data);
    export const select = () =>
      ({
        select: {
          data: true,
        },
      }) satisfies Prisma.autobe_hackathon_session_eventsFindManyArgs;
  }

  export const getAll = async (props: {
    session: IEntity;
  }): Promise<AutoBeEventSnapshot[]> => {
    const data =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_events.findMany(
        {
          where: {
            autobe_hackathon_session_id: props.session.id,
          },
          orderBy: {
            created_at: "asc",
          },
        },
      );
    return data.map(json.transform);
  };

  export const create = async (props: {
    session: IEntity;
    connection: IEntity;
    snapshot: AutoBeEventSnapshot;
  }): Promise<void> => {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_events.create({
      data: {
        id: v4(),
        autobe_hackathon_session_id: props.session.id,
        autobe_hackathon_session_connection_id: props.connection.id,
        type: props.snapshot.event.type,
        data: JSON.stringify(props.snapshot),
        created_at: new Date(),
      },
    });
  };
}
