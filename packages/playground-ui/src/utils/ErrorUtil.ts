export namespace ErrorUtil {
  export function toJSON(error: unknown) {
    if (error instanceof Error)
      return {
        ...error,
        name: error.name,
        message: error.message,
      };
    return error;
  }
}
