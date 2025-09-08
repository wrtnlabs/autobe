import { AutoBeHackathonBackend } from "../AutoBeHackathonBackend";

async function main(): Promise<void> {
  // BACKEND SEVER LATER
  const backend: AutoBeHackathonBackend = new AutoBeHackathonBackend();
  await backend.open();

  // POST-PROCESS
  process.send?.("ready");
  process.on("SIGTERM", async () => {
    await backend.close();
    process.exit(0);
  });
  process.on("uncaughtException", console.error);
  process.on("unhandledRejection", console.error);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
