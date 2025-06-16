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
import { useEffect, useState } from "react";

export function AutoBePlaygroundCompleteEventMovie(
  props: AutoBePlaygroundCompleteEventMovie.IProps,
) {
  const [files, setFiles] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const files: Record<string, string> = await props.service.getFiles();
      setFiles(
        Object.fromEntries(
          Object.entries(files).filter(
            ([_, value]) =>
              new TextEncoder().encode(value).length < 2 * 1024 * 1024, // 2MB
          ),
        ),
      );
    })().catch(() => {});
  }, []);

  const openStackBlitz = () => {
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
  };

  const title: string | null = getTitle(props.event);
  if (title === null) return null;
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
        {getMessage(openStackBlitz, props.event)}
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
): string | null {
  switch (event.type) {
    case "analyzeComplete":
      return "Analyze";
    case "prismaComplete":
      if (event.compiled.type !== "success") return "Prisma (Error)";
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

const getMessage = (
  openStackBlitz: () => void,
  event: AutoBePlaygroundCompleteEventMovie.IProps["event"],
) => {
  if (event.type === "prismaComplete" && event.compiled.type === "failure") {
    return (
      <>
        <br />
        <br />
        Succeeded to compose <code>AutoBePrisma.IApplication</code> typed AST
        (Abstract Syntax Tree) data, but failed to generate Prisma schema files
        from it. This is a bug of <code>@autobe</code>. Please{" "}
        <a href="https://github.com/wrtnlabs/autobe/issues" target="_blank">
          write a bug report to our repository
        </a>{" "}
        with the
        <a href="#" onClick={() => openStackBlitz()}>
          <code>autobe/histories.json</code>
        </a>{" "}
        file.
      </>
    );
  }
  return null;
};
