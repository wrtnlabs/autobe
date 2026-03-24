import { IAutoBePlaygroundVendorModel } from "@autobe/interface";
import { Prisma } from "@prisma/sdk";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";

export namespace AutoBePlaygroundVendorModelProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_playground_vendor_modelsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBePlaygroundVendorModel => ({
      id: input.id,
      model: input.model,
      created_at: input.created_at.toISOString(),
    });
    export const select = () =>
      ({
        select: {
          id: true,
          model: true,
          created_at: true,
        },
      }) satisfies Prisma.autobe_playground_vendor_modelsFindManyArgs;
  }

  export const index = async (props: {
    vendorId: string;
  }): Promise<IAutoBePlaygroundVendorModel[]> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
      {
        where: { id: props.vendorId, deleted_at: null },
        select: { id: true },
      },
    );
    const records =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_vendor_models.findMany(
        {
          where: { autobe_playground_vendor_id: props.vendorId },
          orderBy: { created_at: "desc" },
          ...json.select(),
        },
      );
    return records.map(json.transform);
  };

  export const emplace = async (props: {
    vendorId: string;
    model: string;
  }): Promise<void> => {
    const exists =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_vendor_models.findFirst(
        {
          where: {
            autobe_playground_vendor_id: props.vendorId,
            model: props.model,
          },
          select: { id: true },
        },
      );
    if (exists !== null) return;
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendor_models.create({
      data: {
        id: v7(),
        autobe_playground_vendor_id: props.vendorId,
        model: props.model,
        created_at: new Date(),
      },
    });
  };

  export const erase = async (props: {
    vendorId: string;
    id: string;
  }): Promise<void> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendor_models.findFirstOrThrow(
      {
        where: {
          id: props.id,
          autobe_playground_vendor_id: props.vendorId,
        },
        select: { id: true },
      },
    );
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendor_models.delete({
      where: { id: props.id },
    });
  };
}
