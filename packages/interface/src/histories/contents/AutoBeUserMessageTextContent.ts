import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

export interface AutoBeUserMessageTextContent
  extends AutoBeUserMessageContentBase<"text"> {
  text: string;
}
