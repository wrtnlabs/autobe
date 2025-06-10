export namespace StringUtil {
  export function trim(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string {
    let result: string = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += String(values[i]) + strings[i + 1];
    }

    const lines: string[] = result.split("\n");
    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    if (lines.length === 0) return "";

    const firstNonEmptyLine: string | undefined = lines.find(
      (line) => line.trim() !== "",
    );
    if (!firstNonEmptyLine) return "";

    const leadingWhitespace: string =
      firstNonEmptyLine.match(/^[ \t]*/)?.[0] || "";
    const indentLength: number = leadingWhitespace.length;
    const trimmedLines: string[] = lines.map((line) => {
      if (line.trim() === "") return "";
      return line.slice(indentLength);
    });
    return trimmedLines.join("\n");
  }

  export function singleLine(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string {
    let result: string = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += String(values[i]) + strings[i + 1];
    }
    return result.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }
}
