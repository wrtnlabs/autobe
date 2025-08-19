export interface IRequestGetConfig {
  type: "req_get_config";
}

export interface IResponseGetConfig {
  type: "res_get_config";
  data: Partial<{
    apiKey: string;
    model: string;
    baseUrl: string;
    concurrencyRequest: number;
  }>;
}
