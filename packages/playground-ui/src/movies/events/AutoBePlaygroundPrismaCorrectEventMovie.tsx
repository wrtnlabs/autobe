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
          ["reason.log", props.event.failure.reason],
          ["planning.md", props.event.planning],
          ...Object.entries(props.event.input).map(([k, v]) => [
            `input/${k}`,
            v,
          ]),
          ...Object.entries(props.event.correction).map(([k, v]) => [
            `correction/${k}`,
            v,
          ]),
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
