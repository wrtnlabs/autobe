import { IAgenticaController, MicroAgenticaHistory } from "@agentica/core";
import { ILlmFunction } from "@samchon/openapi";
import { v7 } from "uuid";

/**
 * When models like Qwen3 return function calls as JSON text instead of
 * native function calling, this module parses and executes them to generate execute history.
 */
export namespace ParseTextFunctionCall {
  /**
   * Parsed individual function call
   */
  export interface IParsedFunctionCall {
    name: string;
    parameters: Record<string, unknown>;
  }

  /**
   * Parse result interface
   */
  export interface IResult {
    success: boolean;
    functionCalls: IParsedFunctionCall[];
    error?: string;
  }

  /**
   * Extracts function call patterns from JSON text.
   *
   * Supported patterns:
   * 1. Array format: [{name: "process", parameters: {...}}]
   * 2. Object format: {name: "process", parameters: {...}}
   * 3. JSON within markdown code blocks
   */
  export function parse(text: string): IResult {
    const jsonContent = extractJsonFromText(text);
    if (jsonContent === null) {
      return {
        success: false,
        functionCalls: [],
        error: "No valid JSON found in text",
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      return {
        success: false,
        functionCalls: [],
        error: `JSON parse error: ${(e as Error).message}`,
      };
    }

    const functionCalls = extractFunctionCalls(parsed);
    if (functionCalls.length === 0) {
      return {
        success: false,
        functionCalls: [],
        error: "No valid function call structure found",
      };
    }

    return {
      success: true,
      functionCalls,
    };
  }

  /**
   * Executes parsed function calls and creates MicroAgenticaHistory array.
   */
  export async function executeAndCreateHistories(props: {
    parsedCalls: IParsedFunctionCall[];
    controller: IAgenticaController.IClass;
  }): Promise<MicroAgenticaHistory[]> {
    const histories: MicroAgenticaHistory[] = [];

    for (const call of props.parsedCalls) {
      const func = findFunction(props.controller, call.name);
      if (func === null) continue;

      const executor = (
        props.controller.execute as Record<string, Function | undefined>
      )[call.name];
      if (typeof executor !== "function") continue;

      let value: unknown = undefined;
      let success = false;

      try {
        value = await executor(call.parameters);
        success = true;
      } catch (e) {
        value = { error: (e as Error).message };
        success = false;
      }

      const operation = {
        protocol: props.controller.protocol as "class",
        name: props.controller.name,
        function: func,
        controller: props.controller,
        toJSON: () => ({
          protocol: props.controller.protocol as "class",
          name: props.controller.name,
          function: func,
        }),
      };

      const historyJson = {
        id: v7(),
        created_at: new Date().toISOString(),
        type: "execute" as const,
        protocol: props.controller.protocol as "class",
        function: func.name,
        arguments: call.parameters,
        value,
        success,
      };

      const history = {
        ...historyJson,
        operation,
        toJSON: () => historyJson,
      } as unknown as MicroAgenticaHistory;

      histories.push(history);
    }

    return histories;
  }

  function extractJsonFromText(text: string): string | null {
    // Pattern 1: Markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Pattern 2: Direct JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }

    // Pattern 3: Direct JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }

    return null;
  }

  function extractFunctionCalls(parsed: unknown): IParsedFunctionCall[] {
    const calls: IParsedFunctionCall[] = [];

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const call = extractSingleCall(item);
        if (call) calls.push(call);
      }
    } else if (typeof parsed === "object" && parsed !== null) {
      const call = extractSingleCall(parsed);
      if (call) calls.push(call);
    }

    return calls;
  }

  function extractSingleCall(item: unknown): IParsedFunctionCall | null {
    if (typeof item !== "object" || item === null) return null;

    const obj = item as Record<string, unknown>;

    // Standard format: {name: "...", parameters: {...}}
    if (typeof obj.name === "string" && typeof obj.parameters === "object") {
      return {
        name: obj.name,
        parameters: (obj.parameters as Record<string, unknown>) ?? {},
      };
    }

    // Alternative format: {name: "...", arguments: {...}}
    if (typeof obj.name === "string" && typeof obj.arguments === "object") {
      return {
        name: obj.name,
        parameters: (obj.arguments as Record<string, unknown>) ?? {},
      };
    }

    return null;
  }

  function findFunction(
    controller: IAgenticaController.IClass,
    functionName: string,
  ): ILlmFunction | null {
    return (
      controller.application.functions.find((f) => f.name === functionName) ??
      null
    );
  }
}
