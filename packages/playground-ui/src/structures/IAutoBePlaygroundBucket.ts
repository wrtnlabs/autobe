import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageImageContent,
} from "@autobe/interface";

export interface IAutoBePlaygroundBucket {
  file: File;
  content:
    | AutoBeUserMessageAudioContent
    | AutoBeUserMessageFileContent
    | AutoBeUserMessageImageContent;
}
