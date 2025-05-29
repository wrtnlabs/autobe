import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
  IAutoBeRpcService,
} from "@autobe/interface";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GradingIcon from "@mui/icons-material/Grading";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";

export function AutoBePlaygroundCompleteEventMovie(
  props: AutoBePlaygroundCompleteEventMovie.IProps,
) {
  const title: string = getTitle(props.event);
  const openStackBlitz = () => {
    props.service
      .getFiles()
      .then((files) => {
        StackBlitzSDK.openProject(
          {
            files,
            title: `AutoBE Generated Backend Server (${props.event.type})`,
            template: "node",
          },
          {
            newWindow: true,
          },
        );
      })
      .catch(() => {
        alert(
          "Failed to get files from the websocket server. Please leave an issue to the Github repo.",
        );
      });
  };

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
      <CardActions style={{ textAlign: "right" }}>
        <Button startIcon={<ExpandMoreIcon />} onClick={() => openStackBlitz()}>
          Open in new window
        </Button>
      </CardActions>
    </Card>
  );
}
export namespace AutoBePlaygroundCompleteEventMovie {
  export interface IProps {
    service: IAutoBeRpcService;
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
