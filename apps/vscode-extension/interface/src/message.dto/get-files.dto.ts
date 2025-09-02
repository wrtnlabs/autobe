import { IAutoBeGetFilesOptions } from "@autobe/interface";

export interface IRequestGetFiles {
  type: "req_get_files";
  data: {
    sessionId: string;
    options?: Partial<IAutoBeGetFilesOptions>;
    nonce: string;
  };
}

export interface IResponseGetFiles {
  type: "res_get_files";
  data: {
    files: Record<string, string>;
    nonce: string;
  };
}
