import { AutoBeAnalyzeFile } from "@autobe/interface/src/histories/contents/AutoBeAnalyzeFile";
import { tags } from "typia";

export interface ICreateOrUpdateInput {
  /**
   * Fill in the elements of the array as many files as you want to create.
   * Overwrite if you point to the name of the file that already exists.
   *
   * @title files to create or update
   */
  files: Array<AutoBeAnalyzeFile> & tags.MinItems<1>;
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
}

export class AutoBeAnalyzeFileSystem implements IAutoBeAnalyzeFileSystem {
  constructor(private readonly fileMap: Record<Filename, FileContent> = {}) {}
  async createOrUpdateFiles(input: {
    files: Array<AutoBeAnalyzeFile> & tags.MinItems<1>;
  }): Promise<Record<string, string>> {
    input.files.forEach((file) => {
      this.fileMap[file.filename] = file.content;
    });

    return this.fileMap;
  }
}
