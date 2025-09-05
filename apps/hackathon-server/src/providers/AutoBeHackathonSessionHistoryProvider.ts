import { AutoBeHistory } from "@autobe/interface";
import { Prisma } from "@prisma/client";

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
}
