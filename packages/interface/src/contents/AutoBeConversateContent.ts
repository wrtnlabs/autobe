import { AutoBeConversateAudioContent } from "./AutoBeConversateAudioContent";
import { AutoBeConversateFileContent } from "./AutoBeConversateFileContent";
import { AutoBeConversateImageContent } from "./AutoBeConversateImageContent";
import { AutoBeConversateTextContent } from "./AutoBeConversateTextContent";

export type AutoBeConversateContent =
  | AutoBeConversateAudioContent
  | AutoBeConversateFileContent
  | AutoBeConversateImageContent
  | AutoBeConversateTextContent;
export namespace AutoBeConversateContent {
  export type Type = AutoBeConversateContent["type"];
  export interface Mapper {
    audio: AutoBeConversateAudioContent;
    file: AutoBeConversateFileContent;
    image: AutoBeConversateImageContent;
    text: AutoBeConversateTextContent;
  }
}
