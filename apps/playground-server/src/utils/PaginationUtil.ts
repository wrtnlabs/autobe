import { IPage } from "@autobe/interface";
import { ArrayUtil } from "@nestia/e2e";

export namespace PaginationUtil {
  export interface Transformer<Input extends object, Output extends object> {
    (records: Input): Output | Promise<Output>;
  }

  export interface IProps<
    Where extends object,
    OrderBy extends object,
    Payload extends object,
    Raw extends object,
    Output extends object,
  > {
    schema: {
      findMany(
        input: Payload & {
          skip?: number;
          take?: number;
          where?: Where;
          orderBy?: OrderBy | OrderBy[];
        },
      ): Promise<Raw[]>;
      count(arg: { where: Where }): Promise<number>;
    };
    payload: Payload;
    transform: Transformer<Raw, Output>;
  }
  export namespace IProps {
    export type DeduceWhere<T extends IProps<any, any, any, any, any>> =
      T extends IProps<infer U, any, any, any, any> ? U : never;
    export type DeduceOrderBy<T extends IProps<any, any, any, any, any>> =
      T extends IProps<any, infer U, any, any, any> ? U : never;
    export type DeducePayload<T extends IProps<any, any, any, any, any>> =
      T extends IProps<any, any, infer U, any, any> ? U : never;
    export type DeduceRaw<T extends IProps<any, any, any, any, any>> =
      T extends IProps<any, any, any, infer U, any> ? U : never;
    export type DeduceOutput<T extends IProps<any, any, any, any, any>> =
      T extends IProps<any, any, any, any, infer U> ? U : never;
  }

  export const paginate =
    <T extends IProps<any, any, any, any, any>>(props: T) =>
    (spec: {
      where: IProps.DeduceWhere<T>;
      orderBy: IProps.DeduceOrderBy<T>[];
    }) =>
    async (input: IPage.IRequest): Promise<IPage<IProps.DeduceOutput<T>>> => {
      input.limit ??= 100;

      const records: number = await props.schema.count({
        where: spec.where,
      });
      const pages: number =
        input.limit !== 0 ? Math.ceil(records / input.limit) : 1;
      input.page = input.page ? Math.max(1, Math.min(input.page, pages)) : 1;

      const data: IProps.DeduceRaw<T>[] = await props.schema.findMany({
        ...props.payload,
        skip: (input.page - 1) * input.limit,
        take: input.limit || records,
        where: spec.where,
        orderBy: spec.orderBy,
      });
      return {
        data: await ArrayUtil.asyncMap(data, async (elem) =>
          props.transform(elem),
        ),
        pagination: {
          records,
          pages,
          current: input.page,
          limit: input.limit,
        },
      };
    };

  export const orderBy =
    <Column extends string, Output extends object>(
      transform: (column: Column, direction: "asc" | "desc") => Output | null,
    ) =>
    (columns: IPage.Sort<Column>): Output[] =>
      columns
        .map((col) =>
          transform(
            col.substring(1) as Column,
            col[0] === "+" ? "asc" : "desc",
          ),
        )
        .filter((elem) => elem !== null) as Output[];
}
