import { AutoBeUserMessageAudioContent } from "./AutoBeUserMessageAudioContent";
import { AutoBeUserMessageFileContent } from "./AutoBeUserMessageFileContent";
import { AutoBeUserMessageImageContent } from "./AutoBeUserMessageImageContent";
import { AutoBeUserMessageTextContent } from "./AutoBeUserMessageTextContent";

export type AutoBeUserMessageContent =
  | AutoBeUserMessageAudioContent
  | AutoBeUserMessageFileContent
  | AutoBeUserMessageImageContent
  | AutoBeUserMessageTextContent;
export namespace AutoBeUserMessageContent {
  export type Type = AutoBeUserMessageContent["type"];
  export interface Mapper {
    audio: AutoBeUserMessageAudioContent;
    file: AutoBeUserMessageFileContent;
    image: AutoBeUserMessageImageContent;
    text: AutoBeUserMessageTextContent;
  }
}
