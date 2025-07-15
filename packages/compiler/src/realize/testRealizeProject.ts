import { FileSystemIterator } from "@autobe/filesystem";
import {
  IAutoBeRealizeTestListener,
  IAutoBeRealizeTestProps,
  IAutoBeRealizeTestResult,
  IAutoBeRealizeTestService,
} from "@autobe/interface";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import { Driver, WorkerConnector } from "tgrid";

import { ProcessUtil } from "../utils/ProcessUtil";

export async function testRealizeProject(
  props: IAutoBeRealizeTestProps,
  listener: IAutoBeRealizeTestListener,
): Promise<IAutoBeRealizeTestResult> {
  const cwd: string = `${os.tmpdir()}/autobe-realize-${crypto.randomUUID()}`;
  await fs.promises.mkdtemp(cwd);
  try {
    await setup(props.files, cwd);
    return await test(props, listener, cwd);
  } catch (error) {
    throw error;
  } finally {
    await fs.promises.rm(cwd, {
      recursive: true,
      force: true,
    });
  }
}

async function setup(
  files: Record<string, string>,
  cwd: string,
): Promise<void> {
  await FileSystemIterator.save({
    root: cwd,
    files,
  });

  const exec = async (s: string) =>
    ProcessUtil.exec(s, {
      cwd,
    });
  await exec("pnpm install");
  await exec("pnpm run build:prisma");
  await exec("pnpm run build:test");
}

async function test(
  props: IAutoBeRealizeTestProps,
  listener: IAutoBeRealizeTestListener,
  cwd: string,
): Promise<IAutoBeRealizeTestResult> {
  const worker: WorkerConnector<
    null,
    IAutoBeRealizeTestListener,
    IAutoBeRealizeTestService
  > = new WorkerConnector(null, listener, "thread");
  await worker.connect(`${cwd}/bin/test/servant.js`, {
    stdio: "ignore",
    cwd,
  });
  const service: Driver<IAutoBeRealizeTestService> = worker.getDriver();
  try {
    const result: IAutoBeRealizeTestResult = await service.execute({
      reset: props.reset,
      simultaneous: props.simultaneous,
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    await worker.close();
  }
}
