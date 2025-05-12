import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

export interface AutoBeUserMessageAudioContent
  extends AutoBeUserMessageContentBase<"audio"> {
  /**
   * Base64 encoded audio data.
   */
  data: string;

  /**
   * The format of the encoded audio data.
   *
   * Currently supports "wav" and "mp3".
   */
  format: "wav" | "mp3";
}
