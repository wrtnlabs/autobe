import { AutoBeUserMessageAudioContent } from "@autobe/interface";

import { IAutoBePlaygroundBucket } from "../structures/IAutoBePlaygroundBucket";
import { AutoBePlaygroundFileUploader } from "./AutoBePlaygroundFileUploader";

export namespace AutoBePlaygroundVoiceRecorder {
  export const start = async (
    complete: (content: IAutoBePlaygroundBucket) => void,
  ): Promise<MediaRecorder> => {
    const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const recorder: MediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const wavBlob = await convertToWav(audioBlob);
        const audioFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
          type: "audio/wav",
        });

        const base64 =
          await AutoBePlaygroundFileUploader.convertToBase64(audioFile);
        const content: AutoBeUserMessageAudioContent = {
          type: "audio",
          data: base64,
          format: "wav",
        };
        complete({
          file: audioFile,
          content,
        });
      } finally {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    return recorder;
  };
}

const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create WAV file
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;

  // Calculate WAV file size
  const wavLength = 44 + length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(wavLength);
  const view = new DataView(buffer);

  // WAV file header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, wavLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, length * numberOfChannels * 2, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const value = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, value * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
};
