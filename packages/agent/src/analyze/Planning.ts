import fs from "fs";
import path from "path";

export class Planning {
  constructor(private readonly rootFolder: string) {}

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
    const filename = `${this.rootFolder}/${input.filename}`;
    return fs.promises.writeFile(filename, input.markdown);
  }

  /**
   * read markdown file content.
   *
   * @param input.filename filename to read.
   */
  async readFile(input: { filename: `${string}.md` }): Promise<string> {
    const filename = `${this.rootFolder}/${input.filename}`;
    return fs.promises.readFile(filename, { encoding: "utf-8" });
  }

  /**
   * If you decide that you no longer need any reviews,
   * or if the reviewer refuses to do so, call abort.
   * This is a function to end document creation and review, and to respond to users.
   */
  abort(input: { answer: string }): "OK" {
    return "OK";
  }

  /**
   * @hidden
   */
  async allFiles(): Promise<{ path: string; content: string }[]> {
    const result: { path: string; content: string }[] = [];

    const readRecursive = async (dir: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await readRecursive(fullPath);
        } else if (entry.isFile()) {
          const content = await fs.promises.readFile(fullPath, "utf-8");
          result.push({ path: fullPath, content });
        }
      }
    };

    await readRecursive(this.rootFolder);
    return result;
  }
}
