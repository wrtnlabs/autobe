import { IPrismaFileInput, IPrismaObjectOutput } from "../../utils/IPrisma";

export class PrismaStructuredOutput {
  /**
   * Parse the Prisma Schema into Files.
   * Input example is following:
   *
   * {
   *   files: {
   *     "schema.prisma": "Prisma Schema",
   *     "user.prisma": "Prisma Schema",
   *     "product.prisma": "Prisma Schema",
   *   }
   * }
   *
   * @param input - The Prisma Schema.
   * @returns The parsed Prisma Schema.
   */
  async parseSchemaToFiles(input: IPrismaFileInput): Promise<IPrismaFileInput> {
    return input;
  }

  /**
   * Parse the Prisma Schema into Object.
   *
   * @param input - The Prisma Schema.
   * @returns The parsed Prisma Schema.
   */
  async parseSchemaToObject(
    input: IPrismaObjectOutput,
  ): Promise<IPrismaObjectOutput> {
    return {
      filename: input.filename,
      content: input.content,
    };
  }
}
