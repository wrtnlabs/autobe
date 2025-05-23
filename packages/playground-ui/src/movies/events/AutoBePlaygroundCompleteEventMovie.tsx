import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
} from "@autobe/interface";
import GradingIcon from "@mui/icons-material/Grading";
import { Card, CardContent, Chip } from "@mui/material";

export function AutoBePlaygroundCompleteEventMovie(
  props: AutoBePlaygroundCompleteEventMovie.IProps,
) {
  const title: string = getTitle(props.event);
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
          icon={<GradingIcon />}
          label={title + " Completed"}
          variant="outlined"
          color="success"
        ></Chip>
        <br />
        <br />
        {getTitle(props.event)} has been completed.
        <br />
        <br />
        Please check the result in the file explorer.
      </CardContent>
    </Card>
  );
}
export namespace AutoBePlaygroundCompleteEventMovie {
  export interface IProps {
    event:
      | AutoBeAnalyzeCompleteEvent
      | AutoBePrismaCompleteEvent
      | AutoBeInterfaceCompleteEvent
      | AutoBeTestCompleteEvent
      | AutoBeRealizeCompleteEvent;
  }
}

function getTitle(
  event: AutoBePlaygroundCompleteEventMovie.IProps["event"],
): string {
  switch (event.type) {
    case "analyzeComplete":
      return "Analyze";
    case "prismaComplete":
      return "Prisma";
    case "interfaceComplete":
      return "Interface";
    case "testComplete":
      return "Test";
    case "realizeComplete":
      return "Realize";
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
