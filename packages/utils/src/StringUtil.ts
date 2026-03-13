import { dedent } from "@typia/utils";

export namespace StringUtil {
  export function trim(
    strings: TemplateStringsArray,
    // biome-ignore lint: intended
    ...values: any[]
  ): string {
    return dedent(strings, ...values);
  }

  export function singleLine(
    strings: TemplateStringsArray,
    // biome-ignore lint: intended
    ...values: any[]
  ): string {
    let result: string = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += String(values[i]) + strings[i + 1];
    }
    return result.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }

  export function summary(description: string): string {
    const newLine: number = description.indexOf("\n");
    const dot: number = description.indexOf(".");
    const minimum: number = Math.min(
      newLine === -1 ? Number.MAX_SAFE_INTEGER : newLine,
      dot === -1 ? Number.MAX_SAFE_INTEGER : dot,
      description.length,
    );
    return description.substring(0, minimum);
  }
}
