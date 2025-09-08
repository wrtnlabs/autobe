import { AutoBeHistory } from "@autobe/interface";
import { Prisma } from "@prisma/client";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";

export namespace AutoBeHackathonSessionHistoryProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_session_historiesGetPayload<
        ReturnType<typeof select>
      >,
    ): AutoBeHistory => input.data as any as AutoBeHistory;
    export const select = () =>
      ({
        select: {
          data: true,
        },
      }) satisfies Prisma.autobe_hackathon_session_historiesFindManyArgs;
  }

  export const getAll = async (props: {
    session: IEntity;
  }): Promise<AutoBeHistory[]> => {
    const data =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_histories.findMany(
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
    history: AutoBeHistory;
  }): Promise<void> => {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_histories.create(
      {
        data: {
          id: v7(),
          autobe_hackathon_session_id: props.session.id,
          autobe_hackathon_session_connection_id: props.connection.id,
          type: props.history.type,
          data: props.history as any as Prisma.InputJsonValue,
          created_at: new Date(),
        },
      },
    );
  };
}
