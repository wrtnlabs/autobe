import { ExceptionManager } from "@nestia/core";
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

import { MyGlobal } from "./MyGlobal";

export namespace MyConfiguration {
  export const API_PORT = () => Number(MyGlobal.env.API_PORT);
  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : fs.existsSync(__dirname + "/.env")
        ? __dirname
        : path.resolve(__dirname + "/..");
  })().replaceAll("\\", "/");
}

ExceptionManager.insert(Prisma.PrismaClientKnownRequestError, (exp) => {
  switch (exp.code) {
    case "P2025":
      return new NotFoundException(exp.message);
    case "P2002": // UNIQUE CONSTRAINT
      return new ConflictException(exp.message);
    default:
      return new InternalServerErrorException(exp.message);
  }
});
