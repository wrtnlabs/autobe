import { AutoBeRealizeAuthorizationDecorator } from "./AutoBeRealizeAuthorizationDecorator";
import { AutoBeRealizeAuthorizationPayload } from "./AutoBeRealizeAuthorizationPayload";
import { AutoBeRealizeAuthorizationProvider } from "./AutoBeRealizeAuthorizationProvider";

export interface AutoBeRealizeAuthorization {
  role: string;
  decorator: AutoBeRealizeAuthorizationDecorator;
  payload: AutoBeRealizeAuthorizationPayload;
  provider: AutoBeRealizeAuthorizationProvider;
}
