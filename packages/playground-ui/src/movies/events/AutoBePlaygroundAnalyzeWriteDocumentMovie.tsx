import { AutoBeAnalyzeWriteDocumentEvent } from "@autobe/interface/src/events/AutoBeAnalyzeWriteDocumentEvent";
import { Card, CardContent } from "@mui/material";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export function AutoBePlaygroundAnalyzeWriteDocumentMovie(props: {
  event: AutoBeAnalyzeWriteDocumentEvent;
}) {
  return (
    <ul>
      <li>
        <Files files={props.event.files} />
      </li>
    </ul>
  );
}

function Files(props: { files: Record<string, string> }) {
  return (
    <details>
      <summary>current files</summary>
      <p>
        {Object.entries(props.files).map(([_filename, content]) => {
          return (
            <Card>
              <CardContent>
                <MarkdownViewer>{content}</MarkdownViewer>
              </CardContent>
            </Card>
          );
        })}
      </p>
    </details>
  );
}
