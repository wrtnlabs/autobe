import { PrismaClient } from "@prisma/client";

import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonSetupWizard } from "../setup/AutoBeHackathonSetupWizard";

async function execute(
  database: string,
  username: string,
  password: string,
  script: string,
): Promise<void> {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://${username}:${password}@${AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_HOST}:${AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_PORT}/${database}`,
        },
      },
    });
    const queries: string[] = script
      .split("\n")
      .map((str) => str.trim())
      .filter((str) => !!str);
    for (const query of queries)
      try {
        await prisma.$queryRawUnsafe(query);
      } catch (e) {
        console.log(e);
      }
    await prisma.$disconnect();
  } catch (err) {
    console.log(err);
  }
}

async function main(): Promise<void> {
  const config = {
    database: AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_DATABASE,
    schema: AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_SCHEMA,
    username: AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_USERNAME,
    password: AutoBeHackathonConfiguration.env().HACKATHON_POSTGRES_PASSWORD,
  };
  const root = {
    account: process.argv[2] ?? "postgres",
    password: process.argv[3] ?? "root",
  };

  await execute(
    "postgres",
    root.account,
    root.password,
    `
      CREATE USER ${config.username} WITH ENCRYPTED PASSWORD '${config.password}';
      ALTER ROLE ${config.username} WITH CREATEDB
      CREATE DATABASE ${config.database} OWNER ${config.username};
    `,
  );

  await execute(
    config.database,
    root.account,
    root.password,
    `
      CREATE SCHEMA ${config.schema} AUTHORIZATION ${config.username};
    `,
  );

  await execute(
    config.database,
    root.account,
    root.password,
    `
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${config.schema} TO ${config.username};
    `,
  );

  console.log("------------------------------------------");
  console.log("CREATE TABLES");
  console.log("------------------------------------------");
  await AutoBeHackathonSetupWizard.schema();

  console.log("------------------------------------------");
  console.log("INITIAL DATA");
  console.log("------------------------------------------");
  await AutoBeHackathonSetupWizard.seed();
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
