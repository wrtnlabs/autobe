import { AutoBeConversateContentBase } from "./AutoBeConversateContentBase";

export interface AutoBeConversateAudioContent
  extends AutoBeConversateContentBase<"audio"> {
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
