// import { IMicroAgenticaHistoryJson } from "@agentica/core";
import {
  AutoBeEvent,
  IAutoBeTokenUsageJson,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";
import typia from "typia";

export namespace ArchiveLogger {
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
        `  - log10 of input token usage: ${Math.log10(
          event.tokenUsage.input.total,
        )}`,
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
        `    - function: ${event.function}`,
        `    - life: ${event.life}`,
        ...event.result.errors.map(
          (v) =>
            `      - path: ${v.path}\n` +
            `      - expected: ${v.expected}\n` +
            `      - description: ${JSON.stringify(v.description ?? "no description")}\n` +
            `      - value: ${JSON.stringify(v.value)}`,
        ),
      );
    else if (event.type === "jsonParseError")
      content.push(
        `  - source: ${event.source}`,
        `  - function: ${event.function}`,
        `  - invalid json: ${event.errorMessage}`,
        `  - life: ${event.life}`,
        `  - arguments: ${event.arguments}`,
      );
    else if (event.type === "preliminary") {
      content.push(
        `  - source: ${event.source}`,
        `  - source_id: ${event.source_id}`,
        `  - function: ${event.function}`,
        `  - trial: ${event.trial}`,
        `  - existing: ${event.existing.length}, ${JSON.stringify(event.existing)}`,
        `  - requested: ${event.requested.length}, ${JSON.stringify(event.requested)}`,
      );
    }
    // VALIDATIONS
    else if (event.type === "analyzeScenario")
      content.push(`  - prefix: ${event.prefix}`);
    else if (event.type === "realizeCorrect")
      content.push(
        `  - kind: ${event.kind}`,
        `  - function: ${event.function.type}`,
        `  - file: ${event.function.location}`,
      );
    else if (event.type === "realizeValidate")
      content.push(
        ...printCompiled(event.result, Object.keys(event.files).length),
      );
    else if (event.type === "testCorrect")
      content.push(`  - kind: ${event.kind}`);
    else if (event.type === "interfaceComplement")
      content.push(
        `  - missed: ${event.missed.join(", ")}`,
        `  - filled: ${Object.keys(event.schemas).join(", ")}`,
      );
    else if (event.type === "interfaceSchemaReview")
      content.push(
        `  - kind: ${event.kind}`,
        `  - fixed: ${Object.keys(event.content).length}`,
      );
    else if (event.type === "interfaceSchemaRename")
      content.push(
        `  - refactors:`,
        ...event.refactors.map((r) => `    - ${r.from} -> ${r.to}`),
      );
    // GENERATIONS
    else if (event.type === "prismaComponent")
      content.push(
        `  - tables: ${event.components.map((c) => c.tables).flat().length}`,
      );
    else if (event.type === "prismaSchema")
      content.push(
        `  - schemas: ${event.models.map((m) => m.name).join(", ")}`,
      );
    else if (event.type === "interfaceEndpoint")
      content.push(`  - endpoints: ${event.endpoints.length}`);
    else if (event.type === "interfaceOperation")
      content.push(
        `  - operations: ${event.operations.map((o) => `${o.method.toUpperCase()} ${o.path}`)}`,
      );
    else if (event.type === "interfaceSchema")
      content.push(`  - schemas: ${Object.keys(event.schemas).join(", ")}`);
    else if (event.type === "realizePlan")
      content.push(`  - plan: ${event.plans[0]?.type}`);
    else if (event.type === "realizeWrite")
      content.push(`  - function: ${event.function.type}`);
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
