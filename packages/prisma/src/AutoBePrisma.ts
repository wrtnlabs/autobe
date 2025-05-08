import {
  IAutoBePrisma,
  IAutoBePrismaProps,
  IAutoBePrismaResult,
} from "@autobe/interface";
import {
  MultipleSchemas,
  format,
  formatSchema,
  getDMMF,
} from "@prisma/internals";

export class AutoBePrisma implements IAutoBePrisma {
  public async build(props: IAutoBePrismaProps): Promise<IAutoBePrismaResult> {
    return this.validate(props);
  }

  private async validate(
    props: IAutoBePrismaProps,
  ): Promise<IAutoBePrismaResult> {
    try {
      const schemas: MultipleSchemas = await formatSchema({
        schemas: Object.entries(props.schemas),
      });
      await getDMMF({
        datamodel: schemas,
      });
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
