import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  IAutoBeCompiler,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";

export const getAutoBeRealizeGenerated = async (props: {
  compiler: IAutoBeCompiler;
  document: AutoBeOpenApi.IDocument;
  authorizations: AutoBeRealizeAuthorization[];
  functions: AutoBeRealizeFunction[];
  options: IAutoBeGetFilesOptions;
}): Promise<Record<string, string>> => ({
  ...Object.fromEntries(props.functions.map((f) => [f.location, f.content])),
  ...Object.fromEntries(
    props.authorizations
      .map((auth) => [
        [auth.decorator.location, auth.decorator.content],
        [auth.provider.location, auth.provider.content],
        [auth.payload.location, auth.payload.content],
      ])
      .flat(),
  ),
  ...(await props.compiler.realize.getTemplate(props.options)),
  ...(await props.compiler.realize.controller({
    document: props.document,
    functions: props.functions,
    authorizations: props.authorizations,
  })),
});
