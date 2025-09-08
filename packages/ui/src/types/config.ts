/**
 * Base configuration interface for AutoBE Contains all the standard
 * configuration fields with proper types
 */
export interface IAutoBeBaseConfig {
  /** AI model to use (e.g., gpt-4.1, claude-3-sonnet) */
  aiModel: string;

  /** Schema model for API generation */
  schemaModel: string;

  /** Locale for internationalization */
  locale: string;

  /** OpenAI API key for authentication */
  openApiKey: string;

  /** Custom base URL for AI service (optional override) */
  baseUrl: string;

  /** Concurrency limit for requests */
  semaphore: number;

  /** Whether audio support is enabled */
  supportAudioEnable: boolean;
}

/** Extended configuration type that includes base config plus additional fields */
export type IAutoBeConfig = IAutoBeBaseConfig & Record<string, unknown>;

/** Partial configuration for optional fields */
export type IAutoBePartialConfig = Partial<IAutoBeBaseConfig> &
  Record<string, unknown>;

/** Default configuration values */
export const DEFAULT_CONFIG: IAutoBeBaseConfig = {
  aiModel: "gpt-4.1",
  schemaModel: "chatgpt",
  locale: "en",
  openApiKey: "",
  baseUrl: "",
  semaphore: 16,
  supportAudioEnable: false,
};
