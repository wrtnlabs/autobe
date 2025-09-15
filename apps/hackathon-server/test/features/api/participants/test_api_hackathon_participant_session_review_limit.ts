import HackathonApi from "@autobe/hackathon-api";
import {
  AutoBePhase,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_join } from "./test_api_hackathon_participant_join";

export const test_api_hackathon_participant_session_review_limit = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  const participant: IAutoBeHackathonParticipant =
    await test_api_hackathon_participant_join(connection);
  try {
    await process(connection);
  } finally {
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_participants.delete({
      where: { id: participant.id },
    });
  }
};

const process = async (connection: HackathonApi.IConnection) => {
  const go = async (phase: null | AutoBePhase, success: boolean) => {
    const session: IAutoBeHackathonSession =
      await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
        connection,
        TestGlobal.CODE,
        {
          model: "qwen/qwen3-next-80b-a3b-instruct",
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
