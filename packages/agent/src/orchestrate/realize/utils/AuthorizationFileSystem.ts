export namespace AuthorizationFileSystem {
  export const decoratorPath = (name: string): string =>
    `src/decorators/${name}.ts`;

  export const payloadPath = (name: string): string =>
    `src/decorators/payload/${name}.ts`;

  export const providerPath = (name: string): string =>
    `src/providers/authorize/${name}.ts`;
}
