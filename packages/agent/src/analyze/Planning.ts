type Filename = string;
type FileContent = string;

export interface IPlanning {
  /**
   * Generate multiple markdown files. if there is already created files,
   * overwrite it. Generate several markdown files at once.
   */
  createOrUpdateFiles(input: {
    files: Array<{
      /**
       * Describe briefly why you made this document, and if you have any plans
       * for the next one.
       */
      reason: string;

      /** Filename to generate or overwrite. */
      filename: `${string}.md`;

      /**
       * Markdown file content. Only write the content of the file. Do not
       * include any questions.
       */
      markdown: string;
    }>;
  }): Promise<void>;

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

  async createOrUpdateFiles(input: {
    files: Array<{
      reason: string;
      filename: `${string}.md`;
      markdown: string;
    }>;
  }): Promise<void> {
    input.files.forEach((file) => {
      this.fileMap[file.filename] = file.markdown;
    });
  }

  async removeFile(input: { filename: `${string}.md` }): Promise<void> {
    delete this.fileMap[input.filename];
  }

  abort(_input: { reason: string }): "OK" {
    return "OK";
  }

  /** @ignore */
  allFiles(): Record<string, string> {
    return this.fileMap;
  }
}
