import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { defineConfig, env } from "prisma/config";

dotenvExpand.expand(dotenv.config());

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: env("HACKATHON_POSTGRES_URL"),
  },
});
