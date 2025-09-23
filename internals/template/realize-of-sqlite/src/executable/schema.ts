import { MyGlobal } from "../MyGlobal";
import { MySetupWizard } from "../setup/MySetupWizard";

const main = async (): Promise<void> => {
  MyGlobal.testing = true;
  await MySetupWizard.schema();
  await MySetupWizard.seed();
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
