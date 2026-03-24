import { AutoBeExampleStorage } from "@autobe/benchmark";
import {
  AutoBeExampleProject,
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { TestValidator } from "@nestia/e2e";

import { TestVendor } from "../../../internal/TestVendor";

const PROJECTS: AutoBeExampleProject[] = [
  "todo",
  "bbs",
  "reddit",
  "shopping",
  "chat",
  "account",
  "erp",
];

const findAvailableExample = async (): Promise<{
  model: string;
  project: AutoBeExampleProject;
} | null> => {
  const models = await AutoBeExampleStorage.getVendorModels();
  for (const model of models)
    for (const project of PROJECTS)
      if (
        await AutoBeExampleStorage.has({
          vendor: model,
          project,
          phase: "analyze",
        })
      )
        return { model, project };
  return null;
};

export const test_api_playground_session_create_mock = async (
  connection: pApi.IConnection,
): Promise<void> => {
  const example = await findAvailableExample();
  if (example === null) throw new Error("No example data available.");
  const { model, project } = example;

  const vendor: IAutoBePlaygroundVendor = await TestVendor.get(connection);

  // Create a mock session via API with @internal mock field
  const session: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.create(connection, {
      vendor_id: vendor.id,
      model: "qwen3-coder-next",
      mock: {
        vendor: model,
        project,
      },
    });

  // Verify session was created with proper mock metadata
  TestValidator.predicate("id exists", () => session.id.length > 0);
  TestValidator.equals("title", session.title, `[Mock] ${project}`);
  TestValidator.equals(
    "model encodes vendor#project",
    session.model,
    `${model}#${project}`,
  );
  TestValidator.equals("vendor id", session.vendor.id, vendor.id);

  // Verify config-fallback defaults for mock sessions
  TestValidator.equals("locale", session.locale, "en-US");
  TestValidator.equals("timezone", session.timezone, "UTC");

  // Verify initial state
  TestValidator.equals("phase", session.phase, null);
  TestValidator.equals("completed_at", session.completed_at, null);
  TestValidator.equals("histories empty", session.histories.length, 0);
  TestValidator.equals("snapshots empty", session.snapshots.length, 0);
  TestValidator.equals(
    "token_usage aggregate total",
    session.token_usage.aggregate.total,
    0,
  );

  // Verify session is retrievable with full detail
  const read: IAutoBePlaygroundSession =
    await pApi.functional.autobe.playground.sessions.at(connection, session.id);
  TestValidator.equals("read.id", read.id, session.id);
  TestValidator.equals("read.title", read.title, session.title);
  TestValidator.equals("read.model", read.model, `${model}#${project}`);
  TestValidator.equals("read.locale", read.locale, "en-US");

  // Verify vendor is retrievable
  const mockVendor = await pApi.functional.autobe.playground.vendors.at(
    connection,
    session.vendor.id,
  );
  TestValidator.equals("vendor.id", mockVendor.id, vendor.id);
  TestValidator.equals("vendor.deleted_at", mockVendor.deleted_at, null);

  // Verify mock session appears in index
  const page = await pApi.functional.autobe.playground.sessions.index(
    connection,
    { limit: 100, page: 1 },
  );
  TestValidator.predicate("in page", () =>
    page.data.some((s) => s.id === session.id),
  );

  // Clean up
  await pApi.functional.autobe.playground.sessions.erase(
    connection,
    session.id,
  );
};
