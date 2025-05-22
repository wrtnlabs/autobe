import fs from "fs";
import path from "path";

export class Planning {
  constructor(
    private readonly rootFolder?: string,
    private readonly fileMap: Record<string, string> = {},
  ) {}

  /**
   * Generate markdown file.
   * if there is already created file, overwrite it.
   *
   * @param input.reason Describe briefly why you made this document, and if you have any plans for the next one.
   * @param input.filename filename to generate or overwrite.
   * @param input.markdown markdown file content.
   */
  async writeFile(input: {
    reason: string;
    filename: `${string}.md`;
    markdown: string;
  }): Promise<void> {
    const filename = path.join(this.rootFolder ?? "", input.filename);
    if (this.rootFolder) {
      await fs.promises.writeFile(filename, input.markdown);
    }

    this.fileMap[input.filename] = input.markdown;
  }

  /**
   * read markdown file content.
   *
   * @param input.filename filename to read.
   */
  async readFile(input: { filename: `${string}.md` }): Promise<string> {
    const filename = path.join(this.rootFolder ?? "", input.filename);
    return this.fileMap[filename];
  }

  /**
   * If you decide that you no longer need any reviews,
   * or if the reviewer refuses to do so, call abort.
   * This is a function to end document creation and review, and to respond to users.
   */
  abort(input: {}): "OK" {
    return "OK";
  }

  getStructure(input: { a: { b: { c: { d: { e: boolean } } } } }) {
    return input;
  }

  /**
   * @hidden
   */
  allFiles(): Record<string, string> {
    return this.fileMap;
  }
}
