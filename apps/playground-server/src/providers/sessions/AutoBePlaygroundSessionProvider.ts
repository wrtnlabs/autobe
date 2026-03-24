import { AutoBeTokenUsage } from "@autobe/agent";
import {
  AutoBePhase,
  IAutoBePlaygroundSession,
  IPage,
} from "@autobe/interface";
import { Prisma } from "@prisma/sdk";
import typia from "typia";
import { v7 } from "uuid";

import { AutoBePlaygroundGlobal } from "../../AutoBePlaygroundGlobal";
import { PaginationUtil } from "../../utils/PaginationUtil";
import { AutoBePlaygroundConfigProvider } from "../config/AutoBePlaygroundConfigProvider";
import { AutoBePlaygroundVendorModelProvider } from "../vendors/AutoBePlaygroundVendorModelProvider";
import { AutoBePlaygroundVendorProvider } from "../vendors/AutoBePlaygroundVendorProvider";
import { AutoBePlaygroundSessionEventProvider } from "./AutoBePlaygroundSessionEventProvider";
import { AutoBePlaygroundSessionHistoryProvider } from "./AutoBePlaygroundSessionHistoryProvider";

export namespace AutoBePlaygroundSessionProvider {
  export namespace json {
    export const transform = (
      input: Prisma.autobe_playground_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBePlaygroundSession => ({
      id: input.id,
      vendor: AutoBePlaygroundVendorProvider.json.transform(input.vendor),
      model: input.model,
      title: input.title ?? null,
      locale: input.locale,
      timezone: input.timezone,
      phase: typia.assert<AutoBePhase | null>(input.aggregate!.phase),
      token_usage: JSON.parse(input.aggregate!.token_usage),
      histories: input.histories
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
        .map(AutoBePlaygroundSessionHistoryProvider.json.transform),
      snapshots: input.events
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
        .map(AutoBePlaygroundSessionEventProvider.json.transform),
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          vendor: AutoBePlaygroundVendorProvider.json.select(),
          histories: AutoBePlaygroundSessionHistoryProvider.json.select(),
          events: AutoBePlaygroundSessionEventProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_playground_sessionsFindManyArgs;
  }

  export namespace summarize {
    export const transform = (
      input: Prisma.autobe_playground_sessionsGetPayload<
        ReturnType<typeof select>
      >,
    ): IAutoBePlaygroundSession.ISummary => ({
      id: input.id,
      vendor: AutoBePlaygroundVendorProvider.json.transform(input.vendor),
      model: input.model,
      title: input.title ?? null,
      locale: input.locale,
      timezone: input.timezone,
      phase: typia.assert<AutoBePhase | null>(input.aggregate!.phase),
      token_usage: JSON.parse(input.aggregate!.token_usage),
      created_at: input.created_at.toISOString(),
      completed_at: input.completed_at?.toISOString() ?? null,
    });
    export const select = () =>
      ({
        include: {
          vendor: AutoBePlaygroundVendorProvider.json.select(),
          aggregate: true,
        },
      }) satisfies Prisma.autobe_playground_sessionsFindManyArgs;
  }

  export const index = (props: {
    body: IAutoBePlaygroundSession.IRequest;
  }): Promise<IPage<IAutoBePlaygroundSession.ISummary>> =>
    PaginationUtil.paginate({
      schema: AutoBePlaygroundGlobal.prisma.autobe_playground_sessions,
      payload: summarize.select(),
      transform: summarize.transform,
    })({
      where: {
        ...(props.body.search
          ? { title: { contains: props.body.search } }
          : {}),
        ...(props.body.vendor_id
          ? { autobe_playground_vendor_id: props.body.vendor_id }
          : {}),
        ...(props.body.model ? { model: props.body.model } : {}),
      },
      orderBy: [{ created_at: "desc" }],
    })(props.body);

  export const find = async <
    Payload extends Prisma.autobe_playground_sessionsFindFirstArgs,
  >(props: {
    id: string;
    payload: Payload;
  }) => {
    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_sessions.findFirstOrThrow(
        {
          where: { id: props.id },
          ...props.payload,
        },
      );
    return record as Prisma.autobe_playground_sessionsGetPayload<Payload>;
  };

  export const at = async (props: {
    id: string;
  }): Promise<IAutoBePlaygroundSession> => {
    const record = await find({
      id: props.id,
      payload: json.select(),
    });
    return json.transform(record);
  };

  /**
   * Sentinel API key used to identify virtual/mock vendor sessions.
   *
   * @internal
   */
  export const VIRTUAL_API_KEY = "virtual-seed-no-api-key";

  export const create = async (props: {
    body: IAutoBePlaygroundSession.ICreate;
  }): Promise<IAutoBePlaygroundSession> => {
    const { body } = props;

    // Validate vendor exists
    await AutoBePlaygroundGlobal.prisma.autobe_playground_vendors.findFirstOrThrow(
      {
        where: { id: body.vendor_id, deleted_at: null },
        select: { id: true },
      },
    );

    const config = await AutoBePlaygroundConfigProvider.get();
    const locale = body.locale ?? config.locale;
    const timezone = body.timezone ?? config.timezone;

    // Determine model field: encode mock info as "vendor#project" when mock
    const isMock = body.mock != null;
    const model = isMock
      ? `${body.mock!.vendor}#${body.mock!.project}`
      : body.model;
    const title =
      body.title ?? (isMock ? `[Mock] ${body.mock!.project}` : null);

    if (!isMock) {
      await AutoBePlaygroundVendorModelProvider.emplace({
        vendorId: body.vendor_id,
        model: body.model,
      });
    }

    const record =
      await AutoBePlaygroundGlobal.prisma.autobe_playground_sessions.create({
        data: {
          id: v7(),
          autobe_playground_vendor_id: body.vendor_id,
          model,
          locale,
          timezone,
          title,
          created_at: new Date(),
          completed_at: null,
          aggregate: {
            create: {
              id: v7(),
              phase: null,
              enabled: true,
              token_usage: JSON.stringify(new AutoBeTokenUsage().toJSON()),
            },
          },
        },
        ...json.select(),
      });
    return json.transform(record);
  };

  export const update = async (props: {
    id: string;
    body: IAutoBePlaygroundSession.IUpdate;
  }): Promise<void> => {
    await find({ id: props.id, payload: { select: { id: true } } });
    await AutoBePlaygroundGlobal.prisma.autobe_playground_sessions.update({
      where: { id: props.id },
      data: { title: props.body.title },
    });
  };

  export const erase = async (props: { id: string }): Promise<void> => {
    await find({ id: props.id, payload: { select: { id: true } } });
    await AutoBePlaygroundGlobal.prisma.autobe_playground_sessions.delete({
      where: { id: props.id },
    });
  };
}
