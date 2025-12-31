import { IAutoBeCompiler } from "@autobe/interface";
import { Semaphore } from "tstl";

export const getCriticalCompiler = (
  critical: Semaphore,
  compiler: IAutoBeCompiler,
): IAutoBeCompiler => {
  const lock = async (func: () => Promise<any>) => {
    await critical.acquire();
    try {
      return await func();
    } finally {
      await critical.release();
    }
  };
  return {
    database: {
      compilePrismaSchemas: (props) =>
        lock(() => compiler.database.compilePrismaSchemas(props)),
      writePrismaSchemas: (app, dmbs) =>
        lock(() => compiler.database.writePrismaSchemas(app, dmbs)),
      validate: (app) => lock(() => compiler.database.validate(app)),
    },
    interface: {
      write: (doc, exclude) =>
        lock(() => compiler.interface.write(doc, exclude)),
      transform: (doc) => lock(() => compiler.interface.transform(doc)),
      invert: (doc) => lock(() => compiler.interface.invert(doc)),
    },
    typescript: {
      compile: (props) => lock(() => compiler.typescript.compile(props)),
      getExternal: (location) =>
        lock(() => compiler.typescript.getExternal(location)),
      beautify: (code) => lock(() => compiler.typescript.beautify(code)),
      removeImportStatements: (code) =>
        lock(() => compiler.typescript.removeImportStatements(code)),
    },
    test: {
      compile: (props) => lock(() => compiler.test.compile(props)),
      validate: (props) => lock(() => compiler.test.validate(props)),
      write: (props) => lock(() => compiler.test.write(props)),
      getExternal: () => lock(() => compiler.test.getExternal()),
      getDefaultTypes: () => lock(() => compiler.test.getDefaultTypes()),
    },
    realize: {
      controller: (props) => lock(() => compiler.realize.controller(props)),
      test: (props) => lock(() => compiler.realize.test(props)),
    },
    getTemplate: (options) => lock(() => compiler.getTemplate(options)),
  };
};
