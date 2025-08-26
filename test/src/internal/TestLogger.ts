import { AutoBeEvent, IAutoBeTokenUsageJson } from "@autobe/interface";
import typia from "typia";

export namespace TestLogger {
  export const event = (start: Date, event: AutoBeEvent): void => {
    const time: number = (new Date().getTime() - start.getTime()) / 60_000;
    const content: string[] = [`${event.type}: ${time.toLocaleString()} mins`];
    if (typia.is<ProgressEvent>(event))
      content.push(`  - progress: (${event.completed} of ${event.total})`);
    if (typia.is<TokenUsageEvent>(event))
      content.push(
        `  - token usage: (input: ${event.tokenUsage.input.total.toLocaleString()}, cached: ${event.tokenUsage.input.cached.toLocaleString()}, output: ${event.tokenUsage.output.total.toLocaleString()})`,
      );
    if (event.type === "consentFunctionCall")
      content.push(
        `  - consent: ${event.assistantMessage} -> ${event.result?.type === "consent" ? event.result.message : "null"} `,
      );
    if (event.type === "jsonValidateError")
      content.push(
        "  - typia.validate<T>()",
        ...event.result.errors.map((v) => `    - ${v.path}: ${v.expected}`),
      );
    if (event.type === "jsonParseError")
      content.push(`  - invalid json: ${event.errorMessage}`);
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
