import HackathonApi from "@autobe/hackathon-api";
import { IAutoBeHackathonSession } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { TestGlobal } from "../../TestGlobal";

export const test_api_hackathon_session_review = async (
  connection: HackathonApi.IConnection,
): Promise<void> => {
  await HackathonApi.functional.autobe.hackathon.participants.authenticate.login(
    connection,
    TestGlobal.CODE,
    {
      email: "samchon@wrtn.io",
      password: "1234",
    },
  );

  const hackathon: IAutoBeHackathonSession =
    await HackathonApi.functional.autobe.hackathon.participants.sessions.create(
      connection,
      TestGlobal.CODE,
      {
        title: "My First Session",
        model: "openai/gpt-4.1-mini",
        timezone: "Asia/Seoul",
      } satisfies IAutoBeHackathonSession.ICreate,
    );
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
