import HackathonApi from "@autobe/hackathon-api";
import {
  IAutoBeHackathon,
  IAutoBeHackathonParticipant,
  IAutoBeHackathonSession,
} from "@autobe/interface";
import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { AutoBeHackathonGlobal } from "../../../../src/AutoBeHackathonGlobal";
import { AutoBeHackathonProvider } from "../../../../src/providers/AutoBeHackathonProvider";
import { AutoBeHackathonParticipantProvider } from "../../../../src/providers/actors/AutoBeHackathonParticipantProvider";
import { TestGlobal } from "../../../TestGlobal";

export const test_api_hackathon_participant_session_create_limit = async (
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
  // QWEN3
  await ArrayUtil.asyncRepeat(11, async (i) => {
    const create = async () => {
      // try {
      await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
        connection,
        TestGlobal.CODE,
        {
          model: "qwen/qwen3-235b-a22b-2507",
          timezone: "Asia/Seoul",
        },
      );
      // } catch (error) {
      //   if (error instanceof HackathonApi.HttpError) {
      //     console.log(error.message);
      //   }
      //   throw error;
      // }
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
