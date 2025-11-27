import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { defineConfig } from "prisma/config";

dotenvExpand.expand(dotenv.config());

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: "file:prisma/db.sqlite",
  },
});
