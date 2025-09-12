import { AutoBeEvent, IAutoBeTokenUsageJson } from "@autobe/interface";
import { IPointer, Pair, sleep_for } from "tstl";
import typia from "typia";

export namespace TestLogger {
  export const event = (start: Date, event: AutoBeEvent): void => {
    // DEFAULT TITLE
    const time = (prev: Date) =>
      ((new Date().getTime() - prev.getTime()) / 60_000).toLocaleString() +
      " mins";
    const content: string[] = [`${event.type}: ${time(start)}`];

    // BASIC TYPES
    if (typia.is<ProgressEvent>(event))
      content.push(`  - progress: (${event.completed} of ${event.total})`);
    if (typia.is<TokenUsageEvent>(event))
      content.push(
        `  - token usage: (input: ${event.tokenUsage.input.total.toLocaleString()}, cached: ${event.tokenUsage.input.cached.toLocaleString()}, output: ${event.tokenUsage.output.total.toLocaleString()})`,
      );
    // SPECIFICATIONS
    if (event.type === "consentFunctionCall")
      content.push(
        `  - consent: ${event.assistantMessage} -> ${event.result?.type === "consent" ? event.result.message : "null"} `,
      );
    else if (event.type === "jsonValidateError")
      content.push(
        "  - typia.validate<T>()",
        `    - source: ${event.source}`,
        ...event.result.errors.map(
          (v) =>
            `    - ${v.path}: ${v.expected} (${JSON.stringify(v.value)}) -> ${JSON.stringify(v.description ?? "no description")}`,
        ),
      );
    else if (event.type === "jsonParseError")
      content.push(`  - invalid json: ${event.errorMessage}`);
    // VENDOR RESPONSE
    else if (event.type === "vendorResponse") {
      content.push(`  - source ${event.source}`);
      content.push(`  - id: ${event.id}`);

      const t1: Date = new Date();
      const t2: IPointer<Date> = { value: t1 };
      const completed: IPointer<boolean> = { value: false };
      const chunks: Pair<number, Date>[] = [];
      void (async () => {
        for await (const _c of event.stream) {
          const now: Date = new Date();
          chunks.push(new Pair(now.getTime() - t2.value.getTime(), now));
          t2.value = now;
        }
      })().catch(() => {});
      void (async () => {
        while (true) {
          await sleep_for(60_000);
          if (completed.value === true) break;
          console.log("Response streaming not completed yet");
          console.log(
            [
              `source: ${event.source}`,
              `id: ${event.id}`,
              `elapsed time: ${time(t1)}`,
              `chunk times: (max: ${Math.max(...chunks.map((c) => c.first))}, delayed: ${time(chunks.at(-1)?.second ?? t1)})`,
              `chunks (last 5 items): [${chunks
                .slice(-5)
                .map((c) => c.first)
                .join(", ")}]`,
            ]
              .map((s) => `  - ${s}`)
              .join("\n"),
          );
        }
      })().catch(() => {});
      event
        .join()
        .catch(() => {})
        .then(() => {
          completed.value = true;
          console.log(
            `Response chunk times (${event.source}, ${time(t1)}): (max: ${Math.max(...chunks.map((c) => c.first))})`,
          );
        });
    }

    // PRINT
    console.log(content.join("\n"));
  };
}

interface TokenUsageEvent {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
interface ProgressEvent {
  total: number;
  completed: number;
}
