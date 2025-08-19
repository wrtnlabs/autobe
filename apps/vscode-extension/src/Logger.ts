import type { OutputChannel } from "vscode";

const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};

let OutputChannel: OutputChannel;
const log = (level: string, message: string, error?: Error) => {
  let fullMessage = message;
  if (error?.message) {
    fullMessage += ` ${error.message}`;
  }
  OutputChannel.appendLine(`[${getTimestamp()}] ${level} ${fullMessage}`);
  console.log(`[${getTimestamp()}] ${level} ${fullMessage}`);
  if (error?.stack) {
    console.log(`Stack trace:\n${error.stack}`);
  }
}; 

export class Logger {
  static initialize(_outputChannel: OutputChannel) {
    OutputChannel = _outputChannel;
  }

  static error(message: string, error?: Error) {
    log("ERROR", message, error);
  }
  static warn(message: string) {
    log("WARN", message);
  }
  static info(message: string) {
    log("INFO", message);
  }
  static debug(message: string) {
    log("DEBUG", message);
  }
  static trace(message: string) {
    log("TRACE", message);
  }
}
