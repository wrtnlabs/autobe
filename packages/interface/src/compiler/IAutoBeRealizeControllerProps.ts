import { AutoBeRealizeAuthorization } from "../histories";
import { AutoBeRealizeFunction } from "../histories/contents/AutoBeRealizeFunction";
import { AutoBeOpenApi } from "../openapi";

export interface IAutoBeRealizeControllerProps {
  document: AutoBeOpenApi.IDocument;
  functions: AutoBeRealizeFunction[];
  authorizations: AutoBeRealizeAuthorization[];
}
