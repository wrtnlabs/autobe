import HackathonApi from "@autobe/hackathon-api";
import {
  AutoBePhase,
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { RandomGenerator, TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { AutoBeHackathonProvider } from "../../../../src/providers/AutoBeHackathonProvider";
import { AutoBeHackathonParticipantProvider } from "../../../../src/providers/actors/AutoBeHackathonParticipantProvider";
import { TestGlobal } from "../../../TestGlobal";

export const test_api_hackathon_participant_session_review_limit = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const hackathon: IAutoBeHackathon = await AutoBeHackathonProvider.get(
    TestGlobal.CODE,
  );
  const participant: IAutoBeHackathonParticipant.IAuthorized =
    await AutoBeHackathonParticipantProvider.join({
      hackathon,
      body: {
        email: RandomGenerator.alphabets(10) + "@autobe.dev",
        name: "Tester",
        password: "1234",
      },
    });
  connection.headers ??= {};
  connection.headers.Authorization = participant.setHeaders.Authorization;

  try {
    await process(connection);
  } finally {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.delete({
      where: { id: participant.id },
    });
    delete connection.headers;
  }
};

const process = async (connection: HackathonApi.IConnection) => {
  const go = async (phase: null | AutoBePhase, success: boolean) => {
    const session: IAutoBeHackathonSession =
      await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
        connection,
        TestGlobal.CODE,
        {
          model: "qwen/qwen3-235b-a22b-2507",
          timezone: "Asia/Seoul",
        },
      );
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.update(
      {
        where: {
          autobe_hackathon_session_id: session.id,
        },
        data: {
          phase,
        },
      },
    );
    const review = () =>
      HackathonApi.functional.autobe.hackathon.participants.sessions.review(
        connection,
        TestGlobal.CODE,
        session.id,
        {
          review_article_url: typia.random<string & tags.Format<"uri">>(),
        },
      );
    if (success) {
      await review();
      const reload: IAutoBeHackathonSession =
        await HackathonApi.functional.autobe.hackathon.participants.sessions.at(
          connection,
          TestGlobal.CODE,
          session.id,
        );
      TestValidator.equals("completed_at", true, reload.completed_at !== null);
      TestValidator.equals(
        "review_article_url",
        true,
        !!reload.review_article_url,
      );
    } else await TestValidator.httpError("review limit", 422, review);
  };
  await go(null, false);
  await go("analyze", false);
  await go("prisma", false);
  await go("interface", true);
  await go("test", true);
  await go("realize", true);
};
