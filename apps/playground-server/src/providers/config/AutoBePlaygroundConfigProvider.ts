import { IAutoBePlaygroundConfig } from "@autobe/interface";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000000";

export namespace AutoBePlaygroundConfigProvider {
  export const get = async (): Promise<IAutoBePlaygroundConfig> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_configs.findFirst({
        where: { id: SINGLETON_ID },
      });
    if (record === null) return seed();
    return transform(record);
  };

  export const update = async (props: {
    body: IAutoBePlaygroundConfig.IUpdate;
  }): Promise<IAutoBePlaygroundConfig> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_configs.upsert({
        where: { id: SINGLETON_ID },
        create: {
          id: SINGLETON_ID,
          locale: props.body.locale ?? "en-US",
          timezone: props.body.timezone ?? "UTC",
          default_vendor_id: props.body.default_vendor_id ?? null,
          default_model: props.body.default_model ?? null,
        },
        update: {
          ...(props.body.locale !== undefined
            ? { locale: props.body.locale ?? "en-US" }
            : {}),
          ...(props.body.timezone !== undefined
            ? { timezone: props.body.timezone ?? "UTC" }
            : {}),
          ...(props.body.default_vendor_id !== undefined
            ? { default_vendor_id: props.body.default_vendor_id ?? null }
            : {}),
          ...(props.body.default_model !== undefined
            ? { default_model: props.body.default_model ?? null }
            : {}),
        },
      });
    return transform(record);
  };

  /**
   * Ensure the singleton record exists.
   *
   * Called during application startup and lazily when `get()` finds no record.
   */
  export const seed = async (): Promise<IAutoBePlaygroundConfig> => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_configs.upsert({
        where: { id: SINGLETON_ID },
        create: {
          id: SINGLETON_ID,
          locale: "en-US",
          timezone: "UTC",
          default_vendor_id: null,
          default_model: null,
        },
        update: {},
      });
    return transform(record);
  };

  const transform = (record: {
    locale: string;
    timezone: string;
    default_vendor_id: string | null;
    default_model: string | null;
  }): IAutoBePlaygroundConfig => ({
    locale: record.locale,
    timezone: record.timezone,
    default_vendor_id: record.default_vendor_id,
    default_model: record.default_model,
  });
}
