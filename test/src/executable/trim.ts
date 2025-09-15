import { StringUtil } from "@autobe/utils";
import { RandomGenerator } from "@nestia/e2e";
import typia, { tags } from "typia";
import { v7 } from "uuid";

const session = {
  id: v7(),
  participant: {
    name: RandomGenerator.name(),
    email: typia.random<string & tags.Format<"email">>(),
  },
  model: "openai/gpt-4.1",
  phase: "realize",
  title: "Some title",
  review_article_url: "https://example.com",
};

export namespace A {
  export namespace B {
    export const value: string = StringUtil.trim`
        ${"The Title"}

      # AutoBe Hackathon 2025 Session

      Generation Result of AutoBe Hackathon 2025 participant.
      
      - id: [${session.id}](./${session.id})
      - participant: ${session.participant.name} (${session.participant.email})
      - model: \`${session.model}\`
      - phase: \`${session.phase}\`
      - title: ${session.title}
      - review: ${session.review_article_url}
      ${[1, 2, 3, 4].map((i) => `  - ${i}`).join("\n")}
    `;
  }
}
console.log(A.B.value);
