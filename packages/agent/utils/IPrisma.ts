export interface IPrismaFileInput {
  /**
   * Prisma Schema Files.
   * You must divide Prisma Schema into multiple files based on closely related models.
   * Filename is related to the model name (e.g. "articles.prisma", "user.prisma").
   *
   */
  files: {
    /**
     * Key : Prisma Schema Filename
     * Value : Prisma Schema Content
     */
    [filename: string]: string;
  };
}

export interface IPrismaObjectOutput {
  /**
   * Filename of the Prisma Schema
   */
  filename: string[];

  /**
   * Content of the Prisma Schema
   */
  content: string;
}
