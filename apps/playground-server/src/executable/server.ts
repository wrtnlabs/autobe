import { AutoBePlaygroundServer } from "../AutoBePlaygroundServer";

const main = async (): Promise<void> => {
  const server = new AutoBePlaygroundServer();
  await server.open();
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
