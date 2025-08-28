import { IAutoBeGetFilesOptions } from "@autobe/interface";

export interface IRequestGetFiles {
  type: "req_get_files";
  data: {
    sessionId: string;
    options?: Partial<IAutoBeGetFilesOptions>;
  };
}

export interface IResponseGetFiles {
  type: "res_get_files";
  data: Record<string, string>;
}
