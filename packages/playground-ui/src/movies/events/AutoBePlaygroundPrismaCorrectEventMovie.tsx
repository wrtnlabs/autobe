import { AutoBePrismaCorrectEvent } from "@autobe/interface";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";

export function AutoBePlaygroundPrismaCorrectEventMovie(
  props: AutoBePlaygroundPrismaCorrectEventMovie.IProps,
) {
  const openStackBlitz = () =>
    StackBlitzSDK.openProject(
      {
        files: Object.fromEntries([
          ["errors.json", JSON.stringify(props.event.failure.errors, null, 2)],
          ["planning.md", props.event.planning],
          ["input.json", JSON.stringify(props.event.failure.data, null, 2)],
          ["correction.json", JSON.stringify(props.event.correction, null, 2)],
        ]),
        title: "AutoBE Prisma Compile Error Correction",
        description:
          "Report of Prisma Correct Event (Recovery from Compilation Error)",
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
          label={"Prisma Compilation Error"}
          variant="outlined"
          color="warning"
        />
        <br />
        <br />
        AI wrote invalid Prisma schema, so compilation error occurred.
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
export namespace AutoBePlaygroundPrismaCorrectEventMovie {
  export interface IProps {
    event: AutoBePrismaCorrectEvent;
  }
}
