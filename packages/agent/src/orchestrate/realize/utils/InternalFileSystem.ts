import path from "path";

export namespace InternalFileSystem {
  /**
   * In the `src/internal/template` directory of AutoBE, the sections utilized
   * by the Realize Agent are defined as the ROOT.
   */
  export const ROOT = path.join(
    __dirname,
    `../../../../../../internals/template/realize/`,
  );

  /**
   * @param filename Filename include '.ts' extension
   * @returns Template file with ts extension of realize agent
   */
  export const templatePath = (filename: string) =>
    filename.endsWith(".ts") ? `${ROOT}${filename}` : `${ROOT}${filename}.ts`;

  /**
   * Get template files for all of realize agents
   *
   * @returns Template file paths
   */
  export const DEFAULT = () => {
    return [
      "src/providers/jwtAuthorize.ts",
      "src/MyGlobal.ts",
      "src/util/toISOStringSafe.ts",
    ].map(templatePath);
  };
}
