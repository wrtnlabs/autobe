import { MySetupWizard } from "../setup/MySetupWizard";

const main = async (): Promise<void> => {
  await MySetupWizard.schema();
  await MySetupWizard.seed();
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
