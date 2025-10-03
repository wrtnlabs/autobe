import {
  AutoBeEvent,
  IAutoBeTokenUsageJson,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
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
    // FUNCTION CALLING
    if (event.type === "consentFunctionCall")
      content.push(
        `  - consent: ${event.assistantMessage} -> ${event.result?.type === "consent" ? event.result.message : "null"} `,
      );
    else if (event.type === "jsonValidateError")
      content.push(
        "  - typia.validate<T>()",
        `    - source: ${event.source}`,
        `    - life: ${event.life}`,
        ...event.result.errors.map(
          (v) =>
            `    - ${v.path}: ${v.expected} -> ${JSON.stringify(v.description ?? "no description")}\n` +
            `    - ${JSON.stringify(v.value)}`,
        ),
      );
    else if (event.type === "jsonParseError")
      content.push(
        `  - invalid json: ${event.errorMessage}`,
        `  - life: ${event.life}`,
        `  - arguments: ${event.arguments}`,
      );
    // VALIDATIONS
    else if (event.type === "realizeValidate")
      content.push(
        ...printCompiled(event.result, Object.keys(event.files).length),
      );

    // PRINT
    console.log(content.join("\n"));
  };

  const printCompiled = (
    result: IAutoBeTypeScriptCompileResult,
    total: number,
  ): string[] => {
    const o: string[] = [`  - result: ${result.type}`];
    if (result.type === "exception") return o;
    const success: number =
      result.type === "success"
        ? total
        : total - new Set(result.diagnostics.map((d) => d.file)).size;
    o.push(`  - success: ${success} of ${total}`);
    return o;
  };
}

interface TokenUsageEvent {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
interface ProgressEvent {
  total: number;
  completed: number;
}
