import { AutoBePlaygroundServer } from "../AutoBePlaygroundServer";

async function main(): Promise<void> {
  const server: AutoBePlaygroundServer = new AutoBePlaygroundServer();
  await server.open();

  process.send?.("ready");
  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
  process.on("uncaughtException", console.error);
  process.on("unhandledRejection", console.error);
}
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
