import { AutoBeConversateContentBase } from "./AutoBeConversateContentBase";

export interface AutoBeConversateTextContent
  extends AutoBeConversateContentBase<"text"> {
  text: string;
}
