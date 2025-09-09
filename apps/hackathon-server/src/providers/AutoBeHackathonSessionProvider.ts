import { AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBeHackathonModel,
  IAutoBeHackathon,
  IAutoBeHackathonSession,
  IAutobeHackathonParticipant,
  IPage,
} from "@autobe/hackathon-api";
import { IAutoBeTokenUsageJson } from "@autobe/interface";
import { Prisma } from "@prisma/client";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBeHackathonGlobal } from "../AutoBeHackathonGlobal";
import { IEntity } from "../structures/IEntity";
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
      model: typia.assert<AutoBeHackathonModel>(input.model),
      timezone: input.timezone,
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
      model: typia.assert<AutoBeHackathonModel>(input.model),
      timezone: input.timezone,
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
    hackathon: IAutoBeHackathon;
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
    hackathon: IAutoBeHackathon;
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
    hackathon: IAutoBeHackathon;
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
    hackathon: IAutoBeHackathon;
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

  export const create = async (props: {
    hackathon: IEntity;
    participant: IEntity;
    body: IAutoBeHackathonSession.ICreate;
  }): Promise<IAutoBeHackathonSession.ISummary> => {
    const record =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.create({
        data: {
          id: v7(),
          autobe_hackathon_id: props.hackathon.id,
          autobe_hackathon_participant_id: props.participant.id,
          model: props.body.model,
          timezone: props.body.timezone,
          title: props.body.title ?? null,
          created_at: new Date(),
          completed_at: null,
          review_article_url: null,
          aggregate: {
            create: {
              id: v7(),
              state: null,
              enabled: true,
              token_usage: new AutoBeTokenUsage().toJSON() as any,
            },
          },
        },
        ...json.select(),
      });
    return summarize.transform(record);
  };

  export const update = async (props: {
    hackathon: IAutoBeHackathon;
    participant: IAutobeHackathonParticipant;
    id: string;
    body: IAutoBeHackathonSession.IUpdate;
  }): Promise<void> => {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.update({
      where: {
        id: props.id,
        autobe_hackathon_id: props.hackathon.id,
        autobe_hackathon_participant_id: props.participant.id,
      },
      data: {
        title: props.body.title,
      },
    });
  };
}
