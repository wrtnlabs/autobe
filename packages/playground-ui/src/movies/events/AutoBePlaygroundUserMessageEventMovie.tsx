import { AutoBeUserMessageEvent } from "@autobe/interface";
import FaceIcon from "@mui/icons-material/Face";
import { Card, CardContent, Chip } from "@mui/material";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export function AutoBePlaygroundUserMessageEventMovie({
  prompt,
}: AutoBePlaygroundUserMessageEventMovie.IProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {prompt.contents.map((content, index) =>
        content.type === "text" ? (
          <Card
            key={index}
            elevation={3}
            style={{
              marginTop: 15,
              marginBottom: 15,
              marginLeft: "15%",
              textAlign: "right",
              backgroundColor: "lightyellow",
            }}
          >
            <CardContent>
              <Chip
                icon={<FaceIcon />}
                label="User"
                variant="outlined"
                color="primary"
              />
              <MarkdownViewer>{content.text}</MarkdownViewer>
            </CardContent>
          </Card>
        ) : // @todo handle other content types (multi modal)
        null,
      )}
    </div>
  );
}
export namespace AutoBePlaygroundUserMessageEventMovie {
  export interface IProps {
    prompt: AutoBeUserMessageEvent;
  }
}
