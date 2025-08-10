import {
  AutoBeAnalyzeCompleteEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeInterfaceCompleteEvent,
  AutoBePrismaCompleteEvent,
  AutoBeRealizeCompleteEvent,
  AutoBeRealizeTestCompleteEvent,
  AutoBeTestCompleteEvent,
  IAutoBeRpcService,
} from "@autobe/interface";
import { AutoBeRealizeAuthorizationCompleteEvent } from "@autobe/interface/src/events/AutoBeRealizeAuthorizationCompleteEvent";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import GradingIcon from "@mui/icons-material/Grading";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Button, Card, CardActions, CardContent, Chip } from "@mui/material";
import StackBlitzSDK from "@stackblitz/sdk";
import JsZip from "jszip";
import { useState } from "react";
import { Singleton, VariadicSingleton } from "tstl";

export function AutoBePlaygroundCompleteEventMovie(
  props: AutoBePlaygroundCompleteEventMovie.IProps,
) {
  const stage = getStage(props.event);
  const [postgres] = useState(
    new Singleton(async () => {
      setDownloading(true);
      try {
        const result: Record<string, string> = await props.service.getFiles({
          stage,
        });
        return result;
      } catch (error) {
        throw error;
      } finally {
        setDownloading(false);
      }
    }),
  );
  const [sqlite] = useState(
    new Singleton(async () => {
      setDownloading(true);
      try {
        const result: Record<string, string> = await props.service.getFiles({
          dbms: "sqlite",
          stage,
        });
        return result;
      } catch (error) {
        throw error;
      } finally {
        setDownloading(false);
      }
    }),
  );
  const [downloading, setDownloading] = useState(false);

  const openStackBlitz = async () => {
    StackBlitzSDK.openProject(
      {
        files: Object.fromEntries(
          Object.entries(await sqlite.get()).filter(
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

  const download = async (dbms: "postgres" | "sqlite") => {
    const zip: JsZip = new JsZip();
    const directory = new VariadicSingleton((location: string): JsZip => {
      const separated: string[] = location.split("/");
      if (separated.length === 1) return zip.folder(separated[0])!;
      const parent: JsZip = directory.get(separated.slice(0, -1).join("/"));
      return parent.folder(separated.at(-1)!)!;
    });
    for (const [file, content] of Object.entries(
      dbms === "postgres" ? await postgres.get() : await sqlite.get(),
    )) {
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
      elevation={1}
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
          color="default"
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
        {downloading === true ? (
          <Button startIcon={<DownloadingIcon />} disabled={true}>
            Downloading Source Codes...
          </Button>
        ) : props.event.type === "analyzeComplete" ? (
          <>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => download("sqlite").catch(console.error)}
            >
              Download
            </Button>
            <Button
              startIcon={<OpenInNewIcon />}
              onClick={() => openStackBlitz().catch(console.error)}
            >
              StackBlitz
            </Button>
          </>
        ) : (
          <>
            <Button
              startIcon={<CloudDownloadIcon />}
              onClick={() => download("postgres").catch(console.error)}
            >
              Zip (Postgres)
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => download("sqlite").catch(console.error)}
            >
              Zip (SQLite)
            </Button>
            <Button
              startIcon={<OpenInNewIcon />}
              onClick={() => openStackBlitz().catch(console.error)}
            >
              StackBlitz
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
export namespace AutoBePlaygroundCompleteEventMovie {
  export interface IProps {
    service: IAutoBeRpcService;
    event:
      | AutoBeAnalyzeCompleteEvent
      | AutoBeAnalyzeScenarioEvent
      | AutoBePrismaCompleteEvent
      | AutoBeInterfaceCompleteEvent
      | AutoBeTestCompleteEvent
      | AutoBeRealizeCompleteEvent
      | AutoBeRealizeAuthorizationCompleteEvent
      | AutoBeRealizeTestCompleteEvent;
  }
}

function getTitle(
  event: AutoBePlaygroundCompleteEventMovie.IProps["event"],
): string | null {
  switch (event.type) {
    case "analyzeScenario":
      return "Analyze Scenario";
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
    case "realizeAuthorizationComplete":
      return "Authorization";
    case "realizeTestComplete":
      return "Final E2E Test";
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}

const getMessage = (
  openStackBlitz: () => void,
  event: AutoBePlaygroundCompleteEventMovie.IProps["event"],
) => {
  if (event.type === "prismaComplete" && event.compiled.type === "failure")
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
  else if (
    (event.type === "testComplete" || event.type === "realizeComplete") &&
    event.compiled.type !== "success"
  )
    return (
      <>
        <br />
        <br />
        Succeeded to compose{" "}
        {event.type === "testComplete" ? "test functions" : "realize functions"}
        , but failed to pass the TypeScript compilation. This is a bug of{" "}
        <code>@autobe</code>. Please{" "}
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
  return null;
};

const getStage = (
  event: AutoBePlaygroundCompleteEventMovie.IProps["event"],
) => {
  if (event.type === "analyzeScenario") return "analyze";
  else if (event.type === "analyzeComplete") return "analyze";
  else if (event.type === "prismaComplete") return "prisma";
  else if (event.type === "interfaceComplete") return "interface";
  else if (event.type === "testComplete") return "test";
  else if (event.type === "realizeComplete") return "realize";
  else if (event.type === "realizeAuthorizationComplete") return "test";
  else if (event.type === "realizeTestComplete") return "test";
  else {
    event satisfies never;
    return undefined;
  }
};
