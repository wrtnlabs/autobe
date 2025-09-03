export interface IAutoBeUploadConfig {
  supportAudio?: boolean;
  file?: (file: File) => Promise<{ id: string }>;
  image?: (file: File) => Promise<{ url: string }>;
}
