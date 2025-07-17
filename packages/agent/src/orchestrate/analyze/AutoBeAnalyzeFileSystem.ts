import { tags } from "typia";

export interface IFile {
  /**
   * Describe briefly why you made this document, and if you have any plans for
   * the next one.
   */
  reason: string;

  /** Filename to generate or overwrite. */
  filename: `${string}.md`;

  /**
   * Markdown file content. Only write the content of the file. Do not include
   * any questions. This should contain only the contents of the file. Do not
   * write down any questions or appreciation. For example, remove a sentence
   * such as "Is it okay if we proceed with the table of contents? Please let me
   * know if there is anything to add or exclude from the table of contents!"
   */
  markdown: string;
}

export interface ICreateOrUpdateInput {
  /**
   * Fill in the elements of the array as many files as you want to create.
   * Overwrite if you point to the name of the file that already exists.
   *
   * @title files to create or update
   */
  files: Array<IFile> & tags.MinItems<1>;
}

type Filename = string;
type FileContent = string;

export interface IAutoBeAnalyzeFileSystem {
  /**
   * Generate multiple markdown files. if there is already created files,
   * overwrite it. Generate several markdown files at once. It is recommended
   * that you create multiple files at a time.
   */
  createOrUpdateFiles(
    input: ICreateOrUpdateInput,
  ): Promise<Record<string, string>>;

  /**
   * If you decide that you no longer need any reviews, or if the reviewer
   * refuses to do so, call abort. This is a function to end document creation
   * and review, and to respond to users.
   *
   * When there is content you are unsure about and need to ask the user a
   * question, abort the process and ask the user directly. The reason for
   * aborting should be included as the content of the question.
   */
  abort(input: { reason: string }): "OK";
}

export class AutoBeAnalyzeFileSystem implements IAutoBeAnalyzeFileSystem {
  constructor(private readonly fileMap: Record<Filename, FileContent> = {}) {}
  async createOrUpdateFiles(input: {
    files: Array<IFile> & tags.MinItems<1>;
  }): Promise<Record<string, string>> {
    input.files.forEach((file) => {
      this.fileMap[file.filename] = file.markdown;
    });

    return this.fileMap;
  }

  abort(_input: { reason: string }): "OK" {
    return "OK";
  }
}
