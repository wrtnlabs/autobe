export interface IRequestGetConfig {
  type: "req_get_config";
}

export interface IResponseGetConfig {
  type: "res_get_config";
  data: {
    apiKey?: string;
    model: string;
    baseUrl: string;
    concurrencyRequest: number;
    timezone: string;
    locale: string;
  };
}
