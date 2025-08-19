export interface IRequestSaveFiles {
  type: "req_save_files";
  data: {
    files: Record<string, string>;
    directory: string;
  };
}

export interface IResponseSaveFiles {
  type: "res_save_files";
  data:
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      };
}
