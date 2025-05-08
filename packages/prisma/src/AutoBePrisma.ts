import { format, getDMMF } from "@prisma/internals";

import { IAutoBePrismaResult } from "./IAutoBePrismaResult";

export class AutoBePrisma {
  public async compile(content: string): Promise<IAutoBePrismaResult> {
    return this.validate(content);
  }

  private async validate(content: string): Promise<IAutoBePrismaResult> {
    try {
      content = await format(content);
      await getDMMF({ datamodel: content });
      return {
        type: "success",
        files: {},
      };
    } catch (error) {
      if (error instanceof Error && error.name === "GetDmmfError")
        return {
          type: "failure",
          reason: error.message,
        };
      return {
        type: "error",
        error:
          error instanceof Error
            ? {
                ...error,
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };
    }
  }
}
