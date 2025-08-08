import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageImageContent,
} from "@autobe/interface";

import { IAutoBePlaygroundBucket } from "../structures/IAutoBePlaygroundBucket";

export namespace AutoBePlaygroundFileUploader {
  export interface IConfig {
    supportAudio?: boolean;
    uploadImage?: (file: File) => Promise<{ url: string }>;
    uploadFile?: (file: File) => Promise<{ id: string }>;
  }

  export const compose = async (
    config: IConfig,
    file: File,
  ): Promise<IAutoBePlaygroundBucket> => {
    if (file.type.startsWith("image/"))
      return {
        file,
        content: await composeImageContent(config, file),
      };
    else if (
      config.supportAudio &&
      file.type.startsWith("audio/") &&
      (file.type === "audio/mpeg" ||
        file.type === "audio/mp3" ||
        file.type === "audio/wav" ||
        file.type === "audio/x-wav" ||
        file.type === "audio/wave" ||
        file.type === "audio/x-wave")
    )
      return {
        file,
        content: await composeAudioContent(file),
      };
    return {
      file,
      content: await composeFileContent(config, file),
    };
  };

  export const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data: string = reader.result as string;
        resolve(data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const composeImageContent = async (
    config: IConfig,
    file: File,
  ): Promise<AutoBeUserMessageImageContent> => ({
    type: "image",
    image: config.uploadImage
      ? {
          type: "url",
          url: await config.uploadImage(file).then((res) => res.url),
        }
      : {
          type: "base64",
          data: await convertToBase64(file),
        },
  });

  const composeAudioContent = async (
    file: File,
  ): Promise<AutoBeUserMessageAudioContent> => ({
    type: "audio",
    data: (await convertToBase64(file)).split(",")[1],
    format: file.type.includes("wav") ? "wav" : "mp3",
  });

  const composeFileContent = async (
    config: IConfig,
    file: File,
  ): Promise<AutoBeUserMessageFileContent> => ({
    type: "file",
    file: config.uploadFile
      ? ({
          type: "id",
          id: await config.uploadFile(file).then((res) => res.id),
        } satisfies AutoBeUserMessageFileContent.IId)
      : ({
          type: "base64",
          name: file.name,
          data: await convertToBase64(file),
        } satisfies AutoBeUserMessageFileContent.IBase64),
  });
}
