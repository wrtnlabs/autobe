export namespace AutoBeRealizeAuthorizationFileSystem {
  export const getDecoratorPath = (name: string) => `src/decorators/${name}.ts`;

  export const getPayloadPath = (name: string) =>
    `src/decorators/payload/${name}.ts`;

  export const getProviderPath = (name: string) =>
    `src/providers/authorize/${name}.ts`;
}
