import { parse as convert } from "csv-parse";

export namespace CsvUtil {
  export const raw = (content: string): Promise<string[][]> =>
    new Promise((resolve, reject) => {
      convert(content, (err, ret) => {
        if (err) reject(err);
        else resolve(ret);
      });
    });

  export const parse =
    <Fields extends string>(...fields: Fields[]) =>
    async (content: string): Promise<Array<{ [key in Fields]: string }>> => {
      const raw = await CsvUtil.raw(content);

      const top: string[] = raw[0];
      const indexes: Record<string, number> = Object.fromEntries(
        fields.map((f) => [f, top.findIndex((t) => t === f)]),
      );
      const notFound: string[] = fields.filter((f) => indexes[f] === -1);
      if (notFound.length !== 0)
        throw new Error(
          `Error on CsvParser.parse(): unable to found those fields: ${notFound.join(
            ", ",
          )}`,
        );

      return raw
        .slice(1)
        .map((row) =>
          Object.fromEntries(fields.map((f) => [f, row[indexes[f]]])),
        ) as Array<{ [key in Fields]: string }>;
    };
}
