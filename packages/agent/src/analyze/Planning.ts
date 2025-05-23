type Filename = string;
type FileContent = string;

export interface IPlanning {
  /**
   * Generate markdown file. if there is already created file, overwrite it.
   *
   * @param input.reason Describe briefly why you made this document, and if you
   *   have any plans for the next one.
   * @param input.filename Filename to generate or overwrite.
   * @param input.markdown Markdown file content. Only write the content of the
   *   file. Do not include any questions.
   */
  createOrUpdateFile(input: {
    reason: string;
    filename: `${string}.md`;
    markdown: string;
  }): Promise<void>;

  /**
   * Read markdown file content.
   *
   * @param input.filename Filename to read.
   */
  // readFile(input: { filename: `${string}.md` }): Promise<string>;

  /**
   * Remove markdown file.
   *
   * @param input.name Filename to remove
   */
  removeFile(input: { filename: `${string}.md` }): Promise<void>;

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
  abort(input: { reason: string }): "OK";
}

export class Planning implements IPlanning {
  constructor(private readonly fileMap: Record<Filename, FileContent> = {}) {}

  async createOrUpdateFile(input: {
    reason: string;
    filename: `${string}.md`;
    markdown: string;
  }): Promise<void> {
    this.fileMap[input.filename] = input.markdown;
  }

  // async readFile(input: { filename: `${string}.md` }): Promise<string> {
  //   return this.fileMap[input.filename];
  // }

  async removeFile(input: { filename: `${string}.md` }): Promise<void> {
    delete this.fileMap[input.filename];
  }

  abort(input: { reason: string }): "OK" {
    return "OK";
  }

  /** @ignore */
  allFiles(): Record<string, string> {
    return this.fileMap;
  }
}
