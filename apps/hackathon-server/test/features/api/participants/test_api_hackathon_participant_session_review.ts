import HackathonApi from "@autobe/hackathon-api";
import {
  AutoBePhase,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_join } from "./test_api_hackathon_participant_join";

export const test_api_hackathon_participant_session_review = async (
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

const process = async (connection: HackathonApi.IConnection): Promise<void> => {
  for (const phase of typia.misc.literals<AutoBePhase>()) {
    const hackathon: IAutoBeHackathonSession =
      await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
        connection,
        TestGlobal.CODE,
        {
          title: "My First Session",
          model: "qwen/qwen3-next-80b-a3b-instruct",
          timezone: "Asia/Seoul",
        } satisfies IAutoBeHackathonSession.ICreate,
      );
    await AutoBeHackathonGlobal.prisma.autobe_hackathon_session_aggregates.update(
      {
        where: { autobe_hackathon_session_id: hackathon.id },
        data: { phase },
      },
    );

    const review = async () => {
      await HackathonApi.functional.autobe.hackathon.participants.sessions.review(
        connection,
        TestGlobal.CODE,
        hackathon.id,
        {
          review_article_url: "https://example.com/review-article",
        },
      );
      const read: IAutoBeHackathonSession =
        await HackathonApi.functional.autobe.hackathon.participants.sessions.at(
          connection,
          TestGlobal.CODE,
          hackathon.id,
        );
      TestValidator.equals(
        "id",
        read.review_article_url,
        "https://example.com/review-article",
      );
    };
    if (phase === "analyze" || phase === "prisma")
      await TestValidator.error(phase, review);
    else await review();
  }
};
