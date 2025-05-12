import { AutoBeUserAudioContent } from "./AutoBeUserAudioContent";
import { AutoBeUserFileContent } from "./AutoBeUserFileContent";
import { AutoBeUserImageContent } from "./AutoBeUserImageContent";
import { AutoBeUserTextContent } from "./AutoBeUserTextContent";

export type AutoBeUserContent =
  | AutoBeUserAudioContent
  | AutoBeUserFileContent
  | AutoBeUserImageContent
  | AutoBeUserTextContent;
export namespace AutoBeUserContent {
  export type Type = AutoBeUserContent["type"];
  export interface Mapper {
    audio: AutoBeUserAudioContent;
    file: AutoBeUserFileContent;
    image: AutoBeUserImageContent;
    text: AutoBeUserTextContent;
  }
}
