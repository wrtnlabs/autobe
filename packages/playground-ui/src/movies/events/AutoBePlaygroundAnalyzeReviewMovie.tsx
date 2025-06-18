import { AutoBeAnalyzeReviewEvent } from "@autobe/interface/src/events/AutoBeAnalyzeReviewEvent";
import { Card, CardContent } from "@mui/material";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export function AutoBePlaygroundAnalyzeReviewMovie(props: {
  event: AutoBeAnalyzeReviewEvent;
}) {
  return (
    <ul>
      <li>
        <details>
          <summary>review</summary>
          <Card>
            <CardContent>
              <MarkdownViewer>{props.event.review}</MarkdownViewer>
            </CardContent>
          </Card>
        </details>
      </li>
    </ul>
  );
}
