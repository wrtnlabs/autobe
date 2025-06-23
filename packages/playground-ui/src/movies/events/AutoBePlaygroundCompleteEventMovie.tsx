import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeTestCompleteEvent,
  IAutoBeRpcService,
} from "@autobe/interface";
import DownloadIcon from "@mui/icons-material/Download";
import GradingIcon from "@mui/icons-material/Grading";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";
import JsZip from "jszip";
import { useEffect, useState } from "react";
import { VariadicSingleton } from "tstl";

export function AutoBePlaygroundCompleteEventMovie(
  props: AutoBePlaygroundCompleteEventMovie.IProps,
) {
  const [postgresFiles, setPostgresFiles] = useState<Record<string, string>>(
    {},
  );
  const [sqliteFiles, setSqliteFiles] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      setPostgresFiles(await props.service.getFiles());
      setSqliteFiles(
        await props.service.getFiles({
          dbms: "sqlite",
        }),
      );
    })().catch(() => {});
  }, []);

  const openStackBlitz = () => {
    StackBlitzSDK.openProject(
      {
        files: Object.fromEntries(
          Object.entries(sqliteFiles).filter(
            ([_, value]) =>
              new TextEncoder().encode(value).length < 2 * 1024 * 1024, // 2MB
          ),
        ),
        title: `AutoBE Generated Backend Server (${props.event.type})`,
        template: "node",
      },
      {
        newWindow: true,
      },
    );
  };

  const download = async () => {
    const zip: JsZip = new JsZip();
    const directory = new VariadicSingleton((location: string): JsZip => {
      const separated: string[] = location.split("/");
      if (separated.length === 1) return zip.folder(separated[0])!;
      const parent: JsZip = directory.get(separated.slice(0, -1).join("/"));
      return parent.folder(separated.at(-1)!)!;
    });
    for (const [file, content] of Object.entries(postgresFiles)) {
      const separated: string[] = file.split("/");
      if (separated.length === 1) zip.file(file, content);
      else {
        const folder: JsZip = directory.get(separated.slice(0, -1).join("/"));
        folder.file(separated.at(-1)!, content);
      }
    }
    const data: Blob = await zip.generateAsync({ type: "blob" });

    const url: string = URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = `AutoBE.${props.event.type}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <CardActions
        style={{
          textAlign: "right",
          justifyContent: "flex-end",
        }}
      >
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => {
            download().catch(console.error);
          }}
        >
          Download
        </Button>
        <Button startIcon={<OpenInNewIcon />} onClick={() => openStackBlitz()}>
          Open in StackBlitz
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
