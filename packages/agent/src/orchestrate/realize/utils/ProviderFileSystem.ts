export namespace RealizeFileSystem {
  export const providerPath = (filename: string): string =>
    `src/providers/${filename}.ts`;
}
