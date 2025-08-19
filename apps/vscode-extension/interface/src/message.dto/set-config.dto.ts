export interface IRequestSetConfig {
  type: "req_set_config";
  data: Partial<{
    apiKey: string;
    model: string;
    baseUrl: string;
    concurrencyRequest: number;
  }>;
}
