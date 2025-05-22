import path from "path";

type Filename = string;
type FileContent = string;

export class Planning {
  constructor(
    private readonly rootFolder?: string,
    private readonly fileMap: Record<Filename, FileContent> = {},
  ) {}

  /**
   * Generate markdown file. if there is already created file, overwrite it.
   *
   * @param input.reason Describe briefly why you made this document, and if you
   *   have any plans for the next one.
   * @param input.filename Filename to generate or overwrite.
   * @param input.markdown Markdown file content.
   */
  async writeFile(input: {
    reason: string;
    filename: `${string}.md`;
    markdown: string;
  }): Promise<void> {
    const filename = path.join(this.rootFolder ?? "", input.filename);
    this.fileMap[input.filename] = input.markdown;
  }

  /**
   * Read markdown file content.
   *
   * @param input.filename Filename to read.
   */
  async readFile(input: { filename: `${string}.md` }): Promise<string> {
    const filename = path.join(this.rootFolder ?? "", input.filename);
    return this.fileMap[filename];
  }

  /**
   * Remove markdown file.
   *
   * @param input.name Filename to remove
   */
  async removeFile(input: { filename: `${string}.md` }): Promise<void> {
    const filename = path.join(this.rootFolder ?? "", input.filename);
    delete this.fileMap[filename];
  }

  /**
   * If you decide that you no longer need any reviews, or if the reviewer
   * refuses to do so, call abort. This is a function to end document creation
   * and review, and to respond to users.
   *
   * When there is content you are unsure about and need to ask the user a
   * question, abort the process and ask the user directly. The reason for
   * aborting should be included as the content of the question.
   *
   * @param input.reason Should contain the reason for the abort.
   */
  abort(input: { reason: string }): "OK" {
    return "OK";
  }

  /** @ignore */
  allFiles(): Record<string, string> {
    return this.fileMap;
  }
}
