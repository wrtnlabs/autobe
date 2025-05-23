import {
  AutoBeAnalyzeStartEvent,
  AutoBeInterfaceStartEvent,
  AutoBePrismaStartEvent,
  AutoBeRealizeStartEvent,
  AutoBeTestStartEvent,
} from "@autobe/interface";
import StartIcon from "@mui/icons-material/Start";
import { Card, CardContent, Chip } from "@mui/material";

export function AutoBePlaygroundStartEventMovie(
  props: AutoBePlaygroundStartEventMovie.IProps,
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
          icon={<StartIcon />}
          label={title + " Completed"}
          variant="outlined"
          color="warning"
        ></Chip>
        <br />
        <br />
        {getTitle(props.event)} has started.
      </CardContent>
    </Card>
  );
}
export namespace AutoBePlaygroundStartEventMovie {
  export interface IProps {
    event:
      | AutoBeAnalyzeStartEvent
      | AutoBePrismaStartEvent
      | AutoBeInterfaceStartEvent
      | AutoBeTestStartEvent
      | AutoBeRealizeStartEvent;
  }
}

function getTitle(
  event: AutoBePlaygroundStartEventMovie.IProps["event"],
): string {
  switch (event.type) {
    case "analyzeStart":
      return "Analyze";
    case "prismaStart":
      return "Prisma";
    case "interfaceStart":
      return "Interface";
    case "testStart":
      return "Test";
    case "realizeStart":
      return "Realize";
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
