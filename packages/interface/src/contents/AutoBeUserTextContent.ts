import { AutoBeUserContentBase } from "./AutoBeUserContentBase";

export interface AutoBeUserTextContent extends AutoBeUserContentBase<"text"> {
  text: string;
}
