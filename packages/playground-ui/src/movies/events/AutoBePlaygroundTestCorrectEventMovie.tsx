import { AutoBeTestCorrectEvent } from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";

export function AutoBePlaygroundTestCorrectEventMovie(
  props: AutoBePlaygroundTestCorrectEventMovie.IProps,
) {
  const openStackBlitz = () =>
    StackBlitzSDK.openProject(
      {
        files: Object.fromEntries([
          ["files.json", JSON.stringify(props.event.files, null, 2)],
          ["result.json", JSON.stringify(props.event.result, null, 2)],
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

  return (
    <Card
      elevation={3}
      style={{
        marginTop: 15,
        marginBottom: 15,
        marginRight: "15%",
      }}
    >
      <CardContent>
        <Chip
          icon={<ErrorOutlineIcon />}
          label={"Typescript Compilation Error"}
          variant="outlined"
          color="warning"
        />
        <br />
        <br />
        AI wrote invalid Typescript Code, so compilation error occurred.
        <br />
        <br />
        Trying to recover the compile error by studying the AI agent.
        <br />
        <br />
        Please wait for a while.
      </CardContent>
      <CardActions style={{ textAlign: "right" }}>
        <Button startIcon={<ExpandMoreIcon />} onClick={() => openStackBlitz()}>
          Open Correction Details
        </Button>
      </CardActions>
    </Card>
  );
}

export namespace AutoBePlaygroundTestCorrectEventMovie {
  export interface IProps {
    event: AutoBeTestCorrectEvent;
  }
}
