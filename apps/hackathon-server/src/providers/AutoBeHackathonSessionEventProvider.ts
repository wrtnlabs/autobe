import { AutoBeEventSnapshot } from "@autobe/interface";
import { Prisma } from "@prisma/client";

export namespace AutoBeHackathonSessionEventProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_session_eventsGetPayload<
        ReturnType<typeof select>
      >,
    ): AutoBeEventSnapshot => input.data as any as AutoBeEventSnapshot;
    export const select = () =>
      ({
        select: {
          data: true,
        },
      }) satisfies Prisma.autobe_hackathon_session_eventsFindManyArgs;
  }
}
