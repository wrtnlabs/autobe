import { promisify } from "util";
import zlib from "zlib";

export namespace CompressUtil {
  export const gzip = async (value: string): Promise<Buffer> => {
    const input: Buffer = Buffer.from(value);
    return promisify(zlib.gzip)(input, {
      level: 9,
      // windowBits: 15,
      // memLevel: 9,
      // strategy: zlib.constants.Z_DEFAULT_STRATEGY,
      // chunkSize: 64 * 1_024,
    });
  };

  export const gunzip = async (buffer: Buffer): Promise<string> => {
    const result: Buffer = await promisify(zlib.gunzip)(buffer);
    return result.toString("utf8");
  };
}
