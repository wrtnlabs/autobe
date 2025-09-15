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
    prisma: {
      compile: (props) => lock(() => compiler.prisma.compile(props)),
      validate: (app) => lock(() => compiler.prisma.validate(app)),
      write: (app, dmbs) => lock(() => compiler.prisma.write(app, dmbs)),
    },
    interface: {
      write: (doc) => lock(() => compiler.interface.write(doc)),
      transform: (doc) => lock(() => compiler.interface.transform(doc)),
      invert: (doc) => lock(() => compiler.interface.invert(doc)),
      getTemplate: () => lock(() => compiler.interface.getTemplate()),
    },
    typescript: {
      compile: (props) => lock(() => compiler.typescript.compile(props)),
      getExternal: (location) =>
        lock(() => compiler.typescript.getExternal(location)),
      beautify: (code) => lock(() => compiler.typescript.beautify(code)),
    },
    test: {
      compile: (props) => lock(() => compiler.test.compile(props)),
      validate: (props) => lock(() => compiler.test.validate(props)),
      write: (props) => lock(() => compiler.test.write(props)),
      getExternal: () => lock(() => compiler.test.getExternal()),
      getTemplate: () => lock(() => compiler.test.getTemplate()),
    },
    realize: {
      controller: (props) => lock(() => compiler.realize.controller(props)),
      test: (props) => lock(() => compiler.realize.test(props)),
      getTemplate: () => lock(() => compiler.realize.getTemplate()),
    },
  };
};
