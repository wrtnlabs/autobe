import HackathonApi from "@autobe/hackathon-api";
import {
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { ArrayUtil, TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { TestGlobal } from "../../../TestGlobal";
import { test_api_hackathon_participant_join } from "./test_api_hackathon_participant_join";

export const test_api_hackathon_participant_session_create_limit = async (
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
  // QWEN3
  await ArrayUtil.asyncRepeat(11, async (i) => {
    const create = async () => {
      await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
        connection,
        TestGlobal.CODE,
        {
          model: "qwen/qwen3-next-80b-a3b-instruct",
          timezone: "Asia/Seoul",
        },
      );
    };
    if (i !== 10) await create();
    else await TestValidator.httpError("qwen3 exceed", 422, create);
  });

  // GPT-4.1-MINI
  const minis: IAutoBeHackathonSession[] = (
    await ArrayUtil.asyncRepeat(4, async (i) => {
      const create = async () => {
        return await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
          connection,
          TestGlobal.CODE,
          {
            model: "openai/gpt-4.1-mini",
            timezone: "Asia/Seoul",
          },
        );
      };
      if (i !== 3) return await create();
      await TestValidator.httpError("mini exceed", 422, create);
      return null;
    })
  ).filter((v) => v !== null);

  const big = async () => {
    await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
      connection,
      TestGlobal.CODE,
      {
        model: "openai/gpt-4.1",
        timezone: "Asia/Seoul",
      },
    );
  };
  await TestValidator.httpError("no-review", 422, big);
  await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.updateMany({
    where: {
      id: {
        in: minis.map((m) => m.id),
      },
    },
    data: {
      review_article_url: typia.random<string & tags.Format<"uri">>(),
      completed_at: new Date(),
    },
  });
  await big();
};
