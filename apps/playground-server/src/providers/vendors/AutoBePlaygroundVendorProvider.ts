import { IAutoBePlaygroundVendor, IPage } from "@autobe/interface";
import { AesPkcs5 } from "@nestia/fetcher";
import { Prisma } from "@prisma/sdk";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { PaginationUtil } from "../../utils/PaginationUtil";

export namespace AutoBePlaygroundVendorProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_playground_vendorsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBePlaygroundVendor => ({
      id: input.id,
      name: input.name,
      baseURL: input.base_url,
      semaphore: input.semaphore,
      created_at: input.created_at.toISOString(),
      deleted_at: input.deleted_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        select: {
          id: true,
          name: true,
          base_url: true,
          semaphore: true,
          created_at: true,
          deleted_at: true,
        },
      }) satisfies Prisma.autobe_playground_vendorsFindManyArgs;
  }

  export const index = (props: {
    body: IPage.IRequest;
  }): Promise<IPage<IAutoBePlaygroundVendor>> =>
    PaginationUtil.paginate({
      schema: AutoBePlaygroundGlobal.prisma.autobe_playground_vendors,
      payload: json.select(),
      transform: json.transform,
    })({
      where: { deleted_at: null },
      orderBy: [{ created_at: "desc" }],
    })(props.body);

  export const at = async (props: {
    id: string;
  }): Promise<IAutoBePlaygroundVendor> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
        {
          where: { id: props.id, deleted_at: null },
          ...json.select(),
        },
      );
    return json.transform(record);
  };

  export const create = async (props: {
    body: IAutoBePlaygroundVendor.ICreate;
  }): Promise<IAutoBePlaygroundVendor> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.create({
        data: {
          id: v7(),
          name: props.body.name,
          encrypted_api_key: encrypt(props.body.apiKey),
          base_url: props.body.baseURL ?? null,
          semaphore: props.body.semaphore ?? 16,
          created_at: new Date(),
        },
        ...json.select(),
      });
    return json.transform(record);
  };

  export const update = async (props: {
    id: string;
    body: IAutoBePlaygroundVendor.IUpdate;
  }): Promise<void> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
      {
        where: { id: props.id, deleted_at: null },
        select: { id: true },
      },
    );
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.update({
      where: { id: props.id },
      data: {
        ...(props.body.name !== undefined ? { name: props.body.name } : {}),
        ...(props.body.apiKey !== undefined
          ? { encrypted_api_key: encrypt(props.body.apiKey) }
          : {}),
        ...(props.body.baseURL !== undefined
          ? { base_url: props.body.baseURL }
          : {}),
        ...(props.body.semaphore !== undefined
          ? { semaphore: props.body.semaphore }
          : {}),
      },
    });
  };

  export const erase = async (props: { id: string }): Promise<void> => {
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
      {
        where: { id: props.id, deleted_at: null },
        select: { id: true },
      },
    );
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.update({
      where: { id: props.id },
      data: { deleted_at: new Date() },
    });
  };

  export const decryptApiKey = async (id: string): Promise<string> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
        {
          where: { id },
          select: { encrypted_api_key: true },
        },
      );
    return decrypt(record.encrypted_api_key);
  };
}

const encrypt = (plaintext: string): string => {
  const env = AutoBePlaygroundGlobal.env;
  return AesPkcs5.encrypt(
    plaintext,
    env.PLAYGROUND_ENCRYPTION_KEY,
    env.PLAYGROUND_ENCRYPTION_IV,
  );
};

const decrypt = (ciphertext: string): string => {
  const env = AutoBePlaygroundGlobal.env;
  return AesPkcs5.decrypt(
    ciphertext,
    env.PLAYGROUND_ENCRYPTION_KEY,
    env.PLAYGROUND_ENCRYPTION_IV,
  );
};
