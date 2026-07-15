import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema",
  out: "./workers/lashpop-db/migrations",
  dialect: "sqlite",
})
