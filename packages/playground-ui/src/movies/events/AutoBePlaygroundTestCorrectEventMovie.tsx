import { AutoBeTestCorrectEvent } from "@autobe/interface";
import { Card } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";

export function AutoBePlaygroundTestCorrectEventMovie(
  props: AutoBePlaygroundTestCorrectEventMovie.IProps,
) {
  const openStackBlitz = () =>
    StackBlitzSDK.openProject(
      {
        files: Object.fromEntries([
          ["errors.json", JSON.stringify(props.event.files, null, 2)],
        ]),
        title: "AutoBE Test Compile Error Report Correction",
        description:
          "Report of Test Correct Event (Recovery from Compilation Error)",
        template: "node",
      },
      {
        newWindow: true,
      },
    );

  return <Card></Card>;
}

export namespace AutoBePlaygroundTestCorrectEventMovie {
  export interface IProps {
    event: AutoBeTestCorrectEvent;
  }
}
