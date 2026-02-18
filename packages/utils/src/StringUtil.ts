export namespace StringUtil {
  export function trim(
    strings: TemplateStringsArray,
    // biome-ignore lint: intended
    ...values: any[]
  ): string {
    let combined = strings[0];
    for (let i = 0; i < values.length; i++) {
      combined += `__PLACEHOLDER_${i}__` + strings[i + 1];
    }

    const lines = combined.split("\n");

    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    if (lines.length === 0) return "";

    const nonEmptyLines = lines.filter((line) => line.trim() !== "");
    const minIndent = Math.min(
      ...nonEmptyLines.map((line) => {
        const match = line.match(/^[ \t]*/);
        return match ? match[0].length : 0;
      }),
    );

    const dedentedLines = lines.map((line) => {
      if (line.trim() === "") return "";
      return line.slice(minIndent);
    });

    let result = dedentedLines.join("\n");
    for (let i = 0; i < values.length; i++) {
      result = result.replace(`__PLACEHOLDER_${i}__`, String(values[i]));
    }

    return result;
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
