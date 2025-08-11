import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageImageContent,
} from "@autobe/interface";

import { IAutoBePlaygroundBucket } from "../structures/IAutoBePlaygroundBucket";
import { IAutoBePlaygroundUploadConfig } from "../structures/IAutoBePlaygroundUploadConfig";

export namespace AutoBePlaygroundFileUploader {
  export const isValidFileExtension = (
    filename: string,
    supportAudio: boolean,
    hasFileUploadAPI: boolean,
  ): boolean => {
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf("."));
    const format: IFileFormat | undefined = FORMATS[extension];
    if (format === undefined) return false;
    else if (!supportAudio && format.category === "audio") return false;

    // Without file upload API, only support images, audio (if enabled), and PDF
    if (!hasFileUploadAPI) {
      if (format.category === "document") return extension === ".pdf";
      else if (format.category === "video") return false;

      const allowedCategories: string[] = ["image"];
      if (supportAudio) allowedCategories.push("audio");
      return allowedCategories.includes(format.category);
    }
    return true;
  };

  export const getAcceptAttribute = (
    supportAudio: boolean = false,
    hasFileUploadAPI: boolean = false,
  ): string => {
    const acceptParts = Object.values(FORMATS)
      .filter((format) => {
        // Audio filter
        if (!supportAudio && format.category === "audio") return false;

        // Without file upload API, only allow images, audio (if enabled), and PDF
        if (!hasFileUploadAPI) {
          if (format.category === "image") return true;
          if (format.category === "audio" && supportAudio) return true;
          if (format.category === "document" && format.extension === ".pdf")
            return true;
          return false;
        }
        return true;
      })
      .map((format) => format.extension);
    return acceptParts.join(",");
  };

  export const getMimeType = (filename: string): string => {
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf("."));
    const format = FORMATS[extension];
    return format?.mimeType || "application/octet-stream";
  };
  export const compose = async (
    config: IAutoBePlaygroundUploadConfig,
    file: File,
  ): Promise<IAutoBePlaygroundBucket> => {
    // Validate file extension first
    if (
      !isValidFileExtension(
        file.name,
        config.supportAudio ?? false,
        !!config.file,
      )
    )
      throw new Error(
        `Unsupported file format: ${file.name}. ${!config.file ? "Only images, PDF, and audio files (if enabled) are supported without file upload API." : ""}`,
      );

    // Check for image files
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    const format = FORMATS[extension];

    if (format?.category === "image")
      return {
        file,
        content: await composeImageContent(config, file),
      };
    else if (
      config.supportAudio &&
      format?.category === "audio" &&
      AUDIO_MIME_VARIANTS.includes(file.type)
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
        let data: string = reader.result as string;

        // If browser couldn't determine MIME type properly, replace with correct one
        if (
          data.startsWith("data:application/octet-stream") ||
          data.startsWith("data:;")
        ) {
          const mimeType = getMimeType(file.name);
          data = data.replace(/^data:[^;]*/, `data:${mimeType}`);
        }

        resolve(data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  export const readAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        // Convert text to base64
        const base64 = btoa(unescape(encodeURIComponent(text)));
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const composeImageContent = async (
    config: IAutoBePlaygroundUploadConfig,
    file: File,
  ): Promise<AutoBeUserMessageImageContent> => ({
    type: "image",
    image: config.image
      ? {
          type: "url",
          url: await config.image(file).then((res) => res.url),
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
    config: IAutoBePlaygroundUploadConfig,
    file: File,
  ): Promise<AutoBeUserMessageFileContent> => {
    // Get MIME type for the file
    const mimeType = getMimeType(file.name);

    // If file upload API is available, use it
    if (config.file) {
      return {
        type: "file",
        file: {
          type: "id",
          id: await config.file(file).then((res) => res.id),
        } satisfies AutoBeUserMessageFileContent.IId,
      };
    }

    // If MIME type starts with text/, read as text and encode to base64 without data URL
    if (mimeType.startsWith("text/")) {
      return {
        type: "file",
        file: {
          type: "base64",
          name: file.name,
          data: await readAsText(file),
        } satisfies AutoBeUserMessageFileContent.IBase64,
      };
    }

    // For other files, use data URL format
    return {
      type: "file",
      file: {
        type: "base64",
        name: file.name,
        data: await convertToBase64(file),
      } satisfies AutoBeUserMessageFileContent.IBase64,
    };
  };
}

interface IFileFormat {
  extension: string;
  mimeType: string;
  category: "image" | "audio" | "video" | "document";
}

const FORMATS: Record<string, IFileFormat> = {
  // Images
  ".png": { extension: ".png", mimeType: "image/png", category: "image" },
  ".jpg": { extension: ".jpg", mimeType: "image/jpeg", category: "image" },
  ".jpeg": { extension: ".jpeg", mimeType: "image/jpeg", category: "image" },
  ".gif": { extension: ".gif", mimeType: "image/gif", category: "image" },
  ".webp": { extension: ".webp", mimeType: "image/webp", category: "image" },

  // Audio
  ".mp3": { extension: ".mp3", mimeType: "audio/mpeg", category: "audio" },
  ".wav": { extension: ".wav", mimeType: "audio/wav", category: "audio" },

  // Video
  ".mp4": { extension: ".mp4", mimeType: "video/mp4", category: "video" },
  ".mpeg": { extension: ".mpeg", mimeType: "video/mpeg", category: "video" },
  ".mov": { extension: ".mov", mimeType: "video/quicktime", category: "video" },
  ".avi": { extension: ".avi", mimeType: "video/x-msvideo", category: "video" },
  ".webm": { extension: ".webm", mimeType: "video/webm", category: "video" },
  ".flv": { extension: ".flv", mimeType: "video/x-flv", category: "video" },
  ".mkv": {
    extension: ".mkv",
    mimeType: "video/x-matroska",
    category: "video",
  },
  ".wmv": { extension: ".wmv", mimeType: "video/x-ms-wmv", category: "video" },

  // Documents
  ".pdf": {
    extension: ".pdf",
    mimeType: "application/pdf",
    category: "document",
  },
  ".txt": { extension: ".txt", mimeType: "text/plain", category: "document" },
  ".md": { extension: ".md", mimeType: "text/plain", category: "document" },
  ".docx": {
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "document",
  },
  ".html": { extension: ".html", mimeType: "text/html", category: "document" },
  ".json": {
    extension: ".json",
    mimeType: "application/json",
    category: "document",
  },
  ".csv": { extension: ".csv", mimeType: "text/csv", category: "document" },
  ".xml": {
    extension: ".xml",
    mimeType: "application/xml",
    category: "document",
  },
  ".rtf": {
    extension: ".rtf",
    mimeType: "application/rtf",
    category: "document",
  },
};

// Alternative MIME types for audio files that browsers might use
const AUDIO_MIME_VARIANTS = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/x-wave",
];
