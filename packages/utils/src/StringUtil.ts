export namespace StringUtil {
  export function trim(
    strings: TemplateStringsArray,
    ...values: any[]
  ): string {
    // First remove indentation from each string part
    const processedStrings = strings.map((str) => {
      const lines = str.split("\n");

      // Remove only indentation, not empty lines
      const nonEmptyLines = lines.filter((line) => line.trim() !== "");
      if (nonEmptyLines.length === 0) return str; // Return original if all lines are empty

      // Find minimum indentation among all non-empty lines
      const indentLengths = nonEmptyLines.map((line) => {
        const leadingWhitespace = line.match(/^[ \t]*/)?.[0] || "";
        return leadingWhitespace.length;
      });
      const indentLength = Math.min(...indentLengths);

      // Remove indentation from all lines
      const trimmedLines = lines.map((line) => {
        if (line.trim() === "") return "";
        return line.slice(indentLength);
      });

      return trimmedLines.join("\n");
    });

    // Combine the indentation-removed strings with values
    let result: string = processedStrings[0];
    for (let i = 0; i < values.length; i++) {
      result += String(values[i]) + processedStrings[i + 1];
    }

    // Remove leading and trailing empty lines from final result
    const lines: string[] = result.split("\n");
    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    return lines.join("\n");
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
