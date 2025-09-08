import {
  IAutoBeHackathonSession,
  IAutobeHackathon,
  IAutobeHackathonParticipant,
  IPage,
} from "@autobe/hackathon-api";
import { IAutoBeTokenUsageJson } from "@autobe/interface";
import { Prisma } from "@prisma/client";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { PaginationUtil } from "../utils/PaginationUtil";
import { AutoBeHackathonParticipantProvider } from "./AutoBeHackathonParticipantProvider";
import { AutoBeHackathonSessionEventProvider } from "./AutoBeHackathonSessionEventProvider";
import { AutoBeHackathonSessionHistoryProvider } from "./AutoBeHackathonSessionHistoryProvider";

export namespace AutoBeHackathonSessionProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_hackathon_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBeHackathonSession => ({
      id: input.id,
      participant: AutoBeHackathonParticipantProvider.json.transform(
        input.participant,
      ),
      model: input.model,
      state: input.aggregate!.state as any,
      token_usage: input.aggregate!.token_usage as any as IAutoBeTokenUsageJson,
      histories: input.histories.map(
        AutoBeHackathonSessionHistoryProvider.json.transform,
      ),
      event_snapshots: input.events.map(
        AutoBeHackathonSessionEventProvider.json.transform,
      ),
      review_article_url: input.review_article_url,
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          participant: AutoBeHackathonParticipantProvider.json.select(),
          histories: AutoBeHackathonSessionHistoryProvider.json.select(),
          events: AutoBeHackathonSessionEventProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_hackathon_sessionsFindManyArgs;
  }
  export namespace summarize {
    export const transform = (
      input: Prisma.autobe_hackathon_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBeHackathonSession.ISummary => ({
      id: input.id,
      model: input.model,
      participant: AutoBeHackathonParticipantProvider.json.transform(
        input.participant,
      ),
      state: input.aggregate!.state as any,
      review_article_url: input.review_article_url,
      token_usage: input.aggregate!.token_usage as any as IAutoBeTokenUsageJson,
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          participant: AutoBeHackathonParticipantProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_hackathon_sessionsFindManyArgs;
  }

  export const index = (props: {
    hackathon: IAutobeHackathon;
    participant: IAutobeHackathonParticipant;
    body: IPage.IRequest;
  }): Promise<IPage<IAutoBeHackathonSession.ISummary>> =>
    PaginationUtil.paginate({
      schema: AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions,
      payload: summarize.select(),
      transform: summarize.transform,
    })({
      where: {
        autobe_hackathon_id: props.hackathon.id,
        autobe_hackathon_participant_id: props.participant.id,
      },
      orderBy: [
        {
          created_at: "desc",
        },
      ],
    } satisfies Prisma.autobe_hackathon_sessionsFindManyArgs)(props.body);

  export const find = async <
    Payload extends Prisma.autobe_hackathon_sessionsFindFirstArgs,
  >(props: {
    hackathon: IAutobeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
    payload: Payload;
  }) => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.findFirstOrThrow(
        {
          where: {
            autobe_hackathon_id: props.hackathon.id,
            autobe_hackathon_participant_id: props.participant.id,
            id: props.id,
          },
          ...props.payload,
        },
      );
    return record as Prisma.autobe_hackathon_sessionsGetPayload<Payload>;
  };

  export const at = async (props: {
    hackathon: IAutobeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
  }): Promise<IAutoBeHackathonSession> => {
    const record = await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: json.select(),
    });
    return json.transform(record);
  };

  export const review = async (props: {
    hackathon: IAutobeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
    body: IAutoBeHackathonSession.IReview;
  }): Promise<void> => {
    await find({
      hackathon: props.hackathon,
      participant: props.participant,
      id: props.id,
      payload: { select: { id: true } },
    });
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.update({
      where: { id: props.id },
      data: { review_article_url: props.body.review_article_url },
    });
  };
}
