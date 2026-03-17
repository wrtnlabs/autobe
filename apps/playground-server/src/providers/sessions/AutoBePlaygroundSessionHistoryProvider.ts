import { AutoBeHistory } from "@autobe/interface";
import { Prisma } from "@prisma/sdk";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { IEntity } from "../../structures/IEntity";

export namespace AutoBePlaygroundSessionHistoryProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_playground_session_historiesGetPayload<
        ReturnType<typeof select>
      >,
    ): AutoBeHistory => JSON.parse(input.data);
    export const select = () =>
      ({
        select: {
          data: true,
          created_at: true,
        },
      }) satisfies Prisma.autobe_playground_session_historiesFindManyArgs;
  }

  export const getAll = async (props: {
    session: IEntity;
  }): Promise<AutoBeHistory[]> => {
    const data =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_session_histories.findMany(
        {
          where: { autobe_playground_session_id: props.session.id },
          orderBy: { created_at: "asc" },
        },
      );
    return data.map(json.transform);
  };

  export const create = async (props: {
    session: IEntity;
    connection: IEntity;
    history: AutoBeHistory;
  }): Promise<void> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_session_histories.create(
      {
        data: {
          id: v7(),
          autobe_playground_session_id: props.session.id,
          autobe_playground_session_connection_id: props.connection.id,
          type: props.history.type,
          data: JSON.stringify(props.history),
          created_at: new Date(),
        },
      },
    );
  };
}
