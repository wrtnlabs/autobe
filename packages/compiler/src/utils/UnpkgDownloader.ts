import syncRequest, { Response } from "sync-request";
import { VariadicSingleton } from "tstl";

export class UnpkgDownloader {
  public get(lib: string, file: string): string | undefined {
    return this.cache.get(lib, file);
  }

  private readonly meta = new VariadicSingleton((lib: string) => {
    try {
      const response: Response = syncRequest(
        "GET",
        `https://unpkg.com/${lib}/?meta`,
      );
      if (response.statusCode !== 200) return undefined;
      return JSON.parse(response.getBody("utf8")) as IMeta;
    } catch {}
  });

  private readonly cache = new VariadicSingleton(
    (lib: string, file: string) => {
      const meta: IMeta | undefined = this.meta.get(lib);
      if (meta === undefined) return undefined;

      if (file.startsWith("/") === false) file = `/${file}`;
      const found: IFile | undefined = meta.files.find((f) => f.path === file);
      if (found === undefined) return undefined;

      try {
        const response: Response = syncRequest(
          "GET",
          `https://unpkg.com/${lib}${found.path}`,
        );
        if (response.statusCode !== 200) return undefined;
        return response.getBody("utf8");
      } catch {}
    },
  );
}

interface IMeta {
  files: IFile[];
}
interface IFile {
  path: string;
}
