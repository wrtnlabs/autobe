import { promisify } from "util";
import zlib from "zlib";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export namespace TestZipper {
  export const compress = async (value: string): Promise<Buffer> => {
    const input: Buffer = Buffer.from(value);
    return gzip(input, {
      level: 9,
      // windowBits: 15,
      // memLevel: 9,
      // strategy: zlib.constants.Z_DEFAULT_STRATEGY,
      // chunkSize: 64 * 1_024,
    });
  };

  export const decompress = async (buffer: Buffer): Promise<string> => {
    const result: Buffer = await gunzip(buffer);
    return result.toString("utf8");
  };
}
