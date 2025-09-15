import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeHistory, IAutoBeHackathonSession } from "@autobe/interface";
import { ArrayUtil } from "@nestia/e2e";
import OpenAI from "openai";

import { StringUtil } from "../../../../../packages/utils/src";
import { AutoBeHackathonGlobal } from "../../AutoBeHackathonGlobal";
import { AutoBeHackathonSessionProvider } from "../sessions/AutoBeHackathonSessionProvider";

export namespace AutoBeHackathonSessionReporter {
  export const report = async (): Promise<Record<string, string>> => {
    const records =
      await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.findMany({
        where: {
          review_article_url: {
            not: null,
          },
          deleted_at: null,
        },
        orderBy: { id: "asc" },
        ...AutoBeHackathonSessionProvider.summarize.select(),
      });
    const summaries: IAutoBeHackathonSession.ISummary[] = records.map(
      AutoBeHackathonSessionProvider.summarize.transform,
    );

    const output: Record<string, string> = {
      "README.md": index(summaries),
    };
    await ArrayUtil.asyncForEach(summaries, async (s, i) => {
      console.log(`Processing session: ${i + 1} of ${records.length}`);
      const detailed: IAutoBeHackathonSession =
        AutoBeHackathonSessionProvider.json.transform(
          await AutoBeHackathonGlobal.prisma.autobe_hackathon_sessions.findFirstOrThrow(
            {
              where: {
                id: s.id,
              },
              ...AutoBeHackathonSessionProvider.json.select(),
            },
          ),
        );
      const agent: AutoBeAgent<"chatgpt"> = new AutoBeAgent({
        model: "chatgpt",
        vendor: {
          api: new OpenAI({ apiKey: "********" }),
          model: s.model,
        },
        compiler: (listener) => new AutoBeCompiler(listener),
        histories: detailed.histories,
      });
      const files: Record<string, string> = await agent.getFiles({
        dbms: "sqlite",
      });
      for (const [key, value] of Object.entries(files))
        output[`${s.id}/${key}`] = value;
      output[`${s.id}/README.md`] = at(detailed);
    });
    return output;
  };

  const index = (sessions: IAutoBeHackathonSession.ISummary[]): string => {
    const row = (s: IAutoBeHackathonSession.ISummary, i: number): string =>
      [
        `[${i + 1}](./${s.id})`,
        `[${s.participant.name}](./${s.id})`,
        `[\`${s.model}\`](./${s.id})`,
        `[\`${s.phase}\`](./${s.id})`,
        `[wrtnlabs/autobe/discussions/${s.review_article_url?.split("https://github.com/wrtnlabs/autobe/discussions/")[1]?.split("#")[0]}](${s.review_article_url})`,
      ].join(" | ");
    return StringUtil.trim`
      # AutoBe Hackathon 2025

      > https://autobe.dev/docs/hackathon/

      Generation results of AutoBe Hackathon 2025 participants.
      
       No | Participant | Model | Phase | Review Article 
      ----|-------------|-------|-------|----------------
      ${sessions.map(row).join("\n")},
    `;
  };

  const at = (session: IAutoBeHackathonSession): string => {
    const history = (h: AutoBeHistory, i: number): string => {
      const title = (str: string): string => `## ${i + 1}. ${str}`;
      if (h.type === "userMessage")
        return StringUtil.trim`
          ${title("User Message")}

          ${h.contents
            .map((c) => {
              if (c.type === "file")
                return c.file.type === "base64"
                  ? "BASE 64 FILE"
                  : "OPENAI STORE FILE: " + c.file.id;
              else if (c.type === "image")
                return c.image.type === "base64"
                  ? "BASE 64 IMAGE"
                  : c.image.url;
              else if (c.type === "audio") return "AUDIO FILE";
              return c.text
                .split("\n")
                .map((s) => `> ${s}`)
                .join("\n");
            })
            .join("\n\n")}
        `;
      else if (h.type === "assistantMessage")
        return StringUtil.trim`
          ${title("Assistant Message")}

          ${h.text
            .split("\n")
            .map((s) => `> ${s}`)
            .join("\n")}
        `;
      else if (h.type === "analyze")
        return StringUtil.trim`
          ${title("Analyze")}

          ### Roles

          Name | Kind | Description
          -----|------|--------------
          ${h.roles.map((r) => `${r.name} | ${r.kind} | ${r.description} `).join("\n")}

          ### Documents

          ${h.files.map((f) => `- [\`docs/analysis/${f.filename}\`](./docs/analysis/${f.filename})`).join("\n")}
        `;
      else if (h.type === "prisma") {
        let value: string = StringUtil.trim`
          ${title("Prisma")}

          - document: [\`ERD.md\`](./docs/ERD.md)
          - namespaces: ${h.result.data.files.length.toLocaleString()}
          - tables: ${h.result.data.files
            .map((f) => f.models)
            .flat()
            .length.toLocaleString()}
          - success: ${h.result.success}
        `;
        if (h.result.success === false)
          value +=
            "\n\n" +
            StringUtil.trim`
              \`\`\`json
              ${JSON.stringify(h.result.errors, null, 2)}
              \`\`\`
            `;
        return value;
      } else if (h.type === "interface")
        return StringUtil.trim`
          ${title("Interface")}

          - operations: ${h.document.operations.length.toLocaleString()}
          - schemas: ${Object.keys(h.document.components.schemas).length.toLocaleString()}
        `;
      else if (h.type === "test") {
        let value: string = StringUtil.trim`
          ${title("Test")}

          - functions: ${h.files.length.toLocaleString()}
          - success: ${h.compiled.type === "success"}
        `;
        if (h.compiled.type === "failure")
          value +=
            "\n\n" +
            StringUtil.trim`
              \`\`\`json
              ${JSON.stringify(h.compiled.diagnostics, null, 2)}
              \`\`\`
            `;
        return value;
      } else if (h.type === "realize") {
        let value: string = StringUtil.trim`
          ${title("Realize")}

          - functions: ${h.functions.length.toLocaleString()}
          - success: ${h.compiled.type === "success"}
        `;
        if (h.compiled.type === "failure")
          value +=
            "\n\n" +
            StringUtil.trim`
              \`\`\`json
              ${JSON.stringify(h.compiled.diagnostics, null, 2)}
              \`\`\`
            `;
        return value;
      }
      h satisfies never;
      throw new Error("Unknown history type");
    };
    const outline: string = StringUtil.trim`
      # AutoBe Hackathon 2025 Session

      Generation Result of AutoBe Hackathon 2025 participant.
      
      - id: [${session.id}](./${session.id})
      - participant: ${session.participant.name} (${session.participant.email})
      - model: \`${session.model}\`
      - phase: \`${session.phase}\`
      - title: ${session.title}
      - review: ${session.review_article_url}
    `;
    return [outline, ...session.histories.map(history)].join("\n\n");
  };
}
